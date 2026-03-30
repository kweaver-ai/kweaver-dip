import React, { CSSProperties } from 'react'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import {
    DSFormOutlined,
    StringTypeOutlined,
    LeftArrowOutlined,
    RightArrowOutlined,
    FontIcon,
} from '@/icons'
import { IconType } from './const'
import { IconType as FontIconType } from '@/icons/const'

interface IGetIcon {
    type: IconType
    showBadge?: boolean
    offset?: string[] | number[]
    className?: string
    style?: CSSProperties | undefined
}

const Icons: React.FC<IGetIcon> = (props: any) => {
    const { type, showBadge, offset = [0, 10], style = {} } = props
    const getIcon = (t: IconType) => {
        switch (t) {
            case IconType.DATASHEET:
                return (
                    <FontIcon
                        name="icon-shujubiaoshitu"
                        type={FontIconType.COLOREDICON}
                        {...props}
                    />
                )
            case IconType.STRING:
                return <StringTypeOutlined {...props} />
            case IconType.LEFTARROW:
                return <LeftArrowOutlined {...props} />
            case IconType.RIGHTARROW:
                return <RightArrowOutlined {...props} />
            case IconType.ERROR:
                return (
                    <ExclamationCircleOutlined
                        style={{ color: '#F5222D' }}
                        {...props}
                    />
                )
            case IconType.TYPETRANSFORM:
                return (
                    <FontIcon
                        type={FontIconType.FONTICON}
                        name="icon-zhuanhuanjiantou"
                        style={{ color: '#1890FF' }}
                        {...props}
                    />
                )
            default:
                return (
                    <DSFormOutlined
                        style={{ color: 'rgb(0 0 0 / 50%)' }}
                        {...props}
                    />
                )
        }
    }
    return getIcon(type)
}
export default Icons
