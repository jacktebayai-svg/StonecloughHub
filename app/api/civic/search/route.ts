import { NextRequest, NextResponse } from 'next/server';
import { civicAPI } from '@/lib/civic-api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const query = searchParams.get('q');
    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    const options = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      category: searchParams.get('category') || undefined,
      includeServices: searchParams.get('includeServices') !== 'false',
      includeMeetings: searchParams.get('includeMeetings') !== 'false',
      includePages: searchParams.get('includePages') !== 'false',
    };

    const result = await civicAPI.search(query, options);
    
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'X-API-Version': '1.0',
        'X-Query-Time': `${result.performance.queryTime}ms`,
        'X-Search-Query': query
      }
    });
  } catch (error) {
    console.error('Civic Search API Error:', error);
    return NextResponse.json(
      { error: 'Failed to search civic data' },
      { status: 500 }
    );
  }
}
