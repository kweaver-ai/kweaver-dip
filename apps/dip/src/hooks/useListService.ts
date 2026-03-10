import { useCallback, useEffect, useRef, useState } from 'react'

interface UseListServiceOptions<T, P extends any[] = []> {
  /** 获取列表数据的 API 函数 */
  fetchFn: (...args: P) => Promise<T[]>
  /** 是否自动加载，默认为 true */
  autoLoad?: boolean
  /** 自定义过滤函数，默认使用 name 字段进行模糊匹配 */
  filterFn?: (item: T, keyword: string) => boolean
}

/**
 * 通用列表数据服务 Hook
 * 用于处理列表数据的请求、搜索、刷新等通用逻辑
 * @param options 配置选项
 * @returns {T[]} items 列表数据
 * @returns {boolean} loading 加载状态
 * @returns {string | null} error 错误信息
 * @returns {string} searchValue 搜索关键词
 * @returns {Function} handleSearch 处理搜索
 * @returns {Function} handleRefresh 刷新数据
 * @returns {Function} fetchList 手动触发获取列表（用于手动加载模式）
 */
export const useListService = <T extends { name?: string }, P extends any[] = []>(
  options: UseListServiceOptions<T, P>,
) => {
  const { fetchFn, autoLoad = true, filterFn } = options
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const currentRequestRef = useRef<{ abort: () => void } | null>(null) // 保存当前请求，用于取消
  const lastArgsRef = useRef<P | null>(null) // 保存最近一次请求参数，用于刷新

  /** 默认过滤函数：使用 name 字段进行模糊匹配 */
  const defaultFilterFn = useCallback((item: T, keyword: string) => {
    return item.name?.toLowerCase().includes(keyword.toLowerCase()) ?? false
  }, [])

  const finalFilterFn = filterFn || defaultFilterFn

  /** 获取列表数据（参数完全透传给外部 fetchFn） */
  const fetchList = useCallback(
    async (...args: P) => {
      // 如果存在上一个请求，取消它
      if (currentRequestRef.current) {
        currentRequestRef.current.abort()
        currentRequestRef.current = null
      }

      // 记录本次请求的参数，供后续刷新使用
      lastArgsRef.current = args

      let isCancelled = false
      try {
        setLoading(true)
        setError(null)

        // 发起新请求并保存引用（参数完全透传给外部 API）
        const requestPromise = fetchFn(...args)
        currentRequestRef.current = requestPromise as any

        const data = await requestPromise

        // 请求成功后清除引用
        currentRequestRef.current = null

        // 使用当前搜索词进行本地过滤（不影响外部 API 的参数）
        const filtered = searchValue
          ? data.filter((item) => finalFilterFn(item, searchValue))
          : data
        setItems(filtered)
      } catch (err: any) {
        // 请求被取消时，清除引用但不更新状态
        if (err?.name === 'AbortError' || err?.message === 'CANCEL') {
          currentRequestRef.current = null
          isCancelled = true
          return
        }
        currentRequestRef.current = null
        if (err?.description) {
          setError(err.description)
        } else {
          setError('获取数据时发生错误')
        }
      } finally {
        // 只有请求未被取消时才更新 loading 状态
        if (!isCancelled) {
          setLoading(false)
        }
      }
    },
    [fetchFn, finalFilterFn, searchValue],
  )

  /** 刷新数据 */
  const handleRefresh = useCallback(() => {
    if (lastArgsRef.current) {
      fetchList(...lastArgsRef.current)
    } else {
      fetchList(...([] as unknown as P))
    }
  }, [fetchList])

  /** 处理搜索 */
  const handleSearch = useCallback((value: string) => {
    setSearchValue(value)
  }, [])

  // 自动加载模式：初始化和搜索时加载数据
  useEffect(() => {
    if (autoLoad) {
      fetchList(...([] as unknown as P))
    }
  }, [autoLoad, fetchList, searchValue])

  // 组件卸载时取消正在进行的请求
  useEffect(() => {
    return () => {
      if (currentRequestRef.current) {
        currentRequestRef.current.abort()
        currentRequestRef.current = null
      }
    }
  }, [])

  return {
    items,
    loading,
    error,
    searchValue,
    handleSearch,
    handleRefresh,
    fetchList, // 手动触发获取（用于手动加载模式）
  }
}
