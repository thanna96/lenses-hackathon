import AlertFeed from '../components/AlertFeed'
import { useRiskContext } from '../context/RiskContext'

export default function Alerts() {
    const { summary } = useRiskContext()
    return (
        <div className="space-y-6">
            <section className="glass-panel border border-surface-600 rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-base-0">Alerts & Incident Response</h2>
                <p className="mt-2 text-sm text-muted-300">
                    {summary.fraudAlerts} alerts triggered in the last 24h. Escalations are automatically prioritised by
                    severity for the fraud operations pod.
                </p>
            </section>
            <AlertFeed limit={15} />
        </div>
    )
}