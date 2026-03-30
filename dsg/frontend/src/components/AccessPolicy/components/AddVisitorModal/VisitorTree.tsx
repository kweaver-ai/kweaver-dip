import { useAsyncEffect, useSafeState, useUpdateEffect } from 'ahooks'
import classnames from 'classnames'
import {
    CSSProperties,
    FC,
    Key,
    memo,
    useCallback,
    useContext,
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
import { MicroWidgetPropsContext, useDirTreeContext } from '@/context'
import {
    IGetObject,
    formatError,
    getObjects,
    getUserByDepartId,
    searchUserDepart,
} from '@/core'
import { DirTree } from '@/ui'
import __ from '../../locale'
import { useVisitorContext } from '../VisitorProvider'
import VisitorLabel from './VisitorLabel'
import { OptionType, useVisitorModalContext } from './VisitorModalProvider'
import styles from './styles.module.less'
import { getCurrentPath, getDepartLabelByDepartments } from '../../helper'
import { getUserIsVisitor } from '../../const'

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
    ({ node, onClick }: { node: DataNode; onClick?: any }) => {
        const { bindItems, currentId, checkMe } = useVisitorContext()
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
            // 暂时只支持添加用户
            const isUser = node.type === 'user'
            const canMe = checkMe ? !isMe : true
            if (isUser && !isContain && canMe) {
                optItem(OptionType.Add, node)
            }
        }

        return (
            <div
                className={classnames(
                    styles['itemview-wrapper'],
                    checkMe && isMe && styles.isMe,
                    isContain && styles.isContain,
                )}
                title={
                    isContain
                        ? __('${name} 【已添加】', { name: node?.name })
                        : node?.name
                }
                onClick={() => !onClick && handleSelect()}
            >
                <div
                    className={classnames(
                        styles['itemview-wrapper-nodename'],
                        'item-title',
                    )}
                >
                    <VisitorLabel
                        data={node}
                        title={
                            isContain
                                ? __('${name} 【已添加】', { name: node?.name })
                                : node?.name
                        }
                    />
                </div>
                {/* {isMe ? (
                    <div className={styles['itemview-wrapper-label']}>我</div>
                ) : (
                    isContain && (
                        <div className={styles['itemview-wrapper-label']}>
                            已添加
                        </div>
                    )
                )} */}
            </div>
        )
    },
)

export const SearchItem = ({ data, onClick }: any) => {
    const { bindItems, currentId, checkMe } = useVisitorContext()
    const { optItem, items } = useVisitorModalContext()
    const isMe = useMemo(() => {
        return data.type === 'user' && data.id === currentId
    }, [data, currentId])

    const isContain = useMemo(() => {
        const bindIds = (bindItems ?? [])?.map((o) => ({
            id: o.subject_id,
        }))
        return [...bindIds, ...(items ?? [])].some((o) => o.id === data.id)
    }, [data, bindItems, items])

    const handleSelect = (e) => {
        // 暂时只支持添加用户
        const isUser = data?.type === 'user'
        const canMe = checkMe ? !isMe : true
        if (!isContain && canMe) {
            optItem(OptionType.Add, data)
        }
        e?.stopPropagation()
        onClick?.(data)
    }

    const { title, tip } = useMemo(
        () =>
            data.type === 'app'
                ? {
                      title: data?.description,
                      tip: data?.description
                          ? __('描述：${description}', {
                                description: data?.description,
                            })
                          : '',
                  }
                : getDepartLabelByDepartments(data?.parent_deps),
        [data],
    )

    return (
        <div
            onClick={handleSelect}
            className={classnames(
                styles['search-item'],
                isContain && styles.isContain,
            )}
        >
            <ItemView key={data.id} node={data} onClick={handleSelect} />
            {tip ? (
                <div
                    className={styles['search-item-path']}
                    title={tip || __('未分配')}
                >
                    {title || __('未分配')}
                </div>
            ) : null}
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
    } = props
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)
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
                        ? getUserByDepartId({
                              is_depart_in_need: true,
                              depart_id: parent_id,
                          })
                        : Promise.resolve([]),
                ])
            const departs = departRes?.entries?.map((o) => ({
                ...o,
                kstr: o.id,
                isLeaf: false,
            }))
            const kstr = Math.random().toString(36).slice(-6)
            const users = userRes
                // ?.filter((current) => getUserIsVisitor(current))
                ?.map((o) => ({
                    ...o,
                    type: 'user',
                    path,
                    kstr: `${o.id}${kstr || ''}`,
                }))
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
            formatError(error, microWidgetProps?.components?.toast)
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
            formatError(err, microWidgetProps?.components?.toast)
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
            setSearchResult(res || [])
        } catch (error) {
            formatError(error, microWidgetProps?.components?.toast)
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
        (node: any) => <ItemView node={node} />,
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
        <div className={styles['visitor-tree']}>
            <DirTree
                conf={{
                    placeholder: __('搜索已有角色用户，快速添加访问者'),
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
                fieldNames={{ key: 'kstr' }}
                titleRender={titleRender}
                onSelect={handleSelect}
                selectedKeys={currentNode ? [currentNode?.id] : []}
            />
        </div>
    )
}

export default memo(VisitorTree)
