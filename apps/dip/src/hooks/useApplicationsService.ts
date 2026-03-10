import { useCallback, useEffect, useState } from 'react'
import { type ApplicationInfo, getApplications } from '@/apis'
import { WENSHU_APP_KEY } from '@/routes/types'
import { useListService } from './useListService'

interface UseApplicationsServiceOptions {
  /** 是否自动加载，默认为 true */
  autoLoad?: boolean
  /** 状态 */
  params?: Record<string, any>
}

/**
 * 应用列表数据服务 Hook
 * 专门用于处理应用列表的请求服务
 * @param options 配置选项
 * @returns {ApplicationInfo[]} apps 应用列表
 * @returns {boolean} loading 加载状态
 * @returns {string | null} error 错误信息
 * @returns {string} searchValue 搜索关键词
 * @returns {Function} handleSearch 处理搜索
 * @returns {Function} handleRefresh 刷新数据
 * @returns {Function} fetchAppList 手动触发获取应用列表（用于手动加载模式）
 */
export const useApplicationsService = (options: UseApplicationsServiceOptions = {}) => {
  const fetchFn = useCallback(() => getApplications(options.params), [options.params])
  const { items, loading, error, searchValue, handleSearch, handleRefresh, fetchList } =
    useListService<ApplicationInfo>({
      fetchFn,
      autoLoad: options.autoLoad,
    })
  const [apps, setApps] = useState<ApplicationInfo[]>([])
  useEffect(() => {
    setApps(items.map((item) => ({ ...item, isBuiltIn: item.key === WENSHU_APP_KEY })))
  }, [items])

  const updateApp = useCallback(
    (newApp: ApplicationInfo) => {
      setApps((prevApps) => prevApps.map((app) => (app.id === newApp?.id ? newApp : app)))
    },
    [setApps],
  )

  return {
    apps,
    updateApp,
    loading,
    error,
    searchValue,
    handleSearch,
    handleRefresh,
    fetchAppList: fetchList,
  }
}
