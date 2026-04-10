import { Actions, type ActionsProps } from '@ant-design/x'
import { Button, Tooltip } from 'antd'
import clsx from 'clsx'
import type React from 'react'
import styles from './index.module.less'
import type { MessageActionsProps } from './types'

const MessageActions: React.FC<MessageActionsProps> = ({ actions, className }) => {
  const items: ActionsProps['items'] = actions.map((action) => ({
    key: action.key,
    actionRender: () => {
      return (
        <Tooltip title={action.title}>
          <Button
            type="text"
            size="small"
            icon={action.icon}
            aria-label={action.title}
            disabled={action.disabled}
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              action.onClick()
            }}
          />
        </Tooltip>
      )
    },
  }))

  return (
    <div className={clsx('MessageActions', styles.root, className)}>
      <Actions className={styles.actions} items={items} variant="borderless" />
    </div>
  )
}

export default MessageActions
