import requests from '@/utils/request'

import {
    FormFiledsReturn,
    SourceFormInfo,
    CanvasInfo,
    DataListTemplate,
    MetaDataFormInfo,
    CollectingTableDataParams,
    ProcessingTableDataParams,
    SearchCommonParms,
    SearchAllIndicator,
    IndicatorModelStruct,
    IndicatorModelCanvasStruct,
    SyncDataInfo,
    DataSyncParams,
    DataSyncInfo,
    IWorkflowNode,
    IWorkflowDetails,
    IWorkflowItem,
    DataProcessParams,
    DataProcessInfo,
    ProcessDataInfo,
    IBusinessDomainCount,
    IStdToBeExecTask,
    IStdCompletedTask,
    IFlowchartCheckUniquenessModel,
    IFlowchartCheckUniquenessParams,
    IFlowchartItem,
    IFlowchartModel,
    IFlowchartQueryParams,
    IFlowchartResBaseModel,
    IFlowchartResParams,
    IFlowTreeModel,
    IFlowTreeNodeModel,
    IFlowTreeParams,
    IBusinFlowChartItem,
    IMainAllFlowChart,
    IFormCheckUniquenessModel,
    IFormCheckUniquenessParams,
    IFormEditParams,
    IFormQueryCountModel,
    IFormQueryFieldsListModel,
    IFormQueryFieldsListParams,
    IFormQueryListModel,
    IFormQueryListParams,
    IFormItem,
    RecommendData,
    FormFieldAttribute,
    ICreateStandardTaskList,
    ICreateStandardTaskAndList,
    IImportBussinessFormInfo,
    IImportBussinessFormsInfo,
    IDataFormField,
    IGlossary,
    IGlossaryList,
    ICategoriesQuery,
    IMove,
    ITermsRelation,
    ILevelList,
    IIndicatorConfig,
    ICreateIndicator,
    IQueryListRes,
    IQueryIndicators,
    IIndicatorsInfo,
    IBusinessTables,
    IQueryModals,
    IModalDetailsAllInfo,
    IUpdateConsistentStatus,
    IIds,
    ICreateRoleParams,
    IQueryRoles,
    IQueryRolesRes,
    ICheckRoleParams,
    IQueryForms,
    IQueryFormRes,
    IQueryStandards,
    IQueryStandardsRes,
    ICreateStandard,
    IEditStandardsParams,
    IStandardDetail,
    IStandardEnum,
    IBusinessDomainTreeParams,
    IBusinessDomainItem,
    IBusinessDomainTreeNodeParams,
    ICheckBusinessDomainTreeNodeParams,
    IBusinessDomainProcessTreeParams,
    IBusinessDomainProcessListParams,
    IProcessNodeCount,
    IBusinessIndicator,
    IUngroupForm,
    IBusinessDiagnosis,
    ICreateBusinessDiagnosis,
    IBusinessDiagnosisItem,
    IInfoSysProcessListParams,
    ICatalogFrontInfo,
    IBusinessAuditReq,
    IBusinessAuditRes,
    BizModelType,
    BusinessAuditStatus,
    PublishedStatus,
    IModalVersion,
} from './index.d'
import { ICommonRes, SortDirection } from '../common'

const { get, post, put, delete: del } = requests

interface ICommonList<T> {
    entries: T
    limit?: number
    offset?: number
    total_count: number
}
// -------------------------------------------业务架构视角看业务模型开始-----------------------------------------------

export interface ICoreBusinessDetails {
    business_model_id?: string
    created_at?: number
    created_by?: string
    created_by_uid?: string
    description?: string
    main_business_id?: string
    name?: string
    updated_at?: number
    updated_by?: string
    updated_by_uid?: number
    business_domain_id: string
    business_domain_name: string
    subject_domain_id: string
    subject_domain_name: string
    business_matters: {
        id: string
        name: string
    }[]
    business_system: {
        id: string
        name: string
    }[]
    department_id: string
    department_name: string
    relevant_standards: string
    topic_classification: string
    business_responsibilities: string
    type?: string
    department_path: string
    same_node_model_id?: string
    audit_status?: BusinessAuditStatus
    published_status?: PublishedStatus
    reject_reason?: string
    draft_created_at?: number
    draft_created_by?: string
    has_draft?: boolean
}

export interface ICoreBusinessItem {
    id: string
    business_model_id: string
    created_at: number
    created_by: string
    created_by_uid: number
    description: string
    flowchart_count: number
    form_count: number
    indicator_count: number
    main_business_id: string
    name: string
    updated_at: number
    updated_by: string
    updated_by_uid: number
    business_domain_id: number
    business_domain_name: string
    domain_id: string
    domain: string
    subject_domain_id: string
    subject_domain_name: string
    department_id: string
    department_name: string
    type: string
    department_path: string
    // 关联信息系统
    business_system?: Array<string>
    // 关联信息系统名称
    business_system_name: Array<string>
    task_id?: string
    locked?: boolean
    audit_status?: BusinessAuditStatus
    published_status?: PublishedStatus
    has_draft: boolean
}

// 获取业务模型详情
export const getCoreBusinessDetails = (
    mid: string,
    params?: {
        is_draft?: boolean
        version_id?: string
    },
): Promise<ICoreBusinessDetails> => {
    return get(`/api/business-grooming/v1/main-businesses/${mid}`, params)
}

export interface ICoreBusinessesParams {
    offset?: number
    limit?: number
    sort?: string
    direction?: SortDirection
    id?: string
    object_id?: string
    keyword?: string
    project_id?: string
    is_all?: boolean
    task_id?: string
    unassigned?: boolean
    node_id?: string
    getall?: boolean
    department_id?: string
    info_system_id?: string
    model_type?: string
}
// 获取业务模型  （根据业务域节点）
export const getCoreBusinesses = (
    params: ICoreBusinessesParams,
): Promise<ICommonList<ICoreBusinessItem[]>> => {
    return get('/api/business-grooming/v1/domain/nodes/business-models', params)
}

// 获取业务模型  （根据部门）
export const getBusinessModelByDepartment = (
    params: Partial<ICoreBusinessesParams>,
): Promise<ICommonList<ICoreBusinessItem[]>> => {
    return get('/api/business-grooming/v1/main-businesses', params)
}

// 获取给定流程节点的业务模型相关数量
export const getProcessNodeCountInfo = (
    id: string,
    params: { model_type: BizModelType },
): Promise<IProcessNodeCount> => {
    return get(
        `/api/business-grooming/v1/domain/nodes/business-models/${id}`,
        params,
    )
}

interface ICreateCoreBusinessParams {
    domain_id?: string
    name: string
    task_id: string
}
// 创建业务模型
export const createCoreBusiness = (params: ICreateCoreBusinessParams) => {
    return post('/api/business-grooming/v1/main-business', params)
}

// 编辑业务模型
export const updateCoreBusiness = (
    params: ICreateCoreBusinessParams,
    mid: string,
) => {
    return put(`/api/business-grooming/v1/main-businesses/${mid}`, params)
}

// 删除业务模型
export const deleteCoreBusiness = (
    mid: string,
    params = { taskId: '', subject_domain_id: '' },
) => {
    return del(
        `/api/business-grooming/v1/main-businesses/${mid}?task_id=${params?.taskId}&subject_domain_id=${params.subject_domain_id}`,
    )
}

interface ICheckCoreBusinessName {
    id?: string
    name: string
    task_id?: string
    model_type?: BizModelType
}

// 业务模型重名校验
export const checkCoreBusinessName = (params: ICheckCoreBusinessName) => {
    return get(`/api/business-grooming/v1/main-businesses/check`, params)
}

// -------------------------------------------业务架构视角看业务模型结束-----------------------------------------------

/**
 * 获取数据表
 */
export const getFirstSourceTables = (
    fid: string,
): Promise<{ tables: Array<SourceFormInfo> }> => {
    return get(`/api/business-grooming/v1/data-tables/source-tables/${fid}`)
}

/**
 * 获取数据表的数据
 */
export const getSourceTables = (
    fid: string,
    params: {
        version: 'draft' | 'published'
    },
): Promise<SourceFormInfo> => {
    return get(`/api/business-grooming/v1/data-tables/${fid}`, params)
}

/**
 *
 * @param fid 业务表id
 * @param params query参数包含版本
 * @returns
 */
export const getCanvasCollecting = (
    fid: string,
    params: {
        version: 'draft' | 'published'
    },
): Promise<CanvasInfo> => {
    return get(
        `/api/business-grooming/v1/data-tables/${fid}/canvas/collecting`,
        params,
    )
}

/**
 * 保存或者发布采集画布
 */
export const saveCollectingCanvas = (
    fid: string,
    params: {
        action: 'saving' | 'publishing'
        content: string
        task_id?: string
    },
): Promise<
    Array<{
        id: string
        name: string
    }>
> => {
    return post(
        `/api/business-grooming/v1/data-tables/${fid}/canvas/collecting`,
        params,
    )
}

/**
 *  获取最近同步的贴源表
 * @returns
 */
export const getDataTables = (): Promise<DataListTemplate<SourceFormInfo>> => {
    return get(`/api/business-grooming/v1/data-tables`)
}

/**
 *  从元数据平台搜索贴源表
 * @param keyword 关键字
 * @returns
 */
export const searchDataTablesFromMetaData = (
    keyword: string,
    offset: number = 0,
): Promise<DataListTemplate<MetaDataFormInfo>> => {
    return get(`/api/business-grooming/v1/data-tables/metadata`, {
        keyword,
        offset,
    })
}

/**
 * 获取源数据平台表信息
 * @param id 元数据平台数据表id
 * @param params 数据各种id
 * @returns
 */
export const getMetaDataTables = (
    id: string,
    params: {
        data_source_id: string
        schema_id: string
    },
): Promise<SourceFormInfo> => {
    return get(`/api/business-grooming/v1/data-tables/${id}/metadata`, params)
}

/**
 * 第一次保存或者发布贴原表数据
 * @param id 业务表id
 * @param params 参数
 * @returns
 */
export const saveFirstCollectingDataTable = (
    id: string,
    params: CollectingTableDataParams,
) => {
    return post(
        `/api/business-grooming/v1/data-tables/${id}/collecting`,
        params,
    )
}

/**
 * 保存或发布贴原表数据
 * @param id 业务表id
 * @param params 参数
 * @returns
 */
export const saveCollectingDataTable = (
    id: string,
    params: CollectingTableDataParams,
) => {
    return post(
        `/api/business-grooming/v1/data-tables/${id}/collecting`,
        params,
    )
}

/**
 * 刷新元数据平台
 */
export const checkDataTables = (params: {
    ids: Array<string>
    task_id: string
}): Promise<
    Array<{
        id: string

        is_consistent: boolean

        name: string
    }>
> => {
    return put(`/api/business-grooming/v1/data-tables/check`, params)
}

/**
 * 第一次保存/发布加工模型
 * @param id 业务表id
 * @param params 保存数据
 * @returns
 */
export const saveFirstProcessingDataTable = (
    id: string,
    params: ProcessingTableDataParams,
) => {
    return post(
        `/api/business-grooming/v1/data-tables/${id}/processing`,
        params,
    )
}

/**
 * 保存、发布加工模型
 * @param id 业务表id
 * @param params 保存数据
 * @returns
 */
export const saveProcessingDataTable = (
    id: string,
    params: ProcessingTableDataParams,
) => {
    return put(`/api/business-grooming/v1/data-tables/${id}/processing`, params)
}

/**
 * 保存加工模型画布
 * @param fid 业务表id
 * @param params 参数
 * @returns
 */
export const saveProcessingCanvas = (
    fid: string,
    params: {
        action: 'saving' | 'publishing'
        content: string
        task_id?: string
    },
) => {
    return post(
        `/api/business-grooming/v1/data-tables/${fid}/canvas/processing`,
        params,
    )
}

/**
 * 获取加工画布
 * @param id 业务表id
 * @param params
 * @returns
 */
export const getCanvasProcessing = (
    id: string,
    params: {
        version: 'draft' | 'published'
    },
): Promise<CanvasInfo> => {
    return get(
        `/api/business-grooming/v1/data-tables/${id}/canvas/processing`,
        params,
    )
}

/**
 * 获取数据表
 */
export const getFirstProcessingTables = (
    fid: string,
): Promise<{ tables: Array<SourceFormInfo> }> => {
    return get(`/api/business-grooming/v1/data-tables/std-tables/${fid}`)
}

/**
 * 完成采集/加工任务
 */
export const completeCollectOrProcess = (
    id: string,
    params: { task_id: string },
) => {
    return put(`/api/business-grooming/v1/data-tables/${id}/complete`, params)
}
/**
 * 获取加工需要的采集表
 */
export const getCollectTablesForProcess = (
    id: string,
): Promise<DataListTemplate<SourceFormInfo>> => {
    return get(`/api/business-grooming/v1/data-tables/${id}/collecting`)
}

/**
 * 获取本部门数据表
 * @param id
 * @returns
 */
export const getCurrentDepartmentDataTable = (
    id: string,
): Promise<{
    department_id: string
    department_name: string
    tables: Array<{
        id: string
        name: string
    }>
}> => {
    return get(`/api/business-grooming/v1/data-tables/forms/${id}`)
}

// -------------------------------------------业务指标部分-----------------------------------------------
/**
 * 查询指标列表
 * @param mid
 */
export const getIndicatorList = (mid: string): Promise<Array<any>> => {
    return get(
        `/api/business-grooming/v1/business-model/indicator-models/${mid}/indicator`,
    )
}

/**
 * 查询所有指标列表
 * @param mid
 */
export const getAllIndicatorList = (
    params: SearchAllIndicator,
): Promise<Array<any>> => {
    return get(
        `/api/business-grooming/v1/business-model/indicator-models/indicator`,
        params,
    )
}

/**
 *  获取指标模型
 * @param mid 业务模型id
 * @param params 获取参数
 * @returns
 */
export const getIndicatorModels = (
    mid: string,
    params: SearchCommonParms,
): Promise<ICommonRes<IndicatorModelStruct>> => {
    return get(
        `/api/business-grooming/v1/business-model/${mid}/indicator-models`,
        params,
    )
}

/**
 * 创建指标
 * @param fid 业务表id
 * @param params 参数
 * @returns
 */
export const createIndicator = (
    id: string,
    params: {
        rule: any
        name: string
        desc?: string
    },
) => {
    return post(
        `/api/business-grooming/v1/business-model/indicator-models/${id}/indicator`,
        params,
    )
}

/*
 * 创建指标模型
 * @param mid 业务模型id
 * @param parms 参数
 * @returns
 */
export const createIndicatorModel = (
    mid,
    parms: {
        name: string
        description?: string
        task_id?: string
    },
): Promise<
    Array<{
        id: string
        name: string
    }>
> => {
    return post(
        `/api/business-grooming/v1/business-model/${mid}/indicator-models`,
        parms,
    )
}

/**
 * 编辑指标
 * @param fid 业务表id
 * @param params 参数
 * @returns
 */
export const editIndicator = (
    id: string,
    params: {
        name: string
        desc?: string
        rule: any
    },
) => {
    return put(
        `/api/business-grooming/v1/business-model/indicator-models/indicator/${id}`,
        params,
    )
}

/*
 * 重名检查判断
 * @param mid 业务模型id
 * @param params 重名检查参数
 * @returns
 */
export const checkIndicatorModelRepeated = (
    mid,
    params: {
        iid?: string
        name: string
    },
): Promise<{
    name: string
    repeat: boolean
}> => {
    return get(
        `/api/business-grooming/v1/business-model/${mid}/indicator-models/name-check`,
        params,
    )
}

/**
 * 指标预览
 * @param fid 业务表id
 * @param params 参数
 * @returns
 */
export const viewIndicator = (params: {
    desc?: string
    name: string
    rule: any
    indicator_model?: string
}) => {
    return post(
        `/api/business-grooming/v1/business-model/indicator-models/indicator/preview`,
        params,
    )
}
/**
 * 查询指标详情
 * @param id
 */
export const getIndicatorDetails = (id: string): Promise<any> => {
    return get(
        `/api/business-grooming/v1/business-model/indicator-models/indicator/${id}`,
    )
}

/*
 * 获取指标模型详情
 * @param mid 业务模型id
 * @param iid 模型id
 * @returns
 */
export const getIndicatorModel = (
    mid: string,
    iid: string,
): Promise<IndicatorModelStruct> => {
    return get(
        `/api/business-grooming/v1/business-model/${mid}/indicator-models/${iid}`,
    )
}

/**
 * 更新指标模型
 * @param mid 业务模型id
 * @param iid 指标id
 * @param params 参数
 * @returns
 */
export const updateIndicatorModel = (
    mid: string,
    iid: string,
    params: {
        name: string
        description?: string
        task_id?: string
    },
): Promise<
    Array<{
        id: string
        name: string
    }>
> => {
    return put(
        `/api/business-grooming/v1/business-model/${mid}/indicator-models/${iid}`,
        params,
    )
}

/**
 * 删除指标模型
 * @param mid 业务模型id
 * @param iid 模型id
 * @returns
 */
export const deleteIndicatorModel = (
    mid: string,
    iid: string,
): Promise<
    Array<{
        id: string
        name: string
    }>
> => {
    return del(
        `/api/business-grooming/v1/business-model/${mid}/indicator-models/${iid}`,
    )
}

/**
 * 删除指标
 * @param id
 */
export const delIndicator = (
    id: string,
): Promise<DataListTemplate<SourceFormInfo>> => {
    return del(
        `/api/business-grooming/v1/business-model/indicator-models/indicator/${id}`,
    )
}

/*
 * 保存指标图数据
 * @param mid 业务模型id
 * @param iid 模型id
 * @param params 图及图关系数据
 * @returns
 */
export const saveIndicatorModelCanvas = (
    mid: string,
    iid: string,
    params: IndicatorModelCanvasStruct,
): Promise<
    Array<{
        id: string
        name: string
    }>
> => {
    return put(
        `/api/business-grooming/v1/business-model/${mid}/indicator-models/${iid}/canvas`,
        params,
    )
}

/**
 * 校验元数据平台是否存在当前的表
 * @param params
 * @returns
 */
export const checkPasteNameByDataSource = (params: {
    name: string
    datasource_id: string
}): Promise<{
    name: string
    repeat: boolean
}> => {
    return get(`/api/business-grooming/v1/data-tables/name-check`, params)
}

/**
 * 校验元数据平台是否存在数据表
 */
export const checkFormExistByDataSource = (
    params: SourceFormInfo,
): Promise<{ is_consistent: boolean; name: string }> => {
    return post(
        `/api/business-grooming/v1/data-tables/check-consistence`,
        params,
    )
}
// ----------------------------------------数据同步----------------------

/**
 * 保存数据同步
 * @param params
 * @returns
 */
export const saveSyncData = (
    params: SyncDataInfo,
): Promise<
    Array<{
        id: string
        name: string
    }>
> => {
    return post(`/api/business-grooming/v1/collecting/models`, params)
}

/**
 * 获取数据同步列表
 */
export const getSyncDataList = (
    params: DataSyncParams,
): Promise<DataListTemplate<DataSyncInfo>> => {
    return get(`/api/business-grooming/v1/collecting/models`, params)
}

/**
 * 删除采集模型
 */
export const deleteSyncDataModel = (
    id,
    params: {
        task_id: string
    },
): Promise<any> => {
    return del(`/api/business-grooming/v1/collecting/models/${id}`, params)
}

/**
 * 获取模型的详情
 */
export const getSyncModelDetail = (id: string): Promise<SyncDataInfo> => {
    return get(`/api/business-grooming/v1/collecting/models/${id}`)
}

/**
 * 编辑模型名称
 */
export const editSyncModelInfo = (
    id: string,
    params: {
        description: string
        name: string
        task_id: string
    },
) => {
    return put(`/api/business-grooming/v1/collecting/models/${id}/name`, params)
}

/**
 * 更新同步模型
 */
export const updateSyncModel = (id: string, params: SyncDataInfo) => {
    return put(`/api/business-grooming/v1/collecting/models/${id}`, params)
}

/**
 * 同步模型同名检查
 */
export const checkSyncModelRepeatName = (params: {
    name: string
    id?: string
}): Promise<{
    name: string
    repeat: boolean
}> => {
    return get(`/api/business-grooming/v1/collecting/models/name-check`, params)
}

// -------------------------------------------数据开发工作流-----------------------------------------------
/**
 * 判断工作流名称是否存在
 * @name 名称
 * @id ID
 */
export const checkNameExist = (
    name: string,
    id: string = '',
): Promise<{ name: string; repeat: boolean }> => {
    return get(
        `/api/business-grooming/v1/workflows/name-check?name=${name}&id=${id}`,
    )
}

/**
 * 创建工作流（画布+名称描述）
 * @name 名称
 * @description 描述
 * @nodes 节点
 * @canvas 画布信息
 * @task_id 任务id
 */
export const createWorkFlow = (params: {
    name: string
    description: string
    nodes: IWorkflowNode[]
    canvas: string
    task_id?: string
}): Promise<{ id: string; name: string }> => {
    return post(`/api/business-grooming/v1/workflows`, params)
}

/**
 * 修改工作流（画布)
 * @id ID
 * @nodes 节点
 * @canvas 画布信息
 * @task_id 任务id
 */
export const editWorkFlowGraph = (
    id: string,
    params: {
        nodes: IWorkflowNode[]
        canvas: string
        task_id?: string
    },
): Promise<{ id: string; name: string }> => {
    return put(`/api/business-grooming/v1/workflows/${id}`, params)
}

/**
 * 修改工作流（名称描述）
 * @id ID
 * @name 名称
 * @description 描述
 * @task_id 任务id
 */
export const editWorkFlow = (
    id: string,
    params: {
        name: string
        description: string
        task_id?: string
    },
): Promise<{ id: string; name: string }> => {
    return put(`/api/business-grooming/v1/workflows/${id}/name`, params)
}

/**
 * 获取工作流详情（画布 + 名称描述）
 */
export const getWorkFlowDetails = (id: string): Promise<IWorkflowDetails> => {
    return get(`/api/business-grooming/v1/workflows/${id}`)
}

/**
 * 删除工作流
 * @id ID
 * @task_id 任务id
 */
export const deleteWorkFlow = (
    id: string,
    task_id: string = '',
): Promise<any> => {
    return del(`/api/business-grooming/v1/workflows/${id}?task_id=${task_id}`)
}

/**
 * 工作流列表
 * @name 名称
 * @id ID
 */
export const queryWorkFlowList = (
    params: any,
): Promise<{ entries?: IWorkflowItem[]; total_count: number }> => {
    return get(`/api/business-grooming/v1/workflows`, params)
}

/**
 * 启用/禁用工作流
 * @id ID
 * @activation c
 * @task_id 任务id
 */
export const editWorkFlowStatus = (
    id: string,
    activation: boolean,
    task_id: string = '',
): Promise<any> => {
    return put(`/api/business-grooming/v1/workflows/${id}/status`, {
        activation,
        task_id,
    })
}

/**
 * 新建时间计划
 * @id ID
 * @frequency 描述
 * @activation 状态
 * @execution_time 执行时间 "10:00"
 * @start_date 开始时间 "2023-07-01"
 * @end_date 结束时间 "2023-07-01"
 * @task_id 任务id
 */
export const createWfTimePlan = (
    id: string,
    params: {
        frequency: number
        unit: string
        activation: boolean
        execution_time: string
        start_date: string
        end_date?: string
        task_id?: string
    },
): Promise<any> => {
    return post(`/api/business-grooming/v1/workflows/${id}/plans`, params)
}

/**
 * 修改时间计划
 * @id ID
 * @frequency 描述
 * @activation 状态
 * @execution_time 执行时间 "10:00"
 * @start_date 开始时间 "2023-07-01"
 * @end_date 结束时间 "2023-07-01"
 * @task_id 任务id
 */
export const editWfTimePlan = (
    id: string,
    params: {
        frequency: number
        unit: string
        activation: boolean
        execution_time: string
        start_date: string
        end_date?: string
        task_id?: string
    },
): Promise<any> => {
    return put(`/api/business-grooming/v1/workflows/${id}/plans`, params)
}

// --------------------------------------------- 数据加工---------------------------------

/**
 * 获取数据同步列表
 */
export const getProcessDataList = (
    params: DataProcessParams,
): Promise<DataListTemplate<DataProcessInfo>> => {
    return get(`/api/business-grooming/v1/processing/models`, params)
}

/**
 * 删除加工模型
 */
export const deleteProcessDataModel = (
    id: string,
    params: {
        task_id: string
    },
): Promise<any> => {
    return del(`/api/business-grooming/v1/processing/models/${id}`, params)
}

/**
 * 保存数据同步
 * @param params
 * @returns
 */
export const saveProcessData = (
    params: ProcessDataInfo,
): Promise<
    Array<{
        id: string
        name: string
    }>
> => {
    return post(`/api/business-grooming/v1/processing/models`, params)
}

/**
 * 获取模型的详情
 */
export const getProcessModelDetail = (id: string): Promise<ProcessDataInfo> => {
    return get(`/api/business-grooming/v1/processing/models/${id}`)
}

/**
 * 更新加工模型的逻辑
 */
export const updateProcessModelDetail = (
    id: string,
    params: ProcessDataInfo,
): Promise<ProcessDataInfo> => {
    return put(
        `/api/business-grooming/v1/processing/models/${id}/logic`,
        params,
    )
}

/**
 * 更新同步模型
 */
export const updateProcessModel = (id: string, params: ProcessDataInfo) => {
    return put(`/api/business-grooming/v1/processing/models/${id}`, params)
}

/**
 * 同步模型同名检查
 */
export const checkProcessModelRepeatName = (params: {
    name: string
    id?: string
}): Promise<{
    name: string
    repeat: boolean
}> => {
    return get(`/api/business-grooming/v1/processing/models/name-check`, params)
}

/**
 * 编辑模型名称
 */
export const editProcessModelInfo = (
    id: string,
    params: {
        description: string
        name: string
        task_id: string
    },
) => {
    return put(`/api/business-grooming/v1/processing/models/${id}/name`, params)
}

/**
 * 数据预览
 */
export const previewFormData = (params: {
    datasource_id: string
    table_name: string
}): Promise<{
    columns: Array<{
        name: string
        type: string
    }>
    data: Array<any>
    total_count: number
}> => {
    return get(`/api/business-grooming/v1/processing/tables`, params)
}

// --------------------------------------------------关联业务对象开始------------------------------------------------------------

// 获取业务表字段关联属性
export const getBusinessFieldsRelateAttrs = (params: {
    fid: string
    oid?: string
}): Promise<any> => {
    return get(`/api/business-grooming/v1/forms/glossary`, params)
}

// 修改业务表字段关联属性
export const updateBusinessFieldsRelateAttrs = (
    id: string,
    params: {
        object_id: string
        logical_entity: { field_id: string; id: string }[]
    },
): Promise<any> => {
    return put(`/api/business-grooming/v1/forms/${id}/glossary`, params)
}
// --------------------------------------------------关联业务对象结束------------------------------------------------------------

/**
 * 业务域删除
 * @param id
 * @returns
 */
export const delBusinessDomain = (id: string) => {
    return del(`/api/business-grooming/v1/business-domain/${id}`)
}

// /**
//  * 获取当前节点下的层级统计信息
//  * @param id
//  * @returns
//  */
// export const getBusinessDomainCount = (
//     id: string,
// ): Promise<IBusinessDomainCount> => {
//     return get('/api/business-grooming/v1/business-domain/count', { id })
// }

// /**
//  * 名称重复校验
//  * @param params
//  * @returns
//  */
// export const checkBusinessDomain = (params: {
//     id?: string
//     name: string
//     parent_id?: string
// }): Promise<{ name: string; repeat: boolean }> => {
//     return post('/api/business-grooming/v1/business-domain/check', params)
// }

/**
 * 查看进行中标准创建任务
 * @param stdTaskId 标准创建任务ID, standard_create_task_id=1
 */
export const getStdToBeExecTask = (
    stdTaskId: string,
): Promise<Array<IStdToBeExecTask>> => {
    return get(
        // `/api/business-grooming/v1/business-model/forms/standard-create-task/creating?standard_create_task_id=${stdTaskId}`,
        // 测试路径，以上面路径为准
        `/api/business-grooming/v1/business-model/forms/standard-create-task/creating`,
        {
            standard_create_task_id: stdTaskId,
        },
    )
}

/**
 * 查询已完成且未读标准创建任务
 * @param stdTaskId 标准创建任务ID, standard_create_task_id=1
 * @param key_word 搜索关键词
 */
export const getStdCompletedTask = (
    standard_create_task_id: string,
    key_word?: string,
): Promise<Array<IStdCompletedTask>> => {
    return get(
        `/api/business-grooming/v1/business-model/forms/standard-create-task/archive?standard_create_task_id=${standard_create_task_id}${
            key_word ? `&key_word=${key_word}` : ''
        }`,
    )
}

/**
 * 查看标准创建任务完成率
 * @param stdTaskId 标准创建任务ID, standard_create_task_id=1
 */
// export const getStdTaskProgress = (
//     standard_create_task_id: string,
// ): Promise<IStdTaskProgress> => {
//     return get(
//         `/api/business-grooming/v1/business-model/forms/standard-create-task/completion-rate?standard_create_task_id=${standard_create_task_id}`,
//     )
// }

// ----------------------------------------------flowchart start--------------------------------------------------------------

/**
 * 获取流程图列表
 * @param mid number 业务模型id
 * @param params
 */
export const flowchartsQuery = (
    mid: string,
    params: IFlowchartQueryParams,
): Promise<IFlowchartModel> => {
    return get(
        `/api/business-grooming/v1/business-model/${mid}/flowcharts`,
        params,
    )
}

/**
 * 获取流程图基本信息
 * @param mid number 业务模型id
 * @param fid number 流程图id
 */
export const flowchartQueryItem = (
    mid: string,
    fid: number,
    params?: {
        is_draft?: boolean
        version_id?: string
    },
): Promise<IFlowchartItem> => {
    return get(
        `/api/business-grooming/v1/business-model/${mid}/flowcharts/${fid}`,
        params,
    )
}

/**
 * 新建流程图
 * @param mid number 业务模型id
 * @param params
 * @returns
 */
export const flowchartCreate = (
    mid: string,
    params: IFlowchartResParams,
): Promise<IFlowchartResBaseModel> => {
    return post(
        `/api/business-grooming/v1/business-model/${mid}/flowcharts`,
        params,
    )
}

/**
 * 编辑流程图
 * @param mid number 业务模型id
 * @param fid number 流程图id
 * @param params
 * @returns
 */
export const flowchartEdit = (
    mid: string,
    fid: string,
    params: IFlowchartResParams,
): Promise<IFlowchartResBaseModel> => {
    return put(
        `/api/business-grooming/v1/business-model/${mid}/flowcharts/${fid}`,
        params,
    )
}

/**
 * 导入流程图
 * @param mid number 业务模型id
 * @param params
 * @returns
 */
export const flowchartImport = (
    mid: string,
    params: FormData,
): Promise<IFlowchartResBaseModel> => {
    return post(
        `/api/business-grooming/v1/business-model/${mid}/flowcharts/import`,
        params,
    )
}

/**
 * 删除流程图
 * @param mid number 业务模型id
 * @param fid number 流程图id
 * @param task_id? string 任务id
 * @returns
 */
export const flowchartDelete = (
    mid: string,
    fid: string,
    task_id = '',
): Promise<IFlowchartResBaseModel> => {
    return del(
        `/api/business-grooming/v1/business-model/${mid}/flowcharts/${fid}?task_id=${task_id}`,
    )
}

/**
 * 流程图唯一性校验
 * @param mid number 业务模型id
 * @param name string 流程图名称
 * @returns
 */
export const flowchartCheckUniqueness = (
    mid: string,
    params: IFlowchartCheckUniquenessParams,
): Promise<IFlowchartCheckUniquenessModel> => {
    return get(
        `/api/business-grooming/v1/business-model/${mid}/flowcharts/check`,
        params,
    )
}

/**
 * 获取当前业务模型下流程图路径树
 * @param mid string 业务模型ID
 * @returns
 */
export const flowTreeQuery = (mid: string): Promise<IFlowTreeModel> => {
    return get(`/api/business-grooming/v1/business-model/${mid}/path`)
}

/**
 * 获取当前流程图、流程节点绑定的表单
 * @param mid string 业务模型ID
 * @param fid string 流程图ID
 * @param node_id string? 流程节点ID
 * @returns [node_related: [{id, is_ref, name, node_name}], flow_related: [{id, is_ref, name, node_name}]]
 */
export const flowBindFormsQuery = (
    mid?: string,
    fid?: string,
    params?: {
        node_id?: string
        is_draft?: boolean
        version_id?: string
    },
): Promise<any> => {
    return get(
        `/api/business-grooming/v1/business-model/${mid}/flowcharts/${fid}/forms-indicators`,
        params,
    )
}

/**
 * 获取当前子流程节点关联的流程
 * @param mid string 业务模型ID
 * @param fid string 流程图ID
 * @param node_id string 流程节点ID
 * @returns [{business_model_id, flowchart_id, flowchart_name, is_ref, main_business_id, main_business_name}]
 */
export const flowBindFlowQuery = (
    mid?: string,
    fid?: string,
    params?: {
        node_id?: string
        is_draft?: boolean
        version_id?: string
    },
): Promise<any> => {
    return get(
        `/api/business-grooming/v1/business-model/${mid}/flowcharts/${fid}/flows`,
        params,
    )
}

/**
 * 为流程图、流程节点（普通节点、子流程节点）绑定表单、模型
 * @param mid string 业务模型ID
 * @param fid string 流程图ID
 * @param node_id string 流程节点ID
 * @param target_id string 要绑定的表单、模型ID
 * @param target_type string 被绑定的目标类型，枚举，form：表单；model：业务模型
 * @returns [{id, name}]
 */
export const flowCellBindFormModel = (
    node_id: string,
    target_id: string[],
    target_type: 'form' | 'model' | 'indicator',
    mid = '',
    fid = '',
): Promise<any> => {
    return post(
        `/api/business-grooming/v1/business-model/${mid}/flowcharts/${fid}/binding`,
        { node_id, target_id, target_type },
    )
}

/**
 * 为流程图绑定子流程图
 * @param fid string 当前的流程图id，即子流程节点所属的流程图
 * @param node_id string 流程节点ID
 * @param ref_flowchart_id string 被引用流程图id
 */
export const bindFlowChart = (
    fid: string,
    node_id: string,
    ref_flowchart_id: string,
): Promise<any> => {
    return post(`/api/business-grooming/v1/flowcharts/${fid}/reference`, {
        node_id,
        ref_flowchart_id,
    })
}

/**
 * 为流程图、流程节点（普通节点、子流程节点）删除表单、模型，可选是否同时删除表单
 * @param mid string 业务模型ID
 * @param fid string 流程图ID
 * @param node_id string 流程节点ID
 * @param target_id string 要解除绑定的表单or模型ID
 * @param target_type string 被绑定的目标类型，枚举，form：表单；model：业务模型
 * @param delete_form string? 解除绑定时是否同时删除表单
 * @returns [{id, name}]
 */
export const flowDeleteFormModel = (
    node_id: string,
    target_id: string,
    target_type: 'form' | 'model' | 'indicator',
    delete_form = '',
    mid = '',
    fid = '',
): Promise<any> => {
    return put(
        `/api/business-grooming/v1/business-model/${mid}/flowcharts/${fid}/binding`,
        { node_id, target_id, target_type, delete_form },
    )
}

/**
 * 从AD获取智能推荐主干流程
 * @param mid string 业务模型ID
 * @param fid string 流程图ID
 * @param node_id string 流程节点ID
 * @returns { flowcharts: [{id, flowchart_name, structure_path}] }
 */
export const flowRecommendQuery = (
    mid?: string,
    fid?: string,
    params?: {
        node_id?: string
        type?: number
        is_draft?: boolean
        version_id?: string
    },
): Promise<any> => {
    return get(
        `/api/business-grooming/v1/business-model/${mid}/flowcharts/${fid}/recommend`,
        params,
    )
}

/**
 * 创建业务模型及空白流程图文件
 * @param mid string 业务模型ID
 * @param fid string 流程图ID
 * @parma name string 名称
 * @param node_id string 流程节点ID
 * @param task_id string? 任务ID
 * @returns [{ fid, mid, name, node_id, task_id}]
 */
export const flowCreateWithModel = (
    name: string,
    node_id: string,
    task_id?: string,
    mid = '',
    fid = '',
): Promise<any> => {
    return post(
        `/api/business-grooming/v1/business-model/${mid}/flowcharts/${fid}/model`,
        { mid, fid, node_id, name, task_id: task_id || '' },
    )
}

/**
 * 保存流程图文件
 * @param mid string 业务模型ID
 * @param fid string 流程图ID
 * @param file FormData 上传的文件
 * @param save string 保存标识
 * @returns [{id, name}]
 */
export const flowSaveContent = (
    mid: string,
    fid: string,
    params: FormData,
    save: string,
): Promise<any> => {
    return post(
        `/api/business-grooming/v1/business-model/${mid}/flowcharts/${fid}?save=${save}`,
        params,
    )
}

/**
 * 获取当前流程图每个流程节点关联的表单数量
 * @param fid string 流程图ID
 * @param nid string 流程节点ID
 * @returns [{forms_counts: number; node_id: string}]
 */
export const flowformsCountQuery = (
    fid: string,
    params?: {
        is_draft?: boolean
        version_id?: string
    },
): Promise<any> => {
    return get(`/api/business-grooming/v1/flowcharts/${fid}/counts`, params)
}

/**
 * 获取目录节点下一级流程节点、关联表单、子流程节点
 * @param fid string 流程图ID
 * @param main_business_id 当前页面业务模型ID
 * @param nid string 流程节点ID
 * @param type  导航查看的方式，1全部，2只看流程图，必填"
 * @returns []
 */
export const flowTreeNodeQuery = (
    fid: string,
    params: IFlowTreeParams,
): Promise<IFlowTreeNodeModel[]> => {
    return get(`/api/business-grooming/v1/flowcharts/${fid}/nodes`, params)
}

/**
 * 主流程图列表【全部、本部门、本业务模型】的接口
 * @param type  number   1全部，2本部门，3本业务模型 必传
 * @param fid   string    当前的流程图id，即子流程节点所属的流程图，uuid，当type=2或3时必传
 * @param object_id string  业务架构对象id，不传查所有，uuid，当type=1时选传
 * @returns
 */
export const getMainAllFlowChart = (
    params: IMainAllFlowChart,
): Promise<any> => {
    return get(`/api/business-grooming/v1/main-flowcharts`, params)
}

/**
 * 业务模型主流程图下的所有子孙流程图列表的接口
 * @param mid 业务模型的id
 * @param fid 当前的流程图id，即子流程节点所属的流程图
 * @returns
 */
export const getSubAllFlowChart = (
    mid: string,
    fid: string,
    params?: { is_draft?: boolean; version_id?: string },
): Promise<Array<IBusinFlowChartItem>> => {
    return get(
        `/api/business-grooming/v1/main-businesses/${mid}/sub-flowcharts?fid=${fid}`,
        params,
    )
}

/**
 * 搜索流程图
 * @param type number 1全部，2本部门，3本业务模型
 * @param fid string 当前的流程图id，即子流程节点所属的流程图
 * @param keyword string 搜索关键字
 * @returns
 */
export const getFlowChartByKeyword = (
    type: number,
    fid: string,
    keyword: string,
): Promise<any> => {
    return get(`/api/business-grooming/v1/flowcharts/search`, {
        type,
        fid,
        keyword,
    })
}

// ----------------------------------------------forms----------------------------------------------------------------

/**
 * 查看业务表单列表
 * @param mid 业务模型ID
 * @param params
 * @returns
 */
export const formsQuery = (
    mid: string,
    params: IFormQueryListParams,
): Promise<IFormQueryListModel> => {
    return get(`/api/business-grooming/v1/business-model/${mid}/forms`, params)
}

/**
 * 查看业务表单详情
 * @param mid 业务模型ID
 * @param fid 表单ID
 * @param params
 * @returns
 */
export const formsQueryItem = (
    mid: string,
    fid: string,
): Promise<IFormItem> => {
    return get(`/api/business-grooming/v1/business-model/${mid}/forms/${fid}`)
}

/**
 * 查看业务表单详情
 * @param mid 业务模型ID
 * @param fid 表单ID
 * @param params
 * @returns
 */
export const getFormQueryItem = (
    fid: string,
    params?: { is_draft?: boolean; version_id?: string },
): Promise<IFormItem> => {
    return get(`/api/business-grooming/v1/business-model/forms/${fid}`, params)
}

/**
 * 导入业务表单
 * @param mid number 业务模型id
 * @param params
 * @returns
 */
export const formsImport = (mid: string, params: FormData): Promise<any> => {
    return post(
        `/api/business-grooming/v1/business-model/${mid}/forms/import`,
        params,
    )
}

/**
 * 新建业务表单
 * @param mid number 业务模型id
 * @param params
 * @returns
 */
export const formsCreate = (
    mid: string,
    params: IFormEditParams,
): Promise<any> => {
    return post(`/api/business-grooming/v1/business-model/${mid}/forms`, params)
}

/**
 * 修改业务表单
 * @param mid number 业务模型id
 * @param fid number 表单id
 * @param params
 * @returns
 */
export const formsEdit = (
    mid: string,
    fid: string,
    params: IFormEditParams,
): Promise<any> => {
    return put(
        `/api/business-grooming/v1/business-model/${mid}/forms/${fid}`,
        params,
    )
}

/**
 * 删除业务表单
 * @param mid number 业务模型id
 * @param fid number 表单id
 * @param type number 表单类型
 * @param task_id? string 任务id
 * @returns
 */
export const formsDelete = (
    mid: string,
    fid: string,
    type: number,
    task_id = '',
): Promise<any> => {
    return del(
        `/api/business-grooming/v1/business-model/${mid}/forms/${fid}?type=${type}&task_id=${task_id}`,
    )
}

/**
 * 业务表单信息统计
 * @param mid 业务模型id
 * @returns
 */
export const formsCount = (mid: string): Promise<IFormQueryCountModel> => {
    return get(`/api/business-grooming/v1/business-model/${mid}/forms/count`)
}

/**
 * 表单唯一性校验
 * @param mid string 业务模型id
 * @param params
 * @returns
 */
export const formsCheckUniqueness = (
    mid: string,
    params: IFormCheckUniquenessParams,
): Promise<IFormCheckUniquenessModel> => {
    return get(
        `/api/business-grooming/v1/business-model/${mid}/forms/check`,
        params,
    )
}

/**
 * 查询原始表字段列表
 * @param mid string 业务模型id
 * @param fid number 表单id
 * @param params
 * @returns
 */
export const formsOriginalFieldsList = (
    mid: string,
    fid: string,
    params: IFormQueryFieldsListParams,
): Promise<IFormQueryFieldsListModel> => {
    return get(
        `/api/business-grooming/v1/business-model/${mid}/forms/${fid}/original-fields`,
        params,
    )
}

/**
 * 查询业务表字段列表
 * @param mid string 业务模型id
 * @param fid number 表单id
 * @param params
 * @returns
 */
export const formsStandardFieldsList = (
    mid: string,
    fid: string,
    params: IFormQueryFieldsListParams,
): Promise<IFormQueryFieldsListModel> => {
    return get(
        `/api/business-grooming/v1/business-model/${mid}/forms/${fid}/fields`,
        params,
    )
}

/**
 * 导出表单
 * @param mid string 业务模型id
 * @param fid number 表单id
 * @param params
 * @returns
 */
export const formsExport = (
    mid: string,
    fid: string,
    params: { type: number; is_draft?: boolean; version_id?: string },
) => {
    return post(
        `/api/business-grooming/v1/business-model/${mid}/forms/${fid}/export`,
        params,
        {
            responseType: 'arraybuffer',
        },
    )
}

/**
 * 导入修改业务表单
 * @param mid number 业务模型id
 * @param params
 * @returns
 */
export const formsUpdateImport = (
    mid: string,
    params: FormData,
): Promise<any> => {
    return put(
        `/api/business-grooming/v1/business-model/${mid}/forms/import`,
        params,
    )
}

/**
 * 获取字段智能推荐的标准
 * @params 名称集
 * @returns
 */
export const formsQueryStandardRecommend = (params: any): Promise<any> => {
    return post(
        `/api/business-grooming/v1/dataelement/task/std-rec/rec`,
        params,
    )
}

/**
 * 查询业务表字段列表
 * @param fid number 表单id
 * @param params
 * @returns
 */
export const getFormsFieldsList = (
    fid: string,
    params: IFormQueryFieldsListParams,
): Promise<IFormQueryFieldsListModel> => {
    return get(
        `/api/business-grooming/v1/business-model/forms/${fid}/fields`,
        params,
    )
}

/**
 * 获取推荐表
 * @param mid 业务域id
 * @param params  推荐参数
 * @returns 推荐表
 */
export const formRecommendByIntelligence = (
    mid: string,
    params: RecommendData,
): Promise<{ rec_tables: Array<IFormItem> }> => {
    return post(
        `/api/business-grooming/v1/business-model/${mid}/forms/rec`,
        params,
    )
}

/**
 * 获取库表推荐表
 * @param mid 业务域id
 * @param params 推荐参数
 * @returns 推荐表
 */
export const formRecommendByLogicView = (
    mid: string,
    params: RecommendData,
): Promise<{ rec_tables: Array<any> }> => {
    return post(
        `/api/business-grooming/v1/business-model/${mid}/forms/rec/view`,
        params,
    )
}

/**
 * 搜索表
 * @param mid 业务域id
 * @param param1 搜索关键字
 * @returns
 */
export const getSearchForms = (
    mid: string,
    params: { keyword: string; id: string },
): Promise<{
    rec_tables: Array<IFormItem>
    local_tables: Array<IFormItem>
}> => {
    return get(
        `/api/business-grooming/v1/business-model/${mid}/forms/search`,
        params,
    )
}

/**
 * 保存表字段
 * @param mid 业务域id
 * @param fid 表id
 * @param params 字段信息
 * @returns
 */
export const saveFields = (
    mid,
    fid,
    params: { fields: Array<FormFieldAttribute>; task_id?: string },
): Promise<{
    deleted_tables: Array<{
        id: string
        name: string
    }>
    unquoted_fields: Array<{
        id: string
        name: string
    }>
}> => {
    return post(
        `/api/business-grooming/v1/business-model/${mid}/forms/${fid}/fields`,
        params,
    )
}

/**
 * 保存画布
 * @param mid 业务模型id
 * @param fid 项目Id
 * @param params 画布数据
 * @returns
 */
export const saveFormGraph = (
    mid: string,
    fid: string,
    params: {
        content?: string
        task_id?: string
    },
): Promise<
    Array<{
        id: string
        name: string
    }>
> => {
    return post(
        `/api/business-grooming/v1/business-model/${mid}/forms/${fid}/canvas`,
        params,
    )
}

/**
 * 保存画布
 * @param mid 业务模型id
 * @param fid 项目Id
 * @param params 画布数据
 * @returns
 */
export const getFormGraph = (
    mid: string,
    fid: string,
    params?: { is_draft?: boolean; version_id?: string },
): Promise<{ content: string }> => {
    return get(
        `/api/business-grooming/v1/business-model/${mid}/forms/${fid}/canvas`,
        params,
    )
}

/**
 * 获取表单信息
 * @param mid 模型id
 * @param fid 表单id
 * @returns
 */
export const getFormInfo = (
    mid: string,
    fid: string,
    params?: { is_draft?: boolean; version_id?: string },
): Promise<IFormItem> => {
    return get(`/api/business-grooming/v1/business-model/forms/${fid}`, params)
}

/**
 * 查看标准创建任务清单
 * @param main_business_id 业务模型id
 * @param standard_task_id 标准化任务id
 * @returns
 */
export const formsQueryStandardCreateTaskList = (params: any): Promise<any> => {
    return get(
        `/api/business-grooming/v1/business-model/forms/pre-standard-create-task`,
        params,
    )
}

/**
 * 查看进行中标准创建任务
 * @param main_business_id 业务模型id
 * @param standard_create_task_id 标准化任务id
 * @returns
 */
export const formsQueryStandardCreatingTaskList = (
    params: any,
): Promise<any> => {
    return get(
        `/api/business-grooming/v1/business-model/forms/standard-create-task/creating`,
        params,
    )
}

/**
 * 查看已完成标准创建任务
 * @param main_business_id 业务模型id
 * @param standard_create_task_id 标准化任务id
 * @param key_word 模糊搜索关键字
 * @returns
 */
export const formsQueryStandardDoneTaskList = (params: any): Promise<any> => {
    return get(
        `/api/business-grooming/v1/business-model/forms/standard-create-task/archive`,
        params,
    )
}

/**
 * 创建标准和任务
 * @param create_by_id  string 标准创建任务创建人ID
 * @param create_by_name string 标准创建任务创建人名称
 * @param main_business_id string 业务模型id
 * @param standard_create_task_id string (任务中心视角)任务中心标准创建任务任务ID
 * @param standard_task_id string (任务中心视角)任务中心标准化任务ID
 * @returns
 */
// export const formsQueryCreateStandardTaskAndList = (
//     params: ICreateStandardTaskAndList,
// ): Promise<any> => {
//     return post(
//         `/api/business-grooming/v1/business-model/forms/standard-create-task`,
//         params,
//     )
// }
/**
 * 创建标准任务清单
 * @param params
 * @param field_id  string 业务表字段id
 * @param field_name string 业务表字段中文名称
 * @param form_id string  业务表单id
 * @param field_description string  字段描述
 * @param standard_reference_document string 参考标准文件
 * @param standard_task_id string 任务中心标准化id
 * @param main_business_id string 业务模型id
 * @returns
 */
export const formsQueryCreateStandardTaskList = (
    params: ICreateStandardTaskList,
): Promise<any> => {
    return post(
        `/api/business-grooming/v1/business-model/forms/pre-standard-create-task`,
        params,
    )
}

/**
 * 编辑标准创建任务清单
 * @param id string 标准清单id
 * @param field_description string 字段描述
 * @param standard_reference_document 参考标准文件
 * @returns
 */
export const formsEditStandardTask = (params: any): Promise<any> => {
    return put(
        `/api/business-grooming/v1/business-model/forms/pre-standard-create-task`,
        params,
    )
}

/**
 * 查看已完成且未读标准任务
 * @param main_business_id 业务模型id
 * @param standard_create_task_id 标准化任务id
 * @returns
 */
export const formsQueryStandardUnreadTaskList = (params: any): Promise<any> => {
    return get(
        `/api/business-grooming/v1/business-model/forms/standard-create-task/archive/unread`,
        params,
    )
}
/**
 * 将未读任务标记为已读
 * @param ids 任务【id】
 * @returns
 */
export const formsQueryStandardMarkReadTaskLists = (
    params: any,
): Promise<any> => {
    return put(
        `/api/business-grooming/v1/business-model/forms/standard-create-task/archive`,
        params,
    )
}

/**
 * 删除业务表单
 * @param id string | number 任务清单字段ID
 * @returns
 */
export const formsDeleteStandardList = (id: string | number): Promise<any> => {
    return del(
        `/api/business-grooming/v1/business-model/forms/pre-standard-create-task/${id}`,
    )
}

/**
 * 查询全部业务表
 */
export const getAllBizForms = (params: any): Promise<any> => {
    return get(`/api/business-grooming/v1/business-model/forms`, params)
}

/**
 * 查询业务表名称等简略信息
 * @param mid string 业务模型id
 * @param form_ids string formId列表，逗号分隔，每个都是UUID
 */
export const formsNameList = (
    mid: string,
    form_ids: string,
): Promise<
    {
        business_model_id: string
        id: string
        name: string
    }[]
> => {
    return get(
        `/api/business-grooming/v1/internal/business-model/${mid}/forms`,
        { form_ids },
    )
}

// ------------------------------------------从数据源导入业务表 Start-----------------------------------------------------

// 从数据源导入业务表(单个)
export const importDatasourceSingle = (
    mid: string,
    params: {
        datasource_id: string
        table: string
        task_id: string
    },
): Promise<IImportBussinessFormInfo> => {
    return post(
        `/api/business-grooming/v1/business-model/${mid}/forms/datasource-import`,
        params,
    )
}

// 从数据源导入业务表(批量)
export const importDatasourceMultiple = (
    mid: string,
    params: {
        data: {
            datasource_id: string
            tables: string[]
        }[]
        task_id: string
    },
): Promise<IImportBussinessFormsInfo> => {
    return post(
        `/api/business-grooming/v1/business-model/${mid}/forms/datasource-imports`,
        params,
    )
}

// 获取数据源下的所有表
export const getFormsFromDatasource = (id: string): Promise<string[]> => {
    return get(
        `/api/business-grooming/v1/business-model/forms/data-tables?datasource_id=${id}`,
    )
}

// 获取数据表详情(预览数据表)
export const getDataFormFields = (
    table_name: string,
    datasource_id: string,
): Promise<IDataFormField[]> => {
    return get(
        `/api/business-grooming/v1/business-model/forms/data-tables/${table_name}?datasource_id=${datasource_id}`,
    )
}

// 保存业务表字段
export const saveBusinessFormFields = (
    mid: string,
    fid: string,
    params: {
        fields: any[]
        task_id?: string
    },
) => {
    return post(
        `/api/business-grooming/v1/business-model/${mid}/forms/${fid}/ds-fields`,
        params,
    )
}

// ---------------------------------------------------------Glossary------------------------------------------

// 术语表 -- start
/**
 * 获取所有术语表或某个术语表、类别下的术语、类别
 * @param params
 * @returns
 */
export const getGlossary = (params?: { id?: string; glossary_id?: string }) => {
    return get(`/api/business-grooming/v1/glossary/contents`, params)
}

export const getGlossaryLevel = (params: ILevelList) => {
    return get(`/api/business-grooming/v1/business-domains`, params)
}
/**
 * 获取获取术语表详情
 */
export const getGlossaryDetails = (id: string) => {
    return get(`/api/business-grooming/v1/glossary/${id}`)
}
/**
 * 新增术语表
 * @param params
 * @returns
 */
export const addGlossary = (params: IGlossary) => {
    return post(`/api/business-grooming/v1/glossary`, params)
}

/**
 * 分页获取术语表、类别列表
 * @param params
 * @returns
 */
export const getGlossaryList = (params: IGlossaryList) => {
    return post(`/api/business-grooming/v1/glossary/contents`, params)
}
/**
 * 更新术语表
 * @param params
 * @returns
 */
export const editGlossary = (params: IGlossary) => {
    return put(`/api/business-grooming/v1/glossary/${params?.id}`, params)
}
/**
 * 删除术语表
 */
export const delGlossary = (id: string) => {
    return del(`/api/business-grooming/v1/glossary/${id}`)
}

// 类别 -- start
/**
 * 分页查询术语和类别
 * @param params
 * @returns
 */
export const getCategories = (params: ICategoriesQuery) => {
    return get(`/api/business-grooming/v1/glossary`, params)
}

/**
 * 移动类别、术语至某处
 * @param params
 * @returns
 */
export const moveCategories = (params: IMove) => {
    return post(`/api/business-grooming/v1/glossary/position`, params)
}

// 术语 -- start
/**
 * 添加术语
 * @param params
 * @returns
 */
export const addTerms = (params) => {
    return post(`/api/business-grooming/v1/glossary/terms`, params)
}
/**
 * 添加术语关联关系
 * @param params
 * @returns
 */
export const addTermsRelation = (params: ITermsRelation) => {
    return post(`/api/business-grooming/v1/glossary/relation`, params)
}
/**
 * 删除术语关联关系
 */
export const delTermsRelation = (id: string) => {
    return del(`/api/business-grooming/v1/glossary/relation/${id}`)
}
/**
 * 更新术语
 * @param params
 * @returns
 */
export const editTerms = (params: IGlossary) => {
    return put(`/api/business-grooming/v1/glossary/terms/${params.id}`, params)
}
/**
 * 术语详情
 */
export const termsDetails = (id: string) => {
    return get(`/api/business-grooming/v1/glossary/terms/${id}`)
}
/**
 * 删除术语
 */
export const delterms = (id: string) => {
    return del(`/api/business-grooming/v1/glossary/terms/${id}`)
}

// 业务域 -- start
/**
 * 术语详情
 */
export const getDomain = () => {
    return get(`/api/business-grooming/v1/glossary/domain`)
}

/**
 *查询指定术语表下所有类别和术语 -- 树结构
 */
export const getGlossaryTree = (params: {
    keyword?: string
    glossary_id?: string
    exclude?: string
}) => {
    return get(`/api/business-grooming/v1/glossary/search`, params)
}
/**
 * 查询所有术语
 */
export const getAllTerms = (id: string) => {
    return get(`/api/business-grooming/v1/glossary/${id}/terms`)
}

// ---------------------------------------------------------Indicator------------------------------------------
// 查询常量枚举
export const queryIndicatorsConfig = (): Promise<IIndicatorConfig> => {
    return requests.get(
        '/api/business-grooming/v1/business-model/indicators/config',
    )
}

export interface IIndicatorDetail extends ICreateIndicator {
    id: number
    created_by_uid: number
    creator_name: string
    updated_by_uid: number
    updater_name: string
    created_at: string
    updated_at: string
}

// 新建业务指标
export const createBusinessIndicator = (
    mid: string,
    params: ICreateIndicator,
) => {
    return requests.post(
        `/api/business-grooming/v1/business-model/${mid}/indicators`,
        params,
    )
}

// 编辑业务指标
export const editBusinessIndicator = (
    mid: string,
    indicatorId: string,
    params: ICreateIndicator,
) => {
    return requests.put(
        `/api/business-grooming/v1/business-model/${mid}/indicators/${indicatorId}`,
        params,
    )
}

// 分页查询指标
export const queryIndicators = (
    mid: string,
    params: IQueryIndicators,
): Promise<IQueryListRes<IIndicatorsInfo>> => {
    return requests.get(
        `/api/business-grooming/v1/business-model/${mid}/indicators`,
        params,
    )
}

export interface ICreator {
    id: number
    name: string
}

// 查询指标创建人
export const queryIndicatorsCreators = (
    mid: string,
    params: { limit?: number; offset?: number },
): Promise<IQueryListRes<ICreator>> => {
    return requests.get(
        `/api/business-grooming/v1/business-model/${mid}/indicators/creators`,
        params,
    )
}

export const checkIndicatorName = (
    mid: string,
    name: string,
    indicatorId?: string,
) => {
    return requests.get(
        `/api/business-grooming/v1/business-model/${mid}/indicators/repeat?name=${name}&id=${indicatorId}`,
    )
}

export const queryIndicatorDetail = (
    mid: string,
    indicatorId: string,
): Promise<IIndicatorDetail> => {
    return requests.get(
        `/api/business-grooming/v1/business-model/${mid}/indicators/${indicatorId}`,
    )
}

export const deleteIndicator = (
    mid: string,
    indicatorId: string,
    taskId = '',
) => {
    return requests.delete(
        `/api/business-grooming/v1/business-model/${mid}/indicators/${indicatorId}?task_id=${taskId}`,
    )
}

// 导出业务指标
export const exportBusinessIndicator = (
    mid: string,
    params: { ids: (string | number)[] },
) => {
    return requests.post(
        `/api/business-grooming/v1/business-model/${mid}/indicators/export`,
        params,
        {
            responseType: 'arraybuffer',
        },
    )
}

// 上传文件
export const uploadIndicator = (mid: string, params: FormData) => {
    return requests.post(
        `/api/business-grooming/v1/business-model/${mid}/indicators/import`,
        params,
    )
}

export const queryBusinessTable = (mid: string): Promise<IBusinessTables> => {
    return requests.get(
        `/api/business-grooming/v1/business-model/${mid}/forms/fields`,
    )
}

// ----------------------------------------modal----------------------------------------------------------

// 上传文件
export const uploadModalFile = (
    did: number,
    params: FormData,
): Promise<any> => {
    return post(
        `/api/business-grooming/v1/business-domain/${did}/business-models`,
        params,
    )
}

// 分页查询模型列表: 业务治理与建模任务
export const queryModals = (domainId: number, params: IQueryModals) => {
    return get(
        `/api/business-grooming/v1/business-domain/${domainId}/business-models`,
        params,
    )
}

// 查询模型配置
export const queryModalConfig = () => {
    return get('/api/business-grooming/v1/templates-config?name=mainBusiness')
}

// 新建业务模型
export const createBusinessModal = (did: number, params: any) => {
    return post(
        `/api/business-grooming/v1/business-domain/${did}/business-model`,
        params,
    )
}

// 删除业务模型
export const deleteBusinessModal = (did: number, mid: number, tid = '') => {
    return del(
        `/api/business-grooming/v1/business-domain/${did}/business-models/${mid}?task_id=${tid}`,
    )
}

// 编辑业务模型
export const editBusinessModal = (did: number, mid: number, params: any) => {
    return put(
        `/api/business-grooming/v1/business-domain/${did}/business-models/${mid}`,
        params,
    )
}

// 业务模型详情
export const queryBusinessModalDetails = (
    did: string,
    mid: number,
): Promise<IModalDetailsAllInfo> => {
    return get(
        `/api/business-grooming/v1/business-domain/${did}/business-models/${mid}?name=mainBusiness`,
    )
}

export const checkModalName = (
    did: number | string,
    name: string,
    model_id: number,
) => {
    return get(
        `/api/business-grooming/v1/business-domain/${did}/business-models/check?name=${name}&model_id=${model_id}`,
    )
}

// -----------------------------------------report------------------------------------------------------

// 修改一致性状态
export const updateConsistentStatus = (
    modelId: string,
    { object_id, status }: IUpdateConsistentStatus,
) => {
    return put(`/api/business-grooming/v1/business-model/${modelId}/report`, {
        object_id,
        status,
    })
}

// 标准一致性报告
export const getReport = (modelId: string) => {
    return get(
        `/api/business-grooming/v1/business-model/${modelId}/report/standards`,
    )
}

// 标准一致性检查
export const updateReport = (modelId: string) => {
    return post(
        `/api/business-grooming/v1/business-model/${modelId}/report/standards`,
        {},
    )
}

// 标准一致性报告
export const getMainBusinesses = (ids: string[]) => {
    return post(`/api/business-grooming/v1/report/main-businesses`, { ids })
}

// ---------------------------------------------role----------------------------------------------
// 创建角色
export const createRole = (
    ids: IIds,
    params: ICreateRoleParams,
): Promise<any> => {
    return post(
        `/api/business-grooming/v1/business-domain/${ids.domainId}/business-authorities`,
        params,
    )
}

// 分页查询角色列表（包括 父级和子级）
export const queryRoles = (
    domainId: number,
    params: IQueryRoles,
): Promise<IQueryRolesRes> => {
    return get(
        `/api/business-grooming/v1/business-domain/${domainId}/business-authorities`,
        params,
    )
}

// 根据角色Id 获取角色详情信息
export const getRoleDetailsById = (
    domainId: number,
    roleId: number,
): Promise<any> => {
    return get(
        `/api/business-grooming/v1/business-domain/${domainId}/business-authorities/${roleId}`,
    )
}

// 更新角色信息
export const updateRole = (
    ids: IIds,
    params: ICreateRoleParams,
): Promise<any> => {
    return put(
        `/api/business-grooming/v1/business-domain/${ids.domainId}/business-authorities/${ids.roleId}`,
        params,
    )
}

// 删除角色信息
export const deleteRole = (ids: IIds): Promise<any> => {
    return del(
        `/api/business-grooming/v1/business-domain/${ids.domainId}/business-authorities/${ids.roleId}`,
    )
}

// 校验角色信息
export const checkRole = ({
    domainId,
    name,
    parent_id,
    authority_id,
}: ICheckRoleParams): Promise<any> => {
    return get(
        `/api/business-grooming/v1/business-domain/${domainId}/business-authorities/check?parent_id=${parent_id}&name=${name}&authority_id=${authority_id}`,
    )
}

// --------------------------------------------standard-----------------------------------------------

// 分页查询表单列表
export const queryForms = (
    mid: string,
    params: IQueryForms,
): Promise<IQueryFormRes> => {
    return get(`/api/business-grooming/v1/business-model/${mid}/forms`, params)
}

// 分页查询标准
export const queryStandards = (
    mid: string,
    fid: string,
    params: IQueryStandards,
): Promise<IQueryStandardsRes> => {
    return requests.get(
        `/api/business-grooming/v1/business-model/${mid}/forms/${fid}/standards`,
        params,
    )
}

// 新建业务标准
export const createBusinessStandard = (
    mid: string,
    fid: string,
    params: ICreateStandard,
) => {
    return requests.post(
        `/api/business-grooming/v1/business-model/${mid}/forms/${fid}/standard`,
        params,
    )
}

// 修改业务标准
export const editBusinessStandard = (
    mid: string,
    fid: string,
    params: IEditStandardsParams,
) => {
    return requests.put(
        `/api/business-grooming/v1/business-model/${mid}/forms/${fid}/standards`,
        params,
    )
}

// 获取业务标准枚举配置
export const queryStandardEnum = (): Promise<IStandardEnum> => {
    return requests.get('/api/business-grooming/v1/standard-enum')
}

// 删除业务标准
export const deleteStandard = (
    mid: string,
    fid: string,
    sid: number,
    taskId = '',
) => {
    return requests.delete(
        `/api/business-grooming/v1/business-model/${mid}/forms/${fid}/standards/${sid}?task_id=${taskId}`,
    )
}

// 查看业务标准
export const quertStandardDetails = (
    mid: string,
    fid: string,
    sid: number,
): Promise<IStandardDetail> => {
    return requests.get(
        `/api/business-grooming/v1/business-model/${mid}/forms/${fid}/standards/${sid}`,
    )
}

// ---------------------------------------------domain-----------------------------------------------

export const getDoaminDetails = (business_domain_id: string) =>
    requests.get(
        `/api/business-grooming/v1/business-domain/${business_domain_id}`,
        {},
    )

export const getCreator = () =>
    requests.get(`/api/business-grooming/v1/creators`, {})

export const deleteDomain = (business_domain_id: string) => {
    return requests.delete(
        `/api/business-grooming/v1/business-domain/${business_domain_id}`,
    )
}

export const checkNameRepeat = (name: string) => {
    return requests.get(`/api/business-grooming/v1/business-domain/repeat`, {
        name,
    })
}

/**
 * 获取业务域树 (已删除)
 */
export const getDomainTree = () => {
    return requests.get(`/api/business-grooming/v1/glossary/domain`)
}

// -------------------------------------------------新业务域--------------------------------------------

// 业务域整个树  包括 业务域分组  业务域   业务流程
export const getBusinessDomainTree = (
    params: Partial<IBusinessDomainTreeParams>,
): Promise<ICommonRes<IBusinessDomainItem>> => {
    return requests.get(`/api/business-grooming/v1/domain/nodes`, params)
}

// 获取流程子树
export const getBusinessDomainProcessTree = (
    params: Partial<IBusinessDomainProcessTreeParams>,
): Promise<ICommonRes<IBusinessDomainItem>> => {
    return requests.get(
        `/api/business-grooming/v1/domain/nodes/process`,
        params,
    )
}

// 按部门获取流程列表
export const getBusinessDomainProcessList = (
    params: Partial<IBusinessDomainProcessListParams>,
): Promise<ICommonRes<IBusinessDomainItem>> => {
    return requests.get(
        `/api/business-grooming/v1/domain/nodes/department`,
        params,
    )
}

// 按信息系统获取流程列表
export const getInfoSysProcessList = (
    params: Partial<IInfoSysProcessListParams>,
): Promise<ICommonRes<IBusinessDomainItem>> => {
    return requests.get(
        `/api/business-grooming/v1/domain/nodes/business-system`,
        params,
    )
}

export const createBusinessDomainTreeNode = (
    params: Partial<IBusinessDomainTreeNodeParams>,
) => {
    return requests.post(`/api/business-grooming/v1/domain/nodes`, params)
}

export const updateBusinessDomainTreeNode = (
    params: Partial<IBusinessDomainTreeNodeParams>,
    id: string,
) => {
    return requests.put(`/api/business-grooming/v1/domain/nodes/${id}`, params)
}

export const checkBusinessDomainTreeNode = (
    params: Partial<ICheckBusinessDomainTreeNodeParams>,
) => {
    return requests.get(
        `/api/business-grooming/v1/domain/nodes/name-check`,
        params,
    )
}

export const deleteBusinessDomainTreeNode = (id: string) => {
    return requests.delete(`/api/business-grooming/v1/domain/nodes/${id}`)
}

export const getBusinessDomainTreeNodeDetails = (
    id: string,
    params?: {
        draft?: boolean
    },
): Promise<Partial<IBusinessDomainItem>> => {
    return requests.get(`/api/business-grooming/v1/domain/nodes/${id}`, params)
}

export const moveBusinessDomainTreeNode = (parent_id: string, id: string) => {
    return requests.put(`/api/business-grooming/v1/domain/nodes/${id}/move`, {
        parent_id,
    })
}

// ---------------------------------------------业务指标-----------------------------------------------
/**
 * 创建业务指标
 * @param mid 模型ID
 * @param params 业务指标属性
 * @returns
 */
export const createCoreBusinessIndicator = (
    mid: string,
    params: Partial<IBusinessIndicator>,
): Promise<any> => {
    return requests.post(
        `/api/business-grooming/v1/business-indicator?mid=${mid}`,
        params,
    )
}

/**
 * 获取单个业务指标
 * @param id 业务指标ID
 * @returns
 */
export const getCoreBusinessIndicatorDetail = (
    id: string,
    params?: { is_draft?: boolean; version_id?: string },
): Promise<IBusinessIndicator> => {
    return requests.get(
        `/api/business-grooming/v1/business-indicator/${id}`,
        params,
    )
}

/**
 * 更新业务指标
 * @param id 业务指标ID
 * @param params 业务指标属性
 * @returns
 */
export const updateCoreBusinessIndicator = (
    id: string,
    params: Partial<IBusinessIndicator>,
): Promise<any> => {
    return requests.put(
        `/api/business-grooming/v1/business-indicator/${id}`,
        params,
    )
}

/**
 * 删除业务指标
 * @param id 业务指标ID
 * @returns
 */
export const deleteCoreBusinessIndicator = (
    id: string,
    params?: { mid?: string },
): Promise<any> => {
    return requests.delete(
        `/api/business-grooming/v1/business-indicator/${id}`,
        params,
    )
}

/**
 * 获取主干业务下所有业务指标
 * @param mid 业务模型ID
 * @param params 查询参数
 * @returns
 */
export const getCoreBusinessIndicators = (
    params: SearchAllIndicator,
): Promise<DataListTemplate<IBusinessIndicator>> => {
    return requests.get(`/api/business-grooming/v1/business-indicator`, params)
}

/**
 * 验证业务指标名称唯一
 * @param name 业务指标名称
 * @returns
 */
export const checkBizIndicatorNameRepeat = (params: {
    name: string
    mid?: string
}): Promise<IFormCheckUniquenessModel> => {
    return requests.get(
        `/api/business-grooming/v1/business-indicator/name-check`,
        params,
    )
}

export const getDepartmentForms = (
    ids: string[],
    mid?: string,
): Promise<any> => {
    let params = ''
    ids.forEach((id) => {
        // eslint-disable-next-line
        params = `ids=${id}${params ? '&' : ''}` + params
    })
    return requests.get(
        `/api/business-grooming/v1/business-model/department?${params}${
            mid ? `&mid=${mid}` : ''
        }`,
    )
}

// 根据源数据表信息查询业务表信息-编目用
export const getBusinessFormByDataSource = (params: {
    datasource_id: string
    metadata_table_name: string
}): Promise<any> => {
    return requests.get(
        `/api/business-grooming/v1/business-model/forms/catalog/front`,
        params,
    )
}

export const getUngroupForms = (mid?: string): Promise<IUngroupForm[]> => {
    return requests.get(
        `/api/business-grooming/v1/business-model/department/ungroup?mid=${mid}`,
    )
}

// -- 业务诊断 -- start

/**
 * 查询业务诊断列表
 * @returns
 */
export const getBusinessDiagnosisList = (
    params: SearchAllIndicator,
): Promise<IBusinessDiagnosis> => {
    return requests.get(`/api/business-grooming/v1/business-diagnosis`, params)
}

/**
 * 创建业务诊断
 * @returns
 */
export const createBusinessDiagnosis = (
    params: ICreateBusinessDiagnosis,
): Promise<IBusinessDiagnosisItem> => {
    return requests.post(`/api/business-grooming/v1/business-diagnosis`, params)
}

/**
 * 编辑业务诊断名称
 * @returns
 */
export const editBusinessDiagnosis = (params: {
    id: string
    name: string
    canceled?: boolean
}): Promise<any> => {
    return requests.put(
        `/api/business-grooming/v1/business-diagnosis/${params.id}`,
        params,
    )
}

/**
 * 删除业务诊断
 * @returns
 */
export const delBusinessDiagnosis = (id: string): Promise<any> => {
    return requests.delete(`/api/business-grooming/v1/business-diagnosis/${id}`)
}

/**
 * 重新诊断
 * @returns
 */
export const rerunBusinessDiagnosis = (id: string): Promise<any> => {
    return requests.put(
        `/api/business-grooming/v1/business-diagnosis/${id}/rerun`,
    )
}

/**
 * 查询指定业务诊断详情
 * @returns
 */
export const getBusinessDiagnosisDetails = (
    id: string,
): Promise<IBusinessDiagnosisItem> => {
    return requests.get(`/api/business-grooming/v1/business-diagnosis/${id}`)
}

// -- 业务诊断 -- end

/**
 * 获取库表对应的业务表信息
 * @datasource_id 数据源 id
 * @metadata_table_name 库表技术名称
 */
export const getCatalogFront = (
    datasource_id: string,
    metadata_table_name: string,
): Promise<ICatalogFrontInfo> => {
    return get(
        `/api/business-grooming/v1/business-model/forms/catalog/front?datasource_id=${datasource_id}&metadata_table_name=${metadata_table_name}`,
    )
}

// 业务领域审核 列表
export const getBusinessAuditList = (
    params: Partial<IBusinessAuditReq>,
): Promise<IBusinessAuditRes> => {
    return get(`/api/business-grooming/v1/domain/nodes/audit`, params)
}

// 提交业务诊断审核
export const postBusinessDiagnosisAudit = (id: string) => {
    return requests.post(
        `/api/business-grooming/v1/business-diagnosis/${id}/audit-flow/af-bg-publish-business-diagnosis/instance`,
    )
}

// 业务诊断审核撤回
export const cancelBusinessDiagnosisAudit = (id: string) => {
    return put(
        `/api/business-grooming/v1/business-diagnosis/${id}/audit-flow/af-bg-publish-business-diagnosis/instance/cancel`,
    )
}

// 主干业务审核撤回
export const cancelBusinessAreaAudit = (id: string, auditType: string) => {
    return put(
        `/api/business-grooming/v1/domain/nodes/${id}/audit-flow/${auditType}/instance/cancel`,
    )
}

// 主干业务拒绝审核
export const rejectBusinessAudit = (id: string) => {
    return put(
        `/api/business-grooming/v1/domain/nodes/${id}/audit-flow/instance/reject `,
    )
}

/**
 *  创建原始数据表
 * @param params
 * @returns
 */
export const createDataForm = (params: {
    mid: string
    view_id: Array<string>
}) => {
    return post(
        `/api/business-grooming/v1/business-model/forms/views/create`,
        params,
    )
}

// 删除草稿
export const deleteDraft = (id: string) => {
    return del(`/api/business-grooming/v1/domain/nodes/draft/${id}`)
}

/**
 * 数据表导出
 */
export const exportTable = (params: any) => {
    return post(
        '/api/business-grooming/v1/business-model/forms/export',
        params,
        {
            responseType: 'arraybuffer',
        },
    )
}

// 获取模型审核列表
export const getBusinessModelsAuditList = (
    params: Partial<IBusinessAuditReq>,
): Promise<IBusinessAuditRes> => {
    return get('/api/business-grooming/v1/business-models/audit', params)
}

// 删除模型草稿
export const deleteModalDraft = (id: string) => {
    return del(`/api/business-grooming/v1/business-models/${id}/draft`)
}

// 撤销审核
export const cancelModalAudit = (id: string, auditType: string) => {
    return put(
        `/api/business-grooming/v1/business-models/${id}/audit-flow/${auditType}/instance/cancel`,
    )
}

// 拒绝审核
export const rejectModalAudit = (id: string) => {
    return put(
        `/api/business-grooming/v1/business-models/${id}/audit-flow/instance/reject`,
    )
}

// 提交审核
export const submitModalAudit = (id: string, auditType: string) => {
    return post(
        `/api/business-grooming/v1/business-models/${id}/audit-flow/${auditType}/instance`,
    )
}

// 获取模型版本列表
export const getModalVersions = (id: string): Promise<IModalVersion[]> => {
    return get(`/api/business-grooming/v1/business-models/${id}/versions`)
}

/**
 * 获取平台统计数据
 * @param query_type
 * @returns
 */
export const getPlatformTotalStatistics = (params: {
    query_type?: string
    department_id?: string
}): Promise<{
    entries: {
        total: number
        type: string
        unit: string
        month_ratio?: number
    }[]
}> => {
    return get(
        `/api/business-grooming/v1/business-statistics/platform/total-statistics`,
        params,
    )
}

// 复制模型
export const copyBusinessModel = (
    id,
    params: {
        name?: string
        model_type: string
        task_id?: string
        domain_id?: string
        description?: string
    },
) => {
    return post(
        `/api/business-grooming/v1/business-models/${id}/copy-model`,
        params,
    )
}

/**
 * 保存导出日志
 * @param mid 模型id
 * @param fid 流程图id
 * @param params 导出类型 流程图名称
 * @returns
 */
export const saveExportDrawioLog = (
    mid: string,
    fid: string,
    params: {
        export_type: string
        flowchart_name: string
    },
) => {
    return post(
        `/api/business-grooming/v1/business-model/${mid}/flowcharts/${fid}/save-export-log`,
        params,
    )
}
