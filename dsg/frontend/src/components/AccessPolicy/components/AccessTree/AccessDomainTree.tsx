import { useSafeState, useUpdateEffect } from 'ahooks'
import { Collapse } from 'antd'
import classnames from 'classnames'
import {
    FC,
    Key,
    forwardRef,
    memo,
    useCallback,
    useDeferredValue,
    useEffect,
    useMemo,
    useState,
} from 'react'
import { GlossaryIcon } from '@/components/BusinessDomain/GlossaryIcons'
import { DirTreeProvider, useDirTreeContext } from '@/context'
import {
    AssetTypeEnum,
    ISubjectDomainItem,
    SubjectDomainParams,
    formatError,
    getSubjectDomain,
    getUserDataViewSubjectDomains,
    getUserIndicatorSubjectDomains,
    getUserSubjectDomains,
} from '@/core'

import { DirTree, EllipsisMiddle } from '@/ui'
import { DomainType } from '../../const'
import __ from '../../locale'
import styles from './styles.module.less'
import { isContainerIgnoreCase } from '../../helper'

const { Panel } = Collapse

type DataNode = ISubjectDomainItem & { owners: string[] }
/**
 * 搜索结果项
 * @param node 节点数据
 * @returns 搜索结果项Element
 */
const SearchItem = memo(({ node }: { node: DataNode }) => {
    const { name, type, path_name } = node
    return (
        <div className={styles['search-item']}>
            <div className={styles['search-item-icon']}>
                <GlossaryIcon width="20px" type={type} fontSize="20px" />
            </div>
            <div className={styles['search-item-right']}>
                <div className={styles['search-item-content']}>
                    <div
                        className={styles['search-item-content-name']}
                        title={name}
                    >
                        {name}
                    </div>
                    {path_name && name !== path_name && (
                        <div
                            className={styles['search-item-content-path']}
                            title={path_name}
                        >
                            <EllipsisMiddle>{path_name}</EllipsisMiddle>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
})

/**
 * 转换树数据
 * @param list 当前树列表
 */
const transformTree = (list: DataNode[]): DataNode[] => {
    return list
        ?.filter((group) => group.type === DomainType.subject_domain_group)
        .map((o) => ({
            ...o,
            children: list.filter(
                (child) =>
                    child.path_id?.startsWith(o.id) &&
                    child.type === DomainType.subject_domain,
            ),
        }))
}

/**
 * 搜索结果库表
 * @param data 搜索结果数组
 * @returns 搜索结果库表Element
 */

const SearchContainer = memo(
    ({ data, filterType }: { data: DataNode[]; filterType: string[] }) => {
        const { currentNode, setCurrentNode } = useDirTreeContext()

        const renderDomainBlock = () => {
            return (
                <Collapse defaultActiveKey={filterType} ghost>
                    {filterType?.map((level: string) => {
                        const list = data?.filter((o) => o?.type === level)
                        return list?.length ? (
                            <Panel
                                header={LevelType[level]}
                                key={level}
                                className={styles['search-wrapper-list']}
                            >
                                {list?.map((o) => (
                                    <div
                                        key={o?.id}
                                        className={
                                            currentNode?.id === o?.id
                                                ? styles.checked
                                                : ''
                                        }
                                        onClick={() => {
                                            setCurrentNode(o)
                                        }}
                                    >
                                        <SearchItem node={o} />
                                    </div>
                                ))}
                            </Panel>
                        ) : null
                    })}
                </Collapse>
            )
        }
        return (
            <div
                className={classnames(
                    styles['search-wrapper'],
                    'search-result',
                )}
            >
                {renderDomainBlock()}
            </div>
        )
    },
)
/**
 * 目录项
 * @param node 节点数据
 * @returns 目录项Element
 */
const ItemView = memo(
    ({ node, uncategorized }: { node: any; uncategorized: boolean }) => {
        const { name, type } = node
        return (
            <div className={styles['itemview-wrapper']}>
                <span
                    className={styles['itemview-icon']}
                    title={`${LevelType[type]}：${name}`}
                    hidden={uncategorized}
                >
                    <GlossaryIcon width="20px" type={type} fontSize="20px" />
                </span>
                <span
                    className={styles['itemview-wrapper-nodename']}
                    title={`${
                        uncategorized ? '' : `${LevelType[type]}：`
                    }${name}`}
                >
                    {name}
                </span>
            </div>
        )
    },
)

// 搜索分类
export const LevelType = {
    [DomainType.subject_domain_group]: __('业务对象分组'),
    [DomainType.subject_domain]: __('业务对象分组'),
}

// 参数设置
const AllParams = { parent_id: '', id: '' }

/**
 * 数据获取类别
 */
enum DataOpt {
    Init,
    Search,
}

interface IAccessDomainTree {
    ref?: any
    type: string
    placeholder?: string
    // 能否展示空数据图标
    canEmpty?: boolean
    isShowAll?: boolean
    isShowSearch?: boolean
    handleLoadOrEmpty?: (isLoading: boolean, isEmpty: boolean) => void
    getSelectedKeys?: (node: any) => void
    handleOperate?: (op: any, data: any) => void
    selectedNode?: any
    needUncategorized?: boolean // 是否需要显示未分类
    unCategorizedKey?: string // 未分类的名称
}

/**
 * 主题域树
 */
const AccessDomainTree: FC<Partial<IAccessDomainTree>> = forwardRef(
    (props: any, ref) => {
        const {
            getSelectedKeys,
            placeholder,
            canEmpty = true,
            isShowAll = true,
            isShowSearch = true,
            handleOperate,
            placeholderWith,
            handleLoadOrEmpty,
            selectedNode,
            type,
            needUncategorized = false,
            unCategorizedKey = 'uncategory',
        } = props

        const [treeData, setTreeData] = useSafeState<any>()
        const [data, setData] = useSafeState<any>()
        const [keyword, setKeyword] = useSafeState<string>('')
        const [expandedKeys, setExpandedKeys] = useSafeState<string[]>([])
        const deferredKeyWord = useDeferredValue(keyword)
        const [searchResult, setSearchResult] = useSafeState<DataNode[]>()
        const { currentNode, setCurrentNode } = useDirTreeContext()
        const [isLoading, setIsLoading] = useState<boolean>(false)
        const [isSearching, setIsSearching] = useState<boolean>(false)

        // 外部设置选中树节点
        useEffect(() => {
            setCurrentNode(selectedNode)
        }, [selectedNode])

        useUpdateEffect(() => {
            getSelectedKeys?.(currentNode)
        }, [currentNode])

        useEffect(() => {
            let initData: any = transformTree(data) || []

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
            setTreeData(initData)
        }, [data, needUncategorized, unCategorizedKey])

        useUpdateEffect(() => {
            if (handleLoadOrEmpty) {
                handleLoadOrEmpty(isLoading, !isLoading && !data?.length)
            }
        }, [isLoading, data])

        useEffect(() => {
            if (isShowAll) {
                setCurrentNode(AllParams)
            }
        }, [isShowAll])

        // 获取数据
        const getData = async () => {
            try {
                setIsLoading(true)
                const accessDomain =
                    type === AssetTypeEnum.Api
                        ? getUserSubjectDomains
                        : type === AssetTypeEnum.Indicator
                        ? getUserIndicatorSubjectDomains
                        : getUserDataViewSubjectDomains

                const responseData = await accessDomain()

                const res = responseData?.entries || []
                setCurrentNode(AllParams)

                setData(res)
            } catch (error) {
                setData([])
                formatError(error)
            } finally {
                setIsLoading(false)
            }
        }

        // 初始化
        useEffect(() => {
            getData()
        }, [type, needUncategorized])

        // 搜索查询
        useUpdateEffect(() => {
            if (deferredKeyWord) {
                const result = data?.filter((o) =>
                    isContainerIgnoreCase(o.name, deferredKeyWord),
                )
                setSearchResult(result)
            } else {
                setSearchResult(undefined)
            }
        }, [deferredKeyWord, data])

        const titleRender = useCallback(
            (node: any) => (
                <ItemView
                    node={node}
                    uncategorized={unCategorizedKey === node.id}
                />
            ),
            [handleOperate],
        )

        // 搜索结果渲染
        const toRenderSearch = useMemo(() => {
            return (
                <SearchContainer
                    data={searchResult as DataNode[]}
                    filterType={[
                        DomainType.subject_domain_group,
                        DomainType.subject_domain,
                    ]}
                />
            )
        }, [searchResult])

        const handleSearch = (key: string) => {
            setKeyword(key)
        }
        const handleTopAll = useCallback(() => setCurrentNode(AllParams), [])
        // 设置选中节点
        const handleSelect = (keys: Key[], info: any) =>
            setCurrentNode(info.node)

        const handleExpand = (key: any, info: any) => {
            setExpandedKeys(key)
        }

        return (
            <div className={styles['domain-tree']}>
                <DirTree
                    conf={{
                        placeholder:
                            placeholder || __('搜索业务对象分组、业务对象'),
                        isSearchEmpty:
                            searchResult !== undefined && !searchResult?.length,
                        canTreeEmpty: canEmpty,
                        searchRender: toRenderSearch,
                        showSearch: isShowSearch,
                        onSearchChange: handleSearch,
                        isCheckTop: !currentNode?.id,
                        onTopTitleClick: handleTopAll,
                        showTopTitle: isShowAll,
                        topTitle: __('可授权的'),
                        isSearchLoading: isSearching,
                        isTreeLoading: isLoading,
                    }}
                    treeData={treeData}
                    fieldNames={{ key: 'id', title: 'name' }}
                    titleRender={titleRender}
                    onSelect={handleSelect}
                    onExpand={handleExpand}
                    expandedKeys={expandedKeys}
                    selectedKeys={currentNode ? [currentNode?.id] : []}
                />
            </div>
        )
    },
)

const AccessDomainTreeContainer = forwardRef(
    (props: Partial<IAccessDomainTree>, ref) => {
        return (
            <DirTreeProvider>
                <AccessDomainTree {...props} ref={ref} />
            </DirTreeProvider>
        )
    },
)

export default memo(AccessDomainTreeContainer)
