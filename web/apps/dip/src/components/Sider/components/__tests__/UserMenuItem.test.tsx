import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const logout = vi.fn()

vi.mock('@/stores', () => ({
  useUserInfoStore: () => ({
    userInfo: {
      email: 'user@example.com',
      vision_name: '展示名',
      account: 'acc',
    },
    logout,
  }),
}))

vi.mock('@/assets/images/sider/avatar.svg?react', () => ({
  default: () => <span data-testid="avatar-svg" />,
}))

import { UserMenuItem } from '../UserMenuItem'

describe('Sider/UserMenuItem', () => {
  it('未折叠时优先展示 email 作为展示名', () => {
    render(<UserMenuItem collapsed={false} />)
    expect(screen.getByTitle('user@example.com')).toBeInTheDocument()
  })

  it('折叠时不展示用户名文案', () => {
    render(<UserMenuItem collapsed />)
    expect(screen.queryByTitle('user@example.com')).not.toBeInTheDocument()
  })

  it('下拉菜单退出登录调用 logout', async () => {
    const { container } = render(<UserMenuItem collapsed={false} />)
    const trigger = container.querySelector('.ant-dropdown-trigger')
    if (!trigger) throw new Error('expected .ant-dropdown-trigger')
    fireEvent.click(trigger)

    await waitFor(() => {
      expect(document.body.querySelector('.ant-dropdown-menu')).toBeTruthy()
    })
    fireEvent.click(screen.getByText('退出登录'))
    expect(logout).toHaveBeenCalledTimes(1)
  })
})
