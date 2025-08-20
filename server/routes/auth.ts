import { Router } from "express";
import { supabaseAdmin } from "../supabase";
import { storage } from "../storage";
import { isAuthenticated } from "../auth";
import { z } from "zod";

const router = Router();

// Validation schemas
const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const resetPasswordSchema = z.object({
  email: z.string().email(),
});

const updatePasswordSchema = z.object({
  password: z.string().min(6),
});

// Sign up endpoint
router.post("/signup", async (req, res) => {
  try {
    const { email, password, name } = signUpSchema.parse(req.body);

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        full_name: name,
      },
    });

    if (authError) {
      return res.status(400).json({ 
        message: authError.message,
        error: authError 
      });
    }

    if (!authData.user) {
      return res.status(400).json({ message: "Failed to create user" });
    }

    // Create user in our local database
    try {
      await storage.createUser({
        id: authData.user.id,
        email,
        name,
        firstName: null,
        lastName: null,
        profileImageUrl: null,
        role: 'user'
      });
    } catch (dbError) {
      console.error('Error creating user in local database:', dbError);
      // Don't fail the signup if local DB creation fails
    }

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name,
      }
    });

  } catch (error) {
    console.error("Signup error:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Invalid input", 
        errors: error.errors 
      });
    }
    res.status(500).json({ message: "Internal server error" });
  }
});

// Sign in endpoint (returns session info for client to handle)
router.post("/signin", async (req, res) => {
  try {
    const { email, password } = signInSchema.parse(req.body);

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(400).json({ 
        message: error.message,
        error: error 
      });
    }

    if (!data.user || !data.session) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Sync user with local database if needed
    try {
      const existingUser = await storage.getUserByEmail(email);
      if (!existingUser) {
        await storage.createUser({
          id: data.user.id,
          email,
          name: data.user.user_metadata?.full_name || email.split('@')[0],
          firstName: null,
          lastName: null,
          profileImageUrl: null,
          role: 'user'
        });
      }
    } catch (dbError) {
      console.error('Error syncing user in local database:', dbError);
    }

    res.json({
      message: "Signed in successfully",
      session: data.session,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.full_name,
      }
    });

  } catch (error) {
    console.error("Signin error:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Invalid input", 
        errors: error.errors 
      });
    }
    res.status(500).json({ message: "Internal server error" });
  }
});

// Sign out endpoint
router.post("/signout", isAuthenticated, async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      const { error } = await supabaseAdmin.auth.admin.signOut(token);
      if (error) {
        console.error("Signout error:", error);
      }
    }

    res.json({ message: "Signed out successfully" });
  } catch (error) {
    console.error("Signout error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get current user profile
router.get("/me", isAuthenticated, async (req, res) => {
  try {
    const user = (req as any).user;
    
    // Get user profile from local database
    const dbUser = await storage.getUserByEmail(user.email);
    let userProfile = null;
    
    if (dbUser) {
      userProfile = await storage.getUserProfile(dbUser.id);
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || dbUser?.name,
        role: dbUser?.role || 'user',
        created_at: user.created_at,
        email_confirmed: user.email_confirmed_at ? true : false,
      },
      profile: userProfile
    });

  } catch (error) {
    console.error("Get user profile error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update user profile
router.put("/me", isAuthenticated, async (req, res) => {
  try {
    const user = (req as any).user;
    const { name, ...profileData } = req.body;

    // Update user metadata in Supabase
    if (name) {
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        {
          user_metadata: {
            ...user.user_metadata,
            full_name: name,
          }
        }
      );

      if (updateError) {
        console.error("Error updating user metadata:", updateError);
      }
    }

    // Update local database
    const dbUser = await storage.getUserByEmail(user.email);
    if (dbUser) {
      // Update user name if provided
      if (name && name !== dbUser.name) {
        await storage.updateUser(dbUser.id, { name });
      }

      // Update profile if profile data provided
      if (Object.keys(profileData).length > 0) {
        const existingProfile = await storage.getUserProfile(dbUser.id);
        if (existingProfile) {
          await storage.updateProfile(existingProfile.id, profileData);
        } else {
          await storage.createProfile({
            userId: dbUser.id,
            ...profileData
          });
        }
      }
    }

    res.json({ message: "Profile updated successfully" });

  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Request password reset
router.post("/reset-password", async (req, res) => {
  try {
    const { email } = resetPasswordSchema.parse(req.body);

    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${process.env.APP_URL || 'http://localhost:5173'}/reset-password`,
      }
    );

    if (error) {
      return res.status(400).json({ 
        message: error.message,
        error: error 
      });
    }

    res.json({ message: "Password reset email sent" });

  } catch (error) {
    console.error("Reset password error:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Invalid input", 
        errors: error.errors 
      });
    }
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update password (requires authentication)
router.post("/update-password", isAuthenticated, async (req, res) => {
  try {
    const user = (req as any).user;
    const { password } = updatePasswordSchema.parse(req.body);

    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password }
    );

    if (error) {
      return res.status(400).json({ 
        message: error.message,
        error: error 
      });
    }

    res.json({ message: "Password updated successfully" });

  } catch (error) {
    console.error("Update password error:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Invalid input", 
        errors: error.errors 
      });
    }
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
