import { CaretRightOutlined } from '@ant-design/icons'
import { register } from '@antv/x6-react-shape'
import { Graph, Node } from '@antv/x6'
import { ConfigProvider } from 'antd'
import classnames from 'classnames'
import { memo, useEffect, useMemo, useState } from 'react'
import { usePanoramaContext } from '../../PanoramaProvider'
import { AssetIcons, AssetNodes } from '../../helper'
import { AssetNodeType, NodeType, NodeTypeText } from './helper'
import styles from './styles.module.less'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'

/**
 * 资产节点
 */
const AssetComponent = memo(({ node, graph }: { node: Node; graph: Graph }) => {
    const { data } = node
    const {
        id,
        name,
        type,
        children,
        hasChild,
        expand: nodeExpand,
        parent_id,
        view_id,
        tempChild,
        indicator_count,
        interface_count,
        logic_view_count,
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

    useEffect(() => {
        if (indicator_count || interface_count || logic_view_count) {
            setCardDisabled(false)
        } else {
            setCardDisabled(true)
        }
    }, [indicator_count, interface_count, logic_view_count])

    const handleClick = (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (
            [AssetNodeType.BUSINESSACT, AssetNodeType.BUSINESSOBJ].includes(
                type,
            )
        ) {
            // 业务对象/活动  =>  展开/收缩
            if (hasChild) {
                setIsExpand(!isExpand)
            } else {
                setCurrentNode(undefined)
            }
            return
        }

        // if (type === AssetNodeType.LOGICENTITY) {
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
        if (type === AssetNodeType.SUBJECTGROUP) {
            // 切换主题域分组
            setActiveId(id)
        }
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
                className={classnames({
                    [styles['asset-node']]: true,
                    [styles['is-active']]:
                        type === AssetNodeType.LOGICENTITY &&
                        currentNode?.subject_domain_id === id,
                    [styles['is-active-group']]: activeId === id,
                    [styles['is-active-other']]: searchSelectedNodeId === id,
                    af_panorama: type === AssetNodeType.SUBJECTGROUP,
                    [styles['asset-node-disabled']]: cardDisabled,
                })}
                onClick={handleClick}
            >
                <div className={styles['asset-node-content']}>
                    {[
                        AssetNodeType.BUSINESSACT,
                        AssetNodeType.BUSINESSOBJ,
                    ].includes(type) && (
                        <div
                            className={classnames({
                                [styles['asset-node-content-expand']]: true,
                                [styles.expand]: isExpand,
                            })}
                        >
                            {hasChild && (
                                <CaretRightOutlined
                                    style={{ color: '#000000A6' }}
                                />
                            )}
                        </div>
                    )}

                    <div className={styles['asset-node-icon']} title={showTip}>
                        {AssetIcons[type]}
                    </div>
                    <div className={styles['asset-node-item']}>
                        <div
                            className={styles['asset-node-item-name']}
                            title={showTip}
                        >
                            {name}
                        </div>
                    </div>
                    {view_id && (
                        <div className={styles['has-data-view']}>
                            {AssetIcons[AssetNodeType.DATAVIEW]}
                        </div>
                    )}
                </div>
                <div
                    className={classnames({
                        [styles['data-count']]: true,
                        [styles['data-count-margin-left']]: [
                            AssetNodeType.BUSINESSOBJ,
                            AssetNodeType.BUSINESSACT,
                        ].includes(type),
                    })}
                >
                    <div
                        className={classnames({
                            [styles['data-item']]: true,
                            [styles['data-item-selected']]:
                                selectedCount.type === AssetNodes.DATAVIEW &&
                                data.id === selectedCount.id,
                            [styles['data-item-disabled']]: !logic_view_count,
                        })}
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            if (logic_view_count) {
                                handleClickCountType(AssetNodes.DATAVIEW)
                            }
                        }}
                    >
                        <span className={styles.icon}>
                            <FontIcon
                                name="icon-luojishitu-mianxing1"
                                type={IconType.COLOREDICON}
                            />
                        </span>
                        <span className={styles.text}>{logic_view_count}</span>
                    </div>
                    <div
                        className={classnames({
                            [styles['data-item']]: true,
                            [styles['data-item-selected']]:
                                selectedCount.type === AssetNodes.INTERFACE &&
                                data.id === selectedCount.id,
                            [styles['data-item-disabled']]: !interface_count,
                        })}
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            if (interface_count) {
                                handleClickCountType(AssetNodes.INTERFACE)
                            }
                        }}
                        hidden={type === AssetNodeType.LOGICENTITY}
                    >
                        <span className={styles.icon}>
                            <FontIcon
                                name="icon-jiekou-mianxing"
                                type={IconType.COLOREDICON}
                            />
                        </span>
                        <span className={styles.text}>{interface_count}</span>
                    </div>
                    <div
                        className={classnames({
                            [styles['data-item']]: true,
                            [styles['data-item-selected']]:
                                selectedCount.type === AssetNodes.INDICATOR &&
                                data.id === selectedCount.id,
                            [styles['data-item-disabled']]: !indicator_count,
                        })}
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            if (indicator_count) {
                                handleClickCountType(AssetNodes.INDICATOR)
                            }
                        }}
                        hidden={type === AssetNodeType.LOGICENTITY}
                    >
                        <span className={styles.icon}>
                            <FontIcon
                                name="icon-zhibiao-mianxing"
                                type={IconType.COLOREDICON}
                            />
                        </span>
                        <span className={styles.text}>{indicator_count}</span>
                    </div>
                </div>
            </div>
        </ConfigProvider>
    )
})

export function AssetNode() {
    register({
        shape: NodeType,
        effect: ['data'],
        component: AssetComponent,
    })
    return NodeType
}
