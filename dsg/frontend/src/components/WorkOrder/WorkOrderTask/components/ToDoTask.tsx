import { LinkOutlined } from '@ant-design/icons'
import { message, Tooltip, Button, Dropdown, Space, MenuProps } from 'antd'
import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
    TaskExecutableStatus,
    formatError,
    messageError,
    TaskType,
    editTask,
    getTasks,
} from '@/core'

import { ToDoTaskOutlined } from '@/icons'
import { getActualUrl } from '@/utils'
import { messageDebounce } from '@/components/Graph/helper'
import { ProjectStatus } from '@/components/ProjectManage/types'
import {
    StatusDomPregress,
    checkBeforeJumpModel,
    getTaskTypeIcon,
} from './helper'

import Empty from '@/ui/Empty'
import dataEmpty from '@/assets/dataEmpty.svg'

import styles from './styles.module.less'
import __ from './locale'
import { TaskInfos } from '@/core/apis/taskCenter/index.d'

const TaskMaxNumber = 8

const ToDoTask: React.FC = () => {
    const messageDebounced = messageDebounce(3000)

    const navigate = useNavigate()

    const location = useLocation()

    const [taskInfos, setTaskInfos] = useState<TaskInfos>()

    const statusDomEnums = StatusDomPregress()

    useEffect(() => {
        getTaskList()
    }, [])

    // 获取待办任务列表
    const getTaskList = async () => {
        try {
            const res = await getTasks({
                offset: 1,
                limit: TaskMaxNumber,
                executable_status: TaskExecutableStatus.EXECUTABLE,
            })
            setTaskInfos(res)
            // 测试数据
            // setTaskList(myTaskList)
        } catch (e) {
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

    /**
     * 处理任务操作
     * @param itemInfo
     */
    const handleTaskOpr = (itemInfo: any) => {
        const {
            id,
            name,
            project_name,
            task_type,
            status,
            project_id,
            domain_id,
            executable_status,
        } = itemInfo

        if (task_type === TaskType.NORMAL) {
            chgNormalTaskStatus(itemInfo)
        } else if (task_type === TaskType.DATACOLLECTING) {
            const backUrl = location.pathname
            const url = `/dataDevelopment/dataSynchronization?projectId=${project_id}&taskId=${id}&backUrl=${backUrl}`
            // 执行任务时先将任务状态改成进行中
            checkBeforeJumpModel(
                false,
                (linkUrl: string) => {
                    navigate(linkUrl)
                },
                url,
                id,
                project_id,
                name,
                status,
                task_type,
                executable_status,
                domain_id,
            )
        } else {
            const backUrl = location.pathname
            const url = `/${
                isWorkOrderTask(task_type)
                    ? 'complete-work-order-task'
                    : 'complete-task'
            }?projectId=${project_id}&taskId=${id}&backUrl=${backUrl}`

            // 执行任务时先将任务状态改成进行中
            checkBeforeJumpModel(
                false,
                (linkUrl: string) => {
                    navigate(linkUrl)
                },
                url,
                id,
                project_id,
                name,
                status,
                task_type,
                executable_status,
                domain_id,
            )
        }
    }

    /**
     * 修改普通任务status
     * @param editedData 被编辑的任务项 { status: completed }
     */
    const chgNormalTaskStatus = async (itemInfo: any) => {
        try {
            //  进行中
            if (itemInfo.status === ProjectStatus.UNSTART) {
                await editTask(itemInfo.id, {
                    name: itemInfo.name,
                    status: ProjectStatus.PROGRESS,
                })
                message.success({
                    content: __('任务进行中'),
                    className: styles.msgProgress,
                    style: { fill: '#126EE3' },
                })
            } else if (itemInfo.status === ProjectStatus.PROGRESS) {
                await editTask(itemInfo.id, {
                    name: itemInfo.name,
                    status: ProjectStatus.COMPLETED,
                })
                message.success(__('任务已完成'))
            }
            // 刷新数据
            getTaskList()
        } catch (e) {
            switch (true) {
                case e?.data?.code === 'TaskCenter.Task.TaskDomainNotExist':
                    messageError(__('关联主题域被删除，可删除重建任务'))
                    return
                default:
                    break
            }
            messageDebounced(() => {
                formatError(e)
            })
        }
    }

    const renderTaskItem = (itemInfo: any) => {
        const { id, name, project_name, task_type, status } = itemInfo

        return (
            <div className={styles.taskItem}>
                <div className={styles.taskItemInfo}>
                    <div className={styles.taskItemHeader}>
                        <div className={styles.taskItemNameInfo}>
                            {getTaskTypeIcon(itemInfo.task_type, true)}
                            <Tooltip title={name}>
                                <span className={styles.taskName}>{name}</span>
                            </Tooltip>
                        </div>
                        <div className={styles.taskStatus}>
                            {/* <span>进行中</span> */}
                            {statusDomEnums[status]}
                        </div>
                    </div>

                    {project_name && (
                        <div className={styles.taskProjName}>
                            {__('项目：')}
                            <Tooltip title={project_name}>
                                {project_name}
                            </Tooltip>
                        </div>
                    )}
                </div>
                <div className={styles.oprTask}>
                    <div
                        className={styles.executeTaskBtn}
                        onClick={() => handleTaskOpr(itemInfo)}
                    >
                        <LinkOutlined className={styles.linkIcon} />
                        <span>
                            {task_type === TaskType.NORMAL &&
                            status === ProjectStatus.PROGRESS
                                ? __('完成任务')
                                : __('执行任务')}
                        </span>
                    </div>
                </div>
            </div>
        )
    }

    const taskItems: MenuProps['items'] = taskInfos?.entries
        ?.slice(0, TaskMaxNumber)
        .map((item) => {
            return {
                key: item.id!,
                label: renderTaskItem(item),
            }
        })

    // 空白添加显示
    const showEmpty = () => {
        const desc = <div>{__('暂无待办任务')}</div>
        return (
            <div className={styles.cf_empty}>
                <Empty desc={desc} iconSrc={dataEmpty} />
            </div>
        )
    }

    const taskDropDown = (menu) => (
        <div>
            <div className={styles.taskListTitle}>{__('待办任务')}</div>
            {React.cloneElement(menu as React.ReactElement)}
            {/* 任务数量大于 TaskMaxNumber 显示 */}
            {taskItems &&
                taskItems.length > 0 &&
                TaskMaxNumber < Number(taskInfos?.total_executable_tasks) && (
                    <Button
                        type="link"
                        className={styles.checkAll}
                        href={getActualUrl(
                            `/workOrderTask?state=${TaskExecutableStatus.EXECUTABLE}`,
                        )}
                    >
                        {__('查看全部')}
                    </Button>
                )}
            <div className={styles.empty} hidden={!!taskItems?.length}>
                {showEmpty()}
            </div>
        </div>
    )

    return (
        <div className={styles.taskInfo}>
            <Dropdown
                menu={{ items: taskItems }}
                overlayClassName={styles.taskInfoDropdown}
                placement="bottomRight"
                arrow
                getPopupContainer={(node) => node.parentNode as HTMLElement}
                dropdownRender={(menu) => taskDropDown(menu)}
            >
                <a
                    onClick={(e) => e.preventDefault()}
                    onMouseEnter={() => getTaskList()}
                >
                    <Space>
                        <ToDoTaskOutlined className={styles.taskIcon} />
                    </Space>
                </a>
            </Dropdown>
        </div>
    )
}

export default ToDoTask
