import { beforeEach, describe, expect, it } from 'vitest'

import { getParam, getUrl } from '../index'

describe('getParam', () => {
  beforeEach(() => {
    window.history.pushState({}, '', 'http://localhost:3000/')
  })

  it('不传 name 时返回当前 search 解析出的参数对象', () => {
    window.history.pushState({}, '', 'http://localhost:3000/?a=1&b=two')
    expect(getParam()).toEqual({ a: '1', b: 'two' })
  })

  it('按字符串 name 取单个参数', () => {
    window.history.pushState({}, '', 'http://localhost:3000/?name=hello')
    expect(getParam('name')).toBe('hello')
  })

  it('缺少参数时返回空串', () => {
    window.history.pushState({}, '', 'http://localhost:3000/?a=1')
    expect(getParam('missing')).toBe('')
  })

  it('按名字数组取多个参数', () => {
    window.history.pushState({}, '', 'http://localhost:3000/?a=1&b=2')
    expect(getParam(['a', 'b', 'c'])).toEqual({ a: '1', b: '2', c: '' })
  })
})

describe('getUrl', () => {
  it('从以 ? 开头的查询串解析键值（与实现约定一致）', () => {
    expect(getUrl('?a=1&b=two')).toEqual({ a: '1', b: 'two' })
  })

  it('无 ? 时返回空对象', () => {
    expect(getUrl('/no-query')).toEqual({})
  })
})
