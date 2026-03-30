import {
    ArrowLeftOutlined,
    ArrowRightOutlined,
    CaretDownOutlined,
    CaretUpOutlined,
    InfoCircleFilled,
    LeftOutlined,
} from '@ant-design/icons'
import { Button, Divider, Dropdown, List, message, Tabs, Tooltip } from 'antd'
import { debounce } from 'lodash'
import React, { useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { confirm } from '@/utils/modalHelper'
import dataEmpty from '@/assets/dataEmpty.svg'

import { TaskInfoContext } from '@/context'
import { DrawioInfoProvider } from '@/context/DrawioProvider'
import {
    BizModelType,
    BusinessAuditStatus,
    deleteModalDraft,
    editTask,
    formatError,
    getCoreBusinessDetails,
    getCoreBusinesses,
    getErrorMessage,
    getTaskDetail,
    getTasks,
    ICoreBusinessDetails,
    ICoreBusinessItem,
    PublishedStatus,
    TaskConfigStatus,
    TaskExecutableStatus,
    TaskStatus,
    TaskType,
} from '@/core'
import { TaskDetail } from '@/core/apis/taskCenter/index.d'
import { useTaskCheck } from '@/hooks/useTaskCheck'
import { InfotipOutlined, NewCoreBizColored } from '@/icons'
import { OperateType, useQuery } from '@/utils'
import NavTaskCardItem from '../CompleteTaskHeader/NavTaskCardItem'
import BusinessProcess from '../DrawioMgt/BusinessProcess'
import Forms from '../Forms'
import { ProjectStatus } from '../ProjectManage/types'
import { getTaskTypeIcon } from '../TaskComponents/helper'
import { TabKey, TabType, ViewMode } from './const'
import __ from './locale'
import styles from './styles.module.less'

import Empty from '@/ui/Empty'
import GlobalMenu from '../GlobalMenu'
import TaskDetails from '../TaskComponents/TaskDetails'
import { useBusinessModelContext } from './BusinessModelProvider'
import CoreBusinessIndicator from './CoreBusinessIndicator'
import CreateCoreBusiness from './CreateCoreBusiness'
import { RenderVersionList, RenderVersionTip } from './helper'

// (任务)相关场景操作集
export const totalOperates = [
    TabKey.FORM,
    TabKey.PROCESS,
    TabKey.INDICATOR,
    TabKey.REPORT,
]
export const products = [
    { operate: totalOperates, task: 'none' },
    {
        operate: [TabKey.FORM, TabKey.PROCESS, TabKey.INDICATOR],
        task: TaskType.MODEL,
    },
    {
        operate: [TabKey.FORM, TabKey.PROCESS],
        task: TaskType.DATACOLLECTING,
    },
    {
        operate: [TabKey.FORM, TabKey.PROCESS],
        task: TaskType.DATAPROCESSING,
    },
    {
        operate: [TabKey.FORM, TabKey.INDICATOR],
        task: TaskType.DATAMODELING,
    },
]

interface ITabs {
    id: string
    isExistExtraClass?: boolean
    tabType?: TabType
}
const ContentTabs: React.FC<ITabs> = ({
    id,
    isExistExtraClass,
    tabType = TabType.BUSINESS,
}) => {
    // 表单类型
    const query = useQuery()
    const navigator = useNavigate()

    // 下拉菜单显示/隐藏
    const [listShow, setListShow] = useState(false)
    const [loading, setLoading] = useState(true)

    // 模型信息展示框
    const [modelInfoOpen, setModelInfoOpen] = useState(false)
    // 编辑建模
    const [isEditingModel, setIsEditingModel] = useState(false)
    // 信息图标左侧距离
    const [infoIconleft, setInfoIconleft] = useState<number>(100)

    // 模型详情操作类型
    const [modelInfoOprType, setModelInfoOprType] = useState(OperateType.DETAIL)
    const { taskInfo, setTaskInfo } = useContext(TaskInfoContext)
    const { checkTask } = useTaskCheck(totalOperates, products, taskInfo)

    const [details, setDetails] = useState<ICoreBusinessDetails>()
    const [activeKey, setActiveKey] = useState<TabKey>(TabKey.FORM)

    const [coreBusinessList, setCoreBusinessList] = useState<
        ICoreBusinessItem[]
    >([])

    // 任务-项目id
    const projectId = query.get('projectId') || ''
    const taskId = query.get('taskId') || ''
    const [taskDetails, setTaskDetails] = useState<TaskDetail>()
    const [detailVisible, setDetailVisible] = useState<boolean>(false)

    // 任务集
    const [taskItems, setTaskItems] = useState<any[]>([])
    const [fetching, setFetching] = useState(false)

    // 完成任务禁用状态
    const [compDisabled, setCompDisabled] = useState(true)
    const {
        businessModelType,
        isDraft,
        refreshDraft,
        isAuditMode,
        versionList,
        selectedVersion,
        refreshSelectedVersion,
        refreshCoreBusinessDetails,
    } = useBusinessModelContext()

    useEffect(() => {
        if (tabType === TabType.BUSINESS) {
            // 默认跳转存在
            const tab = query.get('targetTab')
            if (tab) {
                setActiveKey(tab as TabKey)
                return
            }
            setActiveKey(TabKey.FORM)
        } else if (tabType === TabType.TASK) {
            // 任务调整默认tab
            if (taskInfo.taskType) {
                if (taskInfo.taskType === TaskType.FIELDSTANDARD) {
                    setActiveKey(TabKey.TOBEEXECUTE)
                } else {
                    setActiveKey(TabKey.FORM)
                }
            } else {
                setActiveKey(TabKey.FORM)
            }
        }
    }, [id, taskInfo.name])

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
    // const getStdTaskProcess = async () => {
    //     if (!taskId) return
    //     try {
    //         const res = await getStdTaskProcess(taskId)
    //         setTaskProgress(res)

    //         // 新建标准任务需要获取进度
    //         const disabled = res?.finish_number !== res?.total_number
    //         setCompDisabled(disabled)
    //     } catch (error) {
    //         formatError(error)
    //     }
    // }

    useEffect(() => {
        // if (
        //     ![
        //         TaskType.FIELDSTANDARD,
        //         TaskType.NEWMAINBUSINESS,
        //         TaskType.DATACOMPREHENSION,
        //     ].includes(taskInfo.taskType)
        // ) {
        setDetails(undefined)
        setTaskDetails(undefined)
        getDetails()
        // }
    }, [taskId])

    useEffect(() => {
        getTaskList()
    }, [])

    useEffect(() => {
        getDetails()
    }, [isDraft])

    // 获取业务模型详情
    const getDetails = async () => {
        if (!id) return
        try {
            const res = await getCoreBusinessDetails(id)
            setDetails(res)
            refreshCoreBusinessDetails?.(res)
            if (res?.has_draft !== undefined) {
                refreshDraft?.(res?.has_draft)
            }
        } catch (error) {
            formatError(error)
        }
    }

    // 获取任务详情
    const getTaskDetails = async () => {
        if (taskId) {
            try {
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
                } = res
                setTaskInfo({
                    ...res,
                    ...taskInfo,
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
                    modelId: business_model_id,
                })
                // 新建标准类型
                if (task_type === TaskType.FIELDSTANDARD) {
                    // getStdTaskProcess()
                } else {
                    setCompDisabled(false)
                }
            } catch (error) {
                setTaskDetails(taskItems.find((t) => t.id === taskId) || {})
                getErrorMessage(error)
            }
        }
    }

    useEffect(() => {
        setDetails(undefined)
        getDetails()
    }, [id])

    useEffect(() => {
        if (tabType === TabType.TASK) {
            getTaskDetails()
        }
    }, [taskId])

    const handleClick = () => {
        const viewMode = query.get('viewType')
        navigator(`/business/domain?viewType=${viewMode || ''}`)
    }

    // 获取业务模型列表
    const getCoreBusinessList = async () => {
        // 业务诊断中存在哈希值 获取时要去掉
        const viewMode = query.get('viewType')?.split('#')?.[0]

        const domainId = query.get('domainId')
        const departmentId = query.get('departmentId')
        try {
            const params =
                viewMode === ViewMode.Department && domainId
                    ? {
                          id: domainId,
                      }
                    : viewMode === ViewMode.BArchitecture && departmentId
                    ? {
                          object_id: departmentId,
                      }
                    : {}
            const res = await getCoreBusinesses({
                offset: 1,
                limit: 100,
                is_all: true,
                ...params,
            })
            setCoreBusinessList(res.entries || [])
        } catch (error) {
            formatError(error)
        }
    }
    useEffect(() => {
        getCoreBusinessList()
    }, [taskInfo])

    const getName = () =>
        coreBusinessList.find((item) => item.main_business_id === id)?.name

    const items = useMemo(() => {
        return coreBusinessList.map((item) => ({
            key: item.main_business_id,
            label: (
                <div className={styles.overlayItem} title={item.name}>
                    {item.name}
                </div>
            ),
        }))
    }, [coreBusinessList])

    // 获取流程图上方是否显示恢复提示，用于修改iframe高度
    const getRestoreTips = () => {
        const { has_draft, audit_status, published_status } = details || {}
        return (
            (has_draft &&
                audit_status === BusinessAuditStatus.Unpublished &&
                published_status !== PublishedStatus.Unpublished) ||
            (audit_status === BusinessAuditStatus.PubReject &&
                published_status !== PublishedStatus.Unpublished)
        )
    }

    const getTabs = () => {
        // const curDetail = tabType === TabType.BUSINESS ? details : taskDetails
        const curDetail = details
        const taskType = taskInfo?.taskType

        const tabs = [
            {
                label:
                    businessModelType === BizModelType.BUSINESS
                        ? __('业务表')
                        : __('数据表'),
                key: TabKey.FORM,
                children: (
                    <Forms
                        modelId={curDetail?.business_model_id || ''}
                        pMbid={curDetail?.main_business_id || ''}
                        coreBizName={curDetail?.name || ''}
                    />
                ),
            },
            {
                label: __('流程图'),
                key: TabKey.PROCESS,
                children: (
                    <BusinessProcess
                        modelId={curDetail?.business_model_id || ''}
                        mainbusId={curDetail?.main_business_id || ''}
                        showRestoreTips={getRestoreTips()}
                    />
                ),
            },
            {
                label:
                    businessModelType === BizModelType.BUSINESS
                        ? __('业务指标')
                        : __('数据指标'),
                key: TabKey.INDICATOR,
                children: (
                    // <BussinessConfigure
                    //     mid={curDetail?.business_model_id || ''}
                    // />
                    <CoreBusinessIndicator
                        modelId={curDetail?.business_model_id || ''}
                        coreBizName={curDetail?.name || ''}
                    />
                ),
            },
            // {
            //     label: __('业务标准'),
            //     key: TabKey.REPORT,
            //     // children: <Report modelId={details?.business_model_id || ''} />,
            //     children: (
            //         <div className={styles.tabContentWrapper}>
            //             <div className={styles.tabContentTitle}>
            //                 {__('业务标准')}
            //             </div>
            //             <div className={styles.tabContent}>
            //                 <Report
            //                     modelId={details?.business_model_id || ''}
            //                 />
            //             </div>
            //         </div>
            //     ),
            //     access: accessScene.biz_form,
            // },
        ]

        return tabs
            ?.filter((t) => checkTask(t.key, true))
            ?.filter(
                (it) =>
                    businessModelType === BizModelType.BUSINESS ||
                    it.key !== TabKey.PROCESS,
            )
    }

    const onClick = ({ key }) => {
        // 切换业务模型时 更新下路由中业务模型id，任何操作的返回到当前的业务模型
        const { search } = window.location
        navigator(`/coreBusiness/${key}${search}`)
        // 选中某一项时 弹窗收起，箭头方向转换
        setListShow(false)
    }

    // 返回
    const handleReturn = () => {
        let backUrl = query.get('backUrl')
        if (!backUrl || ['null', 'undefined'].includes(backUrl)) {
            // 任务处理页面
            if (taskInfo.id) {
                backUrl = '/taskCenter/task'
            } else {
                // 业务处理页面
                backUrl = isAuditMode
                    ? businessModelType === BizModelType.BUSINESS
                        ? '/business/domainAudit'
                        : '/business/dataModelAudit'
                    : businessModelType === BizModelType.BUSINESS
                    ? '/business/domain'
                    : '/business/data-model'
            }
        }
        // 不存在返回首页
        navigator(backUrl)
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
            const url = `/dataDevelopment/dataSynchronization?taskId=${
                item?.id
            }&backUrl=${query.get('backUrl')}&projectId=${item?.project_id}`
            navigator(url)
        } else {
            const url = `/${
                isWorkOrderTask(item?.task_type)
                    ? 'complete-work-order-task'
                    : 'complete-task'
            }?projectId=${item?.project_id}&taskId=${
                item?.id
            }&backUrl=${query.get('backUrl')}`
            navigator(url)
        }
        // navigator = url
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

    // 完成任务请求
    const handleConfirmCompleteTask = async () => {
        try {
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

    // 切换上一个
    const handleUp = () => {
        handleChangeTask(taskItems[currentIdx - 1])
    }

    // 切换下一个
    const handleDown = () => {
        handleChangeTask(taskItems[currentIdx + 1])
    }

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

    // 点击恢复到已经发布的版本
    const handleDeleteDraft = async () => {
        try {
            await deleteModalDraft(id)
            // 删除成功后重新获取模型详情
            getDetails()
        } catch (error) {
            formatError(error)
        }
    }

    // 切换版本
    const handleVersionChange = (versionId: string) => {
        refreshSelectedVersion?.(versionId)
    }

    const renderTabBar = (props: any, DefaultTabBar: any) => {
        return (
            <>
                <div className={styles.top}>
                    <div className={styles.leftWrapper}>
                        <GlobalMenu />
                        <div
                            onClick={handleReturn}
                            className={styles.returnInfo}
                        >
                            <LeftOutlined className={styles.returnArrow} />
                            <span className={styles.returnText}>
                                {__('返回')}
                            </span>
                        </div>
                        <Divider className={styles.divider} type="vertical" />
                        {tabType === TabType.BUSINESS ? (
                            <div className={styles.businessNameContainer}>
                                <div className={styles.modelIconWrapper}>
                                    <NewCoreBizColored
                                        className={styles.modelIcon}
                                    />
                                </div>
                                <div className={styles.businessNameWrapper}>
                                    <div
                                        title={details?.name}
                                        className={styles.businessName}
                                    >
                                        {details?.name}
                                    </div>
                                    <Tooltip title={__('模型基本信息')}>
                                        <InfotipOutlined
                                            className={styles.modelInfoIcon}
                                            onClick={(e) => {
                                                // setIsEditingModel(true)
                                                setInfoIconleft(e.clientX)
                                                setModelInfoOpen(true)
                                                setModelInfoOprType(
                                                    OperateType.DETAIL,
                                                )
                                            }}
                                        />
                                    </Tooltip>
                                </div>
                                {/* {isAuditMode && (
                                    <RenderVersionList
                                        versionList={versionList}
                                        selectedVersion={selectedVersion}
                                        onClick={handleVersionChange}
                                    />
                                )} */}
                                <RenderVersionList
                                    versionList={versionList}
                                    selectedVersion={selectedVersion}
                                    onClick={handleVersionChange}
                                />
                            </div>
                        ) : (
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
                                    <TaskDetails
                                        visible={detailVisible}
                                        taskId={taskId}
                                        projectId={projectId}
                                        onClose={() => setDetailVisible(false)}
                                    />
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

                    <DefaultTabBar {...props} className={styles.tabNav} />

                    {taskDetails?.executable_status ===
                        TaskExecutableStatus.EXECUTABLE &&
                        taskDetails?.status !== TaskStatus.COMPLETED && (
                            <div
                                className={styles.rightWrapper}
                                hidden={
                                    taskDetails?.executable_status !==
                                        TaskExecutableStatus.EXECUTABLE ||
                                    taskDetails?.status === TaskStatus.COMPLETED
                                }
                            >
                                <div className={styles.buttonWrapper}>
                                    <Button
                                        type="primary"
                                        className={styles.button}
                                        onClick={handleCompleted}
                                        disabled={compDisabled}
                                    >
                                        {__('完成任务')}
                                    </Button>
                                </div>
                            </div>
                        )}
                </div>
                <RenderVersionTip info={details} onClick={handleDeleteDraft} />
                <div className={styles.createCoreBusisModal}>
                    <CreateCoreBusiness
                        visible={modelInfoOpen}
                        operateType={modelInfoOprType}
                        setOperateType={setModelInfoOprType}
                        editId={id}
                        onClose={() => setModelInfoOpen(false)}
                        onSuccess={(newModelInfo) => {
                            const { name, business_domain_name, description } =
                                newModelInfo
                            if (details) {
                                setDetails({
                                    ...details,
                                    name: name || details.name,
                                    description:
                                        description || details.description,
                                    business_domain_name:
                                        business_domain_name ||
                                        details.business_domain_name,
                                })
                            }
                        }}
                        maskClosable
                        mask={false}
                        modalStyle={{
                            width: '400px',
                            position: 'absolute',
                            left: infoIconleft,
                            top: '52px',
                        }}
                        bodyStyle={{
                            zIndex: 1001,
                            color: '445566',
                            maxHeight: 484,
                            overflow: 'auto',
                            paddingBottom: 0,
                        }}
                        selectedNode={taskInfo.processInfo}
                        viewMode={ViewMode.BArchitecture}
                    />
                </div>
            </>
        )
    }

    return (
        <DrawioInfoProvider>
            <div className={styles.headerTabs}>
                <Tabs
                    renderTabBar={renderTabBar}
                    activeKey={activeKey}
                    onChange={(e) => setActiveKey(e as TabKey)}
                    getPopupContainer={(node) => node}
                    tabBarGutter={48}
                    items={getTabs()}
                    className={styles.topCenterTab}
                    destroyInactiveTabPane
                />
            </div>
        </DrawioInfoProvider>
    )
}
export default ContentTabs
