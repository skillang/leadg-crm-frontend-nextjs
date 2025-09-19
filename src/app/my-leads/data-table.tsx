// src/app/my-leads/data-table.tsx - COMPLETE FIXED VERSION WITH PROPER SEARCH & SPINNER LOGIC

"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import NewLeadDropdown from "@/components/leads/NewLeadDropdown";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileLeadsView } from "@/components/leads/mobile/MobileLeadsView";
import { FilterModal } from "@/components/leads/mobile/FilterModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Column,
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  // ColumnPinningRow,
  VisibilityState,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  X,
  DownloadIcon,
  Grid2X2PlusIcon,
  Filter,
  ListFilterIcon,
  ChevronDown,
  Mail,
  MessageSquareText,
  Zap,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useGetActiveStagesQuery } from "@/redux/slices/stagesApi";
import { useStageUtils } from "@/components/common/StageDisplay";
import MultiSelect from "@/components/common/MultiSelect";
import EmailDialog from "@/components/communication/email/EmailDialog";
import WhatsAppModal from "@/components/communication/whatsapp/WhatsAppModal";
import { StageSelect } from "@/components/common/StageSelect";
import { StatusSelect } from "@/components/common/StatusSelect";
import { useGetActiveStatusesQuery } from "@/redux/slices/statusesApi";
import { Lead } from "@/models/types/lead";
import { useNotifications } from "@/components/common/NotificationSystem";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useGetCategoriesQuery } from "@/redux/slices/categoriesApi";
import TataTeliModal from "@/components/communication/calling/TataTeliModal";
import { DateRange, DateRangePicker } from "@/components/ui/date-range-picker";
import { Source } from "@/models/types/source";
import { useGetSourcesQuery } from "@/redux/slices/sourcesApi";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/redux/hooks/useAuth";
import { useGetAssignableUsersWithDetailsQuery } from "@/redux/slices/leadsApi";
import BulkEmailPopUp from "@/components/communication/bulk-pop-up/BulkEmailPopUp";
import BulkWhatsAppPopUp from "@/components/communication/bulk-pop-up/BulkWhatsAppPopUp";
import ServerPagination from "@/components/common/ServerPagination";
import { PaginationMeta } from "@/models/types/pagination";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  title?: string;
  description?: string;
  onAddNew?: () => void;
  onExportCsv?: () => void;
  onCustomize?: () => void;
  // Server-side pagination props
  paginationMeta?: PaginationMeta;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  isLoading?: boolean;
  // 🔥 Server-side search props
  searchQuery?: string;
  onSearchChange?: (search: string) => void;
  onClearSearch?: () => void;
  isSearching?: boolean;
  stageFilter?: string;
  statusFilter?: string;
  categoryFilter?: string;
  onCategoryFilterChange?: (value: string) => void;
  sourceFilter?: string; // Add this
  onSourceFilterChange?: (value: string) => void;
  onStageFilterChange?: (value: string) => void;
  onStatusFilterChange?: (value: string) => void;
  userFilter?: string; // 🆕 NEW
  onUserFilterChange?: (value: string) => void;
  allDateFilters?: {
    created?: { created_from?: string; created_to?: string };
    updated?: { updated_from?: string; updated_to?: string };
    lastContacted?: {
      last_contacted_from?: string;
      last_contacted_to?: string;
    };
  };
  onAllDateFiltersChange?: {
    onCreated?: ({ range }: { range: DateRange }) => void;
    onUpdated?: ({ range }: { range: DateRange }) => void;
    onLastContacted?: ({ range }: { range: DateRange }) => void;
  };
  router?: AppRouterInstance;
  handleLeadNavigation?: (leadId: string) => void; // 🔥 ADD this line
}

export function DataTable<TData extends Lead, TValue>({
  columns,
  data,
  title = "Leads",
  description,
  onExportCsv,
  paginationMeta,
  onPageChange,
  onPageSizeChange,
  isLoading = false,
  // 🔥 Server-side search props
  searchQuery = "",
  onSearchChange,
  onClearSearch,
  isSearching = false,
  stageFilter = "all",
  statusFilter = "all",
  categoryFilter = "all", // ADD THIS
  onCategoryFilterChange,
  // dateFilter,
  // onDateFilterChange,
  onStageFilterChange,
  onStatusFilterChange,
  onSourceFilterChange,
  userFilter = "all",
  onUserFilterChange,
  allDateFilters, // 🆕 NEW: Unified date filters
  onAllDateFiltersChange,
  router,
  handleLeadNavigation,
}: DataTableProps<TData, TValue>) {
  const { showWarning } = useNotifications();
  const isMobile = useIsMobile();
  const [isFilterModalOpen, setIsFilterModalOpen] = React.useState(false);
  const [isBulkEmailOpen, setIsBulkEmailOpen] = React.useState(false);
  const [isBulkWhatsAppOpen, setIsBulkWhatsAppOpen] = React.useState(false);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const [departmentFilter, setDepartmentFilter] = React.useState<string>("all");
  const [sourceFilter] = React.useState<string>("all");

  // Get stages from API
  const { data: stagesData, isLoading: stagesLoading } =
    useGetActiveStagesQuery({});
  const { data: statusData, isLoading: statusLoading } =
    useGetActiveStatusesQuery({});
  const { data: categoriesData } = useGetCategoriesQuery({
    include_inactive: false,
  });
  const { isAdmin } = useAuth();
  const { data: assignableUsersResponse, isLoading: usersLoading } =
    useGetAssignableUsersWithDetailsQuery();
  const assignableUsers = assignableUsersResponse?.users || [];
  const { getStageDisplayName } = useStageUtils();

  const table = useReactTable({
    data,
    columns,
    enableColumnPinning: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    // 🔥 Conditional pagination based on server-side or client-side
    ...(paginationMeta
      ? {
          manualPagination: true,
          pageCount: Math.ceil(paginationMeta.total / paginationMeta.limit),
        }
      : {
          getPaginationRowModel: getPaginationRowModel(),
          onPaginationChange: setPagination,
        }),

    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      columnPinning: {
        right: ["actions"], // ← Replace 'actions' with your actual last column ID
      },
      ...(paginationMeta ? {} : { pagination }),
    },
  });

  const selectedRowIds = table
    .getSelectedRowModel()
    .rows.map((row) => row.original.id);

  const hasActiveFilters =
    stageFilter !== "all" ||
    departmentFilter !== "all" ||
    categoryFilter !== "all" ||
    statusFilter !== "all" ||
    (isAdmin && userFilter !== "all");

  const clearAllFilters = () => {
    onStageFilterChange?.("all"); // ADD THIS
    onStatusFilterChange?.("all");
    setDepartmentFilter("all");
    onCategoryFilterChange?.("all");
    onUserFilterChange?.("all");
    if (onClearSearch) {
      onClearSearch();
    }
  };

  // 🔥 Stage Filter Component
  const StageFilterSelect = () => {
    if (stagesLoading) {
      return <Skeleton className="h-10 w-[110px]" />;
    }

    return (
      <StageSelect
        value={stageFilter === "all" ? "" : stageFilter}
        onValueChange={(value) => onStageFilterChange?.(value || "all")}
        stages={stagesData?.stages || []}
        disabled={stagesLoading}
        isLoading={stagesLoading}
        placeholder="All Stages"
        showLabel={false}
      />
    );
  };

  const StatusFilterSelect = () => {
    if (stagesLoading) {
      return <Skeleton className="h-10 w-[110px]" />;
    }

    return (
      <StatusSelect
        value={stageFilter === "all" ? "" : stageFilter}
        onValueChange={(value) => onStatusFilterChange?.(value || "all")}
        statuses={statusData?.statuses || []}
        disabled={statusLoading}
        isLoading={statusLoading}
        placeholder="All Status"
        showLabel={false}
      />
    );
  };

  const CategoryFilterSelect = () => {
    const { data: categoriesData, isLoading: categoriesLoading } =
      useGetCategoriesQuery({
        include_inactive: false,
      });

    if (categoriesLoading) {
      return <Skeleton className="h-10 w-[110px]" />;
    }

    return (
      <Select
        value={categoryFilter === "all" ? "" : categoryFilter}
        onValueChange={(value) => onCategoryFilterChange?.(value || "all")}
      >
        <SelectTrigger>
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categoriesData?.categories?.map((category) => (
            <SelectItem key={category.id} value={category.name}>
              {category.name}
              {/* {category.lead_count !== undefined && (
                <span className="ml-1 text-xs text-gray-500">
                  ({category.lead_count})
                </span>
              )} */}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  const SourceFilterSelect = () => {
    const { data: sourcesData, isLoading: sourcesLoading } = useGetSourcesQuery(
      {
        include_lead_count: true,
      }
    );

    if (sourcesLoading) {
      return <Skeleton className="h-10 w-[110px]" />;
    }

    return (
      <Select
        value={sourceFilter === "all" ? "" : sourceFilter}
        onValueChange={(value) => onSourceFilterChange?.(value || "all")}
      >
        <SelectTrigger>
          <SelectValue placeholder="All Sources" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Sources</SelectItem>
          {sourcesData?.sources?.map((source: Source) => (
            <SelectItem key={source.id} value={source.name}>
              {source.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  const UnifiedDateFilterSelect = () => {
    const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState("created");

    const getActiveFilterCount = () => {
      let count = 0;
      if (
        allDateFilters?.created?.created_from &&
        allDateFilters?.created?.created_to
      )
        count++;
      if (
        allDateFilters?.updated?.updated_from &&
        allDateFilters?.updated?.updated_to
      )
        count++;
      if (
        allDateFilters?.lastContacted?.last_contacted_from &&
        allDateFilters?.lastContacted?.last_contacted_to
      )
        count++;
      return count;
    };

    const activeCount = getActiveFilterCount();

    return (
      <div className="relative">
        <Button
          variant="outline"
          onClick={() => setIsPopoverOpen(!isPopoverOpen)}
          className="w-[140px] relative"
        >
          Date filters
          {activeCount > 0 && (
            <span className="absolute -top-1 -left-1 h-4 w-4 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </Button>

        {isPopoverOpen && (
          <div className="absolute top-12 right-0 z-50 bg-white border rounded-lg shadow-lg w-96">
            <div className="p-4">
              <div className="text-sm font-medium mb-3">Date Range Filters</div>

              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="created">Created on</TabsTrigger>
                  <TabsTrigger value="updated">Updated on</TabsTrigger>
                  <TabsTrigger value="last_contacted">
                    Last contacted
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="created" className="mt-4">
                  <div className="space-y-2">
                    <Label>Filter leads by creation date</Label>
                    <div className="text-xs text-primary">
                      Default value: all time
                    </div>
                    <DateRangePicker
                      onUpdate={({ range }) =>
                        onAllDateFiltersChange?.onCreated?.({ range })
                      }
                      initialDateFrom={
                        allDateFilters?.created?.created_from
                          ? new Date(allDateFilters.created.created_from)
                          : undefined
                      }
                      initialDateTo={
                        allDateFilters?.created?.created_to
                          ? new Date(allDateFilters.created.created_to)
                          : undefined
                      }
                      placeholder="Select creation date range"
                      className="w-full"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="updated" className="mt-4">
                  <div className="space-y-2">
                    <Label>Filter leads by last update date</Label>
                    <div className="text-xs text-primary">
                      Default value: all time
                    </div>
                    <DateRangePicker
                      onUpdate={({ range }) =>
                        onAllDateFiltersChange?.onUpdated?.({ range })
                      }
                      initialDateFrom={
                        allDateFilters?.updated?.updated_from
                          ? new Date(allDateFilters.updated.updated_from)
                          : undefined
                      }
                      initialDateTo={
                        allDateFilters?.updated?.updated_to
                          ? new Date(allDateFilters.updated.updated_to)
                          : undefined
                      }
                      placeholder="Select update date range"
                      className="w-full"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="last_contacted" className="mt-4">
                  <div className="space-y-2">
                    <Label>Filter leads by last contact date</Label>
                    <div className="text-xs text-primary">
                      Default value: all time
                    </div>
                    <DateRangePicker
                      onUpdate={({ range }) =>
                        onAllDateFiltersChange?.onLastContacted?.({ range })
                      }
                      initialDateFrom={
                        allDateFilters?.lastContacted?.last_contacted_from
                          ? new Date(
                              allDateFilters.lastContacted.last_contacted_from
                            )
                          : undefined
                      }
                      initialDateTo={
                        allDateFilters?.lastContacted?.last_contacted_to
                          ? new Date(
                              allDateFilters.lastContacted.last_contacted_to
                            )
                          : undefined
                      }
                      placeholder="Select contact date range"
                      className="w-full"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPopoverOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 🆕 NEW: Admin-only User Filter Component
  const UserFilterSelect = () => {
    if (!isAdmin) return null; // Hide for non-admins

    if (usersLoading) {
      return <Skeleton className="h-10 w-[140px]" />;
    }

    return (
      <Select
        value={userFilter === "all" ? "" : userFilter}
        onValueChange={(value) => onUserFilterChange?.(value || "all")}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="All Users" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Users</SelectItem>
          {assignableUsers.map((user) => (
            <SelectItem key={user.email} value={user.email}>
              {user.name}
              <span className="ml-1 text-xs text-gray-500">
                ({user.current_lead_count})
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  // Get column display name helper
  const getColumnDisplayName = (col: Column<TData, unknown>) => {
    const columnDef = col.columnDef;

    if (typeof columnDef.header === "string") {
      return columnDef.header;
    }

    if (typeof columnDef.header === "function") {
      switch (col.id) {
        case "name":
          return "Lead Name";
        case "stage":
          return "Stage";
        case "assignedTo":
          return "Assigned To";
        case "email":
          return "Email";
        case "phone":
          return "Phone";
        case "status":
          return "Status";
        case "createdAt":
          return "Created At";
        case "updatedAt":
          return "Updated At";
        default:
          return col.id
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (str: string) => str.toUpperCase())
            .trim();
      }
    }

    return col.id
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str: string) => str.toUpperCase())
      .trim();
  };

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        {isMobile ? (
          // 📱 MOBILE HEADER - Title on top, Search + Filter below
          <div className="w-full space-y-4">
            <div className="flex items-center justify-start">
              <h2 className="text-xl font-bold tracking-tight">{title}</h2>
            </div>
            <div className="flex items-center space-x-2">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search leads..."
                  value={searchQuery}
                  onChange={(event) => onSearchChange?.(event.target.value)}
                  className="pl-8 pr-16"
                  disabled={!onSearchChange}
                />

                {isSearching && searchQuery.length > 0 && (
                  <div className="absolute right-8 top-2.5">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                )}

                {searchQuery && onClearSearch && !isSearching && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-6 w-6 p-0"
                    onClick={onClearSearch}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* Filter Icon */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFilterModalOpen(true)}
                className="relative flex-shrink-0"
              >
                <Filter className="h-4 w-4" />
                {(stageFilter !== "all" || statusFilter !== "all") && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                    {(stageFilter !== "all" ? 1 : 0) +
                      (statusFilter !== "all" ? 1 : 0)}
                  </span>
                )}
              </Button>
              <Button
                variant={"outline"}
                size="sm"
                onClick={() => {
                  showWarning(
                    "Sorting Feature is Coming Soon!",
                    "Feature Coming Soon"
                  );
                }}
              >
                <ListFilterIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          // 🖥️ DESKTOP HEADER - Keep Existing Full Header
          <>
            <div className="w-full space-y-2">
              <div className="flex flex-row justify-between w-full">
                <div className="flex items-center gap-4 ">
                  <h2 className="text-2xl font-bold tracking-tight">{title}</h2>

                  {/* Column Visibility MultiSelect */}
                  <div className="w-48">
                    <MultiSelect
                      options={table
                        .getAllColumns()
                        .filter((column) => column.getCanHide())
                        .map((column) => ({
                          value: column.id,
                          label: getColumnDisplayName(column),
                          subtitle: column.getIsVisible()
                            ? "Visible"
                            : "Hidden",
                        }))}
                      value={table
                        .getAllColumns()
                        .filter(
                          (column) =>
                            column.getCanHide() && column.getIsVisible()
                        )
                        .map((column) => column.id)}
                      onChange={(selectedColumnIds) => {
                        table
                          .getAllColumns()
                          .filter((column) => column.getCanHide())
                          .forEach((column) => {
                            column.toggleVisibility(
                              selectedColumnIds.includes(column.id)
                            );
                          });
                      }}
                      placeholder="Customize"
                      searchPlaceholder="Search columns..."
                      emptyMessage="No columns found."
                      maxDisplayItems={2}
                      showCheckbox={true}
                      allowSingleSelect={false}
                      showSelectedBadges={false}
                      alwaysShowPlaceholder={true}
                      showIcon={true}
                      icon={<Grid2X2PlusIcon className="h-4 w-4" />}
                      buttonVariant="outline"
                      buttonSize="default"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {onExportCsv && (
                    <Button
                      size="sm"
                      onClick={onExportCsv}
                      className="gap-2"
                      variant={"outline-primary"}
                    >
                      <DownloadIcon className="h-4 w-4" />
                      .csv
                    </Button>
                  )}
                  {/* Bulk Actions Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant={"outline-primary"}
                        disabled={selectedRowIds.length === 0} // Disable when no rows selected
                      >
                        <Zap />
                        Bulk Actions
                        <ChevronDown className="w-4 h-4" />
                        {selectedRowIds.length > 0 && (
                          <Badge className="text-xs rounded-full">
                            {selectedRowIds.length}
                          </Badge>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setIsBulkEmailOpen(true)}
                        disabled={selectedRowIds.length === 0}
                      >
                        <Mail className="w-4 h-4" />
                        Bulk Email ({selectedRowIds.length})
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setIsBulkWhatsAppOpen(true)}
                        disabled={selectedRowIds.length === 0}
                      >
                        <MessageSquareText className="w-4 h-4" />
                        Bulk WhatsApp ({selectedRowIds.length})
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <NewLeadDropdown />
                </div>
              </div>

              <div className="flex justify-between">
                {/* Search Input */}
                <div className="relative w-84">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search leads..."
                    value={searchQuery}
                    onChange={(event) => onSearchChange?.(event.target.value)}
                    className="pl-8 pr-16"
                    disabled={!onSearchChange}
                  />

                  {isSearching && searchQuery.length > 0 && (
                    <div className="absolute right-8 top-2.5">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  )}

                  {searchQuery && onClearSearch && !isSearching && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-6 w-6 p-0"
                      onClick={onClearSearch}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                <div className="flex gap-2">
                  <StageFilterSelect />
                  <StatusFilterSelect />
                  <CategoryFilterSelect />
                  <SourceFilterSelect />
                  <UserFilterSelect />
                  <UnifiedDateFilterSelect />
                  {/* <DateFilterSelect />
                  <UpdatedDateFilterSelect />
                  <LastContactedDateFilterSelect /> */}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {description && <p className="text-muted-foreground">{description}</p>}

      {/* Active Filters Display */}
      {(hasActiveFilters || searchQuery) && (
        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
          <span className="text-sm font-medium">Active filters:</span>

          {searchQuery && (
            <Badge variant="secondary" className="gap-1">
              Search: &quot;{searchQuery}&quot;
              {onClearSearch && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1"
                  onClick={onClearSearch}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </Badge>
          )}

          {stageFilter !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Stage: {getStageDisplayName(stageFilter)}
              <Button variant="ghost" size="sm" className="h-auto p-0 ml-1">
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {departmentFilter !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Department: {departmentFilter}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1"
                onClick={() => setDepartmentFilter("all")}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {categoryFilter !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Category:{" "}
              {categoriesData?.categories?.find(
                (c) => c.name === categoryFilter
              )?.name || categoryFilter}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1"
                onClick={() => onCategoryFilterChange?.("all")}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {isAdmin && userFilter !== "all" && (
            <Badge variant="secondary" className="gap-1">
              User:{" "}
              {assignableUsers.find((u) => u.email === userFilter)?.name ||
                userFilter}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1"
                onClick={() => onUserFilterChange?.("all")}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-6 text-xs"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* 🔥 CONDITIONAL RENDERING - MOBILE VS DESKTOP */}
      {isMobile ? (
        // 📱 MOBILE VIEW
        <MobileLeadsView
          data={data}
          isLoading={isLoading}
          searchQuery={searchQuery}
          isSearching={isSearching}
          hasActiveFilters={hasActiveFilters}
          paginationMeta={paginationMeta}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          router={router}
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const isPinned = header.column.getIsPinned();
                    return (
                      <TableHead
                        key={header.id}
                        className={
                          isPinned === "right"
                            ? "sticky right-0 z-10 bg-background border-l shadow-lg"
                            : ""
                        }
                        style={
                          isPinned === "right"
                            ? { right: `${header.column.getStart("right")}px` }
                            : {}
                        }
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="text-center p-6"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span>Loading leads...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="text-center p-6 text-muted-foreground"
                  >
                    {hasActiveFilters || searchQuery ? (
                      <p>No data available for the selected filter.</p>
                    ) : (
                      <>
                        <p className="font-medium">No leads in the system</p>
                        <p className="text-sm">
                          Get started by creating your first lead or importing
                          leads from a CSV file.
                        </p>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => {
                      const isPinned = cell.column.getIsPinned();
                      return (
                        <TableCell
                          key={cell.id}
                          className={
                            isPinned === "right"
                              ? "sticky right-0 z-10 bg-white border-l"
                              : ""
                          }
                          style={
                            isPinned === "right"
                              ? { right: `${cell.column.getStart("right")}px` }
                              : {}
                          }
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <ServerPagination
            paginationMeta={paginationMeta}
            onPageChange={onPageChange!}
            onPageSizeChange={onPageSizeChange!}
            searchQuery={searchQuery}
            isLoading={isLoading}
            showResultsInfo={true}
            showPageSizeSelector={true}
            pageSizeOptions={[10, 20, 30, 50, 100]}
            className="mt-0 flex-row"
          />
        </div>
      )}

      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        currentStageFilter={stageFilter}
        currentStatusFilter={statusFilter}
        onApplyFilters={(newStageFilter, newStatusFilter) => {
          onStageFilterChange?.(newStageFilter);
          onStatusFilterChange?.(newStatusFilter);
        }}
      />
      <TataTeliModal />
      <EmailDialog />
      <WhatsAppModal />
      <BulkEmailPopUp
        isOpen={isBulkEmailOpen}
        onClose={() => setIsBulkEmailOpen(false)}
        selectedLeadIds={selectedRowIds}
      />
      <BulkWhatsAppPopUp
        isOpen={isBulkWhatsAppOpen}
        onClose={() => setIsBulkWhatsAppOpen(false)}
        selectedLeadIds={selectedRowIds}
      />
    </div>
  );
}
