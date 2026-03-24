import { memo } from 'react'
import { useParams } from 'react-router-dom'
import DipChatKit from '@/components/DipChatKit'
import useSyncHistorySessions from '@/hooks/useSyncHistorySessions'

const HistoryConversation = () => {
  useSyncHistorySessions()

  const params = useParams()
  const sessionKey = params.sessionKey
  const digitalHumanId = sessionKey?.split('agent:')[1]?.split(':')[0]

  return (
    <div className="h-full w-full box-border">
      <div className="h-full min-h-0">
        <DipChatKit sessionId={sessionKey} assignEmployeeValue={digitalHumanId} />
      </div>
    </div>
  )
}

export default memo(HistoryConversation)
