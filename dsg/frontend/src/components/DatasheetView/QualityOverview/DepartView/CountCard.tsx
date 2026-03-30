import React, { memo } from 'react'
import styles from './styles.module.less'
import __ from './locale'
import { formatThousand } from '@/utils/number'

const CountCard = ({
    title,
    count,
    rightNode,
    tooltip,
}: {
    title?: string
    count?: number
    rightNode?: React.ReactNode
    tooltip?: React.ReactNode
}) => {
    return (
        <div className={styles['count-card']}>
            <div className={styles['count-card-left']}>
                <div>
                    <span>{formatThousand(count, '0')}</span>
                    <span>{__('张')}</span>
                </div>
                <div>
                    {title}
                    {tooltip}
                </div>
            </div>
            <div className={styles['count-card-right']}>{rightNode}</div>
        </div>
    )
}

export default memo(CountCard)
