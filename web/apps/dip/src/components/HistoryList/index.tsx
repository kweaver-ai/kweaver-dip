import { Button, Modal, Spin } from 'antd'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { List } from 'react-window'
import { type DigitalHuman, getDigitalHumanList } from '@/apis'
import { getDigitalHumanSessionsList, type SessionSummary } from '@/apis/dip-studio/sessions'
import Empty from '@/components/Empty'
import ScrollBarContainer from '@/components/ScrollBarContainer'
import { useUserHistoryStore } from '@/stores/userHistoryStore'
import PlanListItem from './HistoryListItem'
import { HISTORY_LIST_USE_MOCK, mockGetDigitalHumanSessionsList } from './mockHistoryList'
import { HISTORY_LIST_ROW_HEIGHT, type HistoryListProps } from './types'
import { getSessionTitle } from './utils'

function getDigitalHumanIdFromSessionKey(sessionKey: string): string {
  // sessionKey format: agent:<digitalHumanId>:...
  return sessionKey.split('agent:')[1]?.split(':')[0] ?? ''
}

function HistoryListInner({
  source,
  pageSize: _pageSize,
  className,
  onHistoryClick,
  searchValue,
}: HistoryListProps) {
  const globalSessions = useUserHistoryStore((state) => state.sessions)
  const globalLoading = useUserHistoryStore((state) => state.loading)
  const globalError = useUserHistoryStore((state) => state.error)
  const fetchGlobalSessions = useUserHistoryStore((state) => state.fetchSessions)
  const deleteHistorySession = useUserHistoryStore((state) => state.deleteHistorySession)

  const [digitalHumanSessions, setDigitalHumanSessions] = useState<SessionSummary[]>([])
  const [digitalHumanLoading, setDigitalHumanLoading] = useState(false)
  const [digitalHumanError, setDigitalHumanError] = useState<unknown>(null)
  const isGlobalMode = source.mode === 'global'

  const [digitalHumanNameById, setDigitalHumanNameById] = useState<Record<string, string>>({})

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const list: DigitalHuman[] = await getDigitalHumanList()
        if (cancelled) return
        const map: Record<string, string> = {}
        list.forEach((item) => {
          map[item.id] = item.name
        })
        setDigitalHumanNameById(map)
      } catch (e) {
        if (cancelled) return
        setDigitalHumanNameById({})
        console.error('Failed to fetch digital human list:', e)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const handleDelete = useCallback(
    (session: SessionSummary) => {
      Modal.confirm({
        title: '确认删除',
        content: '删除后将无法恢复，是否继续？',
        okText: '确定',
        okType: 'primary',
        okButtonProps: { danger: true },
        cancelText: '取消',
        onOk: async () => {
          await deleteHistorySession(session.key)
        },
      })
    },
    [deleteHistorySession],
  )

  const fetchData = useCallback(async () => {
    setDigitalHumanError(null)
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
    } catch (error) {
      setDigitalHumanSessions([])
      setDigitalHumanError(error)
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
      const digitalHumanId = getDigitalHumanIdFromSessionKey(session.key)
      const digitalHumanName = digitalHumanId ? digitalHumanNameById[digitalHumanId] : undefined
      return (
        <div style={style} className="box-border px-6 pb-3 mx-auto">
          <PlanListItem
            session={session}
            onClick={onHistoryClick}
            onDelete={handleDelete}
            digitalHumanName={digitalHumanName}
          />
        </div>
      )
    },
    [digitalHumanNameById, handleDelete, onHistoryClick],
  )

  const initialLoading = isGlobalMode ? globalLoading : digitalHumanLoading

  const listData = isGlobalMode ? globalSessions : digitalHumanSessions
  const trimmedSearchValue = searchValue?.trim() ?? ''
  const filteredListData = useMemo(() => {
    if (!trimmedSearchValue) return listData
    return listData.filter((session) =>
      getSessionTitle(session)
        ?.toLowerCase()
        .includes(trimmedSearchValue?.toLowerCase() ?? ''),
    )
  }, [listData, trimmedSearchValue])

  const isNoDigitalHumanId = source.mode === 'digitalHuman' && !source.digitalHumanId.trim()

  const isError = isGlobalMode ? !!globalError : !!digitalHumanError
  const handleRetry = () => {
    if (isGlobalMode) {
      void fetchGlobalSessions()
      return
    }
    void fetchData()
  }

  const stateContent = (() => {
    if (isNoDigitalHumanId) {
      return <Empty title="暂无数据" />
    }

    if (initialLoading) {
      return <Spin />
    }

    if (isError) {
      return (
        <Empty type="failed" title="加载失败">
          <Button className="mt-1" type="primary" onClick={handleRetry}>
            重试
          </Button>
        </Empty>
      )
    }

    if (filteredListData.length === 0) {
      if (trimmedSearchValue) {
        return <Empty type="search" desc="抱歉，没有找到相关内容" />
      }
      return <Empty title="暂无数据" />
    }

    return null
  })()

  return (
    <div className={`flex flex-1 min-h-0 flex-col overflow-hidden ${className ?? ''}`}>
      <div className="flex min-h-0 flex-1 flex-col">
        {stateContent ? (
          <div className="absolute inset-0 flex items-center justify-center px-6 min-h-[300px]">
            {stateContent}
          </div>
        ) : null}

        {stateContent ? null : (
          <div className="min-h-0 flex-1">
            <List
              tagName={ScrollBarContainer as any}
              className="h-full w-full"
              rowComponent={getRow}
              rowCount={filteredListData.length}
              rowHeight={HISTORY_LIST_ROW_HEIGHT}
              rowProps={{
                data: filteredListData,
              }}
              style={{ height: '100%', width: '100%' }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

const HistoryList = memo(HistoryListInner)
export default HistoryList
