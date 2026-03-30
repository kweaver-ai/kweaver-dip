import { Popover, Table } from 'antd'
import { useEffect, useState } from 'react'
import { CloseCircleFilled } from '@ant-design/icons'
import dataEmpty from '@/assets/dataEmpty.svg'
import { Empty } from '@/ui'
import styles from './styles.module.less'
import __ from './locale'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import { formatError, getFrontWorkOrderTasks, WorkOrderStatus } from '@/core'
import { getOptionState, orderTaskStatusList } from '../../helper'

/**
 * 检测 - 华奥对接任务
 */
const TaskTable = ({ workOrderId, onShowTaskDetail }: any) => {
    const [tasks, setTasks] = useState<any[]>([])

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
            title: __('序号'),
            dataIndex: 'index',
            key: 'index',
            render: (text, record, index) =>
                tasks.findIndex((task) => task.id === record.id) + 1,
        },
        {
            title: __('任务名称'),
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
            render: (text, record) => (
                <span
                // className={styles.link}
                // onClick={() => onShowTaskDetail?.(record)}
                >
                    {text || '--'}
                </span>
            ),
        },
        {
            title: __('数据源'),
            dataIndex: 'data_quality_audit',
            key: 'quality_data_source',
            ellipsis: true,
            render: (value: any) => {
                const { datasource_name } = value?.[0] || {}
                return (
                    <div className={styles.topInfo}>
                        {datasource_name || '--'}
                    </div>
                )
            },
        },
        {
            title: __('数据表'),
            dataIndex: 'data_quality_audit',
            key: 'quality_data_table',
            ellipsis: true,
            render: (value: any) => {
                const { data_table } = value?.[0] || {}
                return (
                    <div className={styles.topInfo}>{data_table || '--'}</div>
                )
            },
        },
        {
            title: __('检测方案'),
            dataIndex: 'data_quality_audit',
            key: 'quality_detection_scheme',
            ellipsis: true,
            render: (value: any) => {
                const { detection_scheme } = value?.[0] || {}
                return (
                    <div className={styles.topInfo}>
                        {detection_scheme || '--'}
                    </div>
                )
            },
        },
        {
            title: __('完成次数'),
            dataIndex: 'data_quality_audit',
            key: 'quality_finished_count',
            ellipsis: true,
            render: (value: any) => {
                const { finished_count } = value?.[0] || {}
                return (
                    <div className={styles.topInfo}>{finished_count || 0}</div>
                )
            },
        },
        {
            title: __('状态'),
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
                                            {__('异常原因')}
                                        </div>
                                        <div
                                            style={{
                                                wordBreak: 'break-all',
                                            }}
                                        >
                                            {record?.reason}
                                        </div>
                                        {/* <div>
                                            <a
                                            // onClick={() =>
                                            //     onShowTaskDetail?.(record)
                                            // }
                                            >
                                                {__('查看详情')}
                                            </a>
                                        </div> */}
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
            {!tasks?.length ? (
                <div className={styles.tableEmpty}>
                    <Empty iconSrc={dataEmpty} desc={__('暂无数据')} />
                </div>
            ) : (
                <Table
                    dataSource={tasks}
                    columns={columns}
                    rowKey="id"
                    rowClassName={styles['task-table-row']}
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
