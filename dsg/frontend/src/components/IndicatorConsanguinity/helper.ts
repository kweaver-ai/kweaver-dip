import { Edge, Graph, Node, Shape } from '@antv/x6'
import { createContext, useContext } from 'react'
import { noop, uniq } from 'lodash'
import { checkNumberRanage, ExpandStatus } from '../FormGraph/helper'
import {
    FORMNODEHEADEHEIGHT,
    IndicatorNodeType,
    LINEHEIGHT,
    LineLightStyle,
    LineNormalStyle,
    NODEHEADERY,
    NodeAttribute,
    OFFSETHEIGHT,
    ViewType,
    calculateAutomicNodeHeight,
    calculateCompositeNodeHeight,
    calculateDeriveNodeHeight,
    calculateFormNodeHeight,
    getDisplayIndex,
    getPortByNode,
    getRestrictList,
} from './const'
import __ from './locale'
import {
    TabsKey,
    atomsExpressionRegx,
    atomsFuncRegx,
    changeFuncValues,
    compositeExpressionRegx,
} from '../IndicatorManage/const'
import DataStruct from './dataStruct'

const defaultPorts = {
    groups: {
        leftPorts: {
            markup: [
                {
                    tagName: 'circle',
                    selector: 'portBody',
                },
            ],
            attrs: {
                portBody: {
                    r: 1,
                    strokeWidth: 1,
                    stroke: 'transparent',
                    fill: 'transparent',
                    magnet: true,
                    zIndex: 10,
                },
            },
            position: 'freePort',
            zIndex: 10,
        },
        rightPorts: {
            markup: [
                {
                    tagName: 'circle',
                    selector: 'portBody',
                },
            ],
            attrs: {
                portBody: {
                    r: 1,
                    strokeWidth: 1,
                    stroke: 'transparent',
                    fill: 'transparent',
                    magnet: true,
                    zIndex: 10,
                },
            },
            position: 'freePort',
            zIndex: 10,
        },
    },
}

// 数据表模板
const DataFormTemplate = {
    shape: IndicatorNodeType.DATAFORMNODE,
    width: 282,
    height: 42,
    ports: defaultPorts,
    position: {
        x: 600,
        y: 100,
    },
    data: {
        formData: null,
        type: IndicatorNodeType.DATAFORMNODE,
        // expand: ExpandStatus.Expand,
        offset: 0,
        selectedIds: [],
        // keyWord: '',
        level: 1,
        fathersId: [],
        expandFather: false,
        fatherIndex: [],
        index: 1,
        isSelected: false,
        hoverStatus: false,
    },
    zIndex: 99,
}

const IndicatorNodeTemplate = {
    shape: IndicatorNodeType.AUTOMICNODE,
    width: 280,
    height: 94,
    ports: defaultPorts,
    position: {
        x: 600,
        y: 100,
    },
    data: {
        // items: [],
        indicatorInfo: null,
        type: '',
        // expand: ExpandStatus.Expand,
        offset: 0,
        selectedIds: [],
        // keyWord: '',
        level: 1,
        fathersId: [],
        expandFather: false,
        fatherIndex: [],
        index: 1,
        isSelected: false,
        hoverStatus: false,
        selectDataType: '',
    },
    zIndex: 99,
}

/**
 * 计算新增节点坐标
 * @param nodes 所有阶段
 * @param center?  { x: number; y: number } 中心位置
 * @param prePosition? any 前一个位置记录
 * @returns 返回坐标
 */
const getNewPastePosition = (
    nodes: Array<Node>,
    center: { x: number; y: number },
    prePosition?: any,
) => {
    if (prePosition) {
        return {
            x: prePosition.x + 50,
            y: prePosition.y + 50,
        }
    }
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
    const lastNodePos = getCenterLastNode(nodes, center)
    return {
        x: lastNodePos.x + 50,
        y: lastNodePos.y + 50,
    }
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
 * 获取搜索字段
 */
const searchFieldData = (data: Array<any>, searchKey: string) => {
    if (searchKey) {
        const searchData = data.filter((item) => {
            return item.name
                .toLocaleLowerCase()
                .includes(searchKey.toLocaleLowerCase())
        })
        return searchData
    }
    return data
}

/**
 * 检查当前表是否还被其他表引用
 */
const checkCurrentFormOutFields = (outForm: Node, inForms: Array<Node>) => {
    if (inForms.length) {
        const existField = outForm.data.items.find((field) =>
            inForms.find((inform) =>
                inform.data.relationData.relations.find(
                    (relation) => relation.src_field === field.id,
                ),
            ),
        )
        return !!existField
    }
    return false
}

interface IIndicatorContext {
    // 画布实例
    graphCase: Graph | null
    // 图关系数据结构
    relationStruct: DataStruct | null
    // 展开父节点
    loadFatherNode: (node: Node) => void
    // 选择指标展示详情
    onSelectedIndictor: (detail: any) => void

    // 选择库表展示详情
    onSelectedDataView: (id: string) => void
}
// 初始化组件通信
const IndicatorContext = createContext<IIndicatorContext>({
    graphCase: null,
    loadFatherNode: noop,
    onSelectedIndictor: noop,
    onSelectedDataView: noop,
    relationStruct: null,
})

// 获取context的方法
const useIndicatorContext = () =>
    useContext<IIndicatorContext>(IndicatorContext)

/**
 * 计算节点的高度
 * @param data 节点数据
 * @param type 节点类型
 * @returns
 */
const getCurrentNodeHeight = (data: any, type: TabsKey) => {
    // TODO: 动态高度计算
    switch (type) {
        case TabsKey.ATOMS:
            if (data?.indicatorInfo?.expression) {
                return calculateAutomicNodeHeight(
                    getExpressFields(data.indicatorInfo.expression).length,
                )
            }
            return calculateAutomicNodeHeight(0)

        case TabsKey.DERIVE:
            if (data?.indicatorInfo) {
                return calculateDeriveNodeHeight(
                    getDeriveRestrictLength(data.indicatorInfo) as [
                        number,
                        number,
                    ],
                )
            }
            return calculateDeriveNodeHeight([0, 0])
        case TabsKey.RECOMBINATION:
            if (data?.indicatorInfo?.expression) {
                return calculateCompositeNodeHeight(
                    getExpressIndictors(data.indicatorInfo.expression).length,
                )
            }
            return calculateCompositeNodeHeight(0)
        default:
            if (data?.formData?.fields?.length) {
                return calculateFormNodeHeight(data.formData.fields.length)
            }
            return calculateFormNodeHeight(0)
    }
}

/**
 * 获取表达式中的id
 * @param expression
 * @returns
 */
const getExpressFields = (expression: string) => {
    const expressGroups = expression.match(atomsExpressionRegx) || []

    return uniq(
        expressGroups
            .map((item) => {
                if (atomsFuncRegx.test(item)) {
                    const funcData = changeFuncValues(item)

                    return funcData[1].replace(/[{}]/g, '')
                }
                return ''
            })
            .filter((item) => item),
    )
}

const getDeriveRestrictLength = (data) => {
    const { where_info } = data
    const isSql = where_info.sub_type === 'sql'
    if (isSql) {
        return [1, 1]
    }

    const time_restrict = where_info.date_where
    const biz_restrict = where_info.where
    const timeLength = time_restrict ? getRestrictList(time_restrict).length : 0
    const bizLength = biz_restrict ? getRestrictList(biz_restrict).length : 0
    return [timeLength, bizLength]
}
/**
 * 获取表达式中的id
 * @param expression
 * @returns
 */
const getExpressIndictors = (expression: string) => {
    const expressGroups = expression?.match(compositeExpressionRegx) || []

    return uniq(
        expressGroups
            .filter((item) => /^[{]{2}[0-9a-zA-Z-_]+[}]{2}$/.test(item))
            .map((item) => {
                return item.replace(/[{}]/g, '')
            })
            .filter((item) => item),
    )
}

/**
 * 生成数据表桩
 * @param node
 * @param fieldIds
 */
const addDataFormPorts = (
    node: Node,
    fieldIds,
    offset,
    relationStruct: DataStruct,
) => {
    let headPort
    let topPort
    let bottomPort
    node.getPorts().forEach((currentPort) => {
        if ((currentPort?.args?.position as any).y === NODEHEADERY) {
            headPort = currentPort
        } else if (
            (currentPort?.args?.position as any).y === FORMNODEHEADEHEIGHT
        ) {
            topPort = currentPort
        } else if (
            (currentPort?.args?.position as any).y ===
            calculateFormNodeHeight(11, 0) - OFFSETHEIGHT / 2
        ) {
            bottomPort = currentPort
        }
    })

    if (!fieldIds?.length) {
        if (!headPort) {
            node.addPort(
                getPortByNode('rightPorts', {
                    x: 280,
                    y: FORMNODEHEADEHEIGHT,
                }),
            )
            headPort = node.getPorts().pop()
            relationStruct.addPorts({
                nodeId: node.id,
                portId: headPort.id,
                data: node?.data?.formData,
                correlationIds: [],
                ids: [node?.data?.formData?.id],
                edgeIds: [],
            })
        } else {
            relationStruct.updatePortInfo(
                {
                    ids: [node?.data?.formData?.id],
                },
                headPort.id,
            )
        }
    }

    ;(fieldIds || []).forEach((fieldId) => {
        const portIndex = node?.data?.formData?.fields?.findIndex(
            (field) => field.id === fieldId,
        )
        const currentSite = getDisplayIndex(
            portIndex,
            10,
            offset || node?.data?.offset || 0,
        )
        if (currentSite === 'last') {
            // 顶部加桩
            if (!topPort) {
                node.addPort(
                    getPortByNode('rightPorts', {
                        x: 280,
                        y: FORMNODEHEADEHEIGHT,
                    }),
                )
                topPort = node.getPorts().pop()
                relationStruct.addPorts({
                    nodeId: node.id,
                    portId: topPort.id,
                    data: node?.data?.formData,
                    correlationIds: [],
                    ids: [fieldId],
                    edgeIds: [],
                })
            } else {
                relationStruct.updatePortInfo(
                    {
                        ids: [fieldId],
                    },
                    topPort.id,
                )
            }
        } else if (currentSite === 'next') {
            if (!bottomPort) {
                // 底部加桩
                bottomPort = node.addPort(
                    getPortByNode('rightPorts', {
                        x: 280,
                        y:
                            calculateFormNodeHeight(portIndex, 0) -
                            OFFSETHEIGHT / 2,
                    }),
                )
                bottomPort = node.getPorts().pop()
                relationStruct.addPorts({
                    nodeId: node.id,
                    portId: bottomPort.id,
                    data: node?.data?.formData,
                    correlationIds: [],
                    edgeIds: [],
                    ids: [fieldId],
                })
            } else {
                relationStruct.updatePortInfo(
                    {
                        ids: [fieldId],
                    },
                    bottomPort.id,
                )
            }
        } else {
            // 节点加桩
            node.addPort(
                getPortByNode('rightPorts', {
                    x: 280,
                    y:
                        calculateFormNodeHeight(currentSite + 1, 0) -
                        LINEHEIGHT / 2,
                }),
            )
            const port = node.getPorts().pop()
            relationStruct.addPorts({
                nodeId: node.id,
                portId: port?.id || '',
                data: node?.data?.formData,
                correlationIds: [],
                edgeIds: [],
                ids: [fieldId],
            })
        }
    })
}

/**
 * 增加连线
 * @param originId
 * @param targetId
 */
const addGraphEdge = (
    graphCase: Graph,
    targetId,
    originId,
    relationStruct: DataStruct,
    isLight: boolean = false,
) => {
    if (graphCase) {
        const targetDatas = relationStruct.portsData.filter(
            (port) => port.ids.includes(targetId) && port.correlationIds.length,
        )
        const originDatas = relationStruct.portsData.filter((port) =>
            port.ids.includes(originId),
        )
        if (targetDatas.length && originDatas.length) {
            targetDatas.forEach((targetData) => {
                const findedPort = originDatas.find((originData) =>
                    originData.ids.includes(targetData?.correlationIds[0]),
                )

                if (findedPort) {
                    const edge = new Shape.Edge({
                        source: {
                            cell: findedPort.nodeId,
                            port: findedPort.portId,
                        },
                        target: {
                            cell: targetData.nodeId,
                            port: targetData.portId,
                        },
                        attrs: {
                            line: isLight ? LineLightStyle : LineNormalStyle,
                        },
                        zIndex: 10,
                    })
                    graphCase.addEdge(edge)
                    relationStruct.addEdge({
                        edge,
                        sourcePortId: findedPort.portId,
                        sourceNodeId: findedPort.nodeId,
                        targetNodeId: targetData.nodeId,
                        targetPortId: targetData.portId,
                    })
                }
            })
        }
    }
}

/**
 * 查找父级连接状态
 * @param IndictorId
 * @param ids
 * @param relationStruct
 */
const handleSelectedIndictorLastNode = (id, relationStruct: DataStruct) => {
    // const linkDatas = relationStruct.getLinksData(id)
}

/**
 * 向下查找选中的节点
 * @param id
 * @param relationStruct
 */
const handleSelectedIndictorData = (id: string, relationStruct: DataStruct) => {
    // 查找数据的归属节点
    const idBelongNode = relationStruct.getNodeByDataId(id)
    idBelongNode.replaceData({
        ...idBelongNode.data,
        selectedIds: [...idBelongNode.data.selectedIds, id],
    })
    if (
        idBelongNode.data.type !== IndicatorNodeType.DATAFORMNODE &&
        idBelongNode.data.expandFather
    ) {
        // 获取当前数据的归属节点的链接父级的桩
        const portData = relationStruct
            .getPortsByNodeId(idBelongNode.id)
            .filter((port) => port.correlationIds.length)
        if (portData.length) {
            portData.forEach((currentData) => {
                // 只获取当前节点用到的边
                const connectEdges = relationStruct
                    .getLineByChildId(currentData.correlationIds[0])
                    .filter(
                        (edgeData) =>
                            edgeData.targetNodeId === currentData.nodeId,
                    )
                if (connectEdges?.length) {
                    changeEdgeAttrSelected(
                        connectEdges.map((currentEdge) => currentEdge.edge),
                    )
                }
                // 递归寻找下一级的数据
                handleSelectedIndictorData(
                    currentData.correlationIds[0],
                    relationStruct,
                )
            })
        }
    }
}

/**
 * 选中节点的样式
 * @param id
 * @param node
 * @param relationStruct
 */
const handleSelectItem = (
    id: string,
    node: Node,
    relationStruct: DataStruct,
) => {
    changeEdgeAttrUnSelected(
        relationStruct.edgesData.map((currentEdge) => currentEdge.edge),
    )
    relationStruct.clearNodeSelected()
    node.replaceData({
        ...node.data,
        selectedIds: [id],
    })
    if (node.data.expandFather) {
        // 只获取当前节点用到的边
        const connectEdges = relationStruct
            .getLineByChildId(id)
            .filter((edgeData) => edgeData.targetNodeId === node.id)
        if (connectEdges?.length) {
            // 向父级选中节点
            changeEdgeAttrSelected(
                connectEdges.map((edgeData) => edgeData.edge),
            )
        }
        handleSelectedIndictorData(id, relationStruct)
    }
}

/**
 * 更新边属性为选中状态
 * @param edges
 */
const changeEdgeAttrSelected = (edges: Array<Edge>) => {
    edges.forEach((edge) => {
        edge.attr('line', LineLightStyle)
    })
}

/**
 * 取消边属性为选中状态
 * @param edges
 */
const changeEdgeAttrUnSelected = (edges: Array<Edge>) => {
    edges.forEach((edge) => {
        edge.attr('line', LineNormalStyle)
    })
}

const handleSelectedNode = (
    id: string,
    node: Node,
    relationStruct: DataStruct,
) => {
    if (!node.data.isBase) {
        relationStruct.clearNodeSelected()
        changeEdgeAttrUnSelected(
            relationStruct.edgesData.map((currentEdge) => currentEdge.edge),
        )
        node.replaceData({
            ...node.data,
            selectedIds: [id],
        })
        if (node.data.expandFather) {
            const portData = relationStruct
                .getPortsByNodeId(node.id)
                .filter((port) => port.correlationIds.length)
            if (portData.length) {
                portData.forEach((currentData) => {
                    // 只获取当前节点用到的边
                    const connectEdges = relationStruct
                        .getLineByChildId(currentData.correlationIds[0])
                        .filter(
                            (edgeData) =>
                                edgeData.targetNodeId === currentData.nodeId,
                        )
                    if (connectEdges?.length) {
                        changeEdgeAttrSelected(
                            connectEdges.map((currentEdge) => currentEdge.edge),
                        )
                    }
                    // 递归寻找下一级的数据
                    handleSelectedIndictorData(
                        currentData.correlationIds[0],
                        relationStruct,
                    )
                })
            }
        }
        const connectChildren = relationStruct.getLineByChildId(id)
        if (connectChildren.length) {
            connectChildren.forEach((currentChild) => {
                const childrenNode = relationStruct.nodes.find(
                    (item) => item.id === currentChild.targetNodeId,
                )
                childrenNode?.replaceData({
                    ...childrenNode.data,
                    selectedIds: [...childrenNode.data.selectedIds, id],
                })
            })
            changeEdgeAttrSelected(
                connectChildren.map((currentEdge) => currentEdge.edge),
            )
        }
    }
}

export {
    DataFormTemplate,
    IndicatorNodeTemplate,
    getNewPastePosition,
    searchFieldData,
    checkCurrentFormOutFields,
    defaultPorts,
    IndicatorContext,
    useIndicatorContext,
    getExpressFields,
    getExpressIndictors,
    getCurrentNodeHeight,
    addDataFormPorts,
    addGraphEdge,
    handleSelectedIndictorLastNode,
    changeEdgeAttrSelected,
    changeEdgeAttrUnSelected,
    handleSelectedIndictorData,
    handleSelectItem,
    handleSelectedNode,
}
