import {
  Comment,
  Conversation,
  ExploreHub,
  FriendRequestState,
  LaunchSummary,
  MarketplaceCategory,
  MarketplaceListing,
  Message,
  ModerationLog,
  ModerationOverview,
  ModerationReport,
  NotificationItem,
  Page,
  Post,
  Reel,
  Relationship,
  SocialGroup,
  Status,
  Story,
  User,
  WalletSummary,
} from "./domain";

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: User;
};

export type FeedResponse = Post[];
export type CommentResponse = Comment;
export type ChatListResponse = Conversation[];
export type MessageListResponse = Message[];
export type NotificationResponse = NotificationItem[];
export type StoryResponse = Story[];
export type RelationshipResponse = Relationship;
export type FriendRequestResponse = FriendRequestState;
export type PageResponse = Page[];
export type GroupResponse = SocialGroup[];
export type MarketplaceListingResponse = MarketplaceListing[];
export type MarketplaceCategoryResponse = MarketplaceCategory[];
export type LaunchResponse = LaunchSummary;
export type ExploreHubResponse = ExploreHub;
export type StatusResponse = Status[];
export type ReelResponse = Reel[];
export type ModerationReportResponse = ModerationReport[];
export type ModerationLogResponse = ModerationLog[];
export type ModerationOverviewResponse = ModerationOverview;
export type WalletSummaryResponse = WalletSummary;

export type MediaUploadResponse = {
  publicId: string;
  secureUrl: string;
  width?: number | null;
  height?: number | null;
  bytes: number;
  format?: string | null;
  resourceType: string;
  originalFilename: string;
};
