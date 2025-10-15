import { useMemo } from 'react'
import { useRiskContext } from './RiskContext'

export function useFilteredCustomers() {
    const { customers, globalSearch, filters } = useRiskContext()
    const search = globalSearch.trim().toLowerCase()
    return useMemo(() => {
        return customers.filter((customer) => {
            const matchesSearch =
                !search ||
                customer.name.toLowerCase().includes(search) ||
                customer.id.toLowerCase().includes(search) ||
                customer.location.toLowerCase().includes(search)
            const matchesRisk = filters.customerRisk === 'all' || customer.riskLevel === filters.customerRisk
            return matchesSearch && matchesRisk
        })
    }, [customers, search, filters.customerRisk])
}

export function useFilteredMerchants() {
    const { merchants, globalSearch, filters } = useRiskContext()
    const search = globalSearch.trim().toLowerCase()
    return useMemo(() => {
        return merchants.filter((merchant) => {
            const matchesSearch =
                !search ||
                merchant.name.toLowerCase().includes(search) ||
                merchant.id.toLowerCase().includes(search) ||
                merchant.category.toLowerCase().includes(search)
            const matchesCategory =
                filters.merchantCategory === 'all' || merchant.category === filters.merchantCategory
            return matchesSearch && matchesCategory
        })
    }, [merchants, search, filters.merchantCategory])
}

export function useAlertsFeed(limit = 20) {
    const { alerts } = useRiskContext()
    return useMemo(() => alerts.slice(0, limit), [alerts, limit])
}

export function usePaypalActivity(limit = 10) {
    const { paypalActivity } = useRiskContext()
    return useMemo(() => paypalActivity.slice(0, limit), [paypalActivity, limit])
}