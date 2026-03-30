import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
    Button,
    Dropdown,
    MenuProps,
    message,
    Pagination,
    Space,
    Table,
    Tooltip,
    Typography,
} from 'antd'
import { ExclamationCircleOutlined, CaretDownOutlined } from '@ant-design/icons'
import { DefaultOptionType } from 'antd/lib/select'
import { ColumnsType } from 'antd/lib/table'
import { SortOrder } from 'antd/lib/table/interface'
import { useDebounceFn, useGetState } from 'ahooks'
import { useNavigate, useLocation } from 'react-router-dom'
import classnames from 'classnames'
import { isUndefined, trim } from 'lodash'
import styles from './styles.module.less'
import {
    defaultMenu,
    FormTableKind,
    FormTableKindOptions,
    FormType,
    formTypeArr,
    menus,
    menusStd,
    NewFormType,
    products,
    SortType,
    ToBeCreStdStatusValue,
    totalOperates,
} from './const'
import DropDownFilter from '../DropDownFilter'
import {
    AddOutlined,
    BlankFormColored,
    FontIcon,
    StandardOutlined,
} from '@/icons'
import {
    formsDelete,
    formsEnumConfig,
    formsExport,
    formsQuery,
    formsQueryItem,
    IFormEnumConfigModel,
    IFormItem,
    IFusionFormItem,
    IFormQueryCountModel,
    formatError,
    getCoreBusinessDetails,
    ICoreBusinessDetails,
    IStandardEnum,
    queryStandardEnum,
    SortDirection,
    TaskStatus,
    TaskType,
    messageSuccess,
    getPendingBusinTable,
    BizModelType,
    LoginPlatform,
    transformQuery,
} from '@/core'
import empty from '@/assets/emptyAdd.svg'
import Empty from '@/ui/Empty'
import {
    formatTime,
    getPlatformNumber,
    OperateType,
    streamToFile,
} from '@/utils'
import Confirm from '../Confirm'
import Details from './Details'
import ImportForm from './ImportForm'
import Loader from '@/ui/Loader'
import { TaskInfoContext } from '@/context'
import dataEmpty from '../../assets/dataEmpty.svg'
import Standardizing from './Standardizing'
import ReqAddStandard from './ReqAddStandard'
import { FieldsInfoProvider, getFormOptions } from './helper'
import __ from './locale'
import CreateForm from './CreateForm'
import EditForm from './EditForm'
import { RefreshBtn, SortBtn } from '@/components/ToolbarComponents'
import { OptionBarTool, OptionMenuType, SearchInput } from '@/ui'
import { useTaskCheck } from '@/hooks/useTaskCheck'
import CreateTaskSelect from '../TaskComponents/CreateTaskSelect'
import CreateTask from '../TaskComponents/CreateTask'
import ModelOperate from '../BusinessModeling/ModelOperate'
import MultiLabelDisplay from './MultiLabelDisplay'
import { IconType } from '@/icons/const'
import { useBusinessModelContext } from '../BusinessModeling/BusinessModelProvider'
import CreateDataOriginForm from './CreateDataOriginForm'
import CreateDataStandardForm from './CreateDataStandardForm'
import CreateDataFusion from './CreateDataFusion'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

/**
 * 查询参数
 */
interface IQueryParams {
    current?: number
    pageSize?: number
    direction?: SortDirection
    keyword?: string
    sort?: string
    data_range?: number
    overall_priority_rule?: number
    rate?: number
}

interface IForms {
    modelId: string
    initFormType?: FormType
    pMbid?: string
    coreBizName?: string
}

const { Paragraph, Text } = Typography
/**
 * 表单
 * @param modelId 业务模型id
 * @returns
 */
const Forms: React.FC<IForms> = ({
    modelId,
    initFormType,
    pMbid = '',
    coreBizName,
}) => {
    // 任务信息
    const { taskInfo } = useContext(TaskInfoContext)
    const { checkTask, checkTasks } = useTaskCheck(
        totalOperates,
        products,
        taskInfo,
    )
    const { checkPermission } = useUserPermCtx()

    const contRef: any = useRef()
    // 表单类型
    const [formType, setFormType] = useState(FormType.STANDARD)

    // 操作类型
    const [operateType, setOperateType] = useState<OperateType>(
        OperateType.CREATE,
    )

    const [tempTaskInfo, setTempTaskInfo, getTempTaskInfo] = useGetState<any>()

    // 搜索关键字
    const [searchKey, setSearchKey] = useState('')

    // 表单item
    const [formItem, setFormItem] = useState<any>()

    const formsListRef = useRef<HTMLDivElement>(null)

    // 导入对话框显示,【true】显示,【false】隐藏
    const [importVisible, setImportVisible] = useState(false)

    // 创建/编辑界面显示,【true】显示,【false】隐藏
    const [editVisible, setEditVisible] = useState(false)

    const [createVisible, setCreateVisible] = useState(false)

    // 详情界面显示,【true】显示,【false】隐藏
    const [detailVisible, setDetailVisible] = useState(false)

    // 删除弹框显示,【true】显示,【false】隐藏
    const [delVisible, setDelVisible] = useState(false)

    // 标准化界面显示,【true】显示,【false】隐藏
    const [standardVisible, setStandardVisible] = useState(false)

    // 删除项ID
    const [delIds, setDelIds] = useState(Array<string>)

    // 请求加载
    const [fetching, setFetching] = useState(false)
    const [deleting, setDeleting] = useState(false)

    // 整体的load显示,【true】显示,【false】隐藏
    const [loading, setLoading] = useState(true)

    // 筛选值
    const [selectValue, setSelectValue] = useState(0)

    // 创建任务
    const [createTaskVisible, setCreateTaskVisible] = useState(false)
    const [createTaskType, setCreateTaskType] = useState<string>()

    const navigator = useNavigate()
    const redirect = useLocation()

    // 请求新建标准界面显示,【true】显示,【false】隐藏
    const [addStandardVisible, setAddStandardVisible] = useState(false)
    // 保存按钮可用状态
    const [showStateTabs, setShowStateTabs] = useState(true)
    // 保存按钮可用状态
    const [newStandardSum, setNewStandardSum] = useState()
    // 从数据源导入业务表
    const [importFromDSOpen, setImportFromDSOpen] = useState(false)
    // 业务模型的详情---可获取是否关联信息系统
    const [cbDetails, setCbDetails] = useState<ICoreBusinessDetails>()
    const [chooseInfoSysOpen, setChooseInfoSysOpen] = useState(false)
    const [completeFormOpen, setCompleteFormOpen] = useState(false)

    const {
        businessModelType,
        isDraft,
        refreshDraft,
        isAuditMode,
        selectedVersion,
        refreshCoreBusinessDetails,
        isButtonDisabled,
    } = useBusinessModelContext()

    const versionParams = useMemo(() => {
        return transformQuery({ isDraft, selectedVersion })
    }, [isDraft, selectedVersion])

    // 消息提示
    const [messageApi, contextHolder] = message.useMessage()

    // // 自定义提示弹窗
    // const msgToast = getMsgToast(messageApi, styles.messageToast)

    // 筛选options
    const selectOptions = (): DefaultOptionType[] => {
        if (formType === FormType.FUSION) {
            let priorityRule: { value: number; label: string }[] = []
            if (config && config?.overall_priority_rule?.length > 0) {
                priorityRule = config.overall_priority_rule.map((item) => {
                    return { value: item.id, label: item.value }
                })
            }
            priorityRule = [
                { value: 1, label: __('唯一性') },
                { value: 2, label: __('从众性') },
                { value: 3, label: __('时间性') },
            ]
            return [{ value: 0, label: __('全部') }, ...priorityRule]
        }
        let dataRange: { value: number; label: string }[] = []
        if (config && config?.data_range?.length > 0) {
            dataRange = config?.data_range.map((item) => {
                return { value: item.id, label: item.value }
            })
        }
        return [{ value: 0, label: __('全部') }, ...dataRange]
    }

    // 初始params
    const initialQueryParams = {
        current: 1,
        pageSize: 10,
        direction: defaultMenu.sort,
        sort: defaultMenu.key,
        keyword: '',
    }

    // 创建表头排序
    const [createSortOrder, setCreateSortOrder] = useState<SortOrder>(null)

    // 修改表头排序
    const [updateSortOrder, setUpdateSortOrder] = useState<SortOrder>('descend')

    const [menuValue, setMenuValue] = useState<
        { key: SortType; sort: SortDirection } | undefined
    >(defaultMenu)

    // 查询params
    const [queryParams, setQueryParams] =
        useState<IQueryParams>(initialQueryParams)

    // 配置信息
    const [config, setConfig] = useState<IFormEnumConfigModel>()

    // 业务标准枚举配置
    const [standardEnum, setStandardEnum] = useState<IStandardEnum>()

    // 统计信息
    const [fmCount, setFmCount] = useState<IFormQueryCountModel>()
    const [total, setTotal] = useState(0)
    const [items, setItems] = useState<any[]>([])

    // alert是否显示
    const [alertOpen, setAlertOpen] = useState(false)

    const [createOriginFormOpen, setCreateOriginFormOpen] =
        useState<boolean>(false)

    const [createDataStandardOpen, setCreateDataStandardOpen] =
        useState<boolean>(false)

    const [createDataFusionOpen, setCreateDataFusionOpen] =
        useState<boolean>(false)

    // 是否为DropDownFilter控制的排序
    let sortWay: boolean = false

    const platform = getPlatformNumber()
    // 是否为cs 平台
    const isCSPlatform = useMemo(() => {
        return platform !== LoginPlatform.default
    }, [platform])

    // 排序params
    const [sortDire, setSortDire] = useState<any>({
        direction: defaultMenu.sort,
        sort: defaultMenu.key,
    })

    // 多选项
    const [selectedItems, setSelectedItems] = useState<any[]>([])
    const rowSelection = {
        selectedRowKeys: selectedItems.map((i) => i.id),
        onChange: (val: React.Key[], selectedRows) => {
            if (val.length === 0 || val.length === items.length) {
                const ids = items.map((i) => i.id)
                let filterItems = selectedItems.filter(
                    (k) => !ids.includes(k.id),
                )
                if (val.length === items.length) {
                    filterItems = [...filterItems, ...selectedRows]
                }
                setSelectedItems(filterItems)
            }
        },
        onSelect: (record, selected, selectedRows) => {
            if (selected) {
                setSelectedItems([...selectedItems, record])
            } else {
                setSelectedItems([
                    ...selectedItems.filter((i) => i.id !== record.id),
                ])
            }
        },
    }

    // 新建任务默认值
    const createTaskData = useMemo(() => {
        return [
            {
                name: 'task_type',
                value: createTaskType,
                disabled: true,
            },
            {
                name: 'main_biz',
                value: { id: modelId, name: coreBizName },
                disabled: true,
            },
            {
                name: 'biz_form',
                value: selectedItems.map((i) => ({
                    id: i.id,
                    name: i.name,
                })),
                disabled: true,
            },
        ]
    }, [createTaskType])

    // 根据URL判断业务模型还是执行标准化任务
    const sourceType =
        window.location.pathname.indexOf('/coreBusiness') > -1
            ? 'mainBusiness'
            : 'executeTask'

    // 获取表单列表
    const getList = async (params) => {
        if (!modelId) {
            setLoading(false)
            return
        }
        try {
            setFetching(true)
            // 查询含有未读标准的业务表
            const { data: unreadList } = await getPendingBusinTable({
                business_table_model_id: pMbid,
                state: `${ToBeCreStdStatusValue.CREATED}`,
            })
            const res = await formsQuery(modelId, {
                type: formType,
                ...params,
                offset: params.current,
                limit: params.pageSize,
                rate: 1,
                task_id: taskInfo?.taskId,
                ...versionParams,
            })
            const data: Array<any> = []
            if (unreadList) {
                res.entries.forEach((it) => {
                    const unreadFItem = unreadList.find(
                        (item) => item.business_table_id === it.id,
                    )
                    data.push({
                        ...it,
                        new_flag: !!unreadFItem,
                        newStandardSum: unreadFItem?.created_number || 0,
                    })
                })
            }
            setQueryParams({ ...params })
            sortWay = false
            // 获取统计信息
            // const count = await formsCount(modelId)
            // setFmCount(count)
            if (getTempTaskInfo()?.coreBizError) {
                setTotal(0)
                setItems([])
            } else {
                setTotal(res.total_count)
                setItems(data.length > 0 ? data : res.entries)
            }
        } catch (e) {
            formatError(e, undefined, { style: { marginTop: 36 } })
            setTotal(0)
            setItems([])
        } finally {
            setFetching(false)
            setLoading(false)
            setMenuValue(undefined)
        }
    }

    // 根据草稿是否变化，刷新列表
    const refreshListWithDraft = async (params) => {
        try {
            const res = await getCoreBusinessDetails(modelId)
            // 草稿状态发生变化，刷新草稿，通过监听isDraft的变化触发getList
            if (res.has_draft !== undefined && res.has_draft !== isDraft) {
                refreshDraft?.(res.has_draft)
            } else {
                // 草稿状态不变，刷新列表
                getList(params)
            }
            refreshCoreBusinessDetails?.(res)
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        getEnumConfig()
        getStandardEnum()
    }, [])

    // useEffect(() => {
    //     if (taskInfo.taskType === TaskType.Standardize) {
    //         // 标准化任务时默认选中业务表
    //         setFormType(FormType.STANDARD)
    //     } else {
    //         setFormType(FormType.ORIGINAL)
    //     }
    // }, [modelId])

    useEffect(() => {
        if (initFormType) {
            setFormType(initFormType)
        }
    }, [initFormType])

    useEffect(() => {
        if (!modelId) return
        if (isUndefined(isDraft)) return
        setSearchKey('')
        setSelectValue(0)
        // setCreateSortOrder('descend')
        setUpdateSortOrder('descend')
        setMenuValue(defaultMenu)
        setSelectedItems([])
        setTotal(0)
        setItems([])
        setLoading(true)
        setTempTaskInfo(taskInfo)
        getList(initialQueryParams)
    }, [modelId, isDraft, selectedVersion])

    useEffect(() => {
        if (standardVisible) {
            setStandardVisible(false)
        }
    }, [taskInfo?.taskId])

    // 获取配置信息
    const getEnumConfig = async () => {
        try {
            const res = await formsEnumConfig()
            setConfig(res)
        } catch (e) {
            formatError(e)
        }
    }

    // 获取业务标准枚举配置
    const getStandardEnum = async () => {
        const res = await queryStandardEnum()
        setStandardEnum(res)
    }

    // 获取选中表单详情
    const getFormDetails = async (item: any): Promise<boolean> => {
        try {
            const res = await formsQueryItem(modelId, item.id)
            // switch (formType) {
            //     case FormType.ORIGINAL:
            //         setFormItem(res.original_form)
            //         break
            //     case FormType.STANDARD:
            //         setFormItem(res.standard_form)
            //         break
            //     default:
            //         setFormItem(res.fusion_form)
            // }
            setFormItem(res)
            return Promise.resolve(true)
        } catch (error) {
            formatError(error)
            getList({
                ...queryParams,
                current:
                    items.length === 1
                        ? queryParams.current! - 1 || 1
                        : queryParams.current!,
            })
            return Promise.resolve(false)
        }
    }

    // 删除表单
    const handleDelete = async () => {
        try {
            setDeleting(true)
            const res = await Promise.all(
                delIds.map((item) =>
                    formsDelete(modelId, item, formType, taskInfo.taskId),
                ),
            )
            setDeleting(false)
            messageSuccess(__('删除成功'))
            const resIds = res?.map((r) => r.id)
            setSelectedItems(
                selectedItems.filter((s) => !resIds.includes(s.id)),
            )
            refreshListWithDraft({
                ...queryParams,
                current:
                    items.length === 1
                        ? queryParams.current! - 1 || 1
                        : queryParams.current!,
            })
        } catch (e) {
            formatError(e)
        } finally {
            setDelVisible(false)
            setDeleting(false)
        }
    }

    // 操作处理
    const handleOperate = async (
        type: OperateType,
        item?: IFormItem & IFusionFormItem,
    ) => {
        setOperateType(type)
        setFormItem(item)
        switch (type) {
            case OperateType.DETAIL: {
                const bo = await getFormDetails(item)
                setDetailVisible(bo)
                break
            }
            case OperateType.IMPORT:
                setImportVisible(true)
                break
            case OperateType.CREATE:
                setCreateVisible(true)
                break
            case OperateType.EDIT: {
                const bo = await getFormDetails(item!)
                setEditVisible(true)
                break
            }
            case OperateType.EXPORT:
                exportForm(item)
                break
            case OperateType.STANDARDING:
                // if (
                //     getAccess(
                //         `${ResourceType.new_standard}.${RequestType.put}`,
                //         taskInfo,
                //     )
                // ) {
                markStandardRead(item)
                // }
                setStandardVisible(true)
                break
            default:
                break
        }
    }
    // 标记已读
    const markStandardRead = (data) => {
        setAlertOpen(data.new_flag)
        setNewStandardSum(data.newStandardSum || 0)
        // formsQueryStandardMarkReadTaskLists({ ids: [data.id] })
    }

    // 表格项操作的防抖
    const { run, cancel, flush } = useDebounceFn(handleOperate, {
        wait: 2000,
        leading: true,
        trailing: false,
    })

    // 操作取消处理
    const handleOperateCancel = (type: OperateType) => {
        switch (type) {
            case OperateType.DETAIL:
                setDetailVisible(false)
                break
            case OperateType.IMPORT:
                setImportVisible(false)
                break
            case OperateType.CREATE:
                setCreateVisible(false)
                break
            case OperateType.EDIT:
                setEditVisible(false)
                break
            case OperateType.DELETE:
                setDelVisible(false)
                break
            case OperateType.STANDARDING:
                setStandardVisible(false)
                break
            default:
                break
        }
    }

    // 导出表单
    const exportForm = async (item?: IFormItem & IFusionFormItem) => {
        if (!item) return
        try {
            const res = await formsExport(modelId, item.id, {
                type: formType,
                ...versionParams,
            })
            const fileName = `${item.name}-${
                formTypeArr[formType].value
            }-${new Date().getTime()}.xlsx`
            streamToFile(res, fileName)
            messageSuccess(__('导出成功'))
        } catch (error) {
            formatError(error)
        }
    }

    // 筛选onChange
    const handleSelectChange = (value: number) => {
        setSelectValue(value)
        if (formType === FormType.FUSION) {
            getList({
                ...queryParams,
                current: 1,
                overall_priority_rule: value,
            })
        } else {
            getList({ ...queryParams, current: 1, data_range: value })
        }
    }

    // 搜索框enter
    const handleSearchPressEnter = (e: any) => {
        const keyword = typeof e === 'string' ? e : trim(e.target.value)
        getList({
            ...queryParams,
            keyword,
            current: 1,
        })
    }

    // 表格排序改变
    const handleTableChange = (sorter) => {
        let sortFields = {}
        if (sorter.column) {
            setCreateSortOrder(null)
            setUpdateSortOrder(null)
            if (sorter.columnKey === 'created_at') {
                setCreateSortOrder(sorter.order || 'ascend')
            } else {
                setUpdateSortOrder(sorter.order || 'ascend')
            }
            sortFields = {
                direction:
                    sorter.order === 'descend'
                        ? SortDirection.DESC
                        : SortDirection.ASC,
                sort: sorter.columnKey,
            }
            setMenuValue({
                key: sorter.columnKey,
                sort:
                    sorter.order === 'descend'
                        ? SortDirection.DESC
                        : SortDirection.ASC,
            })
        } else {
            sortFields = sortDire
            if (sortDire.sort === 'updated_at') {
                setUpdateSortOrder('ascend')
                sortFields = { ...sortDire, direction: SortDirection.ASC }
                setMenuValue({
                    key: sorter.columnKey,
                    sort: SortDirection.ASC,
                })
            }
            if (sortDire.sort === 'created_at') {
                setCreateSortOrder('ascend')
                sortFields = { ...sortDire, direction: SortDirection.ASC }
                setMenuValue({
                    key: sorter.columnKey,
                    sort: SortDirection.ASC,
                })
            }
        }
        setSortDire(sortFields)
        getList({
            ...queryParams,
            sort: sorter.columnKey,
            direction:
                sorter.order === 'descend'
                    ? SortDirection.DESC
                    : SortDirection.ASC,
            current: 1,
        })
    }

    // 排序方式改变
    const handleSortWayChange = (selectedMenu) => {
        if (showSearch) {
            sortWay = true
            if (selectedMenu.key === SortType.CREATED) {
                setCreateSortOrder(
                    selectedMenu.sort === SortDirection.DESC
                        ? 'descend'
                        : 'ascend',
                )
                setUpdateSortOrder(null)
            } else {
                setUpdateSortOrder(
                    selectedMenu.sort === SortDirection.DESC
                        ? 'descend'
                        : 'ascend',
                )
                setCreateSortOrder(null)
            }
            getList({
                ...queryParams,
                sort: selectedMenu.key,
                direction: selectedMenu.sort,
                current: 1,
            })
        }
    }

    // 操作项宽度
    const opearteWi = (menuItems) => {
        const isHaveMore = menuItems.find(
            (item) => item.menuType === OptionMenuType.More,
        )
        if (isHaveMore) {
            return (
                (menuItems.filter(
                    (item) => item.menuType !== OptionMenuType.More,
                )?.length || 0) + 1
            )
        }
        return menuItems?.length
    }

    /**
     * 表格操作事件
     * @param key 操作id
     * @param record 行数据
     */
    const handleOptionTable = (key: string, record) => {
        switch (key) {
            case 'edit':
                if (
                    [
                        FormTableKind.DATA_ORIGIN,
                        FormTableKind.DATA_STANDARD,
                        FormTableKind.DATA_FUSION,
                    ].includes(record?.table_kind)
                ) {
                    navigator(
                        `/data-form-graph/view?mid=${modelId}&fid=${
                            record.id
                        }&defaultModel=edit&redirect=${
                            redirect.pathname
                        }&defaultModel=view&targetTab=form&taskId=${
                            taskInfo.taskId || ''
                        }&taskType=${taskInfo.taskType}&taskStatus=${
                            taskInfo.taskStatus
                        }&isDraft=${isDraft}&versionId=${selectedVersion}`,
                    )
                } else if (record.form_type === NewFormType.DSIMPORT) {
                    // if (!record.update_cycle) {
                    //     setCompleteFormOpen(true)
                    //     setFormItem(record)
                    //     return
                    // }

                    const url = `/formGraph/importFromDS?mid=${modelId}&fid=${
                        record.id
                    }&dfid=${
                        record.from_table_id
                    }&defaultModel=edit&isComplete=${
                        record.is_completed
                    }&redirect=${
                        redirect.pathname
                    }&defaultModel=view&targetTab=form&taskId=${
                        taskInfo.taskId || ''
                    }&taskType=${taskInfo.taskType}&taskStatus=${
                        taskInfo.taskStatus
                    }&isDraft=${isDraft}&versionId=${selectedVersion}`

                    navigator(url)
                } else if (record.form_type === NewFormType.BLANK) {
                    navigator(
                        `/formGraph/view?mid=${modelId}&fid=${
                            record.id
                        }&defaultModel=edit&redirect=${
                            redirect.pathname
                        }&defaultModel=view&targetTab=form&taskId=${
                            taskInfo.taskId || ''
                        }&taskType=${taskInfo.taskType}&taskStatus=${
                            taskInfo.taskStatus
                        }&isDraft=${isDraft}&versionId=${selectedVersion}`,
                    )
                }

                break
            case 'standard':
                handleOperate(OperateType.STANDARDING, record)
                break
            case 'export':
                run(OperateType.EXPORT, record)
                break
            case 'detail':
                // handleOperate(OperateType.EDIT, record)
                handleView(record)
                break
            case 'del':
                setDelIds([record.id])
                setDelVisible(true)
                break
            case 'createTask':
                setSelectedItems([record])
                setCreateTaskType(TaskType.DATACOLLECTING)
                setCreateTaskVisible(true)
                break
            default:
                break
        }
    }

    const hasAccess = useMemo(() => {
        return checkPermission('manageBusinessModelAndBusinessDiagnosis')
    }, [checkPermission])

    const getOptionMenus = (record) => {
        // 不完整业务表 不展示的操作 (仅限于数据源导入的业务表)
        const incompleteKeys = [
            'standard',
            'f_dataCollecting',
            'f_dataProcessing',
            'createTask',
            'export',
        ]
        let optionMenus = getFormOptions(record, isButtonDisabled)
        if (!record.is_completed && record.form_type === NewFormType.DSIMPORT) {
            optionMenus = optionMenus.filter(
                (menu) => !incompleteKeys.includes(menu.key),
            )
        }
        if (!record.is_completed && record.form_type !== NewFormType.DSIMPORT) {
            optionMenus = optionMenus.filter(
                (menu) => menu.key !== 'createTask',
            )
        }

        optionMenus = optionMenus
            .filter((op) => checkPermission(op.access))
            .filter((op) => {
                if (
                    op.key === 'dataCollectingModel' ||
                    op.key === 'dataProcessingModel'
                ) {
                    return checkTask(op.key, true)
                }
                return checkTask(op.key)
            })
        if (optionMenus.length > 4) {
            return optionMenus.map((op, idx) => {
                if (idx >= 3) {
                    return { ...op, menuType: OptionMenuType.More }
                }
                return op
            })
        }
        return optionMenus
    }

    const handleView = (record) => {
        if (
            [
                FormTableKind.DATA_ORIGIN,
                FormTableKind.DATA_STANDARD,
                FormTableKind.DATA_FUSION,
            ].includes(record?.table_kind)
        ) {
            navigator(
                `/data-form-graph/view?mid=${modelId}&fid=${record.id}&defaultModel=view&redirect=${redirect.pathname}&defaultModel=view&targetTab=form&isDraft=${isDraft}&versionId=${selectedVersion}&auditMode=${isAuditMode}&isButtonDisabled=${isButtonDisabled}`,
            )
        } else if (record.form_type === NewFormType.DSIMPORT) {
            navigator(
                `/formGraph/importFromDS?&mid=${modelId}&fid=${
                    record.id
                }&dfid=${record.from_table_id}&isComplete=${
                    record.is_completed
                }&redirect=${
                    redirect.pathname
                }&defaultModel=view&targetTab=form&taskId=${
                    taskInfo.taskId || ''
                }&taskType=${taskInfo.taskType}&taskStatus=${
                    taskInfo.taskStatus
                }&isDraft=${isDraft}&versionId=${selectedVersion}&auditMode=${isAuditMode}&isButtonDisabled=${isButtonDisabled}`,
            )
        } else {
            navigator(
                `/formGraph/view?mid=${modelId}&fid=${record.id}&redirect=${
                    redirect.pathname
                }&defaultModel=view&targetTab=form&taskId=${
                    taskInfo.taskId || ''
                }&taskType=${taskInfo.taskType}&taskStatus=${
                    taskInfo.taskStatus
                }&taskExecutableStatus=${
                    taskInfo.taskExecutableStatus
                }&isDraft=${isDraft}&versionId=${selectedVersion}&auditMode=${isAuditMode}&isButtonDisabled=${isButtonDisabled}`,
            )
        }
    }

    // 原始/业务表格项
    const columnsOrst = (): ColumnsType<IFormItem & IFusionFormItem> => {
        const menuItems = getOptionMenus({})
        const dataFormKeys = ['name_desc', 'table_kind', 'updated_at']
        const cols: ColumnsType<IFormItem & IFusionFormItem> = [
            {
                title: (
                    <div>
                        <span>
                            {businessModelType === BizModelType.BUSINESS
                                ? __('业务表名称')
                                : __('数据表名称')}
                        </span>
                        <span style={{ color: 'rgba(0,0,0,0.45)' }}>
                            {__('（描述）')}
                        </span>
                    </div>
                ),
                fixed: 'left',
                dataIndex: 'name_desc',
                key: 'name_desc',
                ellipsis: true,
                render: (_, record) => (
                    <div className={styles.nameWrapper}>
                        <Tooltip
                            title={
                                FormTableKindOptions.find(
                                    (it) => it.value === record.table_kind,
                                )?.label
                            }
                        >
                            {record.table_kind === FormTableKind.BUSINESS ||
                            record.table_kind === FormTableKind.STANDARD ? (
                                <div
                                    className={classnames(
                                        styles.blankFormIcon,
                                        styles.formIconWrapper,
                                    )}
                                >
                                    <BlankFormColored />
                                </div>
                            ) : (
                                <div
                                    className={classnames(
                                        styles.importFormIcon,
                                        styles.formIconWrapper,
                                    )}
                                >
                                    <FontIcon
                                        type={IconType.COLOREDICON}
                                        name="icon-shujubiaoicon"
                                    />
                                </div>
                            )}
                        </Tooltip>

                        <div className={styles.showTableInfo}>
                            <div className={styles.topInfo}>
                                <div
                                    className={styles.firstName}
                                    title={record.name || '--'}
                                    onClick={() => handleView(record)}
                                >
                                    {record.name || '--'}
                                </div>
                                {!record.is_completed &&
                                    record.form_type ===
                                        NewFormType.DSIMPORT && (
                                        <Tooltip
                                            title={
                                                businessModelType ===
                                                BizModelType.BUSINESS
                                                    ? __('业务表字段属性不完整')
                                                    : __('数据表字段属性不完整')
                                            }
                                        >
                                            <ExclamationCircleOutlined
                                                className={styles.formTipsIcon}
                                            />
                                        </Tooltip>
                                    )}
                            </div>
                            <div
                                className={styles.bottomInfo}
                                title={record.description}
                            >
                                {record.description || __('暂无描述')}
                            </div>
                        </div>
                    </div>
                ),
            },
            {
                title: __('关联表'),
                dataIndex: 'source_table',
                key: 'source_table',
                ellipsis: true,
                render: (data, record) => (
                    <MultiLabelDisplay data={data} maxDisplayCount={1} />
                ),
            },
            // {
            //     title: __('标准化率'),
            //     dataIndex: 'field_standard_rate',
            //     key: 'field_standard_rate',
            //     width: 120,
            //     ellipsis: true,
            //     render: (value) => {
            //         const rate = getStandradRate(value)
            //         return (
            //             <div className={styles.baseTableRow} title={`${rate}`}>
            //                 {rate}
            //             </div>
            //         )
            //     },
            // },
            {
                title: (
                    <div>
                        <span>{__('关联节点')}</span>
                        <span style={{ color: 'rgba(0,0,0,0.45)' }}>
                            {__('（流程图）')}
                        </span>
                    </div>
                ),
                dataIndex: 'flowcharts',
                key: 'flowcharts',
                ellipsis: true,
                render: (flowcharts, record) =>
                    flowcharts?.length ? (
                        <MultiLabelDisplay
                            data={flowcharts?.map((item) => (
                                <div className={styles.flowChartItemWrapper}>
                                    <div
                                        className={styles.flowChartNodeName}
                                        title={item.node_name}
                                    >
                                        {item.node_name}
                                    </div>
                                    <div
                                        className={styles.flowChartNameWrapper}
                                    >
                                        <FontIcon
                                            name="icon-liuchengtu"
                                            type={IconType.COLOREDICON}
                                        />
                                        <span title={item.flowchart_name}>
                                            {item.flowchart_name}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            maxDisplayCount={1}
                        />
                    ) : (
                        <div className={styles.baseTableRow}>--</div>
                    ),
            },
            {
                title: __('业务标签'),
                dataIndex: 'label_list_resp',
                key: 'label_list_resp',
                ellipsis: true,
                render: (label_list_resp, record) =>
                    label_list_resp?.length ? (
                        <MultiLabelDisplay
                            data={label_list_resp?.map((item) => (
                                <div className={styles.flowChartItemWrapper}>
                                    <div
                                        className={styles.flowChartNodeName}
                                        title={item.name}
                                    >
                                        {item.name}
                                    </div>
                                </div>
                            ))}
                            maxDisplayCount={1}
                        />
                    ) : (
                        <div className={styles.baseTableRow}>--</div>
                    ),
            },

            // {
            //     title: __('数据范围'),
            //     dataIndex: 'data_range',
            //     key: 'data_range',
            //     width: 120,
            //     ellipsis: true,
            //     render: (dataRange) => (
            //         <div className={styles.baseTableRow}>
            //             {config?.data_range?.find(
            //                 (item) => item.value_en === dataRange,
            //             )?.value ||
            //                 dataRange ||
            //                 '--'}
            //         </div>
            //     ),
            // },
            {
                title: __('基础信息分类'),
                dataIndex: 'data_kind',
                key: 'data_kind',
                width: 240,
                ellipsis: true,
                render: (dataKind) => (
                    <Tooltip
                        title={
                            dataKind?.length ? (
                                <div className={styles.baseInfoTooltip}>
                                    {dataKind?.map((item) => (
                                        <span
                                            className={
                                                styles.listBaseInfoItemWrapper
                                            }
                                        >
                                            {config?.data_kind?.find(
                                                (configItem) =>
                                                    configItem.value_en ===
                                                    item,
                                            )?.value || item}
                                        </span>
                                    )) || '--'}
                                </div>
                            ) : (
                                ''
                            )
                        }
                        color="#fff"
                        overlayStyle={{ maxWidth: 500 }}
                        overlayInnerStyle={{ color: 'rgba(0,0,0,0.85)' }}
                        placement="bottom"
                    >
                        <div className={styles.listBaseInfoWrapper}>
                            <Paragraph
                                ellipsis={{ rows: 1 }}
                                style={{ marginBottom: 0 }}
                            >
                                {dataKind?.length > 0
                                    ? dataKind?.map((item) => (
                                          <span
                                              className={
                                                  styles.listBaseInfoItemWrapper
                                              }
                                          >
                                              {config?.data_kind?.find(
                                                  (configItem) =>
                                                      configItem.value_en ===
                                                      item,
                                              )?.value || item}
                                          </span>
                                      ))
                                    : '--'}
                            </Paragraph>
                        </div>
                    </Tooltip>
                ),
            },

            {
                title: __('类型'),
                dataIndex: 'table_kind',
                key: 'table_kind',
                render: (table_kind, record) =>
                    FormTableKindOptions?.find(
                        (configItem) => configItem.value === table_kind,
                    )?.label ||
                    table_kind ||
                    '--',
                width: 120,
            },
            {
                title: (
                    <div>
                        <span>{__('更新人')}</span>
                        <span style={{ color: 'rgba(0,0,0,0.45)' }}>
                            {__('（时间）')}
                        </span>
                    </div>
                ),
                dataIndex: 'updated_at',
                key: 'updated_at',
                sorter: true,
                sortOrder: updateSortOrder,
                showSorterTooltip: false,
                render: (_, record) => (
                    <div className={styles.showTableInfo}>
                        <div
                            className={styles.topInfo}
                            title={record.updated_by || '--'}
                        >
                            {record.updated_by || '--'}
                        </div>
                        <div
                            className={styles.bottomInfo}
                            title={formatTime(record.updated_at)}
                        >
                            {formatTime(record.updated_at)}
                        </div>
                    </div>
                ),
            },
        ]
        return menuItems.length === 0 || !hasAccess
            ? cols
            : businessModelType === BizModelType.BUSINESS
            ? [
                  ...cols,
                  {
                      title: __('操作'),
                      fixed: 'right',
                      key: 'action',
                      width:
                          opearteWi(menuItems) *
                          (menuItems.length <= 2 ? 80 : 56),

                      render: (_: string, record) => (
                          <OptionBarTool
                              menus={getOptionMenus(record) as any[]}
                              onClick={(key, e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleOptionTable(key, record)
                              }}
                          />
                      ),
                  },
              ]
            : [
                  ...cols.filter((item) =>
                      dataFormKeys.includes(item.key as string),
                  ),
                  {
                      title: __('操作'),
                      fixed: 'right',
                      key: 'action',
                      width:
                          opearteWi(menuItems) *
                          (menuItems.length <= 2 ? 80 : 56),

                      render: (_: string, record) => (
                          <OptionBarTool
                              menus={getOptionMenus(record) as any[]}
                              onClick={(key, e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleOptionTable(key, record)
                              }}
                          />
                      ),
                  },
              ]
    }

    // 显示/隐藏搜索框
    const showSearch = useMemo(
        () =>
            queryParams.keyword !== '' || selectValue !== 0 || items.length > 0,
        [queryParams.keyword, selectValue, items],
    )

    // 空白显示
    const showEmpty = () => {
        const desc =
            !hasAccess || !checkTask(OperateType.CREATE) || !modelId ? (
                <span>{__('暂无数据')}</span>
            ) : businessModelType === BizModelType.BUSINESS ? (
                <div>
                    {__('点击')}【{__('新建')}】{__('按钮')}
                    {formType === FormType.STANDARD ? (
                        <span>{__('可新建或导入业务表单')}</span>
                    ) : (
                        <span>
                            {__('可导入')}
                            {formTypeArr[formType].value}
                            {__('单')}
                        </span>
                    )}
                    {/* {formType === FormType.STANDARD && (
                        <>
                            <Dropdown
                                menu={{
                                    items: menuItems,
                                    onClick: handleClickMenuItem,
                                }}
                            >
                                <Button type="link">【{__('新建')}】</Button>
                            </Dropdown>
                            <span>{__('按钮')}</span>
                        </>
                    )}
                    {formType === FormType.STANDARD ? (
                        <p>{__('可新建或导入业务表单')}</p>
                    ) : (
                        <span>
                            {__('可导入')}
                            {formTypeArr[formType].value}
                            {__('单')}
                        </span>
                    )} */}
                </div>
            ) : (
                <div>
                    {__('点击')}【{__('新建')}】{__('按钮')}
                    {__('可新建数据原始表、数据标准表或数据融合表')}
                </div>
            )
        return (
            <Empty
                desc={desc}
                iconSrc={
                    !checkTask(OperateType.CREATE) || !hasAccess
                        ? dataEmpty
                        : empty
                }
            />
        )
    }

    const menuItems: MenuProps['items'] = [
        {
            key: NewFormType.BLANK,
            label: __('业务表'),
        },
        // {
        //     key: NewFormType.DSIMPORT,
        //     label: __('数据源导入'),
        // },
        {
            key: OperateType.IMPORT,
            label: __('本地导入'),
        },
    ]
    const dataFormMenuItems = [
        {
            key: FormTableKind.DATA_ORIGIN,
            label: __('数据原始表'),
        },
        {
            key: FormTableKind.DATA_STANDARD,
            label: __('数据标准表'),
        },
        {
            key: FormTableKind.DATA_FUSION,
            label: __('数据融合表'),
        },
    ]

    const handleClickMenuItem = ({ key }) => {
        switch (key) {
            case NewFormType.BLANK:
                handleOperate(OperateType.CREATE)
                break
            // case NewFormType.DSIMPORT:
            //     setImportFromDSOpen(true)
            //     break
            case FormTableKind.DATA_ORIGIN:
                setCreateOriginFormOpen(true)
                break
            case FormTableKind.DATA_STANDARD:
                setCreateDataStandardOpen(true)
                break
            case FormTableKind.DATA_FUSION:
                setCreateDataFusionOpen(true)
                break
            case OperateType.IMPORT:
                handleOperate(OperateType.IMPORT)
                break
            default:
                break
        }
    }

    // 是否新建表权限
    const hasAddForm = useMemo(() => {
        return checkTask(OperateType.CREATE) && hasAccess && !!modelId
    }, [taskInfo, modelId])

    // 是否新建任务权限
    const hasAddTask = useMemo(() => {
        return (
            checkTask('createTask') &&
            checkPermission('manageDataOperationProject')
        )
    }, [taskInfo])

    const getRightOprContent = () => {
        return (
            <Space hidden={loading || !showSearch}>
                {!isCSPlatform &&
                    businessModelType === BizModelType.BUSINESS &&
                    checkTask('newStandard') && (
                        <Tooltip placement="bottom" title={__('待新建标准')}>
                            <div
                                className={styles.newStandardIcon}
                                onClick={() => setAddStandardVisible(true)}
                            >
                                <StandardOutlined
                                    style={{
                                        fontSize: 18,
                                        marginRight: 8,
                                    }}
                                />
                                <span>{__('待新建标准')}</span>
                            </div>
                        </Tooltip>
                    )}
                <SearchInput
                    placeholder={
                        businessModelType === BizModelType.BUSINESS
                            ? `${__('搜索业务表名称')}`
                            : `${__('搜索数据表名称')}`
                    }
                    onKeyChange={(kw: string) => {
                        setSearchKey(kw)
                        handleSearchPressEnter(kw)
                    }}
                    onPressEnter={handleSearchPressEnter}
                    style={{ width: 272 }}
                />
                <Space size={0}>
                    <SortBtn
                        contentNode={
                            <DropDownFilter
                                menus={
                                    formType === FormType.STANDARD
                                        ? menusStd
                                        : menus
                                }
                                defaultMenu={menuValue || defaultMenu}
                                changeMenu={menuValue}
                                menuChangeCb={handleSortWayChange}
                            />
                        }
                    />
                    <RefreshBtn
                        onClick={() =>
                            getList({
                                ...queryParams,
                                keyword: searchKey,
                                current: 1,
                            })
                        }
                    />
                </Space>
            </Space>
        )
    }

    return (
        <FieldsInfoProvider>
            {/* 手动植入支持读取context的contextHolder */}
            {contextHolder}
            <div className={styles.formWrapper}>
                <div className={styles.formTitle}>
                    <div className={styles['title-line']}>
                        {businessModelType === BizModelType.BUSINESS
                            ? __('业务表')
                            : __('数据表')}
                        {taskInfo.taskId &&
                            taskInfo.taskStatus !== TaskStatus.COMPLETED && (
                                <ModelOperate modelId={modelId} />
                            )}
                    </div>
                    {!hasAddForm && !hasAddTask && getRightOprContent()}
                </div>
                <div className={styles.content} ref={contRef}>
                    <div
                        className={styles.topWrapper}
                        hidden={loading || (!hasAddForm && !hasAddTask)}
                    >
                        <div className={styles.leftWrapper}>
                            {/* <Space className={styles.dividerWrapper} size={2}>
                            <span
                                onClick={() => {
                                    setFormType(FormType.ORIGINAL)
                                    setSearchKey('')
                                }}
                                className={classnames(
                                    styles.dividerTitle,
                                    formType === FormType.ORIGINAL &&
                                        styles.titleSelected,
                                )}
                                hidden={
                                    taskInfo.taskType === TaskType.Standardize
                                }
                            >
                                {`${__('原始表')} (${formatCount(
                                    fmCount?.origin_count || 0,
                                )})`}
                            </span>
                            {taskInfo?.taskType !== TaskType.Standardize && (
                                <Divider
                                    type="vertical"
                                    className={styles.divider}
                                />
                            )}
                            <span
                                onClick={() => {
                                    setFormType(FormType.STANDARD)
                                    setSearchKey('')
                                }}
                                className={classnames(
                                    styles.dividerTitle,
                                    taskInfo?.taskType !==
                                        TaskType.Standardize &&
                                        formType === FormType.STANDARD &&
                                        styles.titleSelected,
                                )}
                                style={
                                    taskInfo?.taskType === TaskType.Standardize
                                        ? { cursor: 'unset' }
                                        : undefined
                                }
                            >
                                {`${__('业务表')} (${formatCount(
                                    fmCount?.standard_count || 0,
                                )})`}
                            </span>
                            {taskInfo?.taskType !== TaskType.Standardize && (
                                <Divider
                                    type="vertical"
                                    className={styles.divider}
                                />
                            )}
                            <span
                                onClick={() => {
                                    setFormType(FormType.FUSION)
                                    setSearchKey('')
                                }}
                                className={classnames(
                                    styles.dividerTitle,
                                    formType === FormType.FUSION &&
                                        styles.titleSelected,
                                )}
                                hidden={
                                    taskInfo.taskType === TaskType.Standardize
                                }
                            >
                                {`${__('融合表')} (${formatCount(
                                    fmCount?.fusion_count || 0,
                                )})`}
                            </span>
                        </Space> */}
                            <div className={styles.operateWrapper}>
                                {/* <span
                                className={styles.btnWrapper}
                                hidden={formType === FormType.STANDARD}
                            >
                                <Button
                                    type="primary"
                                    className={styles.operateBtn}
                                    onClick={() =>
                                        handleOperate(OperateType.IMPORT)
                                    }
                                >
                                    <ImportOutlined />
                                    {__('导入表单')}
                                </Button>
                            </span> */}
                                <Dropdown
                                    menu={{
                                        items:
                                            businessModelType ===
                                            BizModelType.BUSINESS
                                                ? menuItems
                                                : dataFormMenuItems,
                                        onClick: handleClickMenuItem,
                                    }}
                                    disabled={isButtonDisabled}
                                >
                                    <Button
                                        type="primary"
                                        icon={<AddOutlined />}
                                        hidden={!hasAddForm}
                                        style={{ marginRight: 12 }}
                                        disabled={isButtonDisabled}
                                        title={
                                            isButtonDisabled
                                                ? __('审核中，无法操作')
                                                : ''
                                        }
                                    >
                                        {__('新建')} <CaretDownOutlined />
                                    </Button>
                                </Dropdown>
                                <Space
                                    size={12}
                                    style={{ marginRight: 12 }}
                                    hidden={!hasAddForm || !showSearch}
                                >
                                    {businessModelType ===
                                        BizModelType.BUSINESS &&
                                        !isCSPlatform && (
                                            <CreateTaskSelect
                                                taskItems={[
                                                    TaskType.DATACOLLECTING,
                                                ]}
                                                disabled={
                                                    selectedItems.length ===
                                                        0 ||
                                                    // 从数据源导入的业务表且未完善保存的
                                                    selectedItems.find(
                                                        (item) =>
                                                            !item.is_completed,
                                                    ) ||
                                                    isButtonDisabled
                                                }
                                                onSelected={(type) => {
                                                    setCreateTaskType(type)
                                                    setCreateTaskVisible(true)
                                                }}
                                                hidden={
                                                    !hasAddTask || !showSearch
                                                }
                                                btnText={__('新建数据开发任务')}
                                                title={
                                                    isButtonDisabled
                                                        ? __('审核中，无法操作')
                                                        : __(
                                                              '选择业务表创建数据开发任务',
                                                          )
                                                }
                                            />
                                        )}
                                    <Button
                                        onClick={() => {
                                            setDelIds(
                                                selectedItems.map(
                                                    (item) => item.id,
                                                ),
                                            )
                                            setDelVisible(true)
                                        }}
                                        disabled={
                                            selectedItems.length === 0 ||
                                            isButtonDisabled
                                        }
                                    >
                                        {__('删除')}
                                    </Button>
                                </Space>
                            </div>
                        </div>
                        <div
                            className={styles.rightWrapper}
                            hidden={!hasAddForm && !hasAddTask}
                        >
                            {getRightOprContent()}
                        </div>
                    </div>
                    <div className={styles.empty} hidden={!loading}>
                        <Loader />
                    </div>
                    <div
                        ref={formsListRef}
                        className={styles.formsList}
                        hidden={loading || !showSearch}
                    >
                        <Table
                            columns={columnsOrst()}
                            rowClassName={styles.tableRow}
                            dataSource={items}
                            loading={fetching}
                            pagination={{ position: [] }}
                            scroll={{
                                x: 900,
                                y:
                                    items.length > 0
                                        ? total > 10
                                            ? 'calc(100vh - 350px)'
                                            : 'calc(100vh - 308px)'
                                        : undefined,
                            }}
                            locale={{
                                emptyText: <Empty />,
                            }}
                            rowKey="id"
                            rowSelection={
                                checkTasks(['createTask', 'del'], false) &&
                                checkPermission('manageDataOperationProject')
                                    ? rowSelection
                                    : undefined
                            }
                            onChange={(pagination, filters, sorter) =>
                                handleTableChange(sorter)
                            }
                        />
                        <Pagination
                            current={queryParams.current}
                            pageSize={queryParams.pageSize}
                            onChange={(page) => {
                                getList({
                                    ...queryParams,
                                    current: page,
                                })
                            }}
                            className={styles.pagination}
                            total={total}
                            showSizeChanger={false}
                            hideOnSinglePage
                        />
                    </div>
                    <div
                        className={styles.empty}
                        hidden={loading || showSearch}
                    >
                        {showEmpty()}
                    </div>

                    <Confirm
                        open={delVisible}
                        title={`确认要删除${
                            businessModelType === BizModelType.BUSINESS
                                ? '业务表'
                                : '数据表'
                        }吗？`}
                        content={__(
                            '此表可能被其他数据表关联，删除后无法恢复，请谨慎操作！',
                        )}
                        onOk={() => handleDelete()}
                        onCancel={() => handleOperateCancel(OperateType.DELETE)}
                        okButtonProps={{ loading: deleting }}
                        width={432}
                    />
                    <ImportForm
                        visible={importVisible}
                        formType={formType}
                        mid={modelId}
                        update={() => {
                            getList(queryParams)
                        }}
                        onClose={() => {
                            handleOperateCancel(OperateType.IMPORT)
                        }}
                    />
                    {/* <EditStandardForm
                    type={operateType}
                    visible={editVisible}
                    mid={modelId}
                    formItem={formItem}
                    config={config}
                    onClose={() => {
                        handleOperateCancel(OperateType.EDIT)
                        getList(queryParams)
                    }}
                    update={() => getList(queryParams)}
                /> */}
                    {createVisible && (
                        <CreateForm
                            onClose={() => {
                                handleOperateCancel(OperateType.CREATE)
                                getList(queryParams)
                            }}
                            mid={modelId}
                            onUpdate={() => {
                                refreshListWithDraft(queryParams)
                            }}
                            taskId={taskInfo.taskId}
                            taskType={taskInfo.taskType}
                            configEnum={config}
                        />
                    )}
                    {editVisible && (
                        <EditForm
                            onClose={() => {
                                handleOperateCancel(OperateType.EDIT)
                                getList(queryParams)
                            }}
                            formId={formItem.id}
                            mid={modelId}
                            onUpdate={() => {
                                refreshListWithDraft(queryParams)
                            }}
                            taskId={taskInfo.taskId}
                        />
                    )}
                    <Details
                        visible={detailVisible}
                        formType={formType}
                        mid={modelId}
                        formItem={formItem}
                        standardEnum={standardEnum}
                        configEnum={config}
                        onClose={() => {
                            handleOperateCancel(OperateType.DETAIL)
                            getList(queryParams)
                        }}
                    />
                    {standardVisible && (
                        <Standardizing
                            visible={standardVisible}
                            coreBizName={coreBizName}
                            mid={modelId}
                            mbid={pMbid}
                            fid={formItem?.id}
                            name={formItem?.name}
                            fType={formItem?.form_type}
                            standardEnum={standardEnum}
                            config={config}
                            alertOpen={alertOpen}
                            newStandardSum={newStandardSum}
                            onSetAlertOpen={(info) => setAlertOpen(info)}
                            onClose={() => {
                                handleOperateCancel(OperateType.STANDARDING)
                                getList(queryParams)
                                setAlertOpen(false)
                            }}
                            onSure={() => {
                                handleOperateCancel(OperateType.STANDARDING)
                                getList(queryParams)
                                setAlertOpen(false)
                            }}
                            getContainer={contRef?.current}
                            tableKind={formItem?.table_kind}
                        />
                    )}
                    {addStandardVisible && (
                        <ReqAddStandard
                            open={addStandardVisible}
                            coreBizName={coreBizName}
                            showStateTabs={showStateTabs}
                            fid={formItem?.id}
                            mbid={pMbid}
                            // titleText={__('业务表')}
                            onClose={() => {
                                getList(queryParams)
                                setAddStandardVisible(false)
                            }}
                            onSure={() => {
                                // getList(queryParams)
                                // setAddStandardVisible(false)
                            }}
                            getContainer={contRef?.current}
                        />
                    )}
                    <CreateTask
                        show={createTaskVisible}
                        operate={OperateType.CREATE}
                        title={__('新建任务')}
                        defaultData={createTaskData}
                        isSupportFreeTask
                        onClose={(val) => {
                            if (val) {
                                setSelectedItems([])
                            }
                            setCreateTaskVisible(false)
                            setCreateTaskType(undefined)
                        }}
                    />
                    {/* <ImportFromDataSource
                        open={importFromDSOpen}
                        onClose={() => setImportFromDSOpen(false)}
                        mid={modelId}
                        onUpdate={() => getList(queryParams)}
                        taskId={taskInfo.taskId}
                        taskType={taskInfo.taskType}
                        pMbid={pMbid}
                    /> */}
                    {/* 完善业务表 */}
                    {completeFormOpen && (
                        <CreateForm
                            onClose={() => {
                                setCompleteFormOpen(false)
                                getList(queryParams)
                            }}
                            mid={modelId}
                            onUpdate={() => {
                                refreshListWithDraft(queryParams)
                            }}
                            taskId={taskInfo.taskId}
                            taskType={taskInfo.taskType}
                            formType={NewFormType.DSIMPORT}
                            formInfo={formItem}
                        />
                    )}

                    {createOriginFormOpen && (
                        <CreateDataOriginForm
                            visible={createOriginFormOpen}
                            onClose={() => {
                                setCreateOriginFormOpen(false)
                            }}
                            onConfirm={() => {
                                refreshListWithDraft({
                                    ...queryParams,
                                    searchKey,
                                    current: 1,
                                })
                                setCreateOriginFormOpen(false)
                            }}
                            mid={modelId}
                        />
                    )}
                    {createDataStandardOpen && (
                        <CreateDataStandardForm
                            visible={createDataStandardOpen}
                            onClose={() => {
                                setCreateDataStandardOpen(false)
                            }}
                            onConfirm={() => {
                                // 待跳转
                                refreshListWithDraft({
                                    ...queryParams,
                                    searchKey,
                                    current: 1,
                                })
                                setCreateDataStandardOpen(false)
                            }}
                            mid={modelId}
                            taskId={taskInfo.taskId}
                        />
                    )}
                    {createDataFusionOpen && (
                        <CreateDataFusion
                            visible={createDataFusionOpen}
                            onClose={() => {
                                setCreateDataFusionOpen(false)
                            }}
                            onConfirm={() => {
                                // 待跳转
                                refreshListWithDraft({
                                    ...queryParams,
                                    searchKey,
                                    current: 1,
                                })
                                setCreateDataFusionOpen(false)
                            }}
                            mid={modelId}
                            taskId={taskInfo.taskId}
                        />
                    )}
                </div>
            </div>
        </FieldsInfoProvider>
    )
}

export default Forms
