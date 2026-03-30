import __ from '../locale'

/**
 * 申请类型
 */
export const applyTypeOps = [
    {
        value: 1,
        label: __('政务服务'),
    },
    {
        value: 2,
        label: __('政务监管'),
    },
]

/**
 * 申请资源
 */
export const details1 = {
    key: 'ResourceSharing_1',
    title: __('申请资源'),
    content: [
        {
            key: 'catalog_title',
            label: __('数据目录名称'),
            value: '',
            span: 12,
            view_type: 'catalogTitle',
        },
        {
            key: 'resource_name',
            label: __('挂接资源'),
            value: '',
            span: 12,
            view_type: 'typeTag',
        },
    ],
}

/**
 * 申请信息
 */
export const details2 = {
    key: 'ResourceSharing_2',
    title: __('申请信息'),
    content: [
        {
            key: 'apply_id',
            label: __('申请编号'),
            value: '',
            span: 24,
        },
        {
            key: 'apply_type',
            label: __('申请类型'),
            value: '',
            span: 24,
        },
        {
            key: 'app_name',
            label: __('关联应用系统'),
            value: '',
            span: 24,
        },
        {
            key: 'apply_basis',
            label: __('申请依据'),
            value: '',
            span: 24,
        },
        {
            key: 'attachment_name',
            label: __('附件'),
            value: '',
            span: 24,
            view_type: 'download',
        },
    ],
}

/**
 * 使用用途
 */
export const details3 = {
    key: 'ResourceSharing_3',
    title: __('使用用途'),
    content: [
        {
            key: 'use_scope',
            label: __('使用范围说明'),
            value: '',
            span: 24,
        },
        {
            key: 'other_use_scope',
            label: __('其他范围说明'),
            value: '',
            span: 24,
        },
        {
            key: 'work_scene',
            label: __('办事场景'),
            value: '',
            span: 24,
        },
    ],
}

/**
 * 接口调用信息
 */
export const details4 = {
    key: 'ResourceSharing_4',
    title: __('接口调用信息'),
    content: [
        {
            key: 'peak_frequency',
            label: __('每天最高调用频次'),
            value: '',
            span: 24,
        },
        {
            key: 'avg_frequency',
            label: __('每天平均调用频次'),
            value: '',
            span: 24,
        },
        {
            key: 'use_days',
            label: __('接口使用期限（天）'),
            value: '',
            span: 24,
        },
        {
            key: 'use_time',
            label: __('使用时间段'),
            value: '',
            span: 24,
        },
        {
            key: 'other_reqs',
            label: __('其他技术请求'),
            value: '',
            span: 24,
        },
    ],
}

/**
 * 使用人信息
 */
export const details5 = {
    key: 'ResourceSharing_5',
    title: __('使用人信息'),
    content: [
        {
            key: 'user_org_name',
            label: __('资源使用部门'),
            value: '',
            span: 24,
        },
        {
            key: 'user_name',
            label: __('资源使用人'),
            value: '',
            span: 24,
        },
        {
            key: 'user_phone',
            label: __('资源使用人电话'),
            value: '',
            span: 24,
        },
        {
            key: 'user_mail',
            label: __('资源使用人邮箱'),
            value: '',
            span: 24,
        },
    ],
}

/**
 * 申请人信息
 */
export const details6 = {
    key: 'ResourceSharing_6',
    title: __('申请人信息'),
    content: [
        {
            key: 'apply_name',
            label: __('资源申请人'),
            value: '',
            span: 24,
        },
        {
            key: 'apply_phone',
            label: __('资源申请人电话'),
            value: '',
            span: 24,
        },
        {
            key: 'apply_mail',
            label: __('资源申请人邮箱'),
            value: '',
            span: 24,
        },
    ],
}

/**
 * 记录操作结果
 */
export enum logOpResult {
    // 撤销
    Undone = 'undone',
    // 同意
    Agree = 'agree',
    // 拒绝/驳回
    Reject = 'reject',
}

export const logOpResultMap = {
    [logOpResult.Undone]: { text: __('撤销'), color: '#FAAD14' },
    [logOpResult.Agree]: { text: __('通过'), color: '#52C41B' },
    [logOpResult.Reject]: { text: __('拒绝'), color: '#E60012' },
}

const recordMapStyles = { margin: '-4px 0 -4px -8px' }

/**
 * 操作记录 36-创建/提交资源申请 41-上报审核（资源申请审核）46-数源部门审核 51-订阅 56-取消订阅 61-撤销
 */
export enum LogType {
    // 创建/提交资源申请
    Create = 36,
    // 上报审核（资源申请审核）
    Audit = 41,
    // 数源部门审核
    DeptAudit = 46,
    // 订阅
    Subscribe = 51,
    // 取消订阅
    Unsubscribe = 56,
    // 撤销
    Undone = 61,
}

export const logTypeMap = {
    [LogType.Create]: {
        title: __('提交资源申请'),
        content: [
            {
                key: 'op_user',
                label: __('申请人'),
                value: '',
                span: 24,
                styles: recordMapStyles,
            },
            {
                key: 'op_org',
                label: __('申请部门'),
                value: '',
                span: 24,
                styles: recordMapStyles,
            },
            {
                key: 'op_time',
                label: __('申请时间'),
                value: '',
                span: 24,
                styles: recordMapStyles,
            },
        ],
    },
    [LogType.Audit]: {
        title: __('资源申请审核'),
        content: [
            {
                key: 'op_result',
                label: __('审核结果'),
                value: '',
                span: 24,
                view_type: 'result',
                styles: recordMapStyles,
            },
            {
                key: 'op_user',
                label: __('审核人'),
                value: '',
                span: 24,
                styles: recordMapStyles,
            },
            {
                key: 'op_time',
                label: __('审核时间'),
                value: '',
                span: 24,
                styles: recordMapStyles,
            },
        ],
    },
    [LogType.DeptAudit]: {
        title: __('数源部门审核'),
        content: [
            {
                key: 'op_result',
                label: __('审核结果'),
                value: '',
                span: 24,
                view_type: 'result',
                styles: recordMapStyles,
            },
            {
                key: 'op_org',
                label: __('审核部门'),
                value: '',
                span: 24,
                styles: recordMapStyles,
            },
            {
                key: 'op_time',
                label: __('审核时间'),
                value: '',
                span: 24,
                styles: recordMapStyles,
            },
            {
                key: 'op_comment',
                label: __('审核评语'),
                value: '',
                span: 24,
                styles: recordMapStyles,
            },
            {
                key: 'attachment_name',
                label: __('附件'),
                value: '',
                span: 24,
                view_type: 'download',
                styles: recordMapStyles,
            },
        ],
    },
    [LogType.Subscribe]: {
        title: __('资源订阅'),
        content: [
            {
                key: 'op_user',
                label: __('订阅人'),
                value: '',
                span: 24,
                styles: recordMapStyles,
            },
            {
                key: 'op_org',
                label: __('订阅部门'),
                value: '',
                span: 24,
                styles: recordMapStyles,
            },
            {
                key: 'op_time',
                label: __('订阅时间'),
                value: '',
                span: 24,
                styles: recordMapStyles,
            },
        ],
    },
    [LogType.Unsubscribe]: {
        title: __('资源停止订阅'),
        content: [
            {
                key: 'op_user',
                label: __('操作人'),
                value: '',
                span: 24,
                styles: recordMapStyles,
            },
            {
                key: 'op_org',
                label: __('所属部门'),
                value: '',
                span: 24,
                styles: recordMapStyles,
            },
            {
                key: 'op_time',
                label: __('操作时间'),
                value: '',
                span: 24,
                styles: recordMapStyles,
            },
        ],
    },
    [LogType.Undone]: {
        title: __('资源申请撤销'),
        content: [
            {
                key: 'op_user',
                label: __('操作人'),
                value: '',
                span: 24,
                styles: recordMapStyles,
            },
            {
                key: 'op_org',
                label: __('所属部门'),
                value: '',
                span: 24,
                styles: recordMapStyles,
            },
            {
                key: 'op_time',
                label: __('操作时间'),
                value: '',
                span: 24,
                styles: recordMapStyles,
            },
            {
                key: 'op_comment',
                label: __('撤销原因'),
                value: '',
                span: 24,
                styles: recordMapStyles,
            },
        ],
    },
}
