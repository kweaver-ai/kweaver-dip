import React, { useEffect, useMemo, useState } from 'react'
import { Select, Checkbox, Col, Button, Input } from 'antd'
import classnames from 'classnames'
import styles from './styles.module.less'
import __ from '../locale'
import { getDatasheetViewDetails, formatError, dataTypeMapping } from '@/core'
import { useDataViewContext } from '../../DataViewProvider'
import FieldItem from '../FieldItem'
import { RowNullRuleList } from '../const'
import { changeTypeToLargeArea, ErrorTips } from '../helper'

const { Option } = Select

interface IRowRepeat {
    value?: any
    onChange?: (o) => void
    isRowNullRule?: boolean
    showError?: boolean
    isEdit?: boolean
}

const RowRepeat: React.FC<IRowRepeat> = ({
    value,
    onChange,
    isRowNullRule,
    showError,
    isEdit,
}) => {
    const { isTemplateConfig, explorationData, setExplorationData } =
        useDataViewContext()
    const [dataViewId, setDataViewId] = useState<string>('')
    const [options, setOptions] = useState<any[]>([])
    const [selectedIds, setSelectedIds] = useState<any[]>([])
    const [config, setConfig] = useState<any>([])
    const [loading, setLoading] = useState<boolean>(false)
    const [checkedAll, setCheckedAll] = useState<boolean>(false)
    const [rowNullRuleListData, setRowNullRuleListData] = useState<any>(
        RowNullRuleList.map((item) => ({
            ...item,
            disabled: !value && !isTemplateConfig,
        })),
    )

    useEffect(() => {
        setDataViewId(explorationData?.dataViewId || '')
    }, [])

    useEffect(() => {
        if (dataViewId) {
            getFields()
        }
    }, [dataViewId])

    useEffect(() => {
        setRowNullRuleListData((pre) =>
            pre.map((item) => ({
                ...item,
                disabled: !value && !isTemplateConfig,
            })),
        )
    }, [isTemplateConfig])

    const handleChange = (val) => {
        setSelectedIds(val)
    }

    useEffect(() => {
        if (value?.field_ids?.length) {
            setSelectedIds(value?.field_ids)
        }
        if (value?.config?.length) {
            setConfig(value?.config)
        }
        setRowNullRuleListData((pre) =>
            pre.map((item) => ({
                ...item,
                disabled: !value && !isTemplateConfig,
            })),
        )
    }, [value])

    useEffect(() => {
        if (selectedIds.length > 0 || config.length > 0) {
            const row_null = {
                field_ids: selectedIds,
                // 过滤配置规则中已选
                config: config.filter((item) =>
                    rowNullRuleListData?.map((it) => it.value)?.includes(item),
                ),
            }
            const row_repeat = {
                field_ids: selectedIds,
            }
            onChange?.(isRowNullRule ? { row_null } : { row_repeat })
        }
    }, [selectedIds, config])

    useEffect(() => {
        if (options?.length) {
            changeRule(selectedIds)
        }
    }, [options, selectedIds])

    const handleSelectAll = (checked) => {
        setCheckedAll(checked)
        setSelectedIds(checked ? options.map((item) => item.id) : [])
    }

    const getFields = async () => {
        try {
            setLoading(true)
            const res = await getDatasheetViewDetails(dataViewId)
            // 过滤已删除、二进制字段、不能识别的类型
            const list = res?.fields
                ?.filter(
                    (item) =>
                        item.status !== 'delete' &&
                        !dataTypeMapping.binary.includes(item.data_type) &&
                        !!changeTypeToLargeArea(item.data_type),
                )
                ?.map((item) => {
                    return {
                        ...item,
                        checked: false,
                    }
                })
            setOptions(list)
        } catch (err) {
            formatError(err)
        } finally {
            setLoading(false)
        }
    }

    const onCheckChange = (checkedValues: any) => {
        setConfig(checkedValues)
    }

    const changeRule = (val) => {
        if (!val?.length) {
            setRowNullRuleListData(
                RowNullRuleList.map((item) => ({ ...item, disabled: true })),
            )
            setConfig([])
            onChange?.({})
            return
        }
        const selectedFieldTypes = options
            ?.filter((item) => val.includes(item.id))
            ?.map((item) => changeTypeToLargeArea(item.data_type))
        // 根据字段类型筛选规则
        const updatedRuleList = RowNullRuleList?.map((item) => ({
            ...item,
            disabled: false,
        })).filter(
            (item) =>
                // 如果规则适用于所有类型，或者选中的字段类型包含在规则的适用类型中
                item.applicableTypes.includes('all') ||
                selectedFieldTypes.some((type) =>
                    item.applicableTypes.includes(type),
                ),
        )
        if (!isEdit) {
            setConfig((pre) => Array.from(new Set([...pre, 'NULL'])))
        }
        setRowNullRuleListData(updatedRuleList)
    }

    return (
        <div className={styles.rowRepeatWrapper}>
            {!isTemplateConfig && (
                <Select
                    style={{ width: '100%' }}
                    placeholder={
                        isRowNullRule
                            ? __('请选择字段（至少2个）')
                            : __('请选择规则字段')
                    }
                    mode="multiple"
                    optionFilterProp="children"
                    optionLabelProp="label"
                    onChange={handleChange}
                    popupClassName={styles.rowRepeatSelectWrapper}
                    value={selectedIds}
                    loading={loading}
                    showArrow
                    filterOption={(input, option) => {
                        const { business_name, technical_name } =
                            option?.props || {}
                        return (
                            business_name
                                ?.toLowerCase()
                                ?.includes(input.toLowerCase()) ||
                            technical_name
                                ?.toLowerCase()
                                ?.includes(input.toLowerCase())
                        )
                    }}
                >
                    <div className={styles.checkAll}>
                        <Checkbox
                            checked={checkedAll}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                            className={styles.checkbox}
                        >
                            {__('全选')}
                        </Checkbox>
                    </div>
                    {options.map((item) => {
                        return (
                            <Option
                                key={item.id}
                                value={item.id}
                                label={
                                    <FieldItem
                                        data={{
                                            name: item.business_name,
                                            type: item.data_type,
                                        }}
                                    />
                                }
                                business_name={item.business_name}
                                technical_name={item.technical_name}
                            >
                                <div className={styles.optionBox}>
                                    <Checkbox
                                        checked={selectedIds.includes(item.id)}
                                    />
                                    <FieldItem
                                        data={{
                                            name: item.business_name,
                                            code: item.technical_name,
                                            type: item.data_type,
                                        }}
                                    />
                                </div>
                            </Option>
                        )
                    })}
                </Select>
            )}
            {showError &&
            !isTemplateConfig &&
            (isRowNullRule ? selectedIds?.length < 2 : !selectedIds?.length) ? (
                <ErrorTips
                    tips={
                        isRowNullRule
                            ? __('请选择至少2个字段')
                            : __('请选择规则字段')
                    }
                />
            ) : null}
            {isRowNullRule && (
                <div
                    className={classnames(
                        styles.configBox,
                        isTemplateConfig && styles.noMarginTop,
                    )}
                >
                    <div className={styles.rowInfo}>
                        <span className={styles.requiredFlag}>*</span>
                        {__('规则配置：')}
                    </div>
                    <Checkbox.Group
                        style={{ width: '100%' }}
                        value={config}
                        options={rowNullRuleListData}
                        onChange={onCheckChange}
                    />
                    {showError && !config?.length ? (
                        <ErrorTips tips={__('请选择规则配置')} />
                    ) : null}
                </div>
            )}
        </div>
    )
}

export default RowRepeat
