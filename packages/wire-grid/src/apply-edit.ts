import { promises as fs } from "node:fs"

import * as t from "@babel/types"
import { parse, print } from "recast"
import * as babelTsParser from "recast/parsers/babel-ts.js"
import { format } from "prettier"

import type { ApplyEditOptions, WireGridEditRequest } from "./types.js"
import { validateSourcePath } from "./validate-source-path.js"

export async function applyEdit({ rootDir, request }: ApplyEditOptions) {
  if (request.edit.kind !== "jsx-text") {
    return unsupported(`Unsupported edit kind: ${request.edit.kind}`)
  }

  if (!request.source.id) {
    return unsupported("Missing source element id.")
  }

  const file = validateSourcePath({
    rootDir,
    filePath: request.source.file
  })
  const code = await fs.readFile(file, "utf8")
  const result = applyJsxTextEdit(code, request)

  if (!result.ok) {
    return result
  }

  const formattedCode = result.code === code ? result.code : await format(result.code, {
    filepath: file,
    semi: false
  })

  if (formattedCode !== code) {
    await fs.writeFile(file, formattedCode)
  }

  return {
    ok: true,
    file: request.source.file,
    changed: formattedCode !== code
  } as const
}

export function applyJsxTextEdit(
  code: string,
  request: WireGridEditRequest
) {
  if (request.edit.kind !== "jsx-text") {
    return unsupported(`Unsupported edit kind: ${request.edit.kind}`)
  }

  const sourceId = request.source.id
  const nextValue = request.edit.value

  if (!sourceId) {
    return unsupported("Missing source element id.")
  }

  const ast = parse(code, {
    parser: babelTsParser
  })

  const targetElement = findTargetElement(ast, request)

  if (!targetElement) {
    return unsupported("Could not find the selected JSX element.")
  }

  const textChild = targetElement.children.find((child) => t.isJSXText(child))

  if (!textChild || !t.isJSXText(textChild)) {
    return unsupported("The selected element does not contain editable text.")
  }

  textChild.value = replaceTrimmedText(textChild.value, nextValue, targetElement)

  return {
    ok: true,
    code: print(ast).code
  } as const
}

function findTargetElement(ast: unknown, request: WireGridEditRequest) {
  const targetElements: t.JSXElement[] = []

  walkAst(ast, (node) => {
    if (targetElements.length > 0 || !t.isJSXElement(node)) {
      return
    }

    if (isTargetElement(node, request)) {
      targetElements.push(node)
    }
  })

  return targetElements[0]
}

function replaceTrimmedText(
  originalValue: string,
  nextValue: string,
  element: t.JSXElement
) {
  if (
    originalValue.includes("\n") ||
    (element.openingElement.loc &&
      element.closingElement?.loc &&
      element.openingElement.loc.end.line < element.closingElement.loc.start.line)
  ) {
    const elementIndent = " ".repeat(element.openingElement.loc?.start.column ?? 0)
    const textIndent = `${elementIndent}  `

    return `\n${textIndent}${nextValue}\n${elementIndent}`
  }

  const leadingWhitespace = originalValue.match(/^\s*/)?.[0] ?? ""
  const trailingWhitespace = originalValue.match(/\s*$/)?.[0] ?? ""

  return `${leadingWhitespace}${nextValue}${trailingWhitespace}`
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

function hasWireGridId(openingElement: t.JSXOpeningElement, id: string) {
  return openingElement.attributes.some((attribute) => {
    if (!t.isJSXAttribute(attribute)) {
      return false
    }

    if (!t.isJSXIdentifier(attribute.name, { name: "data-wg-id" })) {
      return false
    }

    return t.isStringLiteral(attribute.value) && attribute.value.value === id
  })
}

function isTargetElement(element: t.JSXElement, request: WireGridEditRequest) {
  if (request.source.id && hasWireGridId(element.openingElement, request.source.id)) {
    return true
  }

  return (
    request.source.line !== undefined &&
    request.source.column !== undefined &&
    element.openingElement.loc?.start.line === request.source.line &&
    element.openingElement.loc.start.column === request.source.column
  )
}

function unsupported(message: string) {
  return {
    ok: false,
    code: "UNSUPPORTED_NODE",
    message
  } as const
}
