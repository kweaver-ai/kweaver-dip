/** 默认语言 */
export const DEFAULT_LOCALE = 'zh-CN'

/**
 * 获取浏览器语言
 * 统一成 xx-XX 形式
 */
export const getNavigatorLanguage = (): string | null => {
  if (typeof navigator === 'undefined') return null

  const lang = navigator.language || (navigator as any).userLanguage
  if (!lang) return null

  const [first, second] = lang.split('-')
  if (!first) return null

  return [first.toLowerCase(), (second || 'CN').toUpperCase()].join('-')
}
