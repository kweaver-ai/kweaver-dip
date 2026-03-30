import React, { useEffect, useRef, useState } from 'react'
import { useClickAway } from 'ahooks'
import styles from './styles.module.less'
import AssetHeader from './AssetHeader'
import AssetGraph from './components/AssetGraph'
import { AssetNodeType, INode } from './components/AssetGraph/helper'
import {
    AssetTypeEnum,
    PolicyActionEnum,
    formatError,
    getGlossaryCount,
    getSubjectDomain,
    policyValidate,
} from '@/core'
import { AssetIcons, AssetNodes, IDataViewItem } from './helper'
import Empty from '@/ui/Empty'
import empty from '@/assets/emptySmall.svg'
import __ from './locale'
import Loader from '@/ui/Loader'
import { PanoramaProvider, usePanoramaContext } from './PanoramaProvider'
import LogicViewCard from '@/components/DataAssetsCatlg/LogicViewDetail/LogicViewCard'
import LogicViewDetail from '@/components/DataAssetsCatlg/LogicViewDetail'
import EmptyDrawer from './components/EmptyDrawer'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import DataDownloadConfig from '@/components/DataAssetsCatlg/DataDownloadConfig'
import DataAssetsListDrawer from '@/components/DataAssetsCatlg/DataAssetsListDrawer'

const EmptyView = () => (
    <Empty iconSrc={empty} iconHeight="70px" desc={__('暂无数据')} />
)

function InnerAssetPanorama() {
    const [userId] = useCurrentUser('ID')
    const [loading, setLoading] = useState<boolean>(false)
    // 主题域分组
    const [groups, setGroups] = useState<INode[]>()
    const {
        currentNode,
        setCurrentNode,
        setActiveId,
        selectedCount,
        setSelectedCount,
    } = usePanoramaContext()
    const [logicViewVisible, setLogicViewVisible] = useState<boolean>(false)
    const [allowDownload, setAllowDownload] = useState<boolean>(false)
    const [logicViewDetail, setLogicViewDetail] = useState<boolean>(false)
    const [downloadVisible, setDownloadVisible] = useState<boolean>(false)
    const [canDownload, setCanDownload] = useState<boolean>(false)
    const [countDetailVisible, setCountDetailVisible] = useState<boolean>(false)

    const onLoad = async () => {
        try {
            setLoading(true)
            const [groupRes, countRes] = await Promise.all([
                getSubjectDomain({
                    type: AssetNodeType.SUBJECTGROUP,
                    limit: 2000,
                    is_all: true,
                    need_total: true,
                }),
                getGlossaryCount(''),
            ])
            setGroups(groupRes?.entries as INode[])
            let canSelectedNode
            groupRes?.entries?.forEach((dataNode) => {
                if (
                    (dataNode?.indicator_count ||
                        dataNode?.logic_view_count ||
                        dataNode?.interface_count) &&
                    !canSelectedNode
                ) {
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

    const handleSelect = (item: IDataViewItem) => {
        // 通过dataView subject_id_path  获取分组ID
        const rootId = item.subject_id_path?.split('/')?.[0]
        setActiveId(rootId)
        setCurrentNode({ ...item })
    }

    const checkDownloadPermission = async (id: string) => {
        if (!id) return
        try {
            const res = await policyValidate([
                {
                    action: PolicyActionEnum.Download,
                    object_id: id,
                    object_type: AssetTypeEnum.DataView,
                    subject_id: userId,
                    subject_type: 'user',
                },
            ])
            const validateItem = (res || [])?.find((o) => o.object_id === id)
            if (validateItem?.effect === 'allow') {
                setAllowDownload(true)
            }
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        setLogicViewVisible(true)
        setAllowDownload(false)
        checkDownloadPermission(currentNode?.id)
    }, [currentNode])

    useEffect(() => {
        if (selectedCount.id && selectedCount.type) {
            setCountDetailVisible(true)
        }
    }, [selectedCount])

    const clickRef = useRef<HTMLDivElement>(null)
    useClickAway(() => {
        if (logicViewVisible) {
            setLogicViewVisible(false)
            setLogicViewDetail(false)
            setCurrentNode(undefined)
        }
    }, clickRef)

    return (
        <div className={styles['asset-panorama']}>
            {loading ? (
                <div style={{ marginTop: '30vh' }}>
                    <Loader />
                </div>
            ) : groups?.length ? (
                <>
                    <div className={styles['asset-panorama-counts']}>
                        <AssetHeader
                            title="业务资源架构详情"
                            onSearchSelect={handleSelect}
                        />
                    </div>
                    <div
                        className={styles['asset-graph']}
                        ref={clickRef}
                        onClick={() => {
                            setCountDetailVisible(false)
                            setSelectedCount({
                                id: '',
                                type: '',
                                domainName: '',
                                domainType: '',
                            })
                        }}
                    >
                        <AssetGraph groups={groups} />
                    </div>
                    {logicViewVisible && (
                        <div
                            onClick={(e) => {
                                e.stopPropagation()
                            }}
                            className={styles['logic-view']}
                            hidden={!Object.keys(currentNode || {}).length}
                        >
                            {currentNode?.id ? (
                                <LogicViewCard
                                    open={logicViewVisible}
                                    onClose={() => {
                                        setLogicViewVisible(false)
                                        setCurrentNode(undefined)
                                    }}
                                    cardProps={{
                                        contentWrapperStyle: {
                                            width: '100%',
                                            boxShadow:
                                                '0 0 10px 0px rgb(15 32 68 / 10%)',
                                        },
                                    }}
                                    icon={
                                        <span
                                            style={{
                                                marginTop: '4px',
                                                marginRight: '6px',
                                            }}
                                        >
                                            {AssetIcons[AssetNodes.DATAVIEW]}
                                        </span>
                                    }
                                    allowDownload={allowDownload}
                                    onDownload={() => setDownloadVisible(true)}
                                    onSure={() => {}}
                                    id={currentNode?.id}
                                    onFullScreen={(isOwner?: boolean) => {
                                        setCanDownload(isOwner || allowDownload)
                                        setLogicViewDetail(true)
                                    }}
                                />
                            ) : (
                                <EmptyDrawer
                                    open={logicViewVisible}
                                    onClose={() => {
                                        setLogicViewVisible(false)
                                        setCurrentNode(undefined)
                                    }}
                                />
                            )}
                        </div>
                    )}

                    {logicViewDetail && currentNode?.id && (
                        <div
                            onClick={(e) => {
                                e.stopPropagation()
                            }}
                        >
                            <LogicViewDetail
                                open={logicViewDetail}
                                onClose={() => {
                                    setLogicViewDetail(false)
                                    setCanDownload(false)
                                }}
                                showShadow={false}
                                hasPermission={canDownload}
                                id={currentNode?.id}
                            />
                        </div>
                    )}

                    {downloadVisible && currentNode?.id && (
                        <div onClick={(e) => e.stopPropagation()}>
                            <DataDownloadConfig
                                formViewId={currentNode?.id || ''}
                                open={downloadVisible}
                                onClose={() => {
                                    setDownloadVisible(false)
                                }}
                            />
                        </div>
                    )}

                    {countDetailVisible && (
                        <div
                            onClick={(e) => {
                                e.stopPropagation()
                            }}
                            className={styles['count-view']}
                        >
                            <DataAssetsListDrawer
                                domainId={selectedCount.id}
                                type={
                                    selectedCount.type === 'interface'
                                        ? 'interface_svc'
                                        : selectedCount.type
                                }
                                open={countDetailVisible}
                                onClose={() => {
                                    setCountDetailVisible(false)
                                    setSelectedCount({
                                        id: '',
                                        type: '',
                                        domainName: '',
                                        domainType: '',
                                    })
                                }}
                                domainName={selectedCount?.domainName}
                                domainType={selectedCount?.domainType}
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

const AssetPanorama = () => {
    return (
        <PanoramaProvider>
            <InnerAssetPanorama />
        </PanoramaProvider>
    )
}

export default AssetPanorama
