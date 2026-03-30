import { SearchType as SearchTypeLayout } from '@/components/SearchLayout/const'
import { MonitoringStatus } from '@/core/apis/dataApplicationService/index.d'
import __ from '../locale'
import { IformItem, SearchType as ST } from '@/ui/LightweightSearch/const'

export interface IFieldConfig {
    key: string
    label: string
    span: number
    title?: string
    render?: (va: any, record: any) => any
}
export const AppBasicInfoFieldsConfig: IFieldConfig[] = [
    {
        key: 'name',
        label: __('应用名称'),
        span: 12,
    },
    {
        key: 'org_path',
        label: __('所属部门'),
        span: 12,
    },
    {
        key: 'info_system',
        label: __('信息系统'),
        span: 24,
    },
    {
        key: 'description',
        label: __('应用描述'),
        span: 24,
    },
]

export const AppCallInfoFieldsConfig: IFieldConfig[] = [
    {
        key: 'pass_id',
        label: 'PassID',
        span: 12,
    },
    {
        key: 'token',
        label: 'Token',
        span: 12,
    },
    {
        key: 'ip',
        label: 'IP',
        span: 24,
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

export const lightweightSearchData: IformItem[] = [
    {
        label: __('状态'),
        key: 'status',
        options: statusOptions,
        type: ST.Radio,
    },
    {
        label: __('调用时间'),
        key: 'call_time',
        type: ST.RangePicker,
        options: [],
    },
]

// 筛选项
export const callLogSearchFormInitData = [
    {
        label: __('状态'),
        key: 'status',
        type: SearchTypeLayout.Select,
        itemProps: {
            options: statusOptions,
            fieldNames: { label: 'label', value: 'value' },
            showSearch: false,
        },
    },
    // {
    //     label: __('服务名称'),
    //     key: 'keyword',
    //     type: SearchTypeLayout.Input,
    //     isAlone: true,
    //     itemProps: {
    //         placeholder: __('搜索服务名称'),
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
    {
        label: __('调用部门'),
        key: 'call_department_id',
        type: SearchTypeLayout.DepartmentAndOrgSelect,
        itemProps: {
            allowClear: true,
            unCategorizedObj: {
                id: '00000000-0000-0000-0000-000000000000',
                name: __('未分类'),
            },
        },
    },
    {
        label: __('调用系统'),
        key: 'call_system_id',
        type: SearchTypeLayout.Select,
        itemProps: {
            options: [],
            fieldNames: { label: 'name', value: 'id' },
            showSearch: false,
        },
    },
    {
        label: __('调用应用'),
        key: 'call_app_id',
        type: SearchTypeLayout.Select,
        itemProps: {
            options: [],
            fieldNames: { label: 'name', value: 'id' },
            showSearch: false,
        },
    },
]
