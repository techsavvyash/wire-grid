import path from "node:path"

import type { ValidateSourcePathOptions } from "./types.js"

const DEFAULT_ALLOWED_EXTENSIONS = [".js", ".jsx", ".ts", ".tsx"] as const
const BLOCKED_SEGMENTS = new Set([
  ".git",
  ".next",
  "build",
  "dist",
  "node_modules"
])

export function validateSourcePath({
  rootDir,
  filePath,
  allowedExtensions = DEFAULT_ALLOWED_EXTENSIONS
}: ValidateSourcePathOptions): string {
  if (path.isAbsolute(filePath)) {
    throw new Error("Source file path must be relative to the project root.")
  }

  const normalizedRoot = path.resolve(rootDir)
  const resolvedFile = path.resolve(normalizedRoot, filePath)
  const relativePath = path.relative(normalizedRoot, resolvedFile)

  if (
    relativePath === "" ||
    relativePath.startsWith("..") ||
    path.isAbsolute(relativePath)
  ) {
    throw new Error("Source file path must stay inside the project root.")
  }

  const segments = relativePath.split(path.sep)

  if (segments.some((segment) => BLOCKED_SEGMENTS.has(segment))) {
    throw new Error("Source file path points to a blocked directory.")
  }

  const extension = path.extname(relativePath)

  if (!allowedExtensions.includes(extension)) {
    throw new Error(`Unsupported source file extension: ${extension}`)
  }

  return resolvedFile
}
