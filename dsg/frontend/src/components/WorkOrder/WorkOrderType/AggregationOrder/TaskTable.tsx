import { Popover, Table } from 'antd'
import { useEffect, useState } from 'react'
import { CloseCircleFilled } from '@ant-design/icons'
import dataEmpty from '@/assets/dataEmpty.svg'
import { Empty } from '@/ui'
import styles from './styles.module.less'
import { formatError, getFrontWorkOrderTasks, WorkOrderStatus } from '@/core'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import { getOptionState, orderTaskStatusList } from '../../helper'
import TaskDimTable from './TaskDimTable'

/** 华奥对接任务 */
const TaskTable = ({ workOrderId }: any) => {
    const [tasks, setTasks] = useState<any[]>([])
    const [expandedRowKeys, setExpandedRowKeys] = useState<any>([])

    const getTasksById = async (work_order_id: string) => {
        try {
            const res = await getFrontWorkOrderTasks({
                work_order_id,
                offset: 1,
                limit: 999,
            })
            setTasks(res?.entries || [])
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        if (workOrderId) {
            getTasksById(workOrderId)
        } else {
            setTasks([])
        }
    }, [workOrderId])

    const columns = [
        {
            title: '序号',
            dataIndex: 'index',
            key: 'index',
            render: (text, record, index) =>
                tasks.findIndex((task) => task.id === record.id) + 1,
        },
        {
            title: '任务名称',
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
            render: (text, record) =>
                text ? (
                    <span
                        className={styles.link}
                        // onClick={() => onShowTaskDetail?.(record)}
                    >
                        {text}
                    </span>
                ) : (
                    '--'
                ),
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            ellipsis: true,
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
                                            异常原因
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

    const expandedRowRender = (record) => {
        // 归集数据表维度
        return <TaskDimTable data={record?.data_aggregation} />
    }

    return (
        <div>
            {!tasks?.length ? (
                <div className={styles.tableEmpty}>
                    <Empty iconSrc={dataEmpty} desc="暂无数据" />
                </div>
            ) : (
                <Table
                    dataSource={tasks}
                    columns={columns}
                    rowKey="id"
                    rowClassName={styles['task-table-row']}
                    expandable={{
                        expandedRowRender,
                        rowExpandable: (record) =>
                            record?.data_aggregation?.length > 0,
                        childrenColumnName: '__children__',
                        expandedRowKeys,
                        onExpand: (expanded, record: any) => {
                            if (expanded) {
                                setExpandedRowKeys([
                                    ...expandedRowKeys,
                                    record.id,
                                ])
                            } else {
                                setExpandedRowKeys(
                                    expandedRowKeys.filter(
                                        (key) => key !== record.id,
                                    ),
                                )
                            }
                        },
                    }}
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

export default TaskTable
