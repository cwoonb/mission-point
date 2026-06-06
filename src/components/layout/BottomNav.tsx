import { NavLink } from 'react-router-dom';
import { Home, Target, ShoppingBag, User, ClipboardCheck } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useMissionStore } from '../../store/missionStore';
import { clsx } from 'clsx';

export default function BottomNav() {
  const { viewMode } = useAuthStore();
  const { missions } = useMissionStore();

  const pendingReviews = missions.filter((m) => m.status === 'REVIEWING').length;

  const tabs = [
    { to: '/', icon: Home, label: '홈' },
    { to: '/missions', icon: Target, label: '미션' },
    ...(viewMode === 'FACILITATOR'
      ? [{ to: '/approvals', icon: ClipboardCheck, label: '승인', badge: pendingReviews }]
      : []),
    { to: '/shop', icon: ShoppingBag, label: '상점' },
    { to: '/profile', icon: User, label: '내 정보' },
  ];

  return (
    /* left-0 right-0 mx-auto 방식으로 iOS 안전 */
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 shadow-lg z-40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around py-2">
        {tabs.map(({ to, icon: Icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200 min-w-0',
                isActive ? 'text-purple-600' : 'text-gray-400'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2.5 : 1.8}
                    className={isActive ? 'text-purple-600' : 'text-gray-400'}
                  />
                  {badge != null && badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </div>
                <span className={clsx('text-[10px] font-semibold truncate', isActive ? 'text-purple-600' : 'text-gray-400')}>
                  {label}
                </span>
                {isActive && <span className="w-1 h-1 bg-purple-500 rounded-full" />}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
