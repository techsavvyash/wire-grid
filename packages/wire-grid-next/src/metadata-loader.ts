import { instrumentSource } from "@techsavvyash/wire-grid"

interface LoaderContext {
  getOptions?: () => {
    rootDir?: string
  }
  resourcePath: string
}

export default function wireGridMetadataLoader(
  this: LoaderContext,
  source: string
) {
  const options = this.getOptions?.() ?? {}

  return instrumentSource({
    code: source,
    filePath: this.resourcePath,
    rootDir: options.rootDir ?? process.cwd()
  })
}
