import * as React from 'react'
import { useState, useEffect } from 'react'
import { register } from '@antv/x6-react-shape'
import { Node } from '@antv/x6'
import {
    CloseCircleFilled,
    LeftOutlined,
    RightOutlined,
    SearchOutlined,
    DownOutlined,
    UpOutlined,
} from '@ant-design/icons'
import classnames from 'classnames'
import { ConfigProvider, Tooltip } from 'antd'
import { useDebounce } from 'ahooks'
import { trim } from 'lodash'
import {
    BusinessSystemOutlined,
    LibraryOutlined,
    LargeOutlined,
    StringTypeOutlined,
    NumberTypeOutlined,
    LimitDatellined,
    BooleanTypeOutlined,
    BinaryTypeOutlined,
    PkOutlined,
    UnkownTypeOutlined,
    FontIcon,
} from '@/icons'
import styles from './styles.module.less'
import { ExpandStatus, getCurrentShowData } from '../FormGraph/helper'
import __ from './locale'
import { ViewType } from './const'
import { searchFieldData } from './helper'
import { SearchInput } from '@/ui'
import { dataTypeMapping } from '@/core'

let callbackColl: any = {}

const DataFormComponent = (props: any) => {
    const { node } = props
    const { data } = node
    const [showFiledOptions, setShowFiledOptions] = useState<string>('')
    const [targetData, setTargetData] = useState<Array<any>>([])
    const [showPagTurning, setShowPageTurning] = useState<boolean>(false)
    const [singleSelected, setSingleSelected] = useState<Array<string>>([])
    const [formInfo, setFormInfo] = useState<any>(null)
    const [model, setModel] = useState<ViewType>(ViewType.Form)
    const [searchStatus, setSearchStatus] = useState<boolean>(false)
    const [searchKey, setSearchKey] = useState<string>('')
    const debouncedValue = useDebounce(searchKey, { wait: 500 })
    const [showExpandFather, setShowExpandFather] = useState<boolean>(false)

    useEffect(() => {
        const { updateAllPortAndEdge } = callbackColl
        if (debouncedValue !== node.data.keyWord) {
            node.setData({
                ...node.data,
                keyWord: trim(debouncedValue),
                offset: 0,
            })
            updateAllPortAndEdge(node)
        }
    }, [debouncedValue])

    useEffect(() => {
        const currentModel = callbackColl.getModel()
        if (currentModel !== model) {
            setModel(currentModel)
        }

        setTargetData(
            getCurrentShowData(
                data.offset,
                searchFieldData(data.items, data.keyWord),
                10,
            ),
        )
        setSingleSelected(data.singleSelectedId)
        setFormInfo(data.formInfo)
        setShowExpandFather(
            !node.data.expandFather && data?.formInfo?.expansion_flag,
        )
    }, [data, node])

    useEffect(() => {
        initTargetNode()
    }, [targetData])

    const initTargetNode = () => {
        const headerHeight = 75
        if (callbackColl.getModel() === ViewType.Field) {
            if (node.data.expand === ExpandStatus.Retract) {
                node.resize(300, headerHeight)
            } else if (!targetData.length) {
                node.resize(300, 110 + headerHeight)
            } else if (targetData.length <= 10) {
                node.resize(300, headerHeight + targetData.length * 48 + 24)
            }
        } else {
            node.resize(300, headerHeight)
        }
    }

    /**
     * 下一页
     */
    const handlePageDown = () => {
        const { updateAllPortAndEdge } = callbackColl
        node.setData({
            ...data,
            offset: data.offset + 1,
        })
        updateAllPortAndEdge(node)
    }

    /**
     * 上一页
     */
    const handlePageUp = () => {
        const { updateAllPortAndEdge } = callbackColl
        node.setData({
            ...data,
            offset: data.offset - 1,
        })
        updateAllPortAndEdge(node)
    }

    /**
     * 选择当前行数据
     */
    const handleClickField = (item) => {
        const graphCase = callbackColl?.graphCase
        const edgeRelation = callbackColl?.getEdgeRelation()
        node.replaceData({
            ...node.data,
            singleSelectedId: [item.id],
        })
        const allNodes = graphCase.current.getNodes()
        allNodes.forEach((currentNode) => {
            if (currentNode.id !== node.id) {
                currentNode.replaceData({
                    ...currentNode.data,
                    singleSelectedId: [],
                })
            }
        })
        Object.keys(edgeRelation.quoteData).forEach((key) => {
            edgeRelation.quoteData[key]?.forEach((edge) => {
                edge.attr('line/stroke', '#979797')
            })
        })
        edgeRelation.quoteData[item.id]?.forEach((edge) => {
            edge.attr('line/stroke', '#126EE3')
        })

        findIndexData(item, allNodes, edgeRelation)
        findFatherNode(node, item.id, allNodes, edgeRelation)
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
     * 更新画布
     */
    const onUpdateGraph = () => {
        const { updateAllPortAndEdge } = callbackColl
        updateAllPortAndEdge(node)
    }

    const handleLoadFatherNode = () => {
        setShowExpandFather(false)
        callbackColl?.onLoadFatherNode(node)
    }

    /**
     * 获取选中颜色
     */
    const getSelectClassName = (item) => {
        if (singleSelected?.includes(item.id)) {
            return styles.formTargetItemSelected
        }
        return ''
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

    const getFieldTypeIcon = (item) => {
        switch (true) {
            case dataTypeMapping.char.includes(item.type):
                return <StringTypeOutlined style={{ fontSize: 18 }} />
            case dataTypeMapping.int.includes(item.type):
                return (
                    <FontIcon
                        style={{
                            fontSize: 14,
                        }}
                        name="icon-zhengshuxing"
                    />
                )
            case dataTypeMapping.float.includes(item.type):
                return (
                    <FontIcon
                        style={{
                            fontSize: 14,
                        }}
                        name="icon-xiaoshuxing"
                    />
                )
            case dataTypeMapping.decimal.includes(item.type):
                return (
                    <FontIcon
                        style={{
                            fontSize: 14,
                        }}
                        name="icon-gaojingduxing"
                    />
                )
            case dataTypeMapping.number.includes(item.type):
                return <NumberTypeOutlined style={{ fontSize: 18 }} />
            case dataTypeMapping.datetime.includes(item.type):
                return (
                    <FontIcon
                        name="icon-riqishijianxing"
                        style={{ fontSize: 14 }}
                    />
                )
            case dataTypeMapping.date.includes(item.type):
                return <LimitDatellined style={{ fontSize: 14 }} />

            case dataTypeMapping.time.includes(item.type):
                return (
                    <FontIcon
                        name="icon-shijianchuoxing"
                        style={{ fontSize: 14 }}
                    />
                )
            case dataTypeMapping.interval.includes(item.type):
                return (
                    <FontIcon
                        name="icon-shijianduan11"
                        style={{ fontSize: 14 }}
                    />
                )
            case dataTypeMapping.bool.includes(item.type):
                return <BooleanTypeOutlined style={{ fontSize: 18 }} />
            case dataTypeMapping.binary.includes(item.type):
                return <BinaryTypeOutlined style={{ fontSize: 18 }} />
            default:
                return <UnkownTypeOutlined style={{ fontSize: 18 }} />
        }
    }

    const getFieldTypeEelment = (item) => {
        const allTypes = ['varchar', 'number', 'date', 'boolean', 'binary']
        return (
            <Tooltip placement="bottom" title={item.type}>
                {getFieldTypeIcon(item)}
            </Tooltip>
        )
    }

    const getHeaderTitle = () => {
        return (
            <div>
                <div className={styles.formTitle}>
                    {searchStatus ? (
                        <div className={styles.formSearch}>
                            <SearchOutlined
                                style={{
                                    color: 'rgba(0,0,0,0.65)',
                                }}
                            />
                            <SearchInput
                                className={styles.formSearchInput}
                                placeholder={__('搜索字段名称')}
                                bordered={false}
                                showIcon={false}
                                allowClear={false}
                                autoFocus
                                value={searchKey}
                                onBlur={() => {
                                    if (!searchKey) {
                                        setSearchStatus(false)
                                    }
                                }}
                                onChange={(e) => {
                                    setSearchKey(e.target.value)
                                }}
                            />
                            {searchKey && (
                                <CloseCircleFilled
                                    className={styles.clearInput}
                                    onClick={() => {
                                        setSearchKey('')
                                        setSearchStatus(false)
                                    }}
                                />
                            )}
                        </div>
                    ) : (
                        <div className={styles.formTitleLabel}>
                            <div
                                className={classnames(
                                    styles.formTitleText,
                                    node.data.isBase
                                        ? styles.formTitleTextBase
                                        : '',
                                )}
                                title={formInfo?.name || ''}
                            >
                                <span>{formInfo?.name || ''}</span>
                            </div>
                        </div>
                    )}

                    <div className={styles.formTitleTool}>
                        {searchStatus ||
                        !targetData.length ||
                        model === ViewType.Form ? null : (
                            <div className={styles.formTitleBtn}>
                                <Tooltip placement="bottom" title={__('搜索')}>
                                    <SearchOutlined
                                        className={styles.iconBtn}
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            setSearchStatus(true)
                                        }}
                                        style={{
                                            color: 'rgba(0,0,0,0.65)',
                                        }}
                                    />
                                </Tooltip>
                            </div>
                        )}
                    </div>
                </div>
                <div className={styles.headerSystemInfo}>
                    <div className={styles.systemInfo}>
                        <BusinessSystemOutlined
                            style={{ marginRight: '4px', fontSize: '16px' }}
                        />
                        <span
                            className={styles.systemName}
                            title={data?.formInfo?.info_system_name || ''}
                        >
                            {data?.formInfo?.info_system_name || '--'}
                        </span>
                    </div>
                    <div className={styles.systemInfo}>
                        <LibraryOutlined
                            style={{ marginRight: '4px', fontSize: '16px' }}
                        />
                        <span
                            className={styles.systemName}
                            title={data?.formInfo?.db_name || ''}
                        >
                            {data?.formInfo?.db_name || ''}
                        </span>
                    </div>
                    <div
                        className={styles.expandBtn}
                        onClick={(e) => {
                            node.setData({
                                ...node.data,
                                expand:
                                    node.data.expand === ExpandStatus.Expand
                                        ? ExpandStatus.Retract
                                        : ExpandStatus.Expand,
                            })
                            onUpdateGraph()
                            e.preventDefault()
                            e.stopPropagation()
                        }}
                    >
                        {__('字段（${number}）', { number: data.items.length })}
                        {model === ViewType.Field ? (
                            node.data.expand === ExpandStatus.Expand ? (
                                <DownOutlined />
                            ) : (
                                <UpOutlined
                                    onClick={(e) => {
                                        node.setData({
                                            ...node.data,
                                            expand: ExpandStatus.Expand,
                                        })
                                        onUpdateGraph()
                                        e.preventDefault()
                                        e.stopPropagation()
                                    }}
                                />
                            )
                        ) : null}
                    </div>
                </div>
            </div>
        )
    }

    const selectedForm = () => {
        const graphCase = callbackColl?.graphCase
        node.replaceData({
            ...node.data,
            hoverStatus: true,
        })
        if (graphCase && graphCase.current) {
            const allNodes = graphCase.current.getNodes()
            const edgeRelation = callbackColl?.getEdgeRelation()
            Object.keys(edgeRelation.quoteData).forEach((formId) => {
                if (edgeRelation.quoteData[formId]?.length) {
                    edgeRelation.quoteData[formId].forEach((edge) => {
                        edge.attr('line/stroke', '#979797')
                    })
                }
            })
            allNodes.forEach((currentNode) => {
                if (currentNode.data.formInfo.vid !== node.data.formInfo.vid) {
                    currentNode.replaceData({
                        ...currentNode.data,
                        hoverStatus: false,
                    })
                }
            })
            setSelectedFatherNodes(node, allNodes, true)
            setSelectedChildNodes(node, allNodes, true)
        }
    }

    const handleCancelForm = () => {
        const graphCase = callbackColl?.graphCase
        node.replaceData({
            ...node.data,
            hoverStatus: false,
        })

        if (graphCase && graphCase.current) {
            const allNodes = graphCase.current.getNodes()
            const edgeRelation = callbackColl?.getEdgeRelation()
            Object.keys(edgeRelation.quoteData).forEach((formId) => {
                if (edgeRelation.quoteData[formId]?.length) {
                    edgeRelation.quoteData[formId].forEach((edge) => {
                        edge.attr('line/stroke', '#979797')
                    })
                }
            })
            allNodes.forEach((currentNode) => {
                if (currentNode.data.formInfo.vid !== node.data.formInfo.vid) {
                    currentNode.replaceData({
                        ...currentNode.data,
                        hoverStatus: false,
                    })
                }
            })
            setSelectedFatherNodes(node, allNodes, false)
            setSelectedChildNodes(node, allNodes, false)
        }
    }

    const setSelectedFatherNodes = (selectNode, allNodes, select: boolean) => {
        const edgeRelation = callbackColl?.getEdgeRelation()
        edgeRelation.quoteData[selectNode.data.formInfo.vid]?.forEach(
            (edge) => {
                if (select) {
                    edge.attr('line/stroke', '#126EE3')
                } else {
                    edge.attr('line/stroke', '#979797')
                }
            },
        )
        allNodes.forEach((currentNode) => {
            if (
                currentNode.data.formInfo.target_table?.includes(
                    selectNode.data.formInfo.vid,
                ) &&
                selectNode.data.expandFather
            ) {
                currentNode.replaceData({
                    ...currentNode.data,
                    hoverStatus: select,
                })
                setSelectedFatherNodes(currentNode, allNodes, select)
            }
        })
    }

    const setSelectedChildNodes = (selectNode, allNodes, select: boolean) => {
        const edgeRelation = callbackColl?.getEdgeRelation()
        if (selectNode.data.formInfo.target_table) {
            allNodes.forEach((currentNode) => {
                if (
                    selectNode.data.formInfo.target_table.includes(
                        currentNode.data.formInfo.vid,
                    ) &&
                    currentNode.data.expandFather
                ) {
                    currentNode.replaceData({
                        ...currentNode.data,
                        hoverStatus: select,
                    })
                    edgeRelation?.quoteData[
                        currentNode.data.formInfo.vid
                    ]?.forEach((edge) => {
                        if (select) {
                            edge.attr('line/stroke', '#126EE3')
                        } else {
                            edge.attr('line/stroke', '#979797')
                        }
                    })
                    setSelectedChildNodes(currentNode, allNodes, select)
                }
            })
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
                        onMouseEnter={() => {
                            selectedForm()
                        }}
                        onMouseLeave={() => {
                            handleCancelForm()
                        }}
                    >
                        <div className={classnames(styles.formHeader)}>
                            {getHeaderTitle()}
                        </div>
                        {showExpandFather && (
                            <div
                                className={classnames(
                                    styles.addNodeIcon,
                                    node.data.isSelected ||
                                        node.data.hoverStatus
                                        ? styles.addSelectedNodeIcon
                                        : styles.addUnselectedNodeIIcon,
                                )}
                                onClick={(e) => {
                                    handleLoadFatherNode()
                                }}
                            >
                                <LargeOutlined />
                            </div>
                        )}
                    </div>
                    {targetData.length &&
                    node.data.expand === ExpandStatus.Expand &&
                    model === ViewType.Field ? (
                        <div
                            className={styles.formContent}
                            onFocus={() => 0}
                            onBlur={() => 0}
                            onMouseOver={() => {
                                if (
                                    searchFieldData(data.items, data.keyWord)
                                        .length > 10
                                ) {
                                    setShowPageTurning(true)
                                }
                            }}
                            onMouseLeave={() => {
                                setShowPageTurning(false)
                            }}
                        >
                            <div className={styles.formContentData}>
                                {targetData.map((item, index) => {
                                    return (
                                        <div
                                            className={classnames(
                                                styles.formItem,
                                                styles.formTargetItem,
                                                getSelectClassName(item),
                                            )}
                                            key={index}
                                            onFocus={() => 0}
                                            onBlur={() => 0}
                                            onMouseEnter={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                setShowFiledOptions(item.id)
                                            }}
                                            onMouseLeave={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                setShowFiledOptions('')
                                            }}
                                            onClick={(e) => {
                                                handleClickField(item)
                                                e.preventDefault()
                                                e.stopPropagation()
                                            }}
                                        >
                                            <div
                                                className={
                                                    styles.formItemTextContent
                                                }
                                            >
                                                <div
                                                    className={
                                                        styles.formItemIcon
                                                    }
                                                >
                                                    {getFieldTypeEelment(item)}
                                                </div>
                                                <div
                                                    className={
                                                        styles.fromItemText
                                                    }
                                                >
                                                    <div
                                                        title={
                                                            item.business_name
                                                        }
                                                    >
                                                        {item.business_name}
                                                    </div>
                                                    <div
                                                        title={
                                                            item.business_name
                                                        }
                                                        className={
                                                            styles.fromItemSubText
                                                        }
                                                    >
                                                        {item.name}
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                {item?.primary_key_flag && (
                                                    <PkOutlined
                                                        style={{
                                                            color: '#8ED36D ',
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
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
                                    ${Math.ceil(
                                        searchFieldData(
                                            data.items,
                                            data.keyWord,
                                        ).length / 10,
                                    )}`}
                                </div>
                                <RightOutlined
                                    onClick={(e) => {
                                        if (
                                            data.offset + 1 ===
                                            Math.ceil(
                                                searchFieldData(
                                                    data.items,
                                                    data.keyWord,
                                                ).length / 10,
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
                                            searchFieldData(
                                                data.items,
                                                data.keyWord,
                                            ).length / 10,
                                        )
                                            ? {
                                                  color: 'rgba(0,0,0,0.25)',
                                                  cursor: 'default',
                                              }
                                            : {}
                                    }
                                />
                            </div>
                        </div>
                    ) : null}
                </div>
                {!targetData.length &&
                    model === ViewType.Field &&
                    node.data.expand === ExpandStatus.Expand &&
                    node.data.expand === ExpandStatus.Expand && (
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
        shape: 'data-form-node',
        effect: ['data'],
        component: DataFormComponent,
    })
    return 'data-form-node'
}

export default dataFormNode
