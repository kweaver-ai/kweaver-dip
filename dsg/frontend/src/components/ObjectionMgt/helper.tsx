import { Button, Space, Tooltip } from 'antd'

import {
    ExclamationCircleFilled,
    FrownOutlined,
    LeftOutlined,
    MehOutlined,
    SmileOutlined,
} from '@ant-design/icons'
import moment from 'moment'
import React from 'react'
import dataEmpty from '@/assets/dataEmpty.svg'
import FileIcon from '@/components/FileIcon'
import {
    EvaluationScoreEnum,
    EvaluationSolvedEnum,
    HandleObjectionOperateEnum,
    HandleObjectionStatusEnum,
    ISSZDAuditStatus,
    ObjectionTargetEnum,
    ObjectionTypeEnum,
    RaiseObjectionStatusEnum,
    SortDirection,
    SortType,
    allRoleList,
} from '@/core'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import { Empty, Loader } from '@/ui'
import { SearchType } from '@/ui/LightweightSearch/const'
import { confirm } from '@/utils/modalHelper'
import __ from './locale'
import styles from './styles.module.less'

/**
 * 异议管理 菜单
 */
export enum ObjectionMenuEnum {
    // 数据异议提出
    Raise = 'raise',
    // 数据异议处理
    Handle = 'handle',
    // 数据异议审核 - 已审核
    Reviewed = 'reviewed',
    // 数据异议审核 - 待审核
    PendingReview = 'pending_review',
}

/**
 * 详情类型
 */
export enum DetailType {
    // 基础信息
    Basic = 'basic',
    // 基础信息（简单）
    BasicSimple = 'basic_simple',
    // 提出人信息
    Personnel = 'personnel',
    // 处理结果
    Result = 'result',
    // 评价信息
    Evaluate = 'evaluate',
    // 审核信息
    Audit = 'audit',
}

export const detailsDefault = [
    {
        key: 'title',
        label: __('异议标题'),
        span: 24,
        value: '',
        type: [DetailType.Basic, DetailType.BasicSimple, DetailType.Audit],
    },
    {
        key: 'data_name',
        label: __('数据目录/资源名称'),
        span: 24,
        value: '',
        type: [DetailType.Basic, DetailType.BasicSimple, DetailType.Audit],
    },
    {
        key: 'objection_org_name',
        label: __('提供部门'),
        span: 24,
        value: '',
        type: [DetailType.Basic],
    },
    {
        key: 'objection_type',
        label: __('异议类型'),
        span: 24,
        value: '',
        type: [DetailType.Basic, DetailType.BasicSimple, DetailType.Audit],
    },
    {
        key: 'apply_problem',
        label: __('异议分类'),
        span: 24,
        value: '',
        type: [DetailType.Basic],
    },
    {
        key: 'description',
        label: __('纠错/异议描述'),
        span: 24,
        value: '',
        type: [DetailType.Basic, DetailType.BasicSimple],
    },
    {
        key: 'basic',
        label: __('异议依据'),
        span: 24,
        value: '',
        type: [DetailType.Basic],
    },
    {
        key: 'attachment_name',
        label: __('附件'),
        span: 24,
        value: '',
        type: [DetailType.Basic],
    },
    {
        key: 'objection_org_name',
        label: __('提出部门'),
        span: 24,
        value: '',
        type: [DetailType.Personnel],
    },
    {
        key: 'contact',
        label: __('提出人'),
        span: 24,
        value: '',
        type: [DetailType.Personnel],
    },

    {
        key: 'phone',
        label: __('提出人电话'),
        span: 24,
        value: '',
        type: [DetailType.Personnel],
    },
    {
        key: 'creator_phone',
        label: __('创建人电话'),
        span: 24,
        value: '',
        type: [DetailType.Personnel],
    },
    {
        key: 'operate',
        label: __('处理结果'),
        span: 24,
        value: '',
        type: [DetailType.Result],
    },
    {
        key: 'comment',
        label: __('处理意见'),
        span: 24,
        value: '',
        type: [DetailType.Result],
    },
    {
        key: 'score',
        label: __('评分'),
        span: 24,
        value: '',
        type: [DetailType.Evaluate],
    },
    {
        key: 'solved',
        label: __('问题是否已解决'),
        span: 24,
        value: '',
        type: [DetailType.Evaluate],
    },
    {
        key: 'content',
        label: __('评价内容'),
        span: 24,
        value: '',
        type: [DetailType.Evaluate],
    },
    {
        key: 'created_at',
        label: __('提出异议时间'),
        span: 24,
        value: '',
        type: [DetailType.Audit],
    },
    {
        key: 'details_button',
        label: __('详情'),
        span: 24,
        value: '',
        type: [DetailType.Audit],
    },
]

// 数据目录纠错详情
export const directoryCorrectionInfo = [
    {
        key: 'data_name',
        label: __('数据目录名称'),
        span: 12,
        value: '',
    },
    {
        key: 'data_org_name',
        label: __('数据目录提供部门'),
        span: 12,
        value: '',
    },
]

// 资源申请异议详情
export const applyObjectionInfo = [
    {
        key: 'data_name',
        label: __('数据资源名称'),
        span: 12,
        value: '',
    },
    {
        key: 'resource_type',
        label: __('资源类型'),
        span: 12,
        value: '',
    },
    {
        key: 'data_org_name',
        label: __('数据资源提供部门'),
        span: 12,
        value: '',
    },
    {
        key: 'apply_org_name',
        label: __('数据资源使用部门'),
        span: 12,
        value: '',
    },
]

/**
 * 处理进度相关信息
 * @color 颜色
 * @text 文案
 */
export const operateTypeInfo = {
    [HandleObjectionOperateEnum.Reject]: {
        color: 'rgba(230, 0, 18, 1)',
        text: __('驳回'),
    },
    [HandleObjectionOperateEnum.Pass]: {
        color: 'rgba(82, 196, 27, 1)',
        text: __('通过'),
    },
}

// 异议评价 - 评分
export const evaluationScoreTypeMap = {
    [EvaluationScoreEnum.One]: {
        text: __('非常不满意'),
    },
    [EvaluationScoreEnum.Two]: {
        text: __('不满意'),
    },
    [EvaluationScoreEnum.Three]: {
        text: __('一般'),
    },
    [EvaluationScoreEnum.Four]: {
        text: __('满意'),
    },
    [EvaluationScoreEnum.Five]: {
        text: __('非常满意'),
    },
}

// 异议评价 - 问题是否已解决
export const evaluationSolvedTypeMap = {
    [EvaluationSolvedEnum.Solved]: {
        text: __('是'),
    },
    [EvaluationSolvedEnum.Unsolved]: {
        text: __('否'),
    },
}

export const objectionTypeMap = {
    [ObjectionTypeEnum.DirectoryCorrection]: {
        text: __('数据目录纠错'),
    },
    [ObjectionTypeEnum.ApplyObjection]: {
        text: __('资源申请异议'),
    },
    [ObjectionTypeEnum.UseObjection]: {
        text: __('数据使用异议'),
    },
    [ObjectionTypeEnum.Other]: {
        text: __('其他'),
    },
}

export const objectionInfo = {
    [ObjectionTypeEnum.DirectoryCorrection]: {
        objectTypeText: __('数据目录纠错'),
        drawTitle: (item) => __('我要纠错'),
        groupNameOne: __('纠错信息'),
        groupNameTwo: __('提出人信息'),
        titleLabel: __('纠错标题'),
        descriptionLabel: __('纠错描述'),
        basisLabel: __('纠错依据'),
        initTitleValue: (item) =>
            __('【${name}】纠错', { name: item?.data_name }),
    },
    [ObjectionTypeEnum.ApplyObjection]: {
        objectTypeText: __('资源申请异议'),
        drawTitle: (item) =>
            __('【${name}】申请异议', { name: item?.data_name }),
        groupNameOne: __('异议内容'),
        groupNameTwo: __('提出人信息'),
        titleLabel: __('异议标题'),
        descriptionLabel: __('异议描述'),
        basisLabel: __('异议依据'),
        initTitleValue: (item) =>
            __('【${name}】申请异议', { name: item?.data_name }),
    },
    [ObjectionTypeEnum.UseObjection]: {
        objectTypeText: __('数据使用异议'),
        drawTitle: (item) =>
            __('【${name}】使用异议', { name: item?.data_name }),
        groupNameOne: __('异议内容'),
        groupNameTwo: __('异议提出人信息'),
        titleLabel: __('异议标题'),
        descriptionLabel: __('异议描述'),
        basisLabel: __('异议依据'),
        initTitleValue: (item) =>
            __('【${name}】使用异议', { name: item?.data_name }),
    },
}

// 评分icon
export const customIcons = {
    [EvaluationScoreEnum.One]: (
        <div className={styles.customIcons}>
            <FrownOutlined />
            <div className={styles.tips}> {__('非常不满意')}</div>
        </div>
    ),
    [EvaluationScoreEnum.Two]: (
        <div className={styles.customIcons}>
            <FrownOutlined />
            <div className={styles.tips}>{__('不满意')}</div>
        </div>
    ),
    [EvaluationScoreEnum.Three]: (
        <div className={styles.customIcons}>
            <MehOutlined />
            <div className={styles.tips}>{__('一般')}</div>
        </div>
    ),
    [EvaluationScoreEnum.Four]: (
        <div className={styles.customIcons}>
            <SmileOutlined />
            <div className={styles.tips}> {__('满意')}</div>
        </div>
    ),
    [EvaluationScoreEnum.Five]: (
        <div className={styles.customIcons}>
            <SmileOutlined />
            <div className={styles.tips}> {__('非常满意')}</div>
        </div>
    ),
}

// 统一的弹窗样式
export const getConfirmModal = ({ title, content, onOk }) => {
    return confirm({
        title,
        icon: <ExclamationCircleFilled style={{ color: '#FAAD14' }} />,
        content,
        onOk,
    })
}

// 抽屉标题
export const DrawerTitle = ({
    name,
    onClose,
}: {
    name: string
    onClose: () => void
}) => {
    return (
        <div className={styles.drawerTitle}>
            <div onClick={onClose} className={styles.return}>
                <LeftOutlined />
                <span className={styles.returnText}>{__('返回')}</span>
            </div>
            <div className={styles.objectionName}>{name || '--'}</div>
        </div>
    )
}

// 抽屉footer
export const DrawerFooter = ({
    onSubmit,
    onClose,
}: {
    onSubmit: () => void
    onClose: () => void
}) => {
    return (
        <Space
            style={{ justifyContent: 'flex-end', display: 'flex' }}
            size={12}
        >
            <Button onClick={onClose}>{__('取消')}</Button>
            <Button onClick={onSubmit} type="primary">
                {__('提交')}
            </Button>
        </Space>
    )
}

// 详情展示中的分组样式
export const DetailGroupTitle = ({ title }: { title: string }) => {
    return <div className={styles.detailGroupTitle}>{title}</div>
}

// 编辑页面的分组样式
export const EditGroupTitle = ({ title }: { title: string }) => {
    return <div className={styles.editGroupTitle}>{title}</div>
}

/**
 * 空数据
 */
export const renderEmpty = (marginTop: number = 36) => (
    <Empty
        iconSrc={dataEmpty}
        desc={__('暂无数据')}
        style={{ marginTop, width: '100%' }}
    />
)

/**
 * 加载中
 */
export const renderLoader = (marginTop: number = 104) => (
    <div style={{ marginTop, width: '100%' }}>
        <Loader />
    </div>
)

/**
 * 列表状态 view
 */
export const StatusView: React.FC<{
    data?: { text: string; color: string }
    tip?: string
}> = ({ data, tip }) => {
    return (
        <div className={styles.statusView}>
            <div
                className={styles.dot}
                style={{ background: data?.color || 'transparent' }}
            />
            <span className={styles.text}>{data?.text || '--'}</span>
            {tip && (
                <Tooltip title={tip} getPopupContainer={() => document.body}>
                    <FontIcon
                        name="icon-shenheyijian"
                        type={IconType.COLOREDICON}
                        style={{ fontSize: 16 }}
                    />
                </Tooltip>
            )}
        </div>
    )
}

/**
 * 异议操作
 */
export enum ObjectionOperate {
    // 详情
    Details = 'Details',
    // 评价
    Evaluation = 'Evaluation',
    // 转办
    Transfer = 'Transfer',
    // 处理
    Deal = 'Deal',
    // 撤销
    Revoke = 'Revoke',
    // 重新上报
    ReReport = 'ReReport',
    // 审核
    Audit = 'Audit',
}

export const objectionProgressMap = {
    [RaiseObjectionStatusEnum.ReportAuditing]: {
        text: __('异议上报审核中'),
        color: 'rgba(250, 173, 20, 1)',
        operation: [ObjectionOperate.Details, ObjectionOperate.Revoke],
    },
    [RaiseObjectionStatusEnum.ReportAuditRejected]: {
        text: __('异议上报已驳回'),
        color: 'rgba(230, 0, 18, 1)',
        operation: [ObjectionOperate.Details],
        errorKey: 'reason',
        errorTitle: __('驳回原因：'),
    },
    [RaiseObjectionStatusEnum.ReportAuditCanceled]: {
        text: __('异议上报已撤销'),
        color: 'rgba(250, 172, 20, 1)',
        operation: [ObjectionOperate.Details, ObjectionOperate.ReReport],
    },
    [RaiseObjectionStatusEnum.Handling]: {
        text: __('异议上报处理中'),
        color: 'rgba(250, 172, 20, 1)',
        operation: [ObjectionOperate.Details],
    },
    [RaiseObjectionStatusEnum.Handled]: {
        text: __('异议上报已处理'),
        color: 'rgba(82, 196, 27, 1)',
        operation: [ObjectionOperate.Details, ObjectionOperate.Evaluation],
    },
    [RaiseObjectionStatusEnum.Evaluated]: {
        text: __('异议已评价'),
        color: 'rgba(82, 196, 27, 1)',
        operation: [ObjectionOperate.Details],
    },
    [RaiseObjectionStatusEnum.ReportFailed]: {
        text: __('异议上报失败'),
        color: 'rgba(230, 0, 18, 1)',
        operation: [ObjectionOperate.Details, ObjectionOperate.ReReport],
        errorKey: 'reason',
        errorTitle: __('失败原因：'),
    },
}

export const objectionProcessOptions = [
    {
        value: '',
        label: __('不限'),
    },
    {
        value: RaiseObjectionStatusEnum.ReportAuditing,
        label: objectionProgressMap[RaiseObjectionStatusEnum.ReportAuditing]
            .text,
    },
    {
        value: RaiseObjectionStatusEnum.ReportAuditRejected,
        label: objectionProgressMap[
            RaiseObjectionStatusEnum.ReportAuditRejected
        ].text,
    },
    {
        value: RaiseObjectionStatusEnum.ReportAuditCanceled,
        label: objectionProgressMap[
            RaiseObjectionStatusEnum.ReportAuditCanceled
        ].text,
    },
    {
        value: RaiseObjectionStatusEnum.Handling,
        label: objectionProgressMap[RaiseObjectionStatusEnum.Handling].text,
    },
    {
        value: RaiseObjectionStatusEnum.Handled,
        label: objectionProgressMap[RaiseObjectionStatusEnum.Handled].text,
    },
    {
        value: RaiseObjectionStatusEnum.Evaluated,
        label: objectionProgressMap[RaiseObjectionStatusEnum.Evaluated].text,
    },
    {
        value: RaiseObjectionStatusEnum.ReportFailed,
        label: objectionProgressMap[RaiseObjectionStatusEnum.ReportFailed].text,
    },
]

/**
 * 处理的异议 处理进度相关信息
 * @color 颜色
 * @text 文案
 */
export const todoProgressMap = {
    [HandleObjectionStatusEnum.ToAudit]: {
        color: 'rgba(18, 110, 227, 1)',
        text: __('待处理'),
        operation: [
            ObjectionOperate.Details,
            ObjectionOperate.Transfer,
            ObjectionOperate.Deal,
        ],
    },
    [HandleObjectionStatusEnum.Audited]: {
        color: 'rgba(82, 196, 27, 1)',
        text: __('已处理'),
        operation: [ObjectionOperate.Details],
    },
    [HandleObjectionStatusEnum.Evaluated]: {
        color: 'rgba(82, 196, 27, 1)',
        text: __('已收到评价'),
        operation: [ObjectionOperate.Details],
    },
}

/**
 *  处理的异议 处理进度下拉选项集
 */
export const todoProgressList = [
    { value: 0, label: __('全部') },
    {
        value: HandleObjectionStatusEnum.ToAudit,
        label: todoProgressMap[HandleObjectionStatusEnum.ToAudit].text,
    },
    {
        value: HandleObjectionStatusEnum.Audited,
        label: todoProgressMap[HandleObjectionStatusEnum.Audited].text,
    },
    {
        value: HandleObjectionStatusEnum.Evaluated,
        label: todoProgressMap[HandleObjectionStatusEnum.Evaluated].text,
    },
]

export const reviewedStatusMap = {
    [ISSZDAuditStatus.Auditing]: {
        text: __('审核中'),
        color: 'rgba(18, 110, 227, 1)',
        operation: [ObjectionOperate.Details],
    },
    [ISSZDAuditStatus.AuditAgreed]: {
        text: __('已通过'),
        color: 'rgba(82, 196, 27, 1)',
        operation: [ObjectionOperate.Details],
    },
    [ISSZDAuditStatus.AuditRejected]: {
        text: __('已拒绝'),
        color: 'rgba(230, 0, 18, 1)',
        operation: [ObjectionOperate.Details],
    },
}

export const pendingReviewStatusMap = {
    [ISSZDAuditStatus.Auditing]: {
        text: __('审核中'),
        color: 'rgba(18, 110, 227, 1)',
        operation: [ObjectionOperate.Audit],
    },
}

export const ObjectionTabMap = {
    [ObjectionMenuEnum.Raise]: {
        title: __('数据异议提出'),

        // 表格列名
        columnKeys: [
            'title',
            'objection_type',
            'data_name',
            'description',
            'status',
            'contact',
            'phone',
            'created_at',
            'action',
        ],
        // 操作项映射
        actionMap: objectionProgressMap,
        // 操作栏宽度
        actionWidth: 138,
        // 排序菜单
        sortMenus: [{ key: SortType.UPDATED, label: __('按更新时间排序') }],
        // 默认菜单排序
        defaultMenu: {
            key: SortType.UPDATED,
            sort: SortDirection.DESC,
        },
        // 默认表头排序
        defaultTableSort: { created_at: SortDirection.DESC },
        // 筛选菜单
        searchFormData: [
            {
                label: __('处理进度'),
                key: 'status',
                options: objectionProcessOptions,
                type: SearchType.Radio,
            },
        ],
        defaultSearch: { status: '' },
        initSearch: {
            limit: 10,
            offset: 1,
            sort: SortType.UPDATED,
            direction: SortDirection.DESC,
        },
    },
    [ObjectionMenuEnum.Handle]: {
        title: __('数据异议处理'),
        columnKeys: [
            'title',
            'objection_type',
            'data_name',
            'description',
            'status',
            'transactor',
            'objection_org_name',
            'contact',
            'phone',
            'updated_at',
            'action',
        ],
        actionMap: todoProgressMap,
        actionWidth: 166,
        sortMenus: [{ key: SortType.UPDATED, label: __('按更新时间排序') }],
        defaultMenu: {
            key: SortType.UPDATED,
            sort: SortDirection.DESC,
        },
        defaultTableSort: { updated_at: SortDirection.DESC },
        // 筛选菜单
        searchFormData: [
            {
                label: __('处理进度'),
                key: 'status',
                options: todoProgressList,
                type: SearchType.Radio,
            },
        ],
        defaultSearch: { status: '' },
        initSearch: {
            limit: 10,
            offset: 1,
            sort: SortType.UPDATED,
            direction: SortDirection.DESC,
        },
    },
    [ObjectionMenuEnum.Reviewed]: {
        title: __('已审核'),
        columnKeys: [
            'title',
            'objection_type',
            'data_name',
            'description',
            'audit_status',
            'contact',
            'phone',
            'apply_time',
            'action',
        ],
        actionMap: reviewedStatusMap,
        actionWidth: 80,
        defaultTableSort: { created_at: SortDirection.DESC },
        initSearch: {
            limit: 10,
            offset: 1,
            target: ObjectionTargetEnum.Historys,
        },
    },
    [ObjectionMenuEnum.PendingReview]: {
        title: __('待审核'),
        columnKeys: [
            'title',
            'objection_type',
            'data_name',
            'description',
            'contact',
            'phone',
            'apply_time',
            'action',
        ],
        actionMap: pendingReviewStatusMap,
        actionWidth: 80,
        defaultTableSort: { created_at: SortDirection.DESC },
        initSearch: {
            limit: 10,
            offset: 1,
            target: ObjectionTargetEnum.Tasks,
        },
    },
}

// 下载元素
const DownloadElement = ({
    attachmentName,
    onClickDownload,
}: {
    attachmentName: string
    onClickDownload?: () => void
}) => {
    if (!attachmentName) return '--'
    const fileSuffix = attachmentName?.substring(
        attachmentName.lastIndexOf('.') + 1,
    )
    return (
        <div
            className={styles.downloadWrapper}
            onClick={() => onClickDownload?.()}
            title={attachmentName}
        >
            <FileIcon suffix={fileSuffix} />
            <div className={styles.downloadText} title={attachmentName}>
                {attachmentName}
            </div>
            <Tooltip title={__('下载')} getPopupContainer={(n) => n}>
                <FontIcon name="icon-xiazai" className={styles.downloadIcon} />
            </Tooltip>
        </div>
    )
}

// 展示值
export const showValue = ({
    actualDetails,
    onClickShowAll,
    downloadAttachment,
}: {
    actualDetails: any
    onClickShowAll?: () => void
    downloadAttachment?: () => void
}) => ({
    objection_type: objectionTypeMap[actualDetails?.objection_type]?.text,
    score: evaluationScoreTypeMap[actualDetails?.score]?.text,
    solved: evaluationSolvedTypeMap[actualDetails?.solved]?.text,
    operate: operateTypeInfo[actualDetails?.operate]?.text,
    created_at: moment(actualDetails?.created_at).format('YYYY-MM-DD'),
    details_button: <a onClick={onClickShowAll}>{__('查看全部')}</a>,
    attachment_name: (
        <DownloadElement
            attachmentName={actualDetails?.attachment_name}
            onClickDownload={downloadAttachment}
        />
    ),
})

// 刷新详情
export const refreshDetails = ({
    type,
    actualDetails,
    onClickShowAll,
    downloadAttachment,
}: {
    type: DetailType
    actualDetails: any
    onClickShowAll?: () => void
    downloadAttachment?: () => void
}) => {
    // 根据类型过滤出详情列表
    const showList = detailsDefault.filter((i) => i.type.includes(type))

    // 根据详情列表的key，展示对应的value
    return actualDetails
        ? showList.map((i) => ({
              ...i,
              value:
                  showValue({
                      actualDetails,
                      onClickShowAll,
                      downloadAttachment,
                  })[i.key] ??
                  actualDetails[i.key] ??
                  '',
          }))
        : showList
}

// 检查是否显示处理按钮
export const checkDealPerm = ({
    record,
    checkPermission,
    statusOp,
    userInfo,
}) => {
    // 如果处理人存在，且处理人不是当前用户，则不显示处理按钮
    if (record?.transactor_id) {
        if (record?.transactor_id !== userInfo?.ID) {
            return statusOp.filter((item) => item !== ObjectionOperate.Deal)
        }
    } else if (
        // 如果处理人不存在，且当前用户不是数据运营工程师，则不显示处理按钮
        !checkPermission(allRoleList.TCDataOperationEngineer)
    ) {
        return statusOp.filter((item) => item !== ObjectionOperate.Deal)
    }
    return statusOp
}
