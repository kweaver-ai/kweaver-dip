import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const { navigateMock, locationState, userInfoState, workPlanState, historyState } = vi.hoisted(
  () => ({
    navigateMock: vi.fn(),
    locationState: { pathname: '/' },
    userInfoState: { modules: ['studio', 'store'] as string[] },
    workPlanState: {
      plans: [] as any[],
      total: 0,
      fetchPlans: vi.fn(async () => {}),
      refreshPlansOnFocus: vi.fn(async () => {}),
      pausePlan: vi.fn(async () => true),
      resumePlan: vi.fn(async () => true),
      deletePlan: vi.fn(async () => true),
      selectedPlanId: undefined as string | undefined,
      setSelectedPlanId: vi.fn(),
    },
    historyState: {
      sessions: [] as any[],
      total: 0,
      fetchSessions: vi.fn(async () => {}),
      refreshSessionsOnFocus: vi.fn(async () => {}),
      selectedSessionKey: undefined as string | undefined,
      setSelectedSessionKey: vi.fn(),
      deleteHistorySession: vi.fn(async () => true),
    },
  }),
)

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
  useLocation: () => locationState,
  createSearchParams: (obj: Record<string, string>) => new URLSearchParams(obj),
}))

vi.mock('antd', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  message: { useMessage: () => [{}, <div key="msg-holder" />] },
  Modal: { useModal: () => [{ confirm: vi.fn() }, <div key="modal-holder" />] },
}))

vi.mock('@/stores/userInfoStore', () => ({
  useUserInfoStore: (selector: (s: { modules: string[] }) => unknown) => selector(userInfoState),
}))
vi.mock('@/stores/userWorkPlanStore', () => ({
  useUserWorkPlanStore: () => workPlanState,
}))
vi.mock('@/stores/userHistoryStore', () => ({
  useUserHistoryStore: () => historyState,
}))
vi.mock('@/stores/languageStore', () => ({
  useLanguageStore: () => ({ language: 'zh-CN' }),
}))
vi.mock('@/stores/oemConfigStore', () => ({
  useOEMConfigStore: () => ({ getOEMResourceConfig: () => ({ 'logo.png': '/logo.png' }) }),
}))

vi.mock('@/routes/utils', () => ({
  getRouteByPath: (pathname: string) =>
    pathname === '/studio/conversation' ? { key: 'studio-conversation' } : { key: 'home' },
}))

vi.mock('@/assets/images/sider/chat.svg?react', () => ({
  default: () => <span data-testid="chat-icon" />,
}))
vi.mock('@/assets/favicons/dip.png', () => ({ default: '/dip.png' }))

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
  SiderFooterUser: ({ onCollapse }: { onCollapse: (v: boolean) => void }) => (
    <button type="button" onClick={() => onCollapse(true)}>
      footer
    </button>
  ),
}))
vi.mock('../../components/WorkPlanSection', () => ({
  WorkPlanSection: () => <div data-testid="work-plan" />,
}))
vi.mock('../../components/HistorySection', () => ({
  HistorySection: () => <div data-testid="history-section" />,
}))

import HomeSider from '../index'

describe('Sider/HomeSider', () => {
  it('根据模块渲染 studio/store 区域并触发初始化拉取', async () => {
    userInfoState.modules = ['studio', 'store']
    workPlanState.plans = [{ id: 'p1' }]
    workPlanState.total = 10
    historyState.sessions = [{ key: 's1' }]
    historyState.total = 8

    render(<HomeSider collapsed={false} onCollapse={vi.fn()} layout="entry" />)

    expect(screen.getByTestId('studio-menu')).toBeInTheDocument()
    expect(screen.getByTestId('store-menu')).toBeInTheDocument()
    expect(screen.getByTestId('external-links')).toBeInTheDocument()
    expect(screen.getByTestId('work-plan')).toBeInTheDocument()
    expect(screen.getByTestId('history-section')).toBeInTheDocument()

    await waitFor(() => {
      expect(workPlanState.fetchPlans).toHaveBeenCalled()
      expect(historyState.fetchSessions).toHaveBeenCalled()
    })
  })

  it('点击会话按钮跳转 /home', () => {
    userInfoState.modules = ['studio']
    locationState.pathname = '/studio/conversation'

    render(<HomeSider collapsed={false} onCollapse={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /会话/ }))
    expect(navigateMock).toHaveBeenCalledWith('/home')
  })
})
