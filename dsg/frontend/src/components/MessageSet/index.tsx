import { Tabs } from 'antd'
import React, { useState } from 'react'
import DataAlert from './DataAlert'
import MessagePush from './MessagePush'
import styles from './styles.module.less'
import __ from './locale'

const MessageSet = () => {
    const [activeKey, setActiveKey] = useState('dataAlert')
    const items = [
        {
            label: __('数据质量告警规则'),
            key: 'dataAlert',
            children: <DataAlert />,
        },
        // {
        //     label: __('短信消息推送规则'),
        //     key: 'messagePush',
        //     children: <MessagePush />,
        // },
    ]

    return (
        <div className={styles.messageSetWrapper}>
            <Tabs
                items={items}
                activeKey={activeKey}
                onChange={(key) => setActiveKey(key)}
                destroyInactiveTabPane
            />
        </div>
    )
}

export default MessageSet
