import { describe, expect, it } from "vitest"

import { instrumentSource } from "./instrument-source.js"

describe("instrumentSource", () => {
  it("adds Wire Grid metadata to native JSX elements with text", () => {
    const code = `export default function Page() {
  return <h1>Hello</h1>
}
`

    const result = instrumentSource({
      code,
      filePath: "/repo/app/app/page.tsx",
      rootDir: "/repo/app"
    })

    expect(result).toContain(`data-wg-file="app/page.tsx"`)
    expect(result).toContain(`data-wg-kind="jsx-text"`)
  })

  it("does not instrument custom components", () => {
    const code = `export function Page() {
  return <Title>Hello</Title>
}
`

    expect(
      instrumentSource({
        code,
        filePath: "/repo/app/app/page.tsx",
        rootDir: "/repo/app"
      })
    ).toBe(code)
  })
})
