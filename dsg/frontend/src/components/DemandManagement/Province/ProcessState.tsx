import React from 'react'
import { Badge } from 'antd'
import { DemandProcessStateEnum, DemandProcessStateMap } from './const'

interface IDemandStatus {
    status: DemandProcessStateEnum
}
const ProcessState: React.FC<IDemandStatus> = ({ status }) => {
    return (
        <div>
            <Badge
                color={DemandProcessStateMap[status].color}
                text={DemandProcessStateMap[status].text}
            />
        </div>
    )
}
export default ProcessState
