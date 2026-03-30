import React, { useEffect, useMemo, useState, useRef } from 'react'
import { Form, Modal, Radio, Input, Switch, message, Tooltip } from 'antd'
import classnames from 'classnames'
import styles from './styles.module.less'
import __ from '../locale'
import {
    ExplorationPeculiarity,
    explorationPeculiarityList,
    ExplorationRuleTabs,
    InternalRuleType,
    RuleExpression,
    RuleRadioListMap,
    internalRuleTypeMap,
    templateRuleRadioListMap,
    DataTypeRuleMap,
    ExplorationRule,
    getRuleActionMap,
    InternalRuleTemplateMap,
    InternalRuleTemplateTypeToIdMap,
    isCustomRule,
    dimensionTypeMap,
} from '../const'
import { useDataViewContext } from '../../DataViewProvider'
import InternalRule from './InternalRule'
import { formatError, getInternalRuleList } from '@/core'
import { ErrorInfo, nameReg } from '@/utils'
import {
    BadgeRadio,
    ErrorTips,
    changeTypeToLargeArea,
    handleRunSqlParam,
} from '../helper'
import RuleFieldConfig from '../RuleFieldConfig'
import SqlConfig from './SqlConfig'
import DataStatistics from './DataStatistics'

interface IRulesModal {
    open: boolean
    onClose: (flag?: any) => void
    ruleType: ExplorationPeculiarity
    // 编辑规则id
    ruleId?: string
    // 全部属性时规则选项
    ruleList?: any
    title?: any
}

const RulesModal: React.FC<IRulesModal> = ({
    open,
    onClose,
    ruleType,
    ruleList,
    ruleId,
    title,
}) => {
    const [form] = Form.useForm()
    const [loading, setLoading] = useState<boolean>(false)
    const ruleFieldRef = useRef<any>(null)
    const filterRuleFieldRef = useRef<any>(null)
    const [ruleExpression, setRuleExpression] = useState<RuleExpression>(
        RuleExpression.Field,
    )
    const [filterConditionRuleExpression, setFilterConditionRuleExpression] =
        useState<RuleExpression>()
    const [sqlScript, setSqlScript] = useState<string>('')
    const [filterSqlScript, setFilterSqlScript] = useState<string>('')
    const [disabledRadio, setDisabledRadio] = useState<boolean>(true)
    const { isTemplateConfig, explorationData, setExplorationData } =
        useDataViewContext()

    const [ruleRadioList, setRuleRadioList] = useState<any[]>([])
    const [dimension, setDimension] = useState<any>()
    const [isCustom, setIsCustom] = useState<boolean>(false)
    const [currentTemplateId, setCurrentTemplateId] = useState<string>('')
    const [currentInternalRule, setCurrentInternalRule] = useState<any>()
    const [dataStatisticsIds, setDataStatisticsIds] = useState<string[]>([])
    const [ruleDetails, setRuleDetails] = useState<any>()
    const [ruleConfig, setRuleConfig] = useState<any>()
    const [customRuleConfig, setCustomRuleConfig] = useState<any>()
    const [customFilterRuleConfig, setCustomFilterRuleConfig] = useState<any>()
    const [filterConditionChecked, setFilterConditionChecked] =
        useState<boolean>(false)
    const [validateError, setValidateError] = useState<boolean>(false)
    const [createdRuleTempIds, setCreatedRuleTempIds] = useState<string[]>([])
    const [changeRuleData, setChangeRuleData] = useState<any>({})

    const explorationRule = useMemo(() => {
        return explorationData?.explorationRule
    }, [explorationData?.explorationRule])

    const hasFilterCondition = useMemo(() => {
        return (
            explorationRule !== ExplorationRule.Field &&
            isCustom &&
            !isTemplateConfig
        )
    }, [explorationRule, isCustom])

    const isEdit = useMemo(() => {
        return !!ruleId
    }, [ruleId])

    const cssjj = useMemo(() => {
        return explorationData?.cssjj
    }, [explorationData])

    const operateType = useMemo(() => {
        return isTemplateConfig
            ? 'isTemplateConfig'
            : cssjj
            ? 'cssjj'
            : 'default'
    }, [isTemplateConfig, cssjj])

    const defaultAndInternalRule = useMemo(() => {
        const selectedTemplateId =
            currentTemplateId ||
            currentInternalRule?.template_id ||
            ruleDetails?.template_id
        return (
            !isTemplateConfig &&
            !!selectedTemplateId &&
            selectedTemplateId !== InternalRuleType.Custom
        )
    }, [isTemplateConfig, currentTemplateId, currentInternalRule, ruleDetails])

    const noRuleConfig = useMemo(() => {
        return (
            (dimension === ExplorationPeculiarity.Uniqueness &&
                explorationRule === ExplorationRule.Field &&
                !isEdit) ||
            (isTemplateConfig &&
                (currentTemplateId === InternalRuleType.RowRepeat ||
                    ruleDetails?.dimension_type === 'row_repeat')) ||
            !currentTemplateId
        )
    }, [
        dimension,
        explorationRule,
        isEdit,
        isTemplateConfig,
        currentTemplateId,
        ruleDetails,
    ])

    const modalTitle = useMemo(() => {
        if (ruleType !== ExplorationPeculiarity.All) {
            setDimension(ruleType)
        }

        const tabsText = ExplorationRuleTabs.find(
            (item) => item.key === explorationRule,
        )?.label
        return `${tabsText}${__('规则')}`
        // const typeText = explorationPeculiarityList.find(
        //     (item) => item.key === ruleType,
        // )?.label
        // return ruleType === ExplorationPeculiarity.All
        //     ? tabsText
        //     : `${tabsText}_${typeText}`
    }, [ruleType, explorationData.explorationRule])

    useEffect(() => {
        const type =
            (isEdit && (isTemplateConfig || !ruleDetails?.template_id)
                ? dimensionTypeMap[ruleDetails?.dimension_type]
                : internalRuleTypeMap[currentTemplateId]) ||
            ruleDetails?.dimension_type
        if (type && isEdit) {
            form.setFieldValue(
                'template_id',
                InternalRuleTemplateTypeToIdMap[type],
            )
        }
    }, [isEdit, isTemplateConfig, ruleDetails])

    useEffect(() => {
        if (
            explorationRule === ExplorationRule.Field ||
            operateType === 'default'
        ) {
            getAllRuleList()
        }
    }, [explorationRule])

    useEffect(() => {
        if (isTemplateConfig) {
            getRuleList()
        }
    }, [])

    useEffect(() => {
        if (dimension) {
            form.setFieldValue('dimension', dimension)
        }
    }, [dimension])

    useEffect(() => {
        if (ruleId) {
            getDetails()
        }
    }, [ruleId])

    useEffect(() => {
        if (currentTemplateId) {
            let flag: boolean
            const cur = explorationData?.internalRuleList?.find(
                (rule) => rule.template_id === currentTemplateId,
            )
            if (isEdit) {
                flag =
                    ruleConfig?.rule_expression?.where ||
                    !!ruleConfig?.rule_expression?.sql
            } else {
                flag = currentTemplateId === InternalRuleType.Custom
                setCurrentInternalRule(cur)
            }
            setIsCustom(flag)
            let rule_description = ''
            if (isTemplateConfig) {
                rule_description = isEdit
                    ? ruleDetails?.rule_description
                    : undefined
            } else if (cssjj) {
                rule_description = !flag
                    ? dimension === ExplorationPeculiarity.Timeliness && !isEdit
                        ? undefined
                        : cur?.rule_description || ruleDetails?.rule_description
                    : changeRuleData?.[currentTemplateId]?.rule_description
            } else {
                rule_description = isEdit
                    ? ruleDetails?.rule_description
                    : cur?.rule_description
            }
            form.setFieldValue('rule_description', rule_description)
            form.setFieldValue('template_id', currentTemplateId)
            if (!isTemplateConfig && !!cur) {
                form.setFieldValue('rule_name', cur?.rule_name)
            }
            if (
                currentTemplateId === InternalRuleType.Custom &&
                operateType !== 'default'
            ) {
                form.setFieldValue('rule_name', undefined)
            }
        } else {
            setCurrentInternalRule({})
            setIsCustom(false)
        }
    }, [currentTemplateId, ruleConfig])

    useEffect(() => {
        if (explorationData?.internalRuleList && dimension) {
            if (isTemplateConfig && isEdit) return
            const internalRuleList = explorationData?.internalRuleList
            const custom = {
                label: __('自定义规则'),
                value: InternalRuleType.Custom,
            }
            const fieldType = changeTypeToLargeArea(
                explorationData?.activeField?.data_type,
            )
            // 字段级需要根据探查维度、已选字段类型过滤内置规则
            const list =
                (isTemplateConfig
                    ? templateRuleRadioListMap
                    : RuleRadioListMap)?.[`${explorationRule}-${dimension}`]
                    ?.filter((item) =>
                        explorationRule === ExplorationRule.Field &&
                        !isTemplateConfig
                            ? DataTypeRuleMap?.[fieldType]?.includes(item)
                            : true,
                    )
                    ?.map((item) => {
                        const cur = internalRuleList.find(
                            (rule) => rule.template_id === item,
                        )
                        return {
                            label: cur?.rule_name,
                            value: cur?.template_id,
                        }
                    }) || []
            if (
                !list?.length &&
                dimension !== ExplorationPeculiarity.Timeliness
            ) {
                setIsCustom(true)
            }
            setRuleRadioList([...list, custom])
            if (dimension === ExplorationPeculiarity.Timeliness) {
                setCurrentTemplateId(InternalRuleType.timeliness)
            }
        }
    }, [explorationData, dimension])

    useEffect(() => {
        if (ruleList?.length && !dimension) {
            setDimension(ruleList[0].value)
            form.setFieldValue('dimension', ruleList[0].value)
        }
    }, [ruleList])

    useEffect(() => {
        const flag =
            ruleRadioList.filter(
                (item) => !createdRuleTempIds.includes(item.value),
            )?.length === 1 && dimension !== ExplorationPeculiarity.Timeliness
        if (flag && !isEdit) {
            form.setFieldValue('template_id', InternalRuleType.Custom)
            setCurrentTemplateId(InternalRuleType.Custom)
        }
    }, [ruleRadioList, createdRuleTempIds])

    const disabledDataStatistics = useMemo(() => {
        return (
            !!explorationData?.dataStatisticsOptions?.length &&
            !explorationData?.dataStatisticsOptions?.filter(
                (item) => !createdRuleTempIds?.includes(item.template_id),
            )?.length
        )
    }, [explorationData?.dataStatisticsOptions, createdRuleTempIds])

    const getDetails = async () => {
        try {
            const action = getRuleActionMap('details', operateType)
            const res = await action(ruleId)
            const rule_config = res?.rule_config
                ? JSON.parse(res?.rule_config)
                : {}
            // 自定义规则表达式：字段配置、SQL
            if (rule_config.rule_expression?.sql) {
                setSqlScript(rule_config.rule_expression?.sql)
                setRuleExpression(RuleExpression.Sql)
            } else {
                setRuleExpression(RuleExpression.Field)
            }
            // 行级自定义规则配置过滤条件：字段配置、SQL
            if (rule_config.filter?.sql) {
                setFilterSqlScript(rule_config.filter?.sql)
                setFilterConditionRuleExpression(RuleExpression.Sql)
            } else {
                setFilterConditionRuleExpression(RuleExpression.Field)
            }
            setRuleConfig(rule_config)
            form.setFieldValue('rule_name', res?.rule_name)
            form.setFieldValue('rule_description', res?.rule_description)
            setRuleDetails(res)
            setIsCustom(isCustomRule(rule_config))
            setDimension(res?.dimension)
            setCurrentTemplateId(
                isTemplateConfig
                    ? res?.rule_id
                    : res?.template_id || InternalRuleType.Custom,
            )
            if (rule_config?.rule_expression?.where) {
                setCustomRuleConfig(rule_config?.rule_expression)
            }
            // 填写了配置条件，需要开启开关
            if (rule_config?.filter?.sql || rule_config?.filter?.where) {
                setFilterConditionChecked(true)
                setDisabledRadio(false)
            }
            if (rule_config?.filter?.where) {
                setCustomFilterRuleConfig(rule_config?.filter)
            }
        } catch (err) {
            formatError(err)
        }
    }

    const getAllRuleList = async () => {
        try {
            const action = getRuleActionMap('list', cssjj ? 'cssjj' : 'default')
            const res = await action({
                offset: 1,
                limit: 1000,
                form_view_id: explorationData?.dataViewId,
                field_id: explorationData?.activeField?.id,
                rule_level: explorationRule,
            })
            if (!res?.length) return
            const ids: any =
                res
                    ?.filter((item) => !!item.template_id)
                    ?.map((item) => item.template_id) || []
            setCreatedRuleTempIds(ids)
        } catch (err) {
            formatError(err)
        }
    }

    const getRuleList = async () => {
        let internalRuleList = explorationData?.internalRuleList
        try {
            if (!internalRuleList?.length) {
                internalRuleList = await getInternalRuleList()
                setExplorationData((pre) => ({
                    ...pre,
                    internalRuleList,
                }))
            }
        } catch (error) {
            formatError(error)
        }
    }

    const validateNameRepeat = async (value: string): Promise<void> => {
        const trimValue = value.trim()
        if (
            (!!currentInternalRule?.template_id &&
                dimension !== ExplorationPeculiarity.Timeliness &&
                !isTemplateConfig) ||
            defaultAndInternalRule
        ) {
            return Promise.resolve()
        }
        try {
            // 内置规则，不校验名称
            if (ruleDetails?.template_id && !isTemplateConfig) {
                return Promise.resolve()
            }
            const params: any = {
                rule_name: trimValue,
                form_view_id: explorationData?.dataViewId || '',
                field_id: explorationData?.activeField?.id,
                rule_id: ruleDetails?.rule_id,
            }
            const action = getRuleActionMap('repeat', operateType)
            const res = await action(params)
            if (res) {
                return Promise.reject(
                    new Error(
                        __('该名称已存在或者和系统内置规则重名，请重新输入'),
                    ),
                )
            }
            return Promise.resolve()
        } catch (error) {
            formatError(error)
            return Promise.resolve()
        }
    }
    const onRuleFinish = async (values) => {
        const fielsRuleConfig = await ruleFieldRef?.current?.onFinish()
        const filterRuleConfig = await filterRuleFieldRef?.current?.onFinish()
        const sqlRuleConfig = {
            rule_expression: {
                sql: handleRunSqlParam(sqlScript.trim()),
            },
        }
        const filterSqlRuleConfig = {
            filter: {
                sql: handleRunSqlParam(filterSqlScript.trim()),
            },
        }
        const rule_config = {
            // 自定义规则配置
            ...(ruleExpression === RuleExpression.Field
                ? fielsRuleConfig
                : sqlRuleConfig),
            // 行级自定义规则配置过滤条件
            ...(filterConditionRuleExpression === RuleExpression.Field
                ? { filter: filterRuleConfig?.rule_expression || undefined }
                : filterSqlRuleConfig),
        }
        if (
            (filterConditionRuleExpression === RuleExpression.Field &&
                !rule_config?.filter?.where?.length) ||
            !filterConditionRuleExpression
        ) {
            delete rule_config.filter
        }
        if (
            filterConditionRuleExpression === RuleExpression.Sql &&
            !rule_config?.filter?.sql
        ) {
            delete rule_config.filter
        }
        const info = {
            ...values,
            rule_config,
            dimension: values?.dimension || dimension,
        }
        const noValidateTemIds = [
            InternalRuleType.Null,
            InternalRuleType.RowNull,
            InternalRuleType.Repeat,
        ]
        if (isTemplateConfig) {
            noValidateTemIds.push(InternalRuleType.RowRepeat)
        }
        let isError = false
        if (dimension === ExplorationPeculiarity.DataStatistics) {
            isError = !dataStatisticsIds?.length
            setValidateError(isError)
        } else if (
            info?.template_id
                ? !noValidateTemIds.includes(info?.template_id)
                : true
        ) {
            isError =
                ruleExpression === RuleExpression.Field
                    ? !fielsRuleConfig?.rule_expression?.where?.length
                    : !sqlScript.trim()
            setValidateError(isError)
        }
        if (isError) return
        onFinish(info)
    }

    const onFinish = async (values) => {
        setLoading(true)
        try {
            const rule_config = JSON.stringify(values?.rule_config)
            const params = {
                ...values,
                dimension:
                    values?.dimension === ExplorationPeculiarity.All
                        ? ''
                        : values?.dimension,
                enable: !isTemplateConfig,
                form_view_id: explorationData?.dataViewId || undefined,
                field_id: explorationData?.activeField?.id,
                rule_level: explorationRule,
                rule_config,
            }
            // 自定义规则没有模板id
            if (defaultAndInternalRule) {
                params.template_id =
                    params.template_id ||
                    currentTemplateId ||
                    RuleRadioListMap?.[
                        `${explorationRule}-${dimension}`
                    ]?.join()
            }
            if (isCustom) {
                delete params.template_id
            }
            // 字段重复不需要配置
            if (
                values?.template_id === InternalRuleType.Repeat ||
                params?.dimension === ExplorationPeculiarity.DataStatistics
            ) {
                delete params.rule_config
            }
            if (!isEdit) {
                params.dimension_type = params.template_id
                    ? InternalRuleTemplateMap[params.template_id]
                    : isCustomRule(values?.rule_config)
                    ? 'custom'
                    : params.dimension === ExplorationPeculiarity.Timeliness
                    ? ''
                    : undefined
            }
            const action = getRuleActionMap(
                isEdit ? 'edit' : 'created',
                operateType,
            )
            if (!isEdit && defaultAndInternalRule) {
                delete params.rule_name
                delete params.rule_description
                delete params.rule_level
                delete params.dimension
            }
            if (isEdit) {
                const obj = isTemplateConfig
                    ? {
                          ...ruleDetails,
                          rule_name: params.rule_name,
                          rule_description: params.rule_description,
                          rule_config: params.rule_config,
                          id: ruleId,
                      }
                    : operateType === 'default'
                    ? {
                          ...params,
                          id: ruleId,
                          draft: false,
                          rule_description: params.rule_description,
                      }
                    : { ...params, id: ruleId, draft: false }
                await action(obj)
                message.success(__('编辑成功'))
            } else {
                // if (!isCustom && !isTemplateConfig) {
                //     delete params.rule_name
                //     delete params.rule_description
                //     delete params.rule_level
                //     delete params.dimension
                // }
                if (dimension === ExplorationPeculiarity.DataStatistics) {
                    await Promise.all(
                        dataStatisticsIds.map((item) =>
                            action({
                                form_view_id: explorationData?.dataViewId,
                                template_id: item,
                                field_id: explorationData?.activeField?.id,
                                enable: true,
                            }),
                        ),
                    )
                } else {
                    await action(params)
                }
                message.success(__('创建成功'))
            }
            onClose({ dimension })
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    const onRuleChange = (name: string, value: any) => {
        setChangeRuleData((pre) => {
            const data = {
                ...pre,
                [currentTemplateId]: {
                    ...pre[currentTemplateId],
                    [name]: value,
                },
            }
            return data
        })
    }

    const cacheCustomRule = async () => {
        const fielsRuleConfig: any =
            await ruleFieldRef?.current?.getRowFilterData()
        const filterRuleConfig =
            await filterRuleFieldRef?.current?.getRowFilterData()
        if (
            fielsRuleConfig?.where?.length > 0 &&
            fielsRuleConfig?.where?.every(
                (item) => item?.member?.length || item?.relation,
            )
        ) {
            onRuleChange('customRuleConfig', fielsRuleConfig)
        }
        if (
            filterRuleConfig?.where?.length > 0 &&
            filterRuleConfig?.where?.every(
                (item) => item?.member?.length || item?.relation,
            )
        ) {
            onRuleChange('customFilterRuleConfig', filterRuleConfig)
        }
    }

    return (
        <Modal
            title={title || modalTitle}
            width={680}
            open={open}
            onCancel={() => onClose()}
            maskClosable={false}
            zIndex={1002}
            wrapClassName={styles.rulesModal}
            onOk={() => form.submit()}
            confirmLoading={loading}
        >
            <div className={styles.modalBox}>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onRuleFinish}
                    validateTrigger={['onChange', 'onBlur']}
                    autoComplete="off"
                    className={styles.form}
                >
                    {ruleList?.length && (
                        <Form.Item
                            label={__('质量维度')}
                            name="dimension"
                            validateFirst
                            rules={[
                                {
                                    required: true,
                                    // message: ErrorInfo.NOTNULL,
                                },
                            ]}
                        >
                            <BadgeRadio
                                data={
                                    disabledDataStatistics
                                        ? ruleList?.map((item) => ({
                                              ...item,
                                              disable:
                                                  item?.value ===
                                                      ExplorationPeculiarity.DataStatistics ||
                                                  isEdit
                                                      ? true
                                                      : item?.disable,
                                              disableTips:
                                                  item?.value ===
                                                  ExplorationPeculiarity.DataStatistics
                                                      ? __(
                                                            '该字段已添加全部统计维度，暂时无法新建',
                                                        )
                                                      : isEdit
                                                      ? __('无法修改')
                                                      : item?.disableTips,
                                          }))
                                        : ruleList?.map((item) => ({
                                              ...item,
                                              disable: isEdit || item?.disable,
                                              disableTips:
                                                  item?.disableTips ||
                                                  __('无法修改'),
                                          }))
                                }
                                badgeStyle={{
                                    minHeight: '32px',
                                    padding: 0,
                                    width: '100px',
                                }}
                                tooltipsStyle={{
                                    width: isEdit ? 'auto' : '206px',
                                }}
                                value={dimension}
                                onChange={(value) => {
                                    if (
                                        value !==
                                        ExplorationPeculiarity.Timeliness
                                    ) {
                                        setCurrentTemplateId('')
                                        form.setFieldValue(
                                            'rule_description',
                                            undefined,
                                        )
                                        form.setFieldValue(
                                            'template_id',
                                            undefined,
                                        )
                                        form.setFieldValue(
                                            'rule_name',
                                            undefined,
                                        )
                                    }
                                    setIsCustom(false)
                                    setValidateError(false)
                                    setDimension(value)
                                }}
                            />
                        </Form.Item>
                    )}
                    {dimension === ExplorationPeculiarity.DataStatistics ? (
                        <>
                            <DataStatistics
                                createdRuleTempIds={createdRuleTempIds}
                                onChange={(ids) => setDataStatisticsIds(ids)}
                            />
                            {validateError && (
                                <ErrorTips tips={__('请选择数据统计规则')} />
                            )}
                        </>
                    ) : (
                        <>
                            {/* || !!dimension */}
                            {ruleRadioList?.filter(
                                (o) => o.value !== InternalRuleType.Custom,
                            ).length > 0 ? (
                                <Form.Item
                                    label={__('维度类型')}
                                    name="template_id"
                                    rules={[
                                        {
                                            required: true,
                                            message: ErrorInfo.NOTNULL,
                                        },
                                    ]}
                                    // className={classnames(
                                    //     isCustom && styles.radioName,
                                    // )}
                                >
                                    <Radio.Group>
                                        {ruleRadioList.map((item) => (
                                            <Tooltip
                                                key={item.value}
                                                title={
                                                    createdRuleTempIds.includes(
                                                        item.value,
                                                    )
                                                        ? __('规则已存在')
                                                        : isEdit
                                                        ? __('无法修改')
                                                        : ''
                                                }
                                            >
                                                <Radio
                                                    value={item.value}
                                                    onChange={async (e) => {
                                                        const { value } =
                                                            e.target
                                                        await cacheCustomRule()
                                                        setCurrentTemplateId(
                                                            value,
                                                        )
                                                    }}
                                                    disabled={
                                                        createdRuleTempIds.includes(
                                                            item.value,
                                                        ) || isEdit
                                                    }
                                                >
                                                    {item.label}
                                                </Radio>
                                            </Tooltip>
                                        ))}
                                    </Radio.Group>
                                </Form.Item>
                            ) : null}
                            <Form.Item
                                label={__('规则名称')}
                                name="rule_name"
                                validateFirst
                                rules={[
                                    {
                                        required: true,
                                        message: ErrorInfo.NOTNULL,
                                    },
                                    // {
                                    //     pattern: nameReg,
                                    //     message: ErrorInfo.ONLYSUP,
                                    // },
                                    {
                                        validateTrigger: ['onBlur'],
                                        validator: (e, value) =>
                                            validateNameRepeat(value),
                                    },
                                ]}
                            >
                                <Input
                                    placeholder={__('请输入规则名称')}
                                    maxLength={128}
                                    disabled={
                                        (!!currentInternalRule?.template_id &&
                                            dimension !==
                                                ExplorationPeculiarity.Timeliness &&
                                            !isTemplateConfig) ||
                                        defaultAndInternalRule
                                    }
                                    onChange={(e) => {
                                        onRuleChange(
                                            'rule_name',
                                            e.target.value,
                                        )
                                    }}
                                />
                            </Form.Item>
                            {(ruleRadioList.length > 1
                                ? !!currentTemplateId
                                : true) || isEdit ? (
                                <Form.Item
                                    // rules={[
                                    //     {
                                    //         required: true,
                                    //         message: ErrorInfo.NOTNULL,
                                    //     },
                                    // ]}
                                    label={__('规则描述')}
                                    name="rule_description"
                                >
                                    <Input
                                        disabled={
                                            (!!currentInternalRule?.template_id &&
                                                dimension !==
                                                    ExplorationPeculiarity.Timeliness &&
                                                !isTemplateConfig) ||
                                            defaultAndInternalRule
                                        }
                                        placeholder={__('请输入规则描述')}
                                        maxLength={300}
                                        onChange={(e) => {
                                            onRuleChange(
                                                'rule_description',
                                                e.target.value,
                                            )
                                        }}
                                    />
                                </Form.Item>
                            ) : null}
                            {isCustom ? (
                                <div>
                                    <div className={styles.ruleExpression}>
                                        <div className={styles.requiredFlag}>
                                            *
                                        </div>
                                        <div className={styles.label}>
                                            {__('规则表达式')}
                                        </div>
                                        <Radio.Group
                                            onChange={(e) => {
                                                setRuleExpression(
                                                    e.target.value,
                                                )
                                                onRuleChange(
                                                    'ruleExpression',
                                                    e.target.value,
                                                )
                                            }}
                                            value={
                                                changeRuleData?.[
                                                    currentTemplateId
                                                ]?.ruleExpression ||
                                                ruleExpression
                                            }
                                        >
                                            <Radio value={RuleExpression.Field}>
                                                {__('字段配置')}
                                            </Radio>
                                            <Radio value={RuleExpression.Sql}>
                                                {__('SQL')}
                                            </Radio>
                                        </Radio.Group>
                                    </div>
                                    <div
                                        hidden={
                                            ruleExpression ===
                                            RuleExpression.Sql
                                        }
                                    >
                                        <RuleFieldConfig
                                            value={
                                                changeRuleData?.[
                                                    currentTemplateId
                                                ]?.customRuleConfig ||
                                                customRuleConfig
                                            }
                                            isTemplateCustom={
                                                ruleDetails?.draft
                                            }
                                            ref={ruleFieldRef}
                                            // onChange={(val) => {
                                            //     if (
                                            //         val?.where?.length > 0 &&
                                            //         val?.where?.every(
                                            //             (item) =>
                                            //                 item?.member
                                            //                     ?.length ||
                                            //                 item?.relation,
                                            //         )
                                            //     ) {
                                            //         onRuleChange(
                                            //             'customRuleConfig',
                                            //             val,
                                            //         )
                                            //     }
                                            // }}
                                        />
                                    </div>
                                    <div
                                        hidden={
                                            ruleExpression ===
                                            RuleExpression.Field
                                        }
                                    >
                                        {(explorationData?.fieldList?.length ||
                                            isTemplateConfig) && (
                                            <SqlConfig
                                                fieldList={
                                                    explorationData?.fieldList
                                                }
                                                defaultSql={
                                                    changeRuleData?.[
                                                        currentTemplateId
                                                    ]?.sqlScript || sqlScript
                                                }
                                                onChange={(sql) => {
                                                    setSqlScript(sql)
                                                    onRuleChange(
                                                        'sqlScript',
                                                        sql,
                                                    )
                                                }}
                                            />
                                        )}
                                    </div>
                                    {validateError && (
                                        <ErrorTips
                                            tips={
                                                ruleExpression ===
                                                RuleExpression.Field
                                                    ? __('请选择过滤条件')
                                                    : __('请输入SQL')
                                            }
                                        />
                                    )}

                                    {hasFilterCondition && (
                                        <div className={styles.filterConfigBox}>
                                            <div
                                                className={
                                                    styles.ruleExpression
                                                }
                                            >
                                                <div className={styles.label}>
                                                    {__('配置过滤条件')}
                                                    <Switch
                                                        checked={
                                                            changeRuleData?.[
                                                                currentTemplateId
                                                            ]
                                                                ?.filterConditionChecked ||
                                                            filterConditionChecked
                                                        }
                                                        className={
                                                            styles.labelSwitch
                                                        }
                                                        onChange={(check) => {
                                                            setFilterConditionChecked(
                                                                check,
                                                            )
                                                            setFilterConditionRuleExpression(
                                                                check
                                                                    ? RuleExpression.Field
                                                                    : undefined,
                                                            )
                                                            setDisabledRadio(
                                                                !check,
                                                            )
                                                            onRuleChange(
                                                                'filterConditionChecked',
                                                                check,
                                                            )
                                                        }}
                                                        size="small"
                                                    />
                                                </div>
                                                <Radio.Group
                                                    onChange={(e) => {
                                                        setFilterConditionRuleExpression(
                                                            e.target.value,
                                                        )
                                                        onRuleChange(
                                                            'filterConditionRuleExpression',
                                                            e.target.value,
                                                        )
                                                    }}
                                                    disabled={disabledRadio}
                                                    value={
                                                        changeRuleData?.[
                                                            currentTemplateId
                                                        ]
                                                            ?.filterConditionRuleExpression ||
                                                        filterConditionRuleExpression
                                                    }
                                                >
                                                    <Radio
                                                        value={
                                                            RuleExpression.Field
                                                        }
                                                    >
                                                        {__('字段过滤')}
                                                    </Radio>
                                                    <Radio
                                                        value={
                                                            RuleExpression.Sql
                                                        }
                                                    >
                                                        {__('SQL')}
                                                    </Radio>
                                                </Radio.Group>
                                            </div>
                                            <div
                                                style={{
                                                    display:
                                                        filterConditionRuleExpression ===
                                                        RuleExpression.Field
                                                            ? 'block'
                                                            : 'none',
                                                }}
                                            >
                                                <RuleFieldConfig
                                                    value={
                                                        changeRuleData?.[
                                                            currentTemplateId
                                                        ]
                                                            ?.customFilterRuleConfig ||
                                                        customFilterRuleConfig
                                                    }
                                                    ref={filterRuleFieldRef}
                                                    // onChange={(val) => {
                                                    //     if (
                                                    //         val?.where?.length >
                                                    //             0 &&
                                                    //         val?.where?.every(
                                                    //             (item) =>
                                                    //                 item?.member
                                                    //                     ?.length ||
                                                    //                 item?.relation,
                                                    //         )
                                                    //     ) {
                                                    //         onRuleChange(
                                                    //             'customFilterRuleConfig',
                                                    //             val,
                                                    //         )
                                                    //     }
                                                    // }}
                                                />
                                            </div>
                                            <div
                                                style={{
                                                    display:
                                                        filterConditionRuleExpression ===
                                                        RuleExpression.Sql
                                                            ? 'block'
                                                            : 'none',
                                                }}
                                            >
                                                {(explorationData?.fieldList
                                                    ?.length ||
                                                    isTemplateConfig) && (
                                                    <SqlConfig
                                                        defaultSql={
                                                            changeRuleData
                                                                ?.custom
                                                                ?.filterSqlScript ||
                                                            filterSqlScript
                                                        }
                                                        onChange={(sql) => {
                                                            setFilterSqlScript(
                                                                sql,
                                                            )
                                                            onRuleChange(
                                                                'filterSqlScript',
                                                                sql,
                                                            )
                                                        }}
                                                        placeholder={__(
                                                            '张三需要检查幼儿园入学登记表中年龄不为空的学生是否满3周岁，过滤sql可以这样写：age IS NOT NULL',
                                                        )}
                                                        fieldList={
                                                            explorationData?.fieldList
                                                        }
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : noRuleConfig ? null : (
                                <div>
                                    <InternalRule
                                        isEdit={isEdit}
                                        isStorage={
                                            !!changeRuleData?.[
                                                currentTemplateId
                                            ]?.rule_config
                                        }
                                        defaultValues={
                                            changeRuleData?.[currentTemplateId]
                                                ?.rule_config || ruleConfig
                                        }
                                        onFinish={onFinish}
                                        form={form}
                                        type={
                                            (isEdit &&
                                            (isTemplateConfig ||
                                                !ruleDetails?.template_id)
                                                ? dimensionTypeMap[
                                                      ruleDetails
                                                          ?.dimension_type
                                                  ]
                                                : internalRuleTypeMap[
                                                      currentTemplateId
                                                  ]) ||
                                            ruleDetails?.dimension_type
                                        }
                                        onDataChange={(val) => {
                                            if (val?.rule_config) {
                                                onRuleChange(
                                                    'rule_config',
                                                    val?.rule_config,
                                                )
                                            }
                                        }}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </Form>
            </div>
        </Modal>
    )
}

export default RulesModal
