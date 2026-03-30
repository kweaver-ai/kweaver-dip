import { Badge } from 'antd'
import React from 'react'
import { DemandStatusEnum, DemandStatusMap } from './const'

interface IDemandStatus {
    status: DemandStatusEnum
}
const DemandStatus: React.FC<IDemandStatus> = ({ status }) => {
    return (
        <div>
            <Badge
                color={DemandStatusMap[status].color}
                text={DemandStatusMap[status].text}
            />
        </div>
    )
}
export default DemandStatus
