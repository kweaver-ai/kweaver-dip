import React, { useEffect, useState } from 'react'
import { Select } from 'antd'
import { uniqBy } from 'lodash'
import __ from './locale'
import {
    getDictList,
    getDataElement,
    formatError,
    getDirDataByTypeOrId,
} from '@/core'

const { Option } = Select

interface ISelectCodeOrStandard {
    value?: any
    onChange?: (o) => void
    // 码表、数据标准
    type: 'code' | 'standard'
}

const SelectCodeOrStandard: React.FC<ISelectCodeOrStandard> = (props) => {
    const { value, onChange, type } = props
    const [options, setOptions] = useState<any[]>([])
    const [total, setTotal] = useState<number>(0)
    const [currentOffset, setCurrentOffset] = useState<number>(1)
    const [loading, setLoading] = useState<boolean>(false)

    const action = type === 'code' ? getDictList : getDataElement
    const catalog_id = type === 'code' ? '22' : '11'
    const params = {
        keyword: '',
        offset: 1,
        limit: 20,
        state: 'enable',
    }

    useEffect(() => {
        getList()
    }, [])

    const onPopupScroll = (event) => {
        const { target } = event
        // 判断是否滚动到底部
        if (
            target.scrollTop + target.offsetHeight >=
                target.scrollHeight - 100 &&
            !loading
        ) {
            // 执行加载更多数据的逻辑
            loadMore()
        }
    }

    const getList = async (keyword?: string) => {
        try {
            const res = await action({ ...params, catalog_id, keyword })
            setOptions(res?.data)
            setTotal(res.total_count || 0)
        } catch (err) {
            formatError(err)
        }
    }

    const loadMore = async () => {
        if (options.length === total) return
        const offset = currentOffset + 1
        setCurrentOffset(offset)
        try {
            setLoading(true)
            const res = await action({
                ...params,
                catalog_id,
                offset,
            })
            setOptions(uniqBy([...options, ...res.data], 'id'))
        } catch (err) {
            formatError(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Select
            showSearch
            placeholder={__('请选择')}
            listHeight={300}
            onChange={onChange}
            onPopupScroll={onPopupScroll}
            value={value}
            optionFilterProp="label"
            onSearch={getList}
            // searchValue={searchValue}
            allowClear
            onClear={getList}
        >
            {options.map((item) => {
                const name = type === 'code' ? item.ch_name : item.name_cn
                return (
                    <Option key={item.id} value={item.id} label={name}>
                        {name}
                    </Option>
                )
            })}
        </Select>
    )
}

export default SelectCodeOrStandard
