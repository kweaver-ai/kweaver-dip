import clsx from 'clsx'
import { memo, useMemo } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import DipChatKit from '@/components/DipChatKit'
import styles from './index.module.less'
import type { ChatKitTestLocationState } from './types'

const ChatKitTest = () => {
  const location = useLocation() as ChatKitTestLocationState
  const [searchParams] = useSearchParams()
  const employeeFromQuery = searchParams.get('employee')

  const defaultEmployeeValue = useMemo(() => {
    if (employeeFromQuery) {
      return employeeFromQuery
    }
    return location.state?.submitData?.employees?.[0]?.value
  }, [employeeFromQuery, location.state])

  return (
    <div className={clsx('ChatKitTest', styles.page)}>
      <div className={styles.chatKitWrap}>
        <DipChatKit
          showHeader={false}
          initialSubmitPayload={location.state?.submitData}
          defaultEmployeeValue={defaultEmployeeValue}
        />
      </div>
    </div>
  )
}

export default memo(ChatKitTest)
