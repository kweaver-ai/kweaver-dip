import { Button, Space, Table } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { FixedType } from '@/components/CommonTable/const'
import AttrIcon from '@/components/RowAndColFilter/AttrIcon'
import __ from './locale'
import styles from './styles.module.less'
import { formatRateByDataSize } from '@/utils'

/**
 * 整改字段表
 */
const CorrectionTable = ({
    readOnly = false,
    canCheck = false,
    onCheck,
    checkedKeys = [],
    bindKeys = [],
    data,
    onChange,
}: any) => {
    const [dataSource, setDataSource] = useState<any[]>()

    useEffect(() => {
        setDataSource(data)
    }, [data])

    const handleRemove = (viewId: string) => {
        const newData = (dataSource || []).filter((o) => o?.id !== viewId)
        onChange?.(newData)
    }

    const columns = [
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
            width: 180,
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
            ellipsis: true,
            render: (text, record) => (
                <div className={styles.ellipsisTitle} title={text}>
                    {text || '--'}
                </div>
            ),
        },

        {
            title: __('检测数据量'),
            dataIndex: 'inspected_count',
            key: 'inspected_count',
            ellipsis: true,
            render: (text, record) => (
                <div className={styles.ellipsisTitle} title={text}>
                    {text ?? '--'}
                </div>
            ),
        },
        {
            title: __('问题数据量'),
            dataIndex: 'issue_count',
            key: 'issue_count',
            ellipsis: true,
            render: (text, record) => (
                <div className={styles.ellipsisTitle} title={text}>
                    {text ?? '--'}
                </div>
            ),
        },
        {
            title: __('问题率'),
            dataIndex: 'issue_count',
            key: 'issue_count',
            ellipsis: true,
            render: (text, record) => (
                <div className={styles.ellipsisTitle}>
                    {formatRateByDataSize(
                        record?.issue_count,
                        record?.inspected_count,
                    ) ?? '--'}
                </div>
            ),
        },
        {
            title: __('评分'),
            dataIndex: 'score',
            key: 'score',
            ellipsis: true,
            render: (text, record) => (
                <div className={styles.ellipsisTitle} title={text}>
                    {text ?? '--'}
                </div>
            ),
        },
        {
            title: __('操作'),
            key: 'action',
            width: 100,
            fixed: FixedType.RIGHT,
            render: (_, record) => {
                return (
                    <Space size={16}>
                        <Button
                            type="link"
                            onClick={() => handleRemove(record?.id)}
                        >
                            {__('移除')}
                        </Button>
                    </Space>
                )
            },
        },
    ]

    const curColumns = useMemo(() => {
        return readOnly ? columns.filter((o) => o.key !== 'action') : columns
    }, [columns, readOnly])

    return (
        <Table
            columns={curColumns}
            dataSource={dataSource}
            rowClassName={styles.tableRow}
            className={styles.correctionTable}
            pagination={{
                pageSize: canCheck ? 10 : 5,
                showSizeChanger: false,
                hideOnSinglePage: true,
            }}
            rowKey="id"
            rowSelection={
                canCheck
                    ? {
                          selectedRowKeys: checkedKeys,
                          onChange: (selectedRowKeys, selectedRows) => {
                              onCheck?.(selectedRowKeys, selectedRows)
                          },
                          getCheckboxProps: (record) => ({
                              disabled: (bindKeys || []).includes(record?.id),
                          }),
                      }
                    : undefined
            }
        />
    )
}

export default CorrectionTable
