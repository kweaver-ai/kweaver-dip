import { InfoCircleFilled } from '@ant-design/icons'
import { useHover } from 'ahooks'
import { Checkbox, Popover } from 'antd'
import classnames from 'classnames'
import { memo, useMemo, useRef } from 'react'
import { SortableHandle } from 'react-sortable-hoc'
import { IconType } from '@/icons/const'
import { DragOutlined, FontIcon } from '@/icons'
import { FieldLabel } from './FieldLabel'
import styles from './styles.module.less'
import { itemOtherInfo } from '@/components/DataAssetsCatlg/LogicViewDetail/helper'
import {
    changeFormatToType,
    currentTime,
    FieldTypes,
    formatDateForDisplay,
    getOperatorLabel,
    TimeDateOptions,
    timeFilterToChange,
} from '@/components/IndicatorManage/const'
import { dataTypeMapping } from '@/core'

export interface IFieldItem {
    item: any
    checked: boolean
    condition: any
    isFilterInvalid: boolean
    canViewChange?: boolean
    handleCheck?: (isChecked: boolean, item: any) => void
    handleConfCondition?: (item?: any) => void
    handleRemoveCondition?: (item?: any) => void
}

const DragHandle = SortableHandle(() => <DragOutlined />)

/**
 * 根据数据类型和操作符获取数据值结果
 * @param value 原始数据值
 * @param operator 操作符，用于改变数据值
 * @param dataType 数据类型，用于决定如何处理数据值
 * @param format 日期格式，用于日期类型的数据
 * @returns 根据不同的数据类型和操作符返回不同的数据值结果
 */
const getDataValueResult = (value, operator, dataType, format) => {
    // 如果数据类型是日期、日期时间或时间戳
    if ([FieldTypes.DATE, FieldTypes.DATETIME].includes(dataType)) {
        if (currentTime.includes(operator)) {
            const foundDateOptions = TimeDateOptions.find(
                (currentTimeOptions) => currentTimeOptions.value === value?.[0],
            )
            return foundDateOptions?.label || ''
        }

        // 使用时间过滤器根据操作符改变数据值
        const newValue = timeFilterToChange(value, operator)
        // 格式化日期并返回显示的字符串
        return `${formatDateForDisplay(
            newValue[0],
            format,
        )} - ${formatDateForDisplay(newValue[1], format)}`
    }
    // 如果操作符是'belong'
    if (operator === 'belong') {
        // 返回一个包含所有数据的div
        return (
            <div className={styles.viewTipBox}>
                {value.map((currentData) => (
                    <div className={styles.viewTipTag} title={currentData}>
                        {currentData}
                    </div>
                ))}
            </div>
        )
    }
    // 默认情况下返回第一个数据值
    return value[0]
}

const FieldItem = ({
    item,
    checked,
    condition,
    isFilterInvalid,
    handleCheck,
    handleConfCondition,
    handleRemoveCondition,
    canViewChange,
}: IFieldItem) => {
    const ref = useRef<HTMLDivElement | null>(null)
    const isHovering = useHover(ref)

    const isTimeType = useMemo(() => {
        return dataTypeMapping.time.includes(item?.data_type)
    }, [item?.data_type])

    return (
        <div
            ref={ref}
            key={item?.id}
            className={classnames({
                [styles['dragable-item']]: true,
                [styles['is-checked']]: !!checked,
                [styles['is-hover']]: checked && condition && !isFilterInvalid,
            })}
            onClick={() => {
                handleCheck?.(!checked, item)
            }}
        >
            <span
                className={styles['dragable-item-drag']}
                onClick={(e) => e.stopPropagation()}
            >
                {(checked || isHovering) && <DragHandle />}
            </span>
            <span className={styles['dragable-item-check']}>
                <Checkbox checked={checked} />
            </span>
            <div className={styles['dragable-item-title']}>
                <FieldLabel item={item} canViewChange={canViewChange} />
            </div>
            {/* {condition ? (
                <Popover
                    overlayClassName={styles['tool-pop']}
                    placement="rightTop"
                    arrowPointAtCenter
                    content={
                        <div className={styles['tool-pop-condition']}>
                            {isFilterInvalid && (
                                <div
                                    className={styles['tool-pop-condition-tip']}
                                >
                                    <InfoCircleFilled
                                        style={{
                                            color: '#126EE3',
                                            fontSize: '16px',
                                        }}
                                    />
                                    数据类型变更,条件已失效
                                </div>
                            )}
                            <div className={styles['tool-pop-condition-label']}>
                                过滤条件:
                            </div>
                            <div className={styles['tool-pop-condition-value']}>
                                {getOperatorLabel(
                                    condition?.operator,
                                    changeFormatToType(condition?.data_type),
                                )}
                            </div>
                            <div className={styles['tool-pop-condition-label']}>
                                过滤内容:
                            </div>
                            <div className={styles['tool-pop-condition-value']}>
                                {getDataValueResult(
                                    condition?.value,
                                    condition?.operator,
                                    changeFormatToType(condition?.data_type),
                                    condition?.format,
                                )}
                            </div>
                        </div>
                    }
                    title={
                        <div className={styles['tool-pop-title']}>
                            <div>过滤</div>
                            <div>
                                <a
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        handleRemoveCondition?.(item)
                                    }}
                                >
                                    清空条件
                                </a>
                            </div>
                        </div>
                    }
                >
                    <span
                        className={classnames(
                            styles.filter,
                            !!condition && styles['has-filter'],
                            isFilterInvalid && styles['is-invalid'],
                        )}
                        onClick={(e) => {
                            e.stopPropagation()
                            handleConfCondition?.(
                                isFilterInvalid ? item : condition,
                            )
                        }}
                    >
                        <FontIcon
                            name="icon-shaixuan"
                            type={IconType.FONTICON}
                        />
                    </span>
                </Popover>
            ) : isHovering && !isTimeType ? (
                <span
                    className={classnames(styles.filter)}
                    onClick={(e) => {
                        e.stopPropagation()
                        handleConfCondition?.(item)
                    }}
                >
                    <FontIcon name="icon-shaixuan" type={IconType.FONTICON} />
                </span>
            ) : undefined} */}
        </div>
    )
}

export default memo(FieldItem)
