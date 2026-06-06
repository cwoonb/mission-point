import type { MissionStatus, PointTransactionType, UserRole } from '../types';

export const formatPoint = (p: number) => p.toLocaleString('ko-KR');

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export const getDaysLeft = (endDate: string) => {
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const statusLabel: Record<MissionStatus, string> = {
  PENDING: '대기중',
  IN_PROGRESS: '진행중',
  REVIEWING: '확인중',
  SUCCESS: '성공 🎉',
  REJECTED: '반려',
  FAILED: '실패',
  EXPIRED: '만료',
};

export const statusBgColor: Record<MissionStatus, string> = {
  PENDING: 'bg-gray-100 text-gray-500',
  IN_PROGRESS: 'bg-blue-100 text-blue-600',
  REVIEWING: 'bg-amber-100 text-amber-600',
  SUCCESS: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-600',
  FAILED: 'bg-gray-200 text-gray-500',
  EXPIRED: 'bg-gray-100 text-gray-400',
};

export const roleLabel: Record<UserRole, string> = {
  PARENT: '부모',
  TEACHER: '선생님',
  CHILD: '어린이',
};

export const txLabel: Record<PointTransactionType, string> = {
  MISSION_REWARD: '미션 보상 🎯',
  MISSION_DEDUCT: '미션 포인트 지급',
  AD_REWARD: '광고 시청 📺',
  COUPON_EXCHANGE: '쿠폰 교환 🎁',
  ADMIN_GRANT: '관리자 지급',
  ADMIN_DEDUCT: '관리자 차감',
};

export const txColor: Record<PointTransactionType, string> = {
  MISSION_REWARD: 'text-green-600',
  MISSION_DEDUCT: 'text-red-500',
  AD_REWARD: 'text-purple-600',
  COUPON_EXCHANGE: 'text-orange-600',
  ADMIN_GRANT: 'text-blue-600',
  ADMIN_DEDUCT: 'text-red-500',
};

export const txSign = (amount: number) => (amount >= 0 ? `+${formatPoint(amount)}P` : `${formatPoint(amount)}P`);

export const submissionTypeLabel = {
  IMAGE: '이미지',
  TEXT: '텍스트',
  BOTH: '이미지 + 텍스트',
} as const;
