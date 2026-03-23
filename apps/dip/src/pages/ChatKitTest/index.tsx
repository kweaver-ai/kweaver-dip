import clsx from 'clsx'
import { memo, useMemo } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import DipChatKit from '@/components/DipChatKit'
import type { DipChatKitAttachment } from '@/components/DipChatKit/types'
import styles from './index.module.less'
import type { BuildDefaultMessageTurns, ChatKitTestLocationState } from './types'

const buildDefaultMessageTurns: BuildDefaultMessageTurns = (submitData) => {
  if (!submitData?.content) {
    return []
  }

  const questionAttachments: DipChatKitAttachment[] = submitData.files.map((file) => ({
    uid: `${file.name}_${file.size}_${file.lastModified}`,
    name: file.name,
    size: file.size,
    type: file.type,
    file,
  }))

  return [
    {
      id: `turn_init_${Date.now()}`,
      question: submitData.content,
      questionEmployees: submitData.employees,
      pendingSend: true,
      questionAttachments,
      answerMarkdown: '',
      answerLoading: false,
      answerStreaming: false,
      createdAt: new Date().toISOString(),
    },
  ]
}

const ChatKitTest = () => {
  const location = useLocation() as ChatKitTestLocationState
  const [searchParams] = useSearchParams()
  const employeeFromQuery = searchParams.get('employee')

  const defaultMessageTurns = useMemo(() => {
    return buildDefaultMessageTurns(location.state?.submitData)
  }, [location.state])

  const defaultEmployeeValue = useMemo(() => {
    if (employeeFromQuery) {
      return employeeFromQuery
    }
    return location.state?.submitData?.employees?.[0]?.value
  }, [employeeFromQuery, location.state])

  return (
    <div className={clsx('ChatKitTest', styles.page)}>
      <div className={styles.chatKitWrap}>
        <DipChatKit showHeader={false} defaultMessageTurns={defaultMessageTurns} defaultEmployeeValue={defaultEmployeeValue} />
      </div>
    </div>
  )
}

export default memo(ChatKitTest)
