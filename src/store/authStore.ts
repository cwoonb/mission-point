import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, ViewMode, PendingSocialProfile, SocialProvider, UserRole } from '../types';
import { initialUsers } from '../data/mockData';

const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

interface AuthState {
  currentUser: User | null;
  users: User[];
  viewMode: ViewMode;
  pendingSocialProfile: PendingSocialProfile | null;

  initializeData: () => void;
  login: (userId: string) => void;
  logout: () => void;
  switchViewMode: () => void;
  updateUserPoint: (userId: string, delta: number) => void;
  getUser: (userId: string) => User | undefined;

  // Social login
  socialLogin: (profile: PendingSocialProfile) => 'LOGIN' | 'REGISTER';
  completeSocialRegistration: (role: UserRole) => void;
  clearPendingProfile: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: [],
      viewMode: 'FACILITATOR',
      pendingSocialProfile: null,

      initializeData: () => {
        if (get().users.length === 0) {
          set({ users: initialUsers });
        }
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
          return { users, currentUser };
        });
      },

      getUser: (userId) => get().users.find((u) => u.id === userId),

      socialLogin: (profile) => {
        const { users } = get();
        const existing = users.find(
          (u) =>
            u.socialProvider === profile.socialProvider && u.socialId === profile.socialId
        );

        if (existing) {
          set({
            currentUser: existing,
            viewMode: existing.role === 'CHILD' ? 'PERFORMER' : 'FACILITATOR',
          });
          return 'LOGIN';
        }

        set({ pendingSocialProfile: profile });
        return 'REGISTER';
      },

      completeSocialRegistration: (role) => {
        const { pendingSocialProfile, users } = get();
        if (!pendingSocialProfile) return;

        const ROLE_AVATARS: Record<UserRole, string> = {
          PARENT: '👨‍👩‍👧‍👦',
          TEACHER: '👩‍🏫',
          CHILD: '🧒',
        };
        const PROVIDER_INIT_POINTS: Record<SocialProvider, number> = {
          GOOGLE: 0,
          KAKAO: 0,
          NAVER: 0,
        };

        const newUser: User = {
          id: genId(),
          name: pendingSocialProfile.name,
          role,
          point: PROVIDER_INIT_POINTS[pendingSocialProfile.socialProvider],
          avatar: ROLE_AVATARS[role],
          createdAt: new Date().toISOString(),
          socialProvider: pendingSocialProfile.socialProvider,
          socialId: pendingSocialProfile.socialId,
          email: pendingSocialProfile.email,
          profileImage: pendingSocialProfile.profileImage,
        };

        // Facilitators get starter points
        if (role === 'PARENT' || role === 'TEACHER') {
          newUser.point = 10000;
        }

        set({
          users: [...users, newUser],
          currentUser: newUser,
          viewMode: role === 'CHILD' ? 'PERFORMER' : 'FACILITATOR',
          pendingSocialProfile: null,
        });
      },

      clearPendingProfile: () => set({ pendingSocialProfile: null }),
    }),
    { name: 'mp-auth' }
  )
);
