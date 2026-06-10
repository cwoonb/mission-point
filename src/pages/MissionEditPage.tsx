import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Star, Users, FileText } from 'lucide-react';
import Header from '../components/layout/Header';
import Button from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';
import { useMissionStore } from '../store/missionStore';
import type { SubmissionType } from '../types';

const SUBMISSION_TYPES: Array<{ key: SubmissionType; label: string; emoji: string; desc: string }> = [
  { key: 'IMAGE', label: '이미지', emoji: '📷', desc: '사진으로 제출' },
  { key: 'TEXT', label: '텍스트', emoji: '✍️', desc: '글로 제출' },
  { key: 'BOTH', label: '둘 다', emoji: '📎', desc: '이미지 + 텍스트' },
];

const PRESET_POINTS = [30, 50, 80, 100, 150, 200];

export default function MissionEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, users } = useAuthStore();
  const { getMission, updateMission } = useMissionStore();

  const mission = getMission(id!);

  if (!mission || !currentUser) {
    return (
      <div className="page-container flex items-center justify-center">
        <p className="text-gray-500">미션을 찾을 수 없습니다.</p>
      </div>
    );
  }

  const [title, setTitle] = useState(mission.title);
  const [description, setDescription] = useState(mission.description);
  const [rewardPoint, setRewardPoint] = useState(mission.rewardPoint);
  const [assigneeId, setAssigneeId] = useState(mission.assigneeId);
  const [submissionType, setSubmissionType] = useState<SubmissionType>(mission.submissionType);
  const [startDate, setStartDate] = useState(mission.startDate.split('T')[0]);
  const [endDate, setEndDate] = useState(mission.endDate.split('T')[0]);
  const [loading, setLoading] = useState(false);

  const children = users.filter((u) => u.role === 'CHILD');
  const isValid = title.trim() && description.trim() && assigneeId && rewardPoint > 0 && startDate && endDate;

  const handleSubmit = () => {
    if (!isValid) return;
    setLoading(true);
    setTimeout(() => {
      updateMission(mission.id, {
        title: title.trim(),
        description: description.trim(),
        rewardPoint,
        assigneeId,
        submissionType,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
      });
      navigate(`/missions/${mission.id}`, { replace: true });
    }, 400);
  };

  return (
    <div className="page-container">
      <Header title="✏️ 미션 수정" showBack showPoints={false} />

      <div className="content-area px-4 py-5 space-y-5">
        {/* 제목 + 설명 */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-sm p-5 space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1.5 block">
              📝 미션 제목 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 수학 숙제 완료하기 📐"
              className="input-field"
              maxLength={50}
            />
            <p className="text-xs text-gray-400 text-right mt-1">{title.length}/50</p>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 mb-1.5 block">
              📋 미션 설명 <span className="text-red-400">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="미션에 대한 자세한 설명을 입력하세요..."
              rows={3}
              className="input-field resize-none"
              maxLength={200}
            />
            <p className="text-xs text-gray-400 text-right">{description.length}/200</p>
          </div>
        </motion.div>

        {/* 실천자 선택 */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white rounded-3xl shadow-sm p-5">
          <label className="text-xs font-bold text-gray-500 mb-3 flex items-center gap-1">
            <Users size={13} /> 실천자 <span className="text-red-400">*</span>
          </label>
          {children.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">등록된 실천자가 없습니다.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => setAssigneeId(child.id)}
                  className={`flex items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                    assigneeId === child.id
                      ? 'border-purple-400 bg-purple-50'
                      : 'border-gray-100 bg-gray-50'
                  }`}
                >
                  <span className="text-2xl">{child.avatar}</span>
                  <div className="text-left">
                    <p className={`text-sm font-bold ${assigneeId === child.id ? 'text-purple-700' : 'text-gray-700'}`}>
                      {child.name}
                    </p>
                    <p className="text-xs text-amber-500 font-semibold">{child.point.toLocaleString()}P</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* 보상 포인트 */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-3xl shadow-sm p-5">
          <label className="text-xs font-bold text-gray-500 mb-3 flex items-center gap-1">
            <Star size={13} className="text-amber-500" /> 보상 포인트
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {PRESET_POINTS.map((p) => (
              <button
                key={p}
                onClick={() => setRewardPoint(p)}
                className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-all ${
                  rewardPoint === p
                    ? 'bg-amber-400 text-white shadow-md'
                    : 'bg-amber-50 text-amber-600'
                }`}
              >
                {p}P
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={rewardPoint}
              onChange={(e) => setRewardPoint(Math.max(1, parseInt(e.target.value) || 0))}
              className="input-field"
              min={1}
              max={99999}
            />
            <span className="text-amber-600 font-bold">P</span>
          </div>
          {currentUser && rewardPoint > currentUser.point && (
            <p className="text-red-400 text-xs mt-1">⚠️ 현재 보유 포인트({currentUser.point.toLocaleString()}P)보다 많습니다.</p>
          )}
        </motion.div>

        {/* 제출 방식 */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white rounded-3xl shadow-sm p-5">
          <label className="text-xs font-bold text-gray-500 mb-3 flex items-center gap-1">
            <FileText size={13} /> 제출 방식
          </label>
          <div className="grid grid-cols-3 gap-2">
            {SUBMISSION_TYPES.map((t) => (
              <button
                key={t.key}
                onClick={() => setSubmissionType(t.key)}
                className={`flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all ${
                  submissionType === t.key
                    ? 'border-purple-400 bg-purple-50'
                    : 'border-gray-100 bg-gray-50'
                }`}
              >
                <span className="text-xl">{t.emoji}</span>
                <p className={`text-xs font-bold ${submissionType === t.key ? 'text-purple-700' : 'text-gray-600'}`}>
                  {t.label}
                </p>
                <p className="text-[10px] text-gray-400">{t.desc}</p>
              </button>
            ))}
          </div>
        </motion.div>

        {/* 날짜 */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-3xl shadow-sm p-5 space-y-3">
          <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
            <Calendar size={13} /> 미션 기간
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-400 mb-1">시작일</p>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-field text-sm"
              />
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">종료일</p>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-field text-sm"
              />
            </div>
          </div>
        </motion.div>

        <Button
          fullWidth
          size="lg"
          onClick={handleSubmit}
          disabled={!isValid}
          loading={loading}
          className="rounded-3xl"
        >
          💾 수정 완료
        </Button>
      </div>
    </div>
  );
}
