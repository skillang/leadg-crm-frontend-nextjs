// 🔥 CORRECTED PAGE.TSX WITH CLEARING STATE FIX
"use client";
import { useMemo, useState, useCallback, useEffect } from "react";
import { createColumns } from "./columns";
import { DataTable } from "./data-table";
import { useAppSelector } from "@/redux/hooks";
import { createFilteredLeadsSelector, selectIsAdmin } from "@/redux/selectors";
import { useGetLeadsQuery, useGetMyLeadsQuery } from "@/redux/slices/leadsApi";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation"; // 🔥 FIXED: Moved imports together
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
  const searchParams = useSearchParams(); // 🔥 FIXED: Must be declared before using it
  const pathname = usePathname(); // 🔥 FIXED: Must be declared before using it

  // 🔥 FIXED: Now searchParams is available for the useState initialization
  const [currentPage, setCurrentPage] = useState(() => {
    const pageParam = searchParams.get("page");
    return pageParam ? parseInt(pageParam, 10) : 1;
  });

  const [pageSize, setPageSize] = useState(() => {
    const limitParam = searchParams.get("limit");
    return limitParam ? parseInt(limitParam, 10) : 20;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
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

  // 🔥 ADD this new function after your existing handlers
  const handleLeadNavigation = useCallback(
    (leadId: string) => {
      // Store current pagination state before navigating
      const pageInfo = {
        page: currentPage,
        limit: pageSize,
        stage: stageFilter,
        status: statusFilter,
        category: categoryFilter,
        source: sourceFilter,
        search: searchQuery,
      };

      // console.log("📦 Storing page info before navigation:", pageInfo);
      sessionStorage.setItem("leadsPageInfo", JSON.stringify(pageInfo));

      // Navigate to lead detail
      router.push(`/my-leads/${leadId}`);
    },
    [
      currentPage,
      pageSize,
      stageFilter,
      statusFilter,
      categoryFilter,
      sourceFilter,
      searchQuery,
      router,
    ]
  );
  const columns = useMemo(
    () => createColumns(router, handleLeadNavigation),
    [router, handleLeadNavigation]
  );

  // 🔥 FIXED: Debounced search query
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // 🔥 NEW: Function to update URL with pagination - MOVED BEFORE HANDLERS
  const updateURLWithPagination = useCallback(
    (page: number, limit: number) => {
      const params = new URLSearchParams(searchParams.toString());

      // Update or add pagination params
      params.set("page", page.toString());
      params.set("limit", limit.toString());

      // Use replace to avoid cluttering browser history
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, pathname, router]
  );

  // 🔥 FIXED: Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery]);

  // 🔥 REPLACE the existing URL sync useEffect with this CORRECTED version:
  useEffect(() => {
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");

    const urlPage = pageParam ? parseInt(pageParam, 10) : 1;
    const urlLimit = limitParam ? parseInt(limitParam, 10) : 20;

    // console.log("🔄 URL changed - syncing state:", {
    //   urlPage,
    //   urlLimit,
    //   currentPage,
    //   pageSize,
    //   searchParamsString: searchParams.toString(),
    // });

    // Force state update even if values seem the same
    setCurrentPage(urlPage);
    setPageSize(urlLimit);
  }, [searchParams.toString()]); // 🔥 FIXED: Use searchParams.toString() instead of searchParams

  // useEffect(() => {
  //   // Force refetch when pagination changes
  //   if (isAdmin) {
  //     refetchAdmin();
  //   } else {
  //     refetchUser();
  //   }
  // }, [currentPage, pageSize, isAdmin, refetchAdmin, refetchUser]);

  // Event handlers - NOW AFTER updateURLWithPagination is defined
  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
      updateURLWithPagination(page, pageSize);
    },
    [pageSize, updateURLWithPagination]
  );

  const handlePageSizeChange = useCallback(
    (size: number) => {
      setPageSize(size);
      setCurrentPage(1);
      updateURLWithPagination(1, size);
    },
    [updateURLWithPagination]
  );

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
        const created_from = range.from.toISOString().split("T")[0];
        const created_to = range.to
          ? range.to.toISOString().split("T")[0]
          : created_from;

        setDateFilter({ created_from, created_to });
        setCurrentPage(1);
      } else {
        setDateFilter({});
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
      updated_from: updatedDateFilter.updated_from,
      updated_to: updatedDateFilter.updated_to,
      last_contacted_from: lastContactedDateFilter.last_contacted_from,
      last_contacted_to: lastContactedDateFilter.last_contacted_to,
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
      updated_from: updatedDateFilter.updated_from,
      updated_to: updatedDateFilter.updated_to,
      last_contacted_from: lastContactedDateFilter.last_contacted_from,
      last_contacted_to: lastContactedDateFilter.last_contacted_to,
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

  // 🔥 FIXED: Reset clearing state when API responds
  useEffect(() => {
    if (isClearingFilters && !isLoading) {
      setIsClearingFilters(false);
    }
  }, [isClearingFilters, isLoading]);

  // 🔥 FIXED: Proper search state management
  const isSearching = searchQuery !== debouncedSearchQuery;
  const isActuallyLoading = isLoading && !isSearching;

  // Extract leads and pagination data
  const { leads, paginationMeta } = useMemo(() => {
    let extractedLeads: Lead[] = [];
    let extractedPaginationMeta = undefined;

    if (leadsResponse) {
      if (Array.isArray(leadsResponse)) {
        extractedLeads = leadsResponse;
      } else if (leadsResponse.leads) {
        extractedLeads = leadsResponse.leads;

        // Handle nested pagination object from new API format
        if (leadsResponse.pagination) {
          extractedPaginationMeta = {
            total: leadsResponse.pagination.total || 0,
            page: leadsResponse.pagination.page || currentPage,
            pages:
              leadsResponse.pagination.pages ||
              Math.ceil(
                (leadsResponse.pagination.total || 0) /
                  (leadsResponse.pagination.limit || pageSize)
              ),
            limit: leadsResponse.pagination.limit || pageSize,
            has_next: leadsResponse.pagination.has_next || false,
            has_prev: leadsResponse.pagination.has_prev || false,
          };
        } else {
          // console.log("No nested pagination, checking flat format");

          // Fallback for old flat format (if any endpoints still use it)
          extractedPaginationMeta = {
            total: leadsResponse.total || 0,
            page: leadsResponse.page || currentPage,
            pages: Math.ceil(
              (leadsResponse.total || 0) / (leadsResponse.limit || pageSize)
            ),
            limit: leadsResponse.limit || pageSize,
            has_next: leadsResponse.has_next || false,
            has_prev: leadsResponse.has_prev || false,
          };
        }
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
        onClearSearch={() => {
          setSearchQuery("");
          setCurrentPage(1);
          updateURLWithPagination(1, pageSize);
        }}
        isSearching={isSearching}
        stageFilter={stageFilter}
        onStageFilterChange={(stage) => {
          handleStageFilterChange(stage);
          setCurrentPage(1);
          updateURLWithPagination(1, pageSize);
        }}
        statusFilter={statusFilter}
        onStatusFilterChange={(status) => {
          handleStatusFilterChange(status);
          setCurrentPage(1);
          updateURLWithPagination(1, pageSize);
        }}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={(category) => {
          handleCategoryFilterChange(category);
          setCurrentPage(1);
          updateURLWithPagination(1, pageSize);
        }}
        sourceFilter={sourceFilter} // 🔥 FIXED: Was "ourceFilter"
        onSourceFilterChange={(source) => {
          handleSourceFilterChange(source);
          setCurrentPage(1);
          updateURLWithPagination(1, pageSize);
        }}
        allDateFilters={{
          // 🔥 FIXED: Was "lDateFilters"
          created: dateFilter,
          updated: updatedDateFilter,
          lastContacted: lastContactedDateFilter,
        }}
        onAllDateFiltersChange={{
          onCreated: (dateRange) => {
            handleDateRangeChange(dateRange);
            setCurrentPage(1);
            updateURLWithPagination(1, pageSize);
          },
          onUpdated: (dateRange) => {
            handleUpdatedDateFilterChange(dateRange);
            setCurrentPage(1);
            updateURLWithPagination(1, pageSize);
          },
          onLastContacted: (dateRange) => {
            handleLastContactedDateFilterChange(dateRange);
            setCurrentPage(1);
            updateURLWithPagination(1, pageSize);
          },
        }}
        userFilter={userFilter}
        onUserFilterChange={(user) => {
          setUserFilter(user);
          setCurrentPage(1);
          updateURLWithPagination(1, pageSize);
        }}
        router={router}
        handleLeadNavigation={handleLeadNavigation}
      />
    </div>
  );
}
