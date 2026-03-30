import { DownloadOutlined, ExclamationCircleFilled } from '@ant-design/icons'
import { Button, Space, Tooltip } from 'antd'
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { SortOrder } from 'antd/es/table/interface'
import { noop } from 'lodash'
import { LightweightSearch, SearchInput } from '@/ui'
import { RefreshBtn, SortBtn } from '@/components/ToolbarComponents'
import __ from '../locale'
import styles from './styles.module.less'
import {
    AvatarOutlined,
    FiltersOutlined,
    FontIcon,
    InfotipOutlined,
} from '@/icons'
import ApplicationServiceDetail from '@/components/DataAssetsCatlg/ApplicationServiceDetail'
import DropDownFilter from '@/components/DropDownFilter'
import OrgAndDepartmentFilterTree from '../OrgAndDepartmentFilterTree'
import { DataNode, Architecture } from '../../BusinessArchitecture/const'
import {
    IAvailableAssetsQueryList,
    InitCondition,
    ApiSortType,
    AssetVisitorTypes,
    checkoutAssetHasExpired,
} from '../const'
import CommonTable from '@/components/CommonTable'
import {
    AssetTypeEnum,
    LoginPlatform,
    SortDirection,
    allRoleList,
    downloadApiDoc,
    formatError,
    getAvailableApiApply,
    getRoleUsers,
    queryServiceOverviewList,
} from '@/core'
import { ResIcon, labelText } from '@/components/AccessPolicy/helper'

import dataEmpty from '@/assets/dataEmpty.svg'
import searchEmpty from '@/assets/searchEmpty.svg'
import AuthInfo from '../AuthInfo'
import { useAuditProcess } from '@/hooks/useAuditProcess'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import { useAssetsContext } from '../AssetsVisitorProvider'
import { BizType, PolicyType } from '@/components/AuditPolicy/const'
import ApplyPolicy from '@/components/AccessPolicy/ApplyPolicy'
import AccessModal from '@/components/AccessPolicy/AccessModal'
import { SearchType } from '@/ui/LightweightSearch/const'
import { getActualUrl, getPlatformNumber, streamToFile } from '@/utils'
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
        'is_all',
        'owner_id',
        'service_keyword',
        'publish_status',
        'department_id',
        'status',
        'publish_and_online_status',
        'is_authed',
        'data_owner',
        'policy_status',
    ],
    unOwner: [
        'offset',
        'limit',
        'direction',
        'sort',
        'keyword',
        'org_code',
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

/**
 * 可用接口服务
 */
function ApiAsset() {
    const [searchParams, setSearchParams] = useSearchParams()
    const assetType = searchParams.get('assetType') || undefined
    const [{ using }, updateUsing] = useGeneralConfig()
    const [ownerId] = useCurrentUser('ID')
    const [isOwner, setIsOwner] = useState<boolean>(false)
    const [isFilterPop, setIsFilterPop] = useState<boolean>(false)
    const [accessVisible, setAccessVisible] = useState<boolean>(false)
    const [applyVisible, setApplyVisible] = useState<boolean>(false)
    const [authInfoOpen, setAuthInfoOpen] = useState(false)
    const [apiDetailsOpen, setApiDetailsOpen] = useState<boolean>(false)
    const [filterTitle, setFilterTitle] = useState<string>('筛选')
    const searchValue = useRef<string>('')
    const { selectedId, selectedType, isDataOwner } = useAssetsContext()
    const navigator = useNavigate()
    const platform = getPlatformNumber()

    const sorterAttr = using === 1 ? ApiSortType.PUBLISH : ApiSortType.ONLINE

    const apiSortMenus = [
        {
            key: ApiSortType.NAME,
            label: __('按接口名称排序'),
        },
        // 根据using启用状态确定时间排序
        {
            key: sorterAttr,
            label: using === 1 ? __('按发布时间排序') : __('按上线时间排序'),
        },
    ]

    // 默认排序
    const defaultSort = {
        key: sorterAttr,
        sort: SortDirection.DESC,
    }
    const [selectedSort, setSelectedSort] = useState<any>(defaultSort)
    const [currentRow, setCurrentRow] = useState<any>({})
    const [hasAuditProcess, setHasAuditProcess] = useState<boolean>(false)
    const [permissionData, setPermissionData] = useState<{
        [key: string]: any
    }>({})

    const [searchCondition, setSearchCondition] =
        useState<IAvailableAssetsQueryList>({
            ...InitCondition,
            direction: defaultSort.sort,
            sort: defaultSort.key,
        })
    const commonTableRef = useRef<any>()
    const searchFormRef = useRef<any>()
    const [formData, setFormData] = useState<any[]>([])
    const [searchIsExpansion, setSearchIsExpansion] = useState<boolean>(false)
    const [tableHeight, setTableHeight] = useState<number>(0)
    const [selectedApiIds, setSelectedApiIds] = useState<string[]>([])
    const [totalCount, setTotalCount] = useState<number>(0)

    const hasSearchCondition = useMemo(() => {
        return (
            searchCondition.keyword ||
            searchCondition.org_code ||
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

    // 是否启用数据资源
    const enableDataCatlg = using === 1

    // 创建表头排序
    const [tableSort, setTableSort] = useState<{
        [key: string]: SortOrder | undefined
    }>({
        [ApiSortType.PUBLISH]: enableDataCatlg ? 'descend' : undefined,
        [ApiSortType.ONLINE]: !enableDataCatlg ? 'descend' : undefined,
        [ApiSortType.NAME]: undefined,
    })

    useEffect(() => {
        setSearchCondition((prev) => ({
            ...prev,
            offset: 1,
        }))
    }, [isOwner])

    useEffect(() => {
        // 如果当前是Owner，并且formData为空，则获取所有数据owner用户
        if (isOwner && !formData.length) {
            getAllOwnerUsers()
        }
    }, [isOwner, formData])

    // 获取所有数据owner用户
    const getAllOwnerUsers = async () => {
        try {
            const res = await getRoleUsers(allRoleList.TCDataOwner, {
                limit: 2000,
            })

            const list = res?.entries ? [...res.entries] : []
            const formDataList = getSearchFormData(AssetItemType.Api).map(
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

    useEffect(() => {
        if (selectedType === AssetVisitorTypes.USER) {
            setIsOwner(true)
        } else {
            setIsOwner(false)
        }
    }, [selectedType])

    useEffect(() => {
        if (assetType === 'api') {
            searchParams.delete('assetType')
            searchParams.delete('owner')
            setSearchParams(searchParams)
        }
    }, [assetType])

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
                typeKey: DataRescType.INTERFACE,
            }))

            const res = await checkAuditPolicyPermis(processData, {
                id: 'service_id',
                type: 'typeKey',
            })

            if (Array.isArray(res)) {
                // 将权限信息存储到独立的状态中，避免修改原始数据
                const permissionMap = {}
                res.forEach((item) => {
                    if (item.service_id) {
                        permissionMap[item.service_id] = {
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

    /** 选择组织部门 */
    const chooseFilter = (sn?: DataNode, delNode?: DataNode) => {
        if (sn) {
            const org = {
                org_code: sn.id,
            }
            setSearchCondition((prev) => ({
                ...prev,
                offset: 1,
                ...org,
            }))
            setFilterTitle(sn.id ? `${__('已选部门：')}${sn.name}` : __('筛选'))
        }
        setIsFilterPop(false)
    }

    /** 响应排序方式 */
    const handleMenuChange = (selectedMenu) => {
        setSearchCondition({
            ...searchCondition,
            sort: selectedMenu.key,
            direction: selectedMenu.sort,
            offset: 1,
        })
        setSelectedSort(selectedMenu)
        onChangeMenuToTableSort(selectedMenu)
    }

    const onChangeMenuToTableSort = (selectedMenu) => {
        setTableSort({
            [ApiSortType.PUBLISH]: null,
            [ApiSortType.ONLINE]: null,
            [ApiSortType.NAME]: null,
            [selectedMenu.key]:
                selectedMenu.sort === SortDirection.ASC ? 'ascend' : 'descend',
        })
    }

    const handleTableChange = (sorter) => {
        const sorterKey =
            sorter.columnKey === 'service_name' ? 'name' : sorter.columnKey

        if (sorter.column) {
            setTableSort({
                [ApiSortType.PUBLISH]: null,
                [ApiSortType.ONLINE]: null,
                [ApiSortType.NAME]: null,
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
            [ApiSortType.PUBLISH]: null,
            [ApiSortType.ONLINE]: null,
            [ApiSortType.NAME]: null,
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

    useEffect(() => {
        setSelectedApiIds([])
    }, [selectedId])

    /** 筛选项 */
    /** 筛选项 */
    const filterItems = [
        // {
        //     key: '1',
        //     label: (
        //         <OrgAndDepartmentFilterTree
        //             getSelectedNode={chooseFilter}
        //             filterType={[
        //                 Architecture.ORGANIZATION,
        //                 Architecture.DEPARTMENT,
        //             ].join()}
        //         />
        //     ),
        // },
        {
            label: __('所属部门'),
            key: 'org_code',
            options: [],
            type: SearchType.Customer,
            Component: OriginSelectComponent as React.ComponentType<{
                value?: any
                onChange: (value: any) => void
            }>,
        },
        {
            label: __('有效期状态'),
            key: 'policy_status',
            options: [
                {
                    label: __('不限'),
                    value: '',
                },
                {
                    label: __('无过期'),
                    value: 'Active',
                },
                {
                    label: __('有过期'),
                    value: 'Expired',
                },
            ],
            type: SearchType.Radio,
        },
    ]

    /** 表项 */
    const columns = [
        {
            title: (
                <div>
                    <span>{__('接口名称')}</span>
                    <span style={{ color: 'rgba(0,0,0,0.45)' }}>
                        {__('（编码）')}
                    </span>
                </div>
            ),
            dataIndex: 'service_name',
            key: 'service_name',
            sorter: true,
            showSorterTooltip: {
                title: __('按接口名称排序'),
            },
            sortOrder: tableSort[ApiSortType.NAME],
            render: (text, record) => (
                <div className={styles.assetInfo}>
                    <span>{ResIcon[AssetTypeEnum.Api]}</span>
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
                            title={record.service_code}
                            style={{
                                color: 'rgba(0, 0, 0, 0.45)',
                                fontSize: '12px',
                            }}
                        >
                            {record.service_code}
                        </div>
                    </div>
                </div>
            ),
            ellipsis: true,
        },
        // 被授权的显示
        {
            title: __('数据Owner'),
            dataIndex: 'owner_name',
            key: 'owner_name',
            ellipsis: true,
            render: (text, record) => record?.owner_name || '--',
        },
        // 可授权的显示
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
            title: __('所属主题'),
            dataIndex: 'subject_domain',
            key: 'subject_domain',
            ellipsis: true,
            render: (text, record) =>
                isOwner ? (
                    <span
                        title={record.subject_domain_name || '无'}
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
                        title={record?.subject_domain_name || '无'}
                        style={{
                            width: 'calc(100% - 20px)',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                        }}
                    >
                        {labelText(record?.subject_domain_name) || '--'}
                    </span>
                ),
        },
        {
            title: __('所属部门'),
            dataIndex: 'org_name',
            key: 'org_name',
            ellipsis: true,
            render: (text, record) =>
                isOwner ? (
                    <span title={record.department?.name || '无'}>
                        {labelText(record.department?.name)}
                    </span>
                ) : (
                    <span title={record?.org_name || '无'}>
                        {labelText(record?.org_name) || '--'}
                    </span>
                ),
        },
        {
            title: enableDataCatlg ? __('发布时间') : __('上线时间'),
            dataIndex: enableDataCatlg
                ? ApiSortType.PUBLISH
                : ApiSortType.ONLINE,
            key: enableDataCatlg ? ApiSortType.PUBLISH : ApiSortType.ONLINE,
            ellipsis: true,
            sorter: true,
            sortOrder: enableDataCatlg
                ? tableSort[ApiSortType.PUBLISH]
                : tableSort[ApiSortType.ONLINE],
            showSorterTooltip: false,
            render: (text) => text || '--',
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
            width: 280,
            render: (text: string, record) => {
                const permissionInfo = getPermissionInfo(record.service_id)
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
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        toApply(record)
                                    }}
                                    disabled={isAccessBtnDisableByPolicy}
                                >
                                    {__('权限变更申请')}
                                </Button>
                            </Tooltip>
                        ) : null}

                        <Button
                            ghost
                            type="link"
                            style={{ padding: 0 }}
                            onClick={(e) => {
                                e.stopPropagation()
                                batchDownload([record.service_id])
                            }}
                            disabled={
                                !['down-auditing', 'online'].includes(
                                    record.status,
                                )
                            }
                        >
                            {__('下载文档')}
                        </Button>

                        {/* <a
                        onClick={(e) => {
                            e.stopPropagation()
                            toAuthInfo(record)
                        }}
                    >
                        {__('调用信息')}
                    </a> */}
                    </Space>
                )
            },
        },
    ]

    const curColumns = useMemo(
        () =>
            columns.filter(
                (o) => o.dataIndex !== (isOwner ? 'owner_name' : 'owners'),
            ),
        [isOwner, tableSort, hasAuditProcess],
    )

    const toAccess = (item: any) => {
        setCurrentRow(item)
        setAccessVisible(true)
    }

    const toApply = (item) => {
        setCurrentRow(item)
        setApplyVisible(true)
    }
    const toAuthInfo = (item: any) => {
        setCurrentRow(item)
        setAuthInfoOpen(true)
    }

    const toDetails = (item: any) => {
        setCurrentRow(item)
        setApiDetailsOpen(true)
    }

    const queryParams = useMemo(() => {
        const params: any = searchCondition
        if (isOwner) {
            params.sort = enableDataCatlg
                ? ApiSortType.PUBLISH
                : ApiSortType.ONLINE

            if (enableDataCatlg) {
                // params.publish_status = 'published'
                params.publish_and_online_status =
                    'published,change-reject,change-auditing'
            } else {
                // params.status = 'online'
                params.publish_and_online_status =
                    'online,down-auditing,down-reject'
            }

            // params.publish_status = 'published'
            params.department_id = params.org_code
            params.service_keyword = params.keyword
            params.is_all = true
            params.owner_id = ownerId
        } else {
            params.sort = ApiSortType.ONLINE
        }
        params.is_authed = isOwner
        const ObjParams = Object.keys(params).reduce((prev, key) => {
            let curKeys = ParamKeys[isOwner ? 'isOwner' : 'unOwner']

            if (isOwner) {
                curKeys = curKeys.filter(
                    (o) =>
                        o !== (enableDataCatlg ? 'status' : 'publish_status'),
                )
            }

            if (curKeys.includes(key)) {
                // eslint-disable-next-line no-param-reassign
                prev[key] = params[key]
            }
            return prev
        }, {})

        return {
            ...ObjParams,
            subject: !isOwner && selectedId ? `app:${selectedId}` : undefined,
        }
    }, [searchCondition, isOwner, selectedId])

    /**
     * 异步获取数据
     *
     * 此函数根据不同的条件返回不同的数据集合它首先检查是否为拥有者并且参数中包含拥有者ID，
     * 如果满足，则调用queryServiceOverviewList函数获取数据集如果选定ID存在，则调用
     * getAvailableApiApply函数获取可用API申请数据如果没有特定条件匹配，则返回一个解析后的
     * Promise，包含空的数据条目和总数量为0的结果
     *
     * @param questParams 请求参数，用于查询数据
     * @returns 返回一个Promise，根据条件不同解析为不同的数据集合
     */
    const getAsyncData = async (questParams) => {
        // 当是拥有者并且请求参数中包含拥有者ID时，调用queryServiceOverviewList服务获取数据
        if (isOwner && (questParams as any)?.owner_id) {
            return queryServiceOverviewList(questParams)
        }
        // 如果选定ID存在，则调用getAvailableApiApply服务获取可用API申请数据
        if (questParams.subject) {
            const { entries, total_count } = await getAvailableApiApply(
                questParams,
            )
            setTotalCount(total_count || 0)
            return Promise.resolve({
                entries,
                total_count,
            })
        }

        // 如果没有匹配特定条件，则返回包含空数据条目和总数量为0的Promise
        return Promise.resolve({
            entries: [],
            total_count: 0,
        })
    }

    /**
     * 批量下载
     * @param isAll 是否下载全部
     * @returns void
     */
    const batchDownload = async (serviceIds: string[]) => {
        try {
            if (!serviceIds.length || !selectedId) return
            const res = await downloadApiDoc({
                service_ids: serviceIds,
            })

            // 从响应头中提取文件名
            const contentDisposition = res.headers?.['content-disposition']
            let fileName = '' // 默认文件名

            if (contentDisposition) {
                // 解析 filename*=utf-8''encoded-filename 或 filename="filename" 格式
                const filenameStarMatch = contentDisposition.match(
                    /filename\*=utf-8''(.+)/i,
                )
                if (filenameStarMatch) {
                    fileName = decodeURIComponent(filenameStarMatch[1])
                } else {
                    const filenameMatch =
                        contentDisposition.match(/filename="?([^"]+)"?/i)
                    if (filenameMatch?.[1]) {
                        fileName = filenameMatch?.[1]
                    }
                }
            }

            streamToFile(res.data, fileName)
        } catch (err) {
            formatError(err)
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

    const TopLeftContent = useMemo(() => {
        return (
            <div className={styles['button-group']}>
                <Button
                    icon={
                        <FontIcon
                            name="icon-xiazai"
                            style={{ marginRight: 8 }}
                        />
                    }
                    onClick={() => {
                        batchDownload(selectedApiIds)
                    }}
                    type="primary"
                    disabled={!selectedApiIds.length}
                >
                    {__('批量下载 ${count}/${total}', {
                        count: selectedApiIds?.length.toString(),
                        total: totalCount.toString(),
                    })}
                </Button>
            </div>
        )
    }, [selectedType, totalCount, selectedApiIds])

    return (
        <div className={styles['asset-container']}>
            <div className={styles.top}>
                {isOwner ? (
                    <div className={styles.searchLayout}>
                        <SearchLayout
                            formData={formData}
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
                                            menus={apiSortMenus}
                                            defaultMenu={defaultSort}
                                            menuChangeCb={handleMenuChange}
                                            changeMenu={selectedSort}
                                        />
                                    }
                                />
                            }
                        />
                    </div>
                ) : (
                    <>
                        {TopLeftContent}

                        <Space className={styles['top-search']}>
                            <SearchInput
                                placeholder={__('搜索接口名称、编码')}
                                onKeyChange={(kw: string) => {
                                    if (!kw && !searchValue.current) return
                                    searchValue.current = kw
                                    setSearchCondition((prev) => ({
                                        ...prev,
                                        offset: 1,
                                        keyword: kw || undefined,
                                    }))
                                }}
                                value={searchValue.current}
                                className={styles.searchInput}
                                style={{ width: 280 }}
                            />
                            {/* <Dropdown
                        menu={{ items: filterItems }}
                        trigger={['click']}
                        onOpenChange={(o) => setIsFilterPop(o)}
                        open={isFilterPop}
                        placement="bottomLeft"
                        overlayClassName={styles.filterDropdown}
                        getPopupContainer={(node) => node.parentElement || node}
                    >
                        <Button
                            className={styles.filterBtn}
                            title={filterTitle}
                        >
                            <FiltersOutlined className={styles.filterIcon} />
                            <span className={styles.filterText}>
                                {filterTitle}
                            </span>
                            <span className={styles.dropIcon}>
                                {isFilterPop ? (
                                    <UpOutlined />
                                ) : (
                                    <DownOutlined />
                                )}
                            </span>
                        </Button>
                    </Dropdown> */}
                            <LightweightSearch
                                formData={filterItems.filter(
                                    (item) =>
                                        item.key !== 'policy_status' ||
                                        !isOwner,
                                )}
                                onChange={(data, key) =>
                                    searchChange(data, key)
                                }
                                defaultValue={{
                                    org_code: undefined,
                                    policy_status: '',
                                }}
                            />
                            <span>
                                <SortBtn
                                    contentNode={
                                        <DropDownFilter
                                            menus={apiSortMenus}
                                            defaultMenu={defaultSort}
                                            menuChangeCb={handleMenuChange}
                                            changeMenu={selectedSort}
                                        />
                                    }
                                />
                                <RefreshBtn
                                    onClick={() =>
                                        commonTableRef?.current?.getData()
                                    }
                                />
                            </span>
                        </Space>
                    </>
                )}
            </div>
            <div className={styles['common-table']}>
                <CommonTable
                    dataProcessor={handleDataProcessor}
                    queryAction={getAsyncData}
                    params={queryParams}
                    isReplace
                    emptyExcludeField={
                        isOwner
                            ? ['publish_status', 'is_all', 'owner_id']
                            : ['subject']
                    }
                    baseProps={{
                        columns: curColumns,
                        // scroll: {
                        //     y: `calc(100vh - ${320}px)`,
                        //     x: 1300,
                        // },
                        rowSelection: {
                            onChange: (selectedRowKeys, selectedRows) => {
                                setSelectedApiIds(
                                    selectedRowKeys.map((key) =>
                                        key.toString(),
                                    ),
                                )
                            },
                            type: 'checkbox',
                            selectedRowKeys: selectedApiIds,

                            getCheckboxProps: (record) => ({
                                disabled: !['down-auditing', 'online'].includes(
                                    record.status,
                                ),
                            }),
                        },
                        rowKey: 'service_id',
                        rowClassName: styles.tableRow,
                    }}
                    scrollY={`calc(100vh - ${isOwner ? tableHeight : 320}px)`}
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
                                    {platform === LoginPlatform.default ? (
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
                                                            navigator(
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
                                    ) : null}
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
            </div>
            {applyVisible && (
                <ApplyPolicy
                    id={currentRow.service_id}
                    onClose={(needRefresh: boolean) => {
                        setApplyVisible(false)

                        // if (needRefresh) {
                        //     refreshAuditProcess()
                        // }
                    }}
                    type={AssetTypeEnum.Api as string}
                />
            )}

            {accessVisible && (
                <AccessModal
                    id={currentRow.service_id}
                    type={AssetTypeEnum.Api}
                    onClose={() => {
                        setAccessVisible(false)
                    }}
                />
            )}

            {authInfoOpen && (
                <AuthInfo
                    id={currentRow?.service_id}
                    open={authInfoOpen}
                    onClose={() => {
                        setAuthInfoOpen(false)
                    }}
                />
            )}
            {apiDetailsOpen && (
                <div className={styles.applicationServiceBox}>
                    <ApplicationServiceDetail
                        open={apiDetailsOpen}
                        onClose={() => {
                            setApiDetailsOpen(false)
                            setCurrentRow(undefined)
                        }}
                        isFromAuth
                        hasPermission
                        showShadow={false}
                        serviceCode={currentRow?.service_id}
                        canChat
                    />
                </div>
            )}
        </div>
    )
}

export default ApiAsset
