import { Layout } from 'antd'
import clsx from 'classnames'
import { useEffect, useState } from 'react'
import type { SiderType } from '@/routes/types'
import { useUserInfoStore } from '@/stores/userInfoStore'
import AdminSider from './AdminSider'
import HomeSider from './HomeSider'
import styles from './index.module.less'
import StoreSider from './StoreSider'

const { Sider: AntdSider } = Layout

interface SiderProps {
  /** 是否折叠 */
  collapsed: boolean
  /** 折叠状态改变回调 */
  onCollapse: (collapsed: boolean) => void
  /** 顶部偏移量 */
  topOffset?: number
  /** 侧边栏类型 */
  type?: SiderType
}

/**
 * 侧边栏主组件
 * 根据 type 选择渲染 HomeSider（home/studio）或 StoreSider（store）
 */
const Sider = ({ collapsed, onCollapse, topOffset = 0, type = 'home' }: SiderProps) => {
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
      {type === 'home' || type === 'studio' ? (
        isAdmin ? (
          <AdminSider collapsed={collapsed} onCollapse={onCollapse} siderType={type} />
        ) : (
          <HomeSider collapsed={collapsed} onCollapse={onCollapse} siderType={type} />
        )
      ) : (
        <StoreSider collapsed={collapsed} onCollapse={onCollapse} />
      )}
    </AntdSider>
  )
}

export default Sider
