"use client"

import * as React from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronLeft, ChevronRight, MoreHorizontal, Search } from "lucide-react"

interface DataTableProps<TData> {
    columns: {
        header: string;
        accessorKey: keyof TData;
        cell?: (row: TData) => React.ReactNode;
    }[];
    data: TData[];
    searchKey: keyof TData;
}

export function DataTable<TData>({
    columns,
    data,
    searchKey,
}: DataTableProps<TData>) {
    const [searchQuery, setSearchQuery] = React.useState("")
    const [currentPage, setCurrentPage] = React.useState(1)
    const itemsPerPage = 10

    const filteredData = data.filter((item) => {
        const value = String(item[searchKey] || "").toLowerCase()
        return value.includes(searchQuery.toLowerCase())
    })

    const totalPages = Math.ceil(filteredData.length / itemsPerPage)
    const paginatedData = filteredData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="relative w-72">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-brand-text-secondary" />
                    <label htmlFor={`search-${String(searchKey)}`} className="sr-only">
                        Filter by {String(searchKey)}
                    </label>
                    <Input
                        id={`search-${String(searchKey)}`}
                        name={`search-${String(searchKey)}`}
                        placeholder={`Filter by ${String(searchKey)}...`}
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value)
                            setCurrentPage(1)
                        }}
                        className="pl-9"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary">
                        Page {currentPage} of {totalPages || 1}
                    </span>
                    <div className="flex gap-1">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            <div className="rounded-md border border-brand-border dark:border-neutral-800 bg-white dark:bg-black overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-brand-background dark:bg-neutral-900 border-b border-brand-border dark:border-neutral-800">
                            {columns.map((col, i) => (
                                <TableHead key={i}>{col.header}</TableHead>
                            ))}

                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedData.length > 0 ? (
                            paginatedData.map((row, i) => (
                                <TableRow key={i} className="hover:bg-brand-background/50 dark:hover:bg-neutral-900/50">
                                    {columns.map((col, j) => (
                                        <TableCell key={j}>
                                            {col.cell ? col.cell(row) : String(row[col.accessorKey] || "N/A")}
                                        </TableCell>
                                    ))}

                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length + 1} className="h-24 text-center text-xs text-brand-text-secondary uppercase tracking-widest">
                                    No results found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
