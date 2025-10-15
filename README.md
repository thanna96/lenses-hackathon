# Lenses Hackathon Risk Operations Dashboard

A live risk operations dashboard built for the Lenses hackathon. The app simulates a fintech control center where risk analysts monitor customer health, merchant exposure, and PayPal escalations in real time. It is implemented with React 19, Vite, and Tailwind CSS, and ships with a mock socket layer that continuously updates the UI with realistic transaction data.

## Features

- **Real-time event stream** – `RiskContext` hydrates the UI with simulated customer, merchant, and alert events, mirroring the shape of a future WebSocket feed.
- **Operational dashboards** – Dedicated views for the executive dashboard, customer monitoring, merchant analytics, and alert triage.
- **Global theming** – Dark-first design powered by Tailwind tokens and the `data-theme` attribute, ready for light mode or custom themes.
- **Extensible architecture** – Components are organised into `components/`, `context/`, `pages/`, and `utils/` for clean separation of concerns.

## Project structure

```
├── index.html              # Root HTML template used by Vite
├── src
│   ├── App.jsx             # Entry point with lightweight router & providers
│   ├── components          # UI building blocks (tables, charts, layout)
│   ├── context             # Risk data provider & memoised selectors
│   ├── pages               # Route-level views (Dashboard, Customers, etc.)
│   ├── utils               # Socket simulator and shared helpers
│   └── main.jsx            # React bootstrap (creates root, mounts <App />)
├── tailwind.config.js      # Tailwind theme extensions
├── vite.config.js          # Vite bundler configuration
└── package.json            # Scripts and dependency declarations
```

## Getting started

### 1. Prerequisites

- Node.js **18.18+** or **20+** (ESM-only project)
- npm **9+** (comes with the Node.js LTS installers)

> ℹ️ Install Node via [nvm](https://github.com/nvm-sh/nvm) or [NodeSource](https://github.com/nodesource/distributions) to switch between versions effortlessly.

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

Vite prints a local URL (by default `http://localhost:5173`). Open it in your browser to explore the dashboard. Hot Module Replacement (HMR) is enabled out of the box.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the Vite development server with HMR. |
| `npm run build` | Produces an optimised production build in `dist/`. |
| `npm run preview` | Serves the production build locally for QA. |
| `npm run lint` | Runs ESLint against the entire project. |

## Data & state management

- `src/context/RiskContext.jsx` seeds baseline data for customers, merchants, summary cards, and system health.
- A mock socket (`src/utils/socket.js`) emits events every few seconds. The context consumes these events to update risk scores, fraud counts, PayPal activity, and alert feeds.
- Selectors in `src/context/useRiskSelectors.js` memoise derived slices (e.g., PayPal activity window) so that components stay performant as the event stream grows.

When a real backend is ready, replace `createRiskSocket` with your WebSocket client or server-sent events handler. The interface is promise-friendly and returns an unsubscribe function to clean up listeners.

## Styling and theming

- Tailwind is configured with semantic colour tokens (`base-*`, `surface-*`, `risk-*`) to keep UI intent-driven.
- The document `<html>` element receives a `data-theme` attribute; swap it in `RiskContext` to apply alternative themes.
- Global styles live in `src/index.css`, including glassmorphism panels, badges, and charts.

## Extending the project

- **Add data integrations** – Replace the placeholder `fetch('/api/risk-summary')` in `RiskContext` with your REST endpoint to hydrate initial metrics.
- **Connect a real socket** – Update `createRiskSocket` to use your messaging layer (WebSocket, MQTT, etc.). Keep the same `subscribe` API for zero-downtime migration.
- **Introduce authentication** – Wrap `<App />` with an auth provider and guard routes inside `AppShell` as needed.
- **Build new pages** – Drop a component in `src/pages/`, register it inside the `routes` map in `App.jsx`, and add navigation entries via the `Sidebar` component.

## Troubleshooting

- **Port already in use** – Set `VITE_PORT` or pass `--port` when running `npm run dev` (e.g., `npm run dev -- --port 5174`).
- **Socket errors in production** – Ensure your build pipeline proxies `/api/*` routes or disable the placeholder fetch if the backend is unavailable.
- **Lint issues** – Run `npm run lint -- --fix` to automatically resolve formatting problems flagged by ESLint.

## License

This project was created for hackathon purposes. Adapt or extend it as needed for your organisation's risk operations tooling.