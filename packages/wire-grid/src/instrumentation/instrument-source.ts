import path from "node:path"

import { parse, print } from "recast"
import * as babelTsParser from "recast/parsers/babel-ts.js"
import * as t from "@babel/types"

import { walkAst } from "../internal/ast.js"

export interface InstrumentSourceOptions {
  componentTextProps?: readonly string[]
  code: string
  filePath: string
  includeCustomComponents?: boolean
  includeCustomComponentProps?: boolean
  rootDir: string
}

const DEFAULT_COMPONENT_TEXT_PROPS = [
  "heading",
  "label",
  "title",
  "text"
] as const

export function instrumentSource({
  componentTextProps = DEFAULT_COMPONENT_TEXT_PROPS,
  code,
  filePath,
  includeCustomComponentProps = false,
  includeCustomComponents = false,
  rootDir
}: InstrumentSourceOptions) {
  const relativeFilePath = toPosixPath(path.relative(rootDir, filePath))
  const ast = parse(code, {
    parser: babelTsParser
  })
  let changed = false

  walkAst(ast, (node) => {
    if (!t.isJSXElement(node)) {
      return
    }

    const openingElement = node.openingElement

    const metadata = getEditableElementMetadata(node, {
      componentTextProps,
      includeCustomComponentProps,
      includeCustomComponents
    })
    const editableStyleProps = getEditableStyleProps(node)

    if (!metadata && editableStyleProps.length === 0) {
      return
    }

    const line = openingElement.loc?.start.line
    const column = openingElement.loc?.start.column

    if (line === undefined || column === undefined) {
      return
    }

    addAttribute(openingElement, "data-wg-file", relativeFilePath)
    addAttribute(openingElement, "data-wg-id", `${relativeFilePath}:${line}:${column}`)
    addAttribute(openingElement, "data-wg-line", String(line))
    addAttribute(openingElement, "data-wg-column", String(column))
    addAttribute(openingElement, "data-wg-kind", metadata?.kind ?? "jsx-style")

    if (metadata?.prop) {
      addAttribute(openingElement, "data-wg-prop", metadata.prop)
    }

    if (editableStyleProps.length > 0) {
      addAttribute(openingElement, "data-wg-style-props", editableStyleProps.join(","))
    }

    changed = true
  })

  if (!changed) {
    return code
  }

  return print(ast).code
}

function getEditableElementMetadata(
  element: t.JSXElement,
  options: {
    componentTextProps: readonly string[]
    includeCustomComponentProps: boolean
    includeCustomComponents: boolean
  }
) {
  const name = element.openingElement.name

  if (!t.isJSXIdentifier(name)) {
    return null
  }

  if (hasAttribute(element.openingElement, "data-wg-id")) {
    return null
  }

  const isNativeElement = name.name === name.name.toLowerCase()
  const isCustomComponent = name.name[0] === name.name[0]?.toUpperCase()
  const hasEditableText = element.children.some(
    (child) => t.isJSXText(child) && child.value.trim().length > 0
  )

  if (hasEditableText && isNativeElement) {
    return { kind: "jsx-text" }
  }

  if (hasEditableText && options.includeCustomComponents && isCustomComponent) {
    return { kind: "jsx-component-text" }
  }

  if (options.includeCustomComponentProps && isCustomComponent) {
    const prop = findEditableTextProp(element.openingElement, options.componentTextProps)

    if (prop) {
      return {
        kind: "jsx-prop-text",
        prop
      }
    }
  }

  return null
}

function findEditableTextProp(
  openingElement: t.JSXOpeningElement,
  componentTextProps: readonly string[]
) {
  const editableProps = openingElement.attributes.filter((attribute) => {
    if (!t.isJSXAttribute(attribute)) {
      return false
    }

    if (!t.isJSXIdentifier(attribute.name)) {
      return false
    }

    return (
      componentTextProps.includes(attribute.name.name) &&
      t.isStringLiteral(attribute.value)
    )
  })

  if (editableProps.length !== 1) {
    return null
  }

  const [attribute] = editableProps

  return t.isJSXAttribute(attribute) && t.isJSXIdentifier(attribute.name)
    ? attribute.name.name
    : null
}

function getEditableStyleProps(element: t.JSXElement) {
  const name = element.openingElement.name

  if (!t.isJSXIdentifier(name) || name.name !== name.name.toLowerCase()) {
    return []
  }

  const styleAttribute = element.openingElement.attributes.find(
    (attribute) =>
      t.isJSXAttribute(attribute) &&
      t.isJSXIdentifier(attribute.name, { name: "style" })
  )

  if (
    !styleAttribute ||
    !t.isJSXAttribute(styleAttribute) ||
    !t.isJSXExpressionContainer(styleAttribute.value) ||
    !t.isObjectExpression(styleAttribute.value.expression)
  ) {
    return []
  }

  return ["color"]
}

function addAttribute(
  openingElement: t.JSXOpeningElement,
  name: string,
  value: string
) {
  if (hasAttribute(openingElement, name)) {
    return
  }

  openingElement.attributes.push(
    t.jsxAttribute(t.jsxIdentifier(name), t.stringLiteral(value))
  )
}

function hasAttribute(openingElement: t.JSXOpeningElement, name: string) {
  return openingElement.attributes.some(
    (attribute) =>
      t.isJSXAttribute(attribute) &&
      t.isJSXIdentifier(attribute.name, { name })
  )
}

function toPosixPath(filePath: string) {
  return filePath.split(path.sep).join("/")
}
