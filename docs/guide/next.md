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
  instrumentComponentProps: false,
  instrumentComponentText: false,
  componentTextProps: ["heading", "label", "title", "text"],
  overlay: true,
  rootDir: process.cwd(),
  debug: false
})
```

`instrumentComponentText` and `instrumentComponentProps` are opt-in. They are
intended for simple custom components that forward `data-wg-*` props to a DOM
element:

```tsx
function CardTitle({ children, ...props }) {
  return <h2 {...props}>{children}</h2>
}

function Callout({ heading, ...props }) {
  return <aside {...props}>{heading}</aside>
}
```

String prop editing only supports literal props such as
`<Callout heading="Deploy faster" />`. Expression props remain unsupported.

Inline style color editing supports elements with an existing style object:

```tsx
<h1 style={{ color: "#111827" }}>Hello</h1>
```

Tailwind-style class color editing supports simple string `className` tokens
for `text-*`, `bg-*`, and `border-*` classes:

```tsx
<p className="text-red-500">Hello</p>
```

Dynamic class expressions such as `className={cn(...)}` are rejected for now.

## Production Builds

Wire Grid is intended for development. The current alpha keeps the editor workflow local and validates that the example production build still succeeds with `next build`.
