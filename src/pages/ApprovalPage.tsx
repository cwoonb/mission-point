import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, MessageSquare, Eye, TrendingUp, AlertCircle, Calendar, Star, X } from 'lucide-react';
import Header from '../components/layout/Header';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import SuccessAnimation from '../components/animations/SuccessAnimation';
import { StatusBadge } from '../components/ui/Badge';
import { useAuthStore } from '../store/authStore';
import { useMissionStore } from '../store/missionStore';
import { usePointStore } from '../store/pointStore';
import { formatPoint, formatDate, formatDateTime, submissionTypeLabel } from '../utils/helpers';
import { getWeeklyRate, getUnsubmittedCount, getCompletionRate, statusConfig, getStudentStatus, defaultStatusThresholds } from '../utils/studentStats';
import { missionTypeLabel } from '../utils/studentStats';
import type { Mission } from '../types';

const REJECT_REASONS = [
  '사진이 흐립니다.',
  '제출 내용이 부족합니다.',
  '다시 제출해주세요.',
  '미션 내용과 다릅니다.',
  '증거가 충분하지 않습니다.',
];

const COMMENT_TEMPLATES = [
  '잘했어요! 계속 이 페이스로 해봐요 👍',
  '조금 더 자세하게 작성해주면 좋겠어요.',
  '꾸준히 참여하고 있어 기특해요 🌟',
  '이번 주도 열심히 했네요! 좋아요.',
  '다음엔 더 빨리 제출해봐요!',
];

export default function ApprovalPage() {
  const navigate = useNavigate();
  const { currentUser, getUser, updateUserPoint, users } = useAuthStore();
  const { missions, getLatestSubmission, approveMission, rejectMission } = useMissionStore();
  const { addTransaction } = usePointStore();

  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [detailMission, setDetailMission] = useState<Mission | null>(null);
  const [rejectModal, setRejectModal] = useState(false);
  const [commentModal, setCommentModal] = useState(false);
  const [parentShareModal, setParentShareModal] = useState(false);
  const [parentShareMission, setParentShareMission] = useState<Mission | null>(null);
  const [parentShareMsg, setParentShareMsg] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [comment, setComment] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successPoints, setSuccessPoints] = useState(0);
  const [sharedStudentId, setSharedStudentId] = useState<string | null>(null);

  if (!currentUser) return null;

  const thresholds = currentUser.statusThresholds ?? defaultStatusThresholds;
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
    setDetailMission(null);
  };

  const openReject = (mission: Mission) => {
    setSelectedMission(mission);
    setRejectReason('');
    setRejectModal(true);
  };

  const openComment = (mission: Mission) => {
    setSelectedMission(mission);
    setComment('');
    setCommentModal(true);
  };

  const handleReject = () => {
    if (!selectedMission || !rejectReason.trim()) return;
    rejectMission(selectedMission.id, currentUser.id, rejectReason);
    setRejectModal(false);
    setSelectedMission(null);
    setDetailMission(null);
  };

  const openParentShare = (mission: Mission) => {
    const student = getUser(mission.assigneeId);
    const weekRate = student ? getWeeklyRate(missions, student.id) : 0;
    const unsubmitted = student ? getUnsubmittedCount(missions, student.id) : 0;
    setParentShareMission(mission);
    setParentShareMsg(
      weekRate >= 70
        ? `꾸준히 미션을 수행하고 있어 매우 기특합니다. 앞으로도 이 페이스를 유지해봐요!`
        : unsubmitted > 0
        ? `미제출 미션이 ${unsubmitted}건 있습니다. 가정에서도 함께 확인해 주시면 감사하겠습니다.`
        : `이번 미션을 잘 완료했습니다. 지속적인 관심 부탁드립니다.`
    );
    setParentShareModal(true);
  };

  const handleShareToParent = async () => {
    if (!parentShareMission || !currentUser) return;
    const student = getUser(parentShareMission.assigneeId);
    const text = `[미션 알림] ${student?.name ?? ''} 학생\n\n미션: ${parentShareMission.title}\n\n선생님 의견:\n${parentShareMsg}\n\n— ${currentUser.name} 선생님`;
    if (typeof navigator.share === 'function') {
      try { await navigator.share({ title: `${student?.name} 미션 알림`, text }); } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      alert('클립보드에 복사됐어요!');
    }
    setSharedStudentId(parentShareMission.assigneeId);
    setTimeout(() => setSharedStudentId(null), 2000);
    setParentShareModal(false);
    setParentShareMission(null);
  };

  return (
    <div className="page-container">
      <Header title="📋 학생 행동 검토" />
      <SuccessAnimation isVisible={showSuccess} points={successPoints} onClose={() => setShowSuccess(false)} />

      <div className="content-area px-4 py-5">
        {pendingMissions.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="text-6xl">✅</div>
            <p className="text-gray-700 font-bold text-lg">모든 미션을 검토했어요!</p>
            <p className="text-gray-400 text-sm">검토할 제출물이 없습니다.</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 font-semibold">{pendingMissions.length}건 검토 대기 중</p>
              <span className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full">오래된 것부터 검토해주세요</span>
            </div>

            {pendingMissions.map((mission, i) => {
              const submission = getLatestSubmission(mission.id);
              const assignee = getUser(mission.assigneeId);
              const weekRate = assignee ? getWeeklyRate(missions, assignee.id) : 0;
              const unsubmitted = assignee ? getUnsubmittedCount(missions, assignee.id) : 0;
              const overallRate = assignee ? getCompletionRate(missions, assignee.id) : 0;
              const status = assignee ? getStudentStatus(missions, assignee.id, thresholds) : 'CAUTION';
              const sc = statusConfig[status];

              return (
                <motion.div key={mission.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }} className="bg-white rounded-3xl shadow-sm overflow-hidden">

                  {/* 학생 정보 헤더 */}
                  <div className="bg-slate-50 px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <button onClick={() => navigate(`/students/${mission.assigneeId}`)}
                        className="flex items-center gap-2">
                        <div className="w-9 h-9 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl overflow-hidden flex items-center justify-center text-lg">
                          {assignee?.profileImage
                            ? <img src={assignee.profileImage} alt="" className="w-full h-full object-cover" />
                            : assignee?.avatar}
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-black text-gray-800">{assignee?.name}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>{sc.label}</span>
                          </div>
                          <p className="text-[11px] text-gray-400">학생 리포트 보기 →</p>
                        </div>
                      </button>
                      <div className="text-right">
                        <p className="text-[11px] text-gray-400">이번주 수행률</p>
                        <p className={`text-sm font-black ${weekRate >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>{weekRate}%</p>
                      </div>
                    </div>

                    {/* 학생 간단 통계 */}
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1">
                        <TrendingUp size={11} className="text-indigo-400" />
                        <span className="text-[11px] text-gray-500">전체 수행률 {overallRate}%</span>
                      </div>
                      {unsubmitted > 0 && (
                        <div className="flex items-center gap-1">
                          <AlertCircle size={11} className="text-red-400" />
                          <span className="text-[11px] text-red-500">미제출 {unsubmitted}건</span>
                        </div>
                      )}
                      {mission.missionType && (
                        <span className="text-[11px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded-md font-semibold">
                          {missionTypeLabel[mission.missionType] ?? mission.missionType}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 미션 정보 */}
                  <div className="p-4 border-b border-gray-50">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800 text-sm">{mission.title}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{mission.description}</p>
                      </div>
                      <span className="text-amber-600 font-black text-sm flex-shrink-0">+{formatPoint(mission.rewardPoint)}P</span>
                    </div>
                  </div>

                  {/* 제출 내용 */}
                  {submission && (
                    <div className="p-4 space-y-3">
                      {submission.imageUrl ? (
                        <img src={submission.imageUrl} alt="제출 이미지" className="w-full rounded-2xl object-cover max-h-48" />
                      ) : (
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
                        {formatDateTime(submission.submittedAt)} · {submission.attemptNumber}회차 제출
                      </p>
                    </div>
                  )}

                  {/* 액션 버튼 */}
                  <div className="px-4 pb-4 space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <button onClick={() => setDetailMission(mission)}
                        className="flex items-center justify-center gap-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-xs font-semibold">
                        <Eye size={13} /> 상세
                      </button>
                      <Button variant="success" size="sm" onClick={() => handleApprove(mission)}
                        className="flex items-center gap-1 text-xs">
                        <CheckCircle2 size={13} /> 승인
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => openReject(mission)}
                        className="flex items-center gap-1 text-xs">
                        <XCircle size={13} /> 반려
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => openComment(mission)}
                        className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-indigo-50 text-indigo-600 text-xs font-semibold">
                        <MessageSquare size={12} /> 코멘트 남기기
                      </button>
                      <button
                        onClick={() => openParentShare(mission)}
                        className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${sharedStudentId === mission.assigneeId ? 'bg-green-100 text-green-700' : 'bg-emerald-50 text-emerald-600'}`}>
                        {sharedStudentId === mission.assigneeId ? '✅ 공유됨' : '📤 학부모 공유'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* 미션 상세 바텀 시트 */}
      <AnimatePresence>
        {detailMission && (() => {
          const dm = detailMission;
          const dmSubmission = getLatestSubmission(dm.id);
          const dmAssignee = getUser(dm.assigneeId);
          const dmCreator = getUser(dm.creatorId);
          const dmLogs = useMissionStore.getState().getReviewLogs(dm.id);
          return (
            <motion.div key="detail-sheet"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
              onClick={() => setDetailMission(null)}>
              <motion.div
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto">
                {/* 핸들 + 헤더 */}
                <div className="sticky top-0 bg-white rounded-t-3xl pt-3 pb-2 px-5 border-b border-gray-100 z-10">
                  <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
                  <div className="flex items-center justify-between">
                    <h2 className="font-black text-gray-800 text-base">미션 상세</h2>
                    <button onClick={() => setDetailMission(null)} className="p-1.5 rounded-xl bg-gray-100">
                      <X size={16} className="text-gray-500" />
                    </button>
                  </div>
                </div>

                <div className="px-5 py-4 space-y-4 pb-8">
                  {/* 제목 + 상태 */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-black text-gray-800 text-lg leading-snug flex-1">{dm.title}</h3>
                    <StatusBadge status={dm.status} />
                  </div>
                  {dm.description && <p className="text-gray-500 text-sm leading-relaxed">{dm.description}</p>}

                  {/* 보상 + 제출방식 */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-amber-50 rounded-2xl p-3">
                      <p className="text-xs text-amber-600 font-semibold mb-1 flex items-center gap-1">
                        <Star size={11} className="fill-amber-500 text-amber-500" /> 보상 포인트
                      </p>
                      <p className="font-black text-amber-700 text-xl">{formatPoint(dm.rewardPoint)}P</p>
                    </div>
                    <div className="bg-purple-50 rounded-2xl p-3">
                      <p className="text-xs text-purple-600 font-semibold mb-1">제출 방식</p>
                      <p className="font-bold text-purple-700 text-sm">{submissionTypeLabel[dm.submissionType]}</p>
                    </div>
                  </div>

                  {/* 수행자 / 기간 */}
                  <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="text-gray-400 text-xs w-14">수행자</span>
                      <span className="font-semibold">{dmAssignee?.avatar} {dmAssignee?.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="text-gray-400 text-xs w-14">진행자</span>
                      <span className="font-semibold">{dmCreator?.avatar} {dmCreator?.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar size={13} className="text-gray-400" />
                      <span className="font-semibold text-xs">{formatDate(dm.startDate)} ~ {formatDate(dm.endDate)}</span>
                    </div>
                    {dm.missionType && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-xs w-14">유형</span>
                        <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-full">
                          {missionTypeLabel[dm.missionType] ?? dm.missionType}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 제출 내용 */}
                  {dmSubmission && (
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-gray-500">📤 제출 내용</p>
                      {dmSubmission.imageUrl ? (
                        <img src={dmSubmission.imageUrl} alt="제출 이미지"
                          className="w-full rounded-2xl object-cover max-h-52" />
                      ) : (
                        <div className="bg-gray-50 rounded-xl h-16 flex items-center justify-center">
                          <p className="text-gray-400 text-xs">📷 이미지 없음</p>
                        </div>
                      )}
                      {dmSubmission.message && (
                        <div className="bg-blue-50 rounded-xl p-3">
                          <p className="text-blue-700 text-sm">"{dmSubmission.message}"</p>
                        </div>
                      )}
                      <p className="text-xs text-gray-400">
                        {formatDateTime(dmSubmission.submittedAt)} · {dmSubmission.attemptNumber}회차
                      </p>
                    </div>
                  )}

                  {/* 검토 내역 */}
                  {dmLogs.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-gray-500">📜 검토 내역</p>
                      {dmLogs.map((log) => (
                        <div key={log.id}
                          className={`rounded-2xl p-3 text-sm ${log.action === 'APPROVED' ? 'bg-green-50' : 'bg-red-50'}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className={`font-bold ${log.action === 'APPROVED' ? 'text-green-600' : 'text-red-600'}`}>
                              {log.action === 'APPROVED' ? '✅ 승인' : '❌ 반려'}
                            </span>
                            <span className="text-gray-400 text-xs">{formatDateTime(log.createdAt)}</span>
                          </div>
                          {log.reason && <p className="text-gray-600 text-xs">{log.reason}</p>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 검토 액션 버튼 */}
                  {dm.status === 'REVIEWING' && (
                    <div className="space-y-2 pt-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="success" fullWidth onClick={() => handleApprove(dm)}>
                          <CheckCircle2 size={15} className="mr-1" /> 승인
                        </Button>
                        <Button variant="danger" fullWidth onClick={() => openReject(dm)}>
                          <XCircle size={15} className="mr-1" /> 반려
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => openComment(dm)}
                          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-indigo-50 text-indigo-600 text-sm font-semibold">
                          <MessageSquare size={14} /> 코멘트
                        </button>
                        <button onClick={() => { setDetailMission(null); openParentShare(dm); }}
                          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${sharedStudentId === dm.assigneeId ? 'bg-green-100 text-green-700' : 'bg-emerald-50 text-emerald-600'}`}>
                          {sharedStudentId === dm.assigneeId ? '✅ 공유됨' : '📤 학부모 공유'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* 반려 모달 */}
      <Modal isOpen={rejectModal} onClose={() => setRejectModal(false)} title="❌ 반려 사유">
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-700">"{selectedMission?.title}" 반려</p>
          <div className="flex flex-wrap gap-2">
            {REJECT_REASONS.map((r) => (
              <button key={r} onClick={() => setRejectReason(r)}
                className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${rejectReason === r ? 'bg-red-100 border-red-400 text-red-700 font-semibold' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                {r}
              </button>
            ))}
          </div>
          <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
            placeholder="반려 사유를 입력하세요..." rows={3} className="input-field" />
          <Button fullWidth variant="danger" onClick={handleReject} disabled={!rejectReason.trim()}>반려하기</Button>
        </div>
      </Modal>

      {/* 학부모 공유 모달 */}
      <Modal isOpen={parentShareModal} onClose={() => setParentShareModal(false)} title="📤 학부모 공유">
        {parentShareMission && (() => {
          const student = getUser(parentShareMission.assigneeId);
          const weekRate = student ? getWeeklyRate(missions, student.id) : 0;
          const unsubmitted = student ? getUnsubmittedCount(missions, student.id) : 0;
          return (
            <div className="space-y-4">
              {/* 학생 요약 */}
              <div className="bg-slate-50 rounded-2xl p-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                  {student?.profileImage
                    ? <img src={student.profileImage} alt="" className="w-full h-full object-cover rounded-xl" />
                    : student?.avatar}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-800 text-sm">{student?.name} 학생</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[11px] text-gray-400">이번 주 {weekRate}%</span>
                    {unsubmitted > 0 && <span className="text-[11px] text-red-500">미제출 {unsubmitted}건</span>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-400">미션</p>
                  <p className="text-xs font-bold text-gray-600 max-w-24 truncate">{parentShareMission.title}</p>
                </div>
              </div>

              {/* 선생님 의견 */}
              <div>
                <p className="text-xs font-bold text-gray-500 mb-2">선생님 의견 <span className="text-red-400">*</span></p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[
                    '잘 따라오고 있어요 👍',
                    '조금 더 독려가 필요합니다.',
                    '꾸준히 성장하고 있어요 🌱',
                    '가정에서도 확인 부탁드려요.',
                  ].map((t) => (
                    <button key={t} onClick={() => setParentShareMsg(t)}
                      className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${parentShareMsg === t ? 'bg-emerald-100 border-emerald-400 text-emerald-700 font-semibold' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                      {t}
                    </button>
                  ))}
                </div>
                <textarea
                  value={parentShareMsg}
                  onChange={(e) => setParentShareMsg(e.target.value)}
                  placeholder="학부모에게 전달할 의견을 입력하세요..."
                  rows={4}
                  className="input-field resize-none"
                  maxLength={300}
                />
                <p className="text-xs text-gray-400 text-right mt-1">{parentShareMsg.length}/300</p>
              </div>

              {/* 미리보기 */}
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3">
                <p className="text-[10px] font-bold text-emerald-600 mb-1.5">📋 전송 미리보기</p>
                <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
                  {`[미션 알림] ${student?.name ?? ''} 학생\n\n미션: ${parentShareMission.title}\n\n선생님 의견:\n${parentShareMsg || '(의견을 입력해주세요)'}\n\n— ${currentUser?.name} 선생님`}
                </p>
              </div>

              <Button fullWidth variant="primary" onClick={handleShareToParent} disabled={!parentShareMsg.trim()}>
                📤 학부모에게 공유하기
              </Button>
            </div>
          );
        })()}
      </Modal>

      {/* 코멘트 모달 */}
      <Modal isOpen={commentModal} onClose={() => setCommentModal(false)} title="💬 코멘트 남기기">
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            <strong>{users.find((u) => u.id === selectedMission?.assigneeId)?.name}</strong> 학생에게 코멘트를 남겨주세요.
          </p>
          <div className="flex flex-wrap gap-2">
            {COMMENT_TEMPLATES.map((t) => (
              <button key={t} onClick={() => setComment(t)}
                className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${comment === t ? 'bg-indigo-100 border-indigo-400 text-indigo-700 font-semibold' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                {t}
              </button>
            ))}
          </div>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)}
            placeholder="직접 입력하세요..." rows={3} className="input-field" />
          <Button fullWidth onClick={() => { setCommentModal(false); setComment(''); }} disabled={!comment.trim()}>
            코멘트 저장
          </Button>
        </div>
      </Modal>
    </div>
  );
}
