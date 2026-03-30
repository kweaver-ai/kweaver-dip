import { useEffect, useState, useMemo, ReactNode, useRef } from 'react'
import { Form, message, Select, Spin } from 'antd'
import { get, find, omit, isEqualWith } from 'lodash'
import styles from './styles.module.less'
import __ from '../locale'
import { checkCalculateFormulaConfig } from '../helper'
import { IFormulaFields, formatError } from '@/core'
import { getSql } from '@/core/apis/indicatorManagement'
import {
    FieldTypes,
    ConfigType,
    FormulaType,
    funcOptions,
    configErrorList,
} from '../const'
import {
    dataEmptyView,
    IFormulaConfigEl,
    getFieldOptions,
    validateFields,
} from './helper'
import ConfigHeader from './ConfigHeader'
import SqlEditor, { InsPosType, SqlEditorType } from './SqlEditor'
import { sensitivityFieldLimits } from '@/components/SceneAnalysis/const'
import ConfigMode from './ConfigMode'

interface FuncOptType {
    value: string
    label: string | ReactNode
    showTypes: FieldTypes[]
    label_is_protected?: boolean
}
const CalculateFormula = ({
    visible,
    graph,
    node,
    formulaData,
    fieldsData,
    viewSize = 0,
    dragExpand,
    onChangeExpand,
    onClose,
    onOperate,
}: IFormulaConfigEl) => {
    const sqlRef = useRef<any>()
    const [form] = Form.useForm()
    const isSelected = !!Form.useWatch('fieldId', form)
    const [loading, setLoading] = useState<boolean>(false)
    const [sureLoading, setSureLoading] = useState<boolean>(false)
    // 当前的算子信息
    const [formulaItem, setFormulaItem] = useState<any>()
    // 前序节点数据
    const [preNodeData, setPreNodeData] = useState<IFormulaFields[]>([])
    // 字段选项
    const [fieldOptions, setFieldOptions] = useState<any>([])
    const [policyFieldsInfo, setPolicyFieldsInfo] = useState<any>()
    // 配置方式
    const [type, setType] = useState<ConfigType>(ConfigType.SQL)
    // 函数function
    const [filterFuncOptions, setFilterFuncOptions] = useState<FuncOptType[]>(
        [],
    )
    // 不可编辑部分
    const [uneditableValues, setUneditableValues] = useState<string[]>([])
    // 映射字段
    const [mapFields, setMapFields] = useState<any[]>([])
    // sql信息
    const [sqlStr, setSqlStr] = useState<any>({})
    useEffect(() => {
        if (visible && formulaData && graph && node) {
            checkData()
        }
    }, [visible, formulaData])
    const isSql = useMemo(() => type === ConfigType.SQL, [type])

    // Sql验证
    const validateSql = async () => {
        if (type === ConfigType.SQL) {
            setSureLoading(true)
            const res = await sqlRef.current?.validateSyntax()
            setSureLoading(false)
            return res
        }
        return true
    }

    // 保存节点配置
    const handleSave = async () => {
        const validate = await validateSql()
        if (!validate) return
        if (!node) {
            message.error('节点数据异常')
            return
        }
        try {
            let policyFieldsValidate = false
            let aggregate: string = ''
            const { formula } = node!.data
            let o: any = {}

            if (type === ConfigType.VIEW) {
                await form.validateFields()
                const values = form.getFieldsValue()
                const { fieldId } = values
                aggregate = values.aggregate
                o = {
                    measure: {
                        aggregate,
                        field: omit(find(fieldOptions, ['value', fieldId]), [
                            'value',
                            'label',
                        ]),
                    },
                }
                policyFieldsValidate =
                    policyFieldsInfo?.fields
                        ?.map((item) => item.id)
                        ?.includes(fieldId) &&
                    sensitivityFieldLimits.includes(aggregate)
            } else {
                o = {
                    sql_info: {
                        sql_str: sqlStr.formatValue,
                        origin_sql_str: sqlStr.value,
                        field_val_rel: mapFields,
                        fields: preNodeData,
                    },
                }
            }
            if (policyFieldsValidate) {
                form.setFields([
                    {
                        name: 'aggregate',
                        errors: [
                            __(
                                '当前字段数据受脱敏管控，聚合方式不能选择${text}，请重新选择',
                                {
                                    text: funcOptions?.find(
                                        (i) => i.value === aggregate,
                                    )?.label,
                                },
                            ),
                        ],
                    },
                ])
                return
            }

            const isNodeChange = !!(
                formulaItem?.config &&
                (type !== formulaItem?.config?.sub_type ||
                    !isEqualWith(o?.sql_info, formulaItem?.config?.sql_info) ||
                    !isEqualWith(o?.measure, formulaItem?.config?.measure))
            )
            onOperate?.(FormulaType.INDICATOR_MEASURE, isNodeChange)

            node!.replaceData({
                ...node?.data,
                formula: formula.map((info) => {
                    if (info.id === formulaItem?.id) {
                        const tempFl = info
                        delete tempFl.errorMsg
                        return {
                            ...tempFl,
                            config: {
                                sub_type: type,
                                ...o,
                            },
                            output_fields: preNodeData,
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
    }

    // 检查更新数据
    const checkData = async () => {
        setLoading(true)
        clearData()
        const { preOutData, firstNodeData, secondNodeData, policyFieldInfos } =
            await checkCalculateFormulaConfig(
                graph!,
                node!,
                formulaData!,
                fieldsData,
            )
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
        setPolicyFieldsInfo(policyFieldInfos)
        setPreNodeData(preOutData)
        const options = getFieldOptions(preOutData, fieldsData)
        setFieldOptions(
            options?.map((item) => ({
                ...item,
                isPolicy: policyFieldInfos?.fields
                    ?.map((o) => o.id)
                    ?.includes(item.id),
            })),
        )
        const currentField = fieldsData.data.find(
            (item) => item.id === config?.measure?.field.id,
        )
        const isChangedDataType =
            currentField?.data_type !== config?.measure?.field.data_type
        if (config) {
            // 防止字段变更id更新导致exec_sql查不到数据  执行数据校验转换
            validateFields(realFormula)
            const t = config.sub_type || ConfigType.SQL
            setType(t)
            switch (t) {
                case ConfigType.SQL:
                    setSqlStr({
                        value: get(config, 'sql_info.origin_sql_str'),
                        formatValue: get(config, 'sql_info.sql_str'),
                    })
                    setMapFields(get(config, 'sql_info.field_val_rel'))
                    break
                case ConfigType.VIEW:
                    setFilterFuncOptions(
                        funcOptions
                            .filter(({ showTypes }) =>
                                showTypes.includes(
                                    get(config, 'measure.field.data_type'),
                                ),
                            )
                            ?.map((item: any) => {
                                const disabled =
                                    (policyFieldInfos?.fields
                                        ?.map((o) => o.id)
                                        ?.includes(currentField?.id) &&
                                        sensitivityFieldLimits.includes(
                                            item.value,
                                        )) ||
                                    item.label_is_protected
                                return {
                                    ...item,
                                    disabled,
                                    title: disabled
                                        ? `${
                                              item.label_is_protected
                                                  ? __(
                                                        '当前字段数据密级管控，不能进行度量计算，也不能作为分析维度查询其他数据',
                                                    )
                                                  : __(
                                                        '当前字段数据受脱敏管控，不能查询',
                                                    )
                                          }${item.label}`
                                        : item.label,
                                }
                            }),
                    )
                    form.setFieldsValue({
                        fieldId: get(config, 'measure.field.id'),
                        aggregate: isChangedDataType
                            ? undefined
                            : get(config, 'measure.aggregate'),
                    })
                    if (isChangedDataType) {
                        setTimeout(() => {
                            form.setFields([
                                {
                                    name: ['fieldId'],
                                    errors:
                                        currentField?.data_type === 'time'
                                            ? [
                                                  __(
                                                      '当前不支持选择此类型的字段，请重新选择',
                                                  ),
                                              ]
                                            : [__('字段类型变更')],
                                },
                            ])
                        }, 1000)
                    }
                    break
                default:
                    break
            }
        }
        try {
            // 获取sql
            const { id } = secondNodeData
            if (id) {
                const canvas = [firstNodeData]
                const formula = secondNodeData.formula.filter(
                    (item) => item.type !== FormulaType.INDICATOR_MEASURE,
                )
                if (formula.length) {
                    canvas.push({
                        ...secondNodeData,
                        formula,
                    })
                }
                const res = await getSql({
                    id,
                    type: 'indicator',
                    canvas,
                })
                const resStr =
                    res.exec_sql?.replace(/\s+(From|from)\s+/, ' FROM ') || ''
                const idx = resStr.indexOf(' FROM ')

                // 截取from后数据
                const fromSqlStr = resStr.slice(idx).trim()

                setUneditableValues(['SELECT', ` ${fromSqlStr} `])
            }
        } catch (err) {
            formatError(err)
        }
        setTimeout(() => {
            setLoading(false)
        }, 400)
    }
    /**
     * 配置方式切换
     */
    const handleRadioChange = (e) => {
        setType(e.target.value)
    }
    const handleMapChange = (v) => {
        const isExist = mapFields.some(
            ({ dynamic_field, fieldId }) =>
                v.fieldId === fieldId && v.dynamic_field === dynamic_field,
        )
        if (!isExist) setMapFields([...mapFields, v])
    }
    const handleEditorChange = (value, formatValue) => {
        setSqlStr({ value, formatValue })
    }
    // 字段变化
    const handleFieldChange = (v) => {
        let opts: FuncOptType[] = []
        let aggregate
        if (v) {
            const { data_type } = find(fieldOptions, ['value', v])
            opts = funcOptions.filter(({ showTypes }) =>
                showTypes.includes(data_type),
            )
            switch (data_type) {
                case FieldTypes.INT:
                case FieldTypes.FLOAT:
                case FieldTypes.DECIMAL:
                case FieldTypes.NUMBER:
                    aggregate = 'SUM'
                    break
                case FieldTypes.CHAR:
                case FieldTypes.DATE:
                    aggregate = 'COUNT(DISTINCT)'
                    break
                case FieldTypes.DATETIME:
                case FieldTypes.BOOL:
                    aggregate = 'COUNT'
                    break
                default:
                    break
            }
        }
        setFilterFuncOptions(
            opts?.map((item) => {
                const disabled =
                    (policyFieldsInfo?.fields?.map((o) => o.id)?.includes(v) &&
                        sensitivityFieldLimits.includes(item.value)) ||
                    item.label_is_protected
                return {
                    ...item,
                    disabled,
                    title: disabled
                        ? `${
                              item.label_is_protected
                                  ? __(
                                        '当前字段数据密级管控，不能进行度量计算，也不能作为分析维度查询其他数据',
                                    )
                                  : __('当前字段数据受脱敏管控，不能查询')
                          }${item.label}`
                        : item.label,
                }
            }),
        )
        // form.setFieldValue('aggregate', aggregate)
        form.setFields([
            {
                name: 'aggregate',
                value: aggregate,
                errors: undefined,
            },
        ])
    }

    return (
        <div className={styles.calculateFormulaWrap}>
            <ConfigHeader
                node={node}
                formulaItem={formulaItem}
                loading={loading || sureLoading}
                dragExpand={dragExpand}
                onChangeExpand={onChangeExpand}
                onClose={() => onClose(false)}
                onSure={() => handleSave()}
            />

            {loading ? (
                <Spin className={styles.ldWrap} />
            ) : (
                <div className={styles.cf_contentWrap}>
                    {!formulaItem?.errorMsg ||
                    configErrorList.includes(formulaItem?.errorMsg) ? (
                        <>
                            <ConfigMode
                                value={type}
                                formulaType={FormulaType.INDICATOR_MEASURE}
                                onChange={handleRadioChange}
                            />
                            <Form
                                layout="inline"
                                form={form}
                                autoComplete="off"
                                style={{
                                    height: '100%',
                                    paddingLeft: 20,
                                }}
                                hidden={isSql}
                            >
                                <Form.Item
                                    style={{ width: 360 }}
                                    name="fieldId"
                                    rules={[
                                        {
                                            required: true,
                                            message: __('请选择字段'),
                                        },
                                    ]}
                                >
                                    <Select
                                        showSearch
                                        options={fieldOptions}
                                        optionLabelProp="name"
                                        onChange={handleFieldChange}
                                        filterOption={(input, option) =>
                                            (option?.name ?? '')
                                                .toLowerCase()
                                                .includes(
                                                    input.toLowerCase(),
                                                ) ||
                                            (option?.name_en ?? '')
                                                .toLowerCase()
                                                .includes(input.toLowerCase())
                                        }
                                        placeholder={__('请选择字段')}
                                    />
                                </Form.Item>
                                <Form.Item
                                    style={{ width: 300 }}
                                    name="aggregate"
                                    rules={[
                                        {
                                            required: true,
                                            message: __('请选择聚合函数'),
                                        },
                                    ]}
                                >
                                    <Select
                                        disabled={!isSelected}
                                        options={filterFuncOptions}
                                        placeholder={__('请选择聚合函数')}
                                    />
                                </Form.Item>
                            </Form>
                            <SqlEditor
                                ref={sqlRef}
                                onCancel={() => onClose(false)}
                                onOk={() => handleSave()}
                                nodeName={node?.data?.name}
                                type={SqlEditorType.MEASURE}
                                fieldOptions={fieldOptions}
                                hidden={!isSql}
                                required
                                style={{ height: 'calc(100% - 65px)' }}
                                onChange={handleEditorChange}
                                onMapChange={handleMapChange}
                                value={sqlStr.value}
                                placeholder={__('请输入原子指标度量聚合SQL')}
                                uneditableValues={uneditableValues}
                                insertPosition={InsPosType.MIDDLE}
                            />
                        </>
                    ) : (
                        dataEmptyView(formulaItem?.errorMsg)
                    )}
                </div>
            )}
        </div>
    )
}

export default CalculateFormula
