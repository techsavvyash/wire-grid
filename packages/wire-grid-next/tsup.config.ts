import { defineConfig } from "tsup"

export default defineConfig({
  clean: true,
  dts: false,
  entry: ["src/index.ts", "src/metadata-loader.ts"],
  format: ["esm"],
  sourcemap: true,
  splitting: false,
  target: "es2022"
})
