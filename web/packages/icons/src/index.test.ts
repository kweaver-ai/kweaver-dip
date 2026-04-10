import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, expectTypeOf, it } from 'vitest'
import { AddOutlined, ToolColored } from './index'
import { IconBase } from './shared/IconBase'
import type { ColoredIconProps, OutlinedIconProps } from './index'

describe('@kweaver-web/icons', () => {
  it('exports shared icon prop types for generated components', () => {
    expectTypeOf<OutlinedIconProps>().toMatchTypeOf<{
      size?: number | string
      className?: string
      color?: string
    }>()

    expectTypeOf<ColoredIconProps>().toMatchTypeOf<{
      size?: number | string
      className?: string
      style?: React.CSSProperties
    }>()
  })

  it('renders a shared icon base for generated components', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        IconBase,
        { viewBox: '0 0 1024 1024', size: 16 },
        React.createElement('path', { d: 'M0 0h16v16H0z' }),
      ),
    )

    expect(html).toContain('width="16"')
    expect(html).toContain('height="16"')
  })

  it('exports generated outlined and colored icons', () => {
    expect(AddOutlined).toBeTypeOf('function')
    expect(ToolColored).toBeTypeOf('function')
  })

  it('renders generated icons with shared sizing and color behavior', () => {
    const outlinedHtml = renderToStaticMarkup(
      React.createElement(AddOutlined, { size: 20, color: '#1677ff' }),
    )
    const coloredHtml = renderToStaticMarkup(
      React.createElement(ToolColored, { size: '2em' }),
    )

    expect(outlinedHtml).toContain('width="20"')
    expect(outlinedHtml).toContain('height="20"')
    expect(outlinedHtml).toContain('color:#1677ff')
    expect(outlinedHtml).toContain('fill="currentColor"')
    expect(coloredHtml).toContain('width="2em"')
    expect(coloredHtml).toContain('height="2em"')
  })
})
