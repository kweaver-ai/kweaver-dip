import { Button, message, Spin, Tooltip } from 'antd'
import clsx from 'clsx'
import { throttle } from 'lodash'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import intl from 'react-intl-universal'
import { List } from 'react-window'
import { getMetricModalGroups, type MetricModalGroupType } from '@/apis'
import Empty from '@/components/Empty'
import { LoadStatus } from '@/types/enums'
import { useMetricSelectorStore } from './store'
import { MetricConstants } from './types'

// 每一页获取的数量
const limit = 20

const GroupList = () => {
  const { metricSelectorStore, setSelectedGroup } = useMetricSelectorStore()

  // 懒加载的offset
  const offsetRef = useRef<number>(0)
  // 是否还有数据未加载完
  const hasMoreRef = useRef<boolean>(true)
  // 是否正在加载更多
  const isLoadingMoreRef = useRef<boolean>(false)

  // 加载数据的状态
  const [loadStatus, setLoadStatus] = useState<LoadStatus>(LoadStatus.Loading)
  // 分组数据
  const [data, setData] = useState<MetricModalGroupType[]>([])
  // 界面上显示的数据列表，第一位永远是【所有指标模型】
  const displayData = useMemo(
    () => [metricSelectorStore.allMetricGroup, ...data],
    [metricSelectorStore.allMetricGroup, data],
  )

  // 获取分组数据
  const fetchGroups = useCallback(async () => {
    if (!hasMoreRef.current) return

    try {
      // 只有第一次加载，才设置loadStatus
      if (!isLoadingMoreRef.current) {
        setLoadStatus(LoadStatus.Loading)
      }

      const { entries } = await getMetricModalGroups({
        offset: offsetRef.current,
        limit,
      })
      // 设置offset
      offsetRef.current += entries.length
      // 设置hasMore
      hasMoreRef.current = entries.length === limit

      if (isLoadingMoreRef.current) {
        // 加载更多：在末尾添加数据
        setData((prev) => [...prev, ...entries])
      } else {
        setData(entries)
        setLoadStatus(LoadStatus.Normal)
        // 默认选中全部指标组
        setSelectedGroup(metricSelectorStore.allMetricGroup)
      }
    } catch (ex: any) {
      if (ex?.description) {
        message.error(ex.description)
      }

      // 只有第一次加载的时候，才设置loadStatus
      if (!isLoadingMoreRef.current) {
        setLoadStatus(LoadStatus.Failed)
      }
    } finally {
      isLoadingMoreRef.current = false
    }
  }, [metricSelectorStore.allMetricGroup, setSelectedGroup])

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
          fetchGroups()
        }
      },
      150,
    )
  }, [fetchGroups])

  const getRow = ({ index, style, data }: any) => {
    const item = data[index]
    const name = item.name || intl.get('dataAgent.ungrouped')

    return (
      <button
        type="button"
        style={style}
        className={clsx(
          'cursor-pointer flex items-center pl-5 hover:bg-[rgba(166,169,181,0.11)]',
          metricSelectorStore.selectedGroup?.id === item.id && 'bg-[#e7f2ff] hover:!bg-[#e7f2ff]',
        )}
        onClick={() => {
          setSelectedGroup(item)
        }}
      >
        <Tooltip title={name}>
          <span className="truncate">{name}</span>
        </Tooltip>
        {MetricConstants.MetricModelCount in item && (
          <span className="pr-[10px] whitespace-pre">{` (${item.metric_model_count})`}</span>
        )}
      </button>
    )
  }

  useEffect(() => {
    fetchGroups()
  }, [])

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
          <Button className="mt-1" type="primary" onClick={fetchGroups}>
            重试
          </Button>
        </Empty>
      )
    }

    if (loadStatus === LoadStatus.Empty) {
      return <Empty title="暂无数据" />
    }

    return null
  }

  return (
    <div className="flex flex-col h-full relative">
      <div className="h-9 leading-9 pl-[10px]">{intl.get('dataAgent.selectGroup')}</div>

      <div className="flex-1 min-h-0">
        {loadStatus === LoadStatus.Normal ? (
          <List
            rowComponent={getRow}
            rowProps={{
              data: displayData,
            }}
            rowHeight={36}
            rowCount={displayData.length}
            onScroll={(params: any) => {
              handleScroll(params, {
                listHeight: 36,
                itemSize: 36,
                dataLength: displayData.length,
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

export default GroupList
