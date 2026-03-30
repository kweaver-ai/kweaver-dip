import { formatTime } from '@/utils'
import { auditTypeMap } from '../const'
import __ from '../locale'

export const basicInfo = {
    key: 'basicInfo',
    title: __('基本信息'),
    content: [
        {
            key: 'name',
            label: __('数据推送名称'),
            value: '',
            span: 24,
        },
        {
            key: 'audit_operation',
            label: __('类型'),
            value: '',
            span: 24,
            render: (value, record) => auditTypeMap[value]?.text || '--',
        },
        {
            key: 'apply_time',
            label: __('申请时间'),
            value: '',
            span: 24,
            render: (value, record) => (value ? formatTime(value) : '--'),
        },
        {
            key: 'show_all',
            label: __('详情'),
            value: '',
            span: 24,
        },
    ],
}
