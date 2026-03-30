import { AxiosRequestConfig } from 'axios'
import { RcFile } from 'antd/lib/upload'
import Cookies from 'js-cookie'
import { Architecture } from '../../../components/BusinessArchitecture/const'
import requests, { cancelRequest } from '@/utils/request'
import {
    roleDuplicatedParam,
    rolesParams,
    roleList,
    roleCreateParams,
    roleCreateReturn,
    roleIconInfo,
    updateRoleParams,
    userInfo,
    userInfoReturn,
    usersOfRole,
    getRonInfoDetail,
    dataBaseInfo,
    dataSource,
    dataBaseParams,
    repeatDataSource,
    IChangeConnectStatusParams,
    ISystemItem,
    IInfoSystemParams,
    IUserAuth,
    IAssemblyLineGetRolesModel,
    IAssemblyLineEditParams,
    IAssemblyLineItem,
    IAssemblyLineModel,
    IAssemblyLineQueryParams,
    IAssemblyLineGetContentModel,
    IAssemblyLineSaveContentModel,
    IObjects,
    IGetFlowchart,
    ICCRuleItem,
    GradeLabelStatusEnum,
    ICreateDataGradeLabel,
    IGradeLabel,
    IUserRoleInfo,
    IAuditProcessQuery,
    IAuditProcessParam,
    AppInfo,
    IAppInfoParams,
    AppInfoDetail,
    AppsListParams,
    IDataDictItem,
    IDataDictBasicInfo,
    IGetDataDictPageParams,
    IDataDictDetail,
    IGetDataDictItemsParams,
    IDataDicts,
    DataDictQueryType,
    IApplyFrontMachineParams,
    IFrontMachineParams,
    IFrontMachineRes,
    IFrontMachineItem,
    IAllocateFrontMachineParams,
    IFrontMachineOverview,
    AppApplyAuditParams,
    AppApplyAuditItem,
    AppReportListParams,
    CreateFirmReq,
    IGetFirmListParams,
    IGetFirmListRes,
    FirmCheckType,
    LoginPlatform,
    IAddressBookItem,
    IEditAddressBookItem,
    IAddressBookListParams,
    IUpdateAlarmRuleParams,
    ICarouselsListRes,
    IExcellentCaseRes,
    IAlarmRuleRes,
    IUserDetails,
    IRoleBindingsParams,
    IPostRoleParams,
    IRoleDetails,
    ICreateRoleGroupParams,
    IRoleGroupDetails,
    IRoleItem,
    IRoleGroupItem,
    IPermissions,
    IDataSourceTreeBySource,
    IDataSourceTreeByType,
    IAppRegisterListParams,
    IAppRegisterListItem,
    ISystemRegisterListParams,
    ISystemRegisterListItem,
    ICreateUser,
    ICreateOrg,
    IRegisterSystemParams,
    IRegisterAppParams,
    IBusinessMattersListParams,
    IBusinessMattersListItem,
    IcreateBusinessMatters,
    IGetRescPolicyList,
    IRescPolicyListItem,
    IRescPolicyItem,
    RescPolicyStatus,
    ResourcePermissionConfig,
    IFormEnumConfigModel,
    ISmsConfig,
} from './index.d'
import {
    ICommonRes,
    IDataSourceInfo,
    IRescCatlgQuery,
    ICreateAuditProcess,
    IUpdateAuditProcess,
    convertRoleToPermissions,
    rolePermissions,
} from '@/core'
import { getRequestArryParams } from '@/utils'
import { BusinessDomainLevelTypes, DataList, IGetListParams } from '../common'

const { get, post, put, delete: del } = requests

/**
 * 角色查重 - 废弃
 * @param params 参数id需要检查的角色id,若为新建可不传， name 角色名称
 * @returns
 */
export const roleDuplicated = (
    params: roleDuplicatedParam,
): Promise<string> => {
    return get('/api/configuration-center/v1/roles/duplicated', params)
}

/**
 * 获取角色列表 - 废弃
 * @param params 角色的过滤条件
 * @returns 角色列表信息
 */
export const getSystemRoles = (params: rolesParams = {}): Promise<roleList> => {
    return get('/api/configuration-center/v1/roles', params)
}

/**
 * 新建系统角色 - 废弃
 * @param params 角色信息
 * @returns 创建结果
 */
export const createSystemRole = (
    params: roleCreateParams,
): Promise<Array<roleCreateReturn>> => {
    return post('/api/configuration-center/v1/roles', params)
}

/**
 * 获取角色的所有图标
 * @returns 角色图标
 */
export const getRoleIcons = (): Promise<Array<roleIconInfo>> => {
    return get('/api/configuration-center/v1/roles/icons')
}

/**
 * 更新角色 - 废弃
 * @param id 角色id
 * @param params 需要更新的数据
 * @returns 更新返回角色部分信息
 */
export const updateSystemRole = (
    id: string,
    params: updateRoleParams,
): Promise<roleCreateReturn> => {
    return put(`/api/configuration-center/v1/roles/${id}`, params)
}

/**
 *  删除角色 - 废弃
 * @param id 角色id
 * @returns
 */
export const deleteSystemRole = (id: string): Promise<Array<roleIconInfo>> => {
    return del(`/api/configuration-center/v1/roles/${id}`)
}

/**
 * 获取当前角色未添加的用户 - 废弃
 * @param rid 角色id
 * @returns
 */
export const getCandidateUser = (rid: string): Promise<Array<userInfo>> => {
    return get(`/api/configuration-center/v1/roles/${rid}/candidate`)
}

/**
 * 添加用户 - 废弃
 * @param rid 角色id
 * @param params 用户id集合
 * @returns 添加成功用户
 */
export const addUserForRole = (
    rid: string,
    params: {
        uids: Array<string>
    },
): Promise<Array<userInfoReturn>> => {
    return post(`/api/configuration-center/v1/roles/${rid}/relations`, params)
}

/**
 * 将用户从当前角色中移除 - 废弃
 * @param rid
 * @returns
 */
export const removeUserForRole = (
    rid: string,
    params: { uid: string },
): Promise<Array<userInfoReturn>> => {
    return del(`/api/configuration-center/v1/roles/${rid}/relations`, params)
}

/**
 * 通过角色id获取角色的用户 - 废弃
 * @param rid 角色id
 * @param params 分页参数
 * @returns
 */
export const getRoleUsers = (
    rid: string,
    params: rolesParams,
): Promise<usersOfRole> => {
    return get(`/api/configuration-center/v1/roles/${rid}/relations`, params)
}

/**
 * 获取角色指定信息 - 废弃
 * @param params key:根据需要返回的key，逗号分隔， 全部有：name,color,id,status,icon,system,userIds, role_ids 角色id
 * @returns
 */
export const getRoleInfo = (rid: string): Promise<getRonInfoDetail> => {
    return get(`/api/configuration-center/v1/roles/${rid}`)
}

// -------------------------------------------业务架构开始--------------------------------------------------------

export interface IObject {
    id: string
    name: string
    path: string
    type: string
    path_id?: string
    expand?: boolean
    children?: IObject[]
}

export interface IGetObject {
    id?: string
    is_all?: boolean
    keyword?: string
    limit?: number
    offset?: number
    type?: string
    expand_type?: string
    subtype?: number
    sort?: string
    direction?: string
}
// 获取树下级节点  分页及全部
export const getObjects = (params: IGetObject): Promise<IObjects<IObject>> => {
    return get(`/api/configuration-center/v1/objects`, params)
}

// 仅机构注册列表使用
export const getObjectsOrganization = (
    params: IGetObject,
): Promise<IObjects<IObject>> => {
    return get(`/api/configuration-center/v1/objects/organization`, params)
}

// ... existing code ...

// 请求取消管理器

class RequestCancelManager {
    private static instance: RequestCancelManager

    private pendingRequests: Map<string, AbortController[]> = new Map()

    static getInstance(): RequestCancelManager {
        if (!RequestCancelManager.instance) {
            RequestCancelManager.instance = new RequestCancelManager()
        }
        return RequestCancelManager.instance
    }

    // 取消指定类型的所有正在进行中的请求
    cancelPendingRequests(type: string): void {
        const controllers = this.pendingRequests.get(type) || []
        controllers.forEach((controller) => {
            if (!controller.signal.aborted) {
                controller.abort()
            }
        })
        // 清空正在进行中的请求队列
        this.pendingRequests.set(type, [])
    }

    // 添加正在进行的请求
    addPendingRequest(type: string, controller: AbortController): void {
        const controllers = this.pendingRequests.get(type) || []
        controllers.push(controller)
        this.pendingRequests.set(type, controllers)
    }

    // 移除已完成的请求（成功或失败）
    removePendingRequest(type: string, controller: AbortController): void {
        const controllers = this.pendingRequests.get(type) || []
        const index = controllers.indexOf(controller)
        if (index > -1) {
            controllers.splice(index, 1)
            this.pendingRequests.set(type, controllers)
        }
    }

    // 检查并取消之前的请求，返回新的控制器
    checkAndCancel(type: string): AbortController {
        // 只取消正在进行中的请求
        this.cancelPendingRequests(type)

        // 创建新的控制器
        const controller = new AbortController()
        this.addPendingRequest(type, controller)

        return controller
    }
}

// 获取树下级节点  分页及全部（带请求取消功能）
export const getObjectsWithCancel = (
    params: IGetObject,
): Promise<IObjects<IObject>> => {
    const manager = RequestCancelManager.getInstance()
    const requestType = 'getObjects'

    // 取消之前正在进行的请求，获取新的控制器
    const controller = manager.checkAndCancel(requestType)

    return new Promise((resolve, reject) => {
        // 使用 AbortController 发送请求
        get(`/api/configuration-center/v1/objects`, params, {
            signal: controller.signal,
        })
            .then((responseData) => {
                // 请求成功，移除控制器
                manager.removePendingRequest(requestType, controller)
                resolve(responseData)
            })
            .catch((error) => {
                // 请求失败，也要移除控制器
                manager.removePendingRequest(requestType, controller)

                // 如果是取消请求的错误，不抛出错误
                if (
                    error?.response?.data?.code === 'ERR_CANCELED' ||
                    error.name === 'AbortError'
                ) {
                    return // 请求已被取消，直接返回
                }
                reject(error)
            })
    })
}
// 获取一级部门
export const getFirstLevelDepartment = (params: IGetObject): Promise<any> => {
    return get(
        `/api/configuration-center/v1/objects/first_level_department`,
        params,
    )
}
/**
 * 关键词查询树节点
 * @param id 目录节点id
 * @param keyword 关键词
 * @param type domain,district,organization,department,business_system,business_matters,business_form
 * @returns
 */
export const getObjectsByKeyword = (
    params: IGetObject,
): Promise<IObjects<IObject>> => {
    return get(`/api/configuration-center/v1/objects/tree`, params)
}

interface IcheckObject {
    name: string
    id: string
}
interface ImoveObject {
    name: string
    oid: string
}
interface IsuggestObject {
    id: string
    parent_id: string | number | null | undefined
}

export const moveNode = (
    id: string | number | null | undefined,
    params: ImoveObject,
): Promise<roleCreateReturn> => {
    return put(`/api/configuration-center/v1/objects/${id}/move`, params)
}
// 获取移动节点路径
export const getMoveNodepath = (id: string | undefined) => {
    return get(`/api/configuration-center/v1/objects/${id}/path`)
}

// 获取建议名称
export const getSuggestedName = (params: IsuggestObject) => {
    return get(
        `/api/configuration-center/v1/objects/${params.id}/suggested-name`,
        params,
    )
}

interface IAttribute {
    [key: string]: any
}
interface IObjectDetails {
    id: string
    name: string
    attributes: IAttribute
    type: string
    subtype: number
    main_dept_type: number
    dept_tag: string
    user_ids: string
    user_names: string
    path?: string
}
// 获取对象详情
export const getObjectDetails = (
    id: string,
    params?: any,
): Promise<IObjectDetails> => {
    return get(`/api/configuration-center/v1/objects/${id}`, params)
}
// 获取主部门id
export const getMainDepartInfo = (): Promise<any> => {
    return get(`/api/configuration-center/v1/frontend/user/main-depart-id`)
}

interface IUpdateObjAttribute {
    id: string
    name?: string
    attribute?: any
    type?: Architecture
    subtype?: number
    upper_id?: string
}
// 获取对象详情
export const updateObjAttribute = (params: IUpdateObjAttribute) => {
    return put(`/api/configuration-center/v1/objects/${params.id}`, params)
}

// 上传文件
export const uploadObjFile = (id: string, params: FormData) => {
    return post(`/api/configuration-center/v1/objects/${id}/upload`, params)
}

// 下载文件
export const downloadObjFile = (id: string, object_id: string) => {
    return post(
        `/api/configuration-center/v1/objects/${object_id}/download`,
        { file_id: id },
        {
            responseType: 'arraybuffer',
        },
    )
}

/**
 * 获取组织架构主干业务
 */
export const getOrgMainBusinessList = (params: IGetObject): Promise<any> => {
    return get(
        `/api/configuration-center/v1/objects/${params.id}/main-business`,
        params,
    )
}
/**
 * 组织架构主干业务
 */
export const addOrgMainBusinessList = (params: any): Promise<any> => {
    return post(
        `/api/configuration-center/v1/objects/${params.id}/main-business`,
        params,
    )
}
/**
 * 更新组织架构主干业务
 */
export const updateOrgMainBusinessList = (params: any): Promise<any> => {
    return put(`/api/configuration-center/v1/objects/main-business`, params)
}
/**
 * 删除组织架构主干业务
 */
export const delOrgMainBusiness = (params: any): Promise<any> => {
    // let urlParams = ''
    // if (params?.ids) {
    //     urlParams += `${getRequestArryParams('ids', params?.ids)}`
    // }
    // urlParams = urlParams ? `?${urlParams}` : ''
    return del(`/api/configuration-center/v1/objects/main-business`, {}, params)
}
/**
 * 获取组织架构同步时间
 */
export const getOrgObjectsSyncTime = (): Promise<any> => {
    return get(`/api/configuration-center/v1/objects/sync/time`)
}
/**
 * 同步组织架构
 */
export const syncOrgObjects = (): Promise<any> => {
    return post(`/api/configuration-center/v1/objects/sync`)
}

// -------------------------------------------业务架构结束------------------------------------------------------------

/**
 * 获取配置路径
 * @param path 查询路径参数,ture返回带路径地址
 */
export const getConfigPaths = (
    path: boolean = false,
): Promise<
    Array<{
        name: string
        addr: string
    }>
> => {
    return get('/api/configuration-center/v1/third_party_addr', { path })
}

/**
 * 获取项目方（cs项目或者通用（tc）项目）
 * @returns
 */
export const getProject = () => {
    return get(`/api/configuration-center/v1/project-provider`)
}

// 数据源部分开始-
/**
 * 添加数据源
 * @param params.source_type string Enum: "info_system" "data_warehouse"，以下数据源相关接口数据源类型在验重checkDataSourceRepeat和获取列表getDataSourceList时可传not_classified类型
 * @returns
 */
export const createDataSource = (
    params: dataSource,
): Promise<Array<userInfoReturn>> => {
    return post(`/api/configuration-center/v1/datasource`, params)
}

/**
 * 编辑数据源
 * @param params.source_type string Enum: "info_system" "data_warehouse"
 * @returns
 */
export const editDataSource = (
    id: string,
    params: dataSource,
): Promise<Array<userInfoReturn>> => {
    return put(`/api/configuration-center/v1/datasource/${id}`, params)
}
// 删除数据源
export const delDataSource = (id: string): Promise<Array<userInfoReturn>> => {
    return del(`/api/configuration-center/v1/datasource/${id}`)
}

/**
 * 获取数据源列表
 * @param params.source_type string Enum: "not_classified" "info_system" "data_warehouse"
 * @returns
 */
export const getDataSourceList = (params: dataBaseParams) => {
    return get(`/api/configuration-center/v1/datasource`, params)
}

/**
 * 数据源名称去重
 * @param params.source_type string Enum: "not_classified" "info_system" "data_warehouse"
 * @returns
 */
export const checkDataSourceRepeat = (params: repeatDataSource) => {
    return get(`/api/configuration-center/v1/datasource/repeat`, params)
}
// 数据源详情
export const getDataBaseDetails = (id: string): Promise<dataSource> => {
    return get(`/api/configuration-center/v1/datasource/${id}`)
}

/**
 * 更改连接状态
 * @param params 连接状态参数
 */
export const changeConnectStatus = (
    params: IChangeConnectStatusParams,
): Promise<any> => {
    return put(`/api/configuration-center/v1/datasource/connect-status`, params)
}

/**
 * 查询控制台所有用户列表
 * @param keyword 关键词
 * @param offset 偏移量
 * @param limit 限制
 * @param is_include_unassigned_roles 是否包含未分配角色用户
 */
export const getUserList = (params: {
    keyword?: string
    offset?: string
    limit?: string
    is_include_unassigned_roles?: boolean
}): Promise<any> => {
    return get(`/api/configuration-center/v1/users`, params)
}

// 数据资源目录
/**
 * 根据部门角色查询用户
 * @param depart_id 部门id
 * @param role_id 角色id
 * @param user_id 用户id
 */
export const getCurUserRolesByDepartment = (params: {
    depart_id: string
    role_id?: string
    user_id?: string
}): Promise<any> => {
    return get(`/api/configuration-center/v1/users/filter`, {
        ...params,
        // 没有传值时使用固定id，不可删除
        role_id: params?.role_id || '00002fb7-1e54-4ce1-bc02-626cb1f85f62',
    })
}

/**
 * 根据部门角色查询用户
 */
export const getCurUserDepartment = (): Promise<any> => {
    return get(`/api/configuration-center/v1/users/depart`)
}

// ------------------------------------------- 信息系统开始 ------------------------------------------------------------
// 查询信息系统列表
export const reqInfoSystemList = (
    params: IInfoSystemParams,
): Promise<DataList<ISystemItem>> => {
    return get(`/api/configuration-center/v1/info-system`, params)
}

// 查询信息系统详情
export const reqInfoSystemDetail = (id: string): Promise<ISystemItem> => {
    return get(`/api/configuration-center/v1/info-system/${id}`)
}

// 添加信息系统
export const reqAddInfoSystem = (params: ISystemItem): Promise<any> => {
    return post(`/api/configuration-center/v1/info-system`, params)
}

// 查询信息系统名称是否重复
export const reqNameIsValid = (params: any): Promise<boolean> => {
    return get(`/api/configuration-center/v1/info-system/repeat`, {
        id: params.id || '',
        name: params.name,
    })
}

// 修改信息系统
export const reqUpdInfoSystem = (id: string, params: any): Promise<any> => {
    return put(`/api/configuration-center/v1/info-system/${id}`, params)
}

// 删除信息系统
export const reqDelInfoSystem = (id: string): Promise<any> => {
    return del(`/api/configuration-center/v1/info-system/${id}`)
}
// ------------------------------------------- 信息系统结束 ------------------------------------------------------------

/**
 * 查看工作流程列表(不包含正在创建中的工作流程)
 * @param params
 */
export const assemblyLineQueryList = (
    params: IAssemblyLineQueryParams,
): Promise<IAssemblyLineModel> => {
    return get(`/api/configuration-center/v1/flowchart-configurations`, params)
}

/**
 * 查看指定工作流程基本信息
 * @param fid string 工作流程ID
 */
export const assemblyLineQueryItem = (
    fid: string,
): Promise<IAssemblyLineItem> => {
    return get(`/api/configuration-center/v1/flowchart-configurations/${fid}`)
}

/**
 * 删除指定工作流程
 * @param fid string 工作流程ID
 * @returns
 */
export const assemblyLineDelete = (
    fid: string,
): Promise<{ id: string; name: string }> => {
    return del(`/api/configuration-center/v1/flowchart-configurations/${fid}`)
}

/**
 * 预新建工作流程
 * @param params
 * @returns
 */
export const assemblyLineCreate = (
    params: IAssemblyLineEditParams,
): Promise<{ id: string; name: string }> => {
    return post(`/api/configuration-center/v1/flowchart-configurations`, params)
}

/**
 * 编辑指定工作流程基本信息
 * @param fid string 工作流程ID
 * @param params
 * @returns
 */
export const assemblyLineEdit = (
    fid: string,
    params: IAssemblyLineEditParams,
): Promise<{ id: string; name: string }> => {
    return put(
        `/api/configuration-center/v1/flowchart-configurations/${fid}`,
        params,
    )
}

/**
 * 获取指定工作流程内容
 * @param fid string 工作流程ID
 * @param version_id string? 工作流程版本ID，如果指定，则返回指定版本ID的工作流程内容；如果不指定，则返回最新的版本内容--发布存在变更的内容>>发布未变更的内容>>未发布的内容
 */
export const assemblyLineGetContent = (
    fid: string,
    params: { version_id?: string },
): Promise<IAssemblyLineGetContentModel> => {
    return get(
        `/api/configuration-center/v1/flowchart-configurations/${fid}/content`,
        params,
    )
}

/**
 * 保存工作流程内容
 * @param fid string 工作流程ID
 * @param version_id string? 工作流程版本ID，如果指定，则返回指定版本ID的工作流程内容；如果不指定，则返回最新的版本内容--发布存在变更的内容>>发布未变更的内容>>未发布的内容
 */
export const assemblyLineSaveContent = (
    fid: string,
    params: IAssemblyLineSaveContentModel,
): Promise<{ id: string; name: string }> => {
    return post(
        `/api/configuration-center/v1/flowchart-configurations/${fid}/content`,
        params,
    )
}

/**
 * 工作流程名称唯一性校验
 * @param name string 工作流程名称
 * @param flowchart_id string? 工作流程ID，可以为空，不为空表示排除该ID所对应的工作流程
 * @returns
 */
export const assemblyLineCheckUniqueness = (params: {
    flowchart_id?: string
    name: string
}): Promise<{
    repeat: boolean
    name: string
}> => {
    return get(
        `/api/configuration-center/v1/flowchart-configurations/check`,
        params,
    )
}

/**
 * 获取角色列表 - 废弃
 * @returns
 */
export const assemblyLineGetRoles = (): Promise<IAssemblyLineGetRolesModel> => {
    return get(`/api/configuration-center/v1/roles`)
}

// 数据目录页面-左侧筛选 组织架构-获取树下级节点  分页及全部(不会鉴权)
export const reqCatlgObjects = (params: IGetObject): Promise<IObjects<any>> => {
    return get(`/api/configuration-center/v1/objects/internal`, params)
}

/**
 * 配置中心通用全局配置
 * @param key 配置表中key对应值value的获取
 * @returns
 */
export const getGlobalConfigValue = (key: string): Promise<any> => {
    return get(`/api/configuration-center/v1/config-value`, {
        key,
    })
}

/**
 * 更新配置中心通用全局配置
 * @param params
 * @returns
 */
export const updateGlobalConfigValue = (params: {
    key: string
    value: string
}): Promise<any> => {
    return put(`/api/configuration-center/v1/config-value`, params)
}

/**
 * 获取资源分类目录
 * @param params
 * @returns
 */
export const getRescClasfCatlog = (params?: IRescCatlgQuery): Promise<any> => {
    return get(`/api/configuration-center/v1/objects`, params)
}

// 获取数据源
export const getDatasoucesBySysId = (
    params: any,
): Promise<ICommonRes<IDataSourceInfo>> => {
    return get(`/api/configuration-center/v1/datasource`, params)
}

/**
 * 查看当前用户信息 - 废弃
 * @param uid 用户id
 */
export const getCurUserRoles = (uid?: string): Promise<IUserRoleInfo[]> => {
    return get(`/api/configuration-center/v1/users/roles`, {
        uid,
    })
}

/**
 * 获取组织架构目录
 * @param params
 * @returns
 */
// export const getOrgStrucDir = (params?: IGetObject): Promise<IObjects> => {
//     return get(`/api/configuration-center/v1/objects`, params)
// }

/**
 * 查看用户角色的权限值 - 废弃
 * @param uid 用户id
 */
export const getUserAuthority = (): Promise<IUserAuth> => {
    return get(`/api/configuration-center/v1/users/access-control`)
}

/**
 * 查询业务场景
 */
export const getBusinessSceneList = (params): Promise<any> => {
    return get(`/api/configuration-center/v1/objects/`, params)
}

// 获取工作流程列表
export const getFlowchart = (): Promise<IGetFlowchart> => {
    return requests.get(
        `/api/configuration-center/v1/flowchart-configurations?is_all=true&with_image=false&release_state=released`,
    )
}

// 查询业务域层级配置
export const getBusinessDomainLevel = (): Promise<
    BusinessDomainLevelTypes[]
> => {
    return requests.get('/api/configuration-center/v1/business-domain-level')
}

// 修改业务域层级配置
export const updateBusinessDomainLevel = (params: {
    level: BusinessDomainLevelTypes[]
}): Promise<boolean> => {
    return requests.put(
        '/api/configuration-center/v1/business-domain-level',
        params,
    )
}

/**
 * 获取编码生成规则表
 * @returns  ICCRuleItem[]
 */
export const getCodeGenerationRules = (): Promise<ICommonRes<ICCRuleItem>> => {
    return requests.get('/api/configuration-center/v1/code-generation-rules')
}

/**
 * 获取指定ID编码生成规则
 * @param id 编码规则ID
 * @returns
 */
export const getCodeGenerationRuleByID = (id: string): Promise<ICCRuleItem> => {
    return requests.get(
        `/api/configuration-center/v1/code-generation-rules/${id}`,
    )
}

/**
 * 更新指定ID编码生成规则
 * @param id 编码规则ID
 * @returns
 */
export const updateCodeGenerationRuleByID = (
    id: string,
    params: Partial<ICCRuleItem>,
): Promise<ICCRuleItem> => {
    return requests.patch(
        `/api/configuration-center/v1/code-generation-rules/${id}`,
        params,
    )
}

/**
 * 检查前缀唯一性
 * @param prefix  编码规则前缀
 * @returns
 */
export const checkCodeRuleRepeatPrefix = (
    prefix: string,
): Promise<{ existence: boolean }> => {
    return requests.post(
        '/api/configuration-center/v1/code-generation-rules/existence-check/prefix',
        { prefix },
    )
}

/**
 * 查询部门下的用户
 * @returns
 */
export const getUserByDepartId = (params: {
    depart_id: string
    is_depart_in_need?: boolean
}) => {
    return requests.get(`/api/configuration-center/v1/depart/users`, params)
}

/**
 * 查询访问者(含用户与组织)
 * @returns
 */
export const searchUserDepart = (params: {
    keyword?: string
    limit?: number
    offset?: number
}) => {
    return requests.get(`/api/configuration-center/v1/depart-users`, params)
}
/**
 * 绑定审核流程查询接口
 */
export const getAuditProcessFromConfCenter = (params?: {
    audit_type?: string
}) => {
    return get(`/api/configuration-center/v1/audit-process`, params)
}
/**
 * 获取通用配置资源开关的状态
 * @returns
 */
export const getGeneralConfigUsing = (): Promise<{ using: 0 | 1 | 2 }> => {
    return requests.get(`/api/configuration-center/v1/data/using`)
}

/**
 * 设置通用配置状态
 * @param params
 * @returns
 */
export const settGeneralConfigUsing = (params: {
    using: 1 | 2
}): Promise<{ using: 0 | 1 | 2 }> => {
    return requests.put(`/api/configuration-center/v1/data/using`, params)
}

/**
 * 数据分组标签开启
 * @returns
 */
export const startDataGradeLabel = () => {
    return requests.post(`/api/configuration-center/v1/grade-label/status`, {})
}

/**
 * 数据分组标签状态查询
 * @returns
 */
export const getDataGradeLabelStatus = (): Promise<GradeLabelStatusEnum> => {
    return requests.get(`/api/configuration-center/v1/grade-label/status`, {})
}

/**
 * 获取数据分组标签
 * @returns
 */
export const getDataGradeLabel = (params: {
    keyword?: string
    is_show_label?: boolean
}): Promise<{ entries: IGradeLabel[] }> => {
    return requests.get(`/api/configuration-center/v1/grade-label`, params)
}

/**
 * 新建 数据分组 | 标签
 * @returns
 */
export const createDataGradeLabel = (params: ICreateDataGradeLabel) => {
    return requests.post(`/api/configuration-center/v1/grade-label`, params)
}
/**
 * 获取标签绑定关系
 * @returns
 */
export const getGradeLabelBindInfo = (id: string) => {
    return requests.get(
        `/api/configuration-center/v1/grade-label/binding/${id}`,
    )
}

/**
 * 删除 数据分组 | 标签
 * @returns
 */
export const deleteDataGradeLabel = (id: string) => {
    return requests.delete(`/api/configuration-center/v1/grade-label/${id}`)
}

/**
 * 查询标签颜色列表
 * @returns
 */
export const getGradeLabelIcons = (): Promise<string[]> => {
    return requests.get(`/api/configuration-center/v1/grade-label/list_icon`)
}

/**
 * 标签移动
 */
export const moveDataGradeLabel = (params: {
    id: string
    dest_parent_id: string
    next_id?: string
}): Promise<any> => {
    return post(`/api/configuration-center/v1/grade-label/reorder`, params)
}

/**
 * 校验标签名称唯一性
 * @returns
 */
export const checkGradeLabelName = (params: {
    id?: string
    name: string
    node_type: number
}): Promise<string[]> => {
    return requests.get(
        `/api/configuration-center/v1/grade-label/check-name`,
        params,
    )
}
/**
 * 获取字段黑名单
 * @param params
 * @returns
 */
export const getTimestampBlacklist = (): Promise<any> => {
    return requests.get(`/api/configuration-center/v1/timestamp-blacklist`)
}
/**
 * 设置字段黑名单
 * @param params
 * @returns
 */
export const setTimestampBlacklist = (params: {
    timestamp_blacklist: string[]
}): Promise<any> => {
    return requests.put(
        `/api/configuration-center/v1/timestamp-blacklist`,
        params,
    )
}

/**
 * 绑定审核流程查询接口
 */
export const getPolicyProcessList = (params: Partial<IAuditProcessQuery>) => {
    return get(`/api/configuration-center/v1/audit-process`, params)
}

/**
 * 创建审核流程绑定
 */
export const createPolicyProcess = (
    param: Partial<Omit<IAuditProcessParam, 'id'>>,
) => {
    return post(`/api/configuration-center/v1/audit-process`, param)
}

/**
 * 编辑审核流程绑定
 */
export const updatePolicyProcess = (param: Partial<IAuditProcessParam>) => {
    const { id, ...rest } = param
    return put(`/api/configuration-center/v1/audit-process/${id}`, rest)
}

/**
 * 解绑审核流程
 */
export const deletePolicyProcess = (id: string) => {
    return del(`/api/configuration-center/v1/audit-process/${id}`)
}

/**
 * 审核流程详情
 */
export const getPolicyProcessDetail = (id: string) => {
    return get(`/api/configuration-center/v1/audit-process/${id}`)
}
/**
 * 获取政府数据共享配置
 *
 * 此函数用于发起一个HTTP GET请求，从'/api/configuration-center/v1/government-data-share'接口获取政府数据共享的相关配置
 * 主要用于系统初始化或者配置动态更新时获取最新的政府数据共享设置
 *
 * @returns Promise< { on: string } > 返回一个Promise对象，该对象在解析后包含一个on属性的字符串值，代表政府数据共享的当前状态或配置
 */
export const getGovernmentDataShare = (): Promise<{
    on: boolean
}> => {
    return get(`/api/configuration-center/v1/government-data-share`)
}

/**
 * 设置政府数据共享配置
 *
 * 该函数通过发送HTTP PUT请求来更新系统中关于政府数据共享的配置设置
 * 主要用于允许或禁止政府数据共享，这对于符合某些法规或政策要求时非常有用
 *
 * @param {Object} params - 包含配置更新的参数对象
 * @param {string} params.on - 指定是否允许政府数据共享，可能的值为"allow"或"deny"
 * @returns {Promise} 返回一个Promise对象，该对象代表对服务器请求的异步操作
 */
export const setGovernmentDataShare = (params: { on: boolean }) => {
    return put(`/api/configuration-center/v1/government-data-share`, params)
}

/**
 * 获取应用列表
 *
 * 该函数通过发送HTTP GET请求，从配置中心API接口获取应用列表数据
 * 它使用了泛型Promise来异步返回一个包含应用信息的通用响应对象
 *
 * @param params IGetListParams类型的参数对象，用于指定获取应用列表的查询条件
 * @returns 返回一个Promise，解析为ICommonRes类型的应用信息响应对象
 */
export const getAppsList = (
    params: AppsListParams,
): Promise<ICommonRes<AppInfo>> => {
    return get(`/api/configuration-center/v1/apps`, params)
}

/**
 * 创建应用
 *
 * 该函数通过POST请求向API服务器创建一个新的应用实体它接受一个参数对象，该对象描述了应用的相关信息，
 * 并返回一个Promise，该Promise解析为一个包含应用信息的数组
 *
 * @param params {IAppInfoParams} - 应用信息参数对象，包含创建应用所需的各种信息
 * @return {Promise<Array<AppInfo>>} - 返回一个Promise，解析为包含新创建应用信息的数组
 */
export const createApp = (params: IAppInfoParams): Promise<AppInfo> => {
    return post(`/api/configuration-center/v1/apps`, params)
}

/**
 * 编辑应用信息
 *
 * 通过发送HTTP PUT请求，更新应用配置中心中的应用信息
 * 此函数用于更新应用的基本信息，如名称、描述等
 *
 * @param id 应用的唯一标识符
 * @param params 包含需要更新的应用信息的对象，符合IAppInfoParams接口
 * @returns 返回一个Promise，解析为更新后的应用信息对象
 */
export const editAppInfo = (
    id: string,
    params: IAppInfoParams,
): Promise<AppInfo> => {
    return put(`/api/configuration-center/v1/apps/${id}`, params)
}

/**
 * 通过ID删除应用配置
 *
 * 本函数通过发送HTTP DELETE请求到指定的API端点，来实现删除应用配置的功能
 * 使用了Promise来处理异步操作，以支持async/await等现代异步编程特性
 *
 * @param id 应用的唯一标识符
 * @returns 返回一个Promise，解析为API请求的响应对象
 */
export const deleteApp = (id: string): Promise<any> => {
    return del(`/api/configuration-center/v1/apps/${id}`)
}

/**
 * 检查应用名称是否重复
 *
 * 此函数用于向配置中心的API发送请求，以验证应用名称是否已经存在
 * 它通过发送一个GET请求到特定的API端点，并携带应用的ID（如果有的话）和应用的名称
 * 如果返回的Promise解决（resolve），则表示应用名称可用；如果被拒绝（reject），则可能表示名称已被占用或存在其他错误
 *
 * @param params 函数的参数对象，包含应用的ID和名称
 * @param params.id 应用的唯一标识符，可选
 * @param params.name 应用的名称，必填
 * @returns 返回一个Promise，该Promise解析为一个字符串，通常为空字符串，表示异步操作的结果
 */
export const checkRepeatAppName = (params: {
    id?: string
    name: string
}): Promise<string> => {
    return get(`/api/configuration-center/v1/apps/repeat`, params)
}

export const checkRepeatPassIdName = (params: {
    id?: string
    pass_id: string
}): Promise<string> => {
    return get(`/api/configuration-center/v1/apps/pass-id/repeat`, params)
}

/**
 * 检查账号名称是否重复
 *
 * 本函数通过发送HTTP GET请求，异步查询指定账号名称是否在系统中重复
 * 主要用于在创建或修改账号时，确保账号名称的唯一性
 *
 * @param params 查询参数，包括可选的id和必填的name
 *        id: (可选) 账号的唯一标识，用于排除自身账号名称的重复检查
 *        name: (必填) 需要检查的账号名称
 * @returns 返回一个Promise，解析为字符串类型，通常为错误信息或空字符串
 */
export const checkRepeatAccountName = (params: {
    id?: string
    name: string
}): Promise<string> => {
    return get(`/api/configuration-center/v1/apps/account_name/repeat`, params)
}

/**
 * 异步获取指定ID的应用详细信息
 *
 * 本函数通过发送HTTP GET请求到配置中心API，获取特定应用的详细信息
 * 使用Promise对象来处理异步操作，确保在获取数据期间不会阻塞当前执行线程
 *
 * @param id 应用程序的唯一标识符
 * @param params 可选参数对象，用于指定获取应用详细信息时的一些额外条件
 * @param params.version 指定返回应用的版本，可选值为'old'或'new'，默认为'new'
 * @returns 返回一个Promise对象，该对象在解析后会返回一个包含应用详细信息的AppInfoDetail对象
 */
export const getAppsDetail = (
    id: string,
    params?: { version?: 'published' | 'editing' | 'reported' | 'to_report' },
): Promise<AppInfoDetail> => {
    return get(`/api/configuration-center/v1/apps/${id}`, params)
}

/**
 * 获取数据所有者的应用列表
 *
 * 此函数通过调用配置中心的API来获取一组应用的基本信息，包括它们的ID、名称、描述等。
 * 这些信息对于理解谁是应用的开发者以及应用的基本概况非常重要。
 *
 * @returns Promise 解析后返回一个应用信息数组，每个应用包含以下属性：
 *  - id: 应用的唯一标识符
 *  - name: 应用名称
 *  - description: 应用的简要描述
 *  - info_system_name: 信息系统的名称
 *  - application_developer_name: 应用开发者的名称
 */
export const getAppsListByDataOwner = (): Promise<
    Array<{
        id: string
        name: string
        description: string
        info_system_name: string
        application_developer_name: string
    }>
> => {
    return get(`/api/configuration-center/v1/apps/all-brief`)
}

/**
 * 获取版本号
 */
export const getApplicationVersion = (): Promise<{
    version: string
    build_date: string
}> => {
    return get(`/api/configuration-center/v1/application/version`)
}

// 数据字典
// 获取字典分页数据
export const getDataDictPage = (
    params: IGetDataDictPageParams,
): Promise<{ total_count: number; entries: IDataDictBasicInfo[] }> => {
    return get(`/api/configuration-center/v1/dict/page`, params)
}

// 新建数据字典
export const createDataDict = (params: {
    dict_res: IDataDictBasicInfo
    dict_item_res: IDataDictItem[]
}): Promise<{ id: string }> => {
    return post(`/api/configuration-center/v1/dict/create-dict-item`, params)
}

// 更新字典
export const updateDataDict = (params: {
    dict_res: IDataDictBasicInfo
    dict_item_res: IDataDictItem[]
}): Promise<{ id: string }> => {
    return post(`/api/configuration-center/v1/dict/update-dict-item`, params)
}

// 删除数据字典
export const deleteDataDict = (id: string): Promise<any> => {
    return del(`/api/configuration-center/v1/dict/delete-dict-item/${id}`)
}

// 获取字典详情
export const getDataDictDetail = (id: string): Promise<IDataDictDetail> => {
    return get(`/api/configuration-center/v1/dict/detail/${id}`)
}

// 单独获取字典项
export const getDataDictItems = (
    params: IGetDataDictItemsParams,
): Promise<{ total_count: number; entries: IDataDictItem[] }> => {
    return get(`/api/configuration-center/v1/dict/dict-item-page`, params)
}

// 查询全部数据字典
export const getDataDicts = (
    query_type: DataDictQueryType = DataDictQueryType.Product,
): Promise<{ dicts: IDataDicts[] }> => {
    return get(
        `/api/configuration-center/v1/dict/get-dict-item-type-list?query_type=${query_type}`,
    )
}

// 根据类型获取字典值
export const getDataDictsByType = (
    resType: number,
    // ): Promise<{ dicts: IDataDictItem[] }> => {
): Promise<any> => {
    return get(`/api/configuration-center/v1/byType-list/${resType}`)
}

// 查询前置机详情
export const getFrontMachineDetails = (
    id: string,
): Promise<IFrontMachineItem> => {
    return get(`/api/configuration-center/v1/front-end-processors/${id}`)
}

// 申请前置机
export const applyFrontMachine = (params: {
    request: IApplyFrontMachineParams
}): Promise<any> => {
    return post(`/api/configuration-center/v1/front-end-processors`, params)
}

// 更新前置机
export const updateFrontMachine = (
    id: string,
    params: { request: IApplyFrontMachineParams },
): Promise<any> => {
    return put(
        `/api/configuration-center/v1/front-end-processors/${id}/request`,
        params,
    )
}

// 签收前置机
export const receiptFrontMachine = (id: string): Promise<any> => {
    return put(
        `/api/configuration-center/v1/front-end-processors/${id}/receipt`,
    )
}

// 签收驳回
export const rejectFrontMachine = (
    id: string,
    params: { comment: string },
): Promise<any> => {
    return put(
        `/api/configuration-center/v1/front-end-processors/${id}/reject`,
        params,
    )
}

// 回收前置机
export const reclaimFrontMachine = (id: string): Promise<any> => {
    return put(
        `/api/configuration-center/v1/front-end-processors/${id}/reclaim`,
    )
}

// 删除前置机
export const deleteFrontMachine = (id: string): Promise<any> => {
    return del(`/api/configuration-center/v1/front-end-processors/${id}`)
}

// 查询前置机
export const getFrontMachineList = (
    params: IFrontMachineParams,
): Promise<IFrontMachineRes> => {
    return get(`/api/configuration-center/v1/front-end-processors`, params)
}

// 查询前置机审核列表
export const getFrontMachineAuditList = (params: any): Promise<any> => {
    return get(
        `/api/configuration-center/v1/front-end-processors/apply-audit`,
        params,
    )
}

// 分配前置机
export const allocateFrontMachine = (
    id: string,
    params: { allocation: IAllocateFrontMachineParams[] },
): Promise<any> => {
    return put(
        `/api/configuration-center/v1/front-end-processors/${id}/node`,
        params,
    )
}

// 查询前置机
export const getFrontMachineOverview = (params: {
    start: number | string
    end: number | string
}): Promise<IFrontMachineOverview> => {
    return get(
        `/api/configuration-center/v1/front-end-processors-overview`,
        params,
    )
}

// 获取前置机列表
export const getMyMachineList = (params: any): Promise<any> => {
    return get(
        `/api/configuration-center/v1/front-end-processors/front-end-item-list`,
        params,
    )
}

// 撤回前置机审核
export const cancelFrontMachineAudit = (id: string): Promise<any> => {
    return put(
        `/api/configuration-center/v1/front-end-processors/${id}/cancel-audit`,
    )
}

/**
 * 获取应用状态审核流程列表
 * @param params
 * @returns
 */
export const getAppStatusAuditProcessList = (
    params: AppApplyAuditParams,
): Promise<ICommonRes<AppApplyAuditItem>> => {
    return get(`/api/configuration-center/v1/apps/apply-audit`, params)
}

/**
 * 撤回应用审核
 * @param id
 * @returns
 */
export const cancelAppAudit = (id: string) => {
    return put(`/api/configuration-center/v1/apps/${id}/app-audit/cancel`)
}

/**
 * 获取上报应用列表
 * @param params
 * @returns
 */
export const getSSZDReportAppList = (
    params: AppReportListParams,
): Promise<{
    total_count: number
    entries: any[]
}> => {
    return get(`/api/configuration-center/v1/province-apps`, params)
}

/**
 * 上报应用
 * @param params
 * @returns
 */
export const reportSSZDApp = (params: { ids: string[] }) => {
    return put(`/api/configuration-center/v1/province-apps/report`, params)
}

/*
 * 获取上报应用审核列表
 * @param params
 * @returns
 */
export const getSSZDReportAuditList = (
    params: AppApplyAuditParams,
): Promise<ICommonRes<AppApplyAuditItem>> => {
    return get(
        `/api/configuration-center/v1/province-apps/report-audit`,
        params,
    )
}

/**
 * 撤回上报应用审核
 * @param id
 * @returns
 */
export const cancelReportAudit = (id: string) => {
    return put(
        `/api/configuration-center/v1/province-apps/${id}/report-audit/cancel`,
    )
}

/**
 * 获取通用配置
 * @returns
 */
export const getConfigValue = (params?: { key: string }) => {
    return get(`/api/configuration-center/v1/config-values`, params)
}

// 厂商名录管理
// 厂商列表
export const getFirmList = (
    params: IGetFirmListParams,
): Promise<IGetFirmListRes> => {
    return get(`/api/configuration-center/v1/firm`, params)
}

// 创建厂商
export const createFirm = (params: CreateFirmReq): Promise<{ id: string }> => {
    return post(`/api/configuration-center/v1/firm`, params)
}

// 编辑厂商
export const editFirm = (
    id: string,
    params: CreateFirmReq,
): Promise<{ id: string }> => {
    return put(`/api/configuration-center/v1/firm/${id}`, params)
}

// 删除厂商
export const deleteFirm = (ids: string[]): Promise<any> => {
    return del(`/api/configuration-center/v1/firm`, undefined, { ids })
}

// 厂商名录导入
export const importFirm = (params: FormData): Promise<any> => {
    return post(`/api/configuration-center/v1/firm/import`, params)
}

// 厂商名录唯一性校验
export const uniqueCheckFirm = (params: {
    check_type: FirmCheckType
    value: string
}): Promise<{ repeat: boolean }> => {
    return get(`/api/configuration-center/v1/firm/uniqueCheck`, params)
}

// 通讯录管理 ------- start
// 通讯录列表
export const getAddressBookList = (
    params: IAddressBookListParams,
): Promise<ICommonRes<IAddressBookItem>> => {
    return get(`/api/configuration-center/v1/address-book`, params)
}

// 创建通讯录
export const createAddressBook = (
    params: IEditAddressBookItem,
): Promise<{ id: string }> => {
    return post(`/api/configuration-center/v1/address-book`, params)
}

// 编辑通讯录
export const editAddressBook = (
    id: string,
    params: IEditAddressBookItem,
): Promise<{ id: string }> => {
    return put(`/api/configuration-center/v1/address-book/${id}`, params)
}

// 删除通讯录
export const deleteAddressBook = (id: string): Promise<any> => {
    return del(`/api/configuration-center/v1/address-book/${id}`)
}

// 通讯录导入
export const importAddressBook = (params: FormData): Promise<any> => {
    return post(`/api/configuration-center/v1/address-book/import`, params)
}

// // 通讯录唯一性校验
// export const uniqueCheckAddressBook = (params: {
//     check_type: AddressBookCheckType
//     value: string
// }): Promise<{ repeat: boolean }> => {
//     return get(`/api/configuration-center/v1/address-book/uniqueCheck`, params)
// }
// 通讯录管理 ------- end

/**
 * 获取菜单
 * @param resource_type 资源类型，获取当前资源所有菜单
 */
export const getAllMenus = (params?: { resource_type?: string }) => {
    return get(`/api/configuration-center/v1/menus`, params)
}

/**
 * 存储菜单
 */
export const postAllMenus = (params) => {
    return post(`/api/configuration-center/v1/menus`, params)
}

/**
 * 获取登录平台
 */
export const getLoginPlatform = () => {
    return get(`/af/api/session/v1/platform`)
}

// 获取告警规则
export const getAlarmRule = (): Promise<IAlarmRuleRes> => {
    return get(`/api/configuration-center/v1/alarm-rule`)
}

// 更新告警规则
export const updateAlarmRule = (params: {
    alarm_rules: IUpdateAlarmRuleParams[]
}) => {
    return put(`/api/configuration-center/v1/alarm-rule`, params)
}

/** 获取指定用户的权限 - 废弃接口 */
export const getUsersPermissions = (
    id: string,
): Promise<{
    scope: string
    permissions: string[]
}> => {
    return get(`/api/configuration-center/v1/users/${id}/scope-and-permission`)
}

/** 更新指定用户的权限 - 废弃接口 */
export const putUsersPermissions = (
    id: string,
    params: {
        // 权限范围
        scope: string
        // 权限 id
        permissions: string[]
    },
) => {
    return put(
        `/api/configuration-center/v1/users/${id}/scope-and-permission`,
        params,
    )
}

/** 更新用户角色或角色组绑定，批处理 */
export const putUsersRoleBindings = (params: IRoleBindingsParams) => {
    return put(
        `/api/configuration-center/v1/user-role-or-role-group-bindings`,
        params,
    )
}

/** 获取指定用户详情 */
export const getUserDetails = (
    id: string,
    config?: AxiosRequestConfig,
): Promise<IUserDetails> => {
    return get(
        `/api/configuration-center/v1/frontend/users/${id}`,
        undefined,
        config,
    )
}

/** 获取用户列表 */
export const getUsersFrontendList = (
    params?: IGetListParams & {
        department_id?: string
        registered?: number
        include_sub_departments?: boolean
    },
    config?: AxiosRequestConfig,
): Promise<ICommonRes<IUserDetails>> => {
    return get('/api/configuration-center/v1/frontend/users', params, config)
}

/** 获取用户名称列表 */
export const getUsersNameList = (
    params?: IGetListParams & { department_id?: string },
    config?: AxiosRequestConfig,
): Promise<{ id: string; name: string }[]> => {
    return get('/api/configuration-center/v1/users/name', params, config)
}

/** 创建角色 */
export const postRole = (params: IPostRoleParams) => {
    return post(`/api/configuration-center/v1/roles`, params)
}

/** 更新角色 */
export const putRole = (id: string, params: IPostRoleParams) => {
    return put(`/api/configuration-center/v1/roles/${id}`, params)
}

/** 检查角色名称是否可以使用 */
export const getRoleNameCheck = (params: { id?: string; name: string }) => {
    return get(`/api/configuration-center/v1/frontend/role-name-check`, params)
}

/** 删除角色 */
export const deleteRoles = (id: string) => {
    return del(`/api/configuration-center/v1/roles/${id}`)
}

/** 更新指定角色的权限 */
export const putRolePermissions = (
    id: string,
    params: {
        // 权限范围
        scope: string
        // 权限 id
        permissions: string[]
    },
) => {
    return put(
        `/api/configuration-center/v1/roles/${id}/scope-and-permission`,
        params,
    )
}

/** 获取指定角色的详情 */
export const getRoleDetails = (id: string): Promise<IRoleDetails> => {
    return get(`/api/configuration-center/v2/frontend/roles/${id}`)
}

/** 获取角色列表 - 全部关联信息 */
export const getRolesFrontendList = (
    params?: IGetListParams & {
        // 角色类型 Internal 内置角色，Custom 自定义角色
        type?: string
        // 关联的角色组 ID
        role_group_id?: string
        // 逗号分隔的用户 ID 列表
        user_ids?: string
    },
    config?: AxiosRequestConfig,
): Promise<ICommonRes<IRoleDetails>> => {
    return get(`/api/configuration-center/v1/frontend/roles`, params, config)
}

/** 获取角色列表 - 简略信息 */
export const getRolesList = (
    params?: IGetListParams,
): Promise<ICommonRes<IRoleItem>> => {
    return get(`/api/configuration-center/v2/roles`, params)
}

/** 创建角色组 */
export const postRoleGroup = (params: ICreateRoleGroupParams) => {
    return post(`/api/configuration-center/v1/role-groups`, params)
}

/** 更新角色组 */
export const putRoleGroup = (id: string, params: ICreateRoleGroupParams) => {
    return put(`/api/configuration-center/v1/role-groups/${id}`, params)
}

/** 检查角色组名称是否可以使用 */
export const getRoleGroupNameCheck = (params: {
    id?: string
    name: string
}) => {
    return get(
        `/api/configuration-center/v1/frontend/role-group-name-check`,
        params,
    )
}

/** 删除角色组 */
export const deleteRoleGroup = (id: string) => {
    return del(`/api/configuration-center/v1/role-groups/${id}`)
}

/** 角色组、角色绑定，批处理 */
export const putRoleGroupRoleBindings = (params: IRoleBindingsParams) => {
    return put(`/api/configuration-center/v1/role-group-role-bindings`, params)
}

/** 获取角色组详情 */
export const getRoleGroupDetails = (id: string): Promise<IRoleGroupDetails> => {
    return get(`/api/configuration-center/v1/frontend/role-groups/${id}`)
}

/** 获取角色组列表 - 全部关联信息 */
export const getRoleGroupsFrontendList = (
    params: IGetListParams & {
        // 逗号分隔的用户 ID 列表
        user_ids?: string
    },
): Promise<ICommonRes<IRoleGroupDetails>> => {
    return get(`/api/configuration-center/v1/frontend/role-groups`, params)
}

/** 获取角色组列表 - 简略信息 */
export const getRoleGroupsList = (
    params?: IGetListParams,
): Promise<ICommonRes<IRoleGroupItem>> => {
    return get(`/api/configuration-center/v1/role-groups`, params)
}

/** 获取指定权限 */
export const getPermissions = (id: string): Promise<IPermissions> => {
    return get(`/api/configuration-center/v1/permission/${id}`)
}

/** 获取权限列表 */
export const getPermissionsList = (): Promise<ICommonRes<IPermissions>> => {
    return get(`/api/configuration-center/v1/permission`)
}

/** 根据权限获取用户列表 - 废弃接口 */
export const getUserListByPermission = (params: {
    // 权限ids
    permission_ids?: string[]
    // 权限类型 1-或 2-且
    permission_type?: number
    // 内置角色 id
    innerRoleId?: string
}): Promise<ICommonRes<{ id: string; name: string }>> => {
    let permission_ids = params.permission_ids || []
    if (params.innerRoleId) {
        permission_ids = convertRoleToPermissions([params.innerRoleId])
            .flat()
            .map((item) => item.id)
    }
    return post(
        `/api/configuration-center/v1/permission/query-permission-user-list`,
        {
            permission_ids,
            permission_type: params.permission_type || 2,
        },
    )
}
// 轮播图和案例 ---- start

// 获取轮播图列表查询
export const getCarouselList = (params?: any): Promise<ICarouselsListRes> => {
    return get(`/api/configuration-center/v1/carousels`, params)
}

// 上传轮播图
export const createCarousel = (params: FormData): Promise<any> => {
    return post(`/api/configuration-center/v1/carousels`, params)
}

// 修改轮播图
export const updateCarousel = (id: string, params: FormData): Promise<any> => {
    return put(`/api/configuration-center/v1/carousels/${id}/replace`, params)
}
// 删除轮播图
export const delCarousel = (id: string): Promise<any> => {
    return del(`/api/configuration-center/v1/carousels/${id}`)
}
// 预览轮播图
export const previewCarousel = (id: string): Promise<any> => {
    return get(`/api/configuration-center/v1/carousels/oss/${id}`)
}
// 下载轮播图
export const downloadCarousel = (id: string): Promise<any> => {
    return get(`/api/configuration-center/v1/carousels/preview/${id}`)
}
// 修改轮播图时间
export const updateCarouselsInterval = (interval: string): Promise<any> => {
    return put(
        `/api/configuration-center/v1/carousels/interval?interval_seconds=${interval}`,
    )
}
// 置顶
export const carouselsToTop = (id: string): Promise<any> => {
    return put(`/api/configuration-center/v1/carousels/update-top?ID=${id}`)
}
// 排序
export const carouselsToSort = (params: {
    id: string
    position: number
    type: string
}): Promise<any> => {
    return put(
        `/api/configuration-center/v1/carousels/update-sort?id=${params.id}&position=${params.position}&type=${params.type}`,
    )
}

/**
 *
 * @param id 案例id
 * @param type 案例类型
 * @param params 图片 FormData
 * @returns id
 */
export const createExcellentCase = (
    id: string,
    type: string,
    params: FormData,
): Promise<any> => {
    return post(
        `/api/configuration-center/v1/carousels/${id}/${type}/upload-case`,
        params,
    )
}
/**
 *
 * @param id id
 * @param caseId 案例id
 * @param type 案例类型
 * @param params 图片 FormData
 * @returns id
 */
export const updateExcellentCase = (
    id: string,
    caseId: string,
    type: string,
    params: FormData,
): Promise<any> => {
    return put(
        `/api/configuration-center/v1/carousels/${id}/${caseId}/${type}/update-case`,
        params,
    )
}

// 案例删除
export const delExcellentCase = (id: string): Promise<any> => {
    return del(`/api/configuration-center/v1/carousels/delete-case/${id}`)
}
// 案例状态启用
export const startExcellentCase = (id: string): Promise<any> => {
    return post(`/api/configuration-center/v1/carousels/update-case-state`)
}
// 获取案例列表查询
export const getExcellentCaseList = (params: {
    limit: number
    offset: number
    name?: string
}): Promise<any> => {
    return get(
        `/api/configuration-center/v1/carousels/get-by-case-name`,
        params,
    )
}
// 轮播图和案例 ---- end

/**
 * 获取帮助中心文档类型
 */
export const getDictByType = async (type: string = 'help-document') => {
    return get(
        `/api/configuration-center/v1/dict/get-dict-item-type?dict_type=${type}`,
    )
}

/**
 * 新增帮助文档
 */
export const createHelpDoc = async (params: any) => {
    return post(`/api/configuration-center/v1/news-policy/create`, params)
}

/**
 * 编辑帮助文档
 */
export const updateHelpDoc = async (id: string, params: any) => {
    return put(`/api/configuration-center/v1/news-policy/update/${id}`, params)
}

/**
 * 发布/取消发布帮助文档
 */
export const publishHelpDoc = async (id: string, status: number) => {
    return put(
        `/api/configuration-center/v1/news-policy/update?id=${id}&status=${status}`,
    )
}

/**
 * 删除帮助文档
 */
export const deleteHelpDoc = async (id: string) => {
    return del(`/api/configuration-center/v1/news-policy/delete/${id}`)
}

/**
 * 获取帮助文档列表
 */
export const getHelpDocList = async (params: {
    limit: number
    offset: number
    sort?: string
    direction?: 'asc' | 'desc'
    title?: string
    type?: string
    status?: number
}) => {
    return get(`/api/configuration-center/v1/news-policy/list`, params)
}

/**
 * 获取帮助文档详情
 */
export const getHelpDocDetail = async (params: { id: string }) => {
    return get(
        `/api/configuration-center/v1/news-policy/document/detail`,
        params,
    )
}

/**
 * 下载帮助文档
 */
export const downloadHelpDoc = async (id: string, fileName: string) => {
    const res = await fetch(
        `/api/configuration-center/v1/news-policy/file/${id}`,
        {
            headers: {
                Authorization: `Bearer ${Cookies.get('af.oauth2_token') || ''}`,
            },
        },
    )
    const blob = await res.blob()
    const file = new File([blob], fileName, { type: blob.type })

    return file
}
// 数据源树按类型分组
export const getDataSourceTreeBySource = (): Promise<
    Array<IDataSourceTreeBySource>
> => {
    return get(`/api/configuration-center/v1/datasource/group-by-source-type`)
}

// 数据源树按类型分组
export const getDataSourceTreeByType = (): Promise<
    Array<IDataSourceTreeByType>
> => {
    return get(`/api/configuration-center/v1/datasource/group-by-type`)
}

export const getAppRegisterList = (
    params: IAppRegisterListParams,
): Promise<ICommonRes<IAppRegisterListItem>> => {
    return get(`/api/configuration-center/v1/apps/register`, params)
}

export const getSystemRegisterList = (
    params: ISystemRegisterListParams,
): Promise<ICommonRes<ISystemRegisterListItem>> => {
    return get(`/api/configuration-center/v1/info-system/register`, params)
}

export const checkSystemIdentifierRepeat = (params: {
    id?: string
    identifier: string
}) => {
    return get(
        `/api/configuration-center/v1/info-system/system_identifier/repeat`,
        params,
    )
}
// 智能网关
// 负责人
/**
 * 负责人创建
 */
export const createUser = (params: ICreateUser[]) => {
    return post('/api/configuration-center/v1/user/register/create', params)
}

// 机构
/**
 * 机构创建
 */
export const createOrg = (params: ICreateOrg) => {
    return post(
        '/api/configuration-center/v1/organization/register/create',
        params,
    )
}

/**
 * 机构更新
 */
export const updateOrg = (id: string, params: ICreateOrg) => {
    return put(
        `/api/configuration-center/v1/organization/register/update/${id}`,
        params,
    )
}

/**
 * 检查机构标签是否唯一
 */
export const checkTagUnique = (params: { dept_tag: string }) => {
    return get(
        '/api/configuration-center/v1/organization/register/unique',
        params,
    )
}

// 系统注册
export const registerSystem = (params: IRegisterSystemParams) => {
    return put(
        `/api/configuration-center/v1/info-system/${params.info_system_id}/register`,
        params,
    )
}

// 应用注册
export const registerApp = (params: IRegisterAppParams) => {
    return put(
        `/api/configuration-center/v1/apps/${params.id}/register`,
        params,
    )
}
// 业务事项管理 ---- start

// 查询业务事项列表
export const getBusinessMattersList = (
    params: IBusinessMattersListParams,
): Promise<ICommonRes<IBusinessMattersListItem>> => {
    return get(`/api/configuration-center/v1/business_matters`, params)
}

// 创建业务事项
export const createBusinessMatters = (params: IcreateBusinessMatters) => {
    return post('/api/configuration-center/v1/business_matters', params)
}

// 更新业务事项
export const updateBusinessMatters = (params: IcreateBusinessMatters) => {
    return put(
        `/api/configuration-center/v1/business_matters/${params?.id || ''}`,
        params,
    )
}
// 删除业务事项
export const delBusinessMatters = (id: string) => {
    return del(`/api/configuration-center/v1/business_matters/${id}`)
}

// 查询业务事项列名称是否重复
export const businessMattersNameCheck = (params: {
    name: string
    id?: string
}): Promise<any> => {
    return get(
        `/api/configuration-center/v1/business_matters/name-check`,
        params,
    )
}
// 业务事项管理 ---- end

// 资源权限申请-------------start
// 审核策略列表
export const reqRescAuditList = (
    params: IGetRescPolicyList,
): Promise<DataList<IRescPolicyListItem>> => {
    return get(`/api/configuration-center/v1/audit_policy`, params)
}

// 判审核策略名称是否重复
export const checkRescPolicyRepeat = (params: {
    id?: string
    name: string
}): Promise<{
    name: string
    repeat: boolean
}> => {
    return get(`/api/configuration-center/v1/audit_policy/name-check`, params)
}

// 创建审核策略
// 判断审核策略是否重复，true表示不重复，重复会报错
export const addRescPolicy = (
    params: IRescPolicyItem,
): Promise<{ id: string }> => {
    return post(`/api/configuration-center/v1/audit_policy`, params)
}

// 审核策略列表
export const updateRescPolicy = (
    params: IRescPolicyItem,
): Promise<{ id: string }> => {
    const { id, ...rest } = params
    return put(`/api/configuration-center/v1/audit_policy/${id}`, rest)
}

// 修改审核策略状态
export const changeRescPolictStatus = (
    id: string,
    status: RescPolicyStatus,
) => {
    return put(`/api/configuration-center/v1/audit_policy/${id}/status`, {
        status,
    })
}

// 审核策略详情
export const reqRescPolicyDetail = (id: string): Promise<IRescPolicyItem> => {
    return get(`/api/configuration-center/v1/audit_policy/${id}`)
}

// 删除审核策略
export const deleteRescAudit = (
    id: string,
): Promise<DataList<IRescPolicyListItem>> => {
    return del(`/api/configuration-center/v1/audit_policy/${id}`)
}

// 根据资源id合集批量获取是否有审核策略（前端适配显示申请权限按钮）
export const checkRescItemsHavePermission = (
    ids: Array<string>,
): Promise<ResourcePermissionConfig> => {
    return get(
        `/api/configuration-center/v1/audit_policy/resources/${ids?.join(',')}`,
    )
}

// 资源权限申请-------------end

// 短信推送配置-------------start
// 查询短信推送配置
export const getSmsConfig = (): Promise<ISmsConfig> => {
    return get(`/api/configuration-center/v1/sms-conf`)
}

// 编辑短信推送配置
export const editSmsConfig = (params: ISmsConfig) => {
    return put(`/api/configuration-center/v1/sms-conf`, params)
}

// 获取集成应用列表 在接口授权中使用
export const getIntegratedAppList = () => {
    return get(`/api/configuration-center/v1/user-management/apps`)
}
/**
 * 获取配置
 * @returns
 */
export const formsEnumConfig = (): Promise<IFormEnumConfigModel> => {
    return get(`/api/configuration-center/v1/enum-config`)
}
