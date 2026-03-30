/* eslint-disable no-bitwise */
import { Button, Space, Table, Tabs, Tooltip, message } from 'antd'
import { Key, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { ExclamationCircleFilled } from '@ant-design/icons'
import { useAntdTable, useDebounce, useUpdateEffect } from 'ahooks'
import { SortOrder } from 'antd/lib/table/interface'
import classnames from 'classnames'
import { isNumber, toNumber } from 'lodash'
import moment from 'moment'
import dataEmpty from '@/assets/dataEmpty.svg'
import { FixedType } from '@/components/CommonTable/const'
import SearchLayout from '@/components/SearchLayout'
import { RefreshBtn } from '@/components/ToolbarComponents'
import {
    PermissionScope,
    SortDirection,
    cancelInfoResCatlgChangeAudit,
    delInfoCatlg,
    exportInfoRescCatlg,
    formatError,
    getCurUserDepartment,
    getInfoCatlgStatistics,
    getInfoRescCatlgList,
    updInfoCatlgStatus,
} from '@/core'
import { IRescItem } from '@/core/apis/dataCatalog/index.d'
import { AddOutlined, FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import { LightweightSearch, Loader, SearchInput } from '@/ui'
import Empty from '@/ui/Empty'
import { OperateType, streamToFile, useQuery } from '@/utils'
import { confirm } from '@/utils/modalHelper'
import Confirm from '../Confirm'
import DragBox from '../DragBox'
import {
    Architecture,
    CatlgTreeNode,
    ISearchCondition,
    InfoResourcesType,
    OnlineStatus,
    OnlineStatusList,
    PublishStatus,
    PublishStatusList,
    allNodeInfo,
    editedDefaultMenu,
    initSearchCondition,
    statusPrevOrNxtStatus,
    tabItems,
} from './const'
import {
    filterSearch,
    getPubOrOnlineStatusLabel,
    getState,
    searchFormInitData,
    timeStrToTimestamp,
    unPubStatusList,
} from './helper'
import __ from './locale'
import styles from './styles.module.less'
import TagList from './TagList'

import { useUserPermCtx } from '@/context/UserPermissionProvider'
import ResourcesCustomTree from '../ResourcesDir/ResourcesCustomTree'

interface IInfoRescCatlg {}

const InfoRescCatlg = (props: IInfoRescCatlg) => {
    const navigator = useNavigate()
    const query = useQuery()
    const tabKey = query.get('tabKey') || InfoResourcesType.All
    const [defaultSize, setDefaultSize] = useState<Array<number>>([12, 88])

    const [loading, setLoading] = useState<boolean>(true)
    const [selectedNode, setSelectedNode] = useState<CatlgTreeNode>({
        name: __('全部'),
        id: '',
        path: '',
        type: Architecture.ALL,
    })
    const [activeKey, setActiveKey] = useState<InfoResourcesType>(
        InfoResourcesType.All,
    )
    const [tabItemsData, setTabItemsData] = useState<any[]>(tabItems)

    // 删除弹框显示,【true】显示,【false】隐藏
    const [delVisible, setDelVisible] = useState(false)
    // 上线弹框显示
    const [onlineVisible, setOnlineVisible] = useState(false)
    // 删除目录loading
    const [delBtnLoading, setDelBtnLoading] = useState(false)
    // 导出loading
    const [exportLoading, setExportLoading] = useState(false)
    // 创建表头排序
    const [tableSort, setTableSort] = useState<{
        [key: string]: SortOrder
    }>({
        name: null,
        update_at: 'descend',
    })

    // 排序
    const [selectedSort, setSelectedSort] = useState<any>(editedDefaultMenu)
    const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])

    const onSelectChange = (newSelectedRowKeys: Key[]) => {
        setSelectedRowKeys(newSelectedRowKeys)
    }

    const rowSelection = {
        selectedRowKeys,
        onChange: onSelectChange,
    }

    const [searchCondition, setSearchCondition] = useState<ISearchCondition>({
        ...initSearchCondition,
        filter: {
            ...initSearchCondition?.filter,
            publish_status:
                activeKey === InfoResourcesType.All
                    ? [
                          PublishStatus.Published,
                          PublishStatus.ChangeAuditing,
                          PublishStatus.ChangeReject,
                      ]
                    : [],
            online_status:
                activeKey === InfoResourcesType.All
                    ? [
                          OnlineStatus.Online,
                          OnlineStatus.OfflineAuditing,
                          OnlineStatus.OfflineReject,
                      ]
                    : [],
        },
        // org_code: selectedNode.id,
    })
    const searchDebounce = useDebounce(searchCondition, { wait: 500 })

    // 修改表头排序
    const [updateSortOrder, setUpdateSortOrder] = useState<SortOrder>('ascend')

    // 搜索条件
    const [searchFormData, setSearchFormData] = useState(searchFormInitData)
    const [searchIsExpansion, setSearchIsExpansion] = useState<boolean>(false)

    const searchFormRef: any = useRef()
    const [currentOpsType, setCurrentOpsType] = useState<OperateType>(
        OperateType.PUBLISH,
    )
    const [tableHeight, setTableHeight] = useState<number>(0)
    // const [initSearch, setInitSearch] = useState<boolean>(true)
    const [curDepartment, setCurDepartment] = useState<any>()

    const { checkPermission } = useUserPermCtx()

    // 是否拥有全部管理资源目录的权限
    const hasDataOperRole = useMemo(() => {
        return (
            checkPermission([
                {
                    key: 'manageResourceCatalog',
                    scope: PermissionScope.All,
                },
            ]) ?? false
        )
    }, [checkPermission])
    useEffect(() => {
        setTabItemsData(
            hasDataOperRole
                ? tabItems
                : tabItems.filter((o) => o.key !== InfoResourcesType.All),
        )
        let curKey: any = hasDataOperRole
            ? InfoResourcesType.All
            : InfoResourcesType.Depart

        if (tabKey && tabKey !== 'undefined') {
            curKey = hasDataOperRole ? tabKey : InfoResourcesType.Depart
        }
        setActiveKey(curKey)
        switchActiveSearch(curKey)
    }, [hasDataOperRole, tabKey])

    const switchActiveSearch = (key: InfoResourcesType) => {
        setSearchCondition({
            ...initSearchCondition,
            filter: {
                ...initSearchCondition?.filter,
                publish_status:
                    key === InfoResourcesType.All
                        ? [
                              PublishStatus.Published,
                              PublishStatus.ChangeAuditing,
                              PublishStatus.ChangeReject,
                          ]
                        : [],
                online_status:
                    key === InfoResourcesType.All
                        ? [
                              OnlineStatus.Online,
                              OnlineStatus.OfflineAuditing,
                              OnlineStatus.OfflineReject,
                          ]
                        : [],
            },
        })
    }

    useEffect(() => {
        setLoading(true)
        switchActiveSearch(activeKey)
        setSelectedNode(allNodeInfo)
    }, [activeKey])

    const hasSearchCondition = useMemo(() => {
        return activeKey === InfoResourcesType.All
            ? searchCondition.keyword ||
                  searchCondition?.filter?.update_at?.start ||
                  searchCondition?.filter?.update_at?.end
            : searchCondition.keyword ||
                  searchCondition?.filter?.publish_status ||
                  searchCondition?.filter?.online_status ||
                  searchCondition?.filter?.update_at?.start ||
                  searchCondition?.filter?.update_at?.end
    }, [searchCondition, activeKey])

    useEffect(() => {
        getCurDepartment()
    }, [])
    // 获取当前部门
    const getCurDepartment = async () => {
        try {
            const res = await getCurUserDepartment()
            // 当前树能根据id匹配到部门，根据id显示部门，不能匹配到，显示部门名称
            if (res?.length === 1) {
                const [dept] = res
                setCurDepartment(dept)
            }
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        if (curDepartment) {
            getInfoResourcesSum()
        }
    }, [curDepartment])

    const getInfoResourcesSum = async () => {
        try {
            const res = await getInfoCatlgStatistics(curDepartment?.id)
            const obj = {
                [InfoResourcesType.All]: res?.all_catalog_num || 0,
                [InfoResourcesType.Depart]: res?.org_related_catalog_num || 0,
            }
            setTabItemsData(
                tabItemsData.map((item) => {
                    return {
                        ...item,
                        label: `${item.title} ${obj[item.key]}`,
                    }
                }),
            )
        } catch (err) {
            formatError(err)
        }
    }

    useEffect(() => {
        // if (!initSearch) {

        setSearchCondition((prev) => ({
            ...prev,
            offset: initSearchCondition.offset,
            cate_info:
                selectedNode?.cate_id && selectedNode?.id
                    ? {
                          cate_id: selectedNode?.cate_id,
                          node_id: selectedNode?.id,
                      }
                    : undefined,
            user_department:
                activeKey === InfoResourcesType.Depart ? true : undefined,
        }))

        // }
    }, [selectedNode, activeKey])

    useEffect(() => {
        // 展开/收起查询条件高度
        const defalutHeight: number = !searchIsExpansion ? 276 : 384
        // 已选搜索条件高度
        const searchConditionHeight: number = hasSearchCondition ? 41 : 0
        const height = defalutHeight + searchConditionHeight

        setTableHeight(height)
    }, [hasSearchCondition, searchIsExpansion])

    // 获取选中的节点
    const getSelectedNode = (sn?: any) => {
        // if: 在树结构中操作后获取选中项 else: 在列表中操作后 选中项不变，但要更新列表及详情
        let node
        if (sn) {
            node = { ...sn }
        } else {
            node = allNodeInfo
        }
        setSelectedNode(sn || allNodeInfo)
    }

    // 获取目录列表
    const getCatlgList = async (params) => {
        try {
            setLoading(true)
            const res = await getInfoRescCatlgList(params)
            return {
                total: res.total_count,
                list: res.entries,
            }
        } catch (error) {
            formatError(error)
            return { total: 0, list: [] }
        } finally {
            setLoading(false)
            setSelectedSort(undefined)
            // setInitSearch(false)
        }
    }

    const { tableProps, run, pagination } = useAntdTable(getCatlgList, {
        defaultPageSize: 10,
        manual: true,
    })

    useUpdateEffect(() => {
        run(searchDebounce)
    }, [searchDebounce])

    // 点击目录项
    const [curCatlg, setCurCatlg] = useState<IRescItem>()

    const changeStatusConfirm = async (
        op: OperateType,
        item: IRescItem,
        opLabel: string,
    ) => {
        const value = statusPrevOrNxtStatus[op]

        confirm({
            title: __('确认${text}信息资源目录吗？', {
                text: opLabel,
            }),
            content:
                op === OperateType.ONLINE
                    ? __('提交审核通过后，将上线到服务超市。')
                    : op === OperateType.OFFLINE
                    ? __('提交审核通过后，目录将从服务超市下线。')
                    : '',
            okText: __('确定'),
            cancelText: __('取消'),
            icon: <ExclamationCircleFilled style={{ color: '#faac14' }} />,
            onOk: async () => {
                try {
                    if (op === OperateType.CANCEL) {
                        // 变更撤销
                        await cancelInfoResCatlgChangeAudit(item.id)
                    } else {
                        await updInfoCatlgStatus(item.id, value)
                    }
                    setSearchCondition({
                        ...searchCondition,
                    })
                } catch (err) {
                    formatError(err) // 删除失败，格式化错误信息
                }
            },
            onCancel: () => {},
        })
    }

    const handleOperate = async (
        op: OperateType,
        item: IRescItem,
        opLabel?: string,
    ) => {
        setCurrentOpsType(op)
        setCurCatlg(item)
        if (op === OperateType.DETAIL) {
            const url = `/dataService/infoCatlgDetails?catlgId=${item.id}&treeNodeId=${selectedNode.id}&name=${item.name}`
            navigator(url)
        } else if (op === OperateType.DELETE) {
            setDelVisible(true)
        } else if (op === OperateType.EDIT) {
            const url = `/dataService/editInfoCatlg?id=${item.id}&opt=${op}`
            navigator(url)
        } else if (op === OperateType.CHANGE) {
            const url = `/dataService/editInfoCatlg?id=${
                item.id
            }&opt=${op}&nextId=${item?.next_id || ''}`
            navigator(url)
        } else if (
            [
                OperateType.ONLINE,
                OperateType.OFFLINE,
                OperateType.REVOCATION,
                OperateType.CANCEL,
            ].includes(op)
        ) {
            changeStatusConfirm(op, item, opLabel || '')
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
                searchCondition.sort_by?.direction === SortDirection.ASC
                    ? 'descend'
                    : 'ascend',
        })

        return {
            key: sorterKey,
            sort:
                searchCondition.sort_by?.direction === SortDirection.ASC
                    ? SortDirection.DESC
                    : SortDirection.ASC,
        }
    }

    const handleClickDataCatlgDetail = (item: any) => {
        const { id, name } = item
        const url = `/dataService/dirContent?catlgId=${id}&name=${name}&backUrl=/dataService/infoRescCatlg`

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
            sorter: true,
            sortOrder: tableSort.name,
            showSorterTooltip: {
                title: __('按目录名称排序'),
                placement: 'bottom',
                overlayInnerStyle: {
                    color: '#fff',
                },
            },
            width: 240,
            render: (text, record) => (
                <div className={styles.catlgName}>
                    <FontIcon
                        name="icon-xinximulu1"
                        type={IconType.COLOREDICON}
                        className={styles.nameIcon}
                    />
                    <div className={styles.catlgNameCont}>
                        <div className={styles.nameWrapper}>
                            <div
                                onClick={() =>
                                    handleOperate(OperateType.DETAIL, record)
                                }
                                title={text}
                                className={styles.names}
                            >
                                {text || '--'}
                            </div>
                            {activeKey === InfoResourcesType.All
                                ? ''
                                : getPubOrOnlineStatusLabel(record)}
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
            width: 180,
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
                            title={list[0].name}
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
                                // getPopupContainer={(n) =>
                                //     n.parentElement?.parentElement
                                //         ?.parentElement || n
                                // }
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
            title: __('所属部门'),
            dataIndex: 'department',
            key: 'department',
            ellipsis: true,
            width: 160,
            render: (text, record) => {
                return (
                    <div
                        title={record?.department_path}
                        className={styles.department}
                    >
                        {text || '--'}
                    </div>
                )
            },
        },
        {
            title: __('发布状态'),
            dataIndex: 'status',
            key: 'publish',
            ellipsis: true,
            width: 100,
            render: (status, record) => {
                const { publish } = status

                const isPubStatus = unPubStatusList.includes(publish)
                    ? PublishStatus.Unpublished
                    : PublishStatus.Published

                return (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {getState(isPubStatus, PublishStatusList)}
                    </div>
                )
            },
        },
        {
            title: __('上线状态'),
            dataIndex: 'status',
            key: 'online',
            ellipsis: true,
            width: 100,
            render: (status, record) => {
                const { online } = status
                const unOnlineStatusList = [
                    OnlineStatus.UnOnline,
                    OnlineStatus.OnlineAuditing,
                    OnlineStatus.OnlineAuditingReject,
                ]
                const onlineStatusList = [
                    OnlineStatus.Online,
                    OnlineStatus.OfflineAuditing,
                    OnlineStatus.OfflineReject,
                ]
                const isOnlineStatus = unOnlineStatusList.includes(online)
                    ? OnlineStatus.UnOnline
                    : onlineStatusList.includes(online)
                    ? OnlineStatus?.Online
                    : OnlineStatus.Offline
                return (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {getState(isOnlineStatus, OnlineStatusList)}
                    </div>
                )
            },
        },
        {
            title: __('资源标签'),
            dataIndex: 'infos',
            key: 'infos',
            width: 240,
            ellipsis: true,
            render: (list, record) => <TagList tags={record.label_list_resp} />,
        },
        {
            title: __('更新时间'),
            dataIndex: 'update_at',
            key: 'update_at',
            ellipsis: true,
            width: 180,
            sorter: true,
            sortOrder: tableSort.update_at,
            showSorterTooltip: {
                title: __('按更新时间排序'),
                placement: 'bottom',
                overlayInnerStyle: {
                    color: '#fff',
                },
            },
            render: (text: any) => {
                return isNumber(text)
                    ? moment(text).format('YYYY-MM-DD HH:mm:ss')
                    : '--'
            },
        },
        {
            title: __('操作'),
            key: 'action',
            width: activeKey === InfoResourcesType.All ? 90 : 210,
            fixed: FixedType.RIGHT,
            render: (_: string, record) => {
                const { publish, online } = record?.status || {}

                // 可以上线状态
                const canOnline = [
                    OnlineStatus.UnOnline,
                    OnlineStatus.OnlineAuditingReject,
                    OnlineStatus.Offline,
                    OnlineStatus.OfflineUpAuditingReject,
                ]
                // 可以下线状态
                const canOffline = [
                    OnlineStatus.Online,
                    OnlineStatus.OfflineReject,
                ]

                // 未发布
                const upPublish = [
                    PublishStatus.Unpublished,
                    PublishStatus.PublishedAuditReject,
                ]
                // 上线状态非审核
                const onlineUnAuditing = [
                    OnlineStatus.OnlineAuditing,
                    OnlineStatus.OfflineAuditing,
                    OnlineStatus.OfflineUpAuditing,
                ]

                const onlineAuditing = [
                    OnlineStatus.OnlineAuditing,
                    OnlineStatus.OfflineUpAuditing,
                ]

                const pubUnAuditing = [
                    PublishStatus.Published,
                    PublishStatus.ChangeReject,
                ]
                // 草稿状态
                const isDraft =
                    publish === PublishStatus.Published && !!record?.next_id
                // 显示编辑
                const isAllowEdit = upPublish.includes(publish)
                // 显示删除
                const isAllowDelete = isAllowEdit
                // 显示上线
                const isAllowOnline =
                    pubUnAuditing.includes(publish) &&
                    canOnline.includes(online)

                // 显示下线
                const isAllowOffline =
                    pubUnAuditing.includes(publish) &&
                    canOffline.includes(online)

                // 显示变更
                const isAllowChange =
                    pubUnAuditing.includes(publish) &&
                    !onlineUnAuditing.includes(online)
                // 发布审核中
                const isPublishAuditing =
                    publish === PublishStatus.PublishedAuditing
                // 变更审核中
                const isChangeAuditing =
                    publish === PublishStatus.ChangeAuditing
                // 变更审核未通过
                const isChangeReject = publish === PublishStatus.ChangeReject
                // 上线审核中
                const isOnlineAuditing = onlineAuditing.includes(online)
                // 下线审核中
                const isOfflineAuditing =
                    online === OnlineStatus.OfflineAuditing

                const btnList: any[] = [
                    {
                        key: OperateType.DETAIL,
                        label: __('详情'),
                        show: true,
                        tooltipOpen: false,
                    },
                    {
                        key: OperateType.EDIT,
                        label: __('编辑'),
                        show: isAllowEdit,
                    },
                    {
                        key: OperateType.REVOCATION,
                        label: __('撤回'),
                        opLabel: __('撤销发布'),
                        show: isPublishAuditing,
                    },
                    {
                        key: OperateType.OFFLINE,
                        label: __('下线'),
                        show: isAllowOffline,
                        disabled: isChangeReject || isDraft,
                        disabledTip: __(
                            '变更通过或恢复到已发布版本后,可${type}此目录',
                            { type: __('下线') },
                        ),
                    },
                    {
                        key: OperateType.REVOCATION,
                        label: __('撤回'),
                        opLabel: __('撤销下线'),
                        show: isOfflineAuditing,
                    },
                    {
                        key: OperateType.ONLINE,
                        label: __('上线'),
                        show: isAllowOnline,
                        // 编目未选择上线到服务超市，禁用上线功能
                        // disabled: record.publish_flag === 0,
                        disabled: isChangeReject || isDraft,
                        disabledTip: __(
                            '变更通过或恢复到已发布版本后,可${type}此目录',
                            { type: __('上线') },
                        ),
                    },
                    {
                        key: OperateType.REVOCATION,
                        label: __('撤回'),
                        opLabel: __('撤销上线'),
                        show: isOnlineAuditing,
                    },
                    {
                        key: OperateType.CHANGE,
                        label: __('变更'),
                        show: isAllowChange,
                    },
                    {
                        key: OperateType.CANCEL,
                        label: __('撤回'),
                        opLabel: __('撤销变更'),
                        show: isChangeAuditing,
                    },
                    {
                        key: OperateType.DELETE,
                        label: __('删除'),
                        show: isAllowDelete,
                    },
                ]
                return (
                    <Space size={16} className={styles.oprColumn}>
                        {btnList
                            .filter((item) =>
                                activeKey === InfoResourcesType.All
                                    ? item.key === OperateType.DETAIL
                                    : item.show,
                            )
                            .map((item) => {
                                return (
                                    <Tooltip
                                        title={
                                            item?.disabled
                                                ? item?.disabledTip
                                                : ''
                                        }
                                    >
                                        <Button
                                            type="link"
                                            key={item.key}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleOperate(
                                                    item.key,
                                                    record,
                                                    item.opLabel || item.label,
                                                )
                                            }}
                                            disabled={item?.disabled}
                                        >
                                            {item.label}
                                        </Button>
                                    </Tooltip>
                                )
                            })}
                    </Space>
                )
            },
        },
    ]

    const renderEmpty = () => {
        return <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
    }

    const handleDelete = async () => {
        try {
            setDelBtnLoading(true)
            if (!curCatlg) return
            await delInfoCatlg(curCatlg.id)
            message.success(__('删除成功'))

            setSearchCondition({
                ...searchCondition,
                offset: initSearchCondition.offset,
            })
        } catch (e) {
            formatError(e)
        } finally {
            setDelBtnLoading(false)
            setDelVisible(false)
        }
    }

    const toAdd = () => {
        navigator(`/dataService/editInfoCatlg?opt=${OperateType.CREATE}`)
    }

    const toExport = async (catalog_ids) => {
        try {
            setExportLoading(true)
            const res = await exportInfoRescCatlg({ catalog_ids })
            streamToFile(
                res,
                `信息资源目录_${moment().format('YYYYMMDDHHmmss')}.xlsx`,
            )
            message.success(__('导出成功'))
            setSelectedRowKeys([])
        } catch (err) {
            formatError(err)
        } finally {
            setExportLoading(false)
        }
    }

    const handleTabChange = (key) => {
        setActiveKey(key)
    }
    return (
        <div className={styles.infoRescCatlgWrapper}>
            <Tabs
                activeKey={activeKey}
                onChange={handleTabChange}
                items={tabItemsData}
                className={styles.catlgTabs}
            />
            <DragBox
                defaultSize={defaultSize}
                minSize={[224, 270]}
                maxSize={[800, Infinity]}
                onDragEnd={(size) => {
                    setDefaultSize(size)
                }}
            >
                <div className={styles.left}>
                    <ResourcesCustomTree
                        onChange={getSelectedNode}
                        defaultCategotyId="00000000-0000-0000-0000-000000000001"
                        needUncategorized
                        isShowCurDept={activeKey === InfoResourcesType.Depart}
                        isShowMainDept={activeKey === InfoResourcesType.Depart}
                        applyScopeTreeKey="info_resource_left"
                    />
                </div>
                <div className={styles.right}>
                    <div className={styles.catlgResourceWrapper}>
                        {activeKey === InfoResourcesType.All ? (
                            <div className={styles['operate-container']}>
                                <div />
                                <Space size={8}>
                                    <Space size={8}>
                                        <SearchInput
                                            className={styles.nameInput}
                                            style={{ width: 282 }}
                                            placeholder={__(
                                                '搜索信息资源目录名称、编码、标签',
                                            )}
                                            onKeyChange={(kw: string) =>
                                                setSearchCondition({
                                                    ...searchCondition,
                                                    keyword: kw,
                                                    offset: 1,
                                                })
                                            }
                                        />
                                        <LightweightSearch
                                            formData={filterSearch}
                                            onChange={(data, key) => {
                                                if (key === 'updateTime') {
                                                    setSearchCondition({
                                                        ...searchCondition,
                                                        offset: 1,
                                                        filter: {
                                                            ...(searchCondition?.filter ||
                                                                {}),
                                                            update_at:
                                                                data
                                                                    .updateTime?.[0] ||
                                                                data
                                                                    .updateTime?.[1]
                                                                    ? {
                                                                          start: data
                                                                              .updateTime?.[0]
                                                                              ? moment(
                                                                                    `${data.updateTime?.[0]?.format(
                                                                                        'YYYY-MM-DD',
                                                                                    )} 00:00:00`,
                                                                                ).valueOf()
                                                                              : undefined,
                                                                          end: data
                                                                              .updateTime?.[1]
                                                                              ? moment(
                                                                                    `${data.updateTime?.[1]?.format(
                                                                                        'YYYY-MM-DD',
                                                                                    )} 23:59:59`,
                                                                                ).valueOf()
                                                                              : undefined,
                                                                      }
                                                                    : undefined,
                                                        },
                                                    })
                                                } else {
                                                    setSearchCondition({
                                                        ...searchCondition,
                                                        offset: 1,
                                                        filter: {
                                                            ...(searchCondition?.filter ||
                                                                {}),
                                                            update_at:
                                                                undefined,
                                                        },
                                                    })
                                                }
                                            }}
                                            defaultValue={{
                                                type: undefined,
                                                status: undefined,
                                            }}
                                        />
                                    </Space>
                                    <span>
                                        <RefreshBtn
                                            onClick={() =>
                                                setSearchCondition({
                                                    ...searchCondition,
                                                })
                                            }
                                        />
                                    </span>
                                </Space>
                            </div>
                        ) : (
                            <div className={styles.topOprWrapper}>
                                {/* <Button>{__('以业务表创建')}</Button> */}

                                <SearchLayout
                                    ref={searchFormRef}
                                    prefixNode={
                                        <Space size={8}>
                                            <Button
                                                type="primary"
                                                onClick={toAdd}
                                                icon={<AddOutlined />}
                                            >
                                                {__('以业务表创建')}
                                            </Button>
                                            <Tooltip
                                                title={
                                                    selectedRowKeys.length === 0
                                                        ? __(
                                                              '请选择要导出的信息资源目录',
                                                          )
                                                        : null
                                                }
                                                placement="bottom"
                                            >
                                                <Button
                                                    type="default"
                                                    disabled={
                                                        selectedRowKeys.length ===
                                                        0
                                                    }
                                                    loading={exportLoading}
                                                    onClick={() => {
                                                        toExport(
                                                            selectedRowKeys.map(
                                                                (item) =>
                                                                    item.toString(),
                                                            ),
                                                        )
                                                    }}
                                                    icon={
                                                        <FontIcon
                                                            name="icon-daochu"
                                                            style={{
                                                                fontSize: 14,
                                                                marginRight: 8,
                                                            }}
                                                        />
                                                    }
                                                >
                                                    {__('导出')}
                                                </Button>
                                            </Tooltip>
                                        </Space>
                                    }
                                    formData={searchFormData}
                                    onSearch={(object, isRefresh) => {
                                        const obj = timeStrToTimestamp(object)
                                        const {
                                            keyword,
                                            start,
                                            end,
                                            publish_status,
                                            online_status,
                                        } = obj
                                        const params = {
                                            ...searchCondition,
                                            keyword,
                                            filter: {
                                                ...(searchCondition?.filter ||
                                                    {}),
                                                publish_status:
                                                    publish_status?.split(','),
                                                online_status:
                                                    online_status?.split(','),
                                                update_at:
                                                    start || end
                                                        ? {
                                                              start,
                                                              end,
                                                          }
                                                        : undefined,
                                            },
                                            offset: isRefresh
                                                ? searchCondition.offset
                                                : 1,
                                        }
                                        setSearchCondition(params)
                                    }}
                                    getExpansionStatus={setSearchIsExpansion}
                                />
                            </div>
                        )}

                        {loading ? (
                            <div style={{ paddingTop: '64px' }}>
                                <Loader />
                            </div>
                        ) : (
                            <div className={styles.bottom}>
                                {tableProps.dataSource.length === 0 &&
                                !hasSearchCondition ? (
                                    <div className={styles.emptyWrapper}>
                                        {renderEmpty()}
                                    </div>
                                ) : (
                                    <Table
                                        className={classnames(
                                            !searchIsExpansion &&
                                                styles.isExpansion,
                                        )}
                                        rowClassName={styles.tableRow}
                                        columns={columns}
                                        {...tableProps}
                                        rowKey="id"
                                        rowSelection={
                                            activeKey !== InfoResourcesType.All
                                                ? rowSelection
                                                : undefined
                                        }
                                        scroll={{
                                            x: 1200,
                                            y:
                                                tableProps.dataSource.length ===
                                                0
                                                    ? undefined
                                                    : `calc(100vh - ${tableHeight}px)`,
                                        }}
                                        pagination={{
                                            ...tableProps.pagination,
                                            current: searchCondition.offset,
                                            pageSize: searchCondition.limit,
                                            showTotal: (t) => `共 ${t} 条`,
                                            showSizeChanger: true,
                                            hideOnSinglePage:
                                                (pagination?.total || 10) < 10,
                                        }}
                                        bordered={false}
                                        locale={{
                                            emptyText: <Empty />,
                                        }}
                                        onChange={(
                                            newPagination,
                                            filters,
                                            sorter,
                                        ) => {
                                            const newSearchCondition = {
                                                ...searchCondition,
                                                offset:
                                                    newPagination?.current || 1,
                                                limit:
                                                    newPagination?.pageSize ||
                                                    10,
                                            }
                                            if (
                                                newPagination.current ===
                                                searchCondition.offset
                                            ) {
                                                const selectedMenu =
                                                    handleTableChange(sorter)
                                                setSelectedSort(selectedMenu)
                                                setSearchCondition({
                                                    ...newSearchCondition,
                                                    sort_by: {
                                                        ...(searchCondition?.sort_by ||
                                                            {}),
                                                        fields: [
                                                            selectedMenu.key,
                                                        ],
                                                        direction:
                                                            selectedMenu.sort,
                                                    },
                                                })
                                            } else {
                                                setSearchCondition(
                                                    newSearchCondition,
                                                )
                                            }
                                        }}
                                    />
                                )}
                            </div>
                        )}
                        <Confirm
                            open={delVisible}
                            title={__('确认要删除吗？')}
                            content={__(
                                '信息资源目录删除后，将无法找回，请谨慎操作！',
                            )}
                            onOk={handleDelete}
                            onCancel={() => {
                                setDelVisible(false)
                            }}
                            width={432}
                            okButtonProps={{ loading: delBtnLoading }}
                        />
                    </div>
                </div>
            </DragBox>
        </div>
    )
}

export default InfoRescCatlg
