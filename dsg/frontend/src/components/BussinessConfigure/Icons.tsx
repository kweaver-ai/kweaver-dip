import React from 'react'
import {
    LimitDatellined,
    StringTypeOutlined,
    NumberTypeOutlined,
    BooleanTypeOutlined,
    FontIcon,
    UnkownTypeOutlined,
} from '@/icons'
import styles from './styles.module.less'
import __ from './locale'
import { dataTypeMapping } from '@/core'

interface IGetIcon {
    type: string
    fontSize?: number
    width?: number
}

const Icons: React.FC<IGetIcon> = ({ type, fontSize = 18, width = 20 }) => {
    switch (true) {
        case dataTypeMapping.char.includes(type) || type === '字符型':
            return (
                <span
                    className={styles.selectedOptionIcons}
                    style={{ width }}
                    title={__('字符型')}
                >
                    <StringTypeOutlined style={{ fontSize }} />
                </span>
            )
        case dataTypeMapping.int.includes(type) || type === '整数型':
            return (
                <span
                    className={styles.selectedOptionIcons}
                    style={{ width }}
                    title={__('整数型')}
                >
                    <FontIcon style={{ fontSize }} name="icon-zhengshuxing" />
                </span>
            )
        case dataTypeMapping.float.includes(type) || type === '小数型':
            return (
                <span
                    className={styles.selectedOptionIcons}
                    style={{ width }}
                    title={__('小数型')}
                >
                    <FontIcon style={{ fontSize }} name="icon-xiaoshuxing" />
                </span>
            )
        case dataTypeMapping.decimal.includes(type) || type === '高精度型':
            return (
                <span
                    className={styles.selectedOptionIcons}
                    style={{ width }}
                    title={__('高精度型')}
                >
                    <FontIcon style={{ fontSize }} name="icon-gaojingduxing" />
                </span>
            )
        // 将数字型分为整数型、小数型、高精度型
        case dataTypeMapping.number.includes(type) || type === '数字型':
            return (
                <span
                    className={styles.selectedOptionIcons}
                    style={{ width }}
                    title={__('数字型')}
                >
                    <NumberTypeOutlined style={{ fontSize }} />
                </span>
            )
        case dataTypeMapping.bool.includes(type) || type === '布尔型':
            return (
                <span
                    className={styles.selectedOptionIcons}
                    style={{ width }}
                    title={__('布尔型')}
                >
                    <BooleanTypeOutlined style={{ fontSize }} />
                </span>
            )
        case dataTypeMapping.date.includes(type) || type === '日期型':
            return (
                <span
                    className={styles.selectedOptionIcons}
                    style={{ width }}
                    title={__('日期型')}
                >
                    <LimitDatellined style={{ fontSize: fontSize - 4 }} />
                </span>
            )
        // 时间戳”类型合并到“日期时间型”
        case dataTypeMapping.datetime.includes(type) || type === '日期时间型':
            return (
                <span
                    className={styles.selectedOptionIcons}
                    style={{ width }}
                    title={__('日期时间型')}
                >
                    <FontIcon
                        style={{ fontSize: fontSize - 4 }}
                        name="icon-riqishijianxing"
                    />
                </span>
            )
        case dataTypeMapping.time.includes(type) || type === '时间型':
            return (
                <span
                    className={styles.selectedOptionIcons}
                    style={{ width }}
                    title={__('时间型')}
                >
                    <FontIcon
                        style={{ fontSize: fontSize - 4 }}
                        name="icon-shijianchuoxing"
                    />
                </span>
            )

        default:
            return (
                <span
                    className={styles.selectedOptionIcons}
                    style={{ width }}
                    title={__('未知')}
                >
                    <UnkownTypeOutlined style={{ fontSize: fontSize - 4 }} />
                </span>
            )
    }
}

export default Icons
