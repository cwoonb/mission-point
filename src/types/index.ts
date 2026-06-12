export type UserRole = 'PARENT' | 'TEACHER' | 'CHILD';
export type MissionType = 'HOMEWORK' | 'VOCABULARY' | 'READING' | 'ATTENDANCE' | 'REVIEW_NOTES' | 'LIFESTYLE' | 'OTHER';
export type MissionGoal = 'SINCERITY' | 'STUDY_HABIT' | 'SUBMISSION_MGMT' | 'PARENT_REPORT' | 'REWARD_EVENT';
export type RepeatType = 'ONCE' | 'DAILY' | 'WEEKLY' | 'WEEKDAYS';
export type ParentShareType = 'NONE' | 'ON_COMPLETE' | 'WEEKLY_REPORT';
export type StudentStatus = 'EXCELLENT' | 'CAUTION' | 'UNSUBMITTED' | 'COUNSELING' | 'NOT_STARTED';
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
  | 'DECORATION_PURCHASE'
  | 'ADMIN_GRANT'
  | 'ADMIN_DEDUCT';

// ── 마을 꾸미기 / 동물 주민 시스템 ──────────────────────────
export type DecorationCategory =
  | 'HOUSE'
  | 'FURNITURE'
  | 'TREE'
  | 'FLOWER'
  | 'ROAD'
  | 'FENCE'
  | 'SCHOOL'
  | 'STUDY_TOOL'
  | 'PET'
  | 'COSTUME'
  | 'THEME';

export type VillageSlotType =
  | 'HOUSE'
  | 'INTERIOR'
  | 'YARD'
  | 'GARDEN'
  | 'PATH'
  | 'SCHOOL'
  | 'RESIDENT'
  | 'BED'
  | 'DESK'
  | 'BOOKSHELF'
  | 'RUG'
  | 'WINDOW';

/** 마을 배치가 어느 화면(구역)에 속하는지 구분 */
export type VillageZone = 'HOUSE_INTERIOR' | 'HOUSE_EXTERIOR' | 'VILLAGE';

export type ItemRarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export type AcquireSource = 'PURCHASE' | 'MISSION_REWARD' | 'ACHIEVEMENT' | 'STREAK' | 'LEVEL_UP' | 'STARTER';

export type AchievementConditionType =
  | 'MISSION_COUNT'
  | 'MISSION_TYPE_COUNT'
  | 'STREAK'
  | 'VILLAGE_LEVEL';

export interface DecorationItem {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: DecorationCategory;
  slot?: VillageSlotType;
  rarity: ItemRarity;
  requiredPoint: number;
  requiredLevel: number;
  unlockMissionType?: MissionType;
  enabled: boolean;
}

export interface InventoryItem {
  id: string;
  userId: string;
  itemId: string;
  quantity: number;
  acquiredVia: AcquireSource;
  acquiredAt: string;
}

export interface Village {
  id: string;
  ownerId: string;
  name: string;
  level: number;
  exp: number;
  theme: string;
  createdAt: string;
  updatedAt: string;
}

export interface VillagePlacement {
  id: string;
  villageId: string;
  zone: VillageZone;
  slot: VillageSlotType;
  itemId: string;
  placedAt: string;
}

export interface VillageResident {
  id: string;
  name: string;
  emoji: string;
  personality: string;
  description: string;
  relatedMissionTypes: MissionType[];
  requiredLevel: number;
  unlockHint: string;
}

export interface UserResident {
  id: string;
  userId: string;
  residentId: string;
  acquiredVia: AcquireSource;
  acquiredAt: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  emoji: string;
  conditionType: AchievementConditionType;
  conditionValue: number;
  conditionMissionType?: MissionType;
  rewardPoint: number;
  rewardItemId?: string;
  rewardResidentId?: string;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  unlockedAt: string;
}

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

// ── 사람 캐릭터 시스템 ──────────────────────────────────────
export type CosmeticSlot = 'HAT' | 'GLASSES' | 'TOP' | 'BOTTOM' | 'SHOES' | 'SOCKS' | 'GLOVES' | 'BAG';
export type CharacterGender = 'A' | 'B';
export type HairStyle = 'short' | 'long' | 'ponytail' | 'curly' | 'bowl';
export type EyeShape = 'round' | 'happy' | 'sleepy' | 'star';

export interface CharacterProfile {
  id: string;
  userId: string;
  name: string;
  gender: CharacterGender;
  skinColor: string;
  hairStyle: HairStyle;
  hairColor: string;
  eyeShape: EyeShape;
  /** 슬롯별 장착중인 코스튬 id (TOP/BOTTOM/SHOES는 기본값 보유) */
  equipped: Partial<Record<CosmeticSlot, string>>;
  createdAt: string;
  updatedAt: string;
}

export interface CharacterCosmetic {
  id: string;
  name: string;
  slot: CosmeticSlot;
  emoji: string;
  color: string;
  rarity: ItemRarity;
  requiredPoint: number;
  requiredLevel: number;
  unlockMissionType?: MissionType;
  enabled: boolean;
}

export interface UserCosmetic {
  id: string;
  userId: string;
  cosmeticId: string;
  acquiredVia: AcquireSource;
  acquiredAt: string;
}
