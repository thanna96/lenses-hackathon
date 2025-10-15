const navItems = [
    {
        path: '/dashboard',
        label: 'Dashboard',
        icon: (
            <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-icon">
                <path
                    d="M4 12.5V20h5v-7.5H4Zm6.5-8.5V20h7V4h-7Zm8.5 6V20h3v-9h-3Z"
                    fill="currentColor"
                />
            </svg>
        ),
    },
    {
        path: '/customers',
        label: 'Customers',
        icon: (
            <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-icon">
                <path
                    d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm-8 8v-1.2c0-2.43 3.58-3.8 8-3.8s8 1.37 8 3.8V20Z"
                    fill="currentColor"
                />
            </svg>
        ),
    },
    {
        path: '/merchants',
        label: 'Merchants',
        icon: (
            <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-icon">
                <path
                    d="M4 9V7l8-5 8 5v2l-8-5ZM4 11h16v10H4Zm9 2h5v2h-5Z"
                    fill="currentColor"
                />
            </svg>
        ),
    },
    {
        path: '/alerts',
        label: 'Alerts',
        icon: (
            <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-icon">
                <path
                    d="M11.99 3 4 19h16Zm0 5.8a.9.9 0 0 1 .9.9v3.6a.9.9 0 0 1-1.8 0V9.7a.9.9 0 0 1 .9-.9Zm0 7.3a1.05 1.05 0 1 1-1.05 1.05A1.05 1.05 0 0 1 12 16.1Z"
                    fill="currentColor"
                />
            </svg>
        ),
    },
]

export default function Sidebar({ currentRoute, onNavigate }) {
    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <span className="brand-dot" />
                <div>
                    <p className="text-xs uppercase tracking-wide text-muted-400">Unified</p>
                    <p className="text-lg font-semibold text-base-0">Risk Intelligence</p>
                </div>
            </div>
            <nav className="sidebar-nav">
                {navItems.map((item) => {
                    const active = currentRoute === item.path
                    return (
                        <button
                            key={item.path}
                            type="button"
                            onClick={() => onNavigate(item.path)}
                            className={`sidebar-link ${active ? 'sidebar-link-active' : ''}`}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </button>
                    )
                })}
            </nav>
        </aside>
    )
}