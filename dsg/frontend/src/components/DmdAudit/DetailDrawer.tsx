import React, { useState, useEffect } from 'react'
import { Drawer } from 'antd'
import styles from './styles.module.less'
import __ from './locale'
import CommonTitle from '../DemandManagement/CommonTitle'
import DemandInfo from '../DemandManagement/Details/DemandInfo'
import DemandItems from '../DemandManagement/Details/DemandItems'
import { formatError, IDemandDetails, getDetailsOfDemand } from '@/core'
import { Empty } from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'

interface IDetailDrawer {
    id: string
    analysisId: string
    open: boolean
    onCancel: () => void
}
function DetailDrawer({ id, analysisId, open, onCancel }: IDetailDrawer) {
    const [details, setDetails] = useState<IDemandDetails>()

    useEffect(() => {
        getDetails()
    }, [id, analysisId])

    const handleCancel = () => {
        onCancel()
    }
    const getDetails = async () => {
        try {
            if (!analysisId) return
            const ress = await getDetailsOfDemand(
                {
                    id,
                    fields: ['basic_info', 'analysis_result'],
                },
                { view: 'auditor', analysis_id: analysisId },
            )
            setDetails(ress)
        } catch (err) {
            formatError(err)
        }
    }

    return (
        <Drawer
            title={__('查看需求分析详情')}
            placement="right"
            onClose={handleCancel}
            open={open}
            width="calc(100% - 220px)"
            push={false}
        >
            {analysisId ? (
                <div className={styles.modalContent}>
                    <DemandInfo details={details?.basic_info} />
                    <DemandItems
                        demandItems={details?.analysis_result?.items || []}
                        applyReason={details?.analysis_result?.apply_reason}
                        isAudit
                    />
                    <CommonTitle title={__('需求可行性结论')} />
                    <div className={styles.row}>
                        <div className={styles.label}>
                            {__('分析结论说明：')}
                        </div>
                        <div className={styles.value}>
                            {details?.analysis_result?.conclusion || '--'}
                        </div>
                    </div>
                </div>
            ) : (
                <div className={styles.emptyBox}>
                    <Empty iconSrc={dataEmpty} desc={__('暂无数据')} />
                </div>
            )}
        </Drawer>
    )
}

export default DetailDrawer
