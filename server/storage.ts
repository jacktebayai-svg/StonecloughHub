import {
  councilData, businesses, forumDiscussions, forumReplies, blogArticles, surveys, surveyResponses, users, profiles, skills, userSkills,
  type CouncilData, type InsertCouncilData,
  type Business, type InsertBusiness,
  type ForumDiscussion, type InsertForumDiscussion,
  type ForumReply, type InsertForumReply,
  type BlogArticle, type InsertBlogArticle,
  type Survey, type InsertSurvey,
  type SurveyResponse, type InsertSurveyResponse,
  type UpsertUser, type User,
  type Profile, type InsertProfile, type UpdateProfile,
  type Skill, type InsertSkill,
  type UserSkill, type InsertUserSkill
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, count, and } from "drizzle-orm";

export interface IStorage {
  // Authentication - Required for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Omit<User, 'createdAt' | 'updatedAt'>): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserProfile(userId: string): Promise<Profile | undefined>;

  // Council Data
  getCouncilData(type?: string, limit?: number): Promise<CouncilData[]>;
  createCouncilData(data: InsertCouncilData): Promise<CouncilData>;
  getCouncilDataStats(): Promise<any>;

  // Businesses
  getBusinesses(category?: string, limit?: number): Promise<Business[]>;
  getPromotedBusinesses(limit?: number): Promise<Business[]>;
  getBusiness(id: string): Promise<Business | undefined>;
  createBusiness(business: InsertBusiness): Promise<Business>;
  updateBusiness(id: string, business: Partial<InsertBusiness>): Promise<Business>;
  deleteBusiness(id: string): Promise<void>;
  searchBusinesses(query: string): Promise<Business[]>;
  getUserBusinesses(userId: string): Promise<Business[]>;

  // Forum
  getForumDiscussions(category?: string, limit?: number): Promise<ForumDiscussion[]>;
  getForumDiscussion(id: string): Promise<ForumDiscussion | undefined>;
  createForumDiscussion(discussion: InsertForumDiscussion): Promise<ForumDiscussion>;
  updateForumDiscussion(id: string, discussion: Partial<InsertForumDiscussion>): Promise<ForumDiscussion>;
  deleteForumDiscussion(id: string): Promise<void>;
  incrementViews(id: string): Promise<void>;
  
  // Forum Replies
  getForumReplies(discussionId: string): Promise<ForumReply[]>;
  createForumReply(reply: InsertForumReply): Promise<ForumReply>;
  deleteForumReply(id: string): Promise<void>;

  // Blog
  getBlogArticles(limit?: number): Promise<BlogArticle[]>;
  getPromotedBlogArticles(limit?: number): Promise<BlogArticle[]>;
  getBlogArticle(id: string): Promise<BlogArticle | undefined>;
  getFeaturedBlogArticle(): Promise<BlogArticle | undefined>;
  createBlogArticle(article: InsertBlogArticle): Promise<BlogArticle>;
  updateBlogArticle(id: string, article: Partial<InsertBlogArticle>): Promise<BlogArticle>;
  deleteBlogArticle(id: string): Promise<void>;

  // Surveys
  getSurveys(status?: string): Promise<Survey[]>;
  getSurvey(id: string): Promise<Survey | undefined>;
  createSurvey(survey: InsertSurvey): Promise<Survey>;
  updateSurvey(id: string, survey: Partial<InsertSurvey>): Promise<Survey>;
  deleteSurvey(id: string): Promise<void>;
  createSurveyResponse(response: InsertSurveyResponse): Promise<SurveyResponse>;
  getSurveyResults(surveyId: string): Promise<any>;

  // Profiles
  createProfile(profile: InsertProfile): Promise<Profile>;
  getProfile(userId: string): Promise<Profile | undefined>;
  updateProfile(userId: string, profile: Partial<UpdateProfile>): Promise<Profile>;

  // Skills
  createSkill(skill: InsertSkill): Promise<Skill>;
  getSkillByName(name: string): Promise<Skill | undefined>;
  addSkillToUser(userId: string, skillId: string, level?: string): Promise<UserSkill>;
  removeSkillFromUser(userId: string, skillId: string): Promise<void>;
  getUserSkills(userId: string): Promise<Skill[]>;

  // Global Search
  globalSearch(params: {
    query: string;
    type?: string;
    category?: string;
    sortBy?: string;
    limit?: number;
  }): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  // Authentication methods - Required for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: Omit<User, 'createdAt' | 'updatedAt'>): Promise<User> {
    const [user] = await db.insert(users).values({
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    // Create a profile for the new user
    try {
      await this.createProfile({ 
        userId: user.id,
        displayName: userData.name 
      });
    } catch (error) {
      console.error('Error creating profile for new user:', error);
    }

    return user;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const [user] = await db.update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getUserProfile(userId: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    return profile;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();

    // Create a profile for the new user if it doesn't exist
    const existingProfile = await this.getProfile(user.id);
    if (!existingProfile) {
      await this.createProfile({ id: user.id });
    }

    return user;
  }
  async getCouncilData(type?: string, limit: number = 50): Promise<CouncilData[]> {
    const query = db.select().from(councilData).orderBy(desc(councilData.date));
    
    if (type) {
      query.where(eq(councilData.dataType, type as any));
    }
    
    return await query.limit(limit);
  }

  async createCouncilData(data: InsertCouncilData): Promise<CouncilData> {
    const [result] = await db.insert(councilData).values(data).returning();
    return result;
  }

  async getCouncilDataStats(): Promise<any> {
    const planningApps = await db.select({ count: count() })
      .from(councilData)
      .where(eq(councilData.dataType, 'planning_application'));
    
    const spending = await db.select({ 
      total: sql<number>`COALESCE(SUM(${councilData.amount}), 0)` 
    })
      .from(councilData)
      .where(eq(councilData.dataType, 'council_spending'));

    const meetings = await db.select({ count: count() })
      .from(councilData)
      .where(eq(councilData.dataType, 'council_meeting'));

    return {
      planningApplications: planningApps[0]?.count || 0,
      totalSpending: spending[0]?.total || 0,
      upcomingMeetings: meetings[0]?.count || 0
    };
  }

  async getBusinesses(category?: string, limit: number = 20): Promise<Business[]> {
    const query = db.select().from(businesses).orderBy(desc(businesses.createdAt));
    
    if (category) {
      query.where(eq(businesses.category, category as any));
    }
    
    return await query.limit(limit);
  }

  async getPromotedBusinesses(limit: number = 3): Promise<Business[]> {
    return await db.select().from(businesses)
      .where(eq(businesses.isPromoted, true))
      .orderBy(desc(businesses.createdAt))
      .limit(limit);
  }

  async getBusiness(id: string): Promise<Business | undefined> {
    const [business] = await db.select().from(businesses).where(eq(businesses.id, id));
    return business;
  }

  async createBusiness(business: InsertBusiness): Promise<Business> {
    const [result] = await db.insert(businesses).values(business).returning();
    return result;
  }

  async updateBusiness(id: string, business: Partial<InsertBusiness>): Promise<Business> {
    const [result] = await db.update(businesses)
      .set({ ...business, updatedAt: new Date() })
      .where(eq(businesses.id, id))
      .returning();
    return result;
  }

  async deleteBusiness(id: string): Promise<void> {
    await db.delete(businesses).where(eq(businesses.id, id));
  }

  async searchBusinesses(query: string): Promise<Business[]> {
    return await db.select().from(businesses)
      .where(sql`${businesses.name} ILIKE ${`%${query}%`} OR ${businesses.description} ILIKE ${`%${query}%`}`)
      .limit(20);
  }

  async getUserBusinesses(userId: string): Promise<Business[]> {
    return await db.select().from(businesses)
      .where(eq(businesses.createdBy, userId))
      .orderBy(desc(businesses.createdAt));
  }

  async getForumDiscussions(category?: string, limit: number = 20): Promise<ForumDiscussion[]> {
    const query = db.select().from(forumDiscussions).orderBy(desc(forumDiscussions.updatedAt));
    
    if (category) {
      query.where(eq(forumDiscussions.category, category as any));
    }
    
    return await query.limit(limit);
  }

  async getForumDiscussion(id: string): Promise<ForumDiscussion | undefined> {
    const [discussion] = await db.select().from(forumDiscussions).where(eq(forumDiscussions.id, id));
    return discussion;
  }

  async createForumDiscussion(discussion: InsertForumDiscussion): Promise<ForumDiscussion> {
    const [result] = await db.insert(forumDiscussions).values(discussion).returning();
    return result;
  }

  async updateForumDiscussion(id: string, discussion: Partial<InsertForumDiscussion>): Promise<ForumDiscussion> {
    const [result] = await db.update(forumDiscussions)
      .set({ ...discussion, updatedAt: new Date() })
      .where(eq(forumDiscussions.id, id))
      .returning();
    return result;
  }

  async deleteForumDiscussion(id: string): Promise<void> {
    // First delete all replies
    await db.delete(forumReplies).where(eq(forumReplies.discussionId, id));
    // Then delete the discussion
    await db.delete(forumDiscussions).where(eq(forumDiscussions.id, id));
  }

  async incrementViews(id: string): Promise<void> {
    await db.update(forumDiscussions)
      .set({ views: sql`${forumDiscussions.views} + 1` })
      .where(eq(forumDiscussions.id, id));
  }

  async getForumReplies(discussionId: string): Promise<ForumReply[]> {
    return await db.select().from(forumReplies)
      .where(eq(forumReplies.discussionId, discussionId))
      .orderBy(forumReplies.createdAt);
  }

  async createForumReply(reply: InsertForumReply): Promise<ForumReply> {
    const [result] = await db.insert(forumReplies).values(reply).returning();
    
    // Increment reply count
    await db.update(forumDiscussions)
      .set({ replyCount: sql`${forumDiscussions.replyCount} + 1` })
      .where(eq(forumDiscussions.id, reply.discussionId));
    
    return result;
  }

  async deleteForumReply(id: string): Promise<void> {
    // Get the reply to find the discussion ID
    const [reply] = await db.select().from(forumReplies).where(eq(forumReplies.id, id));
    if (reply) {
      await db.delete(forumReplies).where(eq(forumReplies.id, id));
      // Decrement reply count
      await db.update(forumDiscussions)
        .set({ replyCount: sql`${forumDiscussions.replyCount} - 1` })
        .where(eq(forumDiscussions.id, reply.discussionId));
    }
  }

  async getBlogArticles(limit: number = 10): Promise<BlogArticle[]> {
    return await db.select().from(blogArticles)
      .orderBy(desc(blogArticles.createdAt))
      .limit(limit);
  }

  async getPromotedBlogArticles(limit: number = 3): Promise<BlogArticle[]> {
    return await db.select().from(blogArticles)
      .where(eq(blogArticles.isPromoted, true))
      .orderBy(desc(blogArticles.createdAt))
      .limit(limit);
  }

  async getBlogArticle(id: string): Promise<BlogArticle | undefined> {
    const [article] = await db.select().from(blogArticles).where(eq(blogArticles.id, id));
    return article;
  }

  async getFeaturedBlogArticle(): Promise<BlogArticle | undefined> {
    const [article] = await db.select().from(blogArticles)
      .where(eq(blogArticles.isFeatured, true))
      .orderBy(desc(blogArticles.createdAt));
    return article;
  }

  async createBlogArticle(article: InsertBlogArticle): Promise<BlogArticle> {
    const [result] = await db.insert(blogArticles).values(article).returning();
    return result;
  }

  async updateBlogArticle(id: string, article: Partial<InsertBlogArticle>): Promise<BlogArticle> {
    const [result] = await db.update(blogArticles)
      .set({ ...article, updatedAt: new Date() })
      .where(eq(blogArticles.id, id))
      .returning();
    return result;
  }

  async deleteBlogArticle(id: string): Promise<void> {
    await db.delete(blogArticles).where(eq(blogArticles.id, id));
  }

  async getSurveys(status?: string): Promise<Survey[]> {
    const query = db.select().from(surveys).orderBy(desc(surveys.createdAt));
    
    if (status) {
      query.where(eq(surveys.status, status as any));
    }
    
    return await query;
  }

  async getSurvey(id: string): Promise<Survey | undefined> {
    const [survey] = await db.select().from(surveys).where(eq(surveys.id, id));
    return survey;
  }

  async createSurvey(survey: InsertSurvey): Promise<Survey> {
    const [result] = await db.insert(surveys).values(survey).returning();
    return result;
  }

  async updateSurvey(id: string, survey: Partial<InsertSurvey>): Promise<Survey> {
    const [result] = await db.update(surveys)
      .set({ ...survey, updatedAt: new Date() })
      .where(eq(surveys.id, id))
      .returning();
    return result;
  }

  async deleteSurvey(id: string): Promise<void> {
    // First delete all responses
    await db.delete(surveyResponses).where(eq(surveyResponses.surveyId, id));
    // Then delete the survey
    await db.delete(surveys).where(eq(surveys.id, id));
  }

  async createSurveyResponse(response: InsertSurveyResponse): Promise<SurveyResponse> {
    const [result] = await db.insert(surveyResponses).values(response).returning();
    
    // Increment response count
    await db.update(surveys)
      .set({ responseCount: sql`${surveys.responseCount} + 1` })
      .where(eq(surveys.id, response.surveyId));
    
    return result;
  }

  async getSurveyResults(surveyId: string): Promise<any> {
    const responses = await db.select({ responses: surveyResponses.responses })
      .from(surveyResponses)
      .where(eq(surveyResponses.surveyId, surveyId));
    
    // Process and aggregate responses
    const results: any = {};
    responses.forEach(({ responses: resp }) => {
      if (resp && typeof resp === 'object') {
        Object.entries(resp).forEach(([questionId, answer]) => {
          if (!results[questionId]) {
            results[questionId] = {};
          }
          if (!results[questionId][String(answer)]) {
            results[questionId][String(answer)] = 0;
          }
          results[questionId][String(answer)]++;
        });
      }
    });
    
    return results;
  }

  // Profiles
  async createProfile(profileData: InsertProfile): Promise<Profile> {
    const [result] = await db.insert(profiles).values(profileData).returning();
    return result;
  }

  async getProfile(userId: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, userId));
    return profile;
  }

  async updateProfile(userId: string, profileData: Partial<UpdateProfile>): Promise<Profile> {
    const [result] = await db.update(profiles)
      .set({ ...profileData, updatedAt: new Date() })
      .where(eq(profiles.id, userId))
      .returning();
    return result;
  }

  // Skills
  async createSkill(skillData: InsertSkill): Promise<Skill> {
    const [result] = await db.insert(skills).values(skillData).returning();
    return result;
  }

  async getSkillByName(name: string): Promise<Skill | undefined> {
    const [skill] = await db.select().from(skills).where(eq(skills.name, name));
    return skill;
  }

  async addSkillToUser(userId: string, skillId: string, level?: string): Promise<UserSkill> {
    const [result] = await db.insert(userSkills).values({ userId, skillId, level }).returning();
    return result;
  }

  async removeSkillFromUser(userId: string, skillId: string): Promise<void> {
    await db.delete(userSkills).where(and(eq(userSkills.userId, userId), eq(userSkills.skillId, skillId)));
  }

  async getUserSkills(userId: string): Promise<Skill[]> {
    const result = await db.select({
      id: skills.id,
      name: skills.name,
      createdAt: skills.createdAt,
      updatedAt: skills.updatedAt,
    })
    .from(userSkills)
    .innerJoin(skills, eq(userSkills.skillId, skills.id))
    .where(eq(userSkills.userId, userId));
    return result;
  }

  // Global Search Implementation
  async globalSearch(params: {
    query: string;
    type?: string;
    category?: string;
    sortBy?: string;
    limit?: number;
  }): Promise<any[]> {
    const { query, type, category, sortBy = 'relevance', limit = 20 } = params;
    const searchTerm = `%${query.toLowerCase()}%`;
    const results: any[] = [];

    // Search businesses
    if (!type || type === 'all' || type === 'business') {
      let businessQuery = db.select({
        id: businesses.id,
        title: businesses.name,
        description: businesses.description,
        category: businesses.category,
        createdAt: businesses.createdAt,
        imageUrl: businesses.imageUrl,
        location: businesses.address,
        type: sql`'business'`.as('type'),
      })
      .from(businesses)
      .where(sql`LOWER(${businesses.name}) LIKE ${searchTerm} OR LOWER(${businesses.description}) LIKE ${searchTerm}`);

      if (category && category !== 'all') {
        businessQuery = businessQuery.where(eq(businesses.category, category as any));
      }

      const businessResults = await businessQuery.limit(Math.floor(limit / 4));
      results.push(...businessResults);
    }

    // Search blog articles
    if (!type || type === 'all' || type === 'article') {
      const articleResults = await db.select({
        id: blogArticles.id,
        title: blogArticles.title,
        excerpt: blogArticles.excerpt,
        content: blogArticles.content,
        category: blogArticles.category,
        author: blogArticles.authorName,
        createdAt: blogArticles.createdAt,
        imageUrl: blogArticles.imageUrl,
        type: sql`'article'`.as('type'),
      })
      .from(blogArticles)
      .where(sql`LOWER(${blogArticles.title}) LIKE ${searchTerm} OR LOWER(${blogArticles.content}) LIKE ${searchTerm} OR LOWER(${blogArticles.excerpt}) LIKE ${searchTerm}`)
      .limit(Math.floor(limit / 4));
      
      results.push(...articleResults);
    }

    // Search forum discussions
    if (!type || type === 'all' || type === 'discussion') {
      const discussionResults = await db.select({
        id: forumDiscussions.id,
        title: forumDiscussions.title,
        content: forumDiscussions.content,
        category: forumDiscussions.category,
        author: forumDiscussions.authorName,
        createdAt: forumDiscussions.createdAt,
        imageUrl: forumDiscussions.imageUrl,
        type: sql`'discussion'`.as('type'),
      })
      .from(forumDiscussions)
      .where(sql`LOWER(${forumDiscussions.title}) LIKE ${searchTerm} OR LOWER(${forumDiscussions.content}) LIKE ${searchTerm}`)
      .limit(Math.floor(limit / 4));
      
      results.push(...discussionResults);
    }

    // Search surveys
    if (!type || type === 'all' || type === 'survey') {
      const surveyResults = await db.select({
        id: surveys.id,
        title: surveys.title,
        description: surveys.description,
        createdAt: surveys.createdAt,
        type: sql`'survey'`.as('type'),
      })
      .from(surveys)
      .where(sql`LOWER(${surveys.title}) LIKE ${searchTerm} OR LOWER(${surveys.description}) LIKE ${searchTerm}`)
      .limit(Math.floor(limit / 4));
      
      results.push(...surveyResults);
    }

    // Search council data
    if (!type || type === 'all' || type === 'council_data') {
      const councilResults = await db.select({
        id: councilData.id,
        title: councilData.title,
        description: councilData.description,
        category: councilData.dataType,
        createdAt: councilData.createdAt,
        location: councilData.location,
        type: sql`'council_data'`.as('type'),
      })
      .from(councilData)
      .where(sql`LOWER(${councilData.title}) LIKE ${searchTerm} OR LOWER(${councilData.description}) LIKE ${searchTerm}`)
      .limit(Math.floor(limit / 4));
      
      results.push(...councilResults);
    }

    // Sort results
    let sortedResults = results;
    switch (sortBy) {
      case 'date':
        sortedResults = results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'date_asc':
        sortedResults = results.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'title':
        sortedResults = results.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'relevance':
      default:
        // For now, keep original order (could implement more sophisticated relevance scoring)
        break;
    }

    return sortedResults.slice(0, limit);
  }
}

export const storage = new DatabaseStorage();