import { SearchOutlined } from '@ant-design/icons'
import { useDebounce, useUpdateEffect } from 'ahooks'
import { Input, InputProps, InputRef } from 'antd'
import { Ref, forwardRef, useEffect, useRef, useState, memo } from 'react'

interface ISearchInputProps extends InputProps {
    // 直接返回搜索关键字,已添加防抖300ms,且做了trim处理
    onKeyChange?: (value: string) => void
    // 是否显示图标  默认：true
    showIcon?: boolean
    // 直接返回原始搜索关键字
    onOriginalKeyChange?: (value: string) => void
}

/**
 * 搜索输入框： 默认限制输入长度为 128
 * @param props ISearchInputProps
 * @returns
 */
const InternerSearchInput = (props: ISearchInputProps, ref: Ref<InputRef>) => {
    const {
        onKeyChange,
        onOriginalKeyChange,
        onChange,
        value,
        showIcon = true,
        ...restProps
    } = props
    const isSearchRef = useRef<any>(false)
    const [searchValue, setSearchValue] = useState<any>('')
    const [keyword, setKeyword] = useState<string>('')
    const debounceSK = useDebounce(keyword, { wait: 300 })
    useUpdateEffect(() => {
        onKeyChange?.(debounceSK)
    }, [debounceSK])

    useEffect(() => {
        setSearchValue(value ?? '')
        if (!value) {
            setKeyword('')
        }
    }, [value])

    const handleSearch = (e: any) => {
        const kw = e.target.value?.trim()
        setSearchValue(e.target.value)
        onOriginalKeyChange?.(e.target.value)
        if (!isSearchRef.current) {
            setKeyword(kw)
            onChange?.(e)
        }
        if (!kw) {
            setKeyword('')
            // onKeyChange?.('')
        }
    }

    const handleCompositionStart = () => {
        isSearchRef.current = true
    }

    const handleCompositionEnd = (e: any) => {
        isSearchRef.current = false
        // webkit：compositionstart onChange compositionend
        // firefox：compositionstart compositionend onChange
        if (navigator.userAgent.indexOf('WebKit') > -1) {
            handleSearch(e)
        }
    }

    return (
        <Input
            ref={ref}
            prefix={showIcon ? <SearchOutlined /> : undefined}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            maxLength={128}
            allowClear
            onChange={handleSearch}
            value={searchValue}
            {...restProps}
        />
    )
}

const SearchInput = forwardRef(InternerSearchInput)
SearchInput.displayName = 'SearchInput'

export default memo(SearchInput)
