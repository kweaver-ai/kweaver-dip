/**
 * @description 工作流程Item
 * @param id string 工作流程ID
 * @param name string 工作流程ID
 * @param description string? 工作流程描述
 * @param status string 工作流程状态，枚举：creating：未发布的状态；released：已发布状态不存在变更；editing: 已发布存在变更
 * @param image string? 工作流程图片base64编码
 * @param created_by string 创建人
 * @param created_at number 创建时间
 * @param updated_by string 更新人
 * @param updated_at number 更新时间
 * @param version_id string? 工作流程版本ID，任务中心使用。如果status是未发布，返回的是未发布的版本ID；如果status是已发布状态不存在变更，返回的是已发布的版本ID；如果status是已发布存在变更，返回的是在编辑状态下的版本ID
 */
export interface IAssemblyLineItem {
    id: string
    name: string
    config_status: 'missingRole' | 'normal'
    description?: string
    status: string
    image?: string
    created_by: string
    created_at: number
    updated_by: string
    updated_at: number
    version_id?: string
}

/**
 * @description 查看工作流程列表Params
 * @param offset number? 当前页数，默认1（>=1），小于1报错
 * @param limit number? 每页数量，默认12
 * @param direction string? 排序方向：默认desc降序，可选asc升序
 * @param keyword string? 关键字模糊查询
 * @param sort string? 排序类型：默认created_at，可选updated_at
 * @param release_state: string 发布状态过滤，枚举：unreleased：未发布；released：已发布
 * @param change_state: string? 变更状态，当release_state为released时有效，枚举。unchanged：已发布未变更；changed：已发布有变更
 */
export interface IAssemblyLineQueryParams {
    offset?: number
    limit?: number
    direction?: string
    keyword?: string
    sort?: string
    release_state: string
    change_state?: string
}

/**
 * @description 查看工作流程列表Model
 * @param entries IFlowchartItem[] 流程图列表
 * @param total_count number 数量
 * @param released_total_count number 发布工作流程的总数量，不受筛选条件影响
 * @param unreleased_total_count number 未发布工作流程的总数量，不受筛选条件影响
 */
export interface IAssemblyLineModel {
    entries: IAssemblyLineItem[]
    total_count: number
    released_total_count: number
    unreleased_total_count: number
}

/**
 * @description 预创建/编辑工作流程Params
 * @param name string 工作流程名称
 * @param description string? 工作流程描述
 */
export interface IAssemblyLineEditParams {
    name: string
    description?: string
    desc?: string
    id?: string
}

/**
 * @description 获取工作流程内容Model
 * @param id string 工作流程ID
 * @param content string 工作流程的内容，json形式
 */
export interface IAssemblyLineGetContentModel {
    id: string
    content: string
}

/**
 * @description 保存工作流程内容Model
 * @param content string 工作流程的内容，json形式
 * @param image string? 图片数据，base64编码
 * @param type string 保存类型，枚举：final：最终保存；temp：临时保存
 */
export interface IAssemblyLineSaveContentModel {
    content: string
    image?: string
    type: string
}

/**
 * @description 获取角色列表Model
 * @param entries IAssemblyLineRoleItem[] 列表
 * @param total_count number 总数量
 */
export interface IAssemblyLineGetRolesModel {
    entries: IAssemblyLineRoleItem[]
    total_count: number
}

/**
 * @description 角色Item
 * @param id string 角色ID
 * @param name string 角色名称
 * @param color string 颜色
 */
export interface IAssemblyLineRoleItem {
    id: string
    name: string
    color: string
}
