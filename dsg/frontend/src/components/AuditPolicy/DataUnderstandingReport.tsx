import { memo, useEffect, useState } from 'react'
import { message } from 'antd'
import { BizType, PolicyType } from './const'
import __ from './locale'
import styles from './styles.module.less'
import {
    getPolicyProcessList,
    createPolicyProcess,
    updatePolicyProcess,
    deletePolicyProcess,
    formatError,
} from '@/core'
import WorkflowView from './WorkflowView'
import { IWorkflowInfo } from '../WorkflowViewPlugin'

const CurrentPolicyType = PolicyType.DataUnderstandingReport
const CurrentBizType = BizType.TaskCenter
/**
 * 数据理解报告申请
 */
function DataUnderstandingReport() {
    const [workflow, setWorkflow] = useState<any>()
    const [loading, setLoading] = useState<boolean>(true)

    const getData = async () => {
        try {
            const process = await getPolicyProcessList({
                audit_type: CurrentPolicyType,
                service_type: CurrentBizType,
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
            service_type: CurrentBizType,
            proc_def_key: workflowInfo.process_def_key,
        }

        try {
            if (!workflow) {
                await createPolicyProcess(processData)
                getData()
            } else {
                await updatePolicyProcess({
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
            await deletePolicyProcess(workflow?.id)
            setWorkflow(undefined)
            message.success(__('解绑成功'))
        } catch (error) {
            formatError(error)
        }
    }
    return (
        <div className={styles['policy-container']}>
            <WorkflowView
                title={__('数据理解报告')}
                tip={__(
                    '设置后，用户提交数据理解报告时需要审核，审核通过后数据理解报告可生成成功；若未设置，默认自动通过无需审核',
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

export default memo(DataUnderstandingReport)
