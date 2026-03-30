import React, { PropsWithChildren } from 'react'
import { ConfigProvider } from 'antd'
import styles from './styles.module.less'

function BaseNode({ children }: PropsWithChildren) {
    return (
        <ConfigProvider
            prefixCls="any-fabric-ant"
            iconPrefixCls="any-fabric-anticon"
        >
            <div className={styles.baseNodeWrapper}>{children}</div>
        </ConfigProvider>
    )
}

export default BaseNode
