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
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Demo accounts for testing
    const demoAccounts = {
      'demo@stoneclough.local': { password: 'demo123', role: 'user', name: 'Demo User' },
      'admin@stoneclough.local': { password: 'admin123', role: 'admin', name: 'Admin User' },
      'moderator@stoneclough.local': { password: 'mod123', role: 'moderator', name: 'Moderator User' }
    };

    const account = demoAccounts[email as keyof typeof demoAccounts];
    
    if (account && account.password === password) {
      // Create a mock session
      const session = {
        access_token: `mock_token_${Date.now()}`,
        refresh_token: `mock_refresh_${Date.now()}`,
        expires_in: 3600,
        expires_at: Date.now() + (3600 * 1000),
        user: {
          id: email,
          email: email,
          user_metadata: {
            full_name: account.name,
            role: account.role
          }
        }
      };

      return res.status(200).json({
        user: session.user,
        session: session
      });
    } else {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Signin error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
