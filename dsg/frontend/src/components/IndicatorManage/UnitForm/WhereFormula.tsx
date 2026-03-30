import { useEffect, useState, useMemo, useRef } from 'react'
import { Form, message, Spin } from 'antd'
import moment from 'moment'
import { get, isEqualWith } from 'lodash'
import styles from './styles.module.less'
import __ from '../locale'
import { checkWhereFormulaConfig } from '../helper'
import { IFormulaFields, formatError } from '@/core'
import { getSql } from '@/core/apis/indicatorManagement'
import { ConfigType, configErrorList, FormulaType } from '../const'
import {
    dataEmptyView,
    IFormulaConfigEl,
    fieldLabel,
    validateFields,
} from './helper'
import ConfigHeader from './ConfigHeader'
import ConfigMode from './ConfigMode'
import FieldRelationFormList, {
    getRelationValue,
} from './FieldRelationFormList'
import SqlEditor, { SqlEditorType, InsPosType } from './SqlEditor'
import { DATA_TYPE_MAP } from '@/utils'

interface SqlStrType {
    value: string
    formatValue: string
}

const WhereFormula = ({
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
    const businessRef = useRef<any>()
    const sqlRef = useRef<any>()
    const [form] = Form.useForm()
    const [loading, setLoading] = useState<boolean>(false)
    const [sureLoading, setSureLoading] = useState<boolean>(false)
    // 当前的算子信息
    const [formulaItem, setFormulaItem] = useState<any>()
    // 前序节点数据
    const [preNodeData, setPreNodeData] = useState<IFormulaFields[]>([])
    // 字段选项
    const [fieldOptions, setFieldOptions] = useState<any>([])
    // 组间条件
    const [whereRelation, setWhereRelation] = useState<string>('and')
    // 配置方式
    const [type, setType] = useState<ConfigType>(ConfigType.SQL)
    // sql信息
    const [sqlStr, setSqlStr] = useState<SqlStrType>({
        value: '',
        formatValue: '',
    })
    // 不可编辑部分
    const [uneditableValues, setUneditableValues] = useState<string[]>([])
    // 映射字段
    const [mapFields, setMapFields] = useState<any[]>([])
    const isSql = useMemo(() => type === ConfigType.SQL, [type])
    useEffect(() => {
        if (visible && formulaData && graph && node) {
            checkData()
        }
    }, [visible, formulaData])

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
            let whereValue: any[] = []
            const { formula } = node!.data
            if (type === ConfigType.VIEW) {
                await form.validateFields()
                const values = form.getFieldsValue()
                const { where } = values
                whereValue = where.map((a) => {
                    const { member } = a
                    return {
                        ...a,
                        member: member.map((b) => {
                            const { field, value } = b
                            const fieldValue = preNodeData.find((c) => {
                                const ids = field.split('_')
                                return c.id === ids[0] && c.sourceId === ids[1]
                            })
                            let realValue = value
                            if (typeof value === 'object') {
                                if (Array.isArray(value)) {
                                    realValue = value.join(',')
                                } else {
                                    const { dateNumber, unit, date } = value
                                    if (date) {
                                        realValue = date
                                            .map((c) =>
                                                moment(c).format(
                                                    'YYYY-MM-DD HH:mm:ss',
                                                ),
                                            )
                                            .join(',')
                                    } else {
                                        realValue = `${dateNumber} ${unit}`
                                    }
                                }
                            }
                            return {
                                ...b,
                                field: fieldValue,
                                value: realValue,
                            }
                        }),
                    }
                })
            } else {
                whereValue = [
                    {
                        sql_info: {
                            sql_str: sqlStr.formatValue,
                            origin_sql_str: sqlStr.value,
                            field_val_rel: mapFields,
                            fields: preNodeData,
                        },
                    },
                ]
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
                                sub_type: type,
                                where: whereValue,
                                where_relation:
                                    whereValue.length > 1
                                        ? whereRelation
                                        : 'and',
                            },
                            output_fields: preNodeData,
                        }
                    }
                    return info
                }),
            })

            const isNodeChange = !!(
                formulaItem?.config &&
                (type !== formulaItem?.config?.sub_type ||
                    !isEqualWith(whereValue, formulaItem?.config?.where) ||
                    (whereValue.length > 1 ? whereRelation : 'and') !==
                        formulaItem?.config?.where_relation)
            )
            onOperate?.(FormulaType.WHERE, isNodeChange)

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
        setWhereRelation('and')
    }

    // 检查更新数据
    const checkData = async () => {
        setLoading(true)
        clearData()
        const { preOutData, firstNodeData } = checkWhereFormulaConfig(
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

        setPreNodeData(preOutData)
        const options = preOutData.map((info) => {
            const originData =
                fieldsData.data.find(
                    (a) =>
                        a?.technical_name === info?.name_en || a.id === info.id,
                ) || {}
            const disabled =
                DATA_TYPE_MAP.time.includes(originData.data_type) ||
                originData?.label_is_protected
            return {
                value: `${info.id}_${info.sourceId}`,
                label: fieldLabel(
                    fieldsData.dataType.length > 0 &&
                        fieldsData.dataType.find((it) => {
                            return (
                                it.value_en ===
                                (info?.data_type ||
                                    fieldsData.data.find(
                                        (a) =>
                                            a?.technical_name ===
                                                info?.name_en ||
                                            a.id === info.id,
                                    )?.data_type)
                            )
                        })?.value,
                    info.alias,
                ),
                id: info.id,
                name: info.alias,
                name_en: originData.name_en,
                data_type: originData.data_type,
                disabled,
                label_is_protected: originData?.label_is_protected,
            }
        })
        setFieldOptions(options)
        if (config) {
            // 防止字段变更id更新导致exec_sql查不到数据  执行数据校验转换
            validateFields(realFormula)
            const { where, where_relation, sub_type } = config
            const t = sub_type || ConfigType.SQL
            let whereValue
            setType(t)
            switch (t) {
                case ConfigType.SQL:
                    setSqlStr({
                        value: get(where, '[0].sql_info.origin_sql_str'),
                        formatValue: get(where, '[0].sql_info.sql_str'),
                    })
                    setMapFields(get(where, '[0].sql_info.field_val_rel'))
                    break
                case ConfigType.VIEW:
                    setWhereRelation(where_relation || 'and')
                    whereValue = getRelationValue(
                        form,
                        'where',
                        where,
                        preOutData,
                        fieldsData,
                        businessRef.current,
                        false,
                    )
                    form.setFieldValue('where', whereValue)
                    setTimeout(() => {
                        getRelationValue(
                            form,
                            'where',
                            where,
                            preOutData,
                            fieldsData,
                            businessRef.current,
                            true,
                        )
                    }, 550)
                    break
                default:
                    break
            }
        }

        try {
            // // 获取数据表信息
            // const { formula } = firstNodeData

            // const viewItem = formula?.[0]?.config?.other.catalogOptions

            // const tablePath = `${viewItem?.view_source_catalog_name}.${viewItem?.technical_name}`

            // if (viewItem) {
            //     const str = options
            //         .map(({ name_en }) => `"${name_en}"`)
            //         .join(',')

            //     setUneditableValues([`SELECT ${str} FROM ${tablePath} WHERE`])
            // }

            // 获取sql
            const { id } = firstNodeData
            if (id) {
                const res = await getSql({
                    id,
                    type: 'indicator',
                    canvas: [firstNodeData],
                })

                // const str = options
                //     .map(({ name_en }) => `"${name_en}"`)
                //     .join(',')
                setUneditableValues([`${res.exec_sql} WHERE`])
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

    return (
        <div className={styles.whereFormulaWrap}>
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
                <div className={styles.wf_contentWrap}>
                    {!formulaItem?.errorMsg ||
                    configErrorList.includes(formulaItem?.errorMsg) ? (
                        <>
                            <ConfigMode
                                value={type}
                                onChange={handleRadioChange}
                                formulaType={FormulaType.WHERE}
                            />
                            <Form
                                layout="vertical"
                                form={form}
                                autoComplete="off"
                                style={{
                                    height: '100%',
                                }}
                                hidden={isSql}
                            >
                                <FieldRelationFormList
                                    initialValue={[
                                        {
                                            relation: '',
                                            member: [
                                                {
                                                    field: undefined,
                                                },
                                            ],
                                        },
                                    ]}
                                    required
                                    ref={businessRef}
                                    formListName="where"
                                    addButtonText={__('新增过滤')}
                                    form={form}
                                    fieldOptions={fieldOptions}
                                    fieldsData={fieldsData}
                                    preNodeData={preNodeData}
                                    relationValue={whereRelation}
                                    onRelationChange={(val) =>
                                        setWhereRelation(val)
                                    }
                                />
                            </Form>
                            <SqlEditor
                                ref={sqlRef}
                                onCancel={() => onClose(false)}
                                onOk={() => handleSave()}
                                nodeName={node?.data?.name}
                                type={SqlEditorType.FILTER}
                                fieldOptions={fieldOptions}
                                hidden={!isSql}
                                required
                                style={{ height: 'calc(100% - 65px)' }}
                                onChange={handleEditorChange}
                                onMapChange={handleMapChange}
                                value={sqlStr.value}
                                placeholder={__('请输入数据过滤SQL')}
                                uneditableValues={uneditableValues}
                                insertPosition={InsPosType.BOTTOM}
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

export default WhereFormula
