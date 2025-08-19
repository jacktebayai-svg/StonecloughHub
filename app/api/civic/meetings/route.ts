import { NextRequest, NextResponse } from 'next/server';
import { civicAPI } from '@/lib/civic-api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const options = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      committee: searchParams.get('committee') || undefined,
      status: searchParams.get('status') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      publicOnly: searchParams.get('publicOnly') === 'true',
    };

    const result = await civicAPI.getMeetings(options);
    
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-API-Version': '1.0',
        'X-Query-Time': `${result.performance.queryTime}ms`
      }
    });
  } catch (error) {
    console.error('Civic Meetings API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch civic meetings' },
      { status: 500 }
    );
  }
}
