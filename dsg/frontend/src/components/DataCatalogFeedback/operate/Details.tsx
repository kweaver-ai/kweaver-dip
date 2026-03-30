import { useState, useEffect } from 'react'
import { Modal } from 'antd'
import { DetailsLabel, Loader } from '@/ui'
import {
    DetailGroupTitle,
    fullInfoList,
    replyInfoList,
    refreshDetails,
} from '../helper'
import {
    formatError,
    getFeedbackDetail,
    FeedbackOpType,
    DCFeedbackItem,
    DCFeedbackProcessLog,
} from '@/core'
import OperateHistory from './OperateHistory'
import styles from '../styles.module.less'
import __ from '../locale'

interface IDetails {
    open: boolean
    item: any
    onDetailsClose: () => void
}

const Details = ({ open, item, onDetailsClose }: IDetails) => {
    const [loading, setLoading] = useState(false)
    const [basicInfo, setBasicInfo] = useState<DCFeedbackItem>()
    const [log, setLog] = useState<DCFeedbackProcessLog[]>()

    useEffect(() => {
        fetchDetails()
    }, [item])

    // 获取详情
    const fetchDetails = async () => {
        try {
            setLoading(true)

            const res = await getFeedbackDetail(item?.id)
            setBasicInfo(res?.basic_info)
            setLog(res?.process_log)
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    const getReplyInfo = () => {
        if (!log || log.length === 0) {
            return replyInfoList
        }
        /// 已办详情
        const replyDetail = log?.find((i) => i.op_type === FeedbackOpType.Reply)
        // 回复详情
        let reply_content: string | null = null
        if (replyDetail?.extend_info) {
            try {
                // 先尝试直接解析
                const parsed = JSON.parse(replyDetail.extend_info)
                reply_content = parsed?.reply_content || null
            } catch (error) {
                // 如果解析失败，尝试清理控制字符后重新解析
                try {
                    // 转义未转义的控制字符
                    const cleanedExtendInfo = replyDetail.extend_info
                        .replace(/(?<!\\)\n/g, '\\n') // 转义未转义的换行符
                        .replace(/(?<!\\)\r/g, '\\r') // 转义未转义的回车符
                        .replace(/(?<!\\)\t/g, '\\t') // 转义未转义的制表符
                    const parsed = JSON.parse(cleanedExtendInfo)
                    reply_content = parsed?.reply_content || null
                } catch (retryError) {
                    formatError(retryError)
                    reply_content = null
                }
            }
        }

        return {
            ...replyDetail,
            reply_content,
        }
    }

    return (
        <Modal
            open={open}
            title={__('详情')}
            footer={null}
            width="800px"
            destroyOnClose
            onCancel={onDetailsClose}
        >
            <div className={styles.detailsWrapper}>
                {loading ? (
                    <Loader />
                ) : (
                    <>
                        <div className={styles.detailsLeft}>
                            <DetailGroupTitle title={__('基本信息')} />
                            <DetailsLabel
                                wordBreak
                                detailsList={refreshDetails({
                                    detailList: fullInfoList,
                                    actualDetails: basicInfo,
                                })}
                                labelWidth="130px"
                            />
                            <DetailGroupTitle title={__('回复信息')} />
                            <DetailsLabel
                                wordBreak
                                detailsList={refreshDetails({
                                    detailList: replyInfoList,
                                    actualDetails: getReplyInfo(),
                                })}
                                labelWidth="130px"
                                style={{ paddingLeft: 12 }}
                            />
                        </div>

                        <div className={styles.detailsRight}>
                            <OperateHistory log={log} />
                        </div>
                    </>
                )}
            </div>
        </Modal>
    )
}

export default Details
