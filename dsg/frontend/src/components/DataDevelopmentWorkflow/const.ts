import __ from './locale'
import { SortDirection, SortType, TaskType } from '@/core'

/**
 * 排序菜单
 */
const menus = [
    { key: SortType.NAME, label: __('按名称排序') },
    { key: SortType.CREATED, label: __('按创建时间排序') },
    { key: SortType.UPDATED, label: __('按更新时间排序') },
]

/**
 * 默认排序表单
 */
const defaultMenu = {
    key: SortType.UPDATED,
    sort: SortDirection.DESC,
}

/**
 * 工作流状态
 */
enum WorkflowState {
    // 启用
    START = 'true',
    // 禁止
    BAN = 'false',
}

/**
 * 工作流状态信息
 */
const workflowStateInfo = {
    [WorkflowState.START]: {
        text: __('已启用'),
        color: 'rgba(18, 110, 227, 0.85)',
    },
    [WorkflowState.BAN]: {
        text: __('已禁用'),
        color: 'rgba(0, 0, 0, 0.25)',
    },
}

/**
 * 工作流状态下拉选项集
 */
const stateList = [
    { value: '', label: __('全部') },
    {
        value: WorkflowState.START,
        label: workflowStateInfo[WorkflowState.START].text,
    },
    {
        value: WorkflowState.BAN,
        label: workflowStateInfo[WorkflowState.BAN].text,
    },
]

/**
 * 工作流相关操作
 */
enum OperateType {
    // 预览
    PREVIEW = 'preview',
    // 编辑
    EDIT = 'edit',
    // 状态切换
    CHANGED = 'changed',
    // 时间计划
    TIMEPLAN = 'timePlan',
    // 日志
    LOGS = 'logs',
    // 新建
    CREATE = 'create',
    // 详细信息
    DETAIL = 'detail',
    // 删除
    DELETE = 'delete',
    // 执行
    EXECUTE = 'execute',
}
// (任务)相关场景操作集
const totalOperates = Object.values(OperateType)
const products = [{ operate: totalOperates, task: TaskType.DATACOLLECTING }]

/**
 * 日志排序菜单
 */
const logsMenus = [{ key: 'start_time', label: __('按开始时间') }]

/**
 * 日志默认排序表单
 */
const defaultLogsMenu = {
    key: 'start_time',
    sort: SortDirection.DESC,
}

/**
 * 日志执行状态
 */
enum ExecuteState {
    // 成功
    SUCCESS = 'SUCCESS',
    // 失败
    FAIL = 'FAILURE',
    // 进行中
    UNDERWAY = 'RUNNING_EXECUTION',
}

/**
 * 日志状态信息
 */
const executeStateInfo = {
    [ExecuteState.SUCCESS]: {
        text: __('成功'),
        color: '#52C41A',
    },
    [ExecuteState.FAIL]: {
        text: __('失败'),
        color: '#F5222D',
    },
    [ExecuteState.UNDERWAY]: {
        text: __('进行中'),
        color: '#FFAA00',
    },
}

/**
 * 日志状态下拉选项集
 */
const executeStateList = [
    { value: '', label: __('全部') },
    {
        value: ExecuteState.SUCCESS,
        label: executeStateInfo[ExecuteState.SUCCESS].text,
    },
    {
        value: ExecuteState.FAIL,
        label: executeStateInfo[ExecuteState.FAIL].text,
    },
    {
        value: ExecuteState.UNDERWAY,
        label: executeStateInfo[ExecuteState.UNDERWAY].text,
    },
]

/**
 * 日志执行方式
 */
enum ExecuteWay {
    // 手动
    MANUAL = 'false',
    // 自动
    AUTO = 'true',
}

/**
 * 日志执行方式信息
 */
const executeWayInfo = {
    [ExecuteWay.MANUAL]: {
        text: __('手动执行'),
    },
    [ExecuteWay.AUTO]: {
        text: __('工作流执行'),
    },
}

/**
 * 日志执行方式下拉选项集
 */
const executeWayList = [
    { value: '', label: __('全部') },
    {
        value: ExecuteWay.MANUAL,
        label: executeWayInfo[ExecuteWay.MANUAL].text,
    },
    {
        value: ExecuteWay.AUTO,
        label: executeWayInfo[ExecuteWay.AUTO].text,
    },
]

/**
 * 内容分类
 * @CANVAS 画布
 * @LOGS 日志
 */
enum TabKey {
    CANVAS = 'canvas',
    LOGS = 'logs',
}

/**
 * 保存类型
 * @PUBLISH 发布/更新
 * @UPDATE 更新
 */
enum SaveType {
    PUBLISH = 'publish',
    UPDATE = 'update',
}

/**
 * 画布模块分类
 */
enum ModelType {
    // 同步
    SYNC = 'collecting',
    // 加工
    PROC = 'processing',
}

/**
 * 模块分类信息
 */
const modelTypeInfo = {
    [ModelType.SYNC]: {
        text: __('数据同步'),
        color: '#3184FE',
    },
    [ModelType.PROC]: {
        text: __('数据加工'),
        color: '#67D4C8',
    },
}

/**
 * 默认连接桩配置
 */
const deafultPorts = {
    groups: {
        left: {
            position: 'left',
            attrs: {
                circle: {
                    r: 5,
                    magnet: true,
                    stroke: '#126EE3',
                    strokeWidth: 1,
                    fill: '#fff',
                    style: {
                        visibility: 'hidden',
                    },
                },
            },
        },
        right: {
            position: 'right',
            attrs: {
                circle: {
                    r: 5,
                    magnet: true,
                    stroke: '#126EE3',
                    strokeWidth: 1,
                    fill: '#fff',
                    style: {
                        visibility: 'hidden',
                    },
                },
            },
        },
    },
    items: [
        {
            group: 'left',
        },
        {
            group: 'right',
        },
    ],
}

/**
 * 节点模版
 */
const wfNodeTemplate = {
    shape: 'workflow_node',
    width: 204,
    height: 48,
    position: {
        x: 60,
        y: 60,
    },
    data: {
        name: '',
        model_id: '',
        pre_node_id: [],
        model_type: ModelType.SYNC,
    },
    zIndex: 99,
}

const defaultLogsParams = {
    // 当前页码，默认1，大于等于1
    offset: 1,

    // 每页条数，默认10，大于等于1
    limit: 10,

    // 排序类型，默认按start_time排序，可选end_time
    sort: 'start_time',

    // 排序方向，默认desc降序，可选asc升序
    direction: SortDirection.ASC,

    step: 'INSERT',

    // 模型id
    model_uuid: '',
}

export {
    menus,
    defaultMenu,
    WorkflowState,
    workflowStateInfo,
    stateList,
    OperateType,
    totalOperates,
    products,
    ExecuteState,
    executeStateInfo,
    executeStateList,
    ExecuteWay,
    executeWayInfo,
    executeWayList,
    logsMenus,
    defaultLogsMenu,
    TabKey,
    SaveType,
    ModelType,
    modelTypeInfo,
    wfNodeTemplate,
    deafultPorts,
    defaultLogsParams,
}
