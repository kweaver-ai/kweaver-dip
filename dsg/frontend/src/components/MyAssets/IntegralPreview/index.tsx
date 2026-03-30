import { useState } from 'react'
import { Tabs } from 'antd'
import __ from '../locale'
import Record from './Record'
import Board from './Board'
import styles from './styles.module.less'

/**
 * 积分概览的tab
 */
enum TabKey {
    // 积分记录
    IntegralRecord = 'integralRecord',
    // 积分看板
    IntegralBoard = 'integralBoard',
}

/**
 * 积分概览的tab
 */
const TabItems = [
    {
        label: __('积分记录'),
        key: TabKey.IntegralRecord,
    },
    {
        label: __('积分看板'),
        key: TabKey.IntegralBoard,
    },
]

const IntegralPreview = () => {
    const [active, setActive] = useState(TabKey.IntegralRecord)

    return (
        <div className={styles.integralPreviewWrapper}>
            <Tabs
                items={TabItems}
                activeKey={active}
                onChange={(key) => setActive(key as TabKey)}
            />
            <div className={styles.content}>
                {active === TabKey.IntegralRecord && <Record />}
                {active === TabKey.IntegralBoard && <Board />}
            </div>
        </div>
    )
}

export default IntegralPreview
