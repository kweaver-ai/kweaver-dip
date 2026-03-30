import {
    CheckCircleFilled,
    InfoCircleFilled,
    LeftOutlined,
} from '@ant-design/icons'
import { Button, Col, message, Row, Tooltip } from 'antd'

import { debounce } from 'lodash'
import { FC, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FrameworkContext, TaskInfoContext } from '@/context'
import {
    completeStdTask,
    editTask,
    formatError,
    getBusinessDomainTreeNodeDetails,
    getStdTaskProcess,
    getTaskDetail,
    IStdTaskProcess,
    messageError,
    TaskExecutableStatus,
    TaskStatus,
    TaskType,
} from '@/core'
import { TaskDetail } from '@/core/apis/taskCenter/index.d'
import { useTaskCheck } from '@/hooks/useTaskCheck'
import { useQuery } from '@/utils'
import { confirm } from '@/utils/modalHelper'
import { products, totalOperates } from '../BusinessModeling/ContentTabs'
import { TabKey } from '../BusinessModeling/const'
import GlobalMenu from '../GlobalMenu'
import { ProjectStatus } from '../ProjectManage/types'
import { getTaskTypeIcon } from '../TaskComponents/helper'
import __ from './locale'
import styles from './styles.module.less'

const CompleteWorkOrderTaskHeader: FC = () => {
    const { taskInfo, setTaskInfo } = useContext(TaskInfoContext)
    const { checkTask } = useTaskCheck(totalOperates, products, taskInfo)
    const { appProps } = useContext(FrameworkContext)
    const query = useQuery()
    const navigate = useNavigate()
    // 任务id
    const taskId = query.get('taskId') || ''
    // 项目id
    const projectId = query.get('projectId') || ''

    const [taskDetails, setTaskDetails] = useState<TaskDetail>()

    // 完成任务禁用状态
    const [compDisabled, setCompDisabled] = useState(true)
    // 任务进度
    const [taskProgress, setTaskProgress] = useState<IStdTaskProcess>()

    useEffect(() => {
        const disabled = !taskInfo?.isAllPass
        setCompDisabled(disabled)
    }, [taskInfo?.isAllPass])

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
                    domain_id = '',
                } = res

                let processInfo
                if (domain_id && !business_model_id) {
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
                } else if ([TaskType.MODEL].includes(task_type as TaskType)) {
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
                    setTaskInfo({
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
                        modelId: business_model_id || processInfo?.model_id,
                        tabKey: tab,
                        processInfo,
                        field_finish_number: taskProgressData?.finish_number,
                        field_total_number: taskProgressData?.total_number,
                        taskLoading: false,
                    })
                } else {
                    setCompDisabled(false)
                    setTaskInfo({
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
                        modelId: business_model_id || processInfo?.model_id,
                        tabKey: tab,
                        processInfo,
                        taskLoading: false,
                    })
                }
            } catch (error) {
                getErrorMessage(error)
                setTaskInfo((prev) => ({ ...prev, taskLoading: false }))
            }
        }
    }

    useEffect(() => {
        getDetails()
    }, [taskId])

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

            message.success(__('任务已完成'))
            // 所有任务完成直接返回
            handleReturn()
        } catch (error) {
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
        //         backUrl = '/workOrderTask?state=processed'
        //     }
        // }
        // 不存在返回首页
        navigate(
            backUrl && !['null', 'undefined'].includes(backUrl)
                ? backUrl
                : '/workOrderTask',
        )
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
                            <div
                                title={taskDetails?.name}
                                className={styles.titleWrapper}
                            >
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
                        )}
                    </div>
                </Col>

                <Col className={styles.cth_colWrap} span={8}>
                    {taskId && (
                        <div className={styles.buttonWrapper}>
                            <Tooltip
                                title={
                                    taskDetails?.task_type ===
                                        TaskType.DATACOMPREHENSIONWWORKORDER &&
                                    compDisabled &&
                                    __('存在未审核通过的数据理解报告')
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
        </div>
    )
}

export default CompleteWorkOrderTaskHeader
