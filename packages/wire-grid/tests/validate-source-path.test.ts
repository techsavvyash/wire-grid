import { describe, expect, it } from "vitest"

import { validateSourcePath } from "../src/security/validate-source-path.js"

const rootDir = "/repo/app"

describe("validateSourcePath", () => {
  it("resolves allowed project files", () => {
    expect(validateSourcePath({ rootDir, filePath: "src/app/page.tsx" })).toBe(
      "/repo/app/src/app/page.tsx"
    )
  })

  it("rejects parent traversal", () => {
    expect(() =>
      validateSourcePath({ rootDir, filePath: "../outside.tsx" })
    ).toThrow("inside the project root")
  })

  it("rejects blocked directories", () => {
    expect(() =>
      validateSourcePath({ rootDir, filePath: "node_modules/pkg/index.ts" })
    ).toThrow("blocked directory")
  })

  it("rejects unsupported extensions", () => {
    expect(() =>
      validateSourcePath({ rootDir, filePath: "src/styles.css" })
    ).toThrow("Unsupported source file extension")
  })
})
