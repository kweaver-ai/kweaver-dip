import { memo, useMemo } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import DipChatKit from '@/components/DipChatKit'
import useSyncHistorySessions from '@/hooks/useSyncHistorySessions'
import type { ConversationLocationState } from './types'

const Conversation = () => {
  useSyncHistorySessions()

  const location = useLocation() as ConversationLocationState
  const [searchParams] = useSearchParams()
  const employeeFromQuery = searchParams.get('employee')

  const defaultEmployeeValue = useMemo(() => {
    if (employeeFromQuery) {
      return employeeFromQuery
    }
    return location.state?.submitData?.employees?.[0]?.value
  }, [employeeFromQuery, location.state])

  return (
    <div className="h-full w-full box-border">
      <div className="h-full min-h-0">
        <DipChatKit
          initialSubmitPayload={location.state?.submitData}
          assignEmployeeValue={defaultEmployeeValue}
        />
      </div>
    </div>
  )
}

export default memo(Conversation)
