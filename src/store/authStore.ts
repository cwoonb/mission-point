import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, ViewMode, PendingSocialProfile, SocialProvider, UserRole, StatusThresholds } from '../types';
import { initialUsers, initialGroups } from '../data/mockData';
import { supabase } from '../lib/supabase';

const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

// 사람이 읽기 쉬운 6자리 사용자 코드 (혼동되는 0/O/1/I 제외)
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const genUserCode = (used: Set<string>) => {
  let code: string;
  do {
    code = Array.from({ length: 6 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
  } while (used.has(code));
  used.add(code);
  return code;
};

const isFacilitatorRole = (role: UserRole) => role === 'PARENT' || role === 'TEACHER';

export type ConnectByCodeResult = 'OK' | 'NOT_FOUND' | 'SELF' | 'INVALID_ROLE' | 'ALREADY_LINKED';

export interface TeacherNote {
  id: string;
  text: string;
  createdAt: string;
}

// ── Supabase <-> App 모델 변환 ──────────────────────────────
interface UserRow {
  id: string;
  name: string;
  role: UserRole;
  point: number;
  avatar: string;
  social_provider: SocialProvider | null;
  social_id: string | null;
  email: string | null;
  profile_image: string | null;
  facilitator_id: string | null;
  group_id: string | null;
  code: string | null;
  status_thresholds: StatusThresholds | null;
  created_at: string;
}

const rowToUser = (row: UserRow): User => ({
  id: row.id,
  name: row.name,
  role: row.role,
  point: row.point,
  avatar: row.avatar,
  createdAt: row.created_at,
  socialProvider: row.social_provider ?? undefined,
  socialId: row.social_id ?? undefined,
  email: row.email ?? undefined,
  profileImage: row.profile_image ?? undefined,
  facilitatorId: row.facilitator_id ?? undefined,
  groupId: row.group_id ?? undefined,
  code: row.code ?? undefined,
  statusThresholds: row.status_thresholds ?? undefined,
});

const userToInsertRow = (u: User) => ({
  id: u.id,
  name: u.name,
  role: u.role,
  point: u.point,
  avatar: u.avatar,
  social_provider: u.socialProvider ?? null,
  social_id: u.socialId ?? null,
  email: u.email ?? null,
  profile_image: u.profileImage ?? null,
  facilitator_id: u.facilitatorId ?? null,
  group_id: u.groupId ?? null,
  code: u.code ?? null,
  status_thresholds: u.statusThresholds ?? null,
  created_at: u.createdAt,
});

interface AuthState {
  currentUser: User | null;
  users: User[];
  viewMode: ViewMode;
  pendingSocialProfile: PendingSocialProfile | null;
  teacherNotes: Record<string, TeacherNote[]>;

  initializeData: () => Promise<void>;
  login: (userId: string) => void;
  logout: () => void;
  switchViewMode: () => void;
  updateUserPoint: (userId: string, delta: number) => void;
  getUser: (userId: string) => User | undefined;

  updateUserGroup: (userId: string, groupId: string | undefined) => void;
  transferPoints: (fromUserId: string, toUserId: string, amount: number) => boolean;
  updateProfileImage: (userId: string, imageDataUrl: string) => void;
  updateUserName: (userId: string, name: string) => void;
  updateStatusThresholds: (userId: string, thresholds: StatusThresholds) => void;
  addTeacherNote: (studentId: string, text: string) => void;
  deleteTeacherNote: (studentId: string, noteId: string) => void;

  // Social login
  socialLogin: (profile: PendingSocialProfile) => Promise<'LOGIN' | 'REGISTER'>;
  completeSocialRegistration: (role: UserRole, facilitatorId?: string) => Promise<void>;
  clearPendingProfile: () => void;

  connectByCode: (code: string) => Promise<ConnectByCodeResult>;
}

// users 테이블에 로컬 상태를 반영하는 헬퍼 (실패해도 로컬 상태는 이미 갱신된 상태로 둠)
const pushUserUpdate = (userId: string, patch: Record<string, unknown>) => {
  supabase.from('users').update(patch).eq('id', userId).then(({ error }) => {
    if (error) console.error('Supabase user update failed:', error.message);
  });
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: [],
      viewMode: 'FACILITATOR',
      pendingSocialProfile: null,
      teacherNotes: {},

      initializeData: async () => {
        const { data, error } = await supabase.from('users').select('*');
        if (error) {
          console.error('Failed to load users from Supabase:', error.message);
          return;
        }

        let rows = (data ?? []) as UserRow[];

        if (rows.length === 0) {
          // 최초 1회: 데모 계정을 Supabase에 시드
          // (users.group_id <-> performer_groups.facilitator_id 가 서로 참조하므로
          //  1) group_id 없이 사용자 생성 → 2) 그룹 생성 → 3) group_id 채우기 순서로 진행)
          const usedCodes = new Set<string>();
          const seeded = initialUsers.map((u) => ({ ...u, code: u.code ?? genUserCode(usedCodes) }));
          const { data: inserted, error: insertError } = await supabase
            .from('users')
            .insert(seeded.map((u) => userToInsertRow({ ...u, groupId: undefined })))
            .select('*');
          if (insertError) {
            if (insertError.code === '23505') {
              // 동시에 다른 클라이언트가 이미 시드를 완료한 경우 — 그 결과를 그대로 사용
              const { data: refetched, error: refetchError } = await supabase.from('users').select('*');
              if (refetchError) {
                console.error('Failed to reload users after seed conflict:', refetchError.message);
                return;
              }
              set((s) => {
                const nextUsers = (refetched ?? []).map(rowToUser);
                return {
                  users: nextUsers,
                  currentUser: s.currentUser ? nextUsers.find((u) => u.id === s.currentUser!.id) ?? s.currentUser : s.currentUser,
                };
              });
              return;
            }
            console.error('Failed to seed users in Supabase:', insertError.message);
            return;
          }
          rows = (inserted ?? []) as UserRow[];

          const { error: groupError } = await supabase.from('performer_groups').insert(
            initialGroups.map((g) => ({
              id: g.id,
              name: g.name,
              emoji: g.emoji,
              facilitator_id: g.facilitatorId,
              created_at: g.createdAt,
            }))
          );
          if (groupError) {
            console.error('Failed to seed groups in Supabase:', groupError.message);
          } else {
            for (const u of seeded) {
              if (!u.groupId) continue;
              const { error: gidError } = await supabase.from('users').update({ group_id: u.groupId }).eq('id', u.id);
              if (gidError) console.error('Failed to backfill group_id:', gidError.message);
            }
            const { data: refetched } = await supabase.from('users').select('*');
            if (refetched) rows = refetched as UserRow[];
          }
        }

        const nextUsers = rows.map(rowToUser);

        // 레거시 계정 마이그레이션: Supabase 도입 전에 소셜 로그인으로 생성되어
        // 로컬에만 존재하던 계정을 발견하면 그대로 Supabase에 등록한다.
        // (facilitatorId/groupId는 상대측 레코드가 아직 없을 수 있으므로 제외하고 등록)
        const legacyCurrent = get().currentUser;
        if (legacyCurrent?.socialProvider && !nextUsers.some((u) => u.id === legacyCurrent.id)) {
          const usedCodes = new Set(nextUsers.filter((u) => u.code).map((u) => u.code!));
          const code = legacyCurrent.code && !usedCodes.has(legacyCurrent.code) ? legacyCurrent.code : genUserCode(usedCodes);
          const { data: migratedRow, error: migrateError } = await supabase
            .from('users')
            .insert(userToInsertRow({ ...legacyCurrent, code, facilitatorId: undefined, groupId: undefined }))
            .select('*')
            .maybeSingle();
          if (migrateError) {
            console.error('Failed to migrate legacy account to Supabase:', migrateError.message);
          } else if (migratedRow) {
            const migrated = rowToUser(migratedRow as UserRow);
            const merged = [...nextUsers, migrated];
            set({ users: merged, currentUser: migrated });
            return;
          }
        }

        set((s) => ({
          users: nextUsers,
          currentUser: s.currentUser ? nextUsers.find((u) => u.id === s.currentUser!.id) ?? s.currentUser : s.currentUser,
        }));
      },

      login: (userId) => {
        const user = get().users.find((u) => u.id === userId);
        if (user) {
          set({
            currentUser: user,
            viewMode: user.role === 'CHILD' ? 'PERFORMER' : 'FACILITATOR',
          });
        }
      },

      logout: () => set({ currentUser: null }),

      switchViewMode: () => {
        const { viewMode, currentUser } = get();
        if (currentUser?.role === 'CHILD') return;
        set({ viewMode: viewMode === 'FACILITATOR' ? 'PERFORMER' : 'FACILITATOR' });
      },

      updateUserPoint: (userId, delta) => {
        set((state) => {
          const users = state.users.map((u) =>
            u.id === userId ? { ...u, point: Math.max(0, u.point + delta) } : u
          );
          const currentUser =
            state.currentUser?.id === userId
              ? users.find((u) => u.id === userId) ?? state.currentUser
              : state.currentUser;
          const updatedUser = users.find((u) => u.id === userId);
          if (updatedUser) pushUserUpdate(userId, { point: updatedUser.point });
          return { users, currentUser };
        });
      },

      getUser: (userId) => get().users.find((u) => u.id === userId),

      updateUserGroup: (userId, groupId) => {
        set((s) => {
          const users = s.users.map((u) => u.id === userId ? { ...u, groupId } : u);
          return { users };
        });
        pushUserUpdate(userId, { group_id: groupId ?? null });
      },

      addTeacherNote: (studentId, text) => {
        const note: TeacherNote = { id: genId(), text: text.trim(), createdAt: new Date().toISOString() };
        set((s) => ({
          teacherNotes: {
            ...s.teacherNotes,
            [studentId]: [note, ...(s.teacherNotes[studentId] ?? [])],
          },
        }));
      },

      deleteTeacherNote: (studentId, noteId) => {
        set((s) => ({
          teacherNotes: {
            ...s.teacherNotes,
            [studentId]: (s.teacherNotes[studentId] ?? []).filter((n) => n.id !== noteId),
          },
        }));
      },

      updateProfileImage: (userId, imageDataUrl) => {
        set((s) => {
          const users = s.users.map((u) =>
            u.id === userId ? { ...u, profileImage: imageDataUrl } : u
          );
          const currentUser =
            s.currentUser?.id === userId
              ? users.find((u) => u.id === userId) ?? s.currentUser
              : s.currentUser;
          return { users, currentUser };
        });
        pushUserUpdate(userId, { profile_image: imageDataUrl });
      },

      updateStatusThresholds: (userId, thresholds) => {
        set((s) => {
          const users = s.users.map((u) => u.id === userId ? { ...u, statusThresholds: thresholds } : u);
          const currentUser = s.currentUser?.id === userId
            ? users.find((u) => u.id === userId) ?? s.currentUser
            : s.currentUser;
          return { users, currentUser };
        });
        pushUserUpdate(userId, { status_thresholds: thresholds });
      },

      updateUserName: (userId, name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        set((s) => {
          const users = s.users.map((u) => u.id === userId ? { ...u, name: trimmed } : u);
          const currentUser = s.currentUser?.id === userId
            ? users.find((u) => u.id === userId) ?? s.currentUser
            : s.currentUser;
          return { users, currentUser };
        });
        pushUserUpdate(userId, { name: trimmed });
      },

      transferPoints: (fromUserId, toUserId, amount) => {
        const from = get().users.find((u) => u.id === fromUserId);
        if (!from || from.point < amount || amount <= 0) return false;
        set((s) => {
          const users = s.users.map((u) => {
            if (u.id === fromUserId) return { ...u, point: u.point - amount };
            if (u.id === toUserId) return { ...u, point: u.point + amount };
            return u;
          });
          const currentUser =
            s.currentUser?.id === fromUserId
              ? users.find((u) => u.id === fromUserId) ?? s.currentUser
              : s.currentUser;
          const updatedFrom = users.find((u) => u.id === fromUserId);
          const updatedTo = users.find((u) => u.id === toUserId);
          if (updatedFrom) pushUserUpdate(fromUserId, { point: updatedFrom.point });
          if (updatedTo) pushUserUpdate(toUserId, { point: updatedTo.point });
          return { users, currentUser };
        });
        return true;
      },

      socialLogin: async (profile) => {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('social_provider', profile.socialProvider)
          .eq('social_id', profile.socialId)
          .maybeSingle();

        if (error) {
          console.error('socialLogin lookup failed:', error.message);
        }

        if (data) {
          let user = rowToUser(data as UserRow);

          // 대기 중인 초대가 있고, 아직 리더와 연결되지 않은 실천자라면 연결 처리
          const pendingFacilitatorId = sessionStorage.getItem('pending_invite_id');
          if (pendingFacilitatorId && user.role === 'CHILD' && !user.facilitatorId) {
            sessionStorage.removeItem('pending_invite_id');
            user = { ...user, facilitatorId: pendingFacilitatorId };
            pushUserUpdate(user.id, { facilitator_id: pendingFacilitatorId });
          }

          set((s) => ({
            users: s.users.some((u) => u.id === user.id)
              ? s.users.map((u) => u.id === user.id ? user : u)
              : [...s.users, user],
            currentUser: user,
            viewMode: user.role === 'CHILD' ? 'PERFORMER' : 'FACILITATOR',
          }));
          return 'LOGIN';
        }

        set({ pendingSocialProfile: profile });
        return 'REGISTER';
      },

      completeSocialRegistration: async (role, facilitatorId) => {
        const { pendingSocialProfile, users } = get();
        if (!pendingSocialProfile) return;

        const ROLE_AVATARS: Record<UserRole, string> = {
          PARENT: '👨‍👩‍👧‍👦',
          TEACHER: '👩‍🏫',
          CHILD: '🧒',
        };

        const newUser: User = {
          id: genId(),
          name: pendingSocialProfile.name,
          role,
          point: role === 'CHILD' ? 0 : 10000,
          avatar: ROLE_AVATARS[role],
          createdAt: new Date().toISOString(),
          code: genUserCode(new Set(users.filter((u) => u.code).map((u) => u.code!))),
          socialProvider: pendingSocialProfile.socialProvider,
          socialId: pendingSocialProfile.socialId,
          email: pendingSocialProfile.email,
          profileImage: pendingSocialProfile.profileImage,
          ...(role === 'CHILD' && facilitatorId ? { facilitatorId } : {}),
        };

        const { data, error } = await supabase.from('users').insert(userToInsertRow(newUser)).select('*').single();
        if (error) {
          console.error('Failed to register user in Supabase:', error.message);
          return;
        }
        const created = rowToUser(data as UserRow);

        sessionStorage.removeItem('pending_invite_id');

        set((s) => ({
          users: [...s.users, created],
          currentUser: created,
          viewMode: created.role === 'CHILD' ? 'PERFORMER' : 'FACILITATOR',
          pendingSocialProfile: null,
        }));
      },

      clearPendingProfile: () => set({ pendingSocialProfile: null }),

      connectByCode: async (code) => {
        const { currentUser } = get();
        if (!currentUser) return 'NOT_FOUND';
        const trimmed = code.trim().toUpperCase();

        const { data, error } = await supabase.from('users').select('*').eq('code', trimmed).maybeSingle();
        if (error) console.error('connectByCode lookup failed:', error.message);
        if (!data) return 'NOT_FOUND';

        const target = rowToUser(data as UserRow);
        if (target.id === currentUser.id) return 'SELF';

        if (currentUser.role === 'CHILD' && isFacilitatorRole(target.role)) {
          if (currentUser.facilitatorId === target.id) return 'ALREADY_LINKED';
          const { error: updateError } = await supabase
            .from('users')
            .update({ facilitator_id: target.id })
            .eq('id', currentUser.id);
          if (updateError) {
            console.error('connectByCode update failed:', updateError.message);
            return 'NOT_FOUND';
          }
          set((s) => {
            const nextUsers = s.users.map((u) => u.id === currentUser.id ? { ...u, facilitatorId: target.id } : u);
            return { users: nextUsers, currentUser: nextUsers.find((u) => u.id === currentUser.id) ?? s.currentUser };
          });
          return 'OK';
        }

        if (isFacilitatorRole(currentUser.role) && target.role === 'CHILD') {
          if (target.facilitatorId === currentUser.id) return 'ALREADY_LINKED';
          const { error: updateError } = await supabase
            .from('users')
            .update({ facilitator_id: currentUser.id })
            .eq('id', target.id);
          if (updateError) {
            console.error('connectByCode update failed:', updateError.message);
            return 'NOT_FOUND';
          }
          set((s) => ({
            users: s.users.some((u) => u.id === target.id)
              ? s.users.map((u) => u.id === target.id ? { ...u, facilitatorId: currentUser.id } : u)
              : [...s.users, { ...target, facilitatorId: currentUser.id }],
          }));
          return 'OK';
        }

        return 'INVALID_ROLE';
      },
    }),
    { name: 'mp-auth' }
  )
);
