import { useAsyncEffect, useHover, useSafeState, useUpdateEffect } from 'ahooks'
import {
    FC,
    Key,
    forwardRef,
    memo,
    useCallback,
    useDeferredValue,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from 'react'
import { DirTreeProvider, useDirTreeContext } from '@/context/DirTreeProvider'
import { formatError, getRescTree } from '@/core'
import DirTree from '@/ui/DirTree'
import Icons from './Icons'
import {
    Architecture,
    CatlgTreeNode,
    DataNode,
    RescCatlgType,
    allNodeInfo,
    hiddenNodeType,
} from './const'
import __ from './locale'
import styles from './styles.module.less'
import type { IRescTreeQuery } from '@/core/apis/dataCatalog/index.d'

/**
 * 更新目录树数据
 * @param list 当前目录树列表
 * @param id 选中项id
 * @param children 选中项子目录
 * @returns 更新后的目录树数据
 */
const updateTreeData = (
    list: CatlgTreeNode[],
    id: string,
    children: CatlgTreeNode[],
): CatlgTreeNode[] =>
    list.map((node: any) => {
        if (node.id === id) {
            return {
                ...node,
                isLeaf: !node.expansion,
                children: children?.map((child) => ({
                    ...child,
                    isLeaf: !child.expansion,
                })),
            }
        }
        if (node.children) {
            return {
                ...node,
                isLeaf: !node.expansion,
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
const ItemView = memo(({ node }: { node: CatlgTreeNode }) => {
    const { name } = node
    const ref = useRef<HTMLDivElement | null>(null)

    return (
        <div ref={ref} className={styles['itemview-wrapper']} title={name}>
            <span className={styles['itemview-wrapper-nodename']}>{name}</span>
        </div>
    )
})

/**
 * 搜索结果项
 * @param item 节点数据
 * @returns 搜索结果项Element
 */
const SearchItem = memo(({ item }: { item: CatlgTreeNode }) => {
    const { name } = item
    const ref = useRef<HTMLDivElement | null>(null)

    return (
        <div ref={ref} className={styles['search-item']}>
            <div className={styles['search-item-right']}>
                <div
                    className={styles['search-item-content']}
                    title={`${name}`}
                >
                    <div className={styles['search-item-content-name']}>
                        {name}
                    </div>
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
const SearchContainer = memo(({ data }: { data: CatlgTreeNode[] }) => {
    const [checkedNode, setCheckedNode] = useState<CatlgTreeNode>()
    const { setCurrentNode } = useDirTreeContext()
    return (
        <div className={styles['search-wrapper']}>
            {data?.map((o: CatlgTreeNode) => (
                <div
                    key={o?.id}
                    onClick={() => {
                        setCheckedNode(o)
                        setCurrentNode({ ...o, node_id: o.id })
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
const InitParams = { limit: 0, node_id: '', recursive: false }

interface IResClassifyDirTree {
    ref: any
    getSelectedNode: (node: CatlgTreeNode) => void
    filterType: string
    isShowAll: boolean
    isShowSearch: boolean
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
 * 资源分类目录树
 * @param getSelectedNode 响应选中节点事件
 * @param filterType 查询节点类型
 */
const ResClassifyDirTree: FC<Partial<IResClassifyDirTree>> = forwardRef(
    (props: any, ref) => {
        const {
            getSelectedNode,
            filterType,
            isShowAll = true,
            isShowSearch = true,
        } = props
        const [data, setData] = useSafeState<CatlgTreeNode[]>()
        const [searchResult, setSearchResult] = useSafeState<CatlgTreeNode[]>()
        const { currentNode, setCurrentNode } = useDirTreeContext()
        const [keyword, setKeyword] = useSafeState<string>('')
        const deferredKeyWord = useDeferredValue(keyword)
        const [isLoading, setIsLoading] = useState<boolean>(false)
        const [isSearching, setIsSearching] = useState<boolean>(false)

        useImperativeHandle(ref, () => ({
            treeData: data,
        }))

        // 响应选中事件
        useEffect(() => {
            getSelectedNode(currentNode, RescCatlgType.RESC_CLASSIFY)
        }, [currentNode])

        useEffect(() => {
            if (isShowAll) {
                setCurrentNode(allNodeInfo)
            }
        }, [])

        // 获取数据
        const getData = async (
            params: Partial<IRescTreeQuery>,
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
                const responseData = await getRescTree(params)
                const res = responseData?.entries

                let initData
                if (optType === DataOpt.Init) {
                    initData = res?.map((o) => ({
                        ...o,
                        isLeaf: !o.expansion,
                    }))
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

        // 初始化
        useEffect(() => {
            getData(QueryParams, DataOpt.Init)
        }, [QueryParams])

        // 增量更新
        const onLoadData = async ({ id, children }: any) => {
            try {
                if (children) {
                    return Promise.resolve()
                }
                await getData({ ...QueryParams, node_id: id }, DataOpt.Load, id)
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
                        keyword: deferredKeyWord,
                        recursive: true,
                    },
                    DataOpt.Search,
                )
            }
        }, [deferredKeyWord])

        const handleSearch = (key: string) => {
            setKeyword(key)
        }

        const handleTopAll = useCallback(() => setCurrentNode(allNodeInfo), [])

        // 设置选中节点
        const handleSelect = (keys: Key[], info: any) => {
            const { node } = info // node: EventDataNode<DataNode>
            setCurrentNode({ ...node, node_id: node.id })
        }

        // 搜索结果渲染
        const toRenderSearch = useMemo(
            () => <SearchContainer data={searchResult as CatlgTreeNode[]} />,
            [searchResult],
        )

        const titleRender = useCallback(
            (node: any) => <ItemView node={node} />,
            [],
        )

        const getTreeNode = (
            tree: CatlgTreeNode[],
            func,
        ): CatlgTreeNode | null => {
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
            <DirTree
                conf={{
                    placeholder: __('搜索资源分类名称'),
                    isSearchEmpty:
                        searchResult !== undefined && !searchResult?.length,
                    searchRender: toRenderSearch,
                    onSearchChange: handleSearch,
                    onTopTitleClick: handleTopAll,
                    showTopTitle: isShowAll,
                    isCheckTop: !currentNode?.id,
                    showSearch: isShowSearch,
                    isSearchLoading: isSearching,
                    isTreeLoading: isLoading,
                }}
                treeData={data as any}
                loadData={onLoadData}
                fieldNames={{ key: 'id' }}
                titleRender={titleRender}
                onSelect={handleSelect}
                selectedKeys={currentNode ? [currentNode?.id] : []}
            />
        )
    },
)

export const ResClassifyDirTreeContainer = forwardRef(
    (props: Partial<IResClassifyDirTree>, ref) => {
        return (
            <DirTreeProvider>
                <ResClassifyDirTree {...props} ref={ref} />
            </DirTreeProvider>
        )
    },
)

export default memo(ResClassifyDirTreeContainer)
