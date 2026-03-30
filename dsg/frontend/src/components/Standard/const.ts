import { SortDirection } from '@/core/apis/common.d'
import { IFieldStandardRate, IStandardEnumData } from '@/core'
import __ from './locale'

export const menus = [
    { key: 'created_at', label: __('按创建时间排序') },
    { key: 'updated_at', label: __('按更新时间排序') },
]

export const defaultMenu = {
    key: 'created_at',
    sort: SortDirection.DESC,
}

/**
 * 排序方式
 */
export enum SortType {
    CREATED = 'created_at',
    UPDATED = 'updated_at',
}

export enum YesOrNo {
    Yes = 1,
    No = 0,
}

export const standardSearchList = [
    {
        key: 0,
        value: __('全部'),
    },
    {
        key: 1,
        value: __('是'),
    },
    {
        key: 2,
        value: __('否'),
    },
]

export const getYesOrNoText = (value: number) => {
    return value === 1 ? __('是') : __('否')
}

export const numberText = '数字型'
export const stringText = '字符型'
export const numberTypeArr = [numberText]
export const numberAndStringTypeArr = [numberText, stringText]

// eg: 78%显示78%  78.1%显示78.1%  78.12%显示78.12% 最多保留两位小数
export const getStandradRate = (data?: IFieldStandardRate) => {
    if (!data) return '0%'
    const { fields_count, standard_fields_count } = data
    const res = fields_count ? standard_fields_count / fields_count : 0
    if (res) {
        const resArr = `${res * 100}`.split('.')
        if (resArr[1] && resArr[1].length < 3) {
            return `${resArr[0]}.${resArr[1]}%`
        }
        if (resArr[1] && resArr[1].length > 2) {
            return `${resArr[0]}.${resArr[1].substring(0, 2)}%`
        }
        return `${resArr[0]}%`
    }
    return '0%'
}

/**
 * @enum
 * BASIC:直接展示
 * TIME：转换时间
 * SELECT：接口获取的枚举值转换
 */
export enum FieldShowType {
    BASIC = 'basic',
    TIME = 'time',
    SELECT = 'select',
    STATUS = 'status',
}

export enum ListNameEnum {
    YESORNO = 'YesOrNo',
    DATA_TYPE = 'data_type',
    FORMULATE_BASIS = 'formulate_basis',
    OPEN_ATTR = 'open_attribute',
    CONFIDENTIAL_ATTR = 'confidential_attribute',
    SENSITIVE_ATTR = 'sensitive_attribute',
    SHARED_ATTR = 'shared_attribute',
}

export interface IDetailConfig {
    label: string
    name: string
    type: FieldShowType
    listName?: ListNameEnum
    dependence?: string
    dependenceValue?: string[]
}

export const yesOrNoList: IStandardEnumData[] = [
    {
        type: __('是'),
        value: YesOrNo.Yes,
    },
    {
        type: __('否'),
        value: YesOrNo.No,
    },
]

export const detailBasicConfig: IDetailConfig[] = [
    {
        label: __('字段中文名称'),
        name: 'name',
        type: FieldShowType.BASIC,
    },
    {
        label: __('字段英文名称'),
        name: 'name_en',
        type: FieldShowType.BASIC,
    },
    {
        label: __('标准化状态'),
        name: 'standard_status',
        type: FieldShowType.STATUS,
    },
    {
        label: __('创建人'),
        name: 'created_by',
        type: FieldShowType.BASIC,
    },
    {
        label: __('创建时间'),
        name: 'created_at',
        type: FieldShowType.TIME,
    },
    {
        label: __('更新人'),
        name: 'updated_by',
        type: FieldShowType.BASIC,
    },
    {
        label: __('更新时间'),
        name: 'updated_at',
        type: FieldShowType.TIME,
    },
]

export const detailBusinessAttributesConfig: IDetailConfig[] = [
    {
        label: __('是否本业务产生'),
        name: 'is_current_business_generation',
        type: FieldShowType.SELECT,
        listName: ListNameEnum.YESORNO,
    },
    {
        label: __('标准主题'),
        name: 'standard_theme',
        type: FieldShowType.BASIC,
    },
    {
        label: __('一级分类'),
        name: 'primary_class',
        type: FieldShowType.BASIC,
    },
    {
        label: __('二级分类'),
        name: 'secondary_class',
        type: FieldShowType.BASIC,
    },
    {
        label: __('标准分类（标准级别）'),
        name: 'formulate_basis',
        type: FieldShowType.SELECT,
        listName: ListNameEnum.FORMULATE_BASIS,
    },
    {
        label: __('业务定义'),
        name: 'business_definition',
        type: FieldShowType.BASIC,
    },
    {
        label: __('标准来源规范文件'),
        name: 'standard_source_specification_document',
        type: FieldShowType.BASIC,
    },
]

export const detailTechnicalAttributesConfig: IDetailConfig[] = [
    {
        label: __('数据类型'),
        name: 'data_type',
        type: FieldShowType.BASIC,
    },
    {
        label: __('数据长度'),
        name: 'data_length',
        type: FieldShowType.BASIC,
        dependence: 'data_type',
        dependenceValue: numberAndStringTypeArr,
    },
    {
        label: __('数据精度'),
        name: 'data_accuracy',
        type: FieldShowType.BASIC,
        dependence: 'data_type',
        dependenceValue: numberTypeArr,
    },
    {
        label: __('计量单位'),
        name: 'unit',
        type: FieldShowType.BASIC,
    },
    {
        label: __('是否主键'),
        name: 'is_primary_key',
        type: FieldShowType.SELECT,
        listName: ListNameEnum.YESORNO,
    },
    {
        label: __('是否增量字段'),
        name: 'is_incremental_field',
        type: FieldShowType.SELECT,
        listName: ListNameEnum.YESORNO,
    },
    {
        label: __('是否必填'),
        name: 'is_required',
        type: FieldShowType.SELECT,
        listName: ListNameEnum.YESORNO,
    },
    {
        label: __('码表'),
        name: 'code_table',
        type: FieldShowType.BASIC,
    },
    {
        label: __('值域'),
        name: 'value_range',
        type: FieldShowType.BASIC,
    },
    {
        label: __('编码规则'),
        name: 'encoding_rule',
        type: FieldShowType.BASIC,
    },
    {
        label: __('字段关系'),
        name: 'field_relationship',
        type: FieldShowType.BASIC,
    },
]

export const detailAdditionalAttributesConfig: IDetailConfig[] = [
    {
        label: __('样例'),
        name: 'sample',
        type: FieldShowType.BASIC,
    },
    {
        label: __('说明'),
        name: 'explanation',
        type: FieldShowType.BASIC,
    },
    {
        label: __('敏感属性'),
        name: 'sensitive_attribute',
        type: FieldShowType.SELECT,
        listName: ListNameEnum.SENSITIVE_ATTR,
    },
    {
        label: __('涉密属性'),
        name: 'confidential_attribute',
        type: FieldShowType.SELECT,
        listName: ListNameEnum.CONFIDENTIAL_ATTR,
    },
    {
        label: __('共享属性'),
        name: 'shared_attribute',
        type: FieldShowType.SELECT,
        listName: ListNameEnum.SHARED_ATTR,
    },
    {
        label: __('开放属性'),
        name: 'open_attribute',
        type: FieldShowType.SELECT,
        listName: ListNameEnum.OPEN_ATTR,
    },
]

export const getInitForm = () => {
    return {
        create_at: '',
        create_by: '',
        data_range: {
            display: '',
            value: '',
        },
        description: '',
        field_count: 0,
        flowcharts: '',
        id: '',
        name: '',
        update_at: '',
        update_by: '',
        update_cycle: {
            display: '',
            value: '',
        },
        field_standard_rate: {
            fields_count: 0,
            standard_fields_count: 0,
        },
    }
}

export enum TabKey {
    PROCESS = 'process',
    FORM = 'form',
    STANDARD = 'standard',
    INDICATOR = 'indicator',
}
