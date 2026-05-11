import type { NextConfig } from "next"

export interface WireGridNextOptions {
  debug?: boolean
  editEndpoint?: string
  enabled?: boolean
  exclude?: string[]
  include?: string[]
  componentTextProps?: string[]
  /**
   * Instruments simple custom component text children. This is opt-in because
   * components must forward data-wg-* props to a DOM element for browser
   * selection to work.
   */
  instrumentComponentText?: boolean
  /**
   * Instruments simple string props on custom components. Components must
   * forward data-wg-* props to a DOM element for browser selection to work.
   */
  instrumentComponentProps?: boolean
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
