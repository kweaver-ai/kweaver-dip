import type { ReactNode } from 'react'

export type HeaderType =
  | 'store'
  | 'studio'
  | 'micro-app'
  | 'home'
  | 'initial-configuration'
  /** 全局业务知识网络布局（路由前缀为 business-network） */
  | 'business'
/** 侧边栏布局形态：入口壳（首页无顶栏）| 应用壳（模块内常有顶栏） */
export type SiderType = 'entry' | 'app'

/**
 * 路由归属的功能模块（与 EnabledModule 同值域；语义为路由/菜单分类，非布局形态）
 */
export type RouteModule = 'studio' | 'store' | 'business'

/** 用户可访问的模块（权限） */
export type EnabledModule = 'studio' | 'store' | 'business'

/**
 * 路由在侧栏 / 「按 sider 取首条可访问路由」中的参与方式
 * - menu：在侧栏展示，并参与首条解析
 * - hidden：纯子页等，侧栏不展示且不参与首条解析
 * - entry-only：侧栏不展示，但参与首条解析（如 studio 会话首页）
 */
export type RouteSidebarMode = 'menu' | 'hidden' | 'entry-only'

export const WENSHU_APP_KEY = 'cedb529407c345b1a27317baefa62800'

/** 布局配置 */
export interface LayoutConfig {
  /** 是否展示顶栏 */
  hasHeader?: boolean
  /** 侧边栏模式：none 不展示，entry 入口壳，app 应用壳 */
  siderMode?: 'none' | SiderType
  /** 当前路由归属的功能模块（应用壳侧栏、首跳解析等） */
  module?: RouteModule
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
  /** 侧栏展示与首跳解析策略；缺省按 `hidden` 理解 */
  sidebarMode?: RouteSidebarMode
  /** 侧边栏分组 */
  group?: string
  /**
   * 面包屑中「分类」之后的祖先路由 key 列表（顺序即展示顺序），不包含当前页。
   * 若显式配置（含空数组），则不再用路径前缀推导父级；未配置时回退到 getParentRoute。
   */
  breadcrumbParentKeys?: string[]
  /** 是否在面包屑末项展示当前页；默认 true */
  showInBreadcrumb?: boolean
  handle?: RouteHandle
  children?: RouteConfig[]
}
