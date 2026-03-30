import React, {
    useState,
    useEffect,
    useImperativeHandle,
    forwardRef,
    useMemo,
    useRef,
} from 'react'
import { useDebounce } from 'ahooks'
import InfiniteScroll from 'react-infinite-scroll-component'
import { TreeSelect, Spin, TreeSelectProps } from 'antd'
import { AnyKindOfDictionary, noop, uniq } from 'lodash'
import classNames from 'classnames'
import { DownOutlined } from '@ant-design/icons'
import __ from './locale'
import {
    getObjects,
    IGetObject,
    formatError,
    getObjectDetails,
    getObjectsWithCancel,
} from '@/core'
import { Architecture } from '../BusinessArchitecture/const'
import Icons from '../BusinessArchitecture/Icons'
import styles from './styles.module.less'
import { Empty, Loader } from '@/ui'

const defaultSearchParams = {
    limit: 20,
    is_all: true,
    type: `${Architecture.ORGANIZATION},${Architecture.DEPARTMENT}`,
    keyword: '',
}

interface DepartmentAndOrgSelectType extends TreeSelectProps {
    placeholder?: string
    status?: any
    defaultValue?: string
    getInitValueError?: (result: string) => void
    allowClear?: boolean
    unCategorizedObj?: any
    disabled?: boolean
    onSelect?: (value: any, label?: any, key?: string) => void
    // 以下值特殊用于处室
    // 是否禁用非叶子节点部门，在有rootId节点下使用
    disableNonLeftDeptNode?: boolean
    // 祖宗节点Id，若有此值，则以此id作为祖宗节点Id
    rootId?: string
    // 需要展示的组织架构类型
    rootArchitType?: string
    // 展开的组织架构类型
    loadArchitType?: Array<string>
    // 禁用选择类型
    disableArchitType?: Array<string>
    // 是否获取全部对象，默认false
    // isAll?: boolean
    onTreeDataChange?: (data) => void
    // 唯一标识
    selectKey?: string
    // 是否检查registered字段并禁用已注册的机构，默认false
    checkRegistered?: boolean
    // 是否检查registered字段并禁用未注册的机构，默认false
    checkUnRegistered?: boolean
    // 自定义空值Key
    nullKey?: string
}

const DepartmentAndOrgSelect = forwardRef(
    (
        {
            value,
            status,
            placeholder,
            onSelect = noop,
            onChange = noop,
            defaultValue,
            disableNonLeftDeptNode = false,
            rootId,
            rootArchitType = Architecture.ORGANIZATION,
            disableArchitType = [],
            loadArchitType = [Architecture.DEPARTMENT],
            // isAll = false,
            getInitValueError = noop,
            allowClear = false,
            unCategorizedObj,
            disabled = false,
            selectKey,
            checkRegistered = false,
            checkUnRegistered = false,
            nullKey,
            ...otherAttrConfig
        }: DepartmentAndOrgSelectType,
        ref,
    ) => {
        const [treeData, setTreeData] = useState<any>([])

        const [treeExpandedKeys, setTreeExpandedKeys] = useState<Array<string>>(
            [],
        )
        const [selectedValue, setSelectedValue] = useState<any>(undefined)
        const [loading, setLoading] = useState<boolean>(false)

        const [treeIsInit, setTreeIsInit] = useState<boolean>(false)

        const [defaultDetail, setDefaultDetail] = useState<any>(undefined)

        const [treeOpen, setTreeOpen] = useState<boolean>(false)
        const [searchValue, setSearchValue] = useState<string>('')

        const debounceSearch = useDebounce(searchValue, {
            wait: 500,
        })

        const scrollDivRef = useRef<HTMLDivElement>(null)

        const scrollDivId = 'scrollDiv'

        const [searchSelectNodes, setSearchSelectNodes] = useState<any[]>([])

        const [searchTotalCount, setSearchTotalCount] = useState<number>(0)

        const [listDataLoading, setListDataLoading] = useState<boolean>(false)

        /**
         * 检查节点是否应该被禁用
         * @param node 节点数据
         * @returns 是否禁用
         */
        const isNodeDisabled = (node: any): boolean => {
            // 检查是否是已注册的机构
            const isRegistered = checkRegistered && node.registered === 2

            const isUnRegistered = checkUnRegistered && node.registered === 1

            // 检查是否是被禁用的架构类型
            const isDisabledType = disableArchitType.includes(node.type)

            return isRegistered || isUnRegistered || isDisabledType
        }

        /**
         * 获取禁用原因文案
         */
        const getDisabledReason = (node: any): string => {
            if (checkRegistered && node.registered === 2)
                return __('机构已注册')
            if (checkUnRegistered && node.registered === 1)
                return __('机构未注册')
            return ''
        }

        /**
         * 获取节点的 name 属性（用于 TreeSelect 显示）
         * @param node 节点数据
         * @returns JSX 元素
         */
        const getNodeName = (node: any): React.ReactElement => {
            const disabledReason = getDisabledReason(node)
            const titleText = disabledReason || node?.path || node?.name
            return <span title={titleText}>{node?.name}</span>
        }

        useEffect(() => {
            if (!loading) {
                setSelectedValue(value)
            }
        }, [value])

        // useEffect(() => {
        //     setTreeExpandedKeys([])
        //     if (defaultValue) {
        //         setSelectedValue(undefined)
        //         getDefaultDepartmentInfo(defaultValue)
        //     } else {
        //         getNodeObjects({
        //             limit: 0,
        //             id: '',
        //             is_all: false,
        //             type: Architecture.ORGANIZATION,
        //         })
        //     }
        // }, [defaultValue])

        useImperativeHandle(ref, () => ({
            treeData,
        }))

        /**
         * 获取节点对象
         * @param params
         */
        const getNodeObjects = async (params: IGetObject) => {
            try {
                setLoading(true)
                const res = await getObjects(params)
                const data = unCategorizedObj?.id
                    ? [...res.entries, unCategorizedObj]
                    : res.entries
                setTreeData(
                    data.map((node) => ({
                        ...node,
                        isLeaf: !node.expand,
                        title: node.name,
                        name: getNodeName(node),
                        pId: '',
                        disabled: isNodeDisabled(node),
                        icon: node.id !== unCategorizedObj?.id && (
                            <Icons type={node.type as Architecture} />
                        ),
                    })),
                )
            } catch (error) {
                formatError(error)
            } finally {
                setLoading(false)
            }
        }

        /**
         * 获取根节点参数
         */
        const rootNodeParams: any = useMemo(() => {
            const params: AnyKindOfDictionary = {
                limit: 0,
                // is_all: isAll,
                id: '',
                is_all: false,
                type: rootArchitType,
            }

            if (rootId) {
                params.id = rootId
            }
            // getNodeObjects(params)

            return params
        }, [rootId])

        /**
         * 初始化
         */
        useEffect(() => {
            setTreeExpandedKeys([])
            setTreeIsInit(false)
            // 自定义空值不进行初始化
            if (defaultValue && defaultValue !== nullKey) {
                setSelectedValue(undefined)
                getDefaultDepartmentInfo(defaultValue)
            } else {
                // getNodeObjects(rootNodeParams)
            }
        }, [defaultValue, nullKey])

        useImperativeHandle(ref, () => ({
            treeData,
        }))

        useEffect(() => {
            if (debounceSearch) {
                getObjectsBySearch(
                    {
                        keyword: debounceSearch,
                        offset: 1,
                    },
                    [],
                )
            }
        }, [debounceSearch])

        const getObjectsBySearch = async (params: any, lastData: any[]) => {
            try {
                setListDataLoading(true)
                const searchParams = {
                    ...defaultSearchParams,
                    ...params,
                }
                const res = await getObjectsWithCancel(searchParams)
                setSearchSelectNodes([...lastData, ...res.entries])
                setSearchTotalCount(res.total_count)
            } catch (err) {
                formatError(err)
            } finally {
                setListDataLoading(false)
            }
        }

        const onLoadData: TreeSelectProps['loadData'] = async ({
            id,
            type,
        }) => {
            try {
                const loadParams: any = {
                    limit: 0,
                    id,
                    // is_all: isAll,
                    is_all: false,
                }
                if (loadArchitType) {
                    loadParams.type = loadArchitType.join(',')
                }
                const res = await getObjects(loadParams)
                setTreeData(
                    treeData.concat(
                        res.entries
                            .map((node) => ({
                                ...node,
                                title: node.name,
                                name: getNodeName(node),
                                pId: id,
                                isLeaf: !node.expand,
                                disabled: isNodeDisabled(node),
                                icon: (
                                    <Icons type={node.type as Architecture} />
                                ),
                            }))
                            .filter((node) =>
                                [
                                    Architecture.ORGANIZATION,
                                    Architecture.DEPARTMENT,
                                ].includes(node.type as Architecture),
                            ),
                    ),
                )
                setTreeExpandedKeys([...treeExpandedKeys, id])
            } catch (err) {
                formatError(err)
            }
        }

        const getLoadData = async ({ id }) => {
            try {
                const res = await getObjects({
                    limit: 0,
                    id,
                    // is_all: isAll,
                    is_all: false,
                })
                return res.entries
                    .map((node) => ({
                        ...node,
                        title: node.name,
                        name: getNodeName(node),
                        pId: id,
                        isLeaf: !node.expand,
                        disabled: isNodeDisabled(node),
                        icon: <Icons type={node.type as Architecture} />,
                    }))
                    .filter((node) =>
                        [
                            Architecture.ORGANIZATION,
                            Architecture.DEPARTMENT,
                        ].includes(node.type as Architecture),
                    )
            } catch (err) {
                if (
                    err?.data?.code ===
                        'ConfigurationCenter.BusinessStructure.RecordNotFoundError' ||
                    err.data.code ===
                        'ConfigurationCenter.BusinessStructure.ObjectNotFound'
                ) {
                    getInitValueError(__('该部门已被删除，请重新选择'))
                } else {
                    getInitValueError(err?.data?.description)
                }
                formatError(err)
                return Promise.resolve([])
            }
        }

        const getRootNode = async (params: IGetObject) => {
            try {
                const res = await getObjects(params)
                return res.entries.map((node) => ({
                    ...node,
                    isLeaf: !node.expand,
                    title: node.name,
                    name: getNodeName(node),
                    pId: '',
                    disabled: isNodeDisabled(node),
                    icon: <Icons type={node.type as Architecture} />,
                }))
            } catch (err) {
                formatError(err)
                return Promise.resolve([])
            }
        }

        /**
         * 获取默认部门信息
         * @param id
         */
        const getDefaultDepartmentInfo = async (id: string) => {
            try {
                setLoading(true)
                const res: any = await getObjectDetails(id)
                const pathIds = res?.path_id?.split('/') || []
                // 找到treeExpandedKeys中不包含的pathIds
                const notIncludedPathIds = pathIds.filter(
                    (pathId) => !treeExpandedKeys.includes(pathId),
                )
                setTimeout(() => {
                    if (treeExpandedKeys.length && notIncludedPathIds.length) {
                        setTreeExpandedKeys([
                            ...treeExpandedKeys,
                            ...notIncludedPathIds,
                        ])
                    } else {
                        setTreeExpandedKeys(pathIds)
                    }

                    setSelectedValue(res?.id)
                }, 100)
                setDefaultDetail(res)
            } catch (ex) {
                setTimeout(() => {
                    setTreeExpandedKeys([])
                }, 100)
                if (
                    ex.data.code ===
                    'ConfigurationCenter.BusinessStructure.RecordNotFoundError'
                ) {
                    getInitValueError(__('该部门已被删除，请重新选择'))
                } else {
                    formatError(ex)
                }
            } finally {
                setLoading(false)
            }
        }

        /**
         * 展开树数据到默认详情
         */
        const expandTreeDataToDefaultDetail = async () => {
            try {
                if (defaultDetail) {
                    const pathIds = defaultDetail?.path_id?.split('/') || []

                    const unLoadData =
                        pathIds?.filter(
                            (currentId) =>
                                !treeData.find(
                                    (treeinfo) => treeinfo.pid === currentId,
                                ),
                        ) || []

                    const newNodes = (
                        await Promise.all(
                            unLoadData.map((currentId) =>
                                getLoadData({ id: currentId } as any),
                            ),
                        )
                    )
                        ?.flat()
                        ?.map((node) => ({
                            ...node,
                            disabled: isNodeDisabled(node),
                        }))

                    if (treeData.length) {
                        setTreeData([...treeData, ...newNodes])
                    } else {
                        const rootNode = await getRootNode(rootNodeParams)
                        setTreeData([...rootNode, ...newNodes])
                    }
                } else {
                    // setTimeout(() => {
                    //     setTreeExpandedKeys([])
                    // }, 100)
                    getNodeObjects(rootNodeParams)
                }
            } catch (err) {
                formatError(err)
            }
        }

        /**
         * 展开树数据到搜索选择节点
         * @param path_id 搜索选择节点的path_id
         */
        const expandTreeDataToSearchSelectNode = async (path_id: string) => {
            const pathIds = path_id.split('/')
            if (pathIds.length > 1) {
                const expandResult = await expandNodeByPathIds(
                    pathIds.slice(0, -1),
                )

                setTreeData([...treeData, ...expandResult])
                setTreeExpandedKeys(
                    uniq([...treeExpandedKeys, ...pathIds.slice(0, -1)]),
                )
            }
        }

        /**
         * 根据path_id展开树数据
         * @param expandPathIds 需要展开的path_id数组
         * @returns 展开后的树数据
         */
        const expandNodeByPathIds = async (expandPathIds: string[]) => {
            const firstPathId = expandPathIds[0]
            let newTreeData: any[] = []
            if (expandPathIds.length === 0) {
                return []
            }

            if (treeExpandedKeys.includes(firstPathId)) {
                if (expandPathIds.length > 1) {
                    const expandResult = await expandNodeByPathIds(
                        expandPathIds.slice(1),
                    )
                    newTreeData = [...newTreeData, ...expandResult]
                }
            } else {
                const newNodes = await getLoadData({ id: firstPathId })
                if (expandPathIds.length > 1) {
                    const childNodes = await expandNodeByPathIds(
                        expandPathIds.slice(1),
                    )
                    newTreeData = [...newNodes, ...childNodes]
                } else {
                    newTreeData = [...newNodes]
                }
            }
            return newTreeData
        }

        const onSearchSelectNode = (node: any) => {
            setSearchValue('')

            onSelect(
                node.id,
                {
                    ...node,
                    title: node.name,
                },
                selectKey,
            )
            onChange(node.id, node.name, node.path_id)
            expandTreeDataToSearchSelectNode(node.path_id)
            setTreeOpen(false)
        }

        const getSearchSelectNodes = () => {
            return (
                <div
                    className={styles.selectedNodesContainer}
                    ref={scrollDivRef}
                    id={scrollDivId}
                >
                    <InfiniteScroll
                        hasMore={searchSelectNodes?.length < searchTotalCount}
                        dataLength={searchSelectNodes?.length || 0}
                        scrollableTarget={scrollDivId}
                        loader={
                            <div
                                className={styles.listLoading}
                                hidden={!listDataLoading}
                            >
                                <Loader />
                            </div>
                        }
                        next={() => {
                            getObjectsBySearch(
                                {
                                    keyword: debounceSearch,
                                    offset: 1,
                                },
                                searchSelectNodes,
                            )
                        }}
                    >
                        {searchSelectNodes.map((node) => {
                            const disabledItem = isNodeDisabled(node)
                            const disabledReason = getDisabledReason(node)
                            const titleText = disabledReason || ''
                            return (
                                <div
                                    key={node.id}
                                    className={classNames(
                                        styles.searchSelectNodes,
                                        node.id === value &&
                                            styles.searchSelectNodesSelected,
                                        disabledItem &&
                                            styles.searchSelectNodesDisabled,
                                    )}
                                    onClick={(e) => {
                                        if (disabledItem) return
                                        onSearchSelectNode(node)
                                    }}
                                    aria-disabled={disabledItem}
                                    title={titleText}
                                >
                                    <div className={styles.nodeName}>
                                        <Icons
                                            type={node.type as Architecture}
                                        />
                                        <span
                                            title={node.name}
                                            className={styles.nodeNameText}
                                        >
                                            {node.name}
                                        </span>
                                    </div>
                                    <div
                                        className={styles.nodePath}
                                        title={node.path}
                                    >
                                        {node.path}
                                    </div>
                                </div>
                            )
                        })}
                    </InfiniteScroll>
                </div>
            )
        }

        return (
            <TreeSelect
                treeDataSimpleMode
                getPopupContainer={(node) => node.parentNode}
                style={{ width: '100%' }}
                dropdownStyle={{
                    width: '100%',
                    maxHeight: 400,
                    overflow: 'auto',
                }}
                value={
                    defaultDetail && !treeIsInit && selectedValue
                        ? defaultDetail?.name
                        : (selectedValue as any)
                }
                treeExpandedKeys={treeExpandedKeys}
                onTreeExpand={(expandedKeys) => {
                    setTreeExpandedKeys(expandedKeys as string[])
                }}
                treeLoadedKeys={treeExpandedKeys}
                treeDefaultExpandAll
                onChange={onChange}
                onSelect={(changedValue, info) => {
                    onSelect(changedValue, info, selectKey)
                }}
                open={treeOpen}
                dropdownMatchSelectWidth={false}
                placeholder={placeholder || __('请选择所属部门')}
                loadData={onLoadData}
                treeData={treeData}
                status={status}
                switcherIcon={<DownOutlined />}
                fieldNames={{
                    label: 'name',
                    value: 'id',
                }}
                allowClear={allowClear}
                popupClassName={classNames(
                    styles.orgTreeSelect,
                    unCategorizedObj?.id && styles.hasUnCategorized,
                )}
                disabled={disabled}
                treeIcon
                showSearch
                onSearch={(inputValue) => {
                    setSearchValue(inputValue)
                }}
                dropdownRender={
                    debounceSearch && searchSelectNodes?.length > 0
                        ? getSearchSelectNodes
                        : undefined
                }
                notFoundContent={<Empty />}
                onDropdownVisibleChange={async (visible) => {
                    setTreeOpen(visible)
                    if (visible && !treeIsInit) {
                        if (defaultDetail) {
                            await expandTreeDataToDefaultDetail()
                        } else {
                            await getNodeObjects(rootNodeParams)
                        }
                        setTreeIsInit(true)
                    }
                }}
                {...otherAttrConfig}
            />
        )
    },
)

export default DepartmentAndOrgSelect
