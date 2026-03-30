import { RightOutlined } from '@ant-design/icons'
import { register } from '@antv/x6-react-shape'
import { ConfigProvider } from 'antd'
import classnames from 'classnames'
import { memo, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    ArchitectureOutlined,
    BusinessDomainL1Outlined,
    BusinessDomainL2Outlined,
    ObjL3Outlined,
} from '@/icons'
import { AssetNodeType, AssetTypeColor, NodeType, PortConf } from './helper'
import styles from './styles.module.less'
import __ from '../../locale'

const AssetIcon = {
    [AssetNodeType.ROOT]: (
        <ArchitectureOutlined style={{ fontSize: '22px', padding: '3px' }} />
    ),
    [AssetNodeType.SUBJECTGROUP]: <BusinessDomainL1Outlined />,
    [AssetNodeType.SUBJECTGDOMAIN]: <BusinessDomainL2Outlined />,
    [AssetNodeType.BUSINESSOBJ]: <ObjL3Outlined />,
}

/**
 * 资产节点
 */
const AssetComponent = memo(({ node }: any) => {
    const navigate = useNavigate()
    const { data } = node
    const { id, name, type, child_count, second_child_count, parentId } = data
    const showDesc = useMemo(() => {
        return (
            type === AssetNodeType.BUSINESSOBJ &&
            !!(child_count || second_child_count)
        )
    }, [type, child_count, second_child_count])

    const normalColor = useMemo(() => {
        return type === AssetNodeType.BUSINESSOBJ && !showDesc
            ? '#CBCBCB'
            : undefined
    }, [showDesc, type])

    const handleToSubject = () => {
        navigate(`/asset-view/architecture?bizId=${id}`)
    }

    const canClick = useMemo(
        () => type === AssetNodeType.SUBJECTGROUP && !!parentId,
        [type, parentId],
    )

    return (
        <ConfigProvider
            prefixCls="any-fabric-ant"
            iconPrefixCls="any-fabric-anticon"
        >
            <div
                className={classnames(
                    styles['asset-node'],
                    showDesc && styles['show-border'],
                )}
            >
                <div
                    className={styles['asset-node-color']}
                    style={{ background: normalColor || AssetTypeColor[type] }}
                />
                <div
                    className={classnames(
                        styles['asset-node-content'],
                        canClick && styles['can-click'],
                    )}
                    onClick={() => {
                        if (canClick) {
                            handleToSubject()
                        }
                    }}
                >
                    <div
                        className={styles['asset-node-icon']}
                        style={{ color: normalColor || AssetTypeColor[type] }}
                    >
                        {AssetIcon[type]}
                    </div>
                    <div className={styles['asset-node-item']}>
                        <div
                            className={styles['asset-node-item-name']}
                            title={name}
                        >
                            {name}
                        </div>
                        {showDesc && (
                            <div
                                className={styles['asset-node-item-desc']}
                                title={`${__('逻辑实体')}: ${
                                    child_count ?? 0
                                } ${__('属性')}: ${second_child_count ?? 0}`}
                            >
                                {__('逻辑实体')}:{child_count ?? 0} {__('属性')}
                                :{second_child_count ?? 0}
                            </div>
                        )}
                    </div>
                    {canClick && (
                        <div className={styles['asset-node-detail']}>
                            <RightOutlined />
                        </div>
                    )}
                </div>
            </div>
        </ConfigProvider>
    )
})

export function AssetNode() {
    register({
        shape: NodeType,
        effect: ['data'],
        component: AssetComponent,
        ports: PortConf,
    })
    return NodeType
}
