import { describe, expect, it } from 'vitest'

import { isJSONString } from '../index'

describe('isJSONString', () => {
  it('对象与数组 JSON 为 true', () => {
    expect(isJSONString('{}')).toBe(true)
    expect(isJSONString('[]')).toBe(true)
    expect(isJSONString('{"a":1}')).toBe(true)
  })

  it('非法 JSON 为 false', () => {
    expect(isJSONString('{')).toBe(false)
  })

  it('解析为原始值的 JSON 不为 true（当前实现返回 undefined）', () => {
    expect(isJSONString('"hi"')).toBeUndefined()
    expect(isJSONString('1')).toBeUndefined()
  })
})
