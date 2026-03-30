import React, { memo, useEffect, useState } from 'react'
import { message } from 'antd'
import {
    createDemandAuditProcessV2,
    deleteDemandAuditProcessV2,
    formatError,
    getDemandAuditProcessV2List,
    updateDemandAuditProcessV2,
} from '@/core'
import { IWorkflowInfo } from '../WorkflowViewPlugin'
import WorkflowView from './WorkflowView'
import { PolicyType } from './const'
import { getSelectedProcess } from './helper'
import __ from './locale'
import styles from './styles.module.less'

const CurrentPolicyType = PolicyType.DataRequirementAnalysis

const DataRequirement: React.FC = () => {
    const [workflow, setWorkflow] = useState<any>()
    const [loading, setLoading] = useState<boolean>(true)

    const getData = async () => {
        try {
            const demandAnalysisProcess = await getDemandAuditProcessV2List(
                CurrentPolicyType,
            )
            const analysisData = getSelectedProcess(
                demandAnalysisProcess?.entries,
                CurrentPolicyType,
            )
            setWorkflow(analysisData?.[0])
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
                title={__('数据需求方案审核')}
                tip={
                    !workflow
                        ? __(
                              '设置后，用户提交需求分析确认时需要审核，审核通过后需求分析可提交成功；若未设置，默认自动通过无需审核',
                          )
                        : undefined
                }
                type={CurrentPolicyType}
                data={workflow}
                loading={loading}
                onSave={handleSaveWorkflow}
                onUnBind={handleUnbind}
            />
        </div>
    )
}

export default memo(DataRequirement)
