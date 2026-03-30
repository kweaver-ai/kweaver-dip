import * as React from 'react'
import { useState, useEffect } from 'react'
import { register } from '@antv/x6-react-shape'
import { v4 as uuidv4 } from 'uuid'
import {
    RightOutlined,
    LeftOutlined,
    CloseCircleFilled,
    SearchOutlined,
    ExclamationCircleOutlined,
    SwapOutlined,
} from '@ant-design/icons'
import classnames from 'classnames'
import { Button, Checkbox, ConfigProvider, Divider, Tooltip } from 'antd'
import { useDebounce } from 'ahooks'
import {
    AddOutlined,
    FontIcon,
    FormDetailOutlined,
    RecycleBinOutlined,
    StandardOutlined,
    UnQuoteOutlined,
} from '@/icons'
import styles from './styles.module.less'
import {
    FORM_FIELD_HEIGHT,
    FORM_HEADER_HEIGHT,
    FORM_PAGING_HEIGHT,
    FORM_WIDTH,
    getCurrentShowData,
    newFieldTemplate,
    OptionType,
    searchFieldData,
    TARGET_LIMIT,
} from './helper'
import __ from './locale'
import { SearchInput } from '@/ui'
import { FormTableKind } from '../Forms/const'
import { useGraphContext } from './GraphContext'
import { TableCurrentKindLabel } from './const'
import { FieldTypeIcon, getCommonDataType } from '@/core'
import { IconType } from '@/icons/const'
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

const FormTargetNodeComponent = (props: any) => {
    const { node } = props
    const { data } = node
    const [selectedFields, setSelectedFields] = useState<Array<any>>([])
    const [indeterminate, setIndeterminate] = useState<boolean>(false)
    const [showFiledOptions, setShowFiledOptions] = useState<number>(0)
    const [targetData, setTargetData] = useState<Array<any>>([])
    const [showPagTurning, setShowPageTurning] = useState<boolean>(false)
    const [singleSelected, setSingleSelected] = useState<number>(0)
    const [formInfo, setFormInfo] = useState<any>(null)
    const [searchStatus, setSearchStatus] = useState<boolean>(false)
    const [searchKey, setSearchKey] = useState<string>('')
    const debouncedValue = useDebounce(searchKey, { wait: 500 })
    const [model, setModel] = useState<string>('view')
    const [errorFieldIds, setErrorFieldsId] = useState<Array<string>>([])
    const {
        onSortField,
        usedFieldIds,
        updateUsedFieldIds,
        onOpenConvergenceRules,
        configRulesInfo,
    } = useGraphContext()

    useEffect(() => {
        node.setData({
            ...data,
            type: 'target',
            items: [],
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
            setSelectedFields([])
            updateAllPortAndEdge()
        }
    }, [debouncedValue])

    useEffect(() => {
        setModel(callbackColl[6]() || 'view')
        setTargetData(
            getCurrentShowData(
                data.offset,
                searchFieldData(data.items, data.keyWord),
                TARGET_LIMIT,
            ),
        )
        setSingleSelected(data.singleSelectedUniqueId)
        setSelectedFields(
            selectedFields.filter((selected) =>
                data.items.find((item) => item.id === selected.id),
            ),
        )
        setFormInfo(data.formInfo)
        const initErrors = callbackColl[10]()
        if (initErrors) {
            setErrorFieldsId(Object.keys(initErrors))
        } else {
            setErrorFieldsId([])
        }
    }, [data])

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
        initTargetNode()
    }, [targetData])

    /**
     * 选择表数据
     * @param e 事件
     */
    const handleSelectedItem = (e) => {
        const { checked, value } = e.target
        if (checked) {
            setSelectedFields([...selectedFields, value])
        } else {
            setSelectedFields(
                selectedFields.filter(
                    (selectedField) =>
                        selectedField.uniqueId !== value.uniqueId,
                ),
            )
        }
    }

    const initTargetNode = () => {
        if (!targetData.length) {
            node.resize(FORM_WIDTH, 166)
        } else if (targetData.length <= 10) {
            if (
                model === 'view' ||
                formInfo.table_kind !== FormTableKind.DATA_FUSION
            ) {
                node.resize(
                    FORM_WIDTH,
                    FORM_HEADER_HEIGHT +
                        targetData.length * FORM_FIELD_HEIGHT +
                        FORM_PAGING_HEIGHT,
                )
            } else {
                const updateAllPortAndEdge = callbackColl[1]()
                node.resize(
                    FORM_WIDTH,
                    70 +
                        targetData.length * FORM_FIELD_HEIGHT +
                        FORM_PAGING_HEIGHT,
                )
                updateAllPortAndEdge()
            }
        }
    }

    /**
     * 选择所有数据
     * @param e
     */
    const handleSelectedAll = (e) => {
        const { checked } = e.target
        const searchData = searchFieldData(data.items, debouncedValue)
        if (checked) {
            setSelectedFields(searchData || [])
        } else {
            setSelectedFields([])
        }
    }

    /**
     * 批量解绑
     */
    const handleUnQuoteSeletedFileds = () => {
        handleUnQuoteFields(
            selectedFields.filter(
                (selectedField) =>
                    selectedField?.field_map?.source_field?.length,
            ),
        )
    }

    /**
     * 解绑字段
     * @param items
     */
    const handleUnQuoteFields = (items) => {
        const updateAllPortAndEdge = callbackColl[1]()
        let unBindIds: Array<string> = []
        node.replaceData({
            ...node.data,
            items: node.data?.items.map((targetItem) => {
                if (items.find((item) => item.id === targetItem.id)) {
                    cancelOriginFormFiledSelected(
                        targetItem?.field_map?.source_field || [],
                    )
                    unBindIds = [
                        ...unBindIds,
                        ...targetItem.field_map.source_field.map(
                            (it) => it.field_id,
                        ),
                    ]
                    return {
                        ...targetItem,
                        field_map: {
                            ...items.field_map,
                            source_field: [],
                        },
                    }
                }
                return targetItem
            }),
        })
        updateUsedFieldIds(usedFieldIds.filter((it) => !unBindIds.includes(it)))
        updateAllPortAndEdge()
    }

    /**
     * 删除字段
     * @param items
     */
    const handleDeleteFields = (items) => {
        const setDeleteData = callbackColl[7]()
        setDeleteData(items)
    }

    const handleStandardField = (item) => {
        const updateAllPortAndEdge = callbackColl[1]()
        node.replaceData({
            ...node.data,
            items: node.data.items
                .filter((it) => it.index !== item.index)
                .map((it, index) => ({ ...it, index: index + 1 })),
        })
        updateAllPortAndEdge()
    }

    /**
     * 取消源表单的字段选中状态
     * @param refId
     */
    const cancelOriginFormFiledSelected = (fields: Array<any>) => {
        const keyAndNodeRelation = callbackColl[2]()
        fields.forEach((field) => {
            const originNode =
                keyAndNodeRelation.quoteData[field?.field_id || '']
            originNode?.replaceData({
                ...originNode.data,
                selectedFiledsId: originNode.data.selectedFiledsId.filter(
                    (id) => id !== field?.field_id,
                ),
            })
            keyAndNodeRelation.deleteData(field?.field_id || '')
        })
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
        updateAllPortAndEdge()
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
        updateAllPortAndEdge()
    }

    /**
     * 选择当前行数据
     */
    const handleClickField = (item) => {
        const graphCase = callbackColl[0]()
        const edgeRelation = callbackColl[3]()
        if (node.data.editStatus) {
            return
        }
        node.setData({
            ...node.data,
            singleSelectedUniqueId: item.uniqueId,
        })
        if (graphCase && graphCase.current) {
            const allNodes = graphCase.current.getNodes()
            if (item.field_map?.source_field?.length) {
                const keyAndNodeRelation = callbackColl[2]().quoteData
                item.field_map.source_field.forEach((field) => {
                    allNodes.forEach((currentNode) => {
                        if (
                            currentNode.id ===
                            keyAndNodeRelation[field.field_id]?.id
                        ) {
                            currentNode.setData({
                                ...currentNode.data,
                                singleSelectedId: field.field_id,
                            })
                            if (edgeRelation.selected) {
                                edgeRelation.quoteData[
                                    edgeRelation.selected
                                ].attr('line/stroke', '#979797')
                            }
                            edgeRelation.onSelectData(field.field_id)
                            edgeRelation.quoteData[field.field_id].attr(
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
                    })
                })
            } else {
                allNodes.forEach((currentNode) => {
                    currentNode.setData({
                        ...currentNode.data,
                        singleSelectedId: '',
                    })
                })
                if (edgeRelation.selected) {
                    edgeRelation.quoteData[edgeRelation.selected]?.attr(
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
            {
                ...newFieldTemplate,
                uniqueId: node.data.uniqueCount,
                id: uuidv4(),
            },
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
        const optionGraphData = callbackColl[4]()
        if (item.ref_id) {
            node.setData({
                ...node.data,
                editStatus: false,
            })
            optionGraphData(
                model === 'edit'
                    ? OptionType.EditTargetField
                    : OptionType.ViewTargetField,
                { ...item, index },
                node,
            )
        } else {
            node.setData({
                ...node.data,
                editStatus: false,
            })
            optionGraphData(
                model === 'edit'
                    ? OptionType.EditTargetField
                    : OptionType.ViewTargetField,
                { ...item, index },
                node,
            )
        }
    }

    /**
     * 编辑表
     */
    const editForm = (e) => {
        e.preventDefault()
        e.stopPropagation()
        const optionGraphData = callbackColl[4]()
        optionGraphData(
            model === 'edit'
                ? OptionType.EditTargetForm
                : OptionType.ViewTargetForm,
            formInfo,
            node,
        )
    }

    /**
     * 表格展示字段
     */
    const onViewTable = () => {
        const setViewNode = callbackColl[5]()
        setViewNode(node)
    }

    /**
     * 获取选中颜色
     */
    const getSelectClassName = (item) => {
        if (singleSelected === item.uniqueId) {
            return styles.formTargetItemSelected
        }
        if (
            selectedFields.find(
                (selectedField) => selectedField.uniqueId === item.uniqueId,
            )
        ) {
            return styles.formTargetItemItemChecked
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
     * 关联业务表对象/活动
     */
    const relateBusinessObject = () => {
        if (data.disabledRelateObj) return
        callbackColl[8]()(true)
    }

    return (
        <ConfigProvider
            prefixCls="any-fabric-ant"
            iconPrefixCls="any-fabric-anticon"
        >
            <div className={classnames(styles.formNode, styles.formOriginNode)}>
                <div className={styles.currentForm}>
                    {formInfo?.table_kind
                        ? TableCurrentKindLabel[formInfo.table_kind]
                        : '--'}
                </div>
                <div
                    className={classnames(
                        styles.formTargetHeader,
                        styles.formHeader,
                    )}
                >
                    <div className={styles['data-top-border']} />
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
                                <FontIcon
                                    type={IconType.COLOREDICON}
                                    name="icon-shujubiaoicon"
                                    style={{ fontSize: 20 }}
                                />
                                <div className={styles.formTitleText}>
                                    <span
                                        onClick={editForm}
                                        title={formInfo?.name || ''}
                                    >
                                        {formInfo?.name || ''}
                                    </span>
                                    {errorFieldIds.length ? (
                                        <Tooltip
                                            title={__(
                                                '${count}个字段属性不完整',
                                                { count: errorFieldIds.length },
                                            )}
                                        >
                                            <ExclamationCircleOutlined
                                                className={
                                                    styles.incompleteIcon
                                                }
                                            />
                                        </Tooltip>
                                    ) : null}
                                </div>
                            </div>
                        )}

                        <div className={styles.formTitleTool}>
                            {targetData.length ? (
                                searchStatus ? null : (
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
                                )
                            ) : null}
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
                            {/* {formInfo?.table_kind ===
                                FormTableKind.STANDARD && (
                                <div className={styles.formTitleBtn}>
                                    <Tooltip
                                        placement="bottom"
                                        title={
                                            data.disabledRelateObj
                                                ? __(
                                                      '请保存后，再定义业务对象/活动',
                                                  )
                                                : __('定义业务对象/活动')
                                        }
                                    >
                                        <DefineBusinessObjOutlined
                                            className={classnames(
                                                styles.relateObjIcon,
                                                data.disabledRelateObj &&
                                                    styles.disabledRelateObjIcon,
                                            )}
                                            onClick={() => {
                                                relateBusinessObject()
                                            }}
                                        />
                                    </Tooltip>
                                </div>
                            )} */}
                            {model === 'edit' && (
                                <div
                                    className={styles.formTitleBtn}
                                    onClick={() => {
                                        onSortField(node)
                                    }}
                                    style={{
                                        transform: 'rotate(-90deg)',
                                    }}
                                >
                                    <Tooltip
                                        placement="bottom"
                                        title={__('排序')}
                                    >
                                        <SwapOutlined />
                                    </Tooltip>
                                </div>
                            )}
                            {model === 'edit' &&
                                formInfo?.table_kind !==
                                    FormTableKind.DATA_ORIGIN && (
                                    <div
                                        className={styles.formTitleBtn}
                                        onClick={() => {
                                            createField()
                                        }}
                                    >
                                        <Tooltip
                                            placement="bottom"
                                            title={__('新建字段')}
                                        >
                                            <AddOutlined />
                                        </Tooltip>
                                    </div>
                                )}
                        </div>
                    </div>
                </div>
                {targetData.length ? (
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
                                formInfo?.table_kind ===
                                    FormTableKind.DATA_FUSION && (
                                    <div className={styles.formToolBar}>
                                        <div>
                                            <Checkbox
                                                indeterminate={indeterminate}
                                                onChange={handleSelectedAll}
                                                checked={getCheckAllStatus()}
                                            >
                                                <span
                                                    className={styles.selectAll}
                                                >
                                                    {__('全选')}
                                                </span>
                                            </Checkbox>
                                        </div>
                                        <div>
                                            <Button
                                                type="link"
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    handleUnQuoteSeletedFileds()
                                                }}
                                                disabled={
                                                    !selectedFields?.length
                                                }
                                            >
                                                {__('解绑')}
                                            </Button>
                                            <Divider type="vertical" />
                                            <Button
                                                type="link"
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    handleDeleteFields(
                                                        selectedFields,
                                                    )
                                                }}
                                                disabled={
                                                    !selectedFields?.length
                                                }
                                            >
                                                {__('删除')}
                                            </Button>
                                        </div>
                                    </div>
                                )}
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
                                            setShowFiledOptions(item.uniqueId)
                                        }}
                                        onMouseLeave={() => {
                                            setShowFiledOptions(0)
                                        }}
                                        onClick={(e) => {
                                            handleClickField(item)
                                            e.preventDefault()
                                            e.stopPropagation()
                                        }}
                                    >
                                        {!!item?.field_map?.source_field
                                            ?.length &&
                                            [
                                                FormTableKind.DATA_STANDARD,
                                                FormTableKind.DATA_FUSION,
                                            ].includes(formInfo.table_kind) && (
                                                <Tooltip
                                                    title={
                                                        formInfo.table_kind ===
                                                        FormTableKind.DATA_FUSION
                                                            ? __('融合规则')
                                                            : __('取值规则')
                                                    }
                                                >
                                                    <div
                                                        className={classnames(
                                                            styles.configIcon,
                                                            {
                                                                [styles.configOpen]:
                                                                    configRulesInfo?.id ===
                                                                    item.id,
                                                            },
                                                        )}
                                                        onClick={(e) => {
                                                            e.preventDefault()
                                                            e.stopPropagation()
                                                            onOpenConvergenceRules(
                                                                item,
                                                                node,
                                                            )
                                                        }}
                                                    >
                                                        <FontIcon
                                                            name="icon-bianjiqi"
                                                            style={{
                                                                fontSize: 10,
                                                            }}
                                                            className={classnames(
                                                                {
                                                                    [styles.hasConfig]:
                                                                        formInfo.table_kind ===
                                                                            FormTableKind.DATA_STANDARD &&
                                                                        item
                                                                            ?.field_map
                                                                            ?.source_field?.[0]
                                                                            ?.value_rule_desc,
                                                                },
                                                            )}
                                                        />
                                                    </div>
                                                </Tooltip>
                                            )}
                                        <div
                                            className={
                                                styles.formItemTextContent
                                            }
                                        >
                                            {model === 'edit' &&
                                                formInfo?.table_kind ===
                                                    FormTableKind.DATA_FUSION && (
                                                    <Checkbox
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
                                                                    selectedField.uniqueId ===
                                                                    item.uniqueId,
                                                            )
                                                        }
                                                        value={item}
                                                        className={
                                                            styles.checkbox
                                                        }
                                                    />
                                                )}
                                            <span title={item.data_type}>
                                                <FieldTypeIcon
                                                    dataType={getCommonDataType(
                                                        item.data_type,
                                                    )}
                                                    style={{
                                                        color: 'rgba(0, 0, 0, 0.65)',
                                                    }}
                                                />
                                            </span>
                                            <div
                                                className={styles.fromItemText}
                                                title={item.name}
                                            >
                                                {item.name ? (
                                                    <span
                                                        className={styles.name}
                                                        onClick={(e) => {
                                                            editField(
                                                                item,
                                                                index,
                                                            )
                                                        }}
                                                    >
                                                        {item.name}
                                                    </span>
                                                ) : (
                                                    <span
                                                        className={
                                                            styles.noFieldName
                                                        }
                                                    >
                                                        {__('请完善中文名称')}
                                                    </span>
                                                )}
                                                {errorFieldIds.length &&
                                                errorFieldIds.includes(
                                                    item.uniqueId.toString(),
                                                ) ? (
                                                    <Tooltip
                                                        title={__('属性不完整')}
                                                    >
                                                        <ExclamationCircleOutlined
                                                            className={
                                                                styles.incompleteIcon
                                                            }
                                                        />
                                                    </Tooltip>
                                                ) : null}
                                                {item.standard_status ===
                                                    'normal' &&
                                                (formInfo?.table_kind ===
                                                    FormTableKind.DATA_FUSION ||
                                                    formInfo?.table_kind ===
                                                        FormTableKind.DATA_STANDARD) ? (
                                                    <StandardOutlined
                                                        style={{
                                                            color: '#126ee3',
                                                            marginLeft: '5px',
                                                            fontSize: 16,
                                                        }}
                                                    />
                                                ) : null}
                                                {item.is_primary_key ? (
                                                    <PrimaryKeyLabel />
                                                ) : null}
                                            </div>
                                        </div>
                                        <div>
                                            {showFiledOptions ===
                                                item.uniqueId &&
                                            model === 'edit' ? (
                                                FormTableKind.DATA_FUSION ===
                                                    formInfo.table_kind ||
                                                FormTableKind.DATA_ORIGIN ===
                                                    formInfo.table_kind ? (
                                                    <div
                                                        className={
                                                            styles.formOptions
                                                        }
                                                    >
                                                        {item.field_map
                                                            ?.source_field
                                                            ?.length ? (
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
                                                                                [
                                                                                    item,
                                                                                ],
                                                                            )
                                                                        }}
                                                                    />
                                                                </Tooltip>
                                                            </div>
                                                        ) : (
                                                            <div />
                                                        )}
                                                        {FormTableKind.DATA_FUSION ===
                                                            formInfo.table_kind && (
                                                            <div
                                                                className={
                                                                    styles.formTitleBtn
                                                                }
                                                            >
                                                                <Tooltip
                                                                    placement="bottom"
                                                                    title={__(
                                                                        '删除',
                                                                    )}
                                                                >
                                                                    <RecycleBinOutlined
                                                                        onClick={(
                                                                            e,
                                                                        ) => {
                                                                            e.preventDefault()
                                                                            e.stopPropagation()
                                                                            handleDeleteFields(
                                                                                [
                                                                                    item,
                                                                                ],
                                                                            )
                                                                        }}
                                                                    />
                                                                </Tooltip>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : FormTableKind.DATA_STANDARD ===
                                                      formInfo.table_kind &&
                                                  !item.field_map?.source_field
                                                      ?.length ? (
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
                                                                title={__(
                                                                    '删除',
                                                                )}
                                                            >
                                                                <RecycleBinOutlined
                                                                    onClick={(
                                                                        e,
                                                                    ) => {
                                                                        e.preventDefault()
                                                                        e.stopPropagation()
                                                                        handleStandardField(
                                                                            item,
                                                                        )
                                                                    }}
                                                                />
                                                            </Tooltip>
                                                        </div>
                                                    </div>
                                                ) : null
                                            ) : null}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        <div
                            className={classnames(
                                styles.formContentPageTurning,
                                styles.targetFormPageTurning,
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
                    </div>
                ) : debouncedValue ? (
                    <div className={styles.formEmpty}>
                        {__('抱歉，没有找到相关内容')}
                    </div>
                ) : (
                    <div className={styles.formEmpty}>
                        {model === 'edit' ? (
                            <div>
                                <div className={styles.formEmptyBtn}>
                                    <span>{`${__('点击')}`}</span>
                                    <Button
                                        type="link"
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            createField()
                                        }}
                                        style={{
                                            color: 'rgba(52,97,236, 0.8)',
                                        }}
                                    >
                                        {__('【新建字段】')}
                                    </Button>
                                    <span>{`${__(
                                        '为当前业务表添加字段',
                                    )}`}</span>
                                </div>
                                <div className={styles.formEmptyBtn}>
                                    {__(
                                        '或从左侧拖入已有业务表，引用/复制已有字段',
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className={styles.formEmpty}>
                                {__('暂无数据')}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </ConfigProvider>
    )
}

const formTargetNode = (callback?: any) => {
    if (callback) {
        callbackColl = callback
    }
    register({
        shape: 'table-target-node',
        effect: ['data'],
        component: FormTargetNodeComponent,
    })
    return 'table-target-node'
}

export default formTargetNode
