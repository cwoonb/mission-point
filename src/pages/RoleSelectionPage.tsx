import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import type { UserRole } from '../types';

const ROLES: Array<{
  role: UserRole;
  emoji: string;
  title: string;
  desc: string;
  examples: string;
  gradient: string;
  lightBg: string;
  textColor: string;
}> = [
  {
    role: 'PARENT',
    emoji: '👨‍👩‍👧‍👦',
    title: '부모님',
    desc: '자녀에게 미션을 부여하고 포인트를 지급해요',
    examples: '미션 생성 · 승인/반려 · 포인트 관리',
    gradient: 'from-violet-500 to-purple-600',
    lightBg: 'bg-purple-50 border-purple-200',
    textColor: 'text-purple-700',
  },
  {
    role: 'TEACHER',
    emoji: '👩‍🏫',
    title: '선생님',
    desc: '학생들에게 학습 미션을 부여하고 관리해요',
    examples: '미션 설계 · 진행 관리 · 성취 확인',
    gradient: 'from-blue-500 to-indigo-600',
    lightBg: 'bg-blue-50 border-blue-200',
    textColor: 'text-blue-700',
  },
  {
    role: 'CHILD',
    emoji: '🧒',
    title: '어린이 / 학생',
    desc: '미션을 완료하고 포인트로 선물을 받아요',
    examples: '미션 수행 · 포인트 적립 · 쿠폰 교환',
    gradient: 'from-pink-400 to-rose-500',
    lightBg: 'bg-pink-50 border-pink-200',
    textColor: 'text-pink-700',
  },
];

export default function RoleSelectionPage() {
  const navigate = useNavigate();
  const { pendingSocialProfile, completeSocialRegistration, clearPendingProfile } = useAuthStore();

  const pendingInviteId = sessionStorage.getItem('pending_invite_id');

  if (!pendingSocialProfile) {
    navigate('/login', { replace: true });
    return null;
  }

  const handleSelect = async (role: UserRole) => {
    const facilitatorId = role === 'CHILD' && pendingInviteId ? pendingInviteId : undefined;
    await completeSocialRegistration(role, facilitatorId);
    navigate('/', { replace: true });
  };

  const PROVIDER_LABEL: Record<string, string> = {
    GOOGLE: '구글',
    KAKAO: '카카오',
    NAVER: '네이버',
  };

  return (
    <div className="page-container min-h-screen flex flex-col bg-gradient-to-br from-purple-50 to-indigo-50">
      <div className="flex-1 overflow-y-auto px-5 py-8">
        {/* 프로필 인사 */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          {pendingSocialProfile.profileImage ? (
            <img
              src={pendingSocialProfile.profileImage}
              alt="프로필"
              className="w-20 h-20 rounded-3xl mx-auto mb-4 object-cover shadow-lg border-2 border-white"
            />
          ) : (
            <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-3xl flex items-center justify-center text-4xl shadow-lg mx-auto mb-4">
              👤
            </div>
          )}
          <p className="text-gray-500 text-sm">
            {PROVIDER_LABEL[pendingSocialProfile.socialProvider]} 계정으로 가입
          </p>
          <h1 className="text-xl font-black text-gray-800 mt-1">
            안녕하세요, {pendingSocialProfile.name}님! 👋
          </h1>
          <p className="text-gray-500 text-sm mt-2">어떤 역할로 이용하실 건가요?</p>
        </motion.div>

        {/* 초대 배너 */}
        {pendingInviteId && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-yellow-50 border-2 border-yellow-300 rounded-3xl p-4 mb-2 text-center"
          >
            <p className="text-2xl mb-1">🎉</p>
            <p className="font-black text-yellow-800 text-sm">초대를 받았어요!</p>
            <p className="text-yellow-700 text-xs mt-1">
              <span className="font-bold">수행자</span>로 가입하면 초대한 분과 바로 연결돼요
            </p>
          </motion.div>
        )}

        {/* 역할 선택 카드 */}
        <div className="flex flex-col gap-4">
          {ROLES.map((r, i) => (
            <motion.button
              key={r.role}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSelect(r.role)}
              className={`w-full border-2 ${r.lightBg} rounded-3xl p-5 flex items-center gap-4 text-left transition-all`}
            >
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${r.gradient} flex items-center justify-center text-3xl shadow-lg flex-shrink-0`}
              >
                {r.emoji}
              </div>
              <div className="flex-1">
                <p className={`font-black text-lg ${r.textColor}`}>{r.title}</p>
                <p className="text-gray-600 text-xs mt-0.5 leading-relaxed">{r.desc}</p>
                <p className="text-gray-400 text-[11px] mt-1.5">{r.examples}</p>
              </div>
              <span className="text-gray-300 text-xl flex-shrink-0">›</span>
            </motion.button>
          ))}
        </div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          onClick={() => { clearPendingProfile(); navigate('/login', { replace: true }); }}
          className="w-full mt-6 py-3 text-gray-400 text-sm"
        >
          돌아가기
        </motion.button>
      </div>
    </div>
  );
}
