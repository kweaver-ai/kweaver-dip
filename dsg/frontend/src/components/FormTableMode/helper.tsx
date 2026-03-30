import { ColumnsType } from 'antd/lib/table'
import { ProColumns } from '@ant-design/pro-components'
import classnames from 'classnames'
import {
    AutoComplete,
    Cascader,
    Form,
    Input,
    InputNumber,
    Select,
    Space,
    Switch,
    Tooltip,
} from 'antd'
import { noop, trim, debounce } from 'lodash'
import {
    CSSProperties,
    FC,
    ReactNode,
    useEffect,
    useRef,
    useState,
    useCallback,
} from 'react'
import { useDebounce } from 'ahooks'
import { FormInstance } from 'antd/es/form'
import { CheckCircleFilled } from '@ant-design/icons'
import styles from './styles.module.less'
import __ from './locale'
import { StandardStatusLabel } from '../Forms/helper'
import {
    CatalogType,
    IFormEnumConfigModel,
    formatError,
    getDataEleDetailById,
    getStandardRecommend,
    standardDataReplace,
} from '@/core'
import {
    OpenAttribute,
    OpenAttributeOption,
    SecurityClassificationOption,
    SensibilityOption,
    SharedAttribute,
    SharedAttributeOption,
    checkNormalInput,
    checkNumberRanage,
    checkRepeatName,
    recommendParamTemplate,
} from '../FormGraph/helper'
import {
    BooleanDataOptions,
    OptionType,
    RefStatus,
    StandardDataDetail,
    ValueRangeOptions,
    ValueRangeType,
    exChangeRangeDataToObj,
    exChangeRangeDataToString,
    getBatchValuesStatus,
} from './const'
import {
    ErrorInfo,
    entendNameEnReg,
    keyboardInputValidator,
    keyboardReg,
    numberReg,
} from '@/utils'
import { formulaInfo } from '../SceneAnalysis/const'
import NumberInput from '@/ui/NumberInput'
import { NumberType } from '@/ui/NumberInput/const'
import { FontIcon, StandardOutlined } from '@/icons'
import SelDataByTypeModal from '../SelDataByTypeModal'
import CodeTableDetails from '../CodeTableManage/Details'
import SelectValueRange from './SelectValueRange'
import { OptionBarTool, OptionMenuType } from '@/ui'
import ViewValueRange from './ViewValueRange'
import FormItemContainer from './FormItemContainer'
import { FormTableKind } from '../Forms/const'
import { DataType } from '../DataEleManage/const'

export const viewColumnsConfig = {
    [FormTableKind.BUSINESS]: [
        'name',
        'name_en',
        'description',
        'is_primary_key',
        'is_required',
        'is_current_business_generation',
        'is_standardization_required',
        'standard_id',
        'data_type',
        'value_range',
        'field_relationship',
        'label_name',
        'confidential_attribute',
        'shared_attribute',
        'open_attribute',
    ],
    [FormTableKind.STANDARD]: [
        'standard_status',
        'name',
        'name_en',
        'description',
        'is_primary_key',
        'is_required',
        'is_current_business_generation',
        'is_standardization_required',
        'standard_id',
        'data_type',
        'value_range',
        'field_relationship',
        'label_name',
        'confidential_attribute',
        'shared_attribute',
        'open_attribute',
    ],
    [FormTableKind.DATA_ORIGIN]: [
        'name',
        'name_en',
        'is_primary_key',
        'data_type',
        'description',
        'is_required',
        'is_current_business_generation',
        'data_value_range',
        'code_table',
        'encoding_rule',
        'field_relationship',
        'code_rule',
    ],
    [FormTableKind.DATA_STANDARD]: [
        'standard_status',
        'name',
        'name_en',
        'description',
        'is_primary_key',
        'is_required',
        'is_standardization_required',
        'standard_id',
        'data_value_range',
        'data_type',
        'code_table',
        'encoding_rule',
        'field_relationship',
        'confidential_attribute',
        'shared_attribute',
        'open_attribute',
    ],
    [FormTableKind.DATA_FUSION]: [
        'name',
        'name_en',
        'description',
        'is_primary_key',
        'is_required',
        'data_value_range',
        'is_standardization_required',
        'standard_id',
        'data_type',
        'code_table',
        'encoding_rule',
        'field_relationship',
        'confidential_attribute',
        'shared_attribute',
        'open_attribute',
    ],
}
/**
 * 查看模式的表头
 * @param dataEnumOptions
 * @returns
 */
export const getViewColumns = (
    dataEnumOptions: IFormEnumConfigModel | null,
    tableKind: FormTableKind,
): ColumnsType<any> => {
    const columns = [
        {
            key: 'standard_status',
            width: 32,
            fixed: 'left',
            render: (_, record, index) => {
                return record.standard_status === 'normal' ? (
                    <StandardOutlined
                        style={{
                            color: '#126ee3',
                            fontSize: '18px',
                        }}
                    />
                ) : null
            },
        },
        {
            title: [FormTableKind.BUSINESS, FormTableKind.STANDARD].includes(
                tableKind,
            )
                ? __('字段名称')
                : __('字段业务名称'),
            key: 'name',
            width: 240,
            fixed: 'left',
            ellipsis: true,
            render: (_, record) => (
                <span>
                    <span title={record.name}>{record.name}</span>
                </span>
            ),
        },
        {
            title: [FormTableKind.BUSINESS, FormTableKind.STANDARD].includes(
                tableKind,
            )
                ? __('英文名称')
                : __('字段技术名称'),
            key: 'name_en',
            width: 240,
            ellipsis: true,
            render: (_, record) => record.name_en,
        },
        {
            title: __('描述'),
            width: 120,
            ellipsis: true,
            key: 'description',
            render: (_, record) => record.description || __('无'),
        },
        {
            title: [
                FormTableKind.DATA_FUSION,
                FormTableKind.DATA_ORIGIN,
                FormTableKind.DATA_STANDARD,
            ].includes(tableKind)
                ? __('主键')
                : __('唯一标识'),
            key: 'is_primary_key',
            width: 90,
            render: (_, record) => (
                <div>{record.is_primary_key ? __('是') : __('否')}</div>
            ),
        },
        {
            title: __('必填'),
            width: 90,
            key: 'is_required',
            render: (_, record) => (
                <div>{record.is_required ? __('是') : __('否')}</div>
            ),
        },
        {
            title: __('本业务产生'),
            width: 150,
            key: 'is_current_business_generation',
            render: (_, record) => (
                <div>
                    {record.is_current_business_generation
                        ? __('是')
                        : __('否')}
                </div>
            ),
        },

        {
            title: __('需要标准化'),
            key: 'is_standardization_required',
            width: 150,
            render: (_, record) => (
                <div>
                    {record.is_standardization_required ? __('是') : __('否')}
                </div>
            ),
        },
        {
            title: __('数据标准'),
            width: 150,
            key: 'standard_id',
            render: (_, record) => (
                <ViewValueRange
                    type={ValueRangeType.DataElement}
                    value={`${record.standard_id}>><<`}
                    style={{ width: '120px' }}
                />
            ),
        },
        {
            title: __('数据类型'),
            width: 240,
            key: 'data_type',
            ellipsis: true,
            render: (_, record) => {
                // 数据类型
                const dataDisplayDataType =
                    (dataEnumOptions &&
                        dataEnumOptions.data_type?.length > 0 &&
                        dataEnumOptions?.data_type.find((item) => {
                            return item.value_en === record.data_type
                        })?.value) ||
                    '--'
                // 数据长度
                const dataDisplayLength =
                    (record.data_type === 'decimal' ||
                        record.data_type === 'char') &&
                    record.data_length !== null
                        ? record.data_length
                        : ''
                // 数据精度
                const dataDisplayAccuracy =
                    record.data_type === 'decimal' && record.data_length
                        ? record.data_accuracy
                        : ''
                // 补充内容
                const dataTypeCommand = dataDisplayLength
                    ? `(${__('长度：') + dataDisplayLength}${
                          dataDisplayAccuracy || dataDisplayAccuracy === 0
                              ? `, ${__('精度：')}${dataDisplayAccuracy}`
                              : ''
                      })`
                    : ''
                return `${dataDisplayDataType} ${dataTypeCommand}`
            },
        },

        {
            title: __('取值范围'),
            key: 'value_range',
            width: 280,
            // flag 需要调整
            render: (_, record) => (
                <ViewValueRange
                    type={record.value_range_type}
                    value={record.value_range}
                    style={{ width: '220px' }}
                />
            ),
        },
        {
            title: __('取值范围'),
            key: 'data_value_range',
            width: 280,
            // flag 需要调整
            render: (_, record) => record.value_range || '--',
        },
        {
            title: __('码表'),
            key: 'code_table',
            width: 280,
            ellipsis: true,
            render: (_, record) =>
                record.code_table ? (
                    <ViewValueRange
                        type={ValueRangeType.CodeTable}
                        value={`${record.code_table}>><<`}
                        style={{ width: '120px' }}
                        showLabel={false}
                    />
                ) : (
                    '--'
                ),
        },
        {
            title: __('编码规则'),
            key: 'encoding_rule',
            width: 280,
            ellipsis: true,
            render: (_, record) =>
                record.encoding_rule ? (
                    <ViewValueRange
                        type={ValueRangeType.CodeRule}
                        value={`${record.encoding_rule}>><<`}
                        style={{ width: '120px' }}
                        showLabel={false}
                    />
                ) : (
                    '--'
                ),
        },
        {
            title: __('字段关系'),
            key: 'field_relationship',
            width: 100,
            ellipsis: true,
            render: (_, record) => record.field_relationship || '--',
        },
        {
            title: __('数据分级'),
            key: 'label_name',
            width: 180,
            ellipsis: true,
            render: (_, record) => {
                return record.label_name ? (
                    <>
                        <FontIcon
                            name="icon-biaoqianicon"
                            style={{ color: record.label_icon, marginRight: 4 }}
                        />
                        <span title={record.label_path}>
                            {record.label_name}
                        </span>
                    </>
                ) : (
                    '--'
                )
            },
        },

        // {
        //     title: __('标准化状态'),
        //     key: 'standard_status',
        //     width: 120,
        //     render: (_, record) => (
        //         <div>
        //             <StandardStatusLabel value={record.standard_status} />
        //         </div>
        //     ),
        // },

        // {
        //     title: __('敏感属性'),
        //     key: 'sensitive_attribute',
        //     width: 100,
        //     render: (_, record) => (
        //         <div className={styles.nameTypeStyle}>
        //             {
        //                 SensibilityOption.find(
        //                     (option) =>
        //                         option.value === record.sensitive_attribute,
        //                 )?.label
        //             }
        //         </div>
        //     ),
        // },
        {
            title: __('涉密属性'),
            key: 'confidential_attribute',
            width: 100,
            render: (_, record) => (
                <div className={styles.nameTypeStyle}>
                    {
                        SecurityClassificationOption.find(
                            (option) =>
                                option.value === record.confidential_attribute,
                        )?.label
                    }
                </div>
            ),
        },

        {
            title: __('共享属性'),
            key: 'shared_attribute',
            width: 120,
            render: (_, record) => (
                <div className={styles.nameTypeStyle}>
                    {
                        SharedAttributeOption.find(
                            (option) =>
                                option.value === record.shared_attribute,
                        )?.label
                    }
                </div>
            ),
        },
        {
            title: __('开放属性'),
            key: 'open_attribute',
            width: 150,
            render: (_, record) => (
                <div className={styles.nameTypeStyle}>
                    {
                        OpenAttributeOption.find(
                            (option) => option.value === record.open_attribute,
                        )?.label
                    }
                </div>
            ),
        },
    ]
    return viewColumnsConfig[tableKind].map((columnKey) => ({
        ...columns.find((column) => column.key === columnKey),
    }))
}

/**
 * 单条数据的过滤结果
 * @param field 字段
 * @param searchWord 搜索关键字
 * @param filterType 过滤类型
 * @returns
 */
export const filterSingleData = (
    field: any,
    searchWord: string,
    filterType: RefStatus | '',
) => {
    // 匹配到中文或者英文名称， 如果未匹配到直接返回
    if (
        !field?.name
            .toLocaleLowerCase()
            .includes(searchWord.toLocaleLowerCase()) &&
        !field?.name_en
            .toLocaleLowerCase()
            .includes(searchWord.toLocaleLowerCase())
    ) {
        return false
    }

    // 处理过滤
    switch (filterType) {
        // 引用的条件
        case RefStatus.Refed:
            return !!field?.ref_id
        // 未被引用的条件
        case RefStatus.Unref:
            return !field?.ref_id

        // 返回全部
        default:
            return true
    }
}

// 智能推荐数据转换
export const transformDataOptions = async (
    recommendId: string,
    currentValues,
    recommendData,
): Promise<any> => {
    try {
        const { data } = await getDataEleDetailById({
            type: 2,
            value: recommendId,
        })
        let valueInfo = {}
        if (data?.rule_id) {
            valueInfo = {
                value_range_type: ValueRangeType.CodeRule,
                value_range: exChangeRangeDataToString({
                    id: data.rule_id,
                    name: data.rule_name,
                }),
            }
        } else if (data?.dict_id) {
            valueInfo = {
                value_range_type: ValueRangeType.CodeTable,
                value_range: exChangeRangeDataToString({
                    id: data.dict_id,
                    name: data.dict_name_cn,
                }),
            }
        } else {
            valueInfo = {
                value_range_type: ValueRangeType.None,
                value_range: '',
            }
        }

        return {
            ...currentValues,
            data_accuracy:
                recommendData?.data_accuracy ||
                currentValues.data_accuracy ||
                null,
            data_length:
                recommendData?.data_length || currentValues.data_length || null,
            data_type:
                recommendData?.data_type || currentValues.data_type || '',
            formulate_basis: recommendData?.std_type_name,
            id: '',
            name: recommendData?.name,
            name_en: recommendData?.name_en,
            standard_id: recommendData?.id,
            standard_status: 'normal',
            uniqueId: currentValues?.uniqueId,
            ...valueInfo,
        }
    } catch (ex) {
        formatError(ex)
        return Promise.reject(ex)
    }
}

interface IAutoCompleteInput {
    // 当前的值
    value?: string
    // 改变事件
    onChange?: (value: string) => void
    // 任务id
    taskId?: string
    // 业务表名称
    formName: string

    // 标准分类的选项
    formulateBasisOptions: Array<any>

    // 选择智能推荐的数据
    onRecommendOptions: (newFields: any) => void

    // 当前行数据
    record: any

    parentNode?: any

    departmentId?: string
}

/**
 *  智能推荐输入框
 * @returns
 */
export const AutoCompleteInput: FC<IAutoCompleteInput> = ({
    value,
    onChange = noop,
    taskId = '',
    formName = '',
    formulateBasisOptions,
    onRecommendOptions = noop,
    record,
    parentNode,
    departmentId = '',
}) => {
    // 智能推荐的数据
    const [recommendFieldData, setRecommendFieldData] = useState<Array<any>>([])
    // 是否聚焦
    const [isFocus, setIsFocus] = useState<boolean>(false)

    // 监控名称变化
    const nameDebounce = useDebounce(value, { wait: 500 })

    useEffect(() => {
        // 获取智能推荐内容
        if (isFocus) {
            getRecommendFileds(nameDebounce)
        }
    }, [nameDebounce])

    // 获取智能推荐字段
    const getRecommendFileds = async (name) => {
        try {
            if (name) {
                const recommendData = await getStandardRecommend({
                    ...recommendParamTemplate,
                    department_id: departmentId,
                    task_no: taskId || '',
                    table: formName || '',
                    table_fields: [
                        {
                            table_field: name,
                            table_field_description: '',
                            std_ref_file: '',
                        },
                    ],
                })
                setRecommendFieldData(recommendData[0].rec_stds)
            } else {
                setRecommendFieldData([])
            }
        } catch (ex) {
            formatError(ex)
        }
    }

    return (
        <div style={{ display: 'flex', alignItems: 'center' }}>
            <AutoComplete
                style={{
                    borderRadius: '4px 0 0 4px',
                }}
                value={value}
                onFocus={() => {
                    setIsFocus(true)
                    if (nameDebounce) {
                        getRecommendFileds(nameDebounce)
                    }
                }}
                onSearch={onChange}
                onBlur={() => {
                    setIsFocus(false)
                }}
                placeholder={__('请输入中文名称')}
                notFoundContent={null}
                getPopupContainer={(element) =>
                    parentNode || element.parentNode
                }
                options={recommendFieldData.map((recommendField) => ({
                    label: (
                        <div className={styles.optionsItems}>
                            <div className={styles.optionName}>
                                {recommendField?.name || ''}
                            </div>
                            <div className={styles.optionFormulate}>
                                {formulateBasisOptions.find(
                                    (currentFormulate) =>
                                        currentFormulate.value_en ===
                                        recommendField?.std_type_name,
                                )?.value || '--'}
                            </div>
                        </div>
                    ),
                    value: recommendField?.id,
                    data: recommendField,
                }))}
                onSelect={async (selectValue, option) => {
                    const standardValues = await transformDataOptions(
                        selectValue,
                        record,
                        option.data,
                    )
                    onRecommendOptions(standardValues)
                }}
                maxLength={220}
            />
        </div>
    )
}

interface IDataTypeTemplate {
    // 当前行的字段
    fields: any
    // 数据类型枚举的集合
    dataTypes: Array<any>
    // 是否使用传入的原有dataTypes作为options
    isUseOriginDataTypes?: boolean
    // 表单名称前两项
    names: Array<string | number>
    // 表单实例
    form: FormInstance<any>
    parentNode: any
    // 是否必填
    isRequired: boolean
    // 是否需要类型禁止填写项
    isNeedHoldingComp?: boolean
    // 数据类型改变
    onDataTypeChange?: (newValue) => void
}
/**
 * 类型模块
 * @param record
 * @returns
 */
export const DataTypeTemplate: FC<IDataTypeTemplate> = ({
    fields,
    dataTypes,
    isUseOriginDataTypes = false,
    names,
    form,
    parentNode,
    isRequired,
    isNeedHoldingComp,
    onDataTypeChange = noop,
}) => {
    const newDataTypes = isUseOriginDataTypes
        ? dataTypes
        : dataTypes.map((dataTypeOption) => ({
              label: dataTypeOption.value,
              value: dataTypeOption.value_en,
          }))
    switch (fields.data_type) {
        // 数字类型
        case DataType.TDECIMAL:
        case 'decimal':
            return (
                <Space size={8}>
                    <FormItemContainer
                        name={[...names, 'data_type']}
                        validateTrigger={['onChange', 'onBlur']}
                        rules={[
                            {
                                required: isRequired,
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
                            options={newDataTypes}
                            onChange={onDataTypeChange}
                        />
                    </FormItemContainer>
                    <FormItemContainer
                        name={[...names, 'data_length']}
                        validateTrigger={['onChange', 'onBlur']}
                        validateFirst
                        rules={[
                            {
                                required: true,
                                message: __('请输入数据长度'),
                            },
                            {
                                validateTrigger: ['onBlur'],
                                validator: (e, value) =>
                                    checkNumberRanage(
                                        e,
                                        value,
                                        {
                                            max: 38,
                                            min: 1,
                                        },
                                        __('请输入1～38之间的整数'),
                                    ),
                            },
                        ]}
                        id={`fields-${names[1]}-data_length`}
                        parentNode={parentNode}
                    >
                        <NumberInput
                            style={{ width: 148 }}
                            placeholder={__('长度（1~38）')}
                            min={1}
                            max={38}
                            type={NumberType.Natural}
                            onChange={() =>
                                form.validateFields([
                                    [...names, 'data_accuracy'],
                                ])
                            }
                            prefix={<span style={{ color: '#FF4D4F' }}>*</span>}
                        />
                    </FormItemContainer>
                    <Form.Item
                        noStyle
                        shouldUpdate={(prev, current) =>
                            prev.data_length !== current.data_length
                        }
                    >
                        {({ getFieldValue }) => {
                            return (
                                <FormItemContainer
                                    name={[...names, 'data_accuracy']}
                                    validateFirst
                                    validateTrigger={['onChange', 'onBlur']}
                                    rules={[
                                        {
                                            required: true,
                                            message: __('请输入数据精度'),
                                        },
                                        {
                                            validateTrigger: ['onBlur'],
                                            validator: (e, value) =>
                                                checkNumberRanage(
                                                    e,
                                                    value,
                                                    {
                                                        max: getFieldValue([
                                                            ...names,
                                                            'data_length',
                                                        ]),
                                                        min: 0,
                                                    },
                                                    __(
                                                        '数据精度不能大于数据长度',
                                                    ),
                                                ),
                                        },
                                    ]}
                                    id={`fields-${names[1]}-data_accuracy`}
                                    parentNode={parentNode}
                                >
                                    <NumberInput
                                        style={{ width: 148 }}
                                        placeholder={__('精度（要≤长度）')}
                                        max={getFieldValue([
                                            ...names,
                                            'data_length',
                                        ])}
                                        type={NumberType.Natural}
                                        prefix={
                                            <span style={{ color: '#FF4D4F' }}>
                                                *
                                            </span>
                                        }
                                    />
                                </FormItemContainer>
                            )
                        }}
                    </Form.Item>
                </Space>
            )
        // 二进制和字符串
        case 'binary':
        case DataType.TCHAR:
        case 'char':
            return (
                <Space size={8}>
                    <FormItemContainer
                        name={[...names, 'data_type']}
                        validateTrigger={['onChange', 'onBlur']}
                        rules={[
                            {
                                required: isRequired,
                                message: __('请选择数据类型'),
                            },
                        ]}
                        id={`fields-${names[1]}-data_type`}
                        parentNode={parentNode}
                    >
                        <Select
                            style={{ width: '120px' }}
                            placeholder={__('请选择')}
                            getPopupContainer={(element) =>
                                parentNode || element.parentNode
                            }
                            options={newDataTypes}
                            onChange={onDataTypeChange}
                        />
                    </FormItemContainer>
                    <FormItemContainer
                        name={[...names, 'data_length']}
                        validateTrigger={['onChange', 'onBlur']}
                        rules={[
                            {
                                validateTrigger: ['onBlur'],
                                validator: (_, value) => {
                                    if (!value || value === 0) {
                                        return Promise.resolve()
                                    }
                                    if (numberReg.test(value)) {
                                        return Promise.resolve()
                                    }
                                    return Promise.reject(
                                        __('请输入1～65535之间的整数'),
                                    )
                                },
                                pattern: numberReg,
                                message: __('请输入1～65535之间的整数'),
                            },
                        ]}
                        id={`fields-${names[1]}-data_length`}
                        parentNode={parentNode}
                    >
                        <InputNumber
                            style={{ width: 148 }}
                            placeholder={__('长度（1～65535）')}
                            min={1}
                            max={65535}
                        />
                    </FormItemContainer>
                    {isNeedHoldingComp && (
                        <HoldingComponent
                            style={{ width: '90px' }}
                            text={__('数据精度')}
                        />
                    )}
                </Space>
            )
        // 默认类型，不需要长度的类型
        default:
            return (
                <Space size={8}>
                    <FormItemContainer
                        name={[...names, 'data_type']}
                        validateTrigger={['onChange', 'onBlur']}
                        rules={[
                            {
                                required: isRequired,
                                message: __('请选择数据类型'),
                            },
                            {
                                validator: (_, val) => {
                                    if (
                                        val === __('数字型') ||
                                        val === 'number'
                                    ) {
                                        return Promise.reject(
                                            new Error(
                                                __(
                                                    '当前数据类型已拆分，请重新选择更具体的类型',
                                                ),
                                            ),
                                        )
                                    }
                                    return Promise.resolve()
                                },
                            },
                        ]}
                        id={`fields-${names[1]}-data_type`}
                        parentNode={parentNode}
                    >
                        <Select
                            style={{ width: '120px' }}
                            placeholder={__('请选择数据类型')}
                            options={newDataTypes}
                            getPopupContainer={(element) =>
                                parentNode || element.parentNode
                            }
                            onChange={onDataTypeChange}
                        />
                    </FormItemContainer>
                    {isNeedHoldingComp && (
                        <>
                            <HoldingComponent
                                style={{ width: '90px' }}
                                text={__('数据长度')}
                            />
                            <HoldingComponent
                                style={{ width: '90px' }}
                                text={__('数据精度')}
                            />
                        </>
                    )}
                </Space>
            )
    }
}

interface IRadioBox {
    // 选中状态
    checked?: boolean
    // 选中变更
    onChange?: (checked: boolean) => void

    // 禁用状态
    disabled?: boolean
    tip?: string
}

/**
 * 是否组件
 */
export const RadioBox: FC<IRadioBox> = ({
    checked = 0,
    onChange = noop,
    disabled = false,
    tip = '',
}) => {
    // 添加防抖机制，避免多次快速点击导致的状态混乱
    const debouncedOnChange = useRef(
        debounce((newValue: number) => {
            onChange(newValue)
        }, 150),
    ).current

    const handleClick = useCallback(
        (e) => {
            e.stopPropagation()
            if (!disabled) {
                const newValue = checked ? 0 : 1
                debouncedOnChange(newValue)
            }
        },
        [checked, disabled, debouncedOnChange],
    )

    return (
        <div className={styles.radioBox} onClick={handleClick}>
            {checked ? (
                <Tooltip title={tip}>
                    <CheckCircleFilled
                        className={classnames(
                            styles.checked,
                            disabled ? styles.checkedDisabled : '',
                        )}
                    />
                </Tooltip>
            ) : (
                <div
                    className={classnames(
                        styles.unchecked,
                        disabled ? styles.uncheckedDisabled : '',
                    )}
                />
            )}
        </div>
    )
}

interface IFieldsStatusTip {
    value?: boolean
}
export const FieldsStatusTip: FC<IFieldsStatusTip> = ({ value }) => {
    return (
        <div
            className={
                value
                    ? styles.unifiedValueStatusBox
                    : styles.multiValueStatusBox
            }
        >
            {value ? (
                <Tooltip
                    title={__('此列设置值全部一致')}
                    color="#fff"
                    overlayInnerStyle={{
                        color: 'rgba(0,0,0,0.8)',
                    }}
                >
                    <div className={styles.content}>{__('统一值')}</div>
                </Tooltip>
            ) : (
                <Tooltip
                    title={__('此列设置值存在多值')}
                    color="#fff"
                    overlayInnerStyle={{
                        color: 'rgba(0,0,0,0.8)',
                    }}
                >
                    <div className={styles.content}>{__('多项值')}</div>
                </Tooltip>
            )}
        </div>
    )
}

/**
 * Columns获取表头
 */
interface IGetEditTableColumns {
    // 所有枚举类型
    dataEnumOptions: IFormEnumConfigModel | null
    // 获取所有字段
    getAllFieldsData: () => Array<any>

    // 任务id
    taskId: string

    // 表信息
    formInfo: any

    // 表单实例
    form: FormInstance<any>

    // 标准规则详情Map
    standardRuleDetail: StandardDataDetail

    // 触发操作
    onOptionData?: (key: OptionType | string, index: number) => void

    // 是否配置模式
    isConfigModel?: boolean

    parentNode: any
    tagOptions: any
    departmentId?: string
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

const displayRender = (label, selectedOptions) => {
    if (Array.isArray(selectedOptions) && selectedOptions.length > 0) {
        const tagInfo = selectedOptions[selectedOptions.length - 1]
        return (
            <span>
                <FontIcon
                    name="icon-biaoqianicon"
                    style={{
                        color: tagInfo?.icon || tagInfo?.label_icon,
                        marginRight: 4,
                    }}
                />
                <span title={tagInfo?.name}>{tagInfo?.name}</span>
            </span>
        )
    }
    return null
}

/**
 * 获取数据元详情
 * @param id 数据元id
 */
export const getDataEleDetail = async (id: string) => {
    try {
        if (id) {
            const res = await getDataEleDetailById({
                type: 2,
                value: id,
            })
            const {
                data_type,
                standard_status,
                value_range,
                value_range_type,
                data_length,
                data_accuracy,
                name_en,
                standard_id,
            } = standardDataReplace(res.data)

            return {
                data_accuracy: data_accuracy || null,
                data_length: data_length || null,
                data_type: data_type || '',
                value_range: value_range || '',
                value_range_type: value_range_type || '',
                name_en: name_en || '',
                standard_id,
                standard_status: 'normal',
            }
        }
        return {}
    } catch (err) {
        formatError(err)
        return {}
    }
}

/**
 * 数据标准选择
 * @param param0
 * @returns
 */
const DataStandardSelect = ({
    value,
    onChange = noop,
    standardRuleDetail,
    form,
    index,
}: {
    value?: string
    onChange?: (newValue: string) => void
    standardRuleDetail: StandardDataDetail
    form: FormInstance<any>
    index: number
}) => {
    return (
        <SelectValueRange
            value={`${value}>><<`}
            onChange={async (newValue) => {
                const objInfo = exChangeRangeDataToObj(newValue)
                onChange(objInfo?.id || '')
                const standardData = await getDataEleDetail(objInfo?.id || '')
                const newFields = form.getFieldValue('fields')
                form.setFieldValue(
                    'fields',
                    newFields.map((item, innerIndex) =>
                        innerIndex === index
                            ? { ...item, ...standardData }
                            : item,
                    ),
                )
            }}
            type={ValueRangeType.DataElement}
            standardRuleDetail={standardRuleDetail}
            style={{ width: '240px' }}
        />
    )
}

/**
 * 获取可编辑表表头
 * @param param0
 * @returns
 */
export const getEditTableColumns = ({
    dataEnumOptions,
    getAllFieldsData,
    formInfo,
    taskId,
    form,
    standardRuleDetail,
    onOptionData = noop,
    isConfigModel = false,
    parentNode,
    tagOptions,
    departmentId = '',
}: IGetEditTableColumns): ColumnsType<any> => {
    return [
        {
            key: 'standard_status',
            width: 32,
            fixed: 'left',
            render: (_, record, index) => {
                return record.standard_status === 'normal' ? (
                    <StandardOutlined
                        style={{
                            color: '#126ee3',
                            fontSize: '18px',
                        }}
                    />
                ) : null
            },
        },
        {
            title: isConfigModel ? (
                <div className={styles.tableTitleContainer}>
                    <span className={styles.fieldLabel}>{__('中文名称')}</span>
                    <div className={styles.tips}>{__('不支持批量配置')}</div>
                </div>
            ) : (
                <span className={styles.fieldLabel}>{__('中文名称')}</span>
            ),
            key: 'name',
            width: 240,
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
                            pattern: keyboardReg,
                            message: ErrorInfo.EXCEPTEMOJI,
                            transform: (value) => trim(value),
                        },
                        {
                            validateTrigger: ['onBlur'],
                            validator: (e, value) =>
                                checkRepeatName(
                                    value,
                                    record,
                                    getAllFieldsData(),
                                ),
                        },
                    ]}
                    id={`fields-${index}-name`}
                    parentNode={parentNode}
                >
                    <AutoCompleteInput
                        taskId={taskId}
                        formName={formInfo?.name || ''}
                        formulateBasisOptions={
                            dataEnumOptions?.formulate_basis || []
                        }
                        onRecommendOptions={(newItems) => {
                            const newFields = form.getFieldValue('fields')
                            form.setFieldValue(
                                'fields',
                                newFields.map((currentField, innerIndex) =>
                                    innerIndex === index
                                        ? {
                                              ...record,
                                              ...newItems,
                                          }
                                        : currentField,
                                ),
                            )

                            if (isConfigModel) {
                                const allFields = form.getFieldValue('fields')

                                form.setFieldValue(
                                    ['formulate_basis', 'status'],
                                    getBatchValuesStatus(
                                        allFields,
                                        'formulate_basis',
                                    ),
                                )
                            }
                        }}
                        record={record}
                        parentNode={parentNode}
                        departmentId={departmentId}
                    />
                </FormItemContainer>
            ),
        },
        {
            title: isConfigModel ? (
                <div className={styles.tableTitleContainer}>
                    <span className={styles.fieldLabel}>{__('英文名称')}</span>
                    <div className={styles.tips}>{__('不支持批量配置')}</div>
                </div>
            ) : (
                <span className={styles.fieldLabel}>{__('英文名称')}</span>
            ),
            key: 'name_en',
            width: 240,
            render: (_, record, index) => (
                <FormItemContainer
                    name={['fields', index, 'name_en']}
                    validateFirst
                    validateTrigger={['onChange', 'onBlur']}
                    rules={[
                        {
                            required: true,
                            transform: (val) => trim(val),
                            message: __('输入不能为空'),
                        },
                        {
                            pattern: entendNameEnReg,
                            message: __(
                                '仅支持英文、数字、下划线及中划线，且不能以下划线和中划线开头',
                            ),
                            transform: (value) => trim(value),
                        },
                    ]}
                    id={`fields-${index}-name_en`}
                    parentNode={parentNode}
                >
                    <Input
                        style={{
                            borderRadius: '4px',
                            width: '220px',
                        }}
                        autoComplete="off"
                        placeholder={__('请输入英文名称')}
                        maxLength={128}
                    />
                </FormItemContainer>
            ),
        },
        {
            title: isConfigModel ? (
                <div className={styles.tableTitleContainer}>
                    <span>{__('描述')}</span>
                    <div className={styles.tips}>{__('不支持批量配置')}</div>
                </div>
            ) : (
                __('描述')
            ),
            width: 196,
            key: 'description',
            render: (_, record, index) => (
                <FormItemContainer
                    name={['fields', index, 'description']}
                    validateFirst
                    validateTrigger={['onChange', 'onBlur']}
                    rules={[
                        {
                            validateTrigger: ['onBlur'],
                            validator: (e, value) => checkNormalInput(e, value),
                        },
                    ]}
                    parentNode={parentNode}
                >
                    <Input
                        placeholder={__('请输入')}
                        maxLength={128}
                        autoComplete="off"
                        style={{ width: '160px' }}
                        allowClear
                    />
                </FormItemContainer>
            ),
        },
        {
            title: isConfigModel ? (
                <div className={styles.tableTitleContainer}>
                    <span>{__('唯一标识')}</span>
                    <div className={styles.tips}>{__('不支持批量')}</div>
                </div>
            ) : (
                <span>{__('唯一标识')}</span>
            ),
            key: 'is_primary_key',
            width: isConfigModel ? 102 : 88,
            render: (_, record, index) => (
                <Form.Item
                    name={['fields', index, 'is_primary_key']}
                    valuePropName="checked"
                >
                    <RadioBox />
                </Form.Item>
            ),
        },
        {
            title: isConfigModel ? (
                <div className={styles.tableTitleContainer}>
                    <span>{__('必填')}</span>
                    <div>
                        <Form.Item name={['is_required', 'value']} noStyle>
                            <Select
                                options={BooleanDataOptions}
                                placeholder={__('多项值')}
                                style={{ width: '92px' }}
                            />
                        </Form.Item>
                    </div>
                </div>
            ) : (
                // <div className={styles.titleContent}>
                //     <div className={styles.itemContent}>
                //         <span>{__('必填')}</span>
                //     </div>
                //     <div className={styles.itemContent}>
                //         <Form.Item
                //             name={['is_required', 'value']}
                //             valuePropName="checked"
                //             noStyle
                //         >
                //             <RadioBox />
                //         </Form.Item>
                //     </div>
                //     <div className={styles.itemContent}>
                //         <Form.Item name={['is_required', 'status']} noStyle>
                //             <FieldsStatusTip />
                //         </Form.Item>
                //     </div>
                // </div>
                <span>{__('必填')}</span>
            ),
            width: isConfigModel ? 128 : 88,
            key: 'is_required',
            render: (_, record, index) => (
                <Form.Item
                    name={['fields', index, 'is_required']}
                    valuePropName="checked"
                >
                    <RadioBox
                        disabled={record.is_primary_key && record.is_required}
                        tip={
                            record.is_primary_key && record.is_required
                                ? __('唯一标识字段默认设为必填字段')
                                : ''
                        }
                    />
                </Form.Item>
            ),
        },
        {
            title: isConfigModel ? (
                <div className={styles.tableTitleContainer}>
                    <span>{__('本业务产生')}</span>
                    <div>
                        <Form.Item
                            name={['is_current_business_generation', 'value']}
                            noStyle
                        >
                            <Select
                                options={BooleanDataOptions}
                                placeholder={__('多项值')}
                                style={{ width: '92px' }}
                            />
                        </Form.Item>
                    </div>
                </div>
            ) : (
                __('本业务流程产生')
            ),
            width: 134,
            key: 'is_current_business_generation',
            render: (_, record, index) => (
                <Form.Item
                    name={['fields', index, 'is_current_business_generation']}
                    valuePropName="checked"
                >
                    <RadioBox />
                </Form.Item>
            ),
        },
        {
            title: isConfigModel ? (
                <div className={styles.tableTitleContainer}>
                    <span>{__('是否标准')}</span>
                    <div>
                        <Form.Item
                            name={['is_standardization_required', 'value']}
                            noStyle
                        >
                            <Select
                                options={BooleanDataOptions}
                                placeholder={__('多项值')}
                                style={{ width: '92px' }}
                            />
                        </Form.Item>
                    </div>
                </div>
            ) : (
                // (
                // <div className={styles.titleContent}>
                //     <div className={styles.itemContent}>
                //         <span>{__('需标准化')}</span>
                //     </div>
                //     <div className={styles.itemContent}>
                //         <Form.Item
                //             name={['is_standardization_required', 'value']}
                //             valuePropName="checked"
                //             noStyle
                //         >
                //             <RadioBox />
                //         </Form.Item>
                //     </div>
                //     <div className={styles.itemContent}>
                //         <Form.Item
                //             name={['is_standardization_required', 'status']}
                //             noStyle
                //         >
                //             <FieldsStatusTip />
                //         </Form.Item>
                //     </div>
                // </div>
                // )
                <span>{__('需要标准化')}</span>
            ),
            width: 130,
            key: 'is_standardization_required',
            render: (_, record, index) => (
                <Form.Item
                    name={['fields', index, 'is_standardization_required']}
                    valuePropName="checked"
                >
                    <RadioBox />
                </Form.Item>
            ),
        },
        {
            title: isConfigModel ? (
                <div className={styles.tableTitleContainer}>
                    <span>{__('数据标准')}</span>
                    <div className={styles.tips}>{__('不支持批量配置')}</div>
                </div>
            ) : (
                __('数据标准')
            ),
            width: 260,
            key: 'standard_id',
            render: (_, record, index) => (
                <FormItemContainer
                    name={['fields', index, 'standard_id']}
                    parentNode={parentNode}
                >
                    <DataStandardSelect
                        standardRuleDetail={standardRuleDetail}
                        form={form}
                        index={index}
                    />
                </FormItemContainer>
            ),
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
            width: 360,
            key: 'data_type',
            render: (_, record, index) => (
                <DataTypeTemplate
                    names={['fields', index]}
                    fields={record}
                    dataTypes={(dataEnumOptions?.data_type || []).filter(
                        (item) => item.value_en !== 'number',
                    )}
                    form={form}
                    parentNode={parentNode}
                    isRequired={formInfo.table_kind === FormTableKind.STANDARD}
                />
            ),
        },
        {
            title: isConfigModel ? (
                <div className={styles.tableTitleContainer}>
                    <span className={styles.fieldLabel}>{__('取值范围')}</span>
                    <div className={styles.tips}>{__('不支持批量配置')}</div>
                </div>
            ) : (
                <span>{__('取值范围')}</span>
            ),
            key: 'value_range',
            width: 482,
            // flag 需要调整
            render: (_, record, index) => (
                <div className={styles.tableValeRangeItem}>
                    <FormItemContainer
                        name={['fields', index, 'value_range_type']}
                        rules={[
                            {
                                required: true,
                                transform: (val) => trim(val),
                                message: __('请选择取值范围类型'),
                            },
                        ]}
                        parentNode={parentNode}
                    >
                        <Select
                            style={{
                                borderRadius: '0 4px 4px 0',
                                width: '108px',
                            }}
                            placeholder={__('请选择')}
                            options={ValueRangeOptions}
                            onChange={() => {
                                form.setFields([
                                    {
                                        name: ['fields', index, 'value_range'],
                                        errors: [],
                                        value: null,
                                    },
                                ])
                            }}
                            getPopupContainer={(element) =>
                                parentNode || element.parentNode
                            }
                        />
                    </FormItemContainer>
                    <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, curValues) =>
                            prevValues?.fields[index]?.value_range_type !==
                            curValues?.fields[index]?.value_range_type
                        }
                    >
                        {({ getFieldValue }) => {
                            const valueRangeType = getFieldValue([
                                'fields',
                                index,
                                'value_range_type',
                            ])
                            return valueRangeType === ValueRangeType.None ? (
                                <HoldingComponent
                                    style={{ width: '330px' }}
                                    text={__('无限制取值范围无需配置此选项')}
                                />
                            ) : valueRangeType === ValueRangeType.Custom ? (
                                <FormItemContainer
                                    name={['fields', index, 'value_range']}
                                    rules={[]}
                                >
                                    <Input placeholder={__('请输入取值范围')} />
                                </FormItemContainer>
                            ) : (
                                <FormItemContainer
                                    name={['fields', index, 'value_range']}
                                    rules={
                                        !valueRangeType ||
                                        valueRangeType === ValueRangeType.None
                                            ? []
                                            : [
                                                  {
                                                      required: true,
                                                      transform: (val) =>
                                                          trim(val),
                                                      message:
                                                          valueRangeType ===
                                                          ValueRangeType.CodeTable
                                                              ? __('请选择码表')
                                                              : __(
                                                                    '请设置编码规则',
                                                                ),
                                                  },
                                                  {
                                                      transform: (val) =>
                                                          trim(val),
                                                      validator:
                                                          keyboardInputValidator(),
                                                  },
                                              ]
                                    }
                                    id={`fields-${index}-value_range`}
                                    validateTrigger={['onChange']}
                                    parentNode={parentNode}
                                >
                                    <SelectValueRange
                                        type={valueRangeType}
                                        standardRuleDetail={standardRuleDetail}
                                        style={{ width: '330px' }}
                                        onChange={(currentValue) => {
                                            form.setFields([
                                                {
                                                    name: [
                                                        'fields',
                                                        index,
                                                        'value_range',
                                                    ],
                                                    errors: [],
                                                    value: currentValue,
                                                },
                                            ])
                                        }}
                                    />
                                </FormItemContainer>
                            )
                        }}
                    </Form.Item>
                </div>
            ),
        },
        {
            title: isConfigModel ? (
                <div className={styles.tableTitleContainer}>
                    <span>{__('字段关系')}</span>
                    <div className={styles.tips}>{__('不支持批量配置')}</div>
                </div>
            ) : (
                __('字段关系')
            ),
            key: 'field_relationship',
            width: 196,
            ellipsis: true,
            render: (_, record, index) => (
                <FormItemContainer
                    name={['fields', index, 'field_relationship']}
                    validateFirst
                    validateTrigger={['onChange', 'onBlur']}
                    rules={[
                        {
                            validateTrigger: ['onBlur'],
                            validator: (e, value) => checkNormalInput(e, value),
                        },
                    ]}
                    parentNode={parentNode}
                >
                    <Input
                        placeholder={__('请输入')}
                        maxLength={128}
                        autoComplete="off"
                        style={{ width: '160px' }}
                        allowClear
                    />
                </FormItemContainer>
            ),
        },

        {
            title: __('数据分级'),
            width: 170,
            key: 'label_id',
            render: (_, record, index) => (
                <Form.Item name={['fields', index, 'label_id']}>
                    <Cascader
                        options={tagOptions}
                        placeholder="请选择"
                        className={styles.tagCascaderWrapper}
                        popupClassName={styles.tagCascaderWrapper}
                        displayRender={displayRender}
                    />
                </Form.Item>
            ),
        },
        // {
        //     title: isConfigModel ? (
        //         <div className={styles.tableTitleContainer}>
        //             <span>{__('敏感属性')}</span>
        //             <div>
        //                 <Form.Item
        //                     name={['sensitive_attribute', 'value']}
        //                     noStyle
        //                 >
        //                     <Select
        //                         placeholder={__('多项值')}
        //                         style={{ width: '92px' }}
        //                         options={SensibilityOption}
        //                         getPopupContainer={(element) =>
        //                             parentNode || element.parentNode
        //                         }
        //                     />
        //                 </Form.Item>
        //             </div>
        //         </div>
        //     ) : (
        //         // (
        //         // <div className={styles.titleContent}>
        //         //     <div className={styles.itemContent}>
        //         //         <span>{__('敏感属性')}</span>
        //         //     </div>
        //         //     <div className={styles.itemContent}>
        //         //         <Form.Item
        //         //             name={['sensitive_attribute', 'value']}
        //         //             noStyle
        //         //         >
        //         //             <Select
        //         //                 placeholder={__('请选择')}
        //         //                 style={{ width: '90px' }}
        //         //                 options={SensibilityOption}
        //         //                 getPopupContainer={(element) =>
        //         //                     parentNode || element.parentNode
        //         //                 }
        //         //             />
        //         //         </Form.Item>
        //         //     </div>
        //         //     <div className={styles.itemContent}>
        //         //         <Form.Item
        //         //             name={['sensitive_attribute', 'status']}
        //         //             noStyle
        //         //         >
        //         //             <FieldsStatusTip />
        //         //         </Form.Item>
        //         //     </div>
        //         // </div>
        //         // )
        //         <span>{__('敏感属性')}</span>
        //     ),
        //     key: 'sensitive_attribute',
        //     width: 128,
        //     render: (_, record, index) => (
        //         <FormItemContainer
        //             name={['fields', index, 'sensitive_attribute']}
        //             validateTrigger={['onChange', 'onBlur']}
        //             rules={
        //                 record.ref_id
        //                     ? []
        //                     : [
        //                           {
        //                               required: true,
        //                               message: __('请选择敏感属性'),
        //                           },
        //                       ]
        //             }
        //         >
        //             <Select
        //                 placeholder={__('请选择')}
        //                 style={{ width: '92px' }}
        //                 options={SensibilityOption}
        //                 disabled={!!record.ref_id}
        //                 getPopupContainer={(element) =>
        //                     parentNode || element.parentNode
        //                 }
        //             />
        //         </FormItemContainer>
        //     ),
        // },
        {
            title: isConfigModel ? (
                <div className={styles.tableTitleContainer}>
                    <span>{__('涉密属性')}</span>
                    <div>
                        <Form.Item
                            name={['confidential_attribute', 'value']}
                            noStyle
                        >
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
                // (
                // <div className={styles.titleContent}>
                //     <div className={styles.itemContent}>
                //         <span>{__('涉密属性')}</span>
                //     </div>
                //     <div className={styles.itemContent}>
                //         <Form.Item
                //             name={['confidential_attribute', 'value']}
                //             noStyle
                //         >
                //             <Select
                //                 placeholder={__('请选择')}
                //                 style={{ width: '90px' }}
                //                 options={SecurityClassificationOption}
                //                 getPopupContainer={(element) =>
                //                     parentNode || element.parentNode
                //                 }
                //             />
                //         </Form.Item>
                //     </div>
                //     <div className={styles.itemContent}>
                //         <Form.Item
                //             name={['confidential_attribute', 'status']}
                //             noStyle
                //         >
                //             <FieldsStatusTip />
                //         </Form.Item>
                //     </div>
                // </div>
                // )
                <span>{__('涉密属性')}</span>
            ),
            key: 'confidential_attribute',
            width: 128,
            render: (_, record, index) => (
                <FormItemContainer
                    name={['fields', index, 'confidential_attribute']}
                    validateTrigger={['onChange', 'onBlur']}
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
                    <span>{__('共享属性')}</span>
                    <div>
                        <Form.Item name={['shared_attribute', 'value']} noStyle>
                            <Select
                                placeholder={__('多项值')}
                                style={{ width: '134px' }}
                                options={SharedAttributeOption}
                                getPopupContainer={(element) =>
                                    parentNode || element.parentNode
                                }
                            />
                        </Form.Item>
                    </div>
                </div>
            ) : (
                // (
                // <div className={styles.titleContent}>
                //     <div className={styles.itemContent}>
                //         <span>{__('共享属性')}</span>
                //     </div>
                //     <div className={styles.itemContent}>
                //         <Form.Item
                //             name={['shared_attribute', 'value']}
                //             valuePropName="checked"
                //             noStyle
                //         >
                //             <Select
                //                 placeholder={__('请选择')}
                //                 style={{ width: '120px' }}
                //                 options={SharedAttributeOption}
                //                 getPopupContainer={(element) =>
                //                     parentNode || element.parentNode
                //                 }
                //             />
                //         </Form.Item>
                //     </div>
                //     <div className={styles.itemContent}>
                //         <Form.Item
                //             name={['shared_attribute', 'status']}
                //             noStyle
                //         >
                //             <FieldsStatusTip />
                //         </Form.Item>
                //     </div>
                // </div>
                // )
                <span>{__('共享属性')}</span>
            ),
            key: 'shared_attribute',
            width: 338,
            render: (_, record, index) => (
                <Space size={8}>
                    <FormItemContainer
                        name={['fields', index, 'shared_attribute']}
                        validateTrigger={['onChange', 'onBlur']}
                        rules={[
                            {
                                required: true,
                                message: __('请选择共享属性'),
                            },
                        ]}
                    >
                        <Select
                            placeholder={__('请选择')}
                            style={{ width: '134px' }}
                            options={SharedAttributeOption}
                            getPopupContainer={(element) =>
                                parentNode || element.parentNode
                            }
                        />
                    </FormItemContainer>
                    <Form.Item
                        shouldUpdate={(prevValues, curValues) =>
                            prevValues?.fields[index]?.shared_attribute !==
                            curValues?.fields[index]?.shared_attribute
                        }
                        noStyle
                    >
                        {({ getFieldValue }) => {
                            const sharedType = getFieldValue([
                                'fields',
                                index,
                                'shared_attribute',
                            ])
                            return sharedType !==
                                SharedAttribute.UnconditionalShare ? (
                                <FormItemContainer
                                    name={['fields', index, 'shared_condition']}
                                    rules={[
                                        {
                                            required: true,
                                            message: `请输入${
                                                sharedType ===
                                                SharedAttribute.ConditionalShare
                                                    ? __('共享条件')
                                                    : __('不予共享依据')
                                            }`,
                                        },
                                        {
                                            validator: keyboardInputValidator(),
                                        },
                                    ]}
                                    validateFirst
                                    id={`fields-${index}-shared_condition`}
                                >
                                    <Input
                                        maxLength={128}
                                        style={{ width: '160px' }}
                                        placeholder={
                                            sharedType ===
                                            SharedAttribute.ConditionalShare
                                                ? __('共享条件(必填)')
                                                : __('不予共享依据（必填）')
                                        }
                                    />
                                </FormItemContainer>
                            ) : (
                                <HoldingComponent
                                    style={{ width: '160px' }}
                                    text={__('无需配置此选项')}
                                />
                            )
                        }}
                    </Form.Item>
                </Space>
            ),
        },
        {
            title: isConfigModel ? (
                <div className={styles.tableTitleContainer}>
                    <span>{__('开放属性')}</span>
                    <div>
                        <Form.Item name={['open_attribute', 'value']} noStyle>
                            <Select
                                placeholder={__('多项值')}
                                style={{ width: '134px' }}
                                options={OpenAttributeOption}
                                getPopupContainer={(element) =>
                                    parentNode || element.parentNode
                                }
                            />
                        </Form.Item>
                    </div>
                </div>
            ) : (
                // (
                // <div className={styles.titleContent}>
                //     <div className={styles.itemContent}>
                //         <span>{__('开放属性')}</span>
                //     </div>
                //     <div className={styles.itemContent}>
                //         <Form.Item name={['open_attribute', 'value']} noStyle>
                //             <Select
                //                 placeholder={__('请选择')}
                //                 style={{ width: '134px' }}
                //                 options={OpenAttributeOption}
                //                 getPopupContainer={(element) =>
                //                     parentNode || element.parentNode
                //                 }
                //             />
                //         </Form.Item>
                //     </div>
                //     <div className={styles.itemContent}>
                //         <Form.Item name={['open_attribute', 'status']} noStyle>
                //             <FieldsStatusTip />
                //         </Form.Item>
                //     </div>
                // </div>
                // )
                <span>{__('开放属性')}</span>
            ),
            key: 'open_attribute',
            width: 338,
            render: (_, record, index) => (
                <Space size={8}>
                    <FormItemContainer
                        name={['fields', index, 'open_attribute']}
                        validateTrigger={['onChange', 'onBlur']}
                        rules={[
                            {
                                required: true,
                                message: __('请选择开放属性'),
                            },
                        ]}
                    >
                        <Select
                            placeholder={__('请选择')}
                            style={{ width: '134px' }}
                            options={OpenAttributeOption}
                            getPopupContainer={(element) =>
                                parentNode || element.parentNode
                            }
                        />
                    </FormItemContainer>
                    <Form.Item
                        shouldUpdate={(prevValues, curValues) =>
                            prevValues?.fields[index]?.open_attribute !==
                            curValues?.fields[index]?.open_attribute
                        }
                        noStyle
                    >
                        {({ getFieldValue }) => {
                            const openType = getFieldValue([
                                'fields',
                                index,
                                'open_attribute',
                            ])
                            return openType === OpenAttribute.Open ? (
                                <FormItemContainer
                                    name={['fields', index, 'open_condition']}
                                >
                                    <Input
                                        maxLength={128}
                                        style={{ width: '160px' }}
                                        placeholder={__('开放条件(选填)')}
                                    />
                                </FormItemContainer>
                            ) : (
                                <HoldingComponent
                                    style={{ width: '160px' }}
                                    text={__('无需配置此选项')}
                                />
                            )
                        }}
                    </Form.Item>
                </Space>
            ),
        },
        {
            title: __('操作'),
            fixed: 'right',
            width: 120,
            key: 'action',
            render: (_: string, record, index) => (
                <OptionBarTool
                    menus={[
                        {
                            key: OptionType.Unbind,
                            label: __('解绑'),
                            menuType: OptionMenuType.Menu,
                        },
                        {
                            key: OptionType.DELETE,
                            label: __('删除'),
                            menuType: OptionMenuType.Menu,
                        },
                    ].filter(
                        (currentMenu) =>
                            !(currentMenu.key === OptionType.Unbind),
                    )}
                    onClick={(key, e) => {
                        onOptionData(key, index)
                    }}
                />
            ),
        },
    ]
}

export const scollerToErrorElement = (id) => {
    document.getElementById(id)?.scrollIntoView({ inline: 'center' })
}
