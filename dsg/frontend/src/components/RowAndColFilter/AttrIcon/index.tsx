import React, { ReactElement, ReactNode } from 'react'
import styles from './styles.module.less'
import { FIELD_TYPE_EN, FIELD_TYPE_ICON, getTypeText } from '@/utils'
import { FontIcon, UnkownTypeOutlined } from '@/icons'
import { getFieldTypeIcon } from '@/components/DatasheetView/helper'

interface IAttrIcon {
    type: string
    size?: number
}

const WrapperIcon = (WrapperComponent: any, props: Record<string, any>) => (
    <WrapperComponent {...props} />
)

const SpecialTypes = [
    FIELD_TYPE_EN.DATE,
    FIELD_TYPE_EN.DATETIME,
    FIELD_TYPE_EN.TIMESTAMP,
]

const AttrIcon = ({ type, size = 18 }: IAttrIcon) => {
    const fieldType = getTypeText(type)
    // 日期类型图标大小问题
    const fontSize =
        SpecialTypes.includes(fieldType) || !fieldType ? size - 4 : size
    return getFieldTypeIcon({ type }, size, { 'margin-right': 6 })

    //  WrapperIcon(FIELD_TYPE_ICON?.[fieldType] || UnkownTypeOutlined, {
    //       style: { fontSize },
    //       className: styles.icon,
    //   })
}

export default AttrIcon
