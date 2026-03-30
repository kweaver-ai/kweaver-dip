import { message } from 'antd'
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type Key,
} from 'react'

import { ExclamationCircleFilled } from '@ant-design/icons'
import { useDebounce } from 'ahooks'
import classnames from 'classnames'
import dataEmpty from '@/assets/dataEmpty.svg'
import searchEmpty from '@/assets/searchEmpty.svg'
import {
    ICatalogItem,
    deleteSceneCatalog,
    formatError,
    getSceneCatalogTree,
    searchSceneCatalog,
} from '@/core'
import { Empty } from '@/ui'
import DirTree from '@/ui/DirTree'
import { confirm } from '@/utils/modalHelper'
import __ from '../locale'
import Create from './Create'
import ItemView from './ItemView'
import styles from './styles.module.less'

interface ICatalogTree {
    onSelect?: (node: ICatalogItem | undefined) => void
}

/**
 * 场景分析分类树组件
 */
const CatalogTree: React.FC<ICatalogTree> = ({ onSelect }) => {
    // 树数据
    const [treeData, setTreeData] = useState<ICatalogItem[]>([])
    // 加载状态
    const [loading, setLoading] = useState(false)
    // 搜索加载状态
    const [isSearchLoading, setIsSearchLoading] = useState(false)
    // 搜索关键词
    const [keyword, setKeyword] = useState('')
    // 搜索结果
    const [searchResult, setSearchResult] = useState<ICatalogItem[]>([])
    // 选中节点
    const [selectedKeys, setSelectedKeys] = useState<string[]>([])
    // 展开节点
    const [expandedKeys, setExpandedKeys] = useState<string[]>([])
    // 新建/重命名目录弹窗可见状态
    const [addModalVisible, setAddModalVisible] = useState(false)
    // 新建目录父分类id
    const [addParentId, setAddParentId] = useState<string | undefined>(
        undefined,
    )
    // 重命名节点
    const [editNode, setEditNode] = useState<ICatalogItem | undefined>(
        undefined,
    )
    // 是否全选
    const [isCheckAll, setIsCheckAll] = useState(true)
    // 防抖关键词
    const debouncedKeyword = useDebounce(keyword, { wait: 300 })
    // 当前选中的节点信息（用于保持选中状态）
    const currentSelectedNodeRef = useRef<ICatalogItem | undefined>(undefined)

    useEffect(() => {
        fetchTreeData()
    }, [])

    // 获取分类树数据
    const fetchTreeData = useCallback(async () => {
        try {
            setLoading(true)
            const res = await getSceneCatalogTree()
            setTreeData(res?.catalog_node || [])
        } catch (error) {
            formatError(error)
            setTreeData([])
        } finally {
            setLoading(false)
        }
    }, [])

    const handleSearchChange = useCallback((value: string) => {
        setKeyword(value)
    }, [])

    // 更新树数据中指定节点的名称
    const updateTreeNodeName = useCallback(
        (
            nodes: ICatalogItem[],
            nodeId: string,
            newName: string,
        ): ICatalogItem[] => {
            return nodes.map((node) => {
                if (node.id === nodeId) {
                    return { ...node, catalog_name: newName }
                }
                if (node.children && node.children.length > 0) {
                    return {
                        ...node,
                        children: updateTreeNodeName(
                            node.children,
                            nodeId,
                            newName,
                        ),
                    }
                }
                return node
            })
        },
        [],
    )

    // 展开节点的父节点路径，确保能看到选中的节点
    const expandNodePath = useCallback(
        (nodeId: string, currentTreeData: ICatalogItem[]) => {
            // 递归查找节点及其父节点路径
            const findNodePath = (
                nodes: ICatalogItem[],
                targetId: string,
                path: string[] = [],
            ): string[] | null => {
                let result: string[] | null = null
                nodes.forEach((node) => {
                    if (result) return
                    const currentPath = [...path, node.id]
                    if (node.id === targetId) {
                        result = currentPath.slice(0, -1) // 返回父节点路径（不包括自己）
                        return
                    }
                    if (node.children && node.children.length > 0) {
                        const found = findNodePath(
                            node.children,
                            targetId,
                            currentPath,
                        )
                        if (found) {
                            result = found
                        }
                    }
                })
                return result
            }

            const parentPath = findNodePath(currentTreeData, nodeId)
            if (parentPath && parentPath.length > 0) {
                setExpandedKeys((prev) => {
                    const newKeysSet = new Set([...prev, ...parentPath])
                    return Array.from(newKeysSet)
                })
            }
        },
        [],
    )

    // 搜索分类
    const handleSearchCategory = useCallback(async () => {
        try {
            setIsSearchLoading(true)
            const res = await searchSceneCatalog({
                keyword: debouncedKeyword,
            })
            setSearchResult(res || [])
        } catch (error) {
            formatError(error)
            setSearchResult([])
        } finally {
            setIsSearchLoading(false)
        }
    }, [debouncedKeyword])

    // 搜索分类
    useEffect(() => {
        if (debouncedKeyword) {
            handleSearchCategory()
        } else {
            setSearchResult([])
            // 清空搜索后，恢复之前选中的节点状态
            if (currentSelectedNodeRef.current) {
                const { id } = currentSelectedNodeRef.current
                setSelectedKeys([id])
                setIsCheckAll(false)
                // 展开选中节点的父节点路径，确保能看到选中的节点
                expandNodePath(id, treeData)
            }
        }
    }, [debouncedKeyword, handleSearchCategory, expandNodePath, treeData])

    // 点击全部目录
    const handleClickAll = useCallback(() => {
        setSelectedKeys([])
        setIsCheckAll(true)
        currentSelectedNodeRef.current = undefined
        onSelect?.(undefined)
    }, [onSelect])

    // 处理树节点选择
    const handleSelect = useCallback(
        (keys: Key[], info: any) => {
            // 如果 keys 为空数组，说明点击了已选中的节点
            if (keys.length === 0) {
                // 如果之前有选中项，说明是点击了已选中的节点，保持选中状态
                if (currentSelectedNodeRef.current) {
                    // 重新设置选中状态，保持当前选中
                    const { id, catalog_name } = currentSelectedNodeRef.current
                    setSelectedKeys([id])
                    setIsCheckAll(false)
                    onSelect?.({
                        ...currentSelectedNodeRef.current,
                    })
                    return
                }
                // 如果之前没有选中项，说明是点击了"全部目录"，保持全选状态
                setSelectedKeys([])
                setIsCheckAll(true)
                onSelect?.(undefined)
                return
            }
            const selectedKey = keys[0] as string
            // 如果点击的是同一个节点，不做任何操作
            if (selectedKeys.includes(selectedKey)) {
                return
            }
            const { node } = info
            // 更新选中状态和 ref
            setSelectedKeys([selectedKey])
            setIsCheckAll(false)
            currentSelectedNodeRef.current = node
            onSelect?.(node)
        },
        [onSelect, selectedKeys],
    )

    // 处理展开/收起
    const handleExpand = useCallback((keys: Key[]) => {
        setExpandedKeys(keys as string[])
    }, [])

    // 点击新建根目录
    const handleAddRoot = useCallback(() => {
        setAddParentId('00000000-0000-0000-0000-000000000001')
        setAddModalVisible(true)
    }, [])

    // 点击新建子目录
    const handleAddChild = useCallback((node: any) => {
        setAddParentId(node.id)
        setEditNode(undefined)
        setAddModalVisible(true)
    }, [])

    // 点击重命名
    const handleRename = useCallback((node: any) => {
        setEditNode(node)
        setAddParentId(undefined)
        setAddModalVisible(true)
    }, [])

    // 新建/重命名目录成功回调
    const handleAddSuccess = useCallback(
        async (newName?: string) => {
            if (editNode && newName) {
                // 重命名场景：直接更新本地树数据，无需重新获取
                setTreeData((prevTreeData) =>
                    updateTreeNodeName(prevTreeData, editNode.id, newName),
                )
                // 如果重命名的是当前选中的节点，更新选中节点的引用
                if (currentSelectedNodeRef.current?.id === editNode.id) {
                    currentSelectedNodeRef.current = {
                        ...editNode,
                        catalog_name: newName,
                    }
                    // 通知父组件更新选中节点的名称
                    onSelect?.({
                        ...editNode,
                        catalog_name: newName,
                    })
                }
            } else {
                // 新建场景：需要重新获取树数据
                await fetchTreeData()
                // 如果是新建且有父分类，展开父节点
                if (addParentId) {
                    setExpandedKeys((prev) => [...prev, addParentId])
                }
            }
        },
        [editNode, addParentId, updateTreeNodeName, onSelect, fetchTreeData],
    )

    // 删除分类
    const handleDelete = useCallback(
        (node: any) => {
            confirm({
                title: __('确认要删除吗？'),
                content: __('删除后，将无法找回，请谨慎操作。'),
                icon: <ExclamationCircleFilled style={{ color: '#e60012' }} />,
                onOk: async () => {
                    try {
                        await deleteSceneCatalog(node.id)
                        message.success(__('删除成功'))
                        // 如果删除的是当前选中的节点，清空选中
                        if (selectedKeys.includes(node.id)) {
                            setSelectedKeys([])
                            setIsCheckAll(true)
                            currentSelectedNodeRef.current = undefined
                            onSelect?.(undefined)
                        }
                        // 刷新树数据
                        await fetchTreeData()
                    } catch (error: any) {
                        formatError(error)
                    }
                },
            })
        },
        [selectedKeys, onSelect, fetchTreeData],
    )

    // 渲染树节点标题
    const titleRender = useCallback(
        (node: any) => (
            <ItemView
                node={node}
                handleAddChild={handleAddChild}
                handleRename={handleRename}
                handleDelete={handleDelete}
            />
        ),
        [handleAddChild, handleRename, handleDelete],
    )

    // 处理搜索结果项点击
    const handleSearchItemClick = useCallback(
        (item: ICatalogItem) => {
            // 如果点击的是已选中的项，保持选中状态，不做任何操作
            if (selectedKeys.includes(item.id)) {
                return
            }
            setSelectedKeys([item.id])
            setIsCheckAll(false)
            currentSelectedNodeRef.current = item
            onSelect?.(item)
        },
        [selectedKeys, onSelect],
    )

    // 搜索结果渲染
    const renderSearchResult = useMemo(() => {
        if (searchResult.length === 0) {
            // 直接渲染 Empty 组件
            return (
                <Empty
                    desc={__('抱歉，没有找到相关内容')}
                    iconSrc={searchEmpty}
                />
            )
        }
        return (
            <div className={styles.searchResult}>
                {searchResult.map((item) => (
                    <div
                        key={item.id}
                        className={classnames(
                            styles.searchItemWrapper,
                            selectedKeys.includes(item.id) && styles.selected,
                        )}
                        onClick={() => handleSearchItemClick(item)}
                    >
                        <ItemView
                            node={item}
                            handleAddChild={handleAddChild}
                            handleRename={handleRename}
                            handleDelete={handleDelete}
                            isSelected={selectedKeys.includes(item.id)}
                        />
                    </div>
                ))}
            </div>
        )
    }, [
        searchResult,
        selectedKeys,
        handleSearchItemClick,
        handleAddChild,
        handleRename,
        handleDelete,
    ])

    return (
        <div className={styles.categoryTree}>
            <DirTree
                conf={{
                    showSearch: true,
                    showTopTitle: true,
                    canCheckTopTitle: true,
                    isCheckTop: isCheckAll,
                    isSearchLoading,
                    isTreeLoading: loading,
                    canTreeEmpty: true,
                    canCancel: true, // 允许触发选中事件，在 handleSelect 中处理保持选中逻辑
                    placeholder: __('搜索场景分类名称'),
                    topTitle: __('全部'),
                    searchKeyword: keyword,
                    isSearchEmpty:
                        !!debouncedKeyword && searchResult.length === 0,
                    emptyRender: (
                        <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
                    ),
                    emptySearchRender: (
                        <Empty
                            desc={__('抱歉，没有找到相关内容')}
                            iconSrc={searchEmpty}
                        />
                    ),
                    searchRender: renderSearchResult,
                    onSearchChange: handleSearchChange,
                    onTopTitleClick: handleClickAll,
                    onAdd: handleAddRoot,
                    addTips: __('添加场景分类'),
                }}
                treeData={treeData as any}
                fieldNames={{ key: 'id', title: 'catalog_name' }}
                titleRender={titleRender}
                selectedKeys={selectedKeys}
                expandedKeys={expandedKeys}
                onSelect={handleSelect}
                onExpand={handleExpand}
            />
            {addModalVisible && (
                <Create
                    visible={addModalVisible}
                    parent_id={addParentId}
                    editNode={editNode}
                    onCancel={() => {
                        setAddModalVisible(false)
                        setAddParentId(undefined)
                        setEditNode(undefined)
                    }}
                    onSuccess={handleAddSuccess}
                />
            )}
        </div>
    )
}

export default CatalogTree
