import React from 'react'
import moment from 'moment'
import classnames from 'classnames'
import {
    SortDirection,
    SortType,
    FeedbackStatus,
    FeedbackOpType,
    FeedbackTypeResMode,
    ResType,
    IndicatorType,
} from '@/core'
import { SearchType } from '@/ui/LightweightSearch/const'
import styles from './styles.module.less'
import { Empty, Loader } from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'
import __ from './locale'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'

/**
 * 反馈管理菜单
 */
export enum FeedbackMenuEnum {
    // 待办反馈
    Pending = 'pending',
    // 已办反馈
    Handled = 'handled',
    // 我的反馈 - 逻辑视图
    DataView = 'data-view',
    // 我的反馈 - 接口服务
    InterfaceSvc = 'interface-svc',
    // 我的反馈 - 指标
    Indicator = 'indicator',
}

/**
 * 反馈操作
 */
export enum FeedbackOperate {
    // 详情
    Details = 'Details',
    // 反馈详情
    FeedbackDetails = 'FeedbackDetails',
    // 回复
    Reply = 'Reply',
}

// 反馈类型映射
export const feedbackTypeMap = {
    [FeedbackTypeResMode.InfoError]: {
        text: __('信息有误'),
    },
    [FeedbackTypeResMode.DataQuality]: {
        text: __('数据质量问题'),
    },
    [FeedbackTypeResMode.Other]: {
        text: __('其他'),
    },
}

/**
 * 反馈类型视图
 */
export const FeedbackTypeView = ({ type }: { type: FeedbackTypeResMode }) => {
    return (
        <span className={styles.feedbackTypeView}>
            {feedbackTypeMap[type]?.text || '--'}
        </span>
    )
}

// 反馈类型选项
export const feedbackTypeOptions = [
    {
        value: '',
        label: __('不限'),
    },
    {
        value: FeedbackTypeResMode.InfoError,
        label: feedbackTypeMap[FeedbackTypeResMode.InfoError]?.text,
    },
    {
        value: FeedbackTypeResMode.DataQuality,
        label: feedbackTypeMap[FeedbackTypeResMode.DataQuality]?.text,
    },
    {
        value: FeedbackTypeResMode.Other,
        label: feedbackTypeMap[FeedbackTypeResMode.Other]?.text,
    },
]

// 指标类型映射
export const indicatorTypeMap = {
    [IndicatorType.Atomic]: {
        text: __('原子指标'),
    },
    [IndicatorType.Derived]: {
        text: __('衍生指标'),
    },
    [IndicatorType.Composite]: {
        text: __('复合指标'),
    },
}

// 指标类型选项
export const indicatorTypeOptions = [
    {
        value: '',
        label: __('不限'),
    },
    {
        value: IndicatorType.Atomic,
        label: indicatorTypeMap[IndicatorType.Atomic]?.text,
    },
    {
        value: IndicatorType.Derived,
        label: indicatorTypeMap[IndicatorType.Derived]?.text,
    },
    {
        value: IndicatorType.Composite,
        label: indicatorTypeMap[IndicatorType.Composite]?.text,
    },
]

// 资源类型映射
export const resTypeMap = {
    [ResType.DataView]: {
        text: __('逻辑视图'),
    },
    [ResType.InterfaceSvc]: {
        text: __('接口服务'),
    },
    [ResType.Indicator]: {
        text: __('指标'),
    },
}

// 资源类型选项
export const resTypeOptions = [
    {
        value: '',
        label: __('不限'),
    },
    {
        value: ResType.DataView,
        label: resTypeMap[ResType.DataView]?.text,
    },
    {
        value: ResType.InterfaceSvc,
        label: resTypeMap[ResType.InterfaceSvc]?.text,
    },
    {
        value: ResType.Indicator,
        label: resTypeMap[ResType.Indicator]?.text,
    },
]

// 反馈状态映射
export const feedbackStatusMap = {
    [FeedbackStatus.Pending]: {
        text: __('待处理'),
        color: 'rgba(58, 143, 240, 1)',
    },
    [FeedbackStatus.Replied]: {
        text: __('已回复'),
        color: 'rgba(82, 196, 27, 1)',
    },
}

// 反馈状态选项
export const feedbackStatusOptions = [
    {
        value: '',
        label: __('不限'),
    },
    {
        value: FeedbackStatus.Pending,
        label: feedbackStatusMap[FeedbackStatus.Pending]?.text,
    },
    {
        value: FeedbackStatus.Replied,
        label: feedbackStatusMap[FeedbackStatus.Replied]?.text,
    },
]

export const feedbackOpTypeMap = {
    [FeedbackOpType.Submit]: {
        text: __('反馈提交'),
    },
    [FeedbackOpType.Reply]: {
        text: __('反馈回复'),
    },
}

export const FeedbackTabMap = {
    [FeedbackMenuEnum.Pending]: {
        title: __('待办列表'),

        // 表格列名
        columnKeys: [
            'res_title',
            // 'res_type',
            'org_name',
            'feedback_type',
            'feedback_desc',
            'created_at',
            'action',
        ],
        // 操作栏宽度
        actionWidth: 80,
        // 排序菜单
        sortMenus: [
            { key: SortType.RESTITLE, label: __('按资源名称排序') },
            { key: SortType.CREATED, label: __('按反馈时间排序') },
        ],
        // 默认菜单排序
        defaultMenu: {
            key: SortType.CREATED,
            sort: SortDirection.DESC,
        },
        // 默认表头排序
        defaultTableSort: { created_at: SortDirection.DESC },
        // 筛选项
        searchFormData: [
            // {
            //     label: __('资源类型'),
            //     key: 'res_type',
            //     options: resTypeOptions,
            //     type: SearchType.Radio,
            // },
            {
                label: __('反馈类型'),
                key: 'feedback_type',
                options: feedbackTypeOptions,
                type: SearchType.Radio,
            },
        ],
        // 默认搜索条件
        defaultSearch: {
            res_type: '',
            feedback_type: '',
        },
        initSearch: {
            limit: 10,
            offset: 1,
            // view: FeedbackView.Operator,
            status: FeedbackStatus.Pending,
            sort: SortType.CREATED,
            direction: SortDirection.DESC,
        },
        ignoreSearchAttr: ['offset', 'limit', 'sort', 'direction', 'status'],
    },
    [FeedbackMenuEnum.Handled]: {
        title: __('已办列表'),
        columnKeys: [
            'res_title',
            // 'res_type',
            'org_name',
            'feedback_type',
            'feedback_desc',
            'created_at',
            'replied_at',
            'action',
        ],
        actionWidth: 80,
        sortMenus: [
            { key: SortType.RESTITLE, label: __('按资源名称排序') },
            { key: SortType.CREATED, label: __('按反馈时间排序') },
            { key: SortType.REPLYAT, label: __('按回复时间排序') },
        ],
        defaultMenu: {
            key: SortType.REPLYAT,
            sort: SortDirection.DESC,
        },
        defaultTableSort: { replied_at: SortDirection.DESC },
        // 筛选项
        searchFormData: [
            // {
            //     label: __('资源类型'),
            //     key: 'res_type',
            //     options: resTypeOptions,
            //     type: SearchType.Radio,
            // },
            {
                label: __('反馈类型'),
                key: 'feedback_type',
                options: feedbackTypeOptions,
                type: SearchType.Radio,
            },
        ],
        // 默认搜索条件
        defaultSearch: {
            res_type: '',
            feedback_type: '',
        },
        initSearch: {
            limit: 10,
            offset: 1,
            // view: FeedbackView.Operator,
            status: FeedbackStatus.Replied,
            sort: SortType.CREATED,
            direction: SortDirection.DESC,
        },
        ignoreSearchAttr: ['offset', 'limit', 'sort', 'direction', 'status'],
    },
    [FeedbackMenuEnum.DataView]: {
        title: __('反馈列表'),
        columnKeys: [
            'res_title',
            'status',
            'org_name',
            'feedback_type',
            'feedback_desc',
            'created_at',
            'replied_at',
            'action',
        ],
        actionWidth: 80,
        sortMenus: [
            { key: SortType.RESTITLE, label: __('按资源名称排序') },
            { key: SortType.CREATED, label: __('按反馈时间排序') },
            { key: SortType.REPLYAT, label: __('按回复时间排序') },
        ],
        defaultMenu: {
            key: SortType.CREATED,
            sort: SortDirection.DESC,
        },
        defaultTableSort: { created_at: SortDirection.DESC },
        // 筛选项
        searchFormData: [
            {
                label: __('状态'),
                key: 'status',
                options: feedbackStatusOptions,
                type: SearchType.Radio,
            },
            {
                label: __('反馈类型'),
                key: 'feedback_type',
                options: feedbackTypeOptions,
                type: SearchType.Radio,
            },
        ],
        // 默认搜索条件
        defaultSearch: {
            status: '',
            feedback_type: '',
            res_type: ResType.DataView,
        },
        initSearch: {
            limit: 10,
            offset: 1,
            // view: FeedbackView.Applier,
            sort: SortType.CREATED,
            direction: SortDirection.DESC,
            res_type: ResType.DataView,
        },
        ignoreSearchAttr: ['offset', 'limit', 'sort', 'direction', 'res_type'],
    },
    [FeedbackMenuEnum.InterfaceSvc]: {
        title: __('反馈列表'),
        columnKeys: [
            'res_title',
            'status',
            'org_name',
            'feedback_type',
            'feedback_desc',
            'created_at',
            'replied_at',
            'action',
        ],
        actionWidth: 80,
        sortMenus: [
            { key: SortType.RESTITLE, label: __('按资源名称排序') },
            { key: SortType.CREATED, label: __('按反馈时间排序') },
            { key: SortType.REPLYAT, label: __('按回复时间排序') },
        ],
        defaultMenu: {
            key: SortType.CREATED,
            sort: SortDirection.DESC,
        },
        defaultTableSort: { created_at: SortDirection.DESC },
        // 筛选项
        searchFormData: [
            {
                label: __('状态'),
                key: 'status',
                options: feedbackStatusOptions,
                type: SearchType.Radio,
            },
            {
                label: __('反馈类型'),
                key: 'feedback_type',
                options: feedbackTypeOptions,
                type: SearchType.Radio,
            },
        ],
        // 默认搜索条件
        defaultSearch: {
            status: '',
            feedback_type: '',
        },
        initSearch: {
            limit: 10,
            offset: 1,
            // view: FeedbackView.Applier,
            sort: SortType.CREATED,
            direction: SortDirection.DESC,
            res_type: ResType.InterfaceSvc,
        },
        ignoreSearchAttr: ['offset', 'limit', 'sort', 'direction', 'res_type'],
    },
    [FeedbackMenuEnum.Indicator]: {
        title: __('反馈列表'),
        columnKeys: [
            'res_title',
            'indicator_type',
            'status',
            'org_name',
            'feedback_type',
            'feedback_desc',
            'created_at',
            'replied_at',
            'action',
        ],
        actionWidth: 80,
        sortMenus: [
            { key: SortType.RESTITLE, label: __('按资源名称排序') },
            { key: SortType.CREATED, label: __('按反馈时间排序') },
            { key: SortType.REPLYAT, label: __('按回复时间排序') },
        ],
        defaultMenu: {
            key: SortType.CREATED,
            sort: SortDirection.DESC,
        },
        defaultTableSort: { created_at: SortDirection.DESC },
        // 筛选项
        searchFormData: [
            {
                label: __('指标类型'),
                key: 'indicator_type',
                options: indicatorTypeOptions,
                type: SearchType.Radio,
            },
            {
                label: __('状态'),
                key: 'status',
                options: feedbackStatusOptions,
                type: SearchType.Radio,
            },
            {
                label: __('反馈类型'),
                key: 'feedback_type',
                options: feedbackTypeOptions,
                type: SearchType.Radio,
            },
        ],
        // 默认搜索条件
        defaultSearch: {
            status: '',
            feedback_type: '',
            indicator_type: '',
        },
        initSearch: {
            limit: 10,
            offset: 1,
            // view: FeedbackView.Applier,
            sort: SortType.CREATED,
            direction: SortDirection.DESC,
            res_type: ResType.Indicator,
        },
        ignoreSearchAttr: ['offset', 'limit', 'sort', 'direction', 'res_type'],
    },
}

// 反馈基础信息
export const basicInfoList = [
    {
        key: 'res_title',
        label: __('资源名称'),
        span: 24,
        value: '',
    },
    {
        key: 'org_path',
        label: __('所属部门'),
        span: 24,
        value: '',
    },
    {
        key: 'res_type',
        label: __('资源类型'),
        span: 24,
        value: '',
    },
    {
        key: 'feedback_type',
        label: __('反馈类型'),
        span: 24,
        value: '',
    },
    {
        key: 'created_at',
        label: __('反馈时间'),
        span: 24,
        value: '',
    },
    {
        key: 'feedback_desc',
        label: __('反馈描述'),
        span: 24,
        value: '',
    },
]

// 反馈详情：在 feedback_type 后、created_at 前插入 status
export const fullInfoList = (() => {
    const list = [...basicInfoList]
    const statusItem = {
        key: 'status',
        label: __('反馈状态'),
        span: 24,
        value: '',
    }
    const createdIndex = list.findIndex((i) => i.key === 'created_at')
    if (createdIndex !== -1) {
        list.splice(createdIndex, 0, statusItem)
    } else {
        list.push(statusItem)
    }
    return list
})()

// 回复详情
export const replyInfoList = [
    {
        key: 'op_user_name',
        label: __('回复人'),
        span: 24,
        value: '',
    },
    {
        key: 'created_at',
        label: __('回复时间'),
        span: 24,
        value: '',
    },
    {
        key: 'reply_content',
        label: __('回复内容'),
        span: 24,
        value: '',
    },
]

// 展示值
export const showValue = ({ actualDetails }: { actualDetails: any }) => ({
    status: <StatusView data={feedbackStatusMap[actualDetails?.status]} />,
    res_type: resTypeMap[actualDetails?.res_type]?.text || '--',
    feedback_type: <FeedbackTypeView type={actualDetails?.feedback_type} />,
    created_at: actualDetails?.created_at
        ? moment(actualDetails?.created_at).format('YYYY-MM-DD HH:mm:ss')
        : '--',
    replied_at: actualDetails?.replied_at
        ? moment(actualDetails?.replied_at).format('YYYY-MM-DD HH:mm:ss')
        : '--',
})

// 刷新详情
export const refreshDetails = ({
    detailList = [],
    actualDetails,
}: {
    detailList?: any[]
    actualDetails?: any
}) => {
    // 根据详情列表的key，展示对应的value
    return actualDetails
        ? detailList?.map((i) => ({
              ...i,
              value:
                  showValue({
                      actualDetails,
                  })[i.key] ??
                  actualDetails[i.key] ??
                  '',
          }))
        : detailList
}

// 详情展示中的分组样式
export const DetailGroupTitle = ({ title }: { title: string }) => {
    return <div className={styles.detailGroupTitle}>{title}</div>
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
 * 双列表头
 */
export const MultiHeader = ({
    mainTitle,
    subTitle,
}: {
    mainTitle: string
    subTitle: string
}) => {
    return (
        <span>
            <span>{mainTitle}</span>
            <span className={styles.subTitle}>{subTitle}</span>
        </span>
    )
}

// 双列行
export const MultiColumn = ({
    record,
    onClick,
}: {
    record: any
    onClick?: () => void
}) => {
    // 是否下线
    const isOnline = record?.is_online

    // 点击事件
    const handleClick = () => {
        if (!isOnline) return
        onClick?.()
    }

    return (
        <div
            className={classnames(styles.multiColumnWrapper, {
                [styles.offline]: !isOnline,
            })}
        >
            {getSourceIcon(record?.res_type, record?.indicator_type)}
            <div className={styles.contentWrapper}>
                <div
                    title={record?.res_title}
                    className={styles.valueWrapper}
                    onClick={handleClick}
                >
                    <span className={styles.value}>{record?.res_title}</span>
                    {!isOnline && (
                        <span className={styles.offlineTips}>
                            {__('已下线')}
                        </span>
                    )}
                </div>
                <div title={record?.res_code} className={styles.subValue}>
                    {record?.res_code}
                </div>
            </div>
        </div>
    )
}

/**
 * 获取资源图标
 */
const getSourceIcon = (type: ResType, indicatorType: IndicatorType) => {
    let iconName = ''
    switch (type) {
        case ResType.DataView:
            iconName = 'icon-shujubiaoshitu'
            break
        case ResType.InterfaceSvc:
            iconName = 'icon-jiekoufuwuguanli'
            break
        case ResType.Indicator:
            if (indicatorType === IndicatorType.Atomic) {
                iconName = 'icon-yuanzizhibiaosuanzi'
            } else if (indicatorType === IndicatorType.Derived) {
                iconName = 'icon-yanshengzhibiaosuanzi'
            } else if (indicatorType === IndicatorType.Composite) {
                iconName = 'icon-fuhezhibiaosuanzi'
            }
            break
        default:
            break
    }

    return (
        <FontIcon
            className={styles.sourceIcon}
            name={iconName}
            type={IconType.COLOREDICON}
        />
    )
}

/**
 * 列表状态 view
 */
export const StatusView: React.FC<{
    data?: { text: string; color: string }
}> = ({ data }) => {
    return (
        <div className={styles.statusView}>
            <div
                className={styles.dot}
                style={{ background: data?.color || 'transparent' }}
            />
            <span className={styles.text}>{data?.text || '--'}</span>
        </div>
    )
}

/**
 * 安全地解析JSON字符串，处理控制字符问题
 */
export const jsonParse = (
    jsonString: string | null | undefined,
    defaultValue: any,
) => {
    if (!jsonString) {
        return defaultValue
    }

    try {
        // 清理JSON字符串中的控制字符
        const cleanedJsonString = jsonString
            .replace(/\n/g, '\\n') // 换行符
            .replace(/\r/g, '\\r') // 回车符
            .replace(/\t/g, '\\t') // 制表符
            .replace(/\f/g, '\\f') // 换页符
            .split('\b')
            .join('\\b') // 退格符
            .split('\v')
            .join('\\v') // 垂直制表符

        return JSON.parse(cleanedJsonString)
    } catch (error) {
        return defaultValue
    }
}
