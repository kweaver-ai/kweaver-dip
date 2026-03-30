import { CheckOutlined } from '@ant-design/icons'
import {
    useAsyncEffect,
    useClickAway,
    useHover,
    useSafeState,
    useUpdateEffect,
} from 'ahooks'
import { Dropdown, MenuProps, Radio } from 'antd'
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
import classnames from 'classnames'
import { cloneDeep } from 'lodash'
import DirTree from '@/ui/DirTree'
import {
    formatError,
    BusinessDomainLevelTypes,
    getSingleCatalogInfo,
    reqBusinObjList,
} from '@/core'
import { DirTreeProvider, useDirTreeContext } from '@/context/DirTreeProvider'
import Icons from '@/components/BusinessArchitecture/Icons'
import MoreHorizontalOutlined from '@/icons/MoreHorizontalOutlined'
import {
    Architecture,
    DataNode as DataNodeTP,
    allNodeInfo,
    hiddenNodeType,
    nodeInfo,
    architectureTypeList,
} from '@/components/BusinessArchitecture/const'
import __ from './locale'
import styles from './styles.module.less'
import { OperateType } from '@/utils'
import { EllipsisMiddle } from '@/ui'
import BusinessDomainLevelIcon from '../BusinessDomainLevel/BusinessDomainLevelIcon'

export enum QueryType {
    AUTH = 'authorization',
    DEPART = 'department',
}

export interface DataNode extends DataNodeTP {
    resource_id?: string
    department_path_id: string
    children?: DataNode[]
}

interface GetInfo {
    limit: number
    department_id?: string
    type: QueryType
    keywords?: string
}

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
): DataNode[] =>
    list.map((node) => {
        const isArchitecture = architectureTypeList.includes(node.type)
        if (node.id === id) {
            return {
                ...node,
                // 包含业务流程：属于组件、部门，全部展开，业务流程全部没用展开按钮
                isLeaf: !node.expand,
                children: children?.map((child) => {
                    const subIsArchitecture = architectureTypeList.includes(
                        child.type,
                    )
                    return {
                        ...child,
                        isLeaf: isIncludeProcess
                            ? !subIsArchitecture
                            : !child.expand,
                    }
                }),
            }
        }
        if (node.children) {
            return {
                ...node,
                isLeaf: !node.expand,
                children: updateTreeData(
                    node.children,
                    id,
                    children,
                    isIncludeProcess,
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
        const { name, type } = node
        const { optNode } = useDirTreeContext()
        const ref = useRef<HTMLDivElement | null>(null)
        const isHovering = useHover(ref)
        const isArchitecture = architectureTypeList.includes(
            type as Architecture,
        )
        return (
            <div ref={ref} className={styles['itemview-wrapper']} title={name}>
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
                        <OptView data={node} handleOperate={handleOperate} />
                    </span>
                )}
            </div>
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
        const { name, path, type } = item

        const { optNode } = useDirTreeContext()
        const ref = useRef<HTMLDivElement | null>(null)
        const isHovering = useHover(ref)
        const isArchitecture = architectureTypeList.includes(
            type as Architecture,
        )

        return (
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
                                className={styles['search-item-content-path']}
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
        handleSelect,
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
        handleSelect: (keys: any[], info: any) => void
    }) => {
        const { setCurrentNode } = useDirTreeContext()
        const [checkedNode, setCheckedNode] = useState<DataNode>()
        const list = isOnlyProcess
            ? data?.filter(
                  (item) => item.type === BusinessDomainLevelTypes.Process,
              )
            : data
        return (
            <div
                className={classnames(
                    styles['search-wrapper'],
                    isOnlyProcess && styles['search-wrapper-autoHt'],
                    'search-result',
                )}
            >
                {list?.map((o: DataNode) => (
                    <div
                        key={o?.id}
                        onClick={() => {
                            setCheckedNode(o)
                            // 添加时间戳，解决再次点击同一节点，监听不触发的问题
                            setCurrentNode(
                                isOnlyProcess
                                    ? { ...o, _t: new Date().getTime() }
                                    : o,
                            )
                            handleSelect([], { node: { ...o } })
                        }}
                        className={
                            checkedNode?.id === o?.id ? styles.checked : ''
                        }
                    >
                        <SearchItem
                            key={o.id}
                            item={o}
                            isShowOperate={isShowOperate}
                            handleOperate={handleOperate}
                            isChecked={checkedKeys?.includes(o.id)}
                        />
                    </div>
                ))}
            </div>
        )
    },
)

// 参数设置
const InitParams = {
    limit: 0,
    department_id: '',
    type: QueryType.DEPART,
    keywords: '',
}

interface IArchitectureDirTree {
    ref: any
    // 单选框默认选中
    defaultDepValue?: QueryType
    getSelectedNode: (node: DataNode) => void
    // 自定义初始过滤参数
    initParams?: Object
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
    type?: string
    placeholder?: string
    handleLoadOrEmpty?: (isLoading: boolean, isEmpty: boolean) => void
    extendNodesData?: { title: ReactNode | string; id: string }[]
    needUncategorized?: boolean // 是否需要显示未分类
    unCategorizedKey?: string // 未分类的名称
    isIncludeProcess?: boolean
    getSelectedKeys?: (node: any) => void
    selectedNodes?: DataNode[]
    onTypeChange?: (type: QueryType) => void
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
 * 目录查询目录树
 * @param getSelectedNode 响应选中节点事件
 */
const CatalogDirTree: FC<Partial<IArchitectureDirTree>> = forwardRef(
    (props: any, ref) => {
        const {
            getSelectedNode,
            initParams,
            canEmpty = true,
            isShowAll = true,
            searchKeyword = '',
            isShowSearch = true,
            isShowOperate = false,
            isOrgTreeShowCurDeptOpt = false,
            hiddenType = hiddenNodeType,
            handleLoadOrEmpty,
            extendNodesData,
            needUncategorized = false,
            unCategorizedKey = 'uncategory',
            placeholder,
            isIncludeProcess,
            getSelectedKeys,
            selectedNodes,
            onTypeChange,
            defaultDepValue,
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
        const [depRadioValue, setDepRadioValue] = useState<QueryType>(
            defaultDepValue ?? QueryType.DEPART,
        )

        useImperativeHandle(ref, () => ({
            handleOperate,
            data,
            renameCallback,
            setCurrentNode,
            handleTopAll,
            setTreeExpandedKeys,
        }))

        useUpdateEffect(() => {
            if (handleLoadOrEmpty) {
                handleLoadOrEmpty(isLoading, !isLoading && !data?.length)
            }
        }, [isLoading, data])

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
            params: GetInfo,
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
                const responseData = await getSingleCatalogInfo({
                    ...params,
                    department_id: parent_id,
                })
                const res = responseData?.entries
                let processRes: any = []
                if (isIncludeProcess && optType === DataOpt.Load) {
                    const processResData = await reqBusinObjList({
                        keyword: '',
                        filter: {
                            business_object_id: [],
                            cate_info_req: [
                                {
                                    cate_id:
                                        '00000000-0000-0000-0000-000000000001',
                                    node_ids: [parent_id],
                                },
                            ],
                            data_kind: [],
                            shared_type: [],
                        },
                    } as any)
                    processRes = processResData?.entries?.map((item) => {
                        const { name } = item as any
                        return {
                            ...item,
                            name,
                            type: Architecture.DATACATALOG,
                        }
                    })
                }
                let initData
                if (optType === DataOpt.Init) {
                    initData = res?.map((o) => ({
                        ...o,
                        isLeaf: !o.expand && !isIncludeProcess,
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
                        // if (
                        //     !isShowAll &&
                        //     initData?.length &&
                        //     !isIncludeProcess
                        // ) {
                        //     console.log('aaaaaaaaaaaaaaa')
                        //     setCurrentNode(null)
                        // }
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
            () =>
                initParams
                    ? { ...InitParams, ...initParams }
                    : { ...InitParams },
            [initParams],
        )

        // 节点查询
        useAsyncEffect(async () => {
            getData(QueryParams, DataOpt.Init)
        }, [QueryParams])

        // 搜索查询
        useUpdateEffect(() => {
            if (deferredKeyWord) {
                if (isIncludeProcess) {
                    searchProcess(deferredKeyWord)
                } else {
                    getData(
                        {
                            ...QueryParams,
                            keywords: deferredKeyWord,
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
            // try {
            //     const responseData = await getBusinessDomainTree({
            //         parent_id: '',
            //         keyword: kw,
            //         getall: true,
            //     })
            //     const res = responseData?.entries
            //     setSearchResult(res)
            //     setIsSearching(false)
            // } catch (err) {
            //     formatError(err)
            // }
        }

        const handleSearch = (key: string) => {
            setKeyword(key)
        }

        const handleTopAll = useCallback(() => setCurrentNode(allNodeInfo), [])

        // 设置选中节点
        const handleSelect = (keys: Key[], info: any) => {
            const { node } = info // node: EventDataNode<DataNode>

            if (node.type === 'data_catalog') {
                setCurrentNode(node)
                getSelectedNode(node)
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

        const handleSearchRadioChange = async (e) => {
            const { value } = e?.target || {}
            setDepRadioValue(value)
            setCurrentNode(null)
            getSelectedNode(null)

            if (onTypeChange) {
                onTypeChange(value)
            }
        }

        // 搜索结果渲染
        const toRenderSearch = useMemo(
            () => (
                <SearchContainer
                    data={searchResult as DataNode[]}
                    handleOperate={handleOperate}
                    isShowOperate={isShowOperate}
                    checkedKeys={checkedKeys}
                    isOnlyProcess={isIncludeProcess}
                    handleSelect={handleSelect}
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
                        placeholder: placeholder || __('搜索数据目录名称'),
                        aboveSearchRender: isOrgTreeShowCurDeptOpt ? (
                            <div className={styles.queryTypeWrapper}>
                                <Radio.Group
                                    onChange={handleSearchRadioChange}
                                    className={styles.fitWidth}
                                    value={depRadioValue}
                                >
                                    <Radio.Button value={QueryType.DEPART}>
                                        {__('本部门')}
                                    </Radio.Button>
                                    <Radio.Button value={QueryType.AUTH}>
                                        {__('已授权')}
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
                    // loadData={onLoadData}
                    fieldNames={{ key: 'id' }}
                    titleRender={titleRender}
                    onSelect={handleSelect}
                    selectedKeys={currentNode ? [currentNode?.id] : []}
                    onExpand={setTreeExpandedKeys}
                    expandedKeys={treeExpandedKeys}
                    autoExpandParent
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

export const CatalogDirTreeContainer = forwardRef(
    (props: Partial<IArchitectureDirTree>, ref) => {
        return (
            <DirTreeProvider>
                <CatalogDirTree {...props} ref={ref} />
            </DirTreeProvider>
        )
    },
)

export default memo(CatalogDirTreeContainer)
