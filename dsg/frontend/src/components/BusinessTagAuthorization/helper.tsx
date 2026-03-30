import { TooltipPlacement } from 'antd/es/tooltip'
import { Tooltip } from 'antd'
import { InfoCircleOutlined } from '@ant-design/icons'

import styles from './styles.module.less'
import __ from './locale'

interface ITipsLabel {
    label: any
    tips?: any
    icon?: any
    placement?: TooltipPlacement
    maxWidth?: string
}

export const TipsLabel = ({
    label,
    tips,
    icon = <InfoCircleOutlined />,
    placement = 'bottomLeft',
    maxWidth = '900px',
}: ITipsLabel) => {
    return (
        <span>
            <span style={{ marginRight: 5 }}>{label}</span>
            {tips && (
                <Tooltip
                    color="#fff"
                    overlayInnerStyle={{
                        color: 'rgba(0,0,0,0.85)',
                    }}
                    overlayStyle={{ maxWidth }}
                    title={tips}
                    placement={placement}
                    overlayClassName="datasheetViewTreeTipsBox"
                >
                    {icon}
                </Tooltip>
            )}
        </span>
    )
}
