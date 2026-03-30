import {
    Input,
    Select,
    Cascader,
    Space,
    Form,
    FormInstance,
    InputNumber,
    Tooltip,
    Button,
} from 'antd'
import { ColumnsType } from 'antd/lib/table'
import { noop, trim, isArray } from 'lodash'
import { SortableHandle } from 'react-sortable-hoc'
import { CSSProperties, FC } from 'react'
import {
    ValueRangeType,
    StandardDataDetail,
} from '@/components/FormTableMode/const'
import FormItemContainer from '@/components/FormTableMode/FormItemContainer'
import { RadioBox } from '@/components/FormTableMode/helper'
import SelectValueRange from '@/components/FormTableMode/SelectValueRange'
import { FontIcon, MenuOutlined } from '@/icons'
import { ErrorInfo, OperateType, commReg } from '@/utils'
import styles from './styles.module.less'
import __ from './locale'
import {
    formatError,
    getInfoCatlgConflicts,
    IFormEnumConfigModel,
} from '@/core'
import SelectTableCodeOrStandard from '@/components/ResourcesDir/FieldsTable/SelectTableCodeOrStandard'
import { IconType } from '@/icons/const'
import { checkNumberRanage } from '@/components/FormGraph/helper'

export enum EditInfoCatlgAction {
    SAVE = 'save',
    SUBMIT = 'submit',
}

export const enum StepOptionKey {
    /** 业务表选择 */
    SELBUSINFORM = 'selectBusinForm',
    /** 信息项配置 */
    INFOITEMS = 'infoItems',
    /** 基本信息 */
    BASICINFO = 'basicInfo',
}

export enum SelectRescCatlgType {
    DATA_RESOURCE = 'data_resource',
    INFO_RESOURCE = 'info_resource',
}

// 当关联项ID为0表示其已被删除
export const invalidSelOptionVal = ''

// 关联信息项选择wu时，id需要传的值
export const selectNullOptionValue = '00000000-0000-0000-0000-000000000000'

export const selectNullOption = {
    value: selectNullOptionValue,
    label: __('无'),
}

export enum InfoCatlgItemDataType {
    // 字符型
    Char = 'char',
    // 整数型
    Int = 'int',
    // 小数型
    Float = 'float',
    // 高精度型
    Decimal = 'decimal',
    // 数字型
    Digit = 'number',
    // 日期型
    Date = 'date',
    // 日期时间型
    Datetime = 'datetime',
    // 时间型
    Time = 'time',
    // 布尔型
    Bool = 'bool',
    // 其他
    Other = 'other',
}

// 业务表字段数据类型与信息资源目录类型对应
export const businFormToInfoCatlgDataType = {
    char: InfoCatlgItemDataType.Char,
    int: InfoCatlgItemDataType.Int,
    float: InfoCatlgItemDataType.Float,
    decimal: InfoCatlgItemDataType.Decimal,
    number: InfoCatlgItemDataType.Digit,
    date: InfoCatlgItemDataType.Date,
    datetime: InfoCatlgItemDataType.Datetime,
    Time: InfoCatlgItemDataType.Time,
    bool: InfoCatlgItemDataType.Bool,
    other: InfoCatlgItemDataType.Other,
}

export const InfoCatlgItemDataTypeOptions = [
    {
        key: InfoCatlgItemDataType.Char,
        value: InfoCatlgItemDataType.Char,
        label: __('字符型'),
    },
    {
        key: InfoCatlgItemDataType.Int,
        value: InfoCatlgItemDataType.Int,
        label: __('整数型'),
    },
    {
        key: InfoCatlgItemDataType.Float,
        value: InfoCatlgItemDataType.Float,
        label: __('小数型'),
    },
    {
        key: InfoCatlgItemDataType.Decimal,
        value: InfoCatlgItemDataType.Decimal,
        label: __('高精度型'),
    },
    // {
    //     key: InfoCatlgItemDataType.Digit,
    //     value: InfoCatlgItemDataType.Digit,
    //     label: __('数字型'),
    // },

    {
        key: InfoCatlgItemDataType.Date,
        value: InfoCatlgItemDataType.Date,
        label: __('日期型'),
    },
    {
        key: InfoCatlgItemDataType.Datetime,
        value: InfoCatlgItemDataType.Datetime,
        label: __('日期时间型'),
    },
    {
        key: InfoCatlgItemDataType.Time,
        value: InfoCatlgItemDataType.Time,
        label: __('时间型'),
    },
    {
        key: InfoCatlgItemDataType.Bool,
        value: InfoCatlgItemDataType.Bool,
        label: __('布尔型'),
    },
    {
        key: InfoCatlgItemDataType.Other,
        value: InfoCatlgItemDataType.Other,
        label: __('其他'),
    },
]

// 信息目录编目时保存的数据
export interface IEditInfoCatlg {
    name: string
    source_info?: {
        business_form: {
            id: string
            name: string
        }
        department: {
            id?: string
            name?: string
        }
    }
    belong_info?: {
        department: {
            id: string
            name: string
        }
        office: {
            id: string
            name: string
            business_responsibility: string
        }
        business_process: [
            {
                id: string
                name: string
            },
        ]
    }
    data_range?: string
    update_cycle?: string
    description?: string
    category_node_ids?: [string]
    relation_info?: {
        info_systems?: [
            {
                id: string
                name: string
            },
        ]
        data_resource_catalogs?: [
            {
                id: string
                name: string
            },
        ]
        info_resource_catalogs?: [
            {
                id: string
                name: string
            },
        ]
        info_items?: [
            {
                id: string
                name: string
            },
        ]
        related_business_scenes?: [
            {
                type: string
                value: string
            },
        ]
        source_business_scenes?: [
            {
                type: string
                value: string
            },
        ]
    }
    shared_open_info?: {
        shared_type: string
        shared_message: string
        shared_mode: string
        open_type: string
        open_condition: string
    }
    columns?: [
        {
            name: string
            data_refer: {
                id: string
                name: string
            }
            code_set: {
                id: string
                name: string
            }
            metadata: {
                data_type: InfoCatlgItemDataType
                data_length: number
                data_range: string
            }
            is_sensitive: boolean
            is_secret: boolean
            is_primary_key: boolean
            is_incremental: boolean
            is_local_generated: boolean
            is_standardized: boolean
        },
    ]
    action?: EditInfoCatlgAction
}

/**
 * 敏感选项
 */
const SensibilityOption = [
    {
        label: __('非敏感'),
        value: false,
    },
    {
        label: __('敏感'),
        value: true,
    },
]

// 是否下拉的数据
export const BooleanDataOptions = [
    {
        label: __('是'),
        value: false,
    },
    {
        label: __('否'),
        value: true,
    },
]

// 单选值
export const fieldRadioValueList = {
    0: false,
    1: true,
}

/**
 * 涉密选项
 */
const SecurityClassificationOption = [
    {
        label: __('非涉密'),
        value: false,
    },
    {
        label: __('涉密'),
        value: true,
    },
]

/**
 * 单条数据的过滤结果
 * @param field 字段
 * @param searchWord 搜索关键字
 * @param filterType 过滤类型
 * @returns
 */
export const filterSingleData = (field: any, searchWord: string) => {
    // 匹配到中文或者英文名称， 如果未匹配到直接返回
    if (
        !field?.name
            .toLocaleLowerCase()
            .includes(searchWord.toLocaleLowerCase())
    ) {
        return false
    }
    return true
}

/**
 * Columns获取表头
 */
interface IGetEditTableColumns {
    // 表单实例
    form: FormInstance<any>

    // 是否配置模式
    isConfigModel?: boolean

    parentNode: any

    handleDelete?: (item: any) => void

    // 表单名称
    formName?: string
}

export const needBatchField = {
    is_sensitive: {
        value: null,
        status: false,
    },
    is_secret: {
        value: null,
        status: false,
    },
}

export const validateDataEleType = (
    message = '关联数据标准的数据类型与字段数据类型不一致',
) => {
    return (_: any, value: string) => {
        return new Promise((resolve, reject) => {
            if (value) {
                reject(message)
            } else {
                resolve(1)
            }
        })
    }
}

export const HoldingComponent = ({
    text = '',
    style = {},
}: {
    text?: string
    style?: CSSProperties
}) => {
    return (
        <div style={style} className={styles.holdingComponent}>
            {text}
        </div>
    )
}

interface IDataTypeTemplate {
    // 当前行的字段
    fields: any
    // 数据类型枚举的集合
    dataTypes: Array<any>
    // 表单名称前两项
    names: Array<string | number>
    // 表单实例
    form: FormInstance<any>
    parentNode: any
}

/**
 * 类型模块
 * @param record
 * @returns
 */
export const DataTypeTemplate: FC<IDataTypeTemplate> = ({
    fields,
    dataTypes,
    names,
    form,
    parentNode,
}) => {
    switch (fields.data_type) {
        // 高精度型
        case InfoCatlgItemDataType.Decimal:
        case InfoCatlgItemDataType.Char:
            return (
                <Space size={8}>
                    <FormItemContainer
                        name={[...names, 'data_type']}
                        validateTrigger={['onChange', 'onBlur']}
                        rules={[
                            {
                                required: true,
                                message: __('请选择数据类型'),
                            },
                        ]}
                        id={`fields-${names[1]}-data_type`}
                        parentNode={parentNode}
                    >
                        <Select
                            style={{ width: '120px' }}
                            placeholder={__('请选择')}
                            showArrow
                            getPopupContainer={(element) =>
                                parentNode || element.parentNode
                            }
                            options={dataTypes}
                        />
                    </FormItemContainer>
                    <FormItemContainer
                        name={[...names, 'data_length']}
                        validateTrigger={['onChange', 'onBlur']}
                        validateFirst
                        rules={[
                            {
                                required:
                                    fields.data_type ===
                                    InfoCatlgItemDataType.Decimal,
                                message: __('请输入数据长度'),
                            },
                        ]}
                        id={`fields-${names[1]}-data_length`}
                        parentNode={parentNode}
                    >
                        <InputNumber
                            style={{ width: 148 }}
                            placeholder={
                                fields.data_type === InfoCatlgItemDataType.Char
                                    ? __('长度（0~65535）')
                                    : __('长度（0~38）')
                            }
                            // disabled={!!fields.ref_id}
                            min={1}
                            max={
                                fields.data_type === InfoCatlgItemDataType.Char
                                    ? 65535
                                    : 38
                            }
                            // type={NumberType.Natural}
                            // onChange={() =>
                            //     form.validateFields([
                            //         [...names, 'data_accuracy'],
                            //     ])
                            // }
                            prefix={
                                fields.data_type ===
                                    InfoCatlgItemDataType.Decimal && (
                                    <span style={{ color: '#FF4D4F' }}>*</span>
                                )
                            }
                        />
                    </FormItemContainer>
                    <FormItemContainer
                        name={[...names, 'data_range']}
                        validateTrigger={['onChange', 'onBlur']}
                        validateFirst
                        rules={[
                            {
                                pattern: commReg,
                                message: ErrorInfo.ONLYSUP,
                                transform: (value) => trim(value),
                            },
                        ]}
                        id={`fields-${names[1]}-data_range`}
                        parentNode={parentNode}
                    >
                        <Input
                            style={{ width: 90 }}
                            placeholder={__('数据值域')}
                            maxLength={128}
                        />
                    </FormItemContainer>
                </Space>
            )
        // 不需要长度的类型
        case InfoCatlgItemDataType.Bool:
        case InfoCatlgItemDataType.Date:
        case InfoCatlgItemDataType.Time:
        case InfoCatlgItemDataType.Datetime:
        default:
            return (
                <Space size={8}>
                    <FormItemContainer
                        name={[...names, 'data_type']}
                        validateTrigger={['onChange', 'onBlur']}
                        rules={[
                            {
                                required: true,
                                message: __('请选择'),
                            },
                        ]}
                        id={`fields-${names[1]}-data_type`}
                        parentNode={parentNode}
                    >
                        <Select
                            style={{ width: '120px' }}
                            placeholder={__('请选择')}
                            showArrow
                            getPopupContainer={(element) =>
                                parentNode || element.parentNode
                            }
                            options={dataTypes}
                            // disabled={!!fields.ref_id}
                        />
                    </FormItemContainer>
                    <HoldingComponent
                        style={{ width: 148 }}
                        text={__('数据长度')}
                    />
                    <FormItemContainer
                        name={[...names, 'data_range']}
                        validateTrigger={['onChange', 'onBlur']}
                        validateFirst
                        rules={[
                            {
                                pattern: commReg,
                                message: ErrorInfo.ONLYSUP,
                                transform: (value) => trim(value),
                            },
                        ]}
                        id={`fields-${names[1]}-data_range`}
                        parentNode={parentNode}
                    >
                        <Input
                            style={{ width: 90 }}
                            placeholder={__('数据值域')}
                            maxLength={128}
                        />
                    </FormItemContainer>
                </Space>
            )
    }
}

/**
 * 获取可编辑表表头
 * @param param0
 * @returns
 */
export const getEditTableColumns = ({
    form,
    isConfigModel = false,
    parentNode,
    handleDelete,
    formName,
}: IGetEditTableColumns): ColumnsType<any> => {
    return [
        // {
        //     dataIndex: 'drag',
        //     width: 50,
        //     key: 'drag',
        //     className: 'drag-visible',
        //     render: () => <DragHandle />,
        // },
        {
            title: isConfigModel ? (
                <div className={styles.tableTitleContainer}>
                    <span className={styles.fieldLabel}>
                        {__('信息项名称')}
                    </span>
                    <div className={styles.tips}>{__('不支持批量配置')}</div>
                </div>
            ) : (
                <span className={styles.fieldLabel}>{__('信息项名称')}</span>
            ),
            key: 'name',
            width: 180,
            fixed: 'left',
            render: (_, record, index) => (
                <FormItemContainer
                    name={['fields', index, 'name']}
                    validateFirst
                    validateTrigger={['onChange', 'onBlur']}
                    rules={[
                        {
                            required: true,
                            transform: (val) => trim(val),
                            message: __('输入不能为空'),
                        },
                        {
                            pattern: commReg,
                            message: ErrorInfo.ONLYSUP,
                            transform: (value) => trim(value),
                        },
                    ]}
                    id={`fields-${index}-name`}
                    parentNode={parentNode}
                >
                    <Input />
                </FormItemContainer>
            ),
        },
        {
            title: isConfigModel ? (
                <div className={styles.tableTitleContainer}>
                    <span className={styles.fieldLabel}>{__('映射字段')}</span>
                    <div className={styles.tips}>{__('不支持批量配置')}</div>
                </div>
            ) : (
                <span className={styles.fieldLabel}>{__('映射字段')}</span>
            ),
            key: 'reflectTxt',
            width: 180,
            render: (_, record, index) => (
                <Input disabled value={`${record?.reflectTxt}`} />
            ),
        },
        {
            title: isConfigModel ? (
                <div className={styles.tableTitleContainer}>
                    <span>{__('关联数据元')}</span>
                    <div className={styles.tips}>{__('不支持批量配置')}</div>
                </div>
            ) : (
                <span>{__('关联数据元')}</span>
            ),
            key: 'data_refer',
            width: 241,
            // flag 需要调整
            render: (_, record, index) => {
                return (
                    <FormItemContainer
                        name={['fields', index, 'data_refer']}
                        // rules={[
                        //     {
                        //         required: true,
                        //         transform: (val) => trim(val),
                        //         message: __('请选择'),
                        //     },
                        // ]}
                        id={`fields-${index}-data_refer`}
                        validateTrigger={['onChange', 'onBlur']}
                        parentNode={parentNode}
                        validateFirst
                        // dependencies={['fields', index, 'data_type']}
                    >
                        <SelectTableCodeOrStandard
                            type="standard"
                            fields={record.data_refer}
                            fieldKeys={{
                                fieldId: 'id',
                                fieldLabel: 'name',
                            }}
                            stdRecParams={
                                record.name && formName
                                    ? {
                                          table_name: formName || '',
                                          table_fields: [
                                              {
                                                  table_field: record.name,
                                              },
                                          ],
                                      }
                                    : undefined
                            }
                        />
                    </FormItemContainer>
                )
            },
        },
        {
            title: isConfigModel ? (
                <div className={styles.tableTitleContainer}>
                    <span>{__('关联代码集')}</span>
                    <div className={styles.tips}>{__('不支持批量配置')}</div>
                </div>
            ) : (
                <span>{__('关联代码集')}</span>
            ),
            key: 'code_set',
            width: 241,
            // flag 需要调整
            render: (_, record, index) => {
                return (
                    <FormItemContainer
                        name={['fields', index, 'code_set']}
                        // rules={[
                        //     {
                        //         required: true,
                        //         transform: (val) => trim(val),
                        //         message: __('请选择'),
                        //     },
                        //     {
                        //         transform: (val) => trim(val),
                        //         validator: keyboardInputValidator(),
                        //     },
                        // ]}
                        id={`fields-${index}-code_set`}
                        // validateTrigger={['onChange']}
                        parentNode={parentNode}
                    >
                        <SelectTableCodeOrStandard
                            type="code"
                            fields={record.code_set}
                            fieldKeys={{
                                fieldId: 'id',
                                fieldLabel: 'name',
                            }}
                        />
                    </FormItemContainer>
                )
            },
        },
        {
            title: isConfigModel ? (
                <div className={styles.tableTitleContainer}>
                    <span className={styles.fieldLabel}>{__('数据类型')}</span>
                    <div className={styles.tips}>{__('不支持批量配置')}</div>
                </div>
            ) : (
                <span className={styles.fieldLabel}>{__('数据类型')}</span>
            ),
            width: 390,
            key: 'data_type',
            render: (_, record, index) => (
                <DataTypeTemplate
                    names={['fields', index]}
                    fields={record}
                    dataTypes={InfoCatlgItemDataTypeOptions}
                    form={form}
                    parentNode={parentNode}
                />
            ),
        },
        {
            title: isConfigModel ? (
                <div className={styles.tableTitleContainer}>
                    <span className={styles.fieldLabel}>{__('敏感属性')}</span>
                    <div>
                        <Form.Item
                            name={['is_sensitive', 'value']}
                            rules={[
                                {
                                    required: true,
                                    // transform: (val) => trim(val),
                                    message: __('请选择'),
                                },
                            ]}
                            noStyle
                        >
                            <Select
                                placeholder={__('多项值')}
                                style={{ width: '92px' }}
                                options={SensibilityOption}
                                getPopupContainer={(element) =>
                                    parentNode || element.parentNode
                                }
                            />
                        </Form.Item>
                    </div>
                </div>
            ) : (
                <span className={styles.fieldLabel}>{__('敏感属性')}</span>
            ),
            key: 'is_sensitive',
            width: 128,
            render: (_, record, index) => (
                <FormItemContainer
                    name={['fields', index, 'is_sensitive']}
                    validateTrigger={['onChange', 'onBlur']}
                    rules={[
                        {
                            required: true,
                            message: __('请选择敏感属性'),
                        },
                    ]}
                >
                    <Select
                        placeholder={__('请选择')}
                        style={{ width: '92px' }}
                        options={SensibilityOption}
                        // disabled={!!record.ref_id}
                        getPopupContainer={(element) =>
                            parentNode || element.parentNode
                        }
                    />
                </FormItemContainer>
            ),
        },
        {
            title: isConfigModel ? (
                <div className={styles.tableTitleContainer}>
                    <span className={styles.fieldLabel}>{__('涉密属性')}</span>
                    <div>
                        <Form.Item name={['is_secret', 'value']} noStyle>
                            <Select
                                placeholder={__('多项值')}
                                style={{ width: '92px' }}
                                options={SecurityClassificationOption}
                                getPopupContainer={(element) =>
                                    parentNode || element.parentNode
                                }
                            />
                        </Form.Item>
                    </div>
                </div>
            ) : (
                <span className={styles.fieldLabel}>{__('涉密属性')}</span>
            ),
            key: 'is_secret',
            width: 128,
            render: (_, record, index) => (
                <FormItemContainer
                    name={['fields', index, 'is_secret']}
                    validateTrigger={['onChange', 'onBlur']}
                    rules={[
                        {
                            required: true,
                            // transform: (val) => trim(val),
                            message: __('请选择涉密属性'),
                        },
                    ]}
                >
                    <Select
                        placeholder={__('多项值')}
                        style={{ width: '92px' }}
                        options={SecurityClassificationOption}
                        getPopupContainer={(element) =>
                            parentNode || element.parentNode
                        }
                    />
                </FormItemContainer>
            ),
        },

        {
            title: isConfigModel ? (
                <div className={styles.tableTitleContainer}>
                    <span className={styles.fieldLabel}>{__('是否主键')}</span>
                    <div className={styles.tips}>{__('不支持批量配置')}</div>
                </div>
            ) : (
                <span>{__('是否主键')}</span>
            ),
            width: isConfigModel ? 128 : 88,
            key: 'is_primary_key',
            render: (_, record, index) => (
                <Form.Item
                    name={['fields', index, 'is_primary_key']}
                    // rules={
                    //     index === 0
                    //         ? [
                    //               {
                    //                   required: true,
                    //                   transform: (val) => trim(val),
                    //                   message: __('请选择') + __('是否主键'),
                    //               },
                    //               ({ getFieldValue }) => ({
                    //                   validator(rule, value) {
                    //                       const allFields =
                    //                           getFieldValue('fields')
                    //                       const hadPrimaryKey = allFields.find(
                    //                           (item) => item.is_primary_key,
                    //                       )
                    //                       if (hadPrimaryKey) {
                    //                           return Promise.resolve()
                    //                       }
                    //                       return Promise.reject(
                    //                           new Error(
                    //                               __('请选择') + __('是否主键'),
                    //                           ),
                    //                       )
                    //                   },
                    //               }),
                    //           ]
                    //         : undefined
                    // }
                    valuePropName="checked"
                >
                    <RadioBox
                    // disabled={
                    //     !!record.ref_id ||
                    //     (record.is_primary_key)
                    // }
                    // tip={
                    //     record.is_primary_key && record.is_required
                    //         ? __('唯一标识字段默认设为必填字段')
                    //         : ''
                    // }
                    />
                </Form.Item>
            ),
        },

        {
            title: isConfigModel ? (
                <div className={styles.tableTitleContainer}>
                    <span>{__('是否增量字段')}</span>
                    <div className={styles.tips}>{__('不支持批量配置')}</div>
                </div>
            ) : (
                <span>{__('是否增量字段')}</span>
            ),
            width: isConfigModel ? 128 : 118,
            key: 'is_incremental',
            render: (_, record, index) => (
                <Form.Item
                    name={['fields', index, 'is_incremental']}
                    rules={[
                        {
                            required: true,
                            transform: (val) => trim(val),
                            message: __('请选择') + __('是否增量字段'),
                        },
                    ]}
                    valuePropName="checked"
                >
                    <RadioBox
                    // disabled={
                    //     !!record.ref_id ||
                    //     (record.is_primary_key && record.is_required)
                    // }
                    // tip={
                    //     record.is_primary_key && record.is_required
                    //         ? __('唯一标识字段默认设为必填字段')
                    //         : ''
                    // }
                    />
                </Form.Item>
            ),
        },

        {
            title: isConfigModel ? (
                <div className={styles.tableTitleContainer}>
                    <span>{__('是否本部门产生')}</span>
                    <div className={styles.tips}>{__('不支持批量配置')}</div>
                </div>
            ) : (
                <span>{__('是否本部门产生')}</span>
            ),
            width: isConfigModel ? 138 : 138,
            key: 'is_local_generated',
            render: (_, record, index) => (
                <Form.Item
                    name={['fields', index, 'is_local_generated']}
                    rules={[
                        {
                            required: true,
                            transform: (val) => trim(val),
                            message: __('请选择') + __('是否本部门产生'),
                        },
                    ]}
                    valuePropName="checked"
                >
                    <RadioBox
                    // disabled={
                    //     !!record.ref_id ||
                    //     (record.is_primary_key && record.is_required)
                    // }
                    // tip={
                    //     record.is_primary_key
                    //         ? __('唯一标识字段默认设为必填字段')
                    //         : ''
                    // }
                    />
                </Form.Item>
            ),
        },

        {
            title: isConfigModel ? (
                <div className={styles.tableTitleContainer}>
                    <span>{__('是否标准化')}</span>
                    <div className={styles.tips}>{__('不支持批量配置')}</div>
                </div>
            ) : (
                <span>{__('是否标准化')}</span>
            ),
            width: isConfigModel ? 128 : 108,
            key: 'is_standardized',
            render: (_, record, index) => (
                <Form.Item
                    name={['fields', index, 'is_standardized']}
                    rules={[
                        {
                            required: true,
                            transform: (val) => trim(val),
                            message: __('请选择') + __('是否标准化'),
                        },
                    ]}
                    valuePropName="checked"
                >
                    <RadioBox
                    // disabled={
                    //     !!record.ref_id ||
                    //     (record.is_primary_key && record.is_required)
                    // }
                    // tip={
                    //     record.is_primary_key
                    //         ? __('唯一标识字段默认设为必填字段')
                    //         : ''
                    // }
                    />
                </Form.Item>
            ),
        },
        {
            title: <span>{__('操作')}</span>,
            width: 80,
            key: 'action',
            fixed: 'right',
            render: (_, record, index) => (
                <Button
                    type="link"
                    disabled={!!record?.reflectTxt}
                    onClick={() => {
                        handleDelete?.(record)
                    }}
                >
                    {__('删除')}
                </Button>
            ),
        },
    ]
}

export const scollerToErrorElement = (id) => {
    document.getElementById(id)?.scrollIntoView({ inline: 'center' })
}

/**
 * 检查已选项是否被删除，如无id或value则被删除
 * @param msg errMsg 错误信息
 * @returns
 */
export const validSelOptionIsDel = (errMsg: string) => {
    return (_: any, value: any) => {
        return new Promise((resolve, reject) => {
            if (typeof value === 'object') {
                if (isArray(value)) {
                    const hasError = value.find(
                        (item) =>
                            item === invalidSelOptionVal ||
                            item.value === invalidSelOptionVal,
                    )
                    if (hasError) {
                        reject(new Error(errMsg))
                        return
                    }
                }
            }
            const optionVal =
                typeof value === 'string'
                    ? trim(value)
                    : value?.id || value?.value
            if (optionVal === invalidSelOptionVal) {
                reject(new Error(errMsg))
                return
            }

            resolve(1)
        })
    }
}

/**
 * 检查标题是否需要变更提示
 * @param title
 * @param opt
 * @returns
 */
export const checkChangeIcon = (title: string, opt: OperateType) => {
    return (
        <span className={styles['check-title']}>
            <span>{title}</span>
            {opt === OperateType.CHANGE && (
                <Tooltip title={__('字段变更需审核')} placement="top">
                    <FontIcon
                        name="icon-biangeng"
                        type={IconType.COLOREDICON}
                        style={{ cursor: 'pointer' }}
                    />
                </Tooltip>
            )}
        </span>
    )
}
