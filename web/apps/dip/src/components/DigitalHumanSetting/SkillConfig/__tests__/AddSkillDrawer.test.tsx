vi.mock('../../../../components/DipChatKit', () => ({
  default: () => <div data-testid="dip-chat-kit" />,
}))

vi.mock('../../../../components/DipChatKit/index.module.less', () => ({
  default: {},
}))

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import AddSkillDrawer from '../AddSkillDrawer'

const mockOnClose = vi.fn()

vi.mock('@/components/IconFont', () => ({
  default: () => <span data-testid="icon-font" />,
}))

describe('DigitalHumanSetting/SkillConfig/AddSkillDrawer', () => {
  it('应该正确渲染关闭按钮和标题', () => {
    render(<AddSkillDrawer open onClose={mockOnClose} />)

    expect(screen.getByTestId('dip-chat-kit')).toBeInTheDocument()
    expect(screen.getByText('新建技能')).toBeInTheDocument()
  })

  it('应该使用传入的 payload 内容作为标题', () => {
    render(<AddSkillDrawer open onClose={mockOnClose} payload={{ content: '自定义技能' }} />)

    expect(screen.getByText('自定义技能')).toBeInTheDocument()
  })

  it('点击关闭按钮调用 onClose', () => {
    render(<AddSkillDrawer open onClose={mockOnClose} />)

    const closeBtn = screen.getByRole('button')
    fireEvent.click(closeBtn)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('关闭时不显示内容', () => {
    render(<AddSkillDrawer open={false} onClose={mockOnClose} />)

    expect(screen.queryByTestId('dip-chat-kit')).not.toBeInTheDocument()
  })
})
