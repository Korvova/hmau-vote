CoCon Connector (Node + Electron)

Overview
- Desktop bridge between Televic CoCon (Room Server / Plixus MME) and your web app (rms-bot.com/vote).
- Provides:
  - Electron UI to configure CoCon IPs, room info, site API URL, and local listener port.
  - Embedded Express HTTP server that listens for commands (configurable host/port).
  - Test actions ("curl" checks) to verify connectivity to the site and CoCon endpoints.
  - Pluggable driver stub for CoCon (extend later with real protocol/SDK calls).

Status
- MVP scaffold. Real CoCon operations are placeholders (implement in `src/backend/coconClient.js`).
- Supports Architecture B: connector makes outbound Socket.IO connection to server.

Quick Start (Dev)
1) Install Node.js >= 18 on your Windows PC with CoCon installed.
2) In this folder:
   - npm install
   - npm run dev
3) The Electron app opens. Fill settings and Save.
4) Use the Test buttons (HTTP health/socket/MME TCP) on the Home screen.

Socket Bridge (B)
- Fields:
  - Socket base: e.g. `https://rms-bot.com`
  - Namespace: e.g. `/cocon-connector`
  - Topic: venue key (e.g. `gost-duma-2025`)
  - Room ID: numeric CoCon room id (e.g. 1)
  - Connector ID: optional; auto-generated if empty
- On connect, the app emits `connector:hello` with capabilities, room/machine info.
- The server can send commands via `server:command:exec { id, type, payload }`.
- The connector replies with `connector:command:ack { id }` and later `connector:command:result { id, ok, data|error }`.

Production build (Windows)
- npm run build:win
  Produces an installer under `dist/` (NSIS).

Default Ports
- Local connector listener: 4000 (0.0.0.0) — change under Settings.
- Electron UI is local; backend is embedded.

HTTP API (local)
- GET  /api/health
- GET  /api/config
- POST /api/config  (JSON body with fields you want to update)
- POST /api/test/site-health
- POST /api/test/socket-handshake
- POST /api/test/cocon-tcp  (host, port)
 - POST /api/commands/emit (debug: executes a local command handler by type)

Security
- Optional shared token: set in Settings, then include `X-Auth-Token: <token>` header in requests to this connector.

Notes
- To reach this connector from the internet you’ll need NAT/port‑forwarding or VPN.
- Real CoCon control typically requires Televic’s SDK/API. Integrate inside `coconClient.js`.
