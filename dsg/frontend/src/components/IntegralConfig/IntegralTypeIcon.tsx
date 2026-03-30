import { CSSProperties } from 'react'
import { FontIcon } from '@/icons'
import { IntegralType } from './const'

interface IntegralTypeIconProps {
    type: IntegralType
    style?: CSSProperties
}

const IntegralTypeIcon = ({ type, style }: IntegralTypeIconProps) => {
    switch (type) {
        case IntegralType.FEEDBACK_TYPE:
            return (
                <FontIcon
                    name="icon-fankui"
                    style={{ color: '#00A0CB', ...style }}
                />
            )
        case IntegralType.TASK_TYPE:
            return (
                <FontIcon
                    name="icon-xinjianrenwuanniu"
                    style={{ color: '#5B91FF', ...style }}
                />
            )
        case IntegralType.REQUIREMENTS_TYPE:
            return (
                <FontIcon
                    name="icon-wendang-xianxing"
                    style={{ color: '#FF822F', ...style }}
                />
            )
        default:
            return <div />
    }
}

export default IntegralTypeIcon
