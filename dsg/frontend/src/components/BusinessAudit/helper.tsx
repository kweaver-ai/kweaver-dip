import { Button, Space, Tag, Tooltip } from 'antd'

import { ExclamationCircleFilled, InfoCircleOutlined } from '@ant-design/icons'
import dataEmpty from '@/assets/dataEmpty.svg'
import { BusinessAuditStatus, BusinessAuditType } from '@/core'
import { Empty, Loader } from '@/ui'
import { formatTime } from '@/utils'
import { confirm } from '@/utils/modalHelper'
import BusinessDomainLevelIcon from '../BusinessDomainLevel/BusinessDomainLevelIcon'
import __ from './locale'
import styles from './styles.module.less'

// 申请类型 operate
export enum OperateType {
    // 新建
    Create = 'create',
    // 编辑
    Update = 'update',
    // 移动
    Move = 'move',
    // 删除
    Delete = 'delete',
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

/**
 * 空数据
 */
export const renderEmpty = ({
    desc = __('暂无数据'),
    marginTop = 36,
}: {
    desc?: string
    marginTop?: number
}) => (
    <Empty
        iconSrc={dataEmpty}
        desc={desc}
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
 * 操作
 */
export enum AuditOperate {
    // 审核
    Audit = 'Audit',
    // 拒绝
    Reject = 'Reject',
}

// 审核类型
export const AuditTypeMap = {
    [BusinessAuditType.BusinessAreaPublish]: {
        title: __('业务领域审核'),
        nameLabel: __('业务领域名称'),
    },
    [BusinessAuditType.MainBusinessPublish]: {
        title: __('主干业务审核'),
        nameLabel: __('主干业务名称'),
    },
    [BusinessAuditType.BusinessDiagnosisPublish]: {
        title: __('业务诊断审核'),
        nameLabel: __('业务诊断名称'),
    },
    [BusinessAuditType.BusinessModelPublish]: {
        title: __('业务模型审核'),
        nameLabel: __('业务模型名称'),
    },
    [BusinessAuditType.DataModelPublish]: {
        title: __('数据模型审核'),
        nameLabel: __('数据模型名称'),
    },
}

// 申请类型
export const OperateTypeMap = {
    [OperateType.Create]: {
        title: __('新建'),
    },
    [OperateType.Update]: {
        title: __('编辑'),
    },
    [OperateType.Move]: {
        title: __('移动'),
    },
    [OperateType.Delete]: {
        title: __('删除'),
    },
}

export const initSearch = {
    limit: 10,
    offset: 1,
    target: 'tasks',
}

// 详情列表
export const detailList = (auditType: BusinessAuditType) => [
    {
        key: 'name',
        label: AuditTypeMap[auditType]?.nameLabel,
        span: 24,
        value: '',
    },
    {
        key: 'apply_time',
        label: __('申请时间'),
        span: 24,
        value: '',
    },
    {
        key: 'operate',
        label: __('申请类型'),
        span: 24,
        value: '',
    },
    {
        key: 'details_button',
        label: __('详情'),
        span: 24,
        value: '',
    },
]

// 展示值
export const showValue = ({
    actualDetails,
    onClickShowAll,
}: {
    actualDetails?: any
    onClickShowAll?: () => void
}) => ({
    apply_time: formatTime(actualDetails?.apply_time) ?? '--',
    operate: OperateTypeMap[actualDetails?.operate]?.title ?? '--',
    details_button: <a onClick={onClickShowAll}>{__('查看全部')}</a>,
})

// 刷新详情
export const refreshDetails = ({
    auditType,
    actualDetails,
    onClickShowAll,
}: {
    auditType: BusinessAuditType
    actualDetails?: any
    onClickShowAll?: () => void
}) => {
    // 根据详情列表的key，展示对应的value
    return actualDetails
        ? detailList(auditType)?.map((i) => ({
              ...i,
              value:
                  showValue({
                      actualDetails,
                      onClickShowAll,
                  })[i.key] ??
                  actualDetails[i.key] ??
                  '',
          }))
        : detailList(auditType)
}

// 审核状态
export const auditStatusListMap = {
    [BusinessAuditStatus.Unpublished]: {
        text: __('待提交'),
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        color: 'rgba(0, 0, 0)',
    },
    [BusinessAuditStatus.PubAuditing]: {
        text: __('审核中'),
        backgroundColor: 'rgba(24, 144, 255, 0.2)',
        color: 'rgba(24, 144, 255, 1)',
    },

    // [BusinessAuditStatus.Published]: {
    //     text: __('已发布'),
    //     backgroundColor: 'rgba(24, 144, 255, 0.2)',
    //     color: 'rgba(24, 144, 255, 1)',
    // },
    [BusinessAuditStatus.PubReject]: {
        text: __('审核未通过'),
        backgroundColor: 'rgba(255, 77, 79, 0.2)',
        color: 'rgba(255, 77, 79, 1)',
    },
    [BusinessAuditStatus.ChangeAuditing]: {
        text: __('变更审核中'),
        backgroundColor: 'rgba(24, 144, 255, 0.2)',
        color: 'rgba(24, 144, 255, 1)',
    },

    [BusinessAuditStatus.ChangeReject]: {
        text: __('变更未通过'),
        backgroundColor: 'rgba(255, 77, 79, 0.2)',
        color: 'rgba(255, 77, 79, 1)',
    },
    [BusinessAuditStatus.DeleteAuditing]: {
        text: __('删除审核中'),
        backgroundColor: 'rgba(24, 144, 255, 0.2)',
        color: 'rgba(24, 144, 255, 1)',
    },
    [BusinessAuditStatus.DeleteReject]: {
        text: __('删除未通过'),
        backgroundColor: 'rgba(255, 77, 79, 0.2)',
        color: 'rgba(255, 77, 79, 1)',
    },
    [BusinessAuditStatus.AuditReject]: {
        text: __('已拒绝'),
        backgroundColor: 'rgba(255, 77, 79, 0.2)',
        color: 'rgba(255, 77, 79, 1)',
    },
}

export const AuditStatusTag = ({ record }: any) => {
    const { audit_status, reject_reason } = record
    const { backgroundColor, color, text } =
        auditStatusListMap[audit_status] || {}
    // 审核状态为未通过
    const isReject =
        audit_status === BusinessAuditStatus.PubReject ||
        audit_status === BusinessAuditStatus.ChangeReject ||
        audit_status === BusinessAuditStatus.DeleteReject
    return text ? (
        <Tag
            className={styles.auditStatus}
            style={{
                // backgroundColor,
                color,
            }}
        >
            {text}
            {reject_reason && isReject && (
                <Tooltip
                    title={reject_reason}
                    getPopupContainer={() => document.body}
                >
                    <InfoCircleOutlined
                        className={styles.reasonIcon}
                        color="rgba(230, 0, 18, 1)"
                    />
                </Tooltip>
            )}
        </Tag>
    ) : null
}

export const getDisabledTooltip = (action: string, status: string) => {
    return `${status}${__('，无法')}${action}`
}

// 渲染名称
export const RenderName = ({
    value,
    record,
    auditType,
}: {
    value: string
    record?: any
    auditType: BusinessAuditType
}) => {
    // 如果是业务领域发布或删除审核，且有type字段，显示图标
    const shouldShowIcon =
        auditType === BusinessAuditType.BusinessAreaPublish && record?.type

    if (shouldShowIcon) {
        return (
            <span>
                <BusinessDomainLevelIcon
                    isColored
                    type={record?.type}
                    className={styles['architecture-type-icon']}
                />
                {value}
            </span>
        )
    }

    // 其他情况直接显示名称
    return <span>{value}</span>
}
