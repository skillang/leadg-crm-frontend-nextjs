"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";

import {
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
  Phone,
  Mail,
  MessageCircle,
  Paperclip,
  Search,
} from "lucide-react";

const Button = ({
  children,
  variant = "default",
  size = "default",
  onClick,
  disabled,
  className,
  ...props
}: {
  children: React.ReactNode;
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "icon";
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  className?: string;
  [key: string]: any;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background ${
      variant === "ghost"
        ? "hover:bg-accent hover:text-accent-foreground"
        : variant === "outline"
        ? "border border-input hover:bg-accent hover:text-accent-foreground"
        : "bg-primary text-primary-foreground hover:bg-primary/90"
    } ${
      size === "sm"
        ? "h-9 px-3 rounded-md"
        : size === "icon"
        ? "h-10 w-10"
        : "h-10 px-4 py-2"
    } ${className}`}
    {...props}
  >
    {children}
  </button>
);

const Checkbox = ({
  checked,
  onCheckedChange,
  ...props
}: {
  checked?: boolean | "indeterminate";
  onCheckedChange?: (checked: boolean) => void;
  [key: string]: any;
}) => (
  <input
    type="checkbox"
    checked={checked === true}
    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
      onCheckedChange?.(e.target.checked)
    }
    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
    {...props}
  />
);

const Input = ({
  placeholder,
  value,
  onChange,
  className,
  ...props
}: {
  placeholder?: string;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  [key: string]: any;
}) => (
  <input
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...props}
  />
);

const Table = ({
  children,
  ...props
}: {
  children: React.ReactNode;
  [key: string]: any;
}) => (
  <div className="relative w-full overflow-auto">
    <table className="w-full caption-bottom text-sm" {...props}>
      {children}
    </table>
  </div>
);

const TableHeader = ({
  children,
  ...props
}: {
  children: React.ReactNode;
  [key: string]: any;
}) => (
  <thead className="[&_tr]:border-b" {...props}>
    {children}
  </thead>
);

const TableBody = ({
  children,
  ...props
}: {
  children: React.ReactNode;
  [key: string]: any;
}) => (
  <tbody className="[&_tr:last-child]:border-0" {...props}>
    {children}
  </tbody>
);

const TableHead = ({
  children,
  className,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}) => (
  <th
    className={`h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 ${className}`}
    {...props}
  >
    {children}
  </th>
);

const TableRow = ({
  children,
  className,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}) => (
  <tr
    className={`border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted ${className}`}
    {...props}
  >
    {children}
  </tr>
);

const TableCell = ({
  children,
  className,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}) => (
  <td
    className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 ${className}`}
    {...props}
  >
    {children}
  </td>
);

const DropdownMenu = ({ children }: { children: React.ReactNode }) => (
  <div className="relative inline-block">{children}</div>
);
const DropdownMenuTrigger = ({
  children,
  asChild,
}: {
  children: React.ReactNode;
  asChild?: boolean;
}) => <div>{children}</div>;
const DropdownMenuContent = ({
  children,
  align,
}: {
  children: React.ReactNode;
  align?: "start" | "end";
}) => (
  <div
    className={`absolute ${
      align === "end" ? "right-0" : "left-0"
    } mt-2 w-48 rounded-md border bg-popover p-1 text-popover-foreground shadow-md z-50`}
  >
    {children}
  </div>
);
const DropdownMenuItem = ({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) => (
  <div
    onClick={onClick}
    className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
  >
    {children}
  </div>
);
const DropdownMenuLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="px-2 py-1.5 text-sm font-semibold">{children}</div>
);
const DropdownMenuSeparator = () => (
  <div className="-mx-1 my-1 h-px bg-muted" />
);
const DropdownMenuCheckboxItem = ({
  children,
  checked,
  onCheckedChange,
}: {
  children: React.ReactNode;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}) => (
  <div
    onClick={() => onCheckedChange?.(!checked)}
    className="relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      {checked && "✓"}
    </span>
    {children}
  </div>
);

// Lead data type
export type Lead = {
  id: string;
  name: string;
  createdOn: string;
  stage:
    | "Badge"
    | "Contacted"
    | "First call"
    | "Closed"
    | "Qualified"
    | "Proposal"
    | "Demo Scheduled"
    | "New";
  leadScore: number;
  contact: string;
  source: string;
  media: string;
  lastActivity: string;
  notes?: string;
  department?: string;
};

// Sample data
const data: Lead[] = [
  {
    id: "LD-001",
    name: "Krishna Reddy",
    createdOn: "15 Sep 2027",
    stage: "Badge",
    leadScore: 92,
    contact: "krishna.reddy@email.com",
    source: "Web",
    media: "",
    lastActivity: "6 hours ago",
    notes: "Interested in premium package",
    department: "Sales",
  },
  {
    id: "LD-002",
    name: "Reyansh Joshi",
    createdOn: "22 Jul 2022",
    stage: "Contacted",
    leadScore: 66,
    contact: "reyansh.joshi@company.com",
    source: "Whatsapp campaign",
    media: "",
    lastActivity: "4 days ago",
    notes: "Follow up scheduled",
    department: "Marketing",
  },
  {
    id: "LD-003",
    name: "Ishaan Verma",
    createdOn: "5 Apr 2023",
    stage: "First call",
    leadScore: 31,
    contact: "ishaan.verma@startup.io",
    source: "Offline referral",
    media: "",
    lastActivity: "1 month ago",
    notes: "Initial contact made",
    department: "Sales",
  },
  {
    id: "LD-004",
    name: "Vihaan Kapoor",
    createdOn: "19 Nov 2024",
    stage: "Closed",
    leadScore: 92,
    contact: "vihaan.kapoor@enterprise.com",
    source: "Web",
    media: "",
    lastActivity: "5 days ago",
    notes: "Deal closed successfully",
    department: "Sales",
  },
  {
    id: "LD-005",
    name: "Aarav Mehta",
    createdOn: "30 Jan 2026",
    stage: "Closed",
    leadScore: 31,
    contact: "aarav.mehta@corp.com",
    source: "Facebook ad",
    media: "",
    lastActivity: "3 weeks ago",
    notes: "Lost to competitor",
    department: "Marketing",
  },
];

// Helper components
const StageBadge = ({ stage }: { stage: Lead["stage"] }) => {
  const getStageColor = (stage: Lead["stage"]) => {
    const colors = {
      Badge: "bg-yellow-100 text-yellow-700 border-yellow-200",
      Contacted: "bg-yellow-100 text-yellow-700 border-yellow-200",
      "First call": "bg-yellow-100 text-yellow-700 border-yellow-200",
      Closed: "bg-green-100 text-green-700 border-green-200",
      Qualified: "bg-blue-100 text-blue-700 border-blue-200",
      Proposal: "bg-purple-100 text-purple-700 border-purple-200",
      "Demo Scheduled": "bg-indigo-100 text-indigo-700 border-indigo-200",
      New: "bg-gray-100 text-gray-700 border-gray-200",
    };
    return colors[stage] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium border ${getStageColor(
        stage
      )}`}
    >
      {stage}
      <ChevronDown className="ml-1 h-3 w-3" />
    </span>
  );
};

const ScoreBadge = ({ score }: { score: number }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-700 font-medium";
    if (score >= 60) return "bg-yellow-100 text-yellow-700 font-medium";
    return "bg-red-100 text-red-700 font-medium";
  };

  return (
    <span
      className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm ${getScoreColor(
        score
      )}`}
    >
      {score}
    </span>
  );
};

const ContactButtons = ({ lead }: { lead: Lead }) => (
  <div className="flex space-x-1">
    <Button variant="ghost" size="icon" className="h-8 w-8">
      <Phone className="h-4 w-4" />
    </Button>
    <Button variant="ghost" size="icon" className="h-8 w-8">
      <Mail className="h-4 w-4" />
    </Button>
    <Button variant="ghost" size="icon" className="h-8 w-8">
      <MessageCircle className="h-4 w-4" />
    </Button>
  </div>
);

// Column definitions
export const columns: ColumnDef<Lead>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 h-auto font-medium"
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("name")}</div>
    ),
  },
  {
    accessorKey: "createdOn",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 h-auto font-medium"
        >
          Created on
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="text-gray-600">{row.getValue("createdOn")}</div>
    ),
  },
  {
    accessorKey: "stage",
    header: "Stage",
    cell: ({ row }) => <StageBadge stage={row.getValue("stage")} />,
  },
  {
    accessorKey: "leadScore",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 h-auto font-medium"
        >
          Lead score
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <ScoreBadge score={row.getValue("leadScore")} />,
  },
  {
    accessorKey: "contact",
    header: "Contact",
    cell: ({ row }) => <ContactButtons lead={row.original} />,
  },
  {
    accessorKey: "source",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 h-auto font-medium"
        >
          Source
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div>{row.getValue("source")}</div>,
  },
  {
    accessorKey: "media",
    header: "Media",
    cell: ({ row }) => (
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <Paperclip className="h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "lastActivity",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 h-auto font-medium"
        >
          Last activity
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="text-gray-600">{row.getValue("lastActivity")}</div>
    ),
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const lead = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(lead.id)}
            >
              Copy lead ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View details</DropdownMenuItem>
            <DropdownMenuItem>Edit lead</DropdownMenuItem>
            <DropdownMenuItem>Assign to user</DropdownMenuItem>
            <DropdownMenuItem>Change stage</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Delete lead</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export function LeadDataTable() {
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
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
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

  return (
    <div className="w-full p-6">
      <div className="flex items-center py-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            className="pl-8"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
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
                    // className="capitalize"
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
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-muted-foreground flex-1 text-sm">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
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

export default LeadDataTable;
