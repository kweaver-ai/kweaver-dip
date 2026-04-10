import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import ScrollBarContainer from '../index'

describe('ScrollBarContainer', () => {
  it('渲染子元素', () => {
    render(
      <ScrollBarContainer>
        <div data-testid="test-content">测试内容</div>
      </ScrollBarContainer>,
    )
    expect(screen.getByTestId('test-content')).toBeInTheDocument()
    expect(screen.getByText('测试内容')).toBeInTheDocument()
    expect(screen.getByTestId('mac-scrollbar')).toBeInTheDocument()
  })

  it('转发 ref', () => {
    const ref = { current: null }
    render(
      <ScrollBarContainer ref={ref}>
        <div>内容</div>
      </ScrollBarContainer>,
    )
    expect(ref.current).not.toBeNull()
  })

  it('传递 props 给 MacScrollbar', () => {
    render(
      <ScrollBarContainer style={{ maxHeight: '200px' }} data-custom="test">
        <div>内容</div>
      </ScrollBarContainer>,
    )
    const scrollbar = screen.getByTestId('mac-scrollbar')
    expect(scrollbar).toHaveStyle('max-height: 200px')
    expect(scrollbar).toHaveAttribute('data-custom', 'test')
  })
})
