import {
    BusinessDomainLevelTypes,
    SortDirection,
    SortType,
    TaskType,
} from '@/core'
import { OperateType } from '@/utils'
import __ from './locale'
import { IformItem, SearchType } from '@/ui/LightweightSearch/const'

export const menus = [
    { key: SortType.NAME, label: __('按名称排序') },
    { key: SortType.CREATED, label: __('按创建时间排序') },
    { key: SortType.UPDATED, label: __('按更新时间排序') },
]

export const defaultMenu = {
    key: SortType.UPDATED,
    sort: SortDirection.DESC,
}

export enum ViewMode {
    Department = 'department',
    BArchitecture = 'business-architecture',
    InfoSystem = 'info-system',
}

// 业务模型详情+任务处理页面
export enum TabKey {
    ABSTRACT = 'abstract',
    PROCESS = 'process',
    FORM = 'form',
    STANDARD = 'standard',
    INDICATOR = 'biziIndicator',
    REPORT = 'report',
    TOBEEXECUTE = 'toBeExecute',
    COMPLETED = 'completed',
    DIAGNOSIS = 'diagnosis', // 诊断任务
    COMBED = 'combed', // 梳理任务
}
const enum CycleType {
    DAY = 'day',
    WEEK = 'week',
    MONTH = 'month',
    QUARTER = 'quarter',
    YEAR = 'year',
}

export const CycleKV = {
    [CycleType.DAY]: `${__('天')}`,
    [CycleType.WEEK]: `${__('周')}`,
    [CycleType.MONTH]: `${__('月度')}`,
    [CycleType.QUARTER]: `${__('季度')}`,
    [CycleType.YEAR]: `${__('年度')}`,
}

export const CycleList = [
    {
        value: CycleType.DAY,
        label: CycleKV[CycleType.DAY],
    },
    {
        value: CycleType.WEEK,
        label: CycleKV[CycleType.WEEK],
    },
    {
        value: CycleType.MONTH,
        label: CycleKV[CycleType.MONTH],
    },
    {
        value: CycleType.QUARTER,
        label: CycleKV[CycleType.QUARTER],
    },
    {
        value: CycleType.YEAR,
        label: CycleKV[CycleType.YEAR],
    },
]

export const tabList = [
    {
        key: TabKey.PROCESS,
        name: __('流程'),
    },
    {
        key: TabKey.FORM,
        name: __('表单'),
    },
    {
        key: TabKey.INDICATOR,
        name: __('指标'),
    },
    {
        key: TabKey.REPORT,
        name: __('业务诊断'),
    },
]

/**
 * 域类型
 */
export enum DomainType {
    business_domain = 'business_domain',
    subject_domian = 'subject_domian',
    business_object = 'business_object',
}

// (任务)相关场景操作集
export const totalOperates = [
    OperateType.CREATE,
    OperateType.EDIT,
    OperateType.DELETE,
    'brief',
]
export const products = [
    { operate: [OperateType.EDIT, 'brief'], task: 'none' },
    // {
    //     operate: [
    //         OperateType.CREATE,
    //         OperateType.EDIT,
    //         OperateType.DELETE,
    //         'brief',
    //     ],
    //     task: TaskType.NEWMAINBUSINESS,
    // },
]

/**
 * tab左上角业务/任务切换类型
 * @param DROPDOWN 下拉框
 * @param ARROW 箭头
 */
export const enum TabType {
    BUSINESS = 'business',
    TASK = 'task',
}

export const basicInfoFields = [
    {
        label: __('业务模型名称'),
        keys: ['name'],
    },
    {
        label: __('关联业务流程'),
        keys: ['business_domain_name'],
    },
    {
        label: __('描述'),
        keys: ['description'],
    },
    {
        label: __('更新人/时间'),
        keys: ['updated_by', 'updated_at'],
    },
]

export const searchData: IformItem[] = [
    {
        label: __('对象'),
        key: 'is_all',
        options: [
            {
                label: __('查看全部对象（包含子部门）'),
                value: true,
            },
            {
                label: __('仅查看当前部门的对象'),
                value: false,
            },
        ],
        type: SearchType.Radio,
        initLabel: __('查看全部对象'),
    },
]

export const UNGROUPED = 'ungrouped'

// 业务域类型
export const LevelType = {
    [BusinessDomainLevelTypes.DomainGrouping]: __('业务领域分组'),
    [BusinessDomainLevelTypes.Domain]: __('业务领域'),
    [BusinessDomainLevelTypes.Process]: __('主干业务'),
}

// 运算函数
export enum OperatingKey {
    // 计数
    COUNT = 'COUNT',

    // 去重
    DISTINCT = 'DISTINCT',

    // 或
    OR = 'OR',

    // 且
    AND = 'AND',

    // 乘
    MUL = 'MUL',

    // 除
    DIV = 'DIV',
}

/**
 * 运算函数列表
 */
export const operatingKeyList = [
    {
        label: __('计数'),
        value: OperatingKey.COUNT,
    },
    {
        label: __('去重'),
        value: OperatingKey.DISTINCT,
    },
    {
        label: __('或'),
        value: OperatingKey.OR,
    },
    {
        label: __('且'),
        value: OperatingKey.AND,
    },
    {
        label: __('乘'),
        value: OperatingKey.MUL,
    },
    {
        label: __('除'),
        value: OperatingKey.DIV,
    },
]
