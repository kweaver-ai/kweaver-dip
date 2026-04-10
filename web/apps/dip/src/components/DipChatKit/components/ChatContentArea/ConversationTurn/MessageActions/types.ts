import type React from 'react'

export interface MessageAction {
  key: string
  title: string
  icon: React.ReactNode
  disabled?: boolean
  onClick: () => void
}

export interface MessageActionsProps {
  actions: MessageAction[]
  className?: string
}
