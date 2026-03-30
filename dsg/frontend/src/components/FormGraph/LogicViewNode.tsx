import * as React from 'react'
import { useState, useEffect } from 'react'
import { register } from '@antv/x6-react-shape'
import {
    CloseCircleFilled,
    SearchOutlined,
    LeftOutlined,
    RightOutlined,
    CaretUpOutlined,
    CaretDownOutlined,
} from '@ant-design/icons'
import { Button, Checkbox, ConfigProvider, Space, Tooltip } from 'antd'
import classnames from 'classnames'
import { useDebounce } from 'ahooks'
import { CopyOutlined, FormDetailOutlined, RecycleBinOutlined } from '@/icons'
import styles from './styles.module.less'
import {
    ExpandStatus,
    FORM_FIELD_HEIGHT,
    FORM_HEADER_HEIGHT,
    FORM_PAGING_HEIGHT,
    FORM_WIDTH,
    getCurrentShowData,
    getOriginDataRelation,
    newFieldTemplate,
    OptionType,
    searchFieldData,
} from './helper'
import { getCommonDataType } from '@/core'
import __ from './locale'
import { SearchInput } from '@/ui'
import { useGraphContext } from './GraphContext'
import { useQuery } from '@/utils'
import { formatDataType, getFieldTypeIcon } from '../DatasheetView/helper'
import { FormatDataTypeToText } from '../DatasheetView/DataQuality/helper'

const bodyStyle = {
    display: 'flex',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    paddingRight: '12px',
    backgroundColor: 'white',
    borderRadius: '4px',
    boxShadow: '0 0 2px 6px transparent',
    overflow: 'hidden',
}

const LogicViewNodeComponent = (props: any) => {
    const { node } = props
    const { data } = node
    const query = useQuery()
    const [selectedFields, setSelectedFields] = useState<Array<any>>([])
    const [indeterminate, setIndeterminate] = useState<boolean>(false)
    const [showFiledOptions, setShowFiledOptions] = useState<string>('')
    const [dataExpand, setDataExpand] = useState<ExpandStatus>(
        ExpandStatus.Expand,
    )
    const [originData, setOriginData] = useState<Array<any>>([])
    const [showPagTurning, setShowPageTurning] = useState<boolean>(false)
    const [singleSelected, setSingleSelected] = useState<string>('')
    const [searchStatus, setSearchStatus] = useState<boolean>(false)
    const [searchKey, setSearchKey] = useState<string>('')
    const debouncedValue = useDebounce(searchKey, { wait: 500 })
    const [formInfo, setFormInfo] = useState<any>(null)
    const [relationsData, setRelationsData] = useState<Array<string>>([])
    // const [model, setModel] = useState<string>('view')
    const model = query.get('defaultModel')

    const {
        graphCase,
        updateAllPortAndEdge,
        keyAndNodeRelation,
        edgeRelation,
        optionGraphData,
        handleDeleteOriginForm,
        onViewFormField,
        setHasField,
        setIsDisabledRelateObj,
        onVieLogicFormField,
    } = useGraphContext()

    useEffect(() => {
        if (debouncedValue !== node.data.keyWord) {
            node.replaceData({
                ...node.data,
                keyWord: debouncedValue,
                offset: 0,
                selectedFiledsId: [],
            })
            setSelectedFields([])
            updateAllPortAndEdge()
        }
    }, [debouncedValue])

    useEffect(() => {
        setSelectedFields(
            data.items.filter((item) =>
                data.selectedFiledsId.includes(item.id),
            ),
        )
        setDataExpand(data.expand)
        if (node.data.keyWord) {
            setSearchKey(node.data.keyWord)
            setSearchStatus(true)
        }
        setOriginData(
            getCurrentShowData(
                data.offset,
                searchFieldData(data.items, data.keyWord),
                10,
            ),
        )
        if (data.expand === ExpandStatus.Retract) {
            setSearchStatus(false)
            setSearchKey('')
        }
        setSingleSelected(data.singleSelectedId)
        setOriginRelationData()
        setFormInfo(data.formInfo)
    }, [data])

    useEffect(() => {
        node.resize(
            FORM_WIDTH,
            node.data.expand === ExpandStatus.Expand ? 576 : FORM_HEADER_HEIGHT,
        )
    }, [originData])

    useEffect(() => {
        const searchData = searchFieldData(data.items, debouncedValue)
        if (
            selectedFields.length &&
            searchData.length > selectedFields.length
        ) {
            setIndeterminate(true)
        } else {
            setIndeterminate(false)
        }
    }, [selectedFields])

    useEffect(() => {
        initOriginNode()
    }, [originData])

    // const initFormInfo = async () => {
    //     const info = await getFormQueryItem(data.fid)
    //     setFormInfo(info)
    // }

    const initOriginNode = () => {
        if (node.data.expand === ExpandStatus.Retract) {
            node.resize(FORM_WIDTH, FORM_HEADER_HEIGHT)
        } else if (!originData.length) {
            node.resize(FORM_WIDTH, 166)
        } else if (originData.length <= 10) {
            if (model === 'view') {
                node.resize(
                    FORM_WIDTH,
                    FORM_HEADER_HEIGHT +
                        originData.length * FORM_FIELD_HEIGHT +
                        FORM_PAGING_HEIGHT,
                )
            } else {
                node.resize(
                    FORM_WIDTH,
                    70 +
                        originData.length * FORM_FIELD_HEIGHT +
                        FORM_PAGING_HEIGHT,
                )
            }
        }
    }
    /**
     * 设置关系data
     */
    const setOriginRelationData = () => {
        if (!graphCase) {
            return
        }
        const targetNode = graphCase
            .getNodes()
            .filter((currentNode) => currentNode.data.type === 'target')[0]
        setRelationsData(
            getOriginDataRelation(targetNode.data.items, node.data.items),
        )
    }
    /**
     * 选择表数据
     * @param e 事件
     */
    const handleSelectedItem = (e) => {
        const { checked, value } = e.target
        if (checked) {
            const selectedFieldsData = [...selectedFields, value]
            setSelectedFields(selectedFieldsData)
            node.replaceData({
                ...data,
                selectedFiledsId: selectedFieldsData.map(
                    (selectedField) => selectedField.id,
                ),
            })
        } else {
            const selectedFieldsData = selectedFields.filter(
                (selectedField) => selectedField.id !== value.id,
            )
            setSelectedFields(selectedFieldsData)
            node.replaceData({
                ...data,
                selectedFiledsId: selectedFieldsData.map(
                    (selectedField) => selectedField.id,
                ),
            })
        }
    }

    /**
     * 选择所有数据
     * @param e
     */
    const handleSelectedAll = (e) => {
        const { checked } = e.target
        const quotedFieldsIds = keyAndNodeRelation
            ? Object.keys(keyAndNodeRelation?.quoteData)
            : []
        const searchData = searchFieldData(data.items, debouncedValue)
        if (checked) {
            setSelectedFields(originData || [])
            node.replaceData({
                ...data,
                selectedFiledsId:
                    searchData.map((selectedField) => selectedField.id) || [],
            })
        } else {
            setSelectedFields(
                searchData.filter((values) =>
                    quotedFieldsIds.includes(values.id),
                ),
            )
            node.replaceData({
                ...data,
                selectedFiledsId: searchData
                    .filter((values) => quotedFieldsIds.includes(values.id))
                    .map((values) => values.id),
            })
        }
    }

    /**
     * 引用
     * @param item
     * @param index
     * @returns
     */
    const handleQuote = () => {
        const unQuoteFields = filterHasQuotedFields()
        updateTargetData(
            unQuoteFields.map((unQuoteField) => ({
                ...unQuoteField,
                id: '',
                ref_id: unQuoteField.id,
            })),
        )
        setSelectedFields([...selectedFields])
        node.replaceData({
            ...data,
            selectedFiledsId: selectedFields.map(
                (selectedField) => selectedField.id,
            ),
        })
    }
    /**
     * 初始化公交表单的默认数据。
     *
     * 此函数通过映射字段数组，为每个字段生成一个具有默认值的对象。
     * 这些默认值基于一个新的字段模板，并根据输入的字段详细信息进行调整。
     * 主要用于在创建新的表单字段时，提供一致且预配置的属性值。
     *
     * @param fields 字段数组，包含需要初始化的字段信息。
     * @returns 返回一个新的字段数组，每个字段都是根据默认模板和输入字段信息生成的。
     */
    const changeDataSheetFieldToBusinessForm = (fields) => {
        return fields.map((dfField) => {
            return {
                ...newFieldTemplate,
                id: '',
                name: dfField.name || undefined,
                name_en: dfField.name_en,
                data_type: getCommonDataType(dfField.data_type),
                data_length: dfField.length,
                data_accuracy: dfField.field_precision,
                is_primary_key: dfField.is_primary_key ? 1 : 0,
                is_incremental_field: 0,
                is_required: dfField.is_required ? 1 : 0,
                is_standardization_required: 0,
                description: dfField.description,
                is_current_business_generation: 0,
            }
        })
    }

    /**
     * 复制
     */
    const handleCopy = () => {
        updateTargetData(changeDataSheetFieldToBusinessForm(selectedFields))

        setSelectedFields([])
        node.replaceData({
            ...data,
            selectedFiledsId: [],
        })
    }

    /**
     * 更新目标表
     * @param newFieldData
     * @returns
     */
    const updateTargetData = (fieldData) => {
        let newFieldData = fieldData

        if (!graphCase) {
            return
        }
        const targetNode = graphCase
            .getNodes()
            .filter((currentNode) => currentNode.data.type === 'target')[0]
        const isExistPrimaryKeyItem = targetNode.data?.items.find(
            (i) => i.is_primary_key === 1,
        )
        if (isExistPrimaryKeyItem) {
            newFieldData = newFieldData.map((item) => ({
                ...item,
                is_primary_key: 0,
            }))
        }
        const duplicationData = checkDeplicationData(
            targetNode.data?.items || [],
            newFieldData,
        )

        const newAvailableData = newFieldData.filter((newData) =>
            duplicationData
                ? !duplicationData.find((dup) => dup.name === newData.name)
                : true,
        )
        if (newAvailableData.length) {
            targetNode?.setData({
                ...targetNode.data,
                uniqueCount:
                    targetNode.data.uniqueCount + newAvailableData.length,
                items: [
                    ...newAvailableData.map((availableData, index) => ({
                        ...availableData,
                        uniqueId: targetNode.data.uniqueCount + index,
                        is_current_business_generation: availableData.ref_id
                            ? 0
                            : availableData.is_current_business_generation,
                    })),
                    ...targetNode.data.items,
                ],
                disabledRelateObj: true,
            })
            updateAllPortAndEdge()
        }
    }

    /**
     * 复制单条数据
     * @param item
     */
    const handleCopySingle = (item) => {
        updateTargetData([
            {
                ...item,
                id: '',
                ref_id: '',
            },
        ])

        setSelectedFields(
            selectedFields.filter((selectedField) => {
                return selectedField.id !== item.id
            }),
        )

        node.setData({
            ...data,
            selectedFiledsId: selectedFields.map(
                (selectedField) => selectedField.id,
            ),
        })
    }

    /**
     * 引用单个字段
     * @param item
     */
    const handleQuoteSingle = (item) => {
        updateTargetData([
            {
                ...item,
                id: '',
                ref_id: item.id,
            },
        ])

        node.replaceData({
            ...data,
            selectedFiledsId: [
                ...(selectedFields.find(
                    (selectedField) => selectedField.id === item.id,
                )
                    ? [...selectedFields].map(
                          (selectedField) => selectedField.id,
                      )
                    : [...selectedFields, item].map(
                          (selectedField) => selectedField.id,
                      )),
            ],
        })
    }

    /**
     * 判断被引用或者复制的是否存在重名
     * @param items
     * @param selectedFieldsUnQuote
     * @returns
     */
    const checkDeplicationData = (items: Array<any>, selectedFieldsUnQuote) => {
        if (!items.length) {
            return false
        }
        const duplicationData = selectedFieldsUnQuote.filter(
            (selectedField) => {
                return !!items.find((item) => item.name === selectedField.name)
            },
        )
        setHasField(duplicationData.map((duplication) => duplication.name))
        return duplicationData
    }

    /**
     * 获取未被引用的数据
     * @returns 未被引用的数据
     */
    const filterHasQuotedFields = () => {
        const quotedFieldsIds = keyAndNodeRelation
            ? Object.keys(keyAndNodeRelation?.quoteData)
            : []
        return selectedFields.filter(
            (selectedField) => !quotedFieldsIds.includes(`${selectedField.id}`),
        )
    }

    /**
     * 展开和收起组件
     */
    const handleExpandForm = () => {
        node.resize(
            FORM_WIDTH,
            node.data.expand === ExpandStatus.Expand ? FORM_HEADER_HEIGHT : 576,
        )
        node.setData({
            ...node.data,
            expand:
                node.data.expand === ExpandStatus.Expand
                    ? ExpandStatus.Retract
                    : ExpandStatus.Expand,
        })
        packUpOtherNode()
        updateAllPortAndEdge()
    }

    /**
     * 收起其他节点
     */

    const packUpOtherNode = () => {
        if (graphCase) {
            graphCase.getNodes().forEach((currentNode) => {
                if (
                    currentNode.id !== node.id &&
                    currentNode.data.type !== 'target' &&
                    currentNode.data.expand === ExpandStatus.Expand
                ) {
                    currentNode.setData({
                        ...currentNode.data,
                        expand: ExpandStatus.Retract,
                    })
                }
            })
        }
    }

    /**
     * 下一页
     */
    const handlePageDown = () => {
        node.replaceData({
            ...node.data,
            offset: data.offset + 1,
        })
        updateAllPortAndEdge()
    }

    /**
     * 上一页
     */
    const handlePageUp = () => {
        node.replaceData({
            ...node.data,
            offset: data.offset - 1,
        })
        updateAllPortAndEdge()
    }

    /**
     * 选择当前行数据
     */
    const handleClickField = (item) => {
        const newKeyAndNodeRelation = keyAndNodeRelation?.quoteData

        node.setData({
            ...node.data,
            singleSelectedId: item.id,
        })
        if (graphCase) {
            const targetNode = graphCase
                .getNodes()
                .filter((currentNode) => currentNode.data.type === 'target')[0]
            if (
                newKeyAndNodeRelation &&
                Object.keys(newKeyAndNodeRelation).includes(`${item.id}`)
            ) {
                targetNode.setData({
                    ...targetNode.data,
                    singleSelectedUniqueId: targetNode.data.items.find(
                        (targetItem) => item.name === targetItem.name,
                    ).uniqueId,
                })
                if (edgeRelation?.selected) {
                    edgeRelation.quoteData[edgeRelation.selected].attr(
                        'line/stroke',
                        '#979797',
                    )
                }
                edgeRelation?.onSelectData(item.id)
                edgeRelation?.quoteData[item.id].attr('line/stroke', '#126EE3')
            } else {
                targetNode.setData({
                    ...targetNode.data,
                    singleSelectedUniqueId: '',
                })
                if (edgeRelation?.selected) {
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
     * 查看表
     */
    const editForm = (e) => {
        e.preventDefault()
        e.stopPropagation()
        optionGraphData(OptionType.ViewOriginFormDetail, data.formInfo, node)
    }
    /**
     * 查看字段
     */
    const viewField = (e, filedInfo) => {
        optionGraphData(OptionType.ViewOriginFieldDetail, filedInfo, node)
    }

    /**
     * 表格展示字段
     */
    const onViewTable = () => {
        onVieLogicFormField(formInfo.id)
    }

    /**
     * 获取选中颜色
     */
    const getSelectClassName = (item) => {
        if (singleSelected === item.id) {
            return styles.formOriginItemSelected
        }
        if (
            selectedFields.find((selectedField) => selectedField.id === item.id)
        ) {
            return styles.formOriginItemChecked
        }
        return ''
    }

    /**
     * 全选的状态
     */
    const getCheckAllStatus = () => {
        const searchData = searchFieldData(data.items, debouncedValue)
        if (selectedFields.length) {
            if (selectedFields.length === searchData.length) {
                return true
            }
            return false
        }
        return false
    }

    /**
     * 全选的禁用状态
     */
    const getCheckAllDisableStatus = () => {
        const searchData = searchFieldData(data.items, debouncedValue)
        const currentRelationData = searchData.filter((values) =>
            relationsData.includes(values.id),
        )
        if (
            selectedFields.length &&
            currentRelationData.length === searchData.length
        ) {
            return true
        }
        return false
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
                    <div className={styles['logic-view-top-border']} />
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
                                {searchStatus ? null : dataExpand ===
                                  ExpandStatus.Expand ? (
                                    <Tooltip placement="top" title={__('收起')}>
                                        <CaretUpOutlined
                                            className={styles.formSizeIcon}
                                            onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                handleExpandForm()
                                            }}
                                        />
                                    </Tooltip>
                                ) : (
                                    <Tooltip placement="top" title={__('展开')}>
                                        <CaretDownOutlined
                                            className={styles.formSizeIcon}
                                            onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                handleExpandForm()
                                            }}
                                        />
                                    </Tooltip>
                                )}

                                <div className={styles.formTitleText}>
                                    <span>{formInfo?.business_name || ''}</span>
                                </div>
                            </div>
                        )}
                        {dataExpand === ExpandStatus.Expand ? (
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
                                        title={__('库表详情')}
                                    >
                                        <FormDetailOutlined
                                            onClick={() => {
                                                onViewTable()
                                            }}
                                        />
                                    </Tooltip>
                                </div>
                                {model === 'edit' ? (
                                    <div className={styles.formTitleBtn}>
                                        <Tooltip
                                            placement="top"
                                            title={__('移除业务表')}
                                        >
                                            <RecycleBinOutlined
                                                className={styles.formSizeIcon}
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    handleDeleteOriginForm(node)
                                                }}
                                            />
                                        </Tooltip>
                                    </div>
                                ) : null}
                            </div>
                        ) : (
                            <div className={styles.formTitleTool}>
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
                            </div>
                        )}
                    </div>
                </div>
                {dataExpand === ExpandStatus.Expand ? (
                    originData.length ? (
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
                                {model === 'edit' ? (
                                    <div className={styles.formToolBar}>
                                        <div>
                                            <Checkbox
                                                indeterminate={indeterminate}
                                                onChange={handleSelectedAll}
                                                checked={getCheckAllStatus()}
                                                disabled={getCheckAllDisableStatus()}
                                            >
                                                <span
                                                    className={styles.selectAll}
                                                >
                                                    {__('全选')}
                                                </span>
                                            </Checkbox>
                                        </div>
                                        {model === 'edit' && (
                                            <Space size={0}>
                                                <Button
                                                    type="link"
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        e.stopPropagation()
                                                        handleCopy()
                                                    }}
                                                    disabled={
                                                        selectedFields.length ===
                                                        0
                                                    }
                                                >
                                                    {__('复制')}
                                                </Button>
                                            </Space>
                                        )}
                                    </div>
                                ) : null}

                                {originData.map((item, index) => {
                                    const type = formatDataType(item.data_type)
                                    return (
                                        <div
                                            className={classnames(
                                                styles.formItem,
                                                styles.formOriginItem,
                                                getSelectClassName(item),
                                            )}
                                            key={item.id}
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
                                                {model === 'edit' && (
                                                    <Checkbox
                                                        value={item}
                                                        onChange={(e) => {
                                                            handleSelectedItem(
                                                                e,
                                                            )
                                                        }}
                                                        checked={
                                                            !!selectedFields.find(
                                                                (
                                                                    selectedField,
                                                                ) =>
                                                                    selectedField.id ===
                                                                    item.id,
                                                            )
                                                        }
                                                        disabled={relationsData.includes(
                                                            `${item.id}`,
                                                        )}
                                                        className={
                                                            styles.checkbox
                                                        }
                                                    />
                                                )}
                                                <span
                                                    title={FormatDataTypeToText(
                                                        type,
                                                    )}
                                                >
                                                    {getFieldTypeIcon(
                                                        {
                                                            ...item,
                                                            type,
                                                        },
                                                        16,
                                                    )}
                                                </span>
                                                <div
                                                    className={
                                                        styles.fromItemText
                                                    }
                                                    title={item.name}
                                                >
                                                    <span
                                                        className={styles.name}
                                                        // onClick={(e) => {
                                                        //     viewField(e, item)
                                                        // }}
                                                    >
                                                        {item.name}
                                                    </span>
                                                </div>
                                            </div>
                                            {showFiledOptions === item.id &&
                                            !relationsData.includes(item.id) &&
                                            model === 'edit' ? (
                                                <div
                                                    className={
                                                        styles.formOptions
                                                    }
                                                >
                                                    <div
                                                        className={
                                                            styles.formTitleBtn
                                                        }
                                                    >
                                                        <Tooltip
                                                            placement="bottom"
                                                            title={__('复制')}
                                                        >
                                                            <CopyOutlined
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.preventDefault()
                                                                    e.stopPropagation()
                                                                    handleCopySingle(
                                                                        item,
                                                                    )
                                                                }}
                                                            />
                                                        </Tooltip>
                                                    </div>
                                                </div>
                                            ) : null}
                                        </div>
                                    )
                                })}
                            </div>

                            {node.data.expand === ExpandStatus.Expand && (
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
                                                      color: 'rgba(0, 0, 0, 0.45)',
                                                      cursor: 'default',
                                                  }
                                                : {}
                                        }
                                    />
                                    <div>
                                        {`${data.offset + 1} /
                                ${Math.ceil(
                                    searchFieldData(data.items, data.keyWord)
                                        .length / 10,
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
                                                      color: 'rgba(0, 0, 0, 0.45)',
                                                      cursor: 'default',
                                                  }
                                                : {}
                                        }
                                    />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={styles.formEmpty}>
                            {debouncedValue
                                ? __('抱歉，没有找到相关内容')
                                : __('暂无数据')}
                        </div>
                    )
                ) : null}
            </div>
        </ConfigProvider>
    )
}

const logicViewNode = () => {
    register({
        shape: 'logic-view-node',
        effect: ['data'],
        component: LogicViewNodeComponent,
    })
    return 'logic-view-node'
}

export default logicViewNode
