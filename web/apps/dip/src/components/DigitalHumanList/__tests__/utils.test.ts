import { describe, expect, it } from 'vitest'

import { computeColumnCount } from '../utils'

describe('DigitalHumanList/utils', () => {
  it('宽度较小时至少返回 1 列', () => {
    expect(computeColumnCount(200)).toBe(1)
  })

  it('宽度较大时会增加列数并保证单列宽度不过大', () => {
    expect(computeColumnCount(1000)).toBe(2)
    expect(computeColumnCount(1500)).toBe(4)
  })

  it('边界宽度下列数稳定', () => {
    expect(computeColumnCount(960)).toBe(2)
    expect(computeColumnCount(961)).toBe(2)
  })
})
