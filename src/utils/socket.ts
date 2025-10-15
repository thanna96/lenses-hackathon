export type RiskEvent = {
    customer_id: string
    customer_name: string
    risk_score: number
    loan_repayment_rate: number
    paypal_alert: boolean
    transaction_amount: number
    merchant_id: string
    merchant_name: string
    merchant_category: string
    timestamp: number
}

type Listener = (event: RiskEvent) => void

const CUSTOMERS = [
    { id: 'CST-001', name: 'Avery Finley' },
    { id: 'CST-002', name: 'Maya Chen' },
    { id: 'CST-003', name: 'Liam Patel' },
    { id: 'CST-004', name: 'Sofia Martins' },
    { id: 'CST-005', name: 'Noah Williams' },
    { id: 'CST-006', name: 'Emilia Rossi' },
    { id: 'CST-007', name: 'Jackson Lee' },
    { id: 'CST-008', name: 'Harper Singh' },
    { id: 'CST-009', name: 'Oliver Davis' },
    { id: 'CST-010', name: 'Zoe Müller' },
]

const MERCHANTS = [
    { id: 'MRC-001', name: 'NovaPay', category: 'Payments' },
    { id: 'MRC-002', name: 'Skyline Retail', category: 'E-Commerce' },
    { id: 'MRC-003', name: 'Axis Travel', category: 'Travel' },
    { id: 'MRC-004', name: 'Vertex Gaming', category: 'Gaming' },
    { id: 'MRC-005', name: 'Blue Horizon', category: 'Marketplaces' },
]

function randomBetween(min: number, max: number) {
    return Math.random() * (max - min) + min
}

function pick<T>(list: T[]): T {
    return list[Math.floor(Math.random() * list.length)]
}

function buildEvent(): RiskEvent {
    const customer = pick(CUSTOMERS)
    const merchant = pick(MERCHANTS)
    const baseRisk = randomBetween(25, 85)
    const volatility = randomBetween(-10, 15)
    const riskScore = Math.min(100, Math.max(5, baseRisk + volatility))
    const paypalAlert = Math.random() < 0.18
    const loanRepayment = Math.min(1, Math.max(0, randomBetween(0.65, 0.98) + (50 - riskScore) / 500))
    const transactionAmount = Math.round(randomBetween(80, 4200))

    return {
        customer_id: customer.id,
        customer_name: customer.name,
        risk_score: Math.round(riskScore * 10) / 10,
        loan_repayment_rate: Math.round(loanRepayment * 1000) / 1000,
        paypal_alert: paypalAlert,
        transaction_amount: transactionAmount,
        merchant_id: merchant.id,
        merchant_name: merchant.name,
        merchant_category: merchant.category,
        timestamp: Date.now(),
    }
}

export function createRiskSocket(intervalMs = 2500) {
    const listeners = new Set<Listener>()
    let timer: ReturnType<typeof setInterval> | undefined

    function start() {
        if (timer) return
        timer = setInterval(() => {
            const event = buildEvent()
            listeners.forEach((listener) => listener(event))
        }, intervalMs)
    }

    function stop() {
        if (timer) {
            clearInterval(timer)
            timer = undefined
        }
    }

    start()

    return {
        subscribe(listener: Listener) {
            listeners.add(listener)
            return () => listeners.delete(listener)
        },
        close() {
            stop()
            listeners.clear()
        },
    }
}

export const socketReferenceData = {
    customers: CUSTOMERS,
    merchants: MERCHANTS,
}