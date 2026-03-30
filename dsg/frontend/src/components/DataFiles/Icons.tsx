import React, { ReactNode } from 'react'
import {
    BusinessFormOutlined,
    BusinessMattersOutlined,
    BusinessSystemOutlined,
    ContainerOutlined,
    CoreBusinessOutlined,
    DepartmentOutlined,
    DistrictOutlined,
    DomainOutlined,
    OrganizationOutlined,
} from '@/icons'
import { Architecture } from './const'
import styles from './styles.module.less'

interface IGetIcon {
    type: Architecture
    className?: string
    isColored?: boolean
}

const Icons: React.FC<IGetIcon> = ({ type, isColored }) => {
    const getIcon = (t: Architecture) => {
        switch (t) {
            case Architecture.DOMAIN:
                return (
                    <DomainOutlined style={{ color: isColored && '#3A8FF0' }} />
                )
            case Architecture.DISTRICT:
                return (
                    <DistrictOutlined
                        style={{ color: isColored && '#3A8FF0' }}
                    />
                )
            case Architecture.ORGANIZATION:
                return (
                    <OrganizationOutlined
                        style={{ color: isColored && '#3A8FF0' }}
                    />
                )
            case Architecture.DEPARTMENT:
                return (
                    <DepartmentOutlined
                        style={{ color: isColored && '#3A8FF0' }}
                    />
                )
            case Architecture.BSYSTEM:
                return (
                    <BusinessSystemOutlined
                        style={{ color: isColored && '#3A8FF0' }}
                    />
                )
            case Architecture.BMATTERS:
                return (
                    <BusinessMattersOutlined
                        style={{ color: isColored && '#3A8FF0' }}
                    />
                )
            case Architecture.BFORM:
                return (
                    <BusinessFormOutlined
                        style={{ color: isColored && '#3A8FF0' }}
                    />
                )
            case Architecture.BSYSTEMCONTAINER:
                return (
                    <ContainerOutlined
                        style={{ color: isColored && '#3A8FF0' }}
                    />
                )
            case Architecture.BMATTERSCONTAINER:
                return (
                    <ContainerOutlined
                        style={{ color: isColored && '#3A8FF0' }}
                    />
                )
            case Architecture.COREBUSINESS:
                return (
                    <CoreBusinessOutlined
                        style={{ color: isColored && '#3A8FF0' }}
                    />
                )
            default:
                return (
                    <DomainOutlined style={{ color: isColored && '#3A8FF0' }} />
                )
        }
    }
    return getIcon(type)
}
export default Icons
