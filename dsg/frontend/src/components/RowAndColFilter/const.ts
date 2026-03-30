import { DATA_TYPE_MAP, FIELD_TYPE_CN, FIELD_TYPE_EN } from '@/utils'
import __ from './locale'
import { formatDataType } from '../DatasheetView/helper'

/**
 * @param {Porbe} 探查数据
 * @param {Sample} 样例数据
 * @param {Date} 日期
 * @param {Normal} 输入框
 */
export enum CopoundContentType {
    Porbe = 'probe',
    Sample = 'sample',
    DateTime = 'datetime',
    Normal = 'normal',
}

// 操作类型
export const Operation = {
    '+': '加',
    '-': '减',
    '*': '乘',
    '/': '除',
}

// 限制关系类型
export const limitRelation = {
    or: '或',
    and: '且',
}

// 限制关系选项
export const RelationOptions = [
    {
        value: 'and',
        label: __('且'),
    },
    {
        value: 'or',
        label: __('或'),
    },
]

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

export const codeTableList = [
    '<',
    '<=',
    '>',
    '>=',
    'include',
    'not include',
    'prefix',
    'not prefix',
    '=',
    '<>',
    'belong',
]
// 数字型的操作数组
export const limitNumber = ['<', '<=', '>', '>=']
export const BelongList = ['belong']
export const limitBoolean = ['null', 'not null']

// 探查启用条件
export const numberExplore = ['<', '<=', '>', '>=']
export const chartExplore = [
    'include',
    'not include',
    'prefix',
    'not prefix',
    '=',
    '<>',
    'belong',
]
export const dateExplore = ['between']

// 字符型的操作数组
export const limitString = ['include', 'not include', 'prefix', 'not prefix']

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
    [FIELD_TYPE_CN.CHAR]: {
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
    [FIELD_TYPE_CN.NUMBER]: {
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
    [FIELD_TYPE_CN.BOOL]: {
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
    [FIELD_TYPE_CN.DATE]: {
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
    [FIELD_TYPE_CN.DATETIME]: {
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
    [FIELD_TYPE_CN.TIMESTAMP]: {
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
    [FIELD_TYPE_CN.BINARY]: {
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

/**
 * 不限制内容类型
 */
export const UnLimitType = ['true', 'false', 'null', 'not null']

export const FieldInfosByEN = {
    [FIELD_TYPE_EN.INT]: {
        name: __('整数型'),
        limitListOptions: [
            {
                label: __('小于'),
                value: '<',
            },
            {
                label: __('小于或等于'),
                value: '<=',
            },
            {
                label: __('大于'),
                value: '>',
            },
            {
                label: __('大于或等于'),
                value: '>=',
            },
            {
                label: __('等于'),
                value: '=',
            },
            {
                label: __('不等于'),
                value: '<>',
            },
            // {
            //     label: __('在码表中'),
            //     value: 'in list',
            // },
            {
                label: __('属于'),
                value: 'belong',
            },
            {
                label: __('为空'),
                value: 'null',
            },
            {
                label: __('不为空'),
                value: 'not null',
            },
        ],
    },
    [FIELD_TYPE_EN.FLOAT]: {
        name: __('小数型'),
        limitListOptions: [
            {
                label: __('小于'),
                value: '<',
            },
            {
                label: __('小于或等于'),
                value: '<=',
            },
            {
                label: __('大于'),
                value: '>',
            },
            {
                label: __('大于或等于'),
                value: '>=',
            },
            {
                label: __('等于'),
                value: '=',
            },
            {
                label: __('不等于'),
                value: '<>',
            },
            // {
            //     label: __('在码表中'),
            //     value: 'in list',
            // },
            {
                label: __('属于'),
                value: 'belong',
            },
            {
                label: __('为空'),
                value: 'null',
            },
            {
                label: __('不为空'),
                value: 'not null',
            },
        ],
    },
    [FIELD_TYPE_EN.DECIMAL]: {
        name: __('高精度型'),
        limitListOptions: [
            {
                label: __('小于'),
                value: '<',
            },
            {
                label: __('小于或等于'),
                value: '<=',
            },
            {
                label: __('大于'),
                value: '>',
            },
            {
                label: __('大于或等于'),
                value: '>=',
            },
            {
                label: __('等于'),
                value: '=',
            },
            {
                label: __('不等于'),
                value: '<>',
            },
            // {
            //     label: __('在码表中'),
            //     value: 'in list',
            // },
            {
                label: __('属于'),
                value: 'belong',
            },
            {
                label: __('为空'),
                value: 'null',
            },
            {
                label: __('不为空'),
                value: 'not null',
            },
        ],
    },
    [FIELD_TYPE_EN.NUMBER]: {
        name: __('数字型'),
        limitListOptions: [
            {
                label: __('小于'),
                value: '<',
            },
            {
                label: __('小于或等于'),
                value: '<=',
            },
            {
                label: __('大于'),
                value: '>',
            },
            {
                label: __('大于或等于'),
                value: '>=',
            },
            {
                label: __('等于'),
                value: '=',
            },
            {
                label: __('不等于'),
                value: '<>',
            },
            // {
            //     label: __('在码表中'),
            //     value: 'in list',
            // },
            {
                label: __('属于'),
                value: 'belong',
            },
            {
                label: __('为空'),
                value: 'null',
            },
            {
                label: __('不为空'),
                value: 'not null',
            },
        ],
    },
    [FIELD_TYPE_EN.CHAR]: {
        name: __('字符型'),
        limitListOptions: [
            {
                label: __('包含'),
                value: 'include',
            },
            {
                label: __('不包含'),
                value: 'not include',
            },
            {
                label: __('开头是'),
                value: 'prefix',
            },
            {
                label: __('开头不是'),
                value: 'not prefix',
            },
            {
                label: __('等于'),
                value: '=',
            },
            {
                label: __('不等于'),
                value: '<>',
            },
            // {
            //     label: __('在码表中'),
            //     value: 'in list',
            // },
            {
                label: __('属于'),
                value: 'belong',
            },
            {
                label: __('为空'),
                value: 'null',
            },
            {
                label: __('不为空'),
                value: 'not null',
            },
        ],
    },
    [FIELD_TYPE_EN.BOOL]: {
        name: __('布尔型'),
        limitListOptions: [
            {
                label: __('为是'),
                value: 'true',
            },
            {
                label: __('为否'),
                value: 'false',
            },
            {
                label: __('为空'),
                value: 'null',
            },
            {
                label: __('不为空'),
                value: 'not null',
            },
        ],
    },
    [FIELD_TYPE_EN.DATE]: {
        name: __('日期型'),
        limitListOptions: [
            {
                label: __('过去'),
                value: `before`,
            },
            {
                label: __('当前'),
                value: `current`,
            },
            {
                label: __('介于'),
                value: `between`,
            },
        ],
    },
    [FIELD_TYPE_EN.DATETIME]: {
        name: __('日期时间型'),
        limitListOptions: [
            {
                label: __('过去'),
                value: `before`,
            },
            {
                label: __('当前'),
                value: `current`,
            },
            {
                label: __('介于'),
                value: `between`,
            },
        ],
    },
    [FIELD_TYPE_EN.TIMESTAMP]: {
        name: __('时间戳型'),
        limitListOptions: [
            {
                label: __('过去'),
                value: `before`,
            },
            {
                label: __('当前'),
                value: `current`,
            },
            {
                label: __('介于'),
                value: `between`,
            },
        ],
    },
    [FIELD_TYPE_EN.BINARY]: {
        name: __('二进制'),
        // 无法识别内容，故不支持限定
        limitListOptions: [],
    },
    [FIELD_TYPE_EN.TIME]: {
        name: __('时间型'),
        // 无法识别内容，故不支持限定
        limitListOptions: [],
    },
}

export const getCopoundContentType = (
    fieldInfo,
    condition,
): CopoundContentType => {
    if (fieldInfo?.data_type && condition) {
        const type = formatDataType(fieldInfo?.data_type)
        if (
            (DATA_TYPE_MAP.number.includes(type) &&
                ['<', '<=', '>', '>='].includes(condition)) ||
            (DATA_TYPE_MAP.char.includes(type) &&
                [
                    'include',
                    'not include',
                    'prefix',
                    'not prefix',
                    '=',
                    '<>',
                    'belong',
                ].includes(condition))
        ) {
            return CopoundContentType.Porbe
        }
        return CopoundContentType.Sample
    }

    return CopoundContentType.Normal
}
