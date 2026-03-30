import { CSSProperties, ReactNode } from 'react'

export interface ILabelTitle {
    label: string
    fontSize?: number
    style?: CSSProperties
    icon?: ReactNode
}

const LabelTitle = ({
    label,
    fontSize = 14,
    style = {},
    icon,
}: ILabelTitle) => {
    return (
        <div
            style={{
                display: 'flex',
                width: '100%',
                alignItems: 'center',
                padding: '5px 0',
                background: 'rgb(0 55 150 / 2%)',
                color: 'rgb(0 0 0 / 85%)',
                fontSize: `${fontSize}px`,
                fontWeight: '550',
                ...style,
            }}
        >
            <span
                style={{
                    display: ' inline-block',
                    width: ' 2px',
                    height: ' 20px',
                    marginRight: '18px',
                    background: ' #126ee3',
                }}
            />
            <span style={{ marginRight: '4px' }}>{label}</span>
            {icon !== undefined && icon}
        </div>
    )
}

export default LabelTitle
