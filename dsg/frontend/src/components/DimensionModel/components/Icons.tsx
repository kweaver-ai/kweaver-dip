import React from 'react'
import {
    LimitDatellined,
    StringTypeOutlined,
    NumberTypeOutlined,
    BooleanTypeOutlined,
    BinaryTypeOutlined,
    UnkownTypeOutlined,
    FontIcon,
} from '@/icons'
import styles from '../styles.module.less'
import { dataTypeMapping } from '@/core'

interface IGetIcon {
    type: string
    fontSize?: number
    width?: number
}

const DataTypeIcons: React.FC<IGetIcon> = ({
    type,
    fontSize = 16,
    width = 20,
}) => {
    switch (true) {
        case dataTypeMapping.char.includes(type):
            return (
                <span className={styles['attr-icons']} style={{ width }}>
                    <StringTypeOutlined style={{ fontSize }} />
                </span>
            )
        case dataTypeMapping.int.includes(type):
            return <FontIcon style={{ fontSize }} name="icon-zhengshuxing" />
        case dataTypeMapping.float.includes(type):
            return <FontIcon style={{ fontSize }} name="icon-xiaoshuxing" />
        case dataTypeMapping.decimal.includes(type):
            return <FontIcon style={{ fontSize }} name="icon-gaojingduxing" />
        case dataTypeMapping.number.includes(type):
            return (
                <span className={styles['attr-icons']} style={{ width }}>
                    <NumberTypeOutlined style={{ fontSize }} />
                </span>
            )
        case dataTypeMapping.bool.includes(type):
            return (
                <span className={styles['attr-icons']} style={{ width }}>
                    <BooleanTypeOutlined style={{ fontSize }} />
                </span>
            )
        case dataTypeMapping.date.includes(type):
            return (
                <span className={styles['attr-icons']} style={{ width }}>
                    <LimitDatellined style={{ fontSize: fontSize - 4 }} />
                </span>
            )
        case dataTypeMapping.datetime.includes(type):
            return (
                <span className={styles['attr-icons']} style={{ width }}>
                    <FontIcon
                        name="icon-riqishijianxing"
                        style={{ fontSize: fontSize - 4 }}
                    />
                </span>
            )

        case dataTypeMapping.time.includes(type):
            return (
                <span className={styles['attr-icons']} style={{ width }}>
                    <FontIcon
                        name="icon-shijianchuoxing"
                        style={{ fontSize: fontSize - 4 }}
                    />
                </span>
            )
        case dataTypeMapping.interval.includes(type):
            return (
                <span className={styles['attr-icons']} style={{ width }}>
                    <FontIcon
                        name="icon-shijianduan11"
                        style={{ fontSize: fontSize - 4 }}
                    />
                </span>
            )

        case dataTypeMapping.binary.includes(type):
            return (
                <span className={styles['attr-icons']} style={{ width }}>
                    <BinaryTypeOutlined style={{ fontSize }} />
                </span>
            )
        default:
            return (
                <span className={styles['attr-icons']} style={{ width }}>
                    <UnkownTypeOutlined style={{ fontSize }} />
                </span>
            )
    }
}
export default DataTypeIcons
