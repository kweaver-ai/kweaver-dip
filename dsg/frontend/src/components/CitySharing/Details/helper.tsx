import { Tooltip } from 'antd'
import { formatTime, streamToFile } from '@/utils'
import {
    applyProcessMap,
    ApplyResource,
    applyResourceMap,
    applyTypeDatabaseMap,
    applyTypeInterfaceMap,
} from '../const'
import { ResourceItem, StatusView } from '../helper'
import __ from '../locale'
import styles from './styles.module.less'
import FileIcon from '@/components/FileIcon'
import { FontIcon } from '@/icons'
import {
    downloadDemandFileV2,
    downloadSSZDDemandFile,
    formatError,
} from '@/core'
import { shareTypeList, typeOptoins } from '@/components/ResourcesDir/const'
import { resourceUtilizationOptions } from '../Apply/helper'
import { analysisConclusionConfig } from '../Analysis/helper'

/**
 * 标签
 */
const TagsView = (props: { data?: string[] }) => {
    const { data = [] } = props
    return (
        <div className={styles.detailsGroup_tagsWrap}>
            {data.map((item, idx) => (
                <span key={idx} className={styles.tagItem}>
                    {item}
                </span>
            ))}
        </div>
    )
}

/**
 * 下载附件 UI
 */
export const DownloadFile = ({ data }: { data: any }) => {
    const download = async () => {
        if (!data?.id) return
        try {
            const res = await downloadDemandFileV2(data.id)
            streamToFile(res, data.name)
        } catch (error) {
            formatError(error)
        }
    }

    return data?.name ? (
        <div className={styles.detailsGroup_download}>
            <FileIcon
                suffix={data.name.substring(data.name.lastIndexOf('.') + 1)}
            />
            <div className={styles.text} title={data.name}>
                {data.name}
            </div>
            <Tooltip
                title={__('下载')}
                getPopupContainer={(n) => n}
                placement="right"
            >
                <FontIcon
                    name="icon-xiazai"
                    className={styles.detailsGroup_icon}
                    onClick={() => download()}
                />
            </Tooltip>
        </div>
    ) : (
        ''
    )
}

/**
 * 申请信息
 */
export const applyInfo = {
    key: 'applyInfo',
    title: __('申请信息'),
    content: [
        {
            key: 'name',
            label: __('申请名称'),
            value: '',
            span: 24,
        },
        {
            key: 'code',
            label: __('申请编码'),
            value: '',
            span: 12,
        },
        {
            key: 'status',
            label: __('申请进度'),
            value: '',
            span: 12,
            render: (value: string, record: any) =>
                value ? <StatusView record={record} /> : '--',
        },
        {
            key: 'created_at',
            label: __('申请时间'),
            value: '',
            span: 12,
            render: (value?: any) =>
                value ? formatTime(value, 'YYYY-MM-DD') : '--',
        },
        {
            key: 'finish_date',
            label: __('期望完成时间'),
            value: '',
            span: 12,
            render: (value?: any) =>
                value ? formatTime(value * 1000, 'YYYY-MM-DD') : '--',
        },
        {
            key: 'matters',
            label: __('关联业务事项'),
            value: '',
            span: 12,
        },
        {
            key: 'scene',
            label: __('业务应用场景'),
            value: '',
            span: 12,
        },
        {
            key: 'app_name',
            label: __('关联应用系统'),
            value: '',
            span: 12,
        },
        {
            key: 'app_id',
            label: __('应用passid'),
            value: '',
            span: 12,
        },
        {
            key: 'areas',
            label: __('业务应用领域'),
            value: '',
            span: 12,
            // render: (value?: string[], record?: any, dict?: any) => {
            //     const cityAreaDict = dict?.find(
            //         (d) => d.dict_type === 'city-area',
            //     )?.dict_item_resp
            //     return value?.length ? (
            //         <TagsView
            //             data={value.map(
            //                 (item) =>
            //                     cityAreaDict?.find((d) => d.dict_key === item)
            //                         ?.dict_value,
            //             )}
            //         />
            //     ) : (
            //         '--'
            //     )
            // },
        },
        {
            key: 'business_usage',
            label: __('业务用途'),
            value: '',
            span: 24,
        },
        {
            key: 'expect_effect',
            label: __('预期应用成效'),
            value: '',
            span: 24,
        },
        {
            key: 'attachment',
            label: __('申请函件'),
            value: '',
            span: 24,
            render: (_, record: any) => {
                return record?.attachment_id ? (
                    <DownloadFile
                        data={{
                            id: record.attachment_id,
                            name: record.attachment_name,
                        }}
                    />
                ) : (
                    '--'
                )
            },
        },
    ],
}

/**
 * 部门信息
 */
export const departmentInfo = {
    key: 'departmentInfo',
    title: __('部门信息'),
    content: [
        {
            key: 'apply_org_name',
            label: __('申请部门'),
            value: '',
            span: 24,
        },
        {
            key: 'applier',
            label: __('申请联系人'),
            value: '',
            span: 12,
        },
        {
            key: 'phone',
            label: __('联系电话'),
            value: '',
            span: 12,
        },
        {
            key: 'firm_name',
            label: __('技术厂商名称'),
            value: '',
            span: 12,
        },
        {
            key: 'firm_contact',
            label: __('技术厂商联系人'),
            value: '',
            span: 12,
        },
        {
            key: 'firm_contact_phone',
            label: __('厂商联系人电话'),
            value: '',
            span: 12,
        },
    ],
}

export const analysisFieldsConfig = [
    {
        key: 'feasibility',
        label: __('分析结论'),
        value: '',
        span: 24,
        render: (val, record) =>
            analysisConclusionConfig.find(
                (item) => item.value === record.feasibility,
            )?.label,
    },
    {
        key: 'analyst',
        label: __('分析人'),
        value: '',
        span: 12,
    },
    {
        key: 'analyst_phone',
        label: __('分析人联系方式'),
        value: '',
    },
    {
        key: 'conclusion',
        label: __('分析及确认结果'),
        value: '',
        span: 24,
    },
    {
        key: 'usage',
        label: __('数据用途'),
        value: '',
        span: 24,
    },
]

/**
 * 分析结论
 */
export const analysisInfo = {
    key: 'analysisInfo',
    title: __('分析结论'),
    content: analysisFieldsConfig,
}

export const feedbackInfo = {
    key: 'feedbackInfo',
    title: __('成效反馈'),
    content: [
        {
            key: 'feedback_content',
            label: __('服务成效'),
            value: '',
            span: 24,
        },
    ],
}

/**
 * 申请目录
 */
export const applyCatalogInfo = {
    key: 'applyCatalogInfo',
    title: __('申请资源清单'),
    content: [],
}

/**
 * 数据目录信息
 */
export const dataCatalogInfo = {
    key: 'dataCatalogInfo',
    subTitle: __('资源信息'),
    content: [
        {
            key: 'res_name',
            label: __('目录名称'),
            value: '',
            span: 12,
        },
        {
            key: 'org_path',
            label: __('所属部门'),
            value: '',
            span: 12,
        },
    ],
}

/**
 * 资源使用配置
 */
export const resourceUsageConfig = {
    key: 'resourceUsageConfig',
    subTitle: __('资源使用配置'),
    content: [
        {
            key: 'resource_provision_method',
            label: __('资源提供方式'),
            value: '',
            span: 12,
            render: (value) => (value ? applyResourceMap[value]?.text : '--'),
        },
        {
            key: 'data_resource_name',
            label: __('数据资源名称'),
            value: '',
            span: 12,
            render: (_, record) => (
                <ResourceItem
                    resoure={{
                        resource_name: record.data_resource_name,
                        resource_type: record.data_resource_type,
                    }}
                />
            ),
        },
        {
            key: 'application_type',
            label: __('申请类型'),
            value: '',
            span: 12,
            render: (value, record) =>
                value
                    ? record.resource_provision_method ===
                      ApplyResource.Database
                        ? applyTypeDatabaseMap[value]?.text
                        : applyTypeInterfaceMap[value]?.text
                    : '--',
        },
        {
            key: 'data_range',
            label: __('数据范围'),
            value: '',
            span: 12,
            render: (value) => value || '--',
        },
        {
            key: 'time_range',
            label: __('时间范围'),
            value: '',
            span: 12,
            render: (_, record) =>
                record?.start_time
                    ? `${formatTime(
                          record.start_time * 1000,
                          'YYYY-MM-DD',
                      )} - ${
                          record.end_time
                              ? formatTime(record.end_time * 1000, 'YYYY-MM-DD')
                              : '--'
                      }`
                    : '--',
        },
        // 库表交换独有
        {
            key: 'expected_update_frequency',
            label: __('期望更新频率'),
            value: '',
            span: 12,
            render: (value) => value || '--',
        },
        // 接口对接独有
        {
            key: 'expected_call_frequency',
            label: __('期望调用频率'),
            value: '',
            span: 12,
            render: (value) => `${value || '--'} ${__('次/分钟')}`,
        },
        {
            key: 'deadline_for_resource_utilization',
            label: __('资源使用期限'),
            value: '',
            span: 12,
            render: (value) =>
                value ? formatTime(value * 1000, 'YYYY-MM-DD') : '--',
        },
    ],
}

/**
 * 数据库设计材料佐证
 */
export const databaseDesignMaterial = {
    key: 'databaseDesignMaterial',
    subTitle: __('数据库设计材料佐证'),
    content: [],
}

export enum ResourceDetailsFieldType {
    Link = 'link',
    TimeRange = 'time_range',
    Table = 'table',
    Other = 'other',
}

export const resourceDetailsFields = [
    {
        title: __('资源名称'),
        fields: [
            {
                key: ['res_name'],
                label: __('资源名称'),
                span: 12,
                type: ResourceDetailsFieldType.Link,
            },
            {
                key: ['res_code'],
                label: __('编码'),
                span: 12,
            },
            {
                key: 'org_path',
                label: __('所属部门'),
                span: 12,
                titleKey: 'org_path',
            },
            {
                key: 'share_condition',
                label: __('共享条件'),
                span: 12,
            },
        ],
    },
    {
        title: __('资源使用配置'),
        fields: [
            {
                key: ['apply_conf', 'supply_type'],
                label: __('资源提供方式'),
                span: 12,
                render: (value: ApplyResource) =>
                    value ? applyResourceMap[value]?.text : '--',
            },
            {
                key: ['apply_conf', 'view_apply_conf', 'data_res_name'],
                label: __('选择数据资源名称'),
                span: 12,
            },
            {
                key: ['apply_conf', 'view_apply_conf', 'area_range'],
                label: __('期望空间范围'),
                span: 12,
            },
            {
                key: ['apply_conf', 'view_apply_conf', 'time_range'],
                label: __('期望时间范围'),
                span: 12,
                type: ResourceDetailsFieldType.TimeRange,
            },
            {
                key: ['apply_conf', 'view_apply_conf', 'push_frequency'],
                label: __('期望推送频率'),
                span: 12,
            },
            {
                key: ['apply_conf', 'available_date_type'],
                label: __('资源使用期限'),
                span: 12,
                render: (val: number) =>
                    val || val === 0
                        ? resourceUtilizationOptions.find(
                              (item) => item.value === val,
                          )?.label
                        : '--',
            },
        ],
    },
    {
        title: __('数据推送配置'),
        fields: [
            {
                key: ['apply_conf', 'view_apply_conf', 'new_dst_data_source'],
                label: __('目标数据来源'),
                span: 24,
                render: (value: boolean) =>
                    value ? __('新增数据源') : __('已有数据源'),
            },
            {
                key: 'name',
                label: __('数据源名称'),
                span: 12,
                type: ResourceDetailsFieldType.Other,
            },
            {
                key: 'database_name',
                label: __('数据库名称'),
                span: 12,
                type: ResourceDetailsFieldType.Other,
            },
            {
                key: 'type',
                label: __('数据库类型'),
                span: 12,
                type: ResourceDetailsFieldType.Other,
            },
            {
                key: 'username',
                label: __('用户名'),
                span: 12,
                type: ResourceDetailsFieldType.Other,
            },
            {
                key: 'port',
                label: __('端口'),
                span: 12,
                type: ResourceDetailsFieldType.Other,
            },
            {
                key: 'host',
                label: __('连接地址'),
                span: 24,
                type: ResourceDetailsFieldType.Other,
            },
            {
                key: ['apply_conf', 'view_apply_conf', 'push_type'],
                label: __('推送机制'),
                span: 24,
                render: (val: string) =>
                    val === 'full' ? __('全量') : __('增量'),
            },
            {
                key: ['push_fields'],
                label: __('推送字段'),
                span: 24,
                type: ResourceDetailsFieldType.Table,
                columns: [
                    {
                        title: __('信息项中文名称'),
                        dataIndex: 'business_name',
                    },
                    {
                        title: __('共享属性'),
                        key: 'shared_type',
                        ellipsis: true,
                        render: (item) => {
                            const type =
                                shareTypeList.find(
                                    (it) => it.value === item.shared_type,
                                )?.label || '--'
                            const condition = item.shared_condition
                                ? `（${item.shared_condition}）`
                                : ''
                            const title = `${type}${condition}`
                            return title
                        },
                    },
                    {
                        title: __('源表字段名称'),
                        dataIndex: 'source_table_field_name',
                    },
                    {
                        title: __('源表数据类型'),
                        dataIndex: 'data_type',
                        key: 'data_type',
                        render: (text) => {
                            const val =
                                typeOptoins.find((item) => item.value === text)
                                    ?.label || ''
                            return <span title={val}>{val || '--'}</span>
                        },
                    },
                ],
            },
        ],
    },
]

export interface IFieldConfig {
    key: string
    label: string
    span: number
    title?: string
    render?: (va: any, record: any) => any
}
export const applyFieldsConfig: IFieldConfig[] = [
    {
        key: 'name',
        label: __('申请名称'),
        span: 12,
    },
    {
        key: 'code',
        label: __('申请编码'),
        span: 12,
    },
    {
        key: 'applier',
        label: __('申请人'),
        span: 12,
    },
    {
        key: 'apply_org_name',
        label: __('申请部门'),
        span: 12,
        title: 'apply_org_path',
    },
    {
        key: 'created_at',
        label: __('申请时间'),
        span: 12,
        render: (val, record) =>
            record.created_at ? formatTime(record.created_at) : '--',
    },
    {
        key: 'finish_date',
        label: __('期望完成时间'),
        span: 12,
        render: (val, record) =>
            record.finish_date
                ? formatTime(record.finish_date * 1000, 'YYYY-MM-DD')
                : '--',
    },
    {
        key: 'business_usage',
        label: __('业务用途'),
        span: 24,
    },
    {
        key: 'expect_effect',
        label: __('预期应用成效'),
        span: 24,
    },
    {
        key: 'attachment',
        label: __('申请函件'),
        span: 24,
        render: (val, record: any) => {
            return record?.attachment_id ? (
                <DownloadFile
                    data={{
                        id: record.attachment_id,
                        name: record.attachment_name,
                    }}
                />
            ) : (
                '--'
            )
        },
    },
]

export const catalogInfoConfig: IFieldConfig[] = [
    {
        key: 'res_name',
        label: __('目录名称'),
        span: 12,
    },
    {
        key: 'org_path',
        label: __('所属部门'),
        span: 12,
    },
]

export const apiInfoConfig: IFieldConfig[] = [
    {
        key: 'res_name',
        label: __('资源名称'),
        span: 12,
        render: (val) => (
            <div className={styles['res-name-container']}>
                <div className={styles['res-name']}>{val}</div>
                <div className={styles['api-flag']}>{__('注册接口')}</div>
            </div>
        ),
    },
    {
        key: 'org_path',
        label: __('所属部门'),
        span: 12,
    },
]
