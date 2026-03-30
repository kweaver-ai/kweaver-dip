import React, { useMemo } from 'react'
import { Button, Table } from 'antd'
import styles from './styles.module.less'
import __ from '../locale'
import { resourceTypeList, ResourceType } from '../const'
import { getScheduling } from '../helper'

interface IMountResourceTable {
    dataSource: any[]
    isMarket?: boolean
    governmentStatus?: boolean
    onDetailClick: (type: ResourceType, id: string) => void
}

const MountResourceTable: React.FC<IMountResourceTable> = ({
    dataSource,
    isMarket,
    governmentStatus,
    onDetailClick,
}) => {
    const columns: any = useMemo(() => {
        if (isMarket) {
            return [
                {
                    title: __('资源名称'),
                    dataIndex: 'name',
                    key: 'name',
                    ellipsis: true,
                },
                {
                    title: __('表技术名称'),
                    dataIndex: 'technical_name',
                    key: 'technical_name',
                    ellipsis: true,
                    render: (text, record) =>
                        record?.resource_type === ResourceType.DataView
                            ? text || '--'
                            : '--',
                },
                {
                    title: __('资源编码'),
                    dataIndex: 'code',
                    key: 'code',
                    ellipsis: true,
                },
                {
                    title: __('资源类型'),
                    dataIndex: 'resource_type',
                    key: 'resource_type',
                    ellipsis: true,
                    render: (text, record) =>
                        resourceTypeList?.find((item) => item.value === text)
                            ?.label || '--',
                },
                {
                    title: __('调度计划'),
                    dataIndex: 'scheduling',
                    key: 'scheduling',
                    render: (text, record) =>
                        record?.resource_type === ResourceType.DataView
                            ? getScheduling(record)
                            : '--',
                },
            ]
        }
        return [
            {
                title: __('资源名称'),
                dataIndex: 'name',
                key: 'name',
                ellipsis: true,
            },
            {
                title: __('表技术名称'),
                dataIndex: 'technical_name',
                key: 'technical_name',
                ellipsis: true,
                render: (text, record) =>
                    record?.resource_type === ResourceType.DataView
                        ? text || '--'
                        : '--',
            },
            {
                title: __('资源类型'),
                dataIndex: 'resource_type',
                key: 'resource_type',
                ellipsis: true,
                render: (text, record) =>
                    resourceTypeList?.find((item) => item.value === text)
                        ?.label || '--',
            },
            {
                title: __('资源编码'),
                dataIndex: 'code',
                key: 'code',
                ellipsis: true,
            },
            // {
            //     title: __('数据Owner'),
            //     dataIndex: 'owner',
            //     key: 'owner',
            //     ellipsis: true,
            //     render: (text, record) => text || '--',
            // },
            {
                title: __('调度计划'),
                dataIndex: 'scheduling',
                key: 'scheduling',
                render: (text, record) =>
                    record?.resource_type === ResourceType.DataView
                        ? getScheduling(record)
                        : '--',
            },
            {
                title: __('操作'),
                key: 'action',
                width: 120,
                render: (_: string, record) => {
                    return (
                        <Button
                            type="link"
                            onClick={(e) => {
                                e.stopPropagation()
                                onDetailClick(
                                    record.resource_type,
                                    record.resource_id,
                                )
                            }}
                        >
                            {__('详情')}
                        </Button>
                    )
                },
            },
        ]
    }, [isMarket])

    return (
        <Table
            bordered={isMarket}
            className={isMarket ? styles.marketTableWrapper : undefined}
            columns={
                governmentStatus
                    ? columns
                    : columns.filter((o) => o.key !== 'scheduling')
            }
            rowKey="resource_id"
            dataSource={dataSource}
            pagination={{
                showSizeChanger: false,
                hideOnSinglePage: true,
            }}
        />
    )
}
export default MountResourceTable
