import React, { useState, useCallback } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle, AlertTriangle, FileUp } from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { importTargets } from '../api/client';

export default function AddUrls() {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);
    const [error, setError] = useState(null);
    const [manualRows, setManualRows] = useState([
        { state: '', listing_id: '', pid: '', suite_id: '', assigned_to: '', url: '' }
    ]);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleManualChange = (index, field, value) => {
        setManualRows(prev =>
            prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
        );
    };

    const addManualRow = () => {
        setManualRows(prev => [
            ...prev,
            { state: '', listing_id: '', pid: '', suite_id: '', assigned_to: '', url: '' }
        ]);
    };

    const removeManualRow = (index) => {
        setManualRows(prev => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
    };

    const processData = async (data) => {
        setIsUploading(true);
        setError(null);
        setUploadResult(null);

        try {
            // Validate headers roughly
            const firstRow = data[0] || {};
            const keys = Object.keys(firstRow).map(k => k.toLowerCase().trim());

            const requiredColumns = ['state', 'listing_id', 'pid', 'suite_id', 'assigned_to', 'url'];
            const missing = requiredColumns.filter(col => !keys.includes(col));

            if (missing.length > 0) {
                throw new Error(`Missing required columns: ${missing.join(', ')}`);
            }

            // Map data to expected schema
            const payload = data.map(row => {
                const normalizedRow = {};
                for (const [key, value] of Object.entries(row)) {
                    normalizedRow[key.toLowerCase().trim()] = value;
                }
                return {
                    state: String(normalizedRow.state || ""),
                    listing_id: String(normalizedRow.listing_id || ""),
                    pid: String(normalizedRow.pid || ""),
                    suite_id: String(normalizedRow.suite_id || ""),
                    assigned_to: String(normalizedRow.assigned_to || ""),
                    url: String(normalizedRow.url || "")
                };
            }).filter(item => item.url && item.listing_id); // Basic filter

            if (payload.length === 0) {
                throw new Error("No valid rows found to import.");
            }

            const result = await importTargets(payload, { status: 'active', change_count_total: 0, error_count: 0 });
            setUploadResult({ imported: result.imported, errors: result.errors, total: payload.length });
        } catch (err) {
            setError(err.message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleFile = (file) => {
        if (!file) return;

        const isCSV = file.name.endsWith('.csv');
        const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

        if (!isCSV && !isExcel) {
            setError("Please upload a .csv, .xls, or .xlsx file.");
            return;
        }

        if (isCSV) {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    processData(results.data);
                },
                error: (err) => {
                    setError(`CSV Parsing error: ${err.message}`);
                }
            });
        } else {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = e.target.result;
                    const workbook = XLSX.read(data, { type: 'binary' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const json = XLSX.utils.sheet_to_json(worksheet);
                    processData(json);
                } catch (err) {
                    setError(`Excel Parsing error: ${err.message}`);
                }
            };
            reader.readAsBinaryString(file);
        }
    };

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleFile(files[0]);
        }
    }, []);

    const handleFileInput = (e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFile(files[0]);
        }
    };

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        const nonEmptyRows = manualRows.filter(row =>
            Object.values(row).some(val => String(val || '').trim() !== '')
        );
        await processData(nonEmptyRows);
    };

    return (
        <div className="flex flex-col flex-1 gap-10 min-h-0 mx-auto w-full max-w-[1200px] mt-8 animate-fade-in overflow-y-auto pb-12 items-center">

            <div className="flex flex-col items-center text-center">
                <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-3 tracking-tight">Add Tracking URLs</h1>
                <p className="text-[var(--text-secondary)] text-lg max-w-2xl">Upload a CSV or Excel file to batch import properties for monitoring.</p>
            </div>

            {/* Upload Zone */}
            <div
                className={`flex flex-col items-center justify-center p-16 border-2 border-dashed rounded-2xl transition-all duration-300 cursor-pointer text-center relative overflow-hidden w-full max-w-3xl ${isDragging
                    ? 'border-[var(--accent-color)] bg-[rgba(59,130,246,0.08)] scale-[1.01]'
                    : 'border-[var(--border-color)] bg-[var(--bg-panel)] hover:border-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.03)]'
                    }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={handleFileInput}
                    disabled={isUploading}
                />

                <div className="flex justify-center mb-6">
                    <div className="p-5 bg-[rgba(255,255,255,0.05)] rounded-full shadow-inner">
                        <UploadCloud size={64} className={isDragging ? 'text-[var(--accent-color)]' : 'text-[var(--text-secondary)]'} />
                    </div>
                </div>
                <h3 className="text-2xl font-semibold text-[var(--text-primary)] mb-3">Drag and drop your file here</h3>
                <p className="text-[var(--text-tertiary)] text-lg mb-8">Supports .csv, .xls, and .xlsx files</p>
                <div className="flex gap-4">
                    <span className="btn btn-secondary px-8 py-3 z-20 relative pointer-events-none font-bold">Browse Files</span>
                </div>
            </div>

            {/* Status Messages */}
            {isUploading && (
                <div className="glass-panel p-6 flex items-center justify-center gap-4 text-[var(--text-secondary)] w-full max-w-3xl animate-pulse">
                    <div className="w-6 h-6 border-2 border-[var(--accent-color)] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-lg">Parsing and importing URLs...</span>
                </div>
            )}

            {error && (
                <div className="glass-panel p-6 bg-[rgba(218,54,51,0.08)] border-[var(--error-color)] flex items-start gap-4 text-[var(--error-color)] w-full max-w-3xl">
                    <AlertTriangle className="shrink-0 mt-1" size={24} />
                    <div>
                        <div className="font-bold text-lg">Upload Failed</div>
                        <div className="opacity-90">{error}</div>
                    </div>
                </div>
            )}

            {uploadResult && (
                <div className="glass-panel p-6 bg-[rgba(46,160,67,0.08)] border-[var(--success-color)] flex items-start gap-4 text-[var(--success-color)] w-full max-w-3xl">
                    <CheckCircle className="shrink-0 mt-1" size={24} />
                    <div>
                        <div className="font-bold text-lg">Import Successful</div>
                        <div className="opacity-90">
                            Successfully imported {uploadResult.imported} records. ({uploadResult.errors} errors skipped).
                        </div>
                    </div>
                </div>
            )}

            {/* Visual Guide */}
            <div className="mt-12 flex flex-col items-center text-center w-full max-w-5xl">
                <h2 className="text-2xl font-bold flex items-center gap-3 text-[var(--text-primary)] mb-4">
                    <FileSpreadsheet size={28} className="text-[var(--accent-color)]" /> Required Column Format
                </h2>
                <p className="text-[var(--text-secondary)] text-lg mb-6 max-w-3xl">
                    Your spreadsheet must contain the following exact column headers to be processed correctly. Additional columns will be ignored.
                </p>

                {/* CSS Mock Spreadsheet */}
                <div className="rounded-lg border border-[var(--border-color)] overflow-hidden shadow-xl bg-[var(--bg-color)]" style={{ minWidth: '800px' }}>
                    {/* Fake Spreadsheet Header */}
                    <div className="bg-[#1e1e1e] flex items-center p-2 border-b border-[var(--border-color)]" style={{ display: 'flex', alignItems: 'center' }}>
                        <div className="flex gap-1.5 ml-2" style={{ display: 'flex', gap: '6px' }}>
                            <div className="w-3 h-3 rounded-full bg-[#ff5f56]" style={{ width: '12px', height: '12px' }}></div>
                            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" style={{ width: '12px', height: '12px' }}></div>
                            <div className="w-3 h-3 rounded-full bg-[#27c93f]" style={{ width: '12px', height: '12px' }}></div>
                        </div>
                        <div className="mx-auto flex items-center gap-2 text-xs text-gray-400 bg-black/40 px-4 py-1 rounded-md" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FileUp size={12} /> import_targets_template.xlsx
                        </div>
                    </div>

                    {/* Data Grid with explicit flexbox for absolute alignment */}
                    <div style={{ width: '100%', fontSize: '0.875rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                        <div style={{ minWidth: '950px' }}>
                            {/* Headers Row (A, B, C...) */}
                            <div style={{ display: 'flex', backgroundColor: '#2d2d2d', borderBottom: '1px solid #404040', fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af' }}>
                                <div style={{ width: '40px', borderRight: '1px solid #404040', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', backgroundColor: '#1e1e1e', flexShrink: 0 }}></div>
                                <div style={{ width: '60px', borderRight: '1px solid #404040', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', flexShrink: 0 }}>A</div>
                                <div style={{ width: '120px', borderRight: '1px solid #404040', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', flexShrink: 0 }}>B</div>
                                <div style={{ width: '100px', borderRight: '1px solid #404040', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', flexShrink: 0 }}>C</div>
                                <div style={{ width: '100px', borderRight: '1px solid #404040', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', flexShrink: 0 }}>D</div>
                                <div style={{ width: '130px', borderRight: '1px solid #404040', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', flexShrink: 0 }}>E</div>
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem' }}>F</div>
                            </div>

                            {/* Field Names Row (state, listing_id...) */}
                            <div style={{ display: 'flex', backgroundColor: '#1e1e1e', borderBottom: '1px solid #404040', fontFamily: 'monospace', fontSize: '0.875rem', color: 'var(--accent-color)', fontWeight: 'bold' }}>
                                <div style={{ width: '40px', borderRight: '1px solid #404040', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', color: '#6b7280', fontWeight: 'normal', flexShrink: 0 }}>1</div>
                                <div style={{ width: '60px', borderRight: '1px solid #404040', padding: '0.5rem', backgroundColor: '#2a2a2a', flexShrink: 0 }}>state</div>
                                <div style={{ width: '120px', borderRight: '1px solid #404040', padding: '0.5rem', backgroundColor: '#2a2a2a', flexShrink: 0 }}>listing_id</div>
                                <div style={{ width: '100px', borderRight: '1px solid #404040', padding: '0.5rem', backgroundColor: '#2a2a2a', flexShrink: 0 }}>pid</div>
                                <div style={{ width: '100px', borderRight: '1px solid #404040', padding: '0.5rem', backgroundColor: '#2a2a2a', flexShrink: 0 }}>suite_id</div>
                                <div style={{ width: '130px', borderRight: '1px solid #404040', padding: '0.5rem', backgroundColor: '#2a2a2a', flexShrink: 0 }}>assigned_to</div>
                                <div style={{ flex: 1, padding: '0.5rem', backgroundColor: '#2a2a2a' }}>url</div>
                            </div>

                            {/* Data Row 2 */}
                            <div style={{ display: 'flex', borderBottom: '1px solid #303030', color: '#d1d5db' }}>
                                <div style={{ width: '40px', borderRight: '1px solid #404040', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', color: '#6b7280', fontSize: '0.75rem', backgroundColor: '#1e1e1e', flexShrink: 0 }}>2</div>
                                <div style={{ width: '60px', borderRight: '1px solid #303030', padding: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>TX</div>
                                <div style={{ width: '120px', borderRight: '1px solid #303030', padding: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>L547723_6</div>
                                <div style={{ width: '100px', borderRight: '1px solid #303030', padding: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>PID272_6</div>
                                <div style={{ width: '100px', borderRight: '1px solid #303030', padding: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>S-101</div>
                                <div style={{ width: '130px', borderRight: '1px solid #303030', padding: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>Alex Smith</div>
                                <div style={{ flex: 1, padding: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#60a5fa' }}>https://example.com/property/TX/L547723_6</div>
                            </div>

                            {/* Data Row 3 */}
                            <div style={{ display: 'flex', borderBottom: '1px solid #303030', color: '#d1d5db' }}>
                                <div style={{ width: '40px', borderRight: '1px solid #404040', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', color: '#6b7280', fontSize: '0.75rem', backgroundColor: '#1e1e1e', flexShrink: 0 }}>3</div>
                                <div style={{ width: '60px', borderRight: '1px solid #303030', padding: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>NY</div>
                                <div style={{ width: '120px', borderRight: '1px solid #303030', padding: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>L293341_5</div>
                                <div style={{ width: '100px', borderRight: '1px solid #303030', padding: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>PID665_5</div>
                                <div style={{ width: '100px', borderRight: '1px solid #303030', padding: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>S-205</div>
                                <div style={{ width: '130px', borderRight: '1px solid #303030', padding: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>Jane Doe</div>
                                <div style={{ flex: 1, padding: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#60a5fa' }}>https://example.com/property/NY/L293341_5</div>
                            </div>

                            {/* Data Row 4 */}
                            <div style={{ display: 'flex', color: '#d1d5db' }}>
                                <div style={{ width: '40px', borderRight: '1px solid #404040', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', color: '#6b7280', fontSize: '0.75rem', backgroundColor: '#1e1e1e', flexShrink: 0 }}>4</div>
                                <div style={{ width: '60px', borderRight: '1px solid #303030', padding: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>FL</div>
                                <div style={{ width: '120px', borderRight: '1px solid #303030', padding: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>L893376_3</div>
                                <div style={{ width: '100px', borderRight: '1px solid #303030', padding: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>PID562_3</div>
                                <div style={{ width: '100px', borderRight: '1px solid #303030', padding: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>S-312</div>
                                <div style={{ width: '130px', borderRight: '1px solid #303030', padding: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>Bob Ross</div>
                                <div style={{ flex: 1, padding: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#60a5fa' }}>https://example.com/property/FL/L893376_3</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Manual Entry Grid */}
                <div className="mt-12 w-full flex flex-col items-center text-left">
                    <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3 self-start">
                        Or enter URLs manually
                    </h3>
                    <p className="text-[var(--text-secondary)] text-sm mb-4 self-start max-w-3xl">
                        Use the same columns as the template above. These rows will be submitted using the same import process as file uploads.
                    </p>

                    <form onSubmit={handleManualSubmit} className="w-full">
                        <div className="rounded-lg border border-[var(--border-color)] overflow-hidden shadow-xl bg-[var(--bg-color)]" style={{ minWidth: '800px' }}>
                            {/* Header Row (A, B, C...) */}
                            <div style={{ display: 'flex', backgroundColor: '#2d2d2d', borderBottom: '1px solid #404040', fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af' }}>
                                <div style={{ width: '40px', borderRight: '1px solid #404040', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', backgroundColor: '#1e1e1e', flexShrink: 0 }}></div>
                                <div style={{ width: '60px', borderRight: '1px solid #404040', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', flexShrink: 0 }}>A</div>
                                <div style={{ width: '120px', borderRight: '1px solid #404040', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', flexShrink: 0 }}>B</div>
                                <div style={{ width: '100px', borderRight: '1px solid #404040', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', flexShrink: 0 }}>C</div>
                                <div style={{ width: '100px', borderRight: '1px solid #404040', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', flexShrink: 0 }}>D</div>
                                <div style={{ width: '130px', borderRight: '1px solid #404040', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', flexShrink: 0 }}>E</div>
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem' }}>F</div>
                            </div>

                            {/* Field Names Row */}
                            <div style={{ display: 'flex', backgroundColor: '#1e1e1e', borderBottom: '1px solid #404040', fontFamily: 'monospace', fontSize: '0.875rem', color: 'var(--accent-color)', fontWeight: 'bold' }}>
                                <div style={{ width: '40px', borderRight: '1px solid #404040', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', color: '#6b7280', fontWeight: 'normal', flexShrink: 0 }}>#</div>
                                <div style={{ width: '60px', borderRight: '1px solid #404040', padding: '0.5rem', backgroundColor: '#2a2a2a', flexShrink: 0 }}>state</div>
                                <div style={{ width: '120px', borderRight: '1px solid #404040', padding: '0.5rem', backgroundColor: '#2a2a2a', flexShrink: 0 }}>listing_id</div>
                                <div style={{ width: '100px', borderRight: '1px solid #404040', padding: '0.5rem', backgroundColor: '#2a2a2a', flexShrink: 0 }}>pid</div>
                                <div style={{ width: '100px', borderRight: '1px solid #404040', padding: '0.5rem', backgroundColor: '#2a2a2a', flexShrink: 0 }}>suite_id</div>
                                <div style={{ width: '130px', borderRight: '1px solid #404040', padding: '0.5rem', backgroundColor: '#2a2a2a', flexShrink: 0 }}>assigned_to</div>
                                <div style={{ flex: 1, padding: '0.5rem', backgroundColor: '#2a2a2a' }}>url</div>
                            </div>

                            {/* Editable Rows */}
                            {manualRows.map((row, index) => (
                                <div key={index} style={{ display: 'flex', borderBottom: '1px solid #303030', color: '#d1d5db', alignItems: 'stretch' }}>
                                    <div style={{ width: '40px', borderRight: '1px solid #404040', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', color: '#6b7280', fontSize: '0.75rem', backgroundColor: '#1e1e1e', flexShrink: 0 }}>
                                        {index + 1}
                                    </div>
                                    <div style={{ width: '60px', borderRight: '1px solid #303030', padding: '0.25rem 0.5rem', flexShrink: 0 }}>
                                        <input
                                            type="text"
                                            value={row.state}
                                            onChange={(e) => handleManualChange(index, 'state', e.target.value)}
                                            className="w-full bg-transparent outline-none text-xs text-gray-100"
                                        />
                                    </div>
                                    <div style={{ width: '120px', borderRight: '1px solid #303030', padding: '0.25rem 0.5rem', flexShrink: 0 }}>
                                        <input
                                            type="text"
                                            value={row.listing_id}
                                            onChange={(e) => handleManualChange(index, 'listing_id', e.target.value)}
                                            className="w-full bg-transparent outline-none text-xs text-gray-100"
                                        />
                                    </div>
                                    <div style={{ width: '100px', borderRight: '1px solid #303030', padding: '0.25rem 0.5rem', flexShrink: 0 }}>
                                        <input
                                            type="text"
                                            value={row.pid}
                                            onChange={(e) => handleManualChange(index, 'pid', e.target.value)}
                                            className="w-full bg-transparent outline-none text-xs text-gray-100"
                                        />
                                    </div>
                                    <div style={{ width: '100px', borderRight: '1px solid #303030', padding: '0.25rem 0.5rem', flexShrink: 0 }}>
                                        <input
                                            type="text"
                                            value={row.suite_id}
                                            onChange={(e) => handleManualChange(index, 'suite_id', e.target.value)}
                                            className="w-full bg-transparent outline-none text-xs text-gray-100"
                                        />
                                    </div>
                                    <div style={{ width: '130px', borderRight: '1px solid #303030', padding: '0.25rem 0.5rem', flexShrink: 0 }}>
                                        <input
                                            type="text"
                                            value={row.assigned_to}
                                            onChange={(e) => handleManualChange(index, 'assigned_to', e.target.value)}
                                            className="w-full bg-transparent outline-none text-xs text-gray-100"
                                        />
                                    </div>
                                    <div style={{ flex: 1, padding: '0.25rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <input
                                            type="text"
                                            value={row.url}
                                            onChange={(e) => handleManualChange(index, 'url', e.target.value)}
                                            className="w-full bg-transparent outline-none text-xs text-blue-300"
                                        />
                                        {manualRows.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeManualRow(index)}
                                                className="text-xs text-[var(--error-color)] hover:underline whitespace-nowrap"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-wrap items-center gap-4 mt-4">
                            <button
                                type="button"
                                onClick={addManualRow}
                                className="btn btn-secondary"
                                disabled={isUploading}
                            >
                                + Add another row
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={isUploading}
                            >
                                {isUploading ? 'Submitting…' : 'Submit manual URLs'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
