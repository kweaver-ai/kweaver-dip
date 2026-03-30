import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react'
import { Button, Space, Tooltip } from 'antd'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ExclamationCircleFilled } from '@ant-design/icons'
import { noop } from 'lodash'
import { SortOrder } from 'antd/es/table/interface'
import classnames from 'classnames'
import { LightweightSearch, SearchInput } from '@/ui'
import {
    AssetTypeEnum,
    LoginPlatform,
    SortDirection,
    allRoleList,
    formatError,
    getAccessibleIndicatorsList,
    getIndictorList,
    getRoleUsers,
} from '@/core'
import OrgAndDepartmentFilterTree from '../OrgAndDepartmentFilterTree'
import { RefreshBtn, SortBtn } from '@/components/ToolbarComponents'
import DropDownFilter from '@/components/DropDownFilter'
import { DataNode, Architecture } from '../../BusinessArchitecture/const'
import { AvatarOutlined, FiltersOutlined, InfotipOutlined } from '@/icons'
import dataEmpty from '@/assets/dataEmpty.svg'
import searchEmpty from '@/assets/searchEmpty.svg'
import styles from './styles.module.less'
import __ from '../locale'
import {
    IAvailableAssetsQueryList,
    InitCondition,
    indicatorSortMenus,
    indicatorSortType,
    ApiSortType,
    AssetVisitorTypes,
    checkoutAssetHasExpired,
} from '../const'
import { labelText } from '@/components/AccessPolicy/helper'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import CommonTable from '@/components/CommonTable'
import { IndicatorTypes } from '@/components/AccessPolicy/const'
import { IformItem, SearchType } from '@/ui/LightweightSearch/const'
import ApplyPolicy from '@/components/AccessPolicy/ApplyPolicy'
import { useAuditProcess } from '@/hooks/useAuditProcess'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { BizType, PolicyType } from '@/components/AuditPolicy/const'
import IndicatorIcons from '@/components/IndicatorManage/IndicatorIcons'
import IndicatorViewDetail from '@/components/DataAssetsCatlg/IndicatorViewDetail'
import { formatTime, getActualUrl, getPlatformNumber } from '@/utils'
import { useAssetsContext } from '../AssetsVisitorProvider'
import AccessModal from '@/components/AccessPolicy/AccessModal'
import { DataRescType } from '@/components/DataAssetsCatlg/ApplicationService/helper'
import { checkAuditPolicyPermis } from '@/components/DataAssetsCatlg/helper'
import { AssetItemType, getSearchFormData } from './helper'
import SearchLayout from '@/components/SearchLayout'

const ParamKeys = {
    isOwner: [
        'offset',
        'limit',
        'direction',
        'sort',
        'is_owner',
        'keyword',
        'indicator_type',
        'management_department_id',
        'data_owner',
        'policy_status',
        'is_authed',
    ],
    unOwner: [
        'offset',
        'limit',
        'direction',
        'sort',
        // 'owner_id',
        'keyword',
        'indicator_type',
        'management_department_id',
        'policy_status',
    ],
}

const OriginSelectComponent: React.FC<{
    value?: any
    onChange?: (value: any) => void
}> = ({ onChange = noop, value }) => {
    return (
        <OrgAndDepartmentFilterTree
            getSelectedNode={(sn) => {
                onChange(sn.id)
            }}
            filterType={[
                Architecture.ORGANIZATION,
                Architecture.DEPARTMENT,
            ].join()}
        />
    )
}

const IndicatorAsset: React.FC<any> = () => {
    const [searchParams, setSearchParams] = useSearchParams()
    const assetType = searchParams.get('assetType') || undefined
    const owner = searchParams.get('owner') || undefined
    const [{ using }, updateUsing] = useGeneralConfig()
    const [ownerId] = useCurrentUser('ID')
    // 获取权限的hook
    /**
     * 使用状态钩子来管理组件中是否为所有者的状态。
     * 这个状态用于确定用户是否具有对某些资源的所有权权限。
     */
    const [isOwner, setIsOwner] = useState<boolean>(false)

    /**
     * 使用状态钩子来管理筛选标题的状态。
     * 筛选标题显示在筛选弹出窗口的顶部，用于提示用户当前的筛选条件。
     * 初始值通过翻译函数获取，以支持多语言。
     */
    const [filterTitle, setFilterTitle] = useState<string>(__('筛选'))

    /**
     * 使用状态钩子来管理筛选弹出窗口是否可见的状态。
     * 这个状态控制筛选弹出窗口的显示和隐藏，用户可以通过点击按钮来切换这个状态。
     */
    const [isFilterPop, setIsFilterPop] = useState<boolean>(false)
    // 判断当前用户是否存在数据owner的角色
    // const isDataOwner = getAccess(
    //     `${ResourceType.auth_service}.${RequestType.get}`,
    // )

    const [publishSortOrder, setPublishSortOrder] =
        useState<SortOrder>('descend')
    const { selectedId, selectedType, isDataOwner } = useAssetsContext()

    const navigate = useNavigate()
    const platform = getPlatformNumber()
    // 是否启用数据资源
    const enableDataCatlg = using === 1
    // 默认排序
    const defaultSort = {
        key: indicatorSortMenus[1].key,
        sort: SortDirection.DESC,
    }
    /**
     * 使用状态钩子初始化搜索条件。
     * 这里使用了解构赋值来初始化搜索条件的状态，同时合并了初始条件和默认排序条件。
     * 目的是为了在组件加载时设定默认的搜索条件和排序方式。
     */
    const [searchCondition, setSearchCondition] =
        useState<IAvailableAssetsQueryList>({
            ...InitCondition,
            direction: defaultSort.sort,
            sort: defaultSort.key,
        })

    /**
     * 使用 useRef 钩子来保持搜索值的引用。
     * 这个引用不会触发组件的重新渲染，适用于存储不会改变的值或者临时数据。
     */
    const searchValue = useRef<string>('')

    /**
     * 初始化排序条件的状态。
     * 使用 useState 钩子来管理排序条件的变化，初始值设置为默认排序条件。
     * 这允许用户在界面中选择不同的排序方式时动态更新排序条件。
     */
    const [selectedSort, setSelectedSort] = useState<any>(defaultSort)

    /**
     * 使用 useRef 钩子来获取普通表格的引用。
     * 这个引用可以用于在不触发组件重新渲染的情况下操作表格，比如滚动条的位置控制或者特定行的高亮。
     */
    const commonTableRef = useRef<any>()
    const searchFormRef = useRef<any>()
    const [formData, setFormData] = useState<any[]>([])
    const [searchIsExpansion, setSearchIsExpansion] = useState<boolean>(false)
    const [tableHeight, setTableHeight] = useState<number>(0)

    const hasSearchCondition = useMemo(() => {
        return (
            searchCondition.keyword ||
            searchCondition.org_code ||
            searchCondition.indicator_type ||
            searchCondition.policy_status
        )
    }, [searchCondition])

    useEffect(() => {
        // 展开/收起查询条件高度
        const defalutHeight: number = !searchIsExpansion ? 376 : 480
        // 已选搜索条件高度
        const searchConditionHeight: number = hasSearchCondition ? 41 : 0
        const height = defalutHeight + searchConditionHeight

        setTableHeight(height)
    }, [hasSearchCondition, searchIsExpansion])

    const [currentRow, setCurrentRow] = useState<any>({})

    const [indicatorDetailsOpen, setIndicatorDetailsOpen] =
        useState<boolean>(false)

    const [accessVisible, setAccessVisible] = useState<boolean>(false)

    // 创建表头排序
    const [tableSort, setTableSort] = useState<{
        [key: string]: SortOrder | undefined
    }>({
        [indicatorSortType.UPDATE]: 'descend',
        [indicatorSortType.NAME]: undefined,
    })
    const [applyVisible, setApplyVisible] = useState<boolean>(false)
    const [hasAuditProcess, setHasAuditProcess] = useState<boolean>(false)
    const [permissionData, setPermissionData] = useState<{
        [key: string]: any
    }>({})

    const sorterAttr = using === 1 ? ApiSortType.PUBLISH : ApiSortType.ONLINE

    useEffect(() => {
        if (isOwner && !formData.length) {
            getAllOwnerUsers()
        }
    }, [isOwner, formData])

    useEffect(() => {
        searchFormRef.current?.changeFormValues({
            data_owner: undefined,
        })
    }, [isOwner])

    // 获取所有数据owner用户
    const getAllOwnerUsers = async () => {
        try {
            const res = await getRoleUsers(allRoleList.TCDataOwner, {
                limit: 2000,
            })

            const list = res?.entries ? [...res.entries] : []
            const formDataList = getSearchFormData(AssetItemType.Indicator).map(
                (item) => {
                    const obj: any = { ...item }
                    if (obj.key === 'data_owner') {
                        obj.itemProps.options = list.map((it) => ({
                            ...it,
                            icon: (
                                <div className={styles.avatarWrapper}>
                                    <AvatarOutlined
                                        className={styles.avatarIcon}
                                    />
                                </div>
                            ),
                        }))
                    }
                    return obj
                },
            )
            setFormData(formDataList)
        } catch (error) {
            formatError(error)
        }
    }

    const queryParams = useMemo(() => {
        const params: any = searchCondition
        if (isOwner) {
            params.management_department_id = params.org_code
            params.is_owner = true
            params.is_authed = true
        } else {
            params.management_department_id = params.org_code
        }
        const ObjParams = Object.keys(params).reduce((prev, key) => {
            if (ParamKeys[isOwner ? 'isOwner' : 'unOwner'].includes(key)) {
                // eslint-disable-next-line no-param-reassign
                prev[key] = params[key]
            }
            return prev
        }, {})

        return {
            ...ObjParams,
            app_id:
                selectedType === AssetVisitorTypes.APPLICATION
                    ? selectedId
                    : undefined,
        }
    }, [searchCondition, isOwner, selectedId, selectedType])

    useEffect(() => {
        if (assetType === 'indicator') {
            if (isDataOwner !== null) {
                if (owner) {
                    setIsOwner(owner === 'true')
                }
                searchParams.delete('assetType')
                searchParams.delete('owner')
                setSearchParams(searchParams)
            }
        }
    }, [assetType])

    const toAccess = (item: any) => {
        setCurrentRow(item)
        setAccessVisible(true)
    }

    const toApply = (item) => {
        setCurrentRow(item)
        setApplyVisible(true)
    }

    // const [hasAuditProcess, refreshAuditProcess] = useAuditProcess({
    //     audit_type: PolicyType.AssetPermission,
    //     service_type: BizType.AuthService,
    // })

    // 分离权限检查逻辑
    const checkPermissions = useCallback(async (data: any[]) => {
        if (!data || data.length === 0) return

        try {
            const processData = data.map((item) => ({
                ...item,
                typeKey: DataRescType.INDICATOR,
            }))

            const res = await checkAuditPolicyPermis(processData, {
                id: 'id',
                type: 'typeKey',
            })

            if (Array.isArray(res)) {
                // 将权限信息存储到独立的状态中，避免修改原始数据
                const permissionMap = {}
                res.forEach((item) => {
                    if (item.id) {
                        permissionMap[item.id] = {
                            hasInnerEnablePolicy: item.hasInnerEnablePolicy,
                            hasCustomEnablePolicy: item.hasCustomEnablePolicy,
                            hasAuditEnablePolicy: item.hasAuditEnablePolicy,
                        }
                    }
                })

                setPermissionData(permissionMap)

                // 检查是否有审核流程
                const hasProcess = res.some(
                    (item) =>
                        item.hasInnerEnablePolicy || item.hasCustomEnablePolicy,
                )
                setHasAuditProcess(hasProcess)
            }
        } catch (error) {
            formatError(error)
            setHasAuditProcess(false)
        }
    }, [])

    // 获取权限信息的工具函数
    const getPermissionInfo = useCallback(
        (recordId: string) => {
            return (
                permissionData[recordId] || {
                    hasInnerEnablePolicy: false,
                    hasCustomEnablePolicy: false,
                    hasAuditEnablePolicy: false,
                }
            )
        },
        [permissionData],
    )

    // 只做数据转换，不做权限检查
    const handleDataProcessor = useCallback(
        (data: any[]) => {
            if (!data || data.length === 0) return data
            // 非Owner 才检查权限
            if (!isOwner) {
                checkPermissions(data)
            }
            return data
        },
        [checkPermissions, isOwner],
    )

    const onChangeMenuToTableSort = (selectedMenu) => {
        setTableSort({
            [indicatorSortType.UPDATE]: null,
            [indicatorSortType.NAME]: null,
            [selectedMenu.key]:
                selectedMenu.sort === SortDirection.ASC ? 'ascend' : 'descend',
        })
    }
    /** 表项 */
    const columns = [
        {
            title: (
                <div>
                    <span>{__('指标名称')}</span>
                    <span style={{ color: 'rgba(0,0,0,0.45)' }}>
                        {__('（编码）')}
                    </span>
                </div>
            ),
            dataIndex: 'name',
            key: 'name',
            sorter: true,
            sortOrder: tableSort.name,
            showSorterTooltip: {
                title: __('按指标名称排序'),
            },
            render: (text, record) => (
                <div className={styles.assetInfo}>
                    <span>
                        <IndicatorIcons
                            type={record.indicator_type}
                            fontSize={20}
                        />
                    </span>
                    <div className={styles.assetName} title={text || '--'}>
                        <div className={styles.assetNameWrapper}>
                            <span
                                title={text}
                                onClick={() => toDetails(record)}
                                className={styles.ellipsis}
                            >
                                {text || (
                                    <span style={{ color: 'rgba(0,0,0,0.45)' }}>
                                        --
                                    </span>
                                )}
                            </span>
                            {record?.policies &&
                                checkoutAssetHasExpired(record.policies) && (
                                    <Tooltip
                                        title={__('有过期')}
                                        placement="bottom"
                                    >
                                        <ExclamationCircleFilled
                                            style={{
                                                color: 'rgb(250, 173, 20)',
                                                fontSize: 16,
                                            }}
                                        />
                                    </Tooltip>
                                )}
                        </div>
                        <div
                            className={styles.ellipsis}
                            title={record.code}
                            style={{
                                color: 'rgba(0, 0, 0, 0.45)',
                                fontSize: '12px',
                            }}
                        >
                            {record.code}
                        </div>
                    </div>
                </div>
            ),
            ellipsis: true,
        },
        {
            title: __('数据Owner'),
            dataIndex: 'owners',
            key: 'owners',
            ellipsis: true,
            render: (arr: any[], record) => {
                const ownerNames = arr
                    ?.map((item) => item?.owner_name)
                    ?.join('、')
                return <span title={ownerNames}>{ownerNames || '--'}</span>
            },
        },
        {
            title: __('指标类型'),
            dataIndex: 'indicator_type',
            key: 'indicator_type',
            ellipsis: true,
            render: (value: string) => IndicatorTypes[value],
        },
        {
            title: __('所属主题'),
            dataIndex: 'subject_domain',
            key: 'subject_domain',
            ellipsis: true,
            render: (text, record) =>
                isOwner ? (
                    <span
                        title={record.subject_domain_path || '无'}
                        style={{
                            width: 'calc(100% - 20px)',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                        }}
                    >
                        {labelText(record.subject_domain_name)}
                    </span>
                ) : (
                    <span
                        title={record?.subject_domain_path || '无'}
                        style={{
                            width: 'calc(100% - 20px)',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                        }}
                    >
                        {record?.subject_domain_name || '--'}
                    </span>
                ),
        },
        {
            title: __('所属部门'),
            dataIndex: 'management_department_name',
            key: 'management_department_name',
            ellipsis: true,
            render: (text, record) =>
                isOwner ? (
                    <span title={record.management_department_path || '无'}>
                        {labelText(record.management_department_name)}
                    </span>
                ) : (
                    <span title={record?.management_department_path || '无'}>
                        {labelText(record?.management_department_name) || '--'}
                    </span>
                ),
        },
        {
            title: __('发布时间'),
            dataIndex: 'updated_at',
            key: 'updated_at',
            ellipsis: true,
            sorter: true,
            sortOrder: tableSort.updated_at,
            showSorterTooltip: false,
            render: (text) => formatTime(text) || '--',
        },
        {
            title: (
                <span>
                    {__('操作')}
                    {/* {!hasAuditProcess && !isOwner && (
                        <Tooltip
                            title={<div>{__('仅读取权限无操作选项')}</div>}
                            color="#fff"
                            placement="top"
                            overlayInnerStyle={{ color: 'rgba(0,0,0,0.65)' }}
                            overlayStyle={{
                                maxWidth: 500,
                            }}
                        >
                            <InfotipOutlined style={{ marginLeft: 8 }} />
                        </Tooltip>
                    )} */}
                </span>
            ),
            key: 'action',
            width: 160,
            render: (text: string, record) => {
                const permissionInfo = getPermissionInfo(record.id)
                const isAccessBtnShowByPolicy =
                    permissionInfo?.hasInnerEnablePolicy ||
                    permissionInfo?.hasCustomEnablePolicy
                const isAccessBtnDisableByPolicy = !(
                    permissionInfo?.hasInnerEnablePolicy ||
                    permissionInfo?.hasAuditEnablePolicy
                )
                return (
                    <Space direction="horizontal" size={12}>
                        <a onClick={() => toDetails(record)}>{__('详情')}</a>
                        {/* // TODO : 权限变更申请  数据下载 */}
                        {isOwner && isDataOwner ? (
                            <a
                                onClick={(e) => {
                                    e.stopPropagation()
                                    toAccess(record)
                                }}
                            >
                                {__('资源授权')}
                            </a>
                        ) : isAccessBtnShowByPolicy ? (
                            <Tooltip
                                title={
                                    isAccessBtnDisableByPolicy
                                        ? __(
                                              '无匹配的审核流程，不能进行权限申请',
                                          )
                                        : ''
                                }
                                overlayStyle={{
                                    maxWidth: 500,
                                }}
                            >
                                <Button
                                    ghost
                                    type="link"
                                    style={{ padding: 0 }}
                                    disabled={isAccessBtnDisableByPolicy}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        toApply(record)
                                    }}
                                >
                                    {__('权限变更申请')}
                                </Button>
                            </Tooltip>
                        ) : null}
                    </Space>
                )
            },
        },
    ]

    // const ownerColumns = useMemo(
    //     () => columns.filter((o) => o.dataIndex !== 'owners'),
    //     [isOwner, tableSort],
    // )
    /**
     * 将项的详细信息打开到当前行。
     *
     * 此函数用于在用户界面中，当用户点击某项时，将该项的详细信息显示在详情面板中。
     * 它通过设置当前行数据和打开详情面板的状态来实现这一功能。
     *
     * @param item 任意类型的项，代表被点击的项。
     */
    const toDetails = (item: any) => {
        setCurrentRow(item) // 设置当前选中的行数据
        setIndicatorDetailsOpen(true) // 打开详情面板
    }

    /**
     * 选择组织部门时调用的函数。
     *
     * 用于更新搜索条件和设置筛选标题，并关闭筛选弹窗。
     * 如果传入了部门节点，则更新搜索条件为该部门，并设置筛选标题；否则，重置搜索条件并设置筛选标题为"筛选"。
     *
     * @param sn 部门节点数据，可选。用于更新搜索条件。
     * @param delNode 需要删除的部门节点数据，可选。当前未使用，预留参数。
     */
    /** 选择组织部门 */
    const chooseFilter = (sn?: DataNode, delNode?: DataNode) => {
        if (sn) {
            // 根据选中的部门节点，构建新的搜索条件
            const org = {
                org_code: sn.id,
            }
            // 更新搜索条件，并重置分页偏移量为1，以加载新的数据
            setSearchCondition((prev) => ({
                ...prev,
                offset: 1,
                ...org,
            }))
            // 设置筛选标题，显示已选部门的名称
            setFilterTitle(sn.id ? `${__('已选部门：')}${sn.name}` : __('筛选'))
        }
        // 关闭筛选弹窗
        setIsFilterPop(false)
    }

    /**
     * 处理排序方式的变化
     *
     * 当用户选择不同的排序方式时，此函数被调用以更新排序顺序和搜索条件。
     * 它不仅改变了排序的升序或降序状态，还更新了分页信息，确保搜索结果根据新的条件正确呈现。
     *
     * @param selectedMenu 当前选择的菜单项，包含排序方式和排序键。
     * @param pagination 分页信息，可选参数，用于更新当前页码和每页条数。
     */
    const handleSortWayChange = (selectedMenu, pagination?: any) => {
        if (selectedMenu) {
            // 根据selectedMenu的sort值，决定设置升序还是降序
            setPublishSortOrder(
                selectedMenu.sort === 'asc' ? 'ascend' : 'descend',
            )
            // 更新搜索条件，包括排序方向、排序键、当前页码和每页条数
            setSearchCondition((prev) => ({
                ...prev,
                offset: pagination?.current || 1,
                limit: pagination?.pageSize || prev.limit,
                direction: selectedMenu.sort,
                sort: selectedMenu.key,
            }))
            setSelectedSort(selectedMenu)
            onChangeMenuToTableSort(selectedMenu)
        }
    }

    /**
     * 处理表格排序变化的回调函数。
     *
     * 当表格的排序条件发生变化时，此函数将被调用。它会根据排序的列和方向来更新排序状态，
     * 并调用相应的处理函数来应用这些变化。
     *
     * @param pagination 表格的分页信息。当前不直接使用，但保留以支持未来可能的需求。
     * @param sorter 表格的排序信息，包括排序的列和方向。
     */
    const handleTableChange = (sorter) => {
        const sorterKey = sorter.columnKey

        if (sorter.column) {
            setTableSort({
                [indicatorSortType.UPDATE]: null,
                [indicatorSortType.NAME]: null,
                [sorterKey]: sorter.order || 'ascend',
            })
            return {
                key: sorterKey,
                sort:
                    sorter.order === 'ascend'
                        ? SortDirection.ASC
                        : SortDirection.DESC,
            }
        }

        setTableSort({
            [indicatorSortType.UPDATE]: null,
            [indicatorSortType.NAME]: null,
            [sorterKey]:
                searchCondition.direction === SortDirection.ASC
                    ? 'descend'
                    : 'ascend',
        })

        return {
            key: searchCondition.sort,
            sort:
                searchCondition.direction === SortDirection.ASC
                    ? SortDirection.DESC
                    : SortDirection.ASC,
        }
    }
    const searchChange = (searchParam, key) => {
        if (!key) {
            // 重置
            setSearchCondition((prev) => ({
                ...prev,
                offset: 1,
                ...searchParam,
            }))
        } else if (searchParam[key]) {
            setSearchCondition((prev) => ({
                ...prev,
                offset: 1,
                [key]: searchParam[key],
            }))
        } else {
            setSearchCondition((prev) => ({
                ...prev,
                offset: 1,
                [key]: undefined,
            }))
        }
    }

    const getDataList = (params) => {
        return getIndictorList(params)
    }

    const getAvailableIndicator = (params) => {
        if (selectedType === AssetVisitorTypes.None) {
            return Promise.resolve({
                entries: [],
                total: 0,
            })
        }
        if (selectedType === AssetVisitorTypes.APPLICATION && !params?.app_id) {
            return Promise.resolve({
                entries: [],
                total: 0,
            })
        }
        return getAccessibleIndicatorsList(params)
    }

    const commonTableTemplate = () => {
        if (isOwner) {
            return (
                <CommonTable
                    dataProcessor={handleDataProcessor}
                    queryAction={getDataList}
                    params={queryParams}
                    isReplace
                    emptyExcludeField={['publish_status', 'is_all', 'is_owner']}
                    baseProps={{
                        columns,
                        // scroll: {
                        //     y: `calc(100vh - ${320}px)`,
                        // },
                        rowKey: 'id',
                        rowClassName: styles.tableRow,
                    }}
                    scrollY={`calc(100vh - ${isOwner ? tableHeight : 320}px)`}
                    listName={{ total: 'count', entries: 'entries' }}
                    ref={commonTableRef}
                    emptyDesc={
                        <div>
                            {searchValue.current ? (
                                __('抱歉，没有找到相关内容')
                            ) : selectedType === AssetVisitorTypes.USER ? (
                                __('暂无数据')
                            ) : (
                                <div className={styles.appDataEmpty}>
                                    <div>{__('当前应用暂无可用资源')}</div>
                                    {/* {platform === LoginPlatform.default ? (
                                        <div>
                                            <div>
                                                <span>{__('可先从')}</span>
                                                <Button
                                                    type="link"
                                                    onClick={() => {
                                                        if (
                                                            platform ===
                                                            LoginPlatform.default
                                                        ) {
                                                            navigate(
                                                                '/data-assets',
                                                            )
                                                        } else {
                                                            window.open(
                                                                getActualUrl(
                                                                    '/data-assets',
                                                                    true,
                                                                    LoginPlatform.drmp,
                                                                ),
                                                                '_blank',
                                                            )
                                                        }
                                                    }}
                                                >
                                                    {__('数据服务超市')}
                                                </Button>
                                                <span>
                                                    {hasAuditProcess
                                                        ? __(
                                                              '选择要使用的资源，然后进行权限申请或联系数据Owner进行授权',
                                                          )
                                                        : __(
                                                              '选择要使用的资源，然后联系数据Owner进行授权',
                                                          )}
                                                </span>
                                            </div>
                                        </div>
                                    ) : null} */}
                                </div>
                            )}
                        </div>
                    }
                    emptyIcon={searchValue.current ? searchEmpty : dataEmpty}
                    onChange={(pagination, filters, sorter) => {
                        if (pagination.current === searchCondition.offset) {
                            const selectedMenu: any = handleTableChange(sorter)
                            setSelectedSort(selectedMenu)
                            setSearchCondition({
                                ...searchCondition,
                                sort: selectedMenu.key,
                                direction: selectedMenu.sort,
                                offset: 1,
                                limit: pagination?.pageSize,
                            })
                        }
                    }}
                    onTableListUpdated={() => {
                        setSelectedSort(undefined)
                    }}
                />
            )
        }
        if (selectedType === AssetVisitorTypes.APPLICATION && selectedId) {
            return (
                <CommonTable
                    dataProcessor={handleDataProcessor}
                    queryAction={getAvailableIndicator}
                    params={queryParams}
                    isReplace
                    emptyExcludeField={['app_id']}
                    baseProps={{
                        columns,
                        // scroll: {
                        //     y: `calc(100vh - ${320}px)`,
                        // },
                        rowKey: 'id',
                        rowClassName: styles.tableRow,
                    }}
                    scrollY={`calc(100vh - ${isOwner ? tableHeight : 320}px)`}
                    listName={{ total: 'count', entries: 'entries' }}
                    ref={commonTableRef}
                    emptyDesc={
                        <div>
                            {searchValue.current ? (
                                __('抱歉，没有找到相关内容')
                            ) : (
                                <div className={styles.appDataEmpty}>
                                    <div>{__('当前应用暂无可用资源')}</div>
                                    {/* <div>
                                        <div>
                                            <span>{__('可先从')}</span>
                                            <Button
                                                type="link"
                                                onClick={() => {
                                                    if (
                                                        platform ===
                                                        LoginPlatform.default
                                                    ) {
                                                        navigate('/data-assets')
                                                    } else {
                                                        window.open(
                                                            getActualUrl(
                                                                '/data-assets',
                                                                true,
                                                                LoginPlatform.drmp,
                                                            ),
                                                            '_blank',
                                                        )
                                                    }
                                                }}
                                            >
                                                {__('数据服务超市')}
                                            </Button>
                                            <span>
                                                {hasAuditProcess
                                                    ? __(
                                                          '选择要使用的资源，然后进行权限申请或联系数据Owner进行授权',
                                                      )
                                                    : __(
                                                          '选择要使用的资源，然后联系数据Owner进行授权',
                                                      )}
                                            </span>
                                        </div>
                                    </div> */}
                                </div>
                            )}
                        </div>
                    }
                    emptyIcon={searchValue.current ? searchEmpty : dataEmpty}
                    onChange={(pagination, filters, sorter) => {
                        if (pagination.current === searchCondition.offset) {
                            const selectedMenu: any = handleTableChange(sorter)
                            setSelectedSort(selectedMenu)
                            setSearchCondition({
                                ...searchCondition,
                                sort: selectedMenu.key,
                                direction: selectedMenu.sort,
                                offset: 1,
                                limit: pagination?.pageSize,
                            })
                        }
                    }}
                    onTableListUpdated={() => {
                        setSelectedSort(undefined)
                    }}
                />
            )
        }
        return (
            <CommonTable
                dataProcessor={handleDataProcessor}
                queryAction={getAvailableIndicator}
                params={queryParams}
                isReplace
                emptyExcludeField={[]}
                baseProps={{
                    columns,
                    // scroll: {
                    //     y: `calc(100vh - ${320}px)`,
                    // }
                    rowKey: 'id',
                    rowClassName: styles.tableRow,
                }}
                scrollY={`calc(100vh - ${320}px)`}
                listName={{ total: 'count', entries: 'entries' }}
                ref={commonTableRef}
                emptyDesc={
                    <div>
                        {searchValue.current ? (
                            __('抱歉，没有找到相关内容')
                        ) : selectedType === AssetVisitorTypes.USER ? (
                            __('暂无数据')
                        ) : (
                            <div className={styles.appDataEmpty}>
                                <div>{__('当前应用暂无可用资源')}</div>
                                {/* <div>
                                    <div>
                                        <span>{__('可先从')}</span>
                                        <Button
                                            type="link"
                                            onClick={() => {
                                                if (
                                                    platform ===
                                                    LoginPlatform.default
                                                ) {
                                                    navigate('/data-assets')
                                                } else {
                                                    window.open(
                                                        getActualUrl(
                                                            '/data-assets',
                                                            true,
                                                            LoginPlatform.drmp,
                                                        ),
                                                        '_blank',
                                                    )
                                                }
                                            }}
                                        >
                                            {__('数据服务超市')}
                                        </Button>
                                        <span>
                                            {hasAuditProcess
                                                ? __(
                                                      '选择要使用的资源，然后进行权限申请或联系数据Owner进行授权',
                                                  )
                                                : __(
                                                      '选择要使用的资源，然后联系数据Owner进行授权',
                                                  )}
                                        </span>
                                    </div>
                                </div> */}
                            </div>
                        )}
                    </div>
                }
                emptyIcon={searchValue.current ? searchEmpty : dataEmpty}
                onChange={(pagination, filters, sorter) => {
                    if (pagination.current === searchCondition.offset) {
                        const selectedMenu: any = handleTableChange(sorter)
                        setSelectedSort(selectedMenu)
                        setSearchCondition({
                            ...searchCondition,
                            sort: selectedMenu.key,
                            direction: selectedMenu.sort,
                            offset: 1,
                            limit: pagination?.pageSize,
                        })
                    }
                }}
                onTableListUpdated={() => {
                    setSelectedSort(undefined)
                }}
            />
        )
    }

    const TopLeftContent = useMemo(() => {
        return (
            <div>
                {selectedType === AssetVisitorTypes.USER ? (
                    // isDataOwner ? (
                    <div className={styles['top-choice']}>
                        <span
                            className={classnames({
                                [styles['is-active']]: !isOwner,
                            })}
                            onClick={() => setIsOwner(false)}
                        >
                            {__('授权给我的')}
                        </span>
                        <span
                            className={classnames({
                                [styles['is-active']]: isOwner,
                            })}
                            onClick={() => setIsOwner(true)}
                        >
                            {__('我可授权的')}
                        </span>
                    </div>
                ) : (
                    // ) : (
                    //     <div className={styles['top-choice']}>
                    //         <span>{__('授权给我的')}</span>
                    //     </div>
                    // )
                    <div className={styles['top-choice']}>
                        <span>{__('授权给应用')}</span>
                    </div>
                )}
            </div>
        )
    }, [selectedType, isOwner])

    return (
        <div className={styles['asset-container']}>
            <div className={styles.top}>
                <div className={styles.searchLayout}>
                    <SearchLayout
                        formData={
                            isOwner
                                ? formData
                                : getSearchFormData(
                                      AssetItemType.Indicator,
                                  ).filter((item) => item.key !== 'data_owner')
                        }
                        onSearch={(queryData) => {
                            setSearchCondition({
                                ...searchCondition,
                                ...(queryData || {}),
                                offset: 1,
                            })
                        }}
                        ref={searchFormRef}
                        getExpansionStatus={setSearchIsExpansion}
                        prefixNode={TopLeftContent}
                        suffixNode={
                            <SortBtn
                                contentNode={
                                    <DropDownFilter
                                        menus={indicatorSortMenus}
                                        defaultMenu={defaultSort}
                                        menuChangeCb={handleSortWayChange}
                                        changeMenu={selectedSort}
                                    />
                                }
                            />
                        }
                    />
                </div>
            </div>
            <div className={styles['common-table']}>
                {commonTableTemplate()}
            </div>
            {applyVisible && (
                <ApplyPolicy
                    id={currentRow.id}
                    onClose={(needRefresh: boolean) => {
                        setApplyVisible(false)

                        // if (needRefresh) {
                        //     refreshAuditProcess()
                        // }
                    }}
                    type={AssetTypeEnum.Indicator as string}
                    indicatorType={currentRow?.indicator_type}
                />
            )}

            {accessVisible && (
                <AccessModal
                    id={currentRow.id}
                    type={AssetTypeEnum.Indicator}
                    onClose={() => {
                        setAccessVisible(false)
                    }}
                    indicatorType={currentRow?.indicator_type}
                />
            )}
            {indicatorDetailsOpen && (
                <IndicatorViewDetail
                    open={indicatorDetailsOpen}
                    id={currentRow?.id}
                    onClose={() => {
                        setIndicatorDetailsOpen(false)
                    }}
                    indicatorType={currentRow?.indicator_type || ''}
                    canChat
                />
            )}
        </div>
    )
}

export default IndicatorAsset
