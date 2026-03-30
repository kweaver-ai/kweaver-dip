import { Graph, Path } from '@antv/x6'
import Hierarchy from '@antv/hierarchy'
import __ from './locale'

import DataCatlgAbstract from './RelatedCatlg'
import DirBasicInfo from './BasicInfo'
import DirColumnInfo from './InfoItems'
import {
    shareTypeList,
    shareModeList,
    openTypeList,
    ShowUpdateCycleOptions,
} from '../const'
import { AppDataContentColored, FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import { dataRangeOptions } from '../helper'

/**
 * BASIC   基本信息
 * COLUMN  列属性
 * SAMPLTDATA 样例数据
 * CONSANGUINITYANALYSIS 血缘数据
 * DATAQUALITY 数据质量
 * REPORT 上报
 */
export enum TabKey {
    BASIC = 'basic_info',
    COLUMN = 'column_info',
    RELATEDCATALOG = 'RelatedCatalog',
}

// 目录内容tab
export const dirContItems = [
    {
        label: __('基本信息'),
        key: TabKey.BASIC,
    },
    {
        label: __('信息项'),
        key: TabKey.COLUMN,
    },
    {
        label: __('相关目录'),
        key: TabKey.RELATEDCATALOG,
    },
]

/**
 * 根据菜单内容返回
 */
interface DirItemsComponentType {
    catalogId: string
    ref: any
    tabkey: TabKey
    onFavoriteChange?: (res) => void
}

export const DirItemsComponent = ({
    catalogId,
    ref,
    tabkey,
    onFavoriteChange,
}: DirItemsComponentType) => {
    switch (tabkey) {
        case TabKey.BASIC:
            return (
                // <ContentContainer title={__('基本信息')}>
                <DirBasicInfo
                    catalogId={catalogId}
                    ref={ref}
                    onFavoriteChange={onFavoriteChange}
                />
                // </ContentContainer>
            )
        case TabKey.COLUMN:
            return (
                // <ContentContainer title={__('列属性')}>
                <DirColumnInfo catalogId={catalogId} />
                // </ContentContainer>
            )
        case TabKey.RELATEDCATALOG:
            return (
                <div style={{ height: '100%' }}>
                    <DataCatlgAbstract catalogId={catalogId} />
                </div>
            )

        default:
            return <div />
    }
}

/**
 * 查询参数
 * @param label 名称
 */
export interface ILabelTitle {
    label: string
    id?: string
}

export const basicInfoDetailsList = [
    {
        label: __('基本属性'),
        key: 'basic',
        list: [
            {
                label: __('信息资源来源部门'),
                value: '',
                key: 'source_info',
                subKey: 'department',
                span: 12,
            },
            {
                label: __('所属部门'),
                value: '',
                key: 'belong_info',
                subKey: 'department',
            },
            {
                label: __('所属处室'),
                value: '',
                key: 'belong_info',
                subKey: 'office',
                span: 12,
            },
            {
                label: __('所属主干业务'),
                value: '',
                key: 'belong_info',
                subKey: 'business_process',
            },
            {
                label: __('数据范围'),
                value: '',
                key: 'data_range',
                options: dataRangeOptions,
            },
            {
                label: __('更新周期'),
                value: '',
                key: 'update_cycle',
                options: ShowUpdateCycleOptions,
            },
            {
                label: __('处室业务职责'),
                value: '',
                key: 'belong_info',
                subKey: 'business_responsibility',
                // key: 'belong_info',
                // subKey: 'office',
            },
            {
                label: __('资源标签'),
                value: '',
                key: 'label_ids',
            },
        ],
    },
    {
        label: __('资源属性分类'),
        key: 'cate_info',
        list: [],
    },
    {
        label: __('关联信息'),
        key: 'relation_info',
        list: [
            {
                label: __('关联信息系统'),
                value: '',
                key: 'relation_info',
                subKey: 'info_systems',
            },
            {
                label: __('关联数据资源目录'),
                value: '',
                key: 'relation_info',
                subKey: 'data_resource_catalogs',
            },
            {
                label: __('来源业务场景'),
                value: '',
                key: 'relation_info',
                subKey: 'source_business_scenes',
            },
            {
                label: __('关联业务场景'),
                value: '',
                key: 'relation_info',
                subKey: 'related_business_scenes',
            },
            {
                label: __('关联信息类'),
                value: '',
                key: 'relation_info',
                subKey: 'info_resource_catalogs',
            },
            {
                label: __('关联信息项'),
                value: '',
                key: 'relation_info',
                subKey: 'info_items',
            },
        ],
    },
    {
        label: __('共享信息'),
        key: 'shared_open_info',
        list: [
            {
                label: __('共享属性'),
                value: '',
                key: 'shared_open_info',
                subKey: 'shared_type',
                options: shareTypeList,
            },
            {
                label: __('共享条件'),
                value: '',
                key: 'shared_open_info',
                subKey: 'shared_message',
            },
            {
                label: __('共享方式'),
                value: '',
                key: 'shared_open_info',
                subKey: 'shared_mode',
                options: shareModeList,
            },
            {
                label: __('开放属性'),
                value: '',
                key: 'shared_open_info',
                subKey: 'open_type',
                options: openTypeList,
            },
            {
                label: __('开放条件'),
                value: '',
                key: 'shared_open_info',
                subKey: 'open_condition',
            },
        ],
    },
]

export const EdgeType = 'an-edge'

export enum NodeCompType {
    common_node = 'common',
    info_resc_catalog = 'info_resc_catalog',
    data_resource_catalog = 'data_resource_catalog',
}

export enum NodeTypes {
    // 信息资源目录名称
    RESC_CATLG_NAME = 'resc_catlg_name',
    // 资源类型名称，如“关联信息资源目录”
    RESC_TYPE_TITLE = 'resc_type_title',
    INFO_RESC_CATALOG = 'info_resc_catalog',
    DATA_RESOURCE_CATALOG = 'data_resource_catalog',
}

export const NodeInfo = {
    [NodeTypes.DATA_RESOURCE_CATALOG]: {
        label: '资源目录',
        color: 'rgba(255, 186, 48, 1)',
        containerColor: 'rgba(255, 186, 48, 0.1)',
    },
    [NodeTypes.INFO_RESC_CATALOG]: {
        label: '信息资源目录',
        color: 'rgba(255, 186, 48, 1)',
        containerColor: 'rgba(255, 186, 48, 0.1)',
    },
}

// 默认主题
export const DEFAULT_THEME = '#D5D5D5'

const NodeLayout = {
    [NodeCompType.common_node]: {
        width: 206,
        height: 84,
    },
    [NodeCompType.info_resc_catalog]: {
        width: 242,
        height: 56,
    },
    [NodeCompType.data_resource_catalog]: {
        width: 242,
        height: 56,
    },
}

const routerConf = {
    name: 'manhattan',
    args: {
        // offset: 25,
        // direction: 'H',
        step: 2,
        padding: 3,
        offset: 48,
        min: 24,
        direction: 'T',
        startDirections: ['top'],
        endDirections: ['bottom'],
    },
}

// 边配置
export const EdgeConf = {
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
    // router: {
    //     // name: 'manhattan',
    //     name: 'manhattan',
    //     args: {
    //         padding: {
    //             top: 28,
    //         },
    //     },
    // },
    router: routerConf,
    connector: { name: 'rounded', args: { radius: 20 } },
    attrs: {
        wrap: {
            connection: true,
            strokeWidth: 4,
            strokeLinejoin: 'round',
        },
        line: {
            connection: true,
            stroke: '#D9D9D9',
            strokeWidth: 1,
            targetMarker: null,
        },
    },
    zIndex: -1,
}

// 桩样式配置
const PortCircle = {
    r: 4,
    // magnet: true,
    strokeWidth: 1,
    fill: 'transparent',
    stroke: 'transparent',
}

// 桩分组
export enum PortGroupType {
    Out = 'out',
    In = 'in',
}

// 桩配置
export const PortConf: any = {
    groups: {
        [PortGroupType.Out]: {
            position: 'bottom',
            attrs: {
                circle: PortCircle,
            },
        },
        [PortGroupType.In]: {
            position: 'top',
            attrs: {
                circle: PortCircle,
            },
        },
    },
}

// 画布初始默认配置
export const GraphConf = {
    background: {
        color: '#F6F9FB',
    },
    autoResize: true,
    panning: true,
    embedding: false,
    interacting: false,
    connecting: {
        allowBlank: false,
        allowLoop: false,
        allowNode: false,
        allowEdge: false,
        highlight: true,
        connectionPoint: 'anchor',
        snap: true,
        router: routerConf,
        // args: {
        //     // offset: 'center',
        //     offset: 48,
        //     min: 24,
        //     direction: 'T',
        // },
    },
}

export type INode = {
    id?: string
    name: string
    catlgName?: string
    type: string
    rescType?: string
    path_id?: string
    path_name?: string
    // 是否为当前资源node
    isCurDir?: boolean
    children?: INode[]
    parentId?: string
    owners?: Record<string, string>
}

interface ILayoutResult {
    id: string
    x: number
    y: number
    data: INode
    children?: ILayoutResult[]
}

/**
 * 布局算法【compactBox】计算节点定位数据
 * @param {INode} tree 节点树数据
 * @returns
 */
export const calcLayoutPosition = (tree: INode): ILayoutResult => {
    const rootId = tree?.id
    const isExistSubjectNode = tree.children?.find(
        (item) => item.type === NodeTypes.DATA_RESOURCE_CATALOG,
    )
    return Hierarchy.compactBox(tree, {
        direction: 'TB',
        getId(d: INode) {
            return d.id
        },
        getHeight(d: INode) {
            const nodeType =
                d.type === NodeTypes.INFO_RESC_CATALOG
                    ? NodeCompType.info_resc_catalog
                    : d.type === NodeTypes.DATA_RESOURCE_CATALOG
                    ? NodeCompType.data_resource_catalog
                    : NodeCompType.common_node
            return NodeLayout[nodeType].height // 固定高
        },
        getWidth(d: INode) {
            const nodeType =
                d.type === NodeTypes.INFO_RESC_CATALOG
                    ? NodeCompType.info_resc_catalog
                    : d.type === NodeTypes.DATA_RESOURCE_CATALOG
                    ? NodeCompType.data_resource_catalog
                    : NodeCompType.common_node
            return NodeLayout[nodeType].width // 固定高
        },
        getHGap(d: INode) {
            return 80
        },
        getVGap(d: INode) {
            return d?.id === rootId && d.children?.length !== 1 ? 36 : 24
        },
        getSide: () => {
            return 'bottom'
        },
    })
}

/**
 * 根据数据渲染画布
 * @param graph 画布
 * @param data 数据
 */
export const graphRenderByData = (graph: Graph, data: INode) => {
    if (!graph || !data?.id) return

    const result: ILayoutResult = calcLayoutPosition(data)

    const nodes: any[] = []
    const edges: any[] = []
    const traverse = (layoutItem: ILayoutResult) => {
        if (layoutItem) {
            const { data: childItem, children } = layoutItem

            const nodeType =
                childItem.type === NodeTypes.INFO_RESC_CATALOG
                    ? NodeCompType.info_resc_catalog
                    : childItem.type === NodeTypes.DATA_RESOURCE_CATALOG
                    ? NodeCompType.data_resource_catalog
                    : NodeCompType.common_node
            // const newNode = graph.createNode({
            //     id: childItem.id,
            //     shape: nodeType,
            //     // childItem.type === NodeTypes.schema
            //     //     ? NodeCompType.common_node
            //     //     : nodeType,
            //     x: layoutItem.x,
            //     y: layoutItem.y,
            //     width: NodeLayout[nodeType].width,
            //     height: NodeLayout[nodeType].height,
            //     data: childItem,
            //     ports: [
            //         {
            //             id: `${childItem.id}-in`,
            //             group: PortGroupType.In,
            //         },
            //         {
            //             id: `${childItem.id}-out`,
            //             group: PortGroupType.Out,
            //         },
            //     ],
            // })
            // nodes.push(newNode)

            // nodes.push(
            //     graph.createNode({
            //         id: childItem.id,
            //         shape: nodeType,
            //         // childItem.type === NodeTypes.schema
            //         //     ? NodeCompType.common_node
            //         //     : nodeType,
            //         x: layoutItem.x,
            //         y: layoutItem.y,
            //         width: NodeLayout[nodeType].width,
            //         height: NodeLayout[nodeType].height,
            //         data: childItem,
            //         ports: [
            //             {
            //                 id: `${childItem.id}-in`,
            //                 group: PortGroupType.In,
            //             },
            //             {
            //                 id: `${childItem.id}-out`,
            //                 group: PortGroupType.Out,
            //             },
            //         ],
            //     }),
            // )

            // const current = nodes[nodes.length - 1]
            // childItem.id = current.id

            const current = graph.addNode({
                id: childItem.id,
                shape: nodeType,
                // childItem.type === NodeTypes.schema
                //     ? NodeCompType.common_node
                //     : nodeType,
                x: layoutItem.x,
                y: layoutItem.y,
                width: NodeLayout[nodeType].width,
                height: NodeLayout[nodeType].height,
                data: childItem,
                ports: [
                    {
                        id: `${childItem.id}-in`,
                        group: PortGroupType.In,
                    },
                    {
                        id: `${childItem.id}-out`,
                        group: PortGroupType.Out,
                    },
                ],
            })
            childItem.id = current.id

            // 计算边
            children?.forEach((item) => {
                const edge = graph.addEdge({
                    id: `${current.id}::${item.id}`,
                    shape: EdgeType,
                    // source: {
                    //     cell: current.id,
                    //     port: `${current.id}-out`,
                    // },
                    // target: {
                    //     cell: item.id,
                    //     port: `${item.id}-in`,
                    // },
                    // vertices: [
                    //     { x: 100, y: 200 },
                    //     { x: 300, y: 120 },
                    // ],
                    source: current.id,
                    target: item.id,
                    // connector: {
                    //     name: 'rounded',
                    //     args: {
                    //         radius: 8,
                    //     },
                    // },
                    // router: {
                    //     // name: 'normal',
                    //     // name: 'rounded',
                    //     name: 'manhattan',
                    //     args: {
                    //         // offset: 'center',
                    //         offset: 48,
                    //         min: 24,
                    //         direction: 'T',
                    //     },
                    // },
                    // router:
                    //     childItem.id !== data.id || children?.length === 1
                    //         ? { name: 'normal' }
                    //         : undefined,
                    zIndex: -1,
                })
                edges.push(edge)
            })
            if (children) {
                children.forEach((item) => {
                    const { data: curData } = item
                    curData.parentId = current.id
                })
                children.forEach((item) => traverse(item))
            }
        }
    }
    traverse(result)

    // graph.resetCells([...nodes, ...edges])
}

interface IProps {
    type: NodeTypes
    fontSize?: number
}
export const NodeIcon = ({ type, fontSize = 18 }: IProps) => {
    if (type === NodeTypes.DATA_RESOURCE_CATALOG) {
        return (
            <AppDataContentColored
                style={{
                    fontSize,
                }}
            />
        )
    }
    if (type === NodeTypes.INFO_RESC_CATALOG) {
        return (
            <FontIcon
                name="icon-xinximulu1"
                type={IconType.COLOREDICON}
                style={{
                    color: NodeInfo[NodeTypes.DATA_RESOURCE_CATALOG].color,
                    fontSize,
                }}
                // className={styles.icon}
            />
        )
    }
    return null
}
