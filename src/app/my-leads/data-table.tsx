// src/app/my-leads/data-table.tsx - UPDATED TO USE API STAGES FOR FILTERING

"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import NewLeadDropdown from "@/components/leads/NewLeadDropdown";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
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
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  X,
  CalendarDaysIcon,
  DownloadIcon,
  Grid2X2PlusIcon,
  ListFilterIcon,
  SlidersHorizontalIcon,
  ArrowUpDown,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
} from "lucide-react";

// 🔥 NEW: Import stages API instead of constants
import { useGetActiveStagesQuery } from "@/redux/slices/stagesApi";
import { StageDisplay, useStageUtils } from "@/components/common/StageDisplay";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  title?: string;
  description?: string;
  onAddNew?: () => void;
  onExportCsv?: () => void;
  onCustomize?: () => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  title = "Leads",
  description,
  onExportCsv,
}: DataTableProps<TData, TValue>) {
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

  // Local filter states
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [stageFilter, setStageFilter] = React.useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string[]>([]);
  const [dateRange, setDateRange] = React.useState("last-7-days");

  // 🔥 NEW: Get stages from API
  const { data: stagesData, isLoading: stagesLoading } =
    useGetActiveStagesQuery({});
  const { getStageDisplayName } = useStageUtils();

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    globalFilterFn: "includesString",
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
      pagination,
    },
  });

  // Apply filters to table
  React.useEffect(() => {
    const filters: ColumnFiltersState = [];

    if (stageFilter !== "all") {
      filters.push({ id: "stage", value: stageFilter });
    }

    if (departmentFilter !== "all") {
      filters.push({ id: "department", value: departmentFilter });
    }

    if (statusFilter.length > 0) {
      filters.push({ id: "status", value: statusFilter });
    }

    setColumnFilters(filters);
  }, [stageFilter, departmentFilter, statusFilter]);

  const hasActiveFilters =
    stageFilter !== "all" ||
    departmentFilter !== "all" ||
    statusFilter.length > 0;
  const activeFiltersCount = [
    stageFilter !== "all" ? 1 : 0,
    departmentFilter !== "all" ? 1 : 0,
    statusFilter.length > 0 ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const clearAllFilters = () => {
    setStageFilter("all");
    setDepartmentFilter("all");
    setStatusFilter([]);
    setGlobalFilter("");
  };

  const getSortIcon = (isSorted: false | "asc" | "desc") => {
    if (!isSorted) return <ArrowUpDown className="ml-2 h-4 w-4" />;
    return isSorted === "desc" ? (
      <ArrowDown className="ml-2 h-4 w-4" />
    ) : (
      <ArrowUp className="ml-2 h-4 w-4" />
    );
  };

  // 🔥 NEW: Stage statistics component using API data
  const StageStatsOverview = () => {
    const stageCounts = React.useMemo(() => {
      if (!stagesData?.stages || !data) return {};

      const counts: Record<string, number> = {};
      stagesData.stages.forEach((stage) => {
        counts[stage.name] = (data as any[]).filter(
          (lead: any) => lead.stage === stage.name
        ).length;
      });
      return counts;
    }, [stagesData, data]);

    if (stagesLoading) {
      return (
        <div className="flex gap-2 mb-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-6 w-16 bg-gray-200 rounded animate-pulse"
            />
          ))}
        </div>
      );
    }

    return (
      <div className="flex flex-wrap gap-2 mb-4">
        {stagesData?.stages.map((stage) => (
          <button
            key={stage.id}
            onClick={() => setStageFilter(stage.name)}
            className={`
              transition-all duration-200 hover:scale-105
              ${
                stageFilter === stage.name
                  ? "ring-2 ring-blue-500 ring-offset-1"
                  : ""
              }
            `}
          >
            <Badge
              className="cursor-pointer border-2"
              style={{
                backgroundColor: `${stage.color}20`,
                borderColor: stage.color,
                color: stage.color,
              }}
            >
              {stage.display_name}: {stageCounts[stage.name] || 0}
            </Badge>
          </button>
        ))}
      </div>
    );
  };

  // 🔥 UPDATED: Stage filter component using API data
  const StageFilterSelect = () => {
    if (stagesLoading) {
      return (
        <div className="w-[180px] h-10 bg-gray-200 rounded animate-pulse" />
      );
    }

    return (
      <Select value={stageFilter} onValueChange={setStageFilter}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by stage" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Stages</SelectItem>
          {stagesData?.stages.map((stage) => (
            <SelectItem key={stage.id} value={stage.name}>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: stage.color }}
                />
                <span>{stage.display_name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  // Improved pagination component
  const ImprovedPagination = () => {
    const {
      getState,
      getCanPreviousPage,
      getCanNextPage,
      getPageCount,
      setPageIndex,
      previousPage,
      nextPage,
      setPageSize,
      getFilteredRowModel,
      getFilteredSelectedRowModel,
    } = table;

    const { pageIndex, pageSize } = getState().pagination;
    const totalRows = getFilteredRowModel().rows.length;
    const selectedRows = getFilteredSelectedRowModel().rows.length;

    // Calculate page numbers to show
    const getPageNumbers = () => {
      const totalPages = getPageCount();
      const currentPage = pageIndex + 1;
      const delta = 2; // Number of pages to show on each side of current page

      let start = Math.max(1, currentPage - delta);
      let end = Math.min(totalPages, currentPage + delta);

      // Adjust if we're near the beginning or end
      if (currentPage <= delta + 1) {
        end = Math.min(totalPages, delta * 2 + 1);
      }
      if (currentPage >= totalPages - delta) {
        start = Math.max(1, totalPages - delta * 2);
      }

      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    };

    return (
      <div className="flex items-center justify-between px-2 py-4">
        {/* Left side - Selection info */}
        <div className="flex items-center space-x-4">
          <div className="text-sm text-muted-foreground">
            {selectedRows} of {totalRows} row(s) selected
          </div>

          {/* Page size selector */}
          <div className="flex items-center space-x-2">
            <p className="text-sm text-muted-foreground">Rows per page:</p>
            <Select
              value={`${pageSize}`}
              onValueChange={(value) => {
                setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[5, 10, 20, 30, 40, 50, 100].map((size) => (
                  <SelectItem key={size} value={`${size}`}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Right side - Pagination controls */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => setPageIndex(0)}
              disabled={!getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={previousPage}
              disabled={!getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Page numbers */}
            <div className="flex items-center space-x-1">
              {getPageNumbers().map((page) => (
                <Button
                  key={page}
                  variant={page === pageIndex + 1 ? "default" : "outline"}
                  className="h-8 w-8 p-0"
                  onClick={() => setPageIndex(page - 1)}
                >
                  {page}
                </Button>
              ))}
            </div>

            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={nextPage}
              disabled={!getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => setPageIndex(getPageCount() - 1)}
              disabled={!getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            Page {pageIndex + 1} of {getPageCount()}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center justify-between gap-4">
          {" "}
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>{" "}
          {/* Column Visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Grid2X2PlusIcon className="mr-2 h-4 w-4" />
                Customize
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center justify-between">
            {/* Filters and Search */}
            <div className="flex items-center space-x-2">
              {/* Global Search */}
              <div className="relative w-54">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search leads..."
                  value={globalFilter ?? ""}
                  onChange={(event) =>
                    setGlobalFilter(String(event.target.value))
                  }
                  className="pl-8"
                />
                {globalFilter && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-6 w-6 p-0"
                    onClick={() => setGlobalFilter("")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* Department Filter */}
              <Select
                value={departmentFilter}
                onValueChange={setDepartmentFilter}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                </SelectContent>
              </Select>

              {/* Advanced Filters */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <SlidersHorizontalIcon className="mr-2 h-4 w-4" />
                    Filters
                    {hasActiveFilters && (
                      <Badge variant="secondary" className="ml-2 h-4 w-4 p-0">
                        {activeFiltersCount}
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
            </div>
          </div>
          <StageFilterSelect />
          {onExportCsv && (
            <Button variant="outline" size="sm" onClick={onExportCsv}>
              <DownloadIcon className="mr-2 h-4 w-4" />. csv
            </Button>
          )}
          <NewLeadDropdown />
        </div>
      </div>
      {description && <p className="text-muted-foreground">{description}</p>}

      {/* Stage Statistics Overview */}
      <StageStatsOverview />

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
          <span className="text-sm font-medium">Active filters:</span>
          {stageFilter !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Stage: {getStageDisplayName(stageFilter)}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1"
                onClick={() => setStageFilter("all")}
              >
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

      {/* Data Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
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
            {table.getRowModel().rows?.length ? (
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
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {hasActiveFilters
                    ? "No leads match your filters."
                    : "No leads found."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Improved Pagination */}
      <ImprovedPagination />
    </div>
  );
}
