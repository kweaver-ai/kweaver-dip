import { trim, debounce, flatMapDeep } from 'lodash'
import { keyboardReg, nameEnReg, nameReg } from '@/utils'
import __ from './locale'

// 表格宽度
const FORM_WIDTH = 280
// 表头高度
const FORM_HEADER_HEIGHT = 42

// 表字段高度
const FORM_FIELD_HEIGHT = 28

// 分页高度
const FORM_PAGING_HEIGHT = 20

const defaultPorts = {
    groups: {
        leftPorts: {
            markup: [
                {
                    tagName: 'circle',
                    selector: 'portBody',
                },
            ],
            attrs: {
                portBody: {
                    r: 4,
                    strokeWidth: 1,
                    stroke: '#999999',
                    fill: '#999999',
                    magnet: true,
                    zIndex: 10,
                },
            },
            position: 'freePort',
            zIndex: 10,
        },
        rightPorts: {
            markup: [
                {
                    tagName: 'circle',
                    selector: 'portBody',
                },
            ],
            attrs: {
                portBody: {
                    r: 4,
                    strokeWidth: 1,
                    stroke: '#999999',
                    fill: '#999999',
                    magnet: true,
                    zIndex: 10,
                },
            },
            position: 'freePort',
            zIndex: 10,
        },
    },
}

/**
 * 数据敏感级别
 */
enum Sensibility {
    // 不敏感
    Insensitive = 'not_sensitive',
    // 敏感
    Sensitive = 'sensitive',
}

/**
 * 涉密级别
 */
enum SecurityClassification {
    // 涉密
    Confidential = 'confidential',

    // 不涉密
    NotConfidential = 'not_confidential',
}

/**
 * 共享级别
 */
enum SharedAttribute {
    // 无条件共享
    UnconditionalShare = 'share_no_conditions',

    // 有条件共享
    ConditionalShare = 'share_with_conditions',

    // 不予共享
    NotShare = 'not_share',
}

/**
 * 开放级别
 */
enum OpenAttribute {
    // 不向公众开放
    NotOpen = 'not_open',

    // 向公众开放
    Open = 'open',
}
/**
 * 共享方式
 */
enum SharedMode {
    // 共享平台方式
    Platform = 'platform',

    // 邮件方式
    Mail = 'mail',

    // 介质方式
    Medium = 'medium',
}

/**
 * 展开状态
 */
enum ExpandStatus {
    // 展开
    Expand = 'expand',
    // 收起
    Retract = 'retract',
}

enum DataShowSite {
    // 当前页
    CurrentPage = 'current',

    // 上一页
    UpPage = 'up',

    // 下一页
    DownPage = 'down',
}

enum SourceType {
    // 线上
    Online = 'online',

    // 线下
    Offline = 'offline',
}

/**
 * 表数据操作类型
 */
enum OptionType {
    // 无操作
    NoOption = 'noOption',

    // 查看来源Form的详情
    ViewOriginFormDetail = 'originFormDetail',

    // 查看来来源字段的详情
    ViewOriginFieldDetail = 'originFieldDetail',

    // 添加新字段
    CreateTargetNewField = 'targetNewField',

    // 编辑选中字段
    EditTargetField = 'editTargetField',

    // 查看引用的字段
    ViewTargetQuoteField = 'targetQuoteField',

    // 编辑目标表
    EditTargetForm = 'editTargetForm',

    // 查看目标表
    ViewTargetForm = 'viewTargetForm',

    // 编辑标准表字段
    EditStandardField = 'editStandardField',

    // 预览贴原表
    ViewPasteFormInfo = 'ViewPasteFormInfo',

    // 预览贴原表字段
    ViewPasteFieldInfo = 'ViewPasteFieldInfo',

    // 查看目标表字段
    ViewTargetField = 'viewTargetField',
}

/**
 * 删除模式
 */
enum DeleteMode {
    // 复制
    Copy = 1,

    // 删除
    Delete = 2,
}

const StandardKeys = [
    'data_range',
    'data_type',
    'data_accuracy',
    'data_length',
    'name_en',
    'value_range',
    'value_range_type',
]

/**
 * 新建数据模板
 */
const newFieldTemplate = {
    code_table: '',
    data_accuracy: null,
    data_length: null,
    data_type: null,
    encoding_rule: '',
    formulate_basis: null,
    id: '',
    name: '',
    name_en: '',
    ref_id: '',
    standard_id: '',
    standard_status: '',
    value_range: '',
    confidential_attribute: SecurityClassification.NotConfidential,
    field_relationship: '',
    is_current_business_generation: 1,
    is_incremental_field: 0,
    is_primary_key: 0,
    is_required: 0,
    is_standardization_required: 0,
    open_attribute: OpenAttribute.NotOpen,
    sensitive_attribute: Sensibility.Insensitive,
    shared_attribute: SharedAttribute.UnconditionalShare,
    unit: '',
    value_range_type: 'no',
}

/**
 * 敏感选项
 */
const SensibilityOption = [
    {
        label: __('不敏感'),
        value: Sensibility.Insensitive,
    },
    {
        label: __('敏感'),
        value: Sensibility.Sensitive,
    },
]

/**
 * 涉密选项
 */
const SecurityClassificationOption = [
    {
        label: __('非涉密'),
        value: SecurityClassification.NotConfidential,
    },
    {
        label: __('涉密'),
        value: SecurityClassification.Confidential,
    },
]

const enum TaskType {
    // 非任务
    NoTask = 'noTask',
}

/**
 * 共享选项
 */
const SharedAttributeOption = [
    {
        label: __('无条件共享'),
        value: SharedAttribute.UnconditionalShare,
    },
    {
        label: __('有条件共享'),
        value: SharedAttribute.ConditionalShare,
    },
    {
        label: __('不予共享'),
        value: SharedAttribute.NotShare,
    },
]

/**
 * 开放选项
 */
const OpenAttributeOption = [
    {
        label: __('向公众开放'),
        value: OpenAttribute.Open,
    },
    {
        label: __('不向公众开放'),
        value: OpenAttribute.NotOpen,
    },
]
/**
 * 开放选项
 */
const SharedModeOption = [
    {
        label: __('共享平台方式'),
        value: SharedMode.Platform,
    },
    {
        label: __('邮件方式'),
        value: SharedMode.Mail,
    },
    {
        label: __('介质方式'),
        value: SharedMode.Medium,
    },
]

/**
 * 节点模版
 */
const FormNodeTemplate = {
    shape: 'table-node',
    width: FORM_WIDTH,
    // height: 576,
    ports: defaultPorts,
    position: {
        x: 60,
        y: 60,
    },
    data: {
        items: [],
        type: 'origin',
        selectedFiledsId: [],
        expand: ExpandStatus.Expand,
        offset: 0,
        singleSelectedId: '',
        fid: '',
        mid: '',
        keyWord: '',
        switchStatus: false,
    },
    zIndex: 99,
}

/**
 * 数据表节点模版
 */
const LogicViewNodeTemplate = {
    shape: 'logic-view-node',
    width: FORM_WIDTH,
    // height: 576,
    ports: defaultPorts,
    position: {
        x: 60,
        y: 60,
    },
    data: {
        items: [],
        type: 'logic-view',
        selectedFiledsId: [],
        expand: ExpandStatus.Expand,
        offset: 0,
        singleSelectedId: '',
        fid: '',
        mid: '',
        keyWord: '',
        switchStatus: false,
    },
    zIndex: 99,
}
/**
 * 节点模版
 */
const FormTargetNodeTemplate = {
    shape: 'table-target-node',
    width: FORM_WIDTH,
    // height: 696,
    ports: defaultPorts,
    position: {
        x: 60,
        y: 60,
    },
    data: {
        items: [],
        type: 'target',
        selectedFiledsId: [],
        uniqueCount: 0,
        offset: 0,
        singleSelectedUniqueId: 0,
        fid: '',
        mid: '',
        editStatus: false,
        keyWord: '',
        switchStatus: false,
        formInfo: null,
    },
    zIndex: 9999,
}

/**
 * 推荐参数模板
 */
const recommendParamTemplate = {
    table: '',
    table_description: '',
    table_fields: [
        {
            table_field: '',
            table_field_description: '',
            std_ref_file: '',
        },
    ],
}

/**
 * 计算生成桩的位置
 */
const getPortByNode = (
    group: string,
    index,
    type: string,
    expand = ExpandStatus.Expand,
    site: string = '',
    model = 'edit',
) => {
    const position = getPositSite(group, index, expand, model)
    return {
        group,
        label: {},
        args: {
            position,
        },
        zIndex: 10,
    }
}

/**
 * 获取当前页数据
 * @param offset 页码
 * @param datas 数据
 * @param limit 每页的数据
 * @returns
 */
const getCurrentShowData = (offset: number, datas, limit: number) => {
    const currentData = datas.filter(
        (value, index) =>
            index >= offset * limit && index < limit * (offset + 1),
    )
    return currentData
    // if (currentData.length === limit || offset === 0) {
    //     return currentData
    // }
    // return datas.filter(
    //     (value, index) =>
    //         index >= (offset - 1) * limit + currentData.length &&
    //         index < limit * (offset + 1),
    // )
}

/**
 * 获取当前数据的所在位置
 * @param index 当前数据所在下标
 * @param offset 当前展示数据的页码
 * @param limit 每页数据
 * @param allDataLength 所有数据的长度
 * @returns
 */
const getDataShowSite = (index, offset, limit, allDataLength) => {
    // const lastDataRange = (offset - 1) * limit + (allDataLength % limit)
    switch (true) {
        // case Math.ceil(allDataLength / limit) - 1 === offset &&
        //     allDataLength % limit !== 0 &&
        //     index >= (offset - 1) * limit + (allDataLength % limit):
        //     return DataShowSite.CurrentPage
        case Math.ceil((index + 1) / limit) - 1 === offset:
            return DataShowSite.CurrentPage
        case Math.ceil((index + 1) / limit) - 1 > offset:
            return DataShowSite.DownPage
        default:
            return DataShowSite.UpPage
    }
}

/**
 * 获取当前数据在当页的下标
 * @param index 当前的坐标
 * @param offset 页码
 * @param limit 每页数据长度
 * @param allDataLength 总数据长度
 * @returns 数据所在下标
 */
const getDataCurrentPageIndex = (index, offset, limit, allDataLength) => {
    if (offset === 0) {
        return index
    }
    // if (
    //     Math.ceil(allDataLength / limit) - 1 === offset &&
    //     allDataLength % limit !== 0 &&
    //     index >= (offset - 1) * limit + (allDataLength % limit)
    // ) {
    //     return index - ((offset - 1) * limit + (allDataLength % limit))
    // }
    return index - offset * limit
}

/**
 * 名称校验
 * @param rule
 * @param value
 * @returns
 */
const checkNameCorrect = (rule, value) => {
    if (!value.length) {
        return Promise.resolve()
    }
    if (nameReg.test(trim(value))) {
        return Promise.resolve()
    }
    // return Promise.reject(new Error(__('仅支持中英文、数字、下划线及中划线')))
    return Promise.reject(new Error(__('请输入指标名称')))
}

/**
 * 中文名重名校验
 * @param rule
 * @param value
 * @returns
 */
const checkRepeatName = (value, field, data) => {
    if (
        data.find((item) => {
            // 空白业务表
            if (item.uniqueId) {
                return (
                    item.uniqueId !== field.uniqueId &&
                    item.name === trim(value)
                )
            }
            // 数据源到入的业务表
            return item.id !== field.id && item.name === trim(value)
        })
    ) {
        return Promise.reject(new Error(__('该字段中文名称已存在，请重新输入')))
    }
    return Promise.resolve()
}

/**
 * 校验英文名
 */
const checkEnNameCorrect = (rule, value) => {
    if (nameEnReg.test(trim(value))) {
        return Promise.resolve()
    }
    return Promise.reject(new Error(__('仅支持英文、数字、下划线及中划线')))
}

/**
 * 校验数字文本框是否在范围中
 * @param rule 规则
 * @param value 值
 * @param param2 ｛max： 最大值， min 最小值｝
 * @param message 超出范围的错误信息
 * @returns
 */
const checkNumberRanage = (
    rule,
    value,
    {
        max,
        min,
    }: {
        max: number
        min: number
    },
    message,
) => {
    if (value === '') {
        return Promise.resolve()
    }
    if (!Number.isFinite(Number(value))) {
        return Promise.reject(new Error(message))
    }
    if (
        Number(value) >= min &&
        Number(value) <= max &&
        Math.ceil(Number(value)) === Number(value)
    ) {
        return Promise.resolve()
    }
    return Promise.reject(new Error(message))
}

/**
 * 描述，计量单位等校验
 */
const checkNormalInput = (rule, value) => {
    if (!trim(value)) return Promise.resolve()
    if (keyboardReg.test(trim(value))) {
        return Promise.resolve()
    }
    return Promise.reject(
        new Error(__('仅支持中英文、数字、及键盘上的特殊字符')),
    )
}

const enum SelectedStatus {
    // 未选中
    UnChecked = 'unchecked',

    // 半选
    Indeterminate = 'indeterminate',

    // 选中
    Checked = 'checked',
}

const enum OperateType {
    OK = 'ok',
    OKAndNext = 'next',
}

/**
 * 获取搜索字段
 */
const searchFieldData = (data: Array<any>, searchKey: string) => {
    if (searchKey) {
        const searchData = data.filter((item) => {
            return (
                item.name.includes(searchKey) ||
                item.name_en.includes(searchKey)
            )
        })
        return searchData
    }
    return data
}

/**
 * 获取当前源节点和目标节点的数据关系列表
 */
const getOriginDataRelation = (targetData, originData) => {
    return originData
        .filter((origin) => {
            return targetData.find((value) => value.ref_id === origin.id)
        })
        .map((origin) => origin.id)
}

/**
 * 获取Query数据
 */
const getQueryData = (search: string): any => {
    const keyValueData = search
        .replace(/^\?{1}/, '')
        .replace('?', '&')
        .split('&')
    const queryData = keyValueData.reduce((predata, currentData) => {
        const [key, value] = currentData.split('=')
        return {
            ...predata,
            [key]: value,
        }
    }, {})
    return queryData
}

/**
 * 组装query
 */
const combQuery = (queryData) => {
    const queryString = Object.keys(queryData)
        .map((value) => `${value}=${queryData[value]}`)
        .join('&')
    return queryString
}

/**
 * 组装url
 */
const combUrl = (queryData) => {
    const {
        mid,
        defaultModel,
        fid,
        taskStatus,
        redirect,
        flowchart_id,
        business_model_id,
        params,
        backUrl,
        optionModel,
        iid,
        indicatorId,
        dfid,
        isComplete,
        jumpMode,
        ...rest
    } = queryData
    if (flowchart_id && business_model_id) {
        const queryString = combQuery({
            ...rest,
            fid: flowchart_id,
            mid: business_model_id,
        })
        if (params) {
            return `${redirect}?${queryString}&backUrl=${backUrl}?params=${params}`
        }
        return `${redirect}?${queryString}&backUrl=${backUrl}`
    }
    if (params) {
        const queryString = combQuery({
            ...rest,
        })
        return `${redirect}?${queryString}&backUrl=${backUrl}?params=${params}`
    }
    const queryString = combQuery({
        ...rest,
    })

    return `${redirect}?${queryString}&backUrl=${backUrl}`
}

const wheellDebounce = debounce((graph, wheelEvent, collBack) => {
    const showSize = graph.zoom() * 100
    if (showSize <= 20 && wheelEvent.wheelDelta < 0) {
        graph.zoomTo(0.2)
        collBack(20)
        return false
    }
    if (showSize >= 400 && wheelEvent.wheelDelta > 0) {
        collBack(400)
        return false
    }
    collBack(showSize - (showSize % 5))
    return true
}, 500)

/**
 * 扁平化数据
 * @param arr
 * @returns
 */
const flatData = (arr: any): any =>
    flatMapDeep(arr, (item) => [item, ...flatData(item.children || [])])

const UNGROUPED = 'ungrouped'

enum EditFormModel {
    // 图模式
    GraphModel = 'graph',
    // 表模式
    TableModel = 'table',
}

const generateFullPathData = (
    data: any[],
    parentPath: string[],
    field = 'path',
) => {
    data.forEach((item) => {
        // eslint-disable-next-line
        item[field] = [...parentPath, item.id]
        if (item.children) {
            generateFullPathData(item.children, item[field] || [])
        }
    })
}

const findNodeById = (data: any[], id: string) => {
    if (!id) return undefined
    const getData = (tree: any[]) => {
        // eslint-disable-next-line
        for (const node of tree) {
            if (node.id === id) return node
            if (node.children) {
                const res = getData(node.children)
                if (res) return res
            }
        }
        return undefined
    }
    return getData(data)
}

const getYPosition = (site, index, type, model) => {
    if (model === 'edit') {
        if (!site) {
            return FORM_HEADER_HEIGHT + (index + 1) * FORM_FIELD_HEIGHT + 18
        }
        if (site === 'top') {
            return FORM_HEADER_HEIGHT + 20
        }
        // 分页上桩的位置
        return (
            FORM_FIELD_HEIGHT * 11 + FORM_HEADER_HEIGHT + FORM_PAGING_HEIGHT / 2
        )
    }
    if (!site) {
        return FORM_HEADER_HEIGHT + index * FORM_FIELD_HEIGHT + 18
    }
    if (site === 'top') {
        return FORM_HEADER_HEIGHT
    }
    return 334
}

const getPositSite = (position: string, index, expandStatus, model: string) => {
    if (position === 'rightPorts') {
        return {
            x: FORM_WIDTH,
            y:
                expandStatus === ExpandStatus.Expand
                    ? getYPosition(null, index, null, model)
                    : 28,
        }
    }
    return {
        x: 0,
        y:
            expandStatus === ExpandStatus.Expand
                ? getYPosition(null, index, null, model)
                : 28,
    }
}

/**
 * 排序字段
 * @param fields
 * @returns
 */
const sortFields = (fields: any[]) => {
    return fields.sort((a, b) => a.index - b.index)
}

export {
    FormNodeTemplate,
    FormTargetNodeTemplate,
    getPortByNode,
    ExpandStatus,
    getCurrentShowData,
    DataShowSite,
    getDataShowSite,
    getDataCurrentPageIndex,
    OptionType,
    newFieldTemplate,
    recommendParamTemplate,
    checkNameCorrect,
    checkEnNameCorrect,
    checkNumberRanage,
    checkNormalInput,
    Sensibility,
    SecurityClassification,
    SharedAttribute,
    OpenAttribute,
    DeleteMode,
    StandardKeys,
    SelectedStatus,
    SensibilityOption,
    SecurityClassificationOption,
    SharedAttributeOption,
    OpenAttributeOption,
    SharedModeOption,
    searchFieldData,
    getOriginDataRelation,
    getQueryData,
    combQuery,
    combUrl,
    checkRepeatName,
    wheellDebounce,
    flatData,
    OperateType,
    SharedMode,
    FORM_HEADER_HEIGHT,
    FORM_WIDTH,
    FORM_FIELD_HEIGHT,
    FORM_PAGING_HEIGHT,
    UNGROUPED,
    EditFormModel,
    SourceType,
    generateFullPathData,
    findNodeById,
    LogicViewNodeTemplate,
    getPositSite,
    getYPosition,
    sortFields,
}
