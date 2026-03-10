import { Spin } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getApplicationsBasicInfo } from '@/apis'
import Empty from '@/components/Empty'
import { getFirstVisibleRouteBySiderType } from '@/routes/utils'
import { getFullPath } from '@/utils/config'
import { setMicroAppGlobalState } from '@/utils/micro-app/globalState'
import MicroAppComponent from '../../components/MicroAppComponent'
import { useMicroAppStore } from '../../stores/microAppStore'

const MicroAppContainer = () => {
  const { appId } = useParams<{ appId: string }>()
  const idNum = useMemo(() => (appId ? Number(appId) : NaN), [appId])
  // 移除对 URL 参数的读取，改由纯 Store 驱动，防止微应用篡改
  const currentMicroApp = useMicroAppStore((state) => state.currentMicroApp)
  const setCurrentMicroApp = useMicroAppStore((state) => state.setCurrentMicroApp)
  const setHomeRoute = useMicroAppStore((state) => state.setHomeRoute)
  const clearCurrentMicroApp = useMicroAppStore((state) => state.clearCurrentMicroApp)
  const appSourceMap = useMicroAppStore((state) => state.appSourceMap)

  // 这里的优先级是：Store 记录 > 默认 'home'
  // 不再信任 URL 中的 ?type= 动态参数
  const type = (!Number.isNaN(idNum) ? appSourceMap[idNum] : null) || 'home'

  // 根据 type 计算 homeRoute
  const homeRoute = useMemo(() => {
    if (type === 'home') {
      return '/'
    }

    // 对于 store 或 studio，获取第一个可见路由
    const roleIds = new Set<string>([]) // TODO: 从实际角色系统获取
    const firstRoute = getFirstVisibleRouteBySiderType(type, roleIds)
    if (firstRoute?.path) {
      return `/${firstRoute.path}`
    }

    // 兜底逻辑
    return `/${type === 'store' ? 'store/my-app' : 'studio/project-management'}`
  }, [type])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchApp = async () => {
      if (Number.isNaN(idNum)) {
        setError('获取应用失败')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const appData = await getApplicationsBasicInfo(idNum)
        if (!appData) {
          setError('获取应用配置失败')
        } else {
          // 统一保存在全局 Store 中，组件直接从 Store 读取（含 homeRoute，供 MicroAppHeader 面包屑等使用）
          setCurrentMicroApp({
            ...appData,
            routeBasename: getFullPath(`/application/${appData.id}`),
          })
          setHomeRoute(homeRoute)
        }
      } catch (err: any) {
        if (err?.description) {
          setError(err.description)
        } else {
          setError('获取应用配置失败')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchApp()

    // 清理函数
    return () => {
      setError(null)
      setLoading(false)
      // 清理微应用信息和面包屑
      clearCurrentMicroApp()
      setMicroAppGlobalState(
        {
          breadcrumb: [],
        },
        { allowAllFields: true },
      )
    }
  }, [idNum, clearCurrentMicroApp, setCurrentMicroApp, setHomeRoute, homeRoute])

  const renderContent = () => {
    if (loading) {
      return (
        <div className="absolute inset-0 flex justify-center items-center">
          <Spin size="large" />
        </div>
      )
    }
    if (error || !currentMicroApp) {
      return (
        <div className="absolute inset-0 flex justify-center items-center">
          <Empty type="failed" title="加载失败" subDesc={error ?? ''} />
        </div>
      )
    }
    return <MicroAppComponent appBasicInfo={currentMicroApp} homeRoute={getFullPath(homeRoute)} />
  }

  return (
    <div className="h-full w-full flex flex-col overflow-hidden relative">{renderContent()}</div>
  )
}

export default MicroAppContainer
