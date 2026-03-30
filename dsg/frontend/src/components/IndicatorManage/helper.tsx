/* eslint-disable no-await-in-loop */
import { Tooltip } from 'antd'
import { isEmpty, isEqualWith, noop, trim } from 'lodash'
import moment from 'moment'
import { CSSProperties, FC, ReactNode, useState } from 'react'
import { XYCoord } from 'react-dnd'

import {
    InfoCircleFilled,
    InfoCircleOutlined,
    QuestionCircleOutlined,
} from '@ant-design/icons'

import { Edge, Graph, Node, StringExt } from '@antv/x6'
import { info as modalInfo } from '@/utils/modalHelper'
import {
    AtomsExpressionTabsKey,
    changeFormatToType,
    ConfigType,
    FieldErrorType,
    fieldInfos,
    FieldTypes,
    FormulaError,
    formulaInfo,
    FormulaType,
    IndicatorNames,
    IndicatorType,
    IndicatorTypes,
    NodeDataType,
    nodeTemplate,
    OperatingKey,
    ROW_HEIGHT,
    ROW_MARGIN,
    TabsKey,
    UnitName,
    UnitType,
} from './const'
import __ from './locale'
import styles from './styles.module.less'

import {
    checkIndicatorCodeRepeat,
    checkIndicatorNameRepeat,
    checkSceneAnalysisName,
    dataTypeMapping,
    formatError,
    getBusinessObjDefine,
    getDataEleDetailById,
    getDatasheetViewDetails,
    getIndicatorDetail,
    getVirtualEngineExample,
    IFormula,
    IFormulaFields,
} from '@/core'
import {
    BinaryTypeOutlined,
    DivisionSignOutlined,
    FontIcon,
    LeftBracketOutlined,
    LimitDatellined,
    MinusSignOutlined,
    PlusSignOutlined,
    RightBracketOutlined,
    StringTypeOutlined,
    TimesSignOutlined,
    UnkownTypeOutlined,
} from '@/icons'
import {
    beforeDateOptions,
    beforeDateTimeOptions,
    beforeTime,
    currentDataTimeOptions,
    currentDateOptions,
    currentTime,
    limitDateRanger,
} from '../BussinessConfigure/const'
import Icons from './Icons'

import { sensitivityFieldLimits } from '@/components/SceneAnalysis/const'
import { DATA_TYPE_MAP } from '@/utils'
import { getPolicyFields } from '../SceneAnalysis/UnitForm/helper'
import { FieldsData } from './FieldsData'
import { DataType } from './IndicatorProvider'

export const getColumns = (
    tabKey: TabsKey,
    tableSort: any,
    optionComponent,
    onPreview: (id: string, type: string) => void = noop,
) => {
    // 表格字段
    const columns: Array<any> = [
        {
            title: () => (
                <Tooltip title={__('按指标名称排序')}>
                    <span>
                        {IndicatorNames[tabKey]}
                        <em className={styles.titleSubText}>
                            （{__('编码')}）
                        </em>
                    </span>
                </Tooltip>
            ),
            key: 'name',
            ellipsis: true,
            fixed: 'left',
            sorter: true,
            sortOrder: tableSort.name,
            showSorterTooltip: false,
            render: (_, record) => (
                <div className={styles.indicatorNameContainer}>
                    <span
                        className={styles.textName}
                        title={record?.name}
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            onPreview(record.id, record.indicator_type)
                        }}
                    >
                        {record?.name}
                    </span>
                    <span className={styles.textCode} title={record?.code}>
                        {record?.code}
                    </span>
                </div>
            ),
            width: 220,
        },
        {
            title: __('指标类型'),
            key: 'indicator_type',
            dataIndex: 'indicator_type',
            ellipsis: true,
            render: (value, record) => IndicatorTypes[value] || '--',
            width: 120,
        },
        // {
        //     title: __('编码'),
        //     key: 'code',
        //     dataIndex: 'code',
        //     ellipsis: true,
        //     render: (value, record) => value || '--',
        //     width: 160,
        // },
        // {
        //     title: __('关联维度模型'),
        //     key: 'dimension_model_name',
        //     dataIndex: 'dimension_model_name',
        //     ellipsis: true,
        //     render: (value, record) => value || '--',
        //     width: 220,
        // },
        {
            title: __('依赖原子指标'),
            key: 'atomic_indicator_name',
            dataIndex: 'atomic_indicator_name',
            ellipsis: true,
            render: (value, record) => value || '--',
            width: 220,
        },
        {
            title: __('关联业务指标'),
            key: 'business_indicator_name',
            dataIndex: 'business_indicator_name',
            ellipsis: true,
            render: (value, record) => value || '--',
            width: 220,
        },
        {
            title: __('更新人'),
            key: 'updater_name',
            ellipsis: true,
            render: (_, record) => record?.updater_name || '--',
            width: 180,
        },
        {
            title: __('更新时间'),
            key: 'updated_at',
            sorter: true,
            sortOrder: tableSort.updatedAt,
            showSorterTooltip: false,
            render: (_, record) =>
                record?.updated_at
                    ? moment(record.updated_at).format('YYYY-MM-DD HH:mm:ss')
                    : '--',
            width: 180,
        },
        {
            title: __('操作'),
            key: 'option',
            fixed: 'right',
            render: (_, record) => {
                return optionComponent(record)
            },
            width: 130,
        },
    ]
    switch (tabKey) {
        case TabsKey.ATOMS:
            return columns.filter(
                (item) =>
                    !['indicator_type', 'atomic_indicator_name'].includes(
                        item?.key || '',
                    ),
            )
        case TabsKey.DERIVE:
            return columns.filter(
                (item) => !['indicator_type'].includes(item?.key || ''),
            )
        case TabsKey.RECOMBINATION:
            return columns.filter(
                (item) =>
                    ![
                        'indicator_type',
                        'atomic_indicator_name',
                        'dimension_model_name',
                    ].includes(item?.key || ''),
            )
        default:
            return columns.filter(
                (item) =>
                    !['atomic_indicator_name'].includes(item?.key as string),
            )
    }
}

// 顶栏切换tab
export const AtomsExpressionTabs = [
    {
        label: __('聚合函数'),
        key: AtomsExpressionTabsKey.FUNC,
        children: '',
    },
    {
        label: __('字段列表'),
        key: AtomsExpressionTabsKey.FIELD,
        children: '',
    },
]

interface OperationListItemType {
    label: string
    comment: string
    name: string
    description: string
}

export const OperationListItem: FC<OperationListItemType> = ({
    label,
    comment,
    name,
    description,
}) => {
    const [hoverCurrent, setHoverCourrent] = useState<boolean>(false)
    return (
        <div
            onMouseEnter={() => {
                setHoverCourrent(true)
            }}
            onMouseLeave={() => {
                setHoverCourrent(false)
            }}
            className={styles.itemContent}
        >
            <div>
                <div>{label}</div>
                <div className={styles.textComment}>{comment}</div>
            </div>
            {hoverCurrent && (
                <Tooltip
                    placement="right"
                    title={
                        <div className={styles.itemTooltip}>
                            <div>
                                <span>{name}</span>
                                <span>{__('（')}</span>
                                <span className={styles.titleComment}>
                                    {__('字段名称')}
                                </span>
                                <span>{__('）')}</span>
                            </div>
                            <div className={styles.description}>
                                {description}
                            </div>
                        </div>
                    }
                    overlayInnerStyle={{
                        color: 'rgba(0,0,0,0.85)',
                    }}
                    color="#fff"
                >
                    <InfoCircleOutlined style={{ color: 'rgba(0,0,0,0.65)' }} />
                </Tooltip>
            )}
        </div>
    )
}

// 运算函数选项
export const OperatingFuncOptions = [
    {
        label: (
            <OperationListItem
                label="COUNT(column)"
                comment={__('返回所有参与运算字段的数据')}
                name={__('计数')}
                description={__(
                    '返回所有参与运算字段的数据；支持添加所有类型的字段',
                )}
            />
        ),
        value: OperatingKey.COUNT,
    },
    {
        label: (
            <OperationListItem
                label="COUNT(DISTINCT column )"
                comment={__('去除所有参与运算字段中重复的数据')}
                name={__('去重计数')}
                description={__(
                    '去除所有参与运算字段中重复的数据；支持添加数字型、字符型及日期型的字段',
                )}
            />
        ),
        value: OperatingKey.COUNTDISTINCT,
    },
    {
        label: (
            <OperationListItem
                label="SUM(column)"
                comment={__('返回所有参与运算字段数据的总和')}
                name={__('求和')}
                description={__(
                    '返回所有参与运算字段数据的总和；支持添加数字型的字段',
                )}
            />
        ),
        value: OperatingKey.SUM,
    },
    {
        label: (
            <OperationListItem
                label="AVG(column)"
                comment={__('返回所有参与运算字段数据的平均值')}
                name={__('平均值')}
                description={__(
                    '返回所有参与运算字段数据的平均值；支持添加数字型的字段',
                )}
            />
        ),
        value: OperatingKey.AVG,
    },
    {
        label: (
            <OperationListItem
                label="MAX(column)"
                comment={__('返回所有参与运算字段数据的最大值')}
                name={__('最大值')}
                description={__(
                    '返回所有参与运算字段数据的最大值；支持添加数字型的字段',
                )}
            />
        ),
        value: OperatingKey.MAX,
    },
    {
        label: (
            <OperationListItem
                label="MIN(column)"
                comment={__('返回所有参与运算字段数据的最小值')}
                name={__('最小值')}
                description={__(
                    '返回所有参与运算字段数据的最小值；支持添加数字型的字段',
                )}
            />
        ),
        value: OperatingKey.MIN,
    },
]

/**
 * 提示组件
 * @param text 文本
 */
export const tipLabel = (text: string) => (
    <div
        style={{
            color: 'rgba(0, 0, 0, 0.45)',
        }}
    >
        <div>{text}</div>
    </div>
)

export const getFieldTypeIcon = (type): ReactNode => {
    switch (true) {
        case dataTypeMapping.char.includes(type) || type === '1':
            return <StringTypeOutlined style={{ fontSize: 18 }} />
        // case dataTypeMapping.number.includes(type) || type === '0':
        //     return <NumberTypeOutlined style={{ fontSize: 18 }} />

        case dataTypeMapping.int.includes(type):
            return (
                <FontIcon
                    style={{ fontSize: 14, padding: '0 4px' }}
                    name="icon-zhengshuxing"
                />
            )
        case dataTypeMapping.float.includes(type):
            return (
                <FontIcon
                    style={{ fontSize: 14, padding: '0 4px' }}
                    name="icon-xiaoshuxing"
                />
            )
        case dataTypeMapping.datetime.includes(type) || type === '2':
            return (
                <FontIcon
                    style={{ fontSize: 14, padding: '0 4px' }}
                    name="icon-riqishijianxing"
                />
            )
        case dataTypeMapping.decimal.includes(type):
            return (
                <FontIcon
                    style={{ fontSize: 14, padding: '0 4px' }}
                    name="icon-gaojingduxing"
                />
            )
        case dataTypeMapping.date.includes(type) || type === '3':
            return <LimitDatellined style={{ fontSize: 14 }} />
        case dataTypeMapping.time.includes(type):
            return (
                <FontIcon
                    style={{ fontSize: 14, padding: '0 4px' }}
                    name="icon-shijianchuoxing"
                />
            )
        case dataTypeMapping.interval.includes(type):
            return (
                <FontIcon
                    name="icon-shijianduan11"
                    style={{
                        fontSize: 14,
                        padding: '0 4px',
                    }}
                />
            )
        case dataTypeMapping.bool.includes(type) || type === '5':
            return (
                <FontIcon
                    style={{ fontSize: 14, padding: '0 4px' }}
                    name="icon-buerxing"
                />
            )
        case dataTypeMapping.binary.includes(type) || type === '6':
            return <BinaryTypeOutlined style={{ fontSize: 18 }} />
        default:
            return <UnkownTypeOutlined style={{ fontSize: 18 }} />
    }
}

export type FormDataType = {
    // 值
    value: string
    // 显示标签
    label: string | ReactNode

    children: Array<{
        // 值
        value: string
        // 显示标签
        label: string | ReactNode
    }>
}

/**
 *  检查服务名重复
 * @param ruler
 * @param name
 * @returns
 */
export const checkIndicatorName = async (ruler, params) => {
    try {
        const { repeat } = await checkIndicatorNameRepeat(params)
        if (repeat) {
            return Promise.reject(new Error('该名称已存在，请重新输入'))
        }
        return Promise.resolve()
    } catch (ex) {
        formatError(ex)
        return Promise.resolve()
    }
}
/**
 *  检查编码重复
 * @param ruler
 * @param name
 * @returns
 */
export const checkIndicatorCode = async (ruler, params) => {
    try {
        const { repeat } = await checkIndicatorCodeRepeat(params)
        if (repeat) {
            return Promise.reject(new Error('该编码已存在，请重新输入'))
        }
        return Promise.resolve()
    } catch (ex) {
        formatError(ex)
        return Promise.resolve()
    }
}

export const getOperationSignIcon = (operationType) => {
    switch (operationType) {
        case '+':
            return <PlusSignOutlined />
        case '-':
            return <MinusSignOutlined />
        case '*':
            return <TimesSignOutlined />
        case '/':
            return <DivisionSignOutlined />
        case '(':
            return <LeftBracketOutlined />
        case ')':
            return <RightBracketOutlined />
        default:
            return null
    }
}

export const getDateDisplay = (value, operator, type) => {
    if (beforeTime.includes(operator)) {
        const allDateUnitOptions =
            changeFormatToType(type) === FieldTypes.DATE
                ? beforeDateOptions
                : beforeDateTimeOptions

        const dateData = value.split(' ')
        return `${dateData?.[0]} ${
            allDateUnitOptions.find(
                (currentOption) => currentOption.value === dateData?.[1],
            )?.label || ''
        }`
    }
    if (currentTime.includes(operator)) {
        const allDateValueOptions =
            changeFormatToType(type) === FieldTypes.DATE
                ? currentDateOptions
                : currentDataTimeOptions
        return (
            allDateValueOptions.find(
                (currentOption) => currentOption.value === value,
            )?.label || ''
        )
    }

    if (limitDateRanger.includes(operator)) {
        const timeStr = DATA_TYPE_MAP.date.includes(changeFormatToType(type))
            ? 'YYYY-MM-DD'
            : 'YYYY-MM-DD HH:mm:ss'

        const [st, et] = value ? value.split(',') : [undefined, undefined]
        return value
            ? `${moment(st).format(timeStr)},${moment(et).format(timeStr)}`
            : ''
    }

    return value
}

export const countCharacters = (str: string) => {
    let counts: number = 0
    const arr = str.split('')
    arr.forEach((item: string) => {
        const char = item.toLowerCase()
        if (char === '/') {
            counts += 1
        }
    })
    return counts
}

// 画布相关
export const sceneAlsDataType = [
    {
        id: 7,
        value: '整数型',
        value_en: 'int',
    },
    {
        id: 8,
        value: '小数型',
        value_en: 'float',
    },
    {
        id: 9,
        value: '高精度型',
        value_en: 'decimal',
    },
    {
        id: 0,
        value: '数字型',
        value_en: 'number',
    },
    {
        id: 10,
        value: '时间型',
        value_en: 'time',
    },
    {
        id: 1,
        value: '字符型',
        value_en: 'char',
    },
    {
        id: 2,
        value: '日期型',
        value_en: 'date',
    },
    {
        id: 3,
        value: '日期时间型',
        value_en: 'datetime',
    },
    {
        id: 4,
        value: '时间戳型',
        value_en: 'timestamp',
    },
    {
        id: 5,
        value: '布尔型',
        value_en: 'bool',
    },
    {
        id: 6,
        value: '二进制',
        value_en: 'binary',
    },
    {
        id: 7,
        value: '时间型',
        value_en: 'time',
    },
]
/**
 * 转换小类型到大类型
 * @type 小类型
 */
export const changeTypeToLargeArea = (type: string) => {
    switch (true) {
        case dataTypeMapping.char.includes(type):
            return 'char'
        case dataTypeMapping.int.includes(type):
            return 'int'
        case dataTypeMapping.float.includes(type):
            return 'float'
        case dataTypeMapping.decimal.includes(type):
            return 'decimal'
        case dataTypeMapping.number.includes(type):
            return 'number'
        case dataTypeMapping.datetime.includes(type):
            return 'datetime'
        case dataTypeMapping.date.includes(type):
            return 'date'
        case dataTypeMapping.time.includes(type):
            return 'time'
        case dataTypeMapping.bool.includes(type):
            return 'bool'
        case dataTypeMapping.binary.includes(type):
            return 'binary'
        default:
            return ''
    }
}
/**
 * 获取算子菜单项信息
 * @type 算子类型
 */
export const getFormulaMenuItem = (type: FormulaType) => ({
    label: (
        <div style={{ display: 'flex', alignItems: 'center' }}>
            <Icons type={type} colored fontSize={14} />
            <span
                style={{
                    marginLeft: '8px',
                    color: 'rgba(0, 0, 0, 0.85)',
                }}
            >
                {formulaInfo[type].name}
            </span>
            <Tooltip title={formulaInfo[type].featureTip}>
                <QuestionCircleOutlined
                    style={{
                        fontSize: 12,
                        color: 'rgba(0,0,0,0.45)',
                        marginLeft: 4,
                    }}
                />
            </Tooltip>
        </div>
    ),
    key: type,
})

/**
 * 获取错误文本
 * @err 错误类型
 * @type 算子类型
 */
export const getFormulaErrorText = (
    err?: string | FormulaError,
    type?: FormulaType,
) => {
    switch (err) {
        case FormulaError.MissingLine:
            if (type === FormulaType.WHERE) {
                return __('数据过滤算子前需存在算子或节点的数据输入')
            }
            return __('缺少前序算子数据的输入，请先调整前序算子')
        case FormulaError.MoreLine:
            if (type === FormulaType.WHERE) {
                return __('数据过滤算子前只能存在一个算子或节点的数据输入')
            }
            return __('缺少前序算子数据的输入，请先调整前序算子')
        case FormulaError.IndexError:
            return __('缺少前序算子数据的输入，请先调整前序算子')
        case FormulaError.MissingData:
            if (type) {
                return ''
            }
            return __('缺少前序算子数据的输入，请先调整前序算子')
        case FormulaError.NodeChange:
            return __('前序节点发生变更，请确认配置信息')
        case FormulaError.ConfigError:
            return __('算子配置有误')
        case FormulaError.IsPolicy:
            return __(
                '当前字段数据密级管控，不能进行度量计算，也不能作为分析维度查询其他数据',
            )
        default:
            return ''
    }
}

export const sceneAnalFormatError = (
    navigator,
    e: any,
    onOk?: () => void,
    text: string = '无法编辑',
) => {
    if (e?.data?.code === 'SceneAnalysis.Scene.SceneNotExist') {
        modalInfo({
            title: __(text),
            icon: <InfoCircleFilled />,
            content: __('指标定义已不存在'),
            okText: __('确定'),
            onOk() {
                if (onOk) {
                    onOk()
                    return
                }
                navigator('/business/indicatorManage')
            },
        })
    } else {
        formatError(e)
    }
}

/**
 * 检查场景名称重复
 * @value 输入值
 * @oldName 旧名称
 */
export const checkNameRepeat = async (
    value: string,
    oldName?: string,
    id?: string,
) => {
    try {
        if (trim(value) === oldName) {
            return Promise.resolve()
        }
        if (trim(value)) {
            const res = await checkSceneAnalysisName({
                sid: id,
                name: value,
            })
            if (res?.repeat) {
                return Promise.reject(
                    new Error(__('该场景分析名称已存在，请重新输入')),
                )
            }
        }
        return Promise.resolve()
    } catch (ex) {
        formatError(ex)
        return Promise.resolve()
    }
}

// 节点位置信息
export interface Position {
    x: number
    y: number
}
/**
 * 创建节点
 * @graph 画布
 * @position 节点位置
 * @type 算子类型
 * @node 前序节点
 * @dataViewId 库表id
 * @objId 实体 id
 * @returns 新创建的节点
 */
export const createNodeInGraph = (
    graph: Graph,
    position?: Position,
    type?: FormulaType,
    node?: Node,
    flag: 'create' | 'add' = 'add',
) => {
    const newId = StringExt.uuid()
    // 前序节点相关信息
    let preNodeId: string = ''
    if (node) {
        preNodeId = node.id
    }
    // 算子相关信息
    const num = getNodeNameRepeat(graph, __('未命名'))
    let formulaData: any = {
        name: num > 0 ? `${__('未命名')}_${num}` : __('未命名'),
    }
    if (type) {
        formulaData = {
            ...formulaData,
            formula: [
                {
                    id: StringExt.uuid(),
                    type,
                    output_fields: [],
                },
            ],
        }
    }
    if (flag === 'create') {
        const newNode = graph.createNode({
            id: newId,
            ...nodeTemplate,
            x: position?.x,
            y: position?.y,
            ports: getPortsByType(newId, NodeDataType.JOIN),
            data: {
                ...nodeTemplate.data,
                ...formulaData,
                src: preNodeId ? [preNodeId] : [],
            },
        })
        return newNode
    }
    const newNode = graph.addNode({
        id: newId,
        ...nodeTemplate,
        x: position?.x,
        y: position?.y,
        ports: getPortsByType(newId, NodeDataType.JOIN),
        data: {
            ...nodeTemplate.data,
            ...formulaData,
            src: preNodeId ? [preNodeId] : [],
        },
    })
    return newNode
}

const getFormulaData = (type: FormulaType) => ({
    id: StringExt.uuid(),
    type,
    output_fields: [],
})

const getEdgeData = (sourceId: string, targetId: string) => ({
    id: StringExt.uuid(),
    shape: 'data-scene-edge',
    source: {
        cell: sourceId,
        port: `${sourceId}-out`,
    },
    target: {
        cell: targetId,
        port: `${targetId}-in`,
    },
    zIndex: -1,
})

const NodeName = {
    [IndicatorType.ATOM]: [
        __('选择数据集'),
        __('配置指标'),
        __('定义原子指标'),
    ],
    [IndicatorType.DERIVED]: [
        __('选择原子指标'),
        __('配置限定'),
        __('定义衍生指标'),
    ],
}

export const createNodesInGraphByType = async (
    graph: Graph,
    type: IndicatorType,
) => {
    const graphBodyDom = document.getElementById('inGraphBody')
    const firstId = StringExt.uuid()
    const secondId = StringExt.uuid()
    const thirdId = StringExt.uuid()
    const firstName = NodeName?.[type]?.[0] || __('未命名')
    const secondName = NodeName?.[type]?.[1] || `${__('未命名')}_1`
    const thirdName = NodeName?.[type]?.[2] || `${__('未命名')}_2`
    const x = ((graphBodyDom?.scrollWidth || 1280) - 140) / 2
    const y = ((graphBodyDom?.scrollHeight || 720) - 130) / 2
    let nodes: any[] = []
    switch (type) {
        case IndicatorType.ATOM:
            nodes = [
                {
                    id: firstId,
                    ...nodeTemplate,
                    x: x - 150,
                    y,
                    ports: getPortsByType(firstId, NodeDataType.INPUT),
                    data: {
                        ...nodeTemplate.data,
                        name: firstName,
                        formula: [getFormulaData(FormulaType.FORM)],
                        src: [],
                    },
                },
                {
                    id: secondId,
                    ...nodeTemplate,
                    x: x + 150,
                    y,
                    ports: getPortsByType(secondId, NodeDataType.JOIN),
                    data: {
                        ...nodeTemplate.data,
                        name: secondName,
                        formula: [
                            getFormulaData(FormulaType.WHERE),
                            getFormulaData(FormulaType.INDICATOR_MEASURE),
                        ],
                        src: [firstId],
                    },
                },
                {
                    id: thirdId,
                    ...nodeTemplate,
                    x: x + 530,
                    y,
                    ports: getPortsByType(thirdId, NodeDataType.OUTPUT),
                    data: {
                        ...nodeTemplate.data,
                        name: thirdName,
                        formula: [getFormulaData(FormulaType.ATOM)],
                        src: [secondId],
                    },
                },
            ]
            break
        case IndicatorType.DERIVED:
            nodes = [
                {
                    id: firstId,
                    ...nodeTemplate,
                    x: x - 150,
                    y,
                    ports: getPortsByType(firstId, NodeDataType.INPUT),
                    data: {
                        ...nodeTemplate.data,
                        name: firstName,
                        formula: [getFormulaData(FormulaType.ATOM)],
                        src: [],
                    },
                },
                {
                    id: secondId,
                    ...nodeTemplate,
                    x: x + 150,
                    y,
                    ports: getPortsByType(secondId, NodeDataType.JOIN),
                    data: {
                        ...nodeTemplate.data,
                        name: secondName,
                        formula: [getFormulaData(FormulaType.WHERE)],
                        src: [firstId],
                    },
                },
                {
                    id: thirdId,
                    ...nodeTemplate,
                    x: x + 450,
                    y,
                    ports: getPortsByType(thirdId, NodeDataType.OUTPUT),
                    data: {
                        ...nodeTemplate.data,
                        name: thirdName,
                        formula: [getFormulaData(FormulaType.DERIVED)],
                        src: [secondId],
                    },
                },
            ]
            break
        default:
            nodes = []
            break
    }

    const edges = [
        getEdgeData(firstId, secondId),
        getEdgeData(secondId, thirdId),
    ]

    await nodes.forEach((item) => graph.addNode(item))
    await edges.forEach((item) => graph.addEdge(item))
}

/**
 * 自动生成名称时获取节点名称重复个数
 * @graph 画布
 * @name 名称
 */
export const getNodeNameRepeat = (graph: Graph, name: string) => {
    const nodes = graph.getNodes()
    let repeatNum = 0
    let maxNum = 0
    nodes.forEach((info) => {
        const nameArr: string = info.getData().name.split('_')
        if (nameArr.length > 1) {
            if (nameArr[0] === name && /[0-9]$/g.exec(nameArr[1])) {
                repeatNum += 1
                maxNum =
                    maxNum > Number(nameArr[1]) ? maxNum : Number(nameArr[1])
            }
        } else if (nameArr[0] === name) {
            repeatNum += 1
        }
    })
    maxNum += 1
    return repeatNum > 0 ? maxNum : repeatNum
}

export const getPortsByType = (id: string, type?: NodeDataType) => {
    let ports: any = []
    switch (type) {
        case NodeDataType.INPUT:
            ports = [
                {
                    id: `${id}-out`,
                    group: 'out',
                },
            ]
            break
        case NodeDataType.OUTPUT:
            ports = [
                {
                    id: `${id}-in`,
                    group: 'in',
                },
            ]
            break
        default:
            ports = [
                {
                    id: `${id}-in`,
                    group: 'in',
                },
                {
                    id: `${id}-out`,
                    group: 'out',
                },
            ]
            break
    }
    return ports
}

/**
 * 根据节点去寻找上游节点
 * @nodes 所有节点
 * @node 当前节点
 * @returns
 */
export const getPreorderNode = (nodes, node): Node[] => {
    if (nodes.length === 0 || !node) {
        return []
    }
    const { src } = node.data
    if (src.length > 0) {
        return [
            ...src.flatMap((info) =>
                getPreorderNode(
                    nodes,
                    nodes.find((n) => info === n.id),
                ),
            ),
            node,
        ]
    }
    return [node]
}
// 获取引用库表节点数据
const getNodeData = (n, fieldsData) => ({
    id: n.id,
    name: n.data.name,
    formula: n.data?.formula?.map((a) => {
        const { type, output_fields, config } = a
        const tempOutputFields = output_fields.map((b) => {
            const findItem = fieldsData.data.find((c) => b?.id === c.id)
            return {
                ...b,
                name_en: b?.name_en || findItem?.name_en,
                data_type: b?.data_type || findItem?.data_type,
            }
        })
        return {
            type,
            output_fields: tempOutputFields,
            config,
        }
    }),
    output_fields: n.data?.output_fields?.map((a) => {
        const findItem = fieldsData.data.find((b) => b.id === a.id)
        return {
            ...a,
            id: a?.id || findItem.id,
            name_en: a?.name_en || findItem.name_en,
            data_type: a?.data_type || findItem.data_type,
        }
    }),
    src: n.data.src,
})

/**
 * 检查字段排序集重命名
 * @data 总数据
 * @config 配置项
 * @returns totalFields-总数据 selectedFields-选择项 fieldNameError-错误
 */
export const checkSortAndRenameFields = (
    data: IFormulaFields[],
    config?: IFormulaFields[],
) => {
    const tempData: IFormulaFields[] = data.map((info) => ({
        ...info,
        originName: info.alias,
        checked: false,
        beEditing: false,
        editError: undefined,
    }))
    let notExist: IFormulaFields[] = []
    let existFields: IFormulaFields[] = []
    if (!config || config.length === 0) {
        notExist = []
        existFields = tempData.map((info) => ({
            ...info,
            checked: true,
        }))
    } else {
        notExist = tempData?.filter(
            (item) =>
                !config?.find(
                    (a) => a.id === item.id && a.sourceId === item.sourceId,
                ),
        )
        existFields =
            config
                ?.filter((item) =>
                    tempData?.find(
                        (a) => a.id === item.id && a.sourceId === item.sourceId,
                    ),
                )
                .map((item) => {
                    const findItem = tempData?.find(
                        (a) => a.id === item.id && a.sourceId === item.sourceId,
                    )
                    if (findItem) {
                        if (item.alias === item.originName) {
                            return {
                                ...item,
                                alias: findItem.alias,
                                originName: findItem.alias,
                                data_type: findItem?.data_type,
                            }
                        }
                        return {
                            ...item,
                            originName: findItem.alias,
                            data_type: findItem?.data_type,
                        }
                    }
                    return item
                }) || []
    }
    let errorFields: IFormulaFields[] = []
    const selectedFields = existFields.filter((info) => info?.checked)
    selectedFields.forEach((f1) => {
        if (
            selectedFields.find(
                (f2) =>
                    f2.alias === f1.alias &&
                    `${f1.id}_${f1.sourceId}` !== `${f2.id}_${f2.sourceId}`,
            )
        ) {
            errorFields = [...errorFields, f1]
        }
    })
    return {
        totalFields: [...existFields, ...notExist].map((info) => {
            const findItem = errorFields.find(
                (f2) =>
                    `${info.id}_${info.sourceId}` === `${f2.id}_${f2.sourceId}`,
            )
            if (findItem) {
                return {
                    ...info,
                    editError: FieldErrorType.Repeat,
                    beEditing: true,
                }
            }
            return info
        }),
        selectedFields,
        errorFields,
    }
}

/**
 * 引用库表算子检查-逻辑/自定义库表模块
 * @node 所在节点
 * @formulaItem 当前算子
 */
export const checkCiteViewFormulaConfig = async (
    node: Node,
    formulaItem: IFormula,
    fieldsData: FieldsData,
    getDetail: (id: string, type?: DataType) => any,
) => {
    const { formula } = node.data
    const { config, id } = formulaItem
    let outData: IFormulaFields[] = []
    let totalData: IFormulaFields[] = []
    let errorMsg: any
    let isExist = true
    if (config) {
        const { form_id, config_fields } = config
        if (form_id) {
            try {
                const getFunc = getDetail || getDatasheetViewDetails
                const res = await getFunc(form_id)
                if (res) {
                    const tempEntries = res.fields?.filter(
                        (item) =>
                            changeTypeToLargeArea(item.data_type) !==
                                FieldTypes.BINARY &&
                            item.data_type !== null &&
                            item.data_type !== '',
                    )
                    totalData = tempEntries?.map((item) => ({
                        alias: item.business_name,
                        id: item.id,
                        name: item.business_name,
                        sourceId: node.id,
                        originName: item.business_name,
                    }))
                    const { totalFields, selectedFields, errorFields } =
                        checkSortAndRenameFields(totalData, config_fields)
                    if (errorFields.length > 0 || selectedFields.length === 0) {
                        errorMsg = FormulaError.ConfigError
                    } else {
                        outData = selectedFields
                    }
                    totalData = totalFields
                    fieldsData.addData(
                        tempEntries?.map((item) => ({
                            ...item,
                            data_type: changeTypeToLargeArea(item.data_type),
                            name_en: item.technical_name,
                            dict_id: item.code_table_id || undefined,
                            dict_name: item.code_table || undefined,
                            standard_code: item.standard_code || undefined,
                            standard_name: item.standard || undefined,
                        })) || [],
                    )
                }
            } catch (err) {
                if (
                    [
                        'DataCatalog.Public.DataSourceNotFound',
                        'DataCatalog.Public.ResourceNotExisted',
                        'DataCatalog.Public.AssetOfflineError',
                        'DataView.FormView.FormViewIdNotExist',
                    ].includes(err?.data?.code)
                ) {
                    isExist = false
                }
                errorMsg = FormulaError.ConfigError
            }
        }
    }
    node.replaceData({
        ...node.data,
        formula: formula.map((info) => {
            if (info.id === id) {
                return {
                    ...info,
                    output_fields: outData,
                    errorMsg,
                }
            }
            return info
        }),
    })
    return { outData, isExist, totalData }
}
const checkWhere = (where, preOutData, fieldsData) => {
    let errorMsg
    for (let i = 0; i < (where?.length || 0); i += 1) {
        const { member } = where![i]
        for (let j = 0; j < member.length; j += 1) {
            const { field } = member[j]
            const findItem = preOutData.find(
                (info) =>
                    info.id === field.id && info.sourceId === field.sourceId,
            )
            const findItemDataType =
                findItem?.data_type ||
                fieldsData.data.find((d) => d.id === findItem?.id)?.data_type
            const fieldDataType =
                field?.data_type ||
                fieldsData.data.find((d) => d.id === field.id)?.data_type
            if (
                !findItem ||
                findItemDataType !== fieldDataType ||
                fieldDataType === 'time' ||
                findItemDataType === 'time'
            ) {
                errorMsg = FormulaError.ConfigError
                break
            }
            if (
                !fieldInfos[fieldDataType].limitListOptions.find(
                    (a) => a.value === member[j].operator,
                )
            ) {
                errorMsg = FormulaError.ConfigError
                break
            }
            const originField = fieldsData.data.find(
                (info) => info.id === field.id,
            )
            if (originField?.label_is_protected) {
                errorMsg = FormulaError.IsPolicy
                break
            }
        }
        if (errorMsg) {
            break
        }
    }
    return errorMsg
}

/**
 * 存储样例数据
 * @fieldsData 字段数据
 * @userInfo 用户信息
 * @tableId 库表ID
 */
export const storeExampleData = async (
    fieldsData: FieldsData,
    userInfo?: any,
    data_view?: any,
) => {
    try {
        // 库表算子
        if (data_view) {
            const { id, view_source_catalog_name, technical_name } = data_view
            if (fieldsData.exampleData.find((e) => e.id === id)) return
            const [catalog, schema] = view_source_catalog_name.split('.')
            let params: any = {
                catalog,
                schema,
                table: technical_name,
                limit: 10,
            }
            if (userInfo) {
                params = {
                    ...params,
                    user: userInfo.Account || '',
                    user_id: userInfo.ID || '',
                }
            }

            const exampleData = await getVirtualEngineExample(params)
            if (exampleData?.data !== null && exampleData?.data.length > 0) {
                const exaData = {}
                exampleData?.columns?.forEach((item, index) => {
                    exaData[item.name] = Array.from(
                        new Set(exampleData?.data?.map((it) => it[index])),
                    )
                })
                fieldsData.addExampleData(id, exaData)
            }
        }
    } catch (error) {
        // formatError(error)
    }
}

/**
 * 过滤算子检查
 * @graph 画布
 * @node 所在节点
 * @formulaItem 当前算子
 * @return preOutData前序输出结果 outData输出字段
 */
export const checkWhereFormulaConfig = (
    graph: Graph,
    node: Node,
    formulaItem: IFormula,
    fieldsData: FieldsData,
) => {
    const { config, id } = formulaItem
    const { formula } = node.data
    // 前序算子输出数据
    let preOutData: IFormulaFields[] = []
    let outData: IFormulaFields[] = []
    let errorMsg: any
    // 前序节点
    const preNodes = node.data.src.map(
        (info) => graph!.getCellById(info) as Node,
    )
    // 处理引用库表所在节点数据
    const n = preNodes[0]
    preOutData = (n?.data?.output_fields || []).map((a) => ({
        ...a,
        source_node_id: n?.id,
    }))

    if (preOutData.length === 0) {
        errorMsg = FormulaError.MissingData
    } else if (config) {
        const { where, sub_type } = config
        if (sub_type === ConfigType.VIEW) {
            errorMsg = checkWhere(where, preOutData, fieldsData)
        }
        if (!errorMsg) {
            outData = preOutData
        }
    }
    node.replaceData({
        ...node.data,
        formula: formula.map((info) => {
            if (info.id === id) {
                return {
                    ...info,
                    output_fields: outData,
                    errorMsg,
                }
            }
            return info
        }),
    })
    return {
        preOutData,
        outData,
        firstNodeData: getNodeData(n, fieldsData),
    }
}
/**
 * 过滤算子检查
 * @graph 画布
 * @node 所在节点
 * @formulaItem 当前算子
 * @return preOutData前序输出结果 outData输出字段
 */
export const checkDeWhereFormulaConfig = (
    graph: Graph,
    node: Node,
    formulaItem: IFormula,
    fieldsData: FieldsData,
) => {
    const { config, id } = formulaItem
    const { formula, src } = node.data
    // 前序算子输出数据
    let preOutData: IFormulaFields[] = []
    let outData: IFormulaFields[] = []
    let errorMsg: any
    // 前序节点
    const preNodes = node.data.src.map(
        (info) => graph!.getCellById(info) as Node,
    )
    // 处理引用库表所在节点数据
    const n = preNodes[0]
    preOutData = (n?.data?.output_fields || []).map((a) => ({
        ...a,
        source_node_id: n?.id,
    }))

    if (preOutData.length === 0) {
        errorMsg = FormulaError.MissingData
    } else if (config) {
        const { where, date_where, sub_type } = config
        if (sub_type === ConfigType.VIEW) {
            errorMsg =
                checkWhere(where, preOutData, fieldsData) ||
                checkWhere(date_where, preOutData, fieldsData)
        }
        if (!errorMsg) {
            outData = preOutData
        }
    }
    // }
    node.replaceData({
        ...node.data,
        formula: formula.map((info) => {
            if (info.id === id) {
                return {
                    ...info,
                    // config: newConfig,
                    output_fields: outData,
                    errorMsg,
                }
            }
            return info
        }),
    })
    return {
        preOutData,
        outData,
        firstNodeData: getNodeData(n, fieldsData),
    }
}

/**
 * 度量计算算子检查
 * @graph 画布
 * @node 所在节点
 * @formulaItem 当前算子
 * @return preOutData前序输出结果 outData输出字段
 */
export const checkCalculateFormulaConfig = async (
    graph: Graph,
    node: Node,
    formulaItem: IFormula,
    fieldsData: FieldsData,
) => {
    const { config, id } = formulaItem
    const { formula } = node.data
    const policyFieldInfos = await getPolicyFields(fieldsData?.formId)

    // 前序算子输出数据
    let preOutData: IFormulaFields[] = []
    let outData: IFormulaFields[] = []
    // 节点算子
    // let newConfig = config
    let errorMsg: any
    // 前序节点
    const preNodes = node.data.src.map(
        (info) => graph!.getCellById(info) as Node,
    )
    // 处理引用库表节点数据
    const n = preNodes[0]

    // 引用库表节点
    preOutData = (n?.data?.output_fields || []).map((a) => ({
        ...a,
        source_node_id: n?.id,
        name_en: n?.name_en,
    }))

    const currentField = fieldsData.data.find(
        (item) => item.id === config?.measure?.field.id,
    )
    const aggregateError =
        policyFieldInfos?.fields
            ?.map((o) => o.id)
            ?.includes(config?.measure?.field?.id) &&
        sensitivityFieldLimits.includes(config?.measure?.aggregate || '')
    if (
        currentField?.data_type !== config?.measure?.field.data_type ||
        aggregateError
    ) {
        errorMsg = FormulaError.ConfigError
    }
    if (currentField?.label_is_protected) {
        errorMsg = FormulaError.IsPolicy
    }

    if (preOutData.length === 0) {
        errorMsg = FormulaError.MissingData
    } else {
        outData = preOutData
    }
    node.replaceData({
        ...node.data,
        formula: formula.map((info) => {
            if (info.id === id) {
                return {
                    ...info,
                    // config: newConfig,
                    output_fields: outData,
                    errorMsg,
                }
            }
            return info
        }),
    })
    return {
        preOutData,
        outData,
        firstNodeData: getNodeData(n, fieldsData),
        secondNodeData: getNodeData(node, fieldsData),
        policyFieldInfos,
    }
}

/**
 * 原子指标算子检查
 * @graph 画布
 * @node 所在节点
 * @formulaItem 当前算子
 * @return preOutData前序输出结果 outData输出字段
 */
export const checkAtomFormulaConfig = async (
    graph: Graph,
    node: Node,
    formulaItem: IFormula,
    fieldsData: FieldsData,
) => {
    const { config, id } = formulaItem
    const { formula } = node.data
    let preOutData: IFormulaFields[] = []
    let outData: IFormulaFields[] = []
    let errorMsg: any
    const policyFieldInfos = await getPolicyFields(fieldsData.formId)

    // 前序节点
    const preNodes = getPreorderNode(graph.getNodes(), node)
    // 处理引用库表节点数据和度量算子所在节点
    const n = preNodes[0]
    const n1 = preNodes[1]
    // 引用库表节点
    preOutData = (n?.data?.output_fields || []).map((a) => ({
        ...a,
        source_node_id: n?.id,
    }))
    // 度量算子是否配置了
    const bool = n1?.data?.formula?.some(
        ({ config: c, type }) =>
            type === FormulaType.INDICATOR_MEASURE && c && !isEmpty(c),
    )
    const isConfig = config?.analysis_dimension_fields?.some((o) => {
        const originField = fieldsData.data.find((d) => d.id === o.field_id)
        return (
            originField?.label_is_protected ||
            policyFieldInfos?.fields
                ?.map((item) => item.id)
                ?.includes(o.field_id)
        )
    })
    if (isConfig) {
        errorMsg = FormulaError.ConfigError
    }
    if (!preOutData.length || !bool) {
        errorMsg = FormulaError.MissingData
    } else {
        outData = preOutData
    }
    node.replaceData({
        ...node.data,
        formula: formula.map((info) => {
            if (info.id === id) {
                return {
                    ...info,
                    // config: newConfig,
                    output_fields: outData,
                    errorMsg,
                }
            }
            return info
        }),
    })
    return {
        preOutData,
        outData,
        firstNodeData: getNodeData(n, fieldsData),
        secondNodeData: getNodeData(n1, fieldsData),
        policyFieldInfos,
    }
}
/**
 * 衍生指标原子算子检查
 * @node 所在节点
 * @formulaItem 当前算子
 * @return preOutData前序输出结果 outData输出字段
 */
export const checkDeAtomFormulaConfig = async (
    node: Node,
    formulaItem: IFormula,
    fieldsData: FieldsData,
    getDetail: (id: string) => any,
) => {
    const { formula } = node.data
    const { config, id } = formulaItem
    let outData: IFormulaFields[] = []
    let totalData: IFormulaFields[] = []
    let errorMsg: any
    let policyFieldInfos: any
    if (config) {
        const { form_id } = config
        if (form_id) {
            try {
                const getFunc = getDetail || getDatasheetViewDetails
                policyFieldInfos = await getPolicyFields(fieldsData.formId)
                const res = await getFunc(form_id)
                if (res) {
                    const tempEntries = res.fields?.filter(
                        (item) =>
                            changeTypeToLargeArea(item.data_type) !==
                                FieldTypes.BINARY &&
                            item.data_type !== null &&
                            item.data_type !== '',
                    )

                    totalData = tempEntries?.map((item) => ({
                        alias: item.business_name,
                        id: item.id,
                        name: item.business_name,
                        sourceId: node.id,
                        originName: item.business_name,
                        checked: true,
                        data_type: changeTypeToLargeArea(item.data_type),
                        name_en: item.technical_name,
                    }))
                    fieldsData.addData(
                        tempEntries?.map((item) => ({
                            ...item,
                            data_type: changeTypeToLargeArea(item.data_type),
                            name_en: item.technical_name,
                            dict_id: item.code_table_id || undefined,
                            dict_name: item.code_table || undefined,
                            standard_code: item.standard_code || undefined,
                            standard_name: item.standard || undefined,
                        })) || [],
                    )
                }
            } catch (err) {
                errorMsg = FormulaError.ConfigError
            }
        }
        const isConfig =
            config?.other?.catalogOptions?.analysis_dimensions?.some((o) => {
                const originField = fieldsData.data.find(
                    (d) => d.id === o.field_id,
                )
                return (
                    originField?.label_is_protected ||
                    policyFieldInfos?.fields
                        ?.map((item) => item.id)
                        ?.includes(o.field_id)
                )
            })
        if (isConfig) {
            errorMsg = FormulaError.IsPolicy
        }
        if (!totalData?.length) {
            errorMsg = FormulaError.ConfigError
        } else {
            outData = totalData
        }
    }
    node.replaceData({
        ...node.data,
        formula: formula.map((info) => {
            if (info.id === id) {
                return {
                    ...info,
                    output_fields: outData,
                    errorMsg,
                }
            }
            return info
        }),
    })
    return { errorMsg, outData, totalData, policyFieldInfos }
}

/**
 * 衍生算子检查
 * @graph 画布
 * @node 所在节点
 * @formulaItem 当前算子
 * @return preOutData前序输出结果 outData输出字段
 */
export const checkDerivedFormulaConfig = async (
    graph: Graph,
    node: Node,
    formulaItem: IFormula,
    fieldsData: FieldsData,
) => {
    const { config, id } = formulaItem
    const { formula } = node.data
    let preOutData: IFormulaFields[] = []
    let outData: IFormulaFields[] = []
    const policyFieldInfos = await getPolicyFields(fieldsData.formId)
    // let newConfig = config
    let errorMsg: any
    // 前序节点
    const preNodes = getPreorderNode(graph.getNodes(), node)
    // 处理引用库表节点数据和度量算子所在节点
    const n = preNodes[0]
    const n1 = preNodes[1]
    // 引用库表节点
    preOutData = (n?.data?.output_fields || []).map((a) => ({
        ...a,
        source_node_id: n?.id,
    }))
    const isConfig = config?.analysis_dimension_fields?.some((o) => {
        const originField = fieldsData.data.find((d) => d.id === o.field_id)
        return (
            originField?.label_is_protected ||
            policyFieldInfos?.fields
                ?.map((item) => item.id)
                ?.includes(o.field_id)
        )
    })
    if (isConfig) {
        errorMsg = FormulaError.IsPolicy
    }
    if (!preOutData.length) {
        errorMsg = FormulaError.MissingData
    } else {
        outData = preOutData
    }
    node.replaceData({
        ...node.data,
        formula: formula.map((info) => {
            if (info.id === id) {
                return {
                    ...info,
                    // config: newConfig,
                    output_fields: outData,
                    errorMsg,
                }
            }
            return info
        }),
    })
    return {
        preOutData,
        outData,
        firstNodeData: getNodeData(n, fieldsData),
        secondNodeData: getNodeData(n1, fieldsData),
        policyFieldInfos,
    }
}

// 获取逻辑实体数据
export const getLogicalData = async (
    objId: string,
    entityId: string,
): Promise<any[]> => {
    if (!objId) return Promise.resolve([])
    try {
        const { logic_entities } = await getBusinessObjDefine(objId)
        const attributes =
            logic_entities?.find((info) => info.id === entityId)?.attributes ||
            []
        const standardReqs = attributes
            .filter((info) => info.standard_info)
            .map((info) =>
                getDataEleDetailById({
                    type: 2,
                    value: info.standard_info!.id,
                }),
            )
        const standards = await Promise.allSettled(standardReqs)
        return Promise.resolve(
            attributes.map((info) => {
                const { id, name, standard_info, unique } = info
                let field: any = {
                    attrId: id,
                    primary_key: unique,
                    alias: name,
                    editError: [],
                    canChanged: true,
                    attribute_id: id,
                    attribute_name: name,
                    attribute_path: info.path,
                    label_id: info.label_id,
                    label_name: info.label_name,
                    label_icon: info.label_icon,
                    label_path: info.label_path,
                }
                if (standard_info) {
                    const std = (
                        standards?.find(
                            (s: any) =>
                                s?.value?.data?.code === standard_info.id,
                        ) as any
                    )?.value?.data
                    field = {
                        ...field,
                        data_type: standard_info.data_type,
                        standard_code: std.id,
                        standard_name: standard_info.name,
                        standard_deleted: std.deleted,
                        standard_state: std.state,
                        name_en: standard_info.name_en,
                        canChanged: false,
                    }
                    if (std?.dict_id) {
                        return {
                            ...field,
                            dict_id: std.dict_id,
                            dict_name: std.dict_name_cn,
                            dict_deleted: std.dict_deleted,
                            dict_state: std.dict_state,
                        }
                    }
                }
                return field
            }),
        )
    } catch (err) {
        formatError(err)
        return Promise.resolve([])
    }
}

/**
 * 获取当前节点的target节点
 * @graph 画布
 * @node 当前节点
 * @returns target节点集
 */
const getTargetNodes = (graph: Graph, node: Node) => {
    return graph
        .getEdges()
        .filter((edge: Edge) => edge.getSourceCellId() === node.id)
        .reduce((pre: Node[], cur) => {
            const findNode = cur.getTargetNode()
            if (findNode) {
                return [...pre, findNode]
            }
            return pre
        }, [])
}

/**
 * 计算画布内所有节点算子
 * @graph 画布
 */
export const trackingCalculationAll = async (
    graph: Graph,
    fieldsData: FieldsData,
    indicatorType: IndicatorType,
    getDetail: (id: string) => any,
) => {
    const nodes = graph.getNodes()
    const sourceNodes: Node[] = []
    nodes.forEach((info) => {
        info.replaceData({ ...info.data, output_fields: [], executable: false })
        if (info.data.src.length === 0) {
            sourceNodes.push(info)
        }
    })
    await loopCalculationNodeData(
        graph,
        sourceNodes,
        fieldsData,
        indicatorType,
        getDetail,
    )
}

/**
 * 循环计算节点内算子
 * @graph 画布
 * @nodes 节点集合
 */
export const loopCalculationNodeData = async (
    graph: Graph,
    nodes: Node[],
    fieldsData: FieldsData,
    indicatorType,
    getDetail: (id: string) => any,
) => {
    for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i]
        await trackingNodeCalculation(
            graph,
            node,
            fieldsData,
            indicatorType,
            getDetail,
        )
        const targetNodes = getTargetNodes(graph, node)
        await loopCalculationNodeData(
            graph,
            targetNodes,
            fieldsData,
            indicatorType,
            getDetail,
        )
    }
}

/**
 * 计算节点内算子
 * @graph 画布
 * @node 节点
 */
export const trackingNodeCalculation = async (
    graph: Graph,
    node: Node,
    fieldsData: FieldsData,
    indicatorType: IndicatorType,
    getDetail: (id: string) => any,
) => {
    if (!node?.data) return
    const { formula } = node.data
    let outData: IFormulaFields[] = []
    let errorMsg: FormulaError | undefined
    if (formula.length > 0) {
        for (let i = 0; i < formula.length; i += 1) {
            const item = formula[i]
            const { id, type, errorMsg: itemErrorMsg } = item
            errorMsg = itemErrorMsg
            if (!errorMsg) {
                switch (type) {
                    case FormulaType.FORM:
                        outData = (
                            await checkCiteViewFormulaConfig(
                                node,
                                item,
                                fieldsData,
                                getDetail,
                            )
                        ).outData
                        break
                    case FormulaType.WHERE:
                        outData = checkWhereFormulaConfig(
                            graph,
                            node,
                            item,
                            fieldsData,
                        ).outData
                        break
                    case FormulaType.INDICATOR_MEASURE:
                        outData = (
                            await checkCalculateFormulaConfig(
                                graph,
                                node,
                                item,
                                fieldsData,
                            )
                        ).outData
                        break
                    case FormulaType.ATOM:
                        outData =
                            indicatorType === IndicatorType.ATOM
                                ? (
                                      await checkAtomFormulaConfig(
                                          graph,
                                          node,
                                          item,
                                          fieldsData,
                                      )
                                  ).outData
                                : (
                                      await checkDeAtomFormulaConfig(
                                          node,
                                          item,
                                          fieldsData,
                                          getDetail,
                                      )
                                  ).outData
                        break
                    case FormulaType.DERIVED:
                        outData = (
                            await checkDerivedFormulaConfig(
                                graph,
                                node,
                                item,
                                fieldsData,
                            )
                        ).outData
                        break
                    default:
                        break
                }
                if (outData.length === 0) {
                    errorMsg = FormulaError.MissingData
                }
            } else {
                node.replaceData({
                    ...node.data,
                    // eslint-disable-next-line no-loop-func
                    formula: node.data.formula.map((info: IFormula) => {
                        if (info.id === id) {
                            return {
                                ...info,
                                errorMsg,
                            }
                        }
                        return info
                    }),
                })
            }
        }
    }
    node.replaceData({
        ...node.data,
        output_fields: outData,
        executable:
            node.data.formula.every((item) => !item.errorMsg) &&
            node.data.formula.some((item) => item?.config),
    })
}

export const getOutputFields = (data, fieldsData) =>
    data.map((a) => {
        const findItem = fieldsData.data.find((b) => b.id === a.id)
        return {
            ...a,
            id: a?.id || findItem.id,
            name_en: a?.name_en || findItem?.name_en,
            data_type: a?.data_type || findItem?.data_type,
        }
    })

export const replaceSqlStr = (str: string, c = '') => {
    if (!str) return ''
    return str.replace(/\[\[FFF\.\$\{|\}\]\]/g, c)
}

/** 指标单位选项 */
export const UnitOptions = UnitName.map((name, idx) => {
    return {
        label: <span style={{ color: 'rgba(0,0,0,0.45)' }}>{name}</span>,
        options: UnitType[idx].map((item) => ({ value: item, label: item })),
    }
})

export const snapToGridFun = (x: number, y: number): [number, number] => {
    const snappedX = Math.round(x / 32) * 32
    const snappedY = Math.round(y / 32) * 32
    return [snappedX, snappedY]
}

export const layerStyles: CSSProperties = {
    position: 'fixed',
    pointerEvents: 'none',
    zIndex: 100,
    left: 0,
    top: 0,
    // width: '100%',
    // height: '100%',
}

export const getItemStyles = (
    initialOffset: XYCoord | null,
    currentOffset: XYCoord | null,
    isSnapToGrid: boolean,
) => {
    if (!initialOffset || !currentOffset) {
        return {
            display: 'none',
        }
    }

    let { x, y } = currentOffset

    if (isSnapToGrid) {
        x -= initialOffset.x
        y -= initialOffset.y
        ;[x, y] = snapToGridFun(x, y)
        x += initialOffset.x
        y += initialOffset.y
    }

    const transform = `translate(${x}px, ${y}px)`
    return {
        transform,
        WebkitTransform: transform,
    }
}

export const resetNodeFormula = (
    graph?: Graph,
    formulaType?: FormulaType,
    indicatorType?: IndicatorType,
) => {
    const nodes = graph?.getNodes() || []

    const PreFormulaType =
        indicatorType === IndicatorType.ATOM
            ? FormulaType.FORM
            : FormulaType.ATOM

    for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i]

        if (formulaType === PreFormulaType) {
            const isPreNode = node.data.formula?.map(
                (o) => o.type === PreFormulaType,
            )
            const { executable, output_fields, selected, formula, ...other } =
                node.data
            const resetAttr = isPreNode
                ? { executable, output_fields, selected }
                : { executable: false, output_fields: [], selected: false }
            node.replaceData({
                ...other,
                ...resetAttr,
                formula: formula.map((info) => {
                    if (info.type !== PreFormulaType) {
                        const { id, type } = info
                        return {
                            id,
                            type,
                            errorMsg:
                                info.type === FormulaType.WHERE
                                    ? undefined
                                    : FormulaError.MissingData,
                            output_fields: [],
                        }
                    }
                    return info
                }),
            })
        } else if (formulaType === FormulaType.WHERE) {
            const nextFormulaType =
                indicatorType === IndicatorType.ATOM
                    ? FormulaType.INDICATOR_MEASURE
                    : FormulaType.DERIVED
            node.replaceData({
                ...node.data,
                formula: node.data.formula.map((info) => {
                    if (info.type === nextFormulaType && info?.config) {
                        return {
                            ...info,
                            errorMsg: FormulaError.NodeChange,
                        }
                    }
                    return info
                }),
            })
        } else if (formulaType === FormulaType.INDICATOR_MEASURE) {
            node.replaceData({
                ...node.data,
                formula: node.data.formula.map((info) => {
                    if (
                        ![
                            FormulaType.INDICATOR_MEASURE,
                            FormulaType.WHERE,
                            PreFormulaType,
                        ].includes(info.type) &&
                        info?.config
                    ) {
                        return {
                            ...info,
                            errorMsg: FormulaError.NodeChange,
                        }
                    }
                    return info
                }),
            })
        }
    }
}

export const checkUpdatedSycn = async (
    nodes: any[],
    indicatorType: IndicatorType,
    getDetail: (id: string, type?: DataType) => any,
) => {
    try {
        if (indicatorType === IndicatorType.ATOM) {
            const { form_id, config_fields, other } =
                nodes?.[0]?.data?.formula?.[0]?.config || {}
            const selectedItem = other?.catalogOptions || {}

            if (!form_id) return nodes
            // 校验库表
            const getFunc = getDetail || getDatasheetViewDetails
            const item = await getFunc(form_id)
            const fields = config_fields?.map((o) => {
                const cogItem = item?.fields?.find((i) => i?.id === o?.id)

                return cogItem
                    ? {
                          ...o,
                          alias: cogItem.business_name,
                          name: cogItem.business_name,
                          originName: cogItem.business_name,
                          name_en: cogItem.technical_name,
                          //   data_type: changeTypeToLargeArea(cogItem.data_type),
                      }
                    : o
            })

            const isUpdatedFields = !isEqualWith(fields, config_fields)

            return (nodes || []).map((node, idx) => {
                const formula = node?.data?.formula || []
                // eslint-disable-next-line no-param-reassign
                return {
                    ...node,
                    data: {
                        ...node.data,
                        formula: formula.map((info) => {
                            if (info.type === FormulaType.FORM) {
                                const options =
                                    info.config?.other?.catalogOptions
                                return {
                                    ...info,
                                    config: {
                                        ...info?.config,
                                        config_fields: isUpdatedFields
                                            ? fields
                                            : config_fields,
                                        other: {
                                            catalogOptions: {
                                                ...options,
                                                ...(item?.business_name !==
                                                selectedItem?.business_name
                                                    ? {
                                                          business_name:
                                                              item?.business_name,
                                                      }
                                                    : {}),
                                            },
                                        },
                                    },
                                }
                            }

                            if (
                                isUpdatedFields &&
                                idx === 1 &&
                                (formula?.length === 2
                                    ? info.type === FormulaType.WHERE
                                    : info.type ===
                                      FormulaType.INDICATOR_MEASURE) &&
                                info?.config
                            ) {
                                return {
                                    ...info,
                                    errorMsg: FormulaError.NodeChange,
                                }
                            }

                            return info
                        }),
                    },
                }
            })
        }

        if (indicatorType === IndicatorType.DERIVED) {
            const { atom_id, other } =
                nodes?.[0]?.data?.formula?.[0]?.config || {}
            const selectedItem = other?.catalogOptions || {}
            if (!atom_id) return nodes
            // 校验原子指标最新数据
            const item = await (getDetail
                ? getDetail(atom_id, DataType.Indicator)
                : getIndicatorDetail(atom_id))

            return (nodes || []).map((node) => {
                const formula = node?.data?.formula || []
                // eslint-disable-next-line no-param-reassign
                return {
                    ...node,
                    data: {
                        ...node.data,
                        formula: formula.map((info) => {
                            if (info.type === FormulaType.ATOM) {
                                return {
                                    ...info,
                                    config: {
                                        ...info.config,
                                        other: {
                                            catalogOptions: item,
                                        },
                                    },
                                }
                            }

                            if (
                                selectedItem?.exec_sql !== item?.exec_sql &&
                                info.type === FormulaType.DERIVED &&
                                info?.config
                            ) {
                                return {
                                    ...info,
                                    errorMsg: FormulaError.NodeChange,
                                }
                            }

                            return info
                        }),
                    },
                }
            })
        }
    } catch (error) {
        formatError(error)
    }

    return nodes
}

const getGroupRelateHeight = (rules) => {
    // 全部行数
    const rulesLen = rules.reduce((prev, curr, index) => {
        return prev + (curr.member.length ? curr.member.length : 0)
    }, 0)
    // 组数
    const groupLen = rules.length
    // 第一组的行数
    const firstGroupLen = rules[0].member.length
    // 最后一组的行数
    const lastGroupLen = rules[groupLen - 1].member.length

    // 组连接线高度 = 总高度 - 第一组高度的一半 - 最后一组高度的一半
    const gHeight =
        rulesLen * ROW_HEIGHT +
        (rulesLen - 1) * ROW_MARGIN -
        (firstGroupLen * ROW_HEIGHT + (firstGroupLen - 1) * ROW_MARGIN) / 2 -
        (lastGroupLen * ROW_HEIGHT + (lastGroupLen - 1) * ROW_MARGIN) / 2

    return gHeight
}

export const getRestrictView = (where, where_relation) => {
    const members = where
    return (
        <div className={styles['view-rule-wrapper']}>
            <div className={styles['rule-container']}>
                {
                    // Todo 联调时根据后端结果适配
                    members.length > 1 && (
                        <div
                            className={styles['group-relate']}
                            style={{
                                height: getGroupRelateHeight(members),
                                marginTop:
                                    (members[0].member.length * ROW_HEIGHT +
                                        (members[0].member.length - 1) *
                                            ROW_MARGIN) /
                                    2,
                            }}
                        >
                            <div className={styles['relate-text']}>
                                {where_relation === 'and' ? __('且') : __('或')}
                            </div>
                            <div style={{ width: '48px' }}>&nbsp;</div>
                        </div>
                    )
                }
                <div className={styles['rule-groups']}>
                    {members.map((currentMember, index) => {
                        const { member, relation } = currentMember
                        return (
                            <div className={styles['rule-group']}>
                                {member.length <= 1 && members.length <= 1 ? (
                                    ''
                                ) : (
                                    <div
                                        className={styles['row-relate']}
                                        style={{
                                            height:
                                                member.length * ROW_HEIGHT +
                                                (member.length - 1) *
                                                    ROW_MARGIN -
                                                ROW_HEIGHT,
                                        }}
                                    >
                                        <div className={styles['relate-text']}>
                                            {relation === 'or' ? '或' : '且'}
                                        </div>
                                    </div>
                                )}
                                <div className={styles['rule-rows']}>
                                    {member.map((item) => (
                                        <div className={styles['rule-row']}>
                                            <div
                                                className={styles['field-name']}
                                            >
                                                {getFieldTypeIcon(
                                                    item?.field?.date_type,
                                                )}
                                                {item?.field?.business_name}
                                            </div>
                                            <div
                                                className={
                                                    styles['field-condition']
                                                }
                                            >
                                                {
                                                    fieldInfos[
                                                        changeFormatToType(
                                                            item?.field
                                                                ?.date_type,
                                                        )
                                                    ]?.limitListOptions?.find(
                                                        (currentLimit) =>
                                                            currentLimit.value ===
                                                            item.operator,
                                                    )?.label
                                                }
                                            </div>
                                            <div
                                                className={
                                                    styles['field-value']
                                                }
                                                style={{
                                                    width:
                                                        members.length > 1
                                                            ? '312px'
                                                            : '360px',
                                                }}
                                            >
                                                {getDateDisplay(
                                                    item.value,
                                                    item.operator,
                                                    item?.field?.date_type,
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
