import { instrumentSource } from "@techsavvyash/wire-grid"

interface LoaderContext {
  getOptions?: () => {
    componentTextProps?: string[]
    instrumentComponentProps?: boolean
    instrumentComponentText?: boolean
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
    componentTextProps: options.componentTextProps,
    code: source,
    filePath: this.resourcePath,
    includeCustomComponentProps: options.instrumentComponentProps,
    includeCustomComponents: options.instrumentComponentText,
    rootDir: options.rootDir ?? process.cwd()
  })
}
