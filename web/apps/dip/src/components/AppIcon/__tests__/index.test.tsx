import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import AppIcon from '../index'

describe('AppIcon', () => {
  it('无 icon 时 Avatar 显示名称首字', () => {
    render(<AppIcon name="测试应用" />)
    expect(screen.getByText('测')).toBeInTheDocument()
  })

  it('内置且无 icon 时仍回退为名称首字', () => {
    render(<AppIcon name="App" isBuiltIn />)
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('有 base64 图标时渲染图片', () => {
    const icon =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
    const { container } = render(<AppIcon icon={icon} name="X" />)
    const img = container.querySelector('img')
    expect(img?.getAttribute('src')).toContain('data:image/png;base64,')
  })

  it('图片 onError 后回退为首字', () => {
    const { container } = render(<AppIcon icon="bad" name="回" />)
    const img = container.querySelector('img')
    if (!img) throw new Error('expected img')
    fireEvent.error(img)
    expect(screen.getByText('回')).toBeInTheDocument()
  })

  it('hasBorder 且内置且有效图标时展示 system 角标', () => {
    const tinyPng =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
    const { container } = render(<AppIcon icon={tinyPng} name="T" hasBorder isBuiltIn />)
    expect(
      container.querySelector('.absolute.bottom-\\[-1px\\].right-\\[-1px\\]'),
    ).toBeInTheDocument()
  })
})
