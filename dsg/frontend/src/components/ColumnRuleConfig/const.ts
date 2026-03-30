import __ from './locale'
import { formatDataType } from '../DatasheetView/helper'
import { dataTypeMapping } from '@/core'
/**
 * 字段类型
 */
export enum FieldTypes {
    NUMBER = 'number',
    CHAR = 'char',
    DATE = 'date',
    DATETIME = 'datetime',
    TIMESTAMP = 'timestamp',
    BOOL = 'bool',
    BINARY = 'binary',
}

export const fieldInfos = {
    [FieldTypes.NUMBER]: {
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
    [FieldTypes.CHAR]: {
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
    [FieldTypes.BOOL]: {
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
    [FieldTypes.DATE]: {
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
    [FieldTypes.DATETIME]: {
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
    [FieldTypes.TIMESTAMP]: {
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
    [FieldTypes.BINARY]: {
        name: __('二进制'),
        // 无法识别内容，故不支持限定
        limitListOptions: [],
    },
}

export const codeTableList = ['=', '<>', 'belong']
export const limitNumber = ['<', '<=', '>', '>=']
export const limitString = ['include', 'not include', 'prefix', 'not prefix']

/**
 * @param {Porbe} 探查数据
 * @param {Sample} 样例数据
 * @param {Date} 日期
 * @param {Normal} 输入框
 */
export enum LimitContentType {
    Porbe = 'probe',
    Sample = 'sample',
    DateTime = 'datetime',
    Normal = 'normal',
}

export const getLimitContentType = (fieldInfo, condition): LimitContentType => {
    if (fieldInfo?.data_type && condition) {
        const type = formatDataType(fieldInfo?.data_type)
        if (
            (dataTypeMapping.number.includes(type) &&
                ['<', '<=', '>', '>='].includes(condition)) ||
            (dataTypeMapping.char.includes(type) &&
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
            return LimitContentType.Porbe
        }
        return LimitContentType.Sample
    }

    return LimitContentType.Normal
}
