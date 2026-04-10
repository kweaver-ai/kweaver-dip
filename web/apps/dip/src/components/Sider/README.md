# Sider（侧边栏）

左侧导航壳层：在 `GlobalLayout` 中按路由的 `siderMode` 决定是否展示，并与顶栏高度、折叠宽度联动。**折叠状态由父级持有**（`useGlobalLayoutStore`），本组件只负责渲染与回调。

---

## 适合谁读

- 要改菜单分区、会话入口、工作计划/历史、Store 区块或底部用户区的贡献者  
- 需要核对侧栏宽度与主内容 `marginLeft` 的布局相关同学（见 `src/layout/GlobalLayout/Container.tsx`）  

---

## 入口与分支

`index.tsx` 使用 Ant Design `Layout.Sider` 作为外壳（高度 `calc(100vh - topOffset)`、`trigger={null}`），内部根据 **`useUserInfoStore` 的 `isAdmin`** 二选一：

| 分支 | 文件 | 说明 |
|------|------|------|
| 普通用户 | `HomeSider/index.tsx` | 会话按钮、Studio 菜单、工作计划/历史列表、Store 区块、外部链接、底部用户 |
| 管理员 | `AdminSider/index.tsx` | 精简：Studio（含更多允许路由 key）+ Store + 外部链接 + 底部用户，无会话/计划/历史大块 |

`layout` 对应路由上的 **`SiderType`**（`@/routes/types`）：`'entry'` 表示入口壳（带 Logo 区等），`'app'` 表示应用壳（如 Studio 下不展示顶部大 Logo 行，以代码为准）。

`SiderProps` 中声明了可选 `routeModule`，**当前 `GlobalLayout/Container` 未传入**；若后续按模块拆分侧栏，可在此扩展。

---

## 布局参数（与壳层一致）

以下数值来自 `Container.tsx`，修改侧栏时需同步避免错位：

| 项目 | 值 |
|------|-----|
| 展开宽度 | `240px` |
| 收起宽度 | `52px`（非旧文档中的 60px） |
| 有顶栏时 `topOffset` | `52px`（与 Header 高度一致） |

折叠动画首帧通过 `index.tsx` 内 `transitionEnabled` + `index.module.less` 的 `.siderNoTransition` 减少 CLS。

---

## 目录结构（速查）

```
Sider/
├── index.tsx              # Antd Sider 外壳 + Admin / Home 分发
├── index.module.less      # `.sider-container`、菜单选中态、收起态、浮层等
├── types.ts               # `SiderMenuItemData`、`SiderMenuItemType`（菜单项抽象）
├── utils.ts               # `formatTotalDisplay`（如 99+）
├── HomeSider/index.tsx
├── AdminSider/index.tsx
├── StoreSider/index.tsx   # 历史实现，当前多为注释，未作为入口使用
├── StudioSider/index.tsx  # 同上
└── components/
    ├── StudioMenuSection.tsx
    ├── StoreMenuSection.tsx
    ├── WorkPlanSection.tsx      # HomeSider：工作计划摘要列表
    ├── HistorySection.tsx       # HomeSider：会话历史摘要列表
    ├── ExternalLinksMenu.tsx    # 外部链接区
    ├── SiderFooterUser.tsx      # 底部用户与折叠控制
    ├── UserMenuItem.tsx
    └── GradientMaskIcon.tsx
```

---

## 组件接口（`Sider`）

| 属性 | 说明 |
|------|------|
| `collapsed` | 是否收起（由全局布局 store 控制） |
| `onCollapse` | `(collapsed: boolean) => void` |
| `topOffset` | 顶部占位（像素），用于有 Header 时从下缘算起高度 |
| `layout` | `SiderType`，默认 `'entry'` |
| `routeModule` | 可选，类型为 `RouteModule`；当前布局未传 |

选中路由 key 一般通过 `getRouteByPath(location.pathname)` 与路由配置的 `key` 对齐。

---

## 样式说明

- **Tailwind**：各子区块布局、间距、会话按钮等。  
- **`index.module.less`**：侧栏容器 class `siderContainer`（与 `styles.siderContainer` 对应）、Ant Design Menu 的全局覆盖（`.dip-menu-item` 选中条、收起高度等）、收起时 SubMenu 浮层 `.dip-sider-submenu-popup`。  
- 菜单项高度展开约 **40px**、收起约 **36px**（见 less 中 `.collapsed`）。

---

## 设计稿（Figma，可选参考）

[商店 / 侧栏相关设计（示例节点）](https://www.figma.com/design/awdYlPYcJPhGxTgSGCiUwm/%E5%95%86%E5%BA%97?node-id=25-458&t=C1RkREARY5uzZSPO-4)

以代码与产品最新说明为准。

---

## 相关测试

在 `apps/dip` 目录下：

```bash
pnpm test
```

仅侧栏相关：

```bash
pnpm vitest run src/components/Sider
```
