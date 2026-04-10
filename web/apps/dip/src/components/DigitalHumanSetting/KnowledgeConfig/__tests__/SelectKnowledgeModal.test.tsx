import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { BknKnowledgeNetworkInfo } from '@/apis'
import { getBknKnowledgeNetworks } from '@/apis'
import SelectKnowledgeModal from '../SelectKnowledgeModal'

const mockOnOk = vi.fn()
const mockOnCancel = vi.fn()

vi.mock('@/apis', () => ({
  getBknKnowledgeNetworks: vi.fn(),
}))

vi.mock('@/components/AppIcon', () => ({
  default: ({ name }: { name: string }) => <span data-testid="app-icon">{name}</span>,
}))

vi.mock('@/components/ScrollBarContainer', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="scroll-bar-container">{children}</div>
  ),
}))

const mockedGetBknKnowledgeNetworks = vi.mocked(getBknKnowledgeNetworks)

describe('DigitalHumanSetting/KnowledgeConfig/SelectKnowledgeModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockKnowledgeList: BknKnowledgeNetworkInfo[] = [
    {
      id: 'bkn-1',
      name: '产品知识库',
      comment: '这是产品相关的知识',
      update_time: 1715136000,
    },
    {
      id: 'bkn-2',
      name: '技术知识库',
      comment: '这是技术相关的知识',
      update_time: 1715136000,
    },
  ]

  it('弹窗打开时获取知识列表', async () => {
    mockedGetBknKnowledgeNetworks.mockResolvedValue({
      entries: mockKnowledgeList,
      total_count: 2,
    })

    render(
      <SelectKnowledgeModal open onOk={mockOnOk} onCancel={mockOnCancel} defaultSelectedIds={[]} />,
    )

    expect(screen.getByText('添加知识')).toBeInTheDocument()
    expect(await screen.findAllByText('产品知识库')).toHaveLength(2) // AppIcon 和标题
    expect(await screen.findAllByText('技术知识库')).toHaveLength(2)
    expect(screen.getByText('这是产品相关的知识')).toBeInTheDocument()
  })

  it('显示空状态当没有知识', async () => {
    mockedGetBknKnowledgeNetworks.mockResolvedValue({
      entries: [],
      total_count: 0,
    })

    render(
      <SelectKnowledgeModal open onOk={mockOnOk} onCancel={mockOnCancel} defaultSelectedIds={[]} />,
    )

    expect(await screen.findByText('暂无知识')).toBeInTheDocument()
  })

  it('加载失败显示错误状态', async () => {
    mockedGetBknKnowledgeNetworks.mockRejectedValue(new Error('网络错误'))

    render(
      <SelectKnowledgeModal open onOk={mockOnOk} onCancel={mockOnCancel} defaultSelectedIds={[]} />,
    )

    expect(await screen.findByText('加载失败')).toBeInTheDocument()
  })

  it('默认选中正确的知识项', async () => {
    mockedGetBknKnowledgeNetworks.mockResolvedValue({
      entries: mockKnowledgeList,
      total_count: 2,
    })

    render(
      <SelectKnowledgeModal
        open
        onOk={mockOnOk}
        onCancel={mockOnCancel}
        defaultSelectedIds={['bkn-1']}
      />,
    )

    await screen.findAllByText('产品知识库')
    const checkboxes = await screen.findAllByRole('checkbox')
    expect(checkboxes[0]).toBeChecked()
    expect(checkboxes[1]).not.toBeChecked()
  })

  it('可以点击选择和取消选择知识', async () => {
    mockedGetBknKnowledgeNetworks.mockResolvedValue({
      entries: mockKnowledgeList,
      total_count: 2,
    })

    render(
      <SelectKnowledgeModal open onOk={mockOnOk} onCancel={mockOnCancel} defaultSelectedIds={[]} />,
    )

    await screen.findAllByText('产品知识库')
    // 获取所有产品知识库文本，找到第二个（在标题中），向上找到 button
    const productTexts = screen.getAllByText('产品知识库')
    const productCard = productTexts[1].closest('button')
    if (productCard === null) {
      throw new Error('expected knowledge card button')
    }
    fireEvent.click(productCard)

    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes[0]).toBeChecked()

    // 再次点击取消选择
    fireEvent.click(productCard)
    expect(checkboxes[0]).not.toBeChecked()
  })

  it('点击复选框可以选择知识', async () => {
    mockedGetBknKnowledgeNetworks.mockResolvedValue({
      entries: mockKnowledgeList,
      total_count: 2,
    })

    render(
      <SelectKnowledgeModal open onOk={mockOnOk} onCancel={mockOnCancel} defaultSelectedIds={[]} />,
    )

    await screen.findAllByText('产品知识库')
    const checkbox = (await screen.findAllByRole('checkbox'))[0]
    fireEvent.click(checkbox)

    expect(checkbox).toBeChecked()
  })

  it('点击确定传递选中数据并关闭', async () => {
    mockedGetBknKnowledgeNetworks.mockResolvedValue({
      entries: mockKnowledgeList,
      total_count: 2,
    })

    render(
      <SelectKnowledgeModal open onOk={mockOnOk} onCancel={mockOnCancel} defaultSelectedIds={[]} />,
    )

    await screen.findAllByText('产品知识库')
    const productTexts = screen.getAllByText('产品知识库')
    const productCard = productTexts[1].closest('button')
    if (productCard === null) {
      throw new Error('expected knowledge card button')
    }
    fireEvent.click(productCard)

    const buttons = screen.getAllByRole('button')
    // buttons: close button (1), knowledge card buttons (N), then ok and cancel at the end
    // Last button is cancel, previous is ok
    const okBtn = buttons[buttons.length - 2]
    fireEvent.click(okBtn)

    await waitFor(() => {
      expect(mockOnOk).toHaveBeenCalledWith([mockKnowledgeList[0]])
      expect(mockOnCancel).toHaveBeenCalled()
    })
  })

  it('点击取消调用 onCancel', async () => {
    mockedGetBknKnowledgeNetworks.mockResolvedValue({
      entries: mockKnowledgeList,
      total_count: 2,
    })

    render(
      <SelectKnowledgeModal open onOk={mockOnOk} onCancel={mockOnCancel} defaultSelectedIds={[]} />,
    )

    await screen.findAllByText('产品知识库')
    const buttons = screen.getAllByRole('button')
    // Last button is cancel
    const cancelBtn = buttons[buttons.length - 1]
    fireEvent.click(cancelBtn)

    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('关闭弹窗不获取数据', () => {
    render(
      <SelectKnowledgeModal
        open={false}
        onOk={mockOnOk}
        onCancel={mockOnCancel}
        defaultSelectedIds={[]}
      />,
    )

    expect(mockedGetBknKnowledgeNetworks).not.toHaveBeenCalled()
  })
})
