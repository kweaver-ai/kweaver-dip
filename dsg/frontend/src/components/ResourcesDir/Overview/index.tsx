import { DatePicker, DatePickerProps, Select, Space, Tabs } from 'antd'
import moment from 'moment'
import { useEffect, useMemo, useState } from 'react'
import styles from './styles.module.less'
import __ from './locale'
import { OverviewTabKey, datePickerOptions } from './helper'
import Overview from './Overview'
import ClassficationStatics from './ClassficationStatics'

const { RangePicker } = DatePicker

const ResourcesDirOverview = () => {
    const [activeTabKey, setActiveTabKey] = useState(OverviewTabKey.OVERVIEW)
    const [datePickerValue, setDatePickerValue] =
        useState<DatePickerProps['picker']>('month')
    const nowDate = useMemo(() => {
        return moment()
    }, [])
    const MAX_MONTHS = 12 // 最大可选择月数

    const defaultDateValueList = {
        month: [
            moment().subtract(11, 'month').startOf('month'),
            moment().endOf('month'),
        ],
        quarter: [
            moment().subtract(7, 'quarter').startOf('quarter'),
            moment().endOf('quarter'),
        ],
        year: [
            moment().subtract(11, 'year').startOf('year'),
            moment().endOf('year'),
        ],
    }

    const [filterParams, setFilterParams] = useState<any>({
        // 默认近12个月
        date: defaultDateValueList.month,
    })

    useEffect(() => {
        setFilterParams({
            ...filterParams,
            type: datePickerValue,
            date: defaultDateValueList[datePickerValue || 'month'],
        })
    }, [datePickerValue])

    const tabItems = [
        {
            label: __('总览'),
            key: OverviewTabKey.OVERVIEW,
            // children: <div>1</div>,
        },
        {
            label: __('分类统计'),
            key: OverviewTabKey.CATEGORY_STATISTICS,
            // children: <div>1</div>,
        },
    ]

    const onDateChange = (date: any, dateString: any) => {
        let monthDates: any = []
        if (datePickerValue === 'month') {
            if (!date || date.length === 0) {
                setFilterParams({
                    ...filterParams,
                    date: defaultDateValueList[datePickerValue || 'month'],
                })
                return
            }

            const [start, end] = date

            // 计算两个日期之间的月数差
            const monthDiff = end.diff(start, 'months') + 1

            if (monthDiff > MAX_MONTHS) {
                // 如果超过12个月，自动调整结束日期
                const adjustedEnd = start.clone().add(MAX_MONTHS - 1, 'months')
                monthDates = [start, adjustedEnd]
            } else {
                monthDates = date
            }
        }
        setFilterParams({
            ...filterParams,
            date: monthDates?.length
                ? monthDates
                : date?.length
                ? [
                      date[0].startOf(datePickerValue),
                      date[1]?.endOf(datePickerValue || 'month'),
                  ]
                : defaultDateValueList[datePickerValue || 'month'],
        })
    }

    const diabledMonthDate = (current) => {
        // 限制选择超过36个月
        return current < moment().subtract(35, 'months') || current > moment()
    }

    const disabledQuarterDate = (current) => {
        // if (current > moment().endOf('quarter')) return false;
        // 现在季度选择超过8个季度
        return current < moment().subtract(7, 'quarter') || current > moment()
    }

    const disabledYearDate = (current) => {
        // if (current > moment().endOf('quarter')) return false;
        // 现在年度选择超过12个年度
        return current < moment().subtract(11, 'years') || current > moment()
    }

    const disabledDate = useMemo(() => {
        switch (datePickerValue) {
            case 'month':
                return diabledMonthDate
            case 'quarter':
                return disabledQuarterDate
            case 'year':
                return disabledYearDate
            default:
                return disabledYearDate
        }
    }, [datePickerValue])

    return (
        <div className={styles.rescCatlgOverview}>
            <div className={styles.overviewHeader}>
                <Tabs
                    items={tabItems}
                    activeKey={activeTabKey}
                    onChange={setActiveTabKey}
                    tabBarExtraContent={
                        activeTabKey === OverviewTabKey.CATEGORY_STATISTICS ? (
                            <Space size={16} className={styles.filterBox}>
                                <Select
                                    options={datePickerOptions}
                                    placeholder={__('请选择')}
                                    value={datePickerValue}
                                    onChange={setDatePickerValue}
                                />

                                <RangePicker
                                    value={filterParams.date}
                                    picker={datePickerValue}
                                    style={{ width: 237 }}
                                    disabledDate={disabledDate}
                                    onChange={onDateChange}
                                />
                            </Space>
                        ) : undefined
                    }
                />
            </div>

            {activeTabKey === OverviewTabKey.OVERVIEW && <Overview />}
            {activeTabKey === OverviewTabKey.CATEGORY_STATISTICS && (
                <ClassficationStatics dateParams={filterParams} />
            )}
        </div>
    )
}

export default ResourcesDirOverview
