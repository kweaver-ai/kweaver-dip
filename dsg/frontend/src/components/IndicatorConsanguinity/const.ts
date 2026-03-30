import { uniqBy } from 'lodash'

import { TabsKey } from '../IndicatorManage/const'

// 指标节点的通用头的高度
const INDICATORNODEHEADEHEIGHT = 92

// 指标标题的title
const INDICATORNODETITLEHEIGHT = 26

// 单行数据的高度
const LINEHEIGHT = 30

// 宽度
const NODEWIDTH = 282

// 底部的距离
const BOTTOMHEIGHT = 4

// 数据表header高度
const FORMNODEHEADEHEIGHT = 42

// 分页高度
const OFFSETHEIGHT = 24

// 数据表空状态的高度
const FORMEMPTYHEIGHT = 110

// 节点头部的桩的位置
const NODEHEADERY = 15

// 节点默认间距
const NODEDEFAULTGAP = 80

// 指标节点类型
export enum IndicatorNodeType {
    // 原子指标节点
    AUTOMICNODE = 'atomicIndicator',

    // 衍生指标节点
    DERIVEDNODE = 'derivedIndicator',

    // 复合指标
    COMPOSITENODE = 'compositeIndicator',

    // 数据表节点
    DATAFORMNODE = 'dataForm',
}

// 指标类型和指标节点类型的关系
const TypeAssociateIndicatorNodeType = {
    // 原子指标
    [TabsKey.ATOMS]: IndicatorNodeType.AUTOMICNODE,
    // 衍生指标
    [TabsKey.DERIVE]: IndicatorNodeType.DERIVEDNODE,
    // 复合指标
    [TabsKey.RECOMBINATION]: IndicatorNodeType.COMPOSITENODE,
}

// 指标图标颜色list
const IndicatorColor = {
    // 原子指标
    [TabsKey.ATOMS]: '#0091ff',
    // 衍生指标
    [TabsKey.DERIVE]: '#ff822f',
    // 复合指标
    [TabsKey.RECOMBINATION]: '#3ac4ff',
}

const enum ViewModel {
    // 编辑
    ModelEdit = 'ModelEdit',

    // 预览
    ModelView = 'ModelView',
}

// 节点属性
const enum NodeAttribute {
    // 入表
    InForm = 'inForm',

    // 出表
    outForm = 'outForm',
}

/**
 * 操作编辑模式下的显示
 */
const enum OptionModel {
    // 创建模型
    CreateModel = 'createModel',

    // 编辑模型
    EditModel = 'EditModel',

    // 新建指标
    CreateMetric = 'createMetric',

    // 编辑指标
    EditMetric = 'editMetric',

    // 指标详情
    MetricDetail = 'metricDetail',
}

const enum ViewType {
    // 以表查看
    Form = 'form',

    // 以字段查看
    Field = 'field',
}

const enum VisualType {
    // 业务视角
    Business = 'business',

    // 技术视角
    Technology = 'technology',
}

/**
 * 获取限定列表
 * @param timeRestrict
 * @returns
 */
const getRestrictList = (timeRestrict: Array<any>) => {
    const listData = timeRestrict?.reduce((pre, cur) => {
        if (cur?.member?.length) {
            const memberFields = cur.member.map((o) => o.field)
            return [...pre, ...memberFields]
        }
        return pre
    }, [])
    const uniqData = uniqBy(listData, (item: any) => {
        return item?.field_id?.[1]
    })
    return uniqData
}

/**
 * 计算原子指标节点高度
 */
const calculateAutomicNodeHeight = (height: number) => {
    return (
        INDICATORNODEHEADEHEIGHT +
        INDICATORNODETITLEHEIGHT +
        height +
        BOTTOMHEIGHT
    )
}

/**
 * 计算衍生指标的节点高度
 * @param dataCounts
 * @returns
 */
const calculateDeriveNodeHeight = (dataCounts: [number, number]) => {
    const timeRestrictHeight = dataCounts[0]
        ? dataCounts[0] * LINEHEIGHT + INDICATORNODETITLEHEIGHT
        : 0
    const modifierRestrictHieght = dataCounts[1]
        ? dataCounts[1] * LINEHEIGHT + INDICATORNODETITLEHEIGHT
        : 0

    return (
        INDICATORNODEHEADEHEIGHT +
        INDICATORNODETITLEHEIGHT +
        LINEHEIGHT +
        timeRestrictHeight +
        modifierRestrictHieght +
        BOTTOMHEIGHT
    )
}

/**
 * 计算复合指标节点高度
 */
const calculateCompositeNodeHeight = (dataCount: number) => {
    return (
        INDICATORNODEHEADEHEIGHT +
        INDICATORNODETITLEHEIGHT +
        LINEHEIGHT * dataCount +
        BOTTOMHEIGHT
    )
}

/**
 * 计算数据表的高度
 * @param dataCount 数据量s
 * @returns
 */
const calculateFormNodeHeight = (dataCount: number, offset = 0) => {
    if (!dataCount) {
        return 110 + FORMNODEHEADEHEIGHT
    }
    if (dataCount <= 10) {
        return FORMNODEHEADEHEIGHT + dataCount * LINEHEIGHT + BOTTOMHEIGHT
    }
    const needDisplayCount =
        dataCount - 10 * offset > 10 ? 10 : dataCount - 10 * offset
    return FORMNODEHEADEHEIGHT + needDisplayCount * LINEHEIGHT + OFFSETHEIGHT
}

/**
 * 计算生成桩的位置
 */
const getPortByNode = (
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

/**
 * 计算复合指标节点左边桩的位置
 * @param index
 * @returns
 */
const calculateCompositePort = (index: number) => {
    return {
        x: 0,
        y:
            INDICATORNODEHEADEHEIGHT +
            INDICATORNODETITLEHEIGHT +
            (index + 1 - 0.5) * LINEHEIGHT,
    }
}

/**
 * 计算衍生指标节点左边桩的位置
 * @param index
 * @returns
 */
const calculateDerivePort = (index: number, titleCount: number) => {
    return {
        x: 0,
        y:
            INDICATORNODEHEADEHEIGHT +
            INDICATORNODETITLEHEIGHT * titleCount +
            (index + 1 - 0.5) * LINEHEIGHT,
    }
}

/**
 * 根据下表计算数据表的位置
 */
const getDisplayIndex = (
    index: number,
    limit: number,
    offset: number,
): number | 'last' | 'next' => {
    if (offset * limit > index) {
        //
        return 'last'
    }
    if (offset * limit <= index && (offset + 1) * limit > index) {
        return index - offset * limit
    }
    return 'next'
}

/**
 * 线高亮的显示
 */
const LineLightStyle = {
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
const LineNormalStyle = {
    stroke: '#979797',
    strokeWidth: 0.7,
    targetMarker: 'block',
    strokeDasharray: '0',
    style: {
        animation: '',
    },
}

/**
 *  获取当前字段所在第几页
 * @param id id
 * @param fields 字段数据
 * @param limit 每页的数据量
 * @returns offset 第几页
 */
const getCurrentFieldsOffset = (id, fields: Array<any>, limit: number = 10) => {
    if (fields.length < limit) {
        return 1
    }
    const currentDataIndex = fields.findIndex((field) => field.id === id)
    return Math.ceil((currentDataIndex + 1) / limit)
}
export {
    ViewModel,
    NodeAttribute,
    OptionModel,
    ViewType,
    VisualType,
    IndicatorColor,
    INDICATORNODEHEADEHEIGHT,
    INDICATORNODETITLEHEIGHT,
    LINEHEIGHT,
    NODEWIDTH,
    BOTTOMHEIGHT,
    FORMNODEHEADEHEIGHT,
    OFFSETHEIGHT,
    FORMEMPTYHEIGHT,
    NODEHEADERY,
    NODEDEFAULTGAP,
    TypeAssociateIndicatorNodeType,
    getRestrictList,
    calculateAutomicNodeHeight,
    calculateFormNodeHeight,
    calculateDeriveNodeHeight,
    calculateCompositeNodeHeight,
    getPortByNode,
    calculateCompositePort,
    calculateDerivePort,
    getDisplayIndex,
    LineLightStyle,
    LineNormalStyle,
    getCurrentFieldsOffset,
}
