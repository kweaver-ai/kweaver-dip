import { FC, useEffect, useMemo, useState } from 'react'
import { Button, Tooltip } from 'antd'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { S2DataConfig, S2Options } from '@antv/s2'
import styles from './styles.module.less'
import ToolSideBar from './ToolSideBar'
import {
    AssetTypeEnum,
    formatError,
    getAnalysisPreviewConfig,
    getIndicatorDetail,
    HasAccess,
    messageError,
    PolicyActionEnum,
    PolicyDataRescType,
    policyValidate,
    saveAnalysisPreviewConfig,
    searchIndicatorPreview,
} from '@/core'
import empty from '@/assets/notPolicy.svg'
import {
    changeDataToPreviewParams,
    changeDataToSaveParams,
    changedResDataToConfig,
    defaultPreviewConfig,
    sameperiodMethodMap,
    sameperiodNameMap,
} from '../const'
import __ from '../locale'
import { Empty, Loader } from '@/ui'
import { useAuditProcess } from '@/hooks/useAuditProcess'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import ApplyPolicy from '@/components/AccessPolicy/ApplyPolicy'
import { BizType, PolicyType } from '@/components/AuditPolicy/const'
import PivotTable from './PivotTable'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import useResourcePermissionCheck from '@/hooks/useResourcePermissionCheck'

const DefaultS2Options: S2Options = {
    width: 600,
    height: 400,
    totals: {
        row: {
            // 是否展示总计
            showGrandTotals: false,
            // 是否展示小计
            showSubTotals: false,
            // 小计统计的维度
            subTotalsDimensions: [],

            calcSubTotals: {
                aggregation: 'SUM',
            },
            calcGrandTotals: {
                aggregation: 'SUM',
            },
        },
        col: {
            showGrandTotals: true,
            calcSubTotals: {
                aggregation: 'SUM',
            },
            calcGrandTotals: {
                aggregation: 'SUM',
            },
        },
    },
    showDefaultHeaderActionIcon: false,
    hierarchyType: 'tree',
    style: {
        rowCell: {
            collapseAll: true,
            expandDepth: 0,
        },
        layoutWidthType: 'compact',
    },
    interaction: {
        copy: {
            // 开启复制
            enable: true,
            // 复制时携带表头
            withHeader: true,
            // 复制格式化后的数据
            withFormat: true,
        },
    },
}

interface IIndicatorPreview {
    indicatorId: string
    formData?: any
}
const IndicatorPreview: FC<IIndicatorPreview> = ({ indicatorId, formData }) => {
    const [indicatorInfo, setIndicatorInfo] = useState<any>()
    const [userId] = useCurrentUser('ID')

    const [s2Options, setS2Options] = useState<S2Options>(DefaultS2Options)
    const [s2DataConfig, setS2DataConfig] = useState<S2DataConfig>({
        fields: {},
        meta: [],
        data: [],
    })
    // 初始化加载中状态
    const [initLoading, setInitLoading] = useState<boolean>(true)

    // 获取加载中状态
    const [getDataLoading, setGetDataLoading] = useState<boolean>(false)

    const [allowRead, setAllowRead] = useState<boolean>(false)

    const [openPolicyApply, setOpenPolicyApply] = useState<boolean>(false)

    const { checkPermissions } = useUserPermCtx()

    const hasBusinessRoles = useMemo(
        () => checkPermissions(HasAccess.isHasBusiness),
        [checkPermissions],
    )

    // const [hasAuditProcess, refreshAuditProcess] = useAuditProcess({
    //     audit_type: PolicyType.AssetPermission,
    //     service_type: BizType.AuthService,
    // })

    const resourceInfo = useMemo(() => {
        if (!indicatorId) return []
        return [{ id: indicatorId, type: PolicyDataRescType.INDICATOR }]
    }, [indicatorId])

    const { results: resourcePermissionResults } =
        useResourcePermissionCheck(resourceInfo)

    const [isAccessBtnShowByPolicy, isAccessBtnDisableByPolicy] =
        useMemo(() => {
            const curPolicy = resourcePermissionResults?.find(
                (item) => item.id === indicatorId,
            )
            return [
                curPolicy?.hasInnerEnablePolicy ||
                    curPolicy?.hasCustomEnablePolicy,
                !(
                    curPolicy?.hasInnerEnablePolicy ||
                    curPolicy?.hasAuditEnablePolicy
                ),
            ]
        }, [resourcePermissionResults, indicatorId])

    const [showGrandTotals, setShowGrandTotals] = useState<boolean>(false)

    const [total, setTotal] = useState(0)

    useEffect(() => {
        if (userId) {
            const originData = localStorage.getItem('indicatorShowGrandTotals')
            const indicatorShowGrandTotals = originData
                ? JSON.parse(originData)
                : {}
            setShowGrandTotals(
                !!indicatorShowGrandTotals?.[userId]?.[indicatorId],
            )
        }
    }, [userId])

    useEffect(() => {
        setS2Options({
            ...s2Options,
            totals: {
                ...s2Options?.totals,
                row: {
                    ...s2Options?.totals?.row,
                    showGrandTotals,
                    showSubTotals: showGrandTotals,
                    calcSubTotals: showGrandTotals
                        ? {
                              aggregation: 'SUM',
                          }
                        : {
                              calcFunc: (query, data, spreadsheet) => {
                                  return 0
                              },
                          },
                },
                col: {
                    ...s2Options?.totals?.col,
                    showGrandTotals,
                    showSubTotals: showGrandTotals,
                },
            },
        })
    }, [showGrandTotals])

    // 默认配置
    const [defaultConfig, setDefaultConfig] =
        useState<any>(defaultPreviewConfig)

    useEffect(() => {
        if (indicatorId) {
            initGetIndicatorInfo(indicatorId)
            checkPolicy()
        }
    }, [indicatorId])

    useEffect(() => {
        if (indicatorInfo && allowRead) {
            getData()
        }
    }, [indicatorInfo, allowRead])

    const getData = async () => {
        try {
            if (indicatorId) {
                const res = await getAnalysisPreviewConfig({ id: indicatorId })
                const newConfig = changedResDataToConfig(
                    res,
                    indicatorInfo.analysis_dimensions,
                )
                setDefaultConfig(newConfig)
                getTableData(newConfig)
                setInitLoading(false)
            }
        } catch (err) {
            setInitLoading(false)
            formatError(err)
        }
    }

    const checkPolicy = async () => {
        try {
            const res = await policyValidate([
                {
                    action: PolicyActionEnum.Read,
                    object_id: indicatorId,
                    object_type: AssetTypeEnum.Indicator,
                    subject_id: userId,
                    subject_type: 'user',
                },
            ])
            setAllowRead(res[0].effect === 'allow')
            if (res[0].effect !== 'allow') {
                setInitLoading(false)
            }
        } catch (err) {
            formatError(err)
            setInitLoading(false)
        }
    }
    /**
     * 异步初始化指标信息。
     *
     * 该函数通过调用getIndicatorDetail函数来获取指定指标的详细信息，并使用setIndicatorInfo来更新状态。
     * 如果在获取信息的过程中发生错误，将会调用formatError函数来处理错误。
     *
     * @param {number} id - 指标的唯一标识符，用于获取指标的详细信息。
     * @async
     */

    const initGetIndicatorInfo = async (id) => {
        try {
            // 异步获取指定指标的详细信息
            let res = await getIndicatorDetail(id)

            if (formData) {
                // 限定维度
                const filterDetail = JSON.parse(formData?.subView?.detail || {})
                const filterFieldIds = (filterDetail?.fields || []).map(
                    (item) => item.id,
                )
                const filterDims = (res?.analysis_dimensions || []).filter(
                    (dimItem) => filterFieldIds.includes(dimItem.field_id),
                )
                res = { ...res, analysis_dimensions: filterDims }
            }

            // 更新指标信息的状态
            setIndicatorInfo(res)
        } catch (error) {
            setInitLoading(false)
            // 处理获取指标信息时发生的错误
            formatError(error)
        }
    }

    /**
     * 处理配置更改的函数。
     * 当配置发生变化时，此函数首先获取更新后的表格数据，然后保存新的配置。
     * 这样做的目的是确保当前库表的数据与新配置一致，同时保留用户的配置更改供将来使用。
     *
     * @param config 配置对象，包含了表格的各项配置参数。
     *               这些参数可能包括但不限于表格的显示列、排序规则、分页设置等。
     */
    const handleConfigChange = (config) => {
        // 根据新的配置获取表格数据
        getTableData(config)
        // 保存新的配置到持久化存储中
        saveTableConfig(config)
    }

    /**
     * 异步获取表格数据，并根据配置数据调整表格的显示选项和元数据。
     * @param configData 配置数据，包含表格的行、列和指标的业务和技术名称。
     * @returns 无返回值，但会更新表格的选项和数据配置。
     */
    const getTableData = async (configData) => {
        if (!configData.time_constraint[0].value[0]) {
            return
        }

        if (
            configData.metrics?.type === 'proportion' &&
            [...configData.pivot_rows, ...configData.pivot_columns].length === 0
        ) {
            messageError(__('指标占比预览需要至少一个维度字段'))
            return
        }

        setGetDataLoading(true)
        let resData
        try {
            // 将配置数据转换为查询参数。
            const newData = changeDataToPreviewParams(configData)

            if (formData?.subView?.detail) {
                // 限定维度
                const filterDetail = JSON.parse(formData?.subView?.detail || {})
                newData.row_filter = filterDetail?.row_filters || {}
            }
            // 发起指标预览的查询请求。
            resData = await searchIndicatorPreview(indicatorId, newData, true)
        } catch (error) {
            // 处理查询过程中的错误。
            formatError(error)
            // 如果当前接口被取消了就不需要停止等待
            if (error?.data?.code !== 'ERR_CANCELED') {
                setGetDataLoading(false)
            }
            setInitLoading(false)
            // 根据实际情况处理异常，例如设置错误状态或返回默认数据
            return
        }

        // 存在同环比，关闭总计
        if (configData.metrics) {
            handleSiwtchTotalChange(false)
        }

        // 更新表格选项，设置行的汇总维度。
        // 优化设置s2Options的方式，减少冗余代码
        setTotal(resData.total)
        if (resData.total > resData.total_count) {
            setS2Options({
                ...s2Options,
                totals: {
                    ...s2Options?.totals,
                    row: {
                        ...s2Options?.totals?.row,
                        subTotalsDimensions: configData.pivot_rows.map(
                            (row) => row.technical_name,
                        ),
                        showGrandTotals: false,
                        showSubTotals: false,
                        calcSubTotals: {
                            calcFunc: (query, data, spreadsheet) => {
                                return 0
                            },
                        },
                    },
                    col: {
                        showGrandTotals: false,
                        showSubTotals: false,
                    },
                },
            })
        } else {
            setS2Options({
                ...s2Options,
                totals: {
                    ...s2Options?.totals,
                    row: {
                        ...s2Options?.totals?.row,
                        subTotalsDimensions: configData.pivot_rows.map(
                            (row) => row.technical_name,
                        ),
                        showGrandTotals: configData.metrics
                            ? false
                            : s2Options?.totals?.row?.showGrandTotals,
                        showSubTotals: configData.metrics
                            ? false
                            : s2Options?.totals?.row?.showSubTotals,
                        calcSubTotals: s2Options?.totals?.row?.showSubTotals
                            ? {
                                  aggregation: 'SUM',
                              }
                            : {
                                  calcFunc: (query, data, spreadsheet) => {
                                      return 0
                                  },
                              },
                    },
                    col: {
                        showGrandTotals: configData.metrics
                            ? false
                            : s2Options?.totals?.row?.showGrandTotals,
                        showSubTotals: configData.metrics
                            ? false
                            : s2Options?.totals?.row?.showSubTotals,
                    },
                },
            })
        }

        // 构建元数据，包含行、列和指标的业务和技术名称。
        // 优化metaData的生成，减少不必要的数组操作
        let metaData: any[] = [
            ...(configData.pivot_rows.length
                ? configData.pivot_rows
                : [
                      {
                          technical_name: 'indicator_label',
                          business_name: '指标',
                      },
                  ]),
            ...configData.pivot_columns,
        ]
            .map((currentData) => ({
                field: currentData.technical_name,
                name: currentData.business_name,
            }))
            .concat([
                {
                    field: 'indicator',
                    name: indicatorInfo?.name,
                    formatter: (value, data, meta) => {
                        // 格式化指标值，保留两位小数
                        return value
                            ? `${value} ${indicatorInfo.indicator_unit}`
                            : ''
                    },
                },
            ] as any)

        // 同环比
        const metricsValues: string[] = []
        if (configData.metrics) {
            const { type, sameperiod_config } = configData.metrics
            if (type === 'sameperiod') {
                metaData = metaData.concat(
                    sameperiod_config.method.map((item) => {
                        metricsValues.push(`${item}_${indicatorInfo.id}`)
                        let name = `${indicatorInfo?.name}${sameperiodMethodMap[item].label}`
                        if (!sameperiod_config.custom) {
                            name = `${indicatorInfo?.name}${
                                sameperiodNameMap[
                                    sameperiod_config.time_granularity
                                ]
                            }${sameperiodMethodMap[item].label}`
                        }
                        return {
                            field: `${item}_${indicatorInfo.id}`,
                            name,
                            formatter: (value, data, meta) => {
                                // 格式化指标值，保留两位小数
                                if (item === 'growth_value') {
                                    return value
                                        ? `${value} ${indicatorInfo.indicator_unit}`
                                        : ''
                                }
                                return value
                                    ? `${(Number(value) * 100).toFixed(2)} %`
                                    : ''
                            },
                        }
                    }),
                )
            }
            if (type === 'proportion') {
                metricsValues.push(`proportion_${indicatorInfo.id}`)
                metaData = metaData.concat([
                    {
                        field: `proportion_${indicatorInfo.id}`,
                        name: `${indicatorInfo?.name}${__('占比')}`,
                        formatter: (value, data, meta) => {
                            return value
                                ? `${(Number(value) * 100).toFixed(2)} %`
                                : ''
                        },
                    },
                ])
            }
        }

        // 根据查询结果和配置数据，构建表格的数据配置。
        // 优化数据处理逻辑，增加对不一致长度的健壮性处理
        const newS2ConfigData: S2DataConfig = {
            fields: {
                rows: configData.pivot_rows.length
                    ? configData.pivot_rows.map((row) => row.technical_name)
                    : ['indicator_label'],

                columns: configData.pivot_columns.map(
                    (column) => column.technical_name,
                ),
                values: ['indicator', ...metricsValues],
                valueInCols: true,
            },
            meta: metaData,

            data: resData.data
                .map((item) => {
                    // 确保item长度与metaData一致，否则忽略超出部分
                    if (!configData.pivot_rows.length) {
                        return ['', ...item].reduce(
                            (preData, itemValue, index) => {
                                if (index < metaData.length) {
                                    return {
                                        ...preData,
                                        [metaData[index].field]: itemValue,
                                    }
                                }
                                return preData
                            },
                            {},
                        )
                    }
                    return item.reduce((preData, itemValue, index) => {
                        if (index < metaData.length) {
                            return {
                                ...preData,
                                [metaData[index].field]: itemValue,
                            }
                        }
                        return preData
                    }, {})
                })
                .map((item) => {
                    if (item[`proportion_${indicatorInfo.id}`]) {
                        return {
                            ...item,
                            [`proportion_${indicatorInfo.id}`]:
                                Number(item[`proportion_${indicatorInfo.id}`]) /
                                100,
                        }
                    }
                    if (item[`growth_rate_${indicatorInfo.id}`]) {
                        return {
                            ...item,
                            [`growth_rate_${indicatorInfo.id}`]:
                                Number(
                                    item[`growth_rate_${indicatorInfo.id}`],
                                ) / 100,
                        }
                    }
                    return item
                }),
        }
        setS2DataConfig(newS2ConfigData)
        setGetDataLoading(false)
        setInitLoading(false)
    }
    /**
     * 异步保存表格配置。
     *
     * 此函数旨在保存分析预览的表格配置。它首先将配置参数转换为适合保存的格式，
     * 然后尝试保存配置。如果保存过程中发生错误，错误将被格式化并重新抛出，
     * 允许调用者对错误进行进一步处理。
     *
     * @param config 表格的配置信息，需要被保存。
     * @throws 如果保存配置时发生错误，将抛出异常。
     */
    const saveTableConfig = async (config) => {
        if (!config.time_constraint[0].value[0]) {
            return
        }
        if (
            config.metrics?.type === 'proportion' &&
            [...config.pivot_rows, ...config.pivot_columns].length === 0
        ) {
            messageError(__('指标占比预览需要至少一个维度字段'))
            return
        }

        try {
            // 调用前进行异常处理的包装
            await saveAnalysisPreviewConfig(
                indicatorId,
                changeDataToSaveParams(config),
            )
        } catch (error) {
            // 异常处理：可以根据实际需求对异常进行记录、通知用户或进行其他处理
            formatError(error)
            // 可以考虑将错误进一步通知到调用者，例如通过抛出异常或返回错误对象
            throw error // 或者其他错误处理逻辑
        }
    }

    /**
     * 处理开关总和变化的函数
     * 当用户切换是否显示总和时，此函数会更新界面状态，并持久化用户偏好到localStorage
     * @param {boolean} value - 表示用户是否希望显示总和（true为显示，false为不显示）
     */
    const handleSiwtchTotalChange = (value) => {
        // 更新界面状态，决定是否显示总和
        setShowGrandTotals(value)

        // 从localStorage获取用户显示总和的偏好设置
        const originData = localStorage.getItem('indicatorShowGrandTotals')
        // 解析localStorage中的数据，如果不存在，则初始化为空对象
        const indicatorShowGrandTotals = originData
            ? JSON.parse(originData)
            : {}

        // 构建新的用户显示总和偏好设置，包含当前用户的选择
        const newIndicatorShowGrandTotals = {
            ...indicatorShowGrandTotals,
            [userId]: indicatorShowGrandTotals?.[userId]
                ? {
                      ...indicatorShowGrandTotals?.[userId],
                      [indicatorId]: value,
                  }
                : {
                      [indicatorId]: value,
                  },
        }

        // 将更新后的用户偏好设置保存回localStorage
        localStorage.setItem(
            'indicatorShowGrandTotals',
            JSON.stringify(newIndicatorShowGrandTotals),
        )
    }

    return (
        <div className={styles.previewContainer}>
            {initLoading ? (
                <div className={styles.notPolicyContainer}>
                    <div className={styles.loading}>
                        <Loader />
                    </div>
                </div>
            ) : allowRead ? (
                <>
                    <div className={styles.tableContainer}>
                        <PivotTable
                            s2DataConfig={s2DataConfig}
                            s2Options={s2Options}
                            total={total}
                            switchTotals={showGrandTotals}
                            updateSwitchTotals={handleSiwtchTotalChange}
                            indicatorInfo={indicatorInfo}
                        />
                        {getDataLoading ? (
                            <div className={styles.loading}>
                                <Loader />
                            </div>
                        ) : null}
                    </div>
                    <div className={styles.toolBoxContainer}>
                        <DndProvider backend={HTML5Backend}>
                            <ToolSideBar
                                indicatorInfo={indicatorInfo}
                                onConfigChange={handleConfigChange}
                                defaultValue={defaultConfig}
                                showFilterIcon={!formData}
                            />
                        </DndProvider>
                    </div>
                </>
            ) : (
                <div className={styles.notPolicyContainer}>
                    <Empty
                        desc={
                            isAccessBtnShowByPolicy
                                ? !hasBusinessRoles
                                    ? __('角色权限不足，不能开启指标预览')
                                    : __(
                                          '暂无权限，可点击【权限申请】按钮开启指标预览',
                                      )
                                : __('暂无权限')
                        }
                        iconSrc={empty}
                        style={{ marginTop: '140px' }}
                    />
                    {isAccessBtnShowByPolicy && hasBusinessRoles && (
                        <div style={{ margin: '20px' }}>
                            <Tooltip
                                title={
                                    isAccessBtnDisableByPolicy
                                        ? __(
                                              '无匹配的审核流程，不能进行权限申请',
                                          )
                                        : ''
                                }
                                placement="top"
                                overlayStyle={{ maxWidth: 500 }}
                            >
                                <Button
                                    type="primary"
                                    onClick={() => {
                                        setOpenPolicyApply(true)
                                    }}
                                    disabled={isAccessBtnDisableByPolicy}
                                >
                                    {__('权限申请')}
                                </Button>
                            </Tooltip>
                        </div>
                    )}
                </div>
            )}
            {openPolicyApply && (
                <ApplyPolicy
                    id={indicatorId}
                    onClose={(needRefresh: boolean) => {
                        setOpenPolicyApply(false)

                        // if (needRefresh) {
                        //     refreshAuditProcess()
                        // }
                    }}
                    type={AssetTypeEnum.Indicator as string}
                    style={{
                        top: 0,
                    }}
                    indicatorType={indicatorInfo?.indicator_type}
                />
            )}
        </div>
    )
}

export default IndicatorPreview
