import { FolderFilled } from '@ant-design/icons'
import { useSafeState } from 'ahooks'
import classnames from 'classnames'
import { flatMapDeep } from 'lodash'
import { FC, memo, useEffect, useMemo, useState } from 'react'
import { DirTree, EllipsisMiddle, Loader } from '@/ui'
import { CategoryType, formatError, getCategory } from '@/core'
import __ from './locale'
import styles from './styles.module.less'

const folderIcon = (fontSize?: string) => {
    return (
        <FolderFilled
            style={{
                color: '#59A3FF',
                marginTop: '2px',
                marginRight: '4px',
                fontSize: fontSize || '16px',
            }}
        />
    )
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
                                <div className={styles['search-item-icon']}>
                                    {folderIcon()}
                                </div>
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
                            {o.cusPath ? (
                                <div
                                    className={styles['search-path']}
                                    title={o.cusPath}
                                >
                                    <EllipsisMiddle>{o.cusPath}</EllipsisMiddle>
                                </div>
                            ) : null}
                        </div>
                    </div>
                ))}
            </div>
        )
    },
)

interface ResourcesCategoryTreeType {
    onChange: (value) => void
    extraFunc?: () => void
    // 默认显示的类目id
    defaultCategotyId?: string
    getCategorys?: (value) => void
    needUncategorized?: boolean // 是否需要显示未分类
    unCategorizedKey?: string // 未分类的名称
}

const ResourcesCategoryTree: FC<ResourcesCategoryTreeType> = ({
    onChange,
    defaultCategotyId = '',
    getCategorys,
    extraFunc = () => {},
    needUncategorized = false,
    unCategorizedKey = '00000000-0000-0000-0000-000000000000',
}) => {
    const [selectedMenu, setSelectedMenu] = useState<any>()
    const [selectedNode, setSelectedNode] = useState<any>({})
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [treeData, setTreeData] = useState<any>([])
    const [searchResult, setSearchResult] = useSafeState<any[]>([])
    const [treeList, setTreeList] = useSafeState<any[]>([])

    const selectAllNode = {
        id: '',
        type: '',
        isAll: '',
        cate_id: '',
    }
    // 选中数据信息
    const [selectedInfo, setSelectedInfo] = useState<{
        id: string
        type: any
        isAll: boolean
        // 默认分类-多个分类树集合时，需要传cate_id
        cate_id?: string
    }>({
        id: '',
        type: '',
        isAll: true,
    })

    useEffect(() => {
        queryCategoryList()
    }, [])

    useEffect(() => {
        // 组织架构会setSelectedNode 两次，type不能直接是默认的，需要匹配当前的type
        if (selectedNode) {
            if (selectedNode.name === '全部') {
                setSelectedInfo({
                    id: '',
                    type: selectedInfo.type,
                    isAll: true,
                })
            } else {
                setSelectedInfo({
                    id: selectedNode.id,
                    type: selectedNode.type || selectedInfo.type,
                    isAll: false,
                    cate_id: selectedNode?.cate_id,
                })
            }
        }
    }, [selectedNode])

    useEffect(() => {
        onChange({
            id: selectedInfo.id ? selectedInfo.id : '',
            type: selectedInfo.type ? selectedInfo.type : '',
            isAll: selectedInfo.id === '',
            cate_id: selectedInfo?.cate_id,
        })
    }, [selectedInfo])

    useEffect(() => {
        let treeDataTemp = [...treeData]
        if (needUncategorized) {
            treeDataTemp = [
                ...treeDataTemp,
                {
                    isLeaf: true,
                    name: `${__('未分类')}`,
                    id: unCategorizedKey,
                },
            ]
        }
        setTreeList(treeData?.length ? updateTreeData(treeDataTemp) : [])
    }, [treeData])

    const handleTopAll = () => {
        onChange(selectAllNode)
        setSelectedNode(selectAllNode)
    }

    // 获取类目列表
    const queryCategoryList = async () => {
        try {
            setIsLoading(true)
            const { entries } = await getCategory({})
            const list = entries
                ?.filter(
                    (item) => item.using && item.type === CategoryType.CUSTOM,
                )
                ?.map((item) => {
                    return {
                        ...item,
                        children: item.tree_node,
                    }
                })
            setSelectedMenu(defaultCategotyId || list?.[0]?.id)
            setTreeData(list)
            getCategorys?.(entries)
        } catch (err) {
            formatError(err)
        } finally {
            setIsLoading(false)
        }
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

    const flatTreeData = (list: any[]): any[] =>
        flatMapDeep(list, (item) => [
            item,
            ...flatTreeData(item.children || []),
        ])

    const handleSearch = (key: string) => {
        const flatList = flatTreeData(treeList)
        const filterTreeData = flatList?.filter((item: any) =>
            item.name.toLocaleLowerCase().includes(key.toLocaleLowerCase()),
        )
        setSearchResult(filterTreeData)
    }

    const updateTreeData = (
        list: any[],
        parentNode: any = {},
        isFirstLevel = true,
    ) =>
        list.map((node) => {
            const { currentPath: parentPath = '' } = parentNode
            // 构建当前路径
            const currentPath = isFirstLevel
                ? node.name // 第一级节点，仅保存自身名称作为后续路径的开始
                : `${parentPath}/${node.name}` // 非第一级，拼接完整路径
            if (node.id === unCategorizedKey) {
                return {
                    ...node,
                    key: node.id,
                    title: node.name,
                    cate_id: isFirstLevel ? node.id : parentNode.cate_id,
                }
            }
            if (node.children) {
                return {
                    ...node,
                    key: node.id,
                    title: node.name,
                    ...(isFirstLevel ? {} : { cusPath: currentPath }), // 非第一级才添加路径
                    icon: folderIcon(),
                    cate_id: isFirstLevel ? node.id : parentNode.cate_id,
                    children: updateTreeData(
                        node.children,
                        {
                            ...parentNode,
                            cate_id: isFirstLevel
                                ? node.id
                                : parentNode.cate_id,
                            currentPath, // 传递完整路径给子节点
                        },
                        false,
                    ),
                }
            }
            return {
                ...node,
                key: node.id,
                title: node.name,
                ...(isFirstLevel ? {} : { cusPath: currentPath }), // 非第一级才添加路径
                icon: folderIcon(),
                cate_id: isFirstLevel ? node.id : parentNode.cate_id,
            }
        })

    return (
        <div className={styles.selectedFilter}>
            {isLoading ? (
                <Loader />
            ) : (
                <DirTree
                    conf={{
                        placeholder: __('搜索类目名称'),
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
                    treeData={treeList}
                    // fieldNames={{ key: 'id', title: 'name' }}
                    onSelect={(val, node) => setSelectedNode(node?.node)}
                    selectedKeys={selectedNode ? [selectedNode?.id] : []}
                />
            )}
        </div>
    )
}

export default ResourcesCategoryTree
