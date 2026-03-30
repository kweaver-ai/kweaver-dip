import { useEffect, useState } from 'react'
import { formatError, getPolicyProcessList } from '@/core'

/** 查询流程配置信息 */
export const useAuditProcess = (params: {
    audit_type?: string
    service_type?: string
}): [any, () => Promise<void>] => {
    const [hasProcess, setHasProcess] = useState<any>()

    const getProcess = async () => {
        try {
            const res = await getPolicyProcessList(params)
            setHasProcess(res?.total_count > 0)
        } catch (err) {
            formatError(err)
        }
    }
    useEffect(() => {
        getProcess()
    }, [])

    return [hasProcess, getProcess]
}
