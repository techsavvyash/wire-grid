import { expect, test } from "@playwright/test"
import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"

const pageFilePath = path.resolve(
  "examples/next-basic/app/page.tsx"
)
const baselineHeading = "Hello, from other side."
const editedHeading = "Edited by Playwright E2E."

test.afterEach(async () => {
  const source = await readFile(pageFilePath, "utf8")

  await writeFile(pageFilePath, source.replace(editedHeading, baselineHeading))
})

test("edits native JSX text through Wire Grid", async ({ page }) => {
  const consoleMessages: string[] = []
  const relevantResponses: string[] = []

  page.on("console", (message) => {
    if (message.type() === "warning" || message.type() === "error") {
      consoleMessages.push(`${message.type()}: ${message.text()}`)
    }
  })
  page.on("response", (response) => {
    const url = response.url()

    if (url.includes("__wire-grid") || url.includes("_rsc")) {
      relevantResponses.push(`${response.status()} ${url}`)
    }
  })

  await page.goto("/")
  await expect(page.getByRole("button", { name: "Edit" })).toBeVisible()

  const metadata = await page.locator("h1").evaluate((element) => ({
    file: element.getAttribute("data-wg-file"),
    id: element.getAttribute("data-wg-id"),
    kind: element.getAttribute("data-wg-kind")
  }))

  expect(metadata).toEqual({
    file: "app/page.tsx",
    id: expect.stringContaining("app/page.tsx:"),
    kind: "jsx-text"
  })

  await page.getByRole("button", { name: "Edit" }).click()
  await expect(page.getByRole("button", { name: "Editing on" })).toBeVisible()
  await page.getByRole("heading", { name: baselineHeading }).click()
  await expect(
    page.getByRole("textbox", { name: "Wire Grid text value" })
  ).toBeVisible()
  await page
    .getByRole("textbox", { name: "Wire Grid text value" })
    .fill(editedHeading)
  await page.getByRole("button", { name: "Save" }).click()

  await expect(page.getByRole("heading", { name: editedHeading })).toBeVisible()

  const source = await readFile(pageFilePath, "utf8")

  expect(source).toContain(`<h1>${editedHeading}</h1>`)
  expect(relevantResponses).toContainEqual(
    expect.stringContaining("200 http://localhost:3100/__wire-grid/edit")
  )
  expect(consoleMessages).toEqual([])
})
