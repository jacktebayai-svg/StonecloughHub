import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, json, pgEnum, index, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const dataTypeEnum = pgEnum('data_type', [
  'planning_application', 
  'council_spending', 
  'council_meeting', 
  'consultation',
  'council_page',
  'council_document',
  'transparency_data'
]);
export const businessCategoryEnum = pgEnum('business_category', ['restaurant_cafe', 'retail_shopping', 'health_beauty', 'professional_services', 'home_garden', 'other']);
export const forumCategoryEnum = pgEnum('forum_category', ['general', 'local_events', 'business_recommendations', 'council_planning', 'buy_sell', 'green_space']);
export const surveyStatusEnum = pgEnum('survey_status', ['draft', 'active', 'closed']);
export const userRoleEnum = pgEnum('user_role', ['user', 'moderator', 'admin']);

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User management table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default('user').notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Profiles table
export const profiles = pgTable("profiles", {
  id: varchar("id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  bio: text("bio"),
  phone: varchar("phone"),
  address: text("address"),
  profilePictureUrl: text("profile_picture_url"),
  isBusinessOwner: boolean("is_business_owner").default(false),
  isSkillProvider: boolean("is_skill_provider").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Skills table
export const skills = pgTable("skills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").unique().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User Skills junction table
export const userSkills = pgTable("user_skills", {
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  skillId: varchar("skill_id").references(() => skills.id, { onDelete: "cascade" }).notNull(),
  level: varchar("level"), // e.g., "Beginner", "Intermediate", "Expert"
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    pk: primaryKey(table.userId, table.skillId)
  };
});

// Data from Bolton Council
export const councilData = pgTable("council_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  dataType: dataTypeEnum("data_type").notNull(),
  sourceUrl: text("source_url"),
  amount: integer("amount"), // For spending data
  status: text("status"), // For planning applications
  date: timestamp("date").notNull(),
  location: text("location"),
  metadata: json("metadata"), // Additional structured data
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Business directory
export const businesses = pgTable("businesses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  category: businessCategoryEnum("category").notNull(),
  address: text("address").notNull(),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  imageUrl: text("image_url"),
  isVerified: boolean("is_verified").default(false),
  isPremium: boolean("is_premium").default(false),
  isPromoted: boolean("is_promoted").default(false),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Forum categories and discussions
export const forumDiscussions = pgTable("forum_discussions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"), // New field
  category: forumCategoryEnum("category").notNull(),
  authorId: varchar("author_id").references(() => users.id),
  authorName: text("author_name").notNull(),
  authorInitials: text("author_initials").notNull(),
  likes: integer("likes").default(0),
  views: integer("views").default(0),
  replyCount: integer("reply_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const forumReplies = pgTable("forum_replies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  discussionId: varchar("discussion_id").references(() => forumDiscussions.id).notNull(),
  content: text("content").notNull(),
  authorId: varchar("author_id").references(() => users.id),
  authorName: text("author_name").notNull(),
  authorInitials: text("author_initials").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Blog articles
export const blogArticles = pgTable("blog_articles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt").notNull(),
  category: text("category").notNull(),
  imageUrl: text("image_url"),
  readTime: integer("read_time").notNull(),
  isFeatured: boolean("is_featured").default(false),
  isPromoted: boolean("is_promoted").default(false),
  authorId: varchar("author_id").references(() => users.id),
  authorName: text("author_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Surveys
export const surveys = pgTable("surveys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: surveyStatusEnum("status").default('draft'),
  questions: json("questions").notNull(), // Array of questions
  responseCount: integer("response_count").default(0),
  createdBy: varchar("created_by").references(() => users.id),
  endsAt: timestamp("ends_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const surveyResponses = pgTable("survey_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  surveyId: varchar("survey_id").references(() => surveys.id).notNull(),
  responses: json("responses").notNull(), // Map of questionId -> answer
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const forumDiscussionsRelations = relations(forumDiscussions, ({ many }) => ({
  replies: many(forumReplies),
}));

export const forumRepliesRelations = relations(forumReplies, ({ one }) => ({
  discussion: one(forumDiscussions, {
    fields: [forumReplies.discussionId],
    references: [forumDiscussions.id],
  }),
}));

export const surveysRelations = relations(surveys, ({ many }) => ({
  responses: many(surveyResponses),
}));

export const surveyResponsesRelations = relations(surveyResponses, ({ one }) => ({
  survey: one(surveys, {
    fields: [surveyResponses.surveyId],
    references: [surveys.id],
  }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.id],
  }),
  businesses: many(businesses),
  userSkills: many(userSkills),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.id],
    references: [users.id],
  }),
}));

export const userSkillsRelations = relations(userSkills, ({ one }) => ({
  user: one(users, {
    fields: [userSkills.userId],
    references: [users.id],
  }),
  skill: one(skills, {
    fields: [userSkills.skillId],
    references: [skills.id],
  }),
}));

// Insert schemas
export const insertCouncilDataSchema = createInsertSchema(councilData).omit({
  id: true,
  createdAt: true,
});

export const insertBusinessSchema = createInsertSchema(businesses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertForumDiscussionSchema = createInsertSchema(forumDiscussions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  likes: true,
  views: true,
  replyCount: true,
});

export const insertForumReplySchema = createInsertSchema(forumReplies).omit({
  id: true,
  createdAt: true,
});

export const insertBlogArticleSchema = createInsertSchema(blogArticles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSurveySchema = createInsertSchema(surveys).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  responseCount: true,
});

export const insertSurveyResponseSchema = createInsertSchema(surveyResponses).omit({
  id: true,
  createdAt: true,
});

export const insertProfileSchema = createInsertSchema(profiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSkillSchema = createInsertSchema(skills).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSkillSchema = createInsertSchema(userSkills).omit({
  createdAt: true,
});

// Types
export type InsertCouncilData = z.infer<typeof insertCouncilDataSchema>;
export type CouncilData = typeof councilData.$inferSelect;

export type InsertBusiness = z.infer<typeof insertBusinessSchema>;
export type Business = typeof businesses.$inferSelect;

export type InsertForumDiscussion = z.infer<typeof insertForumDiscussionSchema>;
export type ForumDiscussion = typeof forumDiscussions.$inferSelect;

export type InsertForumReply = z.infer<typeof insertForumReplySchema>;
export type ForumReply = typeof forumReplies.$inferSelect;

export type InsertBlogArticle = z.infer<typeof insertBlogArticleSchema>;
export type BlogArticle = typeof blogArticles.$inferSelect;

export type InsertSurvey = z.infer<typeof insertSurveySchema>;
export type Survey = typeof surveys.$inferSelect;

export type InsertSurveyResponse = z.infer<typeof insertSurveyResponseSchema>;
export type SurveyResponse = typeof surveyResponses.$inferSelect;

// User types for authentication
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profiles.$inferSelect;
export type UpdateProfile = z.infer<typeof insertProfileSchema>; // For partial updates

export type InsertSkill = z.infer<typeof insertSkillSchema>;
export type Skill = typeof skills.$inferSelect;

export type InsertUserSkill = z.infer<typeof insertUserSkillSchema>;
export type UserSkill = typeof userSkills.$inferSelect;