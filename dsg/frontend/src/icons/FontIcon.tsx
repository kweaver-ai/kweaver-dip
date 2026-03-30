import { CSSProperties, FC, HTMLProps } from 'react'
import classnames from 'classnames'
import styles from './styles.module.less'
import { IconType } from './const'

export interface IFontIcon extends HTMLProps<HTMLSpanElement> {
    name: string
    type?: IconType
    style?: CSSProperties | undefined
    rotate?: number // 图标旋转角度
    spin?: boolean // 是否有旋转动画
}

const FontIcon: FC<IFontIcon> = ({
    name,
    className = '',
    type = IconType.FONTICON,
    style = {},
    rotate = 0,
    spin = false,
    ...props
}) => {
    if (type === IconType.FONTICON) {
        return (
            <i
                className={classnames('iconfont', name, className)}
                style={{
                    transform: `rotate(${rotate}deg)`,
                    animation: spin
                        ? 'loadingCircle 1s infinite linear'
                        : 'none',
                    ...style,
                }}
                {...props}
            />
        )
    }
    return (
        <span
            className={className}
            {...props}
            style={{
                lineHeight: 1,
                transform: `rotate(${rotate}deg)`,
                animation: spin ? 'loadingCircle 1s infinite linear' : 'none',
                ...style,
            }}
        >
            <svg aria-hidden="true" className={styles.newIcon}>
                <use xlinkHref={`#${name}`} />
            </svg>
        </span>
    )
}

export default FontIcon
