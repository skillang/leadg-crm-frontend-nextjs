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
  Column,
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
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
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  title?: string;
  description?: string;
  onAddNew?: () => void;
  onExportCsv?: () => void;
  onCustomize?: () => void;
  // Server-side pagination props
  paginationMeta?: {
    total: number;
    page: number;
    limit: number;
    has_next: boolean;
    has_prev: boolean;
  };
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
  dateFilter?: { created_from?: string; created_to?: string };
  onDateFilterChange?: ({ range }: { range: DateRange }) => void;
  sourceFilter?: string; // Add this
  onSourceFilterChange?: (value: string) => void;
  onStageFilterChange?: (value: string) => void;
  onStatusFilterChange?: (value: string) => void;
  router?: AppRouterInstance;
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
  dateFilter,
  onDateFilterChange,
  onStageFilterChange,
  onStatusFilterChange,
  onSourceFilterChange,
  router,
}: DataTableProps<TData, TValue>) {
  const { showWarning } = useNotifications();
  const isMobile = useIsMobile();
  const [isFilterModalOpen, setIsFilterModalOpen] = React.useState(false);
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
  const { getStageDisplayName } = useStageUtils();

  const table = useReactTable({
    data,
    columns,
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
      ...(paginationMeta ? {} : { pagination }),
    },
  });

  const hasActiveFilters =
    stageFilter !== "all" ||
    departmentFilter !== "all" ||
    categoryFilter !== "all" ||
    statusFilter !== "all";

  // const activeFiltersCount = [
  //   stageFilter !== "all" ? 1 : 0,
  //   departmentFilter !== "all" ? 1 : 0,
  //   statusFilter !== "all" ? 1 : 0,
  //   categoryFilter !== "all" ? 1 : 0,
  //   dateFilter?.created_from && dateFilter?.created_to ? 1 : 0, // ADD THIS
  // ].reduce((a, b) => a + b, 0);

  const clearAllFilters = () => {
    onStageFilterChange?.("all"); // ADD THIS
    onStatusFilterChange?.("all");
    setDepartmentFilter("all");
    onCategoryFilterChange?.("all");
    // onDateFilterChange?.({ range: { from: undefined, to: undefined } });
    // 🔥 Also clear search when clearing all filters
    if (onClearSearch) {
      onClearSearch();
    }
  };

  // 🔥 Server Pagination Component
  const ServerPagination = () => {
    if (!paginationMeta || !onPageChange || !onPageSizeChange) return null;

    const { total, page, limit, has_next, has_prev } = paginationMeta;
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

    return (
      <div className="flex items-center justify-between w-full px-4 py-4 border-t bg-white">
        {/* LEFT SIDE - Results info and page size selector */}
        <div className="flex items-center space-x-6">
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            Showing {startRecord} to {endRecord} of {total} results
            {searchQuery && (
              <span className="text-blue-600"> (search results)</span>
            )}
          </div>

          <div className="flex items-center space-x-2 whitespace-nowrap">
            <span className="text-sm text-muted-foreground">
              Rows per page:
            </span>
            <Select
              value={limit.toString()}
              onValueChange={(value) => {
                onPageSizeChange(Number(value));
                onPageChange(1);
              }}
            >
              <SelectTrigger className="h-8 w-[70px] border-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="30">30</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* RIGHT SIDE - Pagination controls */}
        <div className="flex items-center">
          <Pagination>
            <PaginationContent className="flex items-center space-x-1">
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => has_prev && onPageChange(page - 1)}
                  className={`h-8 px-3 text-sm ${
                    !has_prev
                      ? "pointer-events-none opacity-50 cursor-not-allowed"
                      : "cursor-pointer hover:bg-accent"
                  }`}
                />
              </PaginationItem>

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
                    !has_next
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

  const DateFilterSelect = () => {
    // Convert string dates back to Date objects for the picker
    const getInitialDates = () => {
      if (dateFilter?.created_from) {
        return {
          from: new Date(dateFilter.created_from),
          to: dateFilter.created_to
            ? new Date(dateFilter.created_to)
            : new Date(dateFilter.created_from),
        };
      }
      return undefined;
    };

    const initialRange = getInitialDates();

    return (
      <DateRangePicker
        onUpdate={onDateFilterChange}
        initialDateFrom={initialRange?.from}
        initialDateTo={initialRange?.to}
        placeholder="Select date range"
        className="w-[200px]"
      />
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
                  <DateFilterSelect />
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

          {/* {dateFilter?.created_from && dateFilter?.created_to && (
            <Badge variant="secondary" className="gap-1">
              Date: {format(new Date(dateFilter.created_from), "MMM dd")} -{" "}
              {format(new Date(dateFilter.created_to), "MMM dd, yyyy")}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1"
                onClick={() =>
                  onDateFilterChange?.({
                    range: { from: undefined, to: undefined },
                  })
                }
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )} */}

          {/* {sourceFilter !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Source: {sourceFilter}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1"
                onClick={() => {
                  setSourceFilter("all");
                  onSourceFilterChange?.("all");
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )} */}

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
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
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
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {paginationMeta && <ServerPagination />}
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
    </div>
  );
}
