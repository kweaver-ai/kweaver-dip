import __ from './locale'

// 日期时间选择项
export const TimeDateOptions = [
    {
        label: __('年'),
        value: '%Y',
        dateType: 'year',
        formatRegx: 'YYYY',
    },
    {
        label: __('月'),
        value: '%Y-%m',
        dateType: 'month',
        formatRegx: 'YYYY-MM',
    },
    {
        label: __('周'),
        value: '%x-%v',
        dateType: 'week',
        formatRegx: 'YYYY-ww',
    },
    {
        label: __('日'),
        value: '%Y-%m-%d',
        dateType: 'day',
        formatRegx: 'YYYY-MM-DD',
    },
]
