import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('normalizePath', () => {
  it('保留根路径 /', async () => {
    const { normalizePath } = await import('../config')
    expect(normalizePath('/')).toBe('/')
  })

  it('去掉末尾斜杠（根除外）', async () => {
    const { normalizePath } = await import('../config')
    expect(normalizePath('/dip-hub/')).toBe('/dip-hub')
  })

  it('补全前导斜杠', async () => {
    const { normalizePath } = await import('../config')
    expect(normalizePath('dip-hub')).toBe('/dip-hub')
  })
})

describe('BASE_PATH / getFullPath', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('未设置 __DIP_HUB_BASE_PATH__ 时为默认 /dip-hub', async () => {
    delete (window as Window & { __DIP_HUB_BASE_PATH__?: string }).__DIP_HUB_BASE_PATH__
    const { BASE_PATH, getFullPath } = await import('../config')
    expect(BASE_PATH).toBe('/dip-hub')
    expect(getFullPath('/login')).toBe('/dip-hub/login')
  })

  it('window.__DIP_HUB_BASE_PATH__ 可覆盖基础路径', async () => {
    window.__DIP_HUB_BASE_PATH__ = '/custom-base'
    const { BASE_PATH, getFullPath } = await import('../config')
    expect(BASE_PATH).toBe('/custom-base')
    expect(getFullPath('/app')).toBe('/custom-base/app')
  })

  it('基础路径为 / 时 getFullPath 只返回规范化后的子路径', async () => {
    window.__DIP_HUB_BASE_PATH__ = '/'
    const { getFullPath } = await import('../config')
    expect(getFullPath('/login')).toBe('/login')
  })
})
