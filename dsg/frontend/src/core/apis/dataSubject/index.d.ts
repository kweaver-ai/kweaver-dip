interface ISearchCommonParms {
    // 当前页码，默认1，大于等于1
    offset?: number

    // 每页条数，默认10，大于等于1
    limit?: number

    // 排序类型，默认按created_at排序，可选updated_at
    sort?: string

    // 排序方向，默认desc降序，可选asc升序
    direction?: string
}

interface IDataListTemplate<T> {
    entries: Array<T>
    id: string
    name: string
    limit: number
    offset: number
    total_count: number
}

/**
 * 获取业务域定义列表
 */
export interface SubjectDomainParams extends ISearchCommonParms {
    // 是否获取全部层级对象
    is_all: boolean

    // 关键字查询
    keyword: string

    // 父对象ID
    parent_id: string

    // 对象类型
    type: string

    need_count?: boolean

    need_total?: boolean
}

/**
 * 拥有者
 */
type OwnerItem = {
    // 用户ID UUID
    user_id: string

    // 用户名
    user_name: string
}

/**
 * 业务域对象
 */
export type ISubjectDomainItem = {
    // 子对象数量
    child_count: number

    // 描述
    description: string

    // 对象ID
    id: string

    // 对象名称
    name: string

    // 路径ID
    path_id: string

    // 路径名称
    path_name: string
    path?: string
    // 对象类型
    type: string

    // 更新时间
    updated_at: number

    // 子节点
    children?: ISubjectDomainItem[]

    // 拥有者
    owners?: OwnerItem
    // 部门路径
    department_name_path?: string
    // 信息系统
    business_system_name?: string[]

    // 指标总数
    indicator_count?: number

    // 接口总数
    interface_count?: number

    // 库表总数
    logic_view_count?: number
}

export interface ICheckGlossary {
    name: string
    parent_id?: string
    id?: string
}

export interface ICategories {
    name: string
    parent_id: string
    type: string
    owners?: string[]
    description?: string
}

export interface ICategory {
    name: string
    id?: string
    owners?: string[]
    type: string
    description?: string
}

export interface StandardInfo {
    data_type: string
    id: string
    name: string
    name_en: string
    is_field_standard?: boolean
    label_id?: string
    label_name?: string
    label_icon?: string
    label_path?: string
}
export interface LoginEntityAttribute {
    id: string
    snowflake_id?: string
    name: string
    path?: string
    unique?: boolean
    standard_info?: StandardInfo
    field_name?: string
    field_id?: string
    form_name?: string
    standard_id?: string
    field_standard_info?: Partial<StandardInfo>
    label_id?: string
    label_name?: string
    label_icon?: string
    label_path?: string
}

export interface LoginEntity {
    id: string
    name: string
    snowflake_id?: string
    attributes: LoginEntityAttribute[]
}

export interface RefInfo {
    business_domain_id: string
    business_domain_name: string
    id: string
    name: string
    subject_domain_id: string
    subject_domain_name: string
}

export interface IUpdateFormRelatedAttribute {
    form_id: string
    form_relevance_objects: {
        object_id: string
        logical_entity: {
            id: string
            attributes: { id: string; field_id: string }[]
        }[]
    }[]
}

export interface IGetFormRelatedAttribute {
    form_id: string
    subject_infos: {
        id: string
        name: string
        type: string
        logical_entity: LoginEntity[]
    }[]
}

export interface IAttributeWithLabel {
    id: string
    name: string
    path_id: string
    path_name: string
    label_id: string
    label_name: string
    label_icon: string
    ls_recommend: boolean
    label_path: string
}

/**
 * 查询分类分级统计信息请求参数
 * id空open_hierarchy关：查询顶层分类统计 不带分级
 * id空open_hierarchy开：查询顶层分类统计带分级
 * id不为空open_hierarchy关：查询某分组分类详情，不带分级
 * id不为空open_hierarchy开：查询某分组分类详情，带分级
 */
export interface IClassification {
    /** 主题对象ID,  为空返回所有L1数据 */
    id?: string
    /** 返回格式，数组 list 还是 树 tree */
    display?: 'list' | 'tree'
    /** 是否打开分级功能 */
    open_hierarchy?: boolean
    /** 库表的ID，传了代表是某个表的字段分业务 */
    form_view_id?: string
    /** 页码 */
    offset?: number
    /** 每页大小 */
    limit?: number
    /** 排序 */
    sort?: string
}

export interface IHierarchy {
    id: string
    color: string
    name: string
    count: number
}

export interface IFieldProperty {
    id: string
    name: string
    path_id: string
    path: string
}

/** 分类分级数据 */
export interface IClassificationData {
    id: string
    name: string
    type: string
    parent_id: string
    classified_num: number
    hierarchy_info: IHierarchy[]
    child: IClassificationData[]
}

export interface IClassificationField {
    id?: string
    business_name: string
    technical_name: string
    data_type: string
    is_primary: boolean
    subject_id: string
    hierarchy_tag: IHierarchy
    property: IFieldProperty
}

/** 分类分级库表字段信息 */
export interface IClassificationFieldData {
    form_view_id: string
    business_name: string
    technical_name: string
    fields: IClassificationField[]
}

/** 分级统计信息 */
export interface IClassificationStatsData {
    total: number
    hierarchy_tag: IHierarchy[]
}

export interface IGetBusinessRecListQuery {
    // 业务表描述
    table_desc?: string
    // 业务表ID
    table_id?: string
    // 业务表名称
    table_name?: string
    fields: {
        // 字段描述
        field_desc?: string
        // 字段ID
        field_id: string
        // 字段名称
        field_name: string
        // 标准ID
        standard_id?: string
    }[]
    subjects: {
        // 主题域层级信息
        path?: string
        // 属性ID
        subject_id: string
        // 属性名称
        subject_name: string
    }[]
}

export interface IBusinessRecItems {
    rec: {
        // 字段ID
        field_id: string
        // 字段名称
        field_name: string
        // 大模型生成的推荐理由，当前版本都是空
        reason?: string
        // 召回+排序阶段返回的检索得分
        score?: string
        // 逻辑实体属性ID
        subject_id: string
        // 逻辑实体属性名称
        subject_name: string
    }[]
    // 业务标准表名称
    table_name: string
}
