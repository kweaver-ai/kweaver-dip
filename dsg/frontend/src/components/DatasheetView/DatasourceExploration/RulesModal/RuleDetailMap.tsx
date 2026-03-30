import React, { useEffect, useState } from 'react'
import { Tag, Tooltip } from 'antd'
import classnames from 'classnames'
import __ from '../locale'
import styles from './styles.module.less'
import { RestrictViewList } from '@/components/DataAssetsCatlg/IndicatorViewDetail/IndicatorViewCard'
import Editor from '@/components/IndicatorManage/Editor'
import { getFieldTypeIcon } from '@/components/IndicatorManage/helper'
import { TimelinessRuleList } from '../const'
import { getFieldTypeEelment } from '../../helper'

const NULLENUM = {
    '0': __('0值检查'),
    NULL: 'NULL',
    ' ': __('空字符串检查'),
}

const NULLBOXENUM = {
    '0': '0',
    NULL: 'NULL',
    ' ': __('空字符串'),
}

const stylesCommon = {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '16px',
}

const TagFields = ({
    fields,
    canShowSwitch,
}: {
    fields: any[]
    canShowSwitch?: boolean
}) => {
    return fields?.map((item) => (
        <Tag
            icon={getFieldTypeEelment(
                { ...item, type: item?.data_type },
                18,
                undefined,
                canShowSwitch,
            )}
            className={styles.tag}
        >
            <span className={styles.text} title={item?.business_name}>
                {item?.business_name?.length > 10
                    ? `${item?.business_name.slice(0, 10)}...`
                    : item?.business_name}
            </span>
        </Tag>
    ))
}

// 及时性
const PeriodBox = ({ item }: { item: string }) => {
    return (
        <div
            className={classnames(styles.textItem, styles.tagList)}
            style={stylesCommon}
        >
            <div
                className={styles.label}
                style={{ color: 'rgba(0 0 0 / 45%)', minWidth: '70px' }}
            >
                {__('规则配置')}：
            </div>
            <div className={styles.text} style={{ paddingTop: '5px' }}>
                <span className={styles.text}>
                    {TimelinessRuleList.find((o) => o.value === item)?.label ??
                        '--'}
                </span>
            </div>
        </div>
    )
}

// 空值项
const NullBox = ({ item }: { item: string[] }) => {
    return (
        <div
            className={classnames(styles.textItem, styles.tagList)}
            style={stylesCommon}
        >
            <div
                className={styles.label}
                style={{ color: 'rgba(0 0 0 / 45%)', minWidth: '70px' }}
            >
                {__('规则配置')}：
            </div>
            <div className={styles.text}>
                {item?.map((key) => {
                    const tag = NULLBOXENUM?.[key] ?? key
                    return (
                        <Tag className={styles.tag}>
                            <span className={styles.text} title={tag}>
                                {tag?.length > 10
                                    ? `${tag.slice(0, 10)}...`
                                    : tag}
                            </span>
                        </Tag>
                    )
                })}
            </div>
        </div>
    )
}

type IDictItem = {
    dict_id: string
    dict_name: string
    data: { code: string; value: string }[]
}
// 码值
const DictBox = ({ item }: { item: IDictItem }) => {
    return (
        <>
            <div className={styles.textItem} style={stylesCommon}>
                <div
                    className={styles.label}
                    style={{ color: 'rgba(0 0 0 / 45%)', minWidth: '70px' }}
                >
                    {__('码表名称')}：
                </div>
                <div className={styles.text} title={item?.dict_name}>
                    {item?.dict_name ||
                        (item?.data?.length ? __('自定义') : '--')}
                </div>
            </div>
            <div className={styles.dictTable}>
                <table>
                    <tr>
                        <th>{__('码值')}</th>
                        <th>{__('码值描述')}</th>
                    </tr>

                    {item?.data?.map((it) => (
                        <tr key={it?.code}>
                            <td>{it?.code || '--'}</td>
                            <td title={it?.value}>{it?.value || '--'}</td>
                        </tr>
                    ))}
                </table>
            </div>
        </>
    )
}

type IRegex = {
    coding_rule_id: string
    regex: string
}
// 正则表达式
const RegexBox = ({ item }: { item: IRegex }) => {
    return (
        <div className={styles.textItem} style={stylesCommon}>
            <div
                className={styles.label}
                style={{ color: 'rgba(0 0 0 / 45%)', minWidth: '86px' }}
            >
                {__('正则表达式')}：
            </div>
            <div className={styles.text} title={item?.regex}>
                {item?.regex || '--'}
            </div>
        </div>
    )
}

type IRelation = 'or' | 'and'
type IMemberItem = {
    id: string
    operator: string
    value: any
}
type IExpression = {
    where_relation?: IRelation
    where?: { relation: IRelation; member: IMemberItem[] }[]
    sql?: string
}
// 规则表达式 | 过滤条件
const ExpressionBox = ({
    item,
    isFilter = false,
}: {
    item: IExpression
    isFilter?: boolean
}) => {
    return (
        <>
            <div
                className={styles.textItem}
                style={{ ...stylesCommon, marginBottom: '8px' }}
            >
                <div
                    className={styles.label}
                    style={{
                        color: 'rgba(0 0 0 / 45%)',
                        minWidth: isFilter ? '70px' : '86px',
                    }}
                >
                    {isFilter ? __('过滤条件') : __('规则表达式')}：
                </div>
                <div className={styles.text} />
            </div>
            <div style={{ marginBottom: '16px' }}>
                {item?.sql ? (
                    <Editor
                        lineNumbers={false}
                        grayBackground
                        highlightActiveLine={false}
                        value={item?.sql}
                        editable={false}
                        style={{ maxHeight: '300px', overflowY: 'auto' }}
                    />
                ) : (
                    <div>
                        <div>{`${
                            item?.where?.length && item?.where?.length > 1
                                ? __('每组间满足“${relation}”条件', {
                                      relation:
                                          item?.where_relation === 'or'
                                              ? __('或')
                                              : __('且'),
                                  })
                                : ''
                        }`}</div>
                        <div>
                            <RestrictViewList
                                where={(item?.where || []) as any}
                            />
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}

// 过滤条件
const FilterBox = ({ item }: { item: IExpression }) => (
    <ExpressionBox isFilter item={item} />
)

type IRow = {
    field_ids: string[]
    fields: any[]
    config: string[]
}
// 行级空值项 | 行级重复值
const RowBox = ({
    item,
    canShowSwitch,
}: {
    item: IRow
    canShowSwitch?: boolean
}) => {
    return (
        <>
            <div
                className={classnames(styles.textItem, styles.tagList)}
                style={stylesCommon}
            >
                <div
                    className={styles.label}
                    style={{ color: 'rgba(0 0 0 / 45%)', minWidth: '70px' }}
                >
                    {__('规则字段')}：
                </div>
                <div className={styles.text}>
                    <TagFields
                        fields={item?.fields}
                        canShowSwitch={canShowSwitch}
                    />
                </div>
            </div>
            <div
                className={classnames(styles.textItem, styles.tagList)}
                style={stylesCommon}
                hidden={!item?.config}
            >
                <div
                    className={styles.label}
                    style={{ color: 'rgba(0 0 0 / 45%)', minWidth: '70px' }}
                >
                    {__('规则配置')}：
                </div>
                <div className={styles.text}>
                    {item?.config?.map((key) => {
                        const tag = NULLENUM?.[key] ?? key
                        return (
                            <Tag className={styles.tag}>
                                <span className={styles.text} title={tag}>
                                    {tag?.length > 10
                                        ? `${tag.slice(0, 10)}...`
                                        : tag}
                                </span>
                            </Tag>
                        )
                    })}
                </div>
            </div>
        </>
    )
}

const ConfigType = {
    null: NullBox,
    dict: DictBox,
    format: RegexBox,
    rule_expression: ExpressionBox,
    filter: FilterBox,
    row_null: RowBox,
    row_repeat: RowBox,
    update_period: PeriodBox,
}

const RuleDetailMap = ({ config, fields, canShowSwitch }: any) => {
    const [rule, setRule] = useState<any[]>()
    useEffect(() => {
        if (config) {
            const cfg = JSON.parse(config || '{}')
            const cfgKeys = Object.keys(cfg) || []

            const useRules = cfgKeys
                .map((type) => {
                    const UIBox = ConfigType?.[type]
                    const data = cfg[type]
                    if (
                        ['rule_expression', 'filter'].includes(type) &&
                        data?.where?.length
                    ) {
                        const curWhere = data.where?.map((item) => {
                            return {
                                ...item,
                                member: (item?.member || [])?.map((o) => {
                                    const field = fields?.find(
                                        (f) => f.id === o.id,
                                    )

                                    return {
                                        ...o,
                                        field: {
                                            business_name: o.name,
                                            ...field,
                                            date_type:
                                                field?.data_type || o.data_type, // UI适配
                                        },
                                    }
                                }),
                            }
                        })
                        data.where = curWhere
                    } else if (
                        ['row_null', 'row_repeat'].includes(type) &&
                        data?.field_ids?.length
                    ) {
                        data.fields = data?.field_ids?.map((id) => {
                            const it = fields?.find((o) => o.id === id)
                            return it
                        })
                    }

                    return UIBox
                        ? {
                              ui: UIBox,
                              key: type,
                              data,
                          }
                        : undefined
                })
                .filter((o) => !!o)

            setRule(useRules)
        }
    }, [config, fields])

    return (
        <>
            {(rule || []).map((item) => {
                const Component = item.ui
                return (
                    <Component
                        key={item.key}
                        item={item.data}
                        canShowSwitch={canShowSwitch}
                    />
                )
            })}
        </>
    )
}
export default RuleDetailMap
