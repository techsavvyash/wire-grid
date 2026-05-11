import * as t from "@babel/types"

export function walkAst(node: unknown, visitor: (node: t.Node) => void) {
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
