import {
    CheckCircleFilled,
    ExclamationCircleFilled,
    InfoCircleFilled,
    InfoCircleOutlined,
    PlusOutlined,
} from '@ant-design/icons'
import { useDebounce } from 'ahooks'
import { Button, Space, Table, Tooltip, message } from 'antd'

import { SortOrder } from 'antd/lib/table/interface'
import classnames from 'classnames'
import { toNumber } from 'lodash'
import moment from 'moment'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import dataEmpty from '@/assets/dataEmpty.svg'
import { FixedType } from '@/components/CommonTable/const'
import Confirm from '@/components/Confirm'
import { getState } from '@/components/DatasheetView/helper'
import DragBox from '@/components/DragBox'
import DropDownFilter from '@/components/DropDownFilter'
import {
    onLineAudingAndRejectList,
    publishAudingAndRejectList,
} from '@/components/ResourcesDir/const'
import SearchLayout from '@/components/SearchLayout'
import { RefreshBtn, SortBtn } from '@/components/ToolbarComponents'
import {
    IGetRescPolicyList,
    IRescPolicyItem,
    IRescPolicyListItem,
    RescPolicyStatus,
    RescPolicyType,
    SortDirection,
    SortType,
    changeRescPolictStatus,
    deleteRescAudit,
    getProcessDefinitionByKey,
    reqRescAuditList,
    reqRescPolicyDetail,
    updateRescPolicy,
} from '@/core'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import { Empty, Loader, OptionBarTool, OptionMenuType } from '@/ui'
import { OperateType } from '@/utils'
import { confirm } from '@/utils/modalHelper'
import WorkflowViewPlugin, {
    IWorkflowInfo,
    VisitType,
} from '../../WorkflowViewPlugin'
import { BizType, PolicyType } from '../const'
import EditRescPolicy from './EditRescPolicy'
import {
    IsSetted,
    builtInRescPolicyTypeList,
    defaultMenu,
    handleRescPolicyError,
    initSearchCondition,
    isSettedList,
    menus,
    oprTitleAndContList,
    policyStatusList,
    rescPolicyTypeLabelList,
    searchFormData,
} from './helper'
import __ from './locale'
import SideInfoDrawer from './SideInfoDrawer'
import styles from './styles.module.less'

const CurrentPolicyType = PolicyType.AssetPermission
const CurrentBizType = BizType.AuthService

export const rescPolicyPrcsType = PolicyType.AssetPermission

function AssetPermission() {
    const [loading, setLoading] = useState<boolean>(true)

    const [searchCondition, setSearchCondition] = useState<IGetRescPolicyList>({
        ...initSearchCondition,
    })
    const searchDebounce = useDebounce(searchCondition, { wait: 500 })
    const [searchIsExpansion, setSearchIsExpansion] = useState<boolean>(false)
    const [tableHeight, setTableHeight] = useState<number>(0)
    const [initSearch, setInitSearch] = useState<boolean>(true)

    // 当前点击选中行
    const [selectedRow, setSelectedRow] = useState<any>()
    // 编辑策略
    const [editPolicyOpen, setEditPolicyOpen] = useState(false)
    // 删除弹框显示,【true】显示,【false】隐藏
    const [delOpen, setDelOpen] = useState(false)
    // 删除目录loading
    const [delBtnLoading, setDelBtnLoading] = useState(false)
    const [cancelLoad, setCancelLoad] = useState(false)

    const [defaultSize, setDefaultSize] = useState<Array<number>>([76, 24])
    const [isDragging, setIsDragging] = useState(false)
    // 侧边栏显示
    const [sideDrawerOpen, setSideDrawerOpen] = useState(true)

    // 创建表头排序
    const [tableSort, setTableSort] = useState<{
        [key: string]: SortOrder
    }>({
        name: null,
        updated_at: null,
    })
    // 资源策略列表
    const [rescPolicyList, setRescPolicyList] =
        useState<IRescPolicyListItem[]>()
    const [total, setTotal] = useState(0)

    // 设置流程
    const [workflow, setWorkflow] = useState<any>()
    const [isSetWorkflowOpen, setIsSetWorkflowOpen] = useState<boolean>(false)
    const originalWorkflow = useRef<any>(null)

    // formItems-选择了搜索条件
    const hasSearchCondition = useMemo(() => {
        return (
            searchCondition.status ||
            searchCondition.has_audit ||
            searchCondition.has_resource
        )
    }, [searchDebounce])

    // 排序
    const [selectedSort, setSelectedSort] = useState<any>(defaultMenu)

    const getData = async (params: any) => {
        try {
            const { keyword, has_audit, has_resource, ...rest } = params
            const queryParams = {
                keyword,
                ...rest,
            }
            const isSettedValue = isSettedList?.map((item) => item.value)
            if (isSettedValue.includes(has_audit)) {
                queryParams.has_audit = has_audit === IsSetted.Set
            }
            if (isSettedValue.includes(has_resource)) {
                queryParams.has_resource = has_resource === IsSetted.Set
            }
            const res = await reqRescAuditList(queryParams)
            setSelectedSort(undefined)

            // const res = policyTestData
            setRescPolicyList(res?.entries)
            setTotal(res?.total_count || 0)
            // 搜索后侧边栏清除已选择，提示请选择策略
            setSelectedRow(keyword ? undefined : res?.entries?.[0])
            return { total: res?.total_count || 0, list: res?.entries || [] }
        } catch (e) {
            handleRescPolicyError(e, reloadData)

            return { total: 0, list: [] }
        } finally {
            setLoading(false)
        }
    }

    // const { tableProps, run, pagination } = useAntdTable(getData, {
    //     defaultPageSize: 10,
    //     manual: true,
    // })

    useEffect(() => {
        setLoading(true)
        getData(searchDebounce)
    }, [searchDebounce])

    useEffect(() => {
        // 展开/收起查询条件高度
        const defalutHeight: number = !searchIsExpansion ? 247 : 358
        // 已选搜索条件高度
        const searchConditionHeight: number = hasSearchCondition ? 44 : 0
        const paginationHeight = total > 10 ? 48 : 0
        const height = defalutHeight + searchConditionHeight + paginationHeight

        setTableHeight(height)
    }, [hasSearchCondition, searchIsExpansion, total])

    const reloadData = () => {
        getData(searchDebounce)
    }

    const openOprModal = (op: OperateType, item: any) => {
        confirm({
            icon: <InfoCircleFilled style={{ color: '#faac14' }} />,
            title: oprTitleAndContList[op].title,
            content: oprTitleAndContList[op].content,
            okText: __('确定'),
            cancelText: __('取消'),
            onOk: async () => {
                const oprSucsMsg =
                    op === OperateType.ACTIVE
                        ? __('启用成功')
                        : op === OperateType.DISABLE
                        ? __('停用成功')
                        : op === OperateType.DELETE
                        ? __('删除成功')
                        : ''
                try {
                    const { id, status } = item

                    if (
                        [OperateType.ACTIVE, OperateType.DISABLE].includes(op)
                    ) {
                        await changeRescPolictStatus(
                            item.id,
                            status === RescPolicyStatus.Enabled
                                ? RescPolicyStatus.Disabled
                                : RescPolicyStatus.Enabled,
                        )
                    } else if (op === OperateType.DELETE) {
                        // 删除策略
                        await deleteRescAudit(item.id)
                        setOprItem(undefined)
                        setSelectedRow(undefined)
                    }
                    message.success(oprSucsMsg)
                    // 非内置策略，启用后缺少审核资源，提示请尽快添加
                    if (
                        op === OperateType.ACTIVE &&
                        !item?.resources_count &&
                        RescPolicyType.Customize === item?.type
                    ) {
                        message.warning(__('策略缺少审核资源，请尽快添加'))
                    }
                } catch (e) {
                    handleRescPolicyError(e, reloadData)
                } finally {
                    setSearchCondition({
                        ...searchCondition,
                        offset: 1,
                    })
                }
            },
        })
    }

    // 添加资源、设置/解绑流程等操作，在表格中修改操作行的数据，不直接刷新数据
    const handleUpdTableOprRow = (newPolicyInfo?: IRescPolicyItem) => {
        const policyListTemp = rescPolicyList?.map((item) => {
            if (item.id === newPolicyInfo?.id) {
                return {
                    ...(item || {}),
                    ...(newPolicyInfo || {}),
                    resources_count: newPolicyInfo?.resources?.length,
                }
            }
            return item
        })
        setRescPolicyList(policyListTemp)
    }

    /**
     * 保存流程
     */
    const saveWorkflow = async (workflowInfo: IWorkflowInfo) => {
        try {
            const config = {
                id: workflowInfo.process_def_id,
                key: workflowInfo.process_def_key,
                name: workflowInfo.process_def_name,
                type: rescPolicyPrcsType,
            }
            const detail = await reqRescPolicyDetail(oprItem?.id)
            await updateRescPolicy({
                ...detail,
                proc_def_key: workflowInfo.process_def_key,
            })

            originalWorkflow.current = config
            setIsSetWorkflowOpen(false)
            // reloadData()
            setSelectedRow({
                ...selectedRow,
                proc_def_key: workflowInfo.process_def_key,
            })
            handleUpdTableOprRow({
                ...detail,
                proc_def_key: workflowInfo.process_def_key,
            })

            // 仅新建流程 启用引导
            if (!oprItem?.proc_def_key) {
                confirm({
                    title: __('审核流程保存成功'),
                    icon: (
                        <CheckCircleFilled
                            style={{ color: 'rgb(82, 196, 27)' }}
                        />
                    ),
                    content: (
                        <div className={styles.modalContentWrapper}>
                            <div className={styles.modalContentTitle}>
                                {__('是否立即启用策略？')}
                            </div>
                            <div className={styles.modalContentWrapper}>
                                {__(
                                    '启用后，用户申请策略管控范围内的资源权限时，将按照此策略设定的审核流程进行审核。',
                                )}
                            </div>
                        </div>
                    ),
                    okText: __('立即启用'),
                    cancelText: __('暂不启用'),
                    async onOk() {
                        try {
                            // 仅更新新建流程保存审核流程+启用状态
                            await updateRescPolicy({
                                ...detail,
                                status: RescPolicyStatus.Enabled,
                                proc_def_key: workflowInfo.process_def_key,
                                service_type: BizType.AuthService,
                                audit_type: PolicyType.AssetPermission,
                            })
                            message.success(__('启用成功'))
                            if (!oprItem?.resources_count) {
                                message.warning(
                                    __('策略缺少审核资源，请尽快添加'),
                                )
                            }
                            reloadData()
                        } catch (e) {
                            handleRescPolicyError(e, reloadData)
                        }
                    },
                })
            }
            // else {
            //     message.success(__('保存成功'))
            // }
        } catch (e) {
            handleRescPolicyError(e, reloadData)
        }
    }

    /**
     * 获取已设置的流程详情
     */
    const getProcess = async (prcsId: string) => {
        try {
            if (!prcsId) return
            const process = await getProcessDefinitionByKey(prcsId)
            setWorkflow(process)
            originalWorkflow.current = process
            setIsSetWorkflowOpen(true)
        } catch (e) {
            handleRescPolicyError(e, reloadData)
        }
    }

    /**
     * 解绑审核流程
     */
    const unBindWorkflow = async (prcsId: string) => {
        if (prcsId) {
            confirm({
                title: __('确认解绑'),
                content: __('确认要解绑该流程吗？'),
                okText: __('确定'),
                cancelText: __('取消'),
                onOk: async () => {
                    try {
                        const detail = await reqRescPolicyDetail(oprItem.id)
                        await updateRescPolicy({
                            ...detail,
                            proc_def_key: '',
                        })
                        handleUpdTableOprRow({
                            ...(oprItem || {}),
                            ...(detail || {}),
                            resources_count: detail.resources?.length,
                            proc_def_key: '',
                        })

                        if (oprItem.id === selectedRow?.id) {
                            // 更新当前选中行信息
                            setSelectedRow({
                                ...(oprItem || {}),
                                ...(detail || {}),
                                resources_count: detail.resources?.length,
                                proc_def_key: '',
                            })
                        }
                        setWorkflow(undefined)
                        message.success(__('解绑成功'))
                    } catch (e) {
                        handleRescPolicyError(e, reloadData)
                    }
                },
            })
        } else {
            getData(searchCondition)
        }
    }

    /**
     * 取消
     */
    const closeWorkflow = () => {
        setIsSetWorkflowOpen(false)
    }

    // 表格选中行
    // const [curSelItem, setCurSelItem] = useState<any>()
    // 表格操作项
    const [oprItem, setOprItem] = useState<any>()
    const [curOptType, setCurOptType] = useState<OperateType>()

    const handleOperate = async (op: OperateType, item?: any) => {
        setCurOptType(op)
        setOprItem(undefined)
        if (op === OperateType.CREATE) {
            // 新建
            setEditPolicyOpen(true)
        } else if (op === OperateType.EDIT) {
            // 编辑
            setOprItem(item)
            setEditPolicyOpen(true)
        }
        // else if (op === OperateType.DELETE) {
        //     setDelOpen(true)
        // }
        else if (
            [
                OperateType.DELETE,
                OperateType.ACTIVE,
                OperateType.DISABLE,
            ].includes(op)
        ) {
            // 删除/启用/停用 确认框
            setOprItem(item)
            openOprModal(op, item)
        } else if (op === OperateType.SETTING) {
            setOprItem(item)
            //  设置审核流程
            if (item.proc_def_key) {
                getProcess(item.proc_def_key)
            } else {
                setIsSetWorkflowOpen(true)
            }
        } else if (op === OperateType.REMOVE) {
            setOprItem(item)
            // 解绑流程
            if (item.proc_def_key) {
                unBindWorkflow(item.proc_def_key)
            }
        }
    }

    // 表格排序改变
    const handleTableChange = (sorter) => {
        const sorterKey = sorter.columnKey

        if (sorter.column) {
            setTableSort({
                [SortType.UPDATED]: null,
                [SortType.NAME]: null,
                [SortType.CREATED]: null,
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
            [SortType.UPDATED]: null,
            [SortType.NAME]: null,
            [SortType.CREATED]: null,
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

    const columns: any = [
        {
            title: (
                <div>
                    <span>{__('策略名称')}</span>
                    <span style={{ color: 'rgba(0,0,0,0.45)' }}>
                        {__('（描述）')}
                    </span>
                </div>
            ),
            dataIndex: 'name',
            key: 'name',
            sorter: true,
            sortOrder: tableSort.name,
            showSorterTooltip: {
                title: __('按策略名称排序'),
                placement: 'bottom',
                overlayInnerStyle: {
                    color: '#fff',
                },
            },
            fixed: FixedType.LEFT,
            width: 210,
            render: (text, record) => {
                const publishAuding = publishAudingAndRejectList
                    ?.map((o) => o.value)
                    .includes(record.publish_status)
                const onlineStatus = onLineAudingAndRejectList
                    .map((o) => o.value)
                    .includes(record?.online_status)
                const hasTag =
                    record?.draft_id !== '0' || publishAuding || onlineStatus
                return (
                    <div className={styles.policyName}>
                        <div className={styles.policyNameCont}>
                            <div
                                className={classnames(
                                    styles.names,
                                    styles.editedPolicy,
                                )}
                            >
                                <div
                                    onClick={() =>
                                        handleOperate(
                                            OperateType.DETAIL,
                                            record,
                                        )
                                    }
                                    className={styles.namesText}
                                    title={text}
                                >
                                    {text || '--'}
                                </div>
                                <Tooltip
                                    title={
                                        <div>
                                            <div style={{ fontWeight: 550 }}>
                                                {__('审核资源')}
                                            </div>
                                            <div>
                                                {__(
                                                    '1、审核策略优先级为“自定义策略>内置策略”，若为资源启用了自定义策略，则此资源发起权限申请时，会优先使用自定义策略绑定的审核流程。',
                                                )}
                                            </div>
                                            <div>
                                                {__(
                                                    '2、内置策略不可变更信息和删除，只能调整审核流程，且此策略会置顶显示（不受排序变更影响）。',
                                                )}
                                            </div>
                                        </div>
                                    }
                                    color="#fff"
                                    overlayStyle={{ maxWidth: 'unset' }}
                                    overlayInnerStyle={{
                                        color: 'rgba(0,0,0,0.85)',
                                    }}
                                >
                                    {builtInRescPolicyTypeList.includes(
                                        record?.type,
                                    ) && (
                                        <span className={styles.explanation}>
                                            {__('说明')}
                                        </span>
                                    )}
                                </Tooltip>
                            </div>
                            <div
                                className={styles.desc}
                                title={record.description}
                            >
                                {record.description || '--'}
                            </div>
                        </div>
                    </div>
                )
            },
        },
        {
            title: __('类型'),
            dataIndex: 'type',
            key: 'type',
            width: 80,
            ellipsis: true,
            render: (type, record) =>
                builtInRescPolicyTypeList.includes(type)
                    ? __('内置')
                    : __('自定义'),
        },
        {
            title: __('策略状态'),
            dataIndex: 'status',
            key: 'status',
            width: 90,
            ellipsis: true,
            render: (status, record) => {
                return (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {getState(status, policyStatusList, {
                            width: '8px',
                            height: '8px',
                        })}
                    </div>
                )
            },
        },
        {
            title: __('审核流程'),
            dataIndex: 'proc_def_key',
            key: 'proc_def_key',
            ellipsis: true,
            width: 108,
            render: (proc_def_key, record) => {
                return proc_def_key ? (
                    <div className={styles.policyPrcs}>
                        <FontIcon
                            name="icon-liuchengshezhi"
                            style={{
                                color: '#1890FF',
                                fontSize: 16,
                                marginRight: '8px',
                            }}
                        />
                        <div className={styles.colContent}>{__('已设置')}</div>
                    </div>
                ) : (
                    '--'
                )
            },
        },
        {
            title: (
                <div>
                    <span>{__('审核资源')}</span>
                    <Tooltip
                        title={
                            <div>
                                <div style={{ fontWeight: 550 }}>
                                    {__('审核资源')}
                                </div>
                                <div>
                                    {__(
                                        '这些资源在发起权限申请时，将按照对应策略内的审核流程进行审核。',
                                    )}
                                </div>
                            </div>
                        }
                        placement="bottomLeft"
                        color="#fff"
                        overlayStyle={{ maxWidth: 460 }}
                        overlayInnerStyle={{
                            color: 'rgba(0,0,0,0.85)',
                        }}
                    >
                        <InfoCircleOutlined
                            style={{
                                fontSize: '16px',
                                marginLeft: '4px',
                                cursor: 'pointer',
                                color: 'rgba(0,0,0,0.65)',
                            }}
                        />
                    </Tooltip>
                </div>
            ),
            dataIndex: 'resources_count',
            key: 'resources_count',
            ellipsis: true,
            width: 122,
            render: (count: number, record) => {
                const { type } = record
                return builtInRescPolicyTypeList.includes(type) ? (
                    rescPolicyTypeLabelList[type]
                ) : count ? (
                    <Space size={8}>
                        <FontIcon
                            type={IconType.COLOREDICON}
                            name="icon-wenjianjia"
                            style={{
                                color: '#1890FF',
                                fontSize: 16,
                            }}
                        />
                        <div className={styles.colContent}>{count}</div>
                    </Space>
                ) : (
                    <>
                        <span style={{ color: 'rgba(0,0,0,0.85)' }}>--</span>
                        <Tooltip
                            color="#fff"
                            overlayStyle={{ maxWidth: 320 }}
                            overlayInnerStyle={{
                                color: 'rgba(0,0,0,0.85)',
                            }}
                            title={__(
                                '策略未绑定审核资源，暂不生效，需要调整策略',
                            )}
                        >
                            <ExclamationCircleFilled
                                style={{
                                    marginLeft: 8,
                                    color: '#e60012',
                                    cursor: 'pointer',
                                }}
                            />
                        </Tooltip>
                    </>
                )
            },
        },
        {
            title: __('更新时间'),
            dataIndex: 'updated_at',
            key: 'updated_at',
            width: 180,
            sorter: true,
            sortOrder: tableSort.updated_at,
            render: (text, record) => {
                return text ? moment(text).format('YYYY-MM-DD HH:mm:ss') : '--'
            },
        },
        {
            title: __('操作'),
            key: 'action',
            width: 300,
            fixed: FixedType.RIGHT,
            render: (_: string, record) => {
                const { type, status, proc_def_key } = record

                const maxBtnLen = 4

                // 策略是否内为置策略
                const isInnerPolicy = [
                    RescPolicyType.BuiltInView,
                    RescPolicyType.BuiltInInterface,
                    RescPolicyType.BuiltInIndicator,
                ].includes(type)
                // 策略是否设置流程
                const isSetProcess = !!proc_def_key
                // 策略是否启用
                const isActived = status === RescPolicyStatus.Enabled

                const showBtnList: any[] = [
                    {
                        key: OperateType.EDIT,
                        label: __('编辑策略'),
                        show: !isInnerPolicy,
                    },
                    {
                        key: OperateType.ACTIVE,
                        label: __('启用'),
                        show: !isActived,
                        disabled: !isSetProcess,
                        title: !isSetProcess && __('请先设置审核流程'),
                    },
                    {
                        key: OperateType.DISABLE,
                        label: __('停用'),
                        show: isActived,
                        disabled: !isSetProcess,
                        title:
                            !isSetProcess && __('尚未设置审核流程，无需解绑'),
                    },
                    {
                        key: OperateType.SETTING,
                        label: __('设置审核流程'),
                        show: true,
                    },
                    {
                        key: OperateType.REMOVE,
                        label: __('解绑审核流程'),
                        show: true,
                        disabled: isActived || !isSetProcess,
                        title: !isSetProcess
                            ? __('尚未设置审核流程，无需解绑')
                            : isActived &&
                              __('策略正在使用中，不能直接解绑，请先停用策略'),
                    },
                    {
                        key: OperateType.DELETE,
                        label: __('删除策略'),
                        show: !isInnerPolicy,
                    },
                ].filter((item) => item.show)

                const btnList: any[] = showBtnList.map((item: any, index) => {
                    return {
                        key: item.key,
                        label: item.label,
                        menuType:
                            (showBtnList?.length || 0) > maxBtnLen &&
                            index >= maxBtnLen - 1
                                ? OptionMenuType.More
                                : OptionMenuType.Menu,
                        disabled: item.disabled,
                        title: item.title,
                    }
                })

                return (
                    <OptionBarTool
                        menus={btnList}
                        onClick={(key, e) => {
                            e.preventDefault()
                            e.stopPropagation()

                            handleOperate(key as OperateType, record)
                        }}
                    />
                )
            },
        },
    ]

    // 分页改变
    const onPaginationChange = (page, pageSize) => {
        setSearchCondition({
            ...searchCondition,
            offset: page || 1,
            limit: pageSize,
        })
    }

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
        const { key } = selectedMenu
        switch (key) {
            case SortType.NAME:
            case SortType.UPDATED:
            case SortType.CREATED:
                setTableSort({
                    [key]:
                        selectedMenu.sort === SortDirection.ASC
                            ? 'ascend'
                            : 'descend',
                })
                break
            default:
                setTableSort({})
                break
        }
    }

    // const handleDelete = async () => {
    //     try {
    //         setDelBtnLoading(true)
    //         // if (!curPolicy) return
    //         // await delRescPolicy(curPolicy.id)
    //         message.success(__('删除成功'))
    //         // updateResourcesSum()
    //         setSearchCondition({
    //             ...searchCondition,
    //             offset: initSearchCondition.offset,
    //         })
    //     } catch (e) {
    //         formatError(e)
    //     } finally {
    //         setDelBtnLoading(false)
    //         setDelOpen(false)
    //     }
    // }

    return (
        <div className={styles.assetPermissionWrapper}>
            <div className={styles.topTitle}>
                {__('资源权限申请')}

                <span>
                    {__(
                        '（启用审核策略后，用户申请权限时需要审核，审核通过后资源权限可申请成功；若未设置，则不提供给用户申请权限的功能。）',
                    )}
                </span>
            </div>
            <div className={styles.searchWrapper}>
                <SearchLayout
                    // ref={searchFormRef}
                    prefixNode={
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => handleOperate(OperateType.CREATE)}
                        >
                            {__('新建审核策略')}
                        </Button>
                    }
                    formData={searchFormData}
                    onSearch={(object, isRefresh) => {
                        // const obj = timeStrToTimestamp(object)
                        const params = {
                            ...searchCondition,
                            ...object,
                            // mount_type: object?.mount_type?.split(','),
                            offset: isRefresh ? searchCondition.offset : 1,
                        }
                        setSearchCondition(params)
                    }}
                    isShowRefreshBtn={false}
                    suffixNode={
                        <>
                            <SortBtn
                                contentNode={
                                    <DropDownFilter
                                        menus={menus}
                                        defaultMenu={defaultMenu}
                                        menuChangeCb={handleMenuChange}
                                        changeMenu={selectedSort}
                                    />
                                }
                            />
                            <RefreshBtn
                                style={{ marginRight: '4px' }}
                                onClick={() => getData(searchCondition)}
                            />
                            <span
                                className={
                                    sideDrawerOpen
                                        ? styles.sideDrawerOpen
                                        : undefined
                                }
                                onClick={() =>
                                    setSideDrawerOpen((prev) => !prev)
                                }
                            >
                                <FontIcon name="icon-cebianlan" />
                            </span>
                        </>
                    }
                    getExpansionStatus={setSearchIsExpansion}
                />
            </div>
            {loading ? (
                <Loader />
            ) : (
                <DragBox
                    defaultSize={defaultSize}
                    minSize={[800, 340]}
                    maxSize={[Infinity, 600]}
                    onDragStart={() => {
                        setIsDragging(true)
                    }}
                    onDragEnd={(size) => {
                        setIsDragging(false)
                        setDefaultSize(size)
                    }}
                    cursor="col-resize"
                    gutterSize={1}
                    gutterStyles={{
                        width: '1px',
                        borderRight: '1px solid #E0E0E0',
                        borderLeft: 'none !important',
                        paddingLeft: '20px',
                        marginRight: '10px',
                    }}
                    splitClass={classnames(
                        styles.dragBox,
                        isDragging && styles.isDraggingBox,
                        !sideDrawerOpen && styles.noRightNode,
                    )}
                    showExpandBtn={false}
                    rightNodeStyle={{
                        padding: 0,
                        minWidth: 340,
                        maxWidth: 600,
                    }}
                >
                    <div className={styles.bottom}>
                        {/* 表格不可能为空，至少有三条内置策略（视图、接口、指标） */}
                        <Table
                            className={classnames(
                                styles.tableWrapper,
                                !searchIsExpansion && styles.isExpansion,
                            )}
                            columns={columns}
                            dataSource={rescPolicyList}
                            // {...tableProps}
                            rowKey="id"
                            rowClassName={(record) => {
                                return record.id === selectedRow?.id
                                    ? classnames(
                                          styles.tableRow,
                                          styles.selectedRow,
                                      )
                                    : styles.tableRow
                            }}
                            onRow={(record) => {
                                return {
                                    onClick: (e) => {
                                        setSelectedRow(record)
                                    }, // 点击行
                                }
                            }}
                            scroll={{
                                x: 1100, // 启用横向滚动，设置为所有列宽度总和
                                y:
                                    rescPolicyList?.length === 0
                                        ? undefined
                                        : `calc(100vh - ${tableHeight}px)`,
                            }}
                            pagination={{
                                // ...tableProps.pagination,
                                total,
                                current: toNumber(searchCondition?.offset) || 1,
                                pageSize:
                                    toNumber(searchCondition?.limit) || 10,
                                hideOnSinglePage: total <= 10,
                                showQuickJumper: true,
                                showSizeChanger: true,
                                showTotal: (count) =>
                                    __('共${count}条', { count }),
                                onChange: onPaginationChange,
                            }}
                            bordered={false}
                            locale={{
                                emptyText: searchCondition.keyword ? (
                                    <Empty />
                                ) : (
                                    <Empty
                                        desc={__('暂无数据')}
                                        iconSrc={dataEmpty}
                                    />
                                ),
                            }}
                            onChange={(newPagination, filters, sorter) => {
                                // const selectedMenu = handleTableChange(sorter)
                                // setTableSort(selectedMenu)
                                if (
                                    newPagination.current ===
                                    searchCondition.offset
                                ) {
                                    const selectedMenu =
                                        handleTableChange(sorter)
                                    setSelectedSort(selectedMenu)
                                    setSearchCondition({
                                        ...searchCondition,
                                        sort: selectedMenu.key,
                                        direction: selectedMenu.sort,
                                        offset: 1,
                                        limit: newPagination?.pageSize,
                                    })
                                } else {
                                    setSearchCondition({
                                        ...searchCondition,
                                        offset: newPagination.current,
                                    })
                                }
                            }}
                        />
                    </div>
                    <div
                        className={styles.rightWrapper}
                        hidden={!sideDrawerOpen}
                    >
                        <SideInfoDrawer
                            id={selectedRow?.id}
                            proc_def_key={selectedRow?.proc_def_key}
                            type={selectedRow?.type}
                            open={sideDrawerOpen}
                            updateDetail={handleUpdTableOprRow}
                            reloadData={reloadData}
                            onSave={() => reloadData()}
                            onUnBind={() => reloadData()}
                        />
                    </div>
                </DragBox>
            )}

            {/* 删除/启用/停用策略 */}
            <Confirm
                open={delOpen}
                title={__('确定${text}审核策略吗？', {
                    text:
                        curOptType === OperateType.DELETE
                            ? __('删除')
                            : curOptType === OperateType.ACTIVE
                            ? __('启用')
                            : curOptType === OperateType.DISABLE
                            ? __('停用')
                            : '',
                })}
                content={
                    <span style={{ color: '#FF4D4F' }}>
                        {/* {selectedIds.length > 0
                            ? __(
                                  '删除数据后不可恢复，若这些库表被其他功能引用，也会导致其不能正常使用，确定要执行此操作吗？',
                              )
                            : __(
                                  '删除数据后不可恢复，若此库表被其他功能引用，也会导致其不能正常使用，确定要执行此操作吗？',
                              )} */}
                    </span>
                }
                icon={
                    <ExclamationCircleFilled
                        style={{ color: '#FAAD14', fontSize: '22px' }}
                    />
                }
                onOk={() => {}}
                onCancel={() => {
                    setDelOpen(false)
                }}
                width={410}
                okButtonProps={{ loading: delBtnLoading }}
            />

            {/* 设置策略 */}
            {isSetWorkflowOpen && (
                <WorkflowViewPlugin
                    flowProps={{
                        allowEditName: false,
                        process_type: rescPolicyPrcsType,
                        visit: workflow ? VisitType.Update : VisitType.New,
                        ...(workflow
                            ? {
                                  process_def_id: workflow.id,
                                  process_def_key: workflow.key,
                              }
                            : {}),
                        onCloseAuditFlow: closeWorkflow,
                        onSaveAuditFlow: saveWorkflow,
                    }}
                    className={styles.setWorkflowWrapper}
                />
            )}

            {/* 新建/编辑策略 */}
            {editPolicyOpen && (
                <EditRescPolicy
                    id={oprItem?.id}
                    open={editPolicyOpen}
                    // oprType={curOptType}
                    onClose={() => setEditPolicyOpen(false)}
                    onSure={(policyInfo?: any, isSetProcess?: boolean) => {
                        setEditPolicyOpen(false)
                        // if (oprItem?.id && policyInfo) {
                        //     // 编辑策略成功-修改表格操作行数据
                        //     handleUpdTableOprRow(policyInfo)
                        //     // 刷新侧边栏相关信息
                        //     setSelectedRow({
                        //         ...selectedRow,
                        //     })
                        // } else {
                        // 新建成功-刷新列表获得数据
                        setSearchCondition((prev) => {
                            return {
                                ...prev,
                                offset: 1,
                            }
                        })
                        // }
                        // if (isSetProcess) {
                        //     setWorkflow(undefined)
                        //     setIsSetWorkflowOpen(true)
                        // }
                    }}
                />
            )}
        </div>
    )
}

export default memo(AssetPermission)
