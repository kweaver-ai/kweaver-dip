import { CaretRightOutlined } from '@ant-design/icons'
import { register } from '@antv/x6-react-shape'
import { ConfigProvider } from 'antd'
import classnames from 'classnames'
import {
    MouseEventHandler,
    memo,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import { useHover } from 'ahooks'
import { usePanoramaContext } from '../../PanoramaProvider'
import { AssetIcons, thousandSplit } from '../../helper'
import { AssetNodeType, NodeType, NodeTypeText } from './helper'
import styles from './styles.module.less'
import { useGradeLabelState } from '@/hooks/useGradeLabelState'
import { IHierarchy } from '@/core'

const PercentLine = ({
    item,
    total = 1,
}: {
    item: IHierarchy
    total: number
}) => {
    return (
        <div
            style={{
                width: `${(((item?.count ?? 0) * 100) / total).toFixed(2)}%`,
                background: item?.color || 'transparent',
            }}
            title={item?.name}
        />
    )
}

/**
 * 分类分级节点
 */
const HierarchyComponent = memo(({ node }: any) => {
    const { data } = node
    const {
        id,
        name,
        type,
        children,
        hasChild,
        expand: nodeExpand,
        parent_id,
        classified_num,
        hierarchy_info,
    } = data
    const { currentNode, setCurrentNode, setActiveId, activeId } =
        usePanoramaContext()
    const [isGradeOpen] = useGradeLabelState()
    const [isExpand, setIsExpand] = useState<boolean>(nodeExpand)
    const handleClick = (e) => {
        if (
            [
                AssetNodeType.BUSINESSACT,
                AssetNodeType.BUSINESSOBJ,
                AssetNodeType.LOGICENTITY,
            ].includes(type)
        ) {
            // 业务对象/活动  =>  展开/收缩
            if (hasChild) {
                setIsExpand(!isExpand)
            }
            setCurrentNode(undefined)

            return
        }

        if (!classified_num) {
            return
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

    const ref = useRef<HTMLDivElement | null>(null)
    const isHovering = useHover(ref)

    const handleShowDetail = (e) => {
        e.stopPropagation()
        setCurrentNode(data)
    }

    return (
        <ConfigProvider
            prefixCls="any-fabric-ant"
            iconPrefixCls="any-fabric-anticon"
        >
            <div
                ref={ref}
                className={classnames({
                    [styles['asset-node']]: true,
                    [styles['is-active-group']]:
                        type === AssetNodeType.SUBJECTGROUP && activeId === id,
                    af_panorama: type === AssetNodeType.SUBJECTGROUP,
                    [styles['is-count-zero']]: !classified_num,
                })}
                onClick={handleClick}
            >
                <div className={styles['asset-node-content']}>
                    {[
                        AssetNodeType.BUSINESSACT,
                        AssetNodeType.BUSINESSOBJ,
                        AssetNodeType.LOGICENTITY,
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
                    {type !== AssetNodeType.ATTRIBUTE &&
                        isGradeOpen &&
                        !!classified_num && (
                            <div className={styles.percent}>
                                {hierarchy_info?.map((o) => (
                                    <PercentLine
                                        key={o.id}
                                        item={o}
                                        total={classified_num}
                                    />
                                ))}
                            </div>
                        )}
                    {/* {type === AssetNodeType.ATTRIBUTE &&
                        isGradeOpen &&
                        hierarchy_info && (
                            <FontIcon
                                name="icon-biaoqianicon"
                                className={styles.tag}
                                style={{
                                    color:
                                        hierarchy_info?.[0].color ||
                                        'rgba(0,0,0,0.25)',
                                }}
                                title={hierarchy_info?.[0].name}
                            />
                        )} */}

                    <span className={styles['has-data-view']}>
                        {isHovering && !!classified_num ? (
                            <span
                                className={styles['show-detail']}
                                onClick={handleShowDetail}
                            >
                                详情
                            </span>
                        ) : (
                            <div
                                className={
                                    currentNode?.id === id
                                        ? styles['is-expand']
                                        : undefined
                                }
                                title={thousandSplit(classified_num)}
                            >
                                {thousandSplit(classified_num)}
                            </div>
                        )}
                    </span>
                </div>
            </div>
        </ConfigProvider>
    )
})

export function HierarchyNode() {
    register({
        shape: NodeType,
        effect: ['data'],
        component: HierarchyComponent,
    })
    return NodeType
}
