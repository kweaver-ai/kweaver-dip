import { DatePicker, Dropdown } from 'antd'
import { memo, useEffect, useState } from 'react'
import moment from 'moment'
import { CloseOutlined, DownOutlined, UpOutlined } from '@ant-design/icons'
import { useUpdateEffect } from 'ahooks'
import __ from '../../locale'
import styles from './styles.module.less'
import { disabledDate } from '@/components/MyAssets/helper'

const { RangePicker } = DatePicker

export type IConditions = {
    onlineTime?: any
}

/** 筛选条件 */
const FilterLine = ({ onChange }: any) => {
    const [conditions, setConditions] = useState<IConditions>()
    const [timeTitle, setTimeTitle] = useState<string>(__('上线时间'))
    const [openDropdown, setOpenDropdown] = useState<boolean>(false)
    const [showClear, setShowClear] = useState<boolean>(false)
    const [onlineTime, setOnlineTime] = useState<any>()

    useUpdateEffect(() => {
        onChange?.(conditions)
    }, [conditions])

    const handleChangeItem = (type: keyof IConditions, value: any) => {
        setConditions((prev) => ({ ...prev, [type]: value }))
    }

    const handleChangeTime = (val, dateString) => {
        setOnlineTime(val)
        const timeObj: any = {
            start_time: null,
            end_time: null,
        }
        const [startStr, endStr] = dateString
        if (val && endStr) {
            timeObj.start_time = moment(`${startStr} 00:00:00`).valueOf()
            timeObj.end_time = moment(`${endStr} 23:59:59`).valueOf()
            setTimeTitle(`${__('上线时间')}：${startStr} ${__('至')} ${endStr}`)
            setShowClear(true)
            handleChangeItem('onlineTime', timeObj)
        } else if (!val) {
            setTimeTitle(__('上线时间'))
            setShowClear(false)
            handleChangeItem('onlineTime', undefined)
        }
    }

    const handleClear = () => {
        setShowClear(false)
        setConditions(undefined)
        setOnlineTime(undefined)
        setTimeTitle(__('上线时间'))
    }

    const handleRangePickerBlur = () => {
        const timeValue = onlineTime
        if (!timeValue) {
            return
        }
        // 当天结束时间-时间戳
        const curDateTimeStamp = moment().endOf('day').valueOf()
        if (timeValue[0] && !timeValue[1]) {
            const end_time = moment(curDateTimeStamp)
            setOnlineTime([timeValue[0], end_time])

            const stStr = moment(timeValue[0])?.format('yyyy-MM-DD')
            const etStr = moment(end_time)?.format('yyyy-MM-DD')
            const timeObj: any = {
                start_time: moment(`${stStr} 00:00:00`).valueOf(),
                end_time: moment(curDateTimeStamp).valueOf(),
            }

            setTimeTitle(`${__('上线时间')}：${stStr} ${__('至')} ${etStr}`)
            setShowClear(true)
            handleChangeItem('onlineTime', timeObj)
        }
        if (!timeValue[0] && timeValue[1]) {
            const etStr = moment(timeValue[1])?.format('yyyy-MM-DD')
            setTimeTitle(`${__('上线时间')}：${etStr}${__('之前')}`)
            setShowClear(true)
        }
    }

    const filterContent = () => {
        return (
            <div className={styles['filter-item']}>
                <RangePicker
                    placeholder={[__('开始时间'), __('结束时间')]}
                    value={onlineTime}
                    onChange={handleChangeTime}
                    disabledDate={(current: any) => disabledDate(current, {})}
                    allowEmpty={[true, true]}
                    onBlur={handleRangePickerBlur}
                />
            </div>
        )
    }

    const items = [
        {
            key: 'onlineTime',
            label: filterContent(),
        },
    ]

    return (
        <div className={styles['filter-line']}>
            <div className={styles['filter-line-wrapper']}>
                <Dropdown
                    menu={{
                        items,
                    }}
                    trigger={['click']}
                    onOpenChange={(flag) => setOpenDropdown(flag)}
                    open={openDropdown}
                    placement="bottomLeft"
                    overlayClassName={styles['filter-line-wrapper-dropdown']}
                    getPopupContainer={(node) => node.parentElement || node}
                >
                    <span
                        className={styles['filter-line-wrapper-time']}
                        title={timeTitle}
                    >
                        <span
                            className={styles['filter-line-wrapper-time-title']}
                        >
                            {timeTitle}
                        </span>
                        <span className={styles['filter-line-wrapper-icon']}>
                            {openDropdown ? <UpOutlined /> : <DownOutlined />}
                        </span>
                    </span>
                </Dropdown>
            </div>
            {showClear && (
                <div
                    className={styles['is-clear']}
                    onClick={() => handleClear()}
                >
                    <CloseOutlined className={styles['is-clear-icon']} />
                    {__('清除条件')}
                </div>
            )}
        </div>
    )
}

export default memo(FilterLine)
