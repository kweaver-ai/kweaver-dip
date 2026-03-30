import {
    ArrowLeftOutlined,
    ArrowRightOutlined,
    CaretDownOutlined,
    CaretUpOutlined,
    CheckCircleFilled,
    InfoCircleFilled,
    LeftOutlined,
} from '@ant-design/icons'
import { Button, Col, Dropdown, List, message, Row, Tabs, Tooltip } from 'antd'
import { debounce } from 'lodash'
import { FC, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FrameworkContext, TaskInfoContext } from '@/context'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import {
    BusinessAuditStatus,
    completeStdTask,
    editTask,
    formatError,
    getBusinessDomainTreeNodeDetails,
    getCoreBusinessDetails,
    getPolicyProcessList,
    getStdTaskProcess,
    getTaskDetail,
    getTasks,
    IStdTaskProcess,
    LoginPlatform,
    messageError,
    submitModalAudit,
    TaskConfigStatus,
    TaskExecutableStatus,
    TaskStatus,
    TaskType,
} from '@/core'
import { TaskDetail } from '@/core/apis/taskCenter/index.d'
import { useTaskCheck } from '@/hooks/useTaskCheck'
import { InfotipOutlined } from '@/icons'
import Empty from '@/ui/Empty'
import { getPlatformNumber, useQuery } from '@/utils'
import { confirm } from '@/utils/modalHelper'
import dataEmpty from '../../assets/dataEmpty.svg'
import { PolicyType } from '../AuditPolicy/const'
import { products, totalOperates } from '../BusinessModeling/ContentTabs'
import { TabKey } from '../BusinessModeling/const'
import GlobalMenu from '../GlobalMenu'
import { ProjectStatus } from '../ProjectManage/types'
import TaskDetails from '../TaskComponents/TaskDetails'
import { getTaskTypeIcon } from '../TaskComponents/helper'
import NavTaskCardItem from './NavTaskCardItem'
import __ from './locale'
import styles from './styles.module.less'

const CompleteTaskHeader: FC = () => {
    const { taskInfo, setTaskInfo } = useContext(TaskInfoContext)
    const { checkPermission } = useUserPermCtx()
    const { checkTask } = useTaskCheck(totalOperates, products, taskInfo)
    const { appProps } = useContext(FrameworkContext)
    const query = useQuery()
    const navigate = useNavigate()
    // 任务id
    const taskId = query.get('taskId') || ''
    // 项目id
    const projectId = query.get('projectId') || ''
    const [taskDetails, setTaskDetails] = useState<TaskDetail>()
    const [detailVisible, setDetailVisible] = useState<boolean>(false)

    // 下拉菜单显示/隐藏
    const [listShow, setListShow] = useState(false)
    const [auditLoading, setAuditLoading] = useState(false)
    // 任务集
    const [taskItems, setTaskItems] = useState<any[]>([])
    const [fetching, setFetching] = useState(false)
    // 完成任务禁用状态
    const [compDisabled, setCompDisabled] = useState(true)
    // 任务进度
    const [taskProgress, setTaskProgress] = useState<IStdTaskProcess>()
    // 业务梳理模块
    const [activeKey, setActiveKey] = useState<TabKey | undefined>()
    const platform = getPlatformNumber()

    useEffect(() => {
        const disabled =
            taskInfo?.field_finish_number !== taskInfo?.field_total_number
        setCompDisabled(disabled)
    }, [taskInfo?.field_finish_number])

    const [hasProcess, setHasProcess] = useState<boolean>(false)

    const getProcess = async (audit_type) => {
        try {
            const res = await getPolicyProcessList({
                audit_type,
            })
            setHasProcess(res?.total_count > 0)
        } catch (err) {
            formatError(err)
        }
    }

    // 获取任务详情
    const getDetails = async () => {
        if (taskId) {
            try {
                setTaskInfo((prev) => ({ ...prev, taskLoading: true }))
                const res = await getTaskDetail(taskId)
                setTaskDetails({ ...res })
                const {
                    status,
                    subject_domain_id,
                    subject_domain_name,
                    task_type,
                    executable_status,
                    main_business_id,
                    business_model_id,
                    data_model_id,
                    domain_id = '',
                } = res

                let processInfo
                if (domain_id && (!business_model_id || !data_model_id)) {
                    // 根据流程id 获取详情中的模型id
                    processInfo = await getBusinessDomainTreeNodeDetails(
                        domain_id,
                    )
                }

                const targetTab = query.get('targetTab')
                let tab
                if (targetTab) {
                    tab = targetTab
                } else if (task_type === TaskType.FIELDSTANDARD) {
                    tab = TabKey.TOBEEXECUTE
                } else if (task_type === TaskType.MODELINGDIAGNOSIS) {
                    tab = TabKey.DIAGNOSIS
                } else if (task_type === TaskType.MAINBUSINESS) {
                    tab = TabKey.COMBED
                } else if (task_type === TaskType.STANDARDNEW) {
                    tab = TabKey.STANDARD
                } else if (
                    [TaskType.MODEL, TaskType.DATAMODELING].includes(
                        task_type as TaskType,
                    )
                ) {
                    tab = TabKey.FORM
                }

                // 新建标准类型
                if (task_type === TaskType.FIELDSTANDARD) {
                    // await getTaskProgress()
                    const { data: taskProgressData } = await getStdTaskProcess(
                        taskId,
                    )
                    setTaskProgress(taskProgressData)
                    const disabled =
                        taskProgressData.finish_number !==
                        taskProgressData.total_number
                    setCompDisabled(disabled)
                    setTaskInfo((prev) => ({
                        ...prev,
                        ...res,
                        taskType: task_type,
                        taskStatus: status,
                        taskId,
                        domainId: subject_domain_id, // 废弃
                        subDomainId: subject_domain_id,
                        subDomainName: subject_domain_name,
                        projectId,
                        coreBusinessId: main_business_id,
                        taskExecutableStatus: executable_status,
                        modelId: business_model_id || processInfo?.model_id,
                        tabKey: tab,
                        processInfo,
                        field_finish_number: taskProgressData?.finish_number,
                        field_total_number: taskProgressData?.total_number,
                        taskLoading: false,
                    }))
                } else {
                    setCompDisabled(false)
                    setTaskInfo((prev) => ({
                        ...prev,
                        ...res,
                        taskType: task_type,
                        taskStatus: status,
                        taskId,
                        domainId: subject_domain_id, // 废弃
                        subDomainId: subject_domain_id,
                        subDomainName: subject_domain_name,
                        projectId,
                        coreBusinessId: main_business_id,
                        taskExecutableStatus: executable_status,
                        modelId:
                            task_type === TaskType.DATAMODELING
                                ? data_model_id || processInfo?.data_model_id
                                : business_model_id || processInfo?.model_id,
                        tabKey: tab,
                        processInfo,
                        taskLoading: false,
                    }))
                }

                setActiveKey(tab)
            } catch (error) {
                setTaskDetails(taskItems.find((t) => t.id === taskId) || {})
                getErrorMessage(error)
                setTaskInfo((prev) => ({ ...prev, taskLoading: false }))
            }
        }
    }

    // 当前任务的索引
    const currentIdx = useMemo(() => {
        const current = taskItems.find((t) => t.id === taskId)
        return taskItems.indexOf(current)
    }, [taskId, taskItems])

    // 是否是第一个
    const isFirst = useMemo(() => {
        if (currentIdx === -1) {
            return true
        }
        return currentIdx === 0
    }, [currentIdx])

    // 是否是最后一个
    const isLast = useMemo(() => {
        if (currentIdx === -1) {
            return true
        }
        return currentIdx === taskItems.length - 1
    }, [currentIdx, taskItems])

    // 获取任务进度-标准任务
    const getTaskProgress = async () => {
        if (!taskId) return
        try {
            const res = await getStdTaskProcess(taskId)
            const data = res?.data || {}
            setTaskProgress(data)
            // 新建标准任务需要获取进度
            const disabled = data.ish_number !== data.total_number
            setCompDisabled(disabled)
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        getDetails()
    }, [taskId])

    useEffect(() => {
        getTaskList()
    }, [])

    // 完成
    const handleCompleted = () => {
        confirm({
            title: __('确认要“完成任务”吗？'),
            content: __(
                '点击【完成任务】后，该任务状态将自动变更为“已完成”，您无法再次修改任务，请谨慎操作！',
            ),
            icon: <InfoCircleFilled style={{ color: '#126EE3' }} />,
            okText: __('确定'),
            cancelText: __('取消'),
            onOk: debounce(() => handleConfirmCompleteTask(), 2000, {
                leading: true,
                trailing: false,
            }),
        })
    }

    // 完成任务请求
    const handleConfirmCompleteTask = async () => {
        try {
            if (taskDetails?.task_type === TaskType.FIELDSTANDARD) {
                // 完成新建标准任务需要通知标准化后端
                await completeStdTask(taskId)
            }
            const res = await editTask(taskId, {
                name: taskDetails?.name,
                status: ProjectStatus.COMPLETED,
                project_id: projectId,
            })
            // 判断是否有因上一个完成可以执行的任务
            const openArrs = res?.next_executables
            if (openArrs && openArrs.length > 0) {
                message.success(__('任务已完成，自动为您跳转下一条任务'))
                getTaskList(openArrs[0])
                return
            }
            // 默认执行完成任务的下一个任务
            if (!isLast) {
                message.success(__('任务已完成，自动为您跳转下一条任务'))
                getTaskList(taskItems[currentIdx + 1]?.id)
                return
            }
            // 最后一个任务完成跳回到第一个任务
            if (taskItems.length > 1) {
                message.success(__('任务已完成，自动为您跳转下一条任务'))
                getTaskList(taskItems[0].id)
                return
            }
            message.success(__('任务已完成'))
            // 所有任务完成直接返回
            handleReturn()
        } catch (error) {
            getTaskList()
            getErrorMessage(error)
        }
    }

    // 请求错误处理
    const getErrorMessage = (error) => {
        switch (error?.data?.code) {
            case 'TaskCenter.Task.TaskDomainNotExist':
                return messageError(__('关联业务领域或业务模型被删除'))
            case 'TaskCenter.Task.TaskMainBusinessDeleted':
                return messageError(__('该业务模型已被删除，任务失效'))
            default:
                return formatError(error)
        }
    }

    // 返回
    const handleReturn = () => {
        const backUrl = query.get('backUrl')
        if (
            !(backUrl && !['null', 'undefined'].includes(backUrl)) &&
            platform === LoginPlatform.drmb
        ) {
            navigate('/workOrderTask')
            return
        }
        // const backArr = backUrl?.split('/')
        // // 更换返回路径的项目id
        // if (backArr?.includes('project')) {
        //     // 判断是否为游离任务
        //     if (taskDetails?.project_id) {
        //         const idx = backArr.indexOf('project')
        //         backArr.splice(idx + 1, 1, projectId)
        //         backUrl = backArr.join('/')
        //     } else {
        //         // 游离任务返回我的执行页面
        //         backUrl = '/taskCenter/task?state=processed'
        //     }
        // }
        // 不存在返回首页
        navigate(
            backUrl && !['null', 'undefined'].includes(backUrl)
                ? backUrl
                : '/taskCenter/task',
        )
    }

    // 切换上一个
    const handleUp = () => {
        handleChangeTask(taskItems[currentIdx - 1])
    }

    // 切换下一个
    const handleDown = () => {
        handleChangeTask(taskItems[currentIdx + 1])
    }

    // 更改任务状态
    const changeTaskStatus = async (item) => {
        try {
            await editTask(item?.id, {
                name: item?.name,
                status: TaskStatus.ONGOING,
                project_id: item?.project_id || '',
            })
        } catch (e) {
            getErrorMessage(e)
        }
    }

    const isWorkOrderTask = (task_type?: string) => {
        return [TaskType.DATACOMPREHENSIONWWORKORDER].includes(
            task_type as TaskType,
        )
    }

    // 切换任务
    const handleChangeTask = (item) => {
        setListShow(false)
        // 任务状态未开始时调整状态
        if (item.status === TaskStatus.READY) {
            changeTaskStatus(item)
        }
        if (item.task_type === TaskType.DATACOLLECTING) {
            const url = `/dataDevelopment/dataSynchronization?projectId=${
                item?.project_id
            }&taskId=${item?.id}&backUrl=${query.get('backUrl')}`
            if (taskDetails?.task_type === TaskType.DATACOLLECTING) {
                navigate(url)
            } else {
                navigate(url)
            }
        } else if (item.task_type === TaskType.INDICATORPROCESSING) {
            const url = `/dataDevelopment/indictorManage?projectId=${
                item?.project_id
            }&taskId=${item?.id}&backUrl=${query.get('backUrl')}`
            if (taskDetails?.task_type === TaskType.INDICATORPROCESSING) {
                navigate(url)
            } else {
                navigate(url)
            }
        } else {
            const url = `/${
                isWorkOrderTask(item?.task_type)
                    ? 'complete-work-order-task'
                    : 'complete-task'
            }?projectId=${item?.project_id}&taskId=${
                item?.id
            }&backUrl=${query.get('backUrl')}`
            if (taskDetails?.task_type === TaskType.DATACOLLECTING) {
                navigate(url)
            } else {
                navigate(url)
            }
        }
    }

    // 获取任务列表
    const getTaskList = async (nextId?) => {
        setFetching(true)
        try {
            const res = await getTasks({
                limit: 100, // 0
                is_create: false,
                executable_status: TaskExecutableStatus.EXECUTABLE,
                exclude_task_type: TaskType.NORMAL,
            })
            // 过滤失效状态
            const list =
                res?.entries?.filter(
                    (t) =>
                        !Object.values(TaskConfigStatus)
                            .filter((v) => v !== TaskConfigStatus.NORMAL)
                            .includes(t.config_status as any),
                ) || []
            setTaskItems(list)
            // 确定下一个任务
            if (nextId && list.length > 0) {
                const nextTask = list?.find((t) => t.id === nextId)
                if (nextTask) {
                    handleChangeTask(nextTask)
                } else {
                    handleChangeTask(list[0])
                }
            }
        } catch (e) {
            setTaskItems([])
            // formatError(e)
        } finally {
            setFetching(false)
        }
    }

    // 导航弹窗组件
    const naviDropDown = () => (
        <div
            className={styles.dd_wrapper}
            style={{
                maxHeight: window.innerHeight * 0.66,
            }}
        >
            <div className={styles.dd_titleWrapper}>
                <span className={styles.dd_title}>{__('任务清单')}</span>
                <span className={styles.dd_subTitle}>
                    {__('普通任务不在清单中展示')}
                </span>
            </div>
            <List
                dataSource={taskItems}
                renderItem={(item) => (
                    <List.Item key={item.id} style={{ padding: '8px 0' }}>
                        <NavTaskCardItem
                            data={item}
                            selected={taskId === item.id}
                            onSelected={() => handleChangeTask(item)}
                        />
                    </List.Item>
                )}
                locale={{
                    emptyText: (
                        <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
                    ),
                }}
                loading={fetching}
                className={styles.dd_list}
                split={false}
            />
        </div>
    )

    const getTabs = () => {
        if (taskDetails?.task_type === TaskType.FIELDSTANDARD) {
            return [
                // {
                //     key: StdTaskType.TOBEEXECUTE,
                //     label: `${__('待执行')} ${
                //         isNumber(taskProgress?.undone_num)
                //             ? `(${taskProgress?.undone_num})`
                //             : ''
                //     }`,
                // },
                // {
                //     key: StdTaskType.COMPLETED,
                //     label: `${__('已完成')} ${
                //         isNumber(taskProgress?.done_num)
                //             ? `(${taskProgress?.done_num})`
                //             : ''
                //     }`,
                // },
            ]
        }
        if (taskDetails?.task_type === TaskType.DATAMODELING) {
            return [
                {
                    label: __('数据表'),
                    key: TabKey.FORM,
                    access: 'manageBusinessModelAndBusinessDiagnosis',
                },
                {
                    label: __('数据指标'),
                    key: TabKey.INDICATOR,
                    access: 'manageBusinessModelAndBusinessDiagnosis',
                },
            ]
        }
        const tabs = [
            {
                label: __('业务表'),
                key: TabKey.FORM,
                access: 'manageBusinessModelAndBusinessDiagnosis',
            },
            {
                label: __('流程图'),
                key: TabKey.PROCESS,
                access: 'manageBusinessModelAndBusinessDiagnosis',
            },
            {
                label: __('业务指标'),
                key: TabKey.INDICATOR,
                access: 'manageBusinessModelAndBusinessDiagnosis',
            },
        ]
        return tabs
            .filter((t) => checkPermission(t.access))
            ?.filter((t) => checkTask(t.key, true))
    }

    // 获取业务模型详情
    const getCoreBizDetails = async () => {
        if (!taskInfo.modelId) {
            return
        }
        try {
            const res = await getCoreBusinessDetails(taskInfo.modelId)

            setTaskInfo((prev) => ({
                ...prev,
                modelAuditStatus: res?.audit_status,
            }))
        } catch (error) {
            formatError(error)
        }
    }

    // 业务模型 数据模型发布审核
    const handleAudit = async () => {
        const { modelId, task_type } = taskInfo || {}
        let auditType = ''
        switch (task_type) {
            case TaskType.MODEL:
                auditType = PolicyType.AfBgPublishBusinessModel
                break
            case TaskType.DATAMODELING:
                auditType = PolicyType.AfBgPublishDataModel
                break
            default:
                break
        }
        try {
            setAuditLoading(true)
            await submitModalAudit(modelId, auditType)
            message.success(__('提交审核成功'))
            getCoreBizDetails()
        } catch (error) {
            formatError(error)
        } finally {
            setAuditLoading(false)
        }
    }

    const showAuditTask = useMemo(() => {
        const needAudit = [TaskType.MODEL, TaskType.DATAMODELING].includes(
            taskDetails?.task_type as TaskType,
        )
        if (
            needAudit ||
            [TaskType.MODELINGDIAGNOSIS, TaskType.MAINBUSINESS].includes(
                taskDetails?.task_type as TaskType,
            )
        ) {
            let auditType = ''
            switch (taskDetails?.task_type) {
                case TaskType.MODEL:
                    auditType = PolicyType.AfBgPublishBusinessModel
                    break
                case TaskType.DATAMODELING:
                    auditType = PolicyType.AfBgPublishDataModel
                    break
                case TaskType.MODELINGDIAGNOSIS:
                    auditType = PolicyType.AfBgPublishBusinessDiagnosis
                    break
                case TaskType.MAINBUSINESS:
                    auditType = PolicyType.AfBgPublishMainBusiness
                    break
                default:
                    break
            }
            getProcess(auditType)
        } else {
            setHasProcess(false)
        }
        return needAudit
    }, [taskDetails])

    useEffect(() => {
        // 需手动提交审核任务  配置了流程且审核非通过状态
        if (showAuditTask) {
            setCompDisabled(
                hasProcess &&
                    taskInfo?.modelAuditStatus !==
                        BusinessAuditStatus.Published,
            )
        } else if (hasProcess) {
            setCompDisabled(!taskInfo?.isAllPass)
        } else {
            setCompDisabled(false)
        }
    }, [
        taskInfo?.modelAuditStatus,
        taskInfo?.isAllPass,
        hasProcess,
        showAuditTask,
    ])

    return (
        <div className={styles.completeTaskHeaderWrap}>
            <Row className={styles.cth_rowWrap}>
                <Col className={styles.cth_colWrap} span={8}>
                    <GlobalMenu />
                    <div className={styles.nameWrapper}>
                        <div
                            className={styles.returnWrapper}
                            onClick={handleReturn}
                        >
                            <LeftOutlined />
                            <div className={styles.return}>{__('返回')}</div>
                        </div>
                        {taskId && (
                            <>
                                <Dropdown
                                    trigger={['click']}
                                    dropdownRender={() => naviDropDown()}
                                    getPopupContainer={(n) => n}
                                    onOpenChange={(bo) => {
                                        if (bo) {
                                            getTaskList()
                                        }
                                        setListShow(bo)
                                    }}
                                    open={listShow}
                                    overlayStyle={{ width: 336 }}
                                    disabled={
                                        taskDetails?.executable_status !==
                                        TaskExecutableStatus.EXECUTABLE
                                    }
                                >
                                    <div
                                        title={taskDetails?.name}
                                        className={styles.titleWrapper}
                                        style={{
                                            cursor:
                                                taskDetails?.executable_status ===
                                                TaskExecutableStatus.EXECUTABLE
                                                    ? 'pointer'
                                                    : undefined,
                                        }}
                                    >
                                        {listShow ? (
                                            <CaretUpOutlined
                                                className={styles.downIcon}
                                                hidden={
                                                    taskDetails?.executable_status !==
                                                    TaskExecutableStatus.EXECUTABLE
                                                }
                                            />
                                        ) : (
                                            <CaretDownOutlined
                                                className={styles.downIcon}
                                                hidden={
                                                    taskDetails?.executable_status !==
                                                    TaskExecutableStatus.EXECUTABLE
                                                }
                                            />
                                        )}
                                        <div className={styles.taskIcon}>
                                            {getTaskTypeIcon(
                                                taskDetails?.task_type || '',
                                                true,
                                            )}
                                        </div>
                                        <div
                                            className={styles.name}
                                            title={taskDetails?.name}
                                        >
                                            {taskDetails?.name}
                                        </div>
                                    </div>
                                </Dropdown>
                                <div className={styles.iconWrapper}>
                                    <Tooltip title={__('任务详情')}>
                                        <InfotipOutlined
                                            className={styles.detailIcon}
                                            onClick={() =>
                                                setDetailVisible(true)
                                            }
                                        />
                                    </Tooltip>
                                </div>
                                <Tooltip title={__('上一个任务')}>
                                    <Button
                                        shape="circle"
                                        icon={<ArrowLeftOutlined />}
                                        onClick={handleUp}
                                        hidden={
                                            taskDetails?.executable_status !==
                                            TaskExecutableStatus.EXECUTABLE
                                        }
                                        disabled={isFirst}
                                        size="small"
                                        className={styles.arrowIcon}
                                    />
                                </Tooltip>
                                <Tooltip title={__('下一个任务')}>
                                    <Button
                                        shape="circle"
                                        icon={<ArrowRightOutlined />}
                                        onClick={handleDown}
                                        hidden={
                                            taskDetails?.executable_status !==
                                            TaskExecutableStatus.EXECUTABLE
                                        }
                                        disabled={isLast}
                                        size="small"
                                        className={styles.arrowIcon}
                                    />
                                </Tooltip>
                            </>
                        )}
                    </div>
                </Col>
                {/* 当模型id存在时才展示tab */}
                {(taskInfo?.modelId ||
                    taskDetails?.task_type === TaskType.FIELDSTANDARD) && (
                    <Col
                        className={styles.cth_colWrap}
                        span={8}
                        style={{ justifyContent: 'center' }}
                    >
                        <Tabs
                            className={styles.tabs}
                            activeKey={activeKey}
                            onChange={(e) => {
                                setActiveKey(e as TabKey)
                                setTaskInfo((prev) => ({ ...prev, tabKey: e }))
                            }}
                            getPopupContainer={(node) => node}
                            tabBarGutter={32}
                            items={getTabs()}
                            hidden={
                                ![
                                    TaskType.MODEL,
                                    TaskType.FIELDSTANDARD,
                                    TaskType.DATAMODELING,
                                ].includes(taskDetails?.task_type as TaskType)
                            }
                            destroyInactiveTabPane
                        />
                    </Col>
                )}

                <Col className={styles.cth_colWrap} span={8}>
                    {taskId && (
                        <div className={styles.buttonWrapper}>
                            <Tooltip
                                title={
                                    hasProcess &&
                                    showAuditTask &&
                                    taskInfo?.modelAuditStatus ===
                                        BusinessAuditStatus.PubAuditing &&
                                    __('审核中，无法重复提交')
                                }
                            >
                                <Button
                                    type="default"
                                    onClick={handleAudit}
                                    disabled={
                                        taskInfo?.modelAuditStatus ===
                                        BusinessAuditStatus.PubAuditing
                                    }
                                    hidden={
                                        !hasProcess ||
                                        !showAuditTask ||
                                        taskInfo?.modelAuditStatus ===
                                            BusinessAuditStatus.Published ||
                                        taskDetails?.executable_status !==
                                            TaskExecutableStatus.EXECUTABLE ||
                                        taskDetails?.status ===
                                            TaskStatus.COMPLETED
                                    }
                                >
                                    {__('提交审核')}
                                </Button>
                            </Tooltip>
                            <Tooltip
                                title={
                                    taskDetails?.task_type ===
                                        TaskType.MODELINGDIAGNOSIS &&
                                    compDisabled
                                        ? __('存在未审核通过的业务模型诊断报告')
                                        : taskDetails?.task_type ===
                                              TaskType.MAINBUSINESS &&
                                          compDisabled
                                        ? __('存在未审核通过的主干业务报告')
                                        : taskDetails?.task_type ===
                                              TaskType.FIELDSTANDARD &&
                                          compDisabled
                                        ? __('还存在未新建标准的字段')
                                        : compDisabled && showAuditTask
                                        ? __(
                                              '请提交审核，审核通过后才能完成此任务',
                                          )
                                        : ''
                                }
                                placement="bottomRight"
                            >
                                <Button
                                    type="primary"
                                    onClick={handleCompleted}
                                    disabled={compDisabled}
                                    hidden={
                                        taskDetails?.executable_status !==
                                            TaskExecutableStatus.EXECUTABLE ||
                                        taskDetails?.status ===
                                            TaskStatus.COMPLETED
                                    }
                                >
                                    {__('完成任务')}
                                </Button>
                            </Tooltip>
                            {taskDetails &&
                                (taskDetails.executable_status !==
                                    TaskExecutableStatus.EXECUTABLE ||
                                    taskDetails.status ===
                                        TaskStatus.COMPLETED) && (
                                    <span>
                                        <CheckCircleFilled
                                            style={{
                                                color: '#52c41b',
                                                marginRight: 8,
                                            }}
                                        />
                                        <span>{__('已完成任务')}</span>
                                        <span
                                            style={{
                                                color: 'rgb(0 0 0 / 45%)',
                                            }}
                                        >
                                            {__(
                                                '（已完成的任务只能在此处进行查看，不能更改数据）',
                                            )}
                                        </span>
                                    </span>
                                )}
                        </div>
                    )}
                </Col>
            </Row>
            <TaskDetails
                visible={detailVisible}
                taskId={taskId}
                projectId={projectId}
                onClose={() => setDetailVisible(false)}
            />
        </div>
    )
}

export default CompleteTaskHeader
