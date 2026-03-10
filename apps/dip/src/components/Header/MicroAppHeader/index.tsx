import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { removeBasePath } from '@/routes/utils'
import { useMicroAppStore } from '@/stores'
import type { BreadcrumbItem } from '@/utils/micro-app/globalState'
import {
  type MicroAppGlobalState,
  onMicroAppGlobalStateChange,
  // setMicroAppGlobalState,
} from '@/utils/micro-app/globalState'
import { AppMenu } from '../components/AppMenu'
import { Breadcrumb } from '../components/Breadcrumb'
// import { CopilotButton } from './CopilotButton'
import { UserInfo } from '../components/UserInfo'

/**
 * 微应用壳导航头（MicroAppHeader）
 *
 * - 只在微应用容器路由下使用（/application/:appId/*）
 * - 负责渲染：应用菜单 + 微应用图标和名称 + 微应用面包屑 + Copilot + 用户信息
 */
const MicroAppHeader = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const { currentMicroApp, homeRoute } = useMicroAppStore()

  const [microAppBreadcrumb, setMicroAppBreadcrumb] = useState<BreadcrumbItem[]>([])

  const isMicroAppRoute = location.pathname.startsWith('/application/')

  // 监听微应用的全局状态（面包屑）
  useEffect(() => {
    if (!isMicroAppRoute) {
      setMicroAppBreadcrumb([])
      return
    }

    const unsubscribe = onMicroAppGlobalStateChange((state: MicroAppGlobalState) => {
      if (state.breadcrumb) {
        setMicroAppBreadcrumb(state.breadcrumb)
      }
    }, true)

    return () => {
      unsubscribe()
    }
  }, [isMicroAppRoute])

  // 构建完整的面包屑项：首页图标（由 Breadcrumb 组件统一处理） / 微应用图标+名称 / 微应用传递的面包屑信息
  const breadcrumbItems: BreadcrumbItem[] = useMemo(() => {
    // 非微应用路由时，不展示任何微应用面包屑
    if (!isMicroAppRoute) return []

    const items: BreadcrumbItem[] = []

    // 微应用根节点：应用图标 + 名称
    if (currentMicroApp) {
      items.push({
        key: currentMicroApp.id.toString(),
        name: currentMicroApp.name,
        path: removeBasePath(currentMicroApp.routeBasename),
        icon: currentMicroApp.icon,
      })
    }

    /**
     * 微应用上报的 breadcrumb 数据形如：
     * [
     *   { key: 'alarm',   name: '告警与故障分析', path: '/alarm' },
     *   { key: 'problem', name: '问题',           path: '/alarm/problem' },
     * ]
     *
     * 这里的 path 视为「微应用内部路径」，需要统一挂载到 routeBasename 之下：
     * - routeBasename: /dip-hub/application/:appId (包含 BASE_PATH)
     * - 去掉 BASE_PATH 后: /application/:appId
     * - '/alarm'           -> /application/:appId/alarm
     * - '/alarm/problem'   -> /application/:appId/alarm/problem
     * - 'alarm'            -> /application/:appId/alarm
     */
    if (microAppBreadcrumb.length > 0 && currentMicroApp?.routeBasename) {
      // 先去掉 BASE_PATH 前缀，得到相对于 basename 的路径
      const baseWithoutPrefix = removeBasePath(currentMicroApp.routeBasename.replace(/\/$/, ''))

      const processedItems = microAppBreadcrumb.map((item, index) => {
        const itemPath = item.path
        let relativePath = itemPath

        if (itemPath) {
          // 去掉前导斜杠，统一按相对路径处理
          const cleaned = itemPath.replace(/^\/+/, '')
          relativePath = cleaned ? `${baseWithoutPrefix}/${cleaned}` : baseWithoutPrefix
        }

        return {
          key: item.key || `micro-breadcrumb-${index}`,
          name: item.name,
          path: relativePath,
        }
      })

      items.push(...processedItems)
    }

    return items
  }, [isMicroAppRoute, currentMicroApp, microAppBreadcrumb])

  // 面包屑导航跳转
  const handleBreadcrumbNavigate = useCallback(
    (item: BreadcrumbItem) => {
      if (!item.path) return
      navigate(item.path)
    },
    [navigate],
  )

  // Copilot 按钮点击：通过全局状态通知微应用
  /* const handleCopilotClick = useCallback(() => {
    // 主应用通过全局状态下发「Copilot 被点击」事件
    // 微应用在 props.onMicroAppStateChange 中监听 state.copilot 即可
    setMicroAppGlobalState(
      {
        copilot: {
          // 这里的结构由主应用约定，微应用按需解析即可
          clickedAt: Date.now(),
        },
      },
      { allowAllFields: true },
    )
  }, [])
*/

  return (
    <>
      {/* 左侧：应用菜单和面包屑 */}
      <div className="flex items-center gap-x-4">
        <AppMenu />
        <Breadcrumb
          type="micro-app"
          items={breadcrumbItems}
          homePath={homeRoute ?? '/'}
          onNavigate={handleBreadcrumbNavigate}
        />
      </div>

      {/* 右侧：Copilot 按钮和用户信息 */}
      <div className="flex items-center gap-x-4">
        {/* {isMicroAppRoute && currentMicroApp && (
          <CopilotButton onClick={handleCopilotClick} />
        )} */}
        <UserInfo />
      </div>
    </>
  )
}

export default MicroAppHeader
