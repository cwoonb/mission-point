import type { MissionStatus, UserRole } from '../types';

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
  PARENT: '리더',
  TEACHER: '리더',
  CHILD: '실천자',
};

export const submissionTypeLabel = {
  IMAGE: '이미지',
  TEXT: '텍스트',
  BOTH: '이미지 + 텍스트',
} as const;
