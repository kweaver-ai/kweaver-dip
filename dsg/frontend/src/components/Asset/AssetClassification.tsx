import React, { useEffect, useRef, useState } from 'react'
import { useClickAway } from 'ahooks'
import styles from './AssetPanorama/styles.module.less'
import {
    AssetNodeType,
    INode,
} from './AssetPanorama/components/HierarchyGraph/helper'
import {
    AssetTypeEnum,
    PolicyActionEnum,
    formatError,
    getClassification,
    getGlossaryCount,
    getSubjectDomain,
    policyValidate,
} from '@/core'
import {
    AssetIcons,
    AssetNodes,
    ICardItem,
    IDataViewItem,
    TopItems,
} from './AssetPanorama/helper'
import Empty from '@/ui/Empty'
import empty from '@/assets/emptySmall.svg'
import __ from './AssetPanorama/locale'
import Loader from '@/ui/Loader'
import {
    PanoramaProvider,
    usePanoramaContext,
} from './AssetPanorama/PanoramaProvider'
import BackBar from './AssetPanorama/components/BackBar'
import CountView from './AssetPanorama/components/CountView'
import HierarchyGraph from './AssetPanorama/components/HierarchyGraph'
import ViewTagDrawer from './AssetPanorama/components/ViewTagDrawer'
import { useGradeLabelState } from '@/hooks/useGradeLabelState'

const EmptyView = () => (
    <Empty iconSrc={empty} iconHeight="70px" desc={__('暂无数据')} />
)

interface IAssetClassificationProps {
    onClose?: () => void
}

function InnerAssetClassification({ onClose }: IAssetClassificationProps) {
    const [isGradeOpen] = useGradeLabelState()
    const [loading, setLoading] = useState<boolean>(false)
    // 主题域分组
    const [groups, setGroups] = useState<INode[]>()
    const { currentNode, setCurrentNode, activeId, setActiveId } =
        usePanoramaContext()
    const [tagViewVisible, setTagViewVisible] = useState<boolean>(false)

    const onLoad = async () => {
        try {
            setLoading(true)
            const groupRes = await getClassification({
                display: 'list',
                open_hierarchy: true,
            })
            setGroups(groupRes?.entries as INode[])
            let canSelectedNode
            groupRes?.entries?.forEach((dataNode) => {
                if (dataNode?.classified_num && !canSelectedNode) {
                    canSelectedNode = dataNode
                }
            })
            if (canSelectedNode) {
                setActiveId(canSelectedNode?.id || '')
            }
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        onLoad()
    }, [])

    useEffect(() => {
        setTagViewVisible(true)
    }, [currentNode])

    const clickRef = useRef<HTMLDivElement>(null)

    useClickAway(() => {
        if (tagViewVisible) {
            setTagViewVisible(false)
            setCurrentNode(undefined)
        }
    }, clickRef)

    return (
        <div className={styles['asset-classification']}>
            <div>
                <BackBar
                    title={`分类${isGradeOpen ? '分级' : ''}详情`}
                    onClose={onClose || undefined}
                />
            </div>
            {loading ? (
                <div style={{ marginTop: '30vh' }}>
                    <Loader />
                </div>
            ) : groups?.length ? (
                <>
                    <div className={styles['asset-graph']} ref={clickRef}>
                        <HierarchyGraph groups={groups} />
                        <div className={styles['asset-graph-counts']}>
                            <CountView />
                        </div>
                    </div>
                    {tagViewVisible && currentNode?.id && (
                        <div
                            className={styles['view-tag']}
                            onClick={(e) => {
                                e.stopPropagation()
                            }}
                        >
                            <ViewTagDrawer
                                open={tagViewVisible}
                                onClose={() => {
                                    setTagViewVisible(false)
                                    setCurrentNode(undefined)
                                }}
                                item={currentNode}
                                showHierarchy={isGradeOpen}
                            />
                        </div>
                    )}
                </>
            ) : (
                <div style={{ marginTop: '30vh' }}>
                    <EmptyView />
                </div>
            )}
        </div>
    )
}

const AssetClassification = ({ onClose }: IAssetClassificationProps) => {
    return (
        <PanoramaProvider>
            <InnerAssetClassification onClose={onClose} />
        </PanoramaProvider>
    )
}

export default AssetClassification
