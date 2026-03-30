import { Graph } from '@antv/x6'
import { Transform } from '@antv/x6-plugin-transform'
import { Snapline } from '@antv/x6-plugin-snapline'
import { Keyboard } from '@antv/x6-plugin-keyboard'
import { History } from '@antv/x6-plugin-history'
import { Selection } from '@antv/x6-plugin-selection'
import { Export } from '@antv/x6-plugin-export'
import { Scroller } from '@antv/x6-plugin-scroller'
import { Clipboard } from '@antv/x6-plugin-clipboard'

/**
 * 插件枚举
 */
enum Plugins {
    // 节点大小的变化
    'Transform',

    // 辅助线
    'Snapline',

    // 快捷键
    'Keyboard',

    // 撤销与重做
    'History',

    // 框选
    'Selection',

    // 滚动画布
    'Scroller',

    // 导出
    'Export',

    // 复制粘贴
    'Clipboard',
}

/**
 * 加载插件
 * @param graph 画布实例
 * @param plugins 加载插件
 */
const loadPlugins = (graph: Graph, plugins: Array<Plugins>, config?) => {
    plugins.forEach((plugin) => {
        loadPlugin(graph, plugin, config || {})
    })
}

/**
 * 加载插件
 * @param graph 画布实例
 * @param plugin 加载插件
 */
const loadPlugin = (graph: Graph, plugin: Plugins, config = {}) => {
    switch (true) {
        case Plugins.Transform === plugin:
            graph.use(
                new Transform(
                    config[plugin] || {
                        resizing: {
                            enabled: true,
                            minHeight: 44,
                            minWidth: 170,
                        },
                    },
                ),
            )
            break
        case Plugins.Snapline === plugin:
            graph.use(
                new Snapline({
                    enabled: true,
                    tolerance: 5,
                }),
            )
            break
        case Plugins.Keyboard === plugin:
            graph.use(
                new Keyboard({
                    enabled: true,
                }),
            )
            break
        case Plugins.History === plugin:
            graph.use(
                new History({
                    enabled: true,
                }),
            )
            break
        case Plugins.Selection === plugin:
            graph.use(
                new Selection(
                    config[plugin] || {
                        enabled: true,
                        multiple: true,
                        rubberEdge: true,
                        rubberNode: true,
                        modifiers: 'shift',
                        rubberband: true,
                        showNodeSelectionBox: true,
                        pointerEvents: 'none',
                    },
                ),
            )
            break
        case Plugins.Scroller === plugin:
            graph.use(
                new Scroller(
                    config[plugin] || {
                        enabled: true,
                        pageBreak: true,
                        pannable: true,
                        autoResize: true,
                    },
                ),
            )
            break
        case Plugins.Export === plugin:
            graph.use(new Export())
            break
        case Plugins.Clipboard === plugin:
            graph.use(
                new Clipboard({
                    enabled: true,
                }),
            )
            break
        default:
            break
    }
}

export { loadPlugins, Plugins, loadPlugin }
