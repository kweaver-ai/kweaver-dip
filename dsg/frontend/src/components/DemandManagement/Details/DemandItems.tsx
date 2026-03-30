import { Badge, Space, Table, Tooltip } from 'antd'
import React, { useEffect, useState } from 'react'
import classnames from 'classnames'
import CommonTitle from '../CommonTitle'
import __ from '../locale'
import styles from './styles.module.less'
import dataEmpty from '@/assets/dataEmpty.svg'
import ViewConfig from './ViewConfig'
import {
    IAnalysisResult,
    IDemandItemInfo,
    formatError,
    getDemandAnalysisResultBackV2,
    getDemandAnalysisResultV2,
    getItemDetails,
} from '@/core'
import { Authority, AuthorityNameMap, ResourceNameMap } from './const'
import {
    ApplyAuthPhaseList,
    IExtendDemandItemInfo,
    filterApplyAuthPhaseList,
} from '../const'
import { Empty } from '@/ui'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import ViewPermission from './ViewPermission'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'

interface IDemandItems {
    demandItems: IDemandItemInfo[]
    isAudit?: boolean
    applyReason?: string
    existPermissionReq?: boolean
}
const DemandItems: React.FC<IDemandItems> = ({
    demandItems = [],
    isAudit,
    applyReason,
    existPermissionReq = true,
}) => {
    const [configOpen, setConfigOpen] = useState(false)
    const [operateId, setOperateId] = useState('')
    const [operateData, setOperateData] = useState<IExtendDemandItemInfo>()
    const [{ using }, updateUsing] = useGeneralConfig()

    const getStatusInfo = (record: IDemandItemInfo) => {
        const { is_publish, is_online } = record
        // 已发布/上线状态
        const rescStatus =
            (using === 1 && is_publish) || (using === 2 && is_online)
        const rescStatusLabel =
            using === 1
                ? is_publish
                    ? __('已发布')
                    : __('未发布')
                : using === 2
                ? is_online
                    ? __('已上线')
                    : __('已下线')
                : ''
        return {
            status: rescStatus,
            text: rescStatusLabel,
        }
    }
    const columns = [
        {
            title: (
                <div>
                    {__('数据资源名称')}
                    <span className={styles.subtitle}>
                        （{__('技术名称')}）
                    </span>
                </div>
            ),
            dataIndex: 'res_tech_name',
            key: 'res_tech_name',
            render: (name, record: IDemandItemInfo) => {
                const { text } = getStatusInfo(record)
                return (
                    <div className={styles['info-container']}>
                        <FontIcon
                            name="icon-shujubiaoshitu"
                            type={IconType.COLOREDICON}
                            className={styles.icon}
                        />
                        <div className={styles.names}>
                            <div
                                className={styles.name}
                                title={record.res_busi_name}
                            >
                                {record.res_busi_name}
                            </div>
                            <div className={styles['tech-name']} title={name}>
                                {name}
                            </div>
                        </div>
                        {!isAudit && (
                            <div className={classnames(styles['online-flag'])}>
                                {text}
                            </div>
                        )}
                    </div>
                )
            },
        },
        {
            title: __('资源状态'),
            dataIndex: 'is_online',
            key: 'is_online',
            ellipsis: true,
            render: (text, record) => {
                const { text: rescStatusLabel, status } = getStatusInfo(record)
                return (
                    <div
                        className={classnames(
                            styles['online-flag'],
                            !status && styles['offline-flag'],
                        )}
                    >
                        {rescStatusLabel}
                    </div>
                )
            },
        },
        {
            title: __('描述'),
            dataIndex: 'res_desc',
            key: 'res_desc',
            ellipsis: true,
            render: (desc) => desc || '--',
        },
        {
            title: __('申请状态'),
            dataIndex: 'phase',
            key: 'phase',
            ellipsis: true,
            render: (_phase: string, record: any) => {
                const phase = (_phase ||
                    ApplyAuthPhaseList.PENDING) as ApplyAuthPhaseList
                const { message: msg } = record
                const status: any =
                    filterApplyAuthPhaseList.find((s) =>
                        s.value
                            ?.join()
                            ?.toLocaleLowerCase()
                            ?.includes(phase?.toLocaleLowerCase()),
                    ) || {}

                return status?.bgColor ? (
                    <>
                        <Badge
                            color={status.bgColor}
                            text={status.label || '--'}
                            className={styles['status-badge']}
                        />
                        {[
                            ApplyAuthPhaseList.REJECTED,
                            ApplyAuthPhaseList.UNDONE,
                            ApplyAuthPhaseList.FAILED,
                        ].includes(phase) && (
                            <Tooltip
                                title={`${
                                    [
                                        ApplyAuthPhaseList.REJECTED,
                                        ApplyAuthPhaseList.UNDONE,
                                    ].includes(phase)
                                        ? __('拒绝原因：')
                                        : __('失败原因：')
                                }${msg}`}
                                placement="bottom"
                            >
                                <FontIcon
                                    name="icon-shenheyijian"
                                    type={IconType.COLOREDICON}
                                    className={styles.reasonIcon}
                                />
                            </Tooltip>
                        )}
                    </>
                ) : (
                    '--'
                )
            },
        },
        {
            title: __('操作'),
            dataIndex: 'action',
            key: 'action',
            width: 140,
            render: (_, record: IDemandItemInfo) => (
                <Space size={24}>
                    {existPermissionReq ? (
                        <a
                            // 审核代办样式被覆盖，改成行内样式
                            style={{ color: '#126ee3' }}
                            onClick={() => {
                                setOperateId(record.id)
                                setOperateData(record)
                                setConfigOpen(true)
                            }}
                        >
                            {__('查看权限')}
                        </a>
                    ) : (
                        '--'
                    )}
                </Space>
            ),
        },
    ]

    return (
        <div className={styles['demand-items-wrapper']}>
            <CommonTitle title={__('资源清单')} />
            {demandItems.length === 0 ? (
                <div className={styles['empty-container']}>
                    <Empty iconSrc={dataEmpty} desc={__('暂无数据')} />
                </div>
            ) : (
                <div className={styles['demand-items']}>
                    <Table
                        dataSource={demandItems}
                        columns={
                            isAudit
                                ? columns.filter(
                                      (item) => item.key !== 'status',
                                  )
                                : columns.filter(
                                      (item) => item.key !== 'is_online',
                                  )
                        }
                        pagination={false}
                        rowKey="id"
                    />
                    {isAudit && (
                        <div className={styles['demand-items-reason']}>
                            <div className={styles['demand-items-label']}>
                                {__('申请理由：')}
                            </div>
                            <div className={styles['demand-items-text']}>
                                {applyReason || '--'}
                            </div>
                        </div>
                    )}
                </div>
            )}
            {configOpen && (
                <ViewPermission
                    open={configOpen}
                    onClose={() => {
                        setConfigOpen(false)
                        setOperateId('')
                        setOperateData(undefined)
                    }}
                    name={operateData?.res_busi_name!}
                    viewid={operateData?.auth_apply_id!}
                    sheetId={operateData?.res_id!}
                />
            )}
        </div>
    )
}

export default DemandItems
