import { EllipsisOutlined, CheckOutlined } from '@ant-design/icons'
import { useAsyncEffect, useHover, useSafeState, useUpdateEffect } from 'ahooks'
import { Collapse, Dropdown, MenuProps, Checkbox, Tooltip } from 'antd'
import { uniqBy } from 'lodash'
import React, {
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
} from 'react'
import classnames from 'classnames'
import DirTree from '@/ui/DirTree'
import {
    BusinessDomainLevelTypes,
    formatError,
    IBusinessDomainTreeParams,
    getBusinessDomainTree,
    getBusinessDomainTreeNodeDetails,
} from '@/core'
import { DirTreeProvider, useDirTreeContext } from '@/context/DirTreeProvider'
import __ from './locale'
import styles from './styles.module.less'
import type { IBusinessDomainItem } from '@/core'
import OptDropdown from './OptDropdown'
import { OperateType } from '@/utils'
import BusinessDomainLevelIcon from '../BusinessDomainLevel/BusinessDomainLevelIcon'
import { EllipsisMiddle } from '@/ui'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

const { Panel } = Collapse

type DataNode = IBusinessDomainItem & {
    disableTip?: string
}

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
    disabledFn?: (value: any) => boolean,
    disableTip?: (value: any) => string,
): DataNode[] =>
    list?.map((node) => {
        if (node.id === id) {
            const disabled = disabledFn ? disabledFn(node) : false
            return {
                ...node,
                isLeaf: !node.expand,
                disabled,
                children: children?.map((child) => ({
                    ...child,
                    isLeaf: !child.expand,
                    disabled: disabledFn ? disabledFn(child) : false,
                    disableTip: disableTip ? disableTip(child) : '',
                })),
            }
        }
        if (node.children) {
            return {
                ...node,
                isLeaf: !node.expand,
                disabled: disabledFn ? disabledFn(node) : false,
                disableTip: disableTip ? disableTip(node) : '',
                children: updateTreeData(
                    node.children,
                    id,
                    children,
                    disabledFn,
                    disableTip,
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
                isLeaf: !cur.expand,
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

const updateNodeNum = (
    list: DataNode[],
    id: Key,
    type: OperateType,
    field: string,
): DataNode[] =>
    list?.map((node) => {
        if (node.id === id) {
            return {
                ...node,
                [field]:
                    type === OperateType.PLUS
                        ? node[field] + 1
                        : node[field] - 1,
            }
        }
        if (node.children) {
            return {
                ...node,
                children: updateNodeNum(node.children, id, type, field),
            }
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

const getCurrentNode = (tree: DataNode[], id: string): DataNode | null => {
    // eslint-disable-next-line
    for (const node of tree) {
        if (node.id === id) return node
        if (node.children) {
            const res = getCurrentNode(node.children, id)
            if (res) return res
        }
    }
    return null
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
        domainLevels,
        isShowCount = false,
        showCountField,
        isChecked,
        cssjj,
        showCheckBox,
    }: {
        node: any
        handleOperate?: (op, data) => void
        domainLevels: BusinessDomainLevelTypes[]
        isShowCount?: boolean
        showCountField: string
        isChecked?: boolean
        cssjj?: boolean
        showCheckBox?: boolean
    }) => {
        const { disabled, name, type, disableTip = '' } = node
        const { optNode } = useDirTreeContext()
        const ref = useRef<HTMLDivElement | null>(null)
        const isHovering = useHover(ref)
        const title = `${
            cssjj && type === BusinessDomainLevelTypes.Process
                ? __('主干业务')
                : LevelType[type]
        }：${name}`
        return (
            <Tooltip title={disableTip}>
                <div
                    ref={ref}
                    className={classnames(
                        styles['itemview-wrapper'],
                        isShowCount && styles['itemview-wrapper-with-count'],
                    )}
                >
                    {showCheckBox &&
                        type === BusinessDomainLevelTypes.Process && (
                            <Checkbox
                                style={{ marginRight: '8px' }}
                                checked={isChecked}
                            />
                        )}
                    <span className={styles['itemview-icon']} title={title}>
                        <BusinessDomainLevelIcon type={type} isColored />
                    </span>
                    {isShowCount ? (
                        <span
                            className={styles['itemview-wrapper-nodename']}
                            title={title}
                        >
                            <span className={styles.nodename}>{name}</span>
                            <span>{`（${node[showCountField]}）`}</span>
                        </span>
                    ) : (
                        <span
                            className={styles['itemview-wrapper-nodename']}
                            title={title}
                        >
                            {name}
                        </span>
                    )}
                    {isChecked && !showCheckBox && (
                        <CheckOutlined
                            className={styles['itemview-wrapper-checkIcon']}
                        />
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
                                domainLevels={domainLevels}
                            />
                        </span>
                    )}
                </div>
            </Tooltip>
        )
    },
)

// 搜索分类
const LevelType = {
    [BusinessDomainLevelTypes.DomainGrouping]: __('业务领域分组'),
    [BusinessDomainLevelTypes.Domain]: __('业务领域'),
    [BusinessDomainLevelTypes.Process]: __('业务流程'),
}

/**
 * 搜索结果项
 * @param node 节点数据
 * @returns 搜索结果项Element
 */
const SearchItem = memo(
    ({
        node,
        handleOperate,
        domainLevels,
        isChecked,
        showCheckBox,
    }: {
        node: DataNode
        handleOperate?: (op, data) => void
        domainLevels: BusinessDomainLevelTypes[]
        isChecked?: boolean
        showCheckBox?: boolean
    }) => {
        const { name, type, path, disabled, disableTip = '' } = node
        const { optNode } = useDirTreeContext()
        const ref = useRef<HTMLDivElement | null>(null)
        const isHovering = useHover(ref)
        return (
            <Tooltip title={disableTip}>
                <div ref={ref} className={styles['search-item']}>
                    <div className={styles['search-item-icon']}>
                        <BusinessDomainLevelIcon type={type} isColored />
                    </div>
                    <div className={styles['search-item-right']}>
                        <div className={styles['search-item-content']}>
                            <div
                                className={styles['search-item-content-name']}
                                title={name}
                            >
                                {showCheckBox &&
                                    type ===
                                        BusinessDomainLevelTypes.Process && (
                                        <Checkbox
                                            style={{ marginRight: '8px' }}
                                            checked={isChecked}
                                        />
                                    )}
                                {name}
                            </div>
                            {path && path !== name && (
                                <div
                                    className={
                                        styles['search-item-content-path']
                                    }
                                    title={path}
                                >
                                    <EllipsisMiddle>{path}</EllipsisMiddle>
                                </div>
                            )}
                        </div>
                        {isChecked && !showCheckBox && (
                            <CheckOutlined
                                className={styles['itemview-wrapper-checkIcon']}
                            />
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
                                    domainLevels={domainLevels}
                                />
                            </span>
                        )}
                    </div>
                </div>
            </Tooltip>
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
        domainLevels,
        checkedKeys,
        isOnlySelectProcess,
        showCheckBox,
        disabledFn,
        disableTip,
    }: {
        data: DataNode[]
        filterType: string[]
        handleOperate?: (op, data) => void
        domainLevels: BusinessDomainLevelTypes[]
        checkedKeys?: string[]
        isOnlySelectProcess?: boolean
        showCheckBox?: boolean
        disabledFn?: (value: any) => boolean
        disableTip?: (value: any) => string
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
                                {list?.map((o) => {
                                    const disabled = disabledFn
                                        ? disabledFn(o)
                                        : false
                                    const disableTitle = disableTip
                                        ? disableTip(o)
                                        : ''

                                    return (
                                        <div
                                            key={o?.id}
                                            className={classnames({
                                                [styles.checked]:
                                                    currentNode?.id === o?.id,
                                                [styles.disabled]: !!disabled,
                                            })}
                                            onClick={() => {
                                                if (disabled) {
                                                    return
                                                }
                                                // 添加时间戳，解决再次点击同一节点，监听不触发的问题
                                                setCurrentNode(
                                                    isOnlySelectProcess
                                                        ? {
                                                              ...o,
                                                              _t: new Date().getTime(),
                                                          }
                                                        : o,
                                                )
                                            }}
                                        >
                                            <SearchItem
                                                node={{
                                                    ...o,
                                                    disabled,
                                                    disableTip: disableTitle,
                                                }}
                                                handleOperate={handleOperate}
                                                domainLevels={domainLevels}
                                                isChecked={checkedKeys?.includes(
                                                    o.id,
                                                )}
                                                showCheckBox={showCheckBox}
                                            />
                                        </div>
                                    )
                                })}
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
                    checkedKeys && styles['search-wrapper-autoHt'],
                    'search-result',
                )}
            >
                {renderDomainBlock()}
            </div>
        )
    },
)

// 参数设置
const InitParams = { parent_id: '', keyword: '', getall: false }
const AllParams = { parent_id: '', name: '全部', id: '' }
// 需显示的level集合
const ShowLevelArr = Object.keys(LevelType)
interface IBusinessDomainTree {
    ref?: any
    placeholder?: string
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
    isIncludeProcess?: boolean
    domainLevels?: BusinessDomainLevelTypes[]
    isShowCount?: boolean
    showCountField?: string
    isOnlySelectProcess?: boolean
    isInitCheck: boolean
    isMultiple: boolean
    showCheckBox?: boolean
    extendNodesData?: { title: React.ReactNode | string; id: string }[]
    disableTip?: (value: any) => string
    disabledFn?: (value: any) => boolean
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
const BusinessDomainTree: FC<Partial<IBusinessDomainTree>> = forwardRef(
    (props: any, ref) => {
        const {
            getSelectedKeys,
            placeholder,
            filterType = ShowLevelArr,
            canEmpty = true,
            isShowAll = true,
            isShowSearch = true,
            handleOperate,
            placeholderWith,
            handleLoadOrEmpty,
            selectedNode,
            isIncludeProcess = false,
            domainLevels = [],
            isShowCount = false,
            showCountField = 'model_cnt',
            extendNodesData,
            isOnlySelectProcess,
            isInitCheck = true,
            isMultiple = false,
            showCheckBox = false,
            disabledFn,
            disableTip,
        } = props

        const { checkPermission } = useUserPermCtx()
        const [{ cssjj }] = useGeneralConfig()
        const [data, setData] = useSafeState<any>()
        const [keyword, setKeyword] = useSafeState<string>('')
        const [expandedKeys, setExpandedKeys] = useSafeState<string[]>([])
        const [checkedKeys, setCheckedKeys] = useSafeState<string[]>([])
        const [selectedNodeList, setSelectedNodeList] = useState<any[]>([])
        const deferredKeyWord = useDeferredValue(keyword)
        const [searchResult, setSearchResult] = useSafeState<DataNode[]>()
        const { currentNode, setCurrentNode } = useDirTreeContext()
        const [isLoading, setIsLoading] = useState<boolean>(false)
        const [isSearching, setIsSearching] = useState<boolean>(false)

        const hasAddPermission = useMemo(
            () => checkPermission('manageBusinessArchitecture'),
            [checkPermission],
        )

        // 外部设置选中树节点
        useEffect(() => {
            if (Array.isArray(selectedNode)) {
                setCheckedKeys(selectedNode.map((item) => item.id))
                setSelectedNodeList(selectedNode)
            } else {
                setCurrentNode(selectedNode)
            }
        }, [selectedNode])

        useUpdateEffect(() => {
            if (isMultiple && currentNode) {
                handleSelect([], { node: currentNode })
            } else {
                getSelectedKeys?.(currentNode)
            }
        }, [currentNode])

        useUpdateEffect(() => {
            getSelectedKeys?.(selectedNodeList)
        }, [selectedNodeList])

        useUpdateEffect(() => {
            if (handleLoadOrEmpty) {
                handleLoadOrEmpty(isLoading, !isLoading && !data?.length)
            }
        }, [isLoading, data])

        useImperativeHandle(ref, () => ({
            execNode,
            setCurrentNode,
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
            updateNodeIds?: string[],
        ) => {
            // 更新节点信息, 保持原有展开
            if (optType === OperateType.EDIT) {
                const node: any = await getBusinessDomainTreeNodeDetails(nodeId)
                const { owners, ...nodeItem } = node
                setData((prev) => replaceNode(prev, nodeId, nodeItem))
                updateResult(optType, nodeId, node)
                return
            }

            // 选中新建节点，若原有父级未展开，则需展开父级
            if (optType === OperateType.CREATE) {
                const res = await getBusinessDomainTree({
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
            if (optType === OperateType.DELETE) {
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
            // 数量加1
            if (
                [OperateType.PLUS, OperateType.MINUS].includes(
                    optType as OperateType,
                )
            ) {
                let ids = updateNodeIds
                if (!updateNodeIds) {
                    const node: any = await getBusinessDomainTreeNodeDetails(
                        nodeId,
                    )
                    ids = node.path_id.split('/')
                }

                setData((prev) => {
                    let res = prev
                    ids?.forEach((n) => {
                        const cNode = getCurrentNode(data, n)
                        if (cNode) {
                            res = updateNodeNum(
                                res,
                                cNode.id,
                                optType as OperateType,
                                showCountField,
                            )
                        }
                    })

                    return res
                })
            }
        }

        // 获取数据
        const getData = async (
            params: Partial<IBusinessDomainTreeParams>,
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
                const responseData = await getBusinessDomainTree(params)
                const res = responseData?.entries

                let initData
                if (optType === DataOpt.Init) {
                    initData = [
                        ...(res?.map((o) => ({
                            ...o,
                            isLeaf: !o.expand,
                            disabled: disabledFn ? disabledFn(o) : false,
                            disableTip: disableTip ? disableTip(o) : '',
                        })) || []),
                        ...(extendNodesData?.map((o) => ({
                            ...o,
                            name: o.title,
                            isLeaf: true,
                        })) || []),
                    ]
                }
                switch (optType) {
                    case DataOpt.Init:
                        setData(initData)
                        if (!isShowAll && initData?.length && isInitCheck) {
                            setCurrentNode(initData?.[0])
                        }
                        setIsLoading(false)
                        break
                    case DataOpt.Load:
                        setData((prev: DataNode[] | undefined) =>
                            updateTreeData(
                                prev!,
                                parent_id!,
                                res,
                                disabledFn,
                                disableTip,
                            ),
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
            () => ({ ...InitParams, getall: isIncludeProcess }),
            [],
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
                    domainLevels={domainLevels}
                    isShowCount={isShowCount}
                    showCountField={showCountField}
                    isChecked={checkedKeys.includes(node.id)}
                    showCheckBox={showCheckBox}
                    cssjj={!!cssjj}
                />
            ),
            [handleOperate, checkedKeys],
        )

        // 搜索结果渲染
        const toRenderSearch = useMemo(() => {
            return (
                <SearchContainer
                    data={searchResult as DataNode[]}
                    filterType={filterType}
                    handleOperate={handleOperate}
                    domainLevels={domainLevels}
                    checkedKeys={checkedKeys}
                    isOnlySelectProcess={isOnlySelectProcess}
                    showCheckBox={showCheckBox}
                    disabledFn={disabledFn}
                    disableTip={disableTip}
                />
            )
        }, [searchResult, checkedKeys])

        const handleSearch = (key: string) => {
            setKeyword(key)
        }
        const handleTopAll = useCallback(() => setCurrentNode(AllParams), [])
        // 设置选中节点
        const handleSelect = (keys: Key[], info: any) => {
            if (isOnlySelectProcess) {
                if (info.node.type === BusinessDomainLevelTypes.Process) {
                    const isSelected = checkedKeys.includes(info.node.id)
                    const list = uniqBy([...selectedNodeList, info.node], 'id')
                    setSelectedNodeList(
                        isSelected
                            ? list.filter((item) => item.id !== info.node.id)
                            : list,
                    )
                }
            } else {
                setCurrentNode(info.node)
            }
        }

        // 点击添加
        const onClickAdd = () => {
            // 如果不展示菜单 则因此添加按钮
            if (handleOperate) {
                handleOperate(OperateType.CREATE)
            }
        }

        const handleExpand = (key: any, info: any) => {
            setExpandedKeys(key)
        }

        const resetTree = useMemo(
            () => handleLoadOrEmpty && !data?.length,
            [handleLoadOrEmpty, data],
        )

        return resetTree ? null : (
            <>
                <DirTree
                    conf={{
                        placeholder:
                            placeholder || __('搜索业务领域分组、业务领域'),
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
                        addTips: __('新建业务领域分组'),
                        isSearchLoading: isSearching,
                        isTreeLoading: isLoading,
                    }}
                    treeData={data}
                    loadData={onLoadData}
                    fieldNames={{ key: 'id', title: 'name' }}
                    titleRender={titleRender}
                    onSelect={handleSelect}
                    onExpand={handleExpand}
                    expandedKeys={expandedKeys}
                    selectedKeys={currentNode ? [currentNode?.id] : []}
                />
                {/* {isLoading ||
                isSearching ||
                (searchResult !== undefined && !searchResult?.length)
                    ? null
                    : extendNodesData &&
                      extendNodesData.map((node) => (
                          <div
                              className={classnames(
                                  styles['extend-node'],
                                  currentNode?.id === node.id &&
                                      styles['active-extend-node'],
                              )}
                              onClick={() => {
                                  setCurrentNode({
                                      id: node.id,
                                  })
                              }}
                          >
                              {node.title}
                              {isShowCount && node.num ? `(${node.num})` : ''}
                          </div>
                      ))} */}
            </>
        )
    },
)

const BusinessDomainTreeContainer = forwardRef(
    (props: Partial<IBusinessDomainTree>, ref) => {
        return (
            <DirTreeProvider>
                <BusinessDomainTree {...props} ref={ref} />
            </DirTreeProvider>
        )
    },
)

export default memo(BusinessDomainTreeContainer)
