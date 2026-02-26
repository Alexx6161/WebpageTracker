import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

export function Layout() {
    const location = useLocation();

    return (
        <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', padding: '24px', gap: '24px', overflow: 'hidden' }}>
            {/* Top Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', width: '100%', flexShrink: 0 }}>
                <Link to="/">
                    <button className={`btn ${location.pathname === '/' ? 'btn-primary' : 'btn-secondary'}`}>
                        Dashboard
                    </button>
                </Link>
                <Link to="/review">
                    <button className={`btn ${location.pathname === '/review' ? 'btn-primary' : 'btn-secondary'}`}>
                        Review Changes
                    </button>
                </Link>
                <Link to="/add">
                    <button className={`btn ${location.pathname === '/add' ? 'btn-primary' : 'btn-secondary'}`}>
                        Add URLs
                    </button>
                </Link>
                <Link to="/manage">
                    <button className={`btn ${location.pathname === '/manage' ? 'btn-primary' : 'btn-secondary'}`}>
                        Manage URLs
                    </button>
                </Link>
            </div>

            {/* Main Content Area */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', overflowY: 'auto' }}>
                <Outlet />
            </main>
        </div>
    );
}
