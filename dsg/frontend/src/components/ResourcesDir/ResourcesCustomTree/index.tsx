import { FC, useState, useEffect, useMemo, memo, useRef } from 'react'
import { Radio, Select } from 'antd'
import { useSafeState } from 'ahooks'
import classnames from 'classnames'
import { flatMapDeep } from 'lodash'
import Icon, { FolderFilled } from '@ant-design/icons'
import styles from './styles.module.less'
import __ from './locale'
import { BusinessSystemOutlined } from '@/icons'
import ArchitectureDirTree from '@/components/BusinessArchitecture/ArchitectureDirTree'
import { Architecture } from '@/components/BusinessArchitecture/const'
import {
    getCategory,
    getApplyScopeConfig,
    formatError,
    ICategoryItem,
    SystemCategory,
    reqInfoSystemList,
    getCurUserDepartment,
    ScopeModuleCategory,
} from '@/core'
import { ReactComponent as basicInfo } from '@/assets/DataAssetsCatlg/basicInfo.svg'
import SystemTree from '@/components/MultiTypeSelectTree/SystemTree'
import { DirTree, EllipsisMiddle, Loader } from '@/ui'

const folderIcon = (type: string, fontSize?: string) => {
    return type === 'custom' ? (
        <FolderFilled
            style={{
                color: '#59A3FF',
                marginTop: '2px',
                fontSize: fontSize || '16px',
            }}
        />
    ) : (
        <BusinessSystemOutlined
            style={{
                // color: '#59A3FF',
                marginTop: '2px',
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
        treeType,
    }: {
        data: any[]
        onSelectedNode: (o) => void
        // 'system' | 'custom'
        treeType: string
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
                                    {folderIcon(treeType)}
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

interface ResourcesCustomTreeType {
    // 是否显示本部门Radio切换
    isOrgTreeShowCurDeptOpt?: boolean
    // 直接显示本部门
    isShowCurDept?: boolean
    // 显示主部门
    isShowMainDept?: boolean
    onChange: (value) => void
    extraFunc?: () => void
    // 默认显示的类目id
    defaultCategotyId?: string
    getCategorys?: (value) => void
    needUncategorized?: boolean // 是否需要显示未分类
    organizationNeedUncategorized?: boolean // 组织架构是否需要显示未分类
    unCategorizedKey?: string // 未分类的名称
    hiddenSwitch?: boolean // 隐藏下拉分类
    isShowAll?: boolean
    wapperStyle?: any
    scopeModuleCategory?: ScopeModuleCategory
    applyScopeTreeKey?: string // 应用范围树的key（如：interface_service_left）
    applyScopeId?: string // 应用范围ID（如："00000000-0000-0000-0000-000000000001"）
    aIServiceTreeName?: string
}

const ResourcesCustomTree: FC<ResourcesCustomTreeType> = ({
    isOrgTreeShowCurDeptOpt = false,
    isShowCurDept = false,
    isShowMainDept = false,
    onChange,
    defaultCategotyId = '',
    getCategorys,
    extraFunc = () => {},
    needUncategorized = false,
    organizationNeedUncategorized = needUncategorized,
    unCategorizedKey = '00000000-0000-0000-0000-000000000000',
    hiddenSwitch = false,
    isShowAll = true,
    wapperStyle,
    scopeModuleCategory,
    applyScopeTreeKey,
    applyScopeId,
    aIServiceTreeName = '',
}) => {
    const [selectedMenu, setSelectedMenu] = useState<any>()
    const [selectedNode, setSelectedNode] = useState<any>({})
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [treeData, setTreeData] = useState<any>([])
    const [selectFilterOptions, setSelectFilterOptions] = useState<any>([])
    const [treeType, setTreeType] = useState<string>('')
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
    }>({
        id: '',
        type: '',
        isAll: true,
    })

    const [categorys, setCategorys] = useState<ICategoryItem[]>([])

    // 部门切换-所有部门、本部门
    const [depRadioValue, setDepRadioValue] = useState<number>(1)
    const [curUserDepartment, setCurUserDepartment] = useState<any>()

    useEffect(() => {
        if (!hiddenSwitch || aIServiceTreeName) {
            queryCategoryList()
        } else {
            setSelectedMenu(defaultCategotyId || SystemCategory.Organization)
        }
    }, [defaultCategotyId])

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
                })
            }
        }
    }, [selectedNode])

    useEffect(() => {
        if (aIServiceTreeName) {
            onChange({
                id: selectedInfo.id ? selectedInfo.id : '',
                type: selectedInfo.type ? selectedInfo.type : '',
                isAll: selectedInfo.id === '',
                cate_id: selectedMenu,
                treeFirstIds: treeData?.length
                    ? treeData?.map((item) => item?.id)
                    : [],
            })
        } else {
            onChange({
                treeFirstCateName: categoryName,
                id: selectedInfo.id ? selectedInfo.id : '',
                type: selectedInfo.type ? selectedInfo.type : '',
                isAll: selectedInfo.id === '',
                cate_id: selectedMenu,
            })
        }
    }, [selectedInfo, treeData, aIServiceTreeName])

    useEffect(() => {
        if (selectedMenu === SystemCategory.InformationSystem) {
            // getSystems()
            setTreeType('system')
        } else {
            setTreeType('custom')
        }
    }, [selectedMenu])

    const categoryName = useMemo(() => {
        return categorys?.find((item) => item.id === selectedMenu)?.name
    }, [selectedMenu, categorys])

    useEffect(() => {
        let treeDataTemp = [...(treeData || [])]
        const requiredStatus = selectFilterOptions.find(
            (item) => item.value === selectedMenu,
        )?.required
        if (needUncategorized && !requiredStatus) {
            treeDataTemp = [
                ...treeDataTemp,
                {
                    isLeaf: true,
                    name: `${__('未分类')}`,
                    id: unCategorizedKey,
                },
            ]
        }
        setTreeList(
            treeData?.length ? updateTreeData(treeDataTemp, treeType) : [],
        )
    }, [treeData, treeType])

    const handleTopAll = () => {
        // onChange(selectAllNode)
        setSelectedNode(selectAllNode)
    }

    // 获取类目列表
    const queryCategoryList = async () => {
        try {
            setIsLoading(true)
            const { entries } = await getCategory({})

            let list = entries?.filter((item) => item.using) || []

            // 如果指定了 applyScopeTreeKey，使用新的配置逻辑过滤
            if (applyScopeTreeKey) {
                try {
                    const config = await getApplyScopeConfig()
                    const enabledCategoryIds = new Set<string>()

                    // 遍历配置中的每个类目
                    config.categories?.forEach((category) => {
                        // 如果指定了 applyScopeId，只查找该 module
                        if (applyScopeId) {
                            const module = category.modules?.find(
                                (m) => m.apply_scope_id === applyScopeId,
                            )
                            if (module) {
                                // 查找指定 key 的 tree
                                const tree = module.trees?.find(
                                    (t) => t.key === applyScopeTreeKey,
                                )
                                // 如果该 tree 下有 selected=true 的节点，则该类目可展示
                                if (
                                    tree?.nodes?.some((node) => node.selected)
                                ) {
                                    enabledCategoryIds.add(category.id)
                                }
                            }
                        } else {
                            // 如果没有指定 applyScopeId，在所有 modules 中查找
                            category.modules?.forEach((module) => {
                                // 查找指定 key 的 tree
                                const tree = module.trees?.find(
                                    (t) => t.key === applyScopeTreeKey,
                                )
                                // 如果该 tree 下有 selected=true 的节点，则该类目可展示
                                if (
                                    tree?.nodes?.some((node) => node.selected)
                                ) {
                                    enabledCategoryIds.add(category.id)
                                }
                            })
                        }
                    })

                    // 过滤类目：所有类目统一根据配置过滤，不特殊处理系统类目
                    list = list.filter((item) =>
                        enabledCategoryIds.has(item.id),
                    )
                } catch (error) {
                    formatError(error)
                }
            } else if (scopeModuleCategory) {
                // 保留旧逻辑（兼容性）
                list = list.filter((item) => {
                    if (item.type === 'system') {
                        return true
                    }
                    const applyScopeInfo = item.apply_scope_info?.find(
                        (it) => it.id === scopeModuleCategory,
                    )
                    return !!applyScopeInfo
                })
            }

            setCategorys(list || [])
            setSelectFilterOptions(
                list?.map((item) => ({
                    ...item,
                    label: item.name,
                    value: item.id,
                })),
            )
            if (aIServiceTreeName) {
                setSelectedMenu(
                    entries?.find((item) => item.name === aIServiceTreeName)
                        ?.id,
                )
                setTreeData(
                    entries?.find((item) => item.name === aIServiceTreeName)
                        ?.tree_node,
                )
            } else {
                setSelectedMenu(list?.[0]?.id || defaultCategotyId)
                setTreeData(list?.[0]?.tree_node)
            }
            getCategorys?.(entries)
        } catch (err) {
            formatError(err)
        } finally {
            setIsLoading(false)
        }
    }

    // // 获取信息系统
    // const getSystems = async () => {
    //     try {
    //         setIsLoading(true)
    //         const res = await reqInfoSystemList({
    //             limit: 2000,
    //             offset: 1,
    //         })
    //         setTreeData(res.entries || [])
    //     } catch (error) {
    //         formatError(error)
    //     } finally {
    //         setIsLoading(false)
    //     }
    // }

    // 搜索结果渲染
    const toRenderSearch = useMemo(() => {
        return (
            <SearchContainer
                data={searchResult}
                onSelectedNode={setSelectedNode}
                treeType={treeType}
            />
        )
    }, [searchResult, treeType])

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
        type,
        parentPath: string = '',
        isFirstLevel = true,
    ) =>
        list.map((node) => {
            // 构建当前路径
            const currentPath = isFirstLevel
                ? node.name // 第一级节点，仅保存自身名称作为后续路径的开始
                : `${parentPath}/${node.name}` // 非第一级，拼接完整路径
            if (node.id === unCategorizedKey) {
                return {
                    ...node,
                    key: node.id,
                    title: node.name,
                }
            }
            if (node.children) {
                return {
                    ...node,
                    key: node.id,
                    title: node.name,
                    ...(isFirstLevel ? {} : { cusPath: currentPath }), // 非第一级才添加路径
                    icon: folderIcon(type),
                    children: updateTreeData(
                        node.children,
                        type,
                        currentPath, // 传递完整路径给子节点
                        false,
                    ),
                }
            }
            return {
                ...node,
                key: node.id,
                title: node.name,
                ...(isFirstLevel ? {} : { cusPath: currentPath }), // 非第一级才添加路径
                icon: folderIcon(type),
            }
        })

    return (
        <div className={styles.selectedFilter} style={wapperStyle}>
            <div className={styles.filterTab} hidden={hiddenSwitch}>
                <div className={styles.viewWrapper}>
                    <Icon component={basicInfo} />
                    <Select
                        value={selectedMenu}
                        bordered={false}
                        options={selectFilterOptions}
                        onChange={(value) => {
                            setIsLoading(true)
                            setSelectedMenu(value)
                            setSelectedNode({
                                id: '',
                                type: value,
                                name: __('全部'),
                            })
                            setSelectedInfo({
                                id: '',
                                type: value,
                                isAll: true,
                            })
                            setTreeData(
                                categorys?.find((item) => item.id === value)
                                    ?.tree_node,
                            )
                            extraFunc()
                            setTimeout(() => {
                                setIsLoading(false)
                            }, 200)
                        }}
                        className={styles.viewSelect}
                    />
                </div>
            </div>
            <div className={styles.bussinessDomain} key={selectedMenu}>
                {selectedMenu === SystemCategory.InformationSystem ? (
                    <SystemTree
                        setSelectedNode={setSelectedNode}
                        selectedNode={selectedNode}
                        unCategorizedKey={unCategorizedKey}
                    />
                ) : selectedMenu === SystemCategory.Organization ? (
                    <ArchitectureDirTree
                        getSelectedNode={setSelectedNode}
                        filterType={[
                            Architecture.ORGANIZATION,
                            Architecture.DEPARTMENT,
                        ].join()}
                        canEmpty={false}
                        isShowAll={isShowAll}
                        // placeholder={__('搜索组织、部门')}
                        needUncategorized={organizationNeedUncategorized}
                        unCategorizedKey={unCategorizedKey}
                        isOrgTreeShowCurDeptOpt={isOrgTreeShowCurDeptOpt}
                        isShowCurDept={isShowCurDept}
                        isShowMainDept={isShowMainDept}
                    />
                ) : isLoading ? (
                    <Loader />
                ) : (
                    <DirTree
                        conf={{
                            placeholder: `${__('搜索')}${categoryName || ''}`,
                            isSearchEmpty:
                                searchResult !== undefined &&
                                !searchResult?.length,
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
        </div>
    )
}

export default ResourcesCustomTree
