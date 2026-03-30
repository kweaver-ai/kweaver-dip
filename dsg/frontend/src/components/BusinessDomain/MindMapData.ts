import { NodeType } from './const'

/**
 * 画布数据对象
 */
export default class MindMapData {
    // 节点ID
    id?: string

    // 节点类型
    nodeType: NodeType

    // 折叠状态
    collapsed: boolean = false

    // 全部推荐状态
    recommendedAll: boolean = false

    // 业务信息
    dataInfo?: { [key: string]: any }

    // 子节点
    children?: MindMapData[]

    // 父节点ID
    parentId?: string

    width?: number

    height?: number

    constructor(data) {
        this.id = data.id
        this.nodeType = data.nodeType
        this.dataInfo = data.dataInfo
        this.children = data.children
        this.width = data.width
        this.height = data.height
        this.collapsed = data.collapsed ?? false
    }

    toggleCollapse() {
        this.collapsed = !this.collapsed
    }

    setCollapse(value: boolean) {
        this.collapsed = value
    }
}
