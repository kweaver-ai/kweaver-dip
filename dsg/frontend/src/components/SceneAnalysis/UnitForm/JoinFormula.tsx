import React, { useEffect, useRef, useState } from 'react'
import { Form, Space, Select, Tooltip, Spin } from 'antd'
import { Node } from '@antv/x6'
import { SwapOutlined, CheckOutlined } from '@ant-design/icons'
import classnames from 'classnames'
import { clone, trim } from 'lodash'
import { useUpdateEffect } from 'ahooks'
import styles from './styles.module.less'
import __ from '../locale'
import { IFormula, IFormulaFields, messageError } from '@/core'
import { FormulaError, JoinType } from '../const'
import { checkJoinFormulaConfig, checkSortAndRenameFields } from '../helper'
import {
    dataEmptyView,
    IFormulaConfigEl,
    tipLabel,
    fieldLabel,
    joinTypeInfo,
    configLeftFoldLabel,
    configLeftUnfoldLabel,
} from './helper'
import ConfigHeader from './ConfigHeader'
import StructureColored from '@/icons/StructureColored'
import FieldsDragTable from './FieldsDragTable'
import NodeLeftColored from '@/icons/NodeLeftColored'
import { DATA_TYPE_MAP } from '@/utils'
import NodeRightColored from '@/icons/NodeRightColored'

/**
 * 关联算子配置
 */
const JoinFormula = ({
    visible,
    graph,
    node,
    formulaData,
    fieldsData,
    viewSize,
    dragExpand,
    onChangeExpand,
    onClose,
}: IFormulaConfigEl) => {
    const [form] = Form.useForm()
    const tRef = useRef() as React.MutableRefObject<any>
    const [loading, setLoading] = useState<boolean>(false)
    // 当前的算子信息
    const [formulaItem, setFormulaItem] = useState<IFormula>()
    // 前序节点
    const [preNodes, setPreNodes] = useState<Node[]>([])
    // 关联方式
    const [relateType, setRelateType] = useState<JoinType>(JoinType.INNER)
    // 关联结果字段集
    const [fieldItems, setFieldItems] = useState<IFormulaFields[]>([])
    // 左侧折叠 true-折叠
    const [leftFold, setLeftFold] = useState<boolean>(false)
    // 关联排序
    const [relateOrder, setRelateOrder] = useState<boolean>(true)
    // 所有的关联方式
    const joinTypeArr = [
        JoinType.LEFT,
        JoinType.RIGHT,
        JoinType.INNER,
        JoinType.FULLOUT,
    ]

    useEffect(() => {
        if (visible && formulaData && node && graph) {
            checkData()
        }
    }, [visible, formulaData])

    // 保存节点配置
    const handleSave = async () => {
        try {
            await form.validateFields(['relateFieldR', 'relateFieldL'])
            const { relateFieldL, relateFieldR } = form.getFieldsValue()
            const res = tRef.current?.getData()
            if (res.hasError) {
                return
            }
            const selectedFields = res.resultFields.filter(
                (info) => info.checked,
            )
            if (selectedFields.length === 0) {
                messageError(__('请至少选择一个字段作为下一个节点/算子的输入'))
            } else {
                const { formula } = node!.data
                const relationField = [relateFieldL, relateFieldR].map(
                    (a, idx) => ({
                        ...preNodes[idx].data.output_fields.find((b) => {
                            const ids = a.split('_')
                            return b.id === ids[0] && b.sourceId === ids[1]
                        }),
                        nodeId: preNodes[idx].id,
                    }),
                )
                node!.replaceData({
                    ...node?.data,
                    src: preNodes.map((info) => info.id),
                    formula: formula.map((info) => {
                        // 查找当前配置的算子
                        if (info.id === formulaItem?.id) {
                            const tempFl = info
                            delete tempFl.errorMsg
                            return {
                                ...tempFl,
                                config: {
                                    relation_field: relationField,
                                    relation_type: relateType,
                                    // fields_change: changeFields,
                                    config_fields: res.resultFields,
                                },
                                output_fields: selectedFields,
                            }
                        }
                        return info
                    }),
                })
                onClose()
            }
        } catch (err) {
            // if (err?.errorFields?.length > 0) {
            // }
        }
    }

    const clearData = () => {
        form.resetFields()
        setPreNodes([])
        setRelateType(JoinType.INNER)
        setFieldItems([])
    }

    // 检查更新数据
    const checkData = () => {
        setLoading(true)
        clearData()
        checkJoinFormulaConfig(graph!, node!, formulaData!, fieldsData)
        const realFormula = node!.data.formula.find(
            (info) => info.id === formulaData!.id,
        )
        setFormulaItem(realFormula)
        const { config, errorMsg } = realFormula
        if (errorMsg && errorMsg !== FormulaError.ConfigError) {
            setTimeout(() => {
                setLoading(false)
            }, 400)
            return
        }

        const nodes = node!.data.src.map(
            (info) => graph!.getCellById(info) as Node,
        )
        // 左右表字段信息
        const fL: IFormulaFields[] = nodes[0].data.output_fields.map(
            (info) => ({
                ...info,
                nodeId: nodes[0].id,
                originName: info.alias,
            }),
        )
        const fR: IFormulaFields[] = nodes[1].data.output_fields.map(
            (info) => ({
                ...info,
                nodeId: nodes[1].id,
                originName: info.alias,
            }),
        )
        if (config) {
            const { relation_field, fields_change, config_fields } = config
            let tempNodes: Node[] = nodes
            const tempPreNodes: Node[] = relation_field.map((a) => {
                const findItem = nodes.find((b) => a.nodeId === b.id)
                if (findItem) {
                    tempNodes = tempNodes.filter((b) => a.nodeId !== b.id)
                }
                return findItem
            })
            if (tempNodes.length === 2) {
                setPreNodes(nodes)
            } else if (tempNodes.length === 1) {
                setPreNodes(
                    tempPreNodes.map((a) => {
                        if (!a) {
                            return tempNodes[0]
                        }
                        return a
                    }),
                )
            } else {
                setPreNodes(tempPreNodes)
            }

            // 关联
            let firstDataType: any
            setTimeout(() => {
                relation_field!.forEach((info, idx) => {
                    const sor = nodes.find((n) => n.id === info.nodeId)
                    const findItem: IFormulaFields =
                        sor?.data?.output_fields?.find(
                            (f) =>
                                f.id === info.id &&
                                f.sourceId === info.sourceId,
                        )
                    if (!findItem) {
                        form.setFields([
                            {
                                name: `relateField${idx === 0 ? 'L' : 'R'}`,
                                errors: [__('请选择关联字段')],
                            },
                        ])
                    } else {
                        if (idx === 0) {
                            firstDataType =
                                findItem?.data_type ||
                                fieldsData.data.find(
                                    (a) => a.id === findItem.id,
                                )?.data_type
                        }
                        form.setFieldValue(
                            `relateField${idx === 0 ? 'L' : 'R'}`,
                            `${findItem.id}_${findItem.sourceId}`,
                        )
                    }
                    const findItemDataType =
                        info?.data_type ||
                        fieldsData.data.find((a) => a.id === findItem?.id)
                            ?.data_type
                    if (
                        idx === 1 &&
                        firstDataType &&
                        findItemDataType &&
                        firstDataType !== findItemDataType
                    ) {
                        form.setFields([
                            {
                                name: 'relateFieldL',
                                errors: [__('关联字段的类型必须一致')],
                            },
                            {
                                name: 'relateFieldR',
                                errors: [__('关联字段的类型必须一致')],
                            },
                        ])
                    }
                })
            }, 450)

            const { totalFields } = checkSortAndRenameFields(
                [...fL, ...fR],
                config_fields,
            )
            setFieldItems(totalFields)
            setRelateType(config.relation_type)
        } else {
            setPreNodes(nodes)
            initCheckFieldRepeat(nodes)
        }
        setTimeout(() => {
            setLoading(false)
        }, 400)
    }

    /**
     * 初始检查字段重名
     * @param fL 左
     * @param fR 右
     * @param nodes 前序节点
     */
    const initCheckFieldRepeat = (nodes = preNodes) => {
        let nd = clone(nodes)
        // 右连接重命名左表，其他方式重命名右表
        if (relateType === JoinType.RIGHT) {
            nd = nd.reverse()
        }
        const lastestFields = tRef.current?.fields
        // 左右表字段信息
        const fL: any[] = nd[0].data.output_fields.map((info) => ({
            ...info,
            nodeId: nd[0].id,
            originName: info.alias,
        }))
        const fR: IFormulaFields[] = nd[1].data.output_fields.map((info) => ({
            ...info,
            nodeId: nd[1].id,
            originName: info.alias,
        }))

        // 左表还原
        let fLOutData: any[] = []
        fL.forEach((info) => {
            const findItem = lastestFields?.find(
                (f) =>
                    `${f.id}_${f.sourceId}` === `${info.id}_${info.sourceId}`,
            )
            // const repeatField = fR.find((a) => a.alias === info.alias)
            // const newName = `${info.alias}_${nd[0].data.name}`
            if (findItem) {
                if (findItem.alias.endsWith(`_${nd[0].data.name}`)) {
                    fLOutData = [
                        ...fLOutData,
                        { ...findItem, alias: info.alias },
                    ]
                    return
                }
                fLOutData = [...fLOutData, findItem]
                return
            }
            fLOutData = [...fLOutData, { ...info, checked: true }]
        })

        // 右表重命名
        let fROutData: any[] = []
        fR.forEach((info) => {
            const findItem = lastestFields?.find(
                (f) =>
                    `${f.id}_${f.sourceId}` === `${info.id}_${info.sourceId}`,
            )
            const repeatField = fL.find((a) => a.alias === info.alias)
            const newName = `${info.alias}_${nd[1].data.name}`
            if (findItem) {
                if (repeatField && findItem.alias === info.alias) {
                    fROutData = [
                        ...fROutData,
                        {
                            ...info,
                            // originName: info.alias,
                            alias: newName,
                        },
                    ]
                    return
                }
                fROutData = [...fROutData, findItem]
                return
            }
            if (repeatField) {
                fROutData = [
                    ...fROutData,
                    {
                        ...info,
                        // originName: info.alias,
                        alias: newName,
                        checked: true,
                    },
                ]
                return
            }
            fROutData = [...fROutData, { ...info, checked: true }]
        })
        if (relateType === JoinType.RIGHT) {
            setFieldItems([...fROutData, ...fLOutData])
        } else {
            setFieldItems([...fLOutData, ...fROutData])
        }
    }

    useUpdateEffect(() => {
        initCheckFieldRepeat()
    }, [relateOrder])

    // 调换关联字段
    const handleSwapRelateField = () => {
        setPreNodes([...preNodes].reverse())
        const { relateFieldL, relateFieldR } = form.getFieldsValue()
        form.setFieldsValue({
            relateFieldR: relateFieldL,
            relateFieldL: relateFieldR,
        })
        setRelateOrder(!relateOrder)
    }

    // 校验关联字段
    const validateRelatedField = (value) => {
        const { relateFieldL, relateFieldR } = form.getFieldsValue()
        if (relateFieldL && relateFieldR) {
            const fL = preNodes[0].data.output_fields.find((info) => {
                const ids = relateFieldL.split('_')
                return info.id === ids[0] && info.sourceId === ids[1]
            })
            const fR = preNodes[1].data.output_fields.find((info) => {
                const ids = relateFieldR.split('_')
                return info.id === ids[0] && info.sourceId === ids[1]
            })
            if (
                (fL?.data_type ||
                    fieldsData.data.find((a) => a.id === fL.id)?.data_type) !==
                (fR?.data_type ||
                    fieldsData.data.find((a) => a.id === fR.id)?.data_type)
            ) {
                form.setFields([
                    {
                        name: 'relateFieldL',
                        errors: [__('关联字段的类型必须一致')],
                    },
                    {
                        name: 'relateFieldR',
                        errors: [__('关联字段的类型必须一致')],
                    },
                ])
                return Promise.reject(new Error(__('关联字段的类型必须一致')))
            }
            form.setFields([
                {
                    name: 'relateFieldL',
                    errors: [],
                },
                {
                    name: 'relateFieldR',
                    errors: [],
                },
            ])
        }
        return Promise.resolve()
    }

    // 关联字段搜索过滤
    const filterRelatedField = (inputValue: string, option, item) => {
        const res = item.data.output_fields
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

    // 关联方式变更
    const handleRelateChange = (type) => {
        setRelateType(type)
        setRelateOrder(!relateOrder)
    }

    return (
        <div className={styles.joinFormulaWrap}>
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
                <div className={styles.jf_contentWrap}>
                    {!formulaItem?.errorMsg ||
                    formulaItem.errorMsg === FormulaError.ConfigError ? (
                        <>
                            {leftFold ? (
                                configLeftFoldLabel(() => setLeftFold(false))
                            ) : (
                                <div
                                    className={styles.jf_leftWrap}
                                    hidden={leftFold}
                                >
                                    {configLeftUnfoldLabel(() =>
                                        setLeftFold(true),
                                    )}
                                    <Form
                                        layout="vertical"
                                        form={form}
                                        autoComplete="off"
                                    >
                                        <Form.Item
                                            label={__('选择关联字段')}
                                            required
                                        >
                                            <div className={styles.joinWrap}>
                                                <div className={styles.before}>
                                                    <NodeLeftColored
                                                        style={{
                                                            fontSize: 18,
                                                        }}
                                                    />
                                                    <span
                                                        className={
                                                            styles.beforeLine
                                                        }
                                                    />
                                                    <NodeRightColored
                                                        style={{
                                                            fontSize: 18,
                                                        }}
                                                    />
                                                </div>
                                                <div
                                                    style={{
                                                        flex: 1,
                                                    }}
                                                >
                                                    {preNodes.map(
                                                        (item, index) => {
                                                            return (
                                                                <Space.Compact
                                                                    key={
                                                                        item.id
                                                                    }
                                                                    block
                                                                    style={{
                                                                        width: '100%',
                                                                    }}
                                                                >
                                                                    <div
                                                                        className={
                                                                            styles.joinNameWrap
                                                                        }
                                                                    >
                                                                        <StructureColored
                                                                            className={
                                                                                styles.joinNodeIcon
                                                                            }
                                                                        />
                                                                        <div
                                                                            className={
                                                                                styles.joinName
                                                                            }
                                                                            title={
                                                                                item
                                                                                    .data
                                                                                    .name
                                                                            }
                                                                        >
                                                                            {
                                                                                item
                                                                                    .data
                                                                                    .name
                                                                            }
                                                                        </div>
                                                                    </div>
                                                                    <Form.Item
                                                                        name={`relateField${
                                                                            index ===
                                                                            0
                                                                                ? 'L'
                                                                                : 'R'
                                                                        }`}
                                                                        style={{
                                                                            width: '60%',
                                                                        }}
                                                                        rules={[
                                                                            {
                                                                                required:
                                                                                    true,
                                                                                message:
                                                                                    __(
                                                                                        '请选择关联字段',
                                                                                    ),
                                                                            },
                                                                            {
                                                                                validator:
                                                                                    (
                                                                                        e,
                                                                                        value,
                                                                                    ) =>
                                                                                        validateRelatedField(
                                                                                            value,
                                                                                        ),
                                                                            },
                                                                        ]}
                                                                    >
                                                                        <Select
                                                                            placeholder={__(
                                                                                '请选择字段名称',
                                                                            )}
                                                                            className={
                                                                                styles.joinSelect
                                                                            }
                                                                            allowClear
                                                                            showSearch
                                                                            filterOption={(
                                                                                inputValue,
                                                                                option,
                                                                            ) =>
                                                                                filterRelatedField(
                                                                                    inputValue,
                                                                                    option,
                                                                                    item,
                                                                                )
                                                                            }
                                                                            options={item.data.output_fields.map(
                                                                                (
                                                                                    info,
                                                                                ) => {
                                                                                    const disabled =
                                                                                        DATA_TYPE_MAP.time.includes(
                                                                                            info.data_type,
                                                                                        )

                                                                                    return {
                                                                                        value: `${info.id}_${info.sourceId}`,
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
                                                                                        ),
                                                                                        disabled,
                                                                                    }
                                                                                },
                                                                            )}
                                                                            notFoundContent={tipLabel(
                                                                                __(
                                                                                    '抱歉，没有找到相关内容',
                                                                                ),
                                                                            )}
                                                                        />
                                                                    </Form.Item>
                                                                </Space.Compact>
                                                            )
                                                        },
                                                    )}
                                                </div>
                                                <Tooltip
                                                    title={__('切换左右表')}
                                                    placement="right"
                                                >
                                                    <div
                                                        className={styles.after}
                                                    >
                                                        <SwapOutlined
                                                            className={
                                                                styles.afterIcon
                                                            }
                                                            onClick={
                                                                handleSwapRelateField
                                                            }
                                                        />
                                                    </div>
                                                </Tooltip>
                                            </div>
                                        </Form.Item>
                                        <Form.Item
                                            label={__('关联方式')}
                                            required
                                            style={{ marginBottom: 0 }}
                                        >
                                            <div className={styles.typeWrap}>
                                                {joinTypeArr.map((info) => (
                                                    <Tooltip
                                                        key={info}
                                                        title={
                                                            joinTypeInfo[info]
                                                                .tip
                                                        }
                                                    >
                                                        <div
                                                            className={classnames(
                                                                styles.typeItemWrap,
                                                                relateType ===
                                                                    info &&
                                                                    styles.typeItemSelected,
                                                            )}
                                                            onClick={() =>
                                                                handleRelateChange(
                                                                    info,
                                                                )
                                                            }
                                                        >
                                                            {
                                                                joinTypeInfo[
                                                                    info
                                                                ].icon
                                                            }
                                                            <div
                                                                className={
                                                                    styles.typeItemTitle
                                                                }
                                                            >
                                                                {
                                                                    joinTypeInfo[
                                                                        info
                                                                    ].name
                                                                }
                                                            </div>
                                                            <div
                                                                className={
                                                                    styles.typeItemCheck
                                                                }
                                                            >
                                                                <CheckOutlined
                                                                    className={
                                                                        styles.typeItemCheckIcon
                                                                    }
                                                                />
                                                            </div>
                                                        </div>
                                                    </Tooltip>
                                                ))}
                                            </div>
                                        </Form.Item>
                                    </Form>
                                </div>
                            )}
                            <div className={styles.jf_split} />
                            <div className={styles.jf_rightWrap}>
                                <FieldsDragTable
                                    ref={tRef}
                                    items={fieldItems}
                                    formulaItem={formulaItem}
                                    fieldsData={fieldsData}
                                    preNodes={preNodes}
                                    columns={['alias', 'nodeId', 'originName']}
                                    viewSize={viewSize || 0}
                                />
                            </div>
                        </>
                    ) : (
                        dataEmptyView(formulaItem?.errorMsg, formulaItem?.type)
                    )}
                </div>
            )}
        </div>
    )
}

export default JoinFormula
