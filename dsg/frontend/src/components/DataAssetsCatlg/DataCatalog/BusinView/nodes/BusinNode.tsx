import { CaretRightOutlined, MinusOutlined } from '@ant-design/icons'
import { register } from '@antv/x6-react-shape'
import { Graph, Node } from '@antv/x6'
import { ConfigProvider, Tooltip } from 'antd'
import classnames from 'classnames'
import { memo, useEffect, useMemo, useState } from 'react'
import { useDebounce } from 'ahooks'
import __ from '../locale'
import styles from './styles.module.less'
import { IconType } from '@/icons/const'
import { usePanoramaContext } from '@/components/Asset/AssetPanorama/PanoramaProvider'
import {
    BusinNodeIcon,
    BusinNodeType,
    graphNodeCollapse,
    NodeConf,
    NodeType,
    NodeTypeText,
} from './helper'
import { useBusinViewContext } from '../BusinViewProvider'

let callbackColl: any = []

/**
 * 资产节点
 */
const BusinNodeComp = memo(({ node, graph }: { node: Node; graph: Graph }) => {
    const { currentNodeData, setCurrentNodeData } = useBusinViewContext()

    const { data } = node
    const [nodeData, setNodeData] = useState<any>(data.dataInfo || {})
    const [isHoverItem, setIsHoverItem] = useState<boolean>(false)

    useMemo(() => setNodeData(data?.dataInfo || {}), [data])

    const { id, name, type, expand: nodeExpand, tempChild } = data
    const {
        setActiveId,
        activeId,
        selectedCount,
        setSelectedCount,
        searchSelectedNodeId,
        setSearchSelectedNodeId,
    } = usePanoramaContext()
    const [isExpand, setIsExpand] = useState<boolean>(nodeExpand)
    const [cardDisabled, setCardDisabled] = useState<boolean>(false)

    useEffect(() => {
        if (!isExpand) {
            const existSelectedData = tempChild?.find(
                (currentData) => currentData.id === searchSelectedNodeId,
            )
            if (existSelectedData) {
                setIsExpand(true)
            }
        }
    }, [currentNodeData])

    useEffect(() => {
        if (nodeData?.id === id) {
            const { x, y } = node.position()
            graph.centerPoint(x, y)
        }
    }, [nodeData, id])

    const handleClick = (e) => {
        e.preventDefault()
        e.stopPropagation()

        if (searchSelectedNodeId && searchSelectedNodeId !== id) {
            setSearchSelectedNodeId('')
        }
        setCurrentNodeData(undefined)
    }

    // 节点参数同步,触发重新布局
    useEffect(() => {
        node.replaceData({
            ...node.data,
            expand: isExpand,
            collapsed: !isExpand,
        })
    }, [isExpand])

    const handleClickCountType = (countType) => {
        setSelectedCount({
            type: countType,
            id,
            domainName: name,
            domainType: type,
        })
    }

    return (
        <ConfigProvider
            prefixCls="any-fabric-ant"
            iconPrefixCls="any-fabric-anticon"
        >
            <div
                className={classnames({
                    [styles.businNodeItem]: true,
                    [styles.catlgNodeItem]: [
                        BusinNodeType.InfoResourcesCatlg,
                        BusinNodeType.DataCatlg,
                    ].includes(type),
                    [styles.selNodeItem]: currentNodeData?.id === nodeData.id,
                })}
                onClick={(e) => {
                    callbackColl[4]?.(nodeData)
                    setCurrentNodeData(node.data?.dataInfo || node.data)
                    // graphNodeCollapse(
                    //     callbackColl[0]().current,
                    //     callbackColl[1](),
                    //     node,
                    // )
                    // if (
                    //     [
                    //         BusinNodeType.InfoResourcesCatlg,
                    //         BusinNodeType.DataCatlg,
                    //     ].includes(type)
                    // ) {
                    //     callbackColl[4]?.(nodeData)
                    // }
                }}
            >
                <Tooltip
                    title={`${NodeTypeText[nodeData.type]}：${nodeData.name}`}
                    overlayStyle={{
                        maxWidth: 400,
                    }}
                >
                    <div>
                        <BusinNodeIcon type={nodeData.type} />
                    </div>
                </Tooltip>
                <div className={styles.nodeInfoWrapper}>
                    <Tooltip
                        title={`${NodeTypeText[nodeData.type]}：${
                            nodeData.name
                        }`}
                        overlayStyle={{
                            maxWidth: 400,
                        }}
                    >
                        <div className={styles.nodeInfoTitle}>
                            {nodeData.name}
                        </div>
                    </Tooltip>

                    {type === BusinNodeType.InfoResourcesCatlg && (
                        <div className={styles.nodeOtherInfo}>
                            <div className={styles.nodeOtherInfoItem}>
                                <span className={styles.otherInfoTitle}>
                                    {__('业务标准表：')}
                                </span>
                                <span
                                    className={styles.otherInfoCont}
                                    title={nodeData?.business_form?.name}
                                >
                                    {nodeData?.business_form?.name || '--'}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
                {!!node?.data?.children?.length && (
                    <div
                        className={styles.nodeExpandInfo}
                        onClick={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                            graphNodeCollapse(
                                callbackColl[0]().current,
                                callbackColl[1](),
                                node,
                            )
                        }}
                    >
                        {nodeData.collapsed ? (
                            <MinusOutlined />
                        ) : node?.data?.children?.length > 100 ? (
                            '99+'
                        ) : (
                            node?.data?.children?.length
                        )}
                    </div>
                )}
            </div>
        </ConfigProvider>
    )
})

export function BusinNode(callback?: any) {
    if (callback) {
        callbackColl = callback
    }
    register({
        // ...NodeConf,
        shape: NodeType.BusinNode,
        effect: ['data'],
        component: BusinNodeComp,
    })
    return NodeType.BusinNode
}
