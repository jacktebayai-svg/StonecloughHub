import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, full_name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // For demo purposes, we'll simulate a successful signup
    // In a real app, this would create a user in Supabase
    
    const newUser = {
      id: `user_${Date.now()}`,
      email: email,
      user_metadata: {
        full_name: full_name || 'New User',
        role: 'user'
      },
      email_confirmed_at: null // Simulate requiring email confirmation
    };

    return res.status(200).json({
      user: newUser,
      session: null, // No session until email is confirmed
      message: 'Check your email for the confirmation link!'
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
