import React, { useEffect, useState } from 'react'
import { SelectProps, Select, Spin } from 'antd'
import { trim } from 'lodash'
import { UserOutlined } from '@ant-design/icons'
import { DefaultOptionType } from 'antd/lib/select'
import styles from './styles.module.less'
import __ from '../locale'

/**
 * 执行人组件
 * @param label
 */
export const ExecutorLabel: React.FC<{
    label: string
    en?: string
    icon?: boolean
}> = ({ label, en, icon = true }) => {
    return (
        <div className={styles.executorLabelLabelWrapper}>
            {icon && <UserOutlined className={styles.icon} />}
            <span className={styles.text} title={label}>
                {label}
            </span>
            {en && (
                <span
                    className={styles.text}
                    style={{ marginLeft: 0 }}
                    title={en}
                >
                    ({en})
                </span>
            )}
        </div>
    )
}

interface IExecutorSelect extends SelectProps {
    data?: any[]
    loading?: boolean
    isFreeTask?: boolean
}
/**
 * 执行人选择组件
 * @param data 执行人集
 */
export const ExecutorSelect: React.FC<IExecutorSelect> = ({
    data,
    loading,
    isFreeTask = false,
    ...props
}) => {
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
            .filter((info) => info.name?.includes(trim(inputValue)))
            .filter((info) => info.id === option?.value)
        return res.length > 0
    }

    return (
        <Select
            listHeight={200}
            showSearch
            allowClear
            filterOption={filterSearchValue}
            placeholder={__('请选择执行人')}
            options={options}
            notFoundContent={
                loading ? (
                    <Spin />
                ) : data ? (
                    data.length === 0 ? (
                        <div style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
                            <div>{__('暂无数据')}</div>
                            {!isFreeTask && (
                                <div>
                                    {__(
                                        '至「项目管理」点击【详细信息】添加成员',
                                    )}
                                </div>
                            )}
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
