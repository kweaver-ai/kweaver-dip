import { Path } from '@antv/x6'

export enum NodeType {
    Fact = 'node-fact-table',
    Dimension = 'node-dimension-table',
}
export const ConnecterType = 'ModelConnector'
export const EdgeType = 'table-edge'

// 默认主题
export const DEFAULT_THEME = '#D5D5D5'

// 桩样式配置
const PortCircle = {
    r: 4,
    // magnet: true,
    strokeWidth: 1,
    fill: DEFAULT_THEME,
    stroke: DEFAULT_THEME,
}

// 桩分组
export enum PortGroupType {
    ModelLink = 'modelLink',
}

// 默认分页数据
export const DEFAULT_PAGINATION = {
    current: 1,
    total: 1,
    canPrev: false,
    canNext: false,
}

// 表单主题
export const TableTheme = {
    [NodeType.Dimension]: '#3184FE',
    [NodeType.Fact]: '#14CEAA',
}

// 桩配置
export const ModelPortConf = {
    groups: {
        [PortGroupType.ModelLink]: {
            position: {
                name: 'absolute',
                args: { x: 0, y: 0 },
            },
            attrs: {
                circle: PortCircle,
            },
        },
    },
}

// 连接器配置
export const ModelConnectorFunc = (sourcePoint, targetPoint) => {
    const hgap = Math.abs(targetPoint.x - sourcePoint.x)
    const path = new Path()
    path.appendSegment(
        Path.createSegment('M', sourcePoint.x - 4, sourcePoint.y),
    )
    path.appendSegment(
        Path.createSegment('L', sourcePoint.x + 12, sourcePoint.y),
    )
    // 水平三阶贝塞尔曲线
    path.appendSegment(
        Path.createSegment(
            'C',
            sourcePoint.x < targetPoint.x
                ? sourcePoint.x + hgap / 2
                : sourcePoint.x - hgap / 2,
            sourcePoint.y,
            sourcePoint.x < targetPoint.x
                ? targetPoint.x - hgap / 2
                : targetPoint.x + hgap / 2,
            targetPoint.y,
            targetPoint.x - 6,
            targetPoint.y,
        ),
    )
    path.appendSegment(
        Path.createSegment('L', targetPoint.x + 2, targetPoint.y),
    )

    return path.serialize()
}

// 边配置
export const ModelEdgeConf = {
    markup: [
        {
            tagName: 'path',
            selector: 'wrap',
            attrs: {
                fill: 'none',
                cursor: 'pointer',
                stroke: 'transparent',
                strokeLinecap: 'round',
            },
        },
        {
            tagName: 'path',
            selector: 'line',
            attrs: {
                fill: 'none',
                pointerEvents: 'none',
            },
        },
    ],
    connector: { name: ConnecterType },
    attrs: {
        wrap: {
            connection: true,
            strokeWidth: 4,
            strokeLinejoin: 'round',
        },
        line: {
            connection: true,
            stroke: DEFAULT_THEME,
            strokeWidth: 1,
            targetMarker: null,
        },
    },
    zIndex: -1,
}

// 节点宽高常量
export const NodeParams = {
    width: 280,
    lineHeight: 30, // 1+28+1
    topBarHeight: 9, // 1 + 8
    headerHeight: 35, // 34+1
    footerHeight: 20,
    emptyHeight: 140,
}

/**
 * 桩位置
 */
export enum PortPositionEnum {
    Left,
    Right,
    Unknown,
}

/**
 * 节点基本配置
 * @param nodeType 节点类型
 * @returns
 */
export const BaseNodeConf = (nodeType: NodeType) => ({
    shape: nodeType,
    width: NodeParams.width,
    height: NodeParams.topBarHeight + NodeParams.headerHeight,
    data: {},
    zIndex: 9999,
})
