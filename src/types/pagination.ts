// src/types/pagination.ts
// Pagination type definitions

export interface CursorPaginatedResponse<T> {
  items: T[];
  nextCursor?: string | null;
}

export interface PaginatedResponse<T> {
  tokens: T[];
  data: T[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  nextCursor?: string | null;
}
