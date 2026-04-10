import { describe, expect, it } from 'vitest'
import { EmptyState, PageContainer } from './index'

describe('@kweaver-web/components', () => {
  it('exports reusable component entrypoints', () => {
    expect(typeof EmptyState).toBe('function')
    expect(typeof PageContainer).toBe('function')
  })
})
