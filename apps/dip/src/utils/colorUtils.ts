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
