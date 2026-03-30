import { Drawer } from 'antd'
import { useEffect, useState } from 'react'
import BasicInfo from './BasicInfo'
import {
    DemandInfoFields,
    DepartmentInfoFields,
    SceneInfoFields,
} from './const'
import DataSource from './DataSource'
import {
    DemandDetailView,
    getSSZDDemandDetails,
    ISSZDDemandDetails,
} from '@/core'
import __ from '../locale'

interface IAuditDetails {
    open: boolean
    onClose: () => void
    title: string
    demandId: string
}
const AuditDetails = ({ open, onClose, title, demandId }: IAuditDetails) => {
    const [details, setDetails] = useState<ISSZDDemandDetails>()

    const getDetails = async () => {
        const res = await getSSZDDemandDetails({
            id: demandId,
            view: 'auditor',
            fields: [
                'basic_info',
                'log',
                'analysis_result',
                'implement_result',
            ].join(','),
        })
        setDetails(res)
    }

    useEffect(() => {
        if (demandId) {
            getDetails()
        }
    }, [demandId])

    return (
        <Drawer open={open} onClose={onClose} title={title} width={800}>
            <BasicInfo
                basicInfoFields={DemandInfoFields}
                details={details?.basic_info}
                title={__('需求信息')}
            />
            <DataSource basicInfo={details?.basic_info} showOperate={false} />
            <BasicInfo
                basicInfoFields={DepartmentInfoFields}
                details={details?.basic_info}
                title={__('部门信息')}
            />
            <BasicInfo
                basicInfoFields={SceneInfoFields}
                details={details?.basic_info}
                title={__('业务场景')}
            />
        </Drawer>
    )
}

export default AuditDetails
