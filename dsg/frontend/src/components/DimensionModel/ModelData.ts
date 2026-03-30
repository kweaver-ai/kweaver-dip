import { NodeType } from './components'

/**
 * 数据建模对象
 */
export default class DataModel {
    // 节点ID
    id?: string

    // 节点类型
    nodeType: NodeType

    // 展开状态
    expand: boolean = true

    // 业务信息
    dataInfo?: Record<string, any>

    linkMap?: Record<string, string>

    // 子节点
    children?: DataModel[]

    // 父节点ID
    parentId?: string

    // 节点宽度
    width?: number

    // 节点高度
    height?: number

    // 节点位置
    side?: 'left' | 'right' | undefined = undefined

    constructor(data) {
        this.id = data.id
        this.nodeType = data.nodeType
        this.dataInfo = data.dataInfo
        this.children = data.children
        this.parentId = data.parentId
        this.width = data.width
        this.linkMap = data.linkMap
        this.height = data.height
        this.side = data.side
    }

    toggleExpand() {
        this.expand = !this.expand
    }
}
