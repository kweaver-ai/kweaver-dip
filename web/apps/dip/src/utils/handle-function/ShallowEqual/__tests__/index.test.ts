import { describe, expect, it } from 'vitest'

import shallowEqual from '../index'

describe('shallowEqual', () => {
  it('同一引用为 true', () => {
    const o = { a: 1 }
    expect(shallowEqual(o, o)).toBe(true)
  })

  it('键值对相同为 true', () => {
    expect(shallowEqual({ x: 1, y: 2 }, { x: 1, y: 2 })).toBe(true)
  })

  it('嵌套对象引用不同则按浅比较为 false', () => {
    expect(shallowEqual({ a: { b: 1 } }, { a: { b: 1 } })).toBe(false)
  })

  it('键数量不同为 false', () => {
    expect(shallowEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false)
  })
})
