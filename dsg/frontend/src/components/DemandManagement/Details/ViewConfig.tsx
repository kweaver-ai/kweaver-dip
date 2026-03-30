import React, { useEffect, useState } from 'react'
import { Checkbox, Drawer, Space, Table } from 'antd'
import __ from '../locale'
import styles from './styles.module.less'
import {
    Authority,
    AuthorityNameMap,
    DemandFieldType,
    ViewConfigFields,
} from './const'
import { InfoOutlined } from '@/icons'
import ViewRules from './ViewRules'
import {
    IDemandItemDetails,
    IDemandItemInfo,
    IDemandVisitor,
    IVisitorDeleteFlag,
    formatError,
    getDemandItemDetailsBackV2,
    getDemandItemDetailsV2,
} from '@/core'
import { IExtendDemandItemInfo } from '../const'
import { getDepartmentInfo } from '../helper'

interface IViewConfig {
    open: boolean
    onClose: () => void
    demandId?: string
    itemId?: string
    initData?: IExtendDemandItemInfo
    isBack?: boolean
}
const ViewConfig: React.FC<IViewConfig> = ({
    open,
    onClose,
    demandId,
    itemId,
    initData,
    isBack = false,
}) => {
    const [rulesOpen, setRuleOpen] = useState(false)

    const [details, setDetails] = useState<IDemandItemDetails>()
    const [visitors, setVisitors] = useState<IDemandVisitor[]>([])
    const [operateData, setOperateData] = useState<IDemandVisitor>()

    const getAnalysisRes = async () => {
        try {
            if (demandId && itemId && !initData) {
                const action = isBack
                    ? getDemandItemDetailsBackV2
                    : getDemandItemDetailsV2
                const res = await action(demandId, itemId)
                setDetails(res)
                setVisitors(JSON.parse(res.extend_info).visitors || [])
            }
        } catch (err) {
            formatError(err)
        }
    }

    useEffect(() => {
        getAnalysisRes()
    }, [itemId])

    useEffect(() => {
        if (initData) {
            setDetails(initData as IDemandItemDetails)
            if (initData.visitors) {
                setVisitors(initData.visitors)
            }
        }
    }, [initData])

    const columns = [
        {
            title: __('访问者'),
            dataIndex: 'name',
            key: 'name',
            width: 200,
            render: (name, record: IDemandVisitor) => (
                <span className={styles['visitor-container']}>
                    <span className={styles['visitor-name']} title={name}>
                        {name}
                    </span>
                    {(record.delete_flag === IVisitorDeleteFlag.Yes ||
                        record.is_applier) && (
                        <span className={styles['visitor-role']}>
                            {record.delete_flag === IVisitorDeleteFlag.Yes
                                ? __('未知用户')
                                : record.is_applier
                                ? __('需求提出人')
                                : ''}
                        </span>
                    )}
                </span>
            ),
        },
        {
            title: __('所属部门'),
            dataIndex: 'departments',
            key: 'departments',
            ellipsis: true,
            render: (
                departments:
                    | { id: string; name: string }[][]
                    | { id: string; name: string; department_name: string }[],
            ) => {
                const { showName, title } = getDepartmentInfo(departments)
                return <span title={title}>{showName}</span>
            },
        },
        {
            title: __('操作'),
            dataIndex: 'action',
            key: 'action',
            width: 120,
            render: (_, record: IDemandVisitor) => (
                <a
                    onClick={() => {
                        setRuleOpen(true)
                        setOperateData(record)
                    }}
                >
                    {__('查看行列规则')}
                </a>
            ),
        },
    ]

    return (
        <Drawer
            title={__('查看配置')}
            placement="right"
            width={800}
            onClose={onClose}
            open={open}
        >
            <div className={styles['view-config-wrapper']}>
                {ViewConfigFields.map((field, index) => (
                    <div className={styles['detail-item']} key={index}>
                        <div className={styles['detail-item-label']}>
                            {field.label}
                        </div>
                        <div className={styles['detail-item-value']}>
                            {field.type === DemandFieldType.CHECK ? (
                                <Space size={6}>
                                    <Checkbox
                                        checked={details?.authority.includes(
                                            Authority.Read,
                                        )}
                                        disabled
                                    />
                                    <span>
                                        {AuthorityNameMap[Authority.Read]}
                                    </span>
                                    <InfoOutlined
                                        title={__('可见数据目录的真实数据')}
                                        className={styles['info-icon']}
                                    />
                                    {details?.authority.includes(
                                        Authority.Download,
                                    ) && (
                                        <>
                                            <Checkbox
                                                checked={details?.authority.includes(
                                                    Authority.Download,
                                                )}
                                                disabled
                                            />
                                            <span>
                                                {
                                                    AuthorityNameMap[
                                                        Authority.Download
                                                    ]
                                                }
                                            </span>
                                            <InfoOutlined
                                                title={__(
                                                    '可下载数据目录的真实数据',
                                                )}
                                                className={styles['info-icon']}
                                            />
                                        </>
                                    )}
                                </Space>
                            ) : (
                                details?.[field.value] || '--'
                            )}
                        </div>
                    </div>
                ))}
                <div className={styles.visitors}>{__('访问者：')}</div>
                <Table
                    dataSource={visitors}
                    columns={columns}
                    pagination={false}
                    rowKey="res_id"
                />
                {rulesOpen && (
                    <ViewRules
                        // open={rulesOpen}
                        // onClose={() => setRuleOpen(false)}
                        fields={operateData?.fields}
                        // filters={operateData?.row_filters}
                        // name={operateData?.name!}
                    />
                )}
            </div>
        </Drawer>
    )
}

export default ViewConfig
