import classnames from 'classnames'
import { Button, Space } from 'antd'
import { InfoCircleFilled } from '@ant-design/icons'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import CommonTitle from './CommonTitle'
import DemandInfo from './Details/DemandInfo'
import DemandItems from './Details/DemandItems'
import __ from './locale'
import { TextAreaView } from '../AutoFormView/baseViewComponents'
import { htmlDecodeByRegExp } from '../ResourcesDir/const'
import Reject from './Reject'
import styles from './styles.module.less'
import {
    IAnalysisResult,
    analysisConfirmV2,
    formatError,
    getDemandAnalysisResultV2,
    IDemandDetails,
    getDetailsOfDemand,
    getAuditProcessFromConfCenter,
} from '@/core'
import Confirm from '../Confirm'
import { Return } from '@/ui'

const AnalysisConfirm = () => {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const demandId = searchParams.get('demandId') || ''
    const demandName = searchParams.get('demandName') || ''
    const [rejectOpen, setRejectOpen] = useState(false)
    const [details, setDetails] = useState<IDemandDetails>()
    const [agreeOpen, setAgreeOpen] = useState(false)
    const [existPermissionReq, setExistPermissionReq] = useState(true)

    const getAnalysisRes = async () => {
        try {
            if (demandId) {
                const ress = await getDetailsOfDemand(
                    {
                        id: demandId,
                        fields: [
                            'process_info',
                            'log',
                            'basic_info',
                            'analysis_result',
                            'implement_result',
                        ],
                    },
                    { view: 'applier' },
                )
                setDetails(ress)
            }
        } catch (err) {
            formatError(err)
        }
    }

    useEffect(() => {
        getAnalysisRes()
    }, [demandId])

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
        getAuditProcess()
    }, [])

    const handleConfirm = async (reason?: string) => {
        try {
            await analysisConfirmV2(demandId, {
                confirm_result: reason ? 'reject' : 'pass',
                reject_reason: reason,
            })
            setRejectOpen(false)
            navigate('/demand-application')
        } catch (error) {
            formatError(error)
        }
    }

    return (
        <>
            <div className={styles['analysis-confirm-wrapper']}>
                <div className={styles.header}>
                    <Return
                        title={__('分析确认')}
                        onReturn={() => navigate('/demand-application')}
                    />
                </div>
                <div className={styles['analysis-confirm-body']}>
                    <div className={styles['analysis-confirm-content']}>
                        <div
                            className={styles['analysis-confirm-content-title']}
                        >
                            {__('需求分析确认')}
                        </div>

                        <div
                            className={styles['analysis-confirm-content-info']}
                        >
                            {details?.analysis_result?.audit_reject_reason && (
                                <div className={styles['reject-tip-container']}>
                                    <div className={styles['reject-tips']}>
                                        <div className={styles['reject-title']}>
                                            <InfoCircleFilled
                                                className={styles['tip-icon']}
                                            />
                                            {__('驳回说明')}
                                        </div>
                                        <div className={styles['reject-text']}>
                                            <TextAreaView
                                                initValue={htmlDecodeByRegExp(
                                                    details.analysis_result
                                                        .audit_reject_reason,
                                                )}
                                                rows={1}
                                                placement="end"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div
                                className={classnames(
                                    styles['content-padding'],
                                    styles['demand-info-title'],
                                )}
                            >
                                <CommonTitle title={__('需求信息')} />
                            </div>
                            <div className={styles['demand-info-container']}>
                                <DemandInfo
                                    isShowTitle={false}
                                    details={details?.basic_info}
                                />
                            </div>

                            <div className={styles['demand-items-container']}>
                                <DemandItems
                                    demandItems={
                                        details?.analysis_result?.items || []
                                    }
                                    applyReason={
                                        details?.analysis_result?.apply_reason
                                    }
                                    isAudit
                                    existPermissionReq={existPermissionReq}
                                />
                            </div>
                            <div
                                className={classnames(
                                    styles['content-padding'],
                                    styles['demand-info-title'],
                                )}
                            >
                                <CommonTitle title={__('需求可行性结论')} />
                            </div>
                            <div className={styles.row}>
                                <div className={styles.label}>
                                    {__('分析结论说明：')}
                                </div>
                                <div className={styles.value}>
                                    {details?.analysis_result?.conclusion ||
                                        '--'}
                                </div>
                            </div>
                        </div>
                        <div className={styles.footer}>
                            <Space size={14}>
                                <Button
                                    onClick={() =>
                                        navigate('/demand-application')
                                    }
                                >
                                    {__('取消')}
                                </Button>
                                <Button onClick={() => setRejectOpen(true)}>
                                    {__('驳回')}
                                </Button>
                                <Button
                                    type="primary"
                                    onClick={() => setAgreeOpen(true)}
                                >
                                    {__('同意')}
                                </Button>
                            </Space>
                        </div>
                    </div>
                </div>
            </div>
            <Reject
                open={rejectOpen}
                onClose={() => setRejectOpen(false)}
                onOk={handleConfirm}
            />
            <Confirm
                open={agreeOpen}
                title={__('确定通过此次分析结论吗？')}
                content={__('确认通过后，需求将会进入实施阶段。')}
                onOk={() => handleConfirm()}
                onCancel={() => {
                    setAgreeOpen(false)
                }}
                width={432}
            />
        </>
    )
}

export default AnalysisConfirm
