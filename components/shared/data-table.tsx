"use client";

import { useState } from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronDown,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Settings2,
  Filter,
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  filterOptions?: {
    key: string;
    label: string;
    options: { value: string; label: string }[];
  }[];
  onRowClick?: (data: TData) => void;
  selectedActions?: React.ReactNode;
  emptyMessage?: string;
  emptyDescription?: string;
  toolbar?: React.ReactNode;
  initialColumnVisibility?: VisibilityState;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Search...",
  filterOptions = [],
  onRowClick,
  selectedActions,
  emptyMessage = "No matching results found.",
  emptyDescription,
  toolbar,
  initialColumnVisibility = {},
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(initialColumnVisibility);
  const [rowSelection, setRowSelection] = useState({});

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

  const getSafeColumn = (columnId: string) => {
    return table.getAllColumns().find((col) => col.id === columnId);
  };

  const hasActiveFilters = columnFilters.length > 0;
  const selectedRows = table.getFilteredSelectedRowModel().rows;

  return (
    <div className="space-y-4 w-full max-w-full">
      {toolbar ? (
        toolbar
      ) : (
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border shadow-sm">
          <div className="flex flex-1 flex-wrap items-center gap-2 w-full">
            {searchKey && (
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={
                    (getSafeColumn(searchKey)?.getFilterValue() as string) ??
                    ""
                  }
                  onChange={(event) =>
                    getSafeColumn(searchKey)
                      ?.setFilterValue(event.target.value)
                  }
                  className="pl-9 h-10 bg-muted/20 border-muted-foreground/20 focus-visible:ring-primary/20"
                />
              </div>
            )}
            <div className="flex items-center gap-2 ml-auto">
              {filterOptions.length > 0 && (
                <span className="text-sm text-muted-foreground whitespace-nowrap hidden md:inline-block">
                  Filter by:
                </span>
              )}
              {filterOptions.map((filter) => (
                <Select
                  key={filter.key}
                  value={
                    (getSafeColumn(filter.key)?.getFilterValue() as string) ??
                    ""
                  }
                  onValueChange={(value) =>
                    getSafeColumn(filter.key)
                      ?.setFilterValue(value === "all" ? "" : value)
                  }
                >
                  <SelectTrigger className="w-[160px] h-10 bg-muted/20 border-muted-foreground/20">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      <SelectValue placeholder={filter.label} />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All {filter.label}</SelectItem>
                    {filter.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ))}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setColumnFilters([])}
                  className="h-10 px-2 lg:px-3 text-muted-foreground hover:text-foreground"
                >
                  <X className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedRows.length > 0 && selectedActions && (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-1">
                {selectedActions}
                <Separator orientation="vertical" className="h-6 mx-1" />
              </div>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 border-muted-foreground/20 ml-auto"
                >
                  <Settings2 className="mr-2 h-4 w-4 text-muted-foreground" />
                  View{" "}
                  <ChevronDown className="ml-1 h-3 w-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[180px]">
                <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
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
                        {column.id.replace(/_/g, " ")}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden w-full max-w-full">
        <div className="relative w-full overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50 border-b">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        className="h-11 font-semibold text-foreground whitespace-nowrap"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
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
                    onClick={() => onRowClick?.(row.original)}
                    className={cn(
                      "transition-colors hover:bg-muted/30 data-[state=selected]:bg-primary/[0.04]",
                      "border-b last:border-0",
                      onRowClick && "cursor-pointer",
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="py-3 px-4 align-middle"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-32 text-center"
                  >
                    <div className="flex flex-col items-center justify-center space-y-1">
                      <p className="text-sm font-medium text-foreground">
                        {emptyMessage}
                      </p>
                      {emptyDescription && (
                        <p className="text-xs text-muted-foreground">
                          {emptyDescription}
                        </p>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <Separator className="bg-border/60" />

        {/* ── Pagination Footer ───────────────────────────────────────────────── */}
        {(() => {
          const pageIndex = table.getState().pagination.pageIndex;
          const pageSize  = table.getState().pagination.pageSize;
          const pageCount = table.getPageCount();
          const totalRows = table.getFilteredRowModel().rows.length;
          const from      = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
          const to        = Math.min((pageIndex + 1) * pageSize, totalRows);
          const current   = pageIndex + 1;

          // Build smart page window with ellipsis
          const buildPages = (): (number | "…")[] => {
            if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
            const pages: (number | "…")[] = [1];
            const left  = Math.max(2, current - 1);
            const right = Math.min(pageCount - 1, current + 1);
            if (left > 2) pages.push("…");
            for (let p = left; p <= right; p++) pages.push(p);
            if (right < pageCount - 1) pages.push("…");
            pages.push(pageCount);
            return pages;
          };
          const pages = buildPages();

          return (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-6 py-4 bg-muted/5">
              {/* Results summary */}
              <p className="text-xs text-muted-foreground shrink-0">
                {totalRows === 0 ? (
                  "No results"
                ) : (
                  <>
                    Showing{" "}
                    <span className="font-semibold text-foreground">{from}</span>
                    {" "}–{" "}
                    <span className="font-semibold text-foreground">{to}</span>
                    {" "}of{" "}
                    <span className="font-semibold text-foreground">{totalRows}</span>
                    {" "}results
                  </>
                )}
              </p>

              <div className="flex items-center gap-4 ml-auto flex-wrap">
                {/* Rows per page */}
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground whitespace-nowrap">Rows per page</p>
                  <Select
                    value={`${pageSize}`}
                    onValueChange={(v) => { table.setPageSize(Number(v)); }}
                  >
                    <SelectTrigger className="h-8 w-[64px] text-xs border-muted-foreground/20 bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="end">
                      {[10, 20, 30, 50].map((s) => (
                        <SelectItem key={s} value={`${s}`} className="text-xs">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Page navigation — always visible */}
                <div className="flex items-center gap-1">
                  {/* First page */}
                  <Button
                    variant="outline"
                    size="icon"
                    className="hidden lg:flex h-8 w-8 border-muted-foreground/20 text-muted-foreground hover:text-foreground"
                    onClick={() => table.setPageIndex(0)}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <span className="sr-only">First page</span>
                    <ChevronsLeft className="h-3.5 w-3.5" />
                  </Button>

                  {/* Prev */}
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 border-muted-foreground/20 text-muted-foreground hover:text-foreground"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <span className="sr-only">Previous page</span>
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>

                  {/* Numbered pages */}
                  {pages.map((page, idx) =>
                    page === "…" ? (
                      <span
                        key={`ellipsis-${idx}`}
                        className="flex h-8 w-8 items-center justify-center text-xs text-muted-foreground select-none"
                      >
                        …
                      </span>
                    ) : (
                      <Button
                        key={page}
                        size="sm"
                        variant={current === page ? "default" : "ghost"}
                        className={cn(
                          "h-8 w-8 p-0 text-xs font-medium transition-all",
                          current === page
                            ? "shadow-sm"
                            : "text-muted-foreground hover:text-foreground border border-transparent hover:border-muted-foreground/20",
                        )}
                        onClick={() => table.setPageIndex((page as number) - 1)}
                      >
                        {page}
                      </Button>
                    )
                  )}

                  {/* Next */}
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 border-muted-foreground/20 text-muted-foreground hover:text-foreground"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    <span className="sr-only">Next page</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>

                  {/* Last page */}
                  <Button
                    variant="outline"
                    size="icon"
                    className="hidden lg:flex h-8 w-8 border-muted-foreground/20 text-muted-foreground hover:text-foreground"
                    onClick={() => table.setPageIndex(pageCount - 1)}
                    disabled={!table.getCanNextPage()}
                  >
                    <span className="sr-only">Last page</span>
                    <ChevronsRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
