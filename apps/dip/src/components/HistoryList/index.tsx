import { Spin } from 'antd'
import { memo, useCallback, useEffect, useState } from 'react'
import { List } from 'react-window'
import {
  getDigitalHumanSessionsList,
  type SessionSummary,
} from '@/apis/dip-studio/sessions'
import Empty from '@/components/Empty'
import ScrollBarContainer from '@/components/ScrollBarContainer'
import { useUserHistoryStore } from '@/stores/userHistoryStore'
import PlanListItem from './HistoryListItem'
import {
  HISTORY_LIST_USE_MOCK,
  mockGetDigitalHumanSessionsList,
} from './mockHistoryList'
import { HISTORY_LIST_ROW_HEIGHT, type HistoryListProps } from './types'

function HistoryListInner({
  source,
  pageSize: _pageSize,
  className,
  onHistoryClick,
}: HistoryListProps) {
  const globalSessions = useUserHistoryStore((state) => state.sessions)
  const globalLoading = useUserHistoryStore((state) => state.loading)
  const fetchGlobalSessions = useUserHistoryStore((state) => state.fetchSessions)

  const [digitalHumanSessions, setDigitalHumanSessions] = useState<SessionSummary[]>([])
  const [digitalHumanLoading, setDigitalHumanLoading] = useState(false)
  const isGlobalMode = source.mode === 'global'

  const fetchData = useCallback(async () => {
    setDigitalHumanLoading(true)
    try {
      if (source.mode === 'digitalHuman' && !source.digitalHumanId.trim()) {
        setDigitalHumanSessions([])
        setDigitalHumanLoading(false)
        return
      }

      const digitalHumanId = source.mode === 'digitalHuman' ? source.digitalHumanId : ''
      const res = HISTORY_LIST_USE_MOCK
        ? await mockGetDigitalHumanSessionsList(digitalHumanId)
        : await getDigitalHumanSessionsList(digitalHumanId)

      setDigitalHumanSessions(res.sessions)
    } catch {
      setDigitalHumanSessions([])
    } finally {
      setDigitalHumanLoading(false)
    }
  }, [source])

  useEffect(() => {
    if (!isGlobalMode) return
    void fetchGlobalSessions()
  }, [fetchGlobalSessions, isGlobalMode])

  useEffect(() => {
    if (isGlobalMode) return
    void fetchData()
  }, [fetchData, isGlobalMode])

  const getRow = useCallback(
    ({ index, style, data }: any) => {
      const session = data[index] as SessionSummary | undefined
      if (!session) return null
      return (
        <div style={style} className="box-border px-6 pb-3 mx-auto">
          <PlanListItem session={session} onClick={onHistoryClick} />
        </div>
      )
    },
    [onHistoryClick],
  )

  if (source.mode === 'digitalHuman' && !source.digitalHumanId.trim()) {
    return (
      <div className={`flex flex-1 min-h-0 items-center justify-center px-6 ${className ?? ''}`}>
        <Empty title="暂无数据" />
      </div>
    )
  }

  const initialLoading = isGlobalMode ? globalLoading : digitalHumanLoading

  if (initialLoading) {
    return (
      <div className={`flex flex-1 min-h-0 items-center justify-center ${className ?? ''}`}>
        <Spin />
      </div>
    )
  }

  const listData = isGlobalMode ? globalSessions : digitalHumanSessions

  if (listData.length === 0) {
    return (
      <div className={`flex flex-1 min-h-0 items-center justify-center px-6 ${className ?? ''}`}>
        <Empty title="暂无数据" />
      </div>
    )
  }

  return (
    <div className={`flex flex-1 min-h-0 flex-col overflow-hidden ${className ?? ''}`}>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1">
          <List
            tagName={ScrollBarContainer as any}
            className="h-full w-full"
            rowComponent={getRow}
            rowCount={listData.length}
            rowHeight={HISTORY_LIST_ROW_HEIGHT}
            rowProps={{
              data: listData,
            }}
            style={{ height: '100%', width: '100%' }}
          />
        </div>
      </div>
    </div>
  )
}

const HistoryList = memo(HistoryListInner)
export default HistoryList
