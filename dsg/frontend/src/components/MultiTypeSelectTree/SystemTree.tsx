import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { flatMapDeep } from 'lodash'
import classnames from 'classnames'
import InfiniteScroll from 'react-infinite-scroll-component'
import { useSafeState } from 'ahooks'
import { BusinessSystemOutlined, FontIcon } from '@/icons'
import dataEmpty from '@/assets/dataEmpty.svg'
import { formatError, ISystemItem, reqInfoSystemList } from '@/core'
import styles from './styles.module.less'
import { UNGROUPED } from './const'
import __ from './locale'
import { Empty, Loader, SearchInput } from '@/ui'

const selectAllNode = {
    id: '',
    type: '',
    isAll: '',
    cate_id: '',
    name: __('全部'),
}

const InitParams = {
    offset: 1,
    limit: 50,
    keyword: '',
    sort: 'name',
    direction: 'asc',
}

interface SystemTreeProps {
    needUncategorized?: boolean
    unCategorizedKey?: string
    setSelectedNode: (node: any) => void
    selectedNode: any
}
const SystemTree = ({
    needUncategorized = true,
    unCategorizedKey = UNGROUPED,
    setSelectedNode,
    selectedNode,
}: SystemTreeProps) => {
    const [isLoading, setIsLoading] = useState(true)
    const [data, setData] = useState<ISystemItem[]>([])

    const [queryParams, setQueryParams] = useState<any>(InitParams)
    const [totalCount, setTotalCount] = useState<number>(0)
    const [listDataLoading, setListDataLoading] = useState(false)

    const listContainer: any = useRef()
    const scrollListId = 'scrollableDiv'

    useEffect(() => {
        getSystems()
    }, [queryParams])

    // 获取信息系统
    const getSystems = async () => {
        try {
            setListDataLoading(true)
            const res = await reqInfoSystemList(queryParams)
            setTotalCount(res.total_count)
            if (queryParams.offset === 1) {
                setData(res.entries || [])
            } else {
                setData([...data, ...res.entries])
            }
        } catch (error) {
            formatError(error)
        } finally {
            setIsLoading(false)
            setListDataLoading(false)
        }
    }

    return isLoading ? (
        <Loader />
    ) : !data?.length && !queryParams?.keyword ? (
        <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
    ) : (
        <div className={styles['system-tree-container']}>
            <div className={styles['search-input']}>
                <SearchInput
                    placeholder={__('搜索信息系统')}
                    value={queryParams.keyword}
                    onKeyChange={(word) => {
                        setQueryParams({
                            ...queryParams,
                            offset: 1,
                            keyword: word,
                        })
                    }}
                />
            </div>
            <div
                className={classnames(
                    styles['dirtree-content-data-top'],
                    selectedNode?.id === '' ? styles.checked : '',
                    'dirtree-content-data-top',
                )}
                onClick={() => {
                    setSelectedNode(selectAllNode)
                }}
            >
                {__('全部')}
            </div>
            <div
                ref={listContainer}
                id={scrollListId}
                className={styles['scroller-content']}
            >
                <InfiniteScroll
                    hasMore={data.length < totalCount}
                    dataLength={data.length}
                    scrollableTarget={scrollListId}
                    loader={
                        <div
                            className={styles.listLoading}
                            hidden={!listDataLoading}
                        >
                            <Loader />
                        </div>
                    }
                    next={() => {
                        setQueryParams({
                            ...queryParams,
                            offset: queryParams.offset + 1,
                        })
                    }}
                >
                    {!data?.length && queryParams?.keyword ? (
                        <Empty />
                    ) : (
                        (needUncategorized &&
                        unCategorizedKey &&
                        !queryParams.keyword
                            ? [
                                  ...data,
                                  {
                                      id: unCategorizedKey,
                                      type: '',

                                      cate_id: '',
                                      name: __('未分类'),
                                  },
                              ]
                            : [...data]
                        ).map((item) => {
                            return (
                                <div
                                    key={item?.id}
                                    className={
                                        item?.id === selectedNode?.id
                                            ? styles.checked
                                            : ''
                                    }
                                    onClick={() => {
                                        setSelectedNode(item)
                                    }}
                                >
                                    <div
                                        className={
                                            styles['search-item-wrapper']
                                        }
                                    >
                                        <div className={styles['search-item']}>
                                            <div
                                                className={
                                                    styles['search-item-icon']
                                                }
                                            >
                                                <FontIcon
                                                    name="icon-yewuxitong1"
                                                    style={{
                                                        // color: '#59A3FF',
                                                        fontSize: '16px',
                                                        visibility:
                                                            item.id ===
                                                            unCategorizedKey
                                                                ? 'hidden'
                                                                : 'visible',
                                                    }}
                                                />
                                                {/* <BusinessSystemOutlined
                                                style={{
                                                    // color: '#59A3FF',
                                                    marginTop: '2px',
                                                    fontSize: '16px',
                                                    visibility:
                                                        item.id ===
                                                        unCategorizedKey
                                                            ? 'hidden'
                                                            : 'visible',
                                                }}
                                            /> */}
                                            </div>
                                            <div
                                                className={
                                                    styles['search-item-right']
                                                }
                                            >
                                                <div
                                                    className={
                                                        styles[
                                                            'search-item-content'
                                                        ]
                                                    }
                                                >
                                                    <div
                                                        className={
                                                            styles[
                                                                'search-item-content-name'
                                                            ]
                                                        }
                                                        title={item.name}
                                                    >
                                                        {item.name}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </InfiniteScroll>
            </div>
        </div>
    )
}

export default SystemTree
