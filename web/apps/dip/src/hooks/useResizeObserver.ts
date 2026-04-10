import { useEffect, useRef } from 'react'

interface UseResizeObserverOptions {
  target: HTMLElement | null
  onResize: ResizeObserverCallback
  enabled?: boolean
}

const useResizeObserver = ({
  target,
  onResize,
  enabled = true,
}: UseResizeObserverOptions): void => {
  const onResizeRef = useRef(onResize)

  useEffect(() => {
    onResizeRef.current = onResize
  }, [onResize])

  useEffect(() => {
    if (!(target && enabled)) return

    const resizeObserver = new ResizeObserver((entries, observer) => {
      onResizeRef.current(entries, observer)
    })

    resizeObserver.observe(target)

    return () => {
      resizeObserver.disconnect()
    }
  }, [target, enabled])
}

export default useResizeObserver
