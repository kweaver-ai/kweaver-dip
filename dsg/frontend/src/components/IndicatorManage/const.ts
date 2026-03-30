import moment from 'moment'
import { dataTypeMapping, SortDirection } from '@/core'
import __ from './locale'
import {
    limitAndBelongList,
    limitDateRanger,
} from '../BussinessConfigure/const'

export const beforeTime = ['before']

/**
 * 左侧树的枚举类型
 */
export enum SelectFilterMenu {
    // 主题域分组
    BUSSINESSDOMAIN = 'subject_domain_group',

    // 主题域
    SUBJECTDOMAIN = 'subject_domain',

    // 维度模型
    DIMENSIONALMODEL = 'dimensionalModel',

    // 组织架构 - 组织
    ORGNIZATION = 'organization',
    // 组织架构 - 部门
    DEPARTMENT = 'department',
}

/**
 * 展示Tree的选择条件
 */

export const SelectFilterOptions = [
    {
        label: __('主题域'),
        value: SelectFilterMenu.BUSSINESSDOMAIN,
    },
    {
        label: __('组织架构'),
        value: SelectFilterMenu.ORGNIZATION,
    },
]

export enum TabsKey {
    // 所有
    ALL = 'all',
    // 原子指标
    ATOMS = 'atomic',

    // 衍生指标
    DERIVE = 'derived',

    // 复合指标
    RECOMBINATION = 'composite',
}

// 顶栏切换tab
export const DataTableTabs = [
    {
        label: __('全部'),
        key: TabsKey.ALL,
        children: '',
    },
    {
        label: __('原子指标'),
        key: TabsKey.ATOMS,
        children: '',
    },
    {
        label: __('衍生指标'),
        key: TabsKey.DERIVE,
        children: '',
    },
    {
        label: __('复合指标'),
        key: TabsKey.RECOMBINATION,
        children: '',
    },
]

/**
 * 排序方式
 */
export enum SortType {
    CREATED = 'created_at',
    UPDATED = 'updated_at',
    NAME = 'name',
}
/*
 * 排序菜单 标准
 */
export const menus = [
    { key: SortType.NAME, label: __('按名称排序') },
    // { key: SortType.CREATED, label: __('按创建时间排序') },
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
 * 操作类型
 */
export enum OptionType {
    // 编辑
    EDIT = 'edit',
    // 详情
    DETAIL = 'detail',

    // 删除
    DELETE = 'delete',
}

export const IndicatorNames = {
    [TabsKey.ALL]: __('指标名称'),

    [TabsKey.ATOMS]: __('原子指标名称'),

    [TabsKey.DERIVE]: __('衍生指标名称'),

    [TabsKey.RECOMBINATION]: __('复合指标名称'),
}

export const IndicatorTypes = {
    atomic: __('原子指标'),
    derived: __('衍生指标'),
    composite: __('复合指标'),
}

/**
 * 创建下拉
 */
export const CreateItems = [
    {
        label: __('原子指标'),
        key: TabsKey.ATOMS,
    },
    {
        label: __('衍生指标'),
        key: TabsKey.DERIVE,
    },
    {
        label: __('复合指标'),
        key: TabsKey.RECOMBINATION,
    },
]

// 指标分组属性
export enum IndicatorInfoGroup {
    // 基本信息
    BASICINFO = 'basicInfo',

    // 管理属性
    MANAGEATTR = 'manageAttr',

    // 技术属性
    TECHNICALATTR = 'technicalAttr',

    // 数据预览
    DATAVIEW = 'dataView',
}

// 运算函数
export enum OperatingKey {
    // 计数
    COUNT = 'COUNT',

    // 去重计数
    COUNTDISTINCT = 'COUNTDISTINCT',

    // 求和
    SUM = 'SUM',

    // 平均值
    AVG = 'AVG',

    // 最大值
    MAX = 'MAX',

    // 最小值
    MIN = 'MIN',
}

// 原子指标表达式选择tab
export enum AtomsExpressionTabsKey {
    // 函数
    FUNC = 'func',

    // 字段
    FIELD = 'field',
}

// 运算符
export enum OperationalSymbol {
    // 加
    ADD = '+',

    // 减
    SUB = '-',

    // 乘
    MUL = '*',

    // 除
    DIV = '/',

    // 左括号
    LBRACKET = '(',

    // 右括号
    RBRACKET = ')',
}

// 元素类型
export enum EditContentElementType {
    // 基础
    BasicInput = 'Input',

    // 运算函数输入
    OperationalInput = 'OperationalInput',

    // 运算符
    OperationSymbol = 'OperationSymbol',
}

/**
 * 运算符自动补全
 */
export const operationOptions = [
    {
        value: 'COUNT()',
        label: 'COUNT(column)',
    },
    {
        value: 'COUNT(DISTINCT)',
        label: 'COUNT(DISTINCT column)',
    },
    {
        value: 'SUM()',
        label: 'SUM(column)',
    },
    {
        value: 'AVG()',
        label: 'AVG(column)',
    },
    {
        value: 'MAX()',
        label: 'MAX(column)',
    },
    {
        value: 'MIN()',
        label: 'MIN(column)',
    },
]

/**
 * 函数计算匹配
 */
export const operationOptionsReg = [
    {
        RegExp: /^(COUNT\(\)|COUNT)$/,
        value: `COUNT()`,
    },
    {
        RegExp: /^COUNT\(DISTINCT([\s]*)\)$/,
        value: `COUNT(DISTINCT)`,
    },
    {
        RegExp: /^(SUM\(\)|SUM)$/,
        value: `SUM()`,
    },
    {
        RegExp: /^(AVG\(\)|AVG)$/,
        value: `AVG()`,
    },
    {
        RegExp: /^(MAX\(\)|MAX)$/,
        value: `MAX()`,
    },
    {
        RegExp: /^(MIN\(\)|MIN)$/,
        value: `MIN()`,
    },
]

export const changeFuncValues = (value: string): [string, string, string] => {
    const paramsKey = value.match('DISTINCT') ? 'DISTINCT' : ''
    const params =
        value
            .match(/\([^)]+\)/)?.[0]
            .replace(/[()]/g, '')
            .replace('DISTINCT ', '') || ''
    const funcName = value.match(/^[A-Z]+/)?.[0] || ''

    return [funcName, params, paramsKey]
}

export const checkFuncNameReg = /^(SUM|COUNT|AVG|MAX|MIN){1}$/

/**
 * 运算符自动补全
 */
export const onlyFuncNameOptions = [
    {
        value: 'COUNT',
        label: 'COUNT(column)',
        params: '',
    },
    {
        value: 'COUNT ',
        label: 'COUNT(DISTINCT column)',
        params: 'DISTINCT',
    },
    {
        value: 'SUM',
        label: 'SUM(column)',
        params: '',
    },
    {
        value: 'AVG',
        label: 'AVG(column)',
        params: '',
    },
    {
        value: 'MAX',
        label: 'MAX(column)',
        params: '',
    },
    {
        value: 'MIN',
        label: 'MIN(column)',
        params: '',
    },
]

/**
 * 算子类型
 */
export enum FormulaType {
    // 无操作
    NONE = 'none',

    // 业务表
    FORM = 'form',

    // 过滤
    WHERE = 'where',

    // 原子指标-指标定义
    ATOM = 'atom',

    // 衍生指标-指标定义
    DERIVED = 'derived',

    // 复合指标-指标定义
    COMPOSITE = 'composite',

    // 度量计算指标-指标定义
    INDICATOR_MEASURE = 'indicator_measure',
}

/**
 * 字段类型
 */
export enum FieldTypes {
    INT = 'int',
    FLOAT = 'float',
    DECIMAL = 'decimal',
    NUMBER = 'number',
    CHAR = 'char',
    DATE = 'date',
    DATETIME = 'datetime',
    BOOL = 'bool',
    BINARY = 'binary',
    TIME = 'time',
}

export enum IndicatorType {
    // 原子指标
    ATOM = 'atom',

    // 衍生指标
    DERIVED = 'derived',
}

export const groupDate = [FieldTypes.DATE, FieldTypes.DATETIME]

/**
 * 字段类型对应能选择的度量规则和限定条件
 * polymerizationOptions-度量规则
 * limitListOptions-限定条件
 */
export const fieldInfos = {
    [FieldTypes.INT]: {
        name: __('整数型'),
        polymerizationOptions: [
            {
                label: __('计数'),
                value: 'COUNT',
            },
            {
                label: __('去重计数'),
                value: 'COUNT(DISTINCT)',
            },
            {
                label: __('求和'),
                value: 'SUM',
                default: true,
            },
            {
                label: __('最大值'),
                value: 'MAX',
            },
            {
                label: __('最小值'),
                value: 'MIN',
            },
            {
                label: __('平均值'),
                value: 'AVG',
            },
        ],
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
            //     label: __('属于码值'),
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
    [FieldTypes.FLOAT]: {
        name: __('小数型'),
        polymerizationOptions: [
            {
                label: __('计数'),
                value: 'COUNT',
            },
            {
                label: __('去重计数'),
                value: 'COUNT(DISTINCT)',
            },
            {
                label: __('求和'),
                value: 'SUM',
                default: true,
            },
            {
                label: __('最大值'),
                value: 'MAX',
            },
            {
                label: __('最小值'),
                value: 'MIN',
            },
            {
                label: __('平均值'),
                value: 'AVG',
            },
        ],
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
            //     label: __('属于码值'),
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
    [FieldTypes.DECIMAL]: {
        name: __('高精度型'),
        polymerizationOptions: [
            {
                label: __('计数'),
                value: 'COUNT',
            },
            {
                label: __('去重计数'),
                value: 'COUNT(DISTINCT)',
            },
            {
                label: __('求和'),
                value: 'SUM',
                default: true,
            },
            {
                label: __('最大值'),
                value: 'MAX',
            },
            {
                label: __('最小值'),
                value: 'MIN',
            },
            {
                label: __('平均值'),
                value: 'AVG',
            },
        ],
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
            //     label: __('属于码值'),
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
    [FieldTypes.NUMBER]: {
        name: __('数字型'),
        polymerizationOptions: [
            {
                label: __('计数'),
                value: 'COUNT',
            },
            {
                label: __('去重计数'),
                value: 'COUNT(DISTINCT)',
            },
            {
                label: __('求和'),
                value: 'SUM',
                default: true,
            },
            {
                label: __('最大值'),
                value: 'MAX',
            },
            {
                label: __('最小值'),
                value: 'MIN',
            },
            {
                label: __('平均值'),
                value: 'AVG',
            },
        ],
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
        polymerizationOptions: [
            {
                label: __('计数'),
                value: 'COUNT',
            },
            {
                label: __('去重计数'),
                value: 'COUNT(DISTINCT)',
                default: true,
            },
        ],
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
        polymerizationOptions: [
            {
                label: __('计数'),
                value: 'COUNT',
                default: true,
            },
        ],
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
        polymerizationOptions: [
            {
                label: __('计数'),
                value: 'COUNT',
            },
            {
                label: __('去重计数'),
                value: 'COUNT(DISTINCT)',
                default: true,
            },
        ],
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
        polymerizationOptions: [
            {
                label: __('计数'),
                value: 'COUNT',
                default: true,
            },
        ],
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
        polymerizationOptions: [
            {
                label: __('计数'),
                value: 'COUNT',
                default: true,
            },
        ],
        // 无法识别内容，故不支持限定
        limitListOptions: [],
    },
    [FieldTypes.TIME]: {
        name: __('时间型'),
        polymerizationOptions: [],
        // 无法识别内容，故不支持限定
        limitListOptions: [],
    },
}

export const AllLimitListOptions = Object.keys(fieldInfos).reduce(
    (prev: any, key: string) => {
        const list = fieldInfos[key]?.limitListOptions || []
        return [...prev, ...list]
    },
    [],
)

/**
 * 无内容限制条件
 */
export const noContentLimit = ['true', 'false', 'null', 'not null']

/**
 * 限定类型
 */
export enum LimitType {
    // 普通限定
    NormalLimit = 'normalLimit',

    // 时间限定
    timeLimit = 'timeLimit',
}
// type Changed
export const changeFormatToType = (famatType) => {
    switch (true) {
        case dataTypeMapping.int.includes(famatType):
            return FieldTypes.INT
        case dataTypeMapping.float.includes(famatType):
            return FieldTypes.FLOAT
        case dataTypeMapping.decimal.includes(famatType):
            return FieldTypes.DECIMAL
        case dataTypeMapping.number.includes(famatType) || famatType === '0':
            return FieldTypes.NUMBER
        case dataTypeMapping.char.includes(famatType) || famatType === '1':
            return FieldTypes.CHAR
        case dataTypeMapping.date.includes(famatType) || famatType === '2':
            return FieldTypes.DATE
        case dataTypeMapping.datetime.includes(famatType) || famatType === '3':
            return FieldTypes.DATETIME
        case dataTypeMapping.time.includes(famatType) || famatType === '9':
            return FieldTypes.TIME
        case dataTypeMapping.bool.includes(famatType) || famatType === '5':
            return FieldTypes.BOOL
        case dataTypeMapping.binary.includes(famatType) || famatType === '6':
            return FieldTypes.BINARY
        default:
            return ''
    }
}

// 表达式正则全局匹配
export const atomsExpressionRegx =
    /((COUNT|SUM|AVG|MAX|MIN)\(([{}a-zA-Z0-9\s-]*)\))|([+\-*/()]{1})|([0-9]+)/g

export const atomsFuncRegx =
    /^(COUNT|SUM|AVG|MAX|MIN)\(((DISTINCT[\s]){1}])*([{}a-zA-Z0-9\s-]*)\)$/

export const operationRegx = /^[+\-*/()]{1}$/

export const numberValueRegx = /^[0-9]+$/

export const compositeExpressionRegx =
    /([{}a-zA-Z0-9]+)|([+\-*/()]{1})|([0-9]+)/g
export const checkCompositeParamsRegx = /^({{){1}[a-zA-Z0-9-]+(}}){1}$/

export const changedRestrictData = (restrict) => {
    if (restrict) {
        const whereValue = restrict.map((a, i) => {
            const { member } = a
            return {
                ...a,
                member: member.map((b, j) => {
                    const { field, operator, value } = b
                    // const findItem = preOutData.find(
                    //     (c) =>
                    //         c.id === field.id && c.sourceId === field.sourceId,
                    // )
                    // if (!findItem) {
                    //     setTimeout(() => {
                    //         form.setFields([
                    //             {
                    //                 name: ['where', i, 'member', j, 'field'],
                    //                 errors: [__('字段被删除')],
                    //             },
                    //         ])
                    //     }, 450)
                    //     return { field: undefined }
                    // }
                    // const findItemDataType =
                    //     findItem?.data_type ||
                    //     fieldsData.data.find((d) => d.id === findItem.id)
                    //         ?.data_type
                    // const fieldDataType =
                    //     field?.data_type ||
                    //     fieldsData.data.find((d) => d.id === field.id)
                    //         ?.data_type
                    // if (findItemDataType !== fieldDataType) {
                    //     setTimeout(() => {
                    //         form.setFields([
                    //             {
                    //                 name: ['where', i, 'member', j, 'field'],
                    //                 errors: [__('字段类型变更')],
                    //             },
                    //         ])
                    //     }, 450)
                    //     return {
                    //         field: `${findItem.id}_${findItem.sourceId}`,
                    //     }
                    // }
                    let realValue = value
                    switch (changeFormatToType(b.field_type)) {
                        case FieldTypes.INT:
                        case FieldTypes.FLOAT:
                        case FieldTypes.DECIMAL:
                        case FieldTypes.NUMBER:
                            if (limitAndBelongList.includes(operator)) {
                                realValue = value.split(',')
                            }
                            break
                        case FieldTypes.CHAR:
                            if (limitAndBelongList.includes(operator)) {
                                realValue = value.split(',')
                            }
                            break
                        case FieldTypes.DATE:
                        case FieldTypes.DATETIME:
                            if (beforeTime.includes(operator)) {
                                const valueArr = value.split(' ')
                                realValue = {
                                    dateNumber: valueArr[0],
                                    unit: valueArr[1],
                                }
                            } else if (limitDateRanger.includes(operator)) {
                                realValue = {
                                    date: value
                                        .split(',')
                                        .map((info) => moment(info)),
                                }
                            }
                            break
                        default:
                            break
                    }
                    return {
                        ...b,
                        value: realValue,
                    }
                }),
            }
        })
        return whereValue
    }
    return restrict
}

export const checkAtomsRightRegx =
    /^(([(]{1})*((((COUNT|SUM|AVG|MAX|MIN)\(([{}a-zA-Z0-9-]*)\))+)|([0-9]+))+([+\-*/]{1})+)*(([()]{1})*((((COUNT|SUM|AVG|MAX|MIN)\(([{}a-zA-Z0-9-]*)\))+)|([0-9]+))+([+\-*/]{1})+)*((((COUNT|SUM|AVG|MAX|MIN)\(([{}a-zA-Z0-9-]*)\))+)|([0-9]+)([)]{1})*)+$/

export const checkcCompositeRightRegx =
    /^([(]*((([{}a-zA-Z0-9-]+)))+([+\-*/]{1})[}]*)*(([{}a-zA-Z0-9-]+))[)]*$/

export enum ExpressionStatus {
    NORMAL = 'normal',
    Empty = 'Empty',
    Error = 'Error',
}

export enum RestrictType {
    // 时间限定
    TimeRestrict = 'time_restrict',

    ModifierRestrict = 'modifier_restrict',
}
export const FormatTypeTXT = {
    [FieldTypes.INT]: __('整数型'),
    [FieldTypes.FLOAT]: __('小数型'),
    [FieldTypes.DECIMAL]: __('高精度型'),
    [FieldTypes.NUMBER]: __('数字型'),
    [FieldTypes.CHAR]: __('字符型'),
    [FieldTypes.DATE]: __('日期型'),
    [FieldTypes.DATETIME]: __('日期时间型'),
    [FieldTypes.BOOL]: __('布尔型'),
    [FieldTypes.BINARY]: __('二进制'),
}

export const ownerRoleId = '00002fb7-1e54-4ce1-bc02-626cb1f85f62'

export const indicatorLevel = [
    {
        label: 'T1',
        value: 'T1',
    },
    {
        label: 'T2',
        value: 'T2',
    },
    {
        label: 'T3',
        value: 'T3',
    },
]
export const updateCycle = [
    {
        label: __('天'),
        value: 'day',
    },
    {
        label: __('周'),
        value: 'week',
    },
    {
        label: __('月度'),
        value: 'month',
    },
    {
        label: __('季度'),
        value: 'quarter',
    },
    {
        label: __('年度'),
        value: 'year',
    },
]

export const businessDetailInfo = [
    { label: __('指标名称'), value: '', key: 'name' },
    { label: __('指标类型'), value: '', key: 'indicator_type' },
    { label: __('关联业务指标'), value: '', key: 'business_indicator_name' },
    { label: __('编码'), value: '', key: 'code' },
    { label: __('指标等级'), value: '', key: 'level' },
    { label: __('指标单位'), value: '', key: 'indicator_unit' },
    { label: __('指标定义'), value: '', key: 'description', span: 24 },
]

export const manageDetailInfo = [
    { label: __('所属主题'), value: '', key: 'domain_name' },
    {
        label: __('所属部门'),
        value: '',
        key: 'management_department_name',
    },
    { label: __('数据 Owner'), value: '', key: 'owners', span: 24 },
    { label: __('创建人'), value: '', key: 'creator_name' },
    { label: __('创建时间'), value: '', key: 'created_at' },
    { label: __('更新人'), value: '', key: 'updater_name' },
    { label: __('更新时间'), value: '', key: 'updated_at' },
]

export const enum BusinessDomainType {
    subject_domain_group = 'subject_domain_group',
    subject_domain = 'subject_domain',
    business_object = 'business_object',
    business_activity = 'business_activity',
    logic_entity = 'logic_entity',
}

export const technologyDetailInfo = {
    [TabsKey.ATOMS]: [
        {
            label: __('关联库表'),
            value: '',
            key: 'refer_view_name',
            showUnderLine: true,
        },
        {
            label: __('日期时间标识'),
            value: '',
            key: 'date_mark',
        },
        {
            label: __('分析维度'),
            value: '',
            key: 'analysis_dimensions',
            span: 24,
        },
        { label: __('表达式'), value: '', key: 'expression', span: 24 },
        { label: __('SQL'), value: '', key: 'exec_sql', span: 24 },
    ],
    [TabsKey.DERIVE]: [
        {
            label: __('更新周期'),
            value: '',
            key: 'update_cycle',
        },
        {
            label: __('依赖原子指标'),
            value: '',
            key: 'atomic_indicator_name',
            showUnderLine: true,
        },

        {
            label: __('分析维度'),
            value: '',
            key: 'analysis_dimensions',
            span: 24,
        },
        {
            label: __('时间限定'),
            value: '',
            key: 'time_restrict',
            span: 24,
        },
        {
            label: __('业务限定'),
            value: '',
            key: 'where_info',
            span: 24,
        },
        { label: __('SQL'), value: '', key: 'exec_sql', span: 24 },
    ],
    [TabsKey.RECOMBINATION]: [
        { label: __('更新周期'), value: '', key: 'update_cycle', span: 24 },
        {
            label: __('分析维度'),
            value: '',
            key: 'analysis_dimensions',
            span: 24,
        },
        { label: __('表达式'), value: '', key: 'expression', span: 24 },
        { label: __('SQL'), value: '', key: 'exec_sql', span: 24 },
    ],
}

export const ROW_HEIGHT = 32
export const ROW_MARGIN = 16

// 指标详情的也的tab
export enum IndicatorDetailTabKey {
    // 详情
    Detail = 'detail',

    // 血缘
    Consanguinity = 'consanguinity',

    // 数据预览
    DataPreview = 'data_preview',
}
export enum OperateType {
    // 创建
    CREATE = 'create',

    // 编辑
    EDIT = 'edit',

    // 详情
    DETAIL = 'detail',
}

/**
 * 获取Query数据
 */
const getQueryData = (search: string): any => {
    const keyValueData = search
        .replace(/^\?{1}/, '')
        .replace('?', '&')
        .split('&')
        .filter((current) => current)
    const queryData = keyValueData.reduce((preData, currentData) => {
        const [key, value] = currentData.split('=')
        return {
            ...preData,
            [key]: value,
        }
    }, {})
    return queryData
}

/**
 * 组装url
 * @param params
 * @returns
 */
export const changeUrlData = (
    params: { [key: string]: string },
    deleteParams: Array<string> = [],
    targetUrl: string = '',
) => {
    const url = targetUrl || window.location.pathname
    const queryData = getQueryData(window.location.search)
    const newData = { ...queryData, ...params }
    const searchData = Object.keys(newData)
        .filter((currentData) => !deleteParams.includes(currentData))
        .map((currentData) => `${currentData}=${newData[currentData]}`)
    return searchData.length ? `${url}?${searchData.join('&')}` : url
}

/**
 * 算子相关信息
 */
export const formulaInfo = {
    [FormulaType.FORM]: {
        name: __('引用库表'),
        featureTip: __('从我的可用资源引用库表'),
    },
    [FormulaType.WHERE]: {
        name: __('数据过滤'),
        featureTip: __('筛选出符合条件的数据'),
    },
    [FormulaType.ATOM]: {
        name: __('原子指标'),
        featureTip: __('原子指标'),
    },
    [FormulaType.DERIVED]: {
        name: __('衍生指标'),
        featureTip: __('衍生指标'),
    },
    [FormulaType.INDICATOR_MEASURE]: {
        name: __('度量计算'),
        featureTip: __('度量计算'),
    },
}

/**
 * 节点数据类型
 */
export enum NodeDataType {
    // 输入
    INPUT = 'INPUT',
    // 连接
    JOIN = 'JOIN',
    // 输出
    OUTPUT = 'OUTPUT',
}

/**
 * 场景分析对应模块类型
 */
export enum ModuleType {
    // 场景分析
    SceneAnalysis = 'sceneAnalysis',
    // 库表
    LogicEntityView = 'logic_entity',
    // 自定义库表
    CustomView = 'custom',
}

/**
 * 库表模式
 * @param Definition 模式
 * @param More 更多信息
 */
export enum ModeType {
    Definition = 'definition',
    More = 'more',
}

/**
 * 算子错误类型
 */
export enum FormulaError {
    MissingLine = 'missingLine',
    MoreLine = 'moreLine',
    IndexError = 'indexError',
    MissingData = 'missingData',
    ConfigError = 'configError',
    NodeChange = 'nodeChange',
    IsPolicy = 'isPolicy',
}

export const configErrorList: any[] = [
    FormulaError.ConfigError,
    FormulaError.IsPolicy,
]

/**
 * 桩配置
 */
export const portconfig = {
    groups: {
        in: {
            position: 'left',
            markup: [
                {
                    tagName: 'rect',
                    selector: 'wrap',
                },
                {
                    tagName: 'circle',
                    selector: 'point',
                },
            ],
            attrs: {
                wrap: {
                    width: 24,
                    height: 24,
                    x: -12,
                    y: -12,
                    magnet: true,
                    fill: 'transparent',
                },
                point: {
                    r: 4,
                    fill: '#fff',
                    stroke: '#BFBFBF',
                    strokeWidth: 1,
                    magnet: true,
                },
            },
        },
        out: {
            position: 'right',
            markup: [
                {
                    tagName: 'rect',
                    selector: 'wrap',
                },
                {
                    tagName: 'circle',
                    selector: 'point',
                },
            ],
            attrs: {
                wrap: {
                    width: 24,
                    height: 24,
                    x: -12,
                    y: -12,
                    magnet: true,
                    fill: 'transparent',
                },
                point: {
                    r: 4,
                    fill: '#fff',
                    stroke: '#BFBFBF',
                    strokeWidth: 1,
                    magnet: true,
                },
            },
        },
    },
}

/**
 * 指标管理节点配置
 */
export const nodeTemplate = {
    shape: 'scene-analysis-node',
    width: 140,
    height: 130,
    position: {
        x: 600,
        y: 100,
    },
    data: {
        name: '',
        formula: [],
        src: [],
        output_fields: [],
        // 展开状态 true-展开
        expand: true,
        // 可执行状态 true-可执行
        executable: false,
        // 选中状态
        selected: false,
    },
    zIndex: 9999,
}

/**
 * 字段错误类型
 */
export enum FieldErrorType {
    Empty = 'empty',
    EnEmpty = 'enEmpty',
    Repeat = 'Repeat',
    EnRepeat = 'enRepeat',
    Inconformity = 'inconformity',
    OverLength = 'overlength',
    IllegalCharacter = 'illegalCharacter',
}

/**
 * 关联方式
 */
export enum JoinType {
    // 左联接
    LEFT = 'left',

    // 右联接
    RIGHT = 'right',

    // 内联接
    INNER = 'inner',

    // 全外联接
    FULLOUT = 'full out',
}

/**
 * 算子配置方式
 */
export enum ConfigType {
    // sql
    SQL = 'sql',

    // 字段限定/字段聚合
    VIEW = 'view',
}

export const funcOptions = [
    {
        label: __('计数'),
        value: 'COUNT',
        showTypes: [
            FieldTypes.INT,
            FieldTypes.FLOAT,
            FieldTypes.DECIMAL,
            FieldTypes.NUMBER,
            FieldTypes.CHAR,
            FieldTypes.DATE,
            FieldTypes.DATETIME,
            FieldTypes.BOOL,
        ],
    },
    {
        label: __('去重计数'),
        value: 'COUNT(DISTINCT)',
        showTypes: [
            FieldTypes.INT,
            FieldTypes.FLOAT,
            FieldTypes.DECIMAL,
            FieldTypes.NUMBER,
            FieldTypes.CHAR,
            FieldTypes.DATE,
        ],
    },
    {
        label: __('求和'),
        value: 'SUM',
        showTypes: [
            FieldTypes.INT,
            FieldTypes.FLOAT,
            FieldTypes.DECIMAL,
            FieldTypes.NUMBER,
        ],
    },
    {
        label: __('最大值'),
        value: 'MAX',
        showTypes: [
            FieldTypes.INT,
            FieldTypes.FLOAT,
            FieldTypes.DECIMAL,
            FieldTypes.NUMBER,
        ],
    },
    {
        label: __('最小值'),
        value: 'MIN',
        showTypes: [
            FieldTypes.INT,
            FieldTypes.FLOAT,
            FieldTypes.DECIMAL,
            FieldTypes.NUMBER,
        ],
    },
    {
        label: __('平均值'),
        value: 'AVG',
        showTypes: [
            FieldTypes.INT,
            FieldTypes.FLOAT,
            FieldTypes.DECIMAL,
            FieldTypes.NUMBER,
        ],
    },
]

export enum UnitEnum {
    CURRENCY /** 货币单位 */,
    TIME /** 时间单位 */,
    SCALE /** 比例单位 */,
    RANK /** 名次 */,
    QUANTIFIER /** 对象量词 */,
    WEIGHT /** 重量单位 */,
}

export const UnitName = [
    '货币单位',
    '时间单位',
    '比例单位',
    '名次',
    '对象量词',
    '重量单位',
]

export const UnitType = [
    [
        '分(人民币)',
        '元(人民币)',
        '万元(人民币)',
        '百万元(人民币)',
        '亿元(人民币)',
        '分(美元)',
        '元(美元)',
        '分(欧元)',
    ],
    ['日', '月', '周', '年', '小时', '分钟', '秒', '季', '毫秒'],
    ['小数', '百分位数', '千分位数'],
    ['排名'],
    ['户', '笔', '件', '个', '次', '人日', '家', '手', '张', '包'],
    ['吨', '公斤'],
]
export enum DragBoxType {
    // 选择列表
    SELECT_LIST = 'select_list',

    // 行列表
    ROW_LIST = 'row_list',

    // 列列表
    COLUMN_LIST = 'column_list',
}

export const limitNumber = ['<', '<=', '>', '>=', '=', '<>']

export const limitList = ['in list']

export const BelongList = ['belong']

// 字符型的操作数组
export const limitString = [
    'include',
    'not include',
    'prefix',
    'not prefix',
    '=',
    '<>',
]

export const currentTime = ['current']
export const limitBoolean = ['null', 'not null']

/**
 * 日期时间可选项
 */
export const DateSelectOptions = [
    {
        label: __('今日'),
        value: 'today',
    },
    {
        label: __('昨日'),
        value: 'yesterday',
    },

    {
        label: __('本周'),
        value: 'the week',
    },
    {
        label: __('上周'),
        value: 'last week',
    },
    {
        label: __('本月'),
        value: 'the month',
    },
    {
        label: __('上月'),
        value: 'last month',
    },
    {
        label: __('本季度'),
        value: 'the quarter',
    },
    {
        label: __('上季度'),
        value: 'last quarter',
    },
    {
        label: __('本年'),
        value: 'the year',
    },
    {
        label: __('去年'),
        value: 'last year',
    },
    {
        label: __('近${count}日', { count: 30 }),
        value: '30 day',
    },
    {
        label: __('近${count}日', { count: 180 }),
        value: '180 day',
    },
    {
        label: __('近${count}日', { count: 365 }),
        value: '365 day',
    },
    {
        label: __('近${count}年', { count: 3 }),
        value: '3 year',
    },
]

/**
 *  日期转换成时间范围
 * @param value
 * @returns
 */
export const dateSelectOptionFormat = (value): Array<string> => {
    switch (value) {
        case 'today':
            return [
                moment().startOf('day').format('YYYY-MM-DD HH:mm:ss'),
                moment().format('YYYY-MM-DD HH:mm:ss'),
            ]
        case 'yesterday':
            return [
                moment()
                    .subtract(1, 'day')
                    .startOf('day')
                    .format('YYYY-MM-DD HH:mm:ss'),
                moment()
                    .subtract(1, 'day')
                    .endOf('day')
                    .format('YYYY-MM-DD HH:mm:ss'),
            ]
        case '30 day':
            return [
                moment()
                    .subtract(30, 'day')
                    .startOf('day')
                    .format('YYYY-MM-DD HH:mm:ss'),
                moment().format('YYYY-MM-DD HH:mm:ss'),
            ]
        case '180 day':
            return [
                moment()
                    .subtract(180, 'day')
                    .startOf('day')
                    .format('YYYY-MM-DD HH:mm:ss'),
                moment().format('YYYY-MM-DD HH:mm:ss'),
            ]
        case '365 day':
            return [
                moment()
                    .subtract(365, 'day')
                    .startOf('day')
                    .format('YYYY-MM-DD HH:mm:ss'),
                moment().format('YYYY-MM-DD HH:mm:ss'),
            ]
        case 'the week':
            return [
                moment().startOf('week').format('YYYY-MM-DD HH:mm:ss'),
                moment().format('YYYY-MM-DD HH:mm:ss'),
            ]
        case 'last week':
            return [
                moment()
                    .subtract(1, 'week')
                    .startOf('week')
                    .format('YYYY-MM-DD HH:mm:ss'),
                moment()
                    .subtract(1, 'week')
                    .endOf('week')
                    .format('YYYY-MM-DD HH:mm:ss'),
            ]
        case 'the month':
            return [
                moment().startOf('month').format('YYYY-MM-DD HH:mm:ss'),
                moment().format('YYYY-MM-DD HH:mm:ss'),
            ]
        case 'last month':
            return [
                moment()
                    .subtract(1, 'month')
                    .startOf('month')
                    .format('YYYY-MM-DD HH:mm:ss'),
                moment()
                    .subtract(1, 'month')
                    .endOf('month')
                    .format('YYYY-MM-DD HH:mm:ss'),
            ]
        case 'the quarter':
            return [
                moment().startOf('quarter').format('YYYY-MM-DD HH:mm:ss'),
                moment().format('YYYY-MM-DD HH:mm:ss'),
            ]
        case 'last quarter':
            return [
                moment()
                    .subtract(1, 'quarter')
                    .startOf('quarter')
                    .format('YYYY-MM-DD HH:mm:ss'),
                moment()
                    .subtract(1, 'quarter')
                    .endOf('quarter')
                    .format('YYYY-MM-DD HH:mm:ss'),
            ]
        case 'the year':
            return [
                moment().startOf('year').format('YYYY-MM-DD HH:mm:ss'),
                moment().format('YYYY-MM-DD HH:mm:ss'),
            ]
        case 'last year':
            return [
                moment()
                    .subtract(1, 'year')
                    .startOf('year')
                    .format('YYYY-MM-DD HH:mm:ss'),
                moment()
                    .subtract(1, 'year')
                    .endOf('year')
                    .format('YYYY-MM-DD HH:mm:ss'),
            ]
        case '3 year':
            return [
                moment()
                    .subtract(2, 'year')
                    .startOf('year')
                    .format('YYYY-MM-DD HH:mm:ss'),
                moment().format('YYYY-MM-DD HH:mm:ss'),
            ]
        default:
            return []
    }
}

/**
 * 将配置数据转换为预览参数的对象。
 *
 * 此函数接收一个配置数据对象，该对象包含了表格分析的行列配置、筛选器配置及时间约束。
 * 函数返回一个对象，其中包含了转换后的行列维度、筛选器条件及时间约束，用于生成数据预览。
 *
 * @param configData 配置数据对象，包含了行列配置、筛选器配置及时间约束。
 * @returns 返回一个对象，包含了转换后的行列维度、筛选器条件及时间约束。
 */
export const changeDataToPreviewParams = (configData) => {
    return {
        dimensions: [...configData.pivot_rows, ...configData.pivot_columns].map(
            (currentData) => ({
                field_id: currentData.field_id,
                format: currentData.format,
            }),
        ),
        filters: configData.filters.map((currentData) => {
            return [FieldTypes.DATE, FieldTypes.DATETIME].includes(
                changeFormatToType(currentData?.data_type) as any,
            )
                ? {
                      field_id: currentData.field_id,
                      operator: 'between',
                      value: timeFilterToChange(
                          currentData.value,
                          currentData.operator,
                      ),
                  }
                : {
                      field_id: currentData.field_id,
                      operator: currentData.operator,
                      value: currentData.value,
                  }
        }),
        time_constraint: timeConstraintToChange(configData.time_constraint[0]),
        metrics: configData.metrics,
        row_filter: {},
    }
}
// 日期时间选择项
export const TimeDateOptions = [
    {
        label: __('年'),
        value: '%Y',
        dateType: 'year',
        formatRegx: 'YYYY',
    },
    {
        label: __('季度'),
        value: '%Y-Q%q',
        dateType: 'quarter',
        formatRegx: 'YYYY-Qo',
    },
    {
        label: __('月'),
        value: '%Y-%m',
        dateType: 'month',
        formatRegx: 'YYYY-MM',
    },
    {
        label: __('周'),
        value: '%x-%v',
        dateType: 'week',
        formatRegx: 'YYYY-ww',
    },
    {
        label: __('日'),
        value: '%Y-%m-%d',
        dateType: 'day',
        formatRegx: 'YYYY-MM-DD',
    },
]

/**
 * 根据时间限制条件转换时间值。
 *
 * 此函数用于根据给定的操作符（是否为'before'）来转换时间值的格式。
 * 如果操作符为'before'，则将时间值格式化为指定的日期选择器选项格式，并返回开始时间和结束时间。
 * 如果操作符不为'before'，则直接返回原始时间值的开始时间和结束时间。
 *
 * @param data 包含操作符和时间值的对象。
 * @returns 返回一个对象，包含开始时间和结束时间。
 */
export const timeConstraintToChange = (data) => {
    if (data.operator === 'before') {
        const newTimeValue = dateSelectOptionFormat(data.value[0])

        return {
            start_time: newTimeValue[0],
            end_time: newTimeValue[1],
        }
    }
    return {
        start_time: moment(data.value[0])
            .startOf('day')
            .format('YYYY-MM-DD HH:mm:ss'),
        end_time: moment(data.value[1])
            .endOf('day')
            .format('YYYY-MM-DD HH:mm:ss'),
    }
}

/**
 * 根据指定类型对时间进行过滤，以生成新的时间范围
 * 主要用于根据用户选择的时间类型（如“before”或“current”）调整时间范围
 *
 * @param value 一个字符串数组，代表用户选择的时间值，不同类型的选项需要不同的输入
 * @param type 一个字符串，指定要应用的时间类型，可以是'before'或'current'
 * @returns 返回一个包含两个字符串的数组，表示新的时间范围的开始和结束如果类型不匹配，则返回原始值
 */
export const timeFilterToChange = (value: Array<string>, type) => {
    // 当类型为'before'时，计算从过去某个时间点到现在的时段
    if (type === 'before') {
        // 查找当前时间选项
        const currentTimeOption = TimeDateOptions.find(
            (current) => current.dateType === value[1],
        )
        // 获取日期类型，默认为'day'
        const dateType = currentTimeOption?.dateType || 'day'

        // 返回计算后的时段开始和结束时间
        return [
            moment()
                .subtract(value[0], dateType as any)
                .startOf('day')
                .format('YYYY-MM-DD HH:mm:ss'),

            moment().format('YYYY-MM-DD HH:mm:ss'),
        ]
    }
    // 当类型为'current'时，计算从当前时间开始的时段
    if (type === 'current') {
        // 查找当前时间选项
        const currentTimeOption = TimeDateOptions.find(
            (current) => current.dateType === value[0],
        )
        // 获取日期类型，默认为'day'
        const dateType = currentTimeOption?.dateType || 'day'

        // 返回计算后的时段开始和结束时间
        return [
            moment()
                .startOf(dateType as any)
                .format('YYYY-MM-DD HH:mm:ss'),
            moment().format('YYYY-MM-DD HH:mm:ss'),
        ]
    }
    // 如果类型不是'before'或'current'，直接返回传入的值
    return value
}

/**
 * 默认预览配置
 */
export const defaultPreviewConfig = {
    pivot_rows: [],
    pivot_columns: [],
    filters: [],
    time_constraint: [
        {
            operator: 'before',
            value: ['30 day'],
        },
    ],
    metrics: undefined,
}
/**
 * 将配置对象转换为保存参数。
 *
 * 此函数接收一个配置对象，该对象包含了表格分析的各类设置，如行列聚合字段、筛选条件及时间约束。
 * 函数返回一个新的对象，该对象的结构更适合用于保存或传递这些配置。
 *
 * @param config 配置对象，包含了行列设置、筛选条件及时间约束。
 * @returns 返回一个新的对象，包含了转换后的行列设置、筛选条件及时间约束，以便于保存或传递。
 */
export const changeDataToSaveParams = (config) => {
    // 解构配置对象中的行列设置、筛选条件及时间约束
    const { pivot_rows, pivot_columns, filters, time_constraint, metrics } =
        config
    // 转换行列设置为保存格式
    const pivotRows = pivot_rows.map((currentData) => ({
        table_id: currentData.table_id,
        field_id: currentData.field_id,
        format: currentData.format,
    }))

    // 转换列设置为保存格式
    const pivotColumns = pivot_columns.map((currentData) => ({
        table_id: currentData.table_id,
        field_id: currentData.field_id,
        format: currentData.format,
    }))

    // 转换筛选条件为保存格式
    const filtersTransformed = filters.map((currentData) => ({
        table_id: currentData.table_id,
        field_id: currentData.field_id,
        format: currentData.format,
        value: currentData.value,
        operator: currentData.operator,
    }))

    // 返回包含转换后的行列设置、筛选条件及时间约束的对象
    return {
        pivot_rows: pivotRows,
        pivot_columns: pivotColumns,
        filters: filtersTransformed,
        time_constraint,
        metrics,
    }
}
/**
 * 将查询结果数据转换为配置格式。
 *
 * 此函数接收查询结果数据和维度列表作为输入，将这些数据转换为适用于前端展示的配置格式。
 * 这包括将行列维度、筛选条件以及时间约束从原始数据格式转换为配置格式。
 *
 * @param resData 原始查询结果数据，包含行列维度、筛选条件和时间约束。
 * @param dimensions 维度列表，用于指定行列维度的转换规则。
 * @returns 返回转换后的配置对象，包含行列维度、筛选条件和时间约束。
 */
export const changedResDataToConfig = (resData, dimensions: Array<any>) => {
    // 解构原始数据中的行列维度、筛选条件和时间约束
    const { filters, pivot_rows, pivot_columns, time_constraint, metrics } =
        resData

    // 将行列维度转换为配置格式
    const pivotRows = convertConfigData(pivot_rows, dimensions)
    const pivotColumns = convertConfigData(pivot_columns, dimensions)

    // 将筛选条件转换为配置格式
    const filtersTransformed = convertConfigData(filters, dimensions)

    // 返回转换后的配置对象
    return {
        pivot_rows: pivotRows,
        pivot_columns: pivotColumns,
        filters: filtersTransformed,
        time_constraint,
        metrics,
    }
}

/**
 * 根据给定的维度信息，转换配置数据。
 * 此函数接收一个数据数组和一个维度数组，返回一个经过筛选的新数组，其中仅包含与维度数组中field_id匹配的项。
 * @param data 原始数据数组，每个项包含一个field_id。
 * @param dimensions 维度数组，每个项包含一个field_id。
 * @returns 返回一个新的数组，其中包含来自原始数据数组且其field_id在维度数组中找到对应项的所有数据。
 */
export const convertConfigData = (data, dimensions) => {
    // 遍历原始数据数组，对每个项进行处理
    return (
        data
            .map((currentData) => {
                // 在维度数组中查找与当前数据field_id匹配的项
                const findField = dimensions.find(
                    (itemData) => itemData.field_id === currentData.field_id,
                )
                // 返回查找到的项和当前配置并集，如果未找到，则返回undefined
                return findField
                    ? {
                          ...findField,
                          ...currentData,
                      }
                    : findField
            })
            // 过滤掉所有返回undefined的项，只保留找到对应维度的项
            .filter((currentData) => !!currentData)
    )
}

/**
 * 获取操作符的标签
 *
 * 本函数旨在通过操作符和类型参数来获取对应的操作符标签主要用于界面展示
 * 它通过查找特定类型的操作符信息来实现这一目的
 *
 * @param operator {string} - 操作符，用于标识执行的操作类型
 * @param type {string} - 类型，用于指定操作符所属的类别
 * @returns {string} - 返回找到的操作符标签，如果没有找到则返回空字符串
 */
export const getOperatorLabel = (operator, type) => {
    // 查找指定类型和操作符的详细信息
    const operatorInfo = fieldInfos?.[type]?.limitListOptions.find(
        (item) => item.value === operator,
    )

    // 返回操作符的标签，如果没有找到则返回空字符串
    return operatorInfo?.label || ''
}

/**
 * 格式化日期以进行显示
 *
 * 此函数根据给定的时间和时间单位，将时间格式化为易于阅读的字符串主要用于本地化日期显示
 * 它使用moment库来处理时间格式的转换，并根据unit参数决定返回的日期格式
 *
 * @param time - 需要格式化的时间，可以是毫秒数、字符串、数值、日期对象等，只要moment(time)能够解析
 * @param unit - 时间单位，决定了返回的日期字符串的格式可能的值包括'year', 'quarter', 'month', 'week', 'day'
 * @returns 格式化后的时间字符串，格式根据unit参数决定如果unit不在预期范围内，则默认返回'YYYY-MM-DD'格式
 */
export const formatDateForDisplay = (time, unit) => {
    const momentTime = moment(time)
    switch (unit) {
        case 'year':
            return `${momentTime.format('YYYY')}${__('年')}`
        case 'quarter':
            return `${momentTime.format('YYYY')}${__('年')}Q${momentTime.format(
                'Q',
            )}`
        case 'month':
            return `${momentTime.format('YYYY')}${__('年')}${momentTime.format(
                'MM',
            )}${__('月')}`
        case 'week':
            return `${momentTime.format('YYYY')}${__('年')}${momentTime.format(
                'w',
            )}${__('周')}`
        case 'day':
            return `${momentTime.format('YYYY')}${__('年')}${momentTime.format(
                'MM',
            )}${__('月')}${momentTime.format('DD')}${__('日')}`
        default:
            return moment(time).format('YYYY-MM-DD')
    }
}

/**
 * 同环比计算方式
 */
export const sameperiodMethodMap = {
    growth_value: {
        label: __('增长值'),
        value: 'growth_value',
        tip: __('增长值 = 本期值−比较期值'),
    },
    growth_rate: {
        label: __('增长率'),
        value: 'growth_rate',
        tip: __('增长率 = (本期值−比较期值) / 比较期值*100%'),
    },
}

/**
 * 同环比时间粒度
 */
export const sameperiodTimeGranularityMap = {
    day: {
        label: __('日'),
        value: 'day',
    },
    month: {
        label: __('月'),
        value: 'month',
    },
    quarter: {
        label: __('季度'),
        value: 'quarter',
    },
    year: {
        label: __('年'),
        value: 'year',
    },
}

/**
 * 同环比名称
 */
export const sameperiodNameMap = {
    year: __('同比'),
    month: __('月环比'),
    quarter: __('季度环比'),
}

/**
 * 获取同环比示例
 */
export const getSameperiodExample = (
    timeValue, // 时间约束
    method, // 计算类型
    offset, // 偏移量
    time_granularity, // 时间粒度
) => {
    if (timeValue) {
        const { start_time, end_time } = timeConstraintToChange(timeValue)
        const start = moment(start_time).format('YYYY-MM-DD')
        const end = moment(end_time).format('YYYY-MM-DD')
        // const { method, offset, time_granularity } = form.getFieldsValue()
        const subtractStart = moment(start)
            .subtract(offset, time_granularity)
            .format('YYYY-MM-DD')
        const subtractEnd = moment(end)
            .subtract(offset, time_granularity)
            .format('YYYY-MM-DD')
        const res: any = { source: { start, end } }
        if (method?.includes('growth_value')) {
            res.growth_value = `“${start} 至 ${end}“的指标值 - “${subtractStart} 至 ${subtractEnd}“的指标值`
        }
        if (method?.includes('growth_rate')) {
            res.growth_rate = `(“${start} 至 ${end}“的指标值 - “${subtractStart} 至 ${subtractEnd}“的指标值 ) / “${subtractStart} 至 ${subtractEnd}“的指标值*100%`
        }

        return res
    }
    return {}
}

export const disabledField = (field) => {
    return field.isPolicy || field.label_is_protected
}

export const disabledFieldTips = (field) => {
    if (field.isPolicy) {
        return __('当前字段数据受脱敏管控，不能作为分析维度')
    }
    if (field.label_is_protected) {
        return __(
            '当前字段数据密级管控，不能进行度量计算，也不能作为分析维度查询其他数据',
        )
    }
    return ''
}
