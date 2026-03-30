import { InfoCircleFilled } from '@ant-design/icons'
import { useAntdTable } from 'ahooks'
import { Button, Popconfirm, Space, Table, Tabs, Tooltip, message } from 'antd'
import { SortOrder } from 'antd/lib/table/interface'
import classnames from 'classnames'
import { isNumber, toNumber } from 'lodash'
import moment from 'moment'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { confirm } from '@/utils/modalHelper'
/* eslint-disable no-bitwise */
import dataEmpty from '@/assets/dataEmpty.svg'
import { FixedType } from '@/components/CommonTable/const'
import SearchLayout from '@/components/SearchLayout'
import { SortBtn } from '@/components/ToolbarComponents'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import {
    PermissionScope,
    SortDirection,
    SystemCategory,
    createAuditFlow,
    delRescCatlg,
    formatError,
    getCurOrgEditRescCatlgList,
} from '@/core'
import { IRescItem } from '@/core/apis/dataCatalog/index.d'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import { AppDataContentColored, FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import { Loader } from '@/ui'
import Empty from '@/ui/Empty'
import { OperateType, getActualUrl } from '@/utils'
import Confirm from '../Confirm'
import { getContentState, getState } from '../DatasheetView/helper'
import DropDownFilter from '../DropDownFilter'
import {
    EditResourcesType,
    ISearchCondition,
    OfflinedList,
    RescCatlgType,
    ResourceType,
    TableResourcesListType,
    comprehensionReportStatus,
    comprehensionStatus,
    editedDefaultMenu,
    editedMenus,
    initSearchCondition,
    onLineAudingAndRejectList,
    onLineStatus,
    onLineStatusList,
    onlineAuditing,
    onlinedList,
    onlinedRejectList,
    publishAudingAndRejectList,
    publishAuditing,
    publishStatus,
    publishStatusList,
    publishedList,
    publishedRejectList,
    resourceTypeList,
    resourcesTypeLabelMap,
    shareTypeList,
    tabItems,
    upPublish,
} from './const'
import {
    ScoreText,
    UndsLabel,
    getAuditingLabel,
    renderTaskStatus,
    searchFormInitData,
    timeStrToTimestamp,
} from './helper'
import __ from './locale'
import styles from './styles.module.less'

interface IResourcesEdited {
    selectedTreeNode: any
    treeType?: RescCatlgType | string
    updateResourcesSum: () => void
    departmentKeyChange?: (key: string) => void

    // 资源列表类型
    tableResourcesListType?: TableResourcesListType
}
const ResourcesEdited = (props: IResourcesEdited) => {
    const {
        selectedTreeNode,
        treeType,
        updateResourcesSum,
        departmentKeyChange,
        tableResourcesListType = TableResourcesListType.ResourcesList,
    } = props
    const navigator = useNavigate()
    const [loading, setLoading] = useState<boolean>(true)
    const [{ using, governmentSwitch }] = useGeneralConfig()

    // 删除弹框显示,【true】显示,【false】隐藏
    const [delVisible, setDelVisible] = useState(false)
    // 上线弹框显示
    const [onlineVisible, setOnlineVisible] = useState(false)
    // 删除目录loading
    const [delBtnLoading, setDelBtnLoading] = useState(false)
    const [cancelLoad, setCancelLoad] = useState(false)
    const [tabItemsData, setTabItemsData] = useState<any[]>(
        tabItems.map((o) => ({
            ...o,
            label: resourcesTypeLabelMap[tableResourcesListType][o.key],
        })),
    )
    const [activeKey, setActiveKey] = useState<EditResourcesType>(
        tableResourcesListType === TableResourcesListType.ResourceEvaluation ||
            tableResourcesListType ===
                TableResourcesListType.DepartmentResourceDir
            ? EditResourcesType.Edited
            : EditResourcesType.AllResources,
    )
    // 创建表头排序
    const [tableSort, setTableSort] = useState<{
        [key: string]: SortOrder
    }>({
        name: null,
        updatedAt: 'descend',
    })

    // 资源负面清单不显示表格列
    const resourcesListExcludeKeys = [
        'resource_type',
        'department',
        'data_aggregation_status',
        'completeness_score',
    ]
    // 数据资源目录不显示表格列
    const resourcesDirExcludeKeys = [
        'shared_type',
        'data_aggregation_status',
        'completeness_score',
    ]

    // 资源评估表格列
    const resourceEvaluationExcludeKeys = ['shared_type', 'department']

    // 本部门数据资源目录不显示表格列（不显示可信度评估）
    const departmentResourceDirExcludeKeys = [
        'shared_type',
        'completeness_score',
        'data_aggregation_status',
    ]

    // 排序
    const [selectedSort, setSelectedSort] = useState<any>(editedDefaultMenu)

    const [searchCondition, setSearchCondition] = useState<ISearchCondition>({
        ...initSearchCondition,
    })

    // 搜索条件
    const [searchFormData, setSearchFormData] = useState(searchFormInitData)
    const [searchIsExpansion, setSearchIsExpansion] = useState<boolean>(false)

    const searchFormRef: any = useRef()
    const [currentOpsType, setCurrentOpsType] = useState<OperateType>(
        OperateType.PUBLISH,
    )
    const [tableHeight, setTableHeight] = useState<number>(0)
    const [initSearch, setInitSearch] = useState<boolean>(true)
    const { checkPermission } = useUserPermCtx()

    const hasSearchCondition = useMemo(() => {
        return (
            searchCondition.keyword ||
            searchCondition.mount_type ||
            searchCondition.publish_status ||
            searchCondition.online_status ||
            searchCondition.comprehension_status ||
            searchCondition.subject_id ||
            searchCondition.updated_at_start
        )
    }, [searchCondition])

    const governmentStatus = useMemo(() => {
        return governmentSwitch.on
    }, [governmentSwitch])

    const spliceParams = () => {
        let searchData: any = {}
        if (selectedTreeNode.cate_id === SystemCategory.Organization) {
            searchData = {
                ...searchCondition,
                department_id: selectedTreeNode.id,
                info_system_id: undefined,
                category_node_id: undefined,
            }
        } else if (
            selectedTreeNode.cate_id === SystemCategory.InformationSystem
        ) {
            searchData = {
                ...searchCondition,
                department_id: undefined,
                category_node_id: undefined,
                info_system_id: selectedTreeNode.id,
            }
        } else {
            searchData = {
                ...searchCondition,
                category_node_id: selectedTreeNode.id,
                department_id: undefined,
                info_system_id: undefined,
            }
        }
        return searchData
    }

    useEffect(() => {
        if (selectedTreeNode?.id) {
            setInitSearch(false)
        }
        setSearchCondition({
            ...searchCondition,
            current: initSearchCondition.current,
        })
    }, [selectedTreeNode])

    useEffect(() => {
        if (!initSearch) {
            run(searchCondition)
        }
    }, [activeKey])

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
        setTabItemsData((pre) =>
            hasDataOperRole
                ? pre
                : pre.filter((o) => o.key !== EditResourcesType.AllResources),
        )
        const curKey: any = hasDataOperRole
            ? EditResourcesType.AllResources
            : EditResourcesType.Edited
        departmentKeyChange?.(curKey)
        setActiveKey(curKey)
    }, [hasDataOperRole])

    useEffect(() => {
        // 展开/收起查询条件高度
        const defalutHeight: number = !searchIsExpansion
            ? tableResourcesListType !== TableResourcesListType.ResourcesList
                ? 246
                : 276
            : tableResourcesListType !== TableResourcesListType.ResourcesList
            ? 382
            : 462
        // 已选搜索条件高度
        const searchConditionHeight: number = hasSearchCondition ? 41 : 0
        const height = defalutHeight + searchConditionHeight

        setTableHeight(height)
    }, [hasSearchCondition, searchIsExpansion])

    useEffect(() => {
        if (selectedTreeNode.id) {
            const searchData: any = spliceParams()
            run(searchData)
        } else {
            run(searchCondition)
        }
    }, [])

    // 获取目录列表
    const getCatlgList = async (params) => {
        try {
            setLoading(true)
            const {
                current,
                pageSize,
                onChange,
                changePageSize,
                changeCurrent,
                total,
                totalPage,
                ...rest
            } = params
            const obj = {
                ...rest,
                offset: current,
                limit: pageSize,
                subject_show: true,
                // subject_show:
                //     tableResourcesListType ===
                //         TableResourcesListType.ResourcesBackList ||
                //     tableResourcesListType ===
                //         TableResourcesListType.ResourceEvaluation,
                status_show: true,
                explore_show:
                    tableResourcesListType ===
                    TableResourcesListType.ResourceEvaluation
                        ? true
                        : undefined,
                user_department:
                    tableResourcesListType ===
                        TableResourcesListType.ResourcesList ||
                    tableResourcesListType ===
                        TableResourcesListType.DepartmentResourceDir
                        ? true
                        : activeKey !== EditResourcesType.AllResources ||
                          undefined,
                mount_type:
                    tableResourcesListType ===
                        TableResourcesListType.ResourceEvaluation ||
                    tableResourcesListType ===
                        TableResourcesListType.DepartmentResourceDir
                        ? 'view_count'
                        : params?.mount_type,
                online_status:
                    tableResourcesListType ===
                        TableResourcesListType.ResourceEvaluation ||
                    tableResourcesListType ===
                        TableResourcesListType.DepartmentResourceDir
                        ? onlinedList.join(',')
                        : params?.online_status,
                resource_negative_list:
                    tableResourcesListType ===
                    TableResourcesListType.ResourcesBackList
                        ? true
                        : undefined,
            }
            const res = await getCurOrgEditRescCatlgList(obj)
            return { total: res.total_count, list: res.entries }
        } catch (error) {
            formatError(error)
            return { total: 0, list: [] }
        } finally {
            setLoading(false)
            setSelectedSort(undefined)
            setInitSearch(false)
        }
    }

    const { tableProps, run, pagination } = useAntdTable(getCatlgList, {
        defaultPageSize: 10,
        manual: true,
    })

    useEffect(() => {
        if (!initSearch) {
            const searchData: any = spliceParams()
            run(searchData)
        }
    }, [searchCondition])

    useEffect(() => {
        if (!initSearch) {
            setSearchCondition({
                ...pagination,
                ...searchCondition,
                current: initSearchCondition.current,
            })
        }
    }, [treeType])

    // 点击目录项
    const [curCatlg, setCurCatlg] = useState<IRescItem>()

    const handleOperate = async (op: OperateType, item: IRescItem) => {
        setCurrentOpsType(op)
        setCurCatlg(item)
        if (op === OperateType.DETAIL) {
            const backUrl =
                tableResourcesListType ===
                TableResourcesListType.ResourcesBackList
                    ? '/resourceBlacklist'
                    : tableResourcesListType ===
                      TableResourcesListType.ResourceEvaluation
                    ? '/dataReliabilityEvaluation'
                    : ''
            const url = `/dataService/dirContent?catlgId=${
                item.id
            }&activeTabKey=${treeType}&treeNodeId=${selectedTreeNode.id}&name=${
                item.name
            }&resourcesType=${item.resource_type}&isResourcesList=${
                tableResourcesListType ===
                    TableResourcesListType.ResourcesBackList || ''
            }&${
                tableResourcesListType ===
                TableResourcesListType.ResourceEvaluation
                    ? 'targetTab=evaluation'
                    : ''
            }&backUrl=${backUrl}`
            // 本部门数据资源目录使用新窗口打开，需要特殊处理路由：跳转到 drmb 平台，返回时跳转回 cd 平台
            if (
                tableResourcesListType ===
                TableResourcesListType.DepartmentResourceDir
            ) {
                // 获取当前页面的完整路径作为返回地址
                const currentPath = window.location.pathname
                const currentSearch = window.location.search
                const currentFullPath = `${currentPath}${currentSearch}`

                // 从当前路径中提取平台前缀和平台标识
                const pathMatch = currentPath.match(
                    /^\/([^/]+)\/(drmb|drmp|ca|cd)(\/.*)?$/,
                )
                const platformPrefix = pathMatch
                    ? `/${pathMatch[1]}`
                    : '/anyfabric' // 默认使用 anyfabric
                const currentPlatform = pathMatch ? pathMatch[2] : 'cd' // 默认使用 cd

                // 构建返回 URL：确保是 cd 平台的路径
                let backUrlForCd = currentFullPath
                if (pathMatch) {
                    // 如果当前路径已包含平台前缀，替换为 cd 平台
                    backUrlForCd = currentFullPath.replace(
                        new RegExp(`^${platformPrefix}/(drmb|drmp|ca|cd)`),
                        `${platformPrefix}/cd`,
                    )
                } else {
                    // 如果当前路径没有平台前缀，添加 cd 平台前缀
                    backUrlForCd = `${platformPrefix}/cd${currentFullPath}`
                }
                // 重新构建 URL，替换 backUrl 参数为 cd 平台的返回地址
                const baseUrl = url.split('&backUrl=')[0]
                const jumpUrl = `${platformPrefix}/drmb${baseUrl}&backUrl=${encodeURIComponent(
                    backUrlForCd,
                )}`
                window.open(jumpUrl, '_blank')
            } else {
                window.open(getActualUrl(url), '_self')
            }
        } else if (op === OperateType.DELETE) {
            setDelVisible(true)
        } else if (op === OperateType.EDIT) {
            const isEmptyCatalog = !item?.resource?.length
            const url = `/dataService/AddResourcesDirList?id=${
                item.id
            }&draftId=${
                item.draft_id !== '0' && item.draft_id ? item.draft_id : ''
            }&isEmptyCatalogEdit=${isEmptyCatalog}&type=edit&originPublishStatus=${
                item.publish_status
            }&isImport=${item.is_import}`
            navigator(url)
            // window.open(getActualUrl(url), '_self')
        } else if (op === OperateType.REVOCATION) {
            confirm({
                title: __('确认要撤销审核吗？'),
                icon: <InfoCircleFilled style={{ color: '#1890ff' }} />,
                okText: __('确定'),
                cancelText: __('取消'),
                okButtonProps: { loading: cancelLoad },
                onOk() {
                    handleAuditCancel(item)
                },
            })
        } else if (op === OperateType.REPORT) {
            const url = `/dataComprehensionContent?mode=edit&originType=edited&cid=${item?.id}&tab=canvas&backUrl=/dataService/dataContent`
            // navigator(url)
            window.open(getActualUrl(url), '_self')
        }
    }

    // 表格排序改变
    const handleTableChange = (sorter) => {
        if (sorter.column) {
            if (sorter.columnKey === 'updated_at') {
                setTableSort({
                    updatedAt: sorter.order || 'ascend',
                    name: null,
                })
            } else {
                setTableSort({
                    updatedAt: null,
                    name: sorter.order || 'ascend',
                })
            }
            return {
                key: sorter.columnKey === 'title' ? 'name' : sorter.columnKey,
                sort:
                    sorter.order === 'ascend'
                        ? SortDirection.ASC
                        : SortDirection.DESC,
            }
        }
        if (searchCondition.sort === 'updated_at') {
            if (searchCondition.direction === SortDirection.ASC) {
                setTableSort({
                    updatedAt: 'descend',
                    name: null,
                })
            } else {
                setTableSort({
                    updatedAt: 'ascend',
                    name: null,
                })
            }
        } else if (searchCondition.sort === SortDirection.ASC) {
            setTableSort({
                updatedAt: null,
                name: 'descend',
            })
        } else {
            setTableSort({
                updatedAt: null,
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

    const columns: any = [
        {
            title: (
                <div>
                    <span>{__('数据资源目录名称')}</span>
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
            width: 300,
            render: (text, record) => {
                const publishAuding = publishAudingAndRejectList
                    ?.map((o) => o.value)
                    .includes(record.publish_status)
                const onlineStatus = onLineAudingAndRejectList
                    .map((o) => o.value)
                    .includes(record?.online_status)
                const comprehensionAuding = [
                    comprehensionStatus.ComprehensionAuditing,
                    comprehensionStatus.ComprehensionReject,
                ].includes(record?.report_status)
                const hasTag =
                    record?.draft_id !== '0' ||
                    publishAuding ||
                    onlineStatus ||
                    comprehensionAuding
                const showMsg =
                    record?.audit_advice &&
                    (onlinedRejectList.includes(record?.online_status) ||
                        publishedRejectList.includes(record?.publish_status))
                const title = `${__('审核未通过理由')}：${record?.audit_advice}`
                return (
                    <div className={styles.catlgName}>
                        <AppDataContentColored className={styles.nameIcon} />
                        <div className={styles.catlgNameCont}>
                            <div
                                title={text}
                                className={classnames(
                                    styles.names,
                                    styles.editedCatlg,
                                )}
                            >
                                <span
                                    onClick={() =>
                                        handleOperate(
                                            OperateType.DETAIL,
                                            record,
                                        )
                                    }
                                    className={classnames(
                                        styles.namesText,
                                        hasTag && styles.draftName,
                                    )}
                                >
                                    {text || '--'}
                                </span>
                                <span className={styles.state}>
                                    {publishAuding
                                        ? getAuditingLabel(
                                              record.publish_status,
                                          )
                                        : onlineStatus
                                        ? getAuditingLabel(
                                              record.online_status,
                                              onLineAudingAndRejectList,
                                          )
                                        : record?.draft_id !== '0'
                                        ? getContentState('draft')
                                        : ''}
                                    {comprehensionAuding
                                        ? getAuditingLabel(
                                              record.report_status,
                                              [
                                                  {
                                                      label: __('理解审核中'),
                                                      value: comprehensionStatus.ComprehensionAuditing,
                                                      bgColor:
                                                          'rgba(24, 144, 255, 0.08)',
                                                      color: 'rgba(24, 144, 255, 1)',
                                                  },
                                                  {
                                                      label: __('理解未通过'),
                                                      value: comprehensionStatus.ComprehensionReject,
                                                      bgColor:
                                                          'rgba(230, 0, 19, 0.08)',
                                                      color: 'rgba(230, 0, 19, 1)',
                                                  },
                                              ],
                                          )
                                        : null}
                                    {showMsg && (
                                        <Tooltip
                                            title={title}
                                            placement="bottom"
                                        >
                                            <FontIcon
                                                name="icon-shenheyijian"
                                                type={IconType.COLOREDICON}
                                                className={styles.icon}
                                                style={{
                                                    fontSize: 16,
                                                    marginLeft: 4,
                                                }}
                                            />
                                        </Tooltip>
                                    )}
                                </span>
                            </div>
                            <div className={styles.code} title={record.code}>
                                {record.code}
                            </div>
                        </div>
                    </div>
                )
            },
        },
        {
            title: __('共享属性'),
            dataIndex: 'shared_type',
            key: 'shared_type',
            ellipsis: true,
            render: (text, record) =>
                shareTypeList.find((o) => o.value === text)?.label || '--',
        },
        {
            title: __('任务监控'),
            dataIndex: 'data_aggregation_status',
            key: 'data_aggregation_status',
            ellipsis: true,
            width: 280,
            render: (text, record) => {
                return renderTaskStatus(record)
            },
        },
        {
            title: __('可信度评估'),
            dataIndex: 'completeness_score',
            key: 'completeness_score',
            ellipsis: true,
            width: 240,
            render: (text, record) => {
                const scoreConfig = [
                    {
                        label: __('完整性'),
                        value: record.completeness_score,
                    },
                    {
                        label: __('及时性'),
                        value: record.timeliness_score,
                    },
                    {
                        label: __('准确性'),
                        value: record.accuracy_score,
                    },
                ]
                return (
                    <div className={styles.tableScoreList}>
                        {scoreConfig.map((item) => (
                            <ScoreText name={item.label} score={item.value} />
                        ))}
                    </div>
                )
            },
        },
        {
            title: __('所属业务对象'),
            dataIndex: 'subject_info',
            key: 'subject_info',
            ellipsis: true,
            render: (text, record) => {
                const list = record?.subject_info?.map((o) => ({
                    ...o,
                    name: o.subject,
                }))
                if (!list || !list?.length) return '--'
                const moreCount = toNumber((list?.length || 1) - 1)
                return (
                    <div className={styles.relateRescWrapper}>
                        <span
                            title={list[0].name}
                            className={styles.firstRelCatlgName}
                        >
                            {list[0].name}
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
                                            <span className={styles.link}>
                                                {item?.name || '--'}
                                            </span>
                                        </>
                                    )
                                })}
                            >
                                <span
                                    className={styles.firstRelCatlgName}
                                    style={{
                                        color: '#126EE3',
                                        flexShrink: '0',
                                    }}
                                >{`+${moreCount}`}</span>
                            </Tooltip>
                        )}
                    </div>
                )
            },
        },
        {
            title: __('资源类型'),
            dataIndex: 'resource_type',
            key: 'resource_type',
            ellipsis: true,
            render: (text, record) => {
                const list = record?.resource?.map((o) => ({
                    ...o,
                    name:
                        resourceTypeList?.find(
                            (item) => item.value === o?.resource_type,
                        )?.label || '--',
                }))
                if (!list || !list?.length) return '--'
                const moreCount = toNumber((list?.length || 1) - 1)
                return (
                    <div className={styles.relateRescWrapper}>
                        <span className={styles.firstRelCatlgName}>
                            {`${list[0].name} ${list[0].resource_count}`}
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
                                            <span className={styles.link}>
                                                {`${item?.name} ${item?.resource_count}` ||
                                                    '--'}
                                            </span>
                                        </>
                                    )
                                })}
                            >
                                <span
                                    className={styles.firstRelCatlgName}
                                    style={{
                                        color: '#126EE3',
                                        flexShrink: '0',
                                    }}
                                >{`+${moreCount}`}</span>
                            </Tooltip>
                        )}
                    </div>
                )
            },
        },
        {
            title: __('目录提供方'),
            dataIndex: 'department',
            key: 'department',
            ellipsis: true,
            render: (text, record) => {
                return (
                    <div
                        className={styles.departmentName}
                        title={record?.department_path}
                    >
                        {/* {getDepartmentName(record) || '--'} */}
                        {text || '--'}
                    </div>
                )
            },
        },
        {
            // title: (
            //     <span>
            //         <span>{__('理解报告')}</span>
            //         <Tooltip
            //             title={__(
            //                 '目录挂接库表，需要生成理解报告，才能发起上线',
            //             )}
            //             placement="bottom"
            //         >
            //             <QuestionCircleOutlined />
            //         </Tooltip>
            //     </span>
            // ),
            title: __('理解报告状态'),
            dataIndex: 'report_status',
            key: 'report_status',
            ellipsis: true,
            width: 160,
            render: (text, record) => <UndsLabel type={text || 1} noSubType />,
        },
        {
            title: __('发布状态'),
            dataIndex: 'publish_status',
            key: 'publish_status',
            ellipsis: true,
            render: (text, record) => {
                return (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {getState(
                            publishedList.includes(text)
                                ? publishStatus.Published
                                : publishStatus.Unpublished,
                            publishStatusList,
                        )}
                    </div>
                )
            },
        },
        {
            title: __('上线状态'),
            dataIndex: 'online_status',
            key: 'online_status',
            ellipsis: true,
            render: (text, record) => {
                return (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {getState(
                            onlinedList.includes(text)
                                ? onLineStatus.Online
                                : OfflinedList.includes(text)
                                ? onLineStatus.Offline
                                : onLineStatus.UnOnline,
                            onLineStatusList,
                        )}
                    </div>
                )
            },
        },
        {
            title: __('更新时间'),
            dataIndex: 'updated_at',
            key: 'updated_at',
            ellipsis: true,
            width: 180,
            sorter: true,
            sortOrder: tableSort.updatedAt,
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
            width:
                tableResourcesListType !== TableResourcesListType.ResourcesList
                    ? 60
                    : 260,
            // : 150,
            fixed: FixedType.RIGHT,
            render: (_: string, record) => {
                const offline = [
                    onLineStatus.UnOnline,
                    onLineStatus.OnlineAuditingReject,
                    onLineStatus.Offline,
                    onLineStatus.OfflinelineReject,
                ]
                const allowOffline = [
                    onLineStatus.Online,
                    onLineStatus.OfflineReject,
                ]
                // 已发布
                const published =
                    record.publish_status === publishStatus.Published ||
                    record.publish_status === publishStatus.ChangeReject
                const isAllowEdit =
                    !publishAuditing.includes(record.publish_status) &&
                    !onlineAuditing.includes(record.online_status)
                const isAllowDelete = upPublish.includes(record.publish_status)
                //  || offline.includes(record.online_status)) &&
                // record.publish_status !== publishStatus.PublishedAuditing
                const isAllowOnline =
                    offline.includes(record.online_status) && published
                const isAllowOffline =
                    (record.online_status === onLineStatus.Online ||
                        record.online_status === onLineStatus.OfflineReject) &&
                    published
                const isCancelAudit =
                    onlineAuditing.includes(record.online_status) ||
                    publishAuditing.includes(record.publish_status)
                const isDataViewResource = !!record?.resource?.find(
                    (o) => o.resource_type === ResourceType.DataView,
                )
                const showComprehension =
                    published &&
                    isDataViewResource &&
                    [
                        comprehensionReportStatus.not_generated,
                        comprehensionReportStatus.refuse,
                    ].includes(record.report_status)
                const onlinDisabledText =
                    record.publish_flag === 0
                        ? __('该编目内容不可上线到超市')
                        : // : isDataViewResource &&
                        //   [
                        //       comprehensionReportStatus.not_generated,
                        //       // comprehensionReportStatus.generateding,
                        //   ].includes(record.report_status)
                        // ? __('待理解报告生成后，再发起上线')
                        record.publish_status === publishStatus.ChangeReject
                        ? __('变更通过或恢复到已发布版本之后，可上线此目录')
                        : ''
                const btnList: any[] =
                    tableResourcesListType !==
                    TableResourcesListType.ResourcesList
                        ? [
                              {
                                  key: OperateType.DETAIL,
                                  label: __('详情'),
                                  show: true,
                                  tooltipOpen: false,
                              },
                          ]
                        : [
                              {
                                  key: OperateType.DETAIL,
                                  label: __('详情'),
                                  show: true,
                                  tooltipOpen: false,
                              },
                              {
                                  key: OperateType.REPORT,
                                  label: __('理解'),
                                  show: showComprehension,
                                  tooltipOpen: false,
                              },
                              {
                                  key: OperateType.ONLINE,
                                  label: __('上线'),
                                  show: isAllowOnline,
                                  // 编目未选择上线到服务超市，禁用上线功能
                                  disabled: !!onlinDisabledText,
                                  disabledText: onlinDisabledText,
                                  popconfirmTips: __(
                                      '确定要将资源上线到"数据服务超市"吗？',
                                  ),
                              },
                              {
                                  key: OperateType.EDIT,
                                  label: published ? __('变更') : __('编辑'),
                                  show: isAllowEdit,
                              },
                              {
                                  key: OperateType.OFFLINE,
                                  label: __('下线'),
                                  show: isAllowOffline,
                                  popconfirmTips: __(
                                      '确定要将资源从"数据服务超市"下线吗？',
                                  ),
                              },
                              //   {
                              //       key: OperateType.REVOCATION,
                              //       label: __('撤回'),
                              //       show: isCancelAudit,
                              //   },
                              {
                                  key: OperateType.DELETE,
                                  label: __('删除'),
                                  show: isAllowDelete,
                              },
                          ]
                return (
                    <Space size={16} className={styles.oprColumn}>
                        {btnList
                            .filter((item) => item.show)
                            .map((item) => {
                                return (
                                    <Popconfirm
                                        title={item.popconfirmTips}
                                        okText={__('确定')}
                                        cancelText={__('取消')}
                                        onConfirm={() => {
                                            handleOnline(record, item.key)
                                        }}
                                        placement="bottomLeft"
                                        overlayInnerStyle={{
                                            whiteSpace: 'nowrap',
                                        }}
                                        icon={
                                            <InfoCircleFilled
                                                style={{
                                                    color: '#3A8FF0',
                                                    fontSize: '16px',
                                                }}
                                            />
                                        }
                                        disabled={
                                            !item.popconfirmTips ||
                                            item.disabled ||
                                            !!item.disabledText
                                        }
                                        overlayClassName={styles.popconfirmTips}
                                    >
                                        <Tooltip
                                            title={
                                                item.disabledText ||
                                                (item.disabled
                                                    ? __(
                                                          '该编目内容不可上线到超市',
                                                      )
                                                    : '')
                                            }
                                        >
                                            <Button
                                                type="link"
                                                key={item.key}
                                                disabled={
                                                    item.disabled ||
                                                    !!item.disabledText
                                                }
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    if (!item.popconfirmTips) {
                                                        handleOperate(
                                                            item.key,
                                                            record,
                                                        )
                                                    }
                                                }}
                                            >
                                                {item.label}
                                            </Button>
                                        </Tooltip>
                                    </Popconfirm>
                                )
                            })}
                    </Space>
                )
            },
        },
    ]

    // 筛选顺序变化
    const handleMenuChange = (selectedMenu) => {
        setSearchCondition({
            ...searchCondition,
            sort: selectedMenu.key,
            direction: selectedMenu.sort,
            current: 1,
        })
        setSelectedSort(selectedMenu)
        onChangeMenuToTableSort(selectedMenu)
    }

    const onChangeMenuToTableSort = (selectedMenu) => {
        switch (selectedMenu.key) {
            case 'name':
                setTableSort({
                    name:
                        selectedMenu.sort === SortDirection.ASC
                            ? 'ascend'
                            : 'descend',
                    updatedAt: null,
                })
                break
            case 'updated_at':
                setTableSort({
                    name: null,
                    updatedAt:
                        selectedMenu.sort === SortDirection.ASC
                            ? 'ascend'
                            : 'descend',
                })
                break
            default:
                setTableSort({
                    name: null,
                    updatedAt: null,
                })
                break
        }
    }

    const renderEmpty = () => {
        return <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
    }

    const handleDelete = async () => {
        try {
            setDelBtnLoading(true)
            if (!curCatlg) return
            await delRescCatlg(curCatlg.id)
            message.success(__('删除成功'))
            updateResourcesSum()
            setSearchCondition({
                ...searchCondition,
                current: initSearchCondition.current,
            })
        } catch (e) {
            formatError(e)
        } finally {
            setDelBtnLoading(false)
            setDelVisible(false)
        }
    }

    // 1：上线、3：下线、4：发布
    const handleOnline = async (data: any, type: OperateType) => {
        const text =
            type === OperateType.ONLINE
                ? __('上线')
                : type === OperateType.OFFLINE
                ? __('下线')
                : __('发布')
        try {
            const flowType =
                type === OperateType.ONLINE
                    ? 'af-data-catalog-online'
                    : type === OperateType.OFFLINE
                    ? 'af-data-catalog-offline'
                    : 'af-data-catalog-publish'

            await createAuditFlow({
                catalogID: data?.id,
                flowType,
            })
            message.success(__('操作成功'))
            setSearchCondition({
                ...searchCondition,
                current: initSearchCondition.current,
            })
        } catch (error) {
            if (
                error?.data?.code === 'DataCatalog.Public.NoAuditDefFoundError'
            ) {
                message.error({
                    content: __('审核发起失败，未找到匹配的审核流程'),
                    duration: 5,
                })
            } else if (
                error?.data?.code ===
                'DataCatalog.Public.ConfigCenterDepOwnerUsersRequestErr'
            ) {
                message.info({
                    content: `${text}${__('失败，部门不存在')}`,
                })
            } else {
                formatError(error)
            }
        } finally {
            setOnlineVisible(false)
        }
    }

    const toAdd = () => {
        // window.open(
        //     getActualUrl(`/dataService/AddResourcesDirList?type=create`),
        //     '_self',
        // )
        navigator(
            `/dataService/AddResourcesDirList?type=create&orgNodeId=${
                selectedTreeNode.cate_id === SystemCategory.Organization
                    ? selectedTreeNode.id
                    : ''
            }`,
        )
    }

    const toImprot = () => {
        // window.open(getActualUrl(`/dataService/importResourcesDir`), '_self')
        navigator(`/dataService/importResourcesDir`)
    }

    // 撤销审核
    const handleAuditCancel = async (item: any) => {
        if (!item) return
        try {
            setCancelLoad(true)

            // await tagAuditCancel({
            //     id: item.id,
            //     audit_type: auditTypeMap[item.audit_status],
            // })
            message.success(__('撤销成功'))
            run(searchCondition)
        } catch (err) {
            formatError(err)
        } finally {
            setCancelLoad(false)
        }
    }

    return (
        <div
            className={classnames(
                styles.catlgResourceWrapper,
                tableResourcesListType !==
                    TableResourcesListType.ResourcesList &&
                    styles.resourcesListWrapper,
                tableResourcesListType ===
                    TableResourcesListType.ResourceEvaluation &&
                    styles.resourceEvaluationWrapper,
            )}
        >
            {tableResourcesListType ===
                TableResourcesListType.ResourcesBackList && (
                <Tabs
                    activeKey={activeKey}
                    onChange={(key) => {
                        departmentKeyChange?.(key)
                        setActiveKey(key as EditResourcesType)
                    }}
                    items={tabItemsData}
                    className={styles.catlgTabs}
                />
            )}
            <SearchLayout
                ref={searchFormRef}
                prefixNode={
                    // tableResourcesListType ===
                    // TableResourcesListType.ResourcesBackList ? (
                    //     __('资产负面清单')
                    tableResourcesListType ===
                    TableResourcesListType.ResourceEvaluation
                        ? __('资源可信度评估')
                        : tableResourcesListType ===
                              TableResourcesListType.ResourcesList && (
                              <Space size={16}>
                                  <Button type="primary" onClick={toAdd}>
                                      {__('新增')}
                                  </Button>
                                  {/* <Button
                                      type="default"
                                      icon={
                                          <FontIcon
                                              name="icon-daoru"
                                              style={{
                                                  fontSize: 14,
                                                  marginRight: 8,
                                              }}
                                          />
                                      }
                                      onClick={toImprot}
                                  >
                                      {__('导入')}
                                  </Button> */}
                              </Space>
                          )
                }
                formData={
                    tableResourcesListType ===
                    TableResourcesListType.ResourceEvaluation
                        ? searchFormData.filter(
                              (o) =>
                                  o.key !== 'online_status' &&
                                  o.key !== 'publish_status',
                          )
                        : tableResourcesListType ===
                          TableResourcesListType.DepartmentResourceDir
                        ? searchFormData.filter(
                              (o) =>
                                  o.key !== 'online_status' &&
                                  o.key !== 'publish_status' &&
                                  o.key !== 'mount_type',
                          )
                        : tableResourcesListType !==
                          TableResourcesListType.ResourcesList
                        ? searchFormData.filter((o) => o.key !== 'mount_type')
                        : searchFormData
                }
                onSearch={(object, isRefresh) => {
                    const obj = timeStrToTimestamp(object)
                    const params = {
                        ...searchCondition,
                        ...obj,
                        current: isRefresh ? searchCondition.current : 1,
                    }
                    setSearchCondition(params)
                }}
                suffixNode={
                    <SortBtn
                        contentNode={
                            <DropDownFilter
                                menus={editedMenus}
                                defaultMenu={editedDefaultMenu}
                                menuChangeCb={handleMenuChange}
                                changeMenu={selectedSort}
                            />
                        }
                    />
                }
                getExpansionStatus={setSearchIsExpansion}
            />
            {loading ? (
                <Loader />
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
                                !searchIsExpansion && styles.isExpansion,
                            )}
                            rowClassName={styles.tableRow}
                            columns={columns.filter((o) =>
                                tableResourcesListType ===
                                TableResourcesListType.ResourcesBackList
                                    ? !resourcesListExcludeKeys.includes(o.key)
                                    : tableResourcesListType ===
                                      TableResourcesListType.ResourceEvaluation
                                    ? !resourceEvaluationExcludeKeys.includes(
                                          o.key,
                                      )
                                    : tableResourcesListType ===
                                      TableResourcesListType.DepartmentResourceDir
                                    ? !departmentResourceDirExcludeKeys.includes(
                                          o.key,
                                      )
                                    : !resourcesDirExcludeKeys.includes(o.key),
                            )}
                            {...tableProps}
                            rowKey="id"
                            scroll={{
                                x: 1620,
                                y:
                                    tableProps.dataSource.length === 0
                                        ? undefined
                                        : `calc(100vh - ${tableHeight}px)`,
                            }}
                            pagination={{
                                ...tableProps.pagination,
                                hideOnSinglePage: tableProps.total <= 10,
                                showQuickJumper: true,
                                showSizeChanger: true,
                                showTotal: (count) =>
                                    __('共${count}条', { count }),
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
                                    current: newPagination.current || 1,
                                    pageSize: newPagination.pageSize || 10,
                                }))
                            }}
                        />
                    )}
                </div>
            )}
            <Confirm
                open={delVisible}
                title={__('确认要删除吗？')}
                content={__('数据资源目录删除后，将无法找回，请谨慎操作！')}
                onOk={handleDelete}
                onCancel={() => {
                    setDelVisible(false)
                }}
                width={432}
                okButtonProps={{ loading: delBtnLoading }}
            />
        </div>
    )
}

export default ResourcesEdited
