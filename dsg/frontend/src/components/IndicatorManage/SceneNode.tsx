import {
    CloseCircleFilled,
    ExclamationCircleFilled,
    ExclamationCircleOutlined,
    PlusCircleFilled,
    PlusOutlined,
} from '@ant-design/icons'
import { Edge, StringExt } from '@antv/x6'
import { register } from '@antv/x6-react-shape'
import { ConfigProvider, Dropdown, Tooltip } from 'antd'
import classnames from 'classnames'
import React, { useEffect, useState } from 'react'

import { IFormula, messageError } from '@/core'
import { OperationArrowLined, OperationRunlined } from '@/icons'
import { useQuery } from '@/utils'
import { confirm } from '@/utils/modalHelper'
import {
    FormulaError,
    formulaInfo,
    FormulaType,
    IndicatorType,
    portconfig,
} from './const'
import {
    createNodeInGraph,
    getFormulaErrorText,
    getFormulaMenuItem,
    getNodeNameRepeat,
} from './helper'
import Icons from './Icons'
import __ from './locale'
import styles from './styles.module.less'
import './x6Style.less'

const addBtnStyle: React.CSSProperties = {
    display: 'flex',
    width: '15px',
    height: '15px',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#126ee3',
    borderRadius: '10px',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '13px',
}

let callbackColl: any = []

const SceneNodeComponent = (props: any) => {
    const query = useQuery()
    const indicatorType = query.get('type') || IndicatorType.ATOM
    const { node, graph } = props
    const { data } = node
    // 算子集合
    const [targetData, setTargetData] = useState<Array<any>>([])
    const [formulaHover, setFormulaHover] = useState<boolean>(false)

    useEffect(() => {
        setTargetData(data.formula)
        resizeNode(data.formula)
    }, [data])

    /**
     * 调整节点大小
     * @param formulas 当前节点的算子集合
     */
    const resizeNode = (formulas: IFormula[]) => {
        if (!formulas.length || formulas.length === 1) {
            node.resize(140, 130)
        } else {
            node.resize(formulas.length * 98 + 24, 130)
        }
    }

    /**
     * 编辑节点名称
     */
    const handleEditNodeName = (e) => {
        e.preventDefault()
        e.stopPropagation()
        const editFormName = callbackColl[2]()
        editFormName(node)
    }

    // 节点执行
    const handleRun = () => {
        const runNode = callbackColl[3]()
        runNode(node, 1, true, false)
    }

    /**
     * 获取可添加的算子项
     * @param flag 'l'-左 | 'r'-右
     * @param type 当前算子类型
     * @param index 当前算子索引
     */
    const getAddItems = (flag?: 'l' | 'r', item?: IFormula, index?: number) => {
        return graph &&
            item?.type === FormulaType.INDICATOR_MEASURE &&
            index === 0 &&
            flag === 'l'
            ? [FormulaType.WHERE]
            : []
    }

    /**
     * 增加算子项
     * @param type 添加的算子类型
     * @param index 当前算子索引
     * @param item 当前算子
     * @param flag
     */
    const handleAddFormulaItem = async (
        type,
        index,
        item?,
        flag?: 'l' | 'r',
    ) => {
        const { name, formula } = data
        const formulas = Array.of(...formula)
        const newFormula = {
            id: StringExt.uuid(),
            type,
            output_fields: [],
        }
        switch (flag) {
            case 'l':
                formulas.splice(index, 0, newFormula)
                node.replaceData({
                    ...data,
                    formula: formulas,
                })
                break
            case 'r':
                formulas.splice(index + 1, 0, newFormula)
                node.replaceData({
                    ...data,
                    formula: formulas,
                })
                break
            default: {
                const num = getNodeNameRepeat(graph, formulaInfo[type].name)
                node.replaceData({
                    ...data,
                    // name:
                    //     name ||
                    //     (num > 0
                    //         ? `${formulaInfo[type].name}_${num}`
                    //         : formulaInfo[type].name),
                    formula: [...formulas, newFormula],
                })
            }
        }
        if (type === FormulaType.FORM) {
            const leftport = node.getPorts().find((port) => {
                return port?.group === 'in'
            })
            if (leftport && leftport.id) {
                node.setPortProp(leftport.id, 'attrs/wrap', {
                    fill: 'none',
                    magnet: false,
                })
                node.setPortProp(leftport.id, 'attrs/point', {
                    fill: 'none',
                    stroke: 'none',
                    magnet: true,
                })
            }
        }

        const refreshOptionGraphData = callbackColl[4]()
        refreshOptionGraphData(node, index, item, 'add', type)
    }

    /**
     * 删除算子项
     * @param e
     * @param item 当前算子
     * @param index 当前算子索引
     */
    const handleDeleteFormulaItem = async (
        e,
        item: IFormula,
        index: number,
    ) => {
        e.preventDefault()
        e.stopPropagation()
        if (item.config) {
            confirm({
                title: __('确认要删除算子吗？'),
                icon: <ExclamationCircleFilled className={styles.delIcon} />,
                content: __('删除后该算子的配置将被删除，请谨慎操作！'),
                okText: __('确定'),
                cancelText: __('取消'),
                async onOk() {
                    handleDeleteOk(item, index)
                },
            })
        } else {
            handleDeleteOk(item, index)
        }
    }

    /**
     * 确定删除算子
     * @param item 当前算子
     * @param index 当前算子索引
     */
    const handleDeleteOk = (item: IFormula, index: number) => {
        const { formula } = data
        if (item.type === FormulaType.FORM) {
            const leftport = node.getPorts().find((port) => {
                return port?.group === 'in'
            })
            if (leftport && leftport.id) {
                node.setPortProp(leftport.id, 'attrs/wrap', {
                    fill: 'transparent',
                    magnet: true,
                })
                node.setPortProp(leftport.id, 'attrs/point', {
                    fill: '#fff',
                    stroke: '#BFBFBF',
                    magnet: true,
                })
            }
        }
        node.replaceData({
            ...data,
            formula: formula.filter((_, idx) => idx !== index),
        })
        const refreshOptionGraphData = callbackColl[4]()
        refreshOptionGraphData(node, index, item, 'del')
    }

    /**
     * 配置算子
     * @param e
     * @param item 当前算子
     * @param index 当前算子索引
     */
    const handleEditFormulaItem = (e, item, index) => {
        e.preventDefault()
        e.stopPropagation()
        const optionGraphData = callbackColl[0]()
        optionGraphData(node, index, item)
    }

    // 创建下游的节点和边
    const handleCreateDownStream = (type: FormulaType) => {
        if (!graph) {
            return
        }
        const nodes = graph.getNodes()
        if (nodes.length >= 20) {
            messageError(__('最多只能创建20个节点！'))
        } else {
            const position = getDownstreamNodePosition()
            // 创建下游节点
            const newNode = createNodeInGraph(graph, position, type, node)
            const source = node.id
            const target = newNode.id
            // 创建该节点出发到下游节点的边
            createEdge(source, target)
            const refreshOptionGraphData = callbackColl[4]()
            refreshOptionGraphData(
                newNode,
                0,
                newNode.data.formula[0],
                'add',
                type,
            )
        }
    }

    // 计算下游节点的位置信息
    const getDownstreamNodePosition = (dx = 340, dy = 150) => {
        // 找出画布中以该起始节点为起点的相关边的终点id集合
        const downstreamNodeIdList: string[] = []
        graph.getEdges().forEach((edge: Edge) => {
            if (edge.getSourceCellId() === node.id) {
                downstreamNodeIdList.push(edge.getTargetCellId())
            }
        })
        // 获取起点的位置信息
        const position = node.getPosition()
        let minX = Infinity
        let maxY = -Infinity
        graph.getNodes().forEach((graphNode) => {
            if (downstreamNodeIdList.indexOf(graphNode.id) > -1) {
                const nodePosition = graphNode.getPosition()
                // 找到所有节点中最左侧的节点的x坐标
                if (nodePosition.x < minX) {
                    minX = nodePosition.x
                }
                // 找到所有节点中最x下方的节点的y坐标
                if (nodePosition.y > maxY) {
                    maxY = nodePosition.y
                }
            }
        })
        return {
            x: minX !== Infinity ? minX : position.x + dx,
            y: maxY !== -Infinity ? maxY + dy : position.y,
        }
    }

    /**
     * 创建边
     * @param sourceId 源节点id
     * @param targetId 目标节点id
     */
    const createEdge = (sourceId: string, targetId: string) => {
        graph.addEdge({
            id: StringExt.uuid(),
            shape: 'data-scene-edge',
            source: {
                cell: sourceId,
                port: `${sourceId}-out`,
            },
            target: {
                cell: targetId,
                port: `${targetId}-in`,
            },
            zIndex: -1,
        })
    }

    return (
        <ConfigProvider
            prefixCls="any-fabric-ant"
            iconPrefixCls="any-fabric-anticon"
        >
            <div
                style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    padding: '10px 10px 0 10px',
                    border: '1px solid #fff',
                    background: '#fff',
                    borderRadius: '8px',
                    color: 'rgba(0, 0, 0, 0.85)',
                    borderColor: data.selected
                        ? 'rgb(18 110 227 / 86%)'
                        : '#fff',
                }}
                className={classnames(styles.graphNode, 'seletdNode')}
                onFocus={() => {}}
            >
                <div
                    style={{
                        display: 'flex',
                        height: '20px',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                    className={styles.sn_topWrap}
                >
                    <div
                        style={{
                            display: 'inline-block',
                            fontSize: '12px',
                            fontWeight: '550',
                            cursor: 'pointer',
                            marginRight: '6px',
                        }}
                        className={styles.sn_topTitle}
                        title={data?.name || __('未命名')}
                        onClick={handleEditNodeName}
                    >
                        {data?.name || __('未命名')}
                    </div>

                    {/* 节点工具栏 */}
                    <div
                        style={{ display: 'flex', marginRight: '-6px' }}
                        className={styles.sn_topTool}
                    >
                        <Tooltip placement="top" title={__('执行')}>
                            <div
                                style={{
                                    display: 'flex',
                                    width: '20px',
                                    height: '20px',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '3px',
                                    marginRight: '2px',
                                    cursor: data.executable
                                        ? 'pointer'
                                        : 'not-allowed',
                                    color: data.executable
                                        ? 'rgba(0, 0, 0, 0.85)'
                                        : 'rgba(0, 0, 0, 0.3)',
                                }}
                                className={classnames(styles.sn_topBtn)}
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    if (!data.executable) {
                                        return
                                    }
                                    handleRun()
                                }}
                            >
                                <OperationRunlined />
                            </div>
                        </Tooltip>
                    </div>
                </div>
                {/* 控制收起或者展示 */}
                <div
                    style={{
                        display: 'flex',
                        width: '100%',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 20,
                    }}
                    className={styles.sn_content}
                >
                    {targetData.length > 0 ? (
                        targetData.map((item: IFormula, index) => {
                            return (
                                <div
                                    key={index}
                                    style={{
                                        position: 'relative',
                                        display: 'flex',
                                        width: 104,
                                        flexShrink: 0,
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                    }}
                                    className={styles.sn_contentItemWrap}
                                    onFocus={() => {}}
                                    onMouseEnter={() => setFormulaHover(true)}
                                    onMouseLeave={() => setFormulaHover(false)}
                                >
                                    <Dropdown
                                        menu={{
                                            items: getAddItems(
                                                'l',
                                                item,
                                                index,
                                            ).map((info) =>
                                                getFormulaMenuItem(info),
                                            ),
                                            onClick: ({ key }) => {
                                                handleAddFormulaItem(
                                                    key,
                                                    index,
                                                    item,
                                                    'l',
                                                )
                                            },
                                        }}
                                    >
                                        <div
                                            className={styles.leftAdd}
                                            style={{
                                                ...addBtnStyle,
                                                visibility:
                                                    getAddItems(
                                                        'l',
                                                        item,
                                                        index,
                                                    ).length === 0
                                                        ? 'hidden'
                                                        : undefined,
                                            }}
                                        >
                                            <PlusCircleFilled />
                                        </div>
                                    </Dropdown>
                                    <Tooltip
                                        placement="top"
                                        title={getFormulaErrorText(
                                            item.errorMsg as FormulaError,
                                            item.type as FormulaType,
                                        )}
                                    >
                                        <div
                                            style={{
                                                position: 'relative',
                                                display: 'flex',
                                                width: 62,
                                                height: 62,
                                                flexDirection: 'column',
                                                flexShrink: 0,
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '8px 0',
                                                margin: '0 4px',
                                                borderRadius: 3,
                                            }}
                                            className={classnames(
                                                styles.sn_contentItem,
                                                item?.errorMsg &&
                                                    item.errorMsg !==
                                                        FormulaError.MissingData &&
                                                    styles.error,
                                            )}
                                            onClick={(e) => {
                                                handleEditFormulaItem(
                                                    e,
                                                    item,
                                                    index,
                                                )
                                            }}
                                        >
                                            <Icons
                                                type={item.type}
                                                colored={!!item.config}
                                                fontSize={20}
                                            />
                                            <span
                                                // className={classnames(
                                                //     styles.sn_contentItemTitle,
                                                // )}
                                                style={{
                                                    height: 16,
                                                    color: 'rgb(0 0 0 / 65%)',
                                                    fontSize: 12,
                                                }}
                                            >
                                                {
                                                    formulaInfo[
                                                        item.type as FormulaType
                                                    ]?.name
                                                }
                                            </span>
                                            <span
                                                style={{
                                                    position: 'absolute',
                                                    top: -8,
                                                    right: -8,
                                                    display: 'flex',
                                                    width: 14,
                                                    height: 14,
                                                    flexShrink: 0,
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: '#bfbfbf',
                                                    cursor: 'pointer',
                                                    fontSize: 12,
                                                }}
                                                className={styles.delBtn}
                                                onClick={(e) => {
                                                    handleDeleteFormulaItem(
                                                        e,
                                                        item,
                                                        index,
                                                    )
                                                }}
                                                hidden={
                                                    indicatorType !==
                                                        IndicatorType.ATOM ||
                                                    item.type !==
                                                        FormulaType.WHERE
                                                }
                                            >
                                                <CloseCircleFilled
                                                    style={{
                                                        background: '#fff',
                                                    }}
                                                />
                                            </span>
                                            <ExclamationCircleOutlined
                                                style={{
                                                    position: 'absolute',
                                                    top: -7,
                                                    right: -6,
                                                    width: 12,
                                                    height: 12,
                                                    background: '#fff',
                                                    color: '#f5222d',
                                                    fontSize: 12,
                                                }}
                                                className={styles.errInfoBtn}
                                            />
                                        </div>
                                    </Tooltip>

                                    <Dropdown
                                        menu={{
                                            items: getAddItems(
                                                'r',
                                                item,
                                                index,
                                            ).map((info) =>
                                                getFormulaMenuItem(info),
                                            ),
                                            onClick: ({ key }) => {
                                                handleAddFormulaItem(
                                                    key,
                                                    index,
                                                    item,
                                                    'r',
                                                )
                                            },
                                        }}
                                    >
                                        <div
                                            className={styles.rightAdd}
                                            style={{
                                                ...addBtnStyle,
                                                visibility:
                                                    getAddItems(
                                                        'r',
                                                        item,
                                                        index,
                                                    ).length === 0
                                                        ? 'hidden'
                                                        : undefined,
                                            }}
                                        >
                                            <PlusCircleFilled />
                                        </div>
                                    </Dropdown>
                                    <OperationArrowLined
                                        style={{
                                            position: 'absolute',
                                            top: 10,
                                            right: -10,
                                            fontSize: 20,
                                        }}
                                        hidden={index === targetData.length - 1}
                                        // className={styles.rightArrow}
                                    />
                                </div>
                            )
                        })
                    ) : (
                        <Dropdown
                            menu={{
                                items: getAddItems().map((info) =>
                                    getFormulaMenuItem(info),
                                ),
                                onClick: ({ key }) =>
                                    handleAddFormulaItem(key, 0),
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    width: 62,
                                    height: 62,
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '12px 0',
                                    border: '1px dashed rgb(0 0 0 / 15%)',
                                    borderRadius: 3,
                                    color: 'rgb(0 0 0 / 45%)',
                                    cursor: 'pointer',
                                    fontSize: 10,
                                }}
                                className={styles.sn_contentEmptyWrap}
                            >
                                <PlusOutlined />
                                <span>{__('添加')}</span>
                            </div>
                        </Dropdown>
                    )}
                </div>

                {/* 添加下游节点 */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        right: -32,
                        display: 'flex',
                        width: 32,
                        height: '100%',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#126ee3',
                        // visibility: 'hidden',
                    }}
                    className={styles.sn_nodeAddWrap}
                >
                    <Dropdown
                        menu={{
                            items: getAddItems('r').map((info) =>
                                getFormulaMenuItem(info),
                            ),
                            onClick: ({ key }) => {
                                handleCreateDownStream(key as FormulaType)
                            },
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                width: 17,
                                height: 17,
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: '#126ee3',
                                borderRadius: 10,
                                color: '#fff',
                                cursor: 'pointer',
                                fontSize: 15,
                                visibility:
                                    getAddItems('r').length === 0
                                        ? 'hidden'
                                        : undefined,
                            }}
                            className={styles.sn_nodeAdd}
                        >
                            <PlusCircleFilled />
                        </div>
                    </Dropdown>
                </div>
            </div>
        </ConfigProvider>
    )
}

const SceneNode = (callback?: any) => {
    if (callback) {
        callbackColl = callback
    }
    register({
        shape: 'scene-analysis-node',
        effect: ['data'],
        component: SceneNodeComponent,
        ports: {
            ...(portconfig as any),
        },
    })
    return 'scene-analysis-node'
}
export default SceneNode
