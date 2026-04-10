import { beforeEach, describe, expect, it, vi } from 'vitest'

const { cookiesGet, cookiesSet, cookiesRemove } = vi.hoisted(() => ({
  cookiesGet: vi.fn<(key?: string) => string | undefined>(),
  cookiesSet: vi.fn(),
  cookiesRemove: vi.fn(),
}))

vi.mock('js-cookie', () => ({
  default: {
    get: (key?: string) => cookiesGet(key),
    set: cookiesSet,
    remove: cookiesRemove,
  },
}))

vi.mock('@/routes/utils', () => ({
  removeBasePath: (p: string) => p,
}))

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
  },
}))

describe('token-config', () => {
  beforeEach(() => {
    cookiesGet.mockReset()
    cookiesSet.mockReset()
    cookiesRemove.mockReset()
  })

  it('getAccessToken 优先返回 Cookie 中的 dip.oauth2_token', async () => {
    cookiesGet.mockImplementation((key) => (key === 'dip.oauth2_token' ? 'cookie-at' : undefined))
    const { getAccessToken } = await import('../token-config')
    expect(getAccessToken()).toBe('cookie-at')
  })

  it('无 access Cookie 时在 DEV 下回落到 PUBLIC_TOKEN（Vitest 中默认为空串）', async () => {
    cookiesGet.mockReturnValue(undefined)
    const { getAccessToken } = await import('../token-config')
    expect(getAccessToken()).toBe('')
  })

  it('getRefreshToken 优先读 dip.refresh_token', async () => {
    cookiesGet.mockImplementation((key) => (key === 'dip.refresh_token' ? 'rt' : undefined))
    const { getRefreshToken } = await import('../token-config')
    expect(getRefreshToken()).toBe('rt')
  })
})
