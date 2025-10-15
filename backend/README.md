# Unified Risk Intelligence Backend

This backend powers the Unified Risk Intelligence Platform. It orchestrates autonomous Kafka-driven agents, enriches fraud events with AI, and streams live updates to the frontend dashboard.

## Architecture

```
/backend
├── agents
│   ├── risk_scoring_agent.py      # Calculates customer risk scores from loan and transaction events
│   ├── anomaly_agent.py           # Detects anomalous risk profiles and raises fraud alerts
│   ├── fraud_analysis_agent.py    # Calls OpenAI to produce human-readable explanations
│   └── notification_agent.py      # Streams fraud explanations to the API/WebSocket layer
├── api
│   ├── server.py                  # FastAPI application with REST + WebSocket support
│   ├── websocket.py               # Connection manager for live updates
│   └── routes
│        └── summary.py            # REST endpoints for summary metrics
├── config
│   └── kafka.py                   # Environment-driven Kafka configuration
├── app.py                         # Entry point that boots API or agents based on SERVICE_ROLE
├── requirements.txt
├── docker-compose.yml
├── Dockerfile
├── .env / .env.example
└── README.md
```

## Prerequisites

- Docker and Docker Compose
- Access to Kafka brokers (local or via Lenses MCP)
- OpenAI API key for the fraud analysis agent

## Environment Variables

| Variable | Description |
| --- | --- |
| `KAFKA_BROKERS` | Comma-separated list of Kafka bootstrap servers |
| `OPENAI_API_KEY` | Secret key for the OpenAI API |
| `OPENAI_MODEL` | Optional model override (defaults to `gpt-4o-mini`) |
| `CLIENT_ORIGIN` | Allowed CORS origin for the frontend |
| `PORT` | API port (default `4000`) |
| `SERVICE_ROLE` | `api`, `risk-agent`, `anomaly-agent`, or `fraud-agent` |
| `CONSUMER_GROUP_PREFIX` | Prefix for Kafka consumer groups |

Copy `.env.example` to `.env` and fill in your secrets:

```bash
cp backend/.env.example backend/.env
# edit backend/.env
```

## Running Locally

1. **Start infrastructure and API**

   ```bash
   cd backend
   docker-compose up --build
   ```

   This launches Zookeeper, Kafka, and the backend API container. The API listens on `http://localhost:4000`.

2. **Run standalone agents (optional for horizontal scaling)**

   Each agent can be started in its own container by overriding `SERVICE_ROLE`:

   ```bash
   docker run --rm \
     --env-file backend/.env \
     -e SERVICE_ROLE=risk-agent \
     unified-risk-backend:latest
   ```

   Available roles: `risk-agent`, `anomaly-agent`, `fraud-agent`.

3. **Connect to Lenses MCP**

   Configure Lenses to point to the same Kafka brokers defined in `.env`. Topics expected by the platform:

    - `loan_payments`
    - `transactions`
    - `risk_scores`
    - `fraud_alerts`
    - `fraud_explanations`

   Agents automatically consume/produce these topics as part of their pipelines.

## API Reference

- `GET /api/summary` – Returns aggregate KPIs (average risk, total alerts, customer counts).
- `GET /api/customers` – Lists recent customers and their risk scores.
- `WS /ws/updates` – Streams live `fraud_explanation` events to the frontend.

## Observability & Safety

- Structured logging with masking for sensitive data.
- Graceful shutdown signals ensure Kafka consumers close cleanly.
- Agents can be scaled independently by running additional containers per role.

## Development Tips

- Install dependencies locally:

  ```bash
  python -m venv .venv
  source .venv/bin/activate
  pip install -r backend/requirements.txt
  ```

- Start the API for local development:

  ```bash
  uvicorn backend.api.server:create_app --factory --port 4000
  ```

- Use Kafka tools (e.g., `kafka-console-producer`) or Lenses MCP streams to publish test events and observe the cascading agent behavior.