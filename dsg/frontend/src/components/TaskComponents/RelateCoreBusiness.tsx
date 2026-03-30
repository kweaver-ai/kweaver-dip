import React, { useEffect, useState } from 'react'
import { Select } from 'antd'
import { useUpdateEffect } from 'ahooks'
import { formatError, getCoreBusinesses, ICoreBusinessItem } from '@/core'
import styles from './styles.module.less'
import __ from './locale'

interface IRelateCoreBusiness {
    value?: any
    disabled?: boolean
    projectId: string
    onChange?: (values) => void
}
const RelateCoreBusiness: React.FC<IRelateCoreBusiness> = ({
    value,
    disabled,
    projectId,
    onChange,
}) => {
    const [coreBusinessList, setCoreBusinessList] = useState<
        ICoreBusinessItem[]
    >([])
    const [data, setData] = useState(value)

    // 选择时回填数据
    useUpdateEffect(() => {
        if (value) {
            setData(value)
        }
    }, [value])

    const getCoreBusinessList = async () => {
        try {
            const res = await getCoreBusinesses({
                project_id: projectId,
                offset: 1,
                limit: 100,
            })
            setCoreBusinessList(res.entries)
        } catch (error) {
            formatError(error)
        }
    }
    useEffect(() => {
        if (projectId) {
            getCoreBusinessList()
        }
    }, [projectId])

    const handleChange = (e) => {
        setData(e)
        onChange?.(e)
    }

    return (
        <Select
            disabled={disabled}
            value={data}
            placeholder={__('请选择关联业务模型')}
            notFoundContent={
                <div style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
                    {__('暂无数据')}
                </div>
            }
            onChange={handleChange}
            className={styles.relateBusinessCascaderWrapper}
            getPopupContainer={(node) => node.parentNode}
        >
            {coreBusinessList.map((cb) => (
                <Select.Option
                    value={cb.business_model_id}
                    key={cb.business_model_id}
                >
                    {cb.name}
                </Select.Option>
            ))}
        </Select>
    )
}

export default RelateCoreBusiness
