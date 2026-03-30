import React, { useEffect, useState } from 'react'
import { Select, Spin } from 'antd'
import { DefaultOptionType, SelectProps } from 'antd/es/select'
import { trim } from 'lodash'
import __ from '../locale'

interface IDomainSelect extends SelectProps {
    data?: any[]
    loading?: boolean
}
/**
 * 业务域选择组件
 * @param data 业务域集
 */
export const DomainSelect: React.FC<IDomainSelect> = ({
    data,
    loading,
    ...props
}) => {
    // 搜素关键字
    const [searchKey, setSearchKey] = useState('')

    // 数据转换选项值
    const changeOptions = (infos: any[]) => {
        return infos.map((info) => {
            return {
                label: info.name,
                value: info.business_domain_id,
            }
        })
    }

    // 选项值
    const [options, setOptions] = useState<DefaultOptionType[]>(() =>
        changeOptions(data || []),
    )

    useEffect(() => {
        if (data && data.length > 0) {
            setOptions(changeOptions(data))
        }
    }, [data])

    // 搜索过滤
    const filterSearchValue = (inputValue: string, option) => {
        const res = data!
            .filter((info) =>
                info.name?.match(new RegExp(trim(inputValue), 'ig')),
            )
            .filter((info) => info.business_domain_id === option?.value)
        return res.length > 0
    }

    return (
        <Select
            showSearch
            allowClear
            filterOption={filterSearchValue}
            options={options}
            notFoundContent={
                loading ? (
                    <Spin />
                ) : data ? (
                    data.length === 0 ? (
                        <div style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
                            {__('暂无数据')}
                        </div>
                    ) : (
                        <div style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
                            {__('抱歉，没有找到相关内容')}
                        </div>
                    )
                ) : (
                    <div style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
                        {__('请先选择任务类型')}
                    </div>
                )
            }
            searchValue={searchKey}
            onSearch={(val) => {
                if (val.length <= 128) {
                    setSearchKey(val)
                }
            }}
            getPopupContainer={(node) => node.parentNode}
            {...props}
        />
    )
}
