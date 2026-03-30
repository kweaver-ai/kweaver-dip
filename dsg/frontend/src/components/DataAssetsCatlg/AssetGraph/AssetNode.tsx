import { RightOutlined } from '@ant-design/icons'
import { register } from '@antv/x6-react-shape'
import { ConfigProvider } from 'antd'
import classnames from 'classnames'
import { memo, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { NodeCompType, PortConf } from './helper'
import styles from './styles.module.less'
import __ from '../locale'
import { NodeInfo, NodeTypes } from './const'
import { NodeIcon } from './NodeIcon'

/**
 * 资产节点
 */
const AssetComponent = memo(({ node }: any) => {
    const navigate = useNavigate()
    const { data } = node
    const { id, name, type = NodeTypes.data_asset, parentId } = data

    return (
        <ConfigProvider
            prefixCls="any-fabric-ant"
            iconPrefixCls="any-fabric-anticon"
        >
            <div className={styles['asset-node']}>
                <div className={classnames(styles['common-node'])}>
                    <div
                        className={styles['left-border']}
                        style={{ backgroundColor: NodeInfo[type].color }}
                    />
                    <div className={styles.content}>
                        <div
                            className={styles['icon-container']}
                            style={{
                                backgroundColor: NodeInfo[type].containerColor,
                            }}
                        >
                            <NodeIcon type={type} />
                        </div>
                        <div className={styles['info-container']}>
                            <div className={styles.label}>
                                {NodeInfo[type].label}
                            </div>
                            <div className={styles.name} title={name}>
                                {name}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ConfigProvider>
    )
})

export function AssetNode() {
    register({
        shape: NodeCompType.asset_node,
        effect: ['data'],
        component: AssetComponent,
        ports: PortConf,
    })
    return NodeCompType.asset_node
}
