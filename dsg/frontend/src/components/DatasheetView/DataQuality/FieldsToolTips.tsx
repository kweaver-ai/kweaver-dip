import React from 'react'
import styles from './styles.module.less'
import __ from './locale'
import { progressNode } from './helper'
import { dataTypeMapping } from '@/core'

interface IFieldsToolTips {
    ruleData?: any
}

const FieldsToolTips: React.FC<IFieldsToolTips> = ({ ruleData }) => {
    const numberRange = () => {
        if (dataTypeMapping.char.includes(ruleData?.field_type)) {
            return null
        }
        const dateType = [
            ...dataTypeMapping.date,
            ...dataTypeMapping.datetime,
            ...dataTypeMapping.time,
        ]
        const min = ruleData?.details?.find((item) => item.rule_id === 'min')
        const max = ruleData?.details?.find((item) => item.rule_id === 'max')
        // 只有最早日期或者只有最后日期，显示： 最早日期：xxxx-xx-xx 或 xxxx-xx-xx  xx:xx:xx 最后日期：xxxx-xx-xx 或 xxxx-xx-xx  xx:xx:xx
        const minValue = dateType.includes(ruleData?.field_type)
            ? min?.result[0]?.toString().substring(0, 19)
            : min?.result[0]?.toString()
        const maxValue = dateType.includes(ruleData?.field_type)
            ? max?.result[0]?.toString().substring(0, 19)
            : max?.result[0]?.toString()
        const description =
            dateType.includes(ruleData?.field_type) && min?.description
                ? __('最早日期')
                : dateType.includes(ruleData?.field_type) && max?.description
                ? __('最晚日期')
                : null
        return min || max ? (
            <div className={styles.numberBox}>
                <span>
                    {min?.description && max?.description
                        ? dataTypeMapping.number.includes(ruleData?.field_type)
                            ? __('数值范围')
                            : __('时间范围')
                        : description || min?.description || max?.description}
                    ：
                </span>
                <span className={styles.numberValue}>
                    {min?.description && max?.description ? (
                        <>
                            <span
                                title={min?.result[0]}
                                className={styles.numberItem}
                            >
                                {minValue}
                            </span>
                            -
                            <span
                                title={max?.result[0]}
                                className={styles.numberItem}
                            >
                                {maxValue}
                            </span>
                        </>
                    ) : (
                        minValue || maxValue || '--'
                    )}
                </span>
            </div>
        ) : null
    }
    const boolRange = () => {
        const trueVal = ruleData?.details?.find(
            (item) => item.rule_id === 'true',
        )
        const falseVal = ruleData?.details?.find(
            (item) => item.rule_id === 'false',
        )
        return trueVal || trueVal ? (
            <div className={styles.numberBox}>
                <span>
                    {trueVal?.description}：{trueVal?.result[0]}
                </span>
                <span style={{ marginLeft: '20px' }}>
                    {falseVal?.description}：{falseVal?.result[0]}
                </span>
            </div>
        ) : null
    }

    const enumRange = () => {
        const enumData =
            ruleData?.details.find((item) => item.rule_id === 'dict') || {}
        if (!enumData.description) {
            return null
        }
        const [first, second] = enumData.description
        const [column, columnData] = enumData.result
        const sum = columnData?.length
        const total = columnData?.reduce((cur, pre) => {
            return Number(cur) + Number(pre)
        }, 0)
        const rangeData = {
            first,
            second,
            column,
            columnData,
            sum,
            rule_id: enumData.rule_id,
            total,
            rule_name: enumData.rule_name,
        }
        return progressNode(rangeData)
    }

    return (
        <div className={styles.fieldsToolTipsBox}>
            {numberRange()}
            {enumRange()}
            {boolRange()}
        </div>
    )
}

export default FieldsToolTips
