import { isNil } from 'lodash'
import __ from './locale'
import { DiagnosisPhase } from '@/core'

export enum OperateType {
    cancel,
    details,
    del,
    rerun,
    // 提交
    submit,
    // 撤回
    revocation,
}

export enum DiagnosisType {
    // 完整度
    Completeness = 'completeness',
    // 成熟度
    Maturity = 'maturity',
    // 一致性
    Consistency = 'consistency',
    // 共享率
    SharingRate = 'sharing',
    // 业务标准表字段分布
    BusinessFormComplexity = 'businessFormComplexity',
}

export const phaseList: StateItem[] = [
    { label: __('诊断中'), value: DiagnosisPhase.Running, bgColor: '#2F9BFF' },
    { label: __('已完成'), value: DiagnosisPhase.Done, bgColor: '#52C41B' },
    { label: __('失败'), value: DiagnosisPhase.Failed, bgColor: '#FF5E60' },
    {
        label: __('已取消'),
        value: DiagnosisPhase.Canceled,
        bgColor: 'rgba(0, 0, 0, 0.30)',
    },
]

export interface StateItem {
    label: string
    value: string | number
    bgColor: string
    width?: number
}

export const fieldsDistributionTips = [
    __('字段数量区间内存在业务表的数量是评估业务表复杂度的重要依据之一；'),
    __('字段数量越多，业务表复杂度越高。'),
]

export const requiredFieldsTips = [
    __('必填字段占比是评估业务表复杂度的重要依据之一；'),
    __('必填字段占比越高，业务表复杂度越高。'),
]
export const noBusinessFieldsTips = [
    __('非本业务产生字段占比是评估业务表复杂度的重要依据之一；'),
    __('非本业务产生段占比越高，业务表复杂度越高。'),
]

/**
 * 综合评分
 */
export const comprehensiveEvaluationTips = [
    __('完整度评分，综合评分 = 完整度 * 权重 * 100%；'),
    __(
        '完整度与成熟度的综合评分，综合评分 =（完整度 * 权重 + 成熟度 * 权重）* 100%；',
    ),
    __(
        '完整度与一致性的综合评分，综合评分 =（完整度 * 权重 + 协同性（一致性）* 权重）* 100%；',
    ),
    __(
        '完整度与一致性与成熟度的综合评分，综合评分 =（完整度 * 权重 + 成熟度 * 权重 + 协同性（一致性）* 权重）* 100%',
    ),
]

/**
 * 完整度
 */
export const completenessTips = [
    __(
        '通过诊断业务节点表、流程图、业务指标是否存在和以及否规范来评估完整度，越完整和规范，主干业务对应业务模型完整度越高；',
    ),
    __(
        '「业务节点表信息」「业务节点表字段信息」「流程图信息」「每个流程节点是否关联业务节点表」「业务指标信息」5个部分，若存在这些信息，则存在值记为1，反之记为0；',
    ),
    __(
        '单个主干业务完整度 =（业务节点表信息 + 业务节点表字段信息 + 流程图信息 + 每个流程节点是否关联业务节点表 + 业务指标信息）的值 / 5 * 100%；',
    ),
    __('多个主干业务完整度 = 单个主干业务完整度的值之和 / 主干业务数'),
]

/**
 * 成熟度
 */
export const maturityTips = [
    __(
        '成熟度 = （业务成熟度 * 权重 + 系统成熟度 * 权重 + 数据成熟度 * 权重）* 100%',
    ),
]

/**
 * 一致性
 */
export const consistencyTips = [
    __(
        '一致性 =（标准一致性 * 权重 +（1 - 流程一致性）* 权重 + 指标一致性 * 权重）* 100%',
    ),
]

/** 标准一致性 */
export const standardConsistencyTips = [
    __(
        '标准一致性 = 已配置相同数据标准的字段数 / 需配置相同数据标准的字段总数 * 100%',
    ),
]

/** 流程一致性 */
export const flowchartConsistencyTips = [
    __('流程一致性 = 相同流程节点数 / 流程节点总数 * 100%'),
]

/** 指标一致性 */
export const metricConsistencyTips = [
    __('指标一致性 = 相同的指标数 / 指标名称相似的指标总数 * 100%'),
]
/**
 * 共享率
 */
export const sharingRateTips = [
    __('共享率=已发布为信息资源目录的业务标准表数量 / 业务标准表总数 '),
]

/**
 * 业务成熟度
 */
export const businessMaturityTips = [
    __(
        '业务成熟度 =（业务字段标准化率 * 权重 + 业务闭环率 * 权重 +（1 - 流程冗余率）* 权重）* 100%）',
    ),
]

/**
 * 系统成熟度
 */
export const systemMaturityTips = [
    __(
        '系统成熟度 =（业务信息化率 * 权重 + 数据完整度 * 权重 + 数据标准率 * 权重）* 100%',
    ),
]

/**
 * 数据成熟度
 */
export const dataMaturityTips = [
    __(
        '数据成熟度 = 业务标准表对应的数据表成熟度分数之和 / 总业务标准表数 * 100%',
    ),
]

export const firstLineData = [
    {
        key: 'completeness',
        title: __('完整度'),
        value: 0,
        color: '#6591FF',
        tips: completenessTips,
    },
    {
        key: 'maturity',
        title: __('综合成熟度'),
        value: 0,
        color: '#FFCD3A',
        tips: maturityTips,
    },
]

/**
 * 总览 XX 率数据
 */
export const overviewRatioData = [
    [
        {
            key: 'comprehensiveEvaluation',
            title: __('综合评分'),
            value: 0,
            color: '#5AE0A9',
            tips: comprehensiveEvaluationTips,
            type: 'dashboard',
            scoreKey: (record) => record?.comprehensiveEvaluation,
        },
        {
            key: DiagnosisType.Completeness,
            title: __('完整度'),
            value: 0,
            color: '#3AC4FF',
            tips: completenessTips,
            type: 'progress',
            scoreKey: (record) =>
                record?.evaluation?.completenessEvaluation
                    ?.comprehensiveCompleteness,
        },
        {
            key: DiagnosisType.Maturity,
            title: __('成熟度'),
            value: 0,
            color: '#5AE0A9',
            tips: maturityTips,
            type: 'progress',
            scoreKey: (record) =>
                record?.evaluation?.maturityEvaluation?.comprehensiveMaturity,
        },
        {
            key: DiagnosisType.Consistency,
            title: __('一致性'),
            value: 0,
            color: '#5AE0A9',
            tips: consistencyTips,
            type: 'progress',
            scoreKey: (record) =>
                record?.evaluation?.consistencyEvaluation
                    ?.comprehensiveConsistency,
        },
    ],
    [
        {
            key: DiagnosisType.SharingRate,
            title: __('共享率'),
            value: 0,
            color: '#5AE0A9',
            tips: sharingRateTips,
            type: 'progress',
            scoreKey: (record) =>
                record?.evaluation?.sharingRateEvaluation
                    ?.comprehensiveSharingRate,
        },
    ],
]

export const thirdLineData = [
    {
        key: 'requiredFields',
        title: __('必填字段占比'),
        tips: requiredFieldsTips,
        data: [],
        color: ['#E9EEF4', '#C5ACFF'],
        lengend: [__('非必填'), __('必填')],
    },
    {
        key: 'noBusinessFields',
        title: __('非本业务产生字段占比'),
        tips: noBusinessFieldsTips,
        data: [],
        color: ['#E9EEF4', '#5AE0A9'],
        lengend: [__('本业务产生'), __('非本业务产生')],
    },
]

export enum flowchartList {
    // 流程图完整
    Completed = 'Completed',
    // 缺少流程图
    FlowchartMissing = 'FlowchartMissing',
    // 缺少节点
    PointMissing = 'PointMissing',
    // 缺少开始节点
    StartingPointMissing = 'StartingPointMissing',
    // 缺少结束节点
    EndingPointMissing = 'EndingPointMissing',
    // 缺少开始和结束节点
    StartingAndEndingPointMissing = 'StartingAndEndingPointMissing',
    // 节点没有关联任何流程节点
    NoRelatedForm = 'NoRelatedForm',
    // 流程图不完整
    NotCompleted = 'NotCompleted',
}

export const flowchartListStr = {
    '': __('未检测到流程图'),
    [flowchartList.Completed]: __('检测到流程图，正常'),
    [flowchartList.FlowchartMissing]: __('未检测到流程图'),
    [flowchartList.PointMissing]: __('未检测到节点'),
    [flowchartList.StartingPointMissing]: __('无开始节点'),
    [flowchartList.EndingPointMissing]: __('无结束节点'),
    [flowchartList.StartingAndEndingPointMissing]: __('无开始和结束节点'),
    [flowchartList.NoRelatedForm]: __('流程图至少包含一个流程节点'),
    [flowchartList.NotCompleted]: __('流程图不完整'),
}
export enum IconsType {
    succes,
    error,
    details,
    info,
}

/**
 * 详情弹窗类型
 */
export enum DetailsType {
    noFields = 1,
    // 业务成熟度 - 业务字段标准化率
    fieldStandardizationRate,
    // 业务成熟度 - 业务闭环率
    businessClosureRate,
    // 业务成熟度 - 流程冗余率
    processRedundancyRate,
    // 系统成熟度 - 业务信息化率
    informationRate,
    // 系统成熟度 - 数据完整度
    dataIntegrity,
    // 系统成熟度 - 数据标准率
    standardRate,
    // 数据成熟度 - 表数据成熟度
    formMaturity,
    // 标准一致性
    standardConsistency,
    // 流程一致性
    flowchartConsistency,
    // 指标一致性
    metricConsistency,
    // 业务共享率
    businessSharingRate,
    // 业务表标准字段数量分布
    standardizationFieldDistribution,
    // requiredFields,
    // noBusinessFields,
}

/**
 * 弹窗左侧列表分类类型
 */
export enum ListType {
    // 主干业务
    BusinessProcess = 1,
    // 字段
    Field,
    // 指标
    Metric,
    // 流程图节点
    FlowchartNode,
}

export interface IDetailsData {
    type: DetailsType
    data: any
    mapData?: any
}

export const tagsDetailsInfo: any[] = [
    { label: __('主干业务名称'), key: 'name', span: 24, value: '' },
    { label: __('业务领域路径'), key: 'path', span: 24, value: '' },
    { label: __('所属部门'), key: 'department_name', span: 24, value: '' },
    {
        label: __('关联信息系统'),
        key: 'business_system_name',
        span: 24,
        value: '',
    },
]

/**
 * 报告锚点
 */
export const anchorList = [
    {
        key: 'diagnosisOverview',
        title: __('总览'),
    },
    {
        key: DiagnosisType.Completeness,
        title: __('完整度分析'),
    },
    {
        key: DiagnosisType.Maturity,
        title: __('成熟度分析'),
    },
    {
        key: DiagnosisType.Consistency,
        title: __('一致性分析'),
    },
    {
        key: DiagnosisType.SharingRate,
        title: __('共享率分析'),
    },
    {
        key: DiagnosisType.BusinessFormComplexity,
        title: __('业务表复杂度分析'),
    },
]

/**
 * 成熟度分析表格数据
 */
export const maturityTableList = (record?) => [
    {
        key: DetailsType.fieldStandardizationRate,
        disabled: record?.disabled,
        // 类型列值
        typeValue:
            record?.maturityEvaluation?.businessMaturity?.businessMaturity,
        // 指标列值
        metricsValue:
            record?.maturityEvaluation?.businessMaturity?.businessFieldStandard
                ?.businessFieldStandardRate,
        // 结果说明
        desc: record?.disabled
            ? '--'
            : record?.maturityEvaluation?.businessMaturity
                  ?.businessFieldStandard?.businessFieldStandardRate !== 100
            ? `${__(
                  '共${num1}个需要标准化字段，其中未标准化的为${num2}个字段',
                  {
                      num1: `${
                          record?.maturityEvaluation?.businessMaturity
                              ?.businessFieldStandard?.needStandardFieldCount ||
                          0
                      }`,
                      num2: `${
                          record?.maturityEvaluation?.businessMaturity
                              ?.businessFieldStandard
                              ?.unstandardizedFieldCount || 0
                      }`,
                  },
              )}`
            : `${__('共${num1}个需要标准化字段，已全部标准化', {
                  num1: `${
                      record?.maturityEvaluation?.businessMaturity
                          ?.businessFieldStandard?.needStandardFieldCount || 0
                  }`,
              })}`,
    },
    {
        key: DetailsType.businessClosureRate,
        disabled: record?.disabled,
        metricsValue:
            record?.maturityEvaluation?.businessMaturity?.businessClosure
                ?.businessFieldStandardRate,
        desc: record?.disabled
            ? '--'
            : // record?.maturityEvaluation?.businessMaturity?.businessClosure
              //       ?.businessFieldStandardRate !== 100
              // ?
              __(
                  '共${num1}个流程图节点，其中完整流程图的节点${num2}个，闭环的流程图节点${num3}个',
                  {
                      num1: `${
                          record?.maturityEvaluation?.businessMaturity
                              ?.businessClosure?.flowchartNodeCount || 0
                      }`,
                      num2: `${
                          record?.maturityEvaluation?.businessMaturity
                              ?.businessClosure?.flowchartValidNodeCount || 0
                      }`,
                      num3: `${
                          record?.maturityEvaluation?.businessMaturity
                              ?.businessClosure?.flowchartClosureNodeCount || 0
                      }`,
                  },
              ),
        // : __('共${num1}个流程图节点，已全部闭环', {
        //       num1: `${
        //           record?.maturityEvaluation?.businessMaturity
        //               ?.businessClosure?.flowchartNodeCount || 0
        //       }`,
        //   }),
    },
    {
        key: DetailsType.processRedundancyRate,
        disabled: record?.disabled,
        metricsValue:
            record?.maturityEvaluation?.businessMaturity?.flowchartRedundancy
                ?.businessFieldStandardRate,
        desc: record?.disabled
            ? '--'
            : __(
                  '共${num1}个流程图节点，其中${num2}个节点重复；节点关联业务表的字段共${num3}个，其中${num4}个字段重复',
                  {
                      num1: `${
                          record?.maturityEvaluation?.businessMaturity
                              ?.flowchartRedundancy?.flowchartNodeCount || 0
                      }`,
                      num2: `${
                          record?.maturityEvaluation?.businessMaturity
                              ?.flowchartRedundancy
                              ?.flowchartDuplicateNodeCount || 0
                      }`,
                      num3: `${
                          record?.maturityEvaluation?.businessMaturity
                              ?.flowchartRedundancy?.nodeRelateFormFieldCount ||
                          0
                      }`,
                      num4: `${
                          record?.maturityEvaluation?.businessMaturity
                              ?.flowchartRedundancy
                              ?.nodeRelateFormFieldDuplicateCount || 0
                      }`,
                  },
              ),
    },
    {
        key: DetailsType.informationRate,
        disabled: record?.disabled,
        typeValue: record?.maturityEvaluation?.systemMaturity?.systemMaturity,
        metricsValue:
            record?.maturityEvaluation?.systemMaturity?.businessInformationPart
                ?.businessInformationRate,
        desc: record?.disabled
            ? '--'
            : record?.maturityEvaluation?.systemMaturity
                  ?.businessInformationPart?.businessInformationRate !== 100
            ? __('共${num1}个主干业务，其中${num2}个未关联信息系统', {
                  num1: `${
                      record?.maturityEvaluation?.systemMaturity
                          ?.businessInformationPart?.processCount || 0
                  }`,
                  num2: `${
                      record?.maturityEvaluation?.systemMaturity
                          ?.businessInformationPart
                          ?.processNoRelateInfoSystemCount || 0
                  }`,
              })
            : __('共${num1}个主干业务，已全部关联信息系统', {
                  num1: `${
                      record?.maturityEvaluation?.systemMaturity
                          ?.businessInformationPart?.processCount || 0
                  }`,
              }),
    },
    {
        key: DetailsType.dataIntegrity,
        disabled: record?.disabled,
        metricsValue:
            record?.maturityEvaluation?.systemMaturity?.dataCompletenessPart
                ?.dataCompleteness,
        desc: record?.disabled
            ? '--'
            : record?.maturityEvaluation?.systemMaturity?.dataCompletenessPart
                  ?.dataCompleteness !== 100
            ? __('共${num1}张业务标准表，其中${num2}张未关联库表', {
                  num1: `${
                      record?.maturityEvaluation?.systemMaturity
                          ?.dataCompletenessPart?.standardFormCount || 0
                  }`,
                  num2: `${
                      record?.maturityEvaluation?.systemMaturity
                          ?.dataCompletenessPart
                          ?.standardFormNoRelateViewCount || 0
                  }`,
              })
            : __('共${num1}张业务标准表，已全部关联库表', {
                  num1: `${
                      record?.maturityEvaluation?.systemMaturity
                          ?.dataCompletenessPart?.standardFormCount || 0
                  }`,
              }),
    },
    {
        key: DetailsType.standardRate,
        disabled: record?.disabled,
        metricsValue:
            record?.maturityEvaluation?.systemMaturity?.dataStandardPart
                ?.dataStandardRate,
        desc: record?.disabled
            ? '--'
            : record?.maturityEvaluation?.systemMaturity?.dataStandardPart
                  ?.dataStandardRate !== 100
            ? record?.maturityEvaluation?.systemMaturity?.dataCompletenessPart
                  ?.standardFormCount !==
              record?.maturityEvaluation?.systemMaturity?.dataCompletenessPart
                  ?.standardFormNoRelateViewCount
                ? __(
                      '业务关联库表中共${num1}个需要标准化的字段，其中${num2}个不符合业务标准表中设定的标准',
                      {
                          num1: `${
                              record?.maturityEvaluation?.systemMaturity
                                  ?.dataStandardPart
                                  ?.relateViewStandardFieldCount || 0
                          }`,
                          num2: `${
                              record?.maturityEvaluation?.systemMaturity
                                  ?.dataStandardPart
                                  ?.relateViewNotMeetStandardFieldCount || 0
                          }`,
                      },
                  )
                : __('未检测到业务关联库表，无法检测数据标准率。')
            : __(
                  '业务关联库表中共${num1}个需要标准化的字段，已全部符合业务标准表中设定的标准',
                  {
                      num1: `${
                          record?.maturityEvaluation?.systemMaturity
                              ?.dataStandardPart
                              ?.relateViewStandardFieldCount || 0
                      }`,
                  },
              ),
    },
    {
        key: DetailsType.formMaturity,
        disabled: record?.disabled,
        typeValue: record?.maturityEvaluation?.dataMaturity?.dataMaturity,
        metricsValue: record?.maturityEvaluation?.dataMaturity?.dataMaturity,
        desc: record?.disabled
            ? '--'
            : record?.maturityEvaluation?.systemMaturity?.dataCompletenessPart
                  ?.standardFormCount !==
              record?.maturityEvaluation?.systemMaturity?.dataCompletenessPart
                  ?.standardFormNoRelateViewCount
            ? __(
                  '唯一性 ${num1}分；完整性 ${num2}分；准确性 ${num3}分；规范性 ${num4}分；及时性 ${num6}分',
                  {
                      num1: `${
                          isNil(
                              record?.maturityEvaluation?.dataMaturity
                                  ?.uniquenessScore,
                          )
                              ? '--'
                              : record?.maturityEvaluation?.dataMaturity
                                    ?.uniquenessScore
                      }`,
                      num2: `${
                          isNil(
                              record?.maturityEvaluation?.dataMaturity
                                  ?.completenessScore,
                          )
                              ? '--'
                              : record?.maturityEvaluation?.dataMaturity
                                    ?.completenessScore
                      }`,
                      num3: `${
                          isNil(
                              record?.maturityEvaluation?.dataMaturity
                                  ?.accuracyScore,
                          )
                              ? '--'
                              : record?.maturityEvaluation?.dataMaturity
                                    ?.accuracyScore
                      }`,
                      num4: `${
                          isNil(
                              record?.maturityEvaluation?.dataMaturity
                                  ?.normativeScore,
                          )
                              ? '--'
                              : record?.maturityEvaluation?.dataMaturity
                                    ?.normativeScore
                      }`,
                      num5: `${
                          isNil(
                              record?.maturityEvaluation?.dataMaturity
                                  ?.consistencyScore,
                          )
                              ? '--'
                              : record?.maturityEvaluation?.dataMaturity
                                    ?.consistencyScore
                      }`,
                      num6: `${
                          isNil(
                              record?.maturityEvaluation?.dataMaturity
                                  ?.timelinessScore,
                          )
                              ? '--'
                              : record?.maturityEvaluation?.dataMaturity
                                    ?.timelinessScore
                      }`,
                  },
              )
            : __('未检测到业务关联库表，无法检测表数据成熟度。'),
    },
]

/**
 * 一致性分析表格数据
 */
export const consistencyTableList = (record?) => [
    {
        key: DetailsType.standardConsistency,
        disabled: record?.disabled,
        typeValue:
            record?.consistencyEvaluation?.standard_consistency
                ?.standardConsistencyRate,
        desc: record?.disabled
            ? '--'
            : __('其中${num1}个标准化字段名称相同，但采用的标准依据分类不同', {
                  num1: `${
                      record?.consistencyEvaluation?.standard_consistency
                          ?.un_consistency_count || 0
                  }`,
              }),
    },
    {
        key: DetailsType.metricConsistency,
        disabled: record?.disabled,
        typeValue:
            record?.consistencyEvaluation?.metric_consistency
                ?.metricConsistencyRate,
        desc: record?.disabled
            ? '--'
            : __(
                  '共有${num1}个指标，其中${num2}个指标相似，${num3}个指标一致',
                  {
                      num1: `${
                          record?.consistencyEvaluation?.metric_consistency
                              ?.total_indicator || 0
                      }`,
                      num2: `${
                          record?.consistencyEvaluation?.metric_consistency
                              ?.similar_indicator_count || 0
                      }`,
                      num3: `${
                          record?.consistencyEvaluation?.metric_consistency
                              ?.consistency_count || 0
                      }`,
                  },
              ),
    },
    {
        key: DetailsType.flowchartConsistency,
        disabled: record?.disabled,
        typeValue:
            record?.consistencyEvaluation?.flowchart_consistency
                ?.flowchartConsistencyRate,
        desc: record?.disabled
            ? '--'
            : __('共${num1}个流程图，其中${num2}个流程存在相似情况', {
                  num1: `${
                      record?.consistencyEvaluation?.flowchart_consistency
                          ?.flowchart_count || 0
                  }`,
                  num2: `${
                      record?.consistencyEvaluation?.flowchart_consistency
                          ?.similarity_flowchart_count || 0
                  }`,
              }),
    },
]

/**
 * 共享率分析表格数据
 */
export const sharingRateTableList = (record?) => [
    {
        key: DetailsType.businessSharingRate,
        disabled: record?.disabled,
        typeValue: record?.sharingRateEvaluation?.comprehensiveSharingRate,
        desc: record?.disabled
            ? '--'
            : record?.sharingRateEvaluation?.comprehensiveSharingRate !== 100
            ? __('共${num1}张业务标准表，其中${num2}张已关联信息资源目录', {
                  num1: `${
                      record?.sharingRateEvaluation?.standardFormCount || 0
                  }`,
                  num2: `${
                      record?.sharingRateEvaluation
                          ?.standardFormRelateInfoResourceCatalogCount || 0
                  }`,
              })
            : __('共${num1}张业务标准表，已全部关联信息资源目录', {
                  num1: `${
                      record?.sharingRateEvaluation?.standardFormCount || 0
                  }`,
              }),
    },
]

/**
 * 业务复杂度分析表格数据
 */
export const businessFormComplexityTableList = (record?) => [
    {
        key: DetailsType.standardizationFieldDistribution,
        disabled: record?.disabled,
        desc: record?.disabled
            ? '--'
            : record?.complexityEvaluation?.needStandardFieldsNumber &&
              record?.complexityEvaluation?.needStandardFieldsNumber ===
                  record?.complexityEvaluation?.standardizedFieldsCount
            ? __(
                  '共${num1}张业务标准表，共${num2}个字段需要标准化，已全部标准化',
                  {
                      num1: `${
                          record?.complexityEvaluation?.standardFormCount || 0
                      }`,
                      num2: `${
                          record?.complexityEvaluation
                              ?.needStandardFieldsNumber || 0
                      }`,
                  },
              )
            : __(
                  '共${num1}张业务标准表，共${num2}个字段需要标准化，已标准化${num3}个字段',
                  {
                      num1: `${
                          record?.complexityEvaluation?.standardFormCount || 0
                      }`,
                      num2: `${
                          record?.complexityEvaluation
                              ?.needStandardFieldsNumber || 0
                      }`,
                      num3: `${
                          record?.complexityEvaluation
                              ?.standardizedFieldsCount || 0
                      }`,
                  },
              ),
    },
]
