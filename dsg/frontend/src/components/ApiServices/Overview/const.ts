import { IInterfaceStatusStatistics } from '@/core/apis/dataApplicationService/index.d'
import __ from '../locale'

export const statusStatisticsFields = [
    {
        label: __('接口服务总数'),
        key: 'service_count',
        isDivider: false,
        itemHeight: 64,
        itemWidth: 200,
    },
    {
        label: __('未发布'),
        key: 'unpublished_count',
        isDivider: true,
        itemHeight: 64,
        itemWidth: 200,
    },
    {
        label: __('已发布'),
        key: 'published_count',
        isDivider: true,
        itemHeight: 64,
        itemWidth: 160,
    },
    {
        label: __('未上线'),
        key: 'notline_count',
        isDivider: false,
        itemHeight: 45,
        itemWidth: 77,
    },
    {
        label: __('已上线'),
        key: 'online_count',
        isDivider: true,
        itemHeight: 45,
        itemWidth: 77,
    },
    {
        label: __('已下线'),
        key: 'offline_count',
        isDivider: true,
        itemHeight: 45,
        itemWidth: 77,
    },
]

export const initInterfaceStatusStatistics: IInterfaceStatusStatistics = {
    total_statistics: {
        service_count: 0,
        unpublished_count: 0,
        published_count: 0,
        notline_count: 0,
        online_count: 0,
        offline_count: 0,
        af_data_application_publish_auditing_count: 0,
        af_data_application_publish_reject_count: 0,
        af_data_application_publish_pass_count: 0,
        af_data_application_online_auditing_count: 0,
        af_data_application_online_reject_count: 0,
        af_data_application_online_pass_count: 0,
        af_data_application_offline_auditing_count: 0,
        af_data_application_offline_reject_count: 0,
        af_data_application_offline_pass_count: 0,
    },
    generate_statistics: {
        service_count: 0,
        unpublished_count: 0,
        published_count: 0,
        notline_count: 0,
        online_count: 0,
        offline_count: 0,
    },
    register_statistics: {
        service_count: 0,
        unpublished_count: 0,
        published_count: 0,
        notline_count: 0,
        online_count: 0,
        offline_count: 0,
    },
}
