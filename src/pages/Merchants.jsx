import { useFilteredMerchants } from '../context/useRiskSelectors'

const badgeTone = {
    Critical: 'bg-risk-high/20 text-risk-high border-risk-high/30',
    High: 'bg-risk-high/15 text-risk-high border-risk-high/30',
    Elevated: 'bg-risk-medium/15 text-risk-medium border-risk-medium/30',
    Stable: 'bg-risk-low/15 text-risk-low border-risk-low/30',
}

export default function Merchants() {
    const merchants = useFilteredMerchants()

    return (
        <div className="space-y-6">
            <section className="glass-panel border border-surface-600 rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-base-0">Merchant Network</h2>
                <p className="mt-2 text-sm text-muted-300">
                    Monitor merchant-level fraud velocity and transaction volume to keep payouts resilient.
                </p>
            </section>
            <div className="grid merchant-grid gap-5">
                {merchants.map((merchant) => (
                    <article key={merchant.id} className="glass-panel border border-surface-600 rounded-2xl p-5">
                        <header className="flex items-center justify-between">
                            <div>
                                <p className="text-sm uppercase tracking-wide text-muted-400">{merchant.category}</p>
                                <h3 className="text-lg font-semibold text-base-0">{merchant.name}</h3>
                            </div>
                            <span className={`badge ${badgeTone[merchant.riskLevel] ?? badgeTone.Stable}`}>
                {merchant.riskLevel}
              </span>
                        </header>
                        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm text-muted-200">
                            <div>
                                <dt className="text-xs uppercase tracking-wide text-muted-400">Transaction volume</dt>
                                <dd className="mt-1 font-semibold text-base-0">${merchant.transactionVolume.toLocaleString()}</dd>
                            </div>
                            <div>
                                <dt className="text-xs uppercase tracking-wide text-muted-400">Fraud rate</dt>
                                <dd className="mt-1 font-semibold text-risk-high">{merchant.fraudRate}%</dd>
                            </div>
                            <div>
                                <dt className="text-xs uppercase tracking-wide text-muted-400">Average ticket</dt>
                                <dd className="mt-1 text-base-0">${merchant.averageTicket.toLocaleString()}</dd>
                            </div>
                            <div>
                                <dt className="text-xs uppercase tracking-wide text-muted-400">Disputes</dt>
                                <dd className="mt-1 text-base-0">{merchant.disputes}</dd>
                            </div>
                        </dl>
                        <p className="mt-4 text-xs text-muted-400">
                            Last alert {Math.round((Date.now() - merchant.lastAlert) / (3600 * 1000))}h ago.
                        </p>
                    </article>
                ))}
                {!merchants.length && (
                    <p className="text-sm text-muted-400">No merchants match the current filters.</p>
                )}
            </div>
        </div>
    )
}