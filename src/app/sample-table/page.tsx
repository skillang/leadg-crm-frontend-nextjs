"use client";
import { useMemo } from "react";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import { useAppSelector } from "@/redux/hooks";
import {
  // selectFilters,
  createFilteredLeadsSelector,
  // calculateLeadStats,
} from "@/redux/selectors/leadsSelectors";
import { useGetLeadsQuery } from "@/redux/slices/leadsApi";
import { RefreshCw } from "lucide-react";

export default function DemoPage() {
  // RTK Query hook - handles loading, error, and data automatically!
  const {
    data: leads = [],
    isLoading,
    // refetch
  } = useGetLeadsQuery();

  // Get filters from Redux
  // const filters = useAppSelector(selectFilters);

  // Create filtered leads selector with current leads data
  const filteredLeadsSelector = useMemo(
    () => createFilteredLeadsSelector(leads),
    [leads]
  );
  const filteredLeads = useAppSelector(filteredLeadsSelector);

  // Calculate stats
  // const stats = useMemo(() => calculateLeadStats(leads), [leads]);
  // const filteredCount = filteredLeads.length;

  // const handleRefresh = () => {
  //   refetch();
  // };

  const handleAddLead = () => {
    console.log("Add new lead clicked");
    // TODO: Open modal or navigate to add lead page
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-lg">Loading leads...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 space-y-6">
      <DataTable
        columns={columns}
        data={filteredLeads}
        title="Leads"
        description="A comprehensive view of all your leads with sorting, filtering, and actions"
        onAddNew={handleAddLead}
        onExportCsv={() => console.log("Export CSV from DataTable")}
      />

      {/* Footer Stats - Uncomment when ready to use */}
      {/* <div className="flex items-center justify-between text-sm text-gray-500 px-2">
        <div>
          Showing {filteredCount} of {stats.total} leads
        </div>
        <div className="flex gap-4">
          <span>Sales: {stats.byDepartment?.["Sales"] || 0}</span>
          <span>Marketing: {stats.byDepartment?.["Marketing"] || 0}</span>
          {isLoading && <span className="text-blue-600">Syncing...</span>}
          <button
            onClick={handleRefresh}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Refresh
          </button>
        </div>
      </div> */}
    </div>
  );
}
