import { useAsyncEffect, useSafeState, useUpdateEffect } from 'ahooks'
import classnames from 'classnames'
import React, {
    FC,
    Key,
    memo,
    useCallback,
    useDeferredValue,
    useEffect,
    useMemo,
    useState,
} from 'react'
import Icons from '@/components/BusinessArchitecture/Icons'
import {
    Architecture,
    DataNode,
    hiddenNodeType,
} from '@/components/BusinessArchitecture/const'
import { DirTreeProvider, useDirTreeContext } from '@/context'
import { IGetObject, formatError, getObjects } from '@/core'
import { DirTree, EllipsisMiddle } from '@/ui'
import __ from '../../locale'
import styles from './styles.module.less'
/**
 * 更新目录树数据
 * @param list 当前目录树列表
 * @param id 选中项id
 * @param children 选中项子目录
 * @returns 更新后的目录树数据
 */
const updateTreeData = (
    list: DataNode[],
    id: string,
    children: DataNode[],
): DataNode[] =>
    list.map((node) => {
        if (node.id === id) {
            return {
                ...node,
                isLeaf: !node.expand,
                children: children?.map((child) => ({
                    ...child,
                    isLeaf: !child.expand,
                })),
            }
        }
        if (node.children) {
            return {
                ...node,
                isLeaf: !node.expand,
                children: updateTreeData(node.children, id, children),
            }
        }
        return { ...node }
    })

/**
 * 目录项
 * @param node 节点数据
 * @returns 目录项Element
 */
const ItemView = memo(
    ({ node, uncategorized }: { node: DataNode; uncategorized: boolean }) => {
        const { name, type } = node

        return (
            <div className={styles['itemview-wrapper']} title={name}>
                <span
                    className={styles['itemview-icon']}
                    hidden={uncategorized}
                >
                    <Icons type={type as Architecture} />
                </span>
                <span className={styles['itemview-wrapper-nodename']}>
                    {name}
                </span>
            </div>
        )
    },
)

/**
 * 搜索结果项
 * @param item 节点数据
 * @returns 搜索结果项Element
 */
const SearchItem = memo(({ item }: { item: DataNode }) => {
    const { name, path, type } = item

    return (
        <div className={styles['search-item']}>
            <div className={styles['search-item-icon']}>
                <Icons type={type as Architecture} />
            </div>
            <div className={styles['search-item-right']}>
                <div className={styles['search-item-content']}>
                    <div
                        className={styles['search-item-content-name']}
                        title={name}
                    >
                        {name}
                    </div>
                    {path && path !== name && (
                        <div
                            className={styles['search-item-content-path']}
                            title={path}
                        >
                            <EllipsisMiddle>{path}</EllipsisMiddle>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
})

/**
 * 搜索结果库表
 * @param data 搜索结果数组
 * @returns 搜索结果库表Element
 */
const SearchContainer = memo(({ data }: { data: DataNode[] }) => {
    const { setCurrentNode } = useDirTreeContext()
    const [checkedNode, setCheckedNode] = useState<DataNode>()
    return (
        <div className={classnames(styles['search-wrapper'], 'search-result')}>
            {data?.map((o: DataNode) => (
                <div
                    key={o?.id}
                    onClick={() => {
                        setCheckedNode(o)
                        setCurrentNode(o)
                    }}
                    className={checkedNode?.id === o?.id ? styles.checked : ''}
                >
                    <SearchItem key={o.id} item={o} />
                </div>
            ))}
        </div>
    )
})
// 参数设置
const InitParams = { limit: 0, id: '', is_all: false }

interface IArchitectureTree {
    getSelectedNode: (node: DataNode) => void
    // 过滤的节点类型
    filterType: string
    // 隐藏的节点类型
    hiddenType: Architecture[]
    // 能否展示数据空库表
    canEmpty: boolean
    isShowAll: boolean
    isShowSearch: boolean
    isShowOperate: boolean
    type?: string
    handleLoadOrEmpty?: (isLoading: boolean, isEmpty: boolean) => void
    extendNodesData?: { title: React.ReactNode | string; id: string }[]
    needUncategorized?: boolean // 是否需要显示未分类
    unCategorizedKey?: string // 未分类的名称
}

/**
 * 数据获取类别
 */
enum DataOpt {
    Init,
    Load,
    Search,
}
/**
 * 组织架构目录树
 */
const ArchitectureTree: FC<Partial<IArchitectureTree>> = (props: any) => {
    const {
        getSelectedNode,
        filterType,
        canEmpty = true,
        isShowAll = true,
        isShowSearch = true,
        isShowOperate = false,
        hiddenType = hiddenNodeType,
        type,
        handleLoadOrEmpty,
        needUncategorized = false,
        unCategorizedKey = 'uncategory',
    } = props

    const [data, setData] = useSafeState<DataNode[]>()
    const [searchResult, setSearchResult] = useSafeState<DataNode[]>()
    const { currentNode, setCurrentNode } = useDirTreeContext()
    const [keyword, setKeyword] = useSafeState<string>('')
    const deferredKeyWord = useDeferredValue(keyword)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [isSearching, setIsSearching] = useState<boolean>(false)

    useUpdateEffect(() => {
        if (handleLoadOrEmpty) {
            handleLoadOrEmpty(isLoading, !isLoading && !data?.length)
        }
    }, [isLoading, data])

    // 响应选中事件
    useEffect(() => {
        if (type) {
            getSelectedNode(currentNode, type)
        } else {
            getSelectedNode(currentNode)
        }
    }, [currentNode, type])

    useEffect(() => {
        if (isShowAll) {
            setCurrentNode({ id: '' })
        }
    }, [isShowAll])

    // 获取数据
    const getData = async (
        params: IGetObject,
        optType: DataOpt,
        parent_id?: string,
    ) => {
        try {
            if (optType === DataOpt.Init) {
                setIsLoading(true)
            }
            if (optType === DataOpt.Search && searchResult === undefined) {
                setIsSearching(true)
            }
            const responseData = await getObjects(params)
            const res = responseData?.entries

            let initData
            if (optType === DataOpt.Init) {
                initData = res?.map((o) => ({
                    ...o,
                    isLeaf: !o.expand,
                }))
                if (needUncategorized) {
                    initData = [
                        ...initData,
                        {
                            isLeaf: true,
                            name: __('未分类'),
                            id: unCategorizedKey,
                        },
                    ]
                }
            }
            switch (optType) {
                case DataOpt.Init:
                    setData(initData)
                    if (!isShowAll && initData?.length) {
                        setCurrentNode(initData?.[0])
                    }
                    setIsLoading(false)
                    break
                case DataOpt.Load:
                    setData((prev: DataNode[] | undefined) =>
                        updateTreeData(prev!, parent_id!, res),
                    )
                    break
                case DataOpt.Search:
                    setSearchResult(res)
                    setIsSearching(false)
                    break
                default:
                    break
            }
        } catch (error) {
            formatError(error)
            setIsLoading(false)
            setIsSearching(false)
        }
    }

    // 初始化参数
    const QueryParams = useMemo(
        () => ({ ...InitParams, type: filterType }),
        [filterType],
    )

    // 节点查询
    useAsyncEffect(async () => {
        getData(QueryParams, DataOpt.Init)
    }, [QueryParams])

    // 增量更新
    const onLoadData = async ({ id, children }: any) => {
        try {
            if (children) {
                return Promise.resolve()
            }
            await getData({ ...QueryParams, id }, DataOpt.Load, id)
        } catch (err) {
            formatError(err)
        }
        return Promise.resolve()
    }

    // 搜索查询
    useUpdateEffect(() => {
        if (deferredKeyWord) {
            getData(
                {
                    ...QueryParams,
                    is_all: true,
                    keyword: deferredKeyWord,
                },
                DataOpt.Search,
            )
        } else {
            setSearchResult(undefined)
        }
    }, [deferredKeyWord])

    const handleSearch = (key: string) => {
        setKeyword(key)
    }

    const handleTopAll = useCallback(() => setCurrentNode({ id: '' }), [])

    // 设置选中节点
    const handleSelect = (keys: Key[], info: any) => {
        const { node } = info // node: EventDataNode<DataNode>
        setCurrentNode(node)
    }

    // 搜索结果渲染
    const toRenderSearch = useMemo(
        () => <SearchContainer data={searchResult as DataNode[]} />,
        [isShowOperate, searchResult],
    )

    const titleRender = useCallback(
        (node: any) => (
            <ItemView
                node={node}
                uncategorized={unCategorizedKey === node.id}
            />
        ),
        [isShowOperate, hiddenType],
    )

    const getTreeNode = (tree: DataNode[], func): DataNode | null => {
        // eslint-disable-next-line
        for (const node of tree) {
            if (func(node)) return node
            if (node.children) {
                const res = getTreeNode(node.children, func)
                if (res) return res
            }
        }
        return null
    }
    return (
        <div className={styles['architecture-tree']}>
            <DirTree
                conf={{
                    placeholder: __('搜索组织或部门'),
                    isSearchEmpty:
                        searchResult !== undefined && !searchResult?.length,
                    canTreeEmpty: canEmpty,
                    searchRender: toRenderSearch,
                    onSearchChange: handleSearch,
                    onTopTitleClick: handleTopAll,
                    isCheckTop: !currentNode?.id,
                    showTopTitle: isShowAll,
                    showSearch: isShowSearch,
                    isSearchLoading: isSearching,
                    isTreeLoading: isLoading,
                    topTitle: __('可授权的'),
                }}
                treeData={data as any}
                loadData={onLoadData}
                fieldNames={{ key: 'id' }}
                titleRender={titleRender}
                onSelect={handleSelect}
                selectedKeys={currentNode ? [currentNode?.id] : []}
            />
        </div>
    )
}

export const ArchitectureTreeContainer = (
    props: Partial<IArchitectureTree>,
) => {
    return (
        <DirTreeProvider>
            <ArchitectureTree {...props} />
        </DirTreeProvider>
    )
}

export default memo(ArchitectureTreeContainer)
