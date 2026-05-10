# Wire Grid Technical Implementation Plan

Wire Grid is a development-only visual editor for React applications. It lets a developer select rendered UI in the browser, edit text or styling, and persist that change back to the actual source code. The first supported framework target is Next.js through a `next.config` wrapper. The architecture should remain framework-agnostic enough to support Vite, TanStack Start, and other React dev servers later.

## Goals

- Install as a dev dependency.
- Integrate into Next.js with a config wrapper.
- Run only during local development.
- Never affect production builds.
- Let users select rendered elements in the browser.
- Map selected elements back to source files and JSX nodes.
- Apply edits to source files using AST-based transforms.
- Rely on the framework dev server for hot reload after file edits.
- Keep the architecture extensible for non-Next adapters.

## Non-Goals For The Initial Version

- Full visual page builder behavior.
- Drag-and-drop layout editing.
- Editing arbitrary computed text from API data, CMS data, or runtime expressions.
- Full CSS cascade inspection.
- Production runtime support.
- Browser-only operation without a local dev server.
- Perfect support for every React pattern in the MVP.

## Package Namespace

All packages should live under the `@techsavvyash` namespace.

Recommended package layout:

```txt
@techsavvyash/wire-grid
  Framework-agnostic core
  Shared protocol types
  Source file safety checks
  AST edit engine

@techsavvyash/wire-grid-runtime
  Browser overlay
  Element picker
  Selection UI
  Text/color editing controls
  Client API for edit requests

@techsavvyash/wire-grid-next
  Next.js adapter
  withWireGrid(nextConfig, options)
  Dev-only source instrumentation
  Dev edit endpoint/middleware
  Runtime injection

Future:
@techsavvyash/wire-grid-vite
@techsavvyash/wire-grid-tanstack
```

`@techsavvyash/wire-grid-next` should depend on `@techsavvyash/wire-grid` and `@techsavvyash/wire-grid-runtime`.

## User Experience

Initial install:

```bash
pnpm add -D @techsavvyash/wire-grid-next
```

Next config:

```ts
import { withWireGrid } from "@techsavvyash/wire-grid-next"

const nextConfig = {
  // existing Next.js config
}

export default withWireGrid(nextConfig)
```

Optional config:

```ts
import { withWireGrid } from "@techsavvyash/wire-grid-next"

export default withWireGrid(
  {
    // existing Next.js config
  },
  {
    enabled: process.env.NODE_ENV === "development",
    editEndpoint: "/__wire-grid/edit",
    overlay: true
  }
)
```

During `next dev`, the browser shows a small Wire Grid toggle. When enabled, the user can hover elements, click a text element, edit it in a popover, and save the change. The package rewrites the source file, and Next Fast Refresh updates the page.

During `next build`, Wire Grid should be inert.

## High-Level Architecture

```txt
Browser overlay
  -> user selects rendered element
  -> reads data-wg-* source metadata
  -> sends edit request to local dev endpoint

Next adapter
  -> injects runtime overlay in development
  -> instruments JSX with data-wg-* metadata
  -> exposes edit endpoint during development

Core edit engine
  -> validates requested source file
  -> parses source code into AST
  -> finds target JSX node
  -> applies supported edit
  -> writes source file

Next dev server
  -> detects changed file
  -> triggers Fast Refresh
```

## Core Concepts

### 1. Source Instrumentation

Wire Grid needs a reliable way to map DOM nodes back to source code. During development, JSX should be transformed to include source metadata.

Original:

```tsx
<h1 className="text-4xl font-bold">Hello world</h1>
```

Instrumented in development:

```tsx
<h1
  className="text-4xl font-bold"
  data-wg-id="src/app/page.tsx:12:4"
  data-wg-file="src/app/page.tsx"
  data-wg-line="12"
  data-wg-column="4"
>
  Hello world
</h1>
```

The metadata format should be treated as an internal protocol. The browser runtime should not infer file paths from DOM structure.

Recommended attributes:

```txt
data-wg-id
data-wg-file
data-wg-line
data-wg-column
data-wg-kind
```

`data-wg-kind` can initially be `jsx-element`, then expand to richer node classifications later.

### 2. Browser Runtime

The runtime is a small client-side overlay loaded only in development.

Responsibilities:

- Toggle visual editing mode.
- Detect hover and click targets.
- Ignore Wire Grid's own overlay DOM.
- Draw a selection rectangle around the target element.
- Read `data-wg-*` metadata from the selected element or nearest ancestor.
- Show an edit popover.
- Send edit requests to the local endpoint.
- Display save/error state.

The runtime must not include server-only code or Node APIs.

### 3. Edit Protocol

The browser should send high-level edit intents, not raw source patches.

Example text edit request:

```json
{
  "source": {
    "file": "src/app/page.tsx",
    "line": 12,
    "column": 4,
    "id": "src/app/page.tsx:12:4"
  },
  "edit": {
    "kind": "jsx-text",
    "value": "Build faster interfaces"
  }
}
```

Example class edit request:

```json
{
  "source": {
    "file": "src/app/page.tsx",
    "line": 12,
    "column": 4,
    "id": "src/app/page.tsx:12:4"
  },
  "edit": {
    "kind": "class-token-replace",
    "from": "text-red-500",
    "to": "text-blue-500"
  }
}
```

Response:

```json
{
  "ok": true,
  "file": "src/app/page.tsx",
  "changed": true
}
```

Failure response:

```json
{
  "ok": false,
  "code": "UNSUPPORTED_NODE",
  "message": "This text is generated from an expression and cannot be edited yet."
}
```

### 4. AST-Based Source Editing

The server must never use raw string replacement for source edits. It should parse files and modify AST nodes.

Recommended initial toolchain:

- `@babel/parser`
- `@babel/traverse`
- `@babel/types`
- `recast`

Potential later additions:

- `prettier` for optional formatting.
- `ts-morph` for deeper TypeScript-aware edits.
- `jscodeshift` for batch transforms.

The edit engine should preserve existing code style as much as possible. Recast is useful for retaining formatting around unchanged nodes.

### 5. File Safety

The edit endpoint writes to disk, so it needs strict safety checks.

Rules:

- Only run in development.
- Only write files inside the configured project root.
- Reject absolute paths from the browser unless normalized and verified.
- Reject paths containing `..` after normalization.
- Reject files in `node_modules`, `.next`, `dist`, `build`, `.git`, and lockfiles.
- Only allow supported extensions:
  - `.js`
  - `.jsx`
  - `.ts`
  - `.tsx`
  - optionally `.css` later
- Do not follow symlinks outside the project root.
- Return structured errors instead of throwing raw stack traces to the browser.

## Next.js Adapter

The first adapter should expose:

```ts
export function withWireGrid(
  nextConfig?: NextConfig,
  options?: WireGridNextOptions
): NextConfig
```

Options:

```ts
export interface WireGridNextOptions {
  enabled?: boolean
  editEndpoint?: string
  overlay?: boolean
  rootDir?: string
  include?: string[]
  exclude?: string[]
  debug?: boolean
}
```

Default behavior:

- Enabled only for development server.
- Disabled for production build.
- Edit endpoint defaults to `/__wire-grid/edit`.
- Overlay enabled by default in development.
- Root directory defaults to Next project root.

### Development-Only Guard

The wrapper should detect the Next phase.

```ts
import { PHASE_DEVELOPMENT_SERVER } from "next/constants"

export function withWireGrid(nextConfig = {}, options = {}) {
  return (phase, context) => {
    const resolved =
      typeof nextConfig === "function" ? nextConfig(phase, context) : nextConfig

    if (phase !== PHASE_DEVELOPMENT_SERVER || options.enabled === false) {
      return resolved
    }

    return applyWireGridNextConfig(resolved, options)
  }
}
```

### Runtime Injection

The Next adapter needs a way to add the browser overlay during development.

Possible approaches:

1. Transform React entry/root/layout files and inject a client component.
2. Inject a script through dev middleware/proxy.
3. Provide a small component and ask users to add it manually as a fallback.

For the first version, prefer adapter-driven injection if possible, but keep a documented fallback:

```tsx
import { WireGridOverlay } from "@techsavvyash/wire-grid-runtime/next"

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <WireGridOverlay />
      </body>
    </html>
  )
}
```

The product goal should remain config-wrapper-only, but a manual fallback is useful while the adapter matures.

### JSX Transform

The adapter should instrument JSX in development by adding `data-wg-*` attributes to JSX elements.

Initial target files:

- `.jsx`
- `.tsx`

Initial exclusions:

- `node_modules`
- `.next`
- generated files
- files outside project root
- Wire Grid runtime package itself

The transform should avoid adding metadata to:

- React fragments
- non-DOM components if this causes hydration risk
- elements that already have Wire Grid attributes

Important design decision:

- Adding metadata to native DOM elements is safer for runtime selection.
- Adding metadata to custom components may help source mapping but may leak unknown props.

For MVP, instrument native JSX elements like `div`, `span`, `h1`, `button`, `p`, `a`, etc. Avoid custom components initially unless we can safely trace through them.

### Edit Endpoint

The adapter should register a local development endpoint:

```txt
POST /__wire-grid/edit
```

Handler responsibilities:

- Parse JSON request.
- Validate request shape.
- Validate project root and file path.
- Call core edit engine.
- Return structured result.

The endpoint must not exist in production.

## Framework Adapter Interface

Keep core logic independent from Next.

Potential adapter interface:

```ts
export interface WireGridAdapter {
  name: string
  rootDir: string
  isDev: boolean
  transformSource(input: TransformSourceInput): TransformSourceResult
  handleEdit(request: WireGridEditRequest): Promise<WireGridEditResponse>
}
```

Core transform input:

```ts
export interface TransformSourceInput {
  code: string
  filePath: string
  rootDir: string
}
```

Core edit request:

```ts
export interface WireGridEditRequest {
  source: {
    file: string
    line: number
    column: number
    id?: string
  }
  edit: WireGridEdit
}
```

Edit union:

```ts
export type WireGridEdit =
  | {
      kind: "jsx-text"
      value: string
    }
  | {
      kind: "class-token-replace"
      from: string
      to: string
    }
  | {
      kind: "inline-style-set"
      property: string
      value: string
    }
```

## Phased Implementation Plan

### Phase 0: Project Scaffold

Goal: Create the package workspace and development foundation.

Deliverables:

- Monorepo package structure.
- TypeScript config.
- Build setup.
- Lint/format setup.
- Test runner.
- Example Next app for dogfooding.
- Initial package exports.

Suggested structure:

```txt
wire-grid/
  package.json
  pnpm-workspace.yaml
  tsconfig.json
  packages/
    wire-grid/
    wire-grid-runtime/
    wire-grid-next/
  examples/
    next-basic/
```

Exit criteria:

- Packages build locally.
- Example Next app runs.
- `@techsavvyash/wire-grid-next` can be imported from the example app.

### Phase 1: Next Config Wrapper

Goal: Add the `withWireGrid()` integration surface.

Deliverables:

- `withWireGrid(nextConfig, options)` export.
- Development-only phase detection.
- Preserve existing user Next config.
- Preserve existing user webpack config.
- No behavior during production build.

Exit criteria:

- `next dev` with `withWireGrid()` starts normally.
- `next build` output does not include Wire Grid runtime.
- Existing `webpack(config, context)` functions still run.

### Phase 2: Browser Runtime Overlay

Goal: Build the visual selection UI.

Deliverables:

- Overlay toggle.
- Hover target detection.
- Selection rectangle.
- Popover shell.
- Metadata reader for `data-wg-*`.
- Dev-only client bundle.

Initial behavior:

- Highlight elements that have source metadata.
- Show file/line metadata in debug mode.
- Disable editing when metadata is missing.

Exit criteria:

- In the example app, hovering elements draws stable bounds.
- Clicking an eligible element opens a popover.
- The overlay does not select itself.

### Phase 3: JSX Source Instrumentation

Goal: Add source metadata to rendered DOM elements.

Deliverables:

- Source transform for `.jsx` and `.tsx`.
- Inject `data-wg-id`, `data-wg-file`, `data-wg-line`, `data-wg-column`.
- Include/exclude controls.
- Avoid duplicate attributes.
- Sourceless or generated nodes are skipped.

Exit criteria:

- Example app DOM contains Wire Grid metadata in development.
- Production build does not contain Wire Grid metadata.
- Hydration remains stable.

### Phase 4: Dev Edit Endpoint

Goal: Allow browser runtime to send edit requests to the local dev process.

Deliverables:

- `POST /__wire-grid/edit`.
- JSON request validation.
- File path safety checks.
- Structured success and error responses.
- Debug logging option.

Exit criteria:

- Browser can POST an edit request.
- Invalid paths are rejected.
- Endpoint is unavailable outside development.

### Phase 5: JSX Text Editing MVP

Goal: Persist direct JSX text edits back to source.

Supported:

```tsx
<h1>Hello world</h1>
```

Unsupported initially:

```tsx
<h1>{title}</h1>
<h1>{getTitle()}</h1>
<h1>{items.map(...)}</h1>
```

Deliverables:

- AST parser and printer.
- Target JSX element lookup by file/line/column.
- Update direct `JSXText` child.
- Write changed file to disk.
- Browser popover text input.
- Save/error UI.

Exit criteria:

- User can click text in example Next app.
- User can edit the text.
- Source file changes.
- Next Fast Refresh reflects the change.

### Phase 6: Component Children Text Editing

Goal: Support common component child text patterns.

Supported:

```tsx
<Button>Save</Button>
<CardTitle>Dashboard</CardTitle>
```

Deliverables:

- Optional instrumentation for custom components where safe.
- Edit engine support for JSX text children in custom components.
- Clear unsupported-node errors.

Exit criteria:

- Editing text children in simple custom components works.
- Unknown or computed children fail gracefully.

### Phase 7: Prop Text Editing

Goal: Support text passed through props.

Supported:

```tsx
<Button label="Save" />
<Hero title="Build faster" />
```

Deliverables:

- Runtime detection for editable text rendered from props.
- Transform metadata that can identify source prop locations.
- AST edit support for string literal JSX attributes.

Potential metadata:

```txt
data-wg-prop="title"
```

Exit criteria:

- Simple string prop edits update source.
- Expression props remain unsupported with a clear error.

### Phase 8: Inline Style Editing

Goal: Support safe direct style edits.

Supported:

```tsx
<h1 style={{ color: "red" }}>Hello</h1>
```

Deliverables:

- Color picker UI.
- AST edit support for object expression style props.
- Add missing style property when a style object exists.
- Optional creation of `style={{ color: "..." }}` for simple elements.

Exit criteria:

- User can change direct inline color.
- Source file updates correctly.
- Existing style properties are preserved.

### Phase 9: Tailwind Class Editing

Goal: Support common Tailwind color class changes.

Supported examples:

```tsx
<h1 className="text-red-500">Hello</h1>
<section className="bg-white">...</section>
```

Deliverables:

- Tailwind token classification.
- Replace color-related tokens.
- Avoid destructive edits to unrelated class tokens.
- Support `text-*`, `bg-*`, `border-*` initially.

Unsupported initially:

```tsx
className={cn("text-red-500", active && "font-bold")}
className={styles.title}
```

Exit criteria:

- User can change simple Tailwind text/background/border colors.
- Dynamic class names fail gracefully.

### Phase 10: Undo And Diff Preview

Goal: Make writeback safer.

Deliverables:

- Preview diff before applying.
- Undo last edit.
- Store edit history in memory during dev session.
- Optional file snapshot before write.

Exit criteria:

- User can inspect pending changes before saving.
- User can undo the last successful edit.

### Phase 11: Multi-Framework Adapter Foundation

Goal: Extract reusable framework integration concepts.

Deliverables:

- Stable adapter interface.
- Core transform API.
- Core edit endpoint handler.
- Runtime package decoupled from Next.
- Documented adapter requirements.

Exit criteria:

- Next adapter uses shared core APIs.
- A Vite adapter can be implemented without copying core edit logic.

### Phase 12: Vite Adapter

Goal: Add support for React apps running on Vite.

Deliverables:

- `@techsavvyash/wire-grid-vite`.
- Vite plugin:

```ts
import { wireGrid } from "@techsavvyash/wire-grid-vite"

export default {
  plugins: [react(), wireGrid()]
}
```

- Vite transform hook for JSX metadata.
- Vite dev server middleware for edit endpoint.
- Runtime injection.

Exit criteria:

- Basic Vite React app supports JSX text editing.
- Core edit engine is reused.

### Phase 13: TanStack Start Adapter

Goal: Add support for TanStack Start after Next and Vite are stable.

Deliverables:

- `@techsavvyash/wire-grid-tanstack`.
- Adapter for TanStack's dev server/build pipeline.
- Reuse Vite integration if TanStack project setup allows it.

Exit criteria:

- Basic TanStack Start app supports the same MVP edit flow.

## MVP Definition

The first public alpha should include:

- `@techsavvyash/wire-grid-next`.
- `withWireGrid()` integration.
- Dev-only overlay.
- JSX metadata injection for native DOM elements.
- Dev edit endpoint.
- Direct JSX text editing.
- Example Next app.
- Basic docs.

It should explicitly document unsupported cases:

- Dynamic text expressions.
- Text loaded from API/CMS.
- CSS modules.
- Dynamic Tailwind class builders.
- Production usage.

## Risks And Mitigations

### Next.js Internal Stability

Risk: Next's webpack integration surface can change between versions.

Mitigation:

- Keep the adapter small.
- Test against a version matrix.
- Prefer documented config hooks where possible.
- Isolate Next-specific logic in `@techsavvyash/wire-grid-next`.

### Hydration Mismatch

Risk: Injected metadata or overlay code can affect rendered markup.

Mitigation:

- Only inject deterministic `data-*` attributes.
- Inject only in development.
- Avoid editing server-rendered HTML differently from client-rendered HTML.
- Test App Router and Pages Router separately.

### Incorrect Source Edits

Risk: An edit updates the wrong AST node or damages formatting.

Mitigation:

- Use source location matching and metadata IDs.
- Reject ambiguous matches.
- Use AST transforms, not raw string replacement.
- Add tests for each edit type.
- Add diff preview before broader release.

### Security

Risk: A browser endpoint can write arbitrary files.

Mitigation:

- Development-only endpoint.
- Root-bound path validation.
- Strict extension allowlist.
- Reject symlink escapes.
- No shell execution from edit payloads.

### Unsupported React Patterns

Risk: Real apps use dynamic expressions that are hard to edit.

Mitigation:

- Start narrow.
- Return clear unsupported errors.
- Add capabilities in phases.
- Prefer high-confidence edits over broad unreliable edits.

## Testing Strategy

Unit tests:

- Source path validation.
- JSX instrumentation transform.
- AST text edits.
- Class token replacement.
- Inline style edits.

Integration tests:

- Example Next app starts with `withWireGrid()`.
- DOM contains metadata in dev.
- DOM does not contain metadata in build output.
- Edit endpoint rewrites files.

Browser tests:

- Overlay renders.
- Hover selection works.
- Popover opens.
- Text edit round trip works.

Suggested tools:

- Vitest for unit tests.
- Playwright for browser tests.
- Fixture apps for framework adapters.

## Documentation Plan

Initial docs:

- Installation.
- Next.js setup.
- Development-only behavior.
- Supported edits.
- Unsupported edits.
- Troubleshooting.
- Security model.

Example README flow:

```md
# Wire Grid

Install:

pnpm add -D @techsavvyash/wire-grid-next

Configure:

import { withWireGrid } from "@techsavvyash/wire-grid-next"

export default withWireGrid({})

Run:

pnpm next dev
```

## Open Technical Questions

- Can runtime injection be fully config-wrapper-only for both App Router and Pages Router?
- Should metadata be injected into custom components in the MVP, or only native DOM elements?
- Should the edit endpoint live inside Next middleware, webpack dev middleware, or a sidecar local server?
- Should formatting be handled by Recast only, or should Prettier be run after every successful edit?
- How should Wire Grid identify text rendered from props without over-instrumenting every component?
- What is the preferred Tailwind color editing model: direct class token replacement or theme-aware color picker?

## Recommended Immediate Next Steps

1. Scaffold the monorepo.
2. Create `@techsavvyash/wire-grid-next` with a no-op `withWireGrid()`.
3. Add a Next example app.
4. Add the browser overlay runtime.
5. Add native JSX element metadata injection.
6. Add the edit endpoint.
7. Implement direct JSX text editing.

