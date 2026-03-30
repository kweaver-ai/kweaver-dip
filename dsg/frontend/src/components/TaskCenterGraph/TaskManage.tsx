import React, { useState, useEffect, useMemo } from 'react'
import { Node, Cell } from '@antv/x6'
import { cloneDeep, trim, noop, String } from 'lodash'
import {
    PlusOutlined,
    CloseOutlined,
    LoadingOutlined,
    CaretDownOutlined,
} from '@ant-design/icons'
import {
    Drawer,
    Button,
    Card,
    Input,
    Form,
    message,
    Dropdown,
    Cascader,
} from 'antd'
import { validateName } from '@/utils/validate'
import {
    getProjectInfo,
    getTasks,
    createTask,
    getTaskDetail,
    getProjectWorkItem,
} from '@/core/apis/taskCenter/index'
import { CreateTaskParam, ExecutorInfo } from '@/core/apis/taskCenter/index.d'
import { messageDebounce } from '@/core/graph/helper'
import styles from './styles.module.less'
import TaskCard from './TaskCard'
import { StatusItems, StatusDom, OrderTypeOptions } from './helper'
import UserSearch from './UserSearch'
import TaskDetails from '../TaskComponents/TaskDetails'
import DeleteTask from '../TaskComponents/DeleteTask'
import { formatError, TaskType } from '@/core'
import CreateTask from '../TaskComponents/CreateTask'
import { OperateType } from '@/utils/const'
import dataEmpty from '@/assets/dataEmpty.svg'
import Empty from '@/ui/Empty'
import {
    TaskTypeLabel,
    getTaskTypeIcon,
    allTaskTypeList,
    TaskTypeColor,
} from '../TaskComponents/helper'
import { ProjectStatus } from '../ProjectManage/types'
import { ErrorInfo } from '@/utils'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import __ from './locale'
import CascadingDropdown from './CascadingDropdown'
import CreateWorkOrder from './CreateWorkOrder'
import { WorkItemType } from '../ProjectTask/const'
import WorkOrderCard from './WorkOrderCard'
import WorkOrderDetail from '@/components/WorkOrder/WorkOrderManage/DetailModal'
import WorkOrderTransfer from '@/components/WorkOrder/WorkOrderManage/TransferModal'

interface TaskManageType {
    projectId: string
    nodeInfo: Node | null
    stageInfo: Cell | null
    onClose: () => void
}

// 工单任务 添加面板
const TaskManage = ({
    projectId,
    nodeInfo,
    stageInfo,
    onClose = noop,
}: TaskManageType) => {
    const [id, setId] = useState('')
    const [workItemDatas, setWorkItemDatas] = useState<any>([])
    const [newItemData, setNewItemData] = useState<any>(null)
    const [dateData, setDateData] = useState<any>(null)
    const [createStatus, setCreateStatus] = useState<boolean>(false)
    const [projectInfo, setProjectInfo] = useState<any>(null)
    const [viewTaskId, setViewTaskId] = useState<string>('')
    const [users, setUsers] = useState<Array<ExecutorInfo> | null>(null)
    const [createLoad, setCreateLoad] = useState<boolean>(false)
    const [deleteTaskId, setDeleteTaskId] = useState<string>('')
    const [editTaskId, setEditTaskId] = useState<string>('')
    const [addOptions, setAddOptions] = useState<Array<any>>([])
    const messageDebounced = messageDebounce(3000)
    const { checkPermission } = useUserPermCtx()
    const hasOprAccess = useMemo(
        () => checkPermission('manageDataOperationProject') ?? false,
        [checkPermission],
    )

    const [currentWorkOrderType, setCurrentWorkOrderType] = useState<string>()
    const [form] = Form.useForm()
    const [workOrder, setWorkOrder] = useState<any>(null)
    const [detailVisible, setDetailVisible] = useState<boolean>(false)
    const [transferVisible, setTransferVisible] = useState<boolean>(false)

    useEffect(() => {
        const createTypes = nodeInfo
            ? JSON.parse(nodeInfo.data?.task_config?.task_type || '[]')
            : []
        const createWorkOrderTypes = nodeInfo
            ? JSON.parse(
                  nodeInfo.data?.work_order_config?.work_order_type || '[]',
              )
            : []
        setId(nodeInfo?.id || '')
        form.resetFields(['name'])
        setNewItemData(null)
        getWorkItemDatas()
        getProjectInfos()
        // getUsers(projectId, nodeInfo ? nodeInfo.id : '')

        const options: any = []
        if (createWorkOrderTypes?.length > 0) {
            options.push({
                label: __('工单'),
                value: 'work_order',
                children: OrderTypeOptions.filter((item) =>
                    createWorkOrderTypes.includes(item.value),
                ),
            })
        }
        if (createTypes?.length > 0) {
            options.push({
                label: __('任务'),
                value: 'task',
                children: allTaskTypeList
                    .filter((item) => createTypes.includes(item))
                    .map((value) => {
                        return {
                            label: TaskTypeLabel[value],
                            key: value,
                            // icon: getTaskTypeIcon(value),
                        }
                    }),
            })
        }
        setAddOptions(options)
    }, [nodeInfo])

    const handleAddTask = (taskType: TaskType) => {
        form.resetFields(['name'])
        setNewItemData({
            executor_id: '',
            name: '',
            node_id: nodeInfo?.id || '',
            stage_id: stageInfo?.id || '',
            node_name: nodeInfo?.data.name || '',
            stage_name: stageInfo?.data.name || '',
            task_type: taskType,
        })
    }

    /**
     * 获取列表数据
     */
    const getWorkItemDatas = async () => {
        try {
            const { entries: items, total_count } = await getProjectWorkItem(
                projectId,
                {
                    project_id: projectId,
                    node_id: nodeInfo?.id || '',
                    limit: 1000,
                },
            )
            setWorkItemDatas(items)
            // 更新总数
            if (nodeInfo) {
                nodeInfo.setData({
                    ...nodeInfo.data,
                    total_count: total_count ?? 0,
                })
            }
        } catch (e) {
            messageDebounced(() => {
                formatError(e)
            })
        }
    }

    /**
     * 更新状态数据
     */
    const updateNodeInfo = async (data: { id: string; name: string }) => {
        try {
            const newTaskDetail = await getTaskDetail(data.id)
            // 转换格式
            const workItemTask = {
                ...newTaskDetail,
                type: WorkItemType.TASK,
                sub_type: newTaskDetail.task_type,
            }

            if (nodeInfo && newTaskDetail.status === 'completed') {
                nodeInfo.setData({
                    ...nodeInfo.data,
                    finished_count: nodeInfo.data.finished_count + 1,
                })
            }
            workItemDatas.forEach((value, index) => {
                if (value.id === data.id) {
                    const newDatas = cloneDeep(workItemDatas)
                    newDatas[index] = workItemTask
                    setWorkItemDatas(newDatas)
                }
            })
        } catch (ex) {
            messageDebounced(() => {
                formatError(ex)
            })
        }
    }

    useEffect(() => {
        const completedCount = (workItemDatas || []).filter(
            (item: any) => item.status === 'completed',
        ).length
        if (nodeInfo && nodeInfo.data.finished_count !== completedCount) {
            nodeInfo.setData({
                ...nodeInfo.data,
                finished_count: completedCount,
            })
        }
    }, [workItemDatas])

    /**
     * 保存新建内容
     */
    const handlSaveNewTask = async (params: CreateTaskParam) => {
        try {
            const infos = await createTask({
                ...params,
                project_id: projectId,
            })
            message.success('添加成功')
            updateNewTask()
        } catch (e) {
            setCreateLoad(false)
            messageDebounced(() => {
                formatError(e)
            })
        }
    }

    const updateNewTask = async () => {
        try {
            await getWorkItemDatas()
            setNewItemData(null)
            setDateData(null)
            setCreateLoad(false)
        } catch (ex) {
            messageDebounced(() => {
                formatError(ex)
            })
        }
    }
    /**
     * 获取新增按钮状态
     */
    const getAddButtonStatus = () => {
        if (!nodeInfo) {
            return false
        }
        // if (!hasOprAccess) {
        //     return false
        // }
        // 项目完成无法添加任务
        if (projectInfo?.status === 'completed') {
            return false
        }
        const { data } = nodeInfo
        const { finished_count, total_count } = data
        if (total_count && finished_count === total_count) {
            return false
        }
        return true
    }

    // /**
    //  * 获取节点角色的所有用户
    //  * @param projectId 项目id
    //  * @param nodeId 节点id
    //  */
    // const getUsers = async (project_Id: string, nodeId: string) => {
    //     const allUsers = await getTaskSupportMembers(project_Id, nodeId)
    //     setUsers(allUsers)
    // }

    /**
     * 取消保存
     */
    const handlCancelNewTask = () => {
        setDateData(null)
        setNewItemData(null)
    }

    /**
     * 获取项目信息
     */
    const getProjectInfos = async () => {
        try {
            const projectData = await getProjectInfo(projectId)
            setProjectInfo(projectData)
        } catch (e) {
            messageDebounced(() => {
                formatError(e)
            })
        }
    }

    const projectNodeStageInfo = React.useMemo(() => {
        const info = {
            project: {
                id: projectInfo?.id,
                name: projectInfo?.name,
            },
            node: {
                id: nodeInfo?.id,
                name: nodeInfo?.data?.name,
            },
            stage: {
                id: stageInfo?.id,
                name: stageInfo?.data?.name,
            },
        }
        return info
    }, [projectInfo, nodeInfo, stageInfo])

    return (
        <div>
            <Drawer
                title={
                    <div className={styles.taskManageTitle}>
                        <div>添加工单/任务</div>
                        <div>
                            <CloseOutlined onClick={onClose} />
                        </div>
                    </div>
                }
                width={400}
                closable={false}
                mask={false}
                open={!!id}
                placement="right"
                getContainer={false}
                bodyStyle={{
                    padding: '24px 0',
                    overflow: 'hidden',
                    position: 'relative',
                }}
            >
                {projectInfo?.status === 'completed' &&
                !workItemDatas.length ? (
                    <Empty desc="该节点下无任务" iconSrc={dataEmpty} />
                ) : (
                    <div
                        className={styles.taskManage}
                        style={{ height: '100%' }}
                    >
                        <div style={{ padding: '0 24px' }}>
                            {/* 配置是否有快捷创建任务 */}
                            {newItemData &&
                            ![
                                TaskType.MODEL,
                                TaskType.DATAMODELING,
                                TaskType.MODELINGDIAGNOSIS,
                                TaskType.DATACOLLECTING,
                                TaskType.INDICATORPROCESSING,
                            ].includes(newItemData.task_type) ? (
                                <Card
                                    className={styles.taskAddCard}
                                    bodyStyle={{
                                        padding: 16,
                                    }}
                                    style={{
                                        borderLeft: `3px solid ${
                                            TaskTypeColor[
                                                newItemData.task_type
                                            ] || '#3e52b5'
                                        }`,
                                    }}
                                >
                                    <Form form={form} layout="vertical">
                                        <Form.Item
                                            name="name"
                                            validateFirst
                                            validateTrigger={[
                                                'onChange',
                                                'onBlur',
                                            ]}
                                            rules={[
                                                {
                                                    required: true,
                                                    transform: (
                                                        value: string,
                                                    ) => trim(value),
                                                    message: ErrorInfo.NOTNULL,
                                                },
                                            ]}
                                            style={{
                                                height: 80,
                                                marginBottom: '0',
                                            }}
                                        >
                                            <Input.TextArea
                                                className={styles.taskNameInput}
                                                placeholder="请输入任务名称"
                                                autoSize={false}
                                                maxLength={32}
                                                value={newItemData.name}
                                                style={{
                                                    height: '60px',
                                                    resize: 'none',
                                                }}
                                                onChange={(e) => {
                                                    setNewItemData({
                                                        ...newItemData,
                                                        name: e.target.value,
                                                    })
                                                }}
                                            />
                                        </Form.Item>
                                        <Form.Item noStyle>
                                            <div className={styles.taskConfig}>
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            display:
                                                                'inline-flex',
                                                            justifyContent:
                                                                'center',
                                                            alignItems:
                                                                'center',
                                                            marginRight: '10px',
                                                            width: '248px',
                                                        }}
                                                    >
                                                        <UserSearch
                                                            onSelect={(
                                                                userName,
                                                                user,
                                                            ) => {
                                                                setNewItemData({
                                                                    ...newItemData,
                                                                    executor_id:
                                                                        user.id,
                                                                })
                                                            }}
                                                            projectId={
                                                                projectId
                                                            }
                                                            nodeId={
                                                                nodeInfo?.id ||
                                                                ''
                                                            }
                                                            taskType={
                                                                newItemData.task_type
                                                            }
                                                            allUsers={users}
                                                            status={
                                                                ProjectStatus.UNSTART
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </Form.Item>
                                        <Form.Item noStyle>
                                            <div className={styles.taskButton}>
                                                <Button
                                                    type="link"
                                                    className={styles.button}
                                                    onClick={() => {
                                                        setCreateStatus(true)
                                                    }}
                                                    style={{ padding: 0 }}
                                                >
                                                    编辑更多
                                                </Button>
                                                <div>
                                                    <Button
                                                        className={`${styles.button} ${styles.midButton}`}
                                                        onClick={
                                                            handlCancelNewTask
                                                        }
                                                    >
                                                        取消
                                                    </Button>
                                                    <Button
                                                        type="primary"
                                                        className={
                                                            styles.button
                                                        }
                                                        onClick={async (e) => {
                                                            if (createLoad) {
                                                                e.preventDefault()
                                                            }
                                                            await form.validateFields()
                                                            setCreateLoad(true)
                                                            handlSaveNewTask(
                                                                newItemData,
                                                            )
                                                        }}
                                                        loading={createLoad}
                                                    >
                                                        确定
                                                    </Button>
                                                </div>
                                            </div>
                                        </Form.Item>
                                    </Form>
                                </Card>
                            ) : getAddButtonStatus() ? (
                                <CascadingDropdown
                                    options={addOptions}
                                    defaultValue={addOptions?.[0]?.value}
                                    onSelect={(selectedOption: any) => {
                                        const key = selectedOption?.key

                                        if (selectedOption?.isWorkOrder) {
                                            // 工单
                                            setCurrentWorkOrderType(key)
                                        } else if (
                                            // 任务
                                            [
                                                TaskType.MODEL,
                                                TaskType.DATAMODELING,
                                                TaskType.DATACOLLECTING,
                                                TaskType.MODELINGDIAGNOSIS,
                                                TaskType.INDICATORPROCESSING,
                                            ].includes(key)
                                        ) {
                                            setCreateStatus(true)
                                            setNewItemData({
                                                ...newItemData,
                                                task_type: key,
                                            })
                                        } else {
                                            handleAddTask(key)
                                        }
                                    }}
                                >
                                    <Button
                                        className={styles.addButton}
                                        icon={
                                            <PlusOutlined
                                                style={{
                                                    color: 'rgba(0,0,0,0.85)',
                                                }}
                                            />
                                        }
                                    >
                                        添加工单/任务
                                        <CaretDownOutlined />
                                    </Button>
                                </CascadingDropdown>
                            ) : null}
                        </div>
                        <div
                            style={{
                                position: 'relative',
                                height: '100%',
                            }}
                        >
                            <div className={styles.drawerBody}>
                                <div
                                    style={{
                                        paddingBottom: newItemData
                                            ? '170px'
                                            : '10px',
                                    }}
                                >
                                    {workItemDatas.map(
                                        (item: any, index: number) => (
                                            <div
                                                style={{
                                                    marginTop: 10,
                                                }}
                                                key={index.toString()}
                                            >
                                                {item.type ===
                                                WorkItemType.TASK ? (
                                                    <TaskCard
                                                        taskData={item}
                                                        onView={(
                                                            taskId: string,
                                                        ) => {
                                                            setViewTaskId(
                                                                taskId,
                                                            )
                                                        }}
                                                        onDelete={(
                                                            taskId: string,
                                                        ) => {
                                                            setDeleteTaskId(
                                                                taskId,
                                                            )
                                                        }}
                                                        onEdit={(taskId) => {
                                                            setEditTaskId(
                                                                taskId,
                                                            )
                                                        }}
                                                        users={users}
                                                        projectId={projectId}
                                                        color={
                                                            nodeInfo?.data
                                                                .color || ''
                                                        }
                                                        onUpdateNodeInfo={
                                                            updateNodeInfo
                                                        }
                                                    />
                                                ) : (
                                                    <WorkOrderCard
                                                        workOrderData={item}
                                                        onDetail={(it) => {
                                                            setWorkOrder({
                                                                ...it,
                                                                work_order_id:
                                                                    it.id,
                                                            })
                                                            setDetailVisible(
                                                                true,
                                                            )
                                                        }}
                                                        onTransfer={(it) => {
                                                            setWorkOrder({
                                                                ...it,
                                                                work_order_id:
                                                                    it.id,
                                                                responsible_uid:
                                                                    it.executor_id,
                                                                responsible_uname:
                                                                    it.executor_name,
                                                            })
                                                            setTransferVisible(
                                                                true,
                                                            )
                                                        }}
                                                        updateWorkOrder={() =>
                                                            updateNewTask()
                                                        }
                                                        projectId={projectId}
                                                        users={users}
                                                        color={
                                                            nodeInfo?.data
                                                                .color || ''
                                                        }
                                                    />
                                                )}
                                            </div>
                                        ),
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Drawer>
            <div>
                <CreateTask
                    show={createStatus}
                    operate={OperateType.CREATE}
                    title="添加任务"
                    defaultData={[
                        {
                            name: 'project_id',
                            disabled: true,
                            value: {
                                id: projectId,
                                name: projectInfo?.name,
                            },
                        },
                        {
                            name: 'stage_node',
                            disabled: true,
                            value: {
                                node_id: nodeInfo?.id || '',
                                stage_id: stageInfo?.id || '',
                                node_name: nodeInfo?.data.name || '',
                                stage_name: stageInfo?.data.name || '',
                                task_type: [newItemData?.task_type],
                            },
                        },
                        {
                            name: 'name',
                            disabled: false,
                            value: newItemData?.name,
                        },
                        {
                            name: 'task_type',
                            value: newItemData?.task_type,
                            disabled: true,
                        },
                        {
                            name: 'executor_id',
                            disabled: false,
                            value: newItemData?.executor_id,
                        },
                        { name: 'status', disabled: true },
                    ]}
                    onClose={(info) => {
                        if (info) {
                            updateNewTask()
                        }
                        setCreateStatus(false)
                    }}
                />
            </div>

            {viewTaskId ? (
                <TaskDetails
                    visible
                    taskId={viewTaskId}
                    projectId={projectId}
                    onClose={() => {
                        setViewTaskId('')
                    }}
                />
            ) : null}

            {workOrder && detailVisible && (
                <WorkOrderDetail
                    id={workOrder?.id}
                    type={workOrder?.sub_type}
                    onClose={() => {
                        setWorkOrder(undefined)
                        setDetailVisible(false)
                    }}
                />
            )}

            {workOrder && transferVisible && (
                <WorkOrderTransfer
                    item={workOrder}
                    visible={transferVisible}
                    onClose={(refresh?: boolean) => {
                        if (refresh) {
                            updateNewTask()
                        }
                        setWorkOrder(undefined)
                        setTransferVisible(false)
                    }}
                />
            )}

            {deleteTaskId ? (
                <DeleteTask
                    projectId={projectId}
                    taskId={deleteTaskId}
                    onClose={(data) => {
                        if (data && data.id) {
                            if (nodeInfo) {
                                nodeInfo.setData({
                                    ...nodeInfo.data,
                                    total_count: nodeInfo.data.total_count - 1,
                                })
                            }
                            const newDatas = cloneDeep(workItemDatas)
                            setWorkItemDatas(
                                newDatas.filter((value, index) => {
                                    return value.id !== data.id
                                }),
                            )
                            setDeleteTaskId('')
                        } else {
                            setDeleteTaskId('')
                        }
                    }}
                />
            ) : null}

            {currentWorkOrderType && (
                <CreateWorkOrder
                    type={currentWorkOrderType}
                    visible={!!currentWorkOrderType}
                    onClose={(refresh) => {
                        if (refresh) {
                            updateNewTask()
                        }
                        setCurrentWorkOrderType(undefined)
                    }}
                    projectNodeStageInfo={projectNodeStageInfo}
                />
            )}

            <CreateTask
                show={!!editTaskId}
                operate={OperateType.EDIT}
                title="编辑任务"
                pid={projectId}
                tid={editTaskId}
                defaultData={[
                    { name: 'project_id', disabled: true },
                    { name: 'stage_node', disabled: true },
                ]}
                onClose={(info) => {
                    if (info) {
                        updateNodeInfo(info)
                    }
                    setEditTaskId('')
                }}
            />
        </div>
    )
}

export default TaskManage
