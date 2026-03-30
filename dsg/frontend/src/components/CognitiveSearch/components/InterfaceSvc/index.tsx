import { useUpdateEffect } from 'ahooks'
import { List } from 'antd'
import { memo, useMemo, useState } from 'react'
import classnames from 'classnames'
import { ParamsType, useCongSearchContext } from '../../CogSearchProvider'
import { AssetType } from '../../const'
import __ from '../../locale'
import DerivationModel from '../DerivationModel'
import PageLayout from '../PageLayout'
import ScrollList from '../ScrollList'
import styles from '../styles.module.less'
import { IConditions } from './FilterLine'
import InterfaceItem from './InterfaceItem'
import ApplicationServiceDetail from '@/components/DataAssetsCatlg/ApplicationServiceDetail'
import InterfaceCard from '@/components/DataAssetsCatlg/ApplicationServiceDetail/InterfaceCard'
import { OnlineStatus } from '@/core'
import { useCurrentUser } from '@/hooks/useCurrentUser'

/**
 * 接口服务
 * @returns
 */
function InterfaceSvc() {
    const {
        loading,
        conditions,
        updateParams,
        data,
        bigHeader,
        onLoadMore,
        isCongSearch,
    } = useCongSearchContext()
    const [filters, setFilters] = useState<IConditions>({})
    const [scrollTop, setScrollTop] = useState<number>(0)
    // 点击选择的资源
    const [current, setCurrent] = useState<any>()
    // 数据库表详情
    const [viewDetailOpen, setViewDetailOpen] = useState<boolean>(false)
    // 数据库表卡片详情
    const [viewCardOpen, setViewCardOpen] = useState<boolean>(false)
    // 接口详情
    const [interfaceDetailOpen, setInterfaceDetailOpen] =
        useState<boolean>(false)
    // 接口卡片详情
    const [interfaceCardOpen, setInterfaceCardOpen] = useState<boolean>(false)
    const [graphVisible, setGraphVisible] = useState<boolean>(false)
    const [showGraph, setShowGraph] = useState<boolean>(false)
    const [userId] = useCurrentUser('ID')

    useUpdateEffect(() => {
        getData()
    }, [filters])

    useUpdateEffect(() => {
        setScrollTop(0)
    }, [conditions])

    useUpdateEffect(() => {
        getData()
    }, [filters])

    const getData = async () => {
        updateParams(ParamsType.Filter, {
            published_at: filters?.onlineTime,
        })
    }
    const onItemClick = (item) => {
        setCurrent(item)
        // setInterfaceDetailOpen(true)
        setInterfaceCardOpen(true)
    }

    const onGraphClick = (item: any) => {
        setCurrent(item)
        setGraphVisible(true)
    }

    /**
     * 接口项
     */
    const itemRender = (item) => {
        return (
            <List.Item
                key={item.id}
                className={classnames(
                    styles['list-item'],
                    current?.id === item.id && styles['is-selected'],
                )}
            >
                <InterfaceItem
                    key={item.id}
                    item={item}
                    onCloseDetail={() => getData()}
                    confirmApplyApplication={() => getData()}
                    onItemClick={() => onItemClick(item)}
                    onGraphClick={onGraphClick}
                    isCongSearch={isCongSearch}
                    isSelected={current?.id === item.id}
                />
            </List.Item>
        )
    }

    const dataSource = useMemo(() => data?.entries || undefined, [data])

    return (
        <>
            <PageLayout>
                <div className={styles['page-wrapper-content']}>
                    <div className={styles['page-wrapper-top']}>
                        {/* <FilterLine onChange={(cond) => setFilters(cond)} /> */}
                        <div className={styles['page-wrapper-top-count']}>
                            {__('共')}
                            <span>{data?.total_count ?? 0}</span>
                            {__('条结果')}
                        </div>
                    </div>
                    <ScrollList
                        isSearch={conditions?.keyword}
                        loading={loading}
                        scrollTop={scrollTop}
                        itemRender={itemRender}
                        hasMore={
                            dataSource !== undefined &&
                            dataSource?.length < data?.total_count
                        }
                        data={dataSource}
                        onLoad={() => {
                            onLoadMore()
                        }}
                    />
                </div>
                {interfaceCardOpen && (
                    <div className={styles['page-wrapper-card']}>
                        <InterfaceCard
                            open={interfaceCardOpen}
                            onClose={() => {
                                setInterfaceCardOpen(false)
                            }}
                            onSure={() => {}}
                            interfaceId={current?.id}
                            onFullScreen={() => {
                                setInterfaceDetailOpen(true)
                            }}
                            allowChat={
                                (current?.available_status === '1' ||
                                    userId === current?.owner_id) &&
                                [
                                    OnlineStatus.ONLINE,
                                    OnlineStatus.DOWN_AUDITING,
                                    OnlineStatus.DOWN_REJECT,
                                ].includes(current?.online_status)
                            }
                        />
                    </div>
                )}

                {graphVisible && (
                    <DerivationModel
                        open={graphVisible}
                        item={current}
                        type={AssetType.INTERFACESVC}
                        handleClose={() => {
                            setGraphVisible(false)
                        }}
                        handleDetail={() => {
                            setGraphVisible(false)
                            setShowGraph(true)
                            setInterfaceDetailOpen(true)
                        }}
                    />
                )}
            </PageLayout>

            {interfaceDetailOpen && (
                <ApplicationServiceDetail
                    open={interfaceDetailOpen}
                    onClose={() => {
                        setInterfaceDetailOpen(false)
                        if (showGraph) {
                            setGraphVisible(true)
                            setShowGraph(false)
                        }
                    }}
                    serviceCode={current?.id}
                    isIntroduced
                    style={{
                        position: 'fixed',
                        width: '100vw',
                        height: '100vh',
                        top: bigHeader ? '62px' : '52px',
                    }}
                    hasAsst
                />
            )}
        </>
    )
}

export default memo(InterfaceSvc)
