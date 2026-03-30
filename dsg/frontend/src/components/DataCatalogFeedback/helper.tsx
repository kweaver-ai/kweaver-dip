import React, { useEffect, useState } from 'react'
import moment from 'moment'
import {
    SortDirection,
    SortType,
    FeedbackStatus,
    FeedbackOpType,
    FeedbackView,
    DataDictType,
} from '@/core'
import styles from './styles.module.less'
import { Empty, Loader } from '@/ui'
import { useDict } from '@/hooks/useDict'
import dataEmpty from '@/assets/dataEmpty.svg'
import __ from './locale'

/**
 * 反馈管理菜单
 */
export enum FeedbackMenuEnum {
    // 待办反馈
    Pending = 'pending',
    // 已办反馈
    Handled = 'handled',
    // 我的反馈 - 数据资源目录
    MyFeedback = 'myFeedback',
    // 我的反馈 - 接口服务
    InterfaceSvc = 'interface-svc',
    // 我的反馈 - 库表
    DataView = 'data-view',
}

// 反馈基础信息
export const basicInfoList = [
    {
        key: 'catalog_title',
        label: __('资源目录名称'),
        span: 24,
        value: '',
    },
    {
        key: 'org_path',
        label: __('资源所属部门'),
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

// 反馈详情
export const fullInfoList = [
    ...basicInfoList,
    {
        key: 'status',
        label: __('反馈状态'),
        span: 24,
        value: '',
    },
]

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

/**
 * 反馈操作
 */
export enum FeedbackOperate {
    // 详情
    Details = 'Details',
    // 回复
    Reply = 'Reply',
}

export const feedbackStatusMap = {
    [FeedbackStatus.Pending]: {
        text: __('待处理'),
        color: 'rgba(58, 143, 240, 1)',
        operation: [FeedbackOperate.Details],
    },
    [FeedbackStatus.Replied]: {
        text: __('已回复'),
        color: 'rgba(82, 196, 27, 1)',
        operation: [FeedbackOperate.Details],
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
            'catalog_title',
            'org_name',
            'feedback_type',
            'feedback_desc',
            'created_at',
            'action',
        ],
        // 操作项映射
        actionMap: [FeedbackOperate.Details, FeedbackOperate.Reply],
        // 操作栏宽度
        actionWidth: 138,
        // 排序菜单
        sortMenus: [
            { key: SortType.CATALOGTITLE, label: __('按目录名称排序') },
            { key: SortType.CREATED, label: __('按反馈时间排序') },
        ],
        // 默认菜单排序
        defaultMenu: {
            key: SortType.CREATED,
            sort: SortDirection.DESC,
        },
        // 默认表头排序
        defaultTableSort: { created_at: SortDirection.DESC },
        initSearch: {
            limit: 10,
            offset: 1,
            view: FeedbackView.Operator,
            status: FeedbackStatus.Pending,
            sort: SortType.CREATED,
            direction: SortDirection.DESC,
        },
    },
    [FeedbackMenuEnum.Handled]: {
        title: __('已办列表'),
        columnKeys: [
            'catalog_title',
            'org_name',
            'feedback_type',
            'feedback_desc',
            'created_at',
            'replied_at',
            'action',
        ],
        actionMap: [FeedbackOperate.Details],
        actionWidth: 80,
        sortMenus: [
            { key: SortType.CATALOGTITLE, label: __('按目录名称排序') },
            { key: SortType.CREATED, label: __('按反馈时间排序') },
            { key: SortType.REPLIEDAT, label: __('按回复时间排序') },
        ],
        defaultMenu: {
            key: SortType.CREATED,
            sort: SortDirection.DESC,
        },
        defaultTableSort: { created_at: SortDirection.DESC },
        initSearch: {
            limit: 10,
            offset: 1,
            view: FeedbackView.Operator,
            status: FeedbackStatus.Replied,
            sort: SortType.CREATED,
            direction: SortDirection.DESC,
        },
    },
    [FeedbackMenuEnum.MyFeedback]: {
        title: __('反馈列表'),
        columnKeys: [
            'catalog_title',
            'status',
            'org_name',
            'feedback_type',
            'feedback_desc',
            'created_at',
            'replied_at',
            'action',
        ],
        actionMap: [FeedbackOperate.Details],
        actionWidth: 80,
        sortMenus: [
            { key: SortType.CATALOGTITLE, label: __('按目录名称排序') },
            { key: SortType.CREATED, label: __('按反馈时间排序') },
            { key: SortType.REPLIEDAT, label: __('按回复时间排序') },
        ],
        defaultMenu: {
            key: SortType.CREATED,
            sort: SortDirection.DESC,
        },
        defaultTableSort: { created_at: SortDirection.DESC },
        initSearch: {
            limit: 10,
            offset: 1,
            view: FeedbackView.Applier,
            sort: SortType.CREATED,
            direction: SortDirection.DESC,
        },
    },
}

// 展示值
export const showValue = ({ actualDetails }: { actualDetails: any }) => ({
    status: feedbackStatusMap[actualDetails?.status]?.text,
    feedback_type: <TypeView type={actualDetails?.feedback_type} />,
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
 * 反馈类型
 */
export const TypeView: React.FC<{
    type: string
}> = ({ type }) => {
    const [dict, getDict] = useDict()
    const [feedbackTypeOptions, setFeedbackTypeOptions] = useState<any[]>()

    useEffect(() => {
        const res = dict.find(
            (item) => item.dict_type === DataDictType.CatalogFeedbackType,
        )

        if (!res?.dict_item_resp) return

        const options = [
            ...res.dict_item_resp.map((item) => ({
                value: item.dict_key,
                label: item.dict_value,
            })),
        ]
        setFeedbackTypeOptions(options)
    }, [dict])

    const label =
        feedbackTypeOptions?.find((item) => item.value === type)?.label || '--'

    return type ? (
        <span className={styles.typeView} title={label}>
            {label}
        </span>
    ) : (
        '--'
    )
}

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
    value,
    subValue,
    onClick,
}: {
    value: string
    subValue: string
    onClick?: () => void
}) => {
    return (
        <div className={styles.multiColumnWrapper}>
            <div className={styles.titleWrapper}>
                <div
                    title={value}
                    className={styles.detailColumn}
                    onClick={onClick}
                >
                    {value}
                </div>
            </div>
            <div title={subValue} className={styles.columnSubTitle}>
                {subValue}
            </div>
        </div>
    )
}
