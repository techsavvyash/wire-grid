import { WireGridOverlay } from "@techsavvyash/wire-grid-runtime"

import "./globals.css"

export const metadata = {
  title: "Wire Grid Next Basic",
  description: "A local Next.js fixture for Wire Grid development.",
  icons: {
    icon: "/favicon.svg"
  }
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <WireGridOverlay />
      </body>
    </html>
  )
}
