import { clsx } from 'clsx';
import type { MissionStatus } from '../../types';
import { statusLabel, statusBgColor } from '../../utils/helpers';

interface StatusBadgeProps {
  status: MissionStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold',
        statusBgColor[status],
        className
      )}
    >
      {statusLabel[status]}
    </span>
  );
}

interface BadgeProps {
  color?: 'purple' | 'amber' | 'green' | 'red' | 'blue' | 'gray';
  children: React.ReactNode;
  className?: string;
}

const badgeColors = {
  purple: 'bg-purple-100 text-purple-700',
  amber: 'bg-amber-100 text-amber-700',
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-600',
  blue: 'bg-blue-100 text-blue-700',
  gray: 'bg-gray-100 text-gray-600',
};

export function Badge({ color = 'gray', children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
        badgeColors[color],
        className
      )}
    >
      {children}
    </span>
  );
}
