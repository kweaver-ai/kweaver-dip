import __ from './locale'
/** 归集方式 */
export const CollectionMethod = [
    {
        key: 'Full',
        label: __('全量'),
        value: 'Full',
    },
    {
        key: 'Increment',
        label: __('增量'),
        value: 'Increment',
    },
]
/** 同步频率 */
export const SyncFrequency = [
    {
        key: 'PerMinute',
        label: __('每分钟'),
        value: 'PerMinute',
    },
    {
        key: 'PerHour',
        label: __('每小时'),
        value: 'PerHour',
    },
    {
        key: 'PerDay',
        label: __('每天'),
        value: 'PerDay',
    },
    {
        key: 'PerWeek',
        label: __('每周'),
        value: 'PerWeek',
    },
    {
        key: 'PerMonth',
        label: __('每月'),
        value: 'PerMonth',
    },
    {
        key: 'PerYear',
        label: __('每年'),
        value: 'PerYear',
    },
]
