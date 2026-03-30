import { Cell, Edge, Graph, Node } from '@antv/x6'
import React from 'react'
import Hierarchy from '@antv/hierarchy'
import { PlusOutlined } from '@ant-design/icons'
import { flatMapDeep, floor, isNumber } from 'lodash'
import classnames from 'classnames'
import moment from 'moment'
import {
    nodeStyleInfo,
    NodeType,
    SaveType,
    UndsStatus,
    undsStatusInfo,
    ViewMode,
} from './const'
import styles from './styles.module.less'
import {
    formatError,
    getDataComprehensionAi,
    IdimensionConfig,
    messageError,
    messageInfo,
    SortDirection,
} from '@/core'
import __ from './locale'
import { ReactComponent as aiUnderstandingOutlined } from '@/icons/svg/outlined/aiUnderstandingOutlined.svg'
import CommonIcon from '../CommonIcon'
import { getSource } from '@/utils'
import MindMapData from './MindMapData'
import AiIntervalData from './AiIntervalData'

export const initSearchCondition: any = {
    offset: 1,
    limit: 10,
    keyword: '',
    direction: SortDirection.DESC,
    sort: 'updated_at',
}

/**
 * 任务优先级组件
 * @param label 文本
 * @param color 颜色
 * @param bdColor 边框色
 */
const UndsLabel: React.FC<{
    type: UndsStatus
}> = ({ type }) => {
    return (
        <div className={styles.undsLabelWrap}>
            <div
                className={styles.ul_icon}
                style={{
                    background: `${undsStatusInfo[type].bgColor}`,
                    borderRadius: '26px',
                }}
            >
                <div
                    className={styles.ul_title}
                    style={{ color: `${undsStatusInfo[type].color}` }}
                >
                    {undsStatusInfo[type].text}
                </div>
            </div>
        </div>
    )
}

interface IAddRecommendBtn extends React.HTMLAttributes<HTMLDivElement> {
    showAdd: boolean
    showRecommend?: boolean
    disabled: boolean
    onAdd: () => void
    onRecommend: () => void
}
/**
 * 添加推荐组件
 */
const AddRecommendBtn: React.FC<IAddRecommendBtn> = ({
    showAdd,
    showRecommend = true,
    disabled,
    onAdd,
    onRecommend,
    ...props
}) => {
    return (
        <div
            className={styles.addRecommendBtnWrap}
            hidden={!showAdd && !showRecommend}
            {...props}
        >
            <div className={classnames(disabled && styles.adb_disabled)}>
                <div
                    className={styles.adb_btnWrap}
                    hidden={!showAdd}
                    onClick={() => {
                        if (!disabled) {
                            onAdd()
                        }
                    }}
                >
                    <PlusOutlined className={styles.adb_icon} />
                    <div className={styles.adb_title}>{__('添加')}</div>
                </div>
                <div
                    className={styles.adb_divid}
                    hidden={!showAdd || !showRecommend}
                />
                <div
                    className={styles.adb_btnWrap}
                    onClick={() => {
                        if (!disabled) {
                            onRecommend()
                        }
                    }}
                    hidden={!showRecommend}
                >
                    <CommonIcon
                        icon={aiUnderstandingOutlined}
                        className={styles.adb_icon}
                    />
                    <div className={styles.adb_title}>{__('理解')}</div>
                </div>
            </div>
        </div>
    )
}

interface IHierarchyResult {
    id: string
    x: number
    y: number
    data: MindMapData
    children?: IHierarchyResult[]
}

/**
 * 根据数据渲染画布
 * @param graph 画布
 * @param data 数据
 */
const graphRenderByData = (graph: Graph, data: any, reset: boolean = false) => {
    const result: IHierarchyResult = Hierarchy.mindmap(data, {
        direction: 'H',
        getHeight(d: any) {
            return d.height
        },
        getWidth(d: any) {
            return d.width
        },
        getHGap() {
            return 40
        },
        getVGap() {
            return 24
        },
        getSide: () => {
            return 'right'
        },
    })

    const nodes: Node[] = []
    const edges: Edge[] = []
    const traverse = (hierarchyItem: IHierarchyResult) => {
        if (hierarchyItem) {
            const { data: itemData, children } = hierarchyItem
            nodes.push(
                graph.createNode({
                    id: itemData.id,
                    shape: itemData.nodeType,
                    x: hierarchyItem.x,
                    y: hierarchyItem.y,
                    width: itemData.width,
                    height: itemData.height,
                    data: JSON.parse(JSON.stringify(itemData)),
                }),
            )
            const current = nodes[nodes.length - 1]
            itemData.id = current.id

            if (itemData.parentId) {
                edges.push(
                    graph.createEdge({
                        shape: 'mindmap-edge',
                        source: {
                            cell: itemData.parentId,
                            anchor: {
                                name: 'right',
                                args: {
                                    dx: '-15%',
                                },
                            },
                        },
                        target: {
                            cell: current.id,
                            anchor: {
                                name: 'left',
                                args: {
                                    dy: 'center',
                                },
                            },
                        },
                    }),
                )
            }

            if (children && !itemData.collapsed) {
                children.forEach((item: IHierarchyResult) => {
                    const { data: cData } = item
                    cData.parentId = current.id
                })
                children.forEach((item: IHierarchyResult) => traverse(item))
            }
        }
    }
    traverse(result)

    if (reset) {
        graph.removeCells(graph.getCells())
    }

    const oldNodes = graph.getNodes()
    if (oldNodes.length === 0) {
        graph.addCell(nodes)
    } else {
        oldNodes.forEach((node) => {
            const item = nodes.find((n) => n.id === node.id)
            if (item) {
                node.setData(item.getData(), { overwrite: true })
                node.position(item.position().x, item.position().y, {
                    deep: true,
                })
                node.size(item.size().width, item.size().height, {
                    deep: true,
                })
            }
        })
        if (nodes.length > oldNodes.length) {
            const items = nodes.reduce((res: Cell[], cur) => {
                const item = oldNodes.find((info) => info.id === cur.id)
                if (item) return res
                return res.concat([cur])
            }, [])
            graph.addCell(items)
        } else if (nodes.length < oldNodes.length) {
            const items = oldNodes.reduce((res: Cell[], cur) => {
                const item = nodes.find((info) => info.id === cur.id)
                if (item) return res
                return res.concat([cur])
            }, [])
            graph.removeCells(items)
        }
    }

    const oldEdges = graph.getEdges()
    graph.removeCells(oldEdges)
    graph.addCell(edges)
}

/**
 * 通过id查找数据对象
 * @param data 数据
 * @param id 节点id
 * @returns
 */
const findNodeById = (
    data: MindMapData,
    id?: string,
): MindMapData | undefined => {
    if (!id) return undefined
    const getData = (tree: MindMapData[]) => {
        // eslint-disable-next-line
        for (const node of tree) {
            if (node.id === id) return node
            if (node.children) {
                const res = getData(node.children)
                if (res) return res
            }
        }
        return undefined
    }
    return getData([data])
}

/**
 * 通过理解内容的类型查找数据对象
 * @param data 数据
 * @param type 理解内容的类型
 * @returns
 */
const findNodeByType = (data: MindMapData, type: number): MindMapData[] => {
    const result: MindMapData[] = []
    const getData = (tree: MindMapData[]) => {
        // eslint-disable-next-line
        for (const node of tree) {
            if (node?.dataInfo?.content_type === type) result.push(node)
            if (node.children) {
                getData(node.children)
            }
        }
    }
    getData([data])
    return result
}

/**
 * 更新节点的数据
 * @param data 数据
 * @param node 要更新的节点
 */
const updataNodeData = (data: MindMapData, node: Node) => {
    const cur = findNodeById(data, node.id)
    node.setData(JSON.parse(JSON.stringify(cur)))
}

/**
 * 根据理解内容的类型确定节点类型
 * @param type 理解内容的类型
 * @returns 节点类型
 */
const getNodeTypeByType = (type: number): NodeType => {
    switch (type) {
        case 1:
            return NodeType.TextAreaNode
        case 2:
            return NodeType.TimeNode
        case 3:
            return NodeType.MulSelectNode
        case 4:
            return NodeType.SelectInputNode
        case 5:
            return NodeType.MulSelectInputNode
        default:
            return NodeType.TextAreaNode
    }
}

/**
 * 根据理解内容确定节点高度
 * @param type 理解内容的类型
 * @returns 节点内容
 */
const getNodeHeightByType = (type: number, data: any): number => {
    switch (type) {
        case 1:
            return getCharSizeByCanvas(data).height
        case 4:
            return getCharSizeByCanvas(data?.comprehension).height
        case 5:
            return getCharSizeByCanvas(data?.comprehension).height
        default:
            return 32
    }
}

/**
 * 根据理解内容的类型确定空对象
 * @param type 理解内容的类型
 * @returns 节点内容
 */
const getEmptyObjectByType = (type?: number): any => {
    switch (type) {
        case 1:
            return ''
        case 3:
            return []
        default:
            return {}
    }
}

/**
 * 根据理解内容配置生成节点
 * @param data 数据
 * @param level 层级
 * @returns MindMapData[]
 */
const createNodeByDataInfo = (
    viewMode: ViewMode,
    data: IdimensionConfig[],
    choices: any,
    level: number,
    parentId?: string,
): MindMapData[] => {
    return data.map((d) => {
        if (d.detail?.error) {
            messageError(d.detail?.error)
        }
        const temp = new MindMapData({
            nodeType:
                level === 2
                    ? NodeType.SecondLeNode
                    : level === 3
                    ? NodeType.ThirdLeNode
                    : NodeType.FourthLeNode,
            dataInfo: {
                configId: d.id,
                configParentId: parentId,
                name: d.name,
                ...d.detail,
                choices: choices?.[d.id],
            },
            aiIntervalData: new AiIntervalData(),
            children: d.children
                ? createNodeByDataInfo(
                      viewMode,
                      d.children,
                      choices,
                      level + 1,
                      d.id,
                  )
                : undefined,
        })
        return d.detail
            ? createDataNodeWithData(viewMode, temp, d, choices)
            : temp
    })
}

/**
 * 根据理解内容生成节点
 * @param mmData 父对象
 * @param data 理解内容数据
 * @param choices 理解内容数据配置
 * @returns
 */
const createDataNodeWithData = (
    viewMode: ViewMode,
    mmData: MindMapData,
    data: IdimensionConfig,
    choices: any,
): MindMapData => {
    const temp = mmData
    if (data.detail?.content && data.detail?.content.length > 0) {
        temp.children = data.detail.content.map((c, idx) => {
            let content = c
            if (viewMode === ViewMode.EDIT) {
                if (data.detail!.content_type === 4) {
                    content = data.detail?.content_errors?.[idx]
                        ? { ...content, column_info: undefined }
                        : content
                } else if (data.detail!.content_type === 5) {
                    content = data.detail?.content_errors?.[idx]
                        ? { ...content, catalog_infos: undefined }
                        : content
                } else {
                    content = data.detail?.content_errors?.[idx]
                        ? undefined
                        : content
                }
            }
            return new MindMapData({
                nodeType: getNodeTypeByType(data.detail!.content_type),
                height: getNodeHeightByType(data.detail!.content_type, c),
                dataInfo: {
                    configId: data.id,
                    name: data.name,
                    ...data.detail,
                    choices: choices?.[data.id],
                    content,
                    ai_content:
                        data.detail?.ai_content?.[idx] &&
                        JSON.stringify(data.detail?.ai_content?.[idx]) !==
                            '[]' &&
                        JSON.stringify(data.detail?.ai_content?.[idx]) !== '{}'
                            ? data.detail?.ai_content?.[idx]
                            : undefined,
                    content_errors:
                        viewMode === ViewMode.EDIT
                            ? data.detail?.content_errors?.[idx]
                            : undefined,
                },
            })
        })
    } else {
        temp.children = [
            new MindMapData({
                nodeType: getNodeTypeByType(data.detail!.content_type),
                dataInfo: {
                    configId: data.id,
                    name: data.name,
                    ...data.detail,
                    choices: choices?.[data.id],
                    content: undefined,
                    ai_content: undefined,
                    content_errors: undefined,
                },
            }),
        ]
    }
    return temp
}

/**
 * 折叠节点
 * @param graph 画布
 * @param data 总数据
 * @param node 当前节点
 * @returns
 */
const graphNodeCollapse = (graph: Graph, data: MindMapData, node: Node) => {
    findNodeById(data, node.id)?.toggleCollapse()
    graphRenderByData(graph, data)
}

/**
 * 添加节点
 * @param graph 画布
 * @param data 总数据
 * @param nodeId 当前节点(维度节点)
 * @returns
 */
const graphAddNode = (graph: Graph, data: MindMapData, nodeId: string) => {
    const cur = findNodeById(data, nodeId)
    if (!cur) return
    if (cur.collapsed) {
        cur.toggleCollapse()
    }
    if (cur!.children!.length >= cur.dataInfo?.max_multi) {
        messageInfo(
            `${__('由于输入上限为')}${cur.dataInfo?.max_multi}${__(
                '条数据，所以暂时无法「添加」',
            )}`,
        )
        return
    }
    const lastChild = cur.children![cur.children!.length - 1]
    cur.children!.push(
        new MindMapData({
            nodeType: lastChild.nodeType,
            dataInfo: {
                ...lastChild.dataInfo,
                content: undefined,
                ai_content: undefined,
                content_errors: undefined,
            },
        }),
    )
    graphRenderByData(graph, data)
}

/**
 * 查询维度空节点
 * @param graph 画布
 * @param data 总数据
 * @param nodeId 当前节点ID(维度节点)
 */
const graphGetEmptyNode = (graph: Graph, data: MindMapData, nodeId: string) => {
    const cur: MindMapData | undefined = findNodeById(data, nodeId)
    if (!cur) return []
    const res = cur.children?.filter((info) => !info.dataInfo?.content)
    if (!res || res.length === 0) {
        return []
    }
    return res
}

/**
 * 推荐节点
 * @param graph 画布
 * @param data 总数据
 * @param nodeId 当前节点ID(维度节点)
 * @param aiIntervalData 定时器数据
 * @param catalogData 目录数据
 * @param columnData 目录信息项数据
 * @param onSave 保存状态
 */
const graphRecommendNode = async (
    graph: Graph,
    data: MindMapData,
    nodeId: string,
    aiIntervalData: AiIntervalData,
    catalogData: any[],
    columnData: any[],
    onSave?: any,
) => {
    const cur: MindMapData | undefined = findNodeById(data, nodeId)
    if (!cur) return

    // 展开
    if (cur.collapsed) {
        cur.toggleCollapse()
    }

    const emptyNodes = graphGetEmptyNode(graph, data, nodeId)
    // 个数限制
    if (
        cur.children!.length - emptyNodes.length >= cur.dataInfo?.max_multi &&
        cur.dataInfo?.max_multi !== 1
    ) {
        if (!cur.recommendedAll) {
            messageInfo(
                `${__('由于输入上限为')}${cur.dataInfo?.max_multi}${__(
                    '条数据，所以暂时无法「AI 理解」',
                )}`,
            )
        }
        return
    }

    // 禁用返回、保存相关操作
    onSave?.(SaveType.BAN)

    // 预加载节点
    cur.recommended = true
    const emptyChild = cur.children?.find((info) => !info.dataInfo?.content)
    const lastChild = cur.children![cur.children!.length - 1]
    if (cur.dataInfo?.max_multi === 1) {
        lastChild.recommended = true
        graphRenderByData(graph, data)
    } else if (emptyChild) {
        emptyChild.recommended = true
        graphRenderByData(graph, data)
    } else {
        cur.children!.push(
            new MindMapData({
                nodeType: lastChild.nodeType,
                recommended: true,
                isTemp: true,
                dataInfo: {
                    ...lastChild.dataInfo,
                    content: undefined,
                    ai_content: undefined,
                    content_errors: undefined,
                },
            }),
        )
        graphRenderByData(graph, data)
    }

    // 请求数据
    const aiInterval = aiIntervalData
    aiInterval.reqEnd = false
    const aiData: any[] = await requestRecommendByType(
        graph,
        data,
        nodeId,
        catalogData,
        columnData,
    )
    if (!aiData || (Array.isArray(aiData) && aiData.length === 0)) {
        if (!cur.recommendedAll) {
            messageInfo(__('暂无 AI 理解内容生成'))
        }
        aiInterval.reqEnd = true
        graphStopRecommendNode(
            graph,
            data,
            aiIntervalData,
            nodeId,
            onSave,
            false,
        )
    } else {
        handleRecommendNode(
            graph,
            data,
            nodeId,
            aiData.slice(0, 5),
            aiIntervalData,
        )
    }
}

/**
 * 根据节点类型请求推荐数据
 * @param graph 画布
 * @param data 总数据
 * @param nodeId 当前节点ID(维度节点)
 * @param catalogData 目录数据
 * @param columnData 目录信息项数据
 * @returns 请求ai数据
 */
const requestRecommendByType = async (
    graph: Graph,
    data: MindMapData,
    nodeId: string,
    catalogData: any[],
    columnData: any[],
) => {
    const cur: MindMapData = findNodeById(data, nodeId)!

    if (!data.dataInfo?.id || !cur.dataInfo?.configId) {
        return undefined
    }
    try {
        const { answer } = await getDataComprehensionAi(
            data.dataInfo.id,
            cur.dataInfo.name,
        )
        if (!answer || JSON.stringify(answer) === '{}' || answer.length === 0) {
            return undefined
        }
        switch (cur.dataInfo.content_type) {
            case 1:
                if (typeof answer === 'string') {
                    return [answer].filter(
                        (info) =>
                            !cur.children?.find(
                                (a) => a.dataInfo?.content === info,
                            ),
                    )
                }
                return answer
                    .filter((info) => typeof info === 'string')
                    .filter(
                        (info) =>
                            !cur.children?.find(
                                (a) => a.dataInfo?.content === info,
                            ),
                    )
            case 2:
                if (typeof answer[0].start === 'string') {
                    return answer.map((info) => {
                        if (isNumber(info.start)) {
                            return {
                                start: Number(info.start),
                                end: Number(info.end),
                            }
                        }
                        return {
                            start: moment(info.start).unix(),
                            end: moment(info.end).unix(),
                        }
                    })
                }
                return answer
            case 4:
                return answer
                    .filter((info) =>
                        columnData.find((c) => c.id === info.column_info?.id),
                    )
                    .map((info) => ({
                        ...info,
                        column_info: columnData.find(
                            (c) => c.id === info.column_info?.id,
                        ),
                    }))
                    .filter((info) => {
                        const findItem = cur.children?.find(
                            (a) =>
                                a.dataInfo?.content?.column_info?.id ===
                                info.column_info?.id,
                        )?.dataInfo?.content
                        if (findItem?.comprehension === info.comprehension) {
                            return false
                        }
                        return true
                    })
            case 5:
                return answer
                    .filter(
                        (info) =>
                            info?.catalog_infos
                                ?.flatMap((a) =>
                                    catalogData.find((c) => c.id === a.id),
                                )
                                .filter((a) => !!a).length > 0,
                    )
                    .map((info) => {
                        const catalog_infos =
                            info?.catalog_infos
                                ?.flatMap((a) =>
                                    catalogData.find((c) => c.id === a.id),
                                )
                                .filter((a) => !!a) || []
                        return {
                            ...info,
                            catalog_infos,
                        }
                    })
            default:
                return answer
        }
    } catch (err) {
        if (err?.data?.code !== 'ERR_CANCELED') {
            formatError(err)
        }
        return undefined
    }
}

/**
 * 推荐数据节点的展示处理
 * @param graph 画布
 * @param data 总数据
 * @param nodeId 节点ID(维度节点)
 * @param aiData ai数据
 * @param aiIntervalData 定时器数据
 */
const handleRecommendNode = (
    graph: Graph,
    data: MindMapData,
    nodeId: string,
    aiData: any,
    aiIntervalData: AiIntervalData,
) => {
    const cur: MindMapData = findNodeById(data, nodeId)!
    const lastChild = cur.children![cur.children!.length - 1]
    const aiInterval = aiIntervalData

    // 单个替换
    if (cur.dataInfo?.max_multi === 1) {
        lastChild.recommended = false
        lastChild.dataInfo = {
            ...lastChild.dataInfo,
            content: aiData[0],
            ai_content: aiData[0],
            content_errors: undefined,
        }
        aiInterval.needStart = true
        graphRenderByData(graph, data)
        return
    }

    // 多个添加
    const emptyNodes = graphGetEmptyNode(graph, data, nodeId)
    let max = aiData.length
    if (
        aiData.length + cur.children!.length - emptyNodes.length >
        cur.dataInfo!.max_multi
    ) {
        max = cur.dataInfo!.max_multi - cur.children!.length + emptyNodes.length
        if (!cur.recommendedAll) {
            messageInfo(
                <span>
                    {__('由于输入上限为')}
                    {cur.dataInfo?.max_multi}
                    {__('条数据，所以 AI 仅为您理解出')}
                    <span style={{ color: '#1677FF' }}> {max} </span>
                    {__('条数据')}
                </span>,
            )
        }
    }

    let count = 1
    // 单条数据的添加
    const addData = () => {
        if (aiInterval.needStart) return

        const emptyChild = cur.children?.find((info) => !info.dataInfo?.content)
        const last = emptyChild || cur.children![cur.children!.length - 1]
        last.recommended = false
        last.isTemp = false
        last.height = getNodeHeightByType(
            cur.dataInfo!.content_type,
            aiData[count - 1],
        )
        last.dataInfo = {
            ...last.dataInfo,
            content: aiData[count - 1],
            ai_content: aiData[count - 1],
            content_errors: undefined,
        }
        aiInterval.needStart = true
        count += 1

        if (count <= max) {
            const tempEmpty = cur.children?.find(
                (info) => !info.dataInfo?.content,
            )
            if (tempEmpty) {
                tempEmpty.recommended = true
            } else {
                cur.children!.push(
                    new MindMapData({
                        nodeType: lastChild.nodeType,
                        height: getNodeHeightByType(
                            cur.dataInfo!.content_type,
                            aiData[count - 1],
                        ),
                        isTemp: true,
                        recommended: true,
                        dataInfo: {
                            ...lastChild.dataInfo,
                            content: undefined,
                            ai_content: undefined,
                            content_errors: undefined,
                        },
                    }),
                )
            }
        } else {
            aiInterval.clearNodeInterval()
        }
        graphRenderByData(graph, data)
    }

    const interval = setInterval(addData, 10)
    aiInterval.nodeInterval = interval
}

/**
 * 取消推荐节点
 * @param graph 画布
 * @param data 总数据
 * @param aiIntervalData 定时器数据
 * @param nodeId 当前节点ID(维度节点)
 * @param onSave 保存状态
 * @param cancelReq 取消请求
 */
const graphStopRecommendNode = (
    graph: Graph,
    data: MindMapData,
    aiIntervalData?: AiIntervalData,
    nodeId?: string,
    onSave?: any,
    cancelReq: boolean = true,
) => {
    onSave?.(undefined)
    const cur = findNodeById(data, nodeId)
    if (!cur) return

    // 取消请求
    const sor = getSource()
    if (sor.length > 0 && cancelReq) {
        sor.forEach((info) => {
            if (info.config?.params?.dimension === cur?.dataInfo?.name) {
                info.source.cancel()
            }
        })
    }

    // 数据刷新
    const emptyChild = cur.children?.find((info) => !info.dataInfo?.content)
    const lastChild = cur.children![cur.children!.length - 1]
    cur.recommended = false
    if (cur.dataInfo?.max_multi === 1) {
        lastChild.recommended = false
        graphRenderByData(graph, data)
    } else if (emptyChild && emptyChild.recommended && !emptyChild.isTemp) {
        emptyChild.recommended = false
        graphRenderByData(graph, data)
    } else if (lastChild.recommended) {
        graphDeleteNode(graph, data, lastChild.id || '')
    } else {
        graphRenderByData(graph, data)
    }
    // 清空定时器
    aiIntervalData?.clear()
}

/**
 * 删除节点
 * @param graph 画布
 * @param data 总数据
 * @param nodeId 当前节点ID
 * @param onSave 保存状态
 * @returns
 */
const graphDeleteNode = (
    graph: Graph,
    data: MindMapData,
    nodeId: string,
    onSave?: any,
) => {
    const cur = findNodeById(data, nodeId)
    if (!cur) return
    const parentNode = findNodeById(data, cur.parentId)
    if (parentNode?.aiIntervalData) {
        if (!parentNode.aiIntervalData.nodeInterval) {
            parentNode.aiIntervalData.clear()
            parentNode.recommended = false
            if (!parentNode.recommendedAll) {
                onSave?.(undefined)
            }
        }
        parentNode.aiIntervalData.clearContentInterval()
        parentNode.aiIntervalData.clearSelectInterval()
    }
    if (parentNode?.children && parentNode.children.length > 1) {
        parentNode!.children = parentNode?.children?.filter(
            (c) => c.id !== nodeId,
        )
    } else {
        if (cur.recommended) {
            cur.toggleRecommended()
        }
        cur.height = nodeStyleInfo[cur.nodeType].height
        cur.dataInfo = {
            ...cur.dataInfo,
            content: undefined,
            ai_content: undefined,
        }
    }
    if (parentNode?.dataInfo?.error) {
        parentNode.dataInfo!.error = undefined
    }
    if (cur.dataInfo?.content_errors) {
        cur.dataInfo!.content_errors = undefined
    }
    graphRenderByData(graph, data)
}

/**
 * 计算文本所占宽高
 * @param char 文本
 * @param style 样式
 * @returns width-单行宽度 height-固定宽度对应的高度
 */
const getCharSizeByCanvas = (
    char,
    style = {
        fontSize: 14,
        fontFamily: 'PingFangSC-Regular, PingFang SC',
    },
) => {
    const canvas = document.createElement('canvas')
    canvas.style.position = 'ablsolute'
    const ctx = canvas.getContext('2d')
    const { fontSize, fontFamily } = style
    document.body.appendChild(canvas)
    ctx!.font = `${fontSize}px ${fontFamily}`
    document.body.removeChild(canvas)
    const text = ctx!.measureText(char)
    ctx!.fillText(char, 50, 50)

    let hi = 32
    if (text.width > 329) {
        hi += floor(text.width / 329) * 22
    }
    return { width: text.width, height: hi }
}

/**
 * 扁平化树信息
 * @param data
 * @returns
 */
const flatTreeData = (data: MindMapData[]): MindMapData[] =>
    flatMapDeep(data, (item) => [item, ...flatTreeData(item.children || [])])

/**
 * 过滤维度节点
 * @param data
 */
const filterDimension = (data: MindMapData) => {
    return flatTreeData([data]).filter(
        (info) =>
            [
                NodeType.SecondLeNode,
                NodeType.ThirdLeNode,
                NodeType.FourthLeNode,
            ].includes(info.nodeType) &&
            info.children?.[0]?.nodeType !== NodeType.FourthLeNode,
    )
}

/**
 * 检查是否有维度在ai理解
 * @param data
 * @returns true-没有
 */
const checkDimensionRecommend = (data: MindMapData) => {
    return filterDimension(data).every((info) => !info.recommended)
}

/**
 * 检查维度是否有内容
 * @param data 维度
 * @returns true-有内容
 */
const checkHasContent = (data?: any) => {
    if (!data) return false
    if (data?.children?.length) {
        return data?.children?.some((item) => checkHasContent(item))
    }

    if (data?.detail?.content?.length > 0) {
        return true
    }
    return false
}

export {
    UndsLabel,
    AddRecommendBtn,
    graphRenderByData,
    findNodeById,
    findNodeByType,
    updataNodeData,
    createNodeByDataInfo,
    getEmptyObjectByType,
    getNodeTypeByType,
    graphNodeCollapse,
    graphAddNode,
    graphRecommendNode,
    graphStopRecommendNode,
    graphDeleteNode,
    getCharSizeByCanvas,
    flatTreeData,
    filterDimension,
    checkDimensionRecommend,
    checkHasContent,
}
