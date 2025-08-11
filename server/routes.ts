import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { scraper } from "./services/scraper";
import { 
  insertBusinessSchema, insertForumDiscussionSchema, insertForumReplySchema,
  insertBlogArticleSchema, insertSurveySchema, insertSurveyResponseSchema
} from "@shared/schema";
import { setupAuth, isAuthenticated, isAdmin, isModerator } from "./replitAuth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Replit Authentication
  await setupAuth(app);

  // Authentication endpoints
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  
  // Council Data endpoints
  app.get("/api/council-data", async (req, res) => {
    try {
      const { type, limit } = req.query;
      const data = await storage.getCouncilData(
        type as string, 
        limit ? parseInt(limit as string) : undefined
      );
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch council data" });
    }
  });

  app.get("/api/council-data/stats", async (req, res) => {
    try {
      const stats = await storage.getCouncilDataStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch council data statistics" });
    }
  });

  // Business Directory endpoints
  app.get("/api/businesses", async (req, res) => {
    try {
      const { category, limit } = req.query;
      const businesses = await storage.getBusinesses(
        category as string,
        limit ? parseInt(limit as string) : undefined
      );
      res.json(businesses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch businesses" });
    }
  });

  app.get("/api/businesses/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q) {
        return res.json([]);
      }
      const results = await storage.searchBusinesses(q as string);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to search businesses" });
    }
  });

  app.get("/api/businesses/:id", async (req, res) => {
    try {
      const business = await storage.getBusiness(req.params.id);
      if (!business) {
        return res.status(404).json({ error: "Business not found" });
      }
      res.json(business);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch business" });
    }
  });

  app.post("/api/businesses", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertBusinessSchema.parse(req.body);
      const businessData = {
        ...validatedData,
        createdBy: req.user.claims.sub
      };
      
      const business = await storage.createBusiness(businessData);
      res.status(201).json(business);
    } catch (error) {
      res.status(400).json({ error: "Invalid business data" });
    }
  });

  app.patch("/api/businesses/:id", isAuthenticated, async (req: any, res) => {
    try {
      const business = await storage.getBusiness(req.params.id);
      if (!business) {
        return res.status(404).json({ error: "Business not found" });
      }
      
      // Check ownership or admin privileges
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (business.createdBy !== userId && user?.role !== 'admin') {
        return res.status(403).json({ error: "Not authorized to update this business" });
      }

      const validatedData = insertBusinessSchema.partial().parse(req.body);
      const updatedBusiness = await storage.updateBusiness(req.params.id, validatedData);
      res.json(updatedBusiness);
    } catch (error) {
      res.status(500).json({ error: "Failed to update business" });
    }
  });

  app.delete("/api/businesses/:id", isAuthenticated, async (req: any, res) => {
    try {
      const business = await storage.getBusiness(req.params.id);
      if (!business) {
        return res.status(404).json({ error: "Business not found" });
      }
      
      // Check ownership or admin privileges
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (business.createdBy !== userId && user?.role !== 'admin') {
        return res.status(403).json({ error: "Not authorized to delete this business" });
      }
      
      await storage.deleteBusiness(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete business" });
    }
  });

  // Forum endpoints
  app.get("/api/forum/discussions", async (req, res) => {
    try {
      const { category, limit } = req.query;
      const discussions = await storage.getForumDiscussions(
        category as string,
        limit ? parseInt(limit as string) : undefined
      );
      res.json(discussions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch forum discussions" });
    }
  });

  app.get("/api/forum/discussions/:id", async (req, res) => {
    try {
      const discussion = await storage.getForumDiscussion(req.params.id);
      if (!discussion) {
        return res.status(404).json({ error: "Discussion not found" });
      }
      
      // Increment view count
      await storage.incrementViews(req.params.id);
      
      res.json(discussion);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch discussion" });
    }
  });

  app.post("/api/forum/discussions", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertForumDiscussionSchema.parse(req.body);
      const discussionData = {
        ...validatedData,
        authorId: req.user.claims.sub
      };
      const discussion = await storage.createForumDiscussion(discussionData);
      res.status(201).json(discussion);
    } catch (error) {
      res.status(400).json({ error: "Invalid discussion data" });
    }
  });

  app.patch("/api/forum/discussions/:id", isAuthenticated, async (req: any, res) => {
    try {
      const discussion = await storage.getForumDiscussion(req.params.id);
      if (!discussion) {
        return res.status(404).json({ error: "Discussion not found" });
      }
      
      // Check ownership or admin/moderator privileges
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (discussion.authorId !== userId && !['admin', 'moderator'].includes(user?.role || '')) {
        return res.status(403).json({ error: "Not authorized to update this discussion" });
      }

      const validatedData = insertForumDiscussionSchema.partial().parse(req.body);
      const updatedDiscussion = await storage.updateForumDiscussion(req.params.id, validatedData);
      res.json(updatedDiscussion);
    } catch (error) {
      res.status(500).json({ error: "Failed to update discussion" });
    }
  });

  app.delete("/api/forum/discussions/:id", isAuthenticated, async (req: any, res) => {
    try {
      const discussion = await storage.getForumDiscussion(req.params.id);
      if (!discussion) {
        return res.status(404).json({ error: "Discussion not found" });
      }
      
      // Check ownership or admin/moderator privileges
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (discussion.authorId !== userId && !['admin', 'moderator'].includes(user?.role || '')) {
        return res.status(403).json({ error: "Not authorized to delete this discussion" });
      }
      
      await storage.deleteForumDiscussion(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete discussion" });
    }
  });

  app.get("/api/forum/discussions/:id/replies", async (req, res) => {
    try {
      const replies = await storage.getForumReplies(req.params.id);
      res.json(replies);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch replies" });
    }
  });

  app.post("/api/forum/discussions/:id/replies", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertForumReplySchema.parse({
        ...req.body,
        discussionId: req.params.id,
        authorId: req.user.claims.sub
      });
      const reply = await storage.createForumReply(validatedData);
      res.status(201).json(reply);
    } catch (error) {
      res.status(400).json({ error: "Invalid reply data" });
    }
  });

  app.delete("/api/forum/replies/:id", isAuthenticated, async (req: any, res) => {
    try {
      // This would require fetching the reply first to check ownership
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // For now, allow deletion by the author or admin/moderator
      // A more complete implementation would fetch the reply to check authorId
      if (!['admin', 'moderator'].includes(user?.role || '')) {
        return res.status(403).json({ error: "Not authorized to delete replies" });
      }
      
      await storage.deleteForumReply(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete reply" });
    }
  });

  // Blog endpoints
  app.get("/api/blog/articles", async (req, res) => {
    try {
      const { limit } = req.query;
      const articles = await storage.getBlogArticles(
        limit ? parseInt(limit as string) : undefined
      );
      res.json(articles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch blog articles" });
    }
  });

  app.get("/api/blog/articles/featured", async (req, res) => {
    try {
      const article = await storage.getFeaturedBlogArticle();
      if (!article) {
        return res.status(404).json({ error: "No featured article found" });
      }
      res.json(article);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch featured article" });
    }
  });

  app.get("/api/blog/articles/:id", async (req, res) => {
    try {
      const article = await storage.getBlogArticle(req.params.id);
      if (!article) {
        return res.status(404).json({ error: "Article not found" });
      }
      res.json(article);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch article" });
    }
  });

  app.post("/api/blog/articles", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertBlogArticleSchema.parse(req.body);
      const articleData = {
        ...validatedData,
        authorId: req.user.claims.sub
      };
      const article = await storage.createBlogArticle(articleData);
      res.status(201).json(article);
    } catch (error) {
      res.status(400).json({ error: "Invalid article data" });
    }
  });

  app.patch("/api/blog/articles/:id", isAuthenticated, async (req: any, res) => {
    try {
      const article = await storage.getBlogArticle(req.params.id);
      if (!article) {
        return res.status(404).json({ error: "Article not found" });
      }
      
      // Check ownership or admin/moderator privileges
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (article.authorId !== userId && !['admin', 'moderator'].includes(user?.role || '')) {
        return res.status(403).json({ error: "Not authorized to update this article" });
      }

      const validatedData = insertBlogArticleSchema.partial().parse(req.body);
      const updatedArticle = await storage.updateBlogArticle(req.params.id, validatedData);
      res.json(updatedArticle);
    } catch (error) {
      res.status(500).json({ error: "Failed to update article" });
    }
  });

  app.delete("/api/blog/articles/:id", isAuthenticated, async (req: any, res) => {
    try {
      const article = await storage.getBlogArticle(req.params.id);
      if (!article) {
        return res.status(404).json({ error: "Article not found" });
      }
      
      // Check ownership or admin/moderator privileges
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (article.authorId !== userId && !['admin', 'moderator'].includes(user?.role || '')) {
        return res.status(403).json({ error: "Not authorized to delete this article" });
      }
      
      await storage.deleteBlogArticle(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete article" });
    }
  });

  // Survey endpoints
  app.get("/api/surveys", async (req, res) => {
    try {
      const { status } = req.query;
      const surveys = await storage.getSurveys(status as string);
      res.json(surveys);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch surveys" });
    }
  });

  app.get("/api/surveys/:id", async (req, res) => {
    try {
      const survey = await storage.getSurvey(req.params.id);
      if (!survey) {
        return res.status(404).json({ error: "Survey not found" });
      }
      res.json(survey);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch survey" });
    }
  });

  app.post("/api/surveys", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertSurveySchema.parse(req.body);
      const surveyData = {
        ...validatedData,
        createdBy: req.user.claims.sub
      };
      const survey = await storage.createSurvey(surveyData);
      res.status(201).json(survey);
    } catch (error) {
      res.status(400).json({ error: "Invalid survey data" });
    }
  });

  app.patch("/api/surveys/:id", isAuthenticated, async (req: any, res) => {
    try {
      const survey = await storage.getSurvey(req.params.id);
      if (!survey) {
        return res.status(404).json({ error: "Survey not found" });
      }
      
      // Check ownership or admin privileges
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (survey.createdBy !== userId && user?.role !== 'admin') {
        return res.status(403).json({ error: "Not authorized to update this survey" });
      }

      const validatedData = insertSurveySchema.partial().parse(req.body);
      const updatedSurvey = await storage.updateSurvey(req.params.id, validatedData);
      res.json(updatedSurvey);
    } catch (error) {
      res.status(500).json({ error: "Failed to update survey" });
    }
  });

  app.delete("/api/surveys/:id", isAuthenticated, async (req: any, res) => {
    try {
      const survey = await storage.getSurvey(req.params.id);
      if (!survey) {
        return res.status(404).json({ error: "Survey not found" });
      }
      
      // Check ownership or admin privileges
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (survey.createdBy !== userId && user?.role !== 'admin') {
        return res.status(403).json({ error: "Not authorized to delete this survey" });
      }
      
      await storage.deleteSurvey(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete survey" });
    }
  });

  app.post("/api/surveys/:id/responses", async (req, res) => {
    try {
      const validatedData = insertSurveyResponseSchema.parse({
        ...req.body,
        surveyId: req.params.id
      });
      const response = await storage.createSurveyResponse(validatedData);
      res.status(201).json(response);
    } catch (error) {
      res.status(400).json({ error: "Invalid survey response data" });
    }
  });

  app.get("/api/surveys/:id/results", async (req, res) => {
    try {
      const results = await storage.getSurveyResults(req.params.id);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch survey results" });
    }
  });

  // Admin-only endpoints
  app.post("/api/admin/scrape", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await scraper.scrapeAndStoreData();
      res.json({ message: "Data scraping completed successfully" });
    } catch (error) {
      res.status(500).json({ error: "Data scraping failed" });
    }
  });

  app.get("/api/admin/scraper/status", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const isConnected = await scraper.testConnection();
      res.json({ connected: isConnected });
    } catch (error) {
      res.status(500).json({ error: "Failed to check scraper status" });
    }
  });

  // Seed database endpoint
  app.post("/api/admin/seed", async (req, res) => {
    try {
      const { seedDatabase } = await import("./services/seed-data");
      await seedDatabase();
      res.json({ message: "Database seeded successfully" });
    } catch (error) {
      res.status(500).json({ error: "Database seeding failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
