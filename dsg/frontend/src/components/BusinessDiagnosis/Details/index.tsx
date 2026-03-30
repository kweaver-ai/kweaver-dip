import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Anchor, Button, Progress, Table, Tooltip } from 'antd'
import classnames from 'classnames'
import { has, isNil } from 'lodash'
import generatePDF from 'react-to-pdf'
import { useGetState } from 'ahooks'
import { v4 } from 'uuid'
import { BianJiYeMianColored } from '@/icons'
import { SearchInput } from '@/ui'
import Loader from '@/ui/Loader'
import Empty from '@/ui/Empty'
import diagnosisFailed from '@/assets/diagnosisFailed.svg'
import styles from './styles.module.less'
import {
    thirdLineData,
    firstLineData,
    flowchartListStr,
    flowchartList,
    IconsType,
    DetailsType,
    IDetailsData,
    overviewRatioData,
    anchorList,
    completenessTips,
    maturityTips,
    maturityTableList,
    consistencyTips,
    consistencyTableList,
    sharingRateTips,
    sharingRateTableList,
    businessFormComplexityTableList,
    DiagnosisType,
} from '../const'
import {
    formatError,
    DiagnosisPhase,
    getBusinessDiagnosisDetails,
    IBusinessDiagnosisItem,
    editBusinessDiagnosis,
    formsEnumConfig,
} from '@/core'
import __ from '../locale'
import Header from '../components/Header'
import { formatTime, getActualUrl, getInnerUrl, useQuery } from '@/utils'
import DiagnosisTags from '../components/DiagnosisTags'
import {
    getIcons,
    isJsonString,
    getColumnDataInfo,
    detailsTypeMap,
} from '../helper'
import { TabKey } from '@/components/BusinessModeling/const'
import DetailsInfoModal from '../components/DetailsInfoModal'
import CreateDiagnosis from '../CreateDiagnosis'
import { ColumnMap, DashBoard } from '../g2plotConfig'
import dataEmpty from '@/assets/dataEmpty.svg'
import { TitleTipsLabel } from '../components/TitleTipsLabel'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

const { Link } = Anchor

const BusinessDiagnosisDetails = ({
    bdId,
    onClose,
}: {
    bdId?: string
    onClose?: () => void
}) => {
    const { checkPermission } = useUserPermCtx()
    const [exportingPDF, setExportingPDF, getExportingPDF] = useGetState(false)

    // 表格 - 类型列
    const getTypeCol = () => ({
        title: __('类型'),
        dataIndex: 'typeName',
        key: 'typeName',
        ellipsis: true,
        width: '21%',
        render: (_, record) => (
            <div
                className={classnames(
                    styles.detailsTableItem,
                    record.disabled && styles.disabled,
                )}
            >
                <TitleTipsLabel
                    smallPadding
                    label={detailsTypeMap[record.key].typeName}
                    tips={
                        exportingPDF
                            ? undefined
                            : detailsTypeMap[record.key].typeTips
                    }
                    fontWeight={400}
                />
                {has(record, 'typeValue') && (
                    <span className={styles.percent}>
                        (
                        {record?.disabled || isNil(record.typeValue)
                            ? '--'
                            : record?.typeValue}
                        %)
                    </span>
                )}
            </div>
        ),
    })

    // 表格 - 结果说明列
    const getDescCol = () => ({
        title: __('结果说明'),
        dataIndex: 'desc',
        key: 'desc',
        ellipsis: true,
        render: (_, record) => {
            const { desc } = record
            return (
                <div
                    className={classnames(
                        styles.detailsTableItem,
                        record.disabled && styles.disabled,
                    )}
                >
                    <div
                        className={
                            exportingPDF
                                ? styles['detailsTableItem-export-left']
                                : styles['detailsTableItem-left']
                        }
                        title={desc}
                    >
                        {desc}
                    </div>
                    <span
                        onClick={() =>
                            !record.disabled &&
                            toDetailsModal(record.key, record)
                        }
                        hidden={getExportingPDF()}
                    >
                        {getIcons(IconsType.info, record.disabled)}
                    </span>
                </div>
            )
        },
    })

    // 表格中需要调用事件
    const businessFormList = [
        {
            key: DiagnosisType.Completeness,
            title: __('完整度分析'),
            tips: completenessTips,
            scoreKey: (record) =>
                record?.evaluation?.completenessEvaluation
                    ?.comprehensiveCompleteness,
            columns: [
                {
                    title: __('业务名称'),
                    dataIndex: 'name',
                    key: 'name',
                    ellipsis: true,
                    render: (text, record) => text || '--',
                },
                {
                    title: __('业务模型'),
                    dataIndex: 'businessModelName',
                    key: 'businessModelName',
                    ellipsis: true,
                    render: (text, record) => text || '--',
                },
                {
                    title: (
                        <TitleTipsLabel
                            smallPadding
                            iconColor="rgb(0 0 0 / 45%)"
                            label={__('业务节点表的完整度')}
                            tips={
                                exportingPDF
                                    ? undefined
                                    : [
                                          __('1.判断是否存在业务节点表'),
                                          __('2.判断每个业务节点表是否有字段'),
                                          __(
                                              '3.每个流程节点是否关联了业务节点表',
                                          ),
                                      ]
                            }
                        />
                    ),
                    dataIndex: 'businessFormCount',
                    key: 'businessFormCount',
                    ellipsis: true,
                    width: '36%',
                    render: (text, record) => {
                        const {
                            businessModelID,
                            businessModelLocked,
                            completeness,
                        } = record
                        const {
                            businessFormCount,
                            businessFormWithoutInfoItem,
                            node_without_form,
                        } = completeness
                        const withoutInfo = businessFormWithoutInfoItem || []
                        const nodeWithoutForm = node_without_form || []
                        const isError =
                            withoutInfo.length > 0 ||
                            businessFormCount === 0 ||
                            nodeWithoutForm.length > 0
                        const modelDisbaled =
                            !businessModelID || businessModelLocked
                        return (
                            <div className={styles.detailsTableItem}>
                                <span
                                    className={
                                        exportingPDF
                                            ? styles[
                                                  'detailsTableItem-export-left'
                                              ]
                                            : styles['detailsTableItem-left']
                                    }
                                    title={
                                        businessFormCount === 0
                                            ? __('未检测到业务节点表')
                                            : withoutInfo?.length > 0 ||
                                              nodeWithoutForm.length > 0
                                            ? `${__(
                                                  '检测到${num}张业务节点表',
                                                  {
                                                      num: businessFormCount,
                                                  },
                                              )}${
                                                  withoutInfo.length > 0
                                                      ? __(
                                                            '，其中${num}张表无字段',
                                                            {
                                                                num: withoutInfo.length,
                                                            },
                                                        )
                                                      : ''
                                              }${
                                                  nodeWithoutForm.length > 0
                                                      ? __(
                                                            '，其中${num}个流程节点未关联业务节点表',
                                                            {
                                                                num: nodeWithoutForm.length,
                                                            },
                                                        )
                                                      : ''
                                              }`
                                            : __(
                                                  '检测到共${num}张业务节点表，正常',
                                                  {
                                                      num: businessFormCount,
                                                  },
                                              )
                                    }
                                >
                                    {getIcons(
                                        isError
                                            ? IconsType.error
                                            : IconsType.succes,
                                    )}
                                    {businessFormCount === 0 ? (
                                        __('未检测到业务节点表')
                                    ) : withoutInfo?.length > 0 ||
                                      nodeWithoutForm.length > 0 ? (
                                        <span>
                                            {__('检测到${num}张业务节点表', {
                                                num: businessFormCount,
                                            })}
                                            {withoutInfo.length > 0 && (
                                                <>
                                                    {__('，其中')}
                                                    <span
                                                        onClick={() =>
                                                            toDetailsModal(
                                                                DetailsType.noFields,
                                                                record,
                                                            )
                                                        }
                                                        className={
                                                            styles.clickText
                                                        }
                                                    >
                                                        {withoutInfo.length}
                                                    </span>
                                                    {__('张表无字段')}
                                                </>
                                            )}
                                            {nodeWithoutForm.length > 0 && (
                                                <>
                                                    {__('，其中')}
                                                    {nodeWithoutForm.length}
                                                    {__(
                                                        '个流程节点未关联业务节点表',
                                                    )}
                                                </>
                                            )}
                                        </span>
                                    ) : (
                                        __('检测到共${num}张业务节点表，正常', {
                                            num: businessFormCount,
                                        })
                                    )}
                                </span>
                                {isError && (
                                    <span
                                        className={classnames(
                                            modelDisbaled && styles.disableBtn,
                                        )}
                                        onClick={() => {
                                            if (modelDisbaled) return
                                            toBusinessModel(TabKey.FORM, record)
                                        }}
                                        hidden={exportingPDF}
                                    >
                                        {getIcons(
                                            IconsType.details,
                                            modelDisbaled,
                                            businessModelLocked,
                                        )}
                                    </span>
                                )}
                            </div>
                        )
                    },
                },
                {
                    title: (
                        <TitleTipsLabel
                            smallPadding
                            iconColor="rgb(0 0 0 / 45%)"
                            label={__('流程图的完整度')}
                            tips={
                                exportingPDF
                                    ? undefined
                                    : [
                                          __(
                                              '流程图开始节点和结束节点是否存在且至少包含一个流程节点',
                                          ),
                                      ]
                            }
                        />
                    ),
                    dataIndex: 'flowchart',
                    key: 'flowchart',
                    ellipsis: true,
                    render: (_, record) => {
                        const {
                            businessModelID,
                            businessModelLocked,
                            completeness,
                        } = record
                        const { flowchart, break_node = [] } = completeness
                        let txt = flowchartListStr[flowchart]
                        const modelDisbaled =
                            !businessModelID || businessModelLocked
                        if (flowchart === flowchartList.NotCompleted) {
                            const breakNodeStr =
                                break_node.length > 0
                                    ? __('，未连通节点：') +
                                      break_node.join('；')
                                    : ''
                            txt += breakNodeStr
                        }
                        return (
                            <div className={styles.detailsTableItem}>
                                <span
                                    className={
                                        exportingPDF
                                            ? styles[
                                                  'detailsTableItem-export-left'
                                              ]
                                            : styles['detailsTableItem-left']
                                    }
                                    title={txt}
                                >
                                    {getIcons(
                                        flowchart === flowchartList.Completed
                                            ? IconsType.succes
                                            : IconsType.error,
                                    )}
                                    {txt}
                                </span>
                                {flowchart !== flowchartList.Completed && (
                                    <span
                                        className={classnames(
                                            modelDisbaled && styles.disableBtn,
                                        )}
                                        onClick={() => {
                                            if (modelDisbaled) return
                                            toBusinessModel(
                                                TabKey.PROCESS,
                                                record,
                                            )
                                        }}
                                        hidden={exportingPDF}
                                    >
                                        {getIcons(
                                            IconsType.details,
                                            modelDisbaled,
                                            businessModelLocked,
                                        )}
                                    </span>
                                )}
                            </div>
                        )
                    },
                },
                {
                    title: (
                        <TitleTipsLabel
                            smallPadding
                            iconColor="rgb(0 0 0 / 45%)"
                            label={__('业务指标的完整度')}
                            tips={
                                exportingPDF
                                    ? undefined
                                    : [__('至少包含一个业务指标')]
                            }
                        />
                    ),
                    dataIndex: 'businessMetrics',
                    key: 'businessMetrics',
                    ellipsis: true,
                    render: (text, record) => {
                        const {
                            businessModelID,
                            businessModelLocked,
                            completeness,
                        } = record
                        const { businessMetrics } = completeness
                        const modelDisbaled =
                            !businessModelID || businessModelLocked
                        return (
                            <div className={styles.detailsTableItem}>
                                <span
                                    className={
                                        exportingPDF
                                            ? styles[
                                                  'detailsTableItem-export-left'
                                              ]
                                            : styles['detailsTableItem-left']
                                    }
                                    title={
                                        businessMetrics
                                            ? __('检测到共${num}个指标，正常', {
                                                  num: businessMetrics,
                                              })
                                            : __('未检测到指标')
                                    }
                                >
                                    {getIcons(
                                        businessMetrics > 0
                                            ? IconsType.succes
                                            : IconsType.error,
                                    )}
                                    {businessMetrics
                                        ? __('检测到共${num}个指标，正常', {
                                              num: businessMetrics,
                                          })
                                        : __('未检测到指标')}
                                </span>
                                {!businessMetrics && !exportingPDF && (
                                    <span
                                        className={classnames(
                                            !businessModelID &&
                                                styles.disableBtn,
                                        )}
                                        onClick={() => {
                                            if (modelDisbaled) return
                                            toBusinessModel(
                                                TabKey.INDICATOR,
                                                record,
                                            )
                                        }}
                                    >
                                        {getIcons(
                                            IconsType.details,
                                            modelDisbaled,
                                            businessModelLocked,
                                        )}
                                    </span>
                                )}
                            </div>
                        )
                    },
                },
            ],
            data: (record) => record?.processes || [],
        },
        {
            key: DiagnosisType.Maturity,
            title: __('成熟度分析'),
            tips: maturityTips,
            scoreKey: (record) =>
                record?.evaluation?.maturityEvaluation?.comprehensiveMaturity,
            columns: [
                {
                    ...getTypeCol(),
                    onCell: (_, index) => {
                        if (index === 0 || index === 3) {
                            return { rowSpan: 3 }
                        }
                        if ([1, 2, 4, 5].includes(index)) {
                            return { rowSpan: 0 }
                        }
                        return {}
                    },
                },
                {
                    title: __('指标'),
                    dataIndex: 'metricsName',
                    key: 'metricsName',
                    ellipsis: true,
                    width: '26%',
                    render: (_, record) => (
                        <div
                            className={classnames(
                                styles.detailsTableItem,
                                record.disabled && styles.disabled,
                            )}
                        >
                            <TitleTipsLabel
                                smallPadding
                                label={detailsTypeMap[record.key].name}
                                tips={
                                    exportingPDF
                                        ? undefined
                                        : detailsTypeMap[record.key].tips
                                }
                                fontWeight={400}
                            />
                            <span className={styles.percent}>
                                (
                                {record?.disabled || isNil(record.metricsValue)
                                    ? '--'
                                    : record.metricsValue}
                                %)
                            </span>
                        </div>
                    ),
                },
                getDescCol(),
            ],
            data: (record) => maturityTableList(record),
        },
        {
            key: DiagnosisType.Consistency,
            title: __('一致性分析'),
            tips: consistencyTips,
            scoreKey: (record) =>
                record?.evaluation?.consistencyEvaluation
                    ?.comprehensiveConsistency,
            columns: [getTypeCol(), getDescCol()],
            data: (record) => consistencyTableList(record),
        },
        {
            key: DiagnosisType.SharingRate,
            title: __('共享率分析'),
            tips: sharingRateTips,
            scoreKey: (record) =>
                record?.evaluation?.sharingRateEvaluation
                    ?.comprehensiveSharingRate,
            columns: [getTypeCol(), getDescCol()],
            data: (record) => sharingRateTableList(record),
        },
        {
            key: DiagnosisType.BusinessFormComplexity,
            title: __('业务标准表分析'),
            columns: [getTypeCol(), getDescCol()],
            data: (record) => businessFormComplexityTableList(record),
        },
    ]
    const navigator = useNavigate()
    const query = useQuery()
    const id = query.get('id') || bdId || ''
    const backUrl = query.get('backUrl') || ''
    const [detailsData, setDetailsData] = useState<IBusinessDiagnosisItem>()
    // const [firstLineDataList, setFirstLineDataList] =
    //     useState<any[]>(firstLineData)
    // const [secondMapData, setSecondMapData] = useState<any[]>([])
    // 总览 XX 率数据
    const [overviewRatio, setOverviewRatio] = useState<any[]>(overviewRatioData)
    // 总览 业务标准字段数量分布数据
    const [overviewDistribution, setOverviewDistribution] = useState<any[]>([])
    const [thirdLineDataList, setThirdLineDataList] =
        useState<any[]>(thirdLineData)
    const [lastDataList, setLastDataList] = useState<any[]>(businessFormList)
    const [detailsModalOpen, setDetailsModalOpen] = useState<boolean>(false)
    const [detailsInfoModalData, setDetailsInfoModalData] =
        useState<IDetailsData>()
    const [isEditName, setIsEditName] = useState<boolean>(false)
    const [editName, setEditName] = useState<string>('')
    const [loading, setLoading] = useState<boolean>(true)
    const [createModalOpen, setCreateModalOpen] = useState<boolean>(false)

    const [errMsg, setErrMsg] = useState<string>('')
    const container = useRef<any>(null)
    const contentRef = useRef<any>(null)

    useEffect(() => {
        if (id) {
            getDetails()
        }
    }, [id, exportingPDF])

    useEffect(() => {
        if (exportingPDF) {
            handleExportPdf()
        }
    }, [lastDataList])

    // 获取报告详情
    const getDetails = async () => {
        try {
            const { formulate_basis } = await formsEnumConfig()
            let res = await getBusinessDiagnosisDetails(id)
            // 标准一致性
            const fields =
                res?.report?.evaluation?.consistencyEvaluation?.standard_consistency?.fields?.map(
                    (item, idx) => ({
                        ...item,
                        id: `${idx}`,
                        name: item.field_name,
                        form_info: item.form_info.map((item2) => {
                            const findItem = res?.report?.processes?.find(
                                (item3) =>
                                    item3.id === item2.business_process_id,
                            )
                            return {
                                ...item2,
                                formulate_basis: formulate_basis.find(
                                    (item3) =>
                                        item3.value_en ===
                                        item2.formulate_basis,
                                )?.value,
                                id: item2.business_process_id,
                                name: item2.business_process_name,
                                businessModelID: findItem.businessModelID,
                                businessModelName: findItem.businessModelName,
                                businessModelLocked:
                                    findItem.businessModelLocked,
                            }
                        }),
                    }),
                )
            // 流程一致性
            const consistency_nodes =
                res?.report?.evaluation?.consistencyEvaluation?.flowchart_consistency?.consistency_nodes?.map(
                    (item) => ({
                        ...item,
                        id: item.compare_process_id,
                        name: item.compare_process_name,
                    }),
                )
            // 指标一致性
            const indicators =
                res?.report?.evaluation?.consistencyEvaluation?.metric_consistency?.indicators?.map(
                    (item) => ({
                        ...item,
                        id: item.indicator_id,
                        name: item.indicator_name,
                        business_process_info: item.business_process_info.map(
                            (item2) => {
                                const findItem = res?.report?.processes?.find(
                                    (item3) => item3.id === item2.id,
                                )
                                return {
                                    ...item2,
                                    businessModelID: findItem.businessModelID,
                                    businessModelName:
                                        findItem.businessModelName,
                                    businessModelLocked:
                                        findItem.businessModelLocked,
                                }
                            },
                        ),
                    }),
                )
            res = {
                ...res,
                report: {
                    ...res?.report,
                    evaluation: {
                        ...res?.report?.evaluation,
                        consistencyEvaluation: {
                            ...res?.report?.evaluation?.consistencyEvaluation,
                            standard_consistency: {
                                ...res?.report?.evaluation
                                    ?.consistencyEvaluation
                                    ?.standard_consistency,
                                fields: fields?.length > 0 ? fields : undefined,
                            },
                            flowchart_consistency: {
                                ...res?.report?.evaluation
                                    ?.consistencyEvaluation
                                    ?.flowchart_consistency,
                                consistency_nodes:
                                    consistency_nodes?.length > 0
                                        ? consistency_nodes
                                        : undefined,
                            },
                            metric_consistency: {
                                ...res?.report?.evaluation
                                    ?.consistencyEvaluation?.metric_consistency,
                                indicators:
                                    indicators?.length > 0
                                        ? indicators
                                        : undefined,
                            },
                        },
                    },
                },
            }
            setDetailsData(res)
            setEditName(res?.name)
            if (res?.message && res?.phase === DiagnosisPhase.Failed) {
                const msg = isJsonString(res?.message)
                    ? JSON.parse(res?.message)
                    : res?.message || ''
                setErrMsg(msg)
            }
            setOverviewRatio(
                overviewRatioData.map((item) =>
                    item.map((innerItem) => ({
                        ...innerItem,
                        value: innerItem.scoreKey(res?.report),
                        // 演示处理
                        disabled: !res?.dimensions?.[innerItem.key],
                    })),
                ),
            )
            setOverviewDistribution(
                res?.report?.processes
                    ?.map((item) => item?.businessFormComplexity?.forms || [])
                    .flat() || [],
            )
            // 业务标准表字段总数
            const fieldsCountTotal = 0

            // const requiredFields: any[] = []
            // const noBusinessFields: any[] = []
            // res?.report?.processes?.forEach((item: any) => {
            //     const processBaseInfo = pick(item, [
            //         'id',
            //         'name',
            //         'businessModelID',
            //         'businessModelName',
            //         'businessModelLocked',
            //     ])

            //     let fieldsCount = 0
            //     let requiredFieldsCount = 0
            //     let otherFieldsCount = 0
            //     item?.businessFormComplexity?.forms?.forEach((formItem) => {
            //         fieldsCount += formItem?.fields_count || 0
            //         requiredFieldsCount += formItem?.fields_required_count || 0
            //         otherFieldsCount +=
            //             formItem?.fields_from_other_business || 0
            //     })

            //     fieldsCountTotal += fieldsCount

            //     standardizationFieldDistribution.push({
            //         ...processBaseInfo,
            //         formCount: item?.businessFormComplexity?.forms?.length || 0,
            //         fieldsCount,
            //         forms: item?.businessFormComplexity?.forms,
            //     })
            //     requiredFields.push({
            //         ...processBaseInfo,
            //         fieldsCount,
            //         requiredFieldsCount,
            //         forms: item?.businessFormComplexity?.forms,
            //     })
            //     noBusinessFields.push({
            //         ...processBaseInfo,
            //         fieldsCount,
            //         otherFieldsCount,
            //         forms: item?.businessFormComplexity?.forms,
            //     })
            // })
            // 必填字段占比
            // const requiredFieldsPieData = [
            //     {
            //         type: __('非必填'),
            //         // 总字段数 - 必填字段数
            //         value:
            //             requiredFields
            //                 .map((item) => item.fieldsCount || 0)
            //                 .reduce((cur, pre) => pre + cur, 0) -
            //             requiredFields
            //                 .map((item) => item.requiredFieldsCount || 0)
            //                 .reduce((cur, pre) => pre + cur, 0),
            //     },
            //     {
            //         type: __('必填'),
            //         value: requiredFields
            //             .map((item) => item.requiredFieldsCount || 0)
            //             .reduce((cur, pre) => pre + cur, 0),
            //     },
            // ]
            // // 非本业务产生字段占比
            // const noBusinessFieldsPieData = [
            //     {
            //         type: __('本业务产生'),
            //         // 总字段数 - 非本业务产生
            //         value:
            //             noBusinessFields
            //                 .map((item) => item.fieldsCount || 0)
            //                 .reduce((cur, pre) => pre + cur, 0) -
            //             noBusinessFields
            //                 .map((item) => item.otherFieldsCount || 0)
            //                 .reduce((cur, pre) => pre + cur, 0),
            //     },
            //     {
            //         type: __('非本业务产生'),
            //         value: noBusinessFields
            //             .map((item) => item.otherFieldsCount || 0)
            //             .reduce((cur, pre) => pre + cur, 0),
            //     },
            // ]
            // setThirdLineDataList(
            //     thirdLineData.map((item) => ({
            //         ...item,
            //         data:
            //             item.key === 'requiredFields'
            //                 ? requiredFieldsPieData
            //                 : noBusinessFieldsPieData,
            //     })),
            // )

            setLastDataList(
                businessFormList?.map((item: any, index) => {
                    return {
                        ...item,
                        data:
                            item.key === DiagnosisType.Completeness
                                ? item.data?.(res?.report)
                                : item.data?.({
                                      ...res?.report?.evaluation,
                                      fieldsCountTotal,
                                      processesCount:
                                          res?.report?.processes?.length,
                                      disabled: !res?.dimensions?.[item.key],
                                  }),
                        disabled: !res?.dimensions?.[item.key],
                        score: item.scoreKey?.(res?.report),
                    }
                }),
            )
        } catch (err) {
            formatError(err)
        } finally {
            setLoading(false)
        }
    }

    // 返回
    const back = () => {
        if (onClose) {
            onClose()
            return
        }
        if (backUrl) {
            navigator(getInnerUrl(decodeURIComponent(backUrl)))
        } else {
            navigator('/business/diagnosis')
        }
    }

    // 编辑名称
    const toEditBusinessDiagnosis = async (name: string) => {
        try {
            const params = {
                id,
                name,
            }
            await editBusinessDiagnosis(params)
        } catch (e) {
            formatError(e)
        } finally {
            setIsEditName(false)
            getDetails()
        }
    }

    // 跳转指定业务模型
    const toBusinessModel = (tab: TabKey, record) => {
        const url = getActualUrl(
            `/coreBusiness/${record.businessModelID}?domainId=${record.id}&departmentId=&targetTab=${tab}&viewType=business-architecture`,
        )
        window.open(url, '_blank')
        // navigator(
        //     `/coreBusiness/${record.businessModelID}?domainId=${record.id}&departmentId=&targetTab=${tab}&viewType=business-architecture`,
        // )
    }

    const toDetailsModal = (type: DetailsType, record) => {
        let dataInfo
        switch (type) {
            // case DetailsType.noFields:
            //     dataInfo = {
            //         ...record,
            //         data: record.businessFormWithoutInfoItem,
            //     }
            //     break
            // case DetailsType.fieldStandardizationRate:
            //     dataInfo = {
            //         data: record.processes,
            //     }
            //     break
            // case DetailsType.standardizationFieldDistribution:
            //     dataInfo = {
            //         data: record.modalData,
            //     }
            //     break
            // case DetailsType.requiredFields:
            //     dataInfo = {
            //         ...record,
            //         title: `【${record.name}】${__(
            //             '主干业务中的必填字段占比如下：',
            //         )}`,
            //         data: record.forms,
            //         mapData: [
            //             {
            //                 type: __('非必填'),
            //                 value:
            //                     record.fieldsCount - record.requiredFieldsCount,
            //             },
            //             {
            //                 type: __('必填'),
            //                 value: record.requiredFieldsCount,
            //             },
            //         ],
            //     }
            //     break
            // case DetailsType.noBusinessFields:
            //     dataInfo = {
            //         ...record,
            //         title: `【${record.name}】${__(
            //             '主干业务中的非本业务产生字段占比如下：',
            //         )}`,
            //         data: record.forms,
            //         mapData: [
            //             {
            //                 type: __('非本业务产生'),
            //                 value: record.fieldsCount - record.otherFieldsCount,
            //             },
            //             {
            //                 type: __('本业务产生'),
            //                 value: record.otherFieldsCount,
            //             },
            //         ],
            //     }
            //     break
            default:
                dataInfo = {
                    data: record,
                }
                break
        }
        setDetailsInfoModalData({ ...dataInfo, type })
        setDetailsModalOpen(true)
    }

    // 总览第一行 XX率
    const getOverviewRatio = () => {
        const noPercent = (percent, disabled) =>
            !disabled ? (
                `${percent || 0}%`
            ) : (
                <span className={styles['overviewRatio-noPercent']}>
                    {__('未检测')}
                </span>
            )
        return (
            <div className={styles.overviewRatio}>
                {overviewRatio.map((item, idx) => (
                    <div className={styles['overviewRatio-box']} key={idx}>
                        <div />
                        {item.map((innerItem) =>
                            innerItem.type === 'dashboard' ? (
                                <div
                                    key={innerItem.key}
                                    className={styles['overviewRatio-item']}
                                >
                                    <DashBoard dataInfo={innerItem.value} />
                                    <div
                                        className={
                                            styles[
                                                'overviewRatio-dashboard_title'
                                            ]
                                        }
                                    >
                                        <TitleTipsLabel
                                            label={innerItem.title}
                                            tips={
                                                exportingPDF
                                                    ? undefined
                                                    : innerItem.tips
                                            }
                                            fontWeight={400}
                                            showDot
                                        />
                                    </div>
                                </div>
                            ) : innerItem.type === 'progress' ? (
                                <div
                                    key={innerItem.key}
                                    className={styles['overviewRatio-item']}
                                >
                                    <div
                                        className={
                                            styles['overviewRatio-progress']
                                        }
                                    >
                                        <Progress
                                            type="circle"
                                            percent={
                                                isNil(innerItem.value)
                                                    ? 0
                                                    : innerItem.value
                                            }
                                            format={(percent) =>
                                                noPercent(
                                                    percent,
                                                    innerItem.disabled,
                                                )
                                            }
                                            width={98}
                                            strokeWidth={12}
                                            strokeColor={innerItem.color}
                                            trailColor="#E9EEF4"
                                            success={{
                                                strokeColor: innerItem.color,
                                            }}
                                        />
                                    </div>
                                    <TitleTipsLabel
                                        label={innerItem.title}
                                        tips={
                                            exportingPDF
                                                ? undefined
                                                : innerItem.tips
                                        }
                                        fontWeight={400}
                                        showDot
                                    />
                                </div>
                            ) : null,
                        )}
                        <div />
                    </div>
                ))}
            </div>
        )
    }

    // 总览第二行 业务标准字段数量分布
    const getOverviewStandardFieldQuantityDistribution = () => {
        return (
            <div className={styles.overviewDistribution}>
                <div className={styles['overviewDistribution-title']}>
                    <TitleTipsLabel
                        label={__('业务表标准字段数量分布')}
                        showDot
                        fontWeight={550}
                    />
                </div>
                <ColumnMap
                    dataInfo={getColumnDataInfo(overviewDistribution)}
                    disabled={!detailsData?.dimensions?.businessFormComplexity}
                />
            </div>
        )
    }

    // 显示表格
    const getTableList = (item) => {
        const noPaginations = item?.data?.length < 11
        return (
            <div
                className={styles['content-fourth']}
                id={item.key}
                key={item.key}
            >
                <div
                    className={classnames(
                        styles['content-fourth-title'],
                        // noPaginations &&
                        //     styles['content-fourth-noPaginations'],
                        item.disabled && styles['content-fourth-disabled'],
                    )}
                >
                    <TitleTipsLabel
                        label={item.title}
                        tips={exportingPDF ? undefined : item.tips}
                        showDot
                        fontWeight={550}
                    />
                    {has(item, 'scoreKey') && (
                        <span className={styles['content-fourth-percent']}>
                            (
                            {item.disabled || isNil(item.score)
                                ? '--'
                                : item.score}
                            %)
                        </span>
                    )}
                </div>
                <Table
                    pagination={{
                        hideOnSinglePage: true,
                    }}
                    bordered
                    rowKey={v4()}
                    dataSource={item.data || []}
                    columns={item.columns || []}
                    className={styles['content-fourth-table']}
                    locale={{
                        emptyText: (
                            <Empty iconSrc={dataEmpty} desc={__('暂无数据')} />
                        ),
                    }}
                />
            </div>
        )
    }

    const showEmpty = () => {
        return (
            <div className={styles.emptyBox}>
                <Empty
                    desc={
                        <div>
                            <div className={styles.title}>{errMsg}</div>
                            <div className={styles.subText}>
                                {__('可点击下方按钮重新诊断')}
                            </div>
                            <Tooltip
                                title={
                                    detailsData?.process_has_draft?.length
                                        ? __(
                                              '主干业务${name}关联模型存在未发布数据',
                                              {
                                                  name: detailsData?.process_has_draft
                                                      ?.map((item) => item.name)
                                                      ?.join('、'),
                                              },
                                          )
                                        : ''
                                }
                            >
                                <Button
                                    type="primary"
                                    onClick={() => setCreateModalOpen(true)}
                                    hidden={exportingPDF}
                                    disabled={
                                        !!detailsData?.process_has_draft?.length
                                    }
                                >
                                    {__('重新诊断')}
                                </Button>
                            </Tooltip>
                        </div>
                    }
                    iconSrc={diagnosisFailed}
                />
            </div>
        )
    }

    const handleExportPdf = () => {
        const contentBox = container.current
        const originalStyle = contentBox?.style.cssText
        const { height, overflow, position } = contentBox.style

        if (contentBox) {
            // 临时设置样式以显示所有内容
            contentBox.style.height = 'auto'
            contentBox.style.overflow = 'visible'
            contentBox.style.position = 'static'
        }
        // 使用 setTimeout 确保样式更新后再生成PDF
        setTimeout(() => {
            generatePDF(contentRef, {
                filename: `${
                    detailsData?.name || 'business-diagnosis-report'
                }.pdf`,
            })
                .then(() => {
                    // 恢复原始样式
                    if (contentBox) {
                        contentBox.style.height = height
                        contentBox.style.overflow = overflow
                        contentBox.style.position = position
                    }
                    setExportingPDF(false)
                })
                .catch(() => {
                    // 确保样式恢复
                    if (contentBox && originalStyle) {
                        contentBox.style.cssText = originalStyle
                    }
                })
        }, 100)
    }

    return loading ? (
        <Loader />
    ) : (
        <div className={styles.businessDiagnosisDetailsWrapper}>
            <Header back={back} leftContent={<span>{__('查看报告')}</span>} />
            <div className={styles.contentBox} ref={container}>
                <div className={styles.content} ref={contentRef}>
                    <div
                        className={styles['content-title']}
                        id="diagnosisOverview"
                    >
                        <div className={styles['content-title-left']}>
                            {isEditName ? (
                                <SearchInput
                                    placeholder={__('请输入名称')}
                                    value={editName}
                                    className={styles.searchInput}
                                    style={{ width: 600 }}
                                    autoFocus
                                    onBlur={(e) => {
                                        const value = e.target.value.trim()
                                        setEditName(value)
                                        if (
                                            !value ||
                                            value === detailsData?.name
                                        ) {
                                            setIsEditName(false)
                                            return
                                        }
                                        toEditBusinessDiagnosis(value)
                                    }}
                                    showIcon={false}
                                />
                            ) : (
                                <>
                                    <span
                                        title={detailsData?.name}
                                        className={styles['content-title-text']}
                                    >
                                        {editName || detailsData?.name}
                                    </span>
                                    {checkPermission(
                                        'manageBusinessModelAndBusinessDiagnosis',
                                    ) &&
                                        !exportingPDF && (
                                            <BianJiYeMianColored
                                                className={
                                                    styles['content-title-btn']
                                                }
                                                onClick={() =>
                                                    setIsEditName(true)
                                                }
                                                hidden={exportingPDF}
                                            />
                                        )}
                                </>
                            )}
                        </div>
                        <div className={styles['content-title-right']}>
                            {`${__('生成时间：')}${
                                detailsData?.phase === DiagnosisPhase.Done
                                    ? formatTime(
                                          detailsData?.report
                                              ?.creationTimestamp,
                                      )
                                    : '--'
                            }`}
                            {/* <Tooltip title={__('暂不支持导出报告')}>
                               
                            </Tooltip> */}
                            <Button
                                // disabled
                                onClick={() => {
                                    setExportingPDF(true)
                                }}
                                className={styles.export}
                                hidden={exportingPDF || isEditName}
                            >
                                {__('导出报告')}
                            </Button>
                        </div>
                    </div>
                    <div className={styles['content-tags']}>
                        <div className={styles['content-tags-title']}>
                            {`${__('对以下')}${
                                detailsData?.processes?.length || 0
                            }${__('个主干业务进行业务诊断')}`}
                        </div>
                        <DiagnosisTags
                            data={
                                detailsData?.report?.processes?.map((item) => ({
                                    name: item.name,
                                    id: item.id,
                                })) || []
                            }
                        />
                    </div>
                    {detailsData?.phase === DiagnosisPhase.Failed ? (
                        showEmpty()
                    ) : (
                        <>
                            <div className={styles['content-viewTitle']}>
                                {__('总览')}
                            </div>
                            {/* 总览 XX度 */}
                            {getOverviewRatio()}
                            {/* 总览 业务标准字段数量分布 */}
                            {getOverviewStandardFieldQuantityDistribution()}
                            {/* 最后遍历表格数据 */}
                            {anchorList
                                .slice(1)
                                .map(
                                    (item, idx) =>
                                        lastDataList[idx] &&
                                        getTableList(lastDataList[idx]),
                                )}
                            {/* {(detailsData?.dimensions?.completeness ||
                                detailsData?.dimensions?.maturity) &&
                                getFirstLine(firstLineDataList)} */}
                            {/* 业务表字段数量分布 业务表复杂度 */}
                            {/* {detailsData?.dimensions?.businessFormComplexity &&
                                getSecondLine(secondMapData, thirdLineDataList)} */}
                            {/* 最后遍历表格数据 */}
                            {/* {getLastLine(lastDataList)} */}
                        </>
                    )}
                </div>
                <Anchor
                    targetOffset={24}
                    getContainer={() =>
                        (container.current as HTMLElement) || window
                    }
                    onClick={(e: any) => e.preventDefault()}
                    className={styles.anchorWrapper}
                >
                    {anchorList.map((item) => (
                        <Link
                            href={`#${item.key}`}
                            title={item.title}
                            key={item.key}
                        />
                    ))}
                </Anchor>
                {exportingPDF && (
                    <div className={styles.exportingPDFLoading}>
                        <Loader tip={__('导出中，请稍后...')} />
                    </div>
                )}
            </div>

            {detailsModalOpen && (
                <DetailsInfoModal
                    open={detailsModalOpen}
                    onClose={() => setDetailsModalOpen(false)}
                    modalData={detailsInfoModalData}
                    detailData={detailsData?.report}
                />
            )}

            {createModalOpen && (
                <CreateDiagnosis
                    open={createModalOpen}
                    onClose={(toSearch?: boolean) => {
                        setCreateModalOpen(false)
                        if (toSearch) {
                            getDetails()
                        }
                    }}
                    isReDiagnosis
                    id={id}
                />
            )}
        </div>
    )
}

export default BusinessDiagnosisDetails
