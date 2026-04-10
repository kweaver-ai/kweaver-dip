import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/assets/images/abnormal/empty.svg', () => ({ default: 'https://mock/empty.svg' }))
vi.mock('@/assets/images/abnormal/loadFailed.png', () => ({ default: 'https://mock/failed.png' }))
vi.mock('@/assets/images/abnormal/searchEmpty.svg', () => ({ default: 'https://mock/search.svg' }))

import Empty from '../index'

describe('Empty', () => {
  it('渲染 title、desc、subDesc 与 children', () => {
    render(
      <Empty title="主标题" desc="说明" subDesc="副说明">
        <button type="button">操作</button>
      </Empty>,
    )
    expect(screen.getByText('主标题')).toBeInTheDocument()
    expect(screen.getByText('说明')).toBeInTheDocument()
    expect(screen.getByText('副说明')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '操作' })).toBeInTheDocument()
  })

  it('type=failed 使用加载失败图', () => {
    const { container } = render(<Empty type="failed" />)
    const img = container.querySelector('img')
    expect(img?.getAttribute('src')).toBe('https://mock/failed.png')
  })

  it('type=search 使用搜索空态图', () => {
    const { container } = render(<Empty type="search" />)
    const img = container.querySelector('img')
    expect(img?.getAttribute('src')).toBe('https://mock/search.svg')
  })

  it('iconSrc 优先于 type', () => {
    const { container } = render(<Empty type="search" iconSrc="https://custom/icon.png" />)
    const img = container.querySelector('img')
    expect(img?.getAttribute('src')).toBe('https://custom/icon.png')
  })
})
