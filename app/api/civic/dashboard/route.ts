import { NextRequest, NextResponse } from 'next/server';
import { civicAPI } from '@/lib/civic-api';

export async function GET(request: NextRequest) {
  try {
    const result = await civicAPI.getDashboardData();
    
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1800',
        'X-API-Version': '1.0',
        'X-Data-Timestamp': new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Civic Dashboard API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
