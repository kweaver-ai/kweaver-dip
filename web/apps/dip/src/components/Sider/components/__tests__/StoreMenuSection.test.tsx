import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

const navigate = vi.fn()

vi.mock('antd', async () => {
  const renderItems = (items?: any[]): ReactNode =>
    items?.map((item) => {
      if (!item) return null
      return (
        <div key={item.key}>
          <button type="button" onClick={() => item.onClick?.()}>
            {item.label}
          </button>
          {item.children ? <div>{renderItems(item.children)}</div> : null}
        </div>
      )
    })

  return {
    Menu: ({ items }: { items?: any[] }) => <div>{renderItems(items)}</div>,
    Popover: ({ children }: { children: ReactNode }) => <>{children}</>,
  }
})

vi.mock('@/routes/routes', () => ({
  routeConfigs: [
    {
      key: 'store-route',
      label: '商店路由',
      path: 'store/path',
      handle: { layout: { module: 'store' } },
    },
    {
      key: 'studio-route',
      label: '工作室路由',
      path: 'studio/path',
      handle: { layout: { module: 'studio' } },
    },
  ],
}))
vi.mock('@/routes/utils', () => ({
  getRouteSidebarMode: () => 'menu',
  isRouteVisibleForRoles: () => true,
}))
vi.mock('@/stores', () => ({
  usePreferenceStore: () => ({
    wenshuAppInfo: { key: 'ws', name: '问数', icon: 'i' },
    pinnedMicroApps: [{ key: 'app1', name: '应用1', icon: 'x' }],
    unpinMicroApp: vi.fn(),
  }),
}))
vi.mock('@/components/AppIcon', () => ({
  default: ({ name }: { name: string }) => <span>{name}</span>,
}))
vi.mock('../GradientMaskIcon', () => ({
  MaskIcon: () => <span data-testid="mask-icon" />,
}))
vi.mock('@/assets/icons/icon_pin.svg?react', () => ({
  default: () => <span data-testid="pin-icon" />,
}))
vi.mock('@/assets/images/sider/aiStore.svg', () => ({ default: '/ai-store.svg' }))

import { StoreMenuSection } from '../StoreMenuSection'

describe('Sider/StoreMenuSection', () => {
  it('渲染 AI Store 子项并支持导航', () => {
    render(
      <StoreMenuSection
        collapsed={false}
        selectedKey="store-route"
        navigate={navigate}
        roleIds={new Set<string>()}
      />,
    )

    expect(screen.getByText('AI Store')).toBeInTheDocument()
    expect(screen.getByText('智能问数')).toBeInTheDocument()
    expect(screen.getByText('应用1')).toBeInTheDocument()
    expect(screen.getByText('商店路由')).toBeInTheDocument()

    fireEvent.click(screen.getByText('智能问数'))
    expect(navigate).toHaveBeenCalledWith('/application/ws')

    fireEvent.click(screen.getByText('商店路由'))
    expect(navigate).toHaveBeenCalledWith('/store/path')
  })
})
