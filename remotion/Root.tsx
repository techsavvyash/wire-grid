import {
  AbsoluteFill,
  Composition,
  Sequence,
  Video,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion"
import type { CSSProperties } from "react"

const fps = 30
const width = 1920
const height = 1080
const durationInFrames = 450

const clips = {
  select: "wire-grid-video/clips/clip-01-select.webm",
  save: "wire-grid-video/clips/clip-02-save.webm",
  persist: "wire-grid-video/clips/clip-03-persist.webm",
} as const

export function RemotionRoot() {
  return (
    <Composition
      id="WireGridProductDemo"
      component={WireGridProductDemo}
      durationInFrames={durationInFrames}
      fps={fps}
      width={width}
      height={height}
    />
  )
}

function WireGridProductDemo() {
  return (
    <AbsoluteFill style={styles.stage}>
      <Background />
      <Sequence durationInFrames={78}>
        <Intro />
      </Sequence>
      <Sequence from={54} durationInFrames={120}>
        <BrowserScene
          clip={clips.select}
          eyebrow="Step 1"
          title="Select rendered text"
          detail="Wire Grid maps browser selection back to JSX source metadata."
          accent="#44d19d"
          cursor="select"
        />
      </Sequence>
      <Sequence from={174} durationInFrames={124}>
        <BrowserScene
          clip={clips.save}
          eyebrow="Step 2"
          title="Edit and save"
          detail="The dev endpoint writes the change to the real source file."
          accent="#f2b84b"
          cursor="save"
        />
      </Sequence>
      <Sequence from={298} durationInFrames={92}>
        <CodeScene />
      </Sequence>
      <Sequence from={390} durationInFrames={60}>
        <BrowserScene
          clip={clips.persist}
          eyebrow="Step 3"
          title="Refresh confirms persistence"
          detail="The changed JSX survives reloads because the file changed."
          accent="#70a5ff"
          cursor="persist"
        />
      </Sequence>
      <Sequence from={424} durationInFrames={26}>
        <Outro />
      </Sequence>
    </AbsoluteFill>
  )
}

function Background() {
  return (
    <AbsoluteFill style={styles.background}>
      <div style={styles.grid} />
      <div style={{ ...styles.sweep, left: -260, top: 120 }} />
      <div style={{ ...styles.sweep, right: -320, bottom: 40, opacity: 0.2 }} />
    </AbsoluteFill>
  )
}

function Intro() {
  const frame = useCurrentFrame()
  const y = interpolate(frame, [0, 32], [54, 0], {
    extrapolateRight: "clamp",
  })
  const opacity = interpolate(frame, [0, 24, 66, 78], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })

  return (
    <AbsoluteFill style={{ ...styles.center, opacity }}>
      <div style={{ ...styles.logoMark, transform: `translateY(${y}px)` }}>
        WG
      </div>
      <h1 style={{ ...styles.heroTitle, transform: `translateY(${y}px)` }}>
        Edit React UI from the browser.
      </h1>
      <p style={styles.heroSubtitle}>Select text. Change color. Save to code.</p>
    </AbsoluteFill>
  )
}

function BrowserScene({
  clip,
  eyebrow,
  title,
  detail,
  accent,
  cursor,
  compact = false,
}: {
  clip: string
  eyebrow: string
  title: string
  detail: string
  accent: string
  cursor: "select" | "save" | "persist"
  compact?: boolean
}) {
  const frame = useCurrentFrame()
  const enter = interpolate(frame, [0, 22], [0.92, 1], {
    extrapolateRight: "clamp",
  })
  const opacity = interpolate(frame, [0, 16], [0, 1], {
    extrapolateRight: "clamp",
  })
  const exit = interpolate(frame, [compact ? 58 : 102, compact ? 82 : 126], [1, 0.96], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })
  const cursorPosition = cursorPath(cursor, frame)

  return (
    <AbsoluteFill style={{ ...styles.scene, opacity }}>
      <div style={styles.copyBlock}>
        <div style={{ ...styles.eyebrow, color: accent }}>{eyebrow}</div>
        <h2 style={styles.sceneTitle}>{title}</h2>
        <p style={styles.sceneText}>{detail}</p>
      </div>
      <div
        style={{
          ...styles.browserFrame,
          transform: `translateX(${compact ? 160 : 0}px) scale(${enter * exit})`,
          borderColor: `${accent}55`,
        }}
      >
        <div style={styles.browserChrome}>
          <span style={{ ...styles.dot, backgroundColor: "#ff6b6b" }} />
          <span style={{ ...styles.dot, backgroundColor: "#ffd166" }} />
          <span style={{ ...styles.dot, backgroundColor: "#44d19d" }} />
          <span style={styles.address}>localhost:3100</span>
        </div>
        <div style={styles.videoWrap}>
          <Video muted src={staticFile(clip)} style={styles.video} />
          <div
            style={{
              ...styles.cursor,
              transform: `translate(${cursorPosition.x}px, ${cursorPosition.y}px) rotate(-18deg)`,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  )
}

function CodeScene() {
  const frame = useCurrentFrame()
  const opacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateRight: "clamp",
  })
  const shift = interpolate(frame, [0, 26], [44, 0], {
    extrapolateRight: "clamp",
  })

  return (
    <AbsoluteFill style={{ ...styles.codeScene, opacity }}>
      <div style={{ ...styles.panel, transform: `translateX(${-shift}px)` }}>
        <div style={styles.panelHeader}>
          <span>examples/next-basic/app/page.tsx</span>
          <span style={styles.saved}>saved</span>
        </div>
        <pre style={styles.code}>
          <code>
            <span style={styles.dim}>{"<section className=\"hero\">"}</span>
            {"\n"}
            <span style={styles.remove}>{"-  <h1>Hello, from other side.</h1>"}</span>
            {"\n"}
            <span style={styles.add}>+  {"<h1>Ship edits straight to code.</h1>"}</span>
            {"\n"}
            <span style={styles.dim}>{"</section>"}</span>
          </code>
        </pre>
      </div>
      <div style={{ ...styles.statusStack, transform: `translateX(${shift}px)` }}>
        <Status label="POST /__wire-grid/edit" value="200 OK" color="#44d19d" />
        <Status label="Next.js" value="Fast Refresh" color="#70a5ff" />
        <Status label="Source" value="Persisted on disk" color="#f2b84b" />
      </div>
    </AbsoluteFill>
  )
}

function Outro() {
  const frame = useCurrentFrame()
  const opacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateRight: "clamp",
  })

  return (
    <AbsoluteFill style={{ ...styles.outro, opacity }}>
      <h2 style={styles.outroTitle}>Browser edits, real code changes.</h2>
      <p style={styles.outroText}>@techsavvyash/wire-grid-next</p>
    </AbsoluteFill>
  )
}

function Status({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color: string
}) {
  return (
    <div style={styles.status}>
      <span style={styles.statusLabel}>{label}</span>
      <strong style={{ ...styles.statusValue, color }}>{value}</strong>
    </div>
  )
}

function cursorPath(kind: "select" | "save" | "persist", frame: number) {
  if (kind === "save") {
    return {
      x: interpolate(frame, [0, 48, 92, 120], [1360, 960, 1170, 1170], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
      y: interpolate(frame, [0, 48, 92, 120], [800, 470, 600, 600], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
    }
  }

  if (kind === "persist") {
    return {
      x: interpolate(frame, [0, 36, 72], [1420, 1050, 1050], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
      y: interpolate(frame, [0, 36, 72], [780, 130, 130], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
    }
  }

  return {
    x: interpolate(frame, [0, 42, 96], [1460, 760, 760], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    y: interpolate(frame, [0, 42, 96], [790, 330, 330], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  }
}

const fontFamily =
  'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'

const styles: Record<string, CSSProperties> = {
  stage: {
    backgroundColor: "#080b12",
    color: "#f8fafc",
    fontFamily,
    overflow: "hidden",
  },
  background: {
    background:
      "linear-gradient(135deg, #080b12 0%, #111827 42%, #16201d 100%)",
  },
  grid: {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "linear-gradient(rgba(255,255,255,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.055) 1px, transparent 1px)",
    backgroundSize: "64px 64px",
    maskImage: "radial-gradient(circle at center, black 0%, transparent 72%)",
  },
  sweep: {
    position: "absolute",
    width: 720,
    height: 720,
    borderRadius: 720,
    background: "radial-gradient(circle, rgba(68,209,157,0.28), transparent 64%)",
    filter: "blur(10px)",
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: 120,
  },
  logoMark: {
    display: "grid",
    placeItems: "center",
    width: 118,
    height: 118,
    borderRadius: 28,
    backgroundColor: "#44d19d",
    color: "#07100d",
    fontSize: 44,
    fontWeight: 900,
    marginBottom: 44,
    boxShadow: "0 28px 90px rgba(68,209,157,0.28)",
  },
  heroTitle: {
    maxWidth: 1220,
    margin: 0,
    fontSize: 98,
    lineHeight: 1,
    letterSpacing: 0,
    fontWeight: 900,
  },
  heroSubtitle: {
    marginTop: 34,
    color: "#cbd5e1",
    fontSize: 34,
    lineHeight: 1.35,
  },
  scene: {
    padding: "104px 118px",
    justifyContent: "center",
  },
  copyBlock: {
    position: "absolute",
    left: 118,
    top: 148,
    width: 360,
    zIndex: 3,
  },
  eyebrow: {
    textTransform: "uppercase",
    fontSize: 22,
    fontWeight: 800,
    letterSpacing: 0,
    marginBottom: 18,
  },
  sceneTitle: {
    margin: 0,
    fontSize: 62,
    lineHeight: 1.02,
    letterSpacing: 0,
    fontWeight: 900,
  },
  sceneText: {
    marginTop: 24,
    color: "#cbd5e1",
    fontSize: 26,
    lineHeight: 1.38,
  },
  browserFrame: {
    position: "absolute",
    right: 112,
    top: 112,
    width: 1260,
    height: 708,
    border: "2px solid rgba(255,255,255,0.16)",
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#f8fafc",
    boxShadow: "0 44px 120px rgba(0,0,0,0.5)",
  },
  browserChrome: {
    height: 62,
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "0 22px",
    backgroundColor: "#111827",
    borderBottom: "1px solid rgba(255,255,255,0.12)",
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 16,
  },
  address: {
    marginLeft: 18,
    padding: "8px 18px",
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    color: "#dbeafe",
    fontSize: 18,
    fontWeight: 700,
  },
  videoWrap: {
    position: "relative",
    height: 646,
    overflow: "hidden",
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  cursor: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    borderLeft: "24px solid #ffffff",
    borderTop: "34px solid transparent",
    borderBottom: "10px solid transparent",
    filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.38))",
  },
  codeScene: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 46,
    padding: "0 132px",
  },
  panel: {
    width: 980,
    borderRadius: 24,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.14)",
    backgroundColor: "#0f172a",
    boxShadow: "0 38px 100px rgba(0,0,0,0.42)",
  },
  panelHeader: {
    height: 70,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 26px",
    color: "#bfdbfe",
    fontSize: 22,
    fontWeight: 800,
    borderBottom: "1px solid rgba(255,255,255,0.12)",
  },
  saved: {
    color: "#44d19d",
  },
  code: {
    margin: 0,
    padding: 36,
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
    fontSize: 30,
    lineHeight: 1.7,
    color: "#e2e8f0",
  },
  dim: {
    color: "#94a3b8",
  },
  remove: {
    color: "#fda4af",
    backgroundColor: "rgba(244,63,94,0.12)",
  },
  add: {
    color: "#86efac",
    backgroundColor: "rgba(34,197,94,0.12)",
  },
  statusStack: {
    width: 430,
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  status: {
    padding: "26px 28px",
    borderRadius: 20,
    backgroundColor: "rgba(15,23,42,0.82)",
    border: "1px solid rgba(255,255,255,0.12)",
  },
  statusLabel: {
    display: "block",
    color: "#cbd5e1",
    fontSize: 22,
    marginBottom: 10,
  },
  statusValue: {
    display: "block",
    fontSize: 34,
    lineHeight: 1.15,
  },
  outro: {
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    backgroundColor: "#080b12",
  },
  outroTitle: {
    margin: 0,
    fontSize: 76,
    lineHeight: 1,
    letterSpacing: 0,
    fontWeight: 900,
  },
  outroText: {
    marginTop: 28,
    color: "#44d19d",
    fontSize: 34,
    fontWeight: 800,
  },
}
