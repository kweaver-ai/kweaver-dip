import { SortDirection } from '@/core'
import __ from './locale'

export const initSearchCondition: any = {
    offset: 1,
    limit: 10,
    keyword: '',
    direction: SortDirection.DESC,
    sort: 'created_at',
}

export const DefaultMenu = {
    key: 'created_at',
    sort: SortDirection.DESC,
    label: __('按创建时间排序'),
}

export enum ConfigType {
    // 业务对象
    BizObj = 'biz-obj',
    // 业务指标
    BizIndicator = 'biz-indicator',
    // 业务规则
    BizRule = 'biz-rule',
}

export const TipConfigMap = {
    [ConfigType.BizObj]: {
        title: __('业务对象'),
        intro: __('业务表所包含的业务对象信息'),
    },
    [ConfigType.BizIndicator]: {
        title: __('业务指标'),
        intro: [
            [
                {
                    name: __('时间维度'),
                    value: __('识别待理解的时间字段，探查字段的有效时间范围'),
                },
                {
                    name: __('时间范围'),
                    value: __('时间相关字段真实数据的值域范围'),
                },
                {
                    name: __('时间字段理解'),
                    value: __('时间字段所能表达的业务语义'),
                },
            ],
            [
                {
                    name: __('空间维度'),
                    value: __(
                        '识别待理解的空间维度字段，空间字段经所能表达的地域空间范围和空间相关字段的业务语义信息。如对某空间字段理解可生成以下业务语义信息：根据“登记机关”可以反映全市各区县、园区的企业登记数量分布情况',
                    ),
                },
                {
                    name: __('空间范围'),
                    value: __('空间相关字段真实数据的值域范围'),
                },
                {
                    name: __('空间字段理解'),
                    value: __(
                        '空间字段经所能表达的地域空间范围和空间相关字段的业务语义信息',
                    ),
                },
            ],

            [
                {
                    name: __('业务特殊维度'),
                    value: __(
                        '业务属性的业务语义信息。如对某业务字段解析可生成以下业务语义信息:',
                    ),
                    list: [
                        __(
                            '通过“行业门类”，可以分析各类行业的企业数量的发展情况',
                        ),
                        __(
                            '通过“成立日期”，可以分析存续、注销、吊销、撤销、迁出等企业数量、历史趋势',
                        ),
                    ],
                },
            ],
            [
                {
                    name: __('复合表达'),
                    value: __(
                        '联合关联业务表和业务字段所能复合表达的内容。如对某业务字段解析可生成以下业务语义信息:',
                    ),
                    list: [
                        __('联合【企业异常名录表】体现企业的异常情况'),
                        __(
                            '联合【严重违法失信企业表】、【行政处罚表】、【各类案件信息】等，体现企业是否存在失信、行政处罚、刑事、民事案件等违法违规风险',
                        ),
                    ],
                },
            ],
            [
                {
                    name: __('正面支撑'),
                    value: __(
                        '识别当前数据资源目录的中性词或者正面表达的字段，寻找这些字段与业务指标、主干业务、业务流程的关系，解析表中非负面字段的所能代表的业务含义',
                    ),
                },
            ],
            [
                {
                    name: __('负面支撑'),
                    value: __(
                        '识别当前数据资源目录的负面字段，寻找这些字段与业务指标、主干业务、业务流程的关系，解析表中负面字段的所能代表的业务含义',
                    ),
                },
            ],
            [
                {
                    name: __('服务范围或对象'),
                    value: __(
                        '理解业务对象对不同组织部门产生的影响及范围。如服务范围理解结果示例如下:',
                    ),
                    list: [
                        __('服务全市各级政务部门检索、核验企业基本信息'),
                        __(
                            '服务各区县、园区掌握本地区企业的数量、增长趋势，及时掌握区域重点企业经营状态',
                        ),
                    ],
                },
            ],
            [
                {
                    name: __('服务领域'),
                    value: __(
                        '理解表可能应用的领域（如：信用信息、金融信息、医疗健康、城市交通、文化旅游、行政执法、党的建设）',
                    ),
                },
            ],
        ],
    },
    [ConfigType.BizRule]: {
        title: __('业务规则'),
        intro: [
            [
                {
                    name: __('保护/控制什么'),
                    value: __(
                        '根据字段引用关系，理解负面字段数据对业务的保护限制作用。如保护限制理解示例：根据企业基本信息注销、吊销等异常状态的企业限制参与招投标、政府福利待遇享受、资质申请等活动',
                    ),
                },
                {
                    name: __('促进/推动什么'),
                    value: __(
                        '根据字段引用关系，理解非负面字段数据对业务的促进推动作用',
                    ),
                },
            ],
        ],
    },
}

export const CheckOptions = {
    business_object: __('业务对象'),
    time_range: __('时间范围'),
    time_field_comprehension: __('时间字段理解'),
    spatial_range: __('空间范围'),
    spatial_field_comprehension: __('空间字段理解'),
    compound_expression: __('复合表达'),
    front_support: __('正面支撑'),
    negative_support: __('负面支撑'),
    business_special_dimension: __('业务特殊维度'),
    service_areas: __('服务领域'),
    service_range: __('服务范围或对象'),
    promote_push: __('促进/推动什么'),
    protect_control: __('保护/控制什么'),
}

export const CheckMap = {
    [ConfigType.BizObj]: ['business_object'],
    [ConfigType.BizIndicator]: [
        'time_range',
        'time_field_comprehension',
        'spatial_range',
        'spatial_field_comprehension',
        'compound_expression',
        'front_support',
        'negative_support',
        'business_special_dimension',
        'service_areas',
        'service_range',
    ],
    [ConfigType.BizRule]: ['protect_control', 'promote_push'],
}

export const AllCheckKeys = [
    ...CheckMap[ConfigType.BizObj],
    ...CheckMap[ConfigType.BizIndicator],
    ...CheckMap[ConfigType.BizRule],
]

export const CheckDataMap = {
    [ConfigType.BizObj]: [
        {
            label: CheckOptions.business_object,
            value: 'business_object',
        },
    ],
    [ConfigType.BizIndicator]: [
        {
            label: __('时间维度'),
            value: 'time',
            children: [
                {
                    label: CheckOptions.time_range,
                    value: 'time_range',
                },
                {
                    label: CheckOptions.time_field_comprehension,
                    value: 'time_field_comprehension',
                },
            ],
        },
        {
            label: __('空间维度'),
            value: 'spatial',
            children: [
                {
                    label: CheckOptions.spatial_range,
                    value: 'spatial_range',
                },
                {
                    label: CheckOptions.spatial_field_comprehension,
                    value: 'spatial_field_comprehension',
                },
            ],
        },

        {
            label: CheckOptions.compound_expression,
            value: 'compound_expression',
        },
        {
            label: CheckOptions.front_support,
            value: 'front_support',
        },
        {
            label: CheckOptions.negative_support,
            value: 'negative_support',
        },
        {
            label: CheckOptions.business_special_dimension,
            value: 'business_special_dimension',
        },
        {
            label: CheckOptions.service_areas,
            value: 'service_areas',
        },
        {
            label: CheckOptions.service_range,
            value: 'service_range',
        },
    ],
    [ConfigType.BizRule]: [
        {
            label: CheckOptions.protect_control,
            value: 'protect_control',
        },
        {
            label: CheckOptions.promote_push,
            value: 'promote_push',
        },
    ],
}
