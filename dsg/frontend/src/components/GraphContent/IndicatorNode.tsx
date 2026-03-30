import * as React from 'react'
import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { register } from '@antv/x6-react-shape'
import classnames from 'classnames'
import { ConfigProvider } from 'antd'
import { Node } from '@antv/x6'
import {
    ATOMIC_INDICATOR_COLOR,
    calculateAtomicNodeHeight,
    NODE_WIDTH,
    NodeShapeTypes,
} from './const'
import styles from './styles.module.less'
import __ from './locale'
import {
    atomsExpressionRegx,
    atomsFuncRegx,
    changeFuncValues,
} from '../IndicatorManage/const'
import { formatError } from '@/core'
import Editor, { getFormatSql } from '../IndicatorManage/Editor'

const IndicatorNodeComponent = (props: any) => {
    const { node } = props
    const { data } = node
    const [expandStatus, setExpandStatus] = useState<boolean>(false)
    const [expandLoading, setExpandLoading] = useState<boolean>(false)
    const expressionRef = useRef<any>()
    const [expressionHeight, setExpressionHeight] = useState<number>(0)

    useEffect(() => {
        // 设置父节点展开状态
        setExpandStatus(data.expandFather)
    }, [data, node])

    useLayoutEffect(() => {
        if (expressionRef.current) {
            setTimeout(() => {
                setExpressionHeight(expressionRef.current?.offsetHeight || 0)
            }, 10)
        }
    }, [data, expressionRef?.current?.offsetHeight])

    useEffect(() => {
        initTargetNode()
    }, [expressionHeight])

    /**
     * 加载完数据重置节点
     */
    const initTargetNode = () => {
        node.resize(NODE_WIDTH, calculateAtomicNodeHeight(expressionHeight))
    }

    return (
        <ConfigProvider
            prefixCls="any-fabric-ant"
            iconPrefixCls="any-fabric-anticon"
        >
            <div
                className={classnames(
                    styles.formNode,
                    styles.formOriginNode,
                    data.selected ? styles.selectFormOriginNode : '',
                )}
            >
                <div className={styles.formIndicatorHeader}>
                    <div
                        className={styles.titleLine}
                        style={{
                            background: ATOMIC_INDICATOR_COLOR,
                        }}
                    />
                    <div className={styles.titleContext}>{data.label}</div>
                    <div className={styles.formDataTip}>{__('原子指标')}</div>
                </div>
                {data?.expression && (
                    <div className={styles.expression}>
                        <div className={styles.listTitle}>{__('表达式：')}</div>
                        <div
                            ref={expressionRef}
                            className={styles.expressionContent}
                        >
                            <Editor
                                lineNumbers={false}
                                highlightActiveLine={false}
                                value={getFormatSql(data.expression || '')}
                                editable={false}
                                grayBackground
                            />
                        </div>
                    </div>
                )}
            </div>
        </ConfigProvider>
    )
}

const indicatorNode = (callback?: any) => {
    register({
        shape: NodeShapeTypes.INDICATOR,
        effect: ['data'],
        component: IndicatorNodeComponent,
    })
    return NodeShapeTypes.INDICATOR
}

export default indicatorNode
