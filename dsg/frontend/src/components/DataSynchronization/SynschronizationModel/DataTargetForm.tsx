import * as React from 'react'
import { useState, useEffect, FC } from 'react'
import { register } from '@antv/x6-react-shape'
import { ConfigProvider, Image, Input, Modal, Tooltip } from 'antd'
import classnames from 'classnames'
import { Graph, Node } from '@antv/x6'
import {
    CloseCircleFilled,
    CloseOutlined,
    ExclamationCircleOutlined,
    LeftOutlined,
    RightOutlined,
    SearchOutlined,
} from '@ant-design/icons'
import { useDebounce, useUnmount } from 'ahooks'
import { trim } from 'lodash'
import targetSvg from '@/assets/targetSyncForm.svg'
import DataTypeIcons from '../Icons'
import Icons from '../../BusinessArchitecture/Icons'
import styles from '../styles.module.less'
import __ from '../locale'
import ConfigModal from './ConfigModal'
import { CommentOutlined, DataOriginConfigOutlined } from '@/icons'
import { getCurrentShowData } from '../../FormGraph/helper'
import {
    DataSourceIcon,
    checkRepeat,
    comboDataLength,
    searchFieldData,
} from '../helper'
import { FieldErrorType, FormType } from '../const'
import { enBeginNameRegNew } from '@/utils'
import { getDataBaseDetails } from '@/core'
import { Architecture } from '../../BusinessArchitecture/const'
import { SearchInput } from '@/ui'

let callbackColl: any = []
interface DataTargetFormType {
    node: Node
    graph: Graph
}

const DataTargetForm: FC<DataTargetFormType> = ({ node, graph }) => {
    const { data } = node
    const [formInfo, setFormInfo] = useState<any>(null)
    const [fields, setFileds] = useState<Array<any>>([])
    const [editStatus, setEditStatus] = useState<boolean>(false)
    const [configOpen, setConfigOpen] = useState<boolean>(false)
    // 当前展示的数据
    const [targetData, setTargetData] = useState<Array<any>>([])

    // 当前页数据状态展示的数据
    const [targetStatusData, setTargetStatusData] = useState<any>({ offset: 0 })
    // 当前表格选中的字段
    const [selectedField, setSelectedField] = useState<string | number>('')
    // 正在编辑的字段
    // const [editField, setEditField] = useState<string | number>('')
    // // 字段编辑校验不通过错误信息
    // const [fieldError, setFieldError] = useState<string>('')
    // 当前编辑的注释
    const [editDescriptionField, setEditDescriptionField] = useState<
        string | number
    >('')

    // 注释信息
    const [editDescriptionInfo, setEditDescriptionInfo] = useState<
        string | undefined
    >(undefined)

    // 悬浮显示字段的状态
    const [hoverField, setHoverField] = useState<string | number>('')

    // 搜索关键字
    const [searchKey, setSearchKey] = useState<string | number>('')
    const debouncedValue = useDebounce(searchKey, { wait: 500 })

    // 搜索状态
    const [searchStatus, setSearchStatus] = useState<boolean>(false)

    // 元数据
    const [sourceData, setSourceData] = useState<Array<any>>(
        graph
            .getNodes()
            .find(
                (currentNode) => currentNode.data.type === FormType.SOURCESFORM,
            )?.data.items || [],
    )
    const [dataSourceDetail, setDataSourceDetail] = useState<any>({})

    useUnmount(() => {
        setEditDescriptionField('')
    })

    useEffect(() => {
        setFormInfo(data.formInfo)
        setSourceData(
            graph
                .getNodes()
                .find(
                    (currentNode) =>
                        currentNode.data.type === FormType.SOURCESFORM,
                )?.data.items || [],
        )
        if (data?.items?.length > 0) {
            const displayData = getCurrentShowData(
                data.offset,
                searchFieldData(
                    sourceData,
                    data.items,
                    data.keyWord,
                    FormType.TARGETFORM,
                ),
                10,
            )
            setTargetData(displayData)
            if (
                !(
                    displayData.length + 2 ===
                        Object.keys(targetStatusData).length &&
                    targetStatusData.offset === data.offset
                ) ||
                debouncedValue !== targetStatusData.searchKey
            ) {
                setTargetStatusData(
                    displayData.reduce(
                        (preData, currentValue) => {
                            if (!enBeginNameRegNew.test(currentValue.name)) {
                                return {
                                    ...preData,
                                    [currentValue.indexId]: {
                                        name: currentValue.name,
                                        editStatus: true,
                                        errorStatus:
                                            FieldErrorType.EXISTUNALLOW,
                                    },
                                }
                            }
                            if (
                                checkRepeat(
                                    data.items,
                                    currentValue.indexId,
                                    currentValue.name,
                                )
                            ) {
                                return {
                                    ...preData,
                                    [currentValue.indexId]: {
                                        name: currentValue.name,
                                        editStatus: true,
                                        errorStatus: FieldErrorType.NAMEREPEAT,
                                    },
                                }
                            }
                            return {
                                ...preData,
                                [currentValue.indexId]: {
                                    name: currentValue.name,
                                    editStatus: false,
                                    errorStatus: FieldErrorType.NORMAL,
                                },
                            }
                        },
                        { offset: data.offset, searchKey: debouncedValue },
                    ),
                )
            }
        } else {
            setTargetData([])
            setTargetStatusData({
                offset: 0,
            })
        }
        setEditStatus(data.editStatus)
        if (
            data?.formInfo?.datasource_id &&
            data?.formInfo?.datasource_id !== dataSourceDetail.id
        ) {
            getDataSourceDetail(data?.formInfo?.datasource_id)
        }
        setSelectedField(
            data.singleSelectedId === 0 ? 0 : data.singleSelectedId || '',
        )
        setEditDescriptionField(data.descriptionField)
    }, [data])

    useEffect(() => {
        const { updateAllPortAndEdge } = callbackColl
        const sourceNode = graph
            .getNodes()
            .find(
                (currentNode) => currentNode.data.type === FormType.SOURCESFORM,
            )
        if (debouncedValue !== node.data.keyWord) {
            node.setData({
                ...node.data,
                keyWord: debouncedValue,
                offset: 0,
            })
            if (sourceNode) {
                sourceNode.setData({
                    ...sourceNode.data,
                    keyWord: debouncedValue,
                    offset: 0,
                })
            }
            updateAllPortAndEdge()
        }
    }, [debouncedValue])

    /**
     * 下一页
     */
    const handlePageDown = () => {
        const { updateAllPortAndEdge } = callbackColl
        const sourceNode = graph
            .getNodes()
            .find(
                (currentNode) => currentNode.data.type === FormType.SOURCESFORM,
            )
        node.setData({
            ...data,
            offset: data.offset + 1,
        })
        sourceNode?.replaceData({
            ...sourceNode.data,
            offset: data.offset + 1,
        })

        updateAllPortAndEdge(node)
    }

    /**
     * 上一页
     */
    const handlePageUp = () => {
        const { updateAllPortAndEdge } = callbackColl
        const sourceNode = graph
            .getNodes()
            .find(
                (currentNode) => currentNode.data.type === FormType.SOURCESFORM,
            )
        node.setData({
            ...data,
            offset: data.offset - 1,
        })
        sourceNode?.replaceData({
            ...sourceNode.data,
            offset: data.offset - 1,
        })

        updateAllPortAndEdge(node)
    }

    /**
     * 选择字段
     */
    const handleSelectField = (field) => {
        const sourceNode = graph
            .getNodes()
            .find(
                (currentNode) => currentNode.data.type === FormType.SOURCESFORM,
            )
        const edgeRelation = callbackColl.getEdgeRelation()
        node.replaceData({
            ...node.data,
            singleSelectedId: field.indexId,
            relatedSelected: '',
        })
        sourceNode?.replaceData({
            ...sourceNode.data,
            singleSelectedId: '',
            relatedSelected: field.indexId,
        })
        if (edgeRelation) {
            const edgeRelationKeys = Object.keys(edgeRelation.quoteData)
            edgeRelationKeys?.forEach((currentKey) => {
                edgeRelation.quoteData[currentKey]?.attr(
                    'line/stroke',
                    '#979797',
                )
            })
            edgeRelation.quoteData[field.indexId]?.attr(
                'line/stroke',
                '#126ee3',
            )
        }
    }

    /**
     * 获取数据源信息
     */
    const getDataSourceDetail = async (id: string) => {
        const dataSourceInfo = await getDataBaseDetails(id)
        setDataSourceDetail(dataSourceInfo)
    }

    /**
     * 获取错误描述
     */
    const getFieldErrorMessage = (errorType: FieldErrorType) => {
        switch (errorType) {
            case FieldErrorType.EXISTUNALLOW:
                return __('仅支持英文、数字、下划线，且必须以字母开头')
            case FieldErrorType.NAMEREPEAT:
                return __('该字段名称已存在，请重新输入')
            default:
                return null
        }
    }

    /**
     * 保存字段
     */
    const handleFieldBlur = (e, field) => {
        if (trim(e.target.value)) {
            if (!enBeginNameRegNew.test(e.target.value)) {
                setTargetStatusData({
                    ...targetStatusData,
                    [field.indexId]: {
                        name: e.target.value,
                        editStatus: true,
                        errorStatus: FieldErrorType.EXISTUNALLOW,
                    },
                })
            } else if (
                checkRepeat(node.data.items, field.indexId, e.target.value)
            ) {
                setTargetStatusData({
                    ...targetStatusData,
                    [field.indexId]: {
                        name: e.target.value,
                        editStatus: true,
                        errorStatus: FieldErrorType.NAMEREPEAT,
                    },
                })
            } else {
                setTargetStatusData({
                    ...targetStatusData,
                    [field.indexId]: {
                        name: e.target.value,
                        editStatus: false,
                        errorStatus: FieldErrorType.NORMAL,
                    },
                })
            }
            node.replaceData({
                ...node.data,
                items: node.data.items.map((currentField) =>
                    currentField.indexId === field.indexId
                        ? {
                              ...field,
                              name: e.target.value,
                          }
                        : currentField,
                ),
                descriptionField: '',
            })
        } else {
            setTargetStatusData({
                ...targetStatusData,
                [field.indexId]: {
                    ...targetStatusData[field.indexId],
                    editStatus: false,
                    errorStatus: FieldErrorType.NORMAL,
                },
            })
        }
    }

    /**
     * 字段输入框变更
     */
    const handleChange = (e, field) => {
        setTargetStatusData({
            ...targetStatusData,
            [field.indexId]: {
                ...targetStatusData[field.indexId],
                name: e.target.value,
            },
        })
    }

    return (
        <ConfigProvider
            prefixCls="any-fabric-ant"
            iconPrefixCls="any-fabric-anticon"
        >
            <div
                className={
                    formInfo || data.items?.length
                        ? classnames(
                              styles.formHasData,
                              styles.formHasDataTarget,
                          )
                        : classnames(styles.formNoData, styles.formNoDataTarget)
                }
            >
                {formInfo || data.items.length ? (
                    <div className={styles.formContainer}>
                        <div
                            className={classnames(
                                styles.formTitle,
                                data.formErrorStatus
                                    ? styles.formTitleError
                                    : '',
                            )}
                        >
                            <div className={styles.formTargetLine} />
                            <div
                                className={classnames(
                                    styles.formTitleContent,
                                    styles.formTargetTitleBoder,
                                )}
                            >
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
                                ) : formInfo?.name ? (
                                    <Tooltip
                                        title={
                                            dataSourceDetail.id ? (
                                                <div
                                                    className={
                                                        styles.formNodeTootip
                                                    }
                                                >
                                                    {dataSourceDetail?.info_system_name && (
                                                        <div
                                                            className={
                                                                styles.systemInfo
                                                            }
                                                        >
                                                            <Icons
                                                                type={
                                                                    Architecture.BSYSTEM
                                                                }
                                                            />
                                                            <div
                                                                className={
                                                                    styles.displayName
                                                                }
                                                                title={
                                                                    dataSourceDetail.info_system_name
                                                                }
                                                            >
                                                                {
                                                                    dataSourceDetail.info_system_name
                                                                }
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div
                                                        className={
                                                            styles.dataSource
                                                        }
                                                    >
                                                        {/* <DataSourcIcons
                                                            type={
                                                                dataSourceDetail?.type
                                                            }
                                                            fontSize={16}
                                                            iconType="outlined"
                                                        /> */}
                                                        <DataSourceIcon
                                                            dataType={
                                                                dataSourceDetail?.datasource_type
                                                            }
                                                            fontSize={16}
                                                        />
                                                        <div
                                                            className={
                                                                styles.displayName
                                                            }
                                                            title={
                                                                dataSourceDetail.name
                                                            }
                                                        >
                                                            {
                                                                dataSourceDetail.name
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : null
                                        }
                                        placement="topLeft"
                                        color="#fff"
                                        overlayInnerStyle={{
                                            color: 'rgba(0,0,0,0.65)',
                                        }}
                                    >
                                        <div className={styles.leftFormInfo}>
                                            {/* <DataSourcIcons
                                                type={formInfo?.datasource_type}
                                                fontSize={20}
                                                iconType="outlined"
                                            /> */}
                                            <DataSourceIcon
                                                dataType={
                                                    formInfo?.datasource_type
                                                }
                                                fontSize={20}
                                            />
                                            <span
                                                title={formInfo?.name}
                                                className={styles.name}
                                            >
                                                {formInfo?.name || ''}
                                            </span>
                                        </div>
                                    </Tooltip>
                                ) : (
                                    <div
                                        className={classnames(
                                            styles.leftFormInfo,
                                            styles.leftFormInfoEmpty,
                                        )}
                                    >
                                        <span>{__('点击')}</span>
                                        <span
                                            onClick={() => {
                                                setConfigOpen(true)
                                            }}
                                            style={{
                                                color: '#126ee3',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            {__('【配置】')}
                                        </span>
                                        <span>{__('按钮配置目标数据表')}</span>
                                    </div>
                                )}
                                {searchStatus ? null : (
                                    <div className={styles.formTitleBtn}>
                                        {editStatus && (
                                            <Tooltip
                                                placement="top"
                                                title={__('配置')}
                                            >
                                                <DataOriginConfigOutlined
                                                    className={styles.iconBtn}
                                                    style={{
                                                        fontSize: '18px',
                                                    }}
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        e.stopPropagation()
                                                        setConfigOpen(true)
                                                    }}
                                                />
                                            </Tooltip>
                                        )}
                                        <Tooltip
                                            placement="top"
                                            title={__('搜索')}
                                        >
                                            <SearchOutlined
                                                className={styles.iconBtn}
                                                style={{
                                                    marginLeft: '8px',
                                                    color: data?.items?.length
                                                        ? 'rgba(0,0,0,0.85)'
                                                        : 'rgba(0,0,0,0.25)',
                                                    cursor: data?.items?.length
                                                        ? 'pointer'
                                                        : 'not-allowed',
                                                }}
                                                onClick={(e) => {
                                                    if (data?.items?.length) {
                                                        e.preventDefault()
                                                        e.stopPropagation()
                                                        setSearchStatus(true)
                                                    }
                                                }}
                                            />
                                        </Tooltip>
                                    </div>
                                )}
                            </div>
                        </div>
                        {targetData && targetData.length ? (
                            <div className={styles.formList}>
                                <div>
                                    {targetData.map((field, index) => {
                                        return (
                                            <div
                                                className={classnames(
                                                    styles.formItem,
                                                    (field.indexId ===
                                                        node.data
                                                            .singleSelectedId ||
                                                        data.relatedSelected ===
                                                            field.indexId) &&
                                                        !targetStatusData[
                                                            field.indexId
                                                        ].editStatus
                                                        ? styles.connectSelectedField
                                                        : '',
                                                    selectedField ===
                                                        field.indexId
                                                        ? styles.selectedField
                                                        : '',
                                                    targetStatusData[
                                                        field.indexId
                                                    ].errorStatus !==
                                                        FieldErrorType.NORMAL &&
                                                        !field?.unmapped
                                                        ? styles.editErrorField
                                                        : '',
                                                    field?.unmapped
                                                        ? styles.romveDataItem
                                                        : '',
                                                )}
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    handleSelectField(field)
                                                    setSelectedField(
                                                        field.indexId,
                                                    )
                                                }}
                                                onFocus={() => 0}
                                                onBlur={() => 0}
                                                onMouseOver={() => {
                                                    setHoverField(field.indexId)
                                                }}
                                                onMouseLeave={() => {
                                                    setHoverField('')
                                                }}
                                                onDoubleClick={() => {
                                                    setTargetStatusData({
                                                        ...targetStatusData,
                                                        [field.indexId]: {
                                                            ...targetStatusData[
                                                                field.indexId
                                                            ],
                                                            editStatus: true,
                                                        },
                                                    })
                                                }}
                                                key={index}
                                            >
                                                {field.type === 'undefined' ? (
                                                    <span
                                                        style={{
                                                            color: 'rgba(0,0,0,0.25)',
                                                            fontSize: '12px',
                                                        }}
                                                    >
                                                        {__(
                                                            '数据源中不支持该数据类型，无法同步此条数据',
                                                        )}
                                                    </span>
                                                ) : (
                                                    <>
                                                        <Tooltip
                                                            placement="left"
                                                            title={`${
                                                                field.type
                                                            }${
                                                                field.type ===
                                                                'string'
                                                                    ? ''
                                                                    : comboDataLength(
                                                                          field.length,
                                                                          field.field_precision,
                                                                      )
                                                            }`}
                                                            color="#fff"
                                                            overlayInnerStyle={{
                                                                color: 'rgba(0,0,0,0.65)',
                                                            }}
                                                        >
                                                            <div
                                                                className={
                                                                    styles.icon
                                                                }
                                                                style={{
                                                                    color: field?.unmapped
                                                                        ? 'rgba(0,0,0,0.25)'
                                                                        : 'rgba(0,0,0,0.65)',
                                                                }}
                                                            >
                                                                <DataTypeIcons
                                                                    type={
                                                                        field.type
                                                                    }
                                                                />
                                                            </div>
                                                        </Tooltip>
                                                        {editStatus &&
                                                        targetStatusData[
                                                            field.indexId
                                                        ].editStatus &&
                                                        !field?.unmapped ? (
                                                            <Input
                                                                suffix={
                                                                    targetStatusData[
                                                                        field
                                                                            .indexId
                                                                    ]
                                                                        .errorStatus !==
                                                                    FieldErrorType.NORMAL ? (
                                                                        <Tooltip
                                                                            placement="right"
                                                                            title={getFieldErrorMessage(
                                                                                targetStatusData[
                                                                                    field
                                                                                        .indexId
                                                                                ]
                                                                                    .errorStatus,
                                                                            )}
                                                                            color="#fff"
                                                                            overlayInnerStyle={{
                                                                                color: 'rgba(0,0,0,0.65)',
                                                                            }}
                                                                        >
                                                                            <ExclamationCircleOutlined
                                                                                style={{
                                                                                    color: '#F5222D',
                                                                                    fontSize:
                                                                                        '14px',
                                                                                    width: '20px',
                                                                                }}
                                                                            />
                                                                        </Tooltip>
                                                                    ) : undefined
                                                                }
                                                                bordered={false}
                                                                placeholder={__(
                                                                    '请输入',
                                                                )}
                                                                autoFocus={
                                                                    targetStatusData[
                                                                        field
                                                                            .indexId
                                                                    ]
                                                                        .errorStatus ===
                                                                    FieldErrorType.NORMAL
                                                                }
                                                                defaultValue={
                                                                    field.name
                                                                }
                                                                style={{
                                                                    fontSize:
                                                                        '12px',
                                                                    padding:
                                                                        '4px 0',
                                                                }}
                                                                onBlur={(e) => {
                                                                    handleFieldBlur(
                                                                        e,
                                                                        field,
                                                                    )
                                                                }}
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    handleChange(
                                                                        e,
                                                                        field,
                                                                    )
                                                                }}
                                                                maxLength={255}
                                                            />
                                                        ) : (
                                                            <div
                                                                className={
                                                                    styles.targetNameContent
                                                                }
                                                            >
                                                                <div
                                                                    title={
                                                                        field.name
                                                                    }
                                                                    className={classnames(
                                                                        styles.name,
                                                                        field?.unmapped
                                                                            ? styles.romveDataName
                                                                            : '',
                                                                    )}
                                                                >
                                                                    {field.name}
                                                                </div>
                                                                {(hoverField ===
                                                                    field.indexId ||
                                                                    editDescriptionField ===
                                                                        field.indexId) &&
                                                                !field?.unmapped ? (
                                                                    <Tooltip
                                                                        placement="right"
                                                                        open={
                                                                            editDescriptionField ===
                                                                            field.indexId
                                                                        }
                                                                        color="#fff"
                                                                        getPopupContainer={() =>
                                                                            graph.container
                                                                        }
                                                                        overlayInnerStyle={{
                                                                            width: '240px',
                                                                            maxHeight:
                                                                                '150px',
                                                                        }}
                                                                        title={
                                                                            <div
                                                                                className={
                                                                                    styles.editDescripton
                                                                                }
                                                                                onClick={(
                                                                                    e,
                                                                                ) => {
                                                                                    e.preventDefault()
                                                                                    e.stopPropagation()
                                                                                }}
                                                                                onDoubleClick={(
                                                                                    e,
                                                                                ) => {
                                                                                    e.preventDefault()
                                                                                    e.stopPropagation()
                                                                                }}
                                                                            >
                                                                                <div
                                                                                    className={
                                                                                        styles.titleBar
                                                                                    }
                                                                                >
                                                                                    <span
                                                                                        className={
                                                                                            styles.editDescriptonLabel
                                                                                        }
                                                                                    >
                                                                                        {__(
                                                                                            '注释',
                                                                                        )}
                                                                                    </span>
                                                                                    <div
                                                                                        onClick={(
                                                                                            e,
                                                                                        ) => {
                                                                                            e.preventDefault()
                                                                                            e.stopPropagation()
                                                                                            setEditDescriptionField(
                                                                                                '',
                                                                                            )
                                                                                            if (
                                                                                                editStatus
                                                                                            ) {
                                                                                                node.replaceData(
                                                                                                    {
                                                                                                        ...node.data,
                                                                                                        items: node.data.items.map(
                                                                                                            (
                                                                                                                item,
                                                                                                            ) =>
                                                                                                                item.indexId ===
                                                                                                                editDescriptionField
                                                                                                                    ? {
                                                                                                                          ...item,
                                                                                                                          description:
                                                                                                                              editDescriptionInfo,
                                                                                                                      }
                                                                                                                    : item,
                                                                                                        ),
                                                                                                        descriptionField:
                                                                                                            '',
                                                                                                    },
                                                                                                )
                                                                                            }
                                                                                        }}
                                                                                        className={
                                                                                            styles.close
                                                                                        }
                                                                                    >
                                                                                        <CloseOutlined />
                                                                                    </div>
                                                                                </div>

                                                                                <div>
                                                                                    {editStatus ? (
                                                                                        <Input.TextArea
                                                                                            maxLength={
                                                                                                255
                                                                                            }
                                                                                            value={
                                                                                                editDescriptionInfo
                                                                                            }
                                                                                            onBlur={(
                                                                                                e,
                                                                                            ) => {
                                                                                                e.preventDefault()
                                                                                                e.stopPropagation()

                                                                                                if (
                                                                                                    editStatus
                                                                                                ) {
                                                                                                    node.replaceData(
                                                                                                        {
                                                                                                            ...node.data,
                                                                                                            items: node.data.items.map(
                                                                                                                (
                                                                                                                    item,
                                                                                                                ) =>
                                                                                                                    item.indexId ===
                                                                                                                    editDescriptionField
                                                                                                                        ? {
                                                                                                                              ...item,
                                                                                                                              description:
                                                                                                                                  e
                                                                                                                                      .target
                                                                                                                                      .value,
                                                                                                                          }
                                                                                                                        : item,
                                                                                                            ),
                                                                                                        },
                                                                                                    )
                                                                                                }
                                                                                            }}
                                                                                            disabled={
                                                                                                !editStatus
                                                                                            }
                                                                                            onChange={(
                                                                                                e,
                                                                                            ) => {
                                                                                                setEditDescriptionInfo(
                                                                                                    e
                                                                                                        .target
                                                                                                        .value,
                                                                                                )
                                                                                            }}
                                                                                            className={
                                                                                                styles.inputText
                                                                                            }
                                                                                            placeholder={__(
                                                                                                '请输入注释',
                                                                                            )}
                                                                                        />
                                                                                    ) : (
                                                                                        <div
                                                                                            className={
                                                                                                styles.textView
                                                                                            }
                                                                                        >
                                                                                            {editDescriptionInfo || (
                                                                                                <span
                                                                                                    className={
                                                                                                        styles.emptyText
                                                                                                    }
                                                                                                >
                                                                                                    {`[${__(
                                                                                                        '暂无注释',
                                                                                                    )}]`}
                                                                                                </span>
                                                                                            )}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        }
                                                                    >
                                                                        <Tooltip
                                                                            placement="bottom"
                                                                            title={__(
                                                                                '注释',
                                                                            )}
                                                                        >
                                                                            <div
                                                                                className={
                                                                                    styles.descriptionContent
                                                                                }
                                                                                onClick={(
                                                                                    e,
                                                                                ) => {
                                                                                    e.preventDefault()
                                                                                    e.stopPropagation()
                                                                                    node.replaceData(
                                                                                        {
                                                                                            ...node.data,
                                                                                            descriptionField:
                                                                                                field.indexId,
                                                                                        },
                                                                                    )
                                                                                    const sourceNode =
                                                                                        graph
                                                                                            .getNodes()
                                                                                            .find(
                                                                                                (
                                                                                                    currentNode,
                                                                                                ) =>
                                                                                                    currentNode
                                                                                                        .data
                                                                                                        .type ===
                                                                                                    FormType.SOURCESFORM,
                                                                                            )
                                                                                    sourceNode?.replaceData(
                                                                                        {
                                                                                            ...sourceNode.data,
                                                                                            descriptionField:
                                                                                                '',
                                                                                        },
                                                                                    )

                                                                                    setEditDescriptionInfo(
                                                                                        field.description ||
                                                                                            undefined,
                                                                                    )
                                                                                }}
                                                                            >
                                                                                {field.description ? null : (
                                                                                    <div
                                                                                        className={
                                                                                            styles.dotTip
                                                                                        }
                                                                                    />
                                                                                )}
                                                                                <div>
                                                                                    <CommentOutlined />
                                                                                </div>
                                                                            </div>
                                                                        </Tooltip>
                                                                    </Tooltip>
                                                                ) : null}
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                                <div
                                    className={classnames(
                                        styles.formContentPageTurning,
                                        styles.originFormPageTurning,
                                    )}
                                    // onMouseEnter={() => {
                                    //     selectedForm()
                                    // }}
                                    // onMouseLeave={() => {
                                    //     handleCancelForm()
                                    // }}
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
                                    <div style={{ padding: '0 12px' }}>
                                        {`${data.offset + 1} /
                                    ${Math.ceil(
                                        searchFieldData(
                                            sourceData,
                                            data.items,
                                            data.keyWord,
                                            FormType.TARGETFORM,
                                        ).length / 10,
                                    )}`}
                                    </div>
                                    <RightOutlined
                                        onClick={(e) => {
                                            if (
                                                data.offset + 1 ===
                                                Math.ceil(
                                                    searchFieldData(
                                                        sourceData,
                                                        data.items,
                                                        data.keyWord,
                                                        FormType.TARGETFORM,
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
                                                    sourceData,
                                                    data.items,
                                                    data.keyWord,
                                                    FormType.TARGETFORM,
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
                            <div className={styles.notHasField}>
                                {debouncedValue ? (
                                    __('抱歉，没有找到相关字段')
                                ) : (
                                    <>
                                        <div>{__('暂无字段')}</div>
                                        <div>
                                            {__('请先配置左侧来源数据表')}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div>
                        <div className={styles.emptyIcon}>
                            <Image src={targetSvg} width={40} preview={false} />
                        </div>
                        <div className={styles.textName}>
                            {__('目标数据表')}
                        </div>
                        <div className={styles.addFormTips}>
                            <span>{__('点击')}</span>
                            <span
                                style={{
                                    color: '#126ee3',
                                    cursor: 'pointer',
                                }}
                                onClick={() => {
                                    setConfigOpen(true)
                                }}
                            >
                                {__('【配置】')}
                            </span>
                            <span>{__('去设置目标数据表')}</span>
                        </div>
                    </div>
                )}
                {configOpen && (
                    <ConfigModal
                        node={node}
                        connectNode={
                            graph
                                ?.getNodes()
                                .filter(
                                    (currentNode) =>
                                        currentNode.data.type ===
                                        FormType.SOURCESFORM,
                                )[0]
                        }
                        onClose={() => {
                            setConfigOpen(false)
                        }}
                        onConfirm={() => {
                            const { updateAllPortAndEdge } = callbackColl
                            updateAllPortAndEdge()
                        }}
                        editStatus={editStatus}
                    />
                )}
            </div>
        </ConfigProvider>
    )
}

const dataTargetForm = (callback?: any) => {
    if (callback) {
        callbackColl = callback
    }
    register({
        shape: 'data-target-form',
        effect: ['data'],
        component: DataTargetForm,
    })
    return 'data-target-form'
}

export default dataTargetForm
