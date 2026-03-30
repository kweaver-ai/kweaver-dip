import { formatTime } from '@/utils'
import __ from '../locale'

export const analysisFieldsConfig = [
    {
        key: 'name',
        label: __('分析结论'),
        span: 24,
    },
    {
        key: 'code',
        label: __('分析人'),
        span: 12,
    },
    {
        key: 'applier',
        label: __('分析人联系方式'),
        span: 12,
    },
    {
        key: 'conclusion',
        label: __('分析及确认结果'),
        span: 24,
    },
    {
        key: 'usage',
        label: __('数据用途'),
        span: 24,
    },
]

export const feedbackAduitFieldsConfig = [
    {
        key: 'name',
        label: __('申请名称'),
        span: 24,
    },
    {
        key: 'code',
        label: __('申请编码'),
        span: 24,
    },
    {
        key: 'apply_org_name',
        label: __('申请部门'),
        span: 24,
        title: 'apply_org_path',
    },
    {
        key: 'feedback_at',
        label: __('反馈时间'),
        span: 24,
        render: (val, record) =>
            record.feedback_at ? formatTime(record.feedback_at) : '--',
    },
    {
        key: 'feedback_content',
        label: __('反馈内容'),
        span: 24,
    },
    {
        key: 'detail',
        label: __('详情'),
        span: 24,
        render: (val, record) => (
            <div style={{ color: '#126EE3' }}>{__('查看全部')}</div>
        ),
    },
]
