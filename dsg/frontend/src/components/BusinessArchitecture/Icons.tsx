import React, { ReactNode } from 'react'
import {
    BusinessFormOutlined,
    BusinessMattersOutlined,
    BusinessSystemOutlined,
    ContainerOutlined,
    CoreBusinessOutlined,
    DistrictOutlined,
    DomainOutlined,
    DataCatalogOutlined,
    FontIcon,
} from '@/icons'
import { Architecture } from './const'
import styles from './styles.module.less'

interface IGetIcon {
    type: Architecture
    className?: string
    isColored?: boolean
    fontSize?: number
}

const Icons: React.FC<IGetIcon> = ({ type, isColored, fontSize = 16 }) => {
    const getIcon = (t: Architecture) => {
        switch (t) {
            case Architecture.DOMAIN:
                return (
                    <DomainOutlined
                        style={{ color: isColored && '#3A8FF0', fontSize }}
                    />
                )
            case Architecture.DISTRICT:
                return (
                    <DistrictOutlined
                        style={{ color: isColored && '#3A8FF0', fontSize }}
                    />
                )
            case Architecture.ORGANIZATION:
                return (
                    <FontIcon
                        name="icon-zuzhi1"
                        style={{
                            color: (isColored && '#3A8FF0') || undefined,
                            fontSize,
                        }}
                    />
                    // <OrganizationOutlined
                    //     style={{ color: isColored && '#3A8FF0', fontSize }}
                    // />
                )
            case Architecture.DEPARTMENT:
                return (
                    <FontIcon
                        name="icon-bumen1"
                        style={{
                            color: (isColored && '#3A8FF0') || undefined,
                            fontSize,
                        }}
                    />
                    // <DepartmentOutlined
                    //     style={{ color: isColored && '#3A8FF0', fontSize }}
                    // />
                )
            case Architecture.BSYSTEM:
                return (
                    <BusinessSystemOutlined
                        style={{ color: isColored && '#3A8FF0', fontSize }}
                    />
                )
            case Architecture.BMATTERS:
                return (
                    <BusinessMattersOutlined
                        style={{ color: isColored && '#3A8FF0', fontSize }}
                    />
                )
            case Architecture.BFORM:
                return (
                    <BusinessFormOutlined
                        style={{ color: isColored && '#3A8FF0', fontSize }}
                    />
                )
            case Architecture.BSYSTEMCONTAINER:
                return (
                    <ContainerOutlined
                        style={{ color: isColored && '#3A8FF0', fontSize }}
                    />
                )
            case Architecture.BMATTERSCONTAINER:
                return (
                    <ContainerOutlined
                        style={{ color: isColored && '#3A8FF0', fontSize }}
                    />
                )
            case Architecture.COREBUSINESS:
                return (
                    <CoreBusinessOutlined
                        style={{ color: isColored && '#3A8FF0', fontSize }}
                    />
                )
            case Architecture.DATACATALOG:
                return (
                    <DataCatalogOutlined
                        style={{ color: isColored && '#3A8FF0', fontSize }}
                    />
                )
            default:
                return (
                    <DomainOutlined
                        style={{ color: isColored && '#3A8FF0', fontSize }}
                    />
                )
        }
    }
    return getIcon(type)
}
export default Icons
