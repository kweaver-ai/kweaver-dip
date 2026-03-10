/**
 * 应用基础路径配置
 * 根据部署环境配置基础路径，默认为 /dip-hub
 *
 * 配置方式：
 * 1. 通过环境变量 PUBLIC_PATH（在构建时通过 rsbuild.config.ts 读取，并注入到 window.__DIP_HUB_BASE_PATH__）
 * 2. 通过 rsbuild.config.ts 中的 define 配置（推荐方式）
 * 3. 默认值：/dip-hub
 *
 * 注意：使用项目特定的变量名 __DIP_HUB_BASE_PATH__ 避免与其他项目（特别是微前端应用）冲突
 */
// 从 window.__DIP_HUB_BASE_PATH__ 读取（构建时注入）或使用默认值
declare global {
  interface Window {
    __DIP_HUB_BASE_PATH__?: string
  }
}

export const BASE_PATH =
  typeof window !== 'undefined' && window.__DIP_HUB_BASE_PATH__ !== undefined
    ? window.__DIP_HUB_BASE_PATH__
    : '/dip-hub'

/**
 * 规范化路径：确保路径以 / 开头，但不以 / 结尾（除了根路径）
 */
export function normalizePath(path: string): string {
  let tempPath = path
  // 移除尾部斜杠（根路径除外）
  if (tempPath !== '/' && tempPath.endsWith('/')) {
    tempPath = tempPath.slice(0, -1)
  }
  // 确保以 / 开头
  if (!tempPath.startsWith('/')) {
    tempPath = `/${tempPath}`
  }
  return tempPath
}

/**
 * 获取完整路径（基础路径 + 相对路径）
 * @param path 相对路径（如 /login, /app-store）
 * @returns 完整路径（如 /dip-hub/login, /dip-hub/app-store）
 */
export function getFullPath(path: string): string {
  const normalizedBase = normalizePath(BASE_PATH)
  const normalizedPath = normalizePath(path)

  // 如果基础路径是根路径，直接返回路径
  if (normalizedBase === '/') {
    return normalizedPath
  }

  // 拼接路径
  return normalizedBase + normalizedPath
}
