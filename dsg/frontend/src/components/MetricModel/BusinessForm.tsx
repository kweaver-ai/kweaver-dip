import * as React from 'react'
import { useState, useEffect } from 'react'
import { register } from '@antv/x6-react-shape'
import {
    CloseCircleFilled,
    LeftOutlined,
    RightOutlined,
    SearchOutlined,
    ExclamationCircleOutlined,
    ShrinkOutlined,
    ArrowsAltOutlined,
} from '@ant-design/icons'
import classnames from 'classnames'
import { Button, ConfigProvider, Input, Tooltip } from 'antd'
import { useDebounce } from 'ahooks'
import {
    AddOutlined,
    DeadlineOutlined,
    DeleteColored,
    FormDetailOutlined,
    RecycleBinOutlined,
    StandardOutlined,
    UnQuoteOutlined,
    XlsColored,
    CloseOutlined,
} from '@/icons'
import { FormFiled } from '@/core/apis/businessGrooming/index.d'
import styles from './styles.module.less'
import {
    ExpandStatus,
    getCurrentShowData,
    newFieldTemplate,
    OptionType,
    searchFieldData,
} from '../FormGraph/helper'
import __ from './locale'
import { getFormInfo } from '@/core'
import { NodeAttribute, ViewModel } from './const'
import { checkCurrentFormOutFields } from './helper'
import { SearchInput } from '@/ui'

let callbackColl: any = []

const BusinessFormComponent = (props: any) => {
    const { node } = props
    const { data } = node
    const [showFiledOptions, setShowFiledOptions] = useState<string>('')
    const [targetData, setTargetData] = useState<Array<any>>([])
    const [showPagTurning, setShowPageTurning] = useState<boolean>(false)
    const [singleSelected, setSingleSelected] = useState<string>('')
    const [formInfo, setFormInfo] = useState<any>(null)
    const [model, setModel] = useState<ViewModel>(ViewModel.ModelEdit)
    const [errorFieldsId, setErrorFieldsId] = useState<Array<string>>([])
    const [searchStatus, setSearchStatus] = useState<boolean>(false)
    const [searchKey, setSearchKey] = useState<string>('')
    const debouncedValue = useDebounce(searchKey, { wait: 500 })
    const [quoteFields, setQuoteFields] = useState<Array<string>>([])
    const [dataTypeOptions, setDataTypeOptions] = useState<Array<any>>([])

    useEffect(() => {
        const data_types = callbackColl[8]()
        node.setData({
            ...data,
            type: 'business',
        })
        setDataTypeOptions(data_types)
    }, [])
    useEffect(() => {
        const updateAllPortAndEdge = callbackColl[1]()
        if (debouncedValue !== node.data.keyWord) {
            node.setData({
                ...node.data,
                keyWord: debouncedValue,
                offset: 0,
            })
            updateAllPortAndEdge(node)
        }
    }, [debouncedValue])

    useEffect(() => {
        setModel(callbackColl[6]() || ViewModel.ModelEdit)
        setTargetData(
            getCurrentShowData(
                data.offset,
                searchFieldData(data.items, data.keyWord),
                10,
            ),
        )
        setSingleSelected(data.singleSelectedId)
        setErrorFieldsId(data.errorDataIds)
        setFormInfo(data.formInfo)
        if (
            data.formAttr === NodeAttribute.InForm &&
            data.relationData?.relations
        ) {
            setQuoteFields(
                data.relationData.relations.map((value) => value.target_field),
            )
        }
    }, [data])

    useEffect(() => {
        initTargetNode()
    }, [targetData])

    const initTargetNode = () => {
        if (node.data.expand === ExpandStatus.Retract) {
            node.resize(400, 56)
        } else if (!targetData.length) {
            node.resize(400, 166)
        } else if (targetData.length <= 10) {
            node.resize(400, 56 + targetData.length * 40 + 24)
        }
    }

    /**
     * 下一页
     */
    const handlePageDown = () => {
        const updateAllPortAndEdge = callbackColl[1]()
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
        const updateAllPortAndEdge = callbackColl[1]()
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
        const graphCase = callbackColl[0]()
        const edgeRelation = callbackColl[7]()
        node.replaceData({
            ...node.data,
            singleSelectedId: item.id,
        })
        const allNodes = graphCase.current.getNodes()
        allNodes.forEach((currentNode) => {
            if (currentNode.id !== node.id) {
                currentNode.setData({
                    ...currentNode.data,
                    singleSelectedId: '',
                })
            }
        })
        if (node.data.formAttr === NodeAttribute.InForm) {
            const currentOutFieldId = node.data.relationData.relations.find(
                (relation) => relation.target_field === item.id,
            )?.src_field

            if (currentOutFieldId) {
                const outFormNodes = allNodes.filter(
                    (currentNode) =>
                        currentNode.data.formAttr === NodeAttribute.outForm,
                )
                const currentOutFormNode = outFormNodes.find((outFormNode) =>
                    outFormNode.data.items.find(
                        (field) => field.id === currentOutFieldId,
                    ),
                )
                if (currentOutFormNode) {
                    currentOutFormNode.replaceData({
                        ...currentOutFormNode.data,
                        singleSelectedId: currentOutFieldId,
                    })
                    if (edgeRelation.multipleSelected.length) {
                        edgeRelation.multipleSelected.forEach((id) => {
                            edgeRelation.quoteData[id]?.attr(
                                'line/stroke',
                                '#979797',
                            )
                        })
                    }
                    edgeRelation.onMultipleSelectData([currentOutFieldId])
                    edgeRelation.quoteData[currentOutFieldId]?.attr(
                        'line/stroke',
                        '#126EE3',
                    )
                }
            }
        } else {
            const inFormNodes = allNodes.filter(
                (currentNode) =>
                    currentNode.data.formAttr === NodeAttribute.InForm,
            )
            const relationInFormNodes = inFormNodes.filter((inform) =>
                inform.data.relationData.relations.find(
                    (relation) => relation.src_field === item.id,
                ),
            )
            if (relationInFormNodes.length) {
                relationInFormNodes.forEach((currentNode) => {
                    const currentTargetId =
                        currentNode.data.relationData.relations.find(
                            (relation) => relation.src_field === item.id,
                        )?.target_field
                    currentNode.replaceData({
                        ...currentNode.data,
                        singleSelectedId: currentTargetId,
                    })
                })
            }
            if (edgeRelation.multipleSelected.length) {
                edgeRelation.multipleSelected.forEach((id) => {
                    edgeRelation.quoteData[id]?.attr('line/stroke', '#979797')
                })
            }
            edgeRelation.onMultipleSelectData([item.id])
            edgeRelation.quoteData[item.id]?.attr('line/stroke', '#126EE3')
        }
    }

    /**
     * 编辑字段
     */
    const editField = (item, index) => {
        const optionGraphData = callbackColl[2]()
        optionGraphData(
            OptionType.ViewOriginFieldDetail,
            { ...item, index },
            node,
        )
    }

    /**
     * 编辑表
     */
    const editForm = (e) => {
        e.preventDefault()
        e.stopPropagation()
        const optionGraphData = callbackColl[2]()
        optionGraphData(OptionType.ViewOriginFormDetail, formInfo, node)
    }

    /**
     * 表格展示字段
     */
    const onViewTable = () => {
        const setViewNode = callbackColl[3]()
        setViewNode(node)
    }

    /**
     * 更新画布
     */
    const onUpdateGraph = () => {
        const onUpdate = callbackColl[1]()
        onUpdate(node)
    }

    /**
     * 获取选中颜色
     */
    const getSelectClassName = (item) => {
        if (errorFieldsId.includes(item.id)) {
            return styles.formTargetItemError
        }
        if (singleSelected === item.id) {
            return styles.formTargetItemSelected
        }
        return ''
    }

    /**
     * 删除贴源表
     */
    const deletePasteForm = () => {
        const setDeleteNode = callbackColl[4]()
        setDeleteNode(node)
    }

    /**
     * 解除连线规则
     */
    const handleUnQuoteFields = (itemId) => {
        const graphCase = callbackColl[0]()

        if (graphCase && graphCase.current) {
            const outFormNodes = graphCase.current
                .getNodes()
                .filter(
                    (currentNode) =>
                        currentNode.data.formAttr === NodeAttribute.outForm,
                )
            const currentOutFieldId = node.data.relationData.relations.find(
                (relation) => relation.target_field === itemId,
            ).src_field
            const inFormNodes = graphCase.current
                .getNodes()
                .filter(
                    (currentNode) =>
                        currentNode.data.formAttr === NodeAttribute.InForm &&
                        currentNode.data.relationData?.relations.length,
                )
            const currentOutFormNode = outFormNodes.find((outFormNode) =>
                outFormNode.data.items.find(
                    (field) => field.id === currentOutFieldId,
                ),
            )
            if (
                !checkCurrentFormOutFields(
                    currentOutFormNode,
                    inFormNodes.filter(
                        (inFormNode) => inFormNode.id !== node.id,
                    ),
                )
            ) {
                currentOutFormNode.replaceData({
                    ...currentOutFormNode.data,
                    formAttr: NodeAttribute.InForm,
                    relationData: {
                        id: currentOutFormNode.data.fid,
                        relations: [],
                    },
                })
            }
        }
        node.replaceData({
            ...node.data,
            relationData: {
                ...node.data.relationData,
                relations: node.data.relationData.relations.filter(
                    (relation) => relation.target_field !== itemId,
                ),
            },
        })
        const updateAllPortAndEdge = callbackColl[1]()
        updateAllPortAndEdge(node)
    }

    const getErrorStatus = (itemData) => {
        if (errorFieldsId.includes(itemData.id)) {
            return (
                <Tooltip placement="bottom" title={__('该数据标准可能被修改!')}>
                    <ExclamationCircleOutlined
                        style={{
                            color: '#F5222D',
                            marginLeft: '5px',
                        }}
                    />
                </Tooltip>
            )
        }
        if (
            itemData.is_standardization_required &&
            itemData.standard_status !== 'normal' &&
            model === ViewModel.ModelEdit
        ) {
            return (
                <Tooltip
                    placement="bottom"
                    title={__('该字段“未标准化”，无法进行连接')}
                >
                    <ExclamationCircleOutlined
                        style={{
                            color: '#F5222D',
                            marginLeft: '5px',
                        }}
                    />
                </Tooltip>
            )
        }
        return null
    }

    return (
        <ConfigProvider
            prefixCls="any-fabric-ant"
            iconPrefixCls="any-fabric-anticon"
        >
            <div className={classnames(styles.formNode, styles.formOriginNode)}>
                <div
                    className={classnames(
                        styles.formOriginHeader,
                        styles.formHeader,
                    )}
                >
                    <div className={styles.formTitle}>
                        {searchStatus ? (
                            <div className={styles.formSearch}>
                                <SearchOutlined />
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
                                <XlsColored />
                                <div
                                    className={
                                        model === ViewModel.ModelEdit
                                            ? styles.formTitleText
                                            : styles.formTitleViewText
                                    }
                                >
                                    <span onClick={editForm}>
                                        {formInfo?.name || ''}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className={styles.formTitleTool}>
                            {searchStatus || !targetData.length ? null : (
                                <div className={styles.formTitleBtn}>
                                    <Tooltip
                                        placement="bottom"
                                        title={__('搜索')}
                                    >
                                        <SearchOutlined
                                            className={styles.iconBtn}
                                            onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                setSearchStatus(true)
                                            }}
                                        />
                                    </Tooltip>
                                </div>
                            )}
                            {model === ViewModel.ModelEdit &&
                                !!targetData.length && (
                                    <div className={styles.formTitleBtn}>
                                        <Tooltip
                                            placement="bottom"
                                            title={__('业务表详情')}
                                        >
                                            <FormDetailOutlined
                                                onClick={() => {
                                                    onViewTable()
                                                }}
                                            />
                                        </Tooltip>
                                    </div>
                                )}
                            {model === ViewModel.ModelEdit && (
                                <div className={styles.formTitleBtn}>
                                    <Tooltip
                                        placement="bottom"
                                        title={__('移除业务表')}
                                    >
                                        <CloseOutlined
                                            className={styles.iconBtn}
                                            onClick={(e) => {
                                                deletePasteForm()
                                                e.preventDefault()
                                                e.stopPropagation()
                                            }}
                                        />
                                    </Tooltip>
                                </div>
                            )}
                            {!!targetData.length && (
                                <div className={styles.formTitleBtn}>
                                    {node.data.expand ===
                                    ExpandStatus.Expand ? (
                                        <Tooltip
                                            placement="bottom"
                                            title={__('收起')}
                                        >
                                            <ShrinkOutlined
                                                onClick={(e) => {
                                                    node.setData({
                                                        ...node.data,
                                                        expand: ExpandStatus.Retract,
                                                    })
                                                    onUpdateGraph()
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                }}
                                            />
                                        </Tooltip>
                                    ) : (
                                        <Tooltip
                                            placement="bottom"
                                            title={__('展开')}
                                        >
                                            <ArrowsAltOutlined
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
                                        </Tooltip>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                {targetData.length &&
                node.data.expand === ExpandStatus.Expand ? (
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
                                        onMouseOver={() => {
                                            setShowFiledOptions(item.id)
                                        }}
                                        onMouseLeave={() => {
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
                                                className={styles.fromItemText}
                                                title={item.name}
                                            >
                                                <span
                                                    onClick={(e) => {
                                                        editField(item, index)
                                                    }}
                                                >
                                                    {item.name}
                                                    {getErrorStatus(item)}
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            {quoteFields.includes(item.id) &&
                                            showFiledOptions === item.id &&
                                            model === ViewModel.ModelEdit ? (
                                                <div
                                                    className={classnames(
                                                        styles.formLeftBtn,
                                                        styles.formTitleBtn,
                                                    )}
                                                >
                                                    <Tooltip
                                                        placement="bottom"
                                                        title={__('解除连接')}
                                                    >
                                                        <UnQuoteOutlined
                                                            onClick={(e) => {
                                                                e.preventDefault()
                                                                e.stopPropagation()
                                                                handleUnQuoteFields(
                                                                    item.id,
                                                                )
                                                            }}
                                                        />
                                                    </Tooltip>
                                                </div>
                                            ) : (
                                                <div>
                                                    {dataTypeOptions.length >
                                                        0 &&
                                                        dataTypeOptions.find(
                                                            (it) => {
                                                                return (
                                                                    it.value_en ===
                                                                    item.data_type
                                                                )
                                                            },
                                                        )?.value}
                                                </div>
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
                ) : (
                    node.data.expand === ExpandStatus.Expand && (
                        <div className={styles.formEmpty}>
                            <div className={styles.formEmpty}>
                                {data.keyWord
                                    ? __('抱歉，没有找到相关内容')
                                    : __('暂无数据')}
                            </div>
                        </div>
                    )
                )}
            </div>
        </ConfigProvider>
    )
}

const businessFormNode = (callback?: any) => {
    if (callback) {
        callbackColl = callback
    }
    register({
        shape: 'table-business-node',
        effect: ['data'],
        component: BusinessFormComponent,
    })
    return 'table-business-node'
}

export default businessFormNode
