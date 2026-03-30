import { ExclamationCircleFilled } from '@ant-design/icons'
import { noop } from 'lodash'
import { Button, Space, Tooltip } from 'antd'
import { SortOrder } from 'antd/es/table/interface'
import classnames from 'classnames'
import moment from 'moment'
import React, {
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import CommonTable from '@/components/CommonTable'
import { LightweightSearch, SearchInput } from '@/ui'
import { RefreshBtn, SortBtn } from '@/components/ToolbarComponents'
import { ResIcon } from '@/components/AccessPolicy/helper'
import { AvatarOutlined, FiltersOutlined, InfotipOutlined } from '@/icons'
import {
    AssetTypeEnum,
    LoginPlatform,
    SortDirection,
    allRoleList,
    formatError,
    getRoleUsers,
    getUserDatasheetView,
    isMicroWidget,
} from '@/core'
import DropDownFilter from '@/components/DropDownFilter'
import { Architecture, DataNode } from '../../BusinessArchitecture/const'
import OrgAndDepartmentFilterTree from '../OrgAndDepartmentFilterTree'
import {
    AssetVisitorTypes,
    InitCondition,
    ViewSortType,
    checkoutAssetHasExpired,
} from '../const'
import __ from '../locale'
import styles from './styles.module.less'
import DataDownloadConfig from '@/components/DataAssetsCatlg/DataDownloadConfig'

import dataEmpty from '@/assets/dataEmpty.svg'
import searchEmpty from '@/assets/searchEmpty.svg'
import LogicViewDetail from '@/components/DataAssetsCatlg/LogicViewDetail'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import { MicroWidgetPropsContext } from '@/context'
import ApplyPolicy from '@/components/AccessPolicy/ApplyPolicy'
import { useAuditProcess } from '@/hooks/useAuditProcess'
import { BizType, PolicyType } from '@/components/AuditPolicy/const'
import { useAssetsContext } from '../AssetsVisitorProvider'
import AccessModal from '@/components/AccessPolicy/AccessModal'
import { SearchType } from '@/ui/LightweightSearch/const'
import { getActualUrl, getPlatformNumber } from '@/utils'
import { checkAuditPolicyPermis } from '@/components/DataAssetsCatlg/helper'
import { DataRescType } from '@/components/DataAssetsCatlg/ApplicationService/helper'
import SearchLayout from '@/components/SearchLayout'
import { AssetItemType, getSearchFormData } from './helper'

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
 * 可用库表
 */
function DataViewAsset() {
    const navigator = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const assetType = searchParams.get('assetType') || undefined
    const owner = searchParams.get('owner') || undefined
    const [{ using }, updateUsing] = useGeneralConfig()
    const [isOwner, setIsOwner] = useState<boolean>(false)
    const [isFilterPop, setIsFilterPop] = useState<boolean>(false)
    const [accessVisible, setAccessVisible] = useState<boolean>(false)
    const [applyVisible, setApplyVisible] = useState<boolean>(false)
    const [downloadOpen, setDownloadOpen] = useState(false)
    const [filterTitle, setFilterTitle] = useState<string>('筛选')
    const searchValue = useRef<string>('')
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)
    const { selectedId, selectedType, isDataOwner } = useAssetsContext()
    const platform = getPlatformNumber()
    const [hasAuditProcess, setHasAuditProcess] = useState<boolean>(false)
    const [permissionData, setPermissionData] = useState<{
        [key: string]: any
    }>({})
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
                typeKey: DataRescType.LOGICALVIEW,
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

    const dataSortViewMenus = [
        {
            key: ViewSortType.NAME,
            label: __('按资源业务名称排序'),
        },
        // 根据using启用状态确定时间排序
        {
            key: using === 1 ? ViewSortType.PUBLISH : ViewSortType.ONLINE,
            label: using === 1 ? __('按发布时间排序') : __('按上线时间排序'),
        },
    ]
    // 默认排序
    const defaultSort = {
        key: using === 1 ? ViewSortType.PUBLISH : ViewSortType.ONLINE,
        sort: SortDirection.DESC,
    }
    const [selectedSort, setSelectedSort] = useState<any>(defaultSort)
    const [dataViewVisible, setDataViewVisible] = useState<boolean>(false)
    const [currentRow, setCurrentRow] = useState<any>({})
    const [searchCondition, setSearchCondition] = useState<any>({
        ...InitCondition,
        direction: defaultSort.sort,
        sort: defaultSort.key,
        owner: false,
    })
    // 是否启用数据资源
    const enableDataCatlg = using === 1

    // 创建表头排序
    const [tableSort, setTableSort] = useState<{
        [key: string]: SortOrder | undefined
    }>({
        [ViewSortType.PUBLISH]: using === 1 ? 'descend' : undefined,
        [ViewSortType.ONLINE]: using !== 1 ? 'descend' : undefined,
        [ViewSortType.NAME]: undefined,
    })
    const commonTableRef = useRef<any>()
    const searchFormRef = useRef<any>()
    const [formData, setFormData] = useState<any[]>([])
    const [searchIsExpansion, setSearchIsExpansion] = useState<boolean>(false)
    const [tableHeight, setTableHeight] = useState<number>(0)

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

    /** 选择组织部门 */
    const chooseFilter = (sn?: DataNode, delNode?: DataNode) => {
        if (sn) {
            const org = {
                org_code: sn.id,
            }
            setSearchCondition({
                ...searchCondition,
                offset: 1,
                ...org,
            })
            setFilterTitle(sn.id ? `${__('已选部门：')}${sn.name}` : __('筛选'))
        }
        setIsFilterPop(false)
    }

    useEffect(() => {
        if (selectedType === AssetVisitorTypes.USER) {
            setSearchCondition((prev) => ({
                ...InitCondition,
                direction: defaultSort.sort,
                sort: defaultSort.key,
                offset: 1,
                owner: isOwner,
                app_id: undefined,
            }))
        } else if (
            selectedType === AssetVisitorTypes.APPLICATION &&
            selectedId
        ) {
            setSearchCondition((prev) => ({
                ...InitCondition,
                direction: defaultSort.sort,
                sort: defaultSort.key,
                offset: 1,
                owner: undefined,
                app_id: selectedId || undefined,
            }))
        }
    }, [isOwner, selectedType, selectedId])

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
            const formDataList = getSearchFormData(AssetItemType.DataView).map(
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
        if (
            selectedType === AssetVisitorTypes.APPLICATION &&
            selectedId &&
            isOwner
        ) {
            setIsOwner(false)
        }
    }, [selectedType, selectedId])

    useEffect(() => {
        if (assetType === 'data-view') {
            if (isDataOwner !== null) {
                if (owner) {
                    setIsOwner(owner === 'true')
                }
                searchParams.delete('assetType')
                searchParams.delete('owner')
                setSearchParams(searchParams)
            }
        }
    }, [assetType, isDataOwner])

    // 筛选顺序变化
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
            [ViewSortType.PUBLISH]: null,
            [ViewSortType.ONLINE]: null,
            [ViewSortType.NAME]: null,
            [selectedMenu.key]:
                selectedMenu.sort === SortDirection.ASC ? 'ascend' : 'descend',
        })
    }

    // 表格排序改变
    const handleTableChange = (sorter) => {
        const sorterKey =
            sorter.columnKey === 'business_name' ? 'name' : sorter.columnKey

        if (sorter.column) {
            setTableSort({
                [ViewSortType.PUBLISH]: null,
                [ViewSortType.ONLINE]: null,
                [ViewSortType.NAME]: null,
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
            [ViewSortType.PUBLISH]: null,
            [ViewSortType.ONLINE]: null,
            [ViewSortType.NAME]: null,
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
                    <span>{__('视图业务名称')}</span>
                    <span style={{ color: 'rgba(0,0,0,0.45)' }}>
                        {__('（编码）')}
                    </span>
                </div>
            ),
            dataIndex: 'business_name',
            key: 'business_name',
            sorter: true,
            showSorterTooltip: {
                title: __('按视图业务名称排序'),
            },
            sortOrder: tableSort[ViewSortType.NAME],
            render: (text, record) => (
                <div className={styles.assetInfo}>
                    <span>{ResIcon[AssetTypeEnum.DataView]}</span>
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
                            title={record.uniform_catalog_code}
                            style={{
                                color: 'rgba(0, 0, 0, 0.45)',
                                fontSize: '12px',
                            }}
                        >
                            {record.uniform_catalog_code}
                        </div>
                    </div>
                </div>
            ),
            ellipsis: true,
        },
        {
            title: __('视图技术名称'),
            dataIndex: 'technical_name',
            key: 'technical_name',
            ellipsis: true,
            render: (text, record) => record?.technical_name || '--',
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
            title: __('所属主题'),
            dataIndex: 'subject',
            key: 'subject',
            ellipsis: true,
            render: (text, record) => (
                <span
                    title={record?.subject_path || '无'}
                    style={{
                        width: 'calc(100% - 20px)',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                    }}
                >
                    {record?.subject || '--'}
                </span>
            ),
        },
        {
            title: __('所属部门'),
            dataIndex: 'department',
            key: 'department',
            ellipsis: true,
            render: (text, record) => (
                <span title={record?.department_path || '无'}>
                    {record?.department || '--'}
                </span>
            ),
        },
        {
            title: enableDataCatlg ? __('发布时间') : __('上线时间'),
            dataIndex: enableDataCatlg
                ? ViewSortType.PUBLISH
                : ViewSortType.ONLINE,
            key: enableDataCatlg ? ViewSortType.PUBLISH : ViewSortType.ONLINE,
            ellipsis: true,
            sorter: true,
            sortOrder: enableDataCatlg
                ? tableSort[ViewSortType.PUBLISH]
                : tableSort[ViewSortType.ONLINE],
            showSorterTooltip: false,
            render: (text) =>
                text ? moment(text)?.format('YYYY-MM-DD HH:mm:ss') : '--',
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
            width: 260,
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

                        {record?.allow_download &&
                            selectedType === AssetVisitorTypes.USER && (
                                <a
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        toDownload(record)
                                    }}
                                >
                                    {__('数据下载')}
                                </a>
                            )}
                    </Space>
                )
            },
        },
    ]

    // const ownerColumns = useMemo(
    //     () => columns.filter((o) => o.dataIndex !== 'owner'),
    //     [isOwner, tableSort],
    // )

    const toAccess = (item: any) => {
        setCurrentRow(item)
        setAccessVisible(true)
    }
    const toApply = (item) => {
        setCurrentRow(item)
        setApplyVisible(true)
    }
    const toDownload = (item: any) => {
        setCurrentRow(item)
        setDownloadOpen(true)
    }

    const toDetails = (item: any) => {
        setCurrentRow(item)
        setDataViewVisible(true)
        // navigator(`/datasheet-view/detail?id=${item.id}&backPrev=true`)
    }
    // const isDataOwner = getAccess(
    //     `${ResourceType.auth_service}.${RequestType.get}`,
    // )

    const getUserDataSheetViewData = (params) => {
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
        return getUserDatasheetView(params)
    }

    const commonTableTemplate = () => {
        if (selectedType === AssetVisitorTypes.APPLICATION && selectedId) {
            return (
                <CommonTable
                    queryAction={getUserDataSheetViewData}
                    params={searchCondition}
                    baseProps={{
                        columns, // isOwner ? ownerColumns :
                        // scroll: {
                        //     y: `calc(100vh - ${320}px)`,
                        // },
                        rowKey: 'id',
                        rowClassName: styles.tableRow,
                    }}
                    emptyExcludeField={['owner', 'app_id']}
                    ref={commonTableRef}
                    emptyDesc={
                        <div>
                            {searchValue.current ? (
                                __('抱歉，没有找到相关内容')
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
                    scrollY={`calc(100vh - ${isOwner ? tableHeight : 320}px)`}
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
                    dataProcessor={handleDataProcessor}
                />
            )
        }
        return (
            <CommonTable
                queryAction={getUserDataSheetViewData}
                params={searchCondition}
                baseProps={{
                    columns, // isOwner ? ownerColumns :
                    // scroll: {
                    //     y: `calc(100vh - ${320}px)`,
                    // },
                    rowKey: 'id',
                    rowClassName: styles.tableRow,
                }}
                scrollY={`calc(100vh - ${isOwner ? tableHeight : 320}px)`}
                emptyExcludeField={['owner', 'app_id']}
                ref={commonTableRef}
                emptyDesc={
                    <div>
                        {searchValue.current ? (
                            __('抱歉，没有找到相关内容')
                        ) : selectedType === AssetVisitorTypes.USER ? (
                            __('暂无数据')
                        ) : (
                            <div>
                                <div className={styles.appDataEmpty}>
                                    <div>{__('当前应用暂无可用资源')}</div>
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
                                </div>
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
                dataProcessor={handleDataProcessor}
            />
        )
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
                                            menus={dataSortViewMenus}
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
                                placeholder={__(
                                    '搜索资源业务名称、技术名称、编码',
                                )}
                                onKeyChange={(kw: string) => {
                                    if (!kw && !searchValue.current) return
                                    searchValue.current = kw
                                    setSearchCondition({
                                        ...searchCondition,
                                        offset: 1,
                                        keyword: kw || '',
                                    })
                                }}
                                maxLength={255}
                                value={searchCondition.keyword}
                                className={styles.searchInput}
                                style={{ width: 285 }}
                            />

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
                                            menus={dataSortViewMenus}
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
                {/* <CommonTable
                    queryAction={getUserDatasheetView}
                    params={searchCondition}
                    baseProps={{
                        columns: columns, //isOwner ? ownerColumns : 
                        // scroll: {
                        //     y: `calc(100vh - ${320}px)`,
                        // },
                        rowKey: 'id',
                        rowClassName: styles.tableRow,
                    }}
                    emptyExcludeField={['owner', 'app_id']}
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
                                    <div>
                                        {hasAuditProcess ? (
                                            <div>
                                                <span>{__('可从')}</span>
                                                <Button
                                                    type="link"
                                                    onClick={() => {
                                                        navigator(
                                                            '/data-assets',
                                                        )
                                                    }}
                                                >
                                                    {__('数据服务超市')}
                                                </Button>
                                                <span>
                                                    {__(
                                                        '申请资源权限或联系资源的数据Owner进行授权',
                                                    )}
                                                </span>
                                            </div>
                                        ) : (
                                            __('联系资源的数据Owner进行授权')
                                        )}
                                    </div>
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
                /> */}
                {commonTableTemplate()}
            </div>

            {applyVisible && currentRow?.id && (
                <ApplyPolicy
                    id={currentRow.id}
                    onClose={(needRefresh: boolean) => {
                        setApplyVisible(false)

                        // if (needRefresh) {
                        //     refreshAuditProcess()
                        // }
                    }}
                    type={AssetTypeEnum.DataView}
                />
            )}

            {accessVisible && (
                <AccessModal
                    id={currentRow.id}
                    type={AssetTypeEnum.DataView}
                    onClose={() => {
                        setAccessVisible(false)
                    }}
                />
            )}

            {dataViewVisible && (
                <LogicViewDetail
                    open={dataViewVisible}
                    onClose={() => {
                        setDataViewVisible(false)
                        setCurrentRow(undefined)
                    }}
                    isFromAuth
                    showShadow={false}
                    hasPermission={currentRow?.allow_download}
                    id={currentRow?.id}
                    canChat
                />
            )}
            {downloadOpen && (
                <DataDownloadConfig
                    isFullScreen={!!isMicroWidget({ microWidgetProps })}
                    formViewId={currentRow?.id || ''}
                    open={downloadOpen}
                    onClose={() => {
                        setDownloadOpen(false)
                    }}
                />
            )}

            {/* {accessVisible && currentRow?.id && (
                <ApplyPolicy
                    id={currentRow?.id}
                    onClose={(needRefresh: boolean) => {
                        setAccessVisible(false)
                    }}
                    type={AssetTypeEnum.DataView as string}
                />
            )} */}
        </div>
    )
}

export default DataViewAsset
