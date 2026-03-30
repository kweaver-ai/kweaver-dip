import {
    FC,
    useState,
    useRef,
    useEffect,
    useMemo,
    forwardRef,
    useImperativeHandle,
} from 'react'
import {
    Cell,
    Graph as GraphType,
    CellView,
    Node,
    Shape,
    DataUri,
    Edge,
    Config,
} from '@antv/x6'
import { last } from 'lodash'
import { allowedNodeEnvironmentFlags } from 'process'
import { Image, message } from 'antd'
import __ from '../locale'
import styles from '../styles.module.less'
import { instancingGraph } from '@/core/graph/graph-config'
import {
    FormType,
    ModelType,
    NotChangedToHive,
    dataSourceFormTemplate,
} from '../../DataSynchronization/const'
import FormQuoteData from '@/components/FormGraph/formDataQuoteData'
import { getPortByNode, searchFieldData } from '../helper'
import {
    DataShowSite,
    getCurrentShowData,
    getDataCurrentPageIndex,
    getDataShowSite,
} from '@/components/FormGraph/helper'
import { allTaskTypeList } from '@/components/TaskComponents/helper'
import { getFormsFieldsList, getSyncModelDetail } from '@/core'
import dataBussinessForm from './DataBussinessForm'
import dataTargetForm from './DataTargetForm'
import dataBussinessSmallSvg from '@/assets/dataBussinessSmall.svg'
import dataTargetProcessSmallSvg from '@/assets/dataTargetProcessSmall.svg'
import dataBussinessToTargetSvg from '@/assets/dataBussinessToTarget.svg'
import { X6PortalProvider } from '@/core/graph/helper'

interface IDataProcessModel {
    ref?: any
    model?: ModelType
    modelId?: string
    taskId: string
    details?: {
        f_name: string
        target: any
        f_fields: Array<any>
        fid: string
    }
    allDataTypes: Array<any>
}

const DataProcessModel: FC<IDataProcessModel> = forwardRef(
    (props: any, ref) => {
        const {
            model = ModelType.CREATE,
            modelId = '',
            taskId,
            details,
            allDataTypes,
        } = props
        const graphCase = useRef<GraphType>()
        const container = useRef<HTMLDivElement>(null)

        // 边关系数据
        const edgeRelation = useMemo(() => {
            return new FormQuoteData({})
        }, [])

        // 桩关系数据
        const businessNodesPortsData = useMemo(() => {
            return new FormQuoteData({})
        }, [])

        const dataBussinessFormName = useMemo(() => {
            return dataBussinessForm({
                updateAllPortAndEdge: (node: Node) => {
                    updateAllPortAndEdge()
                },
                getTaskInfo: () => taskId,
                getAllDataTypes: () => allDataTypes,
                getEdgeRelation: () => edgeRelation,
            })
        }, [])

        const dataTargetFormName = useMemo(() => {
            return dataTargetForm({
                updateAllPortAndEdge: (node: Node) => {
                    updateAllPortAndEdge()
                },
                getEdgeRelation: () => edgeRelation,
            })
        }, [])

        useImperativeHandle(ref, () => ({
            getData: () => {
                let data = {}
                if (graphCase?.current) {
                    const allNodes = graphCase.current.getNodes()
                    data = allNodes.reduce((preData, currentNode) => {
                        if (currentNode.data.type === FormType.BUSSINESSFORM) {
                            return {
                                ...preData,
                                fid: currentNode.data?.formInfo?.id || '',
                                f_name: currentNode.data?.formInfo?.name || '',
                            }
                        }
                        return {
                            ...preData,
                            target: currentNode.data?.formInfo
                                ? {
                                      ...currentNode.data?.formInfo,
                                      fields:
                                          currentNode.data?.items?.map(
                                              (currentField) => {
                                                  const { indexId, ...rest } =
                                                      currentField
                                                  return rest
                                              },
                                          ) || [],
                                  }
                                : {
                                      fields:
                                          currentNode.data?.items?.map(
                                              (currentField) => {
                                                  const { indexId, ...rest } =
                                                      currentField
                                                  return rest
                                              },
                                          ) || [],
                                  },
                        }
                    }, {})
                }
                return data
            },
            setTargetFormError: () => {
                if (graphCase?.current) {
                    const targetNode = graphCase.current
                        .getNodes()
                        .filter(
                            (currentNode) =>
                                currentNode.data.type === FormType.TARGETFORM,
                        )[0]
                    targetNode?.replaceData({
                        ...targetNode.data,
                        formErrorStatus: true,
                    })
                }
            },
        }))

        useEffect(() => {
            const graph = instancingGraph(container.current, {
                panning: false,
                interacting: {
                    nodeMovable: false,
                    toolsAddable: true,
                },
                embedding: false,
                translating: {
                    restrict: true,
                },
                mousewheel: {
                    enabled: false,
                },
                connecting: {
                    allowBlank: false,
                    allowLoop: false,
                    allowNode: false,
                    allowEdge: false,
                    highlight: true,
                    connector: {
                        name: 'smooth',
                        args: {
                            direction: 'H',
                        },
                    },
                    targetAnchor: {
                        name: 'right',
                        args: {},
                    },
                    snap: true,
                    router: {
                        name: 'normal',
                    },
                    createEdge() {
                        return new Shape.Edge({
                            attrs: {
                                line: {
                                    stroke: '#979797',
                                    strokeWidth: 0.7,
                                    targetMarker: null,
                                },
                            },
                        })
                    },
                },
            })
            if (graph) {
                graphCase.current = graph
                initGraphNode().then(() => {
                    updateAllPortAndEdge()
                })

                graph.on('edge:removed', ({ edge, index, options }) => {
                    const allKey = Object.keys(edgeRelation.quoteData)
                    const currentKey = allKey.find(
                        (indexKey) =>
                            edgeRelation.quoteData[indexKey].id === edge.id,
                    )
                    if (currentKey) {
                        const targetNode = graph
                            .getNodes()
                            .find(
                                (currentNode) =>
                                    currentNode.data.type ===
                                    FormType.TARGETFORM,
                            )
                        targetNode?.replaceData({
                            ...targetNode.data,
                            items: targetNode.data.items.map((item) =>
                                item.indexId === Number(currentKey)
                                    ? {
                                          ...item,
                                          unmapped: true,
                                      }
                                    : item,
                            ),
                        })
                        edgeRelation.deleteData(currentKey)
                    }
                })

                graph.on('edge:connected', ({ edge }) => {
                    const targetPortId = edge.getTargetPortId()
                    const targetNode = edge.getTargetNode()
                    const sourcePortId = edge.getSourcePortId()
                    if (targetNode?.data.type !== FormType.TARGETFORM) {
                        graph.removeEdge(edge)
                        if (sourcePortId) {
                            const indexId =
                                businessNodesPortsData.quoteData[sourcePortId]
                                    .fieldId

                            edgeRelation.deleteData(indexId)
                        }
                        message.error(__('目标表不能连接到其他表'))
                        return
                    }
                    if (sourcePortId && targetPortId) {
                        const indexSourceId =
                            businessNodesPortsData.quoteData[sourcePortId]
                                .fieldId
                        const indexTargetId =
                            businessNodesPortsData.quoteData[targetPortId]
                                .fieldId
                        if (indexSourceId === indexTargetId) {
                            targetNode?.replaceData({
                                ...targetNode.data,
                                items: targetNode.data.items.map((item) =>
                                    item.indexId === Number(indexSourceId)
                                        ? {
                                              ...item,
                                              unmapped: false,
                                          }
                                        : item,
                                ),
                            })
                            if (!edgeRelation.quoteData?.[indexSourceId]) {
                                edgeRelation.addData({ [indexSourceId]: edge })
                            }
                        } else {
                            graph.removeEdge(edge)
                            edgeRelation.deleteData(indexSourceId)
                            message.error(__('只能和对应的字段进行连接'))
                        }
                    }
                })
            }
        }, [])

        useEffect(() => {
            resetFormNodeData(modelId).then(() => {
                updateAllPortAndEdge()
            })
        }, [modelId, details])

        window.onresize = () => {
            if (graphCase.current) {
                graphCase.current.center()
            }
        }

        const initGraphNode = async () => {
            if (graphCase && graphCase.current) {
                let sourceFormInfo: any = null
                let sourceFields: Array<any> = []
                let targetFormInfo: any = null
                let targetFields: Array<any> = []
                if (details) {
                    const { f_name, target, f_fields, fid } = details
                    const { fields: targetItems, ...restTarget } = target
                    if (fid) {
                        const { entries } = await getFormsFieldsList(fid, {
                            limit: 999,
                        })
                        sourceFields = entries.map((item, index) => ({
                            ...item,
                            indexId: index,
                        }))
                        sourceFormInfo = { name: f_name, id: fid }
                    }
                    targetFields = targetItems.map((item, index) => ({
                        ...item,
                        indexId: index,
                    }))
                    targetFormInfo = restTarget
                }

                const sourceNode = graphCase.current.addNode({
                    ...dataSourceFormTemplate,
                    shape: 'data-bussiness-form',
                    position: {
                        x: 600,
                        y: 200,
                    },
                    data: {
                        ...dataSourceFormTemplate.data,
                        type: FormType.BUSSINESSFORM,
                        formInfo: sourceFormInfo,
                        items: sourceFields,
                        editStatus: !modelId,
                    },
                })

                const targetNode = graphCase.current.addNode({
                    ...dataSourceFormTemplate,
                    shape: 'data-target-form',
                    position: {
                        x: 600 + 152 + 284,
                        y: 200,
                    },
                    data: {
                        ...dataSourceFormTemplate.data,
                        type: FormType.TARGETFORM,
                        formInfo: targetFormInfo,
                        items: targetFields,
                        editStatus: !modelId,
                    },
                })
                graphCase.current.centerContent()
                if (modelId) {
                    updateAllPortAndEdge()
                }
            }
        }

        const resetFormNodeData = async (id) => {
            if (graphCase?.current) {
                const allNodes = graphCase.current.getNodes()
                if (details && allNodes.length === 2) {
                    const { f_name, target, f_fields, fid } = details
                    const { fields: targetItems, ...restTarget } = target
                    const sourceFormNode = allNodes.filter((allNode) => {
                        return allNode.data.type === FormType.BUSSINESSFORM
                    })[0]
                    const targetFormNode = allNodes.filter((allNode) => {
                        return allNode.data.type === FormType.TARGETFORM
                    })[0]
                    if (fid) {
                        const { entries } = await getFormsFieldsList(fid, {
                            limit: 999,
                        })
                        sourceFormNode.replaceData({
                            ...sourceFormNode.data,
                            formInfo: fid ? { name: f_name, id: fid } : null,
                            items: entries.map((item, index) => ({
                                ...item,
                                indexId: index,
                            })),
                            editStatus: !id,
                        })
                    }
                    targetFormNode.replaceData({
                        ...targetFormNode.data,
                        formInfo: restTarget.name ? restTarget : null,
                        items: targetItems.map((item, index) => ({
                            ...item,
                            indexId: index,
                        })),
                        editStatus: !id,
                    })
                } else {
                    allNodes.forEach((currentNode) => {
                        currentNode.replaceData({
                            ...currentNode.data,
                            formInfo: null,
                            items: [],
                            editStatus: true,
                        })
                    })
                }
            }
        }

        /**
         * 更新所有表格port和连线
         */
        const updateAllPortAndEdge = () => {
            if (graphCase?.current) {
                const allNodes = graphCase.current.getNodes()
                businessNodesPortsData.clearData()
                edgeRelation.clearData()
                if (allNodes.length > 1) {
                    const sourceFormNode = allNodes.filter((allNode) => {
                        return allNode.data.type === FormType.BUSSINESSFORM
                    })[0]
                    const targetFormNode = allNodes.filter((allNode) => {
                        return allNode.data.type === FormType.TARGETFORM
                    })[0]
                    sourceFormNode.removePorts()
                    targetFormNode.removePorts()
                    setTargetFormAndSourceFormRelative(
                        targetFormNode,
                        sourceFormNode,
                    )
                }
            }
        }

        /**
         * 设置来源表和目标表连线关系
         * @param businessNode
         * @param standardNode
         */
        const setTargetFormAndSourceFormRelative = (
            targetFormNode: Node,
            sourceFormNode: Node,
        ) => {
            const targetFormNodeData = searchFieldData(
                sourceFormNode.data.items,
                targetFormNode.data.items,
                targetFormNode.data.keyWord,
                FormType.TARGETFORM,
            )
            const sourceCurrentFormNodeData = getCurrentShowData(
                sourceFormNode.data.offset,
                searchFieldData(
                    sourceFormNode.data.items,
                    targetFormNode.data.items,
                    sourceFormNode.data.keyWord,
                    FormType.BUSSINESSFORM,
                ),
                10,
            )
            const sourceFormNodeData = searchFieldData(
                sourceFormNode.data.items,
                targetFormNode.data.items,
                sourceFormNode.data.keyWord,
                FormType.BUSSINESSFORM,
            )
            targetFormNode.removePorts()
            sourceFormNodeData.forEach((item, index) => {
                if (
                    targetFormNodeData.find(
                        (standardDataItem) =>
                            standardDataItem.indexId === item.indexId,
                    ) &&
                    sourceCurrentFormNodeData.find(
                        (currentData) => currentData.indexId === item.indexId,
                    )
                ) {
                    createRelativeByNode(
                        sourceFormNode,
                        targetFormNode,
                        item,
                        index,
                    )
                }
            })
        }

        /**
         * 创建节点关系
         * @param originNode 源节点
         * @param targetNode 目标节点
         * @param item 数据项
         * @param index 数据项下标
         */
        const createRelativeByNode = (originNode, targetNode, item, index) => {
            const pasteNodeItemPortInfo = getNodeItemPortId(
                originNode,
                index,
                'rightPorts',
                10,
                item,
            )
            const targetNodeItemPortInfo = getTargetNodePort(
                targetNode,
                item.indexId,
                'leftPorts',
                originNode,
            )
            if (targetNodeItemPortInfo && pasteNodeItemPortInfo) {
                addEdgeFromOriginToTarget(
                    item.indexId,
                    targetNode,
                    targetNodeItemPortInfo?.portId || '',
                    originNode,
                    pasteNodeItemPortInfo?.portId || '',
                )
            }
        }

        /**
         * 获取当前节点的portId
         * @param node 节点
         * @param index 当前下标
         * @param group port位置
         * @param limit 每页大小
         * @returns portId 找到返回对应id ，没找到生成port并返回''
         */
        const getNodeItemPortId = (node: Node, index, group, limit, item) => {
            const itemSite = getDataShowSite(
                index,
                node.data.offset,
                limit,
                node.data.items.length,
            )
            if (itemSite === DataShowSite.CurrentPage) {
                const currentIndex = getDataCurrentPageIndex(
                    index,
                    node.data.offset,
                    limit,
                    node.data.items.length,
                )
                setNodePort(node, currentIndex, group)
                const portId = last(node.getPorts())?.id
                if (portId) {
                    addPasteNodePortData(portId, node.id, item.indexId, group)
                    return {
                        portId,
                        nodeId: businessNodesPortsData.quoteData[portId],
                    }
                }
                return undefined
            }
            if (itemSite === DataShowSite.UpPage) {
                let portId = getUpPortId(group, node)
                if (portId) {
                    return {
                        portId,
                        nodeId: node.id,
                    }
                }
                node.addPort(getPortByNode(group, -1, 'top'))
                portId = last(node.getPorts())?.id
                return { portId, nodeId: node.id }
            }
            return undefined
        }

        /**
         * 获取头部对应位置的坐标
         * @param group 位置
         * @param node 节点
         * @returns 坐标 找到返回对应节点 ，找不到返回头坐标
         */
        const getUpPortId = (group, node) => {
            const currentPort = node
                .getPorts()
                .filter(
                    (port) => port.args?.site === 'top' && port.group === group,
                )
            if (currentPort && currentPort.length) {
                return currentPort[0].id
            }
            return ''
        }

        /**
         * 设置业务表节点的桩
         * @param targetNode 目标节点
         * @param index 下标
         * @param position 左右位置
         * @param site 顶部位置
         */
        const setNodePort = (targetNode, index, position, site?) => {
            targetNode.addPort(getPortByNode(position, index, site))
        }

        /**
         * 更新贴原表数据
         */
        const addPasteNodePortData = (portId, nodeId, fieldId, site) => {
            if (portId) {
                businessNodesPortsData.addData({
                    [portId]: {
                        nodeId,
                        fieldId,
                        site,
                    },
                })
            }
        }

        /**
         * 设置原节点的桩
         */
        const getTargetNodePort = (
            targetNode,
            refId: string,
            position: string,
            originNode,
        ) => {
            let portInfo
            const searchData = searchFieldData(
                targetNode.data.items,
                originNode.data.items,
                targetNode.data.keyWord,
                targetNode.data.type,
            )
            searchData.forEach((originItem, index) => {
                if (originItem.indexId === refId) {
                    portInfo = getNodeItemPortId(
                        targetNode,
                        index,
                        position,
                        10,
                        originItem,
                    )
                }
            })
            return portInfo
        }

        /**
         * 添加连线
         * @param targetNode 目标节点
         * @param targetPortId 目标桩
         * @param originNode 源节点
         * @param OriginPortId 源桩
         */
        const addEdgeFromOriginToTarget = (
            originItemId,
            targetNode: Node,
            targetNodePortId: string,
            originNode: Node,
            originNodePortId: string = '',
        ) => {
            if (graphCase && graphCase.current) {
                const originNodePort = last(originNode.getPorts())
                const targetNodePort = last(targetNode.getPorts())
                if (
                    originNodePort &&
                    originNodePort.id &&
                    targetNodePort &&
                    targetNodePort.id
                ) {
                    if (targetNode.data.singleSelectedId === originItemId) {
                        const edge = new Shape.Edge({
                            source: {
                                cell: originNode.id,
                                port: originNodePortId || originNodePort.id,
                            },
                            target: {
                                cell: targetNode.id,
                                port: targetNodePortId || targetNodePort.id,
                            },
                            attrs: {
                                line: {
                                    stroke: '#979797',
                                    strokeWidth: 0.7,
                                    targetMarker: null,
                                },
                            },
                        })

                        edgeRelation.addData({
                            [originItemId]: graphCase.current.addEdge(edge),
                        })
                    } else {
                        const edge = new Shape.Edge({
                            source: {
                                cell: originNode.id,
                                port: originNodePortId || originNodePort.id,
                            },
                            target: {
                                cell: targetNode.id,
                                port: targetNodePortId || targetNodePort.id,
                            },
                            attrs: {
                                line: {
                                    stroke: '#979797',
                                    strokeWidth: 0.7,
                                    targetMarker: null,
                                },
                            },
                        })
                        edgeRelation.addData({
                            [originItemId]: graphCase.current.addEdge(edge),
                        })
                    }
                }
            }
        }

        return (
            <div
                className={styles.ModelContainer}
                onClick={() => {
                    if (graphCase.current) {
                        const allNodes = graphCase.current.getNodes()
                        allNodes.forEach((currentNode) => {
                            currentNode.replaceData({
                                ...currentNode.data,
                                singleSelectedId: '',
                                relatedSelected: '',
                                descriptionField: '',
                            })
                        })
                    }
                }}
            >
                <X6PortalProvider />
                <div ref={container} className={styles.graphContainer} />
                <div className={styles.displayInfoWrap}>
                    <div className={styles.item}>
                        <Image
                            src={dataBussinessSmallSvg}
                            width={16}
                            preview={false}
                        />
                        <span className={styles.label}>{__('业务表')}</span>
                    </div>
                    <div className={styles.item} style={{ marginTop: '8px' }}>
                        <Image
                            src={dataTargetProcessSmallSvg}
                            width={16}
                            preview={false}
                        />
                        <span className={styles.label}>{__('目标数据表')}</span>
                    </div>
                    <div className={styles.item} style={{ marginTop: '8px' }}>
                        <Image
                            src={dataBussinessToTargetSvg}
                            width={65}
                            preview={false}
                        />
                        <span className={styles.label}>
                            {__('B 表结构依据 A 表得到')}
                        </span>
                    </div>
                </div>
            </div>
        )
    },
)

export default DataProcessModel
