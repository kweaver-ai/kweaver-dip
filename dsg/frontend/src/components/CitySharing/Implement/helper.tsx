import __ from '../locale'

export const ApiImpConfig = [
    {
        title: __('资源信息'),
        key: 'catalog_info',
        configs: [
            {
                label: __('资源名称'),
                key: 'data_res_name',
                span: 12,
                value: '--',
            },
            {
                label: __('编码'),
                key: 'data_res_code',
                span: 12,
            },
            {
                label: __('所属目录'),
                key: 'res_name',
                span: 12,
            },
            {
                label: __('关联申请单'),
                key: 'apply_name',
                span: 12,
                value: '--',
            },
            {
                label: __('数据提供部门'),
                key: 'org_path',
                span: 12,
                value: '--',
            },
            {
                label: __('申请部门'),
                key: 'apply_org_path',
                span: 12,
                value: '--',
            },
            {
                label: __('申请人'),
                key: 'applier',
                span: 12,
                value: '--',
            },
            {
                label: __('申请人联系方式'),
                key: 'phone',
                span: 12,
                value: '--',
            },
            {
                label: __('分析人'),
                key: 'analyst',
                span: 12,
                value: '--',
            },
            {
                label: __('分析人联系方式'),
                key: 'analyst_phone',
                span: 12,
                value: '--',
            },
        ],
    },
    {
        title: __('资源使用配置'),
        key: 'catalog_config',
        configs: [
            {
                label: __('资源提供方式'),
                key: 'supply_type',
                span: 12,
                value: '',
            },
            {
                label: __('预计调用频率'),
                key: 'call_frequency',
                span: 12,
                value: '',
            },
            {
                label: __('资源使用期限'),
                key: 'available_date_type',
                span: 12,
                value: '',
            },
        ],
    },
    {
        title: __('接口调用配置'),
        key: 'api',
        configs: [
            {
                label: __('应用名称'),
                key: 'app_name',
                span: 24,
                value: '',
            },
            {
                label: __('服务地址'),
                key: 'service_path',
                span: 24,
                value: '',
            },
            {
                label: __('账户名称'),
                key: 'app_count_name',
                span: 24,
                value: '',
            },
            {
                label: __('账户ID'),
                key: 'app_count_id',
                span: 24,
                value: '',
            },
        ],
    },
]

/**
 * 转换数据类型
 * @param value
 * @returns
 */
export const changeDataType = (value: number) => {
    switch (value) {
        case 0:
            return 'int'
        case 1:
            return 'char'
        case 2:
            return 'date'
        case 3:
            return 'datetime'
        case 4:
            return 'timestamp'
        case 5:
            return 'bool'
        case 7:
            return 'float'
        case 8:
            return 'decimal'
        case 9:
            return 'time'
        default:
            return 'other'
    }
}
