import { Layout } from 'antd'
import clsx from 'classnames'
import { useEffect, useState } from 'react'
import type { SiderType } from '@/routes/types'
import BaseSider from './BaseSider'
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
  /** 侧边栏类型 */
  type?: SiderType
}

/**
 * 侧边栏主组件
 * 根据 type 选择渲染 BaseSider（store/studio）或 MicroAppSider（micro-app）
 */
const Sider = ({ collapsed, onCollapse, topOffset = 0, type = 'home' }: SiderProps) => {
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
      {type === 'home' ? (
        <HomeSider collapsed={collapsed} onCollapse={onCollapse} />
      ) : (
        <BaseSider collapsed={collapsed} onCollapse={onCollapse} type={type} />
      )}
    </AntdSider>
  )
}

export default Sider
