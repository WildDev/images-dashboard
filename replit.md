# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui (images-dashboard artifact)

## Artifacts

### Images Dashboard (`artifacts/images-dashboard`)
A modern management dashboard for the WildDev Images service.
- Preview path: `/` (root)
- Features: gallery grid, stats bar, add-image modal (URL + file upload), delete, dark mode
- Connects to the API server at `/api`

### API Server (`artifacts/api-server`)
Express 5 backend that proxies to the WildDev Images Java service.
- Preview path: `/api`
- Routes: `/api/images`, `/api/images/stats`, `/api/images/add`, `/api/images/upload`, `/api/images/find/:id`, `/api/images/delete`, `/api/images/webhook`

## Configuration

Set `IMAGES_SERVICE_URL` environment variable to point to a running WildDev Images Java service (e.g. `http://localhost:8000`). Without it:
- Image metadata is tracked locally in PostgreSQL
- Add/upload still register images (status: NEW)
- `/api/images/find/{id}` returns 503 (no binary proxy available)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Database Schema

- `images` table: id (text PK), source_url, status, content_type, multi_size, width, height, added, processed

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
