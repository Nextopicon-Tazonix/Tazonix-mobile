// Types mirror CONTRACT.md "Shared shapes".
export type Role = 'TALENT' | 'SEEKER' | 'ORGANIZER' | 'ADMIN';
export type AccountStatus = 'PENDING_EMAIL' | 'PENDING_REVIEW' | 'ACTIVE' | 'SUSPENDED' | 'DELETED';
export type Visibility = 'PUBLIC' | 'PRIVATE' | 'SEMI_PRIVATE';
export type CompStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'WINNER_CONFIRMED';
export type CompPhase = 'UPCOMING' | 'SUBMISSIONS_OPEN' | 'VOTING' | 'CLOSED';
export type EntryStatus = 'PROCESSING' | 'PUBLISHED' | 'WITHDRAWN' | 'DISQUALIFIED';
export type MediaStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'HELD' | 'BLOCKED' | 'FAILED';
export type MediaKind = 'IMAGE' | 'VIDEO' | 'AUDIO';
export type OpportunityType = 'AUDITION' | 'GIG' | 'CASTING' | 'JOB' | 'COLLAB';
export type AppStatus = 'SUBMITTED' | 'SHORTLISTED' | 'REJECTED' | 'HIRED' | 'WITHDRAWN';
export type InviteType = 'AUDITION' | 'BOOKING' | 'COLLAB' | 'GENERAL';
export type InviteStatus = 'SENT' | 'ACCEPTED' | 'DECLINED';
export type BookingStatus = 'REQUESTED' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED' | 'COMPLETED';
export type SubStatus = 'ACTIVE' | 'CANCELED' | 'EXPIRED' | 'PAST_DUE';
export type PayoutStatus = 'REQUESTED' | 'PAID' | 'REJECTED';
export type ReportTarget = 'ACCOUNT' | 'COMPETITION' | 'ENTRY' | 'COMMENT';

export interface Media {
  id: string;
  kind: MediaKind;
  status: MediaStatus;
  /** Signed, expiring links; null until the media is READY. */
  url: string | null;
  /** HLS playlist for processed videos. */
  playbackUrl?: string | null;
  posterUrl?: string | null;
  mimeType: string;
  sizeBytes: number;
  durationSec?: number | null;
  width?: number | null;
  height?: number | null;
}

export interface AccountMini {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  roles: Role[];
}

export interface Genre {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
}

export interface TalentProfileOwn {
  headline: string | null;
  bio: string | null;
  genreIds: string[];
  skills: string[];
  experienceYears: number | null;
  isAvailable: boolean;
  isDiscoverable: boolean;
  rateMinMinor: number | null;
  rateMaxMinor: number | null;
  rateCurrency: string | null;
  instagram: string | null;
  tiktok: string | null;
  youtube: string | null;
  website: string | null;
}

export interface OrgProfile {
  orgName: string | null;
  orgType: string | null;
  website: string | null;
  about: string | null;
  verified: boolean;
}

export interface Entitlements {
  contactTalent: boolean;
  postOpportunities: boolean;
  createCompetitions: boolean;
  aiMatchesPerMonth: number;
  aiMatchesUsed: number;
}

export interface MySubscription {
  id: string;
  planCode: PlanCode;
  planName: string;
  status: SubStatus;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export interface Me {
  id: string;
  email: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  phone: string | null;
  roles: Role[];
  adminScopes: string[];
  status: AccountStatus;
  emailVerified: boolean;
  country: string | null;
  region: string | null;
  city: string | null;
  createdAt: string;
  talentProfile: TalentProfileOwn | null;
  orgProfile: OrgProfile | null;
  subscription: MySubscription | null;
  entitlements: Entitlements;
}

export interface TalentCard {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  headline: string | null;
  genres: Genre[];
  skills: string[];
  country: string | null;
  city: string | null;
  isAvailable: boolean;
  verified: boolean;
  wins: number;
}

export interface PortfolioItem {
  id: string;
  caption: string | null;
  media: Media;
}

export interface TalentPublic extends TalentCard {
  bio: string | null;
  experienceYears: number | null;
  portfolio: PortfolioItem[];
  social: { instagram: string | null; tiktok: string | null; youtube: string | null; website: string | null };
  entries: EntryCard[];
  contact: { email: string | null; phone: string | null } | null;
  shortlisted: boolean;
}

export interface Competition {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  rules: string | null;
  genre: Genre;
  visibility: Visibility;
  status: CompStatus;
  phase: CompPhase;
  startsAt: string;
  submissionEndsAt: string;
  votingEndsAt: string;
  acceptedMedia: MediaKind[];
  maxDurationSec: number | null;
  rewardAmountMinor: number;
  rewardCurrency: string;
  prizeDescription: string | null;
  website: string | null;
  sponsorImageUrl: string | null;
  organizer: AccountMini;
  entryCount: number;
  voteRule: 'ONE_PER_COMPETITION';
  myEntryId: string | null;
  myVoteEntryId: string | null;
  hasAccess: boolean;
  reminderSet: boolean;
  rejectionReason?: string | null;
}

export interface EntryCard {
  id: string;
  title: string;
  status: EntryStatus;
  isWinner: boolean;
  voteCount: number;
  likeCount: number;
  commentCount: number;
  media: Media | null;
  account: AccountMini;
  competition: { id: string; slug: string; title: string; phase: CompPhase };
  createdAt: string;
  likedByMe: boolean;
  votedByMe: boolean;
}

export type EntryDetail = Omit<EntryCard, 'competition'> & { competition: Competition };

export interface Comment {
  id: string;
  body: string;
  account: AccountMini;
  likeCount: number;
  likedByMe: boolean;
  createdAt: string;
}

export interface Opportunity {
  id: string;
  type: OpportunityType;
  title: string;
  description: string;
  genre: Genre | null;
  country: string | null;
  city: string | null;
  remote: boolean;
  compensation: string | null;
  deadline: string | null;
  owner: AccountMini;
  applicationCount: number;
  myApplicationStatus: AppStatus | null;
  createdAt: string;
  closed: boolean;
}

export interface Application {
  id: string;
  status: AppStatus;
  message: string | null;
  createdAt: string;
  talent: TalentCard;
  opportunity: { id: string; title: string };
}

export interface Invitation {
  id: string;
  type: InviteType;
  subject: string;
  message: string;
  status: InviteStatus;
  responseMessage: string | null;
  sender: AccountMini;
  talent: AccountMini;
  conversationId: string | null;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participants: AccountMini[];
  lastMessage: { body: string; createdAt: string; senderId: string } | null;
  unreadCount: number;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
}

export interface Booking {
  id: string;
  status: BookingStatus;
  eventDate: string;
  venue: string;
  details: string | null;
  feeMinor: number;
  currency: string;
  seeker: AccountMini;
  talent: AccountMini;
  createdAt: string;
}

export type PlanCode = 'FREE' | 'SCOUT' | 'AGENCY' | 'BRAND';
export interface Plan {
  id: string;
  code: PlanCode;
  name: string;
  priceMinor: number;
  currency: string;
  interval: 'month';
  features: string[];
  limits: { contactTalent: boolean; postOpportunities: boolean; createCompetitions: boolean; aiMatchesPerMonth: number };
}

export interface WalletTx {
  id: string;
  reference: string;
  type: string;
  status: string;
  amountMinor: number;
  currency: string;
  description: string | null;
  createdAt: string;
}

export interface Payout {
  id: string;
  amountMinor: number;
  currency: string;
  status: PayoutStatus;
  method: string;
  note: string | null;
  createdAt: string;
}

export interface Wallet {
  balances: { currency: string; availableMinor: number; pendingMinor: number }[];
  transactions: WalletTx[];
  payouts: Payout[];
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: Me;
  devEmailToken?: string;
}

export interface AiMatchResult {
  results: { talent: TalentCard; score: number; reason: string }[];
  usedAi: boolean;
}
