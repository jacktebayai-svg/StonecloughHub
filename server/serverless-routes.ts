import express from 'express';
import { createMockAuthRoutes, setupMockAuth, isAuthenticated, isAdmin, isModerator } from './mock-auth.js';
import { mockStorage } from './mock-storage.js';

export async function registerServerlessRoutes(app: express.Application) {
  // Middleware for parsing JSON
  app.use(express.json());
  
  console.log('🚀 Registering serverless routes with mock data...');
  
  // Setup mock authentication
  await setupMockAuth(app);
  
  // Auth routes
  app.use('/api/auth', createMockAuthRoutes());
  
  // Council Data endpoints
  app.get('/api/council-data', async (req, res) => {
    try {
      const { type, limit } = req.query;
      const data = await mockStorage.getCouncilData(
        type as string, 
        limit ? parseInt(limit as string) : undefined
      );
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch council data" });
    }
  });

  app.get('/api/council-data/stats', async (req, res) => {
    try {
      const stats = await mockStorage.getCouncilDataStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch council data statistics" });
    }
  });

  // Business Directory endpoints
  app.get('/api/businesses', async (req, res) => {
    try {
      const { category, limit } = req.query;
      const businesses = await mockStorage.getBusinesses(
        category as string,
        limit ? parseInt(limit as string) : undefined
      );
      res.json(businesses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch businesses" });
    }
  });

  app.get('/api/businesses/promoted', async (req, res) => {
    try {
      const { limit } = req.query;
      const businesses = await mockStorage.getPromotedBusinesses(
        limit ? parseInt(limit as string) : undefined
      );
      res.json(businesses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch promoted businesses" });
    }
  });

  app.get('/api/businesses/search', async (req, res) => {
    try {
      const { q } = req.query;
      if (!q) {
        return res.json([]);
      }
      const results = await mockStorage.searchBusinesses(q as string);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to search businesses" });
    }
  });

  app.get('/api/businesses/:id', async (req, res) => {
    try {
      const business = await mockStorage.getBusiness(req.params.id);
      if (!business) {
        return res.status(404).json({ error: "Business not found" });
      }
      res.json(business);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch business" });
    }
  });

  app.post('/api/businesses', isAuthenticated, async (req: any, res) => {
    try {
      const businessData = {
        ...req.body,
        createdBy: req.user.id
      };
      
      const business = await mockStorage.createBusiness(businessData);
      res.status(201).json(business);
    } catch (error) {
      res.status(400).json({ error: "Invalid business data" });
    }
  });

  // Forum endpoints
  app.get('/api/forum/discussions', async (req, res) => {
    try {
      const { category, limit } = req.query;
      const discussions = await mockStorage.getForumDiscussions(
        category as string,
        limit ? parseInt(limit as string) : undefined
      );
      res.json(discussions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch forum discussions" });
    }
  });

  app.get('/api/forum/discussions/:id', async (req, res) => {
    try {
      const discussion = await mockStorage.getForumDiscussion(req.params.id);
      if (!discussion) {
        return res.status(404).json({ error: "Discussion not found" });
      }
      
      // Increment view count
      await mockStorage.incrementViews(req.params.id);
      
      res.json(discussion);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch discussion" });
    }
  });

  app.post('/api/forum/discussions', isAuthenticated, async (req: any, res) => {
    try {
      const discussionData = {
        ...req.body,
        authorId: req.user.id,
        authorName: req.user.name || req.user.email.split('@')[0],
        authorInitials: (req.user.name || req.user.email)
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      };
      const discussion = await mockStorage.createForumDiscussion(discussionData);
      res.status(201).json(discussion);
    } catch (error) {
      res.status(400).json({ error: "Invalid discussion data" });
    }
  });

  app.get('/api/forum/discussions/:id/replies', async (req, res) => {
    try {
      const replies = await mockStorage.getForumReplies(req.params.id);
      res.json(replies);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch replies" });
    }
  });

  app.post('/api/forum/discussions/:id/replies', isAuthenticated, async (req: any, res) => {
    try {
      const replyData = {
        ...req.body,
        discussionId: req.params.id,
        authorId: req.user.id
      };
      const reply = await mockStorage.createForumReply(replyData);
      res.status(201).json(reply);
    } catch (error) {
      res.status(400).json({ error: "Invalid reply data" });
    }
  });

  // Blog endpoints
  app.get('/api/blog/articles', async (req, res) => {
    try {
      const { limit } = req.query;
      const articles = await mockStorage.getBlogArticles(
        limit ? parseInt(limit as string) : undefined
      );
      res.json(articles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch blog articles" });
    }
  });

  app.get('/api/blog/articles/promoted', async (req, res) => {
    try {
      const { limit } = req.query;
      const articles = await mockStorage.getPromotedBlogArticles(
        limit ? parseInt(limit as string) : undefined
      );
      res.json(articles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch promoted articles" });
    }
  });

  app.get('/api/blog/articles/featured', async (req, res) => {
    try {
      const article = await mockStorage.getFeaturedBlogArticle();
      if (!article) {
        return res.status(404).json({ error: "No featured article found" });
      }
      res.json(article);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch featured article" });
    }
  });

  app.get('/api/blog/articles/:id', async (req, res) => {
    try {
      const article = await mockStorage.getBlogArticle(req.params.id);
      if (!article) {
        return res.status(404).json({ error: "Article not found" });
      }
      res.json(article);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch article" });
    }
  });

  app.post('/api/blog/articles', isAuthenticated, async (req: any, res) => {
    try {
      const articleData = {
        ...req.body,
        authorId: req.user.id,
        authorName: req.user.name || req.user.email.split('@')[0]
      };
      const article = await mockStorage.createBlogArticle(articleData);
      res.status(201).json(article);
    } catch (error) {
      res.status(400).json({ error: "Invalid article data" });
    }
  });

  // Survey endpoints
  app.get('/api/surveys', async (req, res) => {
    try {
      const { status } = req.query;
      const surveys = await mockStorage.getSurveys(status as string);
      res.json(surveys);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch surveys" });
    }
  });

  app.get('/api/surveys/:id', async (req, res) => {
    try {
      const survey = await mockStorage.getSurvey(req.params.id);
      if (!survey) {
        return res.status(404).json({ error: "Survey not found" });
      }
      res.json(survey);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch survey" });
    }
  });

  app.post('/api/surveys', isAuthenticated, async (req: any, res) => {
    try {
      const surveyData = {
        ...req.body,
        createdBy: req.user.id
      };
      const survey = await mockStorage.createSurvey(surveyData);
      res.status(201).json(survey);
    } catch (error) {
      res.status(400).json({ error: "Invalid survey data" });
    }
  });

  app.post('/api/surveys/:id/responses', async (req, res) => {
    try {
      const responseData = {
        ...req.body,
        surveyId: req.params.id
      };
      const response = await mockStorage.createSurveyResponse(responseData);
      res.status(201).json(response);
    } catch (error) {
      res.status(400).json({ error: "Invalid survey response data" });
    }
  });

  app.get('/api/surveys/:id/results', async (req, res) => {
    try {
      const results = await mockStorage.getSurveyResults(req.params.id);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch survey results" });
    }
  });

  // Global search endpoint
  app.get('/api/search', async (req, res) => {
    try {
      const { q, type, category, sort = 'relevance', limit = 20 } = req.query;
      
      if (!q || typeof q !== 'string' || q.length < 2) {
        return res.json([]);
      }
      
      const results = await mockStorage.globalSearch({
        query: q,
        type: type as string,
        category: category as string,
        sortBy: sort as string,
        limit: parseInt(limit as string) || 20
      });
      
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Search failed" });
    }
  });

  // Profile endpoints
  app.get('/api/profile/:userId', async (req, res) => {
    try {
      const profile = await mockStorage.getProfile(req.params.userId);
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.put('/api/profile/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.params.userId;
      if (req.user.id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ error: "Not authorized to update this profile" });
      }
      const profile = await mockStorage.updateProfile(userId, req.body);
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // User businesses endpoints
  app.get('/api/users/:userId/businesses', async (req, res) => {
    try {
      const businesses = await mockStorage.getUserBusinesses(req.params.userId);
      res.json(businesses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user businesses" });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      mode: 'serverless-mock'
    });
  });
  
  // Catch-all for unmatched routes
  app.use('*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
  });
  
  console.log('✅ All serverless routes registered successfully');
  
  return app;
}
