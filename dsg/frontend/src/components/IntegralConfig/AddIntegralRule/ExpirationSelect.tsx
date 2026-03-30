import { FC, useEffect, useState } from 'react'
import { DatePicker, Radio, Tooltip } from 'antd'
import { QuestionCircleOutlined } from '@ant-design/icons'
import moment from 'moment'
import __ from '../locale'
import styles from './styles.module.less'

interface ExpirationSelectProps {
    value?: Array<number>
    onChange?: (value: Array<number | undefined>) => void
}

enum ExpirationType {
    FOREVER = 'forever',
    TIME = 'time',
}
const ExpirationSelect: FC<ExpirationSelectProps> = ({ value, onChange }) => {
    // 有效期
    const [expiration, setExpiration] = useState<Array<number | undefined>>([
        -1, -1,
    ])
    // 有效期类型
    const [expirationType, setExpirationType] = useState<ExpirationType>(
        ExpirationType.FOREVER,
    )

    useEffect(() => {
        if (value) {
            if (value[0] === -1 && value[1] === -1) {
                setExpirationType(ExpirationType.FOREVER)
            } else {
                setExpirationType(ExpirationType.TIME)
            }
            setExpiration(value)
        } else {
            setExpirationType(ExpirationType.FOREVER)
        }
    }, [value])

    return (
        <div>
            <Radio.Group
                value={expirationType}
                onChange={(e) => {
                    if (e.target.value === ExpirationType.FOREVER) {
                        onChange?.([-1, -1])
                    } else {
                        onChange?.([undefined, undefined])
                    }
                }}
            >
                <div className={styles.datePickerWrapper}>
                    <Radio value={ExpirationType.FOREVER}>
                        {__('永久有效')}
                    </Radio>
                    <Radio value={ExpirationType.TIME}>
                        <div className={styles.datePicker}>
                            <span>{__('有效期')}</span>
                            {expirationType === ExpirationType.TIME && (
                                <>
                                    <DatePicker
                                        value={
                                            expiration?.[0] &&
                                            expiration?.[0] !== -1
                                                ? moment(expiration[0])
                                                : undefined
                                        }
                                        disabledDate={(current) =>
                                            current.isBefore(
                                                moment().startOf('day'),
                                            )
                                        }
                                        onChange={(date) => {
                                            if (
                                                expiration[1] &&
                                                date?.isSameOrAfter(
                                                    moment(
                                                        expiration[1],
                                                    ).startOf('day'),
                                                )
                                            ) {
                                                onChange?.([
                                                    date?.valueOf(),
                                                    undefined,
                                                ])
                                            } else {
                                                onChange?.([
                                                    date?.valueOf(),
                                                    expiration[1],
                                                ])
                                            }
                                        }}
                                        className={styles.datePicker}
                                    />
                                    <span>-</span>
                                    <DatePicker
                                        value={
                                            expiration?.[1] &&
                                            expiration?.[1] !== -1
                                                ? moment(expiration[1])
                                                : undefined
                                        }
                                        disabledDate={(current) =>
                                            expiration?.[0] &&
                                            expiration[0] !== -1
                                                ? current.isBefore(
                                                      moment(
                                                          expiration[0],
                                                      ).startOf('day'),
                                                  )
                                                : current.isBefore(
                                                      moment(
                                                          new Date(),
                                                      ).startOf('day'),
                                                  )
                                        }
                                        onChange={(date) => {
                                            onChange?.([
                                                expiration[0],
                                                date?.valueOf(),
                                            ])
                                        }}
                                        className={styles.datePicker}
                                    />
                                    <Tooltip
                                        title={
                                            <div
                                                className={
                                                    styles.tooltipWrapper
                                                }
                                            >
                                                <div>{__('说明：')}</div>
                                                <div>
                                                    {__(
                                                        '1、开始日期和结束日期可以只选择一个。',
                                                    )}
                                                </div>
                                                <div>
                                                    {__(
                                                        '2、若只选择开始日期，不选择结束日期，规则在预设的开始日期生效。',
                                                    )}
                                                </div>
                                                <div>
                                                    {__(
                                                        '3、若只选择结束日期，不选择开始日期，规则在创建后开始生效，在预设的结束日期后失效，结束日期当天仍然有效。',
                                                    )}
                                                </div>
                                                <div>
                                                    {__(
                                                        '4、同时选择开始日期和结束日期，规则仅在选择的时间段内有效。',
                                                    )}
                                                </div>
                                            </div>
                                        }
                                        overlayInnerStyle={{
                                            color: 'rgba(0, 0, 0, 0.65)',
                                        }}
                                        overlayStyle={{
                                            maxWidth: 600,
                                        }}
                                        color="#fff"
                                    >
                                        <QuestionCircleOutlined
                                            className={styles.helperIcon}
                                        />
                                    </Tooltip>
                                </>
                            )}
                        </div>
                    </Radio>
                </div>
            </Radio.Group>
        </div>
    )
}

export default ExpirationSelect
