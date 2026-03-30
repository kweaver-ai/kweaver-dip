import { Tooltip } from 'antd'
import { FolderFilled } from '@ant-design/icons'
import { useSafeState } from 'ahooks'
import classnames from 'classnames'
import { flatMapDeep, isEmpty } from 'lodash'
import { FC, memo, useEffect, useMemo, useState, useCallback } from 'react'
import { DirTree, EllipsisMiddle, Loader } from '@/ui'
import { CategoryType, formatError, getTemplateRuleList } from '@/core'
import __ from '../locale'
import { transformRulesToTree } from '../const'
import styles from './styles.module.less'
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
                                {/* <div className={styles['search-item-icon']}>
                                    {folderIcon()}
                                </div> */}
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

interface TemplateRuleTreeType {
    onChange: (value) => void
    dimensionList: string[]
    ruleLevel: any
    isExistTimeliness?: boolean
}

const TemplateRuleTree: FC<TemplateRuleTreeType> = ({
    onChange,
    dimensionList,
    isExistTimeliness,
    ruleLevel,
}) => {
    const selectAllNode = {
        id: '',
        type: '',
        name: '全部',
        isAll: true,
    }
    const [selectedNode, setSelectedNode] = useState<any>(selectAllNode)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [treeData, setTreeData] = useState<any>([])
    const [searchResult, setSearchResult] = useSafeState<any[]>([])
    const [treeList, setTreeList] = useSafeState<any[]>([])
    const [allTemplateRuleList, setAllTemplateRuleList] = useSafeState<any[]>(
        [],
    )

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
        if (selectedNode && allTemplateRuleList?.length) {
            if (selectedNode.name === '全部') {
                setSelectedInfo({
                    ...selectedNode,
                    id: '',
                    type: selectedInfo.type,
                    isAll: true,
                })
            } else {
                setSelectedInfo({
                    ...selectedNode,
                    id: selectedNode.id,
                    type: selectedNode.type || selectedInfo.type,
                    isAll: false,
                })
            }
        }
    }, [selectedNode, allTemplateRuleList])

    useEffect(() => {
        onChange(
            selectedInfo?.isAll
                ? allTemplateRuleList
                : selectedNode?.type
                ? selectedNode?.children
                : [selectedNode],
        )
    }, [selectedInfo])

    useEffect(() => {
        setTreeList(treeData?.length ? updateTreeData(treeData) : [])
    }, [treeData])

    const handleTopAll = () => {
        setSelectedNode(selectAllNode)
    }

    const titleRender = useCallback(
        (node: any) => (
            <Tooltip
                title={node?.disabled ? __('规则已存在，无法引用更多') : ''}
            >
                <div className={styles['itemview-wrapper']} title={node?.name}>
                    <span className={styles['itemview-wrapper-nodename']}>
                        {node?.name}
                    </span>
                </div>
            </Tooltip>
        ),
        [],
    )

    // 获取类目列表
    const queryCategoryList = async () => {
        try {
            setIsLoading(true)
            const res: any[] = await getTemplateRuleList({
                rule_level: ruleLevel,
            })
            setAllTemplateRuleList(
                res
                    ?.filter((o) => dimensionList.includes(o.dimension))
                    ?.map((o) => ({
                        ...o,
                        id: o.rule_id,
                        name: o.rule_name,
                    })),
            )
            const list = transformRulesToTree(res)?.filter((o) =>
                dimensionList.includes(o.dimension),
            )
            setTreeData(list)
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

    const handleSearch = (key: string) => {
        const filterTreeData = allTemplateRuleList?.filter((item: any) =>
            item.name.toLocaleLowerCase().includes(key.toLocaleLowerCase()),
        )
        setSearchResult(filterTreeData)
    }

    const updateTreeData = (list: any[]) =>
        list.map((node) => {
            if (node.children) {
                return {
                    ...node,
                    key: node.id,
                    title: node.name,
                    isLeaf: !node.children?.length,
                    disabeld: isExistTimeliness,
                    children: updateTreeData(node.children),
                }
            }
            return {
                ...node,
                key: node.id,
                title: node.name,
                disabeld: isExistTimeliness,
                isLeaf: !node.children?.length,
            }
        })

    return (
        <div className={styles.templateRuleTree}>
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
                        isTreeLoading: isLoading,
                        showTopTitle: true,
                    }}
                    className={styles['custom-tree-list']}
                    treeData={treeList}
                    // titleRender={titleRender}
                    onSelect={(val, node) => setSelectedNode(node?.node)}
                    selectedKeys={selectedNode ? [selectedNode?.id] : []}
                />
            )}
        </div>
    )
}

export default TemplateRuleTree
