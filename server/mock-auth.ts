import express, { type Express, type RequestHandler } from "express";

// Mock users for demo purposes
export const mockUsers = {
  'admin@stoneclough.local': {
    id: 'admin-123',
    email: 'admin@stoneclough.local',
    firstName: 'Admin',
    lastName: 'User',
    name: 'Admin User',
    role: 'admin',
    password: 'admin123'
  },
  'mod@stoneclough.local': {
    id: 'mod-123',
    email: 'mod@stoneclough.local',
    firstName: 'Moderator',
    lastName: 'User',
    name: 'Moderator User',
    role: 'moderator',
    password: 'mod123'
  },
  'demo@stoneclough.local': {
    id: 'user-123',
    email: 'demo@stoneclough.local',
    firstName: 'Demo',
    lastName: 'User',
    name: 'Demo User',
    role: 'user',
    password: 'demo123'
  }
};

// In-memory session storage for demo
const activeSessions = new Map<string, any>();

export async function setupMockAuth(app: Express) {
  console.log('🔒 Setting up mock authentication for serverless deployment');
  
  // Middleware to extract user from mock token
  app.use(async (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token && activeSessions.has(token)) {
      (req as any).user = activeSessions.get(token);
    }
    next();
  });
}

// Mock authentication middleware
export const isAuthenticated: RequestHandler = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token || !activeSessions.has(token)) {
    return res.status(401).json({ message: "No authorization token provided" });
  }

  const user = activeSessions.get(token);
  if (!user) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  (req as any).user = user;
  next();
};

// Mock admin check
export const isAdmin: RequestHandler = (req, res, next) => {
  const user = (req as any).user;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

// Mock moderator check
export const isModerator: RequestHandler = (req, res, next) => {
  const user = (req as any).user;
  if (!user || !['moderator', 'admin'].includes(user.role)) {
    return res.status(403).json({ message: "Moderator or admin access required" });
  }
  next();
};

// Helper function to create a session token
export function createSession(user: any): string {
  const token = `mock-token-${user.id}-${Date.now()}`;
  activeSessions.set(token, user);
  return token;
}

// Helper function to destroy session
export function destroySession(token: string): void {
  activeSessions.delete(token);
}

// Mock authentication routes
export function createMockAuthRoutes() {
  const router = express.Router();

  // Mock signup
  router.post('/signup', (req, res) => {
    const { email, password, name } = req.body;
    
    if (mockUsers[email as keyof typeof mockUsers]) {
      return res.status(400).json({ error: { message: 'User already exists' } });
    }

    const newUser = {
      id: `user-${Date.now()}`,
      email,
      name,
      firstName: name.split(' ')[0] || 'User',
      lastName: name.split(' ')[1] || '',
      role: 'user',
      password
    };

    // Store the new user (in a real app, this would be in a database)
    (mockUsers as any)[email] = newUser;

    const token = createSession(newUser);

    res.json({
      user: {
        id: newUser.id,
        email: newUser.email,
        email_confirmed_at: new Date().toISOString()
      },
      session: {
        access_token: token,
        refresh_token: 'mock-refresh-token',
        user: newUser
      }
    });
  });

  // Mock signin
  router.post('/signin', (req, res) => {
    const { email, password } = req.body;
    const user = mockUsers[email as keyof typeof mockUsers];
    
    if (user && (user.password === password || !password)) {
      const token = createSession(user);
      
      res.json({
        user: {
          id: user.id,
          email: user.email,
          email_confirmed_at: new Date().toISOString()
        },
        session: {
          access_token: token,
          refresh_token: 'mock-refresh-token',
          user: user
        }
      });
    } else {
      res.status(400).json({ error: { message: 'Invalid email or password' } });
    }
  });

  // Mock signout
  router.post('/signout', isAuthenticated, (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      destroySession(token);
    }
    res.json({ message: 'Signed out successfully' });
  });

  // Mock user profile
  router.get('/me', isAuthenticated, (req, res) => {
    const user = (req as any).user;
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        created_at: new Date().toISOString(),
        email_confirmed: true,
      },
      profile: {
        id: `profile-${user.id}`,
        userId: user.id,
        displayName: user.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });
  });

  // Mock profile update
  router.put('/me', isAuthenticated, (req, res) => {
    const user = (req as any).user;
    const { name } = req.body;
    
    if (name) {
      user.name = name;
      user.firstName = name.split(' ')[0] || user.firstName;
      user.lastName = name.split(' ')[1] || user.lastName;
    }
    
    res.json({ message: 'Profile updated successfully' });
  });

  // Mock password reset
  router.post('/reset-password', (req, res) => {
    res.json({ message: 'Password reset email sent!' });
  });

  // Mock password update
  router.post('/update-password', isAuthenticated, (req, res) => {
    const user = (req as any).user;
    const { password } = req.body;
    
    if (user.email in mockUsers) {
      (mockUsers as any)[user.email].password = password;
    }
    
    res.json({ message: 'Password updated successfully' });
  });

  return router;
}
