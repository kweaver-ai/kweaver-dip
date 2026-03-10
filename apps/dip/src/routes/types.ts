import type { ReactNode } from 'react'

export type HeaderType = 'store' | 'studio' | 'micro-app'
export type SiderType = 'store' | 'studio' | 'home'

export const WENSHU_APP_KEY = 'cedb529407c345b1a27317baefa62800'

/** 布局配置 */
export interface LayoutConfig {
  /** 是否展示侧边栏 */
  hasSider?: boolean
  /** 是否展示顶栏 */
  hasHeader?: boolean
  /** 侧边栏类型 */
  siderType?: SiderType
  /** 顶栏类型 */
  headerType?: HeaderType
}

/** 路由 handle 配置 */
export interface RouteHandle {
  layout?: LayoutConfig
}

/** 路由配置 */
export interface RouteConfig {
  path?: string
  element?: ReactNode | null
  key?: string
  label?: string
  /** 侧边栏图标资源路径（用于在 Sider 中做填充/渐变等处理） */
  iconUrl?: string
  /** 允许访问该菜单/路由的角色ID（命中任意一个即可）；为空则默认允许 */
  requiredRoleIds?: string[]
  disabled?: boolean
  /** 是否在侧边栏展示 */
  showInSidebar?: boolean
  handle?: RouteHandle
  children?: RouteConfig[]
}
