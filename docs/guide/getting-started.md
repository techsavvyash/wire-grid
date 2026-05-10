# Getting Started

Wire Grid lets you select editable React text in the browser and persist the change back to the source file during local development.

The current package set is:

```txt
@techsavvyash/wire-grid
@techsavvyash/wire-grid-runtime
@techsavvyash/wire-grid-next
```

## Install

In a Next.js app:

```bash
pnpm add -D @techsavvyash/wire-grid-next
```

## Configure Next.js

Wrap your existing Next config:

```ts
import { withWireGrid } from "@techsavvyash/wire-grid-next"

const nextConfig = {
  // your existing Next.js config
}

export default withWireGrid(nextConfig)
```

## Add The Overlay

For the current alpha, add the runtime overlay to your root layout:

```tsx
import { WireGridOverlay } from "@techsavvyash/wire-grid-runtime"

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <WireGridOverlay />
      </body>
    </html>
  )
}
```

Adapter-driven overlay injection is planned, but explicit layout mounting keeps the first integration predictable.

## Run

Start your development server normally:

```bash
pnpm next dev
```

Click **Wire Grid**, select editable text, change the value, and press **Save**. The package updates the source file and Next refreshes the page.

## Supported Today

- Next.js development server.
- Native JSX elements like `h1`, `p`, `span`, `button`, and `strong`.
- Direct JSX text children.
- Source files with `.js`, `.jsx`, `.ts`, and `.tsx` extensions.

## Not Supported Yet

- Text rendered from variables, props, function calls, CMS content, or API data.
- Custom component children.
- CSS and color editing.
- Production use.
