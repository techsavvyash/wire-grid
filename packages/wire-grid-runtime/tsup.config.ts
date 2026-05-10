import { defineConfig } from "tsup"

export default defineConfig({
  banner: {
    js: '"use client";'
  },
  clean: true,
  dts: false,
  entry: ["src/index.ts"],
  format: ["esm"],
  sourcemap: true,
  splitting: false,
  target: "es2022"
})
