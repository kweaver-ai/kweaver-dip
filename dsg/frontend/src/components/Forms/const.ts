import { SortDirection, TaskType, TaskStatus } from '@/core'
import { OperateType } from '@/utils'
import __ from './locale'

/**
 * 表单类型
 */
export enum FormType {
    ORIGINAL = 1,
    STANDARD = 2,
    FUSION = 3,
}

export const formTypeArr = [
    { key: 0, value: '' },
    { key: FormType.ORIGINAL, value: __('原始表') },
    { key: FormType.STANDARD, value: __('业务表') },
    { key: FormType.FUSION, value: __('融合表') },
]

export enum NewFormType {
    BLANK = 'normal',
    DSIMPORT = 'fromDs',

    // 数据原始表
    DATA_ORIGIN = 'data_origin',

    // 数据标准表
    DATA_STANDARD = 'data_standard',

    // 数据据融合表
    DATA_FUSION = 'data_fusion',
}

/**
 * 排序方式
 */
export enum SortType {
    CREATED = 'created_at',
    UPDATED = 'updated_at',
}

/**
 * 排序菜单 原始/融合
 */
export const menus = [{ key: SortType.CREATED, label: __('按创建时间') }]
/**
 * 排序菜单 标准
 */
export const menusStd = [
    { key: SortType.CREATED, label: __('按创建时间排序') },
    { key: SortType.UPDATED, label: __('按更新时间排序') },
]

/**
 * 默认排序表单
 */
export const defaultMenu = {
    key: SortType.UPDATED,
    sort: SortDirection.DESC,
}

/**
 * 详情配置
 */
export interface IDetailConfig {
    label: string
    name: string
    col?: number
}

/**
 * 原始表基本信息配置
 */
export const orBasicConfig: (IDetailConfig | IDetailConfig[])[] = [
    {
        label: `${__('业务表单名称')}${__('：')}`,
        name: 'name',
        col: 24,
    },
    {
        label: `${__('描述')}${__('：')}`,
        name: 'description',
        col: 24,
    },
    [
        {
            label: `${__('创建人')}${__('：')}`,
            name: 'created_by',
            col: 12,
        },
        {
            label: `${__('创建时间')}${__('：')}`,
            name: 'created_at',
            col: 12,
        },
    ],
]

/**
 * 业务表基本信息配置
 */
export const stBasicConfig: (IDetailConfig | IDetailConfig[])[] = [
    {
        label: `${__('业务表单名称')}${__('：')}`,
        name: 'name',
        col: 24,
    },
    {
        label: `${__('描述')}${__('：')}`,
        name: 'description',
        col: 24,
    },
    [
        {
            label: `${__('创建人')}${__('：')}`,
            name: 'created_by',
            col: 12,
        },
        {
            label: `${__('创建时间')}${__('：')}`,
            name: 'created_at',
            col: 12,
        },
    ],
    [
        {
            label: `${__('更新人')}${__('：')}`,
            name: 'updated_by',
            col: 12,
        },
        {
            label: `${__('更新时间')}${__('：')}`,
            name: 'updated_at',
            col: 12,
        },
    ],
]

/**
 * 原始表基本信息配置
 */
export const orDetailConfig: (IDetailConfig | IDetailConfig[])[] = [
    [
        {
            label: `${__('参考标准')}${__('：')}`,
            name: 'guideline',
            col: 12,
        },
        {
            label: `${__('数据范围')}${__('：')}`,
            name: 'data_range',
            col: 12,
        },
    ],
    {
        label: `${__('资源标签')}${__('：')}`,
        name: 'resource_tag',
        col: 24,
    },
    {
        label: `${__('来源系统')}${__('：')}`,
        name: 'source_system',
        col: 24,
    },
    [
        {
            label: `${__('更新周期')}${__('：')}`,
            name: 'update_cycle',
            col: 12,
        },
        {
            label: `${__('来源业务场景')}${__('：')}`,
            name: 'source_business_scene',
            col: 12,
        },
    ],
    {
        label: `${__('关联业务场景')}${__('：')}`,
        name: 'related_business_scene',
        col: 24,
    },
]

/**
 * 业务表基本信息配置
 */
export const stDetailConfig: (IDetailConfig | IDetailConfig[])[] = [
    {
        label: `${__('流程图/节点名称')}${__('：')}`,
        name: 'flowcharts',
        col: 24,
    },
    [
        {
            label: `${__('参考标准')}${__('：')}`,
            name: 'guideline',
            col: 12,
        },
        {
            label: `${__('数据范围')}${__('：')}`,
            name: 'data_range',
            col: 12,
        },
    ],
    {
        label: `${__('资源标签')}${__('：')}`,
        name: 'resource_tag',
        col: 24,
    },
    {
        label: `${__('来源系统')}${__('：')}`,
        name: 'source_system',
        col: 24,
    },
    [
        {
            label: `${__('更新周期')}${__('：')}`,
            name: 'update_cycle',
            col: 12,
        },
        {
            label: `${__('来源业务场景')}${__('：')}`,
            name: 'source_business_scene',
            col: 12,
        },
    ],
    {
        label: `${__('关联业务场景')}${__('：')}`,
        name: 'related_business_scene',
        col: 24,
    },
]

/**
 * 融合表基本信息配置
 */
export const fusionBasicConfig: (IDetailConfig | IDetailConfig[])[] = [
    [
        {
            label: `${__('融合表名称')}${__('：')}`,
            name: 'name',
            col: 12,
        },
        {
            label: `${__('业务表名称')}${__('：')}`,
            name: 'standard_form_name',
            col: 12,
        },
    ],
    {
        label: `${__('总体规则备注')}${__('：')}`,
        name: 'overall_rule_remark',
        col: 24,
    },
    [
        {
            label: `${__('总体优先规则')}${__('：')}`,
            name: 'overall_priority_rule',
            col: 12,
        },
        {
            label: `${__('融合字段')}${__('：')}`,
            name: 'fusion_field',
            col: 12,
        },
    ],
    [
        {
            label: `${__('字段值域')}${__('：')}`,
            name: 'field_range',
            col: 12,
        },
        {
            label: `${__('创建人/时间')}${__('：')}`,
            name: 'created_by_at',
            col: 12,
        },
    ],
]

/**
 * 导入表单重名操作类型
 * @param RETAIN 保留
 * @param COVER 覆盖
 * @param CANCEL 取消
 */
export enum RepeatOperate {
    RETAIN = 'retain',
    COVER = 'cover',
    CANCEL = 'cancel',
}

/**
 * 标准化状态
 */
export enum StandardStatus {
    // 未标准化
    NONE = '',
    // 已标准化
    NORMAL = 'normal',
    MODIFIED = 'modified',
    // 标准创建中-已新建标准任务
    CREATING = 'creating',
    DELETED = 'deleted',

    // 待新建标准
    READYCREATE = 'ready_create',
}

/**
 * 标准化状态信息
 */
export const standardStatusInfos = [
    {
        value: StandardStatus.NONE,
        label: __('未标准化'),
        color: 'rgba(0, 0, 0, 0.85)',
        bgColor: 'rgba(0, 0, 0, 0.04)',
    },
    {
        value: StandardStatus.READYCREATE,
        label: __('未标准化'),
        color: '',
        bgColor: '',
    },
    {
        value: StandardStatus.CREATING,
        label: __('标准创建中'),
        color: 'rgba(133, 74, 192, 0.85)',
        bgColor: 'rgba(133, 74, 192, 0.06)',
    },
    {
        value: StandardStatus.NORMAL,
        label: __('已标准化'),
        color: 'rgba(18, 110, 227, 1)',
        bgColor: 'rgba(18, 110, 227, 0.06)',
    },
    {
        value: StandardStatus.MODIFIED,
        label: __('标准已修改'),
        color: 'rgba(250, 172, 20, 1)',
        bgColor: 'rgba(250, 172, 20, 0.06)',
    },
    {
        value: StandardStatus.DELETED,
        label: __('标准已删除'),
        color: 'rgba(230, 0, 18, 1)',
        bgColor: 'rgba(230, 0, 18, 0.06)',
    },
]

// 是否已经标准化
// export enum StdStatus {
//     // 未标准化
//     NotStandardized = '',
//     // 已标准化
//     Standardized = 'normal',
// }

// 待新建标准状态
export enum ToBeCreStdStatus {
    // 待发起
    WAITING = 'waiting',
    // 进行中
    CREATING = 'creating',
    // 已完成未采纳
    CREATED = 'created',
    // 已采纳
    ADOPTED = 'adopted',
    // 不在新建标准列表中（业务梳理返回
    OUTSIDE = 'outside',
}

// 待新建标准状态
export enum ToBeCreStdStatusValue {
    // 待发起
    WAITING = 0,
    // 进行中
    CREATING = 1,
    // 已完成未采纳
    CREATED = 2,
    // 已采纳
    ADOPTED = 3,
    // 不在新建标准列表中（业务梳理返回
    OUTSIDE = 4,
}

/**
 * 字段来源
 */
export enum FieldSource {
    ORIGINAL = 'original',
    RECOMMEND = 'recommend',
    SEARCH = 'search',
}

/**
 * 字段来源文本
 */
export const fieldSourceText = {
    [FieldSource.ORIGINAL]: __('原字段'),
    [FieldSource.RECOMMEND]: __('智能推荐'),
    [FieldSource.SEARCH]: __('搜索结果'),
}

export const numberText = ['number', 'decimal']
export const stringText = 'char'
export const numberTypeArr = [...numberText]
export const numberAndStringTypeArr = [...numberText, stringText]

// 周期
export enum Cycles {
    // 不定期
    Irregularly = 'nonschedule',

    // 实时
    ActualTime = 'realtime',

    // 每日
    Everyday = 'daily',

    // 每周
    Weekly = 'weekly',

    // 每月
    Monthly = 'monthly',

    // 每季度
    Quarterly = 'quarterly',

    // 每半年
    Semiannually = 'semiannually',

    // 每年
    Annually = 'yearly',

    // 其他
    Other = 'other',
}

// 数据范围
export enum DataRange {
    // 全市
    CityWide = 'whole_city',

    // 市直
    City = 'city_jurisdiction_area',

    // 区县
    County = 'county',
}

export const CyclesOptions = [
    {
        label: __('不定期'),
        value: Cycles.Irregularly,
    },
    {
        label: __('实时'),
        value: Cycles.ActualTime,
    },
    {
        label: __('每日'),
        value: Cycles.Everyday,
    },
    {
        label: __('每周'),
        value: Cycles.Weekly,
    },
    {
        label: __('每月'),
        value: Cycles.Monthly,
    },
    {
        label: __('每季度'),
        value: Cycles.Quarterly,
    },
    {
        label: __('每半年'),
        value: Cycles.Semiannually,
    },
    {
        label: __('每年'),
        value: Cycles.Annually,
    },
    {
        label: __('其他'),
        value: Cycles.Other,
    },
]

export const DataRangeOptions = [
    {
        label: __('全市'),
        value: DataRange.CityWide,
    },
    {
        label: __('市直'),
        value: DataRange.City,
    },
    {
        label: __('区县'),
        value: DataRange.County,
    },
]

/**
 * 导入表单重名操作类型
 * @param AWAITSTART 待发起
 * @param DOING 进行中
 * @param AWAITCONFIRM 待确认
 * @param DONE 已完成
 */
export enum TabKey {
    AWAITSTART = 'await_start',
    DOING = 'doing',
    // AWAITCONFIRM = 'await_confirm',
    DONE = 'done',
}

export const TabKeyValue = {
    [TabKey.AWAITSTART]: [ToBeCreStdStatusValue.WAITING],
    [TabKey.DOING]: [ToBeCreStdStatusValue.CREATING],
    [TabKey.DONE]: [
        ToBeCreStdStatusValue.CREATED,
        ToBeCreStdStatusValue.ADOPTED,
    ],
}

export const tabList = [
    {
        key: TabKey.AWAITSTART,
        label: __('待发起'),
        // value: TabKeyValue[TabKey.AWAITSTART],
    },
    {
        key: TabKey.DOING,
        label: __('进行中'),
        // value: TabKeyValue[TabKey.DOING],
    },
    {
        key: TabKey.DONE,
        label: __('已完成'),
        // value: TabKeyValue[TabKey.DONE],
    },
]

// 待新建标准操作
export enum NewStdOperate {
    // 移除
    DELETE = 'delete',
    // 撤销
    REMOVE = 'remove',
}

// (任务)相关场景操作集
export const totalOperates = [
    'create',
    'edit',
    'standard',
    'f_dataCollecting',
    'f_dataProcessing',
    'export',
    'detail',
    'createTask',
    'del',
    'newStandard',
    'dataCollectingModel',
    'dataProcessingModel',
]
export const products = [
    {
        operate: [
            'create',
            'edit',
            'standard',
            'export',
            'detail',
            'createTask',
            'del',
            'newStandard',
        ],
        task: 'none',
    },
    {
        operate: [
            'create',
            'edit',
            'export',
            'detail',
            'del',
            'standard',
            'newStandard',
        ],
        task: TaskType.MODEL,
    },
    {
        operate: ['f_dataCollecting', 'dataCollectingModel'],
        task: TaskType.DATACOLLECTING,
    },
    {
        operate: ['f_dataProcessing', 'dataProcessingModel'],
        task: TaskType.DATAPROCESSING,
    },
    {
        operate: ['create', 'edit', 'detail', 'del', 'standard'],
        task: TaskType.DATAMODELING,
    },
]
// data_kind: 基础信息分类 1 人 2 地 4 事 8 物 16 组织 32 其他 可组合，如 人和地 即 1|2 = 3
export enum dataKind {
    person = 'human',
    land = 'land',
    matter = 'event',
    thing = 'object',
    org = 'org',
    other = 'other',
}

export const dataKindOptions = [
    {
        label: '人',
        value: dataKind.person,
        disabled: false,
    },
    {
        label: '地',
        value: dataKind.land,
        disabled: false,
    },
    {
        label: '事',
        value: dataKind.matter,
        disabled: false,
    },
    {
        label: '物',
        value: dataKind.thing,
        disabled: false,
    },
    {
        label: '组织',
        value: dataKind.org,
        disabled: false,
    },
    {
        label: '其他',
        value: dataKind.other,
        disabled: false,
    },
]

export const dataKindOptionsOfTC = [
    {
        label: '人',
        value: dataKind.person,
        disabled: false,
    },
    {
        label: '事',
        value: dataKind.matter,
        disabled: false,
    },
    {
        label: '物',
        value: dataKind.thing,
        disabled: false,
    },
]

export interface IInfoSystem {
    id: string
    name: string
}

export enum ImportMode {
    SINGLE = 'single',
    MULTIPLE = 'multiple',
}

// 字段关联任务状态
export enum FiledTaskStatus {
    // 未开始
    READY = 0,
    // 进行中
    ONGOING = 1,
}

export const fieldTaskStatusList = {
    [FiledTaskStatus.READY]: TaskStatus.READY,
    [FiledTaskStatus.ONGOING]: TaskStatus.ONGOING,
}

// 业务表单类型
export enum FormTableKind {
    // 业务表单
    BUSINESS = 'business',
    // 标准表单
    STANDARD = 'standard',

    // 数据原始表
    DATA_ORIGIN = 'data_origin',

    // 数据标准表
    DATA_STANDARD = 'data_standard',

    // 数据据融合表
    DATA_FUSION = 'data_fusion',
}

// 业务表单类型选项
export const FormTableKindOptions = [
    {
        label: __('业务节点表'),
        value: FormTableKind.BUSINESS,
    },
    {
        label: __('业务标准表'),
        value: FormTableKind.STANDARD,
    },
    {
        label: __('数据原始表'),
        value: FormTableKind.DATA_ORIGIN,
    },
    {
        label: __('数据标准表'),
        value: FormTableKind.DATA_STANDARD,
    },
    {
        label: __('数据融合表'),
        value: FormTableKind.DATA_FUSION,
    },
]

/**
 * 将数组转换为antd的options格式
 * @param list 数组
 * @returns
 */
export const changeToOptions = (list: Array<any>) => {
    return list.map((item) => ({
        label: item.value,
        value: item.value_en,
    }))
}
