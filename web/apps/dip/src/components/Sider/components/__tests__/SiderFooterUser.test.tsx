import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/components/IconFont', () => ({
  default: () => <span data-testid="icon-sidebar" />,
}))
vi.mock('../UserMenuItem', () => ({
  UserMenuItem: ({ collapsed }: { collapsed: boolean }) => (
    <div data-testid={collapsed ? 'user-menu-collapsed' : 'user-menu-expanded'} />
  ),
}))

import { SiderFooterUser } from '../SiderFooterUser'

describe('Sider/SiderFooterUser', () => {
  it('折叠态点击展开按钮触发 onCollapse(false)', () => {
    const onCollapse = vi.fn()
    render(<SiderFooterUser collapsed onCollapse={onCollapse} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onCollapse).toHaveBeenCalledWith(false)
    expect(screen.getByTestId('user-menu-collapsed')).toBeInTheDocument()
  })

  it('展开态点击收起按钮触发 onCollapse(true)', () => {
    const onCollapse = vi.fn()
    render(<SiderFooterUser collapsed={false} onCollapse={onCollapse} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onCollapse).toHaveBeenCalledWith(true)
    expect(screen.getByTestId('user-menu-expanded')).toBeInTheDocument()
  })
})
