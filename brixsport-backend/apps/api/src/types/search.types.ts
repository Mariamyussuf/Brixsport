// Search API Types

export interface SearchQuery {
  q: string; // Search term
  entities?: string[]; // Filter by entity types
  filters?: {
    sport?: string[];
    status?: string[];
    dateRange?: {
      from?: Date;
      to?: Date;
    };
    location?: string;
    // ... other filters
  };
  sort?: 'relevance' | 'date' | 'popularity';
  page?: number;
  limit?: number;
  fuzzy?: boolean;
}

export interface SearchResult {
  id: string;
  type: 'user' | 'player' | 'team' | 'competition' | 'match' | 'news' | 'media';
  title: string;
  description: string;
  imageUrl?: string;
  url: string;
  metadata: {
    createdAt?: Date;
    updatedAt?: Date;
    score: number; // Relevance score
    // ... entity-specific metadata
  };
  highlights?: {
    title?: string;
    description?: string;
  };
}

export interface SearchSuggestion {
  term: string;
  frequency: number;
  entityType?: string;
}

export interface PaginatedSearchResults {
  results: SearchResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  facets?: Record<string, any>; // Faceted search data
}

export interface SearchAnalytics {
  totalSearches: number;
  popularTerms: {
    term: string;
    count: number;
  }[];
  zeroResultQueries: {
    term: string;
    count: number;
  }[];
  averageResponseTime: number;
}