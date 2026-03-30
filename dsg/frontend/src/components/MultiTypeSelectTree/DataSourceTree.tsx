import { FC, memo, useEffect, useMemo, useState } from 'react'
import { useSafeState } from 'ahooks'
import { v4 as uuidv4 } from 'uuid'
import classnames from 'classnames'
import { AnyARecord } from 'dns'
import { DataSourceRadioType, UNGROUPED } from './const'
import {
    formatError,
    getDataSourceTreeBySource,
    getDataSourceTreeByType,
    getExcelList,
    IDataSourceTreeBySource,
} from '@/core'
import { dataServiceLabelList, DataSourceOrigin } from '../DataSource/helper'
import { BusinessSystemOutlined, FontIcon } from '@/icons'
import __ from './locale'
import styles from './styles.module.less'
import { DirTree } from '@/ui'
import { getDataSourceTypeData } from '../DatasheetView/helper'

const selectAllNode = {
    id: '',
    type: '',
    isAll: '',
    cate_id: '',
    name: __('全部'),
}

interface DataSourceTreeProps {
    dataSourceTreeType: DataSourceRadioType
    unCategorizedKey?: string
    setSelectedNode: (node: any) => void
    selectedNode: any
    extendNodesData?: any
    filterDataSourceTypes?: string[]
    showExcelFile?: boolean
}

/**
 * 搜索结果库表
 * @param data 搜索结果数组
 * @returns 搜索结果库表Element
 */
const SearchContainer = memo(
    ({
        data,
        onSelectedNode,
    }: {
        data: any[]
        onSelectedNode: (o) => void
    }) => {
        const [currentNode, setCurrentNode] = useState<any>()

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
                            currentNode?.id === o?.id ? styles.checked : ''
                        }
                        onClick={() => {
                            setCurrentNode(o)
                            onSelectedNode(o)
                        }}
                    >
                        <div className={styles['search-item-wrapper']}>
                            <div className={styles['search-item']}>
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
const DataSourceTree: FC<DataSourceTreeProps> = ({
    dataSourceTreeType,
    unCategorizedKey = UNGROUPED,
    setSelectedNode,
    selectedNode,
    extendNodesData,
    filterDataSourceTypes = [],
    showExcelFile = true,
}) => {
    const [isLoading, setIsLoading] = useState(false)
    const [treeData, setTreeData] = useState<any[]>([])
    const [allDataSource, setAllDataSource] = useState<any[]>([])
    const [searchResult, setSearchResult] = useSafeState<any[]>([])

    useEffect(() => {
        getDataSourceTreeData()
    }, [dataSourceTreeType])

    // 获取数据源树
    const getDataSourceTreeData = async () => {
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
                                !filterDataSourceTypes.includes(
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
                                    !entry.source_type ||
                                    !filterDataSourceTypes.includes(
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
    }

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
                onSelectedNode={setSelectedNode}
            />
        )
    }, [searchResult])

    // 格式化数据源树节点
    const formatDataSourceTypeNode = (data: any, dsType: any) => {
        return data.map((item: any) => ({
            title: dataServiceLabelList[item.source_type],
            name: dataServiceLabelList[item.source_type],
            key: item.source_type,
            id: item.source_type,
            type: 'source_type',
            icon: (
                <FontIcon
                    name="icon-yewuxitong1"
                    style={{
                        display: 'inline-block',
                        marginTop: '2px',
                        fontSize: '16px',
                    }}
                />
                // <BusinessSystemOutlined
                //     style={{
                //         // color: '#59A3FF',
                //         marginTop: '2px',
                //         fontSize: '16px',
                //     }}
                // />
            ),
            isLeaf: item.entries.length === 0,
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
            .map((item: any) => {
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
                    key: item.type,
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
            .map((item: any) => {
                return {
                    ...item,
                    title: item.name,
                    name: item.name,
                    key: item.id,
                    isLeaf: item.type !== 'excel' || !showExcelFile,
                }
            })
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
            key: extendNodesData?.[0]?.id,
            id: extendNodesData?.[0]?.id,
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

    /**
     * 点击全部
     */
    const handleTopAll = () => {
        setSelectedNode(selectAllNode)
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
     *
     * 当用户展开一个树节点时，这个函数被调用来加载该节点的子节点数据。
     * 它模拟了从服务器获取数据的过程，实际上是添加了一个预定义的模拟 Excel 文件数据作为子节点。
     *
     * @async
     * @function handleLoadData
     * @param {Object} node - 被展开的树节点对象
     * @param {string} node.key - 节点的唯一标识符
     * @param {React.ReactNode} node.icon - 节点的图标
     *
     * @throws {Error} 如果数据加载过程中发生错误，会被 catch 并通过 formatError 函数处理
     *
     * @example
     * <Tree loadData={handleLoadData} {...otherProps} />
     *
     * @returns {Promise<void>}
     */
    const handleLoadData = async (node) => {
        try {
            // 检查 data 是否存在（可能是在组件的 state 中定义的）

            if (
                treeData &&
                node?.catalog_name &&
                node?.id !== extendNodesData?.[0]?.id
            ) {
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

    return (
        <DirTree
            conf={{
                placeholder: __('搜索数据源'),
                isSearchEmpty:
                    searchResult !== undefined && !searchResult?.length,
                canTreeEmpty: true,
                canCheckTopTitle: true,
                isCheckTop: true,
                searchRender: toRenderSearch,
                onSearchChange: handleSearch,
                onTopTitleClick: handleTopAll,
                showSearch: true,

                // isSearchLoading: isSearching,
                isTreeLoading: isLoading,
                showTopTitle: true,
            }}
            className={styles['custom-tree-list']}
            treeData={treeData}
            // fieldNames={{ key: 'id', title: 'name' }}
            onSelect={(val, node: any) => {
                if (node?.node?.id !== extendNodesData?.[0]?.id) {
                    setSelectedNode(node?.node)
                }
            }}
            selectedKeys={
                selectedNode ? [selectedNode?.key || selectedNode?.id] : []
            }
            loadData={handleLoadData}
        />
    )
}

export default DataSourceTree
