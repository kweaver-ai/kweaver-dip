import { IObject } from '../../core/apis/configurationCenter/index'
import { ErrorInfo } from '@/utils'
import {
    keyboardCharactersReg,
    nameReg,
    phoneNumberReg,
    uniformCreditCodeReg,
} from '@/utils/regExp'
import { IformItem, SearchType } from '@/ui/LightweightSearch/const'
import { BusinessDomainLevelTypes } from '@/core'

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
    DATACATALOG = 'data_catalog', // 数据目录
}

export const architectureTypeList: any[] = [
    Architecture.DISTRICT,
    Architecture.ORGANIZATION,
    Architecture.DEPARTMENT,
    Architecture.BSYSTEM,
    Architecture.BMATTERS,
    Architecture.BFORM,
    Architecture.BSYSTEMCONTAINER,
    Architecture.BMATTERSCONTAINER,
    Architecture.COREBUSINESS,
    Architecture.DATACATALOG,
]

export const businessDomainTypeList = [
    BusinessDomainLevelTypes.DomainGrouping,
    BusinessDomainLevelTypes.Domain,
    BusinessDomainLevelTypes.Process,
]
export enum FilterTreeNode {
    ALL = 'all_node',
    MNode = 'management_node',
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

export interface DataNode extends IObject {
    expand?: boolean
    path_id?: string
    children?: DataNode[]
    isExpand?: boolean
    disabled?: boolean
    disableTip?: string
    level?: number
}

// 每个节点下可包含的节点及属性字段
export const nodeInfo = {
    [Architecture.ALL]: {
        name: '全部',
        allobjects: [Architecture.ORGANIZATION, Architecture.DEPARTMENT],
        subobjects: [Architecture.ORGANIZATION],
        fields: [],
        allowmovesubjects: [],
        allowTypes: '',
    },
    [Architecture.DOMAIN]: {
        name: '域',
        allobjects: [Architecture.ORGANIZATION, Architecture.DEPARTMENT],
        subobjects: [Architecture.DISTRICT, Architecture.ORGANIZATION],
        fields: ['name'],
        allowmovesubjects: [],
        allowTypes: '',
    },
    [Architecture.DISTRICT]: {
        name: '区域',
        allobjects: [
            Architecture.DISTRICT,
            Architecture.ORGANIZATION,
            Architecture.DEPARTMENT,
        ],
        subobjects: [Architecture.ORGANIZATION],
        fields: ['name'],
        allowmovesubjects: [Architecture.DOMAIN, Architecture.DISTRICT],
        allowTypes: 'domain,district',
    },
    [Architecture.ORGANIZATION]: {
        name: '组织',
        allobjects: [Architecture.DEPARTMENT],
        subobjects: [Architecture.DEPARTMENT],
        fields: [
            'name',
            'short_name',
            'uniform_credit_code',
            'contacts',
            'phone_number',
        ],
        allowmovesubjects: [Architecture.DOMAIN, Architecture.DISTRICT],
        allowTypes: '',
    },
    [Architecture.DEPARTMENT]: {
        name: '部门',
        allobjects: [Architecture.DEPARTMENT],
        subobjects: [Architecture.DEPARTMENT],
        fields: [
            'name',
            'department_responsibilities',
            'contacts',
            'phone_number',
            'file_specification',
        ],
        allowmovesubjects: [Architecture.DEPARTMENT, Architecture.ORGANIZATION],
        allowTypes: 'organization,department',
    },
    [Architecture.BMATTERSCONTAINER]: {
        name: '业务事项容器',
        allobjects: [Architecture.BMATTERS],
        subobjects: [Architecture.BMATTERS],
        fields: [],
        allowmovesubjects: [Architecture.DEPARTMENT, Architecture.ORGANIZATION],
        allowTypes: 'domain,district,organization,department',
    },
    [Architecture.BSYSTEMCONTAINER]: {
        name: '信息系统容器',
        allobjects: [
            // Architecture.BSYSTEM
        ],
        subobjects: [
            // Architecture.BSYSTEM
        ],
        fields: [],
        allowmovesubjects: [Architecture.DEPARTMENT, Architecture.ORGANIZATION],
        allowTypes: 'domain,district,organization,department',
    },
    // [Architecture.BMATTERS]: {
    //     name: '业务事项',
    //     allobjects: [Architecture.BMATTERS],
    //     subobjects: [],
    //     fields: ['name', 'document_basis'],
    //     allowmovesubjects: [Architecture.DEPARTMENT, Architecture.ORGANIZATION],
    //     allowTypes: 'organization,department',
    // },
    [Architecture.BSYSTEM]: {
        name: '信息系统',
        allobjects: [
            // Architecture.BSYSTEM
        ],
        subobjects: [],
        fields: ['name'],
        allowmovesubjects: [Architecture.DEPARTMENT, Architecture.ORGANIZATION],
        allowTypes: 'organization,department',
    },
    [Architecture.BFORM]: {
        name: '业务表单',
        subobjects: [],
        fields: ['name'],
        allowmovesubjects: [],
        allowTypes: 'domain,district,organization,department',
    },
    [Architecture.COREBUSINESS]: {
        name: '业务模型',
        allobjects: [Architecture.BMATTERS],
        subobjects: [Architecture.BMATTERS],
        fields: ['name', 'business_matters', 'business_system'],
        allowmovesubjects: [Architecture.DEPARTMENT, Architecture.ORGANIZATION],
        allowTypes: 'organization,department',
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
        label: '名称：',
        key: 'name',
        forbitEdit: true,
    },
    {
        label: '简称：',
        key: 'short_name',
        isEdit: false,
        reg: nameReg,
        message: ErrorInfo.ONLYSUP,
    },
    {
        label: '统一信用代码：',
        key: 'uniform_credit_code',
        isEdit: false,
        reg: uniformCreditCodeReg,
        message: ErrorInfo.UNIFORMCREDITCODE,
        max: 18,
    },
    {
        label: '部门职责：',
        key: 'department_responsibilities',
        isEdit: false,
        reg: keyboardCharactersReg,
        message: ErrorInfo.EXCEPTEMOJI,
    },
    {
        label: '联系人：',
        key: 'contacts',
        isEdit: false,
        reg: nameReg,
        message: ErrorInfo.ONLYSUP,
    },

    {
        label: '联系电话：',
        key: 'phone_number',
        isEdit: false,
        reg: phoneNumberReg,
        message: ErrorInfo.PHONENUMBER,
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
        label: '来源业务事项：',
        key: 'business_matters',
        type: 'tag',
    },
    {
        label: '信息系统：',
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

export const allNodeInfo = {
    id: '',
    type: Architecture.ALL,
    path: '',
    name: '全部',
}
export interface currentPathInfo {
    id: string
    type: string
    name: string
}

export const objList = [
    { label: '所有对象', value: true },
    { label: '子对象', value: false },
]

export const searchData: IformItem[] = [
    {
        label: '对象',
        key: 'is_all',
        options: [
            {
                label: '查看全部对象（包含所有子部门）',
                value: true,
            },
            {
                label: '仅查看当前对象的直属部门',
                value: false,
            },
        ],
        type: SearchType.Radio,
        initLabel: '查看全部对象',
    },
]
