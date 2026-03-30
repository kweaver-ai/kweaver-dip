import React, { useState, useRef, useEffect } from 'react'
import { Select, AutoComplete, Spin } from 'antd'
import { debounce, uniqBy } from 'lodash'
import { getCRuleListByFileCatalogSearch } from '@/core'
import CodeRuleDetails from '@/components/CodeRulesComponent/CodeRuleDetails'
import styles from './styles.module.less'

const { Option } = Select
interface IRegRule {
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
    placeholder?: string
    [key: string]: any
}
interface IOption {
    id: string | number
    name: string
    [key: string]: any // 其他属性
}
const RegRule = ({
    debounceTimeout = 300,
    icon,
    renderOption,
    limit = 50,
    value,
    placeholder = '请选择',
    fieldValueKey = 'id',
    fieldNameKey = 'name',
    disableDetailFetch = false,
    ...props
}: IRegRule) => {
    const [fetching, setFetching] = useState(false)
    const [options, setOptions] = useState<IOption[]>([])
    const [searchValue, setSearchValue] = useState('')
    const [selectedId, setSelectedId] = useState('')
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const [currentInfo, setCurrentInfo] = useState<any[]>([])
    const fetchingRef = useRef(false)
    const [detailVisible, setDetailVisible] = useState(false)

    const loadOptions = async (params?: any) => {
        fetchingRef.current = true
        setFetching(true)

        try {
            const res = await getCRuleListByFileCatalogSearch({
                offset: 1,
                limit,
                catalog_id: '44',
                ...params,
                rule_type: 'REGEX',
            })
            const newOptions = res?.data
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
        // 如果有外部的onChange处理函数，调用它
        if (props?.onChange) {
            props?.onChange(val, option)
        }
    }

    return (
        <>
            <AutoComplete
                value={value}
                filterOption={false}
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
                placeholder={placeholder}
                {...props}
                onChange={handleChange}
            >
                {options.map((option) => (
                    <Option
                        key={option[fieldValueKey]}
                        value={option.regex}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                        }}
                        name={option.regex}
                        optionData={option}
                    >
                        {renderOption ? (
                            renderOption(option)
                        ) : (
                            <div className={styles.regRuleOption}>
                                {icon && (
                                    <span style={{ marginRight: 4 }}>
                                        {icon}
                                    </span>
                                )}
                                <span
                                    className={styles.name}
                                    title={option[fieldNameKey]}
                                >
                                    {option[fieldNameKey]}
                                </span>
                                <span
                                    onClick={(e) => {
                                        setSelectedId(option[fieldValueKey])
                                        setDetailVisible(true)
                                    }}
                                    className={styles.linkBtn}
                                >
                                    详情
                                </span>
                            </div>
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
                {!fetching && !hasMore && options.length > 100 && (
                    <Option disabled key="no-more">
                        <div style={{ fontSize: '12px', textAlign: 'center' }}>
                            没有更多数据
                        </div>
                    </Option>
                )}
            </AutoComplete>
            {detailVisible && (
                <CodeRuleDetails
                    visible={detailVisible}
                    onClose={() => setDetailVisible(false)}
                    id={selectedId}
                />
            )}
        </>
    )
}
export default RegRule
