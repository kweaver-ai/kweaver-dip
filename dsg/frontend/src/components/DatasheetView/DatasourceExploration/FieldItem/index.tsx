import React, { useEffect, useState, useMemo, ReactNode } from 'react'
import classnames from 'classnames'
import styles from './styles.module.less'
import { FormatDataTypeToText } from '../helper'
import { getFieldTypeEelment } from '../../helper'
import { numberType } from '../const'

interface IFieldData {
    name: string
    type?: string
    reset_before_data_type?: string
    code?: string
    suffixIcon?: ReactNode
}
interface IFieldItem {
    data: IFieldData
    icon?: ReactNode
    isDatasourceNumber?: boolean
}

const FieldItem = (props: IFieldItem) => {
    const { data, icon, isDatasourceNumber } = props

    return isDatasourceNumber ? (
        <div className={styles.fieldItemNumberWrapper}>
            {numberType.map((item, index) => {
                const name = FormatDataTypeToText(item)
                return (
                    <div
                        key={item}
                        className={classnames(
                            styles.fieldItemWrapper,
                            index === 1 && styles.middle,
                        )}
                    >
                        <div className={styles.icon}>
                            {getFieldTypeEelment({ type: item }, 20)}
                        </div>
                        <div className={styles.nameBox}>
                            <div className={styles.name}>
                                <span title={name} className={styles.nameText}>
                                    {name}
                                </span>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    ) : (
        <div className={styles.fieldItemWrapper}>
            <div className={styles.icon}>
                {icon || (data?.type && getFieldTypeEelment(data, 20))}
            </div>
            <div className={styles.nameBox}>
                <div className={styles.name}>
                    <span title={data.name} className={styles.nameText}>
                        {data.name}
                    </span>
                    {data?.suffixIcon && (
                        <span className={styles.nameIcon}>
                            {data?.suffixIcon}
                        </span>
                    )}
                </div>
                {data?.code && (
                    <div title={data.code} className={styles.code}>
                        {data.code}
                    </div>
                )}
            </div>
        </div>
    )
}

export default FieldItem
