# WildDev Images Dashboard

A modern, reactive management dashboard for the [WildDev/images](https://github.com/WildDev/images) Java image-processing service. Upload images directly, queue external URLs for processing, monitor statuses in real time, and browse your gallery — all from a clean web UI backed by a local PostgreSQL tracking database and a typed REST API proxy.

**Key capabilities**

| Feature | Details |
|---|---|
| Gallery view | Responsive grid — processed images load from the WildDev service; pending/failed cards show live status badges |
| Stats bar | Total · Processed · Queued · Failed counts, updated on every refresh |
| File upload | Drag-and-drop or file picker, forwarded to the WildDev service with optional multi-size flag |
| External URL | Queue any publicly accessible image URL for async processing |
| Delete | Single-click removal with confirmation dialog, cascades to the upstream service |
| Dark / light theme | Toggle persisted per browser, dark by default |
| Webhook sync | `POST /api/images/webhook` receives `IMAGE_READY` / `IMAGE_FAILED` events and updates local status |

---

## Screenshot

![WildDev Images Dashboard — light theme](screenshots/dashboard-light.jpg)

---

## Get Started

### Prerequisites

| Tool | Version |
|---|---|
| [Node.js](https://nodejs.org/) | ≥ 20 |
| [pnpm](https://pnpm.io/) | ≥ 9 |
| PostgreSQL | ≥ 14 |

### 1 — Clone the repository

```bash
git clone https://github.com/WildDev/images-dashboard.git
cd images-dashboard
```

### 2 — Install dependencies

```bash
pnpm install
```

### 3 — Configure environment variables

Create a `.env` file in the repository root (or export the variables in your shell):

```dotenv
# Required — PostgreSQL connection string
DATABASE_URL=postgresql://user:password@localhost:5432/images_dashboard

# Optional — URL of a running WildDev/images Java service.
# When omitted the dashboard operates in local-only mode:
# records are tracked in PostgreSQL but no actual image processing occurs.
IMAGES_SERVICE_URL=http://localhost:8000

# Required — random secret for Express session signing
SESSION_SECRET=change_me_to_something_random
```

### 4 — Push the database schema

```bash
pnpm --filter @workspace/db run push
```

This applies the Drizzle schema to your PostgreSQL database and creates the `images` table.

### 5 — Start the API server

```bash
pnpm --filter @workspace/api-server run dev
```

The server starts on **port 8080** by default (or the `PORT` environment variable).  
All API routes are served under `/api/`.

### 6 — Start the dashboard

Open a second terminal:

```bash
pnpm --filter @workspace/images-dashboard run dev
```

The Vite dev server starts on a random available port and prints the local URL.  
Open it in your browser to see the dashboard.

### 7 — (Optional) Connect the WildDev/images service

Set `IMAGES_SERVICE_URL` to the base URL of your running [WildDev/images](https://github.com/WildDev/images) instance and restart the API server. The proxy will forward all upload, add, find, and delete operations to the upstream service and sync results back to the local database.

---

## OpenAPI Specification

A standalone OpenAPI 3.1 specification for the WildDev/images Java service is included at [`generated/wilddev-images-openapi.yaml`](generated/wilddev-images-openapi.yaml). Import it into Postman, Insomnia, or any OpenAPI-compatible tool to explore and test the upstream service directly.

---

## Built with Replit

This project was scaffolded, developed, and iterated on using **[Replit](https://replit.com)** — a collaborative, browser-based development environment with integrated AI assistance, instant previews, and cloud infrastructure. The OpenAPI spec was generated, the React dashboard was designed, and the Express proxy was implemented entirely within the Replit workspace.

[![Run on Replit](https://replit.com/badge/github/WildDev/images-dashboard)](https://replit.com/github/WildDev/images-dashboard)

---

## License

```
Copyright 2026 WildDev

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

See the full license text at [apache.org/licenses/LICENSE-2.0](https://www.apache.org/licenses/LICENSE-2.0).
