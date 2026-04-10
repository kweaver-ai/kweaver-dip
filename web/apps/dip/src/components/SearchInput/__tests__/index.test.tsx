import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/components/IconFont', () => ({
  default: () => <span data-testid="search-icon" />,
}))

import SearchInput from '../index'

describe('SearchInput', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('输入后按防抖延迟触发 onSearch', () => {
    const onSearch = vi.fn()
    render(<SearchInput onSearch={onSearch} debounceDelay={300} defaultValue="" />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'hello' } })
    expect(onSearch).not.toHaveBeenCalled()
    vi.advanceTimersByTime(300)
    expect(onSearch).toHaveBeenCalledTimes(1)
    expect(onSearch).toHaveBeenCalledWith('hello')
  })

  it('debounceDelay=0 时每次变更立即触发', () => {
    const onSearch = vi.fn()
    render(<SearchInput onSearch={onSearch} debounceDelay={0} defaultValue="" />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'a' } })
    expect(onSearch).toHaveBeenCalledWith('a')
    onSearch.mockClear()
    fireEvent.change(input, { target: { value: 'a' } })
    expect(onSearch).not.toHaveBeenCalled()
  })

  it('回车强制立即搜索（与上次提交值不同）', () => {
    const onSearch = vi.fn()
    render(<SearchInput onSearch={onSearch} debounceDelay={300} defaultValue="" />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'x' } })
    vi.advanceTimersByTime(300)
    onSearch.mockClear()
    fireEvent.change(input, { target: { value: 'y' } })
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })
    expect(onSearch).toHaveBeenCalledWith('y')
  })
})
