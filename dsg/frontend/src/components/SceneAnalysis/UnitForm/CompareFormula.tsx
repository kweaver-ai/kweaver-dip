import React, { memo, useEffect, useMemo, useState } from 'react'
import {
    Form,
    Button,
    Select,
    Spin,
    Tooltip,
    FormInstance,
    SelectProps,
} from 'antd'
import { InfoCircleOutlined, PlusOutlined } from '@ant-design/icons'
import classnames from 'classnames'
import { useBoolean } from 'ahooks'
import styles from './styles.module.less'
import { FontIcon } from '@/icons'
import __ from '../locale'
import { checkCompareFormulaConfig } from '../helper'
import { IFormula, IFormulaFields } from '@/core'
import { FormulaError } from '../const'
import { DATA_TYPE_MAP } from '@/utils'
import { dataEmptyView, IFormulaConfigEl, fieldLabel } from './helper'
import ConfigHeader from './ConfigHeader'
import ConfigTable, { CTableColumnItem, FormItemType } from './ConfigTable'
import { IconType } from '@/icons/const'
import AddBatchCompare from '../AddBatchCompare'
import LabelTitle from '@/components/Desensitization/LabelTitle'
import { sortCompareColumns } from '../ComparsionResult'

const renderHead = ({ title, isBenchmark = false }) => {
    return (
        <div>
            <FontIcon name="icon-zuzhijiegou2" type={IconType.COLOREDICON} />
            <span className={styles.tableHead}>{title}</span>
            {isBenchmark && (
                <span className={styles.benchmarkNode}>{__('基准')}</span>
            )}
        </div>
    )
}

const Benchmarks = (props: SelectProps) => {
    return (
        <div className={styles['config-table']}>
            <div className={styles['config-table-head']}>{__('基准节点')}</div>
            <div className={styles['config-table-body']}>
                <Select
                    showSearch
                    placeholder={__('请选择')}
                    style={{ width: '100%' }}
                    filterOption={(input, option) =>
                        ((option?.label as string) ?? '')
                            .toLowerCase()
                            .includes(input.toLowerCase())
                    }
                    {...props}
                />
            </div>
        </div>
    )
}

const Identifier = memo(
    (props: { form: FormInstance; preNodes: any[]; benchmark: any }) => {
        const { form, preNodes, benchmark } = props
        const sortedPreNodes = sortCompareColumns(
            preNodes,
            (col) => col.value === benchmark,
        )
        const options = useMemo(() => {
            if (benchmark) {
                // return sortedPreNodes.reduce((acc, cur) => {
                //     return acc.concat(
                //         cur.children.map((child) => ({ value: child.label })) ??
                //             [],
                //     )
                // }, [])
                return (
                    preNodes
                        .find((node) => node.value === benchmark)
                        ?.fields.map((f) => ({ value: f.alias })) ?? []
                )
            }
            return []
        }, [sortedPreNodes, benchmark])

        const columns = useMemo(() => {
            return [
                {
                    title: __('唯一标识字段'),
                    key: 'unique',
                    dataIndex: 'unique',
                    fixed: 'left',
                    width: 210,
                    formItem: {
                        formType: FormItemType.AUTOCOMPLETE,
                        itemProps: { rules: [{ required: true }] },
                        componentProps: {
                            options,
                            filterOption: (input, option) =>
                                ((option?.value as string) ?? '')
                                    .toLowerCase()
                                    .includes(input.toLowerCase()),
                        },
                    },
                } as CTableColumnItem,
            ].concat(
                sortedPreNodes.map((pre) => {
                    return {
                        title: renderHead({
                            title: pre.label,
                            isBenchmark: pre.value === benchmark,
                        }),
                        key: pre.value,
                        dataIndex: pre.value,
                        split: '=',
                        width: 210,
                        formItem: {
                            formType: FormItemType.SELECT,
                            componentProps: {
                                options: pre.fields,
                                filterOption: (input, option) =>
                                    ((option?.alias as string) ?? '')
                                        .toLowerCase()
                                        .includes(input.toLowerCase()),
                                onChange: (value, option) => {
                                    if (pre.value === benchmark && value) {
                                        form.setFields([
                                            {
                                                name: [
                                                    'identifier',
                                                    0,
                                                    'unique',
                                                ],
                                                value: option.alias,
                                            },
                                        ])
                                    }
                                },
                            },
                            itemProps: { rules: [{ required: true }] },
                        },
                    }
                }),
            )
        }, [sortedPreNodes, benchmark])
        const dataSource = useMemo(
            () => [
                {
                    unique: '',
                    ...preNodes.reduce((acc, cur) => {
                        acc[cur.value] = undefined

                        return acc
                    }, {}),
                },
            ],
            [preNodes],
        )

        return (
            <ConfigTable
                columns={columns}
                dataSource={dataSource}
                name="identifier"
                form={form}
                scroll={{ x: columns.length * 210 }}
            />
        )
    },
)

const Comparision = memo(
    (props: {
        form: FormInstance
        preNodes: any[]
        data?: any[]
        benchmark?: string
        viewSize?: number
    }) => {
        const { form, preNodes, benchmark, data = [], viewSize = 0 } = props
        const sortedPreNodes = sortCompareColumns(
            preNodes,
            (col) => col.value === benchmark,
        )
        // const options = sortedPreNodes.map((pre) => {
        //     const isBenchmark = pre.value === benchmark

        //     return {
        //         ...pre,
        //         label: (
        //             <span>
        //                 <span style={{ marginRight: '4px' }}>{pre.label}</span>
        //                 {isBenchmark && (
        //                     <span className={styles.benchmarkNode}>
        //                         {__('基准')}
        //                     </span>
        //                 )}
        //             </span>
        //         ),
        //     }
        // })

        const options = useMemo(() => {
            if (benchmark) {
                return (
                    preNodes
                        .find((node) => node.value === benchmark)
                        ?.fields.map((f) => ({ value: f.alias })) ?? []
                )
            }
            return []
        }, [sortedPreNodes, benchmark])

        const columns = useMemo(() => {
            return (
                [
                    {
                        title: __('比对项'),
                        key: 'comparisonUnique',
                        dataIndex: 'comparisonUnique',
                        formItem: {
                            formType: FormItemType.AUTOCOMPLETE,
                            componentProps: {
                                options,
                                filterOption: (input, option) =>
                                    ((option?.value as string) ?? '')
                                        .toLowerCase()
                                        .includes(input.toLowerCase()),
                            },
                            itemProps: { rules: [{ required: true }] },
                        },
                        width: 210,
                        fixed: 'left',
                    },
                ] as CTableColumnItem[]
            ).concat(
                sortedPreNodes.map((pre) => {
                    const isBenchmark = pre.value === benchmark
                    return {
                        title: renderHead({
                            title: pre.label,
                            isBenchmark,
                        }),
                        key: pre.value,
                        dataIndex: pre.value,
                        width: 210,
                        split: '=',
                        formItem: {
                            formType: FormItemType.SELECT,
                            componentProps: {
                                options: pre.fields,
                                filterOption: (input, option) =>
                                    ((option?.alias as string) ?? '')
                                        .toLowerCase()
                                        .includes(input.toLowerCase()),
                                onChange: (value, option, rowIndex) => {
                                    if (pre.value === benchmark && value) {
                                        form.setFields([
                                            {
                                                name: [
                                                    'comparison',
                                                    rowIndex,
                                                    'comparisonUnique',
                                                ],
                                                value: option.alias,
                                            },
                                        ])
                                    }
                                },
                            },
                            itemProps: { rules: [{ required: isBenchmark }] },
                        },
                    }
                }),
            )
        }, [sortedPreNodes, benchmark])

        const [dataSource, setDataSource] = useState<any[]>([
            {
                ...preNodes.reduce((acc, cur) => {
                    acc[cur.value] = undefined

                    return acc
                }, {}),
            },
        ])

        useEffect(() => {
            if (data && data.length) {
                setDataSource(data)
            }
        }, [data])

        return (
            <ConfigTable
                showOperate
                enableItemValidator
                columns={columns}
                dataSource={dataSource}
                name="comparison"
                form={form}
                scroll={{
                    x: columns.length * 210 + 80,
                    y: Math.max(
                        (window.innerHeight - 52) * (viewSize / 100) - 320,
                        202,
                    ),
                }}
            />
        )
    },
)

const CompareFormula = ({
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
    const [identifierForm] = Form.useForm()
    const [compareForm] = Form.useForm()
    const [open, { setTrue, setFalse }] = useBoolean(false)
    const [loading, setLoading] = useState<boolean>(false)
    // 前序节点信息
    const [preNodes, setPreNodes] = useState<any>([])
    // 选中的基准节点
    const [benchmarkNode, setBenchmarkNode] = useState<string>()
    // 验证基准节点是否存在
    const [validateError, setValidateError] =
        useState<SelectProps['status']>('')
    // 当前的算子信息
    const [formulaItem, setFormulaItem] = useState<IFormula>()
    // 前序节点数据
    const [preNodeData, setPreNodeData] = useState<IFormulaFields[]>([])
    // 已选比对项
    const [selectedCompare, setSelectedCompare] = useState<any[]>([])
    // 比对项错误
    const [hasErr, setHasErr] = useState(false)

    useEffect(() => {
        if (visible && formulaData && graph && node) {
            checkData()
        }
    }, [visible, formulaData])

    // 获取完整的比对项配置
    const getCompleteComparisonItems = (items: any[], ignoreKey: string) => {
        return items.map((item) => {
            return {
                [ignoreKey]: item[ignoreKey],
                ...preNodes.reduce((acc, cur) => {
                    if (item[cur.value]) {
                        acc[cur.value] = item[cur.value]
                    } else {
                        acc[cur.value] = null
                    }
                    return acc
                }, {}),
            }
        })
    }

    // 保存节点配置
    const handleSave = async () => {
        try {
            if (!benchmarkNode) {
                setValidateError('error')
                return
            }
            await identifierForm.validateFields()
            await compareForm.validateFields().catch((err) => {
                if (err?.errorFields?.length > 0) {
                    setHasErr(true)
                } else {
                    setHasErr(false)
                }
                throw err
            })
            const { formula } = node!.data
            const identifierValues = identifierForm.getFieldsValue()
            const compare_key = getCompleteComparisonItems(
                identifierValues?.identifier ?? [],
                'unique',
            )
            const compareValues = compareForm.getFieldsValue()
            const compare_fields = getCompleteComparisonItems(
                compareValues?.comparison ?? [],
                'comparisonUnique',
            )

            node!.replaceData({
                ...node?.data,
                formula: formula.map((info) => {
                    if (info.id === formulaItem?.id) {
                        const tempFl = info
                        delete tempFl.errorMsg
                        return {
                            ...tempFl,
                            config: {
                                benchmark: benchmarkNode,
                                compare_key,
                                compare_fields,
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
        identifierForm.resetFields()
        compareForm.resetFields()
        setPreNodes([])
        setValidateError('')
        setPreNodeData([])
        setFormulaItem(undefined)
    }

    // 检查更新数据
    const checkData = () => {
        setLoading(true)
        clearData()
        const { preOutData, outData } = checkCompareFormulaConfig(
            graph!,
            node!,
            formulaData!,
            fieldsData,
        )
        const tempPreOutNode = node!.data.src
            .map((info) => graph!.getCellById(info))
            .map((pre) => {
                return {
                    label: pre.data.name,
                    value: pre.id,
                    data: pre.data,
                    // 主键字段
                    primaryKey: pre.data.output_fields.find((output) => {
                        return fieldsData?.data.find(
                            (item) => item.primary_key && item.id === output.id,
                        )
                    }),
                    fields: (pre?.data?.output_fields ?? []).map((info) => {
                        const type =
                            info?.data_type ||
                            fieldsData.data.find((a) => a.id === info.id)
                                ?.data_type
                        const disabled = DATA_TYPE_MAP.time.includes(type)
                        const enName =
                            info.name_en ||
                            fieldsData.data.find((f) => info.id === f.id)
                                ?.name_en
                        return {
                            value: `${info.id}_${info.sourceId}`,
                            label: fieldLabel(type, info.alias),
                            disabled,
                            type,
                            enName,
                            ...info,
                        }
                    }),
                }
            })
        setPreNodes(tempPreOutNode)
        const realFormula = node!.data.formula.find(
            (info) => info.id === formulaData!.id,
        )
        setFormulaItem(realFormula)
        const { config, errorMsg } = realFormula
        if (
            errorMsg &&
            ![FormulaError.ConfigError, FormulaError.NodeChange].includes(
                errorMsg as FormulaError,
            )
        ) {
            setTimeout(() => {
                setLoading(false)
            }, 400)
            return
        }

        setPreNodeData(preOutData)
        if (config) {
            const { benchmark, compare_key, compare_fields } = config
            // 检查基准节点是否存在
            if (!node?.data?.src.includes(benchmark)) {
                setBenchmarkNode(undefined)
                setValidateError('error')
            } else {
                setBenchmarkNode(benchmark)
            }
            identifierForm.setFieldValue('identifier', compare_key)
            compareForm.setFieldValue('comparison', compare_fields)
        }

        setTimeout(() => {
            setLoading(false)
        }, 400)
    }

    // 基准节点变化
    const onBenchmarkNodeChange = (value: string) => {
        setBenchmarkNode(value)
        setValidateError('')
        const benchmark = preNodes.find((n) => n.value === value)
        const allFields = benchmark?.data?.output_fields ?? []
        const defaultField =
            benchmark && benchmark.primaryKey
                ? benchmark.primaryKey
                : allFields?.[0]

        // 基准节点默认选中主键字段，没有主键字段则选中第一个字段
        identifierForm.setFieldValue('identifier', [
            {
                unique: benchmark ? defaultField?.alias : undefined,
                [value]: `${defaultField.id}_${defaultField.sourceId}`,
            },
        ])

        compareForm.setFieldValue(
            'comparison',
            compareForm.getFieldsValue().comparison?.map((item) => {
                return {
                    ...item,
                    comparisonUnique: benchmark
                        ? allFields.find(
                              (f) => `${f.id}_${f.sourceId}` === item[value],
                          )?.alias
                        : item.comparisonUnique,
                }
            }),
        )
    }

    // 批量添加比对项
    const onSure = (data) => {
        const compItems = data.map((item) => {
            const { value, alias, nodeId } = item
            return {
                comparisonUnique: alias,
                [nodeId]: value,
            }
        })
        compareForm.setFieldValue(
            'comparison',
            compItems.concat(compareForm.getFieldsValue().comparison),
        )
        setFalse()
    }

    return (
        <div className={styles.compareFormulaWrap}>
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
                <div className={styles.cf_contentWrap}>
                    {!formulaItem?.errorMsg ||
                    [
                        FormulaError.ConfigError,
                        FormulaError.NodeChange,
                    ].includes(formulaItem.errorMsg as FormulaError) ? (
                        <div className={styles.configContent}>
                            <div className={styles.configContentFirst}>
                                <div>
                                    <LabelTitle
                                        label={__('比对基准')}
                                        fontSize={12}
                                        style={{
                                            marginBottom: '12px',
                                            background: 'transparent',
                                        }}
                                        icon={
                                            <Tooltip
                                                title={__(
                                                    '选择一个上游输入节点为基准，基准输入中的字段会作为其他节点输入字段的比较标准',
                                                )}
                                                placement="right"
                                                color="#fff"
                                                overlayInnerStyle={{
                                                    color: 'rgba(0,0,0,0.85)',
                                                }}
                                            >
                                                <InfoCircleOutlined />
                                            </Tooltip>
                                        }
                                    />
                                    <Benchmarks
                                        options={preNodes}
                                        value={benchmarkNode}
                                        onChange={onBenchmarkNodeChange}
                                        status={validateError}
                                    />
                                </div>
                                <div>
                                    <LabelTitle
                                        label={__('唯一标识')}
                                        fontSize={12}
                                        style={{
                                            marginBottom: '12px',
                                            background: 'transparent',
                                        }}
                                        icon={
                                            <Tooltip
                                                title={__(
                                                    '用于通过唯一ID从不同上游节点中对齐数据',
                                                )}
                                                placement="right"
                                                color="#fff"
                                                overlayInnerStyle={{
                                                    color: 'rgba(0,0,0,0.85)',
                                                }}
                                            >
                                                <InfoCircleOutlined />
                                            </Tooltip>
                                        }
                                    />
                                    <Identifier
                                        form={identifierForm}
                                        preNodes={preNodes}
                                        benchmark={benchmarkNode}
                                    />
                                </div>
                            </div>
                            <div>
                                <LabelTitle
                                    label={__('比对项')}
                                    fontSize={12}
                                    style={{
                                        marginBottom: '12px',
                                        background: 'transparent',
                                    }}
                                    icon={
                                        <>
                                            <Tooltip
                                                title={
                                                    <div>
                                                        <div>
                                                            {__(
                                                                '将每个上游节点中的字段汇聚到同一个比对项以进行比较。',
                                                            )}
                                                        </div>
                                                        <div>
                                                            {__(
                                                                '若未选择某节点中需比对的字段，则该节点不参与该比对项的比对。',
                                                            )}
                                                        </div>
                                                    </div>
                                                }
                                                placement="right"
                                                overlayInnerStyle={{
                                                    width: '259px',
                                                    color: 'rgba(0,0,0,0.85)',
                                                }}
                                                color="#fff"
                                            >
                                                <InfoCircleOutlined />
                                            </Tooltip>
                                            <Button
                                                type="link"
                                                icon={<PlusOutlined />}
                                                style={{ marginLeft: '16px' }}
                                                onClick={() => {
                                                    setSelectedCompare(
                                                        compareForm.getFieldsValue()
                                                            .comparison,
                                                    )
                                                    setTrue()
                                                }}
                                            >
                                                {__('批量添加')}
                                            </Button>
                                            {hasErr && (
                                                <span
                                                    className={styles.hasError}
                                                >
                                                    <InfoCircleOutlined />
                                                    {__(
                                                        '请至少选择一个与比对项关联的字段',
                                                    )}
                                                </span>
                                            )}
                                        </>
                                    }
                                />
                                <Comparision
                                    form={compareForm}
                                    preNodes={preNodes}
                                    benchmark={benchmarkNode}
                                    viewSize={viewSize}
                                    // data={compareItems}
                                />
                            </div>
                        </div>
                    ) : (
                        dataEmptyView(formulaItem?.errorMsg, formulaItem?.type)
                    )}
                    <AddBatchCompare
                        open={open}
                        checkedId=""
                        defaultValue={selectedCompare}
                        dataSource={preNodes}
                        fieldsData={fieldsData}
                        benchmark={benchmarkNode}
                        onClose={() => {
                            setFalse()
                            // setDeletable(true)
                        }}
                        onSure={onSure}
                    />
                </div>
            )}
        </div>
    )
}

export default CompareFormula
