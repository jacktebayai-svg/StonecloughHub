import { GraphQLResolveInfo } from 'graphql';

// Base resolver context
export interface GraphQLContext {
  user?: any;
  db?: any;
}

// Resolver function type
export type GraphQLResolver<TReturn = any, TArgs = any, TContext = GraphQLContext> = (
  parent: any,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TReturn | Promise<TReturn>;

// Specific argument types for resolvers
export interface CouncilDataArgs {
  filters?: {
    dataType?: string;
    category?: string;
    department?: string;
    ward?: string;
    priority?: string;
    dateFrom?: string;
    dateTo?: string;
    minAmount?: number;
    maxAmount?: number;
    residentImpact?: string;
    publicInterest?: boolean;
    search?: string;
  };
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
  page?: number;
  limit?: number;
}

export interface CouncilDataByIdArgs {
  id: string;
}

export interface SearchArgs {
  query: string;
  filters?: any;
  limit?: number;
  fuzzy?: boolean;
}

export interface AggregateDataArgs {
  input: {
    groupBy: string;
    metric?: string;
    field?: string;
    dateRange?: string;
  };
}

// Type-safe resolver interfaces
export interface CouncilDataResolvers {
  councilData: GraphQLResolver<any, CouncilDataArgs>;
  councilDataById: GraphQLResolver<any, CouncilDataByIdArgs>;
  search: GraphQLResolver<any, SearchArgs>;
  aggregateData: GraphQLResolver<any, AggregateDataArgs>;
  filterOptions: GraphQLResolver<any, {}>;
  performanceStats: GraphQLResolver<any, {}>;
}

// Export the resolver type for implementation
export type ResolverMap = {
  [key: string]: GraphQLResolver<any, any>;
};
