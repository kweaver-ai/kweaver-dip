import React, { memo, useEffect, useRef } from 'react'
import { BackTop, List, Tooltip } from 'antd'
import InfiniteScroll from 'react-infinite-scroll-component'
import { Loader, Empty } from '@/ui'
import styles from './styles.module.less'
import dataEmpty from '@/assets/dataEmpty.svg'
import { ReturnTopOutlined } from '@/icons'
import __ from '../locale'

const ScrollId = 'scrollListId'

const emptyView = (isSearch: boolean) => {
    return isSearch ? <Empty /> : <Empty iconSrc={dataEmpty} desc="暂无数据" />
}

// 置顶
export const goBackTop = (eleId: string) => {
    document.body.scrollTop = 0
    document.documentElement.scrollTop = 0
    const layout = document.getElementById(eleId)

    if (layout?.scrollTop) {
        layout.scrollTop = 0
    } else {
        layout?.scrollTo(0, 0)
    }
}
function ScrollList({
    loading,
    data,
    isSearch,
    itemRender,
    onLoad,
    hasMore,
    scrollTop,
    ref,
}: any) {
    const scrollRef: any = useRef()
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = 0
        }
    }, [scrollRef, scrollTop])

    return (
        <div className={styles['scroll-list']}>
            <div className={styles['scroll-list-loading']} hidden={!loading}>
                <Loader />
            </div>
            <div
                id={ScrollId}
                ref={ref}
                className={styles['scroll-list-content']}
                hidden={loading}
            >
                {!data?.length ? (
                    <div className={styles['scroll-list-empty']}>
                        {emptyView(isSearch)}
                    </div>
                ) : (
                    <InfiniteScroll
                        dataLength={data.length}
                        next={() => onLoad()}
                        hasMore={hasMore}
                        loader={
                            <div className={styles['scroll-list-loading']}>
                                <Loader />
                            </div>
                        }
                        scrollableTarget={ScrollId}
                        endMessage={
                            data?.length >= 10 ? (
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
                )}
            </div>
            {!loading && (
                <Tooltip title={__('回到顶部')} placement="top">
                    <BackTop
                        className={styles['back-top']}
                        target={() =>
                            document.getElementById(ScrollId) || window
                        }
                        onClick={() => {
                            // 页面置顶
                            goBackTop(ScrollId)
                        }}
                    >
                        <ReturnTopOutlined />
                    </BackTop>
                </Tooltip>
            )}
        </div>
    )
}

export default memo(ScrollList)
