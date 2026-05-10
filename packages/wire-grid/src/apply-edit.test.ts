import { describe, expect, it } from "vitest"

import { applyJsxTextEdit } from "./apply-edit.js"

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
