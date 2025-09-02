// 🔥 CORRECTED PAGE.TSX WITH CLEARING STATE FIX
"use client";
import { useMemo, useState, useCallback, useEffect } from "react";
import { createColumns } from "./columns";
import { DataTable } from "./data-table";
import { useAppSelector } from "@/redux/hooks";
import { createFilteredLeadsSelector, selectIsAdmin } from "@/redux/selectors";
import { useGetLeadsQuery, useGetMyLeadsQuery } from "@/redux/slices/leadsApi";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Lead } from "@/models/types/lead";
import { DateRange } from "@/components/ui/date-range-picker";

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
  const [stageFilter, setStageFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all"); // Add type annotation
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<{
    created_from?: string;
    created_to?: string;
  }>({});
  const [updatedDateFilter, setUpdatedDateFilter] = useState<{
    updated_from?: string;
    updated_to?: string;
  }>({});
  const [lastContactedDateFilter, setLastContactedDateFilter] = useState<{
    last_contacted_from?: string;
    last_contacted_to?: string;
  }>({});

  const [isClearingFilters, setIsClearingFilters] = useState(false);

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
      stage: stageFilter !== "all" ? stageFilter : undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      category: categoryFilter !== "all" ? categoryFilter : undefined,
      source: sourceFilter !== "all" ? sourceFilter : undefined,
      ...(isAdmin && userFilter !== "all" && { assigned_to: userFilter }),
      ...dateFilter,
      updated_from: updatedDateFilter.updated_from, // 🆕 NEW
      updated_to: updatedDateFilter.updated_to, // 🆕 NEW
      last_contacted_from: lastContactedDateFilter.last_contacted_from, // 🆕 NEW
      last_contacted_to: lastContactedDateFilter.last_contacted_to, //
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
      stage: stageFilter !== "all" ? stageFilter : undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      category: categoryFilter !== "all" ? categoryFilter : undefined,
      source: sourceFilter !== "all" ? sourceFilter : undefined,
      ...dateFilter,
      updated_from: updatedDateFilter.updated_from, // 🆕 NEW
      updated_to: updatedDateFilter.updated_to, // 🆕 NEW
      last_contacted_from: lastContactedDateFilter.last_contacted_from, // 🆕 NEW
      last_contacted_to: lastContactedDateFilter.last_contacted_to, //
    },
    {
      skip: isAdmin,
      refetchOnMountOrArgChange: true,
    }
  );

  const leadsResponse = isAdmin ? adminLeadsResponse : userLeadsResponse;
  const isLoading = isAdmin ? adminLoading : userLoading; // Move this here
  const error = isAdmin ? adminError : userError;
  const refetch = isAdmin ? refetchAdmin : refetchUser;

  // 🔥 FIXED: Reset clearing state when API responds
  useEffect(() => {
    if (isClearingFilters && !isLoading) {
      setIsClearingFilters(false);
    }
  }, [isClearingFilters, isLoading]);

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
    if (stageFilter !== "all" || statusFilter !== "all") {
      setIsClearingFilters(true);
    }
  }, [stageFilter, statusFilter]);

  const handleStageFilterChange = useCallback(
    (value: string) => {
      if (
        value === "all" &&
        (stageFilter !== "all" || statusFilter !== "all")
      ) {
        setIsClearingFilters(true);
      }
      setStageFilter(value);
    },
    [stageFilter, statusFilter]
  );

  const handleStatusFilterChange = useCallback(
    (value: string) => {
      if (
        value === "all" &&
        (stageFilter !== "all" || statusFilter !== "all")
      ) {
        setIsClearingFilters(true);
      }
      setStatusFilter(value);
    },
    [stageFilter, statusFilter]
  );

  const handleCategoryFilterChange = useCallback((value: string) => {
    setCategoryFilter(value);
    setCurrentPage(1);
  }, []);

  const handleDateRangeChange = useCallback(
    ({ range }: { range: DateRange }) => {
      if (range?.from) {
        const created_from = range.from.toISOString().split("T")[0]; // YYYY-MM-DD format
        const created_to = range.to
          ? range.to.toISOString().split("T")[0]
          : created_from;

        setDateFilter({ created_from, created_to });
        setCurrentPage(1); // Reset pagination
      } else {
        setDateFilter({}); // Clear date filter
      }
    },
    []
  );

  const handleSourceFilterChange = useCallback((value: string) => {
    setSourceFilter(value);
    setCurrentPage(1);
  }, []);

  const handleUpdatedDateFilterChange = ({ range }: { range: DateRange }) => {
    setUpdatedDateFilter({
      updated_from: range.from?.toISOString().split("T")[0],
      updated_to: range.to?.toISOString().split("T")[0],
    });
    setCurrentPage(1);
  };

  const handleLastContactedDateFilterChange = ({
    range,
  }: {
    range: DateRange;
  }) => {
    setLastContactedDateFilter({
      last_contacted_from: range.from?.toISOString().split("T")[0],
      last_contacted_to: range.to?.toISOString().split("T")[0],
    });
    setCurrentPage(1);
  };

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
      <DataTable
        columns={columns}
        data={finalLeads}
        title={isAdmin ? "All Leads" : "Leads"}
        onExportCsv={() => console.log("Export CSV from DataTable")}
        paginationMeta={paginationMeta}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        isLoading={isLoading}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onClearSearch={handleClearSearch}
        isSearching={isSearching}
        stageFilter={stageFilter}
        statusFilter={statusFilter}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={handleCategoryFilterChange}
        // dateFilter={dateFilter}
        // onDateFilterChange={handleDateRangeChange}
        onStageFilterChange={handleStageFilterChange}
        onStatusFilterChange={handleStatusFilterChange}
        onSourceFilterChange={handleSourceFilterChange}
        allDateFilters={{
          created: dateFilter,
          updated: updatedDateFilter,
          lastContacted: lastContactedDateFilter,
        }}
        onAllDateFiltersChange={{
          onCreated: handleDateRangeChange,
          onUpdated: handleUpdatedDateFilterChange,
          onLastContacted: handleLastContactedDateFilterChange,
        }}
        // updatedDateFilter={updatedDateFilter} // 🆕 NEW
        // lastContactedDateFilter={lastContactedDateFilter} // 🆕 NEW
        // onUpdatedDateFilterChange={handleUpdatedDateFilterChange} // 🆕 NEW
        // onLastContactedDateFilterChange={handleLastContactedDateFilterChange} //
        userFilter={userFilter}
        onUserFilterChange={setUserFilter}
        router={router}
      />
    </div>
  );
}
