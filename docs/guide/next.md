# Next.js Integration

Wire Grid's Next adapter is exposed through `withWireGrid()`.

```ts
import { withWireGrid } from "@techsavvyash/wire-grid-next"

export default withWireGrid({
  reactStrictMode: true
})
```

## What The Adapter Does

During `next dev`, the adapter:

- Starts a local sidecar edit server.
- Adds a Next rewrite from `/__wire-grid/edit` to that local server.
- Instruments JSX files with development-only `data-wg-*` metadata.
- Supports Turbopack rules and a webpack fallback.

The browser runtime sends edit requests to:

```txt
POST /__wire-grid/edit
```

The payload is an edit intent:

```json
{
  "source": {
    "file": "app/page.tsx",
    "id": "app/page.tsx:12:8",
    "line": 12,
    "column": 8
  },
  "edit": {
    "kind": "jsx-text",
    "value": "New browser text"
  }
}
```

## Safety Rules

The edit server only writes files inside the configured project root. It rejects unsupported extensions, blocked directories like `node_modules` and `.next`, and paths that attempt to escape the project.

## Options

```ts
export default withWireGrid(nextConfig, {
  enabled: process.env.NODE_ENV === "development",
  editEndpoint: "/__wire-grid/edit",
  overlay: true,
  rootDir: process.cwd(),
  debug: false
})
```

## Production Builds

Wire Grid is intended for development. The current alpha keeps the editor workflow local and validates that the example production build still succeeds with `next build`.
