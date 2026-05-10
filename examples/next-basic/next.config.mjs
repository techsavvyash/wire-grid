import { withWireGrid } from "@techsavvyash/wire-grid-next"

const nextConfig = {
  reactStrictMode: true
}

export default withWireGrid(nextConfig, {
  debug: process.env.WIRE_GRID_DEBUG === "1"
})
