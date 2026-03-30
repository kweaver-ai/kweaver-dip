import { memo, useEffect, useState } from 'react'
import { message } from 'antd'
import { PolicyType } from './const'
import __ from './locale'
import styles from './styles.module.less'
import {
    createDemandAuditProcessV2,
    deleteDemandAuditProcessV2,
    formatError,
    getDemandAuditProcessV2List,
    updateDemandAuditProcessV2,
} from '@/core'
import WorkflowView from './WorkflowView'
import { IWorkflowInfo } from '../WorkflowViewPlugin'

const CurrentPolicyType = PolicyType.AfDataAnalRequireOutbound

function DataAnalysisOutbound() {
    const [workflow, setWorkflow] = useState<any>()
    const [loading, setLoading] = useState<boolean>(true)

    const getData = async () => {
        try {
            const process = await getDemandAuditProcessV2List(CurrentPolicyType)
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
                await createDemandAuditProcessV2(processData)
                getData()
            } else {
                await updateDemandAuditProcessV2({
                    id: workflow?.id,
                    ...processData,
                })
            }
        } catch (error) {
            formatError(error)
        }
    }

    const handleUnbind = async () => {
        try {
            await deleteDemandAuditProcessV2(workflow?.id)
            setWorkflow(undefined)
            message.success(__('解绑成功'))
        } catch (error) {
            formatError(error)
        }
    }
    return (
        <div className={styles['policy-container']}>
            <WorkflowView
                title={__('分析成果出库申请')}
                tip={__(
                    '设置审核流程后，用户申报的需求通过审核后才会生效；若未设置审核流程，默认自动通过无需审核',
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

export default memo(DataAnalysisOutbound)
