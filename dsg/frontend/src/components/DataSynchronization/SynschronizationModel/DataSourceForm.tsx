import * as React from 'react'
import { useState, useEffect, FC } from 'react'
import { register } from '@antv/x6-react-shape'
import { ConfigProvider, Image, Modal, Tooltip } from 'antd'
import classnames from 'classnames'
import { Graph, Node } from '@antv/x6'
import { CloseOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons'
import sourceSvg from '@/assets/dataSourceSync.svg'
import dataFormLineSvg from '@/assets/dataFormLine.svg'
import DataTypeIcons from '../Icons'
import DataSourcIcons from '../../DataSource/Icons'
import Icons from '../../BusinessArchitecture/Icons'
import { Architecture } from '../../BusinessArchitecture/const'
import styles from '../styles.module.less'
import __ from '../locale'
import ConfigModal from './ConfigModal'
import { CommentOutlined, DataOriginConfigOutlined } from '@/icons'
import { getCurrentShowData } from '../../FormGraph/helper'
import {
    DataSourceIcon,
    changeFieldDataBaseType,
    changeTypeMySQLToHive,
    comboDataLength,
    formatFieldData,
    searchFieldData,
} from '../helper'
import { FormType, NotChangedToHive } from '../const'
import { DataSourceFromType, getDataBaseDetails } from '@/core'
import { DataBaseType } from '@/components/DataSource/const'

let callbackColl: any = {}
interface DataSourceFormType {
    node: Node
    graph: Graph
}

const DataSourceForm: FC<DataSourceFormType> = ({ node, graph }) => {
    const { data } = node
    const [formInfo, setFormInfo] = useState<any>(null)
    const [editStatus, setEditStatus] = useState<boolean>(false)
    const [configOpen, setConfigOpen] = useState<boolean>(false)
    const [searchStatus, setSearchStatus] = useState<boolean>(false)
    const [targetData, setTargetData] = useState<Array<any>>([])
    const [selectedField, setSelectedField] = useState<string>('')
    const { updateAllPortAndEdge } = callbackColl
    const [dataSourceDetail, setDataSourceDetail] = useState<any>({})
    // 注释信息
    const [editDescriptionInfo, setEditDescriptionInfo] = useState<
        string | undefined
    >(undefined)
    // 当前编辑的注释
    const [editDescriptionField, setEditDescriptionField] = useState<
        string | number
    >('')

    // 悬浮显示字段的状态
    const [hoverField, setHoverField] = useState<string | number>('')

    useEffect(() => {
        setFormInfo(data.formInfo)
        if (data?.items?.length > 0) {
            setTargetData(
                getCurrentShowData(
                    data.offset,
                    searchFieldData(
                        data.items,
                        graph
                            .getNodes()
                            .find(
                                (currentNode) =>
                                    currentNode.data.type ===
                                    FormType.TARGETFORM,
                            )?.data.items || [],
                        data.keyWord,
                        FormType.SOURCESFORM,
                    ),
                    10,
                ),
            )
        } else {
            setTargetData([])
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

    /**
     * 下一页
     */
    const handlePageDown = () => {
        // const { updateAllPortAndEdge } = callbackColl
        const targetNode = graph
            .getNodes()
            .find(
                (currentNode) => currentNode.data.type === FormType.TARGETFORM,
            )
        node.setData({
            ...data,
            offset: data.offset + 1,
        })

        targetNode?.replaceData({
            ...targetNode.data,
            offset: data.offset + 1,
        })
        updateAllPortAndEdge(node)
    }

    /**
     * 上一页
     */
    const handlePageUp = () => {
        // const { updateAllPortAndEdge } = callbackColl
        const targetNode = graph
            .getNodes()
            .find(
                (currentNode) => currentNode.data.type === FormType.TARGETFORM,
            )
        node.setData({
            ...data,
            offset: data.offset - 1,
        })
        targetNode?.replaceData({
            ...targetNode.data,
            offset: data.offset - 1,
        })

        updateAllPortAndEdge(node)
    }

    /**
     * 获取数据源信息
     */
    const getDataSourceDetail = async (id: string) => {
        const dataSourceInfo = await getDataBaseDetails(id)
        setDataSourceDetail(dataSourceInfo)
    }

    /**
     * 选择字段
     */
    const handleSelectField = (field) => {
        const targetNode = graph
            .getNodes()
            .find(
                (currentNode) => currentNode.data.type === FormType.TARGETFORM,
            )
        const edgeRelation = callbackColl.getEdgeRelation()

        node.replaceData({
            ...node.data,
            singleSelectedId: field.indexId,
            relatedSelected: '',
        })
        targetNode?.replaceData({
            ...targetNode.data,
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

    return (
        <ConfigProvider
            prefixCls="any-fabric-ant"
            iconPrefixCls="any-fabric-anticon"
        >
            <div
                className={
                    formInfo
                        ? classnames(
                              styles.formHasData,
                              styles.formHasDataSource,
                          )
                        : classnames(styles.formNoData, styles.formNoDataSource)
                }
            >
                {formInfo ? (
                    <div className={styles.formContainer}>
                        <div className={styles.formTitle}>
                            <div className={styles.formTitleLine} />
                            <div
                                className={classnames(
                                    styles.formTitleContent,
                                    styles.formSourceTitleBoder,
                                )}
                            >
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
                                                        {dataSourceDetail.name}
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
                                            dataType={formInfo?.datasource_type}
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
                                {editStatus && (
                                    <div className={styles.formTitleBtn}>
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
                                    </div>
                                )}
                            </div>
                        </div>

                        {targetData?.length ? (
                            <div className={styles.formList}>
                                <div>
                                    {targetData?.map((field, index) => {
                                        return (
                                            <div
                                                className={classnames(
                                                    styles.formItem,
                                                    field.indexId ===
                                                        node.data
                                                            .singleSelectedId ||
                                                        data.relatedSelected ===
                                                            field.indexId
                                                        ? styles.connectSelectedField
                                                        : '',
                                                    selectedField ===
                                                        field.indexId
                                                        ? styles.selectedField
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
                                                key={index}
                                                onFocus={() => 0}
                                                onBlur={() => 0}
                                                onMouseOver={() => {
                                                    setHoverField(field.indexId)
                                                }}
                                                onMouseLeave={() => {
                                                    setHoverField('')
                                                }}
                                            >
                                                <Tooltip
                                                    placement="left"
                                                    title={`${field.type}${
                                                        field.type === 'string'
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
                                                        className={styles.icon}
                                                        style={{
                                                            color: 'rgba(0,0,0,0.65)',
                                                        }}
                                                    >
                                                        <DataTypeIcons
                                                            type={field.type}
                                                        />
                                                    </div>
                                                </Tooltip>

                                                <div
                                                    className={
                                                        styles.targetNameContent
                                                    }
                                                >
                                                    <div
                                                        title={field.name}
                                                        className={classnames(
                                                            styles.name,
                                                            field?.unmapped
                                                                ? styles.romveDataName
                                                                : '',
                                                        )}
                                                    >
                                                        {field.name}
                                                    </div>
                                                    {hoverField ===
                                                        field.indexId ||
                                                    editDescriptionField ===
                                                        field.indexId ? (
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
                                                                >
                                                                    <div
                                                                        className={
                                                                            styles.titleBar
                                                                        }
                                                                    >
                                                                        <div
                                                                            className={
                                                                                styles.editDescriptonLabel
                                                                            }
                                                                        >
                                                                            {__(
                                                                                '注释',
                                                                            )}
                                                                        </div>
                                                                        <div
                                                                            onClick={(
                                                                                e,
                                                                            ) => {
                                                                                e.preventDefault()
                                                                                e.stopPropagation()
                                                                                setEditDescriptionField(
                                                                                    '',
                                                                                )
                                                                                node.replaceData(
                                                                                    {
                                                                                        ...node.data,
                                                                                        descriptionField:
                                                                                            '',
                                                                                    },
                                                                                )
                                                                            }}
                                                                            className={
                                                                                styles.close
                                                                            }
                                                                        >
                                                                            <CloseOutlined />
                                                                        </div>
                                                                    </div>

                                                                    <div>
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
                                                                                ...data,
                                                                                descriptionField:
                                                                                    field.indexId,
                                                                            },
                                                                        )
                                                                        const targetNode =
                                                                            graph
                                                                                .getNodes()
                                                                                .find(
                                                                                    (
                                                                                        currentNode,
                                                                                    ) =>
                                                                                        currentNode
                                                                                            .data
                                                                                            .type ===
                                                                                        FormType.TARGETFORM,
                                                                                )
                                                                        targetNode?.replaceData(
                                                                            {
                                                                                ...targetNode.data,
                                                                                descriptionField:
                                                                                    '',
                                                                            },
                                                                        )
                                                                        setEditDescriptionField(
                                                                            field.indexId,
                                                                        )
                                                                        setEditDescriptionInfo(
                                                                            field.description ||
                                                                                undefined,
                                                                        )
                                                                    }}
                                                                >
                                                                    <div>
                                                                        <CommentOutlined />
                                                                    </div>
                                                                </div>
                                                            </Tooltip>
                                                        </Tooltip>
                                                    ) : null}
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
                                            data.items,
                                            graph
                                                .getNodes()
                                                .find(
                                                    (currentNode) =>
                                                        currentNode.data
                                                            .type ===
                                                        FormType.TARGETFORM,
                                                )?.data.items || [],
                                            data.keyWord,
                                            FormType.SOURCESFORM,
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
                                                        graph
                                                            .getNodes()
                                                            .find(
                                                                (currentNode) =>
                                                                    currentNode
                                                                        .data
                                                                        .type ===
                                                                    FormType.TARGETFORM,
                                                            )?.data.items || [],
                                                        data.keyWord,
                                                        FormType.SOURCESFORM,
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
                                                    graph
                                                        .getNodes()
                                                        .find(
                                                            (currentNode) =>
                                                                currentNode.data
                                                                    .type ===
                                                                FormType.TARGETFORM,
                                                        )?.data.items || [],
                                                    data.keyWord,
                                                    FormType.SOURCESFORM,
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
                                {data?.keyWord ? (
                                    __('抱歉，没有相关映射字段')
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
                        <div className={styles.emptyLine}>
                            <Image
                                src={dataFormLineSvg}
                                width={100}
                                preview={false}
                            />
                        </div>
                        <div className={styles.emptyIcon}>
                            <Image src={sourceSvg} width={40} preview={false} />
                        </div>
                        <div className={styles.textName}>
                            {__('来源数据表')}
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
                            <span>{__('去添加来源数据表')}</span>
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
                                        FormType.TARGETFORM,
                                )[0]
                        }
                        onClose={() => {
                            setConfigOpen(false)
                        }}
                        editStatus={editStatus}
                        onConfirm={async (
                            fieldData,
                            selectedDataSourceType,
                        ) => {
                            const targetNode = graph
                                ?.getNodes()
                                .filter(
                                    (currentNode) =>
                                        currentNode.data.type ===
                                        FormType.TARGETFORM,
                                )[0]
                            let targetFields = fieldData
                            if (targetNode?.data?.formInfo?.datasource_type) {
                                // 数据转换
                                targetFields = await changeFieldDataBaseType(
                                    fieldData,
                                    selectedDataSourceType,
                                    targetNode?.data?.formInfo?.datasource_type,
                                )
                            }
                            targetNode?.replaceData({
                                ...targetNode?.data,
                                items: targetFields.map((field, index) => ({
                                    ...field,
                                    indexId: index,
                                    description:
                                        field?.description?.length > 255
                                            ? field.description.substring(
                                                  0,
                                                  255,
                                              )
                                            : field.description,
                                })),
                                singleSelectedId: '',
                                offset: 0,
                                keyWord: '',
                            })

                            updateAllPortAndEdge()
                        }}
                    />
                )}
            </div>
        </ConfigProvider>
    )
}

const dataSourceForm = (callback?: any) => {
    if (callback) {
        callbackColl = callback
    }
    register({
        shape: 'data-source-form',
        effect: ['data'],
        component: DataSourceForm,
    })
    return 'data-source-form'
}

export default dataSourceForm
