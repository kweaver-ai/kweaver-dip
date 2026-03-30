import { IObject } from '../../core/apis/configurationCenter/index'
import __ from './locale'
import {
    OnlineStatus,
    ParamsOperator,
    PublishStatus,
    SortDirection,
} from '@/core'

export const menus = [
    { key: 'name', label: __('按接口名称排序') },
    { key: 'create_time', label: __('按创建时间排序') },
    { key: 'update_time', label: __('按更新时间排序') },
]

export const defaultMenu = {
    key: 'update_time',
    sort: SortDirection.DESC,
}

/**
 * 目录类型
 * @parma RESCCLASSIFY 资源分类
 * @parma ORGSTRUC 组织架构
 */
export enum RescCatlgType {
    RESC_CLASSIFY = 'resource',
    ORGSTRUC = 'organization',
}

// 业务架构节点枚举
export enum Architecture {
    ALL = 'all', // 全部
    DOMAIN = 'domain', // 域
    DISTRICT = 'district', // 区域
    ORGANIZATION = 'organization', // 组织
    DEPARTMENT = 'department', // 部门
    BSYSTEM = 'business_system', // 信息系统
    BMATTERS = 'business_matters', // 业务事项
    BFORM = 'business_form', // 业务表单
    BSYSTEMCONTAINER = 'business_system_container', // 信息系统容器
    BMATTERSCONTAINER = 'business_matters_container', // 业务事项容器
    COREBUSINESS = 'main_business', // 业务模型
}

export enum FilterTreeNode {
    ALL = 'all_node',
    MNode = 'management_node',
}

export enum BatchOperate {
    PUBLISH = 'publish',
    UNPUBLISH = 'unpublish',
    DEL = 'del',
}

export enum AuditType {
    PUBLISH = 'af-data-application-publish',
    ONLINE = 'af-data-application-online',
    OFFLINE = 'af-data-application-offline',
    CHANGE = 'af-data-application-change',
}

export const managementNode = [
    Architecture.DOMAIN,
    Architecture.DISTRICT,
    Architecture.ORGANIZATION,
    Architecture.DEPARTMENT,
]

// 在树中不展示的节点类型
export const hiddenNodeType = [
    Architecture.BMATTERS,
    Architecture.BSYSTEM,
    Architecture.COREBUSINESS,
]

// 组织架构/资源目录-通用树节点
export interface CatlgTreeNode {
    id: string
    name: string
    path?: string
    type?: string
    parent_id?: string
    cate_id?: string
    expansion?: boolean
    children?: CatlgTreeNode[]
    isExpand?: boolean
}

export interface DataNode extends IObject {
    children?: DataNode[]
    isExpand?: boolean
}

export const allNodeInfo = {
    id: '',
    type: Architecture.ALL,
    path: '',
    name: '全部',
}

export interface IKL {
    key?: number | string
    value?: number | string
    label: string
}

// IKL类型中表示"全部"的key值
export const typeAll = 0

/**
 * 传入两个参数
 * @param str 目标字符串（需要被筛选的字符串）
 * @param keyword 筛选条件（筛选需要高亮的字符串）
 * @returns 返回处理后字符串
 */
export const highLight = (
    str: string,
    keyword: string,
    hlClassName?: string,
) => {
    if (!keyword) return str
    const pattern = new RegExp(
        keyword.replace(/[.[*?+^$|()/]|\]|\\/g, '\\$&'),
        'gi',
    )
    return str?.replace(pattern, `<span class=${hlClassName}>$&</span>`)
}

/**
 * @param key 目录节点key
 * @param data 目录datat
 * @param aimItemPrams 匹配key值为参数key的节点并向其中加上aimItemPrams
 * @param hasNoChildParms 没有孩子的节点添加hasNoChildParms
 * @param otherItemParms otherItemParms
 * @returns
 */
export const oprTreeData = (
    key: string,
    data: [],
    aimItemPrams: {},
    hasNoChildParms?: {},
    otherItemParms?: {},
) => {
    data?.forEach((item: any) => {
        if (item.id === key) {
            Object.assign(item, aimItemPrams)
        } else if (otherItemParms) {
            Object.assign(item, otherItemParms)
        }
        if (item.children) {
            oprTreeData(
                key,
                item.children,
                aimItemPrams,
                hasNoChildParms,
                otherItemParms,
            )
        } else {
            Object.assign(item, hasNoChildParms)
        }
    })
    return data
}

/**
 * 状态信息
 */
export const stateList = [
    {
        value: 0,
        label: '全部',
    },
    {
        value: 'pending_submission',
        label: '待提交',
        color: 'rgba(0, 0, 0, 0.85)',
        bgColor: 'rgba(0, 0, 0, 0.04)',
    },
    {
        value: 'pending_review',
        label: '待审核',
        color: '#126EE3',
        bgColor: 'rgba(18, 110, 227, 0.06)',
    },
    {
        value: 'published',
        label: '已发布',
        color: 'rgb(82, 196, 27)',
        bgColor: 'rgba(82, 196, 27, 0.06)',
    },
    {
        value: 'publish_canceled',
        label: '已取消发布',
    },
    {
        value: 'unpublished',
        label: '未发布',
    },
    {
        value: 'change',
        label: '变更中',
    },
    {
        value: 'changed',
        label: '已变更',
    },
    {
        value: 'reject',
        label: '被驳回',
    },
    // {
    //     value: 9,
    //     label: '已上线',
    // },
    // {
    //     value: 10,
    //     label: '已下线',
    // },
]

// 生成方式
export const serviceTypeList: Array<IKL> = [
    { label: __('全部'), value: 0 },
    { label: __('接口生成'), value: 'service_generate' },
    { label: __('接口注册'), value: 'service_register' },
]

export const microserviceList = [
    { label: __('全部'), value: 0 },
    { label: __('否'), value: 'no' },
    { label: __('是'), value: 'yes' },
]

export const commonOptoins = [
    { label: __('全部'), value: 0 },
    { label: __('否'), value: 1 },
    { label: __('是'), value: 2 },
]

export enum createModelType {
    Wizard = 'wizard',
    Script = 'script',
}

export interface IDetailsLabel {
    label: string
    key?: string
    subKey?: string
    value: string | string[]
    span?: number
    class?: string
    styles?: any
    render?: () => void
}

export const operatorList = [
    {
        value: ParamsOperator.Equal,
        label: `${__('精确匹配')}(${ParamsOperator.Equal})`,
    },
    {
        value: ParamsOperator.Like,
        label: `${__('模糊匹配')}(${ParamsOperator.Like})`,
    },
    {
        value: ParamsOperator.Neq,
        label: `${__('不等于')}(${ParamsOperator.Neq})`,
    },
    {
        value: ParamsOperator.Greater,
        label: `${__('大于')}(${ParamsOperator.Greater})`,
    },
    {
        value: ParamsOperator.GreaterEqual,
        label: `${__('大于等于')}(${ParamsOperator.GreaterEqual})`,
    },
    {
        value: ParamsOperator.Less,
        label: `${__('小于')}(${ParamsOperator.Less})`,
    },
    {
        value: ParamsOperator.LessEqual,
        label: `${__('小于等于')}(${ParamsOperator.LessEqual})`,
    },
    {
        value: ParamsOperator.Incloudes,
        label: `${__('包含')}(${ParamsOperator.Incloudes})`,
    },
    {
        value: ParamsOperator.Excludes,
        label: `${__('不包含')}(${ParamsOperator.Excludes})`,
    },
]
export const updateCycleList = [
    {
        value: 'not_update',
        label: `不更新`,
    },
    {
        value: 'realtime',
        label: `实时`,
    },
    {
        value: 'daily',
        label: `每日`,
    },
    {
        value: 'weekly',
        label: `每周`,
    },
    {
        value: 'monthly',
        label: `每月`,
    },
    {
        value: 'quarterly',
        label: `每季度`,
    },
    {
        value: 'annually',
        label: `每年`,
    },
]

export const dataRangeList = [
    {
        value: 'city',
        label: `全市`,
    },
    {
        value: 'municipal',
        label: `市直`,
    },
    {
        value: 'district',
        label: `区县`,
    },
]

export const interfaceTypeList = [
    {
        value: 'query',
        label: `查询接口`,
    },
    {
        value: 'verify',
        label: `核验接口`,
    },
    {
        value: 'push',
        label: `订阅推送`,
    },
]

export const networkRegionList = [
    {
        value: 'gov_intranet',
        label: `政务内网`,
    },
    {
        value: 'gov_private',
        label: `政务专网`,
    },
    {
        value: 'gov_internet',
        label: `政务外网`,
    },
    {
        value: 'internet',
        label: `公网`,
    },
]
export const maskingList = [
    {
        value: 'plaintext',
        label: `不脱敏`,
    },
    {
        value: 'hash',
        label: `哈希`,
    },
    {
        value: 'override',
        label: `覆盖`,
    },
    {
        value: 'replace',
        label: `替换`,
    },
]
export const httpMethodList = [
    {
        value: 'post',
        label: 'POST',
    },
    {
        value: 'get',
        label: 'GET',
    },
    {
        value: 'put',
        label: 'PUT',
    },
    {
        value: 'delete',
        label: 'DELETE',
    },
]
export const returnTypeList = [
    {
        value: 'json',
        label: 'JSON',
    },
]
export const protocolList = [
    {
        value: 'http',
        label: 'HTTP',
    },
]
export const apiStyleList = [
    {
        value: 'restful',
        label: 'RESTFUL',
    },
]

export const commonTitleList = [
    { label: __('接口编码'), value: '', key: 'service_code' },
    // { label: '数据Owner', value: '', key: 'owners' },
    {
        label: '发布状态',
        value: '',
        key: 'publish_status',
        subKey: 'audit_type',
    },
    { label: __('上线状态'), value: '', key: 'status' },
]

export const basicCantainerList: Array<{
    label: string
    list: Array<any>
}> = [
    {
        label: '基本信息',
        list: [
            // {
            //     label: '数据范围',
            //     value: '',
            //     key: 'data_range',
            //     options: dataRangeList,
            // },
            // {
            //     label: '更新周期',
            //     value: '',
            //     key: 'update_cycle',
            //     options: updateCycleList,
            // },
            // { label: '信息系统', value: '', key: 'system', subKey: 'name' },
            // { label: '所属应用', value: '', key: 'app', subKey: 'name' },
            {
                label: '库表',
                value: '',
                key: 'data_view_name',
                span: 24,
            },
            {
                label: '所属业务对象',
                value: '',
                key: 'subject_domain_name',
            },
            { label: '所属部门', value: '', key: 'department', subKey: 'name' },
            {
                label: '所属系统',
                value: '',
                key: 'info_system_name',
            },
            // {
            //     label: '所属应用',
            //     value: '',
            //     key: 'apps_name',
            // },
            { label: '接口路径', value: '', key: 'service_path', span: 24 },
            {
                label: '后台服务域名/IP',
                value: '',
                key: 'backend_service_host',
            },
            {
                label: '后台服务路径',
                value: '',
                key: 'backend_service_path',
            },
            // {
            //     label: '接口分类',
            //     key: 'category',
            //     subKey: 'name',
            //     value: '',
            //     class: 'tags',
            //     span: 24,
            // },
            // { label: '接口标签', value: '', key: 'tags', span: 24 },
        ],
    },
    {
        label: '服务分类',
        list: [],
    },
    {
        label: '接口定义',
        list: [
            {
                label: '请求方式',
                value: '',
                key: 'http_method',
                options: httpMethodList,
            },
            {
                label: '返回类型',
                value: '',
                key: 'return_type',
                options: returnTypeList,
            },
            {
                label: '协议',
                value: '',
                key: 'protocol',
                options: protocolList,
            },
            { label: '接口文档', value: '', key: 'file', span: 24 },
            // {
            //     label: '接口类型',
            //     value: '',
            //     key: 'interface_type',
            //     options: interfaceTypeList,
            // },
            // {
            //     label: '网络区域',
            //     value: '',
            //     key: 'network_region',
            //     options: networkRegionList,
            // },
            { label: '接口说明', value: '', key: 'description', span: 24 },
        ],
    },
    {
        label: '接口拓展信息',
        list: [
            { label: '开发商', value: '', key: 'developer', subKey: 'name' },
            // { label: '服务案列', value: '', key: 'service_instance' },
            {
                label: '调用频率',
                value: '',
                key: 'rate_limiting',
                unit: '次/秒',
            },
            { label: '超时时间', value: '', key: 'timeout', unit: '秒' },
            // {
            //     label: '是否同步到数据服务超市',
            //     value: '',
            //     key: 'market_publish',
            // },
        ],
    },
]

export const paramsTitleList = [
    {
        label: '选择方式',
        value: '',
        key: 'data_source_select_type',
        span: 24,
    },
]
export const customTypeList = [
    {
        label: '数据源',
        value: '',
        key: 'data_source',
        subKey: 'schema_name',
    },
    {
        label: '数据表',
        value: '',
        key: 'data_table',
        subKey: 'table_name',
    },
]
export const datacatalogTypeList = [
    {
        label: '资源目录',
        value: '',
        key: 'data_catalog',
        subKey: 'name',
    },
    {
        label: '关联数据库名称',
        value: '',
        key: 'data_source',
        subKey: 'schema_name',
    },
    {
        label: '关联数据表名称',
        value: '',
        key: 'data_table',
        subKey: 'table_name',
    },
]

export enum TabKey {
    BASIC = 'service_info',
    PARAMS = 'service_param',
    RESPONSE = 'service_response',
    TEST = 'service_test',
}
interface IAuditStateAndflowType {
    key: string
    type: string
    value: number | string
}
export const auditStateAndflowType: IAuditStateAndflowType[] = [
    { key: 'draft', value: 1, type: 'status' },
    { key: 'publish', value: 3, type: 'status' },
    // { key: 'online', value: 5, type: 'status' },
    // { key: 'offline', value: 8, type: 'status' },
    { key: 'unpublished', value: '-1', type: 'audit_type' },
    { key: 'af-data-application-publish', value: '4', type: 'audit_type' },
    // { key: 'af-data-application-online', value: '1', type: 'audit_type' },
    // { key: 'af-data-application-offline', value: '3', type: 'audit_type' },
    { key: 'af-data-application-change', value: '2', type: 'audit_type' },
    { key: 'unpublished', value: '-1', type: 'audit_status' },
    { key: 'auditing', value: '1', type: 'audit_status' },
    { key: 'pass', value: '2', type: 'audit_status' },
    { key: 'reject', value: '3', type: 'audit_status' },
    { key: 'undone', value: '4', type: 'audit_status' },
]

export const auditProcessList = [
    { value: '', label: __('全部'), showList: [1, 3, 5, 8] },
    { value: '-1,-1', label: __('未发布'), showList: [1] },
    { value: '4,1', label: __('发布审核中'), showList: [1, 8] },
    { value: '4,3', label: __('发布驳回'), showList: [1, 8] },
    { value: '4,2', label: __('发布通过'), showList: [3] },
]

/**
 * 操作类型
 */
export enum OperationType {
    // 详情
    DETAIL = 'detail',

    // 编辑
    EDIT = 'edit',

    // 删除
    DELETE = 'delete',

    // 发布审核撤回
    PUBLISH_AUDIT_RETRACT = 'publish_audit_retract',

    // 上线
    ONLINE = 'online',

    // 变更
    CHANGE = 'change',

    // 变更审核撤回
    CHANGE_AUDIT_RETRACT = 'change_audit_retract',

    // 上线审核撤回
    ONLINE_AUDIT_RETRACT = 'online_audit_retract',

    // 下线
    OFFLINE = 'offline',

    // 下线审核撤回
    OFFLINE_AUDIT_RETRACT = 'offline_audit_retract',

    // 日志
    LOG = 'log',

    // 测试
    TEST = 'test',

    // 同步接口
    SYNC_INTERFACE = 'sync_interface',
}

/**
 * 版本类型
 */
export enum VersionType {
    // 变更中的版本
    CHANGING_VERSION = 'changing_version',

    // 已发布版本
    PUBLISH_VERSION = 'publish_version',
}

/**
 * 上线状态文案
 */
export const OnlineStatusTexts = {
    [OnlineStatus.NOT_ONLINE]: __('未上线'),
    [OnlineStatus.ONLINE]: __('已上线'),
    [OnlineStatus.UP_AUDITING]: __('上线审核中'),
    [OnlineStatus.UP_REJECT]: __('上线审核未通过'),
    [OnlineStatus.DOWN_AUDITING]: __('下线审核中'),
    [OnlineStatus.DOWN_REJECT]: __('下线审核未通过'),
    [OnlineStatus.OFFLINE]: __('已下线'),
}

/**
 * 上线状态颜色
 */
export const OnlineStatusColors = {
    [OnlineStatus.NOT_ONLINE]: '#D8D8D8',
    [OnlineStatus.ONLINE]: '#52C41B',
    [OnlineStatus.UP_AUDITING]: '#3A8FF0',
    [OnlineStatus.UP_REJECT]: '#E60012',
    [OnlineStatus.DOWN_AUDITING]: '#3A8FF0',
    [OnlineStatus.DOWN_REJECT]: '#E60012',
    [OnlineStatus.OFFLINE]: '#D8D8D8',
}

/**
 * 发布状态文案
 */
export const PublishStatusText = {
    [PublishStatus.UNPUBLISHED]: __('未发布'),
    [PublishStatus.PUBLISHED]: __('已发布'),
    [PublishStatus.PUB_AUDITING]: __('发布审核中'),
    [PublishStatus.CHANGE_AUDITING]: __('变更审核中'),
    [PublishStatus.CHANGE_REJECT]: __('变更审核未通过'),
    [PublishStatus.PUB_REJECT]: __('发布审核未通过'),
}

/**
 * 发布状态颜色
 */
export const PublishStatusColors = {
    [PublishStatus.UNPUBLISHED]: '#D8D8D8',
    [PublishStatus.PUBLISHED]: '#52C41B',
    [PublishStatus.PUB_AUDITING]: '#3A8FF0',
    [PublishStatus.CHANGE_AUDITING]: '#3A8FF0',
    [PublishStatus.CHANGE_REJECT]: '#E60012',
    [PublishStatus.PUB_REJECT]: '#E60012',
}

export enum ServiceTabKey {
    ALL = 'all',
    MY_DEPARTMENT = 'my_department',
}
