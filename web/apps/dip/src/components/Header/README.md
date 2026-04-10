# Header（顶栏）

本目录提供应用**顶栏**实现：根据布局配置的 `headerType` 在「商店/工作室通用头」与「微应用壳头」之间切换，并统一高度、边框与 z-index。**`headerType === 'home'` 时不渲染顶栏**（入口壳无顶栏）。

---

## 适合谁读

- 要改面包屑、Logo、用户区或微应用壳顶栏的贡献者  
- 需要让微应用上报面包屑并与主应用路由对齐的集成方  

---

## 入口与分支

`index.tsx` 使用 Ant Design `Layout.Header` 包裹内容（约 `52px` 高、白底、底边框），根据 `headerType` 渲染：

| `headerType`（见 `@/routes/types`） | 行为 |
|-------------------------------------|------|
| `'home'` | 返回 `null`，不展示顶栏 |
| `'micro-app'` | `MicroAppHeader` |
| 其它（如 `'store'`、`'studio'`、`'initial-configuration'` 等） | `BaseHeader`，并传入同一 `headerType` |

类型定义：`HeaderType = 'store' \| 'studio' \| 'micro-app' \| 'home' \| 'initial-configuration'`。

---

## 子组件职责

### BaseHeader（`BaseHeader/index.tsx`）

- **左侧**：OEM Logo（`useOEMConfigStore`）+ `Breadcrumb`  
- **右侧**：`UserInfo`；**当 `headerType === 'studio'` 时不展示 `UserInfo`**（当前实现）  
- 面包屑数据来自当前路由（`getRouteByPath`、`getBreadcrumbAncestorRoutes` 等）、以及可选的 `useBreadcrumbDetailStore` 动态标题/祖先替换；支持初始配置等模式（如 `breadcrumbMode === 'init-only'` 时隐藏首页图标与 section 等，以代码为准）。

### MicroAppHeader（`MicroAppHeader/index.tsx`）

- **左侧**：`AppMenu` + `Breadcrumb`（`type="micro-app"`）  
- **右侧**：`UserInfo`（`CopilotButton` 相关逻辑已注释，未启用）  
- 在路径以 `/application/` 为前缀时，通过 `onMicroAppGlobalStateChange` 订阅微应用上报的 `breadcrumb`；微应用根节点来自 `useMicroAppStore` 的 `currentMicroApp`，首页跳转使用 `homeRoute ?? '/'`。

### 共享子目录（`components/`）

| 目录 | 说明 |
|------|------|
| `Breadcrumb/` | 面包屑：首页图标 + 传入的 `items`，支持 `homePath`、`showHomeIcon`、`lastItemSuffix` |
| `UserInfo/` | 用户头像、名称、退出等 |
| `AppMenu/` | 微应用列表菜单（MicroAppHeader 使用） |
| `CopilotButton/` | 预留，当前未接入主流程 |
| `ProjectInfoPopover/` | 与顶栏注释块中的项目信息气泡相关，按需使用 |

---

## 目录结构（速查）

```
Header/
├── index.tsx                 # 按 headerType 分发 + Ant Layout.Header 外壳
├── BaseHeader/index.tsx      # Store / Studio 等通用顶栏
├── MicroAppHeader/index.tsx  # 微应用容器顶栏
└── components/
    ├── Breadcrumb/
    ├── UserInfo/
    ├── AppMenu/
    ├── CopilotButton/
    └── ProjectInfoPopover/
```

测试位于各子目录的 `__tests__/`（如 `Header/__tests__`、`components/Breadcrumb/__tests__` 等）。

---

## Breadcrumb 组件接口（摘要）

与 `components/Breadcrumb/index.tsx` 一致：

| 属性 | 说明 |
|------|------|
| `type` | `HeaderType`，影响展示样式/语义 |
| `items` | `BreadcrumbItem[]`，来自 `@/utils/micro-app/globalState` |
| `homePath` | 首页图标跳转路径，默认 `'/'` |
| `showHomeIcon` | 是否展示首页图标列，默认 `true` |
| `onNavigate` | 点击可导航项时的回调；不传则内部 `navigate(item.path)` |
| `lastItemSuffix` | 最后一项后的自定义节点 |

`BreadcrumbItem` 含 `key`、`name`、`path`、`icon`、`disabled` 等字段，微应用场景下路径会在 `MicroAppHeader` 内与 `routeBasename` 拼接（见该文件内注释）。

---

## 路由与布局

在路由 `handle.layout` 中配置 `headerType`（及 `hasHeader` 等）以切换顶栏形态；微应用路由通常使用 `headerType: 'micro-app'`。具体示例以 `src/routes` 下实际配置为准。

---

## 设计稿（Figma，可选参考）

[Copilot / Header 相关设计（node 示例）](https://www.figma.com/design/kHfaKWb2UqWz9Nf8FyaKMv/Copilot?node-id=4-2&t=vKvWASWezhVgNNLX-4)

若链接失效或权限不足，以当前实现与产品说明为准。

---

## 样式说明

- 顶栏外壳与多数区块使用 **Tailwind**（如 `h-[52px]`、`border-gray-200`、`px-3`）。  
- 子组件若无单独说明，以各自文件为准。

---

## 相关测试

在 `apps/dip` 目录下：

```bash
pnpm test
```

仅顶栏相关可按路径过滤，例如：

```bash
pnpm vitest run src/components/Header
```
