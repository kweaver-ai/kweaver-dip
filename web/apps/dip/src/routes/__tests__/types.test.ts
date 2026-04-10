import { describe, expect, it } from 'vitest'

import { WENSHU_APP_KEY } from '../types'

describe('routes/types', () => {
  it('WENSHU_APP_KEY 为 32 位十六进制字符串', () => {
    expect(WENSHU_APP_KEY).toMatch(/^[a-f0-9]{32}$/)
  })
})
