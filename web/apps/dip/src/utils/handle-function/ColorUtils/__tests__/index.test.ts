import { describe, expect, it } from 'vitest'

import {
  DEFAULT_SKILL_ICON_COLORS,
  getHoverColor,
  getMatchedColorByName,
  hexToRgb,
  hexToRgbSpace,
} from '../index'

describe('colorUtils', () => {
  describe('hexToRgb', () => {
    it('解析带 # 的六位十六进制', () => {
      expect(hexToRgb('#126ee3')).toBe('18, 110, 227')
    })

    it('解析不带 # 的六位十六进制', () => {
      expect(hexToRgb('126ee3')).toBe('18, 110, 227')
    })

    it('非法输入返回默认 RGB 串', () => {
      expect(hexToRgb('not-a-color')).toBe('18, 110, 227')
    })
  })

  describe('hexToRgbSpace', () => {
    it('输出空格分隔的 RGB', () => {
      expect(hexToRgbSpace('#126ee3')).toBe('18 110 227')
    })

    it('非法输入返回默认值', () => {
      expect(hexToRgbSpace('')).toBe('18 110 227')
    })
  })

  describe('getHoverColor', () => {
    it('在合法 hex 上各通道 +30 并封顶 255', () => {
      expect(getHoverColor('#000000')).toBe('#1e1e1e')
    })

    it('非法输入返回默认 hover 色', () => {
      expect(getHoverColor('xyz')).toBe('#3a8ff0')
    })
  })

  describe('getMatchedColorByName', () => {
    it('同名多次调用得到同一颜色', () => {
      const a = getMatchedColorByName('技能A', DEFAULT_SKILL_ICON_COLORS)
      const b = getMatchedColorByName('技能A', DEFAULT_SKILL_ICON_COLORS)
      expect(a).toBe(b)
    })

    it('传入非空颜色数组时只从该数组取色', () => {
      const only = ['#111111', '#222222']
      const c = getMatchedColorByName('任意名', only)
      expect(only).toContain(c)
    })

    it('空数组时回退到默认调色板', () => {
      const c = getMatchedColorByName('x', [])
      expect(DEFAULT_SKILL_ICON_COLORS).toContain(c)
    })
  })
})
