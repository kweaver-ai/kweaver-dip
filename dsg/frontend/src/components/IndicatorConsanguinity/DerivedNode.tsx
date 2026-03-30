import * as React from 'react'
import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { register } from '@antv/x6-react-shape'
import classnames from 'classnames'
import { ConfigProvider } from 'antd'
import {
    BOTTOMHEIGHT,
    INDICATORNODEHEADEHEIGHT,
    INDICATORNODETITLEHEIGHT,
    IndicatorNodeType,
    LINEHEIGHT,
    NODEWIDTH,
    calculateDeriveNodeHeight,
    getRestrictList,
} from './const'
import styles from './styles.module.less'
import IndicatorNodeHeader from './IndicatorNodeHeader'
import __ from './locale'
import { TabsKey } from '../IndicatorManage/const'
import { formatError } from '@/core'
import { getFieldTypeIcon } from '../IndicatorManage/helper'
import {
    changeEdgeAttrSelected,
    changeEdgeAttrUnSelected,
    handleSelectItem,
    handleSelectedNode,
    handleSelectedIndictorData,
    useIndicatorContext,
} from './helper'
import IndicatorIcons from '../IndicatorManage/IndicatorIcons'
import Editor, { getFormatSql } from '../IndicatorManage/Editor'

let callbackColl: any = {}

const DerivedNodeComponent = (props: any) => {
    const { node } = props
    const { data } = node
    const [timeRestrict, setTimeRestrict] = useState<Array<any>>([])
    const [bizRestrict, setBizRestrict] = useState<Array<any>>([])
    const [selectedIds, setSelectedIds] = useState<Array<string>>([])
    const [expandStatus, setExpandStatus] = useState<boolean>(false)
    const contextData = useIndicatorContext()
    const [expandLoading, setExpandLoading] = useState<boolean>(false)
    const [isSqlMode, setIsSqlMode] = useState<boolean>(false)
    const [expressionHeight, setExpressionHeight] = useState<number>(0)
    const expressionRef = useRef<any>()
    useEffect(() => {
        if (data?.indicatorInfo) {
            getRestrictDatas(data.indicatorInfo)
        }
        setExpandStatus(data.expandFather)
        setSelectedIds(data.selectedIds)
    }, [data, node])

    useEffect(() => {
        initTargetNode()
    }, [timeRestrict, bizRestrict, expressionHeight])

    useLayoutEffect(() => {
        if (expressionRef.current) {
            setTimeout(() => {
                setExpressionHeight(
                    isSqlMode ? expressionRef.current.offsetHeight : 0,
                )
            }, 10)
        }
    }, [data, isSqlMode])

    const initTargetNode = () => {
        node.resize(
            NODEWIDTH,
            isSqlMode
                ? INDICATORNODEHEADEHEIGHT +
                      INDICATORNODETITLEHEIGHT +
                      LINEHEIGHT +
                      expressionHeight +
                      27 +
                      BOTTOMHEIGHT
                : calculateDeriveNodeHeight([
                      timeRestrict?.length || 0,
                      bizRestrict?.length || 0,
                  ]),
        )
    }

    /**
     * 选中节点的样式
     * @param id
     * @param node
     * @param relationStruct
     */
    const handleSelectRestrictItem = (id: string, type: 'biz' | 'time') => {
        const { relationStruct } = contextData
        if (relationStruct) {
            changeEdgeAttrUnSelected(
                relationStruct.edgesData.map((currentEdge) => currentEdge.edge),
            )
            relationStruct.clearNodeSelected()
            node.replaceData({
                ...node.data,
                selectedIds: [id],
                selectDataType: type,
            })
            if (node.data.expandFather) {
                // 只获取当前节点用到的边
                const connectEdges = relationStruct
                    .getLineByChildId(id)
                    .filter((edgeData) => edgeData.targetNodeId === node.id)
                if (connectEdges?.length) {
                    // 向父级选中节点
                    changeEdgeAttrSelected(
                        connectEdges.map((edgeData) => edgeData.edge),
                    )
                }
                handleSelectedIndictorData(id, relationStruct)
            }
        }
    }

    /**
     * 获取字段
     * @param id
     * @param datalist
     */
    const getRestrictDatas = async (indicatorInfo) => {
        try {
            const whereInfo = indicatorInfo.where_info
            const isSql = whereInfo.sub_type === 'sql'
            setIsSqlMode(isSql)
            if (!isSql) {
                const timeData = getRestrictList(whereInfo.date_where)
                const bizData = getRestrictList(whereInfo.where)
                setTimeRestrict(timeData)
                setBizRestrict(bizData)
            }
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
                    isLoading={expandLoading}
                    expandStatus={expandStatus}
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
                <div>
                    <div className={styles.listTitle}>
                        {__('依赖原子指标：')}
                    </div>
                    <div
                        className={classnames(
                            styles.listItem,
                            styles.listIconItem,
                            selectedIds.includes(
                                data?.indicatorInfo?.atomic_indicator_id,
                            )
                                ? styles.itemSelected
                                : '',
                        )}
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            const { relationStruct } = contextData
                            if (relationStruct) {
                                handleSelectItem(
                                    data?.indicatorInfo?.atomic_indicator_id,
                                    node,
                                    relationStruct,
                                )
                            }
                        }}
                    >
                        <IndicatorIcons
                            type={TabsKey.ATOMS}
                            fontSize={18}
                            style={{
                                marginRight: 8,
                            }}
                        />
                        <span
                            className={styles.name}
                            title={
                                data?.indicatorInfo?.atomic_indicator_name || ''
                            }
                        >
                            {data?.indicatorInfo?.atomic_indicator_name || '--'}
                        </span>
                    </div>
                </div>
                {isSqlMode && data.indicatorInfo?.where_info?.sql_str ? (
                    <div className={styles.expression}>
                        <div className={styles.listTitle}>{__('表达式：')}</div>
                        <div ref={expressionRef}>
                            <Editor
                                lineNumbers={false}
                                highlightActiveLine={false}
                                value={getFormatSql(
                                    data.indicatorInfo?.where_info?.sql_str,
                                )}
                                editable={false}
                            />
                        </div>
                    </div>
                ) : (
                    <>
                        {timeRestrict && timeRestrict.length ? (
                            <div>
                                <div className={styles.listTitle}>
                                    {__('时间限定：')}
                                </div>
                                <div>
                                    {timeRestrict.map((item) => (
                                        <div
                                            className={classnames(
                                                styles.listItem,
                                                styles.listIconItem,
                                                selectedIds.includes(
                                                    item.field_id,
                                                ) &&
                                                    data.selectDataType !==
                                                        'biz'
                                                    ? styles.itemSelected
                                                    : '',
                                            )}
                                            title={item.business_name}
                                            onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                handleSelectRestrictItem(
                                                    item.field_id,
                                                    'time',
                                                )
                                            }}
                                        >
                                            <span className={styles.icon}>
                                                {getFieldTypeIcon(
                                                    item?.original_data_type ||
                                                        item.date_type,
                                                )}
                                            </span>
                                            <span
                                                className={styles.name}
                                                title={item.business_name}
                                            >
                                                {item.business_name || '--'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                        {bizRestrict && bizRestrict.length ? (
                            <div>
                                <div className={styles.listTitle}>
                                    {__('业务限定：')}
                                </div>
                                <div>
                                    {bizRestrict.map((item) => (
                                        <div
                                            className={classnames(
                                                styles.listItem,
                                                styles.listIconItem,
                                                selectedIds.includes(
                                                    item.field_id,
                                                ) &&
                                                    data.selectDataType !==
                                                        'time'
                                                    ? styles.itemSelected
                                                    : '',
                                            )}
                                            onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                handleSelectRestrictItem(
                                                    item.field_id,
                                                    'biz',
                                                )
                                            }}
                                        >
                                            <span className={styles.icon}>
                                                {getFieldTypeIcon(
                                                    item?.original_data_type ||
                                                        item.date_type,
                                                )}
                                            </span>
                                            <span
                                                className={styles.name}
                                                title={item.business_name}
                                            >
                                                {item.business_name || '--'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </>
                )}
            </div>
        </ConfigProvider>
    )
}

const derivedNode = (callback?: any) => {
    if (callback) {
        callbackColl = callback
    }
    register({
        shape: IndicatorNodeType.DERIVEDNODE,
        effect: ['data'],
        component: DerivedNodeComponent,
    })
    return IndicatorNodeType.DERIVEDNODE
}

export default derivedNode
