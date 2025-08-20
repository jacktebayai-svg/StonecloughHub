import { GraphQLSchema, GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLFloat, GraphQLBoolean, GraphQLList, GraphQLNonNull, GraphQLEnumType, GraphQLInputObjectType } from 'graphql';
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
    BUDGET_ITEM: { value: 'budget_item' },
    SPENDING_RECORD: { value: 'spending_record' },
    COUNCILLOR: { value: 'councillor' },
    DEPARTMENT: { value: 'department' },
    MEETING: { value: 'meeting' },
    DECISION: { value: 'decision' },
    SERVICE: { value: 'service' },
    PERFORMANCE_METRIC: { value: 'performance_metric' },
    PLANNING_APPLICATION: { value: 'planning_application' },
    DOCUMENT: { value: 'document' },
    STATISTICAL_DATA: { value: 'statistical_data' },
    POLICY: { value: 'policy' },
    CONSULTATION: { value: 'consultation' },
    CHART_DATA: { value: 'chart_data' },
  }
});

const PriorityEnum = new GraphQLEnumType({
  name: 'Priority',
  values: {
    HIGH: { value: 'high' },
    MEDIUM: { value: 'medium' },
    LOW: { value: 'low' },
  }
});

const ResidentImpactEnum = new GraphQLEnumType({
  name: 'ResidentImpact',
  values: {
    HIGH: { value: 'high' },
    MEDIUM: { value: 'medium' },
    LOW: { value: 'low' },
    NONE: { value: 'none' },
  }
});

const SortOrderEnum = new GraphQLEnumType({
  name: 'SortOrder',
  values: {
    ASC: { value: 'asc' },
    DESC: { value: 'desc' },
  }
});

const CivicDataType = new GraphQLObjectType({
  name: 'CivicData',
  fields: {
    id: { type: GraphQLString },
    title: { type: GraphQLString },
    description: { type: GraphQLString },
    dataType: { type: DataTypeEnum },
    category: { type: GraphQLString },
    subcategory: { type: GraphQLString },
    sourceUrl: { type: GraphQLString },
    department: { type: GraphQLString },
    ward: { type: GraphQLString },
    amount: { type: GraphQLFloat },
    value: { type: GraphQLFloat },
    unit: { type: GraphQLString },
    date: { type: GraphQLDateTime },
    status: { type: GraphQLString },
    location: { type: GraphQLString },
    priority: { type: PriorityEnum },
    residentImpact: { type: ResidentImpactEnum },
    publicInterest: { type: GraphQLBoolean },
    extractedData: { type: GraphQLString }, // JSON as string
    structuredData: { type: GraphQLString }, // JSON as string
    relatedItems: { type: new GraphQLList(GraphQLString) },
    tags: { type: new GraphQLList(GraphQLString) },
    confidence: { type: GraphQLString },
    lastValidated: { type: GraphQLDateTime },
    createdAt: { type: GraphQLDateTime },
    updatedAt: { type: GraphQLDateTime },
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

const CivicDataConnection = new GraphQLObjectType({
  name: 'CivicDataConnection',
  fields: {
    data: { type: new GraphQLList(CivicDataType) },
    pagination: { type: PaginationInfoType },
  }
});

const AggregationResult = new GraphQLObjectType({
  name: 'AggregationResult',
  fields: {
    group: { type: GraphQLString },
    value: { type: GraphQLFloat },
    count: { type: GraphQLInt },
  }
});

const SearchResult = new GraphQLObjectType({
  name: 'SearchResult',
  fields: {
    data: { type: new GraphQLList(CivicDataType) },
    query: { type: GraphQLString },
    resultCount: { type: GraphQLInt },
    suggestions: { type: new GraphQLList(GraphQLString) },
  }
});

const FilterOptionsType = new GraphQLObjectType({
  name: 'FilterOptions',
  fields: {
    dataTypes: { type: new GraphQLList(GraphQLString) },
    categories: { type: new GraphQLList(GraphQLString) },
    departments: { type: new GraphQLList(GraphQLString) },
    wards: { type: new GraphQLList(GraphQLString) },
    priorities: { type: new GraphQLList(GraphQLString) },
  }
});

const PerformanceStatsType = new GraphQLObjectType({
  name: 'PerformanceStats',
  fields: {
    totalQueries: { type: GraphQLInt },
    uniqueQueries: { type: GraphQLInt },
    averageQueryTime: { type: GraphQLInt },
    slowQueriesCount: { type: GraphQLInt },
  }
});

// ============================================
// INPUT TYPES
// ============================================

const CivicDataFiltersInput = new GraphQLInputObjectType({
  name: 'CivicDataFilters',
  fields: {
    dataType: { type: DataTypeEnum },
    category: { type: GraphQLString },
    department: { type: GraphQLString },
    ward: { type: GraphQLString },
    priority: { type: PriorityEnum },
    dateFrom: { type: GraphQLDateTime },
    dateTo: { type: GraphQLDateTime },
    minAmount: { type: GraphQLFloat },
    maxAmount: { type: GraphQLFloat },
    residentImpact: { type: ResidentImpactEnum },
    publicInterest: { type: GraphQLBoolean },
    search: { type: GraphQLString },
  }
});

const SortInput = new GraphQLInputObjectType({
  name: 'Sort',
  fields: {
    field: { type: GraphQLString },
    order: { type: SortOrderEnum },
  }
});

const AggregationInput = new GraphQLInputObjectType({
  name: 'AggregationInput',
  fields: {
    groupBy: { type: new GraphQLNonNull(GraphQLString) },
    metric: { type: GraphQLString },
    field: { type: GraphQLString },
    dateRange: { type: GraphQLString },
  }
});

// ============================================
// RESOLVERS
// ============================================

const resolvers = {
  // Get civic data with advanced filtering
  councilData: async (
    _: any,
    args: {
      filters?: any;
      sort?: { field: string; order: 'asc' | 'desc' };
      page?: number;
      limit?: number;
    }
  ) => {
    const { filters = {}, sort = { field: 'date', order: 'desc' }, page = 1, limit = 20 } = args;
    
    const cacheKey = `graphql_civic_data:${JSON.stringify({ filters, sort, page, limit })}`;
    
    let query = db.select().from(councilData);
    const conditions = [];
    
    // Apply filters
    if (filters.dataType) {
      conditions.push(eq(councilData.dataType, filters.dataType));
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
    
    // Apply conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    // Sorting
    let sortField;
    switch (sort.field) {
      case 'title':
        sortField = councilData.title;
        break;
      case 'amount':
        sortField = councilData.amount;
        break;
      case 'status':
        sortField = councilData.status;
        break;
      case 'date':
      default:
        sortField = councilData.date;
        break;
    }
    query = query.orderBy(
      sort.order === 'desc' ? desc(sortField) : asc(sortField)
    );
    
    // Pagination
    const offset = (page - 1) * limit;
    query = query.limit(limit).offset(offset);
    
    const result = await query;
    
    // Get total count
    let countQuery = db.select({ count: sql`count(*)` }).from(councilData);
    const countConditions = [];
    
    // Apply same filters for count
    if (filters.dataType) {
      countConditions.push(eq(councilData.dataType, filters.dataType));
    }
    if (filters.search) {
      countConditions.push(
        or(
          like(councilData.title, `%${filters.search}%`),
          like(councilData.description, `%${filters.search}%`)
        )
      );
    }
    
    if (countConditions.length > 0) {
      countQuery = countQuery.where(and(...countConditions));
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

  // Get single civic data item
  councilDataById: async (_: any, args: { id: string }) => {
    const result = await db.select().from(councilData).where(eq(councilData.id, args.id));
    
    return result[0] || null;
  },

  // Aggregation queries
  aggregateData: async (_: any, args: { input: any }) => {
    const { groupBy, metric = 'count', field, dateRange } = args.input;
    const cacheKey = `graphql_aggregate:${JSON.stringify(args.input)}`;
    
    let query;
    let groupByField;
    
    // Map groupBy parameter to actual column
    switch (groupBy) {
      case 'status':
        groupByField = councilData.status;
        break;
      case 'dataType':
        groupByField = councilData.dataType;
        break;
      case 'date':
        groupByField = councilData.date;
        break;
      default:
        throw new Error(`Invalid groupBy field: ${groupBy}`);
    }
    
    switch (metric) {
      case 'count':
        query = db
          .select({
            group: groupByField,
            value: sql`count(*)::int`,
            count: sql`count(*)::int`,
          })
          .from(councilData)
          .groupBy(groupByField);
        break;
        
      case 'sum':
        if (!field) {
          throw new Error('Field is required for sum metric');
        }
        let sumField;
        switch (field) {
          case 'amount':
            sumField = councilData.amount;
            break;
          default:
            throw new Error(`Invalid sum field: ${field}`);
        }
        query = db
          .select({
            group: groupByField,
            value: sql`sum(${sumField})::float`,
            count: sql`count(*)::int`,
          })
          .from(councilData)
          .groupBy(groupByField);
        break;
        
      case 'avg':
        if (!field) {
          throw new Error('Field is required for avg metric');
        }
        let avgField;
        switch (field) {
          case 'amount':
            avgField = councilData.amount;
            break;
          default:
            throw new Error(`Invalid avg field: ${field}`);
        }
        query = db
          .select({
            group: groupByField,
            value: sql`avg(${avgField})::float`,
            count: sql`count(*)::int`,
          })
          .from(councilData)
          .groupBy(groupByField);
        break;
        
      default:
        throw new Error(`Unsupported metric: ${metric}`);
    }
    
    const result = await query.orderBy(sql`value DESC`);
    
    return result;
  },

  // Search with advanced features
  search: async (_: any, args: { query: string; filters?: any; limit?: number; fuzzy?: boolean }) => {
    const { query: searchQuery, filters = {}, limit = 10, fuzzy = false } = args;
    const cacheKey = `graphql_search:${JSON.stringify(args)}`;
    
    let query = db.select().from(councilData);
    const conditions = [];
    
    // Search conditions
    if (fuzzy) {
      conditions.push(sql`similarity(title || ' ' || description, ${searchQuery}) > 0.3`);
    } else {
      conditions.push(
        or(
          like(councilData.title, `%${searchQuery}%`),
          like(councilData.description, `%${searchQuery}%`)
        )
      );
    }
    
    // Apply additional filters
    if (filters.dataType) {
      conditions.push(eq(councilData.dataType, filters.dataType));
    }
    
    query = query.where(and(...conditions));
    
    const results = await query
      .limit(limit)
      .orderBy(desc(councilData.date));
    
    return {
      data: results,
      query: searchQuery,
      resultCount: results.length,
      suggestions: [], // Could implement AI-powered suggestions here
    };
  },

  // Get filter options
  filterOptions: async () => {
    const dataTypes = await db.selectDistinct({ value: councilData.dataType }).from(councilData);
    
    return {
      dataTypes: dataTypes.map(d => d.value).filter(Boolean),
      categories: [],
      departments: [],
      wards: [],
      priorities: [],
    };
  },

  // Performance statistics
  performanceStats: async () => {
    return {
      totalQueries: 0,
      uniqueQueries: 0,
      averageQueryTime: 0,
      slowQueriesCount: 0,
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
      type: CivicDataConnection,
      args: {
        filters: { type: CivicDataFiltersInput },
        sort: { type: SortInput },
        page: { type: GraphQLInt, defaultValue: 1 },
        limit: { type: GraphQLInt, defaultValue: 20 },
      },
      resolve: resolvers.councilData,
    },
    
    councilDataById: {
      type: CivicDataType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: resolvers.councilDataById,
    },
    
    aggregateData: {
      type: new GraphQLList(AggregationResult),
      args: {
        input: { type: new GraphQLNonNull(AggregationInput) },
      },
      resolve: resolvers.aggregateData,
    },
    
    search: {
      type: SearchResult,
      args: {
        query: { type: new GraphQLNonNull(GraphQLString) },
        filters: { type: CivicDataFiltersInput },
        limit: { type: GraphQLInt, defaultValue: 10 },
        fuzzy: { type: GraphQLBoolean, defaultValue: false },
      },
      resolve: resolvers.search,
    },
    
    filterOptions: {
      type: FilterOptionsType,
      resolve: resolvers.filterOptions,
    },
    
    performanceStats: {
      type: PerformanceStatsType,
      resolve: resolvers.performanceStats,
    },
  },
});

export const schema = new GraphQLSchema({
  query: QueryType,
});

// Example GraphQL queries for documentation
export const exampleQueries = {
  // Get all civic data with filters
  basicQuery: `
    query GetCivicData($filters: CivicDataFilters, $page: Int, $limit: Int) {
      councilData(filters: $filters, page: $page, limit: $limit) {
        data {
          id
          title
          description
          dataType
          category
          date
          department
          amount
          priority
        }
        pagination {
          page
          limit
          total
          totalPages
          hasNext
          hasPrev
        }
      }
    }
  `,
  
  // Search with filters
  searchQuery: `
    query SearchCivicData($query: String!, $filters: CivicDataFilters) {
      search(query: $query, filters: $filters) {
        data {
          id
          title
          description
          dataType
          category
          date
          department
        }
        resultCount
        suggestions
      }
    }
  `,
  
  // Aggregation query
  aggregationQuery: `
    query AggregateByDepartment {
      aggregateData(input: { groupBy: "department", metric: "count" }) {
        group
        value
        count
      }
    }
  `,
  
  // Get filter options
  filtersQuery: `
    query GetFilterOptions {
      filterOptions {
        dataTypes
        categories
        departments
        wards
        priorities
      }
    }
  `,
};

export default schema;
