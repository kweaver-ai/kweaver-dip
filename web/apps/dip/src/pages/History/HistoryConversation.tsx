import { memo, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import type { SessionSummary } from '@/apis/dip-studio/sessions'
import { getSessionDetail } from '@/apis/dip-studio/sessions'
import DipChatKit from '@/components/DipChatKit'
import useSyncHistorySessions from '@/hooks/useSyncHistorySessions'
import { useBreadcrumbDetailStore } from '@/stores'
import { useUserHistoryStore } from '@/stores/userHistoryStore'

function getSessionDisplayTitle(session: SessionSummary): string {
  return session.derivedTitle?.trim() || session.key || ''
}

const HistoryConversation = () => {
  useSyncHistorySessions()

  const params = useParams()
  const sessionKey = params.sessionKey
  const digitalHumanId = sessionKey?.split('agent:')[1]?.split(':')[0]
  const sessions = useUserHistoryStore((s) => s.sessions)
  const setDetailBreadcrumb = useBreadcrumbDetailStore((s) => s.setDetailBreadcrumb)

  useEffect(() => {
    if (!sessionKey) {
      setDetailBreadcrumb(null)
      return
    }
    const fromList = sessions.find((s) => s.key === sessionKey)
    if (fromList) {
      setDetailBreadcrumb({
        routeKey: 'history-item',
        title: getSessionDisplayTitle(fromList),
      })
      return () => setDetailBreadcrumb(null)
    }
    let cancelled = false
    void (async () => {
      try {
        const detail = await getSessionDetail(sessionKey)
        if (!cancelled) {
          setDetailBreadcrumb({
            routeKey: 'history-item',
            title: getSessionDisplayTitle(detail),
          })
        }
      } catch {
        if (!cancelled) {
          setDetailBreadcrumb(null)
        }
      }
    })()
    return () => {
      cancelled = true
      setDetailBreadcrumb(null)
    }
  }, [sessionKey, sessions, setDetailBreadcrumb])

  return (
    <div className="h-full w-full box-border">
      <div className="h-full min-h-0">
        <DipChatKit sessionId={sessionKey} assignEmployeeValue={digitalHumanId} />
      </div>
    </div>
  )
}

export default memo(HistoryConversation)
