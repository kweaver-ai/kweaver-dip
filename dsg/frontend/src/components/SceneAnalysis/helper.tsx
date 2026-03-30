/* eslint-disable no-continue */
/* eslint-disable no-await-in-loop */
import { InfoCircleFilled, QuestionCircleOutlined } from '@ant-design/icons'
import { Edge, Graph, Node, StringExt } from '@antv/x6'
import { Tooltip } from 'antd'
import { find, noop, omit, trim } from 'lodash'
import {
    Dispatch,
    ReactNode,
    SetStateAction,
    createContext,
    useContext,
    useMemo,
} from 'react'

import { useGetState } from 'ahooks'
import {
    IFormula,
    IFormulaFields,
    checkSceneAnalysisName,
    dataTypeMapping,
    formatError,
    getBusinessObjDefine,
    getDataEleDetailById,
    getDatasheetViewDetails,
    getUserDatasheetViewDetails,
    getVirtualEngineExample,
    runSceneView,
} from '@/core'
import { info as modalInfo } from '@/utils/modalHelper'
import { stateType } from '../DatasheetView/const'
import { getPolicyFields } from '../SceneAnalysis/UnitForm/helper'
import {
    FieldErrorType,
    FieldTypes,
    FormulaError,
    FormulaType,
    ModuleType,
    NodeDataType,
    fieldInfos,
    formulaInfo,
    groupDate,
    sceneNodeTemplate,
} from './const'
import { FieldsData } from './FieldsData'
import Icons from './Icons'
import __ from './locale'

const sceneAlsDataType = [
    {
        id: 7,
        value: '整数型',
        value_en: 'int',
    },
    {
        id: 8,
        value: '小数型',
        value_en: 'float',
    },
    {
        id: 9,
        value: '高精度型',
        value_en: 'decimal',
    },
    {
        id: 10,
        value: '时间型',
        value_en: 'time',
    },
    {
        id: 0,
        value: '数字型',
        value_en: 'number',
    },
    {
        id: 1,
        value: '字符型',
        value_en: 'char',
    },
    {
        id: 2,
        value: '日期型',
        value_en: 'date',
    },
    {
        id: 3,
        value: '日期时间型',
        value_en: 'datetime',
    },
    {
        id: 4,
        value: '时间戳型',
        value_en: 'timestamp',
    },
    {
        id: 5,
        value: '布尔型',
        value_en: 'bool',
    },
    {
        id: 6,
        value: '二进制',
        value_en: 'binary',
    },
]

/**
 * 转换小类型到大类型
 * @type 小类型
 */
const changeTypeToLargeArea = (type: string) => {
    switch (true) {
        case dataTypeMapping.char.includes(type):
            return 'char'
        case dataTypeMapping.int.includes(type):
            return 'int'
        case dataTypeMapping.float.includes(type):
            return 'float'
        case dataTypeMapping.decimal.includes(type):
            return 'decimal'
        case dataTypeMapping.number.includes(type):
            return 'number'
        case dataTypeMapping.datetime.includes(type):
            return 'datetime'
        case dataTypeMapping.date.includes(type):
            return 'date'
        case dataTypeMapping.time.includes(type):
            return 'time'
        case dataTypeMapping.bool.includes(type):
            return 'bool'
        case dataTypeMapping.binary.includes(type):
            return 'binary'
        default:
            return ''
    }
}

/**
 * 比对算子结果转换执行数据格式
 */
const convertExecDataFormat = (res: any) => {
    const masterTable = res?.data?.[0]?.tables?.find(
        (t) => t.tableAlias === 'Master',
    )
    // const slaveTable = res?.data?.[0]?.tables?.find(
    //     (t) => t.tableAlias === 'Slave01',
    // )
    const slaveTables = res?.data?.[0]?.tables?.filter(
        (t) => t.tableAlias !== 'Master',
    )
    if (!masterTable?.fields || !slaveTables.length) {
        return res
    }
    const differences = res?.data?.[0]?.differences || []

    const data: any[] = []

    for (let i = 0; i < masterTable.fields.length; i += 1) {
        const masterField = masterTable.fields[i]
        // const slaveField = slaveTable.fields[i]
        const fieldData = {
            PrimaryKey: res.data[0].primaryKey,
            FieldNameMaster: masterField.fieldName || '',
            // FieldNameSlave: slaveField.fieldName || '',
            BusinessNameMaster: masterField.businessName || '',
            // BusinessNameSlave: slaveField.businessName || '',
            FieldTypeMaster: masterField.fieldType || '',
            // FieldTypeSlave: slaveField.fieldType || '',
            FieldLengthMaster: masterField.fieldLength || 0,
            // FieldLengthSlave: slaveField.fieldLength || 0,
            FieldAccuracyMaster: masterField.fieldAccuracy?.toString() || '0',
            // FieldAccuracySlave: slaveField.fieldAccuracy?.toString() || '0',
            // BusinessNameDifference:
            //     differences.businessNameDifference[i] || 'false',
            // FieldNameDifference: differences.fieldNameDifference[i] || 'false',
            // FieldTypeDifference: differences.fieldTypeDifference[i] || 'false',
            // FieldLengthDifference:
            //     differences.fieldLengthDifference[i] || 'false',
            // FieldAccuracyDifference: 'false',
        }

        for (let j = 0; j < slaveTables.length; j += 1) {
            const slaveField = slaveTables[j].fields?.[i]
            fieldData[`BusinessNameSlave_${j + 1}`] =
                slaveField?.businessName || ''
            fieldData[`FieldNameSlave_${j + 1}`] = slaveField?.fieldName || ''
            fieldData[`FieldTypeSlave_${j + 1}`] = slaveField?.fieldType || ''
            fieldData[`FieldLengthSlave_${j + 1}`] =
                slaveField?.fieldLength || 0
            fieldData[`FieldAccuracySlave_${j + 1}`] =
                slaveField?.fieldAccuracy?.toString() || '0'
            fieldData[`BusinessNameDifference_${j + 1}`] =
                differences[j]?.businessNameDifference?.[i] || 'false'
            fieldData[`FieldNameDifference_${j + 1}`] =
                differences[j]?.fieldNameDifference?.[i] || 'false'
            fieldData[`FieldTypeDifference_${j + 1}`] =
                differences[j]?.fieldTypeDifference?.[i] || 'false'
            fieldData[`FieldLengthDifference_${j + 1}`] =
                differences[j]?.fieldLengthDifference?.[i] || 'false'
            // fieldData[`FieldAccuracyDifference_${j + 1}`] =
            //     differences[j].fieldAccuracyDifference[i] || 'false'
        }

        data.push(fieldData)
    }

    return { ...res, data }
}
const sceneAnalFormatError = (
    module: ModuleType,
    navigator,
    e: any,
    onOk?: () => void,
    text: string = '无法编辑',
) => {
    if (
        module === ModuleType.SceneAnalysis &&
        e?.data?.code === 'SceneAnalysis.Scene.SceneNotExist'
    ) {
        modalInfo({
            title: __(text),
            icon: <InfoCircleFilled />,
            content: __('场景分析已不存在'),
            okText: __('确定'),
            onOk() {
                if (onOk) {
                    onOk()
                    return
                }
                navigator('/dataProduct/sceneAnalysis')
            },
        })
    } else {
        formatError(e)
    }
}

/**
 * 检查场景名称重复
 * @value 输入值
 * @oldName 旧名称
 */
const checkNameRepeat = async (
    value: string,
    oldName?: string,
    id?: string,
) => {
    try {
        if (trim(value) === oldName) {
            return Promise.resolve()
        }
        if (trim(value)) {
            const res = await checkSceneAnalysisName({
                sid: id,
                name: value,
            })
            if (res?.repeat) {
                return Promise.reject(
                    new Error(__('该场景分析名称已存在，请重新输入')),
                )
            }
        }
        return Promise.resolve()
    } catch (ex) {
        formatError(ex)
        return Promise.resolve()
    }
}

/**
 * 获取算子菜单项信息
 * @type 算子类型
 */
const getFormulaMenuItem = (type: FormulaType, module: string) => ({
    label: (
        <div style={{ display: 'flex', alignItems: 'center' }}>
            <Icons type={type} colored fontSize={14} />
            <span
                style={{
                    marginLeft: '8px',
                    color: 'rgba(0, 0, 0, 0.85)',
                }}
            >
                {formulaInfo[type].name}
            </span>
            <Tooltip
                title={
                    module === ModuleType.SceneAnalysis
                        ? formulaInfo[type].featureTip
                        : formulaInfo[type].featureTip2 ||
                          formulaInfo[type].featureTip
                }
            >
                <QuestionCircleOutlined
                    style={{
                        fontSize: 12,
                        color: 'rgba(0,0,0,0.45)',
                        marginLeft: 4,
                    }}
                />
            </Tooltip>
        </div>
    ),
    key: type,
})

const getPortsByType = (id: string, type?: NodeDataType) => {
    let ports: any = []
    switch (type) {
        case NodeDataType.INPUT:
            ports = [
                {
                    id: `${id}-out`,
                    group: 'out',
                },
            ]
            break
        case NodeDataType.OUTPUT:
            ports = [
                {
                    id: `${id}-in`,
                    group: 'in',
                },
            ]
            break
        default:
            ports = [
                {
                    id: `${id}-in`,
                    group: 'in',
                },
                {
                    id: `${id}-out`,
                    group: 'out',
                },
            ]
            break
    }
    return ports
}

/**
 * 获取错误文本
 * @err 错误类型
 * @type 算子类型
 */
const getFormulaErrorText = (
    err?: string | FormulaError,
    type?: FormulaType,
) => {
    switch (err) {
        case FormulaError.MissingLine:
            if (type === FormulaType.JOIN) {
                return __('数据关联算子前需存在两个节点的数据输入')
            }
            if (type === FormulaType.SELECT) {
                return __('选择列算子前需存在算子或节点的数据输入')
            }
            if (type === FormulaType.INDICATOR) {
                return __('指标计算算子前需存在一个节点的数据输入')
            }
            if (type === FormulaType.MERGE) {
                return __('数据合并算子前需存在最少两个节点的数据输入')
            }
            if (type === FormulaType.COMPARE) {
                return __('数据对比算子前需存在最少两个节点的数据输入')
            }
            if (type === FormulaType.DISTINCT) {
                return __('数据去重算子前需存在算子或节点的数据输入')
            }
            if (type === FormulaType.WHERE) {
                return __('数据过滤算子前需存在算子或节点的数据输入')
            }
            if (type === FormulaType.OUTPUTVIEW) {
                return __('输出库表算子前需存在算子或节点的数据输入')
            }
            return __('缺少前序算子数据的输入，请先调整前序算子')
        case FormulaError.MoreLine:
            if (type === FormulaType.SELECT) {
                return __('选择列算子前只能存在一个算子或节点的数据输入')
            }
            if (type === FormulaType.DISTINCT) {
                return __('数据去重算子前只能存在一个算子或节点的数据输入')
            }
            if (type === FormulaType.WHERE) {
                return __('数据过滤算子前只能存在一个算子或节点的数据输入')
            }
            // if (type === FormulaType.JOIN) {
            //     return __('数据关联算子不能同时关联两个来源相同的库表')
            // }
            if (type === FormulaType.OUTPUTVIEW) {
                return __('输出库表算子前只能存在一个算子或节点的数据输入')
            }
            return __('缺少前序算子数据的输入，请先调整前序算子')
        case FormulaError.IndexError:
            // if (type === FormulaType.WHERE) {
            //     return __('数据过滤算子不能作为节点中的第一个算子')
            // }
            return __('缺少前序算子数据的输入，请先调整前序算子')
        case FormulaError.MissingData:
            if (type) {
                return ''
            }
            return __('缺少前序算子数据的输入，请先调整前序算子')
        case FormulaError.NodeChange:
            return __('前序节点发生变更，请确认配置信息')
        case FormulaError.ConfigError:
            return __('算子配置有误')
        case FormulaError.SameSource:
            if (type === FormulaType.MERGE) {
                return __('数据合并算子不能同时关联两个来源相同的库表')
            }
            return __('缺少前序算子数据的输入，请先调整前序算子')
        case FormulaError.IsPolicy:
            return __(
                '当前字段数据密级管控，不能进行度量计算，也不能作为分析维度查询其他数据',
            )
        default:
            return ''
    }
}

// 节点位置信息
interface Position {
    x: number
    y: number
}

/**
 * 创建节点
 * @graph 画布
 * @position 节点位置
 * @type 算子类型
 * @node 前序节点
 * @dataViewId 库表id
 * @objId 实体 id
 * @returns 新创建的节点
 */
const createNodeInGraph = (
    graph: Graph,
    position?: Position,
    type?: FormulaType,
    node?: Node,
    flag: 'create' | 'add' = 'add',
) => {
    const newId = StringExt.uuid()
    // 前序节点相关信息
    let preNodeId: string = ''
    if (node) {
        preNodeId = node.id
    }
    // 算子相关信息
    const num = getNodeNameRepeat(graph, __('未命名'))
    let formulaData: any = {
        name: num > 0 ? `${__('未命名')}_${num}` : __('未命名'),
    }
    if (type) {
        formulaData = {
            ...formulaData,
            formula: [
                {
                    id: StringExt.uuid(),
                    type,
                    output_fields: [],
                },
            ],
        }
    }
    if (flag === 'create') {
        const newNode = graph.createNode({
            id: newId,
            ...sceneNodeTemplate,
            x: position?.x,
            y: position?.y,
            ports: getPortsByType(newId, NodeDataType.JOIN),
            data: {
                ...sceneNodeTemplate.data,
                ...formulaData,
                src: preNodeId ? [preNodeId] : [],
            },
        })
        return newNode
    }
    const newNode = graph.addNode({
        id: newId,
        ...sceneNodeTemplate,
        x: position?.x,
        y: position?.y,
        ports: getPortsByType(newId, NodeDataType.JOIN),
        data: {
            ...sceneNodeTemplate.data,
            ...formulaData,
            src: preNodeId ? [preNodeId] : [],
        },
    })
    return newNode
}

const createNodeInGraphByAi = (
    graph: Graph,
    id: string,
    data: Node['data'],
    position?: Position,
    preNode?: Node,
) => {
    const newId = StringExt.uuid()
    // // 前序节点相关信息
    // let preNodeId: string = ''
    // if (preNode) {
    //     preNodeId = preNode.id
    // }
    const name = data.name || __('未命名')
    // 算子相关信息
    const num = getNodeNameRepeat(graph, name)
    const newData: Node['data'] = {
        ...data,
        name: num > 0 ? `${name}_${num}` : name,
    }
    const newNode = graph.createNode({
        id,
        ...sceneNodeTemplate,
        x: position?.x,
        y: position?.y,
        ports: getPortsByType(id, NodeDataType.JOIN),
        data: {
            ...sceneNodeTemplate.data,
            ...newData,
            // src: preNodeId ? [preNodeId] : [],
        },
    })
    return newNode
}

/**
 * 自动生成名称时获取节点名称重复个数
 * @graph 画布
 * @name 名称
 */
const getNodeNameRepeat = (graph: Graph, name: string) => {
    const nodes = graph.getNodes()
    let repeatNum = 0
    let maxNum = 0
    nodes.forEach((info) => {
        const nameArr: string = info.getData().name.split('_')
        if (nameArr.length > 1) {
            if (nameArr[0] === name && /[0-9]$/g.exec(nameArr[1])) {
                repeatNum += 1
                maxNum =
                    maxNum > Number(nameArr[1]) ? maxNum : Number(nameArr[1])
            }
        } else if (nameArr[0] === name) {
            repeatNum += 1
        }
    })
    maxNum += 1
    return repeatNum > 0 ? maxNum : repeatNum
}

/**
 * 根据节点去寻找上游节点
 * @nodes 所有节点
 * @node 当前节点
 * @returns
 */
const getPreorderNode = (nodes, node): Node[] => {
    if (nodes.length === 0 || !node) {
        return []
    }
    const { src } = node.data
    if (src.length > 0) {
        return [
            ...src.flatMap((info) =>
                getPreorderNode(
                    nodes,
                    nodes.find((n) => info === n.id),
                ),
            ),
            node,
        ]
    }
    return [node]
}

/**
 * 根据算子id获取算子
 * @graph 画布
 * @formulaId 算子id
 * @returns 算子
 */
const getFormulaItem = (graph?: Graph, formulaId?: string) => {
    if (!graph || !formulaId) {
        return undefined
    }
    const nodes = graph.getNodes()
    let item: IFormula | undefined
    nodes.forEach((node) => {
        const { formula } = node.data
        const tempItem = formula.find((i) => i.id === formulaId)
        if (tempItem) {
            item = tempItem
        }
    })
    return item
}

/**
 * 获取节点执行参数
 * @preNodes 前序节点
 * @fieldsData 字段数据
 * @param endFormula 截止的算子
 * @returns 运行库表所需的参数
 */
const getRunViewParam = (
    preNodes: Node[],
    fieldsData: FieldsData,
    endFormula?: IFormula,
    restParams?: any,
) => {
    const params = {
        canvas: preNodes.map((info) => {
            const endIdx = info.data.formula.findIndex(
                (a) => a.id === endFormula?.id,
            )
            return {
                id: info.id,
                name: info.data.name,
                formula: info.data.formula
                    .filter((a, idx) => endIdx < 0 || idx <= endIdx)
                    .map((a) => {
                        const { type, config, output_fields } = a
                        const tempOutputFields = output_fields.map((b) => {
                            const findItem = fieldsData.data.find(
                                (c) => b?.id === c.id,
                            )
                            return {
                                ...b,
                                name_en: b?.name_en || findItem.name_en,
                                data_type: b?.data_type || findItem.data_type,
                            }
                        })
                        switch (type) {
                            case FormulaType.FORM:
                                return {
                                    type,
                                    output_fields: tempOutputFields,
                                    config: { form_id: config.form_id },
                                }
                            case FormulaType.JOIN:
                                return {
                                    type,
                                    output_fields: tempOutputFields,
                                    config: {
                                        relation_type: config.relation_type,
                                        relation_field:
                                            config.relation_field.map((b) => {
                                                const findItem =
                                                    fieldsData.data.find(
                                                        (c) => b?.id === c.id,
                                                    )
                                                return {
                                                    ...b,
                                                    id: b?.id || findItem.id,
                                                    name_en:
                                                        b?.name_en ||
                                                        findItem.name_en,
                                                    data_type:
                                                        b?.data_type ||
                                                        findItem.data_type,
                                                }
                                            }),
                                    },
                                }
                            case FormulaType.SELECT:
                                return {
                                    type,
                                    output_fields: tempOutputFields,
                                    config,
                                }
                            case FormulaType.INDICATOR: {
                                const findItem = fieldsData.data.find(
                                    (b) => config.measure.field?.id === b.id,
                                )
                                return {
                                    type,
                                    output_fields: tempOutputFields,
                                    config: {
                                        name: config.name,
                                        measure: {
                                            ...config.measure,
                                            field: {
                                                ...config.measure.field,
                                                id:
                                                    config.measure.field?.id ||
                                                    findItem.id,
                                                name_en:
                                                    config.measure.field
                                                        ?.name_en ||
                                                    findItem.name_en,
                                                data_type:
                                                    config.measure.field
                                                        ?.data_type ||
                                                    findItem.data_type,
                                            },
                                        },
                                        group: config.group.map((b) => {
                                            const findItem2 =
                                                fieldsData.data.find(
                                                    (c) => b.field?.id === c.id,
                                                )
                                            return {
                                                ...b,
                                                field: {
                                                    ...b.field,
                                                    id:
                                                        b.field?.id ||
                                                        findItem2.id,
                                                    name_en:
                                                        b.field?.name_en ||
                                                        findItem2.name_en,
                                                    data_type:
                                                        b.field?.data_type ||
                                                        findItem2.data_type,
                                                },
                                            }
                                        }),
                                    },
                                }
                            }
                            case FormulaType.WHERE:
                                return {
                                    type,
                                    output_fields: tempOutputFields,
                                    config: {
                                        ...config,
                                        where: config.where.map((b) => ({
                                            ...b,
                                            member: b.member.map((c) => {
                                                const findItem =
                                                    fieldsData.data.find(
                                                        (d) =>
                                                            c.field?.id ===
                                                            d.id,
                                                    )
                                                return {
                                                    ...c,
                                                    field: {
                                                        ...c.field,
                                                        id:
                                                            c.field?.id ||
                                                            findItem.id,
                                                        name_en:
                                                            c.field?.name_en ||
                                                            findItem.name_en,
                                                        data_type:
                                                            c.field
                                                                ?.data_type ||
                                                            findItem.data_type,
                                                    },
                                                }
                                            }),
                                        })),
                                    },
                                }
                            case FormulaType.MERGE:
                                return {
                                    type,
                                    output_fields: tempOutputFields,
                                    config: {
                                        merge: {
                                            ...config.merge,
                                            nodes: config.merge.nodes.map(
                                                (b) => {
                                                    const { fields } = b
                                                    return {
                                                        ...b,
                                                        fields: fields.map(
                                                            (c) => {
                                                                const findItem =
                                                                    fieldsData.data.find(
                                                                        (d) =>
                                                                            c?.id ===
                                                                            d.id,
                                                                    )
                                                                return {
                                                                    ...c,
                                                                    id:
                                                                        c?.id ||
                                                                        findItem.id,
                                                                    name_en:
                                                                        c?.name_en ||
                                                                        findItem.name_en,
                                                                    data_type:
                                                                        c?.data_type ||
                                                                        findItem.data_type,
                                                                }
                                                            },
                                                        ),
                                                    }
                                                },
                                            ),
                                        },
                                    },
                                }
                            case FormulaType.DISTINCT:
                                return {
                                    type,
                                    output_fields: tempOutputFields,
                                    config,
                                }
                            case FormulaType.OUTPUTVIEW:
                                return {
                                    type,
                                    output_fields,
                                    config,
                                }
                            case FormulaType.COMPARE: {
                                const compare_fields =
                                    config.compare_fields.map((comp) => {
                                        return (
                                            Object.keys(comp)
                                                // 过滤掉对比项名称选项
                                                .filter(
                                                    (key) =>
                                                        key !==
                                                            'comparisonItem' &&
                                                        key !==
                                                            'comparisonUnique',
                                                )
                                                .map((key: any) => {
                                                    const f = comp[key]
                                                    // 空比对项
                                                    if (!f) return {}
                                                    const tempItem =
                                                        tempOutputFields.find(
                                                            (temp) =>
                                                                `${temp.id}_${temp.sourceId}` ===
                                                                f,
                                                        )
                                                    return {
                                                        ...(tempItem ?? {}),
                                                        name: tempItem?.name_en,
                                                        // source_node_id: info.id,
                                                    }
                                                })
                                        )
                                    })
                                const uniqueItem = config.compare_key[0]
                                const compare_key = Object.keys(uniqueItem)
                                    .map((f) => {
                                        if (f === 'unique') return null
                                        const tempItem = tempOutputFields.find(
                                            (temp) =>
                                                `${temp.id}_${temp.sourceId}` ===
                                                uniqueItem[f],
                                        )
                                        return {
                                            ...(tempItem ?? {}),
                                            name: tempItem.name_en,
                                            // source_node_id: info.id,
                                        }
                                    })
                                    .filter(Boolean)
                                const { activeKey, ...rest } = restParams
                                const { difference_type } = rest || {}
                                return {
                                    type,
                                    operator: activeKey,
                                    output_fields,
                                    config: {
                                        ...config,
                                        ...(difference_type === 'all'
                                            ? {}
                                            : rest),
                                        compare_key,
                                        compare_fields,
                                    },
                                }
                            }
                            default:
                                return a
                        }
                    }),
                output_fields: info.data.output_fields.map((a) => {
                    const findItem = fieldsData.data.find((b) => b.id === a.id)
                    return {
                        ...a,
                        id: a?.id || findItem.id,
                        name_en: a?.name_en || findItem.name_en,
                        data_type: a?.data_type || findItem.data_type,
                    }
                }),
                src: info.data.src,
            }
        }),
    }
    return params
}

/**
 * 算子执行, 获取执行结果
 * @graph 画布
 * @node 当前节点
 * @formulaItem 当前算子
 * @fieldsData 字段数据
 */
const runFormula = async (
    graph: Graph,
    node: Node,
    formulaItem: IFormula,
    fieldsData: FieldsData,
) => {
    if (!node) {
        return Promise.resolve(undefined)
    }
    // 获取前序节点, 并剔除当前算子后续的算子
    const preNodes = getPreorderNode(graph.getNodes(), node)
    const params = getRunViewParam(preNodes, fieldsData, formulaItem)
    return runSceneView(10, 1, params, false, 'scene-analysis')
}

/**
 * 存储样例数据
 * @graph 画布
 * @node 所在节点
 * @fieldsData 字段数据
 * @formulaItem 算子数据 其余算子必传值
 * @userInfo 用户信息
 * @view_data 库表数据 库表算子必传值
 * @cover 是否覆盖 默认不覆盖
 */
const storeExampleData = async (
    graph: Graph,
    node: Node,
    fieldsData: FieldsData,
    formulaItem?: IFormula,
    userInfo?: any,
    view_data?: any,
    cover = false,
) => {
    // 库表算子
    if (view_data) {
        const { id, view_source_catalog_name, technical_name } = view_data
        if (fieldsData.exampleData.find((e) => e.id === id)) return
        const [catalog, schema] = view_source_catalog_name.split('.')
        let params: any = {
            catalog,
            schema,
            table: technical_name,
            limit: 10,
        }
        if (userInfo) {
            params = {
                ...params,
                user: userInfo.Account || '',
                user_id: userInfo.ID || '',
            }
        }
        try {
            const exampleData = await getVirtualEngineExample(params)
            if (exampleData?.data !== null && exampleData?.data.length > 0) {
                const exaData = {}
                exampleData?.columns?.forEach((item, index) => {
                    exaData[item.name] = Array.from(
                        new Set(exampleData?.data?.map((it) => it[index])),
                    )
                })
                fieldsData.addExampleData(id, exaData)
            }
        } catch (error) {
            // formatError(error)
        }
        return
    }

    // 其余算子
    if (formulaItem) {
        if (
            !cover &&
            fieldsData.exampleData.find((e) => e.id === formulaItem.id)
        )
            return
        try {
            const res = await runFormula(graph, node, formulaItem, fieldsData)
            if (res) {
                const exaData = {}
                res?.columns?.forEach((item, index) => {
                    exaData[item.name] = Array.from(
                        new Set(res?.data?.map((it) => it[index])),
                    )
                })
                fieldsData.addExampleData(formulaItem!.id, exaData, cover)
            }
        } catch (error) {
            // formatError(error)
        }
    }
}

/**
 * 检查字段排序集重命名
 * @data 总数据
 * @config 配置项
 * @returns totalFields-总数据 selectedFields-选择项 fieldNameError-错误
 */
const checkSortAndRenameFields = (
    data: IFormulaFields[],
    config?: IFormulaFields[],
) => {
    const tempData: IFormulaFields[] = data.map((info) => ({
        ...info,
        originName: info.alias,
        checked: false,
        beEditing: false,
        editError: undefined,
    }))
    let notExist: IFormulaFields[] = []
    let existFields: IFormulaFields[] = []
    if (!config || config.length === 0) {
        notExist = []
        existFields = tempData.map((info) => ({
            ...info,
            checked: true,
        }))
    } else {
        notExist = tempData?.filter(
            (item) =>
                !config?.find(
                    (a) => a.id === item.id && a.sourceId === item.sourceId,
                ),
        )
        existFields =
            config
                ?.filter((item) =>
                    tempData?.find(
                        (a) => a.id === item.id && a.sourceId === item.sourceId,
                    ),
                )
                .map((item) => {
                    const findItem = tempData?.find(
                        (a) => a.id === item.id && a.sourceId === item.sourceId,
                    )
                    if (findItem) {
                        if (item.alias === item.originName) {
                            return {
                                ...item,
                                alias: findItem.alias,
                                originName: findItem.alias,
                                data_type: findItem?.data_type,
                            }
                        }
                        return {
                            ...item,
                            originName: findItem.alias,
                            data_type: findItem?.data_type,
                        }
                    }
                    return item
                }) || []
    }
    let errorFields: IFormulaFields[] = []
    const selectedFields = existFields.filter((info) => info?.checked)
    selectedFields.forEach((f1) => {
        if (
            selectedFields.find(
                (f2) =>
                    f2.alias === f1.alias &&
                    `${f1.id}_${f1.sourceId}` !== `${f2.id}_${f2.sourceId}`,
            )
        ) {
            errorFields = [...errorFields, f1]
        }
    })
    return {
        totalFields: [...existFields, ...notExist].map((info) => {
            const findItem = errorFields.find(
                (f2) =>
                    `${info.id}_${info.sourceId}` === `${f2.id}_${f2.sourceId}`,
            )
            if (findItem) {
                return {
                    ...info,
                    editError: FieldErrorType.Repeat,
                    beEditing: true,
                }
            }
            return info
        }),
        selectedFields,
        errorFields,
    }
}

/**
 * 库表算子检查
 * @node 所在节点
 * @formulaItem 当前算子
 */
const checkCatalogFormulaConfig = async (
    graph: Graph,
    node: Node,
    formulaItem: IFormula,
    fieldsData: FieldsData,
    userInfo,
) => {
    const { formula } = node.data
    const { config, id } = formulaItem
    let outData: IFormulaFields[] = []
    let totalData: IFormulaFields[] = []
    let errorMsg: any
    let isExist = true
    const newConfig = config
    if (config) {
        const { form_id, config_fields, other } = config
        if (form_id) {
            try {
                const res = await getUserDatasheetViewDetails(form_id, {
                    enable_data_protection: true,
                })
                if (res) {
                    newConfig!.other.catalogOptions = {
                        ...newConfig?.other.catalogOptions,
                        ...omit(res, 'fields'),
                    }
                    const tempEntries = res.fields?.filter(
                        (item) =>
                            changeTypeToLargeArea(item.data_type) !==
                                FieldTypes.BINARY &&
                            item.data_type !== null &&
                            item.data_type !== '' &&
                            item.status !== stateType.delete &&
                            item.is_readable,
                    )
                    totalData = tempEntries?.map((item) => ({
                        alias: item.business_name,
                        id: item.id,
                        name: item.business_name,
                        sourceId: node.id,
                        originName: item.business_name,
                    }))
                    const { totalFields, selectedFields, errorFields } =
                        checkSortAndRenameFields(totalData, config_fields)
                    if (errorFields.length > 0 || selectedFields.length === 0) {
                        errorMsg = FormulaError.ConfigError
                    } else {
                        outData = selectedFields
                    }
                    totalData = totalFields
                    fieldsData.addData(
                        tempEntries?.map((item) => ({
                            ...item,
                            data_type: changeTypeToLargeArea(item.data_type),
                            name_en: item.technical_name,
                            form_view_id: form_id,
                        })) || [],
                    )
                    // 存储样例数据
                    storeExampleData(
                        graph,
                        node,
                        fieldsData,
                        formulaItem,
                        userInfo,
                        { ...res, id: form_id },
                    )
                    // if (!fieldsData.exampleData.find((e) => e.id === form_id)) {
                    //     const [catalog, schema] =
                    //         res.view_source_catalog_name.split('.')
                    //     let params: any = {
                    //         catalog,
                    //         schema,
                    //         table: res.technical_name,
                    //         limit: 10,
                    //     }
                    //     if (userInfo) {
                    //         params = {
                    //             ...params,
                    //             user: userInfo.Account || '',
                    //             user_id: userInfo.ID || '',
                    //         }
                    //     }
                    //     try {
                    //         const exampleData = await getVirtualEngineExample(
                    //             params,
                    //         )
                    //         if (
                    //             exampleData?.data !== null &&
                    //             exampleData?.data.length > 0
                    //         ) {
                    //             const exaData = {}
                    //             exampleData?.columns?.forEach((item, index) => {
                    //                 exaData[item.name] = Array.from(
                    //                     new Set(
                    //                         exampleData?.data?.map(
                    //                             (it) => it[index],
                    //                         ),
                    //                     ),
                    //                 )
                    //             })
                    //             fieldsData.addExampleData(form_id, exaData)
                    //         }
                    //     } catch (error) {
                    //         // formatError(error)
                    //     }
                    // }
                }
            } catch (err) {
                if (
                    [
                        'DataCatalog.Public.DataSourceNotFound',
                        'DataCatalog.Public.ResourceNotExisted',
                        'DataCatalog.Public.AssetOfflineError',
                        'DataView.FormView.FormViewIdNotExist',
                    ].includes(err?.data?.code)
                ) {
                    isExist = false
                }
                errorMsg = FormulaError.ConfigError
            }
        }
    }
    node.replaceData({
        ...node.data,
        formula: formula.map((info) => {
            if (info.id === id) {
                return {
                    ...info,
                    config: newConfig,
                    output_fields: outData,
                    errorMsg,
                }
            }
            return info
        }),
    })
    return { outData, isExist, totalData }
}

/**
 * 引用库表算子检查-逻辑/自定义库表模块
 * @node 所在节点
 * @formulaItem 当前算子
 */
const checkCiteViewFormulaConfig = async (
    node: Node,
    formulaItem: IFormula,
    fieldsData: FieldsData,
) => {
    const { formula } = node.data
    const { config, id } = formulaItem
    let outData: IFormulaFields[] = []
    let totalData: IFormulaFields[] = []
    let errorMsg: any
    let isExist = true
    if (config) {
        const { form_id, config_fields } = config
        if (form_id) {
            try {
                const res = await getDatasheetViewDetails(form_id, {
                    enable_data_protection: true,
                })
                if (res) {
                    const tempEntries = res.fields?.filter(
                        (item) =>
                            changeTypeToLargeArea(item.data_type) !==
                                FieldTypes.BINARY &&
                            item.data_type !== null &&
                            item.data_type !== '',
                    )
                    totalData = tempEntries?.map((item) => ({
                        alias: item.business_name,
                        id: item.id,
                        name: item.business_name,
                        sourceId: node.id,
                        originName: item.business_name,
                    }))
                    const { totalFields, selectedFields, errorFields } =
                        checkSortAndRenameFields(totalData, config_fields)
                    if (errorFields.length > 0 || selectedFields.length === 0) {
                        errorMsg = FormulaError.ConfigError
                    } else {
                        outData = selectedFields
                    }
                    totalData = totalFields
                    fieldsData.addData(
                        tempEntries?.map((item) => ({
                            ...item,
                            data_type: changeTypeToLargeArea(item.data_type),
                            name_en: item.technical_name,
                            dict_id: item.code_table_id || undefined,
                            dict_name: item.code_table || undefined,
                            standard_code: item.standard_code || undefined,
                            standard_name: item.standard || undefined,
                            form_view_id: form_id,
                        })) || [],
                    )
                }
            } catch (err) {
                if (
                    [
                        'DataCatalog.Public.DataSourceNotFound',
                        'DataCatalog.Public.ResourceNotExisted',
                        'DataCatalog.Public.AssetOfflineError',
                        'DataView.FormView.FormViewIdNotExist',
                    ].includes(err?.data?.code)
                ) {
                    isExist = false
                }
                errorMsg = FormulaError.ConfigError
            }
        }
    }
    node.replaceData({
        ...node.data,
        formula: formula.map((info) => {
            if (info.id === id) {
                return {
                    ...info,
                    output_fields: outData,
                    errorMsg,
                }
            }
            return info
        }),
    })
    return { outData, isExist, totalData }
}

/**
 * 关联算子检查
 * @graph 画布
 * @node 所在节点
 * @formulaItem 当前算子
 * @return preOutData前序输出结果 outData输出字段
 */
const checkJoinFormulaConfig = (
    graph: Graph,
    node: Node,
    formulaItem: IFormula,
    fieldsData: FieldsData,
) => {
    const { formula, src } = node.data
    const { config, id } = formulaItem
    let outData: IFormulaFields[] = []
    let errorMsg: any
    let newConfig = config
    let srcInfo: Array<string | undefined> = src
    if (src.length !== 2) {
        errorMsg = FormulaError.MissingLine
    } else {
        const nodes = graph.getNodes()
        // 前序节点
        const preNodes: Node[] = node!.data.src.map(
            (info) => graph!.getCellById(info) as Node,
        )
        let tempPreNodes: Node[] = preNodes
        if (!preNodes.every((info) => info.data?.output_fields.length > 0)) {
            errorMsg = FormulaError.MissingData
        } else if (config) {
            srcInfo = []
            const { relation_field, config_fields } = config
            // 检测关联字段信息，更新src
            let relationFieldError = false
            const relationField = relation_field!.map((info) => {
                const sor = preNodes.find((n) => n.id === info.nodeId)
                srcInfo.push(sor?.id)
                if (sor) {
                    tempPreNodes = tempPreNodes.filter(
                        (n) => n.id !== info.nodeId,
                    )
                }
                const findItem = sor?.data?.output_fields?.find(
                    (f) => f.id === info.id && f.sourceId === info.sourceId,
                )
                if (!findItem) {
                    relationFieldError = true
                    return undefined
                }
                return findItem
            })
            if (tempPreNodes.length === 2) {
                srcInfo = src
            } else if (tempPreNodes.length === 1) {
                srcInfo = srcInfo.map((a) => {
                    if (!a) {
                        return tempPreNodes[0].id
                    }
                    return a
                })
            }

            if (
                (relationField[0]?.data_type ||
                    fieldsData.data.find(
                        (info) => info.id === relationField[0]?.id,
                    )?.data_type) !==
                (relationField[1]?.data_type ||
                    fieldsData.data.find(
                        (info) => info.id === relationField[1]?.id,
                    )?.data_type)
            ) {
                relationFieldError = true
            }
            if (relationFieldError) {
                errorMsg = FormulaError.ConfigError
            } else {
                // 左右表字段信息
                const fL: IFormulaFields[] = preNodes[0].data.output_fields
                const fR: IFormulaFields[] = preNodes[1].data.output_fields
                const { selectedFields, errorFields } =
                    checkSortAndRenameFields([...fL, ...fR], config_fields)
                if (errorFields.length > 0 || selectedFields.length === 0) {
                    errorMsg = FormulaError.ConfigError
                } else {
                    newConfig = {
                        ...newConfig,
                        relation_field: relation_field?.map((a) => {
                            let findItem = fL.find(
                                (b) =>
                                    b.id === a.id && b.sourceId === a.sourceId,
                            )
                            if (findItem) {
                                return {
                                    ...a,
                                    name: findItem?.alias || a.name,
                                    source_node_id: preNodes[0].id,
                                }
                            }
                            findItem = fR.find(
                                (b) =>
                                    b.id === a.id && b.sourceId === a.sourceId,
                            )
                            return {
                                ...a,
                                name: findItem?.alias || a.name,
                                source_node_id: preNodes[1].id,
                            }
                        }),
                    }
                    outData = selectedFields.map((a) => {
                        let findItem = fL.find(
                            (b) => b.id === a.id && b.sourceId === a.sourceId,
                        )
                        if (findItem) {
                            return {
                                ...a,
                                name: findItem?.alias || a.name,
                                source_node_id: preNodes[0].id,
                            }
                        }
                        findItem = fR.find(
                            (b) => b.id === a.id && b.sourceId === a.sourceId,
                        )
                        return {
                            ...a,
                            name: findItem?.alias || a.name,
                            source_node_id: preNodes[1].id,
                        }
                    })
                }
            }
        }
    }
    node.replaceData({
        ...node.data,
        src: srcInfo,
        formula: formula.map((info) => {
            if (info.id === id) {
                return {
                    ...info,
                    config: newConfig,
                    output_fields: outData,
                    errorMsg,
                }
            }
            return info
        }),
    })
    return { outData }
}

/**
 * 选择列算子检查
 * @graph 画布
 * @node 所在节点
 * @formulaItem 当前算子
 * @return preOutData前序输出结果的转换 outData输出字段
 */
const checkSelectFormulaConfig = (
    graph: Graph,
    node: Node,
    formulaItem: IFormula,
    fieldsData: FieldsData,
) => {
    const { config, id } = formulaItem
    const { formula, src } = node.data
    // 前序算子/节点输出数据
    let preOutData: IFormulaFields[] = []
    let outData: IFormulaFields[] = []
    let errorMsg: any
    if (formula.length === 1 && src.length === 0) {
        errorMsg = FormulaError.MissingLine
    } else if (formula.length === 1 && src.length > 1) {
        errorMsg = FormulaError.MoreLine
    } else {
        let index = 0
        formula.forEach((info, idx) => {
            if (info.id === formulaItem.id) {
                index = idx
            }
        })
        // 前序节点
        const preNodes = node.data.src.map(
            (info) => graph!.getCellById(info) as Node,
        )
        if (formula.length > 1 && index !== 0) {
            // 节点内有算子
            preOutData = formula.at(index - 1).output_fields
        } else {
            preOutData = preNodes[0]?.data?.output_fields || []
        }
        if (preOutData.length === 0) {
            errorMsg = FormulaError.MissingData
        } else if (config) {
            const { config_fields } = config
            const { selectedFields, errorFields } = checkSortAndRenameFields(
                preOutData,
                config_fields,
            )
            if (errorFields.length > 0 || selectedFields.length === 0) {
                errorMsg = FormulaError.ConfigError
            } else {
                outData = selectedFields.map((a) => {
                    const findItem = preOutData.find(
                        (b) => b.id === a.id && b.sourceId === a.sourceId,
                    )
                    if (
                        preNodes.length === 1 &&
                        preNodes[0]?.data?.output_fields.length > 0
                    ) {
                        return {
                            ...a,
                            name: findItem?.alias || a.name,
                            source_node_id: preNodes[0]?.id,
                        }
                    }
                    return {
                        ...a,
                        name: findItem?.alias || a.name,
                    }
                })
            }
        }
    }
    node.replaceData({
        ...node.data,
        formula: formula.map((info) => {
            if (info.id === id) {
                return {
                    ...info,
                    output_fields: outData,
                    errorMsg,
                }
            }
            return info
        }),
    })
    return { preOutData, outData }
}

/**
 * 指标算子检查
 * @graph 画布
 * @node 所在节点
 * @formulaItem 当前算子
 * @return preOutData前序输出结果 outData输出字段
 */
const checkIndicatorFormulaConfig = async (
    graph: Graph,
    node: Node,
    formulaItem: IFormula,
    fieldsData: FieldsData,
) => {
    const { config, id } = formulaItem
    const { formula, src } = node.data
    const formId = fieldsData?.data?.[0]?.form_view_id
    const policyFieldInfos = await getPolicyFields(formId)

    // 前序节点输出数据
    let preOutData: IFormulaFields[] = []
    let outData: IFormulaFields[] = []
    let newConfig = config
    let errorMsg: any
    if (src.length === 0) {
        errorMsg = FormulaError.MissingLine
    } else if (src.length > 1) {
        errorMsg = FormulaError.MoreLine
    } else {
        // 前序节点
        const preNodes = node!.data.src.map(
            (info) => graph!.getCellById(info) as Node,
        )
        preOutData = preNodes[0].data?.output_fields
        if (preOutData.length === 0) {
            errorMsg = FormulaError.MissingData
        } else if (config) {
            const { name, measure, group } = config
            // 度量
            const measureField = preOutData.find(
                (info) =>
                    info.id === measure?.field.id &&
                    info.sourceId === measure?.field.sourceId,
            )
            const preMeasureFieldDataType =
                measureField?.data_type ||
                fieldsData.data.find((info) => info.id === measureField?.id)
                    ?.data_type
            const measureFieldDataType =
                measure?.field?.data_type ||
                fieldsData.data.find((info) => info.id === measure?.field?.id)
                    ?.data_type
            if (
                !measureField ||
                preMeasureFieldDataType !== measureFieldDataType ||
                !fieldInfos[measureFieldDataType].polymerizationOptions.find(
                    (a) => a.value === measure?.aggregate,
                )
            ) {
                errorMsg = FormulaError.ConfigError
            } else {
                const policyFieldIds = policyFieldInfos?.fields?.map(
                    (item) => item.id,
                )
                if (
                    policyFieldIds?.includes(measure?.field?.id) ||
                    group?.some((o) => policyFieldIds?.includes(o?.field?.id))
                ) {
                    errorMsg = FormulaError.IsPolicy
                }
                // 分组
                let groupDelError = false
                let groupTypeError = false
                const groupField = group?.map((info) => {
                    const { format } = info
                    const findItem = preOutData.find(
                        (a) =>
                            a.id === info?.field.id &&
                            a.sourceId === info?.field.sourceId,
                    )
                    if (!findItem) {
                        groupDelError = true
                    } else {
                        const findItemDataType =
                            findItem?.data_type ||
                            fieldsData.data.find((a) => a.id === findItem.id)
                                ?.data_type
                        const infoFieldDataType =
                            info.field?.data_type ||
                            fieldsData.data.find((a) => a.id === info.field.id)
                                ?.data_type
                        // if (findItemDataType !== infoFieldDataType) {
                        const itemDate = groupDate.includes(
                            infoFieldDataType as FieldTypes,
                        )
                        const infoDate = groupDate.includes(
                            findItemDataType as FieldTypes,
                        )
                        if (
                            (itemDate && !infoDate) ||
                            (!itemDate && infoDate) ||
                            (!infoDate && format) ||
                            (infoDate && !format)
                        ) {
                            groupTypeError = true
                        }
                        // }
                    }
                    return findItem
                })
                if (
                    groupDelError ||
                    groupTypeError ||
                    !groupField?.every((info) => info?.alias !== name)
                ) {
                    errorMsg = FormulaError.ConfigError
                } else {
                    outData = [
                        {
                            ...measureField,
                            alias: name!,
                            sourceId: node.id,
                            name: measureField?.alias,
                            data_type: FieldTypes.INT,
                            source_node_id: preNodes[0]?.id,
                        },
                    ]
                    newConfig = {
                        ...newConfig,
                        measure: {
                            ...measure!,
                            field: {
                                ...measure!.field,
                                name: measureField.alias,
                                source_node_id: preNodes[0]?.id,
                            },
                        },
                    }
                    if (groupField) {
                        outData = [
                            ...outData,
                            ...(groupField as IFormulaFields[]).map((a) => {
                                const fieldDataType =
                                    a?.data_type ||
                                    fieldsData.data.find((b) => b.id === a?.id)
                                        ?.data_type
                                if (groupDate.includes(fieldDataType)) {
                                    return {
                                        ...a,
                                        name: a?.alias || a.name,
                                        source_node_id: preNodes[0]?.id,
                                        data_type: FieldTypes.CHAR,
                                    }
                                }
                                return {
                                    ...a,
                                    name: a?.alias || a.name,
                                    source_node_id: preNodes[0]?.id,
                                }
                            }),
                        ]
                        newConfig = {
                            ...newConfig,
                            group: group?.map((a) => {
                                const findItem = preOutData.find(
                                    (b) =>
                                        b.id === a.field.id &&
                                        b.sourceId === a.field.sourceId,
                                )
                                return {
                                    ...a,
                                    field: {
                                        ...a.field,
                                        name: findItem?.alias || a.field.name,
                                        source_node_id: preNodes[0]?.id,
                                    },
                                }
                            }),
                        }
                    }
                }
            }
        }
    }
    node.replaceData({
        ...node.data,
        formula: formula.map((info) => {
            if (info.id === id) {
                return {
                    ...info,
                    config: newConfig,
                    output_fields: outData,
                    errorMsg,
                }
            }
            return info
        }),
    })
    return { preOutData, outData, policyFieldInfos }
}

/**
 * 过滤算子检查
 * @graph 画布
 * @node 所在节点
 * @formulaItem 当前算子
 * @return preOutData前序输出结果 outData输出字段
 */
const checkWhereFormulaConfig = (
    graph: Graph,
    node: Node,
    formulaItem: IFormula,
    fieldsData: FieldsData,
) => {
    const { config, id } = formulaItem
    const { formula, src } = node.data
    // 前序算子输出数据
    let preOutData: IFormulaFields[] = []
    let outData: IFormulaFields[] = []
    let newConfig = config
    let errorMsg: any
    if (formula.length === 1 && src.length === 0) {
        errorMsg = FormulaError.MissingLine
    } else if (formula.length === 1 && src.length > 1) {
        errorMsg = FormulaError.MoreLine
    } else {
        let index = 0
        formula.forEach((info, idx) => {
            if (info.id === formulaItem.id) {
                index = idx
            }
        })
        // 前序节点
        const preNodes = node.data.src.map(
            (info) => graph!.getCellById(info) as Node,
        )
        if (formula.length > 1 && index !== 0) {
            // 节点内有算子
            preOutData = formula.at(index - 1).output_fields
        } else {
            preOutData = preNodes[0]?.data?.output_fields || []
        }
        if (preOutData.length === 0) {
            errorMsg = FormulaError.MissingData
        } else if (config) {
            const { where, where_relation } = config
            for (let i = 0; i < (where?.length || 0); i += 1) {
                const { member } = where![i]
                for (let j = 0; j < member.length; j += 1) {
                    const { field } = member[j]
                    const findItem = preOutData.find(
                        (info) =>
                            info.id === field.id &&
                            info.sourceId === field.sourceId,
                    )
                    const findItemDataType =
                        findItem?.data_type ||
                        fieldsData.data.find((d) => d.id === findItem?.id)
                            ?.data_type
                    const fieldDataType =
                        field?.data_type ||
                        fieldsData.data.find((d) => d.id === field.id)
                            ?.data_type
                    if (
                        !findItem ||
                        findItemDataType !== fieldDataType ||
                        fieldDataType === 'time' ||
                        findItemDataType === 'time'
                    ) {
                        errorMsg = FormulaError.ConfigError
                        break
                    }
                    if (
                        !fieldInfos[fieldDataType].limitListOptions.find(
                            (a) => a.value === member[j].operator,
                        )
                    ) {
                        errorMsg = FormulaError.ConfigError
                        break
                    }
                }
                if (errorMsg) {
                    break
                }
            }
            if (!errorMsg) {
                outData = preOutData.map((a) => {
                    const findItem = preOutData.find(
                        (b) => b.id === a.id && b.sourceId === a.sourceId,
                    )
                    if (
                        preNodes.length === 1 &&
                        preNodes[0]?.data?.output_fields.length > 0
                    ) {
                        return {
                            ...a,
                            name: findItem?.alias || a.name,
                            source_node_id: preNodes[0]?.id,
                        }
                    }
                    return { ...a, name: findItem?.alias || a.name }
                })
                newConfig = {
                    ...newConfig,
                    where_relation: where_relation || 'and',
                    where: where?.map((a) => ({
                        ...a,
                        member: a.member.map((b) => {
                            let findItem = preOutData.find(
                                (c) =>
                                    b.field.id === c.id &&
                                    b.field.sourceId === c.sourceId,
                            )
                            if (
                                preNodes.length === 1 &&
                                preNodes[0]?.data?.output_fields.length > 0
                            ) {
                                findItem =
                                    preNodes[0]?.data?.output_fields.find(
                                        (c) =>
                                            b.field.id === c.id &&
                                            b.field.sourceId === c.sourceId,
                                    )
                                return {
                                    ...b,
                                    field: {
                                        ...b.field,
                                        name: findItem?.alias || b.field.name,
                                        source_node_id: preNodes[0]?.id,
                                    },
                                }
                            }
                            return {
                                ...b,
                                field: {
                                    ...b.field,
                                    name: findItem?.name || b.field.name,
                                },
                            }
                        }),
                    })),
                }
            }
        }
    }
    node.replaceData({
        ...node.data,
        formula: formula.map((info) => {
            if (info.id === id) {
                return {
                    ...info,
                    config: newConfig,
                    output_fields: outData,
                    errorMsg,
                }
            }
            return info
        }),
    })
    return { preOutData, outData }
}

/**
 * 合并算子检查
 * @graph 画布
 * @node 所在节点
 * @formulaItem 当前算子
 * @return preOutData前序输出结果 outData输出字段
 */
const checkMergeFormulaConfig = (
    graph: Graph,
    node: Node,
    formulaItem: IFormula,
    fieldsData: FieldsData,
) => {
    const { formula, src } = node.data
    const { config, id } = formulaItem
    let outData: IFormulaFields[] = []
    let errorMsg: any
    let newConfig = config
    let srcInfo: string[] = src
    if (src.length < 2) {
        errorMsg = FormulaError.MissingLine
    } else {
        // 前序节点
        const preNodes = node!.data.src.map(
            (info) => graph!.getCellById(info) as Node,
        )
        const preSors: Node[] = preNodes
            .map((info) => getPreorderNode(graph.getNodes(), info))
            .flat()
            .map((info) => info?.data?.formula?.[0]?.config?.form_id)
            .filter((info) => !!info)
        const set = new Set(preSors)
        let tempPreNodesId: string[] = preNodes
            .map((info) => info?.id)
            .filter((info) => !!info)
        if (set.size !== preSors.length) {
            errorMsg = FormulaError.SameSource
        } else if (
            !preNodes.every((info) => info.data?.output_fields.length > 0)
        ) {
            errorMsg = FormulaError.MissingData
        } else if (config) {
            srcInfo = []
            const { merge, config_fields } = config
            const { nodes } = merge!

            let fieldError = false
            const tempNodes = nodes!.map((info) => {
                const { fields, source_node_id } = info
                const sor = preNodes.find((n) => n.id === source_node_id)
                // 检测src
                if (sor) {
                    srcInfo.push(sor.id)
                    tempPreNodesId = tempPreNodesId.filter(
                        (n) => n !== source_node_id,
                    )
                } else {
                    return info
                }
                // 检测字段信息
                const tempFields: IFormulaFields[] = fields.map((f1) => {
                    const findItem = sor?.data?.output_fields?.find(
                        (f2) => f1.id === f2.id && f1.sourceId === f2.sourceId,
                    )
                    if (!findItem) {
                        fieldError = true
                        return undefined
                    }
                    const findItemDataType =
                        findItem?.data_type ||
                        fieldsData.data.find((a) => a.id === findItem.id)
                            ?.data_type
                    const infoFieldDataType =
                        f1?.data_type ||
                        fieldsData.data.find((a) => a.id === f1.id)?.data_type
                    if (findItemDataType !== infoFieldDataType) {
                        fieldError = true
                        return undefined
                    }
                    return {
                        ...findItem,
                        name: findItem?.alias || findItem.name,
                        source_node_id: sor.id,
                    }
                })
                return {
                    ...info,
                    fields: tempFields,
                }
            })
            srcInfo = [...srcInfo, ...tempPreNodesId]
            if (tempPreNodesId.length > 0) {
                errorMsg = FormulaError.NodeChange
            } else if (src.length !== nodes.length) {
                errorMsg = FormulaError.NodeChange
            }
            if (!errorMsg) {
                if (fieldError) {
                    errorMsg = FormulaError.ConfigError
                } else {
                    outData = config_fields!.map((info, idx) => {
                        const findItem = tempNodes[0].fields[idx]
                        return {
                            ...info,
                            sourceId: findItem.sourceId,
                            name_en:
                                findItem?.name_en ||
                                fieldsData.data.find(
                                    (c) => findItem.id === c.id,
                                )?.name_en,
                            name: findItem?.alias || findItem.name,
                            source_node_id: tempNodes[0].source_node_id,
                        }
                    })
                    newConfig = {
                        ...newConfig,
                        config_fields: outData,
                        merge: {
                            ...newConfig?.merge!,
                            nodes: tempNodes,
                        },
                    }
                }
            }
        }
    }
    node.replaceData({
        ...node.data,
        src: srcInfo,
        formula: formula.map((info) => {
            if (info.id === id) {
                return {
                    ...info,
                    config: newConfig,
                    output_fields: outData,
                    errorMsg,
                }
            }
            return info
        }),
    })
    return { outData }
}

/**
 * 去重算子检查
 * @node 所在节点
 * @formulaItem 当前算子
 */
const checkDeWeightFormulaConfig = (
    graph: Graph,
    node: Node,
    formulaItem: IFormula,
    fieldsData: FieldsData,
) => {
    const { config, id } = formulaItem
    const { formula, src } = node.data
    // 前序算子/节点输出数据
    let preOutData: IFormulaFields[] = []
    let outData: IFormulaFields[] = []
    let errorMsg: any
    if (formula.length === 1 && src.length === 0) {
        errorMsg = FormulaError.MissingLine
    } else if (formula.length === 1 && src.length > 1) {
        errorMsg = FormulaError.MoreLine
    } else {
        let index = 0
        formula.forEach((info, idx) => {
            if (info.id === formulaItem.id) {
                index = idx
            }
        })
        // 前序节点
        const preNodes = node.data.src.map(
            (info) => graph!.getCellById(info) as Node,
        )
        if (formula.length > 1 && index !== 0) {
            // 节点内有算子
            preOutData = formula.at(index - 1).output_fields
        } else {
            preOutData = preNodes[0]?.data?.output_fields || []
        }
        if (preOutData.length === 0) {
            errorMsg = FormulaError.MissingData
        } else if (config) {
            const { config_fields } = config
            const { selectedFields, errorFields } = checkSortAndRenameFields(
                preOutData,
                config_fields,
            )
            if (errorFields.length > 0 || selectedFields.length === 0) {
                errorMsg = FormulaError.ConfigError
            } else {
                outData = selectedFields.map((a) => {
                    const findItem = preOutData.find(
                        (b) => b.id === a.id && b.sourceId === a.sourceId,
                    )
                    if (
                        preNodes.length === 1 &&
                        preNodes[0]?.data?.output_fields.length > 0
                    ) {
                        return {
                            ...a,
                            name: findItem?.alias || a.name,
                            source_node_id: preNodes[0]?.id,
                        }
                    }
                    return {
                        ...a,
                        name: findItem?.alias || a.name,
                    }
                })
            }
        }
    }

    node.replaceData({
        ...node.data,
        formula: formula.map((info) => {
            if (info.id === id) {
                return {
                    ...info,
                    output_fields: outData,
                    errorMsg,
                }
            }
            return info
        }),
    })
    return { outData, preOutData }
}

/**
 * 输出库表算子检查-自定义库表
 * @graph 画布
 * @node 所在节点
 * @formulaItem 当前算子
 * @return preOutData前序输出结果的转换 outData输出字段
 */
const checkOutputViewFormulaConfig = (
    graph: Graph,
    node: Node,
    formulaItem: IFormula,
    fieldsData: FieldsData,
) => {
    const { config, id } = formulaItem
    const { formula, src } = node.data
    // 前序算子/节点输出数据
    let preOutData: IFormulaFields[] = []
    let outData: IFormulaFields[] = []
    let errorMsg: any
    if (formula.length === 1 && src.length === 0) {
        errorMsg = FormulaError.MissingLine
    } else if (formula.length === 1 && src.length > 1) {
        errorMsg = FormulaError.MoreLine
    } else {
        let index = 0
        formula.forEach((info, idx) => {
            if (info.id === formulaItem.id) {
                index = idx
            }
        })
        // 前序节点
        const preNodes = node.data.src.map(
            (info) => graph!.getCellById(info) as Node,
        )
        if (formula.length > 1 && index !== 0) {
            // 节点内有算子
            preOutData = formula.at(index - 1).output_fields
        } else {
            preOutData = preNodes[0]?.data?.output_fields || []
        }
        if (preOutData.length === 0) {
            errorMsg = FormulaError.MissingData
        } else if (config) {
            const { config_fields } = config
            let tempPreOutData = preOutData.slice()
            config_fields?.forEach((info) => {
                const findItem = preOutData.find((pre) => pre.id === info.id)
                if (!findItem) {
                    errorMsg = FormulaError.NodeChange
                    return
                }
                tempPreOutData = tempPreOutData.filter(
                    (pre) => pre.id !== info.id,
                )
                // const findItemDataType =
                //     findItem?.data_type ||
                //     fieldsData.data.find((a) => a.id === findItem.id)?.data_type
                // if (findItemDataType !== info.type) {
                //     if (info.standard_code) {
                //         errorMsg = FormulaError.ConfigError
                //     } else {
                //         errorMsg = FormulaError.NodeChange
                //     }
                // }
            })
            if (!errorMsg) {
                if (tempPreOutData.length > 0) {
                    errorMsg = FormulaError.NodeChange
                } else {
                    outData = config_fields!.map((a) => {
                        const tempItem = omit(a, [
                            'standard_code',
                            'standard_name',
                            'dict_id',
                            'dict_name',
                            'primary_key',
                            'editError',
                            'standard_deleted',
                            'standard_state',
                            'dict_deleted',
                            'dict_state',
                        ]) as IFormulaFields
                        const findItem = preOutData.find(
                            (b) => b.id === a.id && b.sourceId === a.sourceId,
                        )
                        if (
                            preNodes.length === 1 &&
                            preNodes[0]?.data?.output_fields.length > 0
                        ) {
                            return {
                                ...tempItem,
                                name: findItem?.alias || a.name,
                                source_node_id: preNodes[0]?.id,
                                data_type: a.type,
                            }
                        }
                        return {
                            ...tempItem,
                            name: findItem?.alias || a.name,
                            data_type: a.type,
                        }
                    })
                }
            }
        }
    }
    node.replaceData({
        ...node.data,
        formula: formula.map((info) => {
            if (info.id === id) {
                return {
                    ...info,
                    output_fields: outData,
                    errorMsg,
                }
            }
            return info
        }),
    })
    return { preOutData, outData }
}

/**
 * 输出库表算子检查-库表
 * @graph 画布
 * @node 所在节点
 * @formulaItem 当前算子
 * @return preOutData前序输出结果的转换 outData输出字段
 */
const checkLogicalViewFormulaConfig = (
    graph: Graph,
    node: Node,
    formulaItem: IFormula,
    fieldsData: FieldsData,
) => {
    const { config, id } = formulaItem
    const { formula, src } = node.data
    // 前序算子/节点输出数据
    let preOutData: IFormulaFields[] = []
    let outData: IFormulaFields[] = []
    let errorMsg: any
    if (formula.length === 1 && src.length === 0) {
        errorMsg = FormulaError.MissingLine
    } else if (formula.length === 1 && src.length > 1) {
        errorMsg = FormulaError.MoreLine
    } else {
        let index = 0
        formula.forEach((info, idx) => {
            if (info.id === formulaItem.id) {
                index = idx
            }
        })
        // 前序节点
        const preNodes = node.data.src.map(
            (info) => graph!.getCellById(info) as Node,
        )
        if (formula.length > 1 && index !== 0) {
            // 节点内有算子
            preOutData = formula.at(index - 1).output_fields
        } else {
            preOutData = preNodes[0]?.data?.output_fields || []
        }
        if (preOutData.length === 0) {
            errorMsg = FormulaError.MissingData
        } else if (config) {
            const { config_fields } = config
            config_fields?.forEach((info) => {
                if (!info.id) {
                    errorMsg = FormulaError.ConfigError
                    return
                }
                const findItem = preOutData.find((pre) => pre.id === info.id)
                if (!findItem) {
                    errorMsg = FormulaError.NodeChange
                }
                // const findItemDataType =
                //     findItem?.data_type ||
                //     fieldsData.data.find((a) => a.id === findItem.id)?.data_type
                // if (findItemDataType !== info.data_type) {
                //     if (info.standard_code) {
                //         errorMsg = FormulaError.ConfigError
                //     } else {
                //         errorMsg = FormulaError.NodeChange
                //     }
                // }
            })
            if (!errorMsg) {
                outData = config_fields!.map((a) => {
                    const tempItem = omit(a, [
                        'standard_code',
                        'standard_name',
                        'dict_id',
                        'dict_name',
                        'primary_key',
                        'canChanged',
                        'editError',
                        'standard_deleted',
                        'standard_state',
                        'dict_deleted',
                        'dict_state',
                        'selectField',
                    ]) as IFormulaFields
                    const findItem = preOutData.find(
                        (b) => b.id === a.id && b.sourceId === a.sourceId,
                    )
                    if (
                        preNodes.length === 1 &&
                        preNodes[0]?.data?.output_fields.length > 0
                    ) {
                        return {
                            ...tempItem,
                            name: findItem?.alias || a.name,
                            source_node_id: preNodes[0]?.id,
                        }
                    }
                    return {
                        ...tempItem,
                        name: findItem?.alias || a.name,
                    }
                })
            }
        }
    }
    node.replaceData({
        ...node.data,
        formula: formula.map((info) => {
            if (info.id === id) {
                return {
                    ...info,
                    output_fields: outData,
                    errorMsg,
                }
            }
            return info
        }),
    })
    return { preOutData, outData }
}

/**
 * 数据对比算子检查
 * @graph 画布
 * @node 所在节点
 * @formulaItem 当前算子
 * @return preOutData前序输出结果 outData输出字段
 */
const checkCompareFormulaConfig = (
    graph: Graph,
    node: Node,
    formulaItem: IFormula,
    fieldsData: FieldsData,
) => {
    const { config, id } = formulaItem
    const { formula, src } = node.data
    // 前序算子输出数据
    let preOutData: IFormulaFields[] = []
    let outData: IFormulaFields[] = []
    let newConfig = config as any
    let errorMsg: any

    if (src.length < 2) {
        errorMsg = FormulaError.MissingLine
    } else {
        let index = 0
        formula.forEach((info, idx) => {
            if (info.id === formulaItem.id) {
                index = idx
            }
        })

        // 前序节点
        const preNodes = node.data.src.map(
            (info) => graph!.getCellById(info) as Node,
        )
        preOutData = preNodes.reduce((acc, cur) => {
            const curItem = (cur?.data?.output_fields ?? []).map((item) => ({
                ...item,
                source_node_id: cur.id,
            }))
            return acc.concat(curItem)
        }, [])

        if (!preNodes.every((info) => info.data?.output_fields?.length > 0)) {
            errorMsg = FormulaError.MissingData
        } else if (config) {
            // 替换旧数据
            if (
                newConfig?.compare_fields?.some((item) =>
                    Object.keys(item).includes('comparisonItem'),
                )
            ) {
                newConfig = {
                    ...newConfig,
                    compare_fields:
                        newConfig?.compare_fields?.map((item) => {
                            const tempItem = item
                            if (Object.keys(item).includes('comparisonItem')) {
                                const { comparisonItem } = item
                                delete tempItem.comparisonItem
                                return {
                                    ...tempItem,
                                    comparisonUnique: preOutData.find(
                                        (a) =>
                                            `${a.id}_${a.sourceId}` ===
                                            comparisonItem?.[1],
                                    )?.alias,
                                }
                            }
                            return tempItem
                        }) || [],
                }
            }

            const { compare_key, compare_fields, benchmark } = newConfig
            const compareKey = Object.keys(compare_key?.[0] || {})

            // 检查基准节点
            if (
                !node.data.src.includes(benchmark) ||
                !compareKey.length ||
                !compare_fields?.length
            ) {
                errorMsg = FormulaError.ConfigError
            } else if (
                !node.data.src.every((item) => compareKey.includes(item))
            ) {
                errorMsg = FormulaError.ConfigError
            } else if (
                !compareKey.every(
                    (key) => node.data.src.includes(key) || key === 'unique',
                )
            ) {
                errorMsg = FormulaError.NodeChange
            }

            // 检查唯一标识
            for (let i = 0; i < compareKey.length; i += 1) {
                if (errorMsg) {
                    break
                }
                const key = compareKey[i]
                if (key === 'unique') {
                    continue
                }
                const sor = preNodes.find((n) => n.id === key)
                const findItem = sor?.data?.output_fields.find(
                    (f1) => `${f1.id}_${f1.sourceId}` === compare_key[0][key],
                )
                if (!findItem) {
                    errorMsg = FormulaError.ConfigError
                    break
                }
            }

            // 检查比对项
            for (let i = 0; i < compare_fields.length; i += 1) {
                if (errorMsg) {
                    break
                }
                const compareFieldKey = Object.keys(compare_fields[i])
                for (let j = 0; j < compareFieldKey.length; j += 1) {
                    if (errorMsg) {
                        break
                    }
                    const key = compareFieldKey[j]
                    if (key === 'comparisonUnique' || !compare_fields[i][key]) {
                        continue
                    }
                    const sor = preNodes.find((n) => n.id === key)
                    const findItem = sor?.data?.output_fields.find(
                        (f1) =>
                            `${f1.id}_${f1.sourceId}` ===
                            compare_fields[i][key],
                    )
                    if (!findItem) {
                        if (key === benchmark) {
                            errorMsg = FormulaError.ConfigError
                            break
                        } else {
                            errorMsg = FormulaError.NodeChange
                            break
                        }
                    }
                }
            }

            if (!errorMsg) {
                outData = preOutData.map((a) => {
                    const findItem = preOutData.find(
                        (b) => b.id === a.id && b.sourceId === a.sourceId,
                    )

                    return { ...a, name: findItem?.alias || a.name }
                })
            }
        }
    }
    node.replaceData({
        ...node.data,
        formula: formula.map((info) => {
            if (info.id === id) {
                return {
                    ...info,
                    config: newConfig,
                    output_fields: outData,
                    errorMsg,
                }
            }
            return info
        }),
    })
    return { preOutData, outData }
}

// 获取逻辑实体数据
const getLogicalData = async (
    objId: string,
    entityId: string,
): Promise<any[]> => {
    if (!objId) return Promise.resolve([])
    try {
        const { logic_entities } = await getBusinessObjDefine(objId)
        const attributes =
            logic_entities?.find((info) => info.id === entityId)?.attributes ||
            []
        const standardReqs = attributes
            .filter((info) => info.standard_info)
            .map((info) =>
                getDataEleDetailById({
                    type: 2,
                    value: info.standard_info!.id,
                }),
            )
        const standards = await Promise.allSettled(standardReqs)
        return Promise.resolve(
            attributes.map((info) => {
                const { id, name, standard_info, unique } = info
                let field: any = {
                    attrId: id,
                    primary_key: unique,
                    alias: name,
                    editError: [],
                    canChanged: true,
                    attribute_id: id,
                    attribute_name: name,
                    attribute_path: info.path,
                    label_id: info.label_id,
                    label_name: info.label_name,
                    label_icon: info.label_icon,
                    label_path: info.label_path,
                }
                if (standard_info) {
                    const std = (
                        standards?.find(
                            (s: any) =>
                                s?.value?.data?.code === standard_info.id,
                        ) as any
                    )?.value?.data
                    field = {
                        ...field,
                        data_type: standard_info.data_type,
                        standard_code: std.id,
                        standard_name: standard_info.name,
                        standard_deleted: std.deleted,
                        standard_state: std.state,
                        name_en: standard_info.name_en,
                        canChanged: false,
                    }
                    if (std?.dict_id) {
                        return {
                            ...field,
                            dict_id: std.dict_id,
                            dict_name: std.dict_name_cn,
                            dict_deleted: std.dict_deleted,
                            dict_state: std.dict_state,
                        }
                    }
                }
                return field
            }),
        )
    } catch (err) {
        formatError(err)
        return Promise.resolve([])
    }
}

/**
 * 获取当前节点的target节点
 * @graph 画布
 * @node 当前节点
 * @returns target节点集
 */
const getTargetNodes = (graph: Graph, node: Node) => {
    return graph
        .getEdges()
        .filter((edge: Edge) => edge.getSourceCellId() === node.id)
        .reduce((pre: Node[], cur) => {
            const findNode = cur.getTargetNode()
            if (findNode) {
                return [...pre, findNode]
            }
            return pre
        }, [])
}

/**
 * 计算画布内所有节点算子
 * @graph 画布
 */
const trackingCalculationAll = async (
    graph: Graph,
    fieldsData: FieldsData,
    module: ModuleType | string,
    userInfo,
) => {
    const nodes = graph.getNodes()
    const sourceNodes: Node[] = []
    nodes.forEach((info) => {
        info.replaceData({ ...info.data, output_fields: [], executable: false })
        if (info.data.src.length === 0) {
            sourceNodes.push(info)
        }
    })
    await loopCalculationNodeData(
        graph,
        sourceNodes,
        fieldsData,
        module,
        userInfo,
    )
}

/**
 * 循环计算节点内算子
 * @graph 画布
 * @nodes 节点集合
 */
const loopCalculationNodeData = async (
    graph: Graph,
    nodes: Node[],
    fieldsData: FieldsData,
    module: ModuleType | string,
    userInfo,
    ignoreFl?: IFormula,
) => {
    for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i]
        await trackingNodeCalculation(
            graph,
            node,
            fieldsData,
            module,
            userInfo,
            ignoreFl,
        )
        const targetNodes = getTargetNodes(graph, node)
        await loopCalculationNodeData(
            graph,
            targetNodes,
            fieldsData,
            module,
            userInfo,
        )
    }
}

/**
 * 计算节点内算子
 * @graph 画布
 * @node 节点
 */
const trackingNodeCalculation = async (
    graph: Graph,
    node: Node,
    fieldsData: FieldsData,
    module: ModuleType | string,
    userInfo,
    ignoreFl?: IFormula,
) => {
    if (!node?.data) return
    const { formula } = node.data
    let outData: IFormulaFields[] = []
    let errorMsg: FormulaError | undefined
    if (formula.length > 0) {
        const findIdx = formula.findIndex((f) => f.id === ignoreFl?.id) + 1
        if (findIdx >= formula.length) {
            outData = ignoreFl?.output_fields || []
        } else {
            for (let i = findIdx; i < formula.length; i += 1) {
                const item = formula[i]
                const { id, type } = item
                if (!errorMsg) {
                    switch (type) {
                        case FormulaType.FORM:
                            {
                                let res
                                if (module === ModuleType.SceneAnalysis) {
                                    res = await checkCatalogFormulaConfig(
                                        graph,
                                        node,
                                        item,
                                        fieldsData,
                                        userInfo,
                                    )
                                } else {
                                    res = await checkCiteViewFormulaConfig(
                                        node,
                                        item,
                                        fieldsData,
                                    )
                                }
                                outData = res.outData
                            }
                            break
                        case FormulaType.JOIN:
                            outData = checkJoinFormulaConfig(
                                graph,
                                node,
                                item,
                                fieldsData,
                            ).outData
                            break
                        case FormulaType.SELECT:
                            outData = checkSelectFormulaConfig(
                                graph,
                                node,
                                item,
                                fieldsData,
                            ).outData
                            break
                        case FormulaType.INDICATOR:
                            outData = (
                                await checkIndicatorFormulaConfig(
                                    graph,
                                    node,
                                    item,
                                    fieldsData,
                                )
                            ).outData
                            break
                        case FormulaType.WHERE:
                            outData = checkWhereFormulaConfig(
                                graph,
                                node,
                                item,
                                fieldsData,
                            ).outData
                            break
                        case FormulaType.MERGE:
                            outData = checkMergeFormulaConfig(
                                graph,
                                node,
                                item,
                                fieldsData,
                            ).outData
                            break
                        case FormulaType.DISTINCT:
                            outData = checkDeWeightFormulaConfig(
                                graph,
                                node,
                                item,
                                fieldsData,
                            ).outData
                            break
                        case FormulaType.OUTPUTVIEW:
                            if (module === ModuleType.CustomView) {
                                outData = checkOutputViewFormulaConfig(
                                    graph,
                                    node,
                                    item,
                                    fieldsData,
                                ).outData
                            } else {
                                outData = checkLogicalViewFormulaConfig(
                                    graph,
                                    node,
                                    item,
                                    fieldsData,
                                ).outData
                            }
                            break
                        case FormulaType.COMPARE:
                            outData = checkCompareFormulaConfig(
                                graph,
                                node,
                                item,
                                fieldsData,
                            ).outData
                            break
                        default:
                            break
                    }
                    if (outData.length === 0) {
                        errorMsg = FormulaError.MissingData
                    }
                } else {
                    node.replaceData({
                        ...node.data,
                        // eslint-disable-next-line no-loop-func
                        formula: node.data.formula.map((info: IFormula) => {
                            if (info.id === id) {
                                return {
                                    ...info,
                                    errorMsg,
                                }
                            }
                            return info
                        }),
                    })
                }
            }
        }
    }
    node.replaceData({
        ...node.data,
        output_fields: outData,
        executable: outData.length > 0,
    })
}

interface IGraphContext {
    deletable: boolean
    setDeletable: Dispatch<SetStateAction<boolean>>
    getDeletable: any
    citeFormViewId: string
    setCiteFormViewId: Dispatch<SetStateAction<string>>
}

const initContext: IGraphContext = {
    deletable: true,
    setDeletable: () => {},
    getDeletable: noop,
    citeFormViewId: '',
    setCiteFormViewId: () => {},
}

const GraphContext = createContext<IGraphContext>(initContext)

const useSceneGraphContext = () => useContext<IGraphContext>(GraphContext)

const SceneGraphProvider = ({ children }: { children: ReactNode }) => {
    const [deletable, setDeletable, getDeletable] = useGetState<any>(true)
    const [citeFormViewId, setCiteFormViewId] = useGetState<any>('')

    const values = useMemo(
        () => ({
            deletable,
            setDeletable,
            getDeletable,
            citeFormViewId,
            setCiteFormViewId,
        }),
        [
            deletable,
            setDeletable,
            getDeletable,
            citeFormViewId,
            setCiteFormViewId,
        ],
    )
    return (
        <GraphContext.Provider value={values}>{children}</GraphContext.Provider>
    )
}

const modifyParamsArr = (arr1, arr2, param) => {
    const res = arr1.map((item) => {
        if (
            find(arr2, (o) => {
                return o.id === item.id
            })
        ) {
            return { ...item, [param]: true }
        }
        return { ...item, [param]: false }
    })
    return res
}

/**
 * 获取中心列的最后一个节点位置
 * @param nodes 所有节点
 * @parma center 中心位置
 * @returns 最后一个的位置
 */
const getCenterLastNode = (
    nodes: Array<Node>,
    center: any,
): { x: number; y: number } => {
    return nodes
        .map((n) => {
            const { x, y } = n.getPosition()
            return { x, y }
        })
        .filter((pos) => {
            return pos.x === center.x
        })
        .reduce((prePos, curPos) => {
            return curPos.y > prePos.y ? curPos : prePos
        }, center)
}

/**
 * 获取新节点位置
 * @param nodes 所有节点
 * @param center 中心位置
 * @param prePosition 前一个位置
 * @param offset 偏移量
 */
const getNewNodePosition = (
    nodes: Array<Node>,
    center: { x: number; y: number },
    prePosition?: any,
    offset: number = 50,
) => {
    const centerNode = nodes.filter((n) => {
        const { x, y } = n.getPosition()
        return x === center.x && y === center.y
    })

    if (!nodes.length || centerNode.length === 0) {
        return {
            x: center.x,
            y: center.y,
        }
    }
    if (prePosition) {
        return {
            x: prePosition.x,
            y: prePosition.y + offset,
        }
    }
    const lastNodePos = getCenterLastNode(nodes, center)
    return {
        x: lastNodePos.x,
        y: lastNodePos.y + offset,
    }
}

export {
    SceneGraphProvider,
    changeTypeToLargeArea,
    checkCatalogFormulaConfig,
    checkCiteViewFormulaConfig,
    checkCompareFormulaConfig,
    checkDeWeightFormulaConfig,
    checkIndicatorFormulaConfig,
    checkJoinFormulaConfig,
    checkLogicalViewFormulaConfig,
    checkMergeFormulaConfig,
    checkNameRepeat,
    checkOutputViewFormulaConfig,
    checkSelectFormulaConfig,
    checkSortAndRenameFields,
    checkWhereFormulaConfig,
    convertExecDataFormat,
    createNodeInGraph,
    createNodeInGraphByAi,
    getFormulaErrorText,
    getFormulaItem,
    getFormulaMenuItem,
    getLogicalData,
    getNewNodePosition,
    getNodeNameRepeat,
    getPortsByType,
    getPreorderNode,
    getRunViewParam,
    getTargetNodes,
    loopCalculationNodeData,
    modifyParamsArr,
    sceneAlsDataType,
    sceneAnalFormatError,
    trackingCalculationAll,
    useSceneGraphContext,
}

export type { Position }
