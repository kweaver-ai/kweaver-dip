import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useDigitalHumanStore } from '../../digitalHumanStore'
import KnowledgeConfig from '../index'

const mockUpdateBkn = vi.fn()
const mockDeleteBkn = vi.fn()

vi.mock('../../digitalHumanStore', () => ({
  useDigitalHumanStore: vi.fn(),
}))

vi.mock('@/components/ScrollBarContainer', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="scroll-bar-container">{children}</div>
  ),
}))

vi.mock('../SelectKnowledgeModal', () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div data-testid="select-knowledge-modal" /> : null,
}))

vi.mock('@/components/AppIcon', () => ({
  default: ({ name }: { name: string }) => <span data-testid="app-icon">{name}</span>,
}))

vi.mock('@/components/IconFont', () => ({
  default: () => <span data-testid="icon-font" />,
}))

const mockedUseDigitalHumanStore = vi.mocked(useDigitalHumanStore)

describe('DigitalHumanSetting/KnowledgeConfig', () => {
  it('应该正确渲染空状态，显示添加知识按钮', () => {
    mockedUseDigitalHumanStore.mockReturnValue({
      bkn: [],
      updateBkn: mockUpdateBkn,
      deleteBkn: mockDeleteBkn,
    })

    render(<KnowledgeConfig />)

    expect(screen.getByText('知识配置')).toBeInTheDocument()
    expect(
      screen.getByText(
        '选择该数字员工需要关联的业务知识网络（BKN）。数字员工将基于这些知识网络回答问题和执行任务。',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('暂无知识')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /知识/ })).toBeInTheDocument()
  })

  it('只读模式空状态不显示添加按钮', () => {
    mockedUseDigitalHumanStore.mockReturnValue({
      bkn: [],
      updateBkn: mockUpdateBkn,
      deleteBkn: mockDeleteBkn,
    })

    render(<KnowledgeConfig readonly />)

    expect(screen.getByText('暂无知识')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /知识/ })).not.toBeInTheDocument()
  })

  it('已有知识时应该正确渲染表格', () => {
    mockedUseDigitalHumanStore.mockReturnValue({
      bkn: [{ name: '业务知识A', url: 'bkn-id-1' }],
      updateBkn: mockUpdateBkn,
      deleteBkn: mockDeleteBkn,
    })

    render(<KnowledgeConfig />)

    expect(screen.getAllByText('业务知识A').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('bkn-id-1')).toBeInTheDocument()
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThanOrEqual(2)
    expect(screen.getByRole('button', { name: /知识/ })).toBeInTheDocument()
  })

  it('只读模式不显示操作列', () => {
    mockedUseDigitalHumanStore.mockReturnValue({
      bkn: [{ name: '业务知识A', url: 'bkn-id-1' }],
      updateBkn: mockUpdateBkn,
      deleteBkn: mockDeleteBkn,
    })

    render(<KnowledgeConfig readonly />)

    expect(screen.getAllByText('业务知识A').length).toBeGreaterThanOrEqual(1)
    expect(screen.queryByText('操作')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /知识/ })).not.toBeInTheDocument()
  })

  it('点击添加知识按钮应该打开弹窗', () => {
    mockedUseDigitalHumanStore.mockReturnValue({
      bkn: [{ name: '业务知识A', url: 'bkn-id-1' }],
      updateBkn: mockUpdateBkn,
      deleteBkn: mockDeleteBkn,
    })

    render(<KnowledgeConfig />)
    fireEvent.click(screen.getByRole('button', { name: /知识/ }))

    expect(screen.getByTestId('select-knowledge-modal')).toBeInTheDocument()
  })

  it('空状态下点击添加知识应该打开弹窗', () => {
    mockedUseDigitalHumanStore.mockReturnValue({
      bkn: [],
      updateBkn: mockUpdateBkn,
      deleteBkn: mockDeleteBkn,
    })

    render(<KnowledgeConfig />)
    fireEvent.click(screen.getByRole('button', { name: /知识/ }))

    expect(screen.getByTestId('select-knowledge-modal')).toBeInTheDocument()
  })

  it('点击移除按钮应该调用 deleteBkn', () => {
    mockedUseDigitalHumanStore.mockReturnValue({
      bkn: [{ name: '业务知识A', url: 'bkn-id-1' }],
      updateBkn: mockUpdateBkn,
      deleteBkn: mockDeleteBkn,
    })

    render(<KnowledgeConfig />)
    const buttons = screen.getAllByRole('button')
    const removeBtn = buttons.find((btn) => !btn.textContent?.trim())
    if (removeBtn === undefined) {
      throw new Error('expected remove button in operation column')
    }
    fireEvent.click(removeBtn)

    expect(mockDeleteBkn).toHaveBeenCalledWith('bkn-id-1')
  })
})
