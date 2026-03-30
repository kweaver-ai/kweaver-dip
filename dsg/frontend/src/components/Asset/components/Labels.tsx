import React, { memo } from 'react'
import styles from './styles.module.less'
import __ from '../locale'

export type LabelType = 'L1' | 'L2' | 'L3' | 'L3Attr'
interface ILabels {
    types?: LabelType[] | undefined
}

function Labels({ types }: ILabels) {
    return (
        <div className={styles['labels-wrapper']}>
            {types?.includes('L1') && (
                <div className={styles.L1}>{__('L1主题域分组')}</div>
            )}
            {types?.includes('L2') && (
                <div className={styles.L2}>{__('L2主题域')}</div>
            )}
            {types?.includes('L3Attr') && (
                <div className={styles.L3Attr}>
                    {__('L3业务对象/活动')}({__('有逻辑实体和属性')})
                </div>
            )}
            {types?.includes('L3') && (
                <div className={styles.L3}>
                    {__('L3业务对象/活动')}({__('无逻辑实体和属性')})
                </div>
            )}
        </div>
    )
}

export default memo(Labels)
