import React, { useState, useEffect } from 'react'
import { Collapse, Space, Tag, Table, Divider, Tooltip } from 'antd'
import { CaretDownOutlined, CaretRightOutlined } from '@ant-design/icons'
import classnames from 'classnames'
import { LimitModellined, LimitFieldlined, RefreshOutlined } from '@/icons'
import {
    getIndicatorDetails,
    formatError,
    viewIndicator,
    getIndicatorList,
} from '@/core'
import Icons from './Icons'
import styles from './styles.module.less'
import {
    groupObj,
    limitRelation,
    Operation,
    PolymerValue,
    GroupValue,
    OperatorObj,
    limitDate,
    limitAndBelongList,
} from './const'
import Empty from '@/ui/Empty'
import dataEmpty from '@/assets/dataEmpty.svg'
import __ from './locale'

const { Panel } = Collapse

const ConfigDrawer = ({
    modelId,
    indicatorId,
    graphData,
    dataTypeOptions,
}: any) => {
    const [fieldList, setFieldList] = useState<any>([])
    const [metricObj, setMetricObj] = useState<any>({})
    const [loading, setLoading] = useState(false)
    const [nameStr, setNameStr] = useState('')
    const [descStr, setDescStr] = useState('')
    const [viewColumns, setViewColumns] = useState([])
    const [viewData, setViewData] = useState([])
    const [activeKey, setActiveKey] = useState<string | string[]>([
        '1',
        '2',
        '3',
    ])
    const [viewIndicatorStatus, setViewIndicatorStatus] =
        useState<boolean>(false)

    useEffect(() => {
        getFieldData()
        setActiveKey(['1', '2', '3'])
        setViewColumns([])
        setViewData([])
    }, [indicatorId])

    useEffect(() => {
        getMetricList()
    }, [modelId])

    useEffect(() => {
        if (
            fieldList.length > 0 &&
            metricObj &&
            Object.keys(metricObj).length > 0
        ) {
            getindicatorDetail()
        }
    }, [indicatorId, fieldList, metricObj])

    // 通过画布数据拿到字段信息
    const getFieldData = () => {
        const newField: any = []
        if (graphData && graphData.length > 0) {
            graphData.forEach((item) => {
                let obj: any = {}
                item?.data.items.forEach((subitem) => {
                    obj = {
                        name: subitem.name,
                        field_id: subitem.id,
                        data_type:
                            dataTypeOptions.length > 0 &&
                            dataTypeOptions.find((it) => {
                                return it.value_en === subitem.data_type
                            })?.value,
                    }
                    newField.push(obj)
                })
            })
            setFieldList(newField)
        }
    }
    // 根据模型获取指标列表
    const getMetricList = async () => {
        try {
            if (modelId) {
                const res = await getIndicatorList(modelId)
                if (res && res.length) {
                    const obj: any = {}
                    res.forEach((item) => {
                        obj[item.indicator_id] = item.name
                    })
                    setMetricObj(obj)
                }
            }
        } catch (ex) {
            formatError(ex)
        }
    }
    /**
     * 获取指标详情
     */
    const getindicatorDetail = async () => {
        try {
            const res = await getIndicatorDetails(indicatorId)
            const { rule, desc, name } = res
            const { measure, where, group } = rule
            setNameStr(name)
            setDescStr(desc)
            const newMeasure: any = []
            measure.member.forEach((item) => {
                if (item.type === 'field') {
                    const newobj = fieldList.find(
                        (subItem) =>
                            subItem?.field_id === item.object.field_id[1],
                    )
                    if (newobj) {
                        newMeasure.push({
                            ...newobj,
                            type: item.type,
                            field_id: item.object.field_id,
                            operation: measure.operator,
                            aggregate: item.object.aggregate,
                            isExist: true,
                        })
                    } else {
                        newMeasure.push({
                            isExist: false,
                            type: item.type,
                            field_id: item.object.field_id,
                            operation: measure.operator,
                            aggregate: item.object.aggregate,
                        })
                    }
                } else {
                    newMeasure.push({
                        type: item.type,
                        name: metricObj[item.object.parent_indicator],
                        operation: measure.operator,
                        parent_indicator: item.object.parent_indicator,
                        isExist: !!metricObj[item.object.parent_indicator],
                    })
                }
            })

            const newGroup: any = []
            group.forEach((item) => {
                const newobj = fieldList.find(
                    (subItem) => subItem?.field_id === item.field_id[1],
                )
                if (newobj) {
                    newGroup.push({
                        ...newobj,
                        field_id: item.field_id,
                        format: item.format,
                        isExist: true,
                    })
                } else {
                    newGroup.push({
                        field_id: item.field_id,
                        format: item.format,
                        isExist: false,
                    })
                }
            })

            // 过滤数据
            const newLimit: any = []
            where.forEach((item) => {
                const limit: any = {
                    relation: item.relation,
                    member: [],
                }
                item.member.forEach((subItem) => {
                    let subObj: any = {
                        field_id: subItem.field_id,
                        operator: subItem.operator,
                        value: subItem.value,
                        newValue: subItem.value,
                    }
                    const newobj = fieldList.find(
                        (fieldItem) =>
                            fieldItem?.field_id === subItem.field_id[1],
                    )
                    if (newobj) {
                        subObj = {
                            ...newobj,
                            ...subObj,
                            isExist: true,
                        }
                        if (limitDate.includes(subItem.operator)) {
                            const newValue = subItem.value
                                .replace(/minute/g, '分钟')
                                .replace(/hour/g, '小时')
                                .replace(/month/g, '月')
                                .replace(/week/g, '周')
                                .replace(/year/g, '年')
                                .replace(/day/g, '天')
                                .replace(/minute/g, '分钟')
                                .replace(/hour/g, '小时')
                                .replace(/%Y-%m-%d %H:%i/g, '分钟')
                                .replace(/%Y-%m-%d %H/g, '小时')
                                .replace(/%Y-%m-%d/g, '天')
                                .replace(/%x-%v/g, '周')
                                .replace(/%Y-%m/g, '月')
                                .replace(/%Y/g, '年')
                            subObj = {
                                ...newobj,
                                ...subObj,
                                newValue,
                            }
                        } else if (
                            limitAndBelongList.includes(subItem.operator)
                        ) {
                            // 属于或者在码表中
                            const newValue: any = subItem.value.split(',')
                            subObj = {
                                ...newobj,
                                ...subObj,
                                newValue,
                            }
                        }
                    } else {
                        subObj = {
                            ...subObj,
                            isExist: false,
                        }
                    }
                    limit.member.push(subObj)
                })
                newLimit.push(limit)
            })
            setMeasureData(newMeasure)
            setGroupData(newGroup)
            setWhereData(newLimit)
        } catch (ex) {
            formatError(ex)
        }
    }
    // 度量数据
    const [measureData, setMeasureData] = useState<any>([
        {
            type: 'field',
            field_id: '',
            name: '',
            parent_indicator: '',
            aggregate: '',
            operation: '',
        },
    ])
    // 过滤数据
    const [whereData, setWhereData] = useState([
        {
            member: [
                {
                    field_id: '',
                    operator: '',
                    value: '',
                    newValue: '',
                    name: '',
                    data_type: '',
                    isExist: false,
                },
            ],
            relation: '',
        },
    ])
    // 分组数据
    const [groupData, setGroupData] = useState<groupObj[]>([
        {
            format: '',
            field_id: [],
            name: '',
            data_type: '',
            isExist: false,
        },
    ])

    // 或者规则部分的入参数据
    const getParams = () => {
        const measureArr: any = []
        measureData.forEach((item) => {
            let obj: any = {}
            if (item.type === 'field') {
                obj = {
                    type: item.type,
                    object: {
                        aggregate: item.aggregate,
                        field_id: item.field_id,
                    },
                }
            } else {
                obj = {
                    type: item.type,
                    object: {
                        parent_indicator: item.parent_indicator,
                    },
                }
            }
            measureArr.push(obj)
        })

        const newGroup: any = []
        groupData.forEach((item) => {
            let obj = {}
            if (item.field_id && item.field_id[0] && item.field_id[1]) {
                obj = {
                    format: item.format,
                    field_id: item.field_id,
                }
            }
            newGroup.push(obj)
        })

        const newWhere: any = []
        whereData.forEach((item) => {
            const { member, relation } = item
            const newMember: any = []
            member.forEach((subItem) => {
                const subObj: any = {
                    field_id: subItem.field_id,
                    operator: subItem.operator,
                    value: subItem.value,
                }
                newMember.push(subObj)
            })
            newWhere.push({
                relation,
                member: newMember,
            })
        })
        const params = {
            measure: {
                member: measureArr,
                operator: measureData[0].operation,
            },
            group: newGroup,
            where: newWhere,
        }
        return params
    }
    // 指标预览
    const changeColKey = async (key: string | string[]) => {
        try {
            if (key.includes('3')) {
                setLoading(true)
                const params = {
                    name: nameStr,
                    desc: descStr,
                    indicator_model: modelId,
                    rule: getParams(),
                }
                const res = await viewIndicator(params)
                const { columns } = res
                const dataSource =
                    res.data.length > 20 ? res.data.slice(0, 20) : res.data
                setViewColumns(
                    columns.map((item, index) => ({
                        key: index,
                        dataIndex: item.name,
                        title: item.name,
                        render: (text) => (
                            <div className={styles.ellipsis} title={text}>
                                {text}
                            </div>
                        ),
                    })),
                )
                const newViewData: any = []
                dataSource.forEach((outItem, i) => {
                    const obj: any = {}
                    outItem.forEach((innerItem, j) => {
                        const value = columns[j].name
                        obj.key = i
                        obj[value] = innerItem
                    })
                    newViewData.push(obj)
                })
                setViewData(newViewData)
            }
        } catch (ex) {
            // formatError(ex)
        } finally {
            setLoading(false)
        }
    }
    // 渲染过滤的value
    const renderLimitVal = (type, value) => {
        if (limitAndBelongList.includes(type)) {
            return value.map((item) => {
                return <Tag title={item}>{item}</Tag>
            })
        }
        return value
    }
    const getExpandIcon = (panelProps) => {
        return panelProps.isActive ? (
            <CaretDownOutlined className={styles.arrowIcon} />
        ) : (
            <CaretRightOutlined className={styles.arrowIcon} />
        )
    }

    return (
        <div className={styles.ConfigDrawer}>
            <div className={styles.content}>
                <Collapse
                    activeKey={activeKey}
                    bordered={false}
                    ghost
                    onChange={(key) => {
                        setActiveKey(key)
                        if (key.includes('3') && !viewIndicatorStatus) {
                            setViewIndicatorStatus(true)
                            changeColKey(key)
                        } else if (!key.includes('3')) {
                            setViewIndicatorStatus(false)
                        }
                    }}
                    expandIcon={getExpandIcon}
                >
                    <Panel header="基本信息" key="1">
                        <div className={styles.basicInfo}>
                            <div className={styles.basicLabel}>指标名称：</div>
                            <div className={styles.basicValue} title={nameStr}>
                                {nameStr}
                            </div>
                        </div>
                        <div className={styles.basicInfo}>
                            <div className={styles.basicLabel}>描述：</div>
                            <div className={styles.basicValue} title={descStr}>
                                {descStr || '--'}
                            </div>
                        </div>
                    </Panel>
                    <Panel header="指标规则" key="2">
                        {measureData.length > 0 && (
                            <div className={styles.title}>
                                <span>度量</span>
                            </div>
                        )}
                        <div className={styles.measureDetail}>
                            {measureData[0].isExist ? (
                                <div className={styles.measureItem}>
                                    {measureData[0].type === 'field' ? (
                                        <LimitFieldlined />
                                    ) : (
                                        <LimitModellined />
                                    )}
                                    <span
                                        className={styles.fieldId}
                                        title={measureData[0].name}
                                    >
                                        {measureData[0].name}
                                    </span>
                                    <span className={styles.aggregate}>
                                        {PolymerValue[measureData[0].aggregate]}
                                    </span>
                                </div>
                            ) : (
                                <div className={styles.measureItemNotExist}>
                                    {measureData[0].type === 'field'
                                        ? __('当前模型不存在该字段，请检查')
                                        : __('该指标已被删除，请检查')}
                                </div>
                            )}
                            {measureData.length > 1 && (
                                <>
                                    <div className={styles.operator}>
                                        {measureData[0].operation &&
                                            Operation[measureData[0].operation]}
                                    </div>
                                    {measureData[1].isExist ? (
                                        <div className={styles.measureItem}>
                                            {measureData[1].type === 'field' ? (
                                                <LimitFieldlined />
                                            ) : (
                                                <LimitModellined />
                                            )}
                                            <span
                                                className={styles.fieldId}
                                                title={measureData[1].name}
                                            >
                                                {measureData[1].name}
                                            </span>
                                            <span className={styles.aggregate}>
                                                {
                                                    PolymerValue[
                                                        measureData[1].aggregate
                                                    ]
                                                }
                                            </span>
                                        </div>
                                    ) : (
                                        <div
                                            className={
                                                styles.measureItemNotExist
                                            }
                                        >
                                            {measureData[1].type === 'field'
                                                ? __(
                                                      '当前模型不存在该字段，请检查',
                                                  )
                                                : __('该指标已被删除，请检查')}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {whereData.length > 0 && (
                            <div className={styles.title}>
                                <span>{__('过滤')}</span>
                            </div>
                        )}

                        <div className={styles.limitDetail}>
                            {whereData.map((whereItem, whereIndex) => {
                                return (
                                    <>
                                        <div className={styles.limitRow}>
                                            {whereItem.member[0].isExist ? (
                                                <div
                                                    className={
                                                        styles.limit_left
                                                    }
                                                >
                                                    <div
                                                        className={
                                                            styles.limitItem
                                                        }
                                                    >
                                                        <Icons
                                                            type={
                                                                whereItem
                                                                    .member[0]
                                                                    .data_type
                                                            }
                                                        />
                                                        <span
                                                            className={
                                                                styles.fieldId
                                                            }
                                                            title={
                                                                whereItem
                                                                    .member[0]
                                                                    .name
                                                            }
                                                        >
                                                            {
                                                                whereItem
                                                                    .member[0]
                                                                    .name
                                                            }
                                                        </span>
                                                        <span
                                                            className={
                                                                styles.aggregate
                                                            }
                                                        >
                                                            {
                                                                OperatorObj[
                                                                    whereItem
                                                                        .member[0]
                                                                        .operator
                                                                ]
                                                            }
                                                        </span>
                                                    </div>
                                                    <div
                                                        className={
                                                            styles.limit_value
                                                        }
                                                    >
                                                        <span
                                                            className={
                                                                styles.limitSpan
                                                            }
                                                            title={
                                                                whereItem
                                                                    .member[0]
                                                                    .newValue
                                                            }
                                                        >
                                                            {renderLimitVal(
                                                                whereItem
                                                                    .member[0]
                                                                    .operator,
                                                                whereItem
                                                                    .member[0]
                                                                    .newValue,
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div
                                                    className={
                                                        styles.limit_leftNotExist
                                                    }
                                                >
                                                    {__(
                                                        '当前模型不存在该字段，请检查',
                                                    )}
                                                </div>
                                            )}
                                            {whereItem.member.length > 1 && (
                                                <>
                                                    <div
                                                        className={
                                                            styles.operator
                                                        }
                                                    >
                                                        {
                                                            limitRelation[
                                                                whereItem
                                                                    .relation
                                                            ]
                                                        }
                                                    </div>
                                                    {whereItem.member[1]
                                                        .isExist ? (
                                                        <div
                                                            className={
                                                                styles.limit_left
                                                            }
                                                        >
                                                            <div
                                                                className={
                                                                    styles.limitItem
                                                                }
                                                            >
                                                                <Icons
                                                                    type={
                                                                        whereItem
                                                                            .member[1]
                                                                            .data_type
                                                                    }
                                                                />
                                                                <span
                                                                    className={
                                                                        styles.fieldId
                                                                    }
                                                                    title={
                                                                        whereItem
                                                                            .member[1]
                                                                            .name
                                                                    }
                                                                >
                                                                    {
                                                                        whereItem
                                                                            .member[1]
                                                                            .name
                                                                    }
                                                                </span>
                                                                <span
                                                                    className={
                                                                        styles.aggregate
                                                                    }
                                                                >
                                                                    {
                                                                        OperatorObj[
                                                                            whereItem
                                                                                .member[1]
                                                                                .operator
                                                                        ]
                                                                    }
                                                                </span>
                                                            </div>
                                                            <div
                                                                className={
                                                                    styles.limit_value
                                                                }
                                                            >
                                                                <span
                                                                    className={
                                                                        styles.limitSpan
                                                                    }
                                                                    title={
                                                                        whereItem
                                                                            .member[1]
                                                                            .newValue
                                                                    }
                                                                >
                                                                    {renderLimitVal(
                                                                        whereItem
                                                                            .member[1]
                                                                            .operator,
                                                                        whereItem
                                                                            .member[1]
                                                                            .newValue,
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div
                                                            className={
                                                                styles.limit_leftNotExist
                                                            }
                                                        >
                                                            {__(
                                                                '当前模型不存在该字段，请检查',
                                                            )}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                        {whereIndex !==
                                            whereData.length - 1 && (
                                            <Divider
                                                style={{
                                                    fontSize: '14px',
                                                    color: 'rgba(0,0,0,0.45)',
                                                }}
                                            >
                                                且
                                            </Divider>
                                        )}
                                    </>
                                )
                            })}
                        </div>
                        {groupData.length > 0 && (
                            <div className={styles.title}>
                                <span>分组</span>
                            </div>
                        )}
                        <div className={styles.measureDetail}>
                            {groupData.length > 0 ? (
                                groupData[0].isExist ? (
                                    <div className={styles.measureItem}>
                                        <Icons type={groupData[0].data_type} />
                                        <span
                                            className={styles.fieldId}
                                            title={groupData[0].name}
                                        >
                                            {groupData[0].name}
                                        </span>
                                        <span className={styles.aggregate}>
                                            {groupData[0].format &&
                                                GroupValue[groupData[0].format]}
                                        </span>
                                    </div>
                                ) : (
                                    <div className={styles.measureItemNotExist}>
                                        {__('当前模型不存在该字段，请检查')}
                                    </div>
                                )
                            ) : null}

                            {groupData.length > 1 && (
                                <>
                                    <div className={styles.empty}>{` `}</div>
                                    {groupData[1].isExist ? (
                                        <div className={styles.measureItem}>
                                            <Icons
                                                type={groupData[1].data_type}
                                            />
                                            <span
                                                className={styles.fieldId}
                                                title={groupData[1].name}
                                            >
                                                {groupData[1].name}
                                            </span>
                                            <span className={styles.aggregate}>
                                                {groupData[1].format &&
                                                    GroupValue[
                                                        groupData[1].format
                                                    ]}
                                            </span>
                                        </div>
                                    ) : (
                                        <div
                                            className={
                                                styles.measureItemNotExist
                                            }
                                        >
                                            {__('当前模型不存在该字段，请检查')}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </Panel>
                    <Panel
                        header={
                            <div className={styles.dataPreviewTitle}>
                                <div className={styles.titleBar}>
                                    <div>{__('数据预览')}</div>
                                    <Tooltip
                                        placement="bottom"
                                        title={__('刷新')}
                                    >
                                        <div
                                            className={classnames(
                                                styles.titleBtn,
                                                loading && styles.revolve,
                                            )}
                                            onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                changeColKey(['3'])
                                                setLoading(true)
                                            }}
                                        >
                                            <RefreshOutlined />
                                        </div>
                                    </Tooltip>
                                </div>
                                <div>
                                    <span className={styles.dataPreviewTips}>
                                        {__('（仅展示部分数据）')}
                                    </span>
                                </div>
                            </div>
                        }
                        key="3"
                    >
                        {viewData.length > 0 || loading ? (
                            <Table
                                columns={viewColumns}
                                dataSource={viewData}
                                loading={loading}
                                pagination={false}
                            />
                        ) : (
                            <Empty
                                iconSrc={dataEmpty}
                                desc={
                                    <div className={styles.emptyDesc}>
                                        <div>
                                            指标规则中存在字段所属业务表未加工
                                        </div>
                                        <div>无法进行数据预览</div>
                                    </div>
                                }
                            />
                        )}
                    </Panel>
                </Collapse>
            </div>
        </div>
    )
}

export default ConfigDrawer
