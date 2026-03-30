import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Card, message, Button, Tooltip } from 'antd'
import moment from 'moment'
import classnames from 'classnames'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import { values } from 'lodash'
import { editTask } from '@/core/apis/taskCenter/index'
import { ExecutorInfo } from '@/core/apis/taskCenter/index.d'
import styles from './styles.module.less'
import UserSearch from './UserSearch'
import { messageDebounce } from '@/core/graph/helper'
import {
    formatError,
    messageError,
    TaskConfigStatus,
    TaskType,
    TaskStatus,
} from '@/core'
import StatusSelect from '../TaskComponents/StatusSelect'
import DatePickerSelect from '../TaskComponents/DatePickerSelect'
import TaskCardMenu from '../TaskComponents/TaskCardMenu'
import {
    checkBeforeJumpModel,
    TaskTypeColor,
    TaskConfigStatusText,
} from '../TaskComponents/helper'
import { FontIcon, LinkOutlined } from '@/icons'
import { TabKey } from '../BusinessModeling/const'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import { IconType } from '@/icons/const'

interface TaskDataType {
    taskData: any
    projectId: string
    onView: (taskId: string) => void
    onUpdateNodeInfo: (data, hasFinish) => void
    color: string
    users: Array<ExecutorInfo> | null
    onDelete: (taskId: string) => void
    onEdit: (taskId: string) => void
}

const TaskCard = ({
    taskData,
    projectId,
    onView,
    onUpdateNodeInfo,
    color,
    users,
    onDelete,
    onEdit,
}: TaskDataType) => {
    const [taskInfo, setTaskInfo] = useState(taskData)
    const [dateData, setDateData] = useState<any>(moment(taskData.deadline))
    const [taskType, setTaskType] = useState(taskData.sub_type)
    const [newTaskStatus, setNewTaskStatus] = useState<string>('ready')
    const [executorId, setExecutorId] = useState<string>(taskData.executor_id)
    const [noUserBorder, setNoUserBorder] = useState<any>({})
    const [menuStatus, setMenuStatus] = useState<boolean>(false)
    const messageDebounced = messageDebounce(3000)
    const navigate = useNavigate()
    const [userInfo] = useCurrentUser()
    const userId = userInfo?.ID
    const { checkPermission } = useUserPermCtx()
    const location = useLocation()
    const hasOprAccess = useMemo(
        () => checkPermission('manageDataOperationProject') ?? false,
        [checkPermission],
    )

    useEffect(() => {
        setTaskInfo(taskData)
        setDateData(moment(taskData.deadline * 1000))
        setNewTaskStatus(taskData.status)
        setExecutorId(taskData.executor_id)
        setTaskType(taskData.sub_type)
        if (taskData.status === TaskStatus.ONGOING && !taskData.executor_id) {
            setNoUserBorder({ border: '1px solid #F5222D' })
        } else {
            setNoUserBorder({})
        }
    }, [taskData])

    /**
     * 编辑任务
     * @param editedData 被编辑的任务项
     */
    const editTaskData = async (editedData: any) => {
        try {
            if (editedData.status) {
                if (editedData.status === taskInfo.status) {
                    return
                }
                if (!taskData.executor_id) {
                    setNoUserBorder({ border: '1px solid #F5222D' })
                    setNewTaskStatus(taskData.status)
                    messageError('任务不能开启，任务缺少任务执行人')
                    return
                }
            }
            await editTask(taskData.id, {
                name: taskInfo.name,
                ...editedData,
                project_id: projectId,
            })
            if (editedData.status && editedData.status === 'completed') {
                onUpdateNodeInfo({ ...taskInfo, ...editedData }, true)
            } else {
                onUpdateNodeInfo({ ...taskInfo, ...editedData }, false)
            }
            message.success('编辑成功')
        } catch (e) {
            switch (true) {
                case e?.data?.code === 'TaskCenter.Task.TaskDomainNotExist':
                    messageError('关联业务领域被删除，可删除重建任务')
                    setNewTaskStatus(taskData.status)
                    return
                case !!editedData.status:
                    setNewTaskStatus(taskData.status)
                    break
                case !!editedData.executor_id:
                    setExecutorId(taskData.executor_id)
                    break
                case !!editedData.deadline:
                    setDateData(moment(taskData.deadline * 1000))
                    break
                default:
                    break
            }
            messageDebounced(() => {
                formatError(e)
            })
        }
    }

    const isWorkOrderTask = (task_type?: string) => {
        return [TaskType.DATACOMPREHENSIONWWORKORDER].includes(
            task_type as TaskType,
        )
    }

    const executeTask = async (e) => {
        e.stopPropagation()
        if (!taskData.executor_id) {
            setNoUserBorder({ border: '1px solid #F5222D' })
            messageError('任务不能开启，任务缺少任务执行人')
            return
        }
        if (taskData.sub_type === TaskType.DATACOLLECTING) {
            const backUrl = `/taskContent/project/${projectId}/content`
            const url = `/dataDevelopment/dataSynchronization?taskId=${
                taskData.id
            }&projectId=${projectId}&backUrl=${backUrl}&targetTab=${
                [TaskType.DATACOLLECTING, TaskType.DATAPROCESSING].includes(
                    taskData?.sub_type,
                )
                    ? TabKey.FORM
                    : ''
            }`
            // 执行任务时先将任务状态改成进行中
            checkBeforeJumpModel(
                true,
                (linkUrl: string) => {
                    navigate(linkUrl)
                },
                url,
                taskData.id,
                projectId,
                taskData.name,
                taskData.status,
                taskData.sub_type,
                taskData.executable_status,
                taskData.domain_id,
            )
        } else if (taskData.sub_type === TaskType.INDICATORPROCESSING) {
            const backUrl = `/taskContent/project/${projectId}/content`
            const url = `/dataDevelopment/indictorManage?taskId=${taskData.id}&projectId=${projectId}&backUrl=${backUrl}`
            // 执行任务时先将任务状态改成进行中
            checkBeforeJumpModel(
                true,
                (linkUrl: string) => {
                    navigate(linkUrl)
                },
                url,
                taskData.id,
                projectId,
                taskData.name,
                taskData.status,
                taskData.sub_type,
                taskData.executable_status,
                taskData.domain_id,
            )
        } else {
            const backUrl = encodeURIComponent(
                location.pathname + location.search,
            ) // `/taskContent/project/${projectId}/content`
            const url = `/${
                isWorkOrderTask(taskData.sub_type)
                    ? 'complete-work-order-task'
                    : 'complete-task'
            }?taskId=${
                taskData.id
            }&projectId=${projectId}&backUrl=${backUrl}&targetTab=${
                [TaskType.DATACOLLECTING, TaskType.DATAPROCESSING].includes(
                    taskData?.sub_type,
                )
                    ? TabKey.FORM
                    : ''
            }`
            // 执行任务时先将任务状态改成进行中
            checkBeforeJumpModel(
                true,
                (linkUrl: string) => {
                    navigate(linkUrl)
                },
                url,
                taskData.id,
                projectId,
                taskData.name,
                taskData.status,
                taskData.sub_type,
                taskData.executable_status,
                taskData.domain_id,
            )
        }
    }

    return (
        <Card
            className={styles.taskCard}
            bodyStyle={{
                padding: 16,
            }}
            style={{
                borderLeft: `3px solid ${
                    TaskTypeColor[taskData.sub_type] || '#3e52b5'
                }`,
            }}
            onMouseMove={() => {
                setMenuStatus(true)
            }}
            onMouseLeave={() => {
                setMenuStatus(false)
            }}
            onClick={() => {
                onView(taskData.id)
            }}
        >
            <div className={styles.taskToolBar}>
                <div className={styles.taskTypeIcon}>
                    <FontIcon
                        name="icon-renwu"
                        type={IconType.COLOREDICON}
                        style={{ fontSize: 16 }}
                    />
                </div>
                <div
                    className={classnames({
                        [styles.taskName]: true,
                        [styles.taskTitleDisabled]: values(TaskConfigStatus)
                            .filter((v) => v !== TaskConfigStatus.NORMAL)
                            .includes(taskData.config_status),
                    })}
                >
                    {taskData.name}
                    {values(TaskConfigStatus)
                        .filter((v) => v !== TaskConfigStatus.NORMAL)
                        .includes(taskData.config_status) && (
                        <Tooltip
                            title={TaskConfigStatusText[taskData.config_status]}
                            placement="bottom"
                        >
                            <ExclamationCircleOutlined
                                className={styles.deleteIcon}
                            />
                        </Tooltip>
                    )}
                </div>
                <div
                    className={styles.taskMenu}
                    onClick={(e) => e.stopPropagation()}
                    hidden={taskInfo.status === 'completed'}
                    style={{
                        visibility: menuStatus ? 'visible' : 'hidden',
                    }}
                >
                    <TaskCardMenu
                        status={newTaskStatus}
                        isLoseEfficacy={values(TaskConfigStatus)
                            .filter(
                                (v) =>
                                    v !== TaskConfigStatus.NORMAL &&
                                    v !== TaskConfigStatus.EXECUTORDELETE,
                            )
                            .includes(taskData.config_status)}
                        onTriggerEdit={() => {
                            onEdit(taskData.id)
                        }}
                        onTriggerView={() => {
                            onView(taskData.id)
                        }}
                        onTriggerDelete={() => {
                            onDelete(taskData.id)
                        }}
                    />
                </div>
            </div>
            <div className={styles.taskConfig}>
                <UserSearch
                    onSelect={(userName, user) => {
                        setTaskInfo({
                            ...taskInfo,
                            executor_id: user.id,
                        })
                        editTaskData({ executor_id: user.id })
                        setExecutorId(user.id)
                        setNoUserBorder({})
                    }}
                    style={noUserBorder}
                    projectId={projectId}
                    userid={executorId}
                    nodeId={taskData?.node_id || ''}
                    allUsers={users}
                    status={taskData.status}
                    userName={taskData.executor_name}
                    taskType={taskType}
                    disabled={
                        !hasOprAccess ||
                        values(TaskConfigStatus)
                            .filter(
                                (v) =>
                                    v !== TaskConfigStatus.NORMAL &&
                                    v !== TaskConfigStatus.EXECUTORDELETE,
                            )
                            .includes(taskData.config_status) ||
                        taskData.status === 'completed'
                    }
                />
                <StatusSelect
                    taskId={taskData.id}
                    disabled={
                        !hasOprAccess ||
                        values(TaskConfigStatus)
                            .filter((v) => v !== TaskConfigStatus.NORMAL)
                            .includes(taskData.config_status) ||
                        taskData.status === 'completed'
                    }
                    status={newTaskStatus}
                    taskType={taskData.sub_type}
                    onChange={(status) => {
                        setNewTaskStatus(status)
                        editTaskData({
                            status,
                        })
                    }}
                />
            </div>
            <div className={styles.taskConfig}>
                {taskData.deadline ? (
                    <DatePickerSelect
                        date={dateData}
                        onChange={(date, dateString) => {
                            setDateData(date)
                            editTaskData({
                                deadline:
                                    date?.endOf('day').unix() ||
                                    taskData.deadline,
                            })
                        }}
                        overdue={taskData.overdue}
                        disabled={
                            !hasOprAccess ||
                            values(TaskConfigStatus)
                                .filter((v) => v !== TaskConfigStatus.NORMAL)
                                .includes(taskData.config_status) ||
                            taskData.status === 'completed'
                        }
                    />
                ) : (
                    <div />
                )}
                {taskData.sub_type !== TaskType.NORMAL &&
                !values(TaskConfigStatus)
                    .filter((v) => v !== TaskConfigStatus.NORMAL)
                    .includes(taskData.config_status) ? (
                    taskData.status !== 'completed' &&
                    hasOprAccess &&
                    // 任务需要本人才能执行 -- bug:671851
                    userId === executorId ? (
                        <Button
                            type="link"
                            icon={<LinkOutlined className={styles.linkIcon} />}
                            onClick={(e) => executeTask(e)}
                        >
                            执行任务
                        </Button>
                    ) : (
                        taskData.status === 'completed' && (
                            <Button
                                type="link"
                                icon={
                                    <LinkOutlined className={styles.linkIcon} />
                                }
                                onClick={(e) => executeTask(e)}
                            >
                                执行结果
                            </Button>
                        )
                    )
                ) : null}
            </div>
        </Card>
    )
}

export default TaskCard
