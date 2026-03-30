import { Tooltip } from 'antd'
import classnames from 'classnames'
// import { FormatType, FormatTypeTXT } from '../../const'
import { FormatDataTypeTXT } from '@/core'
import DataTypeIcons from '../Icons'
import styles from './styles.module.less'

interface IFieldLabel {
    type: string
    title: string
    code?: string
}
/**
 * 字段属性标签
 * @param {string} type 字段类别
 * @param {string} title 字段名称
 * @returns
 */
export const FieldLabel = ({ type, title, code }: IFieldLabel) => {
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
                        {FormatDataTypeTXT(type)}
                    </span>
                }
                color="#fff"
            >
                <span>
                    <DataTypeIcons type={type} />
                </span>
            </Tooltip>
            <div className={styles['field-label-text']}>
                <div className={styles['field-label-text-name']} title={title}>
                    {title}
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
