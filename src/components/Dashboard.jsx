import React, { useState, useEffect } from 'react';
import { fetchStats, triggerCheckAll } from '../api/client';
import { Box, Activity, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

export default function Dashboard() {
    const [stats, setStats] = useState({ total_tracked: 0, changed_last_24h: 0, reviewed_last_24h: 0, error_count: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [isScanning, setIsScanning] = useState(false);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        setIsLoading(true);
        try {
            const data = await fetchStats();
            setStats(data);
        } catch (err) {
            console.error("Failed to load stats", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleScan = async () => {
        setIsScanning(true);
        try {
            await triggerCheckAll();
            await loadStats();
        } catch (err) {
            console.error("Scan failed", err);
            alert("Scan failed: " + err.message);
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div className="flex flex-col flex-1 gap-12 min-h-0 mx-auto w-full max-w-[1600px] mt-8 overflow-y-auto pb-20">
            <div className="px-4">
                <h1 className="text-4xl font-bold text-[var(--accent-color)] tracking-tight">Dashboard Overview</h1>
            </div>

            <div className="glass-panel stats-panel animate-fade-in w-full">
                <div className="stat-card">
                    <div className="stat-title">Tracked URLs</div>
                    <div className="stat-value">
                        <Box className="text-[var(--accent-color)]" size={28} />
                        {isLoading ? "-" : stats.total_tracked.toLocaleString()}
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-title">Changed (24h)</div>
                    <div className="stat-value">
                        <Activity className="text-[var(--success-color)]" size={28} />
                        {isLoading ? "-" : stats.changed_last_24h.toLocaleString()}
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-title">Reviewed (24h)</div>
                    <div className="stat-value">
                        <CheckCircle className="text-[var(--success-color)]" size={28} />
                        {isLoading ? "-" : stats.reviewed_last_24h.toLocaleString()}
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-title">Errors</div>
                    <div className="stat-value">
                        <AlertTriangle className="text-[var(--error-color)]" size={28} />
                        {isLoading ? "-" : stats.error_count.toLocaleString()}
                    </div>
                </div>
            </div>

            <div className="w-full flex justify-center py-12">
                <button
                    onClick={handleScan}
                    disabled={isScanning}
                    className={`btn flex items-center gap-3 px-12 py-5 rounded-xl font-bold text-xl tracking-tight transition-all shadow-2xl ${isScanning
                            ? 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50'
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/40 hover:scale-[1.05] active:scale-95 border-none'
                        }`}
                >
                    <RefreshCw size={24} className={isScanning ? 'animate-spin' : ''} />
                    {isScanning ? 'Scanning URLs...' : 'Scan All URLs Now'}
                </button>
            </div>
        </div>
    );
}
