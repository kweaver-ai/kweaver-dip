import __ from './locale'

/** 审核类型 */
export enum AuditType {
    /** 待审核 */
    Tasks = 'tasks',
    /** 已审核 */
    Historys = 'historys',
}
/** 审核操作类型 */
export const AuditOptionType = [
    {
        key: 'audit',
        label: __('申报'),
        value: 'audit',
    },
    {
        key: 'change_audit',
        label: __('变更'),
        value: 'change_audit',
    },
]
