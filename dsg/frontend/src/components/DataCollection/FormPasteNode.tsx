import * as React from 'react'
import { useState, useEffect } from 'react'
import { register } from '@antv/x6-react-shape'
import {
    LeftOutlined,
    RightOutlined,
    ShrinkOutlined,
    ArrowsAltOutlined,
    CheckCircleFilled,
} from '@ant-design/icons'
import classnames from 'classnames'
import { Button, ConfigProvider, Tooltip } from 'antd'
import {
    AddOutlined,
    EditOutlined,
    RecycleBinOutlined,
    CloseOutlined,
    RefreshOutlined,
    DataOriginConfigOutlined,
} from '@/icons'
import styles from './styles.module.less'
import DataSourcIcons from '../DataSource/Icons'
import { ExpandStatus, getCurrentShowData } from '../FormGraph/helper'
import __ from './locale'
import { PasteSourceChecked, ViewModel } from './const'

let callbackColl: any = []

const FormPasteNodeComponent = (props: any) => {
    const { node } = props
    const { data } = node
    const [showFiledOptions, setShowFiledOptions] = useState<string>('')
    const [targetData, setTargetData] = useState<Array<any>>([])
    const [singleSelected, setSingleSelected] = useState<string>('')
    const [showPagTurning, setShowPageTurning] = useState<boolean>(false)
    const [formInfo, setFormInfo] = useState<any>(null)
    const [model, setModel] = useState<string>('edit')
    const [errorStatus, setErrorStatus] = useState<boolean>(false)

    useEffect(() => {
        node.setData({
            ...data,
            type: 'pasteSource',
        })
    }, [])

    useEffect(() => {
        setModel(callbackColl[1]() || 'view')
        setTargetData(getCurrentShowData(data.offset, data.items, 10))
        setSingleSelected(data.singleSelectedId)
        setFormInfo(data.formInfo)
        setErrorStatus(data.errorStatus)
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
     * 新建字段
     */
    const handleAddFiled = () => {
        const setAddFieldsNode = callbackColl[2]()
        setAddFieldsNode(node)
    }
    /**
     * 下一页
     */
    const handlePageDown = () => {
        node.setData({
            ...data,
            offset: data.offset + 1,
        })
        onUpdateGraph()
    }

    /**
     * 上一页
     */
    const handlePageUp = () => {
        node.setData({
            ...data,
            offset: data.offset - 1,
        })
        onUpdateGraph()
    }

    /**
     * 选择当前行数据
     */
    const handleClickField = (item) => {
        const graphCase = callbackColl[0]()
        const edgeRelation = callbackColl[9]()
        node.replaceData({
            ...node.data,
            singleSelectedId: item.id,
        })
        if (graphCase && graphCase.current) {
            const allNodes = graphCase.current.getNodes()
            if (edgeRelation.quoteData[item.id]) {
                allNodes.forEach((currentNode) => {
                    if (currentNode.shape === 'table-origin-node') {
                        const { items } = currentNode.data
                        const originField = items.find(
                            (originItem) => item.id === originItem.source_id,
                        )
                        if (originField) {
                            currentNode.setData({
                                ...currentNode.data,
                                singleSelectedId: originField.id,
                            })
                            if (edgeRelation.selected) {
                                edgeRelation.quoteData[
                                    edgeRelation.selected
                                ].attr('line/stroke', '#979797')
                            }
                            edgeRelation.onSelectData(item.id)
                            edgeRelation.quoteData[item.id].attr(
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
                    if (currentNode.id !== node.id) {
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
     * 编辑字段
     */
    const editField = (item, index) => {
        // const optionGraphData = callbackColl[4]()
        if (item.ref_id) {
            node.setData({
                ...node.data,
                editStatus: false,
            })
            // optionGraphData(
            //     OptionType.ViewTargetQuoteField,
            //     { ...item, index },
            //     node,
            // )
        } else {
            node.setData({
                ...node.data,
                editStatus: false,
            })
            // optionGraphData(
            //     OptionType.EditTargetField,
            //     { ...item, index },
            //     node,
            // )
        }
    }

    /**
     * 编辑表
     */
    const editForm = (e) => {
        const setEditNode = callbackColl[6]()
        setEditNode(node)
        e.preventDefault()
        e.stopPropagation()
    }

    /**
     * 删除字段
     * @param fieldInfo
     */
    const handleDeleteFields = (fieldInfo) => {
        if (data.formInfo.checked === PasteSourceChecked.New) {
            const onUpdate = callbackColl[4]()
            node.replaceData({
                ...node.data,
                items: node.data.items.filter(
                    (item) => item.id !== fieldInfo.id,
                ),
                offset:
                    data.offset === 0
                        ? 0
                        : targetData.length === 1
                        ? data.offset - 1
                        : data.offset,
            })
            onUpdate(node, fieldInfo)
        } else {
            const onDeleteCheckedFormFiedld = callbackColl[7]()
            onDeleteCheckedFormFiedld(node, fieldInfo)
        }
    }

    /**
     * 编辑字段
     */
    const handleEditFields = (field) => {
        const onEditFields = callbackColl[3]()
        onEditFields(field, node)
    }

    /**
     * 删除贴源表
     */
    const deletePasteForm = () => {
        const setDeleteNode = callbackColl[5]()
        setDeleteNode(node)
    }

    /**
     * 更新画布
     */
    const onUpdateGraph = () => {
        const onUpdate = callbackColl[4]()
        onUpdate(node)
    }

    /**
     * 获取选中颜色
     */
    const getSelectClassName = (item) => {
        if (singleSelected === item.id) {
            return styles.formTargetItemSelected
        }
        return ''
    }

    /**
     * 更新贴原表
     */
    const onUpdatePaste = async () => {
        const refreshDataTables = callbackColl[8]()
        refreshDataTables([node])
    }

    const getFormClassName = () => {
        if (errorStatus) {
            return styles.formOriginNodeError
        }
        return styles.formOriginNode
    }

    return (
        <ConfigProvider
            prefixCls="any-fabric-ant"
            iconPrefixCls="any-fabric-anticon"
        >
            <div className={classnames(styles.formNode, getFormClassName())}>
                <div
                    className={classnames(
                        styles.formPastetHeader,
                        styles.formHeader,
                    )}
                >
                    <div className={styles.formTitle}>
                        <div className={styles.formTitleLabel}>
                            {data.formInfo.checked ===
                            PasteSourceChecked.New ? (
                                <Tooltip
                                    placement="bottom"
                                    title={__('需采集')}
                                >
                                    <div
                                        className={styles.iconStatusUncollect}
                                    />
                                </Tooltip>
                            ) : (
                                <Tooltip
                                    placement="bottom"
                                    title={__('已采集')}
                                >
                                    <CheckCircleFilled
                                        className={styles.iconStatusCollected}
                                    />
                                </Tooltip>
                            )}
                            {formInfo?.datasource_id ? (
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        margin: '0 8px',
                                    }}
                                >
                                    <DataSourcIcons
                                        type={formInfo?.datasource_type}
                                        fontSize={22}
                                        iconType="outlined"
                                    />
                                </div>
                            ) : (
                                ''
                            )}
                            <div className={styles.formTitleText}>
                                <span onClick={editForm} title={formInfo?.name}>
                                    {formInfo?.name || ''}
                                </span>
                            </div>
                        </div>

                        <div className={styles.formTitleTool}>
                            {model === ViewModel.ModelEdit && (
                                <div className={styles.formTitleBtn}>
                                    <Tooltip
                                        placement="bottom"
                                        title={__('添加字段')}
                                    >
                                        <AddOutlined
                                            className={styles.iconBtn}
                                            onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                handleAddFiled()
                                            }}
                                        />
                                    </Tooltip>
                                </div>
                            )}

                            {model === ViewModel.ModelEdit && (
                                <div className={styles.formTitleBtn}>
                                    <Tooltip
                                        placement="bottom"
                                        title={__('配置数据源')}
                                    >
                                        <DataOriginConfigOutlined
                                            className={styles.iconBtn}
                                            style={{
                                                fontSize: '22px',
                                            }}
                                            onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                const setConfigDataOrigin =
                                                    callbackColl[10]()
                                                setConfigDataOrigin(node)
                                            }}
                                        />
                                    </Tooltip>
                                </div>
                            )}
                            <div className={styles.formTitleBtn}>
                                {node.data.expand === ExpandStatus.Expand ? (
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
                            {model === ViewModel.Collect &&
                                data.formInfo.checked ===
                                    PasteSourceChecked.New && (
                                    <div className={styles.formTitleBtn}>
                                        <Tooltip
                                            placement="bottom"
                                            title={__('刷新')}
                                        >
                                            <RefreshOutlined
                                                className={styles.iconBtn}
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    onUpdatePaste()
                                                }}
                                            />
                                        </Tooltip>
                                    </div>
                                )}
                            {model === ViewModel.ModelEdit && (
                                <div className={styles.formTitleBtn}>
                                    <Tooltip
                                        placement="bottom"
                                        title={__('移除数据表')}
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
                        </div>
                    </div>
                </div>
                {targetData.length ? (
                    <div
                        className={styles.formContent}
                        onFocus={() => 0}
                        onBlur={() => 0}
                        onMouseOver={() => {
                            if (data.items.length > 10) {
                                setShowPageTurning(true)
                            }
                        }}
                        onMouseLeave={() => {
                            setShowPageTurning(false)
                        }}
                    >
                        {node.data.expand === ExpandStatus.Expand && (
                            <div className={styles.formContentData}>
                                {targetData.map((item, index) => {
                                    return (
                                        <div
                                            className={classnames(
                                                styles.formItem,
                                                styles.formPasteItem,
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
                                                    className={classnames(
                                                        styles.fromItemPasteText,
                                                        model !==
                                                            ViewModel.ModelEdit
                                                            ? styles.fromItemPasteEdit
                                                            : '',
                                                    )}
                                                    title={item.name}
                                                    onClick={(e) => {
                                                        if (
                                                            model !==
                                                            ViewModel.ModelEdit
                                                        ) {
                                                            handleEditFields(
                                                                item,
                                                            )
                                                            e.preventDefault()
                                                            e.stopPropagation()
                                                        }
                                                    }}
                                                >
                                                    <span
                                                        onClick={(e) => {
                                                            editField(
                                                                item,
                                                                index,
                                                            )
                                                        }}
                                                        title={item.name}
                                                    >
                                                        {item.name}
                                                    </span>
                                                </div>
                                            </div>
                                            <div>
                                                {showFiledOptions === item.id &&
                                                model ===
                                                    ViewModel.ModelEdit ? (
                                                    <div
                                                        className={
                                                            styles.formOptions
                                                        }
                                                    >
                                                        <div
                                                            className={classnames(
                                                                styles.formLeftBtn,
                                                                styles.formTitleBtn,
                                                            )}
                                                        >
                                                            <Tooltip
                                                                placement="bottom"
                                                                title={__(
                                                                    '编辑',
                                                                )}
                                                            >
                                                                <EditOutlined
                                                                    onClick={(
                                                                        e,
                                                                    ) => {
                                                                        handleEditFields(
                                                                            item,
                                                                        )
                                                                        e.preventDefault()
                                                                        e.stopPropagation()
                                                                    }}
                                                                />
                                                            </Tooltip>
                                                        </div>
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
                                                                        handleDeleteFields(
                                                                            item,
                                                                        )
                                                                        e.preventDefault()
                                                                        e.stopPropagation()
                                                                    }}
                                                                />
                                                            </Tooltip>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div>{item.type}</div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                        {node.data.expand === ExpandStatus.Expand && (
                            <div
                                className={classnames(
                                    styles.formContentPageTurning,
                                    styles.pasteFormPageTurning,
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
                                ${Math.ceil(data.items.length / 10)}`}
                                </div>

                                <RightOutlined
                                    onClick={(e) => {
                                        if (
                                            data.offset + 1 ===
                                            Math.ceil(data.items.length / 10)
                                        ) {
                                            return
                                        }
                                        e.preventDefault()
                                        e.stopPropagation()
                                        handlePageDown()
                                    }}
                                    style={
                                        data.offset + 1 ===
                                        Math.ceil(data.items.length / 10)
                                            ? {
                                                  color: 'rgba(0,0,0,0.25)',
                                                  cursor: 'default',
                                              }
                                            : {}
                                    }
                                />
                            </div>
                        )}
                    </div>
                ) : (
                    node.data.expand === ExpandStatus.Expand && (
                        <div className={styles.formEmpty}>
                            {model === ViewModel.ModelEdit ? (
                                <div>
                                    <div className={styles.formEmptyBtn}>
                                        <span>{`${__('点击')}`}</span>
                                        <Button
                                            type="link"
                                            onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                handleAddFiled()
                                            }}
                                            style={{
                                                color: 'rgba(52,97,236, 0.8)',
                                            }}
                                        >
                                            {__('【新建字段】')}
                                        </Button>
                                        <span>{`${__(
                                            '按钮为当前数据表新建字段',
                                        )}`}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className={styles.formEmpty}>
                                    {__('暂无数据')}
                                </div>
                            )}
                        </div>
                    )
                )}
            </div>
        </ConfigProvider>
    )
}

const formPasteNode = (callback?: any) => {
    if (callback) {
        callbackColl = callback
    }
    register({
        shape: 'table-paste-node',
        effect: ['data'],
        component: FormPasteNodeComponent,
    })
    return 'table-paste-node'
}

export default formPasteNode
