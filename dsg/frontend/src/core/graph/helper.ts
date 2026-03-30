import { Cell, Edge, Node, Size } from '@antv/x6'
import { debounce } from 'lodash'
import enUS from 'antd/lib/locale/en_US'
import zhCN from 'antd/lib/locale/zh_CN'
import zhTW from 'antd/lib/locale/zh_TW'
import { Portal } from '@antv/x6-react-shape'
import { getLanguage, nameReg } from '@/utils'

/**
 * 忽略引起历史变更的一些操作
 */
const IgnoreHistoryAction: Array<string> = [
    // 边的高亮操作
    'attrs/line/stroke',
]

enum shapeType {
    // 自定义节点
    InputNode = 'input_node',

    // 阶段
    Stage = 'stage',

    // 边
    // Edge = 'edge',

    // 任务节点
    TaskNode = 'task_node',

    // 场景节点
    SceneNode = 'scene-analysis-node',
}

enum SaveStatus {
    // 正常
    Normal = 'norma',

    // 保存中
    Saving = 'saving',

    // 保存成功
    Saved = 'saved',
}

enum ContextMenu {
    // 编辑
    Edit = 'edit',
    // 复制
    Copy = 'copy',
    // 删除
    Delete = 'delete',
}

const SaveStatusMassage = {
    [SaveStatus.Normal]: '',
    [SaveStatus.Saving]: '正在存为草稿',
    [SaveStatus.Saved]: '更改已存为草稿',
}
/**
 * 节点状态
 * @param 正常
 * @param 错误
 */
enum ValidateResult {
    Normal = 'normal',
    NonCompliant = 'non-compliant',
    NodeConfigInfoIsNone = 'nodeConfigInfoIsNone',
    NodeNoEdge = 'nodeNoEdge',
    NodeNoStage = 'nodeNoStage',
    NodeNameRepeat = 'nodeNameRepeat',
    NodeRoleMissing = 'discard',
}

/**
 * 错误信息
 */
const ErrorMessage = {
    [ValidateResult.NonCompliant]: '仅支持中英文、数字、下划线及中划线',
}

/**
 * 右键菜单默认选项
 */
const DefaultItems = {
    [ContextMenu.Edit]: {
        label: '编辑节点配置',
        key: 'edit',
    },
    [ContextMenu.Copy]: {
        label: '复制',
        key: 'copy',
    },
    [ContextMenu.Delete]: {
        label: '删除',
        key: 'delete',
    },
}

/**
 * 默认连接桩配置
 */
const deafultPorts = {
    groups: {
        top: {
            position: 'top',
            markup: [
                {
                    tagName: 'rect',
                    selector: 'wrap',
                },
                {
                    tagName: 'circle',
                    selector: 'point',
                },
            ],
            attrs: {
                wrap: {
                    width: 24,
                    height: 24,
                    x: -12,
                    y: -12,
                    magnet: true,
                    fill: 'none',
                },
                point: {
                    r: 5,
                    magnet: true,
                    stroke: 'none',
                    strokeWidth: 1,
                    fill: 'none',
                },
            },
        },
        bottom: {
            position: 'bottom',
            markup: [
                {
                    tagName: 'rect',
                    selector: 'wrap',
                },
                {
                    tagName: 'circle',
                    selector: 'point',
                },
            ],
            attrs: {
                wrap: {
                    width: 24,
                    height: 24,
                    x: -12,
                    y: -12,
                    magnet: true,
                    fill: 'none',
                },
                point: {
                    r: 5,
                    magnet: true,
                    stroke: 'none',
                    strokeWidth: 1,
                    fill: 'none',
                },
            },
        },
        left: {
            position: 'left',
            markup: [
                {
                    tagName: 'rect',
                    selector: 'wrap',
                },
                {
                    tagName: 'circle',
                    selector: 'point',
                },
            ],
            attrs: {
                wrap: {
                    width: 24,
                    height: 24,
                    x: -12,
                    y: -12,
                    magnet: true,
                    fill: 'none',
                },
                point: {
                    r: 5,
                    magnet: true,
                    stroke: 'none',
                    strokeWidth: 1,
                    fill: 'none',
                },
            },
        },
        right: {
            position: 'right',
            markup: [
                {
                    tagName: 'rect',
                    selector: 'wrap',
                },
                {
                    tagName: 'circle',
                    selector: 'point',
                },
            ],
            attrs: {
                wrap: {
                    width: 24,
                    height: 24,
                    x: -12,
                    y: -12,
                    magnet: true,
                    fill: 'none',
                },
                point: {
                    r: 5,
                    magnet: true,
                    stroke: 'none',
                    strokeWidth: 1,
                    fill: 'none',
                },
            },
        },
    },
    items: [
        {
            group: 'top',
        },
        {
            group: 'right',
        },
        {
            group: 'bottom',
        },
        {
            group: 'left',
        },
    ],
}

const StageDataTemplate = {
    shape: shapeType.Stage,
    width: 300,
    height: 500,
    position: {
        x: 0,
        y: 0,
    },
    data: {
        name: '阶段',
    },
    zIndex: 1,
}

/**
 * 节点模版
 */
const InputNodeTemplate = {
    shape: shapeType.InputNode,
    width: 240,
    height: 44,
    position: {
        x: 60,
        y: 60,
    },
    ports: { ...deafultPorts },
    data: {
        name: '节点',
        node_config: {
            start_mode: '',
            completion_mode: 'auto',
        },
        task_config: {
            exec_role_id: '',
        },
        status: ValidateResult.Normal,
    },
    zIndex: 99,
}

/**
 * 获取相同形状的节点
 * @param nodes 节点数据
 * @param type 节点形状的
 * @returns cell 新的节点数组
 */
const getNodesByShape = (nodes: Array<Node>, shape: shapeType) => {
    return nodes.filter((node) => {
        return node.shape === shape
    })
}

/**
 * 判断节点形状是否一致
 * @param node 节点数据
 * @param type 节点形状的
 */
const checkNodeWithShape = (node: Node, shape: shapeType): boolean => {
    return node.shape === shape
}

/**
 * 计算新增阶段坐标，并且移动其他节点
 * @param stages 所有阶段
 * @param condition 新增条件
 * @returns 返回坐标
 */
const getNewStagePosition = (
    stages: Array<Node>,
    condition?: {
        node: Node
        site: 'left' | 'right'
    },
    nodes?: Array<Node>,
) => {
    if (!stages.length) {
        return {
            x: 600,
            y: 150,
        }
    }
    if (condition) {
        const { x, y } = condition.node.position()
        if (condition.site === 'left') {
            const leftNodes = getCurrentLeftNodes(stages, condition.node)

            leftNodes.forEach(async (leftNode) => {
                const rx = -calculateLeftOffsetSize(
                    leftNodes,
                    condition.node,
                    300,
                )
                await moveNodeByPosition(leftNode, rx)
                if (nodes) {
                    await moveChildrenNodes(leftNode, nodes, rx)
                }
            })

            return {
                x: x - 300,
                y,
            }
        }
        const rightNodes = getCurrentRightNodes(stages, condition.node)
        rightNodes.forEach(async (rightNode) => {
            const rx = calculateRightOffsetSize(rightNodes, condition.node, 300)
            await moveNodeByPosition(rightNode, rx)
            if (nodes) {
                await moveChildrenNodes(rightNode, nodes, rx)
            }
        })
        return {
            x: x + condition.node.size().width,
            y,
        }
    }
    const lastStage = getLastStage(stages)
    const { x, y } = lastStage.position()
    return {
        x: x + lastStage.size().width,
        y,
    }
}

/**
 * 获取第一个阶段
 * @param stages 所有阶段
 * @returns 第一个阶段
 */
const getHeadStage = (stages: Array<Node>): Node => {
    return stages.reduce((preData: Node, currentData: Node) => {
        if (preData) {
            const preSite = preData.position()
            const currentSite = currentData.position()
            return preSite.x > currentSite.x ? currentData : preData
        }
        return currentData
    })
}

/**
 * 获取最后一个阶段
 * @param stages 所有阶段
 * @returns 最后一个阶段
 */
const getLastStage = (stages: Array<Node>): Node => {
    return stages.reduce((preData: Node, currentData: Node) => {
        if (preData) {
            const preSite = preData.position()
            const currentSite = currentData.position()
            return currentSite.x > preSite.x ? currentData : preData
        }
        return currentData
    })
}

/**
 *获取指定的左边节点
 * @param nodes 所有节点
 * @param node 指定节点
 * @returns 左边的节点
 */
const getCurrentLeftNodes = (nodes: Array<Node>, node: Node): Array<Node> => {
    const nodeSite = node.position()
    return nodes.filter((currentNode) => {
        const currenctSite = currentNode.position()
        return nodeSite.x > currenctSite.x
    })
}

/**
 *获取指定的右边节点
 * @param nodes 所有节点
 * @param node 指定节点
 * @returns 右边节点
 */
const getCurrentRightNodes = (nodes: Array<Node>, node: Node): Array<Node> => {
    const nodeSite = node.position()
    return nodes.filter((currentNode) => {
        const currenctSite = currentNode.position()
        return currenctSite.x > nodeSite.x
    })
}

/**
 *  节点移动
 * @param node 节点
 * @param rx x 轴偏移
 * @param ry  y 轴偏移
 */
const moveNodeByPosition = async (
    node: Node,
    rx: number = 0,
    ry: number = 0,
) => {
    const { x, y } = await node.position()
    await node.position(x + rx, y + ry)
}

/**
 * 获取所有节点的x轴的位置
 * @param nodes 节点数组
 * @returns 节点x坐标数组
 */
const getNodesX = (nodes: Array<Node>): Array<number> => {
    return nodes.map((node) => {
        return node.position().x
    })
}

/**
 * 获取节点尾部x坐标
 * @param nodes 节点数
 * @returns 节点尾部x坐标数组
 */
const getNodesTailX = (nodes: Array<Node>): Array<number> => {
    return nodes.map((node) => {
        return node.position().x + node.size().width
    })
}

/**
 * 计算节点的右偏移量
 * @param nodes 影响到的节点
 * @param node 相对节点
 * @param width 增加的长度
 * @returns 偏移量
 */
const calculateRightOffsetSize = (
    nodes: Array<Node>,
    node: Node,
    width: number,
) => {
    if (!nodes.length) {
        return 0
    }
    const nodesX = getNodesX(nodes)
    const crossNodeX = nodesX.filter((nodeX) => {
        return node.position().x + node.size().width + width > nodeX
    })
    if (crossNodeX.length) {
        return (
            node.position().x + node.size().width + width - crossNodeX.sort()[0]
        )
    }
    return 0
}

/**
 * 计算节点的左偏移量
 * @param nodes 影响到的节点
 * @param node 相对节点
 * @param width 增加的长度
 * @returns 偏移量
 */
const calculateLeftOffsetSize = (
    nodes: Array<Node>,
    node: Node,
    width: number,
) => {
    if (!nodes.length) {
        return 0
    }
    const nodesX = getNodesTailX(nodes)
    const crossNodeX = nodesX.filter((nodeX) => {
        return nodeX > node.position().x - width
    })
    if (crossNodeX.length) {
        return width - (node.position().x - crossNodeX.sort((a, b) => b - a)[0])
    }
    return 0
}

/**
 * 缩放节点导致节点移动
 * @param node 当前节点
 * @param nodes 所有节点
 */
const changeStageSize = async (node: Node, stages: Array<Node>, nodes) => {
    const leftNodes = getCurrentLeftNodes(stages, node)
    const rightNodes = getCurrentRightNodes(stages, node)
    const leftRX = calculateLeftOffsetSize(leftNodes, node, 0)
    const rightRX = calculateRightOffsetSize(rightNodes, node, 0)
    if (leftRX) {
        leftNodes.forEach(async (leftNode) => {
            await moveNodeByPosition(leftNode, -leftRX)
            await moveChildrenNodes(leftNode, nodes, -leftRX)
        })
    }
    if (rightRX) {
        rightNodes.forEach(async (rightNode) => {
            await moveNodeByPosition(rightNode, rightRX)
            await moveChildrenNodes(rightNode, nodes, rightRX)
        })
    }
}

/**
 * 横向移动子元素
 * @param stageNode 阶段节点
 * @param nodes 所有节点
 * @param rx 偏移量
 */
const moveChildrenNodes = async (
    stageNode: Node,
    nodes: Array<Node>,
    rx: number,
) => {
    const children = stageNode.getChildren()
    if (children) {
        const childrenNodes = changeCellsToNodes(children, nodes)
        await childrenNodes?.forEach(async (childNode) => {
            await moveNodeByPosition(childNode, rx)
        })
    }
}

/**
 * 根据子元素获取子节点
 * @param cells 元素
 * @param allNodes 节点
 * @returns 返回子节点
 */
const changeCellsToNodes = (cells: Array<Cell>, allNodes: Array<Node>) => {
    const cellsId = cells.map((cell) => cell.id)
    return allNodes.filter((node) => cellsId.includes(node.id))
}

/**
 * 检查游离节点
 * @param nodes Array<Node> 节点集合
 * @param edges Array<Edge> 边集合
 * @returns Array<Node> 违规节点
 */
const checkNodesNoEdges = (
    nodes: Array<Node>,
    edges: Array<Edge>,
): Array<Node> => {
    const freeArr: Node[] = []
    nodes.forEach((n) => {
        const num = getNumberForEdges(n, edges)
        if (num === 0) {
            freeArr.push(n)
        }
    })
    return freeArr
}

/**
 * 获取每个节点的连接边个数
 * @param node Node 节点
 * @param edges Array<Edge> 边集合
 * @returns number 连接边个数
 */
const getNumberForEdges = (node: Node, edges: Array<Edge>): number => {
    let num = 0
    edges.forEach((e) => {
        const source = e.getSourceNode()
        const target = e.getTargetNode()
        if (source?.id === node.id) {
            num += 1
        }
        if (target?.id === node.id) {
            num += 1
        }
    })
    return num
}

/**
 * 获取节点的子节点
 * @param node Node 节点
 * @returns Cell<Cell.Properties>[] 所有子节点集合
 */
const getNodeChildren = (node: Node): Cell<Cell.Properties>[] => {
    const { children } = node
    return children || []
}

/**
 * 获取节点的父节点
 * @param node Node 节点
 * @returns Cell<Cell.Properties> | null 父节点
 */
const getNodeParent = (node: Node): Cell<Cell.Properties> | null => {
    const { parent } = node
    return parent
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
 * 计算新增节点坐标
 * @param nodes 所有阶段
 * @param center?  { x: number; y: number } 中心位置
 * @param prePosition? any 前一个位置记录
 * @returns 返回坐标
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
/**
 * 校验文本信息
 * @param value 文本内容
 * @returns 校验结果
 */
const getValidateResult = (value: string) => {
    if (value && !nameReg.test(value)) {
        return ValidateResult.NonCompliant
    }
    return ValidateResult.Normal
}

/**
 * 检查阶段是否重名
 * @param stages
 * @returns false 无重名，true 存在重名
 */
const checkRepeatStageName = (stages: Array<Node>) => {
    if (!stages.length || stages.length === 1) {
        return false
    }
    return !!stages.find((stage) => {
        return stages.find((data) => {
            return stage.id !== data.id && stage.data.name === data.data.name
        })
    })
}

/**
 *消息防抖
 * @param message 消息执行
 * @returns false
 */
const messageDebounce = (wait: number) => {
    let timer: any = 0
    return (message: () => void) => {
        if (!timer) {
            timer = setTimeout(() => {
                clearTimeout(timer)
                timer = 0
            }, wait)
            message()
        }
    }
}

/** hex -> rgba
 * @param {Object} hex
 * @param {Object} opacity
 */
const hexToRgba = (color: string, opacity: string) => {
    return `rgba(${parseInt(`0x${color.slice(1, 3)}`, 16)}, ${parseInt(
        `0x${color.slice(3, 5)}`,
        16,
    )},${parseInt(`0x${color.slice(5, 7)}`, 16)}, ${opacity}) `
}

/**
 * 给子节点设置父节点
 * @param stage
 * @param nodes
 */
const setStageIsParents = (stage: Node, nodes: Array<Node>) => {
    nodes.forEach((node) => {
        if (!node.hasParent()) {
            stage.embed(node)
        }
    })
}

/**
 * 获取当前阶段中的所有节点
 * @param stage 阶段
 * @param allNodes 所有节点
 * @returns 容器中的节点
 */
const getContainerNodes = (stage: Node, allNodes: Array<Node>) => {
    const inputNodes = getNodesByShape(allNodes, shapeType.InputNode)
    const stageShapeInfo = getNodeShapeParam(stage)
    return inputNodes.filter((node) => {
        const nodeShapeInfo = getNodeShapeParam(node)
        return (
            stageShapeInfo.x <= nodeShapeInfo.x &&
            nodeShapeInfo.rightX <= stageShapeInfo.rightX &&
            stageShapeInfo.y <= nodeShapeInfo.y &&
            nodeShapeInfo.bottomY <= stageShapeInfo.bottomY
        )
    })
}

/**
 * 获取当前节点所在的所有阶段
 * @param node 节点
 * @param allNodes 所有节点
 * @returns 所在的所有阶段
 */
const getNodeContainer = (node: Node, allNodes: Array<Node>) => {
    const stageNodes = getNodesByShape(allNodes, shapeType.Stage)
    const nodeShapeInfo = getNodeShapeParam(node)
    return stageNodes.filter((stage) => {
        const stageShapeInfo = getNodeShapeParam(stage)
        return (
            stageShapeInfo.x <= nodeShapeInfo.x &&
            nodeShapeInfo.rightX <= stageShapeInfo.rightX &&
            stageShapeInfo.y <= nodeShapeInfo.y &&
            nodeShapeInfo.bottomY <= stageShapeInfo.bottomY
        )
    })
}

/**
 *获取节点的形状信息
 * @param node 节点
 * @returns {x 坐标， y坐标， 右侧x坐标， 底部y坐标}
 */
const getNodeShapeParam = (node: Node) => {
    const { x, y } = node.position()
    const { width, height } = node.size()
    return {
        x,
        y,
        rightX: x + width,
        bottomY: y + height,
    }
}

/**
 * 检查重名节点
 * @param stages
 * @returns false 无重名，true 存在重名
 */
const checkRepeatNodeName = (nodes: Array<Node>) => {
    if (!nodes.length || nodes.length === 1) {
        return []
    }
    return nodes.filter((node) =>
        nodes.find(
            (data) => node.id !== data.id && node.data.name === data.data.name,
        ),
    )
}

/**
 * 画布语言处理
 * @returns
 */
const getAntdLocal = () => {
    const language: string = getLanguage() || 'zh-cn'
    switch (language) {
        case 'zh-cn':
            return zhCN

        case 'zh-tw':
            return zhTW

        default:
            return enUS
    }
}

const X6PortalProvider = Portal.getProvider()

export {
    IgnoreHistoryAction,
    shapeType,
    ValidateResult,
    SaveStatus,
    ContextMenu,
    StageDataTemplate,
    InputNodeTemplate,
    ErrorMessage,
    SaveStatusMassage,
    DefaultItems,
    getNodesByShape,
    getNewStagePosition,
    getHeadStage,
    getCurrentLeftNodes,
    getCurrentRightNodes,
    moveNodeByPosition,
    getLastStage,
    calculateLeftOffsetSize,
    calculateRightOffsetSize,
    changeStageSize,
    checkNodesNoEdges,
    checkNodeWithShape,
    getNodeChildren,
    getNodeParent,
    getNewNodePosition,
    getValidateResult,
    checkRepeatStageName,
    messageDebounce,
    hexToRgba,
    getContainerNodes,
    setStageIsParents,
    getNodeContainer,
    checkRepeatNodeName,
    getAntdLocal,
    X6PortalProvider,
}
