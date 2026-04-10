export function toComponentName(iconId: string, suffix: string): string {
  const segments = iconId
    .replace(/^icon-/, '')
    .split('-')
    .filter(Boolean)

  // 短横线划分的单词：首字母大写，其余保持原样（如 icon-toolBox→ToolBox, icon-AR→AR）
  const name = segments
    .map((segment) => {
      if (/^\d+$/.test(segment)) {
        return segment
      }

      return segment.charAt(0).toUpperCase() + segment.slice(1)
    })
    .join('')

  return `${name}${suffix}`
}
