import React, { memo, useEffect, useState } from 'react'
import { Col, Collapse, Row, Space, Tag, Tooltip, message } from 'antd'
import moment from 'moment'
import { AssetTypeEnum, IDatasheetField, ISubView } from '@/core'
import styles from './styles.module.less'
import { FilterHeader } from './RowAndColFilter'
import __ from './locale'
import { FieldRender } from './ColFilter'
import { Empty } from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'
import {
    BelongList,
    OperatorObj,
    beforeDateOptions,
    beforeDateTimeOptions,
    beforeTime,
    codeTableList,
    currentDataTimeOptions,
    currentDateOptions,
    currentTime,
    limitBoolean,
    limitNumber,
    limitString,
} from './const'
import { DATA_TYPE_MAP } from '@/utils'

const { Panel } = Collapse
type IAttr = Pick<ISubView, 'name' | 'detail'>

interface IRowColView {
    value?: IAttr
    fields?: IDatasheetField[]
    showTip?: boolean
    type?: AssetTypeEnum
}

export const headerRender = (title: string, desc?: string) => {
    return (
        <div className={styles['filter-header']}>
            <span className={styles['filter-header-title']}>{title}</span>
            {desc && (
                <span className={styles['filter-header-desc']}>({desc})</span>
            )}
        </div>
    )
}

// 限定列
const ColCard = memo(({ value }: { value?: IDatasheetField[] }) => {
    return (
        <div className={styles['col-card']}>
            {value?.length ? (
                <div className={styles['col-card-list']}>
                    <Row style={{ height: '100%', overflowY: 'hidden' }}>
                        {value?.map((field) => {
                            return (
                                <Col
                                    key={field.id}
                                    span={4}
                                    style={{ lineHeight: 2.2 }}
                                >
                                    {FieldRender(field)}
                                </Col>
                            )
                        })}
                    </Row>
                </div>
            ) : (
                <div className={styles['filter-empty']}>
                    <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
                </div>
            )}
        </div>
    )
})

const RelationText = {
    and: '且',
    or: '或',
}

const transFields = (members) => {
    return (members || []).map((member) => ({
        id: member?.id,
        business_name: member?.name,
        technical_name: member?.name_en,
        data_type: member?.data_type,
        operator: OperatorObj?.[member?.operator]?.replace(/\(|\)/g, ''),
        value: transValue(member),
    }))
}

const transRelation = (relation) => {
    return RelationText?.[relation] || '无'
}

// 结果值转化
const transValue = (item) => {
    const { data_type, operator, value } = item || {}

    if (DATA_TYPE_MAP.number.includes(data_type)) {
        if (BelongList.includes(operator)) {
            const its = value.split(',')
            return (
                <Space direction="horizontal" size={4}>
                    {its?.slice(0, 3)?.map((o) => (
                        <div key={o} className={styles.valTag} title={o}>
                            {o}
                        </div>
                    ))}
                    {its?.length > 3 && (
                        <div
                            className={styles.valTag}
                            title={its?.slice(3)?.join(',')}
                        >
                            + {its.length - 3} ...
                        </div>
                    )}
                </Space>
            )
        }

        return value
    }
    if (DATA_TYPE_MAP.char.includes(data_type)) {
        if (BelongList.includes(operator)) {
            const its = value.split(',') || []
            return (
                <Space direction="horizontal" size={4}>
                    {its?.slice(0, 3)?.map((o) => (
                        <div key={o} className={styles.valTag} title={o}>
                            {o}
                        </div>
                    ))}
                    {its?.length > 3 && (
                        <div
                            className={styles.valTag}
                            title={its?.slice(3)?.join(',')}
                        >
                            +{its.length - 3}...
                        </div>
                    )}
                </Space>
            )
        }
        return value
    }
    if (DATA_TYPE_MAP.bool.includes(data_type)) {
        return value
    }
    if (
        [
            ...DATA_TYPE_MAP.date,
            ...DATA_TYPE_MAP.datetime,
            ...DATA_TYPE_MAP.timestamp,
        ].includes(data_type)
    ) {
        if (beforeTime.includes(operator)) {
            const [firstData, secondData] = value.split(' ')
            const options = DATA_TYPE_MAP.date.includes(data_type)
                ? beforeDateOptions
                : beforeDateTimeOptions

            const it = options?.find((o) => o.value === secondData)
            return `${firstData}${it?.label}`
        }
        if (currentTime.includes(operator)) {
            const options = DATA_TYPE_MAP.date.includes(data_type)
                ? currentDateOptions
                : currentDataTimeOptions
            const it = options?.find((o) => o.value === value)
            return it?.label
        }

        if (!operator) {
            return value
        }

        const [st, et] = value.split(',')
        return `${moment(st).format('YYYY-MM-DD HH:mm')}${
            et ? ' - ' : ''
        }${moment(et).format('YYYY-MM-DD HH:mm')}`
    }

    return item.value
}

const getContentHight = (num: number) => {
    if (num === 1) return 0
    return 48 * (num - 1)
}

// 限定行
export const RowCard = memo(({ value }: any) => {
    const [data, setData] = useState<any>()
    const [innerStyle, setInnerStyle] = useState<any[]>()
    const [outerStyle, setOuterStyle] = useState<any>()
    const [isOneLevel, setIsOneLevel] = useState<boolean>(false)
    const [isOnlyOne, setIsOnlyOne] = useState<boolean>(false)
    useEffect(() => {
        if (value) {
            const groups = value.where || []
            setIsOneLevel(!groups?.some((o) => o?.member?.length > 1))
            setIsOnlyOne(
                groups?.length === 1, // && groups[0]?.member?.length === 1
            )
            const Obj = {
                where: groups.map((o) => ({
                    member: transFields(o?.member),
                    relation: transRelation(o?.relation),
                })),
                where_relation: transRelation(value.where_relation),
            }
            setData(Obj)
            let count = 0
            const heights = groups.map((o) => {
                const height = getContentHight(o.member?.length || 1)
                count += o.member?.length || 0
                return height
            })

            const sty = heights?.map((h) => ({
                height: `${h}px`,
                top: `-${h / 2}px`,
            }))

            setInnerStyle(sty)
            const countHeight = getContentHight(count || 1)
            const outHeight =
                countHeight - heights[0] / 2 - heights[sty.length - 1] / 2
            setOuterStyle({
                height: `${outHeight}px`,
                top: `-${countHeight / 2 - heights[0] / 2}px`,
            })
        }
    }, [value])

    return (
        <div className={styles['row-card']} id="row-col-card">
            {value?.where?.length ? (
                <div className={styles['row-card-outer']}>
                    <div
                        className={styles['row-card-outer-relation']}
                        hidden={isOnlyOne}
                    >
                        <div className={styles.line} style={outerStyle} />
                        <div className={styles.relation}>
                            {data?.where_relation}
                        </div>
                    </div>
                    <div className={styles['row-card-outer-line']}>
                        {data?.where?.map((item, idx) => (
                            <div className={styles['row-card-inner']}>
                                <div
                                    className={
                                        styles['row-card-inner-relation']
                                    }
                                    hidden={isOneLevel}
                                >
                                    {item?.member?.length <= 1 ? (
                                        (idx === 0 ||
                                            idx + 1 ===
                                                data?.where?.length) && (
                                            <div
                                                className={styles.singleLine}
                                                style={{
                                                    top: idx === 0 ? 0 : '-1px',
                                                }}
                                            />
                                        )
                                    ) : (
                                        <div
                                            className={styles.line}
                                            style={innerStyle?.[idx]}
                                        />
                                    )}
                                    <div
                                        className={styles.relation}
                                        hidden={item?.member?.length <= 1}
                                    >
                                        {item?.relation}
                                    </div>
                                </div>
                                <div className={styles['inner-lines']}>
                                    {item?.member?.map((it) => (
                                        <div
                                            className={
                                                styles['inner-lines-item']
                                            }
                                        >
                                            <div>{FieldRender(it)}</div>
                                            <div>{it?.operator}</div>
                                            <div>
                                                <div
                                                    className="value-text"
                                                    title={
                                                        typeof it?.value ===
                                                        'string'
                                                            ? it?.value
                                                            : ''
                                                    }
                                                >
                                                    {it?.value || ''}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className={styles['filter-empty']}>
                    <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
                </div>
            )}
        </div>
    )
})

export const labelTextMap = {
    [AssetTypeEnum.SubView]: {
        colTitle: __('限定列'),
        colDesc: __('拥有权限的列字段'),
        rowTitle: __('限定行'),
        rowDesc: __('拥有权限的行数据'),
    },
    [AssetTypeEnum.Dim]: {
        colTitle: __('限定分析维度'),
        colDesc: __('拥有权限的维度字段'),
        rowTitle: __('限定维度值'),
        rowDesc: __('拥有权限的维度数据'),
    },
}

/** 行列展示 */
function RowColView({
    fields,
    value,
    showTip = true,
    type = AssetTypeEnum.SubView,
}: IRowColView) {
    const [activeKey, setActiveKey] = useState<string[]>(['col', 'row'])
    const [cols, setCols] = useState<IDatasheetField[]>()
    const [rows, setRows] = useState<any[]>()
    useEffect(() => {
        const data = JSON.parse(value?.detail || '{}')
        const permissionFieldIds = (data?.fields || [])?.map((o) => o.id)
        const permissionFields = fields
            ?.filter((o) => permissionFieldIds.includes(o.id))
            .map((o) => {
                const origin = data?.fields?.find((f) => f.id === o.id) || {}
                const cur = {
                    ...o,
                    ...origin,
                }
                return cur
            })
        setCols(permissionFields)
        setRows(data?.row_filters)
    }, [value, fields])

    return (
        <div className={styles['row-col-filter']} id="row-col">
            <Collapse
                bordered={false}
                ghost
                activeKey={activeKey}
                onChange={(keys) => setActiveKey(keys as string[])}
            >
                <Panel
                    header={FilterHeader(
                        headerRender(
                            labelTextMap[type].colTitle,
                            showTip ? labelTextMap[type].colDesc : undefined,
                        ),
                        activeKey.includes('col'),
                    )}
                    key="col"
                    showArrow={false}
                >
                    <ColCard value={cols} />
                </Panel>

                <Panel
                    header={FilterHeader(
                        headerRender(
                            labelTextMap[type].rowTitle,
                            showTip ? labelTextMap[type].rowDesc : undefined,
                        ),
                        activeKey.includes('row'),
                    )}
                    key="row"
                    showArrow={false}
                >
                    <RowCard value={rows} />
                </Panel>
            </Collapse>
        </div>
    )
}

export default memo(RowColView)
