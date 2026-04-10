/**
 * 将十六进制颜色转换为 RGB 值（逗号分隔，用于 rgba）
 * @param hex 十六进制颜色值，如 '#126ee3'
 * @returns RGB 值，如 '18, 110, 227'
 */
export function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) {
    return '18, 110, 227' // 默认值
  }
  const r = parseInt(result[1], 16)
  const g = parseInt(result[2], 16)
  const b = parseInt(result[3], 16)
  return `${r}, ${g}, ${b}`
}

/**
 * 将十六进制颜色转换为 RGB 值（空格分隔，用于 rgb 新语法）
 * @param hex 十六进制颜色值，如 '#126ee3'
 * @returns RGB 值，如 '18 110 227'
 */
export function hexToRgbSpace(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) {
    return '18 110 227' // 默认值
  }
  const r = parseInt(result[1], 16)
  const g = parseInt(result[2], 16)
  const b = parseInt(result[3], 16)
  return `${r} ${g} ${b}`
}

/**
 * 计算 hover 颜色（稍微变亮）
 * @param hex 十六进制颜色值
 * @returns hover 颜色值
 */
export function getHoverColor(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) {
    return '#3a8ff0' // 默认 hover 颜色
  }
  const r = Math.min(255, parseInt(result[1], 16) + 30)
  const g = Math.min(255, parseInt(result[2], 16) + 30)
  const b = Math.min(255, parseInt(result[3], 16) + 30)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

export const DEFAULT_SKILL_ICON_COLORS = [
  '#39A835',
  '#2172C0',
  '#1D1C52',
  '#64BEB7',
  '#6CA016',
  '#227F96',
  '#A3E034',
  '#45C5E4',
  '#10A5B7',
  '#1B669C',
  '#55A54E',
  '#A46E37',
]

function hashName(name: string): number {
  let h = 0
  for (let i = 0; i < name.length; i += 1) {
    h = (h << 5) - h + name.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

/**
 * 图标颜色：用固定 hash 算法，根据「名称 + 颜色数组」稳定匹配到数组中的某个颜色。
 * @param name 技能名称
 * @param colors 随机颜色数组（由调用方传入）
 */
export function getMatchedColorByName(name: string, colors: string[]): string {
  const palette = Array.isArray(colors) && colors.length ? colors : DEFAULT_SKILL_ICON_COLORS
  return palette[hashName(name) % palette.length]
}
