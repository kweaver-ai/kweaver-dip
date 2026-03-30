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
import { useGetState } from 'ahooks'
import __ from '../locale'
import styles from '../styles.module.less'
import { instancingGraph } from '@/core/graph/graph-config'
import dataSourceForm from './DataSourceForm'
import dataTargetForm from './DataTargetForm'
import {
    FormType,
    ModelType,
    NotChangedToHive,
    dataSourceFormTemplate,
} from '../const'
import FormQuoteData from '@/components/FormGraph/formDataQuoteData'
import { getPortByNode, searchFieldData } from '../helper'
import {
    DataShowSite,
    getDataCurrentPageIndex,
    getDataShowSite,
} from '@/components/FormGraph/helper'
import TooltipTool from './UnmountIcons'
import { allTaskTypeList } from '@/components/TaskComponents/helper'
import { getSyncModelDetail } from '@/core'
import dataSourceFormSmallSvg from '@/assets/dataSourceFormSmall.svg'
import dataTargetFormSmallSvg from '@/assets/dataTargetFormSmall.svg'
import dataSourceToTargetSvg from '@/assets/dataSourceToTarget.svg'
import { DataBaseType } from '@/components/DataSource/const'
import { X6PortalProvider } from '@/core/graph/helper'

interface ISynschronizationModel {
    ref?: any
    model?: ModelType
    modelId?: string
}
const SynschronizationModel: FC<ISynschronizationModel> = forwardRef(
    (props: any, ref) => {
        const { model = ModelType.CREATE, modelId = '' } = props
        const graphCase = useRef<GraphType>()
        const container = useRef<HTMLDivElement>(null)
        const [viewStatus, setViewStatus, getViewStatus] = useGetState<boolean>(
            !!modelId,
        )

        // 边关系数据
        const edgeRelation = useMemo(() => {
            return new FormQuoteData({})
        }, [])

        // 桩关系数据
        const businessNodesPortsData = useMemo(() => {
            return new FormQuoteData({})
        }, [])
        TooltipTool.config({
            tagName: 'div',
            isSVGElement: false,
            inherit: 'remove-button',
        })
        useMemo(() => {
            GraphType.registerEdgeTool('unmount-button', TooltipTool, true)
        }, [])

        const dataSourceFormName = useMemo(() => {
            return dataSourceForm({
                updateAllPortAndEdge: (node: Node) => {
                    updateAllPortAndEdge()
                },
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
                        if (currentNode.data.type === FormType.SOURCESFORM) {
                            return {
                                ...preData,
                                source: {
                                    ...currentNode.data.formInfo,
                                    fields: currentNode.data.items.map(
                                        (currentField) => {
                                            const { indexId, ...rest } =
                                                currentField
                                            return rest
                                        },
                                    ),
                                },
                            }
                        }
                        return {
                            ...preData,
                            target: {
                                ...currentNode.data.formInfo,
                                fields: currentNode.data.items.map(
                                    (currentField) => {
                                        const { indexId, ...rest } =
                                            currentField
                                        return rest
                                    },
                                ),
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
                    connectionPoint: 'anchor',
                    snap: {
                        radius: 30,
                    },
                    router: {
                        name: 'er',
                        args: {
                            offset: 25,
                            direction: 'H',
                        },
                    },
                    createEdge() {
                        return new Shape.Edge({
                            attrs: {
                                line: {
                                    stroke: '#979797',
                                    strokeWidth: 1,
                                },
                            },
                            tools: getViewStatus()
                                ? []
                                : [
                                      {
                                          name: 'unmount-button',
                                          args: {
                                              tooltip: __('解除'),
                                              onDelete: (id: string) => {
                                                  onRomveRelation(id)
                                              },
                                          },
                                      },
                                  ],
                        })
                    },
                },
            })
            if (graph) {
                graphCase.current = graph
                initGraphNode()

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
                    const sourceNode = edge.getSourceNode()
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
                            if (sourcePortId) {
                                sourceNode?.setPortProp(
                                    sourcePortId,
                                    'attrs/circle',
                                    {
                                        fill: '#D5D5D5',
                                        stroke: '#D5D5D5',
                                        magnet: true,
                                    },
                                )
                            }
                            if (targetPortId) {
                                targetNode?.setPortProp(
                                    targetPortId,
                                    'attrs/circle',
                                    {
                                        fill: '#D5D5D5',
                                        stroke: '#D5D5D5',
                                        magnet: true,
                                    },
                                )
                            }
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
            resetFormNodeData(modelId)
            setViewStatus(!!modelId)
            updateAllPortAndEdge()
        }, [modelId])

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
                if (modelId) {
                    const { source, target } = await getSyncModelDetail(modelId)
                    const { fields: sourceItems, ...restSource } = source
                    const { fields: targetItems, ...restTarget } = target
                    targetFields = targetItems.map((item, index) => ({
                        ...item,
                        indexId: index,
                    }))
                    targetFormInfo = restTarget
                    sourceFields = sourceItems.map((item, index) => ({
                        ...item,
                        indexId: index,
                    }))
                    sourceFormInfo = restSource
                }

                const sourceNode = graphCase.current.addNode({
                    ...dataSourceFormTemplate,
                    position: {
                        x: 600,
                        y: 200,
                    },
                    data: {
                        ...dataSourceFormTemplate.data,
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
                if (id) {
                    const { source, target } = await getSyncModelDetail(modelId)
                    const { fields: sourceItems, ...restSource } = source
                    const { fields: targetItems, ...restTarget } = target
                    allNodes.forEach((currentNode) => {
                        if (currentNode.data.type === FormType.SOURCESFORM) {
                            currentNode.replaceData({
                                ...currentNode.data,
                                formInfo: restSource,
                                items: sourceItems.map((item, index) => ({
                                    ...item,
                                    indexId: index,
                                })),
                                editStatus: false,
                            })
                        } else if (
                            currentNode.data.type === FormType.TARGETFORM
                        ) {
                            currentNode.replaceData({
                                ...currentNode.data,
                                formInfo: restTarget,
                                items: targetItems.map((item, index) => ({
                                    ...item,
                                    indexId: index,
                                })),
                                editStatus: false,
                            })
                        }
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
                updateAllPortAndEdge()
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
                        return allNode.data.type === FormType.SOURCESFORM
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
            const sourceFormNodeData = searchFieldData(
                sourceFormNode.data.items,
                targetFormNode.data.items,
                sourceFormNode.data.keyWord,
                FormType.SOURCESFORM,
            )
            targetFormNode.removePorts()
            targetFormNodeData.forEach((item, index) => {
                if (
                    sourceFormNodeData.find(
                        (standardDataItem) =>
                            standardDataItem.indexId === item.indexId,
                    )
                ) {
                    const currentItemSite = getDataShowSite(
                        index,
                        targetFormNode.data.offset,
                        10,
                        targetFormNodeData.length,
                    )
                    if (
                        (item.unmapped || item.type === 'undefined') &&
                        currentItemSite === DataShowSite.CurrentPage
                    ) {
                        // 修改这块校验逻辑
                        if (item.type !== 'undefined') {
                            const indexId = Number(item.indexId) % 10
                            setNodePort(
                                targetFormNode,
                                indexId,
                                'leftPorts',
                                '',
                                {
                                    attrs: {
                                        portBody: {
                                            r: 4,
                                            strokeWidth: 1,
                                            stroke: '#D5D5D5',
                                            fill: '#ffffff',
                                            magnet: true,
                                            zIndex: 10,
                                        },
                                    },
                                },
                            )
                            const targetPortId = last(
                                targetFormNode.getPorts(),
                            )?.id
                            if (targetPortId) {
                                addPasteNodePortData(
                                    targetPortId,
                                    targetFormNode.id,
                                    item.indexId,
                                    'leftPorts',
                                )
                            }
                            setNodePort(
                                sourceFormNode,
                                indexId,
                                'rightPorts',
                                '',
                                {
                                    attrs: {
                                        portBody: {
                                            r: 4,
                                            strokeWidth: 1,
                                            stroke: '#D5D5D5',
                                            fill: '#ffffff',
                                            magnet: true,
                                            zIndex: 10,
                                        },
                                    },
                                },
                            )
                            const sourcePortId = last(
                                sourceFormNode.getPorts(),
                            )?.id
                            if (sourcePortId) {
                                addPasteNodePortData(
                                    sourcePortId,
                                    sourceFormNode.id,
                                    item.indexId,
                                    'rightPorts',
                                )
                            }
                        }
                    } else {
                        createRelativeByNode(
                            sourceFormNode,
                            targetFormNode,
                            item,
                            index,
                        )
                    }
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
            const targetNodeItemPortInfo = getNodeItemPortId(
                targetNode,
                index,
                'leftPorts',
                10,
                item,
            )
            const pasteNodeItemPortInfo = getPasteNodePort(
                originNode,
                item.indexId,
                'rightPorts',
                targetNode,
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
            return undefined
        }

        /**
         * 解绑字段
         */
        const onRomveRelation = (id: string) => {
            if (graphCase?.current) {
                const edge = graphCase.current
                    .getEdges()
                    .find((currentEdge) => currentEdge.id === id)
                const targetPortId = edge?.getTargetPortId()
                const sourcePortId = edge?.getSourcePortId()
                const allNodes = graphCase.current.getNodes()
                const sourceNode = allNodes.find(
                    (currentNode) =>
                        currentNode.data.type === FormType.SOURCESFORM,
                )
                const targetNode = allNodes.find(
                    (currentNode) =>
                        currentNode.data.type === FormType.TARGETFORM,
                )
                if (sourcePortId) {
                    sourceNode?.setPortProp(sourcePortId, 'attrs/circle', {
                        fill: '#ffffff',
                        stroke: '#D5D5D5',
                        magnet: true,
                    })
                }
                if (targetPortId) {
                    targetNode?.setPortProp(targetPortId, 'attrs/circle', {
                        fill: '#ffffff',
                        stroke: '#D5D5D5',
                        magnet: true,
                    })
                }
                graphCase.current?.removeCell(id)
            }
        }

        /**
         * 设置业务表节点的桩
         * @param targetNode 目标节点
         * @param index 下标
         * @param position 左右位置
         * @param site 顶部位置
         */
        const setNodePort = (
            targetNode,
            index,
            position,
            site?,
            others = {},
        ) => {
            targetNode.addPort(getPortByNode(position, index, site, 10, others))
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
        const getPasteNodePort = (
            originNode,
            refId: string,
            position: string,
            targetNode,
        ) => {
            let portInfo
            const searchData = searchFieldData(
                originNode.data.items,
                targetNode.data.items,
                originNode.data.keyWord,
                originNode.data.type,
            )
            searchData.forEach((originItem, index) => {
                if (originItem.indexId === refId) {
                    portInfo = getNodeItemPortId(
                        originNode,
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
                                    stroke: '#126ee3',
                                    strokeWidth: 0.7,
                                    targetMarker: 'block',
                                },
                            },
                            tools: getViewStatus()
                                ? []
                                : [
                                      {
                                          name: 'unmount-button',
                                          args: {
                                              tooltip: __('解除'),
                                              onDelete: (id: string) => {
                                                  onRomveRelation(id)
                                              },
                                          },
                                      },
                                  ],
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
                                    targetMarker: 'block',
                                },
                            },
                            tools: getViewStatus()
                                ? []
                                : [
                                      {
                                          name: 'unmount-button',
                                          args: {
                                              tooltip: __('解除'),
                                              onDelete: (id: string) => {
                                                  onRomveRelation(id)
                                              },
                                          },
                                      },
                                  ],
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
                            src={dataSourceFormSmallSvg}
                            width={16}
                            preview={false}
                        />
                        <span className={styles.label}>{__('来源数据表')}</span>
                    </div>
                    <div className={styles.item} style={{ marginTop: '8px' }}>
                        <Image
                            src={dataTargetFormSmallSvg}
                            width={16}
                            preview={false}
                        />
                        <span
                            className={styles.label}
                            style={{ marginTop: '8px' }}
                        >
                            {__('目标数据表')}
                        </span>
                    </div>
                    <div className={styles.item} style={{ marginTop: '8px' }}>
                        <Image
                            src={dataSourceToTargetSvg}
                            width={65}
                            preview={false}
                        />
                        <span className={styles.label}>
                            {__('B表数据由A表同步得到')}
                        </span>
                    </div>
                </div>
            </div>
        )
    },
)

export default SynschronizationModel
