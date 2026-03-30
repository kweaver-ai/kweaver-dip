/* eslint-disable no-case-declarations */
import { useAntdTable, useDebounce, useUpdateEffect } from 'ahooks'
import { Button, Space, Table, Tabs, Tooltip } from 'antd'
import { SortOrder } from 'antd/es/table/interface'
import { isNumber } from 'lodash'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import empty from '@/assets/dataEmpty.svg'
import ApplicationServiceDetail from '@/components/DataAssetsCatlg/ApplicationServiceDetail'
import DropDownFilter from '@/components/DropDownFilter'
import CommonIcon from '@/components/CommonIcon'
import LogicViewDetail from '@/components/DataAssetsCatlg/LogicViewDetail'
import { RefreshBtn, SortBtn } from '@/components/ToolbarComponents'
import {
    AssetTypeEnum,
    SortDirection,
    formatError,
    getDataViewAuthList,
    getIndictorList,
    queryServiceOverviewList,
} from '@/core'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { ReactComponent as L2Svg } from '@/icons/svg/outlined/L2.svg'
import {
    Empty,
    LightweightSearch,
    Loader,
    OptionMenuType,
    SearchInput,
} from '@/ui'
import { OperateType, formatTime } from '@/utils'
import { ApiOptions, IndicatorTypes, SwitchMode } from '../../const'
import {
    AssetIcon,
    ResIcon,
    getTitleByNode,
    labelText,
    searchData,
    textLabel,
} from '../../helper'
import __ from '../../locale'
import styles from './styles.module.less'
import { GlossaryIcon } from '@/components/BusinessDomain/GlossaryIcons'
import { BusinessDomainType } from '@/components/BusinessDomain/const'
import { ApiSortType, ViewSortType } from '@/components/MyAssets/const'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import IndicatorViewDetail from '@/components/DataAssetsCatlg/IndicatorViewDetail'
import { IformItem, SearchType } from '@/ui/LightweightSearch/const'
import IndicatorIcons from '@/components/IndicatorManage/IndicatorIcons'

interface IAssetContent {
    currentNode?: any
    activeType?: string | null
}

const MenuList = [
    {
        key: OperateType.EDIT,
        label: __('资源授权'),
        menuType: OptionMenuType.Menu,
        icon: (
            <FontIcon
                name="icon-shouquan"
                type={IconType.FONTICON}
                className={styles.itemOprIcon}
            />
        ),
    },
]

const TypeMap = [
    BusinessDomainType.subject_domain_group,
    BusinessDomainType.subject_domain,
    BusinessDomainType.business_object,
    BusinessDomainType.logic_entity,
]

function AssetContent({ currentNode, activeType }: IAssetContent) {
    const navigator = useNavigate()
    const [ownerId] = useCurrentUser('ID')
    const [{ using, local_app }, updateUsing] = useGeneralConfig()
    // 是否启用数据资源
    const enableDataCatlg = using === 1

    const [searchParams, setSearchParams] = useSearchParams()
    const [active, setActive] = useState<AssetTypeEnum>(AssetTypeEnum.Api)
    const dataId = searchParams.get('id')
    const [operateType, setOperateType] = useState<any>(OperateType.CREATE)
    const [operateItem, setOperateItem] = useState<any>()
    const [searchKey, setSearchKey] = useState('')

    // 排序
    const [selectedSort, setSelectedSort] = useState<any>()

    const ApiMenus = [
        { key: ApiSortType.NAME, label: __('按资源名称排序') },
        { key: ViewSortType.UPDATETIME, label: __('按资源更新时间排序') },
    ]

    const DataViewMenus = [
        { key: ViewSortType.NAME, label: __('按资源业务名称排序') },
        { key: ViewSortType.UPDATEDAT, label: __('按资源更新时间排序') },
    ]

    const IndicatorMenus = [
        { key: ViewSortType.NAME, label: __('按资源名称排序') },
        { key: ViewSortType.UPDATEDAT, label: __('按资源更新时间排序') },
    ]

    const [sortMenus, defSortMenu] = useMemo(() => {
        const menuLabel =
            active === AssetTypeEnum.DataView
                ? DataViewMenus
                : active === AssetTypeEnum.Api
                ? ApiMenus
                : IndicatorMenus
        const defMenu = {
            key: active === AssetTypeEnum.Api ? 'update_time' : 'updated_at',
            sort: SortDirection.DESC,
        }
        setSelectedSort(defMenu)
        searchParams.set('type', active)
        setSearchParams(searchParams)

        return [menuLabel, defMenu]
    }, [active])

    const timeSortObj = {
        [AssetTypeEnum.DataView]: {
            // 1为启用数据资源目录
            1: ViewSortType.PUBLISH,
            2: ViewSortType.ONLINE,
        },
        [AssetTypeEnum.Api]: {
            1: ApiSortType.PUBLISH,
            2: ApiSortType.ONLINE,
        },
    }

    // 资源-时间排序key
    const timeSortKey = useMemo(() => {
        return timeSortObj[active]?.[using]
    }, [using, active])

    const initParams = {
        keyword: '',
        offset: 1,
        limit: 10,
        is_all: true,
        sort: 'update_time',
        direction: SortDirection.DESC,
    }

    const [searchCondition, setSearchCondition] = useState<any>({
        ...initParams,
    })
    const searchDebounce = useDebounce(searchCondition, { wait: 100 })
    const [apiVisible, setApiVisible] = useState<boolean>(false)
    const [dataViewVisible, setDataViewVisible] = useState<boolean>(false)
    const [previewVisible, setPreviewVisible] = useState<boolean>(false)
    const [nodeCondition, setNodeCondition] = useState<any>({})
    const [dataSource, setDataSource] = useState<any[]>()
    // 指标详情状态
    const [indicatorVisible, setIndicatorVisible] = useState<boolean>(false)

    const lwSearchRef = useRef<any>()

    // 表头排序
    const [tableSort, setTableSort] = useState<{
        [key: string]: SortOrder
    }>({
        name: null,
        // created_at: null,
        updated_at: null,
        update_time: null,
        // publish_at: null,
        // online_at: null,
        // publish_time: null,
        // online_time: null,
        [defSortMenu.key]:
            defSortMenu.sort === SortDirection.DESC ? 'descend' : 'ascend',
    })

    useEffect(() => {
        setTableSort({
            name: null,
            created_at: null,
            updated_at: null,
            update_time: null,
            publish_at: null,
            publish_time: null,
            online_at: null,
            online_time: null,
            [defSortMenu.key]:
                defSortMenu.sort === SortDirection.DESC ? 'descend' : 'ascend',
        })
    }, [defSortMenu])

    useEffect(() => {
        setSearchCondition({
            ...searchCondition,
            sort: defSortMenu.key,
            direction: defSortMenu.sort,
            keyword: searchCondition.keyword,
            ...nodeCondition,
        })
        lwSearchRef.current?.reset()
        searchParams.set('type', active)
        setSearchParams(searchParams)
    }, [active])

    useEffect(() => {
        if (currentNode) {
            const { mode, id } = currentNode
            const key =
                mode === SwitchMode.DOMAIN
                    ? 'subject_domain_id'
                    : 'department_id'

            setNodeCondition({
                [key]: id,
                offset: 1,
                // owner_id: ownerId
            })
            setSearchCondition((prev) => {
                const { subject_domain_id, department_id, ...rest } = prev
                return {
                    ...rest,
                    [key]: id,
                    offset: 1,
                    // owner_id: ownerId,
                    ...(currentNode?.mode === SwitchMode.DOMAIN ||
                    (currentNode?.mode === SwitchMode.ARCHITECTURE &&
                        (!currentNode?.id || currentNode?.id === 'uncategory'))
                        ? { is_all: true }
                        : {}),
                }
            })
        }
    }, [currentNode, ownerId])

    useEffect(() => {
        setSearchCondition((prev) => {
            const { subject_domain_id, department_id, ...rest } = prev
            return {
                ...rest,
                ...nodeCondition,
            }
        })
    }, [nodeCondition])

    useEffect(() => {
        if (apiVisible || dataViewVisible || indicatorVisible) {
            searchParams.set('detail', 'true')
            setSearchParams(searchParams)
        } else {
            searchParams.delete('detail')
            setSearchParams(searchParams)
        }
    }, [apiVisible, dataViewVisible, indicatorVisible])

    // 获取列表
    const getListData = async (params) => {
        const { current, keyword, state, publish_status, status, ...rest } =
            params
        let queryParams
        try {
            if (active === AssetTypeEnum.Api) {
                // rest.is_authed = true
                rest.service_keyword = keyword
                rest.publish_and_online_status =
                    'online,down-auditing,down-reject'
                // if (using === 1) {
                //     // rest.publish_status = 'published'
                //     rest.publish_and_online_status =
                //         'published,change-reject,change-auditing'
                // } else {
                //     rest.publish_and_online_status =
                //         'online,down-auditing,down-reject'
                //     // rest.status = 'online'
                // }
                queryParams = rest
            } else if (active === AssetTypeEnum.Indicator) {
                queryParams = {
                    is_authed: true,
                    offset: rest.offset,
                    limit: rest.limit,
                    direction: rest.direction,
                    sort: rest.sort,
                    keyword,
                    indicator_type: rest.indicator_type,
                    is_owner: true,
                    subject_id: rest.subject_domain_id
                        ? rest.subject_domain_id === 'uncategory'
                            ? ''
                            : params.subject_domain_id
                        : undefined,
                    management_department_id: rest.department_id
                        ? rest.department_id === 'uncategory'
                            ? ''
                            : rest.department_id
                        : undefined,
                }
            } else {
                rest.keyword = keyword
                rest.state = state
                if (rest.department_id === 'uncategory') {
                    rest.department_id = '00000000-0000-0000-0000-000000000000'
                } else if (rest.subject_domain_id === 'uncategory') {
                    rest.subject_domain_id =
                        '00000000-0000-0000-0000-000000000000'
                }

                // eslint-disable-next-line no-prototype-builtins
                if (params.hasOwnProperty('department_id')) {
                    rest.include_sub_department = rest.is_all
                    // eslint-disable-next-line no-prototype-builtins
                } else if (params.hasOwnProperty('subject_domain_id')) {
                    rest.include_sub_subject_domain = rest.is_all
                }
                delete rest.is_all
                delete rest.is_authed
                queryParams = rest
            }

            const req =
                active === AssetTypeEnum.DataView
                    ? getDataViewAuthList
                    : active === AssetTypeEnum.Indicator
                    ? getIndictorList
                    : queryServiceOverviewList
            const res = await req({
                ...queryParams,
            })

            return {
                total: res.total_count || res.count,
                list: res.entries || [],
            }
        } catch (error) {
            formatError(error)
            return { total: 0, list: [] }
        } finally {
            setSelectedSort(undefined)
        }
    }

    const { tableProps, run, pagination, loading } = useAntdTable(getListData, {
        defaultPageSize: 10,
        manual: true,
    })
    useUpdateEffect(() => {
        run({
            ...searchDebounce,
            current: searchDebounce.offset,
            pageSize: searchDebounce.limit,
        })
    }, [searchDebounce])

    useEffect(() => {
        if (!dataId) {
            setSearchCondition({
                ...searchCondition,
                offset: 1,
            })
        }
    }, [dataId])

    useUpdateEffect(() => {
        if (searchKey === searchCondition.keyword) return
        setSearchCondition({
            ...searchCondition,
            keyword: searchKey,
            offset: 1,
        })
    }, [searchKey])

    const searchChange = (d, dataKey) => {
        if (!dataKey) {
            // 清空筛选
            setSearchCondition({
                ...searchCondition,
                ...d,
            })
        } else {
            const dk = dataKey

            setSearchCondition({
                ...searchCondition,
                [dk]: d[dk],
            })
        }
    }

    // 筛选顺序变化
    const handleMenuChange = (selectedMenu) => {
        setSearchCondition({
            ...searchCondition,
            offset: 1,
            sort: selectedMenu.key,
            direction: selectedMenu.sort,
        })
        onChangeMenuToTableSort(selectedMenu)
    }

    const onChangeMenuToTableSort = (selectedMenu) => {
        setTableSort({
            name: null,
            created_at: null,
            updated_at: null,
            update_time: null,
            publish_at: null,
            publish_time: null,
            online_at: null,
            online_time: null,
            [selectedMenu.key]:
                selectedMenu.sort === SortDirection.ASC ? 'ascend' : 'descend',
        })
    }

    // 表格排序改变
    const handleTableChange = (sorter) => {
        if (sorter.column) {
            setTableSort({
                // created_at: null,
                updated_at: null,
                update_time: null,
                name: null,
                // publish_at: null,
                // online_at: null,
                // publish_time: null,
                // online_time: null,
                [sorter.columnKey]: sorter.order || 'ascend',
            })
            return {
                key: sorter.columnKey,
                sort:
                    sorter.order === 'ascend'
                        ? SortDirection.ASC
                        : SortDirection.DESC,
            }
        }

        setTableSort({
            // created_at: null,
            updated_at: null,
            update_time: null,
            name: null,
            // publish_at: null,
            // online_at: null,
            // publish_time: null,
            // online_time: null,
            [sorter.columnKey]:
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

    const ApiColumns: any = [
        {
            title: (
                <>
                    <Tooltip title={__('按资源名称排序')}>
                        {__('资源名称')}
                    </Tooltip>
                    <span style={{ color: 'rgba(0,0,0,0.45)' }}>
                        {__('(编码)')}
                    </span>
                </>
            ),
            dataIndex: 'service_name',
            key: 'name',
            sorter: true,
            sortOrder: tableSort.name,
            showSorterTooltip: false,
            render: (value, record) => (
                <div className={styles.assetInfo}>
                    <span>{ResIcon?.[AssetTypeEnum.Api]}</span>
                    <div className={styles.assetName} title={value || '--'}>
                        <span
                            onClick={() => {
                                setApiVisible(true)
                                handleOperate(
                                    OperateType.DETAIL,
                                    record,
                                    AssetTypeEnum.Api,
                                )
                            }}
                        >
                            {value || (
                                <span style={{ color: 'rgba(0,0,0,0.45)' }}>
                                    --
                                </span>
                            )}
                        </span>
                        <div
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
            title: __('所属业务对象'),
            dataIndex: 'subject_domain_name',
            key: 'subject_domain_name',
            ellipsis: true,
            render: (value: string) => (
                <span
                    title={value || '无'}
                    style={{ display: 'flex', alignItems: 'center' }}
                >
                    {value && (
                        <CommonIcon
                            icon={L2Svg}
                            style={{
                                fontSize: '16px',
                                paddingRight: '4px',
                            }}
                        />
                    )}
                    <span
                        style={{
                            width: 'calc(100% - 30px)',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                        }}
                    >
                        {labelText(value)}
                    </span>
                </span>
            ),
        },
        {
            title: __('所属部门'),
            dataIndex: ['department', 'name'],
            key: 'department',
            ellipsis: true,
            render: (value: string) => (
                <span title={value || '无'}>{labelText(value)}</span>
            ),
        },
        {
            title: __('资源更新时间'),
            dataIndex: 'update_time',
            key: 'update_time',
            width: 180,
            ellipsis: true,
            sorter: true,
            sortOrder: tableSort.update_time,
            showSorterTooltip: false,
            render: (value) => {
                return value ? formatTime(value) : '--'
            },
        },
        {
            title: __('操作'),
            key: 'action',
            width: 200,
            fixed: 'right',
            render: (_, record) => {
                return (
                    <Space size={12}>
                        <a
                            onClick={() => {
                                setApiVisible(true)
                                handleOperate(
                                    OperateType.DETAIL,
                                    record,
                                    AssetTypeEnum.Api,
                                )
                            }}
                        >
                            {__('资源详情')}
                        </a>
                        {MenuList.map((item) => (
                            <Button
                                key={item.key}
                                type="link"
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleOperate(
                                        item.key as OperateType,
                                        record,
                                        AssetTypeEnum.Api,
                                    )
                                }}
                            >
                                {item.label}
                            </Button>
                        ))}
                    </Space>
                )
            },
        },
    ]

    // 列表项
    const columns: any = [
        {
            title: (
                <>
                    <Tooltip title={__('按资源业务名称排序')}>
                        {__('资源业务名称')}
                    </Tooltip>
                    <span style={{ color: 'rgba(0,0,0,0.45)' }}>
                        {__('(编码)')}
                    </span>
                </>
            ),
            dataIndex: 'business_name',
            key: 'name',
            sorter: true,
            sortOrder: tableSort.name,
            showSorterTooltip: false,
            render: (value, record) => (
                <div className={styles.assetInfo}>
                    <span>{ResIcon?.[AssetTypeEnum.DataView]}</span>
                    <div
                        className={styles.assetName}
                        title={textLabel(value) as any}
                    >
                        <span
                            onClick={() => {
                                setDataViewVisible(true)
                                handleOperate(
                                    OperateType.DETAIL,
                                    record,
                                    AssetTypeEnum.DataView,
                                )
                            }}
                        >
                            {textLabel(value)}
                        </span>
                        <div
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
            title: __('所属主题'),
            dataIndex: 'subject',
            key: 'subject',
            ellipsis: true,
            render: (value: string, record: any) => {
                const level =
                    (record?.subject_path_id?.split('/')?.length || 0) - 1
                return (
                    <span
                        title={record?.subject_path || '无'}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        {value && (
                            <GlossaryIcon
                                width="16px"
                                type={TypeMap[level]}
                                fontSize="16px"
                                styles={{
                                    marginRight: '4px',
                                    filter: 'grayscale(1)',
                                    color: 'inherit',
                                }}
                            />
                        )}
                        <span
                            style={{
                                width: 'calc(100% - 30px)',
                                textOverflow: 'ellipsis',
                                overflow: 'hidden',
                            }}
                        >
                            {textLabel(value)}
                        </span>
                    </span>
                )
            },
        },
        {
            title: __('所属部门'),
            dataIndex: 'department',
            key: 'department',
            ellipsis: true,
            render: (value: string, record: any) => (
                <span title={record?.department_path || '无'}>
                    {textLabel(value)}
                </span>
            ),
        },

        {
            title: __('资源更新时间'),
            dataIndex: 'updated_at',
            key: 'updated_at',
            width: 180,
            ellipsis: true,
            sorter: true,
            sortOrder: tableSort.updated_at,
            showSorterTooltip: false,
            render: (value) => {
                return isNumber(value) ? formatTime(value) : '--'
            },
        },
        {
            title: __('操作'),
            key: 'action',
            width: 180,
            fixed: 'right',
            render: (_, record) => {
                return (
                    <Space size={12}>
                        <a
                            onClick={() => {
                                setDataViewVisible(true)
                                handleOperate(
                                    OperateType.DETAIL,
                                    record,
                                    AssetTypeEnum.DataView,
                                )
                            }}
                        >
                            {__('资源详情')}
                        </a>
                        {MenuList.map((item) => (
                            <Button
                                key={item.key}
                                type="link"
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleOperate(
                                        item.key as OperateType,
                                        record,
                                        AssetTypeEnum.DataView,
                                    )
                                }}
                            >
                                {item.label}
                            </Button>
                        ))}
                    </Space>
                )
            },
        },
    ]

    const IndicatorColumns: any = [
        {
            title: (
                <>
                    <Tooltip title={__('按资源名称排序')}>
                        {__('资源名称')}
                    </Tooltip>
                    <span style={{ color: 'rgba(0,0,0,0.45)' }}>
                        {__('(编码)')}
                    </span>
                </>
            ),
            dataIndex: 'name',
            key: 'name',
            sorter: true,
            sortOrder: tableSort.name,
            showSorterTooltip: false,
            render: (value, record) => (
                <div className={styles.assetInfo}>
                    <span>
                        <IndicatorIcons
                            type={record.indicator_type}
                            fontSize={20}
                        />
                    </span>
                    <div className={styles.assetName} title={value || '--'}>
                        <span
                            onClick={() => {
                                setIndicatorVisible(true)
                                handleOperate(
                                    OperateType.DETAIL,
                                    record,
                                    AssetTypeEnum.Indicator,
                                )
                            }}
                        >
                            {value || (
                                <span style={{ color: 'rgba(0,0,0,0.45)' }}>
                                    --
                                </span>
                            )}
                        </span>
                        <div
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
            title: __('指标类型'),
            dataIndex: 'indicator_type',
            key: 'indicator_type',
            ellipsis: true,
            render: (value: string) => IndicatorTypes[value],
        },
        {
            title: __('所属主题'),
            dataIndex: 'subject_domain_name',
            key: 'subject_domain_name',
            ellipsis: true,
            render: (value: string, record) => (
                <span
                    title={record.subject_domain_path || '无'}
                    style={{ display: 'flex', alignItems: 'center' }}
                >
                    {value && (
                        <CommonIcon
                            icon={L2Svg}
                            style={{
                                fontSize: '16px',
                                paddingRight: '4px',
                            }}
                        />
                    )}
                    <span
                        style={{
                            width: 'calc(100% - 30px)',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                        }}
                    >
                        {labelText(value)}
                    </span>
                </span>
            ),
        },
        {
            title: __('所属部门'),
            dataIndex: 'management_department_name',
            key: 'management_department_name',
            ellipsis: true,
            render: (value: string, record) => (
                <span title={record.management_department_path || '无'}>
                    {labelText(value)}
                </span>
            ),
        },
        {
            title: __('资源更新时间'),
            dataIndex: 'updated_at',
            key: 'updated_at',
            width: 180,
            ellipsis: true,
            sorter: true,
            sortOrder: tableSort.updated_at,
            showSorterTooltip: false,
            render: (value) => {
                return isNumber(value) ? formatTime(value) : '--'
            },
        },
        {
            title: __('操作'),
            key: 'action',
            width: 200,
            fixed: 'right',
            render: (_, record) => {
                return (
                    <Space size={12}>
                        <a
                            onClick={() => {
                                setIndicatorVisible(true)
                                handleOperate(
                                    OperateType.DETAIL,
                                    record,
                                    AssetTypeEnum.Indicator,
                                )
                            }}
                        >
                            {__('资源详情')}
                        </a>
                        {MenuList.map((item) => (
                            <Button
                                key={item.key}
                                type="link"
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleOperate(
                                        item.key as OperateType,
                                        record,
                                        AssetTypeEnum.Indicator,
                                    )
                                }}
                            >
                                {item.label}
                            </Button>
                        ))}
                    </Space>
                )
            },
        },
    ]

    // 操作处理
    const handleOperate = async (
        op: OperateType,
        item?: any,
        type?: AssetTypeEnum,
    ) => {
        setOperateItem({ ...item, type })
        setOperateType(op)
        switch (op) {
            case OperateType.EDIT:
                const rid =
                    active === AssetTypeEnum.DataView ||
                    active === AssetTypeEnum.Indicator
                        ? item.id
                        : item.service_id

                const str = searchParams.get('detail')
                    ? `&detail=${searchParams.get('detail')}`
                    : ''
                const indicatorType =
                    active === AssetTypeEnum.Indicator
                        ? `&indicatorType=${item.indicator_type}`
                        : ''

                navigator(
                    `/dataService/assetAccess?id=${rid}&type=${type}${str}${indicatorType}`,
                )
                break
            case OperateType.PREVIEW:
                setPreviewVisible(true)
                break
            // case OperateType.DETAIL:
            //     if (type === AssetTypeEnum.DataView) {
            //         navigator(
            //             `/datasheet-view/detail?id=${item.id}&detailsUrl=/dataService/assetAccess?type=data_view`,
            //         )
            //     }
            //     break
            default:
                break
        }
    }

    const formData = useMemo(
        () => searchData(currentNode?.mode === SwitchMode.DOMAIN),
        [currentNode?.mode, active],
    )

    const filterItems: IformItem[] = [
        {
            label: __('指标类型'),
            key: 'indicator_type',
            options: [
                {
                    label: __('不限'),
                    value: '',
                },
                {
                    label: __('原子指标'),
                    value: 'atomic',
                },
                {
                    label: __('衍生指标'),
                    value: 'derived',
                },
                {
                    label: __('复合指标'),
                    value: 'composite',
                },
            ],
            type: SearchType.Radio,
        },
    ]

    const searchIndicatorChange = (searchParam, key) => {
        if (searchParam[key]) {
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

    const SearchRender = (
        <Space size={8}>
            <SearchInput
                placeholder={
                    active === AssetTypeEnum.DataView
                        ? __('搜索资源业务名称、技术名称、编码')
                        : __('搜索资源名称、编码')
                }
                value={searchCondition.keyword}
                onKeyChange={(keyword: string) => setSearchKey(keyword)}
                className={styles.searchInput}
                style={{ width: 282 }}
                maxLength={active === AssetTypeEnum.DataView ? 255 : 128}
            />
            {currentNode?.mode === SwitchMode.ARCHITECTURE &&
                currentNode?.id &&
                currentNode?.id !== 'uncategory' && (
                    <LightweightSearch
                        ref={lwSearchRef}
                        formData={formData}
                        onChange={(d, key) => searchChange(d, key)}
                        defaultValue={{
                            is_all: true,
                            // state: active === AssetTypeEnum.DataView ? 0 : '',
                        }}
                    />
                )}
            {active === AssetTypeEnum.Indicator && (
                <LightweightSearch
                    formData={filterItems}
                    onChange={(data, key) => searchIndicatorChange(data, key)}
                    defaultValue={{ indicator_type: '' }}
                />
            )}

            <SortBtn
                style={{ marginRight: '0' }}
                contentNode={
                    <DropDownFilter
                        menus={sortMenus}
                        defaultMenu={defSortMenu}
                        menuChangeCb={handleMenuChange}
                        changeMenu={selectedSort}
                    />
                }
            />
            <RefreshBtn
                onClick={() =>
                    setSearchCondition({
                        ...searchCondition,
                        offset: 1,
                    })
                }
            />
        </Space>
    )
    // 空库表
    const renderEmpty = () => {
        const noDataView = (
            <Empty
                desc={`${
                    !currentNode?.id
                        ? `"${
                              currentNode?.mode === SwitchMode.DOMAIN
                                  ? __('主题域')
                                  : __('组织架构')
                          }"${__('视角下，')}`
                        : ''
                }${__('暂无可授权的资源')}`}
                iconSrc={empty}
            />
        )
        return searchKey ? <Empty /> : noDataView
    }

    useEffect(() => {
        setDataSource(tableProps.dataSource)
    }, [tableProps.dataSource])

    return (
        <div className={styles['asset-content']}>
            <div className={styles['asset-content-top']}>
                <div className={styles['asset-content-top-icon']}>
                    {AssetIcon[currentNode?.type ?? 'authorizable']}
                </div>
                <div className={styles['asset-content-top-title']}>
                    {getTitleByNode(currentNode)}
                </div>
                {/* {currentNode?.type === DomainType.subject_domain && (
                    <>
                        <Tooltip
                            title={
                                currentNode?.hasAccess
                                    ? __('资源授权管理')
                                    : __(
                                          '您不是当前主题域的数据Owner，不能进行授权，但您可以对下方的资源单独进行授权',
                                      )
                            }
                            placement="top"
                        >
                            <Button
                                className={styles['access-icon']}
                                type="link"
                                disabled={!currentNode?.hasAccess}
                                onClick={() =>
                                    handleOperate(
                                        OperateType.EDIT,
                                        {
                                            id: currentNode?.id,
                                            service_id: currentNode?.id,
                                        },
                                        AssetTypeEnum.Domain,
                                    )
                                }
                            >
                                <ShareOutlined />
                            </Button>
                        </Tooltip>
                        <Tooltip
                            title={
                                currentNode?.hasAccess
                                    ? __('查看权限信息')
                                    : __(
                                          '您不是当前主题域的数据Owner，不能查看其授权信息',
                                      )
                            }
                            placement="top"
                        >
                            <Button
                                className={styles['access-icon']}
                                type="link"
                                disabled={!currentNode?.hasAccess}
                                onClick={(e) => {
                                    handleOperate(
                                        OperateType.PREVIEW,
                                        {
                                            id: currentNode?.id,
                                            service_id: currentNode?.id,
                                        },
                                        AssetTypeEnum.Domain,
                                    )
                                    e.stopPropagation()
                                }}
                            >
                                <InfotipOutlined />
                            </Button>
                        </Tooltip>
                    </>
                )} */}
            </div>
            <div className={styles['asset-content-swicher']}>
                <Tabs
                    defaultActiveKey={active}
                    onChange={(key) => {
                        setDataSource(undefined)
                        setActive(key as AssetTypeEnum)
                    }}
                    onClickCapture={() => {
                        if (previewVisible) {
                            setOperateItem(undefined)
                            setOperateType(undefined)
                            setPreviewVisible(false)
                        }
                    }}
                    tabBarExtraContent={SearchRender}
                    // items={ApiOptions.filter(
                    //     (item) => item.key !== AssetTypeEnum.Api || local_app,
                    // )}
                    items={ApiOptions.filter(
                        (item) => item.key === AssetTypeEnum.Api,
                    )}
                />
            </div>
            {loading || dataSource === undefined ? (
                <div style={{ marginTop: '56px' }}>
                    <Loader />
                </div>
            ) : dataSource?.length ||
              !!searchKey ||
              (!dataSource?.length && tableProps.pagination.current !== 1) ? (
                <Table
                    columns={
                        active === AssetTypeEnum.DataView
                            ? columns
                            : active === AssetTypeEnum.Indicator
                            ? IndicatorColumns
                            : ApiColumns
                    }
                    {...tableProps}
                    dataSource={dataSource}
                    rowKey="id"
                    scroll={{
                        x: 1000,
                        y:
                            dataSource?.length === 0
                                ? undefined
                                : `calc(100vh - 292px)`,
                    }}
                    pagination={{
                        ...tableProps.pagination,
                        hideOnSinglePage: tableProps.pagination.total <= 10,
                        pageSizeOptions: [10, 20, 50, 100],
                        showQuickJumper: true,
                        responsive: true,
                        showLessItems: true,
                        showSizeChanger: true,
                        showTotal: (count) => {
                            return `共 ${count} 条记录 第 ${
                                searchCondition.offset
                            }/${Math.ceil(count / searchCondition.limit)} 页`
                        },
                    }}
                    bordered={false}
                    locale={{
                        emptyText: <Empty />,
                    }}
                    onChange={(newPagination, filters, sorter) => {
                        const selectedMenu = handleTableChange(sorter)
                        setSelectedSort(selectedMenu)
                        setSearchCondition((prev) => ({
                            ...prev,
                            sort: selectedMenu.key,
                            direction: selectedMenu.sort,
                            offset: newPagination.current,
                            limit: newPagination.pageSize,
                        }))
                    }}
                />
            ) : (
                <div className={styles.emptyWrapper}>{renderEmpty()}</div>
            )}

            {apiVisible && (
                <ApplicationServiceDetail
                    open={apiVisible}
                    onClose={() => {
                        setApiVisible(false)
                    }}
                    isFromAuth
                    showShadow={false}
                    serviceCode={operateItem?.service_id}
                    isNeedComExistBtns={false}
                    extraBtns={
                        <Space size={8}>
                            {MenuList.map((item) => (
                                <Button
                                    key={item.key}
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        handleOperate(
                                            item.key as OperateType,
                                            operateItem,
                                            AssetTypeEnum.Api,
                                        )
                                    }}
                                    icon={item.icon}
                                >
                                    {item.label}
                                </Button>
                            ))}
                            {/* {chatBtn(AssetTypeEnum.Api)} */}
                        </Space>
                    }
                />
            )}
            {dataViewVisible && (
                <LogicViewDetail
                    open={dataViewVisible}
                    onClose={() => {
                        setDataViewVisible(false)
                    }}
                    isFromAuth
                    showShadow={false}
                    id={operateItem?.id}
                    isNeedComExistBtns={false}
                    extraBtns={
                        <Space size={8}>
                            {MenuList.map((item) => (
                                <Button
                                    key={item.key}
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        handleOperate(
                                            item.key as OperateType,
                                            operateItem,
                                            AssetTypeEnum.DataView,
                                        )
                                    }}
                                    icon={item.icon}
                                >
                                    {item.label}
                                </Button>
                            ))}
                        </Space>
                    }
                />
            )}

            {indicatorVisible && (
                <IndicatorViewDetail
                    open={indicatorVisible}
                    // isIntroduced={isIntroduced}
                    id={operateItem?.id}
                    onClose={() => {
                        setIndicatorVisible(false)
                    }}
                    indicatorType={operateItem?.indicator_type || ''}
                    isNeedComExistBtns={false}
                    extraBtns={
                        <Space size={8}>
                            {MenuList.map((item) => (
                                <Button
                                    key={item.key}
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        handleOperate(
                                            item.key as OperateType,
                                            operateItem,
                                            AssetTypeEnum.Indicator,
                                        )
                                    }}
                                    icon={item.icon}
                                >
                                    {item.label}
                                </Button>
                            ))}
                        </Space>
                    }
                />
            )}
        </div>
    )
}

export default memo(AssetContent)
