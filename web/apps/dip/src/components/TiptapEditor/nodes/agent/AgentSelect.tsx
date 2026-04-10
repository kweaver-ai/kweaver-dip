import { Input, message, Spin } from 'antd'
import { debounce, throttle } from 'lodash'
import type React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { List } from 'react-window'
import { getAgentsByPost } from '@/apis/agent-factory'
import type { Agent } from '@/apis/agent-factory/index.d'
import { LoadStatus } from '@/types/enums'
import styles from './index.module.less'

const size = 20

interface AgentSelectProps {
  selectedAgentId?: string
  onSelect: (agent: Agent) => void
  extension: any
}

const AgentSelect: React.FC<AgentSelectProps> = ({ selectedAgentId, onSelect, extension }) => {
  // 分页 marker
  const paginationMarkerRef = useRef<string | undefined>(undefined)
  // 是否还有数据未加载完
  const hasMoreRef = useRef<boolean>(true)
  // 是否正在加载更多
  const isLoadingMoreRef = useRef<boolean>(false)

  // 搜索关键字
  const searchKeyRef = useRef<string>('')
  const requestRef = useRef<any>(null)

  // 加载状态
  const [loadStatus, setLoadStatus] = useState<LoadStatus>(LoadStatus.Empty)
  // 数据
  const [data, setData] = useState<Agent[]>([])
  const [searchKey, setSearchKey] = useState<string>('')

  // 获取智能体列表
  const fetchAgents = useCallback(async (isLoadMore = false) => {
    if (!hasMoreRef.current && isLoadMore) return

    try {
      // 只有第一次加载，才设置loadStatus
      if (!isLoadMore) {
        setLoadStatus(LoadStatus.Loading)
      }

      // 开启新的请求之前，先取消之前的请求
      requestRef.current?.abort?.()

      requestRef.current = getAgentsByPost({
        name: searchKeyRef.current || undefined,
        size,
        pagination_marker_str: isLoadMore ? paginationMarkerRef.current : undefined,
      })

      const { entries, pagination_marker_str, is_last_page } = await requestRef.current

      // 设置 pagination marker
      paginationMarkerRef.current = pagination_marker_str
      // 设置 hasMore
      hasMoreRef.current = !is_last_page

      if (isLoadMore) {
        // 加载更多：在末尾添加数据
        setData((prev) => [...prev, ...entries])
      } else {
        setData(entries)
        setLoadStatus(entries.length ? LoadStatus.Normal : LoadStatus.Empty)
      }

      isLoadingMoreRef.current = false
    } catch (ex: any) {
      // 请求取消，无需处理错误
      if (ex === 'CANCEL') return

      if (ex?.description) {
        message.error(ex.description)
      }

      // 只有第一次加载，才设置loadStatus
      if (!isLoadMore) {
        setLoadStatus(LoadStatus.Failed)
      }

      isLoadingMoreRef.current = false
    }
  }, [])

  // 搜索（防抖）
  const searchAgentDebounce = useMemo(() => debounce(fetchAgents, 300), [fetchAgents])
  // 滑动（节流）
  const handleScroll = useMemo(() => {
    return throttle(
      (
        { target }: any,
        {
          listHeight,
          itemSize,
          dataLength,
        }: { listHeight: number; itemSize: number; dataLength: number },
      ) => {
        if (target.scrollTop === 0 || isLoadingMoreRef.current || !hasMoreRef.current) return

        const totalHeight = itemSize * dataLength
        const isNearBottom = target.scrollTop + listHeight >= totalHeight - target.clientHeight

        if (isNearBottom) {
          isLoadingMoreRef.current = true
          fetchAgents(true)
        }
      },
      150,
    )
  }, [fetchAgents])

  // 组件挂载时初始化数据
  useEffect(() => {
    paginationMarkerRef.current = undefined
    hasMoreRef.current = true
    searchKeyRef.current = ''
    setSearchKey('')
    setData([])
    fetchAgents()
  }, [fetchAgents])

  // 组件卸载时取消防抖
  useEffect(() => {
    return () => searchAgentDebounce.cancel()
  }, [searchAgentDebounce])

  // 组件卸载时取消 throttle
  useEffect(() => {
    return () => handleScroll.cancel()
  }, [handleScroll])

  /** 渲染状态内容（loading/error/empty） */
  const renderStateContent = () => {
    if (loadStatus === LoadStatus.Loading) {
      return <Spin />
    }

    if (loadStatus === LoadStatus.Failed) {
      return '加载失败'
    }

    if (loadStatus === LoadStatus.Empty) {
      if (searchKey) {
        return '抱歉，没有找到相关内容'
      }
      return '暂无数据'
    }

    return null
  }

  const getRow = ({ index, style, data: rowData }: any) => {
    const item = rowData[index]
    const isSelected = selectedAgentId === item.id

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => onSelect(item)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onSelect(item)
          }
        }}
        style={style}
        className={`w-full h-8 text-left px-3 rounded cursor-pointer transition-colors ${
          isSelected ? 'bg-[rgba(18,110,227,0.06)]' : 'hover:bg-[rgba(0,0,0,0.04)]'
        }`}
      >
        {item.name}
      </button>
    )
  }

  return (
    <div className="w-[352px] max-h-[240px] flex flex-col gap-y-2">
      {/* 搜索框 */}
      <div className="px-4">
        <Input
          allowClear
          placeholder={`搜索${extension.options.dictionary.name}`}
          className="w-full"
          value={searchKey}
          onChange={(e) => {
            const value = e.target.value
            paginationMarkerRef.current = undefined
            hasMoreRef.current = true
            searchKeyRef.current = value
            setSearchKey(value)
            setData([])
            searchAgentDebounce()
          }}
        />
      </div>

      {/* 列表 */}
      <div className="flex-1 min-h-0 pl-2 flex flex-col">
        {loadStatus === LoadStatus.Normal ? (
          <List
            rowComponent={getRow}
            rowProps={{
              data: data,
            }}
            rowHeight={32}
            rowCount={data.length}
            onScroll={(params: any) => {
              handleScroll(params, {
                listHeight: 32,
                itemSize: 32,
                dataLength: data.length,
              })
            }}
            className={styles.list}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-[rgba(0,0,0,0.45)] text-center py-4">
            {renderStateContent()}
          </div>
        )}
      </div>
    </div>
  )
}

export default AgentSelect
