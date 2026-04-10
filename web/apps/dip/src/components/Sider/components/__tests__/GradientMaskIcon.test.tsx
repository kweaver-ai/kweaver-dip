import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { GradientMaskIcon, MaskIcon } from '../GradientMaskIcon'

describe('Sider/GradientMaskIcon', () => {
  it('MaskIcon 设置 mask 与 background', () => {
    const { container } = render(<MaskIcon url="https://example.com/i.png" background="#fff" />)
    const span = container.querySelector('span')
    expect(span).not.toBeNull()
    expect(span?.style.maskImage).toContain('https://example.com/i.png')
    expect(span?.style.background).toMatch(/#fff|rgb\(255,\s*255,\s*255\)/)
  })

  it('GradientMaskIcon 使用渐变背景与 mask', () => {
    const { container } = render(<GradientMaskIcon url="/a.svg" />)
    const span = container.querySelector('span')
    expect(span).not.toBeNull()
    expect(span).toHaveStyle({
      background: expect.stringContaining('linear-gradient'),
    })
    expect(span?.style.maskImage).toContain('/a.svg')
  })
})
