import { Modal, Table } from 'antd'
import moment from 'moment'
import { useEffect, useState } from 'react'
import { isNumber } from 'lodash'
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons'
import { formatError, getQualityReportCompare } from '@/core'

import AttrIcon from '@/components/RowAndColFilter/AttrIcon'
import __ from './locale'
import styles from './styles.module.less'
import {
    AnchorType,
    KVMap,
    ScoreType,
} from '@/components/DatasheetView/DataPreview/helper'
import { formatRateByDataSize } from '@/utils'

/**
 * 整改对比
 */
const ImprovmentModal = ({ id, visible, onClose }: any) => {
    const [data, setData] = useState<any>()
    const [dataSource, setDataSource] = useState<any>()
    const [loading, setLoading] = useState<boolean>(false)

    const getImprovmentDetail = async (workOrderId: string) => {
        try {
            setLoading(true)
            const res = await getQualityReportCompare({
                work_order_id: workOrderId,
            })
            setData(res)

            const beforeData = res?.before
            const afterData = res?.after

            const list = beforeData?.map((item: any) => {
                const before = item
                const after = afterData?.find(
                    (i: any) =>
                        i?.id === item?.id && i?.rule_id === item?.rule_id,
                )
                return {
                    id: `${item?.field_id}-${item?.rule_id}`,
                    field_type: item?.field_type,
                    field_technical_name: item?.field_technical_name,
                    field_business_name: item?.field_business_name,
                    rule_name: item?.rule_name,
                    rule_type: AnchorType[KVMap[item?.dimension]],
                    before,
                    after,
                    isScoreUp:
                        [null, undefined].includes(after?.score) ||
                        [null, undefined].includes(before?.score)
                            ? null
                            : (after?.score || 0) - (before?.score || 0),
                }
            })
            setDataSource(list)
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (id) {
            getImprovmentDetail(id)
        }
    }, [id])

    const columns = [
        {
            title: __('基本信息'),
            children: [
                {
                    title: (
                        <div>
                            <span>{__('字段业务名称')}</span>
                            <span
                                style={{
                                    color: 'rgba(0,0,0,0.45)',
                                    fontWeight: 'normal',
                                }}
                            >
                                （{__('技术名称')}）
                            </span>
                        </div>
                    ),
                    dataIndex: 'field_business_name',
                    key: 'field_business_name',
                    ellipsis: true,
                    width: 190,
                    render: (text, record) => (
                        <div className={styles.fieldBox}>
                            <div className={styles.fieldIcon}>
                                <AttrIcon type={record?.field_type} />
                            </div>
                            <div className={styles.titleBox}>
                                <div className={styles.sourceTitle}>
                                    <div title={text}>{text || '--'}</div>
                                </div>
                                <div
                                    className={styles.sourceContent}
                                    title={record?.field_technical_name}
                                >
                                    {record?.field_technical_name || '--'}
                                </div>
                            </div>
                        </div>
                    ),
                },
                {
                    title: __('规则名称'),
                    dataIndex: 'rule_name',
                    key: 'rule_name',
                    ellipsis: true,
                    width: 120,
                    render: (text, record) => (
                        <div className={styles.ellipsisTitle} title={text}>
                            {text || '--'}
                        </div>
                    ),
                },
                {
                    title: __('规则类型'),
                    dataIndex: 'rule_type',
                    key: 'rule_type',
                    width: 90,
                    ellipsis: true,
                    render: (text, record) => (
                        <div className={styles.ellipsisTitle} title={text}>
                            {text || '--'}
                        </div>
                    ),
                },
            ],
        },
        {
            title: (
                <div>
                    {__('整改前')}
                    <span style={{ fontSize: '12px' }}>
                        ({__('报告生成时间')}
                        {data?.before_report_at
                            ? moment(data.before_report_at).format(
                                  'YYYY-MM-DD HH:mm:ss',
                              )
                            : '--'}
                        )
                    </span>
                </div>
            ),
            children: [
                {
                    title: __('检测数据量'),
                    dataIndex: ['before', 'inspected_count'],
                    key: 'before_inspected_count',
                    ellipsis: true,
                    render: (text, record) => (
                        <div className={styles.ellipsisTitle} title={text}>
                            {text ?? '--'}
                        </div>
                    ),
                },
                {
                    title: __('问题数据量'),
                    dataIndex: ['before', 'issue_count'],
                    key: 'before_issue_count',
                    ellipsis: true,
                    render: (text, record) => (
                        <div className={styles.ellipsisTitle} title={text}>
                            {text ?? '--'}
                        </div>
                    ),
                },
                {
                    title: __('问题率'),
                    dataIndex: ['before', 'issue_count'],
                    key: 'before_issue_count',
                    ellipsis: true,
                    width: 80,
                    render: (text, record) => (
                        <div className={styles.ellipsisTitle}>
                            {formatRateByDataSize(
                                record?.before?.issue_count,
                                record?.before?.inspected_count,
                            ) ?? '--'}
                        </div>
                    ),
                },
                {
                    title: __('评分'),
                    dataIndex: ['before', 'score'],
                    key: 'before_score',
                    ellipsis: true,
                    width: 90,
                    render: (text, record) => (
                        <div className={styles.ellipsisTitle}>
                            {isNumber(text)
                                ? Math.ceil(text * 10000) / 100
                                : '--'}
                        </div>
                    ),
                },
            ],
        },
        {
            title: (
                <div>
                    {__('整改后')}
                    <span style={{ fontSize: '12px' }}>
                        ({__('报告生成时间')}
                        {data?.after_report_at
                            ? moment(data.after_report_at).format(
                                  'YYYY-MM-DD HH:mm:ss',
                              )
                            : '--'}
                        )
                    </span>
                </div>
            ),
            children: [
                {
                    title: __('检测数据量'),
                    dataIndex: ['after', 'inspected_count'],
                    key: 'after_inspected_count',
                    ellipsis: true,
                    render: (text, record) => (
                        <div className={styles.ellipsisTitle} title={text}>
                            {text ?? '--'}
                        </div>
                    ),
                },
                {
                    title: __('问题数据量'),
                    dataIndex: ['after', 'issue_count'],
                    key: 'after_issue_count',
                    ellipsis: true,
                    render: (text, record) => (
                        <div className={styles.ellipsisTitle} title={text}>
                            {text ?? '--'}
                        </div>
                    ),
                },
                {
                    title: __('问题率'),
                    dataIndex: ['after', 'issue_count'],
                    key: 'after_issue_count',
                    ellipsis: true,
                    width: 80,
                    render: (text, record) => (
                        <div className={styles.ellipsisTitle}>
                            {formatRateByDataSize(
                                record?.after?.issue_count,
                                record?.after?.inspected_count,
                            ) ?? '--'}
                        </div>
                    ),
                },
                {
                    title: __('评分'),
                    dataIndex: ['after', 'score'],
                    key: 'after_score',
                    width: 90,
                    ellipsis: true,
                    render: (text, record) => (
                        <div
                            className={styles.ellipsisTitle}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                            }}
                        >
                            {isNumber(text)
                                ? Math.ceil(text * 10000) / 100
                                : '--'}
                            <span hidden={!record?.isScoreUp}>
                                {record?.isScoreUp > 0 ? (
                                    <ArrowUpOutlined
                                        style={{
                                            color: '#1890FF',
                                            fontSize: 13,
                                        }}
                                    />
                                ) : (
                                    <ArrowDownOutlined
                                        style={{
                                            color: '#1890FF',
                                            fontSize: 13,
                                        }}
                                    />
                                )}
                            </span>
                        </div>
                    ),
                },
            ],
        },
    ]

    return (
        <Modal
            title={__('查看对比')}
            open={visible}
            onCancel={onClose}
            maskClosable={false}
            destroyOnClose
            getContainer={false}
            width={1200}
            bodyStyle={{ height: 560, overflow: 'auto', paddingBottom: 0 }}
            footer={null}
        >
            <div className={styles.improvmentModalWrapper}>
                <Table
                    loading={loading}
                    dataSource={dataSource}
                    columns={columns}
                    pagination={false}
                    rowKey="id"
                    bordered
                />
            </div>
        </Modal>
    )
}

export default ImprovmentModal
