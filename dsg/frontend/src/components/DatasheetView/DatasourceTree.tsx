import { useSafeState } from 'ahooks'
import { Badge, Checkbox, Radio } from 'antd'
import {
    Key,
    forwardRef,
    memo,
    useCallback,
    useEffect,
    useImperativeHandle,
    useState,
    FC,
} from 'react'
import classnames from 'classnames'
import { v4 as uuidv4 } from 'uuid'
import { useQuery } from '@/utils'
import DirTree from '@/ui/DirTree'
import {
    formatError,
    getDataSourceTreeBySource,
    getDataViewDatasouces,
    getExcelList,
} from '@/core'
import {
    dataServiceLabelList,
    DataSourceOrigin,
} from '@/components/DataSource/helper'
import { DirTreeProvider, useDirTreeContext } from '@/context/DirTreeProvider'
import __ from './locale'
import styles from './styles.module.less'
import {
    allNodeInfo,
    DataSourceRadioType,
    DataSourceRadioTypeList,
} from './const'
import { getDataSourceTypeData } from './helper'
import Empty from '@/ui/Empty'
import { databaseTypesEleData } from '@/core/dataSource'
import { useDataViewContext } from './DataViewProvider'
import { BusinessSystemOutlined, ClockColored } from '@/icons'
import { Loader } from '@/ui'

// 参数设置
const InitParams = { limit: 0, id: '', is_all: false }

interface IArchitectureDirTree {
    showType?: ShowType
    ref: any
    getSelectedNode: (node: any) => void
    // 过滤的节点类型
    filterType: string
    // 能否展示数据空库表
    canEmpty: boolean
    isShowAll: boolean
    isShowSearch: boolean
    type?: string
    datasourceData?: any[]
    hasTreeData?: boolean
    checkable?: boolean
    getCheckedNode?: (node: any[]) => void
    checkKeys?: any[]
    filterTypes?: string[]
    onlyShowDataSource?: boolean
    showScanStatus?: boolean
}

/**
 * 数据获取类别
 */
enum DataOpt {
    Init,
    Load,
    Search,
}

export enum ShowType {
    Tree = 'tree',
    List = 'list',
}

/**
 * 组织架构目录树
 * @param getSelectedNode 响应选中节点事件
 * @param filterType 查询节点类型
 */
const DatasourceTree: FC<Partial<IArchitectureDirTree>> = forwardRef(
    (props: any, ref) => {
        const {
            showType = ShowType.Tree,
            getSelectedNode,
            canEmpty = true,
            isShowAll = true,
            isShowSearch = true,
            type,
            datasourceData,
            hasTreeData = true,
            checkable,
            getCheckedNode,
            checkKeys,
            filterTypes = [],
            onlyShowDataSource = true,
            showScanStatus = false,
        } = props

        const { isValueEvaluation } = useDataViewContext()
        const [data, setData] = useSafeState<any[]>()
        const [searchResult, setSearchResult] = useSafeState<any[]>()
        const { currentNode, setCurrentNode } = useDirTreeContext()
        const [keyword, setKeyword] = useSafeState<string>('')
        const [isLoading, setIsLoading] = useState<boolean>(false)
        const [isSearching, setIsSearching] = useState<boolean>(false)
        const [indeterminate, setIndeterminate] = useState<boolean>(false)
        const [checkedAll, setCheckedAll] = useState<boolean>(false)
        const [isEmpty, setIsEmpty] = useState<boolean>(false)
        const [dsData, setDsData] = useState<any[]>([])
        const [checkedKeys, setCheckedKeys] = useState<any[]>([])
        const [selectedType, setSelectedType] = useState<any[]>([])
        const [expandedKeys, setExpandedKeys] = useState<any[]>([])

        // 数据源树类型
        const [dataSourceRadio, setDataSourceRadio] =
            useState<DataSourceRadioType>(
                onlyShowDataSource
                    ? DataSourceRadioType.ByType
                    : DataSourceRadioType.BySource,
            )

        const query = useQuery()
        const taskId = query.get('taskId') || undefined
        const datasourceId = query.get('datasourceId') || ''

        useImperativeHandle(ref, () => ({
            treeData: dsData,
            isEmpty,
        }))

        useEffect(() => {
            setDataSourceRadio(
                onlyShowDataSource
                    ? DataSourceRadioType.ByType
                    : DataSourceRadioType.BySource,
            )
        }, [onlyShowDataSource])
        useEffect(() => {
            // 传入数据源，不调用接口
            if (hasTreeData) {
                if (datasourceData) {
                    getTreeData(datasourceData)
                    setIsEmpty(datasourceData.length === 0)
                }
            } else {
                getData()
            }
        }, [datasourceData, hasTreeData, dataSourceRadio, showType])

        // 响应选中事件
        useEffect(() => {
            if (type) {
                getSelectedNode?.(currentNode, type)
            } else {
                getSelectedNode?.(currentNode)
            }
        }, [currentNode, type])

        useEffect(() => {
            if (isShowAll && !checkable) {
                setCurrentNode(allNodeInfo)
            }
        }, [isShowAll])

        useEffect(() => {
            if (checkKeys) {
                setCheckedKeys(checkKeys)
                if (checkKeys.length === 0) {
                    setCheckedAll(false)
                    setIndeterminate(false)
                } else {
                    setIndeterminate(checkKeys.length !== dsData.length)
                    setCheckedAll(checkKeys.length === dsData.length)
                }
            }
        }, [checkKeys])
        useEffect(() => {
            if (keyword) {
                const dsDatalist = datasourceData || dsData
                const results = dsDatalist.filter((item) =>
                    item.name
                        .toLocaleLowerCase()
                        .includes(keyword.toLocaleLowerCase()),
                )
                setSearchResult(results)
            }
        }, [keyword])

        useEffect(() => {
            if (datasourceId) {
                checkDefaultNode()
            }
        }, [datasourceId])

        const checkDefaultNode = () => {
            const list = dsData?.length ? dsData : datasourceData
            const curNode = list.find((item) => item.id === datasourceId)
            handleSelect([datasourceId], { node: curNode })
            setExpandedKeys([curNode?.type])
        }

        // 获取数据
        const getData = async () => {
            try {
                setIsLoading(true)
                const responseData = await getDataViewDatasouces({
                    limit: 1000,
                    task_id: taskId,
                    direction: 'desc',
                    sort: 'updated_at',
                    // source_types: isValueEvaluation
                    //     ? `${DataSourceOrigin.INFOSYS}`
                    //     : `${DataSourceOrigin.INFOSYS},${DataSourceOrigin.DATAWAREHOUSE}`,
                })
                const res =
                    responseData?.entries.filter(
                        (item) => !filterTypes.includes(item.type),
                    ) || []
                setDsData(res)
                await getTreeData([...res])
                setIsEmpty(res.length === 0)
            } catch (error) {
                formatError(error)
                setIsSearching(false)
                setIsEmpty(true)
            } finally {
                setIsLoading(false)
            }
        }

        // 平铺树结构
        const flattenData = (arr) => {
            const result: any[] = []

            arr.forEach((item) => {
                result.push(item)
                if (item.children && item.children.length) {
                    result.push(...flattenData(item.children))
                }
            })

            return result
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

                if (data && node?.catalog_name) {
                    // 使用 updateTreeData 函数更新树数据
                    // 为当前节点添加一个新的子节点，该子节点基于 mockExcelFileData
                    const res = await getExcelList(node.catalog_name)
                    const newTreeData = updateTreeData(
                        data,
                        node.id,
                        res.data.map((item) => {
                            const fileId = uuidv4()
                            return {
                                catalog_name: node.catalog_name,
                                id: fileId,
                                icon: node.icon, // 使用父节点的图标
                                isLeaf: true, // 将新节点标记为叶子节点
                                title: item,
                                type: 'excel',
                                dataType: 'file',
                                dataSourceId: node.id,
                            }
                        }),
                    )

                    // 更新组件的状态，触发重新渲染
                    setData(newTreeData)
                }
            } catch (error) {
                // 如果在过程中发生任何错误，使用 formatError 函数处理
                formatError(error)
            }
        }

        // 格式化数据源树节点
        const formatDataSourceTypeNode = (
            currentData: any,
            dsType: any,
            allDataSource: any[] = [],
        ) => {
            return currentData.map((item: any) => ({
                title: dataServiceLabelList[item.source_type],
                key: item.source_type,
                id: item.source_type,
                type: 'source_type',
                icon: (
                    <BusinessSystemOutlined
                        style={{
                            // color: '#59A3FF',
                            marginTop: '2px',
                            fontSize: '16px',
                        }}
                    />
                ),
                isLeaf: item.entries.length === 0,
                children:
                    item.entries.length > 0
                        ? formatDataSourceDBNode(
                              item.entries,
                              dsType,
                              item.source_type,
                              allDataSource,
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
            currentData: any,
            dsType: any,
            source_type = '',
            allDataSource: any[] = [],
        ) => {
            return currentData
                .filter((item: any) => !filterTypes.includes(item.type))
                .map((item: any) => {
                    const dsTypeItem = dsType.find(
                        (ds: any) => ds.id === item.type,
                    )
                    if (dsTypeItem) {
                        const { type: currentType, ...rest } = dsTypeItem
                        return {
                            ...rest,
                            type: 'dsType',
                            key: `${rest.id}-${source_type}`,
                            isLeaf: item.entries.length === 0,
                            dataSourceType: rest.source_type,
                            id: `${rest.id}-${source_type}`,
                            children:
                                item.entries.length > 0
                                    ? formatDataSourceNode(
                                          item.entries,
                                          allDataSource,
                                      )
                                    : undefined,
                        }
                    }
                    return {
                        title: item.type,
                        key: `${item.type}-${source_type}`,
                        label: item?.title,
                        type: 'dsType',
                    }
                })
        }

        /**
         * 格式化数据源节点
         * @param data 数据源节点
         * @returns 数据源节点
         */
        const formatDataSourceNode = (
            currentData: any,
            allDataSource: any[] = [],
        ) => {
            return currentData.map((item: any) => {
                const curNode = allDataSource.find((it) => it.id === item.id)
                const { Colored } =
                    databaseTypesEleData.dataBaseIcons[item.type]
                return {
                    ...item,
                    title: item.name,
                    key: item.id,
                    icon:
                        showScanStatus && curNode?.last_scan ? (
                            <Badge
                                offset={[0, 15]}
                                count={
                                    curNode?.last_scan ? (
                                        <ClockColored
                                            style={{
                                                fontSize: '10px',
                                            }}
                                        />
                                    ) : (
                                        0
                                    )
                                }
                            >
                                <Colored />
                            </Badge>
                        ) : (
                            <Colored />
                        ),
                    isLeaf: true,
                }
            })
        }

        const getTreeData = async (res: any[]) => {
            try {
                if (showType === ShowType.List) {
                    const list = res
                        // // 扫描数据源不根据扫描状态过滤
                        // ?.filter((it) =>
                        //     checkable
                        //         ? it
                        //         : it.last_scan || it.type === 'excel',
                        // )
                        ?.map((it) => {
                            const { Colored } =
                                databaseTypesEleData.dataBaseIcons[it?.type]
                            return {
                                ...it,
                                title: it.name,
                                isLeaf: true,
                                icon: showScanStatus ? (
                                    <Badge
                                        offset={[0, 15]}
                                        count={
                                            it?.last_scan ? (
                                                <ClockColored
                                                    style={{
                                                        fontSize: '10px',
                                                    }}
                                                />
                                            ) : (
                                                0
                                            )
                                        }
                                    >
                                        <Colored />
                                    </Badge>
                                ) : (
                                    <Colored />
                                ),
                            }
                        })

                    setData(list)
                    return
                }
                const dsType = await getDataSourceTypeData()
                if (dataSourceRadio === DataSourceRadioType.ByType) {
                    const treeData = dsType
                        .filter((item) => !filterTypes.includes(item.type))
                        .map((item) => {
                            const { Colored } =
                                databaseTypesEleData.dataBaseIcons[item.type]
                            const children =
                                res
                                    // 扫描数据源不根据扫描状态过滤
                                    // ?.filter((it) =>
                                    //     checkable
                                    //         ? it
                                    //         : it.last_scan ||
                                    //           it.type === 'excel',
                                    // )
                                    ?.map((it) => {
                                        return {
                                            ...it,
                                            title: it.name,
                                            icon: showScanStatus ? (
                                                <Badge
                                                    offset={[0, 15]}
                                                    count={
                                                        it?.last_scan ? (
                                                            <ClockColored
                                                                style={{
                                                                    fontSize:
                                                                        '10px',
                                                                }}
                                                            />
                                                        ) : (
                                                            0
                                                        )
                                                    }
                                                >
                                                    <Colored />
                                                </Badge>
                                            ) : (
                                                <Colored />
                                            ),
                                            isLeaf: item.type !== 'excel',
                                        }
                                    })
                                    ?.filter((it) => it.type === item.type) ||
                                []
                            return {
                                ...item,
                                children,
                            }
                        })
                        .map((item) => {
                            return {
                                ...item,
                                isLeaf: item?.children?.length === 0,
                            }
                        })
                        .filter((item) => item?.children?.length)
                        .sort((a, b) => {
                            return a.title.localeCompare(b.title)
                        })
                    // setDsData(flattenData(treeData))
                    setData(treeData)
                } else {
                    const dataSourceTypes = isValueEvaluation
                        ? [DataSourceOrigin.INFOSYS]
                        : [
                              DataSourceOrigin.INFOSYS,
                              DataSourceOrigin.DATAWAREHOUSE,
                          ]
                    const resData = await getDataSourceTreeBySource()
                    const newRes = dataSourceTypes
                        .map((item) => {
                            const newItem = resData.find(
                                (it) => it.source_type === item,
                            )
                            return newItem
                        })
                        .filter((item) => item)
                    const treeData = formatDataSourceTypeNode(
                        newRes,
                        dsType,
                        res,
                    )
                    // setDsData(flattenData(treeData))
                    setData(treeData)
                }
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
            const { node } = info
            setCurrentNode(node)
            let selectedKeys = checkedKeys
            if (node.id === node.type) {
                selectedKeys = selectedType.includes(node.type)
                    ? selectedKeys.filter((item) => {
                          const flag = dsData
                              .filter((it) => it.type === node.type)
                              .map((it) => it.id)
                              .includes(item)
                          return !flag
                      })
                    : Array.from(
                          new Set([
                              ...selectedKeys,
                              ...dsData
                                  .filter((it) => it.type === node.type)
                                  .map((it) => it.id),
                          ]),
                      )
            } else {
                selectedKeys = selectedKeys.includes(node.id)
                    ? selectedKeys.filter((item) => item !== node.id)
                    : [...selectedKeys, node.id]
            }
            onCheck(checkable ? selectedKeys : [node.id])
        }

        const onCheck = (keys: any) => {
            const checkedData = dsData
                // .filter((item) => item.last_scan)
                .filter(
                    (item) =>
                        keys?.includes(item.id) || keys?.includes(item.type),
                )
            setSelectedType(
                Array.from(new Set(checkedData.map((item) => item.type))),
            )
            getCheckedNode?.(checkedData)
            setCheckedKeys(keys)
            setIndeterminate(
                checkedData.length !== dsData.length && checkedData.length > 0,
            )
            setCheckedAll(checkedData.length === dsData.length)
        }

        const topTitle = () => {
            return (
                <Checkbox
                    className={styles.treeCheckAll}
                    indeterminate={indeterminate}
                    onChange={onChangeAll}
                    checked={checkedAll}
                >
                    {__('全选')}
                </Checkbox>
            )
        }

        // 全选
        const onChangeAll = (e) => {
            const { checked } = e.target
            setCheckedAll(checked)
            onCheck(checked ? dsData.map((item) => item.id) : [])
        }

        const showSearchList = (dataList: any[] = []) => {
            return (
                <div
                    className={classnames(
                        styles.searchTreeWrapper,
                        'search-result',
                    )}
                >
                    {dataList.map((item) => {
                        const { Colored } =
                            databaseTypesEleData.dataBaseIcons[item.type]

                        return (
                            <div
                                className={classnames(
                                    styles.searchTreeItem,
                                    checkedKeys.includes(item.id) &&
                                        styles.active,
                                )}
                                onClick={() =>
                                    handleSelect([item.id], { node: item })
                                }
                                key={item.id}
                            >
                                <Colored className={styles.itemIcon} />
                                <div
                                    className={styles.itemName}
                                    title={item.name}
                                >
                                    {item.name}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )
        }

        const empty = () => {
            const text = (
                <div className={styles.emptyText}>
                    <div className={styles.emptyFirstText}>
                        {__('抱歉，没有找到相关内容')}
                    </div>
                    <div>{__('可能有以下原因：')}</div>
                    <div>{__('1、数据源不存在')}</div>
                    <div>{__('2、未扫描过数据源')}</div>
                    <div>
                        {__(
                            '3、已扫描过数据源但下方无库表，因此不展示此数据源',
                        )}
                    </div>
                </div>
            )
            return <Empty desc={checkable ? undefined : text} />
        }

        return (
            <div className={styles.datasourcesTreeWrapper}>
                {!onlyShowDataSource && (
                    <div className={styles['tree-select']}>
                        <div>{__('数据源')}</div>
                        <Radio.Group
                            onChange={(e) => setDataSourceRadio(e.target.value)}
                            value={dataSourceRadio}
                            size="small"
                        >
                            {DataSourceRadioTypeList.map((item) => (
                                <Radio.Button
                                    key={item.value}
                                    value={item.value}
                                >
                                    {item.label}
                                </Radio.Button>
                            ))}
                        </Radio.Group>
                    </div>
                )}
                {isLoading ? (
                    <div className={styles.loading}>
                        <Loader />
                    </div>
                ) : (
                    <DirTree
                        conf={{
                            placeholder: __('搜索数据源'),
                            isSearchEmpty: !!keyword && !searchResult?.length,
                            searchRender: showSearchList(searchResult),
                            canTreeEmpty: canEmpty,
                            onSearchChange: handleSearch,
                            onTopTitleClick: handleTopAll,
                            isCheckTop: !currentNode?.id,
                            showTopTitle: isShowAll,
                            showSearch: isShowSearch,
                            isTreeLoading: isLoading,
                            isSearchLoading: isSearching,
                            topTitle: checkable ? topTitle() : undefined,
                            canCheckTopTitle: !checkable,
                            canCancel: checkable,
                            emptySearchRender: empty(),
                            expandKeys: expandedKeys,
                        }}
                        treeData={data as any}
                        fieldNames={{ key: 'id' }}
                        onSelect={handleSelect}
                        checkable={checkable}
                        onCheck={onCheck}
                        checkedKeys={checkedKeys}
                        selectedKeys={currentNode ? [currentNode?.id] : []}
                        loadData={handleLoadData}
                    />
                )}
            </div>
        )
    },
)

export const DatasourceTreeContainer = forwardRef(
    (props: Partial<IArchitectureDirTree>, ref) => {
        return (
            <DirTreeProvider>
                <DatasourceTree {...props} ref={ref} />
            </DirTreeProvider>
        )
    },
)

export default memo(DatasourceTreeContainer)
