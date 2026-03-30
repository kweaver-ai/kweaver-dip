import React, { useEffect, useState, useMemo, ReactNode } from 'react'
import { Checkbox, Table, Switch, Tooltip } from 'antd'
import { useLocation } from 'react-router-dom'
import classNames from 'classnames'
import styles from './styles.module.less'
import { SearchInput, Loader, Empty } from '@/ui'
import __ from '../locale'
import FieldItem from '../FieldItem'
import {
    formatError,
    getDatasheetViewDetails,
    editExploreRuleStatus,
    dataTypeMapping,
} from '@/core'
import { useDataViewContext } from '../../DataViewProvider'
import {
    ExplorationType,
    datasourceExploreFieldTypeList,
    datasourceExploreFieldMap,
    ExplorationRule,
    dataTypeMap,
    getRuleActionMap,
    ExplorationPeculiarity,
} from '../const'
import { getDatasourceExplorationField, changeTypeToLargeArea } from '../helper'
import dataEmpty from '@/assets/dataEmpty.svg'
import empty from '@/assets/searchEmpty.svg'

interface IExplorationFields {
    onFiledClick?: (o) => void
}

const ExplorationFields = (props: IExplorationFields) => {
    const { onFiledClick } = props
    const { pathname } = useLocation()
    const { explorationData, setExplorationData } = useDataViewContext()
    const [searchKey, setSearchKey] = useState<string>('')
    const [dataViewId, setDataViewId] = useState<string>('')
    const [fieldsList, setFieldsList] = useState<any[]>([])
    const [activeField, setActiveField] = useState<any>({})
    const [fieldsListFilter, setFieldsListFilter] = useState<any[]>([])
    const [loading, setLoading] = useState<boolean>(false)
    const [checkedAll, setCheckedAll] = useState<boolean>(false)
    const [isInit, setIsInit] = useState<boolean>(true)
    const [disabledCheckedAll, setDisabledCheckedAll] = useState<boolean>(false)

    const cssjj = useMemo(() => {
        return explorationData?.cssjj
    }, [explorationData])

    useEffect(() => {
        setDataViewId(explorationData?.dataViewId || '')
    }, [explorationData?.dataViewId])

    useEffect(() => {
        if (
            explorationData?.internalRuleList?.length &&
            explorationData?.activeField?.id
        ) {
            const fieldType = changeTypeToLargeArea(
                explorationData?.activeField?.data_type,
            )
            const internalRuleList = explorationData?.internalRuleList || []
            const list = internalRuleList.filter(
                (item) =>
                    item.dimension === ExplorationPeculiarity.DataStatistics &&
                    datasourceExploreFieldMap[fieldType].includes(
                        item.template_id,
                    ),
            )
            setExplorationData((pre) => ({
                ...pre,
                dataStatisticsOptions: list,
            }))
        }
    }, [explorationData?.activeField, explorationData?.internalRuleList])

    // const filedBoxStyle = useMemo(() => {
    //     return {
    //         maxHeight: `calc(100vh - 448px)`,
    //     }
    // }, [pathname])

    // 是否为查看模式
    const isViewMode = useMemo(() => {
        return explorationData?.viewMode
    }, [explorationData?.viewMode])

    const fieldHeight = useMemo(() => {
        return explorationData?.field_max_height || (isViewMode ? 236 : 448)
    }, [explorationData?.field_max_height, isViewMode])

    const isDatasource = useMemo(() => {
        return explorationData?.explorationType === ExplorationType.Datasource
    }, [explorationData])

    useEffect(() => {
        if (isDatasource) {
            const internalDatasouceRuleGroup =
                explorationData?.internalDatasouceRuleGroup
            const list = datasourceExploreFieldTypeList?.map((item) => {
                return {
                    ...item,
                    checked:
                        getDatasourceExplorationField(
                            internalDatasouceRuleGroup,
                            item.data_type,
                        )?.length > 0,
                }
            })
            if (!activeField?.id) {
                const [first] = list
                setActiveField(first || {})
                onFiledClick?.(first || {})
                setExplorationData((pre) => ({
                    ...pre,
                    activeField: first || {},
                }))
            }
            setFieldsList(list)
        }
    }, [explorationData?.internalDatasouceRuleGroup, isDatasource])

    useEffect(() => {
        if (explorationData?.updateFieldList) {
            getFields()
        }
    }, [explorationData?.updateFieldList])

    useEffect(() => {
        if (dataViewId) {
            getFields()
        }
    }, [dataViewId, isDatasource])

    useEffect(() => {
        if (fieldsList?.length) {
            setFieldsListFilter(
                searchKey
                    ? fieldsList.filter(
                          (item) =>
                              item.business_name
                                  .toLowerCase()
                                  .includes(searchKey.toLowerCase()) ||
                              item.technical_name
                                  .toLowerCase()
                                  .includes(searchKey.toLowerCase()),
                      )
                    : fieldsList,
            )
            const checkedFields = fieldsList.filter(
                (item) => item.total_rules !== 0,
            )
            setDisabledCheckedAll(!checkedFields?.length)
            const checkAllFlag =
                checkedFields?.length > 0 &&
                // checkedFields?.every((item) => item.checked)
                checkedFields?.every(
                    (item) => item?.total_rules === item?.enable_rules,
                )
            const datasourceAllFlag = checkedFields?.every(
                (item) => item.checked,
            )
            setCheckedAll(isDatasource ? datasourceAllFlag : checkAllFlag)
        }
    }, [fieldsList, searchKey])

    const getFields = async (isCheckAll?: boolean) => {
        try {
            if (isInit) {
                setLoading(true)
            }
            const res = await getDatasheetViewDetails(dataViewId)
            let list = res?.fields
                ?.filter((item) => {
                    //  过滤已删除；仅支持大类型中列出的，不支持其他类型，不支持二进制字段
                    const types = Object.keys(dataTypeMapping).includes(
                        changeTypeToLargeArea(item.data_type),
                    )
                    const flag =
                        item.status !== 'delete' &&
                        types &&
                        !dataTypeMapping.binary.includes(item.data_type)
                    return flag
                })
                ?.map((item) => {
                    return {
                        ...item,
                        checked: item?.enable_rules > 0,
                        // checked:
                        //     item?.total_rules !== 0 &&
                        //     item?.total_rules === item?.enable_rules,
                    }
                })
            const expData = {
                ...explorationData,
                fieldList: list,
                updateFieldList: false,
            }
            // 数据预览模式 仅显示 存在规则的字段
            if (explorationData?.viewMode) {
                list = list?.filter((o) => o.checked)
            }
            if (!activeField?.id) {
                setActiveField(list?.[0] || {})
                onFiledClick?.(list?.[0] || {})
                expData.activeField = list?.[0] || {}
            }
            setExplorationData(expData)
            setFieldsList(list)
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
            setIsInit(false)
        }
    }

    const onFieldCheckAll = (checked: boolean) => {
        const list = fieldsList.map((item) => ({
            ...item,
            checked: item.total_rules === 0 ? false : checked,
            // checked,
        }))
        setFieldsList(list)
        if (isDatasource) {
            internalDatasouceRuleChange(checked, null, true)
        } else {
            onDataViewFieldEnable(checked, null, true)
        }
    }

    const onFieldSwitch = (checked: boolean, field: any) => {
        const list = fieldsList.map((item) => ({
            ...item,
            checked: item.id === field.id ? checked : item.checked,
        }))
        setFieldsList(list)
        if (isDatasource) {
            internalDatasouceRuleChange(checked, field)
        } else {
            onDataViewFieldEnable(checked, field)
        }
    }

    const internalDatasouceRuleChange = (
        checked: boolean,
        field: any,
        checkAll?: boolean,
    ) => {
        const rules = explorationData?.internalDatasouceRuleGroup
        let internalDatasouceRuleGroup = {}
        if (!checkAll) {
            internalDatasouceRuleGroup = {
                ...rules,
                [field.data_type]: rules[field.data_type].map((item) => ({
                    ...item,
                    rules: item.rules.map((rule) => ({
                        ...rule,
                        checked,
                    })),
                })),
            }
        } else {
            Object.keys(rules).forEach((key) => {
                internalDatasouceRuleGroup[key] = rules[key].map((item) => ({
                    ...item,
                    rules: item.rules.map((rule) => ({
                        ...rule,
                        checked:
                            key !== 'metadata' && key !== 'view'
                                ? checked
                                : rule.checked,
                    })),
                }))
            })
        }
        setExplorationData((pre) => ({
            ...pre,
            internalDatasouceRuleGroup,
        }))
    }

    const onDataViewFieldEnable = async (
        checked: boolean,
        field: any,
        isAll?: boolean,
    ) => {
        try {
            const action = getRuleActionMap('list', cssjj ? 'cssjj' : 'default')

            const list = await action({
                field_id: isAll ? undefined : field.id,
                form_view_id: dataViewId,
                offset: 1,
                limit: 1000,
            })
            if (list.length) {
                const rule_ids: string[] = list
                    .filter(
                        (item) =>
                            item.rule_level === ExplorationRule.Field &&
                            !item.draft,
                    )
                    .map((item) => item.rule_id || '')
                await editExploreRuleStatus({ rule_ids, enable: checked })
                setExplorationData((pre) => ({
                    ...pre,
                    updateRuleList: true,
                }))
                getFields()
            }
        } catch (error) {
            formatError(error)
        } finally {
            setExplorationData((pre) => ({
                ...pre,
                updateFieldList: false,
            }))
        }
    }

    return loading ? (
        <Loader />
    ) : (
        <div className={styles.explorationFieldsWrapper}>
            <div className={styles.titleBox}>
                <div className={styles.title}>
                    {isDatasource ? __('数据类型') : __('字段列表')}
                </div>
                <div
                    className={styles.checkBox}
                    hidden={explorationData.viewMode}
                >
                    {isDatasource
                        ? __('启用全部数据类型探查')
                        : __('启用全部字段探查')}
                    <Tooltip
                        title={
                            disabledCheckedAll
                                ? __('创建任意探查规则后您可开启')
                                : ''
                        }
                    >
                        <Switch
                            disabled={disabledCheckedAll}
                            className={styles.ruleSwitch}
                            size="small"
                            checked={checkedAll}
                            onChange={(val) => onFieldCheckAll(val)}
                        />
                    </Tooltip>
                </div>
            </div>
            {!isDatasource && (
                <div className={styles.searchBox}>
                    <SearchInput
                        value={searchKey}
                        onKeyChange={(kw: string) => {
                            setSearchKey(kw)
                        }}
                        placeholder={__('搜索字段业务名称、技术名称')}
                    />
                </div>
            )}
            <div
                className={styles.fieldBox}
                style={{
                    maxHeight: `calc(100vh - ${fieldHeight}px)`,
                }}
            >
                {fieldsListFilter?.length > 0 ? (
                    fieldsListFilter.map((item) => {
                        return (
                            <div
                                key={item.id}
                                onClick={() => {
                                    setActiveField(item)
                                    onFiledClick?.(item)
                                    setExplorationData((pre) => ({
                                        ...pre,
                                        activeField: item,
                                    }))
                                }}
                                className={classNames(
                                    styles.fieldItem,
                                    item.id === activeField?.id &&
                                        styles.active,
                                    isDatasource && styles.isDatasource,
                                )}
                            >
                                <div className={styles.fieldLeft}>
                                    <FieldItem
                                        data={{
                                            name: item.business_name,
                                            code: item.technical_name,
                                            type: item.data_type,
                                            reset_before_data_type:
                                                item.reset_before_data_type,
                                        }}
                                        isDatasourceNumber={
                                            isDatasource &&
                                            item.data_type === dataTypeMap.int
                                        }
                                    />
                                </div>
                                <div
                                    className={styles.fieldRight}
                                    hidden={explorationData.viewMode}
                                >
                                    <Tooltip
                                        title={
                                            item.total_rules === 0
                                                ? __(
                                                      '创建任意探查规则后您可开启',
                                                  )
                                                : ''
                                        }
                                    >
                                        <Switch
                                            className={styles.fieldSwitch}
                                            size="small"
                                            disabled={item.total_rules === 0}
                                            checked={item.checked}
                                            onChange={(checked, event) => {
                                                // 阻止事件冒泡
                                                event.stopPropagation()
                                                onFieldSwitch(checked, item)
                                            }}
                                        />
                                    </Tooltip>
                                    {!isDatasource && (
                                        <Tooltip
                                            placement="right"
                                            color="#fff"
                                            overlayInnerStyle={{
                                                color: '#000',
                                            }}
                                            title={__(
                                                '字段共计${total}条规则，已开启${sum}条',
                                                {
                                                    total: `${
                                                        item.total_rules || 0
                                                    }`,
                                                    sum: `${
                                                        item.enable_rules || 0
                                                    }`,
                                                },
                                            )}
                                        >
                                            <div className={styles.fieldSum}>
                                                <span
                                                    className={
                                                        styles.fieldSumText
                                                    }
                                                >
                                                    {item.enable_rules}
                                                </span>
                                                /{item.total_rules}
                                            </div>
                                        </Tooltip>
                                    )}
                                </div>
                            </div>
                        )
                    })
                ) : (
                    <div className={styles.empty}>
                        <Empty
                            iconHeight="104px"
                            iconSrc={searchKey ? empty : dataEmpty}
                            desc={
                                searchKey
                                    ? __('抱歉，没有找到相关内容')
                                    : __('暂无数据')
                            }
                        />
                    </div>
                )}
            </div>
        </div>
    )
}

export default ExplorationFields
