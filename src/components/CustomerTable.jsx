import { useMemo, useState } from 'react'
import { useRiskContext } from '../context/RiskContext'
import { useFilteredCustomers } from '../context/useRiskSelectors'

const PAGE_SIZE = 6

const columns = [
    { key: 'name', label: 'Customer', width: '24%' },
    { key: 'riskScore', label: 'Risk Score', width: '12%', isNumeric: true },
    { key: 'riskLevel', label: 'Risk Level', width: '12%' },
    { key: 'balance', label: 'Balance', width: '16%', isNumeric: true },
    { key: 'loanRepaymentRate', label: 'Loan Repayment', width: '16%', isNumeric: true },
    { key: 'lastActivity', label: 'Last Activity', width: '20%' },
]

const riskTone = {
    High: 'text-risk-high bg-risk-high/15 border-risk-high/30',
    Medium: 'text-risk-medium bg-risk-medium/15 border-risk-medium/30',
    Low: 'text-risk-low bg-risk-low/15 border-risk-low/30',
}

function formatDate(timestamp) {
    const diff = Date.now() - timestamp
    const hours = Math.round(diff / (3600 * 1000))
    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
}

function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

export default function CustomerTable({ compact = false }) {
    const customers = useFilteredCustomers()
    const { setFilters, filters } = useRiskContext()
    const [sortKey, setSortKey] = useState('riskScore')
    const [direction, setDirection] = useState('desc')
    const [page, setPage] = useState(0)

    const sorted = useMemo(() => {
        const sortedCustomers = [...customers].sort((a, b) => {
            const valueA = a[sortKey]
            const valueB = b[sortKey]
            if (typeof valueA === 'number' && typeof valueB === 'number') {
                return direction === 'asc' ? valueA - valueB : valueB - valueA
            }
            return direction === 'asc'
                ? String(valueA).localeCompare(String(valueB))
                : String(valueB).localeCompare(String(valueA))
        })
        return sortedCustomers
    }, [customers, sortKey, direction])

    const paged = useMemo(() => {
        const start = page * PAGE_SIZE
        return sorted.slice(start, start + PAGE_SIZE)
    }, [page, sorted])

    const pageCount = Math.ceil(customers.length / PAGE_SIZE)

    function onSort(nextKey) {
        if (sortKey === nextKey) {
            setDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
        } else {
            setSortKey(nextKey)
            setDirection(nextKey === 'name' ? 'asc' : 'desc')
        }
        setPage(0)
    }

    function onFilterChange(level) {
        setFilters((current) => ({ ...current, customerRisk: level }))
        setPage(0)
    }

    return (
        <section className={`glass-panel border border-surface-600 rounded-2xl ${compact ? 'p-4' : 'p-6'}`}>
            <header className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h3 className="text-lg font-semibold text-base-0">Customer Risk Profiles</h3>
                    <p className="mt-1 text-sm text-muted-300">Live telemetry combining credit, behavioral, and repayment data.</p>
                </div>
                <div className="flex items-center gap-2">
                    {['all', 'High', 'Medium', 'Low'].map((level) => (
                        <button
                            key={level}
                            type="button"
                            onClick={() => onFilterChange(level)}
                            className={`chip ${filters.customerRisk === level ? 'chip-active' : ''}`}
                        >
                            {level === 'all' ? 'All' : level}
                        </button>
                    ))}
                </div>
            </header>

            <div className="mt-5 overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                    <tr className="text-xs uppercase tracking-wide text-muted-400">
                        {columns.map((column) => (
                            <th
                                key={column.key}
                                scope="col"
                                style={{ width: column.width }}
                                className="py-3 font-medium"
                            >
                                <button type="button" className="sort-button" onClick={() => onSort(column.key)}>
                                    {column.label}
                                    {sortKey === column.key && <span className="sort-indicator">{direction === 'asc' ? '↑' : '↓'}</span>}
                                </button>
                            </th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {paged.map((customer) => (
                        <tr key={customer.id} className="border-b border-surface-500/40 last:border-none">
                            <td className="py-3">
                                <div className="flex flex-col">
                                    <span className="font-semibold text-base-0">{customer.name}</span>
                                    <span className="text-xs text-muted-400">{customer.id} · {customer.location}</span>
                                </div>
                            </td>
                            <td className="py-3 font-semibold text-base-0">{customer.riskScore.toFixed(1)}</td>
                            <td className="py-3">
                                <span className={`badge ${riskTone[customer.riskLevel]}`}>{customer.riskLevel}</span>
                            </td>
                            <td className="py-3 text-muted-100">{formatCurrency(customer.balance)}</td>
                            <td className="py-3 text-muted-100">{Math.round(customer.loanRepaymentRate * 100)}%</td>
                            <td className="py-3 text-muted-400">{formatDate(customer.lastActivity)}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {pageCount > 1 && (
                <footer className="mt-4 flex items-center justify-between text-xs text-muted-400">
          <span>
            Page {page + 1} of {pageCount}
          </span>
                    <div className="flex items-center gap-2">
                        <button type="button" className="chip" disabled={page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))}>
                            Prev
                        </button>
                        <button
                            type="button"
                            className="chip"
                            disabled={page >= pageCount - 1}
                            onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))}
                        >
                            Next
                        </button>
                    </div>
                </footer>
            )}
        </section>
    )
}