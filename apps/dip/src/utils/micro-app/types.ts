/**
 * 加载微应用时传递给微应用的 Props
 */
export interface MicroAppProps {
  /** ========== 认证相关 ========== */
  token: {
    /** 访问令牌（accessToken），使用 getter，每次访问时都从 Cookie 读取最新值 */
    get accessToken(): string
    /** Token 刷新能力（微应用可以调用此函数刷新 token） */
    refreshToken: () => Promise<{ accessToken: string }>
    /** Token 过期处理函数 */
    onTokenExpired?: (code?: number) => void
  }

  /** ========== 路由信息 ========== */
  route: {
    /** 应用路由基础路径 */
    basename: string
    /** 首页路由 */
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
    fireImmediately?: boolean,
  ) => () => void

  /** ========== UI 相关 ========== */
  /** 容器 DOM 元素 */
  container: HTMLElement
}
