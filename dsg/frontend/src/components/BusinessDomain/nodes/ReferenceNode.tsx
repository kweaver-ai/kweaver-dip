import React, { useState, useEffect } from 'react'
import { register } from '@antv/x6-react-shape'
import { ConfigProvider } from 'antd'
import classNames from 'classnames'
import styles from './styles.module.less'
import { NodeType } from '../const'
import { getAntdLocal, graphDeleteNode } from '../helper'
import { RecycleBinOutlined } from '@/icons'
import __ from '../locale'
import { GlossaryIcon } from '../GlossaryIcons'

let callbackColl: any = []
const ReferenceNodeComponent = (props: any) => {
    const { node } = props
    const { data } = node

    const [nodeData, setNodeData] = useState<any>(data)
    const [name, setName] = useState('')

    useEffect(() => {
        setNodeData(data)
        setName(data?.dataInfo?.name)
    }, [data])

    const deleteRef = () => {
        graphDeleteNode(callbackColl[0]().current, callbackColl[2](), node.id)
    }

    return (
        <ConfigProvider
            locale={getAntdLocal()}
            prefixCls="any-fabric-ant"
            iconPrefixCls="any-fabric-anticon"
        >
            <div
                className={classNames(
                    styles.commonShapeWrapper,
                    styles.referenceNodeShapeWrapper,
                    nodeData.dataInfo.isHighLight && styles.highLightBorder,
                )}
            >
                <div className={styles.common}>
                    <GlossaryIcon
                        type={nodeData.dataInfo?.type}
                        fontSize="28px"
                        width="28px"
                        styles={{ flexShrink: 0 }}
                    />
                    <span
                        className={styles.name}
                        title={nodeData?.dataInfo?.name}
                    >
                        {nodeData?.dataInfo?.name}
                    </span>
                    {callbackColl[3]() === 'edit' && (
                        <div className={styles.right}>
                            <div className={styles.operate} onClick={deleteRef}>
                                <RecycleBinOutlined />
                            </div>
                        </div>
                    )}
                </div>
                <div
                    className={styles.refPath}
                    title={nodeData?.dataInfo?.path_name}
                >{`${__('引用路径')}${__('：')} ${
                    nodeData?.dataInfo?.path_name
                }`}</div>
            </div>
        </ConfigProvider>
    )
}

const ReferenceNode = (callback?: any): string => {
    if (callback) {
        callbackColl = callback
    }
    register({
        shape: NodeType.ReferenceNode,
        effect: ['data'],
        component: ReferenceNodeComponent,
    })
    return NodeType.ReferenceNode
}

export default ReferenceNode
