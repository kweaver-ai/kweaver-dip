import { Edge, Node } from '@antv/x6'
import { Optional } from 'utility-types'
import { PortSite } from './const'
import { deleteDemand } from '@/core'
// 桩数据结构
export interface PortDataType {
    // 归属的节点
    nodeId: string

    // 数据id
    dataIds: Array<string>

    // 方向
    direction: 'left' | 'right'

    // 桩id
    portId: string

    // 桩位置
    site: PortSite
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

    // 来源数据
    sourceDataId: string

    // 目标数据Id
    targetDataId: string

    // 表达式
    lineDescription?: string
}

/**
 * 节点数据结构
 */
interface NodeStruct {
    // 节点id
    position: {
        x: number
        y: number
    }
    // 节点数据
    data: any
}

export default class PortAndEdgeStruct implements PortAndEdgeStruct {
    portsData: Array<PortDataType> = []

    edgesData: Array<EdgeDataType> = []

    removedNodesInfo: Array<NodeStruct> = []

    /**
     * 删除单个桩
     * @param id 删除桩
     */
    deletePorts(id: string, node: Node) {
        node.removePort(id)
        this.portsData = this.portsData.filter((port) => port.portId !== id)
    }

    /**
     * 删除当前节点关联的桩
     * @param id
     */
    deletePortsBySourceNodeId(id: string) {
        this.portsData = this.portsData.filter((port) => port.nodeId !== id)
    }

    /**
     * 通过数据id获取桩id
     * @param id
     * @param direction
     * @returns
     */
    getPortIdByDataId(id: string, direction: 'left' | 'right') {
        return (
            this.portsData.find(
                (port) =>
                    port.dataIds.includes(id) && port.direction === direction,
            )?.portId || ''
        )
    }

    /**
     * 通过桩位置获取桩id
     * @param site
     * @returns
     */
    getPortIdBySite(
        site: PortSite,
        direction: 'left' | 'right',
        nodeId: string,
    ) {
        return (
            this.portsData.find(
                (port) =>
                    port.site === site &&
                    port.direction === direction &&
                    port.nodeId === nodeId,
            )?.portId || ''
        )
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
    updatePortInfo(info: PortDataType, dataId: string, portId: string) {
        const findPort = this.portsData.find((port) => port.portId === portId)
        if (findPort) {
            this.portsData = this.portsData.map((port) => {
                if (port.portId === portId) {
                    return {
                        ...port,
                        dataIds: [...port.dataIds, dataId],
                    }
                }
                return port
            })
        } else {
            this.portsData = [...this.portsData, info]
        }
    }

    /**
     * 增加边数据
     * @param info
     */
    addEdgeInfo(info: EdgeDataType) {
        this.edgesData = [...this.edgesData, info]
    }

    /**
     * 删除单个桩
     * @param id 删除桩
     */
    deleteEdges(id: string) {
        this.edgesData = this.edgesData.filter((edge) => edge.edge.id !== id)
    }

    /**
     * 根据桩节点移除边
     * @param portId
     */
    removeEdgeByPortId(portId: string) {
        const edgeIds: Array<string> = []
        this.edgesData = this.edgesData.filter((item) => {
            if (item.targetPortId === portId || item.sourcePortId === portId) {
                edgeIds.push(item.edge.id)
                return false
            }
            return true
        })
        return edgeIds
    }

    /**
     * 获取当前来源节点关联的边
     * @param id
     * @returns
     */
    getEdgesBySourceNodeId(id: string) {
        return this.edgesData.filter((edge) => edge.sourceNodeId === id)
    }

    /**
     * 增加port数据
     * @param data
     */
    // addEdge(data: EdgeDataType) {
    //     const findNewId = this.edgesData.find(
    //         (edge) => edge.edge.id === data.edge.id,
    //     )
    //     if (findNewId) {
    //         throw Error('edge has exist!')
    //     }
    //     this.edgesData = [...this.edgesData, data]
    //     this.updatePortInfo({ edgeIds: [data.edge.id] }, data.targetPortId)
    //     this.updatePortInfo({ edgeIds: [data.edge.id] }, data.sourcePortId)
    // }

    /**
     * 查找当前数据节点关联的节点id
     * @param id
     * @returns
     */
    // findConnectNodeIds(id: string) {
    //     const currentDataIds = this.portsData
    //         .filter((port) => port.data.id === id)
    //         .map((item) => item.correlationIds[0])
    //     const connectDatas = this.portsData.filter((port) => {
    //         const findItems = currentDataIds.find((item) =>
    //             port.ids.includes(item),
    //         )
    //         return findItems
    //     })
    //     return connectDatas.map((item) => item.nodeId)
    // }

    /**
     * 通过节点id 查找关联的portId
     * @param id
     * @returns
     */
    // findConnectPortsDataByNodeId(nodeId: string) {
    //     const nodePortsData = this.portsData.filter(
    //         (port) => port.nodeId === nodeId,
    //     )
    //     const connectPortsData = this.portsData.filter((item) => {
    //         const foundPortData = nodePortsData.find((currentPort) =>
    //             currentPort.ids.includes(item.correlationIds[0]),
    //         )
    //         return !!foundPortData
    //     })

    //     return connectPortsData
    // }

    /**
     * 更新当前画布中的所有节点
     * @param nodes
     */
    updateRemovedNodes = (node: Node) => {
        const position = node.position()
        const findNode = this.removedNodesInfo?.find(
            (item) => item.data.id === node.data.id,
        )
        if (findNode) {
            this.removedNodesInfo = this.removedNodesInfo.map((item) =>
                item.data.id === node.data.id
                    ? {
                          position,
                          data: node.data,
                      }
                    : item,
            )
        } else {
            this.removedNodesInfo = [
                ...this.removedNodesInfo,
                {
                    position,
                    data: node.data,
                },
            ]
        }
    }

    /**
     * 获取移除的节点
     * @param dataId
     * @returns
     */
    getRemoveNodeByDataId = (dataId) => {
        return this.removedNodesInfo?.find((item) => item.data.id === dataId)
    }

    /**
     * 获取链路上的所有数据
     * @param id
     */
    // getLinksData(id) {
    //     const linkedPorts = this.getLinkedDataPorts(id)
    //     return linkedPorts || []
    // }

    // getNodeByDataId(id: string) {
    //     const linkedPorts = this.getLinkedDataPorts(id)
    //     if (linkedPorts.length) {
    //         const foundNode = this.nodes.find(
    //             (item) => item.id === linkedPorts[0].nodeId,
    //         )
    //         if (foundNode) {
    //             return foundNode
    //         }
    //         throw Error('node has exist!')
    //     }
    //     throw Error('port has exist!')
    // }

    /**
     * 通过数据id获取
     * @param id
     */
    // getNodebyDataId(id) {
    //     const currentNodeId = this.portsData.find((item) =>
    //         item.ids.includes(id),
    //     )?.nodeId

    //     return this.nodes.find(
    //         (currentNode) => currentNode.id === currentNodeId,
    //     )
    // }

    /**
     * 获取关联的数据id
     * @param id
     * @returns
     */
    // getLinkedDataPorts(id) {
    //     const linkedPorts = this.portsData.filter((item) =>
    //         item.ids.includes(id),
    //     )
    //     return linkedPorts
    // }

    /**
     * 根据父级id 获取线
     * @param id
     */
    // getLineByParentId(id: string): Array<Edge> {
    //     const connectEdgeIds = this.portsData
    //         .filter((port) => port.ids.includes(id))
    //         .map((currentPort) => currentPort.edgeIds)
    //         .flat()

    //     if (connectEdgeIds?.length) {
    //         const foundEdges = connectEdgeIds
    //             .map((currentData) => {
    //                 const foundEdge = this.edgesData.find(
    //                     (edgeData) => currentData === edgeData?.edge?.id,
    //                 )
    //                 return foundEdge?.edge || null
    //             })
    //             .filter((currentEdge) => currentEdge !== null) as Array<Edge>
    //         return foundEdges
    //     }
    //     return []
    // }
}
