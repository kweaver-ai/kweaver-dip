import { beforeEach, describe, expect, it } from 'vitest'

import { setGlobalSiderCollapsed, useGlobalLayoutStore } from '../globalLayoutStore'

describe('globalLayoutStore', () => {
  beforeEach(() => {
    useGlobalLayoutStore.setState({ collapsed: false })
  })

  it('setCollapsed 更新收起状态', () => {
    useGlobalLayoutStore.getState().setCollapsed(true)
    expect(useGlobalLayoutStore.getState().collapsed).toBe(true)
  })

  it('toggleCollapsed 切换状态', () => {
    expect(useGlobalLayoutStore.getState().collapsed).toBe(false)
    useGlobalLayoutStore.getState().toggleCollapsed()
    expect(useGlobalLayoutStore.getState().collapsed).toBe(true)
    useGlobalLayoutStore.getState().toggleCollapsed()
    expect(useGlobalLayoutStore.getState().collapsed).toBe(false)
  })

  it('setGlobalSiderCollapsed 供非 React 代码调用', () => {
    setGlobalSiderCollapsed(true)
    expect(useGlobalLayoutStore.getState().collapsed).toBe(true)
  })
})
