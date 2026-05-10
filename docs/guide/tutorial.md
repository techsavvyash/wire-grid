# Browser Editing Tutorial

This tutorial shows the current Next.js alpha flow.

<video controls muted playsinline src="/tutorials/wire-grid-product-demo.mp4" style="width: 100%; border-radius: 8px; border: 1px solid var(--vp-c-divider);"></video>

The product demo above shows the complete loop: select rendered text, edit it in the browser, write the change through `POST /__wire-grid/edit`, and confirm the update persists after reload.

## Raw Walkthrough Capture

<video controls muted playsinline src="/tutorials/next-text-edit.webm" style="width: 100%; border-radius: 8px; border: 1px solid var(--vp-c-divider);"></video>

## 1. Start The App

Run the Next.js development server:

```bash
pnpm next dev
```

In this repository, the fixture app runs with:

```bash
pnpm --filter next-basic exec next dev --port 3100
```

## 2. Enable Wire Grid

Open the app in the browser and click the **Wire Grid** edit button in the lower-right corner.

## 3. Select Text

Click text that comes from a native JSX element with direct text children:

```tsx
<h1>Hello, from other side.</h1>
```

The runtime opens a popover containing the current text.

## 4. Save The Edit

Change the text and press **Save**. The runtime sends a request to the development endpoint:

```txt
POST /__wire-grid/edit
```

The core package parses the source file, finds the selected JSX node, updates its text, formats the file, and writes it back to disk.

## 5. Confirm The Source Changed

The source file should now contain the edited text:

```tsx
<h1>Edited in the tutorial.</h1>
```

Next.js refreshes the page after the file write.

## Debugging

When testing this flow, inspect both:

- Browser console warnings and errors.
- Network requests, especially `POST /__wire-grid/edit`.

The expected edit response is `200 OK`.
