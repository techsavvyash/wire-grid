import { defineConfig } from "vitepress"

export default defineConfig({
  title: "Wire Grid",
  description: "Development-only browser editing for React source code.",
  cleanUrls: true,
  themeConfig: {
    logo: "/wire-grid-mark.svg",
    nav: [
      { text: "Guide", link: "/guide/getting-started" },
      { text: "Tutorial", link: "/guide/tutorial" },
      { text: "Implementation", link: "/implementation-plan" }
    ],
    sidebar: [
      {
        text: "Guide",
        items: [
          { text: "Getting Started", link: "/guide/getting-started" },
          { text: "Next.js Integration", link: "/guide/next" },
          { text: "Browser Editing Tutorial", link: "/guide/tutorial" },
          { text: "Release Workflow", link: "/guide/releases" }
        ]
      },
      {
        text: "Reference",
        items: [{ text: "Implementation Plan", link: "/implementation-plan" }]
      }
    ],
    socialLinks: [
      { icon: "github", link: "https://github.com/techsavvyash/wire-guard" }
    ],
    search: {
      provider: "local"
    }
  }
})
