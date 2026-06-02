# Launchpad

Personal homelab dashboard. Built with Elysia + Eden + React 19 + shadcn/ui + gridstack.

## Stack

- **Backend**: Elysia (port 2019) + Eden end-to-end types
- **Frontend**: React 19 + Vite + TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui (base-ui)
- **Grid**: gridstack.js v12
- **State**: Zustand with localStorage persistence
- **Runtime**: Bun throughout

## Widgets

| Widget | Description |
|--------|-------------|
| Service Card | PM2 service status + start/stop/restart |
| System Stats | CPU/RAM rings, disk bar, uptime, IP |
| Logs Viewer | SSE live log stream from PM2 |
| Caddy Editor | Edit + validate + reload Caddyfile |
| Clock | Large clock with optional date/timezone |
| Quick Link | Clickable card opening URL in new tab |
| Notes | Auto-saving markdown notes |

## Dev

```bash
bun install
bun run dev        # Elysia on :2019 + Vite on :5173
```

Open `http://localhost:5173`. Click the grid icon (bottom-right) to enter edit mode.

## Build & Deploy

```bash
bun run build      # outputs dist/
bun run start      # Elysia serves dist/ on :2019
```

## PM2

```bash
pm2 start "bun server/index.ts" --name launchpad
pm2 save
```

## Caddy

```
redir /launchpad /launchpad/ 308
handle_path /launchpad/* {
    reverse_proxy 127.0.0.1:2019
}
```

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `DASHBOARD_TOKEN` | (none) | Bearer token to protect all `/api` routes |
| `CADDY_CONFIG` | `~/.config/caddy/Caddyfile` | Path to Caddyfile |
