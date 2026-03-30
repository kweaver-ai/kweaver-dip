import React, { useEffect, useState, useMemo, useRef, ReactNode } from 'react'
import { Form, Select, Button, Spin, Tooltip, Dropdown } from 'antd'
import { QuestionCircleOutlined, DownOutlined } from '@ant-design/icons'
import { get, find, chain, omit } from 'lodash'
import moment from 'moment'
import styles from './styles.module.less'
import __ from '../locale'
import {
    checkDerivedFormulaConfig,
    getRestrictView,
    replaceSqlStr,
} from '../helper'
import { formatError, IFormula, IFormulaFields } from '@/core'
import {
    FieldTypes,
    FormulaError,
    ConfigType,
    FormulaType,
    updateCycle,
    configErrorList,
} from '../const'
import {
    dataEmptyView,
    IFormulaConfigEl,
    getFieldOptions,
    getFilterFieldOptions,
    getSelectFieldOptions,
    transformField,
    getDerivedViewValue,
} from './helper'
import Icons from '../Icons'
import ConfigHeader from './ConfigHeader'
import AnalysisDimension, { FieldType } from './AnalysisDimension'
import Editor, { getFormatSql } from '../Editor'
import { getSql } from '@/core/apis/indicatorManagement'
import { getPolicyFields } from '@/components/SceneAnalysis/UnitForm/helper'
import FieldRelationFormList, {
    getRelationValue,
} from './FieldRelationFormList'

interface ViewInfoType {
    table_id: string
    business_name: string
}

interface AtomInfoType {
    atomic_indicator_id: string
    atomic_indicator_name: string
}

const DerivedFormula = ({
    visible,
    graph,
    node,
    formulaData,
    fieldsData,
    viewSize = 0,
    dragExpand,
    onChangeExpand,
    onClose,
}: IFormulaConfigEl) => {
    const businessRef = useRef<any>()
    const dateRef = useRef<any>()
    const [form] = Form.useForm()
    const [loading, setLoading] = useState<boolean>(false)
    // 当前的算子信息
    const [formulaItem, setFormulaItem] = useState<IFormula>()
    // 前序节点数据
    const [preNodeData, setPreNodeData] = useState<IFormulaFields[]>([])
    // 维度
    const [dimOptions, setDimOptions] = useState<any>([])
    // 维度选中项
    const [dimValue, setDimValue] = useState<any>([])
    // 日期时间标识
    const [iden, setIden] = useState<FieldType>()
    // sql信息
    const [sqlStr, setSqlStr] = useState<string>('')
    // 表达式
    const [aggregateFn, setAggregateFn] = useState<string>('')
    // 引用库表信息
    const [viewInfo, setViewInfo] = useState<ViewInfoType>({
        table_id: '',
        business_name: '',
    })
    // 原子指标信息
    const [atomInfo, setAtomInfo] = useState<AtomInfoType>({
        atomic_indicator_id: '',
        atomic_indicator_name: '',
    })
    // 过滤算子节点
    const [whereNodeData, setWhereNodeData] = useState<any>({})
    // 组间条件
    const [whereRelation, setWhereRelation] = useState<string>('and')
    // 组间条件
    const [dateWhereRelation, setDateWhereRelation] = useState<string>('and')
    // 字段选项
    const [fieldOptions, setFieldOptions] = useState<any>([])
    // 字段选项
    const [dateFieldOptions, setDateFieldOptions] = useState<any>([])
    // 过滤算子sql模式有业务限定
    const [hasSqlBusiness, setHasSqlBusiness] = useState<boolean>(false)
    // 有业务限定
    const [hasBusiness, setHasBusiness] = useState<boolean>(false)
    // 有条件限定
    const [hasDate, setHasDate] = useState<boolean>(false)
    const [policyFieldsInfo, setPolicyFieldsInfo] = useState<any>()

    useEffect(() => {
        if (visible && formulaData && graph && node) {
            checkData()
        }
    }, [visible, formulaData])

    // 保存节点配置
    const handleSave = async () => {
        try {
            await form.validateFields()
            const { formula } = node!.data
            const values = form.getFieldsValue()
            const { update_cycle } = values
            const {
                sub_type,
                where,
                where_relation,
                date_where,
                date_where_relation,
            } = get(whereNodeData, 'formula[0].config', {})
            const isPolicyFields = dimValue.some((v) =>
                policyFieldsInfo?.fields?.map((o) => o.id)?.includes(v.id),
            )
            if (isPolicyFields) return
            const isSql = sub_type === ConfigType.SQL
            node!.replaceData({
                ...node?.data,
                formula: formula.map((info) => {
                    if (info.id === formulaItem?.id) {
                        const tempFl = info
                        delete tempFl.errorMsg
                        return {
                            ...tempFl,
                            config: {
                                sub_type,
                                atomic_indicator_info: atomInfo,
                                sql_str: sqlStr,
                                analysis_dimension_fields: dimValue.map(
                                    (item) => transformField(item),
                                ),
                                update_cycle,
                                where_info: {
                                    where_relation,
                                    date_where_relation,
                                    where: isSql
                                        ? where
                                        : getValue(where || []),
                                    date_where: isSql
                                        ? date_where
                                        : getValue(date_where || []),
                                },
                                aggregate_fn: aggregateFn,
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
        return where.map((a) => {
            const { member } = a
            return {
                ...a,
                member: member.map((b) => {
                    const { field, value } = b
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
                        field: transformField(field),
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
    }

    // 检查更新数据
    const checkData = async () => {
        setLoading(true)
        clearData()
        const { preOutData, firstNodeData, secondNodeData, policyFieldInfos } =
            await checkDerivedFormulaConfig(
                graph!,
                node!,
                formulaData!,
                fieldsData,
            )
        const realFormula = node!.data.formula.find(
            (info) => info.id === formulaData!.id,
        )
        setFormulaItem(realFormula)
        setPolicyFieldsInfo(policyFieldInfos)
        const { config, errorMsg } = realFormula
        if (errorMsg && !configErrorList.includes(errorMsg)) {
            setTimeout(() => {
                setLoading(false)
            }, 400)
            return
        }
        setPreNodeData(preOutData)
        setWhereNodeData(secondNodeData)

        const atomNodeData = get(
            firstNodeData,
            'formula[0].config.other.catalogOptions',
        )
        const dimensionFields = (atomNodeData.analysis_dimensions || []).map(
            ({ field_id, original_data_type }) => ({
                id: field_id,
            }),
        )
        const options = getFieldOptions(dimensionFields, fieldsData, true)?.map(
            (item) => {
                return {
                    ...item,
                    isPolicy: policyFieldInfos?.fields
                        ?.map((o) => o.id)
                        ?.includes(item.id),
                }
            },
        )
        setDimOptions(options)
        setViewInfo({
            table_id: atomNodeData.refer_view_id,
            business_name: atomNodeData.refer_view_name,
        })
        setAtomInfo({
            atomic_indicator_id: atomNodeData.id,
            atomic_indicator_name: atomNodeData.name,
        })
        const whereOptions = getSelectFieldOptions(preOutData, fieldsData)
        setFieldOptions(getFilterFieldOptions(whereOptions, 3, false))
        setDateFieldOptions(getFilterFieldOptions(whereOptions, 3, true))
        const secConfig = get(secondNodeData, 'formula[0].config')

        if (secConfig) {
            const {
                where,
                where_relation,
                date_where,
                date_where_relation,
                sub_type,
            } = secConfig

            const t = sub_type || ConfigType.SQL
            let whereValue
            let dateWhereValue
            switch (t) {
                case ConfigType.SQL:
                    setHasSqlBusiness(true)
                    setAggregateFn(
                        replaceSqlStr(
                            get(where, '[0].sql_info.origin_sql_str'),
                            '"',
                        ),
                    )
                    break
                case ConfigType.VIEW:
                    setWhereRelation(where_relation || 'and')
                    setDateWhereRelation(date_where_relation || 'and')
                    whereValue = getDerivedViewValue(where || [])
                    setHasBusiness(!!whereValue?.length)
                    dateWhereValue = getDerivedViewValue(date_where || [])
                    setHasDate(!!dateWhereValue?.length)
                    form.setFieldsValue({
                        where: whereValue,
                        date_where: dateWhereValue,
                    })
                    break
                default:
                    break
            }
        }

        let dimOpt = options

        if (config) {
            const { update_cycle, analysis_dimension_fields } = config
            form.setFieldsValue({
                update_cycle,
            })

            const valOptions = analysis_dimension_fields
                .map(({ field_id }) => find(options, ['value', field_id]))
                .filter((o) => o)

            dimOpt = valOptions
        } else {
            dimOpt = options
        }

        const atomFormula = firstNodeData?.formula?.find(
            (o) => o.type === FormulaType.ATOM,
        )
        const atomItem = atomFormula?.config?.other?.catalogOptions

        const date_mark_id = atomItem?.date_mark?.field_id
        if (date_mark_id) {
            const it = find(options, ['value', date_mark_id]) || []
            setIden(it)
            if (it && !dimOpt?.some((o) => o.id === it?.id)) {
                dimOpt.unshift(it)
            }
        }
        setDimValue(dimOpt)
        try {
            // 获取sql
            const id = get(secondNodeData, 'id')
            if (id) {
                const res = await getSql({
                    id,
                    type: 'indicator',
                    canvas: [firstNodeData, secondNodeData],
                })
                setSqlStr(res.exec_sql)
            }
        } catch (err) {
            formatError(err)
        }

        setTimeout(() => {
            setLoading(false)
        }, 400)
    }

    const handleAnyDimChange = (value) => {
        setDimValue(value)
    }

    return (
        <div className={styles.derivedFormulaWrap}>
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
                <div className={styles.contentWrap}>
                    {!formulaItem?.errorMsg ||
                    configErrorList.includes(formulaItem?.errorMsg) ? (
                        <Form
                            layout="horizontal"
                            form={form}
                            autoComplete="off"
                            style={{
                                width: 1172,
                                paddingLeft: 20,
                            }}
                            labelAlign="left"
                        >
                            <Form.Item
                                label={__('更新周期')}
                                name="update_cycle"
                                rules={[{ required: true }]}
                            >
                                <Select
                                    style={{ width: 400 }}
                                    placeholder={__('请选择更新周期')}
                                    options={updateCycle}
                                />
                            </Form.Item>
                            <Form.Item label={__('依赖原子指标')}>
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Icons type={FormulaType.ATOM} colored />
                                    <span style={{ marginLeft: 6 }}>
                                        {atomInfo.atomic_indicator_name}
                                    </span>
                                </div>
                            </Form.Item>
                            <Form.Item
                                label={
                                    <>
                                        {__('分析维度')}
                                        <QuestionCircleOutlined
                                            style={{ marginLeft: 4 }}
                                            title={viewInfo.business_name}
                                        />
                                    </>
                                }
                            >
                                <AnalysisDimension
                                    value={dimValue}
                                    disabledOptions={
                                        iden
                                            ? [iden]
                                            : policyFieldsInfo?.fields || []
                                    }
                                    options={dimOptions}
                                    onChange={handleAnyDimChange}
                                />
                            </Form.Item>
                            {hasDate && (
                                <Form.Item label={__('时间限定')}>
                                    {getRestrictView(
                                        form?.getFieldValue('date_where'),
                                        dateWhereRelation,
                                    )}

                                    {/* <FieldRelationFormList
                                        disabled
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
                                    /> */}
                                </Form.Item>
                            )}
                            {hasBusiness && (
                                <Form.Item label={__('业务限定')}>
                                    {getRestrictView(
                                        form?.getFieldValue('where'),
                                        whereRelation,
                                    )}
                                    {/* <FieldRelationFormList
                                        disabled
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
                                    /> */}
                                </Form.Item>
                            )}
                            {hasSqlBusiness && (
                                <Form.Item label={__('业务限定')}>
                                    <Editor
                                        lineNumbers={false}
                                        grayBackground
                                        highlightActiveLine={false}
                                        value={aggregateFn}
                                        editable={false}
                                    />
                                </Form.Item>
                            )}
                            <Form.Item label={__('SQL')}>
                                <Editor
                                    grayBackground
                                    highlightActiveLine={false}
                                    style={{ maxHeight: 320, overflow: 'auto' }}
                                    value={getFormatSql(sqlStr)}
                                    editable={false}
                                />
                            </Form.Item>
                        </Form>
                    ) : (
                        dataEmptyView(formulaItem?.errorMsg)
                    )}
                </div>
            )}
        </div>
    )
}

export default DerivedFormula
