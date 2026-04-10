import type React from 'react'

export interface ScrollContainerProps {
  className?: string
  children: React.ReactNode
  onReachBottomChange?: (isAtBottom: boolean) => void
  onUserScrollUp?: () => void
  onScroll?: (event: React.UIEvent<HTMLDivElement>) => void
}

export interface ScrollContainerRef {
  scrollToBottom: (behavior?: ScrollBehavior) => void
  isAtBottom: () => boolean
  getElement: () => HTMLDivElement | null
}
