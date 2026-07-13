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
        'inline-flex items-center px-2 py-1 rounded-[7px] text-[11px] font-semibold',
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
  purple: 'bg-[#E9EDF2] text-[#14233B]',
  amber: 'bg-[#F7EEDF] text-[#9A642E]',
  green: 'bg-[#E9F3EC] text-[#3E7555]',
  red: 'bg-[#F8EAE8] text-[#A2504C]',
  blue: 'bg-[#EAF0F5] text-[#4E6483]',
  gray: 'bg-[#F1EDE7] text-[#687282]',
};

export function Badge({ color = 'gray', children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-1 rounded-[7px] text-[11px] font-semibold',
        badgeColors[color],
        className
      )}
    >
      {children}
    </span>
  );
}
