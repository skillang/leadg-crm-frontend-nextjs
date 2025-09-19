// src/components/common/ServerPagination.tsx
// Reusable server-side pagination component extracted from DataTable

"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useIsMobile } from "@/hooks/use-mobile";
import { PaginationMeta } from "@/models/types/pagination";

interface ServerPaginationProps {
  paginationMeta: PaginationMeta | undefined;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  searchQuery?: string;
  className?: string;
  showResultsInfo?: boolean;
  showPageSizeSelector?: boolean;
  pageSizeOptions?: number[];
  isLoading?: boolean;
}

export const ServerPagination: React.FC<ServerPaginationProps> = ({
  paginationMeta,
  onPageChange,
  onPageSizeChange,
  searchQuery = "",
  className = "",
  showResultsInfo = true,
  showPageSizeSelector = true,
  pageSizeOptions = [10, 20, 30, 50, 100],
  isLoading = false,
}) => {
  const isMobile = useIsMobile();
  if (!paginationMeta) return null;
  const { total, page, limit, has_next, has_prev } = paginationMeta;

  // Don't render if no data
  if (total === 0) return null;

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

  // Mobile version - simplified layout
  if (isMobile) {
    return (
      <div className={`space-y-4 px-4 py-4 border-t bg-white ${className}`}>
        {/* Results info */}
        {showResultsInfo && (
          <div className="text-sm text-muted-foreground text-center">
            Showing {startRecord} to {endRecord} of {total} results
            {searchQuery && (
              <span className="text-blue-600 block">(search results)</span>
            )}
          </div>
        )}

        {/* Page size selector - full width on mobile */}
        {showPageSizeSelector && (
          <div className="flex items-center justify-center space-x-2">
            <span className="text-sm text-muted-foreground">
              Rows per page:
            </span>
            <Select
              value={limit.toString()}
              onValueChange={(value) => {
                onPageSizeChange(Number(value));
                onPageChange(1); // Reset to first page when changing page size
              }}
              disabled={isLoading}
            >
              <SelectTrigger className="h-8 w-[70px] border-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Pagination controls - centered */}
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent className="flex items-center space-x-1">
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => has_prev && onPageChange(page - 1)}
                  className={`h-8 px-3 text-sm ${
                    !has_prev || isLoading
                      ? "pointer-events-none opacity-50 cursor-not-allowed"
                      : "cursor-pointer hover:bg-accent"
                  }`}
                />
              </PaginationItem>

              {/* Simple page display for mobile */}
              <PaginationItem>
                <span className="flex items-center px-3 py-2 text-sm">
                  {page} of {totalPages}
                </span>
              </PaginationItem>

              <PaginationItem>
                <PaginationNext
                  onClick={() => has_next && onPageChange(page + 1)}
                  className={`h-8 px-3 text-sm ${
                    !has_next || isLoading
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
  }

  // Desktop version - full layout
  return (
    <div
      className={`flex flex-col items-center justify-between w-full px-4 pt-4 gap-2 border-t bg-white ${className}`}
    >
      {/* LEFT SIDE - Results info and page size selector */}
      <div className="flex items-center space-x-6">
        {showResultsInfo && (
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            Showing {startRecord} to {endRecord} of {total} results
            {searchQuery && (
              <span className="text-blue-600"> (search results)</span>
            )}
          </div>
        )}

        {showPageSizeSelector && (
          <div className="flex items-center space-x-2 whitespace-nowrap">
            <span className="text-sm text-muted-foreground">
              Rows per page:
            </span>
            <Select
              value={limit.toString()}
              onValueChange={(value) => {
                onPageSizeChange(Number(value));
                onPageChange(1); // Reset to first page when changing page size
              }}
              disabled={isLoading}
            >
              <SelectTrigger className="h-8 w-[70px] border-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* RIGHT SIDE - Pagination controls */}
      <div className="flex items-center">
        <Pagination>
          <PaginationContent className="flex items-center space-x-1">
            <PaginationItem>
              <PaginationPrevious
                onClick={() => has_prev && onPageChange(page - 1)}
                className={`h-8 px-3 text-sm ${
                  !has_prev || isLoading
                    ? "pointer-events-none opacity-50 cursor-not-allowed"
                    : "cursor-pointer hover:bg-accent"
                }`}
              />
            </PaginationItem>

            {/* Start ellipsis and first page */}
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

            {/* Visible page numbers */}
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

            {/* End ellipsis and last page */}
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
                className={`h-8 px-3 text-sm ${
                  !has_next || isLoading
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

export default ServerPagination;
