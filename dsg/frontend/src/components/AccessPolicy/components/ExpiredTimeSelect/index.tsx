import { useEffect, useState } from 'react'
import { Button, DatePicker, Select } from 'antd'
import { noop } from 'lodash'
import moment from 'moment'
import __ from '../../locale'
import styles from './styles.module.less'

interface ExpiredTimeSelectProps {
    value?: string
    onChange?: (value: string | undefined | null) => void
    defaultSelectedTimeType?: ExpiredTimeType | null
}

enum ExpiredTimeType {
    CUSTOM = 'custom',
    FOREVER = 'forever',
}

const expiredTimeTypeOptions = [
    {
        label: __('永久有效'),
        value: ExpiredTimeType.FOREVER,
    },
    {
        label: __('具体时间'),
        value: ExpiredTimeType.CUSTOM,
    },
]

enum ExpiredTimeOption {
    ONE_DAY = 'one_day',
    THREE_DAYS = 'three_days',
    SEVEN_DAYS = 'seven_days',
    HALF_MONTH = 'half_month',
    ONE_MONTH = 'one_month',
    THREE_MONTHS = 'three_months',
    HALF_YEAR = 'half_year',
    ONE_YEAR = 'one_year',
}

const expiredTimeOptions = [
    {
        label: __('1天'),
        value: ExpiredTimeOption.ONE_DAY,
        days: 1,
    },
    {
        label: __('3天'),
        value: ExpiredTimeOption.THREE_DAYS,
        days: 3,
    },
    {
        label: __('7天'),
        value: ExpiredTimeOption.SEVEN_DAYS,
        days: 7,
    },
    {
        label: __('半个月'),
        value: ExpiredTimeOption.HALF_MONTH,
        days: 15,
    },
    {
        label: __('一个月'),
        value: ExpiredTimeOption.ONE_MONTH,
        days: 30,
    },
    {
        label: __('三个月'),
        value: ExpiredTimeOption.THREE_MONTHS,
        days: 90,
    },
    {
        label: __('半年'),
        value: ExpiredTimeOption.HALF_YEAR,
    },
    {
        label: __('一年'),
        value: ExpiredTimeOption.ONE_YEAR,
    },
]

/**
 * 时间选择组件
 * @param props
 * @returns
 */
const ExpiredTimeSelect = ({
    value,
    onChange = noop,
    defaultSelectedTimeType = ExpiredTimeType.FOREVER,
}: ExpiredTimeSelectProps) => {
    const [selectedTimeType, setSelectedTimeType] =
        useState<ExpiredTimeType | null>(defaultSelectedTimeType)
    const [expiredStatus, setExpiredStatus] = useState<boolean>(false)

    useEffect(() => {
        if (value) {
            setSelectedTimeType(ExpiredTimeType.CUSTOM)
        } else {
            setSelectedTimeType(defaultSelectedTimeType)
        }
    }, [defaultSelectedTimeType, value])

    useEffect(() => {
        if (value) {
            setExpiredStatus(moment(value).valueOf() < moment().valueOf())
        } else {
            setExpiredStatus(false)
        }
    }, [value])

    const calculateExpiredTime = (option: ExpiredTimeOption) => {
        const now = moment()
        switch (option) {
            case ExpiredTimeOption.ONE_DAY:
                return now.add(1, 'day').endOf('day').format()
            case ExpiredTimeOption.THREE_DAYS:
                return now.add(3, 'day').endOf('day').format()
            case ExpiredTimeOption.SEVEN_DAYS:
                return now.add(7, 'day').endOf('day').format()
            case ExpiredTimeOption.HALF_MONTH:
                return now.add(15, 'day').endOf('day').format()
            case ExpiredTimeOption.ONE_MONTH:
                return now.add(1, 'month').endOf('day').format()
            case ExpiredTimeOption.THREE_MONTHS:
                return now.add(3, 'month').endOf('day').format()
            case ExpiredTimeOption.HALF_YEAR:
                return now.add(6, 'month').endOf('day').format()
            case ExpiredTimeOption.ONE_YEAR:
                return now.add(1, 'year').endOf('day').format()
            default:
                return now.endOf('day').format()
        }
    }

    const getExtraFooter = () => {
        return (
            <div className={styles.extraFooterContainer}>
                {expiredTimeOptions.map((option) => (
                    <div key={option.value}>
                        <Button
                            type="link"
                            onClick={() =>
                                onChange(calculateExpiredTime(option.value))
                            }
                        >
                            {option.label}
                        </Button>
                    </div>
                ))}
            </div>
        )
    }
    return (
        <div className={styles.selectContainer}>
            <Select
                value={selectedTimeType}
                onChange={(currentType) => {
                    setSelectedTimeType(currentType)
                    if (currentType === ExpiredTimeType.FOREVER) {
                        onChange(undefined)
                    } else if (currentType === ExpiredTimeType.CUSTOM) {
                        onChange(moment().add(6, 'month').endOf('day').format())
                    } else if (selectedTimeType === null) {
                        onChange(null)
                    }
                }}
                options={expiredTimeTypeOptions}
                style={{ width: 120 }}
                allowClear={defaultSelectedTimeType === null}
                placeholder={__('请选择')}
            />
            {selectedTimeType === ExpiredTimeType.CUSTOM && (
                <DatePicker
                    value={
                        value
                            ? moment(value)
                            : moment().add(6, 'month').endOf('day')
                    }
                    onChange={(date) => {
                        onChange(date?.format() || '')
                    }}
                    renderExtraFooter={getExtraFooter}
                    format="YYYY/MM/DD HH:mm"
                    showNow={false}
                    showTime={{
                        format: 'HH:mm',
                    }}
                    allowClear={false}
                    disabledDate={(date) => date.isBefore(moment())}
                />
            )}
            <div className={styles.expiredStatus}>
                {expiredStatus ? __('已失效') : ''}
            </div>
        </div>
    )
}

export default ExpiredTimeSelect
