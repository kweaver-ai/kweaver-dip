import React, { ReactNode } from 'react'
import {
    LimitDatellined,
    StringTypeOutlined,
    NumberTypeOutlined,
    BooleanTypeOutlined,
    BinaryTypeOutlined,
} from '@/icons'
import styles from './styles.module.less'

interface IGetIcon {
    type: string
    fontSize?: number
    width?: number
}

const Icons: React.FC<IGetIcon> = ({ type, fontSize = 18, width = 20 }) => {
    switch (type) {
        case 'char':
            return (
                <span className={styles.selectedOptionIcons} style={{ width }}>
                    <StringTypeOutlined
                        style={{ fontSize }}
                        className={styles.icon}
                    />
                </span>
            )
        case 'number':
            return (
                <span className={styles.selectedOptionIcons} style={{ width }}>
                    <NumberTypeOutlined
                        style={{ fontSize }}
                        className={styles.icon}
                    />
                </span>
            )
        case 'bool':
            return (
                <span className={styles.selectedOptionIcons} style={{ width }}>
                    <BooleanTypeOutlined
                        style={{ fontSize }}
                        className={styles.icon}
                    />
                </span>
            )
        case 'date':
            return (
                <span className={styles.selectedOptionIcons} style={{ width }}>
                    <LimitDatellined
                        style={{ fontSize: fontSize - 4 }}
                        className={styles.icon}
                    />
                </span>
            )
        case 'datetime':
            return (
                <span className={styles.selectedOptionIcons} style={{ width }}>
                    <LimitDatellined
                        style={{ fontSize: fontSize - 4 }}
                        className={styles.icon}
                    />
                </span>
            )
        case 'timestamp':
            return (
                <span className={styles.selectedOptionIcons} style={{ width }}>
                    <LimitDatellined
                        style={{ fontSize: fontSize - 4 }}
                        className={styles.icon}
                    />
                </span>
            )
        case 'binary':
            return (
                <span className={styles.selectedOptionIcons} style={{ width }}>
                    <BinaryTypeOutlined
                        style={{ fontSize: fontSize - 4 }}
                        className={styles.icon}
                    />
                </span>
            )

        default:
            return (
                <span
                    className={styles.selectedOptionIcons}
                    style={{ width }}
                />
            )
    }
}

export default Icons
