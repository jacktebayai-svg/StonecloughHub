import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check for authorization header (mock session)
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer mock_token_')) {
      // Extract token and check if it's valid (basic validation)
      const token = authHeader.replace('Bearer ', '');
      
      if (token.startsWith('mock_token_')) {
        // Extract timestamp from token
        const timestamp = parseInt(token.replace('mock_token_', ''));
        const now = Date.now();
        
        // Check if token is still valid (1 hour = 3600000 ms)
        if (now - timestamp < 3600000) {
          // Return a mock user based on token
          const mockUser = {
            id: 'demo@stoneclough.local',
            email: 'demo@stoneclough.local',
            user_metadata: {
              full_name: 'Demo User',
              role: 'user'
            }
          };
          
          return res.status(200).json(mockUser);
        }
      }
    }

    // No valid session found
    return res.status(401).json({ error: 'Not authenticated' });
  } catch (error) {
    console.error('User check error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
