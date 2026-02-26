import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:8000/api';

const ManageUrls = () => {
    const [states, setStates] = useState([]);
    const [selectedStates, setSelectedStates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        fetchStates();
    }, []);

    const fetchStates = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/targets/states`);
            if (response.ok) {
                const data = await response.json();
                setStates(data);
            }
        } catch (error) {
            console.error('Error fetching states:', error);
            setMessage({ text: 'Failed to load states.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const toggleState = (state) => {
        setSelectedStates(prev =>
            prev.includes(state)
                ? prev.filter(s => s !== state)
                : [...prev, state]
        );
    };

    const handleClearByState = async () => {
        if (selectedStates.length === 0) {
            setMessage({ text: 'Please select at least one state.', type: 'error' });
            return;
        }

        if (!window.confirm(`Are you sure you want to clear all URLs in: ${selectedStates.join(', ')}?`)) {
            return;
        }

        setActionLoading(true);
        try {
            const params = new URLSearchParams();
            selectedStates.forEach(s => params.append('states', s));

            const response = await fetch(`${API_BASE_URL}/targets?${params.toString()}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                const result = await response.json();
                setMessage({ text: result.message, type: 'success' });
                setSelectedStates([]);
                fetchStates(); // Refresh states list
            } else {
                setMessage({ text: 'Failed to delete records.', type: 'error' });
            }
        } catch (error) {
            console.error('Error deleting records:', error);
            setMessage({ text: 'An error occurred during deletion.', type: 'error' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleClearAll = async () => {
        if (!window.confirm('CRITICAL: Are you sure you want to clear ALL records entirely? This cannot be undone.')) {
            return;
        }

        setActionLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/targets`, {
                method: 'DELETE',
            });

            if (response.ok) {
                const result = await response.json();
                setMessage({ text: result.message, type: 'success' });
                setStates([]);
                setSelectedStates([]);
            } else {
                setMessage({ text: 'Failed to clear database.', type: 'error' });
            }
        } catch (error) {
            console.error('Error clearing database:', error);
            setMessage({ text: 'An error occurred while clearing the database.', type: 'error' });
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="p-12 pt-24 pb-32 text-[var(--text-secondary)] mx-auto max-w-[1400px] w-full min-h-screen">
            <div style={{ height: '100px' }}></div>
            <div className="mb-24 px-4">
                <h1 className="text-5xl font-extrabold text-white mb-6">Manage Tracking Data</h1>
                <p className="text-gray-400 text-xl font-light">Perform bulk administrative actions on your tracked URLs.</p>
            </div>
            <div style={{ height: '60px' }}></div>

            {message.text && (
                <div className={`p-4 mb-6 rounded-lg ${message.type === 'success' ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-red-900/30 text-red-400 border border-red-800'}`}>
                    {message.text}
                </div>
            )}

            <div className="flex flex-col gap-24">
                {/* Clear by State Section */}
                <div
                    className="bg-[#1e1e1e] border border-[#303030] rounded-2xl p-16 shadow-2xl max-w-4xl w-full mx-auto"
                    style={{ backgroundColor: '#1e1e1e', padding: '60px' }}
                >
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                        <span className="flex items-center justify-center w-10 h-10 bg-blue-500/10 rounded-lg text-blue-400">
                            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </span>
                        Clear URLs by State
                    </h2>

                    <p className="text-sm text-gray-400 mb-6">Select specific states to remove their associated property records from the database.</p>

                    {loading ? (
                        <div className="text-center py-8">Loading states...</div>
                    ) : states.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 italic border border-dashed border-[#404040] rounded-lg">No states found in database</div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 bg-[#121212] rounded-lg border border-[#303030]">
                                {states.map(state => (
                                    <label key={state} className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${selectedStates.includes(state) ? 'bg-blue-500/20 text-blue-300' : 'hover:bg-[#252525]'}`}>
                                        <input
                                            type="checkbox"
                                            className="form-checkbox bg-[#303030] border-[#404040] rounded text-blue-500"
                                            checked={selectedStates.includes(state)}
                                            onChange={() => toggleState(state)}
                                        />
                                        <span className="text-sm">{state}</span>
                                    </label>
                                ))}
                            </div>

                            <button
                                onClick={handleClearByState}
                                disabled={actionLoading || selectedStates.length === 0}
                                style={{
                                    width: '100%',
                                    padding: '20px',
                                    borderRadius: '12px',
                                    fontWeight: 'bold',
                                    backgroundColor: selectedStates.length === 0 || actionLoading ? '#303030' : '#2563eb',
                                    color: selectedStates.length === 0 || actionLoading ? '#606060' : 'white',
                                    marginTop: '20px',
                                    marginBottom: '40px',
                                    cursor: selectedStates.length === 0 || actionLoading ? 'not-allowed' : 'pointer',
                                    border: 'none',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {actionLoading ? 'Processing...' : `Clear all URLs in ${selectedStates.length > 0 ? selectedStates.join(', ') : '...'}`}
                            </button>
                        </div>
                    )}
                </div>

                <div style={{ height: '150px', width: '100%' }}></div>

                {/* Clear All Section */}
                <div
                    className="bg-[#1e1e1e] border border-[#303030] rounded-2xl p-16 shadow-2xl flex flex-col justify-between max-w-4xl w-full mx-auto"
                    style={{ backgroundColor: '#1e1e1e', padding: '60px' }}
                >
                    <div>
                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                            <span className="flex items-center justify-center w-10 h-10 bg-red-500/10 rounded-lg text-red-400">
                                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </span>
                            Danger Zone
                        </h2>
                        <p className="text-sm text-gray-400 mb-6">These actions are destructive and cannot be reversed. Use with extreme caution.</p>

                        <div className="p-4 bg-red-900/10 border border-red-800/30 rounded-lg mb-6">
                            <h3 className="text-red-400 font-bold text-sm mb-1 uppercase tracking-wider">Warning</h3>
                            <p className="text-xs text-red-300">Clearing all URLs will reset your database. You will need to re-import data to use the dashboard and grids again.</p>
                        </div>
                    </div>

                    <button
                        onClick={handleClearAll}
                        disabled={actionLoading}
                        style={{
                            width: '100%',
                            padding: '16px',
                            borderRadius: '12px',
                            fontWeight: 'bold',
                            backgroundColor: 'transparent',
                            color: actionLoading ? '#404040' : '#ef4444',
                            border: `2px solid ${actionLoading ? '#303030' : '#991b1b'}`,
                            marginTop: '20px',
                            cursor: actionLoading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        {actionLoading ? 'Processing...' : 'Clear All Records entirely'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManageUrls;
