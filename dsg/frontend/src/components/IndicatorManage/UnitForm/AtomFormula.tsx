import React, { useEffect, useState, useMemo, useRef, ReactNode } from 'react'
import { Form, Select, Button, Spin, Tooltip, Dropdown } from 'antd'
import { QuestionCircleOutlined, DownOutlined } from '@ant-design/icons'
import { get, find, chain, omit } from 'lodash'
import styles from './styles.module.less'
import __ from '../locale'
import { checkAtomFormulaConfig, replaceSqlStr } from '../helper'
import { formatError, IFormula, IFormulaFields } from '@/core'
import {
    FieldTypes,
    FormulaError,
    ConfigType,
    configErrorList,
    FormulaType,
} from '../const'
import {
    dataEmptyView,
    IFormulaConfigEl,
    getFieldOptions,
    getFilterFieldOptions,
    transformField,
} from './helper'
import ConfigHeader from './ConfigHeader'
import AnalysisDimension, { FieldType } from './AnalysisDimension'
import Editor, { getFormatSql } from '../Editor'
import Empty from '@/ui/Empty'
import { getSql } from '@/core/apis/indicatorManagement'
import { disabledGroupSelectLimits } from '@/components/SceneAnalysis/const'
import { dataTypeMapping } from '@/components/DataConsanguinity/const'

import dataEmpty from '@/assets/dataEmpty.svg'

interface ViewInfoType {
    table_id: string
    business_name: string
}

const AtomFormula = ({
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
    const [idenOptions, setIdenOptions] = useState<any>([])
    // 日期时间标识项
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
    const [hideAnalysisDimension, setHideAnalysisDimension] =
        useState<boolean>(false)
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
            const isPolicyFields =
                dimValue.some((v) =>
                    policyFieldsInfo?.fields?.map((o) => o.id)?.includes(v.id),
                ) && !hideAnalysisDimension
            const { fieldId } = values
            if (isPolicyFields) return
            node!.replaceData({
                ...node?.data,
                formula: formula.map((info) => {
                    if (info.id === formulaItem?.id) {
                        const tempFl = info
                        delete tempFl.errorMsg
                        const o = find(idenOptions, ['value', fieldId])
                        return {
                            ...tempFl,
                            config: {
                                view_info: viewInfo,
                                sql_str: sqlStr,
                                date_code_identify: transformField(o),
                                analysis_dimension_fields: dimValue.map(
                                    (item) => transformField(item),
                                ),
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
            await checkAtomFormulaConfig(
                graph!,
                node!,
                formulaData!,
                fieldsData,
            )
        const realFormula = node!.data.formula.find(
            (info) => info.id === formulaData!.id,
        )
        setPolicyFieldsInfo(policyFieldInfos)
        setFormulaItem(realFormula)
        const { config, errorMsg } = realFormula
        if (errorMsg && !configErrorList.includes(errorMsg)) {
            setTimeout(() => {
                setLoading(false)
            }, 400)
            return
        }

        setPreNodeData(preOutData)
        const options = getFieldOptions(preOutData, fieldsData, true)
        setIdenOptions(getFilterFieldOptions(options, 3))
        const opt = getFilterFieldOptions(options, 2)
        const dimOpt = options
            .filter(({ data_type }) => {
                return !dataTypeMapping.time.includes(data_type)
            })
            ?.map((item) => {
                return {
                    ...item,
                    isPolicy: policyFieldInfos?.fields
                        ?.map((o) => o.id)
                        ?.includes(item.id),
                }
            })

        setDimOptions(dimOpt)
        if (config) {
            const { date_code_identify, analysis_dimension_fields } = config

            form.setFieldsValue({
                fieldId: date_code_identify.field_id,
            })

            const it = find(dimOpt, ['value', date_code_identify.field_id])

            setIden(it)
            setDimValue(
                analysis_dimension_fields.map(({ field_id }) =>
                    find(dimOpt, ['value', field_id]),
                ),
            )
        } else {
            // 默认选中字符型维度
            setDimValue(opt)
        }

        const view = get(
            firstNodeData,
            'formula[0].config.other.catalogOptions',
            {
                id: '',
                business_name: '',
            },
        )
        setViewInfo({
            table_id: view.id,
            business_name: view.business_name,
        })
        const l = secondNodeData.formula.length
        const c = get(secondNodeData.formula[l - 1], 'config')
        if (c) {
            let name
            let aggregate
            let str: string = ''
            const t = c.sub_type || ConfigType.SQL
            setHideAnalysisDimension(
                disabledGroupSelectLimits.includes(c?.measure?.aggregate) &&
                    policyFieldInfos?.fields
                        ?.map((o) => o.id)
                        ?.includes(c?.measure?.field?.id),
            )
            switch (t) {
                case ConfigType.SQL:
                    str = replaceSqlStr(get(c, 'sql_info.origin_sql_str'), '"')

                    break
                case ConfigType.VIEW:
                    name = get(c, 'measure.field.name')
                    aggregate = get(c, 'measure.aggregate')
                    str =
                        aggregate === 'COUNT(DISTINCT)'
                            ? `COUNT(DISTINCT "${name}")`
                            : `${aggregate}("${name}")`
                    break
                default:
                    break
            }
            setAggregateFn(str)
        }
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

    const handleIdenChange = (idenId: string) => {
        const it = find(dimOptions, ['value', idenId])
        if (!dimValue?.some((o) => o.id === idenId)) {
            setDimValue((prev) => [it, ...prev])
        }
        setIden(it)
    }

    return (
        <div className={styles.atomFormulaWrap}>
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
                            labelCol={{
                                style: { width: '128px' },
                            }}
                            labelAlign="left"
                        >
                            <Form.Item
                                label={
                                    <>
                                        {__('日期时间标识')}
                                        <QuestionCircleOutlined
                                            style={{ marginLeft: 4 }}
                                            title={__(
                                                '仅支持选择“日期型、日期时间型”类型的字段作为日期时间标识，您可将当前原子指标引用的库表导入「自定义库表」中，通过”SQL算子“将数据类型进行转换',
                                            )}
                                        />
                                    </>
                                }
                                name="fieldId"
                                rules={[
                                    {
                                        required: true,
                                        message: __('请输入日期时间标识'),
                                    },
                                ]}
                            >
                                <Select
                                    style={{ width: 400 }}
                                    optionLabelProp="optionLabel"
                                    options={idenOptions}
                                    placeholder={__('请选择日期时间标识')}
                                    // showSearch
                                    filterOption={(input, option) =>
                                        option?.name.includes(input) ||
                                        option?.name_en.includes(input)
                                    }
                                    onChange={handleIdenChange}
                                    notFoundContent={
                                        <Empty
                                            iconSrc={dataEmpty}
                                            desc={__(
                                                '暂无“日期型、日期时间型”类型的字段可供选择',
                                            )}
                                        />
                                    }
                                />
                            </Form.Item>
                            {!hideAnalysisDimension && (
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
                            )}
                            <Form.Item label={__('表达式')}>
                                <Editor
                                    lineNumbers={false}
                                    grayBackground
                                    highlightActiveLine={false}
                                    value={getFormatSql(aggregateFn)}
                                    editable={false}
                                />
                            </Form.Item>
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

export default AtomFormula
