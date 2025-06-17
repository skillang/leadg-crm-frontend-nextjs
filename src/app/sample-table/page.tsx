"use client";
import { useMemo } from "react";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import { useAppSelector } from "@/redux/hooks";
import {
  selectFilters,
  createFilteredLeadsSelector,
  calculateLeadStats,
} from "@/redux/selectors/leadsSelectors";
import { useGetLeadsQuery } from "@/redux/slices/leadsApi";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  Plus,
  Users,
  TrendingUp,
  Target,
  Award,
} from "lucide-react";

// Simple card components (if you don't have shadcn/ui card installed)
const Card = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}
  >
    {children}
  </div>
);

const CardHeader = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>
);

const CardTitle = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <h3
    className={`text-2xl font-semibold leading-none tracking-tight ${className}`}
  >
    {children}
  </h3>
);

const CardDescription = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <p className={`text-sm text-muted-foreground ${className}`}>{children}</p>
);

const CardContent = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={`p-6 pt-0 ${className}`}>{children}</div>;

export default function DemoPage() {
  // RTK Query hook - handles loading, error, and data automatically!
  const { data: leads = [], error, isLoading, refetch } = useGetLeadsQuery();

  // Get filters from Redux
  const filters = useAppSelector(selectFilters);

  // Create filtered leads selector with current leads data
  const filteredLeadsSelector = useMemo(
    () => createFilteredLeadsSelector(leads),
    [leads]
  );
  const filteredLeads = useAppSelector(filteredLeadsSelector);

  // Calculate stats
  const stats = useMemo(() => calculateLeadStats(leads), [leads]);
  const filteredCount = filteredLeads.length;

  const handleRefresh = () => {
    refetch();
  };

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
        onCustomize={() => console.log("Customize from DataTable")}
      />

      {/* Footer Stats */}
      {/* <div className="flex items-center justify-between text-sm text-gray-500 px-2">
        <div>
          Showing {filteredCount} of {stats.total} leads
        </div>
        <div className="flex gap-4">
          <span>Sales: {stats.byDepartment["Sales"] || 0}</span>
          <span>Marketing: {stats.byDepartment["Marketing"] || 0}</span>
          {isLoading && <span className="text-blue-600">Syncing...</span>}
        </div>
      </div> */}
    </div>
  );
}
