import * as React from 'react'
import { useState, useEffect } from 'react'
import { register } from '@antv/x6-react-shape'
import { Node } from '@antv/x6'
import {
    CloseCircleFilled,
    LeftOutlined,
    RightOutlined,
    SearchOutlined,
    ExclamationCircleOutlined,
    ShrinkOutlined,
    ArrowsAltOutlined,
    DownOutlined,
    UpOutlined,
    PlusCircleOutlined,
    PlusCircleFilled,
} from '@ant-design/icons'
import classnames from 'classnames'
import { Button, ConfigProvider, Input, Tooltip } from 'antd'
import { useDebounce } from 'ahooks'
import { trim } from 'lodash'
import {
    BusinessSystemOutlined,
    LibraryOutlined,
    DataAcquisitionOutlined,
    LargeOutlined,
    BaseFormOutlined,
    StringTypeOutlined,
    NumberTypeOutlined,
    LimitDatellined,
    BooleanTypeOutlined,
    BinaryTypeOutlined,
    PkOutlined,
    UnkownTypeOutlined,
    TableFactColored,
    FontIcon,
} from '@/icons'
import styles from './styles.module.less'
import {
    ExpandStatus,
    getCurrentShowData,
    newFieldTemplate,
    OptionType,
} from '../FormGraph/helper'
import __ from './locale'
import {
    BOTTOMHEIGHT,
    FORMNODEHEADEHEIGHT,
    IndicatorNodeType,
    LINEHEIGHT,
    NODEWIDTH,
    NodeAttribute,
    OFFSETHEIGHT,
    ViewModel,
    ViewType,
    calculateFormNodeHeight,
    getCurrentFieldsOffset,
} from './const'
import {
    addDataFormPorts,
    addGraphEdge,
    changeEdgeAttrSelected,
    changeEdgeAttrUnSelected,
    checkCurrentFormOutFields,
    searchFieldData,
    useIndicatorContext,
} from './helper'
import { IconType } from '@/icons/const'
import { dataTypeMapping } from '@/core'
// import { SearchInput } from '@/ui'

let callbackColl: any = {}

const DataFormComponent = (props: any) => {
    const { node } = props
    const { data } = node
    const [targetData, setTargetData] = useState<Array<any>>([])
    const [showPagTurning, setShowPageTurning] = useState<boolean>(false)
    const [selectedIds, setSelectedIds] = useState<Array<string>>([])
    const [formInfo, setFormInfo] = useState<any>(null)
    const [searchKey, setSearchKey] = useState<string>('')
    const debouncedValue = useDebounce(searchKey, { wait: 500 })
    const contextData = useIndicatorContext()

    useEffect(() => {
        const { formData } = data
        if (formData) {
            const { fields } = formData
            initTargetNode(fields)
            setTargetData(getCurrentShowData(data.offset, fields, 10))

            if (
                data.selectedIds.length === 1 &&
                !(
                    selectedIds.length === 1 &&
                    selectedIds[0] === data.selectedIds[0]
                )
            ) {
                pageTurnBySelecteds(data.selectedIds[0], fields, data.offset)
            }
            setSelectedIds(data.selectedIds)
        }

        setFormInfo(data.formData)
    }, [data, node])

    const initTargetNode = (fields) => {
        node.resize(
            NODEWIDTH,
            calculateFormNodeHeight(fields.length || 0, data.offset),
        )
    }

    /**
     * 下一页
     */
    const handlePageDown = () => {
        node.setData({
            ...data,
            offset: data.offset + 1,
        })
        updateFormNodeAndEdge(data.offset + 1, selectedIds)
    }

    /**
     * 上一页
     */
    const handlePageUp = () => {
        node.setData({
            ...data,
            offset: data.offset - 1,
        })
        updateFormNodeAndEdge(data.offset - 1, selectedIds)
    }

    /**
     * 根据选中节点进行翻页
     * @param selectedDataId  选中的
     * @param allFields
     * @param currentOffset
     */
    const pageTurnBySelecteds = (
        selectedDataId: string,
        allFields: Array<any>,
        currentOffset: number,
    ) => {
        let newOffset = getCurrentFieldsOffset(selectedDataId, allFields) - 1
        if (selectedDataId === data.formData?.id) {
            newOffset = 0
        }

        if (newOffset !== currentOffset) {
            node.setData({
                ...data,
                offset: newOffset,
            })
            updateFormNodeAndEdge(newOffset, [selectedDataId])
        }
    }

    /**
     * 跟新数据表节点的桩和边
     * @param offset
     */
    const updateFormNodeAndEdge = (offset, currentSelectedIds) => {
        const { relationStruct, graphCase } = contextData
        if (graphCase) {
            // 获取当前节点的ports
            const currentNodePorts = relationStruct?.portsData.filter(
                (item) => item.nodeId === node.id,
            )
            // 获取当前节点关联的数据
            const connectPortDatas =
                relationStruct?.findConnectPortsDataByNodeId(node.id)

            // 获取关联节点使用的所有字段id
            const fields = connectPortDatas
                ?.map((item) => item.correlationIds)
                .flat()

            // 查询跟当前节点有关系的所有边
            const connectNodeEdges = relationStruct?.edgesData.filter(
                (item) =>
                    item.targetNodeId === node.id ||
                    item.sourceNodeId === node.id,
            )
            // 移除之前的边
            connectNodeEdges?.forEach((item) => {
                graphCase.removeEdge(item.edge.id)
                relationStruct?.deleteEdges(item.edge.id)
            })
            // 移除当前节点的桩
            currentNodePorts?.forEach((item) => {
                relationStruct?.deletePorts(item.portId, node)
            })
            // 更新新位置的桩
            if (relationStruct) {
                addDataFormPorts(node, fields, offset, relationStruct)
                connectPortDatas?.forEach((item) => {
                    addGraphEdge(
                        graphCase,
                        item.ids[0],
                        item.correlationIds[0],
                        relationStruct,
                        currentSelectedIds.includes(item.correlationIds[0]),
                    )
                })
            }
        }
    }

    /**
     * 查找子节点
     * @param item 当前选中字段
     * @param allNodes 所有节点
     */
    const findIndexData = (item, allNodes: Array<Node>, edgeRelation) => {
        if (item?.target_field) {
            const originFormId = Object.keys(item.target_field)
            originFormId.forEach((formId) => {
                const relationNode = allNodes.find(
                    (currentNode) => currentNode.data.formInfo.vid === formId,
                )
                if (relationNode) {
                    relationNode.replaceData({
                        ...relationNode.data,
                        singleSelectedId: item.target_field[formId],
                    })
                    item.target_field[formId].forEach((childrenId) => {
                        edgeRelation.quoteData[childrenId]?.forEach((edge) => {
                            edge.attr('line/stroke', '#126EE3')
                        })
                    })
                    const currentFields = relationNode.data.items.filter(
                        (field) => item.target_field[formId].includes(field.id),
                    )
                    if (currentFields.length) {
                        currentFields.forEach((field) => {
                            findIndexData(field, allNodes, edgeRelation)
                        })
                    }
                }
            })
        }
    }

    /**
     * 选中父节点字段
     * @param childrenNode 子节点
     * @param fieldId 字段id
     * @param allNodes 所有节点
     */
    const findFatherNode = (
        childrenNode,
        fieldId,
        allNodes: Array<Node>,
        edgeRelation,
    ) => {
        const relationNode = allNodes.filter((currentNode) => {
            return currentNode.data.formInfo?.target_table?.includes(
                childrenNode.data.formInfo.vid,
            )
        })

        if (relationNode.length) {
            relationNode.forEach((currentNode) => {
                const field = currentNode.data.items.find((currentField) =>
                    currentField.target_field?.[
                        childrenNode.data.formInfo.vid
                    ]?.includes(fieldId),
                )

                if (field) {
                    currentNode.replaceData({
                        ...currentNode.data,
                        singleSelectedId: [field.id],
                    })
                    edgeRelation.quoteData[field.id]?.forEach((edge) => {
                        edge.attr('line/stroke', '#126EE3')
                    })
                    findFatherNode(
                        currentNode,
                        field.id,
                        allNodes,
                        edgeRelation,
                    )
                }
            })
        }
    }

    /**
     * 选择表
     * @returns
     */
    const getSelectFormClassName = () => {
        if (node.data.isSelected || node.data.hoverStatus) {
            return styles.selectFormOriginNode
        }
        return ''
    }

    const getFieldTypeIcon = (type) => {
        switch (true) {
            case dataTypeMapping.char.includes(type):
                return <StringTypeOutlined style={{ fontSize: 18 }} />
            case dataTypeMapping.int.includes(type):
                return (
                    <FontIcon
                        style={{ fontSize: 14 }}
                        name="icon-zhengshuxing"
                    />
                )
            case dataTypeMapping.float.includes(type):
                return (
                    <FontIcon
                        style={{ fontSize: 14 }}
                        name="icon-xiaoshuxing"
                    />
                )

            case dataTypeMapping.decimal.includes(type):
                return (
                    <FontIcon
                        style={{ fontSize: 14 }}
                        name="icon-gaojingduxing"
                    />
                )
            case dataTypeMapping.number.includes(type):
                return <NumberTypeOutlined style={{ fontSize: 18 }} />
            case dataTypeMapping.datetime.includes(type):
                return (
                    <FontIcon
                        style={{ fontSize: 14 }}
                        name="icon-riqishijianxing"
                    />
                )
            case dataTypeMapping.date.includes(type):
                return <LimitDatellined style={{ fontSize: 14 }} />
            case dataTypeMapping.time.includes(type):
                return (
                    <FontIcon
                        style={{ fontSize: 14 }}
                        name="icon-shijianchuoxing"
                    />
                )
            case dataTypeMapping.interval.includes(type):
                return (
                    <FontIcon
                        style={{ fontSize: 14 }}
                        name="icon-shijianchuoxing"
                    />
                )
            case dataTypeMapping.bool.includes(type):
                return <BooleanTypeOutlined style={{ fontSize: 18 }} />
            case dataTypeMapping.binary.includes(type):
                return <BinaryTypeOutlined style={{ fontSize: 18 }} />
            default:
                return <UnkownTypeOutlined style={{ fontSize: 18 }} />
        }
    }

    const selectedForm = () => {
        // const graphCase = callbackColl?.graphCase
        // node.replaceData({
        //     ...node.data,
        //     hoverStatus: true,
        // })
        // if (graphCase && graphCase.current) {
        //     const allNodes = graphCase.current.getNodes()
        //     const edgeRelation = callbackColl?.getEdgeRelation()
        //     Object.keys(edgeRelation.quoteData).forEach((formId) => {
        //         if (edgeRelation.quoteData[formId]?.length) {
        //             edgeRelation.quoteData[formId].forEach((edge) => {
        //                 edge.attr('line/stroke', '#979797')
        //             })
        //         }
        //     })
        //     allNodes.forEach((currentNode) => {
        //         if (currentNode.data.formInfo.vid !== node.data.formInfo.vid) {
        //             currentNode.replaceData({
        //                 ...currentNode.data,
        //                 hoverStatus: false,
        //             })
        //         }
        //     })
        //     setSelectedFatherNodes(node, allNodes, true)
        //     setSelectedChildNodes(node, allNodes, true)
        // }
    }

    const handleCancelForm = () => {
        // const graphCase = callbackColl?.graphCase
        // node.replaceData({
        //     ...node.data,
        //     hoverStatus: false,
        // })
        // if (graphCase && graphCase.current) {
        //     const allNodes = graphCase.current.getNodes()
        //     const edgeRelation = callbackColl?.getEdgeRelation()
        //     Object.keys(edgeRelation.quoteData).forEach((formId) => {
        //         if (edgeRelation.quoteData[formId]?.length) {
        //             edgeRelation.quoteData[formId].forEach((edge) => {
        //                 edge.attr('line/stroke', '#979797')
        //             })
        //         }
        //     })
        //     allNodes.forEach((currentNode) => {
        //         if (currentNode.data.formInfo.vid !== node.data.formInfo.vid) {
        //             currentNode.replaceData({
        //                 ...currentNode.data,
        //                 hoverStatus: false,
        //             })
        //         }
        //     })
        //     setSelectedFatherNodes(node, allNodes, false)
        //     setSelectedChildNodes(node, allNodes, false)
        // }
    }

    /**
     * 选中数据的事件
     * @param id
     */
    const handleSelectedData = (id: string) => {
        const { relationStruct } = contextData

        if (relationStruct) {
            changeEdgeAttrUnSelected(
                relationStruct.edgesData.map(
                    (currentEdgesData) => currentEdgesData.edge,
                ),
            )
            // 不包含当前节点的其他节点
            const otherNodes = relationStruct.nodes.filter(
                (itemNode) => itemNode.id !== node.id,
            )
            // 更新当前节点的选中状态
            node.replaceData({
                ...data,
                selectedIds: [id],
            })
            // 关联当前字段的节点id
            const nextNodeId = relationStruct
                .getNextConnectNodeId(id)
                .map((itemNode) => itemNode.nodeId)

            // 设置关联当前字段的选中状态
            otherNodes.forEach((currentNode) => {
                if (nextNodeId.includes(currentNode.id)) {
                    currentNode.replaceData({
                        ...currentNode.data,
                        selectedIds: [id],
                        selectDataType: '',
                    })
                } else {
                    currentNode.replaceData({
                        ...currentNode.data,
                        selectedIds: [],
                        selectDataType: '',
                    })
                }
            })
            // 获取需要选中的线
            const connectEdges = relationStruct
                .getLineByParentId(id)
                .map((currentEdge) => currentEdge)
            // 更新选中线的颜色
            if (connectEdges?.length) {
                changeEdgeAttrSelected(connectEdges)
            }
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
                    getSelectFormClassName(),
                )}
            >
                <div>
                    <div
                        className={classnames(styles.formOriginHeader)}
                        // onMouseEnter={() => {
                        //     selectedForm()
                        // }}
                        // onMouseLeave={() => {
                        //     handleCancelForm()
                        // }}
                    >
                        <div className={styles.formDataTip}>{__('数据表')}</div>
                        <div className={styles.titleLine} />
                        <div
                            className={styles.nameContainer}
                            style={{ margin: '6px 0' }}
                        >
                            <div className={styles.iconContainer}>
                                <FontIcon
                                    name="icon-shujubiao"
                                    type={IconType.COLOREDICON}
                                    style={{
                                        fontSize: 18,
                                    }}
                                />
                            </div>
                            <div
                                className={styles.name}
                                title={formInfo?.business_name || ''}
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    contextData.onSelectedDataView(formInfo?.id)
                                }}
                            >
                                {formInfo?.business_name || '--'}
                            </div>
                        </div>
                    </div>
                    {targetData.length ? (
                        <div
                            className={styles.formContent}
                            onFocus={() => 0}
                            onBlur={() => 0}
                            onMouseOver={() => {
                                // if (
                                //     searchFieldData(data.items, data.keyWord)
                                //         .length > 10
                                // ) {
                                //     setShowPageTurning(true)
                                // }
                            }}
                            onMouseLeave={() => {
                                setShowPageTurning(false)
                            }}
                        >
                            <div>
                                {targetData.map((item, index) => {
                                    return (
                                        <div
                                            className={classnames(
                                                styles.listItem,
                                                styles.listIconItem,
                                                selectedIds.includes(item.id)
                                                    ? styles.itemSelected
                                                    : '',
                                            )}
                                            key={index}
                                            onFocus={() => 0}
                                            onBlur={() => 0}
                                            onMouseEnter={(e) => {
                                                // e.preventDefault()
                                                // e.stopPropagation()
                                                // setShowFiledOptions(item.id)
                                            }}
                                            onMouseLeave={(e) => {
                                                // e.preventDefault()
                                                // e.stopPropagation()
                                                // setShowFiledOptions('')
                                            }}
                                            onClick={(e) => {
                                                handleSelectedData(item.id)
                                                e.preventDefault()
                                                e.stopPropagation()
                                            }}
                                        >
                                            <span className={styles.icon}>
                                                {getFieldTypeIcon(
                                                    item.data_type,
                                                )}
                                            </span>
                                            <span
                                                className={styles.name}
                                                title={item.business_name}
                                            >
                                                {item.business_name || '--'}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                            {formInfo?.fields?.length > 10 ? (
                                <div
                                    className={classnames(
                                        styles.formContentPageTurning,
                                        styles.originFormPageTurning,
                                    )}
                                    onMouseEnter={() => {
                                        selectedForm()
                                    }}
                                    onMouseLeave={() => {
                                        handleCancelForm()
                                    }}
                                >
                                    <LeftOutlined
                                        onClick={(e) => {
                                            if (data.offset === 0) {
                                                return
                                            }
                                            e.preventDefault()
                                            e.stopPropagation()
                                            handlePageUp()
                                        }}
                                        style={
                                            data.offset === 0
                                                ? {
                                                      color: 'rgba(0,0,0,0.25)',
                                                      cursor: 'default',
                                                  }
                                                : {}
                                        }
                                    />
                                    <div>
                                        {`${data.offset + 1} /
                                    ${Math.ceil(formInfo.fields.length / 10)}`}
                                    </div>
                                    <RightOutlined
                                        onClick={(e) => {
                                            if (
                                                data.offset + 1 ===
                                                Math.ceil(
                                                    formInfo.fields.length / 10,
                                                )
                                            ) {
                                                return
                                            }
                                            e.preventDefault()
                                            e.stopPropagation()
                                            handlePageDown()
                                        }}
                                        style={
                                            data.offset + 1 ===
                                            Math.ceil(
                                                formInfo.fields.length / 10,
                                            )
                                                ? {
                                                      color: 'rgba(0,0,0,0.25)',
                                                      cursor: 'default',
                                                  }
                                                : {}
                                        }
                                    />
                                </div>
                            ) : null}
                        </div>
                    ) : null}
                </div>
                {!targetData.length && (
                    <div className={styles.formEmpty}>
                        <div className={styles.formEmpty}>
                            {debouncedValue
                                ? __('抱歉，没有找到相关内容')
                                : __('暂无数据')}
                        </div>
                    </div>
                )}
            </div>
        </ConfigProvider>
    )
}

const dataFormNode = (callback?: any) => {
    if (callback) {
        callbackColl = callback
    }
    register({
        shape: IndicatorNodeType.DATAFORMNODE,
        effect: ['data'],
        component: DataFormComponent,
    })
    return IndicatorNodeType.DATAFORMNODE
}

export default dataFormNode
