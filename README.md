# IKIP — Industrial Knowledge Intelligence Platform

<div align="center">
  <img src="https://img.shields.io/badge/Node.js-v20%2B-brightgreen?logo=node.js" alt="Node.js">
  <img src="https://img.shields.io/badge/Python-3.11%2B-blue?logo=python" alt="Python">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react" alt="React">
  <img src="https://img.shields.io/badge/FastAPI-0.112-009688?logo=fastapi" alt="FastAPI">
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb" alt="MongoDB">
  <img src="https://img.shields.io/badge/Qdrant-Cloud-EF4444" alt="Qdrant">
  <img src="https://img.shields.io/badge/Neo4j-Optional-blue?logo=neo4j" alt="Neo4j">
  <img src="https://img.shields.io/badge/Redis-Upstash-DC382D?logo=redis" alt="Redis">
</div>

<br/>

> **IKIP** is an enterprise-grade GenAI platform built for heavy industrial facilities. It connects equipment documentation, regulatory standards, maintenance records, and incident history into a unified AI-powered knowledge base — enabling engineers to query assets, trace compliance gaps, diagnose failures, and operate offline.

---

## ✨ Features at a Glance

| Module | Description |
|--------|-------------|
| 📄 **Document Ingestion** | Upload PDFs/manuals → OCR → embedding → Knowledge Graph linking |
| 🤖 **AI Copilot (RAG)** | Hybrid dense+sparse search over ingested docs with Gemini-grounded streaming answers |
| 🕸️ **Knowledge Graph Explorer** | Cytoscape-powered visual graph of Equipment/Incidents/Documents/Regulations |
| 🔍 **RCA Agent (5-Whys)** | LangGraph agent that auto-diagnoses corrective work orders |
| ✅ **Compliance Radar** | Scans SOPs against OISD-118, PESO, Factory Act, flags non-conformity gaps |
| 📱 **Field Tag Scanner** | PWA with QR simulation, asset lookups, and IndexedDB offline caching |
| 📊 **Maintenance Intel** | Work orders, failure pattern mining, equipment health timelines |
| 🔔 **Live Alerts** | Socket.IO real-time push of ingestion status, compliance alerts, pattern warnings |

---

## 🗂️ Repository Structure

```
ET_AI/
├── .env                          ← Central environment configuration (all services)
├── package.json                  ← Node.js monorepo workspace root
├── docker-compose.yml            ← Optional: spin up local Redis (if not using Upstash)
│
├── packages/
│   ├── shared/                   ← TypeScript types shared across backend & frontend
│   │   └── src/types/            ← GraphNode, GraphEdge, JWTPayload, DocType, etc.
│   │
│   ├── backend/                  ← Node.js Express API server
│   │   └── src/
│   │       ├── config/           ← DB connections (MongoDB, Redis, Neo4j, env)
│   │       ├── routes/           ← REST API routes (auth, docs, kg, equipment, etc.)
│   │       ├── services/         ← Business logic (KG service with mock fallback)
│   │       ├── jobs/             ← BullMQ workers (ingestion, compliance)
│   │       ├── middleware/       ← JWT auth, RBAC, rate-limit, upload
│   │       ├── models/           ← Mongoose ODM models
│   │       └── socket/           ← Socket.IO event handlers
│   │
│   └── frontend/                 ← React 18 + Vite SPA (PWA-ready)
│       └── src/
│           ├── api/              ← Axios API clients (auth, kg, documents, plant)
│           ├── components/       ← Shared UI components (Layout, Sidebar, etc.)
│           ├── hooks/            ← useSocket, useRAGQuery, useVoiceInput
│           ├── pages/            ← Full-page views (KnowledgeGraph, Dashboard, etc.)
│           └── store/            ← Zustand state stores (auth, notifications)
│
└── ai-services/                  ← Python FastAPI microservices
    ├── main.py                   ← FastAPI app entrypoint with lifespan hooks
    ├── requirements.txt          ← Python dependencies
    ├── config/
    │   └── settings.py           ← Pydantic settings (reads from root .env)
    ├── db/
    │   ├── mongo_client.py       ← Async MongoDB client (Motor)
    │   ├── qdrant_client.py      ← Qdrant vector DB client
    │   └── neo4j_client.py       ← Neo4j async driver (graceful offline fallback)
    └── services/
        ├── ingestion/            ← PDF OCR pipeline, chunking, embeddings, KG builder
        ├── rag/                  ← Hybrid RRF search + LangGraph Copilot agent
        ├── rca_agent/            ← 5-Whys root-cause analysis LangGraph workflow
        ├── compliance_agent/     ← Regulation vs. SOP gap detection
        └── lessons_engine/       ← Systemic failure pattern recognition
```

---

## 🔧 Prerequisites

Before you begin, install:

| Tool | Version | Purpose |
|------|---------|---------|
| [Node.js](https://nodejs.org/en/download) | v20 LTS+ | Backend + Frontend |
| [Python](https://www.python.org/downloads/) | 3.11+ | AI microservices |
| [Git](https://git-scm.com/downloads) | any | Clone the repo |
| [Poppler](https://github.com/oschwartz10612/poppler-windows/releases) | latest | PDF-to-image (pdf2image) |
| [Tesseract OCR](https://github.com/UB-Mannheim/tesseract/wiki) | 5.x | PDF text extraction fallback |

> **Cloud services** (no local installation required unless you prefer self-hosting):
> - **MongoDB Atlas** — free tier at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
> - **Upstash Redis** — free tier at [upstash.com](https://upstash.com)
> - **Qdrant Cloud** — free tier at [cloud.qdrant.io](https://cloud.qdrant.io)
> - **Google Gemini API** — free tier at [aistudio.google.com](https://aistudio.google.com/app/apikey)
> - **Neo4j** — **Optional**. The platform runs fully with mock graph data if Neo4j is offline. To use a live graph: [Neo4j Aura free tier](https://console.neo4j.io) (cloud) or `docker run -p 7474:7474 -p 7687:7687 neo4j` (local).

---

## ⚙️ Environment Setup

Create a `.env` file in the **project root** (`ET_AI/.env`). Both the Node.js backend and the Python AI services read from this file.

```bash
# ─── General ──────────────────────────────────────────
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173

# ─── MongoDB Atlas ────────────────────────────────────
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/?appName=Cluster0
MONGODB_DB_NAME=ikip_production

# ─── Redis (Upstash TLS URL or local redis://) ────────
REDIS_URL=rediss://default:<token>@<host>.upstash.io:6379

# ─── Neo4j (OPTIONAL — app works without it) ─────────
# Leave as-is if not running Neo4j; the platform uses demo graph data.
# For Neo4j Aura: NEO4J_URI=neo4j+s://<id>.databases.neo4j.io
# For local Docker: NEO4J_URI=bolt://localhost:7687
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_neo4j_password

# ─── Qdrant Vector DB ─────────────────────────────────
QDRANT_URL=https://<cluster-id>.<region>.aws.cloud.qdrant.io
QDRANT_API_KEY=<your_qdrant_api_key>
QDRANT_COLLECTION_NAME=ikip_chunks

# ─── Google AI (Gemini) ───────────────────────────────
GOOGLE_AI_API_KEY=<your_google_ai_api_key>
GEMINI_MODEL=gemini-1.5-pro
GEMINI_EMBEDDING_MODEL=text-embedding-004

# ─── Authentication ───────────────────────────────────
# Must be at least 32 characters — change these in production!
JWT_SECRET=your_super_secret_session_jwt_key_at_least_32_chars
JWT_REFRESH_SECRET=your_super_secret_refresh_jwt_key_at_least_32_chars
JWT_EXPIRY=24h
JWT_REFRESH_EXPIRY=7d

# ─── Internal Service Communication ──────────────────
AI_SERVICES_URL=http://localhost:8000
AI_SERVICES_API_KEY=secret_ai_token_key_here

# ─── File Upload ──────────────────────────────────────
MAX_FILE_SIZE_MB=100
ALLOWED_MIME_TYPES=application/pdf,image/png,image/jpeg,image/tiff,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document

# ─── Rate Limiting ────────────────────────────────────
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=200
QUERY_RATE_LIMIT_PER_MINUTE=30

# ─── Monitoring ───────────────────────────────────────
PROMETHEUS_PORT=9090
LOG_LEVEL=info
```

---

## 🚀 Installation & Running

### Step 1 — Clone and install Node.js dependencies

```bash
git clone https://github.com/<your-org>/ET_AI.git
cd ET_AI

# Install all Node.js workspace dependencies in one shot
npm install

# Build the shared TypeScript types (required before backend/frontend)
npm run build:shared
```

### Step 2 — Set up Python environment

```bash
cd ai-services

# Create a virtual environment
python -m venv venv

# Activate it
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On macOS/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Return to project root
cd ..
```

> **Note for Windows users:** If `pip install` fails on `paddleocr` or `opencv`, run:
> ```bash
> pip install paddlepaddle -f https://www.paddlepaddle.org.cn/whl/windows/mkl/avx/stable.html
> pip install paddleocr
> ```

### Step 3 — Start all three services

Open **three separate terminal windows** from the project root:

**Terminal 1 — Node.js Backend (Express API + BullMQ workers):**
```bash
npm run dev:backend
```
Expected output:
```
✅ Redis Connected successfully
✅ MongoDB Connected: cluster0.mongodb.net
✅ GridFS Bucket Initialized
👷 Background workers connected to Redis queue
✅ Neo4j Graph DB Driver Initialized (graceful-fallback mode)
🚀 IKIP Express Server running in [development] mode on port 3001
```

**Terminal 2 — Python AI Microservices (FastAPI + LangGraph):**
```bash
cd ai-services

# Activate venv first if not already active
.\venv\Scripts\Activate.ps1   # Windows
# source venv/bin/activate     # macOS/Linux

python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
Expected output:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO - Starting up IKIP AI Microservices...
INFO - Qdrant collection 'ikip_chunks' is ready
INFO - All AI services database connections successfully validated
```

**Terminal 3 — React Frontend (Vite dev server):**
```bash
npm run dev:frontend
```
Expected output:
```
  VITE v5.4.x  ready in 800 ms
  ➜  Local:   http://localhost:5173/
```

### Step 4 — Open the app

Navigate to **[http://localhost:5173](http://localhost:5173)** and register your first account.

---

## 🏗️ Architecture Overview

```
Browser (React + Cytoscape)
        │  REST + SSE + WebSocket
        ▼
┌────────────────────────────┐
│  Express Backend (:3001)   │  ◄── JWT Auth, Rate Limiting, Helmet
│  ├── /api/v1/auth          │
│  ├── /api/v1/documents     │──► GridFS (MongoDB)
│  ├── /api/v1/kg            │──► Neo4j (with mock fallback)
│  ├── /api/v1/equipment     │──► MongoDB Atlas
│  ├── /api/v1/query         │──► Python AI Services (:8000)
│  └── Socket.IO             │──► Real-time push to clients
│       BullMQ Workers       │──► Upstash Redis job queue
└────────────────────────────┘
        │
        │  HTTP (axios)
        ▼
┌────────────────────────────────────────┐
│  FastAPI AI Services (:8000)           │
│  ├── POST /ingest/document             │──► OCR → Chunk → Embed → KG
│  ├── POST /query/search                │──► Qdrant hybrid search (RRF)
│  ├── POST /query/stream                │──► Gemini streaming answer
│  ├── POST /rca/analyze                 │──► LangGraph 5-Whys agent
│  ├── POST /compliance/full-scan        │──► Clause vs SOP gap detection
│  └── POST /lessons/analyze-event      │──► Failure pattern mining
└────────────────────────────────────────┘
        │
        ├──► MongoDB Atlas    (documents, workorders, incidents, users)
        ├──► Qdrant Cloud     (dense + sparse embeddings for RAG search)
        ├──► Neo4j (optional) (Equipment/Document/Incident/Regulation graph)
        └──► Upstash Redis    (BullMQ job queues)
```

### Offline / Graceful Degradation

The platform is designed to work **without Neo4j**:
- All Knowledge Graph API endpoints fall back to realistic mock data when Neo4j is unreachable.
- The graph canvas always displays a demo industrial subgraph.
- A 🔌 info toast replaces any error toast: *"Demo graph loaded — connect Neo4j for live data"*

---

## 📱 Using the Platform

### 1. Register & Login
1. Go to [http://localhost:5173/register](http://localhost:5173/register)
2. Fill in your name, email, password, role (e.g. `Engineer`), and Plant ID (any MongoDB ObjectId, e.g. `659b8eb6a9c1e0d37e6f6630`)
3. You will be redirected to the dashboard after registration.

### 2. Upload a Document
1. Navigate to **Document Library** (`/documents`)
2. Click **Upload Document** and select a PDF (operations manual, SOP, OEM datasheet, etc.)
3. Enter a title and choose a document type (SOP, OEMManual, PID, IncidentReport, etc.)
4. Click **Start Ingestion**
5. A live toast notification tracks ingestion → OCR → Embedding → Knowledge Graph linking

### 3. Ask the AI Copilot
1. Navigate to **AI Copilot** (`/copilot`)
2. Type a question grounded in your documents:
   - *"What is the startup procedure for Pump P-101?"*
   - *"List the safety isolation steps for gas purging per OISD-116"*
3. The answer streams in with inline citations and a confidence score.
4. Voice input (🎙️) is supported on Chrome/Safari.

### 4. Explore the Knowledge Graph
1. Navigate to **Knowledge Graph** (`/kg`)
2. Choose **Cypher Console** to run preset queries or enter custom Cypher:
   ```cypher
   MATCH (e:Equipment)-[r]-(m) RETURN e, r, m LIMIT 20
   ```
3. Or use **Tag Search** to look up a specific equipment tag (e.g. `P-101`)
4. Click nodes to view properties in the side panel.

> **Without Neo4j:** A demo industrial graph is always shown so the canvas is never blank.

### 5. Run Compliance Radar
1. Navigate to **Compliance Radar** (`/compliance`)
2. Click **Run Compliance Scan** to trigger the AI scan against uploaded documents
3. Gaps are listed with severity, regulation clause, and suggested remediation.

### 6. Root Cause Analysis (5-Whys)
1. Navigate to **Maintenance Intel** (`/maintenance`)
2. Select a corrective work order ticket
3. Click **Run 5-Whys RCA** — the LangGraph agent traces failure to root cause using the Gemini model.

### 7. Field Scanner (PWA / Offline)
1. Navigate to **Field Tag Scanner** (`/scanner`)
2. Enter or scan (simulated QR) an asset tag (e.g. `P-101`)
3. Toggle **Offline Mode** to see IndexedDB-cached data when disconnected.

---

## 🔌 API Reference

The Express backend exposes REST endpoints at `http://localhost:3001/api/v1/`:

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login, returns JWT |
| GET | `/auth/me` | Get current user profile |
| GET | `/documents` | List all documents |
| POST | `/documents/upload` | Upload + queue ingestion |
| DELETE | `/documents/:id` | Delete document + KG nodes |
| POST | `/kg/query` | Run Cypher query (mock fallback) |
| GET | `/kg/equipment/:tag` | Get equipment subgraph |
| GET | `/kg/node/:nodeId` | Get node neighbors |
| GET | `/equipment` | List equipment registry |
| GET | `/equipment/:tag` | Equipment 360° passport |
| POST | `/workorders` | Create work order |
| GET | `/workorders/:id/rca` | Trigger RCA analysis |
| GET | `/compliance/dashboard` | Compliance summary |
| GET | `/dashboard/kpis` | Dashboard KPI metrics |
| GET | `/health` | Health check |
| GET | `/metrics` | Prometheus metrics |

The Python AI services API is at `http://localhost:8000/`:

| Method | Path | Description |
|--------|------|-------------|
| POST | `/ingest/document` | Start ingestion background job |
| GET | `/ingest/status/:jobId` | Poll ingestion progress |
| POST | `/query/search` | Hybrid vector search |
| POST | `/query/stream` | Stream Gemini answer tokens |
| POST | `/rca/analyze` | 5-Whys LangGraph analysis |
| POST | `/compliance/full-scan` | Run compliance agent |
| POST | `/lessons/analyze-event` | Incident pattern mining |
| GET | `/health` | Health check |

---

## 🧪 Verification Checklist

After starting all three services, verify the following:

```bash
# ✅ Backend health
curl http://localhost:3001/health
# → {"status":"OK","environment":"development"}

# ✅ AI services health  
curl http://localhost:8000/health
# → {"status":"healthy","version":"1.0.0"}

# ✅ Frontend is serving
curl -I http://localhost:5173
# → HTTP/1.1 200 OK
```

---

## 🐛 Troubleshooting

### Port 3001 already in use (`EADDRINUSE`)
```bash
# Windows — find and kill the process
netstat -ano | findstr :3001
taskkill /F /PID <pid>

# Then restart the backend
npm run dev:backend
```

### Port 8000 already in use
```bash
# Windows
netstat -ano | findstr :8000
taskkill /F /PID <pid>
```

### `tsx watch` not found
```bash
npm install -g tsx
# or use npx:
npx tsx watch packages/backend/src/server.ts
```

### Python `ModuleNotFoundError`
Make sure the venv is activated before running uvicorn:
```bash
# Windows PowerShell
cd ai-services
.\venv\Scripts\Activate.ps1
python -m uvicorn main:app --port 8000 --reload
```

### `pdf2image` — Poppler not found
Download Poppler for Windows from [oschwartz10612/poppler-windows](https://github.com/oschwartz10612/poppler-windows/releases), extract it, and add the `bin/` directory to your system `PATH`.

### Neo4j connection errors (toasts on `/kg`)
This is expected when Neo4j is not installed. The platform detects this and:
- Shows a `🔌 Demo graph loaded` info toast instead of a red error
- Renders a demo industrial subgraph on the canvas
- All other features (Copilot, Compliance, RCA) continue to work normally

To connect a live Neo4j instance:
```bash
# Option A: Neo4j Aura (cloud, free tier)
# Get URI from console.neo4j.io and update .env:
NEO4J_URI=neo4j+s://<id>.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=<your_aura_password>

# Option B: Local Docker
docker run -d \
  --name neo4j \
  -p 7474:7474 -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/your_password \
  neo4j:5
# Then set: NEO4J_URI=bolt://localhost:7687
```

### MongoDB connection failed
Ensure your MongoDB Atlas cluster:
- Has your current IP in the Network Access allowlist (or set `0.0.0.0/0` for development)
- The `MONGODB_URI` in `.env` uses the correct username/password

### Redis `ECONNREFUSED`
If using local Redis (not Upstash):
```bash
# Start with Docker
docker run -d -p 6379:6379 redis:7-alpine
# Then set in .env:
REDIS_URL=redis://localhost:6379
```

---

## 🛡️ Security Notes

- **Change all secrets** in `.env` before deploying to production
- `JWT_SECRET` and `JWT_REFRESH_SECRET` must each be at least 32 characters
- The backend uses `helmet` for HTTP security headers and `express-rate-limit` for API throttling
- CORS is restricted to `FRONTEND_URL` — update this when deploying

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TypeScript, Zustand, Tailwind CSS, Cytoscape.js, Framer Motion |
| Backend | Node.js, Express 5, TypeScript, BullMQ, Socket.IO, Mongoose, Multer/GridFS |
| AI Services | Python 3.11, FastAPI, LangGraph, LangChain, Google Gemini |
| Vector DB | Qdrant (dense `text-embedding-004` + sparse BM25) |
| Graph DB | Neo4j 5 (optional, graceful mock fallback built-in) |
| Document DB | MongoDB Atlas + GridFS for binary storage |
| Queue | Redis (Upstash) via BullMQ |
| OCR | PaddleOCR + Tesseract + pdf2image |
| Observability | Prometheus + prom-client |

---

## 📄 License

MIT © 2024 IKIP Platform Contributors
