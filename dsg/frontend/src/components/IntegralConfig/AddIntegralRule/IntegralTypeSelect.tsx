import { FC } from 'react'
import { Tooltip } from 'antd'
import classnames from 'classnames'
import { CheckOutlined } from '@ant-design/icons'
import { IntegralType, IntegralTypeOptions } from '../const'
import styles from './styles.module.less'
import IntegralTypeIcon from '../IntegralTypeIcon'
import __ from '../locale'

interface IntegralTypeSelectProps {
    value?: string
    onChange?: (value: string) => void
    disabledTypes?: Array<string>
}
const IntegralTypeSelect: FC<IntegralTypeSelectProps> = ({
    value,
    onChange,
    disabledTypes = [],
}) => {
    return (
        <div className={styles.selectRuleWrapper}>
            {IntegralTypeOptions.map((item) => (
                <Tooltip
                    title={
                        disabledTypes.includes(item.value)
                            ? __('此类型下的规则已全部添加，不能重复添加')
                            : ''
                    }
                >
                    <div
                        key={item.value}
                        onClick={() => {
                            if (disabledTypes.includes(item.value)) {
                                return
                            }
                            onChange?.(item.value)
                        }}
                        className={classnames(
                            styles.selectRuleItem,
                            value === item.value && styles.selectedRuleItem,
                            disabledTypes.includes(item.value) &&
                                styles.disabledRuleItem,
                        )}
                    >
                        <IntegralTypeIcon
                            type={item.value as IntegralType}
                            style={{
                                fontSize: 20,
                            }}
                        />
                        <span>{item.label}</span>

                        {value === item.value && (
                            <div className={styles.selectedIcon}>
                                <CheckOutlined />
                            </div>
                        )}
                    </div>
                </Tooltip>
            ))}
        </div>
    )
}

export default IntegralTypeSelect
