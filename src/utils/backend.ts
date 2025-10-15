const normalizePath = (path: string) => {
    if (!path) return '/'
    return path.startsWith('/') ? path : `/${path}`
}

const sanitizeBase = (value: string | undefined) => {
    if (!value) return ''
    return value.replace(/\/$/, '')
}

const API_BASE = sanitizeBase(import.meta.env.VITE_API_BASE_URL)
const WS_BASE = sanitizeBase(import.meta.env.VITE_WS_BASE_URL)

type FetchOptions = {
    signal?: AbortSignal
}

function resolveApiBase(): string {
    if (API_BASE) return API_BASE
    if (typeof window !== 'undefined') {
        return `${window.location.origin}`
    }
    return ''
}

export function getApiUrl(path: string): string {
    const base = resolveApiBase()
    if (!base) return normalizePath(path)
    return `${base}${normalizePath(path)}`
}

function resolveWebSocketBase(): string | null {
    if (WS_BASE) return WS_BASE
    if (API_BASE) {
        try {
            const url = new URL(API_BASE, typeof window !== 'undefined' ? window.location.origin : undefined)
            url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
            return `${url.origin}`
        } catch (error) {
            return null
        }
    }
    if (typeof window !== 'undefined') {
        const { protocol, host } = window.location
        const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:'
        return `${wsProtocol}//${host}`
    }
    return null
}

export function getWebSocketUrl(path = '/ws/updates'): string | null {
    const base = resolveWebSocketBase()
    if (!base) return null
    return `${sanitizeBase(base)}${normalizePath(path)}`
}

async function fetchJson<T>(path: string, { signal }: FetchOptions = {}): Promise<T> {
    const response = await fetch(getApiUrl(path), {
        method: 'GET',
        headers: {
            Accept: 'application/json',
        },
        signal,
    })

    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
    }

    return (await response.json()) as T
}

type SummaryResponse = {
    average_risk_score?: number
    total_alerts?: number
    total_customers?: number
}

type CustomersResponse = {
    customers?: Array<Record<string, unknown>>
}

export async function fetchSummary(options?: FetchOptions) {
    return fetchJson<SummaryResponse>('/api/summary', options)
}

export async function fetchRecentCustomers(options?: FetchOptions) {
    return fetchJson<CustomersResponse>('/api/customers', options)
}