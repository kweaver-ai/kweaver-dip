import * as React from 'react'
import { useState, useEffect, FC } from 'react'
import { register } from '@antv/x6-react-shape'
import { ConfigProvider, Image, Tooltip } from 'antd'
import classnames from 'classnames'
import { Graph, Node } from '@antv/x6'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import sourceSvg from '@/assets/sourceSyncForm.svg'
import processFormLineSvg from '@/assets/processFormLine.svg'
import DataTypeIcons from '../../DataSynchronization/Icons'
import styles from '../styles.module.less'
import __ from '../locale'
import { ChangeFormOutlined } from '@/icons'
import { getCurrentShowData } from '../../FormGraph/helper'
import {
    getDataFormFieldType,
    getFieldLengthByBussiness,
    searchFieldData,
} from '../helper'
import { FormType, VIRTUALENGINTYPE } from '../../DataSynchronization/const'
import { getDataBaseDetails } from '@/core'
import SelectBussinessForm from './SelectBussinessForm'
import { changeFieldDataBaseType } from '@/components/DataSynchronization/helper'

let callbackColl: any = {}
interface DataBussinessFormType {
    node: Node
    graph: Graph
}

const DataBussinessForm: FC<DataBussinessFormType> = ({ node, graph }) => {
    const { data } = node
    const [formInfo, setFormInfo] = useState<any>(null)
    const [editStatus, setEditStatus] = useState<boolean>(false)
    const [configOpen, setConfigOpen] = useState<boolean>(false)
    const [searchStatus, setSearchStatus] = useState<boolean>(false)
    const [targetData, setTargetData] = useState<Array<any>>([])
    const [selectedField, setSelectedField] = useState<string>('')
    const { updateAllPortAndEdge, getTaskInfo, getAllDataTypes } = callbackColl
    const [dataSourceDetail, setDataSourceDetail] = useState<any>({})
    const allDataTypes = getAllDataTypes()

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
                        FormType.BUSSINESSFORM,
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
                                <div className={styles.leftFormInfo}>
                                    <span
                                        title={formInfo?.name}
                                        className={styles.name}
                                        style={{
                                            width: '220px',
                                        }}
                                    >
                                        {formInfo?.name || ''}
                                    </span>
                                </div>
                                {editStatus && (
                                    <div className={styles.formTitleBtn}>
                                        <Tooltip
                                            placement="top"
                                            title={__('更换业务表')}
                                        >
                                            <ChangeFormOutlined
                                                className={styles.iconBtn}
                                                style={{
                                                    fontSize: '16px',
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

                        {targetData.length ? (
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
                                            >
                                                <Tooltip
                                                    placement="left"
                                                    title={
                                                        <div>
                                                            <div>
                                                                {allDataTypes?.length
                                                                    ? allDataTypes.find(
                                                                          (
                                                                              currentType,
                                                                          ) =>
                                                                              currentType.value_en ===
                                                                              field.data_type,
                                                                      )
                                                                          ?.value ||
                                                                      field.data_type
                                                                    : field.data_type}
                                                            </div>
                                                        </div>
                                                    }
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
                                                            type={
                                                                field.data_type
                                                            }
                                                        />
                                                    </div>
                                                </Tooltip>

                                                <div
                                                    title={field.name}
                                                    className={styles.name}
                                                >
                                                    {field.name}
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
                                            FormType.BUSSINESSFORM,
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
                                                        FormType.BUSSINESSFORM,
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
                                                    FormType.BUSSINESSFORM,
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
                                {data.keyWord ? (
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
                                src={processFormLineSvg}
                                width={100}
                                preview={false}
                            />
                        </div>
                        <div className={styles.emptyIcon}>
                            <Image src={sourceSvg} width={40} preview={false} />
                        </div>
                        <div className={styles.textName}>
                            {__('来源业务表')}
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
                                {__('【选择】')}
                            </span>
                            <span>{__('去添加来源业务表')}</span>
                        </div>
                    </div>
                )}
                {configOpen && (
                    <SelectBussinessForm
                        node={node}
                        onClose={() => {
                            setConfigOpen(false)
                        }}
                        taskId={getTaskInfo ? getTaskInfo() : ''}
                        editStatus={editStatus}
                        onConfirm={async (fieldData) => {
                            const targetNode = graph
                                ?.getNodes()
                                .filter(
                                    (currentNode) =>
                                        currentNode.data.type ===
                                        FormType.TARGETFORM,
                                )[0]
                            if (targetNode.data?.formInfo?.datasource_type) {
                                const toMiddleData = fieldData.map(
                                    (field, index) => ({
                                        indexId: index,
                                        name: field.name_en,
                                        description:
                                            field?.description?.length > 255
                                                ? field.description.substring(
                                                      0,
                                                      255,
                                                  )
                                                : field.description,
                                        length: getFieldLengthByBussiness(
                                            field.data_length,
                                            field.data_accuracy,
                                            field.data_type,
                                        ),
                                        field_precision:
                                            field.data_length &&
                                            (field.data_accuracy ||
                                                field.data_accuracy === 0)
                                                ? field.data_accuracy
                                                : null,
                                        type: getDataFormFieldType(
                                            field.data_type,
                                            field.data_length,
                                            field.data_accuracy,
                                        ),
                                    }),
                                )
                                const targetFields =
                                    await changeFieldDataBaseType(
                                        toMiddleData,
                                        VIRTUALENGINTYPE,
                                        targetNode.data.formInfo
                                            .datasource_type,
                                    )
                                targetNode?.replaceData({
                                    ...targetNode?.data,
                                    items: targetFields,
                                    singleSelectedId: '',
                                    offset: 0,
                                })
                            } else {
                                targetNode?.replaceData({
                                    ...targetNode?.data,
                                    items: fieldData.map((field, index) => ({
                                        indexId: index,
                                        name: field.name_en,
                                        description:
                                            field?.description?.length > 255
                                                ? field.description.substring(
                                                      0,
                                                      255,
                                                  )
                                                : field.description,
                                        length: getFieldLengthByBussiness(
                                            field.data_length,
                                            field.data_accuracy,
                                            field.data_type,
                                        ),
                                        field_precision:
                                            field.data_length &&
                                            (field.data_accuracy ||
                                                field.data_accuracy === 0)
                                                ? field.data_accuracy
                                                : null,
                                        type: getDataFormFieldType(
                                            field.data_type,
                                            field.data_length,
                                            field.data_accuracy,
                                        ),
                                    })),
                                    singleSelectedId: '',
                                    offset: 0,
                                })
                            }

                            updateAllPortAndEdge()
                        }}
                    />
                )}
            </div>
        </ConfigProvider>
    )
}

const dataBussinessForm = (callback?: any) => {
    if (callback) {
        callbackColl = callback
    }
    register({
        shape: 'data-bussiness-form',
        effect: ['data'],
        component: DataBussinessForm,
    })
    return 'data-bussiness-form'
}

export default dataBussinessForm
