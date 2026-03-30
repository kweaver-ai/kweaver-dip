import React from 'react'
import { FontIcon } from '@/icons'
import { TabsKey } from './const'
import IndicatorManagementOutlined from '@/icons/IndicatorManagementOutlined'
import { IconType } from '@/icons/const'

interface IGetIcon {
    type?: string
    className?: string
    colored?: boolean
    fontSize?: number
    style?: any
}

const IndicatorIcons: React.FC<IGetIcon> = ({
    type,
    fontSize = 16,
    style = {},
    className = '',
}) => {
    const getIcon = (t?: string) => {
        switch (t) {
            case TabsKey.ATOMS:
                return (
                    <FontIcon
                        name="icon-yuanzizhibiaosuanzi"
                        type={IconType.COLOREDICON}
                        className={className}
                        style={{
                            fontSize,
                            ...style,
                        }}
                    />
                )
            case TabsKey.DERIVE:
                return (
                    <FontIcon
                        name="icon-yanshengzhibiaosuanzi"
                        type={IconType.COLOREDICON}
                        className={className}
                        style={{
                            fontSize,
                            ...style,
                        }}
                    />
                )
            case TabsKey.RECOMBINATION:
                return (
                    <FontIcon
                        name="icon-fuhezhibiaosuanzi"
                        type={IconType.COLOREDICON}
                        className={className}
                        style={{
                            fontSize,
                            ...style,
                        }}
                    />
                )
            default:
                return (
                    <IndicatorManagementOutlined
                        className={className}
                        style={{
                            color: '#fff',
                            fontSize,
                            ...style,
                        }}
                    />
                )
        }
    }
    return getIcon(type)
}

export default IndicatorIcons
