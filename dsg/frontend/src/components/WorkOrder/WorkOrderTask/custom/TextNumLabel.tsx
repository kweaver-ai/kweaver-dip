import React, { HTMLAttributes, ReactNode } from 'react'
import classnames from 'classnames'
import styles from './styles.module.less'
import __ from '../locale'
import { formatCount } from '@/utils'

interface ITextNumLabel extends HTMLAttributes<HTMLDivElement> {
    label: string
    selected: boolean
    total?: number
    icon?: ReactNode
    onSelected?: () => void
}
/**
 * 页面分栏头标题组件
 * @param label string 文本
 * @param selected boolean 是否选中
 * @param total number？总数值
 * @param onClick () => void
 */
export const TextNumLabel: React.FC<ITextNumLabel> = ({
    label,
    selected,
    total,
    icon,
    onSelected,
    ...props
}) => {
    return (
        <div
            className={classnames(styles.textNumLabelWrapper)}
            style={{
                backgroundColor: selected ? 'rgba(18,110,227,0.06)' : undefined,
            }}
            onClick={() => onSelected && onSelected()}
            {...props}
        >
            <span
                className={styles.icon}
                style={{ visibility: icon ? 'visible' : 'hidden' }}
            >
                {icon}
            </span>
            <span
                className={styles.dividerTitle}
                title={`${label} (${formatCount(total || 0)})`}
            >
                {label} ({formatCount(total || 0)})
            </span>
        </div>
    )
}
