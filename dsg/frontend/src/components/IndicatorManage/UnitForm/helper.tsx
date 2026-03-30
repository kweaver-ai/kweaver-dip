import React, { ReactNode } from 'react'
import { Graph, Node } from '@antv/x6'
import { Button, Popover, Tooltip } from 'antd'
import {
    CheckOutlined,
    InfoCircleOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
} from '@ant-design/icons'
import classnames from 'classnames'
import moment from 'moment'
import { getVirtualEngineExample, IFormula } from '@/core'
import __ from '../locale'
import {
    FormulaError,
    formulaInfo,
    FormulaType,
    FieldTypes,
    ConfigType,
} from '../const'
import {
    DatasheetViewColored,
    FullJoinLined,
    InnerJoinLined,
    LeftJoinLined,
    RightJoinLined,
} from '@/icons'
import styles from './styles.module.less'
import dataEmpty from '@/assets/dataEmpty.svg'
import Empty from '@/ui/Empty'
import { FieldsData } from '../FieldsData'
import { getFormulaErrorText } from '../helper'
import { SearchInput } from '@/ui'
import Icons from '@/components/BussinessConfigure/Icons'
import { DATA_TYPE_MAP } from '@/utils'
import { dataTypeMapping } from '@/components/DataConsanguinity/const'

export interface IFormulaConfigEl {
    // 显示/隐藏
    visible?: boolean
    // 操作类型
    optionType?: FormulaType
    // 画布
    graph?: Graph
    // 选中的节点
    node?: Node<Node.Properties>
    // 选中的算子
    formulaData?: IFormula
    // 字段数据
    fieldsData: FieldsData
    // 窗口高度比
    viewSize?: number
    // 展开/收起状态
    dragExpand?: boolean
    // 切换展开状态
    onChangeExpand?: (closed: boolean) => void
    // 关闭
    onClose: (bo?) => void
    // 操作
    onOperate?: (type: FormulaType, isChange: boolean) => void
}

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

/**
 * 字段组件
 * @param icon 图标
 * @param text 文本
 */
export const fieldLabel = (type: any, text: string, isSelected?: boolean) => {
    const timeType = dataTypeMapping.time.includes(type) || type === '时间型'

    return (
        <div className={styles.fieldLabelWrap}>
            <div className={styles.fl_contentWrap}>
                <Icons type={type} />

                <span
                    className={classnames(
                        styles.fl_name,
                        timeType && styles.disable,
                    )}
                    title={timeType ? __('当前不支持选择此类型的字段') : text}
                >
                    {text}
                </span>
            </div>
            {isSelected && <CheckOutlined style={{ color: '#126ee3' }} />}
        </div>
    )
}
/**
 * 字段组件
 * @param icon 图标
 * @param text 文本
 */
export const fieldLabelWithEn = (
    type: any,
    text: string,
    text1: string,
    isSelected?: boolean,
) => (
    <div className={styles.fieldLabelWithEnWrap}>
        <div className={styles.fl_contentWrap}>
            <Icons type={type} />
            <span className={styles.fl_name}>
                <span title={text}>{text}</span>
                <span title={text1}>{text1}</span>
            </span>
        </div>
        {isSelected && <CheckOutlined style={{ color: '#126ee3' }} />}
    </div>
)

/**
 * 根据算子id获取算子
 * @graph 画布
 * @formulaId 算子id
 * @returns 算子
 */
export const getFormulaItem = (graph?: Graph, formulaId?: string) => {
    if (!graph || !formulaId) {
        return undefined
    }
    const nodes = graph.getNodes()
    let item: IFormula | undefined
    nodes.forEach((node) => {
        const { formula } = node.data
        const tempItem = formula.find((i) => i.id === formulaId)
        if (tempItem) {
            item = tempItem
        }
    })
    return item
}

/**
 * 根据节点去寻找上游节点
 * @nodes 所有节点
 * @node 当前节点
 * @returns
 */
const getPreorderNode = (nodes, node): Node[] => {
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

/**
 * 库表组件
 * @param icon 图标
 * @param text 文本
 */
export const catalogLabel = (data: any, showInfo = true) => (
    <div className={styles.catalogLabelWrap}>
        <DatasheetViewColored />
        <div className={styles.cl_name} title={data.business_name}>
            {data.business_name}
        </div>
        <Popover
            placement="right"
            getPopupContainer={(n) => n.parentElement!}
            content={__('温馨提示：该库表执行时可能存在加载过慢情况')}
        >
            <InfoCircleOutlined
                style={{ color: 'rgb(0 0 0 / 45%)' }}
                hidden={
                    !['hive-hadoop2', 'hive-jdbc'].includes(
                        data.datasource_type,
                    ) || !showInfo
                }
            />
        </Popover>
    </div>
)

/**
 * 数据为空组件
 * @param errorType 错误类型
 */
export const dataEmptyView = (errorType?: string | FormulaError) => {
    return (
        <div style={{ marginTop: 60, textAlign: 'center', width: '100%' }}>
            <Empty
                desc={
                    <>
                        <div>{__('暂时无法配置')}</div>
                        <div>{getFormulaErrorText(errorType)}</div>
                    </>
                }
                iconSrc={dataEmpty}
            />
        </div>
    )
}

/**
 * 配置折叠label
 * @param onUnfold 展开操作
 */
const configLeftFoldLabel = (onUnfold: () => void) => {
    return (
        <div className={styles.configLeftFoldWrap}>
            <Tooltip title={__('展开')} placement="right">
                <MenuUnfoldOutlined
                    className={styles.clf_icon}
                    onClick={onUnfold}
                />
            </Tooltip>
            <div
                style={{
                    textAlign: 'center',
                    marginTop: 8,
                    fontWeight: 550,
                }}
            >
                {__('配置')}
            </div>
        </div>
    )
}

export const getFieldOptions = (preOutData, fieldsData, withEn = false) =>
    preOutData.map((info) => {
        const { data_type, name_en, business_name, label_is_protected } =
            fieldsData.data.find((a) => a.id === info.id) || {}
        const type =
            fieldsData.dataType.length > 0 &&
            fieldsData.dataType.find((it) => {
                return it.value_en === (info?.data_type || data_type)
            })?.value
        const n = info.alias || info.name || business_name
        const disabled =
            DATA_TYPE_MAP.time.includes(data_type) || label_is_protected
        return {
            value: info.id,
            optionLabel: withEn ? fieldLabel(type, n) : undefined,
            label: withEn
                ? fieldLabelWithEn(type, n, name_en)
                : fieldLabel(type, n),
            ...info,
            name: n,
            name_en,
            data_type,
            disabled,
            label_is_protected,
        }
    })

export const getFilterFieldOptions = (
    options,
    type: 1 | 2 | 3,
    bool = true,
) => {
    let a: string[] = []
    switch (type) {
        case 1:
            a = [
                ...dataTypeMapping.char,
                ...dataTypeMapping.date,
                ...dataTypeMapping.datetime,
                ...dataTypeMapping.timestamp,
                ...dataTypeMapping.number,
            ]
            break
        case 2:
            a = [...dataTypeMapping.char]
            break
        case 3:
            a = [
                ...dataTypeMapping.date,
                ...dataTypeMapping.datetime,
                ...dataTypeMapping.timestamp,
            ]
            break
        default:
            break
    }
    return options.filter(({ data_type }) => {
        const b = a.includes(data_type)
        return bool ? b : !b
    })
}

export const getSelectFieldOptions = (preOutData, fieldsData) => {
    return preOutData.map((info) => {
        const { data_type, name_en, label_is_protected } =
            fieldsData.data.find(
                (a) => a?.technical_name === info?.name_en || a.id === info.id,
            ) || {}
        const disabled =
            DATA_TYPE_MAP.time.includes(info.data_type) || label_is_protected
        return {
            value: `${info.id}_${info.sourceId}`,
            label: fieldLabel(
                fieldsData.dataType.length > 0 &&
                    fieldsData.dataType.find(
                        (it) => it.value_en === (info?.data_type || data_type),
                    )?.value,
                info.alias,
            ),
            id: info.id,
            name: info.alias,
            name_en,
            data_type,
            disabled,
            label_is_protected,
        }
    })
}

export const transformField = (field) => ({
    field_id: field?.id,
    data_type: field?.data_type,
    business_name: field?.name,
    technical_name: field?.name_en,
})

export const getDerivedViewValue = (where) => {
    return where.map((a) => {
        const { member } = a
        return {
            ...a,
            member: member.map((b) => {
                const { field, value } = b
                let realValue = value
                if (typeof value === 'object') {
                    if (Array.isArray(value)) {
                        realValue = value.join(',')
                    } else {
                        const { dateNumber, unit, date } = value
                        if (date) {
                            realValue = date
                                .map((c) =>
                                    moment(c).format('YYYY-MM-DD HH:mm:ss'),
                                )
                                .join(',')
                        } else {
                            realValue = `${dateNumber} ${unit}`
                        }
                    }
                }

                return {
                    ...b,
                    field: {
                        field_id: field?.id,
                        date_type: field?.data_type, // data_type   => date_type
                        business_name: field?.name,
                        technical_name: field?.name_en,
                    },
                    value: realValue,
                }
            }),
        }
    })
}

/**
 * 防止字段变更id更新导致exec_sql查不到数据  执行数据校验转换
 * @param formula
 */
export const validateFields = (formula: any) => {
    // sql模式下处理
    if (formula?.config?.sub_type === 'sql' && formula?.config?.where) {
        const originWhere = formula.config.where
        const outFields = formula?.output_fields || []
        // eslint-disable-next-line no-param-reassign
        formula.config.where = originWhere.map((o) => {
            const info = o?.sql_info
            let field_val_rel = []
            let fields = []
            // 技术名称未变  id改变字段集
            if (info) {
                const changedFields =
                    outFields
                        .map((out) => {
                            const it = info?.fields?.find(
                                (inner) =>
                                    inner?.id !== out?.id &&
                                    inner?.name_en === out?.name_en,
                            )
                            return it ? { ...out, originFieldId: it?.id } : out
                        })
                        ?.filter((f) => f.originFieldId) || []

                field_val_rel = info?.field_val_rel?.map((fvr) => {
                    const it = changedFields.find(
                        (cf) => cf.originFieldId === fvr.fieldId,
                    )
                    return it ? { ...fvr, fieldId: it.id } : fvr
                })
                fields = info?.fields?.map((f) => {
                    const it = changedFields.find(
                        (cf) => cf.originFieldId === f.id,
                    )
                    return it ? { ...f, id: it.id } : f
                })
            }
            return {
                ...o,
                sql_info: {
                    ...info,
                    field_val_rel,
                    fields,
                },
            }
        })
    }
}
