# @kweaver-web/icons

KWeaver Web 的 React 内联 SVG 图标包。

## 安装

```bash
pnpm add @kweaver-web/icons react
```

## 在内部使用

在 `apps/` 下的应用在构建时需要引用时，使用 **workspace 协议**：

### 步骤 1：在应用中添加 workspace 依赖

在应用的 `package.json` 中（如 `apps/dip/package.json`）：

```json
{
  "dependencies": {
    "@kweaver-web/icons": "workspace:*",
    "react": "^18.3.1"
  }
}
```

### 步骤 2：安装依赖

在 **仓库根目录** 执行：

```bash
pnpm install
```

pnpm 会将 `workspace:*` 解析为本地 `packages/icons` 包。

### 步骤 3：构建顺序（自动处理）

项目使用 Turbo，配置了 `"dependsOn": ["^build"]`。在根目录执行：

```bash
pnpm build
```

时，Turbo 会：
1. 先构建 `packages/icons`（产出 `dist/`）
2. 再构建依赖它的应用

无需手动控制构建顺序。

### 步骤 4：在代码中使用

导入方式与发布到 npm 后相同：

```tsx
import { AddOutlined, ToolColored } from '@kweaver-web/icons'
```

### 防止误发布（可选）

若需避免发布到 npm，在 `packages/icons/package.json` 中添加 `"private": true`：

```json
{
  "name": "@kweaver-web/icons",
  "private": true,
  ...
}
```

---

## 使用

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

线性图标支持：`size`、`className`、`style`、`color`、标准 SVG 属性。  
彩色图标支持：`size`、`className`、`style`、标准 SVG 属性。

线性图标默认使用 `currentColor`，可通过 CSS 的 `color` 或自定义样式控制颜色。

---

## iconfont 库链接配置与生成流程

### 1. 配置 iconfont 链接

图标库的源地址在 `scripts/config.ts` 中配置：

```ts
// scripts/config.ts

// 线性库
const OutlinedLink = '//at.alicdn.com/t/c/font_xxxxx_xxxx.js'
// 彩色面性库
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

**如何获取 Symbol 链接：**

1. 登录 [iconfont.cn](https://www.iconfont.cn/)
2. 进入对应图标项目
3. 点击「Symbol」获取方式
4. 复制「在线链接」（形如 `//at.alicdn.com/t/c/font_xxxxx_xxxx.js`）
5. 将链接填入 `OutlinedLink` 或 `ColoredLink` 常量

支持 `//` 开头的协议相对路径，脚本会自动加上 `https:`。

### 2. 一键生成流程

更新链接后，执行：

```bash
pnpm build
```

该命令依次执行：

| 步骤           | 命令            | 作用                                                                 |
|----------------|-----------------|----------------------------------------------------------------------|
| 1. 下载        | `pnpm download` | 请求两个 Symbol JS，正则提取 `<symbol>`，写入 `raw-svgs/outlined`、`raw-svgs/colored` |
| 2. 生成组件    | `pnpm build:icons` | 读取 raw-svgs → SVGO 压缩 → 生成 .tsx 组件 → 写入 `src/components/` 和 `src/index.ts`、`src/preview-manifest.ts` |
| 3. 打包        | `pnpm build:lib` | `src/index.ts` → 产出 `dist/index.js`、`dist/index.cjs`、`dist/index.d.ts` |

### 3. 分步执行（可选）

```bash
pnpm download      # 仅从 iconfont 下载 SVG
pnpm build:icons   # 仅生成 React 组件和入口
pnpm build:lib     # 仅打包发布产物
```

### 4. 命名规则

| iconfont id        | 线性组件名           | 彩色组件名          |
|--------------------|----------------------|----------------------|
| `icon-tool`        | `ToolOutlined`       | `ToolColored`        |
| `icon-align-right` | `AlignRightOutlined` | `AlignRightColored`  |
| `icon-file-2`      | `File2Outlined`      | `File2Colored`       |
| `icon-toolBox`     | `ToolBoxOutlined`    | `ToolBoxColored`     |
| `icon-AR`          | `AROutlined`         | `ARColored`          |

规则：去掉 `icon-` 前缀 → 按 `-` 分段，每段首字母大写、其余保持原样 → 追加 `Outlined` 或 `Colored`。

---

## 本地预览

启动包内预览页面：

```bash
pnpm preview
```

预览页会展示当前生成的图标、iconfont 原始名称和组件名，支持搜索、分组（Outlined/Colored）以及一键复制 JSX 片段（如 `<ToolOutlined />`）。

预览数据在 `pnpm build:icons` 时写入 `src/preview-manifest.ts`，图标更新后需先执行：

```bash
pnpm build:icons
pnpm preview
```

## 构建产物与 npm 使用

执行 `pnpm build` 后，`dist/` 目录包含：

| 文件            | 用途 |
|-----------------|------|
| `index.js`      | ESM 格式，包含所有图标组件（供 `import` 使用） |
| `index.cjs`     | CommonJS 格式（供 `require` 使用） |
| `index.d.ts`    | TypeScript 类型声明 |
| `*.map`         | source map |

图标组件均已打包进上述文件。发布到 npm 后，其他项目可正常引用：

```tsx
import { AddOutlined, ToolColored } from '@kweaver-web/icons'
```

本包将 `react` 声明为 peer 依赖，使用方需自行安装 React。

## 发布前检查

发布前执行：

```bash
pnpm test
pnpm typecheck
pnpm build
```

