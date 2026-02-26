import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

export function Layout() {
    const location = useLocation();

    return (
        <div className="h-screen w-screen flex flex-col p-6 gap-6" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Top Navigation */}
            <div className="flex items-center gap-4 mx-auto w-full max-w-[1600px] mb-2" style={{ flexShrink: 0 }}>
                <Link to="/">
                    <button className={`btn ${location.pathname === '/' ? 'btn-primary' : 'btn-secondary border border-transparent hover:border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
                        Dashboard
                    </button>
                </Link>
                <Link to="/review">
                    <button className={`btn ${location.pathname === '/review' ? 'btn-primary' : 'btn-secondary border border-transparent hover:border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
                        Review Changes
                    </button>
                </Link>
                <Link to="/add">
                    <button className={`btn ${location.pathname === '/add' ? 'btn-primary' : 'btn-secondary border border-transparent hover:border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
                        Add URLs
                    </button>
                </Link>
                <Link to="/manage">
                    <button className={`btn ${location.pathname === '/manage' ? 'btn-primary' : 'btn-secondary border border-transparent hover:border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
                        Manage URLs
                    </button>
                </Link>
            </div>

            {/* Main Content Area */}
            <Outlet />
        </div>
    );
}
