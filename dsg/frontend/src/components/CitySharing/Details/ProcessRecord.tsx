import React, { useState } from 'react'
import { Timeline, Tooltip } from 'antd'
import {
    RightOutlined,
    CheckCircleFilled,
    DownOutlined,
    UpOutlined,
    CloseOutlined,
} from '@ant-design/icons'
import moment from 'moment'
import {
    IShareApplyOperateLog,
    ShareApplyActionType,
    IShareApplyLogExtendInfo,
    IResourceProvideConclusion,
    getDocAuditBizDetails,
    getAuditLogs,
} from '@/core'
import __ from '../locale'
import styles from './styles.module.less'

interface IProcessRecord {
    logs?: IShareApplyOperateLog[]
    onClose?: () => void
    userInfoMap?: Record<string, string>
    analItemsMap?: Record<string, any>
}

// 操作类型中文映射
const ActionTypeNameMap: Record<ShareApplyActionType, string> = {
    [ShareApplyActionType.Create]: __('共享申请申报'),
    [ShareApplyActionType.Edit]: __('需求编辑'),
    [ShareApplyActionType.ReportCancel]: __('申报审核撤回'),
    [ShareApplyActionType.ReportAudit]: __('申报审核'),
    [ShareApplyActionType.AnalSignoff]: __('分析签收'),
    [ShareApplyActionType.AnalSignoffCancel]: __('分析签收取消'),
    [ShareApplyActionType.Analysis]: __('分析结论'),
    [ShareApplyActionType.AnalAudit]: __('分析审核'),
    [ShareApplyActionType.AnalConfirm]: __('分析结论确认'),
    [ShareApplyActionType.DsAudit]: __('数据提供方审核'),
    [ShareApplyActionType.ImplSignoff]: __('实施签收'),
    [ShareApplyActionType.ImplSoluCreate]: __('实施方案制定'),
    [ShareApplyActionType.ImplSoluConfirm]: __('实施方案确认'),
    [ShareApplyActionType.Implement]: __('数据资源实施'),
    [ShareApplyActionType.ImplAchvConfirm]: __('实施成果确认'),
    [ShareApplyActionType.Completed]: __('共享申请单完结'),
}

// 获取操作人显示文本
const getOpUserDisplay = (
    actionType: ShareApplyActionType,
    opUid: string,
    userInfoMap?: Record<string, string>,
) => {
    // 根据 op_uid 从 userInfoMap 中获取用户名
    const userName = userInfoMap?.[opUid] || opUid || '--'

    switch (actionType) {
        case ShareApplyActionType.Create:
            return `${__('由')} ${userName} ${__('提交')}`
        case ShareApplyActionType.AnalSignoff:
            return `${__('由')} ${userName} ${__('签收')}`
        case ShareApplyActionType.Analysis:
            return `${__('由')} ${userName} ${__('提交')}`
        case ShareApplyActionType.ImplSignoff:
            return `${__('由')} ${userName} ${__('签收')}`
        case ShareApplyActionType.Implement:
            return `${__('由')} ${userName} ${__('实施')}`
        case ShareApplyActionType.ImplSoluCreate:
            return `${__('由')} ${userName} ${__('制定')}`
        case ShareApplyActionType.ImplSoluConfirm:
            return `${__('由')} ${userName} ${__('确认')}`
        case ShareApplyActionType.ImplAchvConfirm:
            return `${__('由')} ${userName} ${__('提交')}`
        case ShareApplyActionType.Completed:
            return __('共享申请单完结')
        default:
            return userName
    }
}

// 获取审核结果的显示文本和样式
const getAuditResultDisplay = (auditResult?: string) => {
    if (!auditResult) return null
    if (auditResult === 'pass') {
        return {
            text: __('已通过'),
            className: styles.timelineValuePass,
        }
    }
    if (auditResult === 'reject') {
        return {
            text: __('驳回'),
            className: styles.timelineValueReject,
        }
    }
    if (auditResult === 'undone') {
        return {
            text: __('撤销'),
            className: styles.timelineValueUndone,
        }
    }
    return null
}

const ProcessRecord: React.FC<IProcessRecord> = ({
    logs = [],
    onClose,
    userInfoMap = {},
    analItemsMap = {},
}) => {
    // 管理每个审核节点的展开状态，key 为 index，value 为是否展开
    const [expandedAudits, setExpandedAudits] = useState<
        Record<number, boolean>
    >({})
    // 审核记录信息
    interface IAuditRecord {
        auditor_name: string
        audit_status: string // pass 或 reject
        audit_idea: string
        audit_time?: string
    }

    // 管理每个审核节点的审核记录列表，key 为 index
    const [auditRecordsMap, setAuditRecordsMap] = useState<
        Record<number, IAuditRecord[]>
    >({})
    // 管理正在加载审核人信息的节点
    const [loadingAuditors, setLoadingAuditors] = useState<
        Record<number, boolean>
    >({})

    // 获取审核记录
    const getAuditors = async (auditId: string, index: number) => {
        if (!auditId || auditRecordsMap[index]) {
            // 如果已经获取过，直接返回
            return
        }

        try {
            setLoadingAuditors((prev) => ({ ...prev, [index]: true }))
            const res = await getDocAuditBizDetails(auditId)
            const auditLogs = await getAuditLogs(res.proc_inst_id)
            const lastAuditorLogs =
                auditLogs[auditLogs.length - 1].auditor_logs?.flat() || []

            // 获取所有审核记录
            const auditRecords: IAuditRecord[] = lastAuditorLogs
                .map((item) => ({
                    auditor_name: item.auditor_name || '--',
                    audit_status: item.audit_status || '',
                    audit_idea: item.audit_idea || '--',
                    audit_time: item.end_time,
                }))
                .filter((item) => item.audit_status)

            setAuditRecordsMap((prev) => ({
                ...prev,
                [index]: auditRecords,
            }))
        } catch (error) {
            // 获取审核记录失败，静默处理
        } finally {
            setLoadingAuditors((prev) => ({ ...prev, [index]: false }))
        }
    }

    // 切换审核节点展开状态
    const toggleAuditExpand = (index: number, auditId?: string) => {
        const isExpanding = !expandedAudits[index]
        setExpandedAudits((prev) => ({
            ...prev,
            [index]: isExpanding,
        }))

        // 如果是展开操作且有 auditId，则获取审核人信息
        if (isExpanding && auditId) {
            getAuditors(auditId, index)
        }
    }

    // 判断是否是需要展开/收起控制的审核节点
    const isAuditNode = (actionType: ShareApplyActionType) => {
        return (
            actionType === ShareApplyActionType.ReportAudit ||
            actionType === ShareApplyActionType.AnalAudit ||
            actionType === ShareApplyActionType.DsAudit
        )
    }

    // 判断是否是需要展示数据资源的实施节点
    const isImplResourceNode = (actionType: ShareApplyActionType) => {
        return (
            actionType === ShareApplyActionType.ImplSignoff ||
            actionType === ShareApplyActionType.Implement ||
            actionType === ShareApplyActionType.ImplSoluCreate ||
            actionType === ShareApplyActionType.ImplSoluConfirm
        )
    }

    return (
        <div className={styles.processRecordWrapper}>
            <div className={styles.processRecordHeader}>
                <Tooltip title={__('收起操作记录')} placement="bottom">
                    <RightOutlined
                        className={styles.processRecordCollapseIcon}
                        onClick={onClose}
                    />
                </Tooltip>
                {__('操作记录')}
            </div>
            <div className={styles.processRecordContent}>
                <Timeline>
                    {logs.map((item, index) => {
                        const actionName =
                            ActionTypeNameMap[item.action_type] || '--'
                        const auditResult = getAuditResultDisplay(
                            item.extend_info?.audit_result,
                        )
                        const isAudit = isAuditNode(item.action_type)
                        const isExpanded = expandedAudits[index] || false

                        return (
                            <Timeline.Item key={`${item.op_uid}-${index}`}>
                                <div className={styles.timelineItemWrapper}>
                                    <div className={styles.timelineTitleRow}>
                                        <div
                                            className={styles.timelineItemTitle}
                                        >
                                            {actionName}
                                        </div>
                                        {isAudit &&
                                        (item.extend_info?.audit_result ===
                                            'pass' ||
                                            item.extend_info?.audit_result ===
                                                'reject') ? (
                                            <>
                                                <span
                                                    className={
                                                        item.extend_info
                                                            ?.audit_result ===
                                                        'pass'
                                                            ? styles.auditPassLabel
                                                            : styles.timelineValueReject
                                                    }
                                                >
                                                    {item.extend_info
                                                        ?.audit_result ===
                                                    'pass'
                                                        ? __('已通过')
                                                        : __('已拒绝')}
                                                </span>
                                                {isExpanded ? (
                                                    <UpOutlined
                                                        className={
                                                            styles.expandIcon
                                                        }
                                                        onClick={() =>
                                                            toggleAuditExpand(
                                                                index,
                                                                item.extend_info
                                                                    ?.audit_apply_id,
                                                            )
                                                        }
                                                    />
                                                ) : (
                                                    <DownOutlined
                                                        className={
                                                            styles.expandIcon
                                                        }
                                                        onClick={() =>
                                                            toggleAuditExpand(
                                                                index,
                                                                item.extend_info
                                                                    ?.audit_apply_id,
                                                            )
                                                        }
                                                    />
                                                )}
                                            </>
                                        ) : (
                                            auditResult &&
                                            item.action_type !==
                                                ShareApplyActionType.ImplAchvConfirm && (
                                                <span
                                                    className={
                                                        auditResult.className
                                                    }
                                                >
                                                    {auditResult.text}
                                                </span>
                                            )
                                        )}
                                    </div>
                                    {(!isAudit || isExpanded) && (
                                        <div
                                            className={
                                                styles.timelineItemContent
                                            }
                                        >
                                            {!isAudit && (
                                                <div
                                                    className={
                                                        styles.timelineItemHeader
                                                    }
                                                >
                                                    <span
                                                        className={
                                                            styles.timelineOpUser
                                                        }
                                                    >
                                                        {((item.extend_info
                                                            ?.audit_result ===
                                                            'pass' &&
                                                            item.action_type !==
                                                                ShareApplyActionType.ImplAchvConfirm) ||
                                                            item.action_type ===
                                                                ShareApplyActionType.Completed) && (
                                                            <CheckCircleFilled
                                                                className={
                                                                    styles.auditPassIcon
                                                                }
                                                            />
                                                        )}
                                                        {getOpUserDisplay(
                                                            item.action_type,
                                                            item.op_uid,
                                                            userInfoMap,
                                                        )}
                                                    </span>
                                                    <div
                                                        className={
                                                            styles.timelineTimeWrapper
                                                        }
                                                    >
                                                        {item.extend_info
                                                            ?.audit_result ===
                                                            'pass' && (
                                                            <span
                                                                className={
                                                                    styles.timelinePassText
                                                                }
                                                            >
                                                                {__('通过')}
                                                            </span>
                                                        )}
                                                        {item.op_time && (
                                                            <span
                                                                className={
                                                                    styles.timelineOpTime
                                                                }
                                                            >
                                                                {moment(
                                                                    item.op_time,
                                                                ).format(
                                                                    'YYYY-MM-DD HH:mm:ss',
                                                                )}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            {isAudit &&
                                                (loadingAuditors[index] ? (
                                                    <div
                                                        className={
                                                            styles.timelineAuditOpinion
                                                        }
                                                    >
                                                        <span
                                                            className={
                                                                styles.timelineValue
                                                            }
                                                        >
                                                            {__('加载中...')}
                                                        </span>
                                                    </div>
                                                ) : auditRecordsMap[index] &&
                                                  auditRecordsMap[index]
                                                      .length > 0 ? (
                                                    <>
                                                        {auditRecordsMap[
                                                            index
                                                        ].map((record, idx) => (
                                                            <div
                                                                key={idx}
                                                                className={
                                                                    styles.auditRecordItem
                                                                }
                                                            >
                                                                <div
                                                                    className={
                                                                        styles.timelineItemHeader
                                                                    }
                                                                >
                                                                    <span
                                                                        className={
                                                                            styles.timelineOpUser
                                                                        }
                                                                    >
                                                                        {record.audit_status ===
                                                                        'pass' ? (
                                                                            <CheckCircleFilled
                                                                                className={
                                                                                    styles.auditPassIcon
                                                                                }
                                                                            />
                                                                        ) : (
                                                                            <CloseOutlined
                                                                                className={
                                                                                    styles.auditRejectIcon
                                                                                }
                                                                            />
                                                                        )}
                                                                        {
                                                                            record.auditor_name
                                                                        }
                                                                    </span>
                                                                    <div
                                                                        className={
                                                                            styles.timelineTimeWrapper
                                                                        }
                                                                    >
                                                                        <span
                                                                            className={
                                                                                styles.timelinePassText
                                                                            }
                                                                        >
                                                                            {record.audit_status ===
                                                                            'pass'
                                                                                ? __(
                                                                                      '已同意',
                                                                                  )
                                                                                : __(
                                                                                      '已拒绝',
                                                                                  )}
                                                                        </span>
                                                                        {record.audit_time && (
                                                                            <span
                                                                                className={
                                                                                    styles.timelineOpTime
                                                                                }
                                                                            >
                                                                                {moment(
                                                                                    record.audit_time,
                                                                                ).format(
                                                                                    'YYYY-MM-DD HH:mm:ss',
                                                                                )}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div
                                                                    className={
                                                                        styles.timelineAuditOpinion
                                                                    }
                                                                >
                                                                    <span
                                                                        className={
                                                                            styles.timelineLabel
                                                                        }
                                                                    >
                                                                        {__(
                                                                            '审核意见：',
                                                                        )}
                                                                    </span>
                                                                    <span
                                                                        className={
                                                                            styles.timelineValue
                                                                        }
                                                                    >
                                                                        {
                                                                            record.audit_idea
                                                                        }
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </>
                                                ) : (
                                                    <>
                                                        {/* 数据提供方审核节点，审核通过或拒绝时，在审核意见上方展示审核人信息 */}
                                                        {item.action_type ===
                                                            ShareApplyActionType.DsAudit &&
                                                            (item.extend_info
                                                                ?.audit_result ===
                                                                'pass' ||
                                                                item.extend_info
                                                                    ?.audit_result ===
                                                                    'reject') && (
                                                                <div
                                                                    className={
                                                                        styles.timelineItemHeader
                                                                    }
                                                                >
                                                                    <span
                                                                        className={
                                                                            styles.timelineOpUser
                                                                        }
                                                                    >
                                                                        {item
                                                                            .extend_info
                                                                            ?.audit_result ===
                                                                        'pass' ? (
                                                                            <CheckCircleFilled
                                                                                className={
                                                                                    styles.auditPassIcon
                                                                                }
                                                                            />
                                                                        ) : (
                                                                            <CloseOutlined
                                                                                className={
                                                                                    styles.auditRejectIcon
                                                                                }
                                                                            />
                                                                        )}
                                                                        {userInfoMap[
                                                                            item
                                                                                .op_uid
                                                                        ] ||
                                                                            item.op_uid ||
                                                                            '--'}
                                                                    </span>
                                                                    <div
                                                                        className={
                                                                            styles.timelineTimeWrapper
                                                                        }
                                                                    >
                                                                        {item
                                                                            .extend_info
                                                                            ?.org_name && (
                                                                            <span
                                                                                className={
                                                                                    styles.timelineOrgName
                                                                                }
                                                                                title={
                                                                                    item
                                                                                        .extend_info
                                                                                        ?.org_path ||
                                                                                    ''
                                                                                }
                                                                            >
                                                                                {
                                                                                    item
                                                                                        .extend_info
                                                                                        .org_name
                                                                                }
                                                                            </span>
                                                                        )}
                                                                        <span
                                                                            className={
                                                                                styles.timelinePassText
                                                                            }
                                                                        >
                                                                            {item
                                                                                .extend_info
                                                                                ?.audit_result ===
                                                                            'pass'
                                                                                ? __(
                                                                                      '通过',
                                                                                  )
                                                                                : __(
                                                                                      '已拒绝',
                                                                                  )}
                                                                        </span>
                                                                        {item.op_time && (
                                                                            <span
                                                                                className={
                                                                                    styles.timelineOpTime
                                                                                }
                                                                            >
                                                                                {moment(
                                                                                    item.op_time,
                                                                                ).format(
                                                                                    'YYYY-MM-DD HH:mm:ss',
                                                                                )}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        <div
                                                            className={
                                                                styles.timelineAuditOpinion
                                                            }
                                                        >
                                                            <span
                                                                className={
                                                                    styles.timelineLabel
                                                                }
                                                            >
                                                                {__(
                                                                    '审核意见：',
                                                                )}
                                                            </span>
                                                            <span
                                                                className={
                                                                    styles.timelineValue
                                                                }
                                                            >
                                                                {item
                                                                    .extend_info
                                                                    ?.audit_remark ||
                                                                    '--'}
                                                            </span>
                                                        </div>
                                                    </>
                                                ))}
                                            {item.action_type ===
                                                ShareApplyActionType.AnalConfirm &&
                                                item.extend_info
                                                    ?.audit_remark && (
                                                    <div
                                                        className={
                                                            styles.timelineAuditOpinion
                                                        }
                                                    >
                                                        <span
                                                            className={
                                                                styles.timelineLabel
                                                            }
                                                        >
                                                            {__('备注：')}
                                                        </span>
                                                        <span
                                                            className={
                                                                styles.timelineValue
                                                            }
                                                        >
                                                            {
                                                                item.extend_info
                                                                    .audit_remark
                                                            }
                                                        </span>
                                                    </div>
                                                )}
                                            {item.action_type ===
                                                ShareApplyActionType.DsAudit &&
                                                item.extend_info
                                                    ?.anal_item_ids &&
                                                item.extend_info.anal_item_ids
                                                    .length > 0 && (
                                                    <div
                                                        className={
                                                            styles.resourceConclusionWrapper
                                                        }
                                                    >
                                                        <div
                                                            className={
                                                                styles.resourceConclusionTitle
                                                            }
                                                        >
                                                            {__(
                                                                '数据资源是否提供结论：',
                                                            )}
                                                        </div>
                                                        {item.extend_info.anal_item_ids
                                                            .map(
                                                                (itemId) =>
                                                                    analItemsMap[
                                                                        itemId
                                                                    ],
                                                            )
                                                            .filter(
                                                                (analItem) =>
                                                                    analItem,
                                                            )
                                                            .map(
                                                                (
                                                                    analItem,
                                                                    idx,
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            idx
                                                                        }
                                                                        className={
                                                                            styles.resourceConclusionItem
                                                                        }
                                                                    >
                                                                        <span
                                                                            className={
                                                                                styles.resourceName
                                                                            }
                                                                            title={
                                                                                analItem.name
                                                                            }
                                                                        >
                                                                            {
                                                                                analItem.name
                                                                            }
                                                                        </span>
                                                                        <span
                                                                            className={
                                                                                analItem.is_supply
                                                                                    ? styles.resourceProvideYes
                                                                                    : styles.resourceProvideNo
                                                                            }
                                                                        >
                                                                            {analItem.is_supply
                                                                                ? __(
                                                                                      '提供',
                                                                                  )
                                                                                : __(
                                                                                      '不提供',
                                                                                  )}
                                                                        </span>
                                                                    </div>
                                                                ),
                                                            )}
                                                    </div>
                                                )}
                                            {isImplResourceNode(
                                                item.action_type,
                                            ) &&
                                                item.extend_info
                                                    ?.anal_item_ids &&
                                                item.extend_info.anal_item_ids
                                                    .length > 0 && (
                                                    <div
                                                        className={
                                                            styles.implResourceWrapper
                                                        }
                                                    >
                                                        <span
                                                            className={
                                                                styles.implResourceLabel
                                                            }
                                                        >
                                                            {__('数据资源：')}
                                                        </span>
                                                        <div
                                                            className={
                                                                styles.implResourceList
                                                            }
                                                        >
                                                            {item.extend_info.anal_item_ids
                                                                .map(
                                                                    (itemId) =>
                                                                        analItemsMap[
                                                                            itemId
                                                                        ],
                                                                )
                                                                .filter(
                                                                    (
                                                                        analItem,
                                                                    ) =>
                                                                        analItem,
                                                                )
                                                                .map(
                                                                    (
                                                                        analItem,
                                                                        idx,
                                                                    ) => (
                                                                        <span
                                                                            key={
                                                                                idx
                                                                            }
                                                                            className={
                                                                                styles.implResourceName
                                                                            }
                                                                            title={
                                                                                analItem.name
                                                                            }
                                                                        >
                                                                            {
                                                                                analItem.name
                                                                            }
                                                                        </span>
                                                                    ),
                                                                )}
                                                        </div>
                                                    </div>
                                                )}
                                        </div>
                                    )}
                                </div>
                            </Timeline.Item>
                        )
                    })}
                </Timeline>
            </div>
        </div>
    )
}

export default ProcessRecord
