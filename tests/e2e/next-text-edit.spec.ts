import { expect, test } from "@playwright/test"
import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"

const pageFilePath = path.resolve(
  "examples/next-basic/app/page.tsx"
)
const baselineHeading = "Hello, from other side."
const editedHeading = "Edited by Playwright E2E."
const baselineComponentText = "Component text child."
const editedComponentText = "Component edited by Playwright."
const baselinePropText = "Prop text heading."
const editedPropText = "Prop edited by Playwright."
const baselineHeadingColor = "#111827"
const editedHeadingColor = "#2563eb"
const baselineClassToken = "text-red-500"
const editedClassToken = "text-blue-500"

test.afterEach(async () => {
  const source = await readFile(pageFilePath, "utf8")

  await writeFile(
    pageFilePath,
    source
      .replace(editedHeading, baselineHeading)
      .replace(editedComponentText, baselineComponentText)
      .replace(editedPropText, baselinePropText)
      .replace(`color: "${editedHeadingColor}"`, `color: "${baselineHeadingColor}"`)
      .replace(editedClassToken, baselineClassToken)
  )
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
  await page.getByRole("button", { exact: true, name: "Save" }).click()

  await expect(page.getByRole("heading", { name: editedHeading })).toBeVisible()

  const source = await readFile(pageFilePath, "utf8")

  expect(source).toContain(
    `<h1 style={{ color: "${baselineHeadingColor}" }}>${editedHeading}</h1>`
  )
  expect(relevantResponses).toContainEqual(
    expect.stringContaining("200 http://localhost:3100/__wire-grid/edit")
  )
  expect(consoleMessages).toEqual([])
})

test("edits inline style color through Wire Grid", async ({ page }) => {
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

  const heading = page.getByRole("heading", { name: baselineHeading })
  const metadata = await heading.evaluate((element) => ({
    file: element.getAttribute("data-wg-file"),
    id: element.getAttribute("data-wg-id"),
    styleProps: element.getAttribute("data-wg-style-props")
  }))

  expect(metadata).toEqual({
    file: "app/page.tsx",
    id: expect.stringContaining("app/page.tsx:"),
    styleProps: "color"
  })

  await page.getByRole("button", { name: "Edit" }).click()
  await heading.click()
  await page
    .getByRole("textbox", { name: "Wire Grid color value" })
    .fill(editedHeadingColor)
  await page.getByRole("button", { exact: true, name: "Save color" }).click()

  await expect(heading).toHaveCSS("color", "rgb(37, 99, 235)")

  const source = await readFile(pageFilePath, "utf8")

  expect(source).toContain(`color: "${editedHeadingColor}"`)
  expect(relevantResponses).toContainEqual(
    expect.stringContaining("200 http://localhost:3100/__wire-grid/edit")
  )
  expect(consoleMessages).toEqual([])
})

test("edits simple Tailwind-style class color tokens", async ({ page }) => {
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

  const fixture = page.getByText("Tailwind token text.")
  const metadata = await fixture.evaluate((element) => ({
    classTokens: element.getAttribute("data-wg-class-tokens"),
    file: element.getAttribute("data-wg-file"),
    id: element.getAttribute("data-wg-id")
  }))

  expect(metadata).toEqual({
    classTokens: baselineClassToken,
    file: "app/page.tsx",
    id: expect.stringContaining("app/page.tsx:")
  })

  await page.getByRole("button", { name: "Edit" }).click()
  await fixture.click()
  await page
    .getByRole("combobox", { name: "Wire Grid class color token" })
    .selectOption(editedClassToken)
  await page.getByRole("button", { exact: true, name: "Save class" }).click()

  await expect(fixture).toHaveCSS("color", "rgb(59, 130, 246)")

  const source = await readFile(pageFilePath, "utf8")

  expect(source).toContain(`className="tailwind-fixture ${editedClassToken}"`)
  expect(relevantResponses).toContainEqual(
    expect.stringContaining("200 http://localhost:3100/__wire-grid/edit")
  )
  expect(consoleMessages).toEqual([])
})

test("edits custom component JSX text when props are forwarded", async ({ page }) => {
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

  const componentFixture = page.locator(".feature-card")
  const metadata = await componentFixture.evaluate((element) => ({
    file: element.getAttribute("data-wg-file"),
    id: element.getAttribute("data-wg-id"),
    kind: element.getAttribute("data-wg-kind")
  }))

  expect(metadata).toEqual({
    file: "app/page.tsx",
    id: expect.stringContaining("app/page.tsx:"),
    kind: "jsx-component-text"
  })

  await page.getByRole("button", { name: "Edit" }).click()
  await componentFixture.click()
  await page
    .getByRole("textbox", { name: "Wire Grid text value" })
    .fill(editedComponentText)
  await page.getByRole("button", { exact: true, name: "Save" }).click()

  await expect(page.getByText(editedComponentText)).toBeVisible()

  const source = await readFile(pageFilePath, "utf8")

  expect(source).toContain(`<FeatureCard>${editedComponentText}</FeatureCard>`)
  expect(relevantResponses).toContainEqual(
    expect.stringContaining("200 http://localhost:3100/__wire-grid/edit")
  )
  expect(consoleMessages).toEqual([])
})

test("edits custom component string props when metadata is forwarded", async ({
  page
}) => {
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

  const callout = page.locator(".callout")
  const metadata = await callout.evaluate((element) => ({
    file: element.getAttribute("data-wg-file"),
    id: element.getAttribute("data-wg-id"),
    kind: element.getAttribute("data-wg-kind"),
    prop: element.getAttribute("data-wg-prop")
  }))

  expect(metadata).toEqual({
    file: "app/page.tsx",
    id: expect.stringContaining("app/page.tsx:"),
    kind: "jsx-prop-text",
    prop: "heading"
  })

  await page.getByRole("button", { name: "Edit" }).click()
  await callout.click()
  await page
    .getByRole("textbox", { name: "Wire Grid text value" })
    .fill(editedPropText)
  await page.getByRole("button", { exact: true, name: "Save" }).click()

  await expect(page.getByText(editedPropText)).toBeVisible()

  const source = await readFile(pageFilePath, "utf8")

  expect(source).toContain(`heading="${editedPropText}"`)
  expect(relevantResponses).toContainEqual(
    expect.stringContaining("200 http://localhost:3100/__wire-grid/edit")
  )
  expect(consoleMessages).toEqual([])
})
