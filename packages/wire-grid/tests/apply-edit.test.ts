import { describe, expect, it } from "vitest"

import {
  applyInlineStyleEdit,
  applyJsxAttributeStringEdit,
  applyJsxTextEdit
} from "../src/edit/apply-edit.js"

describe("applyJsxTextEdit", () => {
  it("updates JSX text for the matching Wire Grid id", () => {
    const result = applyJsxTextEdit(
      `export default function Page() {
  return <h1 data-wg-id="title">Old title</h1>
}
`,
      {
        source: {
          file: "app/page.tsx",
          id: "title"
        },
        edit: {
          kind: "jsx-text",
          value: "New title"
        }
      }
    )

    expect(result.ok).toBe(true)
    expect(result.ok && result.code).toContain(">New title<")
  })

  it("updates multiline JSX text", () => {
    const result = applyJsxTextEdit(
      `export default function Page() {
  return (
    <h1 data-wg-id="title">
      Old title
    </h1>
  )
}
`,
      {
        source: {
          file: "app/page.tsx",
          id: "title"
        },
        edit: {
          kind: "jsx-text",
          value: "New title"
        }
      }
    )

    expect(result.ok && result.code).toContain("New title")
  })

  it("updates custom component text children by Wire Grid id", () => {
    const result = applyJsxTextEdit(
      `export default function Page() {
  return <CardTitle data-wg-id="title">Old title</CardTitle>
}
`,
      {
        source: {
          file: "app/page.tsx",
          id: "title"
        },
        edit: {
          kind: "jsx-text",
          value: "New title"
        }
      }
    )

    expect(result.ok).toBe(true)
    expect(result.ok && result.code).toContain(">New title<")
  })

  it("updates custom component string props by Wire Grid id", () => {
    const result = applyJsxAttributeStringEdit(
      `export default function Page() {
  return <Callout data-wg-id="callout" heading="Old heading" />
}
`,
      {
        source: {
          file: "app/page.tsx",
          id: "callout"
        },
        edit: {
          kind: "jsx-attribute-string",
          name: "heading",
          value: "New heading"
        }
      }
    )

    expect(result.ok).toBe(true)
    expect(result.ok && result.code).toContain(`heading="New heading"`)
  })

  it("rejects expression props", () => {
    const result = applyJsxAttributeStringEdit(
      `export default function Page() {
  return <Callout data-wg-id="callout" heading={title} />
}
`,
      {
        source: {
          file: "app/page.tsx",
          id: "callout"
        },
        edit: {
          kind: "jsx-attribute-string",
          name: "heading",
          value: "New heading"
        }
      }
    )

    expect(result).toMatchObject({
      ok: false,
      code: "UNSUPPORTED_NODE"
    })
  })

  it("updates existing inline style properties", () => {
    const result = applyInlineStyleEdit(
      `export default function Page() {
  return <h1 data-wg-id="title" style={{ color: "#111827" }}>Hello</h1>
}
`,
      {
        source: {
          file: "app/page.tsx",
          id: "title"
        },
        edit: {
          kind: "inline-style-set",
          property: "color",
          value: "#2563eb"
        }
      }
    )

    expect(result.ok).toBe(true)
    expect(result.ok && result.code).toContain(`color: "#2563eb"`)
  })

  it("adds missing inline style properties to existing style objects", () => {
    const result = applyInlineStyleEdit(
      `export default function Page() {
  return <h1 data-wg-id="title" style={{ fontWeight: 700 }}>Hello</h1>
}
`,
      {
        source: {
          file: "app/page.tsx",
          id: "title"
        },
        edit: {
          kind: "inline-style-set",
          property: "color",
          value: "#2563eb"
        }
      }
    )

    expect(result.ok).toBe(true)
    expect(result.ok && result.code).toContain(`color: "#2563eb"`)
  })



  it("rejects missing source ids", () => {
    const result = applyJsxTextEdit(`<h1>Old title</h1>`, {
      source: {
        file: "app/page.tsx"
      },
      edit: {
        kind: "jsx-text",
        value: "New title"
      }
    })

    expect(result).toMatchObject({
      ok: false,
      code: "UNSUPPORTED_NODE"
    })
  })
})
