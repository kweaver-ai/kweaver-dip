import { CloseOutlined, InfoCircleFilled } from '@ant-design/icons'
import { useDebounce, useGetState } from 'ahooks'
import {
    AutoComplete,
    Button,
    Cascader,
    Drawer,
    Form,
    Input,
    InputNumber,
    message,
    Modal,
    Radio,
    Select,
    Space,
    Spin,
    Table,
    Tooltip,
} from 'antd'
import { ColumnsType } from 'antd/lib/table'
import classnames from 'classnames'
import { noop, trim } from 'lodash'
import * as React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
    DataGradeLabelType,
    formatError,
    formsEnumConfig,
    getCodeTableDetail,
    getCodeTableList,
    getDataEleDetailById,
    getStandardRecommend,
    IGradeLabel,
    IRuleRecParams,
    IStdRecParams,
    standardDataReplace,
} from '@/core'
import { CodeTableEnums } from '@/core/apis/externalPluginFramework/index.d'
import { FontIcon, StandardOutlined } from '@/icons'
import Empty from '@/ui/Empty'
import NumberInput from '@/ui/NumberInput'
import { NumberType } from '@/ui/NumberInput/const'
import {
    entendNameEnReg,
    ErrorInfo,
    getSource,
    keyboardReg,
    numberReg,
} from '@/utils'
import { confirm } from '@/utils/modalHelper'
import { keyboardInputValidator } from '@/utils/validate'
import dataEmpty from '../../assets/dataEmpty.svg'
import { GroupView } from '../AutoFormView/baseViewComponents'
import CodeRuleDetails from '../CodeRulesComponent/CodeRuleDetails'
import CodeTableDetails from '../CodeTableManage/Details'
import DataEleDetails from '../DataEleManage/Details'
import { dataKindOptions, FormTableKind, NewFormType } from '../Forms/const'
import {
    exChangeRangeDataToObj,
    StandardDataDetail,
    ValueRangeType,
} from '../FormTableMode/const'
import { transformDataOptions } from '../FormTableMode/helper'
import SelectValueRange from '../FormTableMode/SelectValueRange'
import { TipsLabel } from '../ResourcesDir/BaseInfo'
import { FieldEditInfoKeys } from './const'
import {
    checkNormalInput,
    checkNumberRanage,
    checkRepeatName,
    findNodeById,
    OpenAttribute,
    OpenAttributeOption,
    OperateType,
    recommendParamTemplate,
    SecurityClassificationOption,
    SharedAttribute,
    SharedAttributeOption,
    StandardKeys,
} from './helper'
import __ from './locale'
import styles from './styles.module.less'

interface FieldConfigType {
    data: any
    node: any
    onClose: () => void
    onUpdateGraph: (isDisabledSave?: boolean) => void
    model: string
    taskId: string
    formType?: NewFormType
    getDSFormNode?: () => any
    validateEnName?: boolean
    updateErrorFields?: (id) => void
    isStart?: boolean
    tagData?: IGradeLabel[]
    dataKind?: FormTableKind
    departmentId?: string
}

interface SelectTableCodeType {
    onChange?: (value) => void
    value?: string
    options: Array<any>
    onSearch: (value) => void
    onPopupScroll: (event) => void
    onViewCodeTable: () => void
    notFoundContent?: string | React.ReactNode
}
const SelectTableCode = ({
    onChange,
    value,
    options,
    onSearch,
    onPopupScroll,
    onViewCodeTable,
    notFoundContent = __('暂无数据'),
}: SelectTableCodeType) => {
    return (
        <div className={styles.codeTableSelect}>
            <Select
                onChange={onChange}
                value={value}
                options={options}
                filterOption={false}
                placeholder={__('请选择码表')}
                showSearch
                allowClear
                onSearch={onSearch}
                getPopupContainer={(d) => d.parentNode}
                onPopupScroll={onPopupScroll}
                style={{
                    width: 'calc(100% - 52px)',
                }}
                notFoundContent={notFoundContent}
            />
            <div className={styles.codeTableBtn}>
                <Button type="link" disabled={!value} onClick={onViewCodeTable}>
                    {__('查看')}
                </Button>
            </div>
        </div>
    )
}

const FieldConfig = ({
    data,
    node,
    onClose,
    onUpdateGraph,
    model,
    taskId,
    formType = NewFormType.BLANK,
    getDSFormNode,
    validateEnName = false,
    updateErrorFields = noop,
    isStart = false,
    tagData = [],
    dataKind = FormTableKind.BUSINESS,
    departmentId,
}: FieldConfigType) => {
    const [currentData, setCurrentData] = useState<any>(data)
    const [form] = Form.useForm()
    const [dataTypeOptions, setDataTypeOptions] = useState<Array<any>>([])
    const [formulateBasisOptions, setFormulateBasisOptions] = useState<
        Array<any>
    >([])
    const [formDataType, setFormDataType] = useState<string>('')
    const [fieldName, setFieldName] = useState('')
    const nameDebounce = useDebounce(fieldName, { wait: 500 })
    const [recommendFieldData, setRecommendFieldData] = useState<Array<any>>([])
    const [loading, setLoading] = useState<boolean>(false)
    const [standardStatus, setStandardStatus] = useState<string>('')
    const [tableCodeItems, setTableCodeItem] = useState<Array<any>>([])
    const [selectedName, setSelectedName, getSelectedName] =
        useGetState<string>('')
    const [viewCodeTables, setViewCodeTables] =
        useState<Array<CodeTableEnums> | null>(null)
    const [viewCodeStatus, setViewCodeStatus] = useState<boolean>(false)
    const [viewCodeLoading, setViewCodeLoading] = useState<boolean>(false)
    const [keyword, setKeyword] = useState<string>('')
    const [tableCodeLoading, setTableCodeLoading] = useState<boolean>(true)
    const [totalCount, setTotalCount] = useState<number>(0)
    const baseModelRef = useRef<any>()
    const businessModelRef = useRef<any>()
    const technologyModelRef = useRef<any>()
    const classificationModelRef = useRef<any>()
    const shareInfoModelRef = useRef<any>()

    // 基础信息分类
    const [dataKindOptionsList, setDataKindOptionsList] =
        useState<any[]>(dataKindOptions)
    const [showSharedCondition, setShowSharedCondition] =
        useState<boolean>(true)
    const [showSharedConditionIpt, setShowSharedConditionIpt] =
        useState<boolean>(false)
    const [showOpenType, setShowOpenType] = useState<boolean>(false)

    // 点击的是确定 还是 确定并编辑下一个
    const [operateType, setOperateType, getOperateType] =
        useGetState<OperateType>(OperateType.OK)

    // 是否需要标准化
    const [isStandardizationRequired, setIsStandardizationRequired] =
        useState(0)

    const [tagOptions, setTagOptions] = useState<any>([])

    const [stdRecParams, setStdRecParams] = useState<IStdRecParams>()
    const [ruleRecParams, setRuleRecParams] = useState<IRuleRecParams>()

    // 属性不完整的字段数量
    const incompleteFieldsCount = useMemo(() => {
        return node.data.items.filter((item) => !item.name).length
    }, [currentData])

    // 是否存在主键字段
    const existPrimaryKeyField = useMemo(() => {
        return node.data.items.find(
            (item) =>
                item.is_primary_key && item.uniqueId !== currentData.uniqueId,
        )
    }, [currentData])

    // 编码规则/码表集合
    const standardRuleDetail: StandardDataDetail = new StandardDataDetail(
        [],
        [],
    )

    const [codeTableVisible, setCodeTableVisible] = useState<boolean>(false)
    const [codeRuleVisible, setCodeRuleVisible] = useState<boolean>(false)

    // 数据元详情
    const [dataEleDetailVisible, setDataEleDetailVisible] =
        useState<boolean>(false)
    // 详情id
    const [detailId, setDetailId] = useState<string>('')

    const containerBody: any = useRef()

    const columns: ColumnsType<any> = [
        {
            title: __('码值'),
            key: 'code',
            width: '30%',
            render: (_, record) => (
                <div className={styles.nameTypeStyle} title={record.code}>
                    {record.code || '--'}
                </div>
            ),
        },
        {
            title: __('码值描述'),
            key: 'value',
            width: '30%',
            render: (_, record) => (
                <div className={styles.nameTypeStyle} title={record.value}>
                    {record.value || '--'}
                </div>
            ),
        },
        {
            title: __('说明'),
            key: 'description',
            width: '40%',
            render: (_, record) => (
                <div
                    className={styles.nameTypeStyle}
                    title={record.description}
                >
                    {record.description || '--'}
                </div>
            ),
        },
    ]

    const generateTagItem = (dataArr: any[]) => {
        return dataArr.map((item) => {
            if (item.node_type === DataGradeLabelType.Node) {
                return {
                    ...item,
                    label: (
                        <>
                            <FontIcon
                                name="icon-biaoqianicon"
                                style={{ color: item.icon, marginRight: 4 }}
                            />
                            <span title={item.name}>{item.name}</span>
                        </>
                    ),
                    value: item.id,
                }
            }
            if (item.node_type === DataGradeLabelType.Group) {
                return {
                    ...item,
                    label: item.name,
                    value: item.id,
                    children:
                        item.children?.length > 0
                            ? generateTagItem(item.children)
                            : [
                                  {
                                      label: <div>暂无数据</div>,
                                      value: '',
                                      disabled: true,
                                  },
                              ],
                }
            }

            return item
        })
    }

    useEffect(() => {
        setTagOptions(generateTagItem([...tagData]))
    }, [tagData])

    useEffect(() => {
        setCurrentData(data)
        getSelectOption()
    }, [])

    const groups = {
        baseModel: ['name', 'name_en'],
        businessModel: ['is_current_business_generation', 'formulate_basis'],
        technologyModel: [
            'data_type',
            'data_length',
            'data_accuracy',
            'unit',
            'is_primary_key',
            'is_incremental_field',
            'is_required',
            'is_standardization_required',
            'code_table',
            'value_range',
            'encoding_rule',
            'field_relationship',
        ],
        classificationModel: ['sensitive_attribute', 'confidential_attribute'],
        shareInfoModel: [
            'shared_attribute',
            'shared_condition',
            // 'shared_mode',
            'open_attribute',
            'open_condition',
        ],
    }

    const cancelRequestRecommendFieldData = () => {
        const sor = getSource()
        if (sor.length > 0) {
            sor.forEach((info) => {
                if (info.config?.url?.includes('/dataelement/std-rec')) {
                    info.source.cancel()
                }
            })
        }
        setRecommendFieldData([])
    }

    useEffect(() => {
        cancelRequestRecommendFieldData()
        setFormDataType(data.data_type)
        setCurrentData({
            ...data,
            formulate_basis: data.formulate_basis || undefined,
        })
        sharedTypeChange(data.shared_attribute)
        setShowOpenType(data.open_attribute === 'open')
        setShowSharedCondition(data.shared_attribute !== 'not_share')
        form.setFieldsValue({
            ...data,
            data_type:
                data.data_type === 'number' ? __('数字型') : data.data_type,
            standard_id: `${data.standard_id}>><<`,
            formulate_basis: data.formulate_basis || undefined,
        })
        setStandardStatus(data?.standard_status)

        // getTableCodeOptions([], '')
        setIsStandardizationRequired(data.is_standardization_required)
        setStdRecParams({
            table_name: node?.data?.formInfo.name || '',
            table_fields: [
                {
                    table_field: data.name,
                },
            ],
        })
        setRuleRecParams({
            table_name: node?.data?.formInfo.name || '',
            fields: [
                {
                    field_name: data.name,
                },
            ],
        })
    }, [data])

    useEffect(() => {
        const labelInfo = findNodeById(tagData, currentData.label_id)
        const dataTypeInfo = {
            data_type:
                currentData.data_type === 'number'
                    ? __('数字型')
                    : currentData.data_type,
        }
        form.setFieldsValue(
            currentData.code_table_code
                ? {
                      ...currentData,
                      ...dataTypeInfo,
                      label_id: labelInfo ? labelInfo.path : [],
                      standard_id: `${currentData.standard_id}>><<`,
                  }
                : {
                      ...currentData,
                      ...dataTypeInfo,
                      code_table_code: null,
                      label_id: labelInfo ? labelInfo.path : [],
                      standard_id: `${currentData.standard_id}>><<`,
                  },
        )
        setFormDataType(currentData.data_type)
        sharedTypeChange(currentData.shared_attribute)
        setShowOpenType(currentData.open_attribute === 'open')
        setShowSharedCondition(currentData.shared_attribute !== 'not_share')
        setIsStandardizationRequired(currentData.is_standardization_required)

        setTimeout(() => {
            if (!validateEnName) return
            if (currentData.name_en && !(!!data.ref_id || model === 'view')) {
                if (!entendNameEnReg.test(currentData.name_en)) {
                    form.setFields([
                        {
                            name: 'name_en',
                            value: currentData.name_en,
                            errors: [
                                __(
                                    '仅支持英文、数字、下划线及中划线，且不能以下划线和中划线开头',
                                ),
                            ],
                        },
                    ])
                }
            }
        }, 400)
    }, [currentData])

    useEffect(() => {
        getRecommendFileds(nameDebounce)
        if (nameDebounce) {
            setStdRecParams({
                table_name: node?.data?.formInfo.name || '',
                table_fields: [
                    {
                        table_field: nameDebounce,
                    },
                ],
            })
            setRuleRecParams({
                table_name: node?.data?.formInfo.name || '',
                fields: [
                    {
                        field_name: nameDebounce,
                    },
                ],
            })
        }
    }, [nameDebounce])

    /**
     * 获取下拉框的内容
     */
    const getSelectOption = async () => {
        try {
            // const selectData = await queryStandardEnum()
            // 枚举值变更，数据类型改用其他枚举接口
            const enumConfig = await formsEnumConfig()
            setDataTypeOptions(
                enumConfig?.data_type.filter(
                    (item) => item.value_en !== 'number',
                ),
            )
            setFormulateBasisOptions(enumConfig?.formulate_basis)
        } catch (ex) {
            formatError(ex)
        }
    }

    /**
     * 字段属性变更
     * @param field 变更的字段属性
     * @param allFileds 所有字段属性
     */
    const handleOnChange = (field, allFileds) => {
        const fieldKey = Object.keys(field)
        if (fieldKey) {
            if (fieldKey[0] === 'data_type') {
                if (field.data_type !== formDataType) {
                    setFormDataType(field.data_type)
                    form.setFieldValue('data_length', null)
                    form.setFieldValue('data_accuracy', null)
                }
            }
            if (fieldKey[0] === 'name') {
                setFieldName(field.name)
            }
            if (StandardKeys.includes(fieldKey[0])) {
                if (
                    !(
                        fieldKey[0] === 'name' &&
                        field.name === getSelectedName()
                    )
                ) {
                    setStandardStatus('')
                }
            }
            if (fieldKey[0] === 'code_table_code') {
                const tableInfo = tableCodeItems.find(
                    (tableCodeData) =>
                        tableCodeData.value === field.code_table_code,
                )
                setCurrentData({
                    ...currentData,
                    ...allFileds,
                    code_table_code: field.code_table_code,
                    code_table: tableInfo?.label || '',
                })
            }
            if (fieldKey[0] === 'is_standardization_required') {
                setIsStandardizationRequired(field.is_standardization_required)
            }
        }
    }

    const getRecommendFileds = async (name) => {
        if (name) {
            const recommendData = await getStandardRecommend({
                ...recommendParamTemplate,
                department_id: departmentId,
                task_no: taskId || '',
                table: node?.data?.formInfo.name || '',
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
    }

    /**
     * 分页获取码表列表
     * @param initTableList
     * @param searchKey
     */
    const getTableCodeOptions = async (initTableList, searchKey) => {
        const currentCodeTable = form.getFieldValue('code_table_code')
        const currentCodeTableName = data.code_table
        setTableCodeLoading(true)
        const { entries, total_count } = await getCodeTableList({
            offset: initTableList.length
                ? Math.floor(initTableList.length / 20) + 1
                : 1,
            limit: 20,
            keyword: searchKey,
        })
        setTotalCount(total_count)
        setTableCodeLoading(false)
        if (initTableList.length) {
            if (
                currentCodeTable &&
                entries.find(
                    (codeTableInfo) =>
                        codeTableInfo.code_table_code === currentCodeTable,
                )
            ) {
                setTableCodeItem([
                    ...initTableList.filter(
                        (codeTableInfo) =>
                            codeTableInfo.value !== currentCodeTable,
                    ),
                    ...entries.map((codeTableInfo) => ({
                        label: codeTableInfo.name,
                        value: codeTableInfo.code_table_code,
                        data: codeTableInfo,
                    })),
                ])
            } else {
                setTableCodeItem([
                    ...initTableList,
                    ...entries.map((codeTableInfo) => ({
                        label: codeTableInfo.name,
                        value: codeTableInfo.code_table_code,
                        data: codeTableInfo,
                    })),
                ])
            }
        } else if (
            entries.find(
                (codeTableInfo) =>
                    codeTableInfo.code_table_code === currentCodeTable,
            )
        ) {
            setTableCodeItem(
                entries.map((codeTableInfo) => ({
                    label: codeTableInfo.name,
                    value: codeTableInfo.code_table_code,
                    data: codeTableInfo,
                })),
            )
        } else {
            setTableCodeItem(
                currentCodeTableName
                    ? [
                          {
                              label: currentCodeTableName,
                              value: currentCodeTable,
                          },
                          ...entries.map((codeTableInfo) => ({
                              label: codeTableInfo.name,
                              value: codeTableInfo.code_table_code,
                              data: codeTableInfo,
                          })),
                      ]
                    : entries.map((codeTableInfo) => ({
                          label: codeTableInfo.name,
                          value: codeTableInfo.code_table_code,
                          data: codeTableInfo,
                      })),
            )
        }
    }
    /**
     * 滚动加载
     * @param e
     */
    const getTableCodeByScroll = (e) => {
        const { target } = e
        if (
            target.scrollTop + target.offsetHeight === target.scrollHeight &&
            totalCount > tableCodeItems.length
        ) {
            if (keyword) {
                getTableCodeOptions(tableCodeItems, keyword)
            } else {
                getTableCodeOptions(tableCodeItems, '')
            }
        }
    }

    const getDataTypeTemplate = () => {
        switch (formDataType) {
            case 'decimal':
                return (
                    <Form.Item label={__('数据类型')}>
                        <div className={styles.nameSelected}>
                            <span className={styles.required}>*</span>
                            <div className={styles.nameBefore}>
                                {__('数据类型')}
                            </div>
                            <Form.Item
                                name="data_type"
                                validateTrigger={['onChange', 'onBlur']}
                                style={{
                                    flex: 1,
                                    marginBottom: '16px',
                                }}
                                rules={[
                                    {
                                        required:
                                            dataKind === FormTableKind.STANDARD,
                                        message: __('请选择数据类型'),
                                    },
                                ]}
                            >
                                <Select
                                    className={styles.inputStyle}
                                    placeholder={__('请选择数据类型')}
                                    showArrow={false}
                                    getPopupContainer={(element) =>
                                        element.parentNode
                                    }
                                    options={dataTypeOptions.map(
                                        (dataTypeOption) => ({
                                            label: dataTypeOption.value,
                                            value: dataTypeOption.value_en,
                                        }),
                                    )}
                                />
                            </Form.Item>
                        </div>
                        <div className={styles.nameSelected}>
                            <span className={styles.required}>*</span>
                            <div className={styles.nameBefore}>
                                {__('数据长度')}
                            </div>
                            <Form.Item
                                name="data_length"
                                validateTrigger={['onChange', 'onBlur']}
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
                                style={{
                                    flex: 1,
                                    marginBottom: '16px',
                                }}
                            >
                                <NumberInput
                                    className={styles.inputStyle}
                                    placeholder={__('请输入1～38之间的整数')}
                                    min={1}
                                    max={38}
                                    type={NumberType.Natural}
                                    onChange={() =>
                                        form.validateFields(['data_accuracy'])
                                    }
                                />
                            </Form.Item>
                        </div>
                        <div
                            className={styles.nameSelected}
                            style={{
                                marginBottom: '-24px',
                                flex: 1,
                            }}
                        >
                            <span className={styles.required}>*</span>
                            <div className={styles.nameBefore}>
                                {__('数据精度')}
                            </div>
                            <Form.Item
                                noStyle
                                shouldUpdate={(prev, current) =>
                                    prev.data_length !== current.data_length
                                }
                            >
                                {({ getFieldValue }) => {
                                    return (
                                        <Form.Item
                                            name="data_accuracy"
                                            validateFirst
                                            validateTrigger={[
                                                'onChange',
                                                'onBlur',
                                            ]}
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        __('请输入数据精度'),
                                                },
                                                {
                                                    validateTrigger: ['onBlur'],
                                                    validator: (e, value) =>
                                                        checkNumberRanage(
                                                            e,
                                                            value,
                                                            {
                                                                max: getFieldValue(
                                                                    'data_length',
                                                                ),
                                                                min: 0,
                                                            },
                                                            __(
                                                                '数据精度不能大于数据长度',
                                                            ),
                                                        ),
                                                },
                                            ]}
                                            style={{
                                                width: '100%',
                                            }}
                                        >
                                            <NumberInput
                                                className={styles.inputStyle}
                                                placeholder={__(
                                                    '请输入0～x之间的整数，x=上方设置的数据长度值',
                                                )}
                                                max={getFieldValue(
                                                    'data_length',
                                                )}
                                                min={0}
                                                type={NumberType.Natural}
                                            />
                                        </Form.Item>
                                    )
                                }}
                            </Form.Item>
                        </div>
                    </Form.Item>
                )
            case 'binary':
            case 'char':
                return (
                    <Form.Item label={__('数据类型')}>
                        <div className={styles.nameSelected}>
                            <div className={styles.nameBefore}>
                                {__('数据类型')}
                            </div>
                            <Form.Item
                                name="data_type"
                                validateTrigger={['onChange', 'onBlur']}
                                style={{
                                    flex: 1,
                                    marginBottom: '16px',
                                }}
                                rules={[
                                    {
                                        required:
                                            dataKind === FormTableKind.STANDARD,
                                        message: __('请选择数据类型'),
                                    },
                                ]}
                            >
                                <Select
                                    className={styles.inputStyle}
                                    placeholder={__('请选择数据类型')}
                                    showArrow={false}
                                    getPopupContainer={(element) =>
                                        element.parentNode
                                    }
                                    options={dataTypeOptions.map(
                                        (dataTypeOption) => ({
                                            label: dataTypeOption.value,
                                            value: dataTypeOption.value_en,
                                        }),
                                    )}
                                />
                            </Form.Item>
                        </div>
                        <div
                            className={styles.nameSelected}
                            style={{
                                marginBottom: '-24px',
                            }}
                        >
                            <div className={styles.nameBefore}>
                                {__('数据长度')}
                            </div>
                            <Form.Item
                                name="data_length"
                                validateTrigger={['onChange', 'onBlur']}
                                rules={[
                                    {
                                        validateTrigger: ['onBlur'],
                                        pattern: numberReg,
                                        message: __('请输入1～65535之间的整数'),
                                    },
                                ]}
                                style={{
                                    flex: 1,
                                }}
                            >
                                <InputNumber
                                    style={{ width: '100%' }}
                                    placeholder={__('请输入1～65535之间的整数')}
                                    min={1}
                                    max={65535}
                                />
                            </Form.Item>
                        </div>
                    </Form.Item>
                )
            default:
                return (
                    <Form.Item
                        label={__('数据类型')}
                        name="data_type"
                        validateTrigger={['onChange', 'onBlur']}
                        style={{
                            flex: 1,
                        }}
                        rules={[
                            {
                                required: dataKind === FormTableKind.STANDARD,
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
                    >
                        <Select
                            placeholder={__('请选择数据类型')}
                            showArrow={false}
                            options={dataTypeOptions.map((dataTypeOption) => ({
                                label: dataTypeOption.value,
                                value: dataTypeOption.value_en,
                            }))}
                            getPopupContainer={(element) => element.parentNode}
                        />
                    </Form.Item>
                )
        }
    }

    // 切换主键时判断是否已有字段设置为主键，有则提示
    const handlePrimaryKeyChange = (e) => {
        if (existPrimaryKeyField && e.target.value) {
            confirm({
                title: __('确认要替换吗？'),
                icon: (
                    <InfoCircleFilled
                        style={{ color: 'rgba(250, 173, 20, 1)' }}
                    />
                ),
                content: __('字段「${name1}」已被设置为主键，是否替换？', {
                    name1: existPrimaryKeyField.name,
                }),
                onOk: () => {
                    form.setFieldsValue({ is_primary_key: 1, is_required: 1 })
                },
                onCancel: () => {
                    form.setFieldsValue({ is_primary_key: 0 })
                },

                okText: __('确定'),
                cancelText: __('取消'),
            })
        } else if (!existPrimaryKeyField && e.target.value) {
            form.setFieldsValue({ is_required: 1 })
        }
    }

    const onFinish = (formData) => {
        let values = formData
        if (Array.isArray(values.label_id) && values.label_id.length > 0) {
            values = {
                ...values,
                label_id: values.label_id[values.label_id.length - 1],
            }
        } else {
            values = {
                ...values,
                label_id: '',
            }
        }
        if (values.is_primary_key) {
            // 取消其他字段的主键
            node.replaceData({
                ...node.data,
                items: node.data.items.map((item) => {
                    if (
                        item.uniqueId !== currentData.uniqueId &&
                        item.is_primary_key
                    ) {
                        return { ...item, is_primary_key: 0 }
                    }
                    return item
                }),
            })
        }

        if (formType === NewFormType.BLANK) {
            setLoading(true)
        }
        const saveValues = {
            ...currentData,
            ...values,
            data_type:
                values.data_type === __('数字型') ? 'number' : values.data_type,
            standard_status: standardStatus,
            standard_id: values.standard_id
                ? exChangeRangeDataToObj(values.standard_id).id
                : '',
            data_length:
                values.data_length === null || values.data_length === ''
                    ? null
                    : Number(values.data_length),
            data_accuracy:
                values.data_accuracy === null || values.data_accuracy === ''
                    ? null
                    : Number(values.data_accuracy),
            uniqueId: currentData.uniqueId,
        }

        // 数据源导入时
        if (formType === NewFormType.DSIMPORT) {
            const { formInfo } = node.data
            if (
                (formInfo.shared_attribute === SharedAttribute.NotShare &&
                    [
                        SharedAttribute.ConditionalShare,
                        SharedAttribute.UnconditionalShare,
                    ].includes(values.shared_attribute)) ||
                (formInfo.shared_attribute ===
                    SharedAttribute.ConditionalShare &&
                    [SharedAttribute.UnconditionalShare].includes(
                        values.shared_attribute,
                    ))
            ) {
                message.error(__('共享属性不得高于业务表共享属性'))
                return
            }

            if (
                formInfo.open_attribute === OpenAttribute.NotOpen &&
                values.open_attribute === OpenAttribute.Open
            ) {
                message.error(__('开放属性不得高于业务表开放属性'))
                return
            }

            if (values) {
                updateErrorFields(currentData.id)
                node.replaceData({
                    ...node.data,
                    items: node.data.items.map((item) => {
                        if (item.id === currentData.id) {
                            return saveValues
                        }
                        return item
                    }),
                })
            }

            message.success(__('编辑成功'))
            if (getOperateType() === OperateType.OKAndNext) {
                // 设置编辑下一个不完整的字段, 更新画布选中项与翻页
                const nextIndex = node.data.items.findIndex(
                    (item) => !item.name,
                )

                if (nextIndex > -1) {
                    const offset = Math.floor(nextIndex / 10)
                    node.replaceData({
                        ...node.data,
                        offset,
                        singleSelectedId: node.data.items[nextIndex].id,
                    })
                    getDSFormNode?.()?.replaceData({
                        ...getDSFormNode?.()?.data,
                        offset,
                        singleSelectedId: node.data.items[nextIndex].id,
                    })
                    setCurrentData(node.data.items[nextIndex])
                }
            } else {
                onClose()
            }
            onUpdateGraph()
            return
        }

        // 空白业务表时
        const isExistNode = !!node.data.items.find(
            (item) => item.uniqueId === currentData.uniqueId,
        )

        if (isExistNode) {
            updateErrorFields(currentData.uniqueId)
            node.replaceData({
                ...node.data,
                items: node.data.items.map((item) => {
                    if (item.uniqueId === currentData.uniqueId) {
                        const { index, ...others } = saveValues
                        return others
                    }
                    return item
                }),
            })
            message.success(__('编辑成功'))
        } else {
            node.replaceData({
                ...node.data,
                items: [...node.data.items, saveValues],
            })
            message.success(__('新建成功'))
        }
        onClose()
        setLoading(false)
        onUpdateGraph(!isExistNode && formType === NewFormType.BLANK)
    }

    const handleExpandFailedGroup = (name) => {
        switch (true) {
            case groups.baseModel.includes(name):
                baseModelRef?.current?.onExpand()
                break
            case groups.businessModel.includes(name):
                businessModelRef?.current?.onExpand()
                break
            case groups.technologyModel.includes(name):
                technologyModelRef?.current?.onExpand()
                break
            case groups.classificationModel.includes(name):
                classificationModelRef?.current?.onExpand()
                break
            case groups.shareInfoModel.includes(name):
                shareInfoModelRef?.current?.onExpand()
                break
            default:
                break
        }
    }

    const handleViewCodeTable = async () => {
        const currentCodeTable = form.getFieldValue('code_table_code')
        if (currentCodeTable) {
            try {
                setViewCodeStatus(true)
                setViewCodeLoading(true)
                const { enums } = await getCodeTableDetail(currentCodeTable)
                setViewCodeTables(enums || [])
                setViewCodeLoading(false)
            } catch (ex) {
                setViewCodeLoading(false)
                formatError(ex)
            }
        }
    }
    // 共享属性 切换
    const sharedTypeChange = (value) => {
        if (value) {
            setShowSharedCondition(value !== 'not_share')
            setShowSharedConditionIpt(value !== 'share_no_conditions')
            if (value === 'not_share') {
                form.setFieldValue('open_attribute', 'not_open')
                openTypeChange('not_open')
            }
        }
    }
    // 开放属性 切换
    const openTypeChange = (value) => {
        setShowOpenType(value === 'open')
    }

    const operateBtn = (
        <Space size={12}>
            <Button className={styles.cancelBtn} onClick={onClose}>
                {__('取消')}
            </Button>
            <Button
                className={styles.okBtn}
                type="primary"
                htmlType="submit"
                loading={loading}
                onClick={() => {
                    if (formType === NewFormType.DSIMPORT) {
                        setOperateType(OperateType.OK)
                    }
                    form.submit()
                }}
            >
                {__('确定')}
            </Button>
        </Space>
    )

    const displayRender = (label, selectedOptions) => {
        if (
            Array.isArray(selectedOptions) &&
            selectedOptions.length > 0 &&
            selectedOptions[0]
        ) {
            const displayTextArr = selectedOptions
                ?.map((item) => item?.name)
                .join('/')
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
                    <span title={tagInfo?.name}>{displayTextArr}</span>
                </span>
            )
        }
        return null
    }
    /**
     * 获取数据元详情
     * @param id 数据元id
     */
    const getDataEleDetail = async (id) => {
        try {
            const dataEleId = id ? exChangeRangeDataToObj(id).id : ''
            if (dataEleId) {
                const res = await getDataEleDetailById({
                    type: 2,
                    value: dataEleId,
                })
                const {
                    data_type,
                    standard_status,
                    value_range,
                    value_range_type,
                    data_length,
                    data_accuracy,
                    name_en,
                } = standardDataReplace(res.data)
                setFormDataType(data_type)
                form.setFields([
                    {
                        name: ['name_en'],
                        errors: [],
                        value: name_en,
                    },
                    {
                        name: ['data_type'],
                        errors: [],
                        value: data_type,
                    },
                    {
                        name: ['value_range_type'],
                        errors: [],
                        value: value_range_type,
                    },
                    {
                        name: ['value_range'],
                        errors: [],
                        value: value_range,
                    },
                    {
                        name: ['data_length'],
                        errors: [],
                        value: data_length,
                    },
                    {
                        name: ['data_accuracy'],
                        errors: [],
                        value: data_accuracy,
                    },
                ])
                setStandardStatus(standard_status)
            }
        } catch (err) {
            formatError(err)
        }
    }

    const formItemTemplate = {
        // name: (
        //     <Form.Item
        //         label={__('名称')}
        //         required={
        //             !(
        //                 (!!data.ref_id &&
        //                     dataKind === FormDataTypes.BUSINESS) ||
        //                 model === 'view'
        //             )
        //         }
        //         style={{
        //             marginBottom: 0,
        //         }}
        //     >
        //         <div className={styles.nameSelected}>
        //             <div className={styles.nameBefore}>{__('中文名称')}</div>
        //             <Form.Item
        //                 name="name"
        //                 validateFirst
        //                 validateTrigger={['onChange', 'onBlur']}
        //                 rules={
        //                     (!!data.ref_id &&
        //                         dataKind === FormDataTypes.BUSINESS) ||
        //                     model === 'view'
        //                         ? []
        //                         : [
        //                               {
        //                                   required: true,
        //                                   transform: (val) => trim(val),
        //                                   message: __('输入不能为空'),
        //                               },
        //                               {
        //                                   pattern: keyboardReg,
        //                                   message: ErrorInfo.EXCEPTEMOJI,
        //                                   transform: (value) => trim(value),
        //                               },
        //                               {
        //                                   validateTrigger: ['onBlur'],
        //                                   validator: (e, value) =>
        //                                       checkRepeatName(
        //                                           value,
        //                                           currentData,
        //                                           node.data.items,
        //                                       ),
        //                               },
        //                           ]
        //                 }
        //                 style={{
        //                     flex: 1,
        //                     marginBottom: '16px',
        //                 }}
        //             >
        //                 <AutoComplete
        //                     style={{
        //                         borderRadius: '4px 0 0 4px',
        //                         width: '100%',
        //                     }}
        //                     placeholder={__('请输入中文名称')}
        //                     notFoundContent={null}
        //                     getPopupContainer={(element) => element.parentNode}
        //                     options={recommendFieldData.map(
        //                         (recommendField) => ({
        //                             label: (
        //                                 <div className={styles.optionsItems}>
        //                                     <div className={styles.optionName}>
        //                                         {recommendField?.name || ''}
        //                                     </div>
        //                                     <div
        //                                         className={
        //                                             styles.optionFormulate
        //                                         }
        //                                     >
        //                                         {formulateBasisOptions.find(
        //                                             (currentFormulate) =>
        //                                                 currentFormulate.value_en ===
        //                                                 recommendField?.std_type_name,
        //                                         )?.value || '--'}
        //                                     </div>
        //                                 </div>
        //                             ),
        //                             value: recommendField?.id,
        //                             data: recommendField,
        //                         }),
        //                     )}
        //                     onSelect={async (value, option) => {
        //                         setFormDataType(option.data.data_type)
        //                         setSelectedName(option?.data?.name || '')
        //                         setStandardStatus('normal')
        //                         const currentValues = form.getFieldsValue()
        //                         const standardValues =
        //                             await transformDataOptions(
        //                                 value,
        //                                 currentValues,
        //                                 option.data,
        //                             )
        //                         form.setFieldsValue(standardValues)
        //                         setCurrentData({
        //                             ...standardValues,
        //                             id: currentData.id,
        //                         })
        //                     }}
        //                     maxLength={255}
        //                     disabled={
        //                         (!!data.ref_id &&
        //                             dataKind === FormDataTypes.BUSINESS) ||
        //                         model === 'view'
        //                     }
        //                 />
        //             </Form.Item>
        //         </div>

        //         <div className={styles.nameSelected}>
        //             <div className={styles.nameBefore}>{__('英文名称')}</div>
        //             <Form.Item
        //                 name="name_en"
        //                 validateFirst
        //                 validateTrigger={['onChange', 'onBlur']}
        //                 rules={
        //                     (!!data.ref_id &&
        //                         dataKind === FormDataTypes.BUSINESS) ||
        //                     model === 'view'
        //                         ? []
        //                         : [
        //                               {
        //                                   required:
        //                                       node.data.formType !==
        //                                       FormDataTypes.BUSINESS,
        //                                   transform: (val) => trim(val),
        //                                   message: __('输入不能为空'),
        //                               },
        //                               {
        //                                   pattern: entendNameEnReg,
        //                                   message: __(
        //                                       '仅支持英文、数字、下划线及中划线，且不能以下划线和中划线开头',
        //                                   ),
        //                                   transform: (value) => trim(value),
        //                               },
        //                           ]
        //                 }
        //                 style={{
        //                     flex: 1,
        //                 }}
        //             >
        //                 <Input
        //                     style={{
        //                         borderRadius: '0 4px 4px 0',
        //                         width: '100%',
        //                     }}
        //                     autoComplete="off"
        //                     placeholder={__('请输入英文名称')}
        //                     maxLength={128}
        //                     disabled={
        //                         (!!data.ref_id &&
        //                             dataKind === FormDataTypes.BUSINESS) ||
        //                         model === 'view'
        //                     }
        //                 />
        //             </Form.Item>
        //         </div>
        //     </Form.Item>
        // ),

        // data_type: getDataTypeTemplate(),

        name: (
            <Form.Item
                name="name"
                validateFirst
                label={__('字段名称')}
                validateTrigger={['onChange', 'onBlur']}
                rules={
                    model === 'view'
                        ? []
                        : [
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
                                          currentData,
                                          node.data.items,
                                      ),
                              },
                          ]
                }
            >
                <AutoComplete
                    placeholder={__('请输入字段名称')}
                    notFoundContent={null}
                    getPopupContainer={(element) => element.parentNode}
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
                    onSelect={async (value, option) => {
                        setFormDataType(option.data.data_type)
                        setSelectedName(option?.data?.name || '')
                        setStandardStatus('normal')
                        const currentValues = form.getFieldsValue()
                        const standardValues = await transformDataOptions(
                            value,
                            {
                                ...currentData,
                                ...currentValues,
                            },
                            option.data,
                        )
                        form.setFieldsValue({
                            ...standardValues,
                            standard_id: `${option.data.id}>><<${option.data.name}`,
                        })
                        setCurrentData({
                            ...standardValues,
                            id: currentData.id,
                        })
                    }}
                    maxLength={255}
                    disabled={model === 'view'}
                />
            </Form.Item>
        ),
        name_en: (
            <Form.Item
                name="name_en"
                label={__('英文名称')}
                validateFirst
                validateTrigger={['onChange', 'onBlur']}
                rules={
                    model === 'view'
                        ? []
                        : [
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
                          ]
                }
            >
                <Input
                    autoComplete="off"
                    placeholder={__('请输入英文名称')}
                    maxLength={128}
                    disabled={model === 'view'}
                />
            </Form.Item>
        ),
        is_primary_key: (
            <Form.Item
                label={__('唯一标识')}
                name="is_primary_key"
                validateTrigger={['onChange', 'onBlur']}
                className={styles.horizontalItem}
            >
                <Radio.Group
                    disabled={model === 'view'}
                    onChange={handlePrimaryKeyChange}
                >
                    <Radio value={1}>{__('是')}</Radio>
                    <Radio value={0}>{__('否')}</Radio>
                </Radio.Group>
            </Form.Item>
        ),
        is_required: (
            <Form.Item
                shouldUpdate={(pre, cur) =>
                    pre.is_primary_key !== cur.is_primary_key
                }
            >
                {({ getFieldValue }) => {
                    return (
                        <Form.Item
                            label={__('必填')}
                            name="is_required"
                            validateTrigger={['onChange', 'onBlur']}
                            className={styles.horizontalItem}
                        >
                            <Radio.Group
                                disabled={
                                    model === 'view' ||
                                    getFieldValue('is_primary_key') === 1
                                }
                            >
                                <Tooltip
                                    title={
                                        getFieldValue('is_primary_key') === 1
                                            ? __('唯一标识字段默认设为必填字段')
                                            : ''
                                    }
                                >
                                    <Radio value={1}>{__('是')}</Radio>
                                </Tooltip>

                                <Radio value={0}>{__('否')}</Radio>
                            </Radio.Group>
                        </Form.Item>
                    )
                }}
            </Form.Item>
        ),
        standard_id: (
            <Form.Item label={__('数据标准')} name="standard_id">
                <SelectValueRange
                    type={ValueRangeType.DataElement}
                    standardRuleDetail={standardRuleDetail}
                    style={{ width: '100%' }}
                    onChange={(value) => {
                        getDataEleDetail(value)
                    }}
                    isViewDetail={false}
                    getContainer={containerBody.current || false}
                    stdRecParams={stdRecParams}
                />
            </Form.Item>
        ),
        value_range: (
            <>
                <Form.Item
                    label={__('取值范围')}
                    name="value_range_type"
                    validateFirst
                    validateTrigger={['onChange', 'onBlur']}
                    className={styles.horizontalItem}
                >
                    <Radio.Group
                        disabled={model === 'view'}
                        onChange={() => {
                            form.setFields([
                                {
                                    name: ['value_range'],
                                    errors: [],
                                    value: null,
                                },
                            ])
                        }}
                    >
                        <Radio value={ValueRangeType.None}>
                            {__('无限制')}
                        </Radio>
                        <Radio value={ValueRangeType.Custom}>
                            {__('自定义')}
                        </Radio>
                        <Radio value={ValueRangeType.CodeTable}>
                            {__('码表')}
                        </Radio>
                        <Radio value={ValueRangeType.CodeRule}>
                            {__('编码规则')}
                        </Radio>
                    </Radio.Group>
                </Form.Item>
                <Form.Item
                    noStyle
                    shouldUpdate={(prevValues, curValues) =>
                        prevValues?.value_range_type !==
                        curValues?.value_range_type
                    }
                >
                    {({ getFieldValue }) => {
                        const valueRangeType = getFieldValue('value_range_type')
                        return (
                            <Form.Item
                                name="value_range"
                                validateFirst
                                validateTrigger={['onChange', 'onBlur']}
                                rules={
                                    !valueRangeType ||
                                    valueRangeType === ValueRangeType.None
                                        ? []
                                        : [
                                              {
                                                  required: true,
                                                  transform: (val) => trim(val),
                                                  message:
                                                      valueRangeType ===
                                                      ValueRangeType.CodeTable
                                                          ? __('请选择码表')
                                                          : valueRangeType ===
                                                            ValueRangeType.Custom
                                                          ? __('请输入取值范围')
                                                          : __(
                                                                '请设置编码规则',
                                                            ),
                                              },
                                              {
                                                  transform: (val) => trim(val),
                                                  validator:
                                                      keyboardInputValidator(),
                                              },
                                          ]
                                }
                                noStyle={valueRangeType === ValueRangeType.None}
                            >
                                {valueRangeType === ValueRangeType.Custom ? (
                                    <Input
                                        style={{ width: '100%' }}
                                        disabled={model === 'view'}
                                        placeholder={__('请输入取值范围')}
                                    />
                                ) : (
                                    <SelectValueRange
                                        type={valueRangeType}
                                        standardRuleDetail={standardRuleDetail}
                                        disabled={model === 'view'}
                                        style={{ width: '100%' }}
                                        onSelectDetails={(id, dataType) => {
                                            if (
                                                dataType ===
                                                ValueRangeType.CodeRule
                                            ) {
                                                setCodeRuleVisible(true)
                                            } else {
                                                setCodeTableVisible(true)
                                            }
                                            setDetailId(id)
                                        }}
                                        isViewDetail={false}
                                        getContainer={
                                            containerBody.current || false
                                        }
                                        ruleRecParams={ruleRecParams}
                                    />
                                )}
                            </Form.Item>
                        )
                    }}
                </Form.Item>
            </>
        ),
        is_standardization_required: (
            <Form.Item
                label={__('是否标准')}
                name="is_standardization_required"
                validateTrigger={['onChange', 'onBlur']}
                className={styles.horizontalItem}
            >
                <Radio.Group disabled={model === 'view'}>
                    <Radio value={1}>{__('是')}</Radio>
                    <Radio value={0}>{__('否')}</Radio>
                </Radio.Group>
            </Form.Item>
        ),
        label_id: (
            <Form.Item label={__('数据分级')} name="label_id">
                <Cascader
                    className={styles.tagCascaderWrapper}
                    options={tagOptions}
                    getPopupContainer={(cn) => cn.parentNode}
                    displayRender={displayRender}
                    placeholder={__('请选择数据分级')}
                    disabled={model === 'view'}
                />
            </Form.Item>
        ),
        confidential_attribute: (
            <Form.Item
                label={__('涉密属性')}
                name="confidential_attribute"
                validateTrigger={['onChange', 'onBlur']}
                className={styles.horizontalItem}
            >
                <Radio.Group disabled={model === 'view'}>
                    {SecurityClassificationOption.map((currentoption) => {
                        return (
                            <Radio value={currentoption.value}>
                                {currentoption.label}
                            </Radio>
                        )
                    })}
                </Radio.Group>
            </Form.Item>
        ),
        shared_attribute: (
            <>
                <Form.Item
                    validateFirst
                    // label={TipsLabel({
                    //     label: __('共享属性'),
                    //     tips: '请输入该目录向其他政务部门共享的情况',
                    // })}
                    label={__('共享属性')}
                    name="shared_attribute"
                    className={styles.horizontalItem}
                >
                    <Radio.Group
                        disabled={model === 'view'}
                        onChange={(value) => {
                            form.setFieldValue('shared_condition', '')
                            sharedTypeChange(value?.target?.value)
                        }}
                    >
                        {SharedAttributeOption.map((item) => (
                            <Radio value={item.value} key={item.value}>
                                {item.label}
                            </Radio>
                        ))}
                    </Radio.Group>
                </Form.Item>
                {showSharedConditionIpt && (
                    <Form.Item
                        label={TipsLabel({
                            label: showSharedCondition
                                ? __('共享条件')
                                : __('不予共享依据'),
                            // tips: '请输入该目录向其他政务部门共享的情况',
                        })}
                        name="shared_condition"
                        validateFirst
                    >
                        <Input
                            disabled={model === 'view'}
                            maxLength={128}
                            placeholder={`${
                                showSharedCondition
                                    ? __('共享条件(必填)')
                                    : __('不予共享依据（必填）')
                            }`}
                        />
                    </Form.Item>
                )}
            </>
        ),
        open_attribute: (
            <>
                <Form.Item
                    label={TipsLabel({
                        label: __('开放属性'),
                        // tips: '该资源是否对社会公众开放',
                    })}
                    name="open_attribute"
                    validateFirst
                    className={styles.horizontalItem}
                >
                    <Radio.Group
                        disabled={!showSharedCondition || model === 'view'}
                        onChange={(value) =>
                            openTypeChange(value?.target?.value)
                        }
                    >
                        {OpenAttributeOption.map((item) => (
                            <Radio value={item.value} key={item.value}>
                                {item.label}
                            </Radio>
                        ))}
                    </Radio.Group>
                </Form.Item>
                {showOpenType && (
                    <Form.Item
                        label={__('开放条件')}
                        name="open_condition"
                        rules={[
                            {
                                validator: keyboardInputValidator(),
                            },
                        ]}
                    >
                        <Input
                            disabled={model === 'view'}
                            maxLength={128}
                            placeholder={__('开放条件(选填)')}
                        />
                    </Form.Item>
                )}
            </>
        ),
        unit: (
            <Form.Item
                label={__('计量单位')}
                name="unit"
                validateFirst
                validateTrigger={['onChange', 'onBlur']}
                rules={[
                    {
                        validateTrigger: ['onBlur'],
                        validator: (e, value) => checkNormalInput(e, value),
                    },
                ]}
            >
                <Input
                    placeholder={
                        model === 'view' ? __('无') : __('请输入计量单位')
                    }
                    maxLength={128}
                    autoComplete="off"
                    disabled={model === 'view'}
                />
            </Form.Item>
        ),
        description: (
            <Form.Item
                label={__('描述')}
                name="description"
                validateFirst
                validateTrigger={['onChange', 'onBlur']}
                rules={[
                    {
                        validateTrigger: ['onBlur'],
                        validator: (e, value) => checkNormalInput(e, value),
                    },
                ]}
            >
                <Input.TextArea
                    placeholder={model === 'view' ? __('无') : __('请输入描述')}
                    maxLength={300}
                    autoComplete="off"
                    disabled={model === 'view'}
                    style={{ height: 80 }}
                />
            </Form.Item>
        ),
        field_relationship: (
            <Form.Item
                label={__('字段关系')}
                name="field_relationship"
                validateFirst
                validateTrigger={['onChange', 'onBlur']}
                rules={[
                    {
                        validateTrigger: ['onBlur'],
                        validator: (e, value) => checkNormalInput(e, value),
                    },
                ]}
            >
                <Input
                    placeholder={
                        model === 'view' ? __('无') : __('请输入字段关系')
                    }
                    maxLength={128}
                    autoComplete="off"
                    disabled={model === 'view'}
                />
            </Form.Item>
        ),
        is_current_business_generation: (
            <Form.Item
                label={__('本业务产生')}
                name="is_current_business_generation"
                validateTrigger={['onChange', 'onBlur']}
                className={styles.horizontalItem}
            >
                <Radio.Group disabled={model === 'view'}>
                    <Radio value={1}>{__('是')}</Radio>
                    <Radio value={0}>{__('否')}</Radio>
                </Radio.Group>
            </Form.Item>
        ),
        is_incremental_field: (
            <Form.Item
                label={__('增量字段')}
                name="is_incremental_field"
                validateTrigger={['onChange', 'onBlur']}
                className={styles.horizontalItem}
            >
                <Radio.Group disabled={model === 'view'}>
                    <Radio value={1}>{__('是')}</Radio>
                    <Radio value={0}>{__('否')}</Radio>
                </Radio.Group>
            </Form.Item>
        ),
    }

    /**
     * 获取字段编辑信息展开组件的ref
     * @param key
     * @returns
     */
    const getExpandRef = (key) => {
        switch (key) {
            case 'baseModel':
                return baseModelRef
            case 'businessModel':
                return businessModelRef
            case 'technologyModel':
                return technologyModelRef

            case 'classificationModel':
                return classificationModelRef
            case 'shareInfoModel':
                return shareInfoModelRef
            default:
                return {}
        }
    }

    return (
        <div ref={containerBody}>
            <Drawer
                width={560}
                push={false}
                title={
                    <div className={styles.editFieldTitle}>
                        <div className={styles.editTitle}>
                            {__('字段信息')}
                            {isStandardizationRequired &&
                            formType === NewFormType.DSIMPORT ? (
                                <StandardOutlined
                                    className={classnames({
                                        [styles.standardIcon]: true,
                                        [styles.standardedIcon]:
                                            standardStatus === 'normal',
                                    })}
                                />
                            ) : null}
                        </div>
                        <div className={styles.closeButton}>
                            <CloseOutlined
                                onClick={() => {
                                    onClose()
                                }}
                            />
                        </div>
                    </div>
                }
                placement="right"
                closable={false}
                onClose={() => {
                    onClose()
                }}
                mask={false}
                open
                getContainer={false}
                style={{ position: 'absolute' }}
                className={styles.nodeConfigWrapper}
                footer={
                    <div className={styles.footerWrapper}>
                        {formType === NewFormType.BLANK ? (
                            operateBtn
                        ) : incompleteFieldsCount > 1 ||
                          // 当前项已编辑完成 但存在其他未完成的需展示编辑下一个的按钮
                          (incompleteFieldsCount === 1 && currentData.name) ? (
                            <Space size={12}>
                                <span
                                    className={styles.cancelBtnText}
                                    onClick={onClose}
                                >
                                    {__('取消')}
                                </span>
                                <Button
                                    htmlType="submit"
                                    loading={loading}
                                    onClick={() => {
                                        setOperateType(OperateType.OK)
                                        form.submit()
                                    }}
                                    className={styles.dsOkBtn}
                                >
                                    {__('确定')}
                                </Button>
                                <Button
                                    className={styles.okNextBtn}
                                    type="primary"
                                    htmlType="submit"
                                    loading={loading}
                                    onClick={() => {
                                        setOperateType(OperateType.OKAndNext)
                                        form.submit()
                                        cancelRequestRecommendFieldData()
                                    }}
                                >
                                    {__('确定并编辑下一个')}
                                </Button>
                            </Space>
                        ) : (
                            operateBtn
                        )}
                    </div>
                }
                destroyOnClose
            >
                <Form
                    layout="vertical"
                    autoComplete="off"
                    initialValues={currentData}
                    form={form}
                    onValuesChange={(fields, allFiled) => {
                        handleOnChange(fields, allFiled)
                    }}
                    onFinish={onFinish}
                    scrollToFirstError
                    onFinishFailed={({ errorFields }) => {
                        errorFields.forEach((errorField) => {
                            handleExpandFailedGroup(errorField.name[0])
                        })
                        setTimeout(() => {
                            form.scrollToField(errorFields[0].name[0])
                        }, 0)
                    }}
                >
                    {FieldEditInfoKeys[dataKind]?.map((configInfo) => {
                        return (
                            <GroupView
                                title={configInfo.label}
                                expand
                                ref={getExpandRef(configInfo.key)}
                            >
                                <div style={{ marginBottom: '8px' }}>
                                    {configInfo?.items?.map((item) => {
                                        if (item === 'data_type') {
                                            return getDataTypeTemplate()
                                        }
                                        if (item === 'formulate_basis') {
                                            return (
                                                <Form.Item
                                                    label={__('标准分类')}
                                                    // required={!(!!data.ref_id || model === 'view')}
                                                    name="formulate_basis"
                                                    // validateTrigger={['onChange', 'onBlur']}
                                                    // rules={
                                                    //     !!data.ref_id || model === 'view'
                                                    //         ? []
                                                    //         : [
                                                    //               {
                                                    //                   required: true,
                                                    //                   message: __('请选择标准分类'),
                                                    //               },
                                                    //           ]
                                                    // }
                                                >
                                                    <Select
                                                        placeholder={
                                                            (!!data.ref_id &&
                                                                dataKind ===
                                                                    FormTableKind.BUSINESS) ||
                                                            model === 'view'
                                                                ? __('无')
                                                                : __(
                                                                      '请选择标准分类',
                                                                  )
                                                        }
                                                        showSearch
                                                        showArrow
                                                        options={formulateBasisOptions.map(
                                                            (
                                                                formulateBasisOption,
                                                            ) => ({
                                                                label: formulateBasisOption.value,
                                                                value: formulateBasisOption.value_en,
                                                            }),
                                                        )}
                                                        getPopupContainer={(
                                                            element,
                                                        ) => element.parentNode}
                                                        disabled={
                                                            model === 'view'
                                                        }
                                                    />
                                                </Form.Item>
                                            )
                                        }
                                        return formItemTemplate[item]
                                    })}
                                </div>
                            </GroupView>
                        )
                    })}
                </Form>
                {viewCodeStatus && (
                    <Modal
                        title={__('码值信息')}
                        open={viewCodeStatus}
                        onCancel={() => {
                            setViewCodeStatus(false)
                            setViewCodeTables(null)
                        }}
                        width={640}
                        footer={null}
                    >
                        <div
                            className={classnames(
                                viewCodeLoading ? styles.loadingStyles : '',
                            )}
                        >
                            {viewCodeLoading ? (
                                <Spin tip={__('加载中...')} />
                            ) : (
                                <Table
                                    columns={columns}
                                    dataSource={viewCodeTables || []}
                                    scroll={{ y: 600 }}
                                    pagination={false}
                                    locale={{
                                        emptyText:
                                            viewCodeTables?.length === 0 ? (
                                                <Empty
                                                    desc={__('暂无数据')}
                                                    iconSrc={dataEmpty}
                                                />
                                            ) : (
                                                <Empty />
                                            ),
                                    }}
                                />
                            )}
                        </div>
                    </Modal>
                )}
            </Drawer>
            {/* 查看码表详情 */}
            {codeTableVisible && !!detailId && (
                <CodeTableDetails
                    visible={codeTableVisible && !!detailId}
                    dictId={detailId}
                    onClose={() => {
                        setCodeTableVisible(false)
                        setDetailId('')
                    }}
                />
            )}
            {codeRuleVisible && !!detailId && (
                <CodeRuleDetails
                    visible={codeRuleVisible}
                    onClose={() => {
                        setCodeTableVisible(false)
                        setDetailId('')
                    }}
                    id={detailId}
                />
            )}
            {/* 查看数据元详情 */}
            {dataEleDetailVisible && !!detailId && (
                <DataEleDetails
                    visible={dataEleDetailVisible && !!detailId}
                    dataEleId={detailId}
                    onClose={() => {
                        setDataEleDetailVisible(false)
                        setDetailId('')
                    }}
                />
            )}
        </div>
    )
}

export default FieldConfig
