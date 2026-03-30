import { NodeType } from '@/core/consanguinity'
import __ from './locale'
// 节点形状类型
export const NodeShapeTypes = {
    // 数据表
    DATA_TABLE: 'data_table',

    // 指标
    INDICATOR: 'indicator',
}

// 节点展开状态
export enum ExpandStatus {
    // 展开
    EXPAND = 'expand',
    // 折叠
    FOLD = 'fold',
}

// 宽度
export const NODE_WIDTH = 282

// 数据表header高度
export const FORM_NODE_HEADER_HEIGHT = 56

// 库表行高
export const LOGIC_LINE_HEIGHT = 44

// 数据表行高
export const DATA_TABLE_LINE_HEIGHT = 30

// 底部高度
export const BOTTOM_HEIGHT = 4

// 分页高度
export const OFFSET_HEIGHT = 24

// 库表颜色
export const LOGIC_COLOR = '#14CEAA'

// 数据表颜色
export const DATA_TABLE_COLOR = '#AEDBB0'

// 数据表每页限制
export const TABLE_LIMIT = 10
// 选中颜色
export const SELECT_COLOR = '#126EE3'

// 普通线颜色
export const NORMAL_COLOR = '#979797'

// 节点间距
export const NODE_SPACE = 80

// 指标节点宽度
export const INDICATOR_NODE_WIDTH = 280

// 指标节点高度
export const INDICATOR_NODE_HEADER_HEIGHT = 94

// 原子指标节点标题线颜色
export const ATOMIC_INDICATOR_COLOR = '#3A8FF0'

// 指标底部
export const INDICATOR_NODE_CONTENT_HEIGHT = 28

/**
 * 计算数据表的高度
 * @param dataCount 数据量s
 * @returns
 */
export const calculateFormNodeHeight = (
    dataCount: number,
    offset = 0,
    lineHeight = LOGIC_LINE_HEIGHT,
) => {
    if (!dataCount) {
        return 110 + FORM_NODE_HEADER_HEIGHT
    }
    if (dataCount <= 10) {
        return FORM_NODE_HEADER_HEIGHT + dataCount * lineHeight + BOTTOM_HEIGHT
    }
    const needDisplayCount =
        dataCount - 10 * offset > 10 ? 10 : dataCount - 10 * offset
    return (
        FORM_NODE_HEADER_HEIGHT + needDisplayCount * lineHeight + OFFSET_HEIGHT
    )
}

/**
 *  获取当前字段所在第几页
 * @param id id
 * @param fields 字段数据
 * @param limit 每页的数据量
 * @returns offset 第几页
 */
export const getCurrentFieldsOffset = (
    id,
    fields: Array<any>,
    limit: number = 10,
) => {
    if (fields.length < limit) {
        return 1
    }
    const currentDataIndex = fields.findIndex((field) => field.id === id)
    return Math.ceil((currentDataIndex + 1) / limit)
}

/**
 * 获取当前数据
 * @param data 数据
 * @param id 数据id
 * @returns 当前数据
 */
export const getCurrentData = (data: Array<Array<any>>, id: string) => {
    let result

    data.some((subArray) => {
        const found = subArray.find((item) => item.id === id)
        if (found) {
            result = found
            return true // 找到后停止遍历
        }
        return false
    })

    return result
}

/**
 * 获取子节点数据
 * @param data 数据
 * @param id 节点id
 * @returns 子节点数据
 */
export const getChildrenData = (data: Array<Array<any>>, id: string) => {
    const allData = data.flat()

    return allData.filter((item) => item?.parentNodeId?.includes(id))
}

/**
 * 获取当前数据所在页码
 * @param fieldId 字段id
 * @param limit 每页数据量
 * @param offset 页码
 * @param data 数据
 * @returns 当前数据所在页码
 */
export const getDataCurrentPageIndex = (fieldId, limit, offset, data) => {
    const findIndex = data.findIndex((item) => item.id === fieldId)
    const currentPageIndex = Math.floor(findIndex / limit)
    // 数据在当页
    if (currentPageIndex === offset) {
        return findIndex % limit
    }
    // 数据在当前页之前
    if (currentPageIndex < offset) {
        return -1
    }
    // 数据在当前页之后
    return -2
}

// 桩位置
export enum PortSite {
    // 头部
    HEADER = 'header',
    // 页码
    PAGE = 'page',
    // 底部
    BOTTOM = 'bottom',
}

/**
 * 线高亮的显示
 */
export const LineLightStyle = {
    stroke: '#126ee3',
    strokeWidth: 1,
    targetMarker: 'block',
    strokeDasharray: '8',
    style: {
        animation: 'running-line 30s infinite linear',
    },
}

/**
 * 普通线的样式
 */
export const LineNormalStyle = {
    stroke: '#979797',
    strokeWidth: 0.7,
    targetMarker: 'block',
    strokeDasharray: '0',
    style: {
        animation: '',
    },
}

/**
 * 节点名称
 */
export const TableNodeNames = {
    // 数据表
    [NodeType.DATA_TABLE]: __('数据表'),
    // 自定义库表
    [NodeType.CUSTOM_VIEW]: __('自定义库表'),
    // 元数据库表
    [NodeType.FORM_VIEW]: __('元数据库表'),
    // 库表
    [NodeType.LOGIC_VIEW]: __('逻辑实体库表'),
}

/**
 * 计算原子指标节点高度
 * @param height 高度
 * @returns 高度
 */
export const calculateAtomicNodeHeight = (height: number) => {
    return (
        INDICATOR_NODE_HEADER_HEIGHT +
        height +
        INDICATOR_NODE_CONTENT_HEIGHT +
        20
    )
}
