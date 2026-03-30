/* eslint-disable no-param-reassign */
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Button, message, Dropdown, Modal, Tabs, Tooltip } from 'antd'
import { useNavigate } from 'react-router-dom'
import type { MenuProps } from 'antd'
import classnames from 'classnames'
import { CaretDownOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { SortOrder } from 'antd/lib/table/interface'
import { useQuery } from '@/utils'
// import ResourcesDirTree from './ResourcesDirTree'
// 资源分类数据还没确定数据来源，暂时使用资源目录分类树
import ResourcesDirTree from '../ResourcesDir/ResourcesDirTree'
import { RescCatlgType, STATE, stateList } from '../ResourcesDir/const'
import {
    Architecture,
    CatlgTreeNode,
    typeAll,
    // stateList,
    allNodeInfo,
    serviceTypeList,
    createModelType,
    menus,
    defaultMenu,
    auditStateAndflowType,
    AuditType,
    auditProcessList,
    OperationType,
    PublishStatusText,
    OnlineStatusTexts,
    PublishStatusColors,
    OnlineStatusColors,
    ServiceTabKey,
} from './const'
import styles from './styles.module.less'
import DragBox from '../DragBox'
import {
    delServiceOverview,
    formatError,
    queryServiceOverviewList,
    createApiAuditFlow,
    SortDirection,
    OperateAuditStatus,
    changeAuditRevokeStatus,
    changeInterfaceOnline,
    OperateTypeOnlineStatus,
    getSortOptionsList,
    PermissionScope,
    serviceSyncAPI,
    SystemCategory,
} from '@/core'
import { AddOutlined } from '@/icons'
import dataEmpty from '@/assets/dataEmpty.svg'

import { SortBtn } from '../ToolbarComponents'
import SearchLayout from '@/components/SearchLayout'
import { SearchType } from '@/components/SearchLayout/const'
import {
    IQueryList,
    IRescItem,
} from '@/core/apis/dataApplicationService/index.d'
import __ from './locale'
import Confirm from '../Confirm'
import CommonTable from '../CommonTable'
import { FixedType } from '../CommonTable/const'
import { ReactComponent as script } from '@/icons/svg/outlined/script.svg'
import { ReactComponent as wizard } from '@/icons/svg/outlined/wizard.svg'
import CommonIcon from '@/components/CommonIcon'
import DropDownFilter from '../DropDownFilter'
import { disabledDate } from '@/components/MyAssets/helper'
import { BusinessDomainType } from '../BusinessDomain/const'
import {
    allAccessButtonList,
    ButtonGroupLists,
    ButtonLists,
    changeBtnListType,
    StatusTextBox,
} from './helper'
import { OptionBarTool } from '@/ui'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import APITest from './APITest'
import ResourcesCustomTree from '../ResourcesDir/ResourcesCustomTree'
import LogView from './LogView'

const initSearchCondition: IQueryList = {
    category_id: '',
    offset: 1,
    limit: 10,
}

const ApiServices = () => {
    const { checkPermission } = useUserPermCtx()
    const navigate = useNavigate()
    const ref: any = useRef()
    const query = useQuery()
    // 接口编号
    const serviceCode = query.get('serviceCode') || ''
    const [defaultSize, setDefaultSize] = useState<Array<number>>([12, 88])
    const commonTableRef: any = useRef()
    const searchRef: any = useRef()

    const [searchIsExpansion, setSearchIsExpansion] = useState<boolean>(false)
    // 左侧目录tabKey
    const [activeTabKey, setActiveTabKey] = useState<string>()

    const rightRef: any = useRef()

    // 创建表头排序
    const [tableSort, setTableSort] = useState<{
        [key: string]: SortOrder
    }>({
        name: null,
        createAt: null,
        updatedAt: 'descend',
    })

    // 排序
    const [selectedSort, setSelectedSort] = useState<any>(defaultMenu)

    // 删除弹框显示,【true】显示,【false】隐藏
    const [delVisible, setDelVisible] = useState<boolean>(false)
    // 删除目录loading
    const [delBtnLoading, setDelBtnLoading] = useState<boolean>(false)
    // 模式弹窗
    const [modalOpen, setModalOpen] = useState<boolean>(false)
    const [isEmpty, setIsEmpty] = useState<boolean>(false)
    const [initEmptyFlag, setInitEmptyFlag] = useState<boolean>(false)
    const [hasSearchCondition, setHasSearchCondition] = useState<boolean>(false)
    // const [{ using }] = useGeneralConfig()
    const [selectedNode, setSelectedNode] = useState<CatlgTreeNode>({
        name: '全部',
        id: '',
        path: '',
        type: Architecture.ALL,
    })

    const [searchCondition, setSearchCondition] = useState<IQueryList>({
        ...initSearchCondition,
    })

    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
    const [departmentList, setDepartmentList] = useState<any[]>([])
    const [createModel, setCreateModel] = useState<createModelType>(
        createModelType.Wizard,
    )

    const [treeName, setTreeName] = useState<string>('')
    const showEditBtn = ['draft', 'offline', '']
    const showDelBtn = ['draft']
    const showPublishBtn = ['draft', 'offline']
    const showOnlineBtn = ['publish']
    const showOfflineBtn = ['online']

    const [activeTab, setActiveTab] = useState<string>(ServiceTabKey.ALL)

    const [allTotal, setAllTotal] = useState<number>(0)
    const [myDepartmentTotal, setMyDepartmentTotal] = useState<number>(0)

    const [testApiOpen, setTestApiOpen] = useState<boolean>(false)
    const [testApiServiceId, setTestApiServiceId] = useState<string>('')

    const hasOprAccess = useMemo(() => {
        return checkPermission('manageInterfaceService') ?? false
    }, [checkPermission])

    const [logViewOpen, setLogViewOpen] = useState<boolean>(false)
    const [logViewServiceId, setLogViewServiceId] = useState<string>('')

    const hasAllAccess = useMemo(
        () =>
            checkPermission([
                {
                    key: 'manageInterfaceService',
                    scope: PermissionScope.All,
                },
            ]),
        [checkPermission],
    )

    const hasOperateInterfaceServicePermission = useMemo(() => {
        return checkPermission('operateInterfaceService')
    }, [checkPermission])

    useEffect(() => {
        getListCount()
    }, [])

    const getListCount = async () => {
        try {
            const [res1, res2] = await Promise.all([
                queryServiceOverviewList({
                    ...initSearchCondition,
                }),
                queryServiceOverviewList({
                    ...initSearchCondition,
                    is_user_dep: 'true',
                }),
            ])
            setAllTotal(res1.total_count)
            setMyDepartmentTotal(res2.total_count)
        } catch (err) {
            formatError(err)
        }
    }
    const tabList = useMemo(() => {
        return [
            {
                key: ServiceTabKey.ALL,
                label: `${__('全部接口')} ${allTotal}`,
            },
            {
                key: ServiceTabKey.MY_DEPARTMENT,
                label: `${__('本部门接口')} ${myDepartmentTotal}`,
            },
        ]
    }, [allTotal, myDepartmentTotal])

    useEffect(() => {
        const {
            sort,
            direction,
            offset,
            limit,
            subject_domain_id,
            department_id,
            category_id,
            service_keyword,
            is_user_dep,
            ...searchObj
        } = searchCondition
        setHasSearchCondition(Object.values(searchObj).some((item) => item))
    }, [searchCondition])

    useEffect(() => {
        if (hasAllAccess || hasOperateInterfaceServicePermission) {
            setActiveTab(ServiceTabKey.ALL)
        } else {
            setActiveTab(ServiceTabKey.MY_DEPARTMENT)
        }
    }, [hasAllAccess])

    useEffect(() => {
        if (activeTab === ServiceTabKey.ALL) {
            setSearchCondition({
                ...searchCondition,
                is_user_dep: undefined,
                department_id: undefined,
            })
        } else {
            setSearchCondition({
                ...searchCondition,
                is_user_dep: 'true',
            })
        }
    }, [activeTab])
    // 查询form参数
    const [searchFormData, setSearchFormData] = useState<any[]>([
        {
            label: __('接口名称、编号'),
            key: 'service_keyword',
            type: SearchType.Input,
            itemProps: {
                value: serviceCode,
            },
            isAlone: true,
        },
        {
            label: __('生成方式'),
            key: 'service_type',
            type: SearchType.Select,
            // defaultValue: typeAll,
            itemProps: {
                options: serviceTypeList.filter((item) => item.value),
            },
        },
        {
            label: __('发布状态'),
            key: 'publish_status',
            type: SearchType.Select,
            // defaultValue: '',
            itemProps: {
                options: [],
            },
            clearKey: 'auditState',
        },
        {
            label: __('上线状态'),
            key: 'status',
            type: SearchType.Select,
            // defaultValue: '',
            itemProps: {
                options: [],
            },
        },

        // {
        //     label: '所属部门',
        //     key: 'department_id',
        //     type: SearchType.Select,
        //     defaultValue: typeAll,
        //     itemProps: {
        //         fieldNames: { label: 'name', value: 'id' },
        //         options: departmentList,
        //     },
        // },
        // {
        //     label: '微服务',
        //     key: 'microservice',
        //     type: SearchType.select,
        //     defaultValue: typeAll,
        //     itemProps: {
        //         options: microserviceList,
        //     },
        // },
        {
            label: __('创建时间'),
            key: 'times',
            type: SearchType.RangePicker,
            defaultValue: typeAll,
            itemProps: {
                format: 'YYYY-MM-DD',
                disabledDate: (current: any) => disabledDate(current, {}),
            },
        },
    ])

    useEffect(() => {
        getSortListOptions()
    }, [])

    // useEffect(() => {
    //     // search()
    //     // getDepartmentList()
    // }, [activeTabKey])

    // 点击目录项
    const [curCatlg, setCurCatlg] = useState<IRescItem>()

    const handleOperate = async (key: OperationType, record) => {
        setCurCatlg(record)
        let url
        switch (key) {
            case OperationType.DETAIL:
                // 查看详情
                url = `/dataService/interfaceService/api-service-detail?serviceId=${record.service_id}&activeTabKey=${activeTabKey}&treeNodeId=${selectedNode.id}`
                navigate(url)
                break
            case OperationType.DELETE:
                // 删除
                setDelVisible(true)
                break
            case OperationType.CHANGE:
            case OperationType.EDIT:
                // 变更和编辑
                if (record.service_type === 'service_register') {
                    url = `/dataService/interfaceService/registry?serviceId=${record.service_id}`
                    navigate(url)
                } else {
                    url = `/dataService/interfaceService/create?serviceId=${record.service_id}`
                    navigate(url)
                }
                break
            case OperationType.CHANGE_AUDIT_RETRACT:
                // 变更审核撤回
                await changeAuditRevokeStatus({
                    service_id: record.service_id,
                    operate_type: OperateAuditStatus.CHANGE_AUDIT_REVOKE,
                })
                setSearchCondition({
                    ...searchCondition,
                    offset: 1,
                })
                break
            case OperationType.ONLINE:
                // 上线
                await changeInterfaceOnline({
                    service_id: record.service_id,
                    operate_type: OperateTypeOnlineStatus.UP,
                })
                setSearchCondition({
                    ...searchCondition,
                    offset: 1,
                })
                break
            case OperationType.PUBLISH_AUDIT_RETRACT:
                // 发布审核撤回
                await changeAuditRevokeStatus({
                    service_id: record.service_id,
                    operate_type: OperateAuditStatus.PUBLISH_AUDIT_REVOKE,
                })
                setSearchCondition({
                    ...searchCondition,
                    offset: 1,
                })
                break
            case OperationType.ONLINE_AUDIT_RETRACT:
                // 上线审核撤回
                await changeAuditRevokeStatus({
                    service_id: record.service_id,
                    operate_type: OperateAuditStatus.UP_AUDIT_REVOKE,
                })
                setSearchCondition({
                    ...searchCondition,
                    offset: 1,
                })
                break
            case OperationType.OFFLINE_AUDIT_RETRACT:
                // 下线审核撤回
                await changeAuditRevokeStatus({
                    service_id: record.service_id,
                    operate_type: OperateAuditStatus.DOWN_AUDIT_REVOKE,
                })
                setSearchCondition({
                    ...searchCondition,
                    offset: 1,
                })
                break
            case OperationType.OFFLINE:
                // 下线
                await changeInterfaceOnline({
                    service_id: record.service_id,
                    operate_type: OperateTypeOnlineStatus.DOWN,
                })
                setSearchCondition({
                    ...searchCondition,
                    offset: 1,
                })
                break
            case OperationType.TEST:
                setTestApiOpen(true)
                setTestApiServiceId(record.service_id)
                break
            case OperationType.SYNC_INTERFACE:
                await serviceSyncAPI(record.service_id)
                setSearchCondition({
                    ...searchCondition,
                    offset: 1,
                })
                break
            case OperationType.LOG:
                setLogViewOpen(true)
                setLogViewServiceId(record.service_id)
                break
            default:
                break
        }
    }

    const getSortListOptions = async () => {
        try {
            const data = await getSortOptionsList()

            setSearchFormData(
                searchFormData.map((item) => {
                    if (item.key === 'publish_status') {
                        return {
                            ...item,
                            itemProps: {
                                options: data.publish_status.map((it) => {
                                    return {
                                        value: it.key,
                                        label: __(it.text),
                                    }
                                }),
                            },
                        }
                    }
                    if (item.key === 'status') {
                        return {
                            ...item,
                            itemProps: {
                                options: data.updown_status.map((it) => {
                                    return {
                                        value: it.key,
                                        label: __(it.text),
                                    }
                                }),
                            },
                        }
                    }
                    return item
                }),
            )
        } catch (err) {
            formatError(err)
        }
    }

    // 查询
    const search = () => {
        commonTableRef?.current?.getData()
    }

    // 新增
    const toAdd = () => {
        setModalOpen(true)
    }

    // const getDepartmentList = async () => {
    //     const base = [
    //         {
    //             id: 0,
    //             name: '全部',
    //         },
    //     ]
    //     const res = await getObjects({
    //         id: '',
    //         is_all: true,
    //         type: Architecture.DEPARTMENT,
    //     })
    //     setDepartmentList(
    //         res.entries && res.entries.length > 0
    //             ? [...base, ...res.entries]
    //             : base,
    //     )
    // }

    // 批量操作
    // const toBatchOperate = async (op: BatchOperate) => {
    //     if (selectedRowKeys.length === 0) return
    //     try {
    //         if (op === BatchOperate.PUBLISH) {
    //             await publishServiceOverview(selectedRowKeys.toString())
    //         } else if (op === BatchOperate.UNPUBLISH) {
    //             await unpublishServiceOverview(selectedRowKeys.toString())
    //         } else if (op === BatchOperate.DEL) {
    //             await delServiceOverview(selectedRowKeys.toString())
    //         }
    //         message.success(__('操作成功'))
    //         search()
    //     } catch (res) {
    //         message.error(res)
    //     }
    // }

    const columns: any = [
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
            key: 'service_name', //
            sorter: true,
            sortOrder: tableSort.name,
            fixed: 'left',
            showSorterTooltip: {
                title: __('按接口名称排序'),
                placement: 'bottom',
                overlayInnerStyle: {
                    color: '#fff',
                },
            },
            width: 460,
            // fixed: FixedType.LEFT,
            render: (text, record) => (
                <div className={styles.catlgBox}>
                    <div className={classnames(styles.catlgName)} title={text}>
                        <div className={styles.nameText} title={text}>
                            <span
                                title={text}
                                onClick={() =>
                                    handleOperate(OperationType.DETAIL, record)
                                }
                                className={styles.name}
                            >
                                {text || '--'}
                            </span>
                            {record?.has_draft ? (
                                <span className={styles.draftText}>
                                    {__('有草稿')}
                                </span>
                            ) : null}
                            {record?.sync_flag &&
                            record?.sync_flag !== 'success' ? (
                                <Tooltip
                                    title={record?.sync_msg}
                                    color="#fff"
                                    overlayInnerStyle={{
                                        color: '#ff4d4f',
                                    }}
                                >
                                    <span className={styles.syncText}>
                                        {__('同步接口失败')}
                                        <InfoCircleOutlined />
                                    </span>
                                </Tooltip>
                            ) : null}
                        </div>
                    </div>
                    <div
                        className={classnames(
                            styles.ellipsis,
                            styles.catlgCode,
                        )}
                        title={record.service_code}
                        style={{
                            color: 'rgba(0, 0, 0, 0.45)',
                            fontSize: '12px',
                        }}
                    >
                        {record.service_code}
                    </div>
                </div>
            ),
        },
        {
            title: __('生成方式'),
            dataIndex: 'service_type',
            key: 'service_type',
            ellipsis: true,
            render: (text) =>
                serviceTypeList.find((item) => item.value === text)?.label ||
                '--',
            width: 120,
        },
        // {
        //     title: __('所属业务对象'),
        //     dataIndex: 'subject_domain_name ',
        //     key: 'subject_domain_name',
        //     ellipsis: true,
        //     width: 180,
        //     render: (text, record) => (
        //         <span title={record?.subject_domain_name}>
        //             {record?.subject_domain_name?.split('/')?.slice(-1)?.[0] ||
        //                 '--'}
        //         </span>
        //     ),
        // },
        {
            title: __('所属部门'),
            dataIndex: 'department',
            key: 'department',
            ellipsis: true,
            width: 180,
            render: (text, record) => {
                const displayNames = record?.department?.name?.split('/')
                return (
                    <span title={record?.department?.name}>
                        {displayNames.length
                            ? displayNames?.[displayNames.length - 1] || '--'
                            : '--'}
                    </span>
                )
            },
        },

        // {
        //     title: '微服务',
        //     dataIndex: 'microservice',
        //     key: 'microservice',
        //     ellipsis: true,
        //     render: (text, record) =>
        //         microserviceList.find((item) => item.value === text)?.label ||
        //         '--',
        // },
        {
            title: __('发布状态'),
            dataIndex: 'publish_status',
            ellipsis: true,
            key: 'publish_status',
            render: (text, record) => {
                return (
                    <StatusTextBox
                        color={PublishStatusColors[record.publish_status]}
                        text={PublishStatusText[record.publish_status]}
                        advice={record.audit_advice}
                    />
                )
            },
            width: 180,
        },
        {
            title: __('上线状态'),
            dataIndex: 'status',
            key: 'status',
            ellipsis: true,
            render: (text, record) => (
                <StatusTextBox
                    color={OnlineStatusColors[record.status]}
                    text={OnlineStatusTexts[text]}
                    advice={record.online_audit_advice}
                />
            ),
            width: 180,
            // <CommonStatusLabel value={text} infos={stateList} />
        },

        {
            title: __('更新时间'),
            dataIndex: 'update_time',
            key: 'update_time',
            ellipsis: true,
            width: 220,
        },
        {
            title: __('创建时间'),
            dataIndex: 'create_time',
            key: 'create_time',
            sorter: true,
            sortOrder: tableSort.createAt,
            showSorterTooltip: false,
            ellipsis: true,
            width: 220,
        },
        {
            title: __('接口说明'),
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
            width: 180,
            render: (text) => text || '--',
        },
        {
            title: __('操作'),
            key: 'action',
            width: 240,
            fixed: FixedType.RIGHT,
            render: (text: string, record) => {
                const btnGroupList =
                    activeTab === ServiceTabKey.ALL &&
                    !hasOperateInterfaceServicePermission
                        ? allAccessButtonList
                        : ButtonGroupLists
                // 上线相关操作
                const onlineOperationTypes = [
                    OperationType.ONLINE,
                    OperationType.OFFLINE,
                    OperationType.ONLINE_AUDIT_RETRACT,
                    OperationType.OFFLINE_AUDIT_RETRACT,
                ]
                const btnList = btnGroupList.filter(
                    (item) =>
                        item.StatusGroup.includes(record?.publish_status) &&
                        item.StatusGroup.includes(record?.status),
                )
                const optionTypes = btnList.length
                    ? btnList[0].menus
                    : btnGroupList[0].menus
                const buttonMenus = optionTypes
                    .map(
                        (current) =>
                            ButtonLists.find((item) => item.key === current) ||
                            ButtonLists[0],
                    )
                    .filter((item) => {
                        if (
                            record?.sync_flag &&
                            record?.sync_flag === 'success' &&
                            item.key === OperationType.SYNC_INTERFACE
                        ) {
                            return false
                        }
                        return true
                    })
                return (
                    <OptionBarTool
                        menus={changeBtnListType(buttonMenus, 4)}
                        onClick={(key, e) => {
                            handleOperate(key as OperationType, record)
                        }}
                        getPopupContainer={(node) => rightRef?.current || node}
                    />
                )
            },
        },
    ]

    // 获取选中的节点
    const getSelectedNode = (sn?: any) => {
        // if: 在树结构中操作后获取选中项 else: 在列表中操作后 选中项不变，但要更新列表及详情
        let node
        if (sn) {
            node = { ...sn }
        } else {
            node = allNodeInfo
        }
        setTreeName(node.name)

        setSelectedNode(sn || allNodeInfo)

        if (sn?.isAll) {
            setSearchCondition({
                ...searchCondition,
                department_id: undefined,
                offset: 1,
                category_node_id: undefined,
                info_system_id: undefined,
                // subject_domain_node_id: undefined,
            })
        } else if (
            sn?.type === 'organization' ||
            sn?.type === 'department' ||
            sn?.type === ''
        ) {
            setSearchCondition({
                ...searchCondition,
                department_id:
                    node.id === '00000000-0000-0000-0000-000000000000'
                        ? 'uncategory'
                        : node.id,
                offset: 1,
                category_node_id: undefined,
                info_system_id: undefined,
                category_id: undefined,
                // subject_domain_id: undefined,
            })
        } else if (sn?.type === '00000000-0000-0000-0000-000000000002') {
            setSearchCondition({
                ...searchCondition,
                // category_id: node.id,
                offset: 1,
                department_id: undefined,
                info_system_id:
                    node.id === '00000000-0000-0000-0000-000000000000'
                        ? 'uncategory'
                        : node.id,
                category_node_id: undefined,
                // subject_domain_id: undefined,
            })
        } else {
            setSearchCondition({
                ...searchCondition,
                category_node_id:
                    node.id === '00000000-0000-0000-0000-000000000000'
                        ? 'uncategory'
                        : node.id,
                department_id: undefined,
                offset: 1,
                info_system_id: undefined,
                category_id: node.type,
            })
        }
        // else if (type === RescCatlgType.DOAMIN) {
        //     setSearchCondition({
        //         ...searchCondition,
        //         category_id: undefined,
        //         department_id: undefined,
        //         subject_domain_id: node.id,
        //         offset: 1,
        //     })
        // }
    }

    const getCurTabKey = (tabKey: string) => {
        setActiveTabKey(tabKey)
    }

    // 选中树节点变化，查属性详情
    // useEffect(() => {
    //     const searchConditionTemp = { ...initSearchCondition }
    //     if (activeTabKey === RescCatlgType.ORGSTRUC) {
    //         setSearchCondition({
    //             ...searchConditionTemp,
    //             department_id: selectedNode.id,
    //         })
    //     } else if (activeTabKey === RescCatlgType.RESC_CLASSIFY) {
    //         setSearchCondition({
    //             ...searchConditionTemp,
    //             category_id: selectedNode.id,
    //         })
    //     }
    // }, [selectedNode])

    const emptyDesc = () => {
        return (
            <div style={{ textAlign: 'center' }}>
                <div>{__('暂无数据')}</div>
                {/* <div>
                    {__('点击')}
                    <Button type="link" onClick={toAdd}>
                        【{__('新建')}】
                    </Button>
                    {__('按钮可新建')}
                </div> */}
            </div>
        )
    }

    const handleDelete = async () => {
        try {
            setDelBtnLoading(true)
            if (!curCatlg) return
            await delServiceOverview(curCatlg.service_id)
            setDelBtnLoading(false)
            message.success(__('删除成功'))
        } catch (e) {
            formatError(e)
        } finally {
            setDelBtnLoading(false)
            setDelVisible(false)
            search()
        }
    }

    const rowSelection = {
        onChange: (keys: React.Key[]) => {
            setSelectedRowKeys(keys)
        },
    }

    const dropdownItems: MenuProps['items'] = [
        {
            key: '1',
            label: <a onClick={toAdd}>{__('接口生成')}</a>,
        },
        {
            key: '2',
            label: (
                <a
                    onClick={() => {
                        const departmentParam =
                            activeTabKey === 'organization'
                                ? `&departmentId=${selectedNode?.id || ''}`
                                : ''
                        const categoryParam =
                            activeTabKey === 'resource'
                                ? `&categoryId=${selectedNode?.id || ''}`
                                : ''
                        const subjectDomain =
                            activeTabKey === RescCatlgType.DOAMIN &&
                            [
                                BusinessDomainType.subject_domain,
                                BusinessDomainType.business_activity,
                                BusinessDomainType.business_object,
                            ].includes(selectedNode?.type as BusinessDomainType)
                                ? `&domainId=${selectedNode?.id || ''}`
                                : ''
                        const url = `/dataService/interfaceService/registry?createModel=${createModel}${
                            departmentParam || categoryParam || subjectDomain
                        }`
                        navigate(url)
                    }}
                >
                    {__('接口注册')}
                </a>
            ),
        },
    ]

    // 新增
    const modalHandleOk = () => {
        const departmentParam =
            activeTabKey === 'organization'
                ? `&departmentId=${selectedNode?.id || ''}`
                : ''
        const categoryParam =
            activeTabKey === 'resource'
                ? `&categoryId=${selectedNode?.id || ''}`
                : ''

        const subjectDomain =
            activeTabKey === RescCatlgType.DOAMIN &&
            [
                BusinessDomainType.subject_domain,
                BusinessDomainType.business_activity,
                BusinessDomainType.business_object,
            ].includes(selectedNode?.type as BusinessDomainType)
                ? `&domainId=${selectedNode?.id || ''}`
                : ''
        const url = `/dataService/interfaceService/create?createModel=${createModel}${
            departmentParam || categoryParam || subjectDomain
        }&orgNodeId=${
            selectedNode.cate_id === SystemCategory.Organization
                ? selectedNode.id
                : ''
        }`

        navigate(url)
        setModalOpen(false)
    }
    // 筛选顺序变化
    // const handleMenuChange = (selectedMenu) => {
    //     setSearchCondition({
    //         ...searchCondition,
    //         sort: selectedMenu.key,
    //         direction: selectedMenu.sort,
    //     })
    // }

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
        switch (selectedMenu.key) {
            case 'create_time':
                setTableSort({
                    createAt:
                        selectedMenu.sort === SortDirection.ASC
                            ? 'ascend'
                            : 'descend',
                    name: null,
                })
                break
            case 'name':
                setTableSort({
                    name:
                        selectedMenu.sort === SortDirection.ASC
                            ? 'ascend'
                            : 'descend',
                    createAt: null,
                })
                break
            case 'update_time':
                setTableSort({
                    name: null,
                    createAt: null,
                })
                break
            default:
                setTableSort({
                    name: null,
                    createAt: null,
                })
                break
        }
    }

    // 表格排序改变
    const handleTableChange = (sorter) => {
        if (sorter.column) {
            if (sorter.columnKey === 'create_time') {
                setTableSort({
                    createAt: sorter.order || 'ascend',
                    name: null,
                })
            } else {
                setTableSort({
                    createAt: null,
                    name: sorter.order || 'ascend',
                })
            }
            return {
                key:
                    sorter.columnKey === 'service_name'
                        ? 'name'
                        : sorter.columnKey,
                sort:
                    sorter.order === 'ascend'
                        ? SortDirection.ASC
                        : SortDirection.DESC,
            }
        }
        if (searchCondition.sort === 'create_time') {
            if (searchCondition.direction === SortDirection.ASC) {
                setTableSort({
                    createAt: 'descend',
                    name: null,
                })
            } else {
                setTableSort({
                    createAt: 'ascend',
                    name: null,
                })
            }
        } else if (searchCondition.sort === SortDirection.ASC) {
            setTableSort({
                createAt: null,
                name: 'descend',
            })
        } else {
            setTableSort({
                createAt: null,
                name: 'ascend',
            })
        }
        return {
            key: searchCondition.sort,
            sort:
                searchCondition.direction === SortDirection.ASC
                    ? SortDirection.DESC
                    : SortDirection.ASC,
        }
    }

    // 1：上线、3：下线、4：发布
    const handleOnline = async (data: any, audit_type: AuditType) => {
        try {
            await createApiAuditFlow({
                service_id: data?.service_id,
                audit_type,
            })
            message.success(__('操作成功'))
            setSearchCondition({
                ...searchCondition,
                offset: initSearchCondition.offset,
                limit: initSearchCondition.limit,
            })
        } catch (error) {
            if (
                error?.data?.code === 'DataCatalog.Public.NoAuditDefFoundError'
            ) {
                message.error({
                    content: __('审核发起失败，未找到匹配的审核流程'),
                    duration: 5,
                })
            } else {
                formatError(error)
            }
        }
    }

    const getListTemplate = () => {
        return (
            <div
                className={classnames(
                    styles.right,
                    !searchIsExpansion && styles.isExpansion,
                )}
                ref={rightRef}
            >
                <div className={styles.rigthTitle}>
                    {/* {treeName || __('全部')} */}
                    {__('接口管理')}
                </div>
                <SearchLayout
                    formData={searchFormData}
                    onSearch={(queryData) => {
                        let stateObj: any = {
                            audit_type: '',
                            audit_status: '',
                        }
                        if (queryData.auditState) {
                            const [audit_type, audit_status] =
                                queryData.auditState.split(',')
                            stateObj = {
                                // 状态值转换
                                audit_type:
                                    auditStateAndflowType.find(
                                        (item) =>
                                            item.value === audit_type &&
                                            item.type === 'audit_type',
                                    )?.key || '',
                                // 状态值转换
                                audit_status:
                                    auditStateAndflowType.find(
                                        (item) =>
                                            item.value === audit_status &&
                                            item.type === 'audit_status',
                                    )?.key || '',
                                auditState: undefined,
                            }
                        }
                        setSearchCondition({
                            ...searchCondition,
                            offset: 1,
                            ...queryData,
                            ...stateObj,
                        })
                    }}
                    itemValueChange={(value) => {
                        const [key] = Object.keys(value)
                        // const new
                        if (key === 'status') {
                            searchRef?.current?.changeFormValues({
                                auditState: undefined,
                            })
                            const field: any = auditStateAndflowType.find(
                                (item) =>
                                    item.key === value[key] &&
                                    item.type === key,
                            )?.value
                            const list: any[] = field
                                ? auditProcessList
                                      .filter((item) =>
                                          item.showList.includes(field),
                                      )
                                      .filter((item) => item.value)
                                : auditProcessList.filter((item) => item.value)
                            setSearchFormData(
                                searchFormData.map((item: any) => {
                                    if (item.key === 'auditState') {
                                        item.itemProps = {
                                            options: list,
                                        }
                                    }
                                    return item
                                }),
                            )
                        }
                    }}
                    onReset={() => {
                        setSearchFormData(
                            searchFormData.map((item) => {
                                if (item.key === 'auditState') {
                                    item.itemProps = {
                                        options: auditProcessList.filter(
                                            (it) => it.value,
                                        ),
                                    }
                                }
                                return item
                            }),
                        )
                    }}
                    getExpansionStatus={setSearchIsExpansion}
                    ref={searchRef}
                    prefixNode={
                        hasOprAccess || hasOperateInterfaceServicePermission ? (
                            <Dropdown
                                menu={{ items: dropdownItems }}
                                placement="bottom"
                            >
                                <Button type="primary" icon={<AddOutlined />}>
                                    {__('新建')}
                                    <CaretDownOutlined />
                                </Button>
                            </Dropdown>
                        ) : (
                            <div />
                        )
                    }
                    suffixNode={
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
                    }
                />
                {/* <Button
                            onClick={() => toBatchOperate(BatchOperate.PUBLISH)}
                            disabled={selectedRowKeys.length === 0}
                        >
                            {__('发布')}
                        </Button>
                        <Button
                            onClick={() =>
                                toBatchOperate(BatchOperate.UNPUBLISH)
                            }
                            disabled={selectedRowKeys.length === 0}
                        >
                            {__('取消发布')}
                        </Button>
                        <Button
                            onClick={() => toBatchOperate(BatchOperate.DEL)}
                            disabled={selectedRowKeys.length === 0}
                        >
                            {__('删除')}
                        </Button> */}
                {/* </Space> */}

                <CommonTable
                    queryAction={queryServiceOverviewList}
                    params={searchCondition}
                    baseProps={{
                        columns,
                        scroll: {
                            x: 1300,
                            y: `calc(100vh - ${
                                searchIsExpansion
                                    ? hasSearchCondition
                                        ? 420 + 41
                                        : 420
                                    : 360
                            }px)`,
                        },
                        rowKey: 'service_code',
                        rowClassName: styles.tableRow,
                    }}
                    ref={commonTableRef}
                    emptyDesc={
                        hasOprAccess ? emptyDesc() : <div>{__('暂无数据')}</div>
                    }
                    emptyIcon={dataEmpty}
                    emptyExcludeField={[
                        'direction',
                        'sort',
                        'subject_domain_id',
                        'department_id',
                        'category_id',
                    ]}
                    getEmptyFlag={(flag) => {
                        setIsEmpty(flag)
                    }}
                    onTableListUpdated={() => {
                        setSelectedSort(undefined)
                    }}
                    onChange={(currentPagination, filters, sorter) => {
                        if (
                            currentPagination.current === searchCondition.offset
                        ) {
                            const selectedMenu = handleTableChange(sorter)
                            setSelectedSort(selectedMenu)
                            setSearchCondition({
                                ...searchCondition,
                                sort: selectedMenu.key,
                                direction: selectedMenu.sort,
                                offset: 1,
                                limit: currentPagination?.pageSize,
                            })
                        } else {
                            setSearchCondition({
                                ...searchCondition,
                                offset: currentPagination.current,
                            })
                        }
                    }}
                />
            </div>
        )
    }

    return (
        <div className={styles.serviceOverviewWrapper}>
            {(hasAllAccess || hasOperateInterfaceServicePermission) && (
                <div className={styles.serviceOverviewHeader}>
                    <Tabs
                        items={tabList}
                        onChange={(key) => {
                            setActiveTab(key)
                        }}
                        activeKey={activeTab}
                    />
                </div>
            )}
            <div className={styles.serviceOverviewContent}>
                <DragBox
                    defaultSize={defaultSize}
                    minSize={[220, 270]}
                    maxSize={[800, Infinity]}
                    onDragEnd={(size) => {
                        setDefaultSize(size)
                    }}
                >
                    <div className={styles.left}>
                        {/* <ResourcesDirTree
                            getCurTabKey={getCurTabKey}
                            getSelectedNode={getSelectedNode}
                            ref={ref}
                            initNodeType={[
                                Architecture.ORGANIZATION,
                                Architecture.DEPARTMENT,
                            ].join()}
                            selectOptions={rescCatlgItems.filter((currentTab) =>
                                [
                                    RescCatlgType.DOAMIN,
                                    RescCatlgType.ORGSTRUC,
                                ].includes(currentTab.value),
                            )}
                            filterDomainType={[
                                BusinessDomainType.subject_domain_group,
                                BusinessDomainType.subject_domain,
                                BusinessDomainType.business_object,
                                BusinessDomainType.business_activity,
                            ]}
                            limitDomainTypes={[
                                BusinessDomainType.business_object,
                                BusinessDomainType.business_activity,
                            ]}
                            domainPlaceholder={__(
                                '搜索主题域分组、主题域、业务对象/活动',
                            )}
                            defaultActiveKey={RescCatlgType.DOAMIN}
                            needUncategorized
                            unCategorizedKey="uncategory"
                        /> */}
                        <ResourcesCustomTree
                            onChange={getSelectedNode}
                            defaultCategotyId="00000000-0000-0000-0000-000000000001"
                            needUncategorized
                            isShowCurDept={
                                activeTab === ServiceTabKey.MY_DEPARTMENT
                            }
                            isShowMainDept={
                                activeTab === ServiceTabKey.MY_DEPARTMENT
                            }
                            wapperStyle={{ height: 'calc(100vh - 105px)' }}
                            applyScopeTreeKey="interface_service_left"
                        />
                    </div>
                    {getListTemplate()}
                </DragBox>
            </div>

            <Confirm
                open={delVisible}
                title={__('确认要删除该接口记录吗？')}
                content={__('记录删除将无法找回，请谨慎操作')}
                onOk={handleDelete}
                onCancel={() => {
                    setDelVisible(false)
                }}
                width={432}
                okButtonProps={{ loading: delBtnLoading }}
            />

            {/* 选择模式 */}
            <Modal
                title={__('选择模式')}
                open={modalOpen}
                onOk={modalHandleOk}
                width={800}
                onCancel={() => setModalOpen(false)}
            >
                <div className={styles.selectMode}>
                    <div className={styles.modeBox}>
                        <div className={styles.leftMode}>
                            <div
                                onClick={() =>
                                    setCreateModel(createModelType.Wizard)
                                }
                                className={classnames(
                                    styles.modeBoxItem,
                                    createModelType.Wizard === createModel &&
                                        styles.active,
                                )}
                            >
                                <CommonIcon
                                    icon={wizard}
                                    className={styles.modeIcon}
                                />
                                <div>{__('您无需编写任何代码')}</div>
                                <div>{__('在界面勾选配置即可快速生成API')}</div>
                            </div>
                            <div className={styles.modeLabel}>
                                {__('向导模式')}
                            </div>
                        </div>
                        <div className={styles.leftMode}>
                            <div
                                onClick={() =>
                                    setCreateModel(createModelType.Script)
                                }
                                className={classnames(
                                    styles.modeBoxItem,
                                    createModelType.Script === createModel &&
                                        styles.active,
                                )}
                            >
                                <CommonIcon
                                    icon={script}
                                    className={styles.modeIcon}
                                />
                                <div>{__('自行编写脚本')}</div>
                                <div>
                                    {__('支持多表关联、复杂查询和聚合函数')}
                                </div>
                            </div>
                            <div className={styles.modeLabel}>
                                {__('脚本模式')}
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
            {testApiOpen && testApiServiceId && (
                <APITest
                    open={testApiOpen}
                    onClose={() => setTestApiOpen(false)}
                    serviceId={testApiServiceId}
                />
            )}
            {logViewOpen && logViewServiceId && (
                <LogView
                    open={logViewOpen}
                    onClose={() => setLogViewOpen(false)}
                    id={logViewServiceId}
                />
            )}
        </div>
    )
}

export default ApiServices
