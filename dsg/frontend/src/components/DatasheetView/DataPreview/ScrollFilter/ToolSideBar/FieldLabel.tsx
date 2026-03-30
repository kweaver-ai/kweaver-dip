import { Tooltip } from 'antd'
import classnames from 'classnames'
import { getFieldTypeEelment } from '@/components/DatasheetView/helper'
import { FormatDataTypeTXT } from '@/core'
import styles from './styles.module.less'

interface IFieldLabel {
    item: any
    code?: string
    canViewChange?: boolean
}
/**
 * 字段属性标签
 * @returns
 */
export const FieldLabel = ({ item, code, canViewChange }: IFieldLabel) => {
    return (
        <div
            className={classnames(
                styles['field-label'],
                code && styles['field-label-showCode'],
            )}
        >
            <Tooltip
                title={
                    <span
                        style={{ color: 'rgba(0,0,0,0.85)', fontSize: '12px' }}
                    >
                        {FormatDataTypeTXT(item?.data_type)}
                    </span>
                }
                color="#fff"
            >
                <span className={styles['field-label-icon']}>
                    {getFieldTypeEelment(
                        { ...item, type: item?.data_type },
                        16,
                        'top',
                        canViewChange,
                    )}
                </span>
            </Tooltip>
            <div className={styles['field-label-text']}>
                <div
                    className={styles['field-label-text-name']}
                    title={item?.business_name}
                >
                    {item?.business_name}
                </div>
                {code && (
                    <div
                        className={styles['field-label-text-code']}
                        title={code}
                    >
                        {code}
                    </div>
                )}
            </div>
        </div>
    )
}
