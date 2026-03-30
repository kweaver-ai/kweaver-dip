/* eslint-disable no-await-in-loop */
import { InfoCircleFilled, QuestionCircleOutlined } from '@ant-design/icons'
import { Edge, Graph, Node, StringExt } from '@antv/x6'
import { Tooltip } from 'antd'
import { find, omit, trim } from 'lodash'

import {
    IFormula,
    IFormulaFields,
    checkSceneAnalysisName,
    dataTypeMapping,
    execCustomViewSqlRequest,
    formatError,
    getBusinessObjDefine,
    getDataEleDetailById,
    getDatasheetViewDetails,
    getErrorMessage,
    getExecSqlRequest,
    getVirtualEngineExample,
    runSceneView,
} from '@/core'
import { info as modalInfo } from '@/utils/modalHelper'
import {
    FieldErrorType,
    FieldTypes,
    FormulaError,
    FormulaType,
    NodeDataType,
    fieldInfos,
    formulaInfo,
    groupDate,
    sceneNodeTemplate,
} from './const'
import { FieldsData } from './FieldsData'
import Icons from './Icons'
import __ from './locale'

import { handleRunSqlParam, splitDataType } from './UnitForm/helper'

const sceneAlsDataType = [
    {
        id: 1,
        value: '字符型',
        value_en: 'char',
    },
    {
        id: 10,
        value: '整数型',
        value_en: 'int',
    },
    {
        id: 8,
        value: '小数型',
        value_en: 'float',
    },
    {
        id: 7,
        value: '高精度型',
        value_en: 'decimal',
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
        id: 9,
        value: '时间型',
        value_en: 'time',
    },
    // {
    //     id: 0,
    //     value: '数字型',
    //     value_en: 'number',
    // },
    // {
    //     id: 4,
    //     value: '时间戳型',
    //     value_en: 'timestamp',
    // },
    {
        id: 5,
        value: '布尔型',
        value_en: 'bool',
    },
    // {
    //     id: 99,
    //     value: '其他',
    //     value_en: 'binary',
    // },
]

/**
 * 转换目录信息项类型到大类型
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

const sceneAnalFormatError = (
    navigator,
    e: any,
    onOk?: () => void,
    text: string = '无法编辑',
) => {
    if (e?.data?.code === 'SceneAnalysis.Scene.SceneNotExist') {
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
const getFormulaMenuItem = (type: FormulaType) => ({
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
                title={formulaInfo[type].featureTip}
                overlayStyle={{ minWidth: type === FormulaType.SQL ? 276 : 0 }}
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
            if (type === FormulaType.DISTINCT) {
                return __('数据去重算子前需存在算子或节点的数据输入')
            }
            if (type === FormulaType.WHERE) {
                return __('数据过滤算子前需存在算子或节点的数据输入')
            }
            if (type === FormulaType.OUTPUTVIEW) {
                return __('输出融合表算子前需存在算子或节点的数据输入')
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
                return __('输出融合表算子前只能存在一个算子或节点的数据输入')
            }
            return __('缺少前序算子数据的输入，请先调整前序算子')
        case FormulaError.IndexError:
            // if (type === FormulaType.WHERE) {
            //     return __('数据过滤算子不能作为节点中的第一个算子')
            // }
            if (type === FormulaType.SQL) {
                return __('SQL算子前不能有数据合并、数据关联算子')
            }
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
        default:
            return err
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
 * @initailName 初始名称
 * @flag 创建或添加
 * @returns 新创建的节点
 */
const createNodeInGraph = (
    graph: Graph,
    position?: Position,
    type?: FormulaType,
    node?: Node[],
    initailName?: string,
    flag: 'create' | 'add' = 'add',
) => {
    const newId = StringExt.uuid()
    // 前序节点相关信息
    let preNodeId: string[] = []
    if (node && node.length > 0) {
        preNodeId = node.map((item) => item.id)
    }
    // 算子相关信息
    const num = getNodeNameRepeat(graph, __('未命名'))
    let formulaData: any = {
        name: num > 0 ? `${__('未命名')}_${num}` : __('未命名'),
    }
    if (initailName) {
        formulaData.name = initailName
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
                src: preNodeId,
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
            src: preNodeId,
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
    return runSceneView(10, 1, params, false, 'data_fusion')
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
                fieldsData.addExampleData(
                    formulaItem!.id,
                    exaData,
                    res?.columns,
                    cover,
                )
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
                            data_type: findItem.data_type,
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
    userInfo: any,
    inViewMode: boolean = false,
    updateConfig: boolean = false,
) => {
    const { formula } = node.data
    const { config, id } = formulaItem
    let outData: IFormulaFields[] = []
    let totalData: IFormulaFields[] = []
    let errorMsg: any
    const newConfig: any = config
    let isExist = true
    if (config) {
        const { form_id, config_fields, other } = config
        if (form_id) {
            try {
                const cid = other.catalogOptions.id
                const logicViewInfo = await getDatasheetViewDetails(form_id)
                // const res = await getInfoItems(cid, { limit: 0 })
                if (logicViewInfo) {
                    const tempEntries =
                        logicViewInfo.fields
                            ?.filter(
                                (item) =>
                                    changeTypeToLargeArea(item.data_type) !==
                                        FieldTypes.BINARY &&
                                    item.data_type !== null &&
                                    item.data_type !== '',
                            )
                            ?.map((item) => ({
                                ...item,
                                data_type: changeTypeToLargeArea(
                                    item.data_type,
                                ),
                                name_en: item.technical_name,
                                info_item_business_name: item?.business_name,
                                form_view_id: form_id,
                            })) || []
                    totalData = tempEntries?.map((item) => ({
                        alias: item.business_name,
                        id: item.id,
                        name: item.business_name,
                        sourceId: node.id,
                        originName: item.business_name,
                        // data_type: changeTypeToLargeArea(item.data_type),
                    }))
                    const { totalFields, selectedFields, errorFields } =
                        checkSortAndRenameFields(totalData, config_fields)
                    if (errorFields.length > 0 || selectedFields.length === 0) {
                        errorMsg = FormulaError.ConfigError
                    } else {
                        outData = selectedFields
                    }
                    totalData = totalFields
                    fieldsData.addData(tempEntries)
                    if (!inViewMode) {
                        // 存储样例数据
                        storeExampleData(
                            graph,
                            node,
                            fieldsData,
                            formulaItem,
                            userInfo,
                            { ...logicViewInfo, id: form_id },
                        )
                    }
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
    if (config) {
        const { form_id, config_fields } = config
        if (form_id) {
            try {
                const res = await getDatasheetViewDetails(form_id)
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
                        data_type: changeTypeToLargeArea(item.data_type),
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
            } catch (error) {
                if (
                    [
                        'DataCatalog.Public.DataSourceNotFound',
                        'DataCatalog.Public.ResourceNotExisted',
                        'DataCatalog.Public.AssetOfflineError',
                        'DataView.FormView.FormViewIdNotExist',
                    ].includes(error?.data?.code)
                ) {
                    isExist = false
                    errorMsg = FormulaError.ConfigError
                } else {
                    errorMsg = getErrorMessage({ error })
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
        // const pre1 = getPreorderNode(
        //     nodes,
        //     nodes.find((info) => info.id === src[0]),
        // )
        // const pre2 = getPreorderNode(
        //     nodes,
        //     nodes.find((info) => info.id === src[1]),
        // )
        // if (
        //     (pre1[0].data.formula[0]?.config?.form_id || '1') ===
        //     (pre2[0].data.formula[0]?.config?.form_id || '2')
        // ) {
        //     errorMsg = FormulaError.MoreLine
        // } else {
        // 前序节点
        const preNodes: Node[] =
            node?.data.src.map((info) => graph!.getCellById(info) as Node) || []
        let tempPreNodes: Node[] = preNodes
        if (
            !preNodes.length ||
            !preNodes.every((info) => info.data?.output_fields.length > 0)
        ) {
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
                                    name: findItem.alias || a.name,
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
                                name: findItem.alias || a.name,
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
    // }
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
const checkIndicatorFormulaConfig = (
    graph: Graph,
    node: Node,
    formulaItem: IFormula,
    fieldsData: FieldsData,
) => {
    const { config, id } = formulaItem
    const { formula, src } = node.data
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
        const preNodes =
            node?.data.src.map((info) => graph!.getCellById(info) as Node) || []
        preOutData = preNodes?.[0]?.data?.output_fields || []
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
            if (
                !measureField ||
                (measureField?.data_type ||
                    fieldsData.data.find((info) => info.id === measureField?.id)
                        ?.data_type) !==
                    (measure?.field?.data_type ||
                        fieldsData.data.find(
                            (info) => info.id === measure?.field?.id,
                        )?.data_type)
            ) {
                errorMsg = FormulaError.ConfigError
            } else {
                // 分组
                let groupDelError = false
                let groupTypeError = false
                const groupField = group?.map((info) => {
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
                        if (findItemDataType !== infoFieldDataType) {
                            const itemDate = groupDate.includes(
                                infoFieldDataType as FieldTypes,
                            )
                            const infoDate = groupDate.includes(
                                findItemDataType as FieldTypes,
                            )
                            if (
                                (itemDate && !infoDate) ||
                                (!itemDate && infoDate)
                            ) {
                                groupTypeError = true
                            }
                        }
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
    return { preOutData, outData }
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
                    if (
                        preNodes.length === 1 &&
                        preNodes[0]?.data?.output_fields.length > 0
                    ) {
                        return {
                            ...a,
                            name: a?.alias || a.name,
                            source_node_id: preNodes[0]?.id,
                        }
                    }
                    return { ...a, name: a?.alias || a.name }
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
        const preNodes =
            node?.data?.src?.map((info) => graph!.getCellById(info) as Node) ||
            []
        let tempPreNodesId: string[] = preNodes
            .map((info) => info?.id)
            .filter((info) => !!info)
        if (
            !preNodes.length ||
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
                            original_name:
                                findItem?.original_name ||
                                fieldsData.data.find(
                                    (c) => findItem.id === c.id,
                                )?.original_name,
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
                const findItem = preOutData.find(
                    (pre) =>
                        pre.id === info.id && pre.sourceId === info?.sourceId,
                )
                if (!findItem) {
                    errorMsg = FormulaError.NodeChange
                    return
                }
                tempPreOutData = tempPreOutData.filter(
                    (pre) =>
                        !(
                            pre.id === info.id &&
                            pre.sourceId === info?.sourceId
                        ),
                )
                // const findItemDataType =
                //     findItem?.data_type ||
                //     fieldsData.data.find((a) => a.id === findItem.id)?.data_type
                // if (findItemDataType !== info.type) {
                //     // if (info.standard_code) {
                //     // errorMsg = FormulaError.ConfigError
                //     // } else {
                //     errorMsg = FormulaError.NodeChange
                //     // }
                // }
            })
            if (!errorMsg) {
                if (tempPreOutData.length > 0) {
                    errorMsg = FormulaError.NodeChange
                } else {
                    outData = config_fields!.map((a) => {
                        // const tempItem = omit(a, [
                        //     'standard_code',
                        //     'standard_name',
                        //     'dict_id',
                        //     'dict_name',
                        //     'primary_key',
                        //     'editError',
                        //     'standard_deleted',
                        //     'standard_state',
                        //     'dict_deleted',
                        //     'dict_state',
                        // ]) as IFormulaFields
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
                const findItem = preOutData.find(
                    (pre) =>
                        pre.id === info.id && pre.sourceId === info?.sourceId,
                )
                if (!findItem) {
                    errorMsg = FormulaError.NodeChange
                    return
                }
                const findItemDataType =
                    findItem?.data_type ||
                    fieldsData.data.find((a) => a.id === findItem.id)?.data_type
                if (findItemDataType !== info.data_type) {
                    // if (info.standard_code) {
                    errorMsg = FormulaError.ConfigError
                    // } else {
                    //     errorMsg = FormulaError.NodeChange
                    // }
                }
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
 * sql算子
 * @node 所在节点
 * @formulaItem 当前算子
 */
const checkSQLViewFormulaConfig = async (
    graph: Graph,
    node: Node,
    formulaItem: IFormula,
    fieldsData: FieldsData,
) => {
    const { formula } = node.data
    const { config, id, output_fields = [] } = formulaItem

    let newConfig = config
    let outData: IFormulaFields[] = []
    const totalData: IFormulaFields[] = []
    let errorMsg: any
    const isExist = true

    // 前序节点
    const preNodes = node.data.src.map(
        (info) => graph!.getCellById(info) as Node,
    )
    const preNodeNames = preNodes.map((item) => item.data.name)
    // 前序算子输出字段数据
    const preAliasOutData = preNodes.reduce((acc, element) => {
        return [
            ...acc,
            ...(element.data?.output_fields?.map(
                (item) => `${element.data?.name}.${item.alias}`,
            ) || []),
        ]
    }, [])

    // 没有输出
    if (!preNodes.every((info) => info.data?.output_fields.length > 0)) {
        errorMsg = FormulaError.MissingData
    }
    // 判断是否改了前序节点的title 包括title存在以及title修改
    const configTables = config?.sqlTableArr || []
    if (
        !errorMsg &&
        !configTables.every((element) => preNodeNames.includes(element))
    ) {
        errorMsg = FormulaError.ConfigError
    }
    // 判断是否改了前序节点的字段 字段包括删除以及字段修改名称
    const configFields = config?.sqlFieldArr || []
    if (
        !errorMsg &&
        !configFields.every((element) => preAliasOutData.includes(element))
    ) {
        errorMsg = FormulaError.ConfigError
    }

    if (config) {
        if (!errorMsg) {
            const { sql_origin, sql, config_fields, sqlTableArr } = config
            const tmp = {}
            try {
                const reqs = preNodes.map((srcNode) => {
                    let preNodeArr: any = []
                    if (srcNode.data.src?.length) {
                        preNodeArr = getPreorderNode(graph.getNodes(), srcNode)
                    } else {
                        preNodeArr = [srcNode]
                    }
                    const params = getRunViewParam(preNodeArr, fieldsData)
                    return getExecSqlRequest({
                        canvas: params.canvas,
                        id: 'id',
                        type: 'data_fusion',
                    })
                })
                const res: any = await Promise.allSettled(reqs)
                res?.forEach((item, idx) => {
                    if (item?.value) {
                        const { name } = preNodes[idx].data
                        tmp[name] = item.value.exec_sql
                    }
                })

                const { sqlScriptNew, hasLimit } = handleRunSqlParam(
                    tmp,
                    sql_origin,
                )
                if (sqlScriptNew === sql?.sql_info?.sql_str) {
                    outData = config_fields || []
                    storeExampleData(graph, node, fieldsData, formulaItem)
                } else {
                    const queryParams = hasLimit
                        ? `need_count=${false}`
                        : `need_count=${false}&offset=${1}&limit=${10}`
                    try {
                        const resultResData = await execCustomViewSqlRequest(
                            {
                                sql_type: 'data_fusion',
                                exec_sql: sqlScriptNew,
                            },
                            queryParams,
                        )
                        outData = resultResData.columns.map((item) => {
                            const { name, type } = item
                            let data_type = type
                            if (data_type.includes('(')) {
                                data_type = splitDataType(type).newType
                            }
                            data_type = changeTypeToLargeArea(data_type)
                            const findItem =
                                formulaItem?.config?.config_fields?.find(
                                    (f) => f?.name_en === name,
                                )
                            return {
                                alias: name,
                                id: findItem?.id || StringExt.uuid(),
                                name,
                                sourceId: node!.id,
                                originName: name,
                                checked: true,
                                beEditing: false,
                                data_type,
                                name_en: name,
                                original_name: name,
                                formulaId: id,
                            }
                        })

                        // 将执行结果作为样例数据存储
                        const exaData = {}
                        resultResData?.columns?.forEach((item, index) => {
                            exaData[item.name] = Array.from(
                                new Set(
                                    resultResData?.data?.map((it) => it[index]),
                                ),
                            )
                        })
                        fieldsData.addExampleData(formulaItem!.id, exaData)
                    } catch (err) {
                        errorMsg = FormulaError.ConfigError
                    }
                    newConfig = {
                        ...newConfig,
                        sql: {
                            sql_info: {
                                sql_str: sqlScriptNew,
                            },
                        },
                        config_fields: outData || [],
                    }
                }
            } catch (error) {
                outData = config_fields || []
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
                        // standard_code: std.id,
                        // standard_name: standard_info.name,
                        // standard_deleted: std.deleted,
                        // standard_state: std.state,
                        name_en: standard_info.name_en,
                        canChanged: false,
                    }
                    // if (std?.dict_id) {
                    //     return {
                    //         ...field,
                    //         dict_id: std.dict_id,
                    //         dict_name: std.dict_name_cn,
                    //         dict_deleted: std.dict_deleted,
                    //         dict_state: std.dict_state,
                    //     }
                    // }
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
    userInfo,
    inViewMode?: boolean,
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
        userInfo,
        inViewMode,
    )
}

/**
 * 循环计算节点内算子
 * @graph 画布
 * @nodes 节点集合
 * @fieldsData 字段数据
 * @userInfo 用户信息
 * @ignoreFl 忽略的算子 暂不考虑
 */
const loopCalculationNodeData = async (
    graph: Graph,
    nodes: Node[],
    fieldsData: FieldsData,
    userInfo,
    inViewMode?: boolean,
    ignoreFl?: IFormula,
) => {
    for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i]
        await trackingNodeCalculation(
            graph,
            node,
            fieldsData,
            userInfo,
            inViewMode,
            ignoreFl,
        )
        const targetNodes = getTargetNodes(graph, node)
        await loopCalculationNodeData(
            graph,
            targetNodes,
            fieldsData,
            userInfo,
            inViewMode,
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
    userInfo,
    inViewMode?: boolean,
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
                                const res = await checkCatalogFormulaConfig(
                                    graph,
                                    node,
                                    item,
                                    fieldsData,
                                    userInfo,
                                    inViewMode,
                                )
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
                            outData = checkIndicatorFormulaConfig(
                                graph,
                                node,
                                item,
                                fieldsData,
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
                        case FormulaType.SQL:
                            {
                                const res = await checkSQLViewFormulaConfig(
                                    graph,
                                    node,
                                    item,
                                    fieldsData,
                                )
                                outData = res.outData
                            }
                            break
                        case FormulaType.OUTPUTVIEW:
                            outData = checkOutputViewFormulaConfig(
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
 * 获取运行库表所需的参数
 * @param preNodes 前序节点
 * @param fieldsData 字段数据
 * @param endFormula 截止的算子
 * @returns 运行库表所需的参数
 */
const getRunViewParam = (
    preNodes: Node[],
    fieldsData: FieldsData,
    endFormula?: IFormula,
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
                                name_en: b?.name_en || findItem?.name_en,
                                original_name:
                                    b?.original_name || findItem?.original_name,
                                data_type: b?.data_type || findItem?.data_type,
                            }
                        })
                        switch (type) {
                            case FormulaType.FORM:
                                return {
                                    type,
                                    output_fields: tempOutputFields,
                                    config: { form_id: config?.form_id },
                                }
                            case FormulaType.JOIN:
                                return {
                                    type,
                                    output_fields: tempOutputFields,
                                    config: {
                                        relation_type: config?.relation_type,
                                        relation_field:
                                            config?.relation_field?.map((b) => {
                                                const findItem =
                                                    fieldsData.data.find(
                                                        (c) => b?.id === c.id,
                                                    )
                                                return {
                                                    ...b,
                                                    id: b?.id || findItem?.id,
                                                    name_en:
                                                        b?.name_en ||
                                                        findItem?.name_en,
                                                    original_name:
                                                        b?.original_name ||
                                                        findItem?.original_name,
                                                    data_type:
                                                        b?.data_type ||
                                                        findItem?.data_type,
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
                                    (b) => config?.measure?.field?.id === b.id,
                                )
                                return {
                                    type,
                                    output_fields: tempOutputFields,
                                    config: {
                                        name: config?.name,
                                        measure: {
                                            ...config?.measure,
                                            field: {
                                                ...config?.measure?.field,
                                                id:
                                                    config?.measure?.field
                                                        ?.id || findItem?.id,
                                                name_en:
                                                    config?.measure?.field
                                                        ?.name_en ||
                                                    findItem?.name_en,
                                                original_name:
                                                    config?.measure?.field
                                                        ?.original_name ||
                                                    findItem?.original_name,
                                                data_type:
                                                    config?.measure?.field
                                                        ?.data_type ||
                                                    findItem?.data_type,
                                            },
                                        },
                                        group: config?.group?.map((b) => {
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
                                                    original_name:
                                                        b.field
                                                            ?.original_name ||
                                                        findItem2.original_name,
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
                                        where: config?.where?.map((b) => ({
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
                                                            findItem?.id,
                                                        name_en:
                                                            c.field?.name_en ||
                                                            findItem?.name_en,
                                                        original_name:
                                                            c.field
                                                                ?.original_name ||
                                                            findItem?.original_name,
                                                        data_type:
                                                            c.field
                                                                ?.data_type ||
                                                            findItem?.data_type,
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
                                            ...config?.merge,
                                            nodes: config?.merge?.nodes?.map(
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
                                                                        findItem?.id,
                                                                    name_en:
                                                                        c?.name_en ||
                                                                        findItem?.name_en,
                                                                    original_name:
                                                                        c?.original_name ||
                                                                        findItem?.original_name,
                                                                    data_type:
                                                                        c?.data_type ||
                                                                        findItem?.data_type,
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
                            default:
                                return a
                        }
                    }),
                output_fields: info.data.output_fields.map((a) => {
                    const findItem = fieldsData.data.find((b) => b.id === a.id)
                    return {
                        ...a,
                        id: a?.id || findItem?.id,
                        name_en: a?.name_en || findItem?.name_en,
                        original_name:
                            a?.original_name || findItem?.original_name,
                        data_type: a?.data_type || findItem?.data_type,
                    }
                }),
                src: info.data.src,
            }
        }),
    }
    return params
}

export {
    changeTypeToLargeArea,
    checkCatalogFormulaConfig,
    checkCiteViewFormulaConfig,
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
    createNodeInGraph,
    createNodeInGraphByAi,
    getFormulaErrorText,
    getFormulaItem,
    getFormulaMenuItem,
    getLogicalData,
    getNodeNameRepeat,
    getPortsByType,
    getPreorderNode,
    getRunViewParam,
    getTargetNodes,
    loopCalculationNodeData,
    modifyParamsArr,
    sceneAlsDataType,
    sceneAnalFormatError,
    storeExampleData,
    trackingCalculationAll,
}

export type { Position }
