export type UserRole = 'PARENT' | 'TEACHER' | 'CHILD';
export type MissionType = 'HOMEWORK' | 'VOCABULARY' | 'READING' | 'ATTENDANCE' | 'REVIEW_NOTES' | 'LIFESTYLE' | 'OTHER';
export type MissionGoal = 'SINCERITY' | 'STUDY_HABIT' | 'SUBMISSION_MGMT' | 'PARENT_REPORT' | 'REWARD_EVENT';
export type RepeatType = 'ONCE' | 'DAILY' | 'WEEKLY' | 'WEEKDAYS';
export type ParentShareType = 'NONE' | 'ON_COMPLETE' | 'WEEKLY_REPORT';
export type StudentStatus = 'EXCELLENT' | 'CAUTION' | 'UNSUBMITTED' | 'COUNSELING';
export type ViewMode = 'FACILITATOR' | 'PERFORMER';
export type SocialProvider = 'GOOGLE' | 'KAKAO' | 'NAVER';

export type MissionStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'REVIEWING'
  | 'SUCCESS'
  | 'REJECTED'
  | 'FAILED'
  | 'EXPIRED';

export type PointTransactionType =
  | 'MISSION_REWARD'
  | 'MISSION_DEDUCT'
  | 'AD_REWARD'
  | 'COUPON_EXCHANGE'
  | 'ADMIN_GRANT'
  | 'ADMIN_DEDUCT';

export type SubmissionType = 'IMAGE' | 'TEXT' | 'BOTH';
export type ReviewAction = 'APPROVED' | 'REJECTED';

export interface StatusThresholds {
  unsubmittedOverdue: number;
  counselingOverdue: number;
  counselingRate: number;
  excellentRate: number;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  point: number;
  avatar: string;
  createdAt: string;
  socialProvider?: SocialProvider;
  socialId?: string;
  email?: string;
  profileImage?: string;
  facilitatorId?: string;
  groupId?: string;
  code?: string;
  statusThresholds?: StatusThresholds;
}

export interface PendingSocialProfile {
  socialId: string;
  socialProvider: SocialProvider;
  name: string;
  email?: string;
  profileImage?: string;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  rewardPoint: number;
  creatorId: string;
  assigneeId: string;
  status: MissionStatus;
  submissionType: SubmissionType;
  startDate: string;
  endDate: string;
  createdAt: string;
  missionType?: MissionType;
  missionGoal?: MissionGoal;
  repeatType?: RepeatType;
  parentShare?: ParentShareType;
}

export interface MissionSubmission {
  id: string;
  missionId: string;
  userId: string;
  message?: string;
  imageUrl?: string;
  attemptNumber: number;
  submittedAt: string;
}

export interface MissionReviewLog {
  id: string;
  missionId: string;
  submissionId: string;
  reviewerId: string;
  action: ReviewAction;
  reason?: string;
  createdAt: string;
}

export interface PointTransaction {
  id: string;
  userId: string;
  amount: number;
  type: PointTransactionType;
  description: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  name: string;
  description: string;
  emoji: string;
  requiredPoint: number;
  stock: number;
  enabled: boolean;
  category: string;
  bgColor: string;
}

export interface PerformerGroup {
  id: string;
  name: string;
  emoji: string;
  facilitatorId: string;
  createdAt: string;
}

export interface CouponExchange {
  id: string;
  couponId: string;
  userId: string;
  usedPoint: number;
  createdAt: string;
}

export interface AdRewardLog {
  id: string;
  userId: string;
  rewardPoint: number;
  watchedAt: string;
  createdAt: string;
}
