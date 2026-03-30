import { CheckOutlined, EllipsisOutlined } from '@ant-design/icons'
import { useAsyncEffect, useHover, useSafeState, useUpdateEffect } from 'ahooks'
import { Collapse, Dropdown, MenuProps } from 'antd'
import {
    FC,
    Key,
    ReactNode,
    forwardRef,
    memo,
    useCallback,
    useDeferredValue,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
    CSSProperties,
} from 'react'
import classnames from 'classnames'
import DirTree from '@/ui/DirTree'
import {
    formatError,
    getSubjectDomainDetail,
    getSubjectDomain,
    getDomain,
    LoginPlatform,
    PermissionScope,
} from '@/core'
import { DirTreeProvider, useDirTreeContext } from '@/context/DirTreeProvider'
import { GlossaryIcon } from './GlossaryIcons'
import __ from './locale'
import styles from './styles.module.less'
import type { SubjectDomainParams, ISubjectDomainItem } from '@/core'
import { BusinessDomainType, LevelType } from './const'
import OptDropdown from './OptDropdown'
import { EllipsisMiddle } from '@/ui'
import { getPlatformNumber } from '@/utils'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

const { Panel } = Collapse

type DataNode = ISubjectDomainItem

/**
 * 更新目录树数据
 * @param list 当前目录树列表
 * @param id 选中项id
 * @param children 选中项子目录
 * @param splitType 最深层子节点类型集合
 * @returns 更新后的目录树数据
 */
const updateTreeData = (
    list: DataNode[],
    id: string,
    children: DataNode[],
    splitType?: string[],
): DataNode[] =>
    list?.map((node) => {
        if (node.id === id) {
            return {
                ...node,
                isLeaf: !node.child_count,
                children: children?.map((child) => ({
                    ...child,
                    isLeaf:
                        !child.child_count || splitType?.includes(child.type),
                })),
            }
        }
        if (node.children) {
            return {
                ...node,
                isLeaf: !node.child_count || splitType?.includes(node.type),
                children: updateTreeData(
                    node.children,
                    id,
                    children,
                    splitType,
                ),
            }
        }
        return { ...node }
    })

/**
 * 按顺序合并新老节点
 * @param oldList 旧树
 * @param newList 新树
 * @returns
 */
const combineNode = (oldList: DataNode[], newList: DataNode[]): DataNode[] =>
    newList?.reduce((prev: DataNode[], cur: DataNode) => {
        const commonNode = oldList?.find((o) => o.id === cur.id)
        if (commonNode) {
            return [...prev, commonNode]
        }
        return [
            ...prev,
            {
                ...cur,
                isLeaf: !cur.child_count,
            },
        ]
    }, [])

/**
 * 按顺序合并新老节点
 * @param list 树
 * @param newList 新树
 * @param parentId 父节点ID
 * @returns
 */
const updateNode = (
    list: DataNode[],
    newList: DataNode[],
    parentId: Key,
): DataNode[] => {
    if (parentId) {
        return list?.map((node) => {
            if (node.id === parentId) {
                return {
                    ...node,
                    isLeaf: false,
                    children: combineNode(node?.children ?? [], newList),
                }
            }
            if (node.children) {
                return {
                    ...node,
                    children: updateNode(node?.children, newList, parentId),
                }
            }

            return node
        })
    }
    return combineNode(list ?? [], newList)
}

/**
 * 更新指定节点内容
 * @param list 树
 * @param id 节点ID
 * @param item 节点
 * @returns
 */
const replaceNode = (list: DataNode[], id: Key, item: DataNode): DataNode[] =>
    list?.map((node) => {
        if (node.id === id) {
            return { ...node, ...item }
        }
        if (node.children) {
            return { ...node, children: replaceNode(node.children, id, item) }
        }
        return node
    })

/**
 * 移除指定节点
 * @param list 树
 * @param parentId 父节点ID
 * @param id 节点ID
 * @returns
 */
const removeNode = (list: DataNode[], parentId: Key, id: Key): DataNode[] =>
    list?.map((node) => {
        if (node.id === parentId) {
            const childs = node?.children?.filter((o) => o?.id !== id)
            return { ...node, isLeaf: !childs?.length, children: childs }
        }
        if (node.children) {
            return {
                ...node,
                children: removeNode(node.children, parentId, id),
            }
        }
        return node
    })

/**
 * 获取父节点
 * @param list
 * @param id
 * @returns
 */
const getParentNode = (list: DataNode[], id: Key): DataNode => {
    let parentNode: DataNode
    list?.forEach((item) => {
        if (item.children) {
            if (item.children.some((it) => it.id === id)) {
                parentNode = item
            } else if (getParentNode(item.children, id)) {
                parentNode = getParentNode(item.children, id)
            }
        }
    })
    return parentNode!
}

/**
 * 目录项
 * @param node 节点数据
 * @returns 目录项Element
 */
const ItemView = memo(
    ({
        node,
        handleOperate,
        isShowSelected = false,
        disabledItemIds = [],
        selectedIds = [],
        getSelectedKeys,
        uncategorized,
    }: {
        node: any
        handleOperate?: (op, data) => void
        isShowSelected?: boolean
        disabledItemIds?: string[]
        selectedIds?: string[]
        getSelectedKeys: (node: any) => void
        uncategorized: boolean
    }) => {
        const { name, type, id, child_count } = node
        const { optNode } = useDirTreeContext()
        const ref = useRef<HTMLDivElement | null>(null)
        const isHovering = useHover(ref)
        const isForbid = disabledItemIds.includes(id)
        const isSelected = selectedIds.includes(id)
        const iconstyle: any = {}
        // 已添加的节点图标置灰展示
        if (isForbid) {
            iconstyle.color = 'rgba(8,8,8,.45)'
        }

        return (
            <div
                ref={ref}
                className={classnames(
                    styles['itemview-wrapper'],
                    isShowSelected && styles['itemview-wrapper-with-tag'],
                )}
                onClick={(e) => {
                    if (isShowSelected) {
                        // 已选的不再响应
                        if (isForbid) return
                        e.stopPropagation()
                        getSelectedKeys(node)
                    }
                }}
            >
                <span
                    className={styles['itemview-icon']}
                    title={`${LevelType[type]}：${name}`}
                    hidden={uncategorized}
                >
                    <GlossaryIcon
                        width="20px"
                        type={type}
                        fontSize="20px"
                        styles={{ ...iconstyle }}
                    />
                </span>
                {/* <span
                    className={styles['itemview-wrapper-nodename']}
                    title={`${LevelType[type]}：${name}`}
                >
                    {name}
                </span> */}
                {isShowSelected ? (
                    <span
                        className={styles['itemview-wrapper-nodename']}
                        title={
                            uncategorized ? name : `${LevelType[type]}:${name}`
                        }
                    >
                        <span
                            className={classnames(
                                styles.nodename,
                                isForbid && styles['disabled-nodename'],
                            )}
                        >
                            {name}
                        </span>
                        {(isForbid || isSelected) &&
                            (isForbid ? (
                                <span className={styles['added-tag']}>
                                    已添加
                                </span>
                            ) : (
                                <CheckOutlined
                                    className={styles['selected-tag']}
                                />
                            ))}
                    </span>
                ) : (
                    <>
                        <span
                            className={styles['itemview-wrapper-nodename']}
                            title={
                                uncategorized
                                    ? name
                                    : `${LevelType[type]}:${name}`
                            }
                        >
                            {name}
                        </span>
                        {handleOperate &&
                            child_count === 0 &&
                            [
                                BusinessDomainType.business_object,
                                BusinessDomainType.business_activity,
                            ].includes(type) && (
                                <span
                                    className={
                                        styles['itemview-wrapper-nodeUndefined']
                                    }
                                >
                                    {__('未定义')}
                                </span>
                            )}
                    </>
                )}

                {handleOperate && (
                    <span
                        style={{
                            display:
                                isHovering || optNode?.id === node?.id
                                    ? 'block'
                                    : 'none',
                        }}
                    >
                        <OptDropdown
                            currentData={node}
                            handleOperate={handleOperate}
                        />
                    </span>
                )}
            </div>
        )
    },
)

/**
 * 搜索结果项
 * @param node 节点数据
 * @returns 搜索结果项Element
 */
const SearchItem = memo(
    ({
        node,
        handleOperate,
    }: {
        node: DataNode
        handleOperate?: (op, data) => void
    }) => {
        const { name, type, path_name } = node
        const { optNode } = useDirTreeContext()
        const ref = useRef<HTMLDivElement | null>(null)
        const isHovering = useHover(ref)
        return (
            <div ref={ref} className={styles['search-item']}>
                <div className={styles['search-item-icon']}>
                    <GlossaryIcon width="20px" type={type} fontSize="20px" />
                </div>
                <div className={styles['search-item-right']}>
                    <div className={styles['search-item-content']}>
                        <div
                            className={styles['search-item-content-name']}
                            title={name}
                        >
                            {name}
                        </div>
                        {path_name && name !== path_name && (
                            <div
                                className={styles['search-item-content-path']}
                                title={path_name}
                            >
                                <EllipsisMiddle>{path_name}</EllipsisMiddle>
                            </div>
                        )}
                    </div>
                    {handleOperate && (
                        <span
                            style={{
                                display:
                                    isHovering || optNode?.id === node?.id
                                        ? 'block'
                                        : 'none',
                            }}
                        >
                            <OptDropdown
                                currentData={node}
                                handleOperate={handleOperate}
                            />
                        </span>
                    )}
                </div>
            </div>
        )
    },
)

/**
 * 搜索结果库表
 * @param data 搜索结果数组
 * @returns 搜索结果库表Element
 */

const SearchContainer = memo(
    ({
        data,
        filterType,
        handleOperate,
    }: {
        data: DataNode[]
        filterType: string[]
        handleOperate?: (op, data) => void
    }) => {
        const { currentNode, setCurrentNode } = useDirTreeContext()

        const renderDomainBlock = () => {
            return (
                <Collapse defaultActiveKey={filterType} ghost>
                    {filterType?.map((level: string) => {
                        const list = data?.filter((o) => o?.type === level)
                        return list?.length ? (
                            <Panel
                                header={LevelType[level]}
                                key={level}
                                className={styles['search-wrapper-list']}
                            >
                                {list?.map((o) => (
                                    <div
                                        key={o?.id}
                                        className={
                                            currentNode?.id === o?.id
                                                ? styles.checked
                                                : ''
                                        }
                                        onClick={() => {
                                            setCurrentNode(o)
                                        }}
                                    >
                                        <SearchItem
                                            node={o}
                                            handleOperate={handleOperate}
                                        />
                                    </div>
                                ))}
                            </Panel>
                        ) : null
                    })}
                </Collapse>
            )
        }
        return (
            <div
                className={classnames(
                    styles['search-wrapper'],
                    'search-result',
                )}
            >
                {renderDomainBlock()}
            </div>
        )
    },
)

// 参数设置
const InitParams = { limit: 2000, parent_id: '', is_all: false }
const AllParams = { parent_id: '', name: '全部', type: '' }
// 需显示的level集合
const ShowLevelArr = Object.keys(LevelType)
// 最深层类型
const ShowLimitArr = [
    BusinessDomainType.business_object,
    BusinessDomainType.business_activity,
]

interface IGlossaryDirTree {
    ref?: any
    placeholder?: string
    // limitTypes 要展现最深层的类型 为该类型节点不再展开
    limitTypes?: string[]
    filterType?: string[]
    // 能否展示空数据图标
    canEmpty?: boolean
    isShowAll?: boolean
    isShowSearch?: boolean
    placeholderWith?: number
    handleLoadOrEmpty?: (isLoading: boolean, isEmpty: boolean) => void
    getSelectedKeys?: (node: any) => void
    handleOperate?: (op: any, data: any) => void
    selectedNode?: any
    needUncategorized?: boolean // 是否需要显示未分类
    unCategorizedKey?: string // 未分类的名称
    isShowSelected?: boolean
    disabledItemIds?: string[]
    selectedIds?: string[]
    // 更多按钮操作
    handleMore?: (value: any) => void
    moreItems?: MenuProps['items']
    dirTreeStyle?: CSSProperties
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
 * 业务域目录树
 */
const GlossaryDirTree: FC<Partial<IGlossaryDirTree>> = forwardRef(
    (props: any, ref) => {
        const {
            getSelectedKeys,
            placeholder,
            filterType = ShowLevelArr,
            limitTypes = ShowLimitArr,
            canEmpty = true,
            isShowAll = true,
            isShowSearch = true,
            handleOperate,
            placeholderWith,
            handleLoadOrEmpty,
            selectedNode,
            needUncategorized = false,
            unCategorizedKey = 'uncategory',
            isShowSelected = false,
            disabledItemIds = [],
            selectedIds = [],
            handleMore,
            moreItems,
            dirTreeStyle,
        } = props
        const type = useMemo(() => filterType?.join(), [filterType])

        const { checkPermission } = useUserPermCtx()
        const [data, setData] = useSafeState<any>()
        const [keyword, setKeyword] = useSafeState<string>('')
        const [expandedKeys, setExpandedKeys] = useSafeState<string[]>([])
        const deferredKeyWord = useDeferredValue(keyword)
        const [searchResult, setSearchResult] = useSafeState<DataNode[]>()
        const { currentNode, setCurrentNode } = useDirTreeContext()
        const [isLoading, setIsLoading] = useState<boolean>(false)
        const [isSearching, setIsSearching] = useState<boolean>(false)
        const platformNumber = getPlatformNumber()

        const hasAddPermission = useMemo(
            () =>
                checkPermission([
                    {
                        key: 'manageDataClassification',
                        scope: PermissionScope.All,
                    },
                ]),
            [checkPermission],
        )

        // 外部设置选中树节点
        useEffect(() => {
            setCurrentNode(selectedNode)
        }, [selectedNode])

        useUpdateEffect(() => {
            // 需要取消状态
            if (isShowSelected) return
            getSelectedKeys?.(currentNode)
        }, [currentNode])

        useUpdateEffect(() => {
            if (handleLoadOrEmpty) {
                handleLoadOrEmpty(isLoading, !isLoading && !data?.length)
            }
        }, [isLoading, data])

        useImperativeHandle(ref, () => ({
            execNode,
        }))

        useEffect(() => {
            if (isShowAll) {
                setCurrentNode(AllParams)
            }
        }, [isShowAll])

        // 操作同步更新搜索结果
        const updateResult = useCallback(
            (optType: string, nodeId: string, node?: any) => {
                // 存在操作菜单 & 存在关键字 & 存在搜索结果
                if (handleOperate && deferredKeyWord && searchResult?.length) {
                    switch (optType) {
                        case 'add':
                            if (node?.name?.includes(deferredKeyWord)) {
                                setSearchResult((prev) => [...prev!, node])
                            }
                            break
                        case 'edit':
                            if (node?.name?.includes(deferredKeyWord)) {
                                setSearchResult((prev) =>
                                    prev?.map((o) =>
                                        o?.id === nodeId
                                            ? { ...o, ...node }
                                            : o,
                                    ),
                                )
                            } else {
                                setSearchResult((prev) =>
                                    prev?.filter((o) => o?.id !== nodeId),
                                )
                            }
                            break
                        case 'delete':
                            getData(
                                {
                                    ...QueryParams,
                                    is_all: true,
                                    type,
                                    keyword: deferredKeyWord,
                                },
                                DataOpt.Search,
                            )
                            break
                        default:
                            break
                    }
                }
            },
            [handleOperate, deferredKeyWord, searchResult],
        )

        // 执行节点操作
        const execNode = async (
            optType: string,
            nodeId: string, // 操作节点ID
            newNodeId?: string, // 新建节点ID
        ) => {
            // 更新节点信息, 保持原有展开
            if (optType === 'edit') {
                const node: any = await getSubjectDomainDetail(nodeId)
                const { owners, ...nodeItem } = node
                setData((prev) => replaceNode(prev, nodeId, nodeItem))
                updateResult(optType, nodeId, node)
                return
            }

            // 选中新建节点，若原有父级未展开，则需展开父级
            if (optType === 'add') {
                const res = await getSubjectDomain({
                    ...QueryParams,
                    parent_id: nodeId,
                })
                const childNodes = res?.entries
                const newNodes = childNodes?.find((o) => o.id === newNodeId)
                setData((prev) => updateNode(prev, childNodes, nodeId))

                if (!expandedKeys?.includes(nodeId)) {
                    setExpandedKeys([...expandedKeys, nodeId])
                }
                updateResult(optType, newNodeId!, newNodes)
                // 选中新建结点
                setCurrentNode(newNodes)
                return
            }

            // 删除节点选中上级（删除业务域选中全部）
            if (optType === 'delete') {
                const parentNode = getParentNode(data, nodeId)
                // 若删除节点为选中节点或选中节点父节点  则选中上级目录
                const selectedParentNode = getParentNode(data, currentNode?.id)

                if (
                    !parentNode ||
                    selectedParentNode?.path_id?.startsWith(parentNode?.path_id)
                ) {
                    setCurrentNode(parentNode ?? AllParams)
                }
                if (parentNode) {
                    setData((prev) => removeNode(prev, parentNode?.id, nodeId))
                } else {
                    setData((prev) => prev?.filter((o) => o?.id !== nodeId))
                }
                updateResult(optType, nodeId)
            }

            // 导入，重新加载
            if (optType === 'import') {
                getData({ ...InitParams, type }, DataOpt.Init)
            }
        }

        // 获取数据
        const getData = async (
            params: Partial<SubjectDomainParams>,
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
                const responseData = await getSubjectDomain(params)
                const res = responseData?.entries

                let initData
                if (optType === DataOpt.Init) {
                    initData = res?.map((o) => ({
                        ...o,
                        isLeaf: !o.child_count || limitTypes?.includes(o.type),
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
                            updateTreeData(prev!, parent_id!, res, limitTypes),
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
        const QueryParams = useMemo(() => ({ ...InitParams, type }), [type])

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
                await getData(
                    { ...QueryParams, parent_id: id },
                    DataOpt.Load,
                    id,
                )
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
                        type,
                        keyword: deferredKeyWord,
                    },
                    DataOpt.Search,
                )
            } else {
                setSearchResult(undefined)
            }
        }, [deferredKeyWord])

        const titleRender = useCallback(
            (node: any) => (
                <ItemView
                    node={node}
                    handleOperate={handleOperate}
                    uncategorized={unCategorizedKey === node.id}
                    isShowSelected={isShowSelected}
                    disabledItemIds={disabledItemIds}
                    selectedIds={selectedIds}
                    getSelectedKeys={getSelectedKeys}
                />
            ),
            [handleOperate, selectedIds],
        )

        // 搜索结果渲染
        const toRenderSearch = useMemo(() => {
            return (
                <SearchContainer
                    data={searchResult as DataNode[]}
                    filterType={filterType}
                    handleOperate={handleOperate}
                />
            )
        }, [searchResult])

        const handleSearch = (key: string) => {
            setKeyword(key)
        }
        const handleTopAll = useCallback(() => setCurrentNode(AllParams), [])
        // 设置选中节点
        const handleSelect = (keys: Key[], info: any) => {
            if (isShowSelected) return
            setCurrentNode(info.node)
        }

        // 点击添加
        const onClickAdd = () => {
            // 如果不展示菜单 则因此添加按钮
            if (handleOperate) {
                handleOperate('addTerms', { type: '' })
            }
        }

        const handleExpand = (key: any, info: any) => {
            setExpandedKeys(key)
        }

        const resetTree = useMemo(
            () => handleLoadOrEmpty && !data?.length && !isLoading,
            [handleLoadOrEmpty, data, isLoading],
        )

        return resetTree ? null : (
            <DirTree
                conf={{
                    placeholder:
                        placeholder ||
                        // platformNumber === LoginPlatform.default
                        // ? __('搜索主题域分组、主题域、业务对象/活动')
                        // :
                        __('搜索业务对象分组、业务对象'),
                    placeholderWith: placeholderWith || 195,
                    isSearchEmpty:
                        searchResult !== undefined && !searchResult?.length,
                    canTreeEmpty: canEmpty,
                    searchRender: toRenderSearch,
                    showSearch: isShowSearch,
                    onSearchChange: handleSearch,
                    isCheckTop: !currentNode?.id,
                    onTopTitleClick: handleTopAll,
                    showTopTitle: isShowAll,
                    onAdd:
                        handleOperate && hasAddPermission
                            ? onClickAdd
                            : undefined,
                    addTips:
                        // platformNumber === LoginPlatform.default
                        //     ? __('新建主题域分组')
                        //     :
                        __('新建分组'),
                    isSearchLoading: isSearching,
                    isTreeLoading: isLoading,
                    onMore: handleMore,
                    moreItems,
                }}
                treeData={data}
                loadData={onLoadData}
                fieldNames={{ key: 'id', title: 'name' }}
                titleRender={titleRender}
                onSelect={handleSelect}
                onExpand={handleExpand}
                expandedKeys={expandedKeys}
                selectedKeys={
                    currentNode && !isShowSelected ? [currentNode?.id] : []
                }
                style={dirTreeStyle}
            />
        )
    },
)

const GlossaryDirTreeContainer = forwardRef(
    (props: Partial<IGlossaryDirTree>, ref) => {
        return (
            <DirTreeProvider>
                <GlossaryDirTree {...props} ref={ref} />
            </DirTreeProvider>
        )
    },
)

export default memo(GlossaryDirTreeContainer)
