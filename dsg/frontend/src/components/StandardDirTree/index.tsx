/* eslint-disable prettier/prettier */
import {
    CaretDownOutlined,
    CaretUpOutlined,
    ExclamationCircleFilled,
} from '@ant-design/icons'
import { useClickAway, useHover, useSafeState, useUpdateEffect } from 'ahooks'
import {
    Collapse,
    Dropdown,
    Form,
    Input,
    message,
    Modal,
    Popconfirm,
    Select,
    Tooltip,
} from 'antd'
import classnames from 'classnames'
import { isNumber, toNumber } from 'lodash'
import moment from 'moment'
import { MenuInfo } from 'rc-menu/lib/interface'
import {
    FC,
    forwardRef,
    Key,
    memo,
    useCallback,
    useDeferredValue,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from 'react'
import {
    addDir,
    CatalogOption,
    CatalogType,
    delDirById,
    exportDataEleBySearch,
    exportDict,
    formatError,
    getDirDataBySearch,
    IDirItem,
    IDirQueryType,
    queryFileCatlgOrFile,
    StdFileCatlgType,
    updateDirById,
} from '@/core'
import { findDirByKey, MoreOperate, StdTreeDataOpt } from './const'
import DirTree from './DirTree'
import { DirTreeProvider, useDirTreeContext } from './DirTreeProvider'
import __ from './locale'
import styles from './styles.module.less'
// import {
//     ErrorInfo,
//     OperateType,
//     commReg,
//     streamToFile,
//     validateEmpty,
// } from '@/utils'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import MoreHorizontalOutlined from '@/icons/MoreHorizontalOutlined'
import { commReg, ErrorInfo, OperateType, streamToFile } from '@/utils'
import ArchitectureDirTree from '../BusinessArchitecture/ArchitectureDirTree'
import { Architecture } from '../BusinessArchitecture/const'
import { validateEmpty } from '../DataEleManage/validate'
import EditDirModal from '../Directory/EditDirModal'

const { Panel } = Collapse
type DataNode = IDirItem | any

/**
 * @param key 目录节点key
 * @param data 目录datat
 * @param aimItemPrams 匹配key值为参数key的节点并向其中加上aimItemPrams
 * @param otherItemParms otherItemParms
 * @returns
 */
const oprTreeData = (
    key: string,
    data: [],
    aimItemPrams: {},
    otherItemParms?: {},
) => {
    data.forEach((item: any) => {
        if (item.id === key) {
            Object.assign(item, aimItemPrams)
        } else if (otherItemParms) {
            Object.assign(item, otherItemParms)
        }
        if (item.children) {
            oprTreeData(key, item.children, aimItemPrams, otherItemParms)
        }
    })
    return data
}

/**
 * 获取父节点
 * @param list
 * @param id
 * @returns
 */
const getParentNode = (list: IDirItem[], id: Key): IDirItem => {
    let parentNode: IDirItem
    list?.forEach((item) => {
        if (item.children) {
            if (item.children.some((it: any) => it.id === id)) {
                parentNode = item
            } else if (getParentNode(item.children, id)) {
                parentNode = getParentNode(item.children, id)
            }
        }
    })
    return parentNode!
}

// 找出所有父节点
export const findParents = (allData: IDirItem[], key: string): IDirItem[] => {
    const allParents: IDirItem[] = []
    if (allData?.length === 0) {
        return []
    }

    const findele = (data: any, id: string) => {
        if (!id) return
        data?.forEach((item: any) => {
            if (item.id === id) {
                allParents.unshift(item)
                findele(allData, item.parent_id)
            } else if (item.children) {
                findele(item.children, id)
            }
        })
    }

    findele(allData, key)
    return allParents
}

// 检验目录名称
const validateDirName = (msg: string) => {
    return (_: any, value: string) => {
        return new Promise((resolve, reject) => {
            const newValue = typeof value === 'string' ? value.trim() : value
            if (newValue && !commReg.test(newValue)) {
                reject(new Error(msg))
            }
            resolve(1)
        })
    }
}

/**
 * 操作库表
 * @param node 节点信息
 * @return 操作菜单库表
 */
const OptView = memo(({ node }: { node: any }) => {
    const { nodeOpt, optNode, setOptNode } = useDirTreeContext()
    const { moreOptMenus, handleClickMenu } = nodeOpt ?? {}
    const [open, setOpen] = useState<boolean>(false)

    useEffect(() => {
        setOpen(optNode?.id === node?.id)
    }, [optNode])

    const clickRef = useRef<HTMLDivElement>(null)
    useClickAway(() => {
        if (open) {
            setOptNode(undefined)
        }
    }, clickRef)

    return (
        <div ref={clickRef}>
            <Dropdown
                menu={{
                    items: moreOptMenus?.(node.id) ?? [],
                    onClick: (e) => {
                        e.domEvent.stopPropagation()
                        handleClickMenu?.(e, node)
                        setOptNode(undefined)
                    },
                }}
                placement="bottomRight"
                open={open}
                // getPopupContainer={(node) => node.parentElement || node}
                overlayStyle={{
                    minWidth: 120,
                }}
            >
                <div
                    className={classnames(
                        styles.menuBtn,
                        open && styles.active,
                    )}
                    onClick={(e) => {
                        setOptNode(open ? undefined : node)
                        e.preventDefault()
                        e.stopPropagation()
                    }}
                    title="操作"
                >
                    <MoreHorizontalOutlined />
                    {/* <AddOutlined /> */}
                </div>
            </Dropdown>
        </div>
    )
})

/**
 * 目录项
 * @param node 节点数据
 * @returns 目录项Element
 */
const ItemView = memo(({ node, canOpt }: { node: any; canOpt: boolean }) => {
    const { catalog_name } = node
    const { count } = node
    const ref = useRef<HTMLDivElement | null>(null)
    const isHovering = useHover(ref)
    const { nodeOpt, optNode } = useDirTreeContext()
    const { dirType, selCatlgClass, moreAccess, optMenuItems } = nodeOpt ?? {}

    return (
        <div ref={ref} className={styles.itemviewWrapper}>
            <div
                className={styles.itemviewWrapperNodename}
                title={`${catalog_name}${isNumber(count) ? `(${count})` : ''}`}
            >
                <span className={styles.catlgName}>{catalog_name}</span>
                {isNumber(count) && (
                    <span className={styles.catlgCount}>{`(${count})`}</span>
                )}
            </div>
            {/* 文件模块或其他模块的自定义目录悬浮有操作按钮 */}
            {(dirType === CatalogType.FILE ||
                selCatlgClass === CatalogOption.AUTOCATLG) &&
                optMenuItems?.length &&
                canOpt &&
                moreAccess && (
                    <span
                        style={{
                            display:
                                isHovering || optNode?.id === node?.id
                                    ? 'block'
                                    : 'none',
                        }}
                    >
                        <OptView node={node} />
                    </span>
                )}
        </div>
    )
})

/**
 * 搜索结果项
 * @param node 节点数据
 * @returns 搜索结果项Element
 */
const SearchItem = memo(({ node }: { node: DataNode }) => {
    const { catalog_name: name, level, status, count } = node
    const ref = useRef<HTMLDivElement | null>(null)
    const isHovering = useHover(ref)
    const { nodeOpt, optNode } = useDirTreeContext()
    const { moreAccess, optMenuItems } = nodeOpt ?? {}

    return (
        <div
            ref={ref}
            className={styles.searchItem}
            title={`${name}${isNumber(count) ? `(${count})` : ''}`}
        >
            <div className={styles.searchItemRight}>
                <div className={styles.searchItemContent}>
                    <div className={styles.searchItemContent}>
                        <span className={styles.catlgName}>{name}</span>
                        {isNumber(count) && (
                            <span
                                className={styles.catlgCount}
                            >{`(${count})`}</span>
                        )}
                    </div>
                </div>
                {optMenuItems?.length && moreAccess && (
                    <span
                        style={{
                            display:
                                isHovering || optNode?.id === node?.id
                                    ? 'block'
                                    : 'none',
                        }}
                    >
                        <OptView node={node} />
                    </span>
                )}
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
    const { currentNode, setCurrentNode } = useDirTreeContext()

    const renderDomainBlock = () => {
        return (
            <div>
                {data?.map((o) => (
                    <div
                        key={o?.id}
                        className={
                            currentNode?.id === o?.id ? styles.checked : ''
                        }
                        onClick={() => {
                            setCurrentNode(o)
                        }}
                    >
                        <SearchItem node={o} />
                    </div>
                ))}
            </div>
        )
    }
    return <div className={styles.searchWrapper}>{renderDomainBlock()}</div>
})

interface IStandardDirTree {
    ref?: any
    loading?: boolean
    dirType: CatalogType
    treeData: IDirItem[] | undefined
    getTreeList: (query?: IDirQueryType, optType?: StdTreeDataOpt) => void
    selectedDir: IDirItem | undefined
    setSelectedDir: (item: IDirItem) => void
    // 是否展示搜索框
    isShowSearch?: boolean
    // 是否展示标题
    isShowTitle?: boolean
    // 自定义目录操作
    optMenuItems?: Array<MoreOperate>
    showCatlgClassify?: boolean
    isShowAll?: boolean
    canOpt?: boolean
}

/**
 * 数据标准目录树
 */
const StandardDirTree: FC<Partial<IStandardDirTree>> = forwardRef(
    (props: any, ref) => {
        const {
            dirType,
            treeData,
            getTreeList,
            selectedDir,
            setSelectedDir,
            optMenuItems,
            isShowSearch = true,
            isShowTitle = true,
            showCatlgClassify = true,
            isShowAll = true,
            loading = false,
            canOpt = true,
        } = props

        const { checkPermission } = useUserPermCtx()
        const [keyword, setKeyword] = useSafeState<string>('')
        const deferredKeyWord = useDeferredValue(keyword)
        const [searchResult, setSearchResult] = useSafeState<DataNode[]>()
        const { currentNode, setCurrentNode, setNodeOpt } = useDirTreeContext()
        const [data, setData] = useState<DataNode[]>()
        const [topNode, setTopNode] = useState<DataNode>({})
        const [isSearching, setIsSearching] = useState<boolean>(false)
        // 添加节点信息
        const [addOptNode, setAddOptNode] = useState<IDirItem>()
        const [expandedKeys, setExpandedKeys] = useSafeState<string[]>([])

        // 移动至选中目录
        const [oprItem, setOprItem] = useState<IDirItem>()

        // 目录节点添加状态
        const [isAdding, setIsAdding] = useState(false)

        // 目录节点编辑状态
        const [isEditing, setIsEditing] = useState(false)

        // 添加/编辑目录
        const [editDirInfoVisible, setEditDirInfoVisible] = useState(false)

        // 添加/编辑目录项
        const [editDirInfoItem, setEditDirInfoItem] = useState<IDirItem>()

        // 添加/编辑目录，编辑节点及其所有祖先节点
        const [dirLevelList, setDirLevelList] = useState<IDirItem[]>()

        const [editMoveToVisible, setEditMoveToVisible] = useState(false)

        // 组织架构树
        const architectureDirTreeRef: any = useRef(null)

        // 添加/编辑目录
        const [form] = Form.useForm()

        const [viewModeOpen, setViewModeOpen] = useState(false)

        // 当前选中目录类型
        const catlgClassOptions = showCatlgClassify
            ? [
                  { label: '自定义目录', value: CatalogOption.AUTOCATLG },
                  {
                      label: '标准文件目录',
                      value: CatalogOption.STDFILECATLG,
                  },
                  {
                      label: '组织结构',
                      value: CatalogOption.DEPARTMENT,
                  },
              ]
            : []

        const [selCatlgClass, setSelCatlgClass] = useState<CatalogOption>(
            catlgClassOptions?.[0]?.value,
        )

        const [loadedKeys, setLoadedKeys] = useState<string[]>([
            treeData?.[0]?.id,
        ])

        useImperativeHandle(ref, () => ({
            addNewDir: (addedDir: IDirItem) => onAdd(addedDir),
            selCatlgClass,
            addNewExpandedKeys: updateExpandKeys,
        }))

        // 移动右侧列表数据至新目录时更新树数据后展开选中的目录
        const updateExpandKeys = (newNodeKey: string) => {
            const allParents = findParents(treeData as any, newNodeKey)
            const expandedKeysTemp = [...(expandedKeys || [])]
            allParents?.forEach((node) => {
                const { id } = node
                if (!expandedKeys.includes(id)) {
                    expandedKeysTemp.push(id)
                }
            })

            setExpandedKeys(expandedKeysTemp)
        }

        const hasAddPermission = useMemo(
            () => checkPermission('manageDataStandard') ?? false,
            [checkPermission],
        )

        useEffect(() => {
            const { children, ...rest } = treeData?.[0] ?? {}
            if (selCatlgClass === CatalogOption.STDFILECATLG) {
                setTopNode({
                    ...rest,
                    stdFileCatlgType: StdFileCatlgType.CATALOG,
                })
            } else {
                setTopNode(rest ?? {})
            }
            setData(children ?? [])
        }, [treeData])

        // 增量更新
        const onLoadData = async ({ id, children }: any) => {
            // Radio-标准文件目录-点击展开目录
            try {
                if (children) {
                    return Promise.resolve()
                }
                // 第一次展开
                const loadedKeysTemp = [...loadedKeys, id]
                setLoadedKeys(loadedKeysTemp)
                await getTreeList(
                    { type: dirType, catlgOption: selCatlgClass, id },
                    StdTreeDataOpt.Load,
                )
            } catch (err) {
                formatError(err)
            }
            return Promise.resolve()
        }

        useUpdateEffect(() => {
            // 新添加更新选中操作
            if (addOptNode) {
                // 获取添加节点在treeData中的完整节点信息
                const addNode = findDirByKey(
                    addOptNode?.catalog_name,
                    treeData,
                    'catalog_name',
                )
                if ((toNumber(addNode?.level) || 0) >= 2) {
                    const allParents = findParents(
                        treeData as any,
                        addNode?.parent_id || '',
                    )
                    const treeExpandedKeysTemp = [...(expandedKeys || [])]
                    allParents?.forEach((node) => {
                        const { id } = node
                        if (!expandedKeys.includes(id)) {
                            treeExpandedKeysTemp.push(id)
                        }
                    })
                    // 设置树展开
                    setExpandedKeys(treeExpandedKeysTemp)
                }
                setCurrentNode(addNode)
                setAddOptNode(undefined)
            }
        }, [treeData, findDirByKey])

        useUpdateEffect(() => {
            if (currentNode?.id !== selectedDir?.id) {
                setSelectedDir?.(currentNode)
            }
        }, [currentNode])

        useUpdateEffect(() => {
            setCurrentNode(selectedDir)
        }, [selectedDir])

        useEffect(() => {
            if (isShowAll && !currentNode && Object.keys(topNode)?.length) {
                setCurrentNode(topNode)
            }
        }, [isShowAll, topNode])

        useEffect(() => {
            if (selCatlgClass === CatalogOption.STDFILECATLG) {
                getTreeList(
                    { type: dirType, catlgOption: selCatlgClass },
                    StdTreeDataOpt.Init,
                )
            } else {
                getTreeList({ type: dirType, catlgOption: selCatlgClass })
            }
        }, [selCatlgClass])

        // 搜索查询
        useUpdateEffect(() => {
            if (deferredKeyWord) {
                setIsSearching(true)
                // 文件模块或其他模块的自定义目录
                if (
                    dirType === CatalogType.FILE ||
                    selCatlgClass === CatalogOption.AUTOCATLG
                ) {
                    getDirDataBySearch({
                        type: dirType,
                        catalog_name: deferredKeyWord,
                    })
                        .then((res: any) => {
                            setSearchResult(res?.data)
                        })
                        .finally(() => setIsSearching(false))
                } else if (selCatlgClass === CatalogOption.STDFILECATLG) {
                    queryFileCatlgOrFile(deferredKeyWord)
                        .then((res: any) => {
                            setSearchResult(res?.data)
                            const { catalogs, files } = res?.data || {}

                            const treeDataTemp = [
                                ...(catalogs?.length ? catalogs : []),
                                ...(files?.map((fItem) => {
                                    return {
                                        id: fItem.file_id,
                                        catalog_name: fItem.file_name,
                                        count: fItem.file_count,
                                        isLeaf: true,
                                        stdFileCatlgType: StdFileCatlgType.FILE,
                                    }
                                }) || []),
                            ]
                            setSearchResult(treeDataTemp)
                        })
                        .finally(() => setIsSearching(false))
                }
            } else {
                setSearchResult(undefined)
            }
        }, [deferredKeyWord])
        const titleRender = useCallback(
            (node: any) => <ItemView node={node} canOpt={canOpt} />,
            [selCatlgClass, canOpt],
        )

        // 搜索结果渲染
        const toRenderSearch = useMemo(() => {
            return <SearchContainer data={searchResult as DataNode[]} />
        }, [searchResult])

        const handleSearch = (key: string) => {
            setKeyword(key)
        }
        const handleTopAll = useCallback(() => {
            setCurrentNode(topNode)
        }, [topNode])

        // 设置选中节点
        const handleSelect = (keys: Key[], info: any) => {
            setCurrentNode(info.node)
        }
        const onClickAdd = () => {
            onAdd(topNode)
        }

        useEffect(() => {
            if (!editDirInfoVisible) {
                // 清空编辑目录信息框
                setEditDirInfoItem(undefined)
                form.resetFields()
            }
        }, [editDirInfoVisible])

        // 删除节点
        const onDelete = useCallback(
            async (key: string) => {
                try {
                    await delDirById(key)
                    // 删除成功 重置选中
                    const allParents = findParents(data as any, key)
                    if (allParents?.length >= 2) {
                        // eslint-disable-next-line no-unsafe-optional-chaining
                        const idx = allParents?.length - 2
                        setCurrentNode(allParents[idx])
                    } else {
                        setCurrentNode(topNode)
                    }
                    message.success(__('刪除成功'))
                } catch (error: any) {
                    if (error?.status === 400) {
                        const detailKey = error.data?.detail?.[0]?.Key || ''
                        const detailDesc =
                            error.data?.detail?.[0]?.Message || ''

                        if (
                            detailKey &&
                            detailKey === 'ResourceError.DataExist'
                        ) {
                            // 新建或编辑
                            error({
                                title: __('对不起，无法删除该目录'),
                                className: 'commonInfoModalError',
                                icon: (
                                    <ExclamationCircleFilled
                                        className={styles.delIcon}
                                    />
                                ),
                                content: __(
                                    '请先清空该目录下所有创建的数据记录，然后再尝试删除操作',
                                ),
                                okText: __('确定'),
                            })
                            return
                        }
                        if (
                            detailKey &&
                            detailKey === 'Standardization.Empty'
                        ) {
                            message.error(detailDesc)
                            return
                        }
                    }
                    formatError(error)
                } finally {
                    getTreeList()
                }
            },
            [data, findParents, getTreeList, setCurrentNode, topNode],
        )
        // 目录项所有操作menu
        const moreOptMenus = useCallback(
            (key: any) => {
                const optMenuItemsTemp = optMenuItems?.length
                    ? optMenuItems
                    : []

                const allOptsMenus = hasAddPermission
                    ? [
                          {
                              label: ' 新增子目录',
                              key: MoreOperate.ADD,
                          },
                          {
                              label: ' 重命名',
                              key: MoreOperate.RENAME,
                          },
                          {
                              label: ' 移动至',
                              key: MoreOperate.MOVETO,
                          },
                          {
                              label: (
                                  <Tooltip title="导出目录下所有记录">
                                      <span>导出</span>
                                  </Tooltip>
                              ),
                              key: MoreOperate.EXPORT,
                          },
                          {
                              label: (
                                  <Popconfirm
                                      title="你确定要删除吗？"
                                      icon={
                                          <ExclamationCircleFilled
                                              style={{ color: 'red' }}
                                          />
                                      }
                                      placement="topRight"
                                      // open={delConfirmOpen}
                                      // okButtonProps={{ loading: confirmLoading }}
                                      onConfirm={() => onDelete(key)}
                                      // onCancel={() => deleteConfirmCancel}
                                      showArrow
                                      getPopupContainer={(triggerNode) =>
                                          triggerNode.parentNode as HTMLElement
                                      }
                                      overlayClassName={styles.delPopConfirm}
                                      style={{ width: '172px', height: '87px' }}
                                  >
                                      <a
                                          onClick={(e) => {
                                              e.stopPropagation()
                                              e.preventDefault()
                                              // setDelConfirmOpen(true)
                                          }}
                                      >
                                          删除
                                      </a>
                                  </Popconfirm>
                              ),
                              key: MoreOperate.DELETE,
                          },
                      ]
                    : []

                const optsShowMenus = allOptsMenus.filter((item) => {
                    return optMenuItemsTemp.includes(item?.key)
                })
                return optsShowMenus
            },
            [optMenuItems, onDelete, hasAddPermission],
        )

        // more对应权限
        const moreOprList = useMemo(() => moreOptMenus(''), [moreOptMenus])

        const moreAccess = useMemo(
            () => moreOprList?.length > 0 && hasAddPermission,
            [moreOprList, hasAddPermission],
        )

        const handleClickMenu = useCallback((e: MenuInfo, item: IDirItem) => {
            // setDelConfirmOpen(false)
            switch (e.key) {
                // 新建子目录
                case MoreOperate.ADD:
                    onAdd(item)
                    break
                // 编辑/重命名
                case MoreOperate.RENAME:
                    setEditDirInfoItem(item)
                    onEdit(item)
                    break
                // 移动至
                case MoreOperate.MOVETO:
                    setOprItem(item)
                    setEditMoveToVisible(true)
                    break
                // 导出
                case MoreOperate.EXPORT:
                    exportDirAllDatEle(item.id)
                    break
                // 删除
                case MoreOperate.DELETE:
                    // setDelConfirmOpen(true)
                    break
                default:
                    break
            }
        }, [])

        useEffect(() => {
            setNodeOpt((prev) => ({
                ...prev,
                moreAccess,
                optMenuItems,
                moreOptMenus,
                handleClickMenu,
                selCatlgClass,
                dirType,
            }))
        }, [dirType, selCatlgClass, moreAccess, optMenuItems, handleClickMenu])

        // 目前只有数据元目录由导出功能，若其他模块需要添加，需要根据传入类型，请求不同接口
        const exportDirAllDatEle = async (catalog_id?: string) => {
            try {
                let res
                let fileName = ''
                // 数据元导出
                if (dirType === CatalogType.DATAELE) {
                    if (catalog_id) {
                        res = await exportDataEleBySearch({
                            catalog_id,
                        })
                    }
                    fileName = `数据元_${moment(new Date()).format(
                        'YYYYMMDDHHmmss',
                    )}.xlsx`
                } else if (dirType === CatalogType.CODETABLE) {
                    // 码表导出
                    if (catalog_id) {
                        res = await exportDict(catalog_id)
                    }
                    fileName = `码表_${moment(new Date()).format(
                        'YYYYMMDDHHmmss',
                    )}.xlsx`
                }
                if (fileName) {
                    if (typeof res === 'object' && res.byteLength) {
                        streamToFile(res, fileName)
                        message.success('导出成功')
                    } else {
                        message.error('导出失败')
                    }
                }
            } catch (error: any) {
                const enc = new TextDecoder('utf-8')
                const errData = JSON.parse(
                    enc.decode(new Uint8Array(error.data)),
                )
                error.data = errData
                formatError(error)
            }
        }

        // 新建/编辑目录，提交目录信息
        const onEditDirInfoSubmit = async () => {
            const { dirNewName } = form.getFieldsValue()
            let isSucss = false
            try {
                // setIsEnterSubmtting(true)
                let res
                if (isAdding) {
                    res = await addDir({
                        catalog_name: dirNewName,
                        parent_id: editDirInfoItem?.parent_id,
                    })
                    if (res.code === '0') {
                        isSucss = true
                        setIsAdding(false)
                        message.success('新建成功')
                        const node = {
                            ...editDirInfoItem,
                            id: editDirInfoItem?.id || '',
                            catalog_name: dirNewName,
                        }
                        // 设置添加节点
                        setAddOptNode(node ?? treeData?.[0])
                    }
                } else if (isEditing && editDirInfoItem?.id) {
                    // treeDataNew = oprTreeData(key, treeDataOld, { isEditing: false })
                    res = await updateDirById(editDirInfoItem?.id, {
                        catalog_name: dirNewName,
                        parent_id: editDirInfoItem?.parent_id,
                    })
                    if (res.code === '0') {
                        isSucss = true
                        setIsEditing(false)
                        message.success('编辑成功')
                        setSelectedDir({
                            ...selectedDir,
                            catalog_name: dirNewName,
                            parent_id: editDirInfoItem?.parent_id,
                        })
                    }
                }
                setEditDirInfoVisible(false)
                getTreeList()
            } catch (error: any) {
                isSucss = false
                // 400中特定key错误不重新获取目录，仍保持编辑/添加输入框状态
                if (error.status === 400) {
                    const detailKey = error.data.detail
                        ? error.data.detail[0].Key
                        : ''
                    const detailDesc = error.data.detail
                        ? error.data.detail[0].Message
                        : ''
                    if (detailKey) {
                        // 目录名称重复，则不重新获取，聚焦到输入框
                        if (detailKey === 'OperationConflict') {
                            // 设置message最大显示条数为1
                            message.config({
                                maxCount: 1,
                            })
                            message.error(detailDesc)
                            // 还原message设置
                            message.config({})
                            return
                        }
                        if (detailKey === 'Standardization.Empty') {
                            message.error(detailDesc)
                            return
                        }
                    } else {
                        message.error(
                            error.data.detail
                                ? error.data.detail[0].Message
                                : error.description,
                        )
                        return
                    }
                }
                formatError(error)
                // 不能放到finally里中执行，以上if中特定错误直接return不需要重新获取
                getTreeList()
            } finally {
                setTimeout(() => {
                    // 防止重复提交
                    // setIsEnterSubmtting(false)
                }, 2000)
            }
        }

        // 拖拽移动
        // const onDrop = async (info: any) => {
        //     // 推拽节点
        //     const dragKey = info.dragNode.key
        //     // const dragTitle = info.dragNode.title.props.children[0].props.title
        //     const dragTitle =
        //         // eslint-disable-next-line no-underscore-dangle
        //         info.dragNode.title.props.children[0].props.title.props
        //             .dangerouslySetInnerHTML.__html

        //     // 目标节点
        //     const dropKey = info.node.key

        //     // 展开目标目录
        //     const myExpandkeysTemp = Object.assign([], expandedKeys)
        //     if (dropKey !== '' && !myExpandkeysTemp.includes(dropKey)) {
        //         myExpandkeysTemp.push(dropKey)
        //         setExpandedKeys(myExpandkeysTemp)
        //     }

        //     try {
        //         await updateDirById(dragKey, {
        //             catalog_name: dragTitle,
        //             parent_id: dropKey,
        //         })
        //     } catch (error: any) {
        //         formatError(error)
        //     } finally {
        //         getTreeList()
        //     }
        // }

        const onAdd = (addedItem: IDirItem) => {
            if (addedItem && addedItem.id) {
                const allParents = findParents(treeData, addedItem.id)
                setDirLevelList(allParents)
                setIsAdding(true)
                setEditDirInfoVisible(true)
                setEditDirInfoItem({
                    id: '',
                    catalog_name: '',
                    parent_id: addedItem.id,
                })
            }
        }

        const onEdit = (editDirItem: IDirItem) => {
            if (editDirItem && editDirItem.id) {
                const allParents = findParents(treeData, editDirItem.id)
                setDirLevelList(allParents)
                setIsEditing(true)
                setEditDirInfoVisible(true)
                setEditDirInfoItem(editDirItem)
                form.setFieldValue('dirNewName', editDirItem.catalog_name)
            }
        }

        const onEditDirInfoCancel = () => {
            setEditDirInfoVisible(false)
            // setEditDirInfoItem(undefined)
            form.resetFields()
            if (isAdding) {
                setIsAdding(false)
            }
            if (isEditing) {
                setIsEditing(false)
            }
        }

        // const onSelectDir = (selectedKeysValue: string | any[], info: any) => {
        //     if (isAdding || isEditing) return
        //     if (selectedKeysValue && selectedKeysValue.length > 0) {
        //         const dir = findDirByKey(selectedKeysValue[0], treeData)
        //         if (dir) {
        //             setSelectedDir(dir)
        //         }
        //     }
        // }

        const onEditClose = () => {
            setEditMoveToVisible(false)
        }

        const handleExpand = (keys: any, info: any) => {
            setExpandedKeys(keys)
        }

        const selectedCatlgClassOptions = useMemo(() => {
            const optionsData = catlgClassOptions
                .filter(
                    (item) =>
                        item.value !== CatalogOption.STDFILECATLG ||
                        dirType !== CatalogType.FILE,
                )
                .map((item) =>
                    item.value === CatalogOption.AUTOCATLG &&
                    dirType === CatalogType.FILE
                        ? {
                              ...item,
                              label: __('目录'),
                          }
                        : item,
                )
            return optionsData
        }, [dirType])

        return (
            <div className={styles.stdTreeWrapper}>
                {isShowTitle &&
                    (showCatlgClassify ? (
                        <div className={styles.dirtreeCatlgClass}>
                            {/* <Radio.Group
                                options={catlgClassOptions}
                                onChange={(e: any) => {
                                    const { value } = e.target
                                    setSelCatlgClass(value)
                                    // 清空展开节点数据
                                    setExpandedKeys([])
                                    setLoadedKeys([])
                                }}
                                value={selCatlgClass}
                                optionType="button"
                            /> */}
                            {viewModeOpen ? (
                                <CaretUpOutlined
                                    style={{ fontSize: 14, color: '#333' }}
                                    onClick={() => {
                                        setViewModeOpen(!viewModeOpen)
                                    }}
                                />
                            ) : (
                                <CaretDownOutlined
                                    style={{ fontSize: 14, color: '#333' }}
                                    onClick={() => {
                                        setViewModeOpen(!viewModeOpen)
                                    }}
                                />
                            )}
                            <Select
                                bordered={false}
                                open={viewModeOpen}
                                onDropdownVisibleChange={(o) => {
                                    setViewModeOpen(o)
                                }}
                                options={selectedCatlgClassOptions}
                                dropdownMatchSelectWidth={100}
                                value={selCatlgClass}
                                onChange={(option: CatalogOption) => {
                                    setSelCatlgClass(option)
                                    // 清空展开节点数据
                                    setExpandedKeys([])
                                    setLoadedKeys([])
                                }}
                                className={styles.viewSelect}
                                showArrow={false}
                                getPopupContainer={(n) => n}
                            />
                        </div>
                    ) : (
                        <div className={styles.dirtreeName}>{__('目录')}</div>
                    ))}
                {/* <div className={styles.dirtreeName}>{__('目录')}</div> */}
                {selCatlgClass === CatalogOption.DEPARTMENT ? (
                    <ArchitectureDirTree
                        ref={architectureDirTreeRef}
                        getSelectedNode={(node) => {
                            if (node) {
                                handleSelect([CatalogOption.DEPARTMENT], {
                                    node: {
                                        ...node,
                                        id: node.id || treeData?.[0]?.id || '',
                                    },
                                })
                            } else {
                                handleSelect([CatalogOption.DEPARTMENT], {
                                    node: { id: treeData?.[0]?.id || '' },
                                })
                            }
                        }}
                        hiddenType={[
                            Architecture.BMATTERS,
                            Architecture.BSYSTEM,
                            Architecture.COREBUSINESS,
                        ]}
                        filterType={[
                            Architecture.ORGANIZATION,
                            Architecture.DEPARTMENT,
                        ].join(',')}
                        placeholder={__('搜索组织架构')}
                        // isShowCurDept={isShowCurDept}
                        // needUncategorized={
                        //     treePropsConfig?.[TreeType.Department]?.needUncategorized
                        // }
                    />
                ) : (
                    <DirTree
                        conf={{
                            placeholder: __('搜索目录'),
                            dirType,
                            catlgClassOption: selCatlgClass,
                            isSearchEmpty:
                                searchResult !== undefined &&
                                !searchResult?.length,
                            showSearch: isShowSearch,
                            searchRender: toRenderSearch,
                            onSearchChange: handleSearch,
                            isCheckTop: currentNode?.id === topNode?.id,
                            onTopTitleClick: handleTopAll,
                            showTopTitle: isShowAll,
                            onAdd:
                                canOpt && hasAddPermission
                                    ? onClickAdd
                                    : undefined,
                            // topTitle: topNode?.catalog_name,
                            topTitle: (
                                <>
                                    {topNode?.catalog_name || __('全部目录')}
                                    {`${
                                        isNumber(treeData?.[0]?.count)
                                            ? ` (${treeData[0].count})`
                                            : ''
                                    }`}
                                </>
                            ),
                            isSearchLoading: isSearching,
                            isTreeLoading: loading,
                            allCatlgCount: treeData?.[0]?.count,
                        }}
                        // defaultExpandedKeys={
                        //     data?.[0]?.id ? [data?.[0]?.id] : []
                        // }
                        treeData={data as any}
                        // loadedKeys={loadedKeys}
                        // loadData={
                        //     selCatlgClass === CatalogOption.STDFILECATLG
                        //         ? onLoadData
                        //         : undefined
                        // }
                        // draggable={!isAdding && !isEditing} // draggable &&
                        // onDrop={onDrop}
                        onExpand={handleExpand}
                        // expandedKeys={
                        //     selCatlgClass === CatalogOption.AUTOCATLG
                        //         ? expandedKeys
                        //         : undefined
                        // }
                        expandedKeys={expandedKeys}
                        fieldNames={{ key: 'id', title: 'catalog_name' }}
                        titleRender={titleRender}
                        onSelect={handleSelect}
                        selectedKeys={
                            currentNode?.id === topNode?.id || !currentNode
                                ? []
                                : [currentNode?.id]
                        }
                    />
                )}

                {oprItem && (
                    <EditDirModal
                        title="移动至目录"
                        visible={editMoveToVisible}
                        onClose={onEditClose}
                        dirType={dirType}
                        oprType={OperateType.MOVETO}
                        oprItem={oprItem}
                        setOprItem={setOprItem}
                        afterOprReload={getTreeList}
                    />
                )}
                <Modal
                    open={editDirInfoVisible && !!editDirInfoItem}
                    width={640}
                    title={isAdding ? __('新建目录') : __('编辑目录')}
                    onCancel={onEditDirInfoCancel}
                    bodyStyle={{ padding: '16px 24px 32px' }}
                    getContainer={false}
                    onOk={() => {
                        const dirNewName = form.getFieldValue('dirNewName')
                        form.setFieldValue('dirNewName', dirNewName.trim())

                        form.validateFields().then((values) => {
                            // 检验成功
                            onEditDirInfoSubmit()
                        })
                    }}
                    destroyOnClose
                    maskClosable={false}
                >
                    {/* 目录层级 */}
                    {dirLevelList && dirLevelList.length > 0 && (
                        <div className="levelInfo">
                            <span className="dirLevel">
                                {dirLevelList[0].catalog_name}
                            </span>
                            {dirLevelList.length >= 2 && (
                                <span className="dirLevel">
                                    /{dirLevelList[1]?.catalog_name}
                                </span>
                            )}
                            {dirLevelList.length >= 3 && (
                                <span className="dirLevel">
                                    {dirLevelList.length > 3 ? '...' : ''}/
                                    {
                                        dirLevelList[dirLevelList.length - 1]
                                            .catalog_name
                                    }
                                </span>
                            )}
                        </div>
                    )}
                    <div className={styles.editDirInfoContent}>
                        <Form
                            form={form} // 挂载form
                            name="userForm"
                            layout="vertical"
                            autoComplete="off"
                        >
                            <Form.Item
                                label="目录名称"
                                name="dirNewName"
                                required
                                validateTrigger={['onBlur']}
                                rules={[
                                    {
                                        validator:
                                            validateEmpty('请输入目录名称'),
                                    },
                                    {
                                        validator: validateDirName(
                                            ErrorInfo.EXTENDCNNAME,
                                        ),
                                    },
                                ]}
                            >
                                <Input
                                    placeholder={__('请输入目录名称')}
                                    maxLength={20}
                                />
                            </Form.Item>
                        </Form>
                    </div>
                </Modal>
            </div>
        )
    },
)

export const StandardDirTreeContainer = forwardRef(
    (props: Partial<IStandardDirTree>, ref) => {
        return (
            <DirTreeProvider>
                <StandardDirTree {...props} ref={ref} />
            </DirTreeProvider>
        )
    },
)

export default memo(StandardDirTreeContainer)
