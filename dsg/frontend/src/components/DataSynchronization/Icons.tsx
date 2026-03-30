import React, { ReactNode } from 'react'
import {
    LimitModellined,
    LimitFieldlined,
    LimitDatellined,
    StringTypeOutlined,
    NumberTypeOutlined,
    BooleanTypeOutlined,
    BinaryTypeOutlined,
    UnkownTypeOutlined,
    FontIcon,
} from '@/icons'
import styles from './styles.module.less'
import { dataTypeMapping } from '@/core'

interface IGetIcon {
    type: string
    fontSize?: number
    width?: number
    color?: string
}

const DataTypeIcons: React.FC<IGetIcon> = ({
    type,
    fontSize = 18,
    width = 20,
    color,
}) => {
    switch (true) {
        case dataTypeMapping.char.includes(type):
            return (
                <span className={styles.selectedOptionIcons} style={{ width }}>
                    <StringTypeOutlined style={{ fontSize, color }} />
                </span>
            )
        case dataTypeMapping.int.includes(type):
            return (
                <span className={styles.selectedOptionIcons} style={{ width }}>
                    <FontIcon style={{ fontSize }} name="icon-zhengshuxing" />
                </span>
            )
        case dataTypeMapping.float.includes(type):
            return (
                <span className={styles.selectedOptionIcons} style={{ width }}>
                    <FontIcon style={{ fontSize }} name="icon-xiaoshuxing" />
                </span>
            )
        case dataTypeMapping.decimal.includes(type):
            return (
                <span className={styles.selectedOptionIcons} style={{ width }}>
                    <FontIcon style={{ fontSize }} name="icon-gaojingduxing" />
                </span>
            )
        case dataTypeMapping.number.includes(type):
            return (
                <span className={styles.selectedOptionIcons} style={{ width }}>
                    <NumberTypeOutlined style={{ fontSize, color }} />
                </span>
            )
        case dataTypeMapping.bool.includes(type):
            return (
                <span className={styles.selectedOptionIcons} style={{ width }}>
                    <BooleanTypeOutlined style={{ fontSize, color }} />
                </span>
            )
        case dataTypeMapping.date.includes(type):
            return (
                <span className={styles.selectedOptionIcons} style={{ width }}>
                    <LimitDatellined
                        style={{ fontSize: fontSize - 4, color }}
                    />
                </span>
            )
        case dataTypeMapping.datetime.includes(type):
            return (
                <span className={styles.selectedOptionIcons} style={{ width }}>
                    <FontIcon
                        style={{ fontSize: fontSize - 4, color }}
                        name="icon-riqishijianxing"
                    />
                </span>
            )
        case dataTypeMapping.time.includes(type):
            return (
                <span className={styles.selectedOptionIcons} style={{ width }}>
                    <FontIcon
                        style={{ fontSize: fontSize - 4, color }}
                        name="icon-shijianchuoxing"
                    />
                </span>
            )
        case dataTypeMapping.interval.includes(type):
            return (
                <span className={styles.selectedOptionIcons} style={{ width }}>
                    <FontIcon
                        style={{ fontSize: fontSize - 4, color }}
                        name="icon-shijianduan11"
                    />
                </span>
            )
        case dataTypeMapping.binary.includes(type):
            return (
                <span className={styles.selectedOptionIcons} style={{ width }}>
                    <BinaryTypeOutlined
                        style={{ fontSize: fontSize - 4, color }}
                    />
                </span>
            )
        default:
            return (
                <span className={styles.selectedOptionIcons} style={{ width }}>
                    <UnkownTypeOutlined style={{ fontSize, color }} />
                </span>
            )
    }
}
export default DataTypeIcons
