import React, { ReactNode } from 'react'
import {
    LimitModellined,
    LimitFieldlined,
    LimitDatellined,
    StringTypeOutlined,
    NumberTypeOutlined,
    BooleanTypeOutlined,
    BinaryTypeOutlined,
    FontIcon,
} from '@/icons'
import styles from './styles.module.less'
import { dataTypeMapping } from '@/core'

interface IGetIcon {
    type: string
    fontSize?: number
}

const Icons: React.FC<IGetIcon> = ({ type, fontSize = 18 }) => {
    switch (true) {
        case dataTypeMapping.char.includes(type):
            return (
                <StringTypeOutlined
                    style={{ fontSize }}
                    className={styles.icon}
                />
            )
        case dataTypeMapping.int.includes(type):
            return (
                <FontIcon
                    style={{ fontSize }}
                    name="icon-zhengshuxing"
                    className={styles.icon}
                />
            )
        case dataTypeMapping.float.includes(type):
            return (
                <FontIcon
                    style={{ fontSize }}
                    name="icon-xiaoshuxing"
                    className={styles.icon}
                />
            )
        case dataTypeMapping.decimal.includes(type):
            return (
                <FontIcon
                    style={{ fontSize }}
                    name="icon-gaojingduxing"
                    className={styles.icon}
                />
            )
        case dataTypeMapping.number.includes(type):
            return (
                <NumberTypeOutlined
                    style={{ fontSize }}
                    className={styles.icon}
                />
            )
        case dataTypeMapping.bool.includes(type):
            return (
                <BooleanTypeOutlined
                    style={{ fontSize }}
                    className={styles.icon}
                />
            )
        case dataTypeMapping.date.includes(type):
            return (
                <LimitDatellined
                    style={{ fontSize: fontSize - 4 }}
                    className={styles.icon}
                />
            )
        case dataTypeMapping.datetime.includes(type):
            return (
                <FontIcon
                    style={{ fontSize: fontSize - 4 }}
                    name="icon-riqishijianxing"
                />
            )
        case dataTypeMapping.time.includes(type):
            return (
                <FontIcon
                    style={{ fontSize: fontSize - 4 }}
                    name="icon-shijianchuoxing"
                />
            )
        case dataTypeMapping.interval.includes(type):
            return (
                <FontIcon
                    style={{ fontSize: fontSize - 4 }}
                    name="icon-shijianduan11"
                />
            )

        case dataTypeMapping.binary.includes(type):
            return (
                <BinaryTypeOutlined
                    style={{ fontSize }}
                    className={styles.icon}
                />
            )

        default:
            return <span />
    }
}

export default Icons
