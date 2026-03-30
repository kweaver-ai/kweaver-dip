import { Graph, Shape, CellView, Node, Edge, Path } from '@antv/x6'
import deleteIcon from '@/icons/svg/outlined/deleteBlue.svg'
import { shapeType } from './helper'

// 定义边的属性
const EdgeMetadata = {
    attrs: {
        line: {
            stroke: 'rgba(0,0,0,0.65)',
            strokeLinejoin: 'round',
            strokeWidth: 2,
            targetMarker: {
                name: 'block',
                width: 12,
                height: 8,
            },
        },
    },
    zIndex: 70,
}

/**
 * 边的线段类型
 * @param STRAIGHT 直线
 * @param POLY 折线
 * @param ARC 弧线
 */
enum LineType {
    STRAIGHT,
    POLY,
    ARC,
}

/**
 * 边的线段集合
 */
const lineConfigCollection = [
    {
        connector: {
            name: 'rounded',
            args: {
                radius: 4,
            },
        },
        router: {
            name: 'normal',
            args: {
                padding: 1,
            },
        },
    },
    {
        connector: {
            name: 'rounded',
            args: {
                radius: 4,
            },
        },
        router: {
            name: 'manhattan',
            args: {
                padding: 1,
            },
        },
    },
    {
        connector: {
            name: 'smooth',
            args: {
                radius: 4,
            },
        },
        router: {
            name: 'manhattan',
            args: {
                padding: 1,
            },
        },
    },
]

const getEdge = (type: LineType) => {
    return new Shape.Edge({
        ...EdgeMetadata,
        ...lineConfigCollection[type],
    })
}

/**
 * 脑图连接器
 * @param sourcePoint
 * @param targetPoint
 * @param routerPoints
 * @param options
 * @returns
 */
const mindmapConnector = (sourcePoint, targetPoint, routerPoints, options) => {
    const midX = sourcePoint.x + 10
    const midY = sourcePoint.y
    const ctrX = (targetPoint.x - midX) / 5 + midX
    const ctrY = targetPoint.y
    const pathData = `
M ${sourcePoint.x} ${sourcePoint.y}
L ${midX} ${midY}
Q ${ctrX} ${ctrY} ${targetPoint.x} ${targetPoint.y}
`
    return options.raw ? Path.parse(pathData) : pathData
}

/**
 * 脑图边
 */
const mindmapEdge = {
    inherit: 'edge',
    connector: {
        name: 'mindmap',
    },
    attrs: {
        line: {
            targetMarker: '',
            stroke: '#779EEA73',
            strokeWidth: 2,
        },
    },
    zIndex: 0,
}

/**
 * 场景分析连接器
 * @param sourcePoint
 * @param targetPoint
 * @param routerPoints
 * @param options
 * @returns
 */
const sceneConnector = (sourcePoint, targetPoint) => {
    const hgap = Math.abs(targetPoint.x - sourcePoint.x)
    const path = new Path()
    path.appendSegment(
        Path.createSegment('M', sourcePoint.x - 4, sourcePoint.y),
    )
    path.appendSegment(
        Path.createSegment('L', sourcePoint.x + 6, sourcePoint.y),
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

/**
 * 场景分析边配置
 */
const sceneEdgeConfig = {
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
    connector: { name: 'curveConnector' },
    attrs: {
        wrap: {
            connection: true,
            strokeWidth: 10,
            strokeLinejoin: 'round',
        },
        line: {
            connection: true,
            stroke: '#BFBFBF',
            strokeWidth: 1,
            targetMarker: {
                name: 'classic',
                size: 6,
            },
        },
    },
    zIndex: -1,
}
const getSceneEdgeConfig = () => {
    return new Shape.Edge({
        ...sceneEdgeConfig,
    })
}

// 注册边的样式
Graph.registerEdge(
    'workflow_edge',
    {
        inherit: 'edge',
        ...sceneEdgeConfig,
    },
    true,
)
// 注册边的样式
Graph.registerEdge(
    'workflow_edge_non_interaction',
    {
        inherit: 'edge',
        ...sceneEdgeConfig,
        markup: [
            {
                tagName: 'path',
                selector: 'wrap',
                attrs: {
                    fill: 'none',
                    cursor: 'grab',
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
    },
    true,
)

/**
 * 边上删除按钮
 */
Graph.registerEdgeTool(
    'edge_delete_btn',
    {
        inherit: 'button-remove',
        markup: [
            {
                tagName: 'circle',
                selector: 'button',
                attrs: {
                    r: 12,
                    stroke: '#126ee3',
                    strokeWidth: 1,
                    fill: 'white',
                    cursor: 'pointer',
                },
            },
            {
                tagName: 'image',
                selector: 'image',
                attrs: {
                    'xlink:href': deleteIcon,
                    width: 12,
                    height: 12,
                    fill: '#126ee3',
                    x: -6,
                    y: -6,
                },
            },
        ],
        distance: '50%',
    },
    true,
)

// 画布属性
const GraphOption: Graph.Options = {
    autoResize: true,
    panning: {
        enabled: false,
    },
    mousewheel: {
        enabled: true,
        modifiers: ['ctrl', 'meta'],
    },
    embedding: {
        enabled: true,
        validate({ child, parent, childView, parentView }) {
            if (child.shape === shapeType.Stage) {
                return false
            }
            if (parent.shape === shapeType.InputNode) {
                return false
            }
            return true
        },
    },
    connecting: {
        allowBlank: false,
        allowLoop: false,
        allowNode: false,
        allowEdge: false,
        highlight: true,
        connectionPoint: 'anchor',
        createEdge: () => {
            return new Shape.Edge({
                ...EdgeMetadata,
                ...lineConfigCollection[LineType.POLY],
            })
        },
    },
    highlighting: {
        magnetAdsorbed: {
            name: 'stroke',
            args: {
                attrs: {
                    fill: '#126EE3',
                    stroke: '#126EE333',
                },
            },
        },
    },

    background: {
        color: '#EFF2F5',
    },
}

/**
 * 初始化画布
 * @param container 画布的容器
 * @returns 返回画布的实例
 */
const instancingGraph = (
    container: HTMLDivElement | null,
    config: Graph.Options,
) => {
    if (container) {
        return new Graph({
            ...GraphOption,
            container,
            ...config,
        })
    }
    return null
}

Graph.registerPortLayout('freePort', (portsPositionArgs) => {
    return portsPositionArgs.map((_, index) => {
        return {
            position: {
                x: _?.position?.x || 0,
                y: _?.position?.y || 0,
            },
            zIndex: 10,
            angle: 0,
        }
    })
})

export {
    instancingGraph,
    LineType,
    EdgeMetadata,
    lineConfigCollection,
    mindmapConnector,
    mindmapEdge,
    sceneConnector,
    sceneEdgeConfig,
    getSceneEdgeConfig,
}
