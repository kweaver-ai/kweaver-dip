import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { OemBasicConfig, OemResourceConfig } from '@/apis'

const { getOEMResourceConfigApiMock, getOEMBasicConfigApiMock } = vi.hoisted(() => ({
  getOEMResourceConfigApiMock: vi.fn(),
  getOEMBasicConfigApiMock: vi.fn(),
}))

vi.mock('@/apis', () => ({
  getOEMResourceConfigApi: (lang: string, product?: string) =>
    getOEMResourceConfigApiMock(lang, product),
  getOEMBasicConfigApi: () => getOEMBasicConfigApiMock(),
}))

const sampleResource = {
  'background.png': '',
  'darklogo.png': '',
  'defaultBackground.png': '',
  'desktopDefaultBackground.png': '',
  homePageSlogan: '',
  'logo.png': '',
  'org.png': '',
  portalBanner: '',
  product: '',
  'regularBackground.png': '',
  'regularLiveBackground.gif': '',
  'title.png': '',
} satisfies OemResourceConfig

const sampleBasic: OemBasicConfig = { theme: 'light' }

describe('oemConfigStore', () => {
  beforeEach(() => {
    vi.resetModules()
    getOEMResourceConfigApiMock.mockReset()
    getOEMBasicConfigApiMock.mockReset()
  })

  it('getOEMResourceConfig 精确匹配与 zh/en 前缀与兜底', async () => {
    getOEMResourceConfigApiMock.mockImplementation(async (lang: string) => ({
      ...sampleResource,
      product: lang,
    }))
    getOEMBasicConfigApiMock.mockResolvedValue(sampleBasic)

    const { useOEMConfigStore } = await import('../oemConfigStore')
    await useOEMConfigStore.getState().initialize(['zh-CN', 'en-US'], 'dip')

    const s = useOEMConfigStore.getState()
    expect(s.initialized).toBe(true)
    expect(s.oemResourceConfig['zh-CN']?.product).toBe('zh-CN')
    expect(s.getOEMResourceConfig('zh-CN')?.product).toBe('zh-CN')
    expect(s.getOEMResourceConfig('zh-HK')?.product).toBe('zh-CN')
    expect(s.getOEMResourceConfig('en-GB')?.product).toBe('en-US')
  })

  it('initialize 仅执行一次', async () => {
    getOEMResourceConfigApiMock.mockResolvedValue(sampleResource)
    getOEMBasicConfigApiMock.mockResolvedValue(sampleBasic)

    const { useOEMConfigStore } = await import('../oemConfigStore')
    await useOEMConfigStore.getState().initialize(['zh-CN'], 'dip')
    await useOEMConfigStore.getState().initialize(['zh-CN'], 'dip')
    expect(getOEMResourceConfigApiMock).toHaveBeenCalledTimes(1)
  })

  it('getOEMBasicConfig 返回当前基本配置', async () => {
    getOEMResourceConfigApiMock.mockResolvedValue(sampleResource)
    getOEMBasicConfigApiMock.mockResolvedValue(sampleBasic)

    const { useOEMConfigStore } = await import('../oemConfigStore')
    await useOEMConfigStore.getState().initialize(['zh-CN'], 'dip')
    expect(useOEMConfigStore.getState().getOEMBasicConfig()?.theme).toBe('light')
  })

  it('initialize 时资源接口全部失败：Promise.all 被拒，资源配置为空，基本配置仍可成功', async () => {
    getOEMResourceConfigApiMock.mockRejectedValue(new Error('resource-down'))
    getOEMBasicConfigApiMock.mockResolvedValue(sampleBasic)

    const { useOEMConfigStore } = await import('../oemConfigStore')
    await useOEMConfigStore.getState().initialize(['zh-CN'], 'dip')

    const s = useOEMConfigStore.getState()
    expect(s.oemResourceConfig).toEqual({})
    expect(s.oemBasicConfig).toEqual(sampleBasic)
    expect(s.initialized).toBe(true)
    expect(s.error).toBeNull()
    expect(s.loading).toBe(false)
  })

  it('initialize 时 getOEMBasicConfigApi 失败：basic 为 null', async () => {
    getOEMResourceConfigApiMock.mockResolvedValue(sampleResource)
    getOEMBasicConfigApiMock.mockRejectedValue(new Error('basic-fail'))

    const { useOEMConfigStore } = await import('../oemConfigStore')
    await useOEMConfigStore.getState().initialize(['zh-CN'], 'dip')

    expect(useOEMConfigStore.getState().oemBasicConfig).toBeNull()
    expect(useOEMConfigStore.getState().oemResourceConfig['zh-CN']).toBeDefined()
  })
})
