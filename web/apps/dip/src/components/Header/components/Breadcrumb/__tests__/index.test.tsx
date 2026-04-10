import { fireEvent, render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/components/AppIcon', () => ({
  default: () => <span data-testid="app-icon" />,
}))
vi.mock('@/components/IconFont', () => ({
  default: () => <span data-testid="icon-font" />,
}))

import { Breadcrumb } from '../index'

type BreadcrumbProps = ComponentProps<typeof Breadcrumb>

function renderBreadcrumb(props: Partial<BreadcrumbProps> = {}) {
  const { type = 'store', ...rest } = props
  return render(
    <MemoryRouter>
      <Breadcrumb type={type} {...rest} />
    </MemoryRouter>,
  )
}

describe('Header/Breadcrumb', () => {
  it('展示首页返回与面包屑文案', () => {
    renderBreadcrumb({
      homePath: '/home',
      items: [
        { key: 'section', name: 'DIP Studio', disabled: true },
        { key: 'page', name: '当前页', path: '/x' },
      ],
    })
    expect(screen.getByTitle('DIP Studio')).toBeInTheDocument()
    expect(screen.getByTitle('当前页')).toBeInTheDocument()
  })

  it('点击带 path 的非最后一项时触发 onNavigate', () => {
    const onNavigate = vi.fn()
    renderBreadcrumb({
      homePath: '/',
      onNavigate,
      items: [
        { key: 'a', name: '列表', path: '/list' },
        { key: 'b', name: '详情', path: '/detail' },
      ],
    })
    fireEvent.click(screen.getByTitle('列表'))
    expect(onNavigate).toHaveBeenCalledTimes(1)
    expect(onNavigate.mock.calls[0][0]).toMatchObject({
      key: 'a',
      name: '列表',
      path: '/list',
    })
  })

  it('showHomeIcon 为 false 时不展示首页按钮', () => {
    renderBreadcrumb({
      showHomeIcon: false,
      homePath: '/',
      items: [{ key: 'only', name: '仅一项', path: '/p' }],
    })
    expect(screen.queryByTestId('icon-font')).not.toBeInTheDocument()
  })
})
