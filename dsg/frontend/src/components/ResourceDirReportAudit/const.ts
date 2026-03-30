import { ISSZDReportAuditStatus } from '@/core'
import __ from './locale'

/** 上报审核类型 */
export enum AuditType {
    /** 待审核 */
    Tasks = 'tasks',
    /** 已审核 */
    Historys = 'historys',
}

/** 审核状态 */
export const AuditStatusMap = [
    {
        label: __('审核中'),
        value: ISSZDReportAuditStatus.Auditing,
        color: '#1677FF',
    },
    {
        label: __('已通过'),
        value: ISSZDReportAuditStatus.Pass,
        color: '#58C524',
    },
    {
        label: __('已拒绝'),
        value: ISSZDReportAuditStatus.Reject,
        color: '#FF4D50',
    },
    {
        label: __('已撤回'),
        value: ISSZDReportAuditStatus.Cancel,
        color: 'rgba(0, 0, 0, 0.30)',
    },
]
