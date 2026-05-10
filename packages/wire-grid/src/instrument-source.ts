import path from "node:path"

import { parse, print } from "recast"
import * as babelTsParser from "recast/parsers/babel-ts.js"
import * as t from "@babel/types"

export interface InstrumentSourceOptions {
  code: string
  filePath: string
  rootDir: string
}

export function instrumentSource({
  code,
  filePath,
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

    if (!shouldInstrumentElement(node)) {
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
    addAttribute(openingElement, "data-wg-kind", "jsx-text")
    changed = true
  })

  if (!changed) {
    return code
  }

  return print(ast).code
}

function shouldInstrumentElement(element: t.JSXElement) {
  const name = element.openingElement.name

  if (!t.isJSXIdentifier(name) || name.name !== name.name.toLowerCase()) {
    return false
  }

  if (hasAttribute(element.openingElement, "data-wg-id")) {
    return false
  }

  return element.children.some(
    (child) => t.isJSXText(child) && child.value.trim().length > 0
  )
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

function walkAst(node: unknown, visitor: (node: t.Node) => void) {
  if (!t.isNode(node)) {
    return
  }

  visitor(node)

  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      for (const child of value) {
        walkAst(child, visitor)
      }
      continue
    }

    walkAst(value, visitor)
  }
}

function toPosixPath(filePath: string) {
  return filePath.split(path.sep).join("/")
}
