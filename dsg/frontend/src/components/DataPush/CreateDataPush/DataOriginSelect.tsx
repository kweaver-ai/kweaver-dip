import React, { useState, useEffect } from 'react'
import { Select, SelectProps } from 'antd'
import { trim, debounce } from 'lodash'
import { useAsyncEffect } from 'ahooks'
import __ from '../locale'
import {
    formatError,
    getDataBaseDetails,
    getDataSourceList,
    ITargetDetail,
} from '@/core'
import { NotFoundContent, SelectOptionItem } from './helper'
import { databaseTypesEleData, DataColoredBaseIcon } from '@/core/dataSource'

interface IDataOriginSelectProps extends SelectProps {
    selectedItem?: ITargetDetail
    onInitError?: (error: any) => void
}

/**
 * 数据源选择组件
 */
const DataOriginSelect: React.FC<IDataOriginSelectProps> = ({
    selectedItem,
    onInitError,
    ...props
}) => {
    const { value } = props
    // 分页
    const [offset, setOffset] = useState(1)
    // 数量
    const limit = 2000

    // 关联应用系统选项
    const [loading, setLoading] = useState<boolean>(false)
    const [total, setTotal] = useState<number>(0)
    const [results, setResults] = useState<ITargetDetail[]>([])
    // 搜素关键字
    const [searchKey, setSearchKey] = useState('')

    useAsyncEffect(async () => {
        if (value && selectedItem?.target_datasource_id && !total) {
            await getSelectedItemInfo(selectedItem.target_datasource_id)
        }
        getList(1, '')
    }, [])

    const getSelectedItemInfo = async (id: string) => {
        try {
            const res: any = await getDataBaseDetails(id)
            setResults([
                {
                    ...res,
                    target_datasource_id: res.id,
                    target_datasource_name: res.name,
                    db_type: res.type,
                },
            ])
        } catch (error) {
            formatError(error)
            onInitError?.(error?.data?.message)
        }
    }

    const getList = async (idx: number, keyword?: string) => {
        try {
            setLoading(true)
            const { entries, total_count } = await getDataSourceList({
                limit,
                offset: idx,
                keyword,
            })
            const data =
                entries
                    ?.filter((item) => item.type !== 'excel')
                    ?.map((item) => ({
                        ...item,
                        target_datasource_id: item.id,
                        target_datasource_name: item.name,
                        db_type: item.type,
                    })) || []
            setOffset(idx)
            setTotal(total_count || 0)
            if (idx === 1) {
                setResults(data)
            } else {
                setResults((prev) => [...prev, ...data])
            }
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    // 搜索框enter
    const handleSearch = (keyword: string) => {
        setSearchKey(trim(keyword))
        getList(1, trim(keyword))
    }

    // 筛选项滚动
    const handlesScroll = (e: any) => {
        e.persist()
        const { target } = e
        if (
            target.scrollTop + target.offsetHeight === target.scrollHeight &&
            total > results.length
        ) {
            getList(offset + 1, searchKey)
        }
    }

    return (
        <Select
            showSearch
            filterOption={false}
            placeholder={__('请选择数据源')}
            options={results.map((item) => {
                const ICons = (
                    <DataColoredBaseIcon
                        type={item?.db_type}
                        iconType="Colored"
                        style={{
                            fontSize: '18px',
                        }}
                    />
                )
                return {
                    ...item,
                    label: (
                        <SelectOptionItem
                            name={item.target_datasource_name}
                            icon={ICons}
                        />
                    ),
                    value: item.target_datasource_id,
                }
            })}
            notFoundContent={
                loading ? (
                    ''
                ) : results.length === 0 && searchKey === '' ? (
                    <NotFoundContent />
                ) : (
                    <NotFoundContent text={__('抱歉，没有找到相关内容')} />
                )
            }
            loading={loading}
            getPopupContainer={(node) => node.parentNode}
            onSearch={debounce(handleSearch, 400)}
            onSelect={(val, option) => {
                if (searchKey) {
                    setSearchKey('')
                    getList(1, '')
                }
            }}
            onPopupScroll={(e) => handlesScroll(e)}
            {...props}
        />
    )
}

export default DataOriginSelect
