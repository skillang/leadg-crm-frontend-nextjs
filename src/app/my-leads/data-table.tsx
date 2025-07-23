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
import { Badge } from "@/components/ui/badge";
import {
  Search,
  X,
  DownloadIcon,
  Grid2X2PlusIcon,
  SlidersHorizontalIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
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

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  title?: string;
  description?: string;
  onAddNew?: () => void;
  onExportCsv?: () => void;
  onCustomize?: () => void;
  // 🔥 ADD THESE OPTIONAL PROPS
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
}

export function DataTable<TData, TValue>({
  columns,
  data,
  title = "Leads",
  description,
  onExportCsv,
  paginationMeta,
  onPageChange,
  onPageSizeChange,
  isLoading = false,
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
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    ...(paginationMeta
      ? {
          // Server-side pagination: disable TanStack pagination entirely
          manualPagination: true,
          pageCount: Math.ceil(paginationMeta.total / paginationMeta.limit),
        }
      : {
          // Client-side pagination: use TanStack pagination
          getPaginationRowModel: getPaginationRowModel(),
          onPaginationChange: setPagination,
        }),

    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
      // 🔥 FIX: Only include pagination state for client-side pagination
      ...(paginationMeta ? {} : { pagination }),
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

  // const getSortIcon = (isSorted: false | "asc" | "desc") => {
  //   if (!isSorted) return <ArrowUpDown className="ml-2 h-4 w-4" />;
  //   return isSorted === "desc" ? (
  //     <ArrowDown className="ml-2 h-4 w-4" />
  //   ) : (
  //     <ArrowUp className="ml-2 h-4 w-4" />
  //   );
  // };

  // 🔥 NEW: Stage statistics component using API data
  const StageStatsOverview = () => {
    const stageCounts = React.useMemo(() => {
      if (!stagesData?.stages || !data) return {};

      const counts: Record<string, number> = {};
      stagesData.stages.forEach((stage) => {
        counts[stage.name] = (data as Array<{ stage: string }>).filter(
          (lead) => lead.stage === stage.name
        ).length;
      });
      return counts;
    }, [stagesData?.stages]);

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
  const ServerPagination = () => {
    if (!paginationMeta || !onPageChange || !onPageSizeChange) return null;

    const { total, page, limit, has_next, has_prev } = paginationMeta;
    const totalPages = Math.ceil(total / limit);
    const startRecord = (page - 1) * limit + 1;
    const endRecord = Math.min(page * limit, total);

    const getVisiblePages = () => {
      if (totalPages <= 3) {
        // Show all pages if 3 or fewer
        return Array.from({ length: totalPages }, (_, i) => i + 1);
      }

      if (page <= 2) {
        // Show first 3 pages if current page is 1 or 2
        return [1, 2, 3];
      }

      if (page >= totalPages - 1) {
        // Show last 3 pages if current page is near the end
        return [totalPages - 2, totalPages - 1, totalPages];
      }

      // Show current page and one on each side
      return [page - 1, page, page + 1];
    };

    const visiblePages = getVisiblePages();
    const showStartEllipsis = visiblePages[0] > 1;
    const showEndEllipsis = visiblePages[visiblePages.length - 1] < totalPages;

    return (
      <div className="flex items-center justify-between w-full px-4 py-4 border-t bg-white">
        {/* 🔥 LEFT SIDE - Results info and page size selector */}
        <div className="flex items-center space-x-6">
          {/* Results info */}
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            Showing {startRecord} to {endRecord} of {total} results
          </div>

          {/* Page size selector */}
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

        {/* 🔥 RIGHT SIDE - Pagination controls */}
        <div className="flex items-center">
          <Pagination>
            <PaginationContent className="flex items-center space-x-1">
              {/* Previous Button */}
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => has_prev && onPageChange(page - 1)}
                  className={`
                  h-8 px-3 text-sm
                  ${
                    !has_prev
                      ? "pointer-events-none opacity-50 cursor-not-allowed"
                      : "cursor-pointer hover:bg-accent"
                  }
                `}
                />
              </PaginationItem>

              {/* First page + ellipsis if needed */}
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

              {/* Visible page numbers */}
              {visiblePages.map((pageNum) => (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    onClick={() => onPageChange(pageNum)}
                    isActive={page === pageNum}
                    className={`
                    h-8 w-8 p-0 text-sm cursor-pointer
                    ${
                      page === pageNum
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "hover:bg-accent"
                    }
                  `}
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              ))}

              {/* Last page + ellipsis if needed */}
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

              {/* Next Button */}
              <PaginationItem>
                <PaginationNext
                  onClick={() => has_next && onPageChange(page + 1)}
                  className={`
                  h-8 px-3 text-sm
                  ${
                    !has_next
                      ? "pointer-events-none opacity-50 cursor-not-allowed"
                      : "cursor-pointer hover:bg-accent"
                  }
                `}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
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
        {isLoading && (
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
              paginationMeta ? (
                // Server-side pagination: render all data directly
                <>
                  {data.map((item: any, index) => (
                    <TableRow key={index} className="hover:bg-muted/50">
                      {columns.map((column, colIndex) => {
                        const accessorKey = (column as any).accessorKey;
                        const cellValue = accessorKey
                          ? item[accessorKey]
                          : null;

                        return (
                          <TableCell key={colIndex}>
                            {column.cell
                              ? (column.cell as any)({
                                  row: {
                                    original: item,
                                    getValue: (key: string) =>
                                      item[key] ||
                                      item[accessorKey] ||
                                      cellValue,
                                    id: index.toString(),
                                    index,
                                    getIsSelected: () => false,
                                    toggleSelected: () => {},
                                  },
                                  getValue: () => cellValue,
                                  column: column,
                                  table: table,
                                })
                              : cellValue || "-"}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </>
              ) : (
                // Client-side pagination: use table rows
                <>
                  {table.getRowModel().rows.map((row) => (
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
                  ))}
                </>
              )
            ) : !isLoading ? (
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
            ) : null}
          </TableBody>
        </Table>

        {paginationMeta ? <ServerPagination /> : <ImprovedPagination />}
      </div>
    </div>
  );
}
