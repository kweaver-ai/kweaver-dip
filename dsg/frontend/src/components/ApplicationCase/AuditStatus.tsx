import React from 'react'
import { Badge } from 'antd'
import { AuditResultStatusEnum, AuditResultStatusMapType } from './const'

interface IAuditStatus {
    status: AuditResultStatusEnum
    AuditResultStatusMap: AuditResultStatusMapType
}
const AuditStatus: React.FC<IAuditStatus> = ({
    status,
    AuditResultStatusMap,
}) => {
    return (
        <Badge
            color={AuditResultStatusMap[status].color}
            text={AuditResultStatusMap[status].text}
        />
    )
}
export default AuditStatus
