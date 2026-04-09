import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { UserInfo } from '@/apis'
import type { EnabledModule } from '@/routes/types'

const { getUserInfoMock, getLogoutUrlMock, getAccessTokenMock } = vi.hoisted(() => ({
  getUserInfoMock: vi.fn(),
  getLogoutUrlMock: vi.fn(),
  getAccessTokenMock: vi.fn(),
}))

vi.mock('@/apis', () => ({
  getUserInfo: () => getUserInfoMock(),
  getLogoutUrl: () => getLogoutUrlMock(),
}))

vi.mock('@/utils/http/token-config', () => ({
  getAccessToken: () => getAccessTokenMock(),
}))

describe('userInfoStore', () => {
  beforeEach(() => {
    vi.resetModules()
    getUserInfoMock.mockReset()
    getLogoutUrlMock.mockReset()
    getAccessTokenMock.mockReset()
    getLogoutUrlMock.mockReturnValue('https://logout.example/oauth2/logout')
  })

  it('setUserInfo 同步 isAdmin（vision_name === admin）', async () => {
    const { useUserInfoStore } = await import('../userInfoStore')
    useUserInfoStore.getState().setUserInfo({
      id: '1',
      account: 'a',
      vision_name: 'admin',
    })
    expect(useUserInfoStore.getState().isAdmin).toBe(true)
    useUserInfoStore.getState().setUserInfo({
      id: '2',
      account: 'b',
      vision_name: 'user',
    })
    expect(useUserInfoStore.getState().isAdmin).toBe(false)
  })

  it('setModules 过滤非法项并去重', async () => {
    const { useUserInfoStore } = await import('../userInfoStore')
    // 故意传入非法模块名，验证运行时过滤（类型上需断言为 EnabledModule[]）
    useUserInfoStore.getState().setModules(['studio', 'unknown', 'store', 'studio'] as EnabledModule[])
    expect(useUserInfoStore.getState().modules).toEqual(['studio', 'store'])
  })

  it('logout 会调用 getLogoutUrl 并触发 location.replace', async () => {
    const replaceStub = vi.fn()
    vi.stubGlobal('location', {
      ancestorOrigins: [] as unknown as DOMStringList,
      assign: vi.fn(),
      hash: '',
      host: 'localhost',
      hostname: 'localhost',
      href: 'http://localhost/',
      origin: 'http://localhost',
      pathname: '/',
      port: '',
      protocol: 'http:',
      reload: vi.fn(),
      replace: replaceStub,
      search: '',
      toString: () => 'http://localhost/',
    } as unknown as Location)
    try {
      const { useUserInfoStore } = await import('../userInfoStore')
      useUserInfoStore.getState().logout()
      expect(getLogoutUrlMock).toHaveBeenCalledOnce()
      expect(replaceStub).toHaveBeenCalledWith('https://logout.example/oauth2/logout')
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('无 token 时 fetchUserInfo 将 userInfo 置空并结束 loading（PUBLIC_SKIP_AUTH 为 false）', async () => {
    getAccessTokenMock.mockReturnValue('')
    const { useUserInfoStore } = await import('../userInfoStore')
    await useUserInfoStore.getState().fetchUserInfo()
    expect(useUserInfoStore.getState().userInfo).toBeNull()
    expect(useUserInfoStore.getState().isLoading).toBe(false)
  })

  it('有 token 时 fetchUserInfo 成功后写入用户与 isAdmin', async () => {
    getAccessTokenMock.mockReturnValue('access-token')
    getUserInfoMock.mockResolvedValue({
      id: '10',
      account: 'acc',
      vision_name: 'admin',
    })
    const { useUserInfoStore } = await import('../userInfoStore')
    await useUserInfoStore.getState().fetchUserInfo()
    expect(useUserInfoStore.getState().userInfo).toEqual({
      id: '10',
      account: 'acc',
      vision_name: 'admin',
    })
    expect(useUserInfoStore.getState().isAdmin).toBe(true)
    expect(useUserInfoStore.getState().isLoading).toBe(false)
  })

  it('fetchUserInfo 请求失败时抛出错误并清空用户（非 SKIP_AUTH）', async () => {
    getAccessTokenMock.mockReturnValue('access-token')
    getUserInfoMock.mockRejectedValue(new Error('network'))
    const { useUserInfoStore } = await import('../userInfoStore')
    await expect(useUserInfoStore.getState().fetchUserInfo()).rejects.toThrow('network')
    expect(useUserInfoStore.getState().userInfo).toBeNull()
    expect(useUserInfoStore.getState().isLoading).toBe(false)
  })

  it('相同 token 并发 fetchUserInfo 只发起一次 getUserInfo', async () => {
    getAccessTokenMock.mockReturnValue('same')
    let resolveUser!: (u: UserInfo) => void
    getUserInfoMock.mockImplementation(
      () =>
        new Promise<UserInfo>((resolve) => {
          resolveUser = resolve
        }),
    )
    const { useUserInfoStore } = await import('../userInfoStore')
    const p1 = useUserInfoStore.getState().fetchUserInfo()
    const p2 = useUserInfoStore.getState().fetchUserInfo()
    resolveUser({ id: '1', account: 'a', vision_name: 'user' })
    await Promise.all([p1, p2])
    expect(getUserInfoMock).toHaveBeenCalledTimes(1)
    expect(useUserInfoStore.getState().userInfo?.vision_name).toBe('user')
  })
})
