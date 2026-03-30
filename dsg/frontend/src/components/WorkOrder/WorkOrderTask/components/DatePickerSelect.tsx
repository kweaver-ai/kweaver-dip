import * as React from 'react'
import { useState } from 'react'
import { DatePicker } from 'antd'
import { useGetState } from 'ahooks'
import moment from 'moment'
import classnames from 'classnames'
import styles from './styles.module.less'

interface DatePickerSelectType {
    overdue?: string
    date: any
    disabled?: boolean
    onChange: (date: any, dateString: string) => void
}

const DatePickerSelect = ({
    date,
    onChange,
    overdue,
    disabled = false,
}: DatePickerSelectType) => {
    const [datePickerBoder, setDatePickerBoder] = useState<string>('')
    const [dateOpenStatus, setDateOpenStatus, getDateOpenStatus] =
        useGetState<boolean>(false)

    const [dateHidden, setDateHidden] = useState<boolean>(true)

    return (
        <div
            className={classnames({
                [styles.dataPicker]: !disabled,
                [styles.dataPickerDisabled]: disabled,
            })}
            style={datePickerBoder ? { border: datePickerBoder } : {}}
            onClick={(e) => {
                e.stopPropagation()
                if (!dateOpenStatus) {
                    if (disabled) return
                    setDateOpenStatus(true)
                    setDatePickerBoder('1px solid #126EE3')
                    setDateHidden(false)
                }
            }}
        >
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    width: 100,
                    fontSize: 14,
                    height: 26,
                    background: 'rgba(0,0,0,0.04)',
                    borderRadius: '14px',
                    border: 0,
                    boxShadow: 'none',
                    alignItems: 'center',
                    color:
                        overdue === 'overdue' ? '#F5222D' : 'rgba(0,0,0,0.65)',
                }}
                hidden={!dateHidden}
            >
                {date.format('YYYY-MM-DD')}
            </div>

            <div hidden={dateHidden}>
                <DatePicker
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        width: 100,
                        height: 26,
                        background: 'rgba(0,0,0,0.04)',
                        borderRadius: '14px',
                        border: 0,
                        boxShadow: 'none',
                    }}
                    key={date}
                    open={dateOpenStatus}
                    autoFocus
                    defaultValue={date}
                    inputReadOnly
                    placement="bottomRight"
                    allowClear={false}
                    suffixIcon={null}
                    disabledDate={(current) => {
                        return current < moment().startOf('day')
                    }}
                    onOpenChange={(open) => {
                        if (open) {
                            setDateOpenStatus(true)
                            setDatePickerBoder('1px solid #126EE3')
                            setDateHidden(false)
                        } else {
                            setDateOpenStatus(false)
                            setDatePickerBoder('')
                            setDateHidden(true)
                        }
                    }}
                    onChange={(selectDate, dateString) => {
                        setDateOpenStatus(false)
                        setDatePickerBoder('')
                        setDateHidden(true)
                        onChange(selectDate, dateString)
                    }}
                />
            </div>
        </div>
    )
}

export default DatePickerSelect
