import { Tooltip, Progress, Spin, Table } from 'antd'
import classnames from 'classnames'
import {
    CheckCircleFilled,
    WarningFilled,
    ExclamationCircleFilled,
} from '@ant-design/icons'
import { isEmpty, isNil } from 'lodash'
import { v4 } from 'uuid'
import { BusinessModelOutlined, BusinessProcessColored } from '@/icons'
import {
    StateItem,
    IconsType,
    fieldsDistributionTips,
    DiagnosisType,
    DetailsType,
    ListType,
    businessMaturityTips,
    systemMaturityTips,
    dataMaturityTips,
    standardConsistencyTips,
    flowchartConsistencyTips,
    metricConsistencyTips,
} from './const'
import __ from './locale'
import { IDiagnosisType, DiagnosisPhase } from '@/core'
import styles from './Details/styles.module.less'
import { ColumnMap, PieGraph } from './g2plotConfig'
import Empty from '@/ui/Empty'
import dataEmpty from '@/assets/dataEmpty.svg'
import diagnosisFailed from '@/assets/diagnosisFailed.svg'
import { getActualUrl } from '@/utils'
import { TabKey } from '@/components/BusinessModeling/const'
import { StandardSort } from '../CodeRulesComponent/const'
import { TitleTipsLabel } from './components/TitleTipsLabel'

export const getState = (key: string, list: StateItem[]) => {
    const {
        label,
        bgColor = '#d8d8d8',
        width = 8,
    } = list.find((item) => item.value === key) || {}
    return (
        <div style={{ display: 'flex', alignItems: 'center' }}>
            <span
                style={{
                    display: 'inline-block',
                    width,
                    height: width,
                    marginRight: '8px',
                    borderRadius: '50%',
                    background: bgColor,
                }}
            />
            {label}
        </div>
    )
}

export const getDiagnosisContent = (data: IDiagnosisType) => {
    const {
        completeness,
        maturity,
        businessFormComplexity,
        consistency,
        sharing,
    } = data
    const completenessStr = completeness ? __('完整度') : ''
    const maturityStr = maturity ? __('成熟度') : ''
    const consistencyStr = consistency ? __('一致性') : ''
    const sharingStr = sharing ? __('共享率') : ''
    const businessFormComplexityStr = businessFormComplexity
        ? __('业务标准表分析')
        : ''
    const str = [
        completenessStr,
        maturityStr,
        consistencyStr,
        sharingStr,
        businessFormComplexityStr,
    ]
        .filter((item) => item)
        .join('、')
    return str || '--'
}

export const getIcons = (
    type: IconsType,
    disable?: boolean,
    islocked?: boolean,
) => {
    const getIcon = (t: IconsType, disabled?: boolean) => {
        switch (t) {
            case IconsType.succes:
                return (
                    <CheckCircleFilled
                        style={{ color: '#5AE0A9', marginRight: 8 }}
                    />
                )
            case IconsType.details:
                return (
                    <Tooltip
                        title={
                            disabled
                                ? islocked
                                    ? __(
                                          '此主干业务关联的业务模型在项目中正在创建，暂时无法查看',
                                      )
                                    : __('此主干业务未关联业务模型')
                                : __('前往业务模型中查看')
                        }
                        placement="bottom"
                    >
                        <BusinessModelOutlined
                            className={classnames(
                                styles.optionBtn,
                                disabled && styles.disable,
                            )}
                        />
                    </Tooltip>
                )
            case IconsType.info:
                return (
                    <a
                        className={classnames(
                            styles.optionInfo,
                            disabled && styles.disable,
                        )}
                    >
                        {__('查看详情')}
                    </a>
                    // <Tooltip title={__('查看详情')} placement="bottom">
                    //     <ViewInfoOutlined
                    //         className={styles.optionBtn}
                    //         style={{
                    //             cursor: 'pointer',
                    //         }}
                    //     />
                    // </Tooltip>
                )
            default:
                return (
                    <WarningFilled
                        style={{ color: '#FF7777', marginRight: 8 }}
                    />
                )
        }
    }
    return getIcon(type, disable)
}

/**
 * 组装柱状图数据
 */
export const getColumnDataInfo = (data) => {
    // const max = Math.max(...data.map((item) => item?.fields_count || 0))
    // const unit = Math.ceil(max / 6)
    // let dataInfo: any[] = [
    //     { type: '1', value: 1 },
    //     { type: '2', value: 1 },
    //     { type: '3', value: 1 },
    //     { type: '4', value: 1 },
    //     { type: '5', value: 1 },
    //     { type: '6', value: 1 },
    // ]
    // dataInfo = dataInfo.map((item, index) => {
    //     const type =
    //         max > 6 ? `${unit * index + 1}-${unit * (index + 1)}` : item.type
    //     const value = data.filter(
    //         (it) =>
    //             it?.fields_count >= unit * index + 1 &&
    //             it?.fields_count <= unit * (index + 1),
    //     ).length
    //     return {
    //         type,
    //         value,
    //     }
    // })
    // return dataInfo
    const dataInfo: any[] = [
        { type: '0-9', value: 0 },
        { type: '10-24', value: 0 },
        { type: '25-49', value: 0 },
        { type: '50-74', value: 0 },
        { type: '75-99', value: 0 },
        { type: __('大于100'), value: 0 },
    ]
    data?.forEach((item) => {
        const num = item?.standardized_fields_count || 0
        if (num >= 0 && num <= 9) {
            dataInfo[0].value += 1
        } else if (num >= 10 && num <= 24) {
            dataInfo[1].value += 1
        } else if (num >= 25 && num <= 49) {
            dataInfo[2].value += 1
        } else if (num >= 50 && num <= 74) {
            dataInfo[3].value += 1
        } else if (num >= 75 && num <= 99) {
            dataInfo[4].value += 1
        } else if (num >= 100) {
            dataInfo[5].value += 1
        }
    })
    return dataInfo
}

// 详情第一行数据 -- 完整度、成熟度
export const getFirstLine = (data: any[]) => {
    const isSingle = data.filter((item) => item.show)?.length < 2
    return (
        <div className={styles['content-first']}>
            <div className={styles['content-first-box']}>
                {data.map((item) => {
                    return (
                        item.show && (
                            <div
                                className={classnames(
                                    styles['content-first-item'],
                                    isSingle &&
                                        styles['content-first-itemSingle'],
                                )}
                                key={item.key}
                            >
                                <div>
                                    <TitleTipsLabel
                                        label={item.title}
                                        tips={item.tips}
                                        showDot
                                    />
                                </div>
                                <div className={styles['content-first-box']}>
                                    <div
                                        className={styles['content-first-text']}
                                    >
                                        {item.value > 0
                                            ? parseFloat(item.value.toFixed(2))
                                            : 0}
                                        %
                                    </div>
                                    <div
                                        className={
                                            styles['content-first-Progress']
                                        }
                                    >
                                        <Progress
                                            type="circle"
                                            percent={item.value}
                                            format={() => ''}
                                            width={80}
                                            strokeWidth={12}
                                            strokeColor={item.color}
                                            trailColor="#E9EEF4"
                                            success={{
                                                strokeColor: item.color,
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )
                    )
                })}
            </div>
        </div>
    )
}

// 详情第二行数据 -- 业务表复杂度
export const getSecondLine = (secondData, thirdData) => {
    return (
        <>
            <div className={styles['content-second']}>
                <div className={styles['content-second-title']}>
                    <TitleTipsLabel
                        label={__('业务表字段数量分布')}
                        tips={fieldsDistributionTips}
                        showDot
                    />
                </div>
                <ColumnMap dataInfo={getColumnDataInfo(secondData || [])} />
            </div>
            {/* 必填字段分布、非本业务生产字段占比 第三行数据 */}
            <div className={styles['content-third']}>
                {thirdData?.map((item) => {
                    return (
                        <div
                            key={item.key}
                            className={styles['content-third-item']}
                        >
                            <div className={styles['content-first-box']}>
                                <PieGraph
                                    dataInfo={item.data || []}
                                    color={item.color}
                                    lengends={item.lengend}
                                    title={item.title}
                                    tips={item.tips}
                                />
                            </div>
                        </div>
                    )
                })}
            </div>
        </>
    )
}

// 详情最后遍历表格数据
export const getLastLine = (data) => {
    return (
        <div className={styles['content-fourth']}>
            {data?.map((item, ind) => {
                const noPaginations = item?.data?.length < 11
                return (
                    item.show && (
                        <div key={item.key}>
                            <div
                                className={classnames(
                                    styles['content-fourth-title'],
                                    noPaginations &&
                                        styles['content-fourth-noPaginations'],
                                    ind === 0 &&
                                        styles['content-fourth-firstTitle'],
                                )}
                            >
                                {item.title}
                            </div>
                            <Table
                                pagination={{
                                    hideOnSinglePage: true,
                                }}
                                rowKey={v4()}
                                dataSource={item.data || []}
                                columns={item.columns || []}
                                className={styles['content-fourth-table']}
                                scroll={{
                                    y: 500,
                                }}
                                bordered
                                locale={{
                                    emptyText: (
                                        <Empty
                                            iconSrc={dataEmpty}
                                            desc={__('暂无数据')}
                                        />
                                    ),
                                }}
                            />
                        </div>
                    )
                )
            })}
        </div>
    )
}

export const diagnosisTipsInfo = {
    [DiagnosisPhase.Running]: {
        icon: (
            <Spin style={{ backfaceVisibility: 'hidden', outline: 'none' }} />
        ),
        title: __('诊断中'),
        subTitle: __(
            '若诊断的主干业务数量较多，则需要等待时间可能较长，可关闭弹窗，列表中显示已完成后查看诊断结果',
        ),
    },
    [DiagnosisPhase.Done]: {
        icon: <CheckCircleFilled style={{ color: '#74C041' }} />,
        title: __('诊断完成'),
    },
    [DiagnosisPhase.Failed]: {
        icon: <img src={diagnosisFailed} alt="SearchEmpty" height={156} />,
        title: __('失败原因'),
        subTitle: __('可点击下方按钮重新诊断'),
    },
}

export const diagnosisTips = (type: DiagnosisPhase, desc?: string) => {
    return (
        <div className={styles.createEmpty}>
            <div className={styles.icon}>
                {desc ? (
                    <ExclamationCircleFilled style={{ color: '#e60012' }} />
                ) : (
                    diagnosisTipsInfo[type]?.icon
                )}
            </div>
            <div>
                <div className={styles.title}>
                    {desc || diagnosisTipsInfo[type]?.title}
                </div>
                {!desc && (
                    <div className={styles.subText}>
                        {diagnosisTipsInfo[type]?.subTitle}
                    </div>
                )}
            </div>
        </div>
    )
}

export const diagnosisCheckboxList = [
    {
        label: (
            <TitleTipsLabel
                label={__('完整度')}
                tips={[__('诊断内容：「业务模型完整度」')]}
                smallPadding
                fontWeight="normal"
            />
        ),
        value: DiagnosisType.Completeness,
        disabled: () => true,
    },
    {
        label: (
            <TitleTipsLabel
                label={__('成熟度')}
                tips={[
                    __('诊断内容：「业务成熟度」「系统成熟度」「数据成熟度」'),
                ]}
                smallPadding
                fontWeight="normal"
            />
        ),
        value: DiagnosisType.Maturity,
    },
    {
        label: (
            <TitleTipsLabel
                label={__('一致性')}
                tips={[
                    __('诊断内容：「标准一致性」「流程重复性」「指标一致性」'),
                ]}
                smallPadding
                fontWeight="normal"
            />
        ),
        value: DiagnosisType.Consistency,
        disabled: (data) => data.length === 1,
    },
    {
        label: (
            <TitleTipsLabel
                label={__('共享率')}
                tips={[__('诊断内容：「业务共享率」')]}
                smallPadding
                fontWeight="normal"
            />
        ),
        value: DiagnosisType.SharingRate,
    },
    {
        label: (
            <TitleTipsLabel
                label={__('业务标准表分析')}
                tips={[__('诊断内容：「业务表标准字段数量分布」')]}
                smallPadding
                fontWeight="normal"
            />
        ),
        value: DiagnosisType.BusinessFormComplexity,
    },
]
export const isJsonString = (str) => {
    try {
        JSON.parse(str)
    } catch (e) {
        return false
    }
    return true
}

/**
 * 详情弹窗中表格项 - 主干业务
 */
const tableProcessItem = (record) => {
    const modelDisbaled = !record.businessModelID || record.businessModelLocked
    return (
        <div className={styles.tableProcessItem}>
            <BusinessProcessColored className={styles.icon} />
            <span className={styles.text} title={record.name}>
                {record.name}
            </span>
            <div
                onClick={() => {
                    if (modelDisbaled) return
                    const url = getActualUrl(
                        `/coreBusiness/${record.businessModelID}?domainId=${record.id}&departmentId=&targetTab=${TabKey.FORM}&viewType=business-architecture`,
                    )
                    window.open(url, '_blank')
                }}
            >
                {getIcons(
                    IconsType.details,
                    modelDisbaled,
                    record?.businessModelLocked,
                )}
            </div>
        </div>
    )
}

const tableMaxTwoLinesItem = (value) => (
    <div className={styles.tableMaxTwoLine} title={value}>
        {value?.length > 0 ? value?.join('；') : '--'}
    </div>
)

/**
 * 详情弹窗类型信息
 */
export const detailsTypeMap: any = {
    [DetailsType.noFields]: {
        title: __('无信息项业务表'),
        width: 640,
        topTitle: (record) =>
            __('【${name}】的主干业务中以下${num}张表没有字段', {
                name: record?.name,
                num: record?.completeness?.businessFormWithoutInfoItem?.length,
            }),
    },
    [DetailsType.fieldStandardizationRate]: {
        // 类型名称
        typeName: __('业务成熟度'),
        // 类型提示
        typeTips: businessMaturityTips,
        // 指标名称
        name: __('业务字段标准化率'),
        // 指标提示
        tips: [
            __(
                '业务标准表的字段标准化率 = 已匹配标准的属性数 / 需要标准化的属性总数 * 100%',
            ),
        ],
        // 弹窗标题
        title: __('业务表标准字段分布详情'),
        // 弹窗宽度
        width: 800,
        // 弹窗左侧列表类型
        listType: ListType.BusinessProcess,
        // 弹窗右侧标题
        topTitle: () => __('未标准化字段详情如下：'),
        tableData: (record) =>
            record?.maturity?.business_maturity?.standardized_ratio
                ?.unstandardizedFields,
        // 弹窗右侧表格项
        columns: [
            {
                title: __('业务标准表名称'),
                dataIndex: 'name',
                key: 'name',
                ellipsis: true,
                width: 200,
                render: (text, record) => text || '--',
            },
            {
                title: __('未标准化字段'),
                dataIndex: 'fields',
                key: 'fields',

                render: (text, record) => tableMaxTwoLinesItem(text),
            },
        ],
    },
    [DetailsType.businessClosureRate]: {
        typeName: __('业务成熟度'),
        typeTips: businessMaturityTips,
        name: __('业务闭环率'),
        tips: [
            __(
                '业务闭环率 = 可闭环的业务节点数 / 关联表单的业务节点总数 * 100%',
            ),
        ],
        title: __('业务流程图闭环详情'),
        width: 1200,
        topTitle: () => __('流程图闭环详情如下：'),
        tableData: (record) => record?.processes,
        columns: [
            {
                title: __('主干业务'),
                dataIndex: 'name',
                key: 'name',
                width: 170,
                render: (_, record) => tableProcessItem(record),
            },
            {
                title: __('是否闭环'),
                dataIndex: 'isClosed',
                key: 'isClosed',
                width: 80,
                render: (_, record) =>
                    isNil(record.maturity?.business_maturity?.closed_loop) ||
                    !record.maturity?.business_maturity?.closed_loop
                        ?.total_node_number ||
                    record.maturity?.business_maturity?.closed_loop
                        ?.flowchart_status === 'NotCompleted'
                        ? '--'
                        : record.maturity?.business_maturity.closed_loop
                              ?.un_closed_loop_node_number
                        ? __('否')
                        : __('是'),
            },
            {
                title: __('流程图节点数量'),
                dataIndex: 'nodeNumber',
                key: 'nodeNumber',
                width: 120,
                render: (_, record) =>
                    isNil(record.maturity?.business_maturity?.closed_loop)
                        ? '--'
                        : record.maturity?.business_maturity?.closed_loop
                              ?.total_node_number,
            },
            {
                title: __('未闭环节点数量'),
                dataIndex: 'un_closed_loop_node_number',
                key: 'un_closed_loop_node_number',
                width: 120,
                render: (_, record) =>
                    isNil(record.maturity?.business_maturity?.closed_loop)
                        ? '--'
                        : record.maturity?.business_maturity?.closed_loop
                              ?.un_closed_loop_node_number,
            },
            {
                title: __('问题节点名称'),
                dataIndex: 'problem_node_name',
                key: 'problem_node_name',
                width: 130,
                render: (_, record) =>
                    record.maturity?.business_maturity?.closed_loop?.unclosed_loop_node
                        ?.map((item) => item?.name)
                        ?.join('；') || '--',
            },
            {
                title: __('问题表名称'),
                dataIndex: 'problem_table_name',
                key: 'problem_table_name',
                width: 130,
                render: (_, record) =>
                    record.maturity?.business_maturity?.closed_loop?.unclosed_loop_node
                        ?.map((item) =>
                            item?.unclosed_node_table_info
                                ?.map((tableInfo) => tableInfo.table_name)
                                ?.join('；'),
                        )
                        ?.join('；') || '--',
            },
            {
                title: __('问题字段名称'),
                dataIndex: 'problem_field_name',
                key: 'problem_field_name',
                width: 185,
                render: (_, record) =>
                    record.maturity?.business_maturity?.closed_loop?.unclosed_loop_node
                        ?.map((item) =>
                            item?.unclosed_node_table_info
                                ?.map((tableInfo) =>
                                    tableInfo?.fields?.join('；'),
                                )
                                ?.join('；'),
                        )
                        ?.join('；') || '--',
            },
        ],
    },
    [DetailsType.processRedundancyRate]: {
        typeName: __('业务成熟度'),
        typeTips: businessMaturityTips,
        name: __('流程冗余率'),
        tips: [__('流程冗余率 = 重复业务节点数 / 业务节点总数 * 100%')],
        title: __('主干业务冗余详情'),
        width: 1000,
        listType: ListType.BusinessProcess,
        topTitle: () => __('冗余详情如下：'),
        tableData: (record) =>
            record?.maturity?.business_maturity?.flowchart_redundancy_ratio
                ?.fields,
        columns: [
            {
                title: __('流程图节点名称'),
                dataIndex: 'name',
                key: 'name',
                ellipsis: true,
                render: (text, record) => text || '--',
            },
            // {
            //     title: __('节点是否重复'),
            //     dataIndex: 'isRepeat',
            //     key: 'isRepeat',
            //     render: (_, record) =>
            //         record?.repeat_fields?.length ? __('是') : __('否'),
            // },
            {
                title: __('冗余类型'),
                dataIndex: 'type',
                key: 'type',
                render: (text, record) =>
                    text === 'node_name' ? __('名称冗余') : __('字段冗余'),
            },
            {
                title: __('关联业务表名称'),
                dataIndex: 'related_form_name',
                key: 'related_form_name',
                ellipsis: true,
                render: (text, record) => tableMaxTwoLinesItem(text),
            },
            {
                title: __('重复字段数量'),
                dataIndex: 'repeat_count',
                key: 'repeat_count',
                render: (_, record) =>
                    record?.repeat_fields?.length?.toString() || '--',
            },
            {
                title: __('重复字段'),
                dataIndex: 'repeat_fields',
                key: 'repeat_fields',
                render: (text, record) => tableMaxTwoLinesItem(text),
            },
        ],
    },
    [DetailsType.informationRate]: {
        typeName: __('系统成熟度'),
        typeTips: systemMaturityTips,
        name: __('业务信息化率'),
        tips: [
            __('业务信息化率 = 关联信息系统的主干业务数 / 主干业务总数 * 100%'),
        ],
        title: __('主干业务信息化详情'),
        width: 600,
        topTitle: () => __('信息化详情如下：'),
        tableData: (record) => record?.processes,
        columns: [
            {
                title: __('主干业务'),
                dataIndex: 'name',
                key: 'name',
                render: (_, record) => tableProcessItem(record),
            },
            {
                title: __('是否关联信息系统'),
                dataIndex: 'infoSystem',
                key: 'infoSystem',
                width: '30%',
                render: (text, record) =>
                    record.maturity?.system_maturity?.business_information_ratio
                        ?.has_business_system
                        ? __('是')
                        : __('否'),
            },
        ],
    },
    [DetailsType.dataIntegrity]: {
        typeName: __('系统成熟度'),
        typeTips: systemMaturityTips,
        name: __('数据完整度'),
        tips: [
            __(
                '数据完整度 = 可映射业务标准表字段的数据表的字段数 / 业务标准表字段总数 * 100%',
            ),
        ],
        title: __('数据完整度详情'),
        width: 1000,
        listType: ListType.BusinessProcess,
        topTitle: () => __('完整度详情如下：'),
        tableData: (record) =>
            record?.maturity?.system_maturity?.data_perfection_ratio
                ?.forms_data_perfection,
        columns: [
            {
                title: __('业务标准表名称'),
                dataIndex: 'form_name',
                key: 'form_name',
                ellipsis: true,
                render: (text, record) => text || '--',
            },
            {
                title: __('字段数量'),
                dataIndex: 'fields_number',
                key: 'fields_number',
                ellipsis: true,
                render: (text, record) => text?.toString() || '--',
            },
            {
                title: __('未关联字段数量'),
                dataIndex: 'un_related_fields_count',
                key: 'un_related_fields_count',
                render: (_, record) =>
                    record?.no_real_table_fields?.length?.toString() || '--',
            },
            {
                title: __('未关联字段'),
                dataIndex: 'no_real_table_fields',
                key: 'no_real_table_fields',
                render: (text, record) => text?.join('；') || '--',
            },
            {
                title: __('关联库表'),
                dataIndex: 'form_view_name',
                key: 'form_view_name',
                ellipsis: true,
                render: (text, record) => text || '--',
            },
        ],
    },
    [DetailsType.standardRate]: {
        typeName: __('系统成熟度'),
        typeTips: systemMaturityTips,
        name: __('数据标准率'),
        tips: [
            __(
                '数据标准率 = 可匹配业务标准表字段标准的数据表字段数 / 业务标准表是标准字段总数 * 100%',
            ),
        ],
        title: __('数据标准详情'),
        width: 800,
        listType: ListType.BusinessProcess,
        topTitle: () => __('数据标准详情如下：'),
        tableData: (record) =>
            record?.maturity?.system_maturity?.data_standardized_ratio
                ?.form_data_standardization_ration,
        columns: [
            {
                title: __('业务标准表名称'),
                dataIndex: 'form_name',
                key: 'form_name',
                ellipsis: true,
                render: (text, record) => text || '--',
            },
            {
                title: __('关联库表'),
                dataIndex: 'form_view_name',
                key: 'form_view_name',
                ellipsis: true,
                render: (text, record) => text || '--',
            },
            {
                title: __('库表中不符合标准的字段'),
                dataIndex: 'missing_standardized_fields',
                key: 'missing_standardized_fields',
                width: '50%',
                ellipsis: true,
                render: (text, record) =>
                    record.form_view_name?.length > 0
                        ? tableMaxTwoLinesItem(text)
                        : '--',
            },
        ],
    },
    [DetailsType.formMaturity]: {
        typeName: __('数据成熟度'),
        typeTips: dataMaturityTips,
        name: __('表数据成熟度'),
        title: __('数据成熟度详情'),
        width: 800,
        listType: ListType.BusinessProcess,
        topTitle: () => __('成熟度详情如下：'),
        tableData: (record) => record?.maturity?.data_maturity?.forms,
        columns: [
            {
                title: __('业务标准表名称'),
                dataIndex: 'form_name',
                key: 'form_name',
                width: 200,
                ellipsis: true,
                render: (text, record) => text || '--',
            },
            {
                title: __('关联库表'),
                dataIndex: 'form_view_name',
                key: 'form_view_name',
                width: 200,
                ellipsis: true,
                render: (text, record) => text || '--',
            },
            {
                title: __('唯一性'),
                dataIndex: 'uniquenessScore',
                key: 'uniquenessScore',
                width: 80,
                ellipsis: true,
                render: (text, record) => (isNil(text) ? '--' : text),
            },
            {
                title: __('完整性'),
                dataIndex: 'completenessScore',
                key: 'completenessScore',
                width: 80,
                ellipsis: true,
                render: (text, record) => (isNil(text) ? '--' : text),
            },
            {
                title: __('准确性'),
                dataIndex: 'accuracyScore',
                key: 'accuracyScore',
                width: 80,
                ellipsis: true,
                render: (text, record) => (isNil(text) ? '--' : text),
            },
            {
                title: __('规范性'),
                dataIndex: 'normativeScore',
                key: 'normativeScore',
                width: 80,
                ellipsis: true,
                render: (text, record) => (isNil(text) ? '--' : text),
            },
            // {
            //     title: __('一致性'),
            //     dataIndex: 'consistencyScore',
            //     key: 'consistencyScore',
            //     width: 80,
            //     ellipsis: true,
            //     render: (text, record) => (isNil(text) ? '--' : text),
            // },
            {
                title: __('及时性'),
                dataIndex: 'timelinessScore',
                key: 'timelinessScore',
                width: 80,
                ellipsis: true,
                render: (text, record) => (isNil(text) ? '--' : text),
            },
        ],
    },
    [DetailsType.standardConsistency]: {
        typeName: __('标准一致性'),
        typeTips: standardConsistencyTips,
        title: __('标准一致性详情'),
        width: 800,
        listType: ListType.Field,
        topTitle: () => __('标准一致性详情如下：'),
        tableData: (record) => record?.form_info,
        columns: [
            {
                title: __('所属主干业务'),
                dataIndex: 'name',
                key: 'name',
                render: (_, record) => tableProcessItem(record),
            },
            {
                title: __('所属业务标准表'),
                dataIndex: 'form_name',
                key: 'form_name',
                ellipsis: true,
                render: (text, record) => text || '--',
            },
            {
                title: __('标准分类'),
                dataIndex: 'formulate_basis',
                key: 'formulate_basis',
                ellipsis: true,
                render: (text, record) => text || '--',
            },
        ],
    },
    [DetailsType.flowchartConsistency]: {
        typeName: __('流程重复性'),
        typeTips: flowchartConsistencyTips,
        title: __('流程重复性详情'),
        width: 800,
        listType: ListType.FlowchartNode,
        topTitle: () => __('流程重复性详情如下：'),
        tableData: (record) => record?.group,
        columns: [
            {
                title: __('相似的主干业务'),
                dataIndex: 'business_process_name',
                key: 'business_process_name',
                ellipsis: true,
                render: (text, record) => text || '--',
            },
            {
                title: __('相似的流程图节点数量'),
                dataIndex: 'count',
                key: 'count',
                ellipsis: true,
                render: (text, record) => (isNil(text) ? '--' : text),
            },
            {
                title: __('相似的节点名称'),
                dataIndex: 'nodes',
                key: 'nodes',
                render: (text, record) => text?.join('；') || '--',
            },
            // {
            //     title: __('相似字段'),
            //     dataIndex: 'fields',
            //     key: 'fields',
            //     render: (text, record) => text,
            // },
            {
                title: __('活动节点总数量'),
                dataIndex: 'total_count',
                key: 'total_count',
                render: (text, record) =>
                    record.nodes?.length?.toString() || '--',
            },
        ],
    },
    [DetailsType.metricConsistency]: {
        typeName: __('指标一致性'),
        typeTips: metricConsistencyTips,
        title: __('指标一致性详情'),
        width: 800,
        listType: ListType.Metric,
        topTitle: () => __('指标一致性详情如下：'),
        tableData: (record) => record?.business_process_info,
        columns: [
            {
                title: __('所属主干业务'),
                dataIndex: 'name',
                key: 'name',
                render: (_, record) => tableProcessItem(record),
            },
        ],
    },
    [DetailsType.businessSharingRate]: {
        typeName: __('业务共享率'),
        title: __('业务共享详情'),
        width: 800,
        listType: ListType.BusinessProcess,
        topTitle: () => __('共享详情如下：'),
        tableData: (record) =>
            record?.businessSharing?.standard_form_catalog_list,
        columns: [
            {
                title: __('业务标准表名称'),
                dataIndex: 'standard_form_name',
                key: 'standard_form_name',
                width: 200,
                ellipsis: true,
                render: (text, record) => text || '--',
            },
            {
                title: __('关联信息资源目录'),
                dataIndex: 'catalog_name',
                key: 'catalog_name',
                width: 200,
                ellipsis: true,
                render: (text, record) => text || '--',
            },
        ],
    },
    [DetailsType.standardizationFieldDistribution]: {
        typeName: __('业务表标准字段数量分布'),
        title: __('业务表标准字段数量分布详情'),
        width: 800,
        listType: ListType.BusinessProcess,
        topTitle: (record) =>
            __('平均业务标准表字段数量：${num} 个', {
                num: `${
                    isEmpty(record?.businessFormComplexity?.forms)
                        ? '0'
                        : Number(
                              (
                                  record.businessFormComplexity
                                      .standardized_fields_count /
                                  record.businessFormComplexity.forms.length
                              ).toFixed(1),
                          )
                }`,
            }),
        tableData: (record) => record?.businessFormComplexity?.forms,
        columns: [
            {
                title: __('业务标准表名称'),
                dataIndex: 'name',
                key: 'name',
                ellipsis: true,
                width: 180,
            },
            {
                title: __('字段数量'),
                dataIndex: 'fields_count',
                key: 'fields_count',
                width: 100,
            },
            {
                title: __('需要标准化字段数量'),
                dataIndex: 'standard_required_fields_number',
                key: 'standard_required_fields_number',
                width: 160,
            },
            {
                title: __('已标准化字段数量'),
                dataIndex: 'standardized_fields_count',
                key: 'standardized_fields_count',
                width: 160,
            },
        ],
    },
    // [DetailsType.requiredFields]: {
    //     title: __('查看详情'),
    //     width: 640,
    //     columns: [
    //         {
    //             title: __('业务表名称'),
    //             dataIndex: 'name',
    //             key: 'name',
    //             ellipsis: true,
    //         },
    //         {
    //             title: __('必填字段数量'),
    //             dataIndex: 'fields_required_count',
    //             key: 'fields_required_count',
    //         },
    //         {
    //             title: __('总字段数量'),
    //             dataIndex: 'fields_count',
    //             key: 'fields_count',
    //         },
    //     ],
    // },
    // [DetailsType.noBusinessFields]: {
    //     title: __('查看详情'),
    //     width: 640,
    //     columns: [
    //         {
    //             title: __('业务表名称'),
    //             dataIndex: 'name',
    //             key: 'name',
    //             ellipsis: true,
    //         },
    //         {
    //             title: __('非本业务产生字段数量'),
    //             dataIndex: 'fields_from_other_business',
    //             key: 'fields_from_other_business',
    //         },
    //         {
    //             title: __('总字段数量'),
    //             dataIndex: 'fields_count',
    //             key: 'fields_count',
    //         },
    //     ],
    // },
}

/**
 * 弹窗左侧列表分类类型信息
 */
export const listTypeMap = {
    [ListType.BusinessProcess]: { name: __('主干业务') },
    [ListType.Field]: { name: __('标准不一致字段') },
    [ListType.Metric]: { name: __('指标') },
    [ListType.FlowchartNode]: { name: __('主干业务') },
}
