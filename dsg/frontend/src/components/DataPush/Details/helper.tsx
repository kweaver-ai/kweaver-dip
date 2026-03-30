import { Tooltip } from 'antd'
import { InfoCircleOutlined } from '@ant-design/icons'
import __ from '../locale'
import { TagsView } from '../helper'
import { formatTime } from '@/utils'
import { dataSourceTypeKey, TransmitMode, transmitModeMap } from '../const'
import privacyExample from '@/assets/privacyExample.png'

/**
 * 基本信息
 */
export const basicInfo = [
    {
        key: 'name',
        label: __('数据推送名称'),
        value: '',
        span: 12,
    },
    {
        key: 'responsible_person_name',
        label: __('责任人'),
        value: '',
        span: 12,
    },
    {
        key: 'description',
        label: __('描述'),
        value: '',
        span: 24,
    },
]

/**
 * 源端信息
 */
export const sourceInfo = [
    {
        key: 'table_display_name',
        label: __('源端资源'),
        value: '',
        span: 12,
    },
    {
        key: 'encoding',
        label: __('资源编码'),
        value: '',
        span: 12,
    },
    {
        key: 'db_type',
        label: __('数据库类型'),
        value: '',
        span: 12,
    },
    {
        key: 'department_name',
        label: __('数据部门'),
        value: '',
        span: 12,
    },
    {
        key: 'catalog_name',
        label: __('所属目录'),
        value: '',
        span: 24,
    },
]

/**
 * 目标端信息
 */
export const targetInfo = [
    {
        key: 'target_datasource_name',
        label: __('数据源'),
        value: '',
        span: 12,
    },
    {
        key: 'db_type',
        label: __('数据库类型'),
        value: '',
        span: 12,
    },
    {
        key: 'department_name',
        label: __('所属组织架构'),
        value: '',
        span: 12,
    },
    {
        key: 'target_table_name',
        label: __('目标表'),
        value: '',
        span: 12,
        hidden: (record) =>
            dataSourceTypeKey?.[record?.source_type] === 'sandbox',
    },
    {
        key: 'sandbox_project_name',
        label: __('项目'),
        value: '',
        span: 12,
        hidden: (record) =>
            dataSourceTypeKey?.[record?.source_type] !== 'sandbox',
    },
    {
        key: 'sandbox_datasource_name',
        label: __('项目空间'),
        value: '',
        span: 12,
        hidden: (record) =>
            dataSourceTypeKey?.[record?.source_type] !== 'sandbox',
    },
    {
        key: 'target_table_name',
        label: __('数据集'),
        value: '',
        span: 12,
        hidden: (record) =>
            dataSourceTypeKey?.[record?.source_type] !== 'sandbox',
    },
]

/**
 * 推送机制
 */
export const pushMechanism = [
    {
        key: 'transmit_mode',
        label: __('推送类型'),
        value: '',
        span: 12,
        render: (value, record) => transmitModeMap[value]?.text || '--',
    },
    {
        key: 'increment_field',
        label: __('增量字段'),
        value: '',
        span: 12,
        hidden: (record) => record.transmit_mode === TransmitMode.Full,
    },
    {
        key: 'increment_timestamp',
        label: __('增量时间戳'),
        value: '',
        span: 12,
        hidden: (record) => record.transmit_mode === TransmitMode.Full,
        render: (value, record) => (value ? formatTime(value * 1000) : '--'),
    },
    {
        key: 'primary_key',
        label: __('主键'),
        value: '',
        span: 12,
        hidden: (record) => record.transmit_mode === TransmitMode.Full,
        render: (value, record) =>
            value ? TagsView({ data: value.split(',') }) : '--',
    },
]

/**
 * 更多信息
 */
export const moreInfo = [
    {
        key: 'creator_name',
        label: __('创建人'),
        value: '',
        span: 12,
    },
    {
        key: 'created_at',
        label: __('创建时间'),
        value: '',
        span: 12,
        render: (value, record) => (value ? formatTime(value) : '--'),
    },
    {
        key: 'updater_name',
        label: __('更新人'),
        value: '',
        span: 12,
    },
    {
        key: 'updated_at',
        label: __('更新时间'),
        value: '',
        span: 12,
        render: (value, record) => (value ? formatTime(value) : '--'),
    },
]

/**
 * 锚点
 */
export const anchorConfig = [
    {
        key: 'basicInfo',
        title: __('基本信息'),
    },
    {
        key: 'pushContent',
        title: __('推送内容'),
        children: [
            {
                key: 'sourceInfo',
                title: __('源端信息'),
            },
            {
                key: 'targetInfo',
                title: __('目标端信息'),
            },
            {
                key: 'pushField',
                title: __('推送字段'),
            },
            {
                key: 'filterCondition',
                title: __('过滤规则'),
            },
        ],
    },
    {
        key: 'pushStrategy',
        title: __('推送策略'),
        children: [
            {
                key: 'pushMechanism',
                title: __('推送机制'),
            },
            {
                key: 'schedulePlan',
                title: __('调度计划'),
            },
        ],
    },
]

/**
 * 隐私保护
 */
export const PrivacyProtectionTooltip = () => {
    return (
        <Tooltip
            title={
                <div>
                    <div>{__('隐私数据保护')}</div>
                    <div>
                        {__(
                            '1、隐私数据保护可以对隐私数据进行脱敏，开启后推送数据时，脱敏的数据会根据脱敏规则进行推送。',
                        )}
                    </div>
                    <div>{__('2、脱敏示例：')}</div>
                    <div>
                        <img height="56px" src={privacyExample} alt="" />
                    </div>
                </div>
            }
            color="#fff"
            overlayInnerStyle={{
                color: 'rgba(0,0,0,0.85)',
                whiteSpace: 'nowrap',
            }}
        >
            <InfoCircleOutlined />
        </Tooltip>
    )
}
