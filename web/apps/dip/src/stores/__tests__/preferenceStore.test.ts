import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ApplicationInfo } from '@/apis'
import { WENSHU_APP_KEY } from '@/routes/types'

const messageSuccess = vi.fn()
const messageError = vi.fn()

vi.mock('antd', () => ({
  message: {
    success: (msg: string) => messageSuccess(msg),
    error: (msg: string) => messageError(msg),
  },
}))

const { getApplicationsMock, pinMicroAppApiMock } = vi.hoisted(() => ({
  getApplicationsMock: vi.fn(),
  pinMicroAppApiMock: vi.fn(),
}))

vi.mock('@/apis', () => ({
  getApplications: () => getApplicationsMock(),
  pinMicroAppApi: (body: { key: string; pinned: boolean }) => pinMicroAppApiMock(body),
}))

const baseApp = (key: string, pinned: boolean): ApplicationInfo =>
  ({
    id: 1,
    key,
    name: key,
    description: '',
    is_config: true,
    updated_by: 'u',
    updated_at: 't',
    micro_app: { name: 'm', entry: '/', headless: false },
    pinned,
    isBuiltIn: false,
    release_config: [],
  }) as ApplicationInfo

describe('preferenceStore', () => {
  beforeEach(() => {
    vi.resetModules()
    getApplicationsMock.mockReset()
    pinMicroAppApiMock.mockReset()
    messageSuccess.mockReset()
    messageError.mockReset()
  })

  it('fetchPinnedMicroApps 拉取并过滤 pinned、缓存 wenshu', async () => {
    getApplicationsMock.mockResolvedValue([
      baseApp(WENSHU_APP_KEY, false),
      baseApp('pinned-app', true),
    ])
    const { usePreferenceStore } = await import('../preferenceStore')
    await usePreferenceStore.getState().fetchPinnedMicroApps()
    const s = usePreferenceStore.getState()
    expect(s.pinnedMicroApps).toHaveLength(1)
    expect(s.pinnedMicroApps[0]?.key).toBe('pinned-app')
    expect(s.wenshuAppInfo?.key).toBe(WENSHU_APP_KEY)
    expect(s.loading).toBe(false)
  })

  it('pinMicroApp 已钉住则直接 true', async () => {
    getApplicationsMock.mockResolvedValue([baseApp('a', true)])
    const { usePreferenceStore } = await import('../preferenceStore')
    await usePreferenceStore.getState().fetchPinnedMicroApps()
    const ok = await usePreferenceStore.getState().pinMicroApp('a')
    expect(ok).toBe(true)
    expect(pinMicroAppApiMock).not.toHaveBeenCalled()
  })

  it('pinMicroApp 成功时刷新列表', async () => {
    getApplicationsMock.mockResolvedValue([])
    pinMicroAppApiMock.mockResolvedValue(undefined)
    const { usePreferenceStore } = await import('../preferenceStore')
    const ok = await usePreferenceStore.getState().pinMicroApp('new-app')
    expect(ok).toBe(true)
    expect(pinMicroAppApiMock).toHaveBeenCalledWith({ key: 'new-app', pinned: true })
    expect(messageSuccess).toHaveBeenCalledWith('固定成功')
  })

  it('unpinMicroApp needRequest=false 仅本地移除', async () => {
    getApplicationsMock.mockResolvedValue([baseApp('x', true)])
    const { usePreferenceStore } = await import('../preferenceStore')
    await usePreferenceStore.getState().fetchPinnedMicroApps()
    const ok = await usePreferenceStore.getState().unpinMicroApp('x', false)
    expect(ok).toBe(true)
    expect(usePreferenceStore.getState().pinnedMicroApps.some((a) => a.key === 'x')).toBe(false)
    expect(pinMicroAppApiMock).not.toHaveBeenCalled()
  })

  it('isPinned / togglePin', async () => {
    getApplicationsMock.mockResolvedValue([baseApp('t1', true)])
    pinMicroAppApiMock.mockResolvedValue(undefined)
    const { usePreferenceStore } = await import('../preferenceStore')
    await usePreferenceStore.getState().fetchPinnedMicroApps()
    expect(usePreferenceStore.getState().isPinned('t1')).toBe(true)
    await usePreferenceStore.getState().togglePin('t1')
    expect(pinMicroAppApiMock).toHaveBeenCalledWith({ key: 't1', pinned: false })
  })

  it('fetchPinnedMicroApps 接口失败时结束 loading、不抛错', async () => {
    getApplicationsMock.mockRejectedValue(new Error('network'))
    const { usePreferenceStore } = await import('../preferenceStore')
    await usePreferenceStore.getState().fetchPinnedMicroApps()
    expect(usePreferenceStore.getState().loading).toBe(false)
    expect(usePreferenceStore.getState().pinnedMicroApps).toEqual([])
  })

  it('pinMicroApp 接口失败且带 description 时 message.error', async () => {
    getApplicationsMock.mockResolvedValue([])
    pinMicroAppApiMock.mockRejectedValue({ description: '配额不足' })
    const { usePreferenceStore } = await import('../preferenceStore')
    const ok = await usePreferenceStore.getState().pinMicroApp('fail-app')
    expect(ok).toBe(false)
    expect(messageError).toHaveBeenCalledWith('配额不足')
  })

  it('pinMicroApp 接口失败且无 description 时不弹通用错误（仅返回 false）', async () => {
    getApplicationsMock.mockResolvedValue([])
    pinMicroAppApiMock.mockRejectedValue(new Error('timeout'))
    const { usePreferenceStore } = await import('../preferenceStore')
    const ok = await usePreferenceStore.getState().pinMicroApp('x')
    expect(ok).toBe(false)
    expect(messageError).not.toHaveBeenCalled()
  })

  it('unpinMicroApp 需请求且接口失败时 message.error', async () => {
    getApplicationsMock.mockResolvedValue([baseApp('bad', true)])
    pinMicroAppApiMock.mockRejectedValue({ description: '服务端错误' })
    const { usePreferenceStore } = await import('../preferenceStore')
    await usePreferenceStore.getState().fetchPinnedMicroApps()
    const ok = await usePreferenceStore.getState().unpinMicroApp('bad', true)
    expect(ok).toBe(false)
    expect(messageError).toHaveBeenCalledWith('服务端错误')
  })
})
