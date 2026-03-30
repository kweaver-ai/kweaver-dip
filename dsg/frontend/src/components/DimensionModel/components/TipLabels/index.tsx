import React from 'react'
import styles from './styles.module.less'
import {
    FactDimensionColored,
    TableDimensionColored,
    TableFactColored,
} from '@/icons'
import __ from '../../locale'

function TipLabels({ style }: any) {
    return (
        <div className={styles['tip-label']} style={style}>
            <div className={styles['tip-label-fact']}>
                <span className={styles.icon}>
                    <TableFactColored />
                </span>
                <span className={styles.txt}>{__('事实表')}</span>
            </div>
            <div className={styles['tip-label-dimension']}>
                <span className={styles.icon}>
                    <TableDimensionColored />
                </span>
                <span className={styles.txt}>{__('维度表')}</span>
            </div>
            <div className={styles['tip-label-link']}>
                <span className={styles.icon}>
                    <FactDimensionColored />
                </span>
                <span className={styles.txt}>
                    {__('B 表通过“关联字段”与 A 表关联')}
                </span>
            </div>
        </div>
    )
}

export default TipLabels
