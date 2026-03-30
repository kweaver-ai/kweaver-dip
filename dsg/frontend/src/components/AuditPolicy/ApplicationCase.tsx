import { memo, useEffect, useState } from 'react'
import { message } from 'antd'
import { PolicyType } from './const'
import __ from './locale'
import styles from './styles.module.less'
import {
    bindSSZDAuditProcess,
    deleteSSZDAuditProcess,
    formatError,
    getSSZDAuditProcess,
    updateSSZDAuditProcess,
} from '@/core'
import WorkflowView from './WorkflowView'
import { IWorkflowInfo } from '../WorkflowViewPlugin'

interface IApplicationCase {
    audit_type:
        | PolicyType.SSZDApplicationCaseReport
        | PolicyType.SSZDApplicationCaseOffline
}
function ApplicationCase({ audit_type }: IApplicationCase) {
    const [workflow, setWorkflow] = useState<any>()
    const [loading, setLoading] = useState<boolean>(true)

    const getData = async () => {
        try {
            const process = await getSSZDAuditProcess({
                audit_type,
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
            audit_type,
            proc_def_key: workflowInfo.process_def_key,
        }

        try {
            if (!workflow) {
                await bindSSZDAuditProcess(processData)
                getData()
            } else {
                await updateSSZDAuditProcess(workflow?.id, processData)
            }
        } catch (error) {
            formatError(error)
        }
    }

    const handleUnbind = async () => {
        try {
            await deleteSSZDAuditProcess(workflow?.id)
            setWorkflow(undefined)
            message.success(__('解绑成功'))
        } catch (error) {
            formatError(error)
        }
    }
    return (
        <div className={styles['policy-container']}>
            <WorkflowView
                title={
                    audit_type === PolicyType.SSZDApplicationCaseReport
                        ? __('应用案例上报')
                        : __('应用案例下架')
                }
                tip={
                    audit_type === PolicyType.SSZDApplicationCaseReport
                        ? __(
                              '设置审核流程后，用户申请应用案例上报时需要本市州审核，审核通过后可上报到省平台；若未设置审核流程，默认自动通过无需审核',
                          )
                        : __(
                              '设置审核流程后，用户申请应用案例下架时需要本市州审核，审核通过后可从省平台下架；若未设置审核流程，默认自动通过无需审核',
                          )
                }
                type={audit_type}
                data={workflow}
                loading={loading}
                onSave={handleSaveWorkflow}
                onUnBind={handleUnbind}
            />
        </div>
    )
}

export default memo(ApplicationCase)
