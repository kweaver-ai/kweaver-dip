import React, { useEffect, useState } from 'react'
import { Form, Space, Select, Input, Row, Spin, Tooltip } from 'antd'
import { trim } from 'lodash'
import { IFormula, IFormulaFields } from '@/core'
import styles from './styles.module.less'
import {
    fieldInfos,
    FieldTypes,
    FormulaError,
    groupDate,
    sensitivityFieldLimits,
    configErrorList,
    disabledGroupSelectLimits,
} from '../const'
import __ from '../locale'
import { checkIndicatorFormulaConfig, useSceneGraphContext } from '../helper'
import { groupOptions } from '@/components/BussinessConfigure/const'
import {
    dataEmptyView,
    IFormulaConfigEl,
    tipLabel,
    fieldLabel,
    getPolicyFields,
} from './helper'
import { DATA_TYPE_MAP } from '@/utils'
import ConfigHeader from './ConfigHeader'

/**
 * 指标算子配置
 */
const IndicatorFormula = ({
    visible,
    graph,
    node,
    formulaData,
    fieldsData,
    dragExpand,
    onChangeExpand,
    onClose,
}: IFormulaConfigEl) => {
    const { citeFormViewId } = useSceneGraphContext()
    const [form] = Form.useForm()
    const [loading, setLoading] = useState<boolean>(false)
    const [selectedDesensitizationField, setSelectedDesensitizationField] =
        useState<boolean>(false)
    const [isDisabledGroup, setIsDisabledGroup] = useState<boolean>(false)
    const [policyFieldsInfo, setPolicyFieldsInfo] = useState<any>()
    // 前序节点数据
    const [preNodeData, setPreNodeData] = useState<IFormulaFields[]>([])
    // 当前的算子信息
    const [formulaItem, setFormulaItem] = useState<IFormula>()
    // 字段选项
    const [fieldOptions, setFieldOptions] = useState<any[]>([])
    // 聚合函数选项
    const [wayOptions, setWayOptions] = useState<any[]>([])

    useEffect(() => {
        if (visible && formulaData && node && graph) {
            checkData()
        }
    }, [visible, formulaData])

    // 保存节点配置
    const handleSave = async () => {
        try {
            await form.validateFields()
            const values = form.getFieldsValue()
            const { name, measure_field, aggregate, group } = values
            const nameValue = trim(name)
            const { formula } = node!.data
            const measureField = preNodeData.find((b) => {
                const ids = measure_field.split('_')
                return b.id === ids[0] && b.sourceId === ids[1]
            })
            const outData: IFormulaFields[] = [
                {
                    ...measureField,
                    alias: nameValue,
                    sourceId: node!.id,
                    data_type: FieldTypes.INT,
                },
            ]
            const measureValue = {
                aggregate,
                field: preNodeData.find((info) => {
                    const ids = measure_field.split('_')
                    return info.id === ids[0] && info.sourceId === ids[1]
                }),
            }
            const groupValue = group
                .filter((info) => !!info.field)
                .map((info) => {
                    const fieldValue = preNodeData.find((a) => {
                        const ids = info.field.split('_')
                        return a.id === ids[0] && a.sourceId === ids[1]
                    })
                    const fieldDataType =
                        fieldValue?.data_type ||
                        fieldsData.data.find((b) => b.id === fieldValue?.id)
                            ?.data_type
                    if (groupDate.includes(fieldDataType)) {
                        outData.push({
                            ...fieldValue!,
                            data_type: FieldTypes.CHAR,
                        })
                        return {
                            ...info,
                            field: fieldValue,
                        }
                    }
                    outData.push(fieldValue!)
                    return {
                        format: undefined,
                        field: fieldValue,
                    }
                })
            const policyFieldIds = policyFieldsInfo?.fields?.map(
                (item) => item.id,
            )
            const validate =
                (selectedDesensitizationField &&
                    !!group.filter((info) => !!info.field)?.length &&
                    disabledGroupSelectLimits.includes(aggregate)) ||
                policyFieldIds?.includes(measureField?.id) ||
                group?.some((o) => policyFieldIds?.includes(o?.field?.id))
            if (validate) {
                form.setFields([
                    {
                        name: ['group', 0, 'field'],
                        errors: [
                            __(
                                '已选的度量字段数据受脱敏管控，不能使用分组求和，请更改聚合方式或取消分组，也可以重新选择度量字段',
                            ),
                        ],
                    },
                    {
                        name: ['aggregate'],
                        errors: [
                            __('当前字段数据受脱敏管控，不能使用${text}', {
                                text: wayOptions?.find(
                                    (i) => i.value === aggregate,
                                )?.label,
                            }),
                        ],
                    },
                ])
                return
            }
            node!.replaceData({
                ...node?.data,
                formula: formula.map((info) => {
                    if (info.id === formulaItem?.id) {
                        const tempFl = info
                        delete tempFl.errorMsg
                        return {
                            ...tempFl,
                            config: {
                                name: nameValue,
                                measure: measureValue,
                                group: groupValue,
                            },
                            output_fields: outData,
                        }
                    }
                    return info
                }),
            })
            onClose()
        } catch (err) {
            // if (err?.errorFields?.length > 0) {
            // }
        }
    }

    const clearData = () => {
        form.resetFields()
        setPreNodeData([])
        setFormulaItem(undefined)
        setFieldOptions([])
        setWayOptions([])
    }

    // 检查更新数据
    const checkData = async () => {
        setLoading(true)
        clearData()
        const { preOutData, outData, policyFieldInfos } =
            await checkIndicatorFormulaConfig(
                graph!,
                node!,
                formulaData!,
                fieldsData,
            )
        setPolicyFieldsInfo(policyFieldInfos)

        const realFormula = node!.data.formula.find(
            (info) => info.id === formulaData!.id,
        )
        setFormulaItem(realFormula)
        const { config, errorMsg } = realFormula
        if (errorMsg && !configErrorList.includes(errorMsg)) {
            setTimeout(() => {
                setLoading(false)
            }, 400)
            return
        }
        setPreNodeData(preOutData)
        setFieldOptions(
            preOutData.map((info) => {
                const type =
                    info?.data_type ||
                    fieldsData.data.find((a) => a.id === info.id)?.data_type

                const disabled = DATA_TYPE_MAP.time.includes(type || '')

                return {
                    value: `${info.id}_${info.sourceId}`,
                    label: fieldLabel(type, info.alias),
                    id: info.id,
                    alias: info.alias,
                    data_type: info.data_type,
                    sourceId: info.sourceId,
                    disabled,
                }
            }),
        )

        if (config) {
            const { name, measure, group } = config
            form.setFieldValue('name', name)
            // 度量
            const measureField = preOutData.find(
                (info) =>
                    info.id === measure?.field.id &&
                    info.sourceId === measure?.field.sourceId,
            )
            if (measureField) {
                form.setFieldValue(
                    'measure_field',
                    `${measureField.id}_${measureField.sourceId}`,
                )
                const preMeasureFieldDataType =
                    measureField?.data_type ||
                    fieldsData.data.find((info) => info.id === measureField?.id)
                        ?.data_type
                const measureFieldDataType =
                    measure?.field?.data_type ||
                    fieldsData.data.find(
                        (info) => info.id === measure?.field?.id,
                    )?.data_type
                if (measureFieldDataType === 'time') {
                    setTimeout(() => {
                        form.setFields([
                            {
                                name: 'measure_field',
                                errors: [
                                    __(
                                        '当前不支持选择此类型的字段，请重新选择',
                                    ),
                                ],
                            },
                        ])
                    }, 450)
                }
                if (
                    !measureField ||
                    preMeasureFieldDataType !== measureFieldDataType ||
                    !fieldInfos[
                        measureFieldDataType
                    ].polymerizationOptions.find(
                        (a) => a.value === measure?.aggregate,
                    )
                ) {
                    updateWayOptions({
                        data: preOutData,
                        value: `${measureField.id}_${measureField.sourceId}`,
                        policyFields: policyFieldInfos?.fields,
                        aggregate: measure?.aggregate,
                    })
                    setTimeout(() => {
                        form.setFields([
                            {
                                name: 'aggregate',
                                errors: [__('请选择聚合方式')],
                            },
                        ])
                    }, 450)
                } else {
                    updateWayOptions({
                        data: preOutData,
                        value: `${measureField.id}_${measureField.sourceId}`,
                        policyFields: policyFieldInfos?.fields,
                        putDefault: true,
                        aggregate: measure?.aggregate,
                    })
                    form.setFieldValue('aggregate', measure.aggregate)
                }
            } else {
                setTimeout(() => {
                    form.setFields([
                        {
                            name: 'measure_field',
                            errors: [__('字段被删除，请重新选择')],
                        },
                    ])
                }, 450)
            }
            let nameRepeat = false
            // 分组
            const groupValue = group?.map((info, idx) => {
                const { field, format } = info
                const findItem = preOutData.find(
                    (a) => a.id === field.id && a.sourceId === field.sourceId,
                )
                if (findItem) {
                    if (findItem.alias === name) {
                        nameRepeat = true
                    }
                    const findItemDataType =
                        findItem?.data_type ||
                        fieldsData.data.find((a) => a.id === findItem.id)
                            ?.data_type
                    const infoFieldDataType =
                        field?.data_type ||
                        fieldsData.data.find((a) => a.id === field.id)
                            ?.data_type
                    const infoDate = groupDate.includes(
                        findItemDataType as FieldTypes,
                    )
                    const itemDate = groupDate.includes(
                        infoFieldDataType as FieldTypes,
                    )
                    // if (findItemDataType !== infoFieldDataType) {
                    if (!itemDate && infoDate) {
                        setTimeout(() => {
                            form.setFields([
                                {
                                    name: ['group', idx, 'format'],
                                    errors: ['请选择'],
                                },
                            ])
                        }, 450)
                        return {
                            field: `${findItem.id}_${findItem.sourceId}`,
                            format,
                        }
                    }
                    if (
                        (itemDate && !infoDate) ||
                        (!infoDate && format) ||
                        (infoDate && !format)
                    ) {
                        setTimeout(() => {
                            form.setFields([
                                {
                                    name: ['group', idx, 'field'],
                                    errors: [__('字段类型变更')],
                                },
                            ])
                        }, 450)
                        return {
                            field: `${findItem.id}_${findItem.sourceId}`,
                            format: undefined,
                        }
                    }
                    if (
                        findItemDataType === 'time' ||
                        infoFieldDataType === 'time'
                    ) {
                        setTimeout(() => {
                            form.setFields([
                                {
                                    name: ['group', idx, 'field'],
                                    errors: [
                                        __(
                                            '当前不支持选择此类型的字段，请重新选择',
                                        ),
                                    ],
                                },
                            ])
                        }, 450)
                    }
                    // }
                    return {
                        field: `${findItem.id}_${findItem.sourceId}`,
                        format,
                    }
                }
                setTimeout(() => {
                    form.setFields([
                        {
                            name: ['group', idx, 'field'],
                            errors: [__('字段被删除，请重新选择')],
                        },
                    ])
                }, 450)
                return {
                    field: undefined,
                    format: undefined,
                }
            })
            form.setFieldValue(
                'group',
                groupValue.length === 2
                    ? groupValue
                    : groupValue.length === 1
                    ? [...groupValue, { field: undefined }]
                    : [{ field: undefined }, { field: undefined }],
            )
            if (nameRepeat) {
                setTimeout(() => {
                    form.setFields([
                        {
                            name: 'name',
                            errors: [__('该名称与分组字段名称相同，请修改')],
                        },
                    ])
                }, 450)
            }
        }
        setTimeout(() => {
            setLoading(false)
        }, 400)
    }

    // 度量名称校验
    const validateMeasureName = (value) => {
        return new Promise((resolve, reject) => {
            const trimValue = trim(value)
            if (!trimValue) {
                reject(new Error(__('输入不能为空')))
            }
            const groupValue = form.getFieldValue('group').map((info) =>
                preNodeData.find((a) => {
                    const ids = info.field?.split('_')
                    return a.id === ids?.[0] && a.sourceId === ids?.[1]
                }),
            )
            if (!groupValue.every((info) => info?.alias !== trimValue)) {
                reject(new Error(__('该名称与分组字段名称相同，请修改')))
            }
            resolve(1)
        })
    }

    // 字段搜索过滤
    const filterField = (inputValue: string, option) => {
        const res = preNodeData
            .filter((info) =>
                info.alias
                    ?.toLocaleLowerCase()
                    .includes(trim(inputValue).toLocaleLowerCase()),
            )
            .filter(
                (info) =>
                    info.id === option?.value?.split('_')[0] &&
                    info.sourceId === option?.value?.split('_')[1],
            )
        return res.length > 0
    }

    /**
     * 更新聚合函数选项
     * @param data 字段集
     * @param value 选中的字段值
     * @param putDefault 是否显示默认值
     * @param policyFields 脱敏策略字段
     * @param aggregate 聚合函数
     */
    const updateWayOptions = (params: {
        data: any[]
        value: string
        putDefault?: boolean
        policyFields?: any
        aggregate?: string
    }) => {
        const { data, value, putDefault, policyFields, aggregate } = params
        if (value) {
            const item = data.find((info) => {
                const ids = value.split('_')
                return info.id === ids?.[0] && info.sourceId === ids?.[1]
            })
            const field_type_en =
                item?.data_type ||
                fieldsData.data.find((a) => a.id === item?.id)?.data_type
            const typeOptions = field_type_en
                ? fieldInfos[field_type_en].polymerizationOptions
                : []
            const defaultOption = typeOptions.find((info) => info.default)
            const fields = policyFields || policyFieldsInfo?.fields || []
            const isDesensitizationField = fields
                ?.map((o) => o.id)
                ?.includes(item?.id)
            setSelectedDesensitizationField(isDesensitizationField)
            setWayOptions(
                typeOptions?.map((o) => {
                    const disabled =
                        isDesensitizationField &&
                        sensitivityFieldLimits.includes(o.value)
                    return {
                        ...o,
                        disabled,
                        title: disabled
                            ? `${__('当前字段数据受脱敏管控，不能查询')}${
                                  o.label
                              }`
                            : o.label,
                    }
                }),
            )
            if (putDefault) {
                form.setFields([
                    {
                        name: 'aggregate',
                        value: defaultOption.value,
                        errors: [],
                    },
                ])
            }
            setIsDisabledGroup(
                disabledGroupSelectLimits.includes(
                    aggregate || defaultOption.value,
                ) && isDesensitizationField,
            )
        } else {
            setWayOptions([])
            form.resetFields(['aggregate'])
        }
    }

    // 度量字段变更
    const handleChangeMeasureField = (value) => {
        updateWayOptions({ data: preNodeData, value, putDefault: true })
    }

    // 分组字段变更
    const handleChangeGroupField = (value, index) => {
        const values = form.getFieldValue('group')
        const hasFormat = checkGroupFieldShow(value)
        form.setFieldValue(
            'group',
            values.map((info, idx) => {
                if (index === idx) {
                    const defaultFormat = groupOptions[0].value
                    return {
                        field: value,
                        format: hasFormat ? defaultFormat : undefined,
                    }
                }
                return info
            }),
        )
        form.setFields([
            {
                name: ['group', index, 'field'],
                errors: [],
            },
            {
                name: ['group', index, 'format'],
                errors: [],
            },
        ])
    }

    // 判断分组字段的显示信息
    const checkGroupFieldShow = (value) => {
        if (value) {
            const item = preNodeData.find((info) => {
                const ids = value.split('_')
                return info.id === ids?.[0] && info.sourceId === ids?.[1]
            })
            const field_type_en =
                item?.data_type ||
                fieldsData.data.find((a) => a.id === item?.id)?.data_type
            if (
                field_type_en &&
                groupDate.includes(field_type_en as FieldTypes)
            ) {
                return true
            }
        }
        return false
    }

    return (
        <div className={styles.indicatorFormulaWrap}>
            <ConfigHeader
                node={node}
                formulaItem={formulaItem}
                loading={loading}
                dragExpand={dragExpand}
                onChangeExpand={onChangeExpand}
                onClose={() => onClose(false)}
                onSure={() => handleSave()}
            />
            {loading ? (
                <Spin className={styles.ldWrap} />
            ) : (
                <div className={styles.if_contentWrap}>
                    {!formulaItem?.errorMsg ||
                    configErrorList.includes(formulaItem?.errorMsg) ? (
                        <Form layout="vertical" form={form} autoComplete="off">
                            <Form.Item
                                label={__('度量')}
                                required
                                style={{ marginBottom: 0 }}
                            >
                                <Row>
                                    <Form.Item
                                        style={{
                                            width: '32%',
                                            maxWidth: 560,
                                            minWidth: 400,
                                            marginRight: 16,
                                        }}
                                    >
                                        <Space.Compact
                                            block
                                            style={{ height: 32 }}
                                        >
                                            <div className={styles.measureName}>
                                                {__('度量名称')}
                                            </div>
                                            <Form.Item
                                                name="name"
                                                validateTrigger={[
                                                    'onChange',
                                                    'onBlur',
                                                ]}
                                                style={{
                                                    flex: 1,
                                                }}
                                                rules={[
                                                    {
                                                        required: true,
                                                        validator: (_, value) =>
                                                            validateMeasureName(
                                                                value,
                                                            ),
                                                    },
                                                ]}
                                            >
                                                <Input
                                                    placeholder={__(
                                                        '请输入度量名称',
                                                    )}
                                                    allowClear
                                                    maxLength={20}
                                                />
                                            </Form.Item>
                                        </Space.Compact>
                                    </Form.Item>
                                    <Space.Compact
                                        style={{
                                            width: '32%',
                                            maxWidth: 560,
                                            minWidth: 400,
                                        }}
                                    >
                                        <Form.Item
                                            style={{ width: '70%' }}
                                            name="measure_field"
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        __('请选择字段名称'),
                                                },
                                            ]}
                                        >
                                            <Select
                                                placeholder={__(
                                                    '请选择字段名称',
                                                )}
                                                allowClear
                                                showSearch
                                                filterOption={(
                                                    inputValue,
                                                    option,
                                                ) =>
                                                    filterField(
                                                        inputValue,
                                                        option,
                                                    )
                                                }
                                                options={fieldOptions}
                                                onChange={
                                                    handleChangeMeasureField
                                                }
                                                notFoundContent={tipLabel(
                                                    __(
                                                        '抱歉，没有找到相关内容',
                                                    ),
                                                )}
                                            />
                                        </Form.Item>
                                        <Form.Item
                                            name="aggregate"
                                            style={{ width: '30%' }}
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        __('请选择聚合方式'),
                                                },
                                            ]}
                                        >
                                            <Select
                                                onChange={(val) =>
                                                    setIsDisabledGroup(
                                                        disabledGroupSelectLimits.includes(
                                                            val,
                                                        ) &&
                                                            selectedDesensitizationField,
                                                    )
                                                }
                                                placeholder={__('聚合方式')}
                                                options={wayOptions}
                                                notFoundContent={tipLabel(
                                                    __('请先选择字段'),
                                                )}
                                            />
                                        </Form.Item>
                                    </Space.Compact>
                                </Row>
                            </Form.Item>
                            <Form.Item
                                label={__('分组')}
                                style={{ marginBottom: 0, height: 30 }}
                            >
                                <Row>
                                    <Form.List
                                        name="group"
                                        initialValue={[
                                            { field: undefined },
                                            { field: undefined },
                                        ]}
                                    >
                                        {(fields, { add, remove }) => {
                                            return (
                                                <>
                                                    {fields.map(
                                                        (item, index) => {
                                                            const {
                                                                key,
                                                                name,
                                                                ...restField
                                                            } = item
                                                            const groupValue =
                                                                form.getFieldValue(
                                                                    'group',
                                                                )
                                                            const itemValue =
                                                                groupValue?.[
                                                                    index
                                                                ]
                                                            const fieldsValue =
                                                                itemValue?.field
                                                            const showFormat =
                                                                checkGroupFieldShow(
                                                                    fieldsValue,
                                                                )
                                                            return (
                                                                <div
                                                                    key={key}
                                                                    className={
                                                                        styles.groupItem
                                                                    }
                                                                    style={{
                                                                        marginRight:
                                                                            index ===
                                                                            0
                                                                                ? 16
                                                                                : 0,
                                                                    }}
                                                                >
                                                                    <Space.Compact
                                                                        block
                                                                    >
                                                                        <Tooltip
                                                                            title={
                                                                                isDisabledGroup
                                                                                    ? __(
                                                                                          '当前字段数据受脱敏管控，不能使用分组求和',
                                                                                      )
                                                                                    : ''
                                                                            }
                                                                            color="#fff"
                                                                            overlayInnerStyle={{
                                                                                color: 'rgba(0,0,0,0.85)',
                                                                            }}
                                                                            overlayStyle={{
                                                                                maxWidth: 300,
                                                                            }}
                                                                            placement="bottom"
                                                                        >
                                                                            <Form.Item
                                                                                {...restField}
                                                                                name={[
                                                                                    name,
                                                                                    'field',
                                                                                ]}
                                                                                style={{
                                                                                    width: showFormat
                                                                                        ? '70%'
                                                                                        : '100%',
                                                                                }}
                                                                            >
                                                                                {/*  */}
                                                                                <Select
                                                                                    disabled={
                                                                                        isDisabledGroup
                                                                                    }
                                                                                    placeholder={__(
                                                                                        '请选择分组字段',
                                                                                    )}
                                                                                    showSearch
                                                                                    filterOption={(
                                                                                        inputValue,
                                                                                        option,
                                                                                    ) =>
                                                                                        filterField(
                                                                                            inputValue,
                                                                                            option,
                                                                                        )
                                                                                    }
                                                                                    getPopupContainer={(
                                                                                        n,
                                                                                    ) =>
                                                                                        n
                                                                                    }
                                                                                    className={
                                                                                        styles.groupFieldSelect
                                                                                    }
                                                                                    options={fieldOptions
                                                                                        ?.map(
                                                                                            (
                                                                                                info,
                                                                                            ) => {
                                                                                                const fieldId =
                                                                                                    info.value?.split(
                                                                                                        '_',
                                                                                                    )?.[0]
                                                                                                const disabled =
                                                                                                    policyFieldsInfo?.fields
                                                                                                        ?.map(
                                                                                                            (
                                                                                                                o,
                                                                                                            ) =>
                                                                                                                o.id,
                                                                                                        )
                                                                                                        ?.includes(
                                                                                                            fieldId,
                                                                                                        ) ||
                                                                                                    false
                                                                                                return {
                                                                                                    ...info,
                                                                                                    disabled,
                                                                                                    label: fieldLabel(
                                                                                                        info?.data_type ||
                                                                                                            fieldsData.data.find(
                                                                                                                (
                                                                                                                    a,
                                                                                                                ) =>
                                                                                                                    a.id ===
                                                                                                                    info.id,
                                                                                                            )
                                                                                                                ?.data_type,
                                                                                                        info.alias,
                                                                                                        false,
                                                                                                        disabled
                                                                                                            ? __(
                                                                                                                  '当前字段数据受脱敏管控，不能作为分组依据',
                                                                                                              )
                                                                                                            : '',
                                                                                                    ),
                                                                                                }
                                                                                            },
                                                                                        )
                                                                                        .filter(
                                                                                            (
                                                                                                info,
                                                                                            ) =>
                                                                                                !groupValue.find(
                                                                                                    (
                                                                                                        a,
                                                                                                        idx,
                                                                                                    ) =>
                                                                                                        idx !==
                                                                                                            index &&
                                                                                                        a?.field ===
                                                                                                            info.value,
                                                                                                ),
                                                                                        )}
                                                                                    onChange={(
                                                                                        value,
                                                                                    ) =>
                                                                                        handleChangeGroupField(
                                                                                            value,
                                                                                            index,
                                                                                        )
                                                                                    }
                                                                                    allowClear
                                                                                />
                                                                            </Form.Item>
                                                                        </Tooltip>
                                                                        {showFormat && (
                                                                            <Form.Item
                                                                                style={{
                                                                                    width: '30%',
                                                                                }}
                                                                                name={[
                                                                                    name,
                                                                                    'format',
                                                                                ]}
                                                                                rules={[
                                                                                    {
                                                                                        required:
                                                                                            fieldsValue,
                                                                                        message:
                                                                                            __(
                                                                                                '请选择',
                                                                                            ),
                                                                                    },
                                                                                ]}
                                                                            >
                                                                                <Select
                                                                                    placeholder={__(
                                                                                        '请选择',
                                                                                    )}
                                                                                    options={
                                                                                        groupOptions
                                                                                    }
                                                                                />
                                                                            </Form.Item>
                                                                        )}
                                                                    </Space.Compact>
                                                                    {/* <DeleteOutLined
                                                                className={classnames(
                                                                    styles.itemDelete,
                                                                    !fieldsValue &&
                                                                        index ===
                                                                            0 &&
                                                                        styles.itemDeleteDisabled,
                                                                )}
                                                                onClick={() => {
                                                                    if (
                                                                        fields.length ===
                                                                        1
                                                                    ) {
                                                                        form.resetFields(
                                                                            [
                                                                                'group',
                                                                            ],
                                                                        )
                                                                    } else {
                                                                        remove(
                                                                            name,
                                                                        )
                                                                    }
                                                                }}
                                                            /> */}
                                                                </div>
                                                            )
                                                        },
                                                    )}
                                                    {/* <div
                                                    hidden={fields.length >= 2}
                                                >
                                                    <Button
                                                        type="link"
                                                        onClick={() =>
                                                            add({
                                                                field: undefined,
                                                            })
                                                        }
                                                        icon={<AddOutlined />}
                                                    >
                                                        {__('新增分组')}
                                                    </Button>
                                                </div> */}
                                                </>
                                            )
                                        }}
                                    </Form.List>
                                </Row>
                            </Form.Item>
                        </Form>
                    ) : (
                        dataEmptyView(formulaItem?.errorMsg, formulaItem?.type)
                    )}
                </div>
            )}
        </div>
    )
}

export default IndicatorFormula
