import { GraphQLSchema, GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLBoolean, GraphQLList, GraphQLNonNull, GraphQLEnumType, GraphQLInputObjectType } from 'graphql';
import { GraphQLDateTime } from 'graphql-scalars';
import { db } from '../db';
import { councilData } from '@shared/schema';
import { eq, desc, asc, and, or, like, gte, lte, sql } from 'drizzle-orm';

// ============================================
// GRAPHQL TYPE DEFINITIONS
// ============================================

const DataTypeEnum = new GraphQLEnumType({
  name: 'DataType',
  values: {
    PLANNING_APPLICATION: { value: 'planning_application' },
    COUNCIL_SPENDING: { value: 'council_spending' },
    COUNCIL_MEETING: { value: 'council_meeting' },
    CONSULTATION: { value: 'consultation' },
    COUNCIL_PAGE: { value: 'council_page' },
    COUNCIL_DOCUMENT: { value: 'council_document' },
    TRANSPARENCY_DATA: { value: 'transparency_data' },
    BUDGET_ITEM: { value: 'budget_item' },
    SPENDING_RECORD: { value: 'spending_record' },
    STATISTICAL_DATA: { value: 'statistical_data' },
    COUNCILLOR: { value: 'councillor' },
    DEPARTMENT: { value: 'department' },
    SERVICE: { value: 'service' },
    DOCUMENT: { value: 'document' },
    CHART_DATA: { value: 'chart_data' },
  }
});

const CouncilDataType = new GraphQLObjectType({
  name: 'CouncilData',
  fields: {
    id: { type: GraphQLString },
    title: { type: GraphQLString },
    description: { type: GraphQLString },
    dataType: { type: DataTypeEnum },
    sourceUrl: { type: GraphQLString },
    amount: { type: GraphQLInt },
    status: { type: GraphQLString },
    date: { type: GraphQLDateTime },
    location: { type: GraphQLString },
    createdAt: { type: GraphQLDateTime },
  }
});

const PaginationInfoType = new GraphQLObjectType({
  name: 'PaginationInfo',
  fields: {
    page: { type: GraphQLInt },
    limit: { type: GraphQLInt },
    total: { type: GraphQLInt },
    totalPages: { type: GraphQLInt },
    hasNext: { type: GraphQLBoolean },
    hasPrev: { type: GraphQLBoolean },
  }
});

const CouncilDataConnection = new GraphQLObjectType({
  name: 'CouncilDataConnection',
  fields: {
    data: { type: new GraphQLList(CouncilDataType) },
    pagination: { type: PaginationInfoType },
  }
});

const SearchResult = new GraphQLObjectType({
  name: 'SearchResult',
  fields: {
    data: { type: new GraphQLList(CouncilDataType) },
    query: { type: GraphQLString },
    resultCount: { type: GraphQLInt },
  }
});

// ============================================
// INPUT TYPES
// ============================================

const CouncilDataFiltersInput = new GraphQLInputObjectType({
  name: 'CouncilDataFilters',
  fields: {
    dataType: { type: DataTypeEnum },
    status: { type: GraphQLString },
    dateFrom: { type: GraphQLDateTime },
    dateTo: { type: GraphQLDateTime },
    minAmount: { type: GraphQLInt },
    maxAmount: { type: GraphQLInt },
    search: { type: GraphQLString },
  }
});

// ============================================
// RESOLVERS
// ============================================

const resolvers = {
  // Get council data with filtering
  councilData: async (
    _: any,
    args: {
      filters?: any;
      page?: number;
      limit?: number;
    }
  ) => {
    const { filters = {}, page = 1, limit = 20 } = args;
    
    const cacheKey = `graphql_council_data:${JSON.stringify({ filters, page, limit })}`;
    
    const conditions = [];
    
    // Apply filters
    if (filters.dataType) {
      conditions.push(eq(councilData.dataType, filters.dataType));
    }
    if (filters.status) {
      conditions.push(eq(councilData.status, filters.status));
    }
    if (filters.dateFrom) {
      conditions.push(gte(councilData.date, new Date(filters.dateFrom)));
    }
    if (filters.dateTo) {
      conditions.push(lte(councilData.date, new Date(filters.dateTo)));
    }
    if (filters.minAmount !== undefined) {
      conditions.push(gte(councilData.amount, filters.minAmount));
    }
    if (filters.maxAmount !== undefined) {
      conditions.push(lte(councilData.amount, filters.maxAmount));
    }
    if (filters.search) {
      conditions.push(
        or(
          like(councilData.title, `%${filters.search}%`),
          like(councilData.description, `%${filters.search}%`)
        )
      );
    }
    
    // Build complete query chain
    const offset = (page - 1) * limit;
    let query = db.select().from(councilData);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }
    
    query = query.orderBy(desc(councilData.date)) as typeof query;
    query = query.limit(limit).offset(offset) as typeof query;
    
    const result = await query;
    
    // Get total count
    const countConditions = [];
    
    // Apply same filters for count
    if (filters.dataType) {
      countConditions.push(eq(councilData.dataType, filters.dataType));
    }
    if (filters.status) {
      countConditions.push(eq(councilData.status, filters.status));
    }
    if (filters.search) {
      countConditions.push(
        or(
          like(councilData.title, `%${filters.search}%`),
          like(councilData.description, `%${filters.search}%`)
        )
      );
    }
    
    let countQuery = db.select({ count: sql`count(*)` }).from(councilData);
    
    if (countConditions.length > 0) {
      countQuery = countQuery.where(and(...countConditions)) as typeof countQuery;
    }
    
    const totalResult = await countQuery;
    
    const total = Number(totalResult[0].count);
    const totalPages = Math.ceil(total / limit);
    
    return {
      data: result,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  },

  // Get single council data item
  councilDataById: async (_: any, args: { id: string }) => {
    const result = await db.select().from(councilData).where(eq(councilData.id, args.id));
    
    return result[0] || null;
  },

  // Search with basic features
  search: async (_: any, args: { query: string; limit?: number }) => {
    const { query: searchQuery, limit = 10 } = args;
    
    const query = db.select()
      .from(councilData)
      .where(
        or(
          like(councilData.title, `%${searchQuery}%`),
          like(councilData.description, `%${searchQuery}%`)
        )
      )
      .limit(limit)
      .orderBy(desc(councilData.date));
    
    const results = await query;
    
    return {
      data: results,
      query: searchQuery,
      resultCount: results.length,
    };
  },
};

// ============================================
// GRAPHQL SCHEMA
// ============================================

const QueryType = new GraphQLObjectType({
  name: 'Query',
  fields: {
    councilData: {
      type: CouncilDataConnection,
      args: {
        filters: { type: CouncilDataFiltersInput },
        page: { type: GraphQLInt, defaultValue: 1 },
        limit: { type: GraphQLInt, defaultValue: 20 },
      },
      resolve: resolvers.councilData,
    },
    
    councilDataById: {
      type: CouncilDataType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: resolvers.councilDataById,
    },
    
    search: {
      type: SearchResult,
      args: {
        query: { type: new GraphQLNonNull(GraphQLString) },
        limit: { type: GraphQLInt, defaultValue: 10 },
      },
      resolve: resolvers.search,
    },
  },
});

export const schema = new GraphQLSchema({
  query: QueryType,
});

export default schema;
