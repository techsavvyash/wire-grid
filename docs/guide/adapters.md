# Adapter Foundation

Wire Grid adapters should keep framework-specific work thin. The core package
owns source transforms, path validation, preview generation, and edit history.

## Core Handler

Use `createWireGridEditHandler()` from `@techsavvyash/wire-grid` to process JSON
payloads from a framework dev server:

```ts
import { createWireGridEditHandler } from "@techsavvyash/wire-grid"

const handleWireGridEdit = createWireGridEditHandler({
  rootDir: process.cwd()
})

const result = await handleWireGridEdit(payload)
```

The result contains an HTTP-style status code and JSON payload:

```ts
{
  statusCode: 200,
  payload: {
    ok: true,
    file: "app/page.tsx",
    changed: true
  }
}
```

Adapters are responsible for:

- Exposing a development-only endpoint such as `/__wire-grid/edit`.
- Parsing the request JSON and passing it to the core handler.
- Returning `result.statusCode` and `result.payload`.
- Wiring framework-specific source instrumentation during development only.
- Ensuring production builds skip Wire Grid instrumentation and endpoints.

## Supported Core Requests

Regular edits use a source location and edit intent:

```json
{
  "source": {
    "file": "app/page.tsx",
    "id": "app/page.tsx:12:8"
  },
  "edit": {
    "kind": "jsx-text",
    "value": "New browser text"
  }
}
```

Preview requests use the same payload with `preview: true`. They return a diff
without writing to disk.

Undo requests restore the most recent successful write from the handler's
in-memory session history:

```json
{
  "action": "undo"
}
```

Each adapter instance should create one handler per project root and edit
endpoint, then reuse it for the lifetime of the dev server.
