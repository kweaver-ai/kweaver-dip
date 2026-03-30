import React, { useState, useEffect } from 'react'
import { Modal } from 'antd'
import { getRaiseObjectionDetails, formatError } from '@/core'
import { DetailGroupTitle, DetailType, refreshDetails } from '../helper'
import { DetailsLabel, Loader } from '@/ui'
import __ from '../locale'
import styles from '../styles.module.less'

interface IAuditDetails {
    open: boolean
    item: any
    onCancel: () => void
}

const AuditDetails: React.FC<IAuditDetails> = ({
    open,
    item,
    onCancel,
}: IAuditDetails) => {
    const [loading, setLoading] = useState(true)
    const [details, setDetails] = useState<any>(null)

    useEffect(() => {
        fetchObjectionDetails()
    }, [item])

    // 获取异议详情
    const fetchObjectionDetails = async () => {
        try {
            setLoading(true)
            const res = await getRaiseObjectionDetails(item?.id)
            setDetails(res?.basic_info)
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal
            title={__('异议内容')}
            open={open}
            onCancel={onCancel}
            width={800}
            footer={null}
            bodyStyle={{ height: 550 }}
        >
            {loading ? (
                <Loader />
            ) : (
                <div className={styles.reviewDetailsWrapper}>
                    <DetailGroupTitle title={__('异议内容')} />
                    <DetailsLabel
                        wordBreak
                        detailsList={refreshDetails({
                            type: DetailType.Basic,
                            actualDetails: details,
                        })}
                        labelWidth="130px"
                    />
                    <DetailGroupTitle title={__('异议提出人信息')} />
                    <DetailsLabel
                        wordBreak
                        detailsList={refreshDetails({
                            type: DetailType.Personnel,
                            actualDetails: details,
                        })}
                        labelWidth="130px"
                        style={{ paddingLeft: 12 }}
                    />
                </div>
            )}
        </Modal>
    )
}

export default AuditDetails
