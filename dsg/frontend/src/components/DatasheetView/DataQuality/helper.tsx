import { Progress, Tooltip } from 'antd'
import { isNumber, isString, isNaN } from 'lodash'
import classnames from 'classnames'
import { QuestionCircleOutlined } from '@ant-design/icons'
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
export const quantileNode = (item: IQuantileNode) => {
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
                {item.quantileDes.map((it, index) => {
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
                        {__('质量评分说明：')}
                    </div>
                    <div className={styles.tipsText}>
                        {__('表及字段关联的所有规则的平均分')}
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
        case dataTypeMapping.int.includes(type):
            return '整数型'
        case dataTypeMapping.float.includes(type):
            return '小数型'
        case dataTypeMapping.decimal.includes(type):
            return '高精度型'
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
