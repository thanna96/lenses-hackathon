import { useRiskContext } from '../context/RiskContext'

const cards = [
    {
        key: 'activeCustomers',
        title: 'Active Customers',
        accent: 'accent',
        formatter: (summary) => summary.activeCustomers,
        detail: 'Accounts under continuous monitoring',
    },
    {
        key: 'averageRisk',
        title: 'Average Risk Score',
        accent: 'primary',
        formatter: (summary) => summary.averageRiskFormatted,
        detail: 'Rolling 24h weighted exposure',
    },
    {
        key: 'fraudAlerts',
        title: 'Fraud Alerts (24h)',
        accent: 'warning',
        formatter: (summary) => summary.fraudAlerts,
        detail: 'Anomalies escalated to fraud ops',
    },
    {
        key: 'totalPayments',
        title: 'Payments Processed',
        accent: 'teal',
        formatter: (summary) => summary.totalPaymentsFormatted,
        detail: 'Aggregate settlement volume',
    },
]

const accentClassMap = {
    accent: 'bg-accent-500/15 text-accent-300 border-accent-500/30',
    primary: 'bg-primary-500/15 text-primary-200 border-primary-500/25',
    warning: 'bg-risk-high/15 text-risk-high border-risk-high/30',
    teal: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
}

export default function SummaryCards() {
    const { summary } = useRiskContext()

    return (
        <section className="grid summary-grid gap-5">
            {cards.map((card) => (
                <article key={card.key} className="glass-panel p-5 rounded-2xl border border-surface-600 shadow-lg shadow-black/20">
                    <header className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-xs uppercase tracking-wide text-muted-400">{card.title}</p>
                            <p className="text-2xl font-semibold tracking-tight text-base-0">{card.formatter(summary)}</p>
                        </div>
                        <span className={`badge ${accentClassMap[card.accent]}`}>Live</span>
                    </header>
                    <p className="mt-4 text-sm leading-relaxed text-muted-300">{card.detail}</p>
                </article>
            ))}
        </section>
    )
}