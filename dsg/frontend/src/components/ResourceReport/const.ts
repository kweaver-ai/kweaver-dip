import __ from './locale'
import { IObject } from '../../core/apis/configurationCenter/index'
import {
    ISSZDAuditOperation,
    IGetSSZDReportRecord,
    ISSZDReportAuditStatus,
    ISSZDReportRecordType,
    SortDirection,
    ISSZDAuditLevel,
} from '@/core'

export interface IDirTable {
    selectedNode: any
    treeType?: RescCatlgType | string
}
export interface CatlgTreeNode extends IObject {
    level?: number
    parent_id?: string
    expansion?: boolean
    children?: CatlgTreeNode[]
    isExpand?: boolean
}

/**
 * 目录类型
 * @parma RESCCLASSIFY 资源分类
 * @parma ORGSTRUC 组织架构
 *  @parma DOAMIN 业务域
 */
export enum RescCatlgType {
    RESC_CLASSIFY = 'resource',
    ORGSTRUC = 'organization',
    DOAMIN = 'domain',
}

// 业务架构节点枚举
export enum Architecture {
    ALL = 'all', // 全部
    DOMAIN = 'domain', // 域
    DISTRICT = 'district', // 区域
    ORGANIZATION = 'organization', // 组织
    DEPARTMENT = 'department', // 部门
    BSYSTEM = 'business_system', // 信息系统
    BMATTERS = 'business_matters', // 业务事项
    BFORM = 'business_form', // 业务表单
    BSYSTEMCONTAINER = 'business_system_container', // 信息系统容器
    BMATTERSCONTAINER = 'business_matters_container', // 业务事项容器
    COREBUSINESS = 'main_business', // 业务模型
}

export const AllNodeInfo = {
    id: '',
    type: Architecture.ALL,
    path: '',
    name: __('全部'),
}

export const TabItems = [
    {
        label: __('待上报'),
        title: __('待上报'),
        key: ISSZDReportRecordType.Waiting,
        children: '',
    },
    {
        label: __('已上报'),
        title: __('已上报'),
        key: ISSZDReportRecordType.Reported,
        children: '',
    },
    {
        label: __('上报记录'),
        title: __('上报记录'),
        key: ISSZDReportRecordType.Record,
        children: '',
    },
]

export interface ISearchCondition extends IGetSSZDReportRecord {
    current: number
    pageSize: number
    catalog_status?: string
}

export const initSearchCondition: ISearchCondition = {
    current: 1,
    pageSize: 10,
    org_code: '',
    keyword: '',
    direction: SortDirection.DESC,
    sort: 'updated_at',
    query_type: ISSZDReportRecordType.Waiting,
}

export const DefaultMenu = {
    [ISSZDReportRecordType.Waiting]: {
        key: 'update_time',
        sort: SortDirection.DESC,
        label: __('按更新时间排序'),
    },
    [ISSZDReportRecordType.Reported]: {
        key: 'report_time',
        sort: SortDirection.DESC,
        label: __('按上报时间排序'),
    },
    [ISSZDReportRecordType.Record]: {
        key: 'report_time',
        sort: SortDirection.DESC,
        label: __('按上报时间排序'),
    },
}

/** 不限类型 */
export const UnLimitType = [
    {
        label: __('不限'),
        value: '',
    },
]

export enum ResourceType {
    VIEW = 'view',
    API = 'api',
    FILE = 'file',
}
/** 资源类型 */
export const resourceTypeList = [
    { label: __('库表'), value: ResourceType.VIEW },
    { label: __('接口'), value: ResourceType.API },
    { label: __('文件'), value: ResourceType.FILE },
]

/** 审核状态 */
export const auditStatusList = [
    {
        label: __('审核中'),
        value: ISSZDReportAuditStatus.Auditing,
        color: '#1677FF',
    },
    {
        label: __('审核通过'),
        value: ISSZDReportAuditStatus.Pass,
        color: '#58C524',
    },
    {
        label: __('审核未通过'),
        value: ISSZDReportAuditStatus.Reject,
        color: '#FF4D50',
    },
    {
        label: __('已撤回'),
        value: ISSZDReportAuditStatus.Cancel,
        color: 'rgba(0, 0, 0, 0.30)',
    },
    {
        label: __('失败'),
        value: ISSZDReportAuditStatus.Error,
        color: '#FF4D50',
    },
]

/** 审核级别 */
export const auditLevel = [
    {
        label: __('省级'),
        value: ISSZDAuditLevel.Province,
    },
    {
        label: __('市级'),
        value: ISSZDAuditLevel.City,
    },
]

/** 上报类型 */
export const auditOperationList = [
    {
        label: __('上报'),
        value: ISSZDAuditOperation.Report,
    },
    {
        label: __('重新上报'),
        value: ISSZDAuditOperation.ReReport,
    },
    {
        label: __('撤销上报'),
        value: ISSZDAuditOperation.Revocation,
    },
    {
        label: __('撤回'),
        value: ISSZDAuditOperation.Cancel,
    },
]

export enum StatusType {
    Online = 'online',
    Offline = 'offline',
}

/** 上线状态 */
export const statusList = [
    {
        label: __('已上线'),
        value: StatusType.Online,
        color: '#58C524',
    },
    {
        label: __('已下线'),
        value: StatusType.Offline,
        color: '#FF4D50',
    },
]

export enum publishStatus {
    Unpublished = 'unpublished',
    PublishedAuditing = 'pub-auditing',
    PublishedAuditReject = 'pub-reject',
    Published = 'published',
    ChangeAuditing = 'change-auditing',
    ChangeReject = 'change-reject',
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
    // {
    //     label: __('变更审核中'),
    //     value: publishStatus.ChangeAuditing,
    //     bgColor: '#1890FF',
    // },
    // {
    //     label: __('变更审核未通过'),
    //     value: publishStatus.ChangeReject,
    //     bgColor: '#FF4D4F',
    // },
]
export enum onLineStatus {
    UnOnline = 'notline',
    OnlineAuditing = 'up-auditing',
    OnlineAuditingReject = 'up-reject',
    Online = 'online',
    OfflineAuditing = 'down-auditing',
    OfflineReject = 'down-reject',
    Offline = 'offline',
    OfflineAuto = 'down-auto',
}
