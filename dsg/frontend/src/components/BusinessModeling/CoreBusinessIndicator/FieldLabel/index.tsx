import { Tooltip } from 'antd'
import classnames from 'classnames'
import { CheckOutlined } from '@ant-design/icons'
import { FieldTypeIcon, FormatDataTypeTXT, getCommonDataType } from '@/core'
import DataTypeIcons from './Icons'
import styles from './styles.module.less'

interface IFieldLabel {
    type: string
    title: string
    code?: string
    item: any
    isSelected?: boolean
    onSelect?: (item: any) => void
}
/**
 * 字段属性标签
 * @param {string} type 字段类别
 * @param {string} title 字段名称
 * @returns
 */
export const FieldLabel = ({
    type,
    title,
    code,
    item,
    isSelected,
    onSelect,
}: IFieldLabel) => {
    return (
        <div
            className={classnames(
                styles['field-label'],
                code && styles['field-label-showCode'],
                isSelected && [styles['is-selected']],
            )}
            onClick={() => onSelect && onSelect(isSelected ? undefined : item)}
        >
            <Tooltip
                title={
                    <span
                        style={{ color: 'rgba(0,0,0,0.85)', fontSize: '12px' }}
                    >
                        {FormatDataTypeTXT(type)}
                    </span>
                }
                color="#fff"
            >
                <span>
                    <FieldTypeIcon
                        dataType={getCommonDataType(type)}
                        style={{
                            color: 'rgba(0, 0, 0, 0.65)',
                        }}
                    />
                </span>
            </Tooltip>
            <div className={styles['field-label-text']}>
                <div className={styles['field-label-text-name']} title={title}>
                    {title}
                    {isSelected}
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
            <div
                className={styles['field-label-link']}
                style={{ display: isSelected ? 'block' : 'none' }}
            >
                <div className={styles['field-label-link-check']}>
                    <CheckOutlined />
                </div>
            </div>
        </div>
    )
}
