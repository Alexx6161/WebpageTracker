import React, { useState, useEffect, useCallback } from 'react';
import { TargetGrid } from './TargetGrid';
import { fetchTargets } from '../api/client';
import { Search, Filter, Activity, AlertTriangle, PauseCircle, Box } from 'lucide-react';

export default function ReviewChanges() {
    const [data, setData] = useState([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const [isLoading, setIsLoading] = useState(true);

    // Filters and Sorting
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [sorting, setSorting] = useState([]);

    // Fetch Logic
    const loadData = useCallback(async () => {
        try {
            setIsLoading(true);

            const sortBy = sorting.length > 0 ? sorting[0].id : '';
            const sortDesc = sorting.length > 0 ? sorting[0].desc : false;
            const statuses = statusFilter ? [statusFilter] : [];

            const res = await fetchTargets({
                page,
                size: pageSize,
                search: debouncedSearch,
                statuses,
                sortBy,
                sortDesc
            });

            setTotal(res.total);
            setTotalPages(res.pages || Math.ceil(res.total / pageSize));
            setData(res.items);
        } catch (err) {
            console.error("Error fetching data:", err);
        } finally {
            setIsLoading(false);
        }
    }, [page, pageSize, debouncedSearch, statusFilter, sorting]);

    // Initial load & Filter changes
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, statusFilter, sorting, pageSize]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    // Handle Reviewed Toggle Update
    const handleToggleReviewed = async (id, newReviewedState) => {
        try {
            // Optimistic update
            setData((prev) => prev.map(t => t.id === id ? { ...t, reviewed: newReviewedState } : t));
            const { updateTarget } = await import('../api/client');
            await updateTarget(id, { reviewed: newReviewedState });
        } catch (err) {
            console.error("Error updating review status:", err);
            // Revert optimistic update
            setData((prev) => prev.map(t => t.id === id ? { ...t, reviewed: !newReviewedState } : t));
        }
    };

    return (
        <div className="flex flex-col flex-1 gap-6 min-h-0">

            {/* Top Banner / Stats */}
            <div className="glass-panel stats-panel animate-fade-in mx-auto w-full max-w-[1600px]" style={{ flexShrink: 0 }}>
                <div className="stat-card">
                    <div className="stat-title">Total URLs</div>
                    <div className="stat-value"><Box className="text-[var(--accent-color)]" size={28} /> {total.toLocaleString()}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-title">Active Monitoring</div>
                    <div className="stat-value"><Activity className="text-[var(--success-color)]" size={28} /> -</div>
                </div>
                <div className="stat-card">
                    <div className="stat-title">Paused</div>
                    <div className="stat-value"><PauseCircle className="text-[var(--warning-color)]" size={28} /> -</div>
                </div>
                <div className="stat-card">
                    <div className="stat-title">Errors</div>
                    <div className="stat-value"><AlertTriangle className="text-[var(--error-color)]" size={28} /> -</div>
                </div>
            </div>

            {/* Main Grid Area */}
            <div className="flex bg-[var(--bg-color)] flex-col flex-1 min-h-0 mx-auto w-full max-w-[1600px]" style={{ overflow: 'hidden' }}>

                {/* Controls */}
                <div className="flex items-center justify-between mb-4 glass-panel p-4" style={{ flexShrink: 0, display: 'flex', gap: '16px' }}>
                    <div className="flex items-center gap-2" flex="1">
                        <div className="relative" style={{ position: 'relative' }}>
                            <Search className="absolute left-3 top-2.5 text-[var(--text-secondary)]" size={16} style={{ position: 'absolute', left: '12px', top: '10px' }} />
                            <input
                                type="text"
                                placeholder="Search URL, PID, Listing ID..."
                                className="input-field pl-10 w-[300px]"
                                style={{ paddingLeft: '36px', width: '300px' }}
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                            <Filter size={16} className="text-[var(--text-secondary)]" />
                            <select
                                className="input-field"
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                            >
                                <option value="">All Statuses</option>
                                <option value="active">Active</option>
                                <option value="paused">Paused</option>
                                <option value="error">Error</option>
                            </select>
                        </div>
                    </div>

                </div>

                {/* Pagination Controls */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                        Rows per page:
                        <select
                            className="input-field py-1"
                            value={pageSize}
                            onChange={e => setPageSize(Number(e.target.value))}
                        >
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                            <option value={500}>500</option>
                        </select>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center bg-[var(--bg-panel)] rounded-md border border-[var(--border-color)] overflow-hidden">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-1 px-2 text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.05)] disabled:opacity-30 transition-colors border-r border-[var(--border-color)]"
                                title="Previous Page"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                className="p-1 px-2 text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.05)] disabled:opacity-30 transition-colors"
                                title="Next Page"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                            </button>
                        </div>
                        <div className="text-xs font-medium text-[var(--text-secondary)]">
                            <span className="text-[var(--text-primary)]">Page {page}</span> of {totalPages}
                        </div>
                    </div>
                </div>
            </div>

            {/* The Grid Component */}
            <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
                <TargetGrid
                    data={data}
                    total={total}
                    isLoading={isLoading}
                    sorting={sorting}
                    onSortingChange={setSorting}
                    onToggleReviewed={handleToggleReviewed}
                />
            </div>
        </div>
    );
}
