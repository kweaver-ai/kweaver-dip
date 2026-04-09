import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/assets/images/gradient-container-bg.png', () => ({
  default: 'https://mock/gradient-bg.png',
}))

import GradientContainer from '../index'

describe('GradientContainer', () => {
  it('渲染子节点并注入背景图', () => {
    const { container } = render(
      <GradientContainer className="custom">
        <span>内容区</span>
      </GradientContainer>,
    )
    expect(screen.getByText('内容区')).toBeInTheDocument()
    const root = container.firstChild as HTMLElement
    expect(root.style.backgroundImage).toContain('https://mock/gradient-bg.png')
    expect(root.className).toContain('custom')
  })
})
