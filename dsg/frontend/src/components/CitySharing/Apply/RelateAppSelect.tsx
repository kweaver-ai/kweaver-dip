import React, { useState, useEffect } from 'react'
import { Select, SelectProps } from 'antd'
import { trim, debounce } from 'lodash'
import __ from '../locale'
import { formatError, getAppsList } from '@/core'
import { NotFoundContent } from './helper'

/**
 * 项目选择组件
 * @param data 项目集
 */
const RelateAppSelect: React.FC<SelectProps> = ({ ...props }) => {
    // 分页
    const [offset, setOffset] = useState(1)
    // 数量
    const limit = 2000

    // 关联应用系统选项
    const [loading, setLoading] = useState<boolean>(false)
    const [total, setTotal] = useState<number>(0)
    const [results, setResults] = useState<any[]>([])
    // 搜素关键字
    const [searchKey, setSearchKey] = useState('')

    useEffect(() => {
        getList(1, '')
    }, [])

    // 获取项目列表
    const getList = async (idx: number, value?) => {
        try {
            setLoading(true)
            const res = await getAppsList({
                limit,
                offset: idx,
                keyword: value,
            })
            setOffset(idx)
            setTotal(res?.total_count || 0)
            if (res?.total_count === 0) {
                setResults([
                    {
                        id: '',
                        name: '无',
                    },
                ])
                return
            }
            if (idx === 1) {
                setResults(res?.entries || [])
            } else {
                setResults((prev) => [...prev, ...(res?.entries || [])])
            }
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    // 搜索框enter
    const handleSearch = (value: string) => {
        setSearchKey(trim(value))
        getList(1, trim(value))
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
            placeholder={__('请选择应用')}
            options={results}
            fieldNames={{
                label: 'name',
                value: 'id',
            }}
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
            onSelect={(value, option) => {
                setSearchKey('')
                getList(1, '')
            }}
            onPopupScroll={(e) => handlesScroll(e)}
            {...props}
        />
    )
}

export default RelateAppSelect
