import { beforeEach, describe, expect, it } from 'vitest'

import { useLanguageStore } from '../languageStore'

describe('languageStore', () => {
  beforeEach(() => {
    useLanguageStore.persist.clearStorage()
    useLanguageStore.setState({ language: 'zh-CN' })
  })

  it('setLanguage 更新语言', () => {
    useLanguageStore.getState().setLanguage('en-US')
    expect(useLanguageStore.getState().language).toBe('en-US')
  })
})
