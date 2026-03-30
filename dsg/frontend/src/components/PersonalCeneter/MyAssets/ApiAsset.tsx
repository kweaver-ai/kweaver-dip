import { DownOutlined, UpOutlined } from '@ant-design/icons'
import { Button, Dropdown, Space, Tooltip } from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SortOrder } from 'antd/es/table/interface'
import { SearchInput } from '@/ui'
import { RefreshBtn, SortBtn } from '@/components/ToolbarComponents'
import __ from '../locale'
import styles from './styles.module.less'
import { FiltersOutlined, FontIcon, InfotipOutlined } from '@/icons'
import ApplicationServiceDetail from '@/components/DataAssetsCatlg/ApplicationServiceDetail'
import DropDownFilter from '@/components/DropDownFilter'
import OrgAndDepartmentFilterTree from '../OrgAndDepartmentTree'
import { DataNode, Architecture } from '../../BusinessArchitecture/const'
import {
    IAvailableAssetsQueryList,
    InitCondition,
    ApiSortType,
    AssetVisitorTypes,
} from './const'
import CommonTable from '@/components/CommonTable'
import {
    AssetTypeEnum,
    LoginPlatform,
    SortDirection,
    getAvailableApiApply,
    queryServiceOverviewList,
} from '@/core'
import { ResIcon, labelText } from '@/components/AccessPolicy/helper'

import dataEmpty from '@/assets/dataEmpty.svg'
import searchEmpty from '@/assets/searchEmpty.svg'
import { useAuditProcess } from '@/hooks/useAuditProcess'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import { useAssetsContext } from './AssetsVisitorProvider'
import { BizType, PolicyType } from '@/components/AuditPolicy/const'
import ApplyPolicy from '@/components/AccessPolicy/ApplyPolicy'
import AccessModal from '@/components/AccessPolicy/AccessModal'
import { getActualUrl } from '@/utils'

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
    ],
    unOwner: ['offset', 'limit', 'direction', 'sort', 'keyword', 'org_code'],
}

/**
 * 可用接口服务
 */
function ApiAsset() {
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
    const { selectedId, selectedType } = useAssetsContext()
    const navigator = useNavigate()

    const sorterAttr = using === 1 ? ApiSortType.PUBLISH : ApiSortType.ONLINE

    const apiSortMenus = [
        {
            key: ApiSortType.NAME,
            label: __('按资源名称排序'),
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

    const [searchCondition, setSearchCondition] =
        useState<IAvailableAssetsQueryList>({
            ...InitCondition,
            direction: defaultSort.sort,
            sort: defaultSort.key,
        })
    const commonTableRef = useRef<any>()
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
        if (selectedType === AssetVisitorTypes.USER) {
            setIsOwner(true)
        } else {
            setIsOwner(false)
        }
    }, [selectedType])

    const [hasAuditProcess, refreshAuditProcess] = useAuditProcess({
        audit_type: PolicyType.AssetPermission,
        service_type: BizType.AuthService,
    })
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

    /** 筛选项 */
    const filterItems = [
        {
            key: '1',
            label: (
                <OrgAndDepartmentFilterTree
                    getSelectedNode={chooseFilter}
                    filterType={[
                        Architecture.ORGANIZATION,
                        Architecture.DEPARTMENT,
                    ].join()}
                />
            ),
        },
    ]

    /** 表项 */
    const columns = [
        {
            title: (
                <div>
                    <span>{__('资源名称')}</span>
                    <span style={{ color: 'rgba(0,0,0,0.45)' }}>
                        {__('（编码）')}
                    </span>
                </div>
            ),
            dataIndex: 'service_name',
            key: 'service_name',
            sorter: true,
            showSorterTooltip: {
                title: __('按资源名称排序'),
            },
            sortOrder: tableSort[ApiSortType.NAME],
            render: (text, record) => (
                <div className={styles.assetInfo}>
                    <span>{ResIcon[AssetTypeEnum.Api]}</span>
                    <div className={styles.assetName} title={text || '--'}>
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
        {
            title: __('数据Owner'),
            dataIndex: 'owner_name',
            key: 'owner_name',
            ellipsis: true,
            render: (text, record) => record?.owner_name || '--',
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
                    {!hasAuditProcess && !isOwner && (
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
                    )}
                </span>
            ),
            key: 'action',
            width: 120,
            render: (text: string, record) => (
                <Space direction="horizontal" size={12}>
                    {/* // TODO : 权限变更申请  数据下载 */}
                    {isOwner ? (
                        <a
                            onClick={(e) => {
                                e.stopPropagation()
                                toAccess(record)
                            }}
                        >
                            {__('资源授权')}
                        </a>
                    ) : hasAuditProcess ? (
                        <a
                            onClick={(e) => {
                                e.stopPropagation()
                                toApply(record)
                            }}
                        >
                            {__('权限变更申请')}
                        </a>
                    ) : null}

                    {/* <a
                        onClick={(e) => {
                            e.stopPropagation()
                            toAuthInfo(record)
                        }}
                    >
                        {__('调用信息')}
                    </a> */}
                </Space>
            ),
        },
    ]

    const ownerColumns = useMemo(
        () => columns.filter((o) => o.dataIndex !== 'owner_name'),
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
            return getAvailableApiApply(questParams)
        }
        // 如果没有匹配特定条件，则返回包含空数据条目和总数量为0的Promise
        return Promise.resolve({
            entries: [],
            total_count: 0,
        })
    }
    return (
        <div className={styles['asset-container']}>
            <div className={styles.top}>
                <div>
                    <div className={styles['top-choice']}>
                        {selectedType === AssetVisitorTypes.USER ? (
                            <span>{__('我可授权的')}</span>
                        ) : (
                            <span>{__('授权给应用')}</span>
                        )}
                    </div>
                </div>
                <Space className={styles['top-search']}>
                    <SearchInput
                        placeholder={__('搜索资源名称、编码')}
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
                    <Dropdown
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
                            {/* <FiltersOutlined className={styles.filterIcon} /> */}
                            <FontIcon
                                name="icon-shaixuan"
                                className={styles.filterIcon}
                                style={{ marginRight: 8 }}
                            />
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
                    </Dropdown>
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
                            onClick={() => commonTableRef?.current?.getData()}
                        />
                    </span>
                </Space>
            </div>
            <div className={styles['common-table']}>
                <CommonTable
                    queryAction={getAsyncData}
                    params={queryParams}
                    isReplace
                    emptyExcludeField={
                        isOwner
                            ? ['publish_status', 'is_all', 'owner_id']
                            : ['subject']
                    }
                    baseProps={{
                        columns: isOwner ? ownerColumns : columns,
                        // scroll: {
                        //     y: `calc(100vh - ${320}px)`,
                        //     x: 1300,
                        // },
                        rowKey: 'service_id',
                        rowClassName: styles.tableRow,
                    }}
                    scrollY={`calc(100vh - ${320}px)`}
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
                                        <div>
                                            <span>{__('可先从')}</span>
                                            <Button
                                                type="link"
                                                onClick={() => {
                                                    window.open(
                                                        getActualUrl(
                                                            '/data-assets',
                                                            true,
                                                            LoginPlatform.drmp,
                                                        ),
                                                        '_blank',
                                                    )
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

                        if (needRefresh) {
                            refreshAuditProcess()
                        }
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

            {/* {authInfoOpen && (
                <AuthInfo
                    id={currentRow?.service_id}
                    open={authInfoOpen}
                    onClose={() => {
                        setAuthInfoOpen(false)
                    }}
                />
            )} */}
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
