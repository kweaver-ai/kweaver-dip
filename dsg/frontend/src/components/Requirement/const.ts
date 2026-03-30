import { message } from 'antd'
import {
    icReg,
    emailReg,
    phoneNumberReg,
    keyboardCharactersReg,
} from '../../utils/regExp'
import __ from './locale'

import { SortDirection } from '@/core'
import { ErrorInfo, nameReg } from '@/utils'

export const menus = [
    { key: 'name', label: __('按需求名称排序') },
    { key: 'created_at', label: __('按创建时间排序') },
    { key: 'updated_at', label: __('按更新时间排序') },
]

export const defaultMenu = {
    key: 'created_at',
    sort: SortDirection.DESC,
}

export const requireStatus = {
    1: {
        name: '待提交',
        class: 'tobesubmit',
    },
    2: {
        name: '待分析',
        class: 'tobeanalyzed',
    },
    3: {
        name: '分析中',
        class: 'analysising',
    },
    4: {
        name: '分析驳回',
        class: 'reject',
    },
    5: {
        name: '分析待审核',
        class: 'tobereviewed',
    },
    6: {
        name: '分析审核驳回',
        class: 'reject',
    },
    7: {
        name: '需求待确认',
        class: 'tobeconfirm',
    },
    8: {
        name: '需求确认驳回',
        class: 'reject',
    },
    9: {
        name: '数据Owner待审核',
        class: 'tobereviewed',
    },
    10: {
        name: '数据Owner审核中',
        class: 'analysising',
    },
    11: {
        name: '数据Owner审核驳回',
        class: 'reject',
    },
    12: {
        name: '待实施',
        class: 'tobeanalyzed',
    },
    13: {
        name: '实施中',
        class: 'analysising',
    },
    14: {
        name: '待完善',
        class: 'reviewedreject',
    },
    15: {
        name: '实施驳回',
        class: 'reject',
    },
    16: {
        name: '实施待确认',
        class: 'tobeconfirm',
    },
    17: {
        name: '成效待反馈',
        class: 'tobeanalyzed',
    },
    18: {
        name: '反馈待审核',
        class: 'tobereviewed',
    },
    98: {
        name: '已关闭',
        class: 'tobesubmit',
    },
    99: {
        name: '已完成',
        class: 'finished',
    },
}

export const statusList = [
    {
        label: '全部',
        value: 0,
    },
    {
        label: '待提交',
        value: 1,
    },
    {
        label: '待分析',
        value: 2,
    },
    {
        label: '分析中',
        value: 3,
    },
    {
        label: '分析驳回',
        value: 4,
    },
    {
        label: '分析待审核',
        value: 5,
    },
    {
        label: '分核审核驳回',
        value: 6,
    },
    {
        label: '需求待确认',
        value: 7,
    },
    {
        label: '需求确认驳回',
        value: 8,
    },
    {
        label: '数据Owner待审核',
        value: 9,
    },
    {
        label: '数据Owner审核中',
        value: 10,
    },
    {
        label: '数据Owner审核驳回',
        value: 11,
    },
    {
        label: '待实施',
        value: 12,
    },
    {
        label: '已关闭',
        value: 98,
    },
]

export enum CatalogEnum {
    ALL = 1,
    REJECT = 2,
    TOBECONFIRMED = 3,
    WAITINGFORFEEDBACK = 4,
}

export interface ICatalog {
    name: string
    key: CatalogEnum
}
export const catalogs = [
    {
        key: CatalogEnum.ALL,
        name: '全部',
    },
    {
        key: CatalogEnum.REJECT,
        name: '驳回待处理',
    },
    {
        key: CatalogEnum.TOBECONFIRMED,
        name: '需求待确认',
    },
    {
        key: CatalogEnum.WAITINGFORFEEDBACK,
        name: '成效待反馈',
    },
]

export enum NavType {
    DEMAND = 'demand',
    UNIT = 'unit',
    CONFIG = 'config',
    SCENE = 'scene',
}

export enum NavStatus {
    UNFINISH = 'unfinished',
    FINISHED = 'finished',
}

export const defaultNav = [
    {
        key: NavType.DEMAND,
        name: '基本信息',
        status: NavStatus.UNFINISH,
    },
    {
        key: NavType.CONFIG,
        name: '资源配置',
        status: NavStatus.UNFINISH,
    },
    {
        key: NavType.UNIT,
        name: '部门信息',
        status: NavStatus.UNFINISH,
    },
    {
        key: NavType.SCENE,
        name: '需求场景',
        status: NavStatus.FINISHED,
    },
]

export const agreementInfo = [
    {
        title: '分管领导',
        key: 'dept_leader',
        content: [
            {
                label: '姓名',
                name: 'dept_leader_name',
                required: true,
                regExp: keyboardCharactersReg,
                message: ErrorInfo.EXCEPTEMOJI,
            },
            {
                label: '联系方式',
                name: 'dept_leader_phone',
                required: true,
                regExp: phoneNumberReg,
                message: ErrorInfo.PHONENUMBER,
            },
            {
                label: '职务',
                name: 'dept_leader_pos',
                regExp: nameReg,
                message: ErrorInfo.ONLYSUP,
            },
            {
                label: '电子邮箱',
                name: 'dept_leader_email',
                regExp: emailReg,
                message: ErrorInfo.EMAIL,
            },
        ],
    },
    {
        title: '资源管理员',
        key: 'data_mgt_user',
        content: [
            {
                label: '姓名',
                name: 'data_mgt_user_name',
                required: true,
                regExp: keyboardCharactersReg,
                message: ErrorInfo.EXCEPTEMOJI,
            },
            {
                label: '联系方式',
                name: 'data_mgt_user_phone',
                required: true,
                regExp: phoneNumberReg,
                message: ErrorInfo.PHONENUMBER,
            },
            {
                label: '职务',
                name: 'data_mgt_user_pos',
                regExp: nameReg,
                message: ErrorInfo.ONLYSUP,
            },
            {
                label: '电子邮箱',
                name: 'data_mgt_user_email',
                regExp: emailReg,
                message: ErrorInfo.EMAIL,
            },
            {
                label: '身份证',
                name: 'data_mgt_user_ic',
                regExp: icReg,
                message: ErrorInfo.IDCARD,
            },
            {
                label: '传真',
                name: 'data_mgt_user_fax',
                regExp: nameReg,
                message: ErrorInfo.ONLYSUP,
            },
        ],
    },
    {
        title: '运维人员',
        key: 'op_user',
        content: [
            {
                label: '姓名',
                name: 'op_user_name',
                required: true,
                regExp: keyboardCharactersReg,
                message: ErrorInfo.EXCEPTEMOJI,
            },
            {
                label: '联系方式',
                name: 'op_user_phone',
                required: true,
                regExp: phoneNumberReg,
                message: ErrorInfo.PHONENUMBER,
            },
            {
                label: '职务',
                name: 'op_user_pos',
                regExp: nameReg,
                message: ErrorInfo.ONLYSUP,
            },
            {
                label: '电子邮箱',
                name: 'op_user_email',
                regExp: emailReg,
                message: ErrorInfo.EMAIL,
            },
            {
                label: '身份证',
                name: 'op_user_ic',
                regExp: icReg,
                message: ErrorInfo.IDCARD,
            },
            {
                label: '传真',
                name: 'op_user_fax',
                regExp: nameReg,
                message: ErrorInfo.ONLYSUP,
            },
        ],
    },
]

// 承诺书中的字段
export const agreementFields = [
    'dept_leader_name',
    'dept_leader_phone',
    'dept_leader_pos',
    'dept_leader_email',
    'data_mgt_user_name',
    'data_mgt_user_phone',
    'data_mgt_user_pos',
    'data_mgt_user_email',
    'data_mgt_user_ic',
    'data_mgt_user_fax',
    'op_user_name',
    'op_user_phone',
    'op_user_pos',
    'op_user_email',
    'op_user_ic',
    'op_user_fax',
]

// 承诺书中的必填字段
export const agreementRequireFields = [
    'dept_leader_name',
    'dept_leader_phone',
    'data_mgt_user_name',
    'data_mgt_user_phone',
    'op_user_name',
    'op_user_phone',
]

/**
 * 资源来源
 * 0 空白资源
 * 1 资源目录
 */
export enum ResourceSource {
    BLANK = 1,
    SERVICESHOP = 2,
}

export const resourceSourceInfo = {
    [ResourceSource.BLANK]: '空白资源',
    [ResourceSource.SERVICESHOP]: '数据服务超市',
}

/**
 * 资源类型
 * 0 库表
 * 1 接口
 * 2 文件
 */
export enum ResourceType {
    DBTABLE = 1,
    INTERFACE = 2,
    FILE = 3,
}

export const resourceTypeInfo = {
    [ResourceType.DBTABLE]: '库表',
    [ResourceType.INTERFACE]: 'API',
    [ResourceType.FILE]: '文件',
}

export const infoItemsConditions = [
    {
        label: '大于',
        value: '>',
    },
    {
        label: '小于',
        value: '<',
    },
    {
        label: '大于等于',
        value: '>=',
    },
    {
        label: '小于等于',
        value: '<=',
    },
    {
        label: '等于',
        value: '=',
    },
    {
        label: '包含',
        value: 'in',
    },
    {
        label: '模糊匹配',
        value: 'like',
    },
]

// 需求类型
export const demandTypes = [
    {
        label: '自主填报',
        value: '1',
    },
    {
        label: '需求确认',
        value: '2',
    },
    {
        label: '需求完善',
        value: '3',
    },
]

// 应用方向分类
export const appDirections = [
    {
        label: '社会保障',
        value: '1',
    },
    {
        label: '金融信息',
        value: '2',
    },
    {
        label: '信用信息',
        value: '3',
    },
    {
        label: '生态环境',
        value: '4',
    },
]

// 业务场景
export const relateScenes = [
    {
        label: '危房排查',
        value: 1,
    },
    {
        label: '人口普查',
        value: 2,
    },
    {
        label: '一事一办',
        value: 3,
    },
]

// 创建需求信息的必填字段
export const demandRequiredFields = [
    {
        key: 'demand_title',
        message: '输入不能为空',
    },
    {
        key: 'description',
        message: '输入不能为空',
    },
]

// 创建单位信息的必填字段
export const unitRequiredFields = [
    {
        key: 'dept_id',
        message: '请选择申请部门',
    },
    {
        key: 'tech_user_name',
        message: '输入不能为空',
    },
    // {
    //     key: 'tech_user_phone',
    //     message: '输入不能为空',
    // },
]

export const applicationLetterField = [
    {
        key: 'application_letter',
        message: '请上传申请函件',
    },
]

export const dataTimeRange = [
    {
        label: '全部',
        value: 1,
    },
    {
        label: '近三年',
        value: 2,
    },
    {
        label: '近一年',
        value: 3,
    },
    {
        label: '近半年',
        value: 4,
    },
    {
        label: '近三个月',
        value: 5,
    },
]

export const dataSpaceRange = [
    {
        label: '全市',
        value: 1,
    },
    {
        label: '市直',
        value: 2,
    },
    {
        label: '区县',
        value: 3,
    },
]

export const updateCycle = [
    {
        label: '不定时',
        value: 8,
    },
    {
        label: '实时',
        value: 7,
    },
    {
        label: '每日',
        value: 6,
    },
    {
        label: '每周',
        value: 5,
    },
    {
        label: '每月',
        value: 4,
    },
    {
        label: '每季度',
        value: 3,
    },
    {
        label: '每半年',
        value: 2,
    },
    {
        label: '每年',
        value: 1,
    },
    {
        label: '其他',
        value: 9,
    },
]

export const dataTypes = [
    {
        label: '数字型',
        value: 0,
    },
    {
        label: '字符型',
        value: 1,
    },
    {
        label: '日期型',
        value: 2,
    },
    {
        label: '日期时间型',
        value: 3,
    },
    {
        label: '时间戳型',
        value: 4,
    },
    {
        label: '布尔型',
        value: 5,
    },
    {
        label: '二进制',
        value: 6,
    },
]

export enum RequirementFieldType {
    TIME = 'time',
    TAG = 'tag',
    FILE = 'file',
}
export const baseInfoFields = [
    {
        label: '需求名称：',
        value: 'demand_title',
    },
    {
        label: '期望完成日期：',
        value: 'finish_date',
        type: RequirementFieldType.TIME,
    },
    {
        label: '需求描述：',
        value: 'description',
        col: 24,
    },
]

export const unitInfoFields = [
    {
        label: '申请部门：',
        value: 'dept_name',
        col: 24,
    },
    {
        label: '技术对接人姓名：',
        value: 'tech_user_name',
        regExp: keyboardCharactersReg,
        message: ErrorInfo.EXCEPTEMOJI,
    },
    {
        label: '技术对接人联系方式：',
        value: 'tech_user_phone',
        regExp: phoneNumberReg,
        message: ErrorInfo.PHONENUMBER,
    },
    {
        label: '分管领导姓名：',
        value: 'dept_leader_name',
        regExp: keyboardCharactersReg,
        message: ErrorInfo.EXCEPTEMOJI,
    },
    {
        label: '领导联系方式：',
        value: 'dept_leader_phone',
        regExp: phoneNumberReg,
        message: ErrorInfo.PHONENUMBER,
    },
    {
        label: '领导职务：',
        value: 'dept_leader_pos',
        regExp: nameReg,
        message: ErrorInfo.ONLYSUP,
    },
    {
        label: '领导邮箱：',
        value: 'dept_leader_email',
        regExp: emailReg,
        message: ErrorInfo.EMAIL,
    },
    {
        label: '部门联系人姓名：',
        value: 'BD_user_name',
        regExp: keyboardCharactersReg,
        message: ErrorInfo.EXCEPTEMOJI,
    },
    {
        label: '部门联系方式：',
        value: 'BD_user_phone',
        regExp: phoneNumberReg,
        message: ErrorInfo.PHONENUMBER,
    },

    {
        label: '承建商名称：',
        value: 'developer_name',
    },
    {
        label: '统一社会信用代码：',
        value: 'developer_code',
    },
    {
        label: '申请函件：',
        value: 'reference_files',
        col: 24,
        type: RequirementFieldType.FILE,
        typeValue: 1,
    },
]

export const sceneInfoFields = [
    {
        label: '应用方向分类：',
        value: 'app_direction',
    },
    {
        label: '业务应用场景：',
        value: 'rela_scenes',
        type: RequirementFieldType.TAG,
    },
    {
        label: '关联信息系统：',
        value: 'rela_business_system',
    },
    // {
    //     label: '关联业务事项：',
    //     value: 'rela_matters',
    //     type: RequirementFieldType.TAG,
    // },
    // {
    //     label: '业务应用领域：',
    //     value: 'rela_domains',
    //     type: RequirementFieldType.TAG,
    //     col: 24,
    // },
    {
        label: '预期应用价值：',
        value: 'app_value',
        col: 24,
    },
    {
        label: '预期应用成效：',
        value: 'app_effect',
        col: 24,
    },
]

export const requirementDetailsInfo = [
    {
        title: '需求信息',
        key: 1,
        fields: baseInfoFields,
    },
    {
        title: '部门信息',
        key: 2,
        fields: unitInfoFields,
    },
    {
        title: '场景信息',
        key: 3,
        fields: sceneInfoFields,
    },
]

export enum SaveOrSubmit {
    SAVE = 1,
    SUBMIT = 2,
}

export const callUnitList = [
    {
        label: '次/天',
        value: 1,
    },
    {
        label: '次/秒',
        value: 2,
    },
    {
        label: '次/小时',
        value: 3,
    },
]

export const defaultPhoneNumber = '15912345678'

export const enum PageType {
    APPLY = 'apply',
    ANALYSIS = 'analysis',
    AUDIT = 'audit',
}
// 1 待提交 | 2待分析，已提交 | 3 分析中 | 4分析驳回 | 5 分析通过，（平台）待审核 | 6 审核驳回（平台）| 7 分析待确认，（平台）审核通过
// 8 分析确认驳回，待分析 | 9 数源单位(数据Owner)待审核 | 10 数源单位(数据Owner)审核中 | 11 数源单位(数据Owner)审核驳回 | 12 待实施
// 13 实施中 | 14 待完善 | 15实施驳回 | 16 实施待确认 | 17 成效待反馈 | 18 待审核 | 98 已关闭 | 99 已完成
export const enum DemandStatus {
    TOBESUBMIT = 1,
    TOBEANALYZED = 2,
    ANALYZING = 3,
    ANALYSISREJECT = 4,
    ANALYSISPASS = 5,
    AUDITREJECT = 6,
    ANALYSISTOBECONFIRM = 7,
    ANALYSISCONFIRMREJECT = 8,
    OWNERTOBEAUDIT = 9,
    OWNERAUDITING = 10,
    OWNERAUDITREJECT = 11,
}

/**
 * OperateAuthority 需求的操作权限 根据后端返回的操作转换成二进制数据判断
 * @param Yes 有操作权限
 * @param No 无操作权限
 */
export const enum OperateAuthority {
    Yes = '1',
    No = '0',
}

// 确认结果，1驳回，2同意，3关闭需求
export const enum AuditResult {
    Yes = 2,
    No = 1,
    Close = 3,
}

export const ArrayBufferToJson = (data: any) => {
    const decoder = new TextDecoder('utf-8')
    const jsonString = decoder.decode(data)
    return jsonString ? JSON.parse(jsonString) : undefined
}
