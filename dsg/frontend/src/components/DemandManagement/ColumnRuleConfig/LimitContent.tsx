import React, { ReactNode, useEffect, useMemo, useState } from 'react'
import { Input, Select, DatePicker } from 'antd'
import __ from '../locale'
import styles from './styles.module.less'
import { FieldTypes, LimitContentType, getLimitContentType } from './const'

const { RangePicker } = DatePicker
/**
 * @param {isExistData} 数据表库表是否存在数据
 */
interface ILimitContent {
    value?: any
    width: number
    onChange?: (val: any) => void
    fieldInfo?: any
    condition?: string
    isExistData: boolean
}
const LimitContent: React.FC<ILimitContent> = ({
    value,
    onChange,
    width,
    fieldInfo,
    condition,
    isExistData,
}) => {
    const [data, setData] = useState<any>()
    const [options, setOptions] = useState([
        {
            id: '1',
            name: '黑龙江省',
            rate: '35',
            label: (
                <div className={styles['probe-option-label']}>
                    <div className={styles.name}>
                        <div
                            className={styles['rate-process']}
                            style={{
                                width: 'calc(100% * 0.35)',
                            }}
                        >
                            黑龙江省
                        </div>
                    </div>
                    <div className={styles.rate}>35%</div>
                </div>
            ),
            value: '1',
        },
        {
            id: '2',
            name: '山东省',
            rate: '35',
            label: (
                <div className={styles['probe-option-label']}>
                    <div className={styles.name}>
                        <div
                            className={styles['rate-process']}
                            style={{
                                width: 'calc(100% * 0.85)',
                            }}
                        >
                            山东省
                        </div>
                    </div>
                    <div className={styles.rate}>85%</div>
                </div>
            ),
            value: '2',
        },
        {
            id: '3',
            name: '辽宁省',
            rate: '30',
            label: (
                <div className={styles['probe-option-label']}>
                    <div className={styles.name}>
                        <div
                            className={styles['rate-process']}
                            style={{
                                width: 'calc(100% * 0.05)',
                            }}
                        >
                            辽宁省
                        </div>
                    </div>
                    <div className={styles.rate}>35%</div>
                </div>
            ),
            value: '3',
        },
    ])

    const contenType: LimitContentType = useMemo(() => {
        return getLimitContentType(fieldInfo, condition)
    }, [fieldInfo, condition])

    useEffect(() => {
        // TODO: 根据字段（类型）变化判断是否需要调接口查样例数据（未开启探查） || 探查数据 （开启探查）
    }, [fieldInfo, condition])

    useEffect(() => {
        setData(value)
    }, [value])

    const renderProbeDropdown = (originNode: ReactNode) => {
        return (
            <div className={styles['probe-dropdown']}>
                <div className={styles['probe-title']}>
                    <span>{__('数据探查结果：')}</span>
                    <span>
                        {__('共')}&nbsp;
                        <span className={styles.count}>{options.length}</span>
                        &nbsp;{__('条')}
                    </span>
                </div>
                {originNode}
            </div>
        )
    }

    const renderSampleDropdown = (originNode: ReactNode) => {
        return (
            <div className={styles['probe-dropdown']}>
                <div className={styles['probe-title']}>
                    <span>{__('样例数据展示：')}</span>
                </div>
                {originNode}
            </div>
        )
    }
    return (
        <div className={styles['limit-content-wrapper']}>
            {isExistData ? (
                // 开启探查
                contenType === LimitContentType.Porbe ? (
                    <Select
                        style={{ width }}
                        placeholder={__('限定内容')}
                        value={data}
                        onChange={(e) => {
                            setData(e)
                            onChange?.(e)
                        }}
                        options={options}
                        dropdownRender={renderProbeDropdown}
                        getPopupContainer={(node) => node.parentNode}
                    />
                ) : contenType === LimitContentType.Sample ? (
                    <Select
                        style={{ width }}
                        placeholder={__('限定内容')}
                        value={data}
                        onChange={(e) => onChange?.(e)}
                        options={options}
                        fieldNames={{ label: 'name', value: 'id' }}
                        getPopupContainer={(node) => node.parentNode}
                        dropdownRender={renderSampleDropdown}
                    />
                ) : contenType === LimitContentType.DateTime ? (
                    <RangePicker
                        showTime={{ format: 'HH:mm' }}
                        format="YYYY-MM-DD HH:mm"
                        style={{ width }}
                        onChange={(e) => onChange?.(e)}
                        renderExtraFooter={() =>
                            '探查出开始日期：2021-12-31 21:25'
                        }
                        getPopupContainer={(node) =>
                            node.parentNode as HTMLElement
                        }
                    />
                ) : (
                    <Input
                        value={data}
                        onChange={(e) => onChange?.(e.target.value)}
                        placeholder={__('限定内容')}
                        style={{ width }}
                    />
                )
            ) : (
                <Input
                    value={data}
                    onChange={(e) => onChange?.(e.target.value)}
                    placeholder={__('限定内容')}
                    style={{ width }}
                />
            )}
        </div>
    )
}

export default LimitContent
