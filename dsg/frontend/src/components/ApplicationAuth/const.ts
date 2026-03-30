import JSEncrypt from 'jsencrypt'
import {
    AppInfoDetail,
    checkRepeatAccountName,
    checkRepeatPassIdName,
    checkRepeatAppName,
    formatError,
    SortDirection,
    SortType,
} from '@/core'
import __ from './locale'

import { publicKey, PublicKey2048 } from '../DataSource/helper'

export const DefaultSearchQuery = {
    keyword: '',
    direction: SortDirection.DESC,
    sort: SortType.UPDATED,
    limit: 10,
    offset: 1,
}

/*
 * 排序菜单 标准
 */
export const menus = [
    { key: SortType.NAME, label: __('按应用名称排序') },
    { key: SortType.CREATED, label: __('按创建时间排序') },
    { key: SortType.UPDATED, label: __('按更新时间排序') },
]

// 定义一个名为defaultMenu的常量，用于指定默认的菜单排序配置。
// 该配置包括排序类型和排序方向，此处设置为按更新时间降序排列。
export const defaultMenu = {
    key: SortType.UPDATED,
    sort: SortDirection.DESC,
}

// 定义了一个配置表单的常量，用于指导用户输入不同类别的配置信息
export const FormConfigInfo = [
    {
        title: __('基本信息'),
        key: 'base_info',
        configItems: [
            'name',
            'description',
            'info_system_id',
            'application_developer_id',
        ],
    },
    {
        title: __('认证信息'),
        key: 'auth_info',
        configItems: [
            'account_name',
            'password',
            'account_id',
            // 'authority_scope',
            'has_resource',
        ],
        switch: 'auth_switch',
    },
    {
        title: __('省平台注册信息'),
        key: 'province_app_info',
        configItems: [
            'app_id',
            'access_key',
            'access_secret',
            'province_url',
            'province_ip',
            'contact_name',
            'contact_phone',
            'area_id',
            'range_id',
            'department_id',
            'org_code',
            'deploy_place',
        ],
        switch: 'province_registry_switch',
    },
]

export const FormConfigInfoOfCS = [
    {
        title: __('基本信息'),
        key: 'base_info',
        configItems: [
            'name',
            'pass_id',
            'token',
            'description',
            'info_system_id',
            'app_type',
            'ip_addr',
        ],
    },
    {
        title: __('上报信息'),
        key: 'province_app_info',
        configItems: [
            'app_id',
            'access_key',
            'access_secret',
            'province_url',
            'province_ip',
            'contact_name',
            'contact_phone',
            'area_id',
            'range_id',
            'department_id',
            'org_code',
            'deploy_place',
        ],
        switch: 'province_registry_switch',
    },
]

// 定义了一个配置表单的常量，用于指导用户输入不同类别的配置信息
export const ViewConfigInfo = [
    {
        title: __('基本信息'),
        key: 'base_info',
        configItems: [
            {
                key: 'name',
                label: __('应用名称：'),
            },
            {
                key: 'description',
                label: __('应用描述：'),
            },
            {
                key: 'info_systems',
                label: __('信息系统：'),
            },
            {
                key: 'application_developer',
                label: __('应用开发者：'),
            },
        ],
    },
    {
        title: __('认证信息'),
        key: 'auth_info',
        configItems: [
            {
                key: 'account_name',
                label: __('账户名称：'),
            },
            {
                key: 'account_id',
                label: __('账户ID：'),
            },
            {
                key: 'password',
                label: __('账户密码：'),
            },
            // {
            //     key: 'authority_scope',
            //     label: __('权限范围：'),
            // },
            {
                key: 'has_resource',
                label: __('可用资源：'),
            },
        ],
    },
    {
        title: __('省平台注册信息'),
        key: 'province_app_info',
        configItems: [
            {
                key: 'app_id',
                label: __('注册ID：'),
            },
            {
                key: 'access_key',
                label: 'Key：',
            },
            {
                key: 'access_secret',
                label: 'Secret：',
            },
            {
                key: 'province_url',
                label: 'URL：',
            },
            {
                key: 'province_ip',
                label: 'IP：',
            },
            {
                key: 'contact_name',
                label: __('联系人姓名：'),
            },
            {
                key: 'contact_phone',
                label: __('联系方式：'),
            },
            {
                key: 'area_name',
                label: __('应用领域：'),
            },
            {
                key: 'rang_name',
                label: __('应用范围：'),
            },
            {
                key: 'department_name',
                label: __('所属部门：'),
            },
            {
                key: 'org_code',
                label: __('所属部门编码：'),
            },
            {
                key: 'deploy_place',
                label: __('部署地点：'),
            },
        ],
    },
    {
        title: __('更多信息'),
        key: 'more_info',
        configItems: [
            {
                key: 'updater_name',
                label: __('最新更新人：'),
            },
            {
                key: 'updated_at',
                label: __('更新时间：'),
            },
            {
                key: 'updater_name',
                label: __('创建人：'),
            },
            {
                key: 'created_at',
                label: __('创建时间：'),
            },
        ],
    },
]

// 枚举PasswordModel定义了密码操作的不同模式
export enum PasswordModel {
    // VIEW 表示查看密码的操作
    VIEW = 'view',
    // EDIT 表示编辑密码的操作
    EDIT = 'edit',
    // CREATE 表示创建新密码的操作
    CREATE = 'create',
}

// 枚举PermissionsModule定义了不同模块的权限标识
export enum PermissionsModule {
    // DEMAND_TASK 表示需求任务模块的权限
    DEMAND_TASK = 'demand_task',
    // BUSINESS_GROOMING 表示业务梳理模块的权限
    BUSINESS_GROOMING = 'business_grooming',
    // STANDARDIZATION 表示标准化模块的权限
    STANDARDIZATION = 'standardization',
    // RESOURCE_MANAGEMENT 表示资源管理模块的权限
    RESOURCE_MANAGEMENT = 'resource_management',
    // CONFIGURATION_CENTER 表示配置中心模块的权限
    CONFIGURATION_CENTER = 'configuration_center',
}

// 定义了一个常量数组PermissionsOptions，用于存储各种权限对应的选项
// 这些权限选项关联到不同的数据管理功能模块
export const PermissionsOptions = [
    {
        // 数据需求及项目管理权限，包括需求和任务的管理
        label: __('数据需求及项目管理'),
        value: PermissionsModule.DEMAND_TASK,
        description: __('需求中心、任务中心'),
    },
    {
        // 业务梳理权限，涉及业务架构、建模和诊断
        label: __('业务梳理'),
        value: PermissionsModule.BUSINESS_GROOMING,
        description: __('业务架构、业务建模、业务诊断'),
    },
    {
        // 标准管理权限，管理数据标准和业务对象
        label: __('标准管理'),
        value: PermissionsModule.STANDARDIZATION,
        description: __('数据标准、业务对象'),
    },
    {
        // 数据资源管理权限，包括库表、数据模型、指标、接口和数据目录的管理
        label: __('数据资源管理'),
        value: PermissionsModule.RESOURCE_MANAGEMENT,
        description: __('库表管理、数据建模、指标管理、接口管理、数据目录'),
    },
    {
        // 配置中心权限，管理组织架构、信息系统、数据源、角色、审核策略等
        label: __('配置中心'),
        value: PermissionsModule.CONFIGURATION_CENTER,
        description: __(
            '组织架构、信息系统、数据源、角色管理、审核策略、通用配置、数据分级标签',
        ),
    },
]

// 对密码进行加密和base64处理
export const encryptAndSerializeString = (str) => {
    if (str) {
        // 创建RSA实例
        const encrypt = new JSEncrypt()
        encrypt.setPublicKey(PublicKey2048)
        // 使用公钥加密字符串
        const encrypted = encrypt.encrypt(str)
        return encrypted
    }
    return ''
}

/**
 * 根据权限模块获取权限详情
 *
 * 此函数用于从权限模块中查找并返回指定权限的详细信息它在权限配置中起到关键作用，
 * 将权限值与权限描述等信息关联起来这对于权限管理和控制非常重要
 *
 * @param value 权限模块值，用于标识具体的权限
 * @returns 返回找到的权限详情对象如果没有匹配的权限，返回undefined
 */
export const getPermissionDetail = (value: PermissionsModule) => {
    return PermissionsOptions.find((item) => item.value === value)
}

/**
 * 异步检查应用名称是否可用
 *
 * 此函数主要用于校验提供的应用名称是否已被占用使用了checkRepeatAppName函数进行重复性检查
 * 如果名称可用，则解析为成功；如果名称已存在，则返回一个带有错误信息的拒绝状态
 *
 * @param name 应用名称，必填，用于检查的目标名称
 * @param id 应用ID，可选，用于在更新应用名称时区分当前应用，避免误判重复
 * @returns 返回一个Promise对象，如果应用名称已存在，则Promise被拒绝并附带错误信息；否则，Promise被解析为成功
 */
export const checkoutAppName = async (
    name: string,
    id: string | undefined = undefined,
) => {
    try {
        // 使用checkRepeatAppName函数检查应用名称是否重复
        await checkRepeatAppName({ id, name })
        // 如果名称不重复，解析Promise为成功
        return Promise.resolve()
    } catch (err) {
        // 如果检查过程中抛出错误，拒绝Promise并附带“应用名称已存在”的错误信息
        if (err?.data?.code === 'ConfigurationCenter.Apps.AppsNameExist') {
            return Promise.reject(
                new Error(__('此应用名称已被您或其他用户使用过，请重新输入')),
            )
        }
        formatError(err)
        return Promise.resolve()
    }
}

export const checkoutPassIdName = async (
    pass_id: string,
    id: string | undefined = undefined,
) => {
    try {
        await checkRepeatPassIdName({ id, pass_id })
        return Promise.resolve()
    } catch (err) {
        return Promise.reject(new Error(__('PassID已存在，请重新输入')))
    }
}

// 异步检查账户名称是否可用
// @param name 要检查的账户名称
// @param id 可选参数，已存在账户的ID，用于在检查时排除自身
export const checkoutAccountName = async (
    name: string,
    id: string | undefined = undefined,
) => {
    try {
        // 使用checkRepeatAccountName函数检查应用名称是否重复
        await checkRepeatAccountName({ id, name })
        // 如果名称不重复，解析Promise为成功
        return Promise.resolve()
    } catch (err) {
        if (err?.data?.code === 'ConfigurationCenter.Apps.AppsNameExist') {
            // 如果检查过程中抛出错误，拒绝Promise并附带“应用名称已存在”的错误信息
            return Promise.reject(
                new Error(
                    __(
                        // 错误信息国际化
                        '此账户名称已存在（可能被已有的应用或部署工作台占用），请重新输入',
                    ),
                ),
            )
        }
        formatError(err)
        return Promise.resolve()
    }
}

// 查找数据的方法
export const findDataByValue = (
    value: string,
    data: Array<any>,
): any | undefined => {
    return data.find((item) => item.value === value)
}

/**
 * 将详细数据重新格式化以适应表单输入
 *
 * 此函数接收一个应用信息详细对象，将其转换为另一个对象，
 * 该对象更适合用于表单填写。它根据提供的详细数据，
 * 提取出特定的属性并重组它们，以便于在表单中使用。
 *
 * @param detailData 包含应用详细信息的对象
 * @returns 一个重新格式化后，适合表单使用的对象
 */
export const reFormatDataToForm = (
    detailData: AppInfoDetail,
    governmentSwitch: boolean,
    isCS: boolean = false,
) => {
    // 分解detailData对象，提取出province_app_info, info_systems和application_developer
    // 其余属性被分解为other对象
    const {
        province_app_info,
        info_systems,
        application_developer,
        token,
        ...other
    } = detailData

    // 构建一个初始信息对象，包含info_systems和application_developer的id
    const originInfo = {
        ...other,
        info_system_id: info_systems.id || undefined,
        application_developer_id: application_developer.id || undefined,
        token: isCS ? token : undefined,
    }

    // 如果province_app_info对象的app_id存在，则进一步处理
    if (governmentSwitch && province_app_info) {
        // 提取出province_app_info中的area_info, org_info和range_info
        const { area_info, org_info, range_info, ...rest } = province_app_info
        // 返回扩展后的originInfo对象，增加了org_id, area_id和range_id属性
        return {
            ...originInfo,
            ...rest,
            department_id: org_info?.department_id,
            org_code: org_info?.org_code,
            area_id: area_info?.id,
            range_id: range_info?.id,
        }
    }

    // 如果province_app_info对象的app_id不存在，则直接返回originInfo对象
    return originInfo
}

// 定义上报类型
export enum ReportType {
    // 上报
    REPORTED = 'reported',
    // 未上报
    UNREPORTED = 'to_report',
}

// 定义上报标签
export const ReportTabs = [
    {
        key: ReportType.UNREPORTED,
        label: __('未上报'),
    },
    {
        key: ReportType.REPORTED,
        label: __('已上报'),
    },
]

// 定义审核状态
export enum AuditStatus {
    // 审核中
    AUDITING = 'auditing',
    // 审核通过
    APPROVED = 'normal',
    // 审核不通过
    REJECTED = 'audit_rejected',
    // 未审核
    UNAUDITED = 'audit_cancel',
}

// 定义更新状态
export enum UpdateStatus {
    // 更新
    UPDATED = 'true',
    // 创建
    CREATED = 'false',
}

// 定义审核标签
export enum AuditTabType {
    // 待审核
    TO_AUDIT = 'tasks',
    // 已审核
    AUDITED = 'historys',
}

// 定义审核标签
export const AuditTabs = [
    {
        key: AuditTabType.TO_AUDIT,
        label: __('待审核'),
    },
    {
        key: AuditTabType.AUDITED,
        label: __('已审核'),
    },
]

// 定义审核数据类型
export enum AuditDataType {
    // 创建
    CREATE = 'create',
    // 更新
    UPDATE = 'update',
    // 上报
    REPORT = 'report',
}

// 定义审核数据类型标签
export const AuditDataTypeLabel = {
    [AuditDataType.CREATE]: __('创建'),
    [AuditDataType.UPDATE]: __('更新'),
    [AuditDataType.REPORT]: __('上报'),
}

// 定义审核类型
export enum AuditType {
    // 上报
    APP_REPORT_ESCALATE = 'af-sszd-app-report-escalate',
    // 申请（包含应用的创建和变更审核）
    APP_APPLY = 'af-sszd-app-apply-escalate',
}

// 默认应用申请审核查询参数
export const DefaultAppApplyAuditQuery = {
    keyword: '', // 关键词
    direction: SortDirection.DESC, // 排序方向
    sort: 'apply_time', // 排序字段 申请时间
    limit: 10, // 每页条数
    offset: 1, // 当前页码
}

/**
 * 默认上报应用查询参数
 */
export const DefaultAppReportQuery = {
    keyword: '', // 关键词
    direction: SortDirection.DESC, // 排序方向
    sort: 'updated_at', // 排序字段 申请时间
    limit: 10, // 每页条数
    offset: 1, // 当前页码
    report_type: ReportType.UNREPORTED, // 上报类型
    is_update: 'all', // 更新状态
}

/*
 * 上报排序菜单
 */
export const reportSortMenus = [
    { key: SortType.NAME, label: __('按应用名称排序') },
    { key: SortType.UPDATED, label: __('按更新时间排序') },
    { key: SortType.REPORTEDAT, label: __('按上报时间排序') },
]
