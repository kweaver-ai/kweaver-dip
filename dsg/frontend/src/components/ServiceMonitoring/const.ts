import { SortDirection } from '@/core'
import { MonitoringStatus } from '@/core/apis/dataApplicationService/index.d'
import { SearchType as SearchTypeLayout } from '@/components/SearchLayout/const'
import __ from './locale'

export enum TabMode {
    // 日志监控
    Log = 'log',
    // 错误监控
    Error = 'error',
}

// 初始化搜索条件
export const initSearch = {
    limit: 10,
    offset: 1,
    sort: 'call_time',
    direction: 'desc',
}

// 默认排序菜单
export const defaultMenu = {
    key: 'call_time',
    sort: SortDirection.DESC,
}

// 排序菜单
export const sortMenus = [
    {
        key: 'call_time',
        label: __('按调用时间排序'),
    },
]

// 状态映射
export const statusMap = {
    [MonitoringStatus.Success]: {
        text: __('成功'),
        color: 'rgba(82, 196, 27, 1)',
    },
    [MonitoringStatus.Fail]: {
        text: __('失败'),
        color: 'rgba(255, 77, 79, 1)',
    },
}

// 状态筛选项
export const statusOptions = [
    {
        value: MonitoringStatus.Success,
        label: statusMap[MonitoringStatus.Success].text,
    },
    {
        value: MonitoringStatus.Fail,
        label: statusMap[MonitoringStatus.Fail].text,
    },
]

// 筛选项
export const searchFormInitData = [
    {
        label: __('服务名称'),
        key: 'keyword',
        type: SearchTypeLayout.Input,
        isAlone: true,
        itemProps: {
            placeholder: __('搜索服务名称'),
        },
    },
    {
        label: __('服务所属部门'),
        key: 'service_department_id',
        type: SearchTypeLayout.DepartmentAndOrgSelect,
        itemProps: {
            allowClear: true,
            unCategorizedObj: {
                id: '00000000-0000-0000-0000-000000000000',
                name: __('未分类'),
            },
        },
    },
    // {
    //     label: __('调用部门'),
    //     key: 'call_department_id',
    //     type: SearchTypeLayout.DepartmentAndOrgSelect,
    //     itemProps: {
    //         allowClear: true,
    //         unCategorizedObj: {
    //             id: '00000000-0000-0000-0000-000000000000',
    //             name: __('未分类'),
    //         },
    //     },
    // },
    // {
    //     label: __('状态'),
    //     key: 'status',
    //     type: SearchTypeLayout.Select,
    //     itemProps: {
    //         options: statusOptions,
    //         fieldNames: { label: 'label', value: 'value' },
    //         showSearch: false,
    //     },
    // },
    {
        label: __('调用时间'),
        key: 'call_time',
        type: SearchTypeLayout.RangePicker,
        itemProps: {
            format: 'YYYY-MM-DD',
        },
        startTime: 'start_time',
        endTime: 'end_time',
    },
    // {
    //     label: __('调用系统'),
    //     key: 'call_system_id',
    //     type: SearchTypeLayout.Select,
    //     itemProps: {
    //         options: [],
    //         fieldNames: { label: 'name', value: 'id' },
    //         showSearch: false,
    //     },
    // },
    {
        label: __('应用账户'),
        key: 'call_app_id',
        type: SearchTypeLayout.Select,
        itemProps: {
            options: [],
            fieldNames: { label: 'name', value: 'id' },
            showSearch: false,
        },
    },
]
