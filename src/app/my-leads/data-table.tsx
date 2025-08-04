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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  X,
  DownloadIcon,
  Grid2X2PlusIcon,
  SlidersHorizontalIcon,
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
import TataTeliModal from "@/components/communication/calling/TataTeliModal";

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
  onStageFilterChange,
  onStatusFilterChange,
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
  const [dateRange, setDateRange] = React.useState("last-7-days");

  // Get stages from API
  const { data: stagesData, isLoading: stagesLoading } =
    useGetActiveStagesQuery({});
  const { data: statusData, isLoading: statusLoading } =
    useGetActiveStatusesQuery({});
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
    statusFilter !== "all";

  const activeFiltersCount = [
    stageFilter !== "all" ? 1 : 0,
    departmentFilter !== "all" ? 1 : 0,
    statusFilter !== "all" ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const clearAllFilters = () => {
    onStageFilterChange?.("all"); // ADD THIS
    onStatusFilterChange?.("all");
    setDepartmentFilter("all");
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
      return (
        <div className="w-[180px] h-10 bg-gray-200 rounded animate-pulse" />
      );
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
      return (
        <div className="w-[180px] h-10 bg-gray-200 rounded animate-pulse" />
      );
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
            <div className="flex items-center gap-4">
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
                      subtitle: column.getIsVisible() ? "Visible" : "Hidden",
                    }))}
                  value={table
                    .getAllColumns()
                    .filter(
                      (column) => column.getCanHide() && column.getIsVisible()
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
              {/* Search Input */}
              <div className="relative w-54">
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

              <StageFilterSelect />
              <StatusFilterSelect />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <SlidersHorizontalIcon className="mr-2 h-4 w-4" />
                    Filters
                    {(hasActiveFilters || searchQuery) && (
                      <Badge variant="secondary" className="ml-2 h-4 w-4 p-0">
                        {activeFiltersCount + (searchQuery ? 1 : 0)}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={clearAllFilters}>
                    Clear all filters
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup
                    value={dateRange}
                    onValueChange={setDateRange}
                  >
                    <DropdownMenuRadioItem value="today">
                      Today
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="last-7-days">
                      Last 7 days
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="last-30-days">
                      Last 30 days
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="all">
                      All time
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              {onExportCsv && (
                <Button
                  variant="primaryOutline"
                  size="sm"
                  onClick={onExportCsv}
                  className="gap-2"
                >
                  <DownloadIcon className="h-4 w-4" />
                  .csv
                </Button>
              )}

              <NewLeadDropdown />
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
        // 🖥️ DESKTOP VIEW - Existing table structure
        <div className="rounded-md border">
          {isLoading && !isSearching && (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
              Loading leads...
            </div>
          )}

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
              {!isLoading && data.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="hover:bg-muted/50"
                  >
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
              ) : !isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    {searchQuery
                      ? `No leads found matching "${searchQuery}"`
                      : hasActiveFilters
                      ? "No leads match your filters."
                      : "No leads found."}
                  </TableCell>
                </TableRow>
              ) : (
                isSearching && (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        Searching...
                      </div>
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
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
