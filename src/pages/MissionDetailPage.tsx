import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Star, User, Trash2, Edit3 } from 'lucide-react';
import Header from '../components/layout/Header';
import { StatusBadge } from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import SuccessAnimation from '../components/animations/SuccessAnimation';
import { useAuthStore } from '../store/authStore';
import { useMissionStore } from '../store/missionStore';
import { usePointStore } from '../store/pointStore';
import { formatDate, formatDateTime, formatPoint, submissionTypeLabel } from '../utils/helpers';

export default function MissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, viewMode, getUser, updateUserPoint } = useAuthStore();
  const { getMission, getLatestSubmission, getReviewLogs, approveMission, rejectMission, deleteMission } = useMissionStore();
  const { addTransaction } = usePointStore();

  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [deleteModal, setDeleteModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const mission = getMission(id!);
  if (!mission || !currentUser) {
    return (
      <div className="page-container flex items-center justify-center">
        <p className="text-gray-500">미션을 찾을 수 없습니다.</p>
      </div>
    );
  }

  const isFacilitator = viewMode === 'FACILITATOR';
  const isAssignee = currentUser.id === mission.assigneeId;
  const isCreator = currentUser.id === mission.creatorId;
  const latestSubmission = getLatestSubmission(mission.id);
  const reviewLogs = getReviewLogs(mission.id);
  const assignee = getUser(mission.assigneeId);
  const creator = getUser(mission.creatorId);

  const canSubmit =
    !isFacilitator &&
    isAssignee &&
    (mission.status === 'IN_PROGRESS' || mission.status === 'REJECTED');

  const canReview =
    isFacilitator && isCreator && mission.status === 'REVIEWING';

  const handleApprove = () => {
    approveMission(mission.id, currentUser.id);

    const assigneeUser = getUser(mission.assigneeId);
    const creatorUser = getUser(mission.creatorId);

    updateUserPoint(mission.assigneeId, mission.rewardPoint);
    addTransaction(
      mission.assigneeId,
      mission.rewardPoint,
      'MISSION_REWARD',
      `미션 완료: ${mission.title}`
    );

    if (creatorUser && creatorUser.point >= mission.rewardPoint) {
      updateUserPoint(mission.creatorId, -mission.rewardPoint);
      addTransaction(
        mission.creatorId,
        -mission.rewardPoint,
        'MISSION_DEDUCT',
        `미션 포인트 지급: ${mission.title} → ${assigneeUser?.name}`
      );
    }

    setShowSuccess(true);
  };

  const handleReject = () => {
    if (!rejectReason.trim()) return;
    rejectMission(mission.id, currentUser.id, rejectReason);
    setRejectModal(false);
    setRejectReason('');
  };

  const handleDelete = () => {
    deleteMission(mission.id);
    navigate('/missions', { replace: true });
  };

  const REJECT_REASONS = [
    '사진이 흐립니다.',
    '제출 내용이 부족합니다.',
    '다시 제출해주세요.',
    '미션 내용과 다릅니다.',
  ];

  return (
    <div className="page-container">
      <Header
        title="미션 상세"
        showBack
        rightElement={
          isFacilitator && isCreator && mission.status === 'IN_PROGRESS' ? (
            <button
              onClick={() => setDeleteModal(true)}
              className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={16} />
            </button>
          ) : undefined
        }
      />

      <SuccessAnimation
        isVisible={showSuccess}
        points={mission.rewardPoint}
        onClose={() => setShowSuccess(false)}
      />

      <div className="content-area px-4 py-5 space-y-4">
        {/* 미션 정보 카드 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-sm p-5 space-y-4"
        >
          <div className="flex items-start justify-between gap-2">
            <h2 className="font-black text-gray-800 text-lg leading-snug flex-1">{mission.title}</h2>
            <StatusBadge status={mission.status} />
          </div>

          <p className="text-gray-600 text-sm leading-relaxed">{mission.description}</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-amber-50 rounded-2xl p-3">
              <p className="text-xs text-amber-600 font-semibold mb-1 flex items-center gap-1">
                <Star size={11} className="fill-amber-500 text-amber-500" /> 보상 포인트
              </p>
              <p className="font-black text-amber-700 text-xl">{formatPoint(mission.rewardPoint)}P</p>
            </div>
            <div className="bg-purple-50 rounded-2xl p-3">
              <p className="text-xs text-purple-600 font-semibold mb-1">제출 방식</p>
              <p className="font-bold text-purple-700 text-sm">{submissionTypeLabel[mission.submissionType]}</p>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <User size={14} className="text-gray-400" />
              <span className="text-gray-400">수행자:</span>
              <span className="font-semibold">{assignee?.avatar} {assignee?.name}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <User size={14} className="text-gray-400" />
              <span className="text-gray-400">진행자:</span>
              <span className="font-semibold">{creator?.avatar} {creator?.name}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar size={14} className="text-gray-400" />
              <span className="text-gray-400">기간:</span>
              <span className="font-semibold text-xs">
                {formatDate(mission.startDate)} ~ {formatDate(mission.endDate)}
              </span>
            </div>
          </div>
        </motion.div>

        {/* 수행자 제출 버튼 */}
        {canSubmit && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <Button
              fullWidth
              size="lg"
              variant={mission.status === 'REJECTED' ? 'danger' : 'primary'}
              onClick={() => navigate(`/missions/${mission.id}/submit`)}
            >
              {mission.status === 'REJECTED' ? '🔄 재제출하기' : '📤 미션 제출하기'}
            </Button>
          </motion.div>
        )}

        {/* 미션 확인중 상태 */}
        {!isFacilitator && mission.status === 'REVIEWING' && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
            <p className="text-2xl mb-1">⏳</p>
            <p className="text-amber-700 font-bold">검토 중입니다</p>
            <p className="text-amber-600 text-sm mt-0.5">진행자가 확인하고 있어요!</p>
          </div>
        )}

        {/* 진행자 검토 */}
        {canReview && latestSubmission && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl shadow-sm p-5 space-y-4"
          >
            <h3 className="font-bold text-gray-700 flex items-center gap-2">
              <Edit3 size={16} className="text-purple-500" /> 제출 내용
            </h3>

            {latestSubmission.imageUrl && (
              <div className="bg-gray-100 rounded-2xl aspect-video flex items-center justify-center overflow-hidden">
                <img
                  src={latestSubmission.imageUrl}
                  alt="제출 이미지"
                  className="w-full h-full object-cover rounded-2xl"
                />
              </div>
            )}
            {!latestSubmission.imageUrl && (
              <div className="bg-gray-50 rounded-2xl p-3 flex items-center justify-center h-24">
                <p className="text-gray-400 text-sm">📷 이미지 없음</p>
              </div>
            )}

            {latestSubmission.message && (
              <div className="bg-blue-50 rounded-2xl p-3">
                <p className="text-blue-700 text-sm leading-relaxed">"{latestSubmission.message}"</p>
              </div>
            )}

            <p className="text-xs text-gray-400">
              {formatDateTime(latestSubmission.submittedAt)} · {latestSubmission.attemptNumber}회차 제출
            </p>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="success" fullWidth onClick={handleApprove}>
                ✅ 승인
              </Button>
              <Button variant="danger" fullWidth onClick={() => setRejectModal(true)}>
                ❌ 반려
              </Button>
            </div>
          </motion.div>
        )}

        {/* 최신 제출 내용 (진행자 – 검토 외 상태) */}
        {isFacilitator && !canReview && latestSubmission && (
          <div className="bg-white rounded-3xl shadow-sm p-5 space-y-3">
            <h3 className="font-bold text-gray-700">📄 최근 제출 내용</h3>
            {latestSubmission.imageUrl && (
              <img src={latestSubmission.imageUrl} alt="제출 이미지" className="w-full rounded-2xl" />
            )}
            {latestSubmission.message && (
              <p className="text-gray-600 text-sm bg-gray-50 rounded-xl p-3">
                "{latestSubmission.message}"
              </p>
            )}
            <p className="text-xs text-gray-400">{formatDateTime(latestSubmission.submittedAt)}</p>
          </div>
        )}

        {/* 반려 로그 */}
        {reviewLogs.length > 0 && (
          <div className="bg-white rounded-3xl shadow-sm p-5 space-y-3">
            <h3 className="font-bold text-gray-700">📜 검토 내역</h3>
            <div className="space-y-3">
              {reviewLogs.map((log) => {
                const reviewer = getUser(log.reviewerId);
                return (
                  <div
                    key={log.id}
                    className={`rounded-2xl p-3 text-sm ${
                      log.action === 'APPROVED' ? 'bg-green-50' : 'bg-red-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-bold ${log.action === 'APPROVED' ? 'text-green-600' : 'text-red-600'}`}>
                        {log.action === 'APPROVED' ? '✅ 승인' : '❌ 반려'}
                      </span>
                      <span className="text-gray-400 text-xs">{formatDateTime(log.createdAt)}</span>
                    </div>
                    {log.reason && (
                      <p className="text-gray-600 text-xs">{reviewer?.name}: "{log.reason}"</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 반려 모달 */}
      <Modal isOpen={rejectModal} onClose={() => setRejectModal(false)} title="❌ 반려 사유">
        <div className="space-y-3">
          <p className="text-sm text-gray-500">빠른 선택:</p>
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
          <Button
            fullWidth
            variant="danger"
            onClick={handleReject}
            disabled={!rejectReason.trim()}
          >
            반려하기
          </Button>
        </div>
      </Modal>

      {/* 삭제 확인 모달 */}
      <Modal isOpen={deleteModal} onClose={() => setDeleteModal(false)} title="⚠️ 미션 삭제">
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">이 미션을 삭제하면 복구할 수 없습니다.</p>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={() => setDeleteModal(false)}>취소</Button>
            <Button variant="danger" onClick={handleDelete}>삭제</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
