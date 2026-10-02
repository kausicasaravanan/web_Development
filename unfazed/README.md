# Unfazed

A therapist-practice profile platform. This first milestone includes therapist registration and sign-in, editable public profiles, session offerings, and shareable profile links.

## Run locally

Requirements: Node.js 20 or newer, pnpm 10, and a MongoDB database.

1. From this directory, run `pnpm install`.
2. Copy `.env.example` to `.env`. Set `MONGO_URI` to your MongoDB connection string and set `SESSION_SECRET` to a strong random value (for example, generate one with `openssl rand -hex 32`). Do not commit `.env`.
3. In a terminal, load the local environment and start the API:

   ```sh
   set -a; source .env; set +a
   PORT=3000 pnpm --filter @workspace/api-server run dev
   ```

4. In another terminal, from this directory, start the web app:

   ```sh
   PORT=5173 BASE_PATH=/ API_SERVER_URL=http://127.0.0.1:3000 pnpm --filter @workspace/unfazed-app run dev
   ```

5. Open `http://localhost:5173`.

The frontend proxies `/api` to the local API when `API_SERVER_URL` is set. Public profile URLs use the current host, so locally they use `localhost:5173`.

## API

The OpenAPI source of truth is in `lib/api-spec/openapi.yaml`. Generated React Query hooks and Zod schemas are in `lib/api-client-react` and `lib/api-zod`. After editing the spec, run `pnpm --filter @workspace/api-spec run codegen`.

Never put database connection strings, session secrets, or real client information in source control.
