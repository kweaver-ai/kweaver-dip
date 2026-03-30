import React, { useEffect, useState } from 'react'
import { Table, Modal, Tooltip } from 'antd'
import classnames from 'classnames'
import styles from './styles.module.less'
import __ from './locale'
import { getStateTag, getFieldTypeEelment } from './helper'
import { getDictDetailById, getDictValuesBySearch, formatError } from '@/core'
import Loader from '@/ui/Loader'
import Empty from '@/ui/Empty'

interface ICodeTableModal {
    open: boolean
    onClose: () => void
    handleError?: (err) => void
    codeId: string
}

const CodeTableModal: React.FC<ICodeTableModal> = ({
    open,
    onClose,
    codeId,
    handleError,
}) => {
    const [loading, setLoading] = useState(false)
    const [codeDetail, setCodeDetail] = useState<any>()
    const [isDel, setIsDel] = useState<boolean>(false)

    useEffect(() => {
        if (codeId) {
            getDictDetails(codeId)
        }
    }, [codeId])

    const columns = [
        {
            title: __('码值'),
            dataIndex: 'code',
            key: 'code',
            ellipsis: true,
        },
        {
            title: __('码值描述'),
            dataIndex: 'value',
            key: 'value',
            ellipsis: true,
        },
        {
            title: __('说明'),
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
        },
    ]

    const getDictDetails = async (dId: string) => {
        if (!dId) return
        try {
            setLoading(true)
            const res = await getDictDetailById(dId)
            setCodeDetail(res)
        } catch (error: any) {
            if (error?.code === 'Standardization.ResourceError.DataNotExist') {
                setIsDel(true)
            } else {
                formatError(error)
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <Modal
                title={__('码表信息')}
                width={640}
                open={open}
                onCancel={onClose}
                maskClosable={false}
                footer={null}
                className={styles.codeTableModal}
            >
                {loading ? (
                    <Loader />
                ) : (
                    <div className={styles.modalBox}>
                        <div className={styles.title}>
                            {codeDetail?.data?.ch_name}
                            {(codeDetail?.data?.state !== 'enable' ||
                                codeDetail?.data?.deleted) && (
                                <span
                                    className={classnames(
                                        styles.delTag,
                                        codeDetail?.data?.state === 'disable' &&
                                            !codeDetail?.data?.deleted &&
                                            styles.disable,
                                    )}
                                >
                                    {codeDetail?.data?.deleted
                                        ? __('已删除')
                                        : __('已停用')}
                                </span>
                            )}
                        </div>
                        <div className={styles.table}>
                            <Table
                                pagination={false}
                                rowKey={(record, index) => index || 0}
                                dataSource={codeDetail?.data?.enums}
                                columns={columns}
                                className={styles['content-fourth-table']}
                                scroll={{
                                    y: 430,
                                }}
                                locale={{
                                    emptyText: <Empty />,
                                }}
                            />
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    )
}

export default CodeTableModal
