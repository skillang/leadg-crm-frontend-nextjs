// 🔥 CORRECTED PAGE.TSX
"use client";
import { useMemo, useState, useCallback, useEffect } from "react";
import { createColumns } from "./columns";
import { DataTable } from "./data-table";
import { useAppSelector } from "@/redux/hooks";
import { createFilteredLeadsSelector, selectIsAdmin } from "@/redux/selectors";
import { useGetLeadsQuery, useGetMyLeadsQuery } from "@/redux/slices/leadsApi";
import { RefreshCw, AlertTriangle } from "lucide-react";
import NewLeadDropdown from "@/components/leads/NewLeadDropdown";
import { useRouter } from "next/navigation";
import { Lead } from "@/models/types/lead";

// Create a simple debounce hook
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface RTKQueryError {
  data?: {
    detail?: string;
    message?: string;
  };
  message?: string;
  status?: number;
}

export default function DemoPage() {
  const router = useRouter();

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchQuery, setSearchQuery] = useState("");

  const isAdmin = useAppSelector(selectIsAdmin);
  const columns = useMemo(() => createColumns(router), [router]);

  // 🔥 FIXED: Debounced search query
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // 🔥 FIXED: Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery]);

  // API calls with proper search parameters
  const {
    data: adminLeadsResponse,
    isLoading: adminLoading,
    error: adminError,
    refetch: refetchAdmin,
  } = useGetLeadsQuery(
    {
      page: currentPage,
      limit: pageSize,
      search: debouncedSearchQuery.trim() || undefined,
    },
    {
      skip: !isAdmin,
      refetchOnMountOrArgChange: true,
    }
  );

  const {
    data: userLeadsResponse,
    isLoading: userLoading,
    error: userError,
    refetch: refetchUser,
  } = useGetMyLeadsQuery(
    {
      page: currentPage,
      limit: pageSize,
      search: debouncedSearchQuery.trim() || undefined,
    },
    {
      skip: isAdmin,
      refetchOnMountOrArgChange: true,
    }
  );

  const leadsResponse = isAdmin ? adminLeadsResponse : userLeadsResponse;
  const isLoading = isAdmin ? adminLoading : userLoading;
  const error = isAdmin ? adminError : userError;
  const refetch = isAdmin ? refetchAdmin : refetchUser;

  // 🔥 FIXED: Proper search state management
  const isSearching = searchQuery !== debouncedSearchQuery;
  const isActuallyLoading = isLoading && !isSearching; // Don't show full page loader while searching

  // Extract leads and pagination data
  const { leads, paginationMeta } = useMemo(() => {
    let extractedLeads: Lead[] = [];
    let extractedPaginationMeta = undefined;

    if (leadsResponse) {
      if (Array.isArray(leadsResponse)) {
        extractedLeads = leadsResponse;
      } else if (leadsResponse.leads) {
        extractedLeads = leadsResponse.leads;
        extractedPaginationMeta = {
          total: leadsResponse.total || 0,
          page: leadsResponse.page || currentPage,
          limit: leadsResponse.limit || pageSize,
          has_next: leadsResponse.has_next || false,
          has_prev: leadsResponse.has_prev || false,
        };
      }
    }

    return { leads: extractedLeads, paginationMeta: extractedPaginationMeta };
  }, [leadsResponse, currentPage, pageSize]);

  // Smart data selection: server search vs Redux filters
  const filteredLeadsSelector = useMemo(
    () => createFilteredLeadsSelector(leads),
    [leads]
  );
  const reduxFilteredLeads = useAppSelector(filteredLeadsSelector);
  const finalLeads = debouncedSearchQuery.trim() ? leads : reduxFilteredLeads;

  // Event handlers
  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  }, []);

  const handleSearchChange = useCallback((newSearch: string) => {
    setSearchQuery(newSearch);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  // Helper function to extract error message
  const getErrorMessage = (error: unknown): string => {
    if (!error) return "Unknown error occurred";
    const rtkError = error as RTKQueryError;
    if (rtkError.data?.detail) return rtkError.data.detail;
    if (rtkError.data?.message) return rtkError.data.message;
    if (rtkError.message) return rtkError.message;
    return "Failed to load leads";
  };

  // 🔥 FIXED: Only show full page loading on initial load, not during search
  if (isActuallyLoading && !searchQuery) {
    return (
      <div className="container mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mb-2" />
            <span className="text-lg">
              {isAdmin ? "Loading all leads..." : "Loading your leads..."}
            </span>
            <span className="text-sm text-gray-500 mt-1">
              Page {currentPage}, {pageSize} per page
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    const errorMessage = getErrorMessage(error);
    return (
      <div className="container mx-auto">
        <div className="flex flex-col items-center justify-center h-64">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Error Loading Leads
          </h2>
          <p className="text-gray-600 mb-4 text-center max-w-md">
            {errorMessage}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4 inline mr-2" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6">
      {/* No Data State */}
      {finalLeads.length === 0 && !debouncedSearchQuery ? (
        <div className="bg-white rounded-lg shadow border p-12 text-center">
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
            {isAdmin ? "No leads in the system" : "No leads assigned to you"}
          </h3>
          <p className="text-gray-600 mb-4">
            {isAdmin
              ? "Get started by creating your first lead or importing leads from a CSV file."
              : "Contact your administrator to get leads assigned to you."}
          </p>
          {isAdmin && (
            <div className="flex justify-center">
              <NewLeadDropdown />
            </div>
          )}
        </div>
      ) : (
        /* Data Table */
        <DataTable
          columns={columns}
          data={finalLeads}
          title={isAdmin ? "All Leads" : "Leads"}
          description={
            debouncedSearchQuery.trim()
              ? `${
                  paginationMeta?.total || finalLeads.length
                } leads found for "${debouncedSearchQuery}"`
              : `${
                  isAdmin
                    ? "Comprehensive view of all leads in the system"
                    : "Your assigned leads with real-time updates"
                } with sorting, filtering, and actions`
          }
          onExportCsv={() => console.log("Export CSV from DataTable")}
          paginationMeta={paginationMeta}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          isLoading={isLoading}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onClearSearch={handleClearSearch}
          isSearching={isSearching}
        />
      )}

      {/* No search results message */}
      {finalLeads.length === 0 && debouncedSearchQuery && (
        <div className="bg-white rounded-lg shadow border p-8 text-center">
          <div className="text-gray-400 mb-4">
            <svg
              className="h-8 w-8 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No results found
          </h3>
          <p className="text-gray-600 mb-4">
            No leads match your search for &quot;{debouncedSearchQuery}&quot;.
            Try different keywords.
          </p>
          <button
            onClick={handleClearSearch}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Clear Search
          </button>
        </div>
      )}
    </div>
  );
}
