import React, { useEffect, useRef, useState } from 'react'
import { Tabs, Input, Space, Dropdown, Button } from 'antd'
import classNames from 'classnames'
import moment from 'moment'
import { debounce, trim } from 'lodash'
import { SortOrder } from 'antd/lib/table/interface'
import {
    SearchOutlined,
    DownOutlined,
    UpOutlined,
    InfoCircleFilled,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import styles from './styles.module.less'
import __ from './locale'
import CommonTable from '../CommonTable'
import {
    IAvailableAssetsQueryList,
    avalidableSortMenus,
    SortType,
    apiSortMenus,
} from './const'
import dataEmpty from '@/assets/dataEmpty.svg'
import searchEmpty from '@/assets/searchEmpty.svg'
import {
    getAvailableAssets,
    getAvailableApiApply,
    SortDirection,
    AssetTypeEnum,
    getUserDatasheetView,
} from '@/core'
import { SearchInput } from '@/ui'
import {
    RefreshBtn,
    SortBtn,
    LabelSelect,
} from '@/components/ToolbarComponents'
import DropDownFilter from '../DropDownFilter'
import { FiltersOutlined, FontIcon } from '@/icons'
import { DataNode, Architecture } from '../BusinessArchitecture/const'
import OrgAndDepartmentFilterTree from './OrgAndDepartmentFilterTree'
import DataCatlgContent from '../DataAssetsCatlg/DataCatlgContent'
import DataDownloadConfig from '../DataAssetsCatlg/DataDownloadConfig'
import AuthInfo from './AuthInfo'
import ApplicationServiceDetail from '../DataAssetsCatlg/ApplicationServiceDetail'
import { ResIcon, labelText } from '@/components/AccessPolicy/helper'
import ApiDetail from '@/components/AccessPolicy/components/ApiDetail'
import AccessManage from '@/components/AccessPolicy/components/AccessManage'

const AvailableAssets = () => {
    const navigator = useNavigate()
    const initSearchCondition: IAvailableAssetsQueryList = {
        offset: 1,
        limit: 10,
    }
    const [openDropdown, setOpenDropdown] = useState<boolean>(false)
    const [searchValue, setSearchValue] = useState<string>('')
    const [filterTitle, setFilterTitle] = useState<string>('部门不限')
    // 排序
    const [selectedSort, setSelectedSort] = useState<any>(
        avalidableSortMenus[0],
    )
    const [publishSortOrder, setPublishSortOrder] =
        useState<SortOrder>('descend')
    const [searchCondition, setSearchCondition] =
        useState<IAvailableAssetsQueryList>({
            ...initSearchCondition,
        })
    // 详情页抽屉的显示/隐藏
    const [detailOpen, setDetailOpen] = useState<boolean>(false)
    const [accessVisible, setAccessVisible] = useState<boolean>(false)
    const [currentRow, setCurrentRow] = useState<any>({})
    const [downloadOpen, setDownloadOpen] = useState(false)
    const [authInfoOpen, setAuthInfoOpen] = useState(false)
    const [apiDetailsOpen, setApiDetailsOpen] = useState<boolean>(false)
    const [activeKey, setActiveKey] = useState<string>('dataView')
    const [sortMenus, setSortMenus] = useState<any>(avalidableSortMenus)

    const commonTableRef: any = useRef()
    const ref: any = useRef()

    useEffect(() => {
        setSortMenus(
            activeKey === 'dataView' ? avalidableSortMenus : apiSortMenus,
        )
        setFilterTitle(__('部门不限'))
        setSelectedSort({
            sort: SortDirection.DESC,
            key: activeKey === 'dataView' ? 'publish_at' : 'online_time',
        })
        setSearchCondition({
            ...initSearchCondition,
            direction: SortDirection.DESC,
            sort: activeKey === 'dataView' ? 'publish_at' : 'online_time',
            orgcode: undefined,
            org_code: undefined,
        })
        setSearchValue('')
        setPublishSortOrder('descend')
    }, [activeKey])

    const columns = [
        {
            title: (
                <div>
                    <span>{__('资源名称')}</span>
                    <span style={{ color: 'rgba(0,0,0,0.45)' }}>
                        {__('（编号）')}
                    </span>
                </div>
            ),
            dataIndex:
                activeKey === 'dataView' ? 'business_name' : 'service_name',
            key: 'business_name',
            render: (text, record) => (
                <div className={styles.assetInfo}>
                    <span>
                        {
                            ResIcon[
                                activeKey === 'dataView'
                                    ? AssetTypeEnum.DataView
                                    : AssetTypeEnum.Api
                            ]
                        }
                    </span>
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
                            title={
                                activeKey === 'dataView'
                                    ? record.uniform_catalog_code
                                    : record.service_code
                            }
                            style={{
                                color: 'rgba(0, 0, 0, 0.45)',
                                fontSize: '12px',
                            }}
                        >
                            {activeKey === 'dataView'
                                ? record.uniform_catalog_code
                                : record.service_code}
                        </div>
                    </div>
                </div>
            ),
            ellipsis: true,
        },
        {
            title: __('数据Owner'),
            dataIndex: activeKey === 'dataView' ? 'owner' : 'owner_name',
            key: 'owner',
            ellipsis: true,
            render: (text, record) =>
                (activeKey === 'dataView'
                    ? record?.owner
                    : record?.owner_name) || '--',
        },
        {
            title: __('所属部门'),
            dataIndex: activeKey === 'dataView' ? 'department' : 'org_name',
            key: 'department',
            ellipsis: true,
            render: (text, record) =>
                activeKey === 'dataView' ? (
                    <span title={record?.department_path || '无'}>
                        {record?.department || '--'}
                    </span>
                ) : (
                    <span title={record?.org_name || '无'}>
                        {labelText(record?.org_name) || '--'}
                    </span>
                ),
        },
        {
            title: __('上线时间'),
            dataIndex: activeKey === 'dataView' ? 'publish_at' : 'online_time',
            key: 'publish_at',
            ellipsis: true,
            sorter: true,
            sortOrder: publishSortOrder,
            showSorterTooltip: false,
            render: (text) =>
                text
                    ? activeKey === 'dataView'
                        ? moment(text)?.format('YYYY-MM-DD HH:mm:ss')
                        : text
                    : '--',
        },
        {
            title: '操作',
            key: 'action',
            width: 160,
            render: (text: string, record) => (
                <Space direction="horizontal" size={12}>
                    {/* // TODO : 权限变更  数据下载 */}
                    {/* <a
                        onClick={(e) => {
                            e.stopPropagation()
                            toAccess(record)
                        }}
                    >
                        {__('权限变更')}
                    </a> */}

                    {/* <a
                            onClick={(e) => {
                                e.stopPropagation()
                                toDownload(record)
                            }}
                        >
                            {__('数据下载')}
                        </a> */}
                    {
                        activeKey === 'dataView' ? <span /> : null
                        // (
                        //     <a
                        //         onClick={(e) => {
                        //             e.stopPropagation()
                        //             toAuthInfo(record)
                        //         }}
                        //     >
                        //         {__('调用信息')}
                        //     </a>
                        // )
                    }
                </Space>
            ),
        },
    ]

    const toDetails = (item: any) => {
        setCurrentRow(item)
        if (activeKey === 'dataView') {
            // setDetailOpen(true)
            navigator(`/datasheet-view/detail?id=${item.id}&backPrev=true`)
        } else {
            setApiDetailsOpen(true)
        }
    }

    const toAccess = (item: any) => {
        setCurrentRow(item)
        setAccessVisible(true)
    }
    const toDownload = (item: any) => {
        setCurrentRow(item)
        setDownloadOpen(true)
    }
    const toAuthInfo = (item: any) => {
        setCurrentRow(item)
        setAuthInfoOpen(true)
    }

    const getTableView = () => {
        return (
            <div className={styles.commonTabelBox}>
                <CommonTable
                    queryAction={
                        activeKey === 'dataView'
                            ? getUserDatasheetView
                            : getAvailableApiApply
                    }
                    params={searchCondition}
                    baseProps={{
                        columns,
                        scroll: {
                            y: `calc(100vh - ${280}px)`,
                        },
                        rowKey: activeKey === 'dataView' ? 'id' : 'service_id',
                        rowClassName: styles.tableRow,
                    }}
                    ref={commonTableRef}
                    emptyDesc={
                        <div>
                            {searchCondition.keyword
                                ? __('抱歉，没有找到相关内容')
                                : __('暂无数据')}
                        </div>
                    }
                    emptyIcon={
                        searchCondition.keyword ? searchEmpty : dataEmpty
                    }
                    onChange={(pagination, filters, sorter) =>
                        handleTableChange(pagination, sorter)
                    }
                    onTableListUpdated={() => {
                        setSelectedSort(undefined)
                    }}
                />
            </div>
        )
    }

    // 排序方式改变
    const handleSortWayChange = (selectedMenu, pagination?: any) => {
        if (selectedMenu) {
            setPublishSortOrder(
                selectedMenu.sort === 'asc' ? 'ascend' : 'descend',
            )
            setSearchCondition({
                ...searchCondition,
                offset: pagination?.current || 1,
                limit: pagination?.pageSize,
                direction: selectedMenu.sort,
                sort: selectedMenu.key,
            })
        }
    }

    const items = [
        {
            label: __('库表'),
            key: 'dataView',
            children: getTableView(),
        },
        {
            label: __('接口服务'),
            key: 'apiService',
            children: getTableView(),
        },
    ]

    const getSelectedNode = (sn?: DataNode, delNode?: DataNode) => {
        if (sn) {
            const org = {
                org_code: sn.id,
            }
            setSearchCondition({
                ...searchCondition,
                offset: 1,
                ...org,
            })
            setFilterTitle(
                sn.id ? `${__('已选部门：')}${sn.name}` : __('部门不限'),
            )
        }
        setOpenDropdown(false)
    }

    const handleOpenDropdownChange = (flag: boolean) => {
        setOpenDropdown(flag)
    }
    const handleTableChange = (pagination, sorter) => {
        if (sorter.column) {
            setPublishSortOrder(null)
            if (sorter.field === 'publish_at') {
                setPublishSortOrder(sorter.order || 'ascend')
                setSelectedSort({
                    key: 'publish_at',
                    sort:
                        sorter?.order === 'ascend'
                            ? SortDirection.ASC
                            : SortDirection.DESC,
                })
                handleSortWayChange(
                    {
                        key: 'publish_at',
                        sort:
                            sorter.order === 'descend'
                                ? SortDirection.DESC
                                : SortDirection.ASC,
                    },
                    pagination,
                )
            }
            if (sorter.field === 'online_time') {
                setPublishSortOrder(sorter.order || 'ascend')
                setSelectedSort({
                    key: 'online_time',
                    sort:
                        sorter?.order === 'ascend'
                            ? SortDirection.ASC
                            : SortDirection.DESC,
                })
                handleSortWayChange(
                    {
                        key: 'online_time',
                        sort:
                            sorter.order === 'descend'
                                ? SortDirection.DESC
                                : SortDirection.ASC,
                    },
                    pagination,
                )
            }
        } else {
            setPublishSortOrder('ascend')
            setSelectedSort({
                key: searchCondition.sort,
                sort:
                    searchCondition.direction === SortDirection.DESC
                        ? SortDirection.ASC
                        : SortDirection.DESC,
            })
            handleSortWayChange(
                {
                    key:
                        activeKey === 'dataView' ? 'publish_at' : 'online_time',
                    sort: SortDirection.ASC,
                },
                pagination,
            )
        }
    }

    const dropdownItems = [
        {
            key: '1',
            label: (
                <OrgAndDepartmentFilterTree
                    getSelectedNode={getSelectedNode}
                    filterType={[
                        Architecture.ORGANIZATION,
                        Architecture.DEPARTMENT,
                    ].join()}
                />
            ),
        },
    ]

    const resouceSearchContent = () => {
        return (
            <Space>
                <SearchInput
                    placeholder={__('搜索资源名称、编号')}
                    onKeyChange={(kw: string) => {
                        setSearchValue(kw)
                        // if (kw) {
                        setSearchCondition({
                            ...searchCondition,
                            offset: 1,
                            keyword: kw || undefined,
                        })
                        // }
                    }}
                    value={searchValue}
                    className={styles.searchInput}
                    style={{ width: 280 }}
                />
                <Dropdown
                    menu={{ items: dropdownItems }}
                    trigger={['click']}
                    onOpenChange={handleOpenDropdownChange}
                    open={openDropdown}
                    placement="bottomLeft"
                    overlayClassName={styles.filterDropdown}
                    getPopupContainer={(node) => node.parentElement || node}
                >
                    <Button className={styles.filterBtn} title={filterTitle}>
                        {/* <FiltersOutlined className={styles.filterIcon} /> */}
                        <FontIcon
                            name="icon-shaixuan"
                            className={styles.filterIcon}
                            style={{ marginRight: 8 }}
                        />
                        <span className={styles.filterText}>{filterTitle}</span>
                        <span className={styles.dropIcon}>
                            {openDropdown ? <UpOutlined /> : <DownOutlined />}
                        </span>
                    </Button>
                </Dropdown>
                <span>
                    <SortBtn
                        contentNode={
                            <DropDownFilter
                                menus={sortMenus}
                                defaultMenu={avalidableSortMenus[0]}
                                menuChangeCb={handleSortWayChange}
                                changeMenu={selectedSort}
                            />
                        }
                    />
                    <RefreshBtn
                        onClick={() => commonTableRef?.current?.getData()}
                    />
                </span>
            </Space>
        )
    }

    return (
        <div className={styles.availableAssetsWrapper}>
            <div className={styles.pageTitle}>{__('可用资源')}</div>
            <Tabs
                items={items}
                tabBarExtraContent={resouceSearchContent()}
                activeKey={activeKey}
                onChange={setActiveKey}
                destroyInactiveTabPane
            />
            {detailOpen && (
                <DataCatlgContent
                    open={detailOpen}
                    onClose={() => {
                        setDetailOpen(false)
                    }}
                    assetsId={currentRow?.id || ''}
                />
            )}
            {downloadOpen && (
                <DataDownloadConfig
                    formViewId={currentRow?.id}
                    open={downloadOpen}
                    onClose={() => {
                        setDownloadOpen(false)
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
                    <ApiDetail
                        open={apiDetailsOpen}
                        onClose={() => {
                            setApiDetailsOpen(false)
                        }}
                        serviceID={currentRow?.service_id}
                    />
                </div>
            )}
            {accessVisible && (
                <div className={styles.accessServiceBox}>
                    <AccessManage
                        id={
                            activeKey === 'dataView'
                                ? currentRow.id
                                : currentRow.service_id
                        }
                        type={
                            activeKey === 'dataView'
                                ? AssetTypeEnum.DataView
                                : AssetTypeEnum.Api
                        }
                        onClose={() => {
                            setAccessVisible(false)
                        }}
                        indicatorType={
                            activeKey === 'indicator'
                                ? currentRow.indicator_type
                                : undefined
                        }
                    />
                </div>
            )}
        </div>
    )
}

export default AvailableAssets
