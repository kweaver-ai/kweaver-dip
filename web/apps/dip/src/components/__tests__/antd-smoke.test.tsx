import { render, screen } from '@testing-library/react'
import { Button } from 'antd'
import { describe, expect, it, vi } from 'vitest'

/**
 * 阶段 4：验证 jsdom + Ant Design 6（CSS-in-JS）可正常挂载与交互。
 */
describe('Ant Design 组件（冒烟）', () => {
  it('Button 渲染与点击', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>确定</Button>)
    // Ant Design 6 按钮文案在可访问名称中可能带字间空格（如「确 定」）
    screen.getByRole('button', { name: /确\s*定/ }).click()
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
