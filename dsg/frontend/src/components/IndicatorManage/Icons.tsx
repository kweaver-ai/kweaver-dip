import React from 'react'
import {
    OperationAtomicOutlined,
    OperationDerivedOutlined,
    OperationCalculateOutlined,
    OperationFromOutlined,
    OperationFilterOutlined,
} from '@/icons'
import { FormulaType } from './const'

interface IGetIcon {
    type: string
    className?: string
    colored?: boolean
    fontSize?: number
}

const Icons: React.FC<IGetIcon> = ({
    type,
    colored = false,
    fontSize = 16,
}) => {
    const getIcon = (t: string) => {
        switch (t) {
            case FormulaType.WHERE:
                return (
                    <OperationFilterOutlined
                        style={{
                            fontSize,
                            color: `${
                                colored ? '#8C7BEB' : 'rgba(191, 191, 191, 1)'
                            } `,
                        }}
                    />
                )
            case FormulaType.FORM:
                return (
                    <OperationFromOutlined
                        style={{
                            fontSize,
                            color: `${
                                colored ? '#14CEAA' : 'rgba(191, 191, 191, 1)'
                            } `,
                        }}
                    />
                )
            case FormulaType.ATOM:
                return (
                    <OperationAtomicOutlined
                        style={{
                            fontSize,
                            color: `${
                                colored
                                    ? 'rgba(0, 145, 255, 1)'
                                    : 'rgba(191, 191, 191, 1)'
                            } `,
                        }}
                    />
                )
            case FormulaType.DERIVED:
                return (
                    <OperationDerivedOutlined
                        style={{
                            fontSize,
                            color: `${
                                colored ? '#FF822F' : 'rgba(191, 191, 191, 1)'
                            } `,
                        }}
                    />
                )
            case FormulaType.INDICATOR_MEASURE:
                return (
                    <OperationCalculateOutlined
                        style={{
                            fontSize,
                            color: `${
                                colored ? '#FF9F00' : 'rgba(191, 191, 191, 1)'
                            } `,
                        }}
                    />
                )

            default:
                return null
        }
    }
    return getIcon(type)
}

export default Icons
