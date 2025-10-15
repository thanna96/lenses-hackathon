import { useAlertsFeed } from '../context/useRiskSelectors'

const severityTone = {
    critical: { label: 'Critical', className: 'border-risk-high text-risk-high bg-risk-high/10' },
    high: { label: 'High', className: 'border-risk-medium text-risk-medium bg-risk-medium/10' },
    medium: { label: 'Medium', className: 'border-accent-500 text-accent-200 bg-accent-500/10' },
}

function timeAgo(timestamp) {
    const diff = Date.now() - timestamp
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return `${Math.floor(diff / 86400000)}d ago`
}

export default function AlertFeed({ limit = 8, condensed = false }) {
    const alerts = useAlertsFeed(limit)

    return (
        <section className={`glass-panel border border-surface-600 rounded-2xl ${condensed ? 'p-4' : 'p-6'}`}>
            <header className="flex items-center justify-between gap-3">
                <div>
                    <h3 className="text-lg font-semibold text-base-0">Fraud & Risk Alerts</h3>
                    <p className="mt-1 text-sm text-muted-300">Realtime escalations from streaming anomaly detection.</p>
                </div>
                <span className="badge bg-surface-400/20 text-muted-200 border border-surface-400/30">Live Feed</span>
            </header>

            <div className="mt-4 space-y-3">
                {alerts.map((alert, index) => {
                    const tone = severityTone[alert.severity] ?? severityTone.medium
                    return (
                        <article
                            key={alert.id}
                            className={`alert-card ${tone.className}`}
                            style={{ animationDelay: `${Math.min(index * 60, 240)}ms` }}
                        >
                            <div>
                                <p className="text-sm font-semibold text-base-0">{alert.title}</p>
                                <p className="mt-1 text-sm text-muted-200">{alert.message}</p>
                            </div>
                            <footer className="mt-3 flex items-center justify-between text-xs text-muted-400">
                                <span>{alert.merchant}</span>
                                <span>{timeAgo(alert.timestamp)}</span>
                            </footer>
                        </article>
                    )
                })}
                {!alerts.length && <p className="text-sm text-muted-400">No alerts in the last hour.</p>}
            </div>
        </section>
    )
}