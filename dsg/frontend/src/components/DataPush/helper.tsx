import { ModalFuncProps, Popover, Tooltip } from 'antd'
import React from 'react'

import {
    CloseCircleFilled,
    ExclamationCircleFilled,
    InfoCircleOutlined,
} from '@ant-design/icons'
import dataEmpty from '@/assets/dataEmpty.svg'
import { SearchType as SearchLayoutType } from '@/components/SearchLayout/const'
import { SortDirection } from '@/core'
import { Empty, Loader } from '@/ui'
import { SearchType } from '@/ui/LightweightSearch/const'
import { confirm } from '@/utils/modalHelper'
import { typeOptoins } from '../ResourcesDir/const'
import {
    auditTypeMap,
    dataPushStatusMap,
    dataPushStatusOptions,
    DataPushTab,
    executeTypeOptions,
    jobStatusMap,
    jobStatusOptions,
    ScheduleType,
    scheduleTypeMap,
} from './const'
import DetailsGroup from './Details/DetailsGroup'
import __ from './locale'
import OriginSelectComponent from './OrgSelectTree/OriginSelectComponent'
import styles from './styles.module.less'

export const dataPushTabMap = {
    [DataPushTab.Overview]: {
        // 表格列名
        columnKeys: [
            // 数据推送名称/描述
            'name_desc',
            // 状态
            'push_status',
            // 责任人
            'responsible_person_name',
            // 调度类型
            'schedule_type',
            // 作业时间
            'job_time',
            // 创建时间
            'created_at',
            'action',
        ],
        tableWidth: 1200,
        // 操作项映射
        actionMap: dataPushStatusMap,
        actionKey: 'push_status',
        // 操作栏宽度
        actionWidth: 150,
        // 排序菜单
        sortMenus: undefined,
        // 默认菜单排序
        defaultMenu: undefined,
        // 默认表头排序
        defaultTableSort: undefined,
        // 筛选菜单
        searchFormData: [
            {
                label: __('数据提供部门'),
                key: 'source_department_id',
                options: [],
                type: SearchType.Customer,
                Component: OriginSelectComponent as React.ComponentType<{
                    value?: any
                    onChange: (value: any) => void
                }>,
            },
            {
                label: __('目标部门'),
                key: 'dest_department_id',
                options: [],
                type: SearchType.Customer,
                Component: OriginSelectComponent as React.ComponentType<{
                    value?: any
                    onChange: (value: any) => void
                }>,
            },
        ],
        defaultSearch: {
            source_department_id: 'not-select',
            dest_department_id: 'not-select',
        },
        searchPlaceholder: '',
        refresh: false,
    },
    [DataPushTab.Manage]: {
        // 表格列名
        columnKeys: [
            // 数据推送名称/描述
            'name_desc',
            // 状态
            'push_status',
            // 责任人
            'responsible_person_name',
            // 调度类型
            'schedule_type',
            // 作业时间
            'job_time',
            // 创建时间
            'created_at',
            'action',
        ],
        rowKey: 'id',
        tableWidth: 1500,
        tableHeight: 267,
        // 操作项映射
        actionMap: dataPushStatusMap,
        // 操作栏宽度
        actionWidth: 276,
        // 排序菜单
        sortMenus: [{ key: 'created_at', label: __('按照创建时间排序') }],
        // 默认菜单排序
        defaultMenu: {
            key: 'created_at',
            sort: SortDirection.DESC,
        },
        // 默认表头排序
        defaultTableSort: { created_at: 'descend' },
        // 筛选菜单
        searchFormData: [
            {
                label: __('状态'),
                key: 'status',
                options: dataPushStatusOptions,
                type: SearchType.Checkbox,
            },
            {
                label: __('创建时间'),
                key: 'created_at',
                type: SearchType.RangePicker,
                options: [],
            },
        ],
        defaultSearch: { status: undefined, created_at: null },
        searchPlaceholder: __('搜索数据推送名称'),
        refresh: true,
    },
    [DataPushTab.Monitor]: {
        columnKeys: [
            // 所属数据推送
            'data_push_name',
            // 状态
            'job_status',
            // 执行方式
            'sync_method',
            // 耗时
            'sync_time',
            // 请求时间
            'start_time',
            // 完成时间
            'end_time',
            // 推送总数
            'sync_count',
            // 推送成功数
            'sync_success_count',
            'action',
        ],
        rowKey: 'id',
        tableWidth: 1000,
        tableHeight: 229,
        actionMap: jobStatusMap,
        actionKey: 'status',
        actionWidth: 80,
        sortMenus: [{ key: 'created_at', label: __('按照创建时间排序') }],
        defaultMenu: {
            key: 'created_at',
            sort: SortDirection.DESC,
        },
        defaultTableSort: undefined,
        searchLayoutFormData: [
            {
                label: __('数据推送名称'),
                key: 'keyword',
                type: SearchLayoutType.Input,
                isAlone: true,
            },
            {
                label: __('创建时间'),
                key: 'created_at',
                type: SearchLayoutType.RangePicker,
                itemProps: {
                    format: 'YYYY-MM-DD',
                },
                startTime: 'start_time',
                endTime: 'end_time',
            },
            {
                label: __('数据提供部门'),
                key: 'source_department_id',
                type: SearchLayoutType.DepartmentAndOrgSelect,
                itemProps: {
                    allowClear: true,
                    unCategorizedObj: {
                        id: '00000000-0000-0000-0000-000000000000',
                        name: __('未分类'),
                    },
                },
            },
            {
                label: __('目标数据部门'),
                key: 'dest_department_id',
                type: SearchLayoutType.DepartmentAndOrgSelect,
                itemProps: {
                    allowClear: true,
                    unCategorizedObj: {
                        id: '00000000-0000-0000-0000-000000000000',
                        name: __('未分类'),
                    },
                },
            },
        ],
        defaultSearch: undefined,
        searchPlaceholder: '',
        refresh: false,
    },
    [DataPushTab.MonitorSingle]: {
        tableWidth: 1000,
        actionMap: jobStatusMap,
        actionKey: 'status',
        actionWidth: 80,
        sortMenus: [{ key: 'start_time', label: __('按照请求时间排序') }],
        defaultMenu: {
            key: 'start_time',
            sort: SortDirection.DESC,
        },
        defaultTableSort: { start_time: 'descend' },
        searchFormData: [
            {
                label: __('执行方式'),
                key: 'scheduleExecute',
                options: executeTypeOptions,
                type: SearchType.Radio,
            },
            {
                label: __('状态'),
                key: 'status',
                options: jobStatusOptions,
                type: SearchType.Radio,
            },
        ],
        defaultSearch: { scheduleExecute: '', status: '' },
        searchPlaceholder: '',
        refresh: true,
    },
    [DataPushTab.Audit]: {
        columnKeys: [
            // 申请编号
            'apply_code',
            // 数据推送名称
            'name',
            // 类型
            'audit_operation',
            // 申请人
            'applier_name',
            // 申请时间
            'apply_time',
            'action',
        ],
        rowKey: 'proc_inst_id',
        tableWidth: 1000,
        tableHeight: 229,
        actionMap: auditTypeMap,
        actionKey: 'audit_operation',
        actionWidth: 80,
        refresh: true,
    },
}

/**
 * 带点状态 view
 */
export const StatusDot: React.FC<{
    data?: { text: string; color: string }
    tip?: string
}> = ({ data, tip }) => {
    return (
        <div className={styles.statusDot}>
            <div
                className={styles.dot}
                style={{ background: data?.color || 'transparent' }}
            />
            <span className={styles.text}>{data?.text || '--'}</span>
            {tip && (
                <Tooltip title={tip}>
                    <InfoCircleOutlined className={styles.infoIcon} />
                </Tooltip>
            )}
        </div>
    )
}

/**
 * 带背景状态 view
 */
export const StatusView: React.FC<{
    data?: { text: string; color: string; background: string }
    tip?: string
}> = ({ data, tip }) => {
    return (
        <div
            className={styles.statusView}
            style={{
                background: data?.background || 'transparent',
                color: data?.color || 'rgb(0 0 0 / 85%)',
            }}
        >
            <span className={styles.text}>{data?.text}</span>
            {tip && (
                <Popover
                    content={
                        <div style={{ maxWidth: 320 }}>
                            <div style={{ marginBottom: 8, fontWeight: 550 }}>
                                <CloseCircleFilled
                                    style={{ color: '#FF4D4F', marginRight: 8 }}
                                />
                                {data?.text}
                            </div>
                            {tip}
                        </div>
                    }
                >
                    <InfoCircleOutlined
                        className={styles.infoIcon}
                        style={{ color: data?.color }}
                    />
                </Popover>
            )}
        </div>
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

interface IGroupHeader extends React.HTMLAttributes<HTMLDivElement> {
    text?: string
}
/**
 * 分组头 view
 */
export const GroupHeader: React.FC<IGroupHeader> = ({ text, ...prop }) => {
    return (
        <div className={styles.groupHeader} {...prop}>
            <div className={styles.line} />
            <div className={styles.title}>{text}</div>
        </div>
    )
}

/**
 * 分组子标题 view
 */
export const GroupSubHeader: React.FC<IGroupHeader> = ({ text, ...prop }) => {
    return (
        <div className={styles.groupSubHeader} {...prop}>
            <div className={styles.title}>{text}</div>
        </div>
    )
}

/**
 * 空数据
 */
export const renderEmpty = (
    marginTop: number = 36,
    iconHeight: number = 144,
    desc: any = __('暂无数据'),
) => (
    <Empty
        iconSrc={dataEmpty}
        desc={desc || __('暂无数据')}
        style={{ marginTop, width: '100%' }}
        iconHeight={iconHeight}
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

/**
 * 调度计划
 */
export const schedulePlan = [
    {
        key: 'schedule_type',
        label: __('调度类型'),
        value: '',
        span: 12,
        render: (value, record) => scheduleTypeMap[value]?.text || '--',
    },
    {
        key: 'plan_date',
        label: __('计划日期'),
        value: '',
        span: 12,
        hidden: (record) => record.schedule_type !== ScheduleType.Periodic,
        render: (value, record) => {
            return (
                <span>
                    {record.schedule_start || '--'}
                    <span className={styles.arrow}> ⇀ </span>
                    {record.schedule_end || '--'}
                </span>
            )
        },
    },
    {
        key: 'schedule_time',
        label: __('指定时间'),
        value: '',
        span: 12,
        hidden: (record) => record.schedule_type === ScheduleType.Periodic,
        render: (value, record) => value || __('立即执行'),
    },
    {
        key: 'crontab_expr',
        label: __('调度规则'),
        value: '',
        span: 12,
        hidden: (record) => record.schedule_type !== ScheduleType.Periodic,
    },
]

/**
 * 调度计划
 */
export const schedulePlanPopover = (planData: any) => {
    return (
        <div className={styles.schedulePlanTip}>
            <DetailsGroup
                config={schedulePlan.slice(1).map((item) => ({
                    ...item,
                    span: 24,
                }))}
                data={planData}
                labelWidth="100px"
            />
        </div>
    )
}

/**
 * 获取数据类型信息
 */
export const getDataType = (type: number) => {
    return typeOptoins.find((item) => item.value === type)
}

export const getDataTypeByStr = (type: string) => {
    return typeOptoins.find((item) => item.strValue === type)
}

/**
 * 日志时长转换
 * @param times
 */
export const formatTotalTime = (times: number) => {
    const allSecond = times / 1000
    const currentTimes = {
        hours: Math.floor(allSecond / 3600),
        minutes: Math.floor(allSecond / 60) % 60,
        seconds: allSecond % 60,
    }
    switch (true) {
        case !!currentTimes.hours:
            return `${currentTimes.hours}${__('小时')}${
                currentTimes.minutes
            }${__('分')}${currentTimes.seconds}${__('秒')}`
        case !!currentTimes.minutes:
            return `${currentTimes.minutes}${__('分')}${
                currentTimes.seconds
            }${__('秒')}`
        case !!currentTimes.seconds:
            return `${currentTimes.seconds}${__('秒')}`
        default:
            return `0${__('秒')}`
    }
}

/**
 * 日志时长转换
 * @param times XXhXXmXXs
 */
export const formatWfTotalTime = (times: string) => {
    return times
        .replace('h', __('小时'))
        .replace('m', __('分'))
        .replace('s', __('秒'))
}
