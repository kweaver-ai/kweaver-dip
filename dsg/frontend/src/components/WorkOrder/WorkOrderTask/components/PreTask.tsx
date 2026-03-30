import React, { useEffect, useState } from 'react'
import classnames from 'classnames'
import { AvatarOutlined } from '@/icons'
import { getTaskTypeIcon, StatusDomPregress, taskStatusList } from './helper'
import { getTasks } from '@/core/apis/taskCenter'
import { TaskInfo } from '@/core/apis/taskCenter/index.d'
import styles from './styles.module.less'
import Empty from '@/ui/Empty'
import dataEmpty from '@/assets/dataEmpty.svg'
import { formatError, TaskStatus } from '@/core'
import __ from './locale'
import Loader from '@/ui/Loader'

interface IPreTask {
    nodeId?: string
    projectId?: string
}
const PreTask: React.FC<IPreTask> = ({ nodeId, projectId }) => {
    const [selectedTab, setSelectedTab] = useState<TaskStatus | 'all'>('all')
    const [tasks, setTasks] = useState<TaskInfo[]>([])
    const [showTasks, setShowTasks] = useState<TaskInfo[]>([])
    const [loading, setLoading] = useState(false)

    const getPreTasks = async () => {
        if (!nodeId || !projectId) {
            setTasks([])
            setShowTasks([])
            return
        }
        try {
            setLoading(true)
            const res = await getTasks({
                node_id: nodeId,
                project_id: projectId,
                is_pre: true,
                limit: 1000,
            })
            setTasks(res.entries || [])
            setShowTasks(res.entries || [])
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        getPreTasks()
    }, [nodeId, projectId])

    const getTaskCount = (type: TaskStatus | 'all') => {
        switch (type) {
            case 'all':
                return tasks.length

            case TaskStatus.READY:
                return tasks.filter((item) => item.status === TaskStatus.READY)
                    .length
            case TaskStatus.ONGOING:
                return tasks.filter(
                    (item) => item.status === TaskStatus.ONGOING,
                ).length
            default:
                return 0
        }
    }

    const handleClick = (type: TaskStatus | 'all') => {
        setSelectedTab(type)
        switch (type) {
            case 'all':
                setShowTasks(tasks)
                break
            case TaskStatus.READY:
                setShowTasks(
                    tasks.filter((item) => item.status === TaskStatus.READY),
                )
                break
            case TaskStatus.ONGOING:
                setShowTasks(
                    tasks.filter((item) => item.status === TaskStatus.ONGOING),
                )
                break
            default:
                break
        }
    }

    return (
        <div className={styles.preTaskWrapper}>
            {loading ? (
                <div className={styles.loading}>
                    <Loader />
                </div>
            ) : tasks.length > 0 ? (
                <>
                    <div className={styles.statusTabs}>
                        {taskStatusList.map((item) => (
                            <div
                                key={item.key}
                                className={classnames(
                                    styles.tab,
                                    item.key === 'all' && styles.firstTab,
                                    item.key === TaskStatus.ONGOING &&
                                        styles.lastTab,
                                    selectedTab === item.key &&
                                        styles.selectedTab,
                                )}
                                onClick={() =>
                                    handleClick(item.key as TaskStatus | 'all')
                                }
                            >
                                {`${item.value}(${getTaskCount(
                                    item.key as TaskStatus | 'all',
                                )})`}
                            </div>
                        ))}
                    </div>
                    <div className={styles.taskItems}>
                        {showTasks.length > 0 ? (
                            showTasks.map((task) => (
                                <div className={styles.item} key={task.id}>
                                    <div className={styles.top}>
                                        <div className={styles.taskNameIcon}>
                                            {getTaskTypeIcon(
                                                task?.task_type || '',
                                            )}
                                            <div
                                                className={styles.taskName}
                                                title={task.name}
                                            >
                                                {task.name}
                                            </div>
                                        </div>
                                        {
                                            StatusDomPregress()[
                                                task?.status || ''
                                            ]
                                        }
                                    </div>
                                    <div className={styles.bottom}>
                                        <AvatarOutlined
                                            className={styles.avatarIcon}
                                        />
                                        <div
                                            className={styles.executorName}
                                            title={
                                                task.executor_name ||
                                                __('未分配')
                                            }
                                        >
                                            {task.executor_name || __('未分配')}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
                        )}
                    </div>
                </>
            ) : (
                <Empty desc={__('暂无前序任务')} iconSrc={dataEmpty} />
            )}
        </div>
    )
}
export default PreTask
