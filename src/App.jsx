import { useCallback, useEffect, useState } from 'react'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import Merchants from './pages/Merchants'
import Alerts from './pages/Alerts'
import Sidebar from './components/layout/Sidebar'
import Topbar from './components/layout/Topbar'
import { RiskProvider } from './context/RiskContext'

const routes = {
    '/dashboard': Dashboard,
    '/customers': Customers,
    '/merchants': Merchants,
    '/alerts': Alerts,
}

function normalisePath(pathname) {
    if (!pathname || pathname === '/') return '/dashboard'
    if (routes[pathname]) return pathname
    const match = Object.keys(routes).find((routeKey) => pathname.startsWith(routeKey))
    return match || '/dashboard'
}

function RouterView({ route }) {
    const Component = routes[route] || routes['/dashboard']
    return <Component />
}

function AppShell() {
    const [route, setRoute] = useState(() => normalisePath(window.location.pathname))

    useEffect(() => {
        const handlePopstate = () => setRoute(normalisePath(window.location.pathname))
        window.addEventListener('popstate', handlePopstate)
        return () => window.removeEventListener('popstate', handlePopstate)
    }, [])

    useEffect(() => {
        if (window.location.pathname !== route) {
            window.history.replaceState({}, '', route)
        }
    }, [route])

    const navigate = useCallback(
        (path) => {
            const target = normalisePath(path)
            if (target === route) return
            window.history.pushState({}, '', target)
            setRoute(target)
        },
        [route],
    )

    return (
        <div className="app-shell">
            <Sidebar currentRoute={route} onNavigate={navigate} />
            <main className="app-main">
                <Topbar />
                <div className="app-content">
                    <RouterView route={route} />
                </div>
            </main>
        </div>
    )
}

export default function App() {
    return (
        <RiskProvider>
            <AppShell />
        </RiskProvider>
    )
}