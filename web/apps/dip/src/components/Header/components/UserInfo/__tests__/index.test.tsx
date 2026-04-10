import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const logout = vi.fn()

vi.mock('@/stores/userInfoStore', () => ({
  useUserInfoStore: () => ({
    userInfo: { vision_name: '测试用户' },
    logout,
  }),
}))

vi.mock('@/assets/images/sider/avatar.svg?react', () => ({
  default: () => <span data-testid="avatar-svg" />,
}))

import { UserInfo } from '../index'

describe('Header/UserInfo', () => {
  it('展示用户名', () => {
    render(<UserInfo />)
    expect(screen.getByTitle('测试用户')).toBeInTheDocument()
    expect(screen.getByText('测试用户')).toBeInTheDocument()
  })

  it('展开下拉后点击退出登录会调用 logout', async () => {
    const { container } = render(<UserInfo />)
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
