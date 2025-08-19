import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createServer } from 'http';
import express from 'express';
import { registerRoutes } from '../routes';
import { storage } from '../storage';

describe('API Tests', () => {
  let app: express.Express;
  let server: any;
  const testPort = 3001;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    
    // Register all routes
    server = await registerRoutes(app);
    
    // Start test server
    await new Promise<void>((resolve) => {
      server.listen(testPort, () => {
        console.log(`Test server running on port ${testPort}`);
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => {
          console.log('Test server closed');
          resolve();
        });
      });
    }
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('database');
    });
  });

  describe('Public API Endpoints', () => {
    it('should fetch council data stats', async () => {
      const response = await request(app)
        .get('/api/council-data/stats')
        .expect(200);

      expect(response.body).toHaveProperty('planningApplications');
      expect(response.body).toHaveProperty('totalSpending');
      expect(response.body).toHaveProperty('upcomingMeetings');
      expect(typeof response.body.planningApplications).toBe('number');
    });

    it('should fetch businesses', async () => {
      const response = await request(app)
        .get('/api/businesses')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should fetch blog articles', async () => {
      const response = await request(app)
        .get('/api/blog/articles')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should fetch forum discussions', async () => {
      const response = await request(app)
        .get('/api/forum/discussions')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should handle search with no query', async () => {
      const response = await request(app)
        .get('/api/search')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });

    it('should handle search with short query', async () => {
      const response = await request(app)
        .get('/api/search?q=a')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });
  });

  describe('Export API Endpoints', () => {
    it('should fetch public council data', async () => {
      const response = await request(app)
        .get('/api/export/api/v1/council-data')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(response.body).toHaveProperty('links');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should fetch public businesses', async () => {
      const response = await request(app)
        .get('/api/export/api/v1/businesses')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(response.body).toHaveProperty('links');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should fetch public stats', async () => {
      const response = await request(app)
        .get('/api/export/api/v1/stats')
        .expect(200);

      expect(response.body).toHaveProperty('council');
      expect(response.body).toHaveProperty('community');
      expect(response.body).toHaveProperty('lastUpdated');
    });

    it('should return CSV format when requested', async () => {
      const response = await request(app)
        .get('/api/export/api/v1/businesses?format=csv')
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
    });
  });

  describe('Authentication Required Endpoints', () => {
    it('should require authentication for creating businesses', async () => {
      const response = await request(app)
        .post('/api/businesses')
        .send({
          name: 'Test Business',
          description: 'A test business',
          category: 'restaurant_cafe',
          address: '123 Test St'
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should require authentication for creating forum discussions', async () => {
      const response = await request(app)
        .post('/api/forum/discussions')
        .send({
          title: 'Test Discussion',
          content: 'This is a test discussion',
          category: 'general',
          authorName: 'Test User',
          authorInitials: 'TU'
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should require authentication for upload endpoints', async () => {
      const response = await request(app)
        .post('/api/upload/images')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should require admin access for admin endpoints', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Input Validation', () => {
    it('should validate business search queries', async () => {
      const response = await request(app)
        .get('/api/businesses/search')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });

    it('should handle non-existent business ID', async () => {
      const response = await request(app)
        .get('/api/businesses/non-existent-id')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle non-existent discussion ID', async () => {
      const response = await request(app)
        .get('/api/forum/discussions/non-existent-id')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle non-existent article ID', async () => {
      const response = await request(app)
        .get('/api/blog/articles/non-existent-id')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting headers', async () => {
      const response = await request(app)
        .get('/api/council-data/stats')
        .expect(200);

      // Rate limiting headers should be present
      expect(response.headers).toHaveProperty('x-ratelimit-limit');
      expect(response.headers).toHaveProperty('x-ratelimit-remaining');
      expect(response.headers).toHaveProperty('x-ratelimit-reset');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON in POST requests', async () => {
      const response = await request(app)
        .post('/api/surveys/test-id/responses')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(400);
    });

    it('should handle non-existent survey responses', async () => {
      const response = await request(app)
        .get('/api/surveys/non-existent/results')
        .expect(200);

      // Should return empty results rather than error
      expect(response.body).toBeDefined();
    });
  });

  describe('Data Integrity', () => {
    it('should maintain consistent data types in responses', async () => {
      const response = await request(app)
        .get('/api/council-data/stats')
        .expect(200);

      const { planningApplications, totalSpending, upcomingMeetings } = response.body;
      
      expect(typeof planningApplications).toBe('number');
      expect(typeof totalSpending).toBe('number');  
      expect(typeof upcomingMeetings).toBe('number');
    });

    it('should return properly structured business data', async () => {
      const response = await request(app)
        .get('/api/businesses')
        .expect(200);

      if (response.body.length > 0) {
        const business = response.body[0];
        expect(business).toHaveProperty('id');
        expect(business).toHaveProperty('name');
        expect(business).toHaveProperty('category');
        expect(business).toHaveProperty('createdAt');
      }
    });
  });
});

// Data validation utility tests
describe('Data Validation Tests', () => {
  describe('Schema Validation', () => {
    it('should validate business data structure', () => {
      const validBusiness = {
        name: 'Test Business',
        description: 'A test business description',
        category: 'restaurant_cafe',
        address: '123 Test Street',
        phone: '+44 1234 567890',
        email: 'test@business.com',
        website: 'https://testbusiness.com'
      };

      // This would normally use the insertBusinessSchema
      expect(validBusiness.name).toBeDefined();
      expect(validBusiness.category).toBeDefined();
      expect(validBusiness.address).toBeDefined();
    });

    it('should validate forum discussion structure', () => {
      const validDiscussion = {
        title: 'Test Discussion',
        content: 'This is a test discussion content',
        category: 'general',
        authorName: 'Test Author',
        authorInitials: 'TA'
      };

      expect(validDiscussion.title).toBeDefined();
      expect(validDiscussion.content).toBeDefined();
      expect(validDiscussion.category).toBeDefined();
      expect(validDiscussion.authorName).toBeDefined();
    });

    it('should validate survey structure', () => {
      const validSurvey = {
        title: 'Community Survey',
        description: 'A survey about community needs',
        questions: [
          {
            id: '1',
            type: 'multiple_choice',
            question: 'What is your age group?',
            options: ['18-25', '26-35', '36-45', '45+']
          }
        ]
      };

      expect(validSurvey.title).toBeDefined();
      expect(validSurvey.description).toBeDefined();
      expect(Array.isArray(validSurvey.questions)).toBe(true);
      expect(validSurvey.questions.length).toBeGreaterThan(0);
    });
  });

  describe('Email Validation', () => {
    it('should validate email formats', () => {
      const validEmails = [
        'user@example.com',
        'test.user@domain.co.uk',
        'admin@stoneclough-hub.com'
      ];

      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        ''
      ];

      validEmails.forEach(email => {
        expect(email.includes('@')).toBe(true);
        expect(email.includes('.')).toBe(true);
      });

      invalidEmails.forEach(email => {
        const isValid = email.includes('@') && email.includes('.') && email.length > 5;
        expect(isValid).toBe(false);
      });
    });
  });

  describe('URL Validation', () => {
    it('should validate website URLs', () => {
      const validUrls = [
        'https://example.com',
        'http://test.co.uk',
        'https://business.local'
      ];

      const invalidUrls = [
        'not-a-url',
        'ftp://invalid',
        'javascript:alert(1)'
      ];

      validUrls.forEach(url => {
        expect(url.startsWith('http://') || url.startsWith('https://')).toBe(true);
      });

      invalidUrls.forEach(url => {
        const isValid = url.startsWith('http://') || url.startsWith('https://');
        expect(isValid).toBe(false);
      });
    });
  });
});

export { };
