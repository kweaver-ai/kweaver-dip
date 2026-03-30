import { MenuProps } from 'antd'
import __ from './locale'
import { IformItem, SearchType } from '@/ui/LightweightSearch/const'

/**
 * 查看模式
 */
export enum ViewModel {
    // 查看
    View = 'view',
    // 编辑
    Edit = 'edit',
}

// 操作类型
export enum OptionType {
    // 增加字段
    Add = 'add',

    // 删除字段
    DELETE = 'delete',

    // 配置属性
    ConfigAttr = 'configAttr',

    // 解除绑定
    Unbind = 'unbind',

    // 批量删除
    BatchDelete = 'batchDelete',

    // 批量解绑
    BatchUnbind = 'batchUnbind',
}

// 字段引用状态
export enum RefStatus {
    // 来自引用
    Refed = 'refed',

    // 非引用
    Unref = 'unref',
}

// 过滤条件参数
export const FilterItem: IformItem[] = [
    {
        label: __('引用状态'),
        key: 'refStatus',
        options: [
            { value: '', label: __('不限') },
            { value: RefStatus.Refed, label: __('引用') },
            { value: RefStatus.Unref, label: __('非引用') },
        ],
        type: SearchType.Radio,
    },
]

// 更多按钮下拉选项
export const moreDropDown: MenuProps['items'] = [
    {
        key: OptionType.BatchDelete,
        label: __('删除'),
    },
    {
        key: OptionType.BatchUnbind,
        label: __('解绑'),
    },
]

// 编码规则/码表的类型
export enum ValueRangeType {
    // 无
    None = 'no',

    // 数据元
    DataElement = 'dataElement',

    // 码表
    CodeTable = 'codeTable',

    // 编码规则
    CodeRule = 'codeRule',

    // 自定义
    Custom = 'custom',

    // 值域
    ValueRange = 'valueRange',
}

// 编码规则来源类型
export enum CodeRuleType {
    // 自定义
    Custom = 'custom',

    // 来自系统
    System = 'system',
}

/**
 * "编码规则/值域"可选项
 */
export const ValueRangeOptions = [
    {
        label: __('无限制'),
        value: ValueRangeType.None,
    },
    {
        label: __('自定义'),
        value: ValueRangeType.Custom,
    },
    {
        label: __('码表'),
        value: ValueRangeType.CodeTable,
    },
    {
        label: __('编码规则'),
        value: ValueRangeType.CodeRule,
    },
]

// 编码规则/码表的选择范围
export const CodeRuleOptions = [
    {
        label: __('从已有中选'),
        value: CodeRuleType.System,
    },
    {
        label: __('自定义'),
        value: CodeRuleType.Custom,
    },
]

/**
 * 标准详情
 */
export class StandardDataDetail {
    // 标准类型Map
    standardDetails: { [key: string]: any } = {}

    /**
     *
     * @param {codeTable} 初始使用的码表
     * @param {codeRuler} 初始使用的编码规则
     */
    constructor(codeTable: Array<any>, codeRuler: Array<any>) {
        // 构造全部的编码规则的map对象
        this.standardDetails = [...codeTable, ...codeRuler].reduce(
            (preData, currentData) => {
                return {
                    [currentData.id]: currentData,
                }
            },
            {},
        )
    }

    /**
     * 更新编码规则/码表数据
     * @param {newData} 新的编码规则/码表
     */
    updateStandardDetails(newData: Array<any>) {
        this.standardDetails = {
            ...this.standardDetails,
            ...newData.reduce((preData, currentData) => {
                return {
                    ...preData,
                    [currentData.id]: currentData,
                }
            }, {}),
        }
    }
}

/**
 * 数据字符串转换成为对象
 * @param {valueDetail} 编码规则/码表字符串
 */
export const exChangeRangeDataToObj = (valueDetail: string) => {
    const valueObj = valueDetail.split('>><<')
    return valueObj.length === 2
        ? {
              id: valueObj[0],
              name: valueObj[1],
          }
        : {
              name: valueObj[0],
          }
}

/**
 * 数据字符串转换成为对象
 * @param {valueDetail} 编码规则/码表对象
 */
export const exChangeRangeDataToString = (valueDetail: {
    name: string
    id: string
}) => {
    const valueObj = [valueDetail.id, valueDetail.name].join('>><<')
    return valueObj
}

/**
 * 码表/编码规则的状态
 */
export enum CodeStatus {
    // 已删除
    Deleted = 'deleted',

    // 已停用
    Disabled = 'disabled',

    // 正常
    Normal = 'normal',
}

/**
 * 获取当前新建标识
 */
export const getUniqueCount = (data: Array<any>) => {
    let newUnique = 0

    data.forEach((item) => {
        if (item?.uniqueId >= newUnique) {
            newUnique = item.uniqueId + 1
        }
    })
    return newUnique
}

export const needBatchField = {
    formulate_basis: {
        value: null,
        status: false,
    },

    confidential_attribute: {
        value: null,
        status: false,
    },
    field_relationship: {
        value: null,
        status: false,
    },
    is_current_business_generation: {
        value: 0,
        status: false,
    },
    is_incremental_field: {
        value: 0,
        status: false,
    },

    is_required: {
        value: 0,
        status: false,
    },
    is_standardization_required: {
        value: 0,
        status: false,
    },
    open_attribute: {
        value: null,
        status: false,
    },
    sensitive_attribute: {
        value: null,
        status: false,
    },
    shared_attribute: {
        value: null,
        status: false,
    },
    unit: {
        value: null,
        status: false,
    },
}

/**
 * 当前属性是统一值还是多项值
 */
export const getBatchValuesStatus = (fields: Array<any>, key) => {
    let initStatus = true
    let initValue = fields[0][key]
    if (fields.length < 2) {
        return {
            status: initStatus,
            value: initValue,
        }
    }
    const defaultValue = fields[0][key]
    fields.forEach((currentField) => {
        if (currentField[key] !== defaultValue) {
            initStatus = false
            initValue = null
        }
    })
    return {
        status: initStatus,
        value: initValue,
    }
}

/**
 * 生成唯一表示
 * @param fieldsData （字段数组）
 * @returns
 */
export const produceUniqueId = (fieldsData: Array<any>) => {
    return fieldsData.map((currentField, index) => ({
        ...currentField,
        uniqueId: index + 1,
    }))
}

/**
 * 消除唯一标识
 * @param fieldsData
 * @returns
 */
export const eradicateUniqueId = (fieldsData: Array<any>) => {
    return fieldsData.map((currentField) => {
        const { uniqueId, ...field } = currentField
        return field
    })
}

export const getErrorDatas = (
    fields: Array<any>,
    errors: Array<any>,
    key: string,
) => {
    let newErrorData = {}
    errors.forEach((currentError) => {
        const [baseName, index, fieldName] = currentError.name
        const id = fields[index][key]
        if (Object.keys(newErrorData).includes(id.toString())) {
            newErrorData[id] = [
                ...newErrorData[id],
                {
                    errorMessge: currentError.errors[0],
                    name: fieldName,
                },
            ]
        } else {
            newErrorData = {
                ...newErrorData,
                [id]: [
                    {
                        errorMessge: currentError.errors[0],
                        name: fieldName,
                    },
                ],
            }
        }
    })
    return newErrorData
}

// boolean选项的枚举
export enum BooleanDataType {
    YES = 1,
    NO = 0,
}

// 是否下拉的数据
export const BooleanDataOptions = [
    {
        label: __('是'),
        value: BooleanDataType.YES,
    },
    {
        label: __('否'),
        value: BooleanDataType.NO,
    },
]
