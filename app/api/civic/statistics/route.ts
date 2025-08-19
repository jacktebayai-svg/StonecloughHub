import { NextRequest, NextResponse } from 'next/server';
import { civicAPI } from '@/lib/civic-api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const options = {
      category: searchParams.get('category') || undefined,
      subcategory: searchParams.get('subcategory') || undefined,
      metric: searchParams.get('metric') || undefined,
      period: searchParams.get('period') || undefined,
    };

    const result = await civicAPI.getStatistics(options);
    
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
        'X-API-Version': '1.0',
        'X-Data-Count': result.length.toString()
      }
    });
  } catch (error) {
    console.error('Civic Statistics API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch civic statistics' },
      { status: 500 }
    );
  }
}
