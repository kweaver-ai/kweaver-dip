import { useUpdateEffect } from 'ahooks'
import { List } from 'antd'
import { memo, useMemo, useState } from 'react'
import classnames from 'classnames'
import { useCongSearchContext } from '../../CogSearchProvider'
import { AssetType } from '../../const'
import __ from '../../locale'
import DerivationModel from '../DerivationModel'
import PageLayout from '../PageLayout'
import ScrollList from '../ScrollList'
import styles from '../styles.module.less'
import IndicatorItem from './IndicatorItem'
import IndicatorViewCard from '@/components/DataAssetsCatlg/IndicatorViewDetail/IndicatorViewCard'
import IndicatorViewDetail from '@/components/DataAssetsCatlg/IndicatorViewDetail'
import { useCurrentUser } from '@/hooks/useCurrentUser'

/**
 * 接口服务
 * @returns
 */
function Indicator() {
    const {
        loading,
        conditions,
        updateParams,
        data,
        bigHeader,
        onLoadMore,
        isCongSearch,
    } = useCongSearchContext()
    const [scrollTop, setScrollTop] = useState<number>(0)
    const [current, setCurrent] = useState<any>()
    // 数据库表详情
    const [viewDetailOpen, setViewDetailOpen] = useState<boolean>(false)
    // 数据库表卡片详情
    const [viewCardOpen, setViewCardOpen] = useState<boolean>(false)
    // 接口详情
    const [interfaceDetailOpen, setInterfaceDetailOpen] =
        useState<boolean>(false)
    const [graphVisible, setGraphVisible] = useState<boolean>(false)
    const [showGraph, setShowGraph] = useState<boolean>(false)
    const [userId] = useCurrentUser('ID')

    useUpdateEffect(() => {
        setScrollTop(0)
    }, [conditions])

    const onItemClick = (item) => {
        setCurrent(item)
        setViewCardOpen(true)
    }

    const onGraphClick = (item: any) => {
        setCurrent(item)
        setGraphVisible(true)
    }

    const handleItemNameClick = (e: any, item: any) => {
        e.preventDefault()
        e.stopPropagation()

        setCurrent(item)
        setViewDetailOpen(true)
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
                <IndicatorItem
                    key={item.id}
                    item={item}
                    onCloseDetail={() => {}}
                    // confirmApplyApplication={() => getData()}
                    onItemClick={() => onItemClick(item)}
                    onGraphClick={onGraphClick}
                    isCongSearch={isCongSearch}
                    isSelected={current?.id === item.id}
                    onNameClick={(e) => handleItemNameClick(e, item)}
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
                {viewCardOpen && (
                    <div className={styles['page-wrapper-card']}>
                        <IndicatorViewCard
                            open={viewCardOpen}
                            onClose={() => {
                                setViewCardOpen(false)
                            }}
                            onSure={() => {}}
                            // xxx-库表
                            indicatorId={current?.id}
                            onFullScreen={() => {
                                setViewDetailOpen(true)
                            }}
                            allowRead={
                                current?.available_status === '1' ||
                                userId === current?.owner_id
                            }
                        />
                    </div>
                )}

                {graphVisible && (
                    <DerivationModel
                        open={graphVisible}
                        item={current}
                        type={AssetType.INDICATOR}
                        handleClose={() => {
                            setGraphVisible(false)
                        }}
                        handleDetail={() => {
                            setGraphVisible(false)
                            setShowGraph(true)
                            setViewDetailOpen(true)
                        }}
                    />
                )}
            </PageLayout>

            {viewDetailOpen && (
                <IndicatorViewDetail
                    open={viewDetailOpen}
                    onClose={() => {
                        setViewDetailOpen(false)
                        if (showGraph) {
                            setGraphVisible(true)
                            setShowGraph(false)
                        }
                    }}
                    id={current?.id}
                    indicatorType={current?.indicator_type}
                    isIntroduced
                    style={{
                        position: 'fixed',
                        width: '100vw',
                        height: '100vh',
                        top: bigHeader ? '62px' : '52px',
                    }}
                    canChat
                    hasAsst
                />
            )}
        </>
    )
}

export default memo(Indicator)
