import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Eye } from 'lucide-react';
import Header from '../components/layout/Header';
import { StatusBadge } from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import SuccessAnimation from '../components/animations/SuccessAnimation';
import { useAuthStore } from '../store/authStore';
import { useMissionStore } from '../store/missionStore';
import { usePointStore } from '../store/pointStore';
import { formatPoint, formatDateTime } from '../utils/helpers';
import type { Mission } from '../types';

const REJECT_REASONS = [
  '사진이 흐립니다.',
  '제출 내용이 부족합니다.',
  '다시 제출해주세요.',
  '미션 내용과 다릅니다.',
  '증거가 충분하지 않습니다.',
];

export default function ApprovalPage() {
  const navigate = useNavigate();
  const { currentUser, getUser, updateUserPoint } = useAuthStore();
  const { missions, getLatestSubmission, approveMission, rejectMission } = useMissionStore();
  const { addTransaction } = usePointStore();

  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successPoints, setSuccessPoints] = useState(0);

  if (!currentUser) return null;

  const pendingMissions = missions.filter(
    (m) => m.status === 'REVIEWING' && m.creatorId === currentUser.id
  );

  const handleApprove = (mission: Mission) => {
    approveMission(mission.id, currentUser.id);

    updateUserPoint(mission.assigneeId, mission.rewardPoint);
    addTransaction(mission.assigneeId, mission.rewardPoint, 'MISSION_REWARD', `미션 완료: ${mission.title}`);

    const creatorUser = getUser(mission.creatorId);
    if (creatorUser && creatorUser.point >= mission.rewardPoint) {
      updateUserPoint(mission.creatorId, -mission.rewardPoint);
      addTransaction(mission.creatorId, -mission.rewardPoint, 'MISSION_DEDUCT', `포인트 지급: ${mission.title}`);
    }

    setSuccessPoints(mission.rewardPoint);
    setShowSuccess(true);
    setSelectedMission(null);
  };

  const openReject = (mission: Mission) => {
    setSelectedMission(mission);
    setRejectReason('');
    setRejectModal(true);
  };

  const handleReject = () => {
    if (!selectedMission || !rejectReason.trim()) return;
    rejectMission(selectedMission.id, currentUser.id, rejectReason);
    setRejectModal(false);
    setSelectedMission(null);
    setRejectReason('');
  };

  return (
    <div className="page-container">
      <Header title="📋 승인 관리" />
      <SuccessAnimation
        isVisible={showSuccess}
        points={successPoints}
        onClose={() => setShowSuccess(false)}
      />

      <div className="content-area px-4 py-5">
        {pendingMissions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 gap-4"
          >
            <div className="text-6xl">✅</div>
            <p className="text-gray-500 font-semibold text-lg">검토할 미션이 없어요!</p>
            <p className="text-gray-400 text-sm">모든 미션을 검토했습니다.</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 font-semibold">
              {pendingMissions.length}개의 미션이 검토를 기다리고 있어요
            </p>
            {pendingMissions.map((mission, i) => {
              const submission = getLatestSubmission(mission.id);
              const assignee = getUser(mission.assigneeId);

              return (
                <motion.div
                  key={mission.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="bg-white rounded-3xl shadow-sm overflow-hidden"
                >
                  {/* 헤더 */}
                  <div className="p-4 border-b border-gray-50">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <StatusBadge status={mission.status} />
                          <span className="text-xs text-gray-500">
                            {assignee?.avatar} {assignee?.name}
                          </span>
                        </div>
                        <h3 className="font-bold text-gray-800">{mission.title}</h3>
                      </div>
                      <div className="text-right">
                        <span className="text-amber-600 font-black text-sm">+{formatPoint(mission.rewardPoint)}P</span>
                      </div>
                    </div>
                  </div>

                  {/* 제출 내용 */}
                  {submission && (
                    <div className="p-4 space-y-3">
                      {submission.imageUrl && (
                        <img
                          src={submission.imageUrl}
                          alt="제출 이미지"
                          className="w-full rounded-2xl object-cover max-h-48"
                        />
                      )}
                      {!submission.imageUrl && (
                        <div className="bg-gray-50 rounded-xl p-3 text-center">
                          <p className="text-gray-400 text-xs">📷 이미지 없음</p>
                        </div>
                      )}
                      {submission.message && (
                        <div className="bg-blue-50 rounded-xl p-3">
                          <p className="text-blue-700 text-sm">"{submission.message}"</p>
                        </div>
                      )}
                      <p className="text-xs text-gray-400">
                        {formatDateTime(submission.submittedAt)} · {submission.attemptNumber}회차
                      </p>
                    </div>
                  )}

                  {/* 액션 버튼 */}
                  <div className="px-4 pb-4 grid grid-cols-3 gap-2">
                    <button
                      onClick={() => navigate(`/missions/${mission.id}`)}
                      className="flex items-center justify-center gap-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold"
                    >
                      <Eye size={14} /> 상세
                    </button>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleApprove(mission)}
                      className="flex items-center gap-1"
                    >
                      <CheckCircle2 size={14} /> 승인
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => openReject(mission)}
                      className="flex items-center gap-1"
                    >
                      <XCircle size={14} /> 반려
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* 반려 모달 */}
      <Modal isOpen={rejectModal} onClose={() => setRejectModal(false)} title="❌ 반려 사유">
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-700">
            "{selectedMission?.title}" 반려
          </p>
          <div className="flex flex-wrap gap-2">
            {REJECT_REASONS.map((r) => (
              <button
                key={r}
                onClick={() => setRejectReason(r)}
                className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${
                  rejectReason === r
                    ? 'bg-red-100 border-red-400 text-red-700 font-semibold'
                    : 'bg-gray-50 border-gray-200 text-gray-600'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="반려 사유를 입력하세요..."
            rows={3}
            className="input-field"
          />
          <Button fullWidth variant="danger" onClick={handleReject} disabled={!rejectReason.trim()}>
            반려하기
          </Button>
        </div>
      </Modal>
    </div>
  );
}
