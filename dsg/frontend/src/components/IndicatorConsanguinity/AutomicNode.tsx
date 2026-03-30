import * as React from 'react'
import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { register } from '@antv/x6-react-shape'
import classnames from 'classnames'
import { ConfigProvider } from 'antd'
import { Node } from '@antv/x6'
import {
    INDICATORNODEHEADEHEIGHT,
    INDICATORNODETITLEHEIGHT,
    NODEWIDTH,
    IndicatorNodeType,
    LINEHEIGHT,
    BOTTOMHEIGHT,
    calculateAutomicNodeHeight,
} from './const'
import styles from './styles.module.less'
import IndicatorNodeHeader from './IndicatorNodeHeader'
import __ from './locale'
import { useCatalogColumn } from '../DimensionModel/helper'
import {
    atomsExpressionRegx,
    atomsFuncRegx,
    changeFuncValues,
} from '../IndicatorManage/const'
import { formatError } from '@/core'
import {
    getExpressFields,
    handleSelectItem,
    handleSelectedNode,
    handleSelectedIndictorData,
    handleSelectedIndictorLastNode,
    useIndicatorContext,
} from './helper'
import Editor, { getFormatSql } from '../IndicatorManage/Editor'

let callbackColl: any = {}

const AutomicNodeComponent = (props: any) => {
    const { node } = props
    const { data } = node
    const [selectedIds, setSelectedIds] = useState<Array<string>>([])
    const [expandStatus, setExpandStatus] = useState<boolean>(false)
    const contextData = useIndicatorContext()
    const [expandLoading, setExpandLoading] = useState<boolean>(false)
    const expressionRef = useRef<any>()
    const [expressionHeight, setExpressionHeight] = useState<number>(0)
    useEffect(() => {
        // 设置父节点展开状态
        setExpandStatus(data.expandFather)
        // 设置选中状态
        setSelectedIds(data.selectedIds)
    }, [data, node])

    useLayoutEffect(() => {
        if (expressionRef.current) {
            setTimeout(() => {
                setExpressionHeight(expressionRef.current.offsetHeight)
            }, 10)
        }
    }, [data])

    useEffect(() => {
        initTargetNode()
    }, [expressionHeight])

    /**
     * 加载完数据重置节点
     */
    const initTargetNode = () => {
        node.resize(NODEWIDTH, calculateAutomicNodeHeight(expressionHeight))
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
                    selectedIds.includes(data.indicatorInfo.id)
                        ? styles.selectFormOriginNode
                        : '',
                )}
                onClick={() => {
                    const { relationStruct } = contextData
                    if (relationStruct) {
                        handleSelectedNode(
                            data.indicatorInfo.id,
                            node,
                            relationStruct,
                        )
                    }
                }}
            >
                {/* {data.isBase && (
                    <div className={styles.baseCotainer}>{__('分析对象')}</div>
                )} */}
                <IndicatorNodeHeader
                    data={data.indicatorInfo}
                    expandStatus={expandStatus}
                    isLoading={expandLoading}
                    onExpand={async (status) => {
                        setExpandLoading(true)
                        node.replaceData({
                            ...data,
                            expandFather: status,
                        })
                        await contextData.loadFatherNode(node)
                        setExpandLoading(false)
                    }}
                    onClickName={() => {
                        contextData.onSelectedIndictor(data.indicatorInfo)
                    }}
                    isBase={data.isBase}
                />
                {data.indicatorInfo.expression && (
                    <div className={styles.expression}>
                        <div className={styles.listTitle}>{__('表达式：')}</div>
                        <div ref={expressionRef}>
                            <Editor
                                lineNumbers={false}
                                highlightActiveLine={false}
                                value={getFormatSql(
                                    data.indicatorInfo.expression,
                                )}
                                editable={false}
                            />
                        </div>
                    </div>
                )}
            </div>
        </ConfigProvider>
    )
}

const automicNode = (callback?: any) => {
    if (callback) {
        callbackColl = callback
    }
    register({
        shape: IndicatorNodeType.AUTOMICNODE,
        effect: ['data'],
        component: AutomicNodeComponent,
    })
    return IndicatorNodeType.AUTOMICNODE
}

export default automicNode
