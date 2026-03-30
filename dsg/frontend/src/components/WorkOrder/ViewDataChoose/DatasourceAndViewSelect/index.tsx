import { useSafeState } from 'ahooks'
import { Checkbox } from 'antd'
import classnames from 'classnames'
import { FC, memo, useCallback, useEffect, useMemo, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { getDataSourceTypeData } from '@/components/DatasheetView/helper'
import {
    dataServiceLabelList,
    DataSourceOrigin,
} from '@/components/DataSource/helper'
import {
    formatError,
    getDataSourceTreeBySource,
    getDataSourceTreeByType,
    getExcelList,
    unCategorizedKey,
} from '@/core'
import { BusinessSystemOutlined, FontIcon } from '@/icons'
import { DirTree } from '@/ui'
import { DataSourceRadioType, UNGROUPED } from './const'
import __ from './locale'
import styles from './styles.module.less'
import { DataColoredBaseIcon } from '@/core/dataSource'

interface DatasourceAndViewSelectProps {
    dataSourceTreeType: DataSourceRadioType
    // unCategorizedKey?: string
    setSelectedNode: (node: any) => void
    selectedNode: any
    filterDataSourceTypes?: string[]
    showExcelFile?: boolean
    /** 外部传入的已勾选节点ID数组 */
    checkedKeys?: string[]
    /** 外部传入的半勾选节点ID数组 */
    halfCheckedKeys?: string[]
    /** 勾选状态变化时的回调，返回节点信息和勾选状态 */
    onCheckChange?: (
        keys: {
            checked: string[]
            halfChecked: string[]
        },
        nodes: {
            checkedNodes: any[]
            halfCheckedNodes: any[]
        },
    ) => void
    /** 树数据变化时的回调，返回最新的树数据 */
    onTreeDataChange?: (treeData: any[]) => void
}

/**
 * 搜索结果库表
 * @param data 搜索结果数组
 * @returns 搜索结果库表Element
 */
const SearchContainer = memo(
    ({
        data,
        selectedNode,
        onSelectedNode,
        onCheckChange,
        checkedKeys = [],
        halfCheckedKeys = [],
    }: {
        data: any[]
        selectedNode: any
        onSelectedNode: (o) => void
        onCheckChange?: (
            checkedKeys: string[],
            halfCheckedKeys: string[],
        ) => void
        checkedKeys?: string[]
        halfCheckedKeys?: string[]
    }) => {
        const handleSearchItemCheck = (e, item) => {
            e.stopPropagation()
            const isChecked = checkedKeys?.includes(item.id)
            const isHalfChecked = halfCheckedKeys?.includes(item.id)

            let newCheckedKeys = [...checkedKeys]
            let newHalfCheckedKeys = [...halfCheckedKeys]

            if (isHalfChecked) {
                // 半选点击则直接改为选中
                newHalfCheckedKeys = newHalfCheckedKeys.filter(
                    (key) => key !== item.id,
                )
                newCheckedKeys.push(item.id)
            } else if (isChecked) {
                newCheckedKeys = newCheckedKeys.filter((key) => key !== item.id)
            } else {
                newCheckedKeys.push(item.id)
            }

            if (onCheckChange) {
                onCheckChange(newCheckedKeys, newHalfCheckedKeys)
            }
        }

        return (
            <div
                className={classnames(
                    styles['search-wrapper'],
                    'search-result',
                )}
            >
                {data?.map((o) => (
                    <div
                        key={o?.id}
                        className={
                            selectedNode?.id === o?.id ? styles.selected : ''
                        }
                        onClick={() => {
                            onSelectedNode(o)
                        }}
                    >
                        <div className={styles['search-item-wrapper']}>
                            <div className={styles['search-item']}>
                                <Checkbox
                                    indeterminate={halfCheckedKeys?.includes(
                                        o.id,
                                    )}
                                    checked={checkedKeys?.includes(o.id)}
                                    onClick={(e) => handleSearchItemCheck(e, o)}
                                />
                                <DataColoredBaseIcon
                                    type={o?.type}
                                    iconType="Colored"
                                />
                                <div className={styles['search-item-right']}>
                                    <div
                                        className={
                                            styles['search-item-content']
                                        }
                                    >
                                        <div
                                            className={
                                                styles[
                                                    'search-item-content-name'
                                                ]
                                            }
                                            title={o.name}
                                        >
                                            {o.name}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )
    },
)

/**
 * 数据源树
 * @param dataSourceTreeType 数据源树类型
 * @returns
 */
const DatasourceAndViewSelect: FC<DatasourceAndViewSelectProps> = ({
    dataSourceTreeType,
    // unCategorizedKey = UNGROUPED,
    setSelectedNode,
    selectedNode,
    filterDataSourceTypes = [],
    showExcelFile = true,
    checkedKeys = [],
    halfCheckedKeys = [],
    onCheckChange,
    onTreeDataChange,
}) => {
    const [isLoading, setIsLoading] = useState(false)
    const [treeData, setTreeData] = useState<any[]>([])
    const [allDataSource, setAllDataSource] = useState<any[]>([])
    const [searchResult, setSearchResult] = useSafeState<any[]>([])
    const [checked, setChecked] = useState<string[]>(checkedKeys)
    const [halfChecked, setHalfChecked] = useState<string[]>(halfCheckedKeys)
    const [expanded, setExpanded] = useState<string[]>([])

    // 外部状态变化时更新，但要避免初始化时的冲突
    useEffect(() => {
        setChecked(checkedKeys)
        setHalfChecked(halfCheckedKeys)
    }, [checkedKeys, halfCheckedKeys])

    useEffect(() => {
        getDataSourceTreeData()
    }, [dataSourceTreeType])

    // 当树数据变化时，通知父组件
    useEffect(() => {
        if (onTreeDataChange && treeData.length > 0) {
            onTreeDataChange(treeData)
        }
    }, [treeData, onTreeDataChange])

    // 当树数据加载完成后，默认展开到第一个叶子节点并选中它
    useEffect(() => {
        if (treeData.length > 0 && !selectedNode) {
            // 在整个树结构中查找第一个叶子节点及其路径
            const result = findFirstLeafInTree(treeData)
            if (result) {
                const { leafNode, path } = result
                // 展开到叶子节点的完整路径（排除叶子节点本身）
                const expandedKeys = path.slice(0, -1)
                setExpanded(expandedKeys)
                // 选中叶子节点
                setSelectedNode(leafNode)
            } else {
                // 如果没有找到叶子节点，至少展开第一个节点
                const firstNode = treeData[0]
                setExpanded([firstNode.key])
            }
        }
    }, [treeData, selectedNode])

    // 格式化未分类数据源
    const formatUnCategorizedDataSource = (data: any, dsType: any) => {
        // 如果没有未分类数据源，返回空数组
        if (!data || data.length === 0) {
            return {}
        }
        const list: any[] = []
        data.forEach((item: any) => {
            if (item.entries?.length) {
                list.push(...item.entries)
            }
        })
        // 创建未分类根节点
        const rootNode: any = {
            title: __('未分类'),
            name: __('未分类'),
            key: unCategorizedKey,
            id: unCategorizedKey,
            type: 'source_type',
            isLeaf: false,
            children: [],
        }

        list.forEach((item: any) => {
            // 使用source_type作为分组键，如果source_type不存在则使用'undefined'作为键
            const key = item.type
            const allEntries = item.entries || []
            const dsTypeItem = dsType.find((ds: any) => ds.id === item.type)
            let groupNode = {}
            if (dsTypeItem) {
                const { type, ...rest } = dsTypeItem
                groupNode = {
                    ...rest,
                    type: 'dsType',
                    key: rest.id,
                    name: rest.title,
                    isLeaf: item.entries.length === 0,
                    children:
                        item.entries.length > 0
                            ? formatUnCategorizedDataSourceNode(allEntries)
                            : undefined,
                }
            } else {
                groupNode = {
                    title: item.type,
                    name: item.type,
                    key: `${UNGROUPED}-${key}`,
                    id: `${UNGROUPED}-${key}`,
                    type: 'source_type',
                    isLeaf: allEntries.length === 0,
                    children:
                        allEntries.length > 0
                            ? formatUnCategorizedDataSourceNode(allEntries)
                            : undefined,
                }
            }

            rootNode.children?.push(groupNode)
        })

        return rootNode
    }

    // 未分类数据源节点
    const formatUnCategorizedDataSourceNode = (data: any) => {
        return data.map((item: any) => {
            return {
                ...item,
                title: item.name,
                name: item.name,
                key: item.id,
                isLeaf: item.type !== 'excel' || !showExcelFile,
            }
        })
    }

    // 获取数据源树
    const getDataSourceTreeData = useCallback(async () => {
        try {
            setIsLoading(true)
            const dsType = await getDataSourceTypeData()
            if (dataSourceTreeType === DataSourceRadioType.BySource) {
                const res = await getDataSourceTreeBySource()
                const newRes = [
                    DataSourceOrigin.INFOSYS,
                    DataSourceOrigin.DATAWAREHOUSE,
                    DataSourceOrigin.DATASANDBOX,
                ]
                    .map((item) => {
                        const newItem = res.find(
                            (it) => it.source_type === item,
                        )
                        return newItem
                    })
                    .filter((item) => !!item)
                const unCategorizedDataSource = res.filter(
                    (item) => !item.source_type,
                )
                const tree = formatDataSourceTypeNode(
                    newRes.filter(
                        (item) =>
                            item?.source_type &&
                            !filterDataSourceTypes.includes(item.source_type),
                    ),
                    dsType,
                )
                if (unCategorizedDataSource?.length) {
                    tree.push(
                        formatUnCategorizedDataSource(
                            unCategorizedDataSource,
                            dsType,
                        ),
                    )
                }
                setTreeData(tree)

                getAllDataSourceData(
                    res
                        .filter(
                            (item) =>
                                !filterDataSourceTypes?.includes(
                                    item.source_type,
                                ),
                        )
                        .map((item) => item.entries)
                        .flat(),
                )
            } else {
                const res = await getDataSourceTreeByType()
                const newRes = res
                    .map((item) => {
                        return {
                            ...item,
                            entries: item.entries.filter(
                                (entry) =>
                                    !filterDataSourceTypes?.includes(
                                        entry.source_type,
                                    ),
                            ),
                        }
                    })
                    .filter((item) => item.entries.length > 0)
                setTreeData(formatDataSourceDBNode(newRes, dsType))
                getAllDataSourceData(newRes)
            }
        } catch (err) {
            formatError(err)
        } finally {
            setIsLoading(false)
        }
    }, [dataSourceTreeType, filterDataSourceTypes])

    /**
     * 获取所有数据源数据
     * @param entries
     */
    const getAllDataSourceData = (entries: any[]) => {
        setAllDataSource(entries.map((item) => item.entries || []).flat())
    }

    // 搜索结果渲染
    const toRenderSearch = useMemo(() => {
        return (
            <SearchContainer
                data={searchResult}
                selectedNode={selectedNode}
                onSelectedNode={setSelectedNode}
                onCheckChange={(newCheckedKeys, newHalfCheckedKeys) => {
                    setChecked(newCheckedKeys)
                    if (onCheckChange) {
                        const checkedNodes = allDataSource?.filter((o) =>
                            newCheckedKeys?.includes(o.id),
                        )
                        const halfCheckedNodes = allDataSource?.filter((o) =>
                            newHalfCheckedKeys?.includes(o.id),
                        )
                        onCheckChange(
                            {
                                checked: newCheckedKeys,
                                halfChecked: newHalfCheckedKeys,
                            },
                            {
                                checkedNodes,
                                halfCheckedNodes,
                            },
                        )
                    }
                }}
                checkedKeys={checked}
                halfCheckedKeys={halfChecked}
            />
        )
    }, [searchResult, checked, halfChecked, onCheckChange, allDataSource])

    // 格式化数据源树节点
    const formatDataSourceTypeNode = (data: any, dsType: any) => {
        return data.map((item: any) => ({
            title: dataServiceLabelList[item.source_type],
            name: dataServiceLabelList[item.source_type],
            key: item.source_type,
            id: item.source_type,
            type: 'source_type',
            icon: (
                // <BusinessSystemOutlined
                //     style={{
                //         // color: '#59A3FF',
                //         marginTop: '2px',
                //         fontSize: '16px',
                //     }}
                // />
                <FontIcon
                    name="icon-yewuxitong1"
                    style={{
                        marginTop: '2px',
                        fontSize: '16px',
                        display: 'inline-block',
                    }}
                />
            ),
            isLeaf: item.entries.length === 0,
            disableCheck: true, // 根节点不支持check，只能展开收起
            checkable: false, // 根节点不可勾选
            children:
                item.entries.length > 0
                    ? formatDataSourceDBNode(
                          item.entries,
                          dsType,
                          item.source_type,
                      )
                    : undefined,
        }))
    }

    /**
     * 格式化数据源数据库类型节点
     * @param data 数据源节点
     * @param dsType 数据源类型
     * @returns 数据源节点
     */
    const formatDataSourceDBNode = (
        data: any,
        dsType: any,
        dataSourceType: string = '',
    ) => {
        return data
            .sort((a: any, b: any) => {
                // 按照 A-Z 字母顺序排序数据库类型节点
                const titleA =
                    dsType.find((ds: any) => ds.id === a.type)?.title ||
                    a.type ||
                    ''
                const titleB =
                    dsType.find((ds: any) => ds.id === b.type)?.title ||
                    b.type ||
                    ''
                return titleA.localeCompare(titleB, 'zh-CN', {
                    sensitivity: 'base',
                })
            })
            .map((item: any, idx: number) => {
                const dsTypeItem = dsType.find((ds: any) => ds.id === item.type)
                if (dsTypeItem) {
                    const { type, ...rest } = dsTypeItem
                    return {
                        ...rest,
                        type: 'dsType',
                        key: dataSourceType
                            ? `${rest.id}-${dataSourceType}`
                            : rest.id,
                        name: rest.title,
                        isLeaf: item.entries.length === 0,
                        dataSourceType,
                        disableCheck: true, // 父节点不支持check，只能展开/收起
                        checkable: false, // 父节点不可勾选
                        children:
                            item.entries.length > 0
                                ? formatDataSourceNode(item.entries, true)
                                : undefined,
                    }
                }
                return {
                    title: item.type,
                    name: item.title,
                    label: item?.title,
                    type: 'dsType',
                    key: `${item.type}-${idx}`,
                    disableCheck: true, // 父节点不支持check，只能展开/收起
                    checkable: false, // 父节点不可勾选
                }
            })
            .filter((item: any) => item.children?.length)
    }

    /**
     * 格式化数据源节点
     * @param data 数据源节点
     * @returns 数据源节点
     */
    const formatDataSourceNode = (
        data: any,
        includeUnCategorizedSourceType?: boolean,
    ) => {
        return data
            .filter(
                (item: any) =>
                    includeUnCategorizedSourceType || item.source_type,
            )
            .sort((a: any, b: any) => {
                // 按照 A-Z 字母顺序排序
                const nameA = a.name || a.title || ''
                const nameB = b.name || b.title || ''
                return nameA.localeCompare(nameB, 'zh-CN', {
                    sensitivity: 'base',
                })
            })
            .map((item: any) => {
                const isLeaf = item.type !== 'excel' || !showExcelFile
                return {
                    ...item,
                    title: item.name,
                    name: item.name,
                    key: item.id,
                    isLeaf,
                    // 所有节点都可以参与check逻辑，但只有叶子节点可以被用户勾选
                    disableCheck: false, // 不禁用check，让Tree组件自己处理
                    checkable: true, // 所有节点都设置为checkable，让Tree组件根据isLeaf判断
                }
            })
    }

    /**
     * 搜索
     * @param key 搜索关键字
     */
    const handleSearch = (key: string) => {
        const filterTreeData = allDataSource?.filter((item: any) =>
            item.name.toLocaleLowerCase().includes(key.toLocaleLowerCase()),
        )
        setSearchResult(filterTreeData)
    }

    // 判断是否为叶子节点
    const isLeafNode = (node) => {
        return !node.children || node.children.length === 0
    }

    /**
     * 递归查找第一个叶子节点及其路径
     * @param node 起始节点
     * @param path 当前路径
     * @returns 包含叶子节点和路径的对象或null
     */
    const findFirstLeafNodeWithPaths = (
        node: any,
        path: string[] = [],
    ): { leafNode: any; path: string[] } | null => {
        if (!node) return null

        const currentPath = [...path, node.key]

        if (isLeafNode(node)) {
            return {
                leafNode: node,
                path: currentPath,
            }
        }

        if (node.children && node.children.length > 0) {
            const result = node.children.reduce((found, child: any) => {
                if (found) return found
                return findFirstLeafNodeWithPaths(child, currentPath)
            }, null)
            if (result) {
                return result
            }
        }

        return null
    }

    /**
     * 在整个树结构中查找第一个叶子节点及其完整路径
     * @param nodes 树节点数组
     * @returns 包含叶子节点和路径的对象或null
     */
    const findFirstLeafInTree = (
        nodes: any[],
    ): { leafNode: any; path: string[] } | null => {
        return nodes.reduce((found, node) => {
            if (found) return found
            return findFirstLeafNodeWithPaths(node)
        }, null)
    }

    /**
     * 更新树数据的辅助函数
     *
     * @param prevTreeData - 之前的树数据
     * @param key - 要更新的节点的 key
     * @param children - 要添加的子节点数组
     * @returns 更新后的树数据
     */
    const updateTreeData = (
        prevTreeData: any[],
        key: string,
        children: any[],
    ): any[] => {
        return prevTreeData.map((node) => {
            if (node.id === key) {
                return {
                    ...node,
                    children,
                }
            }
            if (node.children) {
                return {
                    ...node,
                    children: updateTreeData(node.children, key, children),
                }
            }
            return node
        })
    }

    /**
     * 处理树节点数据加载的异步函数
     * @async
     * @function handleLoadData
     * @param {Object} node - 被展开的树节点对象
     * @param {string} node.key - 节点的唯一标识符
     * @param {React.ReactNode} node.icon - 节点的图标
     * @returns {Promise<void>}
     */
    const handleLoadData = async (node) => {
        try {
            // 检查 data 是否存在（可能是在组件的 state 中定义的）

            if (treeData && node?.catalog_name) {
                // 使用 updateTreeData 函数更新树数据
                // 为当前节点添加一个新的子节点，该子节点基于 mockExcelFileData
                const res = await getExcelList(node.catalog_name)
                const newTreeData = updateTreeData(
                    treeData,
                    node.id,
                    res.data.map((item) => {
                        const fileId = uuidv4()
                        return {
                            catalog_name: node.catalog_name,
                            id: fileId,
                            key: fileId,
                            icon: node.icon, // 使用父节点的图标
                            isLeaf: true, // 将新节点标记为叶子节点
                            title: item,
                            name: item,
                            type: 'excel',
                            dataType: 'file',
                            dataSourceId: node.id,
                        }
                    }),
                )

                // 更新组件的状态，触发重新渲染
                setTreeData(newTreeData)
            }
        } catch (error) {
            // 如果在过程中发生任何错误，使用 formatError 函数处理
            formatError(error)
        }
    }

    // 处理节点选择
    const handleSelect = (selectedKeys, e) => {
        const { node } = e

        // 只有叶子节点才可以 select
        if (isLeafNode(node)) {
            setSelectedNode(node)
        }
    }

    // 处理展开/收起
    const handleExpand = (expandedKeys, e) => {
        setExpanded(expandedKeys)
    }

    // 自定义点击处理(用于非叶子节点的展开/收起)
    const handleTitleClick = (e, node) => {
        if (!isLeafNode(node)) {
            const isExpanded = expanded?.includes(node.key)
            const newExpanded = isExpanded
                ? expanded?.filter((k) => k !== node.key)
                : [...expanded, node.key]
            setExpanded(newExpanded || [])
        } else {
            // 叶子节点点击整行触发选中
            setSelectedNode(node)
        }
    }

    const handleLeafCheck = (e, node) => {
        e.stopPropagation()

        // 只处理叶子节点的勾选
        if (!isLeafNode(node)) {
            return
        }

        const isChecked = checked?.includes(node.key)
        const isHalfChecked = halfChecked?.includes(node.key)

        let newChecked = [...checked]
        let newHalfChecked = [...halfChecked]

        if (isHalfChecked) {
            // 如果是半选状态，点击后变为全选
            newHalfChecked = newHalfChecked.filter((k) => k !== node.key)
            newChecked.push(node.key)
        } else if (isChecked) {
            // 如果是全选状态，点击后变为未选
            newChecked = newChecked.filter((k) => k !== node.key)
        } else {
            // 如果是未选状态，点击后变为全选
            newChecked.push(node.key)
        }

        setChecked(newChecked)
        setHalfChecked(newHalfChecked)

        const checkedNodes = allDataSource?.filter((o) =>
            newChecked?.includes(o.id),
        )
        const halfCheckedNodes = allDataSource?.filter((o) =>
            newHalfChecked?.includes(o.id),
        )

        // 回调Keys
        if (onCheckChange) {
            onCheckChange(
                {
                    checked: newChecked,
                    halfChecked: newHalfChecked,
                },
                {
                    checkedNodes,
                    halfCheckedNodes,
                },
            )
        }
    }

    const titleRender = (node) => {
        // 只有叶子节点显示复选框
        if (node.isLeaf) {
            return (
                <div
                    style={{ display: 'flex', alignItems: 'center' }}
                    onClick={(e) => handleTitleClick(e, node)}
                >
                    <Checkbox
                        checked={node.isChecked}
                        indeterminate={node.isHalfChecked}
                        onClick={(e) => {
                            e.stopPropagation()
                            handleLeafCheck(e, node)
                        }}
                        style={{ marginRight: 8 }}
                    />
                    <span title={node.title}>{node.title}</span>
                </div>
            )
        }

        // 非叶子节点只显示标题
        return (
            <div onClick={(e) => handleTitleClick(e, node)} title={node.title}>
                {node.title}
            </div>
        )
    }

    // 递归处理树数据,设置节点属性
    const processTreeData = (nodes) => {
        return nodes.map((node) => {
            const isLeaf = isLeafNode(node)
            const isHalfChecked = halfChecked?.includes(node.key)
            const isChecked = checked?.includes(node.key)
            const newNode = {
                ...node,
                checkable: false, // 禁用默认复选框，使用自定义渲染
                selectable: false, // 禁用默认选择行为，使用自定义点击处理
                isLeaf, // 保存是否为叶子节点的信息
                isHalfChecked, // 保存半选状态
                isChecked, // 保存选中状态
            }

            if (node.children) {
                newNode.children = processTreeData(node.children)
            }

            return newNode
        })
    }

    const processedTreeData = useMemo(
        () => processTreeData(treeData),
        [treeData, halfChecked, checked],
    )

    return (
        <DirTree
            conf={{
                placeholder: __('搜索数据源'),
                isSearchEmpty:
                    searchResult !== undefined && !searchResult?.length,
                canTreeEmpty: true,
                searchRender: toRenderSearch,
                onSearchChange: handleSearch,
                showSearch: true,
                isTreeLoading: isLoading,
                showTopTitle: false,
            }}
            className={styles['custom-tree-list']}
            treeData={processedTreeData}
            expandedKeys={expanded}
            onSelect={handleSelect}
            onExpand={handleExpand}
            selectedKeys={
                selectedNode ? [selectedNode?.key || selectedNode?.id] : []
            }
            checkable={false}
            titleRender={titleRender}
        />
    )
}

export default DatasourceAndViewSelect
