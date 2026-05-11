import { createServer, type IncomingMessage, type ServerResponse } from "node:http"
import { promises as fs } from "node:fs"
import path from "node:path"

import {
  applyEdit,
  validateSourcePath,
  type WireGridEditRequest
} from "@techsavvyash/wire-grid"

import type { WireGridNextOptions } from "../types.js"

interface WireGridDevServer {
  port: number
}

const servers = new Map<string, Promise<WireGridDevServer>>()

export function ensureWireGridDevServer(options: RequiredDevServerOptions) {
  const rootDir = path.resolve(options.rootDir)
  const key = `${rootDir}:${options.editEndpoint}`
  const existing = servers.get(key)

  if (existing) {
    return existing
  }

  const server = startWireGridDevServer({
    ...options,
    rootDir
  })

  servers.set(key, server)
  return server
}

interface RequiredDevServerOptions {
  debug?: WireGridNextOptions["debug"]
  editEndpoint: string
  rootDir: string
}

function startWireGridDevServer(options: RequiredDevServerOptions) {
  const editHistory: EditSnapshot[] = []

  const server = createServer(async (request, response) => {
    if (request.url !== options.editEndpoint) {
      sendJson(response, 404, {
        ok: false,
        code: "NOT_FOUND",
        message: "Unknown Wire Grid endpoint."
      })
      return
    }

    if (request.method !== "POST") {
      sendJson(response, 405, {
        ok: false,
        code: "METHOD_NOT_ALLOWED",
        message: "Wire Grid edit endpoint only accepts POST requests."
      })
      return
    }

    try {
      const body = await readJsonBody<WireGridEditRequest | WireGridUndoRequest>(
        request
      )

      if (isUndoRequest(body)) {
        const snapshot = editHistory.pop()

        if (!snapshot) {
          sendJson(response, 422, {
            ok: false,
            code: "NO_EDIT_HISTORY",
            message: "There is no Wire Grid edit to undo."
          })
          return
        }

        await fs.writeFile(snapshot.filePath, snapshot.code)

        sendJson(response, 200, {
          ok: true,
          file: snapshot.sourceFile,
          changed: true,
          undone: true
        })
        return
      }

      const snapshot = body.preview
        ? null
        : await readEditSnapshot(options.rootDir, body)
      const result = await applyEdit({
        rootDir: options.rootDir,
        request: body
      })

      if (snapshot && result.ok && result.changed) {
        editHistory.push(snapshot)
      }

      sendJson(response, result.ok ? 200 : 422, result)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"

      sendJson(response, 400, {
        ok: false,
        code: "BAD_REQUEST",
        message
      })
    }
  })

  return new Promise<WireGridDevServer>((resolve, reject) => {
    server.once("error", reject)
    server.listen(0, "127.0.0.1", () => {
      const address = server.address()

      if (!address || typeof address === "string") {
        reject(new Error("Wire Grid dev server did not expose a TCP port."))
        return
      }

      if (options.debug) {
        console.log(`[wire-grid] edit server listening on ${address.port}`)
      }

      resolve({ port: address.port })
    })
  })
}

interface EditSnapshot {
  code: string
  filePath: string
  sourceFile: string
}

interface WireGridUndoRequest {
  action: "undo"
}

function isUndoRequest(
  request: WireGridEditRequest | WireGridUndoRequest
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

function readJsonBody<T>(request: IncomingMessage) {
  return new Promise<T>((resolve, reject) => {
    let body = ""

    request.setEncoding("utf8")
    request.on("data", (chunk) => {
      body += chunk
    })
    request.on("end", () => {
      try {
        resolve(JSON.parse(body) as T)
      } catch {
        reject(new Error("Request body must be valid JSON."))
      }
    })
    request.on("error", reject)
  })
}

function sendJson(response: ServerResponse, statusCode: number, payload: unknown) {
  response.statusCode = statusCode
  response.setHeader("content-type", "application/json")
  response.end(JSON.stringify(payload))
}
