import React, { useState, useEffect, useRef, useCallback } from 'react';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ArrowDown, ArrowUp, ArrowUpDown, Clock, Settings, AlertCircle, PlayCircle, PauseCircle, Tag, Download, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../utils';

export function TargetGrid({
    data,
    total,
    isLoading,
    sorting,
    onSortingChange,
    onToggleReviewed
}) {
    const tableContainerRef = useRef(null);

    const columns = React.useMemo(() => [
        {
            id: 'selection',
            header: ({ table }) => (
                <input
                    type="checkbox"
                    checked={table.getIsAllRowsSelected()}
                    onChange={table.getToggleAllRowsSelectedHandler()}
                    className="cursor-pointer"
                />
            ),
            cell: ({ row }) => (
                <input
                    type="checkbox"
                    checked={row.getIsSelected()}
                    onChange={row.getToggleSelectedHandler()}
                    className="cursor-pointer"
                />
            ),
            size: 50,
        },
        {
            accessorKey: 'reviewed',
            header: 'Reviewed',
            size: 90,
            enableSorting: true,
            cell: ({ row, getValue }) => {
                const isReviewed = getValue();
                return (
                    <button
                        onClick={() => onToggleReviewed(row.original.id, !isReviewed)}
                        className="flex items-center justify-center transition-colors drop-shadow-sm hover:opacity-80 p-0.5 min-w-[32px] min-h-[32px]"
                        style={{ color: isReviewed ? 'var(--success-color)' : 'var(--error-color)' }}
                        title={isReviewed ? "Mark as unreviewed" : "Mark as reviewed"}
                    >
                        {isReviewed ? (
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                            </svg>
                        ) : (
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <rect width="18" height="18" x="3" y="3" rx="4" />
                            </svg>
                        )}
                    </button>
                );
            }
        },
        {
            accessorKey: 'state',
            header: 'State',
            size: 100,
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ getValue }) => {
                const status = getValue();
                let badgeClass = 'badge-active';
                if (status === 'paused') badgeClass = 'badge-paused';
                if (status === 'error') badgeClass = 'badge-error';
                return <span className={cn('badge uppercase', badgeClass)}>{status}</span>;
            },
            size: 100,
        },
        {
            accessorKey: 'listing_id',
            header: 'Listing ID',
            size: 120,
        },
        {
            accessorKey: 'pid',
            header: 'PID',
            size: 100,
        },
        {
            accessorKey: 'suite_id',
            header: 'SuiteID',
            size: 100,
        },
        {
            accessorKey: 'assigned_to',
            header: 'Assigned To',
            size: 150,
        },
        {
            accessorKey: 'change_count_total',
            header: 'Changes',
            size: 90,
            cell: ({ getValue }) => <div className="text-right font-mono">{getValue()}</div>
        },
        {
            accessorKey: 'last_reviewed_at',
            header: 'Last Reviewed',
            size: 160,
            cell: ({ getValue }) => {
                const val = getValue();
                return val ? <span className="text-sm text-[var(--text-secondary)] flex items-center gap-2"><Clock size={14} /> {format(new Date(val), 'MMM d, HH:mm')}</span> : '-';
            }
        },
        {
            accessorKey: 'url',
            header: 'URL',
            size: 400,
            cell: ({ getValue }) => (
                <a href={getValue()} target="_blank" rel="noopener noreferrer" className="hover:underline truncate block" style={{ color: '#ffffff' }}>
                    {getValue()}
                </a>
            )
        },
    ], []);

    const table = useReactTable({
        data,
        columns,
        state: { sorting },
        onSortingChange,
        getCoreRowModel: getCoreRowModel(),
        manualSorting: true,
    });

    const { rows } = table.getRowModel();

    const rowVirtualizer = useVirtualizer({
        count: data.length, // Only virtualize current page
        getScrollElement: () => tableContainerRef.current,
        estimateSize: () => 48, // row height
        overscan: 10,
    });

    const virtualItems = rowVirtualizer.getVirtualItems();

    return (
        <div className="grid-container animate-fade-in glass-panel h-full" style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Grid Container */}
            <div
                ref={tableContainerRef}
                className="grid-table-wrapper"
                style={{ flex: 1, position: 'relative' }}
            >
                <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>

                    {/* Header (sticky) */}
                    <div className="glass-header" style={{ display: 'flex', width: '100%', position: 'sticky', top: 0 }}>
                        {table.getHeaderGroups().map(headerGroup => (
                            <div key={headerGroup.id} className="grid-row" style={{ width: '100%', borderBottom: '1px solid var(--border-color)' }}>
                                {headerGroup.headers.map(header => (
                                    <div
                                        key={header.id}
                                        className="grid-cell grid-head-cell"
                                        style={{ width: header.getSize(), flexShrink: 0, gap: '8px' }}
                                        onClick={header.column.getToggleSortingHandler()}
                                    >
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                        {header.column.getIsSorted() ? (
                                            header.column.getIsSorted() === 'desc' ? <ArrowDown size={14} /> : <ArrowUp size={14} />
                                        ) : (
                                            header.column.getCanSort() && <ArrowUpDown size={14} className="opacity-30" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>

                    {/* Virtualized Rows */}
                    {virtualItems.map(virtualRow => {
                        const row = rows[virtualRow.index];
                        if (!row) return null; // Fallback during fetches

                        return (
                            <div
                                key={row.id}
                                className="grid-row"
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: `${virtualRow.size}px`,
                                    transform: `translateY(${virtualRow.start}px)`,
                                }}
                            >
                                {row.getVisibleCells().map(cell => (
                                    <div
                                        key={cell.id}
                                        className="grid-cell"
                                        style={{ width: cell.column.getSize(), flexShrink: 0 }}
                                    >
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </div>
                                ))}
                            </div>
                        );
                    })}

                    {isLoading && (
                        <div className="flex items-center justify-center p-8 text-[var(--text-secondary)]">
                            Loading records...
                        </div>
                    )}
                </div>
            </div>

            {/* Footer controls for selection */}
            {table.getSelectedRowModel().rows.length > 0 && (
                <div className="p-4 border-t border-[var(--border-color)] bg-[rgba(13,17,23,0.9)] flex items-center justify-between" style={{ position: 'sticky', bottom: 0, zIndex: 10 }}>
                    <div className="text-sm">
                        <span className="font-bold text-[var(--accent-color)]">{table.getSelectedRowModel().rows.length}</span> rows selected
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="btn btn-secondary border border-transparent hover:border-[var(--border-color)]">
                            <PlayCircle size={16} /> Start
                        </button>
                        <button className="btn btn-secondary border border-transparent hover:border-[var(--border-color)]">
                            <PauseCircle size={16} /> Pause
                        </button>
                        <div className="w-[1px] h-6 bg-[var(--border-color)] mx-2"></div>
                        <button className="btn btn-secondary border border-transparent hover:border-[var(--border-color)]">
                            <Download size={16} /> Export
                        </button>
                        <button className="btn btn-secondary text-[var(--error-color)] hover:bg-[rgba(218,54,51,0.1)] border border-transparent">
                            <Trash2 size={16} /> Delete
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
