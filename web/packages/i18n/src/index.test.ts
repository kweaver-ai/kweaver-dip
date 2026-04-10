import { beforeEach, describe, expect, it, vi } from 'vitest'

const { initMock, getMock } = vi.hoisted(() => ({
  initMock: vi.fn(),
  getMock: vi.fn(),
}))

vi.mock('react-intl-universal', () => ({
  default: {
    init: initMock,
    get: getMock,
  },
}))

import {
  DEFAULT_LOCALE,
  changeI18nLanguage,
  getMappedUiLocale,
  getNavigatorLanguage,
  initI18n,
  mergeLocaleMessages,
  normalizeLocale,
  sharedLocaleMessages,
  t,
} from './index'

describe('@kweaver-web/i18n', () => {
  beforeEach(() => {
    initMock.mockReset()
    getMock.mockReset()
  })

  it('normalizes locale aliases into supported locales', () => {
    expect(normalizeLocale('zh')).toBe('zh-CN')
    expect(normalizeLocale('zh_HK')).toBe('zh-TW')
    expect(normalizeLocale('en')).toBe('en-US')
    expect(normalizeLocale('fr-FR')).toBe(DEFAULT_LOCALE)
  })

  it('merges locale messages deeply', () => {
    const merged = mergeLocaleMessages(
      {
        'zh-CN': { feature: { title: '标题' } },
        'zh-TW': { feature: { title: '標題' } },
        'en-US': { feature: { title: 'Title' } },
      },
      {
        'zh-CN': { feature: { description: '描述' } },
        'zh-TW': { feature: { description: '描述' } },
        'en-US': { feature: { description: 'Description' } },
      },
    )

    expect(merged['zh-CN']).toEqual({
      feature: {
        title: '标题',
        description: '描述',
      },
    })
  })

  it('maps ui locales and exposes shared messages', () => {
    const mapped = getMappedUiLocale('zh', {
      'zh-CN': 'cn',
      'zh-TW': 'tw',
      'en-US': 'en',
    })

    expect(mapped).toBe('cn')
    expect(sharedLocaleMessages['en-US']).toHaveProperty('error.networkError')
  })

  it('wraps react-intl-universal init with normalized locales', async () => {
    const locales = {
      'zh-CN': { app: { title: '标题' } },
      'zh-TW': { app: { title: '標題' } },
      'en-US': { app: { title: 'Title' } },
    }

    await initI18n({
      currentLocale: 'zh_hk',
      locales,
    })

    expect(initMock).toHaveBeenCalledWith({
      currentLocale: 'zh-TW',
      locales,
      fallbackLocale: DEFAULT_LOCALE,
    })
  })

  it('can switch language through the package wrapper', async () => {
    await changeI18nLanguage('en')

    expect(initMock).toHaveBeenCalledWith(
      expect.objectContaining({
        currentLocale: 'en-US',
      }),
    )
  })

  it('exposes navigator language alias and translation proxy', () => {
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: {
        language: 'en-gb',
      },
    })

    getMock.mockReturnValue('Hello')

    expect(getNavigatorLanguage()).toBe('en-US')
    expect(t('global.ok')).toBe('Hello')
    expect(getMock).toHaveBeenCalledWith('global.ok', undefined)
  })
})
