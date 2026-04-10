# @kweaver-web/icons

React inline SVG icon package for KWeaver Web.

## Install

```bash
pnpm add @kweaver-web/icons react
```

## Using internally

When apps under `apps/` need to reference this package during build, use the **workspace protocol**:

### Step 1: Add workspace dependency in the app

In the app's `package.json` (e.g. `apps/dip/package.json`):

```json
{
  "dependencies": {
    "@kweaver-web/icons": "workspace:*",
    "react": "^18.3.1"
  }
}
```

### Step 2: Install dependencies

From the **repository root**:

```bash
pnpm install
```

pnpm resolves `workspace:*` to the local `packages/icons` package.

### Step 3: Build order (handled automatically)

The project uses Turbo with `"dependsOn": ["^build"]`. When you run:

```bash
pnpm build
```

from the root, Turbo will:
1. Build `packages/icons` first (output `dist/`)
2. Then build any app that depends on it

No manual build order is needed.

### Step 4: Use in code

Same import as when the package is published to npm:

```tsx
import { AddOutlined, ToolColored } from '@kweaver-web/icons'
```

### Prevent accidental publish (optional)

To avoid accidental publish to npm, add `"private": true` to `packages/icons/package.json`:

```json
{
  "name": "@kweaver-web/icons",
  "private": true,
  ...
}
```

---

## Usage

```tsx
import { AddOutlined, ToolColored } from '@kweaver-web/icons'

export function Example() {
  return (
    <>
      <AddOutlined />
      <AddOutlined size={20} />
      <AddOutlined color="#1677ff" />
      <AddOutlined className="icon" style={{ fontSize: 24, color: '#1677ff' }} />

      <ToolColored size={24} />
      <ToolColored className="icon" style={{ fontSize: 24 }} />
    </>
  )
}
```

## API

Outlined icons support:
- `size`
- `className`
- `style`
- `color`
- standard `SVG` props

Colored icons support:
- `size`
- `className`
- `style`
- standard `SVG` props

Outlined icons default to `currentColor`, so they can inherit CSS color from text or custom class styles.

---

## Iconfont configuration and generation flow

### 1. Configure iconfont links

Source URLs are configured in `scripts/config.ts`:

```ts
// scripts/config.ts

// Outlined icons
const OutlinedLink = '//at.alicdn.com/t/c/font_xxxxx_xxxx.js'
// Colored icons
const ColoredLink = '//at.alicdn.com/t/c/font_xxxxx_xxxx.js'

export const outlinedIconSource: IconSourceConfig = {
  kind: 'outlined',
  suffix: 'Outlined',
  symbolUrl: normalizeSymbolUrl(OutlinedLink),
  rawDir: 'raw-svgs/outlined',
  componentDir: 'src/components/outlined',
}

export const coloredIconSource: IconSourceConfig = {
  kind: 'colored',
  suffix: 'Colored',
  symbolUrl: normalizeSymbolUrl(ColoredLink),
  rawDir: 'raw-svgs/colored',
  componentDir: 'src/components/colored',
}
```

**How to get the Symbol URL:**

1. Log in to [iconfont.cn](https://www.iconfont.cn/)
2. Open the target icon project
3. Select the **Symbol** usage method
4. Copy the **online URL** (e.g. `//at.alicdn.com/t/c/font_xxxxx_xxxx.js`)
5. Paste it into the `OutlinedLink` or `ColoredLink` constant

Protocol-relative URLs starting with `//` are supported; the script adds `https:` automatically.

### 2. One-step build

After updating the URL, run:

```bash
pnpm build
```

This runs in order:

| Step  | Command          | Action |
|-------|------------------|--------|
| 1. Download | `pnpm download`    | Fetch both Symbol JS files, extract `<symbol>` via regex, write to `raw-svgs/outlined` and `raw-svgs/colored` |
| 2. Generate | `pnpm build:icons` | Read raw-svgs → SVGO optimize → generate .tsx components → write to `src/components/`, `src/index.ts`, `src/preview-manifest.ts` |
| 3. Bundle   | `pnpm build:lib`  | `src/index.ts` → output `dist/index.js`, `dist/index.cjs`, `dist/index.d.ts` |

### 3. Step-by-step execution (optional)

```bash
pnpm download      # Download SVG only from iconfont
pnpm build:icons   # Generate React components and entry only
pnpm build:lib     # Bundle publish artifacts only
```

### 4. Naming rules

| iconfont id        | Outlined component   | Colored component  |
|--------------------|----------------------|--------------------|
| `icon-tool`        | `ToolOutlined`       | `ToolColored`      |
| `icon-align-right` | `AlignRightOutlined` | `AlignRightColored` |
| `icon-file-2`      | `File2Outlined`      | `File2Colored`      |
| `icon-toolBox`     | `ToolBoxOutlined`    | `ToolBoxColored`    |
| `icon-AR`          | `AROutlined`         | `ARColored`         |

Rule: remove `icon-` prefix → split by `-`, capitalize first letter of each segment (rest unchanged) → append `Outlined` or `Colored`.

---

## Preview

Start the package-local preview page:

```bash
pnpm preview
```

The preview page shows:
- the rendered icon
- the original iconfont name
- the generated component name

It supports:
- grouping by `Outlined` and `Colored`
- search by iconfont name or component name
- copying JSX snippets like `<ToolOutlined />`

Preview metadata is generated into `src/preview-manifest.ts` during `pnpm build:icons`, so after icon updates you should re-run:

```bash
pnpm build:icons
pnpm preview
```

## Build output and npm usage

After `pnpm build`, the `dist/` folder contains:

| File            | Purpose |
|-----------------|---------|
| `index.js`      | ESM bundle with all icon components (for `import`) |
| `index.cjs`     | CommonJS bundle (for `require`) |
| `index.d.ts`    | TypeScript declarations |
| `*.map`         | Source maps |

All icon components are bundled into these files. After publishing to npm, other projects can use:

```tsx
import { AddOutlined, ToolColored } from '@kweaver-web/icons'
```

The package uses `react` as a peer dependency, so consumers must have React installed.

## Publish checklist

Before publishing:

```bash
pnpm test
pnpm typecheck
pnpm build
```

