import { NextRequest, NextResponse } from 'next/server';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { councilData } from '@/shared/schema';
import { sql, desc, count, eq, and, like, gte, lte } from 'drizzle-orm';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const client = postgres(process.env.DATABASE_URL, { 
  ssl: { rejectUnauthorized: false },
  max: 1
});
const db = drizzle(client);

interface CivicDashboardData {
  summary: {
    totalRecords: number;
    planningApplications: number;
    councilSpending: number;
    totalSpendingAmount: number;
    councilMeetings: number;
    lastUpdated: Date;
  };
  recentPlanningApplications: any[];
  recentSpending: any[];
  upcomingMeetings: any[];
  spendingByDepartment: any[];
  planningByStatus: any[];
  dataTypes: any[];
  recentActivity: any[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dataType = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // If requesting specific data type
    if (dataType) {
      return await getSpecificDataType(dataType, limit, search, dateFrom, dateTo);
    }

    // Otherwise return dashboard summary
    const dashboardData = await getDashboardData();
    return NextResponse.json(dashboardData);

  } catch (error) {
    console.error('Civic API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch civic data' },
      { status: 500 }
    );
  }
}

async function getDashboardData(): Promise<CivicDashboardData> {
  // Get summary statistics
  const totalRecords = await db.select({ count: count() }).from(councilData);
  
  const planningApps = await db
    .select({ count: count() })
    .from(councilData)
    .where(eq(councilData.dataType, 'planning_application'));
  
  const spending = await db
    .select({ 
      count: count(),
      total: sql<number>`COALESCE(SUM(${councilData.amount}), 0)`
    })
    .from(councilData)
    .where(eq(councilData.dataType, 'council_spending'));
  
  const meetings = await db
    .select({ count: count() })
    .from(councilData)
    .where(eq(councilData.dataType, 'council_meeting'));

  // Get recent planning applications
  const recentPlanningApplications = await db
    .select()
    .from(councilData)
    .where(eq(councilData.dataType, 'planning_application'))
    .orderBy(desc(councilData.date))
    .limit(10);

  // Get recent spending
  const recentSpending = await db
    .select()
    .from(councilData)
    .where(eq(councilData.dataType, 'council_spending'))
    .orderBy(desc(councilData.date))
    .limit(10);

  // Get upcoming meetings
  const upcomingMeetings = await db
    .select()
    .from(councilData)
    .where(eq(councilData.dataType, 'council_meeting'))
    .orderBy(desc(councilData.date))
    .limit(10);

  // Get spending by department
  const spendingByDepartment = await db
    .select({
      department: sql<string>`COALESCE(${councilData.metadata}->>'department', 'Unknown')`,
      total: sql<number>`COALESCE(SUM(${councilData.amount}), 0)`,
      count: count()
    })
    .from(councilData)
    .where(eq(councilData.dataType, 'council_spending'))
    .groupBy(sql`${councilData.metadata}->>'department'`)
    .orderBy(desc(sql`SUM(${councilData.amount})`));

  // Get data type distribution
  const dataTypes = await db
    .select({
      type: councilData.dataType,
      count: count()
    })
    .from(councilData)
    .groupBy(councilData.dataType)
    .orderBy(desc(count()));

  // Get recent activity across all types
  const recentActivity = await db
    .select({
      id: councilData.id,
      title: councilData.title,
      dataType: councilData.dataType,
      date: councilData.date,
      createdAt: councilData.createdAt,
      amount: councilData.amount,
      location: councilData.location
    })
    .from(councilData)
    .orderBy(desc(councilData.createdAt))
    .limit(20);

  const lastUpdated = recentActivity[0]?.createdAt || new Date();

  return {
    summary: {
      totalRecords: Number(totalRecords[0]?.count || 0),
      planningApplications: Number(planningApps[0]?.count || 0),
      councilSpending: Number(spending[0]?.count || 0),
      totalSpendingAmount: Number(spending[0]?.total || 0),
      councilMeetings: Number(meetings[0]?.count || 0),
      lastUpdated
    },
    recentPlanningApplications,
    recentSpending,
    upcomingMeetings,
    spendingByDepartment,
    planningByStatus: [], // Will be populated when we have status data
    dataTypes,
    recentActivity
  };
}

async function getSpecificDataType(
  dataType: string, 
  limit: number, 
  search?: string | null,
  dateFrom?: string | null,
  dateTo?: string | null
) {
  let query = db.select().from(councilData);
  
  const conditions = [eq(councilData.dataType, dataType as any)];
  
  if (search) {
    conditions.push(
      sql`${councilData.title} ILIKE ${'%' + search + '%'} OR ${councilData.description} ILIKE ${'%' + search + '%'}`
    );
  }
  
  if (dateFrom) {
    conditions.push(gte(councilData.date, new Date(dateFrom)));
  }
  
  if (dateTo) {
    conditions.push(lte(councilData.date, new Date(dateTo)));
  }
  
  const results = await query
    .where(and(...conditions))
    .orderBy(desc(councilData.date))
    .limit(limit);
  
  return NextResponse.json(results);
}

// Additional endpoint for search across all data
export async function POST(request: NextRequest) {
  try {
    const { query, filters } = await request.json();
    
    let dbQuery = db.select().from(councilData);
    const conditions = [];
    
    if (query) {
      conditions.push(
        sql`${councilData.title} ILIKE ${'%' + query + '%'} OR ${councilData.description} ILIKE ${'%' + query + '%'}`
      );
    }
    
    if (filters?.dataType) {
      conditions.push(eq(councilData.dataType, filters.dataType));
    }
    
    if (filters?.dateFrom) {
      conditions.push(gte(councilData.date, new Date(filters.dateFrom)));
    }
    
    if (filters?.dateTo) {
      conditions.push(lte(councilData.date, new Date(filters.dateTo)));
    }
    
    if (filters?.minAmount && filters?.maxAmount) {
      conditions.push(
        and(
          gte(councilData.amount, filters.minAmount),
          lte(councilData.amount, filters.maxAmount)
        )
      );
    }
    
    const results = await dbQuery
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(councilData.date))
      .limit(filters?.limit || 50);
    
    return NextResponse.json(results);
    
  } catch (error) {
    console.error('Civic search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
