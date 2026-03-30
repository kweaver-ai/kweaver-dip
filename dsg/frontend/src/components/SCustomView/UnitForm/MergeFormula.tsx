import React, {
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useState,
} from 'react'
import {
    Button,
    Select,
    Input,
    Radio,
    RadioChangeEvent,
    Tooltip,
    Table,
    Spin,
} from 'antd'
import ls, { trim } from 'lodash'
import classnames from 'classnames'
import { Node, StringExt } from '@antv/x6'
import {
    ExclamationCircleOutlined,
    InfoCircleFilled,
    QuestionCircleOutlined,
} from '@ant-design/icons'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import update from 'immutability-helper'
import { ColumnsType } from 'antd/lib/table'
import { IFormula, IFormulaFields, messageError } from '@/core'
import styles from './styles.module.less'
import { AddOutlined, DeleteOutLined, DragOutlined } from '@/icons'
import { FieldErrorType, FormulaError } from '../const'
import __ from '../locale'
import { dataEmptyView, IFormulaConfigEl, tipLabel, fieldLabel } from './helper'
import ConfigHeader from './ConfigHeader'
import Empty from '@/ui/Empty'
import dataEmpty from '@/assets/dataEmpty.svg'
import { DraggableBodyRow } from './FieldsDragTable'
import StructureColored from '@/icons/StructureColored'
import Icons from '@/components/BussinessConfigure/Icons'
import { checkMergeFormulaConfig } from '../helper'
import { DATA_TYPE_MAP } from '@/utils'
import { useViewGraphContext } from '../ViewGraphProvider'

/**
 * 指标算子配置
 */
const MergeFormula = forwardRef((props: IFormulaConfigEl, ref) => {
    const {
        visible,
        graph,
        node,
        formulaData,
        fieldsData,
        viewSize = 0,
        dragExpand,
        onChangeExpand,
        onClose,
    } = props
    const [loading, setLoading] = useState<boolean>(false)
    // 前序节点
    const [preNodes, setPreNodes] = useState<Node[]>([])
    // 当前的算子信息
    const [formulaItem, setFormulaItem] = useState<IFormula>()
    // 输出方式
    const [outputMode, setOutputMode] = useState(1)
    // 合并信息集合
    const [mergeItems, setMergeItems] = useState<any[]>([])
    // 编辑字段集合
    const [editItem, setEditItem] = useState<number | undefined>()
    // 编辑字段信息
    const [editValue, setEditValue] = useState<string>()
    const [openItem, setOpenItem] = useState<string[]>([])
    // 信息变更
    const [valuesChange, setValuesChange] = useState<boolean>(false)
    const { setContinueFn } = useViewGraphContext()

    // 输出方式信息
    const outputType = ['save', 'del']
    const outputInfo = {
        save: {
            name: __('保留所有行'),
            tip: __('保留合并字段下所有数据行'),
            value: 1,
        },
        del: {
            name: __('去除重复行'),
            tip: __('去除合并字段下完全相同的数据行'),
            value: 2,
        },
    }

    useImperativeHandle(ref, () => ({
        checkSaveChanged,
        onSave: handleSave,
    }))

    // 检查算子保存变更
    const checkSaveChanged = (): Promise<boolean> => {
        if (!node) return Promise.resolve(false)
        const realFormula = node.data.formula.find(
            (info) => info.id === formulaData!.id,
        )
        if (!realFormula) return Promise.resolve(false)
        setFormulaItem(realFormula)
        const { errorMsg, config, output_fields } = realFormula
        if (
            errorMsg &&
            ![FormulaError.ConfigError, FormulaError.NodeChange].includes(
                errorMsg as FormulaError,
            )
        ) {
            return Promise.resolve(false)
        }
        if (valuesChange) {
            return Promise.resolve(true)
        }
        return Promise.resolve(false)
    }

    useEffect(() => {
        if (visible && formulaData && node && graph) {
            checkData()
        }
    }, [visible, formulaData])

    // 保存节点配置
    const handleSave = async () => {
        let items = mergeItems.filter(
            (info) => info.result?.alias || info.fieldArr.find((f) => f?.id),
        )
        if (items.length === 0) {
            setContinueFn(undefined)
            messageError(__('请至少添加一条合并规则'))
            return
        }
        let hasError: boolean = false
        items = items.map((info) => {
            let tempFl = info
            if (!tempFl?.result || !tempFl.result?.alias) {
                hasError = true
                tempFl = {
                    ...tempFl,
                    result: {
                        ...tempFl?.result,
                        editError: tempFl.result?.editError
                            ? [...tempFl.result.editError, FieldErrorType.Empty]
                            : [FieldErrorType.Empty],
                    },
                }
            }
            if (tempFl?.result?.editError?.length > 0) {
                hasError = true
            }
            if (tempFl.fieldArr.filter((f) => !f?.id).length > 0) {
                hasError = true
                tempFl.fieldArr = tempFl.fieldArr.map((f) => {
                    if (!f?.id) {
                        return {
                            editError: f?.editError
                                ? [...f.editError, FieldErrorType.Empty]
                                : [FieldErrorType.Empty],
                        }
                    }
                    return f
                })
            }
            if (tempFl.fieldArr.find((f) => f?.editError?.length > 0)) {
                hasError = true
            }
            return tempFl
        })
        if (hasError) {
            setContinueFn(undefined)
            setMergeItems(items)
            let errorIndex = -1
            items.find((info, idx) => {
                errorIndex = idx
                return (
                    info.result?.editError?.length > 0 ||
                    !!info.fieldArr.find((f) => f?.editError?.length > 0)
                )
            })
            document.getElementsByTagName('tr')[errorIndex + 2].scrollIntoView({
                behavior: 'smooth',
                block: 'start',
                inline: 'start',
            })
            return
        }

        const { formula } = node!.data
        const outData: IFormulaFields[] = items.map((info) => {
            const newId = StringExt.uuid()
            const { result, fieldArr } = info
            const resultDateType = checkResultDataType(info)
            return {
                ...result,
                id: result?.id || newId.toString(),
                data_type: resultDateType,
                originName: result.alias,
                sourceId: fieldArr[0]?.sourceId,
                name_en:
                    fieldArr[0]?.name_en ||
                    fieldsData.data.find((c) => fieldArr[0].id === c.id)
                        ?.name_en,
                formulaId: formulaItem?.id,
            }
        })
        const nodesFields = preNodes.map((n, colIdx) => {
            const fields = items.map((item) => item.fieldArr[colIdx])
            return { fields, source_node_id: n.id }
        })
        node!.replaceData({
            ...node?.data,
            formula: formula.map((info) => {
                if (info.id === formulaItem?.id) {
                    const tempFl = info
                    delete tempFl.errorMsg
                    return {
                        ...tempFl,
                        config: {
                            config_fields: outData,
                            merge: {
                                deduplicate: outputMode !== 1,
                                nodes: nodesFields,
                            },
                        },
                        output_fields: outData,
                    }
                }
                return info
            }),
        })
        onClose()
    }

    const clearData = () => {
        setPreNodes([])
        setFormulaItem(undefined)
        setOutputMode(1)
        setMergeItems([])
        setEditItem(undefined)
        setEditValue(undefined)
        setOpenItem([])
    }

    // 检查更新数据
    const checkData = async () => {
        setLoading(true)
        clearData()
        checkMergeFormulaConfig(graph!, node!, formulaData!, fieldsData)
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
        const preN: Node[] = node!.data.src.map(
            (info) => graph!.getCellById(info) as Node,
        )
        setPreNodes(preN)

        if (config) {
            const { merge, config_fields } = config
            const { deduplicate, nodes } = merge!
            setOutputMode(deduplicate ? 2 : 1)
            let items = config_fields!.map((info, rowIdx) => {
                const fieldArr = preN.map((n) => {
                    const nodeInfo = nodes.find(
                        (n2) => n2.source_node_id === n?.id,
                    )
                    if (!nodeInfo) {
                        return undefined
                    }
                    const { fields } = nodeInfo
                    const findItem = n?.data?.output_fields.find(
                        (f2) =>
                            fields[rowIdx].id === f2.id &&
                            fields[rowIdx].sourceId === f2.sourceId,
                    )
                    if (!findItem) {
                        return undefined
                    }
                    return { ...findItem, nodeId: n?.id }
                })
                return {
                    result: { ...info },
                    fieldArr,
                }
            })

            // 新增的节点规则校验
            const newAddNodes: Node[] = preN.filter(
                (n1) => !nodes.find((n2) => n1?.id === n2?.source_node_id),
            )
            if (newAddNodes.length !== 0) {
                const { loopAliasRes, loopEnNameRes } = doFieldMatching(preN)
                const existNodesNum = preN.length - newAddNodes.length
                if (existNodesNum > 0) {
                    items = items.map((info) => {
                        const { fieldArr } = info
                        const existFieldArr = fieldArr.slice(0, existNodesNum)
                        const firstAlias = existFieldArr[0].alias
                        const firstEnName =
                            existFieldArr[0]?.name_en ||
                            fieldsData.data.find(
                                (c) => existFieldArr[0].id === c.id,
                            )?.name_en
                        if (
                            loopAliasRes.find((f1) => f1.alias === firstAlias)
                        ) {
                            return {
                                ...info,
                                fieldArr: [
                                    ...existFieldArr,
                                    ...newAddNodes.map((n) => ({
                                        ...n?.data?.output_fields?.find(
                                            (f) => f.alias === firstAlias,
                                        ),
                                        nodeId: n?.id,
                                    })),
                                ],
                            }
                        }
                        if (
                            loopEnNameRes.find(
                                (f1) =>
                                    f1?.name_en ||
                                    fieldsData.data.find((c) => f1.id === c.id)
                                        ?.name_en === firstEnName,
                            )
                        ) {
                            return {
                                ...info,
                                fieldArr: [
                                    ...existFieldArr,
                                    ...newAddNodes.map((n) => ({
                                        ...n?.data?.output_fields?.find(
                                            (f) =>
                                                (f?.name_en ||
                                                    fieldsData.data.find(
                                                        (c) => f.id === c.id,
                                                    )?.name_en) === firstEnName,
                                        ),
                                        nodeId: n?.id,
                                    })),
                                ],
                            }
                        }
                        return info
                    })
                } else {
                    items = [
                        ...loopAliasRes.map((info) => {
                            let fieldArr: IFormulaFields[] = []
                            preN.forEach((n) => {
                                const findItem = n?.data?.output_fields?.find(
                                    (f) => f.alias === info.alias,
                                )
                                fieldArr = [
                                    ...fieldArr,
                                    { ...findItem, nodeId: n?.id },
                                ]
                            })
                            return {
                                result: {
                                    alias: info.alias,
                                },
                                fieldArr,
                            }
                        }),
                        ...loopEnNameRes.map((info) => {
                            let fieldArr: IFormulaFields[] = []
                            preN.forEach((n) => {
                                const findItem = n?.data?.output_fields?.find(
                                    (f) =>
                                        (f?.name_en ||
                                            fieldsData.data.find(
                                                (c) => f.id === c.id,
                                            )?.name_en) ===
                                        (info?.name_en ||
                                            fieldsData.data.find(
                                                (c) => info.id === c.id,
                                            )?.name_en),
                                )
                                fieldArr = [
                                    ...fieldArr,
                                    { ...findItem, nodeId: n?.id },
                                ]
                            })
                            return {
                                result: {
                                    alias: info.alias,
                                },
                                fieldArr,
                            }
                        }),
                    ].map((info, idx) => {
                        const { result } = info
                        const findItem = config_fields?.[idx]
                        if (findItem) {
                            return {
                                ...info,
                                result: { ...findItem, ...result },
                            }
                        }
                        return info
                    })
                }
            }
            setMergeItems(items)
        } else {
            const { loopAliasRes, loopEnNameRes } = doFieldMatching(preN)
            setMergeItems([
                ...loopAliasRes.map((info) => {
                    let fieldArr: IFormulaFields[] = []
                    preN.forEach((n) => {
                        const findItem = n?.data?.output_fields?.find(
                            (f) => f.alias === info.alias,
                        )
                        fieldArr = [...fieldArr, { ...findItem, nodeId: n?.id }]
                    })
                    return {
                        result: {
                            alias: info.alias,
                        },
                        fieldArr,
                    }
                }),
                ...loopEnNameRes.map((info) => {
                    let fieldArr: IFormulaFields[] = []
                    preN.forEach((n) => {
                        const findItem = n?.data?.output_fields?.find(
                            (f) =>
                                (f?.name_en ||
                                    fieldsData.data.find((c) => f.id === c.id)
                                        ?.name_en) ===
                                (info?.name_en ||
                                    fieldsData.data.find(
                                        (c) => info.id === c.id,
                                    )?.name_en),
                        )
                        fieldArr = [...fieldArr, { ...findItem, nodeId: n?.id }]
                    })
                    return {
                        result: {
                            alias: info.alias,
                        },
                        fieldArr,
                    }
                }),
            ])
        }

        setTimeout(() => {
            setLoading(false)
        }, 400)
    }

    // 字段匹配
    const doFieldMatching = (totalNode: Node[]) => {
        // 检查别名
        let loopAliasRes: IFormulaFields[] = totalNode[0].data.output_fields
        for (let i = 1; i < totalNode.length; i += 1) {
            loopAliasRes = ls.intersectionBy(
                loopAliasRes,
                totalNode[i].data.output_fields,
                (val: any) =>
                    `${
                        val?.data_type ||
                        fieldsData.data.find((c) => val.id === c.id)?.data_type
                    }/${val.alias}`,
            )
            if (loopAliasRes.length === 0) {
                break
            }
        }
        // 检查英文名
        let loopEnNameRes: IFormulaFields[] = totalNode[0].data.output_fields
        for (let i = 1; i < totalNode.length; i += 1) {
            loopEnNameRes = ls.intersectionBy(
                loopEnNameRes,
                totalNode[i].data.output_fields,
                (val: any) =>
                    `${
                        val?.data_type ||
                        fieldsData.data.find((c) => val.id === c.id)?.data_type
                    }/${
                        val?.name_en?.toLowerCase() ||
                        fieldsData.data
                            .find((c) => val.id === c.id)
                            ?.name_en?.toLowerCase()
                    }`,
            )
            if (loopEnNameRes.length === 0) {
                break
            }
        }
        loopEnNameRes = loopEnNameRes.filter(
            (a) =>
                !loopAliasRes.find(
                    (b) => a.id === b.id && a.sourceId === b.sourceId,
                ),
        )
        return { loopAliasRes, loopEnNameRes }
    }

    const components = {
        body: {
            row: DraggableBodyRow,
        },
    }

    // 移动行
    const moveRow = useCallback(
        (dragIndex: number, hoverIndex: number) => {
            const dragRow = mergeItems[dragIndex]
            setMergeItems(
                update(mergeItems, {
                    $splice: [
                        [dragIndex, 1],
                        [hoverIndex, 0, dragRow],
                    ],
                }),
            )
        },
        [mergeItems],
    )

    // 输出方式变更
    const handleOutputModeChange = (e: RadioChangeEvent) => {
        setOutputMode(e.target.value)
        setValuesChange(true)
    }

    // 删除一行
    const handleDeleteRow = (index: number) => {
        setMergeItems(mergeItems.filter((info, idx) => idx !== index))
        setValuesChange(true)
    }

    // 增加一行
    const handleAddRow = (index: number) => {
        const temp = mergeItems.slice()
        const fieldArr = new Array(preNodes.length)
        temp.splice(index, 0, {
            result: undefined,
            fieldArr: ls.fill(fieldArr, undefined),
        })
        setMergeItems(temp)
        setValuesChange(true)
    }

    // 确定修改字段名称
    const handleSureFieldName = (item: any, rowIdx: number) => {
        let name = trim(editValue)
        if (!name) {
            name = item.result?.alias
        }
        let tempData = mergeItems.slice()
        if (
            !tempData
                .filter((info, idx) => idx !== rowIdx)
                .every(
                    (info) =>
                        info?.result?.alias !== name &&
                        info?.result?.alias?.toLowerCase() !==
                            name?.toLowerCase(),
                )
        ) {
            tempData = tempData.map((info, idx) => {
                if (rowIdx === idx) {
                    if (item.result?.alias !== name) {
                        return {
                            ...info,
                            result: {
                                ...info?.result,
                                alias: name,
                                editError: [FieldErrorType.Repeat],
                            },
                        }
                    }
                    return {
                        ...info,
                        result: {
                            ...info?.result,
                            editError: [FieldErrorType.Repeat],
                        },
                    }
                }
                return info
            })
        } else {
            tempData = tempData.map((info, idx) => {
                if (rowIdx === idx) {
                    const tempFl = info
                    delete tempFl?.result?.editError
                    if (item.result?.alias !== name) {
                        return {
                            ...tempFl,
                            result: {
                                ...tempFl?.result,
                                alias: name,
                            },
                        }
                    }
                    return tempFl
                }
                return info
            })
        }
        tempData = tempData.map((a, idx1) => {
            const tempFl = a
            const hasRep = !!tempData.find(
                (b, idx2) =>
                    b?.result?.alias?.toLowerCase() ===
                        a?.result?.alias?.toLowerCase() && idx1 !== idx2,
            )
            if (hasRep) {
                return tempFl
            }
            delete tempFl?.result?.editError
            return tempFl
        })
        setMergeItems(tempData)
        setEditItem(undefined)
    }

    // 字段改动
    const handleStartChange = (item: any, rowIdx: number) => {
        if (item.result?.editError) {
            setMergeItems(
                mergeItems.map((info, idx) => {
                    if (idx === rowIdx) {
                        const tempFl = info
                        delete tempFl.result.editError
                        return tempFl
                    }
                    return info
                }),
            )
        }
    }

    // 字段搜索过滤
    const filterField = (inputValue: string, option, item) => {
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

    // 检查行内类型
    const checkRowFieldDataType = (rowIdx: number, data?: any[]) => {
        const items = data || mergeItems
        let colIdx: number = 0
        const tempField = items[rowIdx].fieldArr.find((info, idx) => {
            colIdx = idx
            return !!info
        })
        if (!tempField) {
            return
        }
        const tempFieldType =
            tempField?.data_type ||
            fieldsData.data.find((c) => tempField.id === c.id)?.data_type
        if (
            items[rowIdx].fieldArr
                .filter((info, idx) => !!info && idx !== colIdx)
                .every(
                    (info) =>
                        (info?.data_type ||
                            fieldsData.data.find((c) => info.id === c.id)
                                ?.data_type) === tempFieldType,
                )
        ) {
            setMergeItems(
                items.map((info, idx) => {
                    if (idx === rowIdx) {
                        return {
                            ...info,
                            fieldArr: info.fieldArr.map((f) => {
                                const tempFl = f
                                if (tempFl) {
                                    delete tempFl.editError
                                    return tempFl
                                }
                                if (JSON.stringify(tempFl) === '{}') {
                                    return undefined
                                }
                                return tempFl
                            }),
                        }
                    }
                    return info
                }),
            )
        } else {
            setMergeItems(
                items.map((info, idx) => {
                    if (idx === rowIdx) {
                        return {
                            ...info,
                            fieldArr: info.fieldArr.map((f) => {
                                if (f?.id) {
                                    return {
                                        ...f,
                                        editError: [
                                            FieldErrorType.Inconformity,
                                        ],
                                    }
                                }
                                return f
                            }),
                        }
                    }
                    return info
                }),
            )
        }
    }

    // 字段选项变更
    const handleChangeSelect = (
        opValue,
        rowIdx: number,
        colIdx: number,
        nodeId: string,
    ) => {
        let items
        if (opValue) {
            const selectField = preNodes
                .find((n) => n?.id === nodeId)
                ?.data?.output_fields?.find(
                    (f) => opValue === `${f?.id}_${f?.sourceId}`,
                )
            items = mergeItems.map((info, idx) => {
                const tempFl = info
                if (rowIdx === idx) {
                    tempFl.fieldArr[colIdx] = selectField
                    return tempFl
                }
                // 已有重复选项置空
                if (
                    opValue ===
                    `${info.fieldArr[colIdx]?.id}_${info.fieldArr[colIdx]?.sourceId}`
                ) {
                    tempFl.fieldArr[colIdx] = undefined
                    return tempFl
                }
                return info
            })
        } else {
            items = mergeItems.map((info, idx) => {
                if (rowIdx === idx) {
                    const tempFl = info
                    tempFl.fieldArr[colIdx] = undefined
                    return tempFl
                }
                return info
            })
        }
        setMergeItems(items)
        checkRowFieldDataType(rowIdx, items)
    }

    // 检查错误提示
    const checkErrorTip = (item) => {
        const resultError: string[] = item?.result?.editError || []
        const fieldError = ls.flatten(
            item.fieldArr
                .filter((info) => info?.editError?.length > 0)
                .map((info) => info.editError),
        )
        let wi = 200
        let tip = ''
        if (
            resultError.includes(FieldErrorType.Repeat) &&
            fieldError.includes(FieldErrorType.Inconformity) &&
            fieldError.includes(FieldErrorType.Empty)
        ) {
            wi = 470
            tip = __(
                '存在输出字段重名、选择字段为空及已选字段的数据类型不一致，请修改',
            )
        } else if (
            resultError.includes(FieldErrorType.Repeat) &&
            fieldError.includes(FieldErrorType.Inconformity)
        ) {
            wi = 380
            tip = __('存在输出字段重名及已选字段的数据类型不一致，请修改')
        } else if (
            resultError.includes(FieldErrorType.Repeat) &&
            fieldError.includes(FieldErrorType.Empty)
        ) {
            wi = 300
            tip = __('存在输出字段重名及选择字段为空，请修改')
        } else if (
            resultError.includes(FieldErrorType.Empty) &&
            fieldError.includes(FieldErrorType.Inconformity) &&
            fieldError.includes(FieldErrorType.Empty)
        ) {
            wi = 470
            tip = __(
                '存在输出字段为空、选择字段为空及已选字段的数据类型不一致，请修改',
            )
        } else if (
            resultError.includes(FieldErrorType.Empty) &&
            fieldError.includes(FieldErrorType.Inconformity)
        ) {
            wi = 380
            tip = __('存在输出字段为空及已选字段的数据类型不一致，请修改')
        } else if (
            resultError.includes(FieldErrorType.Empty) &&
            fieldError.includes(FieldErrorType.Empty)
        ) {
            wi = 200
            tip = __('输出字段/选择字段不能为空')
        } else if (
            fieldError.includes(FieldErrorType.Inconformity) &&
            fieldError.includes(FieldErrorType.Empty)
        ) {
            wi = 380
            tip = __('存在选择字段为空及已选字段的数据类型不一致，请修改')
        } else if (fieldError.includes(FieldErrorType.Inconformity)) {
            wi = 260
            tip = __('已选字段的数据类型不一致，请修改')
        } else if (fieldError.includes(FieldErrorType.Empty)) {
            wi = 140
            tip = __('选择字段不能为空')
        } else if (resultError.includes(FieldErrorType.Empty)) {
            wi = 140
            tip = __('输出字段不能为空')
        } else if (resultError.includes(FieldErrorType.Repeat)) {
            wi = 230
            tip = __('该字段名称已存在，请重新输入')
        }
        return { resultError, fieldError, wi, tip }
    }

    // 检查结果类型显示
    const checkResultDataType = (item) => {
        const fieldArr = item.fieldArr.filter(
            (info) => !!info?.id && !info?.editError,
        )
        if (fieldArr.length === preNodes.length) {
            return (
                fieldArr[0]?.data_type ||
                fieldsData.data.find((c) => fieldArr[0].id === c.id)?.data_type
            )
        }
        return undefined
    }

    const columns: ColumnsType<any> = [
        {
            title: __('输出字段名称'),
            dataIndex: 'result',
            key: 'result',
            fixed: 'left',
            render: (value, record, index) => {
                const { resultError, fieldError, wi, tip } =
                    checkErrorTip(record)
                const resultDateType = checkResultDataType(record)
                return (
                    <span className={styles.rowNameWrap}>
                        {resultError.length > 0 || fieldError.length > 0 ? (
                            <Tooltip
                                title={tip}
                                placement="right"
                                getPopupContainer={(n) => n.parentElement!}
                                overlayInnerStyle={{ width: wi }}
                            >
                                <ExclamationCircleOutlined
                                    className={styles.dragIcon}
                                    style={{
                                        color: '#F5222D',
                                        visibility: 'visible',
                                    }}
                                />
                            </Tooltip>
                        ) : (
                            <DragOutlined className={styles.dragIcon} />
                        )}
                        <Input
                            style={{ marginLeft: 4 }}
                            placeholder={__('请输入输出字段名称')}
                            allowClear
                            maxLength={255}
                            prefix={
                                resultDateType ? (
                                    <Icons
                                        type={
                                            fieldsData.dataType.find(
                                                (it) =>
                                                    it.value_en ===
                                                    resultDateType,
                                            )?.value
                                        }
                                    />
                                ) : undefined
                            }
                            status={value?.editError ? 'error' : undefined}
                            value={
                                editItem === index ? editValue : value?.alias
                            }
                            onChange={(e) => {
                                handleStartChange(record, index)
                                setEditValue(e.target.value)
                                setValuesChange(true)
                            }}
                            onFocus={() => {
                                setEditItem(index)
                                setEditValue(value?.alias)
                            }}
                            onBlur={() => handleSureFieldName(record, index)}
                        />
                        <div className={styles.rowNameSplit} />
                    </span>
                )
            },
        },
        ...preNodes.map((n, nIdx) => ({
            title: (
                <span key={nIdx}>
                    <StructureColored
                        style={{ marginRight: 6, fontSize: 12 }}
                    />
                    {n?.data?.name}
                </span>
            ),
            dataIndex: `${n.id}`,
            key: `${n.id}`,
            ellipsis: true,
            render: (_, record, index) => {
                const itemValue = record.fieldArr?.[nIdx]
                const selectedFields = ls
                    .compact(mergeItems.map((info) => info.fieldArr[nIdx]))
                    .map((info) => `${info.id}_${info.sourceId}`)
                return (
                    <span className={styles.rowSelectWrap} key={nIdx}>
                        <div
                            className={styles.rowSelectLeftSplit}
                            hidden={nIdx === 0}
                        />
                        <Select
                            onDropdownVisibleChange={(o) => {
                                if (o) {
                                    setOpenItem([
                                        ...openItem,
                                        `${index}_${nIdx}`,
                                    ])
                                } else {
                                    setOpenItem(
                                        openItem.filter(
                                            (info) =>
                                                info !== `${index}_${nIdx}`,
                                        ),
                                    )
                                }
                            }}
                            style={{ width: '100%' }}
                            placeholder={__('请选择字段名称')}
                            status={itemValue?.editError ? 'error' : undefined}
                            allowClear
                            showSearch
                            value={
                                itemValue?.id
                                    ? `${itemValue?.id}_${itemValue?.sourceId}`
                                    : undefined
                            }
                            onChange={() => {
                                setValuesChange(true)
                            }}
                            onSelect={(val, op) =>
                                handleChangeSelect(val, index, nIdx, n.id)
                            }
                            onClear={() =>
                                handleChangeSelect(undefined, index, nIdx, n.id)
                            }
                            filterOption={(inputValue, option) =>
                                filterField(inputValue, option, n)
                            }
                            options={n.data.output_fields.map((info) => {
                                const disabled = DATA_TYPE_MAP.time.includes(
                                    info.data_type,
                                )

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
                                                                a.id ===
                                                                info.id,
                                                        )?.data_type)
                                                )
                                            })?.value,
                                        info.alias,
                                        openItem.includes(`${index}_${nIdx}`) &&
                                            selectedFields.includes(
                                                `${info.id}_${info.sourceId}`,
                                            ),
                                    ),
                                    disabled,
                                }
                            })}
                            notFoundContent={tipLabel(
                                __('抱歉，没有找到相关内容'),
                            )}
                        />
                        <div
                            className={styles.rowSelectRightSplit}
                            hidden={nIdx === preNodes.length - 1}
                        />
                    </span>
                )
            },
        })),
        {
            title: '',
            fixed: 'right',
            key: 'action',
            width: 60,
            render: (_, record, index) => (
                <div className={styles.rowOperateWrap}>
                    <DeleteOutLined
                        className={classnames(styles.innerDelIcon)}
                        onClick={() => handleDeleteRow(index)}
                    />
                    <AddOutlined
                        className={classnames(styles.innerDelIcon)}
                        onClick={() => handleAddRow(index + 1)}
                    />
                </div>
            ),
        },
    ]

    return (
        <div className={styles.mergeFormulaWrap}>
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
                <div className={styles.mf_contentWrap}>
                    {!formulaItem?.errorMsg ||
                    [
                        FormulaError.ConfigError,
                        FormulaError.NodeChange,
                    ].includes(formulaItem.errorMsg as FormulaError) ? (
                        <>
                            <div className={styles.mf_contentTopWrap}>
                                <div className={styles.topTipWrap}>
                                    <Button
                                        type="link"
                                        style={{ height: 22 }}
                                        onClick={() => handleAddRow(0)}
                                        icon={<AddOutlined />}
                                        hidden={mergeItems.length === 0}
                                    >
                                        {__('添加合并规则')}
                                    </Button>
                                    <InfoCircleFilled
                                        hidden={mergeItems.length === 0}
                                        className={styles.mf_topTipIcon}
                                    />
                                    <span
                                        className={styles.mf_topTipTitle}
                                        hidden={mergeItems.length === 0}
                                    >
                                        {__(
                                            '您仅可选择数据类型相同的字段进行合并',
                                        )}
                                    </span>
                                </div>
                                <span>
                                    <span
                                        style={{
                                            color: 'rgb(0 0 0 / 85%)',
                                        }}
                                    >
                                        {__('合并输出方式：')}
                                    </span>
                                    <Radio.Group
                                        onChange={handleOutputModeChange}
                                        value={outputMode}
                                    >
                                        {outputType.map((info) => (
                                            <Radio
                                                key={outputInfo[info].value}
                                                value={outputInfo[info].value}
                                                style={{
                                                    color: 'rgb(0 0 0 / 65%)',
                                                }}
                                            >
                                                {outputInfo[info].name}
                                                <Tooltip
                                                    title={outputInfo[info].tip}
                                                >
                                                    <QuestionCircleOutlined
                                                        className={
                                                            styles.outputTipIcon
                                                        }
                                                    />
                                                </Tooltip>
                                            </Radio>
                                        ))}
                                    </Radio.Group>
                                </span>
                            </div>
                            {mergeItems.length > 0 ? (
                                <DndProvider backend={HTML5Backend}>
                                    <Table
                                        columns={columns}
                                        dataSource={mergeItems}
                                        components={components}
                                        onRow={(record, index) => {
                                            const attr = {
                                                index,
                                                canDrag:
                                                    editItem !== index &&
                                                    !openItem.find(
                                                        (info) =>
                                                            info.split(
                                                                '_',
                                                            )[0] === `${index}`,
                                                    ),
                                                moveRow,
                                            }
                                            return attr as React.HTMLAttributes<any>
                                        }}
                                        rowClassName={styles.mf_tableRowWrap}
                                        rowKey={(record) =>
                                            mergeItems.indexOf(record)
                                        }
                                        pagination={false}
                                        scroll={{
                                            y:
                                                (window.innerHeight - 52 - 54) *
                                                    (viewSize / 100) -
                                                144,
                                            x: 282 * (preNodes.length + 1) + 60,
                                        }}
                                        locale={{
                                            emptyText: <Empty />,
                                        }}
                                    />
                                </DndProvider>
                            ) : (
                                <div
                                    style={{
                                        textAlign: 'center',
                                        width: '100%',
                                    }}
                                >
                                    <Empty
                                        iconSrc={dataEmpty}
                                        desc={
                                            <div>
                                                {__('暂无数据')}
                                                <div>
                                                    {__('点击')}
                                                    <a
                                                        style={{
                                                            color: '#126ee3',
                                                        }}
                                                        onClick={() =>
                                                            handleAddRow(0)
                                                        }
                                                    >
                                                        {__('【添加合并规则】')}
                                                    </a>
                                                    {__('按钮添加一条合并规则')}
                                                </div>
                                            </div>
                                        }
                                    />
                                </div>
                            )}
                        </>
                    ) : (
                        dataEmptyView(formulaItem?.errorMsg, formulaItem?.type)
                    )}
                </div>
            )}
        </div>
    )
})

export default MergeFormula
