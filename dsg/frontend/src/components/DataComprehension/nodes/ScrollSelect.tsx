import React, { useState, useEffect } from 'react'
import { Select, SelectProps } from 'antd'
import { debounce } from 'lodash'

interface IScrollSelect extends SelectProps {
    optionsData: any[]
    limit?: number // 每页显示的选项数量，默认为50
    searchKey?: string // 搜索的关键字
    [key: string]: any
}

const ScrollSelect = ({
    optionsData,
    searchKey = 'name',
    limit = 50,
    ...props
}: IScrollSelect) => {
    const { mode, value } = props
    const [searchValue, setSearchValue] = useState('')
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const [options, setOptions] = useState<any[]>([])

    const loadOptions = async (params?: any) => {
        const { offset, keyword } = params
        if (keyword) {
            const searchRes = optionsData.filter((o) =>
                o[searchKey]
                    ?.toLowerCase()
                    .includes(keyword.trim().toLowerCase()),
            )
            setOptions(searchRes.slice(0, limit * offset))
            setHasMore(searchRes.length > limit * offset)
        } else {
            const showOp = optionsData.slice(0, limit * offset)
            if (mode === 'multiple') {
                if (
                    value &&
                    !showOp.some((o) => value.includes(o.value)) &&
                    optionsData.some((o) => value.includes(o.value))
                ) {
                    setOptions([
                        ...optionsData.filter((o) => value.includes(o.value)),
                        ...showOp.filter((o) => !value.includes(o.value)),
                    ])
                } else {
                    setOptions(optionsData.slice(0, limit * offset))
                }
            } else if (
                value &&
                !showOp.some((o) => o.value === value) &&
                optionsData.some((o) => o.value === value)
            ) {
                setOptions([
                    ...optionsData.filter((o) => o.value === value),
                    ...showOp.filter((o) => o.value !== value),
                ])
            } else {
                setOptions(optionsData.slice(0, limit * offset))
            }
            setHasMore(optionsData.length > limit * offset) // 假设每次返回50条，不足50条表示没有更多数据
        }
    }

    const debouncedLoadOptions = debounce(loadOptions, 300)

    useEffect(() => {
        debouncedLoadOptions({ offset: 1 })
    }, [optionsData])

    const handleSearch = (val) => {
        setSearchValue(val)
        setPage(1)
        debouncedLoadOptions({
            keyword: val,
            offset: 1,
        })
    }

    const handlePopupScroll = (e) => {
        const { target } = e
        if (
            hasMore &&
            target.scrollTop + target.offsetHeight === target.scrollHeight
        ) {
            const nextPage = page + 1
            setPage(nextPage)
            debouncedLoadOptions({
                keyword: searchValue,
                offset: nextPage,
            })
        }
    }

    return (
        <Select
            showSearch
            filterOption={false}
            onSearch={handleSearch}
            onPopupScroll={handlePopupScroll}
            options={options}
            onDropdownVisibleChange={(open) => {
                if (!open) {
                    setPage(1)
                    debouncedLoadOptions({
                        keyword: '',
                        offset: 1,
                    })
                }
            }}
            {...props}
        />
    )
}
export default ScrollSelect
