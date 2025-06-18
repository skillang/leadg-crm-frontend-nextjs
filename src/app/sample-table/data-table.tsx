"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  X,
  CalendarDaysIcon,
  DownloadIcon,
  Grid2X2PlusIcon,
  ListFilterIcon,
  PlusIcon,
  SlidersHorizontalIcon,
  ArrowUpDown,
  ChevronDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

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
  onAddNew,
  onExportCsv,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  // Local filter states
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [stageFilter, setStageFilter] = React.useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string[]>([]);
  const [dateRange, setDateRange] = React.useState("last-7-days");

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
    globalFilterFn: "includesString",
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
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

  // Handler functions
  const handleExportCsv = () => {
    if (onExportCsv) {
      onExportCsv();
    } else {
      console.log("Export CSV clicked");
      const csvContent =
        "data:text/csv;charset=utf-8," +
        [
          Object.keys(data[0] || {}),
          ...data.map((row) => Object.values(row as any)),
        ]
          .map((row) => (row as any[]).join(","))
          .join("\n");

      const link = document.createElement("a");
      link.setAttribute("href", encodeURI(csvContent));
      link.setAttribute("download", `${title.toLowerCase()}_export.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleAddNew = () => {
    if (onAddNew) {
      onAddNew();
    } else {
      console.log("Add new clicked");
    }
  };

  const handleClearAllFilters = () => {
    setStageFilter("all");
    setDepartmentFilter("all");
    setStatusFilter([]);
    setGlobalFilter("");
  };

  const handleStatusToggle = (status: string) => {
    setStatusFilter((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const handleSort = (columnId: string) => {
    const existingSort = sorting.find((s) => s.id === columnId);
    if (!existingSort) {
      setSorting([{ id: columnId, desc: false }]);
    } else if (!existingSort.desc) {
      setSorting([{ id: columnId, desc: true }]);
    } else {
      setSorting([]);
    }
  };

  const getSortIcon = (columnId: string) => {
    const existingSort = sorting.find((s) => s.id === columnId);
    if (!existingSort) return <ArrowUpDown className="ml-2 h-4 w-4" />;
    return existingSort.desc ? (
      <ArrowDown className="ml-2 h-4 w-4" />
    ) : (
      <ArrowUp className="ml-2 h-4 w-4" />
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Row - Integrated Header */}
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <div className="font-semibold text-2xl">{title}</div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                <Grid2X2PlusIcon className="h-4 w-4" />
                Customize
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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

        {/* Right side */}
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(String(event.target.value))}
              className="pl-8 w-64"
            />
          </div>

          {/* Sort by Dropdown - Now Working */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <SlidersHorizontalIcon className="h-4 w-4" />
                Sort by
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => handleSort("name")}
                className="cursor-pointer"
              >
                <span className="flex items-center justify-between w-full">
                  Lead name
                  {getSortIcon("name")}
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleSort("createdDate")}
                className="cursor-pointer"
              >
                <span className="flex items-center justify-between w-full">
                  Created date
                  {getSortIcon("createdDate")}
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleSort("score")}
                className="cursor-pointer"
              >
                <span className="flex items-center justify-between w-full">
                  Lead score
                  {getSortIcon("score")}
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleSort("lastActivity")}
                className="cursor-pointer"
              >
                <span className="flex items-center justify-between w-full">
                  Last activity
                  {getSortIcon("lastActivity")}
                </span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setSorting([])}
                className="cursor-pointer"
              >
                Clear sorting
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Optimized Filters for CRM */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <ListFilterIcon className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Filter Leads</DialogTitle>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Lead Stage Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Lead Stage</label>
                  <Select value={stageFilter} onValueChange={setStageFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Stages</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="proposal">Proposal</SelectItem>
                      <SelectItem value="negotiation">Negotiation</SelectItem>
                      <SelectItem value="closed-won">Closed Won</SelectItem>
                      <SelectItem value="closed-lost">Closed Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Department Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Department</label>
                  <Select
                    value={departmentFilter}
                    onValueChange={setDepartmentFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="support">Support</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Lead Source Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Lead Source</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      "Website",
                      "Email",
                      "Phone",
                      "Social Media",
                      "Referral",
                      "Advertisement",
                    ].map((source) => (
                      <div key={source} className="flex items-center space-x-2">
                        <Checkbox
                          id={source}
                          checked={statusFilter.includes(source.toLowerCase())}
                          onCheckedChange={() =>
                            handleStatusToggle(source.toLowerCase())
                          }
                        />
                        <label htmlFor={source} className="text-sm">
                          {source}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Active Filters Display */}
                {hasActiveFilters && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Active Filters
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {stageFilter !== "all" && (
                        <Badge variant="secondary" className="text-xs">
                          Stage: {stageFilter}
                          <X
                            className="ml-1 h-3 w-3 cursor-pointer"
                            onClick={() => setStageFilter("all")}
                          />
                        </Badge>
                      )}
                      {departmentFilter !== "all" && (
                        <Badge variant="secondary" className="text-xs">
                          Dept: {departmentFilter}
                          <X
                            className="ml-1 h-3 w-3 cursor-pointer"
                            onClick={() => setDepartmentFilter("all")}
                          />
                        </Badge>
                      )}
                      {statusFilter.map((status) => (
                        <Badge
                          key={status}
                          variant="secondary"
                          className="text-xs"
                        >
                          {status}
                          <X
                            className="ml-1 h-3 w-3 cursor-pointer"
                            onClick={() => handleStatusToggle(status)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="flex justify-between">
                <Button variant="outline" onClick={handleClearAllFilters}>
                  Clear All
                </Button>
                <DialogTrigger asChild>
                  <Button>Apply Filters</Button>
                </DialogTrigger>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Date Range Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <CalendarDaysIcon className="h-4 w-4" />
                Last 7 days
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuRadioGroup
                value={dateRange}
                onValueChange={setDateRange}
              >
                <DropdownMenuRadioItem value="last-7-days">
                  Last 7 days
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="last-30-days">
                  Last 30 days
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="this-month">
                  This month
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="last-month">
                  Last month
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="this-quarter">
                  This quarter
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="this-year">
                  This year
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            onClick={handleExportCsv}
            className="flex items-center gap-2 bg-blue-200 border-blue-500 border-2 text-blue-800 hover:bg-blue-100 hover:text-blue-800"
          >
            <DownloadIcon className="h-4 w-4" />
            .csv
          </Button>

          <Button
            variant="outline"
            onClick={handleAddNew}
            className="flex items-center gap-2 bg-blue-200 border-blue-500 border-2 text-blue-800 hover:bg-blue-100 hover:text-blue-800"
          >
            <PlusIcon className="h-4 w-4" />
            New lead
          </Button>
        </div>
      </div>

      {/* Description */}
      {description && <p className="text-gray-600 text-sm">{description}</p>}

      {/* Active Filters Bar */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
          <span className="text-sm text-gray-600">Active filters:</span>
          {stageFilter !== "all" && (
            <Badge variant="secondary" className="text-xs">
              Stage: {stageFilter}
              <X
                className="ml-1 h-3 w-3 cursor-pointer"
                onClick={() => setStageFilter("all")}
              />
            </Badge>
          )}
          {departmentFilter !== "all" && (
            <Badge variant="secondary" className="text-xs">
              Department: {departmentFilter}
              <X
                className="ml-1 h-3 w-3 cursor-pointer"
                onClick={() => setDepartmentFilter("all")}
              />
            </Badge>
          )}
          {statusFilter.map((status) => (
            <Badge key={status} variant="secondary" className="text-xs">
              Source: {status}
              <X
                className="ml-1 h-3 w-3 cursor-pointer"
                onClick={() => handleStatusToggle(status)}
              />
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAllFilters}
            className="text-xs h-6"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Table */}
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

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
