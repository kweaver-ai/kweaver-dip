import { CheckOutlined } from '@ant-design/icons'
import {
    useAsyncEffect,
    useClickAway,
    useDebounceFn,
    useHover,
    useSafeState,
    useUpdateEffect,
} from 'ahooks'
import { Dropdown, MenuProps, Radio, Tooltip } from 'antd'
import {
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
    FC,
    ReactNode,
} from 'react'
import { cloneDeep, uniqBy } from 'lodash'
import InfiniteScroll from 'react-infinite-scroll-component'
import classnames from 'classnames'
import DirTree from '@/ui/DirTree'
import {
    IGetObject,
    formatError,
    getObjects,
    getBusinessDomainTree,
    BusinessDomainLevelTypes,
    getBusinessDomainProcessList,
    getCurUserDepartment,
    getObjectDetails,
    getMainDepartInfo,
    getObjectsWithCancel,
} from '@/core'
import { DirTreeProvider, useDirTreeContext } from '@/context/DirTreeProvider'
import Icons from './Icons'
import MoreHorizontalOutlined from '@/icons/MoreHorizontalOutlined'
import {
    Architecture,
    DataNode,
    allNodeInfo,
    hiddenNodeType,
    nodeInfo,
    architectureTypeList,
} from './const'
import __ from './locale'
import styles from './styles.module.less'
import { OperateType } from '@/utils'
import { EllipsisMiddle, Loader } from '@/ui'
import BusinessDomainLevelIcon from '../BusinessDomainLevel/BusinessDomainLevelIcon'

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
    isIncludeProcess?: boolean,
    disabledFn?: (value: any) => boolean,
    disableTip?: (value: any) => string,
): DataNode[] =>
    list.map((node) => {
        const isArchitecture = architectureTypeList.includes(node.type)
        if (node.id === id) {
            return {
                ...node,
                // 包含业务流程：属于组件、部门，全部展开，业务流程全部没用展开按钮
                isLeaf: isIncludeProcess ? !isArchitecture : !node.expand,
                disabled: disabledFn ? disabledFn(node) : false,
                disableTip: disableTip ? disableTip(node) : '',
                children: children?.map((child) => {
                    const subIsArchitecture = architectureTypeList.includes(
                        child.type,
                    )
                    return {
                        ...child,
                        isLeaf: isIncludeProcess
                            ? !subIsArchitecture
                            : !child.expand,
                        disabled: disabledFn ? disabledFn(child) : false,
                        disableTip: disableTip ? disableTip(child) : '',
                    }
                }),
            }
        }
        if (node.children) {
            return {
                ...node,
                isLeaf: isIncludeProcess ? !isArchitecture : !node.expand,
                disabled: disabledFn ? disabledFn(node) : false,
                disableTip: disableTip ? disableTip(node) : '',
                children: updateTreeData(
                    node.children,
                    id,
                    children,
                    isIncludeProcess,
                    disabledFn,
                    disableTip,
                ),
            }
        }
        return { ...node }
    })

/**
 * 操作库表
 * @param data 节点信息
 * @param onExpand 菜单收展事件
 * @return 操作菜单库表
 */
const OptView = memo(
    ({
        data,
        handleOperate,
    }: {
        data: any
        handleOperate: (
            ot: OperateType,
            at: Architecture,
            td?: DataNode,
            parentNode?: DataNode,
        ) => void
    }) => {
        const { type } = data
        const [open, setOpen] = useState<boolean>(false)
        const { optNode, setOptNode } = useDirTreeContext()

        useEffect(() => {
            setOpen(optNode?.id === data?.id)
        }, [optNode])
        // const { currentMenu, setCurrentMenu } = useDirTreeContext()
        // const isChecked = useMemo(
        //     () => data?.id === currentMenu?.id,
        //     [currentMenu],
        // )

        const items: MenuProps['items'] = useMemo(
            () =>
                nodeInfo[type].subobjects
                    .filter(
                        (item: Architecture) =>
                            ![
                                Architecture.DEPARTMENT,
                                Architecture.COREBUSINESS,
                            ].includes(item),
                    )
                    .map((key: string) => ({
                        key,
                        label: (
                            <span style={{ paddingLeft: '6px' }}>
                                {nodeInfo[key].name}
                            </span>
                        ),
                        icon: <Icons type={key as Architecture} />,
                    })),
            [type],
        )

        const clickRef = useRef<HTMLDivElement>(null)
        useClickAway(() => {
            if (open) {
                setOptNode(undefined)
            }
        }, clickRef)

        return ![
            Architecture.ALL,
            Architecture.BSYSTEM,
            Architecture.BMATTERS,
            Architecture.BSYSTEMCONTAINER,
            Architecture.BMATTERSCONTAINER,
        ].includes(type as Architecture) ? (
            <div ref={clickRef}>
                <Dropdown
                    // open={isChecked}
                    destroyPopupOnHide
                    placement="bottomRight"
                    open={open}
                    menu={{
                        items,
                        onClick: ({ key, domEvent }) => {
                            domEvent.stopPropagation()
                            handleOperate(
                                OperateType.CREATE,
                                key as Architecture,
                                data,
                            )
                            setOptNode(undefined)
                        },
                    }}
                    // getPopupContainer={(node) => node.parentElement || node}
                    overlayStyle={{
                        minWidth: 120,
                    }}
                >
                    <div
                        className={classnames(
                            styles['menu-btn'],
                            open ? styles.active : '',
                        )}
                        onClick={(e) => {
                            setOptNode(open ? undefined : data)
                            e.preventDefault()
                            e.stopPropagation()
                        }}
                        title={__('操作')}
                    >
                        <MoreHorizontalOutlined />
                        {/* {items!.length >= 2 ? (
                    ) : (
                        <AddOutlined />
                    )} */}
                    </div>
                </Dropdown>
            </div>
        ) : null
    },
)

/**
 * 目录项
 * @param node 节点数据
 * @returns 目录项Element
 */
const ItemView = memo(
    ({
        node,
        isShowOperate,
        handleOperate,
        uncategorized,
        isChecked,
    }: {
        node: DataNode
        isShowOperate: boolean
        handleOperate: (
            ot: OperateType,
            at: Architecture,
            td?: DataNode,
            parentNode?: DataNode,
        ) => void
        uncategorized: boolean
        isChecked?: boolean
    }) => {
        const { disabled, name, type, disableTip = '' } = node
        const { optNode } = useDirTreeContext()
        const ref = useRef<HTMLDivElement | null>(null)
        const isHovering = useHover(ref)
        const isArchitecture = architectureTypeList.includes(
            type as Architecture,
        )
        return (
            <Tooltip title={disableTip}>
                <div
                    ref={ref}
                    className={styles['itemview-wrapper']}
                    title={name}
                >
                    <span
                        className={styles['itemview-icon']}
                        hidden={uncategorized}
                    >
                        {isArchitecture ? (
                            <Icons type={type as Architecture} />
                        ) : (
                            <BusinessDomainLevelIcon
                                type={type as BusinessDomainLevelTypes}
                                isColored
                            />
                        )}
                    </span>
                    <span className={styles['itemview-wrapper-nodename']}>
                        {name}
                    </span>
                    {isChecked && (
                        <CheckOutlined
                            className={styles['itemview-wrapper-checkIcon']}
                        />
                    )}
                    {isShowOperate && (
                        <span
                            style={{
                                display:
                                    isHovering || optNode?.id === node?.id
                                        ? 'block'
                                        : 'none',
                            }}
                        >
                            <OptView
                                data={node}
                                handleOperate={handleOperate}
                            />
                        </span>
                    )}
                </div>
            </Tooltip>
        )
    },
)

/**
 * 搜索结果项
 * @param item 节点数据
 * @returns 搜索结果项Element
 */
const SearchItem = memo(
    ({
        item,
        isShowOperate,
        handleOperate,
        isChecked,
    }: {
        item: DataNode
        isShowOperate: boolean
        handleOperate: (
            ot: OperateType,
            at: Architecture,
            td?: DataNode,
            parentNode?: DataNode,
        ) => void
        isChecked?: boolean
    }) => {
        const { name, path, type, disabled, disableTip = '' } = item

        const { optNode } = useDirTreeContext()
        const ref = useRef<HTMLDivElement | null>(null)
        const isHovering = useHover(ref)
        const isArchitecture = architectureTypeList.includes(
            type as Architecture,
        )

        return (
            <Tooltip title={disableTip}>
                <div ref={ref} className={styles['search-item']}>
                    <div className={styles['search-item-icon']}>
                        {isArchitecture ? (
                            <Icons type={type as Architecture} />
                        ) : (
                            <BusinessDomainLevelIcon
                                type={type as BusinessDomainLevelTypes}
                                isColored
                            />
                        )}
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
                        {isShowOperate && (
                            <span
                                style={{
                                    visibility:
                                        isHovering || optNode?.id === item?.id
                                            ? 'visible'
                                            : 'hidden',
                                }}
                            >
                                <OptView
                                    data={item}
                                    handleOperate={handleOperate}
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
        handleOperate,
        isShowOperate,
        checkedKeys,
        isOnlyProcess,
        disabledFn,
        disableTip,
        totalCount,
        listDataLoading,
        onNextData,
    }: {
        data: DataNode[]
        isShowOperate: boolean
        handleOperate: (
            ot: OperateType,
            at: Architecture,
            td?: DataNode,
            parentNode?: DataNode,
        ) => void
        checkedKeys: string[]
        isOnlyProcess?: boolean
        disabledFn?: (value: any) => boolean
        disableTip?: (value: any) => string
        totalCount: number
        listDataLoading: boolean
        onNextData: () => void
    }) => {
        const { setCurrentNode } = useDirTreeContext()
        const [checkedNode, setCheckedNode] = useState<DataNode>()
        const list = isOnlyProcess
            ? data?.filter(
                  (item) => item.type === BusinessDomainLevelTypes.Process,
              )
            : data
        const scrollRef = useRef<HTMLDivElement>(null)
        const scrollListId = 'scrollableDiv'

        return (
            <div
                className={classnames(
                    styles['search-wrapper'],
                    isOnlyProcess && styles['search-wrapper-autoHt'],
                    'search-result',
                )}
                ref={scrollRef}
                id={scrollListId}
            >
                <InfiniteScroll
                    hasMore={data?.length < totalCount}
                    dataLength={data?.length || 0}
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
                        onNextData()
                    }}
                >
                    {list?.map((o: DataNode) => {
                        const disabled = disabledFn ? disabledFn(o) : false
                        const disableTitle = disableTip ? disableTip(o) : ''
                        return (
                            <div
                                key={o?.id}
                                onClick={() => {
                                    if (disabled) {
                                        return
                                    }
                                    setCheckedNode(o)
                                    // 添加时间戳，解决再次点击同一节点，监听不触发的问题
                                    setCurrentNode(
                                        isOnlyProcess
                                            ? { ...o, _t: new Date().getTime() }
                                            : o,
                                    )
                                }}
                                className={classnames({
                                    [styles.checked]: checkedNode?.id === o?.id,
                                    [styles.disabled]: !!disabled,
                                })}
                            >
                                <SearchItem
                                    key={o.id}
                                    item={{
                                        ...o,
                                        disabled,
                                        disableTip: disableTitle,
                                    }}
                                    isShowOperate={isShowOperate}
                                    handleOperate={handleOperate}
                                    isChecked={checkedKeys?.includes(o.id)}
                                />
                            </div>
                        )
                    })}
                </InfiniteScroll>
            </div>
        )
    },
)

// 参数设置
const InitParams = { limit: 0, id: '', is_all: false }

interface IArchitectureDirTree {
    ref: any
    getSelectedNode: (node: DataNode) => void
    // 自定义初始过滤参数
    initParams?: Object
    // 过滤的节点类型
    filterType: string
    // 隐藏的节点类型
    hiddenType: Architecture[]
    /** 搜索库表内容顶部内容 */
    aboveSearchRender?: ReactNode
    // 能否展示数据空库表
    canEmpty: boolean
    isShowAll: boolean
    /** 过滤组件使用-外界传入-搜索/清空关键字 */
    searchKeyword?: string
    isShowSearch: boolean
    isShowOperate: boolean
    // 是否显示本部门Radio切换
    isOrgTreeShowCurDeptOpt?: boolean
    // 直接显示本部门
    isShowCurDept?: boolean
    // 显示主部门
    isShowMainDept?: boolean
    type?: string
    placeholder?: string
    handleLoadOrEmpty?: (isLoading: boolean, isEmpty: boolean) => void
    extendNodesData?: { title: ReactNode | string; id: string }[]
    needUncategorized?: boolean // 是否需要显示未分类
    unCategorizedKey?: string // 未分类的名称
    isIncludeProcess?: boolean
    getSelectedKeys?: (node: any) => void
    selectedNodes?: DataNode[]
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
 * 组织架构目录树
 * @param getSelectedNode 响应选中节点事件
 * @param filterType 查询节点类型
 */
const ArchitectureDirTree: FC<Partial<IArchitectureDirTree>> = forwardRef(
    (props: any, ref) => {
        const {
            getSelectedNode,
            initParams,
            filterType,
            canEmpty = true,
            isShowAll = true,
            searchKeyword = '',
            isShowSearch = true,
            isShowOperate = false,
            isOrgTreeShowCurDeptOpt = false,
            isShowCurDept = false,
            isShowMainDept = false,
            hiddenType = hiddenNodeType,
            type,
            handleLoadOrEmpty,
            extendNodesData,
            needUncategorized = false,
            unCategorizedKey = 'uncategory',
            placeholder,
            isIncludeProcess,
            getSelectedKeys,
            selectedNodes,
            disabledFn,
            disableTip,
        } = props

        const [data, setData] = useSafeState<DataNode[]>()
        const [searchResult, setSearchResult] = useSafeState<DataNode[]>()
        const { currentNode, setCurrentNode } = useDirTreeContext()
        const [keyword, setKeyword] = useSafeState<string>('')
        const deferredKeyWord = useDeferredValue(keyword)
        const [selectedNode, setSelectedNode] = useState<DataNode>()
        const [treeExpandedKeys, setTreeExpandedKeys] = useState<Array<Key>>([])
        const [treeLoadedKeys, setTreeLoadedKeys] = useState<Array<Key>>([])
        const [isLoading, setIsLoading] = useState<boolean>(false)
        const [isSearching, setIsSearching] = useState<boolean>(false)
        // 为了保证逻辑, 以下为原结构方法
        const [createNodeType, setCreateNodeType] = useState<Architecture>(
            Architecture.BSYSTEM,
        )
        const [createVisible, setCreateVisible] = useState(false)
        const [moveVisible, setMoveVisible] = useState(false)

        const [operateType, setOperateType] = useState<OperateType>(
            OperateType.CREATE,
        )
        const [checkedKeys, setCheckedKeys] = useSafeState<string[]>([])
        const [selectedNodeList, setSelectedNodeList] = useState<any[]>([])

        // 部门切换-所有部门、本部门
        const [depRadioValue, setDepRadioValue] = useState<number>(1)
        const [curUserDepartment, setCurUserDepartment] = useState<any>()

        // 分页对象相关
        const [pageConfig, setPageConfig] = useState({
            offset: 1,
            limit: 50,
        })
        const [searchTotalCount, setSearchTotalCount] = useState<number>(0)
        const [listDataLoading, setListDataLoading] = useState<boolean>(false)

        useImperativeHandle(ref, () => ({
            handleOperate,
            data,
            renameCallback,
            setCurrentNode,
            handleTopAll,
        }))

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
            if (isIncludeProcess && currentNode) {
                handleSelect([], { node: currentNode })
            }
        }, [currentNode, type])

        // 外部设置选中树节点
        useEffect(() => {
            if (selectedNodes) {
                setCheckedKeys(selectedNodes.map((item) => item.id))
                setSelectedNodeList(selectedNodes)
            }
        }, [selectedNodes])

        useUpdateEffect(() => {
            getSelectedKeys?.(selectedNodeList)
        }, [selectedNodeList])

        useEffect(() => {
            if (isShowAll) {
                setCurrentNode(allNodeInfo)
            }
        }, [isShowAll])

        // 获取数据
        const getData = async (
            params: IGetObject,
            optType: DataOpt,
            parent_id?: string,
            lastData: DataNode[] = [],
        ) => {
            try {
                if (optType === DataOpt.Init) {
                    setIsLoading(true)
                }
                if (optType === DataOpt.Search && searchResult === undefined) {
                    setIsSearching(true)
                }
                if (params?.offset && params.offset > 1) {
                    setListDataLoading(true)
                }
                let responseData
                // 非搜索条件下不取消
                if (params.keyword) {
                    responseData = await getObjectsWithCancel(params)
                } else {
                    responseData = await getObjects(params)
                }
                const res = responseData?.entries
                setSearchTotalCount(responseData?.total_count)
                let processRes: any = []
                if (isIncludeProcess && optType === DataOpt.Load) {
                    const processResData = await getBusinessDomainProcessList({
                        keyword: '',
                        offset: 1,
                        limit: 100,
                        department_id: parent_id,
                        getall: false,
                        model_related: 0,
                        info_related: 0,
                    })
                    processRes = processResData?.entries?.filter(
                        (item) => item.department_id === parent_id,
                    )
                }
                let initData
                if (optType === DataOpt.Init) {
                    initData = res?.map((o) => ({
                        ...o,
                        isLeaf: !o.expand && !isIncludeProcess,
                        disabled: disabledFn ? disabledFn(o) : false,
                        disableTip: disableTip ? disableTip(o) : '',
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
                        if (
                            !isShowAll &&
                            initData?.length &&
                            !isIncludeProcess
                        ) {
                            setCurrentNode(initData?.[0])
                        }
                        setIsLoading(false)
                        break
                    case DataOpt.Load:
                        setData((prev: DataNode[] | undefined) =>
                            updateTreeData(
                                prev!,
                                parent_id!,
                                isIncludeProcess
                                    ? [...res, ...processRes]
                                    : res,
                                isIncludeProcess,
                                disabledFn,
                                disableTip,
                            ),
                        )
                        break
                    case DataOpt.Search:
                        setSearchResult([...(lastData || []), ...res])
                        setIsSearching(false)
                        break
                    default:
                        break
                }
            } catch (error) {
                formatError(error)
                setIsLoading(false)
                setIsSearching(false)
            } finally {
                setListDataLoading(false)
            }
        }

        // 初始化参数
        const QueryParams = useMemo(
            () =>
                initParams
                    ? { ...InitParams, ...initParams, type: filterType }
                    : { ...InitParams, type: filterType },
            [filterType, initParams],
        )

        const { run: debouncedGetData } = useDebounceFn(
            (
                params: IGetObject,
                optType: DataOpt,
                parent_id?: string,
                lastData: DataNode[] = [],
            ) => {
                getData(params, optType, parent_id, lastData)
            },
            { wait: 100 },
        )

        const onNextData = () => {
            setPageConfig({
                offset: pageConfig.offset + 1,
                limit: pageConfig.limit,
            })
            debouncedGetData(
                {
                    ...QueryParams,
                    is_all: true,
                    keyword: deferredKeyWord,
                    offset: pageConfig.offset + 1,
                    limit: pageConfig.limit,
                },
                DataOpt.Search,
                undefined,
                searchResult,
            )
        }

        // 节点查询
        useAsyncEffect(async () => {
            if (!isShowCurDept) {
                debouncedGetData(QueryParams, DataOpt.Init)
            }
        }, [QueryParams, isShowCurDept])

        // 增量更新
        const onLoadData = async (node: any) => {
            try {
                const { id, children } = node
                if (children) {
                    return Promise.resolve()
                }
                await debouncedGetData({ ...QueryParams, id }, DataOpt.Load, id)
            } catch (err) {
                formatError(err)
            }
            return Promise.resolve()
        }

        // 搜索查询
        useUpdateEffect(() => {
            if (deferredKeyWord) {
                if (isIncludeProcess) {
                    searchProcess(deferredKeyWord)
                } else {
                    setPageConfig({
                        offset: 1,
                        limit: 50,
                    })
                    debouncedGetData(
                        {
                            ...QueryParams,
                            is_all: true,
                            keyword: deferredKeyWord,
                            offset: 1,
                            limit: 50,
                        },
                        DataOpt.Search,
                    )
                }
            } else {
                setSearchResult(undefined)
            }
        }, [deferredKeyWord])

        // 搜索业务流程
        const searchProcess = async (kw: string) => {
            try {
                const responseData = await getBusinessDomainTree({
                    parent_id: '',
                    keyword: kw,
                    getall: true,
                })
                const res = responseData?.entries
                setSearchResult(res)
                setIsSearching(false)
            } catch (err) {
                formatError(err)
            }
        }

        const handleSearch = (key: string) => {
            setKeyword(key)
        }

        const handleTopAll = useCallback(() => setCurrentNode(allNodeInfo), [])

        // 设置选中节点
        const handleSelect = (keys: Key[], info: any) => {
            const { node } = info // node: EventDataNode<DataNode>
            if (isIncludeProcess) {
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
                setCurrentNode(node)
            }
        }

        // 以下为原结构逻辑
        const handleOperate = (
            ot: OperateType,
            at: Architecture,
            td?: DataNode,
            parentNode?: DataNode,
        ) => {
            if (OperateType.CREATE === ot) {
                setCreateVisible(true)
                setCreateNodeType(at)
            } else if (ot === OperateType.RENAME) {
                setCreateVisible(true)
            } else if (ot === OperateType.MOVE) {
                setMoveVisible(true)
            }
            setOperateType(ot)
            setSelectedNode(td)
        }

        // 获取当前部门
        const getCurDepartment = async () => {
            try {
                if (isShowMainDept) {
                    const mainDepart = await getMainDepartInfo()
                    return mainDepart
                }
                const res = await getCurUserDepartment()
                // 当前树能根据id匹配到部门，根据id显示部门，不能匹配到，显示部门名称
                if (res?.length === 1) {
                    const [dept] = res
                    setCurUserDepartment(res[0])
                    return res[0]
                }
                return undefined
            } catch (error) {
                formatError(error)
                return Promise.resolve([])
            }
        }

        useEffect(() => {
            handleSearchRadioChange({
                target: { value: isShowCurDept ? 2 : 1 },
            })
        }, [isShowCurDept])

        const handleSearchRadioChange = async (e) => {
            const { value } = e?.target || {}
            setDepRadioValue(value)
            if (value === 1) {
                debouncedGetData(QueryParams, DataOpt.Init)
                if (isShowAll) {
                    setCurrentNode(allNodeInfo)
                }
            } else if (value === 2) {
                // setSearchResult(data)
                let res = curUserDepartment
                if (!res) {
                    res = await getCurDepartment()
                    if (res) {
                        setCurUserDepartment(res)
                    } else {
                        return
                    }
                }
                expandNodeById(res.id)
            }
        }

        /**
         * 根据部门节点，默认展开对应层级
         * @param id
         */
        const expandNodeById = async (id: string) => {
            try {
                if (!id) return
                setIsLoading(true)

                const res: any = await getObjectDetails(id)
                const pathIds = res?.path_id?.split('/').slice(0, -1) || []
                if (res) {
                    setData([res])
                    setCurrentNode(res)
                }

                // 在完整树结构中展开到对应节点
                // const unLoadData =
                //     pathIds?.filter(
                //         (currentId) =>
                //             !data?.find(
                //                 (treeinfo) =>
                //                     treeinfo.path_id
                //                         ?.split('/')
                //                         .slice(-2, -1)[0] === currentId,
                //             ),
                //     ) || []

                // await Promise.all(
                //     unLoadData.map((currentId) =>
                //         onLoadData({ id: currentId } as any),
                //     ),
                // )

                // setTimeout(() => {
                //     setTreeLoadedKeys(
                //         uniq([...(treeLoadedKeys || []), ...pathIds]),
                //     )
                //     setTreeExpandedKeys(
                //         uniq([...(treeExpandedKeys || []), ...pathIds]),
                //     )
                //     setCurrentNode(res)
                // }, 100)
            } catch (ex) {
                debouncedGetData(QueryParams, DataOpt.Init)

                setTimeout(() => {
                    setTreeLoadedKeys([])
                    setTreeExpandedKeys([])
                }, 100)
                formatError(ex)
            } finally {
                setIsLoading(false)
            }
        }

        // 搜索结果渲染
        const toRenderSearch = useMemo(
            () => (
                <SearchContainer
                    data={(searchResult as DataNode[]) || []}
                    handleOperate={handleOperate}
                    isShowOperate={isShowOperate}
                    checkedKeys={checkedKeys}
                    isOnlyProcess={isIncludeProcess}
                    disabledFn={disabledFn}
                    disableTip={disableTip}
                    totalCount={searchTotalCount}
                    listDataLoading={listDataLoading}
                    onNextData={onNextData}
                />
            ),
            [isShowOperate, searchResult, handleOperate, checkedKeys],
        )

        const titleRender = useCallback(
            (node: any) => (
                <ItemView
                    node={node}
                    isShowOperate={isShowOperate}
                    handleOperate={handleOperate}
                    uncategorized={unCategorizedKey === node.id}
                    isChecked={checkedKeys.includes(node.id)}
                />
            ),
            [isShowOperate, handleOperate, hiddenType, checkedKeys],
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

        // 删除节点 callback 外部回调
        // 重命名节点后更新节点的名字 （不调后端列表接口）
        const renameCallback = (name: string) => {
            const temp: DataNode[] = cloneDeep(data) ?? []
            const curNode = getTreeNode(
                temp,
                (node: DataNode) => node.id === selectedNode?.id,
            )
            if (curNode) {
                curNode.name = name
                setData(temp)
            }
            // 在列表重命名 树节点中不存在该节点，则该节点还未加载，但外部需要更新数据
            getSelectedNode()
        }

        return (
            <>
                <DirTree
                    conf={{
                        placeholder:
                            placeholder ||
                            __('搜索组织、行政区、部门、处（科）室'),
                        aboveSearchRender: isOrgTreeShowCurDeptOpt ? (
                            <div className={styles.deptRadioSwitchWrapper}>
                                <Radio.Group
                                    onChange={handleSearchRadioChange}
                                    optionType="button"
                                    buttonStyle="solid"
                                    value={depRadioValue}
                                >
                                    <Radio.Button value={1}>
                                        {__('所有部门')}
                                    </Radio.Button>
                                    <Radio.Button value={2}>
                                        {__('本部门')}
                                    </Radio.Button>
                                </Radio.Group>
                            </div>
                        ) : undefined,
                        searchKeyword,
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
                    }}
                    treeData={data as any}
                    loadData={onLoadData}
                    fieldNames={{ key: 'id' }}
                    titleRender={titleRender}
                    onSelect={handleSelect}
                    selectedKeys={currentNode ? [currentNode?.id] : []}
                    onExpand={setTreeExpandedKeys}
                    expandedKeys={treeExpandedKeys}
                    // loadedKeys={treeLoadedKeys}
                />
                {isLoading ||
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
                          </div>
                      ))}
            </>
        )
    },
)

export const ArchitectureDirTreeContainer = forwardRef(
    (props: Partial<IArchitectureDirTree>, ref) => {
        return (
            <DirTreeProvider>
                <ArchitectureDirTree {...props} ref={ref} />
            </DirTreeProvider>
        )
    },
)

export default memo(ArchitectureDirTreeContainer)
