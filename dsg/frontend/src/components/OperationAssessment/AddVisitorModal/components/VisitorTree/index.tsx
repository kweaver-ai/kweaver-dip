import classnames from 'classnames'
import { useAsyncEffect, useSafeState, useUpdateEffect } from 'ahooks'
import {
    FC,
    forwardRef,
    Key,
    memo,
    useCallback,
    useContext,
    useDeferredValue,
    useImperativeHandle,
    useMemo,
    useState,
} from 'react'
import { noop } from 'lodash'
import { DirTree } from '@/ui'
import { MicroWidgetPropsContext, useDirTreeContext } from '@/context'
import {
    IGetObject,
    formatError,
    getObjects,
    getUserByDepartId,
    searchUserDepart,
} from '@/core'
import VisitorLabel from '../VisitorLabel'
import { DataNode, OptionType } from '../../const'
import __ from './locale'
import styles from './styles.module.less'
import { Architecture } from '@/components/BusinessArchitecture/const'

type optItemFn = (op: OptionType, id) => void

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
                isLeaf: !children?.length,
                children: children?.map((child) => ({
                    ...child,
                    isLeaf: child?.type === 'user',
                })),
            }
        }

        if (node.children) {
            return {
                ...node,
                isLeaf: node?.isLeaf ?? false,
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
        optItem,
        items,
        showDep = false,
    }: {
        node: DataNode
        onClick?: any
        optItem: optItemFn
        items: any[]
        showDep?: boolean
    }) => {
        const isContain = useMemo(() => {
            return (items ?? []).some((o) => o.id === node.id)
        }, [node, items])

        const handleSelect = () => {
            const isUser = node.type === 'user'

            if (isUser && !isContain) {
                optItem(OptionType.Add, node)
            }
        }

        return (
            <div
                className={classnames(
                    styles['itemview-wrapper'],
                    isContain && styles.isContain,
                )}
                title={node?.name}
                onClick={() => !onClick && handleSelect()}
            >
                <div
                    className={classnames(
                        styles['itemview-wrapper-nodename'],
                        'item-title',
                    )}
                >
                    <VisitorLabel data={node} showDep={showDep} />
                </div>
            </div>
        )
    },
)

export const SearchItem = ({ data, onClick, optItem, items }: any) => {
    const isContain = useMemo(() => {
        return (items ?? []).some((o) => o.id === data.id)
    }, [data, items])

    const handleSelect = (e) => {
        const isUser = data?.type === 'user'

        if (isUser && !isContain) {
            optItem(OptionType.Add, data)
        }

        e?.stopPropagation()

        onClick?.(data)
    }

    // const { title, tip } = useMemo(
    //     () => getDepartLabelByDepartments(data?.parent_deps),
    //     [data],
    // )

    return (
        <div
            onClick={handleSelect}
            className={classnames(
                styles['search-item'],
                isContain && styles.isContain,
            )}
        >
            <ItemView
                key={data.id}
                node={data}
                onClick={handleSelect}
                items={items}
                optItem={optItem}
                showDep
            />
            {/* <div
                className={styles['search-item-path']}
                title={tip || __('未分配')}
            >
                {title || __('未分配')}
            </div> */}
        </div>
    )
}

/**
 * 搜索结果库表
 * @param data 搜索结果数组
 * @returns 搜索结果库表Element
 */
const SearchContainer = memo(
    ({
        data,
        optItem,
        items,
    }: {
        data: DataNode[]
        optItem: optItemFn
        items: any[]
    }) => {
        return (
            <div
                className={classnames(
                    styles['search-wrapper'],
                    'search-result',
                )}
            >
                {data?.map((o: DataNode) => (
                    <SearchItem
                        key={o?.id}
                        data={o}
                        items={items}
                        optItem={optItem}
                    />
                ))}
            </div>
        )
    },
)

const InitParams = { limit: 0, id: '', is_all: false }

interface IVisitorTree {
    items: any[]
    optItem: optItemFn
    getSelectedNode: (node: DataNode) => void
    filterType: string
    hiddenType: Architecture[]
    canEmpty: boolean
    isShowSearch: boolean
    isShowOperate: boolean
    type?: string
    handleLoadOrEmpty?: (isLoading: boolean, isEmpty: boolean) => void
    ref: any
}

/**
 * 数据获取类别
 */
enum DataOpt {
    Init,
    Load,
    Search,
}

const VisitorTree: FC<Partial<IVisitorTree>> = forwardRef((props: any, ref) => {
    const {
        items = [],
        optItem = noop,
        filterType,
        canEmpty = true,
        isShowSearch = true,
        isShowOperate = false,
        hiddenType = [],
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

    const onClear = () => {
        setKeyword('')
    }

    useImperativeHandle(ref, () => ({
        onClear,
    }))

    useUpdateEffect(() => {
        if (handleLoadOrEmpty) {
            handleLoadOrEmpty(isLoading, !isLoading && !data?.length)
        }
    }, [isLoading, data])

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
                              depart_id: parent_id,
                              is_depart_in_need: true,
                          })
                        : Promise.resolve([]),
                ])

            const departs = departRes?.entries?.map((o) => ({
                ...o,
                kstr: o.id,
                isLeaf: false,
            }))

            const kstr = Math.random().toString(36).slice(-6)

            const users = userRes?.map((o) => ({
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

    const QueryParams = useMemo(
        () => ({ ...InitParams, type: filterType }),
        [filterType],
    )

    useAsyncEffect(async () => {
        getData(QueryParams, DataOpt.Init)
    }, [QueryParams])

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

            setSearchResult(res ?? [])
        } catch (error) {
            formatError(error, microWidgetProps?.components?.toast)
        } finally {
            setIsSearching(false)
        }
    }

    useUpdateEffect(() => {
        if (deferredKeyWord) {
            getSearchData({ keyword: deferredKeyWord, limit: 99, offset: 1 })
        } else {
            setSearchResult(undefined)
        }
    }, [deferredKeyWord])

    const handleSearch = (key: string) => {
        setKeyword(key)
    }

    const handleSelect = (keys: Key[], info: any) => {
        const { node } = info
        setCurrentNode(node)
    }

    const toRenderSearch = useMemo(
        () => (
            <SearchContainer
                data={searchResult as DataNode[]}
                items={items}
                optItem={optItem}
            />
        ),
        [isShowOperate, searchResult, items],
    )

    const titleRender = useCallback(
        (node: any) => <ItemView node={node} items={items} optItem={optItem} />,
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
                    placeholder: __('搜索用户'),
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
})

export default memo(VisitorTree)
