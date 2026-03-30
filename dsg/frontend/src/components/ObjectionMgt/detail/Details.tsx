import { useState, useEffect } from 'react'
import { Drawer } from 'antd'
import { DetailsLabel, Loader } from '@/ui'
import {
    DetailGroupTitle,
    DrawerTitle,
    ObjectionMenuEnum,
    DetailType,
    refreshDetails,
} from '../helper'
import {
    getRaiseObjectionDetails,
    getHandleObjectionDetails,
    formatError,
    downloadSSZDDemandFile,
} from '@/core'
import { streamToFile } from '@/utils'
import OperateHistory from './OperateHistory'
import styles from '../styles.module.less'
import __ from '../locale'

interface IDetails {
    open: boolean
    item: any
    menu: ObjectionMenuEnum
    onDetailsClose: () => void
}

const Details = ({ open, item, menu, onDetailsClose }: IDetails) => {
    const [loading, setLoading] = useState(false)
    const [details, setDetails] = useState<any>(null)
    const [log, setLog] = useState<any[]>([])

    useEffect(() => {
        fetchObjectionDetails()
    }, [item])

    // 获取异议详情
    const fetchObjectionDetails = async () => {
        try {
            setLoading(true)

            if (menu === ObjectionMenuEnum.Raise) {
                const res = await getRaiseObjectionDetails(item?.id)
                setDetails(res?.basic_info)
                setLog(res?.log)
            } else {
                const res = await getHandleObjectionDetails(item?.id)
                setDetails(res)
            }
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    // 下载附件
    const handleDownloadAttachment = async () => {
        if (!details?.attachment_id) return
        try {
            const { attachment_id, attachment_name } = details
            const res = await downloadSSZDDemandFile(attachment_id)
            streamToFile(res, attachment_name)
        } catch (error) {
            formatError(error)
        }
    }

    return (
        <Drawer
            open={open}
            closable={false}
            width="100%"
            maskClosable={false}
            drawerStyle={{
                backgroundColor: '#e9e9ed',
                paddingBottom: '24px',
            }}
            headerStyle={{
                backgroundColor: '#fff',
            }}
            bodyStyle={{
                backgroundColor: '#e9e9ed',
                padding: 0,
                overflow: 'hidden',
            }}
            title={
                <DrawerTitle name={details?.title} onClose={onDetailsClose} />
            }
        >
            {loading ? (
                <Loader />
            ) : (
                <div className={styles.objectionDetails}>
                    <div className={styles.detailsLeft}>
                        <DetailGroupTitle title={__('异议内容')} />
                        <DetailsLabel
                            wordBreak
                            detailsList={refreshDetails({
                                type: DetailType.Basic,
                                actualDetails: details,
                                downloadAttachment: handleDownloadAttachment,
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
                        <DetailGroupTitle title={__('异议处理结果')} />
                        <DetailsLabel
                            wordBreak
                            detailsList={refreshDetails({
                                type: DetailType.Result,
                                actualDetails: details,
                            })}
                            labelWidth="130px"
                            style={{ paddingLeft: 12 }}
                        />
                        <DetailGroupTitle title={__('异议评价信息')} />
                        <DetailsLabel
                            wordBreak
                            detailsList={refreshDetails({
                                type: DetailType.Evaluate,
                                actualDetails: details,
                            })}
                            labelWidth="130px"
                            style={{ paddingLeft: 12 }}
                        />
                    </div>
                    {menu === ObjectionMenuEnum.Raise && log?.length > 0 ? (
                        <div className={styles.detailsRight}>
                            <OperateHistory log={log} />
                        </div>
                    ) : null}
                </div>
            )}
        </Drawer>
    )
}

export default Details
