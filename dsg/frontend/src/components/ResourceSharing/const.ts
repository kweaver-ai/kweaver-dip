import { SortDirection } from '@/core'
import __ from './locale'
import { SearchType } from '@/ui/LightweightSearch/const'

/**
 * 资源共享操作
 */
export enum SharingOperate {
    // 详情
    Detail = 'Detail',
    // 撤销
    Revoke = 'Revoke',
    // 重新上报
    ReReport = 'ReReport',
    // 订阅
    Subscribe = 'Subscribe',
    // 订阅信息
    SubscribeInfo = 'SubscribeInfo',
    // 停止订阅
    StopSubscribe = 'StopSubscribe',
    // 重新审批
    ReApprove = 'ReApprove',
    // 审核
    Audit = 'Audit',
    // 纠错
    Objection = 'Objection',
}

/**
 * 申请处理进度
 */
export enum ApplyProcess {
    // 资源申请发起审核中
    ReportAudit = 'escalate_auditing',
    // 资源申请发起已驳回
    ReportRejected = 'escalate_audit_rejected',
    // 资源共享处理审核中
    Auditing = 'auditing',
    // 资源申请发起已撤销
    ReportCanceled = 'escalate_audit_canceled',
    // 资源共享处理已通过
    AuditAgreed = 'audit_agreed',
    // 资源共享处理已驳回
    AuditRejected = 'audit_rejected',
    // 资源申请发起失败
    ReportFailed = 'escalate_failed',
}

export const applyProcessMap = {
    [ApplyProcess.ReportAudit]: {
        text: __('资源申请发起审核中'),
        color: '#FAAD14',
        operation: [SharingOperate.Detail],
    },
    [ApplyProcess.ReportFailed]: {
        text: __('资源申请上报失败'),
        color: '#E60012',
        operation: [SharingOperate.Detail, SharingOperate.ReReport],
        errorKey: 'reject_reason',
        errorTitle: __('失败原因：'),
    },
    [ApplyProcess.ReportRejected]: {
        text: __('资源申请发起已驳回'),
        color: '#E60012',
        operation: [SharingOperate.Detail],
        errorKey: 'reject_reason',
        errorTitle: __('驳回原因：'),
    },
    [ApplyProcess.ReportCanceled]: {
        text: __('资源申请发起已撤销'),
        color: '#FAAD14',
        operation: [SharingOperate.Detail],
        errorKey: 'cancel_reason',
        errorTitle: __('撤销原因：'),
    },
    [ApplyProcess.Auditing]: {
        text: __('资源共享处理审核中'),
        color: '#FAAD14',
        operation: [SharingOperate.Detail, SharingOperate.Revoke],
    },
    [ApplyProcess.AuditAgreed]: {
        text: __('资源共享处理已通过'),
        color: '#52C41B',
        operation: [SharingOperate.Detail],
    },
    [ApplyProcess.AuditRejected]: {
        text: __('资源共享处理已驳回'),
        color: '#E60012',
        operation: [SharingOperate.Detail, SharingOperate.Objection],
        errorKey: 'reject_reason',
        errorTitle: __('驳回原因：'),
    },
}

export const applyProcessOptions = [
    {
        value: '',
        label: __('不限'),
    },
    {
        value: ApplyProcess.ReportAudit,
        label: applyProcessMap[ApplyProcess.ReportAudit].text,
    },
    {
        value: ApplyProcess.ReportRejected,
        label: applyProcessMap[ApplyProcess.ReportRejected].text,
    },
    {
        value: ApplyProcess.Auditing,
        label: applyProcessMap[ApplyProcess.Auditing].text,
    },
    {
        value: ApplyProcess.ReportCanceled,
        label: applyProcessMap[ApplyProcess.ReportCanceled].text,
    },
    {
        value: ApplyProcess.AuditAgreed,
        label: applyProcessMap[ApplyProcess.AuditAgreed].text,
    },
    {
        value: ApplyProcess.AuditRejected,
        label: applyProcessMap[ApplyProcess.AuditRejected].text,
    },
    {
        value: ApplyProcess.ReportFailed,
        label: applyProcessMap[ApplyProcess.ReportFailed].text,
    },
]

/**
 * 订阅状态
 */
export enum SubscribeStatus {
    None = '',
    // 已订阅
    Subscribed = 'subscribed',
    // 未订阅
    NotSubscribed = 'unsubscribed',
}

export const subscribeStatusMap = {
    [SubscribeStatus.None]: {
        text: __('全部'),
        color: '#FAAD14',
        operation: [],
    },
    [SubscribeStatus.Subscribed]: {
        text: __('已订阅'),
        color: '#52C41B',
        operation: [
            SharingOperate.SubscribeInfo,
            SharingOperate.Objection,
            SharingOperate.StopSubscribe,
        ],
    },
    [SubscribeStatus.NotSubscribed]: {
        text: __('未订阅'),
        color: '#126EE3',
        operation: [SharingOperate.Subscribe],
    },
}

export const subscribeStatusOptions = [
    {
        label: subscribeStatusMap[SubscribeStatus.None].text,
        value: SubscribeStatus.None,
    },
    {
        label: subscribeStatusMap[SubscribeStatus.NotSubscribed].text,
        value: SubscribeStatus.NotSubscribed,
    },
    {
        label: subscribeStatusMap[SubscribeStatus.Subscribed].text,
        value: SubscribeStatus.Subscribed,
    },
]

/**
 * 审核状态
 */
export enum AuditStatus {
    // 待审批
    Processed = 'pending',
    // 审批中
    Auditing = 'auditing',
    // 已通过
    Passed = 'audit_agreed',
    // 已拒绝
    Rejected = 'audit_rejected',
    // 提交审批结果失败
    Failed = 'audit_escalate_failed',
}

/**
 * 对应共享申请列表
 */
export const applyAuditStatusMap = {
    [AuditStatus.Processed]: {
        text: __('待审核'),
        color: '#126EE3',
        operation: [SharingOperate.Detail],
    },
    [AuditStatus.Auditing]: {
        text: __('审核中'),
        color: '#126EE3',
        operation: [SharingOperate.Detail],
    },
    [AuditStatus.Passed]: {
        text: __('审核通过'),
        color: '#52C41B',
        operation: [SharingOperate.Detail],
    },
    [AuditStatus.Rejected]: {
        text: __('审核拒绝'),
        color: '#E60012',
        operation: [SharingOperate.Detail],
    },
    [AuditStatus.Failed]: {
        text: __('上报失败'),
        color: '#E60012',
        operation: [SharingOperate.Detail, SharingOperate.ReApprove],
        errorKey: 'reject_reason',
        errorTitle: __('失败原因：'),
    },
}

export const applyAuditStatusOptions = [
    {
        label: __('不限'),
        value: '',
    },
    {
        label: applyAuditStatusMap[AuditStatus.Processed].text,
        value: AuditStatus.Processed,
    },
    {
        label: applyAuditStatusMap[AuditStatus.Auditing].text,
        value: AuditStatus.Auditing,
    },
    {
        label: applyAuditStatusMap[AuditStatus.Passed].text,
        value: AuditStatus.Passed,
    },
    {
        label: applyAuditStatusMap[AuditStatus.Rejected].text,
        value: AuditStatus.Rejected,
    },
    {
        label: applyAuditStatusMap[AuditStatus.Failed].text,
        value: AuditStatus.Failed,
    },
]

/**
 * 对应资源审核
 */
export const auditStatusMap = {
    [AuditStatus.Auditing]: {
        text: __('审核中'),
        color: '#126EE3',
        operation: [SharingOperate.Detail],
    },
    [AuditStatus.Passed]: {
        text: __('已通过'),
        color: '#52C41B',
        operation: [SharingOperate.Detail],
    },
    [AuditStatus.Rejected]: {
        text: __('已拒绝'),
        color: '#E60012',
        operation: [SharingOperate.Detail],
    },
}

/**
 * 审核类型
 */
export enum AuditType {
    None = '',
    // 资源申请审核
    Apply = 'af-sszd-share-apply-escalate',
    // 资源共享审核
    Sharing = 'af-sszd-share-apply-approve',
}

export const auditTypeMap = {
    [AuditType.Apply]: {
        text: __('资源申请发起审核'),
        operation: [SharingOperate.Audit],
    },
    [AuditType.Sharing]: {
        text: __('资源共享处理审核'),
        operation: [SharingOperate.Audit],
    },
}

export const auditTypeOptions = [
    {
        label: __('全部审核类型'),
        value: AuditType.None,
    },
    {
        label: __('资源申请发起审核'),
        value: AuditType.Apply,
    },
    {
        label: __('资源共享处理审核'),
        value: AuditType.Sharing,
    },
]

/**
 * 资源共享tab
 */
export enum SharingTab {
    // 资源申请（创建者）
    Apply = 'apply',
    // 资源订阅（创建者）
    Subscribe = 'subscribe',
    // 共享申请列表（运营角色）
    Processed = 'todo',
    // 待审核
    ToReviewed = 'tasks',
    // 已审核
    Reviewed = 'historys',
}

export const sharingTabMap = {
    [SharingTab.Apply]: {
        // 表格列名
        columnKeys: [
            'apply_id',
            'catalog',
            'resource_name',
            'resource_type',
            'process_status',
            'apply_name',
            'user_name',
            'user_org_name',
            'created_at',
            'action',
        ],
        // 操作项映射
        actionMap: applyProcessMap,
        // 操作栏宽度
        actionWidth: 138,
        // 排序菜单
        sortMenus: [{ key: 'created_at', label: __('按照申请时间排序') }],
        // 默认菜单排序
        defaultMenu: {
            key: 'created_at',
            sort: SortDirection.DESC,
        },
        // 默认表头排序
        defaultTableSort: { created_at: 'descend' },
        // 筛选菜单
        searchFormData: [
            {
                label: __('处理进度'),
                key: 'status',
                options: applyProcessOptions,
                type: SearchType.Radio,
            },
        ],
        defaultSearch: { status: '' },
        search: true,
        refresh: true,
    },
    [SharingTab.Subscribe]: {
        columnKeys: [
            'apply_id',
            'catalog',
            'resource_name',
            'resource_type',
            'subscribe_status',
            'apply_name',
            'user_name',
            'user_org_name',
            'subscribe_at',
            'action',
        ],
        actionMap: subscribeStatusMap,
        actionWidth: 220,
        sortMenus: [
            { key: 'created_at', label: __('按照申请时间排序') },
            { key: 'subscribe_at', label: __('按照订阅时间排序') },
        ],
        defaultMenu: {
            key: 'created_at',
            sort: SortDirection.DESC,
        },
        defaultTableSort: { subscribe_at: null },
        searchFormData: undefined,
        defaultSearch: undefined,
        search: true,
        refresh: true,
    },
    [SharingTab.Processed]: {
        columnKeys: [
            'apply_id',
            'catalog',
            'resource_name',
            'status',
            'apply_name',
            'user_name',
            'user_org_name',
            'updated_at',
            'action',
        ],
        actionMap: applyAuditStatusMap,
        actionWidth: 138,
        sortMenus: [{ key: 'updated_at', label: __('按照更新时间排序') }],
        defaultMenu: {
            key: 'updated_at',
            sort: SortDirection.DESC,
        },
        defaultTableSort: { updated_at: 'descend' },
        searchFormData: [
            {
                label: __('状态'),
                key: 'status',
                options: applyAuditStatusOptions,
                type: SearchType.Radio,
            },
        ],
        defaultSearch: { status: '' },
        search: true,
        refresh: true,
    },
    [SharingTab.ToReviewed]: {
        columnKeys: [
            'apply_id',
            'catalog',
            'resource_name',
            'audit_type',
            'apply_name',
            'user_name',
            'user_org_name',
            'updated_at',
            'action',
        ],
        actionMap: auditTypeMap,
        actionWidth: 80,
        sortMenus: undefined,
        defaultMenu: undefined,
        defaultTableSort: undefined,
        searchFormData: undefined,
        defaultSearch: undefined,
        search: false,
        refresh: false,
    },
    [SharingTab.Reviewed]: {
        columnKeys: [
            'apply_id',
            'catalog',
            'resource_name',
            'audit_type',
            'audit_status',
            'apply_name',
            'user_name',
            'user_org_name',
            'updated_at',
            'action',
        ],
        actionMap: auditStatusMap,
        actionWidth: 80,
        sortMenus: undefined,
        defaultMenu: undefined,
        defaultTableSort: undefined,
        searchFormData: undefined,
        defaultSearch: undefined,
        search: false,
        refresh: false,
    },
}

/**
 * 申请的资源类型
 */
export enum ApplyResource {
    // 库表
    Database = 'view',
    // 接口
    Interface = 'api',
    // 文件
    File = 'file',
}

export const applyResourceMap = {
    [ApplyResource.Database]: {
        text: __('库表'),
        color: '#1890FF',
        background: 'rgba(24,144,255,0.07)',
    },
    [ApplyResource.Interface]: {
        text: __('接口'),
        color: '#F5890D',
        background: 'rgba(245,137,13,0.07)',
    },
    [ApplyResource.File]: {
        text: __('文件'),
        color: '#1890FF',
        background: 'rgba(24,144,255,0.07)',
    },
}
