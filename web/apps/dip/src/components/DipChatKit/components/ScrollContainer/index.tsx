import clsx from 'clsx'
import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react'
import styles from './index.module.less'
import type { ScrollContainerProps, ScrollContainerRef } from './types'
import { isScrollAtBottom } from './utils'

const ScrollContainer = forwardRef<ScrollContainerRef, ScrollContainerProps>(
  ({ className, children, onReachBottomChange, onUserScrollUp, onScroll }, ref) => {
    const scrollElementRef = useRef<HTMLDivElement | null>(null)

    const refMethods: ScrollContainerRef = useMemo(() => {
      return {
        scrollToBottom: (behavior = 'auto') => {
          const target = scrollElementRef.current
          if (!target) return
          target.scrollTo({
            top: target.scrollHeight,
            behavior,
          })
        },
        isAtBottom: () => {
          const target = scrollElementRef.current
          if (!target) return true
          return isScrollAtBottom(target)
        },
        getElement: () => scrollElementRef.current,
      }
    }, [])

    useImperativeHandle(ref, () => refMethods, [refMethods])

    return (
      <div className={clsx('ScrollContainer', styles.root, className)}>
        <div
          ref={scrollElementRef}
          className={styles.scrollArea}
          onWheel={(event) => {
            const target = scrollElementRef.current
            if (event.deltaY < 0 && target && target.scrollHeight > target.clientHeight) {
              onUserScrollUp?.()
            }
          }}
          onScroll={(event) => {
            const target = scrollElementRef.current
            if (target) {
              onReachBottomChange?.(isScrollAtBottom(target))
            }
            onScroll?.(event)
          }}
        >
          {children}
        </div>
      </div>
    )
  },
)

ScrollContainer.displayName = 'ScrollContainer'

export default ScrollContainer
