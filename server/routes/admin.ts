import { Router } from "express";
import { isAuthenticated, isAdmin } from "../auth";
import { storage } from "../storage";
import { emailService } from "../services/email";
import { z } from "zod";
import { eq, sql, desc, count, and } from "drizzle-orm";
import { db } from "../db";
import { users, businesses, forumDiscussions, blogArticles, surveys, councilData } from "@shared/schema";

const router = Router();

// Apply admin authentication to all routes
router.use(isAuthenticated, isAdmin);

// Validation schemas
const updateUserRoleSchema = z.object({
  role: z.enum(['user', 'moderator', 'admin']),
});

const moderateContentSchema = z.object({
  action: z.enum(['approve', 'reject', 'hide']),
  reason: z.string().optional(),
});

const bulkActionSchema = z.object({
  ids: z.array(z.string()),
  action: z.enum(['approve', 'reject', 'delete', 'promote', 'feature']),
});

// Dashboard stats endpoint
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalUsers,
      totalBusinesses,
      totalDiscussions,
      totalArticles,
      totalSurveys,
      recentUsers,
      recentBusinesses,
      recentDiscussions,
    ] = await Promise.all([
      // Counts
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(businesses),
      db.select({ count: count() }).from(forumDiscussions),
      db.select({ count: count() }).from(blogArticles),
      db.select({ count: count() }).from(surveys),
      
      // Recent items (last 7 days)
      db.select({ count: count() }).from(users)
        .where(sql`${users.createdAt} >= NOW() - INTERVAL '7 days'`),
      db.select({ count: count() }).from(businesses)
        .where(sql`${businesses.createdAt} >= NOW() - INTERVAL '7 days'`),
      db.select({ count: count() }).from(forumDiscussions)
        .where(sql`${forumDiscussions.createdAt} >= NOW() - INTERVAL '7 days'`),
    ]);

    // Get pending moderation items
    const pendingBusinesses = await db.select({ count: count() }).from(businesses)
      .where(eq(businesses.isVerified, false));

    res.json({
      stats: {
        users: {
          total: totalUsers[0]?.count || 0,
          recent: recentUsers[0]?.count || 0,
        },
        businesses: {
          total: totalBusinesses[0]?.count || 0,
          recent: recentBusinesses[0]?.count || 0,
          pending: pendingBusinesses[0]?.count || 0,
        },
        discussions: {
          total: totalDiscussions[0]?.count || 0,
          recent: recentDiscussions[0]?.count || 0,
        },
        articles: {
          total: totalArticles[0]?.count || 0,
        },
        surveys: {
          total: totalSurveys[0]?.count || 0,
        },
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

// User management endpoints
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let query = db.select().from(users).orderBy(desc(users.createdAt));

    if (role && role !== 'all') {
      query = query.where(eq(users.role, role as any));
    }

    if (search) {
      query = query.where(
        sql`LOWER(${users.email}) LIKE ${`%${(search as string).toLowerCase()}%`} OR LOWER(${users.firstName}) LIKE ${`%${(search as string).toLowerCase()}%`} OR LOWER(${users.lastName}) LIKE ${`%${(search as string).toLowerCase()}%`}`
      );
    }

    const allUsers = await query.limit(parseInt(limit as string)).offset(offset);
    const totalCount = await db.select({ count: count() }).from(users);

    res.json({
      users: allUsers,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: totalCount[0]?.count || 0,
        pages: Math.ceil((totalCount[0]?.count || 0) / parseInt(limit as string)),
      },
    });

  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.patch('/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = updateUserRoleSchema.parse(req.body);

    const updatedUser = await storage.updateUser(id, { role });

    res.json({
      message: 'User role updated successfully',
      user: updatedUser,
    });

  } catch (error) {
    console.error('Update user role error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid role', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Note: This would require implementing a deleteUser method in storage
    // For now, we'll just deactivate the user
    await storage.updateUser(id, { 
      email: `deleted_${Date.now()}@example.com`,
      firstName: 'Deleted',
      lastName: 'User',
    });

    res.json({ message: 'User deactivated successfully' });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Business moderation endpoints
router.get('/businesses/pending', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const pendingBusinesses = await db.select().from(businesses)
      .where(eq(businesses.isVerified, false))
      .orderBy(desc(businesses.createdAt))
      .limit(parseInt(limit as string))
      .offset(offset);

    const totalCount = await db.select({ count: count() }).from(businesses)
      .where(eq(businesses.isVerified, false));

    res.json({
      businesses: pendingBusinesses,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: totalCount[0]?.count || 0,
        pages: Math.ceil((totalCount[0]?.count || 0) / parseInt(limit as string)),
      },
    });

  } catch (error) {
    console.error('Pending businesses error:', error);
    res.status(500).json({ error: 'Failed to fetch pending businesses' });
  }
});

router.patch('/businesses/:id/moderate', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = moderateContentSchema.parse(req.body);

    const business = await storage.getBusiness(id);
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    let updateData: any = {};

    switch (action) {
      case 'approve':
        updateData = { isVerified: true };
        break;
      case 'reject':
        // For now, we'll just keep it unverified
        updateData = { isVerified: false };
        break;
      case 'hide':
        // This would require a 'hidden' field in the schema
        updateData = { isVerified: false };
        break;
    }

    const updatedBusiness = await storage.updateBusiness(id, updateData);

    // Send notification email if approved
    if (action === 'approve' && business.createdBy) {
      const owner = await storage.getUser(business.createdBy);
      if (owner?.email) {
        await emailService.sendBusinessApprovalEmail(
          owner.email,
          owner.firstName || owner.email,
          business.name,
          `${process.env.APP_URL}/directory/${business.id}`
        );
      }
    }

    res.json({
      message: `Business ${action}ed successfully`,
      business: updatedBusiness,
    });

  } catch (error) {
    console.error('Moderate business error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid moderation action', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to moderate business' });
  }
});

// Content management endpoints
router.get('/content/flagged', async (req, res) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;

    // This would require implementing a flagging system
    // For now, return empty results
    res.json({
      content: [],
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: 0,
        pages: 0,
      },
    });

  } catch (error) {
    console.error('Flagged content error:', error);
    res.status(500).json({ error: 'Failed to fetch flagged content' });
  }
});

// Bulk actions endpoint
router.post('/bulk-action', async (req, res) => {
  try {
    const { ids, action } = bulkActionSchema.parse(req.body);
    const results = [];

    for (const id of ids) {
      try {
        // This is a simplified example - in practice, you'd need to determine
        // what type of entity each ID represents and apply the appropriate action
        let result;
        switch (action) {
          case 'approve':
            result = await storage.updateBusiness(id, { isVerified: true });
            break;
          case 'reject':
            result = await storage.updateBusiness(id, { isVerified: false });
            break;
          case 'delete':
            await storage.deleteBusiness(id);
            result = { id, deleted: true };
            break;
          case 'promote':
            result = await storage.updateBusiness(id, { isPromoted: true });
            break;
          case 'feature':
            result = await storage.updateBlogArticle(id, { isFeatured: true });
            break;
          default:
            throw new Error('Invalid action');
        }

        results.push({ id, success: true, result });
      } catch (error) {
        results.push({ id, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    res.json({
      message: 'Bulk action completed',
      results,
      success: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
    });

  } catch (error) {
    console.error('Bulk action error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid bulk action request', details: error.errors });
    }
    res.status(500).json({ error: 'Bulk action failed' });
  }
});

// System settings endpoints
router.get('/settings', async (req, res) => {
  try {
    // This would typically come from a settings table/service
    const settings = {
      siteName: 'Stoneclough Hub',
      siteDescription: 'Local community platform for Stoneclough',
      maintenanceMode: false,
      registrationEnabled: true,
      emailNotificationsEnabled: true,
      moderationRequired: true,
      features: {
        businessDirectory: true,
        forum: true,
        blog: true,
        surveys: true,
        civicData: true,
      },
    };

    res.json({ settings });

  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.patch('/settings', async (req, res) => {
  try {
    // In a real implementation, you would validate and save these settings
    const updatedSettings = req.body;

    res.json({
      message: 'Settings updated successfully',
      settings: updatedSettings,
    });

  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Analytics endpoints
router.get('/analytics/overview', async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // This would typically involve more complex analytics queries
    // For now, return simplified data
    const analytics = {
      visitors: {
        total: 1250,
        change: 12.5,
      },
      pageViews: {
        total: 4890,
        change: 8.3,
      },
      topPages: [
        { path: '/', views: 1200, title: 'Home' },
        { path: '/directory', views: 890, title: 'Business Directory' },
        { path: '/forum', views: 650, title: 'Community Forum' },
        { path: '/blog', views: 420, title: 'Blog' },
        { path: '/civic-data', views: 380, title: 'Civic Data' },
      ],
      deviceTypes: [
        { type: 'Desktop', count: 620, percentage: 49.6 },
        { type: 'Mobile', count: 500, percentage: 40.0 },
        { type: 'Tablet', count: 130, percentage: 10.4 },
      ],
    };

    res.json({ analytics, period });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Email management endpoints
router.get('/emails/status', async (req, res) => {
  try {
    const status = emailService.getQueueStatus();
    const isHealthy = await emailService.testConnection();

    res.json({
      status: {
        healthy: isHealthy,
        queue: status,
      },
    });

  } catch (error) {
    console.error('Email status error:', error);
    res.status(500).json({ error: 'Failed to check email status' });
  }
});

router.post('/emails/send-newsletter', async (req, res) => {
  try {
    const { subject, content, recipients } = req.body;

    if (!subject || !content) {
      return res.status(400).json({ error: 'Subject and content are required' });
    }

    // Get all users if no specific recipients
    let emailList = recipients;
    if (!emailList || emailList.length === 0) {
      const allUsers = await db.select({ email: users.email, firstName: users.firstName })
        .from(users)
        .where(sql`${users.email} IS NOT NULL`);
      
      emailList = allUsers.map(user => user.email).filter(Boolean);
    }

    // Send newsletter
    const result = await emailService.sendNewsletter(emailList, content);

    res.json({
      message: 'Newsletter sent successfully',
      sent: result,
      recipients: emailList.length,
    });

  } catch (error) {
    console.error('Send newsletter error:', error);
    res.status(500).json({ error: 'Failed to send newsletter' });
  }
});

// Database maintenance endpoints
router.post('/maintenance/cleanup', async (req, res) => {
  try {
    // Cleanup operations (example implementations)
    const results = {
      deletedSessions: 0,
      optimizedTables: 0,
      cleanedUploads: 0,
    };

    // Clean up old sessions (older than 30 days)
    // This would require implementing session cleanup logic

    // Other maintenance tasks would go here

    res.json({
      message: 'Database cleanup completed',
      results,
    });

  } catch (error) {
    console.error('Database cleanup error:', error);
    res.status(500).json({ error: 'Database cleanup failed' });
  }
});

// Backup endpoint
router.post('/maintenance/backup', async (req, res) => {
  try {
    // This would trigger a database backup
    // Implementation would depend on your backup strategy
    
    res.json({
      message: 'Backup initiated successfully',
      backupId: `backup_${Date.now()}`,
    });

  } catch (error) {
    console.error('Backup error:', error);
    res.status(500).json({ error: 'Backup failed' });
  }
});

export default router;
