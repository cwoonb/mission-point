export type UserRole = 'PARENT' | 'TEACHER' | 'CHILD';
export type MissionType = 'HOMEWORK' | 'VOCABULARY' | 'READING' | 'ATTENDANCE' | 'REVIEW_NOTES' | 'LIFESTYLE' | 'OTHER';
export type MissionGoal = 'SINCERITY' | 'STUDY_HABIT' | 'SUBMISSION_MGMT' | 'PARENT_REPORT';
export type RepeatType = 'ONCE' | 'DAILY' | 'WEEKLY' | 'WEEKDAYS';
export type ParentShareType = 'NONE' | 'ON_COMPLETE' | 'WEEKLY_REPORT';
export type StudentStatus = 'EXCELLENT' | 'CAUTION' | 'UNSUBMITTED' | 'COUNSELING' | 'NOT_STARTED';
export type ViewMode = 'FACILITATOR' | 'PERFORMER';
export type SocialProvider = 'GOOGLE' | 'KAKAO' | 'NAVER' | 'EMAIL';
export type MembershipRole = 'OWNER' | 'TEACHER' | 'STUDENT';
export type MembershipStatus = 'ACTIVE' | 'INVITED' | 'INACTIVE';

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
  | 'DECORATION_PURCHASE'
  | 'ADMIN_GRANT'
  | 'ADMIN_DEDUCT'
  | 'PET_FEED'
  | 'PET_EGG'
  | 'AVATAR_PURCHASE';

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

export interface Organization {
  id: string;
  name: string;
  type: string;
  ownerUserId: string;
  inviteCode?: string;
  createdAt: string;
}

export interface Membership {
  id: string;
  userId: string;
  organizationId: string;
  role: MembershipRole;
  groupId?: string;
  status: MembershipStatus;
  createdAt: string;
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
  organizationId?: string;
}

export interface MissionSubmission {
  id: string;
  missionId: string;
  userId: string;
  message?: string;
  imageUrl?: string;
  imageUrls?: string[];
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

// ── 다마고치식 펫 육성 시스템 (희귀도 / 진화) ─────────────────
export type PetRarity = 'common' | 'rare' | 'magic' | 'legendary';

export type PetSpecies =
  | 'dog'
  | 'cat'
  | 'rabbit'
  | 'chick'
  | 'dino'
  | 'fox'
  | 'slime'
  | 'unicorn'
  | 'dragon'
  | 'phoenix';

export type EggType = 'basic' | 'premium';

export interface Pet {
  id: string;
  /** 실천자(performer) userId */
  ownerId: string;
  species: PetSpecies;
  rarity: PetRarity;
  name: string;
  /** 부화 이후 성장 단계 (1부터 시작, 희귀도별 최대 단계까지) */
  stageIndex: number;
  /** 누적 경험치 (진화 판정에 사용) */
  exp: number;
  /** 전체 누적 경험치 (도감/통계용) */
  totalExp: number;
  /** 0~100, 천천히 감소하지만 바닥 이하로는 떨어지지 않음 */
  happiness: number;
  /** 알에서 부화했는지 여부 (Pet은 부화 후에만 생성됨) */
  hatched: boolean;
  /** 실천자의 현재 메인(대표) 펫인지 여부 */
  isActive: boolean;
  lastInteractedAt: string;
  createdAt: string;
}

export interface Egg {
  id: string;
  /** 실천자(performer) userId */
  ownerId: string;
  type: EggType;
  createdAt: string;
}
