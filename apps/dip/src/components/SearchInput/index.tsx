import type { InputProps } from 'antd'
import { Input } from 'antd'
import { useCallback, useEffect, useRef, useState } from 'react'
import IconFont from '@/components/IconFont'

interface SearchInputProps extends Omit<InputProps, 'onChange' | 'value'> {
  /** 搜索值变化回调（防抖后触发） */
  onSearch?: (value: string) => void
  /** 防抖延迟时间（毫秒），默认 300ms */
  debounceDelay?: number
  /** 初始搜索值 */
  defaultValue?: string
}

/** 搜索输入框 */
const SearchInput: React.FC<SearchInputProps> = ({
  onSearch,
  debounceDelay = 300,
  defaultValue = '',
  placeholder = '搜索',
  className,
  ...restProps
}) => {
  const [inputValue, setInputValue] = useState<string>(defaultValue)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)
  const lastSearchValue = useRef<string>(defaultValue)

  const clearDebounce = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
      debounceTimer.current = null
    }
  }, [])

  const triggerSearch = useCallback(
    (value: string, immediate = false) => {
      clearDebounce()

      // 值未变化，不触发搜索
      if (value === lastSearchValue.current) return

      const doSearch = () => {
        lastSearchValue.current = value
        onSearch?.(value)
      }

      if (immediate || debounceDelay === 0) {
        doSearch()
        return
      }

      debounceTimer.current = setTimeout(doSearch, debounceDelay)
    },
    [clearDebounce, debounceDelay, onSearch],
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    triggerSearch(value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      triggerSearch(inputValue, true)
    }
  }

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      clearDebounce()
    }
  }, [clearDebounce])

  return (
    <Input
      placeholder={placeholder}
      value={inputValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      prefix={<IconFont type="icon-dip-search" className="opacity-45" />}
      allowClear
      variant="borderless"
      className={`bg-white rounded-2xl w-[220px] h-[30px] ${className || ''}`}
      {...restProps}
    />
  )
}

export default SearchInput
