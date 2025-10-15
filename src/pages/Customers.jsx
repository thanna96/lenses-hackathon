import CustomerTable from '../components/CustomerTable'
import { useRiskContext } from '../context/RiskContext'

export default function Customers() {
    const { summary } = useRiskContext()
    return (
        <div className="space-y-6">
            <section className="glass-panel border border-surface-600 rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-base-0">Customer Portfolio</h2>
                <p className="mt-2 text-sm text-muted-300">
                    Unified risk intelligence across all customer cohorts. Average risk score currently{' '}
                    <span className="font-semibold text-accent-200">{summary.averageRiskFormatted}</span>.
                </p>
            </section>
            <CustomerTable />
        </div>
    )
}