import { CheckOutlined } from '@ant-design/icons'
import { Button, Input, message, Spin, Tooltip } from 'antd'
import clsx from 'clsx'
import { debounce, throttle } from 'lodash'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import intl from 'react-intl-universal'
import { List } from 'react-window'
import { getMetricModels } from '@/apis'
import Empty from '@/components/Empty'
import IconFont from '@/components/IconFont'
import { LoadStatus } from '@/types/enums'
import { useMetricSelectorStore } from './store'
import { MetricConstants } from './types'

const limit = 20

const MetricList = () => {
  const {
    metricSelectorStore,
    removeSelectedMetric,
    appendSelectedMetric,
    updateAllMetricGroup,
    isAllMetricGroupSetted,
  } = useMetricSelectorStore()

  // 懒加载的offset
  const offsetRef = useRef<number>(0)
  // 是否还有数据未加载完
  const hasMoreRef = useRef<boolean>(true)
  // 是否正在加载更多
  const isLoadingMoreRef = useRef<boolean>(false)

  // 搜索关键字
  const searchKeyRef = useRef<string>('')
  const requestRef = useRef<any>(null)

  // 加载状态
  const [loadStatus, setLoadStatus] = useState(LoadStatus.Empty)
  // 数据
  const [data, setData] = useState<{ id: string; name: string }[]>([])
  const [searchKey, setSearchKey] = useState<string>('')

  // 搜索
  const fetchMetric = useCallback(async () => {
    if (!metricSelectorStore.selectedGroup) return
    if (!hasMoreRef.current) return

    try {
      // 只有第一次加载，才设置loadStatus
      if (!isLoadingMoreRef.current) {
        setLoadStatus(LoadStatus.Loading)
      }

      // 开启新的请求之前，先取消之前的请求
      requestRef.current?.abort?.()

      requestRef.current = getMetricModels({
        name_pattern: searchKeyRef.current,
        offset: offsetRef.current,
        limit,
        ...(metricSelectorStore.selectedGroup.id !== '__all'
          ? {
              group_id: metricSelectorStore.selectedGroup.id as unknown as number,
            }
          : {}),
      })

      const { entries, total_count } = await requestRef.current

      // 设置offset
      offsetRef.current += entries.length
      // 设置hasMore
      hasMoreRef.current = entries.length === limit

      if (isLoadingMoreRef.current) {
        // 加载更多：在末尾添加数据
        setData((prev) => [...prev, ...entries])
      } else {
        setData(entries)
        setLoadStatus(entries.length ? LoadStatus.Normal : LoadStatus.Empty)
      }

      // 更新所有指标分组内指标模型数量
      if (metricSelectorStore.selectedGroup.id === '__all' && !isAllMetricGroupSetted) {
        updateAllMetricGroup({ [MetricConstants.MetricModelCount]: total_count })
      }

      isLoadingMoreRef.current = false
    } catch (ex: any) {
      // 请求取消，无需处理错误
      if (ex === 'CANCEL') return

      if (ex?.description) {
        message.error(ex.description)
      }

      // 只有第一次加载，才设置loadStatus
      if (!isLoadingMoreRef.current) {
        setLoadStatus(LoadStatus.Failed)
      }

      isLoadingMoreRef.current = false
    }
  }, [metricSelectorStore.selectedGroup, isAllMetricGroupSetted, updateAllMetricGroup])

  // 搜索（防抖）
  const searchMetricDebounce = useMemo(() => debounce(fetchMetric, 300), [fetchMetric])
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
          fetchMetric()
        }
      },
      150,
    )
  }, [fetchMetric])

  const getRow = ({ index, style, data }: any) => {
    const item = data[index]
    // 是否选中
    const isSelected = metricSelectorStore.selectedMetrics.some((metric) => metric.id === item.id)

    return (
      <button
        type="button"
        style={style}
        className={clsx(
          'cursor-pointer flex items-center pl-5 pr-5 gap-[10px] hover:bg-[rgba(166,169,181,0.11)]',
          isSelected && 'bg-[#e7f2ff] hover:!bg-[#e7f2ff]',
        )}
        onClick={() => {
          if (isSelected) {
            removeSelectedMetric(item)
          } else {
            appendSelectedMetric(item)
          }
        }}
      >
        <IconFont type="icon-dip-color-zhibiaometirc" className="text-2xl" />
        <span className="flex flex-col overflow-hidden">
          <Tooltip title={item.name}>
            <span className="truncate w-fit max-w-full">{item.name}</span>
          </Tooltip>
          <Tooltip title={item.id}>
            <span className="truncate text-black/45 w-fit max-w-full">{item.id}</span>
          </Tooltip>
        </span>
        {isSelected && <CheckOutlined className="text-[#2e72e2]" />}
      </button>
    )
  }

  // 当选中的分组id发生变化时，获取该分组下的指标模型列表
  useEffect(() => {
    // 特殊情况：未分组的id是空字符串
    if (metricSelectorStore.selectedGroup && 'id' in metricSelectorStore.selectedGroup) {
      offsetRef.current = 0
      hasMoreRef.current = true
      // 切换分组时，清空搜索关键字
      searchKeyRef.current = ''
      setSearchKey('')
      fetchMetric()
    }
  }, [metricSelectorStore.selectedGroup?.id])

  // 组件卸载时取消防抖
  useEffect(() => {
    return () => searchMetricDebounce.cancel()
  }, [searchMetricDebounce])

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
      return (
        <Empty type="failed" title="加载失败">
          <Button className="mt-1" type="primary" onClick={fetchMetric}>
            重试
          </Button>
        </Empty>
      )
    }

    if (loadStatus === LoadStatus.Empty) {
      if (searchKey) {
        return <Empty type="search" desc="抱歉，没有找到相关内容" />
      }
      return <Empty title="暂无数据" />
    }

    return null
  }

  return (
    <div className="w-full h-full flex flex-col relative">
      <Input
        allowClear
        placeholder={intl.get('dataAgent.searchIndicatorName')}
        className="w-[260px] self-end mt-4 mr-4 mb-2"
        value={searchKey}
        // 未选中分组时，输入框禁用
        disabled={!metricSelectorStore.selectedGroup}
        onChange={(e) => {
          const value = e.target.value
          offsetRef.current = 0
          hasMoreRef.current = true
          searchKeyRef.current = value
          setSearchKey(value)
          searchMetricDebounce()
        }}
      />
      <div className="flex-1 min-h-0">
        {loadStatus === LoadStatus.Normal ? (
          <List
            rowComponent={getRow}
            rowProps={{
              data: data,
            }}
            rowHeight={49}
            rowCount={data.length}
            onScroll={(params: any) => {
              handleScroll(params, {
                listHeight: 49,
                itemSize: 49,
                dataLength: data.length,
              })
            }}
          />
        ) : (
          <div className="h-full flex items-center justify-center absolute inset-0">
            {renderStateContent()}
          </div>
        )}
      </div>
    </div>
  )
}

export default MetricList
