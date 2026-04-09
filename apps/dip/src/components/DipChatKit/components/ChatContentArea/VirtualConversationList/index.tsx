import { Skeleton } from 'antd'
import clsx from 'clsx'
import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef } from 'react'
import {
  type FollowOutputCallback,
  type ListProps,
  type ScrollerProps,
  Virtuoso,
  type VirtuosoHandle,
} from 'react-virtuoso'
import type { DipChatKitMessageTurn } from '../../../types'
import { isScrollAtBottom } from '../../ScrollContainer/utils'
import ConversationTurn from '../ConversationTurn'
import styles from './index.module.less'
import type { VirtualConversationListProps, VirtualConversationListRef } from './types'

interface VirtualConversationListContext {
  loading: boolean
  emptyStateText: string
  onUserScrollUp?: () => void
  setScrollerElement: (element: HTMLDivElement | null) => void
}

const VirtuosoScroller = forwardRef<
  HTMLDivElement,
  ScrollerProps & { context: VirtualConversationListContext }
>(({ children, context, style, ...restProps }, ref) => {
  const setRefs = (element: HTMLDivElement | null) => {
    context.setScrollerElement(element)

    if (typeof ref === 'function') {
      ref(element)
      return
    }

    if (ref) {
      ref.current = element
    }
  }

  return (
    <div
      {...restProps}
      ref={setRefs}
      className={clsx('VirtualConversationListScrollArea', styles.scrollArea)}
      style={style}
      onWheel={(event) => {
        const target = event.currentTarget
        if (event.deltaY >= 0) return
        if (target.scrollHeight <= target.clientHeight) return
        context.onUserScrollUp?.()
      }}
    >
      {children}
    </div>
  )
})

VirtuosoScroller.displayName = 'VirtuosoScroller'

const VirtuosoList = forwardRef<
  HTMLDivElement,
  ListProps & { context: VirtualConversationListContext }
>(({ children, style, ...restProps }, ref) => {
  return (
    <div {...restProps} ref={ref} className={styles.list} style={style}>
      {children}
    </div>
  )
})

VirtuosoList.displayName = 'VirtuosoList'

const VirtuosoEmptyPlaceholder = ({ context }: { context: VirtualConversationListContext }) => {
  if (context.loading) {
    return (
      <div className={styles.sessionLoadingSkeleton}>
        <Skeleton
          active
          title={false}
          paragraph={{ rows: 4, width: ['46%', '92%', '82%', '70%'] }}
        />
        <Skeleton
          active
          title={false}
          paragraph={{ rows: 5, width: ['38%', '88%', '83%', '72%', '48%'] }}
        />
        <Skeleton active title={false} paragraph={{ rows: 3, width: ['42%', '96%', '66%'] }} />
      </div>
    )
  }

  return <div className={styles.emptyState}>{context.emptyStateText}</div>
}

const VirtuosoHeader = () => {
  return <div className={styles.topSpacer} />
}

const VirtuosoFooter = () => {
  return <div className={styles.bottomSpacer} />
}

const normalizeBehavior = (behavior: ScrollBehavior): 'auto' | 'smooth' => {
  return behavior === 'smooth' ? 'smooth' : 'auto'
}

const VirtualConversationList = forwardRef<
  VirtualConversationListRef,
  VirtualConversationListProps
>(
  (
    {
      className,
      messageTurns,
      loading,
      emptyStateText,
      autoScrollEnabled,
      onUserScrollUp,
      onReachBottomChange,
      onEditQuestion,
      onCopyQuestion,
      onCopyAnswer,
      onRegenerateAnswer,
      onOpenPreview,
    },
    ref,
  ) => {
    const virtuosoRef = useRef<VirtuosoHandle | null>(null)
    const scrollerElementRef = useRef<HTMLDivElement | null>(null)

    const refMethods: VirtualConversationListRef = useMemo(() => {
      return {
        scrollToBottom: (behavior = 'auto') => {
          virtuosoRef.current?.scrollToIndex({
            index: 'LAST',
            align: 'end',
            behavior: normalizeBehavior(behavior),
          })
        },
        isAtBottom: () => {
          const target = scrollerElementRef.current
          if (!target) return true
          return isScrollAtBottom(target)
        },
        getElement: () => scrollerElementRef.current,
      }
    }, [])

    useImperativeHandle(ref, () => refMethods, [refMethods])

    const setScrollerElement = useCallback((element: HTMLDivElement | null) => {
      scrollerElementRef.current = element
    }, [])

    const context = useMemo<VirtualConversationListContext>(() => {
      return {
        loading,
        emptyStateText,
        onUserScrollUp,
        setScrollerElement,
      }
    }, [emptyStateText, loading, onUserScrollUp, setScrollerElement])

    const components = useMemo(() => {
      return {
        Scroller: VirtuosoScroller,
        List: VirtuosoList,
        EmptyPlaceholder: VirtuosoEmptyPlaceholder,
        Header: VirtuosoHeader,
        Footer: VirtuosoFooter,
      }
    }, [])

    const followOutput = useCallback<FollowOutputCallback>(
      (isAtBottom) => {
        if (!autoScrollEnabled) return false
        if (!isAtBottom) return false
        return 'auto'
      },
      [autoScrollEnabled],
    )

    const itemContent = useCallback(
      (index: number, turn: DipChatKitMessageTurn) => {
        const isLatestAnswerTurn = index === messageTurns.length - 1
        return (
          <div className={styles.turnItem}>
            <ConversationTurn
              turn={turn}
              isLatestAnswerTurn={isLatestAnswerTurn}
              onEditQuestion={onEditQuestion}
              onCopyQuestion={onCopyQuestion}
              onCopyAnswer={onCopyAnswer}
              onRegenerateAnswer={onRegenerateAnswer}
              onOpenPreview={onOpenPreview}
            />
          </div>
        )
      },
      [
        messageTurns.length,
        onCopyAnswer,
        onCopyQuestion,
        onEditQuestion,
        onOpenPreview,
        onRegenerateAnswer,
      ],
    )

    return (
      <div className={clsx('VirtualConversationList', styles.root, className)}>
        <Virtuoso<DipChatKitMessageTurn, VirtualConversationListContext>
          ref={virtuosoRef}
          className={styles.virtuoso}
          data={messageTurns}
          context={context}
          components={components}
          followOutput={followOutput}
          computeItemKey={(index, item) => item.id || index}
          atBottomStateChange={(isAtBottom) => {
            onReachBottomChange?.(isAtBottom)
          }}
          itemContent={itemContent}
        />
      </div>
    )
  },
)

VirtualConversationList.displayName = 'VirtualConversationList'

export default VirtualConversationList
