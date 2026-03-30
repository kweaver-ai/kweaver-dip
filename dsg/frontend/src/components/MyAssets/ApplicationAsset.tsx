import React, { useEffect, useRef, useState } from 'react'
import {
    Tabs,
    Input,
    Space,
    Dropdown,
    Button,
    Collapse,
    Checkbox,
    Badge,
    DatePicker,
} from 'antd'
import classNames from 'classnames'
import moment from 'moment'
import { useLocation, useNavigate } from 'react-router-dom'
import { debounce, trim } from 'lodash'
import { SortOrder } from 'antd/lib/table/interface'
import { SearchOutlined, DownOutlined, UpOutlined } from '@ant-design/icons'
import styles from './styles.module.less'
import __ from './locale'
import CommonTable from '../CommonTable'
import { FixedType } from '../CommonTable/const'
import {
    IApplicationAssetQueryList,
    menus,
    apiMenus,
    SortType,
    appAssetCatlgDetails,
    auditType,
    auditStateToString,
    auditStateToNum,
    avalidableSortMenus,
    apiSortMenus,
} from './const'
import dataEmpty from '@/assets/dataEmpty.svg'
import { getApplyAssets, SortDirection, getApiApply } from '@/core'
import { SearchInput } from '@/ui'
import { RefreshBtn, SortBtn } from '@/components/ToolbarComponents'
import DropDownFilter from '../DropDownFilter'
import { FiltersOutlined, FontIcon } from '@/icons'
import DataCatlgContent from '../DataAssetsCatlg/DataCatlgContent'
import { getAuditStateLabel } from '../ResourcesDir/helper'
import { auditStateList } from '../ResourcesDir/const'
import Details from './Details'
import DocAuditClient from '../DataAssetsCatlg/DocAuditClient'
import { useQuery, getActualUrl } from '@/utils'
import ApplicationServiceDetail from '../DataAssetsCatlg/ApplicationServiceDetail'
import { stampFormatToDate, disabledDate } from './helper'

const { Panel } = Collapse
const { RangePicker } = DatePicker

const ApplicationAsset = () => {
    const { pathname } = useLocation()
    const navigator = useNavigate()
    const query = useQuery()
    const tabType = query.get('tabType') || undefined
    const applyState = query.get('applyState') || undefined
    const menuType = query.get('menuType') || undefined

    const initSearchCondition: IApplicationAssetQueryList = {
        offset: 1,
        limit: 10,
    }
    const [openDropdown, setOpenDropdown] = useState<boolean>(false)
    const [searchValue, setSearchValue] = useState<string>('')
    const [filterTitle, setFilterTitle] = useState<string>(__('筛选'))
    const [createSortOrder, setCreateSortOrder] = useState<SortOrder>('descend')
    const [searchCondition, setSearchCondition] =
        useState<IApplicationAssetQueryList>({
            ...initSearchCondition,
        })
    // 资源详情页抽屉的显示/隐藏
    const [assetDetailsOpen, setAssetDetailsOpen] = useState<boolean>(false)
    // 申请详情
    const [detailsOpen, setDetailsOpen] = useState<boolean>(false)
    const [auditOpen, setAuditOpen] = useState<boolean>(false)
    const [apiDetailsOpen, setApiDetailsOpen] = useState<boolean>(false)
    const [currentRow, setCurrentRow] = useState<any>({})
    const [badgeCount, setBadgeCount] = useState<number>(0)
    const [checkboxValue, setCheckboxValue] = useState<number[]>([])
    const [detailsData, setDetailsData] = useState<any[]>(appAssetCatlgDetails)
    const [timeValue, setTimeValue] = useState<any>()
    const [timeValueStamp, setTimeValueStamp] = useState<any>()
    const [auditParams, setAuditParams] = useState<any>()
    const [activeKey, setActiveKey] = useState<string>(
        tabType || 'resouceCatalog',
    )
    const [sortMenus, setSortMenus] = useState<any>(menus)
    // 排序
    const [selectedSort, setSelectedSort] = useState<any>(menus[0])
    const [isInitState, setIsInitState] = useState<any>(true)

    const commonTableRef: any = useRef()
    const ref: any = useRef()

    useEffect(() => {
        setBadgeCount(
            (searchCondition?.state || searchCondition?.audit_status) &&
                searchCondition?.end_time
                ? 2
                : searchCondition?.state ||
                  searchCondition?.audit_status ||
                  searchCondition?.end_time
                ? 1
                : 0,
        )
    }, [searchCondition])

    useEffect(() => {
        if (applyState && isInitState) {
            // 资源申请中跳转进入，增加选中延时
            setTimeout(() => {
                reset()
            }, 150)
        } else {
            reset()
        }
        setSortMenus(activeKey === 'resouceCatalog' ? menus : apiMenus)
    }, [activeKey])

    const columns = [
        {
            title:
                activeKey === 'resouceCatalog' ? (
                    <div>
                        <span>{__('资源名称')}</span>
                        <span style={{ color: 'rgba(0,0,0,0.45)' }}>
                            {__('（编号）')}
                        </span>
                    </div>
                ) : (
                    <div>
                        <span>{__('接口名称')}</span>
                        <span style={{ color: 'rgba(0,0,0,0.45)' }}>
                            {__('（编号）')}
                        </span>
                    </div>
                ),
            dataIndex:
                activeKey === 'resouceCatalog' ? 'asset_name' : 'service_name',
            key: 'asset_name',
            width: 220,
            render: (text, record) => (
                <>
                    <div
                        className={classNames(styles.catlgName)}
                        title={text}
                        onClick={() => toAssetDetails(record)}
                    >
                        <div className={styles.ellipsis} title={text}>
                            {text || '--'}
                        </div>
                    </div>
                    <div
                        className={styles.ellipsis}
                        title={
                            activeKey === 'resouceCatalog'
                                ? record.asset_code
                                : record.service_code
                        }
                        style={{
                            color: 'rgba(0, 0, 0, 0.45)',
                            fontSize: '12px',
                        }}
                    >
                        {activeKey === 'resouceCatalog'
                            ? record.asset_code
                            : record.service_code}
                    </div>
                </>
            ),
            ellipsis: true,
        },
        {
            title: __('申请编号'),
            dataIndex: activeKey === 'resouceCatalog' ? 'apply_sn' : 'apply_id',
            key: 'apply_sn',
            ellipsis: true,
            width: 180,
            render: (text) => text || '--',
        },
        {
            title: __('所属部门'),
            dataIndex: activeKey === 'resouceCatalog' ? 'orgname' : 'org_name',
            key: 'orgname',
            ellipsis: true,
            render: (text) => text || '--',
        },
        {
            title: __('数据Owner'),
            dataIndex: 'owner_name',
            key: 'owner_name',
            ellipsis: true,
            render: (text) => text || '--',
        },
        {
            title: __('申请时长'),
            dataIndex: 'apply_days',
            key: 'apply_days',
            ellipsis: true,
            render: (text, record) => {
                if (activeKey === 'resouceCatalog') {
                    return `${text}${__('天')}` || '--'
                }
                return text ? `${text}${__('天')}` : __('永久')
            },
        },
        {
            title: __('申请状态'),
            dataIndex:
                activeKey === 'resouceCatalog' ? 'apply_state' : 'audit_status',
            key: 'apply_state',
            ellipsis: true,
            render: (text, record) =>
                getAuditStateLabel(
                    activeKey === 'resouceCatalog'
                        ? text
                        : auditStateToNum[text],
                    0,
                ),
        },
        {
            title: __('申请时间'),
            dataIndex:
                activeKey === 'resouceCatalog' ? 'created_at' : 'create_time',
            key: 'created_at',
            ellipsis: true,
            sorter: true,
            sortOrder: createSortOrder,
            showSorterTooltip: false,
            render: (text, record) =>
                text ? moment(text)?.format('YYYY-MM-DD HH:mm:ss') : '--',
        },
        {
            title: '操作',
            key: 'action',
            width: 120,
            fixed: FixedType.RIGHT,
            render: (text: string, record) => (
                <Space>
                    <a
                        onClick={(e) => {
                            e.stopPropagation()
                            toDetails(record)
                        }}
                    >
                        {__('申请详情')}
                    </a>
                    {/* <a
                        onClick={(e) => {
                            e.stopPropagation()
                            // setAuditOpen(true)
                            // setAuditParams({
                            //     target: 'apply',
                            //     applyId: record.flow_apply_id,
                            // })
                            const url = getActualUrl(
                                `/taskCenter/doc-audit-client?target=apply&applyId=${record.flow_apply_id}`,
                            )
                            window.open(url)
                        }}
                    >
                        {__('审批流程')}
                    </a> */}
                </Space>
            ),
        },
    ]

    const toAssetDetails = (item: any) => {
        setCurrentRow(item)
        if (activeKey === 'resouceCatalog') {
            setAssetDetailsOpen(true)
        } else {
            setApiDetailsOpen(true)
        }
    }

    const toDetails = async (row: any) => {
        setCurrentRow(row)
        setDetailsOpen(true)
    }

    // 排序方式改变
    const handleSortWayChange = (selectedMenu, pagination?: any) => {
        if (selectedMenu) {
            setCreateSortOrder(
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
            label: __('数据目录'),
            key: 'resouceCatalog',
        },
        {
            label: __('接口服务'),
            key: 'apiService',
        },
    ]

    const handleOpenDropdownChange = (flag: boolean) => {
        setOpenDropdown(flag)
    }

    const statueOnchange = (val) => {
        setCheckboxValue(val)
        const audit_status = val.map((item) => auditStateToString[item]) || []
        const stateObj: any =
            activeKey === 'resouceCatalog'
                ? {
                      state: val?.length ? val.join() : null,
                  }
                : {
                      audit_status: audit_status?.length
                          ? audit_status.join()
                          : null,
                  }
        setSearchCondition({
            ...searchCondition,
            offset: 1,
            ...stateObj,
        })
        setIsInitState(false)
    }
    const reset = (clearState?: boolean) => {
        setSearchValue('')
        setCheckboxValue([])
        setTimeValue([])
        setTimeValueStamp(null)
        setCreateSortOrder('descend')
        let stateObj: any = {}

        // 首页通过 资源申请中 跳转过来，不清空状态，清除条件或者变更状态选项则不再使用url中状态
        if (applyState && isInitState && !clearState) {
            const audit_status = auditStateToString[applyState]
            const state = Number(applyState)
            setCheckboxValue([state])
            stateObj =
                activeKey === 'resouceCatalog'
                    ? {
                          state: applyState,
                      }
                    : {
                          audit_status,
                      }
        }

        if (clearState) {
            const url = `${pathname}/?menuType=${menuType}`
            navigator(url)
            setIsInitState(false)
        }
        setSelectedSort({
            sort: SortDirection.DESC,
            key: activeKey === 'resouceCatalog' ? 'created_at' : 'create_time',
        })
        setSearchCondition({
            state: undefined,
            audit_status: undefined,
            start_time: undefined,
            end_time: undefined,
            offset: 1,
            limit: 10,
            direction: SortDirection.DESC,
            sort: activeKey === 'resouceCatalog' ? 'created_at' : 'create_time',
            keyword: undefined,
            ...stateObj,
        })
    }

    const handleTableChange = (pagination, sorter) => {
        if (sorter.column) {
            setCreateSortOrder(null)
            if (sorter.field === 'created_at') {
                setCreateSortOrder(sorter.order || 'ascend')
                setSelectedSort({
                    key: 'created_at',
                    sort:
                        sorter.order === 'descend'
                            ? SortDirection.DESC
                            : SortDirection.ASC,
                })
                handleSortWayChange(
                    {
                        key: 'created_at',
                        sort:
                            sorter.order === 'descend'
                                ? SortDirection.DESC
                                : SortDirection.ASC,
                    },
                    pagination,
                )
            }
            if (sorter.field === 'create_time') {
                setCreateSortOrder(sorter.order || 'ascend')
                setSelectedSort({
                    key: 'create_time',
                    sort:
                        sorter.order === 'descend'
                            ? SortDirection.DESC
                            : SortDirection.ASC,
                })
                handleSortWayChange(
                    {
                        key: 'create_time',
                        sort:
                            sorter.order === 'descend'
                                ? SortDirection.DESC
                                : SortDirection.ASC,
                    },
                    pagination,
                )
            }
        } else {
            setCreateSortOrder('ascend')
            setSelectedSort({
                key: searchCondition.sort,
                sort:
                    searchCondition.direction === SortDirection.ASC
                        ? SortDirection.DESC
                        : SortDirection.ASC,
            })
            handleSortWayChange(
                {
                    key:
                        activeKey === 'resouceCatalog'
                            ? 'created_at'
                            : 'create_time',
                    sort: SortDirection.ASC,
                },
                pagination,
            )
        }
    }

    const filterContent = () => {
        return (
            <div className={styles.filterContent}>
                <div className={styles.title}>
                    <div>{__('筛选')}</div>
                    <a
                        type="text"
                        onClick={() => {
                            reset(true)
                        }}
                        className={styles.resetBtn}
                    >
                        {__('重置筛选')}
                    </a>
                </div>
                <Collapse
                    defaultActiveKey={['1', '2']}
                    ghost
                    expandIconPosition="end"
                    className={styles.filterCollapse}
                    // eslint-disable-next-line react/no-unstable-nested-components
                    expandIcon={({ isActive }) =>
                        isActive ? <DownOutlined /> : <UpOutlined />
                    }
                >
                    <Panel header={__('申请状态')} key="1">
                        <Checkbox.Group
                            style={{ width: '100%' }}
                            onChange={statueOnchange}
                            value={checkboxValue}
                        >
                            {auditStateList.map((item) => {
                                return (
                                    <Checkbox
                                        key={item.value}
                                        value={item.value}
                                        className={styles.filterCheckbox}
                                    >
                                        {item.label}
                                    </Checkbox>
                                )
                            })}
                        </Checkbox.Group>
                    </Panel>
                    <Panel header={__('申请时间')} key="2">
                        <RangePicker
                            className={styles.filterDatePicker}
                            disabledDate={(current: any) =>
                                disabledDate(current, {})
                            }
                            value={timeValueStamp}
                            placeholder={[__('开始时间'), __('结束时间')]}
                            getPopupContainer={(triggerNode: any) =>
                                triggerNode.parentNode
                            }
                            onChange={(dates, dateString) => {
                                setTimeValue(dateString)
                                if (!dates) {
                                    setTimeValueStamp(null)
                                }
                                // 开始时间戳
                                const timeStartStamp = moment(
                                    dateString[0],
                                ).valueOf()
                                // 结束时间戳=（被选择日期加一的）时间戳 - 1
                                const timeEndStamp = moment(dateString[1])
                                    .endOf('day')
                                    .valueOf()
                                const timeObj: any = {
                                    start_time: undefined,
                                    end_time: undefined,
                                }
                                if (timeStartStamp) {
                                    timeObj.start_time =
                                        activeKey === 'resouceCatalog'
                                            ? timeStartStamp
                                            : `${dateString[0]} 00:00:00`
                                }
                                if (timeEndStamp) {
                                    timeObj.end_time =
                                        activeKey === 'resouceCatalog'
                                            ? timeEndStamp
                                            : `${dateString[1]} 23:59:59`
                                }
                                if (timeStartStamp && timeEndStamp) {
                                    setTimeValueStamp(dates)
                                }
                                // 清空 or 选择完整时间
                                if (
                                    !dates ||
                                    (timeStartStamp && timeEndStamp)
                                ) {
                                    setSearchCondition({
                                        ...searchCondition,
                                        offset: 1,
                                        ...timeObj,
                                    })
                                }
                            }}
                            allowEmpty={[true, true]}
                            onBlur={() => {
                                if (timeValue) {
                                    setTimeValueStamp([
                                        timeValue[0]
                                            ? stampFormatToDate(timeValue[0])
                                            : null,
                                        timeValue[1]
                                            ? stampFormatToDate(timeValue[1])
                                            : moment(),
                                    ])
                                    const timeObj: any = {
                                        start_time: undefined,
                                        end_time: undefined,
                                    }
                                    if (timeValue[0]) {
                                        timeObj.start_time =
                                            activeKey === 'resouceCatalog'
                                                ? moment(timeValue[0]).valueOf()
                                                : `${timeValue[0]} 00:00:00`
                                    }
                                    if (timeValue[1]) {
                                        timeObj.end_time =
                                            activeKey === 'resouceCatalog'
                                                ? moment(timeValue[1])
                                                      .endOf('day')
                                                      .valueOf()
                                                : `${timeValue[1]} 23:59:59`
                                    }
                                    // 当天结束时间-时间戳
                                    const curDateTimeStamp = moment()
                                        .endOf('day')
                                        .valueOf()
                                    if (timeValue[0] && !timeValue[1]) {
                                        timeObj.end_time =
                                            activeKey === 'resouceCatalog'
                                                ? curDateTimeStamp
                                                : moment(
                                                      curDateTimeStamp,
                                                  )?.format(
                                                      'YYYY-MM-DD HH:mm:ss',
                                                  )
                                    }
                                    // 已选开始时间、结束时间，不调用接口，change方法已调用
                                    if (!(timeValue[0] && timeValue[1])) {
                                        setSearchCondition({
                                            ...searchCondition,
                                            offset: 1,
                                            ...timeObj,
                                        })
                                    }
                                }
                            }}
                        />
                    </Panel>
                </Collapse>
            </div>
        )
    }

    const dropdownItems = [
        {
            key: '1',
            label: filterContent(),
        },
    ]

    const resouceSearchContent = () => {
        return (
            <Space>
                <SearchInput
                    placeholder={
                        activeKey === 'resouceCatalog'
                            ? __('搜索资源名称、编号')
                            : __('搜索接口名称、编号')
                    }
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
                    {/* <Badge count={badgeCount} color="#126ee3"> */}
                    <Button
                        className={classNames(
                            styles.filterBtn,
                            badgeCount > 0 && styles.filterBtnActive,
                        )}
                        title={filterTitle}
                    >
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
                    {/* </Badge> */}
                </Dropdown>
                <span>
                    <SortBtn
                        contentNode={
                            <DropDownFilter
                                menus={sortMenus}
                                defaultMenu={sortMenus[0]}
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
            <div className={styles.pageTitle}>{__('资源申请记录')}</div>
            <Tabs
                items={items}
                tabBarExtraContent={resouceSearchContent()}
                activeKey={activeKey}
                onChange={setActiveKey}
            />
            <div className={styles.commonTabelBox}>
                <CommonTable
                    queryAction={
                        activeKey === 'resouceCatalog'
                            ? getApplyAssets
                            : getApiApply
                    }
                    params={searchCondition}
                    baseProps={{
                        columns,
                        scroll: {
                            x: 1440,
                            y: `calc(100vh - 280px)`,
                        },
                        rowKey:
                            activeKey === 'resouceCatalog' ? 'id' : 'apply_id',
                        rowClassName: styles.tableRow,
                    }}
                    ref={commonTableRef}
                    emptyDesc={<div>{__('暂无数据')}</div>}
                    emptyIcon={dataEmpty}
                    onChange={(pagination, filters, sorter) =>
                        handleTableChange(pagination, sorter)
                    }
                    onTableListUpdated={() => {
                        setSelectedSort(undefined)
                    }}
                />
            </div>
            {assetDetailsOpen && (
                <DataCatlgContent
                    open={assetDetailsOpen}
                    onClose={() => {
                        setAssetDetailsOpen(false)
                    }}
                    assetsId={currentRow?.asset_id || ''}
                />
            )}
            {detailsOpen && (
                <Details
                    open={detailsOpen}
                    title={__('资源申请详情')}
                    onClose={() => {
                        setDetailsOpen(false)
                    }}
                    id={
                        activeKey === 'resouceCatalog'
                            ? currentRow.id
                            : currentRow.apply_id
                    }
                    type={
                        activeKey === 'resouceCatalog'
                            ? 'catalog'
                            : 'apiService'
                    }
                />
            )}
            {/* 审核待办 */}
            {auditOpen && (
                <DocAuditClient
                    title={__('审批流程')}
                    params={auditParams}
                    open={auditOpen}
                    onClose={() => {
                        setAuditOpen(false)
                    }}
                    showReload={false}
                />
            )}

            {apiDetailsOpen && (
                <div className={styles.applicationServiceBox}>
                    <ApplicationServiceDetail
                        open={apiDetailsOpen}
                        onClose={(flag) => {
                            setApiDetailsOpen(false)
                            // flag 是否提交申请，提交申请后，更新列表状态
                            if (flag) {
                                commonTableRef?.current?.getData()
                            }
                        }}
                        serviceCode={currentRow.service_id}
                    />
                </div>
            )}
        </div>
    )
}

export default ApplicationAsset
