/**
 * 开发环境下观测 Cumulative Layout Shift (CLS)
 * 在控制台输出每次布局偏移及最终 CLS，便于定位问题
 */
export function observeCLS(): void {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return

  let clsValue = 0
  let sessionCount = 0

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const e = entry as PerformanceEntry & {
        hadRecentInput?: boolean
        value?: number
        sources?: ReadonlyArray<{ node?: Node; previousRect: DOMRectReadOnly; currentRect: DOMRectReadOnly }>
      }
      if (!e.hadRecentInput && e.value !== undefined) {
        clsValue += e.value
        sessionCount += 1
        const severity = e.value >= 0.25 ? '🔴' : e.value >= 0.1 ? '🟠' : '🟢'
        console.log(
          `[CLS] ${severity} 偏移 #${sessionCount} value=${e.value.toFixed(4)} 累计 CLS=${clsValue.toFixed(4)}`,
          e,
        )
        if (e.sources?.length) {
          e.sources.forEach((src, i) => {
            const el = src.node as Element | undefined
            const info = el
              ? {
                  index: i + 1,
                  tag: el.tagName,
                  id: el.id || undefined,
                  className: el.className || undefined,
                  previousRect: { x: src.previousRect.x, y: src.previousRect.y, width: src.previousRect.width, height: src.previousRect.height },
                  currentRect: { x: src.currentRect.x, y: src.currentRect.y, width: src.currentRect.width, height: src.currentRect.height },
                }
              : { index: i + 1, node: null, previousRect: src.previousRect, currentRect: src.currentRect }
            console.log(`[CLS] source #${info.index}`, info)
          })
        }
      }
    }
  })

  try {
    observer.observe({ type: 'layout-shift', buffered: true })
    console.log('[CLS] 已开启观测，在页面内操作/滚动后可在控制台查看布局偏移与累计 CLS')
  } catch {
    // 部分环境不支持 layout-shift
  }

  // 页面卸载或隐藏时输出最终 CLS
  const reportFinal = () => {
    if (sessionCount > 0) {
      console.log(`[CLS] 本次会话结束 — 偏移次数: ${sessionCount}, 最终 CLS: ${clsValue.toFixed(4)}`)
    }
  }
  window.addEventListener('pagehide', reportFinal)
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') reportFinal()
  })
}
