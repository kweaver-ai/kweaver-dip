import * as React from 'react'
import { useState, useEffect } from 'react'
import { register } from '@antv/x6-react-shape'
import {
    RightOutlined,
    LeftOutlined,
    CloseCircleFilled,
    SearchOutlined,
    ExclamationCircleOutlined,
    SwapOutlined,
} from '@ant-design/icons'
import classnames from 'classnames'
import { Button, Checkbox, ConfigProvider, Divider, Space, Tooltip } from 'antd'
import { useDebounce } from 'ahooks'
import {
    DefineBusinessObjOutlined,
    RecycleBinOutlined,
    StandardOutlined,
    UnQuoteOutlined,
    UniqueFlagColored,
    XlsColored,
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
} from './helper'
import __ from './locale'
import { SearchInput } from '@/ui'
import { FormTableKind } from '../Forms/const'
import { useGraphContext } from './GraphContext'
import { getPlatformNumber } from '@/utils'
import { LoginPlatform } from '@/core'

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
    const { onSortField } = useGraphContext()
    const platformNumber = getPlatformNumber()

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
                10,
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
            if (model === 'view') {
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
            selectedFields.filter((selectedField) => selectedField.ref_id),
        )
    }

    /**
     * 解绑字段
     * @param items
     */
    const handleUnQuoteFields = (items) => {
        const updateAllPortAndEdge = callbackColl[1]()
        node.setData({
            ...node.data,
            items: node.data?.items.map((targetItem) => {
                if (
                    items.find((item) => item.uniqueId === targetItem.uniqueId)
                ) {
                    cancelOriginFormFiledSelected(targetItem.ref_id)
                    return {
                        ...targetItem,
                        ref_id: '',
                    }
                }
                return targetItem
            }),
        })
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

    /**
     * 取消源表单的字段选中状态
     * @param refId
     */
    const cancelOriginFormFiledSelected = (refId: string) => {
        const keyAndNodeRelation = callbackColl[2]()
        const originNode = keyAndNodeRelation.quoteData[refId]
        originNode?.replaceData({
            ...originNode.data,
            selectedFiledsId: originNode.data.selectedFiledsId.filter(
                (id) => id !== refId,
            ),
        })
        keyAndNodeRelation.deleteData(refId)
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
            if (item.ref_id) {
                const keyAndNodeRelation = callbackColl[2]().quoteData
                allNodes.forEach((currentNode) => {
                    if (currentNode.id === keyAndNodeRelation[item.ref_id].id) {
                        currentNode.setData({
                            ...currentNode.data,
                            singleSelectedId: item.ref_id,
                        })
                        if (edgeRelation.selected) {
                            edgeRelation.quoteData[edgeRelation.selected].attr(
                                'line/stroke',
                                '#979797',
                            )
                        }
                        edgeRelation.onSelectData(item.ref_id)
                        edgeRelation.quoteData[item.ref_id].attr(
                            'line/stroke',
                            '#126EE3',
                        )
                    } else {
                        currentNode.setData({
                            ...currentNode.data,
                            singleSelectedId: '',
                        })
                        if (edgeRelation.selected) {
                            edgeRelation.quoteData[edgeRelation.selected].attr(
                                'line/stroke',
                                '#979797',
                            )
                            edgeRelation.onSelectData('')
                        }
                    }
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
                    {formInfo?.table_kind === FormTableKind.STANDARD
                        ? __('当前业务标准表')
                        : __('当前业务节点表')}
                </div>
                <div
                    className={classnames(
                        styles.formTargetHeader,
                        styles.formHeader,
                    )}
                >
                    <div className={styles['top-border']} />
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
                            {/* <div className={styles.formTitleBtn}>
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
                                </div> */}
                            {formInfo?.table_kind ===
                                FormTableKind.STANDARD && (
                                <div className={styles.formTitleBtn}>
                                    <Tooltip
                                        placement="bottom"
                                        title={
                                            data.disabledRelateObj
                                                ? platformNumber ===
                                                  LoginPlatform.default
                                                    ? __(
                                                          '请保存后，再定义业务对象/活动',
                                                      )
                                                    : __(
                                                          '请保存后，再定义业务对象',
                                                      )
                                                : platformNumber ===
                                                  LoginPlatform.default
                                                ? __('定义业务对象/活动')
                                                : __('定义业务对象')
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
                            )}
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
                            {model === 'edit' && (
                                <div className={styles.formToolBar}>
                                    <div>
                                        <Checkbox
                                            indeterminate={indeterminate}
                                            onChange={handleSelectedAll}
                                            checked={getCheckAllStatus()}
                                        >
                                            <span className={styles.selectAll}>
                                                {__('全选')}
                                            </span>
                                        </Checkbox>
                                    </div>
                                    {selectedFields.length ? (
                                        <Space size={0}>
                                            <Button
                                                type="link"
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    handleUnQuoteSeletedFileds()
                                                }}
                                                disabled={
                                                    !selectedFields?.length ||
                                                    !selectedFields.find(
                                                        (item) => item.ref_id,
                                                    )
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
                                            >
                                                {__('删除')}
                                            </Button>
                                        </Space>
                                    ) : (
                                        <div>
                                            <Button
                                                type="link"
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    createField()
                                                }}
                                            >
                                                {__('新建字段')}
                                            </Button>
                                        </div>
                                    )}
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
                                        <div
                                            className={
                                                styles.formItemTextContent
                                            }
                                        >
                                            {model === 'edit' && (
                                                <Checkbox
                                                    onChange={(e) => {
                                                        handleSelectedItem(e)
                                                    }}
                                                    checked={
                                                        !!selectedFields.find(
                                                            (selectedField) =>
                                                                selectedField.uniqueId ===
                                                                item.uniqueId,
                                                        )
                                                    }
                                                    value={item}
                                                    className={styles.checkbox}
                                                />
                                            )}
                                            {/* {formInfo?.table_kind ===
                                                FormTableKind.STANDARD && (
                                                <span className={styles.icon}>
                                                    {getFieldTypeEelment(
                                                        {
                                                            ...item,
                                                            type: item.data_type,
                                                        },
                                                        20,
                                                    )}
                                                </span>
                                            )} */}
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
                                                formInfo?.table_kind ===
                                                    FormTableKind.STANDARD ? (
                                                    <StandardOutlined
                                                        style={{
                                                            color: '#126ee3',
                                                            marginLeft: '5px',
                                                            fontSize: 16,
                                                        }}
                                                    />
                                                ) : null}
                                                {item.is_primary_key ? (
                                                    <UniqueFlagColored
                                                        className={
                                                            styles.majorKey
                                                        }
                                                    />
                                                ) : null}
                                            </div>
                                        </div>
                                        <div>
                                            {showFiledOptions ===
                                                item.uniqueId &&
                                            model === 'edit' ? (
                                                <div
                                                    className={
                                                        styles.formOptions
                                                    }
                                                >
                                                    {item.ref_id ? (
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
                                                    <div
                                                        className={
                                                            styles.formTitleBtn
                                                        }
                                                    >
                                                        <Tooltip
                                                            placement="bottom"
                                                            title={__('删除')}
                                                        >
                                                            <RecycleBinOutlined
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.preventDefault()
                                                                    e.stopPropagation()
                                                                    handleDeleteFields(
                                                                        [item],
                                                                    )
                                                                }}
                                                            />
                                                        </Tooltip>
                                                    </div>
                                                </div>
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
