import { Button, Space, Table } from 'antd'
import React, { useEffect, useMemo, useState } from 'react'
import { isNumber } from 'lodash'
import moment from 'moment'
import __ from './locale'
import styles from './styles.module.less'
import { FixedType } from '@/components/CommonTable/const'
import { getDepartName } from '../../WorkOrderProcessing/helper'
import { resourceTypeList } from '@/components/ResourceDirReport/const'

/**
 * 数据资源目录表单
 * @returns
 */
const ModalTable = ({ readOnly, data, onChange }: any) => {
    const [dataSource, setDataSource] = useState<any[]>()

    useEffect(() => {
        if (data?.length && Array.isArray(data)) {
            setDataSource(data)
        }
    }, [data])

    const handleRemove = (viewId: string) => {
        const newData = (dataSource || []).filter((o) => o?.id !== viewId)
        setDataSource(newData)
        onChange?.(newData)
    }

    const columns: any = [
        {
            title: (
                <div>
                    <span>{__('数据资源目录名称')}</span>
                    <span
                        style={{
                            color: 'rgba(0,0,0,0.45)',
                            fontWeight: 'normal',
                        }}
                    >
                        （{__('编号')}）
                    </span>
                </div>
            ),
            dataIndex: 'name',
            key: 'name',
            width: 220,
            ellipsis: true,
            render: (text, record) => (
                <div className={styles.titleBox}>
                    <div
                        className={styles.planTitle}
                        // onClick={() => handleOperate(OperateType.DETAIL, record)}
                        title={text}
                    >
                        {text || '--'}
                    </div>
                    <div className={styles.planContent} title={record.code}>
                        {record.code || '--'}
                    </div>
                </div>
            ),
        },

        {
            title: __('资源类型'),
            dataIndex: 'resources',
            key: 'resources',
            ellipsis: true,
            render: (arr: any[], record) => {
                return arr?.length > 0
                    ? arr.map(
                          (o) =>
                              resourceTypeList?.find(
                                  (item) => item.key === o?.resource_type,
                              )?.label,
                      )
                    : '--'
            },
        },
        // {
        //     title: __('数据Owner'),
        //     dataIndex: 'owners',
        //     key: 'owners',
        //     ellipsis: true,
        //     render: (arr, record) => {
        //         const ownerName = arr?.map((o) => o?.owner_name).join('、')
        //         return (
        //             <div title={ownerName} className={styles.catlgCode}>
        //                 {ownerName || '--'}
        //             </div>
        //         )
        //     },
        // },
        {
            title: __('发布时间'),
            dataIndex: 'updated_at',
            key: 'updated_at',
            ellipsis: true,
            width: 180,
            render: (text: any) => {
                return isNumber(text)
                    ? moment(text).format('YYYY-MM-DD HH:mm:ss')
                    : '--'
            },
        },
        {
            title: __('操作'),
            key: 'action',
            width: 120,
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
        return readOnly ? columns?.filter((o) => o.key !== 'action') : columns
    }, [readOnly, dataSource])

    return (
        <Table
            columns={curColumns}
            dataSource={dataSource}
            pagination={{
                pageSize: 5,
                showSizeChanger: false,
                hideOnSinglePage: true,
            }}
        />
    )
}

export default ModalTable
