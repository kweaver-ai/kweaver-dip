import {
    InfoCircleOutlined,
    CheckOutlined,
    TagOutlined,
    InfoCircleFilled,
} from '@ant-design/icons'
import { TooltipPlacement } from 'antd/es/tooltip'
import { Tooltip, Badge } from 'antd'
import { ReactNode, useState, useEffect } from 'react'
import classnames from 'classnames'
import { forEach } from 'lodash'
import styles from './styles.module.less'
import __ from '../locale'
import {
    explorationContentType,
    explorationStrategyRadio,
    explorationTaskStatusList,
} from './const'
import { HistoryOutlined, ExplorOutlined } from '@/icons'
import exploration_classification from '@/assets/exploration_classification.png'
import exploration_timestamp from '@/assets/exploration_timestamp.svg'
import { IExploreOverview, dataTypeMapping } from '@/core'
import { SearchType } from '@/ui/LightweightSearch/const'
import { formatDataType } from '../helper'

export const LabelTitle = ({ label }: { label: string | ReactNode }) => {
    return (
        <div className={styles.labelTitleWrapper}>
            <span className={styles.labelLine} />
            {label}
        </div>
    )
}
interface IIconTips {
    tips: string
    placement?: TooltipPlacement
    icon?: ReactNode
    style?: any
}

export const IconTips = ({ tips, placement, icon, style }: IIconTips) => {
    return (
        <span
            style={{
                marginLeft: '8px',
                color: 'rgb(0 0 0 / 45%)',
                ...style,
            }}
        >
            <Tooltip
                title={tips}
                placement={placement}
                color="#fff"
                overlayInnerStyle={{ color: '#000' }}
                overlayStyle={{ maxWidth: 300 }}
            >
                {icon || <InfoCircleOutlined />}
            </Tooltip>
        </span>
    )
}

export const explorationContentList = [
    {
        value: explorationContentType.Quality,
        label: (
            <span>
                <ExplorOutlined style={{ marginRight: '6px' }} />
                {__('数据质量探查')}
            </span>
        ),
        statusLabel: __('数据质量探查'),
    },
    {
        value: explorationContentType.Timestamp,
        label: (
            <span>
                <HistoryOutlined style={{ marginRight: '6px' }} />
                {__('业务数据更新时间探查')}
            </span>
        ),
        statusLabel: __('业务数据更新时间探查'),
    },
    {
        value: explorationContentType.Classification,
        label: (
            <span>
                <TagOutlined style={{ marginRight: '6px' }} />
                {__('数据分类分级探查')}
            </span>
        ),
        subLabel: (
            <span>
                <TagOutlined style={{ marginRight: '6px' }} />
                {__('数据分类探查')}
            </span>
        ),
        statusLabel: __('数据分类分级探查'),
        subStatusLabel: __('数据分类探查'),
    },
]

export interface RadioItem {
    value: any
    label: ReactNode | string
    statusLabel: ReactNode | string
}
interface IBadgeRadio {
    data: RadioItem[]
    value?: any
    disabledValue?: any[]
    onChange?: (val) => void
    badgeStyle?: any
    tooltipsStyle?: any
}

export const BadgeRadio = (props: IBadgeRadio) => {
    const { data, value, disabledValue, onChange, badgeStyle, tooltipsStyle } =
        props
    const [selectVal, setSelectVal] = useState<any>()
    const [options, setOptions] = useState<any>(data)

    useEffect(() => {
        if (data?.length > 0) {
            setOptions(data)
        }
    }, [data])

    useEffect(() => {
        if (options) {
            setSelectVal(value || options[0]?.value)
        }
    }, [options, value])

    return (
        <div className={styles.badgeRadioWrapper}>
            {options.map((item) => {
                const disabledItem = disabledValue?.find(
                    (it) => it.value === item.value,
                )
                const typeTips = disabledItem?.value
                    ? data.find((it) => it.value === disabledItem.value)
                          ?.statusLabel
                    : ''
                const tips = __(
                    '存在未完成的${typeTips}任务，请您稍后再发起探查',
                    {
                        typeTips,
                    },
                )
                return (
                    <Badge
                        count={
                            selectVal === item.value ? (
                                <CheckOutlined style={{ color: '#fff' }} />
                            ) : null
                        }
                        offset={[-6, 6]}
                        key={item.value}
                    >
                        <Tooltip
                            title={
                                disabledItem?.value
                                    ? tips
                                    : item.disable
                                    ? item.disableTips
                                    : ''
                            }
                            overlayInnerStyle={tooltipsStyle}
                        >
                            <div
                                className={classnames(
                                    styles.badgeItem,
                                    selectVal === item.value &&
                                        !disabledItem?.value &&
                                        styles.active,
                                    (disabledItem?.value || item.disable) &&
                                        styles.disabled,
                                )}
                                style={badgeStyle}
                                onClick={() => {
                                    if (disabledItem?.value || item.disable)
                                        return
                                    setSelectVal(item.value)
                                    onChange?.(item.value)
                                }}
                            >
                                {item.label}
                            </div>
                        </Tooltip>
                    </Badge>
                )
            })}
        </div>
    )
}
export const convertSecondsToHMS = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const hoursStr = hours > 0 ? `${hours}小时 ` : ''
    const minutes = Math.floor((seconds % 3600) / 60)
    const minutesStr = minutes > 0 ? `${minutes}分钟 ` : ''
    const second = seconds % 60
    const secondStr = second > 0 ? `${second}秒` : ''

    return `${hoursStr}${minutesStr}${secondStr}`
}

export const strategyTips: any = {
    [explorationContentType.Quality]: {
        tips: __(
            '数据质量探查将消耗一定的计算资源，若数量较大，探查运行时间将会变长，探查结束后，请前往库表详情的数据预览查看探查结果。',
        ),
    },
    [explorationContentType.Timestamp]: {
        tips: __(
            '探查后，可在库表详情中查看业务数据更新时间戳，在「库表」详情中查看或编辑业务更新时间戳。',
        ),
        src: exploration_timestamp,
        title: (
            <span>
                {__(
                    '操作指引：可进入「库表」详情页中查看或编辑已探查的业务时间戳',
                )}
            </span>
        ),
    },
    [explorationContentType.Classification]: {
        tips: (
            <div className={styles.tipsClassifyContainer}>
                <div className={styles.iconTitle}>
                    <InfoCircleFilled className={styles.strategyIcon} />
                    <span>{__('说明')}</span>
                </div>
                <div>
                    {__(
                        '1、数据自动分类分级以逻辑实体属性为模板对数据进行划分。',
                    )}
                </div>
                <div>
                    {__(
                        '2、库表字段的分类分级，取决于字段所属属性的识别规则。只有未分类分级的或自动探查识别的分类分级，每次探查会根据新的探查规来自动调整分类分级；若字段已有用户手动（非自动识别的）设置的分类分级，则该字段将不做探查，可人工修改；若字段分类分级虽然是自动识别的，但用户手动修改过，则该字段也将不做新的探查，以人工修改为准。',
                    )}
                </div>
            </div>
        ),
        closeTips: (
            <div className={styles.tipsClassifyContainer}>
                <div className={styles.iconTitle}>
                    <InfoCircleFilled className={styles.strategyIcon} />
                    <span>{__('说明')}</span>
                </div>
                <div>
                    {__('1、数据自动分类以逻辑实体属性为模板对数据进行划分。')}
                </div>
                <div>
                    {__(
                        '2、库表字段的分类，取决于字段所属属性的识别规则。只有未分类的或自动探查识别的分类，每次探查会根据新的探查规来自动调整分类；若字段已有用户手动（非自动识别的）设置的分类，则该字段将不做探查，可人工修改；若字段分类虽然是自动识别的，但用户手动修改过，则该字段也将不做新的探查，以人工修改为准。',
                    )}
                </div>
            </div>
        ),
        src: exploration_classification,
        title: __('操作指引：运营人员可进入资产全景查看探查结果：'),
    },
}
export const getExplorationStrategyList = (res?: IExploreOverview) => {
    const list = explorationStrategyRadio.map((item) => {
        const disable = !res?.[item.key]
        return {
            value: item.value,
            label: (
                <div className={styles.strategyLabel}>
                    <div className={styles.tilte}>
                        {item.label}
                        <IconTips tips={disable ? '' : item.tips} />
                    </div>
                    <div className={styles.text}>
                        <div className={styles.textLab}>{__('库表数量')}：</div>
                        {/* <div className={styles.textSum}> */}
                        {res?.[item.key] || 0}
                        {/* </div> */}
                    </div>
                </div>
            ),
            disable,
            disableTips: disable ? __('库表数量为0 ，该策略不可用') : '',
        }
    })
    return list
}

export const filterConditionList = [
    {
        key: 'type',
        label: __('探查内容'),
        type: SearchType.Radio,
        options: [
            {
                value: [
                    explorationContentType.Timestamp,
                    explorationContentType.Classification,
                ].join(','),
                label: __('全部'),
            },
        ],
    },
    {
        key: 'status',
        label: __('任务状态'),
        options: explorationTaskStatusList,
        type: SearchType.Checkbox,
    },
]

export const getGuideFlagByKey = (key: string, userInfo: any) => {
    let flag: boolean = false

    if (userInfo !== null) {
        if (
            localStorage.getItem(key) === null ||
            !JSON.parse(localStorage.getItem(key) || '')?.[userInfo.ID]
        ) {
            flag = true
        }
    } else {
        flag = true
    }
    return flag
}

export const updateGuideFlag = (key: string, userInfo: any) => {
    if (localStorage.getItem(key) === null) {
        localStorage.setItem(
            key,
            JSON.stringify({
                [userInfo.ID]: true,
            }),
        )
    } else {
        const guideInfo = JSON.parse(localStorage.getItem(key) || '')
        localStorage.setItem(
            key,
            JSON.stringify({
                ...guideInfo,
                [userInfo.ID]: true,
            }),
        )
    }
}

export const getExplorationGuideByType = (
    type: explorationContentType,
    userInfo: any,
) => {
    const key = `af_${type}_guide`
    return getGuideFlagByKey(key, userInfo)
}

export const dataSourceIsDelNode = () => {
    return (
        <span
            style={{
                display: 'flex',
                alignItems: 'center',
                color: 'rgb(0 0 0 / 45%)',
            }}
            title={__('数据源已删除')}
        >
            <InfoCircleOutlined style={{ fontSize: 18, marginRight: 8 }} />
            {__('数据源已删除')}
        </span>
    )
}

export const ruleGroup = (
    list: any[],
    checkIds?: string[],
    isViewMode = false,
) => {
    // 按照维度分组
    const groupedData = list.reduce((acc: any, item: any) => {
        // 查找具有相同维度的现有组
        const existingGroup = acc.find(
            (group) => group.dimension === item.dimension,
        )
        if (existingGroup) {
            // 如果找到现有组，将当前规则添加到该组的规则列表中
            existingGroup.rules.push({
                ...item,
                checked: checkIds?.includes(item?.template_id || ''),
            })
        } else {
            // 如果没有找到现有组，创建一个新组
            // eslint-disable-next-line no-lonely-if
            if (!isViewMode || item.enable) {
                acc.push({
                    ...item,
                    rules: [
                        {
                            ...item,
                            checked: checkIds?.includes(
                                item?.template_id || '',
                            ),
                        },
                    ],
                })
            }
        }
        return acc
    }, [])
    return groupedData
}
// 数据源获取已选规则
export const getDatasourceExplorationField = (data: any, key: string) => {
    const list = data?.[key]
        ?.map((item) => {
            return {
                rules: item.rules
                    .filter((it) => it.checked)
                    ?.map((it) => ({
                        rule_id: it.template_id,
                        dimension: it.dimension,
                        rule_description: it.rule_description,
                    })),
            }
        })
        ?.filter((item) => item.rules.length)
        ?.map((item) => item.rules)
        ?.flatMap((item) => item)
    return list
}

export const ErrorTips = (props: { tips: string }) => {
    const { tips } = props
    return <div style={{ color: '#e60012' }}>{tips}</div>
}
export const isRepeatValue = (list: string[]) => {
    return list.length > 0 && new Set(list).size !== list.length
}
export const FormatDataTypeToText = (originType) => {
    const type = formatDataType(originType)
    switch (true) {
        case dataTypeMapping.char.includes(type):
            return '字符型'
        case dataTypeMapping.int.includes(type):
            return '整数型'
        case dataTypeMapping.float.includes(type):
            return '小数型'
        case dataTypeMapping.decimal.includes(type):
            return '高精度型'
        case dataTypeMapping.bool.includes(type):
            return '布尔型'
        case dataTypeMapping.date.includes(type):
            return '日期型'
        case dataTypeMapping.datetime.includes(type):
            return '日期时间型'
        case dataTypeMapping.time.includes(type):
            return '时间型'
        case dataTypeMapping.binary.includes(type):
            return '二进制'
        default:
            return '未知'
    }
}

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
const matchTemplateLiterals = (str) => {
    const pattern = /\$\{([^}]+)\}/g // 匹配${...}结构
    const matches = str.match(pattern)
    return matches || [] // 如果没有匹配到，返回空数组
}
// 处理前序节点，拿到处理后的sql
export const handleRunSqlParam = (sqlPrev) => {
    const regex = /(FFF\.)+|\[\[|\]\]/g
    let sqlScriptNew = sqlPrev.replaceAll(regex, '')
    // 前序节点
    if (sqlScriptNew.includes('$')) {
        const variableArr = matchTemplateLiterals(sqlScriptNew)
        forEach(variableArr, (variableTag) => {
            const variableName = variableTag.slice(2, -1)
            sqlScriptNew = sqlScriptNew.replace(
                variableTag,
                `"${variableName}"`,
            )
        })
    }
    return sqlScriptNew
}
