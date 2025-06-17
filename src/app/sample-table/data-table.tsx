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
} from "@/components/ui/dropdown-menu";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  setNameFilter,
  setStageFilter,
  setDepartmentFilter,
  clearFilters,
} from "@/redux/slices/leadsSlices"; // Fixed: leadsSlice not leadsSlices
import { selectFilters } from "@/redux/selectors/leadsSelectors"; // Fixed: selectors not selectors/leadsSelectors
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
  onCustomize,
}: DataTableProps<TData, TValue>) {
  const dispatch = useAppDispatch();
  const filters = useAppSelector(selectFilters);

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

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
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const hasActiveFilters = Boolean(
    filters.name || filters.stage || filters.department
  );

  // Handler functions
  const handleExportCsv = () => {
    if (onExportCsv) {
      onExportCsv();
    } else {
      console.log("Export CSV clicked");
      // Default CSV export logic
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

  const handleCustomize = () => {
    if (onCustomize) {
      onCustomize();
    } else {
      console.log("Customize clicked");
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Row - Integrated Header */}
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <div className="font-semibold text-2xl">{title}</div>
          <Button
            variant="outline"
            onClick={handleCustomize}
            className="flex items-center gap-2"
          >
            <Grid2X2PlusIcon className="h-4 w-4" />
            Customise
          </Button>
        </div>

        {/* Right side */}
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name..."
              value={filters.name}
              onChange={(event) => dispatch(setNameFilter(event.target.value))}
              className="pl-8 w-64"
            />
          </div>

          <Button variant="outline" className="flex items-center gap-2">
            <ListFilterIcon className="h-4 w-4" />
            Filter
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <SlidersHorizontalIcon className="h-4 w-4" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {table
                .getAllColumns()
                .filter((column) => column.getCanSort())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize cursor-pointer"
                    onClick={() =>
                      column.toggleSorting(column.getIsSorted() === "asc")
                    }
                  >
                    <ArrowUpDown className="mr-2 h-4 w-4" />
                    Sort by {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" className="flex items-center gap-2">
            <CalendarDaysIcon className="h-4 w-4" />
            Last 7 days
          </Button>

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

      {/* Enhanced Filters Row */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        {/* Stage Filter */}
        <Select
          value={filters.stage || "all"}
          onValueChange={(value) =>
            dispatch(setStageFilter(value === "all" ? "" : value))
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="first-call">First Call</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="proposal">Proposal</SelectItem>
            <SelectItem value="closed-won">Closed Won</SelectItem>
            <SelectItem value="closed-lost">Closed Lost</SelectItem>
          </SelectContent>
        </Select>

        {/* Department Filter */}
        <Select
          value={filters.department || "all"}
          onValueChange={(value) =>
            dispatch(setDepartmentFilter(value === "all" ? "" : value))
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            <SelectItem value="Sales">Sales</SelectItem>
            <SelectItem value="Marketing">Marketing</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            onClick={() => dispatch(clearFilters())}
            className="h-8 px-2 lg:px-3"
          >
            Clear
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}

        {/* Column Visibility */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              <Filter className="mr-2 h-4 w-4" />
              Columns
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
