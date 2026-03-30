import __ from '../locale'

/**
 * 需求详情tab类型
 * @parmas {BaseInfo} 基本信息
 * @parmas {DemandAnalysis} 需求分析
 * @parmas {DemandImplement} 需求实施
 */
export enum DetailType {
    BaseInfo = 'baseinfo',
    DemandAnalysis = 'demand-analysis',
    DemandImplement = 'demand-implement',
}

/**
 * 需求进展
 * @parmas {Application} 需求申请
 * @parmas {Analysis} 需求分析
 * @parmas {Implement} 需求实施
 * @parmas {Acceptance} 需求验收
 */
export enum DemandProgress {
    Application = 'application',
    Analysis = 'analysis',
    Implement = 'implement',
    Acceptance = 'acceptance',
}

export const DemandDetailsProgress = [
    {
        key: DemandProgress.Application,
        label: __('需求申请'),
    },
    {
        key: DemandProgress.Analysis,
        label: __('需求分析'),
    },
    {
        key: DemandProgress.Implement,
        label: __('需求实施'),
    },
    {
        key: DemandProgress.Acceptance,
        label: __('需求验收'),
    },
]

export enum DemandFieldType {
    TIME = 'time',
    FILE = 'file',
    CHECK = 'checkbox',
}

// 需求详情-需求信息展示的字段
export const DemandInfoFields = [
    {
        label: '需求名称：',
        value: 'title',
    },
    {
        label: '需求编码：',
        value: 'code',
    },
    // {
    //     label: '需求类型：',
    //     value: 'dmd_type',
    // },
    {
        label: '需求描述：',
        value: 'description',
        col: 24,
    },
    {
        label: '期望完成日期：',
        value: 'finish_date',
        type: DemandFieldType.TIME,
    },
    {
        label: '附件：',
        value: 'attachment_name',
        type: DemandFieldType.FILE,
    },
]

export const AnalyserInfoFields = [
    {
        label: '分析处理人：',
        value: 'analyser_name',
    },
    {
        label: '联系方式：',
        value: 'analyser_phone',
    },
]
export const ImplementConclusionFields = [
    {
        label: __('反馈内容：'),
        value: 'content',
    },
]

export const ViewConfigFields = [
    {
        label: __('数据资源目录：'),
        value: 'res_name',
    },
    {
        label: __('申请理由：'),
        value: 'apply_reason',
    },
    {
        label: __('访问者权限：'),
        value: 'authority',
        type: DemandFieldType.CHECK,
    },
]

export const DemandActionType = {
    demand_create: '提交需求',
    analysis_signoff: '分析签收',
    analysis: '分析',
    analysis_confirm: '分析确认',
    analysis_confirm_audit: '分析结论审核',
    implement_signoff: '实施签收',
    implement: '实施',
    implement_accept: '实施验收',
    demand_cancel: '需求撤销',
    demand_close: '需求关闭',
}

/**
 * 资源类型
 * @param Logicview 库表（即库表）
 */
export enum ResourceType {
    Logicview = 'logicview',
}

export const ResourceNameMap = {
    [ResourceType.Logicview]: __('库表'),
}

export enum Authority {
    Read = 'read',
    Download = 'download',
}

export const AuthorityNameMap = {
    [Authority.Read]: __('读取'),
    [Authority.Download]: __('下载'),
}

/**
 * 需求可行性
 * @param Feasible 可行
 * @param Unfeasible 不可行
 */

export enum DemandFeasibility {
    Feasible = 'feasible',
    Unfeasible = 'unfeasible',
}

export const DemandFeasibilityNameMap = {
    [DemandFeasibility.Feasible]: __('可行'),
    [DemandFeasibility.Unfeasible]: __('不可行'),
}
