import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, ChevronRight } from 'lucide-react';
import type { Mission } from '../../types';
import { StatusBadge } from '../ui/Badge';
import { getDaysLeft } from '../../utils/helpers';
import { useAuthStore } from '../../store/authStore';

interface MissionCardProps {
  mission: Mission;
  showAssignee?: boolean;
}

export default function MissionCard({ mission, showAssignee }: MissionCardProps) {
  const navigate = useNavigate();
  const { getUser } = useAuthStore();

  const daysLeft = getDaysLeft(mission.endDate);
  const assignee = getUser(mission.assigneeId);
  const creator = getUser(mission.creatorId);

  const statusColors: Record<string, string> = {
    IN_PROGRESS: 'border-l-blue-400',
    REVIEWING: 'border-l-amber-400',
    SUCCESS: 'border-l-green-400',
    REJECTED: 'border-l-red-400',
    FAILED: 'border-l-gray-300',
    EXPIRED: 'border-l-gray-200',
    PENDING: 'border-l-gray-300',
  };

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/missions/${mission.id}`)}
      className={`premium-row border-l-[3px] ${statusColors[mission.status] ?? 'border-l-gray-300'} cursor-pointer p-4 transition-colors active:bg-[#F3EFE9]`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <StatusBadge status={mission.status} />
            {showAssignee && assignee && (
              <span className="text-xs text-[#687282]">
                {assignee.name}
              </span>
            )}
          </div>
          <h3 className="font-bold text-gray-800 text-sm leading-snug mb-1 truncate">
            {mission.title}
          </h3>
          <p className="text-xs text-gray-500 line-clamp-2">{mission.description}</p>
        </div>
        <ChevronRight size={16} className="text-gray-300 flex-shrink-0 mt-1" />
      </div>

      <div className="flex items-center justify-end mt-3 pt-3 border-t border-gray-50">
        <div className="flex items-center gap-3 text-xs text-gray-400">
          {!showAssignee && creator && (
            <span>{creator.name}</span>
          )}
          {daysLeft > 0 && mission.status === 'IN_PROGRESS' && (
            <span className="flex items-center gap-0.5">
              <Clock size={11} />
              {daysLeft}일 남음
            </span>
          )}
          {daysLeft <= 0 && mission.status === 'IN_PROGRESS' && (
            <span className="text-red-400 font-semibold">만료됨</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
