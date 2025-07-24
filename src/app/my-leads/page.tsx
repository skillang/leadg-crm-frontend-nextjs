// src/app/sample-table/page.tsx - MINIMAL CHANGES TO YOUR EXISTING FILE

"use client";
import { useMemo, useState } from "react"; // 🔥 ADD useState
import { createColumns } from "./columns"; // 🔥 CHANGED: Import createColumns instead of columns
import { DataTable } from "./data-table";
import { useAppSelector } from "@/redux/hooks";
import { createFilteredLeadsSelector, selectIsAdmin } from "@/redux/selectors";
import { useGetLeadsQuery, useGetMyLeadsQuery } from "@/redux/slices/leadsApi";
import { RefreshCw, AlertTriangle } from "lucide-react";
import NewLeadDropdown from "@/components/leads/NewLeadDropdown";
import { useRouter } from "next/navigation"; // 🔥 ADDED: Import useRouter
import { Lead } from "@/models/types/lead";

// Type for RTK Query error (KEEP EXISTING)
interface RTKQueryError {
  data?: {
    detail?: string;
    message?: string;
  };
  message?: string;
  status?: number;
}

export default function DemoPage() {
  const router = useRouter(); // 🔥 ADDED: Add router at component level

  // 🔥 ADD PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const isAdmin = useAppSelector(selectIsAdmin);

  // 🔥 ADDED: Create columns with router
  const columns = useMemo(() => createColumns(router), [router]);

  // console.log("🔍 Current pagination state:", { currentPage, pageSize });

  // 🔥 MODIFY EXISTING QUERIES TO INCLUDE PAGINATION PARAMS

  const {
    data: adminLeadsResponse,
    isLoading: adminLoading,
    error: adminError,
    refetch: refetchAdmin,
  } = useGetLeadsQuery(
    {
      page: currentPage,
      limit: pageSize,
    },
    {
      skip: !isAdmin,
      refetchOnMountOrArgChange: true, // Always refetch when args change
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
    },
    {
      skip: isAdmin,
      refetchOnMountOrArgChange: true, // Always refetch when args change
    }
  );

  const leadsResponse = isAdmin ? adminLeadsResponse : userLeadsResponse;
  const isLoading = isAdmin ? adminLoading : userLoading;
  const error = isAdmin ? adminError : userError;
  const refetch = isAdmin ? refetchAdmin : refetchUser;

  // console.log("🔍 Raw API Response:", leadsResponse);

  const { leads, paginationMeta } = useMemo(() => {
    let extractedLeads: Lead[] = [];
    let extractedPaginationMeta = undefined;

    if (leadsResponse) {
      if (Array.isArray(leadsResponse)) {
        // Old format: just array of leads
        extractedLeads = leadsResponse;
        // console.log(
        //   "🔍 Using old array format, leads count:",
        //   extractedLeads.length
        // );
      } else if (leadsResponse.leads) {
        // New format: paginated response
        extractedLeads = leadsResponse.leads;
        extractedPaginationMeta = {
          total: leadsResponse.total || 0,
          page: leadsResponse.page || currentPage,
          limit: leadsResponse.limit || pageSize,
          has_next: leadsResponse.has_next || false,
          has_prev: leadsResponse.has_prev || false,
        };
        // console.log("🔍 Using paginated format:", {
        //   leadsCount: extractedLeads.length,
        //   paginationMeta: extractedPaginationMeta,
        // });
      }
    }

    return { leads: extractedLeads, paginationMeta: extractedPaginationMeta };
  }, [leadsResponse, currentPage, pageSize]);

  // 🔥 ADD: Debug leads BEFORE applying filters
  // console.log("🔍 Leads BEFORE applying filters:", leads.length, leads);

  // Apply filters (KEEP EXISTING BUT ADD DEBUGGING)
  const filteredLeadsSelector = useMemo(
    () => createFilteredLeadsSelector(leads),
    [leads]
  );

  // console.log("🔍 Selector created with leads:", leads.length);

  const filteredLeads = useAppSelector(filteredLeadsSelector);

  // 🔥 ADD: Debug leads AFTER applying filters
  // console.log(
  //   "🔍 Leads AFTER applying filters:",
  //   filteredLeads.length,
  //   filteredLeads
  // );

  // 🔥 ADD: Check if there are any other selectors or filters being applied
  // console.log("🔍 Final data being passed to table:", {
  //   originalLeads: leads.length,
  //   filteredLeads: filteredLeads.length,
  //   paginationMeta,
  //   // 🔥 ADD: Show actual data being passed
  //   firstFewLeads: filteredLeads
  //     .slice(0, 3)
  //     .map((lead) => ({ id: lead.id, name: lead.name })),
  // });

  // 🔥 SIMPLIFIED PAGINATION HANDLERS
  const handlePageChange = (newPage: number) => {
    // console.log("📄 Page change:", currentPage, "→", newPage);
    setCurrentPage(newPage);

    // 🔥 FORCE REFETCH AFTER STATE UPDATE
    setTimeout(() => {
      // console.log("🔄 Force refetching after page change...");
      refetch();
    }, 100);
  };

  const handlePageSizeChange = (newSize: number) => {
    // console.log("📊 Page size change:", pageSize, "→", newSize);
    setPageSize(newSize);
    setCurrentPage(1);

    // 🔥 FORCE REFETCH AFTER STATE UPDATE
    setTimeout(() => {
      // console.log("🔄 Force refetching after page size change...");
      refetch();
    }, 100);
  };

  const handleRefresh = () => {
    refetch();
  };

  // Helper function to extract error message with proper typing (KEEP EXISTING)
  const getErrorMessage = (error: unknown): string => {
    if (!error) return "Unknown error occurred";
    const rtkError = error as RTKQueryError;
    if (rtkError.data?.detail) return rtkError.data.detail;
    if (rtkError.data?.message) return rtkError.data.message;
    if (rtkError.message) return rtkError.message;
    return "Failed to load leads";
  };

  // 🔥 ADD LOADING STATE WITH SPINNER
  if (isLoading) {
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

  // Error state (KEEP EXISTING)
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
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4 inline mr-2" />
              Retry
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6">
      {/* No Data State (KEEP EXISTING) */}
      {leads.length === 0 ? (
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
          data={filteredLeads}
          title={isAdmin ? "All Leads" : "Leads"}
          description={`${
            isAdmin
              ? "Comprehensive view of all leads in the system"
              : "Your assigned leads with real-time updates"
          } with sorting, filtering, and actions`}
          onExportCsv={() => console.log("Export CSV from DataTable")}
          paginationMeta={paginationMeta}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
