import { IformItem, SearchType } from '@/ui/LightweightSearch/const'
import __ from './locale'
import { AppCaseItem, SortDirection, SortType } from '@/core'
import { OperateType } from '@/utils'

/**
 * 应用案例来源
 */
export enum AppCaseSource {
    // 本地
    LOCAL = 'local',

    // 省平台
    PROVINCE = 'province',
}

/**
 * 审核中
 * @param ReportAuditing 上报审核中
 * @param ReportRejected 上报已驳回
 * @param ReportUndone  已撤销上报
 * @param ReportFailed 上报失败
 * @param Reported  已上报
 * @param WithdrawAuditing 下架审核中
 * @param WithdrawRejected 下架已驳回
 * @param Unreported 未上报
 */
export enum AppCaseStatus {
    // 上报审核中
    ReportAuditing = 'ReportAuditing',
    // 上报已驳回
    ReportRejected = 'ReportRejected',
    // 已撤销上报
    ReportUndone = 'ReportUndone',
    // 上报失败
    ReportFailed = 'ReportFailed',
    // 已上报
    Reported = 'Reported',
    // 下架审核中
    WithdrawAuditing = 'WithdrawAuditing',
    // 下架已驳回
    WithdrawRejected = 'WithdrawRejected',
    // 未上报
    Unreported = 'Unreported',
}

export const caseStatusColorList = {
    [AppCaseStatus.ReportAuditing]: '#FAAD14',
    [AppCaseStatus.ReportRejected]: '#E60012',
    [AppCaseStatus.ReportUndone]: '#FAAD14',
    [AppCaseStatus.ReportFailed]: '#E60012',
    [AppCaseStatus.Reported]: '#52C41B',
    [AppCaseStatus.WithdrawAuditing]: '#52C41B',
    [AppCaseStatus.WithdrawRejected]: '#E60012',
    [AppCaseStatus.Unreported]: '#FAAD14',
}

export const caseStatusTextList = {
    [AppCaseStatus.ReportAuditing]: __('上报审核中'),
    [AppCaseStatus.ReportRejected]: __('上报已驳回'),
    [AppCaseStatus.ReportUndone]: __('已撤销上报'),
    [AppCaseStatus.ReportFailed]: __('上报失败'),
    [AppCaseStatus.Reported]: __('已上报'),
    [AppCaseStatus.WithdrawAuditing]: __('下架审核中'),
    [AppCaseStatus.WithdrawRejected]: __('下架已驳回'),
    [AppCaseStatus.Unreported]: __('未上报'),
}

export const caseStatusList = [
    {
        key: AppCaseStatus.ReportAuditing,
        label: caseStatusTextList[AppCaseStatus.ReportAuditing],
        value: AppCaseStatus.ReportAuditing,
    },
    {
        key: AppCaseStatus.ReportRejected,
        label: caseStatusTextList[AppCaseStatus.ReportRejected],
        value: AppCaseStatus.ReportRejected,
    },
    {
        key: AppCaseStatus.ReportUndone,
        label: caseStatusTextList[AppCaseStatus.ReportUndone],
        value: AppCaseStatus.ReportUndone,
    },
    {
        key: AppCaseStatus.ReportFailed,
        label: caseStatusTextList[AppCaseStatus.ReportFailed],
        value: AppCaseStatus.ReportFailed,
    },
    {
        key: AppCaseStatus.Reported,
        label: caseStatusTextList[AppCaseStatus.Reported],
        value: AppCaseStatus.Reported,
    },
    {
        key: AppCaseStatus.WithdrawAuditing,
        label: caseStatusTextList[AppCaseStatus.WithdrawAuditing],
        value: AppCaseStatus.WithdrawAuditing,
    },
    {
        key: AppCaseStatus.WithdrawRejected,
        label: caseStatusTextList[AppCaseStatus.WithdrawRejected],
        value: AppCaseStatus.WithdrawRejected,
    },
    {
        key: AppCaseStatus.Unreported,
        label: caseStatusTextList[AppCaseStatus.Unreported],
        value: AppCaseStatus.Unreported,
    },
]

export const caseStatusBtnList = {
    // 上报审核中
    [AppCaseStatus.ReportAuditing]: [
        OperateType.DETAIL,
        // 撤销
        OperateType.UNDOSUBMIT,
    ],
    // 上报已驳回
    [AppCaseStatus.ReportRejected]: [
        OperateType.DETAIL,
        // 重新上报
        OperateType.RESUBMIT,
    ],
    // 已撤销上报
    [AppCaseStatus.ReportUndone]: [OperateType.RESUBMIT],
    // 上报失败
    [AppCaseStatus.ReportFailed]: [OperateType.RESUBMIT],
    // 已上报
    [AppCaseStatus.Reported]: [
        OperateType.RESUBMIT,
        // 下架
        OperateType.OFFLINE,
    ],
    // 下架审核中
    [AppCaseStatus.WithdrawAuditing]: [OperateType.DETAIL],
    // 下架已驳回
    [AppCaseStatus.WithdrawRejected]: [OperateType.DETAIL, OperateType.OFFLINE],
    // 未上报
    [AppCaseStatus.Unreported]: [OperateType.RESUBMIT, OperateType.DELETE],
}

export const allOprList = {
    [OperateType.DETAIL]: __('详情'),
    [OperateType.UNDOSUBMIT]: __('撤销'),
    [OperateType.RESUBMIT]: __('重新上报'),
    [OperateType.DELETE]: __('删除'),
    [OperateType.OFFLINE]: __('下架'),
}

export const searchData: IformItem[] = [
    {
        label: __('状态'),
        key: 'status',
        options: [
            { value: '', label: '不限' },
            ...caseStatusList.map((item) => {
                return {
                    value: item.key,
                    label: item.label,
                }
            }),
        ],
        type: SearchType.Radio,
    },
]

// 应用领域
export enum AppField {
    CREADITSERVICES = 1,
    HEALTHCARE = 2,
    SOCIALSECURITYEMPLOYMENT = 3,
    PUBLICSAFETY = 4,
    URBANCONSTRUCTIONHOUSING = 5,
    TRANSPORTATION = 6,
    EDUCATIONANDCULTURE = 7,
    TECHNOLOGICALINNOVATION = 8,
    RESOURCESANDENERGY = 9,
    ECOLOGICALENVIRONMENT = 10,
    INDUSTRIALAGRICULTURE = 11,
    COMMERCIALCIRCULATION = 12,
    FINANCETAXATIONANDBANKING = 13,
    SAFETYPRODUCTION = 14,
    MARKETREGULATION = 15,
    SOCIALASSISTANCE = 16,
    LEGALSERVICES = 17,
    LIFESERVICES = 18,
    METEOROLOGICALSERVICES = 19,
    GEOGRAPHICSPACES = 20,
    INSTITUTIONALGROUPS = 21,
    OTHER = 22,
}
export const appFieldLabelList = {
    [AppField.CREADITSERVICES]: __('信用服务'),
    [AppField.HEALTHCARE]: __('医疗卫生'),
    [AppField.SOCIALSECURITYEMPLOYMENT]: __('社保就业'),
    [AppField.PUBLICSAFETY]: __('公共安全'),
    [AppField.URBANCONSTRUCTIONHOUSING]: __('城建住房'),
    [AppField.TRANSPORTATION]: __('交通运输'),
    [AppField.EDUCATIONANDCULTURE]: __('教育文化'),
    [AppField.TECHNOLOGICALINNOVATION]: __('科技创新'),
    [AppField.RESOURCESANDENERGY]: __('资源能源'),
    [AppField.ECOLOGICALENVIRONMENT]: __('生态环境'),
    [AppField.INDUSTRIALAGRICULTURE]: __('工业农业'),
    [AppField.COMMERCIALCIRCULATION]: __('商贸流通'),
    [AppField.FINANCETAXATIONANDBANKING]: __('财税金融'),
    [AppField.SAFETYPRODUCTION]: __('安全生产'),
    [AppField.MARKETREGULATION]: __('市场监管'),
    [AppField.SOCIALASSISTANCE]: __('社会救助'),
    [AppField.LEGALSERVICES]: __('法律服务'),
    [AppField.LIFESERVICES]: __('生活服务'),
    [AppField.METEOROLOGICALSERVICES]: __('气象服务'),
    [AppField.GEOGRAPHICSPACES]: __('地理空间'),
    [AppField.INSTITUTIONALGROUPS]: __('机构团体'),
    [AppField.OTHER]: __('其他'),
}

export const appFieldOptions = [
    ...Object.entries(appFieldLabelList).map(([value, label]) => ({
        value,
        label,
    })),
]
/**
 * 排序方式
 * @param CREATED 'creation_timestamp' 按应用案例的名称排序
 * @param NAME 'name' 按应用案例的创建时间排序
 */
export enum CaseSortType {
    CREATED = 'creation_timestamp',
    NAME = 'name',
}

// 排序menu
export const menus = [
    { key: CaseSortType.CREATED, label: __('按创建时间排序') },
]

export const defaultMenu = {
    key: CaseSortType.CREATED,
    sort: SortDirection.DESC,
}

export enum RefResourceType {
    DB = 'DB',
    API = 'API',
}

export const basicInfoAttrs = [
    {
        label: '应用案例名称：',
        value: '',
        key: 'name',
    },
    {
        label: '应用名称：',
        value: '',
        key: 'application_name',
    },
    { label: '组织架构：', value: '', key: 'department_path' },
    { label: '所属领域：', value: '', key: 'field_type', subKey: 'id' },
    {
        label: '应用案例描述：',
        value: '',
        key: 'description',
        span: 24,
    },
]

export const detailInfoAttrs: Array<{
    label: string
    list: Array<any>
}> = [
    {
        label: __('基本信息'),
        list: [
            {
                label: __('应用案例名称'),
                value: '',
                key: 'name',
                span: 24,
            },
            { label: '组织架构', value: '', key: 'department_name' },
            { label: '所属领域', value: '', key: 'field', subKey: 'id' },
            {
                label: '应用案例描述',
                value: '',
                key: 'description',
                span: 24,
            },
        ],
    },
    {
        label: __('应用场景'),
        list: [
            {
                label: __('业务事项'),
                value: '',
                key: 'process_name',
                span: 24,
            },
            { label: __('数据资源'), value: '', key: 'resources', span: 24 },
        ],
    },
]

export enum AppCaseAuditStatus {
    // 待审核
    Pending = 'Pending',
    // 已审核
    Audited = 'Auditing,Approved,Rejected',
}

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
        operation: OperateType[]
    }
>
export const AuditResultStatusMap: AuditResultStatusMapType = {
    [AuditResultStatusEnum.Pending]: {
        text: __('审核中'),
        color: 'rgba(18, 110, 227, 1)',
        operation: [OperateType.DETAIL],
    },
    [AuditResultStatusEnum.Rejected]: {
        text: __('已拒绝'),
        color: 'rgba(230, 0, 18, 1)',
        operation: [OperateType.DETAIL],
    },
    [AuditResultStatusEnum.Passed]: {
        text: __('已通过'),
        color: 'rgba(82, 196, 27, 1)',
        operation: [OperateType.DETAIL],
    },
}

export enum DemandFieldType {
    TIME = 'time',
    FILE = 'file',
    CHECK = 'checkbox',
}

export interface IBasicInfoFields {
    label: string
    value: string
    type?: DemandFieldType
    col?: number
}

export const ApplyAuditFields: IBasicInfoFields[] = [
    {
        label: '应用案例名称：',
        value: 'name',
    },
    {
        label: '应用名称：',
        value: 'application_name',
    },
    {
        label: '审核类型：',
        value: 'audit_type',
    },
    {
        label: '申请时间：',
        value: 'creation_timestamp',
        type: DemandFieldType.TIME,
    },
]

export interface IMountResource {
    mount_resource_id?: string
    mount_resource_name?: string
    mount_resource_type?: string | number
    mount_department_path?: string
}
