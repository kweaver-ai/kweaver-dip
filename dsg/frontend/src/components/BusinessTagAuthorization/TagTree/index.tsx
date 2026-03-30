import { useEffect, useMemo, useState } from 'react'
import { useAntdTable, useUpdateEffect } from 'ahooks'
import classNames from 'classnames'
import { useQuery } from '@/utils'
import { Loader, Empty, SearchInput } from '@/ui'
import empty from '@/assets/dataEmpty.svg'
import styles from './styles.module.less'
import { getTagCategoryExcludeTreeNode, formatError } from '@/core'
import __ from '../locale'

interface ITagTree {
    onNodeClick: (o) => void
}
const TagTree = (props: ITagTree) => {
    const { onNodeClick } = props
    const query = useQuery()
    const tagId = query.get('id') || ''
    const [dataList, setDataList] = useState<any>([])
    const [loading, setLoading] = useState<boolean>(false)
    const [searchCondition, setSearchCondition] = useState<any>({
        offset: 1,
        limit: 100,
        keyword: '',
    })
    const AllNode = { name: __('全部'), id: '' }
    const [activeNode, setActiveNode] = useState<any>({})
    const [searchKey, setSearchKey] = useState('')

    useEffect(() => {
        getDataList()
    }, [searchCondition])

    useUpdateEffect(() => {
        if (searchKey === searchCondition.keyword) return
        setSearchCondition({
            ...searchCondition,
            keyword: searchKey,
            offset: 1,
        })
    }, [searchKey])

    const getDataList = async () => {
        try {
            setLoading(true)
            const { entries } = await getTagCategoryExcludeTreeNode(
                searchCondition,
            )
            setDataList([AllNode, ...entries])
            if (!searchCondition?.keyword) {
                if (tagId) {
                    const node = entries.find((item) => item.id === tagId)
                    setActiveNode(node)
                    onNodeClick(node)
                } else {
                    setActiveNode(AllNode)
                    onNodeClick(AllNode)
                }
            }
        } catch (err) {
            formatError(err)
        } finally {
            setLoading(false)
        }
    }

    // 空库表
    const renderEmpty = () => {
        const createView = <Empty desc={__('暂无数据')} iconSrc={empty} />
        return searchKey ? <Empty /> : createView
    }

    return (
        <div className={styles.tagTreeWrapper}>
            <div className={styles.title}>{__('标签授权')}</div>
            <SearchInput
                className={styles.searchInp}
                placeholder={__('搜索标签分类')}
                onKeyChange={(kw: string) => {
                    if (!kw) return
                    setSearchCondition({
                        ...searchCondition,
                        offset: 1,
                        keyword: kw,
                    })
                    setSearchKey(kw)
                }}
                // 解决清除按钮接口调用2次
                onChange={(e) => {
                    const { value } = e.target
                    if (!value) {
                        setSearchCondition({
                            ...searchCondition,
                            offset: 1,
                            keyword: undefined,
                        })
                    }
                }}
            />
            <div className={styles.tagBox}>
                {!dataList?.length ? (
                    <div className={styles.emptyWrapper}>{renderEmpty()}</div>
                ) : loading ? (
                    <Loader />
                ) : (
                    dataList.map((item) => {
                        return (
                            <div
                                className={classNames(
                                    styles.tagItem,
                                    activeNode?.id === item?.id &&
                                        styles.active,
                                )}
                                title={item.name}
                                onClick={() => {
                                    setActiveNode(item)
                                    onNodeClick(item)
                                }}
                            >
                                {item.name}
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}

export default TagTree
