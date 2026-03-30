import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Col, Form, Input, Radio, Row, Select, message } from 'antd'
import classnames from 'classnames'
import { clone, omit, pick, trim } from 'lodash'
import moment from 'moment'
import __ from '../locale'
import styles from './styles.module.less'
import {
    ISourceDetail,
    ITargetDetail,
    checkPasteNameByDataSource,
    formatError,
    getCurUserDepartment,
    getDataFormFields,
    getDataPushDetail,
    getDatasheetViewDetails,
    getFormsFromDatasource,
    getPolicyFieldsByFormViewId,
    getRescDirDetail,
    getSandboxSpaceList,
    postDataPush,
    putDataPush,
    getUsersFrontendList,
    IConnectorMapSourceType,
    getConnectorTypeMap,
} from '@/core'
import { GroupHeader, GroupSubHeader, renderLoader } from '../helper'
import {
    DataPushAction,
    TransmitMode,
    ScheduleExecuteStatus,
    dataSourceTypeKey,
} from '../const'
import { ReturnConfirmModal } from '@/ui'
import { FontIcon } from '@/icons'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import DrawerHeader from '../Details/DrawerHeader'
import DataPushAnchor from '../Details/DataPushAnchor'
import {
    formatFieldData,
    NotFoundContent,
    SelectOptionItem,
    TargetTableType,
    targetTableTypeOptions,
} from './helper'
import { sourceInfo, targetInfo } from '../Details/helper'
import DataOriginSelect from './DataOriginSelect'
import SchedulePlanForm from '../SchedulePlanForm'
import DataSourceSelect from './DataSourceSelect'
import FilterRuleEditor from './FilterRuleEditor'
import IncrementalForm from './IncrementalForm'
import PushField from './PushField'
import { cancelRequest, enBeginNameRegNew } from '@/utils'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import ScrollLoadSelect from '@/components/ScrollLoadSelect'

interface ICreateDataPush {
    dataPushId?: string
    operate: string
    onClose: (refresh?: boolean) => void
}

/**
 * 创建数据推送
 */
const CreateDataPush: React.FC<ICreateDataPush> = ({
    dataPushId,
    operate,
    onClose,
}) => {
    const [form] = Form.useForm()
    const [schedulePlanForm] = Form.useForm()
    const [incrementalForm] = Form.useForm()
    const container = useRef(null)
    const filterRuleEditorRef = useRef<any>(null)
    const pushFieldRef = useRef<any>(null)

    const [userInfo] = useCurrentUser()
    const [{ governmentSwitch }] = useGeneralConfig()

    const [loading, setLoading] = useState<boolean>(false)
    const [saveLoading, setSaveLoading] = useState<boolean>(false)
    // 是否有更改
    const [hasChange, setHasChange] = useState<boolean>(false)
    // 详情数据
    const [detailsData, setDetailsData] = useState<any>()
    // 数据视图详情
    const [dataviewDetail, setDataviewDetail] = useState<any>()

    // 责任人列表
    const [userLoading, setUserLoading] = useState<boolean>(false)
    const [users, setUsers] = useState<any>([])
    // 目标表列表
    const [targetTablesLoading, setTargetTablesLoading] =
        useState<boolean>(false)
    const [targetTables, setTargetTables] = useState<any>([])
    // 来源表字段列表
    const [sourceFields, setSourceFields] = useState<any>([])
    // 来源表字段映射
    const [sourceFieldsMapping, setSourceFieldsMapping] = useState<any>([])
    // 目标表字段列表
    const [targetFields, setTargetFields] = useState<any>([])
    // 推送字段
    const [pushFields, setPushFields] = useState<any>([])
    // 启用的脱敏规则
    const [desensitizationRule, setDesensitizationRule] =
        useState<boolean>(true)

    // 选中的来源表
    const [sourceTableItem, setSourceTableItem] = useState<ISourceDetail>()
    // 选中的数据源
    const [dataOriginItem, setDataOriginItem] = useState<ITargetDetail>()
    // 选中的目标表
    const [targetTableItem, setTargetTableItem] = useState<string>()

    useEffect(() => {
        getCurDepartment()
    }, [])

    useEffect(() => {
        if (userInfo && operate === DataPushAction.Create) {
            form.setFieldsValue({
                responsible_person_id: {
                    value: userInfo.ID,
                    label: userInfo.VisionName,
                },
            })
        }
    }, [userInfo, operate])

    useEffect(() => {
        if (operate === DataPushAction.Edit && dataPushId) {
            getDetails()
        }
    }, [operate, dataPushId])

    useMemo(() => {
        setSourceFields(
            sourceFields.map((item) => ({
                ...item,
                selected_flag: pushFields.find(
                    (item2) => item2.source_field_id === item.id,
                )?.selected_flag,
            })),
        )
    }, [pushFields])

    // 获取数据沙箱列表
    const getSandboxSpace = async (params: any) => {
        try {
            const res = await getSandboxSpaceList({
                offset: params.offset || 1,
                limit: params.limit || 1000,
                keyword: params.keyword || '',
            })
            return res?.entries || []
        } catch (error) {
            formatError(error)
            return []
        }
    }

    // 获取详情
    const getDetails = async () => {
        try {
            setLoading(true)
            const res = await getDataPushDetail(dataPushId!)
            setDetailsData(res)

            const {
                source_detail,
                target_detail,
                sync_model_fields,
                increment_timestamp,
                primary_key,
                is_desensitization,
                responsible_person_id,
                responsible_person_name,
                ...other
            } = res

            setDesensitizationRule(is_desensitization === 1)

            // 获取目标表列表
            getTargetTableList({
                ...target_detail,
                source_type: dataSourceTypeKey?.[target_detail?.source_type],
            })
            let editTargetFields: any[] = []
            // 获取目标表字段列表
            if (target_detail?.target_table_exists) {
                editTargetFields = await getTargetTableFieldsList(
                    target_detail?.target_table_name,
                    target_detail?.target_datasource_id,
                )
            }
            // 剔除已选择字段后的目标表字段列表
            const removeTargetFields = editTargetFields.filter(
                (item) =>
                    !sync_model_fields.some(
                        (item2) => item2.technical_name === item.technical_name,
                    ),
            )
            // 获取来源表字段列表
            const { data: editSourceFields, error: sourceError } =
                await getSourceTableFieldList(source_detail)

            // 新建目标表时，获取来源表字段映射
            let editSourceFieldsMapping: any[] = []
            if (!target_detail?.target_table_exists) {
                editSourceFieldsMapping = await getSourceFieldsMapping(
                    editSourceFields,
                    source_detail?.db_type,
                    target_detail?.db_type,
                )
            }

            // 推送字段
            setPushFields(
                editSourceFields.map((item) => {
                    const findPushField = sync_model_fields.find(
                        (item2) =>
                            item2.source_field?.technical_name ===
                            item.technical_name,
                    )
                    if (findPushField) {
                        return {
                            ...findPushField,
                            primary_key: !!findPushField.primary_key,
                            selected_flag: true,
                            source_field_id: item.id,
                            is_nullable: item.is_nullable,
                            precision: item.precision,
                        }
                    }
                    // 新建目标表
                    if (!target_detail?.target_table_exists) {
                        return editSourceFieldsMapping.find(
                            (item2) =>
                                item2.technical_name === item.technical_name,
                        )
                    }
                    // 选择已有目标表
                    const findTargetField: any = removeTargetFields.find(
                        (item2) => item2.technical_name === item.technical_name,
                    )
                    if (findTargetField) {
                        return {
                            ...findTargetField,
                            source_field_id: item.id,
                            business_name: item.business_name,
                        }
                    }
                    return {
                        source_field_id: item.id,
                        business_name: item.business_name,
                    }
                }),
            )

            const baseInfoObj = {
                ...other,
                source_catalog: source_detail?.table_display_name,
                target_datasource_id: target_detail?.target_datasource_id,
                target_table: target_detail?.target_table_exists ? 1 : 0,
                target_table_name: target_detail?.target_table_name,
                target_table_select: target_detail?.target_table_name,
                responsible_person_id: {
                    value: responsible_person_id,
                    label: responsible_person_name,
                },
                target_sandbox_id: target_detail?.sandbox_project_name
                    ? {
                          value: target_detail?.sandbox_id,
                          label: target_detail?.sandbox_project_name,
                      }
                    : undefined,
                project_space:
                    target_detail?.sandbox_datasource_name || undefined,
            }

            // 基本信息
            form.setFields(
                Object.keys(baseInfoObj).map((key) => {
                    if (key === 'source_catalog' && sourceError) {
                        return {
                            name: key,
                            value: undefined,
                            errors: [sourceError],
                        }
                    }
                    return {
                        name: key,
                        value: baseInfoObj[key],
                        errors: [],
                    }
                }),
            )

            // 推送机制
            const incrementalData = pick(res, [
                'transmit_mode',
                'increment_field',
            ])
            incrementalForm.setFieldsValue({
                ...incrementalData,
                increment_field: incrementalData.increment_field || undefined,
                primary_key: primary_key ? primary_key.split(',') : undefined,
                increment_timestamp: increment_timestamp
                    ? moment(increment_timestamp * 1000)
                    : undefined,
            })

            // 调度计划
            const { schedule_start, schedule_end, schedule_time } = res
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
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    // 检查表单数据
    const checkForm = async () => {
        const [validate, incrementalValidate, schedulePlanValidate] =
            await Promise.allSettled([
                form.validateFields(),
                incrementalForm.validateFields(),
                schedulePlanForm.validateFields(),
            ])
        pushFieldRef.current.validate()
        if (validate.status === 'rejected') {
            form.scrollToField(validate?.reason?.errorFields[0]?.name)
            return false
        }
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

    // 提交
    const handleSave = async (type: 'save' | 'submit') => {
        if (loading) {
            return
        }
        try {
            setSaveLoading(true)
            const check = await checkForm()
            if (!check) {
                return
            }
            const values = form.getFieldsValue()
            const incrementalValues = incrementalForm.getFieldsValue()
            const schedulePlanValues = schedulePlanForm.getFieldsValue()

            let params: any = {
                push_status: type === 'save' ? 1 : 2,
                channel: 1,
            }
            // 基本信息
            const {
                target_table,
                target_table_name,
                target_table_select,
                source_catalog,
                responsible_person_id,
                target_sandbox_id,
                ...other1
            } = values
            params = {
                ...params,
                ...other1,
                is_desensitization: desensitizationRule ? 1 : 0,
                target_table_exists: target_table === TargetTableType.Select,
                target_table_name:
                    target_table === TargetTableType.Select
                        ? target_table_select
                        : target_table_name,
                source_catalog_id: sourceTableItem?.catalog_id,
                responsible_person_id:
                    typeof responsible_person_id === 'string'
                        ? responsible_person_id
                        : responsible_person_id.value,
            }
            if (target_sandbox_id) {
                params.target_sandbox_id =
                    typeof target_sandbox_id === 'string'
                        ? target_sandbox_id
                        : target_sandbox_id.value
            }
            // 推送机制
            const { increment_timestamp, transmit_mode, primary_key } =
                incrementalValues
            params = {
                ...params,
                ...incrementalValues,
                primary_key: primary_key ? primary_key.join(',') : undefined,
                increment_timestamp: increment_timestamp
                    ? moment(increment_timestamp).unix()
                    : transmit_mode === TransmitMode.Incremental &&
                      type === 'submit'
                    ? moment().unix()
                    : undefined,
            }
            // 调度计划
            const {
                schedule_time,
                plan_date,
                schedule_execute_status,
                ...other3
            } = schedulePlanValues
            params = {
                ...params,
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
            }
            // 推送字段
            params.sync_model_fields = pushFields
                .filter((item) => item.selected_flag)
                .map((item) => {
                    const realItem = omit(item, [
                        'selected_flag',
                        'errorTips',
                        'original_data_type',
                        'id',
                        'source_field_id',
                        'desensitization_rule_name',
                        'source_field',
                    ])
                    return {
                        ...realItem,
                        desensitization_rule_id: item.desensitization_rule_name
                            ? item.desensitization_rule_id
                            : '',
                        source_tech_name: sourceFields.find(
                            (item2) => item2.id === item.source_field_id,
                        )?.technical_name,
                    }
                })

            if (operate === DataPushAction.Edit) {
                params.id = dataPushId
                await putDataPush(params)
            } else {
                await postDataPush(params)
            }
            message.success(type === 'save' ? __('保存成功') : __('提交成功'))
            onClose(true)
        } catch (err) {
            formatError(err)
        } finally {
            setSaveLoading(false)
        }
    }

    // 获取责任人列表
    const getUserList = async (params: any) => {
        try {
            setUserLoading(true)
            const res = await getUsersFrontendList({
                offset: params.offset || 1,
                limit: params.limit || 20,
                keyword: params.keyword || '',
            })
            setUserLoading(false)
            return (
                res?.entries?.filter((item) => item.login_name !== 'admin') ||
                []
            )
        } catch (err) {
            setUserLoading(false)
            return []
        }
    }

    // 获取当前部门
    const getCurDepartment = async () => {
        try {
            const res = await getCurUserDepartment()
            // 当前树能根据id匹配到部门，根据id显示部门，不能匹配到，显示部门名称
            if (res?.length === 1) {
                const [dept] = res
                form.setFieldsValue({ user_org_code: dept.id })
            }
        } catch (error) {
            formatError(error)
        }
    }

    // 获取来源表对应目录详情
    const getCatalogDetail = async (
        sourceTable: ISourceDetail,
        reset: boolean = false,
    ) => {
        if (!governmentSwitch.on) {
            return
        }
        try {
            const res = await getRescDirDetail(sourceTable?.catalog_id || '')
            if (reset) {
                // 设置推送机制默认值
                if (res?.sync_mechanism) {
                    incrementalForm.setFields([
                        {
                            name: 'transmit_mode',
                            value: res?.sync_mechanism,
                            errors: [],
                        },
                    ])
                }
                // TODO 上报  字段、时间
            }
        } catch (error) {
            formatError(error)
        }
    }

    // 重置推送字段
    const resetPushFields = (
        source: any[],
        target: any[],
        mapping: any[] = [],
    ) => {
        const target_table = form.getFieldValue('target_table')
        if (source.length === 0) {
            setPushFields([])
            return
        }
        // 新建目标表
        if (target_table === TargetTableType.Create) {
            if (mapping.length === 0) {
                setPushFields(
                    clone(source).map((item) => {
                        return {
                            ...omit(item, [
                                'data_type',
                                'data_length',
                                'precision',
                            ]),
                            source_field_id: item.id,
                            selected_flag: true,
                        }
                    }),
                )
                return
            }

            setPushFields(
                clone(mapping).map((item) => {
                    return {
                        ...item,
                        source_field_id: item.id,
                        selected_flag: true,
                    }
                }),
            )
            return
        }
        // 选择已有目标表
        setPushFields(
            clone(source).map((item) => {
                const findTargetField: any = target.find(
                    (item2) => item2.technical_name === item.technical_name,
                )
                if (findTargetField) {
                    return {
                        ...findTargetField,
                        source_field_id: item.id,
                        business_name: item.business_name,
                        desensitization_rule_id: item?.desensitization_rule_id,
                        desensitization_rule_name:
                            item?.desensitization_rule_name,
                        selected_flag: true,
                    }
                }
                return {
                    source_field_id: item.id,
                    business_name: item.business_name,
                    desensitization_rule_id: item?.desensitization_rule_id,
                    desensitization_rule_name: item?.desensitization_rule_name,
                }
            }),
        )
    }

    // 获取来源库表字段列表
    const getSourceTableFieldList = async (
        sourceTable: ISourceDetail,
        reset: boolean = false,
    ): Promise<{ data: any[]; error: any }> => {
        try {
            cancelRequest(
                `/api/data-view/v1/form-view/${sourceTableItem?.table_id}`,
                'get',
            )
            cancelRequest(
                `/api/data-catalog/v1/data-catalog/${sourceTableItem?.catalog_id}`,
                'get',
            )
            setSourceTableItem(sourceTable)
            if (!sourceTable) {
                return { data: [], error: '' }
            }
            const dataviewRes = await getDatasheetViewDetails(
                sourceTable?.table_id || '',
            )
            setDataviewDetail(dataviewRes)
            const [{ value: res1 }, { value: res2 }]: any =
                await Promise.allSettled([
                    getDataFormFields(
                        dataviewRes?.technical_name,
                        dataviewRes?.datasource_id,
                    ),
                    getPolicyFieldsByFormViewId(sourceTable?.table_id || ''),
                ])
            const keys = [
                'id',
                'business_name',
                'technical_name',
                'primary_key',
                'is_nullable',
            ]
            const ruleFields = res2?.field_list || []
            if (ruleFields.length > 0) {
                setDesensitizationRule(true)
            }
            const fields =
                res1
                    ?.filter((item) =>
                        dataviewRes.fields.find(
                            (item2) => item2.technical_name === item.name,
                        ),
                    )
                    ?.map((item) => {
                        const findTableField: any = dataviewRes.fields.find(
                            (item2) => item2.technical_name === item.name,
                        )
                        const findRuleField: any = ruleFields.find(
                            (item2) =>
                                item2.form_view_field_id === findTableField.id,
                        )
                        const { data_type } = formatFieldData(item)
                        return {
                            ...pick(findTableField, keys),
                            data_type,
                            data_length:
                                findTableField?.data_length ||
                                findTableField?.data_length === 0
                                    ? findTableField?.data_length
                                    : undefined,
                            precision:
                                (findTableField?.data_accuracy ||
                                    findTableField?.data_accuracy === 0) &&
                                findTableField?.data_accuracy !== -1
                                    ? findTableField?.data_accuracy
                                    : undefined,
                            desensitization_rule_id:
                                findRuleField?.desensitization_rule_id,
                            desensitization_rule_name:
                                findRuleField?.desensitization_rule_name,
                            comment: item?.description,
                        }
                    }) || []
            setSourceFields(fields)

            if (reset) {
                await getSourceFieldsMapping(
                    fields,
                    dataviewRes?.datasource_type,
                    dataOriginItem?.db_type,
                    reset,
                )

                // 设置增量主键
                incrementalForm.setFields([
                    {
                        name: 'primary_key',
                        value: fields
                            .filter((item) => item.primary_key)
                            .map((item) => item.technical_name),
                        errors: [],
                    },
                ])
            }
            return { data: fields, error: '' }
        } catch (error) {
            formatError(error)
            return { data: [], error: error?.data?.message }
        }
    }

    // 获取目标表列表
    const getTargetTableList = async (
        dataOrigin: ITargetDetail,
        reset: boolean = false,
    ) => {
        // 清空目标表及字段
        if (reset) {
            form.setFields([
                { name: 'target_table_select', value: undefined, errors: [] },
            ])
            setTargetFields([])
            resetPushFields(sourceFields, [])
        }

        try {
            cancelRequest(
                `/api/business-grooming/v1/business-model/forms/data-tables?datasource_id=${dataOriginItem?.target_datasource_id}`,
                'get',
            )
            setTargetTablesLoading(true)
            setDataOriginItem(dataOrigin)
            const res = await getFormsFromDatasource(
                dataOrigin.target_datasource_id,
            )
            setTargetTables(res || [])
        } catch (error) {
            formatError(error)
        } finally {
            setTargetTablesLoading(false)
        }
    }

    // 获取目标表字段列表
    const getTargetTableFieldsList = async (
        tableName: string,
        sourceId: string,
        reset: boolean = false,
    ): Promise<any[]> => {
        try {
            cancelRequest(
                `/api/business-grooming/v1/business-model/forms/data-tables/${targetTableItem}?datasource_id=${sourceId}`,
                'get',
            )
            setTargetTableItem(tableName)
            const res = await getDataFormFields(tableName, sourceId)
            const columns =
                res?.map((item) => ({
                    ...formatFieldData(item),
                    comment: item.description,
                    technical_name: item.name,
                })) || []
            setTargetFields(columns)
            if (reset) {
                resetPushFields(sourceFields, columns)
            }
            return columns
        } catch (error) {
            formatError(error)
            return []
        }
    }

    // 来源表数据源类型映射
    const getSourceFieldsMapping = async (
        sourceTableFields: any[],
        sourceConnectorName?: string,
        targetConnectorName?: string,
        reset: boolean = false,
    ): Promise<any[]> => {
        if (
            !sourceTableFields?.length ||
            !sourceConnectorName ||
            !targetConnectorName
        ) {
            if (reset) {
                resetPushFields(sourceTableFields, targetFields)
            }
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
            const targetData = sourceTableFields.map((currentField, index) => ({
                ...currentField,
                data_length:
                    newMapData[index]?.precision || currentField.data_length,
                precision:
                    newMapData[index]?.decimalDigits || currentField.precision,
                data_type: newMapData[index].targetTypeName || 'undefined',
                // unmapped: !newMapData[index].targetTypeName,
            }))
            setSourceFieldsMapping(targetData)
            // 清空目标表及字段
            if (reset) {
                resetPushFields(sourceTableFields, targetFields, targetData)
            }
            return targetData
        } catch (error) {
            formatError(error)
            return []
        }
    }
    // 检查申请名称是否重复
    const checkNameRepeat = async (value: string) => {
        try {
            if (value?.trim()) {
                // const res = await getSharedDeclarationRepeat(value)
                // if (res) {
                //     return Promise.reject(
                //         new Error(__('该数据推送名称已存在，请重新输入')),
                //     )
                // }
            }
            return Promise.resolve()
        } catch (ex) {
            formatError(ex)
            return Promise.resolve()
        }
    }

    // 检查目标表名称是否重复
    const checkTableNameRepeat = async (value: string) => {
        try {
            if (value?.trim() && dataOriginItem?.target_datasource_id) {
                const res = await checkPasteNameByDataSource({
                    name: value,
                    datasource_id: dataOriginItem.target_datasource_id,
                })
                if (res.repeat) {
                    return Promise.reject(
                        new Error(__('该目标表名称已存在，请重新输入')),
                    )
                }
            }
            return Promise.resolve()
        } catch (ex) {
            return Promise.reject(new Error(ex.data.description))
        }
    }

    // 详细信息
    const renderDetailInfo = (detailInfo: any, config: any) => {
        return (
            <div className={styles.detailInfo}>
                {config.map((item, idx) => (
                    <div key={idx} className={styles.detailInfoItem}>
                        <span>
                            {item.label}
                            {__('：')}
                        </span>
                        <span
                            title={detailInfo[item.key]}
                            className={styles.detailInfoValue}
                        >
                            {detailInfo[item.key] || '--'}
                        </span>
                    </div>
                ))}
            </div>
        )
    }

    // 基本信息
    const getBaseInfo = () => (
        <>
            <GroupHeader text={__('基本信息')} id="basicInfo" />
            <div className={styles.groupContent}>
                <Row gutter={40}>
                    <Col span={12}>
                        <Form.Item
                            name="name"
                            label={__('名称')}
                            required
                            rules={[
                                {
                                    required: true,
                                    message: __('输入不能为空'),
                                },
                                {
                                    validateTrigger: 'onBlur',
                                    validator: (e, value) =>
                                        checkNameRepeat(value),
                                },
                            ]}
                        >
                            <Input
                                placeholder={__('请输入名称')}
                                maxLength={128}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="responsible_person_id"
                            label={__('责任人')}
                            required
                            rules={[
                                {
                                    required: true,
                                    message: __('输入不能为空'),
                                },
                            ]}
                        >
                            <ScrollLoadSelect
                                placeholder={__('请选择责任人')}
                                fetchOptions={getUserList}
                                fieldValueKey="id"
                                fieldNameKey="name"
                                limit={20}
                                disableDetailFetch
                                getPopupContainer={(n) => n.parentNode}
                            />
                        </Form.Item>
                    </Col>
                </Row>
                <Form.Item name="description" label={__('描述')}>
                    <Input.TextArea
                        placeholder={__('请输入描述')}
                        autoSize={{
                            minRows: 3,
                            maxRows: 5,
                        }}
                        showCount
                        maxLength={300}
                    />
                </Form.Item>
            </div>
        </>
    )

    const handleProjectChange = (value: any, option: any) => {
        form.setFieldsValue({
            project_space: option?.optionData?.datasource_name || undefined,
        })
    }

    // 推送内容
    const getPushContent = () => (
        <>
            <GroupHeader text={__('推送内容')} id="pushContent" />
            <div className={styles.groupContent}>
                <GroupSubHeader text={__('源端信息')} id="sourceInfo" />
                <div className={styles.groupSubContent}>
                    <Row gutter={40}>
                        <Col span={12}>
                            <Form.Item
                                name="source_catalog"
                                label={__('源端资源')}
                                required
                                rules={[
                                    {
                                        required: true,
                                        message: __('请选择源端资源'),
                                    },
                                ]}
                            >
                                <DataSourceSelect
                                    selectedItem={sourceTableItem}
                                    onChange={(value, item: ISourceDetail) => {
                                        if (item?.table_id) {
                                            getSourceTableFieldList(item, true)
                                        }
                                    }}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    {sourceTableItem &&
                        renderDetailInfo(sourceTableItem, sourceInfo.slice(1))}
                </div>
                <GroupSubHeader text={__('目标端信息')} id="targetInfo" />
                <div className={styles.groupSubContent}>
                    <Row gutter={40}>
                        <Col span={12}>
                            <Form.Item
                                name="target_datasource_id"
                                label={__('数据源')}
                                required
                                rules={[
                                    {
                                        required: true,
                                        message: __('请选择数据源'),
                                    },
                                ]}
                            >
                                <DataOriginSelect
                                    selectedItem={dataOriginItem}
                                    onChange={(value, option: any) => {
                                        if (option?.target_datasource_id) {
                                            getTargetTableList(
                                                omit(
                                                    option,
                                                    'label',
                                                ) as ITargetDetail,
                                                true,
                                            )
                                            getSourceFieldsMapping(
                                                sourceFields,
                                                dataviewDetail?.datasource_type,
                                                option.db_type,
                                                true,
                                            )
                                        }
                                    }}
                                    onInitError={(error) => {
                                        form.setFields([
                                            {
                                                name: 'target_datasource_id',
                                                value: undefined,
                                                errors: [error],
                                            },
                                        ])
                                    }}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    {dataOriginItem &&
                        renderDetailInfo(
                            dataOriginItem,
                            targetInfo.slice(1, 3),
                        )}
                    {dataOriginItem?.source_type !== 'sandbox' && (
                        <Row gutter={40}>
                            <Col span={12}>
                                <Form.Item
                                    name="target_table"
                                    label={__('目标表')}
                                >
                                    <Radio.Group
                                        onChange={(e) => {
                                            resetPushFields(
                                                sourceFields,
                                                targetFields,
                                                sourceFieldsMapping,
                                            )
                                        }}
                                    >
                                        {targetTableTypeOptions.map((item) => (
                                            <Radio
                                                value={item.value}
                                                key={item.value}
                                            >
                                                {item.label}
                                            </Radio>
                                        ))}
                                    </Radio.Group>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    noStyle
                                    shouldUpdate={(prev, cur) =>
                                        prev.target_table !== cur.target_table
                                    }
                                >
                                    {({ getFieldValue }) => {
                                        const targetTable =
                                            getFieldValue('target_table')
                                        return targetTable ===
                                            TargetTableType.Create ? (
                                            <Form.Item
                                                name="target_table_name"
                                                label={__('目标表名称')}
                                                required
                                                validateTrigger={[
                                                    'onChange',
                                                    'onBlur',
                                                ]}
                                                rules={[
                                                    {
                                                        required: true,
                                                        transform: (value) =>
                                                            trim(value),
                                                        message:
                                                            __('输入不能为空'),
                                                    },
                                                    {
                                                        pattern:
                                                            enBeginNameRegNew,
                                                        message: __(
                                                            '仅支持英文、数字、下划线，且必须以字母开头',
                                                        ),
                                                        transform: (value) =>
                                                            trim(value),
                                                    },
                                                    {
                                                        validateTrigger:
                                                            'onBlur',
                                                        validator: (e, value) =>
                                                            checkTableNameRepeat(
                                                                value,
                                                            ),
                                                    },
                                                ]}
                                            >
                                                <Input
                                                    placeholder={__(
                                                        '请输入目标表名称',
                                                    )}
                                                    maxLength={255}
                                                />
                                            </Form.Item>
                                        ) : (
                                            <Form.Item
                                                name="target_table_select"
                                                label={__('选择目标表')}
                                                required
                                                rules={[
                                                    {
                                                        required: true,
                                                        message:
                                                            __('请选择目标表'),
                                                    },
                                                ]}
                                            >
                                                <Select
                                                    loading={
                                                        targetTablesLoading
                                                    }
                                                    showSearch
                                                    options={targetTables.map(
                                                        (item) => ({
                                                            value: item,
                                                            label: (
                                                                <SelectOptionItem
                                                                    name={item}
                                                                    icon={
                                                                        <FontIcon name="icon-shujubiao" />
                                                                    }
                                                                />
                                                            ),
                                                        }),
                                                    )}
                                                    onChange={(
                                                        value,
                                                        option: any,
                                                    ) => {
                                                        if (value) {
                                                            getTargetTableFieldsList(
                                                                value,
                                                                dataOriginItem?.target_datasource_id ||
                                                                    '',
                                                                true,
                                                            )
                                                        }
                                                    }}
                                                    placeholder={__(
                                                        '请选择目标表',
                                                    )}
                                                    notFoundContent={
                                                        !dataOriginItem ? (
                                                            <NotFoundContent
                                                                text={__(
                                                                    '请先选择数据源',
                                                                )}
                                                            />
                                                        ) : targetTablesLoading ? (
                                                            ''
                                                        ) : targetTables.length ===
                                                          0 ? (
                                                            <NotFoundContent />
                                                        ) : (
                                                            <NotFoundContent
                                                                text={__(
                                                                    '抱歉，没有找到相关内容',
                                                                )}
                                                            />
                                                        )
                                                    }
                                                    getPopupContainer={(n) =>
                                                        n.parentNode
                                                    }
                                                />
                                            </Form.Item>
                                        )
                                    }}
                                </Form.Item>
                            </Col>
                        </Row>
                    )}
                    {dataOriginItem?.source_type === 'sandbox' && (
                        <Row gutter={40}>
                            <Col span={12}>
                                <Form.Item
                                    label={__('选择项目名称')}
                                    name="target_sandbox_id"
                                    validateTrigger="onBlur"
                                    rules={[
                                        {
                                            required: true,
                                            message: __('请选择项目名称'),
                                        },
                                    ]}
                                >
                                    <ScrollLoadSelect
                                        placeholder={__('请选择项目名称')}
                                        fetchOptions={getSandboxSpace}
                                        fieldValueKey="sandbox_id"
                                        fieldNameKey="project_name"
                                        limit={1000}
                                        disableDetailFetch
                                        loading={userLoading}
                                        onChange={handleProjectChange}
                                        getPopupContainer={(n) => n.parentNode}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label={__('项目空间')}
                                    name="project_space"
                                    validateTrigger="onBlur"
                                >
                                    <Select
                                        placeholder={__('请选择')}
                                        disabled
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label={__('数据集名称')}
                                    name="target_table_name"
                                    validateTrigger="onBlur"
                                    rules={[
                                        {
                                            required: true,
                                            message: __('请输入目标表名称'),
                                        },
                                        {
                                            pattern: enBeginNameRegNew,
                                            message: __(
                                                '仅支持英文、数字、下划线，且必须以字母开头',
                                            ),
                                            transform: (value) => trim(value),
                                        },
                                    ]}
                                >
                                    <Input
                                        placeholder={__('请输入目标表名称')}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                    )}
                </div>
                <div>
                    <GroupSubHeader
                        text={__('推送字段')}
                        id="pushField"
                        style={{ position: 'sticky', top: 0, zIndex: 1 }}
                    />
                    <div
                        className={styles.groupSubContent}
                        style={{ marginBottom: 32 }}
                    >
                        <PushField
                            ref={pushFieldRef}
                            sourceFields={sourceFields}
                            targetFields={targetFields}
                            pushFields={pushFields}
                            setPushFields={setPushFields}
                            desensitizationRule={desensitizationRule}
                            setDesensitizationRule={setDesensitizationRule}
                            ignoreRule={false}
                            sticky
                            isCreate={
                                form.getFieldValue('target_table') ===
                                TargetTableType.Create
                            }
                        />
                    </div>
                </div>
                <div>
                    <GroupSubHeader
                        text={__('过滤规则')}
                        id="filterCondition"
                    />
                    <div className={styles.groupSubContent}>
                        <Form.Item
                            noStyle
                            name="filter_condition"
                            validateTrigger="onBlur"
                            rules={[
                                {
                                    validator: (_, value) =>
                                        filterRuleEditorRef.current?.validate(),
                                },
                            ]}
                        >
                            <FilterRuleEditor
                                dataViewId={sourceTableItem?.table_id}
                                fieldList={sourceFields?.filter(
                                    (item) => item.selected_flag,
                                )}
                                ref={filterRuleEditorRef}
                            />
                        </Form.Item>
                    </div>
                </div>
            </div>
        </>
    )

    // 推送策略
    const getPushStrategy = () => (
        <div className={styles.pushStrategy}>
            <div className={styles.pushStrategyContent}>
                <GroupHeader text={__('推送策略')} id="pushStrategy" />
                <div className={styles.groupContent}>
                    <GroupSubHeader text={__('推送机制')} id="pushMechanism" />
                    <div
                        className={classnames(
                            styles.groupSubContent,
                            styles.grayBg,
                        )}
                    >
                        <IncrementalForm
                            form={incrementalForm}
                            fieldList={sourceFields}
                            style={{ padding: '20px 20px 0' }}
                        />
                    </div>
                    <GroupSubHeader
                        text={__('调度计划')}
                        id="schedulePlan"
                        style={{
                            marginTop: '32px',
                        }}
                    />
                    <div
                        className={classnames(
                            styles.groupSubContent,
                            styles.grayBg,
                        )}
                    >
                        <SchedulePlanForm
                            form={schedulePlanForm}
                            style={{ padding: '20px 20px 0' }}
                        />
                    </div>
                </div>
            </div>
        </div>
    )

    return (
        <div className={classnames(styles.createDataPush)}>
            {/* 导航头部 */}
            <DrawerHeader
                title={
                    operate === DataPushAction.Create
                        ? __('新建数据推送')
                        : __('编辑数据推送')
                }
                onClose={() => {
                    if (hasChange) {
                        ReturnConfirmModal({
                            onCancel: () => {
                                onClose()
                            },
                        })
                    } else {
                        onClose()
                    }
                }}
            />

            <div className={styles.bottom}>
                <div className={styles.content}>
                    <div className={styles.form_content}>
                        {/* 表单内容 */}
                        {loading ? (
                            renderLoader()
                        ) : (
                            <div
                                className={styles.dataPushForm}
                                ref={container}
                            >
                                <Form.Provider
                                    onFormChange={(
                                        formName,
                                        { changedFields, forms },
                                    ) => {
                                        setHasChange(true)
                                    }}
                                >
                                    <Form
                                        form={form}
                                        name="dataPushForm"
                                        layout="vertical"
                                        autoComplete="off"
                                        scrollToFirstError
                                        className={styles.form}
                                        initialValues={{
                                            target_table:
                                                TargetTableType.Create,
                                        }}
                                    >
                                        {getBaseInfo()}
                                        {getPushContent()}
                                    </Form>
                                    {getPushStrategy()}
                                </Form.Provider>
                            </div>
                        )}
                        {/* 锚点 */}
                        <DataPushAnchor container={container} />
                    </div>

                    {/* 底部按钮 */}
                    <div className={styles.footer}>
                        <Button
                            className={styles.btn}
                            onClick={() => {
                                onClose()
                            }}
                        >
                            {__('取消')}
                        </Button>
                        <Button
                            className={styles.btn}
                            disabled={saveLoading}
                            onClick={() => {
                                handleSave('save')
                            }}
                        >
                            {__('暂存')}
                        </Button>
                        <Button
                            type="primary"
                            className={styles.btn}
                            disabled={saveLoading}
                            onClick={() => handleSave('submit')}
                        >
                            {__('提交')}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
export default CreateDataPush
