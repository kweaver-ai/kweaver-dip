import { Progress, Tooltip } from 'antd'
import { isNumber, isString, isNaN } from 'lodash'
import classnames from 'classnames'
import { QuestionCircleOutlined } from '@ant-design/icons'
import moment from 'moment'
import styles from './styles.module.less'
import __ from './locale'
import { thousandsReg } from '@/utils'
import dataEmpty from '@/assets/dataEmpty.svg'
import Empty from '@/ui/Empty'
import {
    FieldAverageColored,
    FieldCheckColored,
    FieldFalseColored,
    FieldMaxColored,
    FieldMinColored,
    FieldNullColored,
    FieldNullStrColored,
    FieldQuantileColored,
    FieldStdColored,
    FieldTrueColored,
    FieldUniqueColored,
    FieldVarianceColored,
    FieldZoreColored,
} from '@/icons'
import { qualityScoreDimensionText } from './const'
import { dataTypeMapping } from '@/core'
import { formatDataType } from '@/components/DatasheetView/helper'

export interface IQuantileNode {
    value: any[]
    quantileDes: any[]
}
export const quantileNode = (item?: IQuantileNode) => {
    return (
        <div className={styles.quantileBox}>
            <div className={styles.flexCtSa}>
                {item?.value.map((it, index) => {
                    return (
                        <span
                            key={index}
                            className={styles.quantileValue}
                            title={it}
                        >
                            {it}
                        </span>
                    )
                })}
            </div>
            <div className={styles.flexCtSa}>
                {item?.value.map((it, index) => {
                    return (
                        <span
                            key={index}
                            className={classnames(
                                styles.flexCtSa,
                                styles.quantileDot,
                            )}
                        />
                    )
                })}
            </div>
            <div className={styles.flexCtSa}>
                {item?.quantileDes.map((it, index) => {
                    return <span key={index}>{it}</span>
                })}
            </div>
            <div className={styles.quantileBar} />
        </div>
    )
}

export const thousandSeparator = (str: string | number, separator?: string) => {
    return `${str}`.replace(thousandsReg, `$1 ${separator || ','}`) || '--'
}

export const numberFloor = (text: any) => {
    if (isNumber(text)) {
        return Math.round(text * 100) / 100
    }
    if (isString(text)) {
        const num = Number(text)
        return !isNaN(num) ? Math.round(num * 100) / 100 : text
    }
    return text
}

export const progressNode = (item: any) => {
    // 左侧名称计算
    // 获取最长名称
    const longestName =
        item?.column?.length > 0
            ? item.column?.reduce((a, b) => (a.length > b.length ? a : b))
            : ''
    // 计算最长宽度
    const nameWid =
        item?.column?.length > 0 ? getTextWidth(longestName) + 20 : 80
    const nameWidth = nameWid > 120 ? 120 : nameWid
    // 右侧统计数值计算
    const maxSum =
        item?.columnData?.length > 0
            ? item?.columnData?.reduce((a, b) => (a > b ? a : b))
            : 0
    const sumWid =
        item?.columnData?.length > 0 ? getTextWidth(maxSum, 14) + 1 : 0
    return (
        <div className={styles.enumBox}>
            <div
                className={classnames(
                    styles.enumTitle,
                    item.rule_id === 'dict' && styles.enumTitleDict,
                )}
            >
                <div>{item.rule_name}</div>
                {item.rule_id === 'dict' ? (
                    <div>
                        {__('共')}
                        <span className={styles.titleSum}>{item.sum}</span>
                        {__('条')}
                    </div>
                ) : item.sum > 0 ? (
                    <div>
                        {__('Top')}
                        <span className={styles.titleSum}>{item.sum}</span>
                    </div>
                ) : null}
            </div>
            {item.sum > 0 && (
                <div className={styles.firstEnumUnit}>
                    <span>{item.first}</span>
                    <span>{item.second}</span>
                </div>
            )}
            <div className={styles.progressList}>
                {item.columnData.length > 0 ? (
                    item.columnData.map((it, index) => {
                        const percent: number =
                            Math.floor((Number(it) / item.total) * 100) > 98 &&
                            Math.floor((Number(it) / item.total) * 100) < 100
                                ? 99
                                : Math.floor((Number(it) / item.total) * 100) ||
                                  1
                        return (
                            <div key={index} className={styles.progressBox}>
                                <div
                                    className={styles.progressName}
                                    title={item.column[index]}
                                    style={{ width: `${nameWidth}px` }}
                                >
                                    {item.column[index]}
                                </div>
                                <Progress
                                    style={{
                                        width: `calc(100% - ${
                                            nameWidth +
                                            sumWid +
                                            (nameWidth === 120 ? 18 : 0)
                                        }px) `,
                                        marginLeft: nameWidth === 120 ? 18 : 0,
                                    }}
                                    percent={percent}
                                    strokeColor="#59A4FF"
                                    strokeWidth={14}
                                    format={() => ''}
                                />
                                <div
                                    className={styles.sum}
                                    style={{ width: `${sumWid}px` }}
                                >
                                    {it}
                                </div>
                            </div>
                        )
                    })
                ) : (
                    <Empty
                        iconSrc={dataEmpty}
                        desc={`${__('暂无')}${item.rule_name}${__('数据')}`}
                    />
                )}
            </div>
        </div>
    )
}

export const getTextWidth = (text: string, fontSize?: number) => {
    // 创建临时元素
    const spanDom = document.createElement('span')
    // 放入文本
    spanDom.innerText = text
    // 设置文字大小
    spanDom.style.fontSize = `${fontSize || 12}px`
    // span元素转块级
    spanDom.style.position = 'absolute'
    // span放入body中
    document.body.appendChild(spanDom)
    // 获取span的宽度
    const width = spanDom.offsetWidth
    // 从body中删除该span
    document.body.removeChild(spanDom)
    // 返回span宽度
    return width
}

export const StatisticsType = {
    最大值: <FieldMaxColored />,
    最小值: <FieldMinColored />,
    平均值统计: <FieldAverageColored />,
    标准差统计: <FieldStdColored />,
    分位数: <FieldQuantileColored />,
    TRUE值数: <FieldTrueColored />,
    FALSE值数: <FieldFalseColored />,
}

export const fieldIcons = {
    NullCount: <FieldNullColored />,
    BlankCount: <FieldNullStrColored />,
    Max: <FieldMaxColored />,
    Min: <FieldMinColored />,
    Quantile: <FieldQuantileColored />,
    Zero: <FieldZoreColored />,
    Avg: <FieldAverageColored />,
    VarPop: <FieldVarianceColored />,
    StddevPop: <FieldStdColored />,
    Unique: <FieldUniqueColored />,
    True: <FieldTrueColored />,
    False: <FieldFalseColored />,
    DictNotIn: <FieldCheckColored />,
}

export const QualityScoreTips = () => {
    return (
        <Tooltip
            placement="right"
            color="white"
            title={
                <div className={styles.qualityScoreTips}>
                    <div className={styles.tipsLabel}>
                        {__('库表质量评分')}：
                    </div>
                    <div className={styles.tipsText}>
                        {__('元数据级、库表级、行级和字段级规则总分的平均值')}
                    </div>
                </div>
            }
        >
            <QuestionCircleOutlined className={styles.tipsIcon} />
        </Tooltip>
    )
}

export const QualityScoreDimensionTips = () => {
    return (
        <Tooltip
            placement="right"
            color="white"
            overlayClassName="qualityScoreDimensionTipsBox"
            title={
                <div
                    className={classnames(
                        styles.qualityScoreTips,
                        styles.dimension,
                    )}
                >
                    {qualityScoreDimensionText.map((item) => {
                        return (
                            <div className={styles.tipsbox} key={item.title}>
                                <div className={styles.tipsLabel}>
                                    {item.title}
                                </div>
                                <div className={styles.tipsText}>
                                    {item.text}
                                </div>
                            </div>
                        )
                    })}
                </div>
            }
        >
            <QuestionCircleOutlined className={styles.tipsIcon} />
        </Tooltip>
    )
}

export const FormatDataTypeToText = (originType) => {
    const type = formatDataType(originType)
    switch (true) {
        case dataTypeMapping.char.includes(type):
            return '字符型'
        case dataTypeMapping.number.includes(type):
            return '数字型'
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

export const getScoreColor = (score: number) => {
    if (score >= 85) {
        return '#85D55F'
    }
    if (score >= 80) {
        return '#75B0F4'
    }
    if (score >= 75) {
        return '#FCC966'
    }
    if (score >= 60) {
        return '#FFA263'
    }

    return '#EF5965'
}

export const ScoreType = {
    accuracy_score: __('准确性'),
    completeness_score: __('完整性'),
    consistency_score: __('一致性'),
    standardization_score: __('规范性'),
    uniqueness_score: __('唯一性'),
}

export const AnchorType = {
    ...ScoreType,
    data_statistics: __('数据统计'),
}

export type IRowItem = {
    type: string
    score: number | null
    list: any[]
}

export const RowKVArr = ['completeness', 'uniqueness', 'accuracy']
// 统计信息
export const TypeList = [
    'completeness',
    'uniqueness',
    'standardization',
    'accuracy',
    'consistency',
    'data_statistics',
]
/** 评分维度映射表 */
export const KVMap = {
    /** 准确性 */
    accuracy: 'accuracy_score',
    /** 及时性 */
    timeliness: 'timeliness_score',
    /** 完整性 */
    completeness: 'completeness_score',
    /** 唯一性 */
    uniqueness: 'uniqueness_score',
    /** 一致性 */
    // consistency: 'consistency_score',
    /** 规范性 */
    standardization: 'standardization_score',
    /** 数据统计 */
    data_statistics: 'data_statistics',
}

export const DimensionColor = {
    accuracy_score: '#3E75FF',
    completeness_score: '#F5890D',
    consistency_score: '#14CEA0',
    standardization_score: '#3AC4FF',
    uniqueness_score: '#8C7BEB',
}

export const transTypeValue = (arr: any[]) => {
    if (!arr?.length) return []

    const ret = arr
        .reduce((prev, cur) => {
            const time = moment(cur?.explore_time).format('YYYY-MM-DD HH:mm:ss')
            const data = Object.keys(cur)
                ?.filter(
                    (o) =>
                        [
                            'accuracy_score',
                            'completeness_score',
                            // 'consistency_score',
                            'standardization_score',
                            'uniqueness_score',
                        ].includes(o) && typeof cur[o] === 'number',
                )
                ?.map((k) => ({
                    name: k,
                    time,
                    score: getScore(cur[k], false),
                }))
            return prev.concat(data || [])
        }, [])
        ?.sort(
            (a: any, b: any) =>
                new Date(a?.time || 0).getTime() -
                new Date(b?.time || 0).getTime(),
        )
    return ret
}

export const getScore = (val, canZero = true) => {
    return val ? Math.trunc(val * 10000) / 100 : canZero ? 0 : val
}

/**
 * 根据数据量大小格式化比率，控制精度
 * @param numerator 分子
 * @param denominator 分母
 * @returns 格式化后的比率字符串
 */
export const formatRateByDataSize = (
    numerator: number,
    denominator: number,
): string | undefined => {
    if (
        denominator === 0 ||
        denominator === null ||
        denominator === undefined
    ) {
        return undefined
    }

    if (numerator === null || numerator === undefined) {
        return undefined
    }

    const rate = (numerator / denominator) * 100

    // 根据数据量大小确定精度
    let precision: number
    if (denominator <= 10000) {
        precision = 2 // 10000以内 最多2位
    } else if (denominator <= 1000000) {
        precision = 4 // 1w-100w 最多4位
    } else {
        precision = 6 // 100w+ 最多6位
    }
    // 先多保留一位进行四舍五入，然后再按保留位数截取
    const tempPrecision = precision + 1
    const tempRoundedRate =
        Math.round(rate * 10 ** tempPrecision) / 10 ** tempPrecision
    const roundedRate =
        Math.round(tempRoundedRate * 10 ** precision) / 10 ** precision

    // 如果是整数，直接返回整数
    if (roundedRate % 1 === 0) {
        return `${Math.floor(roundedRate)}%`
    }

    return `${roundedRate}%`
}
