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
const CatlgComponent = memo(({ node }: any) => {
    const navigate = useNavigate()
    const { data } = node
    const {
        id,
        name,
        catlgName,
        type = NodeTypes.catalog,
        rescType,
        parentId,
        isCurDir,
    } = data

    return (
        <ConfigProvider
            prefixCls="any-fabric-ant"
            iconPrefixCls="any-fabric-anticon"
        >
            <div className={classnames(styles.catlgNode)}>
                {/* <div
                    className={styles['left-border']}
                    style={{ backgroundColor: NodeInfo[type].color }}
                /> */}
                <div className={styles.content}>
                    <div className={styles.catlgName} title={catlgName || '--'}>
                        {catlgName || '--'}
                    </div>
                    <div className={styles.divider} />
                    <div className={styles.mountRescInfo}>
                        <div
                            className={styles.iconContainer}
                            // style={{
                            //     backgroundColor:
                            //         NodeInfo[rescType].containerColor,
                            // }}
                        >
                            <NodeIcon type={rescType} fontSize={14} />
                        </div>
                        <div className={styles.rescName} title={name || '--'}>
                            {name || '--'}
                        </div>
                    </div>
                    {/* <div
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
                    </div> */}
                </div>
                {isCurDir && (
                    <div className={styles.curDirMark}>{__('本目录')}</div>
                )}
            </div>
        </ConfigProvider>
    )
})

export function CatlgNode() {
    register({
        shape: NodeCompType.common_node,
        effect: ['data'],
        component: CatlgComponent,
        ports: PortConf,
    })
    return NodeCompType.common_node
}
