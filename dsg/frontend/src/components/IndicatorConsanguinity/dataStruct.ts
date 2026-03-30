import { Edge, Node } from '@antv/x6'
import { Optional } from 'utility-types'
// 桩数据结构
export interface PortDataType {
    // 归属的节点
    nodeId: string

    // 关联的数据
    data: any

    // 关联的id
    correlationIds: Array<string>

    // 链接边的id
    edgeIds: Array<string>

    // 桩id
    portId: string

    ids: Array<string>

    type?: 'biz' | 'time'
}
// 边的数据结构
export interface EdgeDataType {
    // 目标的桩id
    targetPortId: string

    // 来源的桩id
    sourcePortId: string

    // 边实例
    edge: Edge

    // 目标的节点id
    targetNodeId: string

    // 来源节点id
    sourceNodeId: string
}

export default class DataStruct {
    portsData: Array<PortDataType> = []

    edgesData: Array<EdgeDataType> = []

    nodes: Array<Node> = []

    /**
     * 删除单个桩
     * @param id 删除桩
     */
    deletePorts(id: string, node: Node) {
        node.removePort(id)
        this.portsData = this.portsData.filter((port) => port.portId !== id)
    }

    /**
     * 增加port数据
     * @param data
     */
    addPorts(data: PortDataType) {
        const findNewId = this.portsData.find(
            (port) => port.portId === data.portId,
        )
        if (findNewId) {
            throw Error('port has exist!')
        }
        this.portsData = [...this.portsData, data]
    }

    /**
     * 清除节点桩数据
     * @param node
     */
    clearNodePorts(node: Node) {
        const portIds = node.getPorts().map((port) => port.id)
        this.portsData = this.portsData.filter(
            (port) => !portIds.includes(port.portId),
        )
        node.removePorts()
    }

    /**
     * 更新桩的信息
     * @param info
     * @param id
     */
    updatePortInfo(info: Optional<PortDataType>, id: string) {
        if (id) {
            this.portsData = this.portsData.map((port) =>
                port.portId === id
                    ? {
                          ...port,
                          ...info,
                          correlationIds: [
                              ...port.correlationIds,
                              ...(info?.correlationIds || []),
                          ],
                          ids: [...port.ids, ...(info?.ids || [])],
                          edgeIds: [...port.edgeIds, ...(info?.edgeIds || [])],
                      }
                    : port,
            )
        }
    }

    /**
     * 删除单个桩
     * @param id 删除桩
     */
    deleteEdges(id: string) {
        this.edgesData = this.edgesData.filter((edge) => edge.edge.id !== id)
    }

    /**
     * 增加port数据
     * @param data
     */
    addEdge(data: EdgeDataType) {
        const findNewId = this.edgesData.find(
            (edge) => edge.edge.id === data.edge.id,
        )
        if (findNewId) {
            throw Error('edge has exist!')
        }
        this.edgesData = [...this.edgesData, data]
        this.updatePortInfo({ edgeIds: [data.edge.id] }, data.targetPortId)
        this.updatePortInfo({ edgeIds: [data.edge.id] }, data.sourcePortId)
    }

    /**
     * 查找当前数据节点关联的节点id
     * @param id
     * @returns
     */
    findConnectNodeIds(id: string) {
        const currentDataIds = this.portsData
            .filter((port) => port.data.id === id)
            .map((item) => item.correlationIds[0])
        const connectDatas = this.portsData.filter((port) => {
            const findItems = currentDataIds.find((item) =>
                port.ids.includes(item),
            )
            return findItems
        })
        return connectDatas.map((item) => item.nodeId)
    }

    /**
     * 通过节点id 查找关联的portId
     * @param id
     * @returns
     */
    findConnectPortsDataByNodeId(nodeId: string) {
        const nodePortsData = this.portsData.filter(
            (port) => port.nodeId === nodeId,
        )
        const connectPortsData = this.portsData.filter((item) => {
            const foundPortData = nodePortsData.find((currentPort) =>
                currentPort.ids.includes(item.correlationIds[0]),
            )
            return !!foundPortData
        })

        return connectPortsData
    }

    /**
     * 更新当前画布中的所有节点
     * @param nodes
     */
    updateNodes = (nodes: Array<Node>) => {
        this.nodes = nodes
    }

    /**
     * 获取链路上的所有数据
     * @param id
     */
    getLinksData(id) {
        const linkedPorts = this.getLinkedDataPorts(id)
        return linkedPorts || []
    }

    getNodeByDataId(id: string) {
        const linkedPorts = this.getLinkedDataPorts(id)
        if (linkedPorts.length) {
            const foundNode = this.nodes.find(
                (item) => item.id === linkedPorts[0].nodeId,
            )
            if (foundNode) {
                return foundNode
            }
            throw Error('node has exist!')
        }
        throw Error('port has exist!')
    }

    /**
     * 通过数据id获取
     * @param id
     */
    getNodebyDataId(id) {
        const currentNodeId = this.portsData.find((item) =>
            item.ids.includes(id),
        )?.nodeId

        return this.nodes.find(
            (currentNode) => currentNode.id === currentNodeId,
        )
    }

    /**
     * 获取关联的数据id
     * @param id
     * @returns
     */
    getLinkedDataPorts(id) {
        const linkedPorts = this.portsData.filter((item) =>
            item.ids.includes(id),
        )
        return linkedPorts
    }

    /**
     * 获取进入系欸但的
     */
    getPortsByCorrelationId(id: string) {
        const linkedPorts = this.portsData.filter((item) =>
            item.correlationIds.includes(id),
        )
        return linkedPorts
    }

    /**
     * 获取上游引用的nodeId
     * @param id
     * @returns
     */
    getNextConnectNodeId(id: string) {
        const linkedNodeNode = this.portsData.filter((item) =>
            item.correlationIds.includes(id),
        )
        return linkedNodeNode
    }

    /**
     * 根据父级id 获取线
     * @param id
     */
    getLineByParentId(id: string): Array<Edge> {
        const connectEdgeIds = this.portsData
            .filter((port) => port.ids.includes(id))
            .map((currentPort) => currentPort.edgeIds)
            .flat()

        if (connectEdgeIds?.length) {
            const foundEdges = connectEdgeIds
                .map((currentData) => {
                    const foundEdge = this.edgesData.find(
                        (edgeData) => currentData === edgeData?.edge?.id,
                    )
                    return foundEdge?.edge || null
                })
                .filter((currentEdge) => currentEdge !== null) as Array<Edge>
            return foundEdges
        }
        return []
    }

    /**
     *  根据节点id获取当前节点上的桩
     * @param id
     * @returns
     */
    getPortsByNodeId(id: string) {
        return this.portsData.filter((port) => port.nodeId === id)
    }

    /**
     * 清楚所有节点的选中状态
     */
    clearNodeSelected() {
        this.nodes.forEach((item) => {
            item.replaceData({
                ...item.data,
                selectedIds: [],
            })
        })
    }

    getLineByChildId(id: string): Array<EdgeDataType> {
        const connectEdgeIds = this.portsData
            .filter((port) => port.correlationIds.includes(id))
            .map((currentPort) => currentPort.edgeIds)
        if (connectEdgeIds?.length) {
            const foundEdges = connectEdgeIds
                .map((currentData) => {
                    const foundEdge = this.edgesData.find((edgeData) =>
                        currentData.includes(edgeData?.edge?.id),
                    )
                    return foundEdge || null
                })
                .filter(
                    (currentEdge) => currentEdge !== null,
                ) as Array<EdgeDataType>
            return foundEdges
        }
        return []
    }
}
