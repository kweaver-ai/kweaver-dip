import {
    allRoleList,
    AssetTypeEnum,
    convertRoleToPermissions,
    PermissionScope,
    SortDirection,
    SortType,
} from '@/core'
import __ from './locale'
import { ViewSortType, ApiSortType } from '@/components/MyAssets/const'
import { OptType } from './components/VisitAccessSelect/helper'

export const ApiMenus = [
    { key: ApiSortType.NAME, label: __('按资源名称排序') },
    // 根据using启用状态确定时间排序
    { key: ApiSortType.PUBLISH, label: __('按发布时间排序') },
    { key: ApiSortType.ONLINE, label: __('按上线时间排序') },
]

export const DataMenus = [
    { key: ViewSortType.NAME, label: __('按资源名称排序') },
    // 根据using启用状态确定时间排序
    { key: ViewSortType.PUBLISH, label: __('按发布时间排序') },
    { key: ViewSortType.ONLINE, label: __('按上线时间排序') },
]

// 生成方式
export const ServiceTypeList = [
    { label: '全部', value: 0 },
    { label: '接口生成', value: 'service_generate' },
    { label: '接口注册', value: 'service_register' },
]

export const ApiDefaultMenu = {
    key: 'update_time',
    sort: SortDirection.DESC,
}

export const DataViewDefaultMenu = {
    key: SortType.PUBLISHAT,
    sort: SortDirection.DESC,
}

// 审核状态
export enum STATE {
    // 全部
    All = 0,
    // 草稿
    Draft = 1,
    // 已发布
    Published = 3,
}

export enum SwitchMode {
    DOMAIN = 'domain',
    ARCHITECTURE = 'architecture',
}

export const ApiOptions = [
    {
        key: AssetTypeEnum.DataView,
        label: __(`库表`),
    },
    {
        key: AssetTypeEnum.Api,
        label: __(`接口服务`),
    },
    {
        key: AssetTypeEnum.Indicator,
        label: __(`指标`),
    },
]

export const SwitchOptions = [
    { label: __('业务对象'), value: SwitchMode.DOMAIN },
    { label: __('组织架构'), value: SwitchMode.ARCHITECTURE },
]

export const AccessType = {
    [SwitchMode.DOMAIN]: __('主题域'),
    [AssetTypeEnum.DataView]: __(`库表`),
    [AssetTypeEnum.Api]: __(`接口服务`),
    [AssetTypeEnum.SubView]: __(`规则`),
}

// 授权范围类型
export enum ScopeType {
    // 视图
    DataView = 'data_view',
    // 原子指标
    Atomic = 'atomic',
    // 衍生指标
    Derived = 'derived',
    // 复合指标
    Composite = 'composite',
    // 接口
    Api = 'api',
    // 规则
    Rule = 'rule',
}

export const ScopeTypeIcon = {
    [ScopeType.DataView]: 'icon-shitusuanzi',
    [ScopeType.Atomic]: 'icon-yuanzizhibiaosuanzi',
    [ScopeType.Derived]: 'icon-yanshengzhibiaosuanzi',
    [ScopeType.Composite]: 'icon-fuhezhibiaosuanzi',
    [ScopeType.Api]: 'icon-jiekoufuwuguanli',
    [ScopeType.Rule]: 'icon-hangliequanxian',
}

/**
 * 主题域类别
 */
export enum DomainType {
    /** 主题域分组 */
    subject_domain_group = 'subject_domain_group',
    /** 主题域 */
    subject_domain = 'subject_domain',
    /** 业务对象 */
    business_object = 'business_object',
    /** 业务活动 */
    business_activity = 'business_activity',
    /** 逻辑实体 */
    logic_entity = 'logic_entity',
}

/**
 * 库表行列授权库表模式
 */
export enum SubviewMode {
    /** 新建 */
    Create = 'create',
    /** 编辑 */
    Edit = 'edit',
}

export enum SubViewOptType {
    /** 临时添加 */
    Add,
    /** 提交创建 */
    Create,
    /** 提交更新 */
    Update,
    /** 提交删除 */
    Delete,
    /** 取消操作 */
    Cancel,
}

export enum UpdateOptType {
    /** 行列规则 */
    Rule,
    /** 访问者 */
    Visitor,
    /** 全部 */
    All,
}

export const IndicatorTypes = {
    atomic: __('原子指标'),
    derived: __('衍生指标'),
    composite: __('复合指标'),
}

// 定义访问者类型的枚举
// 枚举包含两种访问者类型：用户和应用
export enum VisitorType {
    USER = 'user', // 用户类型访问者
    APPLICATION = 'application', // 应用程序类型访问者
}

export const TabsItems = [
    // {
    //     key: 'user',
    //     label: __('组织架构'),
    // },
    {
        key: 'application',
        label: __('应用账户'),
    },
]
/** 默认授权范围ID 等同于空 */
export const DefaultAuthID = '00000000-0000-0000-0000-000000000000'

/**
 * 判断用户是否为访客
 *
 * 此函数通过检查用户的角色来确定该用户是否为访客访客被定义为没有资源访问角色的用户
 * 资源访问角色包括TCNormal、TCDataButler、TCDataGovernEngineer、TCDataOperationEngineer和TCDataOwner
 * 如果用户拥有这些角色之一，则被视为非访客
 *
 * @param userInfo 用户信息对象，包含用户的角色信息
 * @returns 如果用户是访客，则返回true；否则返回false
 */
export const getUserIsVisitor = (userInfo) => {
    // 定义资源访问角色数组，包含所有相关的角色ID
    const resourceAccessRole = [
        allRoleList.TCNormal,
        allRoleList.TCDataButler,
        allRoleList.TCDataGovernEngineer,
        allRoleList.TCDataOperationEngineer,
        allRoleList.TCDataOwner,
    ]
    const rolePerArr = convertRoleToPermissions(resourceAccessRole)
    // 初始化访客状态为false，假设用户初始为非访客
    let isVisitor = false

    rolePerArr.forEach((pers) => {
        const hasRole = pers.every((item) =>
            userInfo.permissions.find(
                (per) =>
                    per.id === item.id &&
                    (per.scope === item.scope ||
                        per.scope === PermissionScope.All),
            ),
        )
        if (hasRole) {
            isVisitor = true
        }
    })

    // // 遍历用户的角色，检查是否有资源访问角色
    // userInfo.roles.forEach((role) => {
    //     // 如果用户的角色ID在资源访问角色数组中，则设置为访客状态true
    //     if (resourceAccessRole.includes(role.id)) {
    //         isVisitor = true
    //     }
    // })
    // 返回最终的访客状态
    return isVisitor
}

export const getBelongType = (type: AssetTypeEnum) => {
    switch (type) {
        case AssetTypeEnum.DataView:
        case AssetTypeEnum.SubView:
            return AssetTypeEnum.DataView
        case AssetTypeEnum.Indicator:
        case AssetTypeEnum.Dim:
            return AssetTypeEnum.Indicator
        case AssetTypeEnum.Api:
        case AssetTypeEnum.SubService:
            return AssetTypeEnum.Api
        default:
            return AssetTypeEnum.DataView
    }
}

export const AccessTipText = {
    [AssetTypeEnum.DataView]: {
        [OptType.Read]: __('可见逻辑视图中的真实数据'),
        [OptType.Download]: __('可下载逻辑视图中的真实数据'),
        [OptType.Auth]: __(
            '可授可赋予用户再次授权资源的权限，可变更权限访问者权限、新增行/列规则及变更其拥有的行/列规则权',
        ),
        [OptType.Allocate]: __(
            '可赋予用户再次授权资源的权限，可变更访问者权限、新增行/列规则、或依据已有视图或行/列范围添加限定条件，但不可变更已有的行/列规则',
        ),
    },
    [AssetTypeEnum.Indicator]: {
        [OptType.Read]: __('可使用指标预览查看指标数据'),
        [OptType.Auth]: __(
            '可赋予用户再次授权资源的权限，可变更权限访问者权限、新增维度规则及变更其拥有的维度规则',
        ),
        [OptType.Allocate]: __(
            '可赋予用户再次授权资源的权限，可变更访问者权限、新增维度规则、或依据已有指标或维度范围添加限定条件，但不可变更已有的维度规则',
        ),
    },
    [AssetTypeEnum.Api]: {
        [OptType.Read]: __('该权限仅可授予应用账户，可见接口调用信息'),
        // [OptType.Auth]: __(
        //     '该权限仅可授予用户，可赋予用户再次授权资源的权限，可变更权限访问者权限、新增限定规则及变更其拥有的限定规则',
        // ),
        // [OptType.Allocate]: __(
        //     '该权限仅可授予用户，可赋予用户再次授权资源的权限，可变更访问者权限、新增限定规则、或依据已有接口或限定范围添加限定条件，但不可变更已有的限定规则',
        // ),
    },
}
