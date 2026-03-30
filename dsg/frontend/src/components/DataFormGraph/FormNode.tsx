import * as React from 'react'
import { useState, useEffect, useMemo } from 'react'
import { register } from '@antv/x6-react-shape'
import { v4 as uuidv4 } from 'uuid'
import {
    CloseCircleFilled,
    SearchOutlined,
    LeftOutlined,
    RightOutlined,
    CaretUpOutlined,
    CaretDownOutlined,
} from '@ant-design/icons'
import { Button, Checkbox, ConfigProvider, Tooltip } from 'antd'
import classnames from 'classnames'
import { useDebounce } from 'ahooks'
import {
    FontIcon,
    FormDetailOutlined,
    RecycleBinOutlined,
    StandardOutlined,
    UniqueFlagColored,
} from '@/icons'
import styles from './styles.module.less'
import {
    ExpandStatus,
    FORM_FIELD_HEIGHT,
    FORM_HEADER_HEIGHT,
    FORM_PAGING_HEIGHT,
    FORM_WIDTH,
    getCurrentShowData,
    getOriginDataRelation,
    OptionType,
    searchFieldData,
} from './helper'
import {
    FieldTypeIcon,
    getCommonDataType,
    getFormQueryItem,
    transformQuery,
} from '@/core'
import __ from './locale'
import { SearchInput } from '@/ui'
import { FormTableKind } from '../Forms/const'
import { useGraphContext } from './GraphContext'
import { DestRule, TableFromKindLabel } from './const'
import { useBusinessModelContext } from '../BusinessModeling/BusinessModelProvider'
import PrimaryKeyLabel from './PrimaryKeyLabel'

let callbackColl: any = []
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

const FormNodeComponent = (props: any) => {
    const { node } = props
    const { data } = node
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
    const [model, setModel] = useState<string>('view')
    const { tableKind, usedFieldIds, updateUsedFieldIds } = useGraphContext()
    const { isDraft, selectedVersion } = useBusinessModelContext()
    const versionParams = useMemo(() => {
        return transformQuery({ isDraft, selectedVersion })
    }, [isDraft, selectedVersion])
    useEffect(() => {
        initFormInfo()
    }, [])

    useEffect(() => {
        const updateAllPortAndEdge = callbackColl[1]()
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
        setModel(callbackColl[7]() || 'view')
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

    const initFormInfo = async () => {
        const info = await getFormQueryItem(data.fid, versionParams)
        setFormInfo(info)
    }

    const initOriginNode = () => {
        const viewModel = callbackColl[7]()
        if (node.data.expand === ExpandStatus.Retract) {
            node.resize(FORM_WIDTH, FORM_HEADER_HEIGHT)
        } else if (!originData.length) {
            node.resize(FORM_WIDTH, 166)
        } else if (originData.length <= 10) {
            if (
                viewModel === 'view' ||
                tableKind !== FormTableKind.DATA_FUSION
            ) {
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
        const graphCase = callbackColl[0]()
        const updateAllPortAndEdge = callbackColl[1]()
        if (!graphCase || !graphCase.current) {
            return
        }
        const targetNode = graphCase.current
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
        const quotedFieldsIds = Object.keys(callbackColl[2]().quoteData)
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
            unQuoteFields.map((unQuoteField) => {
                const newFieldMaps = {
                    field_id: unQuoteField.id,
                    business_name: unQuoteField.name,
                    technical_name: unQuoteField.name_en,
                    data_type: unQuoteField.data_type,
                    table_type: formInfo.table_kind,
                    table_id: formInfo.id,
                    table_name: formInfo.name,
                    value_rule_desc: '',
                    description: '',
                    value_rule: DestRule.UNIQUE,
                    sort: 0,
                }
                return {
                    ...unQuoteField,
                    id: uuidv4(),
                    field_map: {
                        dest_rule: DestRule.UNIQUE,
                        source_field: [newFieldMaps],
                        descriptions: '',
                    },
                }
            }),
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
     * 更新目标表
     * @param newFieldData
     * @returns
     */
    const updateTargetData = (fieldData) => {
        let newFieldData = fieldData
        const graphCase = callbackColl[0]()
        const updateAllPortAndEdge = callbackColl[1]()
        if (!graphCase || !graphCase.current) {
            return
        }
        const targetNode = graphCase.current
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
        updateUsedFieldIds([
            ...usedFieldIds,
            ...newAvailableData.map(
                (item) => item.field_map.source_field[0].field_id,
            ),
        ])

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
     * 引用单个字段
     * @param item
     */
    const handleQuoteSingle = (item) => {
        const newFieldMaps = {
            field_id: item.id,
            business_name: item.name,
            technical_name: item.name_en,
            data_type: item.data_type,
            table_type: formInfo.table_kind,
            table_id: formInfo.id,
            table_name: formInfo.name,
            value_rule_desc: '',
            value_rule: DestRule.UNIQUE,
            description: '',
            sort: 0,
            ...([
                FormTableKind.DATA_ORIGIN,
                FormTableKind.DATA_STANDARD,
            ].includes(formInfo.table_kind)
                ? {
                      standard_create_status: item.standard_create_status || '',
                      standard_status: item.standard_status || '',
                      standard_id: item.standard_id || '',
                      open_attribute: item.open_attribute || '',
                      open_condition: item.open_condition || '',
                      sensitive_attribute: item.sensitive_attribute || '',
                      shared_attribute: item.shared_attribute || '',
                      shared_condition: item.shared_condition || '',
                  }
                : {}),
        }

        updateTargetData([
            {
                ...item,
                id: uuidv4(),
                field_map: {
                    dest_rule: DestRule.UNIQUE,
                    source_field: [newFieldMaps],
                    descriptions: '',
                },
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
        const sethasField = callbackColl[8]()
        if (!items.length) {
            return false
        }
        const duplicationData = selectedFieldsUnQuote.filter(
            (selectedField) => {
                return !!items.find((item) => item.name === selectedField.name)
            },
        )
        sethasField(duplicationData.map((duplication) => duplication.name))
        return duplicationData
    }

    /**
     * 获取未被引用的数据
     * @returns 未被引用的数据
     */
    const filterHasQuotedFields = () => {
        const quotedFieldsIds = Object.keys(callbackColl[2]().quoteData)
        return selectedFields.filter(
            (selectedField) => !quotedFieldsIds.includes(`${selectedField.id}`),
        )
    }

    /**
     * 展开和收起组件
     */
    const handleExpandForm = () => {
        const updateAllPortAndEdge = callbackColl[1]()
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
        // packUpOtherNode()
        updateAllPortAndEdge()
    }

    /**
     * 收起其他节点
     */

    const packUpOtherNode = () => {
        const graphCase = callbackColl[0]()
        if (graphCase && graphCase.current) {
            graphCase.current.getNodes().forEach((currentNode) => {
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
        const updateAllPortAndEdge = callbackColl[1]()
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
        const updateAllPortAndEdge = callbackColl[1]()
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
        const keyAndNodeRelation = callbackColl[2]().quoteData
        const edgeRelation = callbackColl[3]()
        const graphCase = callbackColl[0]()
        node.setData({
            ...node.data,
            singleSelectedId: item.id,
        })
        if (graphCase && graphCase.current) {
            const targetNode = graphCase.current
                .getNodes()
                .filter((currentNode) => currentNode.data.type === 'target')[0]
            if (Object.keys(keyAndNodeRelation).includes(`${item.id}`)) {
                targetNode.setData({
                    ...targetNode.data,
                    singleSelectedUniqueId:
                        targetNode.data.items.find(
                            (targetItem) => item.name === targetItem.name,
                        )?.id || '',
                })
                if (edgeRelation.selected) {
                    edgeRelation.quoteData[edgeRelation.selected].attr(
                        'line/stroke',
                        '#979797',
                    )
                }
                edgeRelation.onSelectData(item.id)
                edgeRelation.quoteData[item.id].attr('line/stroke', '#126EE3')
            } else {
                targetNode.setData({
                    ...targetNode.data,
                    singleSelectedUniqueId: '',
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
     * 查看表
     */
    const editForm = (e) => {
        e.preventDefault()
        e.stopPropagation()
        const optionGraphData = callbackColl[4]()
        optionGraphData(OptionType.ViewOriginFormDetail, formInfo, node)
    }
    /**
     * 查看字段
     */
    const viewField = (e, filedInfo) => {
        const optionGraphData = callbackColl[4]()
        optionGraphData(OptionType.ViewOriginFieldDetail, filedInfo, node)
    }

    /**
     * 表格展示字段
     */
    const onViewTable = () => {
        const setViewNode = callbackColl[6]()
        setViewNode(node)
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
                <div className={styles.currentForm}>
                    {formInfo?.table_kind
                        ? TableFromKindLabel[formInfo.table_kind]
                        : '--'}
                </div>
                <div
                    className={classnames(
                        styles.formOriginHeader,
                        styles.formHeader,
                    )}
                >
                    <div
                        className={
                            formInfo?.table_kind === FormTableKind.STANDARD
                                ? styles['top-border']
                                : styles['data-top-border']
                        }
                    />
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
                                    <span
                                        onClick={editForm}
                                        title={formInfo?.name || ''}
                                    >
                                        {formInfo?.name || ''}
                                    </span>
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
                                        title={__('表详情')}
                                    >
                                        <FormDetailOutlined
                                            onClick={() => {
                                                onViewTable()
                                            }}
                                        />
                                    </Tooltip>
                                </div>
                                {model === 'edit' &&
                                tableKind !== FormTableKind.DATA_STANDARD ? (
                                    <div className={styles.formTitleBtn}>
                                        <Tooltip
                                            placement="top"
                                            title={__('移除')}
                                        >
                                            <RecycleBinOutlined
                                                className={styles.formSizeIcon}
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    const setDeleteNode =
                                                        callbackColl[5]()
                                                    if (setDeleteNode) {
                                                        setDeleteNode(node)
                                                    }
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
                                {model === 'edit' &&
                                tableKind === FormTableKind.DATA_FUSION ? (
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
                                            <Button
                                                type="link"
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    handleQuote()
                                                }}
                                                disabled={
                                                    selectedFields.filter(
                                                        (it) =>
                                                            !usedFieldIds.includes(
                                                                it.id,
                                                            ),
                                                    ).length === 0
                                                }
                                            >
                                                {__('映射')}
                                            </Button>
                                        )}
                                    </div>
                                ) : null}

                                {originData.map((item, index) => {
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
                                                {model === 'edit' &&
                                                    tableKind ===
                                                        FormTableKind.DATA_FUSION && (
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
                                                            disabled={usedFieldIds.includes(
                                                                item.id,
                                                            )}
                                                            className={
                                                                styles.checkbox
                                                            }
                                                        />
                                                    )}
                                                <FieldTypeIcon
                                                    dataType={getCommonDataType(
                                                        item.data_type,
                                                    )}
                                                    style={{
                                                        color: 'rgba(0, 0, 0, 0.65)',
                                                    }}
                                                />
                                                <div
                                                    className={
                                                        styles.fromItemText
                                                    }
                                                    title={item.name}
                                                >
                                                    <span
                                                        className={styles.name}
                                                        onClick={(e) => {
                                                            viewField(e, item)
                                                        }}
                                                    >
                                                        {item.name}
                                                    </span>
                                                    {item.standard_status ===
                                                        'normal' &&
                                                    formInfo?.table_kind ===
                                                        FormTableKind.DATA_STANDARD ? (
                                                        <StandardOutlined
                                                            style={{
                                                                color: '#126ee3',
                                                                marginLeft:
                                                                    '5px',
                                                                fontSize: 16,
                                                            }}
                                                        />
                                                    ) : null}
                                                    {item?.is_primary_key ? (
                                                        formInfo?.table_kind ===
                                                        FormTableKind.STANDARD ? (
                                                            <UniqueFlagColored
                                                                className={
                                                                    styles.majorKey
                                                                }
                                                            />
                                                        ) : (
                                                            <PrimaryKeyLabel />
                                                        )
                                                    ) : null}
                                                </div>
                                            </div>
                                            {showFiledOptions === item.id &&
                                            !relationsData.includes(item.id) &&
                                            model === 'edit' &&
                                            tableKind ===
                                                FormTableKind.DATA_FUSION ? (
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
                                                            title={__('映射')}
                                                        >
                                                            <FontIcon
                                                                name="icon-yingshe"
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.preventDefault()
                                                                    e.stopPropagation()
                                                                    if (
                                                                        usedFieldIds.includes(
                                                                            item.id,
                                                                        )
                                                                    ) {
                                                                        return
                                                                    }
                                                                    handleQuoteSingle(
                                                                        item,
                                                                    )
                                                                }}
                                                                style={{
                                                                    opacity:
                                                                        usedFieldIds.includes(
                                                                            item.id,
                                                                        )
                                                                            ? 0.3
                                                                            : 1,
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

const formNode = (callback?: any) => {
    if (callback) {
        callbackColl = callback
    }
    register({
        shape: 'table-node',
        effect: ['data'],
        component: FormNodeComponent,
    })
    return 'table-node'
}

export default formNode
