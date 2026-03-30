import { List, Spin } from 'antd'
import { memo, useEffect, useRef } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import { Loader } from '@/ui'
import styles from './styles.module.less'

export const ScrollViewId = 'scrollViewListId'
export const ScrollFieldId = 'scrollFieldListId'
export const PageSize = 20

function ViewScrollList({
    data,
    itemRender,
    onLoad,
    hasMore,
    scrollTop,
    scrollableTarget,
}: any) {
    const scrollRef: any = useRef()
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = 0
        }
    }, [scrollRef, scrollTop])

    return (
        <InfiniteScroll
            dataLength={data.length}
            next={() => onLoad()}
            hasMore={hasMore}
            loader={
                <div className={styles['scroll-list-loading']}>
                    <Spin size="small" />
                </div>
            }
            scrollableTarget={scrollableTarget}
            endMessage={
                data?.length >= PageSize ? (
                    <div
                        style={{
                            textAlign: 'center',
                            color: 'rgba(0,0,0,0.25)',
                            padding: '8px 0',
                            fontSize: '12px',
                        }}
                    >
                        已经到底了
                    </div>
                ) : undefined
            }
        >
            <List dataSource={data} renderItem={itemRender} />
        </InfiniteScroll>
    )
}

export default memo(ViewScrollList)
