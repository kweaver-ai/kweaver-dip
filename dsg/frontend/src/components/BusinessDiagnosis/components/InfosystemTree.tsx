import { CheckOutlined } from '@ant-design/icons'
import { Tooltip } from 'antd'
import { useHover, useSafeState, useUpdateEffect } from 'ahooks'
import { uniqBy } from 'lodash'
import React, {
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
import classnames from 'classnames'
import DirTree from '@/ui/DirTree'
import {
    BusinessDomainLevelTypes,
    formatError,
    IBusinessDomainTreeParams,
    getBusinessDomainTree,
    reqInfoSystemList,
} from '@/core'
import { DirTreeProvider, useDirTreeContext } from '@/context/DirTreeProvider'
import __ from '../locale'
import styles from '../styles.module.less'
import type { IBusinessDomainItem } from '@/core'
import BusinessDomainLevelIcon from '../../BusinessDomainLevel/BusinessDomainLevelIcon'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import { EllipsisMiddle } from '@/ui'

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
            return {
                ...node,
                isLeaf: !node.expand,
                disabled: disabledFn ? disabledFn(node) : false,
                disableTip: disableTip ? disableTip(node) : '',
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
 * 目录项
 * @param node 节点数据
 * @returns 目录项Element
 */
const ItemView = memo(
    ({
        node,
        isShowCount = false,
        showCountField,
        cssjj,
        isChecked,
    }: {
        node: any
        isShowCount?: boolean
        showCountField: string
        cssjj?: boolean
        isChecked?: boolean
    }) => {
        const { disabled, name, type, disableTip = '' } = node
        const ref = useRef<HTMLDivElement | null>(null)
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
                    {isChecked && (
                        <CheckOutlined
                            className={styles['itemview-wrapper-checkIcon']}
                        />
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
    [BusinessDomainLevelTypes.Process]: __('主干业务'),
    [BusinessDomainLevelTypes.Infosystem]: __('信息系统'),
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
    }: {
        node: DataNode
        handleOperate?: (op, data) => void
        domainLevels: BusinessDomainLevelTypes[]
        isChecked?: boolean
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
                        {isChecked && (
                            <CheckOutlined
                                className={styles['itemview-wrapper-checkIcon']}
                            />
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
        disabledFn,
        disableTip,
    }: {
        data: DataNode[]
        filterType: string[]
        handleOperate?: (op, data) => void
        domainLevels: BusinessDomainLevelTypes[]
        checkedKeys?: string[]
        disabledFn?: (value: any) => boolean
        disableTip?: (value: any) => string
    }) => {
        const { currentNode, setCurrentNode } = useDirTreeContext()
        const renderDomainBlock = () => {
            const list =
                data?.filter(
                    (item) => item.type === BusinessDomainLevelTypes.Process,
                ) || []
            return list?.map((o) => {
                const disabled = disabledFn ? disabledFn(o) : false
                const disableTitle = disableTip ? disableTip(o) : ''
                return (
                    <div
                        key={o?.id}
                        className={classnames({
                            [styles.checked]: currentNode?.id === o?.id,
                            [styles.disabled]: !!disabled,
                        })}
                        onClick={() => {
                            if (disabled) {
                                return
                            }
                            // 添加时间戳，解决再次点击同一节点，监听不触发的问题
                            setCurrentNode({ ...o, _t: new Date().getTime() })
                        }}
                    >
                        <SearchItem
                            node={{ ...o, disabled, disableTip: disableTitle }}
                            handleOperate={handleOperate}
                            domainLevels={domainLevels}
                            isChecked={checkedKeys?.includes(o.id)}
                        />
                    </div>
                )
            })
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
const InitParams = { parent_id: '', keyword: '', getall: false }
const AllParams = { parent_id: '', name: '全部', id: '' }
// 需显示的level集合
const ShowLevelArr = Object.keys(LevelType)
interface IInfosystemTree {
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
    domainLevels?: BusinessDomainLevelTypes[]
    isShowCount?: boolean
    showCountField?: string
    isOnlySelectProcess?: boolean
    isMultiple: boolean
    extendNodesData?: { title: React.ReactNode | string; id: string }[]
    disabledFn?: (value: any) => boolean
    disableTip?: (value: any) => string
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
const InfosystemTree: FC<Partial<IInfosystemTree>> = forwardRef(
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
            domainLevels = [],
            isShowCount = false,
            showCountField = 'model_cnt',
            extendNodesData,
            isOnlySelectProcess,
            isMultiple = false,
            disabledFn,
            disableTip,
        } = props

        const [data, setData] = useSafeState<any>()
        const [{ cssjj }] = useGeneralConfig()
        const [keyword, setKeyword] = useSafeState<string>('')
        const [expandedKeys, setExpandedKeys] = useSafeState<string[]>([])
        const [checkedKeys, setCheckedKeys] = useSafeState<string[]>([])
        const [selectedNodeList, setSelectedNodeList] = useState<any[]>([])
        const deferredKeyWord = useDeferredValue(keyword)
        const [searchResult, setSearchResult] = useSafeState<DataNode[]>()
        const { currentNode, setCurrentNode } = useDirTreeContext()
        const [isLoading, setIsLoading] = useState<boolean>(false)
        const [isSearching, setIsSearching] = useState<boolean>(false)

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
            setCurrentNode,
        }))

        useEffect(() => {
            if (isShowAll) {
                setCurrentNode(AllParams)
            }
        }, [isShowAll])

        // 获取数据
        const getData = async (
            params: Partial<IBusinessDomainTreeParams>,
            optType: DataOpt,
            parent_id?: string,
        ) => {
            try {
                if (optType === DataOpt.Search && searchResult === undefined) {
                    setIsSearching(true)
                }
                const responseData = await getBusinessDomainTree(params)
                const res = responseData?.entries

                let initData
                if (optType === DataOpt.Init) {
                    initData = res?.map((o) => ({
                        ...o,
                        isLeaf: !o.expand,
                        disabled: disabledFn ? disabledFn(o) : false,
                        disableTip: disableTip ? disableTip(o) : '',
                    }))
                }
                switch (optType) {
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

        const getInfosystemData = async () => {
            try {
                setIsLoading(true)
                const responseData = await reqInfoSystemList({
                    limit: 2000,
                    offset: 1,
                })
                const res = responseData?.entries

                const initData = res?.map((o: any) => ({
                    ...o,
                    isLeaf: false,
                    expand: true,
                    type: 'infosystem',
                }))
                setData(initData)
                setIsLoading(false)
            } catch (error) {
                formatError(error)
                setIsLoading(false)
                setIsSearching(false)
            }
        }

        // 初始化参数
        const QueryParams = useMemo(
            () => ({ ...InitParams, getall: false }),
            [],
        )

        // 初始化
        useEffect(() => {
            getInfosystemData()
        }, [QueryParams])

        // 增量更新
        const onLoadData = async ({ id, children, path, type }: any) => {
            try {
                if (children) {
                    return Promise.resolve()
                }
                await getData(
                    {
                        ...QueryParams,
                        getall: false,
                        business_system: id,
                    },
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
                        getall: true,
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
                    isShowCount={isShowCount}
                    showCountField={showCountField}
                    cssjj={!!cssjj}
                    isChecked={checkedKeys.includes(node.id)}
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
                    disabledFn={disabledFn}
                    disableTip={disableTip}
                />
            )
        }, [searchResult, checkedKeys, currentNode])

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
                {isLoading ||
                isSearching ||
                (searchResult !== undefined && !searchResult?.length) ||
                (data && data?.length === 0)
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
                      ))}
            </>
        )
    },
)

const InfosystemTreeContainer = forwardRef(
    (props: Partial<IInfosystemTree>, ref) => {
        return (
            <DirTreeProvider>
                <InfosystemTree {...props} ref={ref} />
            </DirTreeProvider>
        )
    },
)

export default memo(InfosystemTreeContainer)
