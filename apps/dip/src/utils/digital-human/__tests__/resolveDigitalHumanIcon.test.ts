import { describe, expect, it } from 'vitest'

import { resolveDigitalHumanIconSrc } from '../resolveDigitalHumanIcon'

describe('resolveDigitalHumanIconSrc', () => {
  it('空或仅空白时返回 fallback', () => {
    expect(resolveDigitalHumanIconSrc(undefined, '/fb')).toBe('/fb')
    expect(resolveDigitalHumanIconSrc('   ', '/fb')).toBe('/fb')
    expect(resolveDigitalHumanIconSrc(undefined)).toBe('')
  })

  it('data:image 原样返回', () => {
    const s = 'data:image/png;base64,xxxx'
    expect(resolveDigitalHumanIconSrc(s)).toBe(s)
  })

  it('http(s) 原样返回', () => {
    expect(resolveDigitalHumanIconSrc('http://example.com/x.png')).toBe('http://example.com/x.png')
    expect(resolveDigitalHumanIconSrc('https://example.com/x.png')).toBe(
      'https://example.com/x.png',
    )
  })

  it('预置 dh_1 走本地 SVG 导入（Vitest 下多为内联 data URL）', () => {
    const url = resolveDigitalHumanIconSrc('dh_1')
    expect(url.length).toBeGreaterThan(0)
    expect(url).toMatch(/^data:image\//)
  })

  it('疑似裸 base64（长度≥32）包装为 png data URL', () => {
    const raw = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij' // 36
    expect(resolveDigitalHumanIconSrc(raw)).toBe(`data:image/png;base64,${raw}`)
  })

  it('非 URL、非预置、非合法 base64 时回退', () => {
    expect(resolveDigitalHumanIconSrc('random-id', '/fb')).toBe('/fb')
    expect(resolveDigitalHumanIconSrc('short', '/fb')).toBe('/fb')
  })
})
