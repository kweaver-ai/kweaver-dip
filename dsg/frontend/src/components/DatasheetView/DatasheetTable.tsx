import { Button, message, Popconfirm, Space, Tooltip } from 'antd'
import {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from 'react'

import {
    ExclamationCircleFilled,
    InfoCircleFilled,
    ScanOutlined,
} from '@ant-design/icons'
import { SortOrder } from 'antd/lib/table/interface'
import classnames from 'classnames'
import { keys, omit } from 'lodash'
import moment from 'moment'
import { useLocation, useNavigate } from 'react-router-dom'
import dataEmpty from '@/assets/dataEmpty.svg'
import { DataSourceOrigin } from '@/components/DataSource/helper'
import SearchLayout from '@/components/SearchLayout'
import {
    createdDataViewAudit,
    DataViewAuditType,
    DataViewRevokeType,
    delDatasheetView,
    deleteSelectViewRequest,
    formatError,
    getAuditProcessFromConfCenter,
    getDataPrivacyPolicyRelateFormView,
    getDatasheetView,
    getDataViewDatasouces,
    getUserListByPermission,
    getWhiteListRelateFormView,
    IDatasheetView,
    IDataSourceInfo,
    LogicViewType,
    LoginPlatform,
    revokeDataViewAudit,
    scanDatasource,
    SortDirection,
    TaskExecutableStatus,
    getDatasheetPublishedView,
    TaskStatus,
} from '@/core'
import { databaseTypesEleData } from '@/core/dataSource'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import { useGradeLabelState } from '@/hooks/useGradeLabelState'
import { AddOutlined, AvatarOutlined, FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import { Empty, Loader } from '@/ui'
import {
    getPlatformNumber,
    getSource,
    OperateType,
    useQuery,
    isSemanticGovernanceApp,
} from '@/utils'
import { confirm } from '@/utils/modalHelper'
import MyTaskDrawer from '../AssetCenterHeader/MyTaskDrawer'
import { BusinessDomainType } from '../BusinessDomain/const'
import { GlossaryIcon } from '../BusinessDomain/GlossaryIcons'
import CommonTable from '../CommonTable'
import { FixedType } from '../CommonTable/const'
import Confirm from '../Confirm'
import DropDownFilter from '../DropDownFilter'
import OwnerDisplay from '../OwnerDisplay'
import { ModuleType } from '../SceneAnalysis/const'
import { SortBtn } from '../ToolbarComponents'
import {
    AuditOperateMsg,
    defaultMenu,
    DsType,
    evaluationStatusList,
    explorationStatus,
    menus,
    onLineStatus,
    onLineStatusList,
    onLineStatusTitle,
    publishStatus,
    scanType,
    stateType,
} from './const'
import DatasourceExploration from './DatasourceExploration'
import { ExplorationType } from './DatasourceExploration/const'
import { useDataViewContext } from './DataViewProvider'
import {
    auditTipsModal,
    cancelScanVisible,
    getContentState,
    getExploreContent,
    getState,
    searchFormData,
    showMessage,
    showSuccessMessage,
    timeStrToTimestamp,
} from './helper'
import __ from './locale'
import ScanConfirm from './ScanConfirm'
import ScanModal from './ScanModal'
import styles from './styles.module.less'

interface IDatasheetTable {
    dataType?: DsType
    getTableEmptyFlag?: (flag: boolean) => void
    getTableList?: (data: any) => void
    // 任务中心 'task'
    type?: string
    // 任务当前任务信息
    taskInfo?: any
    datasourceData?: any[]
    selectedDatasources?: any
    // 库表类型
    logicType?: LogicViewType
    // 业务对象信息
    subDomainData?: any
    selectedNode?: any
}

const DatasheetTable = forwardRef((props: IDatasheetTable, ref) => {
    const {
        dataType,
        type,
        taskInfo,
        getTableEmptyFlag,
        getTableList,
        datasourceData,
        selectedDatasources,
        logicType = LogicViewType.DataSource,
        selectedNode,
        subDomainData,
    } = props
    const navigator = useNavigate()
    const {
        auditProcessStatus,
        setAuditProcessStatus,
        explorationData,
        setExplorationData,
        hasExcelDataView,
        setHasExcelDataView,
        isValueEvaluation,
    } = useDataViewContext()
    const query = useQuery()
    const backUrl = query.get('backUrl') || ''
    const taskId = query.get('taskId') || undefined
    const projectId = query.get('projectId') || undefined
    const datasourceTab = query.get('tab') || ''
    // 库表编码
    const viewCode = query.get('viewCode') || ''
    const { pathname } = useLocation()
    const [isGradeOpen] = useGradeLabelState()
    const [{ using }, updateUsing] = useGeneralConfig()

    const commonTableRef: any = useRef()
    const searchRef: any = useRef()
    // semanticGovernance 专用
    const isSemanticGovernance = isSemanticGovernanceApp()
    const [searchIsExpansion, setSearchIsExpansion] = useState<boolean>(false)
    const [moreExpansionStatus, setMoreExpansionStatus] =
        useState<boolean>(false)

    // 创建表头排序
    const [tableSort, setTableSort] = useState<{
        [key: string]: SortOrder
    }>({
        name: null,
        business_name: null,
        created_at: null,
        updated_at: 'descend',
        type: null,
    })

    const initSearchCondition: IDatasheetView = {
        offset: 1,
        limit: 10,
        direction: SortDirection.DESC,
        sort: 'updated_at',
        task_id: taskId,
        project_id: projectId,
        type: logicType,
        include_sub_department: true,
        datasource_source_type: isValueEvaluation
            ? DataSourceOrigin.INFOSYS
            : undefined,
    }

    // 排序
    const [selectedSort, setSelectedSort] = useState<any>(defaultMenu)

    // 删除弹框显示,【true】显示,【false】隐藏
    const [delVisible, setDelVisible] = useState<boolean>(false)
    const [delConfirmVisible, setDelConfirmVisible] = useState<boolean>(false)
    // 删除目录loading
    const [delBtnLoading, setDelBtnLoading] = useState<boolean>(false)
    const [isEmpty, setIsEmpty] = useState<boolean>(false)
    const [showSearch, setShowSearch] = useState<boolean>(false)
    const [listEmpty, setListEmpty] = useState<boolean>(true)
    const [datasourceEmpty, setDatasourceEmpty] = useState<boolean>(false)
    const [myTaskOpen, setMytaskOpen] = useState<boolean>(false)

    const [searchCondition, setSearchCondition] = useState<IDatasheetView>({
        ...initSearchCondition,
        type: logicType,
        keyword: viewCode || '',
    })

    // 多选项
    const [selectedIds, setSelectedIds] = useState<any[]>([])
    const [formData, setFormData] = useState<any[]>(
        viewCode
            ? searchFormData.map((fItem) => {
                  if (fItem.key === 'keyword') {
                      return {
                          ...fItem,
                          itemProps: {
                              ...fItem.itemProps,
                              value: viewCode,
                          },
                          value: viewCode,
                      }
                  }
                  return fItem
              })
            : searchFormData,
    )

    // 点击目录项
    const [curDatasheet, setCurDatasheet] = useState<IDataSourceInfo>()

    const [showTaskScanBtn, setShowTaskScanBtn] = useState<boolean>(false)
    const [tableHeight, setTableHeight] = useState<number>(0)
    const [scanModalOpen, setScanModalOpen] = useState<boolean>(false)
    const [scanModalType, setScanModalType] = useState<scanType>(scanType.init)
    const [curSum, setCurSum] = useState<number>(0)
    const [scanConfirmOpen, setScanConfirmOpen] = useState<boolean>(false)
    const [scanDatasourceData, setScanDatasourceData] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [isScaning, setIsScaning] = useState<boolean>(false)
    const [isInit, setIsInit] = useState<boolean>(true)
    const [searchDepartmentId, setSearchDepartmentId] = useState<string>()
    const [datasourceExplorationOpen, setDatasourceExplorationOpen] =
        useState<boolean>(false)
    const platform = getPlatformNumber()

    useImperativeHandle(ref, () => ({
        search,
    }))

    useEffect(() => {
        const listener = (e: any) => {
            if (!isScaning) return
            e.preventDefault()
            e.returnValue = '扫描中'
        }
        window.addEventListener('beforeunload', listener)
        return () => {
            window.removeEventListener('beforeunload', listener)
        }
    }, [isScaning])

    useEffect(() => {
        getTableEmptyFlag?.(isEmpty)
    }, [isEmpty])

    useEffect(() => {
        if (taskInfo) {
            setShowTaskScanBtn(
                taskInfo?.executable_status !==
                    TaskExecutableStatus.COMPLETED ||
                    taskInfo?.status !== TaskStatus.COMPLETED,
            )
        }
        setIsLoading(false)
        // getAllOwnerUsers()
        getAuditProcess()
    }, [])

    useEffect(() => {
        // 任务中心调用数据源接口
        if (type === 'task') {
            getDatasouces()
        } else {
            setFormData(
                formData.filter((item) => item.key !== 'datasource_ids'),
            )
        }
    }, [datasourceData])

    useEffect(() => {
        if (selectedDatasources && !isInit) {
            let { datasource_source_type } = selectedDatasources
            if (isValueEvaluation) {
                if (
                    selectedDatasources.datasource_id ||
                    selectedDatasources.info_system_id
                ) {
                    datasource_source_type = undefined
                } else if (!selectedDatasources.datasource_source_type) {
                    datasource_source_type = DataSourceOrigin.INFOSYS
                }
            }
            setSearchCondition((prev) => ({
                ...prev,
                offset: 1,
                // ...getDatasourceSearchParams(),
                ...selectedDatasources,
                department_id:
                    selectedDatasources?.department_id || searchDepartmentId,
                datasource_source_type,
            }))
        }
    }, [selectedDatasources])

    useEffect(() => {
        if (subDomainData) {
            setListEmpty(true)
            if (subDomainData.parent_id === '') {
                setSearchCondition((prev) => {
                    return { ...prev, subject_id: '', offset: 1 }
                })
            } else {
                setSearchCondition((prev) => ({
                    ...prev,
                    offset: 1,
                    subject_id: subDomainData.id,
                    include_sub_subject: true,
                }))
            }
        }
    }, [subDomainData])

    useEffect(() => {
        if (taskId) {
            setSearchCondition((prev) => ({
                ...prev,
                task_id: taskId,
                project_id: projectId,
                offset: 1,
            }))
            setIsEmpty(false)
            setShowSearch(true)
        }
    }, [taskId, projectId])

    useEffect(() => {
        const {
            sort,
            direction,
            offset,
            limit,
            datasource_id,
            datasource_type,
            task_id,
            project_id,
            keyword,
            include_sub_department,
            datasource_source_type,
            ...searchObj
        } = searchCondition || {}
        // 过滤type查询条件
        const hasSearchCondition = Object.values({
            ...searchObj,
            type: undefined,
        }).some((item) => item)

        // 超过8个查询条件，且展开了全部时的高度
        const allSearchHeight: number =
            moreExpansionStatus && searchIsExpansion ? 73 : 0
        // 展开/收起查询条件高度
        const defalutHeight: number = !searchIsExpansion ? 314 : 504
        const taskDefalutHeight: number = !searchIsExpansion ? 276 : 465
        // 已选搜索条件高度
        const searchConditionHeight: number = hasSearchCondition ? 41 : 0
        const taskSearchConditionHeight: number =
            hasSearchCondition || datasource_id ? 41 : 0
        const taskScanBtnHeight: number = showTaskScanBtn ? 43 : 0
        // 元数据库表
        const dataSourceHeight =
            defalutHeight +
            searchConditionHeight +
            (using === 1 ? 0 : allSearchHeight)
        // (platform === LoginPlatform.default ? 0 : 46)
        // 自定义库表
        const customHeight = defalutHeight + searchConditionHeight - 44
        // 逻辑实体库表
        const logicEntityHeight = defalutHeight + searchConditionHeight - 44
        // 任务管理入口
        const taskHeight =
            taskDefalutHeight +
            taskSearchConditionHeight +
            taskScanBtnHeight +
            allSearchHeight
        const valueEvaluationHeight =
            (!searchIsExpansion ? 268 : 375) + searchConditionHeight

        setTableHeight(
            isValueEvaluation
                ? valueEvaluationHeight
                : type === 'task'
                ? taskHeight
                : logicType === LogicViewType.DataSource
                ? dataSourceHeight
                : logicType === LogicViewType.Custom
                ? customHeight
                : logicEntityHeight,
        )
    }, [
        searchCondition,
        searchIsExpansion,
        showTaskScanBtn,
        moreExpansionStatus,
    ])

    const creatable = useMemo(() => {
        if (logicType === LogicViewType.LogicEntity) {
            if (
                subDomainData?.id &&
                subDomainData?.type === BusinessDomainType.logic_entity
            ) {
                return false
                // return (
                //     listEmpty &&
                //     JSON.stringify(
                //         omit(initSearchCondition, ['include_sub_subject']),
                //     ) ===
                //         JSON.stringify(
                //             omit(searchCondition, [
                //                 'subject_id',
                //                 'include_sub_subject',
                //             ]),
                //         )
                // )
            }
            return false
        }
        return true
    }, [subDomainData, listEmpty, searchCondition])

    const showCreate = useMemo(() => {
        if (logicType === LogicViewType.LogicEntity) {
            if (
                subDomainData?.id &&
                subDomainData?.type === BusinessDomainType.logic_entity
            ) {
                return true
                // return !(
                //     listEmpty &&
                //     JSON.stringify(
                //         omit(initSearchCondition, ['include_sub_subject']),
                //     ) ===
                //         JSON.stringify(
                //             omit(searchCondition, [
                //                 'subject_id',
                //                 'include_sub_subject',
                //             ]),
                //         )
                // )
            }
            return false
        }
        return creatable
    }, [searchCondition, listEmpty, subDomainData, creatable])

    const searchForm = useMemo(() => {
        const filterKeys: string[] = []
        if (isSemanticGovernance) {
            filterKeys.push('online_status_list')
        } else {
            filterKeys.push('publish_status')
        }
        if (using === 1) {
            filterKeys.push('online_status_list')
        }
        if (using === 2 || selectedDatasources?.type !== 'excel') {
            filterKeys.push('status_list')
        }
        const serForm = formData.filter(
            (item) => !filterKeys.includes(item.key),
        )
        if (isValueEvaluation) {
            return serForm.filter((item) =>
                ['keyword', 'department_id', 'times', 'updateTime'].includes(
                    item.key,
                ),
            )
        }
        if (logicType === LogicViewType.Custom) {
            return serForm.filter(
                (item) =>
                    ![
                        'status',
                        'publish_status',
                        'edit_status',
                        'status_list',
                        'datasource_ids',
                    ].includes(item.key),
            )
        }
        if (logicType === LogicViewType.LogicEntity) {
            return serForm.filter(
                (item) =>
                    ![
                        'status',
                        'publish_status',
                        'edit_status',
                        'status_list',
                        'datasource_ids',
                        'subject_id',
                    ].includes(item.key),
            )
        }
        return serForm
    }, [formData, selectedDatasources, isValueEvaluation, isSemanticGovernance])

    const emptyExcludeField = useMemo(() => {
        let field = [
            'datasource_id',
            'datasource_type',
            'excel_file_name',
            ...keys(initSearchCondition),
        ]
        if (logicType === LogicViewType.LogicEntity) {
            field = [...field, 'subject_id']
        }
        return field
    }, [logicType])

    // const getDatasourceSearchParams = (id?: string) => {
    //     // 后端datasource_id和datasource_type二选一，有id则不使用type
    //     const datasource_type =
    //         !selectedDatasources?.id ||
    //         selectedDatasources?.id !== selectedDatasources.type ||
    //         id
    //             ? undefined
    //             : selectedDatasources.type
    //     const datasource_id =
    //         datasource_type || !selectedDatasources?.id
    //             ? undefined
    //             : selectedDatasources.dataSourceId ||
    //               id ||
    //               selectedDatasources?.id
    //     const excel_file_name =
    //         selectedDatasources?.dataType === 'file'
    //             ? selectedDatasources?.title
    //             : undefined
    //     if (taskId) {
    //         return {
    //             datasource_id: id,
    //         }
    //     }
    //     return {
    //         datasource_type,
    //         datasource_id,
    //         excel_file_name,
    //     }
    // }

    const getDatasouces = async () => {
        try {
            const res = await getDataViewDatasouces({
                limit: 1000,
                task_id: taskId,
                direction: 'desc',
                sort: 'updated_at',
                datasource_source_type: isValueEvaluation
                    ? DataSourceOrigin.INFOSYS
                    : undefined,
            })
            setDatasourceEmpty(res?.entries?.length === 0)
            setFormData(
                formData.map((item) => {
                    const obj: any = { ...item }
                    if (obj.key === 'datasource_ids') {
                        obj.itemProps.options = res?.entries
                            .filter((it) => it.last_scan)
                            .map((it) => {
                                const { Colored = undefined } = it.type
                                    ? databaseTypesEleData.dataBaseIcons[
                                          it.type
                                      ]
                                    : {}
                                return {
                                    ...it,
                                    icon: <Colored />,
                                }
                            })
                    }
                    return obj
                }),
            )
        } catch (err) {
            setDatasourceEmpty(true)
        }
    }

    // 获取所有数据owner用户
    const getAllOwnerUsers = async () => {
        try {
            const res = await getUserListByPermission({
                permission_ids: ['afbcdb6c-cb85-4a0c-82ee-68c9f1465684'],
            })
            const undistributedData = {
                id: '00000000-0000-0000-0000-000000000000',
                name: __('未分配'),
            }
            const list = res?.entries ? [...res.entries] : []
            const formDataList = formData.map((item) => {
                const obj: any = { ...item }
                if (obj.key === 'owner_id') {
                    obj.itemProps.options = list.map((it) => ({
                        ...it,
                        icon: (
                            <div className={styles.avatarWrapper}>
                                <AvatarOutlined className={styles.avatarIcon} />
                            </div>
                        ),
                    }))
                }
                return obj
            })
            setFormData(
                type === 'task'
                    ? formDataList
                    : formDataList.filter(
                          (item) => item.key !== 'datasource_ids',
                      ),
            )
        } catch (error) {
            formatError(error)
        }
    }

    const handleOperate = (op: OperateType, item: any) => {
        setExplorationData({
            ...explorationData,
            dataViewId: item.id,
        })
        setCurDatasheet(item)
        let detailsUrl: string = ''
        if (backUrl) {
            detailsUrl = `${pathname}/${window.location.search}`
        }
        let url = `/datasheet-view/detail?datasourceTab=${datasourceTab}&id=${
            item.id
        }&model=${
            op === OperateType.DETAIL ? 'view' : 'edit'
        }&isCompleted=${!showTaskScanBtn}&taskId=${taskId || ''}&detailsUrl=${
            detailsUrl || null
        }&logic=${logicType}&dataSourceType=${item.datasource_type}`
        if (op === OperateType.DETAIL) {
            if (isValueEvaluation) {
                url += `&isValueEvaluation=true`
            }
            navigator(url)
        } else if (op === OperateType.DELETE) {
            setDelVisible(true)
        } else if (op === OperateType.EDIT) {
            if (logicType === LogicViewType.Custom) {
                url = `/datasheet-view/graph?operate=${OperateType.EDIT}&module=${ModuleType.CustomView}&sceneId=${item.scene_analysis_id}&viewId=${item.id}`
            } else if (logicType === LogicViewType.LogicEntity) {
                const objId = item.subject_path_id?.split('/').slice(-2)[0]
                const entityId = item.subject_path_id?.split('/').slice(-1)[0]
                url = `/datasheet-view/graph?operate=${OperateType.EDIT}&module=${ModuleType.LogicEntityView}&sceneId=${item.scene_analysis_id}&viewId=${item.id}&objId=${objId}&entityId=${entityId}`
            }
            navigator(url)
        } else if (op === OperateType.EXECUTE) {
            setDatasourceExplorationOpen(true)
        } else if (op === OperateType.REVOCATION) {
            revokeAudit(
                item.id,
                item.online_status === onLineStatus.OnlineAuditing
                    ? DataViewRevokeType.Online
                    : item.online_status === onLineStatus.OfflineAuditing
                    ? DataViewRevokeType.Offline
                    : DataViewRevokeType.Publish,
            )
        } else if (op === OperateType.ONLINE) {
            createdAudit(item.id, DataViewAuditType.Online)
        } else if (op === OperateType.OFFLINE) {
            createdAudit(item.id, DataViewAuditType.Offline)
        }
    }

    // 新建库表
    const handleCreateLogicView = () => {
        let url = `/datasheet-view/graph?operate=${OperateType.CREATE}&module=${
            logicType === LogicViewType.LogicEntity
                ? ModuleType.LogicEntityView
                : ModuleType.CustomView
        }`
        if (logicType === LogicViewType.LogicEntity) {
            const objId = subDomainData?.path_id.split('/').slice(-2)[0]
            url += `&objId=${objId}&entityId=${subDomainData.id}`
        }
        navigator(url)
    }
    /**
     * 新建excel库表
     */
    const handleCreateExcel = () => {
        let detailsUrl: string = ''
        if (backUrl) {
            detailsUrl = `${pathname}/${window.location.search}`
        }
        const url = `/datasheet-view/detail?datasourceTab=${datasourceTab}&model=edit&isCompleted=${!showTaskScanBtn}&taskId=${
            taskId || ''
        }&detailsUrl=${
            detailsUrl || null
        }&logic=${logicType}&dataSourceType=excel&filename=${encodeURIComponent(
            selectedDatasources.title,
        )}&catalog=${selectedDatasources.catalog_name}&dataSourceId=${
            selectedDatasources?.dataSourceId
        }`
        navigator(url)
    }

    // 查询
    const search = () => {
        commonTableRef?.current?.getData()
    }

    const column: any = [
        {
            title: (
                <div>
                    <span>{__('库表业务名称')}</span>
                    <span style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
                        {__('（编码）')}
                    </span>
                </div>
            ),
            fixed: FixedType.LEFT,
            dataIndex: 'business_name',
            key: 'business_name',
            width: 220,
            sorter: true,
            sortOrder: tableSort.name,
            showSorterTooltip: {
                title: __('按库表业务名称排序'),
            },
            render: (text, record) => {
                // 已发布
                const tips = record.publish_at ? __('变更') : __('编辑')
                const showDraftTag =
                    record.edit_status === 'draft' &&
                    (record?.status === stateType.delete
                        ? !record?.publish_at
                        : true)
                return (
                    <div className={styles.catlgBox}>
                        <div className={styles.catlgName}>
                            <div
                                onClick={() =>
                                    handleOperate(OperateType.DETAIL, record)
                                }
                                className={styles.ellipsis}
                                title={text}
                            >
                                {text}
                            </div>
                            <div className={styles.statusTag}>
                                {showDraftTag && (
                                    <Tooltip
                                        placement="bottomLeft"
                                        title={__(
                                            '通过${tips}库表来查看和发布内容',
                                            { tips },
                                        )}
                                        color="#fff"
                                        overlayInnerStyle={{
                                            color: 'rgba(0,0,0,0.85)',
                                        }}
                                    >
                                        {getContentState(record.edit_status)}
                                    </Tooltip>
                                )}
                            </div>
                        </div>
                        <div
                            className={classnames(
                                styles.ellipsis,
                                styles.catlgCode,
                            )}
                            title={record.uniform_catalog_code}
                            style={{
                                color: 'rgba(0, 0, 0, 0.45)',
                                fontSize: '12px',
                            }}
                        >
                            {record.uniform_catalog_code}
                            {/* <div
                                dangerouslySetInnerHTML={{
                                    __html: highLight(
                                        record.technical_name,
                                        searchCondition?.keyword || '',
                                        'datasheetHighLight',
                                    ),
                                }}
                            /> */}
                        </div>
                    </div>
                )
            },
            ellipsis: true,
        },
        // {
        //     title: __('库表编码'),
        //     dataIndex: 'publish_status',
        //     key: 'publish_status',
        //     ellipsis: true,
        //     width: 120,
        //     render: (text, record) => text || '--',
        // },
        {
            title: __('库表技术名称'),
            dataIndex: 'technical_name',
            key: 'technical_name',
            width: 120,
            ellipsis: true,
        },
        {
            title: __('所属数据源'),
            dataIndex: 'datasource',
            key: 'datasource',
            ellipsis: true,
            width: 180,
            sorter: true,
            sortOrder: tableSort.type,
            showSorterTooltip: false,
            render: (text, record) => {
                const { Colored = undefined } = record?.datasource_type
                    ? databaseTypesEleData.dataBaseIcons[
                          record?.datasource_type
                      ]
                    : {}
                return (
                    <div className={styles.datasourceBox}>
                        {record?.datasource_type && (
                            <Colored className={styles.datasourceIcon} />
                        )}
                        <div className={styles.ellipsisText}>
                            <div className={styles.ellipsisText} title={text}>
                                {text || '--'}
                            </div>
                            <div
                                title={`${__('catalog：')}${
                                    record.datasource_catalog_name
                                }`}
                                className={styles.subText}
                            >
                                {record.datasource_catalog_name}
                            </div>
                        </div>
                    </div>
                )
            },
        },
        // {
        //     title: __('来源标识'),
        //     dataIndex: 'source_sign',
        //     key: 'source_sign',
        //     width: 120,
        //     ellipsis: true,
        //     render: (text) =>
        //         sourceSignOpions?.find((o) => o.value === text)?.label || '--',
        // },
        // {
        //     title: scanTitle(),
        //     dataIndex: 'status',
        //     key: 'status',
        //     ellipsis: true,
        //     width: 120,
        //     render: (text, record) =>
        //         record?.excel_file_name ? (
        //             <span style={{ color: 'rgba(0,0,0,0.25)' }}>
        //                 {__('不支持扫描')}
        //             </span>
        //         ) : (
        //             getScanState(text)
        //         ),
        // },
        {
            title: __('探查内容'),
            dataIndex: 'explore_content',
            key: 'explore_content',
            ellipsis: true,
            width: 120,
            render: (text, record) =>
                getExploreContent(record, logicType, isGradeOpen),
        },
        {
            title: __('发布状态'),
            dataIndex: 'publish_status',
            key: 'publish_status',
            ellipsis: true,
            width: 100,
            // render: (text) => getState(text, publishStatusList),
            render: (text, record) =>
                getState(record.publish_at ? 'publish' : 'unpublished'),
        },
        {
            title: __('上线状态'),
            dataIndex: 'online_status',
            key: 'online_status',
            ellipsis: true,
            width: 160,
            render: (text, record) => {
                const showMsg =
                    record?.audit_advice &&
                    record?.online_status !== onLineStatus.OnlineAuditing &&
                    record?.online_status !== onLineStatus.OfflineAuditing
                const title = `${onLineStatusTitle[text] || ''}${
                    record?.audit_advice
                }`
                return (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {getState(text, [
                            ...onLineStatusList,
                            {
                                label: __('已下线'),
                                value: onLineStatus.OfflineAuto,
                                bgColor: '#B2B2B2',
                            },
                        ])}
                        {showMsg && (
                            <Tooltip title={title} placement="bottom">
                                <FontIcon
                                    name="icon-shenheyijian"
                                    type={IconType.COLOREDICON}
                                    className={styles.icon}
                                    style={{ fontSize: 20, marginLeft: 4 }}
                                />
                            </Tooltip>
                        )}
                    </div>
                )
            },
        },
        {
            title: __('所属业务对象'),
            dataIndex: 'subject',
            key: 'subject',
            ellipsis: true,
            width: 120,
            render: (text, record) => {
                const map = [
                    BusinessDomainType.subject_domain_group,
                    BusinessDomainType.subject_domain,
                    BusinessDomainType.business_object,
                    BusinessDomainType.logic_entity,
                ]
                const level =
                    (record?.subject_path_id?.split('/')?.length || 0) - 1
                return (
                    <div
                        className={styles.tableItem}
                        title={
                            record.subject_path
                                ? `${
                                      logicType === LogicViewType.LogicEntity
                                          ? __('逻辑实体：')
                                          : __('业务对象：')
                                  }${record.subject_path}`
                                : __('未分配')
                        }
                    >
                        {text && (
                            <GlossaryIcon
                                width="14px"
                                type={map[level]}
                                fontSize="14px"
                                styles={{ marginRight: '4px' }}
                            />
                        )}
                        {text || '--'}
                    </div>
                )
            },
        },
        {
            title: __('所属部门'),
            dataIndex: 'department_path',
            key: 'department_path',
            ellipsis: true,
            width: 120,
            render: (text, record) => (
                <div
                    className={styles.tableItem}
                    title={
                        record.department_path ||
                        record.department ||
                        __('未分配')
                    }
                >
                    {record.department || '--'}
                </div>
            ),
        },
        {
            title: __('数据Owner'),
            dataIndex: 'owners',
            key: 'owners',
            ellipsis: true,
            width: 120,
            render: (text) => <OwnerDisplay value={text} />,
        },
        {
            title: __('所属文件'),
            dataIndex: 'excel_file_name',
            key: 'excel_file_name',
            ellipsis: true,
            width: 180,
            render: (text, record) =>
                text ? (
                    <div
                        className={styles.excelTableCellContainer}
                        title={text}
                    >
                        <span className={styles.icon}>
                            <FontIcon
                                name="icon-xls"
                                type={IconType.COLOREDICON}
                            />
                        </span>

                        <span className={styles.excelTableText}>{text}</span>
                    </div>
                ) : (
                    '--'
                ),
        },
        {
            title: __('库表创建时间'),
            dataIndex: 'created_at',
            key: 'created_at',
            sorter: true,
            sortOrder: tableSort.created_at,
            showSorterTooltip: false,
            ellipsis: true,
            width: 170,
            render: (text) =>
                text ? moment(text).format('YYYY-MM-DD HH:mm:ss') : '--',
        },
        {
            title: __('库表更新时间'),
            dataIndex: 'updated_at',
            key: 'updated_at',
            sorter: true,
            sortOrder: tableSort.updated_at,
            showSorterTooltip: false,
            ellipsis: true,
            width: 170,
            render: (text) =>
                text ? moment(text).format('YYYY-MM-DD HH:mm:ss') : '--',
        },
        {
            title: __('操作'),
            key: 'action',
            width: using === 2 && isSemanticGovernance ? 300 : 204,
            fixed: FixedType.RIGHT,
            render: (text: string, record) => {
                // 以下状态文案为'编辑'，其他为'变更'
                const editTextByPublish = [
                    publishStatus.Unpublished,
                    publishStatus.PublishedAuditReject,
                ]
                // 以下状态不能编辑/变更、删除--根据发布状态
                const auditingByPublish = [
                    publishStatus.PublishedAuditing,
                    publishStatus.ChangeAuditing,
                ]
                // 以下状态不能编辑/变更、删除--根据上线状态
                const auditingByOnline = [
                    onLineStatus.OnlineAuditing,
                    onLineStatus.OfflineAuditing,
                ]
                const onlineBtn = [
                    onLineStatus.UnOnline,
                    onLineStatus.Offline,
                    onLineStatus.OnlineAuditingReject,
                    onLineStatus.OfflineAuto,
                ]
                // 已发布
                const published = !!record.publish_at
                const showOnlineBtn =
                    onlineBtn.includes(record.online_status) && using === 2

                const revocationText =
                    record.publish_status === publishStatus.PublishedAuditing
                        ? __('撤销发布审核')
                        : record.publish_status === publishStatus.ChangeAuditing
                        ? __('撤销变更审核')
                        : record.online_status === onLineStatus.OnlineAuditing
                        ? __('撤销上线审核')
                        : record.online_status === onLineStatus.OfflineAuditing
                        ? __('撤销下线审核')
                        : ''
                const btnList = [
                    {
                        label: __('详情'),
                        status: OperateType.DETAIL,
                        show: true,
                    },
                    {
                        // label: editTextByPublish.includes(record.publish_status)? __('编辑') : __('变更'),
                        label: !published ? __('编辑') : __('变更'),
                        status: OperateType.EDIT,
                        show: true && isSemanticGovernance,
                        disable:
                            auditingByPublish.includes(record.publish_status) ||
                            auditingByOnline.includes(record.online_status) ||
                            record.status === stateType.delete,
                        disableTips:
                            record.status === stateType.delete
                                ? __('源表已删除，不能做此操作')
                                : __('审核中不能做此操作'),
                    },
                    {
                        label: __('探查'),
                        status: OperateType.EXECUTE,
                        show: true && isSemanticGovernance,
                        disable: record.status === stateType.delete,
                        disableTips: __('源表已删除，不能做此操作'),
                    },
                    {
                        label: __('上线'),
                        status: OperateType.ONLINE,
                        show: showOnlineBtn && !isSemanticGovernance,
                        popconfirmTips: __(
                            '确定要将库表资源上线到数据服务超市吗?',
                        ),
                        disable:
                            !published || record.status === stateType.delete,
                        disableTips:
                            record.status === stateType.delete
                                ? __('源表已删除，不能做此操作')
                                : __('发布成功后才能上线，请先编辑并发布库表'),
                    },
                    {
                        label: __('下线'),
                        status: OperateType.OFFLINE,
                        show:
                            (record.online_status === onLineStatus.Online ||
                                record.online_status ===
                                    onLineStatus.OfflineReject) &&
                            record.status !== stateType.delete &&
                            !isSemanticGovernance &&
                            using === 2,
                        popconfirmTips: __(
                            '确定要将库表资源从数据服务超市下线吗?',
                        ),
                        disable: record.status === stateType.delete,
                        disableTips: __('源表已删除，不能做此操作'),
                    },
                    {
                        label: revocationText,
                        status: OperateType.REVOCATION,
                        show:
                            (auditingByPublish.includes(
                                record.publish_status,
                            ) ||
                                auditingByOnline.includes(
                                    record.online_status,
                                )) &&
                            record.status !== stateType.delete &&
                            using === 2,
                        popconfirmTips: `${__('确定要')}${revocationText}${__(
                            '吗?',
                        )}`,
                        disable: record.status === stateType.delete,
                        disableTips: __('源表已删除，不能做此操作'),
                    },
                    {
                        label: __('删除'),
                        status: OperateType.DELETE,
                        show: false,
                        disable:
                            (auditingByPublish.includes(
                                record.publish_status,
                            ) ||
                                [
                                    ...auditingByOnline,
                                    onLineStatus.OfflineReject,
                                    onLineStatus.Online,
                                ].includes(record.online_status)) &&
                            record.status !== stateType.delete &&
                            using === 2,
                        disableTips:
                            record.status === stateType.delete
                                ? __('源表已删除，不能做此操作')
                                : record.online_status ===
                                      onLineStatus.Online ||
                                  record.online_status ===
                                      onLineStatus.OfflineReject
                                ? __('已上线的资源不能直接删除，需要先下线')
                                : __('审核中不能做此操作'),
                    },
                ]
                return (
                    <Space size={16}>
                        {btnList
                            .filter((item) => item.show)
                            .map((item: any) => {
                                return (
                                    <Popconfirm
                                        title={item.popconfirmTips}
                                        placement="bottomLeft"
                                        okText={__('确定')}
                                        cancelText={__('取消')}
                                        onConfirm={() => {
                                            handleOperate(item.status, record)
                                        }}
                                        disabled={
                                            !item.popconfirmTips || item.disable
                                        }
                                        icon={
                                            <InfoCircleFilled
                                                style={{
                                                    color: '#3A8FF0',
                                                    fontSize: '16px',
                                                }}
                                            />
                                        }
                                        key={item.status}
                                        overlayInnerStyle={{
                                            whiteSpace: 'nowrap',
                                        }}
                                        overlayClassName={
                                            styles.datasheetTablePopconfirmTips
                                        }
                                    >
                                        <Tooltip
                                            placement="bottomLeft"
                                            title={
                                                item.disable
                                                    ? item.disableTips
                                                    : ''
                                            }
                                            overlayInnerStyle={{
                                                whiteSpace: 'nowrap',
                                            }}
                                            overlayClassName={
                                                styles.datasheetTableTooltipTips
                                            }
                                        >
                                            <Button
                                                type="link"
                                                key={item.label}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    if (!item.popconfirmTips) {
                                                        handleOperate(
                                                            item.status,
                                                            record,
                                                        )
                                                    }
                                                }}
                                                disabled={item.disable}
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
    const columns =
        using === 1
            ? column.filter((item) => item.key !== 'online_status')
            : column

    const valueEvaluationColumn = [
        column.find((info) => info.key === 'business_name'),
        column.find((info) => info.key === 'technical_name'),
        {
            title: __('价值评估状态'),
            dataIndex: 'explore_content',
            key: 'explore_content',
            ellipsis: true,
            width: 120,
            render: (text, record) =>
                getState(
                    record.explored_data ||
                        record.explored_timestamp ||
                        record.explored_classification
                        ? explorationStatus.Exploration
                        : explorationStatus.UnExploration,
                    evaluationStatusList,
                ),
        },
        column.find((info) => info.key === 'department_path'),
        column.find((info) => info.key === 'datasource'),
        column.find((info) => info.key === 'created_at'),
        column.find((info) => info.key === 'updated_at'),
        {
            title: __('操作'),
            key: 'action',
            width: 160,
            fixed: FixedType.RIGHT,
            render: (text: string, record) => {
                return (
                    <Space size={12}>
                        {record.explored_data ||
                        record.explored_timestamp ||
                        record.explored_classification ? (
                            <Button
                                type="link"
                                onClick={(e) => {
                                    const url = `/datasheet-view/detail?datasourceTab=${datasourceTab}&id=${record.id}&model=view&targetTab=7&isValueEvaluation=true`
                                    navigator(url)
                                }}
                            >
                                {__('评估报告')}
                            </Button>
                        ) : null}
                        <Button
                            type="link"
                            onClick={(e) => {
                                handleOperate(OperateType.EXECUTE, record)
                            }}
                        >
                            {__('发起评估')}
                        </Button>
                    </Space>
                )
            },
        },
    ]
    const emptyDesc = () => {
        if (logicType === LogicViewType.LogicEntity) {
            return (
                <div style={{ textAlign: 'center' }}>
                    <p>
                        {__(
                            '暂无数据，可从左侧主题架构树中选中逻辑实体进行库表创建',
                        )}
                    </p>
                    <Button
                        type="primary"
                        onClick={handleCreateLogicView}
                        icon={<AddOutlined />}
                        disabled={
                            subDomainData?.type !==
                            BusinessDomainType.logic_entity
                        }
                        hidden={
                            subDomainData?.type !==
                            BusinessDomainType.logic_entity
                        }
                    >
                        {__('新建库表')}
                    </Button>
                </div>
            )
        }
        if (selectedDatasources?.type === 'excel') {
            if (selectedDatasources.isLeaf) {
                return (
                    <div style={{ textAlign: 'center' }}>
                        <div>{__('暂无数据，可基于Excel文件创建库表')}</div>
                        <div
                            style={{
                                marginTop: '8px',
                            }}
                        >
                            <Button
                                icon={<AddOutlined />}
                                type="primary"
                                onClick={handleCreateExcel}
                            >
                                {__('新建库表')}
                            </Button>
                        </div>
                    </div>
                )
            }
            return (
                <div style={{ textAlign: 'center' }}>
                    {__('暂无数据，可从Excel分类下选中Excel文件创建库表')}
                </div>
            )
        }
        return (
            <div style={{ textAlign: 'center' }}>
                <div>{__('当前数据源下已无库表')}</div>
                <div
                    style={{
                        color: 'rgb(0 0 0 / 45%)',
                        width: '370px',
                        marginTop: '8px',
                    }}
                >
                    {__(
                        '（左侧目录刷新后，将自动过滤掉无库表的数据源，若需要获取最新库表变化，可选择数据源重新扫描）',
                    )}
                </div>
            </div>
        )
    }

    const deleteBefore = async () => {
        try {
            let releteIds: string[] = []
            // 检测库表是否关联白名单
            const releteRes = await getWhiteListRelateFormView({
                form_view_ids: [curDatasheet?.id || ''],
            })
            releteIds =
                releteRes?.entries?.map((item) => item.form_view_id) || []
            // 检测库表是否关联隐私保护策略
            const releteRes2 = await getDataPrivacyPolicyRelateFormView({
                form_view_ids: [curDatasheet?.id || ''],
            })
            releteIds = [...releteIds, ...(releteRes2?.form_view_ids || [])]
            if (!releteIds?.length) {
                handleDelete()
            } else {
                setDelConfirmVisible(true)
            }
            setDelVisible(false)
        } catch (e) {
            formatError(e)
        }
    }

    const handleDelete = async () => {
        try {
            setDelBtnLoading(true)
            if (!curDatasheet) return
            await delDatasheetView(curDatasheet.id)
            await deleteSelectViewRequest({ view_id: curDatasheet.id })
            setDelBtnLoading(false)
            message.success(__('删除成功'))
        } catch (e) {
            if (e?.data?.code === 'DataView.FormView.FormViewIdNotExist') {
                message.info(__('无法删除，此条记录已不存在'))
            } else {
                formatError(e)
            }
        } finally {
            setDelBtnLoading(false)
            setDelVisible(false)
            search()
            if (type === 'task') {
                getDatasouces()
            }
            setDelConfirmVisible(false)
        }
    }

    // 筛选顺序变化
    const handleMenuChange = (selectedMenu) => {
        setSearchCondition((prev) => ({
            ...prev,
            sort: selectedMenu.key,
            direction: selectedMenu.sort,
            offset: 1,
        }))
        setSelectedSort(selectedMenu)
        onChangeMenuToTableSort(selectedMenu)
    }

    const onChangeMenuToTableSort = (selectedMenu) => {
        setTableSort({
            name: null,
            created_at: null,
            updated_at: null,
            [selectedMenu.key]:
                selectedMenu.sort === SortDirection.ASC ? 'ascend' : 'descend',
        })
    }

    // 表格排序改变
    const handleTableChange = (sorter) => {
        const sorterKey =
            sorter.columnKey === 'business_name'
                ? 'name'
                : sorter.columnKey === 'datasource'
                ? 'type'
                : sorter.columnKey

        if (sorter.column) {
            setTableSort({
                created_at: null,
                updated_at: null,
                name: null,
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
            created_at: null,
            updated_at: null,
            name: null,
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

    // 取消扫描
    const scanCancel = () => {
        // 取消请求
        const sor = getSource()
        if (sor.length > 0) {
            sor.forEach((info) => {
                info.source.cancel()
            })
        }
        message.success(__('未开始的任务终止成功，有1个任务已开始将继续执行'))
    }

    // 扫描多个数据源
    const scanModalOk = async (data?: any[]) => {
        setScanModalOpen(false)
        setScanConfirmOpen(true)
        const scanData = data?.length ? data : scanDatasourceData
        setScanDatasourceData(scanData)
        setIsScaning(true)
        loopScan(scanData, 1, [], [])
    }

    const loopScan = async (
        listArr: any[],
        index: number,
        errorList: any[],
        revokeAuditList: any[],
    ) => {
        let count: number = index
        setCurSum(count)
        try {
            const res = await scanDatasource({
                datasource_id: listArr[count - 1].id,
                task_id: taskId,
                project_id: projectId,
            })
            if (res?.update_revoke_audit_view_list?.length > 0) {
                revokeAuditList.push([...res.update_revoke_audit_view_list])
            }
            if (res?.delete_revoke_audit_view_list?.length > 0) {
                revokeAuditList.push([...res.delete_revoke_audit_view_list])
            }
            if (res?.error_view?.length) {
                const obj = {
                    name: listArr[count - 1].name,
                    type: listArr[count - 1].type,
                    error_view: res?.error_view,
                    error_view_count: res?.error_view_count,
                    scan_view_count: res?.scan_view_count,
                }
                errorList.push(obj)
            }
        } catch (err) {
            const obj = {
                ...err?.data,
                name: listArr[count - 1].name,
                type: listArr[count - 1].type,
                description:
                    err?.data?.description ||
                    __('请求的服务暂不可用，请稍后再试'),
            }
            errorList.push(obj)
        } finally {
            count += 1
            setCurSum(count)
            if (
                count - 1 === listArr.length ||
                errorList.findIndex((item) => item.code === 'ERR_CANCELED') > -1
            ) {
                const cancelList =
                    errorList.filter((item) => item.code === 'ERR_CANCELED') ||
                    []
                setScanConfirmOpen(false)
                if (errorList.length - cancelList.length > 0) {
                    showMessage(count - 1, errorList, revokeAuditList, using)
                } else {
                    showSuccessMessage(count - 1 - cancelList.length)
                }
                await setIsEmpty(false)
                setShowSearch(true)
                search()
                setScanDatasourceData([])
                setIsScaning(false)
                getDatasouces()
            } else {
                loopScan(listArr, count, errorList, revokeAuditList)
            }
        }
    }

    const showEmpty = () => {
        return (
            <div className={styles.indexEmptyBox}>
                <Empty
                    desc={
                        !showTaskScanBtn
                            ? __('暂无数据')
                            : __('暂无数据，可通过【扫描数据源】来添加库表')
                    }
                    iconSrc={dataEmpty}
                />
                <div className={styles.emptyBtn}>
                    <Button
                        type="primary"
                        onClick={() => setScanModalOpen(true)}
                        icon={<ScanOutlined />}
                        hidden={!showTaskScanBtn}
                    >
                        {__('扫描数据源')}
                    </Button>
                </div>
            </div>
        )
    }

    const getAuditProcess = async () => {
        try {
            const res = await getAuditProcessFromConfCenter()
            const statusObj = {
                [DataViewAuditType.Offline]: !!res?.entries?.find(
                    (item) => item.audit_type === DataViewAuditType.Offline,
                )?.id,
                [DataViewAuditType.Online]: !!res?.entries?.find(
                    (item) => item.audit_type === DataViewAuditType.Online,
                )?.id,
                [DataViewAuditType.Publish]: !!res?.entries?.find(
                    (item) => item.audit_type === DataViewAuditType.Publish,
                )?.id,
                onffline: !!res?.entries?.find(
                    (item) => item.audit_type === DataViewAuditType.Offline,
                )?.id,
                Online: !!res?.entries?.find(
                    (item) => item.audit_type === DataViewAuditType.Online,
                )?.id,
            }
            setAuditProcessStatus(statusObj)
            return statusObj
        } catch (err) {
            formatError(err)
            return {}
        }
    }

    // 发起 上线、下线、发布审核
    const createdAudit = async (id: string, audit_type: DataViewAuditType) => {
        try {
            await createdDataViewAudit({
                id,
                audit_type,
            })
            const res = await getAuditProcess()
            if (res?.[audit_type]) {
                auditTipsModal(AuditOperateMsg[audit_type])
            } else {
                message.success(`${AuditOperateMsg[audit_type]}${__('成功')}`)
            }
            search()
        } catch (err) {
            if (err?.data?.code === 'DataView.LogicView.NotFound') {
                message.info(
                    `${__('无法')}${AuditOperateMsg[audit_type]}${__(
                        '，此条记录已不存在',
                    )}`,
                )
            } else if (err?.data?.code === 'Public.AuthorizationFailure') {
                message.info(
                    `${__('无法')}${AuditOperateMsg[audit_type]}${__(
                        '，您的角色权限失效',
                    )}`,
                )
            } else {
                formatError(err)
            }
        }
    }

    // 撤销 上线、下线、发布审核
    const revokeAudit = async (
        logic_view_id: string,
        operate_type: DataViewRevokeType,
    ) => {
        try {
            await revokeDataViewAudit({
                logic_view_id,
                operate_type,
            })
            message.success(
                `${__('撤销')}${AuditOperateMsg[operate_type]}${__(
                    '审核成功',
                )}`,
            )
            search()
        } catch (err) {
            if (err?.data?.code === 'DataView.LogicView.NotFound') {
                message.info(
                    `${__('无法')}${AuditOperateMsg[operate_type]}${__(
                        '，此条记录已不存在',
                    )}`,
                )
            } else if (err?.data?.code === 'Public.AuthorizationFailure') {
                message.info(
                    `${__('无法')}${AuditOperateMsg[operate_type]}${__(
                        '，您的角色权限失效',
                    )}`,
                )
            } else {
                formatError(err)
            }
        }
    }

    const getDatasheetViewByType = async (params) => {
        const actions = isSemanticGovernance
            ? getDatasheetView
            : getDatasheetPublishedView
        return actions(
            selectedDatasources?.type === 'excel'
                ? {
                      ...params,
                      status_list: undefined,
                  }
                : params,
        )
    }

    return isLoading ? (
        <div style={{ paddingTop: '56px' }}>
            <Loader />
        </div>
    ) : (
        <div
            className={classnames(
                styles.datasheetTableWrapper,
                type === 'task' && styles.task,
            )}
        >
            {isEmpty && taskId ? (
                showEmpty()
            ) : (
                <>
                    {showTaskScanBtn && (
                        <div className={styles.taskTitle}>
                            {__('元数据库表')}
                        </div>
                    )}
                    <div
                        className={classnames(
                            !searchIsExpansion && styles.isExpansion,
                        )}
                    >
                        {showSearch && (
                            <SearchLayout
                                formData={searchForm}
                                onSearch={(queryData) => {
                                    const data = timeStrToTimestamp({
                                        ...selectedDatasources,
                                        ...queryData,
                                        // ...getDatasourceSearchParams(
                                        //     queryData?.datasource_id,
                                        // ),
                                    })
                                    setSearchDepartmentId(
                                        queryData?.department_id,
                                    )
                                    let { datasource_source_type } =
                                        selectedDatasources
                                    if (isValueEvaluation) {
                                        if (
                                            selectedDatasources.datasource_id ||
                                            selectedDatasources.info_system_id
                                        ) {
                                            datasource_source_type = undefined
                                        } else if (
                                            !selectedDatasources.datasource_source_type
                                        ) {
                                            datasource_source_type =
                                                DataSourceOrigin.INFOSYS
                                        }
                                    }
                                    setSearchCondition((prev) => ({
                                        ...prev,
                                        ...data,
                                        offset: 1,
                                        department_id:
                                            queryData?.department_id ||
                                            selectedDatasources.department_id,
                                        datasource_source_type,
                                    }))
                                }}
                                expansion
                                getExpansionStatus={setSearchIsExpansion}
                                getMoreExpansionStatus={setMoreExpansionStatus}
                                ref={searchRef}
                                prefixNode={
                                    // dataType === DsType.unknown &&
                                    // selectedIds.length ? (
                                    //     <div className={styles.rigthOptions}>
                                    //         <Button
                                    //             onClick={() =>
                                    //                 setDelVisible(true)
                                    //             }
                                    //         >
                                    //             {__('批量删除')}
                                    //         </Button>
                                    //         <Button
                                    //             type="link"
                                    //             className={
                                    //                 styles.rigthOptionsCancel
                                    //             }
                                    //             onClick={() =>
                                    //                 setSelectedIds([])
                                    //             }
                                    //         >
                                    //             {__('取消批量选择')}
                                    //         </Button>
                                    //     </div>
                                    // ) : type === 'task' && showTaskScanBtn ? (
                                    //     <div className={styles.taskPrefix}>
                                    //         <Button
                                    //             type="primary"
                                    //             onClick={() =>
                                    //                 setScanModalOpen(true)
                                    //             }
                                    //             icon={<ScanOutlined />}
                                    //         >
                                    //             {__('扫描数据源')}
                                    //         </Button>
                                    //         <span
                                    //             className={
                                    //                 styles.taskPrefixText
                                    //             }
                                    //         >
                                    //             {__(
                                    //                 '您可以通过【扫描数据源】来获取库表并进行信息的完善和发布',
                                    //             )}
                                    //         </span>
                                    //     </div>
                                    // ) : logicType &&
                                    //   [
                                    //       LogicViewType.Custom,
                                    //       LogicViewType.LogicEntity,
                                    //   ].includes(logicType) ? (
                                    //     <>
                                    //         <Tooltip
                                    //             title={
                                    //                 logicType ===
                                    //                 LogicViewType.LogicEntity
                                    //                     ? __(
                                    //                           '一个逻辑实体只能有一个库表，无法继续新建',
                                    //                       )
                                    //                     : ''
                                    //             }
                                    //         >
                                    //             <Button
                                    //                 type="primary"
                                    //                 onClick={
                                    //                     handleCreateLogicView
                                    //                 }
                                    //                 icon={<AddOutlined />}
                                    //                 disabled={!creatable}
                                    //                 hidden={!showCreate}
                                    //             >
                                    //                 {__('新建库表')}
                                    //             </Button>
                                    //         </Tooltip>
                                    //         {logicType ===
                                    //             LogicViewType.LogicEntity &&
                                    //             subDomainData?.type !==
                                    //                 BusinessDomainType.logic_entity &&
                                    //             !isEmpty && (
                                    //                 <span
                                    //                     style={{
                                    //                         color: 'rgb(0 0 0 / 45%)',
                                    //                         fontSize: 12,
                                    //                     }}
                                    //                 >
                                    //                     {__(
                                    //                         '需要从左侧主题架构中，选中逻辑实体，才能创建库表',
                                    //                     )}
                                    //                 </span>
                                    //             )}
                                    //     </>
                                    // ) : (
                                    //     <div className={styles.rigthTitle}>
                                    //         {__('元数据库表')}
                                    //     </div>
                                    // )
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            marginRight: 16,
                                        }}
                                    >
                                        <div
                                            title={selectedNode.name}
                                            className={styles.searchLeftTitle}
                                        >
                                            <span
                                                className={
                                                    styles.searchLeftTitleText
                                                }
                                            >
                                                {selectedNode?.name}
                                            </span>
                                        </div>
                                        {!isSemanticGovernance && (
                                            <Button
                                                type="link"
                                                onClick={() => {
                                                    window.open(
                                                        '/studio/semantic-governance/data-semantic-governance/datasheet-view',
                                                    )
                                                }}
                                            >
                                                {__('管理库表>>')}
                                            </Button>
                                        )}
                                    </div>
                                }
                                suffixNode={
                                    <SortBtn
                                        contentNode={
                                            <DropDownFilter
                                                menus={
                                                    (logicType &&
                                                        [
                                                            LogicViewType.Custom,
                                                            LogicViewType.LogicEntity,
                                                        ].includes(
                                                            logicType,
                                                        )) ||
                                                    dataType ===
                                                        DsType.datasource ||
                                                    dataType === DsType.unknown
                                                        ? menus.filter(
                                                              (item) =>
                                                                  item.key !==
                                                                  'type',
                                                          )
                                                        : menus
                                                }
                                                defaultMenu={defaultMenu}
                                                menuChangeCb={handleMenuChange}
                                                changeMenu={selectedSort}
                                            />
                                        }
                                    />
                                }
                            />
                        )}

                        <CommonTable
                            queryAction={getDatasheetViewByType}
                            params={searchCondition}
                            baseProps={{
                                columns: isValueEvaluation
                                    ? valueEvaluationColumn
                                    : logicType &&
                                      [
                                          LogicViewType.Custom,
                                          LogicViewType.LogicEntity,
                                      ].includes(logicType)
                                    ? columns.filter(
                                          (item) =>
                                              ![
                                                  'status',
                                                  'edit_status',
                                                  'datasource',
                                                  'exploration_status',
                                                  'excel_file_name',
                                              ].includes(item.key),
                                      )
                                    : dataType === DsType.datasource ||
                                      dataType === DsType.unknown
                                    ? columns.filter(
                                          (item) =>
                                              (selectedDatasources?.type !==
                                                  'excel' ||
                                                  item.key !== 'status') &&
                                              item.key !== 'datasource' &&
                                              (item.key !== 'excel_file_name' ||
                                                  selectedDatasources?.type ===
                                                      'excel' ||
                                                  !selectedDatasources?.id) &&
                                              (isSemanticGovernance
                                                  ? item.key !== 'online_status'
                                                  : item.key !==
                                                    'publish_status'),
                                      )
                                    : !showTaskScanBtn && type === 'task'
                                    ? columns.filter(
                                          (item) =>
                                              (selectedDatasources?.type !==
                                                  'excel' ||
                                                  item.key !== 'status') &&
                                              item.key !== 'action' &&
                                              (item.key !== 'excel_file_name' ||
                                                  selectedDatasources?.type ===
                                                      'excel' ||
                                                  !selectedDatasources?.id),
                                      )
                                    : columns.filter(
                                          (item) =>
                                              (selectedDatasources?.type !==
                                                  'excel' ||
                                                  item.key !== 'status') &&
                                              (item.key !== 'excel_file_name' ||
                                                  selectedDatasources?.type ===
                                                      'excel' ||
                                                  !selectedDatasources?.id) &&
                                              (isSemanticGovernance
                                                  ? item.key !== 'online_status'
                                                  : item.key !==
                                                    'publish_status'),
                                      ),
                                scroll: {
                                    x: 1300,
                                    y: `calc(100vh - ${
                                        commonTableRef?.current?.total > 10
                                            ? tableHeight
                                            : tableHeight - 48
                                    }px)`,
                                },
                                rowClassName: styles.tableRow,
                            }}
                            ref={commonTableRef}
                            emptyDesc={emptyDesc()}
                            emptyIcon={dataEmpty}
                            getEmptyFlag={(flag) => {
                                setIsInit(false)
                                setListEmpty(flag)
                                const empty =
                                    flag &&
                                    !Object.values(
                                        omit(
                                            searchCondition,
                                            emptyExcludeField,
                                        ),
                                    ).some((item) => item)
                                setIsEmpty(empty)
                                setShowSearch(!empty)
                            }}
                            onTableListUpdated={() => {
                                setSelectedSort(undefined)
                            }}
                            onChange={(currentPagination, filters, sorter) => {
                                if (
                                    currentPagination.current ===
                                    searchCondition.offset
                                ) {
                                    const selectedMenu =
                                        handleTableChange(sorter)
                                    setSelectedSort(selectedMenu)
                                    setSearchCondition((prev) => ({
                                        ...prev,
                                        sort: selectedMenu.key,
                                        direction: selectedMenu.sort,
                                        offset: 1,
                                        limit: currentPagination?.pageSize,
                                    }))
                                } else {
                                    setSearchCondition((prev) => ({
                                        ...prev,
                                        offset: currentPagination.current,
                                    }))
                                }
                            }}
                            getTableList={(data) => getTableList?.(data)}
                            emptyExcludeField={emptyExcludeField}
                        />
                    </div>
                </>
            )}
            {/* 删除/批量删除 */}
            <Confirm
                open={delVisible}
                title={
                    selectedIds.length > 0
                        ? __('确定批量删除？')
                        : __('确定要删除库表吗？')
                }
                content={
                    <span style={{ color: '#FF4D4F' }}>
                        {selectedIds.length > 0
                            ? __(
                                  '删除数据后不可恢复，若这些库表被其他功能引用，也会导致其不能正常使用，确定要执行此操作吗？',
                              )
                            : __(
                                  '删除数据后不可恢复，若此库表被其他功能引用，也会导致其不能正常使用，确定要执行此操作吗？',
                              )}
                    </span>
                }
                icon={
                    <ExclamationCircleFilled
                        style={{ color: '#FAAD14', fontSize: '22px' }}
                    />
                }
                onOk={deleteBefore}
                onCancel={() => {
                    setDelVisible(false)
                }}
                width={410}
                okButtonProps={{ loading: delBtnLoading }}
            />
            {/* 库表关联策略，确认删除 */}
            <Confirm
                open={delConfirmVisible}
                title={__('确定继续删除？')}
                content={
                    <span style={{ color: '#FF4D4F' }}>
                        {__(
                            '当前库表存在安全策略管理，继续删除库表会导致策略同步删除，且无法恢复策略可用状态，只能重新配置，建议确认当前库表不再继续使用后再进行删除操作。',
                        )}
                    </span>
                }
                icon={
                    <ExclamationCircleFilled
                        style={{ color: '#FAAD14', fontSize: '22px' }}
                    />
                }
                okText={__('继续删除')}
                cancelText={__('取消删除')}
                onOk={handleDelete}
                onCancel={() => {
                    setDelConfirmVisible(false)
                }}
                width={410}
                okButtonProps={{ type: 'default', loading: delBtnLoading }}
            />
            {/* 扫描数据源 -- 选择数据源 */}
            {scanModalOpen && (
                <ScanModal
                    open={scanModalOpen}
                    type={scanModalType}
                    onClose={() => {
                        setScanDatasourceData([])
                        setScanModalOpen(false)
                    }}
                    onOk={(data) => {
                        if (
                            data &&
                            data.filter((item) => item.last_scan)?.length > 0 &&
                            auditProcessStatus[DataViewAuditType.Online] &&
                            using !== 1
                        ) {
                            confirm({
                                title: __(
                                    '您选择的数据源中，有产生历史库表的数据，请您确认是否继续扫描？',
                                ),
                                icon: (
                                    <ExclamationCircleFilled
                                        style={{
                                            color: '#FAAD14',
                                            fontSize: '24px',
                                        }}
                                    />
                                ),
                                content: (
                                    <div>
                                        {__(
                                            '若扫描数据源发现库表字段有变更（源表更改、源表删除），上线审核中的库表会自动撤销审核。',
                                        )}
                                        <div
                                            style={{
                                                color: 'rgb(0 0 0 / 45%)',
                                                marginTop: 18,
                                            }}
                                        >
                                            {__(
                                                '其中标记“源表更改”的库表建议更新后重新操作上线，已上线的不用重新上线但需要手动更新；标记“源表删除”的库表不能上线，已上线的将会自动下线。',
                                            )}
                                        </div>
                                    </div>
                                ),
                                okText: __('我知道了，继续扫描'),
                                onOk() {
                                    scanModalOk(data)
                                },
                            })
                        } else {
                            scanModalOk(data)
                        }
                    }}
                    datasourceData={scanDatasourceData}
                    isEmpty={datasourceEmpty}
                />
            )}
            {/* 扫描数据源 -- 进度 */}
            {scanConfirmOpen && (
                <ScanConfirm
                    open={scanConfirmOpen}
                    datasourceData={scanDatasourceData}
                    curSum={curSum}
                    onClose={() => {
                        cancelScanVisible(scanCancel)
                        setIsScaning(false)
                    }}
                />
            )}
            {/* 探查数据源 */}
            {datasourceExplorationOpen && (
                <DatasourceExploration
                    open={datasourceExplorationOpen}
                    onClose={(showTask?: boolean) => {
                        setDatasourceExplorationOpen(false)
                        if (showTask) {
                            setMytaskOpen(true)
                        }
                    }}
                    type={ExplorationType.FormView}
                    formView={curDatasheet}
                />
            )}
            {/* 任务中心 - 评估任务下显示任务列表，其他地方不需要 */}
            {myTaskOpen && ( // && taskId
                <MyTaskDrawer
                    open={myTaskOpen}
                    onClose={() => {
                        setMytaskOpen(false)
                    }}
                    tabKey="2"
                />
            )}
        </div>
    )
})

export default DatasheetTable
