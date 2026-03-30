import React, { useEffect, useState, useMemo, useRef, ReactNode } from 'react'
import {
    Table,
    message,
    Space,
    Button,
    Switch,
    Radio,
    Checkbox,
    Tooltip,
    Badge,
} from 'antd'
import { useAntdTable } from 'ahooks'
import { uniqBy } from 'lodash'
import classnames from 'classnames'
import styles from './styles.module.less'
import { AddOutlined } from '@/icons'
import { RefreshBtn } from '@/components/ToolbarComponents'
import { SearchInput, Loader } from '@/ui'
import {
    explorationPeculiarityList,
    ExplorationPeculiarity,
    ExplorationRule,
    ExplorationType,
    TimelinessRule,
    TimelinessRuleList,
    datasourceExploreFieldMap,
    InternalTemplateIdList,
    getRuleActionMap,
    isCustomRule,
    getUniqueName,
    InternalRuleType,
} from '../const'
import { OperateType } from '@/utils'
import __ from '../locale'
import {
    formatError,
    editExploreRuleStatus,
    editExploreRule,
    delExploreRule,
    getTemplateRuleList,
    getInternalRuleList,
    createExploreRule,
    IExploreRuleList,
    getDatasourceConfig,
} from '@/core'
import { useDataViewContext } from '../../DataViewProvider'
import RulesModal from '../RulesModal'
import Confirm from '@/components/Confirm'
import dataEmpty from '@/assets/dataEmpty.svg'
import Empty from '@/ui/Empty'
import RulesDetails from '../RulesModal/RulesDetails'
import SelectedTemplateRule from '../SelectedTemplateRule'
import { getDatasourceExplorationField, ruleGroup } from '../helper'

const ExplorationAttribute = () => {
    const { explorationData, setExplorationData } = useDataViewContext()
    const commonTableRef: any = useRef()
    const [activeKey, setActiveKey] = useState<ExplorationPeculiarity>(
        ExplorationPeculiarity.All,
    )
    const [searchKey, setSearchKey] = useState<string>('')
    const [internalRule, setinternalRule] = useState<boolean>()
    const [currentRuleInfo, setCurrentRuleInfo] = useState<any>()
    const [operateType, setOperateType] = useState<OperateType>()
    const [showType, setShowType] = useState<boolean>(false)
    const [initSearch, setInitSearch] = useState<boolean>(false)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [showOperation, setShowOperation] = useState<boolean>(false)
    const [showRuleNameCheck, setShowRuleNameCheck] = useState<boolean>(false)
    const [rulesModalOpen, setRulesModalOpen] = useState<boolean>(false)
    const [rulesDetailsOpen, setRulesDetailsOpen] = useState<boolean>(false)
    const [disabledCheckedAll, setDisabledCheckedAll] = useState<boolean>(false)
    const [selectedTemplateRuleOpen, setSelectedTemplateRuleOpen] =
        useState<boolean>(false)
    const [explorationAttributeList, setExplorationAttributeList] = useState<
        any[]
    >([])
    const [tableList, setTableList] = useState<any[]>([])
    const excludeAttributeLists = [
        ExplorationPeculiarity.All,
        // ExplorationPeculiarity.DataStatistics,
        // ExplorationPeculiarity.Timeliness,
    ]
    const [searchCondition, setSearchCondition] = useState<any>({
        offset: 1,
        limit: 10,
    })
    const [checkedAll, setCheckedAll] = useState<boolean>(false)
    const [delVisible, setDelVisible] = useState<boolean>(false)
    const [delBtnLoading, setDelBtnLoading] = useState<boolean>(false)
    const [isInit, setIsInit] = useState<boolean>(true)
    const [dataViewRuleConfig, setDataViewRuleConfig] = useState<any>()
    const [dataSourceTableList, setDataSourceTableList] = useState<any[]>([])
    const [createdDataStatisticsIds, setCreatedDataStatisticsIds] = useState<
        string[]
    >([])

    const isEmpty = useMemo(() => {
        return !tableList?.length && !dataSourceTableList?.length
    }, [tableList, dataSourceTableList])

    const dataViewId = useMemo(() => {
        return explorationData?.dataViewId
    }, [explorationData?.dataViewId])

    // 是否为查看模式
    const isViewMode = useMemo(() => {
        return explorationData?.viewMode
    }, [explorationData?.viewMode])

    const attributeHeight = useMemo(() => {
        return explorationData?.attribute_max_height || 274
    }, [explorationData?.attribute_max_height])

    const cssjj = useMemo(() => {
        return explorationData?.cssjj
    }, [explorationData])

    const isExistTimeliness = useMemo(() => {
        return !!tableList?.find(
            (o) => o.dimension === ExplorationPeculiarity.Timeliness,
        )?.rule_id
    }, [tableList])

    useEffect(() => {
        if (tableList?.length) {
            if (explorationRuleLevel === ExplorationRule.DataView) {
                const config = {}
                tableList.forEach((item) => {
                    const rule_config = JSON.parse(item?.rule_config || '{}')
                    config[item?.template_id] = rule_config?.update_period
                })
                setDataViewRuleConfig({
                    ...dataViewRuleConfig,
                    ...config,
                })
            }
            setDisabledCheckedAll(tableList?.every((o) => o.draft))
        }
    }, [tableList])

    useEffect(() => {
        if (
            explorationData?.internalDatasouceRuleGroup &&
            explorationRuleLevel === ExplorationRule.Field &&
            currentFieldId
        ) {
            const list =
                explorationData?.internalDatasouceRuleGroup[currentFieldId]
            setDataSourceTableList(list)
        }
    }, [explorationData?.internalDatasouceRuleGroup])

    // 字段级 - 当前字段id
    const currentFieldId = useMemo(() => {
        return explorationData?.activeField?.id || ''
    }, [explorationData.activeField])

    useEffect(() => {
        if (currentFieldId) {
            setSearchCondition({ ...searchCondition, field_id: currentFieldId })
        }
    }, [currentFieldId])

    useEffect(() => {
        if (explorationData?.updateRuleList) {
            run(searchCondition)
        }
    }, [explorationData?.updateRuleList])

    useEffect(() => {
        if (dataSourceTableList?.length) {
            // 更新选中数据
            const list = {
                ...explorationData.internalDatasouceRuleGroup,
                [currentFieldId || explorationRuleLevel]: dataSourceTableList,
            }
            setExplorationData((pre) => ({
                ...pre,
                internalDatasouceRuleGroup: list,
            }))
        }
    }, [dataSourceTableList])

    // 规则级别 - 元数据级/字段级/行级/库表级
    const explorationRuleLevel: ExplorationRule = useMemo(() => {
        return explorationData?.explorationRule || ExplorationRule.Metadata
    }, [explorationData.explorationRule])

    useEffect(() => {
        if (explorationRuleLevel) {
            setSearchCondition({
                ...searchCondition,
                form_view_id: dataViewId,
                rule_level: explorationRuleLevel,
                // 切换规则级别，清空维度
                dimension: undefined,
            })
            setInitSearch(true)
            setActiveKey(ExplorationPeculiarity.All)
        }
    }, [explorationRuleLevel])

    // 规则类型 - 数据源/库表
    const explorationType = useMemo(() => {
        return explorationData?.explorationType
    }, [explorationData.explorationType])

    const disabledCreatedTips = useMemo(() => {
        if (createdDataStatisticsIds?.length) {
            const isDisabled = !explorationData?.dataStatisticsOptions?.filter(
                (item) => !createdDataStatisticsIds.includes(item.template_id),
            )?.length
            return isDisabled &&
                activeKey === ExplorationPeculiarity.DataStatistics
                ? __('该字段已添加全部统计维度，暂时无法新建')
                : ''
        }
        if (
            activeKey === ExplorationPeculiarity.Timeliness &&
            tableList?.length > 0
        ) {
            return __('规则已存在，无法添加更多')
        }
        return ''
    }, [createdDataStatisticsIds, tableList, activeKey])

    const ruleList = useMemo(() => {
        const list =
            activeKey === ExplorationPeculiarity.All
                ? explorationAttributeList
                      ?.filter(
                          (item) => !excludeAttributeLists.includes(item.key),
                      )
                      ?.map((item) => {
                          const disable =
                              item.key === ExplorationPeculiarity.Timeliness &&
                              !!tableList?.find(
                                  (o) =>
                                      o.dimension ===
                                      ExplorationPeculiarity.Timeliness,
                              )?.rule_id
                          return {
                              value: item.key,
                              label: item.label,
                              disable,
                              disableTips: disable
                                  ? __('规则已存在，无法新建')
                                  : '',
                          }
                      })
                : explorationAttributeList
                      .filter((o) => o.key === activeKey)
                      ?.map((o) => ({
                          value: o.key,
                          label: o.label,
                      }))
        return list
    }, [explorationAttributeList, activeKey, tableList])

    useEffect(() => {
        if (
            explorationType === ExplorationType.FormView &&
            dataViewId &&
            initSearch
        ) {
            run({ ...searchCondition, form_view_id: dataViewId })
        }
    }, [dataViewId, explorationType])

    useEffect(() => {
        setShowType(explorationType === ExplorationType.FormView)
        const isFormView = explorationType === ExplorationType.FormView
        const isNotMetadataLevel =
            explorationRuleLevel !== ExplorationRule.Metadata

        const shouldShowOperation = isFormView && isNotMetadataLevel
        setShowOperation(shouldShowOperation)
        const metadataRules = [
            ExplorationPeculiarity.All,
            ExplorationPeculiarity.Completeness,
            ExplorationPeculiarity.Normative,
        ]
        const rowRules = [
            ExplorationPeculiarity.All,
            ExplorationPeculiarity.Completeness,
            ExplorationPeculiarity.Uniqueness,
            ExplorationPeculiarity.Accuracy,
        ]
        const formRules = [
            ExplorationPeculiarity.All,
            ExplorationPeculiarity.Completeness,
            ExplorationPeculiarity.Timeliness,
        ]
        const fieldRules = [
            ExplorationPeculiarity.Timeliness,
            explorationType === ExplorationType.FormView
                ? ''
                : ExplorationPeculiarity.Accuracy,
        ]
        const list =
            explorationRuleLevel === ExplorationRule.Row
                ? explorationPeculiarityList.filter((item) =>
                      rowRules.includes(item.key),
                  )
                : explorationRuleLevel === ExplorationRule.DataView
                ? explorationPeculiarityList.filter((item) =>
                      formRules.includes(item.key),
                  )
                : explorationRuleLevel === ExplorationRule.Metadata
                ? explorationPeculiarityList.filter((item) =>
                      metadataRules.includes(item.key),
                  )
                : explorationPeculiarityList.filter(
                      (item) => !fieldRules.includes(item.key),
                  )
        setExplorationAttributeList(list)
        setShowRuleNameCheck(
            // explorationRuleLevel === ExplorationRule.Metadata ||
            explorationType === ExplorationType.Datasource &&
                explorationRuleLevel === ExplorationRule.Field,
        )
    }, [explorationType, explorationRuleLevel, activeKey])

    useEffect(() => {
        const list = tableList?.filter((o) => !o.draft)
        if (explorationRuleLevel === ExplorationRule.Metadata) {
            // const flattenRules = tableList.reduce((acc, item) => {
            //     return acc.concat(item.rules || [])
            // }, [])

            setCheckedAll(
                list?.length > 0 && list.every((item) => item?.enable),
            )
        } else {
            setCheckedAll(
                list?.length > 0 && list?.every((item) => item?.enable),
            )
        }
    }, [tableList])

    useEffect(() => {
        if (!initSearch) return
        if (explorationType === ExplorationType.Datasource) {
            getDataSourceRuleList()
        } else {
            run({
                ...searchCondition,
                keyword: searchKey || '',
                current: 1,
            })
        }
    }, [searchCondition, initSearch])

    useEffect(() => {
        if (explorationData?.datasourceDataViewRuleList?.view?.rules) {
            const [rule] =
                explorationData?.datasourceDataViewRuleList?.view?.rules || []
            const update_period = JSON.parse(
                rule?.rule_config || '{}',
            )?.update_period
            setDataViewRuleConfig((pre) => ({
                ...pre,
                [rule?.rule_id || rule?.template_id]: update_period,
            }))
        }
    }, [explorationData?.datasourceDataViewRuleList])

    useEffect(() => {
        if (currentFieldId && explorationData?.dataStatisticsOptions?.length) {
            getAllRuleList()
        }
    }, [currentFieldId, explorationData?.dataStatisticsOptions])

    const getRuleList = async (params) => {
        let internalRuleList = explorationData?.internalRuleList
        try {
            if (isInit) {
                setIsLoading(true)
            }
            // let tempRuleList: any = []
            let enableTemplateRuleList = explorationData?.enableTemplateRuleList
            if (!enableTemplateRuleList?.length) {
                enableTemplateRuleList = await getTemplateRuleList({
                    offset: 1,
                    limit: 100,
                    enable: true,
                })
                setExplorationData((pre) => ({
                    ...pre,
                    enableTemplateRuleList,
                }))
            }
            if (!internalRuleList?.length) {
                internalRuleList = await getInternalRuleList()
                setExplorationData((pre) => ({
                    ...pre,
                    internalRuleList,
                    updateFieldList: params.updateFieldFlag,
                }))
            } else {
                setExplorationData((pre) => ({
                    ...pre,
                    updateFieldList: params.updateFieldFlag,
                }))
            }
            let list: IExploreRuleList[] = []

            const info = {
                ...params,
                dimension:
                    params?.dimension === ExplorationPeculiarity.All
                        ? undefined
                        : params?.dimension,
            }
            const {
                extra,
                filters,
                sorter,
                current,
                pageSize,
                updateFieldFlag,
                ...obj
            } = info
            // 元数据级需使用内置模版规则
            const action = getRuleActionMap('list', cssjj ? 'cssjj' : 'default')
            list = await action(obj)
            if (isViewMode) {
                list = list?.filter((o) => o.enable)
            }
            // if (explorationRuleLevel === ExplorationRule.Metadata) {
            //     const metadataList =
            //         internalRuleList
            //             ?.filter(
            //                 (item) => item.rule_level === explorationRuleLevel,
            //             )
            //             ?.map((item) => ({
            //                 ...item,
            //                 ...list?.find(
            //                     (it) => it.template_id === item.template_id,
            //                 ),
            //             })) || []
            //     // list = ruleGroup(
            //     //     uniqBy(metadataList, 'template_id'),
            //     //     undefined,
            //     //     isViewMode,
            //     // )
            //     list = metadataList
            //     tempRuleList = enableTemplateRuleList.filter(
            //         (o) =>
            //             o.rule_level === ExplorationRule.Metadata &&
            //             o.source === 'internal' &&
            //             metadataList
            //                 .filter((item) => !item.rule_id)
            //                 ?.map((item) => item.template_id)
            //                 ?.includes(o.rule_id),
            //     )
            //     if (tempRuleList?.length && initSearch) {
            //         await createRuleByTemplate(tempRuleList)
            //     }
            // }
            // if (
            //     explorationType === ExplorationType.FormView &&
            //     explorationRuleLevel === ExplorationRule.DataView &&
            //     !isViewMode &&
            //     !list?.find(
            //         (item: any) =>
            //             item.template_id === InternalRuleType.timeliness,
            //     ) &&
            //     activeKey !== ExplorationPeculiarity.Completeness
            // ) {
            //     if (!searchKey) {
            //         list.push(
            //             internalRuleList?.find(
            //                 (item) =>
            //                     item.template_id ===
            //                     InternalRuleType.timeliness,
            //             ),
            //         )
            //     }
            // }
            setTableList(list)
            return {
                total: list?.length || 0,
                list: list || [],
            }
        } catch (error) {
            formatError(error)
            return { total: 0, list: [] }
        } finally {
            setIsLoading(false)
            setIsInit(false)
            setExplorationData((pre) => ({
                ...pre,
                internalRuleList,
                updateRuleList: false,
            }))
        }
    }

    const getDataSourceRuleList = async () => {
        try {
            setIsLoading(true)
            let internalRuleList = explorationData?.internalRuleList
            let internalDatasouceRuleGroup =
                explorationData?.internalDatasouceRuleGroup
            let datasourceRuleConfig = explorationData?.datasourceRuleConfig
            if (!datasourceRuleConfig) {
                const configRes = await getDatasourceConfig(
                    explorationType === ExplorationType.Datasource
                        ? {
                              datasource_id: explorationData?.datasourceId,
                          }
                        : { form_view_id: dataViewId },
                )
                const config = configRes?.config
                    ? JSON.parse(configRes.config)
                    : {}
                setExplorationData((pre) => ({
                    ...pre,
                    datasourceRuleConfig: config,
                }))
                datasourceRuleConfig = config
            }
            if (!internalRuleList?.length) {
                internalRuleList = await getInternalRuleList()
                internalDatasouceRuleGroup = {
                    metadata: ruleGroup(
                        internalRuleList.filter((item) =>
                            datasourceExploreFieldMap.metadata.includes(
                                item.template_id,
                            ),
                        ),
                        datasourceRuleConfig?.metadata?.rules?.map(
                            (item) => item.rule_id,
                        ),
                        isViewMode,
                    ),
                    view: ruleGroup(
                        internalRuleList.filter((item) =>
                            datasourceExploreFieldMap.view.includes(
                                item.template_id,
                            ),
                        ),
                        datasourceRuleConfig?.view?.rules?.map(
                            (item) => item.rule_id,
                        ),
                        isViewMode,
                    ),
                    number: ruleGroup(
                        internalRuleList.filter((item) =>
                            datasourceExploreFieldMap.number.includes(
                                item.template_id,
                            ),
                        ),
                        datasourceRuleConfig?.field
                            ?.find((item) => item.field_type === 'number')
                            ?.rules?.map((item) => item.rule_id),
                        isViewMode,
                    ),
                    int: ruleGroup(
                        internalRuleList.filter((item) =>
                            datasourceExploreFieldMap.number.includes(
                                item.template_id,
                            ),
                        ),
                        datasourceRuleConfig?.field
                            ?.find((item) => item.field_type === 'int')
                            ?.rules?.map((item) => item.rule_id),
                        isViewMode,
                    ),
                    float: ruleGroup(
                        internalRuleList.filter((item) =>
                            datasourceExploreFieldMap.number.includes(
                                item.template_id,
                            ),
                        ),
                        datasourceRuleConfig?.field
                            ?.find((item) => item.field_type === 'float')
                            ?.rules?.map((item) => item.rule_id),
                        isViewMode,
                    ),
                    decimal: ruleGroup(
                        internalRuleList.filter((item) =>
                            datasourceExploreFieldMap.number.includes(
                                item.template_id,
                            ),
                        ),
                        datasourceRuleConfig?.field
                            ?.find((item) => item.field_type === 'decimal')
                            ?.rules?.map((item) => item.rule_id),
                        isViewMode,
                    ),
                    char: ruleGroup(
                        internalRuleList.filter((item) =>
                            datasourceExploreFieldMap.char.includes(
                                item.template_id,
                            ),
                        ),
                        datasourceRuleConfig?.field
                            ?.find((item) => item.field_type === 'char')
                            ?.rules?.map((item) => item.rule_id),
                        isViewMode,
                    ),
                    date: ruleGroup(
                        internalRuleList.filter((item) =>
                            datasourceExploreFieldMap.date.includes(
                                item.template_id,
                            ),
                        ),
                        datasourceRuleConfig?.field
                            ?.find((item) => item.field_type === 'date')
                            ?.rules?.map((item) => item.rule_id),
                        isViewMode,
                    ),
                    datetime: ruleGroup(
                        internalRuleList.filter((item) =>
                            datasourceExploreFieldMap.datetime.includes(
                                item.template_id,
                            ),
                        ),
                        datasourceRuleConfig?.field
                            ?.find((item) => item.field_type === 'datetime')
                            ?.rules?.map((item) => item.rule_id),
                        isViewMode,
                    ),
                    time: ruleGroup(
                        internalRuleList.filter((item) =>
                            datasourceExploreFieldMap.time.includes(
                                item.template_id,
                            ),
                        ),
                        datasourceRuleConfig?.field
                            ?.find((item) => item.field_type === 'time')
                            ?.rules?.map((item) => item.rule_id),
                        isViewMode,
                    ),
                    bool: ruleGroup(
                        internalRuleList.filter((item) =>
                            datasourceExploreFieldMap.bool.includes(
                                item.template_id,
                            ),
                        ),
                        datasourceRuleConfig?.field
                            ?.find((item) => item.field_type === 'bool')
                            ?.rules?.map((item) => item.rule_id),
                        isViewMode,
                    ),
                }
                setExplorationData((pre) => ({
                    ...pre,
                    internalRuleList,
                    internalDatasouceRuleGroup,
                }))
            }
            if (datasourceRuleConfig?.view?.rules?.length) {
                datasourceRuleConfig?.view?.rules?.forEach((item) => {
                    // 接口返回配置
                    const update_period = JSON.parse(
                        item.rule_config,
                    )?.update_period
                    if (!dataViewRuleConfig?.[item?.rule_id]) {
                        setDataViewRuleConfig({
                            ...dataViewRuleConfig,
                            [item?.rule_id]: update_period,
                        })
                    }
                })
                // internalDatasouceRuleGroup[currentFieldId]?.forEach((item) => {
                //     const update_period = JSON.parse(
                //         item.rule_config,
                //     )?.update_period
                // })
            }

            const list: any[] =
                explorationRuleLevel === ExplorationRule.Field
                    ? currentFieldId
                        ? internalDatasouceRuleGroup[currentFieldId]
                        : []
                    : internalDatasouceRuleGroup?.[explorationRuleLevel] || []
            setDataSourceTableList(list)
        } catch (error) {
            formatError(error)
        } finally {
            setIsLoading(false)
        }
    }

    const { tableProps, run, pagination } = useAntdTable(getRuleList, {
        defaultPageSize: 10,
        manual: true,
    })

    const props = useMemo(() => {
        const p: { dataSource; onChange; [key: string]: any } = tableProps
        return p
    }, [tableProps])

    const onEnableChangeAll = async (checked: boolean) => {
        try {
            setCheckedAll(checked)
            const temp: any = []
            const rule: any = []
            tableList
                ?.filter((item) => !item.draft)
                .forEach((item) => {
                    if (item.rule_id) {
                        rule.push({ ...item, enable: checked })
                    } else {
                        temp.push({
                            ...item,
                            enable: checked,
                        })
                    }
                })
            // 批量编辑规则状态
            if (rule.length) {
                const rule_ids = rule?.map(
                    (item) => item.rule_id || item.template_id,
                )
                await editExploreRuleStatus({ rule_ids, enable: checked })
            }
            // 批量创建规则
            if (temp.length) {
                await Promise.all(
                    temp.map((item) =>
                        createExploreRule({
                            form_view_id: dataViewId,
                            template_id: item.template_id,
                            rule_config: item?.rule_config,
                            enable: checked,
                        }),
                    ),
                )
            }
            run({ ...searchCondition, updateFieldFlag: true })
        } catch (err) {
            formatError(err)
        }
    }

    // // 根据规则模板创建规则
    // const createRuleByTemplate = async (
    //     rules: any[],
    //     updateFieldFlag?: boolean,
    // ) => {
    //     try {
    //         if (rules.length) {
    //             await Promise.all(
    //                 rules.map((item) =>
    //                     createExploreRule({
    //                         form_view_id: dataViewId,
    //                         template_id: item.rule_id,
    //                         rule_config: item?.rule_config,
    //                         enable: true,
    //                     }),
    //                 ),
    //             )
    //         }
    //         run({ ...searchCondition, updateFieldFlag })
    //     } catch (err) {
    //         formatError(err)
    //     }
    // }

    // const onMetadataEnableChangeAll = async (checked: boolean) => {
    //     try {
    //         setCheckedAll(checked)
    //         const temp: any = []
    //         const rules: any = []
    //         tableList.forEach((item) => {
    //             item.rules.forEach((rule) => {
    //                 if (rule.rule_id) {
    //                     rules.push(rule)
    //                 } else {
    //                     temp.push(rule)
    //                 }
    //             })
    //         })
    //         // 批量编辑规则状态
    //         if (rules.length) {
    //             const rule_ids = rules?.map((item) => item.rule_id)
    //             const action = cssjj
    //                 ? editExploreRuleStatusCssjj
    //                 : editExploreRuleStatus
    //             await action({ rule_ids, enable: checked })
    //         }
    //         // 批量创建规则
    //         if (temp.length) {
    //             await Promise.all(
    //                 temp.map((item) =>
    //                     createExploreRule({
    //                         form_view_id: dataViewId,
    //                         template_id: item.template_id,
    //                         enable: checked,
    //                     }),
    //                 ),
    //             )
    //         }
    //         run(searchCondition)
    //     } catch (err) {
    //         formatError(err)
    //     }
    // }

    const onEnableChange = async (
        checked: boolean,
        row: any,
        type?: string,
    ) => {
        try {
            // 没有规则id，创建规则
            if (
                !row?.rule_id &&
                (explorationRuleLevel === ExplorationRule.Metadata ||
                    row.template_id === InternalRuleType.timeliness)
            ) {
                let params = {}
                if (explorationRuleLevel === ExplorationRule.Metadata) {
                    params = {
                        template_id: row?.template_id || '',
                        form_view_id: dataViewId,
                        enable: checked,
                    }
                } else if (row.template_id === InternalRuleType.timeliness) {
                    params = {
                        form_view_id: dataViewId,
                        template_id: row?.template_id || '',
                        enable: checked,
                        rule_config: JSON.stringify({
                            update_period:
                                dataViewRuleConfig?.[row?.template_id] || '',
                        }),
                    }
                }
                await createExploreRule(params)
            } else {
                // 有规则id，编辑规则状态
                await editExploreRuleStatus({
                    rule_ids: [row?.rule_id],
                    enable: checked,
                })
            }
            run({ ...searchCondition, updateFieldFlag: true })
        } catch (err) {
            formatError(err)
        }
    }

    const editRule = async (params) => {
        try {
            await editExploreRule(params)
            // message.success(__('编辑成功'))
        } catch (err) {
            formatError(err)
        }
    }

    const onCheckChange = (
        checked: boolean,
        templateId: string,
        dimensionKey: string,
    ) => {
        const newDataSourceTableList = dataSourceTableList.map((group) => {
            if (group.dimension === dimensionKey) {
                return {
                    ...group,
                    rules: group.rules.map((rule) =>
                        rule.template_id === templateId
                            ? { ...rule, checked }
                            : rule,
                    ),
                }
            }
            return group
        })
        setDataSourceTableList(newDataSourceTableList)
    }

    const columns: any = [
        {
            title: (
                <span>
                    {__('规则名称')}
                    {/* {explorationRuleLevel === ExplorationRule.Metadata &&
                        !explorationData?.viewMode && (
                            <Switch
                                checked={checkedAll}
                                style={{ marginLeft: '8px' }}
                                onChange={(ck) => onMetadataEnableChangeAll(ck)}
                                size="small"
                            />
                        )} */}
                </span>
            ),
            dataIndex: 'rule_name',
            key: 'rule_name',
            width: 260,
            ellipsis: true,
            render: (text, record) => {
                return (
                    <div>
                        {showRuleNameCheck ? (
                            <Space size={8}>
                                {record?.rules?.map((item, index) => {
                                    return (
                                        <Checkbox
                                            key={index}
                                            disabled={explorationData?.viewMode}
                                            checked={item?.enable}
                                            style={{ marginRight: '8px' }}
                                            onChange={(o) =>
                                                onEnableChange(
                                                    o?.target?.checked,
                                                    item,
                                                )
                                            }
                                        >
                                            <Tooltip
                                                title={item?.rule_description}
                                                overlayStyle={{ maxWidth: 600 }}
                                            >
                                                {item?.rule_name}
                                            </Tooltip>
                                        </Checkbox>
                                    )
                                })}
                            </Space>
                        ) : (
                            <div className={styles.ellipsis} title={text}>
                                {text}
                            </div>
                        )}
                    </div>
                )
            },
        },
        {
            title:
                explorationRuleLevel === ExplorationRule.Field
                    ? __('质量/统计维度')
                    : __('质量维度'),
            dataIndex: 'dimension',
            key: 'dimension',
            width: 160,
            ellipsis: true,
            render: (text, record) =>
                explorationPeculiarityList?.find((item) => item.key === text)
                    ?.label || '--',
        },
        {
            title: __('规则描述'),
            dataIndex: 'rule_description',
            key: 'rule_description',
            ellipsis: true,
            render: (text, record) => (
                <div className={styles.ellipsis}>
                    {text || (
                        <span style={{ color: 'rgba(0 0 0 / 45%)' }}>
                            {__('暂无描述')}
                        </span>
                    )}
                </div>
            ),
        },
        {
            title: __('规则配置'),
            dataIndex: 'rule_config',
            key: 'rule_config',
            width:
                explorationType === ExplorationType.Datasource ? 'auto' : 480,
            ellipsis: true,
            render: (text, record) => {
                const datasourceDisabled =
                    explorationData?.viewMode || !record?.rules?.[0]?.checked
                const disabled =
                    isViewMode ||
                    (explorationType === ExplorationType.FormView
                        ? !record?.enable
                        : datasourceDisabled)
                return record?.template_id === InternalRuleType.timeliness ? (
                    <Radio.Group
                        onChange={(e) => onRuleConfigChange(e, record)}
                        value={
                            dataViewRuleConfig?.[record?.template_id] ||
                            TimelinessRule.Month
                        }
                        disabled={disabled}
                    >
                        {TimelinessRuleList.map((item) => (
                            <Radio key={item.value} value={item.value}>
                                {item.label}
                            </Radio>
                        ))}
                    </Radio.Group>
                ) : (
                    '--'
                )
            },
        },
        {
            title:
                // (explorationRuleLevel === ExplorationRule.Field &&
                //     activeKey === ExplorationPeculiarity.All) ||
                // (explorationRuleLevel === ExplorationRule.DataView &&
                //     activeKey === ExplorationPeculiarity.Timeliness)
                // 数据源、库表-字段级全部维度、库表-库表级及时性维度、不显示表头启用开关
                explorationType === ExplorationType.Datasource ? (
                    __('是否启用')
                ) : (
                    <span>
                        {__('启用全部')}
                        <Tooltip
                            title={
                                disabledCheckedAll
                                    ? __('存在未配置规则字段，请先完善配置')
                                    : ''
                            }
                        >
                            <Switch
                                checked={checkedAll}
                                disabled={disabledCheckedAll}
                                style={{ marginLeft: '8px' }}
                                onChange={(ck) => onEnableChangeAll(ck)}
                                size="small"
                            />
                        </Tooltip>
                    </span>
                ),
            dataIndex: 'enable',
            key: 'enable',
            ellipsis: true,
            width:
                explorationType === ExplorationType.Datasource ? 280 : 'auto',
            render: (text, record) => {
                return (
                    <Tooltip
                        title={
                            record.draft ? __('规则字段未配置，请前往配置') : ''
                        }
                    >
                        <Switch
                            checked={text || record?.rules?.[0]?.checked}
                            style={{ marginLeft: '8px' }}
                            disabled={record.draft}
                            onChange={(o) => {
                                if (
                                    explorationType ===
                                    ExplorationType.Datasource
                                ) {
                                    setDataSourceTableList((prev) =>
                                        prev.map((item) => ({
                                            ...item,
                                            rules: item.rules.map((rule) => ({
                                                ...rule,
                                                checked: o,
                                            })),
                                        })),
                                    )
                                    setExplorationData((pre) => ({
                                        ...pre,
                                        datasourceDataViewRuleList: o
                                            ? {
                                                  view: {
                                                      rules: [
                                                          {
                                                              rule_id:
                                                                  record?.template_id,
                                                              dimension:
                                                                  record.dimension,
                                                              rule_config:
                                                                  JSON.stringify(
                                                                      {
                                                                          update_period:
                                                                              dataViewRuleConfig?.[
                                                                                  record
                                                                                      ?.template_id
                                                                              ] ||
                                                                              TimelinessRule.Month,
                                                                      },
                                                                  ),
                                                          },
                                                      ],
                                                  },
                                              }
                                            : {},
                                    }))
                                } else {
                                    onEnableChange(o, record, 'enable')
                                }
                            }}
                            size="small"
                        />
                    </Tooltip>
                )
            },
        },
        {
            title: __('操作'),
            dataIndex: 'action',
            key: 'action',
            ellipsis: true,
            width: 160,
            render: (text, record) => {
                const internalRuleList = explorationData?.internalRuleList
                const showDelBtn =
                    !!record?.rule_id &&
                    !InternalTemplateIdList.includes(record?.template_id)
                const noEditTemplateIds = [
                    InternalRuleType.Repeat,
                    // InternalRuleType.timeliness,
                ]
                const showEditBtn = !internalRuleList
                    ?.filter(
                        (item) =>
                            item.dimension ===
                                ExplorationPeculiarity.DataStatistics ||
                            noEditTemplateIds.includes(item.template_id),
                    )
                    ?.map((item) => item.template_id)
                    .includes(record?.template_id)
                const btnList = [
                    {
                        label: __('详情'),
                        status: OperateType.DETAIL,
                        show: showEditBtn,
                    },
                    {
                        label: __('编辑'),
                        status: OperateType.EDIT,
                        show: showEditBtn,
                    },
                    {
                        label: __('删除'),
                        status: OperateType.DELETE,
                        show: showDelBtn,
                    },
                ]

                const filterBtns = explorationData?.viewMode
                    ? [
                          {
                              label: __('详情'),
                              status: OperateType.DETAIL,
                              show: showEditBtn,
                          },
                      ]
                    : btnList

                return (
                    <Space size={16}>
                        {filterBtns
                            .filter((item) => item.show)
                            .map((item: any) => {
                                const isDraft =
                                    item.status === OperateType.EDIT &&
                                    record.draft
                                return (
                                    <Tooltip
                                        title={
                                            isDraft
                                                ? __(
                                                      '规则字段未配置，请前往配置',
                                                  )
                                                : ''
                                        }
                                    >
                                        <Badge dot={isDraft}>
                                            <a
                                                onClick={() => {
                                                    handleOperate(
                                                        item.status,
                                                        record,
                                                    )
                                                }}
                                            >
                                                {item.label}
                                            </a>
                                        </Badge>
                                    </Tooltip>
                                )
                            })}
                    </Space>
                )
            },
        },
    ]

    const datasourceColumns = [
        {
            title: __('质量维度'),
            dataIndex: 'dimension',
            key: 'dimension',
            width: 160,
            ellipsis: true,
            render: (text, record) =>
                explorationPeculiarityList?.find((item) => item.key === text)
                    ?.label || '--',
        },
        {
            title: (
                <span>
                    {__('规则名称')}
                    {explorationRuleLevel === ExplorationRule.Metadata &&
                        !explorationData?.viewMode && (
                            <Switch
                                checked={
                                    getDatasourceExplorationField(
                                        explorationData?.internalDatasouceRuleGroup,
                                        'metadata',
                                    )?.length ===
                                    datasourceExploreFieldMap.metadata?.length
                                }
                                style={{ marginLeft: '8px' }}
                                onChange={(ck) => {
                                    const list = dataSourceTableList.map(
                                        (it) => {
                                            return {
                                                ...it,
                                                rules: it.rules.map((item) => ({
                                                    ...item,
                                                    checked: ck,
                                                })),
                                            }
                                        },
                                    )
                                    setDataSourceTableList(list)
                                }}
                                size="small"
                            />
                        )}
                </span>
            ),
            dataIndex: 'rule_name',
            key: 'rule_name',
            width: 260,
            ellipsis: true,
            render: (text, record) => {
                return (
                    <Space size={8}>
                        {record?.rules?.map((item, index) => {
                            return (
                                <Checkbox
                                    key={item.template_id}
                                    checked={item.checked}
                                    disabled={explorationData?.viewMode}
                                    style={{ marginRight: '8px' }}
                                    onChange={(e) =>
                                        onCheckChange(
                                            e.target.checked,
                                            item.template_id,
                                            record.dimension,
                                        )
                                    }
                                >
                                    <Tooltip
                                        title={item.rule_description}
                                        overlayStyle={{ maxWidth: 600 }}
                                    >
                                        {item.rule_name}
                                    </Tooltip>
                                </Checkbox>
                            )
                        })}
                    </Space>
                )
            },
        },
    ]

    const getTableColumn = () => {
        const tableColumnKeys = {
            datasource: ['dimension', 'rule_name'],
            datasourceDataView: [
                'rule_name',
                'rule_description',
                'enable',
                'rule_config',
            ],
            formViewMeat: [
                'rule_name',
                'dimension',
                'rule_description',
                'enable',
            ],
            formViewDataView: [
                'rule_name',
                'dimension',
                'rule_description',
                'enable',
                // 'rule_config',
                'action',
            ],
            formViewFiedAndRow: [
                'rule_name',
                'dimension',
                'rule_description',
                'enable',
                'action',
            ],
        }
        let key: string = ''
        if (explorationType === ExplorationType.Datasource) {
            key =
                explorationRuleLevel === ExplorationRule.DataView
                    ? 'datasourceDataView'
                    : 'datasource'
        } else {
            key =
                explorationRuleLevel === ExplorationRule.Metadata
                    ? 'formViewMeat'
                    : explorationRuleLevel === ExplorationRule.DataView
                    ? 'formViewDataView'
                    : 'formViewFiedAndRow'
        }
        const filterKeys: string[] = []
        if (explorationData?.viewMode) {
            filterKeys.push('enable')
        }
        // if (
        //     explorationRuleLevel === ExplorationRule.DataView &&
        //     activeKey === ExplorationPeculiarity.Timeliness
        // ) {
        //     filterKeys.push('action')
        // }
        if (
            explorationRuleLevel === ExplorationRule.DataView &&
            activeKey === ExplorationPeculiarity.Completeness
        ) {
            filterKeys.push('rule_config')
        }

        const showKeys = tableColumnKeys[key]?.filter(
            (o) => !filterKeys.includes(o),
        )

        const list =
            showKeys?.map((item) => columns.find((it) => it.key === item)) || []
        return list
    }

    const handleOperate = (op: OperateType, item: any) => {
        setOperateType(op)
        setCurrentRuleInfo(item)
        setExplorationData((pre) => ({
            ...pre,
            currentRuleInfo: {
                ...item,
                rule_name: '规则名称',
                rule_description: '规则描述描述描述',
            },
        }))
        if (op === OperateType.EDIT) {
            setinternalRule(!!item?.template_id || false)
            setRulesModalOpen(true)
        } else if (op === OperateType.DELETE) {
            setDelVisible(true)
        } else if (op === OperateType.DETAIL) {
            setRulesDetailsOpen(true)
        }
    }

    const onRuleConfigChange = (e, record) => {
        const { value } = e.target
        setDataViewRuleConfig({
            ...dataViewRuleConfig,
            [record?.template_id]: value,
        })
        if (record?.rule_id) {
            editRule({
                ...record,
                id: record?.rule_id,
                rule_config: JSON.stringify({
                    update_period: value,
                }),
            })
        }
        if (explorationType === ExplorationType.Datasource) {
            const enable = record?.rules?.[0]?.checked
            // 库表级探查规则单独处理参数，提交时单独获取
            setExplorationData((pre) => ({
                ...pre,
                datasourceDataViewRuleList: enable
                    ? {
                          view: {
                              rules: [
                                  {
                                      rule_id: record?.template_id,
                                      dimension: record.dimension,
                                      rule_config: JSON.stringify({
                                          update_period: value,
                                      }),
                                  },
                              ],
                          },
                      }
                    : {},
            }))
        }
    }

    const handleDelete = async () => {
        try {
            setDelBtnLoading(true)
            if (!currentRuleInfo) return
            await delExploreRule(currentRuleInfo.rule_id)
            setDelBtnLoading(false)
            message.success(__('删除成功'))
        } catch (e) {
            formatError(e)
        } finally {
            setDelBtnLoading(false)
            setDelVisible(false)
            run({ ...searchCondition, updateFieldFlag: true })
            if (
                currentRuleInfo?.dimension ===
                ExplorationPeculiarity.DataStatistics
            ) {
                getAllRuleList()
            }
        }
    }

    const renderEmpty = () => {
        return (
            <Empty
                desc={
                    explorationRuleLevel === ExplorationRule.Field &&
                    explorationData?.explorationType ===
                        ExplorationType.Datasource
                        ? __('请先选择左侧数据类型')
                        : __('暂无数据')
                }
                iconSrc={dataEmpty}
            />
        )
    }

    const getAllRuleList = async () => {
        try {
            if (
                explorationRuleLevel !== ExplorationRule.Field ||
                explorationType === ExplorationType.Datasource
            ) {
                setCreatedDataStatisticsIds([])
                return
            }
            const action = getRuleActionMap('list', cssjj ? 'cssjj' : 'default')

            const res = await action({
                offset: 1,
                limit: 1000,
                form_view_id: explorationData?.dataViewId,
                field_id: explorationData?.activeField?.id,
                rule_level: explorationData?.explorationRule,
            })
            const ids: any =
                res
                    ?.filter((item) => !!item.template_id)
                    ?.map((item) => item.template_id) || []
            setCreatedDataStatisticsIds(ids)
        } catch (err) {
            formatError(err)
        }
    }

    const onTemplateOk = async (data: any[]) => {
        try {
            if (!data.length) return
            const list = data.map((o) => {
                const draftType = ['row_repeat', 'row_null']
                const customRule = isCustomRule(
                    JSON.parse(o?.rule_config || '{}'),
                )
                const rule_name = getUniqueName(
                    o.rule_name,
                    tableList?.map((i) => i.rule_name),
                )
                const draft = draftType.includes(o.dimension_type) || customRule
                return {
                    ...o,
                    draft,
                    rule_name,
                }
            })
            await Promise.all(
                list.map((item) =>
                    createExploreRule({
                        form_view_id: dataViewId,
                        rule_config: item?.rule_config,
                        field_id: explorationData?.activeField?.id,
                        enable: item.draft === 0,
                        draft: item.draft,
                        dimension: item.dimension,
                        dimension_type: item.dimension_type,
                        rule_name: item.rule_name,
                        rule_description: item.rule_description,
                        rule_level: item.rule_level,
                    }),
                ),
            )
            run({ ...searchCondition, updateFieldFlag: true })
            setSelectedTemplateRuleOpen(false)
        } catch (err) {
            formatError(err)
        }
    }

    return (
        <div className={styles.explorationAttributeWrapper}>
            {showType && (
                <div className={styles.firstLine}>
                    <Space size={16}>
                        {explorationAttributeList.map((item) => {
                            return (
                                <div
                                    key={item.key}
                                    className={classnames(
                                        styles.attributeItem,
                                        activeKey === item.key && styles.active,
                                    )}
                                    onClick={() => {
                                        setActiveKey(item.key)
                                        setSearchCondition({
                                            ...searchCondition,
                                            dimension: item.key,
                                        })
                                    }}
                                >
                                    {item.label}
                                </div>
                            )
                        })}
                    </Space>
                    <Space
                        size={8}
                        hidden={
                            !explorationData?.viewMode ||
                            (tableList?.length === 0 && !searchKey)
                        }
                    >
                        <SearchInput
                            maxLength={255}
                            value={searchKey}
                            onKeyChange={(kw: string) => {
                                if (kw) {
                                    setSearchCondition({
                                        ...searchCondition,
                                        offset: 1,
                                        keyword: kw,
                                    })
                                }
                                setSearchKey(kw)
                            }}
                            // 解决清除按钮接口调用2次
                            onChange={(e) => {
                                const { value } = e.target
                                if (!value) {
                                    setSearchCondition({
                                        ...searchCondition,
                                        offset: 1,
                                        keyword: undefined,
                                    })
                                }
                            }}
                            className={styles['taskBox-search-inp']}
                            style={{ width: 272 }}
                            placeholder={__('搜索规则名称')}
                        />
                        <RefreshBtn onClick={() => run(searchCondition)} />
                    </Space>
                </div>
            )}

            {showOperation && !explorationData?.viewMode && (
                <div className={styles.secLine}>
                    <Space size={8}>
                        <Tooltip
                            title={disabledCreatedTips || ''}
                            overlayInnerStyle={{
                                width: '206px',
                            }}
                        >
                            <Button
                                className={classnames(
                                    !disabledCreatedTips && styles.addBtn,
                                )}
                                icon={<AddOutlined />}
                                disabled={!!disabledCreatedTips}
                                onClick={() => {
                                    if (
                                        explorationRuleLevel ===
                                            ExplorationRule.Field &&
                                        !explorationData?.activeField?.id
                                    ) {
                                        message.warning(__('请先选择字段'))
                                        return
                                    }
                                    setinternalRule(false)
                                    setRulesModalOpen(true)
                                    setCurrentRuleInfo({})
                                    setOperateType(OperateType.CREATE)
                                }}
                            >
                                {__('新建规则')}
                            </Button>
                        </Tooltip>
                        <Tooltip
                            title={disabledCreatedTips || ''}
                            overlayInnerStyle={{
                                width: '206px',
                            }}
                        >
                            <Button
                                onClick={() => {
                                    setSelectedTemplateRuleOpen(true)
                                }}
                                disabled={!!disabledCreatedTips}
                                className={classnames(
                                    !disabledCreatedTips && styles.addBtn,
                                )}
                            >
                                {__('从模板中新建')}
                            </Button>
                        </Tooltip>
                    </Space>
                    <Space
                        size={8}
                        hidden={!searchKey && tableList?.length === 0}
                    >
                        <SearchInput
                            maxLength={255}
                            value={searchKey}
                            onKeyChange={(kw: string) => {
                                if (kw) {
                                    setSearchCondition({
                                        ...searchCondition,
                                        offset: 1,
                                        keyword: kw,
                                    })
                                }
                                setSearchKey(kw)
                            }}
                            // 解决清除按钮接口调用2次
                            onChange={(e) => {
                                const { value } = e.target
                                if (!value) {
                                    setSearchCondition({
                                        ...searchCondition,
                                        offset: 1,
                                        keyword: undefined,
                                    })
                                }
                            }}
                            className={styles['taskBox-search-inp']}
                            style={{ width: 272 }}
                            placeholder={__('搜索规则名称')}
                        />
                        <RefreshBtn onClick={() => run(searchCondition)} />
                    </Space>
                </div>
            )}
            {isLoading ? (
                <Loader />
            ) : isEmpty ? (
                renderEmpty()
            ) : explorationType === ExplorationType.FormView ? (
                // 库表探查规则表格
                <Table
                    rowKey={(record, index) => index || 0}
                    columns={
                        // activeKey !== ExplorationPeculiarity.All
                        //     ? getTableColumn()?.filter(
                        //           (item) => item.key !== 'dimension',
                        //       )
                        //     :
                        getTableColumn()
                    }
                    {...props}
                    loading={false}
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: pagination.total,
                        showSizeChanger: false,
                        hideOnSinglePage: true,
                    }}
                    scroll={{
                        y: `calc(100vh - ${attributeHeight}px)`,
                        x: 1080,
                    }}
                />
            ) : (
                // 数据源探查规则表格
                <Table
                    rowKey="template_id"
                    columns={
                        // 数据源探查 - 库表级使用库表探查规则列
                        explorationRuleLevel === ExplorationRule.DataView &&
                        explorationType === ExplorationType.Datasource
                            ? getTableColumn()
                            : datasourceColumns
                    }
                    dataSource={dataSourceTableList}
                    loading={false}
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: pagination.total,
                        showSizeChanger: false,
                        hideOnSinglePage: true,
                    }}
                    scroll={{
                        y: 'calc(100vh - 274px)',
                        x: 1300,
                    }}
                />
            )}
            {rulesModalOpen && (
                <RulesModal
                    open={rulesModalOpen}
                    onClose={(flag) => {
                        setRulesModalOpen(false)
                        if (flag) {
                            run({ ...searchCondition, updateFieldFlag: true })
                            if (
                                flag?.dimension ===
                                ExplorationPeculiarity.DataStatistics
                            ) {
                                getAllRuleList()
                            }
                        }
                    }}
                    ruleType={
                        operateType === OperateType.EDIT
                            ? currentRuleInfo?.dimension
                            : activeKey
                    }
                    ruleId={currentRuleInfo?.rule_id}
                    ruleList={ruleList}
                />
            )}
            {rulesDetailsOpen && (
                <RulesDetails
                    open={rulesDetailsOpen}
                    onClose={() => {
                        setRulesDetailsOpen(false)
                    }}
                    ruleId={currentRuleInfo?.rule_id}
                />
            )}
            {selectedTemplateRuleOpen && (
                <SelectedTemplateRule
                    open={selectedTemplateRuleOpen}
                    onClose={() => {
                        setSelectedTemplateRuleOpen(false)
                    }}
                    onOk={(data: any[]) => {
                        onTemplateOk(data)
                    }}
                    dimensionList={ruleList
                        ?.filter(
                            (o) =>
                                o.value !==
                                ExplorationPeculiarity.DataStatistics,
                        )
                        .map((o) => o.value)}
                    isMultiple={
                        explorationRuleLevel !== ExplorationRule.DataView
                    }
                    isExistTimeliness={isExistTimeliness}
                    createdRuleList={tableList}
                    ruleLevel={explorationRuleLevel}
                />
            )}
            {/* 删除 */}
            <Confirm
                open={delVisible}
                title={__('确定要删除规则吗？')}
                content={__('删除后该规则将无法找回，请谨慎操作！')}
                onOk={handleDelete}
                onCancel={() => {
                    setDelVisible(false)
                }}
                width={410}
                okButtonProps={{ loading: delBtnLoading }}
            />
        </div>
    )
}

export default ExplorationAttribute
