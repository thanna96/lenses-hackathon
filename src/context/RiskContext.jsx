/* eslint-disable react-refresh/only-export-components */
import {createContext, useContext, useEffect, useMemo, useRef, useState} from 'react'
import {createRiskSocket, socketReferenceData} from '../utils/socket'

const RiskContext = createContext(null)
const LOCATIONS = [
    'London, UK',
    'New York, USA',
    'Singapore',
    'Berlin, DE',
    'Toronto, CA',
    'Lisbon, PT',
    'San Diego, AZ',
    'Phoenix, TX',
    'Philadelphia, FL',
]
const LOAN_PRODUCTS = [
    'SMB Flex Loan',
    'Invoice Advance',
    'Growth Credit',
    'Merchant Cash Boost',
    'Revolving Credit',
    'Auto Finance',
    'Mortgage Servicing',
    'PayPal Commerce',
]

function pick(list) {
    return list[Math.floor(Math.random() * list.length)]
}

function randomBetween(min, max) {
    return Math.random() * (max - min) + min
}

function determineRiskLevel(score) {
    if (score >= 80) return 'High'
    if (score >= 55) return 'Medium'
    return 'Low'
}

function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: value >= 100000 ? 0 : 2,
    }).format(value)
}

const baseCustomers = socketReferenceData.customers.map((customer, index) => {
    const riskScore = Math.round(randomBetween(32, 72) * 10) / 10
    return {
        id: customer.id,
        name: customer.name,
        riskScore,
        riskLevel: determineRiskLevel(riskScore),
        balance: Math.round(randomBetween(5200, 98000)),
        lastActivity: Date.now() - Math.floor(randomBetween(2, 48)) * 3600 * 1000,
        loanProduct: customer.loan_product_hint || LOAN_PRODUCTS[index % LOAN_PRODUCTS.length],
        loanExposure: Math.round(randomBetween(15000, 120000)),
        loanRepaymentRate: Math.round(randomBetween(0.72, 0.94) * 1000) / 1000,
        paypalAlerts: 0,
        totalPayments: Math.round(randomBetween(45000, 210000)),
        location: customer.region || LOCATIONS[index % LOCATIONS.length],
    }
})

const baseMerchants = socketReferenceData.merchants.map((merchant) => {
    const fraudRate = Math.round(randomBetween(0.8, 4.4) * 10) / 10
    const transactionVolume = Math.round(randomBetween(125000, 820000))
    return {
        id: merchant.id,
        name: merchant.name,
        category: merchant.category,
        riskLevel: fraudRate > 3 ? 'High' : fraudRate > 2 ? 'Elevated' : 'Stable',
        fraudRate,
        disputes: Math.round(randomBetween(3, 42)),
        transactionVolume,
        averageTicket: Math.round(transactionVolume / randomBetween(420, 1150)),
        lastAlert: Date.now() - Math.floor(randomBetween(1, 18)) * 3600 * 1000,
    }
})


function inferLoanProductFromEvent(event) {
    if (event.loan_product) return event.loan_product
    const category = (event.merchant_category || '').toLowerCase()
    if (category.includes('auto')) return 'Auto Finance'
    if (category.includes('mortgage') || category.includes('home')) return 'Mortgage Servicing'
    if (category.includes('paypal')) return 'PayPal Commerce'
    if (category.includes('loan')) return 'SMB Flex Loan'
    return 'Growth Credit'
}

function createCustomerFromEvent(event) {
    const sanitizedRisk = Math.round(Math.min(99, Math.max(5, event.risk_score)) * 10) / 10
    const normalizedRate =
        typeof event.loan_repayment_rate === 'number'
            ? Math.round(Math.min(0.99, Math.max(0.4, event.loan_repayment_rate)) * 1000) / 1000
            : Math.round(randomBetween(0.72, 0.94) * 1000) / 1000
    return {
        id: event.customer_id,
        name: event.customer_name || event.customer_id,
        riskScore: sanitizedRisk,
        riskLevel: determineRiskLevel(sanitizedRisk),
        balance: Math.round(randomBetween(5200, 98000)),
        lastActivity: event.timestamp,
        loanProduct: inferLoanProductFromEvent(event),
        loanExposure: Math.round(randomBetween(15000, 120000)),
        loanRepaymentRate: normalizedRate,
        paypalAlerts: event.paypal_alert ? 1 : 0,
        totalPayments: Math.round(event.transaction_amount || 0),
        location: event.customer_location || pick(LOCATIONS),
    }
}

function createMerchantFromEvent(event) {
    const baseFraud = Math.round((Math.min(6, Math.max(0.8, event.risk_score / 18)) * 10)) / 10
    return {
        id: event.merchant_id,
        name: event.merchant_name || event.merchant_id,
        category: event.merchant_category || 'General',
        riskLevel: baseFraud > 4 ? 'Critical' : baseFraud > 3 ? 'High' : baseFraud > 2 ? 'Elevated' : 'Stable',
        fraudRate: baseFraud,
        disputes: event.paypal_alert ? 1 : 0,
        transactionVolume: Math.max(2500, Math.round((event.transaction_amount || 0) * 6)),
        averageTicket: Math.max(12, Math.round(event.transaction_amount || randomBetween(40, 420))),
        lastAlert: event.timestamp,
    }
}

const initialSummary = {
    activeCustomers: baseCustomers.length,
    averageRisk: Math.round(
        (baseCustomers.reduce((acc, customer) => acc + customer.riskScore, 0) / baseCustomers.length) * 10,
    ) / 10,
    fraudAlerts: 0,
    totalPayments: baseCustomers.reduce((acc, customer) => acc + customer.totalPayments, 0),
}

function deriveSystemHealth(averageRisk, fraudAlerts) {
    if (averageRisk < 45 && fraudAlerts < 5) return { label: 'Optimal', tone: 'low' }
    if (averageRisk < 65 && fraudAlerts < 12) return { label: 'Stable', tone: 'medium' }
    if (averageRisk < 75) return { label: 'Elevated Risk', tone: 'medium' }
    return { label: 'Critical', tone: 'high' }
}

export function RiskProvider({ children }) {
    const [customers, setCustomers] = useState(baseCustomers)
    const [merchants, setMerchants] = useState(baseMerchants)
    const [alerts, setAlerts] = useState([])
    const [events, setEvents] = useState([])
    const [summary, setSummary] = useState(initialSummary)
    const [trend, setTrend] = useState(() => {
        const now = Date.now()
        return Array.from({ length: 12 }).map((_, index) => {
            const timestamp = now - (11 - index) * 60000
            return {
                timestamp,
                averageRisk: initialSummary.averageRisk + Math.sin(index / 2.5) * 3,
            }
        })
    })
    const [loanPerformance, setLoanPerformance] = useState(() =>
        baseCustomers.map((customer) => ({
            id: customer.id,
            name: customer.name,
            rate: customer.loanRepaymentRate,
            product: customer.loanProduct,
        })),
    )
    const [paypalActivity, setPaypalActivity] = useState([])
    const [processedEvents, setProcessedEvents] = useState(0)
    const [globalSearch, setGlobalSearch] = useState('')
    const [filters, setFilters] = useState({ customerRisk: 'all', merchantCategory: 'all' })
    const [systemHealth, setSystemHealth] = useState(() => deriveSystemHealth(initialSummary.averageRisk, 0))
    const [theme, setTheme] = useState('dark')
    const customersRef = useRef(customers)

    useEffect(() => {
        customersRef.current = customers
    }, [customers])

    useEffect(() => {
        document.documentElement.dataset.theme = theme
    }, [theme])

    useEffect(() => {
        let isActive = true
        async function loadSummary() {
            try {
                const response = await fetch('/api/risk-summary')
                if (!response.ok) throw new Error('placeholder not available')
                const data = await response.json()
                if (!isActive) return
                if (data?.summary) {
                    setSummary((current) => ({ ...current, ...data.summary }))
                }
            } catch {
                // Placeholder for future integration - safely ignored for now
            }
        }
        loadSummary()
        return () => {
            isActive = false
        }
    }, [])

    useEffect(() => {
        const socket = createRiskSocket(2400)
        const unsubscribe = socket.subscribe((event) => {
            setProcessedEvents((count) => count + 1)
            setEvents((previous) => {
                const next = [...previous, event]
                return next.slice(-60)
            })

            let updatedCustomers = customersRef.current
            setCustomers((prev) => {
                let found = false
                const mapped = prev.map((customer) => {
                    if (customer.id !== event.customer_id) return customer
                    found = true
                    const updatedRisk = Math.round((customer.riskScore * 2 + event.risk_score) / 3)
                    const adjustedRisk = Math.min(99, Math.max(5, updatedRisk + (event.paypal_alert ? 6 : 0)))
                    const normalizedRate =
                        typeof event.loan_repayment_rate === 'number'
                            ? Math.round(((customer.loanRepaymentRate * 4 + event.loan_repayment_rate) / 5) * 1000) / 1000
                            : customer.loanRepaymentRate
                    return {
                        ...customer,
                        riskScore: Math.round(adjustedRisk * 10) / 10,
                        riskLevel: determineRiskLevel(adjustedRisk),
                        lastActivity: event.timestamp,
                        loanRepaymentRate: normalizedRate,
                        paypalAlerts: customer.paypalAlerts + (event.paypal_alert ? 1 : 0),
                        totalPayments: customer.totalPayments + (event.transaction_amount || 0),
                        loanProduct: event.loan_product || customer.loanProduct,
                        location: event.customer_location || customer.location,
                    }
                })
                if (!found) {
                    const created = createCustomerFromEvent(event)
                    const combined = [...mapped, created]
                    updatedCustomers = combined
                    customersRef.current = combined
                    return combined
                }
                updatedCustomers = mapped
                customersRef.current = mapped
                return mapped
            })

            setMerchants((prev) => {
                let found = false
                const mapped = prev.map((merchant) => {
                    if (merchant.id !== event.merchant_id) return merchant
                    found = true
                    const nextDisputes = merchant.disputes + (event.paypal_alert ? 1 : 0)
                    const updatedFraud = Math.round((merchant.fraudRate * 0.9 + (event.paypal_alert ? 4.5 : 1.8)) * 10) / 10
                    return {
                        ...merchant,
                        transactionVolume: merchant.transactionVolume + (event.transaction_amount || 0),
                        fraudRate: Math.min(6, updatedFraud),
                        riskLevel: updatedFraud > 4 ? 'Critical' : updatedFraud > 3 ? 'High' : updatedFraud > 2 ? 'Elevated' : 'Stable',
                        disputes: nextDisputes,
                        lastAlert: event.timestamp,
                    }
                })
                if (!found && event.merchant_id) {
                    return [...mapped, createMerchantFromEvent(event)]
                }
                return mapped
            })

            const averageRisk =
                Math.round((updatedCustomers.reduce((acc, item) => acc + item.riskScore, 0) / updatedCustomers.length) * 10) /
                10

            setSummary((current) => ({
                activeCustomers: updatedCustomers.filter((item) => item.riskScore < 80).length,
                averageRisk,
                fraudAlerts: current.fraudAlerts + (event.paypal_alert ? 1 : 0) + (event.risk_score > 82 ? 1 : 0),
                totalPayments: current.totalPayments + (event.transaction_amount || 0),
            }))

            setTrend((current) => {
                const next = [...current, { timestamp: event.timestamp, averageRisk }]
                return next.slice(-24)
            })

            setLoanPerformance((current) => {
                const normalizedRate =
                    typeof event.loan_repayment_rate === 'number'
                        ? Math.round(event.loan_repayment_rate * 1000) / 1000
                        : Math.round(randomBetween(0.7, 0.92) * 1000) / 1000
                const exists = current.find((item) => item.id === event.customer_id)
                if (exists) {
                    return current.map((item) =>
                        item.id === event.customer_id
                            ? {
                                ...item,
                                rate: Math.round(((item.rate * 6 + normalizedRate) / 7) * 1000) / 1000,
                                product: event.loan_product || item.product,
                            }
                            : item,
                    )
                }
                return [
                    ...current,
                    {
                        id: event.customer_id,
                        name: event.customer_name,
                        rate: normalizedRate,
                        product: inferLoanProductFromEvent(event),
                    },
                ]
            })

            if (event.paypal_alert || event.risk_score >= 82) {
                const severity = event.risk_score >= 90 ? 'critical' : event.paypal_alert ? 'high' : 'medium'
                setAlerts((current) => {
                    const next = [
                        {
                            id: `ALT-${event.timestamp}`,
                            title:
                                severity === 'critical'
                                    ? 'Critical Fraud Risk'
                                    : event.paypal_alert
                                        ? 'PayPal Alert Detected'
                                        : 'Elevated Risk Movement',
                            message: `${event.customer_name} reported a score of ${event.risk_score} via ${event.merchant_name}.`,
                            severity,
                            merchant: event.merchant_name,
                            timestamp: event.timestamp,
                        },
                        ...current,
                    ]
                    return next.slice(0, 25)
                })
                setPaypalActivity((current) => {
                    const next = [
                        {
                            id: `ALT-${event.timestamp}`,
                            title:
                                severity === 'critical'
                                    ? 'Critical Fraud Risk'
                                    : event.paypal_alert
                                        ? 'PayPal Alert Detected'
                                        : 'Elevated Risk Movement',
                            message: `${event.customer_name} reported a score of ${event.risk_score} via ${event.merchant_name}.`,
                            severity,
                            merchant: event.merchant_name,
                            timestamp: event.timestamp,
                        },
                        ...current,
                    ]
                    return next.slice(0, 25)
                })
                setPaypalActivity((current) => {
                    const next = [
                        {
                            id: `PP-${event.timestamp}`,
                            customer: event.customer_name,
                            merchant: event.merchant_name,
                            amount: event.transaction_amount,
                            riskScore: event.risk_score,
                            timestamp: event.timestamp,
                        },
                        ...current,
                    ]
                    return next.slice(0, 15)
                })
            }
        })

        return () => {
            unsubscribe()
            socket.close()
        }
    }, [])

    useEffect(() => {
        setSystemHealth(deriveSystemHealth(summary.averageRisk, summary.fraudAlerts))
    }, [summary.averageRisk, summary.fraudAlerts])

    const formattedSummary = useMemo(
        () => ({
            ...summary,
            totalPaymentsFormatted: formatCurrency(summary.totalPayments),
            averageRiskFormatted: `${summary.averageRisk.toFixed(1)}%`,
        }),
        [summary],
    )

    const value = useMemo(
        () => ({
            customers,
            merchants,
            alerts,
            events,
            summary: formattedSummary,
            trend,
            loanPerformance,
            paypalActivity,
            processedEvents,
            systemHealth,
            theme,
            globalSearch,
            filters,
            setGlobalSearch,
            setFilters,
            toggleTheme: () => setTheme((current) => (current === 'dark' ? 'light' : 'dark')),
        }),
        [
            customers,
            merchants,
            alerts,
            events,
            formattedSummary,
            trend,
            loanPerformance,
            paypalActivity,
            processedEvents,
            systemHealth,
            theme,
            globalSearch,
            filters,
        ],
    )

    return <RiskContext.Provider value={value}>{children}</RiskContext.Provider>
}

export function useRiskContext() {
    const context = useContext(RiskContext)
    if (!context) throw new Error('useRiskContext must be used inside RiskProvider')
    return context
}
