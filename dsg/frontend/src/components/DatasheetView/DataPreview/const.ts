import __ from './locale'
import { dataTypeMapping } from '@/core'

export enum fieldType {
    char = 1, // 字符型
    number = 0, // 数字型
    date = 2, // 日期型
    datetime = 3, // 日期时间型
    timestamp = 4, // 时间戳型
    bool = 5, // 布尔型
    binary = 6, // 二进制
    other = 99, // 其他
}

export enum statisticsType {
    statistics,
    quality,
}

export const qualityRules = ['Zero', 'BlankCount', 'NullCount']

export const ruleTypeList = {
    [fieldType.char]: [
        'Group',
        'BlankCount',
        // 'Max',
        // 'Min',
    ],
    [fieldType.number]: [
        'NullCount',
        'Max',
        'Min',
        'Quantile',
        'Zero',
        'Avg',
        'VarPop',
        'StddevPop',
        'Group',
    ],
    [fieldType.date]: ['NullCount', 'Day', 'Month', 'Year', 'Max', 'Min'],
    [fieldType.datetime]: ['NullCount', 'Day', 'Month', 'Year', 'Max', 'Min'],
    [fieldType.timestamp]: ['NullCount', 'Day', 'Month', 'Year', 'Max', 'Min'],
    [fieldType.bool]: ['NullCount', 'True', 'False'],
    [fieldType.other]: ['NullCount'],
}

export const qualityScoreDimensionText = [
    {
        title: __('完整性（Completeness）：'),
        text: __('衡量数据是否齐全，是否存在缺失的数据或者不可用的信息'),
    },
    {
        title: __('唯一性（Uniqueness）：'),
        text: __(
            '对评估数据中是否存在重复的记录或者数据项，确保每个数据实体能够被唯一地标识',
        ),
    },
    {
        title: __('及时性（Timeliness）：'),
        text: __(
            '衡量数据是否能够在需要的时候提供，即数据的获取、更新和使用是否符合时效要求',
        ),
    },
    {
        title: __('规范性（Standardization）：'),
        text: __(
            '检查数据是否在预定的范国或者格式内，数据值是否符合预定义的业务规则或约束',
        ),
    },
    {
        title: __('准确性（Accuracy）：'),
        text: __(
            '评估数据反映真实情况的程度，数据值是否正确，是否存在错误或偏差',
        ),
    },
    // {
    //     title: __('一致性（Consistency）：'),
    //     text: __(
    //         '衡量数据在不同系统、源或时间点之间的吻合程度，确保数据的含义和表示方式不产生冲突或误解',
    //     ),
    // },
]

export const FormatDataType = (type) => {
    switch (true) {
        case dataTypeMapping.char.includes(type):
            return fieldType.char
        case dataTypeMapping.number.includes(type):
            return fieldType.number
        case dataTypeMapping.bool.includes(type):
            return fieldType.bool
        case dataTypeMapping.date.includes(type):
            return fieldType.date
        case dataTypeMapping.time.includes(type):
        case dataTypeMapping.datetime.includes(type):
            return fieldType.datetime
        case dataTypeMapping.binary.includes(type):
            return fieldType.binary
        default:
            return fieldType.other
    }
}
export const DataTypeNumberToString = (type) => {
    switch (type) {
        case fieldType.char:
            return 'char'
        case fieldType.number:
            return 'number'
        case fieldType.bool:
            return 'bool'
        case fieldType.date:
            return 'date'
        case fieldType.datetime:
            return 'datetime'
        case fieldType.timestamp:
            return 'timestamp'
        case fieldType.binary:
            return 'binary'
        default:
            return 'other'
    }
}
