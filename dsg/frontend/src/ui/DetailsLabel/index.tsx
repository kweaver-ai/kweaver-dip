import React, { CSSProperties, useEffect, useMemo, useState } from 'react'
import { Row, Col } from 'antd'
import { isObject } from 'lodash'
import classnames from 'classnames'
import styles from './styles.module.less'

interface IDetailsList {
    detailsList: IDetailsLabel[]
    labelWidth?: string
    wordBreak?: boolean
    isNeedColon?: boolean
    border?: boolean
    overflowEllipsis?: boolean
    style?: CSSProperties
    gutter?: number
}
/**
 * @param label 显示文本
 * @param key  接口返回字段名
 * @param value sting | [] 显示值，为数组时，显示标签样式
 * @param span  栅格布局，默认12
 * @param class  传入class
 * @param styles  传入styles
 * @param render  传入自定义组件
 * @param options  枚举值状态，用于转换状态
 */
interface IDetailsLabel {
    label: string
    key?: string
    value: string | string[] | number | number[]
    span?: number
    class?: string
    styles?: any
    options?: any[]
    render?: () => void
}

const tags = (data: string[] | number[] = []) => {
    return (
        <div className={styles.tags}>
            {data.map((item) => {
                return (
                    <span key={item} className={styles.tagsItem} title={item}>
                        {item}
                    </span>
                )
            })}
        </div>
    )
}

const getText = (item: IDetailsLabel) => {
    let text: any
    if (item.render) {
        text = item.render()
    }
    // 根据枚举值转换状态
    else if (item.options && item.options.length > 0) {
        const str = item.options.find(
            (it) =>
                (it.value === 0 || it.key === 0 ? 0 : it.value || it.key) ===
                item.value,
        )?.label
        text = <span title={str || '--'}>{str || '--'}</span>
    } else if (Array.isArray(item.value)) {
        text = item.value.length > 0 ? tags(item.value) : '--'
    }
    return (
        text || (
            <span
                title={
                    Array.isArray(item.value) || isObject(item.value)
                        ? ''
                        : `${item.value}`
                }
            >
                {item.value === 0 ? item.value : item.value || '--'}
            </span>
        )
    )
}
const getTextWidth = (text: string, fontSize?: number) => {
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

/**
 * @param label 显示文本
 * @param key  接口返回字段名
 * @param value sting | [] 显示值，为数组时，显示标签样式
 * @param span  栅格布局，默认12
 * @param class  传入class
 * @param styles  传入styles
 * @param render  传入自定义组件
 * @param options  枚举值状态，用于转换状态
 */

export const DetailsLabel: React.FC<IDetailsList> = (props: any) => {
    const {
        detailsList,
        labelWidth,
        wordBreak,
        style = {},
        isNeedColon = true,
        border = false,
        overflowEllipsis = false,
        gutter = 0,
    } = props
    return (
        <div
            className={classnames(
                styles.detailCantainer,
                border && styles.borderCantainer,
            )}
            style={style}
        >
            <Row gutter={gutter}>
                {detailsList.map((item, index, array) => {
                    const labelWid =
                        item?.labelWidth ||
                        `${getTextWidth(
                            item.label + (isNeedColon ? '：' : ''),
                        )}px`
                    const span =
                        index === array.length - 1 &&
                        array.length % 2 !== 0 &&
                        border
                            ? 24
                            : item.span || 12
                    return (
                        !item.hidden && (
                            <Col
                                span={span}
                                className={classnames(
                                    styles.detailCol,
                                    item.class && styles[item.class],
                                )}
                                style={item.styles}
                                key={item.key}
                            >
                                <div
                                    className={styles.label}
                                    style={{
                                        width: labelWidth || 'auto',
                                        ...item.labelStyles,
                                    }}
                                    title={item.label}
                                >
                                    {item.label}
                                    {isNeedColon && '：'}
                                </div>
                                <div
                                    className={classnames(
                                        styles.text,
                                        wordBreak
                                            ? styles.wordBreak
                                            : overflowEllipsis
                                            ? styles.overflowEllipsis
                                            : !item.span || item.span < 24
                                            ? styles.overflowEllipsis
                                            : styles.wordBreak,
                                        item.showUnderLine &&
                                            styles.hoverUnderLine,
                                    )}
                                    style={{
                                        maxWidth: `calc(100% - ${
                                            labelWidth || labelWid
                                        })`,
                                        ...item.textStyles,
                                    }}
                                >
                                    {getText(item)}
                                </div>
                            </Col>
                        )
                    )
                })}
            </Row>
        </div>
    )
}
export default DetailsLabel
