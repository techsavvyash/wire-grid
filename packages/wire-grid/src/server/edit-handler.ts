import { promises as fs } from "node:fs"

import { applyEdit } from "../edit/apply-edit.js"
import { validateSourcePath } from "../security/validate-source-path.js"
import type { WireGridEditRequest } from "../types.js"

export interface WireGridEditHandlerOptions {
  rootDir: string
}

export interface WireGridUndoRequest {
  action: "undo"
}

export type WireGridEditHandlerRequest =
  | WireGridEditRequest
  | WireGridUndoRequest

export interface WireGridEditHandlerResult {
  statusCode: number
  payload: unknown
}

interface EditSnapshot {
  code: string
  filePath: string
  sourceFile: string
}

export function createWireGridEditHandler(options: WireGridEditHandlerOptions) {
  const editHistory: EditSnapshot[] = []

  return async function handleWireGridEdit(
    body: WireGridEditHandlerRequest
  ): Promise<WireGridEditHandlerResult> {
    if (isUndoRequest(body)) {
      const snapshot = editHistory.pop()

      if (!snapshot) {
        return {
          statusCode: 422,
          payload: {
            ok: false,
            code: "NO_EDIT_HISTORY",
            message: "There is no Wire Grid edit to undo."
          }
        }
      }

      await fs.writeFile(snapshot.filePath, snapshot.code)

      return {
        statusCode: 200,
        payload: {
          ok: true,
          file: snapshot.sourceFile,
          changed: true,
          undone: true
        }
      }
    }

    const snapshot = body.preview ? null : await readEditSnapshot(options.rootDir, body)
    const result = await applyEdit({
      rootDir: options.rootDir,
      request: body
    })

    if (snapshot && result.ok && result.changed) {
      editHistory.push(snapshot)
    }

    return {
      statusCode: result.ok ? 200 : 422,
      payload: result
    }
  }
}

function isUndoRequest(
  request: WireGridEditHandlerRequest
): request is WireGridUndoRequest {
  return "action" in request && request.action === "undo"
}

async function readEditSnapshot(rootDir: string, request: WireGridEditRequest) {
  const filePath = validateSourcePath({
    rootDir,
    filePath: request.source.file
  })

  return {
    code: await fs.readFile(filePath, "utf8"),
    filePath,
    sourceFile: request.source.file
  }
}
