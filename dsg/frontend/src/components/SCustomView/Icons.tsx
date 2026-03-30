import React, { ReactNode } from 'react'
import { IndicatorThinColored, FontIcon } from '@/icons'
import { FormulaType } from './const'
import { IconType } from '@/icons/const'

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
                    <FontIcon
                        name={
                            colored
                                ? 'icon-shujuguolvsuanzi'
                                : 'icon-shujuguolvsuanzi_hui'
                        }
                        style={{
                            fontSize,
                        }}
                        type={IconType.COLOREDICON}
                    />
                )
            case FormulaType.JOIN:
                return (
                    <FontIcon
                        name={
                            colored
                                ? 'icon-shujuguanliansuanzi'
                                : 'icon-shujuguanliansuanzi_hui'
                        }
                        style={{
                            fontSize,
                        }}
                        type={IconType.COLOREDICON}
                    />
                )
            case FormulaType.SELECT:
                return (
                    <FontIcon
                        name={
                            colored
                                ? 'icon-xuanzeliesuanzi'
                                : 'icon-xuanzeliesuanzi_hui'
                        }
                        style={{
                            fontSize,
                        }}
                        type={IconType.COLOREDICON}
                    />
                )
            case FormulaType.FORM:
                return (
                    <FontIcon
                        name={
                            colored
                                ? 'icon-shitusuanzi'
                                : 'icon-shitusuanzi_hui'
                        }
                        style={{
                            fontSize,
                        }}
                        type={IconType.COLOREDICON}
                    />
                )
            case FormulaType.INDICATOR:
                return (
                    <IndicatorThinColored
                        style={{
                            fontSize,
                            color: `${
                                colored
                                    ? 'rgba(18, 110, 227, 1)'
                                    : 'rgba(191, 191, 191, 1)'
                            } `,
                        }}
                    />
                )
            case FormulaType.MERGE:
                return (
                    <FontIcon
                        name={
                            colored
                                ? 'icon-shujuhebingsuanzi'
                                : 'icon-shujuhebingsuanzi_hui'
                        }
                        style={{
                            fontSize,
                        }}
                        type={IconType.COLOREDICON}
                    />
                )
            case FormulaType.DISTINCT:
                return (
                    <FontIcon
                        name={
                            colored
                                ? 'icon-shujuquzhongsuanzi'
                                : 'icon-shujuquzhongsuanzi_hui'
                        }
                        style={{
                            fontSize,
                        }}
                        type={IconType.COLOREDICON}
                    />
                )
            case FormulaType.OUTPUTVIEW:
                return (
                    <FontIcon
                        name={
                            colored ? 'icon-shuchushitu' : 'icon-shuchushituhui'
                        }
                        style={{
                            fontSize,
                        }}
                        type={IconType.COLOREDICON}
                    />
                )
            case FormulaType.SQL:
                return (
                    <FontIcon
                        name={colored ? 'icon-SQLsuanzi' : 'icon-SQLsuanzi_hui'}
                        style={{
                            fontSize,
                        }}
                        type={IconType.COLOREDICON}
                    />
                )
            default:
                return null
        }
    }
    return getIcon(type)
}
export default Icons
