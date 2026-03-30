import React, { useEffect, useState } from 'react'
import { Checkbox, Table, Switch, Tooltip } from 'antd'
import { useUpdateEffect } from 'ahooks'
import styles from './styles.module.less'
import __ from '../locale'
import { ruleTables, ExplorationType } from './const'
import {
    ruleTypeList,
    qualityRules,
    FormatDataType,
    statisticsType,
} from '@/components/DatasheetView/DataQuality/const'
import {
    formatError,
    getProjectsConfigRule,
    getDatasourceConfig,
    getDatasheetViewDetails,
} from '@/core'
import Empty from '@/ui/Empty'
import Loader from '@/ui/Loader'
import { FormatDataTypeToText } from '@/components/DatasheetView/DataQuality/helper'

interface IExplorationRulesTable {
    datasourceId?: string
    formViewId?: string
    isDetails?: boolean
    explorationType?: ExplorationType
    onRuleChange?: (o, ids?: string[]) => void
}
const ExplorationRulesTable = (props: IExplorationRulesTable) => {
    const {
        datasourceId,
        formViewId = '',
        isDetails = false,
        explorationType = ExplorationType.Datasource,
        onRuleChange,
    } = props
    const [tableData, setTableData] = useState<any>([])
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [selectedIds, setSelectedIds] = useState<any[]>([])
    const [fieldType, setFieldType] = useState<string>(
        explorationType === ExplorationType.Datasource
            ? 'field_type_conf'
            : 'field_config',
    )

    const formViewTableKeys = ['field_name_cn', 'data_type', 'description']
    const datasourceTableKeys = ['name']

    useEffect(() => {
        init()
    }, [])

    useUpdateEffect(() => {
        initRule(tableData, selectedIds)
    }, [selectedIds, tableData])

    const rowSelection = {
        // 表格rowKey
        selectedRowKeys: selectedIds,
        onChange: (val: React.Key[]) => {
            setSelectedIds(val)
        },
    }

    const column: Array<any> = [
        {
            title: __('字段类型'),
            dataIndex: 'name',
            ellipsis: true,
            width: 140,
        },
        {
            title: __('字段业务名称/技术名称'),
            dataIndex: 'field_name_cn',
            ellipsis: true,
            width: isDetails ? 260 : 300,
            render: (_, record) => {
                return (
                    <div className={styles.fieldNames}>
                        <div
                            className={styles.fieldCnNames}
                            title={record.business_name}
                        >
                            {record.business_name || '--'}
                        </div>
                        <div
                            className={styles.fieldEnNames}
                            title={record.technical_name}
                        >
                            {record.technical_name}
                        </div>
                    </div>
                )
            },
        },
        {
            title: __('字段类型'),
            dataIndex: 'data_type',
            ellipsis: true,
            width: 120,
            render: (_) => {
                const text = _ ? FormatDataTypeToText(_) : '--'
                return <span title={text}>{text}</span>
            },
        },
        {
            title: __('字段备注'),
            dataIndex: 'description',
            ellipsis: true,
            render: (text) => text || '--',
            width: 120,
        },
        {
            title: (
                <>
                    {!isDetails && (
                        <span
                            style={{
                                color: 'rgba(230, 0, 18, 1)',
                                marginRight: '5px',
                            }}
                        >
                            *
                        </span>
                    )}
                    {__('规则')}
                </>
            ),
            width: explorationType === ExplorationType.FormView ? 800 : 'auto',
            dataIndex: 'rule',
            ellipsis: true,
            render: (_, record) => {
                const qualityCheckedSum = record.allRule.filter(
                    (item) => item.isQualityRules && item.checked,
                )?.length
                const statisticsCheckedSum = record.allRule.filter(
                    (item) => !item.isQualityRules && item.checked,
                )?.length
                // 统计规则
                return (
                    <div className={styles.ruleCheckbox}>
                        <div>
                            <span>{__('数据统计：')}</span>
                            <Switch
                                className={styles.ruleSwitch}
                                checked={statisticsCheckedSum > 0}
                                size="small"
                                disabled={
                                    isDetails ||
                                    (explorationType ===
                                        ExplorationType.FormView &&
                                        !selectedIds?.includes(
                                            record.technical_name,
                                        ))
                                }
                                onChange={(val) =>
                                    onSwitchChange(
                                        val,
                                        record,
                                        statisticsType.statistics,
                                    )
                                }
                            />
                            <div className={styles.moreRules}>
                                {record.allRule
                                    .filter((item) => !item.isQualityRules)
                                    .map((item) => {
                                        return (
                                            <Tooltip
                                                key={item.code}
                                                title={item.description}
                                                placement="bottom"
                                            >
                                                <Checkbox
                                                    disabled={
                                                        isDetails ||
                                                        (explorationType ===
                                                            ExplorationType.FormView &&
                                                            !selectedIds?.includes(
                                                                record.technical_name,
                                                            ))
                                                    }
                                                    checked={item.checked}
                                                    onChange={(e) =>
                                                        ruleChange(
                                                            e,
                                                            record,
                                                            item,
                                                        )
                                                    }
                                                >
                                                    {item.name}
                                                </Checkbox>
                                            </Tooltip>
                                        )
                                    })}
                            </div>
                        </div>
                        <div>
                            <span>{__('数据质量：')}</span>
                            <Switch
                                className={styles.ruleSwitch}
                                checked={qualityCheckedSum > 0}
                                size="small"
                                disabled={
                                    isDetails ||
                                    (explorationType ===
                                        ExplorationType.FormView &&
                                        !selectedIds?.includes(
                                            record.technical_name,
                                        ))
                                }
                                onChange={(val) =>
                                    onSwitchChange(
                                        val,
                                        record,
                                        statisticsType.quality,
                                    )
                                }
                            />
                            <div className={styles.moreRules}>
                                {record.allRule
                                    .filter((item) => item.isQualityRules)
                                    .map((item) => {
                                        return (
                                            <Tooltip
                                                key={item.code}
                                                title={item.description}
                                                placement="bottom"
                                            >
                                                <Checkbox
                                                    disabled={
                                                        isDetails ||
                                                        (explorationType ===
                                                            ExplorationType.FormView &&
                                                            !selectedIds?.includes(
                                                                record.technical_name,
                                                            ))
                                                    }
                                                    checked={item.checked}
                                                    onChange={(e) =>
                                                        ruleChange(
                                                            e,
                                                            record,
                                                            item,
                                                        )
                                                    }
                                                >
                                                    {item.name}
                                                </Checkbox>
                                            </Tooltip>
                                        )
                                    })}
                            </div>
                        </div>
                    </div>
                )
            },
        },
    ]

    const init = async () => {
        try {
            setIsLoading(true)
            const ruleRes = await getProjectsConfigRule()
            let list: any[] = []
            // 查询配置字段
            const configRes = await getDatasourceConfig(
                explorationType === ExplorationType.Datasource
                    ? {
                          datasource_id: datasourceId,
                      }
                    : { form_view_id: formViewId },
            )
            const configTable = configRes?.config
                ? JSON.parse(configRes.config)?.[fieldType]
                : []
            if (explorationType === ExplorationType.FormView) {
                const formViewRes = await getDatasheetViewDetails(formViewId)
                // 过滤已删除、二进制字段
                const { 99: other, ...allowFieldType } = ruleTypeList
                const tables = formViewRes?.fields?.filter(
                    (item) =>
                        item.status !== 'delete' &&
                        !!allowFieldType[FormatDataType(item?.data_type)],
                )
                const configIds = configTable?.map((it) => it.field_name)
                // 勾选已配置字段
                setSelectedIds(configIds)
                // 组装表格数据
                list = tables?.map((item) => {
                    const currentData = configTable?.find(
                        (it) => item.technical_name === it.field_name,
                    )
                    return {
                        ...item,
                        field_name: currentData?.technical_name,
                        rules: currentData?.rules,
                        allRule: ruleRes
                            .filter((it) =>
                                ruleTypeList[
                                    FormatDataType(item?.data_type)
                                ]?.includes(it.code),
                            )
                            .map((it) => {
                                // 已配置规则or详情，选中已配置规则，无配置规则，选中数据统计规则
                                return {
                                    ...it,
                                    checked:
                                        currentData?.rules || isDetails
                                            ? currentData?.rules?.includes(
                                                  it.code,
                                              )
                                            : !qualityRules.includes(it.code),
                                    isQualityRules: qualityRules.includes(
                                        it.code,
                                    ),
                                }
                            }),
                    }
                })
            } else {
                list = ruleTables.map((item) => {
                    // 已配置规则or详情 选中已配置规则，无配置规则，选中数据统计规则
                    const allRule = ruleRes
                        .filter((it) =>
                            ruleTypeList[item?.field_type]?.includes(it.code),
                        )
                        ?.map((it) => ({
                            ...it,
                            checked:
                                configTable?.length || isDetails
                                    ? configTable
                                          ?.find(
                                              (o) =>
                                                  o.field_type ===
                                                  item?.field_type,
                                          )
                                          ?.rules?.includes(it.code)
                                    : !qualityRules.includes(it.code),
                            isQualityRules: qualityRules.includes(it.code),
                        }))
                    return {
                        ...item,
                        allRule,
                    }
                })
            }
            setTableData(list)
        } catch (err) {
            formatError(err)
        } finally {
            setIsLoading(false)
        }
    }

    const ruleChange = (val, row, current) => {
        const { checked } = val.target
        const data = tableData.map((item) => {
            return {
                ...item,
                allRule:
                    item.technical_name === row.technical_name
                        ? item.allRule.map((it) => {
                              return {
                                  ...it,
                                  checked:
                                      current.code === it.code
                                          ? checked
                                          : it.checked,
                              }
                          })
                        : item.allRule,
            }
        })
        setTableData(data)
    }

    const initRule = (data: any[], ids: any[]) => {
        const rules = data.map((item) => {
            return {
                code_table_id: item.code_table_id,
                field_type:
                    explorationType === ExplorationType.FormView
                        ? item.technical_name
                        : item.field_type,
                rules:
                    item.allRule
                        .filter((it) => it.checked)
                        .map((it) => it.code) || undefined,
            }
        })
        onRuleChange?.(rules, ids)
    }

    const onSwitchChange = (checked, row, type: statisticsType) => {
        const data = tableData.map((item) => {
            return row.technical_name === item.technical_name
                ? {
                      ...item,
                      allRule: item.allRule.map((it) => {
                          return {
                              ...it,
                              checked:
                                  type === statisticsType.statistics
                                      ? !qualityRules.includes(it.code)
                                          ? checked
                                          : it.checked
                                      : qualityRules.includes(it.code)
                                      ? checked
                                      : it.checked,
                          }
                      }),
                  }
                : item
        })
        setTableData(data)
    }

    return isLoading ? (
        <Loader />
    ) : (
        <div className={styles.tableWrapper}>
            <Table
                rowKey="technical_name"
                columns={
                    explorationType === ExplorationType.Datasource
                        ? column.filter(
                              (item) =>
                                  !formViewTableKeys.includes(item.dataIndex),
                          )
                        : column.filter(
                              (item) =>
                                  !datasourceTableKeys.includes(item.dataIndex),
                          )
                }
                bordered={false}
                locale={{
                    emptyText: <Empty />,
                }}
                dataSource={tableData}
                pagination={false}
                rowSelection={
                    explorationType === ExplorationType.FormView && !isDetails
                        ? rowSelection
                        : undefined
                }
                scroll={isDetails ? { x: 800, y: '298px' } : { x: 800 }}
            />
        </div>
    )
}

export default ExplorationRulesTable
