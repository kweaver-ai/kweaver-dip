import { describe, expect, it } from 'vitest'

import { fuzzyMatch } from '../index'

describe('fuzzyMatch', () => {
  it('关键字在文本中（忽略大小写）为 true', () => {
    expect(fuzzyMatch('ab', 'xxAbcyy')).toBe(true)
  })

  it('关键字不在文本中为 false', () => {
    expect(fuzzyMatch('zz', 'hello')).toBe(false)
  })

  it('两侧皆非字符串时返回 undefined', () => {
    expect(
      fuzzyMatch(undefined as unknown as string, undefined as unknown as string),
    ).toBeUndefined()
  })

  it('仅一侧为字符串时当前实现会抛错（toLowerCase）', () => {
    expect(() => fuzzyMatch(1 as unknown as string, 'a')).toThrow(TypeError)
    expect(() => fuzzyMatch('a', 1 as unknown as string)).toThrow(TypeError)
  })
})
