import React, { useEffect, useMemo, useState } from 'react'
import { Table, Button, Space, Tooltip, Popover } from 'antd'
import { CloseCircleFilled, InfoCircleOutlined } from '@ant-design/icons'
import { Empty } from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'
import { formatError, getFrontWorkOrderTasks, WorkOrderStatus } from '@/core'
import __ from '../locale'
import styles from './styles.module.less'
import { OperateType } from '@/utils'
import {
    getOptionState,
    OrderStatusOptions,
    orderTaskStatusList,
} from '../../../helper'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'

const FusionOrderTaskTable = ({ workOrderId }: any) => {
    const [dataSource, setDataSource] = useState<any[]>([])
    // 操作类型
    const [operate, setOperate] = useState(OperateType.CREATE)
    // 操作选中的任务
    const [taskItem, setTaskItem] = useState<any>()
    const [detailVisible, setDetailVisible] = useState(false)

    // const handleOperate = async (op: OperateType, item?: any) => {
    //     setOperate(op)
    //     setTaskItem(item)
    //     switch (op) {
    //         case OperateType.DETAIL:
    //             setDetailVisible(true)
    //             break
    //         default:
    //             break
    //     }
    // }

    const getTasksById = async (work_order_id: string) => {
        try {
            const res = await getFrontWorkOrderTasks({
                work_order_id,
                offset: 1,
                limit: 999,
            })
            setDataSource(res?.entries || [])
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        if (workOrderId) {
            getTasksById(workOrderId)
        } else {
            setDataSource([])
        }
    }, [workOrderId])

    const columns = [
        {
            title: __('序号'),
            dataIndex: 'index',
            key: 'index',
            ellipsis: true,
            width: 80,
            render(_, record, index: number) {
                return <span>{index + 1}</span>
            },
        },
        {
            title: '任务名称',
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
            render: (text, record) => text ?? '--',
        },
        {
            title: '数据源',
            dataIndex: ['data_fusion', 'datasource_name'],
            key: 'datasource',
            ellipsis: true,
            render: (text, record) => text ?? '--',
        },
        {
            title: '融合目标表',
            dataIndex: ['data_fusion', 'data_table'],
            key: 'data_table',
            ellipsis: true,
            render: (text, record) => text ?? '--',
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            ellipsis: true,
            width: 140,
            render: (taskStatus, record) => {
                return (
                    <>
                        {getOptionState(taskStatus, orderTaskStatusList)}
                        {taskStatus === WorkOrderStatus.Failed && (
                            <Popover
                                placement="bottomLeft"
                                arrowPointAtCenter
                                overlayClassName={styles.PopBox}
                                content={
                                    <div className={styles.PopTip}>
                                        <div>
                                            <span className={styles.popTipIcon}>
                                                <CloseCircleFilled />
                                            </span>
                                            {__('异常原因')}
                                        </div>
                                        <div
                                            style={{
                                                wordBreak: 'break-all',
                                            }}
                                        >
                                            {record?.reason}
                                        </div>
                                    </div>
                                }
                            >
                                <FontIcon
                                    name="icon-xinxitishi"
                                    type={IconType.FONTICON}
                                    style={{
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        marginLeft: '4px',
                                        color: '#F5222D',
                                    }}
                                />
                            </Popover>
                        )}
                    </>
                )
            },
        },
    ]

    return (
        <div>
            {!dataSource?.length ? (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Empty iconSrc={dataEmpty} desc={__('暂无数据')} />
                </div>
            ) : (
                <Table
                    dataSource={dataSource}
                    columns={columns}
                    rowKey="id"
                    pagination={{
                        pageSize: 5,
                        showSizeChanger: false,
                        hideOnSinglePage: true,
                    }}
                />
            )}
        </div>
    )
}

export default FusionOrderTaskTable
