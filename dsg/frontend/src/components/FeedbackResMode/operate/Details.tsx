import { useState, useEffect } from 'react'
import { Modal } from 'antd'
import { DetailsLabel, Loader } from '@/ui'
import {
    DetailGroupTitle,
    fullInfoList,
    replyInfoList,
    refreshDetails,
    jsonParse,
} from '../helper'
import {
    formatError,
    getFeedbackDetailResMode,
    FeedbackOpType,
    FeedbackItemResMode,
    FeedbackProcessLogResMode,
    ResType,
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
    const [basicInfo, setBasicInfo] = useState<FeedbackItemResMode>()
    const [log, setLog] = useState<FeedbackProcessLogResMode[]>()

    useEffect(() => {
        fetchDetails()
    }, [item])

    // 获取详情
    const fetchDetails = async () => {
        try {
            setLoading(true)

            const res = await getFeedbackDetailResMode(item?.id, item?.res_type)
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
        const parsedInfo = jsonParse(replyDetail?.extend_info, {})
        const reply_content = parsedInfo?.reply_content || ''

        return {
            ...replyDetail,
            reply_content,
        }
    }

    return (
        <Modal
            open={open}
            title={__('反馈详情')}
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
