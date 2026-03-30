import React, { useEffect, useState } from 'react'
import classnames from 'classnames'
import { FontIcon } from '@/icons'
import __ from './locale'
import styles from './styles.module.less'
import { colorList } from './const'
import { IconType } from '@/icons/const'

interface IConfigColor {
    value?: string
    onChange?: (val: string) => void
    disabledColors?: string[]
}
const ConfigColor: React.FC<IConfigColor> = ({
    value,
    onChange,
    disabledColors = [],
}) => {
    const [selectColor, setSelectColor] = useState<string>()

    // useEffect(() => {
    //     if (disabledColors.length > 0) {
    //         const res = colorList.find(
    //             (color) => !disabledColors.includes(color),
    //         )
    //         if (res) {
    //             setSelectColor(res)
    //             onChange?.(res)
    //         } else {
    //             setSelectColor(undefined)
    //             onChange?.('')
    //         }
    //     } else {
    //         setSelectColor(colorList[0])
    //         onChange?.(colorList[0])
    //     }
    // }, [disabledColors])

    useEffect(() => {
        if (value) {
            setSelectColor(value)
        }
    }, [value])

    const handleClick = (color: string) => {
        setSelectColor(color)
        onChange?.(color)
    }
    return (
        <div className={styles['color-config-wrapper']}>
            <div className={styles.left}>
                <FontIcon
                    name="icon-biaoqianicon"
                    className={styles.icon}
                    style={{ color: selectColor }}
                />
                <span className={styles.text}>{__('图标颜色')}</span>
            </div>
            <div className={styles.right}>
                {colorList.map((color) => (
                    <div
                        className={classnames(
                            styles['color-item'],
                            disabledColors.includes(color) &&
                                styles['color-item-disabled'],
                        )}
                        key={color}
                        style={{ backgroundColor: color }}
                        onClick={() => {
                            if (!disabledColors.includes(color)) {
                                handleClick(color)
                            }
                        }}
                    >
                        {(selectColor === color ||
                            disabledColors.includes(color)) && (
                            <FontIcon
                                type={IconType.COLOREDICON}
                                name="icon-duihao"
                                className={styles['selected-icon']}
                            />
                        )}
                    </div>
                ))}
            </div>
            <div className={styles['color-tip']}>
                {__('注：图标颜色不能重复使用')}
            </div>
        </div>
    )
}

export default ConfigColor
