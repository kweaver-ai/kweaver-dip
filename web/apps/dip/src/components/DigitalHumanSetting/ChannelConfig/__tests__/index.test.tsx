import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useDigitalHumanStore } from '../../digitalHumanStore'
import ChannelConfig from '../index'

const mockUpdateChannel = vi.fn()
const mockDeleteChannel = vi.fn()

vi.mock('../../digitalHumanStore', () => ({
  useDigitalHumanStore: vi.fn(),
}))

vi.mock('@/components/ScrollBarContainer', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="scroll-bar-container">{children}</div>
  ),
}))

vi.mock('../AddChannelModal', () => ({
  default: () => <div data-testid="add-channel-modal" />,
}))

vi.mock('@/components/IconFont', () => ({
  default: () => <span />,
}))

vi.mock('@/assets/icons/dingding.svg', () => ({
  default: '',
}))

vi.mock('@/assets/icons/feishu.svg', () => ({
  default: '',
}))

const mockedUseDigitalHumanStore = vi.mocked(useDigitalHumanStore)

describe('DigitalHumanSetting/ChannelConfig', () => {
  it('应该正确渲染空状态，显示添加按钮', () => {
    mockedUseDigitalHumanStore.mockReturnValue({
      channel: null,
      updateChannel: mockUpdateChannel,
      deleteChannel: mockDeleteChannel,
    })

    render(<ChannelConfig />)

    expect(screen.getByText('通道接入')).toBeInTheDocument()
    expect(screen.getByText('配置数字员工可接入的通信通道，如钉钉、飞书等。')).toBeInTheDocument()
    expect(screen.getByText('暂无通道')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /通道/ })).toBeInTheDocument()
  })

  it('只读模式不显示添加按钮', () => {
    mockedUseDigitalHumanStore.mockReturnValue({
      channel: null,
      updateChannel: mockUpdateChannel,
      deleteChannel: mockDeleteChannel,
    })

    render(<ChannelConfig readonly />)

    expect(screen.queryByRole('button', { name: /通道/ })).not.toBeInTheDocument()
  })

  it('已有通道时应该正确渲染表格', () => {
    mockedUseDigitalHumanStore.mockReturnValue({
      channel: {
        type: 'feishu',
        appId: 'test-app-id',
        appSecret: 'test-app-secret',
      },
      updateChannel: mockUpdateChannel,
      deleteChannel: mockDeleteChannel,
    })

    render(<ChannelConfig />)

    expect(screen.getByText('飞书')).toBeInTheDocument()
    expect(screen.getByText('用于在飞书客户端接收消息，处理事务')).toBeInTheDocument()
    // 移除按钮只有图标没有文字，通过获取所有按钮找到它
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(2) // 移除按钮 + 添加通道按钮
    expect(screen.getByRole('button', { name: /通道/ })).toBeInTheDocument()
  })

  it('只读模式不显示操作列', () => {
    mockedUseDigitalHumanStore.mockReturnValue({
      channel: {
        type: 'feishu',
        appId: 'test-app-id',
        appSecret: 'test-app-secret',
      },
      updateChannel: mockUpdateChannel,
      deleteChannel: mockDeleteChannel,
    })

    render(<ChannelConfig readonly />)

    expect(screen.getByText('飞书')).toBeInTheDocument()
    expect(screen.queryByText('操作')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /移除/ })).not.toBeInTheDocument()
  })

  it('钉钉类型应该显示正确标签和描述', () => {
    mockedUseDigitalHumanStore.mockReturnValue({
      channel: {
        type: 'dingtalk',
        appId: 'test-app-id',
        appSecret: 'test-app-secret',
      },
      updateChannel: mockUpdateChannel,
      deleteChannel: mockDeleteChannel,
    })

    render(<ChannelConfig />)

    expect(screen.getByText('钉钉')).toBeInTheDocument()
    expect(screen.getByText('用于在钉钉客户端接收消息，处理事务')).toBeInTheDocument()
  })

  it('点击添加通道按钮应该打开弹窗', () => {
    mockedUseDigitalHumanStore.mockReturnValue({
      channel: {
        type: 'feishu',
        appId: 'test-app-id',
        appSecret: 'test-app-secret',
      },
      updateChannel: mockUpdateChannel,
      deleteChannel: mockDeleteChannel,
    })

    render(<ChannelConfig />)
    fireEvent.click(screen.getByRole('button', { name: /通道/ }))

    expect(screen.getByTestId('add-channel-modal')).toBeInTheDocument()
  })

  it('点击删除按钮应该调用 deleteChannel', () => {
    mockedUseDigitalHumanStore.mockReturnValue({
      channel: {
        type: 'feishu',
        appId: 'test-app-id',
        appSecret: 'test-app-secret',
      },
      updateChannel: mockUpdateChannel,
      deleteChannel: mockDeleteChannel,
    })

    render(<ChannelConfig />)
    // 移除按钮在第一个位置（操作列）
    const buttons = screen.getAllByRole('button')
    const removeBtn = buttons.find((btn) => !btn.textContent)
    if (removeBtn === undefined) {
      throw new Error('expected remove button in operation column')
    }
    fireEvent.click(removeBtn)

    expect(mockDeleteChannel).toHaveBeenCalled()
  })
})
