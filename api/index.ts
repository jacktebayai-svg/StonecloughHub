import type { VercelRequest, VercelResponse } from '@vercel/node';
import 'dotenv/config';

// Simple health check endpoint for now
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    // Health check
    if (req.method === 'GET') {
      res.status(200).json({ 
        message: 'StonecloughHub API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      });
      return;
    }

    // For now, return 404 for other routes
    res.status(404).json({ error: 'Endpoint not found' });
  } catch (error) {
    console.error('Error in serverless function:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
