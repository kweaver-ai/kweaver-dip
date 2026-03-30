import { useEffect, useState, useMemo, useRef } from 'react'
import { Form, message, Spin } from 'antd'
import moment from 'moment'
import { get, isEqualWith } from 'lodash'
import styles from './styles.module.less'
import __ from '../locale'
import { checkDeWhereFormulaConfig } from '../helper'
import { IFormula, IFormulaFields, formatError } from '@/core'
import { getSql } from '@/core/apis/indicatorManagement'
import {
    ConfigType,
    FormulaType,
    configErrorList,
    IndicatorType,
} from '../const'
import {
    dataEmptyView,
    IFormulaConfigEl,
    getFilterFieldOptions,
    getSelectFieldOptions,
    validateFields,
} from './helper'
import ConfigHeader from './ConfigHeader'
import ConfigMode from './ConfigMode'
import SqlEditor, { InsPosType, SqlEditorType } from './SqlEditor'
import FieldRelationFormList, {
    getRelationValue,
} from './FieldRelationFormList'

const DeWhereFormula = ({
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
    const dateRef = useRef<any>()
    const sqlRef = useRef<any>()
    const [form] = Form.useForm()
    const [loading, setLoading] = useState<boolean>(false)
    const [sureLoading, setSureLoading] = useState<boolean>(false)
    // 当前的算子信息
    const [formulaItem, setFormulaItem] = useState<IFormula>()
    // 前序节点数据
    const [preNodeData, setPreNodeData] = useState<IFormulaFields[]>([])
    // 字段选项  Sql模式
    const [sqlOptions, setSqlOptions] = useState<any>([])
    // 字段选项  业务限定
    const [fieldOptions, setFieldOptions] = useState<any>([])
    // 字段选项 时间限定
    const [dateFieldOptions, setDateFieldOptions] = useState<any>([])
    // 组间条件
    const [whereRelation, setWhereRelation] = useState<string>('and')
    // 组间条件
    const [dateWhereRelation, setDateWhereRelation] = useState<string>('and')
    // 配置方式
    const [type, setType] = useState<ConfigType>(ConfigType.SQL)
    // 配置方式
    const [atomNodeId, setAtomNodeId] = useState<string>('')
    // sql信息
    // sql信息
    const [sqlStr, setSqlStr] = useState<any>({})
    // 不可编辑部分
    const [uneditableValues, setUneditableValues] = useState<string[]>([])
    // 映射字段
    const [mapFields, setMapFields] = useState<any[]>([])
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
            let o: any = {}
            const { formula } = node!.data
            if (type === ConfigType.VIEW) {
                await form.validateFields()
                const values = form.getFieldsValue()
                const { where, date_where } = values

                if (!where?.length && !date_where?.length) {
                    form.setFields([
                        {
                            name: 'where',
                            errors: [__('“时间限定”或“业务限定”必填一项')],
                        },
                        {
                            name: 'date_where',
                            errors: [__('“时间限定”或“业务限定”必填一项')],
                        },
                    ])
                    return
                }
                o = {
                    where: getValue(where),
                    date_where: getValue(date_where),
                    date_where_relation: dateWhereRelation,
                }
            } else {
                o = {
                    where: [
                        {
                            sql_info: {
                                sql_str: sqlStr.formatValue,
                                origin_sql_str: sqlStr.value,
                                field_val_rel: mapFields,
                                fields: preNodeData,
                            },
                        },
                    ],
                }
            }

            const isNodeChange = !!(
                (formulaItem?.config &&
                    (type !== formulaItem?.config?.sub_type ||
                        !isEqualWith(o?.where, formulaItem?.config?.where) ||
                        whereRelation !==
                            formulaItem?.config?.where_relation)) ||
                !isEqualWith(o?.date_where, formulaItem?.config?.date_where) ||
                !isEqualWith(
                    o?.date_where_relation,
                    formulaItem?.config?.date_where_relation,
                )
            )
            onOperate?.(FormulaType.WHERE, isNodeChange)

            node!.replaceData({
                ...node?.data,
                formula: formula.map((info) => {
                    if (info.id === formulaItem?.id) {
                        const tempFl = info
                        delete tempFl.errorMsg
                        return {
                            ...tempFl,
                            config: {
                                indicator_type: IndicatorType.DERIVED,
                                sub_type: type,
                                where_relation: whereRelation,
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
    const getValue = (where) => {
        return where?.map((a) => {
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
                                        moment(c).format('YYYY-MM-DD HH:mm:ss'),
                                    )
                                    .join(',')
                            } else {
                                realValue = `${dateNumber} ${unit}`
                            }
                        }
                    }
                    return {
                        ...b,
                        field: { ...fieldValue, source_node_id: atomNodeId },
                        value: realValue,
                    }
                }),
            }
        })
    }

    const clearData = () => {
        form.resetFields()
        setPreNodeData([])
        setFormulaItem(undefined)
        setSqlOptions([])
        setFieldOptions([])
        setDateFieldOptions([])
        setWhereRelation('and')
        setDateWhereRelation('and')
    }

    // 检查更新数据
    const checkData = async () => {
        setLoading(true)
        clearData()
        const { preOutData, firstNodeData } = checkDeWhereFormulaConfig(
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
        setAtomNodeId(firstNodeData.id)
        const options = getSelectFieldOptions(preOutData, fieldsData)
        setSqlOptions(options)
        setFieldOptions(getFilterFieldOptions(options, 3, false))
        setDateFieldOptions(getFilterFieldOptions(options, 3, true))
        if (config) {
            // 防止字段变更id更新导致exec_sql查不到数据  执行数据校验转换
            validateFields(realFormula)
            const {
                where,
                where_relation,
                date_where,
                date_where_relation,
                sub_type,
            } = config
            const t = sub_type || ConfigType.SQL
            let whereValue
            let dateWhereValue
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
                    setDateWhereRelation(date_where_relation || 'and')
                    whereValue = getRelationValue(
                        form,
                        'where',
                        where,
                        preOutData,
                        fieldsData,
                        businessRef.current,
                        true,
                    )
                    dateWhereValue = getRelationValue(
                        form,
                        'date_where',
                        date_where,
                        preOutData,
                        fieldsData,
                        dateRef.current,
                    )
                    form.setFieldsValue({
                        where: whereValue,
                        date_where: dateWhereValue,
                    })
                    break
                default:
                    break
            }
        }
        try {
            // 获取sql
            const { id } = firstNodeData
            if (id) {
                const res = await getSql({
                    id,
                    type: 'indicator',
                    canvas: [firstNodeData],
                })
                const resStr =
                    res.exec_sql?.replace(/\s+(Where|where)\s+/, ' WHERE ') ||
                    ''
                const conditionKey =
                    resStr.indexOf(' WHERE ') >= 0 ? ' AND ' : ' WHERE '

                setUneditableValues([`${resStr} ${conditionKey} `])
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
        <div className={styles.deWhereFormulaWrap}>
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
                <div className={styles.contentWrap}>
                    {!formulaItem?.errorMsg ||
                    configErrorList.includes(formulaItem?.errorMsg) ? (
                        <>
                            <ConfigMode
                                value={type}
                                onChange={handleRadioChange}
                                formulaType={FormulaType.WHERE}
                            />
                            <Form
                                layout="horizontal"
                                form={form}
                                autoComplete="off"
                                style={{
                                    height: '100%',
                                    paddingLeft: 20,
                                }}
                                hidden={isSql}
                            >
                                <Form.Item label={__('时间限定')}>
                                    <FieldRelationFormList
                                        initialValue={[]}
                                        clearErrorFields={[
                                            'where',
                                            'date_where',
                                        ]}
                                        ref={dateRef}
                                        formListName="date_where"
                                        addButtonText={__('新增限定')}
                                        form={form}
                                        fieldOptions={dateFieldOptions}
                                        fieldsData={fieldsData}
                                        preNodeData={preNodeData}
                                        relationValue={dateWhereRelation}
                                        showChildAdd={false}
                                        onRelationChange={(val) =>
                                            setDateWhereRelation(val)
                                        }
                                    />
                                </Form.Item>
                                <Form.Item label={__('业务限定')}>
                                    <FieldRelationFormList
                                        initialValue={[]}
                                        clearErrorFields={[
                                            'where',
                                            'date_where',
                                        ]}
                                        ref={businessRef}
                                        formListName="where"
                                        addButtonText={__('新增限定')}
                                        form={form}
                                        fieldOptions={fieldOptions}
                                        fieldsData={fieldsData}
                                        preNodeData={preNodeData}
                                        relationValue={whereRelation}
                                        onRelationChange={(val) =>
                                            setWhereRelation(val)
                                        }
                                    />
                                </Form.Item>
                            </Form>
                            <SqlEditor
                                ref={sqlRef}
                                onCancel={() => onClose(false)}
                                onOk={() => handleSave()}
                                nodeName={node?.data?.name}
                                type={SqlEditorType.FILTER}
                                fieldOptions={sqlOptions}
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

export default DeWhereFormula
