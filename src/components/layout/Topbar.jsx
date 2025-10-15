import { useRiskContext } from '../../context/RiskContext'

const toneClass = {
    low: 'bg-risk-low/20 text-risk-low border-risk-low/30',
    medium: 'bg-risk-medium/20 text-risk-medium border-risk-medium/30',
    high: 'bg-risk-high/20 text-risk-high border-risk-high/30',
}

export default function Topbar() {
    const { processedEvents, systemHealth, globalSearch, setGlobalSearch, toggleTheme, theme, summary } =
        useRiskContext()

    return (
        <header className="topbar">
            <div className="flex flex-1 items-center gap-4">
                <div className="status-card">
                    <span className={`badge ${toneClass[systemHealth.tone]}`}>{systemHealth.label}</span>
                    <p className="text-xs text-muted-300">Platform health</p>
                </div>
                <div className="status-card">
                    <p className="text-lg font-semibold text-base-0">{processedEvents}</p>
                    <p className="text-xs text-muted-300">Events processed</p>
                </div>
                <div className="status-card">
                    <p className="text-lg font-semibold text-base-0">{summary.averageRiskFormatted}</p>
                    <p className="text-xs text-muted-300">Rolling avg risk</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <div className="search-bar">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path
                            d="m20.8 19.6-3.9-3.9a7 7 0 1 0-1.2 1.2l3.9 3.9a.8.8 0 0 0 1.2-1.2ZM6.5 11a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0Z"
                            fill="currentColor"
                        />
                    </svg>
                    <input
                        value={globalSearch}
                        onChange={(event) => setGlobalSearch(event.target.value)}
                        type="search"
                        placeholder="Search customers, merchants, alerts"
                    />
                </div>
                <button type="button" className="chip" onClick={toggleTheme}>
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </button>
            </div>
        </header>
    )
}