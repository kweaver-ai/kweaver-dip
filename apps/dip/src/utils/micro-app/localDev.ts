/**
 * 微应用本地调试工具
 *
 * 在开发环境下，允许通过 localStorage 配置覆盖微应用的 entry URL
 * 方便其他部门的微应用进行本地调试
 *
 * 使用方法：
 * 1. 在浏览器控制台执行：
 *    localStorage.setItem('DIP_HUB_LOCAL_DEV_MICRO_APPS', JSON.stringify({
 *      'micro-app-name': 'http://localhost:8081'
 *    }))
 *
 * 2. 或者通过浏览器开发者工具 -> Application -> Local Storage 手动设置
 *
 * 配置格式：
 * {
 *   "micro-app-name-1": "http://localhost:8081",
 *   "micro-app-name-2": "http://localhost:8082"
 * }
 */

const LOCAL_DEV_STORAGE_KEY = 'DIP_HUB_LOCAL_DEV_MICRO_APPS'

/**
 * 获取本地调试配置
 * @returns 本地调试配置对象，key 为微应用名称，value 为本地 entry URL
 */
function getLocalDevConfig(): Record<string, string> {
  try {
    const configStr = localStorage.getItem(LOCAL_DEV_STORAGE_KEY)
    if (!configStr) {
      return {}
    }
    const config = JSON.parse(configStr)
    if (typeof config !== 'object' || config === null) {
      console.log('[本地调试] 配置格式错误，应为对象格式')
      return {}
    }
    return config
  } catch (err) {
    console.log('[本地调试] 读取配置失败:', err)
    return {}
  }
}

/**
 * 获取微应用的 entry URL，支持本地调试覆盖
 * @param microAppName 微应用名称
 * @param defaultEntry 默认 entry URL（从后端配置获取）
 * @returns 实际使用的 entry URL
 */
export function getMicroAppEntry(microAppName: string, defaultEntry: string): string {
  const localDevConfig = getLocalDevConfig()
  const localEntry = localDevConfig[microAppName]

  if (localEntry) {
    console.log(
      `[本地调试] 微应用 "${microAppName}" 使用本地入口:`,
      localEntry,
      '(默认:',
      defaultEntry,
      ')',
    )
    return localEntry
  }

  return defaultEntry
}

/**
 * 设置微应用的本地调试入口
 * @param microAppName 微应用名称
 * @param localEntry 本地 entry URL（如 'http://localhost:8081'）
 */
export function setLocalDevEntry(microAppName: string, localEntry: string): void {
  try {
    const config = getLocalDevConfig()
    config[microAppName] = localEntry
    localStorage.setItem(LOCAL_DEV_STORAGE_KEY, JSON.stringify(config))
    console.log(
      `[本地调试] 已设置微应用 "${microAppName}" 的本地入口:`,
      localEntry,
      '请刷新页面使配置生效',
    )
  } catch (err) {
    console.log('[本地调试] 设置配置失败:', err)
  }
}

/**
 * 移除微应用的本地调试入口
 * @param microAppName 微应用名称
 */
export function removeLocalDevEntry(microAppName: string): void {
  try {
    const config = getLocalDevConfig()
    delete config[microAppName]
    localStorage.setItem(LOCAL_DEV_STORAGE_KEY, JSON.stringify(config))
    console.log(`[本地调试] 已移除微应用 "${microAppName}" 的本地入口配置，请刷新页面使配置生效`)
  } catch (err) {
    console.log('[本地调试] 移除配置失败:', err)
  }
}

/**
 * 清除所有本地调试配置
 */
export function clearLocalDevConfig(): void {
  try {
    localStorage.removeItem(LOCAL_DEV_STORAGE_KEY)
    console.log('[本地调试] 已清除所有本地调试配置，请刷新页面使配置生效')
  } catch (err) {
    console.log('[本地调试] 清除配置失败:', err)
  }
}

/**
 * 获取所有本地调试配置
 * @returns 本地调试配置对象
 */
export function getAllLocalDevConfig(): Record<string, string> {
  return getLocalDevConfig()
}
