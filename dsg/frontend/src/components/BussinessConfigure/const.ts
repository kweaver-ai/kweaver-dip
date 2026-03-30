export enum ViewModel {
    // 编辑
    Edit = 'Edit',
    // 新建
    Create = 'Create',
    // 预览
    View = 'View',
}
export interface DataType {
    key: string
    name: string
    age: number
    address: string
    tags: string[]
}
export interface measureObj {
    type: string // 度量选择类型，指标or字段？
    field_id?: string[] | number[] //  字段的所在表id
    parent_indicator?: string // 指标的引用id
    aggregate?: string // 聚合方式
    operation?: string // 运算方式
    name?: string
}
export interface groupObj {
    format?: string
    field_type?: string
    field_id: string[]
    name?: string
    data_type: string
    isExist?: boolean
}
export const Operation = {
    '+': '加',
    '-': '减',
    '*': '乘',
    '/': '除',
}
export const limitRelation = {
    or: '或',
    and: '且',
}
// 聚合方式
export enum Polymerization {
    COUNT = 'COUNT', // 计数
    COUNT_ONLY = 'COUNT_ONLY', // 去重计数
    SUM = 'SUM', // 求和
    MAX = 'MAX', // 最大值
    MIN = 'MIN', // 最小值
    AVG = 'AVG', // 平均值
}
// 聚合方式
export const PolymerValue = {
    COUNT: '(计数)', // 计数
    'COUNT(DISTINCT)': '(去重计数)', // 去重计数
    SUM: '(求和)', // 求和
    MAX: '(最大值)', // 最大值
    MIN: '(最小值)', // 最小值
    AVG: '(平均值)', // 平均值
}
export enum FieldTypes {
    STRING = '字符型',
    NUMBER = '数字型',
    BOOLEAN = '布尔型',
    DATE = '日期型',
    DATETIME = '日期时间型',
    TIMESTAMP = '时间戳型',
    BINARY = '二进制',
}
// 操作的值枚举
export const OperatorObj = {
    '<': '(小于)',
    '<=': '(小于或等于)',
    '>': '(大于)',
    '>=': '(大于或等于)',
    '=': '(等于)',
    '<>': '(不等于)',
    null: '(为空)',
    'not null': '(不为空)',
    true: '(为是)',
    false: '(为否)',
    include: '(包含)',
    'not include': '(不包含)',
    prefix: '(开头是)',
    'not prefix': '(开头不是)',
    'in list': '(在码表中)',
    belong: '(属于)',
    before: '(过去)',
    current: '(当前)',
    between: '(介于)',
}
// 数字型的操作数组
export const limitNumber = ['<', '<=', '>', '>=', '=', '<>']

export const BelongList = ['belong']
export const limitList = ['in list']
export const limitAndBelongList = ['in list', 'belong']
export const limitBoolean = ['null', 'not null']
export const limitChoose = ['=', '<>']

// 字符型的操作数组
export const limitString = [
    'include',
    'not include',
    'prefix',
    'not prefix',
    '=',
    '<>',
]
// 日期型的操作数组 (过去，当前)
export const limitDate = ['before', 'current']
export const beforeTime = ['before']
export const currentTime = ['current']
// 介于
export const limitDateRanger = ['between']

export const beforeDateOptions = [
    {
        label: '天',
        value: `day`,
    },
    {
        label: '周',
        value: `week`,
    },
    {
        label: '月',
        value: `month`,
    },
    {
        label: '年',
        value: `year`,
        window,
    },
]
export const beforeDateTimeOptions = [
    {
        label: '分钟',
        value: `minute`,
    },
    {
        label: '小时',
        value: `hour`,
    },
    {
        label: '天',
        value: `day`,
    },
    {
        label: '周',
        value: `week`,
    },
    {
        label: '月',
        value: `month`,
    },
    {
        label: '年',
        value: `year`,
    },
]
export const currentDateOptions = [
    {
        label: '天',
        value: `%Y-%m-%d`,
    },
    {
        label: '周',
        value: `%x-%v`,
    },
    {
        label: '月',
        value: `%Y-%m`,
    },
    {
        label: '年',
        value: `%Y`,
    },
]
export const currentDataTimeOptions = [
    {
        label: '分钟',
        value: `%Y-%m-%d %H:%i`,
    },
    {
        label: '小时',
        value: `%Y-%m-%d %H`,
    },
    {
        label: '天',
        value: `%Y-%m-%d`,
    },
    {
        label: '周',
        value: `%x-%v`,
    },
    {
        label: '月',
        value: `%Y-%m`,
    },
    {
        label: '年',
        value: `%Y`,
    },
]
// 分组的时间选项

export const groupOptions = [
    {
        label: '按天',
        value: `%Y-%m-%d`,
    },
    {
        label: '按周',
        value: `%x-%v`,
    },
    {
        label: '按月',
        value: `%Y-%m`,
    },
    {
        label: '按年',
        value: `%Y`,
    },
]
// 聚合方式
export enum GroupValue {
    '%Y-%m-%d' = '(按天)',
    '%x-%v' = '(按周)',
    '%Y-%m' = '(按月)',
    '%Y' = '(按年)',
}
// 不同字段对应能选择的度量规则和限定条件
export const FieldInfos = {
    [FieldTypes.STRING]: {
        name: '字符型',
        polymerizationOptions: [
            {
                label: '计数',
                value: 'COUNT',
            },
            {
                label: '去重计数',
                value: 'COUNT(DISTINCT)',
            },
        ],
        LimitOptions: [
            {
                label: '包含',
                value: 'include',
            },
            {
                label: '不包含',
                value: 'not include',
            },
            {
                label: '开头是',
                value: 'prefix',
            },
            {
                label: '开头不是',
                value: 'not prefix',
            },
            {
                label: '等于',
                value: '=',
            },
            {
                label: '不等于',
                value: '<>',
            },
            {
                label: '属于',
                value: 'belong',
            },
            {
                label: '为空',
                value: 'null',
            },
            {
                label: '不为空',
                value: 'not null',
            },
        ],
        LimitListOptions: [
            {
                label: '包含',
                value: 'include',
            },
            {
                label: '不包含',
                value: 'not include',
            },
            {
                label: '开头是',
                value: 'prefix',
            },
            {
                label: '开头不是',
                value: 'not prefix',
            },
            {
                label: '等于',
                value: '=',
            },
            {
                label: '不等于',
                value: '<>',
            },
            {
                label: '在码表中',
                value: 'in list',
            },
            {
                label: '属于',
                value: 'belong',
            },
            {
                label: '为空',
                value: 'null',
            },
            {
                label: '不为空',
                value: 'not null',
            },
        ],
    },
    [FieldTypes.NUMBER]: {
        name: '数字型',
        polymerizationOptions: [
            {
                label: '计数',
                value: 'COUNT',
            },
            {
                label: '去重计数',
                value: 'COUNT(DISTINCT)',
            },
            {
                label: '求和',
                value: 'SUM',
            },
            {
                label: '最大值',
                value: 'MAX',
            },
            {
                label: '最小值',
                value: 'MIN',
            },
            {
                label: '平均值',
                value: 'AVG',
            },
        ],
        LimitOptions: [
            {
                label: '小于',
                value: '<',
            },
            {
                label: '小于或等于',
                value: '<=',
            },
            {
                label: '大于',
                value: '>',
            },
            {
                label: '大于或等于',
                value: '>=',
            },
            {
                label: '等于',
                value: '=',
            },
            {
                label: '不等于',
                value: '<>',
            },
            {
                label: '属于',
                value: 'belong',
            },
            {
                label: '为空',
                value: 'null',
            },
            {
                label: '不为空',
                value: 'not null',
            },
        ],
        LimitListOptions: [
            {
                label: '小于',
                value: '<',
            },
            {
                label: '小于或等于',
                value: '<=',
            },
            {
                label: '大于',
                value: '>',
            },
            {
                label: '大于或等于',
                value: '>=',
            },
            {
                label: '等于',
                value: '=',
            },
            {
                label: '不等于',
                value: '<>',
            },
            {
                label: '在码表中',
                value: 'in list',
            },
            {
                label: '属于',
                value: 'belong',
            },
            {
                label: '为空',
                value: 'null',
            },
            {
                label: '不为空',
                value: 'not null',
            },
        ],
    },
    [FieldTypes.BOOLEAN]: {
        name: '布尔型',
        polymerizationOptions: [
            {
                label: '计数',
                value: 'COUNT',
            },
        ],
        LimitOptions: [
            {
                label: '为是',
                value: 'true',
            },
            {
                label: '为否',
                value: 'false',
            },
            {
                label: '为空',
                value: 'null',
            },
            {
                label: '不为空',
                value: 'not null',
            },
        ],
        LimitListOptions: [
            {
                label: '为是',
                value: 'true',
            },
            {
                label: '为否',
                value: 'false',
            },
            {
                label: '为空',
                value: 'null',
            },
            {
                label: '不为空',
                value: 'not null',
            },
        ],
    },
    [FieldTypes.DATE]: {
        name: '日期型',
        polymerizationOptions: [
            {
                label: '计数',
                value: 'COUNT',
            },
            {
                label: '去重计数',
                value: 'COUNT(DISTINCT)',
            },
        ],
        LimitOptions: [
            {
                label: '过去',
                value: `before`,
            },
            {
                label: '当前',
                value: `current`,
            },
            {
                label: '介于',
                value: `between`,
            },
        ],
        LimitListOptions: [
            {
                label: '过去',
                value: `before`,
            },
            {
                label: '当前',
                value: `current`,
            },
            {
                label: '介于',
                value: `between`,
            },
        ],
    },
    [FieldTypes.DATETIME]: {
        name: '日期时间型',
        polymerizationOptions: [
            {
                label: '计数',
                value: 'COUNT',
            },
        ],
        LimitOptions: [
            {
                label: '过去',
                value: `before`,
            },
            {
                label: '当前',
                value: `current`,
            },
            {
                label: '介于',
                value: `between`,
            },
        ],
        LimitListOptions: [
            {
                label: '过去',
                value: `before`,
            },
            {
                label: '当前',
                value: `current`,
            },
            {
                label: '介于',
                value: `between`,
            },
        ],
    },
    [FieldTypes.TIMESTAMP]: {
        name: '时间戳型',
        polymerizationOptions: [
            {
                label: '计数',
                value: 'COUNT',
            },
        ],
        LimitOptions: [
            {
                label: '过去',
                value: `before`,
            },
            {
                label: '当前',
                value: `current`,
            },
            {
                label: '介于',
                value: `between`,
            },
        ],
        LimitListOptions: [
            {
                label: '过去',
                value: `before`,
            },
            {
                label: '当前',
                value: `current`,
            },
            {
                label: '介于',
                value: `between`,
            },
        ],
    },
    [FieldTypes.BINARY]: {
        name: '二进制', // 无法识别内容，故不支持限定。
        polymerizationOptions: [
            {
                label: '计数',
                value: 'COUNT',
            },
        ],
        LimitOptions: [],
        LimitListOptions: [],
    },
}

// 模型操作类型
export enum ModelOperateType {
    // 编辑
    EDIT = 'edit',

    // 详情
    DETAIL = 'detail',

    // 删除
    DELETE = 'delete',
}

// 模型操作类型
export enum IndicatorOperateType {
    // 编辑
    EDIT = 'edit',

    // 删除
    DELETE = 'delete',
}
