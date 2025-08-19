import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    const { url, method } = req;
    
    // Mock users database
    const mockUsers = {
      'admin@stoneclough.local': {
        id: 'admin-123',
        email: 'admin@stoneclough.local',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        password: 'admin123'
      },
      'demo@stoneclough.local': {
        id: 'user-123', 
        email: 'demo@stoneclough.local',
        firstName: 'Demo',
        lastName: 'User', 
        role: 'user',
        password: 'demo123'
      },
      'moderator@stoneclough.local': {
        id: 'mod-123',
        email: 'moderator@stoneclough.local',
        firstName: 'Moderator',
        lastName: 'User',
        role: 'moderator',
        password: 'mod123'
      }
    };

    // Authentication endpoints
    if (url?.includes('/api/auth/signup') && method === 'POST') {
      // Mock signup - simulate Supabase response
      const body = req.body;
      res.json({ 
        user: {
          id: 'new-user-' + Date.now(),
          email: body.email,
          email_confirmed_at: new Date().toISOString()
        },
        session: {
          access_token: 'mock-token-' + Date.now(),
          refresh_token: 'mock-refresh-token'
        }
      });
      return;
    }
    
    if (url?.includes('/api/auth/signin') && method === 'POST') {
      // Mock signin with actual user validation
      const body = req.body;
      const user = mockUsers[body.email];
      
      if (user && (user.password === body.password || !body.password)) {
        // Successful login
        res.json({
          user: {
            id: user.id,
            email: user.email,
            email_confirmed_at: new Date().toISOString()
          },
          session: {
            access_token: `mock-token-${user.id}`,
            refresh_token: 'mock-refresh-token',
            user: user
          }
        });
      } else {
        res.status(400).json({ error: { message: 'Invalid email or password' } });
      }
      return;
    }
    
    if (url?.includes('/api/auth/reset-password') && method === 'POST') {
      // Mock password reset
      res.json({ message: 'Password reset email sent!' });
      return;
    }
    
    if (url?.includes('/api/auth/me')) {
      if (method === 'GET') {
        // Mock user profile check
        const authHeader = req.headers.authorization;
        const token = authHeader?.replace('Bearer ', '');
        
        // Extract user ID from token
        const userId = token?.includes('admin') ? 'admin-123' : 
                      token?.includes('mod') ? 'mod-123' : 'user-123';
                      
        const user = Object.values(mockUsers).find(u => u.id === userId);
        
        if (user && token) {
          res.json({
            user: {
              id: user.id,
              email: user.email,
              name: `${user.firstName} ${user.lastName}`,
              role: user.role
            },
            profile: {
              id: `profile-${user.id}`,
              userId: user.id,
              displayName: `${user.firstName} ${user.lastName}`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          });
        } else {
          res.status(401).json({ message: 'Unauthorized' });
        }
        return;
      }
      if (method === 'PUT') {
        // Mock profile update
        res.json({ message: 'Profile updated successfully' });
        return;
      }
    }
    
    if (url?.includes('/api/auth/google')) {
      // Redirect to Google OAuth (mock for now)
      res.redirect('/?auth=success');
      return;
    }
    
    if (url?.includes('/api/auth/user')) {
      // Mock user session check
      const authHeader = req.headers.authorization;
      if (authHeader === 'Bearer mock-token') {
        res.json({
          id: 'user-123',
          email: 'demo@stoneclough.local',
          firstName: 'Demo',
          lastName: 'User',
          role: 'user'
        });
      } else {
        res.status(401).json({ message: 'Unauthorized' });
      }
      return;
    }
    
    if (url?.includes('/api/logout')) {
      res.json({ message: 'Logged out successfully' });
      return;
    }
    
    if (url?.includes('/api/council-data/stats')) {
      res.json({
        planningApplications: 12,
        totalSpending: 850000,
        upcomingMeetings: 3
      });
      return;
    }
    
    if (url?.includes('/api/council-data')) {
      res.json([
        {
          id: '1',
          title: 'Planning Application: 23/00234/FULL',
          description: 'Single storey rear extension at 45 Church Road, Stoneclough',
          dataType: 'planning_application',
          status: 'Approved',
          date: new Date('2024-01-15'),
          location: '45 Church Road, Stoneclough'
        }
      ]);
      return;
    }
    
    if (url?.includes('/api/businesses')) {
      res.json([
        {
          id: '1',
          name: 'The Village Cafe',
          description: 'Cozy local cafe serving fresh coffee and homemade cakes',
          category: 'restaurant_cafe',
          address: '23 High Street, Stoneclough BL4 7TY',
          phone: '01204 555123',
          isVerified: true
        }
      ]);
      return;
    }
    
    if (url?.includes('/api/forum/discussions')) {
      res.json([
        {
          id: '1',
          title: 'New Traffic Lights on High Street - What Do You Think?',
          content: 'I noticed they\'re installing new traffic lights at the High Street junction.',
          category: 'general',
          authorName: 'Sarah M.',
          authorInitials: 'SM',
          likes: 5,
          views: 24,
          replyCount: 3,
          createdAt: new Date()
        }
      ]);
      return;
    }
    
    if (url?.includes('/api/blog/articles')) {
      res.json([
        {
          id: '1',
          title: 'Understanding Local Planning Applications: A Resident\'s Guide',
          content: 'Planning applications can seem complex, but understanding the process helps...',
          excerpt: 'A comprehensive guide to understanding how planning applications work in Stoneclough.',
          category: 'Planning',
          readTime: 8,
          isFeatured: true,
          authorName: 'Stoneclough Hub Team',
          createdAt: new Date()
        }
      ]);
      return;
    }
    
    if (url?.includes('/api/surveys')) {
      res.json([
        {
          id: '1',
          title: 'Traffic Management Survey',
          description: 'Help us understand residents\' concerns about traffic and parking in Stoneclough',
          status: 'active',
          responseCount: 45,
          endsAt: new Date('2024-06-30'),
          createdAt: new Date()
        }
      ]);
      return;
    }
    
    // Default response
    res.status(404).json({ error: 'API endpoint not found' });
    
  } catch (error) {
    console.error('Serverless function error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
