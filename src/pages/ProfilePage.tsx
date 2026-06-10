import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, ChevronRight, Trophy, Target, Star, Gift, Camera, Users, TrendingUp, CheckCircle2, BookOpen, AlertTriangle, Pencil, X, Check, KeyRound, Link2, SlidersHorizontal } from 'lucide-react';
import Header from '../components/layout/Header';
import { useAuthStore } from '../store/authStore';
import { useGroupStore } from '../store/groupStore';
import { useMissionStore } from '../store/missionStore';
import { useShopStore } from '../store/shopStore';
import { usePointStore } from '../store/pointStore';
import { formatPoint, formatDate, roleLabel } from '../utils/helpers';
import {
  getWeeklyRate, getCompletionRate, getStudentStatus, getUnsubmittedCount, defaultStatusThresholds,
  statusConfig, missionTypeLabel,
} from '../utils/studentStats';
import type { MissionType } from '../types';

function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const SIZE = 400;
      const canvas = document.createElement('canvas');
      canvas.width = SIZE; canvas.height = SIZE;
      const ctx = canvas.getContext('2d')!;
      const ratio = Math.max(SIZE / img.width, SIZE / img.height);
      const w = img.width * ratio; const h = img.height * ratio;
      ctx.drawImage(img, (SIZE - w) / 2, (SIZE - h) / 2, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { currentUser, logout, updateProfileImage, updateUserName, connectByCode, users } = useAuthStore();
  const { missions } = useMissionStore();
  const { getMyGroups } = useGroupStore();
  const { getExchangesForUser } = useShopStore();
  const { getTransactionsForUser, getTodayAdCount } = usePointStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);
  const [connectCode, setConnectCode] = useState('');
  const [connectMsg, setConnectMsg] = useState<{ ok: boolean; text: string } | null>(null);

  if (!currentUser) return null;

  const isFacilitator = currentUser.role !== 'CHILD';
  const thresholds = currentUser.statusThresholds ?? defaultStatusThresholds;

  const handleImageClick = () => fileInputRef.current?.click();
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await resizeImage(file);
      updateProfileImage(currentUser.id, dataUrl);
    } catch { alert('이미지 처리에 실패했어요.'); }
    finally { setUploading(false); e.target.value = ''; }
  };

  const exchanges = getExchangesForUser(currentUser.id);
  const transactions = getTransactionsForUser(currentUser.id);
  const todayAdCount = getTodayAdCount(currentUser.id);

  // 리더 전용 통계
  const myStudents = currentUser.socialProvider
    ? users.filter((u) => u.role === 'CHILD' && u.facilitatorId === currentUser.id)
    : users.filter((u) => u.role === 'CHILD');
  const myGroups = getMyGroups(currentUser.id);
  const myMissions = missions.filter((m) => m.creatorId === currentUser.id);
  const reviewedMissions = myMissions.filter((m) => m.status === 'SUCCESS' || m.status === 'REJECTED').length;
  const totalPointsGiven = myMissions
    .filter((m) => m.status === 'SUCCESS')
    .reduce((acc, m) => acc + m.rewardPoint, 0);
  const avgWeekRate = myStudents.length > 0
    ? Math.round(myStudents.reduce((acc, s) => acc + getWeeklyRate(missions, s.id), 0) / myStudents.length)
    : 0;

  // 반별 분석
  const groupStats = myGroups.map((g) => {
    const members = myStudents.filter((s) => s.groupId === g.id);
    const weekRate = members.length > 0
      ? Math.round(members.reduce((acc, s) => acc + getWeeklyRate(missions, s.id), 0) / members.length)
      : 0;
    const overallRate = members.length > 0
      ? Math.round(members.reduce((acc, s) => acc + getCompletionRate(missions, s.id), 0) / members.length)
      : 0;
    const unsubmitted = members.reduce((acc, s) => acc + getUnsubmittedCount(missions, s.id), 0);
    const counseling = members.filter((s) => getStudentStatus(missions, s.id, thresholds) === 'COUNSELING').length;
    return { group: g, members, weekRate, overallRate, unsubmitted, counseling };
  });

  // 실천자 상태 분포
  const statusDist = (['EXCELLENT', 'CAUTION', 'UNSUBMITTED', 'COUNSELING', 'NOT_STARTED'] as const).map((status) => ({
    status,
    count: myStudents.filter((s) => getStudentStatus(missions, s.id, thresholds) === status).length,
    ...statusConfig[status],
  }));

  // 미션 유형별 수행률
  const typeStats: Record<string, { total: number; success: number }> = {};
  myMissions.forEach((m) => {
    const t = m.missionType ?? 'OTHER';
    if (!typeStats[t]) typeStats[t] = { total: 0, success: 0 };
    typeStats[t].total++;
    if (m.status === 'SUCCESS') typeStats[t].success++;
  });
  const typeSorted = Object.entries(typeStats)
    .map(([type, s]) => ({ type: type as MissionType, rate: s.total ? Math.round((s.success / s.total) * 100) : 0, ...s }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // 실천자 통계
  const myMissionsAsPerformer = missions.filter((m) => m.assigneeId === currentUser.id);
  const successMissions = myMissionsAsPerformer.filter((m) => m.status === 'SUCCESS');
  const successRate = myMissionsAsPerformer.length > 0
    ? Math.round((successMissions.length / myMissionsAsPerformer.length) * 100)
    : 0;

  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

  const handleStartEditName = () => {
    setNameInput(currentUser.name);
    setEditingName(true);
  };
  const handleSaveName = () => {
    if (nameInput.trim()) updateUserName(currentUser.id, nameInput);
    setEditingName(false);
  };

  const handleCopyCode = async () => {
    if (!currentUser.code) return;
    await navigator.clipboard.writeText(currentUser.code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 1500);
  };

  const handleConnect = async () => {
    if (!connectCode.trim()) return;
    const isChild = currentUser.role === 'CHILD';
    const result = await connectByCode(connectCode.trim());
    const messages: Record<typeof result, string> = {
      OK: isChild ? '연결됐어요! 이제 미션을 받을 수 있어요 🎉' : '실천자를 추가했어요! 이제 미션을 줄 수 있어요 🎉',
      NOT_FOUND: '코드를 찾을 수 없어요. 다시 확인해주세요',
      SELF: '내 코드는 입력할 수 없어요',
      ALREADY_LINKED: '이미 연결된 상태예요',
      INVALID_ROLE: isChild ? '리더 코드를 입력해주세요' : '실천자 코드를 입력해주세요',
    };
    setConnectMsg({ ok: result === 'OK', text: messages[result] });
    if (result === 'OK') setConnectCode('');
  };

  const teacherMenuItems = [
    { icon: Star, label: '포인트 내역', sub: `${transactions.length}건`, to: '/points', color: 'text-amber-500' },
    { icon: Gift, label: '쿠폰 교환 내역', sub: `${exchanges.length}건`, to: null, color: 'text-purple-500' },
    { icon: BookOpen, label: '미션 관리', sub: `총 ${myMissions.length}개`, to: '/missions', color: 'text-blue-500' },
    { icon: Trophy, label: '포인트 랭킹', sub: `${myStudents.length}명`, to: '/ranking', color: 'text-indigo-500' },
  ];

  const studentMenuItems = [
    { icon: Star, label: '포인트 내역', sub: `${transactions.length}건`, to: '/points', color: 'text-amber-500' },
    { icon: Gift, label: '쿠폰 교환 내역', sub: `${exchanges.length}건`, to: null, color: 'text-purple-500' },
    { icon: Target, label: '미션 히스토리', sub: `총 ${myMissionsAsPerformer.length}개`, to: '/missions', color: 'text-blue-500' },
  ];

  const menuItems = isFacilitator ? teacherMenuItems : studentMenuItems;

  return (
    <div className="page-container">
      <Header title="👤 내 정보" showBack={false} showPoints={false} />
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      <div className="content-area px-4 py-5 space-y-4">
        {/* 프로필 카드 */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className={`${isFacilitator ? 'bg-gradient-to-br from-slate-700 to-slate-900' : 'bg-gradient-to-br from-purple-500 to-indigo-600'} rounded-3xl p-6 text-white shadow-xl`}>
          <div className="flex items-center gap-4">
            <button onClick={handleImageClick} disabled={uploading} className="relative w-20 h-20 flex-shrink-0 group">
              <div className="w-20 h-20 bg-white/20 rounded-3xl overflow-hidden flex items-center justify-center shadow-lg">
                {currentUser.profileImage ? (
                  <img src={currentUser.profileImage} alt="프로필" className="w-full h-full object-cover" />
                ) : <span className="text-5xl">{currentUser.avatar}</span>}
              </div>
              <div className="absolute inset-0 rounded-3xl bg-black/30 opacity-0 group-active:opacity-100 flex items-center justify-center transition-opacity">
                {uploading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Camera size={22} className="text-white" />}
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md">
                <Camera size={14} className={isFacilitator ? 'text-slate-700' : 'text-purple-600'} />
              </div>
            </button>
            <div className="flex-1">
              <div className="text-white/70 text-xs mb-0.5">{roleLabel[currentUser.role]}</div>
              <h2 className="font-black text-2xl">{currentUser.name}</h2>
              <div className="mt-1 bg-white/20 rounded-xl px-3 py-1 inline-flex items-center gap-1">
                <span className="text-sm">⭐</span>
                <span className="font-black">{formatPoint(currentUser.point)}P</span>
              </div>
            </div>
          </div>
          <div className="mt-4 text-white/60 text-xs">가입: {formatDate(currentUser.createdAt)}</div>
        </motion.div>

        {/* 리더 통계 */}
        {isFacilitator ? (
          <div className="space-y-4">

            {/* 핵심 요약 */}
            <p className="text-xs font-bold text-gray-500 px-1">📊 관리 통계</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Users, value: myStudents.length, label: '관리 중인 실천자', color: 'text-indigo-500', iconBg: 'bg-indigo-50', to: '/performers' },
                { icon: BookOpen, value: myMissions.length, label: '생성한 미션', color: 'text-purple-500', iconBg: 'bg-purple-50', to: '/missions' },
                { icon: TrendingUp, value: `${avgWeekRate}%`, label: '이번 주 평균 수행률', color: avgWeekRate >= 70 ? 'text-emerald-500' : 'text-amber-500', iconBg: avgWeekRate >= 70 ? 'bg-emerald-50' : 'bg-amber-50', to: '/performers' },
                { icon: CheckCircle2, value: reviewedMissions, label: '검토 완료', color: 'text-blue-500', iconBg: 'bg-blue-50', to: '/approvals' },
              ].map((s, i) => (
                <motion.button key={s.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(s.to)}
                  className="bg-white rounded-2xl p-4 shadow-sm text-left active:scale-95 transition-transform">
                  <div className={`w-9 h-9 ${s.iconBg} rounded-xl flex items-center justify-center mb-2`}>
                    <s.icon size={18} className={s.color} />
                  </div>
                  <p className={`font-black text-2xl ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                  <p className="text-[10px] text-gray-300 mt-1">탭하여 보기 →</p>
                </motion.button>
              ))}
            </div>
            <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
              onClick={() => navigate('/points')}
              className="w-full bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between active:scale-95 transition-transform">
              <div>
                <p className="text-xs text-gray-500">누적 지급 포인트</p>
                <p className="font-black text-xl text-amber-600">⭐ {formatPoint(totalPointsGiven)}P</p>
                <p className="text-[10px] text-gray-300 mt-0.5">탭하여 내역 보기 →</p>
              </div>
              <div className="text-3xl">🏆</div>
            </motion.button>

            {/* 반별 분석 */}
            {groupStats.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="bg-white rounded-3xl shadow-sm p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-black text-gray-700 flex items-center gap-2">
                    <span className="text-base">🏫</span> 반별 분석
                  </p>
                  <button onClick={() => navigate('/performers')} className="text-xs text-purple-500 font-semibold flex items-center gap-0.5">
                    전체 보기 <ChevronRight size={12} />
                  </button>
                </div>
                <div className="space-y-3">
                  {groupStats.map(({ group, members, weekRate, overallRate, unsubmitted, counseling }) => (
                    <button key={group.id} onClick={() => navigate('/performers')}
                      className="w-full text-left bg-gray-50 rounded-2xl p-3 active:scale-[0.98] transition-transform">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{group.emoji}</span>
                          <span className="font-bold text-gray-800 text-sm">{group.name}</span>
                          <span className="text-xs text-gray-400">{members.length}명</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {unsubmitted > 0 && (
                            <span className="text-[10px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded-full">미제출 {unsubmitted}</span>
                          )}
                          {counseling > 0 && (
                            <span className="text-[10px] bg-orange-100 text-orange-600 font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                              <AlertTriangle size={9} /> {counseling}명
                            </span>
                          )}
                          <ChevronRight size={13} className="text-gray-300" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-gray-400 w-14 flex-shrink-0">이번 주</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${weekRate}%` }} transition={{ duration: 0.8, delay: 0.3 }}
                              className={`h-1.5 rounded-full ${weekRate >= 70 ? 'bg-emerald-500' : weekRate >= 40 ? 'bg-amber-400' : 'bg-red-400'}`} />
                          </div>
                          <span className={`text-xs font-black w-8 text-right flex-shrink-0 ${weekRate >= 70 ? 'text-emerald-600' : weekRate >= 40 ? 'text-amber-600' : 'text-red-600'}`}>{weekRate}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-gray-400 w-14 flex-shrink-0">전체</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${overallRate}%` }} transition={{ duration: 0.8, delay: 0.4 }}
                              className="h-1.5 rounded-full bg-indigo-400" />
                          </div>
                          <span className="text-xs font-black w-8 text-right flex-shrink-0 text-indigo-600">{overallRate}%</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 실천자 상태 분포 */}
            {myStudents.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="bg-white rounded-3xl shadow-sm p-5">
                <p className="text-sm font-black text-gray-700 mb-4 flex items-center gap-2">
                  <span className="text-base">👥</span> 실천자 상태 분포
                </p>
                <div className="grid grid-cols-5 gap-2 mb-3">
                  {statusDist.map(({ status, count, label, color, bg }) => {
                    const filterKey = status === 'UNSUBMITTED' ? 'unsubmitted' : status === 'COUNSELING' ? 'counseling' : status === 'CAUTION' ? 'caution' : status === 'NOT_STARTED' ? 'notStarted' : 'excellent';
                    return (
                      <button key={status} onClick={() => navigate('/performers', { state: { filter: filterKey } })}
                        className={`${bg} rounded-2xl p-2.5 text-center active:scale-95 transition-transform`}>
                        <p className={`font-black text-xl ${color}`}>{count}</p>
                        <p className={`text-[10px] font-semibold ${color} mt-0.5`}>{label}</p>
                      </button>
                    );
                  })}
                </div>
                <div className="flex rounded-full overflow-hidden h-2.5 gap-0.5">
                  {statusDist.map(({ status, count }) => {
                    const pct = myStudents.length > 0 ? (count / myStudents.length) * 100 : 0;
                    const barColor = status === 'EXCELLENT' ? 'bg-emerald-400' : status === 'CAUTION' ? 'bg-amber-400' : status === 'UNSUBMITTED' ? 'bg-orange-400' : status === 'NOT_STARTED' ? 'bg-gray-300' : 'bg-red-400';
                    return pct > 0 ? (
                      <motion.div key={status} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.35 }}
                        className={`${barColor} h-full rounded-full`} />
                    ) : null;
                  })}
                </div>
                <p className="text-[10px] text-gray-400 text-center mt-2">각 상태 탭하면 해당 실천자 목록으로 이동</p>
              </motion.div>
            )}

            {/* 미션 유형별 수행률 */}
            {typeSorted.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                className="bg-white rounded-3xl shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-black text-gray-700 flex items-center gap-2">
                    <span className="text-base">📚</span> 미션 유형별 현황
                  </p>
                  <button onClick={() => navigate('/missions')} className="text-xs text-purple-500 font-semibold flex items-center gap-0.5">
                    전체 <ChevronRight size={12} />
                  </button>
                </div>
                <div className="space-y-3">
                  {typeSorted.map((t) => (
                    <button key={t.type} onClick={() => navigate('/missions')}
                      className="w-full text-left active:opacity-60 transition-opacity">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs font-semibold text-gray-600">{missionTypeLabel[t.type] ?? t.type}</span>
                        <span className="text-xs text-gray-400">{t.success}/{t.total}개 · <span className={`font-bold ${t.rate >= 70 ? 'text-emerald-600' : t.rate >= 40 ? 'text-amber-600' : 'text-red-500'}`}>{t.rate}%</span></span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${t.rate}%` }} transition={{ duration: 0.8, delay: 0.4 }}
                          className={`h-1.5 rounded-full ${t.rate >= 70 ? 'bg-emerald-500' : t.rate >= 40 ? 'bg-amber-400' : 'bg-red-400'}`} />
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

          </div>
        ) : (
          // 실천자 통계
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Trophy, value: successMissions.length, label: '완료한 미션', color: 'text-amber-400' },
              { icon: Target, value: `${successRate}%`, label: '미션 성공률', color: 'text-blue-400' },
              { icon: '📺', value: todayAdCount, label: '오늘 광고 시청', isEmoji: true },
              { icon: Gift, value: exchanges.length, label: '교환한 쿠폰', color: 'text-pink-400' },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl p-4 shadow-sm text-center">
                {s.isEmoji
                  ? <span className="text-xl block mb-1">{s.icon as string}</span>
                  : <s.icon size={22} className={(s as { color: string }).color + ' mx-auto mb-1'} />}
                <p className="font-black text-2xl text-gray-800">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* 메뉴 */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-white rounded-3xl shadow-sm overflow-hidden">
          {menuItems.map((item, i) => (
            <button key={item.label} onClick={() => item.to && navigate(item.to)}
              className={`w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors ${i < menuItems.length - 1 ? 'border-b border-gray-50' : ''}`}>
              <item.icon size={20} className={item.color} />
              <div className="flex-1 text-left">
                <p className="text-gray-800 font-semibold text-sm">{item.label}</p>
                <p className="text-gray-400 text-xs">{item.sub}</p>
              </div>
              <ChevronRight size={16} className="text-gray-300" />
            </button>
          ))}
        </motion.div>

        {/* 최근 쿠폰 교환 */}
        {exchanges.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl shadow-sm p-5">
            <p className="section-title">🎁 최근 쿠폰 교환</p>
            <div className="space-y-2">
              {exchanges.slice(0, 3).map((ex) => {
                const coupon = useShopStore.getState().getCoupon(ex.couponId);
                return (
                  <div key={ex.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{coupon?.emoji ?? '🎁'}</span>
                      <p className="text-sm text-gray-700 font-medium">{coupon?.name ?? '알 수 없음'}</p>
                    </div>
                    <p className="text-orange-500 font-bold text-sm">-{formatPoint(ex.usedPoint)}P</p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* 계정 설정 */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl shadow-sm overflow-hidden">
          <p className="text-xs font-bold text-gray-400 px-5 pt-4 pb-2">⚙️ 계정 설정</p>

          {/* 계정 정보 (읽기전용) */}
          <div className="px-5 pb-3 flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0 text-base">
              {currentUser.socialProvider === 'GOOGLE' ? '🇬' : currentUser.socialProvider === 'KAKAO' ? '💬' : currentUser.socialProvider === 'NAVER' ? '🟢' : '🔑'}
            </div>
            <div className="flex-1">
              <p className="text-gray-800 font-semibold text-sm">
                {currentUser.socialProvider === 'GOOGLE' ? 'Google' : currentUser.socialProvider === 'KAKAO' ? '카카오' : currentUser.socialProvider === 'NAVER' ? '네이버' : '일반'} 계정
              </p>
              <p className="text-gray-400 text-xs truncate">{currentUser.email ?? currentUser.id}</p>
            </div>
          </div>
          <div className="mx-5 border-t border-gray-50" />

          {/* 이름 수정 */}
          <div className="px-5 pb-3">
            <AnimatePresence mode="wait">
              {editingName ? (
                <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2">
                  <input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                    autoFocus
                    maxLength={20}
                    className="flex-1 border-2 border-purple-300 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-purple-500"
                    placeholder="새 이름 입력"
                  />
                  <button onClick={handleSaveName}
                    className="w-9 h-9 bg-purple-500 text-white rounded-xl flex items-center justify-center active:scale-90 transition-all">
                    <Check size={16} />
                  </button>
                  <button onClick={() => setEditingName(false)}
                    className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center active:scale-90 transition-all">
                    <X size={16} className="text-gray-500" />
                  </button>
                </motion.div>
              ) : (
                <motion.button key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={handleStartEditName}
                  className="w-full flex items-center gap-3 py-2 active:opacity-60 transition-opacity">
                  <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Pencil size={16} className="text-purple-500" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-gray-800 font-semibold text-sm">이름 수정</p>
                    <p className="text-gray-400 text-xs">{currentUser.name}</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-300" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* 실천자 상태 기준 설정 (리더 전용) */}
          {isFacilitator && (
            <button onClick={() => navigate('/profile/status-settings')}
              className="w-full flex items-center gap-3 px-5 py-3 border-t border-gray-50 hover:bg-gray-50 active:bg-gray-100 transition-colors">
              <div className="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <SlidersHorizontal size={16} className="text-violet-500" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-gray-800 font-semibold text-sm">실천자 상태 기준 설정</p>
                <p className="text-gray-400 text-xs">미제출·상담필요·우수 기준 조정</p>
              </div>
              <ChevronRight size={16} className="text-gray-300" />
            </button>
          )}

          {/* 프로필 사진 변경 */}
          <button onClick={handleImageClick}
            className="w-full flex items-center gap-3 px-5 py-3 border-t border-gray-50 hover:bg-gray-50 active:bg-gray-100 transition-colors">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Camera size={16} className="text-blue-500" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-gray-800 font-semibold text-sm">프로필 사진 변경</p>
              <p className="text-gray-400 text-xs">탭하여 사진 선택</p>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </button>

          {/* 로그아웃 */}
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-5 py-4 border-t border-gray-50 hover:bg-red-50 active:bg-red-100 transition-colors">
            <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <LogOut size={16} className="text-red-500" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-red-500 font-semibold text-sm">로그아웃</p>
            </div>
            <ChevronRight size={16} className="text-red-300" />
          </button>
        </motion.div>

        {/* 계정 연결 */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-white rounded-3xl shadow-sm overflow-hidden p-5">
          <p className="text-xs font-bold text-gray-400 pb-3">🔗 계정 연결</p>

          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <KeyRound size={16} className="text-indigo-500" />
            </div>
            <div className="flex-1">
              <p className="text-gray-400 text-xs">내 코드</p>
              <p className="text-gray-800 font-black text-lg tracking-widest">{currentUser.code ?? '------'}</p>
            </div>
            <button onClick={handleCopyCode}
              className="px-3 py-2 bg-gray-100 rounded-xl text-xs font-bold text-gray-600 active:scale-95 transition-all">
              {codeCopied ? '복사됨!' : '복사'}
            </button>
          </div>
          <p className="text-gray-400 text-[11px] mb-4">
            {currentUser.role === 'CHILD'
              ? '리더에게 이 코드를 알려주면 바로 연결돼요'
              : '실천자에게 이 코드를 알려주면 바로 추가할 수 있어요'}
          </p>

          <div className="border-t border-gray-50 pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Link2 size={14} className="text-gray-400" />
              <p className="text-gray-700 font-semibold text-sm">
                {currentUser.role === 'CHILD' ? '리더 코드 입력' : '실천자 코드 입력'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                value={connectCode}
                onChange={(e) => { setConnectCode(e.target.value.toUpperCase()); setConnectMsg(null); }}
                onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                maxLength={6}
                placeholder="코드 6자리 입력"
                className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm font-bold tracking-widest uppercase focus:outline-none focus:border-indigo-400"
              />
              <button onClick={handleConnect}
                className="px-4 py-2.5 bg-indigo-500 text-white rounded-xl text-sm font-bold active:scale-95 transition-all">
                연결
              </button>
            </div>
            {connectMsg && (
              <p className={`text-xs mt-2 font-semibold ${connectMsg.ok ? 'text-green-500' : 'text-red-400'}`}>
                {connectMsg.text}
              </p>
            )}
          </div>
        </motion.div>

        <p className="text-center text-xs text-gray-300 pb-2">Mission Point v0.1.0 · MVP 데모</p>
      </div>
    </div>
  );
}
