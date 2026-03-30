import { IBusinTableField, postChatFavorite } from '@/core'
import requests from '@/utils/request'
import { ICommonRes, IGetListParams, SortDirection } from '../common'
import {
    FlowChartInfo,
    FlowChartRates,
    TaskQueryParams,
    TaskInfos,
    CreateTaskParam,
    TaskReturn,
    EditTaskParam,
    ExecutorInfo,
    TaskDetail,
    ProjectInfo,
    NodePregressInfo,
    IOperateLogReq,
    IOperateLog,
    ProjectStatus,
    Priority,
    IStdTaskBusinFieldTableQuery,
    IStdTaskProcess,
    ISubmitDataEleParams,
    PointsStrategyParams,
    IIntegralRecord,
    PointsStrategyListRes,
    IIntegralListItem,
    IIntegralRecordListRes,
    IWorkOrderTaskItem,
    IOrderTaskQueryParams,
    IWorkOrderQualityAuditCheckRes,
    IDataQualityStatus,
    ISandboxApplyParams,
    ISandboxApplyItem,
    ISandboxImpListParams,
    ISandboxImplementItem,
    ISandboxAuditParams,
    ISandboxAuditItem,
    ISandboxSpaceParams,
    ISandboxSpaceItem,
    ISandboxLogParams,
    ISandboxLogItem,
    ISandboxApplyDetails,
    ISandboxImplementParams,
    ISandboxImpFinishParams,
    ISandboxImpLog,
    ISandboxExtendParams,
    ISandboxApplyListParams,
    ITenantListItem,
    ITenantApplyBasicInfo,
    ITenantAuditItem,
    ITenantApplyDetail,
    IWorkOrderTemplateInfo,
    IWorkOrderTemplatesInfo,
    WorkOrderTemplateVersion,
    WorkOrderTemplateParams,
    WorkOrderTemplateType,
    WorkOrderTemplateStatus,
    WorkOrderTemplateContent,
    IDataProcessingOverview,
    ResultsTableCatalogRes,
    QualityDepartmentData,
    ProcessDepartmentData,
    ProcessTaskDataRes,
    ResultTableDetailDataRes,
    IGetNotifications,
    INotificationsItem,
} from './index.d'

const { get, post, put, delete: del } = requests

/**
 * 删除任务
 * @param tid string 任务id
 * @returns
 */
export const myTaskDelete = (
    tid: string,
): Promise<{
    id: string
    name: string
}> => {
    return del(`/api/task-center/v1/projects/tasks/${tid}`)
}

/**
 * 批量删除任务
 * @param ids string[] 任务id列表
 * @returns
 */
export const myTaskBatchDelete = (ids: string[]) => {
    return del(`/api/task-center/v1/projects/tasks/batch/ids`, undefined, {
        ids,
    })
}

// 上传项目封面图片
export const uploadProjectCover = (params: FormData) => {
    return requests.post(`/api/task-center/v1/oss`, params)
}

// 获取封面图片
export const getProjectCover = (uuid: string) => {
    return requests.get(`/api/task-center/v1/oss/${uuid}`)
}

export interface IMember {
    id: string
    role_name: string
    role_id: string
    name: string
    roles?: string[]
}

export interface IWorkItem {
    id: string // 任务或者工单
    type: string // 类型（ 任务或者工单）
    sub_type: string //  任务类型或者工单类型
    name: string // 名称
    status: string // 状态（未派发，未开始， 执行中，完成）
    executor_name: string // 执行人
    executor_id: string // 执行人ID
    audit_status: string // 审核状态
    audit_description: string // 审核描述
    need_sync: boolean // 是否需要同步
    stage_id: string // 阶段d
    node_id: string // 节点id
    updated_at: number // 更新时间
    updated_by: string // 更新人

    deadline: number // 截止时间
    project_id: string // 项目id
    config_status: string // 配置状态
    executable_status: string // 可执行状态
    subject_domain_id: string // 主题域id
    domain_id: string // 业务域id
    overdue: string // 是否逾期
}

interface ICreateProject {
    name: string // 项目名称
    description?: string // 项目描述
    image?: string // 项目图片UUID
    flowchart_id?: string // 工作流程ID
    flowchart_version?: string // 工作流程版本ID
    status?: ProjectStatus // 项目状态
    priority?: Priority // 优先级
    owner_id: string // 项目负责人uuid
    deadline?: number
    members?: IMember[]
}
export const createProject = (params: ICreateProject) => {
    return requests.post(`/api/task-center/v1/projects`, params)
}

export const editProject = (pid: string, params: ICreateProject) => {
    return requests.put(`/api/task-center/v1/projects/${pid}`, params)
}

export interface IRoleGroup {
    role_id: string
    role_name: string
    role_color: string
    role_icon: string
    members: IMember[]
}

export interface TaskTypeGroups {
    task_type: string
    members: Array<IMember>
}

interface IGetCandidate {
    id: string
    role_groups: IRoleGroup[]
}
// 获取成员列表 - 废弃
export const getCandidate = (
    flow_id: string,
    flow_version: string,
    id: string = '',
): Promise<IGetCandidate> => {
    return requests.get(
        `/api/task-center/v1/projects/candidate?flow_id=${flow_id}&flow_version=${flow_version}&id=${id}`,
    )
}

/** 废弃 */
export const getAllTasktypeCandidate = (
    id: string = '',
): Promise<Array<TaskTypeGroups>> => {
    return requests.get(
        `/api/task-center/v1/projects/candidate/task-type?id=${id}`,
    )
}

// 校验项目名称是否重复
export const checkProjectName = (name: string, pid?: string) => {
    return requests.get(
        `/api/task-center/v1/projects/repeat?id=${pid}&name=${name}`,
    )
}

interface IGetProjects {
    status?: string
    name?: string
    offset?: number
    limit?: number
    sort?: string
    direction?: SortDirection
}

export interface IProject {
    deadline: number
    description: string
    flow_id: string
    flow_version: string
    id: string
    image: string
    name: string
    owner_id: string
    owner_name: string
    priority: string
    status: ProjectStatus
    updated_at: string
    updated_by: string
    updated_by_uid: string
    complete_time: number
    flow_name: string
    has_business_model_data: boolean
    has_data_model_data: boolean
    department_id?: string
    project_type: string //  来源: 'thirdParty'-第三方  'local'-本地
}
export interface IGetProjectsRes {
    entries: IProject[]
    limit: number
    offset: number
    total_count: number
}
// 获取项目列表
export const getProjects = (params: IGetProjects): Promise<IGetProjectsRes> => {
    return requests.get(`/api/task-center/v1/projects`, params)
}

export interface IProjectDetails extends IProject {
    members: IMember[]
}
// 获取项目详情
export const getProjectDetails = (pid: string): Promise<IProjectDetails> => {
    return requests.get(`/api/task-center/v1/projects/${pid}`)
}

export interface IStage {
    node_id: string
    node_name: string
    stage_id: string
    stage_name: string
    task_type: string[]
}
interface IGetFlowchartStage {
    entries: IStage[]
    total_count: number
}
// 获取工作流程阶段信息
export const getFlowchartStage = (pid: string): Promise<IGetFlowchartStage> => {
    return requests.get(`/api/task-center/v1/projects/${pid}/flowchart/nodes`)
}

// 获取所有项目任务执行人
export const getProjectExecutors = (pid: string): Promise<IMember[]> => {
    return requests.get(`/api/task-center/v1/projects/${pid}/executors`)
}
// 获取项目所有工单/任务
export const getProjectWorkItem = (
    pid: string,
    params: any,
): Promise<ICommonRes<IWorkItem>> => {
    return requests.get(`/api/task-center/v1/projects/${pid}/workitem`, params)
}

// 获取所有成员
export const getMembers = (task_type: string = ''): Promise<IMember[]> => {
    return requests.get(`/api/task-center/v1/users`, { task_type })
}

// 删除项目
export const deleteProject = (id: string): Promise<any> => {
    return requests.delete(`/api/task-center/v1/projects/${id}`)
}

// 获取项目管理员角色用户
export const getProjectManagers = (): Promise<IMember[]> => {
    return requests.get(`/api/task-center/v1/projects/users`)
}

/**
 * 根据项目ID获取工作流程
 * @param pid 项目id
 */
export const getFlowChartByPid = (pid: string): Promise<FlowChartInfo> => {
    return get(`/api/task-center/v1/projects/${pid}/flowchart`)
}

/**
 * 获取工作流程任务列表
 * @param pid 项目Id
 * @returns 工作流程的节点任务的进度
 */
export const getFlowChartRate = (
    pid: string,
): Promise<Array<NodePregressInfo>> => {
    return get(`/api/task-center/v1/projects/${pid}/rate`)
}

/**
 * 根据条件获取任务信息
 * @param queryData 过滤条件
 * @returns 任务信息
 */
export const getTasks = (
    queryData: TaskQueryParams = {},
): Promise<TaskInfos> => {
    return get(`/api/task-center/v1/tasks`, queryData)
}

/**
 * 创建任务
 * @param pid 项目id
 * @param param 项目参数
 * @returns
 */
export const createTask = (
    param: CreateTaskParam,
): Promise<Array<TaskReturn>> => {
    return post(`/api/task-center/v1/projects/task`, param)
}

/**
 * 编辑任务
 * @param pid 项目id
 * @param id 任务id
 * @param param 任务更新体
 * @returns
 */
export const editTask = (
    id: string,
    param: EditTaskParam,
): Promise<TaskReturn> => {
    return put(`/api/task-center/v1/projects/tasks/${id}`, param)
}

/**
 * 查询任务支持的成员 - 废弃
 * @param pid 项目id
 * @param task_type 任务类型
 * @returns 用户列表
 */
export const getTaskSupportMembers = (
    pid: string,
    task_type: string,
): Promise<Array<ExecutorInfo>> => {
    return get(`/api/task-center/v1/projects/${pid}/task/${task_type}/members`)
}

/**
 * 查询任务所有执行人列表
 * @pid string 项目id
 * @nid string 节点id
 */
export const getTaskAllExecutors = (): Promise<ExecutorInfo[]> => {
    return get(`/api/task-center/v1/executors`)
}

/**
 * 获取任务详细信息
 */
export const getTaskDetail = (id: string): Promise<TaskDetail> => {
    return get(`/api/task-center/v1/projects/tasks/${id}`)
}

/**
 * 获取任务详细信息
 */
export const getTaskDetailByProcessId = (id: string) => {
    return get(`/api/task-center/v1/projects/tasks/model/${id}`)
}
/**
 * 获取项目详情
 */
export const getProjectInfo = (pid: string): Promise<ProjectInfo> => {
    return get(`/api/task-center/v1/projects/${pid}`)
}

// 获取操作日志
export const getOperateLog = (
    params: IOperateLogReq,
): Promise<ICommonRes<IOperateLog>> => {
    return get(`/api/task-center/v1/operation`, params)
}

// ****************************************** 新建标准任务 start ******************************************

/**
 * 标准任务-业务表列表查询
 * @param task_id 任务id
 * @returns
 */
export const getStdTaskBusinTable = (
    task_id: string,
    keyword?: string,
): Promise<any> => {
    return requests.get(
        `/api/standardization/v1/dataelement/task/getBusinessTableFromTask`,
        {
            task_id,
            keyword,
        },
    )
}

/**
 * 标准任务-业务表字段列表查询
 * @param params IStdTaskBusinFieldTableQuery
 * @returns
 */
export const getStdTaskBusinFieldTable = (
    params: IStdTaskBusinFieldTableQuery,
): Promise<any> => {
    return requests.get(
        `/api/standardization/v1/dataelement/task/getBusinessTableFieldFromTask`,
        params,
    )
}

/**
 * 标准任务-业务表字段列表查询
 * @param params ISubmitDataEleParams
 * @returns
 */
export const submitDataEle = (params: ISubmitDataEleParams): Promise<any> => {
    return requests.post(
        `/api/standardization/v1/dataelement/task/submitDataElement`,
        params,
    )
}

/**
 * 标准任务-完成任务（推送结果给business）
 * @param task_id 任务id
 * @returns
 */
export const completeStdTask = (task_id: string): Promise<any> => {
    return requests.post(
        `/api/standardization/v1/dataelement/task/finishTask/${task_id}`,
        undefined,
    )
}

/**
 * 新建标准任务进度查询
 * @param task_id 标准创建任务ID
 */
export const getStdTaskProcess = (task_id: string): Promise<any> => {
    return post(
        `/api/standardization/v1/dataelement/task/queryTaskProcess`,
        {
            task_id,
        },
        {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        },
    )
}

/**
 * 修改待新建标准字段说明
 * @param id 待新建标准id
 * @param description 待新建标准字段说明
 */
export const updFieldDesc = (
    id?: string,
    description?: string,
): Promise<any> => {
    return put(`/api/standardization/v1/dataelement/task/updateDescription`, {
        id,
        description,
    })
}

/**
 * 待新建标准-采纳
 * @param ids 字段id数组
 */
export const acceptFieldStd = (ids?: Array<any>): Promise<any> => {
    return put(`/api/standardization/v1/dataelement/task/accept`, ids)
}

/**
 * 待新建标准-业务表名修改
 * @param id 业务表id
 * @param newName 新的业务表名
 */
export const updReqStdTableName = (
    id: string,
    newName: string,
): Promise<any> => {
    return put(`/api/standardization/v1/dataelement/task/updateTableName`, {
        business_table_id: id,
        business_table_name: newName,
    })
}

/**
 * 查询字段关联任务基本信息接口
 * @param id 多个任务ID逗号拼接
 * @param field 多个类型名称拼接 可选择字段id/name/status等任务表字段，拼接如：'id,name,status'
 */
export const getFieldRelateTasksInfo = (
    id: string,
    field?: string,
): Promise<any> => {
    return get(`/api/task-center/v1/tasks/brief`, {
        id,
        field,
    })
}
// ****************************************** 新建标准任务 end ******************************************

/** **************************计划管理************************* */
// 归集计划

/** 查看数据归集计划列表 */
export const getDataAggregationPlan = (params: {
    keyword?: string
    limit?: number
    offset?: number
    updated_at_end?: string
    declaration_status?: string
    started_at?: number
    finished_at?: number
    direction?: string
    user_id?: string
    audit_status?: string
    status?: string
}): Promise<any> => {
    return get(`/api/task-center/v1/data/aggregation-plan`, params)
}
/** 创建数据归集计划 */
export const createDataAggregationPlan = (params: {
    started_at?: number
    finished_at?: number
    /** 计划内容 */
    content: string
    /** 名称 */
    name: string
    /** 是否提交 */
    need_declaration?: boolean
    /** 申报意见 */
    opinion?: string
    /** 优先级  */
    priority: string
    /** 责任人 */
    responsible_uid: string
}): Promise<any> => {
    return post(`/api/task-center/v1/data/aggregation-plan`, params)
}
/** 撤回数据归集计划审核 */
export const cancelDataAggregationPlanAudit = (id: string): Promise<any> => {
    return put(`/api/task-center/v1/data/aggregation-plan/${id}/audit/cancel`)
}
/** 查看数据归集计划审核列表 */
export const getDataAggregationPlanAudit = (params: {
    keyword?: string
    limit?: number
    offset?: number
    target?: string
}): Promise<any> => {
    return get(`/api/task-center/v1/data/aggregation-plan/audit`, params)
}
/** 检查数据归集计划是否同名 */
export const checkNameDataAggregationPlan = (params: {
    id?: string
    name?: string
}): Promise<any> => {
    return get(`/api/task-center/v1/data/aggregation-plan/name-check`, params)
}
/** 查看数据归集计划详情 */
export const getDataAggregationPlanDetail = (id: string): Promise<any> => {
    return get(`/api/task-center/v1/data/aggregation-plan/${id}`)
}
/** 修改数据归集计划 */
export const updateDataAggregationPlan = (
    id: string,
    params: {
        started_at?: number
        finished_at?: number
        /** 计划内容 */
        content: string
        /** 名称 */
        name: string
        /** 是否提交 */
        need_declaration?: boolean
        /** 申报意见 */
        opinion?: string
        /** 优先级  */
        priority: string
        /** 责任人 */
        responsible_uid: string
    },
): Promise<any> => {
    return put(`/api/task-center/v1/data/aggregation-plan/${id}`, params)
}
/** 删除数据归集计划 */
export const deleteDataAggregationPlan = (id: string): Promise<any> => {
    return del(`/api/task-center/v1/data/aggregation-plan/${id}`)
}

/** 更改归集计划状态 */
export const changeDataAggregationPlanStatus = (id: string, status: string) => {
    return put(`/api/task-center/v1/data/aggregation-plan/${id}/status`, {
        status,
    })
}

// 归集清单

/** 查看数据归集清单列表 */
export const getDataAggregationInventories = (params: {
    keyword?: string
    limit?: number
    offset?: number
    statuses?: string // Auditing | Draft | Completed
    department_ids?: string
    fields?: string
    direction?: string
}): Promise<any> => {
    return get(`/api/task-center/v1/data-aggregation-inventories`, params)
}
/** 创建数据归集清单 */
export const createDataAggregationInventories = (params: {
    /** 名称 */
    name: string
    /** 组织ID */
    department_id?: boolean
    /** 资源列表 */
    resources?: {
        data_view_id: string
        collection_method: string
        collected_at: string
        sync_frequency: string
        target_datasource_id: string
    }[]
    status?: string //  Auditing 提交  | Draft 暂存
}): Promise<any> => {
    return post(`/api/task-center/v1/data-aggregation-inventories`, params)
}

/** 检查数据归集清单是否同名 */
export const checkNameDataAggregationInventories = (params: {
    id?: string
    name?: string
}): Promise<any> => {
    return get(
        `/api/task-center/v1/data-aggregation-inventories/check-name`,
        params,
    )
}
/** 查看数据归集清单详情 */
export const getDataAggregationInventoriesDetail = (
    id: string,
): Promise<any> => {
    return get(`/api/task-center/v1/data-aggregation-inventories/${id}`)
}
/** 修改数据归集清单 */
export const updateDataAggregationInventories = (
    id: string,
    params: {
        /** 名称 */
        name: string
        /** 组织ID */
        department_id?: boolean
        /** 资源列表 */
        resources?: {
            data_view_id: string
            collection_method: string
            collected_at: string
            sync_frequency: string
            target_datasource_id: string
        }[]
        /** 编辑状态 */
        status?: string //  Auditing 提交  | Draft 暂存
    },
): Promise<any> => {
    return put(`/api/task-center/v1/data-aggregation-inventories/${id}`, params)
}
/** 删除数据归集清单 */
export const deleteDataAggregationInventories = (id: string): Promise<any> => {
    return del(`/api/task-center/v1/data-aggregation-inventories/${id}`)
}

// 理解计划

/** 查看数据理解计划列表 */
export const getDataComprehensionPlan = (params: {
    keyword?: string
    limit?: number
    offset?: number
    updated_at_end?: string
    started_at?: number
    finished_at?: number
    direction?: string
    audit_status?: string
    user_id?: string
    status?: string
}): Promise<any> => {
    return get(`/api/task-center/v1/data/comprehension-plan`, params)
}
/** 创建数据理解计划 */
export const createDataComprehensionPlan = (params: {
    /** 开始日期 */
    started_at?: number
    /** 结束日期 */
    finished_at?: number
    /** 计划内容 */
    plan_info: string
    /** 名称 */
    name: string
    /** 备注 */
    remark?: string
    /** 责任人 */
    responsible_uid: string
    /** 附件ID */
    attachment_id?: string
    /** 附件名称 */
    attachment_name?: string
    /** 关联任务ID */
    task_id?: string
}): Promise<any> => {
    return post(`/api/task-center/v1/data/comprehension-plan`, params)
}
/** 撤回数据理解计划审核 */
export const cancelDataComprehensionPlanAudit = (id: string): Promise<any> => {
    return put(`/api/task-center/v1/data/comprehension-plan/${id}/audit/cancel`)
}
/** 查看数据理解计划审核列表 */
export const getDataComprehensionPlanAudit = (params: {
    keyword?: string
    limit?: number
    offset?: number
    target?: string
}): Promise<any> => {
    return get(`/api/task-center/v1/data/comprehension-plan/audit`, params)
}
/** 检查数据理解计划是否同名 */
export const checkNameDataComprehensionPlan = (params: {
    id?: string
    name?: string
}): Promise<any> => {
    return get(`/api/task-center/v1/data/comprehension-plan/name-check`, params)
}
/** 查看数据理解计划详情 */
export const getDataComprehensionPlanDetail = (id: string): Promise<any> => {
    return get(`/api/task-center/v1/data/comprehension-plan/${id}`)
}
/** 修改数据理解计划 */
export const updateDataComprehensionPlan = (
    id: string,
    params: {
        /** 开始日期 */
        started_at?: number
        /** 结束日期 */
        finished_at?: number
        /** 计划内容 */
        plan_info: string
        /** 名称 */
        name: string
        /** 备注 */
        remark?: string
        /** 责任人 */
        responsible_uid: string
        /** 附件ID */
        attachment_id?: string
        /** 附件名称 */
        attachment_name?: string
        /** 关联任务ID */
        task_id?: string
    },
): Promise<any> => {
    return put(`/api/task-center/v1/data/comprehension-plan/${id}`, params)
}
/** 删除数据理解计划 */
export const deleteDataComprehensionPlan = (id: string): Promise<any> => {
    return del(`/api/task-center/v1/data/comprehension-plan/${id}`)
}

/** 更改理解计划状态 */
export const changeDataComprehensionPlanStatus = (
    id: string,
    status: string,
) => {
    return put(`/api/task-center/v1/data/comprehension-plan/${id}/status`, {
        status,
    })
}

// 处理计划

/** 查看数据处理计划列表 */
export const getDataProcessingPlan = (params: {
    keyword?: string
    limit?: number
    offset?: number
    updated_at_end?: string
    started_at?: number
    finished_at?: number
    direction?: string
    user_id?: string
    status?: string
}): Promise<any> => {
    return get(`/api/task-center/v1/data/processing-plan`, params)
}
/** 创建数据处理计划 */
export const createDataProcessingPlan = (params: {
    started_at?: number
    finished_at?: number
    /** 计划内容 */
    content: string
    /** 名称 */
    name: string
    /** 是否提交 */
    need_declaration?: boolean
    /** 申报意见 */
    opinion?: string
    /** 优先级  */
    priority: string
    /** 责任人 */
    responsible_uid: string
}): Promise<any> => {
    return post(`/api/task-center/v1/data/processing-plan`, params)
}
/** 撤回数据处理计划审核 */
export const cancelDataProcessingPlanAudit = (id: string): Promise<any> => {
    return put(`/api/task-center/v1/data/processing-plan/${id}/audit/cancel`)
}
/** 查看数据处理计划审核列表 */
export const getDataProcessingPlanAudit = (params: {
    keyword?: string
    limit?: number
    offset?: number
    target?: string
}): Promise<any> => {
    return get(`/api/task-center/v1/data/processing-plan/audit`, params)
}
/** 检查数据处理计划是否同名 */
export const checkNameDataProcessingPlan = (params: {
    id?: string
    name?: string
}): Promise<any> => {
    return get(`/api/task-center/v1/data/processing-plan/name-check`, params)
}
/** 查看数据处理计划详情 */
export const getDataProcessingPlanDetail = (id: string): Promise<any> => {
    return get(`/api/task-center/v1/data/processing-plan/${id}`)
}
/** 修改数据处理计划 */
export const updateDataProcessingPlan = (
    id: string,
    params: {
        started_at?: number
        finished_at?: number
        /** 计划内容 */
        content: string
        /** 名称 */
        name: string
        /** 是否提交 */
        need_declaration?: boolean
        /** 申报意见 */
        opinion?: string
        /** 优先级  */
        priority: string
        /** 责任人 */
        responsible_uid: string
    },
): Promise<any> => {
    return put(`/api/task-center/v1/data/processing-plan/${id}`, params)
}
/** 删除数据处理计划 */
export const deleteDataProcessingPlan = (id: string): Promise<any> => {
    return del(`/api/task-center/v1/data/processing-plan/${id}`)
}

/** 更改处理计划状态 */
export const changeDataProcessingPlanStatus = (id: string, status: string) => {
    return put(`/api/task-center/v1/data/processing-plan/${id}/status`, {
        status,
    })
}

/** ************************************************************** */

/** ****************************调研报告********************************** */

/** 查看调研报告列表 */
export const getInvestigationReport = (params: {
    keyword?: string
    limit?: number
    offset?: number
    sort?: string
    started_at?: number
    finished_at?: number
    direction?: string
    work_order_id?: string
}): Promise<any> => {
    return get(`/api/task-center/v1/data/research-report`, params)
}
/** 创建调研报告 */
export const createInvestigationReport = (params: {
    /** 归集工单ID */
    work_order_id: string
    /** 名称 */
    name: string
    /** 是否提交 */
    need_declaration?: boolean
    /** 调研结论 */
    research_conclusion: string
    /** 调研内容 */
    research_content: string
    /** 调研方法 */
    research_method: string
    /** 调研对象 */
    research_object: string
    /** 调研目的 */
    research_purpose: string
    /** 申报意见 */
    opinion: string
}): Promise<any> => {
    return post(`/api/task-center/v1/data/research-report`, params)
}
/** 撤回调研报告审核 */
export const cancelInvestigationReportAudit = (id: string): Promise<any> => {
    return put(`/api/task-center/v1/data/research-report/${id}/audit/cancel`)
}
/** 查看调研报告审核列表 */
export const getInvestigationReportAudit = (params: {
    keyword?: string
    limit?: number
    offset?: number
    target?: string
}): Promise<any> => {
    return get(`/api/task-center/v1/data/research-report/audit`, params)
}
/** 检查调研报告是否同名 */
export const checkNameInvestigationReport = (params: {
    id?: string
    name?: string
}): Promise<any> => {
    return get(`/api/task-center/v1/data/research-report/name-check`, params)
}
/** 查看调研报告详情 */
export const getInvestigationReportDetail = (id: string): Promise<any> => {
    return get(`/api/task-center/v1/data/research-report/${id}`)
}
/** 修改调研报告 */
export const updateInvestigationReport = (
    id: string,
    params: {
        /** 归集工单ID */
        work_order_id: string
        /** 名称 */
        name: string
        /** 是否提交 */
        need_declaration?: boolean
        /** 调研结论 */
        research_conclusion: string
        /** 调研内容 */
        research_content: string
        /** 调研方法 */
        research_method: string
        /** 调研对象 */
        research_object: string
        /** 调研目的 */
        research_purpose: string
        /** 申报意见 */
        opinion: string
    },
): Promise<any> => {
    return put(`/api/task-center/v1/data/research-report/${id}`, params)
}
/** 删除调研报告 */
export const deleteInvestigationReport = (id: string): Promise<any> => {
    return del(`/api/task-center/v1/data/research-report/${id}`)
}

/** ****************************工单任务Start********************************** */

/** 查看我创建的工单列表 */
export const getWorkOrderByCreate = (params: {
    direction?: string
    keyword?: string
    limit?: number
    offset?: number
    sort?: string // "created_at" | "acceptance_at" | "finished_at"
    type?: string // data_comprehension
    started_at?: number
    finished_at?: number
    source_id?: string
}): Promise<any> => {
    return get(`/api/task-center/v1/work-order/created-by-me`, params)
}
/** 查看我负责的工单列表 */
export const getWorkOrderByResponsible = (params: {
    direction?: string
    keyword?: string
    limit?: number
    offset?: number
    sort?: string // "created_at" | "acceptance_at" | "finished_at"
    type?: string // data_comprehension
    started_at?: number
    finished_at?: number
    source_id?: string
}): Promise<any> => {
    return get(`/api/task-center/v1/work-order/my-responsibilities`, params)
}
/** 查看工单列表 */
export const getWorkOrder = (params: {
    direction?: string
    keyword?: string
    limit?: number
    offset?: number
    sort?: string // "created_at" | "acceptance_at" | "finished_at"
    type?: string // data_comprehension
    started_at?: number
    finished_at?: number
    source_id?: string
}): Promise<any> => {
    return get(`/api/task-center/v1/work-order`, params)
}
/** 创建工单 */
export const createWorkOrder = (params: {
    /** 关联数据资源目录ID */
    catalog_ids?: string[]
    /** 工单说明 */
    description?: string
    /** 名称 */
    name: string
    /** 优先级 */
    priority?: string
    /** 备注 */
    remark?: boolean
    /** 责任人 */
    responsible_uid?: string
    /** 来源ID */
    source_id?: string
    /** 来源类型 */
    source_type?: string
    /** 工单类型 */
    type: string
}): Promise<any> => {
    return post(`/api/task-center/v1/work-order`, params)
}

/** 同步工单 */
export const syncWorkOrder = (id: string): Promise<any> => {
    return post(`/api/task-center/v1/work-order/${id}/sync`)
}

/** 撤回工单审核 */
export const cancelWorkOrderAudit = (id: string): Promise<any> => {
    return put(`/api/task-center/v1/work-order/${id}/audit/cancel`)
}
/** 查看工单审核列表 */
export const getWorkOrderAudit = (params: {
    keyword?: string
    limit?: number
    offset?: number
    target?: string
}): Promise<any> => {
    return get(`/api/task-center/v1/work-order/audit`, params)
}
/** 检查工单是否同名 */
export const checkNameWorkOrder = (params: {
    id?: string
    name?: string
    type?: string
}): Promise<any> => {
    return get(`/api/task-center/v1/work-order/name-check`, params)
}
/** 查看工单详情 */
export const getWorkOrderDetail = (id: string): Promise<any> => {
    return get(`/api/task-center/v1/work-order/${id}`)
}
/** 修改工单 */
export const updateWorkOrder = (
    id: string,
    params: {
        /** 关联数据资源目录ID */
        catalog_ids?: string[]
        /** 工单说明 */
        description?: string
        /** 名称 */
        name?: string
        /** 优先级 */
        priority?: string
        /** 备注 */
        remark?: boolean

        /** 责任人 */
        responsible_uid?: string
        /** 工单类型 */
        type?: string
        [key: string]: any
    },
): Promise<any> => {
    return put(`/api/task-center/v1/work-order/${id}`, params)
}
/** 修改工单状态 */
export const updateWorkOrderStatus = (
    id: string,
    params: {
        /** 状态 */
        status?: string
        /** 处理说明 */
        processing_instructions?: string
        /** 关联归集清单ID */
        data_aggregation_inventory_id?: string
        [key: string]: any
    },
): Promise<any> => {
    return put(`/api/task-center/v1/work-order/${id}/status`, params)
}

/** 获取任务管理工单任务 */
export const getFrontWorkOrderTasks = (
    params: IOrderTaskQueryParams,
): Promise<ICommonRes<IWorkOrderTaskItem>> => {
    return get(`/api/task-center/v1/frontend/work-order-tasks`, params)
}

/** 获取工单任务 */
export const getWorkOrderTasks = (
    params: IOrderTaskQueryParams,
): Promise<ICommonRes<IWorkOrderTaskItem>> => {
    return get(`/api/task-center/v1/work-order-tasks`, params)
}

/** 删除工单 */
export const deleteWorkOrder = (id: string): Promise<any> => {
    return del(`/api/task-center/v1/work-order/${id}`)
}

/** 查看工单签收列表 */
export const getWorkOrderAcceptance = (params: {
    direction?: string
    keyword?: string
    limit?: number
    offset?: number
    sort?: string // "created_at" | "acceptance_at" | "finished_at"
    type?: string // data_comprehension
}): Promise<any> => {
    return get(`/api/task-center/v1/work-order/acceptance`, params)
}
/** 查看工单处理列表 */
export const getWorkOrderProcessing = (params: {
    direction?: string
    keyword?: string
    limit?: number
    offset?: number
    sort?: string // "created_at" | "acceptance_at" | "finished_at"
    status?: string
    type?: string // data_comprehension
}): Promise<any> => {
    return get(`/api/task-center/v1/work-order/processing`, params)
}

/** 检查质量检测是否重复 */
export const postWorkOrderQualityAuditCheck = (params: {
    view_ids: string[]
}): Promise<IWorkOrderQualityAuditCheckRes> => {
    return post(`/api/task-center/v1/work-order/quality-audit-check`, params)
}
/** 获取工单质量待审核列表 */
export const getWorkOrderQualityAudit = (params?: any): Promise<any> => {
    return get(
        `/api/task-center/v1/work-order/aggregation-for-quality-audit`,
        params,
    )
}
/** 获取华傲预览SQL */
export const getFusionPreviewSql = (params: {
    datasource_id: string // 数据源ID
    table_name: string // 表名
    scene_sql: string // 画布 sql
    fields: any[] // 字段
}): Promise<any> => {
    return post(`/api/task-center/v1/work-order/fusion-preview-sql`, params)
}

/** ****************************工单任务End********************************** */
/** ****************************积分管理********************************** */
/**
 * 创建积分策略
 * @param params PointsStrategyParams
 * @returns
 */
export const createPointsStrategy = (
    params: PointsStrategyParams,
): Promise<PointsStrategyParams> => {
    return post(`/api/task-center/v1/points-management`, params)
}

/**
 * 更新积分策略
 * @param params PointsStrategyParams
 * @returns
 */
export const updatePointsStrategy = (
    params: PointsStrategyParams,
): Promise<PointsStrategyParams> => {
    return put(`/api/task-center/v1/points-management`, params)
}

/**
 * 删除积分策略
 * @param code 策略代码
 * @returns
 */
export const deletePointsStrategy = (code: string): Promise<void> => {
    return del(`/api/task-center/v1/points-management/${code}`)
}

/**
 * 获取积分策略列表
 * @returns
 */
export const getPointsStrategyList = (): Promise<PointsStrategyListRes> => {
    return get(`/api/task-center/v1/points-management`)
}

/** ****************************积分记录********************************** */
/**
 * 获取积分记录
 * @returns
 */
export const getIntegralRecord = (): Promise<Array<IIntegralRecord>> => {
    return get(` /api/task-center/v1/points-management/summary`)
}

/**
 * 获取积分列表
 * @param params
 * @returns
 */
export const getIntegralList = (params: {
    id: string
    is_department?: boolean
}): Promise<IIntegralRecordListRes> => {
    return get(`/api/task-center/v1/points-management/events`, params)
}

/**
 * 下载积分记录
 * @param params
 * @returns
 */
export const downloadIntegralRecord = (params: {
    id: string
    is_department?: boolean
}): Promise<void> => {
    return get(
        `/api/task-center/v1/points-management/events/download`,
        params,
        {
            responseType: 'arraybuffer',
        },
    )
}

/**
 * 获取部门积分TOP5
 * @param params
 * @returns
 */
export const getDepartmentIntegralTop5 = (params: {
    year: string
    top: number
}): Promise<
    Array<{
        id: string
        name: string
        points: number
    }>
> => {
    return get(
        `/api/task-center/v1/points-management/dashboard/department-top`,
        params,
    )
}

/**
 * 获取业务模块积分
 * @param params
 * @returns
 */
export const getBusinessModuleIntegral = (params: {
    year: string
}): Promise<
    Array<{
        name: string
        points: number
        id: string
    }>
> => {
    return get(
        `/api/task-center/v1/points-management/dashboard/business-module`,
        params,
    )
}

/**
 * 获取积分增长
 * @param params
 * @returns
 */
export const getIntegralGrowth = (params: {
    year: string
}): Promise<{
    columns: Array<string>
    data: Array<Array<string>>
}> => {
    return get(
        `/api/task-center/v1/points-management/dashboard/business-module/group`,
        params,
    )
}

/** ****************************积分看板End********************************** */

/** ****************************质量报告/工单Start********************************** */

/** 获取质量报告列表 */
export const getQualityReportList = (params: {
    catalog_name?: string
    keyword?: string
    limit?: number
    offset?: number
    sort?: string
    direction?: string
}): Promise<any> => {
    return get(`/api/task-center/v1/data-quality/reports`, params)
}

/** 查看数据质量整改内容比对 */
export const getQualityReportCompare = (params: {
    work_order_id: string
}): Promise<any> => {
    return get(`/api/task-center/v1/data-quality/improvement`, params)
}
/** 获取质量整改信息 */
export const getQualityReportImprovement = (): Promise<any> => {
    return get(`/api/task-center/v1/work-order/data-quality-improvement`)
}

/** 质量整改反馈 */
export const updateQualityReportFeedback = (
    id: string,
    params: {
        score: string
        feedback_content?: string
    },
): Promise<any> => {
    return put(`/api/task-center/v1/work-order/${id}/feedback`, params)
}
/** 质量整改驳回 */
export const updateQualityReportReject = (
    id: string,
    params: {
        reject_reason: string
    },
): Promise<any> => {
    return put(`/api/task-center/v1/work-order/${id}/reject`, params)
}
/** 质量整改催办 */
export const updateQualityReportRemind = (id: string): Promise<any> => {
    return put(`/api/task-center/v1/work-order/${id}/remind`)
}

/** ****************************质量报告/工单End********************************** */

/** 根据库表id获取质量整改状态及名字 */
export const getDataQulityStatus = (params: {
    form_view_ids: string
}): Promise<{
    entries: IDataQualityStatus[]
    total: number
}> => {
    return get(`/api/task-center/v1/data-quality/status`, params)
}

/** 根据id获取工单状态等信息 */
// 无standalone 计划plan 业务表business form 数据分析data_analysis 归集工单aggregation_work_order
// 工单类型:  数据理解data_comprehension 数据归集data_aggregation 数据标准化data_standardization
//           数据融合data_fusion 数据质量稽核data_quality_audit 数据质量data_quality
export const getWorkOrderInfo = (params: {
    source_ids: string[]
    source_type: string
    type: string
}): Promise<{
    entries: any[]
    total: number
}> => {
    // const { source_ids } = params
    // const ids = source_ids.map((id) => `source_ids=${id}`).join('&')
    return post(`/api/task-center/v1/work-order/list`, params)
}

// -----------------------------------------------沙箱开始------------------------------------------------------------------

// 沙箱申请列表
export const getSandboxApplyList = (
    params: ISandboxApplyListParams,
): Promise<{
    entries: ISandboxApplyItem[]
    total: number
}> => {
    return get(`/api/task-center/v1/sandbox`, params)
}

// 沙箱实施列表
export const getSandboxImplementList = (
    params: ISandboxImpListParams,
): Promise<{
    entries: ISandboxImplementItem[]
    total: number
}> => {
    return get(`/api/task-center/v1/sandbox/execution`, params)
}

// 沙箱审核列表
export const getSandboxAuditList = (
    params: ISandboxAuditParams,
): Promise<{
    entries: ISandboxAuditItem[]
    total: number
}> => {
    return get(`/api/task-center/v1/sandbox/audit`, params)
}

// 沙箱空间列表
export const getSandboxSpaceList = (
    params: ISandboxSpaceParams,
): Promise<{
    entries: ISandboxSpaceItem[]
    total: number
}> => {
    return get(`/api/task-center/v1/sandbox/space`, params)
}

// 沙箱日志列表
export const getSandboxLogList = (
    params: ISandboxLogParams,
): Promise<{
    entries: ISandboxLogItem[]
    total: number
}> => {
    return get(`/api/task-center/v1/sandbox/space/log`, params)
}

// 沙箱空间申请详情
export const getSandboxApplyDetails = (
    id: string,
): Promise<ISandboxApplyDetails> => {
    return get(`/api/task-center/v1/sandbox/${id}`)
}

// 沙箱空间实施详情
export const getSandboxImpDetails = (id: string): Promise<any> => {
    return get(`/api/task-center/v1/sandbox/execution/${id}`)
}

// 沙箱空间申请
export const postSandboxApply = (params: ISandboxApplyParams) => {
    return post(`/api/task-center/v1/sandbox/apply`, params)
}

// 撤回沙箱空间申请
export const revocateSandboxApply = (params: { id: string }) => {
    return put(`/api/task-center/v1/sandbox/audit/revocation`, params)
}

// 沙箱实施
export const postSandboxImplement = (params: ISandboxImplementParams) => {
    return post(`/api/task-center/v1/sandbox/execution`, params)
}

// 沙箱实施完成
export const postSandboxImpFinish = (params: ISandboxImpFinishParams) => {
    return put(`/api/task-center/v1/sandbox/execution`, params)
}

// 沙箱实施日志
export const getSandboxImpLogs = (id: string): Promise<ISandboxImpLog[]> => {
    return get(`/api/task-center/v1/sandbox/execution/logs`, { id })
}

// 沙箱扩容
export const postSandboxExtend = (params: ISandboxExtendParams) => {
    return post(`/api/task-center/v1/sandbox/extend`, params)
}

// -----------------------------------------------沙箱结束------------------------------------------------------------------
/** **************************** 租户申请 start ********************************** */
/** 查看租户申请列表 */
export const getTenantApplication = (params: {
    keyword?: string
    limit?: number
    offset?: number
}): Promise<ICommonRes<ITenantListItem>> => {
    return get(`/api/task-center/v1/tenant-application`, params)
}

/** 查看租户申请详情 */
export const getTenantApplicationDetailById = (
    id: string,
): Promise<ITenantApplyDetail> => {
    return get(`/api/task-center/v1/tenant-application/${id}`)
}

/** 查看租户申请详情 */
export const checkTenantApplicationNameRepeat = (params: {
    id?: string
    name?: string
}): Promise<{
    repeat: boolean
}> => {
    return get(`/api/task-center/v1/tenant-application/name-check`, params)
}

/** 创建租户申请 */
export const addTenantApplication = (
    params: ITenantApplyBasicInfo,
): Promise<any> => {
    return post(`/api/task-center/v1/tenant-application`, params)
}

/** 修改租户申请信息 */
export const updTenantApplication = (
    id: string,
    params: ITenantApplyBasicInfo,
): Promise<any> => {
    return put(`/api/task-center/v1/tenant-application/${id}`, params)
}

/** 修改租户申请状态 */
export const updTenantApplicationStatus = (
    id: string,
    params: {
        status: string
    },
): Promise<any> => {
    return put(`/api/task-center/v1/tenant-application/${id}/status`, params)
}

/** 删除租户申请 */
export const delTenantApplication = (id: string): Promise<any> => {
    return del(`/api/task-center/v1/tenant-application/${id}`)
}

/** 获取租户申请审核列表 */
export const queryTenantApplicationAuditList = (
    params: IGetListParams,
): Promise<ICommonRes<ITenantAuditItem>> => {
    return get(`/api/task-center/v1/tenant-application/audit`, params)
}

/**
 * 撤回租户申请审核
 * @param id 租户申请id
 * @returns
 */
export const cancelTenantApplicationAudit = (
    id: string,
    params: {
        cancel_reason: string
    },
): Promise<any> => {
    return put(
        `/api/task-center/v1/tenant-application/${id}/audit/cancel`,
        params,
    )
}

/** **************************** 租户申请 end ********************************** */

/** **************************** 工单模板 start ********************************** */
/** 查询工单模板信息列表 */
export const getWorkOrderTemplatesList = (params?: {
    template_name?: string
    template_type?: string
    is_active?: number
    keyword?: string
    offset?: number
    limit?: number
}): Promise<
    ICommonRes<{
        entries: IWorkOrderTemplatesInfo[]
        total_count: number
    }>
> => {
    return get(`/api/task-center/v1/work-order-manage`, params)
}

/** 查看工单模板详情 */
export const getWorkOrderTemplatesDetail = (
    id: string,
): Promise<ICommonRes<IWorkOrderTemplatesInfo>> => {
    return get(`/api/task-center/v1/work-order-manage/${id}`)
}

/** 新增工单模板 */
export const createWorkOrderTemplates = (data: {
    template_name: string
    template_type: string
    description?: string
    content: any
}): Promise<ICommonRes<{ id: string }>> => {
    return post(`/api/task-center/v1/work-order-manage`, data)
}

/** 修改工单模板 */
export const updateWorkOrderTemplates = (
    id: string,
    data: {
        template_name?: string
        description?: string
        content?: any
        is_active?: number
    },
): Promise<ICommonRes<{ id: string }>> => {
    return put(`/api/task-center/v1/work-order-manage/${id}`, data)
}

/** 删除工单模板 */
export const deleteWorkOrderTemplates = (
    id: string,
): Promise<ICommonRes<{ id: string }>> => {
    return del(`/api/task-center/v1/work-order-manage/${id}`)
}
/** 工单模板名称校验 */
export const checkNameWorkOrderTemplate = (params: any) => {
    return get(`/api/task-center/v1/work-order-manage/check-name`, params)
}

/** 查询工单模板历史版本列表 */
export const getWorkOrderTemplatesVersionList = (
    templateId: string,
    params?: {
        offset?: number
        limit?: number
    },
): Promise<
    ICommonRes<{
        entries: any[]
        total_count: number
    }>
> => {
    return get(
        `/api/task-center/v1/work-order-manage/${templateId}/versions`,
        params,
    )
}

/** 查看工单模板历史版本详情 */
export const getWorkOrderTemplatesVersionDetail = (
    templateId: string,
    version: number,
): Promise<ICommonRes<any>> => {
    return get(
        `/api/task-center/v1/work-order-manage/${templateId}/versions/${version}`,
    )
}

/** **************************** 工单模板 end ********************************** */

/** **************************** 工单模板V1 start ********************************** */
/** 查看工单模板列表 */
export const getWorkOrderTemplate = (params: {
    keyword?: string
    limit?: number
    offset?: number
    ticket_type?: string
    status?: number
}): Promise<ICommonRes<IWorkOrderTemplateInfo>> => {
    return get(`/api/task-center/v1/work-order-template`, params)
}

/** 查看工单模板详情 */
export const getWorkOrderTemplateDetailById = (
    id: string,
): Promise<IWorkOrderTemplateInfo> => {
    return get(`/api/task-center/v1/work-order-template/${id}`)
}

/** 创建工单模板 */
export const createWorkOrderTemplate = (
    params: Partial<IWorkOrderTemplateInfo>,
): Promise<any> => {
    return post(`/api/task-center/v1/work-order-template`, params)
}

/** 更新工单模板信息 */
export const updateWorkOrderTemplate = (
    id: Pick<IWorkOrderTemplateInfo, 'id'>,
    params: Partial<IWorkOrderTemplateInfo>,
): Promise<any> => {
    return put(`/api/task-center/v1/work-order-template/${id}`, params)
}

/** 更新工单模板启用状态 */
export const updateWorkOrderTemplateStatus = (
    id: Pick<IWorkOrderTemplateInfo, 'id'>,
    status: number,
): Promise<any> => {
    return put(`/api/task-center/v1/work-order-template/${id}/${status}`)
}

/** 删除工单模板 */
export const deleteWorkOrderTemplate = (id: string): Promise<any> => {
    return del(`/api/task-center/v1/work-order-template/${id}`)
}

/** **************************** 工单模板V1 end ********************************** */

/** **************************** 数据处理概览 start ********************************** */

/**
 * 数据处理概览
 * @param params 参数
 * @returns
 */
export const getDataProcessingOverview = (params: {
    my_department: boolean
}): Promise<IDataProcessingOverview> => {
    return get(`/api/task-center/v1/date_processing/overview`, params)
}

/**
 * 获取成果表数据资源目录
 * @param params
 * @returns
 */
export const getResultsTableCatalog = (params: {
    limit?: number
    offset?: number
    my_department: boolean
    subject_id?: string
}): Promise<{
    total_count: number
    entries: ResultsTableCatalogRes[]
}> => {
    return get(
        `/api/task-center/v1/date_processing/overview/results_table_catalog`,
        params,
    )
}

/**
 * 获取部门数据
 * @param params 参数
 * @returns
 */
export const getQualityDepartmentData = (params: {
    limit?: number
    offset?: number
    my_department: boolean
    keyword?: string
}): Promise<{
    total_count: number
    entries: QualityDepartmentData[]
}> => {
    return get(
        `/api/task-center/v1/date_processing/overview/quality_department`,
        params,
    )
}

/**
 * 获取部门整改数据
 * @param params 参数
 * @returns
 */
export const getDepartmentQualityProcessData = (params: {
    limit?: number
    offset?: number
    my_department: boolean
    keyword?: string
}): Promise<{
    total_count: number
    entries: ProcessDepartmentData[]
}> => {
    return get(
        `/api/task-center/v1/date_processing/overview/department_quality_process`,
        params,
    )
}

/**
 * 获取加工任务数据
 * @param params
 * @returns
 */
export const getProcessTaskData = (params: {
    my_department: boolean
}): Promise<ProcessTaskDataRes> => {
    return get(
        `/api/task-center/v1/date_processing/overview/process_task`,
        params,
    )
}

/**
 * 获取成果表详情数据
 * @param params 参数
 * @returns
 */
export const getResultTableDetailData = (params: {
    my_department: boolean
}): Promise<ResultTableDetailDataRes> => {
    return get(
        `/api/task-center/v1/date_processing/overview/target_table`,
        params,
    )
}

/** **************************** 数据处理概览 end ********************************** */

/** **************************** 通知 start ********************************** */
// 获取通知
export const getNotifications = (
    params: IGetNotifications,
): Promise<{
    entries: INotificationsItem[]
    total_count: number
}> => get(`/api/task-center/v1/notifications`, params)

// 标记通知
export const updateNotifications = () =>
    put(`/api/task-center/v1/notifications`)

// 获取消息详情
export const getNotificationById = (id: string): Promise<INotificationsItem> =>
    get(`/api/task-center/v1/notifications/${id}`)

// 标记消息为已读
export const updateNotificationById = (id: string) =>
    put(`/api/task-center/v1/notifications/${id}`)
/** **************************** 通知 end ********************************** */
