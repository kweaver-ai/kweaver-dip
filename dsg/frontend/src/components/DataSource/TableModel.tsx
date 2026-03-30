import { Button, message, Space, Table } from 'antd'
import React, { useState } from 'react'

import { ExclamationCircleFilled } from '@ant-design/icons'
import moment from 'moment'
import {
    changeConnectStatus,
    delDataSource,
    formatError,
    getDataBaseDetails,
    ICoreBusinessItem,
    testConnectDatabase,
} from '@/core'
import { databaseTypesEleData } from '@/core/dataSource'
import { getPlatformNumber, OperateType } from '@/utils'
import { confirm } from '@/utils/modalHelper'
import { getConnectProtocol } from './const'
import Details from './Details'
import { dataServiceLabelList, editDataSourceOptions } from './helper'
import __ from './locale'
import styles from './styles.module.less'

interface ITableModelProps {
    dataSource: Array<ICoreBusinessItem>
    onOperate?: (type: OperateType, record: ICoreBusinessItem) => void
    onDeleteSuccess?: () => void
    handleTableChange?: (newPagination, filters, sorter) => void
    tableSort?: any
    totalCount?: any
    searchCondition?: any
}

const TableModel: React.FC<ITableModelProps> = ({
    dataSource,
    onOperate,
    onDeleteSuccess,
    handleTableChange,
    totalCount,
    searchCondition,
    tableSort,
}) => {
    const [detailsOpen, setDetailsOpen] = useState<boolean>(false)
    const [detailsId, setDetailsId] = useState<string>('')
    const platform = getPlatformNumber()

    // 格式化来源类型显示
    const formatSourceType = (sourceType: string) => {
        const option = editDataSourceOptions.find(
            (item) => item.value === sourceType,
        )
        return option?.label || dataServiceLabelList[sourceType] || '--'
    }
    // 删除数据源
    const delCoreBusiness = async (record: ICoreBusinessItem) => {
        try {
            await delDataSource(record.id)
            message.success(__('删除成功'))
            onDeleteSuccess?.()
        } catch (error) {
            formatError(error)
        }
    }

    // 删除确认
    const deleteConfirm = (record: ICoreBusinessItem) => {
        confirm({
            title: __('确认要删除数据源吗？'),
            icon: <ExclamationCircleFilled className={styles.delIcon} />,
            content: (
                <span style={{ color: '#FF4D4F' }}>
                    {__(
                        '删除后将无法找回数据源，若通过扫描该数据源产生了库表，其库表也会被同步删除，请谨慎操作！',
                    )}
                </span>
            ),
            onOk() {
                delCoreBusiness(record)
            },
        })
    }

    // 格式化数据库类型显示
    const formatDatabaseType = (type: string) => {
        if (!type) return '--'
        const typeData = databaseTypesEleData.dataBaseIcons[type]

        return typeData?.labelName || type || '--'
    }

    // 格式化更新时间显示
    const formatUpdateTime = (updatedAt: number | string) => {
        if (!updatedAt) return '--'
        return moment(updatedAt).format('YYYY-MM-DD HH:mm:ss')
    }

    // 处理操作
    const handleOperate = (type: OperateType, record: ICoreBusinessItem) => {
        onOperate?.(type, record)
    }

    const handleTest = async (record: ICoreBusinessItem) => {
        try {
            const baseDetail = await getDataBaseDetails(record.id)
            const res = await testConnectDatabase({
                type: ['hive-jdbc', 'hive-hadoop2'].includes(baseDetail.type)
                    ? 'hive'
                    : baseDetail.type,
                bin_data: {
                    database_name: baseDetail.database_name,
                    connect_protocol: getConnectProtocol(baseDetail.type),
                    host: baseDetail.host,
                    port: baseDetail.port,
                    account: baseDetail.username,
                    password: baseDetail.password,
                    schema: baseDetail?.schema || undefined,
                },
            })
            if (res.status) {
                message.success(__('测试连接成功'))
                await changeConnectStatus({
                    connect_status: 1,
                    id: record.id,
                })
            } else {
                message.error(__('测试连接失败'))
                await changeConnectStatus({
                    connect_status: 2,
                    id: record.id,
                })
            }
        } catch (err) {
            formatError(err)
        }
    }

    const columns: Array<any> = [
        {
            title: __('数据源名称'),
            dataIndex: 'name',
            key: 'name',
            width: 200,
            ellipsis: true,
            sorter: true,
            sortOrder: tableSort.name,
            showSorterTooltip: {
                title: __('按名称排序'),
                placement: 'bottom',
                overlayInnerStyle: {
                    color: '#fff',
                },
            },
        },
        {
            title: __('数据库名称'),
            dataIndex: 'database_name',
            key: 'database_name',
            width: 150,
            render: (databaseName: string) => databaseName || '--',
        },
        {
            title: __('连接类型'),
            dataIndex: 'type',
            key: 'type',
            width: 150,
            render: (type: string) => formatDatabaseType(type),
        },
        {
            title: __('来源'),
            dataIndex: 'source_type',
            key: 'source_type',
            width: 150,
            render: (sourceType: string) => formatSourceType(sourceType),
        },
        {
            title: __('所属部门'),
            dataIndex: 'department_name',
            key: 'department_name',
            width: 150,
            render: (text: string) => text || '--',
        },
        {
            title: __('操作'),
            key: 'action',
            fixed: 'right',
            width: 220,
            render: (_: any, record: ICoreBusinessItem) => (
                <Space size="middle">
                    <Button
                        type="link"
                        onClick={() => {
                            setDetailsOpen(true)
                            setDetailsId(record.id)
                        }}
                    >
                        {__('详细信息')}
                    </Button>
                    <Button
                        type="link"
                        onClick={() => handleOperate(OperateType.EDIT, record)}
                    >
                        {__('编辑来源/归属信息')}
                    </Button>
                </Space>
            ),
        },
    ]

    return (
        <div style={{ marginBottom: 16 }}>
            <Table
                dataSource={dataSource}
                columns={columns}
                rowKey="id"
                pagination={{
                    total: totalCount,
                    showQuickJumper: true,
                    showSizeChanger: true,
                    current: searchCondition.offset,
                    pageSize: searchCondition.limit,
                    showTotal: (count) => __('共${count}条', { count }),
                }}
                onChange={(newPagination, filters, sorter) => {
                    handleTableChange?.(newPagination, filters, sorter)
                }}
                scroll={{
                    y:
                        dataSource.length === 0
                            ? undefined
                            : 'calc(100vh - 245px)',
                }}
            />
            {detailsOpen && (
                <Details
                    open={detailsOpen}
                    onClose={() => {
                        setDetailsOpen(false)
                    }}
                    id={detailsId}
                />
            )}
        </div>
    )
}

export default TableModel
