import React from 'react'
import { BusinessDomainLevelTypes } from '@/core'
import {
    BusinessDomainColored,
    BusinessDomainGroupColored,
    BusinessDomainGroupOutlined,
    BusinessDomainOutlined,
    BusinessProcessColored,
    BusinessProcessOutlined,
    BusinessSystemOutlined,
} from '@/icons'

interface IBusinessDomainLevelIcon {
    isColored?: boolean
    type: BusinessDomainLevelTypes
    className?: string
}
const BusinessDomainLevelIcon: React.FC<IBusinessDomainLevelIcon> = ({
    isColored = false,
    type,
    className,
}) => {
    switch (type) {
        case BusinessDomainLevelTypes.DomainGrouping:
            return isColored ? (
                <BusinessDomainGroupColored className={className} />
            ) : (
                <BusinessDomainGroupOutlined className={className} />
            )
        case BusinessDomainLevelTypes.Domain:
            return isColored ? (
                <BusinessDomainColored className={className} />
            ) : (
                <BusinessDomainOutlined className={className} />
            )
        case BusinessDomainLevelTypes.Process:
            return isColored ? (
                <BusinessProcessColored className={className} />
            ) : (
                <BusinessProcessOutlined className={className} />
            )
        case BusinessDomainLevelTypes.Infosystem:
            return <BusinessSystemOutlined className={className} />
        default:
            return null
    }
}

export default BusinessDomainLevelIcon
