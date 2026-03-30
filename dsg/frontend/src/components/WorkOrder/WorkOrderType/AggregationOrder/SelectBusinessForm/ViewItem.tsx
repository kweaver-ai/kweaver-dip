import React from 'react'
import styles from './styles.module.less'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'

export type IViewItem = {
    icon?: any
    title?: string
    desc?: string
}

const ViewIcon = (
    <FontIcon
        name="icon-yewubiao1"
        type={IconType.COLOREDICON}
        style={{
            fontSize: '24px',
            borderRadius: '4px',
        }}
    />
)

const ViewItem = ({ icon = ViewIcon, title, desc }: IViewItem) => {
    return (
        <div className={styles['view-item']}>
            <div className={styles['view-item-icon']}>{icon}</div>
            <div className={styles['view-item-content']}>
                <div title={title}>{title || '--'}</div>
                <div title={desc}>{desc || '暂无描述'}</div>
            </div>
        </div>
    )
}

export default ViewItem
