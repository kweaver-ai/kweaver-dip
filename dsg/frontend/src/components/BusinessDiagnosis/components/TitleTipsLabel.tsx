import { QuestionCircleOutlined } from '@ant-design/icons'
import { Tooltip } from 'antd'
import { HTMLAttributes } from 'react'

interface ITitleTipsLabel extends HTMLAttributes<HTMLSpanElement> {
    label: string
    tips?: string[]
    showDot?: boolean
    smallPadding?: boolean
    fontWeight?: number | string
    iconColor?: string
}

export const TitleTipsLabel = ({
    label,
    tips,
    showDot,
    smallPadding,
    fontWeight = 550,
    iconColor = 'rgb(0 0 0 / 45%)',
    ...props
}: ITitleTipsLabel) => {
    return (
        <span style={{ display: 'flex', alignItems: 'center' }} {...props}>
            <span style={{ marginRight: 5, fontWeight }}>{label}</span>
            {tips && (
                <Tooltip
                    autoAdjustOverflow
                    arrowPointAtCenter
                    color="white"
                    placement="bottom"
                    overlayClassName={`diagnosisDetailsTipsWrapper ${
                        smallPadding ? 'smallPadding' : ''
                    }`}
                    title={
                        <div className="titleTipsWrapper">
                            {tips.map((item) => {
                                return (
                                    <div className="titleTipsItem" key={item}>
                                        {showDot && <div className="dot" />}
                                        <div
                                            className={`text ${
                                                showDot ? 'dotText' : ''
                                            }`}
                                        >
                                            {item}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    }
                >
                    <QuestionCircleOutlined
                        style={{ color: iconColor, fontSize: 14 }}
                    />
                </Tooltip>
            )}
        </span>
    )
}
