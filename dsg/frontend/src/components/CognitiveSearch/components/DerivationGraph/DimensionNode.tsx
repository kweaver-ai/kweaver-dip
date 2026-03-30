import React, {
    memo,
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
} from 'react'
import { ConfigProvider } from 'antd'
import { register } from '@antv/x6-react-shape'
import { MinusOutlined, PlusOutlined } from '@ant-design/icons'
import classnames from 'classnames'
import styles from './styles.module.less'
import { NodeType, PortConf, matchColorText } from './helper'
import { useCongSearchContext } from '../../CogSearchProvider'
/**
 * 推导图谱维度节点
 */
const DimensionComponent = memo(({ node }: any) => {
    const { matchKeys } = useCongSearchContext()
    const { data } = node
    const { name, color, entity_type, isExpand, children, extra } = data
    const nodeRef = useRef<any>()

    const toggleExpand = (expand: boolean) => {
        const item = node.data
        const curData = {
            ...item,
            isExpand: expand,
        }
        node.replaceData(curData)
    }

    const spanType = useMemo(() => {
        return matchColorText(matchKeys, entity_type)
    }, [matchKeys, entity_type])

    const spanName = useMemo(() => {
        return matchColorText(matchKeys, name)
    }, [matchKeys, name])

    return (
        <ConfigProvider
            prefixCls="any-fabric-ant"
            iconPrefixCls="any-fabric-anticon"
        >
            <div className={styles['dimension-expand']}>
                {isExpand ? (
                    children?.length ? (
                        <MinusOutlined
                            className={styles['dimension-expand-icon']}
                            onClick={() => toggleExpand(false)}
                        />
                    ) : undefined
                ) : (
                    <PlusOutlined
                        className={classnames(
                            styles['dimension-expand-icon'],
                            styles['dimension-expand-yes'],
                        )}
                        onClick={() => toggleExpand(true)}
                    />
                )}
            </div>
            <div className={styles['dimension-node']}>
                <div
                    className={styles['dimension-node-color']}
                    style={{ background: color }}
                />
                <div className={styles['dimension-node-item']} ref={nodeRef}>
                    <div
                        className={styles['dimension-node-item-type']}
                        title={entity_type}
                        dangerouslySetInnerHTML={{
                            __html: spanType,
                        }}
                    />
                    <div
                        className={styles['dimension-node-item-desc']}
                        title={name}
                        dangerouslySetInnerHTML={{
                            __html: spanName,
                        }}
                    />

                    {extra && (
                        <>
                            <div
                                className={styles['table-name']}
                                title={extra?.raw_table_name}
                                dangerouslySetInnerHTML={{
                                    __html: extra?.table_name,
                                }}
                            />
                            <div
                                className={styles['table-desc']}
                                title={extra?.raw_description}
                                dangerouslySetInnerHTML={{
                                    __html: extra?.description,
                                }}
                            />
                        </>
                    )}
                </div>
            </div>
        </ConfigProvider>
    )
})

export function DimensionNode() {
    register({
        shape: NodeType,
        effect: ['data'],
        component: DimensionComponent,
        ports: PortConf,
    })
    return NodeType
}
