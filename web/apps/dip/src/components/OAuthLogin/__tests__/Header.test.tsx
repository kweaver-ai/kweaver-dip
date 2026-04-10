import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import Header from '../Header'

describe('OAuthLogin/Header', () => {
  it('渲染占位顶栏', () => {
    const { container } = render(<Header />)
    const root = container.firstChild as HTMLElement
    expect(root.tagName).toBe('DIV')
    expect(root.className).toContain('h-4')
  })
})
