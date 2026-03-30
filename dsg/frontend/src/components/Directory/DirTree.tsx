import { EllipsisOutlined, ExclamationCircleFilled } from '@ant-design/icons'
import {
    Dropdown,
    Form,
    Input,
    InputRef,
    message,
    Modal,
    Popconfirm,
    Tooltip,
    Tree,
} from 'antd'
import moment from 'moment'
import { MenuInfo } from 'rc-menu/lib/interface'
import React, {
    forwardRef,
    Key,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from 'react'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import {
    addDir,
    CatalogType,
    delDirById,
    exportDataEleBySearch,
    exportDict,
    formatError,
    IDirItem,
    IDirQueryType,
    updateDirById,
} from '@/core'
import { AddOutlined, PullDownOutlined } from '@/icons'
import Empty from '@/ui/Empty'
import {
    commReg,
    ErrorInfo,
    OperateType,
    streamToFile,
    validateEmpty,
} from '@/utils'
import { highLight, MoreOperate } from './const'
import EditDirModal from './EditDirModal'
import __ from './locale'
import styles from './styles.module.less'

const { TreeNode } = Tree
const tempKey = '1000'

/**
 * @params  dirType 目录类型
 * @params  optMenuItems 悬浮目录项显示...点击更多的菜单，不传/传空数组则不显示操作图标
 */
interface IDirTree {
    ref?: any
    dirType: CatalogType
    checkable: boolean
    treeData: IDirItem[]
    draggable: boolean
    searchKey: string
    optMenuItems?: Array<MoreOperate>
    setTreeData: (data: IDirItem[]) => void
    getTreeList: (query?: IDirQueryType) => void
    selectedDir: IDirItem
    setSelectedDir: (item: IDirItem) => void
}

const DirTree: React.FC<IDirTree> = forwardRef((props: any, ref) => {
    const { checkPermission } = useUserPermCtx()

    const {
        dirType,
        checkable,
        treeData,
        draggable,
        searchKey,
        optMenuItems,
        setTreeData,
        getTreeList,
        selectedDir,
        setSelectedDir,
    } = props

    useImperativeHandle(ref, () => ({
        addNewDir: (addedDir: IDirItem) => onAdd(addedDir),
    }))

    // 删除对话框的打开/关闭
    const [delConfirmOpen, setDelConfirmOpen] = useState(false)

    // 移动至选中目录
    const [oprItem, setOprItem] = useState<IDirItem>()

    // 目录treedata
    const [dirTreeData, setDirTreeData] = useState(treeData)

    // 根目录节点
    const [rootId, setRootId] = useState<string>(
        treeData && treeData.length > 0 ? treeData[0].id.toString() : '',
    )

    // 展开节点
    const [expandedKeys, setExpandedKeys] = useState<Key[]>([])

    // 保存搜索前展开节点，搜索结束后目录还原为搜索之前状态
    const [expandedKeysBeforeSearch, setExpandedKeysBeforeSearch] = useState<
        React.Key[]
    >([])

    // 目录节点添加状态
    const [isAdding, setIsAdding] = useState(false)

    // 目录节点编辑状态
    const [isEditing, setIsEditing] = useState(false)

    // 添加/编辑目录
    const [editDirInfoVisible, setEditDirInfoVisible] = useState(false)

    // 添加/编辑目录loading状态
    const [editDirInfoLoading, setEditDirInfoLoading] = useState(false)

    // 添加/编辑目录项
    const [editDirInfoItem, setEditDirInfoItem] = useState<IDirItem>()

    // 添加/编辑目录，编辑节点及其所有祖先节点
    const [dirLevelList, setDirLevelList] = useState<IDirItem[]>()

    // 添加/编辑目录
    const [form] = Form.useForm()

    const initValues = {
        // tagName: currentTagValue ? currentTagValue.tagName : '',
    }
    form.setFieldsValue(initValues)

    useEffect(() => {
        const rootIdTemp =
            treeData && treeData.length > 0 ? treeData[0].id.toString() : ''
        setRootId(rootIdTemp)

        let allExpdKeys: any = Object.assign([], expandedKeys)

        // 展示搜索所有节点
        if (searchKey && searchKey !== '') {
            if (
                expandedKeysBeforeSearch &&
                expandedKeysBeforeSearch.length === 0
            ) {
                // expandedKeysBeforeSearch.push(...expandedKeys)
                setExpandedKeysBeforeSearch([...expandedKeys])
            }
            if (treeData) {
                // 找出搜索出來的所有节点id
                allExpdKeys = traverseTree(treeData[0], 'id') || []
            }
            expandedKeysBeforeSearch.forEach((epKey) => {
                if (!allExpdKeys.includes(epKey)) {
                    allExpdKeys.push(epKey)
                }
            })
            setExpandedKeys(allExpdKeys)
        } else if (expandedKeysBeforeSearch.length) {
            allExpdKeys = Object.assign([], expandedKeysBeforeSearch)
            // 还原为之前展开节点，此处功能设置了expandedKeys但展开无效，仍需修改
            setExpandedKeys(expandedKeysBeforeSearch)
            // 清空数组
            // expandedKeysBeforeSearch.length = 0
            setExpandedKeysBeforeSearch([])
        }

        if (treeData && treeData.length) {
            if (!selectedDir || selectedDir.id === '') {
                setSelectedDir(treeData[0])
            } else {
                const prevSeledDir = findDirByKey(selectedDir.id, treeData)
                if (!prevSeledDir) {
                    setSelectedDir(treeData[0])
                } else {
                    const myExpandkeys = Object.assign([], allExpdKeys)
                    if (!myExpandkeys.includes(prevSeledDir.parent_id)) {
                        myExpandkeys.push(prevSeledDir.parent_id)
                    }

                    setExpandedKeys(myExpandkeys)
                }
            }
        }
        setDirTreeData(treeData)

        setIsAdding(false)
        setIsEditing(false)
        setAutoExpandParent(true)
    }, [treeData])

    useEffect(() => {
        // 目录或数据（数据元/码表等）移动至选择XX目录后，目录展开到选中目录
        const expandedKeysTemp = Object.assign([], expandedKeys)
        if (
            selectedDir &&
            selectedDir.id &&
            !expandedKeysTemp.includes(selectedDir.id)
        ) {
            expandedKeysTemp.push(selectedDir.id)
            setAutoExpandParent(true)
            setExpandedKeys(expandedKeysTemp)
        }
    }, [selectedDir])

    useEffect(() => {
        if (!editDirInfoVisible) {
            // 清空编辑目录信息框
            setEditDirInfoItem(undefined)
            form.resetFields()
        }
    }, [editDirInfoVisible])

    // 新增/编辑操作的目录id
    const [operatingKey, setOperatingKey] = useState('')

    // 目录项所有操作menu
    const moreOptMenus = (key: any) => {
        const optMenuItemsTemp =
            optMenuItems && optMenuItems.length ? optMenuItems : []

        const allOptsMenus = checkPermission('manageDataStandard')
            ? [
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
                              onConfirm={() => deleteConfirmOK(key)}
                              onCancel={() => deleteConfirmCancel}
                              showArrow
                              getPopupContainer={(triggerNode) =>
                                  triggerNode.parentNode as HTMLElement
                              }
                              overlayClassName="delPopConfirm"
                              style={{ width: '172px', height: '87px' }}
                          >
                              {/* <a onClick={() => setDelConfirmOpen(true)}>删除</a> */}
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
    }

    // more对应权限
    const moreOprList = moreOptMenus('')

    const moreAccess = moreOprList?.length > 0

    const handleClickMenu = async (e: MenuInfo, item: IDirItem) => {
        setDelConfirmOpen(false)
        switch (e.key) {
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
                setDelConfirmOpen(true)
                break
            default:
                break
        }
    }

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
            const errData = JSON.parse(enc.decode(new Uint8Array(error.data)))
            error.data = errData
            formatError(error)
        }
    }

    // 确认删除目录
    const deleteConfirmOK = (itemKey: string) => {
        onDelete(itemKey)
    }

    const deleteConfirmCancel = () => {
        setDelConfirmOpen(false)
    }
    const inputRef = useRef<InputRef>(null)

    // 拖拽移动
    const onDrop = async (info: any) => {
        // 推拽节点
        const dragKey = info.dragNode.key
        // const dragTitle = info.dragNode.title.props.children[0].props.title
        const dragTitle =
            // eslint-disable-next-line no-underscore-dangle
            info.dragNode.title.props.children[0].props.title.props
                .dangerouslySetInnerHTML.__html

        // 目标节点
        const dropKey = info.node.key

        // 展开目标目录
        const myExpandkeysTemp = Object.assign([], expandedKeys)
        if (dropKey !== '' && !myExpandkeysTemp.includes(dropKey)) {
            myExpandkeysTemp.push(dropKey)
            setExpandedKeys(myExpandkeysTemp)
        }

        try {
            await updateDirById(dragKey, {
                catalog_name: dragTitle,
                parent_id: dropKey,
            })
        } catch (error: any) {
            formatError(error)
        } finally {
            getTreeList()
        }
    }

    // 添加节点
    // const onAdd = (key: string) => {
    //     // 正在添加/编辑，此时不允许添加，即一次只能允许一个操作
    //     if (isAdding || isEditing) {
    //         if (inputRef && inputRef.current) {
    //             inputRef?.current?.focus({
    //                 cursor: 'end',
    //             })
    //         }
    //         return
    //     }
    //     // 添加与编辑无关，若编辑之后点击添加，设置isAdding为true，待编辑请求并获取tereData成功，isAdding为true则继续完成添加操作
    //     // if (isAdding) {
    //     //     if (inputRef && inputRef.current) {
    //     //         inputRef?.current?.focus({
    //     //             cursor: 'end',
    //     //         })
    //     //     }
    //     //     return
    //     // }
    //     setIsAdding(true)
    //     setOperatingKey(key)

    //     // 展开新添加目录的父节点
    //     const myExpandkeysTemp = Object.assign([], expandedKeys)
    //     if (key !== '' && myExpandkeysTemp.indexOf(key) === -1) {
    //         myExpandkeysTemp.push(key)
    //         setExpandedKeys(myExpandkeysTemp)
    //     }

    //     const treeDataOld = JSON.parse(JSON.stringify(treeData))
    //     const treeDataNew = addNode(key, treeDataOld)
    //     setDirTreeData(treeDataNew)

    //     tempKey += 1
    // }

    // function addNode(addKey: string, data: any[]) {
    //     data.forEach((item) => {
    //         if (item.id.toString() === addKey) {
    //             if (item.children) {
    //                 Object.assign(
    //                     item.children,
    //                     item.children.unshift({
    //                         catalog_name: `新目录`,
    //                         id: `${tempKey}`,
    //                         parent_id: addKey,
    //                         isEditing: true,
    //                     }),
    //                 )
    //             } else {
    //                 Object.assign(item, {
    //                     children: [
    //                         {
    //                             catalog_name: `新目录`,
    //                             id: `${tempKey}`,
    //                             parent_id: addKey,
    //                             isEditing: true,
    //                         },
    //                     ],
    //                 })
    //             }
    //         } else if (item.children) {
    //             addNode(addKey, item.children)
    //         }
    //     })
    //     return data
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

    // 编辑（重命名）节点
    // const onEdit = async (editKey: string) => {
    //     // 正在添加/编辑，此时不允许添加，即一次只能允许一个操作
    //     if (isAdding || isEditing) {
    //         if (inputRef && inputRef.current) {
    //             inputRef?.current?.focus({
    //                 cursor: 'end',
    //             })
    //         }
    //         return
    //     }
    //     setIsEditing(true)
    //     setOperatingKey(editKey)

    //     const treeDataOld = JSON.parse(JSON.stringify(treeData))
    //     const treeDataNew = editNode(editKey, treeDataOld)
    //     setDirTreeData(treeDataNew)
    // }

    // function editNode(key: string, data: any) {
    //     data.forEach((item: { id: string; children: any }) => {
    //         if (item.id === key) {
    //             Object.assign(item, { isEditing: true })
    //         } else {
    //             Object.assign(item, { isEditing: false })
    //         }
    //         if (item.children) {
    //             editNode(key, item.children)
    //         }
    //     })
    //     return data
    // }

    // 删除节点
    const onDelete = async (key: string) => {
        try {
            await delDirById(key)
        } catch (error: any) {
            if (error.status === 400) {
                const detailKey = error.data.detail
                    ? error.data.detail[0].Key
                    : ''
                const detailDesc = error.data.detail
                    ? error.data.detail[0].Message
                    : ''
                if (
                    detailKey &&
                    detailKey === 'Standardization.ResourceError.DataExist'
                ) {
                    // 新建或编辑
                    error({
                        title: '对不起,无法删除该目录',
                        icon: <ExclamationCircleFilled className="delIcon" />,
                        content:
                            '请先清空该目录下所有创建的数据记录,然后再尝试删除操作。',
                        okText: '我知道了',
                    })
                } else if (detailKey && detailKey === 'Standardization.Empty') {
                    message.error(detailDesc)
                }

                return
            }
            formatError(error)
        } finally {
            getTreeList()
        }
    }

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

    // 通过key获取目录
    const findDirByKey = (key: string, data: []): IDirItem | undefined => {
        let dir
        data.forEach((item: any) => {
            if (item.id === key) {
                dir = item
            } else if (item.children) {
                const res = findDirByKey(key, item.children)
                if (res) {
                    dir = res
                }
            }
        })
        return dir
    }

    // 防止重复提交
    const [isEnterSubmtting, setIsEnterSubmtting] = useState<boolean>(false)
    // let isEnterSubmtting = false

    // 新建/编辑目录，提交目录信息
    const onEditDirInfoSubmit = async () => {
        // if (isEnterSubmtting) return
        // const value = editDirInfoItem?.catalog_name || ''
        // // 检验目录名称是否合法
        // const isValid = validateDirName(value)
        // if (!isValid) {
        //     return
        // }
        const { dirNewName } = form.getFieldsValue()
        let isSucss = false
        try {
            setIsEnterSubmtting(true)
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
                }
            }
            setEditDirInfoVisible(false)
            // 提交成功刷新目录
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
                    if (detailKey === 'Standardization.OperationConflict') {
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
                }
            } else {
                formatError(error)
            }
            // 不能放到finally里中执行，以上if中特定错误直接return不需要重新获取
            getTreeList()
        } finally {
            setTimeout(() => {
                // 防止重复提交
                setIsEnterSubmtting(false)
            }, 2000)
        }
    }

    // 检验目录名称
    const validateDirName = (msg: string) => {
        return (_: any, value: string) => {
            return new Promise((resolve, reject) => {
                const newValue =
                    typeof value === 'string' ? value.trim() : value
                if (newValue && !commReg.test(newValue)) {
                    reject(new Error(msg))
                }
                resolve(1)
            })
        }
    }

    const renderNodeTitle = (item: any) => {
        const node = (
            <div
                className="treeNodeCon"
                style={{ display: 'flex', alignItems: 'center' }}
            >
                <Tooltip
                    title={
                        <div
                            dangerouslySetInnerHTML={{
                                __html: highLight(
                                    item.catalog_name,
                                    searchKey,
                                    'toolTipHighLight',
                                ),
                            }}
                        />
                    }
                >
                    <span
                        className="treeNodeConTitle"
                        // eslint-disable-next-line react/no-danger
                        dangerouslySetInnerHTML={{
                            __html: highLight(item.catalog_name, searchKey),
                        }}
                    />
                </Tooltip>
                {optMenuItems && optMenuItems.length > 0 && (
                    <span className="moreOperate">
                        {treeData && item.id === treeData[0]?.id ? (
                            // eslint-disable-next-line react/jsx-no-useless-fragment
                            <></>
                        ) : (
                            moreAccess && (
                                <Dropdown
                                    // getPopupContainer={(triggerNode) =>
                                    //     triggerNode.parentNode as HTMLElement
                                    // }
                                    menu={{
                                        items: moreOptMenus(item.id),
                                        onClick: (e) =>
                                            handleClickMenu(e, item),
                                    }}
                                    trigger={[
                                        !isAdding && !isEditing
                                            ? 'click'
                                            : 'contextMenu',
                                    ]}
                                >
                                    <EllipsisOutlined
                                        className="moreIcon"
                                        onClick={(e) => e.preventDefault()}
                                    />
                                </Dropdown>
                            )
                        )}
                        {checkPermission('manageDataStandard') && (
                            <AddOutlined
                                className="addIcon"
                                onClick={() => onAdd(item)}
                            />
                        )}
                    </span>
                )}
            </div>
        )
        return node
    }

    const renderTreeNodes = (data: []) => {
        return data.map((item: any) => {
            const node = renderNodeTitle(item)
            const className = `treeNode ${item?.level === 1 ? 'allNode' : ''}`
            if (item.children) {
                return (
                    <TreeNode title={node} key={item.id} className={className}>
                        {renderTreeNodes(item.children)}
                    </TreeNode>
                )
            }
            return <TreeNode title={node} key={item.id} className={className} />
        })
    }

    // 找出所有父节点
    const findParents = (allData: IDirItem[], key: string): IDirItem[] => {
        const allParents: IDirItem[] = []
        if (allData.length === 0) {
            return []
        }

        const findele = (data: any, id: string) => {
            if (!id) return
            data.forEach((item: any) => {
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

    const [autoExpandParent, setAutoExpandParent] = useState(true)
    const onExpand = (expandedKeysValue: Key[]) => {
        // if not set autoExpandParent to false, if children expanded, parent can not collapse.
        // or, you can remove all expanded children keys.
        setExpandedKeys(expandedKeysValue)
        setAutoExpandParent(false)
    }

    // 深度优先遍历,找出treeDataList中所有节点key属性
    const traverseTree = (treeDataList: any, key: string) => {
        const child =
            treeDataList && treeDataList?.children ? treeDataList.children : []
        let arr: any[] = []
        if (treeDataList && treeDataList[key]) {
            arr.push(treeDataList[key])
        }
        if (child) {
            child.forEach((newTreeDataList: any) => {
                arr = Object.assign(
                    [],
                    arr.concat(traverseTree(newTreeDataList, key)),
                )
            })
        }
        return arr
    }

    // 空白显示
    const showEmpty = () => {
        return <Empty />
    }

    const onSelectDir = (selectedKeysValue: string | any[], info: any) => {
        if (isAdding || isEditing) return
        if (selectedKeysValue && selectedKeysValue.length > 0) {
            const dir = findDirByKey(selectedKeysValue[0], treeData)
            if (dir) {
                setSelectedDir(dir)
            }
        }
    }

    const [editMoveToVisible, setEditMoveToVisible] = useState(false)

    const onEditClose = () => {
        setEditMoveToVisible(false)
    }

    return (
        <div>
            {selectedDir && selectedDir.id && (
                <Tree
                    // treeData={treeData}
                    className={styles.draggableTree}
                    checkable={checkable}
                    autoExpandParent={autoExpandParent}
                    onExpand={onExpand}
                    defaultSelectedKeys={[selectedDir.id]}
                    expandedKeys={expandedKeys}
                    selectedKeys={[selectedDir.id]}
                    draggable={draggable && !isAdding && !isEditing}
                    onDrop={onDrop}
                    onSelect={onSelectDir}
                    switcherIcon={<PullDownOutlined />}
                >
                    {dirTreeData?.length > 0 && renderTreeNodes(dirTreeData)}
                </Tree>
            )}
            <div
                className="showEmpty"
                hidden={!dirTreeData || dirTreeData?.length !== 0}
            >
                {showEmpty()}
            </div>
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
                style={
                    {
                        // height: '268px',
                    }
                }
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
                // okButtonProps={{
                //     disabled:
                //         form.getFieldValue('dirNewName') ===
                //         editDirInfoItem?.catalog_name,
                // }}
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
                <div className="editDirInfoContent">
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
                                    validator: validateEmpty('请输入目录名称'),
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
})

export default DirTree
