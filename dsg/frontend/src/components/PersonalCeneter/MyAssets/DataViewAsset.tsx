import { DownOutlined, UpOutlined } from '@ant-design/icons'
import { Button, Dropdown, Space, Tooltip } from 'antd'
import { SortOrder } from 'antd/es/table/interface'
import classnames from 'classnames'
import moment from 'moment'
import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CommonTable from '@/components/CommonTable'
import { SearchInput } from '@/ui'
import { RefreshBtn, SortBtn } from '@/components/ToolbarComponents'
import { ResIcon } from '@/components/AccessPolicy/helper'
import { FiltersOutlined, FontIcon, InfotipOutlined } from '@/icons'
import {
    AssetTypeEnum,
    LoginPlatform,
    SortDirection,
    getUserDatasheetView,
    isMicroWidget,
} from '@/core'
import DropDownFilter from '@/components/DropDownFilter'
import { Architecture, DataNode } from '../../BusinessArchitecture/const'
import OrgAndDepartmentFilterTree from '../OrgAndDepartmentTree'
import { AssetVisitorTypes, InitCondition, ViewSortType } from './const'
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
import { useAssetsContext } from './AssetsVisitorProvider'
import AccessModal from '@/components/AccessPolicy/AccessModal'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import { getActualUrl } from '@/utils'

/**
 * 可用库表
 */
function DataViewAsset() {
    const { checkPermission } = useUserPermCtx()
    const navigator = useNavigate()
    const [{ using }, updateUsing] = useGeneralConfig()
    const [isOwner, setIsOwner] = useState<boolean>(false)
    const [isFilterPop, setIsFilterPop] = useState<boolean>(false)
    const [accessVisible, setAccessVisible] = useState<boolean>(false)
    const [applyVisible, setApplyVisible] = useState<boolean>(false)
    const [downloadOpen, setDownloadOpen] = useState(false)
    const [filterTitle, setFilterTitle] = useState<string>('筛选')
    const searchValue = useRef<string>('')
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)
    const { selectedId, selectedType } = useAssetsContext()

    const [hasAuditProcess, refreshAuditProcess] = useAuditProcess({
        audit_type: PolicyType.AssetPermission,
        service_type: BizType.AuthService,
    })

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
                ...prev,
                offset: 1,
                owner: isOwner,
                app_id: undefined,
            }))
        } else if (
            selectedType === AssetVisitorTypes.APPLICATION &&
            selectedId
        ) {
            setSearchCondition((prev) => ({
                ...prev,
                offset: 1,
                owner: undefined,
                app_id: selectedId || undefined,
            }))
        }
    }, [isOwner, selectedType, selectedId])

    useEffect(() => {
        if (
            selectedType === AssetVisitorTypes.APPLICATION &&
            selectedId &&
            isOwner
        ) {
            setIsOwner(false)
        }
    }, [selectedType, selectedId])

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
                    <span>{__('资源业务名称')}</span>
                    <span style={{ color: 'rgba(0,0,0,0.45)' }}>
                        {__('（编码）')}
                    </span>
                </div>
            ),
            dataIndex: 'business_name',
            key: 'business_name',
            sorter: true,
            showSorterTooltip: {
                title: __('按资源业务名称排序'),
            },
            sortOrder: tableSort[ViewSortType.NAME],
            render: (text, record) => (
                <div className={styles.assetInfo}>
                    <span>{ResIcon[AssetTypeEnum.DataView]}</span>
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
            title: __('资源技术名称'),
            dataIndex: 'technical_name',
            key: 'technical_name',
            ellipsis: true,
            render: (text, record) => record?.technical_name || '--',
        },
        {
            title: __('数据Owner'),
            dataIndex: 'owner',
            key: 'owner',
            ellipsis: true,
            render: (text, record) => record?.owner || '--',
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
            width: 200,
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
            ),
        },
    ]

    const ownerColumns = useMemo(
        () => columns.filter((o) => o.dataIndex !== 'owner'),
        [isOwner, tableSort],
    )

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
    const isDataOwner = useMemo(
        () => checkPermission('manageDataResourceAuthorization'),
        [checkPermission],
    )

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
                        columns: isOwner ? ownerColumns : columns,
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
                    scrollY={`calc(100vh - ${320}px)`}
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
                queryAction={getUserDataSheetViewData}
                params={searchCondition}
                baseProps={{
                    columns: isOwner ? ownerColumns : columns,
                    // scroll: {
                    //     y: `calc(100vh - ${320}px)`,
                    // },
                    rowKey: 'id',
                    rowClassName: styles.tableRow,
                }}
                scrollY={`calc(100vh - ${320}px)`}
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
        <div className={styles['asset-container']}>
            <div className={styles.top}>
                <div>
                    {selectedType === AssetVisitorTypes.USER ? (
                        isDataOwner ? (
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
                            <div className={styles['top-choice']}>
                                <span>{__('授权给我的')}</span>
                            </div>
                        )
                    ) : (
                        <div className={styles['top-choice']}>
                            <span>{__('授权给应用')}</span>
                        </div>
                    )}
                </div>
                <Space className={styles['top-search']}>
                    <SearchInput
                        placeholder={__('搜索资源业务名称、技术名称、编码')}
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
                                    menus={dataSortViewMenus}
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
                {/* <CommonTable
                    queryAction={getUserDatasheetView}
                    params={searchCondition}
                    baseProps={{
                        columns: isOwner ? ownerColumns : columns,
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

                        if (needRefresh) {
                            refreshAuditProcess()
                        }
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
