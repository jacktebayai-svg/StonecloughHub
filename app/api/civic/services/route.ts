import { NextRequest, NextResponse } from 'next/server';
import { civicAPI } from '@/lib/civic-api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const options = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      category: searchParams.get('category') || undefined,
      department: searchParams.get('department') || undefined,
      onlineOnly: searchParams.get('onlineOnly') === 'true',
      search: searchParams.get('search') || undefined,
    };

    const result = await civicAPI.getServices(options);
    
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-API-Version': '1.0',
        'X-Query-Time': `${result.performance.queryTime}ms`
      }
    });
  } catch (error) {
    console.error('Civic Services API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch civic services' },
      { status: 500 }
    );
  }
}
