import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, UserPlus, Link, X, Plus, Trash2, Send, TrendingUp, AlertTriangle, FileText, BarChart3, Search, ArrowUpDown } from 'lucide-react';
import Header from '../components/layout/Header';
import { useAuthStore } from '../store/authStore';
import { useGroupStore } from '../store/groupStore';
import { useMissionStore } from '../store/missionStore';
import { formatPoint } from '../utils/helpers';
import {
  getStudentStatus,
  getWeeklyRate,
  getCompletionRate,
  getStreak,
  getUnsubmittedCount,
  statusConfig,
  missionTypeLabel,
  defaultStatusThresholds,
} from '../utils/studentStats';
import {
  openKakaoFriendPicker,
  sendKakaoInviteMessages,
  shareViaNative,
  getInviteUrl,
  type KakaoFriend,
} from '../lib/kakaoShare';
import type { User, PerformerGroup, Mission, MissionType } from '../types';

const GROUP_EMOJIS = ['📚', '🎯', '🌟', '🏆', '🎨', '⚽', '🎵', '🔬', '📐', '🌈', '🦋', '🚀'];

// ── 포인트 전송 모달 ─────────────────────────────
function TransferModal({ from, recipients, onClose }: { from: User; recipients: User[]; onClose: () => void }) {
  const { transferPoints } = useAuthStore();
  const [toId, setToId] = useState('');
  const [amount, setAmount] = useState('');
  const [done, setDone] = useState(false);

  const handleTransfer = () => {
    const n = Number(amount);
    if (!toId || !n || n > from.point) return;
    if (transferPoints(from.id, toId, n)) setDone(true);
  };

  const to = recipients.find((u) => u.id === toId);
  const n = Number(amount);
  const valid = toId && n > 0 && n <= from.point;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-md bg-white rounded-t-3xl p-6 pb-10"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-black text-gray-800 text-lg">포인트 전송</h3>
            <p className="text-gray-400 text-xs mt-0.5">보유 {formatPoint(from.point)}P</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-gray-100"><X size={18} className="text-gray-500" /></button>
        </div>
        {done ? (
          <div className="text-center py-6">
            <p className="text-5xl mb-3">✅</p>
            <p className="font-black text-gray-800">{to?.name}님에게 {formatPoint(n)}P 전송 완료!</p>
            <button onClick={onClose} className="mt-5 w-full py-4 bg-purple-600 text-white rounded-2xl font-bold">확인</button>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-xs font-bold text-gray-500 mb-2">받는 사람</p>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {recipients.map((u) => (
                  <button key={u.id} onClick={() => setToId(u.id)}
                    className={`flex items-center gap-2 p-3 rounded-2xl border-2 text-left transition-all ${toId === u.id ? 'border-purple-400 bg-purple-50' : 'border-gray-100 bg-gray-50'}`}>
                    <span className="text-xl">{u.avatar}</span>
                    <div>
                      <p className="text-xs font-bold text-gray-800 truncate">{u.name}</p>
                      <p className="text-[10px] text-amber-600">{formatPoint(u.point)}P</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-5">
              <p className="text-xs font-bold text-gray-500 mb-2">전송 포인트</p>
              <div className="flex items-center gap-2 bg-gray-50 rounded-2xl px-4 py-3">
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                  placeholder="0" className="flex-1 bg-transparent text-xl font-black text-gray-800 outline-none" />
                <span className="text-amber-500 font-bold">P</span>
              </div>
              <div className="flex gap-2 mt-2">
                {[100, 500, 1000, 5000].map((p) => (
                  <button key={p} onClick={() => setAmount(String(p))}
                    className="flex-1 py-1.5 bg-amber-50 text-amber-700 text-xs font-bold rounded-xl">+{p}</button>
                ))}
              </div>
            </div>
            <button onClick={handleTransfer} disabled={!valid}
              className="w-full py-4 rounded-2xl font-bold text-sm text-white bg-purple-600 disabled:opacity-40 transition-all active:scale-95">
              {toId ? `${to?.name}님에게 ${formatPoint(n)}P 전송하기` : '받는 사람을 선택하세요'}
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}

// ── 그룹 만들기 모달 ─────────────────────────────
function CreateGroupModal({ facilitatorId, onClose }: { facilitatorId: string; onClose: () => void }) {
  const { createGroup } = useGroupStore();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('📚');

  const handleCreate = () => {
    if (!name.trim()) return;
    createGroup({ name: name.trim(), emoji, facilitatorId });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-md bg-white rounded-t-3xl p-6 pb-10"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-black text-gray-800 text-lg">그룹(반) 만들기</h3>
          <button onClick={onClose} className="p-2 rounded-full bg-gray-100"><X size={18} className="text-gray-500" /></button>
        </div>
        <p className="text-xs font-bold text-gray-500 mb-2">그룹 아이콘</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {GROUP_EMOJIS.map((e) => (
            <button key={e} onClick={() => setEmoji(e)}
              className={`w-10 h-10 text-xl rounded-xl transition-all ${emoji === e ? 'bg-purple-100 ring-2 ring-purple-400' : 'bg-gray-100'}`}>{e}</button>
          ))}
        </div>
        <p className="text-xs font-bold text-gray-500 mb-2">반 이름</p>
        <input value={name} onChange={(e) => setName(e.target.value)}
          placeholder="예: 오전반, 1반, 수학반..." className="input-field mb-5" maxLength={20} />
        <button onClick={handleCreate} disabled={!name.trim()}
          className="w-full py-4 bg-purple-600 text-white rounded-2xl font-bold disabled:opacity-40">
          {emoji} {name.trim() || '반 이름'} 만들기
        </button>
      </motion.div>
    </div>
  );
}

// ── 초대 모달 ─────────────────────────────────────
const KakaoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20">
    <path fillRule="evenodd" clipRule="evenodd"
      d="M10 2C5.582 2 2 4.805 2 8.244c0 2.227 1.377 4.179 3.46 5.318l-.88 3.26c-.077.286.252.517.502.35l3.827-2.542c.36.047.726.074 1.091.074 4.418 0 8-2.805 8-6.26C18 4.805 14.418 2 10 2z"
      fill="#191919" />
  </svg>
);

function InviteModal({ onClose, facilitatorId, facilitatorName }: { onClose: () => void; facilitatorId: string; facilitatorName: string }) {
  const [step, setStep] = useState<'main' | 'selected' | 'done'>('main');
  const [selectedFriends, setSelectedFriends] = useState<KakaoFriend[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasKakaoToken = !!sessionStorage.getItem('kakao_access_token');

  const handlePickFriends = async () => {
    setError(null); setLoading(true);
    try {
      const friends = await openKakaoFriendPicker();
      setSelectedFriends(friends); setStep('selected');
    } catch (e: unknown) {
      if (e instanceof Error) {
        if (e.message === 'NO_TOKEN') setError('카카오 로그인 후 이용할 수 있어요.');
        else if (e.name !== 'AbortError') setError('친구 목록을 불러올 수 없어요.');
      }
    } finally { setLoading(false); }
  };

  const handleSendMessages = async () => {
    setLoading(true); setError(null);
    try {
      await sendKakaoInviteMessages(selectedFriends, facilitatorId, facilitatorName);
      setStep('done');
    } catch { setError('메시지 전송 실패. 링크를 복사해서 보내주세요.'); }
    finally { setLoading(false); }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(getInviteUrl(facilitatorId));
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-md bg-white rounded-t-3xl p-6 pb-10"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-black text-gray-800 text-lg">{step === 'done' ? '✅ 초대 완료!' : '학생 초대하기'}</h3>
            <p className="text-gray-400 text-xs mt-0.5">
              {step === 'selected' ? `${selectedFriends.length}명 선택됨` : step === 'done' ? `${selectedFriends.length}명에게 초대 메시지 전송` : '링크를 공유해서 학생을 추가하세요'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-gray-100"><X size={18} className="text-gray-500" /></button>
        </div>
        {error && <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mb-4"><p className="text-red-600 text-xs">{error}</p></div>}
        {step === 'done' ? (
          <div className="text-center py-4">
            <p className="text-5xl mb-3">🎉</p>
            <p className="text-gray-600 text-sm mb-4">학생이 링크를 클릭하면 바로 연결돼요!</p>
            <button onClick={onClose} className="w-full py-4 bg-purple-600 text-white rounded-2xl font-bold">확인</button>
          </div>
        ) : step === 'selected' ? (
          <>
            <div className="flex flex-wrap gap-2 mb-5 max-h-28 overflow-y-auto">
              {selectedFriends.map((f) => (
                <div key={f.uuid} className="flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 rounded-full px-3 py-1.5">
                  {f.profile_thumbnail_image && <img src={f.profile_thumbnail_image} className="w-5 h-5 rounded-full" alt="" />}
                  <span className="text-xs font-semibold text-yellow-800">{f.profile_nickname ?? '친구'}</span>
                </div>
              ))}
            </div>
            <button onClick={handleSendMessages} disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm mb-3 disabled:opacity-60"
              style={{ backgroundColor: '#FEE500', color: '#191919' }}>
              {loading ? <span className="w-4 h-4 border-2 border-gray-600/30 border-t-gray-600 rounded-full animate-spin" /> : <KakaoIcon />}
              {selectedFriends.length}명에게 초대 메시지 보내기
            </button>
            <button onClick={() => { setStep('main'); setSelectedFriends([]); }} className="w-full py-3 text-gray-400 text-sm">다시 선택하기</button>
          </>
        ) : (
          <>
            <div className="bg-gray-50 rounded-2xl px-4 py-3 mb-4 flex items-center gap-2">
              <Link size={14} className="text-gray-400 flex-shrink-0" />
              <p className="text-xs text-gray-500 truncate flex-1">{getInviteUrl(facilitatorId)}</p>
            </div>
            {hasKakaoToken && (
              <button onClick={handlePickFriends} disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-sm mb-3 disabled:opacity-60"
                style={{ backgroundColor: '#FEE500', color: '#191919' }}>
                {loading ? <span className="w-4 h-4 border-2 border-gray-600/30 border-t-gray-600 rounded-full animate-spin" /> : <KakaoIcon />}
                카카오 친구 선택해서 초대하기
              </button>
            )}
            {typeof navigator.share === 'function' && (
              <button onClick={async () => { try { await shareViaNative(facilitatorId, facilitatorName); } catch {} }}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm bg-green-50 text-green-700 border border-green-200 mb-3">
                📤 공유하기 (카카오톡 등)
              </button>
            )}
            <button onClick={handleCopyLink}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm bg-gray-100 text-gray-700">
              {copied ? '✅ 복사됐어요!' : <><Link size={16} /> 링크 복사하기</>}
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}

// ── 학생 카드 ─────────────────────────────────────
function StudentCard({ student, missions, onMove, onSelect }: {
  student: User;
  missions: Mission[];
  onMove: () => void;
  onSelect: (student: User) => void;
}) {
  const { currentUser } = useAuthStore();
  const thresholds = currentUser?.statusThresholds ?? defaultStatusThresholds;
  const status = getStudentStatus(missions, student.id, thresholds);
  const sc = statusConfig[status];
  const weekRate = getWeeklyRate(missions, student.id);
  const streak = getStreak(missions, student.id);
  const unsubmitted = getUnsubmittedCount(missions, student.id);

  return (
    <button onClick={() => onSelect(student)}
      className="w-full flex items-center gap-3 bg-white rounded-2xl px-3 py-3 shadow-sm active:scale-95 transition-transform">
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl overflow-hidden flex items-center justify-center text-xl">
          {student.profileImage ? <img src={student.profileImage} alt="" className="w-full h-full object-cover" /> : student.avatar}
        </div>
        {unsubmitted > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">{unsubmitted}</span>
        )}
      </div>
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className="text-sm font-bold text-gray-800">{student.name}</p>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>{sc.label}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-gray-400">이번주 {weekRate}%</span>
          {streak > 0 && <span className="text-[11px] text-orange-500">🔥 {streak}일 연속</span>}
          <span className="text-[11px] text-amber-600">{formatPoint(student.point)}P</span>
        </div>
      </div>
      <button onClick={(e) => { e.stopPropagation(); onMove(); }} className="p-1.5 text-gray-300 hover:text-gray-500 flex-shrink-0">
        <ChevronRight size={14} />
      </button>
    </button>
  );
}

// ── 학생 퀵뷰 시트 ────────────────────────────────
function StudentQuickSheet({ student, missions, allStudents, onClose }: {
  student: User;
  missions: Mission[];
  allStudents: User[];
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const thresholds = currentUser?.statusThresholds ?? defaultStatusThresholds;
  const myMissions = missions.filter((m) => m.assigneeId === student.id);
  const successMissions = myMissions.filter((m) => m.status === 'SUCCESS');
  const activeMissions = myMissions.filter((m) => m.status === 'IN_PROGRESS' || m.status === 'REVIEWING');
  const overallRate = getCompletionRate(missions, student.id);
  const weekRate = getWeeklyRate(missions, student.id);
  const streak = getStreak(missions, student.id);
  const unsubmitted = getUnsubmittedCount(missions, student.id);
  const status = getStudentStatus(missions, student.id, thresholds);
  const sc = statusConfig[status];

  // 같은 반 평균
  const groupMembers = student.groupId
    ? allStudents.filter((u) => u.groupId === student.groupId && u.id !== student.id)
    : [];
  const groupAvgWeek = groupMembers.length > 0
    ? Math.round(groupMembers.reduce((acc, u) => acc + getWeeklyRate(missions, u.id), 0) / groupMembers.length)
    : null;

  // 미션 유형별 수행률 (상위 4개)
  const typeStats: Record<string, { total: number; success: number }> = {};
  myMissions.forEach((m) => {
    const t = m.missionType ?? 'OTHER';
    if (!typeStats[t]) typeStats[t] = { total: 0, success: 0 };
    typeStats[t].total++;
    if (m.status === 'SUCCESS') typeStats[t].success++;
  });
  const typeSorted = Object.entries(typeStats)
    .map(([type, s]) => ({
      type: type as MissionType,
      rate: s.total ? Math.round((s.success / s.total) * 100) : 0,
      total: s.total,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="relative w-full max-w-md bg-white rounded-t-3xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="px-5 pb-8 space-y-4 overflow-y-auto" style={{ maxHeight: '82vh' }}>
          {/* 헤더 */}
          <div className="flex items-center gap-3 pt-1">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl overflow-hidden flex items-center justify-center text-3xl flex-shrink-0">
              {student.profileImage ? <img src={student.profileImage} alt="" className="w-full h-full object-cover" /> : student.avatar}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="font-black text-lg text-gray-800">{student.name}</h3>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>{sc.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-amber-600 font-bold text-sm">⭐ {formatPoint(student.point)}P</span>
                {streak > 0 && <span className="text-orange-500 font-bold text-sm">🔥 {streak}일 연속</span>}
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full bg-gray-100 flex-shrink-0">
              <X size={16} className="text-gray-500" />
            </button>
          </div>

          {/* 핵심 지표 3칸 */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: '진행 중', value: activeMissions.length, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: '완료', value: successMissions.length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: '미제출', value: unsubmitted, color: unsubmitted > 0 ? 'text-red-600' : 'text-gray-400', bg: unsubmitted > 0 ? 'bg-red-50' : 'bg-gray-50' },
            ].map((s) => (
              <div key={s.label} className={`${s.bg} rounded-2xl p-3 text-center`}>
                <p className={`font-black text-2xl ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* 수행률 바 */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
            <p className="text-xs font-bold text-gray-500 flex items-center gap-1.5"><BarChart3 size={13} /> 수행률</p>
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-xs text-gray-600 font-semibold">이번 주</span>
                <div className="flex items-center gap-2">
                  {groupAvgWeek !== null && (
                    <span className="text-[10px] text-gray-400 bg-white px-1.5 py-0.5 rounded-full border">반 평균 {groupAvgWeek}%</span>
                  )}
                  <span className={`text-sm font-black ${weekRate >= 70 ? 'text-emerald-600' : weekRate >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                    {weekRate}%
                  </span>
                </div>
              </div>
              <div className="relative w-full bg-gray-200 rounded-full h-3">
                <motion.div initial={{ width: 0 }} animate={{ width: `${weekRate}%` }} transition={{ duration: 0.7, ease: 'easeOut' }}
                  className={`h-3 rounded-full ${weekRate >= 70 ? 'bg-emerald-500' : weekRate >= 40 ? 'bg-amber-400' : 'bg-red-400'}`} />
                {groupAvgWeek !== null && (
                  <div style={{ left: `${Math.min(groupAvgWeek, 98)}%` }}
                    className="absolute top-0 bottom-0 w-0.5 bg-gray-500/50 rounded-full -translate-x-1/2" />
                )}
              </div>
              {groupAvgWeek !== null && (
                <p className="text-[10px] text-gray-400 mt-1">
                  {weekRate > groupAvgWeek ? `반 평균보다 ${weekRate - groupAvgWeek}% 높아요 ✨` :
                   weekRate < groupAvgWeek ? `반 평균보다 ${groupAvgWeek - weekRate}% 낮아요` : '반 평균과 같아요'}
                </p>
              )}
            </div>
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-xs text-gray-600 font-semibold">전체 수행률</span>
                <span className="text-sm font-black text-purple-600">{overallRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <motion.div initial={{ width: 0 }} animate={{ width: `${overallRate}%` }} transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
                  className="h-3 rounded-full bg-purple-500" />
              </div>
            </div>
          </div>

          {/* 미션 유형별 */}
          {typeSorted.length > 0 && (
            <div className="space-y-2.5">
              <p className="text-xs font-bold text-gray-500 flex items-center gap-1.5"><TrendingUp size={13} /> 미션 유형별 수행률</p>
              {typeSorted.map((t) => (
                <div key={t.type} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 font-medium w-14 flex-shrink-0 truncate">{missionTypeLabel[t.type] ?? t.type}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${t.rate}%` }} transition={{ duration: 0.7 }}
                      className={`h-2 rounded-full ${t.rate >= 70 ? 'bg-emerald-500' : t.rate >= 40 ? 'bg-amber-400' : 'bg-red-400'}`} />
                  </div>
                  <span className={`text-xs font-black w-8 text-right flex-shrink-0 ${t.rate >= 70 ? 'text-emerald-600' : t.rate >= 40 ? 'text-amber-600' : 'text-red-500'}`}>
                    {t.rate}%
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => { onClose(); navigate('/missions/create', { state: { preselectedStudentId: student.id } }); }}
              className="flex items-center justify-center gap-1.5 py-3.5 bg-purple-600 text-white rounded-2xl font-bold text-sm active:scale-95 transition-transform">
              <Plus size={16} /> 미션 배정
            </button>
            <button
              onClick={() => { onClose(); navigate(`/students/${student.id}`); }}
              className="flex items-center justify-center gap-1.5 py-3.5 bg-gray-100 text-gray-700 rounded-2xl font-bold text-sm active:scale-95 transition-transform">
              전체 리포트 <ChevronRight size={15} />
            </button>
          </div>
          <button
            onClick={() => { onClose(); navigate(`/students/${student.id}/report`); }}
            className="w-full py-3.5 bg-emerald-50 text-emerald-700 rounded-2xl font-bold text-sm active:scale-95 transition-transform flex items-center justify-center gap-1.5">
            <FileText size={16} /> 학부모 리포트 생성
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── 그룹 카드 ─────────────────────────────────────
function GroupCard({ group, performers, allPerformers, index, missions, onSelect }: {
  group: PerformerGroup;
  performers: User[];
  allPerformers: User[];
  index: number;
  missions: Mission[];
  onSelect: (student: User) => void;
}) {
  const { deleteGroup } = useGroupStore();
  const { updateUserGroup } = useAuthStore();
  const [expanded, setExpanded] = useState(true);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const unassigned = allPerformers.filter((p) => !p.groupId);
  const activeMissions = missions.filter(
    (m) => performers.some((p) => p.id === m.assigneeId) && (m.status === 'IN_PROGRESS' || m.status === 'REVIEWING')
  ).length;
  const reviewing = missions.filter(
    (m) => performers.some((p) => p.id === m.assigneeId) && m.status === 'REVIEWING'
  ).length;
  const groupWeekRate = performers.length > 0
    ? Math.round(performers.reduce((acc, p) => acc + getWeeklyRate(missions, p.id), 0) / performers.length)
    : 0;
  const groupUnsubmitted = performers.reduce((acc, p) => acc + getUnsubmittedCount(missions, p.id), 0);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}
      className="bg-white rounded-3xl shadow-sm overflow-hidden">
      <button onClick={() => setExpanded((v) => !v)} className="w-full flex items-center gap-3 p-4">
        <div className="w-11 h-11 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
          {group.emoji}
        </div>
        <div className="flex-1 text-left">
          <p className="font-black text-gray-800">{group.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-400">{performers.length}명</span>
            <span className="text-[10px] text-indigo-600 font-semibold">수행률 {groupWeekRate}%</span>
            {reviewing > 0 && <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded-full">검토 {reviewing}건</span>}
            {groupUnsubmitted > 0 && <span className="text-[10px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded-full">미제출 {groupUnsubmitted}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`"${group.name}" 그룹을 삭제할까요?`)) {
                performers.forEach((p) => updateUserGroup(p.id, undefined));
                deleteGroup(group.id);
              }
            }}
            className="p-1.5 text-gray-300 hover:text-red-400">
            <Trash2 size={14} />
          </button>
          <motion.div animate={{ rotate: expanded ? 90 : 0 }}>
            <ChevronRight size={16} className="text-gray-300" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-2">
              {performers.map((p) => (
                <StudentCard key={p.id} student={p} missions={missions} onSelect={onSelect}
                  onMove={() => {
                    const target = prompt('이동할 그룹 ID (비우면 그룹 해제)');
                    updateUserGroup(p.id, target || undefined);
                  }} />
              ))}

              <div className="relative">
                <button onClick={() => setShowAddMenu((v) => !v)}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 text-xs font-semibold">
                  <Plus size={14} /> 학생 추가
                </button>
                <AnimatePresence>
                  {showAddMenu && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-gray-100 rounded-2xl shadow-lg z-10 overflow-hidden">
                      {unassigned.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center p-3">추가할 학생이 없어요</p>
                      ) : unassigned.map((p) => (
                        <button key={p.id} onClick={() => { updateUserGroup(p.id, group.id); setShowAddMenu(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-purple-50 text-left">
                          <span>{p.avatar}</span>
                          <span className="text-sm font-semibold text-gray-700">{p.name}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

type FilterType = 'all' | 'unsubmitted' | 'counseling' | 'caution' | 'excellent';

// ── 메인 페이지 ───────────────────────────────────
export default function PerformerListPage() {
  const { users, currentUser } = useAuthStore();
  const { getMyGroups } = useGroupStore();
  const { missions } = useMissionStore();
  const [showInvite, setShowInvite] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'weekRate' | 'unsubmitted'>('name');
  const navigate = useNavigate();
  const location = useLocation();
  const locationFilter = (location.state as { filter?: string } | null)?.filter;
  const [activeFilter, setActiveFilter] = useState<FilterType>(
    locationFilter === 'unsubmitted' ? 'unsubmitted' :
    locationFilter === 'counseling' ? 'counseling' :
    locationFilter === 'caution' ? 'caution' :
    locationFilter === 'excellent' ? 'excellent' : 'all'
  );

  if (!currentUser) return null;

  const myPerformers = currentUser.socialProvider
    ? users.filter((u) => u.role === 'CHILD' && u.facilitatorId === currentUser.id)
    : users.filter((u) => u.role === 'CHILD');

  const myGroups = getMyGroups(currentUser.id);
  const unassigned = myPerformers.filter((p) => !p.groupId || !myGroups.find((g) => g.id === p.groupId));
  const otherFacilitators = users.filter((u) => u.id !== currentUser.id && (u.role === 'PARENT' || u.role === 'TEACHER'));
  const transferRecipients = [...otherFacilitators, ...myPerformers];

  const thresholds = currentUser.statusThresholds ?? defaultStatusThresholds;
  const myMissions = missions.filter((m) => m.creatorId === currentUser.id);
  const pendingReview = myMissions.filter((m) => m.status === 'REVIEWING').length;
  const weekRate = myPerformers.length > 0
    ? Math.round(myPerformers.reduce((acc, p) => acc + getWeeklyRate(missions, p.id), 0) / myPerformers.length)
    : 0;
  const counselingCount = myPerformers.filter((p) => getStudentStatus(missions, p.id, thresholds) === 'COUNSELING').length;

  const sortStudents = (list: User[]) => {
    if (sortBy === 'weekRate') return [...list].sort((a, b) => getWeeklyRate(missions, b.id) - getWeeklyRate(missions, a.id));
    if (sortBy === 'unsubmitted') return [...list].sort((a, b) => getUnsubmittedCount(missions, b.id) - getUnsubmittedCount(missions, a.id));
    return [...list].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  };

  const searchResults = searchQuery.trim()
    ? sortStudents(myPerformers.filter((p) => p.name.includes(searchQuery.trim())))
    : null;

  const filteredStudents = activeFilter === 'unsubmitted'
    ? myPerformers.filter((p) => getUnsubmittedCount(missions, p.id) > 0)
    : activeFilter === 'counseling'
    ? myPerformers.filter((p) => getStudentStatus(missions, p.id, thresholds) === 'COUNSELING')
    : activeFilter === 'caution'
    ? myPerformers.filter((p) => getStudentStatus(missions, p.id, thresholds) === 'CAUTION')
    : activeFilter === 'excellent'
    ? myPerformers.filter((p) => getStudentStatus(missions, p.id, thresholds) === 'EXCELLENT')
    : null;

  const filterConfig: Record<Exclude<FilterType, 'all'>, { label: string; color: string; badge: string }> = {
    unsubmitted: { label: '미제출 학생', color: 'bg-orange-50 border-orange-200 text-orange-700', badge: 'bg-orange-500' },
    counseling: { label: '상담 필요 학생', color: 'bg-red-50 border-red-200 text-red-700', badge: 'bg-red-500' },
    caution: { label: '주의 학생', color: 'bg-amber-50 border-amber-200 text-amber-700', badge: 'bg-amber-500' },
    excellent: { label: '우수 학생', color: 'bg-emerald-50 border-emerald-200 text-emerald-700', badge: 'bg-emerald-500' },
  };

  return (
    <div className="page-container">
      <Header title="👥 학생 관리" />

      <div className="content-area px-4 py-4 space-y-4">
        {/* 관리 요약 */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-slate-700 to-slate-900 rounded-3xl p-4 text-white shadow-lg">
          <p className="text-white/60 text-xs mb-3">📊 전체 관리 현황</p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: '반', value: myGroups.length },
              { label: '학생', value: myPerformers.length },
              { label: '이번주\n수행률', value: `${weekRate}%`, highlight: weekRate < 60 ? 'text-amber-300' : 'text-emerald-300' },
              { label: '검토대기', value: pendingReview, badge: pendingReview > 0, highlight: pendingReview > 0 ? 'text-amber-300' : undefined },
            ].map(({ label, value, badge, highlight }) => (
              <div key={label} className="bg-white/10 rounded-2xl p-2.5 text-center relative">
                {badge && <span className="absolute -top-1 -right-1 bg-red-400 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{value}</span>}
                <p className={`font-black text-lg leading-tight ${highlight ?? ''}`}>{value}</p>
                <p className="text-white/70 text-[10px] mt-0.5 whitespace-pre-line leading-tight">{label}</p>
              </div>
            ))}
          </div>
          {counselingCount > 0 && (
            <div className="mt-3 bg-red-500/20 border border-red-500/30 rounded-2xl px-3 py-2 flex items-center gap-2">
              <AlertTriangle size={13} className="text-red-300 flex-shrink-0" />
              <p className="text-red-200 text-xs font-semibold">상담 필요 학생 {counselingCount}명 — 빠른 확인이 필요해요</p>
            </div>
          )}
        </motion.div>

        {/* 필터 배너 */}
        <AnimatePresence>
          {activeFilter !== 'all' && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className={`flex items-center justify-between px-4 py-3 rounded-2xl border ${filterConfig[activeFilter].color}`}>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${filterConfig[activeFilter].badge}`} />
                <p className="text-sm font-bold">
                  {filterConfig[activeFilter].label}
                  <span className="font-normal ml-1">({filteredStudents?.length ?? 0}명)</span>
                </p>
              </div>
              <button onClick={() => setActiveFilter('all')}
                className="flex items-center gap-1 text-xs font-semibold opacity-60 hover:opacity-100">
                <X size={13} /> 전체 보기
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 검색 + 정렬 */}
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-white rounded-2xl px-3 py-2.5 shadow-sm">
            <Search size={15} className="text-gray-400 flex-shrink-0" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="학생 이름으로 검색..."
              className="flex-1 text-sm text-gray-700 outline-none bg-transparent placeholder-gray-300"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-gray-300">
                <X size={13} />
              </button>
            )}
          </div>
          <button
            onClick={() => setSortBy((s) => s === 'name' ? 'weekRate' : s === 'weekRate' ? 'unsubmitted' : 'name')}
            className="flex items-center gap-1.5 bg-white rounded-2xl px-3 py-2.5 shadow-sm text-xs font-semibold text-gray-600 flex-shrink-0">
            <ArrowUpDown size={13} />
            {sortBy === 'name' ? '이름' : sortBy === 'weekRate' ? '수행률' : '미제출'}
          </button>
        </div>

        {/* 액션 버튼 */}
        <div className="grid grid-cols-3 gap-2">
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => setShowCreateGroup(true)}
            className="flex flex-col items-center gap-1.5 py-3.5 bg-purple-600 text-white rounded-2xl font-bold text-xs shadow-md">
            <Plus size={18} /> 반 만들기
          </motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => setShowInvite(true)}
            className="flex flex-col items-center gap-1.5 py-3.5 rounded-2xl font-bold text-xs shadow-md"
            style={{ backgroundColor: '#FEE500', color: '#191919' }}>
            <UserPlus size={18} /> 학생 초대
          </motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => setShowTransfer(true)}
            className="flex flex-col items-center gap-1.5 py-3.5 bg-amber-500 text-white rounded-2xl font-bold text-xs shadow-md">
            <Send size={18} /> 포인트 전송
          </motion.button>
        </div>

        {/* 검색 결과 */}
        {searchResults !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-xs font-bold text-gray-500 mb-2 px-1">
              🔍 "{searchQuery}" 검색 결과 {searchResults.length}명
            </p>
            {searchResults.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-2xl shadow-sm">
                <p className="text-2xl mb-2">🤷</p>
                <p className="text-gray-500 text-sm">일치하는 학생이 없어요</p>
              </div>
            ) : (
              <div className="space-y-2">
                {searchResults.map((p) => (
                  <StudentCard key={p.id} student={p} missions={missions} onMove={() => {}} onSelect={setSelectedStudent} />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* 필터된 학생 목록 */}
        {searchResults === null && (filteredStudents !== null ? (
          filteredStudents.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-4xl mb-3">✅</p>
              <p className="text-gray-600 font-bold">해당하는 학생이 없어요</p>
              <p className="text-gray-400 text-sm mt-1">모든 학생이 정상 상태예요!</p>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
              {sortStudents(filteredStudents).map((p) => (
                <StudentCard key={p.id} student={p} missions={missions} onMove={() => {}} onSelect={setSelectedStudent} />
              ))}
            </motion.div>
          )
        ) : (
          <>
            {/* 반 목록 */}
            {myGroups.map((group, i) => (
              <GroupCard key={group.id} group={group} performers={myPerformers.filter((p) => p.groupId === group.id)}
                allPerformers={myPerformers} index={i} missions={missions} onSelect={setSelectedStudent} />
            ))}

            {/* 미배정 학생 */}
            {unassigned.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-3xl shadow-sm p-4">
                <p className="text-xs font-bold text-gray-400 mb-3">👤 반 미배정 ({unassigned.length}명)</p>
                <div className="space-y-2">
                  {unassigned.map((p) => (
                    <StudentCard key={p.id} student={p} missions={missions} onMove={() => {}} onSelect={setSelectedStudent} />
                  ))}
                </div>
              </motion.div>
            )}

            {/* 빈 상태 */}
            {myPerformers.length === 0 && (
              <div className="text-center py-12">
                <p className="text-5xl mb-3">👤</p>
                <p className="text-gray-600 font-bold mb-1">아직 관리 중인 학생이 없어요</p>
                <p className="text-gray-400 text-sm mb-4">학생 초대 버튼으로 초대해보세요!</p>
                <button onClick={() => setShowInvite(true)}
                  className="px-5 py-2.5 bg-purple-600 text-white font-bold text-sm rounded-2xl">학생 초대하기 →</button>
              </div>
            )}
          </>
        ))}
      </div>

      <AnimatePresence>
        {showInvite && <InviteModal onClose={() => setShowInvite(false)} facilitatorId={currentUser.id} facilitatorName={currentUser.name} />}
        {showCreateGroup && <CreateGroupModal facilitatorId={currentUser.id} onClose={() => setShowCreateGroup(false)} />}
        {showTransfer && transferRecipients.length > 0 && (
          <TransferModal from={currentUser} recipients={transferRecipients} onClose={() => setShowTransfer(false)} />
        )}
        {selectedStudent && (
          <StudentQuickSheet
            student={selectedStudent}
            missions={missions}
            allStudents={myPerformers}
            onClose={() => setSelectedStudent(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
