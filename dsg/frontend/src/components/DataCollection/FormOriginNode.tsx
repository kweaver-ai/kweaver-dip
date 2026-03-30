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
import { ConfigProvider, Tooltip } from 'antd'
import { useDebounce } from 'ahooks'
import { FormDetailOutlined, UnQuoteOutlined, XlsColored } from '@/icons'
import styles from './styles.module.less'
import {
    ExpandStatus,
    getCurrentShowData,
    newFieldTemplate,
    OptionType,
    searchFieldData,
} from '../FormGraph/helper'
import __ from './locale'
import { formsEnumConfig } from '@/core'
import { ViewModel } from './const'
import { SearchInput } from '@/ui'

let callbackColl: any = []

const FormOriginNodeComponent = (props: any) => {
    const { node } = props
    const { data } = node
    const [showFiledOptions, setShowFiledOptions] = useState<string>('')
    const [targetData, setTargetData] = useState<Array<any>>([])
    const [showPagTurning, setShowPageTurning] = useState<boolean>(false)
    const [singleSelected, setSingleSelected] = useState<string>('')
    const [formInfo, setFormInfo] = useState<any>(null)
    const [searchStatus, setSearchStatus] = useState<boolean>(false)
    const [searchKey, setSearchKey] = useState<string>('')
    const debouncedValue = useDebounce(searchKey, { wait: 500 })
    const [model, setModel] = useState<ViewModel>(ViewModel.ModelEdit)
    const [errorFieldsId, setErrorFieldsId] = useState<Array<string>>([])
    const [dataTypeOptions, setDataTypeOptions] = useState<Array<any>>([])

    useEffect(() => {
        getEnumConfig()
        node.setData({
            ...data,
            type: 'origin',
        })
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
        setErrorFieldsId(data.errorFieldsId)
        setFormInfo(data.formInfo)
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
     * 解绑字段
     * @param items
     */
    const handleUnQuoteFields = (item) => {
        node.setData({
            ...node.data,
            items: node.data?.items.map((targetItem) => {
                if (item.id === targetItem.id) {
                    cancelOriginFormFiledSelected(targetItem.source_id)
                    return {
                        ...targetItem,
                        source_id: '',
                    }
                }
                return targetItem
            }),
        })
        updatePasteForm(item.source_id)
    }

    /**
     * 取消源表单的字段选中状态
     * @param refId
     */
    const cancelOriginFormFiledSelected = (sourceId: string) => {
        // const keyAndNodeRelation = callbackColl[2]()
        // const originNode = keyAndNodeRelation.quoteData[refId]
        // originNode?.replaceData({
        //     ...originNode.data,
        //     selectedFiledsId: originNode.data.selectedFiledsId.filter(
        //         (id) => id !== refId,
        //     ),
        // })
        // keyAndNodeRelation.deleteData(refId)
    }

    /**
     * 更新贴源表
     * @param sourceId
     */
    const updatePasteForm = (sourceId: string) => {
        const graphCase = callbackColl[0]()
        const updateAllPortAndEdge = callbackColl[1]()
        const loadPortsForPasteForm = callbackColl[5]()
        if (graphCase && graphCase.current) {
            const allNodes = graphCase.current.getNodes()
            const pasteNodes = allNodes.filter(
                (allNode) => allNode.data.type === 'pasteSource',
            )
            const pasteNode = pasteNodes.find((itemNode) =>
                itemNode.data.items.find(
                    (itemField) => itemField.id === sourceId,
                ),
            )
            loadPortsForPasteForm(pasteNode)
            updateAllPortAndEdge(node)
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
        if (graphCase && graphCase.current) {
            const allNodes = graphCase.current.getNodes()
            if (item.source_id) {
                allNodes.forEach((currentNode) => {
                    if (currentNode.shape === 'table-paste-node') {
                        const { items } = currentNode.data
                        if (
                            items.find(
                                (pasteItem) => pasteItem.id === item.source_id,
                            )
                        ) {
                            currentNode.setData({
                                ...currentNode.data,
                                singleSelectedId: item.source_id,
                            })
                            if (edgeRelation.selected) {
                                edgeRelation.quoteData[
                                    edgeRelation.selected
                                ].attr('line/stroke', '#979797')
                            }
                            edgeRelation.onSelectData(item.source_id)
                            edgeRelation.quoteData[item.source_id].attr(
                                'line/stroke',
                                '#126EE3',
                            )
                        } else {
                            currentNode.setData({
                                ...currentNode.data,
                                singleSelectedId: '',
                            })
                            if (edgeRelation.selected) {
                                edgeRelation.quoteData[
                                    edgeRelation.selected
                                ].attr('line/stroke', '#979797')
                                edgeRelation.onSelectData('')
                            }
                        }
                    }
                })
            } else {
                allNodes.forEach((currentNode) => {
                    if (currentNode.shape === 'table-paste-node') {
                        currentNode.setData({
                            ...currentNode.data,
                            singleSelectedId: '',
                        })
                    }
                })
                if (edgeRelation.selected) {
                    edgeRelation.quoteData[edgeRelation.selected].attr(
                        'line/stroke',
                        '#979797',
                    )
                    edgeRelation.onSelectData('')
                }
            }
        }
    }

    /**
     * 创建字段
     */
    const createField = () => {
        const updateAllPortAndEdge = callbackColl[4]()
        updateAllPortAndEdge(
            OptionType.CreateTargetNewField,
            { ...newFieldTemplate, uniqueId: node.data.uniqueCount },
            node,
        )
        node.setData({
            ...node.data,
            uniqueCount: node.data.uniqueCount + 1,
        })
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
        if (singleSelected === item.id) {
            return styles.formTargetItemSelected
        }
        if (errorFieldsId.includes(item.id)) {
            return styles.formTargetItemError
        }
        return ''
    }
    // 获取枚举值
    const getEnumConfig = async () => {
        const enumConfig = await formsEnumConfig()
        setDataTypeOptions(enumConfig?.data_type)
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
                                <div className={styles.formTitleText}>
                                    <span onClick={editForm}>
                                        {formInfo?.name || ''}
                                    </span>
                                </div>
                            </div>
                        )}

                        {!!targetData.length && (
                            <div className={styles.formTitleTool}>
                                {searchStatus ? null : (
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
                            </div>
                        )}
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
                                searchFieldData(data.items, debouncedValue)
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
                                                    {item.is_standardization_required &&
                                                    item.standard_status !==
                                                        'normal' ? (
                                                        <Tooltip
                                                            placement="bottom"
                                                            title={__(
                                                                '该字段“未标准化”，无法进行采集',
                                                            )}
                                                        >
                                                            <ExclamationCircleOutlined
                                                                style={{
                                                                    color: '#F5222D',
                                                                    marginLeft:
                                                                        '5px',
                                                                }}
                                                            />
                                                        </Tooltip>
                                                    ) : null}
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            {showFiledOptions === item.id &&
                                            model === ViewModel.ModelEdit ? (
                                                <div
                                                    className={
                                                        styles.formOptions
                                                    }
                                                >
                                                    {item.source_id ? (
                                                        <div
                                                            className={classnames(
                                                                styles.formLeftBtn,
                                                                styles.formTitleBtn,
                                                            )}
                                                        >
                                                            <Tooltip
                                                                placement="bottom"
                                                                title={__(
                                                                    '解绑',
                                                                )}
                                                            >
                                                                <UnQuoteOutlined
                                                                    onClick={(
                                                                        e,
                                                                    ) => {
                                                                        e.preventDefault()
                                                                        e.stopPropagation()
                                                                        handleUnQuoteFields(
                                                                            item,
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
                                            debouncedValue,
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
                                                debouncedValue,
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
                                            debouncedValue,
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
                                {debouncedValue
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

const formOriginNode = (callback?: any) => {
    if (callback) {
        callbackColl = callback
    }
    register({
        shape: 'table-origin-node',
        effect: ['data'],
        component: FormOriginNodeComponent,
    })
    return 'table-origin-node'
}

export default formOriginNode
