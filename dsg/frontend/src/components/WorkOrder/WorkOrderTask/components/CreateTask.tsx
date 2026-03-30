import React, { useEffect, useMemo, useState } from 'react'
import {
    Form,
    Input,
    message,
    Modal,
    Row,
    DatePicker,
    ModalProps,
    Select,
} from 'antd'
import { uniqBy, trim } from 'lodash'
import type { RangePickerProps } from 'antd/es/date-picker'
import moment from 'moment'
import { useGetState } from 'ahooks'
import styles from './styles.module.less'
import {
    messageError,
    formatError,
    TaskType,
    getFlowchartStage,
    TaskStatus,
    TaskPriority,
    createTask,
    editTask,
    getTaskDetail,
    ExecutorInfo,
    TaskDetail,
    formsQuery,
    IBusinessDomainItem,
    BusinessDomainLevelTypes,
    getTasks,
    getCoreBusinessIndicators,
    getComprehensionTemplate,
    getRescCatlgList,
    getProjectDetails,
    PublishStatus,
    getUserListByPermission,
} from '@/core'
import { keyboardRegEnter, OperateType, useQuery, ErrorInfo } from '@/utils'
import { validateTextLegitimacy } from '@/utils/validate'
import { statusInfos } from '../const'
import { ProjectSelect } from '../custom/ProjectComponent'
import { StageNodeCascader } from '../custom/StageNodeCascader'
import { StatusSelect } from '../custom/StatusComponent'
import { PrioritySelect } from './PrioritySelect'
import { ExecutorSelect } from '../custom/ExecutorComponent'
import { freeTaskTypeList } from './helper'
import { TaskTypeSelect } from '../custom/taskTypeComponent'
import __ from './locale'
import FreeTaskRelateForms from './FreeTaskRelateForms'
import FreeTaskRelateCats from './FreeTaskRelateCats'
import BusinessDomainSelect from '@/components/BusiArchitecture/BusinessDomainSelect'
import RelateModel from './RelateModel'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import { StdTypeSelect } from './StdTypeSelect'
import PlanSelect from '../../PlanSelect'
import DetailModal from '@/components/DataComprehension/Template/DetailModal'
import { ExecutorScrollSelect } from '@/components/TaskComponents/ExecutorScrollSelect'
import { IMountType } from '@/components/ResourcesDir/const'

/**
 * 默认传入信息
 * @param name string 字段名
 * @param disabled? boolean 是否可用
 * @param hidden? boolean 是否隐藏
 * @param value? any 默认值
 *  特殊字段说明：
 * 'project_id'的value类型 { id: string; name: string }
 * 'stage_node'的value类型 { stage_id: string, node_id: string, node_name: string, stage_name: string, task_type: string[] }
 * 'task_type','domain_id'的 disabled、hidden值可以不填
 * 'other',需要单独处理的数据
 */
interface IDefaultData {
    name: string
    disabled?: boolean
    value?: any
    hidden?: boolean
}

interface ICreateTask extends ModalProps {
    show: boolean
    operate: OperateType
    pid?: string
    tid?: string
    defaultData: IDefaultData[]
    isSupportFreeTask?: boolean
    // 任务操作成功后是否显示message
    isTaskShowMsg?: boolean
    onClose: (value?: any) => void
    workOrderId?: string
    defaultTaskType?: string[]
}

/**
 * 创建任务
 * @param show 显示/隐藏
 * @param operate 操作类型
 * @param pid 项目id
 * @param tid 任务id
 * @param defaultData 默认信息
 * @param isSupportFreeTask 默认不支持游离任务
 * @param isGuide 默认创建无引导页
 * @param freeTaskType 独立任务的类型
 * @param onClose 关闭，无参取消，有参成功
 */
const CreateTask: React.FC<ICreateTask> = ({
    show,
    operate = OperateType.CREATE,
    pid,
    tid,
    defaultData,
    isSupportFreeTask = false,
    isTaskShowMsg = true,
    workOrderId,
    defaultTaskType,
    onClose,
    ...props
}) => {
    const [form] = Form.useForm()
    const query = useQuery()

    // 新建/编辑弹框显示,【true】显示,【false】隐藏
    const [editVisible, setEditVisible] = useState(false)
    const [currentTemplateId, setCurrentTemplateId] = useState<string>()
    const [showTemplateDetail, setShowTemplateDetail] = useState(false)
    // 是否为独立任务
    const [isFreeTask, setIsFreeTask] = useState<boolean>()
    // 任务信息
    const [details, setDetails] = useState<TaskDetail>()

    const [otherInfo, setOtherInfo] = useState<any>()
    // 确定按钮loading
    const [loading, setLoading] = useState(false)

    // 项目默认信息
    const [projects, setProjects] = useState<
        { id?: string; name?: string }[] | undefined
    >()

    const [mid, setMid] = useState<string>()
    // 业务模型默认信息
    const [mainBizs, setMainBizs] = useState<
        { id?: string; name?: string }[] | undefined
    >()
    // 业务表默认信息
    const [bizForms, setBizForms] = useState<
        { id?: string; name?: string }[] | undefined
    >()

    // 业务指标默认信息
    const [bizIndicator, setBizIndicator] = useState<
        { id?: string; name?: string }[] | undefined
    >()
    const [bfLoading, setBfLoading] = useState(false)
    // 资源目录默认信息
    const [assetsCats, setAssetsCats] = useState<
        { id?: string; name?: string; path?: string }[] | undefined
    >()
    const [acLoading, setAcLoading] = useState(false)

    const [freeExecutors, setFreeExecutors] = useState<
        { id?: string; name?: string }[] | undefined
    >()
    // 执行人 undefined-提示，[]-无数据
    const [executors, setExecutors] = useState<ExecutorInfo[] | undefined>()
    const [exLoading, setExLoading] = useState(false)

    // 阶段
    const [stages, setStages] = useState<any[]>([])
    // 阶段&节点 undefined-提示，[]-无数据
    const [stageNodes, setStageNodes] = useState<any[] | undefined>()
    const [snLoading, setSnLoading] = useState(false)
    // 节点配置的任务类型
    const [nodeType, setNodeType] = useState<string[] | undefined>([])
    const [allMembers, setAllMembers] = useState<ExecutorInfo[]>()

    // 不可操作项
    const [disabledName, setDisabledName, getDisabledName] = useGetState<
        string[]
    >([])
    // 隐藏项
    const [hiddenName, setHiddenName, getHiddenName] = useGetState<string[]>([])

    // 日期项是否编辑
    const [deadlineEdited, setDeadlineEdited] = useState(false)

    const [isUseEditPId, setIsUseEditPId] = useState(false)

    const [projectModels, setProjectModels] = useState<
        { label: string; value: string }[]
    >([])

    const [{ using }] = useGeneralConfig()

    // 业务流程直接创建建模任务时 保存流程id
    const [domainId, setDomainId] = useState('')

    useEffect(() => {
        if (show) {
            setIsFreeTask(isSupportFreeTask)
            setDefaultValue(isSupportFreeTask)
            if (operate === OperateType.EDIT) {
                if (tid) {
                    setEditVisible(false)
                    getTaskItemDetail()
                    setIsUseEditPId(true)
                    return
                }
                handleModalCancel()
            } else {
                setEditVisible(true)
                form.setFieldValue('priority', TaskPriority.COMMON)
                form.setFieldValue('status', TaskStatus.READY)
            }
        } else {
            setEditVisible(show)
            setDomainId('')
        }
    }, [show])

    useMemo(() => {
        if (show) {
            if (isFreeTask) {
                // 独立任务不显示项目、节点
                setHiddenName([...hiddenName, 'project_id', 'stage_node'])
                if (!defaultTaskType?.length) {
                    setNodeType([
                        ...(nodeType || []),
                        ...freeTaskTypeList,
                        // ...freeTaskTypeList.filter(
                        //     (item) =>
                        //         item !== TaskType.DATACOMPREHENSION || using !== 2,
                        // ),
                    ])
                } else {
                    setNodeType(defaultTaskType)
                }
            } else {
                // 项目任务不显示关联业务模型、业务表
                setHiddenName([
                    ...hiddenName,
                    'main_biz',
                    'biz_form',
                    'assets_cat',
                    'data_comprehension_template',
                    'biz_indicator',
                ])
            }
        }
    }, [isFreeTask, defaultTaskType])

    // 对话框onCancel
    const handleModalCancel = (value?: any) => {
        setEditVisible(false)
        setIsFreeTask(undefined)
        setDetails(undefined)
        setLoading(false)
        setProjects(undefined)
        setBizForms(undefined)
        setBizIndicator(undefined)
        setAssetsCats(undefined)
        setExecutors(undefined)
        setMid(undefined)
        setStages([])
        setStageNodes([])
        setNodeType([])
        setAllMembers(undefined)
        setDisabledName([])
        setHiddenName([])
        setDeadlineEdited(false)
        onClose(value)
        form.resetFields()
    }

    // 对话框onOk
    const onFinish = async (value) => {
        const {
            stage_node,
            deadline,
            priority,
            executor_id,
            task_type,
            main_biz,
            biz_form,
            assets_cat,
            data_comprehension_template,
            biz_indicator,
        } = value

        let chgParams = {
            ...value,
            biz_form: undefined,
            main_biz: undefined,
            priority: priority || '',
            executor_id: executor_id || '',
            data_catalog_id: assets_cat,
            data_comprehension_template_id:
                data_comprehension_template?.value || '',
            deadline: deadline ? deadline.endOf('day').unix() : 0,
            biz_indicator: undefined,
            ...otherInfo,
        }
        if (!deadlineEdited) {
            delete chgParams.deadline
        }
        if (isFreeTask) {
            chgParams = {
                ...chgParams,
                business_model_id: main_biz,
                data: biz_form || assets_cat || biz_indicator,
            }
        } else {
            chgParams =
                stage_node?.length === 1
                    ? {
                          ...chgParams,
                          node_id: stage_node?.[0],
                      }
                    : {
                          ...chgParams,
                          stage_id: stage_node?.[0],
                          node_id: stage_node?.[1],
                      }
            if (task_type === TaskType.FIELDSTANDARD) {
                chgParams = { ...chgParams, project_id: projects?.[0]?.id }
            }
            if (task_type === TaskType.DATACOLLECTING) {
                chgParams = {
                    ...chgParams,
                    business_model_id: main_biz,
                    data: biz_form,
                }
            }
            if (task_type === TaskType.INDICATORPROCESSING) {
                chgParams = {
                    ...chgParams,
                    business_model_id: main_biz,
                    data: biz_indicator,
                }
            }
        }

        try {
            setLoading(true)
            if (operate === OperateType.CREATE) {
                const taskParams: any = {
                    ...chgParams,
                    domain_id: domainId || chgParams.domain_id,
                }
                if (workOrderId) {
                    taskParams.work_order_id = workOrderId
                }

                delete taskParams?.data_comprehension_template

                const res = await createTask(taskParams)
                if (isTaskShowMsg) {
                    message.success(
                        props.title === __('新建任务')
                            ? __('新建成功')
                            : __('添加成功'),
                    )
                }
                handleModalCancel()
                handleModalCancel(res)
            } else {
                const res = await editTask(tid!, {
                    ...chgParams,
                    domain_id:
                        task_type === TaskType.MODEL
                            ? isUseEditPId
                                ? details?.domain_id
                                : value.domain_id
                            : undefined,
                    project_id: pid,
                })
                if (isTaskShowMsg) {
                    message.success(__('编辑成功'))
                }
                handleModalCancel(res)
            }
        } catch (e) {
            switch (e?.data?.code) {
                case 'TaskCenter.Task.TaskMainBusinessNotExist':
                    messageError(
                        checkIsDisabled('main_biz')
                            ? __('关联业务模型被删除，可删除重建任务')
                            : __('关联业务模型被删除，请重新选择'),
                    )
                    form.resetFields(['main_biz'])
                    break
                default:
                    formatError(e)
            }
        } finally {
            setLoading(false)
        }
    }
    // 默认值获取转换
    const setDefaultValue = (isFree: boolean) => {
        let projectId: any
        let nodeId: any
        let taskType: any
        const disArr: string[] = []
        let hidArr: string[] = []
        defaultData!.forEach((d) => {
            const { name, disabled, value, hidden } = d
            if (disabled) {
                disArr.push(name)
            }
            if (hidden) {
                hidArr.push(name)
            }
            // 流水线创建任务，通过project_id字段value中获取nodeId
            if (name === 'project_id' && value?.nodeId) {
                nodeId = [value.nodeId]
            }
            if (name === 'other' && value) {
                setOtherInfo(value)
            }
            // 新建标准任务-标准分类
            if (operate === OperateType.CREATE && typeof value === 'number') {
                form.setFieldValue(name, value)
            }
            // 编辑操作跳过赋值部分
            if (operate === OperateType.CREATE && value) {
                switch (name) {
                    case 'name':
                        form.setFieldValue('name', value)
                        break
                    case 'project_id':
                        setProjects([value])
                        projectId = value.id
                        form.setFieldValue('project_id', value.id)
                        break
                    case 'stage_node':
                        if (value.stage_id) {
                            setStages([
                                {
                                    stage_id: value.stage_id,
                                    stage_name: value.stage_name,
                                },
                            ])
                            nodeId = [value.stage_id, value.node_id]
                        } else {
                            nodeId = value.node_id ? [value.node_id] : undefined
                        }
                        setStageNodes([
                            {
                                node_id: value.node_id,
                                node_name: value.node_name,
                                stage_id: value.stage_id,
                                stage_name: value.stage_name,
                                task_type: value.task_type,
                            },
                        ])
                        setNodeType(value.task_type)
                        form.setFieldValue('stage_node', nodeId)
                        break
                    case 'task_type':
                        setNodeType([value])
                        form.setFieldValue('task_type', value)
                        taskType = value
                        break
                    case 'main_biz':
                        setMid(value.id)
                        form.setFieldValue('main_biz', value.id)
                        break
                    case 'biz_form':
                        setBizForms(value)
                        form.setFieldValue(
                            'biz_form',
                            value.map((v) => v.id),
                        )
                        break
                    case 'biz_indicator':
                        setBizIndicator(value)
                        form.setFieldValue(
                            'biz_indicator',
                            value.map((v) => v.id),
                        )
                        break
                    case 'assets_cat':
                        setAssetsCats(value)
                        form.setFieldValue(
                            'assets_cat',
                            value.map((v) => v.id),
                        )
                        break
                    case 'data_comprehension_template': // 关联数据理解模板
                        form.setFieldValue('data_comprehension_template', value)
                        break
                    case 'status':
                        form.setFieldValue('status', value)
                        break
                    case 'deadline':
                        form.setFieldValue('deadline', value)
                        break
                    case 'priority':
                        form.setFieldValue('priority', value)
                        break
                    case 'executor_id':
                        form.setFieldValue('executor_id', value)
                        break
                    case 'description':
                        form.setFieldValue('description', value)
                        break
                    case 'domain_id':
                        form.setFieldValue('domain_id', value.name)
                        setDomainId(value.id)
                        break
                    default:
                        break
                }
            }
        })
        // 新建下不显示状态
        if (operate === OperateType.CREATE) {
            hidArr.push('status')
            // 项目流水线新建数据加工任务要获取项目下的业务模型
            if (
                [
                    TaskType.DATACOLLECTING,
                    TaskType.INDICATORPROCESSING,
                ].includes(taskType) &&
                projectId
            ) {
                getProjectTasks(projectId)
            } else if (taskType === TaskType.DATACOMPREHENSIONWWORKORDER) {
                getAssetsCatList()
            }
        }
        if (taskType) {
            hidArr = checkFreeTaskShowInfo(taskType, hidArr, isFree)
            getExecutorsList(projectId, taskType)
        }
        if (!projectId) {
            setProjects([])
        }
        if (!nodeId) {
            setStageNodes(undefined)
        }
        setDisabledName([...disabledName, ...disArr])
        setHiddenName([...hidArr]) // ...hiddenName,
    }

    // 判断是否可用
    const checkIsDisabled = (val: string) => {
        const res = disabledName.find((d) => d === val)
        return !!res
    }

    // 判断是否隐藏
    const checkIsHidden = (val: string) => {
        const res = hiddenName.find((d) => d === val)
        return !!res
    }

    // 获取当前任务详情
    const getTaskItemDetail = async () => {
        try {
            const res = await getTaskDetail(tid!)
            setDetails(res)
            const {
                name,
                description,
                priority,
                status,
                deadline,
                project_id,
                project_name,
                executor_id,
                executor_name,
                stage_id,
                node_id,
                node_name,
                stage_name,
                task_type,
                org_type,
                subject_domain_id,
                subject_domain_name,
                business_model_id,
                main_business_name,
                data,
                domain_id,
                domain_name,
                new_main_business_id,
                data_catalog_id,
                data_comprehension_template_id,
            } = res

            const taskType = task_type || TaskType.NORMAL
            const taskStatus = status || TaskStatus.READY
            setIsFreeTask(!project_id)
            setFreeExecutors([{ id: executor_id, name: executor_name }])
            // 执行人
            getExecutorsList(project_id, task_type)
            // 关联项目
            setProjects([{ id: project_id, name: project_name }])
            setMid(business_model_id)
            // 阶段、节点
            if (stage_id) {
                setStages([{ stage_id, stage_name }])
            }
            setStageNodes([
                {
                    node_id,
                    node_name,
                    stage_id,
                    stage_name,
                    task_type: [taskType],
                },
            ])
            // 任务类型
            setNodeType([taskType])
            const stage_node = stage_id
                ? [stage_id, node_id]
                : node_id
                ? [node_id]
                : undefined
            form.setFieldsValue({
                name,
                description,
                priority: priority || TaskPriority.COMMON,
                status: taskStatus,
                deadline: deadline ? moment(deadline * 1000) : undefined,
                project_id: project_id || undefined,
                executor_id: executor_id || undefined,
                stage_node,
                task_type: taskType,
                org_type,
                main_biz: business_model_id,
                biz_form: data?.map((d) => d.id),
                biz_indicator: data?.map((d) => d.id),
                assets_cat: data_catalog_id,
                // assets_cat: data?.map((d) => d.id),
                data_comprehension_template: data_comprehension_template_id
                    ? {
                          key: data_comprehension_template_id,
                          value: data_comprehension_template_id,
                      }
                    : undefined,
                domain_id: domain_name,
            })
            if (task_type === TaskType.DATACOLLECTING && project_id) {
                getProjectTasks(project_id)
                setBizForms(data)
            }
            if (task_type === TaskType.INDICATORPROCESSING && project_id) {
                getProjectTasks(project_id)
                setBizIndicator(data)
            }

            let tmpDisabled = ['project_id', 'stage_node', 'task_type']
            if (taskStatus === TaskStatus.READY) {
                if (
                    [TaskType.DATACOLLECTING, TaskType.DATAPROCESSING].includes(
                        taskType,
                    ) &&
                    !project_id
                ) {
                    getFormList(business_model_id)
                }

                if (TaskType.INDICATORPROCESSING === taskType && !project_id) {
                    getIndictorList(business_model_id)
                }
                if (
                    taskType === TaskType.DATACOMPREHENSION ||
                    taskType === TaskType.DATACOMPREHENSIONWWORKORDER
                ) {
                    getAssetsCatList()
                }
            } else {
                setAssetsCats(data)
                setBizForms(data)
                setBizIndicator(data)
                tmpDisabled = [
                    ...tmpDisabled,
                    'main_biz',
                    'biz_form',
                    'assets_cat',
                    'data_comprehension_template',
                    'biz_indicator',
                ]
            }
            // 所有类型均不可编辑项
            setDisabledName([...getDisabledName(), ...tmpDisabled])

            setHiddenName(
                checkFreeTaskShowInfo(taskType, getHiddenName(), !project_id),
            )

            // 当前项目如果执行中，未选择执行人检查
            if (status === TaskStatus.ONGOING && !executor_id) {
                setTimeout(() => {
                    form.setFields([
                        {
                            name: 'executor_id',
                            errors: ['执行人被移除，请重新选择'],
                        },
                    ])
                }, 0)
            }
            setEditVisible(true)
        } catch (e) {
            formatError(e)
            handleModalCancel()
        }
    }

    // 获取执行人列表
    const getExecutorsList = async (project, taskType) => {
        if (!taskType) return
        try {
            setExLoading(true)
            let res: any[] = []
            if (project) {
                const pro = await getProjectDetails(project)
                res = pro?.members
            } else {
                // res = await getMembers(taskType)
                const users = await getUserListByPermission({
                    permission_ids: ['68e247dd-831b-4b5d-8f13-6c5ae5983c07'],
                })
                res = users?.entries ?? []
            }
            setExecutors(res || [])
            setAllMembers(res)
        } catch (e) {
            setExecutors([])
        } finally {
            setExLoading(false)
        }
    }

    // 获取阶段/节点列表
    const getStageNodeList = async (value) => {
        setSnLoading(true)
        try {
            const res = await getFlowchartStage(value)
            const { entries } = res
            if (!entries) return
            const tempArr: any = []
            const stageArr: any = []
            const stageNodeArr = entries.map((e) => {
                const { node_id, node_name, stage_id, stage_name, task_type } =
                    e
                if (stage_id && !tempArr.includes(stage_id)) {
                    tempArr.push(stage_id)
                    stageArr.push({ stage_id, stage_name })
                }
                return { node_id, node_name, stage_id, stage_name, task_type }
            })
            setStages(stageArr)
            setStageNodes(stageNodeArr)
        } catch (e) {
            setStages([])
            setStageNodes([])
        } finally {
            setSnLoading(false)
        }
    }

    // 获取业务表列表
    const getFormList = async (id?: string) => {
        if (
            ![TaskType.DATACOLLECTING, TaskType.DATAPROCESSING].includes(
                form.getFieldValue('task_type'),
            )
        ) {
            return
        }
        try {
            setBfLoading(true)
            const res = await formsQuery(id || mid || '', {
                offset: 1,
                limit: 2000,
                rate: 1,
            })
            const arr = res?.entries
                .filter((item) => item.is_completed)
                .map((e) => ({
                    id: e.id,
                    name: e.name,
                }))
            setBizForms(arr)
        } catch (err) {
            formatError(err)
        } finally {
            setBfLoading(false)
        }
    }

    // 获取业务指标列表
    const getIndictorList = async (id?: string) => {
        if (form.getFieldValue('task_type') !== TaskType.INDICATORPROCESSING) {
            return
        }
        try {
            setBfLoading(true)
            const res = await getCoreBusinessIndicators({
                offset: 1,
                limit: 2000,
                mid: id || mid || '',
            })
            const arr = res?.entries.map((e) => ({
                id: e.id,
                name: e.name,
            }))
            setBizIndicator(arr)
        } catch (err) {
            formatError(err)
        } finally {
            setBfLoading(false)
        }
    }

    const getProjectTasks = async (pId: string) => {
        try {
            const res = await getTasks({ project_id: pId, limit: 1000 })
            setProjectModels(
                uniqBy(
                    res.entries
                        .filter((task) => task.task_type === TaskType.MODEL)
                        .map((task) => ({
                            label: task.business_model_name || '',
                            value: task.business_model_id || '',
                        })),
                    'value',
                ),
            )
        } catch (error) {
            formatError(error)
        }
    }

    // 获取资源目录列表
    const getAssetsCatList = async (id?: string) => {
        try {
            setAcLoading(true)
            const res = await getRescCatlgList({
                limit: 0,
                categoryID: '',
                orgcode: '',
                mount_type: IMountType.ViewCount,
                publish_status: [
                    PublishStatus.PUBLISHED,
                    PublishStatus.CHANGE_AUDITING,
                    PublishStatus.CHANGE_REJECT,
                ].join(','),
                // online_status: 'online',
                need_org_paths: true,
            })
            const arr = res?.entries?.map((e: any) => ({
                id: e.id,
                name: e.title || e?.name,
                path: e.org_paths?.join('/') || e?.department_path,
            }))
            setAssetsCats(arr)
        } catch (err) {
            formatError(err)
        } finally {
            setAcLoading(false)
        }
    }

    // 不可选日期
    const disabledDate: RangePickerProps['disabledDate'] = (current) => {
        return current && current < moment().startOf('day')
    }

    // 状态不可用
    const getStatusDisabled = () => {
        const info = statusInfos.filter(
            (s) => s.value === (details?.status || TaskStatus.READY),
        )[0]
        return statusInfos
            .filter((s) => s.num > info.num + 1 || s.num < info.num)
            .map((s) => s.num)
    }

    // 检查独立任务的显示项
    const checkFreeTaskShowInfo = (
        type: TaskType,
        origin: string[],
        isFree: boolean = false,
    ): string[] => {
        if (!isFreeTask && !isFree) {
            return origin
        }
        const temp = [
            ...origin,
            'main_biz',
            'biz_form',
            'assets_cat',
            'data_comprehension_template',
            'biz_indicator',
        ]
        if ([TaskType.FIELDSTANDARD].includes(type)) {
            return temp
        }
        if ([TaskType.MODEL].includes(type)) {
            return temp.filter((n) => n !== 'main_biz')
        }
        if (type === TaskType.DATACOMPREHENSION) {
            return temp.filter((n) => n !== 'assets_cat')
        }
        if (type === TaskType.DATACOMPREHENSIONWWORKORDER) {
            return temp.filter(
                (n) =>
                    !['data_comprehension_template', 'assets_cat'].includes(n),
            )
        }
        return temp.filter(
            (n) =>
                n !== 'biz_form' && n !== 'main_biz' && n !== 'biz_indicator',
        )
    }

    const onValuesChange = (currentValue: any, allValues: any) => {
        const key = Object.keys(currentValue)[0]
        // 校验多项输入值
        if (['deadline'].includes(key)) {
            setDeadlineEdited(true)
        }
    }

    const getDisabledNode = (node: IBusinessDomainItem) => ({
        disable:
            node.type !== BusinessDomainLevelTypes.Process ||
            !!node.model_locked,
        message:
            node.type !== BusinessDomainLevelTypes.Process
                ? __('不支持选择此类型节点')
                : node.model_locked
                ? __('不支持选择此业务流程')
                : '',
    })

    const onFieldsChange = (fields) => {
        if (fields[0].name[0] === 'domain_id') {
            if (operate === OperateType.EDIT) {
                setIsUseEditPId(false)
            }
        }
        if (fields[0].name[0] === 'main_biz') {
            const modelId = form.getFieldValue('main_biz')
            if (modelId) {
                getFormList(modelId)
                getIndictorList(modelId)
            }
            form.resetFields(['biz_form', 'biz_indicator'])
        }
    }
    return (
        <div className={styles.createWrapper}>
            {/* {editVisible && ( */}
            <Modal
                width={800}
                bodyStyle={{
                    maxHeight: 484,
                    overflow: 'overlay',
                    padding: '24px 24px 0 24px',
                }}
                maskClosable={false}
                open={editVisible}
                onCancel={() => handleModalCancel()}
                onOk={() => form.submit()}
                destroyOnClose
                getContainer={false}
                okButtonProps={{ loading }}
                {...props}
            >
                <Form
                    form={form}
                    layout="vertical"
                    autoComplete="off"
                    initialValues={{ remember: true }}
                    onFinish={onFinish}
                    onValuesChange={onValuesChange}
                    onFieldsChange={onFieldsChange}
                    scrollToFirstError
                >
                    <Row className={styles.rowRrapper}>
                        <Form.Item
                            label={__('任务名称')}
                            name="name"
                            className={styles.w364}
                            validateFirst
                            rules={[
                                {
                                    required: checkIsDisabled('name')
                                        ? !checkIsDisabled('name')
                                        : true,
                                    message: ErrorInfo.NOTNULL,
                                    transform: (value: string) => trim(value),
                                    // validator: validateName(),
                                },
                            ]}
                            hidden={checkIsHidden('name')}
                        >
                            <Input
                                placeholder={__('请输入任务名称')}
                                maxLength={32}
                                disabled={checkIsDisabled('name')}
                                style={{ color: 'rgba(0, 0, 0, 0.65)' }}
                            />
                        </Form.Item>
                        {!checkIsHidden('project_id') && (
                            <Form.Item
                                label={__('关联项目')}
                                name="project_id"
                                className={styles.w364}
                                rules={[
                                    {
                                        required: isFreeTask
                                            ? false
                                            : checkIsDisabled('project_id')
                                            ? !checkIsDisabled('project_id')
                                            : true,
                                        message: __('请选择关联项目'),
                                    },
                                ]}
                                required
                                hidden={checkIsHidden('project_id')}
                            >
                                <ProjectSelect
                                    data={projects || []}
                                    onChange={async (value, option) => {
                                        // 清空数据
                                        setDetails(undefined)
                                        setStages([])
                                        setStageNodes(undefined)
                                        // 清空时 可不选 当作游离任务
                                        if (!value) {
                                            setNodeType(freeTaskTypeList)
                                            setExecutors(allMembers)
                                        } else {
                                            setNodeType(undefined)
                                            setExecutors(undefined)
                                        }
                                        form.resetFields([
                                            'stage_node',
                                            'executor_id',
                                            'task_type',
                                        ])
                                        // 请求获取数据
                                        getStageNodeList(value)
                                        getProjectTasks(value)
                                    }}
                                    disabled={checkIsDisabled('project_id')}
                                    allowClear={isFreeTask}
                                />
                            </Form.Item>
                        )}
                        <Form.Item
                            noStyle
                            shouldUpdate={(prevValues, curValues) =>
                                prevValues.stage_node !== curValues.stage_node
                            }
                            hidden={checkIsHidden('stage_node')}
                        >
                            {({
                                getFieldValue,
                                setFieldValue,
                                resetFields,
                            }) => {
                                return (
                                    <Form.Item
                                        label={__('任务所在节点')}
                                        name="stage_node"
                                        className={styles.w100per}
                                        required
                                        rules={[
                                            {
                                                required: isFreeTask
                                                    ? false
                                                    : checkIsDisabled(
                                                          'stage_node',
                                                      )
                                                    ? !checkIsDisabled(
                                                          'stage_node',
                                                      )
                                                    : true,
                                                message:
                                                    __('请选择任务所在节点'),
                                            },
                                        ]}
                                    >
                                        <StageNodeCascader
                                            stages={stages}
                                            stageNodes={stageNodes}
                                            onChange={(
                                                value,
                                                selectedOptions,
                                            ) => {
                                                // 清空数据
                                                setExecutors(undefined)
                                                // setDomains(undefined)
                                                resetFields([
                                                    'executor_id',
                                                    'task_type',
                                                ])
                                                const nodeId =
                                                    value.length === 2
                                                        ? value[1]
                                                        : value[0]
                                                // 节点的任务类型
                                                const nodeTp: string[] =
                                                    stageNodes?.find(
                                                        (n) =>
                                                            n.node_id ===
                                                            nodeId,
                                                    ).task_type || []
                                                if (nodeTp.length === 0) {
                                                    setNodeType([
                                                        TaskType.NORMAL,
                                                        TaskType.MODEL,
                                                    ])
                                                } else {
                                                    setNodeType(nodeTp)
                                                }
                                                if (nodeTp.length === 1) {
                                                    setFieldValue(
                                                        'task_type',
                                                        nodeTp[0],
                                                    )
                                                }
                                                // 请求获取数据
                                                getExecutorsList(
                                                    getFieldValue('project_id'),
                                                    nodeTp[0],
                                                )
                                            }}
                                            disabled={checkIsDisabled(
                                                'stage_node',
                                            )}
                                            loading={snLoading}
                                        />
                                    </Form.Item>
                                )
                            }}
                        </Form.Item>
                        <Form.Item
                            noStyle
                            shouldUpdate={(prevValues, curValues) =>
                                prevValues.task_type !== curValues.task_type
                            }
                            hidden={checkIsHidden('task_type')}
                        >
                            {({ getFieldValue }) => {
                                const taskType = getFieldValue('task_type')
                                return (
                                    <Form.Item
                                        label={__('任务类型')}
                                        name="task_type"
                                        className={styles.w364}
                                        rules={[
                                            {
                                                required: checkIsDisabled(
                                                    'task_type',
                                                )
                                                    ? !checkIsDisabled(
                                                          'task_type',
                                                      )
                                                    : true,
                                                message: __('请选择任务类型'),
                                            },
                                        ]}
                                    >
                                        <TaskTypeSelect
                                            data={nodeType}
                                            onChange={(value, option) => {
                                                form.resetFields([
                                                    'main_biz',
                                                    'biz_form',
                                                    'executor_id',
                                                    'assets_cat',
                                                    'data_comprehension_template',
                                                    'biz_indicator',
                                                ])
                                                setBizForms(undefined)
                                                setAssetsCats(undefined)
                                                setBizIndicator(undefined)
                                                setExecutors(undefined)
                                                setHiddenName(
                                                    checkFreeTaskShowInfo(
                                                        value,
                                                        hiddenName,
                                                    ),
                                                )
                                                // 请求获取数据
                                                if (
                                                    value ===
                                                        TaskType.DATACOMPREHENSION ||
                                                    value ===
                                                        TaskType.DATACOMPREHENSIONWWORKORDER
                                                ) {
                                                    getAssetsCatList()
                                                }
                                                getExecutorsList(
                                                    getFieldValue('project_id'),
                                                    value,
                                                )
                                            }}
                                            disabled={
                                                operate === OperateType.EDIT ||
                                                checkIsDisabled('task_type')
                                            }
                                            // 禁用时，不显示下拉图标
                                            showArrow={
                                                !(
                                                    operate ===
                                                        OperateType.EDIT ||
                                                    checkIsDisabled('task_type')
                                                )
                                            }
                                        />
                                    </Form.Item>
                                )
                            }}
                        </Form.Item>
                        <Form.Item
                            noStyle
                            shouldUpdate={(prevValues, curValues) =>
                                prevValues.task_type !== curValues.task_type
                            }
                            hidden={checkIsHidden('task_type')}
                        >
                            {({ getFieldValue }) => {
                                return getFieldValue('task_type') ===
                                    TaskType.FIELDSTANDARD ? (
                                    <Form.Item
                                        label={__('新建标准的分类')}
                                        name="org_type"
                                        className={styles.w364}
                                        rules={
                                            operate === OperateType.CREATE
                                                ? [
                                                      {
                                                          required: true,
                                                          message:
                                                              __(
                                                                  '请选择新建标准的分类',
                                                              ),
                                                      },
                                                  ]
                                                : undefined
                                        }
                                        hidden={checkIsHidden('org_type')}
                                    >
                                        <StdTypeSelect
                                            allowClear
                                            disabled={
                                                operate === OperateType.EDIT
                                            }
                                        />
                                    </Form.Item>
                                ) : null
                            }}
                        </Form.Item>
                        <Form.Item
                            noStyle
                            shouldUpdate={(pre, cur) =>
                                pre.task_type !== cur.task_type
                            }
                        >
                            {({ getFieldValue }) => {
                                return getFieldValue('task_type') ===
                                    TaskType.MODEL ? (
                                    <Form.Item
                                        label={__('关联业务流程')}
                                        name="domain_id"
                                        className={styles.w364}
                                        rules={[
                                            {
                                                required:
                                                    operate ===
                                                        OperateType.CREATE &&
                                                    !domainId,
                                                message:
                                                    __('请选择关联业务流程'),
                                            },
                                        ]}
                                    >
                                        <BusinessDomainSelect
                                            placeholder={__(
                                                '请选择关联业务流程',
                                            )}
                                            getDisabledNode={getDisabledNode}
                                            disabled={
                                                operate === OperateType.EDIT ||
                                                !!domainId
                                            }
                                        />
                                    </Form.Item>
                                ) : null
                            }}
                        </Form.Item>
                        <Form.Item
                            noStyle
                            shouldUpdate={(pre, cur) =>
                                pre.task_type !== cur.task_type ||
                                pre.project_id !== cur.project_id
                            }
                        >
                            {({ getFieldValue }) => {
                                return getFieldValue('task_type') ===
                                    TaskType.DATACOLLECTING ||
                                    getFieldValue('task_type') ===
                                        TaskType.INDICATORPROCESSING ? (
                                    <Form.Item
                                        label={__('关联业务模型')}
                                        name="main_biz"
                                        className={
                                            getFieldValue('project_id')
                                                ? styles.w364
                                                : styles.w100per
                                        }
                                        rules={[
                                            {
                                                required:
                                                    operate ===
                                                        OperateType.CREATE &&
                                                    !checkIsDisabled(
                                                        'main_biz',
                                                    ),
                                                message:
                                                    __('请选择关联业务模型'),
                                            },
                                        ]}
                                    >
                                        {getFieldValue('project_id') ? (
                                            <Select
                                                placeholder={__(
                                                    '请选择关联业务模型',
                                                )}
                                                options={projectModels}
                                                optionFilterProp="label"
                                                showSearch
                                                notFoundContent={__('暂无数据')}
                                                disabled={
                                                    operate ===
                                                        OperateType.EDIT ||
                                                    checkIsDisabled('main_biz')
                                                }
                                            />
                                        ) : (
                                            <RelateModel
                                                disabled={
                                                    operate ===
                                                        OperateType.EDIT ||
                                                    checkIsDisabled('main_biz')
                                                }
                                            />
                                        )}
                                    </Form.Item>
                                ) : null
                            }}
                        </Form.Item>
                        <Form.Item
                            noStyle
                            shouldUpdate={(pre, cur) =>
                                pre.task_type !== cur.task_type
                            }
                        >
                            {({ getFieldValue }) => {
                                return getFieldValue('task_type') ===
                                    TaskType.INDICATORPROCESSING ? (
                                    <Form.Item
                                        label={__('关联业务指标')}
                                        className={styles.w100per}
                                        name="biz_indicator"
                                        rules={[
                                            {
                                                required:
                                                    operate ===
                                                        OperateType.CREATE &&
                                                    !checkIsDisabled(
                                                        'biz_indicator',
                                                    ),
                                                message:
                                                    __('请选择关联业务指标'),
                                            },
                                        ]}
                                    >
                                        <FreeTaskRelateForms
                                            id="freeTaskRelateForms"
                                            data={bizIndicator}
                                            loading={bfLoading}
                                            placeholder={__(
                                                '请选择关联业务指标',
                                            )}
                                            onSelectAll={(bo, items) => {
                                                const itemsId: string[] =
                                                    items?.map((f) => f.id)
                                                if (bo) {
                                                    if (items) {
                                                        form.setFieldValue(
                                                            'biz_indicator',
                                                            [
                                                                ...form
                                                                    .getFieldValue(
                                                                        'biz_indicator',
                                                                    )
                                                                    .filter(
                                                                        (f) =>
                                                                            !itemsId.includes(
                                                                                f,
                                                                            ),
                                                                    ),
                                                                ...items.map(
                                                                    (f) => f.id,
                                                                ),
                                                            ],
                                                        )
                                                        return
                                                    }
                                                    form.setFields([
                                                        {
                                                            name: 'biz_indicator',
                                                            errors: [],
                                                            value: bizIndicator?.map(
                                                                (f) => f.id,
                                                            ),
                                                        },
                                                    ])
                                                    return
                                                }
                                                if (items) {
                                                    form.setFieldValue(
                                                        'biz_indicator',
                                                        [
                                                            ...form
                                                                .getFieldValue(
                                                                    'biz_indicator',
                                                                )
                                                                .filter(
                                                                    (f) =>
                                                                        !itemsId.includes(
                                                                            f,
                                                                        ),
                                                                ),
                                                        ],
                                                    )
                                                    return
                                                }
                                                form.setFieldValue(
                                                    'biz_indicator',
                                                    [],
                                                )
                                            }}
                                            disabled={
                                                operate === OperateType.EDIT ||
                                                checkIsDisabled('biz_indicator')
                                            }
                                        />
                                    </Form.Item>
                                ) : null
                            }}
                        </Form.Item>

                        <Form.Item
                            noStyle
                            shouldUpdate={(pre, cur) =>
                                pre.task_type !== cur.task_type
                            }
                        >
                            {({ getFieldValue }) => {
                                return getFieldValue('task_type') ===
                                    TaskType.DATACOLLECTING ? (
                                    <Form.Item
                                        label={__('关联业务表')}
                                        className={styles.w100per}
                                        name="biz_form"
                                        rules={[
                                            {
                                                required:
                                                    operate ===
                                                        OperateType.CREATE &&
                                                    !checkIsDisabled(
                                                        'biz_form',
                                                    ),
                                                message: __('请选择关联业务表'),
                                            },
                                        ]}
                                    >
                                        <FreeTaskRelateForms
                                            id="freeTaskRelateForms"
                                            data={bizForms}
                                            loading={bfLoading}
                                            onSelectAll={(bo, items) => {
                                                const itemsId: string[] =
                                                    items?.map((f) => f.id)
                                                if (bo) {
                                                    if (items) {
                                                        form.setFieldValue(
                                                            'biz_form',
                                                            [
                                                                ...form
                                                                    .getFieldValue(
                                                                        'biz_form',
                                                                    )
                                                                    .filter(
                                                                        (f) =>
                                                                            !itemsId.includes(
                                                                                f,
                                                                            ),
                                                                    ),
                                                                ...items.map(
                                                                    (f) => f.id,
                                                                ),
                                                            ],
                                                        )
                                                        return
                                                    }

                                                    form.setFields([
                                                        {
                                                            name: 'biz_form',
                                                            errors: [],
                                                            value: bizForms?.map(
                                                                (f) => f.id,
                                                            ),
                                                        },
                                                    ])
                                                    return
                                                }
                                                if (items) {
                                                    form.setFieldValue(
                                                        'biz_form',
                                                        [
                                                            ...form
                                                                .getFieldValue(
                                                                    'biz_form',
                                                                )
                                                                .filter(
                                                                    (f) =>
                                                                        !itemsId.includes(
                                                                            f,
                                                                        ),
                                                                ),
                                                        ],
                                                    )
                                                    return
                                                }
                                                form.setFieldValue(
                                                    'biz_form',
                                                    [],
                                                )
                                            }}
                                            disabled={
                                                operate === OperateType.EDIT ||
                                                checkIsDisabled('biz_form')
                                            }
                                        />
                                    </Form.Item>
                                ) : null
                            }}
                        </Form.Item>

                        <Form.Item
                            label={__('关联数据资源目录')}
                            className={styles.w100per}
                            name="assets_cat"
                            rules={[
                                {
                                    required: checkIsDisabled('assets_cat')
                                        ? !checkIsDisabled('assets_cat')
                                        : !checkIsHidden('assets_cat'),
                                    message: __('请选择关联数据资源目录'),
                                },
                            ]}
                            hidden={checkIsHidden('assets_cat')}
                        >
                            <FreeTaskRelateCats
                                data={assetsCats}
                                loading={acLoading}
                                onSelectAll={(bo, items) => {
                                    const itemsId: string[] = items?.map(
                                        (f) => f.id,
                                    )
                                    if (bo) {
                                        if (items) {
                                            form.setFieldValue('assets_cat', [
                                                ...form
                                                    .getFieldValue('assets_cat')
                                                    .filter(
                                                        (f) =>
                                                            !itemsId.includes(
                                                                f,
                                                            ),
                                                    ),
                                                ...items.map((f) => f.id),
                                            ])
                                            return
                                        }
                                        form.setFieldValue(
                                            'assets_cat',
                                            assetsCats?.map((f) => f.id),
                                        )
                                        return
                                    }
                                    if (items) {
                                        form.setFieldValue('assets_cat', [
                                            ...form
                                                .getFieldValue('assets_cat')
                                                .filter(
                                                    (f) => !itemsId.includes(f),
                                                ),
                                        ])
                                        return
                                    }
                                    form.setFieldValue('assets_cat', [])
                                }}
                                disabled={checkIsDisabled('assets_cat')}
                            />
                        </Form.Item>

                        <Form.Item
                            label={__('关联数据理解模板')}
                            className={styles.w364}
                            name="data_comprehension_template"
                            rules={[
                                {
                                    required: checkIsDisabled(
                                        'data_comprehension_template',
                                    )
                                        ? !checkIsDisabled(
                                              'data_comprehension_template',
                                          )
                                        : !checkIsHidden(
                                              'data_comprehension_template',
                                          ),
                                    message: __('请选择关联数据理解模板'),
                                },
                            ]}
                            hidden={checkIsHidden(
                                'data_comprehension_template',
                            )}
                        >
                            <PlanSelect
                                placeholder={__('请选择关联数据理解模板')}
                                fetchMethod={getComprehensionTemplate}
                                disabled={checkIsDisabled(
                                    'data_comprehension_template',
                                )}
                                onClickItem={(templateId) => {
                                    setCurrentTemplateId(templateId)
                                    setShowTemplateDetail(true)
                                }}
                            />
                        </Form.Item>
                        <Form.Item
                            label={__('任务状态')}
                            name="status"
                            rules={[
                                {
                                    required: checkIsDisabled('status')
                                        ? !checkIsDisabled('status')
                                        : false,
                                    message: __('请选择任务状态'),
                                },
                            ]}
                            // initialValue={TaskStatus.READY}
                            className={styles.w364}
                            hidden={checkIsHidden('status')}
                        >
                            <StatusSelect
                                taskId={details?.id}
                                taskType={details?.task_type}
                                taskStatus={details?.status}
                                statusArr={statusInfos}
                                disabledArr={getStatusDisabled()}
                                disabled={checkIsDisabled('status')}
                            />
                        </Form.Item>
                        <Form.Item
                            label={__('任务执行人')}
                            className={styles.w364}
                            shouldUpdate={(prevValues, curValues) =>
                                prevValues.executor_id !==
                                    curValues.executor_id ||
                                prevValues.status !== curValues.status
                            }
                            hidden={checkIsHidden('executor_id')}
                        >
                            {({ getFieldValue, setFieldValue }) => {
                                const status = getFieldValue('status')
                                const executor = getFieldValue('executor_id')
                                return (
                                    <Form.Item
                                        noStyle
                                        name="executor_id"
                                        rules={[
                                            {
                                                required:
                                                    status ===
                                                        TaskStatus.ONGOING &&
                                                    !executor,
                                                message:
                                                    __('请先分配任务执行人'),
                                            },
                                        ]}
                                    >
                                        {isSupportFreeTask && !workOrderId ? (
                                            <ExecutorScrollSelect
                                                data={freeExecutors || []}
                                                disabled={checkIsDisabled(
                                                    'executor_id',
                                                )}
                                            />
                                        ) : (
                                            <ExecutorSelect
                                                data={executors}
                                                loading={exLoading}
                                                disabled={checkIsDisabled(
                                                    'executor_id',
                                                )}
                                                isFreeTask={isSupportFreeTask}
                                            />
                                        )}
                                    </Form.Item>
                                )
                            }}
                        </Form.Item>
                        <Form.Item
                            label={__('任务优先级')}
                            name="priority"
                            // initialValue={TaskPriority.COMMON}
                            className={styles.w364}
                            rules={[
                                {
                                    required: checkIsDisabled('priority')
                                        ? !checkIsDisabled('priority')
                                        : false,
                                    message: __('请选择任务优先级'),
                                },
                            ]}
                            hidden={checkIsHidden('priority')}
                        >
                            <PrioritySelect
                                allowClear
                                disabled={checkIsDisabled('priority')}
                            />
                        </Form.Item>
                        <Form.Item
                            label={__('截止日期')}
                            name="deadline"
                            className={styles.w364}
                            rules={[
                                {
                                    required: checkIsDisabled('deadline')
                                        ? !checkIsDisabled('deadline')
                                        : false,
                                    message: __('请选择截止日期'),
                                },
                            ]}
                            hidden={checkIsHidden('deadline')}
                        >
                            <DatePicker
                                allowClear
                                inputReadOnly
                                placeholder={__('请选择截止日期')}
                                disabledDate={disabledDate}
                                style={{ width: '100%' }}
                                getPopupContainer={(node) =>
                                    node.parentNode as HTMLElement
                                }
                                disabled={checkIsDisabled('deadline')}
                            />
                        </Form.Item>
                    </Row>
                    <Form.Item
                        label={__('任务描述')}
                        name="description"
                        rules={[
                            {
                                validator: validateTextLegitimacy(
                                    keyboardRegEnter,
                                    __(
                                        '仅支持中英文、数字、及键盘上的特殊字符',
                                    ),
                                ),
                            },
                            {
                                required: checkIsDisabled('description')
                                    ? !checkIsDisabled('description')
                                    : false,
                                message: __('请输入任务描述'),
                            },
                        ]}
                        hidden={checkIsHidden('description')}
                    >
                        <Input.TextArea
                            style={{ height: 120, resize: `none` }}
                            placeholder={__('请输入任务描述')}
                            maxLength={255}
                            disabled={checkIsDisabled('description')}
                        />
                    </Form.Item>
                </Form>
            </Modal>
            {/* )} */}

            {showTemplateDetail && (
                <DetailModal
                    id={currentTemplateId}
                    onClose={() => {
                        setShowTemplateDetail(false)
                        setCurrentTemplateId(undefined)
                    }}
                />
            )}
        </div>
    )
}

export default CreateTask
