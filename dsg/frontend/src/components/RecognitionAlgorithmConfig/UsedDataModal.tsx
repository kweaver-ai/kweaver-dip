import { Button, message, Modal, Table } from 'antd'
import React, { useEffect, useState } from 'react'
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons'
import __ from './locale'
import styles from './styles.module.less'
import { FontIcon } from '@/icons'
import {
    deleteForceRecognitionAlgorithms,
    formatError,
    getRecognitionAlgorithmUsedList,
} from '@/core'

interface UsedDataModalProps {
    open: boolean
    data: Array<string>
    count: number
    onCancel: () => void
}
const UsedDataModal = ({ open, onCancel, data, count }: UsedDataModalProps) => {
    const [dataSource, setDataSource] = useState<Array<any>>([])
    // 选中行id
    const [selectedIds, setSelectedIds] = useState<string[]>([])

    useEffect(() => {
        if (data?.length > 0) {
            getDataRelation()
        }
    }, [data])

    const getDataRelation = async () => {
        try {
            const res = await getRecognitionAlgorithmUsedList({
                ids: data,
            })
            setDataSource(res.algorithm_subjects)
        } catch (err) {
            formatError(err)
        }
    }

    const columns: Array<any> = [
        {
            title: (
                <span className={styles.nameTitleContainer}>
                    {__('模版名称')}
                    <span className={styles.subTitle}>（{__('描述')}）</span>
                </span>
            ),
            key: 'algorithm_name',
            dataIndex: 'algorithm_name',
            ellipsis: true,
            fixed: 'left',
            render: (text, record) => {
                return (
                    <div className={styles.rowNameContainer}>
                        <div className={styles.nameWrapper}>
                            <span
                                className={styles.name}
                                title={record?.algorithm_name}
                            >
                                {record?.algorithm_name}
                            </span>
                        </div>
                        <div>
                            <span
                                className={styles.description}
                                title={record?.description}
                            >
                                {record?.description}
                            </span>
                        </div>
                    </div>
                )
            },
        },
        {
            title: __('作用属性'),
            key: 'subjects',
            dataIndex: 'subjects',
            ellipsis: true,
            fixed: 'left',
            render: (text, record) => {
                return record.subjects.map((item: any, index: number) => {
                    return (
                        <div key={index} className={styles.relationsWrapper}>
                            {index > 0 && <div className={styles.splitLine} />}
                            <div title={item.name} className={styles.item}>
                                <FontIcon
                                    name="icon-shuxing"
                                    style={{
                                        fontSize: 20,
                                        color: 'rgba(245, 137, 13, 1)',
                                    }}
                                />
                                <span className={styles.text}>{item.name}</span>
                            </div>
                        </div>
                    )
                })
            },
        },
        {
            title: __('操作'),
            key: 'actions',
            dataIndex: 'actions',
            ellipsis: true,
            fixed: 'left',
            render: (text, record) => {
                return (
                    <Button
                        type="link"
                        onClick={() => handleDelete([record.algorithm_id])}
                    >
                        {__('解除关系，并删除模版')}
                    </Button>
                )
            },
        },
    ]

    // 表格选中
    const rowSelection = {
        // 表格rowKey
        selectedRowKeys: selectedIds,
        onChange: (val: React.Key[]) => {
            setSelectedIds(val as string[])
        },
    }

    /**
     * 删除
     * @param ids
     */
    const handleDelete = async (ids: string[]) => {
        try {
            await deleteForceRecognitionAlgorithms({
                mode: 'force',
                ids,
            })
            setDataSource(
                dataSource.filter((item) => !ids.includes(item.algorithm_id)),
            )
            message.success(__('删除成功'))
        } catch (err) {
            formatError(err)
        }
    }
    return (
        <Modal
            title={null}
            open={open}
            width={800}
            closable={false}
            maskClosable={false}
            footer={
                <div>
                    <Button
                        onClick={onCancel}
                        type="primary"
                        style={{ width: 80 }}
                    >
                        {__('关闭')}
                    </Button>
                </div>
            }
        >
            <div className={styles.usedDataContainer}>
                {count > 0 && (
                    <div className={styles.messageContainer}>
                        <CheckCircleFilled
                            style={{ color: '#52C41B', fontSize: 24 }}
                        />
                        <span>
                            {__('操作完成，已删除${count}个模版', {
                                count: count.toString(),
                            })}
                        </span>
                    </div>
                )}
                <div className={styles.messageContainer}>
                    <CloseCircleFilled
                        style={{ color: '#FF4D4F', fontSize: 24 }}
                    />
                    <span>
                        {__(
                            '以下模版已被分类识别规则绑定使用，需要先解除模版和规则的作用关系，才能进行删除。',
                        )}
                    </span>
                </div>
                <div className={styles.tableContainer}>
                    {selectedIds.length > 0 && (
                        <div className={styles.titleBarWrapper}>
                            <span className={styles.countWrapper}>
                                {__('已选择${count}项', {
                                    count: selectedIds.length.toString(),
                                })}
                            </span>
                            <Button
                                type="link"
                                onClick={() => handleDelete(selectedIds)}
                            >
                                {__('解除关系，并删除模版')}
                            </Button>
                        </div>
                    )}
                    <Table
                        dataSource={dataSource}
                        columns={columns}
                        scroll={{ y: 370 }}
                        rowKey="algorithm_id"
                        rowSelection={rowSelection}
                        pagination={false}
                    />
                </div>
            </div>
        </Modal>
    )
}

export default UsedDataModal
