// src/app/admin/unassigned-leads/page.tsx

"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createColumns } from "./columns";
import { UnassignedLeadsDataTable } from "./data-table";
import { useAuth } from "@/redux/hooks/useAuth";
import { useGetLeadsQuery } from "@/redux/slices/leadsApi";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatsCard from "@/components/custom/cards/StatsCard";
import { Card, CardContent } from "@/components/ui/card";
import EditLeadModal from "@/components/leads/EditLeadModal";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import { openEditModal, closeEditModal } from "@/redux/slices/leadsSlices";

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

export default function UnassignedLeadsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAdmin } = useAuth();

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) {
      router.push("/dashboard");
    }
  }, [isAdmin, router]);

  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [isClearingSearch, setIsClearingSearch] = useState(false);

  // Redux state for edit modal
  const editModalOpen = useAppSelector((state) => state.leads.editModalOpen);
  const currentEditLeadId = useAppSelector(
    (state) => state.leads.currentEditLeadId
  );

  // Debounced search query
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Create columns with navigation handler
  const handleLeadNavigation = useCallback(
    (leadId: string) => {
      router.push(`/my-leads/${leadId}`);
    },
    [router]
  );

  const columns = useMemo(
    () => createColumns(handleLeadNavigation),
    [handleLeadNavigation]
  );

  // API call for unassigned leads
  const {
    data: leadsResponse,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useGetLeadsQuery(
    {
      assigned_to: "null", // This fetches unassigned leads
      page: currentPage,
      limit: pageSize,
      search: debouncedSearchQuery || undefined,
    },
    {
      refetchOnMountOrArgChange: true,
      refetchOnFocus: false,
    }
  );

  // Process the data
  const leads = useMemo(() => {
    if (!leadsResponse) return [];

    // Handle both paginated and array responses
    if (Array.isArray(leadsResponse)) {
      return leadsResponse;
    }

    if ("leads" in leadsResponse && Array.isArray(leadsResponse.leads)) {
      return leadsResponse.leads;
    }

    return [];
  }, [leadsResponse]);

  const pagination = useMemo(() => {
    if (!leadsResponse || Array.isArray(leadsResponse)) return undefined;

    if ("pagination" in leadsResponse) {
      return leadsResponse.pagination;
    }

    return undefined;
  }, [leadsResponse]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalLeads = pagination?.total || leads.length;
    const websiteLeads = leads.filter(
      (lead) => lead.source === "website"
    ).length;
    const facebookLeads = leads.filter(
      (lead) => lead.source === "facebook" || lead.source === "facebook-leads"
    ).length;

    return {
      total: totalLeads,
      website: websiteLeads,
      facebook: facebookLeads,
    };
  }, [leads, pagination]);

  // Event handlers
  const handleSearchChange = useCallback((search: string) => {
    setSearchQuery(search);
    setCurrentPage(1); // Reset to first page on search
  }, []);

  const handleClearSearch = useCallback(async () => {
    setIsClearingSearch(true);
    setSearchQuery("");
    setCurrentPage(1);

    // Small delay for UX
    setTimeout(() => {
      setIsClearingSearch(false);
    }, 300);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page
  }, []);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleCloseEditModal = useCallback(() => {
    dispatch(closeEditModal());
  }, [dispatch]);

  // Get the current lead for editing
  const currentEditLead = useMemo(() => {
    if (!currentEditLeadId) return null;
    return leads.find(
      (lead) =>
        lead.leadId === currentEditLeadId || lead.id === currentEditLeadId
    );
  }, [leads, currentEditLeadId]);

  // Handle error state
  if (error) {
    const rtkerror = error as RTKQueryError;
    return (
      <div className="container mx-auto py-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center space-x-4 py-6">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            <div>
              <h3 className="text-lg font-medium text-red-900">
                Failed to load unassigned leads
              </h3>
              <p className="text-red-700">
                {rtkerror?.data?.detail ||
                  rtkerror?.message ||
                  "An error occurred"}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="mt-2"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Don't render if not admin (will redirect)
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Total Unassigned"
          value={stats.total}
          // icon={UserX}
          subtitle="Leads waiting for assignment"
          // trend={stats.total > 0 ? "neutral" : "positive"}
        />
        <StatsCard
          title="Website Leads"
          value={stats.website}
          // icon={Users}
          subtitle="From website forms"
          // trend="neutral"
        />
        <StatsCard
          title="Facebook Leads"
          value={stats.facebook}
          // icon={Users}
          subtitle="From Facebook campaigns"
          // trend="neutral"
        />
      </div>

      {/* Data Table */}
      <UnassignedLeadsDataTable
        columns={columns}
        data={leads}
        title="Unassigned Leads"
        isLoading={isLoading}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onClearSearch={handleClearSearch}
        isSearching={isFetching && !!debouncedSearchQuery}
        onRefresh={handleRefresh}
        isRefreshing={isFetching}
        pagination={pagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />

      {/* Edit Lead Modal */}
      <EditLeadModal
        isOpen={editModalOpen}
        onClose={handleCloseEditModal}
        lead={currentEditLead || null}
      />
    </div>
  );
}
