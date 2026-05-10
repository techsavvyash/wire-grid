import type { NextConfig } from "next"

export interface WireGridNextOptions {
  debug?: boolean
  editEndpoint?: string
  enabled?: boolean
  exclude?: string[]
  include?: string[]
  overlay?: boolean
  rootDir?: string
}

export type NextConfigInput =
  | NextConfig
  | ((phase: string, context?: unknown) => NextConfig | Promise<NextConfig>)

export type NextConfigResolver = (
  phase: string,
  context?: unknown
) => NextConfig | Promise<NextConfig>
