import { IdimensionModel, SortDirection, SortType, TaskType } from '@/core'
import { OperateType } from '@/utils'
import __ from './locale'
import { IformItem, SearchType } from '@/ui/LightweightSearch/const'

/**
 * 理解状态
 * @NotUnderstood 未理解
 * @Understood 已理解
 */
enum UndsStatus {
    NotUnderstood = 1,
    Understood = 2,
    Auditing = 3,
    Reject = 4,
}

/**
 * 理解状态相关信息
 * @color 颜色
 * @text 文案
 */
const undsStatusInfo = {
    [UndsStatus.NotUnderstood]: {
        color: 'rgba(0, 0, 0, 0.85)',
        text: __('未生成'),
        bgColor: 'rgba(0, 0, 0, 0.04)',
    },
    [UndsStatus.Understood]: {
        color: 'rgba(82, 196, 26, 1)',
        text: __('已通过'),
        bgColor: 'rgba(82, 196, 26, 0.04)',
    },
    [UndsStatus.Auditing]: {
        color: 'rgba(18, 110, 227, 1)',
        text: __('审核中'),
        bgColor: 'rgba(18, 110, 227, 0.06)',
    },
    [UndsStatus.Reject]: {
        color: 'rgba(255, 77, 79, 1)',
        text: __('审核未通过'),
        bgColor: 'rgba(255, 77, 79, 0.07)',
    },
}

/**
 * 理解状态下拉选项集
 */
const undsList = [
    { value: 0, label: __('全部') },
    {
        value: UndsStatus.Understood,
        label: undsStatusInfo[UndsStatus.Understood].text,
    },
    {
        value: UndsStatus.NotUnderstood,
        label: undsStatusInfo[UndsStatus.NotUnderstood].text,
    },
    {
        value: UndsStatus.Auditing,
        label: undsStatusInfo[UndsStatus.Auditing].text,
    },
    {
        value: UndsStatus.Reject,
        label: undsStatusInfo[UndsStatus.Reject].text,
    },
]

/**
 * 排序集
 */
const menus = [
    { key: SortType.NAME, label: __('按目录名称排序') },
    { key: SortType.MOUNTSOURCENAME, label: __('按数据表名称排序') },
    { key: SortType.UPDATED, label: __('按更新时间排序') },
]

/**
 * 默认排序
 */
const defaultMenu = {
    key: SortType.UPDATED,
    sort: SortDirection.DESC,
}

/**
 * 预览分类
 * @REPORT 报告
 * @CANVAS 画布
 */
enum TabKey {
    REPORT = 'report',
    CANVAS = 'canvas',
}

/**
 * 内容显示模式
 * @VIEW 查看
 * @EDIT 编辑
 */
enum ViewMode {
    VIEW = 'view',
    EDIT = 'edit',
}

/**
 * 保存类型
 * @PUBLISH 发布/更新
 * @SAVE 保存
 * @BAN 禁止
 */
enum SaveType {
    PUBLISH = 'publish',
    SAVE = 'save',
    BAN = 'ban',
}

/**
 * 异常类型
 * @FieldDeleted 字段被删除
 * @FieldChanged 字段发生变更
 * @CatalogChanged 目录发生变更
 * @CatalogDeleted 目录被删除
 */
enum ExceptionType {
    FieldDeleted = 1,
    FieldChanged = 2,
    CatalogChanged = 3,
    CatalogDeleted = 4,
}

/**
 * 异常提示
 */
const exceptionTypeText = {
    [ExceptionType.FieldDeleted]: __('存在引用的字段被删除，请检查'),
    [ExceptionType.FieldChanged]: __('存在引用的字段发生变更，请检查'),
    [ExceptionType.CatalogChanged]: __('存在引用的目录发生变更，请检查'),
    [ExceptionType.CatalogDeleted]: __('存在引用的目录被删除，请检查'),
}

interface ILinkModel {
    title: string
    key: string
    children?: any[]
}

/**
 * 报告信息分类
 */
const reportClassify = (data?: IdimensionModel) => {
    const res: ILinkModel[] = [
        { title: __('基本信息'), key: 'basicInfo', children: [] },
        { title: __('业务对象'), key: 'businessObj', children: [] },
        { title: __('业务指标'), key: 'businessMetric', children: [] },
        { title: __('业务规则'), key: 'businessRule', children: [] },
        // { title: __('业务信息'), key: 'business', children: [] },
        // { title: __('价值信息'), key: 'value', children: [] },
    ]
    data?.comprehension_dimensions.forEach((d) => {
        if (d.category === 'businessObj') {
            const childArr = (d.children || []).map((o) => ({
                key: o.id,
                title: o.name,
                parent: res[1].key,
            }))
            res[1].children = [...res[1].children!, ...childArr]
        }
        if (d.category === 'businessMetric') {
            const childArr = (d.children || []).map((o) => ({
                key: o.id,
                title: o.name,
                parent: res[1].key,
            }))
            res[2].children = [...res[2].children!, ...childArr]
        }
        if (d.category === 'businessRule') {
            const childArr = (d.children || []).map((o) => ({
                key: o.id,
                title: o.name,
                parent: res[1].key,
            }))
            res[3].children = [...res[3].children!, ...childArr]
        }
    })
    return res
}

// 最外层三结构 对象、指标、规则
const getComprehensionDataArr = (data) => {
    return (data || []).reduce((prev, cur) => {
        return [...prev, ...(cur?.children || [])]
    }, [])
}

/**
 * 报告基本信息字段
 */
const basicInfoList = [
    {
        label: __('资源目录名称'),
        name: 'name',
        type: 'string',
        col: 12,
    },
    {
        label: __('数据表名称'),
        name: 'table_name',
        type: 'string',
        col: 12,
    },
    {
        label: __('所属部门'),
        name: 'department_path',
        type: 'custom',
        col: 12,
    },
    // {
    //     label: __('业务职责'),
    //     name: 'business_duties',
    //     type: 'array',
    //     col: 12,
    // },
    // {
    //     label: __('业务事项'),
    //     name: 'base_works',
    //     type: 'array',
    //     col: 12,
    // },
    {
        label: __('更新周期'),
        name: 'update_cycle',
        type: 'custom',
        col: 12,
    },
    // {
    //     label: __('数据量'),
    //     name: 'total_data',
    //     type: 'number',
    //     col: 12,
    // },
    // {
    //     label: __('基础信息分类'),
    //     name: 'data_kind',
    //     type: 'custom',
    //     col: 12,
    // },
    {
        label: __('表含义'),
        name: 'table_desc',
        type: 'string',
        col: 12,
    },
    {
        label: __('修改人/时间'),
        name: 'updater_name',
        sub_name: 'updated_at',
        type: 'custom',
        col: 12,
    },
    // {
    //     label: __('最终修改时间'),
    //     name: 'updated_at',
    //     type: 'time',
    //     col: 12,
    // },
]

const basicInfoListWithStatus = [
    ...basicInfoList.slice(0, 2),
    {
        label: __('报告状态'),
        name: 'status',
        type: 'custom',
        col: 12,
    },
    ...basicInfoList.slice(2),
]

/**
 * 节点类型
 * @FirstLeNode 一级标题节点
 * @SecondLeNode 二级标题节点
 * @ThirdLeNode 三级标题节点
 * @FourthLeNode 四级标题节点
 * @TimeNode 时间选择节点
 * @SelectInputNode 单选择输入节点
 * @MulSelectInputNode 多选择输入节点
 * @TextAreaNode 文本域节点
 * @MulSelectNode 多选择节点
 */
enum NodeType {
    FirstLeNode = 'firstLe_node',
    SecondLeNode = 'secondLe_node',
    ThirdLeNode = 'thirdLe_node',
    FourthLeNode = 'fourthLe_node',
    TimeNode = 'time_node',
    SelectInputNode = 'selectInput_node',
    MulSelectInputNode = 'mulSelectInput_node',
    TextAreaNode = 'textarea_node',
    MulSelectNode = 'mulSelect_node',
}

/**
 * 节点样式信息
 */
const nodeStyleInfo = {
    [NodeType.FirstLeNode]: {
        width: 180,
        height: 64,
    },
    [NodeType.SecondLeNode]: {
        width: 104,
        height: 54,
    },
    [NodeType.ThirdLeNode]: {
        width: 140,
        height: 32,
    },
    [NodeType.FourthLeNode]: {
        width: 140,
        height: 32,
    },
    [NodeType.TimeNode]: {
        width: 324,
        height: 32,
    },
    [NodeType.SelectInputNode]: {
        width: 732,
        height: 32,
    },
    [NodeType.MulSelectInputNode]: {
        width: 732,
        height: 32,
    },
    [NodeType.TextAreaNode]: {
        width: 464,
        height: 32,
    },
    [NodeType.MulSelectNode]: {
        width: 488,
        height: 32,
    },
}

// (任务)相关场景操作集
const totalOperates = [
    OperateType.PREVIEW,
    OperateType.EDIT,
    OperateType.DELETE,
    'createTask',
    'report',
]
const products = [
    { operate: totalOperates, task: 'none' },
    {
        operate: [
            OperateType.PREVIEW,
            OperateType.EDIT,
            OperateType.DELETE,
            'report',
        ],
        task: TaskType.DATACOMPREHENSION,
    },
]

export {
    UndsStatus,
    undsStatusInfo,
    undsList,
    menus,
    defaultMenu,
    TabKey,
    ViewMode,
    SaveType,
    ExceptionType,
    exceptionTypeText,
    basicInfoList,
    basicInfoListWithStatus,
    NodeType,
    nodeStyleInfo,
    reportClassify,
    getComprehensionDataArr,
    totalOperates,
    products,
}

export type { ILinkModel }

export const searchData: IformItem[] = [
    {
        label: __('理解状态'),
        key: 'status',
        options: undsList.map((item) => {
            return {
                ...item,
                label: item.value === 0 ? __('不限') : item.label,
            }
        }),
        type: SearchType.Radio,
    },
]
