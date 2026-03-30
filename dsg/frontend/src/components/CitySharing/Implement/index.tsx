import {
    Button,
    Col,
    Drawer,
    Form,
    Input,
    message,
    Radio,
    Row,
    Space,
} from 'antd'
import { clone, has, noop, omit, pick } from 'lodash'
import classnames from 'classnames'
import React, { useEffect, useRef, useState } from 'react'
import { CloseOutlined, InfoCircleFilled } from '@ant-design/icons'
import moment from 'moment'
import styles from './styles.module.less'
import DrawerHeader from '../component/DrawerHeader'
import __ from '../locale'
import { CommonTitle, DetailsLabel } from '@/ui'
import {
    ImplementDataPushConfig,
    ImplementDataPushStrategy,
    ImplementGroupConfig,
    ImplementGroupKeys,
    ImplementStatusConfig,
    NoTargetPushForm,
} from '../const'
import PushFieldDetail from './PushFieldDetail'
import Editor, { getFormatSql } from '@/components/IndicatorManage/Editor'
import { formatTime, useQuery } from '@/utils'
import { TagsView } from '../helper'
import {
    formatError,
    getCityShareApplyDetail,
    getConnectorTypeMap,
    getDataBaseDetails,
    getDataFormFields,
    getDataPushDetail,
    getDatasheetViewDetails,
    getDataViewBaseInfo,
    getRescDirColumnInfo,
    IConfirmInfo,
    IConnectorMapSourceType,
    implementCityShareApply,
    putCityShareApplyImplementSolutionConfirm,
    ShareApplySubmitType,
} from '@/core'
import { changeDataType } from './helper'
import SchedulePlanForm from '@/components/DataPush/SchedulePlanForm'
import PushField from '@/components/DataPush/CreateDataPush/PushField'
import FilterRuleEditor from '@/components/DataPush/CreateDataPush/FilterRuleEditor'
import {
    ScheduleExecuteStatus,
    TransmitMode,
} from '@/components/DataPush/const'
import IncrementalForm from '@/components/DataPush/CreateDataPush/IncrementalForm'
import { pushMechanism } from '@/components/DataPush/Details/helper'
import { IDetailsLabel } from '@/components/ApiServices/const'
import { formatFieldData } from '@/components/DataPush/CreateDataPush/helper'
import { schedulePlan } from '@/components/DataPush/helper'
import { resourceUtilizationOptions } from '../Apply/helper'

interface ImplementProps {
    open: boolean
    onClose: () => void
    applyId: string
    model?: 'detail' | 'implement'
    rejectReason?: string
    isConfirmPlan?: boolean
    isViewPlan?: boolean
    catalogId?: string
    analysisId?: string
    onConfirm?: (confirmInfo: IConfirmInfo) => void
}
export const Implement = ({
    open,
    onClose,
    applyId,
    rejectReason,
    model = 'detail',
    isConfirmPlan = false,
    isViewPlan = false,
    catalogId,
    analysisId,
    onConfirm = noop,
}: ImplementProps) => {
    // 目录数据
    const [catalogsData, setCatalogsData] = useState<any>()

    // 数据资源信息
    const [dataResourceInfo, setDataResourceInfo] = useState<any>()

    // 资源使用配置
    const [resourceUsageInfo, setResourceUsageInfo] = useState<any>()

    const [sourceData, setSourceData] = useState<any>()

    const [sourceInfo, setSourceInfo] = useState<any>()

    const [targetData, setTargetData] = useState<any>()

    const [pushFields, setPushFields] = useState<any>([])

    const [detailPushFields, setDetailPushFields] = useState<any>([])

    const [sqlScript, setSqlScript] = useState<string>('')

    const [dataViewId, setDataViewId] = useState<string>('')

    const [pushDetails, setPushDetails] = useState<any>({})

    const [sourceFields, setSourceFields] = useState<Array<any>>([])

    const [pushType, setPushType] = useState<boolean>(false)

    const sqlScriptRef = useRef<any>()

    const pushFieldRef = useRef<any>()
    const query = useQuery()

    const urlApplyId = query.get('applyId') || ''

    const [incrementalForm] = Form.useForm()

    const [schedulePlanForm] = Form.useForm()

    const [auditForm] = Form.useForm()

    useEffect(() => {
        if ((applyId || urlApplyId) && catalogId) {
            getCatalogsData()
        }
    }, [applyId, urlApplyId, catalogId, model])

    useEffect(() => {
        if (sourceData?.fields?.length && targetData?.fields?.length) {
            if (detailPushFields.length) {
                setPushFields(
                    sourceData.fields.map((item) => {
                        const findPushField = detailPushFields.find(
                            (item2) =>
                                item2.source_field?.technical_name ===
                                item.technical_name,
                        )
                        const foundField = targetData.fields.find(
                            (targetItem) =>
                                targetItem.technical_name ===
                                findPushField.technical_name,
                        )

                        if (findPushField) {
                            return {
                                ...foundField,
                                ...findPushField,
                                primary_key: !!findPushField.primary_key,
                                selected_flag: true,
                                source_field_id: item.id,
                            }
                        }
                        return {
                            source_field_id: item.id,
                        }
                    }),
                )
            } else {
                setPushFields(
                    sourceData.fields.map((item) => {
                        const foundField = targetData.fields.find(
                            (targetItem) =>
                                targetItem.technical_name ===
                                item.technical_name,
                        )
                        if (foundField) {
                            return {
                                ...foundField,
                                source_field_id: item.id,
                                data_type:
                                    foundField?.data_type || item.data_type,
                            }
                        }
                        return {
                            source_field_id: item.id,
                        }
                    }),
                )
            }
            if (sourceData?.fields?.length) {
                setSourceFields(
                    sourceData.fields.map((item) => {
                        const findPushField = detailPushFields.find(
                            (item2) =>
                                item2.source_field?.technical_name ===
                                item.technical_name,
                        )
                        return {
                            ...item,
                            selected_flag: findPushField,
                        }
                    }),
                )
            }
        }
    }, [sourceData, targetData, detailPushFields])

    /**
     *  获取当前来源资源
     * @param analysisInfo
     * @param baseInfo
     * @param dataId
     * @returns
     */
    const getResourceInfo = (
        analysisInfo: Array<any>,
        baseInfo: Array<any>,
        dataId: string,
    ) => {
        // 获取有column_ids的数据
        const hasColumnIdsData = analysisInfo.filter((item) => item.column_ids)

        // 获取所有数据
        const allDataInfo = [
            ...baseInfo,
            ...analysisInfo.filter(
                (item) => item.is_new_res || item.is_res_replace,
            ),
        ].map((item) => {
            const columnIds = hasColumnIdsData.find(
                (item2) => item2.id === item.id,
            )?.column_ids
            if (columnIds) {
                return {
                    ...item,
                    column_ids: columnIds,
                }
            }
            return item
        })
        return allDataInfo.find(
            (item) => item.apply_conf?.view_apply_conf?.data_res_id === dataId,
        )
    }

    /**
     * 获取目录数据
     */
    const getCatalogsData = async () => {
        try {
            const detailsData = await getCityShareApplyDetail(
                applyId || (urlApplyId as string),
                {
                    fields: 'base,analysis,implement',
                },
            )
            setCatalogsData(detailsData)
            const resourceInfo = getResourceInfo(
                detailsData?.analysis?.resources || [],
                detailsData?.base?.resources || [],
                catalogId || '',
            )
            setDataResourceInfo({
                data_res_name:
                    resourceInfo?.apply_conf?.view_apply_conf?.data_res_name ||
                    '--',
                data_res_code:
                    resourceInfo?.apply_conf?.view_apply_conf?.data_res_code,
                res_name: resourceInfo?.res_name,
                name: detailsData?.base?.name,
                org_name: resourceInfo?.org_path,
                org_path: resourceInfo?.org_path,
                analyst: detailsData?.base?.analyst,
                analyst_phone: detailsData?.base?.analyst_phone,
                apply_org_name: detailsData?.base?.apply_org_name,
                apply_org_path: detailsData?.base?.apply_org_path,
                applier: detailsData?.base?.applier,
                phone: detailsData?.base?.phone,
            })
            setResourceUsageInfo({
                supply_type: resourceInfo?.apply_conf?.supply_type,
                area_range:
                    resourceInfo?.apply_conf?.view_apply_conf?.area_range,
                time_range:
                    resourceInfo?.apply_conf?.view_apply_conf?.time_range,
                push_frequency:
                    resourceInfo?.apply_conf?.view_apply_conf?.push_frequency,
                available_date_type:
                    resourceInfo?.apply_conf?.available_date_type ||
                    resourceInfo?.apply_conf?.available_date_type === 0
                        ? resourceUtilizationOptions.find(
                              (item) =>
                                  item.value ===
                                  resourceInfo?.apply_conf?.available_date_type,
                          )?.label
                        : '--',
            })
            const implementInfo = detailsData.implement.find(
                (item) => item.id === analysisId,
            )
            const columnIds =
                resourceInfo?.apply_conf?.view_apply_conf?.column_ids?.split(
                    ',',
                ) || []
            if (
                resourceInfo?.apply_conf?.view_apply_conf?.dst_view_name ===
                NoTargetPushForm
            ) {
                setPushType(true)
                getSourceInfo(
                    resourceInfo?.apply_conf?.view_apply_conf?.data_res_id,
                    columnIds,
                    resourceInfo?.res_id || resourceInfo?.new_res_id,
                    resourceInfo?.apply_conf?.view_apply_conf
                        ?.dst_data_source_id,
                )
            } else {
                setPushType(false)
                getSourceInfo(
                    resourceInfo?.apply_conf?.view_apply_conf?.data_res_id,
                    columnIds,
                    resourceInfo?.res_id || resourceInfo?.new_res_id,
                )

                getTargetInfo(
                    resourceInfo?.apply_conf?.view_apply_conf
                        ?.dst_data_source_id,
                    resourceInfo?.apply_conf?.view_apply_conf?.dst_view_name,
                )
            }

            setDataViewId(
                resourceInfo?.apply_conf?.view_apply_conf?.data_res_id || '',
            )
            if (implementInfo?.push_job_id) {
                const pushData = await getDataPushDetail(
                    implementInfo.push_job_id,
                )
                const {
                    source_detail,
                    target_detail,
                    sync_model_fields,
                    increment_timestamp,
                    primary_key,
                    filter_condition,
                    ...other
                } = pushData

                setPushDetails(pushData)
                // 推送机制
                const incrementalData = pick(pushData, [
                    'transmit_mode',
                    'increment_field',
                ])
                incrementalForm.setFieldsValue({
                    ...incrementalData,
                    primary_key: primary_key
                        ? primary_key.split(',')
                        : undefined,
                    increment_timestamp: increment_timestamp
                        ? moment(increment_timestamp * 1000)
                        : undefined,
                })

                // 调度计划
                const { schedule_start, schedule_end, schedule_time } = pushData
                schedulePlanForm.setFieldsValue({
                    ...other,
                    plan_date: [
                        schedule_start ? moment(schedule_start) : null,
                        schedule_end ? moment(schedule_end) : null,
                    ],
                    schedule_time: schedule_time ? moment(schedule_time) : null,
                    schedule_execute_status: schedule_time
                        ? ScheduleExecuteStatus.Timing
                        : ScheduleExecuteStatus.Immediate,
                })
                setSqlScript(filter_condition)
                if (model === 'detail') {
                    setSourceData({
                        fields: pushData.sync_model_fields.map(
                            (item) => item.source_field,
                        ),
                    })
                }

                setDetailPushFields(pushData.sync_model_fields)
                // setPushFields(pushData.sync_model_fields)
            }
        } catch (err) {
            formatError(err)
        }
    }

    // 来源表数据源类型映射
    const getSourceFieldsMapping = async (
        sourceTableFields: any[],
        sourceConnectorName?: string,
        targetConnectorName?: string,
    ): Promise<any[]> => {
        if (
            !sourceTableFields?.length ||
            !sourceConnectorName ||
            !targetConnectorName
        ) {
            // if (reset) {
            //     resetPushFields(sourceTableFields, targetFields)
            // }
            return []
        }
        try {
            // 组织数据转换的参数
            const toChangeSourceData: Array<IConnectorMapSourceType> =
                sourceTableFields.map((currentField, index) => ({
                    index,
                    sourceTypeName: currentField.data_type,
                    precision: currentField.data_length,
                    decimalDigits: currentField.precision,
                }))

            const mapRes = await getConnectorTypeMap({
                sourceConnectorName,
                targetConnectorName,
                type: toChangeSourceData,
            })
            // 变换转换后的数据格式
            const newMapData = mapRes?.type?.reduce((preData, currentData) => {
                const { index, ...rest } = currentData
                return {
                    ...preData,
                    [index]: rest,
                }
            }, {})
            // 回填转换后的数据组织成目标数据
            const newTargetData = sourceTableFields.map(
                (currentField, index) => ({
                    ...currentField,
                    data_length:
                        newMapData[index]?.precision ||
                        currentField.data_length,
                    precision:
                        newMapData[index]?.decimalDigits ||
                        currentField.precision,
                    data_type: newMapData[index].targetTypeName || 'undefined',
                    // unmapped: !newMapData[index].targetTypeName,
                }),
            )

            return newTargetData
        } catch (error) {
            formatError(error)
            return []
        }
    }

    /**
     * 获取源数据信息
     * @param id
     * @param columnIds
     */
    const getSourceInfo = async (
        id,
        columnIds,
        resourceId,
        targetDataSource = '',
    ) => {
        try {
            const [source_info, source_detail, { columns }] = await Promise.all(
                [
                    getDatasheetViewDetails(id),
                    getDataViewBaseInfo(id),
                    getRescDirColumnInfo({
                        catalogId: resourceId,
                        offset: 1,
                        limit: 1000,
                    }),
                ],
            )
            const dataFormFields = await getDataFormFields(
                source_info.technical_name,
                source_info.datasource_id,
            )
            const keys = [
                'id',
                'business_name',
                'technical_name',
                'primary_key',
                'is_nullable',
            ]
            const newSourceFields = columns
                .filter((item) => columnIds.includes(item.id))
                .map((item) => {
                    const dataFormField = source_info.fields.find(
                        (item2) => item2.id === item.source_id,
                    )
                    const newFieldInfo = dataFormFields.find(
                        (item2) => dataFormField.technical_name === item2.name,
                    )
                    const { data_type, data_length, precision } =
                        formatFieldData(newFieldInfo)

                    return {
                        ...pick(dataFormField, keys),
                        id: dataFormField.id,
                        technical_name: dataFormField.technical_name,
                        data_type,
                        data_length:
                            dataFormField?.data_length ||
                            dataFormField?.data_length === 0
                                ? dataFormField?.data_length
                                : undefined,
                        precision:
                            (dataFormField?.data_accuracy ||
                                dataFormField?.data_accuracy === 0) &&
                            dataFormField?.data_accuracy !== -1
                                ? dataFormField?.data_accuracy
                                : undefined,
                        desensitization_rule_id:
                            dataFormField?.desensitization_rule_id,
                        desensitization_rule_name:
                            dataFormField?.desensitization_rule_name,
                        comment: dataFormField?.description,
                    }
                })
            setSourceInfo({
                datasource_id: source_info.datasource_id,
                datasource_type: source_info.datasource_type,
                datasource_name: source_detail.datasource_name,
                name: source_info.technical_name,
                catalog_id: resourceId,
            })
            if (model === 'implement') {
                setSourceData({
                    datasource_id: source_info.datasource_id,
                    datasource_type: source_info.datasource_type,
                    datasource_name: source_detail.datasource_name,
                    name: source_info.technical_name,
                    fields: newSourceFields,
                    catalog_id: resourceId,
                })
            }
            if (targetDataSource) {
                const dataViewFields = columns
                    .filter((item) => columnIds.includes(item.id))
                    .map((item) => {
                        const viewField = newSourceFields.find(
                            (item2) => item2?.id === item.source_id,
                        )
                        return viewField || item
                    })
                await createNewTable(
                    targetDataSource,
                    `${source_info.technical_name}${moment().format(
                        'YYYYMMDDHHmmss',
                    )}`,
                    dataViewFields,
                    dataFormFields,
                    source_info.datasource_type,
                )
            }
        } catch (err) {
            formatError(err)
        }
    }

    const formatTargetFields = (fields: any[], originColumns: any[]) => {
        return (
            fields?.filter((item) =>
                originColumns.find(
                    (item2) => item2.name === item.technical_name,
                ),
            ) || []
        )
    }

    const createNewTable = async (
        datasourceId: string,
        newTableName: string,
        fields: any[],
        dataFormFields: any[],
        sourceDatasourceType: string,
    ) => {
        try {
            const res = await getDataBaseDetails(datasourceId)
            const formatFields = await getSourceFieldsMapping(
                fields,
                sourceDatasourceType,
                res.type,
            )

            const newFields = formatTargetFields(formatFields, dataFormFields)

            setTargetData({
                datasource_name: res.name,
                datasource_id: datasourceId,
                name: newTableName,
                datasource_type: res.type,
                fields: newFields,
            })
        } catch (err) {
            formatError(err)
        }
    }
    /**
     * 获取目标数据信息
     * @param datasourceId 数据源id
     * @param dst_view_name 目标库表名称
     */
    const getTargetInfo = async (datasourceId, dst_view_name) => {
        const [targetFields, targetDetail] = await Promise.all([
            getDataFormFields(dst_view_name, datasourceId),
            getDataBaseDetails(datasourceId),
        ])

        setTargetData({
            datasource_name: targetDetail.name,
            datasource_id: datasourceId,
            name: dst_view_name,
            datasource_type: targetDetail.type,
            fields: targetFields.map((item) => {
                const { data_type, data_length, precision, ...rest } =
                    formatFieldData(item)
                return {
                    ...rest,
                    data_type,
                    data_length:
                        data_length || data_length === 0
                            ? data_length
                            : undefined,
                    precision:
                        (precision || precision === 0) && precision !== -1
                            ? precision
                            : undefined,
                    technical_name: item.name,
                }
            }),
        })
    }

    const getItemContent = (configs: any) => {
        return (
            <Col span={configs.span} className={styles.colWrapper}>
                <span className={styles.labelWrapper}>{configs.label}</span>
                <span
                    className={styles.valueWrapper}
                    title={configs.value || ''}
                >
                    {configs.value || '--'}
                </span>
            </Col>
        )
    }

    const pushConfigContent = (configs: any) => {
        switch (configs.key) {
            case 'source_info':
                return (
                    <Row gutter={[16, 16]}>
                        {configs.configs.map((item) => {
                            const configInfo = {
                                ...item,
                                value: sourceInfo?.[item.key] || '--',
                            }
                            return getItemContent(configInfo)
                        })}
                    </Row>
                )
            case 'target_info':
                return (
                    <Row gutter={[16, 16]}>
                        {configs.configs.map((item) => {
                            const configInfo = {
                                ...item,
                                value:
                                    item.key === 'name' &&
                                    pushDetails?.target_detail
                                        ?.target_table_name
                                        ? pushDetails?.target_detail
                                              ?.target_table_name
                                        : targetData?.[item.key] || '--',
                            }
                            return getItemContent(configInfo)
                        })}
                    </Row>
                )
            case 'push_field':
                return model === 'detail' ? (
                    <PushFieldDetail
                        sourceFields={sourceData?.fields || []}
                        targetFields={pushFields || []}
                    />
                ) : (
                    <PushField
                        isCreate={pushType}
                        sourceFields={sourceData?.fields || []}
                        targetFields={targetData?.fields || []}
                        pushFields={pushFields}
                        setPushFields={(value) => {
                            setSourceFields(
                                sourceFields.map((item) => {
                                    const foundField = value.find(
                                        (item2) =>
                                            item.id === item2.source_field_id,
                                    )
                                    if (foundField) {
                                        return {
                                            ...item,
                                            selected_flag: true,
                                        }
                                    }
                                    return item
                                }),
                            )
                            setPushFields(value)
                        }}
                        ref={pushFieldRef}
                    />
                )
            case 'push_strategy':
                return model === 'detail' ? (
                    pushStrategyDetail()
                ) : (
                    <IncrementalForm
                        form={incrementalForm}
                        fieldList={sourceFields || []}
                    />
                )
            case 'filter_rule':
                return model === 'detail' ? (
                    sqlScript ? (
                        <div className={styles.filterRule}>
                            <Editor
                                style={{ maxHeight: 320, overflow: 'scroll' }}
                                grayBackground
                                highlightActiveLine={false}
                                value={getFormatSql(sqlScript)}
                                editable={false}
                                readOnly
                            />
                        </div>
                    ) : (
                        '--'
                    )
                ) : (
                    <FilterRuleEditor
                        ref={sqlScriptRef}
                        value={sqlScript}
                        onChange={setSqlScript}
                        fieldList={sourceData?.fields || []}
                        dataViewId={dataViewId}
                    />
                )
            case 'push_frequency':
                return model === 'detail' ? (
                    schedulePlanDetail()
                ) : (
                    <SchedulePlanForm
                        form={schedulePlanForm}
                        fields={sourceData?.fields || []}
                    />
                )
            default:
                return <div>{configs.label}</div>
        }
    }

    /**
     * 推送机制详情
     * @returns
     */
    const pushStrategyDetail = () => {
        const adaptiveData = pushMechanism
            .filter((item) => !item.hidden?.(pushDetails))
            .map((item) => {
                const newItem = clone(item)
                newItem.value = pushDetails?.[newItem.key]
                if (item.render) {
                    newItem.render = () =>
                        item.render(pushDetails?.[newItem.key], pushDetails)
                }
                return {
                    ...newItem,
                    hidden: false,
                    labelStyles: {
                        color: 'rgb(0 0 0 / 45%)',
                    },
                }
            })
        return (
            <DetailsLabel
                wordBreak
                detailsList={adaptiveData as IDetailsLabel[]}
                labelWidth="108px"
                overflowEllipsis={false}
            />
        )
    }

    const schedulePlanDetail = () => {
        const adaptiveData = schedulePlan
            .filter((item) => !item.hidden?.(pushDetails))
            .map((item) => {
                const newItem = clone(item)
                newItem.value = pushDetails?.[newItem.key]
                if (item.render) {
                    newItem.render = () =>
                        item.render(pushDetails?.[newItem.key], pushDetails)
                }
                return {
                    ...newItem,
                    hidden: false,
                    labelStyles: {
                        color: 'rgb(0 0 0 / 45%)',
                    },
                }
            })
        return (
            <DetailsLabel
                wordBreak
                detailsList={adaptiveData as IDetailsLabel[]}
                labelWidth="108px"
                overflowEllipsis={false}
            />
        )
    }

    const getSchedulePlanItem = (itemConfig, scheduleData) => {
        switch (itemConfig.key) {
            case 'schedule_type':
                return (
                    <span>
                        {scheduleData?.schedule_start
                            ? formatTime(
                                  targetData.schedule_start * 1000,
                                  'YYYY-MM-DD',
                              )
                            : '--'}
                        <span className={styles.arrow}> ⇀ </span>
                        {scheduleData?.schedule_end
                            ? formatTime(
                                  targetData.schedule_end * 1000,
                                  'YYYY-MM-DD',
                              )
                            : '--'}
                    </span>
                )
            case 'plan_month':
                return (
                    <TagsView
                        data={scheduleData?.plan_month?.map(
                            (item) => `${item}${__('月')}`,
                        )}
                    />
                )
            case 'plan_day':
                return (
                    <TagsView
                        data={scheduleData?.plan_day?.map(
                            (item) => `${item}${__('日')}`,
                        )}
                    />
                )
            default:
                return <span>{scheduleData?.[itemConfig.key]}</span>
        }
    }

    const pushConfigContainer = (configs: any) => {
        return (
            <div className={styles.pushItemWrapper}>
                <div className={styles.title}>{configs.label}</div>
                <div>{pushConfigContent(configs)}</div>
            </div>
        )
    }

    /**
     * 获取组内容
     * @param groupKey 组key
     * @returns 组内容
     */
    const getGroupContent = (groupKey: string) => {
        switch (groupKey) {
            case ImplementGroupKeys.DATA_RESOURCE_INFO:
                return (
                    <Row gutter={[16, 16]}>
                        {ImplementGroupConfig[
                            ImplementGroupKeys.DATA_RESOURCE_INFO
                        ].map((item) => {
                            const configInfo = {
                                ...item,
                                value: dataResourceInfo?.[item.key] || '--',
                            }

                            return getItemContent(configInfo)
                        })}
                    </Row>
                )
            case ImplementGroupKeys.RESOURCE_USAGE_CONFIG:
                return (
                    <Row gutter={[16, 16]}>
                        {ImplementGroupConfig[
                            ImplementGroupKeys.RESOURCE_USAGE_CONFIG
                        ].map((item) => {
                            const value =
                                item.key === 'supply_type'
                                    ? __('库表交换')
                                    : resourceUsageInfo?.[item.key] || '--'
                            const configInfo = {
                                ...item,
                                value,
                            }
                            return getItemContent(configInfo)
                        })}
                    </Row>
                )
            case ImplementGroupKeys.DATA_PUSH_CONFIG:
                return (
                    <div className={styles.pushItemWrapper}>
                        {ImplementDataPushConfig.map((item) =>
                            pushConfigContainer(item),
                        )}
                    </div>
                )
            case ImplementGroupKeys.PUSH_STRATEGY:
                return (
                    <div className={styles.pushItemWrapper}>
                        {ImplementDataPushStrategy.map((item) =>
                            pushConfigContainer(item),
                        )}
                    </div>
                )
            default:
                return <div>--</div>
        }
    }

    const handleSaveAudit = (values) => {
        onConfirm?.(values)
    }

    // 检查表单数据
    const checkForm = async () => {
        const [incrementalValidate, schedulePlanValidate] =
            await Promise.allSettled([
                incrementalForm.validateFields(),
                schedulePlanForm.validateFields(),
            ])
        pushFieldRef.current.validate()
        if (pushFieldRef.current) {
            if (!pushFields.some((item) => item.selected_flag)) {
                document.getElementById('pushField')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                })
                message.error(__('请选择推送字段'))
                return false
            }
            const { validateStatus } = pushFieldRef.current.validate()
            if (!validateStatus) {
                document.getElementById('pushField')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                })
                return false
            }
        }
        if (incrementalValidate.status === 'rejected') {
            incrementalForm.scrollToField(
                incrementalValidate?.reason?.errorFields[0]?.name,
            )
            return false
        }
        if (schedulePlanValidate.status === 'rejected') {
            schedulePlanForm.scrollToField(
                schedulePlanValidate?.reason?.errorFields[0]?.name,
            )
            return false
        }
        return true
    }

    const handlePublish = async (type: 'submit' | 'save') => {
        try {
            const check = await checkForm()
            if (!check) {
                return
            }
            const incrementalFormInfo = incrementalForm.getFieldsValue()
            const schedulePlanValues = schedulePlanForm.getFieldsValue()
            // 推送机制
            const { increment_timestamp, transmit_mode, primary_key } =
                incrementalFormInfo
            const {
                schedule_time,
                plan_date,
                schedule_execute_status,
                ...other3
            } = schedulePlanValues

            const pushParams = {
                channel: 2,
                name: `${catalogsData?.base?.name.slice(0, 100)}数据推送`,
                description: '',
                push_status: 0,
                target_table_exists: !pushType,
                ...incrementalFormInfo,
                primary_key: primary_key ? primary_key.join(',') : undefined,
                increment_timestamp: increment_timestamp
                    ? moment(increment_timestamp).unix()
                    : transmit_mode === TransmitMode.Incremental &&
                      type === 'submit'
                    ? moment().unix()
                    : undefined,
                ...other3,
                schedule_time: schedule_time
                    ? moment(schedule_time).format('YYYY-MM-DD HH:mm:ss')
                    : undefined,
                schedule_start: plan_date?.[0]
                    ? moment(plan_date[0]).format('YYYY-MM-DD')
                    : undefined,
                schedule_end: plan_date?.[1]
                    ? moment(plan_date[1]).format('YYYY-MM-DD')
                    : undefined,
                target_datasource_id: targetData?.datasource_id,
                source_catalog_id:
                    sourceInfo?.catalog_id || sourceData?.catalog_id,

                target_table_name: targetData?.name,
                filter_condition: sqlScript,
                sync_model_fields: pushFields
                    .filter((item) => item.selected_flag)
                    .map((item) => {
                        return {
                            ...omit(item, [
                                'selected_flag',
                                'errorTips',
                                'original_data_type',
                                'id',
                                'source_field_id',
                            ]),
                            source_tech_name: sourceData?.fields.find(
                                (item2) => item2.id === item.source_field_id,
                            )?.technical_name,
                        }
                    }),
            }
            await implementCityShareApply(applyId || (urlApplyId as string), {
                analysis_item_id: analysisId || '',
                push_params: JSON.stringify(pushParams),
            })
            message.success('制定实施方案成功')
            onClose?.()
        } catch (err) {
            formatError(err)
        }
    }

    return (
        <Drawer
            open={open}
            width={isConfirmPlan ? '85%' : '100%'}
            placement="right"
            closable={false}
            bodyStyle={{
                padding: '0',
                display: 'flex',
                flexDirection: 'column',
                minWidth: 1080,
            }}
            contentWrapperStyle={{ minWidth: 800 }}
            destroyOnClose
            maskClosable={false}
            mask={false}
            push={false}
        >
            <div
                className={classnames(
                    styles.details,
                    styles['analysis-details-wrapper'],
                    isConfirmPlan && styles['implement-confirm-wrapper'],
                )}
            >
                {/* 导航头部 */}
                {isConfirmPlan ? (
                    <div className={styles.headerTitle}>
                        <div className={styles.titleText} title="ffff">
                            {isViewPlan ? __('查看方案') : __('确认方案')}
                        </div>
                        <CloseOutlined
                            className={styles.close}
                            onClick={() => onClose?.()}
                        />
                    </div>
                ) : (
                    <DrawerHeader
                        title={__('数据资源实施')}
                        fullScreen
                        onClose={onClose}
                    />
                )}

                {/* 内容 */}
                <div className={styles.bottom}>
                    <div className={styles.content}>
                        <div className={styles['content-body']}>
                            {rejectReason && (
                                <div className={styles.rejectInfoWrapper}>
                                    <div className={styles.icon}>
                                        <InfoCircleFilled />
                                    </div>
                                    <div className={styles.contentWrapper}>
                                        <div className={styles.title}>
                                            {__('驳回说明')}
                                        </div>
                                        <div
                                            style={{
                                                wordBreak: 'break-all',
                                            }}
                                        >
                                            {rejectReason}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {ImplementStatusConfig.map((item) => (
                                <div
                                    className={styles['common-title']}
                                    key={item.key}
                                >
                                    <CommonTitle title={item.label} />
                                    <div className={styles.groupContainer}>
                                        {getGroupContent(item.key)}
                                    </div>
                                </div>
                            ))}

                            {isConfirmPlan && !isViewPlan && (
                                <div className={styles['confirm-form-wrapper']}>
                                    <div className={styles.splitLine} />
                                    <div>
                                        <Form
                                            form={auditForm}
                                            layout="vertical"
                                            onFinish={handleSaveAudit}
                                        >
                                            <Form.Item
                                                label={__('审核意见')}
                                                required
                                                name="solution_confirm_result"
                                                initialValue="pass"
                                            >
                                                <Radio.Group>
                                                    <Radio value="pass">
                                                        {__('通过')}
                                                    </Radio>
                                                    <Radio value="reject">
                                                        {__('驳回')}
                                                    </Radio>
                                                </Radio.Group>
                                            </Form.Item>
                                            <Form.Item
                                                shouldUpdate={(prev, cur) =>
                                                    prev.solution_confirm_result !==
                                                    cur.solution_confirm_result
                                                }
                                            >
                                                {({ getFieldValue }) => {
                                                    const solutionConfirmResult =
                                                        getFieldValue(
                                                            'solution_confirm_result',
                                                        )
                                                    return (
                                                        <Form.Item
                                                            name="solution_confirm_remark"
                                                            required={
                                                                solutionConfirmResult ===
                                                                'reject'
                                                            }
                                                            rules={
                                                                solutionConfirmResult ===
                                                                'reject'
                                                                    ? [
                                                                          {
                                                                              required:
                                                                                  true,
                                                                              message:
                                                                                  __(
                                                                                      '请输入审核意见',
                                                                                  ),
                                                                          },
                                                                      ]
                                                                    : []
                                                            }
                                                        >
                                                            <Input.TextArea
                                                                maxLength={300}
                                                                style={{
                                                                    resize: 'none',
                                                                    height: 100,
                                                                }}
                                                                showCount
                                                            />
                                                        </Form.Item>
                                                    )
                                                }}
                                            </Form.Item>
                                        </Form>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 底部栏 */}
                        {model === 'implement' && (
                            <div className={styles.footer}>
                                <Space>
                                    <Button
                                        className={styles.btn}
                                        onClick={() => {
                                            onClose?.()
                                        }}
                                    >
                                        {__('取消')}
                                    </Button>
                                    {/* {!isConfirmPlan && (
                                        <Button
                                            className={styles.btn}
                                            onClick={() =>
                                                handlePublish('save')
                                            }
                                        >
                                            {__('暂存')}
                                        </Button>
                                    )} */}
                                    <Button
                                        type="primary"
                                        className={styles.btn}
                                        // loading={saveLoading}
                                        onClick={() => {
                                            handlePublish('submit')
                                        }}
                                    >
                                        {__('提交')}
                                    </Button>
                                </Space>
                            </div>
                        )}
                        {isConfirmPlan && !isViewPlan && (
                            <div className={styles.footer}>
                                <Space>
                                    <Button
                                        className={styles.btn}
                                        onClick={() => {
                                            onClose?.()
                                        }}
                                    >
                                        {__('取消')}
                                    </Button>
                                    <Button
                                        type="primary"
                                        className={styles.btn}
                                        // loading={saveLoading}
                                        onClick={() => {
                                            auditForm.submit()
                                        }}
                                    >
                                        {__('确定')}
                                    </Button>
                                </Space>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Drawer>
    )
}

export default Implement
