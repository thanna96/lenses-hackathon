export type RiskEvent = {
    customer_id: string
    customer_name: string
    customer_location?: string
    loan_product?: string
    risk_score: number
    loan_repayment_rate: number
    paypal_alert: boolean
    transaction_amount: number
    merchant_id: string
    merchant_name: string
    merchant_category: string
    timestamp: number
}

type CreditCardTransaction = {
    transaction_id: string
    timestamp: string
    customer_id: string
    merchant_id: string
    card_number: string
    merchant: string
    category: string
    amount: number
    currency: string
    location: {
        city: string
        state: string
        zip: string
    }
    status: 'approved' | 'declined' | 'pending'
    is_fraud: boolean
    is_cancelled_card?: boolean
    fraud_indicators?: {
        is_cancelled_card?: boolean
        is_high_amount?: boolean
    }
}

type PaypalTransaction = {
    transaction_id: string
    timestamp: string
    customer_id: string
    merchant_id: string
    paypal_email: string
    merchant: string
    category: string
    amount: number
    currency: string
    account_country: string
    location: {
        city: string
        state: string
        country: string
    }
    status: 'completed' | 'held' | 'refunded'
    is_fraud: boolean
    fraud_indicators?: {
        is_foreign_account?: boolean
        is_high_amount?: boolean
        account_age_days?: number
    }
}

type AutoLoanPayment = {
    payment_id: string
    timestamp: string
    loan_id: string
    customer_id: string
    amount: number
    principal: number
    interest: number
    remaining_balance: number
    payment_method: 'ACH' | 'Wire Transfer' | 'Debit Card'
    payment_status: 'completed' | 'late' | 'pending'
    due_date: string
    vehicle_info: {
        make: string
        model: string
        year: number
    }
}

type HomeLoanPayment = {
    payment_id: string
    timestamp: string
    loan_id: string
    customer_id: string
    amount: number
    principal: number
    interest: number
    escrow: number
    remaining_balance: number
    payment_method: 'ACH' | 'Wire Transfer' | 'Debit Card'
    payment_status: 'completed' | 'late' | 'pending'
    due_date: string
    property_info: {
        address: string
        city: string
        state: string
        zip: string
        property_type: string
    }
    loan_type: string
}

type StreamRecord =
    | { stream: 'credit-card-transactions'; data: CreditCardTransaction }
    | { stream: 'paypal-transactions'; data: PaypalTransaction }
    | { stream: 'auto-loan-payments'; data: AutoLoanPayment }
    | { stream: 'home-loan-payments'; data: HomeLoanPayment }

type Listener = (event: RiskEvent) => void

type CustomerReference = {
    id: string
    name: string
    region?: string
}

type MerchantReference = {
    id: string
    name: string
    category: string
}

const CUSTOMERS: CustomerReference[] = [
    { id: 'CUST-003409', name: 'Michael Garcia', region: 'San Diego, AZ' },
    { id: 'CUST-007810', name: 'Ava Thompson', region: 'Phoenix, TX' },
    { id: 'CUST-676036', name: 'Lucas Bennett', region: 'Dallas, TX' },
    { id: 'CUST-701053', name: 'Sienna Patel', region: 'Philadelphia, FL' },
    { id: 'CUST-007652', name: 'Michael Garcia', region: 'San Antonio, TX' },
    { id: 'CST-001', name: 'Avery Finley', region: 'London, UK' },
    { id: 'CST-002', name: 'Maya Chen', region: 'New York, USA' },
    { id: 'CST-003', name: 'Liam Patel', region: 'Singapore' },
    { id: 'CST-004', name: 'Sofia Martins', region: 'Berlin, DE' },
    { id: 'CST-005', name: 'Noah Williams', region: 'Toronto, CA' },
    { id: 'CST-006', name: 'Emilia Rossi', region: 'Lisbon, PT' },
    { id: 'CST-007', name: 'Jackson Lee', region: 'Austin, USA' },
    { id: 'CST-008', name: 'Harper Singh', region: 'Seattle, USA' },
    { id: 'CST-009', name: 'Oliver Davis', region: 'Chicago, USA' },
    { id: 'CST-010', name: 'Zoe Müller', region: 'Munich, DE' },
]

const MERCHANTS: MerchantReference[] = [
    { id: 'MERCH-000059', name: 'Home Depot', category: 'Home Improvement' },
    { id: 'MERCH-000533', name: "McDonald's", category: 'Quick Service Restaurants' },
    { id: 'MERCH-000566', name: 'Nike', category: 'Retail Apparel' },
    { id: 'MERCH-AUTO-001', name: 'Auto Loan Servicing', category: 'Auto Finance' },
    { id: 'MERCH-HOME-001', name: 'Home Loan Servicing', category: 'Mortgage Services' },
    { id: 'MRC-001', name: 'NovaPay', category: 'Payments' },
    { id: 'MRC-002', name: 'Skyline Retail', category: 'E-Commerce' },
    { id: 'MRC-003', name: 'Axis Travel', category: 'Travel' },
    { id: 'MRC-004', name: 'Vertex Gaming', category: 'Gaming' },
    { id: 'MRC-005', name: 'Blue Horizon', category: 'Marketplaces' },
]

const CUSTOMER_DIRECTORY = new Map(CUSTOMERS.map((customer) => [customer.id, customer]))
const MERCHANT_DIRECTORY = new Map(MERCHANTS.map((merchant) => [merchant.id, merchant]))

const CARD_CATEGORIES = ['Dining', 'Travel', 'Electronics', 'Home Improvement', 'Groceries', 'Entertainment']
const PAYPAL_CATEGORIES = ['Subscriptions', 'Digital Goods', 'Clothing', 'Home & Living', 'Services']
const STATES = ['CA', 'TX', 'AZ', 'FL', 'NY', 'WA', 'GA', 'IL', 'CO', 'NV']
const CITIES = ['San Diego', 'Phoenix', 'New York', 'Austin', 'Seattle', 'Atlanta', 'Chicago', 'Denver', 'Las Vegas', 'Miami']
const VEHICLES = [
    { make: 'Chevrolet', model: 'Accord', year: 2018 },
    { make: 'Ford', model: 'Escape', year: 2019 },
    { make: 'Toyota', model: 'Camry', year: 2020 },
    { make: 'Honda', model: 'Civic', year: 2021 },
    { make: 'Tesla', model: 'Model 3', year: 2022 },
]
const PROPERTY_TYPES = ['Single Family', 'Townhome', 'Condo', 'Multi-Family', 'Duplex']

function randomBetween(min: number, max: number) {
    return Math.random() * (max - min) + min
}

function pick<T>(list: T[]): T {
    return list[Math.floor(Math.random() * list.length)]
}

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max)
}

function createId(prefix: string) {
    const seed = Math.floor(randomBetween(1000000000, 9999999999))
    return `${prefix}-${seed}`
}

function formatZip() {
    return `${Math.floor(randomBetween(10000, 99999))}`
}

function ensureMerchant(id: string, name: string, category: string) {
    if (!MERCHANT_DIRECTORY.has(id)) {
        MERCHANT_DIRECTORY.set(id, { id, name, category })
    }
    return MERCHANT_DIRECTORY.get(id) as MerchantReference
}

function resolveCustomer(customerId: string) {
    const customer = CUSTOMER_DIRECTORY.get(customerId)
    if (customer) return customer
    const fallback = { id: customerId, name: customerId, region: pick(CITIES) }
    CUSTOMER_DIRECTORY.set(customerId, fallback)
    return fallback
}

function normalizeCreditCard(data: CreditCardTransaction): RiskEvent {
    const customer = resolveCustomer(data.customer_id)
    const merchant = ensureMerchant(data.merchant_id, data.merchant, data.category)
    const amountFactor = clamp(data.amount / 12, 6, 32)
    const statusPenalty = data.status !== 'approved' ? 6 : 0
    const highAmount = data.fraud_indicators?.is_high_amount || data.amount > 650
    const cancelledCard = data.fraud_indicators?.is_cancelled_card || data.is_cancelled_card
    let riskScore = 38 + amountFactor + statusPenalty
    if (highAmount) riskScore += 10
    if (cancelledCard) riskScore += 14
    if (data.is_fraud) riskScore += 22
    riskScore = clamp(riskScore, 12, 97)
    const repayment = clamp(0.95 - riskScore / 160, 0.45, 0.96)
    const location = `${data.location.city}, ${data.location.state}`
    return {
        customer_id: data.customer_id,
        customer_name: customer.name,
        customer_location: location,
        loan_product: 'Revolving Credit',
        risk_score: Math.round(riskScore * 10) / 10,
        loan_repayment_rate: Math.round(repayment * 1000) / 1000,
        paypal_alert: Boolean(data.is_fraud || highAmount || cancelledCard),
        transaction_amount: Math.round(data.amount * 100) / 100,
        merchant_id: merchant.id,
        merchant_name: merchant.name,
        merchant_category: merchant.category,
        timestamp: new Date(data.timestamp).getTime(),
    }
}

function normalizePaypal(data: PaypalTransaction): RiskEvent {
    const customer = resolveCustomer(data.customer_id)
    const merchant = ensureMerchant(data.merchant_id, data.merchant, data.category)
    const amountFactor = clamp(data.amount / 18, 5, 30)
    const foreignAccount = data.fraud_indicators?.is_foreign_account || data.account_country !== 'US'
    const highAmount = data.fraud_indicators?.is_high_amount || data.amount > 500
    const fraudSignals = [data.is_fraud, foreignAccount, highAmount].filter(Boolean).length
    let riskScore = 40 + amountFactor + fraudSignals * 14
    if (data.status !== 'completed') riskScore += 6
    riskScore = clamp(riskScore, 14, 95)
    const repayment = clamp(0.9 - riskScore / 180, 0.42, 0.94)
    const location = `${data.location.city}, ${data.location.state}`
    return {
        customer_id: data.customer_id,
        customer_name: customer.name,
        customer_location: location,
        loan_product: 'PayPal Commerce',
        risk_score: Math.round(riskScore * 10) / 10,
        loan_repayment_rate: Math.round(repayment * 1000) / 1000,
        paypal_alert: fraudSignals > 0,
        transaction_amount: Math.round(data.amount * 100) / 100,
        merchant_id: merchant.id,
        merchant_name: merchant.name,
        merchant_category: merchant.category,
        timestamp: new Date(data.timestamp).getTime(),
    }
}

function normalizeAutoLoan(data: AutoLoanPayment): RiskEvent {
    const customer = resolveCustomer(data.customer_id)
    const merchant = ensureMerchant('MERCH-AUTO-001', 'Auto Loan Servicing', 'Auto Finance')
    const balanceFactor = clamp(data.remaining_balance / 4000, 8, 28)
    const statusPenalty = data.payment_status !== 'completed' ? 18 : 0
    const principalRatio = clamp(data.principal / data.amount, 0.42, 0.96)
    let riskScore = 34 + balanceFactor + statusPenalty - principalRatio * 12
    riskScore = clamp(riskScore, 16, 92)
    const repayment = clamp(principalRatio + 0.12, 0.5, 0.98)

    return {
        customer_id: data.customer_id,
        customer_name: customer.name,
        customer_location: customer.region ?? 'United States',
        loan_product: 'Auto Finance',
        risk_score: Math.round(riskScore * 10) / 10,
        loan_repayment_rate: Math.round(repayment * 1000) / 1000,
        paypal_alert: false,
        transaction_amount: Math.round(data.amount * 100) / 100,
        merchant_id: merchant.id,
        merchant_name: merchant.name,
        merchant_category: merchant.category,
        timestamp: new Date(data.timestamp).getTime(),
    }
}

function normalizeHomeLoan(data: HomeLoanPayment): RiskEvent {
    const customer = resolveCustomer(data.customer_id)
    const merchant = ensureMerchant('MERCH-HOME-001', 'Home Loan Servicing', 'Mortgage Services')
    const balanceFactor = clamp(data.remaining_balance / 20000, 6, 32)
    const statusPenalty = data.payment_status !== 'completed' ? 20 : 0
    const principalRatio = clamp(data.principal / data.amount, 0.4, 0.95)
    const escrowRelief = clamp(data.escrow / 400, 0, 8)
    let riskScore = 36 + balanceFactor + statusPenalty - principalRatio * 10 - escrowRelief
    riskScore = clamp(riskScore, 18, 94)
    const repayment = clamp(principalRatio + 0.08, 0.48, 0.96)
    const location = `${data.property_info.city}, ${data.property_info.state}`
    return {
        customer_id: data.customer_id,
        customer_name: customer.name,
        customer_location: location,
        loan_product: data.loan_type || 'Mortgage Servicing',
        risk_score: Math.round(riskScore * 10) / 10,
        loan_repayment_rate: Math.round(repayment * 1000) / 1000,
        paypal_alert: false,
        transaction_amount: Math.round(data.amount * 100) / 100,
        merchant_id: merchant.id,
        merchant_name: merchant.name,
        merchant_category: merchant.category,
        timestamp: new Date(data.timestamp).getTime(),
    }
}

function normalizeRecord(record: StreamRecord): RiskEvent {
    switch (record.stream) {
        case 'credit-card-transactions':
            return normalizeCreditCard(record.data)
        case 'paypal-transactions':
            return normalizePaypal(record.data)
        case 'auto-loan-payments':
            return normalizeAutoLoan(record.data)
        case 'home-loan-payments':
            return normalizeHomeLoan(record.data)
        default:
            return normalizeCreditCard((record as { data: CreditCardTransaction }).data)
    }
}

function generateCreditCardRecord(): StreamRecord {
    const customer = pick(CUSTOMERS)
    const merchant = pick([MERCHANT_DIRECTORY.get('MERCH-000059'), MERCHANT_DIRECTORY.get('MERCH-000566')].filter(Boolean) as MerchantReference[])
    const amount = Math.round(randomBetween(38, 980) * 100) / 100
    return {
        stream: 'credit-card-transactions',
        data: {
            transaction_id: createId('CC'),
            timestamp: new Date(Date.now() - randomBetween(0, 120000)).toISOString(),
            customer_id: customer.id,
            merchant_id: merchant.id,
            card_number: `****-****-****-${`${Math.floor(randomBetween(0, 9999))}`.padStart(4, '0')}`,
            merchant: merchant.name,
            category: pick(CARD_CATEGORIES),
            amount,
            currency: 'USD',
            location: {
                city: pick(CITIES),
                state: pick(STATES),
                zip: formatZip(),
            },
            status: Math.random() < 0.85 ? 'approved' : Math.random() < 0.5 ? 'declined' : 'pending',
            is_fraud: Math.random() < 0.12,
            is_cancelled_card: Math.random() < 0.04,
            fraud_indicators: {
                is_cancelled_card: Math.random() < 0.03,
                is_high_amount: amount > 650,
            },
        },
    }
}

function generatePaypalRecord(): StreamRecord {
    const customer = pick(CUSTOMERS)
    const merchant = pick([MERCHANT_DIRECTORY.get('MERCH-000533'), MERCHANT_DIRECTORY.get('MERCH-000566'), MERCHANT_DIRECTORY.get('MRC-001')].filter(Boolean) as MerchantReference[])
    const amount = Math.round(randomBetween(24, 780) * 100) / 100
    return {
        stream: 'paypal-transactions',
        data: {
            transaction_id: createId('PP'),
            timestamp: new Date(Date.now() - randomBetween(0, 160000)).toISOString(),
            customer_id: customer.id,
            merchant_id: merchant.id,
            paypal_email: `${customer.name.toLowerCase().replace(/[^a-z]/g, '')}${Math.floor(randomBetween(100, 999))}@example.com`,
            merchant: merchant.name,
            category: pick(PAYPAL_CATEGORIES),
            amount,
            currency: 'USD',
            account_country: Math.random() < 0.15 ? pick(['GB', 'CA', 'DE', 'FR']) : 'US',
            location: {
                city: pick(CITIES),
                state: pick(STATES),
                country: Math.random() < 0.15 ? pick(['GB', 'CA', 'DE', 'FR']) : 'US',
            },
            status: Math.random() < 0.82 ? 'completed' : Math.random() < 0.5 ? 'held' : 'refunded',
            is_fraud: Math.random() < 0.09,
            fraud_indicators: {
                is_foreign_account: Math.random() < 0.1,
                is_high_amount: amount > 540,
                account_age_days: Math.floor(randomBetween(120, 4200)),
            },
        },
    }
}

function generateAutoLoanRecord(): StreamRecord {
    const customer = pick(CUSTOMERS)
    const vehicle = pick(VEHICLES)
    const amount = Math.round(randomBetween(320, 920) * 100) / 100
    const principal = Math.round(amount * randomBetween(0.68, 0.92) * 100) / 100
    const interest = Math.round((amount - principal) * randomBetween(0.6, 1.4) * 100) / 100
    return {
        stream: 'auto-loan-payments',
        data: {
            payment_id: createId('AUTO'),
            timestamp: new Date(Date.now() - randomBetween(0, 180000)).toISOString(),
            loan_id: `AL-${Math.floor(randomBetween(100000, 999999))}`,
            customer_id: customer.id,
            amount,
            principal,
            interest,
            remaining_balance: Math.round(randomBetween(3200, 18200) * 100) / 100,
            payment_method: Math.random() < 0.7 ? 'ACH' : Math.random() < 0.5 ? 'Wire Transfer' : 'Debit Card',
            payment_status: Math.random() < 0.88 ? 'completed' : Math.random() < 0.5 ? 'late' : 'pending',
            due_date: new Date(Date.now() + randomBetween(2, 12) * 24 * 3600 * 1000).toISOString(),
            vehicle_info: vehicle,
        },
    }
}

function generateHomeLoanRecord(): StreamRecord {
    const customer = pick(CUSTOMERS)
    const amount = Math.round(randomBetween(1400, 3200) * 100) / 100
    const principal = Math.round(amount * randomBetween(0.74, 0.92) * 100) / 100
    const interest = Math.round((amount - principal) * randomBetween(0.8, 1.2) * 100) / 100
    return {
        stream: 'home-loan-payments',
        data: {
            payment_id: createId('HOME'),
            timestamp: new Date(Date.now() - randomBetween(0, 240000)).toISOString(),
            loan_id: `HL-${Math.floor(randomBetween(100000, 999999))}`,
            customer_id: customer.id,
            amount,
            principal,
            interest,
            escrow: Math.round(randomBetween(450, 820) * 100) / 100,
            remaining_balance: Math.round(randomBetween(120000, 420000) * 100) / 100,
            payment_method: Math.random() < 0.65 ? 'ACH' : Math.random() < 0.5 ? 'Wire Transfer' : 'Debit Card',
            payment_status: Math.random() < 0.9 ? 'completed' : Math.random() < 0.5 ? 'late' : 'pending',
            due_date: new Date(Date.now() + randomBetween(5, 15) * 24 * 3600 * 1000).toISOString(),
            property_info: {
                address: `${Math.floor(randomBetween(100, 9999))} ${pick(['Pine', 'Maple', 'Cedar', 'Oak', 'Elm'])} St`,
                city: pick(CITIES),
                state: pick(STATES),
                zip: formatZip(),
                property_type: pick(PROPERTY_TYPES),
            },
            loan_type: Math.random() < 0.3 ? 'FHA' : Math.random() < 0.5 ? 'Conventional' : 'VA',
        },
    }
}

const STREAM_BUILDERS: Array<() => StreamRecord> = [
    generateCreditCardRecord,
    generatePaypalRecord,
    generateAutoLoanRecord,
    generateHomeLoanRecord,
]

function buildEvent(): RiskEvent {
    const recordBuilder = pick(STREAM_BUILDERS)
    const record = recordBuilder()
    return normalizeRecord(record)
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