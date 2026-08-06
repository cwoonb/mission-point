import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, ViewMode, PendingSocialProfile, SocialProvider, UserRole, StatusThresholds } from '../types';
import { authRedirectUrl, secureBackendEnabled, supabase } from '../lib/supabase';
import { isDemoUserId } from '../utils/demoMode';
import type { User as SupabaseAuthUser } from '@supabase/supabase-js';

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
  organizationId?: string;
}

// ── Supabase <-> App 모델 변환 ──────────────────────────────
interface UserRow {
  id: string;
  auth_user_id?: string | null;
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
  authUserId: row.auth_user_id ?? undefined,
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
  ...(u.authUserId ? { auth_user_id: u.authUserId } : {}),
  name: u.name,
  role: u.role,
  point: u.point,
  avatar: u.avatar,
  social_provider: u.socialProvider === 'EMAIL' ? null : u.socialProvider ?? null,
  social_id: u.socialId ?? null,
  email: u.email ?? null,
  profile_image: u.profileImage ?? null,
  facilitator_id: u.facilitatorId ?? null,
  group_id: u.groupId ?? null,
  code: u.code ?? null,
  status_thresholds: u.statusThresholds ?? null,
  created_at: u.createdAt,
});

const authProvider = (authUser: SupabaseAuthUser): SocialProvider => {
  const provider = String(authUser.app_metadata.provider ?? 'email').toUpperCase();
  return provider === 'GOOGLE' || provider === 'KAKAO' ? provider : 'EMAIL';
};

const authIdentityId = (authUser: SupabaseAuthUser) => {
  const provider = String(authUser.app_metadata.provider ?? 'email');
  const identity = authUser.identities?.find((item) => item.provider === provider) ?? authUser.identities?.[0];
  return identity?.identity_id ?? identity?.id ?? authUser.id;
};

const profileFromAuthUser = (authUser: SupabaseAuthUser, usedCodes: Set<string>): User => {
  const provider = authProvider(authUser);
  const metadata = authUser.user_metadata ?? {};
  const name = String(metadata.name ?? metadata.full_name ?? metadata.user_name ?? authUser.email?.split('@')[0] ?? '사용자');
  return {
    id: authUser.id,
    authUserId: secureBackendEnabled ? authUser.id : undefined,
    name,
    role: 'TEACHER',
    point: 0,
    avatar: provider === 'GOOGLE' ? 'G' : provider === 'KAKAO' ? 'K' : name.slice(0, 1),
    createdAt: authUser.created_at ?? new Date().toISOString(),
    code: genUserCode(usedCodes),
    socialProvider: provider,
    socialId: authIdentityId(authUser),
    email: authUser.email,
    profileImage: metadata.avatar_url ?? metadata.picture ?? metadata.profile_image_url,
  };
};

export interface EmailSignupResult {
  error?: string;
  confirmationRequired: boolean;
}

export const authErrorMessage = (message: string) => {
  const normalized = message.toLowerCase();
  if (normalized.includes('invalid login credentials')) return '이메일 또는 비밀번호가 올바르지 않습니다.';
  if (normalized.includes('email not confirmed')) return '이메일 인증을 완료한 뒤 로그인해 주세요.';
  if (normalized.includes('user already registered')) return '이미 가입된 이메일입니다.';
  if (normalized.includes('password should be')) return '비밀번호는 8자 이상 입력해 주세요.';
  if (
    normalized.includes('rate limit') ||
    normalized.includes('security purposes') ||
    /request this after \d+ seconds?/.test(normalized)
  ) {
    return '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.';
  }
  if (normalized.includes('provider is not enabled') || normalized.includes('unsupported provider')) return '소셜 로그인 설정을 확인하지 못했습니다. 관리자에게 문의해 주세요.';
  return message;
};

interface AuthState {
  currentUser: User | null;
  users: User[];
  viewMode: ViewMode;
  pendingSocialProfile: PendingSocialProfile | null;
  teacherNotes: Record<string, TeacherNote[]>;
  isDemoMode: boolean;
  authInitialized: boolean;

  initializeData: () => Promise<void>;
  loadVisibleUsers: (userIds: string[]) => Promise<void>;
  login: (userId: string) => void;
  logout: () => Promise<string | null>;
  switchViewMode: () => void;
  updateUserPoint: (userId: string, delta: number) => void;
  getUser: (userId: string) => User | undefined;

  updateUserGroup: (userId: string, groupId: string | undefined) => void;
  transferPoints: (fromUserId: string, toUserId: string, amount: number) => boolean;
  updateProfileImage: (userId: string, imageDataUrl: string) => void;
  updateUserName: (userId: string, name: string) => void;
  updateStatusThresholds: (userId: string, thresholds: StatusThresholds) => void;
  addTeacherNote: (studentId: string, text: string, organizationId?: string) => Promise<void>;
  deleteTeacherNote: (studentId: string, noteId: string) => Promise<void>;

  // Social login
  socialLogin: (profile: PendingSocialProfile) => Promise<'LOGIN' | 'REGISTER'>;
  completeSocialRegistration: (role: UserRole, facilitatorId?: string) => Promise<void>;
  clearPendingProfile: () => void;

  connectByCode: (code: string) => Promise<ConnectByCodeResult>;
  loginWithEmail: (email: string, password: string) => Promise<string | null>;
  signupWithEmail: (name: string, email: string, password: string) => Promise<EmailSignupResult>;
}

// users 테이블에 로컬 상태를 반영하는 헬퍼 (실패해도 로컬 상태는 이미 갱신된 상태로 둠)
const pushUserUpdate = (userId: string, patch: Record<string, unknown>) => {
  if (isDemoUserId(userId)) return;
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
      isDemoMode: false,
      authInitialized: false,

      initializeData: async () => {
        if (get().isDemoMode && get().currentUser && isDemoUserId(get().currentUser?.id)) {
          set({ authInitialized: true });
          return;
        }
        try {
          const { data: sessionData, error: sessionError } = typeof supabase.auth.getSession === 'function'
            ? await supabase.auth.getSession()
            : { data: { session: null }, error: null };
          if (sessionError) throw sessionError;
          const authUser = sessionData.session?.user ?? null;
          if (!authUser) {
            set({ currentUser: null, users: [], teacherNotes: {}, isDemoMode: false });
            return;
          }

          let query = supabase.from('users').select('*');
          if (secureBackendEnabled) query = query.eq('auth_user_id', authUser.id);
          let { data, error } = await query;
          if (error && secureBackendEnabled && (error.code === '42703' || error.code === 'PGRST204')) {
            const legacy = await supabase.from('users').select('*');
            data = legacy.data;
            error = legacy.error;
          }
          if (error) throw error;

          let nextUsers = ((data ?? []) as UserRow[]).map(rowToUser);
          let current = nextUsers.find((user) => secureBackendEnabled
            ? user.authUserId === authUser.id
            : user.id === authUser.id || (!!authUser.email && user.email?.toLowerCase() === authUser.email.toLowerCase()));

          if (!current) {
            const profile = profileFromAuthUser(authUser, new Set(nextUsers.flatMap((user) => user.code ? [user.code] : [])));
            const { data: createdRow, error: createError } = await supabase.from('users').insert(userToInsertRow(profile)).select('*').single();
            if (createError) {
              if (secureBackendEnabled && createError.code === '23505') {
                const retry = await supabase.from('users').select('*').eq('auth_user_id', authUser.id).maybeSingle();
                if (retry.error || !retry.data) throw retry.error ?? new Error('PROFILE_NOT_FOUND');
                current = rowToUser(retry.data as UserRow);
              } else {
                throw createError;
              }
            } else {
              current = rowToUser(createdRow as UserRow);
            }
            nextUsers = nextUsers.some((user)=>user.id===current!.id) ? nextUsers : [...nextUsers,current!];
          }

          const noteResult = secureBackendEnabled ? await supabase.from('teacher_notes').select('*') : { data: [] };
          const nextNotes: Record<string, TeacherNote[]> = {};
          for (const row of noteResult.data ?? []) {
            const studentId = row.student_id as string;
            (nextNotes[studentId] ??= []).push({ id: row.id, text: row.text, createdAt: row.created_at, organizationId: row.organization_id ?? undefined });
          }
          set({
            users: nextUsers,
            teacherNotes: nextNotes,
            currentUser: current,
            viewMode: current.role === 'CHILD' ? 'PERFORMER' : 'FACILITATOR',
            isDemoMode: false,
          });
        } catch (error) {
          console.error('Failed to restore authenticated profile:', error instanceof Error ? error.message : error);
          set({ currentUser: null, users: [], teacherNotes: {}, isDemoMode: false });
        } finally {
          set({ authInitialized: true });
        }
      },

      loadVisibleUsers: async (userIds) => {
        if (get().isDemoMode) return;
        const current = get().currentUser;
        if (!current) return;
        const ids = [...new Set([current.id, ...userIds])];
        const { data, error } = await supabase.from('users').select('*').in('id', ids);
        if (error) throw error;
        const visibleUsers = ((data ?? []) as UserRow[]).map(rowToUser);
        const databaseCurrent = visibleUsers.find((user) => user.id === current.id);
        const restoredCurrent = databaseCurrent ? { ...databaseCurrent, role: current.role, groupId: current.groupId } : current;
        const scopedUsers = visibleUsers.map((user) => user.id === current.id ? restoredCurrent : user);
        set({ users: scopedUsers.some((user) => user.id === current.id) ? scopedUsers : [restoredCurrent, ...scopedUsers], currentUser: restoredCurrent });
      },

      login: (userId) => {
        const user = get().users.find((u) => u.id === userId);
        if (user) {
          set({
            currentUser: user,
            viewMode: user.role === 'CHILD' ? 'PERFORMER' : 'FACILITATOR',
            isDemoMode: isDemoUserId(user.id),
          });
        }
      },

      logout: async () => {
        if (!get().isDemoMode) {
          const { error } = await supabase.auth.signOut();
          if (error) return error.message;
        }
        set({ currentUser: null, users: [], teacherNotes: {}, isDemoMode: false, viewMode: 'FACILITATOR', authInitialized: true });
        return null;
      },

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

      addTeacherNote: async (studentId, text, organizationId) => {
        const note: TeacherNote = { id: genId(), text: text.trim(), createdAt: new Date().toISOString(), organizationId };
        if (!get().isDemoMode) {
          if (!organizationId || !get().currentUser) throw new Error('소속 정보를 확인할 수 없습니다.');
          const { error } = await supabase.from('teacher_notes').insert({ id: note.id, student_id: studentId, author_id: get().currentUser!.id, organization_id: organizationId, text: note.text, created_at: note.createdAt });
          if (error) throw new Error(error.message);
        }
        set((s) => ({
          teacherNotes: {
            ...s.teacherNotes,
            [studentId]: [note, ...(s.teacherNotes[studentId] ?? [])],
          },
        }));
      },

      deleteTeacherNote: async (studentId, noteId) => {
        if (!get().isDemoMode) {
          const { error } = await supabase.from('teacher_notes').delete().eq('id', noteId);
          if (error) throw new Error(error.message);
        }
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

      loginWithEmail: async (email, password) => {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
        if (authError) return authErrorMessage(authError.message);
        set({ authInitialized: false });
        await get().initializeData();
        if (!get().currentUser) {
          await supabase.auth.signOut();
          return '계정 프로필을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
        }
        return null;
      },

      signupWithEmail: async (name, email, password) => {
        const normalizedEmail = email.trim().toLowerCase();
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: { name: name.trim() },
            emailRedirectTo: authRedirectUrl('/register'),
          },
        });
        if (error) return { error: authErrorMessage(error.message), confirmationRequired: false };
        if (!data.user) return { error: '계정을 만들지 못했습니다.', confirmationRequired: false };
        if (data.user.identities?.length === 0) return { error: '이미 가입된 이메일입니다. 로그인하거나 비밀번호를 재설정해 주세요.', confirmationRequired: false };
        if (!data.session) return { confirmationRequired: true };
        set({ authInitialized: false });
        await get().initializeData();
        if (!get().currentUser) return { error: '계정 프로필을 만들지 못했습니다.', confirmationRequired: false };
        return { confirmationRequired: false };
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
          id: pendingSocialProfile.socialProvider === 'EMAIL' ? pendingSocialProfile.socialId : genId(),
          authUserId: pendingSocialProfile.socialProvider === 'EMAIL' ? pendingSocialProfile.socialId : undefined,
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

        const request = pendingSocialProfile.socialProvider === 'EMAIL' && secureBackendEnabled
          ? supabase.from('users').update(userToInsertRow(newUser)).eq('id', newUser.id).select('*').single()
          : supabase.from('users').insert(userToInsertRow(newUser)).select('*').single();
        let { data, error } = await request;
        if (pendingSocialProfile.socialProvider === 'EMAIL' && error && ['42703', 'PGRST116', 'PGRST204'].includes(error.code)) {
          const legacyUser = { ...newUser, authUserId: undefined };
          const legacy = await supabase.from('users').insert(userToInsertRow(legacyUser)).select('*').single();
          data = legacy.data;
          error = legacy.error;
        }
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
    {
      name: 'mp-auth',
      partialize: (state) => state.isDemoMode ? {
        currentUser: state.currentUser,
        users: state.users,
        viewMode: state.viewMode,
        pendingSocialProfile: null,
        teacherNotes: state.teacherNotes,
        isDemoMode: true,
        authInitialized: true,
      } : {
        currentUser: null,
        users: [],
        viewMode: 'FACILITATOR' as ViewMode,
        pendingSocialProfile: null,
        teacherNotes: {},
        isDemoMode: false,
        authInitialized: false,
      },
    }
  )
);
