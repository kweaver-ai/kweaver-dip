import __ from './locale'

/**
 * 数据推送列表操作
 */
export enum DataPushAction {
    // 创建
    Create = 'create',
    // 详情
    Detail = 'detail',
    // 编辑
    Edit = 'edit',
    // 删除
    Delete = 'delete',
    // 立即执行
    Execute = 'execute',
    // 修改调度时间
    ModifySchedule = 'modify_schedule',
    // 启用
    Start = 'start',
    // 停用
    Stop = 'stop',
    // 撤回审核
    Recall = 'recall',
    // 作业监控
    Monitor = 'monitor',
    // 审核
    Audit = 'audit',
}

/**
 * 数据推送状态
 */
export enum DataPushStatus {
    // 不流转
    Shadow = 0,
    // 草稿
    Draft = 1,
    // 待发布：未通过审核的叫「待发布」；包括暂存的和提交后还未通过审核的
    Pending = 2,
    // 未开始：通过审核的还没到开始时间、定时时间的叫「未开始」
    NotStarted = 3,
    // 进行中：到了开始时间的叫进行中
    InProgress = 4,
    // 已停用：点击停用后，变为已停用
    Stopped = 5,
    // 已结束：到了结束时间且最后一次作业请求完成后叫已结束
    Ended = 6,
}

export const dataPushStatusMap = {
    [DataPushStatus.Draft]: {
        text: __('待发布'),
        color: 'rgba(0,0,0,0.3)',
        operation: [DataPushAction.Detail],
    },
    [DataPushStatus.Pending]: {
        text: __('待发布'),
        color: 'rgba(0,0,0,0.3)',
        operation: [DataPushAction.Detail],
    },
    [DataPushStatus.NotStarted]: {
        text: __('未开始'),
        color: '#8893FF',
        operation: [DataPushAction.Detail, DataPushAction.Monitor],
    },
    [DataPushStatus.InProgress]: {
        text: __('进行中'),
        color: '#2F9BFF',
        operation: [DataPushAction.Detail, DataPushAction.Monitor],
    },
    [DataPushStatus.Stopped]: {
        text: __('已停用'),
        color: '#52C41B',
        operation: [DataPushAction.Detail, DataPushAction.Monitor],
    },
    [DataPushStatus.Ended]: {
        text: __('已结束'),
        color: '#F25D5D',
        operation: [DataPushAction.Detail, DataPushAction.Monitor],
    },
}

export const dataPushStatusOptions = [
    {
        value: DataPushStatus.Pending,
        label: dataPushStatusMap[DataPushStatus.Pending].text,
    },
    {
        value: DataPushStatus.NotStarted,
        label: dataPushStatusMap[DataPushStatus.NotStarted].text,
    },
    {
        value: DataPushStatus.InProgress,
        label: dataPushStatusMap[DataPushStatus.InProgress].text,
    },
    {
        value: DataPushStatus.Ended,
        label: dataPushStatusMap[DataPushStatus.Ended].text,
    },
    {
        value: DataPushStatus.Stopped,
        label: dataPushStatusMap[DataPushStatus.Stopped].text,
    },
]

/**
 * 数据推送操作
 */
export enum DataPushOperation {
    // 发布
    Publish = 1,
    // 变更
    Change = 2,
    // 停用
    Stop = 3,
    // 启用
    Start = 4,
}

/**
 * 审核状态
 */
export enum AuditStatus {
    // 审核中
    Auditing = 1,
    // 通过
    Passed = 2,
    // 驳回
    Rejected = 3,
    // 撤回
    Canceled = 4,
}

export const auditStatusMap = {
    // 发布审核中
    [`${DataPushOperation.Publish}_${AuditStatus.Auditing}`]: {
        text: __('发布审核中'),
        color: '#1890FF',
        background: 'rgba(24,144,255,0.07)',
    },
    // 变更审核中
    [`${DataPushOperation.Change}_${AuditStatus.Auditing}`]: {
        text: __('变更审核中'),
        color: '#1890FF',
        background: 'rgba(24,144,255,0.07)',
    },
    // 停用审核中
    [`${DataPushOperation.Stop}_${AuditStatus.Auditing}`]: {
        text: __('停用审核中'),
        color: '#1890FF',
        background: 'rgba(24,144,255,0.07)',
    },
    // 启用审核中
    [`${DataPushOperation.Start}_${AuditStatus.Auditing}`]: {
        text: __('启用审核中'),
        color: '#1890FF',
        background: 'rgba(24,144,255,0.07)',
    },
    // 发布未通过
    [`${DataPushOperation.Publish}_${AuditStatus.Rejected}`]: {
        text: __('发布未通过'),
        color: '#FF4D4F',
        background: 'rgba(255,77,79,0.07)',
        errorKey: 'reject_reason',
    },
    // 变更未通过
    [`${DataPushOperation.Change}_${AuditStatus.Rejected}`]: {
        text: __('变更未通过'),
        color: '#FF4D4F',
        background: 'rgba(255,77,79,0.07)',
        errorKey: 'reject_reason',
    },
    // 停用未通过
    [`${DataPushOperation.Stop}_${AuditStatus.Rejected}`]: {
        text: __('停用未通过'),
        color: '#FF4D4F',
        background: 'rgba(255,77,79,0.07)',
        errorKey: 'reject_reason',
    },
    // 启用未通过
    [`${DataPushOperation.Start}_${AuditStatus.Rejected}`]: {
        text: __('启用未通过'),
        color: '#FF4D4F',
        background: 'rgba(255,77,79,0.07)',
        errorKey: 'reject_reason',
    },
}

/**
 * 管理列表操作
 */
export const manageOperationMap = {
    [DataPushStatus.Draft]: {
        default: [
            DataPushAction.Detail,
            DataPushAction.Edit,
            DataPushAction.Delete,
        ],
    },
    [DataPushStatus.Pending]: {
        default: [
            DataPushAction.Detail,
            DataPushAction.Edit,
            DataPushAction.Delete,
        ],
        [AuditStatus.Auditing]: {
            [DataPushOperation.Publish]: [
                DataPushAction.Detail,
                DataPushAction.Edit,
                DataPushAction.Delete,
                DataPushAction.Recall,
            ],
        },
    },
    [DataPushStatus.NotStarted]: {
        default: [
            DataPushAction.Detail,
            DataPushAction.Monitor,
            DataPushAction.Execute,
            DataPushAction.ModifySchedule,
            DataPushAction.Stop,
        ],
        [AuditStatus.Auditing]: {
            [DataPushOperation.Change]: [
                DataPushAction.Detail,
                DataPushAction.Monitor,
                DataPushAction.Execute,
                DataPushAction.ModifySchedule,
                DataPushAction.Stop,
                DataPushAction.Recall,
            ],
            [DataPushOperation.Stop]: [
                DataPushAction.Detail,
                DataPushAction.Monitor,
                DataPushAction.Execute,
                DataPushAction.ModifySchedule,
                DataPushAction.Stop,
                DataPushAction.Recall,
            ],
        },
    },
    [DataPushStatus.InProgress]: {
        default: [
            DataPushAction.Detail,
            DataPushAction.Monitor,
            DataPushAction.Execute,
            DataPushAction.ModifySchedule,
            DataPushAction.Stop,
        ],
        [AuditStatus.Auditing]: {
            [DataPushOperation.Change]: [
                DataPushAction.Detail,
                DataPushAction.Monitor,
                DataPushAction.Execute,
                DataPushAction.ModifySchedule,
                DataPushAction.Stop,
                DataPushAction.Recall,
            ],
            [DataPushOperation.Stop]: [
                DataPushAction.Detail,
                DataPushAction.Monitor,
                DataPushAction.Execute,
                DataPushAction.ModifySchedule,
                DataPushAction.Stop,
                DataPushAction.Recall,
            ],
        },
    },
    [DataPushStatus.Ended]: {
        default: [DataPushAction.Detail, DataPushAction.Monitor],
    },
    [DataPushStatus.Stopped]: {
        default: [
            DataPushAction.Detail,
            DataPushAction.Monitor,
            DataPushAction.ModifySchedule,
            DataPushAction.Start,
        ],
        [AuditStatus.Auditing]: {
            [DataPushOperation.Start]: [
                DataPushAction.Detail,
                DataPushAction.Monitor,
                DataPushAction.ModifySchedule,
                DataPushAction.Start,
                DataPushAction.Recall,
            ],
        },
    },
}

/**
 * 作业状态
 */
export enum JobStatus {
    // 进行中
    InProgress = 'RUNNING_EXECUTION',
    // 已完成 - 成功
    Completed = 'SUCCESS',
    // 异常 - 失败
    Exception = 'FAILURE',
}

export const jobStatusMap = {
    '': {
        operation: [DataPushAction.Detail],
    },
    [JobStatus.InProgress]: {
        text: __('进行中'),
        color: '#2F9BFF',
        operation: [DataPushAction.Detail],
    },
    [JobStatus.Completed]: {
        text: __('已完成'),
        color: '#52C41B',
        operation: [DataPushAction.Detail],
    },
    [JobStatus.Exception]: {
        text: __('异常'),
        color: '#F25D5D',
        operation: [DataPushAction.Detail],
    },
}

export const jobStatusOptions = [
    {
        label: jobStatusMap[JobStatus.InProgress].text,
        value: JobStatus.InProgress,
    },
    {
        label: jobStatusMap[JobStatus.Completed].text,
        value: JobStatus.Completed,
    },
    {
        label: jobStatusMap[JobStatus.Exception].text,
        value: JobStatus.Exception,
    },
]

/**
 * 执行方式
 */
export enum ExecuteType {
    // 自动
    Auto = 'true',
    // 手动
    Manual = 'false',
}

export const executeTypeMap = {
    [ExecuteType.Auto]: {
        text: __('自动'),
    },
    [ExecuteType.Manual]: {
        text: __('手动'),
    },
}

export const executeTypeOptions = [
    {
        label: executeTypeMap[ExecuteType.Auto].text,
        value: ExecuteType.Auto,
    },
    {
        label: executeTypeMap[ExecuteType.Manual].text,
        value: ExecuteType.Manual,
    },
]

/**
 * 审核类型
 */

export const auditTypeMap = {
    [DataPushOperation.Publish]: {
        text: __('发布'),
        operation: [DataPushAction.Audit],
    },
    [DataPushOperation.Change]: {
        text: __('变更'),
        operation: [DataPushAction.Audit],
    },
    [DataPushOperation.Stop]: {
        text: __('停用'),
        operation: [DataPushAction.Audit],
    },
    [DataPushOperation.Start]: {
        text: __('启用'),
        operation: [DataPushAction.Audit],
    },
}

export const auditTypeOptions = [
    {
        label: __('不限'),
        value: '',
    },
    {
        label: auditTypeMap[DataPushOperation.Publish].text,
        value: DataPushOperation.Publish,
    },
    {
        label: auditTypeMap[DataPushOperation.Change].text,
        value: DataPushOperation.Change,
    },
    {
        label: auditTypeMap[DataPushOperation.Stop].text,
        value: DataPushOperation.Stop,
    },
    {
        label: auditTypeMap[DataPushOperation.Start].text,
        value: DataPushOperation.Start,
    },
]

/**
 * 数据推送tab
 */
export enum DataPushTab {
    // 数据推送概览
    Overview = 'overview',
    // 数据推送管理
    Manage = 'manage',
    // 数据推送监控 - 整体
    Monitor = 'monitor',
    // 数据推送监控 - 单个
    MonitorSingle = 'monitorSingle',
    // 数据推送审核
    Audit = 'audit',
}

/**
 * 推送类型
 */
export enum TransmitMode {
    Incremental = 1,
    Full = 2,
}

export const transmitModeMap = {
    [TransmitMode.Full]: {
        text: __('全量'),
    },
    [TransmitMode.Incremental]: {
        text: __('增量'),
    },
}

export const transmitModeOptions = [
    {
        label: transmitModeMap[TransmitMode.Full].text,
        value: TransmitMode.Full,
    },
    {
        label: transmitModeMap[TransmitMode.Incremental].text,
        value: TransmitMode.Incremental,
    },
]

/**
 * 调度类型
 */
export enum ScheduleType {
    OneTime = 'ONCE',
    Periodic = 'PERIOD',
}

export const scheduleTypeMap = {
    [ScheduleType.OneTime]: {
        text: __('一次性'),
    },
    [ScheduleType.Periodic]: {
        text: __('周期性'),
    },
}

export const scheduleTypeOptions = [
    {
        label: scheduleTypeMap[ScheduleType.OneTime].text,
        value: ScheduleType.OneTime,
    },
    {
        label: scheduleTypeMap[ScheduleType.Periodic].text,
        value: ScheduleType.Periodic,
    },
]

/**
 * 调度执行状态
 */
export enum ScheduleExecuteStatus {
    // 立即执行
    Immediate = 0,
    // 定时执行
    Timing = 1,
}

export const scheduleExecuteStatusOptions = [
    { label: __('立即执行'), value: ScheduleExecuteStatus.Immediate },
    { label: __('定时'), value: ScheduleExecuteStatus.Timing },
]

export enum DataSourceType {
    // 信息系统
    Records = 1,
    // 数据仓库
    Analytical = 2,
    // 数据沙箱
    Sandbox = 3,
}

export const dataSourceTypeKey = {
    [DataSourceType.Records]: 'records',
    [DataSourceType.Analytical]: 'analytical',
    [DataSourceType.Sandbox]: 'sandbox',
}
