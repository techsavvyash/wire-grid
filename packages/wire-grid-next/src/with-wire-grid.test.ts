import { describe, expect, it } from "vitest"

import { withWireGrid } from "./with-wire-grid.js"

const PHASE_DEVELOPMENT_SERVER = "phase-development-server"
const PHASE_PRODUCTION_BUILD = "phase-production-build"

describe("withWireGrid", () => {
  it("returns the original config during production build", async () => {
    const config = { reactStrictMode: true }
    const wrapped = withWireGrid(config)

    await expect(wrapped(PHASE_PRODUCTION_BUILD)).resolves.toBe(config)
  })

  it("adds rewrites without adding webpack when the user did not define webpack", async () => {
    const config = { reactStrictMode: true }
    const wrapped = withWireGrid(config, {
      rootDir: process.cwd()
    })
    const result = await wrapped(PHASE_DEVELOPMENT_SERVER)

    expect(result.webpack).toBeUndefined()
    expect(result.turbopack?.rules).toHaveProperty("*.{jsx,tsx}")
    await expect(result.rewrites?.()).resolves.toEqual([
      expect.objectContaining({
        source: "/__wire-grid/edit"
      })
    ])
  })

  it("preserves a user webpack function during development", async () => {
    const webpackConfig = { module: { rules: [] } }
    const wrapped = withWireGrid({
      webpack(config) {
        return { ...config, touched: true }
      }
    })
    const result = await wrapped(PHASE_DEVELOPMENT_SERVER)

    expect(result.webpack?.(webpackConfig, {
      buildId: "dev",
      config: {},
      defaultLoaders: {},
      dev: true,
      dir: "/repo/app",
      isServer: false,
      nextRuntime: undefined,
      totalPages: 1,
      webpack: {}
    })).toEqual({ ...webpackConfig, touched: true })
  })
})
