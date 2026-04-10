import { describe, expect, it, beforeEach } from 'vitest'
import {
  getCommonHttpHeaders,
  getHttpConfig,
  normalizeLanguageTag,
  resetHttpConfig,
  setHttpConfig,
} from './index'

describe('@kweaver-web/request', () => {
  beforeEach(() => {
    resetHttpConfig()
  })

  it('merges runtime http config', () => {
    setHttpConfig({
      accessToken: 'token-a',
      getLanguage: () => 'en-US',
      buildUrl: (url) => `/api${url}`,
    })

    const config = getHttpConfig()
    expect(config.buildUrl?.('/users')).toBe('/api/users')
    expect(config.getLanguage?.()).toBe('en-US')
    expect(getCommonHttpHeaders()).toMatchObject({
      Authorization: 'Bearer token-a',
      Token: 'token-a',
      'x-language': 'en-US',
      'Accept-Language': 'en-US',
    })
  })

  it('can reset config to defaults', () => {
    setHttpConfig({
      accessToken: 'token-a',
      getLanguage: () => 'zh-CN',
    })

    resetHttpConfig()

    expect(getHttpConfig().accessToken).toBe('')
    expect(getCommonHttpHeaders()).not.toHaveProperty('Authorization')
  })

  it('normalizes language tags for request headers', () => {
    expect(normalizeLanguageTag('en_us')).toBe('en-US')
    expect(normalizeLanguageTag('zh-hans-cn')).toBe('zh-Hans-CN')
    expect(normalizeLanguageTag('')).toBe('')
  })
})
