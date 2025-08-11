import { 
  councilData, businesses, forumDiscussions, forumReplies, blogArticles, surveys, surveyResponses,
  type CouncilData, type InsertCouncilData,
  type Business, type InsertBusiness,
  type ForumDiscussion, type InsertForumDiscussion,
  type ForumReply, type InsertForumReply,
  type BlogArticle, type InsertBlogArticle,
  type Survey, type InsertSurvey,
  type SurveyResponse, type InsertSurveyResponse
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, count } from "drizzle-orm";

export interface IStorage {
  // Council Data
  getCouncilData(type?: string, limit?: number): Promise<CouncilData[]>;
  createCouncilData(data: InsertCouncilData): Promise<CouncilData>;
  getCouncilDataStats(): Promise<any>;

  // Businesses
  getBusinesses(category?: string, limit?: number): Promise<Business[]>;
  getBusiness(id: string): Promise<Business | undefined>;
  createBusiness(business: InsertBusiness): Promise<Business>;
  searchBusinesses(query: string): Promise<Business[]>;

  // Forum
  getForumDiscussions(category?: string, limit?: number): Promise<ForumDiscussion[]>;
  getForumDiscussion(id: string): Promise<ForumDiscussion | undefined>;
  createForumDiscussion(discussion: InsertForumDiscussion): Promise<ForumDiscussion>;
  incrementViews(id: string): Promise<void>;
  
  // Forum Replies
  getForumReplies(discussionId: string): Promise<ForumReply[]>;
  createForumReply(reply: InsertForumReply): Promise<ForumReply>;

  // Blog
  getBlogArticles(limit?: number): Promise<BlogArticle[]>;
  getBlogArticle(id: string): Promise<BlogArticle | undefined>;
  getFeaturedBlogArticle(): Promise<BlogArticle | undefined>;
  createBlogArticle(article: InsertBlogArticle): Promise<BlogArticle>;

  // Surveys
  getSurveys(status?: string): Promise<Survey[]>;
  getSurvey(id: string): Promise<Survey | undefined>;
  createSurvey(survey: InsertSurvey): Promise<Survey>;
  createSurveyResponse(response: InsertSurveyResponse): Promise<SurveyResponse>;
  getSurveyResults(surveyId: string): Promise<any>;
}

export class DatabaseStorage implements IStorage {
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

  async getBusiness(id: string): Promise<Business | undefined> {
    const [business] = await db.select().from(businesses).where(eq(businesses.id, id));
    return business;
  }

  async createBusiness(business: InsertBusiness): Promise<Business> {
    const [result] = await db.insert(businesses).values(business).returning();
    return result;
  }

  async searchBusinesses(query: string): Promise<Business[]> {
    return await db.select().from(businesses)
      .where(sql`${businesses.name} ILIKE ${`%${query}%`} OR ${businesses.description} ILIKE ${`%${query}%`}`)
      .limit(20);
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

  async getBlogArticles(limit: number = 10): Promise<BlogArticle[]> {
    return await db.select().from(blogArticles)
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
}

export const storage = new DatabaseStorage();
