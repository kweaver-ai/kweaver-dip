/** 超过 99 显示 99+ */
export function formatTotalDisplay(n: number): string {
  if (!Number.isFinite(n)) return '0'
  const t = Math.trunc(n)
  if (t < 0) return '0'
  if (t > 99) return '99+'
  return String(t)
}
