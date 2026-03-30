import React, { useEffect, useState } from 'react'
import { Tooltip } from 'antd'
import { getAuditLogs, getDocAuditBizDetails } from '@/core'

interface IAuditorTooltipProps {
    children: React.ReactNode
    auditApplyId: string
}

const AuditorTooltip = ({ children, auditApplyId }: IAuditorTooltipProps) => {
    const [auditorInfo, setAuditorInfo] = useState('')
    const [open, setOpen] = useState(false)

    const getAuditors = async (auditId: string) => {
        if (!auditId) {
            return
        }
        const res = await getDocAuditBizDetails(auditId)
        const logs = await getAuditLogs(res.proc_inst_id)
        const auditors = Array.from(
            new Set(
                logs[logs.length - 1].auditor_logs
                    ?.flat()
                    ?.map((item) => item.auditor_name) || [],
            ),
        )
        setAuditorInfo(`审核人：${auditors.join(', ')}`)
        setOpen(true)
    }

    useEffect(() => {
        if (auditApplyId) {
            getAuditors(auditApplyId)
        } else {
            setOpen(false)
        }
    }, [auditApplyId])

    return (
        <Tooltip open={open} placement="bottom" title={auditorInfo}>
            {children}
        </Tooltip>
    )
}

export default AuditorTooltip
