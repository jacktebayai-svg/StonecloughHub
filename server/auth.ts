import type { Express, RequestHandler } from "express";
import { supabaseAdmin, createSupabaseServerClient } from "./supabase";
import { storage } from "./storage";

// Helper function to extract user from Supabase JWT token
export async function getUserFromToken(token: string) {
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      return null;
    }
    return user;
  } catch (error) {
    console.error('Error getting user from token:', error);
    return null;
  }
}

export async function setupAuth(app: Express) {
  // Check for required Supabase env variables
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY || !process.env.SUPABASE_ANON_KEY) {
    throw new Error('Missing required Supabase environment variables');
  }

  app.set("trust proxy", 1);

  // Middleware to extract user from Supabase token
  app.use(async (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      const user = await getUserFromToken(token);
      if (user) {
        // Sync user with our local database
        try {
          const existingUser = await storage.getUserByEmail(user.email!);
          if (!existingUser) {
            // Create user in our local database
            await storage.createUser({
              id: user.id,
              email: user.email!,
              name: user.user_metadata?.name || user.email,
              firstName: user.user_metadata?.first_name || null,
              lastName: user.user_metadata?.last_name || null,
              profileImageUrl: user.user_metadata?.avatar_url || null,
              role: 'user'
            });
          }
        } catch (error) {
          console.error('Error syncing user:', error);
        }
        (req as any).user = user;
      }
    }
    next();
  });
}

// Middleware to check if user is authenticated via Supabase
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: "No authorization token provided" });
  }

  const user = await getUserFromToken(token);
  if (!user) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  (req as any).user = user;
  next();
};

// Middleware to check if user is admin
export const isAdmin: RequestHandler = async (req, res, next) => {
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const dbUser = await storage.getUserByEmail(user.email);
    if (!dbUser || dbUser.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  } catch (error) {
    console.error('Error checking admin status:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Middleware to check if user is moderator or admin
export const isModerator: RequestHandler = async (req, res, next) => {
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const dbUser = await storage.getUserByEmail(user.email);
    if (!dbUser || (dbUser.role !== 'moderator' && dbUser.role !== 'admin')) {
      return res.status(403).json({ message: "Moderator or admin access required" });
    }
    next();
  } catch (error) {
    console.error('Error checking moderator status:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// CRUD Policy Middleware with proper authentication
export const canCreateBusiness: RequestHandler = isAuthenticated;

export const canModifyBusiness: RequestHandler = async (req, res, next) => {
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Users can modify their own businesses, admins can modify any
  const businessId = req.params.id;
  if (businessId) {
    try {
      const business = await storage.getBusiness(businessId);
      const dbUser = await storage.getUserByEmail(user.email);
      
      if (business && dbUser && (business.userId === dbUser.id || dbUser.role === 'admin')) {
        return next();
      }
      return res.status(403).json({ message: "Cannot modify this business" });
    } catch (error) {
      return res.status(500).json({ message: "Error checking permissions" });
    }
  }
  
  next();
};

export const canAccessAdmin: RequestHandler = isAdmin;

export const canModifyContent: RequestHandler = isModerator;
