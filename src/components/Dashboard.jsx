import React, { useState, useEffect } from 'react';
import { fetchStats, triggerCheckAll, fetchStates } from '../api/client';
import { Box, Activity, CheckCircle, AlertTriangle, RefreshCw, MapPin } from 'lucide-react';

export default function Dashboard() {
    const [stats, setStats] = useState({ total_tracked: 0, changed_last_24h: 0, reviewed_last_24h: 0, error_count: 0 });
    const [availableStates, setAvailableStates] = useState([]);
    const [selectedState, setSelectedState] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isScanning, setIsScanning] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [statsData, statesData] = await Promise.all([
                fetchStats(),
                fetchStates()
            ]);
            setStats(statsData);
            setAvailableStates(statesData);
        } catch (err) {
            console.error("Failed to load dashboard data", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleScan = async () => {
        setIsScanning(true);
        try {
            await triggerCheckAll(selectedState || null);
            // Reload stats after scan
            const statsData = await fetchStats();
            setStats(statsData);
        } catch (err) {
            console.error("Scan failed", err);
            alert("Scan failed: " + err.message);
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '48px', width: '100%', maxWidth: '1400px', margin: '32px auto 0', paddingBottom: '80px' }}>
            {/* Header */}
            <header style={{ width: '100%', textAlign: 'center' }}>
                <h1 style={{ fontSize: '2.25rem', fontWeight: 700, color: 'var(--accent-color)', letterSpacing: '-0.025em' }}>Dashboard Overview</h1>
            </header>

            {/* Stats Panel */}
            <section className="glass-panel stats-panel animate-fade-in" style={{ width: '100%', maxWidth: '1000px' }}>
                <div className="stat-card">
                    <div className="stat-title">Tracked URLs</div>
                    <div className="stat-value">
                        <Box style={{ color: 'var(--accent-color)' }} size={28} />
                        {isLoading ? "-" : stats.total_tracked.toLocaleString()}
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-title">Changed (24h)</div>
                    <div className="stat-value">
                        <Activity style={{ color: 'var(--success-color)' }} size={28} />
                        {isLoading ? "-" : stats.changed_last_24h.toLocaleString()}
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-title">Reviewed (24h)</div>
                    <div className="stat-value">
                        <CheckCircle style={{ color: 'var(--success-color)' }} size={28} />
                        {isLoading ? "-" : stats.reviewed_last_24h.toLocaleString()}
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-title">Errors</div>
                    <div className="stat-value">
                        <AlertTriangle style={{ color: 'var(--error-color)' }} size={28} />
                        {isLoading ? "-" : stats.error_count.toLocaleString()}
                    </div>
                </div>
            </section>

            {/* Scan Controls */}
            <section className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px', width: '100%', maxWidth: '500px', padding: '32px 0' }}>
                {/* State Selector */}
                <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '24px', borderRadius: '16px', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        <MapPin size={22} style={{ color: 'var(--accent-color)' }} />
                        <span>Target Region</span>
                    </div>
                    <select
                        value={selectedState}
                        onChange={(e) => setSelectedState(e.target.value)}
                        disabled={isScanning}
                        style={{
                            backgroundColor: 'var(--bg-color)',
                            color: 'var(--text-primary)',
                            border: '2px solid var(--border-color)',
                            borderRadius: '12px',
                            padding: '12px 24px',
                            outline: 'none',
                            width: '100%',
                            textAlign: 'center',
                            cursor: 'pointer',
                            fontSize: '18px',
                            fontWeight: 600,
                            appearance: 'none',
                            WebkitAppearance: 'none',
                            backgroundImage: "url(\"data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%238b949e%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E\")",
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 16px center',
                        }}
                    >
                        <option value="">Global (All States)</option>
                        {availableStates.map(state => (
                            <option key={state} value={state}>{state}</option>
                        ))}
                    </select>
                </div>

                {/* Scan Button */}
                <button
                    onClick={handleScan}
                    disabled={isScanning}
                    className="btn"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '20px 48px',
                        borderRadius: '16px',
                        fontWeight: 800,
                        fontSize: '1.5rem',
                        letterSpacing: '-0.02em',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 20px 50px rgba(37, 99, 235, 0.35)',
                        backgroundColor: isScanning ? '#1f2937' : '#2563eb',
                        color: isScanning ? '#6b7280' : '#ffffff',
                        cursor: isScanning ? 'not-allowed' : 'pointer',
                        opacity: isScanning ? 0.5 : 1,
                        border: 'none',
                    }}
                >
                    <RefreshCw size={28} className={isScanning ? 'animate-spin' : ''} />
                    {isScanning ? 'Scanning...' : `Scan ${selectedState || 'All'}`}
                </button>
            </section>
        </div>
    );
}
