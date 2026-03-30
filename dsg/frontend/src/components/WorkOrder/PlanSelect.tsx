import React, { useEffect, useState, useRef } from 'react'
import { Select, Spin } from 'antd'
import { formatError } from '@/core'

const { Option } = Select

const PlanSelect = ({
    placeholder,
    fetchMethod,
    params,
    fieldMap = {
        label: 'name',
        value: 'id',
    },
    value,
    onChange,
    disabled,
    listKey = 'entries',
    onClickItem,
}: any) => {
    const [options, setOptions] = useState<any[]>([])
    const [loading, setLoading] = useState<boolean>(false)
    const [curPage, setCurPage] = useState<number>(1)
    const [hasMore, setHasMore] = useState<boolean>(true)
    const dropdownRef = useRef<any>(null)
    const loadData = async (page: number, loadParams: any) => {
        if (!fetchMethod || !hasMore) return

        setLoading(true)
        try {
            const res = await fetchMethod({
                ...loadParams,
                offset: page,
                limit: 999,
            })

            const newOptions = (res?.[listKey] || []).map((o) => ({
                value: o?.[fieldMap.value],
                label: o?.[fieldMap.label],
                key: o?.[fieldMap.value],
            }))
            if (newOptions.length > 0) {
                if (page === 1) {
                    setOptions(newOptions)
                } else {
                    setOptions((prev) => [...(prev ?? []), ...newOptions])
                }
            }
            setHasMore(newOptions.length === 999)
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData(1, params)
    }, [fetchMethod, params])

    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target
        if (
            scrollTop + clientHeight >= scrollHeight - 10 &&
            !loading &&
            hasMore
        ) {
            setCurPage((prevPage) => prevPage + 1)
        }
    }

    useEffect(() => {
        if (curPage > 1) {
            loadData(curPage, params)
        }
    }, [curPage, params])

    const handleRenderList = (menu) => (
        <div
            ref={dropdownRef}
            onScroll={handleScroll}
            style={{ height: 'fit-content' }}
        >
            {menu}
            {/* {loading && (
                <div style={{ textAlign: 'center', padding: '10px' }}>
                    <Spin size="small" />
                </div>
            )} */}
            {/* {!hasMore && options?.length > 20 && (
                <div style={{ textAlign: 'center', padding: '10px' }}>
                    没有更多数据了
                </div>
            )} */}
        </div>
    )

    const handleChange = (val) => {
        onChange?.(val)
    }

    return (
        <Select
            value={value}
            showSearch
            labelInValue
            placeholder={placeholder}
            optionFilterProp="label"
            filterOption={(input: string, option: any) =>
                option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
            loading={loading}
            notFoundContent={loading ? <Spin size="small" /> : '暂无数据'}
            dropdownRender={handleRenderList}
            onSelect={handleChange}
            disabled={disabled}
            optionLabelProp="label"
            getPopupContainer={(node) => node.parentNode}
        >
            {options.map((option: any) => (
                <Option
                    key={option.key}
                    value={option.value}
                    label={option.label}
                >
                    <div
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        <div
                            style={{
                                overflow: 'hidden',
                                whiteSpace: 'nowrap',
                                textOverflow: 'ellipsis',
                                flex: 1,
                            }}
                            title={option.label}
                        >
                            {option.label}
                        </div>
                        {!!onClickItem && (
                            <div
                                style={{
                                    textAlign: 'center',
                                    width: '60px',
                                    flexShrink: 0,
                                }}
                            >
                                <a
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        onClickItem?.(option.value)
                                    }}
                                >
                                    详情
                                </a>
                            </div>
                        )}
                    </div>
                </Option>
            ))}
        </Select>
    )
}

export default PlanSelect
