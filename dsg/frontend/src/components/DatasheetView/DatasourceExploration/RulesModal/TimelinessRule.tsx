import { Radio } from 'antd'
import { FC } from 'react'
import { TimelinessRuleList } from '../const'
import styles from './styles.module.less'

interface ITimelinessRule {
    value?: any
    onChange?: (o) => void
}

const TimelinessRule: FC<ITimelinessRule> = ({ value, onChange }) => {
    return (
        <div className={styles.TimelinessRuleWrapper}>
            <Radio.Group
                onChange={(e) => {
                    onChange?.(e?.target?.value)
                }}
                value={value}
            >
                {TimelinessRuleList.map((item) => (
                    <Radio key={item.value} value={item.value}>
                        {item.label}
                    </Radio>
                ))}
            </Radio.Group>
        </div>
    )
}

export default TimelinessRule
