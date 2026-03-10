import { Layout } from 'antd'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { useMatches, useParams } from 'react-router-dom'
import bg from '@/assets/images/gradient-container-bg.png'
import type { RouteHandle } from '@/routes/types'
import { WENSHU_APP_KEY } from '@/routes/types'
import { usePreferenceStore } from '@/stores'
import { useMicroAppStore } from '@/stores/microAppStore'
import Header from '../../components/Header'
import Sider from '../../components/Sider'

const { Content } = Layout

interface ContainerProps {
  children: ReactNode
}

const SIDER_WIDTH = 240
const SIDER_COLLAPSED_WIDTH = 60

const Container = ({ children }: ContainerProps) => {
  const [collapsed, setCollapsed] = useState(false)
  const matches = useMatches()
  const params = useParams()
  const { currentMicroApp } = useMicroAppStore()
  const { wenshuAppInfo } = usePreferenceStore()

  // 当前是否处于微应用容器场景
  const isMicroApp = !!currentMicroApp
  // headless 微应用：不显示任何壳层 Header
  const microAppNoHeader = isMicroApp && currentMicroApp?.micro_app?.headless

  // 只使用最后一个匹配的路由（当前路由）的布局配置
  // 主应用页面只依赖路由的静态布局配置
  const currentMatch = matches[matches.length - 1]
  const routeLayoutConfig = (currentMatch?.handle as RouteHandle | undefined)?.layout

  // 特殊处理：问数应用没有导航头，有侧边栏
  // 1. 优先通过当前微应用的 key 判断（兼容直接刷新 /application/:appId 的场景）
  // 2. 兼容通过 store 中缓存的 wenshuAppInfo.id 判断（兼容从首页/登录跳转的场景）
  const isWenshuByKey = currentMicroApp?.key === WENSHU_APP_KEY
  const isWenshuById = wenshuAppInfo?.id === Number(params?.appId)
  const isWenshuApp = isWenshuByKey || isWenshuById

  // 布局决策：
  // - headless 微应用：强制 { hasHeader: false, hasSider: false }
  // - 问数应用：强制 { hasHeader: false, hasSider: true }
  // - 其他情况（主应用页面或普通微应用）：使用路由静态配置
  const layoutConfig = microAppNoHeader
    ? { ...routeLayoutConfig, hasHeader: false, hasSider: false }
    : isWenshuApp
      ? { ...routeLayoutConfig, hasSider: true, hasHeader: false }
      : routeLayoutConfig

  // 默认值
  const {
    hasSider = false,
    hasHeader = false,
    siderType = 'home',
    headerType = 'micro-app',
  } = layoutConfig || {}

  const headerHeight = 52

  return (
    <Layout className="overflow-hidden">
      {/* Header 决策 */}
      {hasHeader && <Header headerType={headerType} />}

      <Layout
        style={{
          backgroundImage: `url(${bg})`,
          // display: 'flex',
          // flexDirection: 'row',
          // flex: 1,
          // minHeight: 0,
        }}
        className="bg-no-repeat bg-cover"
      >
        {/* 主内容区首帧即预留左侧空间，避免 Sider 挂载后产生 CLS */}
        <div
          style={{
            position: 'relative',
            flex: 1,
            minWidth: 0,
            minHeight: 0,
          }}
        >
          {hasSider && (
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: collapsed ? SIDER_COLLAPSED_WIDTH : SIDER_WIDTH,
                transition: 'width 0.2s',
              }}
            >
              <Sider
                collapsed={collapsed}
                onCollapse={setCollapsed}
                topOffset={hasHeader ? headerHeight : 0}
                type={siderType}
              />
            </div>
          )}
          <div
            style={{
              marginLeft: hasSider ? (collapsed ? SIDER_COLLAPSED_WIDTH : SIDER_WIDTH) : 0,
              height: hasHeader ? `calc(100vh - ${headerHeight}px)` : '100vh',
              transition: 'margin-left 0.2s',
            }}
            className="overflow-auto bg-transparent"
          >
            <Layout className="h-full overflow-auto bg-transparent">
              <Content className="relative bg-transparent min-w-[1040px] m-0">{children}</Content>
            </Layout>
          </div>
        </div>
      </Layout>
    </Layout>
  )
}

export default Container
