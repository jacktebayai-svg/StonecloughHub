import { z } from 'zod';

// =======================================
// BUSINESS MANAGEMENT SCHEMAS
// =======================================

export const businessCategorySchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  description: z.string(),
  icon: z.string().optional(),
  parentId: z.string().optional(),
  displayOrder: z.number().optional(),
  lastUpdated: z.date()
});

export const businessSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  ownerId: z.string(), // Links to user ID
  description: z.string(),
  shortDescription: z.string().max(280).optional(),
  logoUrl: z.string().optional(),
  coverImageUrl: z.string().optional(),
  address: z.string(),
  ward: z.string().optional(),
  postcode: z.string(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  socialLinks: z.record(z.string().url()).optional(),
  categoryIds: z.array(z.string()),
  tags: z.array(z.string()).optional(),
  founded: z.date().optional(),
  employeeCount: z.number().optional(),
  verified: z.boolean().default(false),
  featured: z.boolean().default(false),
  openingHours: z.record(z.string()).optional(), // e.g. {"monday": "9am-5pm"}
  services: z.array(z.string()).optional(),
  amenities: z.array(z.string()).optional(),
  photosUrls: z.array(z.string()).optional(),
  avgRating: z.number().optional(),
  reviewCount: z.number().default(0),
  status: z.enum(['active', 'pending', 'suspended']).default('pending'),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const businessReviewSchema = z.object({
  id: z.string().optional(),
  businessId: z.string(),
  userId: z.string(),
  rating: z.number().min(1).max(5),
  title: z.string().optional(),
  content: z.string(),
  photosUrls: z.array(z.string()).optional(),
  helpfulCount: z.number().default(0),
  ownerResponse: z.string().optional(),
  ownerResponseDate: z.date().optional(),
  status: z.enum(['published', 'pending', 'rejected']).default('pending'),
  reportCount: z.number().default(0),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const businessServiceSchema = z.object({
  id: z.string().optional(),
  businessId: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.string().optional(),
  duration: z.string().optional(),
  imageUrl: z.string().optional(),
  isHighlighted: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const businessClaimSchema = z.object({
  id: z.string().optional(),
  businessId: z.string(),
  userId: z.string(),
  status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  evidence: z.string().optional(),
  documentUrls: z.array(z.string()).optional(),
  adminNotes: z.string().optional(),
  createdAt: z.date(),
  processedAt: z.date().optional(),
  processedBy: z.string().optional()
});

export const businessPromotionSchema = z.object({
  id: z.string().optional(),
  businessId: z.string(),
  title: z.string(),
  description: z.string(),
  imageUrl: z.string().optional(),
  startDate: z.date(),
  endDate: z.date(),
  promoCode: z.string().optional(),
  discountValue: z.string().optional(),
  termsAndConditions: z.string().optional(),
  status: z.enum(['active', 'scheduled', 'ended', 'cancelled']).default('scheduled'),
  impressions: z.number().default(0),
  clicks: z.number().default(0),
  createdAt: z.date(),
  updatedAt: z.date()
});

// =======================================
// DISCUSSIONS BOARD SCHEMAS
// =======================================

export const discussionCategorySchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  description: z.string(),
  slug: z.string(),
  icon: z.string().optional(),
  color: z.string().optional(),
  parentId: z.string().optional(),
  displayOrder: z.number().optional(),
  restricted: z.boolean().default(false),
  allowedRoles: z.array(z.string()).optional(),
  postCount: z.number().default(0),
  lastPostId: z.string().optional(),
  lastPostAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const discussionTopicSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  slug: z.string(),
  categoryId: z.string(),
  userId: z.string(),
  content: z.string(),
  tags: z.array(z.string()).optional(),
  pinned: z.boolean().default(false),
  locked: z.boolean().default(false),
  viewCount: z.number().default(0),
  replyCount: z.number().default(0),
  upvotes: z.number().default(0),
  downvotes: z.number().default(0),
  lastReplyId: z.string().optional(),
  lastReplyAt: z.date().optional(),
  lastReplyUserId: z.string().optional(),
  status: z.enum(['published', 'pending', 'hidden']).default('published'),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const discussionReplySchema = z.object({
  id: z.string().optional(),
  topicId: z.string(),
  userId: z.string(),
  content: z.string(),
  parentId: z.string().optional(), // For threaded replies
  upvotes: z.number().default(0),
  downvotes: z.number().default(0),
  acceptedAnswer: z.boolean().default(false),
  status: z.enum(['published', 'pending', 'hidden']).default('published'),
  editedAt: z.date().optional(),
  attachments: z.array(z.string()).optional(),
  reportCount: z.number().default(0),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const discussionVoteSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  itemId: z.string(), // Can be topic ID or reply ID
  itemType: z.enum(['topic', 'reply']),
  voteType: z.enum(['up', 'down']),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const discussionBookmarkSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  topicId: z.string(),
  notes: z.string().optional(),
  createdAt: z.date()
});

export const discussionReportSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  itemId: z.string(), // Can be topic ID, reply ID, or review ID
  itemType: z.enum(['topic', 'reply', 'review']),
  reason: z.enum(['spam', 'offensive', 'off-topic', 'inappropriate', 'other']),
  details: z.string().optional(),
  status: z.enum(['pending', 'reviewed', 'resolved']).default('pending'),
  adminNotes: z.string().optional(),
  createdAt: z.date(),
  resolvedAt: z.date().optional(),
  resolvedBy: z.string().optional()
});

// =======================================
// TYPES EXPORT
// =======================================

export type BusinessCategory = z.infer<typeof businessCategorySchema>;
export type Business = z.infer<typeof businessSchema>;
export type BusinessReview = z.infer<typeof businessReviewSchema>;
export type BusinessService = z.infer<typeof businessServiceSchema>;
export type BusinessClaim = z.infer<typeof businessClaimSchema>;
export type BusinessPromotion = z.infer<typeof businessPromotionSchema>;

export type DiscussionCategory = z.infer<typeof discussionCategorySchema>;
export type DiscussionTopic = z.infer<typeof discussionTopicSchema>;
export type DiscussionReply = z.infer<typeof discussionReplySchema>;
export type DiscussionVote = z.infer<typeof discussionVoteSchema>;
export type DiscussionBookmark = z.infer<typeof discussionBookmarkSchema>;
export type DiscussionReport = z.infer<typeof discussionReportSchema>;
