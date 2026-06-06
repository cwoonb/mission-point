import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Star, ChevronRight } from 'lucide-react';
import type { Mission } from '../../types';
import { StatusBadge } from '../ui/Badge';
import { formatPoint, getDaysLeft } from '../../utils/helpers';
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
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 border-l-4 ${statusColors[mission.status] ?? 'border-l-gray-300'} p-4 cursor-pointer active:bg-gray-50 transition-colors`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <StatusBadge status={mission.status} />
            {showAssignee && assignee && (
              <span className="text-xs text-gray-500">
                {assignee.avatar} {assignee.name}
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

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
        <div className="flex items-center gap-1">
          <Star size={13} className="text-amber-400 fill-amber-400" />
          <span className="text-amber-600 font-bold text-sm">
            {formatPoint(mission.rewardPoint)}P
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          {!showAssignee && creator && (
            <span>{creator.avatar} {creator.name}</span>
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
