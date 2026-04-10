import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { BUSINESS_NETWORK_BASE_PATH } from '@/components/Sider/BusinessSider/menus'
import { getFullPath } from '@/utils/config'

vi.mock('@/utils/http/token-config', () => ({
  getAccessToken: () => 'token',
  getRefreshToken: () => 'refresh',
}))
vi.mock('@/components/IconFont', () => ({
  default: () => <span data-testid="icon-font" />,
}))
vi.mock('@/assets/images/sider/proton.svg?react', () => ({
  default: () => <span data-testid="system-icon" />,
}))

import { ExternalLinksSection } from '../ExternalLinksMenu'

describe('Sider/ExternalLinksMenu', () => {
  it('渲染两个外链并带正确 href', () => {
    render(<ExternalLinksSection collapsed={false} />)
    const sso = screen.getByRole('link', { name: /全局业务知识网络/ })
    const deploy = screen.getByRole('link', { name: /系统工作台/ })

    expect(sso).toHaveAttribute('href', getFullPath(BUSINESS_NETWORK_BASE_PATH))
    expect(deploy).toHaveAttribute('href', `${window.location.origin}/deploy`)
    expect(sso).toHaveAttribute('target', '_blank')
    expect(deploy).toHaveAttribute('rel', 'noopener noreferrer')
  })
})
