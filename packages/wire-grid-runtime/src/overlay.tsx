"use client"

import { useEffect, useState } from "react"
import type { CSSProperties } from "react"

export interface WireGridOverlayProps {
  enabled?: boolean
  editEndpoint?: string
}

interface SelectionState {
  element: Element
  rect: DOMRect
  source: {
    column?: number
    file: string
    id: string
    line?: number
  }
}

export function WireGridOverlay({
  editEndpoint = "/__wire-grid/edit",
  enabled = true
}: WireGridOverlayProps) {
  const [active, setActive] = useState(false)
  const [hoverRect, setHoverRect] = useState<DOMRect | null>(null)
  const [selection, setSelection] = useState<SelectionState | null>(null)
  const [value, setValue] = useState("")
  const [status, setStatus] = useState("")

  useEffect(() => {
    if (!active) {
      setHoverRect(null)
      return
    }

    function handlePointerMove(event: PointerEvent) {
      const target = getEditableTarget(event.target)

      setHoverRect(target?.getBoundingClientRect() ?? null)
    }

    function handleClick(event: MouseEvent) {
      const target = getEditableTarget(event.target)

      if (!target) {
        return
      }

      event.preventDefault()
      event.stopPropagation()

      const source = readSource(target)

      if (!source) {
        return
      }

      setSelection({
        element: target,
        rect: target.getBoundingClientRect(),
        source
      })
      setValue(target.textContent?.trim() ?? "")
      setStatus("")
    }

    window.addEventListener("pointermove", handlePointerMove, true)
    window.addEventListener("click", handleClick, true)

    return () => {
      window.removeEventListener("pointermove", handlePointerMove, true)
      window.removeEventListener("click", handleClick, true)
    }
  }, [active])

  if (!enabled || process.env.NODE_ENV === "production") {
    return null
  }

  return (
    <>
      {hoverRect ? <SelectionBox rect={hoverRect} /> : null}
      {selection ? (
        <EditPopover
          editEndpoint={editEndpoint}
          selection={selection}
          setStatus={setStatus}
          setValue={setValue}
          status={status}
          value={value}
        />
      ) : null}
      <div data-wire-grid-overlay style={panelStyle}>
        <span>Wire Grid</span>
        <button
          aria-pressed={active}
          onClick={() => {
            setActive((current) => !current)
            setSelection(null)
            setStatus("")
          }}
          style={buttonStyle(active)}
          type="button"
        >
          {active ? "Editing on" : "Edit"}
        </button>
      </div>
    </>
  )
}

function EditPopover({
  editEndpoint,
  selection,
  setStatus,
  setValue,
  status,
  value
}: {
  editEndpoint: string
  selection: SelectionState
  setStatus: (status: string) => void
  setValue: (value: string) => void
  status: string
  value: string
}) {
  async function saveEdit() {
    setStatus("Saving")

    const response = await fetch(editEndpoint, {
      body: JSON.stringify({
        source: {
          file: selection.source.file,
          id: selection.source.id,
          line: selection.source.line,
          column: selection.source.column
        },
        edit: {
          kind: "jsx-text",
          value
        }
      }),
      headers: {
        "content-type": "application/json"
      },
      method: "POST"
    })
    const result = (await response.json()) as { ok: boolean; message?: string }

    if (!result.ok) {
      setStatus(result.message ?? "Save failed")
      return
    }

    selection.element.textContent = value
    setStatus("Saved")
  }

  const top = Math.max(12, selection.rect.bottom + 8)
  const left = Math.min(
    Math.max(12, selection.rect.left),
    window.innerWidth - 340
  )

  return (
    <div data-wire-grid-overlay style={{ ...popoverStyle, left, top }}>
      <label style={labelStyle} htmlFor="wire-grid-text-input">
        Text
      </label>
      <input
        aria-label="Wire Grid text value"
        id="wire-grid-text-input"
        onChange={(event) => setValue(event.target.value)}
        style={inputStyle}
        value={value}
      />
      <div style={popoverFooterStyle}>
        <button onClick={saveEdit} style={saveButtonStyle} type="button">
          Save
        </button>
        {status ? <span style={statusStyle}>{status}</span> : null}
      </div>
    </div>
  )
}

function SelectionBox({ rect }: { rect: DOMRect }) {
  return (
    <div
      data-wire-grid-overlay
      style={{
        border: "2px solid #2563eb",
        height: rect.height,
        left: rect.left,
        pointerEvents: "none",
        position: "fixed",
        top: rect.top,
        width: rect.width,
        zIndex: 2147483646
      }}
    />
  )
}

function getEditableTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) {
    return null
  }

  if (target.closest("[data-wire-grid-overlay]")) {
    return null
  }

  return target.closest("[data-wg-id][data-wg-file]")
}

function readSource(element: Element) {
  const file = element.getAttribute("data-wg-file")
  const id = element.getAttribute("data-wg-id")
  const line = element.getAttribute("data-wg-line")
  const column = element.getAttribute("data-wg-column")

  if (!file || !id) {
    return null
  }

  return {
    file,
    id,
    line: line ? Number(line) : undefined,
    column: column ? Number(column) : undefined
  }
}

const panelStyle = {
  alignItems: "center",
  background: "#111827",
  border: "1px solid #374151",
  borderRadius: 6,
  bottom: 16,
  color: "#f9fafb",
  display: "flex",
  fontFamily:
    "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  fontSize: 12,
  gap: 8,
  padding: "8px 10px",
  position: "fixed",
  right: 16,
  zIndex: 2147483647
} satisfies CSSProperties

function buttonStyle(active: boolean) {
  return {
    background: active ? "#2563eb" : "#f9fafb",
    border: 0,
    borderRadius: 5,
    color: active ? "#ffffff" : "#111827",
    cursor: "pointer",
    font: "inherit",
    fontWeight: 700,
    padding: "5px 8px"
  } satisfies CSSProperties
}

const popoverStyle = {
  background: "#ffffff",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  boxShadow: "0 20px 50px rgb(15 23 42 / 18%)",
  color: "#111827",
  display: "grid",
  fontFamily:
    "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  gap: 8,
  padding: 12,
  position: "fixed",
  width: 320,
  zIndex: 2147483647
} satisfies CSSProperties

const labelStyle = {
  color: "#4b5563",
  fontSize: 12,
  fontWeight: 700
} satisfies CSSProperties

const inputStyle = {
  border: "1px solid #d1d5db",
  borderRadius: 6,
  color: "#111827",
  font: "inherit",
  fontSize: 14,
  padding: "8px 10px",
  width: "100%"
} satisfies CSSProperties

const popoverFooterStyle = {
  alignItems: "center",
  display: "flex",
  gap: 8,
  justifyContent: "space-between"
} satisfies CSSProperties

const saveButtonStyle = {
  background: "#111827",
  border: 0,
  borderRadius: 6,
  color: "#ffffff",
  cursor: "pointer",
  font: "inherit",
  fontSize: 13,
  fontWeight: 700,
  padding: "7px 10px"
} satisfies CSSProperties

const statusStyle = {
  color: "#4b5563",
  fontSize: 12
} satisfies CSSProperties
