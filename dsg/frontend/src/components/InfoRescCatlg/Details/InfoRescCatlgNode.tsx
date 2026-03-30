import { RightOutlined } from '@ant-design/icons'
import { register } from '@antv/x6-react-shape'
import { ConfigProvider } from 'antd'
import classnames from 'classnames'
import { memo, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './styles.module.less'
import __ from './locale'
import { NodeCompType, NodeIcon, NodeTypes, PortConf } from './helper'

/**
 * 资产节点
 */
const CatlgComponent = memo(({ node }: any) => {
    const navigate = useNavigate()
    const { data } = node
    const { id, name, type = NodeTypes.RESC_CATLG_NAME, isCurDir } = data

    return (
        <ConfigProvider
            prefixCls="any-fabric-ant"
            iconPrefixCls="any-fabric-anticon"
        >
            <div className={classnames(styles.infoRescCatlgNode)}>
                {/* <div
                    className={styles['left-border']}
                    style={{ backgroundColor: NodeInfo[type].color }}
                /> */}
                <div className={styles.content}>
                    <div
                        className={styles.catlgTopWrapper}
                        style={{
                            fontSize:
                                type === NodeTypes.RESC_CATLG_NAME
                                    ? 18
                                    : undefined,
                        }}
                    >
                        {type !== NodeTypes.RESC_CATLG_NAME && (
                            <div className={styles.iconContainer}>
                                <NodeIcon type={type} fontSize={24} />
                            </div>
                        )}

                        <div className={styles.rescName} title={name || '--'}>
                            {name || '--'}
                        </div>
                    </div>
                    {/* <div className={styles.divider} />
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
                        <div className={styles.rescName}>{name}</div>
                    </div> */}
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

export function InfoRescCatlgCommonNode() {
    register({
        shape: NodeCompType.common_node,
        effect: ['data'],
        component: CatlgComponent,
        ports: PortConf,
    })
    return NodeCompType.common_node
}

export function InfoRescCatlgNode() {
    register({
        shape: NodeCompType.info_resc_catalog,
        effect: ['data'],
        component: CatlgComponent,
        ports: PortConf,
    })
    return NodeCompType.info_resc_catalog
}

export function DataRescCatlgNode() {
    register({
        shape: NodeCompType.data_resource_catalog,
        effect: ['data'],
        component: CatlgComponent,
        ports: PortConf,
    })
    return NodeCompType.data_resource_catalog
}
