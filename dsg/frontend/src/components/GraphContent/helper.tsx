import { debounce, uniqBy } from 'lodash'
import { NodeType } from '@/core/consanguinity'

import { ExpandStatus, FORM_NODE_HEADER_HEIGHT, NodeShapeTypes } from './const'
import { calculateAutomicNodeHeight } from '../IndicatorConsanguinity/const'

/**
 * 滚轮缩放图表
 * @param graph
 * @param wheelEvent
 * @param collBack
 * @returns
 */
export const wheelDebounce = debounce((graph, wheelEvent, collBack) => {
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
 * 默认ports
 */
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
                    r: 1,
                    strokeWidth: 1,
                    stroke: 'transparent',
                    fill: 'transparent',
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
                    r: 1,
                    strokeWidth: 1,
                    stroke: 'transparent',
                    fill: 'transparent',
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
 * 数据表节点模板
 */
export const DataNodeTemplate = {
    shape: NodeShapeTypes.DATA_TABLE,
    width: 280,
    height: 94,
    ports: defaultPorts,
    position: {
        x: 600,
        y: 100,
    },
    data: {
        type: NodeType.DATA_TABLE,
        expand: ExpandStatus.EXPAND,
        offset: 0,
        fields: [],
        id: '',
        label: '',
        parentNodeId: [],
        childrenNodeId: [],
        originData: null,
        keyword: '',
        level: 0,
        selectedFields: [],
        tool: undefined,
        index: 0,
    },
    zIndex: 99,
}

/**
 * 数据表节点模板
 */
export const IndicatorNodeTemplate = {
    shape: NodeShapeTypes.INDICATOR,
    width: 280,
    height: 94,
    ports: defaultPorts,
    position: {
        x: 600,
        y: 100,
    },
    data: {
        type: NodeType.INDICATOR,
        expand: ExpandStatus.EXPAND,
        fields: [],
        id: '',
        label: '',
        parentNodeId: [],
        childrenNodeId: [],
        originData: null,
        level: 0,
        selected: false,
        tool: undefined,
        index: 0,
    },
    zIndex: 99,
}

/**
 * 获取当前页数据
 * @param offset 页码
 * @param datas 数据
 * @param limit 每页的数据
 * @returns
 */
export const getCurrentShowData = (offset: number, datas, limit: number) => {
    const currentData = datas.filter(
        (value, index) =>
            index >= offset * limit && index < limit * (offset + 1),
    )
    return currentData
}

/**
 * 排序所有数据
 * @param data 数据
 * @param IngressId 入度节点id
 * @returns
 */
export const sortAllData = (
    data: Array<any>,
    IngressId: string,
    level: number = 0,
    direction: 'left' | 'right' = 'left',
) => {
    const currentData = data.find((item) => item.id === IngressId)
    if (currentData) {
        const relations =
            direction === 'left'
                ? currentData?.parentNodeId
                : currentData?.childrenNodeId
        if (!relations?.length)
            return [
                {
                    ...currentData,
                    level,
                },
            ]
        const otherData = relations.reduce((pre, item) => {
            return [
                ...pre,
                ...sortAllData(
                    data,
                    item,
                    direction === 'left' ? level - 1 : level + 1,
                    direction,
                ),
            ]
        }, [])
        return uniqBy(
            [
                {
                    ...currentData,
                    level,
                },
                ...otherData,
            ],
            'id',
        )
    }
    return []
}

/**
 * 分组数据
 * @param data 数据
 * @returns
 */
export const groupByLevel = (
    data: Array<any>,
    direction: 'left' | 'right',
): Array<Array<any>> => {
    // 1. 找出最大和最小 level
    const levels = data.map((item) => item.level)
    const maxLevel = Math.max(...levels)
    const minLevel = Math.min(...levels)

    // 2. 计算偏移量，使所有 level 非负
    const offset = Math.abs(Math.min(0, minLevel))

    // 3. 创建二维数组
    const result: Array<Array<any>> = Array.from(
        { length: maxLevel + offset + 1 },
        () => [],
    )

    // 3. 将项目放入对应层级的数组
    data.forEach((item) => {
        const adjustedLevel = item.level + offset
        result[adjustedLevel].push(item)
    })
    // 4. 过滤掉空数组
    const newResult = result.filter((arr) => arr.length > 0)

    return direction === 'left' ? newResult.reverse() : newResult
}

/**
 * 计算生成桩的位置
 */
export const getPortByNode = (
    group: string,
    position: {
        x: number
        y: number
    },
) => {
    return {
        group,
        label: {},
        args: {
            position,
        },
        zIndex: 100,
    }
}

export const getPortYSite = (
    index: number,
    lineHeight: number,
    direction: 'left' | 'right',
) => {
    return (index + 0.5) * lineHeight + FORM_NODE_HEADER_HEIGHT
}
