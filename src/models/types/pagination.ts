// src\models\types\pagination.ts
//  Common pagination metadata interface

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  has_next: boolean;
  has_prev: boolean;
}
