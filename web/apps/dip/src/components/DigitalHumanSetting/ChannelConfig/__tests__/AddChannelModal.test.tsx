import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import AddChannelModal from '../AddChannelModal'

describe('DigitalHumanSetting/ChannelConfig/AddChannelModal', () => {
  const mockOnOk = vi.fn()
  const mockOnCancel = vi.fn()

  it('弹窗打开时默认选中飞书', () => {
    render(<AddChannelModal open onOk={mockOnOk} onCancel={mockOnCancel} />)

    expect(screen.getByText('飞书机器人')).toBeInTheDocument()
    expect(screen.getAllByRole('radio')[0]).toBeChecked()
    expect(screen.getByText('飞书机器人配置')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('请输入飞书应用 App Key')).toBeInTheDocument()
  })

  it('可以切换选中钉钉', () => {
    render(<AddChannelModal open onOk={mockOnOk} onCancel={mockOnCancel} />)

    fireEvent.click(screen.getByText('钉钉机器人'))

    expect(screen.getAllByRole('radio')[1]).toBeChecked()
    expect(screen.getByText('钉钉机器人配置')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('请输入钉钉应用 App Key')).toBeInTheDocument()
  })

  it('点击取消按钮调用 onCancel', () => {
    render(<AddChannelModal open onOk={mockOnOk} onCancel={mockOnCancel} />)

    const buttons = screen.getAllByRole('button')
    // 0: feishu, 1: dingtalk, 2: test connection, 3: ok, 4: reset, 5: cancel
    // ok test and cancel test confirm this ordering
    const cancelBtn = buttons[5]
    fireEvent.click(cancelBtn)

    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('点击重置按钮清空表单', async () => {
    render(<AddChannelModal open onOk={mockOnOk} onCancel={mockOnCancel} />)

    let apiKeyInput = screen.getByLabelText(/API Key/)
    let apiSecretInput = screen.getByLabelText(/API Secret/)
    fireEvent.change(apiKeyInput, { target: { value: 'test-id' } })
    fireEvent.change(apiSecretInput, { target: { value: 'test-secret' } })

    expect(apiKeyInput).toHaveValue('test-id')
    expect(apiSecretInput).toHaveValue('test-secret')

    const buttons = screen.getAllByRole('button')
    // 0: feishu, 1: dingtalk, 2: test connection, 3: ok, 4: reset, 5: cancel
    // ok test and cancel test confirm this ordering
    const resetBtn = buttons[4]
    fireEvent.click(resetBtn)

    await waitFor(() => {
      apiKeyInput = screen.getByLabelText(/API Key/)
      apiSecretInput = screen.getByLabelText(/API Secret/)
      expect(apiKeyInput).toHaveValue('')
      expect(apiSecretInput).toHaveValue('')
    })
  })

  it('表单为空时点击确定不调用 onOk', async () => {
    render(<AddChannelModal open onOk={mockOnOk} onCancel={mockOnCancel} />)

    const buttons = screen.getAllByRole('button')
    // 0: feishu, 1: dingtalk, 2: test connection, 3: ok, 4: reset, 5: cancel
    const okBtn = buttons[3]
    fireEvent.click(okBtn)

    await waitFor(() => {
      expect(mockOnOk).not.toHaveBeenCalled()
    })
  })

  it('填写完整信息后点击确定调用 onOk 传递正确数据', async () => {
    render(<AddChannelModal open onOk={mockOnOk} onCancel={mockOnCancel} />)

    const apiKeyInput = screen.getByLabelText(/API Key/)
    const apiSecretInput = screen.getByLabelText(/API Secret/)
    fireEvent.change(apiKeyInput, { target: { value: 'test-app-id' } })
    fireEvent.change(apiSecretInput, { target: { value: 'test-app-secret' } })

    const buttons = screen.getAllByRole('button')
    // 0: feishu, 1: dingtalk, 2: test connection, 3: ok, 4: reset, 5: cancel
    const okBtn = buttons[3]
    fireEvent.click(okBtn)

    await waitFor(() => {
      expect(mockOnOk).toHaveBeenCalledWith({
        type: 'feishu',
        appId: 'test-app-id',
        appSecret: 'test-app-secret',
      })
      expect(mockOnCancel).toHaveBeenCalled()
    })
  })

  it('钉钉类型填写完整信息后调用 onOk 传递正确数据', async () => {
    render(<AddChannelModal open onOk={mockOnOk} onCancel={mockOnCancel} />)

    fireEvent.click(screen.getByText('钉钉机器人'))
    const apiKeyInput = screen.getByLabelText(/API Key/)
    const apiSecretInput = screen.getByLabelText(/API Secret/)
    fireEvent.change(apiKeyInput, { target: { value: 'dingtalk-id' } })
    fireEvent.change(apiSecretInput, { target: { value: 'dingtalk-secret' } })

    const buttons = screen.getAllByRole('button')
    // 0: feishu, 1: dingtalk, 2: test connection, 3: ok, 4: reset, 5: cancel
    const okBtn = buttons[3]
    fireEvent.click(okBtn)

    await waitFor(() => {
      expect(mockOnOk).toHaveBeenCalledWith({
        type: 'dingtalk',
        appId: 'dingtalk-id',
        appSecret: 'dingtalk-secret',
      })
    })
  })

  it('关闭弹窗时重置选中和表单', () => {
    const { rerender } = render(<AddChannelModal open onOk={mockOnOk} onCancel={mockOnCancel} />)

    fireEvent.click(screen.getByText('钉钉机器人'))
    let apiKeyInput = screen.getByLabelText(/API Key/)
    fireEvent.change(apiKeyInput, { target: { value: 'test-id' } })

    rerender(<AddChannelModal open={false} onOk={mockOnOk} onCancel={mockOnCancel} />)
    rerender(<AddChannelModal open onOk={mockOnOk} onCancel={mockOnCancel} />)

    apiKeyInput = screen.getByLabelText(/API Key/)
    expect(screen.getAllByRole('radio')[0]).toBeChecked()
    expect(apiKeyInput).toHaveValue('')
  })
})
