import { Button } from 'antd'
import moment from 'moment'
import { SearchType } from '@/components/SearchLayout/const'
import { ISSZDReportAuditStatus, ISSZDReportRecordType } from '@/core'
import {
    auditLevel,
    auditOperationList,
    auditStatusList,
    initSearchCondition,
    resourceTypeList,
    statusList,
    UnLimitType,
} from './const'
import __ from './locale'
import styles from './styles.module.less'

/** 搜索筛选项 */
export const startSearchFilter = [
    {
        label: __('目录名称、目录编码'),
        key: 'keyword',
        type: SearchType.Input,
        defaultValue: initSearchCondition.keyword,
        isAlone: true,
    },
    {
        label: __('资源类型'),
        key: 'resource_type',
        type: SearchType.Select,
        itemProps: {
            options: [...UnLimitType, ...resourceTypeList],
        },
    },
    {
        label: __('数据提供方'),
        key: 'org_code',
        type: SearchType.Input,
        defaultValue: initSearchCondition.org_code,
    },
    {
        label: __('审核状态'),
        key: 'audit_status',
        type: SearchType.Select,
        itemProps: {
            options: [...UnLimitType, ...auditStatusList].filter(
                (o) => o.value !== ISSZDReportAuditStatus.Pass,
            ),
        },
    },
]

export const reportSearchFilter = [
    {
        label: __('目录名称、目录编码'),
        key: 'keyword',
        type: SearchType.Input,
        defaultValue: initSearchCondition.keyword,
        isAlone: true,
    },
    {
        label: __('资源类型'),
        key: 'resource_type',
        type: SearchType.Select,
        itemProps: {
            options: [...UnLimitType, ...resourceTypeList],
        },
    },
    {
        label: __('数据提供方'),
        key: 'org_code',
        type: SearchType.Input,
        defaultValue: initSearchCondition.org_code,
    },
    {
        label: __('上线状态'),
        key: 'status',
        type: SearchType.Select,
        itemProps: {
            options: [...UnLimitType, ...statusList],
        },
    },
    {
        label: __('审核状态'),
        key: 'audit_status',
        type: SearchType.Select,
        itemProps: {
            options: [...UnLimitType, ...auditStatusList],
        },
    },
]

export const recordSearchFilter = [
    {
        label: __('目录名称、目录编码'),
        key: 'keyword',
        type: SearchType.Input,
        defaultValue: initSearchCondition.keyword,
        isAlone: true,
    },
    {
        label: __('资源类型'),
        key: 'resource_type',
        type: SearchType.Select,
        itemProps: {
            options: [...UnLimitType, ...resourceTypeList],
        },
    },
    {
        label: __('数据提供方'),
        key: 'org_code',
        type: SearchType.Input,
        defaultValue: initSearchCondition.org_code,
    },
    {
        label: __('上报类型'),
        key: 'audit_operation',
        type: SearchType.Select,
        itemProps: {
            options: [...UnLimitType, ...auditOperationList],
        },
    },
    {
        label: __('审核状态'),
        key: 'audit_status',
        type: SearchType.Select,
        itemProps: {
            options: [...UnLimitType, ...auditStatusList],
        },
    },
]

export const timeStrToTimestamp = (searchObj: any) => {
    const obj: any = {}
    const timeFields = ['updated_at_start', 'updated_at_end']
    // eslint-disable-next-line no-restricted-syntax, guard-for-in
    for (const key in searchObj) {
        if (Object.prototype.hasOwnProperty.call(searchObj, key)) {
            obj[key] = searchObj[key]
                ? timeFields.includes(key)
                    ? moment(searchObj[key]).valueOf()
                    : searchObj[key]
                : undefined
        }
    }
    return obj
}

export enum KeyType {
    List,
    Btn,
    Filter,
}

export const getStateItem = ({ level, status, operation }: any) => {
    if (!level) return undefined
    const levelItem = auditLevel.find((o) => o.value === level)
    const statusItem = auditStatusList.find((o) => o.value === status)
    const optItem = auditOperationList.find((o) => o.value === operation)
    // 已撤回
    const isCancel = status === ISSZDReportAuditStatus.Cancel
    // 失败
    const isError = status === ISSZDReportAuditStatus.Error

    return {
        label:
            (optItem?.label || '') +
            (isCancel
                ? __('申请已撤回')
                : isError
                ? __('失败')
                : (levelItem?.label || '') + (statusItem?.label || '')),
        color: statusItem?.color,
    }
}

export const getReportState = ({ label, color = '#d8d8d8' }) => {
    return label ? (
        <div style={{ display: 'flex', alignItems: 'center' }}>
            <span
                style={{
                    display: 'inline-block',
                    width: '10px',
                    height: '10px',
                    marginRight: '8px',
                    borderRadius: '50%',
                    background: color,
                }}
            />
            {label}
        </div>
    ) : (
        '--'
    )
}

export const getReportMsgConfig = (type, hasRepeat = false) => {
    const title = __('已成功提交${type}申请', {
        type,
    })
    const tip = hasRepeat
        ? __('已提交申请的目录无法重复操作,已自动跳过;可前往上报记录下查询进度')
        : __('可前往上报记录下查询进度')

    return getCustomMsg(title, tip)
}

export const getCustomMsg = (title, tip) => {
    return {
        className: styles.reportMsg,
        content: (
            <div style={{ textAlign: 'left' }}>
                <div>{title}</div>
                <div
                    style={{
                        fontSize: '12px',
                        color: 'rgba(0,0,0,0.45)',
                    }}
                >
                    {tip}
                </div>
            </div>
        ),
    }
}
