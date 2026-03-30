import React, { useState, useEffect } from 'react'
import { SelectProps, Select, Spin } from 'antd'
import { trim, debounce } from 'lodash'
import { useGetState } from 'ahooks'
import { DefaultOptionType } from 'antd/lib/select'
import __ from './locale'
import { getUsersFrontendList } from '@/core'
import { ExecutorLabel } from '../MyTask/custom/ExecutorComponent'

interface IExecutorScrollSelect extends SelectProps {
    data: any[]
}
/**
 * 项目选择组件
 * @param data 项目集
 */
export const ExecutorScrollSelect: React.FC<IExecutorScrollSelect> = ({
    data,
    ...props
}) => {
    // 分页
    const [offset, setOffset] = useState(1)
    // 数量
    const limit = 100

    // 请求加载
    const [fetching, setFetching] = useState(false)

    const [results, setResults] = useState<{ entries; total_count }>({
        entries: [],
        total_count: 0,
    })

    // 搜素关键字
    const [searchKey, setSearchKey] = useState('')

    // 数据转换选项值
    const changeOptions = (infos: any[]) => {
        return infos.map((info) => {
            return {
                label: <ExecutorLabel label={info.name} />,
                value: info.id,
            }
        })
    }

    // 选项值
    const [options, setOptions, getOptions] = useGetState<DefaultOptionType[]>(
        () => changeOptions(data),
    )

    useEffect(() => {
        if (data.length > 0) {
            setOptions(changeOptions(data))
        } else {
            getProjectsList(offset, searchKey)
        }
    }, [])

    // 获取项目列表
    const getProjectsList = async (idx: number, value?) => {
        if (Math.floor(results.total_count / limit) + 1 >= idx) {
            setFetching(true)
            const res = await getUsersFrontendList({
                keyword: value,
                limit,
                offset: idx,
            })
            setResults(res)
            const { entries } = res
            const arr = entries.map((e) => {
                const { id, name } = e
                return { id, name }
            })
            if (idx === 1) {
                setOptions(changeOptions(arr))
            } else {
                setOptions([...options, ...changeOptions(arr)])
            }
            setFetching(false)
        }
    }

    // 搜索框enter
    const handleSearch = (value: string) => {
        if (value.length <= 128) {
            setSearchKey(trim(value))
            setOffset(1)
            getProjectsList(1, trim(value))
        }
    }

    // 筛选项滚动
    const handlesScroll = (e: any) => {
        e.persist()
        const { target } = e
        if (target.scrollTop + target.offsetHeight === target.scrollHeight) {
            const next = offset + 1
            setOffset(next)
            getProjectsList(next, searchKey)
        }
    }

    return (
        <div>
            <Select
                showSearch
                filterOption={false}
                placeholder={__('请选择执行人')}
                options={getOptions()}
                notFoundContent={
                    fetching ? (
                        <Spin />
                    ) : results.entries.length === 0 && searchKey === '' ? (
                        <div style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
                            {__('暂无数据')}
                        </div>
                    ) : (
                        <div style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
                            {__('抱歉，没有找到相关内容')}
                        </div>
                    )
                }
                getPopupContainer={(node) => node.parentNode}
                onSearch={debounce(handleSearch, 400)}
                onSelect={(value, option) => {
                    setSearchKey('')
                    setOffset(1)
                    getProjectsList(1, '')
                }}
                onPopupScroll={(e) => handlesScroll(e)}
                {...props}
            />
        </div>
    )
}
