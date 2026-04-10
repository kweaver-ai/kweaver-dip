import DipChatKit from '@/components/DipChatKit'

export type TaskConversationProps = {
  digitalHumanId?: string
  sessionId?: string
}

const TaskConversation = ({ digitalHumanId, sessionId }: TaskConversationProps) => {
  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
      <DipChatKit showHeader={false} sessionId={sessionId} assignEmployeeValue={digitalHumanId} />
    </div>
  )
}

export default TaskConversation
