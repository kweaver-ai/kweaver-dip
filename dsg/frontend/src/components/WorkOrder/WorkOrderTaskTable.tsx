import React, { useEffect, useMemo, useState } from 'react'
import { Table, Button, Space } from 'antd'
import { Empty } from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'
import { formatError, getTasks, TaskPriority, TaskType } from '@/core'
import styles from './styles.module.less'
import { taskPriorityInfos } from '../TaskComponents/helper'
import { PriorityLabel } from '../TaskComponents/PrioritySelect'
import { statusInfos } from '../MyTask/const'
import { StatusLabel } from '../MyTask/custom/StatusComponent'
import CreateTask from './WorkOrderTask/components/CreateTask'
import { OperateType } from '@/utils'
import TaskDetails from './WorkOrderTask/components/TaskDetails'
import DeleteTask from './WorkOrderTask/components/DeleteTask'
import { OrderType } from './helper'

const OrderTaskMap = {
    [OrderType.COMPREHENSION]: TaskType.DATACOMPREHENSIONWWORKORDER,
    [OrderType.RESEARCH_REPORT]: TaskType.RESEARCHREPORTWWORKORDER,
    [OrderType.DATA_CATALOG]: TaskType.DATACATALOGWWORKORDER,
    [OrderType.FRONT_PROCESSORS]: TaskType.FRONTPROCESSORSWWORKORDER,
}

const WorkOrderTaskTable = ({
    readOnly,
    onChange,
    workOrderId,
    orderType,
}: any) => {
    const [dataSource, setDataSource] = useState<any[]>([])
    const [createVisible, setCreateVisible] = useState(false)
    const [delVisible, setDelVisible] = useState(false)
    // 操作类型
    const [operate, setOperate] = useState(OperateType.CREATE)
    // 操作选中的任务
    const [taskItem, setTaskItem] = useState<any>()
    const [detailVisible, setDetailVisible] = useState(false)
    const createEditData = () => {
        // 创建操作
        if (operate === OperateType.CREATE) {
            return [
                { name: 'main_biz', hidden: true },
                { name: 'biz_form', hidden: true },
                {
                    name: 'task_type',
                    value: OrderTaskMap?.[orderType],
                    disabled: true,
                },
                // { name: 'assets_cat', hidden: true },
            ]
        }
        // 编辑操作
        return [
            { name: 'project_id', disabled: true },
            { name: 'stage_node', disabled: true },
            { name: 'task_type', disabled: true },
        ]
    }

    const handleOperate = async (op: OperateType, item?: any) => {
        setOperate(op)
        setTaskItem(item)

        switch (op) {
            case OperateType.CREATE:
                setCreateVisible(true)
                break
            case OperateType.DELETE:
                setDelVisible(true)
                break
            case OperateType.EDIT:
                setCreateVisible(true)
                break
            case OperateType.DETAIL:
                setDetailVisible(true)
                break
            default:
                break
        }
    }

    const getTasksById = async (work_order_id: string) => {
        try {
            const res = await getTasks({ work_order_id, limit: 999 } as any)
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

    const handleAdd = () => {
        handleOperate(OperateType.CREATE, undefined)
    }

    const columns = [
        {
            title: (
                <div>
                    <span>任务名称</span>
                    <span style={{ color: 'rgba(0,0,0,0.45)' }}>（描述）</span>
                </div>
            ),
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
            render: (text, record) => (
                <div className={styles.taskBox}>
                    <div className={styles.taskTitle}>
                        <div
                            title={text}
                            onClick={() =>
                                handleOperate(OperateType.DETAIL, record)
                            }
                        >
                            {text || '--'}
                        </div>
                    </div>
                    <div
                        className={styles.taskContent}
                        title={record?.description}
                    >
                        {record?.description || '暂无描述'}
                    </div>
                </div>
            ),
        },
        {
            title: '任务状态',
            dataIndex: 'status',
            key: 'status',
            ellipsis: true,
            render: (taskStatus, record) =>
                statusInfos
                    .filter((info) => info.value === record.status)
                    .map((info) => {
                        return (
                            <StatusLabel
                                key={record.id}
                                taskId={record.id}
                                taskType={record.task_type}
                                status={taskStatus}
                                label={info.label}
                                color={info.color}
                                bgColor={info.backgroundColor}
                            />
                        )
                    }),
        },
        {
            title: '任务优先级',
            dataIndex: 'priority',
            key: 'priority',
            ellipsis: true,
            render: (_, record) => {
                const pri =
                    taskPriorityInfos[record?.priority || TaskPriority.COMMON]
                return (
                    <PriorityLabel
                        key={record.id}
                        label={pri.label}
                        color={pri.color}
                    />
                )
            },
        },
        {
            title: '任务执行人',
            dataIndex: 'executor_name',
            key: 'executor_name',
            ellipsis: true,
            render: (text, record) => text ?? '未分配',
        },
        {
            title: '操作',
            key: 'action',
            width: 100,
            render: (text, record) => (
                <Space>
                    <Button
                        type="link"
                        key="edit"
                        onClick={(e) => {
                            e.stopPropagation()
                            handleOperate(OperateType.EDIT, record)
                        }}
                    >
                        编辑
                    </Button>
                    <Button
                        type="link"
                        key="delete"
                        onClick={(e) => {
                            e.stopPropagation()
                            handleOperate(OperateType.DELETE, record)
                        }}
                    >
                        删除
                    </Button>
                </Space>
            ),
        },
    ]

    const currentColumns = useMemo(() => {
        const ignoreAttr = readOnly ? 'action' : 'status'
        return columns?.filter((o) => o.key !== ignoreAttr)
    }, [readOnly])

    return (
        <div>
            {!readOnly && dataSource?.length > 0 && (
                <Button
                    type="primary"
                    onClick={handleAdd}
                    style={{ marginBottom: 16 }}
                >
                    添加
                </Button>
            )}
            {!dataSource?.length ? (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Empty
                        iconSrc={dataEmpty}
                        desc={
                            readOnly ? (
                                <span>暂无数据</span>
                            ) : (
                                <span>
                                    点击<a onClick={handleAdd}>【添加】</a>
                                    可添加工单任务
                                </span>
                            )
                        }
                    />
                </div>
            ) : (
                <Table
                    dataSource={dataSource}
                    columns={currentColumns}
                    rowKey="id"
                    pagination={{
                        pageSize: 3,
                        showSizeChanger: false,
                        hideOnSinglePage: true,
                    }}
                />
            )}

            <CreateTask
                show={createVisible}
                operate={operate}
                workOrderId={workOrderId}
                defaultTaskType={
                    OrderTaskMap?.[orderType]
                        ? [OrderTaskMap?.[orderType]]
                        : undefined
                }
                title={`${
                    operate === OperateType.CREATE ? '新建' : '编辑'
                }任务`}
                pid={taskItem?.project_id}
                tid={taskItem?.id}
                defaultData={createEditData()}
                isSupportFreeTask
                onClose={(info) => {
                    setCreateVisible(false)
                    if (info) {
                        getTasksById(workOrderId)
                        setTaskItem(undefined)
                    }
                }}
            />

            <TaskDetails
                visible={detailVisible}
                taskId={taskItem?.id || ''}
                projectId={taskItem?.project_id}
                onClose={() => setDetailVisible(false)}
            />
            {delVisible && (
                <DeleteTask
                    projectId={taskItem?.project_id || ''}
                    taskId={taskItem?.id || ''}
                    onClose={(data) => {
                        setDelVisible(false)
                        setTaskItem(undefined)
                        if (data && data.id) {
                            getTasksById(workOrderId)
                        }
                    }}
                />
            )}
        </div>
    )
}

export default WorkOrderTaskTable
