import { IformItem, SearchType } from '@/ui/LightweightSearch/const'
import __ from '../locale'
import { DemandProgress, StatusType } from '../const'
import { IBasicInfoFields } from '../ProvinceDetails/const'
import { DemandFieldType } from '../Details/const'
import { SSZDDemandAuditTarget } from '@/core'
/**
 * {Detail} 详情
 * {Revocation} 撤销
 * {SharedApplication} 共享申请
 * {Rereport} 重新上报
 */
export enum DemandOperateType {
    'Detail',
    'Revocation',
    'SharedApplication',
    'Rereport',
}

/**
 * @param ReportForReview 上报审核中
 * @param ReportRejected 上报已驳回
 * @param ReportedWithdrawn 上报已撤销
 * @param ImplementSigningOff 待实施
 * @param Implementing 需求实施中
 * @param Implemented 需求已实施
 * @param DemandRejected 需求已驳回
 * @param ReportFail 上报失败
 */
export enum DemandProcessStateEnum {
    ReportForReview = 'report_for_review',
    ReportRejected = 'report_rejected',
    ReportedWithdrawn = 'reported_withdrawn',
    ImplementSigningOff = 'implement_signing_off',
    Implementing = 'implementing',
    Implemented = 'implemented',
    DemandRejected = 'demand_rejected',
    ReportFail = 'report_fail',
}

export const DemandProcessStateMap = {
    [DemandProcessStateEnum.ReportForReview]: {
        text: __('上报审核中'),
        color: 'rgba(250, 173, 20, 1)',
        operation: [DemandOperateType.Detail, DemandOperateType.Revocation],
    },
    [DemandProcessStateEnum.ReportRejected]: {
        text: __('上报已驳回'),
        color: 'rgba(230, 0, 18, 1)',
        operation: [DemandOperateType.Detail],
    },
    [DemandProcessStateEnum.ReportedWithdrawn]: {
        text: __('上报已撤销'),
        color: 'rgba(250, 172, 20, 1)',
        operation: [DemandOperateType.Detail],
    },
    [DemandProcessStateEnum.Implementing]: {
        text: __('需求实施中'),
        color: 'rgba(91, 145, 255, 1)',
        operation: [DemandOperateType.Detail],
    },
    [DemandProcessStateEnum.Implemented]: {
        text: __('需求已实施'),
        color: 'rgba(82, 196, 27, 1)',
        operation: [
            DemandOperateType.Detail,
            DemandOperateType.SharedApplication,
        ],
    },
    [DemandProcessStateEnum.DemandRejected]: {
        text: __('需求已驳回'),
        color: 'rgba(230, 0, 18, 1)',
        operation: [DemandOperateType.Detail],
    },
    [DemandProcessStateEnum.ReportFail]: {
        text: __('上报失败'),
        color: 'rgba(230, 0, 18, 1)',
        operation: [DemandOperateType.Detail, DemandOperateType.Rereport],
    },
}

export const statusFilters = [
    {
        label: __('全部'),
        value: '',
    },
    {
        label: __('上报审核中'),
        value: DemandProcessStateEnum.ReportForReview,
    },
    {
        label: __('上报已驳回'),
        value: DemandProcessStateEnum.ReportRejected,
    },
    {
        label: __('上报已撤销'),
        value: DemandProcessStateEnum.ReportedWithdrawn,
    },
    {
        label: __('上报失败'),
        value: DemandProcessStateEnum.ReportFail,
    },
    {
        label: __('需求实施中'),
        value: DemandProcessStateEnum.Implementing,
    },
    {
        label: __('需求已实施'),
        value: DemandProcessStateEnum.Implemented,
    },
    {
        label: __('需求已驳回'),
        value: DemandProcessStateEnum.DemandRejected,
    },
]

// 省需求 已处理需求查询状态列表
export const provinceStatusListOfHandle: StatusType[] = [
    {
        label: __('全部'),
        value: '',
    },
    {
        label: __('需求待实施'),
        value: DemandProcessStateEnum.ImplementSigningOff,
    },
    {
        label: __('需求实施中'),
        value: DemandProcessStateEnum.Implementing,
    },
    {
        label: __('需求已实施'),
        value: DemandProcessStateEnum.Implemented,
    },
    {
        label: __('需求已驳回'),
        value: DemandProcessStateEnum.DemandRejected,
    },
]

export const provinceStatusListOfToDo: StatusType[] = [
    // {
    //     label: __('全部'),
    //     value: '',
    // },
    {
        label: __('实施中'),
        value: DemandProcessStateEnum.Implementing,
    },
]

export const lightweightSearchData: IformItem[] = [
    {
        label: __('处理进度'),
        key: 'status',
        options: statusFilters,
        type: SearchType.Radio,
    },
]

// 需求详情-基础信息
export const DemandInfoFields: IBasicInfoFields[] = [
    {
        label: '需求名称：',
        value: 'title',
    },
    {
        label: '需求联系人：',
        value: 'code',
    },
    {
        label: '需求描述：',
        value: 'description',
        col: 24,
    },
    {
        label: '数据来源依据：',
        value: 'finish_date1',
    },
    {
        label: '需求部门：',
        value: 'finish_date11',
    },
    {
        label: '责任部门：',
        value: 'finish_date111',
    },
    {
        label: '期望更新周期：',
        value: 'finish_date',
    },
    {
        label: '附件：',
        value: 'attachment_name',
        type: DemandFieldType.FILE,
    },
]

export const AnalysisConclusionFields: IBasicInfoFields[] = [
    {
        label: '资源提供时间：',
        value: 'provide_time',
        type: DemandFieldType.TIME,
    },
    {
        label: '资源类型：',
        value: 'duty_resource_type',
    },
    {
        label: '签收部门：',
        value: 'org_name',
    },
    {
        label: '签收人：',
        value: 'analyzer',
        col: 24,
    },
    {
        label: '签收人电话：',
        value: 'phone',
    },
    {
        label: '签收说明：',
        value: 'comment',
    },
]

export const DemandTypeOptions = [
    {
        label: __('有事项'),
        value: '1',
    },
    {
        label: __('无事项'),
        value: '0',
    },
]

export enum ResoureMode {
    Select,
    Custom,
}

export enum ResourceType {
    View = 'view',
    File = 'file',
    Api = 'api',
}

export const ResourceTypeMap = {
    [ResourceType.View]: __('库表'),
    [ResourceType.File]: __('文件'),
    [ResourceType.Api]: __('接口'),
}

export const ResourceTypeOptions = [
    {
        label: __('库表'),
        value: ResourceType.View,
    },
    {
        label: __('文件'),
        value: ResourceType.File,
    },
    {
        label: __('接口'),
        value: ResourceType.Api,
    },
]

export const RejectTypeOptions = [
    {
        label: __('法律法规不允许提供'),
        value: 1,
    },

    {
        label: __('该数据不在本部门'),
        value: 2,
    },
    {
        label: __('资源不具备共享条件'),
        value: 3,
    },
    {
        label: __('其它'),
        value: 4,
    },
]

export const demandAuditTargetList: StatusType[] = [
    {
        label: __('待审核'),
        value: SSZDDemandAuditTarget.Tasks,
    },
    {
        label: __('已审核'),
        value: SSZDDemandAuditTarget.Historys,
    },
]

export const ApplyAuditFields: IBasicInfoFields[] = [
    {
        label: '需求名称：',
        value: 'title',
    },
    {
        label: '需求联系人：',
        value: 'contact',
    },
    {
        label: '需求描述：',
        value: 'description',
    },
    {
        label: '申请时间：',
        value: 'apply_time',
        type: DemandFieldType.TIME,
    },
]

export enum AuditResultStatusEnum {
    // 审核中
    Pending = 'pending',
    // 已拒绝
    Rejected = 'rejected',
    // 已通过
    Passed = 'passed',
}

export type AuditResultStatusMapType = Record<
    AuditResultStatusEnum,
    {
        text: string
        color: string
    }
>
export const AuditResultStatusMap: AuditResultStatusMapType = {
    [AuditResultStatusEnum.Pending]: {
        text: __('审核中'),
        color: 'rgba(18, 110, 227, 1)',
    },
    [AuditResultStatusEnum.Rejected]: {
        text: __('已拒绝'),
        color: 'rgba(230, 0, 18, 1)',
    },
    [AuditResultStatusEnum.Passed]: {
        text: __('已通过'),
        color: 'rgba(82, 196, 27, 1)',
    },
}
