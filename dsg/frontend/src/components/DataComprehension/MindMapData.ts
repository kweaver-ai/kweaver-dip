import AiIntervalData from './AiIntervalData'
import { NodeType, nodeStyleInfo } from './const'

/**
 * 画布数据对象
 */
export default class MindMapData {
    // 节点ID
    id?: string

    // 节点类型
    nodeType: NodeType

    // 节点宽度
    width: number

    // 节点高度
    height: number

    // 折叠状态
    collapsed: boolean = false

    // 推荐状态
    recommended: boolean = false

    // 全部推荐状态
    recommendedAll: boolean = false

    // 业务信息
    dataInfo?: { [key: string]: any }

    // 子节点
    children?: MindMapData[]

    // 父节点ID
    parentId?: string

    // 临时节点
    isTemp: boolean = false

    // 维度节点的定时器
    aiIntervalData?: AiIntervalData

    constructor(data) {
        this.id = data.id
        this.nodeType = data.nodeType
        this.width = data.width || nodeStyleInfo[data.nodeType].width
        this.height = data.height || nodeStyleInfo[data.nodeType].height
        this.recommended = !!data.recommended
        this.dataInfo = data.dataInfo
        this.children = data.children
        this.isTemp = data.isTemp ? data.isTemp : false
        this.aiIntervalData = data?.aiIntervalData
    }

    toggleCollapse() {
        this.collapsed = !this.collapsed
    }

    toggleRecommended() {
        this.recommended = !this.recommended
    }
}
