import * as React from 'react'
import { Tooltip } from 'antd'
import {
    getDoaminDetails,
    messageError,
    formatError,
    TaskExecutableStatus,
    TaskConfigStatus,
    TaskType,
    TaskStatus,
    TaskPriority,
    getCoreBusinesses,
} from '@/core'
import {
    StandardColored,
    NormalTaskColored,
    IndicatorTaskColored,
    FieldStandardColored,
    DatasheetViewOutlined,
    FontIcon,
} from '@/icons'
import styles from './styles.module.less'
import __ from './locale'
import { hex2rgba, getActualUrl } from '@/utils'
import DataCollectingColored from '@/icons/DataCollectingColored'
import DataProcessingColored from '@/icons/DataProcessingColored'
import { editTask } from '@/core/apis/taskCenter'
import NewCoreBizColored from '@/icons/NewCoreBizColored'
import DataCatalogColored from '@/icons/DataCatalogColored'
import DatasheetViewColored from '@/icons/DatasheetViewColored'
import DataDevelopmentColored from '@/icons/DataDevelopmentColored'
import { IconType } from '@/icons/const'

/**
 * 任务类型label
 */
const TaskTypeLabel = {
    [TaskType.NORMAL]: __('普通任务'),
    [TaskType.MODEL]: __('业务建模任务'), // 1
    [TaskType.FIELDSTANDARD]: __('新建标准任务'),
    [TaskType.DATACOLLECTING]: __('数据开发任务'),
    [TaskType.DATAPROCESSING]: __('数据加工任务'),
    [TaskType.DATASHEETVIEW]: __('同步元数据库表任务'),
    [TaskType.DATACOMPREHENSION]: __('数据资源目录理解任务'),
    [TaskType.INDICATORPROCESSING]: __('指标开发任务'),
    [TaskType.DATACOMPREHENSIONWWORKORDER]: __('数据资源目录理解任务'),
    [TaskType.RESEARCHREPORTWWORKORDER]: __('调研工单任务'),
    [TaskType.DATACATALOGWWORKORDER]: __('资源编目工单任务'),
    [TaskType.FRONTPROCESSORSWWORKORDER]: __('前置机申请工单任务'),
}

/**
 * 快捷创建任务文本
 */
const createTypeText = {
    [TaskType.MODEL]: __('业务建模'),
    [TaskType.FIELDSTANDARD]: __('新建标准'),
    [TaskType.DATACOLLECTING]: __('数据开发'),
    [TaskType.DATAPROCESSING]: __('数据加工'),
    [TaskType.DATACOMPREHENSION]: __('数据目录理解'),
    [TaskType.INDICATORPROCESSING]: __('指标开发'),
    [TaskType.DATACOMPREHENSIONWWORKORDER]: __('数据目录理解'),
    [TaskType.RESEARCHREPORTWWORKORDER]: __('调研'),
    [TaskType.DATACATALOGWWORKORDER]: __('资源编目'),
    [TaskType.FRONTPROCESSORSWWORKORDER]: __('前置机申请'),
}

/**
 * 任务可执行的状态的text
 */
const TaskExecutableStatusText = {
    [TaskExecutableStatus.EXECUTABLE]: __('待办'),
    [TaskExecutableStatus.BLOCKED]: __('未开启'),
    [TaskExecutableStatus.COMPLETED]: __('已完成'),
    [TaskExecutableStatus.INVALID]: __('已失效'),
}

const TaskConfigStatusText = {
    [TaskConfigStatus.DOMAINDELETE]: __('关联业务流程被删除'),
    [TaskConfigStatus.MAINBUSDELETE]: __('关联业务模型被删除'),
    [TaskConfigStatus.EXECUTORDELETE]: __('任务执行人被移除'),
    [TaskConfigStatus.FORMDELETE]: __('关联业务表被删除'),
    [TaskConfigStatus.CATALOGDELETE]: __('关联数据资源目录被删除'),
    [TaskConfigStatus.INDICATORDELETE]: __('关联业务指标已被删除'),
}

/**
 * 任务类型颜色
 */
const TaskTypeColor = {
    [TaskType.NORMAL]: '#126EE3',
    [TaskType.MODEL]: '#3E75FF',
    [TaskType.FIELDSTANDARD]: '#8C7BEB',
    [TaskType.DATACOLLECTING]: '#FFA62F',
    [TaskType.DATAPROCESSING]: '#4CAF51',
    [TaskType.DATACOMPREHENSION]: '#0288D1',
    [TaskType.DATASHEETVIEW]: '#14CEAA',
    [TaskType.INDICATORPROCESSING]: '#45639C',
    [TaskType.DATACOMPREHENSIONWWORKORDER]: '#0288D1',
    [TaskType.RESEARCHREPORTWWORKORDER]: '#0288D1',
    [TaskType.DATACATALOGWWORKORDER]: '#0288D1',
    [TaskType.FRONTPROCESSORSWWORKORDER]: '#0288D1',
}

/**
 * 任务类型图标
 */
const getTaskTypeIcon = (
    taskType: string,
    needToolTip = false,
    toolTipTitle = '',
) => {
    switch (true) {
        case taskType === TaskType.NORMAL:
            return (
                <Tooltip
                    title={
                        needToolTip
                            ? toolTipTitle || TaskTypeLabel[taskType]
                            : ''
                    }
                    placement="bottom"
                >
                    <div
                        className={styles.taskTypeIcon}
                        style={{
                            backgroundColor: hex2rgba(
                                TaskTypeColor[TaskType.NORMAL].substring(1),
                                0.1,
                            ),
                        }}
                    >
                        <NormalTaskColored
                            style={{
                                color: TaskTypeColor[TaskType.NORMAL],
                                fontSize: 14,
                            }}
                        />
                    </div>
                </Tooltip>
            )
        case taskType === TaskType.MODEL:
            return (
                <Tooltip
                    title={
                        needToolTip
                            ? toolTipTitle || TaskTypeLabel[taskType]
                            : ''
                    }
                    placement="bottom"
                >
                    <div
                        className={styles.taskTypeIcon}
                        style={{
                            backgroundColor: hex2rgba(
                                TaskTypeColor[TaskType.MODEL].substring(1),
                                0.1,
                            ),
                        }}
                    >
                        <NewCoreBizColored
                            style={{
                                color: TaskTypeColor[TaskType.MODEL],
                                fontSize: 14,
                            }}
                        />
                    </div>
                </Tooltip>
            )

        case taskType === TaskType.FIELDSTANDARD:
            return (
                <Tooltip
                    title={
                        needToolTip
                            ? toolTipTitle || TaskTypeLabel[taskType]
                            : ''
                    }
                    placement="bottom"
                >
                    <div
                        className={styles.taskTypeIcon}
                        style={{
                            backgroundColor: hex2rgba(
                                TaskTypeColor[TaskType.FIELDSTANDARD].substring(
                                    1,
                                ),
                                0.1,
                            ),
                        }}
                    >
                        <FieldStandardColored
                            style={{
                                color: TaskTypeColor[TaskType.FIELDSTANDARD],
                                fontSize: 16,
                            }}
                        />
                    </div>
                </Tooltip>
            )
        case taskType === TaskType.DATACOLLECTING:
            return (
                <Tooltip
                    title={
                        needToolTip
                            ? toolTipTitle || TaskTypeLabel[taskType]
                            : ''
                    }
                    placement="bottom"
                >
                    <div
                        className={styles.taskTypeIcon}
                        style={{
                            backgroundColor: hex2rgba(
                                TaskTypeColor[
                                    TaskType.DATACOLLECTING
                                ].substring(1),
                                0.1,
                            ),
                        }}
                    >
                        <DataDevelopmentColored
                            style={{
                                color: TaskTypeColor[TaskType.DATACOLLECTING],
                                fontSize: 14,
                            }}
                        />
                    </div>
                </Tooltip>
            )
        case taskType === TaskType.DATAPROCESSING:
            return (
                <Tooltip
                    title={
                        needToolTip
                            ? toolTipTitle || TaskTypeLabel[taskType]
                            : ''
                    }
                    placement="bottom"
                >
                    <div
                        className={styles.taskTypeIcon}
                        style={{
                            backgroundColor: hex2rgba(
                                TaskTypeColor[
                                    TaskType.DATAPROCESSING
                                ].substring(1),
                                0.1,
                            ),
                        }}
                    >
                        <DataProcessingColored
                            style={{
                                color: TaskTypeColor[TaskType.DATAPROCESSING],
                                fontSize: 20,
                            }}
                        />
                    </div>
                </Tooltip>
            )
        case taskType === TaskType.DATACOMPREHENSION:
            return (
                <Tooltip
                    title={
                        needToolTip
                            ? toolTipTitle || TaskTypeLabel[taskType]
                            : ''
                    }
                    placement="bottom"
                >
                    <div
                        className={styles.taskTypeIcon}
                        style={{
                            backgroundColor: hex2rgba(
                                TaskTypeColor[
                                    TaskType.DATACOMPREHENSION
                                ].substring(1),
                                0.1,
                            ),
                        }}
                    >
                        <DataCatalogColored
                            style={{
                                color: TaskTypeColor[
                                    TaskType.DATACOMPREHENSION
                                ],
                                fontSize: 12,
                            }}
                        />
                    </div>
                </Tooltip>
            )
        case taskType === TaskType.DATACOMPREHENSIONWWORKORDER:
            return (
                <Tooltip
                    title={
                        needToolTip
                            ? toolTipTitle || TaskTypeLabel[taskType]
                            : ''
                    }
                    placement="bottom"
                >
                    <div
                        className={styles.taskTypeIcon}
                        style={{
                            backgroundColor: hex2rgba(
                                TaskTypeColor[
                                    TaskType.DATACOMPREHENSIONWWORKORDER
                                ].substring(1),
                                0.1,
                            ),
                        }}
                    >
                        <DataCatalogColored
                            style={{
                                color: TaskTypeColor[
                                    TaskType.DATACOMPREHENSIONWWORKORDER
                                ],
                                fontSize: 12,
                            }}
                        />
                    </div>
                </Tooltip>
            )
        case taskType === TaskType.RESEARCHREPORTWWORKORDER:
            return (
                <Tooltip
                    title={
                        needToolTip
                            ? toolTipTitle || TaskTypeLabel[taskType]
                            : ''
                    }
                    placement="bottom"
                >
                    <FontIcon
                        name="icon-tiaoyanrenwu"
                        type={IconType.COLOREDICON}
                        style={{
                            fontSize: 22,
                        }}
                    />
                </Tooltip>
            )
        case taskType === TaskType.DATACATALOGWWORKORDER:
            return (
                <Tooltip
                    title={
                        needToolTip
                            ? toolTipTitle || TaskTypeLabel[taskType]
                            : ''
                    }
                    placement="bottom"
                >
                    <FontIcon
                        name="icon-bianmurenwu"
                        type={IconType.COLOREDICON}
                        style={{
                            fontSize: 22,
                        }}
                    />
                </Tooltip>
            )
        case taskType === TaskType.FRONTPROCESSORSWWORKORDER:
            return (
                <Tooltip
                    title={needToolTip ? TaskTypeLabel[taskType] : ''}
                    placement="bottom"
                >
                    <FontIcon
                        name="icon-qianzhijishenqingrenwu"
                        type={IconType.COLOREDICON}
                        style={{
                            fontSize: 22,
                        }}
                    />
                </Tooltip>
            )
        case taskType === TaskType.INDICATORPROCESSING:
            return (
                <Tooltip
                    title={needToolTip ? TaskTypeLabel[taskType] : ''}
                    placement="bottom"
                >
                    <div
                        className={styles.taskTypeIcon}
                        style={{
                            backgroundColor: hex2rgba(
                                TaskTypeColor[
                                    TaskType.INDICATORPROCESSING
                                ].substring(1),
                                0.1,
                            ),
                        }}
                    >
                        <IndicatorTaskColored
                            style={{
                                color: TaskTypeColor[
                                    TaskType.INDICATORPROCESSING
                                ],
                                fontSize: 14,
                            }}
                        />
                    </div>
                </Tooltip>
            )
        default:
            return <div />
    }
}

export interface IStatusDom {
    ready: React.ReactElement
    ongoing: React.ReactElement
    completed: React.ReactElement
}

/**
 *
 * @param progress 进度显示文本
 * @param status 任务类型-TaskStatus
 * @returns
 */
const StatusDomPregress = (progress?: string, status?: string): IStatusDom => {
    const prgres = progress || ''
    return {
        ready: (
            <div className={styles.taskStartStatus}>
                {__('未开始')}
                {/* {status === TaskStatus.READY ? prgres : ''} */}
            </div>
        ),
        ongoing: (
            <div
                className={styles.taskStartStatus}
                style={{
                    color: '#126EE3',
                    background: 'rgba(18,110,227,0.06)',
                }}
            >
                {__('进行中')}
                {status === TaskStatus.ONGOING ? prgres : ''}
            </div>
        ),
        completed: (
            <div
                className={styles.taskStartStatus}
                style={{
                    color: '#52C41A',
                    background: 'rgba(82,196,26,0.06)',
                }}
            >
                {__('已完成')}
                {/* {status === TaskStatus.COMPLETED ? prgres : ''} */}
            </div>
        ),
    }
}

/**
 * 获取下拉框状态
 * @status 当前状态
 * @return 下拉列表内容
 */
const getStatusItems = (status: string, progress?: string) => {
    const statusDomEnums = StatusDomPregress(progress, status)
    switch (true) {
        case status === 'ready':
            return [
                { key: 'ready', label: statusDomEnums.ready },
                { key: 'ongoing', label: statusDomEnums.ongoing },
            ]
        case status === 'ongoing':
            return [
                { key: 'ongoing', label: statusDomEnums.ongoing },
                { key: 'completed', label: statusDomEnums.completed },
            ]
        default:
            return [{ key: 'completed', label: statusDomEnums.completed }]
    }
}

/**
 * 跳转建模页面前的检查工作
 * @param navigator
 * @param url 跳转url
 * @param tid 任务id
 * @param pid 项目id
 * @param name 任务名称
 * @param status 任务当前状态
 * @param did 主题域id
 */
const checkBeforeJumpModel = async (
    isProject: boolean,
    navigator: any,
    url: string,
    tid?: string,
    pid?: string,
    name?: string,
    status?: string,
    type?: string,
    executableStatus?: string,
    did?: string,
) => {
    try {
        // 任务状态更改
        if (status === 'ready') {
            if (!tid || !name) {
                return
            }
            await editTask(tid, {
                name,
                status: TaskStatus.ONGOING,
                project_id: pid,
            })
        }
        if (isProject) {
            if (type === TaskType.DATACOLLECTING) {
                navigator(url)
            } else {
                navigator(url)
                // window.open(getActualUrl(url), '_self')
            }
        } else {
            navigator(url)
            // window.open(getActualUrl(url), '_self')
        }
    } catch (e) {
        switch (e?.data?.code) {
            case 'BusinessGrooming.BusinessDomain.BusinessDomainIdIllegal':
                // 主题域为空
                messageError(
                    status === 'completed'
                        ? __('关联主题域被删除，无法查看任务')
                        : __('关联主题域被删除，可删除重建任务'),
                )
                break
            case 'BusinessGrooming.Model.DomainNotExist':
                // 主题域为空
                messageError(
                    status === 'completed'
                        ? __('关联主题域被删除，无法查看任务')
                        : __('关联主题域被删除，可删除重建任务'),
                )
                break
            default:
                formatError(e)
        }
    }
}

const allTaskTypeList = [
    // TaskType.NORMAL,
    // TaskType.MODEL,
    // TaskType.FIELDSTANDARD,
    // TaskType.DATACOLLECTING,
    // TaskType.DATASHEETVIEW,
    // TaskType.DATACOMPREHENSION,
    // TaskType.INDICATORPROCESSING,
    TaskType.DATACOMPREHENSIONWWORKORDER,
]

// 工单任务选项
const freeTaskTypeList = [
    // TaskType.MODEL,
    // TaskType.DATACOLLECTING,
    // TaskType.DATASHEETVIEW,
    // TaskType.DATACOMPREHENSION,
    // TaskType.INDICATORPROCESSING,
    TaskType.DATACOMPREHENSIONWWORKORDER,
]

const taskStatusList = [
    {
        key: 'all',
        value: '全部',
    },
    {
        key: TaskStatus.READY,
        value: __('未开始'),
    },
    {
        key: TaskStatus.ONGOING,
        value: __('进行中'),
    },
]

/**
 * 任务优先级信息
 */
const taskPriorityInfos = {
    [TaskPriority.URGENT]: {
        value: TaskPriority.URGENT,
        label: __('非常紧急'),
        color: 'rgba(245, 34, 45, 1)',
        borderColor: 'rgba(245, 34, 45, 0.80)',
    },
    [TaskPriority.EMERGENT]: {
        value: TaskPriority.EMERGENT,
        label: __('紧急'),
        color: 'rgba(250, 173, 20, 1)',
        borderColor: 'rgba(250, 173, 20, 0.80)',
    },
    [TaskPriority.COMMON]: {
        value: TaskPriority.COMMON,
        label: __('普通'),
        color: 'rgba(18, 110, 227, 1)',
        borderColor: 'rgba(18, 110, 227, 0.80)',
    },
}

/**
 * 未分配执行人信息
 */
const noExecutorAssigned = {
    id: '00000000-0000-0000-0000-000000000000',
    name: __('未分配'),
    role_id: '00000000-0000-0000-0000-000000000000',
    role_name: __('未分配'),
}

export {
    StatusDomPregress,
    getStatusItems,
    TaskTypeLabel,
    TaskTypeColor,
    getTaskTypeIcon,
    checkBeforeJumpModel,
    allTaskTypeList,
    TaskExecutableStatusText,
    taskStatusList,
    TaskConfigStatusText,
    freeTaskTypeList,
    createTypeText,
    taskPriorityInfos,
    noExecutorAssigned,
}
