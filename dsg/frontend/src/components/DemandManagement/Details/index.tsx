import { useNavigate, useSearchParams } from 'react-router-dom'
import React, { useEffect, useState } from 'react'
import __ from '../locale'
import styles from './styles.module.less'
import OperateRecord from './OperateRecord'
import Progress from './Progress'
import DemandInfo from './DemandInfo'
import DemandItems from './DemandItems'
import CommonTitle from '../CommonTitle'
import { BackUrlType, DemandStatusEnum } from '../const'
import {
    DemandDetailView,
    DemandPhaseEnum,
    IDemandDetails,
    IDemandItemInfo,
    formatError,
    getAuditProcessFromConfCenter,
    getDetailsOfDemand,
} from '@/core'
import { Return } from '@/ui'

const Details = () => {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const demandId = searchParams.get('demandId') || ''
    const demandName = searchParams.get('demandName') || ''
    const view = searchParams.get('view') || 'applier'
    const backUrl = searchParams.get('backUrl') || ''
    const isBack = (searchParams.get('backUrl') || '').includes('demand-mgt')
    const [details, setDetails] = useState<IDemandDetails>()
    const [applyRescList, setApplyRescList] = useState<IDemandItemInfo[]>()
    const [existPermissionReq, setExistPermissionReq] = useState(true)

    const getDetails = async () => {
        const res = await getDetailsOfDemand(
            {
                id: demandId,
                fields: [
                    'basic_info',
                    'process_info',
                    'log',
                    'analysis_result',
                    'implement_result',
                ],
            },
            { view: view as DemandDetailView },
        )
        setDetails(res)
        const items = res?.analysis_result?.items
        const apply_details = res?.implement_result?.apply_details
        const applyAuthPhaseList = {}
        apply_details?.forEach((applyItem) => {
            applyAuthPhaseList[applyItem?.res_id] = applyItem
        })
        const newApplyResces = items?.map((item) => {
            return {
                ...item,
                ...applyAuthPhaseList[item?.res_id],
            }
        })
        setApplyRescList(newApplyResces)
    }

    // 获取是否配置权限申请审核策略
    const getAuditProcess = async () => {
        try {
            const res = await getAuditProcessFromConfCenter({
                audit_type: 'af-data-permission-request',
            })
            setExistPermissionReq(res.entries?.length > 0)
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        getDetails()
        getAuditProcess()
    }, [])

    const onReturn = () => {
        switch (backUrl) {
            case BackUrlType.Apply:
                // navigate('/demand-application')
                navigate(`/my-assets/?menuType=myDemand`)
                break
            case BackUrlType.Sign:
                navigate('/demand-hall')
                break
            case BackUrlType.Todo:
                navigate('/demand-mgt?tab=todo')
                break
            case BackUrlType.Handle:
                navigate('/demand-mgt?tab=done')
                break
            default:
        }
    }

    return (
        <div className={styles['details-wrapper']}>
            <div className={styles.header}>
                <Return onReturn={onReturn} title={demandName} />
            </div>
            <div className={styles.body}>
                <div className={styles['details-content-container']}>
                    <Progress
                        status={DemandStatusEnum.Analysising}
                        progress={details?.process_info || []}
                    />
                    <div className={styles['details-content']}>
                        <DemandInfo details={details?.basic_info} />
                        {details?.process_info.find(
                            (p) => p.phase === DemandPhaseEnum.Analysis,
                        )?.op_user && (
                            <>
                                <DemandItems
                                    demandItems={applyRescList || []}
                                    applyReason={
                                        details?.analysis_result?.apply_reason
                                    }
                                    isAudit
                                    existPermissionReq={existPermissionReq}
                                />
                                <div className={styles.conclusion}>
                                    <CommonTitle title={__('需求可行性结论')} />
                                    <div className={styles.row}>
                                        <div className={styles.label}>
                                            {__('分析结论说明：')}
                                        </div>
                                        <div className={styles.value}>
                                            {details?.analysis_result
                                                ?.conclusion || '--'}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                        {details?.process_info.find(
                            (p) => p.phase === DemandPhaseEnum.implementAccept,
                        )?.op_user && (
                            <div className={styles.feedback}>
                                <CommonTitle title={__('验收反馈')} />
                                <div className={styles.row}>
                                    <div className={styles.label}>
                                        {__('反馈内容：')}
                                    </div>
                                    <div className={styles.value}>
                                        {details?.implement_result
                                            ?.accept_feedback || '--'}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <OperateRecord logs={details?.log || []} />
            </div>
        </div>
    )
}

export default Details
