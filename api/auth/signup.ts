import type { VercelRequest, VercelResponse } from '@vercel/node';
import 'dotenv/config';
import { supabaseAdmin } from '../../server/supabase';
import { storage } from '../../server/storage';
import { z } from 'zod';

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method not allowed' });
    return;
  }

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
}
