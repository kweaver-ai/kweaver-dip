import requests from '@/utils/request'
import { IGetObject } from '../configurationCenter'
import {
    BasicInfo,
    Schemas,
    ColumnsParams,
    ColumnsInfo,
    CatalogsDetail,
    IQueryList,
    formToSqlParams,
    IDataServiceDetail,
    IInterfaceQueryParams,
    InterfaceDataList,
    OptionsListData,
    IInterfaceStatusStatistics,
    IInterfaceDepartmentStatistics,
    IInterfaceDailyStatisticsItem,
    IInterfaceDailyStatisticsParams,
    IMonitorListReq,
    IMonitorListRes,
} from './index.d'
import { ISubView, ISearchSubView, IResult, DataList } from '@/core'

const { get, post, put, delete: del } = requests

/**
 *  获取应用列表
 * @returns
 */
export const getApps = (): Promise<DataList<BasicInfo>> => {
    return get('/api/data-application-service/v1/apps')
}

/**
 *  获取系统列表
 * @returns
 */
export const getSystems = (): Promise<DataList<BasicInfo>> => {
    return get('/api/data-application-service/v1/systems')
}

/**
 * 获取服务标签列表
 * @returns
 */
export const getServerTags = (): Promise<DataList<BasicInfo>> => {
    return get('/api/data-application-service/v1/tags')
}

/**
 * 获取开发商列表
 * @returns
 */
export const getDevelopers = (): Promise<DataList<BasicInfo>> => {
    return get(`/api/data-application-service/v1/developers`)
}

/**
 * 获取数据库列表
 * @returns
 */
export const getSchemas = (): Promise<{ schemas: Array<Schemas> }> => {
    return get(`/api/data-application-service/v1/data-sources/schemas`)
}

/**
 * 获取指定数据库表列表
 */
export const getTablesBySchemas = (
    params: Schemas,
): Promise<{ tables: Array<string> }> => {
    return get(
        `/api/data-application-service/v1/data-sources/tables/${params.catalog_name}/${params.schema_name}`,
    )
}

/**
 * 获取表字段
 * @param params
 * @returns
 */
export const getColumnsByData = ({
    catalog_name,
    schema_name,
    table_name,
}: ColumnsParams): Promise<{
    columns: Array<ColumnsInfo>
}> => {
    return get(
        `/api/data-application-service/v1/data-sources/columns/${catalog_name}/${schema_name}/${table_name}`,
    )
}

/**
 * sql生成参数
 */
export const getParamsBySQL = (params: {
    sql: string
    data_view_id: string
    datasource_id: string
}): Promise<{
    tables: Array<string>
    data_table_response_params: Array<any>
    data_table_request_params: Array<any>
}> => {
    return post('/api/data-application-service/v1/services/sql-to-form', params)
}

/**
 * 测试接口
 */
export const testAPI = (params: {}): Promise<{
    request: string
    response: string
}> => {
    return post('/api/data-application-service/v1/services/data-query', params)
}

/**
 * 获取资源目录列表
 */
export const getDataCatalogs = (params: {
    offet?: number
    limit?: number
    name?: string
}): Promise<
    DataList<{
        id: string
        code: string
        name: string
    }>
> => {
    return get(`/api/data-application-service/v1/data-catalogs`, params)
}

/**
 *  获取资源目录详情
 */
export const getDataCatalogsDetail = (id: string): Promise<CatalogsDetail> => {
    return get(`/api/data-application-service/v1/data-catalogs/${id}`)
}

/**
 * 服务创建
 */
export const createService = (params: {
    // 是否发布， is_temp:true 不发布 false ：发布
    is_temp: boolean
    service_info: any
    service_param: any
    service_response?: any
    service_test: any
}) => {
    return post(`/api/data-application-service/v1/services`, params)
}

/**
 * 更新
 */
export const updateService = (
    serviceId: string,
    params: {
        // 是否发布， is_temp:true 不发布 false ：发布
        is_temp: boolean
        service_info: any
        service_param: any
        service_response?: any
        service_test: any
    },
) => {
    return put(`/api/data-application-service/v1/services/${serviceId}`, params)
}

export interface IServiceOverview {
    audit_advice: string
    audit_status: string
    audit_type: string
    backend_service_host: string
    backend_service_path: string
    changed_service_id: string
    create_time: string
    department: { id: string; name: string }
    description: string
    developer: {
        id: string
        name: string
        contact_person: string
        contact_info: string
    }
    file: { file_id: string; file_name: string }
    gateway_url: string
    has_draft: boolean
    http_method: string
    is_changed: string
    online_audit_advice: string
    owner_id: string
    owner_name: string
    protocol: string
    publish_status: string
    publish_time: string
    rate_limiting: number
    return_type: string
    service_code: string
    service_id: string
    service_name: string
    service_path: string
    service_type: string
    status: string
    subject_domain_id: string
    subject_domain_name: string
    timeout: number
    update_time: string
}

/**
 * 查询表格
 */
export const queryServiceOverviewList = (
    params: IQueryList,
): Promise<DataList<IServiceOverview>> => {
    return get(`/api/data-application-service/v1/services`, params)
}

/**
 * 删除
 */
export const delServiceOverview = (service_id: string): Promise<any> => {
    return del(`/api/data-application-service/v1/services/${service_id}`)
}
/**
 * 详情
 */
export const detailServiceOverview = (service_id: string): Promise<any> => {
    return get(`/api/data-application-service/v1/services/${service_id}`)
}
/**
 * 发布 接口已废弃
 */
export const publishServiceOverview = (service_id: string): Promise<any> => {
    return put(
        `/api/data-application-service/v1/services/publish/${service_id}`,
    )
}
/**
 * 取消发布 接口已废弃
 */
export const unpublishServiceOverview = (
    service_code: string,
): Promise<any> => {
    return put(
        `/api/data-application-service/v1/services/unpublish/${service_code}`,
    )
}

/**
 * 服务名重复检查
 * @param params
 * @returns
 */
export const checkServerNameRepeated = (params: {
    service_id?: string
    service_name: string
}) => {
    return get(
        `/api/data-application-service/v1/services/check-service-name`,
        params,
    )
}

/**
 * 服务名重复检查
 * @param params
 * @returns
 */
export const checkServerPathRepeated = (params: {
    service_id?: string
    service_path: string
}) => {
    return get(
        `/api/data-application-service/v1/services/check-service-path`,
        params,
    )
}

/**
 * 根据配置获取sql语句
 */

export const formExchangeSql = (
    params: formToSqlParams,
): Promise<{ sql: string }> => {
    return post(`/api/data-application-service/v1/services/form-to-sql`, params)
}

/**
 *  获取资源目录数据服务详情
 */
export const getCatalogsDataServiceDetail = (
    id: string,
): Promise<IDataServiceDetail> => {
    return get(`/api/data-application-service/v1/services/data-catalog/${id}`)
}

/**
 *  下载文件
 */
export const downloadServiceFile = (file_id) => {
    return get(
        `/api/data-application-service/v1/files/download/${file_id}`,
        {},
        {
            responseType: 'arraybuffer',
        },
    )
}

/**
 * 详情
 */
export const detailFrontendServiceOverview = (
    service_id: string,
): Promise<any> => {
    return get(
        `/api/data-application-service/frontend/v1/services/${service_id}`,
    )
}
/**
 * 查询表格
 */
export const queryFrontendServiceOverviewList = (
    params: IQueryList,
): Promise<DataList<any>> => {
    return get(`/api/data-application-service/frontend/v1/services`, params)
}

/**
 * 接口服务查询
 */
export const queryFrontendInterfaceServiceList = (
    catlgId: string,
): Promise<DataList<any>> => {
    return get(
        `/api/data-application-service/frontend/v1/data-view/${catlgId}/services`,
    )
}

/**
 * 绑定审核流程查询接口
 */
export const getApiAuditProcess = (params?: { audit_type?: string }) => {
    return get(`/api/data-application-service/v1/audit-process`, params)
}

interface IApiAuditProcess {
    audit_type: string
    proc_def_key: string | null
}
/**
 * 创建审核流程绑定
 * @param audit_type 审批流程类型
 * @param proc_def_key 审核流程key
 */
export const createApiAuditProcess = (
    params: IApiAuditProcess,
): Promise<any> => {
    return post(`/api/data-application-service/v1/audit-process`, params)
}

interface IUpdateApiAuditProcess extends IApiAuditProcess {
    id: string
}
/**
 * 编辑审核流程绑定
 */
export const updateApiAuditProcess = ({
    id,
    audit_type,
    proc_def_key,
}): Promise<IUpdateApiAuditProcess> => {
    return put(`/api/data-application-service/v1/audit-process/${id}`, {
        audit_type,
        proc_def_key,
    })
}
/**
 * 删除审核流程
 */
export const delApiAuditProcess = ({ id }): Promise<any> => {
    return del(`/api/data-application-service/v1/audit-process/${id}`)
}

interface ICreateApiAuditFlow {
    audit_type: string
    service_id: string
}
/**
 * 创建数据目录审核实例
 */
export const createApiAuditFlow = ({
    audit_type,
    service_id,
}): Promise<ICreateApiAuditFlow> => {
    return post(`/api/data-application-service/v1/audit-process-instance`, {
        audit_type,
        service_id,
    })
}
interface IGetApiApply {
    audit_status?: string
    direction?: string
    end_time?: string
    keyword?: string
    limit: number
    offset: number
    sort?: string
    start_time?: string
    org_code?: string
    subject: string
}
/**
 * 我的申请 -- 接口申请列表
 */
export const getApiApply = (params: IGetApiApply): Promise<any> => {
    return get(`/api/data-application-service/frontend/v1/apply`, params)
}
interface IAddApiApply {
    apply_days?: number
    apply_reason: string
    service_id: string
}
/**
 * 我的申请 -- 创建申请列表
 */
export const addApiApply = (params: IAddApiApply): Promise<any> => {
    return post(`/api/data-application-service/frontend/v1/apply`, params)
}
/**
 * 我的申请 -- 接口申请详情
 */
export const getApiApplyDetails = (service_id: string): Promise<any> => {
    return get(`/api/data-application-service/frontend/v1/apply/${service_id}`)
}
/**
 * 我的申请 -- 接口调用信息
 */
export const getApiApplyAuthInfo = (service_id: string): Promise<any> => {
    return get(
        `/api/data-application-service/frontend/v1/services/${service_id}/auth_info`,
    )
}
/**
 * 我的申请 -- 可用资源
 */
export const getAvailableApiApply = (params: IGetApiApply): Promise<any> => {
    return get(
        `/api/data-application-service/frontend/v1/apply/available-assets`,
        params,
    )
}

/**
 * 获取接口服务列表
 * @param params
 * @returns
 */
export const getInterfaceSVC = (
    params: IInterfaceQueryParams,
): Promise<InterfaceDataList> => {
    return post(
        `/api/data-application-service/frontend/v1/services/search`,
        params,
    )
}

/**
 * 获取用户权限主题域列表
 */
export const getUserSubjectDomains = (): Promise<any> => {
    return get(`/api/data-application-service/v1/subject-domains`)
}

/**
 * 获取筛选项
 * @returns
 */
export const getSortOptionsList = (): Promise<OptionsListData> => {
    return get(`/api/data-application-service/v1/services/options/list`)
}

/**
 * 审核操作类型
 */
export enum OperateAuditStatus {
    // 发布审核撤回
    PUBLISH_AUDIT_REVOKE = 'publish-audit',

    // 变更审核撤回
    CHANGE_AUDIT_REVOKE = 'change-audit',

    // 上线审核撤回
    UP_AUDIT_REVOKE = 'up-audit',

    // 下线审核撤回
    DOWN_AUDIT_REVOKE = 'down-audit',
}

/**
 * 审核撤回
 * @param params service_id 服务id operate_type操作类型：
 * publish-audit：发布审核撤回 change-audit：变更审核撤回 up-audit：上线审核撤回 down-audit：下线审核撤回
 * @returns
 */
export const changeAuditRevokeStatus = (params: {
    service_id: string
    operate_type: OperateAuditStatus
}): Promise<{ service_id: string }> => {
    return put(`/api/data-application-service/v1/services/revoke`, params)
}

/**
 * 保存接口草稿
 * @param serviceId 接口id
 * @param params
 * @returns
 */
export const saveInterfaceDraft = (
    serviceId: string,
    params: {
        // 是否发布， is_temp:true 不发布 false ：发布
        is_temp: boolean
        service_info: any
        service_param: any
        service_response?: any
        service_test: any
    },
): Promise<{ service_id: string }> => {
    return post(
        `/api/data-application-service/v1/services/draft/${serviceId}`,
        params,
    )
}

/**
 * 获取接口草稿
 * @param serviceId 接口id
 * @returns
 */
export const getInterfaceDraft = (
    serviceId: string,
): Promise<{
    service_info: any
    service_param: any
    service_response?: any
    service_test: any
}> => {
    return get(`/api/data-application-service/v1/services/draft/${serviceId}`)
}

/**
 * 删除接口的草稿
 * @param serviceId
 * @returns
 */
export const deleteInterfaceDraft = (serviceId: string) => {
    return del(`/api/data-application-service/v1/services/draft/${serviceId}`)
}

/**
 * 上下线可操作的类型
 */
export enum OperateTypeOnlineStatus {
    // 上线
    UP = 'up',

    // 下线
    DOWN = 'down',
}
/**
 * 上下线
 * @param params operate_type : up 上线 down 下线
 * @returns
 */
export const changeInterfaceOnline = (params: {
    service_id: string
    operate_type: OperateTypeOnlineStatus
}): Promise<{ service_id: string }> => {
    return put(`/api/data-application-service/v1/services/status`, params)
}

/**
 * 接口服务状态统计
 */
export const getInterfaceStatusStatistics =
    (): Promise<IInterfaceStatusStatistics> => {
        return get(
            `/api/data-application-service/frontend/v1/stats/status-statistics`,
        )
    }

/**
 *	接口服务部门统计
 */
export const getInterfaceDepartmentStatistics =
    (): Promise<IInterfaceDepartmentStatistics> => {
        return get(
            `/api/data-application-service/frontend/v1/stats/department-statistics`,
        )
    }

/**
 *	调用维度统计
 */
export const getInterfaceDailyStatistics = (
    params?: IInterfaceDailyStatisticsParams,
): Promise<{
    daily_statistics: IInterfaceDailyStatisticsItem[]
}> => {
    return get(
        `/api/data-application-service/frontend/v1/stats/daily-statistics`,
        params,
    )
}

/**
 * 服务同步信息 同步获取服务信息
 * @returns
 */
export const serviceSyncAPI = (service_id: string): Promise<any> => {
    return post(`/api/data-application-service/v1/services/sync/${service_id}`)
}

/**
 * 查询日志与错误列表
 * @param params
 * @returns
 */
export const getMonitorList = (
    params: IMonitorListReq,
): Promise<DataList<IMonitorListRes>> => {
    return get(`/api/data-application-service/v1/monitor/list`, params)
}

/**
 * 导出日志与错误列表
 * @param params
 * @returns
 */
export const exportMonitorList = (params: IMonitorListReq) => {
    return post(`/api/data-application-service/v1/monitor/export`, params, {
        responseType: 'arraybuffer',
    })
}

/**
 * 接口授权——获取子视图列表
 * @returns
 */
export const getSubServices = (
    params: ISearchSubView,
): Promise<IResult<ISubView>> => {
    return get(`/api/data-application-service/v1/sub-service`, params)
}

/**
 * 接口授权——创建子视图
 * @param 子视图 名称 | 子视图ID | 子视图内容
 * @returns
 */
export const createSubServices = (
    params: Omit<ISubView, 'id'>,
): Promise<ISubView> => {
    return post(`/api/data-application-service/v1/sub-service`, params)
}

/**
 * 接口授权——删除指定子视图
 * @param id 子视图ID
 * @returns
 */
export const deleteSubServices = (id: string) => {
    return del(`/api/data-application-service/v1/sub-service/${id}`)
}

/**
 * 接口授权——更新指定子视图
 * @param id  子视图ID
 * @param params 子视图  名称 | 内容
 * @returns
 */
export const updateSubServices = (
    id: string,
    params: Pick<ISubView, 'name' | 'detail'>,
): Promise<ISubView> => {
    return put(`/api/data-application-service/v1/sub-service/${id}`, params)
}

/**
 * 接口授权——获取指定子视图
 * @param id 子视图ID
 * @returns
 */
export const getSubServiceById = (id: string): Promise<ISubView> => {
    return get(`/api/data-application-service/v1/sub-service/${id}`)
}

/**
 * 获取接口示例代码
 * @param id 接口id 或 应用id
 * @returns Promise<{ code: string }>
 */
export const getExampleCode = (
    id: string,
): Promise<{
    go_example_code: string
    java_example_code: string
    python_example_code: string
    shell_example_code: string
}> => {
    return get(
        `/api/data-application-service/v1/services/${id}/api-doc/example-code`,
    )
}

export const downloadApiDoc = (params: {
    service_ids: string[]
    app_id?: string
}) => {
    return post(
        `/api/data-application-service/v1/services/api-doc/export`,
        params,
        {
            responseType: 'arraybuffer',
            returnFullResponse: true,
        },
    )
}
