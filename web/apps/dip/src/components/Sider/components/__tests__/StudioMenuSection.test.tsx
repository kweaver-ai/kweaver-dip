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
        </div>
      )
    })
  return {
    Menu: ({ items }: { items?: any[] }) => <div>{renderItems(items)}</div>,
  }
})

vi.mock('@/routes/routes', () => ({
  routeConfigs: [
    {
      key: 'grouped-a',
      label: '分组A',
      path: 'studio/a',
      group: '分组',
      handle: { layout: { module: 'studio' } },
    },
    {
      key: 'plain-b',
      label: '普通B',
      path: 'studio/b',
      handle: { layout: { module: 'studio' } },
    },
  ],
}))
vi.mock('@/routes/utils', () => ({
  getRouteSidebarMode: () => 'menu',
  isRouteVisibleForRoles: () => true,
}))
vi.mock('../GradientMaskIcon', () => ({
  MaskIcon: () => <span data-testid="mask-icon" />,
}))

import { StudioMenuSection } from '../StudioMenuSection'

describe('Sider/StudioMenuSection', () => {
  it('渲染分组与菜单项，并点击导航', () => {
    render(
      <StudioMenuSection
        collapsed={false}
        selectedKey="grouped-a"
        navigate={navigate}
        roleIds={new Set<string>()}
      />,
    )

    expect(screen.getByText('分组')).toBeInTheDocument()
    expect(screen.getByText('分组A')).toBeInTheDocument()
    expect(screen.getByText('普通B')).toBeInTheDocument()

    fireEvent.click(screen.getByText('分组A'))
    expect(navigate).toHaveBeenCalledWith('/studio/a')
  })
})
