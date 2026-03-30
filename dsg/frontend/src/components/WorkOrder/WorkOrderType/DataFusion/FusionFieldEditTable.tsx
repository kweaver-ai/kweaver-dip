import React, {
    forwardRef,
    ReactNode,
    useCallback,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from 'react'
import { Table, Input, Button, Space, Select, Tooltip } from 'antd'
import {
    InfoCircleOutlined,
    MenuOutlined,
    PlusOutlined,
} from '@ant-design/icons'
import { debounce, isEmpty, noop, toNumber, trim } from 'lodash'
import {
    SortableElement,
    SortableContainer,
    SortableContainerProps,
    SortableHandle,
    SortEnd,
} from 'react-sortable-hoc'
import { arrayMoveImmutable } from 'array-move'
import { useUpdateEffect } from 'ahooks'
import styles from './styles.module.less'
import __ from './locale'
import {
    DataTypeTemplate,
    getEditTableColumns,
    RadioBox,
} from '@/components/FormTableMode/helper'
import { StandardDataDetail } from '@/components/FormTableMode/const'
import SelectTableCodeOrStandard from '@/components/ResourcesDir/FieldsTable/SelectTableCodeOrStandard'
import { formatError, formsEnumConfig, IFormEnumConfigModel } from '@/core'
import { Empty, SearchInput } from '@/ui'
import { checkNormalInput } from '@/components/FormGraph/helper'
import FormItemContainer from '@/components/FormTableMode/FormItemContainer'
import {
    keyboardReg,
    ErrorInfo,
    keyboardInputValidator,
    positiveIntegerReg,
} from '@/utils'
import {
    changeDataTypeToDataEleType,
    dirDataTypeToDataEleType,
    getDataEleDetail,
} from './helper'
import CatlgInfoItemChooseModal from '../../CatlgInfoItemChooseModal'
import { allDataTypeOptions, DataType } from '@/components/DataEleManage/const'
import dataEmpty from '@/assets/dataEmpty.svg'
import { FixedType } from '@/components/CommonTable/const'
import DataViewChooseDrawer from '../../DataViewChooseDrawer'

const tableRowKey = 'fieldCountId'

interface EditableTableProps {
    ref: any
    value?: any
    onModify?: () => void
}

const SortableItem = SortableElement(
    (props: React.HTMLAttributes<HTMLTableRowElement>) => <tr {...props} />,
)
const SortableBody = SortableContainer(
    (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
        <tbody {...props} />
    ),
)

const DragHandle = SortableHandle(() => (
    <MenuOutlined style={{ cursor: 'grab', color: '#999' }} />
    // <HolderOutlined style={{ cursor: 'grab', color: '#999' }} />
))

const DraggableBodyRow: React.FC<any> = (
    { dataSource, className, style, ...restProps },
    ref,
) => {
    const index = dataSource?.findIndex((x, dataIndex) => {
        return x[tableRowKey] === restProps['data-row-key']
    })
    return <SortableItem index={index} {...restProps} />
}

const EditableInputCell = React.memo(
    ({
        value: initialValue,
        onChange,
        onBlur,
        fieldName,
        rowIndex,
        ...props
    }: any) => {
        // 使用本地state管理输入值
        const [value, setValue] = useState(initialValue)

        // 处理输入变化
        const handleChange = useCallback((e) => {
            const newValue = e.target.value
            setValue(newValue) // 只更新本地状态
        }, [])

        // 处理输入变化
        // const handleChange = useCallback(
        //     (e) => {
        //         const newValue = e.target.value
        //         e.stopPropagation()
        //         // 使用防抖延迟更新form值
        //         debounce(() => {
        //             onChange?.(['fields', rowIndex, fieldName], newValue)
        //         }, 300)()
        //     },
        //     [onChange],
        // )

        // 处理失焦
        const handleBlur = useCallback(
            // debounce((e) => {
            //     // 在失焦时才更新form的值
            //     const newValue = trim(e.target.value)
            //     // onChange?.(['fields', rowIndex, fieldName], newValue)
            //     if (newValue !== initialValue) {
            //         onChange?.(newValue)
            //     }
            //     onBlur?.(e)
            // }, 0),
            (e) => {
                // 在失焦时才更新form的值
                const newValue = trim(e.target.value)
                // onChange?.(['fields', rowIndex, fieldName], newValue)
                if (newValue !== initialValue) {
                    onChange?.(newValue)
                }
                onBlur?.(e)
            },
            [onChange, rowIndex, fieldName, value],
        )

        return (
            <Input
                placeholder={__('请输入')}
                value={value}
                onChange={handleChange}
                onBlur={handleBlur}
                {...props}
            />
        )
    },
    (prevProps, nextProps) => {
        // 只有当value真正改变时才重新渲染
        return prevProps.value === nextProps.value
    },
)

const ErrorTips = (props: { children: ReactNode; errorText?: string }) => {
    const { errorText, children } = props
    return (
        <Tooltip
            title={errorText}
            placement="topLeft"
            color="#fff"
            overlayInnerStyle={{
                color: '#e60012',
            }}
        >
            {children}
        </Tooltip>
    )
}

// 字段计数
let fieldCount: number = -1
const FusionFieldEditTable2: React.FC<EditableTableProps> = forwardRef(
    (
        {
            // tableForm,
            value = {},
            onModify,
            // columns = [],
        },
        ref,
    ) => {
        const tableRef: any = useRef()
        const parentNode = tableRef?.current
        const [config, setConfig] = useState<IFormEnumConfigModel>()
        const [formFields, setFormFields] = useState<Array<any>>([])
        const [searchKey, setSearchKey] = useState<string>('')
        const [chooseFieldVisible, setChooseFieldVisible] =
            useState<boolean>(false)
        const once = useRef(true)

        useEffect(() => {
            if (once.current) {
                once.current = false
                fieldCount = -1
                const newFields =
                    value?.fields?.map((fItem) => {
                        const newItem = {
                            [tableRowKey]: `row${(fieldCount += 1)}`,
                            ...fItem,
                            errorTips: {},
                        }
                        return newItem
                    }) || []
                setFormFields(newFields)
            }
        }, [value])

        const checkProps = [
            'c_name',
            'e_name',
            'data_type',
            'data_length',
            'data_accuracy',
            'field_relationship',
        ]

        useImperativeHandle(ref, () => ({
            // 校验-提交
            onValidate: () => {
                let hasError = false
                const newFormFields = formFields.map((item, index) => {
                    const tempItem = {
                        ...item,
                        errorTips: checkProps.reduce((acc, key) => {
                            acc[key] = setErrorText(key, item[key], index, item)
                            return acc
                        }, {}),
                    }
                    if (
                        Object.values(tempItem.errorTips).some(
                            (errorItem) => errorItem,
                        )
                    ) {
                        hasError = true
                    }
                    return tempItem
                })
                if (hasError) {
                    setFormFields(newFormFields)
                    return false
                }
                return true
            },
            submit: (taskId: string) => {
                // form.validateFields()
            },
            getFormValues: () => formFields,
        }))

        // useEffect(() => {
        //     getEnumConfig()
        // }, [])

        // 获取配置信息
        const getEnumConfig = async () => {
            try {
                const res = await formsEnumConfig()
                setConfig(res)
            } catch (e) {
                formatError(e)
            }
        }

        const handleAdd = () => {
            // const newData = form.getFieldValue('fields') || []
            // onChange?.(newData)
            onModify?.()
            fieldCount += 1
            setFormFields((prev) => [
                ...prev,
                {
                    [tableRowKey]: `row${fieldCount}`,
                    errorTips: {},
                },
            ])
        }

        // 从资源中添加-点击确定后设置form字段
        const handleAddFields = async (addItems: any[], delItems: any[]) => {
            try {
                onModify?.()
                // 更新表单数据
                // 使用Promise.all处理所有异步操作
                const newFields = await Promise.all(
                    addItems.map(async (item, index) => {
                        const { id, ...restItems } = item
                        let dataElement: any = {}

                        // 处理异步请求
                        if (item?.standard_code) {
                            try {
                                dataElement = await getDataEleDetail(
                                    item?.standard_code || '',
                                    'code',
                                )
                            } catch (e) {
                                formatError(e)
                            }
                        }

                        // 返回处理后的数据项
                        const newItem = {
                            ...restItems,
                            errorTips: {},
                            // eslint-disable-next-line no-plusplus
                            [tableRowKey]: `row${++fieldCount}`,
                            c_name: item.business_name,
                            e_name: item.technical_name,
                            data_type: dataElement?.id
                                ? dataElement?.data_type
                                : changeDataTypeToDataEleType(item.data_type) ||
                                  DataType.TOTHER,
                            info_item_id: item.id,
                            // catalog_id: item.catalog_id,
                            standard_id: dataElement?.id
                                ? {
                                      id: dataElement?.id,
                                      name: dataElement?.name_cn,
                                  }
                                : undefined,
                            dataElement,
                            // data_type: typeOptoins?.find(
                            //     (tItem) => tItem.value === item.standard_type,
                            // )?.strValue,
                            // data_type: item.standard_type,
                            data_accuracy: dataElement.data_precision,
                            code_table_id: dataElement.dict_id
                                ? {
                                      id: dataElement.dict_id,
                                      name: dataElement.dict_name_cn,
                                  }
                                : item.code_table_id
                                ? {
                                      id: item.code_table_id,
                                      name: item.code_table,
                                  }
                                : undefined,
                            code_rule_id: dataElement.rule_id
                                ? {
                                      id: dataElement.rule_id,
                                      name: dataElement.rule_name,
                                  }
                                : undefined,
                            data_range: item.data_range || '',
                            primary_key: item.primary_flag,
                            field_relationship: `取值“${item?.tableNameEn}表.${item?.technical_name}字段”`,
                        }
                        return {
                            ...newItem,
                            errorTips: checkProps.reduce((acc, key) => {
                                acc[key] = setErrorText(
                                    key,
                                    newItem[key],
                                    formFields.length + index,
                                    newItem,
                                )
                                return acc
                            }, {}),
                        }
                    }) || [],
                )

                setFormFields([
                    ...formFields.filter(
                        (fItem) =>
                            !delItems.find(
                                (_item) => _item.id === fItem.info_item_id,
                            ),
                    ),
                    ...newFields,
                ])
            } catch (error) {
                formatError(error)
            }
        }

        const handleDelete = (index: number) => {
            onModify?.()
            setFormFields(
                (prev) => prev?.filter((_, idx) => idx !== index) || [],
            )
        }

        const checkRepeatName = (
            key: string,
            val: any,
            index: number,
            fields: any[],
        ) => {
            return fields.some(
                (fItem, innerIndex) =>
                    fItem[key] === val && index !== innerIndex,
            )
        }

        const setErrorText = (
            key: string,
            val: any,
            index: number,
            record?: any,
        ) => {
            // 字段名称
            if (key === 'c_name') {
                if (!val) {
                    return __('输入不能为空')
                }
                if (!keyboardReg.test(val)) {
                    return ErrorInfo.EXCEPTEMOJI
                }
                if (checkRepeatName(key, val, index, formFields)) {
                    return __('字段名称不能重复')
                }
                return ''
            }
            // 英文名称
            if (key === 'e_name') {
                if (!val) {
                    return __('输入不能为空')
                }
                if (!keyboardReg.test(val)) {
                    return ErrorInfo.EXCEPTEMOJI
                }
                if (checkRepeatName(key, val, index, formFields)) {
                    return __('英文名称不能重复')
                }
                return ''
            }
            // 数据类型
            if (key === 'data_type') {
                if (!val) {
                    return __('请选择数据类型')
                }
                return ''
            }
            const isDecimal = record?.data_type === DataType.TDECIMAL
            const isChar = record?.data_type === DataType.TCHAR
            // 数据长度
            if (key === 'data_length') {
                if (!val && val !== 0) {
                    if (isDecimal || isChar) {
                        return __('输入不能为空')
                    }
                    return ''
                }
                if (isDecimal && !/^(?:[1-9]|[1-2][0-9]|3[0-8])$/.test(val)) {
                    return __('请输入1~38之间的整数')
                }
                if (
                    isChar &&
                    !/^(?:[1-9]|[1-9][0-9]{1,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/.test(
                        val,
                    )
                ) {
                    return __('请输入1～65535之间的整数')
                }
                return ''
            }
            // 精度
            if (key === 'data_accuracy') {
                if (isDecimal) {
                    if (!val) {
                        return __('输入不能为空')
                    }
                    if (val === '0') {
                        return __('请输入1～数据长度之间的整数')
                    }
                    if (record?.data_length && val > record?.data_length) {
                        return __('请输入1～数据长度之间的整数')
                    }
                }
                return ''
            }

            if (key === 'field_relationship') {
                if (val && !keyboardReg.test(val)) {
                    return ErrorInfo.EXCEPTEMOJI
                }
                return ''
            }

            return ''
        }

        const onFieldsChange = (
            key: string,
            val: any,
            record: any,
            index: number,
        ) => {
            onModify?.()
            setFormFields((prev) =>
                prev.map((item, idx) => {
                    const isCurrent = idx === index
                    const info = {
                        ...item,
                        [key]: isCurrent ? val : item[key],
                    }
                    if (key === 'data_type' && isCurrent) {
                        info.data_length = undefined
                        info.data_accuracy = undefined
                        info.errorTips = {
                            ...item?.errorTips,
                            data_length: '',
                            data_accuracy: '',
                        }
                    }
                    // if (key === 'standard_id' && isCurrent) {
                    //     const standardData = await getDataEleDetail(
                    //         val?.id || '',
                    //     )
                    //     info.dataElement = standardData
                    //     info.data_type = standardData.data_type
                    //     info.code_table_id =
                    //         !standardData?.dict_deleted && standardData.dict_id
                    //             ? {
                    //                   id: standardData.dict_id,
                    //                   name: standardData.dict_name_cn,
                    //               }
                    //             : item.code_table_id
                    //     info.code_rule_id =
                    //         !standardData?.rule_deleted && standardData?.rule_id
                    //             ? {
                    //                   id: standardData.rule_id,
                    //                   name: standardData.rule_name,
                    //               }
                    //             : item.code_rule_id
                    // }
                    if (key === 'code_table_id' && isCurrent) {
                        let isClearDataEle = false
                        // 已选数据元自带的码表与选择码表不一样则清空数据元
                        if (
                            record?.dataElement?.dict_id &&
                            record?.dataElement?.dict_id !== val?.id
                        ) {
                            isClearDataEle = true
                        }
                        info.code_table_id = val
                        info.dataElement = isClearDataEle
                            ? undefined
                            : record?.dataElement
                        info.standard_id = isClearDataEle
                            ? undefined
                            : record?.standard_id
                    }
                    if (key === 'code_rule_id' && isCurrent) {
                        let isClearDataEle = false
                        // 已选数据元自带的码表与选择码表不一样则清空数据元
                        if (
                            record?.dataElement?.rule_id &&
                            record?.dataElement?.rule_id !== val?.id
                        ) {
                            isClearDataEle = true
                        }
                        info.code_rule_id = val
                        info.dataElement = isClearDataEle
                            ? undefined
                            : record?.dataElement
                        info.standard_id = isClearDataEle
                            ? undefined
                            : record?.standard_id
                    }
                    return {
                        ...info,
                        errorTips: isCurrent
                            ? {
                                  ...info?.errorTips,
                                  [key]: setErrorText(key, val, idx, info),
                              }
                            : item?.errorTips,
                    }
                }),
            )
        }

        const redDot = (
            <span
                style={{
                    color: '#F5222D',
                    marginRight: 4,
                }}
            >
                *
            </span>
        )

        const fusionColumns = [
            {
                title: (
                    <span className={styles.fieldLabel}>{__('字段名称')}</span>
                ),
                dataIndex: 'c_name',
                key: 'c_name',
                fixed: FixedType.LEFT,
                width: 160,
                render: (text, record, index) => (
                    <ErrorTips errorText={record?.errorTips?.c_name}>
                        <SearchInput
                            showIcon={false}
                            allowClear={false}
                            status={record?.errorTips?.c_name ? 'error' : ''}
                            maxLength={255}
                            value={text}
                            placeholder={__('请输入')}
                            onBlur={(e) => {
                                onFieldsChange(
                                    'c_name',
                                    e.target?.value,
                                    record,
                                    index,
                                )
                            }}
                        />
                    </ErrorTips>
                ),
            },
            {
                title: (
                    <span className={styles.fieldLabel}>{__('英文名称')}</span>
                ),
                dataIndex: 'e_name',
                key: 'e_name',
                render: (text, record, index) => (
                    <ErrorTips errorText={record?.errorTips?.e_name}>
                        <SearchInput
                            showIcon={false}
                            allowClear={false}
                            status={record?.errorTips?.e_name ? 'error' : ''}
                            maxLength={255}
                            value={text}
                            placeholder={__('请输入')}
                            onBlur={(e) => {
                                onFieldsChange(
                                    'e_name',
                                    e.target?.value,
                                    record,
                                    index,
                                )
                            }}
                        />
                    </ErrorTips>
                ),
            },
            {
                title: __('数据标准'),
                dataIndex: 'standard_id',
                key: 'standard_id',
                render: (_, record, index: number) => (
                    <SelectTableCodeOrStandard
                        type="standard"
                        fields={record.standard_id}
                        fieldKeys={{
                            fieldId: 'id',
                            fieldLabel: 'name',
                        }}
                        onChange={async (newValue) => {
                            onModify?.()
                            const standardData = await getDataEleDetail(
                                newValue?.id || '',
                            )
                            setFormFields((prev) =>
                                prev.map((item, idx) => {
                                    if (idx === index) {
                                        const newItem = { ...item }
                                        newItem.dataElement = standardData
                                        newItem.data_type =
                                            standardData.data_type
                                        newItem.standard_id = newValue
                                        newItem.code_table_id =
                                            !standardData?.dict_deleted &&
                                            standardData.dict_id
                                                ? {
                                                      id: standardData.dict_id,
                                                      name: standardData.dict_name_cn,
                                                  }
                                                : item.code_table_id
                                        newItem.code_rule_id =
                                            !standardData?.rule_deleted &&
                                            standardData?.rule_id
                                                ? {
                                                      id: standardData.rule_id,
                                                      name: standardData.rule_name,
                                                  }
                                                : item.code_rule_id
                                        return newItem
                                    }
                                    return item
                                }),
                            )
                        }}
                    />
                ),
            },
            {
                title: __('关联码表'),
                dataIndex: 'code_table_id',
                key: 'code_table_id',
                // width: 152,
                render: (_, record, index) => {
                    return (
                        <SelectTableCodeOrStandard
                            type="code"
                            fields={record.code_table_id}
                            fieldKeys={{
                                fieldId: 'id',
                                fieldLabel: 'name',
                            }}
                            onChange={async (newValue) => {
                                onFieldsChange(
                                    'code_table_id',
                                    newValue,
                                    record,
                                    index,
                                )
                            }}
                        />
                    )
                },
            },
            {
                title: __('关联编码规则'),
                dataIndex: 'code_rule_id',
                key: 'code_rule_id',
                // width: 152,
                render: (_, record, index) => {
                    return (
                        <SelectTableCodeOrStandard
                            type="coderule"
                            fields={record.code_rule_id}
                            fieldKeys={{
                                fieldId: 'id',
                                fieldLabel: 'name',
                            }}
                            onChange={(newValue) => {
                                onFieldsChange(
                                    'code_rule_id',
                                    newValue,
                                    record,
                                    index,
                                )
                            }}
                        />
                    )
                },
            },
            {
                title: __('值域'),
                dataIndex: 'data_range',
                key: 'data_range',
                render: (text, record, index) => (
                    <SearchInput
                        showIcon={false}
                        allowClear={false}
                        value={text}
                        placeholder={__('请输入')}
                        onBlur={(e) => {
                            onFieldsChange(
                                'data_range',
                                e.target?.value,
                                record,
                                index,
                            )
                        }}
                    />
                ),
            },
            {
                title: (
                    <span className={styles.fieldLabel}>{__('数据类型')}</span>
                ),
                dataIndex: 'data_type',
                key: 'data_type',
                width: 450,
                render: (_, record, index) => {
                    const needLength =
                        record?.data_type === DataType.TCHAR ||
                        record?.data_type === DataType.TDECIMAL
                    const needAccuracy = record?.data_type === DataType.TDECIMAL
                    return (
                        <div className={styles.dataTypeWrap}>
                            <ErrorTips errorText={record?.errorTips?.data_type}>
                                <Select
                                    style={{ width: '120px' }}
                                    placeholder={__('请选择')}
                                    showArrow
                                    status={
                                        record?.errorTips?.data_type
                                            ? 'error'
                                            : undefined
                                    }
                                    value={record?.data_type}
                                    options={allDataTypeOptions}
                                    onChange={(val) => {
                                        onFieldsChange(
                                            'data_type',
                                            val,
                                            record,
                                            index,
                                        )
                                    }}
                                />
                            </ErrorTips>
                            <ErrorTips
                                errorText={record?.errorTips?.data_length}
                            >
                                <SearchInput
                                    style={{ width: needLength ? 148 : 90 }}
                                    placeholder={
                                        record?.data_type === DataType.TCHAR
                                            ? __('长度（1～65535）')
                                            : record?.data_type ===
                                              DataType.TDECIMAL
                                            ? __('长度（1~38）')
                                            : __('数据长度')
                                    }
                                    prefix={needLength ? redDot : undefined}
                                    showIcon={false}
                                    allowClear={false}
                                    disabled={!needLength}
                                    status={
                                        record?.errorTips?.data_length
                                            ? 'error'
                                            : undefined
                                    }
                                    value={record?.data_length}
                                    onBlur={(e) => {
                                        onFieldsChange(
                                            'data_length',
                                            e.target?.value,
                                            record,
                                            index,
                                        )
                                    }}
                                />
                            </ErrorTips>
                            <ErrorTips
                                errorText={record?.errorTips?.data_accuracy}
                            >
                                <SearchInput
                                    style={{ width: needAccuracy ? 148 : 90 }}
                                    placeholder={
                                        needAccuracy
                                            ? __('精度（要≤长度）')
                                            : __('数据精度')
                                    }
                                    status={
                                        record?.errorTips?.data_accuracy
                                            ? 'error'
                                            : undefined
                                    }
                                    prefix={needAccuracy ? redDot : undefined}
                                    disabled={!needAccuracy}
                                    showIcon={false}
                                    allowClear={false}
                                    value={record?.data_accuracy}
                                    onBlur={(e) => {
                                        onFieldsChange(
                                            'data_accuracy',
                                            e.target?.value,
                                            record,
                                            index,
                                        )
                                    }}
                                />
                            </ErrorTips>
                        </div>
                    )
                },
            },
            {
                title: __('主键'),
                dataIndex: 'primary_key',
                key: 'primary_key',
                width: 60,
                render: (_, record, index) => (
                    <RadioBox
                        checked={record?.primary_key}
                        onChange={(val) => {
                            onFieldsChange('primary_key', val, record, index)
                        }}
                    />
                ),
            },
            {
                title: __('必填'),
                dataIndex: 'is_required',
                key: 'is_required',
                width: 60,
                render: (_, record, index) => (
                    <RadioBox
                        checked={record?.is_required}
                        onChange={(val) => {
                            onFieldsChange('is_required', val, record, index)
                        }}
                    />
                ),
            },
            {
                title: __('增量字段'),
                dataIndex: 'is_increment',
                key: 'is_increment',
                width: 88,
                render: (_, record, index) => (
                    <RadioBox
                        checked={record?.is_increment}
                        onChange={(val) => {
                            onFieldsChange('is_increment', val, record, index)
                        }}
                    />
                ),
            },
            {
                title: __('是否标准'),
                dataIndex: 'is_standard',
                key: 'is_standard',
                width: 88,
                render: (_, record, index) => (
                    <RadioBox
                        checked={record?.is_standard}
                        onChange={(val) => {
                            onFieldsChange('is_standard', val, record, index)
                        }}
                    />
                ),
            },
            {
                title: (
                    <div>
                        {__('字段关系')}

                        <Tooltip
                            title={__(
                                '是否严格参照标准定义，包括命名、值域、字段关系等',
                            )}
                            placement="bottomLeft"
                            color="#fff"
                            overlayInnerStyle={{
                                color: 'rgba(0,0,0,0.85)',
                            }}
                            overlayStyle={{
                                maxWidth: '500px',
                            }}
                            arrowPointAtCenter
                        >
                            <span style={{ marginLeft: '2px' }}>
                                <InfoCircleOutlined />
                            </span>
                        </Tooltip>
                    </div>
                ),
                dataIndex: 'field_relationship',
                key: 'field_relationship',
                render: (text, record, index) => (
                    <ErrorTips
                        errorText={record?.errorTips?.field_relationship}
                    >
                        <SearchInput
                            placeholder={__('请输入')}
                            showIcon={false}
                            allowClear={false}
                            maxLength={128}
                            status={
                                record?.errorTips?.field_relationship
                                    ? 'error'
                                    : undefined
                            }
                            value={text}
                            onBlur={(e) => {
                                onFieldsChange(
                                    'field_relationship',
                                    e.target?.value,
                                    record,
                                    index,
                                )
                            }}
                        />
                    </ErrorTips>
                ),
            },
            {
                title: '操作',
                key: 'action',
                width: 64,
                render: (_: any, record: any, index: number) => (
                    <Space>
                        <Button type="link" onClick={() => handleDelete(index)}>
                            {__('删除')}
                        </Button>
                    </Space>
                ),
            },
        ]

        // useUpdateEffect(() => {
        //     const fieldsTemp = formFields || []
        //     const filterFields = fieldsTemp?.filter(
        //         (item) =>
        //             item?.c_name
        //                 ?.toLocaleLowerCase()
        //                 ?.includes(searchKey.toLocaleLowerCase()) ||
        //             item?.e_name
        //                 ?.toLocaleLowerCase()
        //                 ?.includes(searchKey.toLocaleLowerCase()),
        //     )

        //     setTableDataFilter(filterFields)
        //     form.setFieldValue('fields', filterFields)
        // }, [searchKey])

        const onSortEnd = ({ oldIndex, newIndex }) => {
            if (oldIndex !== newIndex) {
                const newData = arrayMoveImmutable(
                    formFields.slice(),
                    oldIndex,
                    newIndex,
                ).filter((el: any) => !!el)
                setFormFields(newData)
            }
        }

        const DraggableContainer = useCallback(
            (props: SortableContainerProps) => (
                <SortableBody
                    useDragHandle
                    disableAutoscroll
                    helperClass={styles.rowDragging}
                    onSortEnd={onSortEnd}
                    {...props}
                />
            ),
            [onSortEnd],
        )

        const components = useMemo(
            () => ({
                body: {
                    wrapper: DraggableContainer,
                    row: (props) => {
                        return DraggableBodyRow({
                            dataSource: formFields,
                            ...props,
                        })
                    },
                },
            }),
            [DraggableContainer],
        )

        return (
            <div className={styles.fusionModelWrapper}>
                <div className={styles.fusionModelTableName}>
                    <div className={styles.fusionModelTableOpr}>
                        <Space size={12}>
                            <Button type="primary" onClick={handleAdd}>
                                {__('添加字段')}
                            </Button>
                            <Button
                                onClick={() => {
                                    setChooseFieldVisible(true)
                                }}
                            >
                                {__('从资源中添加')}
                            </Button>
                        </Space>
                        <SearchInput
                            onKeyChange={(keyword) => {
                                setSearchKey(keyword)
                            }}
                            style={{ width: 272 }}
                            placeholder={__('搜索中英文名称')}
                        />
                    </div>
                </div>
                <Table
                    ref={tableRef}
                    dataSource={
                        searchKey
                            ? formFields.filter(
                                  (item) =>
                                      item?.c_name
                                          ?.toLocaleLowerCase()
                                          ?.includes(
                                              searchKey.toLocaleLowerCase(),
                                          ) ||
                                      item?.e_name
                                          ?.toLocaleLowerCase()
                                          ?.includes(
                                              searchKey.toLocaleLowerCase(),
                                          ),
                              )
                            : formFields
                    }
                    columns={
                        searchKey
                            ? fusionColumns
                            : [
                                  {
                                      dataIndex: 'drag',
                                      width: 24,
                                      key: 'drag',
                                      className: 'drag-visible',
                                      fixed: FixedType.LEFT,
                                      render: () => <DragHandle />,
                                  },
                                  ...fusionColumns,
                              ]
                    }
                    components={components}
                    locale={{
                        emptyText: (
                            <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
                        ),
                    }}
                    pagination={false}
                    // rowKey={(_, index) => `row${index?.toString()}` || 'id'}
                    // rowKey="index"
                    rowKey={tableRowKey}
                    className={styles.fusionTableWrapper}
                    scroll={{
                        x: 1920,
                        y: `calc(100vh - 200px)`,
                    }}
                />
                <Button
                    type="dashed"
                    onClick={handleAdd}
                    style={{ marginTop: 8, color: 'rgba(0,0,0,0.85)' }}
                    block
                    icon={<PlusOutlined />}
                >
                    {__('添加字段')}
                </Button>

                {/* 添加目录信息项字段 */}
                {chooseFieldVisible && (
                    // <CatlgInfoItemChooseModal
                    //     open={chooseFieldVisible}
                    //     selDataItems={
                    //         form
                    //             .getFieldValue('fields')
                    //             ?.filter((item) => item.info_item_id) || []
                    //     }
                    //     onClose={() => setChooseFieldVisible(false)}
                    //     onSure={async (list) => {
                    //         setChooseFieldVisible(false)
                    //         await handleAddFields(list)
                    //     }}
                    // />
                    <DataViewChooseDrawer
                        open={chooseFieldVisible}
                        title={__('添加字段')}
                        selDataItems={
                            formFields
                                ?.filter((item) => item.info_item_id)
                                ?.map((item) => ({
                                    ...item,
                                    id: item.info_item_id,
                                    business_name: item.c_name,
                                })) || []
                        }
                        onClose={() => setChooseFieldVisible(false)}
                        onSure={(addItems, delItems) => {
                            setChooseFieldVisible(false)
                            handleAddFields(addItems, delItems)
                        }}
                    />
                )}
            </div>
        )
    },
)

export default FusionFieldEditTable2
