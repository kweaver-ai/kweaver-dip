import { useAsyncEffect, useSafeState, useUpdateEffect } from 'ahooks'
import classnames from 'classnames'
import {
    FC,
    Key,
    memo,
    useCallback,
    useDeferredValue,
    useEffect,
    useMemo,
    useState,
} from 'react'
import {
    Architecture,
    DataNode,
    allNodeInfo,
    hiddenNodeType,
} from '@/components/BusinessArchitecture/const'
import { useDirTreeContext } from '@/context'
import {
    IGetObject,
    formatError,
    getObjects,
    getUserByDepartId,
    searchUserDepart,
} from '@/core'
import { DirTree } from '@/ui'
import __ from '../locale'
import { useVisitorContext } from '../VisitorProvider'
import VisitorLabel from './VisitorLabel'
import { OptionType, useVisitorModalContext } from './VisitorModalProvider'
import styles from './styles.module.less'
import { getCurrentPath } from '../helper'
import { getUserIsVisitor } from '@/components/AccessPolicy/const'

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
    list.map((node: any) => {
        if (node.id === id) {
            return {
                ...node,
                isLeaf: !children?.length, // !node.expand
                children: children?.map((child) => ({
                    ...child,
                    isLeaf: child?.type === 'user', // !child.expand
                })),
            }
        }
        if (node.children) {
            return {
                ...node,
                isLeaf: node?.isLeaf ?? false, //! node.expand
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
    ({
        node,
        onClick,
        isApplier,
    }: {
        node: DataNode
        onClick?: any
        isApplier?: boolean
    }) => {
        const { bindItems, currentId } = useVisitorContext()
        const { optItem, items } = useVisitorModalContext()
        const isMe = useMemo(() => {
            return node.type === 'user' && node.id === currentId
        }, [node, currentId])
        const isContain = useMemo(() => {
            const bindIds = (bindItems ?? [])?.map((o) => ({
                id: o.subject_id,
            }))
            return [...bindIds, ...(items ?? [])].some((o) => o.id === node.id)
        }, [node, bindItems, items])

        const handleSelect = () => {
            if (!isContain && node.type === 'user') {
                optItem(OptionType.Add, node)
            }
        }

        return (
            <div
                className={classnames(
                    styles['itemview-wrapper'],
                    // isApplier && styles.isMe,
                    isContain && styles.isContain,
                )}
                onClick={() => !onClick && handleSelect()}
            >
                <VisitorLabel data={node} />
                {isContain && (
                    <span className={styles['itemview-wrapper-label']}>
                        已添加
                    </span>
                )}
                {isApplier && (
                    <span className={styles['itemview-wrapper-label']}>
                        需求提出者
                    </span>
                )}
                {/* {isMe ? (
                    <span className={styles['itemview-wrapper-label']}>我</span>
                ) : (
                    isContain && (
                        <span className={styles['itemview-wrapper-label']}>
                            已添加
                        </span>
                    )
                )} */}
            </div>
        )
    },
)

export const SearchItem = ({ data, onClick, applierId }: any) => {
    const { bindItems, currentId } = useVisitorContext()
    const { optItem, items } = useVisitorModalContext()
    const isMe = useMemo(() => {
        return data.type === 'user' && data.id === currentId
    }, [data, currentId])

    const isApplier = useMemo(() => {
        return data.type === 'user' && data.id === applierId
    }, [data, applierId])

    const isContain = useMemo(() => {
        const bindIds = (bindItems ?? [])?.map((o) => ({
            id: o.subject_id,
        }))
        return [...bindIds, ...(items ?? [])].some((o) => o.id === data.id)
    }, [data, bindItems, items])

    const handleSelect = (e) => {
        if (!isContain && !isMe) {
            optItem(OptionType.Add, data)
        }
        e?.stopPropagation()
        onClick?.(data)
    }
    return (
        <div
            onClick={handleSelect}
            className={classnames(
                styles['search-item'],
                data?.path && styles['has-path'],
            )}
        >
            <ItemView
                key={data.id}
                node={data}
                onClick={handleSelect}
                isApplier={isApplier}
            />
            {data?.path && (
                <div className={styles['search-item-path']} title={data.path}>
                    {getCurrentPath(data.path)}
                </div>
            )}
        </div>
    )
}

/**
 * 搜索结果库表
 * @param data 搜索结果数组
 * @returns 搜索结果库表Element
 */
const SearchContainer = memo(({ data }: { data: DataNode[] }) => {
    return (
        <div className={classnames(styles['search-wrapper'], 'search-result')}>
            {data?.map((o: DataNode) => (
                <SearchItem key={o?.id} data={o} />
            ))}
        </div>
    )
})
// 参数设置
const InitParams = { limit: 0, id: '', is_all: false }

interface IVisitorTree {
    getSelectedNode: (node: DataNode) => void
    // 过滤的节点类型
    filterType: string
    // 隐藏的节点类型
    hiddenType: Architecture[]
    // 能否展示数据空库表
    canEmpty: boolean
    isShowSearch: boolean
    isShowOperate: boolean
    type?: string
    handleLoadOrEmpty?: (isLoading: boolean, isEmpty: boolean) => void
    applierId?: string
}

/**
 * 数据获取类别
 */
enum DataOpt {
    Init,
    Load,
    Search,
}

const VisitorTree: FC<Partial<IVisitorTree>> = (props) => {
    const {
        filterType,
        canEmpty = true,
        isShowSearch = true,
        isShowOperate = false,
        hiddenType = hiddenNodeType,
        type,
        handleLoadOrEmpty,
        applierId,
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

    // 获取数据
    const getData = async (
        params: IGetObject,
        optType: DataOpt,
        parent_id?: string,
        path?: string,
    ) => {
        try {
            if (optType === DataOpt.Init) {
                setIsLoading(true)
            }

            const [{ value: departRes }, { value: userRes }]: any =
                await Promise.allSettled([
                    getObjects(params),
                    parent_id
                        ? getUserByDepartId({ depart_id: parent_id })
                        : Promise.resolve([]),
                ])
            const departs = departRes?.entries?.map((o) => ({
                ...o,
                isLeaf: false,
            }))
            const users = userRes
                // ?.filter((current) => getUserIsVisitor(current))
                ?.map((o) => ({ ...o, type: 'user', path }))
            const res = [...departs, ...users]

            switch (optType) {
                case DataOpt.Init:
                    setData(res)
                    setIsLoading(false)
                    break
                case DataOpt.Load:
                    setData((prev: DataNode[] | undefined) =>
                        updateTreeData(prev!, parent_id!, res),
                    )
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
    const onLoadData = async ({ id, children, path }: any) => {
        try {
            if (children) {
                return Promise.resolve()
            }
            await getData({ ...QueryParams, id }, DataOpt.Load, id, path)
        } catch (err) {
            formatError(err)
        }
        return Promise.resolve()
    }

    const getSearchData = async (params: any) => {
        try {
            if (searchResult === undefined) {
                setIsSearching(true)
            }
            const res = await searchUserDepart(params)
            // setSearchResult(
            //     res?.filter((current) => getUserIsVisitor(current)) ?? [],
            // )
            setSearchResult(res ?? [])
        } catch (error) {
            formatError(error)
        } finally {
            setIsSearching(false)
        }
    }

    // 搜索查询
    useUpdateEffect(() => {
        if (deferredKeyWord) {
            // TODO
            getSearchData({ keyword: deferredKeyWord, limit: 99, offset: 1 })
        } else {
            setSearchResult(undefined)
        }
    }, [deferredKeyWord])

    const handleSearch = (key: string) => {
        setKeyword(key)
    }

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
            <ItemView node={node} isApplier={node.id === applierId} />
        ),
        [isShowOperate, hiddenType, applierId],
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
        <div className={styles['visitor-tree']}>
            <DirTree
                conf={{
                    placeholder: __('搜索用户、部门名称'),
                    isSearchEmpty:
                        searchResult !== undefined && !searchResult?.length,
                    canTreeEmpty: canEmpty,
                    searchRender: toRenderSearch,
                    onSearchChange: handleSearch,
                    showSearch: isShowSearch,
                    isSearchLoading: isSearching,
                    isTreeLoading: isLoading,
                    showTopTitle: false,
                }}
                className={styles['visitor-tree-list']}
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

export default memo(VisitorTree)
