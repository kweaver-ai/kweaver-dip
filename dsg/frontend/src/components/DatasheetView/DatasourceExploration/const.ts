import { uniqBy } from 'lodash'
import __ from './locale'
import {
    SortDirection,
    SortType,
    createExploreRule,
    getExploreRuleDetails,
    editExploreRule,
    exploreRuleRepeat,
    createTemplateRule,
    getTemplateRuleDetails,
    templateRuleRepeat,
    editTemplateRule,
    getExploreRuleList,
} from '@/core'

export enum ExplorationType {
    Datasource = 'datasource',
    FormView = 'formView',
}
export enum explorationContentType {
    Quality = 'explore_data',
    Timestamp = 'explore_timestamp',
    Classification = 'explore_classification',
}
export enum strategyType {
    All = 'all',
    Change = 'not_explored',
    IsConfig = 'rules_configured',
}
export enum OperateType {
    Detail = 'detail',
    Del = 'del',
    Cancel = 'cancel',
    Failed = 'failed',
    ReStart = 'reStart',
}
export enum dataTypeMap {
    // int  float decimal
    // number = 'int',
    int = 'int',
    float = 'float',
    decimal = 'decimal',
    char = 'char',
    date = 'date',
    datetime = 'datetime',
    timestamp = 'timestamp',
    time = 'time',
    bool = 'bool',
}
export const numberType: string[] = [
    dataTypeMap.int,
    dataTypeMap.decimal,
    dataTypeMap.float,
]
export interface IDetailsData {
    total_count: number
    details: any
    description: string
}

export const defaultMenu = {
    key: SortType.CREATED,
    sort: SortDirection.DESC,
}

export const menus = [{ key: SortType.CREATED, label: __('按创建时间排序') }]
export enum explorationTaskStatus {
    Queuing = 'queuing',
    Running = 'running',
    Finished = 'finished',
    Canceled = 'canceled',
    Failed = 'failed',
}
export const explorationTaskStatusList = [
    {
        label: __('等待中'),
        value: explorationTaskStatus.Queuing,
        bgColor: '#1890FF',
    },
    {
        label: __('进行中'),
        value: explorationTaskStatus.Running,
        bgColor: '#1890FF',
    },
    {
        label: __('已完成'),
        value: explorationTaskStatus.Finished,
        bgColor: '#52C41B',
    },
    {
        label: __('已取消'),
        value: explorationTaskStatus.Canceled,
        bgColor: '#FAAD14',
    },
    {
        label: __('异常'),
        value: explorationTaskStatus.Failed,
        bgColor: '#E60012',
    },
]
export const explorationStrategyRadio = [
    {
        value: strategyType.All,
        label: __('对全部库表进行探查'),
        tips: __(
            '探查数据源中所有库表，未配置规则的采用数据源探查规则，已配置规则的采用库表的探查规则。',
        ),
        key: 'view_count',
    },
    {
        value: strategyType.Change,
        label: __('对未探查过的库表进行探查'),
        tips: __(
            '覆盖扫描数据源中未完全探查的库表，以及数据源中新增的库表，未完全探查的库表按已配置的规则探查，新增的库表按数据源的探查规则探查。',
        ),
        key: 'not_explored_data_count',
    },
    {
        value: strategyType.IsConfig,
        label: __('对已配置规则的库表进行探查'),
        tips: __('批量更新探查数据源中单独配置探查规则的库表。'),
        key: 'configured_view_count',
    },
]
export enum samplingRuleConfigType {
    All = 'all',
    Random = 'random',
}
export const samplingRuleConfigRadio = [
    {
        value: samplingRuleConfigType.All,
        label: __('全量数据'),
    },
    {
        value: samplingRuleConfigType.Random,
        label: __('随机抽样数据'),
    },
]

export const ruleTables = [
    {
        name: __('字符型'),
        field_type: 1,
        technical_name: '1',
    },
    {
        name: __('日期型'),
        field_type: 3,
        technical_name: '3',
    },
    {
        name: __('数字型'),
        field_type: 0,
        technical_name: '0',
    },
    {
        name: __('布尔型'),
        field_type: 5,
        technical_name: '5',
    },
]

export const viewCardList = [
    {
        key: 'view_count',
        title: __('库表总数'),
        value: 0,
    },
    {
        key: 'published_view_count',
        title: __('已发布库表'),
        value: 0,
    },
    {
        key: 'unpublished_view_count',
        title: __('未发布库表'),
        value: 0,
    },
]

export const viewContentCardList = [
    // {
    //     key: 'explored_data_view_count',
    //     title: __('数据质量探查'),
    //     value: 0,
    //     percent: 0,
    //     color: '#59A3FF',
    // },
    {
        key: 'explored_timestamp_view_count',
        title: __('业务时间戳'),
        value: 0,
        percent: 0,
        color: '#14CEAA',
    },
    {
        key: 'explored_classification_view_count',
        title: __('数据分类分级'),
        subTitle: __('数据分类'),
        value: 0,
        percent: 0,
        color: '#FF822F',
    },
]

export const viewStatisticsList = [
    {
        key: 'associated_standard_field_count',
        title: __('已关联数据标准字段数'),
        labelList: [
            {
                key: 'sum',
                label: __('已关联数据标准：'),
                color: '#59A3FF',
                value: 0,
            },
            {
                key: 'total',
                label: __('字段总数：'),
                color: '#F0F0F0',
                value: 0,
            },
        ],
        value: 0,
        color: '#59A3FF',
    },
    {
        key: 'associated_code_field_count',
        title: __('已关联码表字段数'),
        labelList: [
            {
                key: 'sum',
                label: __('已关联码表：'),
                color: '#52C41B',
                value: 0,
            },
            {
                key: 'total',
                label: __('字段总数：'),
                color: '#F0F0F0',
                value: 0,
            },
        ],
        value: 0,
        color: '#52C41B',
    },
]

export const explorationTaskDetails = [
    {
        key: 'name',
        label: __('探查对象'),
        span: 24,
        value: '',
    },
    {
        key: 'type',
        label: __('探查内容'),
        span: 24,
        value: '',
    },
    {
        key: 'status',
        label: __('任务状态'),
        span: 24,
        value: '',
    },
    {
        key: 'created_by',
        label: __('发起人'),
        span: 24,
        value: '',
    },
    {
        key: 'datasource_name',
        label: __('所属数据源'),
        span: 24,
        value: '',
    },
    {
        key: 'created_at',
        label: __('创建时间'),
        span: 24,
        value: '',
    },
    {
        key: 'time',
        label: __('探查时长'),
        span: 24,
        value: '',
    },
    {
        key: 'finished_at',
        label: __('结束时间'),
        span: 24,
        value: '',
    },
]
export enum ExplorationPeculiarity {
    All = 'all',
    Completeness = 'completeness',
    Accuracy = 'accuracy',
    Normative = 'standardization',
    Uniqueness = 'uniqueness',
    DataStatistics = 'data_statistics',
    Timeliness = 'timeliness',
    Consistency = 'consistency',
    Validity = 'validity',
}

export const explorationPeculiarityList = [
    { label: __('全部'), key: ExplorationPeculiarity.All },
    { label: __('完整性'), key: ExplorationPeculiarity.Completeness },
    { label: __('唯一性'), key: ExplorationPeculiarity.Uniqueness },
    { label: __('规范性'), key: ExplorationPeculiarity.Normative },
    { label: __('准确性'), key: ExplorationPeculiarity.Accuracy },
    { label: __('数据统计'), key: ExplorationPeculiarity.DataStatistics },
    { label: __('及时性'), key: ExplorationPeculiarity.Timeliness },
]
export enum ExplorationRule {
    Metadata = 'metadata',
    Field = 'field',
    Row = 'row',
    DataView = 'view',
}
export const ExplorationRuleTabs = [
    { label: __('库表元数据级'), key: ExplorationRule.Metadata, children: '' },
    { label: __('库表数据级'), key: ExplorationRule.DataView, children: '' },
    { label: __('行级'), key: ExplorationRule.Row, children: '' },
    { label: __('字段级'), key: ExplorationRule.Field, children: '' },
]
export enum RuleExpression {
    Field = 'field',
    Sql = 'sql',
}
export const RowNullRuleList = [
    {
        label: __('NULL（适用于所有类型的规则字段）'),
        value: 'NULL',
        applicableTypes: ['all'],
    },
    {
        label: __('0值检查（适用于“数字型”规则字段）'),
        value: '0',
        applicableTypes: numberType,
    },
    {
        label: __('空字符串检查（适用于“字符型”规则字段）'),
        value: ' ',
        applicableTypes: [dataTypeMap.char],
    },
]
export enum TimelinessRule {
    Day = 'day',
    Week = 'week',
    Month = 'month',
    Quarter = 'quarter',
    HalfYear = 'half_a_year',
    Year = 'year',
}
export const TimelinessRuleList = [
    { label: __('每天'), value: TimelinessRule.Day },
    { label: __('每周'), value: TimelinessRule.Week },
    { label: __('每月'), value: TimelinessRule.Month },
    { label: __('每季度'), value: TimelinessRule.Quarter },
    { label: __('每半年'), value: TimelinessRule.HalfYear },
    { label: __('每年'), value: TimelinessRule.Year },
]
export const datasourceExploreFieldTypeList = [
    {
        business_name: __('数字型'),
        data_type: dataTypeMap.int,
        id: dataTypeMap.int,
    },
    {
        business_name: __('字符型'),
        data_type: dataTypeMap.char,
        id: dataTypeMap.char,
    },
    {
        business_name: __('日期型'),
        data_type: dataTypeMap.date,
        id: dataTypeMap.date,
    },
    {
        business_name: __('日期时间型'),
        data_type: dataTypeMap.datetime,
        id: dataTypeMap.datetime,
    },
    {
        business_name: __('时间型'),
        data_type: dataTypeMap.time,
        id: dataTypeMap.time,
    },
    {
        business_name: __('布尔型'),
        data_type: dataTypeMap.bool,
        id: dataTypeMap.bool,
    },
]
export enum InternalRuleType {
    Null = 'cf0b5b51-79f1-4cb3-8f0c-be0c3ad25e55',
    Reg = '0e75ad19-a39b-4e41-b8f1-e3cee8880182',
    Repeat = '6d8d7fdc-8cc4-4e89-a5dd-9b8d07a685dc',
    Code = 'fcbad175-862e-4d24-882c-c6dd96d9f4f2',
    Standard = 'standard',
    RowRepeat = '401f8069-21e5-4dd0-bfa8-432f2635f46c',
    RowNull = '442f627c-b9bd-43f6-a3b1-b048525276a2',
    Custom = 'custom',
    timeliness = 'f7447b7a-13a6-4190-9d0d-623af08bedea',
}
export const InternalRuleTemplateMap = {
    [InternalRuleType.RowNull]: 'row_null',
    [InternalRuleType.RowRepeat]: 'row_repeat',
    [InternalRuleType.Null]: 'null',
    [InternalRuleType.Code]: 'dict',
    [InternalRuleType.Repeat]: 'repeat',
    [InternalRuleType.Reg]: 'format',
    [InternalRuleType.Custom]: 'custom',
}

export const InternalRuleTemplateTypeToIdMap = {
    null: InternalRuleType.Null,
    reg: InternalRuleType.Reg,
    code: InternalRuleType.Code,
    standard: InternalRuleType.Standard,
    rowRepeat: InternalRuleType.RowRepeat,
    rowNull: InternalRuleType.RowNull,
    timeliness: InternalRuleType.timeliness,
    custom: InternalRuleType.Custom,
}
export const InternalTemplateIdList = [
    '6d8d7fdc-8cc4-4e89-a5dd-9b8d07a685dc',
    '4662a178-140f-4869-88eb-57f789baf1d3',
    '931bf4e4-914e-4bff-af0c-ca57b63d1619',
    'c2c65844-5573-4306-92d7-d3f9ac2edbf6',
    '0c790158-9721-41ce-b8b3-b90341575485',
    '73271129-2ae3-47aa-83c5-6c0bf002140c',
    '91920b32-b884-4d23-a649-0518b038bf3b',
    'fd9fa13a-40db-4283-9c04-bf0ff3edcb32',
    '06ad1362-9545-415d-9278-265e3abe7c10',
    '96ac5dc0-2e5c-4397-87a7-8414dddf8179',
    '95e5b917-6313-4bd0-8812-bf0d4aa68d73',
    '69c3d959-1c72-422b-959d-7135f52e4f9c',
    '709fca1a-4640-4cd7-94ed-50b1b16e0aa5',
    'ae0f6573-b3e0-4be2-8330-a643261f8a18',
    '45a4b3cb-b93c-469d-b3b4-631a3b8db5fe',
]
export const DataTypeRuleMap = {
    [dataTypeMap.int]: [
        InternalRuleType.Null,
        InternalRuleType.Code,
        InternalRuleType.Repeat,
        InternalRuleType.Reg,
    ],
    [dataTypeMap.float]: [
        InternalRuleType.Null,
        InternalRuleType.Code,
        InternalRuleType.Repeat,
        InternalRuleType.Reg,
    ],
    [dataTypeMap.decimal]: [
        InternalRuleType.Null,
        InternalRuleType.Code,
        InternalRuleType.Repeat,
        InternalRuleType.Reg,
    ],
    [dataTypeMap.char]: [
        InternalRuleType.Null,
        InternalRuleType.Code,
        InternalRuleType.Repeat,
        InternalRuleType.Reg,
    ],
    [dataTypeMap.date]: [InternalRuleType.Null],
    [dataTypeMap.time]: [InternalRuleType.Null],
    [dataTypeMap.timestamp]: [InternalRuleType.Null],
    [dataTypeMap.datetime]: [InternalRuleType.Null],
    [dataTypeMap.bool]: [InternalRuleType.Null],
}
export const RuleRadioListMap = {
    [`${ExplorationRule.Field}-${ExplorationPeculiarity.Completeness}`]: [
        InternalRuleType.Null,
        InternalRuleType.Code,
    ],
    [`${ExplorationRule.Field}-${ExplorationPeculiarity.Uniqueness}`]: [
        InternalRuleType.Repeat,
    ],
    [`${ExplorationRule.Field}-${ExplorationPeculiarity.Accuracy}`]: [],
    [`${ExplorationRule.Field}-${ExplorationPeculiarity.Normative}`]: [
        InternalRuleType.Reg,
    ],
    [`${ExplorationRule.Row}-${ExplorationPeculiarity.Completeness}`]: [
        InternalRuleType.RowNull,
    ],
    [`${ExplorationRule.Row}-${ExplorationPeculiarity.Uniqueness}`]: [
        InternalRuleType.RowRepeat,
    ],
    [`${ExplorationRule.Row}-${ExplorationPeculiarity.Accuracy}`]: [],
    [`${ExplorationRule.DataView}-${ExplorationPeculiarity.Completeness}`]: [],
    [`${ExplorationRule.DataView}-${ExplorationPeculiarity.Timeliness}`]: [
        // InternalRuleType.timeliness,
    ],
}
// 规则模板 -- 维度类型
export const templateRuleRadioListMap = {
    [`${ExplorationRule.Row}-${ExplorationPeculiarity.Completeness}`]: [
        InternalRuleType.RowNull,
    ],
    [`${ExplorationRule.Row}-${ExplorationPeculiarity.Uniqueness}`]: [
        InternalRuleType.RowRepeat,
    ],
    [`${ExplorationRule.Row}-${ExplorationPeculiarity.Accuracy}`]: [],
    [`${ExplorationRule.Field}-${ExplorationPeculiarity.Completeness}`]: [
        InternalRuleType.Null,
        InternalRuleType.Code,
    ],
    [`${ExplorationRule.Field}-${ExplorationPeculiarity.Uniqueness}`]: [],
    [`${ExplorationRule.Field}-${ExplorationPeculiarity.Normative}`]: [
        InternalRuleType.Reg,
    ],
    [`${ExplorationRule.Field}-${ExplorationPeculiarity.Accuracy}`]: [],
}
export const internalRuleTypeMap = {
    [InternalRuleType.Null]: 'null',
    [InternalRuleType.Reg]: 'reg',
    [InternalRuleType.Code]: 'code',
    [InternalRuleType.Standard]: 'standard',
    [InternalRuleType.RowRepeat]: 'rowRepeat',
    [InternalRuleType.RowNull]: 'rowNull',
    [InternalRuleType.timeliness]: 'timeliness',
}
// 数据源探查自定义规则分类map，后端无细分类，id固定，前端根据自定义规则id分类
export const datasourceExploreFieldMap = {
    // 模板id
    metadata: [
        '4662a178-140f-4869-88eb-57f789baf1d3',
        '931bf4e4-914e-4bff-af0c-ca57b63d1619',
        'c2c65844-5573-4306-92d7-d3f9ac2edbf6',
    ],
    view: ['f7447b7a-13a6-4190-9d0d-623af08bedea'],
    number: [
        'cf0b5b51-79f1-4cb3-8f0c-be0c3ad25e55',
        'fcbad175-862e-4d24-882c-c6dd96d9f4f2',
        '6d8d7fdc-8cc4-4e89-a5dd-9b8d07a685dc',
        '0e75ad19-a39b-4e41-b8f1-e3cee8880182',
        '0c790158-9721-41ce-b8b3-b90341575485',
        '73271129-2ae3-47aa-83c5-6c0bf002140c',
        '91920b32-b884-4d23-a649-0518b038bf3b',
        'fd9fa13a-40db-4283-9c04-bf0ff3edcb32',
        '06ad1362-9545-415d-9278-265e3abe7c10',
        '96ac5dc0-2e5c-4397-87a7-8414dddf8179',
    ],
    [dataTypeMap.float]: [
        'cf0b5b51-79f1-4cb3-8f0c-be0c3ad25e55',
        'fcbad175-862e-4d24-882c-c6dd96d9f4f2',
        '6d8d7fdc-8cc4-4e89-a5dd-9b8d07a685dc',
        '0e75ad19-a39b-4e41-b8f1-e3cee8880182',
        '0c790158-9721-41ce-b8b3-b90341575485',
        '73271129-2ae3-47aa-83c5-6c0bf002140c',
        '91920b32-b884-4d23-a649-0518b038bf3b',
        'fd9fa13a-40db-4283-9c04-bf0ff3edcb32',
        '06ad1362-9545-415d-9278-265e3abe7c10',
        '96ac5dc0-2e5c-4397-87a7-8414dddf8179',
    ],
    [dataTypeMap.int]: [
        'cf0b5b51-79f1-4cb3-8f0c-be0c3ad25e55',
        'fcbad175-862e-4d24-882c-c6dd96d9f4f2',
        '6d8d7fdc-8cc4-4e89-a5dd-9b8d07a685dc',
        '0e75ad19-a39b-4e41-b8f1-e3cee8880182',
        '0c790158-9721-41ce-b8b3-b90341575485',
        '73271129-2ae3-47aa-83c5-6c0bf002140c',
        '91920b32-b884-4d23-a649-0518b038bf3b',
        'fd9fa13a-40db-4283-9c04-bf0ff3edcb32',
        '06ad1362-9545-415d-9278-265e3abe7c10',
        '96ac5dc0-2e5c-4397-87a7-8414dddf8179',
    ],
    [dataTypeMap.decimal]: [
        'cf0b5b51-79f1-4cb3-8f0c-be0c3ad25e55',
        'fcbad175-862e-4d24-882c-c6dd96d9f4f2',
        '6d8d7fdc-8cc4-4e89-a5dd-9b8d07a685dc',
        '0e75ad19-a39b-4e41-b8f1-e3cee8880182',
        '0c790158-9721-41ce-b8b3-b90341575485',
        '73271129-2ae3-47aa-83c5-6c0bf002140c',
        '91920b32-b884-4d23-a649-0518b038bf3b',
        'fd9fa13a-40db-4283-9c04-bf0ff3edcb32',
        '06ad1362-9545-415d-9278-265e3abe7c10',
        '96ac5dc0-2e5c-4397-87a7-8414dddf8179',
    ],
    [dataTypeMap.char]: [
        'cf0b5b51-79f1-4cb3-8f0c-be0c3ad25e55',
        'fcbad175-862e-4d24-882c-c6dd96d9f4f2',
        '6d8d7fdc-8cc4-4e89-a5dd-9b8d07a685dc',
        '0e75ad19-a39b-4e41-b8f1-e3cee8880182',
        '96ac5dc0-2e5c-4397-87a7-8414dddf8179',
    ],
    [dataTypeMap.date]: [
        'cf0b5b51-79f1-4cb3-8f0c-be0c3ad25e55',
        '0c790158-9721-41ce-b8b3-b90341575485',
        '73271129-2ae3-47aa-83c5-6c0bf002140c',
        '95e5b917-6313-4bd0-8812-bf0d4aa68d73',
        '69c3d959-1c72-422b-959d-7135f52e4f9c',
        '709fca1a-4640-4cd7-94ed-50b1b16e0aa5',
    ],
    [dataTypeMap.datetime]: [
        'cf0b5b51-79f1-4cb3-8f0c-be0c3ad25e55',
        '0c790158-9721-41ce-b8b3-b90341575485',
        '73271129-2ae3-47aa-83c5-6c0bf002140c',
        '95e5b917-6313-4bd0-8812-bf0d4aa68d73',
        '69c3d959-1c72-422b-959d-7135f52e4f9c',
        '709fca1a-4640-4cd7-94ed-50b1b16e0aa5',
    ],
    [dataTypeMap.timestamp]: [
        'cf0b5b51-79f1-4cb3-8f0c-be0c3ad25e55',
        '0c790158-9721-41ce-b8b3-b90341575485',
        '73271129-2ae3-47aa-83c5-6c0bf002140c',
        '95e5b917-6313-4bd0-8812-bf0d4aa68d73',
        '69c3d959-1c72-422b-959d-7135f52e4f9c',
        '709fca1a-4640-4cd7-94ed-50b1b16e0aa5',
    ],
    [dataTypeMap.time]: [
        'cf0b5b51-79f1-4cb3-8f0c-be0c3ad25e55',
        '0c790158-9721-41ce-b8b3-b90341575485',
        '73271129-2ae3-47aa-83c5-6c0bf002140c',
    ],
    [dataTypeMap.bool]: [
        'cf0b5b51-79f1-4cb3-8f0c-be0c3ad25e55',
        'ae0f6573-b3e0-4be2-8330-a643261f8a18',
        '45a4b3cb-b93c-469d-b3b4-631a3b8db5fe',
    ],
}

// 分类配置类型
export enum ClassifyConfigType {
    // 全部识别
    ALL_RECOGNITION = 'explore_classification',

    // 指定识别
    SPECIFIC_RECOGNITION = 'explore_classification_grade',
}
/**
 * @param operateType 接口用途：编辑、新建、详情、重名校验
 * @param type isTemplateConfig:规则模板;cssjj:是否cs环境;default:原来标品接口
 * @description 用于获取编辑、新建、详情、重名校验接口，根据不同环境，使用三套接口
 */
export const getRuleActionMap = (
    operateType: 'edit' | 'created' | 'details' | 'repeat' | 'list',
    type: 'isTemplateConfig' | 'cssjj' | 'default',
) => {
    const actionMap = {
        details: {
            isTemplateConfig: getTemplateRuleDetails,
            cssjj: getExploreRuleDetails,
            default: getExploreRuleDetails,
        },
        created: {
            isTemplateConfig: createTemplateRule,
            cssjj: createExploreRule,
            default: createExploreRule,
        },
        edit: {
            isTemplateConfig: editTemplateRule,
            cssjj: editExploreRule,
            default: editExploreRule,
        },
        repeat: {
            isTemplateConfig: templateRuleRepeat,
            cssjj: exploreRuleRepeat,
            default: exploreRuleRepeat,
        },
        list: {
            cssjj: getExploreRuleList,
            default: getExploreRuleList,
        },
    }
    return actionMap[operateType][type]
}
export const dimensionTypeMap = {
    format: 'reg',
    dict: 'code',
    repeat: 'rowRepeat',
    row_repeat: 'rowRepeat',
    row_null: 'rowNull',
    '': 'timeliness',
}

export const transformRulesToTree = (rules) => {
    const tree: any[] = []
    const dimensionMap: any = {}

    rules.forEach((rule) => {
        if (!rule.dimension) return

        if (!dimensionMap[rule.dimension]) {
            const parentNode = {
                ...rule,
                id: `${rule.dimension}${rule.rule_id}`,
                name: explorationPeculiarityList?.find(
                    (o) => o.key === rule.dimension,
                )?.label,
                type: rule.dimension,
                children: [],
            }
            dimensionMap[rule.dimension] = parentNode
            tree.push(parentNode)
        }

        dimensionMap[rule.dimension].children.push({
            ...rule,
            id: rule.rule_id,
            name: rule.rule_name,
        })
    })

    return tree
}
export const ruleExpressionWhereList = (data: any[] = []) => {
    const list: any = []
    data.forEach((o) => {
        list.push(...o.member)
    })
    return uniqBy(list, 'id')
}
export const isCustomRule = (config: any) => {
    return (
        !!config?.rule_expression?.where?.length ||
        !!config?.rule_expression?.sql?.trim()
    )
}
export const getUniqueName = (name, existingNames) => {
    let newName = name
    let copyNumber = 1

    while (existingNames.includes(newName)) {
        const endsWithCopy = newName.endsWith('副本')
        const endsWithCopyAndNumber = /副本(\d+)$/.test(newName)

        if (endsWithCopy) {
            newName = `${newName}${copyNumber + 1}`
            // eslint-disable-next-line no-plusplus
            copyNumber++
        } else if (endsWithCopyAndNumber) {
            const matches = newName.match(/副本(\d+)$/)
            copyNumber = parseInt(matches[1], 10) + 1
            newName = newName.replace(/副本\d+$/, `副本${copyNumber}`)
        } else {
            newName = `${newName}副本`
        }
    }

    return newName
}
