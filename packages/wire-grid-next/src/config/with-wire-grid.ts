import type { NextConfig } from "next"
import path from "node:path"

import type {
  NextConfigInput,
  NextConfigResolver,
  WireGridNextOptions
} from "../types.js"
import { ensureWireGridDevServer } from "../server/dev-server.js"

const PHASE_DEVELOPMENT_SERVER = "phase-development-server"

const DEFAULT_OPTIONS = {
  editEndpoint: "/__wire-grid/edit",
  overlay: true
} satisfies WireGridNextOptions

export function withWireGrid(
  nextConfig: NextConfigInput = {},
  options: WireGridNextOptions = {}
): NextConfigResolver {
  return async (phase, context) => {
    const resolveConfig = async (config: NextConfig) => {
      if (phase !== PHASE_DEVELOPMENT_SERVER || options.enabled === false) {
        return config
      }

      const resolvedOptions = { ...DEFAULT_OPTIONS, ...options }
      const rootDir = resolvedOptions.rootDir ?? process.cwd()
      const componentTextProps = resolvedOptions.componentTextProps ?? [
        "heading",
        "label",
        "title",
        "text"
      ]
      const instrumentComponentProps =
        resolvedOptions.instrumentComponentProps === true
      const instrumentComponentText =
        resolvedOptions.instrumentComponentText === true
      const metadataLoader = path.resolve(
        path.dirname(new URL(import.meta.url).pathname),
        "metadata-loader.js"
      )
      const editServer = await ensureWireGridDevServer({
        debug: resolvedOptions.debug,
        editEndpoint: resolvedOptions.editEndpoint,
        rootDir
      })
      const userWebpack = config.webpack
      const userRewrites = config.rewrites
      const turbopackRules = config.turbopack?.rules ?? {}

      const configWithRewrites = {
        ...config,
        turbopack: {
          ...config.turbopack,
          rules: {
            ...turbopackRules,
            "*.{jsx,tsx}": {
              loaders: [
                {
                  loader: metadataLoader,
                  options: {
                    componentTextProps,
                    instrumentComponentProps,
                    instrumentComponentText,
                    rootDir
                  }
                }
              ],
              as: "*.tsx"
            }
          }
        },
        async rewrites() {
          const wireGridRewrite = {
            source: resolvedOptions.editEndpoint,
            destination: `http://127.0.0.1:${editServer.port}${resolvedOptions.editEndpoint}`
          }

          if (typeof userRewrites !== "function") {
            return [wireGridRewrite]
          }

          const rewrites = await userRewrites()

          if (Array.isArray(rewrites)) {
            return [wireGridRewrite, ...rewrites]
          }

          return {
            ...rewrites,
            beforeFiles: [wireGridRewrite, ...(rewrites.beforeFiles ?? [])]
          }
        }
      } satisfies NextConfig

      if (typeof userWebpack !== "function") {
        if (resolvedOptions.debug) {
          console.log("[wire-grid] enabled")
        }

        return configWithRewrites
      }

      return {
        ...configWithRewrites,
        webpack(
          webpackConfig: Parameters<NonNullable<NextConfig["webpack"]>>[0],
          webpackContext: Parameters<NonNullable<NextConfig["webpack"]>>[1]
        ) {
          webpackConfig.module.rules.push({
            enforce: "pre",
            exclude: /node_modules/,
            test: /\.[jt]sx$/,
            use: [
              {
                loader: metadataLoader,
                options: {
                  componentTextProps,
                  instrumentComponentProps,
                  instrumentComponentText,
                  rootDir
                }
              }
            ]
          })

          if (resolvedOptions.debug) {
            console.log(
              `[wire-grid] enabled for ${webpackContext.isServer ? "server" : "client"} compiler`
            )
          }

          return userWebpack(webpackConfig, webpackContext)
        }
      }
    }

    if (typeof nextConfig === "function") {
      const config = await nextConfig(phase, context)
      return resolveConfig(config)
    }

    return resolveConfig(nextConfig)
  }
}
