import React, { PropsWithChildren } from 'react'
import { ConfigProvider } from 'antd'
import styles from './styles.module.less'

function BaseTaskNode({ children }: PropsWithChildren) {
    return (
        <ConfigProvider
            prefixCls="any-fabric-ant"
            iconPrefixCls="any-fabric-anticon"
        >
            <div className={styles['task-node-wrapper']}>{children}</div>
        </ConfigProvider>
    )
}

export default BaseTaskNode
