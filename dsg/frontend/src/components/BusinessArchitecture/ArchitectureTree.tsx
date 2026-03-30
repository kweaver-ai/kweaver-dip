import React, {
    forwardRef,
    ReactNode,
    useEffect,
    useImperativeHandle,
    useState,
} from 'react'
import { RightOutlined } from '@ant-design/icons'
import classnames from 'classnames'
import { Dropdown, MenuProps } from 'antd'
import { useUnmount } from 'ahooks'
import { useDispatch } from 'react-redux'
import { cloneDeep } from 'lodash'
import { AddOutlined } from '@/icons'
import styles from './styles.module.less'
import Icons from './Icons'
import {
    allNodeInfo,
    Architecture,
    DataNode,
    FilterTreeNode,
    hiddenNodeType,
    nodeInfo,
} from './const'
import { OperateType } from '@/utils'
import { formatError, getDepartmentForms, getObjects, IGetObject } from '@/core'
import actionType from '@/redux/actionType'

const updateTreeData = (
    list: DataNode[],
    id: string,
    children: DataNode[],
    hiddenNodeTypeList: Architecture[],
): DataNode[] =>
    list.map((node) => {
        if (node.id === id) {
            return {
                ...node,
                isExpand: true,
                expand:
                    children.filter(
                        (item) =>
                            !hiddenNodeTypeList.includes(
                                item.type as Architecture,
                            ),
                    ).length > 0,
                children,
            }
        }
        if (node.children) {
            return {
                ...node,
                children: updateTreeData(
                    node.children,
                    id,
                    children,
                    hiddenNodeTypeList,
                ),
            }
        }
        return { ...node }
    })

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

const getContainerNode = (
    entries: DataNode[],
    parentId: string,
    all: DataNode[],
    nodeType: Architecture,
    containerType: Architecture,
) => {
    return [
        ...entries.filter((item) => item.type !== nodeType),
        // 生成容器
        {
            id:
                containerType === Architecture.BSYSTEMCONTAINER
                    ? `${parentId}_SC`
                    : `${parentId}_MC`,
            name: nodeInfo[containerType].name,
            path: all[0].path, // 此处只为算层级使用
            type: containerType,
            expand: false,
            children: all.map((system) => ({
                ...system,
                path: `${system.path}/`, // 此处只为算层级使用
            })),
        },
    ]
}

// 处理容器节点： 屏蔽容器功能
const dealContainerNode = (data: DataNode[], parentId: string) => {
    if (data.length > 1) {
        const allSystems = data.filter(
            (node) => node.type === Architecture.BSYSTEM,
        )
        const allMatters = data.filter(
            (node) => node.type === Architecture.BMATTERS,
        )
        // 生成信息系统容器
        if (allSystems.length > 1) {
            // eslint-disable-next-line no-param-reassign
            data = getContainerNode(
                data,
                parentId,
                allSystems,
                Architecture.BSYSTEM,
                Architecture.BSYSTEMCONTAINER,
            )
        }
        // 生成业务事项容器
        if (allMatters.length > 1) {
            // eslint-disable-next-line no-param-reassign
            data = getContainerNode(
                data,
                parentId,
                allMatters,
                Architecture.BMATTERS,
                Architecture.BMATTERSCONTAINER,
            )
        }
    }
    return data
}

/**
 * ref: 提供删除与重命名操作
 * isShowAll 是否展示全部节点
 * isShowOperate 是否展示操作按钮
 * hiddenNodeTypeList 要隐藏的节点类型数组
 * initNodeType: 初始节点类型
 * initNodeId: 初始节点Id
 * isShowXScroll: 是否展示水平滚动条（在没有拖拽时使用）
 * titleRender 自定义渲染节点
 * getSelectedNode 向组件外提供获取选中的树节点
 */
interface ICustomTree {
    ref?: any
    isShowAll?: boolean
    isShowOperate?: boolean
    hiddenNodeTypeList?: Architecture[]
    initNodeType?: string
    initNodeId?: string
    isShowXScroll?: boolean
    isUseCache?: boolean
    cacheData?: {
        treeData: DataNode[]
        selectedNode?: DataNode
    }
    titleRender?: (nodeData: DataNode) => ReactNode
    getSelectedNode: (sn: DataNode, delNode?: DataNode) => void
    initExpandType?: string
    isShowForms?: boolean
    mid?: string
}
const CustomTree: React.FC<ICustomTree> = forwardRef((props: any, ref) => {
    const {
        getSelectedNode,
        titleRender,
        isShowAll = true,
        isShowOperate = true,
        hiddenNodeTypeList = hiddenNodeType,
        initNodeType = [
            Architecture.ORGANIZATION,
            Architecture.DEPARTMENT,
        ].join(','),
        initNodeId,
        isShowXScroll = false,
        isUseCache = false,
        cacheData = { treeData: [], selectedNode: allNodeInfo },
        initExpandType = Architecture.DEPARTMENT,
        isShowForms = false,
        mid,
    } = props
    // 获取

    const dispatch = useDispatch()
    const [treeData, setTreeData] = useState<DataNode[]>([])
    // 鼠标移入项的id 用来展示的操作区
    const [operateId, setOperateId] = useState('')
    // 鼠标点击选中项的id，用来设置选中背景
    const [selectedNode, setSelectedNode] = useState<DataNode>(allNodeInfo)
    // 创建的节点类型
    const [createNodeType, setCreateNodeType] = useState<Architecture>(
        Architecture.BSYSTEM,
    )
    // 操作行的节点信息 创建时为创建节点的父级 重命名时为重命名的节点
    const [currentNode, setCurrentNode] = useState<DataNode>()
    const [createVisible, setCreateVisible] = useState(false)
    const [moveVisible, setMoveVisible] = useState(false)

    const [operateType, setOperateType] = useState<OperateType>(
        OperateType.CREATE,
    )
    const [treeFilter, setTreeFilter] = useState<FilterTreeNode>(
        FilterTreeNode.ALL,
    )
    // 第一层节点的缩进层级 （相当于0）
    const [firstLevel, setFirstLevel] = useState(1)

    // 若展示全部则向外输出初始的选中项为全部
    useEffect(() => {
        if (isShowAll && !isUseCache) {
            getSelectedNode({
                ...allNodeInfo,
            })
        }
    }, [])

    useUnmount(() => {
        // 组件卸载时缓存数据
        if (isUseCache) {
            dispatch({
                type: actionType.GET_BUSARCHITECTURE_DATA,
                payload: {
                    treeData,
                    selectedNode,
                },
            })
        }
    })

    useImperativeHandle(ref, () => ({
        handleOperate,
        treeData,
        renameCallback,
        setSelectedNode,
    }))

    const getNodeObjects = async (
        params: IGetObject,
        path?: string,
        isFirst = false,
    ) => {
        try {
            const res = await getObjects({
                ...params,
            })
            let ids: string[] = []
            let forms: any
            if (isShowForms) {
                ids = res.entries.map((obj) => obj.id)
                if (ids.length > 0) {
                    forms = await getDepartmentForms(ids, mid)
                }
            }

            if (isFirst) {
                if (initNodeId) {
                    const filterArr = res.entries.filter(
                        (node) => node.id === initNodeId,
                    )
                    setTreeData(filterArr)
                    setFirstLevel(filterArr[0].path.split('/').length)
                    getSelectedNode(filterArr[0])
                    setSelectedNode(filterArr[0])
                    return
                }
                if (isShowForms) {
                    setTreeData(
                        res.entries.map((node) => ({
                            ...node,
                            expand: forms[node.id]?.length > 0 || node.expand,
                        })),
                    )
                } else {
                    setTreeData(res.entries)
                }
                setFirstLevel(1)

                // 不展示全部时，默认选中项为第一个节点
                if (!isShowAll) {
                    getSelectedNode(res.entries?.[0])
                    setSelectedNode(res.entries?.[0])
                }
            } else {
                // 若查询到多个信息系统或业务事项时，自动增加父级容器节点
                // res.entries = dealContainerNode(res.entries, params.id)

                // 获取部门下的业务表
                const subForms = await getDepartmentForms(
                    [params.id || ''],
                    mid,
                )
                setTreeData((origin) =>
                    updateTreeData(
                        origin,
                        params.id || '',
                        isShowForms
                            ? [
                                  ...res.entries.map((node) => ({
                                      ...node,
                                      expand:
                                          forms[node.id]?.length > 0 ||
                                          node.expand,
                                  })),
                                  ...(subForms[params.id || ''] || []).map(
                                      (item) => ({
                                          ...item,
                                          path: `${path}/${item.name}`,
                                          type: Architecture.BFORM,
                                      }),
                                  ),
                              ]
                            : res.entries,
                        hiddenNodeTypeList,
                    ),
                )
            }
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        // 若使用缓存的数据，则第一次不需要调接口获取数据
        if (isUseCache && cacheData.treeData.length > 0) {
            setTreeData(cacheData.treeData)
            setSelectedNode(cacheData.selectedNode)
            // getSelectedNode(cacheData.selectedNode || allNodeInfo)
        } else {
            getNodeObjects(
                {
                    limit: 0,
                    id: '',
                    is_all: false,
                    type: initNodeType,
                },
                '',
                true,
            )
        }
    }, [initNodeType])

    const onLoadData = ({ id, children, path_id }: DataNode) => {
        if (children) return
        getNodeObjects(
            {
                id,
                is_all: false,
                limit: 0,
                type: initNodeType,
            },
            path_id,
            false,
        )
    }

    // 重命名节点后更新节点的名字 （不调后端列表接口）
    const renameCallback = (name: string) => {
        const temp = cloneDeep(treeData)
        const curNode = getTreeNode(
            temp,
            (node: DataNode) => node.id === currentNode?.id,
        )
        if (curNode) {
            curNode.name = name
            setTreeData(temp)
        }
        // 在列表重命名 树节点中不存在该节点，则该节点还未加载，但外部需要更新数据
        getSelectedNode()
    }

    // 创建节点后更新treeData
    const createCallback = (newNode: DataNode) => {
        const temp = cloneDeep(treeData)
        const curNode = getTreeNode(
            temp,
            (node: DataNode) => node.id === currentNode?.id,
        )
        // 点全部后的加号新建域
        if (currentNode?.type === Architecture.ALL) {
            setTreeData([...treeData, newNode])
            getSelectedNode({
                ...allNodeInfo,
            })
            return
        }
        if (!curNode) return
        // 创建信息系统和业务事项时 由于不在树中展示，所以父级展开状态不变
        if (
            ![Architecture.BSYSTEM, Architecture.BMATTERS].includes(
                newNode.type as Architecture,
            )
        ) {
            curNode.isExpand = true
        }

        const containerNode = curNode.children?.find((node) => {
            const containerType =
                newNode.type === Architecture.BSYSTEM
                    ? Architecture.BSYSTEMCONTAINER
                    : newNode.type === Architecture.BMATTERS
                    ? Architecture.BMATTERSCONTAINER
                    : ''
            return node.type === containerType
        })
        if (containerNode) {
            containerNode.children = [
                ...(containerNode.children || []),
                { ...newNode, path: `${newNode.path}/` },
            ]
        } else {
            if (!curNode.children || curNode.children.length === 0) {
                getNodeObjects({ id: curNode.id, is_all: false, limit: 0 })
            }
            if ((curNode?.children?.length || 0) > 0) {
                curNode.children = [...(curNode.children || []), newNode]
                setTreeData(temp)
            }
            // curNode.children = dealContainerNode(curNode.children, curNode.id)
        }

        // 新建成功 选中项不变，但要刷新列表数据
        getSelectedNode()
    }

    // 移动节点
    const moveCallback = (current, target) => {
        // 当前节点刷新列表数据
        getSelectedNode()

        // const { id, path_id } = current
        // const { value } = target
        // const pathArr = path_id?.split('/')
        // const pId = pathArr[pathArr.length - 2]
        // let newTreeData: DataNode[] = []
        // const temp = _.cloneDeep(treeData)
        // // 移动节点之后，自动选中节点的父节点 pNode
        // const pNode = getTreeNode(temp, (node: DataNode) => node.id === pId)
        // if (pNode) {
        //     pNode.children = pNode.children?.filter(
        //         (child) => child.id !== current.id,
        //     )
        //     pNode.expand = !!pNode?.children?.filter(
        //         (item) => !hiddenNodeType.includes(item?.type as Architecture),
        //     ).length
        //     setSelectedNode(pNode)
        //     getSelectedNode(pNode)
        // }
        // // 目标节点是否展开了
        // const targetNode = getTreeNode(
        //     temp,
        //     (node: DataNode) => node.id === value,
        // )
        // // 如果目标节点是打开的，就塞进去，没打开就不管'
        // if (targetNode && targetNode.isExpand) {
        //     targetNode.expand = true
        //     targetNode.children = [
        //         ...(targetNode.children || []),
        //         {
        //             ...current,
        //             path_id: `${targetNode.path_id}/${current.id}`,
        //             path: `${targetNode.path}/${current.name}`,
        //         },
        //     ]
        // }
        // newTreeData = temp
        // setTreeData(newTreeData)
    }
    const treeFilterItems: MenuProps['items'] = [
        {
            key: FilterTreeNode.ALL,
            label: '显示全部',
        },
        {
            key: FilterTreeNode.MNode,
            label: '显示管理节点',
        },
    ]

    // 过滤树节点 显示全部 or 显示管理节点
    const handleClickTreeFilter = ({ key }) => {
        setTreeFilter(key)
    }

    const moreItems = (type: Architecture): MenuProps['items'] => {
        // 容器不能重命名
        const delItem = [
            {
                key: OperateType.DELETE,
                label: '删除',
            },
        ]
        const moveItem = [
            {
                key: OperateType.MOVE,
                label: '移动',
            },
        ]
        if ([Architecture.DOMAIN, Architecture.BFORM].includes(type)) {
            return [
                {
                    key: OperateType.RENAME,
                    label: '重命名',
                },
                ...delItem,
            ]
        }
        if (
            [
                Architecture.BSYSTEMCONTAINER,
                Architecture.BMATTERSCONTAINER,
            ].includes(type)
        ) {
            return delItem
        }

        return [
            {
                key: OperateType.RENAME,
                label: '重命名',
            },
            ...moveItem,
            ...delItem,
        ]
    }

    // 点击更多操作 重命名 or 删除 or 移动
    const handleClickMore = (
        ot: OperateType,
        td: DataNode,
        parentNode?: DataNode,
    ) => {
        handleOperate(ot, td.type as Architecture, td, parentNode)
    }

    const getAddItems = (type: Architecture): MenuProps['items'] => {
        // Proton组织架构中，组织/部门仅允许新建信息系统/业务事项
        return nodeInfo[type].subobjects
            .filter(
                (item) =>
                    ![
                        Architecture.DEPARTMENT,
                        Architecture.COREBUSINESS,
                    ].includes(item),
            )
            .map((key: string) => ({
                key,
                label: nodeInfo[key].name,
                icon: <Icons type={key as Architecture} />,
            }))
    }

    // 根据节点类型添加
    const handleClickAdd = (id: Architecture, td: DataNode) => {
        handleOperate(OperateType.CREATE, id, td)
    }

    const renderTreeNode = (td: DataNode, parentNode?: DataNode) => {
        return (
            <div
                className={classnames(
                    styles.treeNode,
                    td.id === selectedNode.id && styles.selectedTreeNode,
                    [Architecture.BFORM].includes(td.type as Architecture) &&
                        styles.disableTreeNode,
                    'anyfabric-treeNode',
                )}
                onMouseEnter={() => setOperateId(td.id)}
                onMouseLeave={() => setOperateId('')}
                style={{
                    paddingLeft:
                        18 * (td.path.split('/').length - firstLevel + 1) || 0,
                }}
                onClick={() => {
                    if ([Architecture.BFORM].includes(td.type as Architecture))
                        return
                    if (selectedNode.id !== td.id) {
                        setSelectedNode(td)
                        getSelectedNode(td)
                    }
                    const temp = cloneDeep(treeData)
                    // 点击展开
                    const curNode = getTreeNode(
                        temp,
                        (node: DataNode) => node.id === td.id,
                    )
                    if (!curNode) return
                    curNode.isExpand = !curNode.isExpand
                    setTreeData(temp)
                    // 展开第一次调接口
                    if (!(curNode.children && curNode.children?.length > 0)) {
                        onLoadData(td)
                    }
                }}
                hidden={
                    hiddenNodeTypeList.includes(td.type as Architecture)
                    // 屏蔽管理节点
                    // treeFilter === FilterTreeNode.MNode &&
                    // !managementNode.includes(td.type as Architecture)
                }
                title={td.name}
            >
                <RightOutlined
                    // 表单 || 显示管理节点时部门以下不展示===部门不展示箭头
                    style={{
                        visibility:
                            !td.expand ||
                            Architecture.BFORM === td.type ||
                            (Architecture.DEPARTMENT === td.type &&
                                treeFilter === FilterTreeNode.MNode)
                                ? 'hidden'
                                : 'visible',
                    }}
                    className={classnames(
                        styles.arrow,
                        td.isExpand && styles.expandArrow,
                    )}
                />

                {titleRender ? (
                    titleRender(td)
                ) : (
                    <>
                        <Icons type={td.type as Architecture} />
                        <div className={styles.rightContent}>
                            <div
                                className={classnames(
                                    styles.nodeName,
                                    selectedNode.id === td.id &&
                                        styles.selectedNodeName,
                                )}
                            >
                                {td.name}
                            </div>
                            {isShowOperate && operateId === td.id && (
                                <div className={styles.operate}>
                                    <div
                                        className={styles.moreOperate}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {![
                                            Architecture.ALL,
                                            Architecture.BSYSTEM,
                                            Architecture.BMATTERS,
                                            Architecture.BSYSTEMCONTAINER,
                                            Architecture.BMATTERSCONTAINER,
                                        ].includes(td.type as Architecture) && (
                                            <Dropdown
                                                menu={{
                                                    items: getAddItems(
                                                        td.type as Architecture,
                                                    ),
                                                    onClick: ({
                                                        key,
                                                        domEvent,
                                                    }) => {
                                                        domEvent.stopPropagation()
                                                        handleClickAdd(
                                                            key as Architecture,
                                                            td,
                                                        )
                                                    },
                                                }}
                                                getPopupContainer={(node) =>
                                                    node.parentElement || node
                                                }
                                                overlayStyle={{
                                                    width: 120,
                                                }}
                                            >
                                                <div
                                                    className={
                                                        styles.iconWrapper
                                                    }
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                >
                                                    <AddOutlined
                                                    // className={
                                                    //     styles.operateIcon
                                                    // }
                                                    />
                                                </div>
                                            </Dropdown>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        )
    }

    const renderTreeNodes = (data: DataNode[], parentNode?: DataNode) => {
        return data.map((item, index) => {
            return (
                <div key={item.id}>
                    {renderTreeNode(item, parentNode)}
                    <div hidden={!item.isExpand}>
                        {item.children
                            ? renderTreeNodes(item.children, item)
                            : null}
                    </div>
                </div>
            )
        })
    }

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
        setCurrentNode(td)
    }

    return (
        <div
            className={classnames({
                [styles.treeWrapper]: true,
                [styles.treeWrapperXScroll]: isShowXScroll,
            })}
        >
            {isShowAll && (
                <div
                    className={classnames(
                        styles.treeNode,
                        styles.all,
                        selectedNode.id === '' && styles.selectedTreeNode,
                    )}
                    onClick={() => {
                        if (selectedNode.id === '') return
                        setSelectedNode(allNodeInfo)

                        getSelectedNode({
                            ...allNodeInfo,
                        })
                    }}
                >
                    <div className={styles.rightContent}>
                        全部
                        {/* <div className={styles.operate}>
                            {isShowOperate && (
                                <div
                                    className={styles.iconWrapper}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <AddOutlined
                                        className={classnames(
                                            styles.operateIcon,
                                            styles.allAddIcon,
                                        )}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleOperate(
                                                OperateType.CREATE,
                                                Architecture.DOMAIN,
                                                {
                                                    ...allNodeInfo,
                                                },
                                            )
                                        }}
                                    />
                                </div>
                            )}
                        </div> */}
                    </div>
                </div>
            )}

            {renderTreeNodes(treeData)}
        </div>
    )
})
export default CustomTree
