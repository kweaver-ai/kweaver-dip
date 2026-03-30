import React, { ReactNode } from 'react'
import classNames from 'classnames'
import styles from './styles.module.less'

interface ICustomRadio {
    value?: any
    onChange?: (val) => void
    options: { label: string | ReactNode; value: any }[]
    canCancel?: boolean
}
const CustomRadio: React.FC<ICustomRadio> = ({
    value,
    onChange,
    options,
    canCancel = true,
}) => {
    const onOptionClick = (val) => {
        onChange?.(value === val ? (canCancel ? undefined : val) : val)
    }

    return (
        <div className={styles.customRadioWrapper}>
            {options?.map((item) => {
                return (
                    <div
                        className={styles.radioItem}
                        onClick={() => onOptionClick(item.value)}
                        key={item.value}
                    >
                        <div
                            className={classNames(
                                styles.itemCircle,
                                value === item.value && styles.checked,
                            )}
                        >
                            <span className={styles.icon} />
                        </div>
                        <div className={styles.label}>{item.label}</div>
                    </div>
                )
            })}
        </div>
    )
}
export default CustomRadio
