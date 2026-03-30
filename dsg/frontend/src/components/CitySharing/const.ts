import {
    ShareApplyStatus,
    ShareApplyAuditStatus,
    ShareApplyResourceType,
    ShareApplyAuditType,
    ShareApplyImplTag,
    FeedbackTargetEnum,
} from '@/core'
import __ from './locale'
import { OptionMenuType } from '@/ui'
import { SearchType as SearchTypeLayout } from '@/components/SearchLayout/const'

/**
 * 资源共享操作
 */
export enum SharingOperate {
    // 详情
    Detail = 'Detail',
    // 编辑
    Edit = 'Edit',
    // 删除
    Delete = 'Delete',
    // 撤回
    Cancel = 'cancel',
    // 关闭
    Close = 'close',
    // 分析签收
    AnalysisSign = 'analysisSign',
    // 取消分析签收
    CancelAnalysisSign = 'cancelAnalysisSign',
    // 分析
    Analysis = 'analysis',
    // 编辑（分析）
    EditAnalysis = 'editAnalysis',
    // 重新分析
    ReAnalysis = 'reAnalysis',
    // 审核
    Audit = 'audit',
    // 确认
    Confirm = 'confirm',
    // 确认分析结论 与 上确认为一个操作，
    ConfirmAnalysisConclusion = 'confirmAnalysisConclusion',
    // 实施签收
    ImplementSign = 'implSign',
    // 实施
    Implement = 'implement',
    // 制定实施方案
    CreateImplSolution = 'createImplSolution',
    // 重新制定实施方案
    ReCreateImplSolution = 'reCreateImplSolution',
    // 查看实施方案
    ViewImplSolution = 'viewImplSolution',
    // 查看实施任务
    ViewImplTask = 'viewImplTask',
    // 创建
    Create = 'create',

    //  申报审核
    ApplyAudit = 'ApplyAudit',
    // 分析审核
    AnalysisAudit = 'AnalysisAudit',
    // 数据提供方审核
    DataProviderAudit = 'DataProviderAudit',

    // 实施详情
    ImplementDetail = 'implementDetail',

    // 方案确认
    ImplementConfirm = 'implementConfirm',

    // 实施成果
    ImplementResult = 'implementResult',

    // 确认实施成果
    ConfirmImplementResult = 'confirmImplementResult',

    // 查看接口详情
    ViewApiDetail = 'viewApiDetail',
    // 反馈
    Feedback = 'Feedback',
    // 同步接口
    SyncApi = 'syncApi',
    // 订阅服务
    SubService = 'subService',
    // 重新订阅服务
    ResSubService = 'resSubService',
    // 查看订阅服务
    ViewSubService = 'viewSubService',
}

// 操作
export const allOptionMenus = [
    {
        key: SharingOperate.SyncApi,
        label: __('同步并订阅服务'),
        menuType: OptionMenuType.Menu,
    },
    {
        key: SharingOperate.ResSubService,
        label: __('重新订阅服务'),
        menuType: OptionMenuType.Menu,
    },
    {
        key: SharingOperate.SubService,
        label: __('订阅服务'),
        menuType: OptionMenuType.Menu,
    },
    {
        key: SharingOperate.ViewSubService,
        label: __('查看接口授权'),
        menuType: OptionMenuType.Menu,
    },
    {
        key: SharingOperate.Detail,
        label: __('详情'),
        menuType: OptionMenuType.Menu,
    },
    {
        key: SharingOperate.Edit,
        label: __('编辑'),
        menuType: OptionMenuType.Menu,
    },
    {
        key: SharingOperate.Delete,
        label: __('删除'),
        menuType: OptionMenuType.Menu,
    },
    {
        key: SharingOperate.Cancel,
        label: __('撤回'),
        menuType: OptionMenuType.Menu,
    },
    {
        key: SharingOperate.Close,
        label: __('关闭'),
        menuType: OptionMenuType.Menu,
    },
    {
        key: SharingOperate.Audit,
        label: __('审核'),
        menuType: OptionMenuType.Menu,
    },
    {
        key: SharingOperate.AnalysisSign,
        label: __('签收'),
        menuType: OptionMenuType.Menu,
    },
    {
        key: SharingOperate.Analysis,
        label: __('分析'),
        menuType: OptionMenuType.Menu,
    },
    {
        key: SharingOperate.CancelAnalysisSign,
        label: __('取消签收'),
        menuType: OptionMenuType.Menu,
    },
    {
        key: SharingOperate.EditAnalysis,
        label: __('编辑'),
        menuType: OptionMenuType.Menu,
    },
    {
        key: SharingOperate.ReAnalysis,
        label: __('重新分析'),
        menuType: OptionMenuType.Menu,
    },
    {
        key: SharingOperate.Confirm,
        label: __('确认'),
        menuType: 'menu',
    },
    {
        key: SharingOperate.ConfirmAnalysisConclusion,
        label: __('确认分析结论'),
        menuType: 'menu',
    },
    {
        key: SharingOperate.ImplementSign,
        label: __('签收'),
        menuType: OptionMenuType.Menu,
    },
    {
        key: SharingOperate.Implement,
        label: __('实施'),
        menuType: OptionMenuType.Menu,
    },
    {
        key: SharingOperate.CreateImplSolution,
        label: __('制定实施方案'),
        menuType: OptionMenuType.Menu,
    },
    {
        key: SharingOperate.ImplementConfirm,
        label: __('确认'),
        menuType: 'menu',
    },
    {
        key: SharingOperate.ImplementResult,
        label: __('确认'),
        menuType: 'menu',
    },
    {
        key: SharingOperate.ConfirmImplementResult,
        label: __('确认实施成果'),
        menuType: 'menu',
    },
    {
        key: SharingOperate.ReCreateImplSolution,
        label: __('重新制定实施方案'),
        menuType: OptionMenuType.Menu,
    },
    {
        key: SharingOperate.ViewImplSolution,
        label: __('查看实施方案'),
        menuType: OptionMenuType.Menu,
    },
    {
        key: SharingOperate.ViewImplTask,
        label: __('查看实施任务'),
        menuType: OptionMenuType.Menu,
    },
    {
        key: SharingOperate.ViewApiDetail,
        label: __('查看接口详情'),
        menuType: OptionMenuType.Menu,
    },
    {
        key: SharingOperate.Feedback,
        label: __('反馈'),
        menuType: OptionMenuType.Menu,
    },
]

export const applyProcessMap = {
    [ShareApplyStatus.UnReport]: {
        text: __('未申报'),
        color: 'rgba(0, 0, 0, 0.3)',
    },
    [ShareApplyStatus.AnalysisSigningOff]: {
        text: __('分析待签收'),
        color: 'rgba(24, 144, 255, 1)',
    },
    [ShareApplyStatus.AnalysisPending]: {
        text: __('待分析'),
        color: 'rgba(24, 144, 255, 1)',
    },
    [ShareApplyStatus.Analysing]: {
        text: __('分析中'),
        color: 'rgba(24, 144, 255, 1)',
    },
    [ShareApplyStatus.AnalysisUnfeasible]: {
        text: __('分析结论不可行'),
        color: 'rgba(255, 77, 79, 1)',
    },
    [ShareApplyStatus.AnalysisConfirming]: {
        text: __('分析结论待确认'),
        color: 'rgba(250, 173, 20, 1)',
    },
    [ShareApplyStatus.AnalysisConfirmAuditing]: {
        text: __('数据共享待确认'),
        color: 'rgba(250, 173, 20, 1)',
    },
    [ShareApplyStatus.ImplementSigningOff]: {
        text: __('实施待签收'),
        color: 'rgba(24, 144, 255, 1)',
    },
    [ShareApplyStatus.ImplementPending]: {
        text: __('待实施'),
        color: 'rgba(24, 144, 255, 1)',
    },
    [ShareApplyStatus.Implementing]: {
        text: __('实施中'),
        color: 'rgba(24, 144, 255, 1)',
    },
    [ShareApplyStatus.ImplementAccepting]: {
        text: __('实施成果待确认'),
        color: 'rgba(250, 173, 20, 1)',
    },
    [ShareApplyStatus.Closed]: {
        text: __('已完结'),
        color: 'rgba(82, 196, 27, 1)',
    },
    [ShareApplyStatus.Analysed]: {
        text: __('已分析'),
        color: 'rgba(82, 196, 27, 1)',
    },
    [ShareApplyStatus.ImplementSolutionCreating]: {
        text: __('实施方案制定中'),
        color: 'rgba(24, 144, 255, 1)',
    },
    [ShareApplyStatus.ImplementSolutionConfirming]: {
        text: __('实施方案确认中'),
        color: 'rgba(250, 172, 20, 1)',
    },
    [ShareApplyStatus.Implemented]: {
        text: __('已实施'),
        color: 'rgba(82, 196, 27, 1)',
    },
}

export const applyProcessOptions = [
    {
        value: ShareApplyStatus.UnReport,
        label: applyProcessMap[ShareApplyStatus.UnReport].text,
    },
    {
        value: ShareApplyStatus.AnalysisSigningOff,
        label: applyProcessMap[ShareApplyStatus.AnalysisSigningOff].text,
    },
    {
        value: ShareApplyStatus.AnalysisPending,
        label: applyProcessMap[ShareApplyStatus.AnalysisPending].text,
    },
    {
        value: ShareApplyStatus.Analysing,
        label: applyProcessMap[ShareApplyStatus.Analysing].text,
    },
    {
        value: ShareApplyStatus.AnalysisUnfeasible,
        label: applyProcessMap[ShareApplyStatus.AnalysisUnfeasible].text,
    },
    {
        value: ShareApplyStatus.AnalysisConfirming,
        label: applyProcessMap[ShareApplyStatus.AnalysisConfirming].text,
    },
    {
        value: ShareApplyStatus.AnalysisConfirmAuditing,
        label: applyProcessMap[ShareApplyStatus.AnalysisConfirmAuditing].text,
    },
    {
        value: ShareApplyStatus.ImplementSigningOff,
        label: applyProcessMap[ShareApplyStatus.ImplementSigningOff].text,
    },
    {
        value: ShareApplyStatus.ImplementPending,
        label: applyProcessMap[ShareApplyStatus.ImplementPending].text,
    },
    {
        value: ShareApplyStatus.Implementing,
        label: applyProcessMap[ShareApplyStatus.Implementing].text,
    },
    {
        value: ShareApplyStatus.ImplementAccepting,
        label: applyProcessMap[ShareApplyStatus.ImplementAccepting].text,
    },
    {
        value: ShareApplyStatus.Closed,
        label: applyProcessMap[ShareApplyStatus.Closed].text,
    },
    // {
    //     value: ShareApplyStatus.Analysed,
    //     label: applyProcessMap[ShareApplyStatus.Analysed].text,
    // },
]

// 资源类型
export const resTypeMap = {
    [ShareApplyResourceType.View]: {
        text: __('库表'),
    },
    [ShareApplyResourceType.API]: {
        text: __('接口'),
    },
}

// 资源提供方式
export const supplyTypeMap = {
    [ShareApplyResourceType.View]: {
        text: __('库表交换'),
    },
    [ShareApplyResourceType.API]: {
        text: __('接口服务'),
    },
}

// 资源类型筛选项
export const resTypeOptions = [
    {
        label: resTypeMap[ShareApplyResourceType.View].text,
        value: ShareApplyResourceType.View,
    },
    {
        label: resTypeMap[ShareApplyResourceType.API].text,
        value: ShareApplyResourceType.API,
    },
]

// 提供方式筛选项
export const supplyTypeOptions = [
    {
        label: supplyTypeMap[ShareApplyResourceType.View].text,
        value: ShareApplyResourceType.View,
    },
    {
        label: supplyTypeMap[ShareApplyResourceType.API].text,
        value: ShareApplyResourceType.API,
    },
]

// 审核状态
export const auditStatusListMap = {
    [ShareApplyAuditStatus.ReportAuditing]: {
        text: __('申报审核中'),
        backgroundColor: 'rgba(24, 144, 255, 0.2)',
        color: 'rgba(24, 144, 255, 1)',
    },
    [ShareApplyAuditStatus.ReportAuditReject]: {
        text: __('申报未通过'),
        backgroundColor: 'rgba(255, 77, 79, 0.2)',
        color: 'rgba(255, 77, 79, 1)',
    },
    [ShareApplyAuditStatus.ReportAuditUndone]: {
        text: __('已撤销'),
        backgroundColor: 'rgba(255, 77, 79, 0.2)',
        color: 'rgba(255, 77, 79, 1)',
    },
    [ShareApplyAuditStatus.AnalysisAuditing]: {
        text: __('分析结论审核中'),
        backgroundColor: 'rgba(24, 144, 255, 0.2)',
        color: 'rgba(24, 144, 255, 1)',
    },
    [ShareApplyAuditStatus.AnalysisAuditReject]: {
        text: __('分析结论未通过'),
        backgroundColor: 'rgba(255, 77, 79, 0.2)',
        color: 'rgba(255, 77, 79, 1)',
    },
    [ShareApplyAuditStatus.AnalysisConfirmReject]: {
        text: __('分析结论未通过'),
        backgroundColor: 'rgba(255, 77, 79, 0.2)',
        color: 'rgba(255, 77, 79, 1)',
    },
    [ShareApplyAuditStatus.AnalysisConfirmAuditing]: {
        text: __('数据共享审核中'),
        backgroundColor: 'rgba(24, 144, 255, 0.2)',
        color: 'rgba(24, 144, 255, 1)',
    },
    [ShareApplyAuditStatus.AnalysisConfirmAuditReject]: {
        text: __('数据共享审核未通过'),
        backgroundColor: 'rgba(255, 77, 79, 0.2)',
        color: 'rgba(255, 77, 79, 1)',
    },
    [ShareApplyAuditStatus.FeedbackAuditing]: {
        text: __('成效反馈审核中'),
        backgroundColor: 'rgba(24, 144, 255, 0.2)',
        color: 'rgba(24, 144, 255, 1)',
    },
    [ShareApplyAuditStatus.FeedbackAuditReject]: {
        text: __('成效反馈未通过'),
        backgroundColor: 'rgba(255, 77, 79, 0.2)',
        color: 'rgba(255, 77, 79, 1)',
    },
}

// 实施标签
export const implStatusListMap = {
    [ShareApplyImplTag.ImplSolutionConfirming]: {
        text: __('实施方案确认中'),
        backgroundColor: 'rgba(24, 144, 255, 0.2)',
        color: 'rgba(24, 144, 255, 1)',
    },
    [ShareApplyImplTag.ImplSolutionConfirmReject]: {
        text: __('实施方案未通过'),
        backgroundColor: 'rgba(255, 77, 79, 0.2)',
        color: 'rgba(255, 77, 79, 1)',
    },
    [ShareApplyImplTag.ImplementAchvConfirming]: {
        text: __('实施成果确认中'),
        backgroundColor: 'rgba(24, 144, 255, 0.2)',
        color: 'rgba(24, 144, 255, 1)',
    },
    [ShareApplyImplTag.PushPending]: {
        text: __('数据待推送'),
        backgroundColor: 'rgba(24, 144, 255, 0.2)',
        color: 'rgba(24, 144, 255, 1)',
    },
    [ShareApplyImplTag.Pushing]: {
        text: __('数据推送中'),
        backgroundColor: 'rgba(24, 144, 255, 0.2)',
        color: 'rgba(24, 144, 255, 1)',
    },
    [ShareApplyImplTag.PushFailed]: {
        text: __('数据推送失败'),
        backgroundColor: 'rgba(255, 77, 79, 0.2)',
        color: 'rgba(255, 77, 79, 1)',
    },
}

export const apiImplStatusListMap = {
    [SharingOperate.ViewSubService]: {
        text: __('接口授权成功'),
        backgroundColor: 'rgba(24, 144, 255, 0.2)',
        color: 'rgba(24, 144, 255, 1)',
    },
    [SharingOperate.SubService]: {
        text: __('接口同步成功'),
        backgroundColor: 'rgba(24, 144, 255, 0.2)',
        color: 'rgba(24, 144, 255, 1)',
    },
    [SharingOperate.ResSubService]: {
        text: __('接口授权失败'),
        backgroundColor: 'rgba(255, 77, 79, 0.2)',
        color: 'rgba(255, 77, 79, 1)',
    },
    [SharingOperate.SyncApi]: {
        text: __('同步接口失败'),
        backgroundColor: 'rgba(255, 77, 79, 0.2)',
        color: 'rgba(255, 77, 79, 1)',
    },
}

/**
 * 本市州共享tab
 */
export enum SharingTab {
    // 共享申请清单
    Apply = 'apply',
    // 分析完善
    AnalysisImprove = 'analysisImprove',
    // 分析结论确认
    AnalysisConfirm = 'analysisConfirm',
    // 数据资源实施
    ImplementData = 'implementData',
    // 实施方案确认
    ImplementPlan = 'implementPlan',
    // 实施结果确认
    ImplementResult = 'implementResult',
    // 申报审核
    AuditDeclare = 'auditDeclare',
    // 分析结论审核
    AuditAnalysis = 'auditAnalysis',
    // 数据提供方审核
    AuditDataProvider = 'auditDataProvider',
    // 发起成效反馈
    StartFeedback = 'startFeedback',
    // 处理成效反馈
    HandleFeedback = 'handleFeedback',
    // 成效反馈审核
    AuditFeedback = 'auditFeedback',
}

export enum FeedbackStatusEnum {
    ALL = '',
    // 待成效反馈（待处理）
    PENDING = 'feedback-pending',
    // 成效反馈中（进行中）
    FEEDBACKING = 'feedbacking',
    // 成效反馈完成（已完成）
    FINISHED = 'feedback-finished',
}

export const sharingTabMap = {
    // 共享申请清单
    [SharingTab.Apply]: {
        // 表格列名
        columnKeys: [
            // 申请名称（编码）
            'name',
            // 申请进度
            'status',
            // 申请部门
            'apply_org_name',
            // 申请联系人（联系电话）
            'applier',
            // 申请资源个数
            'view_num',
            // 资源类型
            'source_type',
            // 创建时间
            'created_at',
            // 期望完成时间
            'finish_date',
            // 操作
            'action',
        ],
        // 操作栏宽度
        actionWidth: 160,
        // 搜索筛选项
        filterKeys: [
            'keyword',
            'apply_org_code',
            'status',
            'source_type',
            'create_time',
            'finish_time',
            'anal_audit_time',
            'impl_time',
            'close_time',
        ],
        // 筛选项props
        customProps: {
            status: {
                itemProps: {
                    options: applyProcessOptions,
                },
            },
        },
        // 默认搜索条件
        initSearch: {
            limit: 10,
            offset: 1,
            sort: 'created_at',
            direction: 'desc',
        },
        // 默认表头排序 - 如果不传，则不支持表示不支持表头排序
        defaultTableSort: { created_at: 'desc', finish_time: null },
        // 表格默认滚动高度
        defaultScrollY: `calc(100vh - 291px)`,
    },
    // 分析完善
    [SharingTab.AnalysisImprove]: {
        // 表格列名
        columnKeys: [
            // 申请名称（编码）
            'name',
            // 申请部门
            'apply_org_name',
            // 申请联系人（联系电话）
            'applier',
            // 申请资源个数
            'view_num',
            // 资源类型
            'source_type',
            // 申请时间
            'created_at',
            // 期望完成时间
            'finish_date',
            // 申请进度
            'status',
            // 操作
            'action',
        ],
        // 操作栏宽度
        actionWidth: 180,
        // 默认表头排序 - 如果不传，则不支持表示不支持表头排序
        defaultTableSort: { created_at: 'desc', finish_date: null },
        // 左侧状态筛选
        statusOption: [
            { status: ShareApplyStatus.All, label: __('全部') },
            {
                status: ShareApplyStatus.AnalysisSigningOff,
                label: __('待签收'),
            },
            { status: ShareApplyStatus.AnalysisPending, label: __('待分析') },
            { status: ShareApplyStatus.Analysing, label: __('分析中') },
            {
                status: ShareApplyStatus.Analysed,
                label: __('已分析'),
            },
        ],
        // 筛选项
        filterKeys: [
            'keyword',
            'apply_org_code',
            'source_type',
            'create_time',
            'finish_time',
            'anal_audit_time',
            'impl_time',
            'close_time',
        ],
        // 表格默认滚动高度
        defaultScrollY: `calc(100vh - 291px)`,
    },
    // 分析结果确认
    [SharingTab.AnalysisConfirm]: {
        // 表格列名
        columnKeys: [
            // 申请名称（编码）
            'name',
            // 申请部门
            'apply_org_name',
            // 申请联系人（联系电话）
            'applier',
            // 申请资源个数
            'view_num',
            // 资源类型
            'source_type',
            // 申请时间
            'created_at',
            // 期望完成时间
            'finish_date',
            // 操作
            'action',
        ],
        // 操作栏宽度
        actionWidth: 120,
        // 筛选项
        filterKeys: [
            'keyword',
            'apply_org_code',
            'source_type',
            'create_time',
            'finish_time',
            'anal_audit_time',
            'impl_time',
            'close_time',
        ],
        initSearch: {
            limit: 10,
            offset: 1,
            sort: 'created_at',
            direction: 'desc',
            status: ShareApplyStatus.AnalysisConfirming,
            audit_status: ShareApplyAuditStatus.AnalysisConfirming,
            is_all: false,
        },
        // 默认表头排序
        defaultTableSort: { created_at: 'desc', finish_date: null },
        defaultScrollY: `calc(100vh - 291px)`,
    },
    // 数据资源实施列表 - 卡片+表格
    [SharingTab.ImplementData]: {
        // 左侧状态筛选
        statusOption: [
            {
                status: ShareApplyStatus.All,
                label: __('全部'),
            },
            {
                status: ShareApplyStatus.ImplementSigningOff,
                label: __('待签收'),
            },
            {
                status: ShareApplyStatus.ImplementPending,
                label: __('待实施'),
            },
            {
                status: ShareApplyStatus.Implementing,
                label: __('实施中'),
            },
        ],
        // 筛选项
        filterKeys: [
            'keyword',
            'apply_org_code',
            'supply_type',
            'create_time',
            'finish_time',
            'impl_time',
            'close_time',
        ],
        // 默认搜索条件
        initSearch: {
            limit: 20,
            offset: 1,
            sort: 'created_at',
            direction: 'desc',
        },
        defaultScrollY: `calc(100vh - 291px)`,
    },
    // 实施方案确认
    [SharingTab.ImplementPlan]: {
        // 表格列名
        columnKeys: [
            // 申请名称（编码）
            'name',
            // 申请部门
            'apply_org_name',
            // 申请联系人（联系电话）
            'applier',
            // 申请资源个数
            'view_num',
            // 资源类型
            'source_type',
            // 申请时间
            'created_at',
            // 期望完成时间
            'finish_date',
            // 操作
            'action',
        ],
        // 筛选项
        filterKeys: [
            'keyword',
            'apply_org_code',
            'source_type',
            'create_time',
            'finish_time',
            'anal_audit_time',
            'impl_time',
            'close_time',
        ],
        initSearch: {
            limit: 10,
            offset: 1,
            sort: 'created_at',
            direction: 'desc',
            status: ShareApplyStatus.Implementing,
            audit_status: ShareApplyAuditStatus.ImplementSolutionConfirming,
            is_all: false,
        },
        // 操作栏宽度
        actionWidth: 120,
        // 默认表头排序
        defaultTableSort: { created_at: 'desc', finish_date: null },
        defaultScrollY: `calc(100vh - 291px)`,
    },
    // 实施结果确认
    [SharingTab.ImplementResult]: {
        // 表格列名
        columnKeys: [
            // 申请名称（编码）
            'name',
            // 申请部门
            'apply_org_name',
            // 申请联系人（联系电话）
            'applier',
            // 申请资源个数
            'view_num',
            // 资源类型
            'source_type',
            // 申请时间
            'created_at',
            // 期望完成时间
            'finish_date',
            // 操作
            'action',
        ],
        // 操作栏宽度
        actionWidth: 120,
        initSearch: {
            limit: 10,
            offset: 1,
            sort: 'created_at',
            direction: 'desc',
            status: ShareApplyStatus.ImplementAccepting,
            is_all: false,
        },
        // 默认表头排序
        defaultTableSort: { created_at: 'desc', finish_date: null },
        defaultScrollY: `calc(100vh - 291px)`,
    },
    // 审计申报
    [SharingTab.AuditDeclare]: {
        // 表格列名
        columnKeys: [
            // 申请名称（编码）
            'name',
            // 申请部门
            'apply_org_name',
            // 申请联系人（联系电话）
            'applier',
            // 申请资源个数
            'view_num',
            // 资源类型
            'source_type',
            // 申请时间
            'created_at',
            // 期望完成时间
            'finish_date',
            // 操作
            'action',
        ],
        // opMap: auditOperateRules,
        // 操作栏宽度
        actionWidth: 80,
        initSearch: {
            limit: 10,
            offset: 1,
            audit_type: ShareApplyAuditType.AFShareApplyReport,
        },
        refresh: true,
        defaultScrollY: `calc(100vh - 227px)`,
    },
    // 分析结论审核
    [SharingTab.AuditAnalysis]: {
        // 表格列名
        columnKeys: [
            // 申请名称（编码）
            'name',
            // 申请部门
            'apply_org_name',
            // 申请联系人（联系电话）
            'applier',
            // 申请资源个数
            'view_num',
            // 资源类型
            'source_type',
            // 申请时间
            'created_at',
            // 期望完成时间
            'finish_date',
            // 操作
            'action',
        ],
        // 操作栏宽度
        actionWidth: 80,
        initSearch: {
            limit: 10,
            offset: 1,
            audit_type: ShareApplyAuditType.AFShareApplyAnalysis,
        },
        // 刷新
        refresh: true,
        defaultScrollY: `calc(100vh - 227px)`,
    },
    // 数据提供方审核
    [SharingTab.AuditDataProvider]: {
        // 表格列名
        columnKeys: [
            // 申请名称（编码）
            'name',
            // 申请部门
            'apply_org_name',
            // 申请联系人（联系电话）
            'applier',
            // 申请资源个数
            'view_num',
            // 资源类型
            'source_type',
            // 申请时间
            'created_at',
            // 期望完成时间
            'finish_date',
            // 操作
            'action',
        ],
        // opMap: auditOperateRules,
        // 操作栏宽度
        actionWidth: 80,
        initSearch: {
            limit: 10,
            offset: 1,
            sort: 'created_at',
            direction: 'desc',
        },
        // searchPlaceholder: __('搜索申请编码、申请名称'),
        refresh: true,
        defaultScrollY: `calc(100vh - 227px)`,
        // 默认表头排序
        defaultTableSort: { created_at: 'desc', finish_date: null },
    },
    // 发起成效反馈
    [SharingTab.StartFeedback]: {
        // 表格列名
        columnKeys: (tab: FeedbackTargetEnum) =>
            tab === FeedbackTargetEnum.StartPending
                ? [
                      // 申请名称（编码）
                      'name',
                      // 申请部门
                      'apply_org_name',
                      // 申请联系人（联系电话）
                      'applier',
                      // 申请资源个数
                      'view_num',
                      // 资源类型
                      'source_type',
                      // 创建时间
                      'created_at',
                  ]
                : [
                      // 申请名称（编码）
                      'name',
                      // 申请部门
                      'apply_org_name',
                      // 反馈内容
                      'feedback_content',
                      // 反馈时间
                      'feedback_at',
                      // 操作
                      'action',
                  ],
        // 操作栏宽度
        actionWidth: 160,
        // 搜索筛选项
        filterKeys: ['keyword'],
        // 默认搜索条件
        initSearch: {
            limit: 10,
            offset: 1,
            sort: 'feedback_at',
            direction: 'desc',
            target: FeedbackTargetEnum.StartPending,
            feedback_status: FeedbackStatusEnum.ALL,
        },
        // 默认表头排序 - 如果不传，则不支持表示不支持表头排序
        defaultTableSort: { feedback_at: 'desc' },
        // 表格默认滚动高度
        defaultScrollY: `calc(100vh - 291px)`,
        searchPlaceholder: __('搜索申请单名称'),
        // 左侧状态筛选
        statusOption: [
            { status: FeedbackStatusEnum.ALL, label: __('全部') },
            { status: FeedbackStatusEnum.PENDING, label: __('待处理') },
            { status: FeedbackStatusEnum.FEEDBACKING, label: __('进行中') },
            { status: FeedbackStatusEnum.FINISHED, label: __('已完成') },
        ],
    },
    // 发起成效反馈
    [SharingTab.HandleFeedback]: {
        // 表格列名
        columnKeys: [
            // 申请名称（编码）
            'name',
            // 申请部门
            'apply_org_name',
            // 反馈内容
            'feedback_content',
            // 反馈时间
            'feedback_at',
            // 操作
            'action',
        ],
        // 操作栏宽度
        actionWidth: 160,
        // 搜索筛选项
        filterKeys: ['keyword'],
        // 默认搜索条件
        initSearch: {
            limit: 10,
            offset: 1,
            sort: 'feedback_at',
            direction: 'desc',
            target: FeedbackTargetEnum.Process,
            feedback_status: FeedbackStatusEnum.PENDING,
        },
        // 默认表头排序 - 如果不传，则不支持表示不支持表头排序
        defaultTableSort: { feedback_at: 'desc' },
        // 表格默认滚动高度
        defaultScrollY: `calc(100vh - 291px)`,
        searchPlaceholder: __('搜索申请单名称'),
        // 左侧状态筛选
        statusOption: [
            { status: FeedbackStatusEnum.PENDING, label: __('待处理') },
            { status: FeedbackStatusEnum.FEEDBACKING, label: __('进行中') },
            { status: FeedbackStatusEnum.FINISHED, label: __('已完成') },
        ],
    },
    // 发起成效反馈
    [SharingTab.AuditFeedback]: {
        // 表格列名
        columnKeys: [
            // 申请名称（编码）
            'name',
            // 申请部门
            'apply_org_name',
            // 反馈内容
            'feedback_content',
            // 反馈时间
            'feedback_at',
            // 操作
            'action',
        ],
        // 操作栏宽度
        actionWidth: 160,
        // 搜索筛选项
        filterKeys: ['keyword'],
        // 默认搜索条件
        initSearch: {
            limit: 10,
            offset: 1,
            audit_type: ShareApplyAuditType.AFShareApplyFeedback,
        },
        // 表格默认滚动高度
        defaultScrollY: `calc(100vh - 291px)`,
        searchPlaceholder: __('搜索申请单名称'),
    },
}

/**
 * 共享菜单
 */
export const leftMenuItems: any[] = [
    {
        title: __('共享申请清单'),
        key: SharingTab.Apply,
        path: '/apply',
        children: '',
    },
    {
        title: __('分析完善'),
        key: SharingTab.AnalysisImprove,
        path: '/analysisImprove',
        children: '',
    },
    {
        title: __('分析结论确认'),
        key: SharingTab.AnalysisConfirm,
        path: '/analysisConfirm',
        children: '',
    },
    {
        title: __('数据资源实施'),
        key: SharingTab.ImplementData,
        path: '/implementData',
        children: '',
    },
    {
        title: __('实施方案确认'),
        key: SharingTab.ImplementPlan,
        path: '/implementPlan',
        children: '',
    },
    {
        title: __('实施结果确认'),
        key: SharingTab.ImplementResult,
        path: '/implementResult',
        children: '',
    },
    {
        title: __('申报待审核列表'),
        key: SharingTab.AuditDeclare,
        path: '/auditDeclare',
        children: '',
    },
    {
        title: __('分析结论待审核列表'),
        key: SharingTab.AuditAnalysis,
        path: '/auditAnalysis',
        children: '',
    },
    {
        title: __('数据提供方待审核列表'),
        key: SharingTab.AuditDataProvider,
        path: '/auditDataProvider',
        children: '',
    },
    {
        title: __('发起成效反馈'),
        key: SharingTab.StartFeedback,
        path: '/feedbackStart',
        children: '',
    },
    {
        title: __('处理成效反馈'),
        key: SharingTab.HandleFeedback,
        path: '/feedbackHandle',
        children: '',
    },
    {
        title: __('成效反馈审核'),
        key: SharingTab.AuditFeedback,
        path: '/feedbackAudit',
        children: '',
    },
]

/**
 * 资源提供方式
 * // TODO: 废弃，替换为ShareApplyResourceType
 */
export enum ApplyResource {
    // 库表
    Database = 'view',
    // 接口
    Interface = 'api',
}

/**
 * TODO: 废弃，按需替换为resTypeMap或者supplyTypeMap
 */
export const applyResourceMap = {
    [ApplyResource.Database]: {
        text: __('库表交换'),
    },
    [ApplyResource.Interface]: {
        text: __('接口对接'),
    },
}

// TODO: 废弃，按需替换为resTypeOptions或者supplyTypeOptions
export const applyResourceOptions = [
    {
        label: applyResourceMap[ApplyResource.Database].text,
        value: ApplyResource.Database,
    },
    {
        label: applyResourceMap[ApplyResource.Interface].text,
        value: ApplyResource.Interface,
    },
]

/**
 * 申请类型 - 库表交换
 */
export enum ApplyTypeDatabase {
    // 支撑本单位业务开展
    Support = 'support_business',
    // 支撑系统初始化建设
    SupportInit = 'support_system_initialization',
}

export const applyTypeDatabaseMap = {
    [ApplyTypeDatabase.Support]: {
        text: __('支撑本单位业务开展'),
    },
    [ApplyTypeDatabase.SupportInit]: {
        text: __('支撑系统初始化建设'),
    },
}

export const applyTypeDatabaseOptions = [
    {
        label: applyTypeDatabaseMap[ApplyTypeDatabase.Support].text,
        value: ApplyTypeDatabase.Support,
    },
    {
        label: applyTypeDatabaseMap[ApplyTypeDatabase.SupportInit].text,
        value: ApplyTypeDatabase.SupportInit,
    },
]

/**
 * 申请类型 - 接口对接
 */
export enum ApplyTypeInterface {
    // 完成平台与平台对接
    Platform = 'complete_integration',
    // 支撑本单位业务开展
    Support = 'support_business',
}

export const applyTypeInterfaceMap = {
    [ApplyTypeInterface.Platform]: {
        text: __('完成平台与平台对接'),
    },
    [ApplyTypeInterface.Support]: {
        text: __('支撑本单位业务开展'),
    },
}

export const applyTypeInterfaceOptions = [
    {
        label: applyTypeInterfaceMap[ApplyTypeInterface.Platform].text,
        value: ApplyTypeInterface.Platform,
    },
    {
        label: applyTypeInterfaceMap[ApplyTypeInterface.Support].text,
        value: ApplyTypeInterface.Support,
    },
]

/**
 * 数据范围
 */
export enum DataRange {
    // 全市
    CITY = '全市',
    // 市直
    DIRECTLY_CITY = '市直',
    // 区县
    COUNTY = '区县（市）',
}

export const dataRangeMap = {
    [DataRange.CITY]: '全市',
    [DataRange.DIRECTLY_CITY]: '市直',
    [DataRange.COUNTY]: '区县（市）',
}

export const dataRangeOptions = [
    { label: '全市', value: DataRange.CITY },
    { label: '市直', value: DataRange.DIRECTLY_CITY },
    { label: '区县（市）', value: DataRange.COUNTY },
]

/**
 * 更新频率
 */
export enum UpdateCycle {
    realTime = '实时',
    day = '每日',
    week = '每周',
    month = '每月',
    season = '每季度',
    halfYear = '每半年',
    everyYear = '每年',
    other = '其他',
}

export const updateCycleMap = {
    [UpdateCycle.realTime]: '实时',
    [UpdateCycle.day]: '每日',
    [UpdateCycle.week]: '每周',
    [UpdateCycle.month]: '每月',
    [UpdateCycle.season]: '每季度',
    [UpdateCycle.halfYear]: '每半年',
    [UpdateCycle.everyYear]: '每年',
    [UpdateCycle.other]: '其他',
}

export const updateCycleOptions = [
    {
        label: '实时',
        value: UpdateCycle.realTime,
    },
    {
        label: '每日',
        value: UpdateCycle.day,
    },
    {
        label: '每周',
        value: UpdateCycle.week,
    },
    {
        label: '每月',
        value: UpdateCycle.month,
    },
    {
        label: '每季度',
        value: UpdateCycle.season,
    },
    {
        label: '每半年',
        value: UpdateCycle.halfYear,
    },
    {
        label: '每年',
        value: UpdateCycle.everyYear,
    },
    {
        label: '其他',
        value: UpdateCycle.other,
    },
]

// 筛选项参数
export interface SearchFilterConfig {
    placeholder?: string
    // 要显示的筛选项
    filterKeys?: string[]
    customProps?: {
        // 自定义筛选项的属性
        [key: string]: any
    }
}

// 筛选项
export const recordSearchFilter = ({
    placeholder,
    filterKeys = [
        'keyword',
        'apply_org_code',
        'status',
        'source_type',
        'create_time',
        'finish_time',
        'anal_audit_time',
        'impl_time',
        'close_time',
    ],
    customProps = {},
}: SearchFilterConfig) => {
    // 定义所有可用的筛选项配置
    const allFilters = {
        keyword: {
            label: __('资源名称'),
            key: 'keyword',
            type: SearchTypeLayout.Input,
            isAlone: true,
            itemProps: {
                placeholder:
                    placeholder || __('搜索申请编码、申请名称、预期成效'),
            },
        },
        apply_org_code: {
            label: __('申请部门'),
            key: 'apply_org_code',
            type: SearchTypeLayout.DepartmentAndOrgSelect,
            itemProps: {
                allowClear: true,
                // unCategorizedObj: {
                //     id: '00000000-0000-0000-0000-000000000000',
                //     name: __('未分类'),
                // },
            },
        },
        status: {
            label: __('状态'),
            key: 'status',
            type: SearchTypeLayout.MultipleSelect,
            itemProps: {
                options: applyProcessOptions,
                fieldNames: { label: 'label', value: 'value' },
                showSearch: false,
            },
        },
        source_type: {
            label: __('资源类型'),
            key: 'res_type',
            type: SearchTypeLayout.MultipleSelect,
            itemProps: {
                options: resTypeOptions,
                fieldNames: { label: 'label', value: 'value' },
                showSearch: false,
            },
        },
        supply_type: {
            label: __('提供方式'),
            key: 'supply_type',
            type: SearchTypeLayout.MultipleSelect,
            itemProps: {
                options: supplyTypeOptions,
                fieldNames: { label: 'label', value: 'value' },
                showSearch: false,
            },
        },
        create_time: {
            label: __('申请时间'),
            key: 'create_time',
            type: SearchTypeLayout.RangePicker,
            itemProps: {
                format: 'YYYY-MM-DD',
            },
            startTime: 'create_begin_time',
            endTime: 'create_end_time',
        },
        finish_time: {
            label: __('期望完成时间'),
            key: 'finish_time',
            type: SearchTypeLayout.RangePicker,
            itemProps: {
                format: 'YYYY-MM-DD',
            },
            startTime: 'finish_begin_time',
            endTime: 'finish_end_time',
        },
        anal_audit_time: {
            label: __('数据提供方审核时间'),
            key: 'anal_audit_time',
            type: SearchTypeLayout.RangePicker,
            itemProps: {
                format: 'YYYY-MM-DD',
            },
            startTime: 'anal_audit_begin_time',
            endTime: 'anal_audit_end_time',
        },
        impl_time: {
            label: __('需求实施时间'),
            key: 'impl_time',
            type: SearchTypeLayout.RangePicker,
            itemProps: {
                format: 'YYYY-MM-DD',
            },
            startTime: 'impl_begin_time',
            endTime: 'impl_end_time',
        },
        close_time: {
            label: __('需求完结时间'),
            key: 'close_time',
            type: SearchTypeLayout.RangePicker,
            itemProps: {
                format: 'YYYY-MM-DD',
            },
            startTime: 'close_begin_time',
            endTime: 'close_end_time',
        },
    }

    // 根据传入的 filterKeys 筛选并合并自定义属性
    return filterKeys
        .map((key) => {
            const baseFilter = allFilters[key]
            if (!baseFilter) return null

            // 合并自定义属性
            if (customProps[key]) {
                return {
                    ...baseFilter,
                    itemProps: {
                        ...baseFilter.itemProps,
                        ...customProps[key],
                    },
                }
            }

            return baseFilter
        })
        .filter(Boolean)
}

export enum ConfigModeEnum {
    Table,
    Single,
    Multiple,
}

export enum ImplementGroupKeys {
    DATA_RESOURCE_INFO = 'data_resource_info',
    RESOURCE_USAGE_CONFIG = 'resource_usage_config',
    DATA_PUSH_CONFIG = 'data_push_config',
    PUSH_STRATEGY = 'push_strategy',
}
/**
 * 实施状态配置
 */
export const ImplementStatusConfig = [
    {
        label: __('数据资源信息'),
        key: ImplementGroupKeys.DATA_RESOURCE_INFO,
    },
    {
        label: __('资源使用配置'),
        key: ImplementGroupKeys.RESOURCE_USAGE_CONFIG,
    },
    {
        label: __('数据推送配置'),
        key: ImplementGroupKeys.DATA_PUSH_CONFIG,
    },
    {
        label: __('推送策略'),
        key: ImplementGroupKeys.PUSH_STRATEGY,
    },
]

export const ImplementGroupConfig = {
    [ImplementGroupKeys.DATA_RESOURCE_INFO]: [
        {
            label: __('数据资源名称：'),
            key: 'data_res_name',
            span: 12,
            value: '--',
        },
        {
            label: __('数据资源编码：'),
            key: 'data_res_code',
            span: 12,
            value: '--',
        },
        {
            label: __('所属目录：'),
            key: 'res_name',
            span: 12,
            value: '--',
        },
        {
            label: __('关联申请单：'),
            key: 'name',
            span: 12,
            value: '--',
        },
        {
            label: __('数据提供部门：'),
            key: 'org_path',
            span: 12,
            value: '--',
        },
        {
            label: __('申请部门：'),
            key: 'apply_org_path',
            span: 12,
            value: '--',
        },
        {
            label: __('申请人：'),
            key: 'applier',
            span: 12,
            value: '--',
        },
        {
            label: __('申请人联系方式：'),
            key: 'phone',
            span: 12,
            value: '--',
        },
        {
            label: __('分析人：'),
            key: 'analyst',
            span: 12,
            value: '--',
        },
        {
            label: __('分析人联系方式：'),
            key: 'analyst_phone',
            span: 12,
            value: '--',
        },
    ],
    [ImplementGroupKeys.RESOURCE_USAGE_CONFIG]: [
        {
            label: __('资源提供方式：'),
            key: 'supply_type',
            span: 12,
            value: __('库表交换'),
        },
        {
            label: __('期望空间范围：'),
            key: 'area_range',
            span: 12,
            value: '--',
        },
        {
            label: __('期望时间范围：'),
            key: 'time_range',
            span: 12,
            value: '--',
        },
        {
            label: __('期望推送频率：'),
            key: 'push_frequency',
            span: 12,
            value: '--',
        },
        {
            label: __('资源使用期限：'),
            key: 'available_date_type',
            span: 12,
            value: '--',
        },
    ],
}

export const ImplementDataPushConfig = [
    {
        label: __('源端信息'),
        key: 'source_info',
        configs: [
            {
                label: __('源数据源：'),
                key: 'datasource_name',
                span: 12,
                value: '--',
            },
            {
                label: __('源数据表：'),
                key: 'name',
                span: 12,
                value: '--',
            },
            {
                label: __('数据库类型：'),
                key: 'datasource_type',
                span: 12,
                value: '--',
            },
        ],
    },
    {
        label: __('目标端信息'),
        key: 'target_info',
        configs: [
            {
                label: __('目标数据源：'),
                key: 'datasource_name',
                span: 12,
                value: '--',
            },
            {
                label: __('目标数据表：'),
                key: 'name',
                span: 12,
                value: '--',
            },
            {
                label: __('数据库类型：'),
                key: 'datasource_type',
                span: 12,
                value: '--',
            },
        ],
    },
    {
        label: __('推送字段'),
        key: 'push_field',
    },
    {
        label: __('过滤规则'),
        key: 'filter_rule',
    },
]

export const ImplementDataPushStrategy = [
    {
        label: __('推送机制'),
        key: 'push_strategy',
    },
    {
        label: __('推送频率'),
        key: 'push_frequency',
    },
]

/**
 * 调度类型
 */
export enum ScheduleType {
    OneTime = 'once',
    Periodic = 'timely',
}

/**
 * 推送类型
 */
export enum TransmitMode {
    Incremental = 1,
    Full = 2,
}

/**
 * 推送机制
 */
export const pushMechanism = [
    {
        key: 'transmit_mode',
        label: __('推送类型'),
        value: '',
        span: 12,
    },
    {
        key: 'increment_field',
        label: __('增量字段'),
        value: '',
        hidden: (record) => record.transmit_mode === TransmitMode.Full,
        span: 12,
    },
    {
        key: 'primary_key',
        label: __('主键'),
        value: '',
        span: 12,
        hidden: (record) => record.transmit_mode === TransmitMode.Full,
    },
    {
        key: 'increment_timestamp',
        label: __('增量时间戳值'),
        value: '',
        span: 12,
    },
]

/**
 * 调度计划
 */
export const schedulePlan = [
    {
        key: 'schedule_type',
        label: __('调度类型'),
        value: '',
        span: 12,
    },
    {
        key: 'plan_date',
        label: __('计划日期'),
        value: '',
        span: 12,
        hidden: (record) => record?.schedule_type !== ScheduleType.Periodic,
    },
    {
        key: 'schedule_period',
        label: __('执行周期'),
        value: '',
        span: 12,
        hidden: (record) => record?.schedule_type !== ScheduleType.Periodic,
    },
    // TODO 是否需要?
    {
        key: 'plan_month',
        label: __('指定月份'),
        value: '',
        span: 12,
        hidden: (record) => record?.schedule_type !== ScheduleType.Periodic,
    },
    {
        key: 'plan_day',
        label: __('指定日期'),
        value: '',
        span: 12,
        hidden: (record) => record?.schedule_type !== ScheduleType.Periodic,
    },
    {
        key: 'plan_time',
        label: __('指定时间'),
        value: '',
        span: 12,
        hidden: (record) =>
            record?.schedule_type === ScheduleType.Periodic ||
            !!record?.schedule_execute_status,
    },
]

export enum ConfirmTableType {
    HAS_CONFIRM_TABLE = 'has_confirm_table',
    UNDO_CONFIRM_TABLE = 'undo_confirm_table',
}

/**
 * 无目标数据表推送表单 再推送的时候新建
 */
export const NoTargetPushForm = 'createNewTableToPushData'
