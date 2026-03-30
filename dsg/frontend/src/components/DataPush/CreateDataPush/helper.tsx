import { FC, ReactNode } from 'react'
import { trim } from 'lodash'
import __ from '../locale'
import styles from './styles.module.less'

/**
 * 目标表类型
 */
export enum TargetTableType {
    // 新建
    Create = 0,
    // 选择
    Select,
}

export const targetTableTypeOptions = [
    { label: __('新建目标表'), value: TargetTableType.Create },
    { label: __('选择已有目标表'), value: TargetTableType.Select },
]

/**
 * 选择框无数据
 */
export const NotFoundContent: FC<{ text?: string }> = ({
    text = __('暂无数据'),
}) => <div style={{ color: 'rgba(0, 0, 0, 0.45)' }}>{text}</div>

/**
 * 选择框选项
 */
export const SelectOptionItem: FC<{
    name: string
    icon?: ReactNode
}> = ({ name, icon }) => {
    return (
        <div className={styles.selectOptionItem}>
            {icon && icon}
            <span className={styles.name} title={name}>
                {name}
            </span>
        </div>
    )
}

/**
 *  数据表数据格式化
 * @param field
 * @returns
 */
export const formatFieldData = (field) => {
    const { type, rowType, origType, ...rest } = field
    const { newType, length, field_precision } = splitDataType(origType)

    return {
        data_type: newType,
        data_length: length,
        precision: field_precision,
        ...rest,
    }
}

/**
 * 数据类型解构
 * @param dataType
 * @returns
 */
export const splitDataType = (dataType) => {
    const arr1 = dataType?.trim().split(' ')
    let arr2: string[] = []
    if (arr1.length === 1) {
        arr2 = trim(arr1[0].replace(/[()]/g, ' ')).split(' ')
    } else {
        arr2 = trim(arr1[1].replace(/[()]/g, ' ')).split(' ')
    }
    const [type, lengthData] = arr2
    let length: number | null = null
    let field_precision: number | null = null
    if (lengthData) {
        const typeInfo = lengthData.split(',')
        if (typeInfo.length > 1) {
            field_precision = Number(typeInfo[1])
        }
        length = Number(typeInfo[0])
    }
    return {
        newType: arr1.length === 1 ? type : arr1[0],
        length,
        field_precision,
    }
}
