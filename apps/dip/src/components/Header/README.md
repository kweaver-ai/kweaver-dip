# Header 组件

## 1. 组件介绍

### 组件用途

Header 组件目录包含两种导航头组件：
- **BaseHeader**：商店/工作室版块通用的导航头，用于 `store` 和 `studio` 路由
- **MicroAppHeader**：微应用壳导航头，专门用于微应用容器路由场景（`/application/:appId/*`）

### 整体结构

两个 Header 组件都采用左右布局结构：

**BaseHeader**：
- **左侧区域**：Logo + 面包屑导航（Breadcrumb）
- **右侧区域**：用户信息（UserInfo）

**MicroAppHeader**：
- **左侧区域**：应用菜单（AppMenu）+ 面包屑导航（Breadcrumb）
- **右侧区域**：Copilot 按钮（CopilotButton，已注释）+ 用户信息（UserInfo）

### 使用场景

- **BaseHeader**：在 `store` 和 `studio` 路由下使用，通过路由配置的 `handle.layout.headerType: 'store'` 控制显示
- **MicroAppHeader**：仅在微应用容器路由下使用（`/application/:appId/*`），通过路由配置的 `handle.layout.headerType: 'micro-app'` 控制显示
- 不支持 headless 微应用（headless 微应用不显示任何壳层组件）

## 2. 组件结构

### 文件列表

```
Header/
├── BaseHeader.tsx          # 商店/工作室版块导航头
├── MicroAppHeader.tsx      # 微应用壳导航头
├── types.ts                # 类型定义（HeaderType）
├── Breadcrumb/             # 共享面包屑组件
│   └── index.tsx
├── UserInfo/               # 共享用户信息组件
│   └── index.tsx
├── AppMenu/                # 应用菜单组件（主要用于 MicroAppHeader）
│   └── index.tsx
├── CopilotButton/          # Copilot 按钮组件（主要用于 MicroAppHeader）
│   └── index.tsx
└── README.md               # 本文档
```

### 文件说明

- **BaseHeader.tsx**：商店/工作室版块导航头，自动根据路由判断类型（store/studio），构建面包屑数据
- **MicroAppHeader.tsx**：微应用壳导航头，负责监听微应用全局状态、构建面包屑数据、处理导航跳转
- **Breadcrumb/index.tsx**：通用面包屑组件，支持图标渲染、导航跳转，自动添加首页图标
- **UserInfo/index.tsx**：用户信息组件，显示用户头像和名称，支持退出登录
- **AppMenu/index.tsx**：应用菜单下拉组件，点击加载应用列表并支持跳转
- **CopilotButton/index.tsx**：Copilot 按钮组件（当前已注释，未使用）

## 3. 交互设计

### 3.1 Figma 设计稿链接

`https://www.figma.com/design/kHfaKWb2UqWz9Nf8FyaKMv/Copilot?node-id=4-2&t=vKvWASWezhVgNNLX-4`

### 3.2 布局结构

- **整体布局**：水平布局，左右分布
- **高度**：固定高度 `52px`
- **背景**：白色背景，底部边框 `border-gray-200`
- **内边距**：水平方向 `12px`（`px-3`）
- **间距**：
  - BaseHeader：左侧 Logo 和面包屑间距 `40px`（`gap-x-10`）
  - MicroAppHeader：左侧和右侧内部元素间距 `16px`（`gap-x-4`）

### 3.3 交互行为

#### BaseHeader

**Logo**
- **显示内容**：OEM 配置的 logo 或默认 LogoIcon
- **位置**：左侧最前面

**面包屑导航（Breadcrumb）**
- **结构组成**：
  1. 首页图标：点击跳转到 `/`
  2. Section 名称：显示 "AI Store" 或 "DIP Studio"（不可点击）
  3. 当前路由名称：显示当前路由的 label，可点击跳转
- **自动判断**：根据路由路径和配置自动判断是 `store` 还是 `studio`

#### MicroAppHeader

**应用菜单（AppMenu）**
- **触发方式**：点击菜单图标按钮
- **加载时机**：点击时才触发应用列表加载（手动加载模式）
- **菜单行为**：点击菜单项后，以新标签页形式打开对应微应用
- **加载状态**：加载时按钮禁用

**面包屑导航（Breadcrumb）**
- **结构组成**：
  1. 首页图标：点击跳转到 `/`
  2. 微应用根节点：显示微应用图标和名称，点击跳转到微应用基础路由
  3. 微应用面包屑：由微应用通过全局状态传递，点击跳转到对应路径
- **最后一项**：不可点击，仅显示当前页面名称
- **路径处理**：微应用传递的相对路径会自动拼接 `routeBasename` 前缀

**Copilot 按钮（CopilotButton）**
- **当前状态**：已注释，未使用
- **设计意图**：点击时通过全局状态通知微应用 Copilot 被点击事件

**用户信息（UserInfo）**
- **显示内容**：用户头像图标 + 用户名称（`vision_name`）
- **交互方式**：点击下拉菜单
- **菜单项**：退出登录

### 3.4 外部链接/跳转

- **应用菜单跳转**：`/application/${app.id}`（新标签页）
- **面包屑跳转**：使用 React Router 的 `navigate` 进行路由跳转

## 4. 代码实现

### 4.1 Props 接口

两个 Header 组件都不接受任何 props，所有数据通过以下方式获取：

**BaseHeader**：
- **路由信息**：通过 `useLocation()` 和 `useNavigate()` 获取
- **路由配置**：通过 `getRouteByPath()` 获取当前路由配置
- **OEM 配置**：通过 `useOEMConfigStore()` 获取 logo 配置

**MicroAppHeader**：
- **路由信息**：通过 `useLocation()` 和 `useNavigate()` 获取
- **微应用信息**：通过 `useMicroAppStore()` 获取 `currentMicroApp`
- **全局状态**：通过 `onMicroAppGlobalStateChange()` 监听微应用传递的面包屑数据

### 4.2 Breadcrumb 组件 Props

```typescript
interface BreadcrumbProps {
  /** 面包屑类型 */
  type: HeaderType  // 'store' | 'studio' | 'micro-app'
  /** 面包屑项列表，由外部传入 */
  items?: BreadcrumbItem[]
  /** 导航回调函数，如果不传则使用内部的 navigate */
  onNavigate?: (item: BreadcrumbItem) => void
}
```

### 4.3 默认行为

**BaseHeader**：
- **类型判断**：优先从路由配置的 `siderType` 判断，如果没有则通过路径前缀判断（`store/` 或 `studio/`）
- **面包屑构建**：自动构建 section 名称和当前路由名称
- **Section 不可点击**：section 项设置 `disabled: true`，不可点击

**MicroAppHeader**：
- **初始化状态**：面包屑为空数组，仅在微应用路由下才监听全局状态
- **路由检测**：通过 `location.pathname.startsWith('/application/')` 判断是否为微应用路由
- **自动清理**：离开微应用路由时自动清空面包屑数据并取消监听

### 4.4 数据加载

#### BaseHeader 面包屑数据

- **Section 名称**：根据 `headerType` 自动判断（'store' → 'AI Store'，'studio' → 'DIP Studio'）
- **当前路由名称**：从路由配置的 `label` 字段获取
- **路由配置**：通过 `getRouteByPath(location.pathname)` 获取

#### MicroAppHeader 微应用信息

- **数据来源**：`useMicroAppStore()` 中的 `currentMicroApp`
- **Store 位置**：`/src/stores/microAppStore.ts`
- **加载时机**：由 `MicroAppContainer` 组件在加载微应用时设置

#### MicroAppHeader 面包屑数据

- **数据来源**：微应用通过全局状态传递的 `breadcrumb` 字段
- **接口位置**：`/src/utils/micro-app/globalState.ts`
- **加载时机**：组件挂载后监听全局状态变化，使用 `fireImmediately: true` 立即获取当前状态
- **数据格式**：
  ```typescript
  interface BreadcrumbItem {
    key?: string
    name: string
    path?: string // 微应用内部相对路径，如 '/alarm' 或 'alarm'
    icon?: string
    disabled?: boolean
  }
  ```

#### 路径处理逻辑

微应用传递的面包屑路径会被自动处理：

- 如果路径以 `/` 开头，会去掉前导斜杠
- 统一拼接 `routeBasename` 前缀（去掉 BASE_PATH 后，如 `/application/:appId`）
- 示例：
  - 微应用传递：`{ path: '/alarm', name: '告警' }`
  - 最终路径：`/application/:appId/alarm`
  - 微应用传递：`{ path: 'alarm', name: '告警' }`
  - 最终路径：`/application/:appId/alarm`

**注意**：`routeBasename` 包含 BASE_PATH 前缀（如 `/dip-hub/application/:appId`），但在处理时会先去掉 BASE_PATH，因为 React Router 的 `navigate` 会自动处理 basename。

### 4.5 样式规范

- **样式方案**：主要使用 Tailwind CSS
- **关键样式**：
  - 高度：`h-[52px]`
  - 背景：`bg-white`
  - 边框：`border-b border-gray-200`
  - 间距：`px-3`（水平内边距）
- **特殊样式**：
  - 首页图标 hover：`hover:bg-[--dip-hover-bg-color]`
  - 面包屑项不可点击：`hover:!bg-transparent hover:!cursor-default`
  - BaseHeader Logo 和面包屑间距：`gap-x-10`（40px）

### 4.6 性能优化

- **useMemo**：面包屑项数组使用 `useMemo` 缓存
  - BaseHeader：依赖 `headerType`、`currentRoute`
  - MicroAppHeader：依赖 `isMicroAppRoute`、`currentMicroApp`、`microAppBreadcrumb`
- **useCallback**：导航跳转处理函数使用 `useCallback` 优化
- **条件渲染**：仅在对应路由下渲染对应的 Header
- **自动清理**：`useEffect` 返回清理函数，确保离开路由时取消监听

## 5. 注意事项

### 5.1 特殊逻辑

#### BaseHeader 类型判断

- 优先从路由配置的 `handle.layout.siderType` 判断（'store' 或 'studio'）
- 如果路由配置中没有 `siderType`，通过路径前缀判断（`store/` → 'store'，`studio/` → 'studio'）
- 默认返回 'store'

#### BaseHeader Section 不可点击

- Section 项（"AI Store" 或 "DIP Studio"）设置 `disabled: true`
- Breadcrumb 组件会检查 `item.disabled`，禁用点击

#### MicroAppHeader 面包屑路径拼接

- 微应用传递的路径视为「微应用内部路径」，需要统一挂载到 `routeBasename` 之下
- `routeBasename` 包含 BASE_PATH 前缀（如 `/dip-hub/application/:appId`），但在处理时会先去掉 BASE_PATH
- 路径处理时会去掉前导斜杠，统一按相对路径处理
- 如果路径为空，则使用 `routeBasename`（去掉 BASE_PATH 后）作为完整路径

#### 全局状态监听

- 使用 `fireImmediately: true` 确保组件挂载时立即获取当前状态
- 监听器会在组件卸载或离开微应用路由时自动取消
- 全局状态管理器有最大监听器数量限制（50 个），防止内存泄漏

### 5.2 边界情况

**BaseHeader**：
- **无路由配置**：如果当前路由没有匹配到路由配置，section 名称仍会显示，但不会显示当前路由名称
- **路径判断失败**：如果路径前缀不匹配 `store/` 或 `studio/`，默认使用 'store'

**MicroAppHeader**：
- **无微应用信息**：如果 `currentMicroApp` 为 `null`，面包屑中不会显示微应用根节点
- **空面包屑数据**：如果微应用未传递面包屑或传递空数组，只显示首页图标和微应用根节点
- **非微应用路由**：在非微应用路由下，组件不监听全局状态，面包屑为空
- **路径缺失**：如果面包屑项的 `path` 为空，点击时不会进行跳转

### 5.3 依赖关系

- **路由系统**：依赖 React Router 的 `useNavigate` 和 `useLocation`
- **路由工具**：依赖 `getRouteByPath` 获取路由配置
- **状态管理**：
  - `useMicroAppStore`：获取当前微应用信息（MicroAppHeader）
  - `useOEMConfigStore`：获取 OEM 配置（BaseHeader）
  - `onMicroAppGlobalStateChange`：监听微应用全局状态（MicroAppHeader）
- **共享组件**：`Breadcrumb`、`UserInfo` 被两个 Header 共享使用

### 5.4 已知问题

- Copilot 按钮功能已注释，暂未启用

## 6. 使用示例

### 在路由配置中使用

```typescript
// src/routes/index.tsx

// BaseHeader（store/studio 路由）
{
  path: 'store/my-app',
  element: <MyApp />,
  handle: {
    layout: {
      hasSider: true,
      hasHeader: true,
      siderType: 'store',
      headerType: 'store',  // 使用 BaseHeader
    },
  },
}

// MicroAppHeader（微应用路由）
{
  path: 'application/:appId/*',
  element: <MicroAppContainer />,
  handle: {
    layout: {
      hasSider: true,
      hasHeader: true,
      siderType: 'home',
      headerType: 'micro-app',  // 使用 MicroAppHeader
    },
  },
}
```

### 微应用传递面包屑

```typescript
// 微应用代码
props.setMicroAppState({
  breadcrumb: [
    { key: 'alarm', name: '告警与故障分析', path: '/alarm' },
    { key: 'problem', name: '问题', path: '/alarm/problem' },
  ],
})
```

### Breadcrumb 组件使用

```typescript
// BaseHeader 中使用
<Breadcrumb
  type={headerType}  // 'store' | 'studio'
  items={breadcrumbItems}
  onNavigate={handleBreadcrumbNavigate}
/>

// MicroAppHeader 中使用
<Breadcrumb
  type="micro-app"
  items={breadcrumbItems}
  onNavigate={handleBreadcrumbNavigate}
/>
```
