import React, { useState, useRef, useEffect } from 'react'
import { Select, Spin } from 'antd'
import { debounce, uniqBy, isArray } from 'lodash'
import { reqInfoSystemDetail } from '@/core'

const { Option } = Select
interface IScrollLoadSelect {
    fetchOptions: (params: any) => Promise<any[]> // 异步获取选项的函数，返回Promise
    onChange?: (value: any, option: any) => void
    debounceTimeout?: number // 防抖时间，默认为300ms
    icon?: React.ReactNode // 自定义图标
    renderOption?: (option: any) => React.ReactNode // 自定义选项
    limit?: number // 每页显示的选项数量，默认为50
    value?: any
    // 字段值，用于传值，同fieldNames中value
    fieldValueKey?: any
    // 字段值，用于传值，同fieldNames中Name
    fieldNameKey?: any
    // 是否禁用自动获取详情，默认为false
    disableDetailFetch?: boolean
    [key: string]: any
}
interface IOption {
    id: string | number
    name: string
    [key: string]: any // 其他属性
}
const ScrollLoadSelect = ({
    fetchOptions,
    debounceTimeout = 300,
    icon,
    renderOption,
    limit = 50,
    value,
    fieldValueKey = 'id',
    fieldNameKey = 'name',
    disableDetailFetch = false,
    ...props
}: IScrollLoadSelect) => {
    const [fetching, setFetching] = useState(false)
    const [options, setOptions] = useState<IOption[]>([])
    const [searchValue, setSearchValue] = useState('')
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const [currentInfo, setCurrentInfo] = useState<any[]>([])
    const fetchingRef = useRef(false)

    const loadOptions = async (params?: any) => {
        fetchingRef.current = true
        setFetching(true)

        try {
            const newOptions = await fetchOptions({
                offset: 1,
                limit,
                ...params,
            })
            if (params.offset === 1) {
                setOptions((pre) =>
                    currentInfo?.length
                        ? uniqBy([...currentInfo, ...newOptions], fieldValueKey)
                        : newOptions,
                )
            } else {
                setOptions((prev) =>
                    uniqBy([...prev, ...newOptions], fieldValueKey),
                )
            }
            setHasMore(newOptions.length >= limit) // 假设每次返回50条，不足50条表示没有更多数据
        } catch (error) {
            // console.error('Error fetching options:', error)
        } finally {
            fetchingRef.current = false
            setFetching(false)
        }
    }

    useEffect(() => {
        if (value && !disableDetailFetch) {
            systemDetails()
        }
    }, [value, disableDetailFetch])

    useEffect(() => {
        if (currentInfo?.length) {
            setOptions((prev) =>
                uniqBy([...currentInfo, ...prev], fieldValueKey),
            )
        }
    }, [currentInfo])

    const debouncedLoadOptions = debounce(loadOptions, debounceTimeout)

    useEffect(() => {
        debouncedLoadOptions({ offset: 1 })
    }, [])

    const handleSearch = (val) => {
        setSearchValue(val)
        setPage(1)
        debouncedLoadOptions({
            keyword: val,
            offset: 1,
        })
    }

    const handlePopupScroll = (e) => {
        // 禁止滚动事件冒泡到父级页面
        e.stopPropagation()
        e.preventDefault()

        // 如果正在加载数据，直接返回，不处理滚动事件
        if (fetchingRef.current || fetching) {
            return
        }

        const { target } = e

        if (
            !fetchingRef.current &&
            hasMore &&
            target.scrollTop + target.offsetHeight >= target.scrollHeight - 5 // 添加5px的缓冲区域
        ) {
            const nextPage = page + 1
            setPage(nextPage)
            debouncedLoadOptions({
                keyword: searchValue,
                offset: nextPage,
            })
        }
    }
    const handleChange = (val, option) => {
        // 清空搜索字段
        setSearchValue('')
        // 重置为第一页
        setPage(1)
        // 重新加载初始数据
        debouncedLoadOptions({ offset: 1 })

        // 如果有外部的onChange处理函数，调用它
        if (props?.onChange) {
            props?.onChange(val, option)
        }
    }

    const systemDetails = async () => {
        try {
            const ids = isArray(value) ? value : [value]
            const res: any = await Promise.all(
                ids.map((id) => reqInfoSystemDetail(id)),
            )
            setCurrentInfo(res)
            setOptions((pre) => uniqBy([...res, ...pre], fieldValueKey))
        } catch (error) {
            props?.onChange?.(undefined, undefined)
        }
    }

    return (
        <Select
            showSearch
            value={value}
            filterOption={false}
            onSearch={handleSearch}
            // notFoundContent={fetching ? <Spin size="small" /> : null}
            onPopupScroll={handlePopupScroll}
            notFoundContent={
                <div
                    style={{
                        color: 'rgba(0, 0, 0, 0.85)',
                        marginLeft: '5px',
                    }}
                >
                    {searchValue ? '未找到匹配的结果' : '暂无数据'}
                </div>
            }
            {...props}
            onChange={handleChange}
        >
            {options.map((option) => (
                <Option
                    key={option[fieldValueKey]}
                    value={option[fieldValueKey]}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        height: 32,
                    }}
                    name={option[fieldNameKey]}
                    optionData={option}
                >
                    {renderOption ? (
                        renderOption(option)
                    ) : (
                        <>
                            {icon && (
                                <span style={{ marginRight: 4 }}>{icon}</span>
                            )}
                            <span title={option[fieldNameKey]}>
                                {option[fieldNameKey]}
                            </span>
                        </>
                    )}
                </Option>
            ))}
            {fetching && options.length > 0 && (
                <Option disabled key="loading">
                    <div style={{ textAlign: 'center' }}>
                        <Spin size="small" />
                    </div>
                </Option>
            )}
            {options.length === 0 && (
                <Option disabled key="loading">
                    <div style={{ textAlign: 'center' }}>
                        {searchValue ? '未找到匹配的结果' : '暂无数据'}
                    </div>
                </Option>
            )}
            {!fetching && !hasMore && options.length > 100 && (
                <Option disabled key="no-more">
                    <div style={{ fontSize: '12px', textAlign: 'center' }}>
                        没有更多数据
                    </div>
                </Option>
            )}
        </Select>
    )
}
export default ScrollLoadSelect
