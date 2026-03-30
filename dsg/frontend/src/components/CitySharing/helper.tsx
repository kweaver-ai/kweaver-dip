import {
    DownOutlined,
    ExclamationCircleFilled,
    InfoCircleOutlined,
    UpOutlined,
} from '@ant-design/icons'
import {
    Button,
    Col,
    Divider,
    ModalFuncProps,
    Row,
    Space,
    Tag,
    Tooltip,
} from 'antd'
import classnames from 'classnames'
import moment from 'moment'
import React, { useState } from 'react'
import dataEmpty from '@/assets/dataEmpty.svg'
import { ShareApplyStatus, SupplyType } from '@/core'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import { Empty, Loader } from '@/ui'
import { formatTime } from '@/utils'
import { confirm } from '@/utils/modalHelper'
import AuditorTooltip from '../AuditorTooltip'
import { typeOptoins } from '../ResourcesDir/const'
import ResourceIcon from './component/ResourceIcon'
import {
    apiImplStatusListMap,
    applyProcessMap,
    ApplyResource,
    auditStatusListMap,
    implStatusListMap,
    SharingOperate,
    SharingTab,
} from './const'
import __ from './locale'
import styles from './styles.module.less'

export const SubTitle: React.FC<{ title: string; subTitle: string }> = ({
    title,
    subTitle,
}) => (
    <div>
        <span>{title}</span>
        <span className={styles.sub_title}>{subTitle}</span>
    </div>
)

// 双列行
export const MultiColumn = ({
    record,
    onClick,
}: {
    record?: any
    onClick?: () => void
}) => {
    const {
        name,
        code,
        audit_status,
        reject_reason,
        anal_reject_reason,
        ds_audit_reject_reason,
        feedback_reject_reason,
        audit_apply_id,
    } = record || {}

    // 获取有效的拒绝原因
    const effectiveReason =
        reject_reason ||
        anal_reject_reason ||
        ds_audit_reject_reason ||
        feedback_reject_reason

    return (
        <div className={styles.multiColumnWrapper}>
            <div className={styles.titleWrapper}>
                <div
                    title={name}
                    className={styles.columnTitle}
                    onClick={onClick}
                >
                    {name}
                </div>
                {audit_status && (
                    <AuditStatusTag
                        auditStatus={audit_status}
                        reason={effectiveReason}
                        auditApplyId={audit_apply_id}
                    />
                )}
            </div>
            <div title={code} className={styles.columnSubTitle}>
                {code}
            </div>
        </div>
    )
}

export const AuditStatusTag = ({
    auditStatus,
    reason,
    map = auditStatusListMap,
    auditApplyId = '',
}: {
    auditStatus: any
    reason?: string
    auditApplyId?: string
    map?: any
}) => {
    const [applyId, setApplyId] = useState('')

    const { backgroundColor, color, text } = map[auditStatus] || {}

    return (
        <Tag
            className={styles.auditStatus}
            style={{
                backgroundColor,
                color,
            }}
        >
            <AuditorTooltip auditApplyId={applyId}>
                <span
                    onMouseEnter={() => setApplyId(auditApplyId)}
                    onMouseLeave={() => setApplyId('')}
                >
                    {text}
                </span>
            </AuditorTooltip>

            {reason && (
                <Tooltip title={reason} getPopupContainer={() => document.body}>
                    <InfoCircleOutlined
                        className={styles.reasonIcon}
                        color="rgba(230, 0, 18, 1)"
                    />
                </Tooltip>
            )}
        </Tag>
    )
}

/**
 * 资源名称 view
 */
export const SourceNameView: React.FC<{
    data?: any
    onClick?: () => void
}> = ({ data, onClick }) => {
    const { data_res_name, data_res_code, supply_type, impl_tag } = data || {}
    let apiStatus = ''
    if (supply_type === SupplyType.API) {
        // 订阅成功
        if (
            typeof data.sub_success === 'boolean' &&
            data.sub_success &&
            data.status === ShareApplyStatus.Implemented
        ) {
            apiStatus = SharingOperate.ViewSubService
        }
        // 订阅失败
        if (typeof data.sub_success === 'boolean' && !data.sub_success) {
            apiStatus = SharingOperate.ResSubService
        }
        if (typeof data.sync_success === 'boolean' && !data.sync_success) {
            apiStatus = SharingOperate.SyncApi
        }
        // 同步成功但没有订阅过
        if (data.sync_success && typeof data.sub_success !== 'boolean') {
            apiStatus = SharingOperate.SubService
        }
    }
    return (
        <div className={styles.sourceNameView}>
            <FontIcon
                name={
                    supply_type === SupplyType.View
                        ? 'icon-shujuziyuan'
                        : 'icon-jiekoufuwuguanli'
                }
                type={IconType.COLOREDICON}
                className={styles.sourceIcon}
            />
            <div className={styles.multiColumnWrapper}>
                <div className={styles.titleWrapper} onClick={onClick}>
                    <div title={data_res_name} className={styles.columnTitle}>
                        {data_res_name}
                    </div>
                    {impl_tag && supply_type === SupplyType.View && (
                        <AuditStatusTag
                            auditStatus={impl_tag}
                            map={implStatusListMap}
                            reason={data.reject_reason}
                        />
                    )}
                    {supply_type === SupplyType.API && apiStatus && (
                        <AuditStatusTag
                            auditStatus={apiStatus}
                            map={apiImplStatusListMap}
                            reason={
                                data.sub_failed_reason ||
                                data.sync_failed_reason
                            }
                        />
                    )}
                </div>
                <div title={data_res_code} className={styles.columnSubTitle}>
                    {data_res_code}
                </div>
            </div>
        </div>
    )
}

/**
 * 申请人 view
 */
export const ApplierView: React.FC<{
    data?: any
}> = ({ data }) => {
    const { applier, phone } = data || {}
    return (
        <div className={styles.twoLine}>
            <div title={applier} className={styles.the_one_line}>
                {applier}
            </div>
            <div title={phone} className={styles.the_two_line}>
                {phone}
            </div>
        </div>
    )
}

/**
 * 带圆点状态 view
 */
export const StatusView: React.FC<{
    record: any
    tip?: string
    tab?: SharingTab
}> = ({ record, tip, tab }) => {
    const { text, color } = applyProcessMap[record?.status] || {}
    let displayText = text
    if (
        tab === SharingTab.ImplementData &&
        record?.status === ShareApplyStatus.Implementing
    ) {
        displayText = __('实施处理中')
    }

    return (
        <div className={styles.statusView}>
            <div
                className={styles.dot}
                style={{ background: color || 'transparent' }}
            />
            <span className={styles.text}>{displayText || '--'}</span>
            {tip && (
                <Tooltip title={tip} getPopupContainer={(n) => n}>
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
 * 资源类型 view
 */
export const SourceTypeView: React.FC<{
    data?: any
}> = ({ data }) => {
    const { view_num, api_num } = data || {}
    if (!view_num && !api_num) return <span>--</span>

    return (
        <span>
            {view_num ? `${__('库表')}（${view_num}）` : ''}
            {api_num ? `${__('接口')}（${api_num}）` : ''}
        </span>
    )
}

// 状态筛选组件
export const StatusFilter: React.FC<{
    statusOptions: any[]
    selectStatus: ShareApplyStatus
    onStatusChange: (status: ShareApplyStatus) => void
}> = ({ statusOptions, selectStatus, onStatusChange }) => {
    return (
        <div className={styles.statusFilter}>
            {statusOptions.map((option, index) => (
                <React.Fragment key={option.status}>
                    <span
                        className={
                            selectStatus === option.status
                                ? styles.selectStatusActive
                                : styles.selectStatus
                        }
                        onClick={() => onStatusChange(option.status)}
                    >
                        {option.label}
                    </span>
                    {index < statusOptions.length - 1 && (
                        <Divider type="vertical" />
                    )}
                </React.Fragment>
            ))}
        </div>
    )
}

/**
 * 卡片头
 */
interface CardHeaderProps {
    section: any
    expanded: boolean
    handleToggleExpand: (section: any) => void
}

export const CardHeader: React.FC<CardHeaderProps> = ({
    section,
    expanded,
    handleToggleExpand,
}) => {
    return (
        <Row
            justify="space-between"
            align="middle"
            className={styles.sectionRow}
        >
            <Col className={styles.sectionInfo}>
                <Space size="large" className={styles.infoSpace}>
                    <span className={styles.sectionTitle}>
                        <FontIcon
                            name="icon-shenqingdan"
                            style={{ color: '#126ee3' }}
                        />
                        <span
                            className={styles.ellipsisContent}
                            title={section.name}
                        >
                            {section.name}
                        </span>
                    </span>
                    <span className={styles.infoItem}>
                        <span className={styles.label}>{__('资源个数：')}</span>
                        <span
                            className={classnames(
                                styles.ellipsisContent,
                                styles.resourceNum,
                            )}
                            title={`${section.view_num + section.api_num}`}
                        >
                            {section.view_num + section.api_num}
                        </span>
                    </span>
                    <span className={styles.infoItem}>
                        <span className={styles.label}>{__('申请部门：')}</span>
                        <span
                            className={styles.ellipsisContent}
                            title={
                                section.apply_org_path || section.apply_org_name
                            }
                        >
                            {section.apply_org_name}
                        </span>
                    </span>
                    <span className={styles.infoItem}>
                        <span className={styles.label}>{__('申请时间：')}</span>
                        <span
                            className={styles.ellipsisContent}
                            title={formatTime(section.created_at)}
                        >
                            {formatTime(section.created_at)}
                        </span>
                    </span>
                </Space>
            </Col>
            <Col className={styles.actionCol}>
                <Button
                    type="link"
                    onClick={() => handleToggleExpand(section)}
                    icon={expanded ? <UpOutlined /> : <DownOutlined />}
                >
                    {expanded ? __('收起') : __('展开')}
                </Button>
            </Col>
        </Row>
    )
}

/**
 * 操作提示 modal
 */
export const PromptModal = ({ ...porps }: ModalFuncProps) => {
    confirm({
        icon: <ExclamationCircleFilled style={{ color: '#FAAD14' }} />,
        focusTriggerAfterClose: false, // 取消后不触发按钮聚焦
        okText: __('确定'),
        cancelText: __('取消'),
        keyboard: false,
        ...porps,
    })
}

/**
 * 资源类型 tag
 * @param label 文本
 * @param color 颜色
 * @param bgColor 边框色
 */
export const ResourceTag: React.FC<{
    data?: {
        text: string
        color: string
        background: string
    }
}> = ({ data }) => {
    return data?.text ? (
        <div className={styles.resourceTag}>
            <div
                className={styles.name}
                style={{
                    color: data?.color || 'rgb(0 0 0 / 85%)',
                    background: data?.background || 'rgba(0, 0, 0, 0.06)',
                }}
            >
                {data?.text}
            </div>
        </div>
    ) : (
        ''
    )
}

/**
 * 资源失效 tag
 */
export const ResourceInvalidTag: React.FC = () => {
    return <div className={styles.resourceInvalidTag}>{__('已失效')}</div>
}

/**
 * 分组头 view
 */
export const GroupHeader: React.FC<{
    text?: string
}> = ({ text }) => {
    return (
        <div className={styles.groupHeader}>
            <div className={styles.line} />
            <div className={styles.title}>{text}</div>
        </div>
    )
}

/**
 * 分组子标题 view
 */
export const GroupSubHeader: React.FC<{
    text?: string
}> = ({ text }) => {
    return (
        <div className={styles.groupSubHeader}>
            <div className={styles.title}>{text}</div>
        </div>
    )
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
 * 资源 item
 */
export const ResourceItem: React.FC<{
    resoure?: any
}> = ({ resoure }) => (
    <div className={styles.resourceItem}>
        <ResourceIcon
            type={resoure?.resource_type}
            style={{ marginRight: 8 }}
        />
        <span className={styles.resourceName}>
            {resoure?.resource_name || '--'}
        </span>
    </div>
)

/**
 * 获取Query数据
 */
const getQueryData = (search: string): any => {
    const keyValueData = search
        .replace(/^\?{1}/, '')
        .replace('?', '&')
        .split('&')
        .filter((current) => current)
    const queryData = keyValueData.reduce((preData, currentData) => {
        const [key, value] = currentData.split('=')
        return {
            ...preData,
            [key]: value,
        }
    }, {})
    return queryData
}

/**
 * 组装url
 */
export const changeUrlData = (
    params: { [key: string]: string },
    deleteParams: Array<string> = [],
    targetUrl: string = '',
) => {
    const url = targetUrl || window.location.pathname
    const queryData = getQueryData(window.location.search)
    const newData = { ...queryData, ...params }
    const searchData = Object.keys(newData)
        .filter((currentData) => !deleteParams.includes(currentData))
        .map((currentData) => `${currentData}=${newData[currentData]}`)
    return searchData.length ? `${url}?${searchData.join('&')}` : url
}

// 将期望完成时间、创建时间调整为时间戳
export const timeStrToTimestamp = (searchObj: any) => {
    const obj: any = {}
    const timeFields = [
        'create_begin_time',
        'create_end_time',
        'finish_begin_time',
        'finish_end_time',
        'anal_audit_begin_time',
        'anal_audit_end_time',
        'impl_begin_time',
        'impl_end_time',
        'close_begin_time',
        'close_end_time',
    ]
    // eslint-disable-next-line no-restricted-syntax, guard-for-in
    for (const key in searchObj) {
        if (Object.prototype.hasOwnProperty.call(searchObj, key)) {
            obj[key] = searchObj[key]
                ? timeFields.includes(key)
                    ? moment(searchObj[key]).valueOf()
                    : searchObj[key]
                : undefined
        }
    }
    return obj
}
export const getDataTypeByStr = (type: string) => {
    return typeOptoins.find((item) => item.strValue === type)
}

/**
 * 标签 view
 */
export const TagsView = (props: { data?: string[] }) => {
    const { data = [] } = props
    return (
        <div className={styles.tagsViewWrap}>
            {data.length > 0
                ? data.map((item, idx) => (
                      <span key={idx} className={styles.tagItem}>
                          {item}
                      </span>
                  ))
                : '--'}
        </div>
    )
}

export const ViewResultConfig = [
    {
        label: __('资源信息'),
        key: 'catalog_info',
        configs: [
            {
                label: __('资源名称：'),
                key: 'res_name',
                span: 12,
                value: '',
            },
            {
                label: __('编码：'),
                key: 'res_code',
                span: 12,
                value: '',
            },
            {
                label: __('所属部门：'),
                key: 'org_path',
                span: 12,
                value: '',
            },
            {
                label: __('共享条件：'),
                key: 'shared_condition',
                span: 12,
                value: '',
            },
        ],
        type: [ApplyResource.Database, ApplyResource.Interface],
    },
    {
        label: __('资源使用配置'),
        key: 'catalog_config',
        type: [ApplyResource.Database, ApplyResource.Interface],
        configs: [
            {
                label: __('资源提供方式：'),
                key: 'supply_type',
                span: 12,
                value: '',
                type: [ApplyResource.Database, ApplyResource.Interface],
            },
            {
                label: __('数据资源名称：'),
                key: 'data_res_name',
                span: 12,
                value: '',
                type: [ApplyResource.Database, ApplyResource.Interface],
            },
            {
                label: __('期望空间范围：'),
                key: 'area_range',
                span: 12,
                value: '',
                type: [ApplyResource.Database],
            },
            {
                label: __('期望时间范围：'),
                key: 'time_range',
                span: 12,
                value: '',
                type: [ApplyResource.Database],
            },
            {
                label: __('期望推送频率：'),
                key: 'push_frequency',
                span: 12,
                value: '',
                type: [ApplyResource.Database],
            },
            {
                label: __('预计调用频率：'),
                key: 'call_frequency',
                span: 12,
                value: '',
                type: [ApplyResource.Interface],
            },
            {
                label: __('资源使用期限：'),
                key: 'available_date_type',
                span: 12,
                value: '',
                type: [ApplyResource.Database, ApplyResource.Interface],
            },
        ],
    },
    {
        label: __('首次数据同步作业'),
        key: 'first_sync_task',
        type: [ApplyResource.Database],
        configs: [
            {
                label: __('任务名称：'),
                key: 'step_name',
                span: 24,
                value: '',
            },
            {
                label: __('执行方式：'),
                key: 'sync_method',
                span: 12,
                value: '',
            },
            {
                label: __('任务耗时：'),
                key: 'sync_time',
                span: 12,
                value: '',
            },
            {
                label: __('请求时间：'),
                key: 'start_time',
                span: 12,
                value: '',
            },
            {
                label: __('完成时间：'),
                key: 'end_time',
                span: 12,
                value: '',
            },
            {
                label: __('推送总数：'),
                key: 'sync_count',
                span: 12,
                value: '',
            },
            {
                label: __('推送成功数：'),
                // key: 'push_success_count',
                key: 'sync_count',
                span: 12,
                value: '',
            },
        ],
    },
    {
        label: __('接口调用配置'),
        key: 'interface_config',
        type: [ApplyResource.Interface],
        configs: [
            {
                label: `${__('应用名称')}:`,
                key: 'app_name',
                span: 24,
                value: '',
            },
            {
                label: `${__('服务地址')}:`,
                key: 'service_path',
                span: 24,
                value: '',
            },
            {
                label: `${__('账户名称')}:`,
                key: 'app_count_name',
                span: 24,
                value: '',
            },
            {
                label: `${__('账户ID')}:`,
                key: 'app_count_id',
                span: 24,
                value: '',
            },
        ],
    },
]

// 资源类型
export const enum ResTypeEnum {
    Catalog = 'catalog',
    Api = 'api',
}
