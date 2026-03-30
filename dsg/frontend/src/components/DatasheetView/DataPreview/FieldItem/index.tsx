import React, { useEffect, useState, useMemo, ReactNode } from 'react'
import styles from './styles.module.less'
import { getFieldTypeEelment } from '../../helper'

interface IFieldData {
    name: string
    type?: string
    code?: string
    suffixIcon?: ReactNode
}
interface IFieldItem {
    data: IFieldData
    icon?: ReactNode
    canShowSwitch?: boolean
}

const FieldItem = (props: IFieldItem) => {
    const { data, icon, canShowSwitch } = props

    return (
        <div className={styles.fieldItemWrapper}>
            <div className={styles.icon}>
                {icon ||
                    (data?.type &&
                        getFieldTypeEelment(
                            data,
                            20,
                            undefined,
                            canShowSwitch,
                        ))}
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
