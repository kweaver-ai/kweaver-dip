import { describe, expect, it } from 'vitest'

import type { CurrentMicroAppInfo } from '../microAppStore'
import { useMicroAppStore } from '../microAppStore'

describe('microAppStore', () => {
  it('setCurrentMicroApp / setHomeRoute / clearCurrentMicroApp', () => {
    useMicroAppStore.setState({
      currentMicroApp: null,
      homeRoute: null,
    })

    const info = {
      id: 1,
      key: 'k',
      name: 'n',
      description: '',
      is_config: true,
      updated_by: 'u',
      updated_at: 't',
      micro_app: { name: 'm', entry: '/', headless: false },
      pinned: false,
      isBuiltIn: false,
      routeBasename: '/app',
    } satisfies CurrentMicroAppInfo

    useMicroAppStore.getState().setCurrentMicroApp(info)
    useMicroAppStore.getState().setHomeRoute('/home')
    expect(useMicroAppStore.getState().currentMicroApp?.key).toBe('k')
    expect(useMicroAppStore.getState().homeRoute).toBe('/home')

    useMicroAppStore.getState().clearCurrentMicroApp()
    expect(useMicroAppStore.getState().currentMicroApp).toBeNull()
    expect(useMicroAppStore.getState().homeRoute).toBeNull()
  })
})
