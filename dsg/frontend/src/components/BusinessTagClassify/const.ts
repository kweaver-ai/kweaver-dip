import __ from './locale'
import { PolicyType } from '../AuditPolicy/const'
/**
 * 操作类型
 */
export enum OperateType {
    // 创建
    CREATE = 'create',
    // 编辑
    EDIT = 'edit',
    // 刷新
    REFRESH = 'refresh',
    // 删除
    DELETE = 'delete',
    // 停用/启用
    STATE = 'state',
    // 更多
    MORE = 'more',
    // 取消
    CANCEL = 'cancel',
}
export enum stateLableType {
    enabled = 1,
    unenable = 0,
    draft = 'draft',
    hasDraft = 'hasDraft',
}
export enum publishStatus {
    Unpublished = 'unpublished',
    PublishedAuditing = 'pub-auditing',
    PublishedAuditReject = 'pub-reject',
    Published = 'published',
    ChangeAuditing = 'change-auditing',
    ChangeReject = 'change-reject',
    DeleteAuditing = 'delete-auditing',
    DeleteReject = 'delete-reject',
}
export const publishStatusList = [
    {
        label: __('未发布'),
        value: publishStatus.Unpublished,
        bgColor: 'rgba(0, 0, 0, 0.30)',
    },
    {
        label: __('发布审核中'),
        value: publishStatus.PublishedAuditing,
        bgColor: '#1890FF',
    },
    {
        label: __('发布审核未通过'),
        value: publishStatus.PublishedAuditReject,
        bgColor: '#FF4D4F',
    },
    {
        label: __('已发布'),
        value: publishStatus.Published,
        bgColor: '#52C41B',
    },
    {
        label: __('变更审核中'),
        value: publishStatus.ChangeAuditing,
        bgColor: '#1890FF',
    },
    {
        label: __('变更审核未通过'),
        value: publishStatus.ChangeReject,
        bgColor: '#FF4D4F',
    },
    {
        label: __('删除审核中'),
        value: publishStatus.DeleteAuditing,
        bgColor: '#1890FF',
    },
    {
        label: __('删除审核未通过'),
        value: publishStatus.DeleteReject,
        bgColor: '#FF4D4F',
    },
]
export const auditTypeMap = {
    [publishStatus.PublishedAuditing]: PolicyType.BigdataCreateCategoryLabel,
    [publishStatus.ChangeAuditing]: PolicyType.BigdataUpdateCategoryLabel,
    [publishStatus.DeleteAuditing]: PolicyType.BigdataDeleteCategoryLabel,
    [OperateType.CREATE]: PolicyType.BigdataAuthCategoryLabel,
    [OperateType.EDIT]: PolicyType.BigdataUpdateCategoryLabel,
    [OperateType.DELETE]: PolicyType.BigdataDeleteCategoryLabel,
}
export const cancelTipsMap = {
    [publishStatus.PublishedAuditing]: __('发布'),
    [publishStatus.ChangeAuditing]: __('变更'),
    [publishStatus.DeleteAuditing]: __('删除'),
}
export const draftTipsMap = {
    [stateLableType.draft]: __(
        '未完成发布，当前展示草稿内容，通过编辑标签来更新内容',
    ),
    [stateLableType.hasDraft]: __('通过变更标签来查看和更新内容'),
}
export const isAuditingList = [
    publishStatus.PublishedAuditing,
    publishStatus.ChangeAuditing,
    publishStatus.DeleteAuditing,
]
export const unpublishedList = [
    publishStatus.Unpublished,
    publishStatus.PublishedAuditing,
    publishStatus.PublishedAuditReject,
]
export const disableOpMap = {
    [OperateType.EDIT]: isAuditingList,
    [OperateType.DELETE]: isAuditingList,
    [OperateType.STATE]: [
        ...isAuditingList,
        publishStatus.PublishedAuditReject,
        publishStatus.Unpublished,
    ],
}
// 详细信息
export const detailsInfo = [
    { title: '', key: 'description' },
    { title: __('发布状态：'), key: 'audit_status' },
    {
        title: __('启用状态：'),
        key: 'state',
    },
]
// 更多信息
export const moreInfo = [
    { title: __('创建人：'), key: 'created_name' },
    { title: __('创建时间：'), key: 'created_at' },
    {
        title: __('更新人：'),
        key: 'updated_name',
    },
    {
        title: __('更新时间：'),
        key: 'updated_at',
    },
]

export const moreOpInfo = [
    { title: __('更多信息'), key: OperateType.MORE },
    { title: __('变更'), key: OperateType.EDIT },
    { title: __('删除'), key: OperateType.DELETE },
    { title: __('启用'), key: OperateType.STATE },
    { title: __('撤销审核'), key: OperateType.CANCEL },
]

export const SubjectTipsText = [
    __('说明：'),
    __('1、若勾选对象，则对应的功能模块，可以使用标签。'),
    __('2、若取消选项，对应的功能模块，不能再添加相关标签。之前用户打过的'),
    __('历史标签（业务表的标签），不受影响。'),
    __('3、不勾选任何对象，仍可以进行标签授权。'),
]
