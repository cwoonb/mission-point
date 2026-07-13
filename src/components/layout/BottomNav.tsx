import { NavLink } from 'react-router-dom';
import {
  HeartHandshake,
  Home,
  Target,
  User,
  UsersRound,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '../../store/authStore';
import { useMissionStore } from '../../store/missionStore';

type NavTab = {
  to: string;
  icon: typeof Home;
  label: string;
  badge?: number;
};

export default function BottomNav() {
  const { viewMode, currentUser } = useAuthStore();
  const { missions } = useMissionStore();

  const pendingReviews = missions.filter(
    (m) => m.status === 'REVIEWING' && m.creatorId === currentUser?.id
  ).length;

  const performerTabs: NavTab[] = [
    { to: '/', icon: Home, label: '홈' },
    { to: '/missions', icon: Target, label: '미션' },
    { to: '/ranking', icon: HeartHandshake, label: '친구' },
    { to: '/profile', icon: User, label: '내 정보' },
  ];

  const facilitatorTabs: NavTab[] = [
    { to: '/', icon: Home, label: '홈' },
    { to: '/missions', icon: Target, label: '미션', badge: pendingReviews },
    { to: '/students', icon: UsersRound, label: '학생' },
    { to: '/profile', icon: User, label: '내 정보' },
  ];

  const tabs = viewMode === 'FACILITATOR' ? facilitatorTabs : performerTabs;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 mx-auto max-w-md border-t border-gray-100 bg-white shadow-lg"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="grid items-center py-2" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
        {tabs.map(({ to, icon: Icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex min-h-14 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1 transition-all duration-200 active:scale-90',
                isActive ? 'text-purple-600' : 'text-gray-400'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <div
                    className={clsx(
                      'flex h-9 w-9 items-center justify-center rounded-2xl transition-all duration-200',
                      isActive ? 'glossy bg-gradient-to-b from-purple-400 to-indigo-500 shadow-md' : ''
                    )}
                  >
                    <Icon
                      size={20}
                      strokeWidth={isActive ? 2.5 : 1.8}
                      className={isActive ? 'text-white' : 'text-gray-400'}
                    />
                  </div>
                  {badge != null && badge > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </div>
                <span className={clsx('truncate text-[10px] font-semibold', isActive ? 'text-purple-600' : 'text-gray-400')}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
