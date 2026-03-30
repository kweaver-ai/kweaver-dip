import { Button, Space, Tabs, Tooltip } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'

import { SortOrder } from 'antd/lib/table/interface'
import { isArray, isNumber, toNumber } from 'lodash'
import moment from 'moment'
import classnames from 'classnames'
import {
    auditStatusList,
    auditTypeList,
    InfoCatlgAuditTabType,
    searchData,
    tabItems,
    getState,
} from './helper'
import styles from './styles.module.less'
import __ from './locale'
import { LightweightSearch, SearchInput } from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'
import { formatError } from '@/core/errors'
import CommonTable from '@/components/CommonTable'
import { RefreshBtn } from '@/components/ToolbarComponents'
import {
    SortDirection,
    queryInfoCatlgList,
    AuditStatus,
    AuditType,
    HasAccess,
} from '@/core'
import { PublishStatus } from '../const'
import { FixedType } from '@/components/CommonTable/const'
import { OperateType } from '@/utils'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import InfoCatlgAudit from './InfoCatlgAudit'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

const initSearchCondition: any = {
    offset: 1,
    limit: 10,
    keyword: '',
    // filter: { audit_type: [] },
    // 暂不支持排序
    // sort_by: {
    //     fields: ['audit_at'],
    //     direction: SortDirection.DESC,
    // },
}

const InfoRescCatlgAudit = () => {
    const navigator = useNavigate()

    const { checkPermissions } = useUserPermCtx()

    const [loading, setLoading] = useState(true)
    const [searchCondition, setSearchCondition] = useState<any>({
        ...initSearchCondition,
    })
    const [isEmpty, setIsEmpty] = useState<boolean>(false)
    const [activeKey, setActiveKey] = useState<InfoCatlgAuditTabType>(
        InfoCatlgAuditTabType.ToAudit,
    )
    // const [data, setData] = useState<any[]>([])
    const [tabItemsData, setTabItemsData] = useState<any[]>(tabItems)

    const commonTableRef: any = useRef()
    const [tableSort, setTableSort] = useState<{
        [key: string]: SortOrder
    }>({
        audit_at: 'descend',
    })

    // 点击操作的目录项
    const [curOprCatlg, setCurOprCatlg] = useState<any>()
    const [auditOpen, setAuditOpen] = useState(false)

    // 是否拥有数据运营工程师
    const hasDataOperRole = useMemo(() => {
        return checkPermissions(HasAccess.isGovernOrOperation) ?? false
    }, [checkPermissions])

    const handleOperate = async (op: OperateType, item: any) => {
        setCurOprCatlg(item)
        if (op === OperateType.DETAIL) {
            const url = `/dataService/infoCatlgDetails?catlgId=${item.id}&name=${item.name}&backUrl=/dataService/infoCatlgAudit`
            navigator(url)
        } else if (op === OperateType.AUDIT) {
            setAuditOpen(true)
        }
    }

    const handleClickDataCatlgDetail = (item: any) => {
        const { id, name } = item
        const url = `/dataService/dirContent?catlgId=${id}&name=${name}&backUrl=/dataService/infoCatlgAudit`

        navigator(url)
    }

    const columns: any = [
        {
            title: (
                <div>
                    <span>{__('信息资源目录名称')}</span>
                    <span style={{ color: 'rgba(0,0,0,0.45)' }}>
                        {__('（编码）')}
                    </span>
                </div>
            ),
            dataIndex: 'name',
            key: 'name',
            // 暂不支持排序
            // sorter: true,
            // sortOrder: tableSort.name,
            // showSorterTooltip: {
            //     title: __('按目录名称排序'),
            //     placement: 'bottom',
            //     overlayInnerStyle: {
            //         color: '#fff',
            //     },
            // },
            width: 220,
            render: (text, record) => (
                <div className={styles.catlgName}>
                    <FontIcon
                        name="icon-xinximulu1"
                        type={IconType.COLOREDICON}
                        className={styles.nameIcon}
                    />
                    <div className={styles.catlgNameCont}>
                        <div
                            onClick={() =>
                                handleOperate(OperateType.DETAIL, record)
                            }
                            title={text}
                            className={styles.names}
                        >
                            {text || '--'}
                        </div>
                        <div className={styles.code} title={record.code}>
                            {record.code}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: __('关联数据资源目录'),
            dataIndex: 'related_data_resource_catalogs',
            key: 'related_data_resource_catalogs',
            ellipsis: true,
            render: (list, record) => {
                if (!list || !list?.length) return '--'
                const moreCount = toNumber((list?.length || 1) - 1)
                return (
                    <div className={styles.relateRescWrapper}>
                        <span
                            className={classnames(
                                styles.firstRelCatlgName,
                                styles.link,
                            )}
                            onClick={() => handleClickDataCatlgDetail(list[0])}
                        >
                            {list[0].name || '--'}
                        </span>
                        {moreCount > 0 && (
                            <Tooltip
                                color="#fff"
                                overlayInnerStyle={{
                                    color: 'rgba(0,0,0,0.85)',
                                }}
                                overlayClassName={styles.rescTooltipWrapper}
                                title={list.slice(1)?.map((item, index) => {
                                    return (
                                        <>
                                            {index > 0 ? '、' : ''}
                                            <span
                                                className={styles.link}
                                                onClick={() =>
                                                    handleClickDataCatlgDetail(
                                                        item,
                                                    )
                                                }
                                            >
                                                {item?.name || '--'}
                                            </span>
                                        </>
                                    )
                                })}
                                getPopupContainer={(n) =>
                                    n.parentElement?.parentElement
                                        ?.parentElement || n
                                }
                            >
                                <span
                                    className={styles.link}
                                    style={{
                                        color: '#126EE3',
                                        flexShrink: '0',
                                    }}
                                >{`（${moreCount}）`}</span>
                            </Tooltip>
                        )}
                    </div>
                )
            },
        },
        {
            title: __('所属组织架构'),
            dataIndex: 'department',
            key: 'department',
            ellipsis: true,
            render: (text, record) => {
                return <div title={record?.department_path}>{text || '--'}</div>
            },
        },
        {
            title: __('审核类型'),
            dataIndex: 'audit_type',
            key: 'audit_type',
            ellipsis: true,
            render: (text, record) =>
                auditTypeList?.find((item) => item.value === text)?.label ||
                '--',
        },
        {
            title: __('申请人'),
            dataIndex: 'apply_user_name',
            key: 'apply_user_name',
            ellipsis: true,
            render: (text, record) => text || '--',
        },
        // {
        //     title: __('我的审核结果'),
        //     dataIndex: 'audit_status',
        //     key: 'audit_status',
        //     ellipsis: true,
        //     render: (text, record) => {
        //         const showMsg =
        //             record?.audit_advice &&
        //             record?.publish_status ===
        //                 publishStatus.PublishedAuditReject
        //         // const title = `${__('审核未通过理由')}：${record?.audit_advice}`
        //         return (
        //             <div style={{ display: 'flex', alignItems: 'center' }}>
        //                 {getState(text, auditStatusList)}
        //                 {/* {showMsg && (
        //                     <Tooltip title={title} placement="bottom">
        //                         <FontIcon
        //                             name="icon-shenheyijian"
        //                             type={IconType.COLOREDICON}
        //                             className={styles.icon}
        //                             style={{ fontSize: 16, marginLeft: 4 }}
        //                         />
        //                     </Tooltip>
        //                 )} */}
        //             </div>
        //         )
        //     },
        // },

        {
            title: __('创建时间'),
            dataIndex: 'audit_at',
            key: 'audit_at',
            ellipsis: true,
            width: 180,
            // 暂不支持排序
            // sorter: true,
            // sortOrder: tableSort.audit_at,
            // showSorterTooltip: {
            //     title: __('按创建时间排序'),
            //     placement: 'bottom',
            //     overlayInnerStyle: {
            //         color: '#fff',
            //     },
            // },
            render: (text: any) => {
                return isNumber(text)
                    ? moment(text).format('YYYY-MM-DD HH:mm:ss')
                    : '--'
            },
        },
        {
            title: __('操作'),
            key: 'action',
            width: 128,
            fixed: FixedType.RIGHT,
            render: (_: string, record) => {
                const btnList: any[] = [
                    {
                        key: OperateType.DETAIL,
                        label: __('详情'),
                    },
                    {
                        key: OperateType.AUDIT,
                        label: __('审核'),
                    },
                ]
                return (
                    <Space size={16} className={styles.oprColumn}>
                        {btnList.map((item) => {
                            return (
                                <Button
                                    type="link"
                                    key={item.key}
                                    disabled={item.disabled}
                                    onClick={(e) => {
                                        e.stopPropagation()

                                        handleOperate(item.key, record)
                                    }}
                                >
                                    {item.label}
                                </Button>
                            )
                        })}
                    </Space>
                )
            },
        },
    ]

    const handleTabChange = (key) => {
        setActiveKey(key)
    }

    // 查询
    const search = () => {
        commonTableRef?.current?.getData()
    }

    const searchChange = (d, dataKey) => {
        if (!dataKey) {
            // 清空筛选
            setSearchCondition({
                ...searchCondition,
                filter: {
                    ...d,
                },
            })
        } else {
            const dk = dataKey

            setSearchCondition({
                ...searchCondition,
                filter: {
                    ...(searchCondition?.filter || {}),
                    [dk]: d[dk],
                },
            })
        }
    }

    // 表格排序改变
    const handleTableChange = (sorter) => {
        const sorterKey = sorter.columnKey

        if (sorter.column) {
            setTableSort({
                key: sorterKey,
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
            key: sorterKey,
            [sorterKey]:
                searchCondition.direction === SortDirection.ASC
                    ? 'descend'
                    : 'ascend',
        })

        return {
            key: sorterKey,
            sort:
                searchCondition.direction === SortDirection.ASC
                    ? SortDirection.DESC
                    : SortDirection.ASC,
        }
    }

    // 初始化搜索-无搜索条件
    const initSearch = useMemo(() => {
        return (
            !searchCondition?.keyword &&
            searchCondition?.offset === 1 &&
            !searchCondition?.filter?.audit_type
        )
    }, [searchCondition])

    return (
        <div className={styles.infoCatlgAuditWrapper}>
            <div className={styles.top}>
                <span className={styles.auditTitle}>
                    {__('信息资源目录审核')}
                </span>
                {isEmpty && initSearch ? undefined : (
                    <Space>
                        <SearchInput
                            placeholder={__('搜索信息资源目录名称、编码')}
                            onKeyChange={(value: string) => {
                                setSearchCondition({
                                    ...searchCondition,
                                    keyword: value,
                                })
                            }}
                            style={{ width: 272 }}
                        />
                        <div>
                            <LightweightSearch
                                formData={searchData}
                                onChange={(data, key) =>
                                    searchChange(data, key)
                                }
                                defaultValue={{ audit_type: '' }}
                                width="124px"
                            />
                        </div>
                        <span>
                            <RefreshBtn
                                onClick={() =>
                                    setSearchCondition({
                                        ...searchCondition,
                                        offset: 1,
                                    })
                                }
                            />
                        </span>
                    </Space>
                )}
            </div>

            <div className={styles.infoCatlgAuditContent}>
                <CommonTable
                    queryAction={queryInfoCatlgList}
                    params={searchCondition}
                    baseProps={{
                        columns,
                        scroll: {
                            x: 1300,
                        },
                        rowClassName: styles.tableRow,
                    }}
                    ref={commonTableRef}
                    emptyDesc={<div>{__('暂无数据')}</div>}
                    emptyIcon={dataEmpty}
                    emptyStyle={{
                        display: 'flex',
                        height: 'calc(100% - 200px)',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    useDefaultPageChange
                    getEmptyFlag={(flag) => {
                        setIsEmpty(flag)
                    }}
                />
            </div>

            {auditOpen && curOprCatlg && (
                <InfoCatlgAudit
                    open={auditOpen}
                    onOK={() => {
                        commonTableRef?.current?.getData()
                        setAuditOpen(false)
                        setCurOprCatlg(undefined)
                    }}
                    onClose={() => {
                        setAuditOpen(false)
                        setCurOprCatlg(undefined)
                    }}
                    catlgInfo={curOprCatlg}
                />
            )}
        </div>
    )
}

export default InfoRescCatlgAudit
