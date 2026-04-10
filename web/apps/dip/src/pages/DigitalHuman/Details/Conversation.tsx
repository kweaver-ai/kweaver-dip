import DipChatKit from '@/components/DipChatKit'
import useSyncHistorySessions from '@/hooks/useSyncHistorySessions'

/** 新会话页面 */
const Conversation = ({ digitalHumanId }: { digitalHumanId: string }) => {
  useSyncHistorySessions()
  return (
    <div className="h-full w-full box-border">
      <div className="h-full min-h-0">
        <DipChatKit assignEmployeeValue={digitalHumanId} showHeader={false} />
      </div>
    </div>
  )
}

export default Conversation
