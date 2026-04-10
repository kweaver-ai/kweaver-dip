import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const { navigateMock, locationState, userInfoState } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  locationState: { pathname: '/' },
  userInfoState: { modules: ['studio', 'store'] as string[] },
}))

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
  useLocation: () => locationState,
}))

vi.mock('antd', () => ({
  message: { useMessage: () => [{}, <div key="msg-holder" />] },
}))

vi.mock('@/stores/userInfoStore', () => ({
  useUserInfoStore: (selector: (s: { modules: string[] }) => unknown) => selector(userInfoState),
}))
vi.mock('@/stores/languageStore', () => ({
  useLanguageStore: () => ({ language: 'zh-CN' }),
}))
vi.mock('@/stores/oemConfigStore', () => ({
  useOEMConfigStore: () => ({ getOEMResourceConfig: () => ({ 'logo.png': '/logo.png' }) }),
}))
vi.mock('@/routes/utils', () => ({
  getRouteByPath: () => ({ key: 'home' }),
}))

vi.mock('../../components/StudioMenuSection', () => ({
  StudioMenuSection: () => <div data-testid="studio-menu" />,
}))
vi.mock('../../components/StoreMenuSection', () => ({
  StoreMenuSection: () => <div data-testid="store-menu" />,
}))
vi.mock('../../components/ExternalLinksMenu', () => ({
  ExternalLinksSection: () => <div data-testid="external-links" />,
}))
vi.mock('../../components/SiderFooterUser', () => ({
  SiderFooterUser: () => <div data-testid="footer-user" />,
}))

import AdminSider from '../index'

describe('Sider/AdminSider', () => {
  it('按模块渲染 Studio/Store 区域', () => {
    userInfoState.modules = ['studio', 'store']
    render(<AdminSider collapsed={false} onCollapse={vi.fn()} layout="entry" />)
    expect(screen.getByTestId('studio-menu')).toBeInTheDocument()
    expect(screen.getByTestId('store-menu')).toBeInTheDocument()
    expect(screen.getByTestId('external-links')).toBeInTheDocument()
    expect(screen.getByTestId('footer-user')).toBeInTheDocument()
  })

  it('仅 store 模块时不渲染 Studio 菜单', () => {
    userInfoState.modules = ['store']
    render(<AdminSider collapsed={false} onCollapse={vi.fn()} layout="entry" />)
    expect(screen.queryByTestId('studio-menu')).not.toBeInTheDocument()
    expect(screen.getByTestId('store-menu')).toBeInTheDocument()
  })
})
