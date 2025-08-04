// src/components/leads/MobileLeadsView.tsx
import React from "react";
import { Lead } from "@/models/types/lead";
import { MobileLeadCard } from "./MobileLeadCard";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MobileLeadsViewProps<TData> {
  data: TData[];
  isLoading?: boolean;
  searchQuery?: string;
  isSearching?: boolean;
  hasActiveFilters?: boolean;

  // Server-side pagination props
  paginationMeta?: {
    total: number;
    page: number;
    limit: number;
    has_next: boolean;
    has_prev: boolean;
  };
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  router?: AppRouterInstance;
}

export const MobileLeadsView = <TData extends Lead>({
  data,
  isLoading = false,
  searchQuery = "",
  isSearching = false,
  hasActiveFilters = false,
  paginationMeta,
  onPageChange,
  onPageSizeChange,
  router,
}: MobileLeadsViewProps<TData>) => {
  // Server Pagination Component (same as DataTable)
  const ServerPagination = () => {
    if (!paginationMeta || !onPageChange || !onPageSizeChange) return null;

    const { total, page, limit, has_next, has_prev } = paginationMeta;
    const totalPages = Math.ceil(total / limit);
    const startRecord = (page - 1) * limit + 1;
    const endRecord = Math.min(page * limit, total);

    const getVisiblePages = () => {
      if (totalPages <= 3) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
      }

      if (page <= 2) {
        return [1, 2, 3];
      }

      if (page >= totalPages - 1) {
        return [totalPages - 2, totalPages - 1, totalPages];
      }

      return [page - 1, page, page + 1];
    };

    const visiblePages = getVisiblePages();
    const showStartEllipsis = visiblePages[0] > 1;
    const showEndEllipsis = visiblePages[visiblePages.length - 1] < totalPages;

    return (
      <div className="flex flex-col space-y-4 px-4 py-4 border-t bg-white">
        {/* Results info and page size selector - stacked on mobile */}
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="text-sm text-muted-foreground text-center sm:text-left">
            Showing {startRecord} to {endRecord} of {total} results
            {searchQuery && (
              <span className="text-blue-600"> (search results)</span>
            )}
          </div>

          <div className="flex items-center justify-center space-x-2 sm:justify-end">
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              Rows per page:
            </span>
            <Select
              value={limit.toString()}
              onValueChange={(value) => {
                onPageSizeChange(Number(value));
                onPageChange(1);
              }}
            >
              <SelectTrigger className="h-8 w-[70px] border-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="30">30</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Pagination controls - centered on mobile */}
        <div className="flex items-center justify-center">
          <Pagination>
            <PaginationContent className="flex items-center space-x-1">
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => has_prev && onPageChange(page - 1)}
                  className={`h-8 px-2 text-sm ${
                    !has_prev
                      ? "pointer-events-none opacity-50 cursor-not-allowed"
                      : "cursor-pointer hover:bg-accent"
                  }`}
                />
              </PaginationItem>

              {showStartEllipsis && (
                <>
                  <PaginationItem>
                    <PaginationLink
                      onClick={() => onPageChange(1)}
                      isActive={page === 1}
                      className="h-8 w-8 p-0 text-sm cursor-pointer hover:bg-accent"
                    >
                      1
                    </PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationEllipsis className="h-8 w-8 text-sm" />
                  </PaginationItem>
                </>
              )}

              {visiblePages.map((pageNum) => (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    onClick={() => onPageChange(pageNum)}
                    isActive={page === pageNum}
                    className={`h-8 w-8 p-0 text-sm cursor-pointer ${
                      page === pageNum
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "hover:bg-accent"
                    }`}
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              ))}

              {showEndEllipsis && (
                <>
                  <PaginationItem>
                    <PaginationEllipsis className="h-8 w-8 text-sm" />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink
                      onClick={() => onPageChange(totalPages)}
                      isActive={page === totalPages}
                      className="h-8 w-8 p-0 text-sm cursor-pointer hover:bg-accent"
                    >
                      {totalPages}
                    </PaginationLink>
                  </PaginationItem>
                </>
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={() => has_next && onPageChange(page + 1)}
                  className={`h-8 px-2 text-sm ${
                    !has_next
                      ? "pointer-events-none opacity-50 cursor-not-allowed"
                      : "cursor-pointer hover:bg-accent"
                  }`}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    );
  };

  // Loading skeleton for mobile cards
  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 gap-4 p-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="bg-white rounded-lg border border-gray-200 p-4 space-y-3"
        >
          <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4"></div>
          <div className="flex items-center gap-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-12"></div>
            <div className="h-6 bg-gray-200 rounded animate-pulse w-20"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-12"></div>
            <div className="h-8 bg-gray-200 rounded animate-pulse flex-1"></div>
          </div>
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
              <div className="flex gap-2">
                <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Empty state component
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="text-gray-400 mb-4">
        <svg
          className="h-12 w-12 mx-auto"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {searchQuery
          ? "No leads found"
          : hasActiveFilters
          ? "No matching leads"
          : "No leads available"}
      </h3>
      <p className="text-gray-600 max-w-sm">
        {searchQuery
          ? `No leads found matching "${searchQuery}"`
          : hasActiveFilters
          ? "Try adjusting your filters to see more results."
          : "Start by adding your first lead to get started."}
      </p>
    </div>
  );

  // Searching state
  const SearchingState = () => (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="flex items-center justify-center gap-2 mb-4">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-lg font-medium text-gray-900">Searching...</span>
      </div>
      <p className="text-gray-600">
        Finding leads matching &quot;{searchQuery}&quot;
      </p>
    </div>
  );

  return (
    <div className="">
      {/* Loading State */}
      {isLoading && !isSearching && <LoadingSkeleton />}

      {/* Searching State */}
      {isSearching && searchQuery.length > 0 && <SearchingState />}

      {/* Data State */}
      {!isLoading && data.length > 0 && (
        <div className="grid grid-cols-1 gap-3 ">
          {data.map((lead) => (
            <MobileLeadCard
              key={lead.id}
              lead={lead as Lead}
              className="transition-all duration-200 hover:scale-[1.02]"
              router={router}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isSearching && data.length === 0 && <EmptyState />}

      {/* Pagination */}
      {paginationMeta && data.length > 0 && <ServerPagination />}
    </div>
  );
};
