import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"

import { describe, expect, it } from "vitest"

import { createWireGridEditHandler } from "../src/server/edit-handler.js"

describe("createWireGridEditHandler", () => {
  it("previews, applies, and undoes edits through a reusable handler", async () => {
    const rootDir = await mkdtemp(path.join(tmpdir(), "wire-grid-handler-"))
    const filePath = path.join(rootDir, "page.tsx")
    const source = `export default function Page() {
  return <h1 data-wg-id="title">Old title</h1>
}
`
    const handleEdit = createWireGridEditHandler({ rootDir })

    try {
      await writeFile(filePath, source)

      const preview = await handleEdit({
        source: {
          file: "page.tsx",
          id: "title"
        },
        edit: {
          kind: "jsx-text",
          value: "New title"
        },
        preview: true
      })

      expect(preview.statusCode).toBe(200)
      expect(preview.payload).toMatchObject({
        ok: true,
        changed: true,
        preview: true
      })
      await expect(readFile(filePath, "utf8")).resolves.toBe(source)

      const apply = await handleEdit({
        source: {
          file: "page.tsx",
          id: "title"
        },
        edit: {
          kind: "jsx-text",
          value: "New title"
        }
      })

      expect(apply.statusCode).toBe(200)
      await expect(readFile(filePath, "utf8")).resolves.toContain("New title")

      const undo = await handleEdit({ action: "undo" })

      expect(undo.statusCode).toBe(200)
      expect(undo.payload).toMatchObject({
        ok: true,
        changed: true,
        undone: true
      })
      await expect(readFile(filePath, "utf8")).resolves.toBe(source)
    } finally {
      await rm(rootDir, { recursive: true, force: true })
    }
  })

  it("returns a 422 response when there is no edit to undo", async () => {
    const rootDir = await mkdtemp(path.join(tmpdir(), "wire-grid-handler-"))
    const handleEdit = createWireGridEditHandler({ rootDir })

    try {
      await expect(handleEdit({ action: "undo" })).resolves.toMatchObject({
        statusCode: 422,
        payload: {
          ok: false,
          code: "NO_EDIT_HISTORY"
        }
      })
    } finally {
      await rm(rootDir, { recursive: true, force: true })
    }
  })
})
