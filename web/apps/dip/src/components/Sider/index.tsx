import { Layout } from 'antd'
import clsx from 'classnames'
import { useEffect, useState } from 'react'
import type { RouteModule, SiderType } from '@/routes/types'
import { useUserInfoStore } from '@/stores/userInfoStore'
import AdminSider from './AdminSider'
import BusinessSider from './BusinessSider'
import HomeSider from './HomeSider'
import styles from './index.module.less'

const { Sider: AntdSider } = Layout

interface SiderProps {
  /** 是否折叠 */
  collapsed: boolean
  /** 折叠状态改变回调 */
  onCollapse: (collapsed: boolean) => void
  /** 顶部偏移量 */
  topOffset?: number
  /** 侧边栏布局形态 */
  layout?: SiderType
  /** 当前路由归属模块（应用壳下用于区分 Studio 侧栏 / Store 侧栏） */
  routeModule?: RouteModule
}

/**
 * 侧边栏主组件
 * layout=entry：首页入口壳；layout=app + module：模块内应用壳
 */
const Sider = ({
  collapsed,
  onCollapse,
  topOffset = 0,
  layout = 'entry',
  routeModule,
}: SiderProps) => {
  const isAdmin = useUserInfoStore((s) => s.isAdmin)
  const [transitionEnabled, setTransitionEnabled] = useState(false)
  useEffect(() => {
    const t = requestAnimationFrame(() => {
      requestAnimationFrame(() => setTransitionEnabled(true))
    })
    return () => cancelAnimationFrame(t)
  }, [])

  return (
    <AntdSider
      width="100%"
      collapsedWidth="100%"
      collapsible
      collapsed={collapsed}
      trigger={null}
      className={clsx(
        'bg-white backdrop-blur-[6px] shadow-[inset_-1px_0_0_rgba(0,0,0,0.1)]',
        styles.siderContainer,
        collapsed && styles.collapsed,
        !transitionEnabled && styles.siderNoTransition,
      )}
      style={{
        left: 0,
        height: `calc(100vh - ${topOffset}px)`,
        top: 0,
        bottom: 0,
      }}
    >
      {routeModule === 'business' ? (
        <BusinessSider collapsed={collapsed} onCollapse={onCollapse} />
      ) : isAdmin ? (
        <AdminSider collapsed={collapsed} onCollapse={onCollapse} layout={layout} />
      ) : (
        <HomeSider collapsed={collapsed} onCollapse={onCollapse} layout={layout} />
      )}
    </AntdSider>
  )
}

export default Sider
