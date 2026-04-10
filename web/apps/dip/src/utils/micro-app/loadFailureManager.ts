/**
 * 微应用加载失败状态管理器
 * 用于记录微应用加载失败的状态，避免无限重试导致循环刷新
 * 使用 sessionStorage 持久化，即使页面刷新也能保留失败状态
 */

interface LoadFailureInfo {
  /** 失败时间戳 */
  failedAt: number
  /** 失败原因 */
  error: string // 序列化为字符串
  /** 微应用名称 */
  appName: string
  /** 微应用入口 */
  entry: string
}

/** sessionStorage key */
const STORAGE_KEY = 'DIP_HUB_MICRO_APP_FAILURES'
/** 页面加载时间戳 key */
const PAGE_LOAD_TIME_KEY = 'DIP_HUB_PAGE_LOAD_TIME'

class MicroAppLoadFailureManager {
  /** 失败记录 Map，key 为 appId */
  private failures = new Map<string, LoadFailureInfo>()

  /** 失败记录的过期时间（毫秒），默认 5 分钟 */
  private readonly EXPIRY_TIME = 5 * 60 * 1000

  /** 当前页面加载时间戳 */
  private pageLoadTime: number

  constructor() {
    // 检测是否是页面刷新
    this.pageLoadTime = this.detectPageLoad()
    // 从 sessionStorage 恢复失败记录
    this.loadFromStorage()
  }

  /**
   * 检测页面加载类型
   * @returns 页面加载时间戳
   */
  private detectPageLoad(): number {
    const now = Date.now()
    const storedLoadTime = sessionStorage.getItem(PAGE_LOAD_TIME_KEY)

    if (storedLoadTime) {
      const previousLoadTime = parseInt(storedLoadTime, 10)
      const timeSinceLastLoad = now - previousLoadTime

      // 如果距离上次加载时间超过 1 秒，认为是新页面加载（而不是组件重新渲染）
      if (timeSinceLastLoad > 1000) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[微应用加载失败管理器] 检测到页面刷新，时间间隔: ${timeSinceLastLoad}ms`)
        }
        // 更新页面加载时间戳
        sessionStorage.setItem(PAGE_LOAD_TIME_KEY, String(now))
        return now
      } else {
        // 很短时间内，认为是组件重新渲染，保持原有时间戳
        return previousLoadTime
      }
    } else {
      // 首次加载
      sessionStorage.setItem(PAGE_LOAD_TIME_KEY, String(now))
      return now
    }
  }

  /**
   * 从 sessionStorage 加载失败记录
   */
  private loadFromStorage(): void {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored) as Record<string, LoadFailureInfo>
        // 过滤过期记录
        const now = Date.now()
        for (const [appId, failure] of Object.entries(data)) {
          if (now - failure.failedAt <= this.EXPIRY_TIME) {
            this.failures.set(appId, failure)
          }
        }
        // 如果有过期记录被过滤，更新 storage
        if (Object.keys(data).length !== this.failures.size) {
          this.saveToStorage()
        }
        if (process.env.NODE_ENV === 'development' && this.failures.size > 0) {
          console.log(
            `[微应用加载失败管理器] 从 sessionStorage 恢复了 ${this.failures.size} 条失败记录`,
          )
        }
      }
    } catch (err) {
      console.log('[微应用加载失败管理器] 从 sessionStorage 加载失败记录失败:', err)
    }
  }

  /**
   * 保存失败记录到 sessionStorage
   */
  private saveToStorage(): void {
    try {
      const data: Record<string, LoadFailureInfo> = {}
      this.failures.forEach((failure, appId) => {
        data[appId] = failure
      })
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (err) {
      console.log('[微应用加载失败管理器] 保存失败记录到 sessionStorage 失败:', err)
    }
  }

  /**
   * 记录微应用加载失败
   */
  recordFailure(appId: string, appName: string, entry: string, error: Error | string): void {
    // 将 Error 对象序列化为字符串
    const errorStr = error instanceof Error ? error.message || error.toString() : String(error)

    this.failures.set(appId, {
      failedAt: Date.now(),
      error: errorStr,
      appName,
      entry,
    })

    // 保存到 sessionStorage
    this.saveToStorage()

    if (process.env.NODE_ENV === 'development') {
      console.log(`[微应用加载失败] 已记录失败状态: ${appName} (${appId})`, error)
    }
  }

  /**
   * 检查微应用是否已经失败过
   */
  hasFailed(appId: string): boolean {
    const failure = this.failures.get(appId)
    if (!failure) {
      return false
    }

    // 检查是否过期
    const now = Date.now()
    if (now - failure.failedAt > this.EXPIRY_TIME) {
      // 过期了，清除记录
      this.failures.delete(appId)
      return false
    }

    return true
  }

  /**
   * 获取失败信息
   */
  getFailureInfo(appId: string): LoadFailureInfo | null {
    const failure = this.failures.get(appId)
    if (!failure) {
      return null
    }

    // 检查是否过期
    const now = Date.now()
    if (now - failure.failedAt > this.EXPIRY_TIME) {
      this.failures.delete(appId)
      return null
    }

    return failure
  }

  /**
   * 清除失败记录（用于手动重试）
   */
  clearFailure(appId: string): void {
    this.failures.delete(appId)
    this.saveToStorage()
    if (process.env.NODE_ENV === 'development') {
      console.log(`[微应用加载失败] 已清除失败状态: ${appId}`)
    }
  }

  /**
   * 清除所有失败记录
   */
  clearAll(): void {
    this.failures.clear()
    sessionStorage.removeItem(STORAGE_KEY)
  }

  /**
   * 获取当前页面加载时间戳（用于判断是否是页面刷新）
   */
  getPageLoadTime(): number {
    return this.pageLoadTime
  }

  /**
   * 判断是否是页面刷新（而不是组件重新渲染）
   */
  isPageReload(): boolean {
    const storedLoadTime = sessionStorage.getItem(PAGE_LOAD_TIME_KEY)
    if (!storedLoadTime) {
      return true // 首次加载
    }
    const previousLoadTime = parseInt(storedLoadTime, 10)
    return this.pageLoadTime !== previousLoadTime
  }
}

// 单例实例
export const microAppLoadFailureManager = new MicroAppLoadFailureManager()
