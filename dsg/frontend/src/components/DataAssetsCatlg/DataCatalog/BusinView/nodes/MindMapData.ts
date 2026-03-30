import {
    commonNodeStyleInfo,
    BusinNodeType,
    NodeType,
    businNodeTypeToNodeType,
} from './helper'

/**
 * 画布数据对象
 */
export default class MindMapData {
    // 节点ID
    id?: string

    // 资源type
    type?: BusinNodeType

    // 节点类型
    nodeType: NodeType

    // 节点宽度
    width: number

    // 节点高度
    height: number

    // 折叠状态
    collapsed: boolean = false

    // 业务信息
    dataInfo?: { [key: string]: any }

    // 子节点
    children?: MindMapData[]

    // 父节点ID
    parentId?: string

    // 临时节点
    isTemp: boolean = false

    constructor(data) {
        this.id = data.id
        this.type = data.type
        this.nodeType = data.nodeType
        this.width =
            data.width ||
            businNodeTypeToNodeType[data.type]?.nodeStyle?.width ||
            commonNodeStyleInfo.width
        this.height =
            data.height ||
            businNodeTypeToNodeType[data.type]?.nodeStyle?.height ||
            commonNodeStyleInfo.height
        this.parentId = data.parentId
        this.collapsed = false
        this.dataInfo = data.dataInfo
        this.children = data.children
        this.isTemp = data.isTemp ? data.isTemp : false
    }

    toggleCollapse() {
        this.collapsed = !this.collapsed
    }
}
