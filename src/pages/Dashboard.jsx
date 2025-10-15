import SummaryCards from '../components/SummaryCards'
import LiveRiskChart from '../components/LiveRiskChart'
import CustomerTable from '../components/CustomerTable'
import AlertFeed from '../components/AlertFeed'
import { useRiskContext } from '../context/RiskContext'
import { usePaypalActivity } from '../context/useRiskSelectors'

function LoanPerformancePanel() {
    const { loanPerformance } = useRiskContext()

    return (
        <section className="glass-panel border border-surface-600 rounded-2xl p-6">
            <header className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-base-0">Loan Repayment Pulse</h3>
                <span className="badge bg-surface-400/20 text-muted-200 border border-surface-400/30">Daily cadence</span>
            </header>
            <div className="mt-5 space-y-4">
                {loanPerformance.slice(0, 5).map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between text-sm text-muted-200">
                        <div>
                            <p className="font-medium text-base-0">{entry.name}</p>
                            <p className="text-xs text-muted-400">{entry.product}</p>
                        </div>
                        <div className="loan-bar">
                            <div className="loan-bar-fill" style={{ width: `${Math.min(entry.rate * 100, 100)}%` }} />
                        </div>
                        <span className="font-semibold text-base-0">{Math.round(entry.rate * 100)}%</span>
                    </div>
                ))}
            </div>
        </section>
    )
}

function PaypalActivityPanel() {
    const activity = usePaypalActivity(6)
    return (
        <section className="glass-panel border border-surface-600 rounded-2xl p-6">
            <header className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-base-0">PayPal Alerts</h3>
                <span className="badge bg-risk-high/15 text-risk-high border-risk-high/40">Escalated</span>
            </header>
            <div className="mt-5 space-y-4">
                {activity.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between text-sm">
                        <div>
                            <p className="font-medium text-base-0">{entry.customer}</p>
                            <p className="text-xs text-muted-400">{entry.merchant}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-semibold text-risk-high">${entry.amount.toLocaleString()}</p>
                            <p className="text-xs text-muted-400">Risk {entry.riskScore}</p>
                        </div>
                    </div>
                ))}
                {!activity.length && <p className="text-sm text-muted-400">No PayPal escalations in the last hour.</p>}
            </div>
        </section>
    )
}

export default function Dashboard() {
    return (
        <div className="space-y-6">
            <SummaryCards />
            <div className="grid dashboard-grid gap-6">
                <LiveRiskChart />
                <AlertFeed limit={6} />
            </div>
            <div className="grid dashboard-grid gap-6">
                <CustomerTable compact />
                <div className="space-y-6">
                    <LoanPerformancePanel />
                    <PaypalActivityPanel />
                </div>
            </div>
        </div>
    )
}