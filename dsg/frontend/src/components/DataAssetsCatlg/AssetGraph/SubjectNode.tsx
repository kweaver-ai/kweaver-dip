import { register } from '@antv/x6-react-shape'
import { ConfigProvider } from 'antd'
import classnames from 'classnames'
import { memo } from 'react'
import { reverse } from 'lodash'
import { NodeCompType, PortConf } from './helper'
import styles from './styles.module.less'
import __ from '../locale'
import { NodeInfo, NodeTypes } from './const'
import { NodeIcon } from './NodeIcon'
import { BusinessDomainL1Outlined, BusinessDomainL2Outlined } from '@/icons'

/**
 * 资产节点
 */
const SubjectComponent = memo(({ node }: any) => {
    const { data } = node
    const { id, name, type = NodeTypes.data_asset, parentId, path } = data

    return (
        <ConfigProvider
            prefixCls="any-fabric-ant"
            iconPrefixCls="any-fabric-anticon"
        >
            <div className={styles['subject-node']}>
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
                            <div className={styles.paths}>
                                {reverse(path)?.map?.((p, i) =>
                                    i > 0 ? (
                                        <div className={styles.path} key={p.id}>
                                            {i === 2 ? (
                                                <BusinessDomainL1Outlined
                                                    className={styles.icon}
                                                />
                                            ) : (
                                                <BusinessDomainL2Outlined
                                                    className={styles.icon}
                                                />
                                            )}
                                            <div title={p.name}>
                                                {p.name.length > 5
                                                    ? `${p.name.substring(
                                                          0,
                                                          5,
                                                      )}...`
                                                    : p.name}
                                            </div>
                                            &nbsp;
                                            <div className={styles.arrow}>
                                                {i < path.length - 1 ? '>' : ''}
                                            </div>
                                        </div>
                                    ) : null,
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ConfigProvider>
    )
})

export function SubjectNode() {
    register({
        shape: NodeCompType.business_obj,
        effect: ['data'],
        component: SubjectComponent,
        ports: PortConf,
    })
    return NodeCompType.business_obj
}
