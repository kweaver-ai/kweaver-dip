import React from 'react'
import { Popover } from 'antd'
import styles from './styles.module.less'
import __ from './locale'

interface Owner {
    owner_id: string
    owner_name: string
}

interface DataOwnerDisplayProps {
    value?: Owner[]
}

/**
 * 数据Owner显示组件
 */
const OwnerDisplay: React.FC<DataOwnerDisplayProps> = ({ value = [] }) => {
    if (value.length === 0) return <span>--</span>

    // 显示文本
    const getDisplayText = () => {
        return value.map((owner) => owner.owner_name).join('、')
    }

    // 提示文本
    const getTooltipText = () => {
        return (
            <div className={styles.tooltipContent}>
                <div className={styles.ownerHeader}>{__('数据Owner')}:</div>
                {value.map((owner, index) => (
                    <div key={owner.owner_id} className={styles.ownerItem}>
                        <div className={styles.ownerNumber}>{`${
                            index + 1
                        }`}</div>
                        <div className={styles.ownerName}>
                            {owner.owner_name}
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <Popover content={getTooltipText()} placement="bottomLeft">
            <span className={styles.ownerDisplayText}>{getDisplayText()}</span>
        </Popover>
    )
}

export default OwnerDisplay
