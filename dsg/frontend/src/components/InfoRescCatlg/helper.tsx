import { Popover } from 'antd'
import moment from 'moment'
import { CloseCircleFilled, InfoCircleOutlined } from '@ant-design/icons'
import { CSSProperties } from 'react'
import classNames from 'classnames'
import {
    initSearchCondition,
    PublishStatusList,
    OnlineStatusList,
    OnlineStatus,
    PublishStatus,
    PublishStatusFilter,
    OnlineStatusFilter,
} from './const'
import __ from './locale'
import styles from './styles.module.less'
import { SearchType } from '@/components/SearchLayout/const'
import { DataRange } from '../Forms/const'
import { IRescItem } from '@/core'

import { IformItem, SearchType as ST } from '@/ui/LightweightSearch/const'
// 数据范围：字典DM_DATA_SJFW，01全市 02市直 03区县
export enum dataRange {
    CITY = 'all',
    DIRECTLY_CITY = 'city',
    COUNTY = 'district',
}

export const dataRangeOptions = [
    { label: '全市', value: dataRange.CITY },
    { label: '市直', value: dataRange.DIRECTLY_CITY },
    { label: '区县（市）', value: dataRange.COUNTY },
]

export const businFormRangeToDataRange = {
    [DataRange.CityWide]: dataRange.CITY,
    [DataRange.City]: dataRange.DIRECTLY_CITY,
    [DataRange.County]: dataRange.COUNTY,
}

/**
 * @params CLKTOEXPAND 点击展开节点
 * @params SEARCH 搜索
 * @params OTHER 其他情況-如首次进入目录
 */
export enum CatlgOperateType {
    CLKTOEXPAND = 'click_to_expand',
    SEARCH = 'search',
    OTHER = 'other',
}

export const getFirstDepart = (path: string) => {
    return path?.slice(0, path?.indexOf('/')) || '--'
}

export const searchFormInitData = [
    {
        label: __('信息资源目录名称、编码、标签'),
        key: 'keyword',
        type: SearchType.Input,
        defaultValue: initSearchCondition.keyword,
        isAlone: true,
        itemProps: {
            maxLength: 255,
        },
    },
    {
        label: __('发布状态'),
        key: 'publish_status',
        type: SearchType.MultipleSelect,
        itemProps: {
            options: PublishStatusFilter.map((item) => ({
                ...item,
                icon: (
                    <span
                        style={{
                            display: 'inline-block',
                            width: '10px',
                            height: '10px',
                            marginRight: '3px',
                            borderRadius: '50%',
                            background: item.bgColor,
                        }}
                    />
                ),
            })),
            fieldNames: { label: 'label', value: 'value' },
            showSearch: false,
        },
    },
    {
        label: __('上线状态'),
        key: 'online_status',
        type: SearchType.MultipleSelect,
        itemProps: {
            options: OnlineStatusFilter.map((item) => ({
                ...item,
                icon: (
                    <span
                        style={{
                            display: 'inline-block',
                            width: '10px',
                            height: '10px',
                            marginRight: '3px',
                            borderRadius: '50%',
                            background: item.bgColor,
                        }}
                    />
                ),
            })),
            fieldNames: { label: 'label', value: 'value' },
            showSearch: false,
        },
    },
    {
        label: __('更新时间'),
        key: 'updateTime',
        type: SearchType.RangePicker,
        itemProps: {
            format: 'YYYY-MM-DD',
            // disabledDate: (current: any) => disabledDate(current, {}),
        },
        startTime: 'start',
        endTime: 'end',
    },
]

export const filterSearch: IformItem[] = [
    {
        label: __('更新时间'),
        key: 'updateTime',
        type: ST.RangePicker,
        options: [],
    },
]

export const timeStrToTimestamp = (searchObj: any) => {
    const obj: any = {}
    const timeFields = ['start', 'end']
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

// 未发布状态集
export const unPubStatusList = [
    PublishStatus.Unpublished,
    PublishStatus.PublishedAuditing,
    PublishStatus.PublishedAuditReject,
]

export const getState = (
    key: string,
    data?: any[],
    dotStyle?: CSSProperties,
) => {
    const list = data || []
    const { label, bgColor = '#d8d8d8' } =
        list.find((item) => item.value === key) || {}
    return label ? (
        <div style={{ display: 'flex', alignItems: 'center' }}>
            <span
                style={{
                    display: 'inline-block',
                    width: '10px',
                    height: '10px',
                    marginRight: '8px',
                    borderRadius: '50%',
                    background: bgColor,
                    ...dotStyle,
                }}
            />
            {label}
        </div>
    ) : (
        '--'
    )
}

export const getPubOrOnlineStatusLabel = (data: any, isDetail?: boolean) => {
    const { status, audit_msg, next_id, alter_audit_msg } = data || {}
    const { publish, online } = status

    // 发布、变更审核中
    const isPubAuditing = [
        PublishStatus.PublishedAuditing,
        PublishStatus.ChangeAuditing,
    ].includes(publish)
    // 上、下线审核中
    const isOnlineAuditing = [
        OnlineStatus.OnlineAuditing,
        OnlineStatus.OfflineAuditing,
        OnlineStatus.OfflineUpAuditing,
    ].includes(online)

    const isAuditing = isPubAuditing || isOnlineAuditing
    // 发布、变更审核未通过
    const isPubRejected = [
        PublishStatus.PublishedAuditReject,
        PublishStatus.ChangeReject,
    ].includes(publish)
    // 上、下线审核未通过
    const isOnlineRejected = [
        OnlineStatus.OnlineAuditingReject,
        OnlineStatus.OfflineReject,
        OnlineStatus.OfflineUpAuditingReject,
    ].includes(online)
    const isRejected = isPubRejected || isOnlineRejected

    // 变更 -> 暂存  (已发布且存在next_id)
    const isDraft = publish === PublishStatus.Published && !!next_id

    const msgTip =
        publish === PublishStatus.ChangeReject ? alter_audit_msg : audit_msg

    const isShowLabel = isAuditing || isRejected || isDraft
    // const label = isPubAuditing ? __('发布审核中') : isPubRejected ? __('发布审核未通过') : isAuditing ? __('申报审核中') : isRejected ? __('申报未通过') : ''

    const pubStatusLabel = PublishStatusList.find(
        (item) => item.value === publish,
    )?.label
    const onlineStatusLabel = OnlineStatusList.find(
        (item) => item.value === online,
    )?.label
    const label = isDraft
        ? __('草稿')
        : isPubAuditing || isPubRejected
        ? pubStatusLabel
        : isAuditing || isRejected
        ? onlineStatusLabel
        : ''
    return isShowLabel ? (
        <div
            className={classNames(
                isDetail && styles.detailLabel,
                isDraft
                    ? styles.draft
                    : isAuditing
                    ? styles.auditing
                    : isRejected
                    ? styles.auditNotPass
                    : '',
            )}
        >
            {label}
            {!isDraft && !isAuditing && !!msgTip && (
                <Popover
                    content={
                        <div className={styles.auditInfoWrapper}>
                            <div className={styles.auditTitleWrapper}>
                                <CloseCircleFilled
                                    style={{
                                        color: '#FF4D4F',
                                        fontSize: '16px',
                                    }}
                                />
                                {label}
                            </div>
                            <div className={styles.auditContentWrapper}>
                                {msgTip || '--'}
                            </div>
                        </div>
                    }
                >
                    <InfoCircleOutlined
                        style={{ marginLeft: '4px', cursor: 'pointer' }}
                    />
                </Popover>
            )}
        </div>
    ) : null
}
