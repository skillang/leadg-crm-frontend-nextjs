// src/app/sample-table/page.tsx

"use client";
import { useMemo } from "react";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import { useAppSelector } from "@/redux/hooks";
import { createFilteredLeadsSelector, selectIsAdmin } from "@/redux/selectors";
import {
  useGetLeadsQuery,
  useGetMyLeadsQuery,
  useGetLeadStatsQuery,
} from "@/redux/slices/leadsApi";
import { RefreshCw, AlertTriangle } from "lucide-react";
import NewLeadDropdown from "@/components/leads/NewLeadDropdown";

export default function DemoPage() {
  // Get user role from Redux
  const isAdmin = useAppSelector(selectIsAdmin);

  // Use appropriate query based on role
  const {
    data: adminLeads = [],
    isLoading: adminLoading,
    error: adminError,
    refetch: refetchAdmin,
  } = useGetLeadsQuery(undefined, {
    skip: !isAdmin,
  });

  const {
    data: userLeads = [],
    isLoading: userLoading,
    error: userError,
    refetch: refetchUser,
  } = useGetMyLeadsQuery(undefined, {
    skip: isAdmin,
  });

  // Get statistics
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useGetLeadStatsQuery();

  // Determine which data to use
  const leads = isAdmin ? adminLeads : userLeads;
  const isLoading = isAdmin ? adminLoading : userLoading;
  const error = isAdmin ? adminError : userError;
  const refetch = isAdmin ? refetchAdmin : refetchUser;

  // Apply filters
  const filteredLeadsSelector = useMemo(
    () => createFilteredLeadsSelector(leads),
    [leads]
  );
  const filteredLeads = useAppSelector(filteredLeadsSelector);

  // const handleAddLead = () => {
  // console.log("Add new lead clicked");
  // TODO: Open create lead modal
  // };

  const handleRefresh = () => {
    refetch();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-lg">
            {isAdmin ? "Loading all leads..." : "Loading your leads... ⚡"}
          </span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    const errorMessage =
      (error as any)?.data?.detail ||
      (error as any)?.message ||
      "Failed to load leads";

    return (
      <div className="container mx-auto py-10">
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
    <div className="container mx-auto py-10 space-y-6">
      {/* No Data State */}
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
          title={isAdmin ? "All Leads" : "My Leads"}
          description={`${
            isAdmin
              ? "Comprehensive view of all leads in the system"
              : "Your assigned leads with real-time updates"
          } with sorting, filtering, and actions`}
          onExportCsv={() => console.log("Export CSV from DataTable")}
        />
      )}
    </div>
  );
}
