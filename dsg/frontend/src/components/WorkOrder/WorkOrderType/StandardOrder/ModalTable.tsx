import { Button, Space, Table } from 'antd'
import React, { useEffect, useMemo, useState } from 'react'
import __ from './locale'
import styles from './styles.module.less'
import { FixedType } from '@/components/CommonTable/const'
import { getDepartName } from '../../WorkOrderProcessing/helper'

/**
 * 标准化信息表单
 * @returns
 */
const ModalTable = ({ readOnly, data, onChange, onStandardzing }: any) => {
    const [dataSource, setDataSource] = useState<any[]>()

    useEffect(() => {
        if (data?.length && Array.isArray(data)) {
            setDataSource(data)
        }
    }, [data])

    const handleRemove = (viewId: string) => {
        const newData = (dataSource || []).filter((o) => o?.id !== viewId)
        setDataSource(newData)
        onChange?.(newData)
    }

    const columns = [
        {
            title: (
                <div>
                    <span>{__('库表业务名称')}</span>
                    <span
                        style={{
                            color: 'rgba(0,0,0,0.45)',
                            fontWeight: 'normal',
                        }}
                    >
                        （{__('描述')}）
                    </span>
                </div>
            ),
            dataIndex: 'business_name',
            key: 'business_name',
            ellipsis: true,
            width: 200,
            render: (text, record) => (
                <div className={styles.titleBox}>
                    <div className={styles.sourceTitle}>
                        <div title={text}>{text || '--'}</div>
                    </div>
                    <div
                        className={styles.sourceContent}
                        title={record?.description}
                    >
                        {record?.description || '--'}
                    </div>
                </div>
            ),
        },
        {
            title: __('库表技术名称'),
            dataIndex: 'technical_name',
            key: 'technical_name',
            ellipsis: true,
            width: 180,
            render: (text, record) => (
                <div className={styles.ellipsisTitle} title={text}>
                    {text || '--'}
                </div>
            ),
        },
        {
            title: __('标准化率'),
            dataIndex: 'fields',
            key: 'fields',
            render: (text, record) => {
                const standardCount =
                    text?.filter((o) => o?.standard_required && o?.data_element)
                        ?.length || 0
                const total = text?.length || 1
                return <span>{Math.ceil((standardCount * 100) / total)}%</span>
            },
        },
        {
            title: __('数据来源'),
            dataIndex: 'datasource_name',
            key: 'datasource_name',
            width: 180,
            ellipsis: true,
            render: (text, record) => (
                <div className={styles.ellipsisTitle} title={text}>
                    {text || '--'}
                </div>
            ),
        },
        {
            title: __('所属部门'),
            dataIndex: 'department_path',
            key: 'department_path',
            width: 180,
            ellipsis: true,
            render: (text, record) => (
                <div className={styles.ellipsisTitle} title={text}>
                    {getDepartName(text) || '--'}
                </div>
            ),
        },
        {
            title: __('操作'),
            key: 'action',
            width: 120,
            fixed: FixedType.RIGHT,
            render: (_, record) => {
                return (
                    <Space size={16}>
                        <Button
                            type="link"
                            onClick={() => onStandardzing?.(record)}
                        >
                            标准化
                        </Button>
                        <Button
                            type="link"
                            onClick={() => handleRemove(record?.id)}
                        >
                            移除
                        </Button>
                    </Space>
                )
            },
        },
    ]

    const curColumns = useMemo(() => {
        return readOnly ? columns?.filter((o) => o.key !== 'action') : columns
    }, [readOnly, dataSource])

    return (
        <Table
            columns={curColumns}
            dataSource={dataSource}
            pagination={{
                pageSize: 5,
                showSizeChanger: false,
                hideOnSinglePage: true,
            }}
        />
    )
}

export default ModalTable
