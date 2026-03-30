import { FC, useEffect } from 'react'
import { Rate } from 'antd'
import NumberInput from '@/ui/NumberInput'
import __ from '../locale'
import styles from './styles.module.less'

interface IntegralNumberInputProps {
    value?: Array<number>
    onChange?: (value: Array<number>) => void
    // 是否是目录评分
    isScoring?: boolean
}
const IntegralNumberInput: FC<IntegralNumberInputProps> = ({
    value,
    onChange,
    isScoring = false,
}) => {
    return isScoring ? (
        <div className={styles.integralRateInputWrapper}>
            {Array.from({ length: 5 }).map((_, index) => (
                <div className={styles.itemWrapper}>
                    <Rate
                        allowClear={false}
                        defaultValue={index + 1}
                        disabled
                        className={styles.rateWrapper}
                    />
                    <span>
                        {__('每有人打${index}星增加', { index: index + 1 })}
                    </span>
                    <NumberInput
                        value={value?.[index]?.toString()}
                        onChange={(curValue) => {
                            const newArray = value
                                ? [...value]
                                : [1, 1, 1, 1, 1]
                            newArray[index] = Number(curValue)
                            onChange?.([...newArray])
                        }}
                        min={0}
                        max={999999}
                        placeholder={__('请输入积分值')}
                        className={styles.numberInput}
                    />
                    <span>{__('分')}</span>
                </div>
            ))}
        </div>
    ) : (
        <div className={styles.integralNumberInputWrapper}>
            <span>{__('增加')}</span>
            <NumberInput
                value={value?.[0]?.toString()}
                onChange={(curValue) => {
                    onChange?.([Number(curValue)])
                }}
                placeholder={__('请输入积分值')}
                min={0}
                max={999999}
                className={styles.numberInput}
            />
            <span>{__('分')}</span>
        </div>
    )
}

export default IntegralNumberInput
