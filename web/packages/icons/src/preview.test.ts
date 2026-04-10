import { describe, expect, it } from 'vitest'
import {
  filterPreviewItems,
  groupPreviewItems,
  toPreviewCopySnippet,
  type PreviewItem,
} from './preview-utils'

const previewItems: PreviewItem[] = [
  {
    iconfontName: 'icon-tool',
    componentName: 'ToolOutlined',
    kind: 'outlined',
  },
  {
    iconfontName: 'icon-graph',
    componentName: 'GraphColored',
    kind: 'colored',
  },
]

describe('preview utils', () => {
  it('filters preview items by raw name and component name', () => {
    expect(filterPreviewItems(previewItems, 'tool')).toHaveLength(1)
    expect(filterPreviewItems(previewItems, 'GraphColored')).toHaveLength(1)
  })

  it('matches preview items case-insensitively', () => {
    expect(filterPreviewItems(previewItems, 'TOOL')).toHaveLength(1)
  })

  it('groups preview items by kind', () => {
    const groups = groupPreviewItems(previewItems)

    expect(groups.outlined).toHaveLength(1)
    expect(groups.colored).toHaveLength(1)
  })

  it('renders preview copy snippets', () => {
    expect(toPreviewCopySnippet('ToolOutlined')).toBe('<ToolOutlined />')
  })
})
