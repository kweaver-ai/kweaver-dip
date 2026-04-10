import { describe, expect, it } from 'vitest'
import { normalizeSymbolUrl, outlinedIconSource } from '../scripts/config'
import { toComponentName } from '../scripts/naming'
import { extractSymbols, wrapSymbolAsSvg } from '../scripts/download'
import {
  assertUniqueComponentNames,
  resolveUniqueComponentName,
  renderIndexSource,
  renderPreviewManifestSource,
  toCopySnippet,
} from '../scripts/build'

describe('icon scripts', () => {
  it('normalizes protocol-less symbol urls', () => {
    expect(normalizeSymbolUrl('//at.alicdn.com/t/c/font_x.js')).toBe(
      'https://at.alicdn.com/t/c/font_x.js',
    )
    expect(outlinedIconSource.symbolUrl).toMatch(/^https:\/\//)
    expect(outlinedIconSource.symbolUrl).toContain('at.alicdn.com')
  })

  it('converts iconfont ids to outlined component names', () => {
    expect(toComponentName('icon-tool', 'Outlined')).toBe('ToolOutlined')
    expect(toComponentName('icon-align-right', 'Outlined')).toBe(
      'AlignRightOutlined',
    )
    expect(toComponentName('icon-file-2', 'Outlined')).toBe('File2Outlined')
    // 短横线划分的单词首字母大写，其余保持原样
    expect(toComponentName('icon-toolBox', 'Outlined')).toBe('ToolBoxOutlined')
    expect(toComponentName('icon-AR', 'Outlined')).toBe('AROutlined')
  })

  it('extracts symbols from iconfont js payloads', () => {
    const symbols = extractSymbols(
      `window.__iconfont__ = '<svg><symbol id="icon-tool" viewBox="0 0 1024 1024"><path d="M0 0" /></symbol></svg>'`,
    )

    expect(symbols).toEqual([
      {
        id: 'icon-tool',
        viewBox: '0 0 1024 1024',
        content: '<path d="M0 0" />',
      },
    ])
  })

  it('wraps extracted symbols as standalone svg files', () => {
    expect(
      wrapSymbolAsSvg({
        id: 'icon-tool',
        viewBox: '0 0 1024 1024',
        content: '<path d="M0 0" />',
      }),
    ).toContain('<svg')
  })

  it('renders an auto-generated index source', () => {
    const source = renderIndexSource(['ToolOutlined'], ['ToolColored'])

    expect(source).toContain("export { default as ToolOutlined }")
    expect(source).toContain("export { default as ToolColored }")
  })

  it('rejects duplicate generated component names', () => {
    expect(() =>
      assertUniqueComponentNames(['ToolOutlined', 'ToolOutlined'], 'outlined'),
    ).toThrow(/duplicate/i)
  })

  it('disambiguates component names that only differ by casing', () => {
    const usedNames = new Set(['docqacolored'])

    expect(resolveUniqueComponentName('DocQaColored', 'Colored', usedNames)).toBe(
      'DocQa2Colored',
    )
  })

  it('renders a preview manifest source', () => {
    const source = renderPreviewManifestSource([
      {
        iconfontName: 'icon-tool',
        componentName: 'ToolOutlined',
        kind: 'outlined',
      },
    ])

    expect(source).toContain("iconfontName: 'icon-tool'")
    expect(source).toContain("componentName: 'ToolOutlined'")
  })

  it('renders a JSX snippet for clipboard copy', () => {
    expect(toCopySnippet('ToolOutlined')).toBe('<ToolOutlined />')
  })

  it('includes both outlined and colored items in preview manifest source', () => {
    const source = renderPreviewManifestSource([
      {
        iconfontName: 'icon-tool',
        componentName: 'ToolOutlined',
        kind: 'outlined',
      },
      {
        iconfontName: 'icon-tool',
        componentName: 'ToolColored',
        kind: 'colored',
      },
    ])

    expect(source).toContain("componentName: 'ToolOutlined'")
    expect(source).toContain("componentName: 'ToolColored'")
  })
})
