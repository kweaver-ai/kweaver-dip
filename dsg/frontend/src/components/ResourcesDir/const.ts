import { isNumber, isEqual, unionBy } from 'lodash'
import { IObject } from '../../core/apis/configurationCenter/index'
import { ErrorInfo } from '@/utils'
import {
    keyboardCharactersReg,
    nameReg,
    uniformCreditCodeReg,
} from '@/utils/regExp'
import { IRescCatlgQuery } from '@/core/apis/dataCatalog/index.d'
import { IformItem, SearchType as ST } from '@/ui/LightweightSearch/const'
import { SearchType } from '@/components/SearchLayout/const'
import { SortDirection, dataTypeMapping } from '@/core'
import __ from './locale'
import { validateEnNullName, keyboardInputValidator } from '@/utils/validate'

/**
 * 目录类型
 * @parma RESCCLASSIFY 资源分类
 * @parma ORGSTRUC 组织架构
 *  @parma DOAMIN 业务域
 */
export enum RescCatlgType {
    RESC_CLASSIFY = 'resource',
    ORGSTRUC = 'organization',
    DOAMIN = 'domain',
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

export const managementNode = [
    // Architecture.DOMAIN,
    // Architecture.DISTRICT,
    Architecture.ORGANIZATION,
    Architecture.DEPARTMENT,
]

// 在树中不展示的节点类型
export const hiddenNodeType = [
    Architecture.BMATTERS,
    Architecture.BSYSTEM,
    Architecture.COREBUSINESS,
]

// 资源分类
export interface IRescNode {
    id: string
    name: string
    parent_id: string
    expansion: boolean
    children: IRescNode
}

// 组织架构/资源目录-通用树节点
export interface CatlgTreeNode extends IObject {
    level?: number
    parent_id?: string
    expansion?: boolean
    children?: CatlgTreeNode[]
    isExpand?: boolean
}

export interface DataNode extends IObject {
    children?: DataNode[]
    isExpand?: boolean
}

// 资源分类-树节点
// export interface RescDataNode extends IRescObject {}

// 每个节点下可包含的节点及属性字段
export const nodeInfo = {
    [Architecture.ALL]: {
        name: '全部',
        allobjects: [
            Architecture.DOMAIN,
            Architecture.DISTRICT,
            Architecture.ORGANIZATION,
            Architecture.DEPARTMENT,
            Architecture.COREBUSINESS,
            Architecture.BSYSTEM,
            Architecture.BMATTERS,
        ],
        subobjects: [Architecture.DOMAIN],
        fields: [],
    },
    [Architecture.DOMAIN]: {
        name: '域',
        allobjects: [
            Architecture.DISTRICT,
            Architecture.ORGANIZATION,
            Architecture.DEPARTMENT,
            Architecture.COREBUSINESS,
            Architecture.BSYSTEM,
            Architecture.BMATTERS,
        ],
        subobjects: [Architecture.DISTRICT, Architecture.ORGANIZATION],
        fields: ['name'],
    },
    [Architecture.DISTRICT]: {
        name: '区域',
        allobjects: [
            Architecture.DISTRICT,
            Architecture.ORGANIZATION,
            Architecture.DEPARTMENT,
            Architecture.COREBUSINESS,
            Architecture.BSYSTEM,
            Architecture.BMATTERS,
        ],
        subobjects: [Architecture.DISTRICT, Architecture.ORGANIZATION],
        fields: ['name'],
    },
    [Architecture.ORGANIZATION]: {
        name: '组织',
        allobjects: [
            Architecture.DEPARTMENT,
            Architecture.COREBUSINESS,
            Architecture.BSYSTEM,
            Architecture.BMATTERS,
        ],
        subobjects: [
            Architecture.DEPARTMENT,
            Architecture.COREBUSINESS,
            Architecture.BSYSTEM,
            Architecture.BMATTERS,
        ],
        fields: [
            'name',
            'short_name',
            'uniform_credit_code',
            'contacts',
            'phone_number',
        ],
    },
    [Architecture.DEPARTMENT]: {
        name: '部门',
        allobjects: [
            Architecture.DEPARTMENT,
            Architecture.COREBUSINESS,
            Architecture.BSYSTEM,
            Architecture.BMATTERS,
        ],
        subobjects: [
            Architecture.DEPARTMENT,
            Architecture.COREBUSINESS,
            Architecture.BSYSTEM,
            Architecture.BMATTERS,
        ],
        fields: [
            'name',
            'department_responsibilities',
            'contacts',
            'phone_number',
            'file_specification',
        ],
    },
    [Architecture.BMATTERSCONTAINER]: {
        name: '业务事项容器',
        allobjects: [Architecture.BMATTERS],
        subobjects: [Architecture.BMATTERS],
        fields: [],
    },
    [Architecture.BSYSTEMCONTAINER]: {
        name: '信息系统容器',
        allobjects: [Architecture.BSYSTEM],
        subobjects: [Architecture.BSYSTEM],
        fields: [],
    },
    [Architecture.BMATTERS]: {
        name: '业务事项',
        allobjects: [Architecture.BMATTERS],
        subobjects: [],
        fields: ['name', 'document_basis'],
    },
    [Architecture.BSYSTEM]: {
        name: '信息系统',
        allobjects: [Architecture.BSYSTEM],
        subobjects: [],
        fields: ['name'],
    },
    [Architecture.BFORM]: {
        name: '业务表单',
        subobjects: [],
        fields: ['name'],
    },
    [Architecture.COREBUSINESS]: {
        name: '业务模型',
        allobjects: [Architecture.BMATTERS],
        subobjects: [Architecture.BMATTERS],
        fields: ['name', 'business_matters', 'business_system'],
    },
}

export interface IPropertyInfo {
    label: string
    key: string
    forbitEdit?: boolean
    isEdit?: boolean
    isShowEdit?: boolean
    reg?: RegExp
    message?: string
    tips?: string[]
    max?: number
    type?: string
}
export const propertyInfo: IPropertyInfo[] = [
    {
        label: '名称',
        key: 'name',
        forbitEdit: true,
    },
    {
        label: '简称',
        key: 'short_name',
        isEdit: false,
        reg: nameReg,
        message: ErrorInfo.ONLYSUP,
    },
    {
        label: '统一信用代码',
        key: 'uniform_credit_code',
        isEdit: false,
        reg: uniformCreditCodeReg,
        message: ErrorInfo.UNIFORMCREDITCODE,
        max: 18,
    },
    {
        label: '部门职责',
        key: 'department_responsibilities',
        isEdit: false,
        reg: keyboardCharactersReg,
        message: ErrorInfo.EXCEPTEMOJI,
    },
    {
        label: '联系人',
        key: 'contacts',
        isEdit: false,
        reg: nameReg,
        message: ErrorInfo.ONLYSUP,
    },

    {
        label: '联系电话',
        key: 'phone_number',
        isEdit: false,
        reg: nameReg,
        message: ErrorInfo.ONLYSUP,
    },
    {
        label: '文件依据',
        key: 'file_specification',
        tips: ['创建部门或信息系统的政策文件，', '且文件大小不能超过50MB'],
    },
    {
        label: '文件依据',
        key: 'document_basis',
        tips: ['创建部门或信息系统的政策文件，', '且文件大小不能超过50MB'],
    },
    {
        label: '来源业务事项',
        key: 'business_matters',
        type: 'tag',
    },
    {
        label: '信息系统',
        key: 'business_system',
        type: 'tag',
    },
]

export const getParent = (nodeId: string, tree: DataNode[]) => {
    const result: DataNode[] = []
    function find(id: string, t: DataNode[]) {
        t?.forEach((item) => {
            if (item.children?.find((child) => child.id === id)) {
                result.push(item)
                return
            }
            if (item.children) {
                find(id, item.children)
            }
        })
    }
    find(nodeId, tree)
    return result[0]
}
export const commonOptoins = [
    { label: '是', value: 1 },
    { label: '否', value: 0 },
]
export const classifiedOptoins = [
    { label: '涉密', value: 1, key: 1, color: '#FF4D4F' },
    { label: '非涉密', value: 0, key: 0, color: 'rgba(0,0,0,0.25)' },
]
export const sensitiveOptions = [
    { label: '敏感', value: 1, key: 1, color: '#FF4D4F' },
    { label: '不敏感', value: 0, key: 0, color: 'rgba(0,0,0,0.25)' },
]
export enum fieldType {
    char = 1, // 字符型
    // number = 0, // 数字型
    int = 0, // 整数型
    date = 2, // 日期型
    datetime = 3, // 日期时间型
    timestamp = 4, // 时间戳型
    bool = 5, // 布尔型
    float = 7, // 小数型
    decimal = 8, // 高精度型
    time = 9, // 时间型
    other = 6, // 其他
}
export const typeOptoins = [
    { label: '字符型', value: fieldType.char, strValue: 'char' },
    { label: '整数型', value: fieldType.int, strValue: 'int' },
    { label: '小数型', value: fieldType.float, strValue: 'float' },
    { label: '高精度型', value: fieldType.decimal, strValue: 'decimal' },
    { label: '日期型', value: fieldType.date, strValue: 'date' },
    { label: '日期时间型', value: fieldType.datetime, strValue: 'datetime' },
    { label: '时间型', value: fieldType.time, strValue: 'time' },
    // { label: '时间戳型', value: 4, strValue: 'timestamp' },
    { label: '布尔型', value: fieldType.bool, strValue: 'bool' },
    { label: '其他', value: fieldType.other, strValue: 'other' },
]

export const FormatDataType = (type) => {
    switch (true) {
        case dataTypeMapping.char.includes(type):
            return fieldType.char
        case dataTypeMapping.int.includes(type):
            return fieldType.int
        case dataTypeMapping.bool.includes(type):
            return fieldType.bool
        case dataTypeMapping.date.includes(type):
            return fieldType.date
        case dataTypeMapping.time.includes(type):
            return fieldType.time
        case dataTypeMapping.datetime.includes(type):
            return fieldType.datetime
        case dataTypeMapping.float.includes(type):
            return fieldType.float
        case dataTypeMapping.decimal.includes(type):
            return fieldType.decimal
        default:
            return fieldType.other
    }
}

export const allNodeInfo = {
    id: '',
    type: Architecture.ALL,
    path: '',
    name: '全部',
}

/**
 * BASIC   基本信息
 * COLUMN  列属性
 * SAMPLTDATA 样例数据
 * CONSANGUINITYANALYSIS 血缘数据
 * DATAQUALITY 数据质量
 * COMPREHENSIONREPORT 理解报告
 * SCORE 评分
 * FILEINFO 文件信息
 * EVALUATION 评估
 * REPORT 上报
 * IMPACTANALYSIS 影响分析
 */
export enum TabKey {
    BASIC = 'basic_info',
    COLUMN = 'column_info',
    SAMPLTDATA = 'sample_data',
    CONSANGUINITYANALYSIS = 'consanguinity_anylysis',
    DATAQUALITY = 'data_quality',
    DATAPREVIEW = 'data_preview',
    RELATEDCATALOG = 'RelatedCatalog',
    REPORT = 'report',
    SCORE = 'score',
    FILEINFO = 'fileInfo',
    EVALUATION = 'evaluation',
    TASKMONITOR = 'taskMonitor', // 任务监控
    COMPREHENSIONREPORT = 'comprehensionReport',
    IMPACTANALYSIS = 'impactAnalysis',
}

/**
 * @params IAttrConfig
 * @params label 信息名称
 * @params name 信息字段
 * @params col 宽度[1, 12](对应<Col/>的span属性)
 * @params dataIndex 字段所在列
 */
export interface IAttrConfig {
    label: string
    name: string
    col?: number
    dataIndex?: string
    secKey?: string
    // type?: string
}

export interface IKL {
    key: number
    label: string
    value?: number
    color?: string
}

// 遍历数组返回对应key值项的label
export const traverseArray = (arr: Array<IKL>, key?: number) => {
    if (!isNumber(key)) return '--'
    const res = arr.find((item) => item.key === key)
    return res?.label || '--'
}

// 	更新频率 参考数据字典：GXZQ，1不定时 2实时 3每日 4每周 5每月 6每季度 7每半年 8每年 9其他
export const updateCycleList: Array<IKL> = [
    {
        key: 1,
        label: '不定时',
    },
    {
        key: 2,
        label: '实时',
    },
    {
        key: 3,
        label: '每日',
    },
    {
        key: 4,
        label: '每周',
    },
    {
        key: 5,
        label: '每月',
    },
    {
        key: 6,
        label: '每季度',
    },
    {
        key: 7,
        label: '每半年',
    },
    {
        key: 8,
        label: '每年',
    },
    {
        key: 9,
        label: '其他',
    },
]
// 更新频率
export enum updateCycle {
    realTime = 1,
    day = 2,
    week = 3,
    month = 4,
    season = 5,
    halfYear = 6,
    everyYear = 7,
    other = 8,
}
export const updateCycleOptions = [
    {
        label: '实时',
        value: updateCycle.realTime,
    },
    {
        label: '每日',
        value: updateCycle.day,
    },
    {
        label: '每周',
        value: updateCycle.week,
    },
    {
        label: '每月',
        value: updateCycle.month,
    },
    {
        label: '每季度',
        value: updateCycle.season,
    },
    {
        label: '每半年',
        value: updateCycle.halfYear,
    },
    {
        label: '每年',
        value: updateCycle.everyYear,
    },
    {
        label: '其他',
        value: updateCycle.other,
    },
]

// IKL类型中表示"全部"的key值
export const typeAll = 0

// 	更新频率 参考数据字典：GXZQ，1 人 2 地 4 事 8 物 16 组织 32 其他
export enum DataKindEnum {
    All = typeAll,
    PEPOLE = 1,
    LOCATION = 2,
    THING = 4,
    GOODS = 8,
    ORGANIZATION = 16,
    OTHER = 32,
}

// 审核状态
export enum STATE {
    // 全部
    All = typeAll,
    // 草稿
    Draft = 1,
    // 驳回
    Reject = 2,
    // 待审核
    // PendingReview = 3,
    // 已发布
    published = 3,
    // 审核中
    UnderReview = 4,
    // 已上线
    Online = 5,
    // 已下线
    Offline = 8,
}

// 基础信息分类
export const dataKindList: Array<IKL> = [
    {
        key: DataKindEnum.All,
        label: '全部',
    },
    {
        key: DataKindEnum.PEPOLE,
        label: '人',
    },
    // {
    //     key: DataKindEnum.LOCATION,
    //     label: '地',
    // },
    {
        key: DataKindEnum.THING,
        label: '事',
    },
    {
        key: DataKindEnum.GOODS,
        label: '物',
    },
    // {
    //     key: DataKindEnum.ORGANIZATION,
    //     label: '组织',
    // },
    // {
    //     key: DataKindEnum.OTHER,
    //     label: '其他',
    // },
]

interface IStateList {
    key: STATE
    label: string
    strValue?: string
    bgColor?: string
}

export const stateList: IStateList[] = [
    {
        key: STATE.All,
        label: __('全部'),
        strValue: '',
    },
    {
        key: STATE.Draft,
        label: __('草稿'),
        strValue: 'draft',
        bgColor: '#d8d8d8',
    },
    // {
    //     key: STATE.Reject,
    //     label: __('驳回'),
    // },
    {
        key: STATE.published,
        label: __('已发布'),
        strValue: 'publish',
        bgColor: '#3a8ff0',
    },
    // {
    //     key: STATE.UnderReview,
    //     label: __('审核中'),
    // },
    {
        key: STATE.Online,
        label: __('已上线'),
        strValue: 'online',
        bgColor: '#52c41b',
    },
    {
        key: STATE.Offline,
        label: __('已下线'),
        strValue: 'offline',
        bgColor: '#e60012',
    },
]

// 共享属性 1 无条件共享 2 有条件共享 3 不予共享
export enum ShareTypeEnum {
    All = typeAll,
    UNCONDITION = 1,
    CONDITION = 2,
    NOSHARE = 3,
}

export const shareTypeList: Array<IKL> = [
    {
        key: ShareTypeEnum.UNCONDITION,
        value: ShareTypeEnum.UNCONDITION,
        label: '无条件共享',
        color: 'rgba(0,0,0,0.25)',
    },
    {
        key: ShareTypeEnum.CONDITION,
        value: ShareTypeEnum.CONDITION,
        label: '有条件共享',
        color: '#F39422',
    },
    {
        key: ShareTypeEnum.NOSHARE,
        value: ShareTypeEnum.NOSHARE,
        label: '不予共享',
        color: '#FF4D4F',
    },
]

// 共享方式
export enum ShareModeEnum {
    Platform = 1,
    Email = 2,
    Medium = 3,
}
export const shareModeList: Array<IKL> = [
    {
        key: ShareModeEnum.Platform,
        label: '共享平台方式',
    },
    {
        key: ShareModeEnum.Email,
        label: '邮件方式',
    },
    {
        key: ShareModeEnum.Medium,
        label: '介质方式',
    },
]

// 挂接资源类型 1 库表 2 接口 3 文件 4 手工表
export const enum ResTypeEnum {
    TABLE = 1,
    API = 2,
    FILE = 3,
    MANUAL = 4,
    GENERATEAPI = 5,
}

// 挂接资源类型-key:3-文件类型已被删除
export const resTypeList: Array<IKL> = [
    {
        key: typeAll,
        value: typeAll,
        label: '全部',
    },
    {
        key: ResTypeEnum.TABLE,
        value: ResTypeEnum.TABLE,
        label: '库表',
    },
    {
        key: ResTypeEnum.API,
        value: ResTypeEnum.TABLE,
        label: '接口',
    },
]

// 关联信息类型 1 标签 2 来源业务场景 3 关联业务场景 4 关联系统 5 关联目录、信息项 6 关联业务对象
export enum InfoTypeEnum {
    All = typeAll,
    TAG = 1,
    SOURCE = 2,
    ASSOCIATEDSCENA = 3,
    ASSOCIATEDSYSTEM = 4,
    ASSOCIATEDCATLGADINFOS = 5,
    BUSINESSOBJECT = 6,
}

// 关联信息类型 1 标签 2 来源业务场景 3 关联业务场景 4 关联系统 5 关联目录、信息项
export const infoTypeList: Array<IKL> = [
    {
        key: InfoTypeEnum.TAG,
        label: '标签',
    },
    {
        key: InfoTypeEnum.SOURCE,
        label: '来源业务场景',
    },
    {
        key: InfoTypeEnum.ASSOCIATEDSCENA,
        label: '关联业务场景',
    },
    {
        key: InfoTypeEnum.ASSOCIATEDSYSTEM,
        label: '关联系统',
    },
    {
        key: InfoTypeEnum.ASSOCIATEDCATLGADINFOS,
        label: '关联目录、信息项',
    },
]

// 开放属性
export const enum OpenTypeEnum {
    OPEN = 1,
    HASCONDITION = 2,
    NOOPEN = 3,
}

export const openTypeList: Array<IKL> = [
    {
        key: OpenTypeEnum.OPEN,
        value: OpenTypeEnum.OPEN,
        label: '无条件开放',
        color: 'rgba(0,0,0,0.25)',
    },
    {
        key: OpenTypeEnum.HASCONDITION,
        value: OpenTypeEnum.HASCONDITION,
        label: '有条件开放',
        color: '#F39422',
    },
    {
        key: OpenTypeEnum.NOOPEN,
        value: OpenTypeEnum.NOOPEN,
        label: '不予开放',
        color: '#FF4D4F',
    },
]

// 数据归集机制(1 增量 ; 2 全量)
export const syncMechanismTypeList: Array<IKL> = [
    {
        key: 1,
        label: '增量',
    },
    {
        key: 2,
        label: '全量',
    },
]

/**
 * 可做的操作: 1 编辑;2 删除; 4 生成接口;8 发布;16 上线;32 变更;64 下线;128 审核;256 接口生成；允许多个操作则进行送算得到的结果即可
 */
export enum CatlgOperation {
    EDIT = 1,
    DELETE = 2,
    PRODUCEAPI = 4,
    PUBLISH = 8,
    ONLINE = 16,
    CHANGE = 32,
    OFFLINE = 64,
    VIEW = 128,
    GENERATEINTERFACE = 256,
}

export const catlgOprList = [
    {
        label: __('编辑'),
        value: CatlgOperation.EDIT,
        disabled: false,
    },
    {
        label: __('删除'),
        value: CatlgOperation.DELETE,
        disabled: false,
    },
    {
        label: __('生成接口'),
        value: CatlgOperation.PRODUCEAPI,
        disabled: false,
    },
    {
        label: __('发布'),
        value: CatlgOperation.PUBLISH,
        disabled: false,
    },
    {
        label: __('上线'),
        value: CatlgOperation.ONLINE,
        disabled: false,
    },
    {
        label: __('变更'),
        value: CatlgOperation.CHANGE,
        disabled: false,
    },
    {
        label: __('下线'),
        value: CatlgOperation.OFFLINE,
        disabled: false,
    },
    {
        label: __('审核'),
        value: CatlgOperation.VIEW,
        disabled: false,
    },
]

// 目录内容展示config
export enum AttrConfigShowed {
    BASIC = 'basic',
    SHARE = 'share',
    RELATED = 'related',
    VERSION = 'version',
    OTHER = 'other',
}

// 目录内容-基本信息-基本属性
export const basicAttrConfig: Array<IAttrConfig> = [
    {
        label: '目录名称',
        // dataIndex: 'columns',
        name: 'title',
        col: 24,
    },
    {
        label: '目录编号',
        name: 'code',
        col: 12,
    },
    {
        label: '数据源名称',
        name: 'data_source_name',
        col: 12,
    },
    {
        label: '库名称',
        name: 'schema_name',
        col: 12,
    },
    {
        label: '库表',
        name: 'name',
        col: 12,
    },
    {
        label: '目录提供方',
        name: 'orgname',
        col: 12,
    },
    {
        label: '数据Owner',
        name: 'owner_name',
        col: 12,
    },
    {
        label: '资源状态',
        name: 'state',
        col: 12,
    },
    {
        label: '审核状态',
        name: 'audit_state',
        secKey: 'flow_type',
        col: 12,
    },
    {
        label: '审批建议',
        name: 'audit_advice',
        col: 24,
    },
    // {
    //     label: '资源类型',
    //     dataIndex: 'mount_resources',
    //     name: 'res_type',
    //     col: 12,
    // },
    {
        label: '更新周期',
        name: 'update_cycle',
        col: 12,
    },
    {
        label: '资源分类',
        name: 'group_path',
        col: 12,
    },
    {
        label: '基础信息分类',
        name: 'data_kind',
        col: 12,
    },

    // {
    //     label: '空间范围',
    //     name: 'data_range',
    //     col: 12,
    // },
    // {
    //     label: '主题分类',
    //     name: 'theme_name',
    //     col: 12,
    // },
    // {
    //     label: '资源状态',
    //     name: 'state',
    //     col: 12,
    // },
    {
        label: '资源目录描述',
        name: 'description',
        col: 24,
    },
]

// 目录内容-基本信息-共享信息
export const shareAttrConfig: Array<IAttrConfig> = [
    {
        label: '共享属性',
        name: 'shared_type',
        col: 12,
    },
    {
        label: '共享条件',
        name: 'shared_condition',
        col: 12,
    },
    {
        label: '共享方式',
        name: 'shared_mode',
        col: 12,
    },
    {
        label: '开放属性',
        name: 'open_type',
        col: 12,
    },
    {
        label: '开放条件',
        name: 'open_condition',
        col: 12,
    },
]

// 目录内容-基本信息-关联信息
// 特殊处理-dataIndex为infos的name为对应key值
export const relatedAttrConfig: Array<IAttrConfig> = [
    {
        label: '关联主题',
        dataIndex: 'business_object_path',
        name: InfoTypeEnum.BUSINESSOBJECT.toString(),
        col: 24,
    },
    {
        label: '关联信息系统',
        dataIndex: 'infos',
        name: InfoTypeEnum.ASSOCIATEDSYSTEM.toString(),
        col: 12,
    },
    {
        label: '资源标签',
        dataIndex: 'infos',
        name: InfoTypeEnum.TAG.toString(),
        col: 12,
    },
    // {
    //     label: '来源业务场景',
    //     dataIndex: 'infos',
    //     name: InfoTypeEnum.SOURCE.toString(),
    //     col: 12,
    // },
    // {
    //     label: '关联业务场景',
    //     dataIndex: 'infos',
    //     name: InfoTypeEnum.ASSOCIATEDSCENA.toString(),
    //     col: 12,
    // },
    // {
    //     // 此字段 type为5-关联目录cname
    //     label: '关联数据资源目录',
    //     dataIndex: 'infos',
    //     name: 'cname',
    //     col: 12,
    // },
    // {
    //     // 此字段 type为5-信息项fname
    //     label: '关联字段',
    //     dataIndex: 'infos',
    //     name: 'fname',
    //     col: 12,
    // },
]

// 目录内容-基本信息-版本信息
export const versionAttrConfig: Array<IAttrConfig> = [
    // {
    //     label: '版本号',
    //     name: 'version',
    //     col: 12,
    // },
    // {
    //     label: '是否最新版本',
    //     name: 'current_version',
    //     col: 12,
    // },
    {
        label: '创建时间',
        name: 'created_at',
        col: 12,
    },
    {
        label: '创建人',
        name: 'creator_name',
        col: 12,
    },
    {
        label: '更新时间',
        name: 'updated_at',
        col: 12,
    },
    {
        label: '更新人',
        name: 'updater_name',
        col: 12,
    },
]

// 目录内容-基本信息-其他属性
export const otherAttrConfig: Array<IAttrConfig> = [
    // {
    //     label: '是否存在物理删除',
    //     name: 'physical_deletion',
    //     col: 12,
    // },
    {
        label: '是否发布',
        name: 'publish_flag',
        col: 12,
    },
    // {
    //     label: '数据同步机制',
    //     name: 'sync_mechanism',
    //     col: 12,
    // },
    // {
    //     label: '同步频率',
    //     name: 'sync_frequency',
    //     col: 12,
    // },
]

export const labelText = (text: string) => {
    return text || '--'
}

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
    hlStyle?: string,
) => {
    if (!keyword) return str
    const pattern = new RegExp(
        keyword.replace(/[.[*?+^$|()/]|\]|\\/g, '\\$&'),
        'gi',
    )
    return str?.replace(
        pattern,
        `<span class=${hlClassName} style=${hlStyle}>$&</span>`,
    )
}

/**
 * @param value 目录节点key值
 * @param keyName 匹配key值的字段名称
 * @param data 目录datat
 * @param aimItemPrams 匹配key值为参数key的节点并向其中加上aimItemPrams
 * @param hasNoChildParms 没有孩子的节点添加hasNoChildParms
 * @param otherItemParms otherItemParms
 * @returns
 */
export const oprTreeData = (
    value: string,
    data: Array<any>,
    aimItemPrams: {},
    hasNoChildParms?: {},
    otherItemParms?: {},
    keyName = 'id',
) => {
    data?.forEach((item: any) => {
        if (item[keyName] === value) {
            Object.assign(item, aimItemPrams)
        } else if (otherItemParms) {
            Object.assign(item, otherItemParms)
        }
        if (item.children) {
            oprTreeData(
                value,
                item.children,
                aimItemPrams,
                hasNoChildParms,
                otherItemParms,
                keyName,
            )
        } else {
            Object.assign(item, hasNoChildParms)
        }
    })
    return data
}

// 通过key获取目录
export const findTreeNodeByKey = (
    key: string,
    keyName: string,
    data: Array<any>,
) => {
    let dir
    data?.forEach((item: any) => {
        if (item[keyName] === key) {
            dir = item
        } else if (item.children) {
            const res = findTreeNodeByKey(key, keyName, item.children)
            if (res) {
                dir = res
            }
        }
    })
    return dir
}

// 挂接资源筛选类型
export enum IMountType {
    ViewCount = 'view_count',
    ApiCount = 'api_count',
    FileCount = 'file_count',
}
export const mountTypeOptions = [
    { label: '库表', value: IMountType.ViewCount },
    { label: '接口', value: IMountType.ApiCount },
    // { label: '文件', value: IMountType.FileCount },
]

export interface ISearchCondition extends IRescCatlgQuery {
    current: number
    pageSize: number
    shared_type?: number
    resource_type?: number
    data_kind?: number
    business_domain_id?: string
    status?: string
    mount_type?: string
    org_code?: string
    subject_id?: string
    category_node_id?: string
    department_id?: string
    source_department_id?: string
}

export const initSearchCondition: ISearchCondition = {
    current: 1,
    pageSize: 10,
    orgcode: '',
    keyword: '',
    direction: SortDirection.DESC,
    sort: 'updated_at',
}

// 资源目录字段为number，接口服务字段为string
export const auditProcessList = [
    { value: '', label: __('全部'), showList: [1, 3, 5, 8] },
    { value: '-1,-1', label: __('未发布'), showList: [1] },
    { value: '4,1', label: __('发布审核中'), showList: [1, 8] },
    { value: '4,3', label: __('发布驳回'), showList: [1, 8] },
    { value: '4,2', label: __('发布通过'), showList: [3] },
    { value: '1,1', label: __('上线审核中'), showList: [3] },
    { value: '1,3', label: __('上线驳回'), showList: [3] },
    { value: '1,2', label: __('上线通过'), showList: [5] },
    { value: '3,1', label: __('下线审核中'), showList: [5] },
    { value: '3,3', label: __('下线驳回'), showList: [5] },
    { value: '3,2', label: __('下线通过'), showList: [8] },
]

export enum publishStatus {
    Unpublished = 'unpublished',
    PublishedAuditing = 'pub-auditing',
    PublishedAuditReject = 'pub-reject',
    Published = 'published',
    ChangeAuditing = 'change-auditing',
    ChangeReject = 'change-reject',
}
export const publishedRejectList = [
    publishStatus.PublishedAuditReject,
    publishStatus.ChangeReject,
]
export const publishedList = [
    publishStatus.Published,
    publishStatus.ChangeAuditing,
    publishStatus.ChangeReject,
]
export const upPublishedList = [
    publishStatus.Unpublished,
    publishStatus.PublishedAuditing,
    publishStatus.PublishedAuditReject,
]
export const publishAudingAndRejectList: {
    label: string
    value: any
    color?: string
    bgColor?: string
}[] = [
    {
        label: __('发布审核中'),
        value: publishStatus.PublishedAuditing,
        bgColor: 'rgba(24, 144, 255, 0.08)',
        color: 'rgba(24, 144, 255, 1)',
    },
    {
        label: __('发布未通过'),
        value: publishStatus.PublishedAuditReject,
        bgColor: 'rgba(230, 0, 19, 0.08)',
        color: 'rgba(230, 0, 19, 1)',
    },
    {
        label: __('变更审核中'),
        value: publishStatus.ChangeAuditing,
        bgColor: 'rgba(24, 144, 255, 0.08)',
        color: 'rgba(24, 144, 255, 1)',
    },
    {
        label: __('变更未通过'),
        value: publishStatus.ChangeReject,
        bgColor: 'rgba(230, 0, 19, 0.08)',
        color: 'rgba(230, 0, 19, 1)',
    },
]
export const publishStatusList = [
    {
        label: __('未发布'),
        value: publishStatus.Unpublished,
        bgColor: 'rgba(0, 0, 0, 0.30)',
    },
    {
        label: __('未发布(发布审核中)'),
        value: publishStatus.PublishedAuditing,
        bgColor: 'rgba(0, 0, 0, 0.30)',
    },
    {
        label: __('未发布(发布未通过)'),
        value: publishStatus.PublishedAuditReject,
        bgColor: 'rgba(0, 0, 0, 0.30)',
    },
    {
        label: __('已发布'),
        value: publishStatus.Published,
        bgColor: '#52C41B',
    },
    {
        label: __('已发布(变更审核中)'),
        value: publishStatus.ChangeAuditing,
        bgColor: '#52C41B',
    },
    {
        label: __('已发布(变更未通过)'),
        value: publishStatus.ChangeReject,
        bgColor: '#52C41B',
    },
]
export enum onLineStatus {
    UnOnline = 'notline',
    OnlineAuditing = 'up-auditing',
    OnlineAuditingReject = 'up-reject',
    Online = 'online',
    OfflineAuditing = 'down-auditing',
    OfflineReject = 'down-reject',
    Offline = 'offline',
    OfflineOnlineAuditing = 'down-up-auditing',
    OfflineOnlineReject = 'down-up-reject',
    OfflineAuto = 'down-auto',
    OfflinelineAuditing = 'offline-up-auditing',
    OfflinelineReject = 'offline-up-reject',
}
export const onlinedList = [
    onLineStatus.Online,
    onLineStatus.OfflineAuditing,
    onLineStatus.OfflineReject,
]
export const onlinedRejectList = [
    onLineStatus.OnlineAuditingReject,
    onLineStatus.OfflineReject,
    onLineStatus.OfflineOnlineReject,
    onLineStatus.OfflinelineReject,
]
export const OfflinedList = [
    onLineStatus.Offline,
    onLineStatus.OfflineOnlineAuditing,
    onLineStatus.OfflineOnlineReject,
    onLineStatus.OfflinelineAuditing,
    onLineStatus.OfflinelineReject,
]
export const onLineAudingAndRejectList: {
    label: string
    value: any
    color?: string
    bgColor?: string
}[] = [
    {
        label: __('上线审核中'),
        value: onLineStatus.OnlineAuditing,
        bgColor: 'rgba(24, 144, 255, 0.08)',
        color: 'rgba(24, 144, 255, 1)',
    },
    {
        label: __('上线未通过'),
        value: onLineStatus.OnlineAuditingReject,
        bgColor: 'rgba(230, 0, 19, 0.08)',
        color: 'rgba(230, 0, 19, 1)',
    },
    {
        label: __('下线审核中'),
        value: onLineStatus.OfflineAuditing,
        bgColor: 'rgba(24, 144, 255, 0.08)',
        color: 'rgba(24, 144, 255, 1)',
    },
    {
        label: __('下线未通过'),
        value: onLineStatus.OfflineReject,
        bgColor: 'rgba(230, 0, 19, 0.08)',
        color: 'rgba(230, 0, 19, 1)',
    },
    {
        label: __('上线未通过'),
        value: onLineStatus.OfflineOnlineReject,
        bgColor: 'rgba(230, 0, 19, 0.08)',
        color: 'rgba(230, 0, 19, 1)',
    },
    {
        label: __('上线审核中'),
        value: onLineStatus.OfflinelineAuditing,
        bgColor: 'rgba(24, 144, 255, 0.08)',
        color: 'rgba(24, 144, 255, 1)',
    },
    {
        label: __('上线未通过'),
        value: onLineStatus.OfflinelineReject,
        bgColor: 'rgba(230, 0, 19, 0.08)',
        color: 'rgba(230, 0, 19, 1)',
    },
]
export const onLineStatusList = [
    {
        label: __('未上线'),
        value: onLineStatus.UnOnline,
        bgColor: 'rgba(0, 0, 0, 0.30)',
    },
    {
        label: __('未上线(上线审核中)'),
        value: onLineStatus.OnlineAuditing,
        bgColor: 'rgba(0, 0, 0, 0.30)',
    },
    {
        label: __('未上线(上线未通过)'),
        value: onLineStatus.OnlineAuditingReject,
        bgColor: 'rgba(0, 0, 0, 0.30)',
    },
    {
        label: __('已上线'),
        value: onLineStatus.Online,
        bgColor: '#52C41B',
    },
    {
        label: __('已上线(下线审核中)'),
        value: onLineStatus.OfflineAuditing,
        bgColor: '#52C41B',
    },
    {
        label: __('已上线(下线未通过)'),
        value: onLineStatus.OfflineReject,
        bgColor: '#52C41B',
    },
    {
        label: __('已下线'),
        value: onLineStatus.Offline,
        bgColor: '#E60012',
    },
    {
        label: __('已下线(上线审核中)'),
        value: onLineStatus.OfflinelineAuditing,
        bgColor: '#E60012',
    },
    {
        label: __('已下线(上线未通过)'),
        value: onLineStatus.OfflinelineReject,
        bgColor: '#E60012',
    },
]
export enum comprehensionStatus {
    UnComprehension = 1,
    Comprehension = 2,
    ComprehensionAuditing = 3,
    ComprehensionReject = 4,
}
export const comprehensionStatusList = [
    {
        label: __('未理解'),
        value: comprehensionStatus.UnComprehension,
        bgColor: 'rgba(0, 0, 0, 0.30)',
    },
    {
        label: __('已理解'),
        value: comprehensionStatus.Comprehension,
        bgColor: '#52C41B',
    },
    {
        label: __('未生成(理解审核中)'),
        value: comprehensionStatus.ComprehensionAuditing,
        bgColor: 'rgba(24, 144, 255, 0.08)',
        color: 'rgba(24, 144, 255, 1)',
    },
    {
        label: __('未生成(理解未通过)'),
        value: comprehensionStatus.ComprehensionReject,
        bgColor: 'rgba(230, 0, 19, 0.08)',
        color: 'rgba(230, 0, 19, 1)',
    },
]

// 已上线枚举值集
export const onlineEnumsList = [
    onLineStatus.Online,
    onLineStatus.OnlineAuditing,
    onLineStatus.OnlineAuditingReject,
]

// 未上线枚举值集
export const unOnlineEnumsList = [
    onLineStatus.UnOnline,
    onLineStatus.OnlineAuditing,
    onLineStatus.OnlineAuditingReject,
    onLineStatus.Offline,
]
export const publishAuditing = [
    publishStatus.PublishedAuditing,
    publishStatus.ChangeAuditing,
]
export const onlineAuditing = [
    onLineStatus.OnlineAuditing,
    onLineStatus.OfflineAuditing,
    onLineStatus.OfflineOnlineAuditing,
    onLineStatus.OfflinelineAuditing,
]
export const upPublish = [
    publishStatus.Unpublished,
    publishStatus.PublishedAuditReject,
]
export const infoItemsFormData: any[] = [
    {
        label: __('信息项名称'),
        key: 'name_cn',
        type: SearchType.Input,
        span: 24,
        itemProps: {
            maxLength: 128,
            disabled: true,
        },
        formItemProps: {
            rules: [
                {
                    required: true,
                    message: `输入不能为空`,
                },
                // {
                //     validator: validateEnNullName(),
                // },
            ],
        },
    },
    // {
    //     label: __('数据类型'),
    //     key: 'data_type',
    //     type: SearchType.Select,
    //     itemProps: {
    //         options: typeOptoins,
    //         allowClear: true,
    //     },
    // },
    // {
    //     label: __('数据长度'),
    //     key: 'data_length',
    //     type: SearchType.InputNumber,
    //     itemProps: {
    //         max: 65,
    //         min: 0,
    //         type: 'natural',
    //     },
    // },
    // {
    //     label: __('数据值域'),
    //     key: 'ranges',
    //     type: SearchType.Input,
    //     itemProps: {
    //         maxLength: 128,
    //     },
    //     formItemProps: {
    //         rules: [
    //             {
    //                 validator: keyboardInputValidator(),
    //             },
    //         ],
    //     },
    // },
    {
        label: __('涉密属性'),
        key: 'classified_flag',
        type: SearchType.Select,
        // offset: 12,
        itemProps: {
            options: classifiedOptoins,
            allowClear: true,
        },
    },
    {
        label: __('敏感属性'),
        key: 'sensitive_flag',
        type: SearchType.Select,
        itemProps: {
            options: sensitiveOptions,
            allowClear: true,
        },
    },
    {
        label: __('共享属性'),
        key: 'shared_type',
        type: SearchType.Radio,
        itemProps: {
            options: shareTypeList
                .filter((item) => {
                    return item.key !== ShareTypeEnum.All
                })
                .map((item) => {
                    return {
                        value: item.key,
                        label: item.label,
                    }
                }),
        },
        formItemProps: {
            rules: [
                {
                    required: true,
                    message: `请选择共享属性`,
                },
            ],
        },
    },
    {
        label: __('共享条件'),
        key: 'shared_condition',
        type: SearchType.Input,
        itemProps: {
            maxLength: 128,
        },
        formItemProps: {
            rules: [
                {
                    required: true,
                    message: `输入不能为空`,
                },
                {
                    validator:
                        keyboardInputValidator(
                            '仅支持中英文、数字及键盘上的特殊符号',
                        ),
                },
            ],
        },
    },
    {
        label: __('开放属性'),
        key: 'open_type',
        type: SearchType.Radio,
        itemProps: {
            options: openTypeList.map((item) => {
                return {
                    value: item.key,
                    label: item.label,
                }
            }),
        },
        formItemProps: {
            rules: [
                {
                    required: true,
                    message: `请选择开放属性`,
                },
            ],
        },
    },
    {
        label: __('开放条件'),
        key: 'open_condition',
        type: SearchType.Input,
        itemProps: {
            maxLength: 128,
        },
        formItemProps: {
            rules: [
                {
                    validator:
                        keyboardInputValidator(
                            '仅支持中英文、数字及键盘上的特殊符号',
                        ),
                },
            ],
        },
    },
]

export const infoItemsLabelTips = [
    { key: 'open_type', tips: '该资源是否对社会公众开放' },
    { key: 'shared_condition', tips: '请输入该目录向其他政务部门共享的情况' },
    { key: 'shared_type', tips: '请输入该目录向其他政务部门共享的情况' },
]

export const InfoItemsDetail: any[] = [
    {
        label: __('字段名称'),
        value: '',
        key: 'business_name',
        span: 24,
    },
    {
        label: __('信息项名称'),
        value: '',
        key: 'technical_name',
        span: 24,
    },
    {
        label: __('数据类型'),
        value: '',
        key: 'data_type',
        span: 24,
        options: typeOptoins,
    },
    {
        label: __('数据长度'),
        value: '',
        key: 'data_length',
        span: 24,
    },
    // {
    //     label: __('数据值域'),
    //     value: '',
    //     key: 'ranges',
    //     span: 24,
    // },
    {
        label: __('涉密属性'),
        value: '',
        key: 'classified_flag',
        span: 24,
        options: classifiedOptoins,
    },
    {
        label: __('敏感属性'),
        value: '',
        key: 'sensitive_flag',
        span: 24,
        options: sensitiveOptions,
    },
    {
        label: __('共享属性'),
        value: '',
        key: 'shared_type',
        span: 24,
        options: shareTypeList,
    },
    // {
    //     label: __('共享条件'),
    //     value: '',
    //     key: 'shared_condition',
    //     span: 24,
    // },
    {
        label: __('开放属性'),
        value: '',
        key: 'open_type',
        span: 24,
        options: openTypeList,
    },
    // {
    //     label: __('开放条件'),
    //     value: '',
    //     key: 'open_condition',
    //     span: 24,
    // },
]

export enum DataServiceType {
    // 资源目录
    DirContent = 'dir_content',

    // 服务超市
    DataAssets = 'data-assets',
}

export const auditStateList = [
    {
        value: 1,
        label: __('审核中'),
        color: 'rgba(255, 169, 0, 1)',
        bgColor: 'rgba(250,172,20,0.06)',
    },
    {
        value: 2,
        label: __('通过'),
        color: 'rgba(82, 196, 27, 1)',
        bgColor: 'rgba(76, 175, 81, 0.06)',
    },
    {
        value: 3,
        label: __('驳回'),
        color: 'rgba(230, 0, 18, 1)',
        bgColor: 'rgba(244, 67, 54, 0.06)',
    },
]

export const flowTypeList = [
    { value: 1, label: __('上线') },
    { value: 2, label: __('变更') },
    { value: 3, label: __('下线') },
    { value: 4, label: __('发布') },
]

// & < > 解码
export const htmlDecodeByRegExp = (str: string) => {
    const arrEntities = { lt: '<', gt: '>', nbsp: ' ', amp: '&', quot: '"' }
    return str.replace(/&(lt|gt|nbsp|amp|quot);/gi, (all, t) => {
        return arrEntities[t]
    })
}

export const menus = [
    { key: 'name', label: __('按资源名称排序') },
    { key: 'publish_at', label: __('按发布时间排序') },
]
export const editedMenus = [
    { key: 'name', label: __('按目录名称排序') },
    { key: 'updated_at', label: __('按更新时间排序') },
]

export const defaultMenu = {
    key: 'publish_at',
    sort: SortDirection.DESC,
}
export const editedDefaultMenu = {
    key: 'updated_at',
    sort: SortDirection.DESC,
}
export enum ResourceType {
    DataView = 1,
    Api = 2,
    File = 3,
}

export const resourceTypeList = [
    { label: __('库表'), value: ResourceType.DataView },
    { label: __('接口'), value: ResourceType.Api },
    { label: __('文件'), value: ResourceType.File },
]

export const lightweightSearchData: IformItem[] = [
    {
        label: __('资源类型'),
        key: 'resource_type',
        options: resourceTypeList,
        type: ST.Radio,
    },
    {
        label: __('发布时间'),
        key: 'publish_at',
        type: ST.RangePicker,
        options: [],
    },
]
export const columnInfoSearchData: any[] = [
    {
        label: __('共享属性'),
        key: 'shared_type',
        options: [{ value: '', label: __('不限') }, ...shareTypeList],
        type: ST.Radio,
        initLabel: '不予共享',
    },
]
// 资源列表类型
export enum TableResourcesListType {
    // 资源列表
    ResourcesList = 'resources_list',
    // 资源负面清单
    ResourcesBackList = 'resources_back_list',
    // 资源可靠性评价
    ResourceEvaluation = 'resource_evaluation',
    // 本部门数据资源目录
    DepartmentResourceDir = 'department_resource_dir',
}
export enum EditResourcesType {
    AllResources = 'AllResources',
    Unedited = 'unedited',
    Edited = 'edited',
}
export const resourcesTypeLabelMap = {
    [TableResourcesListType.ResourcesList]: {
        [EditResourcesType.AllResources]: __('所有数据资源目录'),
        [EditResourcesType.Edited]: __('本部门数据资源目录'),
    },
    [TableResourcesListType.ResourcesBackList]: {
        [EditResourcesType.AllResources]: __('所有负面清单'),
        [EditResourcesType.Edited]: __('本部门负面清单'),
    },
    [TableResourcesListType.ResourceEvaluation]: {
        [EditResourcesType.AllResources]: __('所有可信度评估'),
        [EditResourcesType.Edited]: __('本部门可信度评估'),
    },
    [TableResourcesListType.DepartmentResourceDir]: {
        [EditResourcesType.AllResources]: __('所有数据资源目录'),
        [EditResourcesType.Edited]: __('本部门数据资源目录'),
    },
}

export const tabItems = [
    {
        label: __('所有数据资源目录'),
        title: __('所有数据资源目录'),
        key: EditResourcesType.AllResources,
        children: '',
    },
    // {
    //     label: __('未编目数据资源'),
    //     title: __('未编目数据资源'),
    //     key: EditResourcesType.Unedited,
    //     children: '',
    // },
    {
        label: __('本部门数据资源目录'),
        title: __('本部门数据资源目录'),
        key: EditResourcesType.Edited,
        children: '',
    },
]
// 应用场景分类
export enum UseScene {
    GovService = 1,
    PublicService = 2,
    Supervise = 3,
    Other = 4,
}

export const UseSceneList = [
    {
        label: __('政务服务'),
        value: UseScene.GovService,
    },
    {
        label: __('公共服务'),
        value: UseScene.PublicService,
    },
    {
        label: __('监管'),
        value: UseScene.Supervise,
    },
    {
        label: __('其他'),
        value: UseScene.Other,
    },
]

// 数据分类
export enum DataClassification {
    General = 1,
    Important = 2,
    Kernel = 3,
    Secret = 4,
}

export const DataClassificationList = [
    {
        label: __('一般数据'),
        value: DataClassification.General,
    },
    {
        label: __('重要数据'),
        value: DataClassification.Important,
    },
    {
        label: __('核心数据'),
        value: DataClassification.Kernel,
    },
    {
        label: __('涉密数据'),
        value: DataClassification.Secret,
    },
]

export enum YesOrNo {
    Yes = 1,
    No = 0,
}
export const YesOrNoList = [
    {
        label: __('是'),
        value: YesOrNo.Yes,
    },
    {
        label: __('否'),
        value: YesOrNo.No,
    },
]
export const BoolYesOrNoList = [
    {
        label: __('是'),
        value: true,
    },
    {
        label: __('否'),
        value: false,
    },
]
export const needBatchField = {
    classified_flag: {
        value: null,
        status: false,
    },
    open_type: {
        value: null,
        status: false,
    },
    sensitive_flag: {
        value: null,
        status: false,
    },
    shared_type: {
        value: null,
        status: false,
    },
}
export const StandardKeys = [
    'name',
    'data_range',
    'data_type',
    'data_accuracy',
    'data_length',
    'name_en',
    'formulate_basis',
    'value_range',
    'value_range_type',
]

// 字段表格假数据
export const fieldList = [
    {
        id: '8605b207-1859-47ac-b772-4388f8744900',
        technical_name: 'create_time',
        business_name: '创建时间',
        status: 'new',
        primary_key: false,
        data_type: 'bigint',
        data_length: 19,
        data_accuracy: 0,
        business_timestamp: false,
        standard_code: '',
        code_table_id: '',
    },
    {
        id: '18901e45-bee3-48d1-989e-8ae1673950a1',
        technical_name: 'en_code',
        business_name: '三位字母代码',
        status: 'new',
        primary_key: false,
        data_type: 'varchar',
        data_length: 10,
        data_accuracy: 0,
        standard_code: '',
        code_table_id: '',
    },
    {
        id: '3e4eaa6d-f572-4e2e-8ba8-239a6c5899bd',
        technical_name: 'en_full_name',
        business_name: '英文全称',
        status: 'new',
        primary_key: false,
        data_type: 'varchar',
        data_length: 255,
        data_accuracy: 0,
        business_timestamp: false,
        standard_code: '',
        code_table_id: '',
        classfity_type: null,
    },
]

export const reportAnchor = [
    {
        modKey: 'catalog',
        title: __('上报目录信息'),
    },
    {
        modKey: 'resource',
        title: __('上报资源信息'),
    },
    {
        modKey: 'info',
        title: __('上报信息项信息'),
    },
]
export const DataDomainList = [
    { label: __('1-新冠疫苗'), value: 1 },
    { label: __('2-科技创新'), value: 2 },
    { label: __('3-商贸流通'), value: 3 },
    { label: __('4-社会救助'), value: 4 },
    { label: __('5-城建住房'), value: 5 },
    { label: __('6-教育文化'), value: 6 },
    { label: __('7-工业农业'), value: 7 },
    { label: __('8-机构团体'), value: 8 },
    { label: __('9-地理空间'), value: 9 },
    { label: __('10-资源能源'), value: 10 },
    { label: __('11-市场监管'), value: 11 },
    { label: __('12-生活服务'), value: 12 },
    { label: __('13-生态环境'), value: 13 },
    { label: __('14-交通环境'), value: 14 },
    { label: __('15-安全生产'), value: 15 },
    { label: __('16-社保就业'), value: 16 },
    { label: __('17-医疗卫生'), value: 17 },
    { label: __('18-信用服务'), value: 18 },
    { label: __('19-公共安全'), value: 19 },
    { label: __('20-财税金融'), value: 20 },
    { label: __('21-气象服务'), value: 21 },
    { label: __('22-法律服务'), value: 22 },
    { label: __('23-疫情防控'), value: 23 },
    { label: __('24-普惠金融'), value: 24 },
    { label: __('25-营商环境'), value: 25 },
    { label: __('26-黄河流域'), value: 26 },
    { label: __('27-其它'), value: 27 },
]
export enum NumberEnum {
    One = 1,
    Two = 2,
    Thr = 3,
    Fou = 4,
    Fiv = 5,
    Six = 6,
    Sev = 7,
    Eig = 8,
}
export const DataLevelList = [
    { label: __('国家级'), value: NumberEnum.One },
    { label: __('省级'), value: NumberEnum.Two },
    { label: __('市级'), value: NumberEnum.Thr },
    { label: __('县（区）级'), value: NumberEnum.Fou },
]
export const DataProvideChannelList = [
    { label: __('政务外网'), value: NumberEnum.One },
    { label: __('互联网'), value: NumberEnum.Two },
    { label: __('部门专网'), value: NumberEnum.Thr },
]
export const DepartmentCodeList = [
    { value: 2, label: __('外交部') },
    { value: 4, label: __('发展改革委') },
    { value: 5, label: __('教育部') },
    { value: 6, label: __('科技部') },
    { value: 7, label: __('工业和信息化部') },
    { value: 8, label: __('国家民委') },
    { value: 9, label: __('公安部') },
    { value: 10, label: __('安全部') },
    { value: 11, label: __('民政部') },
    { value: 12, label: __('司法部') },
    { value: 13, label: __('财政部') },
    { value: 14, label: __('人力资源社会保障部') },
    { value: 15, label: __('自然资源部') },
    { value: 16, label: __('生态环境部') },
    { value: 17, label: __('住房城乡建设部') },
    { value: 18, label: __('交通运输部') },
    { value: 19, label: __('水利部') },
    { value: 20, label: __('农业农村部') },
    { value: 21, label: __('商务部') },
    { value: 22, label: __('文化和旅游部') },
    { value: 23, label: __('卫生健康委') },
    { value: 24, label: __('退役军人部') },
    { value: 25, label: __('应急部') },
    { value: 26, label: __('人民银行') },
    { value: 27, label: __('审计署') },
    { value: 28, label: __('国资委') },
    { value: 29, label: __('海关总署') },
    { value: 30, label: __('税务总局') },
    { value: 31, label: __('市场监管总局') },
    { value: 32, label: __('广电总局') },
    { value: 33, label: __('体育总局') },
    { value: 34, label: __('统计局') },
    { value: 35, label: __('国际发展合作署') },
    { value: 36, label: __('医保局') },
    { value: 38, label: __('国管局') },
    { value: 39, label: __('新闻出版署') },
    { value: 40, label: __('版权局') },
    { value: 41, label: __('宗教局') },
    { value: 42, label: __('港澳办') },
    { value: 44, label: __('侨办') },
    { value: 45, label: __('台办') },
    { value: 46, label: __('网信办') },
    { value: 47, label: __('新闻办') },
    { value: 54, label: __('气象局') },
    { value: 55, label: __('银保监会') },
    { value: 56, label: __('证监会') },
    { value: 59, label: __('粮食和储备局') },
    { value: 60, label: __('能源局') },
    { value: 61, label: __('国防科工局') },
    { value: 62, label: __('烟草局') },
    { value: 63, label: __('移民局') },
    { value: 64, label: __('林草局') },
    { value: 65, label: __('铁路局') },
    { value: 66, label: __('民航局') },
    { value: 67, label: __('邮政局') },
    { value: 68, label: __('文物局') },
    { value: 69, label: __('中医药局') },
    { value: 70, label: __('煤矿安监局') },
    { value: 71, label: __('外汇局') },
    { value: 72, label: __('药监局') },
    { value: 73, label: __('知识产权局') },
    { value: 75, label: __('档案局') },
    { value: 76, label: __('保密局') },
    { value: 77, label: __('密码局') },
    { value: 79, label: __('中央编办') },
    { value: 80, label: __('人防办') },
    { value: 81, label: __('地方志') },
    { value: 82, label: __('电影局') },
    { value: 99, label: __('其他业务指导部门') },
]
export const DataProcessingList = [
    { value: 'sjjgcd01', label: __('1-原始数据（明细数据）') },
    { value: 'sjjgcd02', label: __('2-脱敏数据') },
    { value: 'sjjgcd03', label: __('3-标签数据') },
    { value: 'sjjgcd04', label: __('4-统计数据') },
    { value: 'sjjgcd05', label: __('5-融合数据') },
    { value: '0', label: __('0-其他') },
]
export const CatalogTagList = [
    { value: 1, label: __('1-住房保障') },
    { value: 2, label: __('2-出境入境') },
    { value: 3, label: __('3-交通出行') },
    { value: 4, label: __('4-户籍办理') },
    { value: 5, label: __('5-社会保障') },
    { value: 6, label: __('6-租房购房') },
    { value: 7, label: __('7-医疗卫生') },
    { value: 8, label: __('8-就业创业') },
    { value: 9, label: __('9-教育科研') },
    { value: 10, label: __('10-婚姻登记') },
    { value: 11, label: __('11-生育收养') },
    { value: 12, label: __('12-职业资格') },
    { value: 13, label: __('13-准营准办') },
    { value: 14, label: __('14-设立变更') },
    { value: 15, label: __('15-年检年审') },
    { value: 16, label: __('16-资质认证') },
    { value: 17, label: __('17-知识产权') },
    { value: 18, label: __('18-财务税务') },
    { value: 19, label: __('19-破产注销') },
    { value: 20, label: __('20-立项审批') },
    { value: 21, label: __('21-法人注销') },
    { value: 22, label: __('22-检验检疫') },
    { value: 23, label: __('23-招标拍卖') },
    { value: 24, label: __('24-投资审批') },
    { value: 25, label: __('25-食品药品') },
    { value: 26, label: __('26-环保绿化') },
    { value: 27, label: __('27-土地房产') },
    { value: 28, label: __('28-交通运输') },
    { value: 29, label: __('29-农林牧渔') },
    { value: 30, label: __('30-水利水务') },
    { value: 31, label: __('31-国土和规划建设') },
    { value: 32, label: __('32-公安消防') },
    { value: 33, label: __('33-一站式企业开办') },
    { value: 34, label: __('34-多证合一') },
    { value: 35, label: __('35-联合奖惩') },
    { value: 36, label: __('36-不动产登记') },
    { value: 37, label: __('37-公共资源交易') },
    { value: 38, label: __('38-互联网+监管') },
    { value: 39, label: __('39-行政许可') },
    { value: 40, label: __('40-行政确认') },
    { value: 41, label: __('41-行政检查') },
    { value: 42, label: __('42-行政奖励') },
    { value: 43, label: __('43-行政征收') },
    { value: 44, label: __('44-行政处罚') },
    { value: 45, label: __('45-行政强制') },
    { value: 46, label: __('46-行政给付') },
    { value: 47, label: __('47-行政裁决') },
    { value: 48, label: __('48-行政征用') },
    { value: 49, label: __('49-电子证照') },
    { value: 50, label: __('50-其他') },
]
export const TransmitModeList = [
    { value: 'ONCE', label: __('一次性') },
    { value: 'PERIOD', label: __('周期性') },
]
export enum ScheduleType {
    None = 1,
    Minute = 2,
    Day = 3,
    Week = 4,
    Month = 5,
}
export const ScheduleTypeList = [
    { value: ScheduleType.None, label: __('一次性') },
    { value: ScheduleType.Minute, label: __('按分钟') },
    { value: ScheduleType.Day, label: __('按天') },
    { value: ScheduleType.Week, label: __('按周') },
    { value: ScheduleType.Month, label: __('按月') },
]
export const ScheduleTypeTips = {
    [ScheduleType.Minute]: {
        first: __('每隔'),
        last: __('分钟，调度一次'),
    },
    [ScheduleType.Day]: {
        first: __('每天，'),
        last: __('调度一次'),
    },
    [ScheduleType.Week]: {
        first: __('每星期'),
        middle: '，',
        last: __('调度一次'),
    },
    [ScheduleType.Month]: {
        first: __('每月第'),
        middle: __('天，'),
        last: __('调度一次'),
    },
}
export const belongSystemClassifyList = [
    { value: 1, label: __('自建自用') },
    { value: 2, label: __('国直（国家部委统一平台）') },
    { value: 3, label: __('省直（省级统一平台）') },
    { value: 4, label: __('市直（市级统一平台）') },
    { value: 5, label: __('县直（县级统一平台）') },
]
export const sensitivityLevelList = [
    { label: __('1级'), value: NumberEnum.One },
    { label: __('2级'), value: NumberEnum.Two },
    { label: __('3级'), value: NumberEnum.Thr },
    { label: __('4级'), value: NumberEnum.Fou },
]
export const DivisionCodeList = [
    { value: 0, label: __('国家通用') },
    { value: 34, label: __('安徽省') },
    { value: 82, label: __('澳门特别行政区') },
    { value: 11, label: __('北京市') },
    { value: 50, label: __('重庆市') },
    { value: 35, label: __('福建省') },
    { value: 62, label: __('甘肃省') },
    { value: 44, label: __('广东省') },
    { value: 45, label: __('广西壮族自治区') },
    { value: 52, label: __('贵州省') },
    { value: 46, label: __('海南省') },
    { value: 13, label: __('河北省') },
    { value: 41, label: __('河南省') },
    { value: 23, label: __('黑龙江省') },
    { value: 42, label: __('湖北省') },
    { value: 43, label: __('湖南省') },
    { value: 22, label: __('吉林省') },
    { value: 32, label: __('江苏省') },
    { value: 36, label: __('江西省') },
    { value: 21, label: __('辽宁省') },
    { value: 15, label: __('内蒙古自治区') },
    { value: 64, label: __('宁夏回族自治区') },
    { value: 63, label: __('青海省') },
    { value: 14, label: __('山西省') },
    { value: 37, label: __('山东省') },
    { value: 31, label: __('上海市') },
    { value: 61, label: __('陕西省') },
    { value: 51, label: __('四川省') },
    { value: 12, label: __('天津市') },
    { value: 83, label: __('台湾省') },
    { value: 54, label: __('西藏自治区') },
    { value: 81, label: __('香港特别行政区') },
    { value: 65, label: __('新疆维吾尔自治区') },
    { value: 66, label: __('新疆生产建设兵团') },
    { value: 53, label: __('云南省') },
    { value: 33, label: __('浙江省') },
]
export const RequestContentTypeList = [
    { label: 'application/json', value: 'application/json' },
    { label: 'application/xml', value: 'application/xml' },
    {
        label: 'application/x-www-form-urlencoded',
        value: 'application/x-www-form-urlencoded',
    },
    { label: 'multipart/form-data', value: 'multipart/form-data' },
    { label: 'text/plain;charset=utf-8', value: 'text/plain;charset=utf-8' },
    { label: 'others', value: 'others' },
]
export const ParameterTypeList = [
    { label: 'integer', value: 'integer' },
    { label: 'number', value: 'number' },
    { label: 'string', value: 'string' },
    { label: 'boolean', value: 'boolean' },
    { label: 'object', value: 'object' },
]
export const requestJson = {
    id: 1,
    name: 'my_name',
    address: 'my_address',
}
export const dataSyncMechanismList = [
    {
        value: 1,
        label: __('增量'),
    },
    {
        value: 2,
        label: __('全量'),
    },
]

// 所属主题-未分类
export const unCategorizedNodeKey = '00000000-0000-0000-0000-000000000001'

export const updateBaseInfoKeys = [
    'name',
    'data_range',
    'time_range',
    'update_cycle',
    'data_classify',
    'shared_condition',
    'shared_mode',
    'open_condition',
    'publish_flag',
    'operation_authorized',
]
export const classifyLabelSensitiveKeyMap = {
    sensitive: 1,
    insensitive: 0,
}
export const classifyLabelClassifiedKeyMap = {
    secret: 1,
    'non-secret': 0,
}
export const classifyLabelShareKeyMap = {
    unconditional_share: ShareTypeEnum.UNCONDITION,
    conditional_share: ShareTypeEnum.CONDITION,
    no_share: ShareTypeEnum.NOSHARE,
}
export enum comprehensionReportStatus {
    not_generated = 1,
    generated = 2,
    generateding = 3,
    refuse = 4,
    done = 5,
}
export const comprehensionReportOptions = [
    { label: __('已生成'), value: comprehensionReportStatus.generated },
    { label: __('未生成'), value: comprehensionReportStatus.not_generated },
    { label: __('理解审核中'), value: comprehensionReportStatus.generateding },
    { label: __('理解未通过'), value: comprehensionReportStatus.refuse },
    { label: __('已完成'), value: comprehensionReportStatus.done },
]
export const getDataClassify = (labelList: any[], fieldLists: any[]) => {
    const list: any = []
    const sensitiveMap = {
        sensitive_flag: {
            1: 'sensitive',
            0: 'insensitive',
        },
        classified_flag: {
            1: 'secret',
            0: 'non-secret',
        },
        shared_type: {
            [ShareTypeEnum.UNCONDITION]: 'unconditional_share',
            [ShareTypeEnum.CONDITION]: 'conditional_share',
            [ShareTypeEnum.NOSHARE]: 'no_share',
        },
    }
    fieldLists.forEach((item) => {
        const attrInfo = {
            sensitive_attri: sensitiveMap.sensitive_flag[item.sensitive_flag],
            secret_attri: sensitiveMap.classified_flag[item.classified_flag],
            share_condition: sensitiveMap.shared_type[item.shared_type],
        }
        labelList.forEach((o) => {
            const labelAttrInfo = {
                sensitive_attri: o.sensitive_attri,
                secret_attri: o.secret_attri,
                share_condition: o.share_condition,
            }
            if (isEqual(attrInfo, labelAttrInfo)) {
                list.push(o)
            }
        })
    })
    const maxItem = list.reduce(
        (max, current) =>
            current.sort_weight > max.sort_weight ? current : max,
        list[0],
    )
    return maxItem?.id || labelList?.[0]?.id
}
