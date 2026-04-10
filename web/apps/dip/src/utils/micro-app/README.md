# 微应用集成方案

## 技术选型

- **微前端框架**：qiankun 2.x
- **设计原则**：主应用定义标准，微应用适配主应用
- **全局状态管理**：自定义实现（替代 qiankun 的 `globalState`，qiankun 3.0 将移除此功能）

---

## 微应用加载方式

1. 微应用通过配置的 `entry` 入口加载，如 `http://localhost:8081`
2. 每个微应用需要导出标准的 qiankun UMD 生命周期：
   - `bootstrap()`
   - `mount(props)`
   - `unmount(props)`

---

## 本地调试支持

在开发环境下，支持通过 localStorage 配置覆盖微应用的 entry URL，方便其他部门的微应用进行本地调试。

### 使用方法

#### 方法一：浏览器控制台设置

在浏览器控制台执行以下代码：

```javascript
localStorage.setItem('DIP_HUB_LOCAL_DEV_MICRO_APPS', JSON.stringify({
  'micro-app-name': 'http://localhost:8081'
}))
```

然后刷新页面即可。

#### 方法二：浏览器开发者工具设置

1. 打开浏览器开发者工具（F12）
2. 切换到 **Application**（或 **存储**）标签页
3. 展开 **Local Storage**
4. 选择当前网站域名
5. 添加新项：
   - **Key**: `DIP_HUB_LOCAL_DEV_MICRO_APPS`
   - **Value**: `{"micro-app-name": "http://localhost:8081"}`
6. 刷新页面

### 配置格式

配置为 JSON 对象，key 为微应用名称（`micro_app.name`），value 为本地开发服务器的 entry URL：

```json
{
  "micro-app-name-1": "http://localhost:8081",
  "micro-app-name-2": "http://localhost:8082"
}
```

### 示例场景

假设有一个微应用名称为 `my-micro-app`，部署环境的 entry 为 `http://10.4.134.36/apps/my-micro-app`，现在需要在本地调试：

1. **启动本地开发服务器**（端口 8081）
2. **设置本地调试配置**：
   ```javascript
   localStorage.setItem('DIP_HUB_LOCAL_DEV_MICRO_APPS', JSON.stringify({
     'my-micro-app': 'http://localhost:8081'
   }))
   ```
3. **刷新页面**，主应用会自动使用 `http://localhost:8081` 加载微应用

### 注意事项

- ⚠️ **仅在开发环境下生效**：此功能仅在 `NODE_ENV === 'development'` 时可用，生产环境会自动忽略
- ⚠️ **需要刷新页面**：修改配置后需要刷新页面才能生效
- ⚠️ **CORS 问题**：确保本地开发服务器配置了正确的 CORS 头，允许主应用域名访问
- ⚠️ **微应用名称必须匹配**：配置中的 key 必须与微应用的 `micro_app.name` 完全一致

### 清除配置

#### 清除单个微应用的配置

```javascript
// 在浏览器控制台执行
const config = JSON.parse(localStorage.getItem('DIP_HUB_LOCAL_DEV_MICRO_APPS') || '{}')
delete config['micro-app-name']
localStorage.setItem('DIP_HUB_LOCAL_DEV_MICRO_APPS', JSON.stringify(config))
```

#### 清除所有配置

```javascript
localStorage.removeItem('DIP_HUB_LOCAL_DEV_MICRO_APPS')
```

### 调试信息

在开发环境下，控制台会输出调试信息：

- 当使用本地调试入口时，会显示：`[本地调试] 微应用 "xxx" 使用本地入口: http://localhost:8081 (默认: http://...)`
- 当使用默认入口时，不会显示额外信息

---

## 路由约定

微应用统一挂载在：

- `/dip-hub/application/:appId/*`（完整路径，包含 BASE_PATH 前缀）
- 其中 `:appId` 为微应用的应用 ID（对应 `ApplicationBasicInfo.id`）
- 采用 History 模式
- **注意**：`route.basename` 会包含 `/dip-hub` 前缀，因为微应用的路由系统是独立的，需要知道浏览器中的完整路径才能正确匹配路由

---

## 传递给微应用的 Props

所有微应用必须按照 `MicroAppProps` 接口接收 props，主应用统一传递此结构。

### `MicroAppProps` 接口定义

```typescript
interface MicroAppProps {
  /** ========== 认证相关 ========== */
  token: {
    /** 访问令牌（accessToken），使用 getter，每次访问时都从 Cookie 读取最新值 */
    get accessToken(): string
    /** Token 刷新能力（微应用可以调用此函数刷新 token） */
    refreshToken: () => Promise<{ accessToken: string }>
    /** Token 过期处理函数（可选） */
    onTokenExpired?: (code?: number) => void
  }

  /** ========== 路由信息 ========== */
  route: {
    /** 应用路由基础路径，包含 BASE_PATH 前缀（如 `/dip-hub/application/:appId`） */
    basename: string
    /** 应用首页路由（主应用根据来源侧边栏等规则计算后的完整路径） */
    homeRoute: string
  }

  /** ========== 用户信息 ========== */
  user: {
    /** 用户 ID */
    id: string
    /** 用户显示名称，使用 getter，每次访问时都从 store 读取最新值 */
    get vision_name(): string
    /** 用户账号，使用 getter，每次访问时都从 store 读取最新值 */
    get account(): string
  }

  /** ========== 应用信息 ========== */
  application: {
    /** 应用 ID */
    id: number
    /** 应用名称 */
    name: string
    /** 应用图标 */
    icon: string
  }

  /** ========== UI 组件渲染函数 ========== */
  /** 渲染应用菜单组件（AppMenu）到指定容器，使用主应用的 React 上下文渲染 */
  renderAppMenu: (container: HTMLElement | string) => void
  // /** 渲染用户信息组件（UserInfo）到指定容器，使用主应用的 React 上下文渲染 */
  // renderUserInfo: (container: HTMLElement | string) => void

  /** ========== 用户操作 ========== */
  /** 退出登录 */
  logout: () => void

  /** ========== 全局状态管理 ========== */
  /** 设置全局状态（微应用可以通过此方法更新全局状态） */
  setMicroAppState: (state: Record<string, any>) => boolean
  /** 监听全局状态变化，返回取消监听的函数 */
  onMicroAppStateChange: (
    callback: (state: any, prev: any) => void,
    fireImmediately?: boolean
  ) => () => void

  /** ========== UI 相关 ========== */
  /** 容器 DOM 元素 */
  container: HTMLElement
}
```

### 微应用使用示例

```javascript
export async function mount(props) {
  // 使用标准化的 props
  const {
    token,
    route,
    user,
    renderAppMenu,
    // renderUserInfo,
    logout,
    setMicroAppState,
    onMicroAppStateChange,
    container,
  } = props

  // 访问 token（每次访问都会获取最新值）
  const accessToken = token.accessToken
  // 刷新 token（刷新后，下次访问 token.accessToken 时会自动获取最新值）
  const newToken = await token.refreshToken()
  // 刷新后再次访问，会自动获取最新的 token
  const latestToken = token.accessToken

  // Token 过期处理
  if (token.onTokenExpired) {
    // 可以注册 token 过期回调
    token.onTokenExpired(401)
  }

  // 访问路由信息
  const routeBasename = route.basename
  const homeRoute = route.homeRoute

  // 访问用户信息
  const userId = user.id
  const userName = user.vision_name 
  const userAccount = user.account 

  // 访问应用信息（在微应用加载时确定，不会在运行时变化）
  const appId = application.id
  const appName = application.name
  const appIcon = application.icon 

  // 退出登录
  // logout() // 调用后会清除用户信息并跳转到登出页面

  // 使用主应用提供的 UI 组件
  // 这些组件在主应用的 React 上下文中渲染，使用 ReactDOM.createRoot 渲染到微应用指定的容器
  // 这样可以确保组件在主应用的 React 上下文中渲染，可以访问主应用的 store 和 hooks
  //
  // 注意：需要在组件中使用 useRef 和 useEffect 来调用渲染函数
  // 示例代码见下方

  // 监听全局状态变化（返回取消监听的函数）
  // fireImmediately: true 表示立即执行一次，可以获取初始语言值
  let currentLanguage = 'zh-CN' // 默认值
  const unsubscribe = onMicroAppStateChange((state, prev) => {
    // 语言变化处理（通过全局状态监听获取语言，包括初始值）
    if (
      state.language !== prev.language ||
      state.language !== currentLanguage
    ) {
      currentLanguage = state.language
      console.log('Language changed:', state.language)
      // 更新微应用的国际化配置
    }

    // Copilot 点击事件处理
    if (state.copilot !== prev.copilot && state.copilot?.clickedAt) {
      console.log('Copilot clicked at:', state.copilot.clickedAt)
      // 处理 Copilot 点击事件
    }
  }, true) // true 表示立即执行一次，获取初始语言值

  // 组件卸载时取消监听
  // unmount() {
  //   unsubscribe()
  // }
}
```

---

## 全局状态管理

### `MicroAppGlobalState` 结构

```typescript
interface MicroAppGlobalState {
  /** 当前语言，如 zh-CN / en-US（仅主应用可更新，初始化时从 languageStore 读取） */
  language: string
  /** 面包屑导航数据（微应用可更新） */
  breadcrumb?: Array<{
    key?: string
    name: string
    path?: string
    icon?: string
  }>
  /** Copilot 相关状态（仅主应用可更新，用于通知微应用 Copilot 事件） */
  copilot?: {
    clickedAt?: number
    [key: string]: any
  }
  /** 预留扩展字段 */
  [key: string]: any
}
```

**注意**：微应用信息（name、displayName、routeBasename）存储在 `microAppStore` 中，不在 globalState 中。

### 字段更新权限

- **微应用只能更新**：`allowedFields` 中允许的字段（当前仅 `breadcrumb`）
- **主应用可以更新**：所有字段（如 `language`、`copilot`）

当前允许微应用更新的字段：

- `breadcrumb`：面包屑导航数据

### 微应用更新全局状态

```javascript
// 通过 props
props.setMicroAppState({
  breadcrumb: [
    { key: 'dashboard', name: '仪表盘', path: '/dashboard' },
    { key: 'detail', name: '数据详情', path: '/dashboard/detail' },
  ],
})

// 清空面包屑
props.setMicroAppState({
  breadcrumb: [],
})
```

**注意**：微应用只能更新 `allowedFields` 中允许的字段（当前只有 `breadcrumb`），其他字段会被过滤并在开发环境下输出警告。

### 主应用更新全局状态

```typescript
import { setMicroAppGlobalState } from '@/utils/micro-app/globalState'

// 主应用更新语言或 Copilot 状态（需要传入 allowAllFields: true）
setMicroAppGlobalState(
  {
    language: 'en-US',
    copilot: { clickedAt: Date.now() },
  },
  { allowAllFields: true }
)
```

**注意**：

- 主应用必须传入 `{ allowAllFields: true }` 才能更新所有字段
- 微应用调用时不需要传入此选项，会自动过滤不允许的字段
- 状态更新会进行浅比较，如果状态未变化，不会触发监听器（性能优化）

### 监听全局状态变化

```javascript
// 在微应用中监听（返回取消监听的函数）
const unsubscribe = props.onMicroAppStateChange((state, prev) => {
  // 语言变化
  if (state.language !== prev.language) {
    // 处理语言切换
  }

  // 面包屑变化
  if (state.breadcrumb !== prev.breadcrumb) {
    // 处理面包屑更新
  }

  // Copilot 事件
  if (state.copilot !== prev.copilot && state.copilot?.clickedAt) {
    // 处理 Copilot 点击
  }
}, true) // true 表示立即执行一次

// 组件卸载时取消监听
// unmount() {
//   unsubscribe()
// }
```

```typescript
// 在主应用中监听
import { onMicroAppGlobalStateChange } from '@/utils/micro-app/globalState'

useEffect(() => {
  const unsubscribe = onMicroAppGlobalStateChange((state, prev) => {
    // 处理状态变化
  }, true) // true 表示立即执行一次

  return () => {
    unsubscribe() // 清理监听器
  }
}, [])
```

---

## 主应用配置

### 微应用配置

```typescript
interface MicroAppConfig {
  /** 微应用的包名，必须与 manifest.yaml 中的 micro-app.name 对应 */
  name: string
  /** 微应用的入口路径，必须与 manifest.yaml 中的 micro-app.entry 对应 */
  entry: string
}
```

---

## 面包屑导航实现

### 子应用端实现

在路由守卫或路由变化时更新面包屑（仅需关心「微应用内部路径」）：

```javascript
// 通过 props
props.setMicroAppState({
  breadcrumb: [
    { key: 'alarm', name: '告警与故障分析', path: '/alarm' },
    { key: 'problem', name: '问题', path: '/alarm/problem' },
  ],
})
```

主应用会自动将这些路径挂载到 `route.basename` 之下，例如：

- `route.basename = /dip-hub/application/app-id-123`（包含 BASE_PATH 前缀）
- `/alarm` -> `/dip-hub/application/app-id-123/alarm`
- `/alarm/problem` -> `/dip-hub/application/app-id-123/alarm/problem`

**注意**：`route.basename` 包含 `/dip-hub` 前缀，因为微应用的路由系统是独立的，需要知道浏览器中的完整路径才能正确匹配路由。

### 主应用端实现

主应用在 `MicroAppHeader` 组件中自动监听并渲染（简化示意，实际实现见代码）：

```typescript
import { onMicroAppGlobalStateChange } from '@/utils/micro-app/globalState'
import { useMicroAppStore } from '@/stores'

const MicroAppHeader = () => {
  const { currentMicroApp } = useMicroAppStore()
  const [microAppBreadcrumb, setMicroAppBreadcrumb] = useState([])

  useEffect(() => {
    const unsubscribe = onMicroAppGlobalStateChange((state) => {
      if (state.breadcrumb) {
        setMicroAppBreadcrumb(state.breadcrumb)
      }
    }, true)

    return () => {
      unsubscribe()
    }
  }, [])

  // 这里会先插入一条"微应用根"项（应用图标+名称），
  // 再把微应用上报的 breadcrumb 映射到 /dip-hub/application/:appId/... 下
  // 最终通过 Breadcrumb 组件渲染（内部自动加首页图标）
}
```

---

## Props 更新机制

### 使用 Getter 的字段（无需更新 props）

以下字段使用 getter 实现，每次访问时都会获取最新值，无需更新 props：

- **`token.accessToken`**：每次访问时从 Cookie 读取最新值

  - Token 刷新后，下次访问 `token.accessToken` 时会自动获取最新值
  - 微应用无需监听 token 变化，直接访问即可获取最新值
  - 如果提供了 `token.onTokenExpired`，可以在 token 过期时调用

- **`user.vision_name`**：每次访问时从 store 读取最新值（用户显示名称）
  - 用户名称变化后，下次访问 `user.vision_name` 时会自动获取最新值
- **`user.account`**：每次访问时从 store 读取最新值（用户账号）
  - 用户账号变化后，下次访问 `user.account` 时会自动获取最新值
  - 微应用无需监听用户名称变化，直接访问即可获取最新值
- **`application.id`**：应用 ID（在微应用加载时确定，不会在运行时变化）
- **`application.name`**：应用名称（在微应用加载时确定，不会在运行时变化）
- **`application.icon`**：应用图标（在微应用加载时确定，不会在运行时变化）

### 通过全局状态管理的字段（需要监听变化）

以下字段完全通过全局状态管理传递，微应用需要通过监听获取：

- **`language`**：通过 `onMicroAppStateChange` 获取初始值和变化
  - 推荐：在 `mount` 时通过 `onMicroAppStateChange(callback, true)` 获取初始值
  - `fireImmediately: true` 会在注册监听时立即执行一次，可以获取当前语言值
  - 后续语言变化也会通过同一个监听器通知

### UI 组件渲染函数

主应用提供了一些 UI 组件的渲染函数，微应用可以调用这些函数来渲染主应用的组件：

- **`renderAppMenu(container)`**：渲染应用菜单组件（AppMenu）到指定容器

  - 参数：`container` - 容器元素（HTMLElement）或容器元素 ID（string）
  - 使用 `ReactDOM.createRoot` 在主应用的 React 上下文中渲染到微应用指定的容器
  - 组件在主应用的 React 上下文中渲染，可以访问主应用的 store 和 hooks
  - 点击菜单项会在新标签页打开对应的应用
  - 主应用会自动管理渲染实例的生命周期，微应用卸载时会自动清理

### 用户操作

- **`logout()`**：退出登录
  - 无参数
  - 调用后会清除用户信息并跳转到登出页面
  - 会触发完整的登出流程（包括清除本地状态、清除 Cookie、跳转到后端登出 URL 等）

**使用示例**：

```javascript
import React, { useRef, useEffect } from 'react'
import { Layout, Button } from 'antd'

const { Header } = Layout

function MyHeader({ renderAppMenu, logout }) {
  const appMenuContainerRef = useRef(null)

  // 在容器准备好后渲染主应用的组件
  useEffect(() => {
    if (appMenuContainerRef.current) {
      renderAppMenu(appMenuContainerRef.current)
    }

    return () => {
      // 清理函数：组件卸载时清理渲染
      // 注意：主应用会自动清理，这里只是清空容器内容
      if (appMenuContainerRef.current) {
        appMenuContainerRef.current.innerHTML = ''
      }
    }
  }, [renderAppMenu])

  return (
    <Header>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {/* 左侧：应用菜单 */}
        <div ref={appMenuContainerRef} />

        {/* 右侧：退出登录按钮 */}
        <Button onClick={logout}>退出登录</Button>
      </div>
    </Header>
  )
}
```

**或者使用元素 ID**：

```javascript
// 如果容器有固定的 ID
useEffect(() => {
  renderAppMenu('app-menu-container')
}, [renderAppMenu])

// JSX
<div>
  <div id="app-menu-container" />
</div>
```

**退出登录使用示例**：

```javascript
// 在微应用中调用退出登录
function MyComponent({ logout }) {
  const handleLogout = () => {
    // 调用退出登录，会清除用户信息并跳转到登出页面
    logout()
  }

  return (
    <button onClick={handleLogout}>退出登录</button>
  )
}
```

**注意事项**：

- 这些渲染函数在主应用的 React 上下文中执行，使用 `ReactDOM.createRoot` 渲染
- 必须传入一个有效的容器元素（HTMLElement）或容器元素 ID（string）
- 组件会自动响应主应用的状态变化（如用户信息更新）
- 主应用会自动管理渲染实例的生命周期，微应用卸载时会自动清理所有渲染实例
- 如果容器元素不存在，函数会输出警告并返回，不会抛出错误
- 多次调用同一个容器的渲染函数时，会自动清理旧的渲染实例

### 微应用重新加载的触发条件

微应用只会在以下情况重新加载（卸载并重新挂载）：

- **应用配置变化**：`app.name` 或 `app.entry` 变化
- **用户切换**：`user.id` 变化（不同用户登录）
- **路由基础路径变化**：`route.basename` 变化

**不会导致重新加载的情况**：

- ✅ Token 刷新（通过 getter 实时获取）
- ✅ 用户名称变化（通过 getter 实时获取）
- ✅ 语言切换（通过全局状态管理通知，微应用通过 `onMicroAppStateChange` 监听）
- ✅ 其他全局状态变化（通过 `onMicroAppStateChange` 通知）
- ✅ UI 组件渲染（使用 `ReactDOM.createRoot` 在主应用上下文中渲染，不影响微应用生命周期）

---

## 注意事项

1. **appId 必须一致**：微应用的路由参数使用 `appId`（对应 `ApplicationBasicInfo.id`），必须与后端配置的应用 ID 保持一致
2. **字段白名单**：微应用只能更新 `allowedFields` 中允许的字段（当前只有 `breadcrumb`），其他字段只能由主应用更新
3. **函数命名**：使用 `setMicroAppState` / `onMicroAppStateChange`（微应用）和 `setMicroAppGlobalState` / `onMicroAppGlobalStateChange`（主应用）
4. **状态初始化**：全局状态的 `language` 字段会在初始化时从 `languageStore` 读取，支持从 localStorage 恢复
5. **微应用信息**：微应用信息（name、displayName、routeBasename）存储在 `microAppStore` 中，不会传递给微应用
6. **取消监听**：`onMicroAppStateChange` 返回取消监听的函数，组件卸载时应该调用以清理资源
7. **Token 刷新**：Token 刷新后，微应用通过 `token.accessToken` 访问时会自动获取最新值，无需更新 props。如果提供了 `token.onTokenExpired`，可以在 token 过期时调用
8. **用户信息**：`user.id` 通过 props 传递，`user.vision_name` 和 `user.account` 使用 getter 每次访问时从 store 读取最新值
9. **应用信息**：`application.id`、`application.name` 和 `application.icon` 在微应用加载时确定，不会在运行时变化
9. **退出登录**：通过 `logout()` 方法调用，会清除用户信息并跳转到登出页面
10. **语言获取**：语言不再通过 props 传递，微应用必须在 `mount` 时通过 `onMicroAppStateChange(callback, true)` 获取初始值和监听变化
11. **UI 组件渲染**：`renderAppMenu` 需要传入容器元素，使用 `useRef` 和 `useEffect` 在容器准备好后调用。主应用会自动管理渲染实例的生命周期
12. **容器元素**：`container` 是必需的 DOM 元素，主应用会在加载微应用时传递
13. **React 上下文隔离**：UI 组件渲染函数使用 `ReactDOM.createRoot` 在主应用的 React 上下文中渲染，确保组件可以正常使用主应用的 hooks 和 store
