import { memo, useEffect, useState } from 'react'
import { message } from 'antd'
import { PolicyType } from './const'
import __ from './locale'
import styles from './styles.module.less'
import {
    bindSSZDDemandAuditProcess,
    deleteSSZDDemandAuditProcess,
    formatError,
    getSSZDDemandAuditProcess,
    updateSSZDDemandAuditProcess,
} from '@/core'
import WorkflowView from './WorkflowView'
import { IWorkflowInfo } from '../WorkflowViewPlugin'

const CurrentPolicyType = PolicyType.SSZDResourceReportApprove
/**
 * 省市直达-资源上报
 */
function SSZDResourceReportApprove() {
    const [workflow, setWorkflow] = useState<any>()
    const [loading, setLoading] = useState<boolean>(true)

    const getData = async () => {
        try {
            const process = await getSSZDDemandAuditProcess({
                audit_type: CurrentPolicyType,
            })
            setWorkflow(process?.entries?.[0])
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        setLoading(true)
        getData()
    }, [])

    const handleSaveWorkflow = async (workflowInfo: IWorkflowInfo) => {
        const processData = {
            audit_type: CurrentPolicyType,
            proc_def_key: workflowInfo.process_def_key,
        }

        try {
            if (!workflow) {
                await bindSSZDDemandAuditProcess(processData)
                getData()
            } else {
                await updateSSZDDemandAuditProcess(workflow?.id, processData)
            }
        } catch (error) {
            formatError(error)
        }
    }

    const handleUnbind = async () => {
        try {
            await deleteSSZDDemandAuditProcess(workflow?.id)
            setWorkflow(undefined)
            message.success(__('解绑成功'))
        } catch (error) {
            formatError(error)
        }
    }
    return (
        <div className={styles['policy-container']}>
            <WorkflowView
                title={__('资源上报申请')}
                tip={__(
                    '设置审核流程后，用户申请省级数据时需要本州市审核，审核通过后可上报到省平台；若未设置审核流程，默认自动通过无需审核',
                )}
                type={CurrentPolicyType}
                data={workflow}
                loading={loading}
                onSave={handleSaveWorkflow}
                onUnBind={handleUnbind}
            />
        </div>
    )
}

export default memo(SSZDResourceReportApprove)
