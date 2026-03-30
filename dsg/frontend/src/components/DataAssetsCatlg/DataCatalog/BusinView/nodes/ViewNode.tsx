import { MinusOutlined, SwapOutlined } from '@ant-design/icons'
import { register } from '@antv/x6-react-shape'
import { Graph, Node } from '@antv/x6'
import { ConfigProvider, Tooltip } from 'antd'
import { memo, useEffect, useMemo, useState, useRef } from 'react'
import __ from './locale'
import styles from './styles.module.less'
import { usePanoramaContext } from '@/components/Asset/AssetPanorama/PanoramaProvider'
import {
    BusinessView,
    BusinNodeIcon,
    graphNodeCollapse,
    NodeType,
    NodeTypeText,
} from './helper'

let callbackColl: any = []

/**
 * 资产节点
 */
const ViewNodeComp = memo(({ node, graph }: { node: Node; graph: Graph }) => {
    // const { businView, setBusinView } = useBusinViewContext()
    const ref = useRef<HTMLDivElement>(null)

    const { data } = node
    const [nodeData, setNodeData] = useState<any>(data?.dataInfo || {})

    useMemo(() => setNodeData(data?.dataInfo || {}), [data])

    const {
        dataInfo,
        id,
        name,
        type,
        children,
        hasChild,
        expand: nodeExpand,
        tempChild,
    } = data
    const {
        currentNode,
        setCurrentNode,
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
    }, [searchSelectedNodeId])

    useEffect(() => {
        if (searchSelectedNodeId === id) {
            const { x, y } = node.position()
            graph.centerPoint(x, y)
        }
    }, [searchSelectedNodeId, id])

    const handleClick = (e) => {
        e.preventDefault()
        e.stopPropagation()
        // if (
        //     [BusinNodeType.BUSINESSACT, BusinNodeType.BUSINESSOBJ].includes(
        //         type,
        //     )
        // ) {
        //     // 业务对象/活动  =>  展开/收缩
        //     if (hasChild) {
        //         setIsExpand(!isExpand)
        //     } else {
        //         setCurrentNode(undefined)
        //     }
        //     return
        // }

        // if (type === BusinNodeType.LOGICENTITY) {
        //     // 切换选中逻辑实体
        //     setCurrentNode({
        //         business_name: data.view_business_name,
        //         technical_name: data.view_technical_name,
        //         id: data.view_id,
        //         subject_domain_id: data.id,
        //         subject_id_path: data.path_id,
        //         subject_path: data.path_name,
        //         keep: true, // 区分点击的库表调整
        //     })
        //     return
        // }
        if (searchSelectedNodeId && searchSelectedNodeId !== id) {
            setSearchSelectedNodeId('')
        }
        // if (type === BusinNodeType.SUBJECTGROUP) {
        //     // 切换主题域分组
        //     setActiveId(id)
        // }
        setCurrentNode(undefined)
    }

    // 节点参数同步,触发重新布局
    useEffect(() => {
        node.replaceData({
            ...node.data,
            expand: isExpand,
        })
    }, [isExpand])

    const showTip = useMemo(
        () => `${NodeTypeText[data.type]}:${data.name}`,
        [data],
    )

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
                ref={ref}
                className={styles.viewNodeWrapper}
                // onClick={(e) => {
                //     e.stopPropagation()
                //     e.preventDefault()
                //     callbackColl[3]?.()
                //     //     graphNodeCollapse(
                //     //     callbackColl[0]().current,
                //     //     callbackColl[1](),
                //     //     node,
                //     // )
                // }}
            >
                <Tooltip
                    title={
                        __('切换至') +
                        NodeTypeText[
                            callbackColl[2]?.() === BusinessView.BusinDomain
                                ? BusinessView.Organization
                                : BusinessView.BusinDomain
                        ]
                    }
                    getPopupContainer={(n) =>
                        (ref?.current as HTMLElement) || n
                    }
                >
                    <div
                        className={styles.switchIcon}
                        onClick={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                            callbackColl[3]?.()
                            // setBusinView(
                            //     businView === BusinessView.BusinDomain
                            //         ? BusinessView.Organization
                            //         : BusinessView.BusinDomain,
                            // )
                        }}
                    >
                        <SwapOutlined />
                    </div>
                </Tooltip>
                <BusinNodeIcon
                    type={dataInfo.type}
                    className={styles.nodeIcon}
                />
                <div className={styles.nodeName}>{nodeData?.name || '--'}</div>
                {!!node?.data?.children?.length && (
                    <div
                        className={styles.nodeExpandInfo}
                        onClick={() =>
                            graphNodeCollapse(
                                callbackColl[0]().current,
                                callbackColl[1](),
                                node,
                            )
                        }
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

export function ViewNode(callback?: any) {
    if (callback) {
        callbackColl = callback
    }
    register({
        // ...NodeConf,
        shape: NodeType.ViewNode,
        effect: ['data'],
        component: ViewNodeComp,
    })
    return NodeType.ViewNode
}
