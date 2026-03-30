import * as React from 'react'
import { useState, useEffect } from 'react'
import { register } from '@antv/x6-react-shape'
import classnames from 'classnames'
import { ConfigProvider } from 'antd'
import { Node } from '@antv/x6'
import { compositeExpressionRegx } from '../IndicatorManage/const'
import { formatError, getIndicatorDetail } from '@/core'
import {
    BOTTOMHEIGHT,
    INDICATORNODEHEADEHEIGHT,
    INDICATORNODETITLEHEIGHT,
    IndicatorNodeType,
    LINEHEIGHT,
    NODEWIDTH,
    calculateCompositeNodeHeight,
} from './const'
import styles from './styles.module.less'
import IndicatorNodeHeader from './IndicatorNodeHeader'
import __ from './locale'

import {
    getExpressIndictors,
    handleSelectItem,
    handleSelectedIndictorLastNode,
    useIndicatorContext,
    handleSelectedNode,
} from './helper'

const CompositeNodeComponent = (props: any) => {
    const { node } = props
    const { data } = node
    const [indicatorList, setIndicatorList] = useState<any>([])
    const [selectedIds, setSelectedIds] = useState<Array<string>>([])
    const [expandStatus, setExpandStatus] = useState<boolean>(false)
    const contextData = useIndicatorContext()
    const [expandLoading, setExpandLoading] = useState<boolean>(false)

    useEffect(() => {
        if (data?.indicatorInfo?.expression) {
            const dataList = getExpressIndictors(data.indicatorInfo.expression)
            getindicatorListData(dataList)
        }
        // 设置父节点
        setExpandStatus(data.expandFather)
        // 设置选中属性
        setSelectedIds(data.selectedIds)
    }, [data, node])

    useEffect(() => {
        initTargetNode()
    }, [indicatorList])

    const initTargetNode = () => {
        if (indicatorList.length) {
            node.resize(
                NODEWIDTH,
                calculateCompositeNodeHeight(indicatorList.length),
            )
        }
    }

    /**
     * 获取字段
     * @param id
     * @param datalist
     */
    const getindicatorListData = async (datalist) => {
        try {
            const indicators = await Promise.all(
                datalist.map((item) => getIndicatorDetail(item)),
            )
            setIndicatorList(indicators)
        } catch (err) {
            formatError(err)
        }
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
                <div className={styles.listTitle}>{__('依赖指标：')}</div>
                <div>
                    {indicatorList.map((item) => (
                        <div
                            key={item.id}
                            className={classnames(
                                styles.listItem,
                                selectedIds.includes(item.id)
                                    ? styles.itemSelected
                                    : '',
                            )}
                            title={item.name}
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                const { relationStruct } = contextData
                                if (relationStruct) {
                                    handleSelectItem(
                                        item.id,
                                        node,
                                        relationStruct,
                                    )
                                }
                            }}
                        >
                            {item.name || '--'}
                        </div>
                    ))}
                </div>
            </div>
        </ConfigProvider>
    )
}

const compositeNode = (callback?: any) => {
    register({
        shape: IndicatorNodeType.COMPOSITENODE,
        effect: ['data'],
        component: CompositeNodeComponent,
    })
    return IndicatorNodeType.COMPOSITENODE
}

export default compositeNode
