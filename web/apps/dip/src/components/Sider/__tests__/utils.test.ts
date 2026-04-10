import { describe, expect, it } from 'vitest'

import { formatTotalDisplay } from '../utils'

describe('Sider/utils formatTotalDisplay', () => {
  it('负数与非有限数按 0 处理', () => {
    expect(formatTotalDisplay(-1)).toBe('0')
    expect(formatTotalDisplay(Number.NaN)).toBe('0')
    expect(formatTotalDisplay(Number.POSITIVE_INFINITY)).toBe('0')
  })

  it('0–99 原样输出字符串', () => {
    expect(formatTotalDisplay(0)).toBe('0')
    expect(formatTotalDisplay(99)).toBe('99')
  })

  it('大于 99 显示 99+', () => {
    expect(formatTotalDisplay(100)).toBe('99+')
    expect(formatTotalDisplay(1000)).toBe('99+')
  })

  it('小数向下取整', () => {
    expect(formatTotalDisplay(3.9)).toBe('3')
  })
})
