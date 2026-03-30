import { TabsProps } from 'antd'
import __ from './locale'
import { IDemandItemInfo, SortDirection } from '@/core'
import { IformItem, SearchType as ST } from '@/ui/LightweightSearch/const'
import { Authority, AuthorityNameMap, ResourceNameMap } from './Details/const'
import { IFormItem, SearchType } from '../SearchLayout/const'

export enum DemandOperate {
    Details = 'details',
    Analysis = 'analysis',
    Implement = 'implement',
    AnalysisSign = 'analysis_sign',
    ImplementSign = 'implement_sign',
}

/**
 * @param  ToBeSigned 待签收的
 * @param  ToDo 分析/实施中
 * @param  Handle 已处理
 */
export enum DemandProgress {
    ToBeSigned = 'signingoff',
    ToDo = 'todo',
    Handle = 'done',
}

export const DemandProgressItems: TabsProps['items'] = [
    // {
    //     key: DemandProgress.ToBeSigned,
    //     label: __('待签收'),
    // },
    {
        key: DemandProgress.ToDo,
        label: __('分析/实施中'),
    },
    {
        key: DemandProgress.Handle,
        label: __('已处理'),
    },
]

export const demandMgtStatusList: StatusType[] = [
    {
        label: __('实施中需求'),
        value: DemandProgress.ToDo,
    },
    {
        label: __('已处理需求'),
        value: DemandProgress.Handle,
    },
]

// 配置不同tab下展示的columns key
export const DemandProgressColunmsConfig = {
    [DemandProgress.ToBeSigned]: {
        columnKeys: [
            'title',
            'status',
            'applier',
            'applier_phone',
            'finish_date',
            'created_at',
            'action',
        ],
        opertions: [
            DemandOperate.Details,
            DemandOperate.AnalysisSign,
            DemandOperate.ImplementSign,
        ],
    },
    [DemandProgress.ToDo]: {
        columnKeys: [
            'title',
            'status',
            'applier',
            'applier_phone',
            'finish_date',
            'created_at',
            'action',
        ],
        opertions: [
            DemandOperate.Details,
            DemandOperate.Analysis,
            DemandOperate.Implement,
        ],
    },
    [DemandProgress.Handle]: {
        columnKeys: [
            'title',
            'status',
            'processor',
            'processor_phone',
            'finish_date',
            'created_at',
            'action',
        ],
        opertions: [DemandOperate.Details],
    },
}

/**
 * {Detail} 详情
 * {Revocation} 撤销
 * {AnalysisConfirm} 分析确认
 * {ImplementationAcceptance} 实施验收
 */
export enum DemandOperateType {
    'Detail',
    'Revocation',
    'AnalysisConfirm',
    'ImplementationAcceptance',
}

/**
 * @param AnalysisConfirmAuditing 分析结论审核中
 * @param AnalysisConfirming 分析待确认
 * @param AnalysisSigning 待分析
 * @param ImplementationSigning 待实施
 * @param Implementing 实施中
 * @param ImplementationAccepting 实施待验收
 * @param Analysising 分析中
 * @param Revoked 已撤销
 * @param Closed 已关闭
 */
export enum DemandStatusEnum {
    AnalysisConfirmAuditing = 'analysis_confirm_auditing',
    AnalysisConfirming = 'analysis_confirming',
    AnalysisSigning = 'analysis_signing_off',
    ImplementationSigning = 'implement_signing_off',
    Implementing = 'implementing',
    ImplementationAccepting = 'implement_accepting',
    Analysising = 'analysing',
    Revoked = 'canceled',
    Closed = 'closed',
}

export const DemandStatusMap = {
    [DemandStatusEnum.AnalysisSigning]: {
        text: __('待分析'),
        color: 'rgba(250, 173, 20, 1)',
        operation: [DemandOperateType.Detail, DemandOperateType.Revocation],
    },
    [DemandStatusEnum.AnalysisConfirmAuditing]: {
        text: __('分析结论审核中'),
        color: 'rgba(250, 173, 20, 1)',
        operation: [DemandOperateType.Detail, DemandOperateType.Revocation],
    },
    [DemandStatusEnum.AnalysisConfirming]: {
        text: __('分析待确认'),
        color: 'rgba(250, 173, 20, 1)',
        operation: [
            DemandOperateType.Detail,
            DemandOperateType.Revocation,
            DemandOperateType.AnalysisConfirm,
        ],
    },
    [DemandStatusEnum.ImplementationSigning]: {
        text: __('待实施'),
        color: 'rgba(24, 144, 255, 1)',
        operation: [DemandOperateType.Detail, DemandOperateType.Revocation],
    },
    [DemandStatusEnum.Implementing]: {
        text: __('实施中'),
        color: 'rgba(24, 144, 255, 1)',
        operation: [DemandOperateType.Detail],
    },
    [DemandStatusEnum.ImplementationAccepting]: {
        text: __('实施待验收'),
        color: 'rgba(24, 144, 255, 1)',
        operation: [
            DemandOperateType.Detail,
            DemandOperateType.ImplementationAcceptance,
        ],
    },
    [DemandStatusEnum.Analysising]: {
        text: __('分析中'),
        color: 'rgba(24, 144, 255, 1)',
        operation: [DemandOperateType.Detail, DemandOperateType.Revocation],
    },
    [DemandStatusEnum.Revoked]: {
        text: __('已撤销'),
        color: 'rgba(255, 77, 79, 1)',
        operation: [DemandOperateType.Detail],
    },
    [DemandStatusEnum.Closed]: {
        text: __('已关闭'),
        color: 'rgba(82, 196, 27, 1)',
        operation: [DemandOperateType.Detail],
    },
}
export interface StatusType {
    label: string
    value: string | number
}

export const statusListOfToBeSigned: StatusType[] = [
    {
        label: __('全部'),
        value: '',
    },
    {
        label: __('待分析'),
        value: DemandStatusEnum.AnalysisSigning,
    },
    {
        label: __('待实施'),
        value: DemandStatusEnum.ImplementationSigning,
    },
]

export const statusListOfToDo: StatusType[] = [
    {
        label: __('全部'),
        value: '',
    },
    {
        label: __('分析中'),
        value: DemandStatusEnum.Analysising,
    },
    {
        label: __('实施中'),
        value: DemandStatusEnum.Implementing,
    },
]

export const statusListOfHandle: StatusType[] = [
    {
        label: __('全部'),
        value: '',
    },
    {
        label: __('分析中'),
        value: DemandStatusEnum.Analysising,
    },
    {
        label: __('分析待确认'),
        value: DemandStatusEnum.AnalysisConfirming,
    },
    {
        label: __('分析结论审核中'),
        value: DemandStatusEnum.AnalysisConfirmAuditing,
    },
    {
        label: __('待实施'),
        value: DemandStatusEnum.ImplementationSigning,
    },
    {
        label: __('实施中'),
        value: DemandStatusEnum.Implementing,
    },
    {
        label: __('已撤销'),
        value: DemandStatusEnum.Revoked,
    },
    {
        label: __('已关闭'),
        value: DemandStatusEnum.Closed,
    },
]

// 查询form参数
export const getSearchFormData = (
    statusList: StatusType[],
    defaultValues?: any,
): IFormItem[] => [
    {
        label: __('需求名称（编码）'),
        key: 'keyword',
        type: SearchType.Input,
        // defaultValue: '',
        isAlone: true,
        itemProps: {
            value: defaultValues?.keyword || '',
        },
    },
    {
        label: __('当前状态'),
        key: 'status',
        type: SearchType.Select,
        itemProps: {
            options: statusList,
        },
    },
    {
        label: __('创建时间'),
        key: 'times1',
        type: SearchType.RangePicker,
        defaultValue: '',
        startTime: 'create_begin_time',
        endTime: 'create_end_time',
        isTimestamp: true,
        itemProps: {
            format: 'YYYY-MM-DD',
        },
    },
    // {
    //     label: __('期望完成时间'),
    //     key: 'times2',
    //     type: SearchType.RangePicker,
    //     defaultValue: '',
    //     startTime: 'finish_begin_time',
    //     endTime: 'finish_end_time',
    //     isTimestamp: true,
    //     itemProps: {
    //         format: 'YYYY-MM-DD',
    //     },
    // },
]

export const statusFilters = [
    {
        label: __('全部'),
        value: '',
    },
    {
        label: __('待分析'),
        value: DemandStatusEnum.AnalysisSigning,
    },
    {
        label: __('分析中'),
        value: DemandStatusEnum.Analysising,
    },
    {
        label: __('分析待确认'),
        value: DemandStatusEnum.AnalysisConfirming,
    },
    {
        label: __('分析结论审核中'),
        value: DemandStatusEnum.AnalysisConfirmAuditing,
    },
    {
        label: __('待实施'),
        value: DemandStatusEnum.ImplementationSigning,
    },
    {
        label: __('实施中'),
        value: DemandStatusEnum.Implementing,
    },
    {
        label: __('实施待验收'),
        value: DemandStatusEnum.ImplementationAccepting,
    },
    {
        label: __('已撤销'),
        value: DemandStatusEnum.Revoked,
    },
    {
        label: __('已关闭'),
        value: DemandStatusEnum.Closed,
    },
]

export const lightweightSearchData: IformItem[] = [
    {
        label: __('当前状态'),
        key: 'status',
        options: statusFilters,
        type: ST.Radio,
    },
    {
        label: __('创建时间'),
        key: 'created_at',
        type: ST.RangePicker,
        options: [],
    },
]

export const menus = [
    // { key: 'name', label: __('按需求名称排序') },
    { key: 'created_at', label: __('按创建时间排序') },
    { key: 'finish_date', label: __('按期望完成时间排序') },
]

export const defaultMenu = {
    key: 'created_at',
    sort: SortDirection.DESC,
}

/** 访问者类型枚举 */
export enum VisitorTypeEnum {
    /** 用户 */
    User = 'user',
    /** 部门 */
    Department = 'department',
    /** 角色 */
    Role = 'role',
}

/**
 * 需求类型
 * data_apply 数据应用需求
 */
export enum DemandType {
    DataApply = 'data_apply',
}

export enum ResType {
    Logicview = 'logicview',
}

export enum Feasibility {
    Feasible = 'feasible',
    Unfeasible = 'unfeasible',
}

export interface IExtendDemandItemInfo extends IDemandItemInfo {
    visitors?: any
}

export enum PassOrReject {
    Pass = 'pass',
    Reject = 'reject',
}

export const CommonItemsColumn = [
    {
        title: __('序号'),
        dataIndex: 'order',
        key: 'order',
        width: 100,
        render: (_, record, index) => index + 1,
    },
    {
        title: __('数据资源名称'),
        dataIndex: 'res_name',
        key: 'res_name',
        ellipsis: true,
    },
    {
        title: __('资源类型'),
        dataIndex: 'res_type',
        key: 'res_type',
        width: 200,
        render: (type) => ResourceNameMap[type],
    },
    {
        title: __('申请权限'),
        dataIndex: 'authority',
        key: 'authority',
        width: 200,
        render: (authority: Authority[]) => {
            return authority
                ?.map((au: Authority) => AuthorityNameMap[au])
                .join('/')
        },
    },
    {
        title: __('申请理由'),
        dataIndex: 'apply_reason',
        key: 'apply_reason',
        ellipsis: true,
    },
]

// 库表授权申请所处的阶段
export enum ApplyAuthPhaseList {
    // 无状态-没有配置权限
    PENDING = 'Pending',
    // 审核中
    AUDITING = 'Auditing',
    //  拒绝申请
    REJECTED = 'Rejected',
    //  允许申请
    APPROVED = 'Approved',
    //  发起者撤回申请
    UNDONE = 'Undone',
    //  创建行列规则（子库表）中
    SUBVIEWCREATEING = 'SubViewCreating',
    //  授权中
    AUTHORZING = 'Authorizing',
    //  失败。创建行列规则失败，或授权失败
    FAILED = 'Failed',
    //  完成，成功创建行列规则（如果需要），成功授权
    COMPLETED = 'Completed',
}

// 审核状态最终状态
export const rescApplyAuthEnd = [
    ApplyAuthPhaseList.REJECTED,
    ApplyAuthPhaseList.UNDONE,
    ApplyAuthPhaseList.COMPLETED,
    ApplyAuthPhaseList.FAILED,
]

export const filterApplyAuthPhaseList = [
    {
        label: __('申请审核中'),
        value: [
            ApplyAuthPhaseList.AUDITING,
            ApplyAuthPhaseList.APPROVED,
            ApplyAuthPhaseList.SUBVIEWCREATEING,
            ApplyAuthPhaseList.AUTHORZING,
        ],
        bgColor: '#1890FF',
    },
    {
        label: __('申请已拒绝'),
        value: [ApplyAuthPhaseList.REJECTED, ApplyAuthPhaseList.UNDONE],
        bgColor: '#E60012',
    },
    {
        label: __('授权成功'),
        value: [ApplyAuthPhaseList.COMPLETED],
        bgColor: '#52C41B',
    },
    {
        label: __('授权失败'),
        value: [ApplyAuthPhaseList.FAILED],
        bgColor: '#E60012',
    },
    {
        label: __('空'),
        value: [ApplyAuthPhaseList.PENDING],
        bgColor: '',
    },
]

export const statusDefaultVal = ''

export const searchData: IformItem[] = [
    {
        label: __('申请状态'),
        key: 'status',
        options: [
            { value: statusDefaultVal, label: '不限' },
            ...filterApplyAuthPhaseList,
        ],
        type: ST.Radio,
    },
]

// 详情视角
export enum DemandDetailView {
    // applier：需求方视角，要求用户必须是需求创建人（当需求状态不为已撤销且为分析待确认及其之后的状态展示分析结果，分析结果展示内容为最新提交的记录）
    APPLIER = 'applier',

    // operator：需求分析/实施人员视角，需求为待分析/待实施状态时所有运营均可查看，否则限定仅曾处理过该需求的运营人员可查看（分析结果展示最新的保存或提交的记录）
    OPERAOTR = 'operator',

    // auditor：审核员视角，fields包含analysis_result、implement_result时必须指定analysis_id，展示指定analysis_id的分析记录
    AUDITOR = 'auditor',
}

export enum Relation {
    And = 'and',
    Or = 'or',
}

export const RelationTextMap = {
    [Relation.And]: __('且'),
    [Relation.Or]: __('或'),
}

export enum ViewMode {
    // 主题域
    Domain = 'domain',
    // 组织架构
    Architecture = 'architecture',
}

export const viewModeOptions = [
    { label: __('主题域'), value: ViewMode.Domain },
    { label: __('组织架构'), value: ViewMode.Architecture },
]

export enum ViewInfoMode {
    Field = 'field',
    Sample = 'samp;e',
}
export const viewInfoOptions = [
    { label: __('字段'), value: ViewInfoMode.Field },
    { label: __('样例数据'), value: ViewInfoMode.Sample },
]

export enum Permission {
    Read = 'read',
    Download = 'download',
}

export const PermissionOptions = [
    {
        label: __('读取'),
        value: Permission.Read,
    },
    {
        label: __('读取/下载'),
        value: Permission.Download,
    },
]

export enum BackUrlType {
    Apply = 'apply',
    Sign = 'sign',
    Todo = 'todo',
    Handle = 'done',
}
