import React, { useMemo, useState } from 'react'
import { register } from '@antv/x6-react-shape'
import { ConfigProvider, Tooltip } from 'antd'
import { QuestionCircleOutlined } from '@ant-design/icons'
import styles from './styles.module.less'
import { nodeStyleInfo, NodeType } from '../const'
import { getAntdLocal } from '@/core/graph/helper'

const FirstLeNodeComponent = (props: any) => {
    const { node } = props
    const { data } = node

    const [nodeData, setNodeData] = useState<any>(data)
    useMemo(() => setNodeData(data), [data])

    return (
        <ConfigProvider
            locale={getAntdLocal()}
            prefixCls="any-fabric-ant"
            iconPrefixCls="any-fabric-anticon"
        >
            <div
                className={styles.firstLeNodeWrap}
                style={{
                    width: nodeStyleInfo[NodeType.FirstLeNode].width,
                    height: nodeStyleInfo[NodeType.FirstLeNode].height,
                }}
            >
                <div
                    className={styles.fln_titleWrap}
                    title={nodeData?.dataInfo?.name}
                >
                    <Tooltip
                        title={nodeData?.dataInfo?.note || '--'}
                        placement="top"
                    >
                        <QuestionCircleOutlined
                            hidden={!nodeData?.dataInfo?.note}
                            className={styles.fln_questionIcon}
                        />
                    </Tooltip>
                    {nodeData?.dataInfo?.name}
                </div>
            </div>
        </ConfigProvider>
    )
}

const FirstLeNode = (): string => {
    register({
        shape: NodeType.FirstLeNode,
        effect: ['data'],
        component: FirstLeNodeComponent,
    })
    return NodeType.FirstLeNode
}

export default FirstLeNode
