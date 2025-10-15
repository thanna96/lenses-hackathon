import { useMemo, useState } from 'react'
import { useRiskContext } from '../context/RiskContext'

function buildPath(points, width, height) {
    if (!points.length) return ''
    const maxY = Math.max(...points.map((point) => point.y), 100)
    const minY = Math.min(...points.map((point) => point.y), 0)
    const range = maxY - minY || 1
    const step = width / (points.length - 1 || 1)

    return points
        .map((point, index) => {
            const x = index * step
            const y = height - ((point.y - minY) / range) * height
            return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`
        })
        .join(' ')
}

function formatTimeLabel(timestamp) {
    const date = new Date(timestamp)
    return `${date.getHours().toString().padStart(2, '0')}:${date
        .getMinutes()
        .toString()
        .padStart(2, '0')}`
}

export default function LiveRiskChart() {
    const { trend, summary, events } = useRiskContext()
    const [range, setRange] = useState('24h')

    const filtered = useMemo(() => {
        if (range === '24h') return trend
        if (range === '6h') return trend.slice(-12)
        return trend.slice(-6)
    }, [trend, range])

    const chartPoints = useMemo(
        () =>
            filtered.map((entry) => ({
                x: entry.timestamp,
                y: Math.round(entry.averageRisk * 10) / 10,
            })),
        [filtered],
    )

    const path = useMemo(() => buildPath(chartPoints, 620, 220), [chartPoints])

    const gradientStops = [
        { offset: '0%', color: 'var(--color-risk-low)', opacity: 0.32 },
        { offset: '55%', color: 'var(--color-primary)', opacity: 0.22 },
        { offset: '100%', color: 'var(--color-risk-high)', opacity: 0.28 },
    ]

    return (
        <section className="glass-panel border border-surface-600 rounded-2xl p-6 shadow-xl shadow-black/20">
            <header className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-semibold text-base-0">Average Risk Score</h3>
                    <p className="mt-1 text-sm text-muted-300">
                        Realtime aggregation across all monitored customer cohorts.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {['6h', '12h', '24h'].map((label) => (
                        <button
                            key={label}
                            type="button"
                            onClick={() => setRange(label === '12h' ? '12h' : label)}
                            className={`chip ${range === label ? 'chip-active' : ''}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </header>

            <div className="mt-6 chart-container">
                <svg viewBox="0 0 620 240" preserveAspectRatio="none" className="risk-chart">
                    <defs>
                        <linearGradient id="riskGradient" x1="0" x2="0" y1="0" y2="1">
                            {gradientStops.map((stop) => (
                                <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} stopOpacity={stop.opacity} />
                            ))}
                        </linearGradient>
                    </defs>
                    <rect x="0" y="0" width="620" height="240" fill="url(#riskGradient)" opacity="0.18" />
                    <path d={path} fill="none" stroke="var(--color-accent)" strokeWidth="3.5" strokeLinecap="round" />
                    {chartPoints.map((point, index) => {
                        const maxY = Math.max(...chartPoints.map((p) => p.y), 100)
                        const minY = Math.min(...chartPoints.map((p) => p.y), 0)
                        const rangeY = maxY - minY || 1
                        const step = 620 / (chartPoints.length - 1 || 1)
                        const x = index * step
                        const y = 240 - ((point.y - minY) / rangeY) * 240
                        return <circle key={point.x} cx={x} cy={y} r="4" fill="var(--color-accent)" />
                    })}
                </svg>
                <div className="chart-footer">
                    {chartPoints.map((point, index) => (
                        <span key={point.x} className="chart-tick text-xs text-muted-400">
              {index % Math.ceil(chartPoints.length / 6 || 1) === 0 ? formatTimeLabel(point.x) : ''}
            </span>
                    ))}
                </div>
            </div>

            <footer className="mt-6 flex flex-wrap items-center gap-6 text-sm text-muted-300">
                <div className="metric-pill">
                    <span className="metric-dot bg-accent-500" />
                    <span>Current avg: {summary.averageRiskFormatted}</span>
                </div>
                <div className="metric-pill">
                    <span className="metric-dot bg-risk-high" />
                    <span>Events today: {events.length}</span>
                </div>
            </footer>
        </section>
    )
}