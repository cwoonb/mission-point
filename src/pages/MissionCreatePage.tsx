import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Star, Users, FileText, Tag, Target, RefreshCw, Share2, BookMarked, Trash2, X } from 'lucide-react';
import Header from '../components/layout/Header';
import Button from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';
import { useGroupStore } from '../store/groupStore';
import { useMissionStore } from '../store/missionStore';
import { useTemplateStore, getTemplateEmoji } from '../store/templateStore';
import type { SubmissionType, MissionType, MissionGoal, RepeatType, ParentShareType } from '../types';
import { missionTypeLabel } from '../utils/studentStats';

const SUBMISSION_TYPES: Array<{ key: SubmissionType; label: string; emoji: string; desc: string }> = [
  { key: 'IMAGE', label: '이미지', emoji: '📷', desc: '사진으로 제출' },
  { key: 'TEXT', label: '텍스트', emoji: '✍️', desc: '글로 제출' },
  { key: 'BOTH', label: '둘 다', emoji: '📎', desc: '이미지 + 텍스트' },
];

const MISSION_TYPES: Array<{ key: MissionType; label: string; emoji: string }> = [
  { key: 'HOMEWORK', label: '숙제', emoji: '📝' },
  { key: 'VOCABULARY', label: '단어암기', emoji: '📖' },
  { key: 'READING', label: '독서', emoji: '📚' },
  { key: 'ATTENDANCE', label: '출석', emoji: '✅' },
  { key: 'REVIEW_NOTES', label: '오답정리', emoji: '✏️' },
  { key: 'LIFESTYLE', label: '생활습관', emoji: '🌱' },
  { key: 'OTHER', label: '기타', emoji: '🎯' },
];

const MISSION_GOALS: Array<{ key: MissionGoal; label: string }> = [
  { key: 'SINCERITY', label: '성실도 향상' },
  { key: 'STUDY_HABIT', label: '학습 습관 형성' },
  { key: 'SUBMISSION_MGMT', label: '과제 제출 관리' },
  { key: 'PARENT_REPORT', label: '학부모 공유용 기록' },
  { key: 'REWARD_EVENT', label: '보상용 이벤트' },
];

const REPEAT_TYPES: Array<{ key: RepeatType; label: string; desc: string }> = [
  { key: 'ONCE', label: '1회성', desc: '한 번만' },
  { key: 'DAILY', label: '매일', desc: '매일 반복' },
  { key: 'WEEKLY', label: '매주', desc: '주 1회' },
  { key: 'WEEKDAYS', label: '평일', desc: '월~금' },
];

const PARENT_SHARES: Array<{ key: ParentShareType; label: string; emoji: string }> = [
  { key: 'NONE', label: '공유 안 함', emoji: '🔒' },
  { key: 'ON_COMPLETE', label: '완료 시 공유', emoji: '📨' },
  { key: 'WEEKLY_REPORT', label: '주간 리포트 포함', emoji: '📊' },
];

const PRESET_POINTS = [30, 50, 80, 100, 150, 200];

const today = () => new Date().toISOString().split('T')[0];
const nextWeek = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
};

export default function MissionCreatePage() {
  const navigate = useNavigate();
  const { currentUser, users } = useAuthStore();
  const { createMission } = useMissionStore();
  const { getMyGroups } = useGroupStore();
  const { templates, saveTemplate, deleteTemplate, incrementUsage } = useTemplateStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rewardPoint, setRewardPoint] = useState(100);
  const [targetMode, setTargetMode] = useState<'individual' | 'group'>('individual');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [groupId, setGroupId] = useState('');
  const [submissionType, setSubmissionType] = useState<SubmissionType>('BOTH');
  const [missionType, setMissionType] = useState<MissionType>('HOMEWORK');
  const [missionGoal, setMissionGoal] = useState<MissionGoal>('STUDY_HABIT');
  const [repeatType, setRepeatType] = useState<RepeatType>('ONCE');
  const [parentShare, setParentShare] = useState<ParentShareType>('NONE');
  const [startDate, setStartDate] = useState(today());
  const [endDate, setEndDate] = useState(nextWeek());
  const [loading, setLoading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);

  const children = currentUser?.socialProvider
    ? users.filter((u) => u.role === 'CHILD' && u.facilitatorId === currentUser.id)
    : users.filter((u) => u.role === 'CHILD');

  const myGroups = currentUser ? getMyGroups(currentUser.id) : [];
  const groupMembers = groupId ? children.filter((u) => u.groupId === groupId) : [];

  const toggleStudent = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedIds(selectedIds.size === children.length ? new Set() : new Set(children.map((c) => c.id)));
  };

  const targetIds = targetMode === 'individual'
    ? Array.from(selectedIds)
    : groupMembers.map((m) => m.id);

  const handleSubmit = () => {
    if (!currentUser || !title.trim() || !description.trim()) return;
    setLoading(true);

    setTimeout(() => {
      const base = {
        title: title.trim(), description: description.trim(), rewardPoint,
        creatorId: currentUser.id, submissionType,
        startDate: new Date(startDate).toISOString(), endDate: new Date(endDate).toISOString(),
        missionType, missionGoal, repeatType, parentShare,
      };
      targetIds.forEach((id) => createMission({ ...base, assigneeId: id }));
      navigate('/missions', { replace: true });
    }, 400);
  };

  const isValid =
    title.trim() && description.trim() && rewardPoint > 0 && startDate && endDate &&
    targetIds.length > 0;

  const applyTemplate = (tId: string) => {
    const t = templates.find((t) => t.id === tId);
    if (!t) return;
    setTitle(t.title);
    setDescription(t.description);
    setRewardPoint(t.rewardPoint);
    setSubmissionType(t.submissionType);
    if (t.missionType) setMissionType(t.missionType);
    if (t.missionGoal) setMissionGoal(t.missionGoal);
    if (t.repeatType) setRepeatType(t.repeatType);
    if (t.parentShare) setParentShare(t.parentShare);
    incrementUsage(tId);
    setShowTemplates(false);
  };

  const handleSaveTemplate = () => {
    if (!title.trim()) return;
    saveTemplate({ name: title.trim(), title: title.trim(), description, rewardPoint, submissionType, missionType, missionGoal, repeatType, parentShare });
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  return (
    <div className="page-container">
      <Header title="✨ 미션 만들기" showBack showPoints={false} />

      <div className="content-area px-4 py-5 space-y-4">

        {/* 템플릿 배너 */}
        <motion.button initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          onClick={() => setShowTemplates(true)}
          className="w-full flex items-center gap-3 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl px-4 py-3 active:scale-[0.98] transition-transform">
          <BookMarked size={18} className="text-purple-500 flex-shrink-0" />
          <div className="text-left flex-1">
            <p className="text-sm font-bold text-purple-700">📋 템플릿에서 불러오기</p>
            <p className="text-xs text-purple-500">{templates.length}개 저장됨 · 탭해서 빠르게 시작</p>
          </div>
          <span className="text-purple-400 text-xs">→</span>
        </motion.button>

        {/* 기본 정보 */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-sm p-5 space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1.5 block">📝 미션 제목 <span className="text-red-400">*</span></label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 수학 숙제 완료하기" className="input-field" maxLength={50} />
            <p className="text-xs text-gray-400 text-right mt-1">{title.length}/50</p>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1.5 block">📋 미션 설명 <span className="text-red-400">*</span></label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="미션에 대한 자세한 설명을 입력하세요..."
              rows={3} className="input-field resize-none" maxLength={200} />
            <p className="text-xs text-gray-400 text-right">{description.length}/200</p>
          </div>
        </motion.div>

        {/* 미션 유형 */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }} className="bg-white rounded-3xl shadow-sm p-5">
          <label className="text-xs font-bold text-gray-500 mb-3 flex items-center gap-1">
            <Tag size={13} /> 미션 유형
          </label>
          <div className="flex flex-wrap gap-2">
            {MISSION_TYPES.map((t) => (
              <button key={t.key} onClick={() => setMissionType(t.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${missionType === t.key ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                <span>{t.emoji}</span>{t.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* 관리 목표 */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white rounded-3xl shadow-sm p-5">
          <label className="text-xs font-bold text-gray-500 mb-3 flex items-center gap-1">
            <Target size={13} /> 관리 목표
          </label>
          <div className="space-y-2">
            {MISSION_GOALS.map((g) => (
              <button key={g.key} onClick={() => setMissionGoal(g.key)}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${missionGoal === g.key ? 'bg-indigo-600 text-white' : 'bg-gray-50 text-gray-600'}`}>
                {g.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* 대상 선택 */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }} className="bg-white rounded-3xl shadow-sm p-5">
          <label className="text-xs font-bold text-gray-500 mb-3 flex items-center gap-1">
            <Users size={13} /> 미션 대상 <span className="text-red-400">*</span>
          </label>

          {children.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-3xl mb-2">👤</p>
              <p className="text-gray-600 text-sm font-semibold mb-1">아직 학생이 없어요</p>
              <p className="text-gray-400 text-xs mb-4">학생을 먼저 초대해야 미션을 만들 수 있어요</p>
              <button onClick={() => navigate('/performers')} className="px-5 py-2.5 bg-purple-600 text-white font-bold text-sm rounded-2xl">
                학생 초대하러 가기 →
              </button>
            </div>
          ) : (
            <>
              <div className="flex gap-2 mb-4">
                {(['individual', 'group'] as const).map((mode) => (
                  <button key={mode} onClick={() => { setTargetMode(mode); setSelectedIds(new Set()); setGroupId(''); }}
                    className={`flex-1 py-2.5 rounded-2xl font-bold text-sm transition-all ${targetMode === mode ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {mode === 'individual' ? '👤 직접 선택' : '👥 반 전체'}
                  </button>
                ))}
              </div>

              {targetMode === 'individual' ? (
                <div className="space-y-2">
                  {/* 전체 선택 */}
                  <button onClick={toggleAll}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50 border border-gray-200">
                    <span className="text-xs font-bold text-gray-500">전체 선택</span>
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${selectedIds.size === children.length && children.length > 0 ? 'bg-purple-600 border-purple-600' : 'border-gray-300'}`}>
                      {selectedIds.size === children.length && children.length > 0 && (
                        <svg viewBox="0 0 10 8" className="w-3 h-3 fill-white"><path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      )}
                    </div>
                  </button>

                  {/* 학생 목록 */}
                  {children.map((child) => {
                    const checked = selectedIds.has(child.id);
                    return (
                      <button key={child.id} onClick={() => toggleStudent(child.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${checked ? 'border-purple-400 bg-purple-50' : 'border-gray-100 bg-gray-50'}`}>
                        <div className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all ${checked ? 'bg-purple-600 border-purple-600' : 'border-gray-300'}`}>
                          {checked && (
                            <svg viewBox="0 0 10 8" className="w-3 h-3 fill-white"><path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          )}
                        </div>
                        <span className="text-2xl">{child.avatar}</span>
                        <div className="text-left flex-1">
                          <p className={`text-sm font-bold ${checked ? 'text-purple-700' : 'text-gray-700'}`}>{child.name}</p>
                          <p className="text-xs text-gray-400">{child.groupId ? (myGroups.find(g => g.id === child.groupId)?.name ?? '반 없음') : '반 없음'} · {child.point.toLocaleString()}P</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : myGroups.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">아직 반이 없어요. 학생 탭에서 반을 먼저 만들어주세요.</p>
              ) : (
                <div className="space-y-2">
                  {myGroups.map((group) => {
                    const members = children.filter((u) => u.groupId === group.id);
                    return (
                      <button key={group.id} onClick={() => setGroupId(group.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${groupId === group.id ? 'border-purple-400 bg-purple-50' : 'border-gray-100 bg-gray-50'}`}>
                        <span className="text-2xl">{group.emoji}</span>
                        <div className="text-left flex-1">
                          <p className={`text-sm font-bold ${groupId === group.id ? 'text-purple-700' : 'text-gray-700'}`}>{group.name}</p>
                          <p className="text-xs text-gray-400">{members.length}명 · 미션 {members.length}개 생성됨</p>
                          {groupId === group.id && members.length > 0 && (
                            <p className="text-xs text-purple-500 mt-0.5">{members.map(m => m.name).join(' · ')}</p>
                          )}
                        </div>
                        {groupId === group.id && <span className="text-purple-500 text-lg">✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 선택 요약 */}
              {targetIds.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className="mt-3 bg-purple-50 border border-purple-200 rounded-2xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-purple-700">✅ {targetIds.length}명 선택됨</p>
                    <p className="text-[11px] text-purple-500 mt-0.5">
                      {targetIds.map(id => children.find(c => c.id === id)?.name).filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <span className="text-xs font-black text-purple-600 bg-purple-100 px-2 py-1 rounded-lg">
                    미션 {targetIds.length}개 생성
                  </span>
                </motion.div>
              )}
            </>
          )}
        </motion.div>

        {/* 보상 포인트 */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.09 }} className="bg-white rounded-3xl shadow-sm p-5">
          <label className="text-xs font-bold text-gray-500 mb-3 flex items-center gap-1">
            <Star size={13} className="text-amber-500" /> 보상 포인트
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {PRESET_POINTS.map((p) => (
              <button key={p} onClick={() => setRewardPoint(p)}
                className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-all ${rewardPoint === p ? 'bg-amber-400 text-white shadow-md' : 'bg-amber-50 text-amber-600'}`}>
                {p}P
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input type="number" value={rewardPoint} onChange={(e) => setRewardPoint(Math.max(1, parseInt(e.target.value) || 0))}
              className="input-field" min={1} max={99999} />
            <span className="text-amber-600 font-bold">P</span>
          </div>
          {currentUser && rewardPoint > currentUser.point && (
            <p className="text-red-400 text-xs mt-1">⚠️ 현재 보유 포인트({currentUser.point.toLocaleString()}P)보다 많습니다.</p>
          )}
        </motion.div>

        {/* 반복 설정 */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.11 }} className="bg-white rounded-3xl shadow-sm p-5">
          <label className="text-xs font-bold text-gray-500 mb-3 flex items-center gap-1">
            <RefreshCw size={13} /> 반복 여부
          </label>
          <div className="grid grid-cols-4 gap-2">
            {REPEAT_TYPES.map((r) => (
              <button key={r.key} onClick={() => setRepeatType(r.key)}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all ${repeatType === r.key ? 'border-purple-400 bg-purple-50' : 'border-gray-100 bg-gray-50'}`}>
                <p className={`text-xs font-bold ${repeatType === r.key ? 'text-purple-700' : 'text-gray-600'}`}>{r.label}</p>
                <p className="text-[10px] text-gray-400">{r.desc}</p>
              </button>
            ))}
          </div>
        </motion.div>

        {/* 제출 방식 */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }} className="bg-white rounded-3xl shadow-sm p-5">
          <label className="text-xs font-bold text-gray-500 mb-3 flex items-center gap-1">
            <FileText size={13} /> 제출 방식
          </label>
          <div className="grid grid-cols-3 gap-2">
            {SUBMISSION_TYPES.map((t) => (
              <button key={t.key} onClick={() => setSubmissionType(t.key)}
                className={`flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all ${submissionType === t.key ? 'border-purple-400 bg-purple-50' : 'border-gray-100 bg-gray-50'}`}>
                <span className="text-xl">{t.emoji}</span>
                <p className={`text-xs font-bold ${submissionType === t.key ? 'text-purple-700' : 'text-gray-600'}`}>{t.label}</p>
                <p className="text-[10px] text-gray-400">{t.desc}</p>
              </button>
            ))}
          </div>
        </motion.div>

        {/* 학부모 공유 */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white rounded-3xl shadow-sm p-5">
          <label className="text-xs font-bold text-gray-500 mb-3 flex items-center gap-1">
            <Share2 size={13} /> 학부모 공유
          </label>
          <div className="space-y-2">
            {PARENT_SHARES.map((s) => (
              <button key={s.key} onClick={() => setParentShare(s.key)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 transition-all ${parentShare === s.key ? 'border-purple-400 bg-purple-50' : 'border-gray-100 bg-gray-50'}`}>
                <span className="text-lg">{s.emoji}</span>
                <p className={`text-sm font-semibold ${parentShare === s.key ? 'text-purple-700' : 'text-gray-600'}`}>{s.label}</p>
                {parentShare === s.key && <span className="ml-auto text-purple-500 text-sm">✓</span>}
              </button>
            ))}
          </div>
        </motion.div>

        {/* 날짜 */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.17 }} className="bg-white rounded-3xl shadow-sm p-5 space-y-3">
          <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
            <Calendar size={13} /> 미션 기간
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-400 mb-1">시작일</p>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input-field text-sm" />
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">종료일</p>
              <input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} className="input-field text-sm" />
            </div>
          </div>
        </motion.div>

        {/* 현재 폼 템플릿 저장 */}
        {title.trim() && (
          <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            onClick={handleSaveTemplate}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold border-2 transition-all active:scale-95 ${savedFeedback ? 'border-emerald-400 bg-emerald-50 text-emerald-600' : 'border-dashed border-gray-300 text-gray-400'}`}>
            <BookMarked size={15} />
            {savedFeedback ? '✅ 템플릿으로 저장됐어요!' : '현재 폼을 템플릿으로 저장'}
          </motion.button>
        )}

        <Button fullWidth size="lg" onClick={handleSubmit} disabled={!isValid} loading={loading} className="rounded-3xl">
          🚀 {targetIds.length > 1 ? `${targetIds.length}명에게 미션 배정하기` : '미션 생성하기'}
        </Button>
      </div>

      {/* 템플릿 시트 */}
      <AnimatePresence>
        {showTemplates && (
          <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setShowTemplates(false)}>
            <div className="absolute inset-0 bg-black/40" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="relative w-full max-w-md bg-white rounded-t-3xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-gray-200 rounded-full" /></div>
              <div className="px-5 pb-8 space-y-3" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <div className="flex items-center justify-between py-2">
                  <h3 className="font-black text-gray-800">📋 미션 템플릿</h3>
                  <button onClick={() => setShowTemplates(false)} className="p-2 rounded-full bg-gray-100"><X size={16} className="text-gray-500" /></button>
                </div>
                {templates.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p className="text-3xl mb-2">📭</p>
                    <p className="text-sm">저장된 템플릿이 없어요</p>
                  </div>
                ) : templates.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3">
                    <span className="text-2xl flex-shrink-0">{getTemplateEmoji(t)}</span>
                    <button onClick={() => applyTemplate(t.id)} className="flex-1 text-left">
                      <p className="text-sm font-bold text-gray-800">{t.name}</p>
                      <p className="text-[11px] text-gray-400">
                        {missionTypeLabel[t.missionType ?? 'OTHER']} · {t.rewardPoint}P · {t.usageCount}회 사용
                      </p>
                    </button>
                    <button onClick={() => deleteTemplate(t.id)} className="p-1.5 text-gray-300 hover:text-red-400 flex-shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
